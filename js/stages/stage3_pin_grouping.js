/**
 * Stage 3: 시퀀스 도면 핀번호 부여 및 전위 그루핑 엔진 (Pin Numbering & Grouping)
 * - 시퀀스 회로도 인터랙티브 SVG 오버레이 (1753 x 1240 픽셀 기준)
 * - 부품별(EOCR, MC1, MC2, X, FR, T, FLS, 단자대) 핀번호 기입 시뮬레이션
 * - 동그라미 전위 그루핑(①~⑮) 하이라이트 및 4단계 보조회로 배선 순서 연동
 */
import { getAudioContext } from '../components/audio.js';

/**
 * 시퀀스 도면 핀번호 뱃지 마크업 (3단계 화면과 4단계 왼쪽 미니 도면에서 공용)
 * - 도면 기호·글자를 가리지 않도록 접점 종류(orientation)별 위치 규칙 적용
 */
export function pinBadgeMarkup(p) {
  let pinHtml = '';

  if (p.orientation === 'horizontal') {
    // [사용자 핵심 지시] EOCR 첫 번째 열동계 b접점:
    // 중앙 'EOCR' 글자와 'o - x - o' 기호를 가리지 않도록 좌우 단자 위쪽 여백으로 벌려 배치!
    const lx = p.leftX || (p.x - 60);
    const rx = p.rightX || (p.x + 55);
    const by = p.badgeY || (p.y - 28);
    pinHtml = `
      <!-- 좌측 10번 뱃지 (EOCR 글자 좌측 단자 위) -->
      <g transform="translate(${lx}, ${by})">
        <rect x="0" y="0" width="28" height="22" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <text x="14" y="16" font-size="14" fill="#dc2626" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">${p.left}</text>
      </g>
      <!-- 우측 4번 뱃지 (EOCR 글자 우측 단자 위) -->
      <g transform="translate(${rx}, ${by})">
        <rect x="0" y="0" width="26" height="22" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <text x="13" y="16" font-size="14" fill="#dc2626" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">${p.right}</text>
      </g>
    `;
  } else if (p.orientation === 'vertical_exact') {
    // [OpenCV 실측 기반] 상하단 단자 동그라미(o) 옆에 1:1 완벽 정렬 (리밋스위치 1-1 등 긴 번호는 뱃지를 넓게)
    const bw = (t) => Math.max(28, String(t).length * 9 + 8);
    pinHtml = `
      <!-- 상단 핀번호 -->
      <g transform="translate(${p.topX}, ${p.topY})">
        <rect x="0" y="0" width="${bw(p.top)}" height="22" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <text x="${bw(p.top) / 2}" y="16" font-size="14" fill="#dc2626" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">${p.top}</text>
      </g>
      <!-- 하단 핀번호 -->
      <g transform="translate(${p.botX}, ${p.botY})">
        <rect x="0" y="0" width="${bw(p.bot)}" height="22" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <text x="${bw(p.bot) / 2}" y="16" font-size="14" fill="#dc2626" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">${p.bot}</text>
      </g>
    `;
  } else if (p.orientation === 'fls_coil_exact') {
    pinHtml = `
      <!-- FLS 좌측 상단 5번 핀번호 -->
      <g transform="translate(${p.x - 42}, ${p.y - 32})">
        <rect x="0" y="0" width="28" height="22" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <text x="14" y="16" font-size="14" fill="#dc2626" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">${p.top}</text>
      </g>
      <!-- FLS 좌측 하단 6번 핀번호 -->
      <g transform="translate(${p.x - 42}, ${p.y + 14})">
        <rect x="0" y="0" width="28" height="22" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <text x="14" y="16" font-size="14" fill="#dc2626" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">${p.bot}</text>
      </g>
    `;
  } else if (p.orientation === 'coil_exact') {
    pinHtml = `
      <!-- 코일 상단 전원 핀번호 -->
      <g transform="translate(${p.x - 36}, ${p.y - 36})">
        <rect x="0" y="0" width="28" height="22" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <text x="14" y="16" font-size="14" fill="#dc2626" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">${p.top}</text>
      </g>
      <!-- 코일 하단 전원 핀번호 -->
      <g transform="translate(${p.x - 36}, ${p.y + 12})">
        <rect x="0" y="0" width="28" height="22" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <text x="14" y="16" font-size="14" fill="#dc2626" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">${p.bot}</text>
      </g>
    `;
  } else if (p.orientation === 'electrode') {
    // [사용자 핵심 지시] FLS 7, 8, 1 전극 단자는 왼쪽으로 한 칸 이동하여 3개 세로선에 정확히 일치
    pinHtml = `
      <g transform="translate(${p.x}, ${p.y})">
        <rect x="0" y="0" width="22" height="22" rx="4" fill="#ffffff" stroke="#2563eb" stroke-width="2" />
        <text x="11" y="16" font-size="14" fill="#2563eb" font-weight="900" text-anchor="middle">${p.e1}</text>
        <rect x="23" y="0" width="22" height="22" rx="4" fill="#ffffff" stroke="#2563eb" stroke-width="2" />
        <text x="34" y="16" font-size="14" fill="#2563eb" font-weight="900" text-anchor="middle">${p.e2}</text>
        <rect x="46" y="0" width="22" height="22" rx="4" fill="#ffffff" stroke="#2563eb" stroke-width="2" />
        <text x="57" y="16" font-size="14" fill="#2563eb" font-weight="900" text-anchor="middle">${p.e3}</text>
      </g>
    `;
  } else {
    // 일반 세로 접점 기본 폴백
    pinHtml = `
      <!-- 접점 상단 핀번호 -->
      <g transform="translate(${p.x - 36}, ${p.y - 48})">
        <rect x="0" y="0" width="28" height="22" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <text x="14" y="16" font-size="14" fill="#dc2626" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">${p.top}</text>
      </g>
      <!-- 접점 하단 핀번호 -->
      <g transform="translate(${p.x - 36}, ${p.y + 26})">
        <rect x="0" y="0" width="28" height="22" rx="4" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <text x="14" y="16" font-size="14" fill="#dc2626" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">${p.bot}</text>
      </g>
    `;
  }
  return pinHtml;
}

