/**
 * Stage 3: 시퀀스 도면 핀번호 부여 및 전위 그루핑 엔진 (Pin Numbering & Grouping)
 * - 시퀀스 회로도 인터랙티브 SVG 오버레이 (1753 x 1240 픽셀 기준)
 * - 부품별(EOCR, MC1, MC2, X, FR, T, FLS, 단자대) 핀번호 기입 시뮬레이션
 * - 동그라미 전위 그루핑(①~⑮) 하이라이트 및 4단계 보조회로 배선 순서 연동
 * - ✏️ 캡처 프로그램 스타일 연습 모드 필기 도구 (펜 · 형광펜 · 텍스트 · 지우개 · 색상 · 굵기 · 실행 취소 · 정답 겹쳐 비교)
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

const COLOR_PRESETS = [
  { hex: '#2563eb', name: '파랑 (핀번호/공통)' },
  { hex: '#dc2626', name: '빨강 (중요 핀번호)' },
  { hex: '#16a34a', name: '초록 (공통 묶음)' },
  { hex: '#facc15', name: '노랑 (형광 마킹)' },
  { hex: '#f97316', name: '주황 (포인트)' },
  { hex: '#9333ea', name: '보라 (그룹 구분)' },
  { hex: '#0f172a', name: '검정 (메모)' }
];

export class Stage3PinGrouping {
  constructor(container, problemData) {
    this.container = container;
    this.problem = problemData;
    this.speed = 1.0;
    this.currentGroup = null;
    this.isPinsRevealed = false;
    this.audioContext = null;
    this.runToken = 0; // 자동 시연 취소용 토큰

    // ✏️ 캡처 도구 스타일 연습 모드 필기 상태
    this.drawTool = 'pen'; // 'pen' | 'highlighter' | 'text' | 'eraser' | 'none'
    this.toolSettings = {
      pen: { color: '#2563eb', size: 4 },
      highlighter: { color: '#facc15', size: 22 },
      text: { color: '#2563eb', size: 22 },
      eraser: { size: 26 }
    };
    this.userAnnotations = []; // [{ id, type: 'pen'|'highlighter'|'text', color, size, points, d, text, x, y }]
    this.undoStack = [];
    this.redoStack = [];
    this.isUserLayerVisible = true;
    this.isDrawingStroke = false;
    this.activeStroke = null;
    this.nextAnnoId = 1;

    this.init();
  }

  init() {
    this.setupAudio();
    this.loadSavedAnnotations();
    this.render();
  }

  storageKey() {
    return `es-stage3-draw-p${this.problem.id}`;
  }

  loadSavedAnnotations() {
    try {
      const raw = sessionStorage.getItem(this.storageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.userAnnotations = parsed;
          this.nextAnnoId = parsed.reduce((m, a) => Math.max(m, (a.id || 0) + 1), 1);
        }
      }
    } catch (e) { /* ignore storage errors */ }
  }

  saveAnnotations() {
    try {
      sessionStorage.setItem(this.storageKey(), JSON.stringify(this.userAnnotations));
    } catch (e) { /* ignore storage errors */ }
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

  getGroupPaths() {
    return this.problem.board.sequenceCircuit.groupPaths;
  }

  render() {
    const { sequenceCircuit } = this.problem.board;
    const { groups } = sequenceCircuit;

    this.container.innerHTML = `
      <div class="stage3-sequence-wrapper" style="display: flex; flex-direction: column; width: 100%; height: 100%; gap: 8px;">
        
        <!-- 상단 전위 그루핑 칩 바 + FLS 전극 최우선 결선 가이드 -->
        <div class="grouping-chips-bar" style="display: flex; flex-wrap: wrap; gap: 6px; background: rgba(15,23,42,0.85); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); align-items: center;">
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

        <!-- ✏️ 캡처 프로그램 스타일 연습 필기 도구 바 -->
        <div id="stage3-draw-toolbar" class="s3-draw-toolbar">
          <!-- 1) 필기 도구 선택 -->
          <div class="s3-tool-group">
            <span class="s3-toolbar-label">✏️ 연습 필기구:</span>
            <button type="button" class="s3-tool-btn active" data-draw-tool="pen" title="펜 도구 (단축키 P) — 핀번호 적기, 공통선 묶기">
              <span>🖊️</span> 펜
            </button>
            <button type="button" class="s3-tool-btn" data-draw-tool="highlighter" title="형광펜 도구 (단축키 H) — 도면 글자를 가리지 않는 반투명 전위 그루핑 마킹">
              <span>🖍️</span> 형광펜
            </button>
            <button type="button" class="s3-tool-btn" data-draw-tool="text" title="텍스트 입력 (단축키 T) — 클릭한 위치에 키보드로 핀번호·메모 입력">
              <span>🔤</span> 텍스트
            </button>
            <button type="button" class="s3-tool-btn" data-draw-tool="eraser" title="지우개 도구 (단축키 E) — 드래그하여 지나가는 글씨·선 지우기">
              <span>🧹</span> 지우개
            </button>
          </div>

          <span class="s3-toolbar-divider"></span>

          <!-- 2) 색상 팔레트 -->
          <div class="s3-tool-group" id="s3-color-group">
            <span class="s3-toolbar-label">색상:</span>
            ${COLOR_PRESETS.map(c => `
              <button type="button" class="s3-color-swatch ${c.hex === '#2563eb' ? 'active' : ''}" data-draw-color="${c.hex}" title="${c.name}" style="background: ${c.hex};"></button>
            `).join('')}
            <label class="s3-custom-color-wrap" title="사용자 지정 색상 선택">
              <input type="color" id="s3-custom-color" value="#2563eb">
              <span>🎨</span>
            </label>
          </div>

          <span class="s3-toolbar-divider"></span>

          <!-- 3) 굵기 조절 -->
          <div class="s3-tool-group">
            <span class="s3-toolbar-label">굵기:</span>
            <div class="s3-size-presets">
              <button type="button" class="s3-size-chip" data-size-preset="thin" title="가는 선">세필</button>
              <button type="button" class="s3-size-chip active" data-size-preset="medium" title="보통 굵기">보통</button>
              <button type="button" class="s3-size-chip" data-size-preset="thick" title="굵은 선">굵게</button>
            </div>
            <input type="range" id="s3-size-slider" class="s3-size-slider" min="1" max="40" step="1" value="4" title="선 굵기 미세 조절">
            <span class="s3-size-preview-wrap" title="현재 굵기 미리보기">
              <span id="s3-size-dot" class="s3-size-dot"></span>
              <span id="s3-size-label" class="s3-size-label">4px</span>
            </span>
          </div>

          <span class="s3-toolbar-divider"></span>

          <!-- 4) 실행 취소 / 지우기 / 정답 비교 -->
          <div class="s3-tool-group" style="margin-left: auto;">
            <button type="button" id="s3-btn-undo" class="s3-action-btn" title="방금 그린 획 실행 취소 (Ctrl+Z)" disabled>↩ 취소</button>
            <button type="button" id="s3-btn-redo" class="s3-action-btn" title="다시 실행 (Ctrl+Y)" disabled>↪ 복구</button>
            <button type="button" id="s3-btn-toggle-user" class="s3-action-btn" title="내가 적은 필기 잠시 숨기기/보이기">👁️ 내 필기 ON</button>
            <button type="button" id="s3-btn-clear-user" class="s3-action-btn s3-btn-danger" title="내가 그린 모든 손글씨·형광펜 지우기">🗑️ 모두 지우기</button>
            <button type="button" id="s3-btn-compare-answer" class="s3-compare-btn" title="내가 쓴 핀번호·공통선 위에 공식 정답(핀번호 + 초록 공통선)을 겹쳐서 비교합니다">
              ✅ 정답 겹쳐 비교
            </button>
          </div>
        </div>

        <!-- 메인 인터랙티브 시퀀스 회로도 뷰어 (1753 x 1240 좌표계 1:1 완벽 고정) -->
        <div class="sequence-svg-container" id="stage3-svg-wrap" style="position: relative; flex: 1; min-height: 520px; background: #0b1120; border-radius: 8px; overflow: auto; border: 1px solid #1e293b; display: flex; justify-content: center; align-items: center; padding: 10px;">
          <svg id="sequence-overlay-svg" class="s3-drawable-svg tool-pen" viewBox="0 0 1753 1240" style="width: 100%; max-width: 1250px; height: auto; max-height: 80vh; display: block; background: #ffffff; border-radius: 6px; box-shadow: 0 4px 24px rgba(0,0,0,0.6); user-select: none; touch-action: none;">
            <!-- 1. 원본 도면 이미지 (1753 x 1240) -->
            <image href="${this.problem.assets?.sequence || 'assets/images/sequence_diagram.png'}" x="0" y="0" width="1753" height="1240" pointer-events="none" />
            
            <!-- 2. 사용자 형광펜 레이어 (multiply 합성으로 도면 검은 선 보존) -->
            <g id="seq-user-hl-layer" style="mix-blend-mode: multiply;"></g>

            <!-- 3. 동그라미 전위 그루핑 형광펜 하이라이트 레이어 (공식 정답) -->
            <g id="seq-groups-layer" pointer-events="none"></g>

            <!-- 4. 실기 도면 공통선(COM) 녹색 타원 뱃지 레이어 (공식 정답) -->
            <g id="seq-common-layer" pointer-events="none">${this.commonBadgesMarkup()}</g>

            <!-- 5. 네임펜 손글씨 핀번호 뱃지 레이어 (공식 정답) -->
            <g id="seq-pins-layer" pointer-events="none"></g>

            <!-- 6. 사용자 펜 필기 & 텍스트 레이어 (내 손글씨가 정답 위에서도 선명하게 비교되도록) -->
            <g id="seq-user-pen-layer"></g>

            <!-- 7. 지우개 커서 가이드 원 -->
            <circle id="seq-eraser-cursor" cx="-100" cy="-100" r="13" fill="rgba(244, 63, 94, 0.15)" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4 3" style="display: none; pointer-events: none;" />
          </svg>

          <!-- 텍스트 도구 입력용 플로팅 인풋 -->
          <input type="text" id="s3-floating-text-input" class="s3-floating-text-input" placeholder="핀번호 입력 후 Enter" style="display: none;" autocomplete="off" />
        </div>

        <!-- 하단 선택된 그루핑 상세 정보 카드 -->
        <div id="group-detail-card" style="background: rgba(15,23,42,0.9); border: 1px solid rgba(56,189,248,0.3); border-left: 4px solid #38bdf8; border-radius: 6px; padding: 10px 14px; color: #e2e8f0; font-size: 13px; line-height: 1.5;">
          💡 <b>[3단계 핀번호 & 공통 묶기 연습]</b> 도면 위에 마우스나 펜으로 <b>직접 핀번호를 적고 공통선을 묶어 보세요!</b> 다 적은 뒤 상단의 <b>'✅ 정답 겹쳐 비교'</b> 또는 <b>'✍️ 핀번호 전체 쓰기'</b>를 누르면 내 필기와 공식 정답을 한눈에 비교할 수 있습니다.
        </div>
      </div>
    `;

    this.bindEvents();
    this.bindDrawingEvents();
    // 처음에는 빈 도면 (공식 핀번호·공통 표시 숨김)
    const commonLayer = document.getElementById('seq-common-layer');
    if (commonLayer) commonLayer.style.display = 'none';
    this.isPinsRevealed = false;
    this.renderUserAnnotations();
    this.syncDrawToolbarUI();
  }

  bindEvents() {
    this.container.querySelector('#btn-fls-prewire')?.addEventListener('click', () => {
      this.runToken++;
      this.selectFlsPreWire();
    });

    this.container.querySelectorAll('.group-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
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
   * ✏️ 캡처 프로그램 스타일 드로잉 이벤트 바인딩
   */
  bindDrawingEvents() {
    const svg = this.container.querySelector('#sequence-overlay-svg');
    const eraserCursor = this.container.querySelector('#seq-eraser-cursor');
    const textInput = this.container.querySelector('#s3-floating-text-input');
    if (!svg) return;

    // 1. 도구 선택 버튼 (펜 / 형광펜 / 텍스트 / 지우개)
    this.container.querySelectorAll('[data-draw-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.commitFloatingText();
        this.setDrawTool(btn.dataset.drawTool);
      });
    });

    // 2. 색상 프리셋 스와치
    this.container.querySelectorAll('[data-draw-color]').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const hex = swatch.dataset.drawColor;
        this.setDrawColor(hex);
      });
    });

    // 사용자 지정 컬러 피커
    const customColorInput = this.container.querySelector('#s3-custom-color');
    customColorInput?.addEventListener('input', (e) => {
      this.setDrawColor(e.target.value);
    });

    // 3. 굵기 프리셋 칩 (세필 / 보통 / 굵게)
    this.container.querySelectorAll('[data-size-preset]').forEach(chip => {
      chip.addEventListener('click', () => {
        const preset = chip.dataset.sizePreset;
        const sizeMap = {
          pen: { thin: 2, medium: 4, thick: 8 },
          highlighter: { thin: 14, medium: 22, thick: 34 },
          text: { thin: 16, medium: 22, thick: 30 },
          eraser: { thin: 14, medium: 26, thick: 40 }
        };
        const targetSize = sizeMap[this.drawTool]?.[preset] || 4;
        this.setDrawSize(targetSize);
      });
    });

    // 굵기 슬라이더
    const sizeSlider = this.container.querySelector('#s3-size-slider');
    sizeSlider?.addEventListener('input', (e) => {
      this.setDrawSize(parseInt(e.target.value, 10));
    });

    // 4. 실행 취소 / 다시 실행 / 내 필기 토글 / 전체 지우기 / 정답 비교
    this.container.querySelector('#s3-btn-undo')?.addEventListener('click', () => this.undo());
    this.container.querySelector('#s3-btn-redo')?.addEventListener('click', () => this.redo());

    this.container.querySelector('#s3-btn-toggle-user')?.addEventListener('click', () => {
      this.isUserLayerVisible = !this.isUserLayerVisible;
      this.renderUserAnnotations();
      this.syncDrawToolbarUI();
    });

    this.container.querySelector('#s3-btn-clear-user')?.addEventListener('click', () => {
      this.clearUserAnnotations();
    });

    this.container.querySelector('#s3-btn-compare-answer')?.addEventListener('click', () => {
      this.toggleAnswerCompare();
    });

    // 5. 단축키 (Ctrl+Z, Ctrl+Y, P/H/T/E)
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    this._keyHandler = (e) => {
      if (this.container.style.display === 'none') return;
      if (e.target.closest('input, select, textarea')) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.redo();
        else this.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.redo();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'p') this.setDrawTool('pen');
        else if (k === 'h') this.setDrawTool('highlighter');
        else if (k === 't') this.setDrawTool('text');
        else if (k === 'e') this.setDrawTool('eraser');
      }
    };
    window.addEventListener('keydown', this._keyHandler);

    // 6. SVG 포인터 드로잉 핸들러
    svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; // 좌클릭만 필기
      if (!this.isUserLayerVisible) {
        this.isUserLayerVisible = true;
        this.renderUserAnnotations();
        this.syncDrawToolbarUI();
      }

      const pt = this.svgPointFromEvent(e);

      if (this.drawTool === 'text') {
        e.preventDefault();
        this.openFloatingTextInput(pt, e);
        return;
      }

      this.commitFloatingText();

      if (this.drawTool === 'eraser') {
        e.preventDefault();
        svg.setPointerCapture(e.pointerId);
        this.isDrawingStroke = true;
        this._erasedInDrag = [];
        this.eraseAtPoint(pt);
        return;
      }

      if (this.drawTool === 'pen' || this.drawTool === 'highlighter') {
        e.preventDefault();
        svg.setPointerCapture(e.pointerId);
        this.isDrawingStroke = true;
        const cfg = this.toolSettings[this.drawTool];
        this.activeStroke = {
          id: this.nextAnnoId++,
          type: this.drawTool,
          color: cfg.color,
          size: cfg.size,
          points: [pt],
          d: this.buildSmoothPath([pt])
        };
        this.appendStrokeElement(this.activeStroke);
      }
    });

    svg.addEventListener('pointermove', (e) => {
      const pt = this.svgPointFromEvent(e);

      // 지우개 커서 표시 업데이트
      if (this.drawTool === 'eraser' && eraserCursor) {
        eraserCursor.style.display = '';
        eraserCursor.setAttribute('cx', pt.x);
        eraserCursor.setAttribute('cy', pt.y);
        eraserCursor.setAttribute('r', this.toolSettings.eraser.size / 2);
      }

      if (!this.isDrawingStroke) return;

      if (this.drawTool === 'eraser') {
        this.eraseAtPoint(pt);
        return;
      }

      if (this.activeStroke) {
        const pts = this.activeStroke.points;
        const last = pts[pts.length - 1];
        const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
        if (dist < 1.2) return; // 미세 떨림 필터링
        pts.push(pt);
        this.activeStroke.d = this.buildSmoothPath(pts);
        const pathEl = svg.querySelector(`[data-anno-id="${this.activeStroke.id}"]`);
        if (pathEl) pathEl.setAttribute('d', this.activeStroke.d);
      }
    });

    const finishStroke = (e) => {
      if (!this.isDrawingStroke) return;
      this.isDrawingStroke = false;
      try { svg.releasePointerCapture(e.pointerId); } catch (_) {}

      if (this.drawTool === 'eraser') {
        if (this._erasedInDrag && this._erasedInDrag.length > 0) {
          this.pushHistory({ action: 'erase', items: this._erasedInDrag });
          this.saveAnnotations();
        }
        this._erasedInDrag = null;
        return;
      }

      if (this.activeStroke) {
        this.userAnnotations.push(this.activeStroke);
        this.pushHistory({ action: 'add', item: this.activeStroke });
        this.activeStroke = null;
        this.saveAnnotations();
        this.syncDrawToolbarUI();
      }
    };

    svg.addEventListener('pointerup', finishStroke);
    svg.addEventListener('pointercancel', finishStroke);
    svg.addEventListener('pointerleave', () => {
      if (eraserCursor) eraserCursor.style.display = 'none';
    });

    // 텍스트 입력창 이벤트
    if (textInput) {
      textInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          this.commitFloatingText();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          textInput.value = '';
          textInput.style.display = 'none';
        }
      });
      textInput.addEventListener('blur', () => {
        this.commitFloatingText();
      });
    }
  }

  svgPointFromEvent(e) {
    const svg = this.container.querySelector('#sequence-overlay-svg');
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const t = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.round(t.x * 10) / 10,
      y: Math.round(t.y * 10) / 10
    };
  }

  /**
   * 점 배열을 부드러운 2차 베지어 곡선(Quadratic Bezier) SVG Path로 변환
   */
  buildSmoothPath(points) {
    if (!points || points.length === 0) return '';
    if (points.length === 1) {
      const p = points[0];
      return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y + 0.1}`;
    }
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const midX = Math.round(((points[i].x + points[i + 1].x) / 2) * 10) / 10;
      const midY = Math.round(((points[i].y + points[i + 1].y) / 2) * 10) / 10;
      d += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  }

  appendStrokeElement(item) {
    const hlLayer = this.container.querySelector('#seq-user-hl-layer');
    const penLayer = this.container.querySelector('#seq-user-pen-layer');
    if (!hlLayer || !penLayer) return;

    if (item.type === 'text') {
      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('data-anno-id', item.id);
      textEl.setAttribute('x', item.x);
      textEl.setAttribute('y', item.y);
      textEl.setAttribute('fill', item.color);
      textEl.setAttribute('font-size', item.size);
      textEl.setAttribute('font-weight', '900');
      textEl.setAttribute('font-family', "'Pretendard', sans-serif");
      textEl.setAttribute('paint-order', 'stroke');
      textEl.setAttribute('stroke', '#ffffff');
      textEl.setAttribute('stroke-width', '3px');
      textEl.textContent = item.text;
      penLayer.appendChild(textEl);
      return;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('data-anno-id', item.id);
    path.setAttribute('d', item.d);
    path.setAttribute('stroke', item.color);
    path.setAttribute('stroke-width', item.size);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('fill', 'none');

    if (item.type === 'highlighter') {
      path.setAttribute('stroke-opacity', '0.42');
      hlLayer.appendChild(path);
    } else {
      path.setAttribute('stroke-opacity', '0.96');
      penLayer.appendChild(path);
    }
  }

  renderUserAnnotations() {
    const hlLayer = this.container.querySelector('#seq-user-hl-layer');
    const penLayer = this.container.querySelector('#seq-user-pen-layer');
    if (!hlLayer || !penLayer) return;

    hlLayer.innerHTML = '';
    penLayer.innerHTML = '';
    hlLayer.style.display = this.isUserLayerVisible ? '' : 'none';
    penLayer.style.display = this.isUserLayerVisible ? '' : 'none';

    this.userAnnotations.forEach(item => this.appendStrokeElement(item));
  }

  /**
   * 지우개: 포인터(pt) 반경과 닿는 획·텍스트를 즉시 제거
   */
  eraseAtPoint(pt) {
    const radius = this.toolSettings.eraser.size / 2;
    const remaining = [];
    let removedAny = false;

    for (const item of this.userAnnotations) {
      if (this.hitTestAnnotation(item, pt, radius)) {
        removedAny = true;
        if (this._erasedInDrag) this._erasedInDrag.push(item);
        const el = this.container.querySelector(`[data-anno-id="${item.id}"]`);
        if (el) el.remove();
      } else {
        remaining.push(item);
      }
    }

    if (removedAny) {
      this.userAnnotations = remaining;
      this.playPenSound(320, 0.025);
      this.syncDrawToolbarUI();
    }
  }

  hitTestAnnotation(item, pt, eraserRadius) {
    if (item.type === 'text') {
      const width = (item.text?.length || 1) * (item.size * 0.65);
      const height = item.size;
      return (
        pt.x >= item.x - eraserRadius &&
        pt.x <= item.x + width + eraserRadius &&
        pt.y >= item.y - height - eraserRadius &&
        pt.y <= item.y + eraserRadius
      );
    }

    const threshold = eraserRadius + (item.size || 4) / 2;
    const pts = item.points || [];
    if (pts.length === 1) {
      return Math.hypot(pt.x - pts[0].x, pt.y - pts[0].y) <= threshold;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      if (this.distToSegment(pt, pts[i], pts[i + 1]) <= threshold) {
        return true;
      }
    }
    return false;
  }

  distToSegment(p, v, w) {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  openFloatingTextInput(pt, pointerEvent) {
    this.commitFloatingText();
    const wrap = this.container.querySelector('#stage3-svg-wrap');
    const textInput = this.container.querySelector('#s3-floating-text-input');
    if (!wrap || !textInput) return;

    const wrapRect = wrap.getBoundingClientRect();
    const left = pointerEvent.clientX - wrapRect.left + wrap.scrollLeft;
    const top = pointerEvent.clientY - wrapRect.top + wrap.scrollTop - 14;

    const cfg = this.toolSettings.text;
    textInput.dataset.svgX = pt.x;
    textInput.dataset.svgY = pt.y;
    textInput.style.left = `${left}px`;
    textInput.style.top = `${top}px`;
    textInput.style.color = cfg.color;
    textInput.style.display = 'block';
    textInput.value = '';
    setTimeout(() => textInput.focus(), 10);
  }

  commitFloatingText() {
    const textInput = this.container.querySelector('#s3-floating-text-input');
    if (!textInput || textInput.style.display === 'none') return;
    const val = textInput.value.trim();
    textInput.style.display = 'none';
    textInput.value = '';
    if (!val) return;

    const cfg = this.toolSettings.text;
    const item = {
      id: this.nextAnnoId++,
      type: 'text',
      color: cfg.color,
      size: cfg.size,
      text: val,
      x: parseFloat(textInput.dataset.svgX || '0'),
      y: parseFloat(textInput.dataset.svgY || '0') + cfg.size * 0.35
    };
    this.userAnnotations.push(item);
    this.appendStrokeElement(item);
    this.pushHistory({ action: 'add', item });
    this.saveAnnotations();
    this.playPenSound(780, 0.04);
    this.syncDrawToolbarUI();
  }

  pushHistory(entry) {
    this.undoStack.push(entry);
    if (this.undoStack.length > 60) this.undoStack.shift();
    this.redoStack = [];
    this.syncDrawToolbarUI();
  }

  undo() {
    this.commitFloatingText();
    const entry = this.undoStack.pop();
    if (!entry) return;

    if (entry.action === 'add') {
      this.userAnnotations = this.userAnnotations.filter(a => a.id !== entry.item.id);
    } else if (entry.action === 'erase') {
      this.userAnnotations.push(...entry.items);
    } else if (entry.action === 'clear') {
      this.userAnnotations = [...entry.items];
    }

    this.redoStack.push(entry);
    this.renderUserAnnotations();
    this.saveAnnotations();
    this.syncDrawToolbarUI();
  }

  redo() {
    this.commitFloatingText();
    const entry = this.redoStack.pop();
    if (!entry) return;

    if (entry.action === 'add') {
      this.userAnnotations.push(entry.item);
    } else if (entry.action === 'erase') {
      const eraseIds = new Set(entry.items.map(i => i.id));
      this.userAnnotations = this.userAnnotations.filter(a => !eraseIds.has(a.id));
    } else if (entry.action === 'clear') {
      this.userAnnotations = [];
    }

    this.undoStack.push(entry);
    this.renderUserAnnotations();
    this.saveAnnotations();
    this.syncDrawToolbarUI();
  }

  clearUserAnnotations() {
    this.commitFloatingText();
    if (this.userAnnotations.length === 0) return;
    this.pushHistory({ action: 'clear', items: [...this.userAnnotations] });
    this.userAnnotations = [];
    this.renderUserAnnotations();
    this.saveAnnotations();
    this.syncDrawToolbarUI();
    this.playPenSound(440, 0.06);
  }

  setDrawTool(tool) {
    this.drawTool = tool;
    const svg = this.container.querySelector('#sequence-overlay-svg');
    const eraserCursor = this.container.querySelector('#seq-eraser-cursor');
    if (svg) {
      svg.classList.remove('tool-pen', 'tool-highlighter', 'tool-text', 'tool-eraser');
      svg.classList.add(`tool-${tool}`);
    }
    if (eraserCursor && tool !== 'eraser') {
      eraserCursor.style.display = 'none';
    }
    this.syncDrawToolbarUI();
  }

  setDrawColor(hex) {
    if (this.drawTool === 'eraser') {
      this.drawTool = 'pen';
    }
    const cfg = this.toolSettings[this.drawTool];
    if (cfg) cfg.color = hex;
    this.syncDrawToolbarUI();
  }

  setDrawSize(size) {
    const clamped = Math.max(1, Math.min(40, size));
    const cfg = this.toolSettings[this.drawTool];
    if (cfg) cfg.size = clamped;
    this.syncDrawToolbarUI();
  }

  syncDrawToolbarUI() {
    const cfg = this.toolSettings[this.drawTool] || this.toolSettings.pen;

    // 도구 버튼 활성화 표시
    this.container.querySelectorAll('[data-draw-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.drawTool === this.drawTool);
    });

    // 색상 팔레트 활성화 표시 (지우개일 때는 반투명 처리)
    const colorGroup = this.container.querySelector('#s3-color-group');
    if (colorGroup) {
      colorGroup.style.opacity = this.drawTool === 'eraser' ? '0.45' : '1';
    }
    if (cfg.color) {
      this.container.querySelectorAll('[data-draw-color]').forEach(swatch => {
        swatch.classList.toggle('active', swatch.dataset.drawColor.toLowerCase() === cfg.color.toLowerCase());
      });
      const customColor = this.container.querySelector('#s3-custom-color');
      if (customColor) customColor.value = cfg.color;
    }

    // 굵기 슬라이더 및 미리보기 점 동기화
    const slider = this.container.querySelector('#s3-size-slider');
    const sizeLabel = this.container.querySelector('#s3-size-label');
    const sizeDot = this.container.querySelector('#s3-size-dot');
    if (slider) slider.value = cfg.size;
    if (sizeLabel) sizeLabel.textContent = `${cfg.size}px`;
    if (sizeDot) {
      const dotPx = Math.max(4, Math.min(22, cfg.size));
      sizeDot.style.width = `${dotPx}px`;
      sizeDot.style.height = `${dotPx}px`;
      sizeDot.style.background = this.drawTool === 'eraser' ? '#f43f5e' : (cfg.color || '#2563eb');
      sizeDot.style.opacity = this.drawTool === 'highlighter' ? '0.55' : '1';
    }

    // 굵기 프리셋 칩 활성화 표시
    const sizeMap = {
      pen: { thin: 2, medium: 4, thick: 8 },
      highlighter: { thin: 14, medium: 22, thick: 34 },
      text: { thin: 16, medium: 22, thick: 30 },
      eraser: { thin: 14, medium: 26, thick: 40 }
    }[this.drawTool] || {};
    this.container.querySelectorAll('[data-size-preset]').forEach(chip => {
      chip.classList.toggle('active', sizeMap[chip.dataset.sizePreset] === cfg.size);
    });

    // 취소 / 복구 / 지우기 버튼 상태
    const undoBtn = this.container.querySelector('#s3-btn-undo');
    const redoBtn = this.container.querySelector('#s3-btn-redo');
    const clearBtn = this.container.querySelector('#s3-btn-clear-user');
    const toggleUserBtn = this.container.querySelector('#s3-btn-toggle-user');
    const compareBtn = this.container.querySelector('#s3-btn-compare-answer');

    if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
    if (clearBtn) clearBtn.disabled = this.userAnnotations.length === 0;
    if (toggleUserBtn) {
      toggleUserBtn.textContent = this.isUserLayerVisible ? '👁️ 내 필기 ON' : '🙈 내 필기 숨김';
      toggleUserBtn.classList.toggle('off', !this.isUserLayerVisible);
    }
    if (compareBtn) {
      compareBtn.classList.toggle('active', this.isPinsRevealed);
      compareBtn.innerHTML = this.isPinsRevealed ? '🙈 정답 숨기기 (연습 계속)' : '✅ 정답 겹쳐 비교';
    }
  }

  /**
   * 내가 쓴 손글씨 위에 공식 정답(핀번호 + 공통선 표시)을 겹쳐 비교 토글
   */
  toggleAnswerCompare() {
    this.runToken++;
    if (this.isPinsRevealed) {
      // 정답만 숨기고 내 필기는 그대로 유지!
      const pinsLayer = document.getElementById('seq-pins-layer');
      const commonLayer = document.getElementById('seq-common-layer');
      const groupsLayer = document.getElementById('seq-groups-layer');
      if (pinsLayer) pinsLayer.innerHTML = '';
      if (commonLayer) commonLayer.style.display = 'none';
      if (groupsLayer) groupsLayer.innerHTML = '';
      this.isPinsRevealed = false;
      this.syncDrawToolbarUI();
      this.updateGuideMessage(`✍️ <b>[연습 모드 계속]</b><br>공식 정답을 숨겼습니다. 내 필기를 수정하거나 이어서 적어 보세요!`);
    } else {
      // 내 필기를 유지한 채 공식 정답(핀번호 + 초록 공통선)을 겹쳐 표시!
      this.renderPinBadges(false);
      this.syncDrawToolbarUI();
      this.updateGuideMessage(`✅ <b>[정답 겹쳐 비교 모드]</b><br>직접 적은 손글씨와 <b>공식 정답(빨간 네임펜 핀번호 + 초록색 공통선 묶음)</b>을 비교해 보세요!<br>상단의 <b>동그라미 번호 칩(①~${this.circled(this.problem.board.sequenceCircuit.groups.length)})</b>을 누르면 전위 그루핑 정답도 함께 비교할 수 있어요.`);
    }
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
    this.syncDrawToolbarUI();
  }

  /**
   * 특정 동그라미 그루핑(num) 선택
   */
  selectGroup(num) {
    const { groups } = this.problem.board.sequenceCircuit;
    const group = groups.find(g => g.num === num);
    if (!group) return;

    this.currentGroup = num;

    const flsBtn = this.container.querySelector('#btn-fls-prewire');
    if (flsBtn) {
      flsBtn.style.transform = 'none';
      flsBtn.style.boxShadow = '0 2px 8px rgba(37,99,235,0.4)';
    }

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

    this.renderGroupHighlight(group);

    this.updateGuideMessage(`🎯 <b>[3단계 그루핑: ${group.name}]</b><br><b>루핑 순서</b>: ${group.loopOrder}<br><span style="color: #facc15; font-size: 12px; margin-top: 4px; display: inline-block;">${group.tip}</span>`);

    this.playPenSound(720, 0.08);
  }

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
   * 초기화 (핀번호 매기기 연습 모드): 진행 중 시연을 멈추고 공식 정답(핀번호·그루핑·공통 표시)을 숨긴 뒤
   * 캡처 도구처럼 도면 위에 직접 핀번호·공통선 필기 모드를 활성화
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

    // 펜 도구 활성화 및 필기 바 강조 효과
    if (this.drawTool === 'eraser') this.setDrawTool('pen');
    const toolbar = document.getElementById('stage3-draw-toolbar');
    if (toolbar) {
      toolbar.classList.remove('s3-toolbar-flash');
      void toolbar.offsetWidth;
      toolbar.classList.add('s3-toolbar-flash');
    }
    this.syncDrawToolbarUI();

    const detailCard = document.getElementById('group-detail-card');
    if (detailCard) {
      detailCard.style.borderLeftColor = '#f59e0b';
      detailCard.innerHTML = `
        <div style="font-weight: 800; color: #fbbf24; margin-bottom: 4px; font-size: 14px;">✏️ 연습 모드 — 캡처 프로그램처럼 도면 위에 직접 필기하세요!</div>
        <div style="color: #cbd5e1; font-size: 12.5px;">
          ① 위 필기 도구에서 <b>🖊️ 펜 · 🖍️ 형광펜 · 🔤 텍스트 · 🧹 지우개</b>와 <b>색상·굵기</b>를 골라 접점마다 <b>핀번호</b>를 적고 <b>공통선</b>을 묶어 보세요.<br>
          ② 다 적었으면 필기 바 오른쪽의 <b>✅ 정답 겹쳐 비교</b>(또는 상단 <b>✍️ 핀번호 전체 쓰기</b>)를 눌러 내 필기와 정답을 바로 비교해 보세요!
        </div>`;
    }
    this.updateGuideMessage(`✏️ <b>[3단계 연습 모드 활성화]</b><br>공식 정답을 숨겼습니다! 도면 위에 마우스나 펜으로 <b>핀번호와 공통 묶음, 그룹 번호(①~${this.circled(this.problem.board.sequenceCircuit.groups.length)})</b>를 직접 적어 보세요.<br>다 적은 후 <b>✅ 정답 겹쳐 비교</b>를 누르면 내 손글씨 위에 공식 정답이 겹쳐 표시됩니다!`);
  }

  async playAll() {
    const token = ++this.runToken;
    const wait = (ms) => new Promise(r => setTimeout(r, ms / this.speed));

    this.renderPinBadges(true);
    await wait(1200);
    if (token !== this.runToken) return;

    this.selectFlsPreWire();
    await wait(900);
    if (token !== this.runToken) return;

    const { groups } = this.problem.board.sequenceCircuit;
    for (let i = 0; i < groups.length; i++) {
      this.selectGroup(groups[i].num);
      await wait(600);
      if (token !== this.runToken) return;
    }

    this.showAllGroups();
    this.updateGuideMessage(`🎉 <b>[3단계 핀번호 & 그루핑 완성!]</b><br>시퀀스 도면의 모든 접점에 기호를 가리지 않는 핀번호가 적혔고, ${groups.length}개 전위 그루핑이 완료되었습니다!<br><span style="color: #38bdf8; font-weight: bold;">이제 '4단계 제어판 보조회로 배선 진행 ▶'을 눌러 실제 제어판에 황색 전선을 연결해 보세요!</span>`);
  }

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
    if (c.pbArc) {
      const [x1, x2, y] = c.pbArc;
      const near = x2 - x1 < 120;
      out += `<g class="seq-pb-common">
        <path d="M ${x1} ${y} C ${x1 + 12} ${y - 34}, ${x2 - 12} ${y - 34}, ${x2} ${y}" fill="none" stroke="#16a34a" stroke-width="3.5" />
        <circle cx="${x1}" cy="${y}" r="4.5" fill="#16a34a" /><circle cx="${x2}" cy="${y}" r="4.5" fill="#16a34a" />
        ${badge(near ? [x2 + 6, y - 50, 56] : [(x1 + x2) / 2 - 28, y - 52, 56])}
      </g>`;
    }
    if (c.pbLink) {
      const [x, y1, y2] = c.pbLink;
      out += `<g class="seq-pb-common">
        <path d="M ${x} ${y1} C ${x - 40} ${y1}, ${x - 40} ${y2}, ${x} ${y2}" fill="none" stroke="#16a34a" stroke-width="3.5" />
        <circle cx="${x}" cy="${y1}" r="4.5" fill="#16a34a" /><circle cx="${x}" cy="${y2}" r="4.5" fill="#16a34a" />
        ${badge([x + 12, (y1 + y2) / 2 - 12, 56])}
      </g>`;
    }
    (c.links || []).forEach(([x1, x2, y]) => {
      const sag = 62;
      out += `<g class="seq-common-link">
        <path d="M ${x1} ${y} C ${x1} ${y + sag}, ${x2} ${y + sag}, ${x2} ${y}" fill="none" stroke="#16a34a" stroke-width="4" stroke-linecap="round" />
        <circle cx="${x1}" cy="${y}" r="5" fill="#16a34a" /><circle cx="${x2}" cy="${y}" r="5" fill="#16a34a" />
        ${badge([(x1 + x2) / 2 - 28, y + sag * 0.75 - 12, 56])}
      </g>`;
    });
    (c.paths || []).forEach(p => {
      out += `<g class="seq-common-path"><path d="${p.d}" fill="none" stroke="#16a34a" stroke-width="4" stroke-dasharray="10 6" stroke-linecap="round" />${p.badge ? badge([p.badge[0], p.badge[1], 56]) : ''}</g>`;
    });
    return out + c.badges.map(badge).join('');
  }

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
