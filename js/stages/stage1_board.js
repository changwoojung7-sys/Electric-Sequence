/**
 * Stage 1: 제어판 400x420mm 기판 제도 및 기구 배치 엔진
 */
import { SvgSymbols } from '../components/svg_symbols.js';
import { getAudioContext } from '../components/audio.js';

export class Stage1Board {
  constructor(container, problemData) {
    this.container = container;
    this.problem = problemData;
    this.speed = 1.0;
    this.currentSubStep = 0; // 0: 초기합판, 1: 제도선긋기, 2: 기구부착, 3: 이름표(마스킹테이프)
    this.isPlaying = false;
    this.audioContext = null;
    this.init();
  }

  init() {
    this.renderBaseSvg();
    this.setupAudio();
  }

  setupAudio() {
    // 경쾌한 효과음을 위한 Web Audio API (무설치 로컬 구동, 공용 컨텍스트)
    this.audioContext = getAudioContext();
  }

  playBeep(freq = 600, duration = 0.08, type = 'sine') {
    if (!this.audioContext) return;
    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      // ignore
    }
  }

  renderBaseSvg() {
    // 400x420mm 기판 + 좌우상하 치수 화살표 여백을 위한 viewBox 설정
    // viewBox: x(-70), y(-35), w(550), h(490)
    const { width, height } = this.problem.board;

    this.container.innerHTML = `
      <div class="board-view-wrapper">
        <svg id="board-svg" viewBox="-70 -35 550 490" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- 그림자 필터 -->
            <filter id="shadow" x="-10%" y="-10%" width="125%" height="125%">
              <feDropShadow dx="1.5" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.6"/>
            </filter>
            <filter id="shadow-sm" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0.8" dy="1" stdDeviation="0.8" flood-color="#000000" flood-opacity="0.4"/>
            </filter>
            
            <!-- 합판 나무 무늬 패턴 (400x420 합판) -->
            <pattern id="plywood-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <rect width="60" height="60" fill="#c29a6b"/>
              <path d="M0,15 Q30,12 60,15 M0,35 Q30,38 60,35 M0,50 Q30,48 60,50" stroke="#b08657" stroke-width="0.8" fill="none" opacity="0.4"/>
              <circle cx="25" cy="20" r="1.5" fill="#996e42" opacity="0.3"/>
            </pattern>

            <!-- 치수 화살표 마커 -->
            <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444"/>
            </marker>
            <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444"/>
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981"/>
            </marker>
            <marker id="arrow-green-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981"/>
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7"/>
            </marker>
          </defs>

          <!-- 400x420 미송 합판 본체 -->
          <g id="plywood-board">
            <!-- 판자 두께 그림자 -->
            <rect x="2" y="2" width="${width}" height="${height}" rx="4" fill="#6d4c2b" opacity="0.6" />
            <!-- 합판 메인 판재 -->
            <rect x="0" y="0" width="${width}" height="${height}" rx="3" fill="url(#plywood-pattern)" stroke="#8f6339" stroke-width="2"/>
            
            <!-- 기판 모서리 라운딩 및 테두리 -->
            <rect x="0" y="0" width="${width}" height="${height}" rx="3" fill="none" stroke="#5c3f21" stroke-width="0.8" opacity="0.5"/>
            
            <!-- 기판 크기 안내 워터마크 -->
            <text x="200" y="215" font-size="28" fill="#a4774c" opacity="0.25" font-weight="900" text-anchor="middle" letter-spacing="4">400 × 420 mm</text>
          </g>

          <!-- 제도선 레이어 (샤프/분필로 그은 선) -->
          <g id="drafting-lines-layer"></g>

          <!-- 치수선 및 치수 화살표 레이어 -->
          <g id="dimension-lines-layer"></g>

          <!-- 부품 배치 레이어 -->
          <g id="components-layer"></g>

          <!-- 마스킹 테이프 라벨 레이어 -->
          <g id="masking-tape-layer"></g>

          <!-- 단자대 핀 마킹 레이어 (배관도 기반 상/하단 핀 이름표) -->
          <g id="terminal-markings-layer"></g>

          <!-- 자 및 연필 애니메이션 툴 레이어 -->
          <g id="tool-animation-layer"></g>
        </svg>
      </div>
    `;
  }

  /**
   * 1단계 세부 스텝 1: 기판 제도 (치수선 및 가이드라인 긋기)
   */
  async drawDraftingLines(animated = true) {
    const linesLayer = document.getElementById('drafting-lines-layer');
    const dimLayer = document.getElementById('dimension-lines-layer');
    linesLayer.innerHTML = '';
    dimLayer.innerHTML = '';

    if (!animated) {
      this.renderFullDraftingLines();
      return;
    }

    // 단계별 연필 애니메이션으로 선 긋기 시연
    this.updateGuideMessage("📐 <b>[1단계 제도] 가로선 & 좌우 50mm 세로선 긋기</b>: 가로선(50-95-130-95-50)과 양쪽 끝 <b>50mm 기구 한계선(X=50, X=350)</b> 및 <b>50mm 중간 전선통로선(X=25, X=375)</b>을 긋습니다!");
    
    // 1. Y 가이드선(가로선) 차례대로 그리기
    const targets = [50, 145, 275, 370];
    for (let i = 0; i < targets.length; i++) {
      const y = targets[i];
      await this.animateDrawLine(0, y, 400, y, '#2563eb', 1.2, `가이드선 Y=${y}mm`);
      this.playBeep(440 + i * 60, 0.05, 'triangle');
    }

    // 2. 좌우 50mm 기구 한계선 (세로선 X=50, X=350)
    await this.animateDrawLine(50, 0, 50, 420, '#10b981', 1.5, '좌측 기구 한계선 X=50mm');
    this.playBeep(650, 0.06, 'triangle');

    await this.animateDrawLine(350, 0, 350, 420, '#10b981', 1.5, '우측 기구 한계선 X=350mm');
    this.playBeep(650, 0.06, 'triangle');

    // 3. 50mm 중간(25mm 지점) 전선 통로 중심선 (X=25, X=375)
    await this.animateDrawLine(25, 0, 25, 420, '#f59e0b', 1.0, '좌측 배선 통로 X=25mm', '4,3');
    this.playBeep(750, 0.06, 'sine');

    await this.animateDrawLine(375, 0, 375, 420, '#f59e0b', 1.0, '우측 배선 통로 X=375mm', '4,3');
    this.playBeep(750, 0.06, 'sine');

    // 4. 중앙 세로 기준선 그리기
    await this.animateDrawLine(200, 20, 200, 400, '#64748b', 0.8, '중심선 X=200mm', '3,3');
    this.playBeep(850, 0.07, 'sine');

    // 치수 보조선 및 화살표 표시
    this.renderDimensionArrows();
    this.currentSubStep = 1;
    this.updateGuideMessage("✅ <b>제도 완성!</b> 양쪽 끝 50mm 초록색 선 안쪽으로만 기구가 배치되며, <b>50mm 중간 주황색 점선(25mm)</b>으로 전선들이 지나가게 됩니다!");
  }

  animateDrawLine(x1, y1, x2, y2, stroke, width, title, dash = null) {
    return new Promise((resolve) => {
      const linesLayer = document.getElementById('drafting-lines-layer');
      const toolLayer = document.getElementById('tool-animation-layer');
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x1);
      line.setAttribute('y2', y1);
      line.setAttribute('stroke', stroke);
      line.setAttribute('stroke-width', width);
      if (dash) line.setAttribute('stroke-dasharray', dash);
      linesLayer.appendChild(line);

      toolLayer.innerHTML = `
        <g id="pencil" transform="translate(${x1}, ${y1})">
          <polygon points="0,0 -4,-18 4,-18" fill="#f59e0b" stroke="#b45309" stroke-width="0.5"/>
          <polygon points="0,0 -1.5,-6 1.5,-6" fill="#1f2937"/>
          <rect x="-4" y="-30" width="8" height="12" fill="#ef4444" rx="1"/>
        </g>
      `;

      const duration = 350 / this.speed;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        const curX = x1 + (x2 - x1) * progress;
        const curY = y1 + (y2 - y1) * progress;

        line.setAttribute('x2', curX);
        line.setAttribute('y2', curY);

        const pencil = document.getElementById('pencil');
        if (pencil) {
          pencil.setAttribute('transform', `translate(${curX}, ${curY})`);
        }

        if (progress < 1.0) {
          requestAnimationFrame(animate);
        } else {
          toolLayer.innerHTML = '';
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  renderDimensionArrows() {
    const dimLayer = document.getElementById('dimension-lines-layer');
    dimLayer.innerHTML = '';

    // 1. 좌측 세로 치수선 (50, 95, 130, 95, 50)
    const segments = [
      { start: 0, end: 50, val: 50, note: "상단 여백" },
      { start: 50, end: 145, val: 95, note: "단자대 ↔ 1열 기구" },
      { start: 145, end: 275, val: 130, note: "1열 기구 ↔ 2열 기구" },
      { start: 275, end: 370, val: 95, note: "2열 기구 ↔ 하단 단자대" },
      { start: 370, end: 420, val: 50, note: "하단 여백" }
    ];

    const dimX = -25; // 기판 좌측 25mm 지점

    segments.forEach(seg => {
      dimLayer.innerHTML += `
        <line x1="-5" y1="${seg.start}" x2="${dimX - 12}" y2="${seg.start}" stroke="#ef4444" stroke-width="0.6" stroke-dasharray="2,2"/>
        <line x1="-5" y1="${seg.end}" x2="${dimX - 12}" y2="${seg.end}" stroke="#ef4444" stroke-width="0.6" stroke-dasharray="2,2"/>
        
        <line x1="${dimX}" y1="${seg.start + 3}" x2="${dimX}" y2="${seg.end - 3}" 
              stroke="#ef4444" stroke-width="1.2" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)"/>
        
        <g transform="translate(${dimX - 18}, ${(seg.start + seg.end) / 2})">
          <rect x="-12" y="-6" width="24" height="12" rx="3" fill="#ef4444" />
          <text x="0" y="3" font-size="8" fill="#ffffff" font-weight="900" text-anchor="middle" font-family="sans-serif">${seg.val}</text>
        </g>
      `;
    });

    // 2. 상단 전체 가로 치수선 (400mm)
    dimLayer.innerHTML += `
      <line x1="0" y1="-12" x2="0" y2="-28" stroke="#0284c7" stroke-width="0.6"/>
      <line x1="400" y1="-12" x2="400" y2="-28" stroke="#0284c7" stroke-width="0.6"/>
      <line x1="4" y1="-22" x2="396" y2="-22" stroke="#0284c7" stroke-width="1.2" 
            marker-start="url(#arrow-start)" marker-end="url(#arrow-end)"/>
      <g transform="translate(200, -22)">
        <rect x="-24" y="-7" width="48" height="14" rx="3" fill="#0284c7"/>
        <text x="0" y="3.5" font-size="9" fill="#ffffff" font-weight="900" text-anchor="middle">400 mm</text>
      </g>
    `;

    // 3. 상단 세부 가로 치수선 (50mm 여백 - 300mm 기구영역 - 50mm 여백)
    dimLayer.innerHTML += `
      <!-- 좌측 50mm 치수 -->
      <line x1="50" y1="-4" x2="50" y2="-16" stroke="#10b981" stroke-width="0.6"/>
      <line x1="3" y1="-10" x2="47" y2="-10" stroke="#10b981" stroke-width="1" marker-start="url(#arrow-green-start)" marker-end="url(#arrow-green)"/>
      <g transform="translate(25, -10)">
        <rect x="-10" y="-5" width="20" height="10" rx="2" fill="#10b981"/>
        <text x="0" y="2.5" font-size="6.5" fill="#ffffff" font-weight="bold" text-anchor="middle">50</text>
      </g>

      <!-- 중앙 300mm 기구 배치 영역 -->
      <line x1="350" y1="-4" x2="350" y2="-16" stroke="#10b981" stroke-width="0.6"/>
      <line x1="53" y1="-10" x2="347" y2="-10" stroke="#10b981" stroke-width="1" marker-start="url(#arrow-green-start)" marker-end="url(#arrow-green)"/>
      <g transform="translate(200, -10)">
        <rect x="-35" y="-5.5" width="70" height="11" rx="2" fill="#10b981"/>
        <text x="0" y="2.5" font-size="6.5" fill="#ffffff" font-weight="bold" text-anchor="middle">기구 배치 영역 (300mm)</text>
      </g>

      <!-- 우측 50mm 치수 -->
      <line x1="353" y1="-10" x2="397" y2="-10" stroke="#10b981" stroke-width="1" marker-start="url(#arrow-green-start)" marker-end="url(#arrow-green)"/>
      <g transform="translate(375, -10)">
        <rect x="-10" y="-5" width="20" height="10" rx="2" fill="#10b981"/>
        <text x="0" y="2.5" font-size="6.5" fill="#ffffff" font-weight="bold" text-anchor="middle">50</text>
      </g>

      <!-- 50mm 중간(25mm, 375mm) 배선 통로 라벨 -->
      <g transform="translate(25, -2)">
        <text x="0" y="0" font-size="4.5" fill="#f59e0b" font-weight="900" text-anchor="middle">▼배선로(25)</text>
      </g>
      <g transform="translate(375, -2)">
        <text x="0" y="0" font-size="4.5" fill="#f59e0b" font-weight="900" text-anchor="middle">▼배선로(25)</text>
      </g>
    `;

    // 4. 우측 전체 세로 치수선 (420mm)
    dimLayer.innerHTML += `
      <line x1="405" y1="0" x2="425" y2="0" stroke="#0284c7" stroke-width="0.6"/>
      <line x1="405" y1="420" x2="425" y2="420" stroke="#0284c7" stroke-width="0.6"/>
      <line x1="420" y1="4" x2="420" y2="416" stroke="#0284c7" stroke-width="1.2"
            marker-start="url(#arrow-start)" marker-end="url(#arrow-end)"/>
      <g transform="translate(420, 210)">
        <rect x="-7" y="-20" width="14" height="40" rx="3" fill="#0284c7"/>
        <text x="0" y="3" font-size="9" fill="#ffffff" font-weight="900" text-anchor="middle" transform="rotate(90, 0, 0)">420 mm</text>
      </g>
    `;
  }

  renderFullDraftingLines() {
    const linesLayer = document.getElementById('drafting-lines-layer');
    linesLayer.innerHTML = `
      <!-- 가로 가이드선 (Y=50, 145, 275, 370) -->
      <line x1="0" y1="50" x2="400" y2="50" stroke="#2563eb" stroke-width="1.2" />
      <line x1="0" y1="145" x2="400" y2="145" stroke="#2563eb" stroke-width="1.2" />
      <line x1="0" y1="275" x2="400" y2="275" stroke="#2563eb" stroke-width="1.2" />
      <line x1="0" y1="370" x2="400" y2="370" stroke="#2563eb" stroke-width="1.2" />
      
      <!-- 좌우 50mm 기구 한계 세로선 (X=50, X=350) -->
      <line x1="50" y1="0" x2="50" y2="420" stroke="#10b981" stroke-width="1.5" />
      <line x1="350" y1="0" x2="350" y2="420" stroke="#10b981" stroke-width="1.5" />
      
      <!-- 50mm 중간 배선 통로선 (X=25, X=375) -->
      <line x1="25" y1="0" x2="25" y2="420" stroke="#f59e0b" stroke-width="1.0" stroke-dasharray="4,3" />
      <line x1="375" y1="0" x2="375" y2="420" stroke="#f59e0b" stroke-width="1.0" stroke-dasharray="4,3" />

      <!-- 중앙 세로 기준선 -->
      <line x1="200" y1="20" x2="200" y2="400" stroke="#64748b" stroke-width="0.8" stroke-dasharray="3,3" />
    `;
    this.renderDimensionArrows();
    this.currentSubStep = 1;
  }

  /**
   * 1단계 세부 스텝 2: 기구 부착 (소켓, 차단기, 퓨즈, 단자대 나사 고정)
   */
  async mountComponents(animated = true) {
    if (this.currentSubStep < 1) {
      this.renderFullDraftingLines();
    }

    const compLayer = document.getElementById('components-layer');
    compLayer.innerHTML = '';

    const components = this.problem.board.components;

    this.updateGuideMessage("🔩 <b>[2단계] 기구 부착하기</b>: 좌우 <b>50mm 초록색 한계선 안쪽(300mm 공간)</b>에 단자대, 12핀/8핀 소켓, MCCB, 퓨즈홀더를 나사로 고정합니다. (기구가 50mm 선을 넘지 않으며, <b>홈 방향: 반드시 아래쪽!</b>)");

    if (!animated) {
      components.forEach(comp => {
        compLayer.innerHTML += this.renderComponentHtml(comp);
      });
      this.currentSubStep = 2;
      return;
    }

    // 순차적으로 부품을 딸깍! 소리와 함께 부착
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      const compHtml = this.renderComponentHtml(comp);
      
      const tempGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      tempGroup.innerHTML = compHtml;
      const element = tempGroup.firstElementChild;
      
      // 애니메이션: 위에서 쏙 내려오는 느낌
      element.style.opacity = '0';
      element.style.transform = 'scale(0.85) translateY(-10px)';
      element.style.transition = 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
      compLayer.appendChild(element);

      // 리플로우 강제
      element.getBoundingClientRect();
      element.style.opacity = '1';
      element.style.transform = 'scale(1) translateY(0)';

      this.playBeep(520 + (i % 5) * 60, 0.08, 'square');
      await new Promise(r => setTimeout(r, 260 / this.speed));
    }

    this.currentSubStep = 2;
  }

  renderComponentHtml(comp) {
    switch (comp.type) {
      case 'socket_12p':
        return SvgSymbols.createSocket12P(comp);
      case 'socket_8p':
        return SvgSymbols.createSocket8P(comp);
      case 'mccb':
        return SvgSymbols.createMCCB(comp);
      case 'fuse_holder':
        return SvgSymbols.createFuseHolder(comp);
      case 'terminal_block_20p':
        return SvgSymbols.createTerminalBlock20P(comp);
      default:
        return '';
    }
  }

  /**
   * 1단계 세부 스텝 3: 마스킹 테이프 네이밍 라벨 부착
   */
  async applyMaskingTape(animated = true) {
    if (this.currentSubStep < 2) {
      await this.mountComponents(false);
    }

    const tapeLayer = document.getElementById('masking-tape-layer');
    tapeLayer.innerHTML = '';

    const components = this.problem.board.components;

    this.updateGuideMessage("🏷️ <b>[3단계] 마스킹 테이프 이름표 부착</b>: 실제 실기 시험처럼 부품 위에 종이테이프를 붙이고 유성매직으로 기구 이름을 크게 적어둡니다. (배선할 때 헷갈림 완전 방지!)");

    if (!animated) {
      components.forEach(comp => {
        tapeLayer.innerHTML += SvgSymbols.createMaskingTape(comp);
      });
      this.currentSubStep = 3;
      return;
    }

    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      const tapeHtml = SvgSymbols.createMaskingTape(comp);
      const tempGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      tempGroup.innerHTML = tapeHtml;
      const element = tempGroup.firstElementChild;
      
      element.style.opacity = '0';
      element.style.transform = 'scale(1.2)';
      element.style.transition = 'all 0.2s ease-out';
      tapeLayer.appendChild(element);

      element.getBoundingClientRect();
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';

      this.playBeep(700 + (i * 30), 0.05, 'sine');
      await new Promise(r => setTimeout(r, 180 / this.speed));
    }

    this.currentSubStep = 3;
    this.updateGuideMessage("🎉 <b>1단계 완성!</b> 400×420 기판에 치수선을 정확히 긋고, 모든 기구를 바른 방향으로 부착하고 이름표까지 달았습니다. 이제 다음 단계(주회로 배선)로 넘어갈 준비가 완료되었습니다!");
  }

  /**
   * 1단계 세부 스텝 4: 배관도 기반 단자대(TB5, TB6) 핀 마킹 (핵심 꿀팁!)
   */
  async markTerminalBlocks(animated = true) {
    if (this.currentSubStep < 2) {
      await this.mountComponents(false);
    }

    const markLayer = document.getElementById('terminal-markings-layer');
    markLayer.innerHTML = '';

    const { tb5, tb6 } = this.problem.board.terminalMarkings;
    const tb5Comp = this.problem.board.components.find(c => c.id === 'TB5');
    const tb6Comp = this.problem.board.components.find(c => c.id === 'TB6');

    // 묶음별 핀 이름 요약 (과제 데이터에서)
    const summary = (list) => {
      const out = [];
      list.filter(m => m.group !== 'empty').forEach(m => {
        const last = out[out.length - 1];
        if (last && last.group === m.group) last.labels.push(m.label); else out.push({ group: m.group, labels: [m.label] });
      });
      return out.map(g => g.labels.join(', ')).join(' / ');
    };
    const tm = this.problem.board.terminalMarkings;
    this.updateGuideMessage(`✍️ <b>[4단계 단자대 마킹] 배관도 기반 상·하단 핀 이름 쓰기</b>: 배관도를 보고 <b>상단(${summary(tm.tb5)})</b> 및 <b>하단(${summary(tm.tb6)})</b> 위치를 네임펜으로 미리 적어둡니다!`);

    const renderMarksForTB = (tbComp, markings, isTop = true) => {
      let html = '';
      const left = tbComp.x - tbComp.width / 2;
      const pinPitch = (tbComp.width - 16) / 19;
      // 단자대 바깥쪽 묶음 박스 안에 핀 이름을 핀 바로 위(아래)에 한 번만 표기
      // (나사 위에 따로 붙이면 전선이 지나간 뒤 가려지고, 묶음 이름과 중복되므로 박스 하나로 통합)
      const pinX = (pin) => left + 8 + (pin - 1) * pinPitch;
      const edgeY = isTop ? (tbComp.y - tbComp.height / 2) : (tbComp.y + tbComp.height / 2);   // 단자대 바깥 테두리
      const boxY = isTop ? tbComp.y - 32 : tbComp.y + 21;   // 묶음 박스 위쪽 y
      const BOX_H = 11;
      const KEC_FILL = { L1: '#92400e', U1: '#92400e', U2: '#92400e', L2: '#1e293b', V1: '#1e293b', V2: '#1e293b',
        L3: '#64748b', W1: '#64748b', W2: '#64748b', PE: '#65a30d' };
      const BRACKET_COLORS = { TB1: '#e11d48', TB2: '#3b82f6', TB3: '#a855f7', TB4: '#06b6d4' };

      // 연속된 같은 묶음(group)을 찾아 박스 하나로 (과제별 자동)
      const groups = [];
      markings.forEach(m => {
        if (m.group === 'empty' || m.label === '-') return;
        const last = groups[groups.length - 1];
        if (last && last.key === m.group && last.pEnd === m.pin - 1) {
          last.pEnd = m.pin;
          last.pins.push(m);
        } else {
          groups.push({ key: m.group, pStart: m.pin, pEnd: m.pin, pins: [m], color: BRACKET_COLORS[m.group] || m.color });
        }
      });

      groups.forEach(g => {
        const xStart = pinX(g.pStart) - pinPitch / 2 + 0.4;
        const xEnd = pinX(g.pEnd) + pinPitch / 2 - 0.4;
        const isTB = /^TB\d$/.test(g.key);
        let cells = '';
        g.pins.forEach(m => {
          const px = pinX(m.pin);
          const kec = KEC_FILL[m.label];
          const cellFill = kec || '#ffffff';
          const textColor = kec ? '#ffffff' : '#0f172a';
          // 박스 ➜ 단자대 테두리까지 핀 지시선 (단자대 바깥이라 전선에 가리지 않음)
          const y1 = isTop ? boxY + BOX_H : boxY;
          cells += `
            <line class="terminal-pin-lead" x1="${px}" y1="${y1}" x2="${px}" y2="${edgeY}" stroke="${kec || g.color}" stroke-width="0.9" />
            <g class="terminal-pin-mark" data-pin="${m.pin}" data-group="${m.group}">
              <rect x="${px - pinPitch / 2 + 1.1}" y="${boxY + 1.6}" width="${pinPitch - 2.2}" height="${BOX_H - 3.2}" rx="1.2"
                    fill="${cellFill}" opacity="${kec ? 1 : 0.95}" />
              <text x="${px}" y="${boxY + BOX_H / 2 + 1.5}" font-size="${m.label.length > 3 ? 3.1 : 4}" fill="${textColor}"
                    font-family="'Pretendard', sans-serif" font-weight="900" text-anchor="middle">${m.label}</text>
            </g>`;
        });
        // TB 묶음은 핀 이름만으로는 구분이 안 되므로 바깥쪽에 이름표 (진한 색 바탕 + 크고 굵은 흰 글씨)
        const TAB_DARK = { TB1: '#9f1239', TB2: '#1e40af', TB3: '#6b21a8', TB4: '#0e7490' };
        const tabW = 22;
        const tabH = 9;
        const tabY = isTop ? boxY - tabH + 0.6 : boxY + BOX_H - 0.6;
        const tab = isTB ? `
            <rect x="${(xStart + xEnd) / 2 - tabW / 2}" y="${tabY}" width="${tabW}" height="${tabH}" rx="2" fill="${TAB_DARK[g.key] || g.color}" stroke="#ffffff" stroke-width="0.5" />
            <text x="${(xStart + xEnd) / 2}" y="${tabY + tabH / 2 + 2}" font-size="5.6" fill="#ffffff" font-weight="900" text-anchor="middle" letter-spacing="0.2">${g.key === 'TB1' ? '⚡TB1' : g.key}</text>` : '';
        html += `
          <g class="pipe-group-bracket" data-group="${g.key}" opacity="0.97">
            ${tab}
            <rect x="${xStart}" y="${boxY}" width="${xEnd - xStart}" height="${BOX_H}" rx="2"
                  fill="${g.color}" stroke="#ffffff" stroke-width="0.4" filter="url(#shadow-sm)" />
            ${cells}
          </g>`;
      });

      return html;
    };

    if (!animated) {
      markLayer.innerHTML = renderMarksForTB(tb5Comp, tb5, true) + renderMarksForTB(tb6Comp, tb6, false);
      this.currentSubStep = 4;
      return;
    }

    // 순차 애니메이션으로 상단, 하단 마킹 표시
    markLayer.innerHTML = renderMarksForTB(tb5Comp, tb5, true);
    this.playBeep(600, 0.1, 'triangle');
    await new Promise(r => setTimeout(r, 400 / this.speed));

    markLayer.innerHTML += renderMarksForTB(tb6Comp, tb6, false);
    this.playBeep(750, 0.12, 'sine');

    this.currentSubStep = 4;
    this.updateGuideMessage("🎉 <b>1단계 최종 완성!</b> 400×420 기판 제도, 기구 부착, 마스킹 테이프 이름표, 그리고 <b>배관도와 연결되는 상·하단 단자대 핀 마킹</b>까지 완벽하게 준비되었습니다!");
  }

  /**
   * 1단계 전체 자동 실행 (Play All)
   */
  async playAll() {
    this.isPlaying = true;
    await this.drawDraftingLines(true);
    await new Promise(r => setTimeout(r, 500 / this.speed));
    await this.mountComponents(true);
    await new Promise(r => setTimeout(r, 500 / this.speed));
    await this.applyMaskingTape(true);
    await new Promise(r => setTimeout(r, 500 / this.speed));
    await this.markTerminalBlocks(true);
    this.isPlaying = false;
  }

  /**
   * 초기화 (깨끗한 판으로 리셋)
   */
  reset() {
    this.currentSubStep = 0;
    document.getElementById('drafting-lines-layer').innerHTML = '';
    document.getElementById('dimension-lines-layer').innerHTML = '';
    document.getElementById('components-layer').innerHTML = '';
    document.getElementById('masking-tape-layer').innerHTML = '';
    document.getElementById('terminal-markings-layer').innerHTML = '';
    document.getElementById('tool-animation-layer').innerHTML = '';
    this.updateGuideMessage("🪵 <b>초기 상태</b>: 가로 400mm × 세로 420mm 깨끗한 미송 제어판입니다. 아래 <b>'1. 치수선 긋기'</b> 버튼을 눌러 작업을 시작해 보세요!");
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