export class Stage3PinGrouping {
  constructor(container, problemData) {
    this.container = container;
    this.problem = problemData;
    this.speed = 1.0;
    this.currentGroup = null;
    this.isPinsRevealed = false;
    this.audioContext = null;
    this.runToken = 0; // 자동 시연 취소용 토큰 (사용자 클릭 시 진행 중 시연 중단)
    this.init();
  }

  init() {
    this.setupAudio();
    this.render();
  }

  setupAudio() {
    this.audioContext = getAudioContext();
  }

  playPenSound(freq = 700, duration = 0.05) {
    if (!this.audioContext) return;
    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      // ignore
    }
  }

  /**
   * 15개 보조회로 그룹별 도면 선로 완전 일치 좌표 패스 (실측 픽셀)
   */
  getGroupPaths() {
    // 전위 그룹별 도면 경로는 문제 데이터에 있음 (7단계 동작 테스트와 공유)
    return this.problem.board.sequenceCircuit.groupPaths;
  }

  render() {
    const { sequenceCircuit } = this.problem.board;
    const { groups } = sequenceCircuit;

    this.container.innerHTML = `
      <div class="stage3-sequence-wrapper" style="display: flex; flex-direction: column; width: 100%; height: 100%; gap: 12px;">
        
        <!-- 상단 전위 그루핑 칩 바 + FLS 전극 최우선 결선 가이드 -->
        <div class="grouping-chips-bar" style="display: flex; flex-wrap: wrap; gap: 6px; background: rgba(15,23,42,0.8); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); align-items: center;">
          <!-- [사용자 핵심 지시] FLS 전극 최우선 결선 특별 가이드 버튼 -->
          <button id="btn-fls-prewire" style="
            background: linear-gradient(135deg, #1e3a8a, #2563eb);
            border: 1px solid #60a5fa;
            color: #ffffff;
            font-size: 11px;
            font-weight: 900;
            padding: 4px 10px;
            border-radius: 14px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 2px 8px rgba(37,99,235,0.4);
            transition: all 0.2s;
            ${this.problem.board.sequenceCircuit.flsPreWiring ? '' : 'display: none;'}
          ">
            <span>⚡ [최우선 결선] FLS 7·8·1 ➜ E1·E2·E3</span>
          </button>
          <span style="height: 16px; width: 1px; background: rgba(255,255,255,0.2); margin: 0 4px;"></span>
          <span style="font-size: 12px; font-weight: 800; color: #38bdf8; margin-right: 4px;">보조회로 그루핑:</span>
          ${groups.map(g => `
            <button class="group-chip-btn" data-group="${g.num}" style="
              background: rgba(30,41,59,0.9);
              border: 1px solid ${g.color};
              color: #ffffff;
              font-size: 11px;
              font-weight: 800;
              padding: 4px 8px;
              border-radius: 14px;
              cursor: pointer;
              transition: all 0.2s;
              display: inline-flex;
              align-items: center;
              gap: 4px;
            ">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${g.color};"></span>
              <span>${g.name.split(' ')[0]}</span>
            </button>
          `).join('')}
          <button id="btn-group-show-all" style="
            background: linear-gradient(135deg, #0284c7, #2563eb);
            border: none;
            color: #fff;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 14px;
            cursor: pointer;
            margin-left: auto;
          ">전체 보기</button>
        </div>

        <!-- 메인 인터랙티브 시퀀스 회로도 뷰어 (1753 x 1240 좌표계 1:1 완벽 고정) -->
        <div class="sequence-svg-container" style="position: relative; flex: 1; min-height: 560px; background: #0b1120; border-radius: 8px; overflow: auto; border: 1px solid #1e293b; display: flex; justify-content: center; align-items: center; padding: 10px;">
          <svg id="sequence-overlay-svg" viewBox="0 0 1753 1240" style="width: 100%; max-width: 1250px; height: auto; max-height: 84vh; display: block; background: #ffffff; border-radius: 6px; box-shadow: 0 4px 24px rgba(0,0,0,0.6);">
            <!-- 1. 원본 도면 이미지 (1753 x 1240) -->
            <image href="${this.problem.assets?.sequence || 'assets/images/sequence_diagram.png'}" x="0" y="0" width="1753" height="1240" />
            
            <!-- 2. 동그라미 전위 그루핑 형광펜 하이라이트 레이어 -->
            <g id="seq-groups-layer"></g>

            <!-- 3. 실기 도면 공통선(COM) 녹색 타원 뱃지 레이어 -->
            <g id="seq-common-layer">${this.commonBadgesMarkup()}            </g>

            <!-- 4. 네임펜 손글씨 핀번호 뱃지 레이어 -->
            <g id="seq-pins-layer"></g>
          </svg>
        </div>

        <!-- 하단 선택된 그루핑 상세 정보 카드 -->
        <div id="group-detail-card" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(56,189,248,0.3); border-left: 4px solid #38bdf8; border-radius: 6px; padding: 12px 16px; color: #e2e8f0; font-size: 13px; line-height: 1.5;">
          💡 <b>[3단계 실기 요령]</b> 위의 <b>'핀번호 전체 쓰기'</b>를 누르면 각 기구 접점마다 빨간색 네임펜 핀번호가 기호를 가리지 않고 정확히 기입됩니다. 상단의 <b>동그라미 그루핑(①~${this.circled(groups.length)})</b>과 <b>[최우선 결선 FLS]</b>를 클릭하여 결선 순서를 미리 확인하세요!
        </div>
      </div>
    `;

    this.bindEvents();
    // 처음에는 빈 도면 (핀번호·공통 표시 없이) — 직접 매겨 본 뒤 '핀번호 전체 쓰기'·시연으로 확인
    const commonLayer = document.getElementById('seq-common-layer');
    if (commonLayer) commonLayer.style.display = 'none';
    this.isPinsRevealed = false;
  }

  bindEvents() {
    // FLS 최우선 결선 가이드 버튼
    // 사용자가 직접 클릭하면 진행 중인 자동 시연은 중단(runToken 증가)
    this.container.querySelector('#btn-fls-prewire')?.addEventListener('click', () => {
      this.runToken++;
      this.selectFlsPreWire();
    });

    // 그루핑 칩 버튼 클릭
    this.container.querySelectorAll('.group-chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.runToken++;
        const groupNum = parseInt(btn.dataset.group, 10);
        this.selectGroup(groupNum);
      });
    });

    this.container.querySelector('#btn-group-show-all')?.addEventListener('click', () => {
      this.runToken++;
      this.showAllGroups();
    });
  }

  /**
   * [사용자 핵심 지시] FLS 7·8·1 ➜ E1·E2·E3 주회로 직후 최우선 결선 가이드
   */
  selectFlsPreWire() {
    const { flsPreWiring } = this.problem.board.sequenceCircuit;
    if (!flsPreWiring) return;

    this.currentGroup = 'fls-prewire';

    // 칩 스타일 초기화 및 FLS 버튼 강조
    this.container.querySelectorAll('.group-chip-btn').forEach(b => {
      b.style.background = 'rgba(30,41,59,0.9)';
      b.style.color = '#ffffff';
      b.style.transform = 'none';
      b.style.boxShadow = 'none';
    });
    const flsBtn = this.container.querySelector('#btn-fls-prewire');
    if (flsBtn) {
      flsBtn.style.transform = 'scale(1.08)';
      flsBtn.style.boxShadow = '0 0 12px #3b82f6';
    }

    // 하단 상세 카드 업데이트
    const detailCard = document.getElementById('group-detail-card');
    if (detailCard) {
      detailCard.style.borderLeftColor = flsPreWiring.color;
      detailCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 15px; font-weight: 900; color: #60a5fa;">${flsPreWiring.name}</span>
          <span style="font-size: 11px; background: rgba(37,99,235,0.3); border: 1px solid #3b82f6; padding: 2px 8px; border-radius: 4px; color: #93c5fd;">보조회로 1번 전 최우선 실행!</span>
        </div>
        <div style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
          ${flsPreWiring.guideHtml}
        </div>
        <div style="margin-top: 6px; color: #38bdf8; font-weight: bold; font-size: 12.5px;">
          📍 결선선로: FLS 7번 ➜ TB4 11번(E1), FLS 8번 ➜ TB4 12번(E2), FLS 1번 ➜ TB4 13번(E3)
        </div>
      `;
    }

    // 형광펜 하이라이트 레이어 갱신 (FLS 전극선 파란색 경로)
    const layer = document.getElementById('seq-groups-layer');
    if (layer) {
      layer.innerHTML = '';
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', flsPreWiring.path);
      path.setAttribute('stroke', flsPreWiring.color);
      path.setAttribute('stroke-width', '20');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0.65');
      path.setAttribute('class', 'group-fluorescent-highlight');
      layer.appendChild(path);
    }

    this.updateGuideMessage(`⚡ <b>[주회로 직후 최우선 결선]</b><br>주회로가 끝나면 다른 보조회로 결선에 앞서 <b>가장 먼저 FLS 7·8·1번에서 TB4 E1·E2·E3로 3가닥을 직결</b>하세요!<br><span style="color: #60a5fa; font-size: 12px;">이 사전 결선을 끝내두어야 이후 ${this.problem.board.sequenceCircuit.groups.length}개 보조회로 릴레이 배선 시 간섭이 전혀 없습니다.</span>`);

    this.playPenSound(880, 0.08);
  }

  /**
   * 시퀀스 도면 접점 핀번호 뱃지 렌더링 (1753 x 1240 해상도 맞춤)
   * - [사용자 핵심 지침] 도면의 기호, 글자, 선로를 절대 가리지 않도록 모든 세로 접점은 세로선 좌측 여백에 배치
   * - 콤팩트하고 시인성 높은 네임펜 뱃지 디자인 적용
   */
  renderPinBadges(animated = false) {
    const pinsLayer = document.getElementById('seq-pins-layer');
    if (!pinsLayer) return;
    pinsLayer.innerHTML = '';
    const commonLayer = document.getElementById('seq-common-layer');
    if (commonLayer) commonLayer.style.display = '';   // 연습 모드에서 숨긴 공통 표시도 다시

    const { pinPlacements } = this.problem.board.sequenceCircuit;

    pinPlacements.forEach((p, idx) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'seq-pin-item');
      g.setAttribute('id', p.id);

      const pinHtml = pinBadgeMarkup(p);

      g.innerHTML = pinHtml;
      pinsLayer.appendChild(g);

      if (animated) {
        g.style.opacity = '0';
        g.style.transform = 'scale(0.5)';
        g.style.transition = 'all 0.2s ease-out';
        setTimeout(() => {
          g.style.opacity = '1';
          g.style.transform = 'scale(1)';
          this.playPenSound(600 + (idx % 6) * 50, 0.04);
        }, idx * (120 / this.speed));
      }
    });

    this.isPinsRevealed = true;
  }

  /**
   * 특정 동그라미 그루핑(num) 선택
   */
  selectGroup(num) {
    const { groups } = this.problem.board.sequenceCircuit;
    const group = groups.find(g => g.num === num);
    if (!group) return;

    this.currentGroup = num;

    // FLS 최우선 결선 버튼 강조 해제
    const flsBtn = this.container.querySelector('#btn-fls-prewire');
    if (flsBtn) {
      flsBtn.style.transform = 'none';
      flsBtn.style.boxShadow = '0 2px 8px rgba(37,99,235,0.4)';
    }

    // 칩 활성화 상태 토글
    this.container.querySelectorAll('.group-chip-btn').forEach(b => {
      const gNum = parseInt(b.dataset.group, 10);
      if (gNum === num) {
        b.style.background = group.color;
        b.style.color = '#ffffff';
        b.style.transform = 'scale(1.08)';
        b.style.boxShadow = `0 0 8px ${group.color}`;
      } else {
        b.style.background = 'rgba(30,41,59,0.9)';
        b.style.color = '#ffffff';
        b.style.transform = 'none';
        b.style.boxShadow = 'none';
      }
    });

    // 하단 상세 카드 업데이트
    const detailCard = document.getElementById('group-detail-card');
    if (detailCard) {
      detailCard.style.borderLeftColor = group.color;
      detailCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 15px; font-weight: 900; color: ${group.color};">${group.name}</span>
          <span style="font-size: 11px; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; color: #94a3b8;">${group.nodes.length}개 단자 묶음</span>
        </div>
        <div style="color: #38bdf8; font-weight: bold; margin-bottom: 4px; font-size: 13.5px;">
          📍 제어판 결선 순서 (4단계와 동일): ${group.loopOrder}
        </div>
        <div style="color: #cbd5e1; font-size: 12.5px;">
          💡 ${group.tip}
        </div>
      `;
    }

    // 형광펜 하이라이트 레이어 갱신
    this.renderGroupHighlight(group);

    // 좌측 실기 꿀팁 박스도 연동
    this.updateGuideMessage(`🎯 <b>[3단계 그루핑: ${group.name}]</b><br><b>루핑 순서</b>: ${group.loopOrder}<br><span style="color: #facc15; font-size: 12px; margin-top: 4px; display: inline-block;">${group.tip}</span>`);

    this.playPenSound(720, 0.08);
  }

  /**
   * 도면 위에 실기 형광펜 마킹(그루핑) 오버레이 렌더링 (OpenCV 실측 좌표 100% 일치)
   */
  renderGroupHighlight(group) {
    const layer = document.getElementById('seq-groups-layer');
    if (!layer) return;
    layer.innerHTML = '';

    const groupPaths = this.getGroupPaths();
    const d = groupPaths[group.num];
    if (d) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', group.color);
      path.setAttribute('stroke-width', '20');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0.45');
      path.setAttribute('class', 'group-fluorescent-highlight');
      layer.appendChild(path);
    }
  }

  showAllGroups() {
    this.container.querySelectorAll('.group-chip-btn').forEach(b => {
      b.style.background = 'rgba(30,41,59,0.9)';
      b.style.color = '#ffffff';
      b.style.transform = 'none';
      b.style.boxShadow = 'none';
    });
    const flsBtn = this.container.querySelector('#btn-fls-prewire');
    if (flsBtn) {
      flsBtn.style.transform = 'none';
      flsBtn.style.boxShadow = '0 2px 8px rgba(37,99,235,0.4)';
    }

    const detailCard = document.getElementById('group-detail-card');
    if (detailCard) {
      detailCard.style.borderLeftColor = '#38bdf8';
      detailCard.innerHTML = `
        <div style="font-weight: 800; color: #38bdf8; margin-bottom: 4px; font-size: 14px;">
          🌈 총 ${this.problem.board.sequenceCircuit.groups.length}개 핵심 보조회로 전위 그루핑 (Grouping ① ~ ${this.circled(this.problem.board.sequenceCircuit.groups.length)})
        </div>
        <div style="color: #cbd5e1; font-size: 12.5px;">
          위의 번호 칩을 클릭하면 해당 노드로 연결되는 모든 단자와 4단계 보조회로 최단거리 배선 경로를 볼 수 있습니다. (FLS 전극선은 상단 파란색 [최우선 결선] 버튼으로 확인)
        </div>
      `;
    }

    const layer = document.getElementById('seq-groups-layer');
    if (!layer) return;
    layer.innerHTML = '';

    const { groups } = this.problem.board.sequenceCircuit;
    const groupPaths = this.getGroupPaths();

    groups.forEach(g => {
      const d = groupPaths[g.num];
      if (d) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', g.color);
        path.setAttribute('stroke-width', '14');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', '0.4');
        path.setAttribute('class', 'group-fluorescent-highlight');
        layer.appendChild(path);
      }
    });

    this.updateGuideMessage(`🌈 <b>[총 ${groups.length}개 전위 그루핑 전체 보기]</b><br>도면 상의 모든 보조회로 결선 루프가 형광펜으로 동시 표시되었습니다.<br><span style="color: #38bdf8;">각 개별 번호 칩을 클릭하면 해당 선로의 상세 결선 순서를 확인할 수 있습니다.</span>`);
  }

  /**
   * 3단계 전체 자동 시연 (모든 핀 번호 작성 후 그루핑 순회)
   */
  /**
   * 초기화 (핀번호 매기기 연습 모드): 진행 중 시연을 멈추고 핀번호·그루핑·공통 표시를 모두 지움
   * ➜ 빈 도면을 보고 직접 핀번호·그룹 번호를 매겨 본 뒤 '핀번호 전체 쓰기'·시연으로 정답 확인
   */
  reset() {
    this.runToken++;
    this.currentGroup = null;
    this.isPinsRevealed = false;
    this.showAllGroups();   // 번호 칩 선택 표시 해제 (그룹 형광 표시는 아래에서 지움)
    ['seq-pins-layer', 'seq-groups-layer'].forEach(id => {
      const l = document.getElementById(id);
      if (l) l.innerHTML = '';
    });
    const commonLayer = document.getElementById('seq-common-layer');
    if (commonLayer) commonLayer.style.display = 'none';
    const detailCard = document.getElementById('group-detail-card');
    if (detailCard) {
      detailCard.style.borderLeftColor = '#f59e0b';
      detailCard.innerHTML = `
        <div style="font-weight: 800; color: #fbbf24; margin-bottom: 4px; font-size: 14px;">✍️ 연습 모드 — 빈 도면</div>
        <div style="color: #cbd5e1; font-size: 12.5px;">
          ① 도면의 접점·코일마다 <b>핀번호</b>를 직접 적어 보세요. (기구 내부결선도 보기 📖 참고)<br>
          ② 같은 전위끼리 묶어 <b>왼쪽 열부터 ①, ②, ③…</b> 그룹 번호를 매겨 보세요. (이 과제는 <b>${this.problem.board.sequenceCircuit.groups.length}개</b>)<br>
          ③ 다 했으면 <b>✍️ 핀번호 전체 쓰기</b>와 위 번호 칩(또는 ▶ 전체 시연)으로 정답을 확인!
        </div>`;
    }
    this.updateGuideMessage(`🔄 <b>[3단계 초기화 — 연습 모드]</b><br>핀번호·그루핑·공통 표시를 모두 지웠어요. 종이나 문제지에 <b>핀번호와 그룹 번호(①~${this.circled(this.problem.board.sequenceCircuit.groups.length)})</b>를 직접 매겨 본 뒤,<br><b>✍️ 핀번호 전체 쓰기</b>로 맞춰 보세요!`);
  }

  async playAll() {
    // 다시 누르면 이전 시연은 취소되고 처음부터 새로 시작
    const token = ++this.runToken;
    const wait = (ms) => new Promise(r => setTimeout(r, ms / this.speed));

    this.renderPinBadges(true);
    await wait(1200);
    if (token !== this.runToken) return;

    // 1. 먼저 FLS 전극 최우선 결선 시연
    this.selectFlsPreWire();
    await wait(900);
    if (token !== this.runToken) return;

    // 2. 15개 전체 보조회로 그루핑 순차 순회 (① ~ ⑮)
    const { groups } = this.problem.board.sequenceCircuit;
    for (let i = 0; i < groups.length; i++) {
      this.selectGroup(groups[i].num);
      await wait(600);
      if (token !== this.runToken) return;
    }

    this.showAllGroups();
    this.updateGuideMessage(`🎉 <b>[3단계 핀번호 & 그루핑 완성!]</b><br>시퀀스 도면의 모든 접점에 기호를 가리지 않는 핀번호가 적혔고, ${groups.length}개 전위 그루핑이 완료되었습니다!<br><span style="color: #38bdf8; font-weight: bold;">이제 '4단계 제어판 보조회로 배선 진행 ▶'을 눌러 실제 제어판에 황색 전선을 연결해 보세요!</span>`);
  }

  /**
   * 공통선(COM) 초록 뱃지 — 과제 데이터 sequenceCircuit.commons (없으면 1번 위치)
   * - ssArc: 셀렉터 A·M 상단을 잇는 공통 표시 [왼쪽 x, 오른쪽 x, y], badges: [x, y, 폭]
   */
  commonBadgesMarkup() {
    const c = this.problem.board.sequenceCircuit.commons || {
      ssArc: [1080, 1162, 292],
      badges: [[1185, 465, 56], [770, 595, 56], [768, 835, 60], [1498, 835, 60]]
    };
    const badge = ([x, y, w]) => `
      <g transform="translate(${x}, ${y})">
        <rect x="0" y="0" width="${w}" height="24" rx="12" fill="#16a34a" />
        <text x="${w / 2}" y="16.5" font-size="13" fill="#ffffff" font-weight="900" font-family="'Pretendard', sans-serif" text-anchor="middle">공통</text>
      </g>`;
    let out = '';
    // EOCR 10번 공통: 도면에 b접점(10-4)·a접점(10-5)으로 두 번 나오지만 실제로는 같은 단자 하나
    // ➜ ① 그룹 경로(b접점 왼쪽 ➜ 코일 줄 ➜ a접점 위)에서 위치를 읽어 점선으로 이어 표시
    const g1 = this.problem.board.sequenceCircuit.groupPaths?.[1] || '';
    const bm = g1.match(/L 511 (\d+) L (\d+) \1/);
    const am = g1.match(/M 592 (\d+) L (\d+) \1 L \2 (\d+)/);
    if (c.eocr10 !== false && bm && am) {
      const [y0, x0] = [+bm[1], +bm[2]];
      const [by, ax, ay] = [+am[1], +am[2], +am[3]];
      const lx = 606;
      out += `<g class="seq-common-path"><path d="M ${x0} ${y0 + 12} L ${lx} ${y0 + 12} L ${lx} ${by - 12} L ${ax - 12} ${by - 12} L ${ax - 12} ${ay}" fill="none" stroke="#16a34a" stroke-width="4" stroke-dasharray="10 6" stroke-linecap="round" />
        ${badge([lx + 4, (y0 + by) / 2 - 12, 56])}
        <text x="${lx + 32}" y="${(y0 + by) / 2 + 30}" font-size="11" font-weight="900" fill="#15803d" text-anchor="middle">EOCR 10</text></g>`;
    }
    if (c.ssArc) {
      const [x1, x2, y] = c.ssArc;
      out += `<g id="seq-ss-common"><path d="M ${x1} ${y} C ${x1 + 15} ${y - 28}, ${x2 - 15} ${y - 28}, ${x2} ${y}" fill="none" stroke="#16a34a" stroke-width="3" />${badge([(x1 + x2) / 2 - 28, y - 46, 56])}</g>`;
    }
    // pbArc: [PB0 출력 끝 x, PB1 입력 x, 모선 y] — PB0(NC)·PB1(NO)이 박스 안에서 공통선으로 묶인 곳을
    // 모선 위 초록 곡선으로 이어 표시 (PB1이 PB0에서 멀리 떨어진 과제도 어디끼리 공통인지 보이게)
    if (c.pbArc) {
      const [x1, x2, y] = c.pbArc;
      const near = x2 - x1 < 120;
      out += `<g class="seq-pb-common">
        <path d="M ${x1} ${y} C ${x1 + 12} ${y - 34}, ${x2 - 12} ${y - 34}, ${x2} ${y}" fill="none" stroke="#16a34a" stroke-width="3.5" />
        <circle cx="${x1}" cy="${y}" r="4.5" fill="#16a34a" /><circle cx="${x2}" cy="${y}" r="4.5" fill="#16a34a" />
        ${badge(near ? [x2 + 6, y - 50, 56] : [(x1 + x2) / 2 - 28, y - 52, 56])}
      </g>`;
    }
    // pbLink: [x, PB0 아래 단자 y, PB1 위 단자 y] — PB0·PB1이 한 줄에 위아래로 있을 때(1~9번)
    // 두 단자 사이 공통선을 왼쪽으로 볼록한 초록 곡선으로 이어 표시
    if (c.pbLink) {
      const [x, y1, y2] = c.pbLink;
      out += `<g class="seq-pb-common">
        <path d="M ${x} ${y1} C ${x - 40} ${y1}, ${x - 40} ${y2}, ${x} ${y2}" fill="none" stroke="#16a34a" stroke-width="3.5" />
        <circle cx="${x}" cy="${y1}" r="4.5" fill="#16a34a" /><circle cx="${x}" cy="${y2}" r="4.5" fill="#16a34a" />
        ${badge([x + 12, (y1 + y2) / 2 - 12, 56])}
      </g>`;
    }
    // links: [왼쪽 x, 오른쪽 x, y] — 같은 박스 두 램프의 아래 단자(공통)를 도면 아래로 잇는 초록 곡선 + 공통 뱃지
    // (예: 10번 YL·WL처럼 도면에서 멀리 떨어진 두 램프가 박스 안에서 공통선으로 묶임)
    (c.links || []).forEach(([x1, x2, y]) => {
      const sag = 62;
      out += `<g class="seq-common-link">
        <path d="M ${x1} ${y} C ${x1} ${y + sag}, ${x2} ${y + sag}, ${x2} ${y}" fill="none" stroke="#16a34a" stroke-width="4" stroke-linecap="round" />
        <circle cx="${x1}" cy="${y}" r="5" fill="#16a34a" /><circle cx="${x2}" cy="${y}" r="5" fill="#16a34a" />
        ${badge([(x1 + x2) / 2 - 28, y + sag * 0.75 - 12, 56])}
      </g>`;
    });
    // paths: { d, badge: [x, y] } — 같은 단자가 도면에 두 번 나오는 공통(예: EOCR 10번 = b접점·a접점 공통)
    (c.paths || []).forEach(p => {
      out += `<g class="seq-common-path"><path d="${p.d}" fill="none" stroke="#16a34a" stroke-width="4" stroke-dasharray="10 6" stroke-linecap="round" />${p.badge ? badge([p.badge[0], p.badge[1], 56]) : ''}</g>`;
    });
    return out + c.badges.map(badge).join('');
  }

  /** 1 ➜ ①, 14 ➜ ⑭ */
  circled(n) {
    return String.fromCharCode(0x2460 + n - 1);
  }

  updateGuideMessage(html) {
    const guideEl = document.getElementById('step-guide-box');
    if (guideEl) {
      guideEl.innerHTML = html;
    }
  }

  setSpeed(speed) {
    this.speed = speed;
  }
}
