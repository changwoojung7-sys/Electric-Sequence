/**
 * Stage 2: 제어판 주회로 결선 엔진 (Main Circuit Wiring Simulator)
 * - KEC 4색 전선: L1(갈색), L2(흑색), L3(회색), PE(녹황색 접지)
 * - 6단계 순차 애니메이션 및 직각 배선(칼각 배선) 렌더링
 * - 상별 필터(L1/L2/L3/PE) 및 실시간 가이드 꿀팁 연동
 */
import { getAudioContext } from '../components/audio.js';

export class Stage2MainCircuit {
  constructor(boardSvg, problemData) {
    this.svg = boardSvg;
    this.problem = problemData;
    this.speed = 1.0;
    this.currentStep = 0; // 0 ~ 6
    this.isPlaying = false;
    this.activeFilter = 'ALL'; // ALL, L1, L2, L3, PE
    this.audioContext = null;
    this.init();
  }

  init() {
    this.setupAudio();
    this.ensureWireLayer();
  }

  setupAudio() {
    this.audioContext = getAudioContext();
  }

  playWireSound(freq = 480, duration = 0.08) {
    if (!this.audioContext) return;
    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      // ignore
    }
  }

  ensureWireLayer() {
    let wireLayer = document.getElementById('main-circuit-wire-layer');
    if (!wireLayer) {
      wireLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wireLayer.setAttribute('id', 'main-circuit-wire-layer');
      // 툴 레이어 아래, 기구 레이어 위에 배치
      const toolLayer = document.getElementById('tool-animation-layer');
      if (toolLayer) {
        this.svg.insertBefore(wireLayer, toolLayer);
      } else {
        this.svg.appendChild(wireLayer);
      }
    }
  }

  /**
   * 점 배열([[x1, y1], [x2, y2], ...])을 SVG path d 문자열로 변환
   */
  pointsToPathD(points) {
    if (!points || points.length === 0) return '';
    return points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt[0]} ${pt[1]}` : `${acc} L ${pt[0]} ${pt[1]}`;
    }, '');
  }

  /**
   * 전선 요소 SVG HTML 생성 (외곽선 + 메인피복선 + 하이라이트 + 접지선 스트라이프)
   */
  createWireElement(wire, isAnimated = true) {
    const d = this.pointsToPathD(wire.points);
    const isPE = wire.phase === 'PE';
    const wireId = `wire-${wire.id}`;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', wireId);
    g.setAttribute('class', `main-circuit-wire phase-${wire.phase}`);
    g.setAttribute('data-phase', wire.phase);
    g.setAttribute('data-step', wire.step || 1);

    // 1. 단자 터미널 링 (시작점 & 끝점)
    const startPt = wire.points[0];
    const endPt = wire.points[wire.points.length - 1];

    // 2. 전선 외곽선 (그림자/외피 테두리)
    const pathBg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathBg.setAttribute('d', d);
    pathBg.setAttribute('fill', 'none');
    pathBg.setAttribute('stroke', '#090d16');
    pathBg.setAttribute('stroke-width', '3.8');
    pathBg.setAttribute('stroke-linecap', 'round');
    pathBg.setAttribute('stroke-linejoin', 'round');
    pathBg.setAttribute('opacity', '0.6');
    g.appendChild(pathBg);

    // 3. 메인 전선 피복 (2.5mm² 규격 두께 2.8)
    const pathMain = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathMain.setAttribute('d', d);
    pathMain.setAttribute('fill', 'none');
    pathMain.setAttribute('stroke', wire.color);
    pathMain.setAttribute('stroke-width', '2.8');
    pathMain.setAttribute('stroke-linecap', 'round');
    pathMain.setAttribute('stroke-linejoin', 'round');
    pathMain.setAttribute('class', 'wire-main-path');
    g.appendChild(pathMain);

    // 4. PE 접지선일 경우 노란색 줄무늬(Stripe) 오버레이
    if (isPE) {
      const pathStripe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathStripe.setAttribute('d', d);
      pathStripe.setAttribute('fill', 'none');
      pathStripe.setAttribute('stroke', wire.stripe || '#eab308');
      pathStripe.setAttribute('stroke-width', '2.8');
      pathStripe.setAttribute('stroke-linecap', 'round');
      pathStripe.setAttribute('stroke-linejoin', 'round');
      pathStripe.setAttribute('stroke-dasharray', '5, 5');
      g.appendChild(pathStripe);
    }

    // 5. 입체 전선 하이라이트 (중앙 은은한 광택선)
    if (!isPE && wire.phase !== 'L2') {
      const pathHi = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathHi.setAttribute('d', d);
      pathHi.setAttribute('fill', 'none');
      pathHi.setAttribute('stroke', '#ffffff');
      pathHi.setAttribute('stroke-width', '0.6');
      pathHi.setAttribute('stroke-linecap', 'round');
      pathHi.setAttribute('stroke-linejoin', 'round');
      pathHi.setAttribute('opacity', '0.35');
      g.appendChild(pathHi);
    }

    // 6. 시작점과 끝점에 압착단자(O형 금속 러그)
    [startPt, endPt].forEach(pt => {
      const lug = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      lug.setAttribute('cx', pt[0]);
      lug.setAttribute('cy', pt[1]);
      lug.setAttribute('r', '2.2');
      lug.setAttribute('fill', '#cbd5e1');
      lug.setAttribute('stroke', '#475569');
      lug.setAttribute('stroke-width', '0.5');
      g.appendChild(lug);
    });

    return g;
  }

  /**
   * 전선 애니메이션으로 그리기 (stroke-dashoffset 활용)
   */
  async animateWire(wire) {
    const wireLayer = document.getElementById('main-circuit-wire-layer');
    if (!wireLayer) return;

    const wireElem = this.createWireElement(wire, true);
    wireLayer.appendChild(wireElem);

    // 모든 패스에 대해 애니메이션 적용
    const paths = wireElem.querySelectorAll('path');
    const firstPath = paths[0];
    const length = firstPath.getTotalLength();

    paths.forEach(p => {
      p.style.strokeDasharray = `${length} ${length}`;
      p.style.strokeDashoffset = length;
      p.getBoundingClientRect(); // 강제 리플로우
      const duration = Math.max(0.2, (length / 180) / this.speed);
      p.style.transition = `stroke-dashoffset ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`;
      p.style.strokeDashoffset = '0';
    });

    this.playWireSound(wire.phase === 'PE' ? 520 : 440, 0.08);

    const animDuration = Math.max(200, (length / 180 / this.speed) * 1000);
    await new Promise(r => setTimeout(r, animDuration + 40));

    // 애니메이션 후 transition 제거
    paths.forEach(p => {
      if (wire.phase === 'PE' && p.getAttribute('stroke') === (wire.stripe || '#eab308')) {
        p.style.strokeDasharray = '5, 5';
      } else {
        p.style.strokeDasharray = 'none';
      }
      p.style.transition = 'none';
    });
  }

  /**
   * 특정 세부 스텝 (1 ~ 6) 결선 실행
   */
  async runStep(stepNumber, animated = true) {
    this.ensureWireLayer();
    const stepsData = this.problem.board.mainCircuit.steps;
    const stepData = stepsData.find(s => s.step === stepNumber);
    if (!stepData) return;

    // 안내 메시지 업데이트
    this.updateGuideMessage(`⚡ <b>[2단계 주회로: ${stepData.name}]</b><br>${stepData.desc}<br><span style="color: #facc15; font-size: 12px; margin-top: 4px; display: inline-block;">${stepData.tip}</span>`);

    if (!animated) {
      stepData.wires.forEach(wire => {
        wire.step = stepNumber;
        const elem = this.createWireElement(wire, false);
        document.getElementById('main-circuit-wire-layer')?.appendChild(elem);
      });
      this.currentStep = stepNumber;
      this.applyFilter(this.activeFilter);
      return;
    }

    for (const wire of stepData.wires) {
      wire.step = stepNumber;
      await this.animateWire(wire);
      await new Promise(r => setTimeout(r, 80 / this.speed));
    }

    this.currentStep = stepNumber;
    this.applyFilter(this.activeFilter);
  }

  /**
   * 1번부터 stepNumber까지 누적 실행
   */
  async runUpToStep(stepNumber, animated = true) {
    this.clearWires();
    for (let i = 1; i <= stepNumber; i++) {
      await this.runStep(i, animated);
    }
  }

  /**
   * 주회로 전체 자동 시연 (Play All)
   */
  async playAll() {
    this.isPlaying = true;
    this.clearWires();
    const stepsData = this.problem.board.mainCircuit.steps;

    for (let i = 1; i <= stepsData.length; i++) {
      await this.runStep(i, true);
      await new Promise(r => setTimeout(r, 450 / this.speed));
    }

    this.isPlaying = false;
    this.updateGuideMessage(`🎉 <b>[2단계 주회로 결선 완료!]</b><br>KEC 4색 전선(L1 갈색, L2 흑색, L3 회색, PE 녹황색 접지선)으로 모든 주회로가 칼각(90도 직각 배선)으로 완벽하게 체결되었습니다!<br><span style="color: #38bdf8; font-weight: bold;">다음 3단계(핀번호 부여 & 그루핑)로 넘어갈 준비가 되었습니다!</span>`);
  }

  /**
   * 상별(Phase) 하이라이트 필터
   * phase: 'ALL' | 'L1' | 'L2' | 'L3' | 'PE'
   */
  applyFilter(phase) {
    this.activeFilter = phase;
    const wireLayer = document.getElementById('main-circuit-wire-layer');
    if (!wireLayer) return;

    const wires = wireLayer.querySelectorAll('.main-circuit-wire');
    wires.forEach(w => {
      const wirePhase = w.getAttribute('data-phase');
      if (phase === 'ALL' || wirePhase === phase) {
        w.style.opacity = '1';
        w.style.filter = phase === 'ALL' ? 'none' : 'drop-shadow(0 0 3px rgba(255,255,255,0.8))';
      } else {
        w.style.opacity = '0.12';
        w.style.filter = 'none';
      }
    });
  }

  /**
   * 주회로 전선만 깨끗하게 초기화
   */
  clearWires() {
    const wireLayer = document.getElementById('main-circuit-wire-layer');
    if (wireLayer) {
      wireLayer.innerHTML = '';
    }
    this.currentStep = 0;
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
