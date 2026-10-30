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

    // 결선이 끝나면 바로 구간별 도통 테스트
    await new Promise(r => setTimeout(r, 600 / this.speed));
    this.isPlaying = false;
    await this.runContinuityTest(true);
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
    this.testToken = (this.testToken || 0) + 1;   // 진행 중인 도통 테스트 중단
    const testLayer = document.getElementById('main-tester-layer');
    if (testLayer) testLayer.innerHTML = '';
    this.currentStep = 0;
  }

  // ---------------------------------------------------------------------------
  // 주회로 도통 테스트 (벨 테스터) — 결선 후 구간별로 확인
  // ---------------------------------------------------------------------------

  /** 벨 테스터 "삐-" 소리 */
  playBeep(duration = 0.35) {
    if (!this.audioContext) return;
    try {
      if (this.audioContext.state === 'suspended') this.audioContext.resume();
      const t = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.setValueAtTime(0.06, t + duration - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain).connect(this.audioContext.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {
      // ignore
    }
  }

  /**
   * 도통 테스트 구간 (과제 데이터의 결선에서 자동으로 만듦 — 18과제 공통 구조)
   * ① TB1 ➜ MCCB ➜ EOCR 1·2·3 (MCCB ON) ② 퓨즈 상단 갈·회 (MCCB ON)
   * ③ EOCR 7·8·9 ➜ MC1·MC2 1·2·3 ④ MC1 ➜ TB2, MC2 ➜ TB3 ⑤ 접지(PE)
   */
  buildContinuityTests() {
    const wires = this.problem.board.mainCircuit.steps.flatMap(s => s.wires);
    const key = (e) => `${e.comp}:${e.pin}`;
    const pt = {};
    const label = {};
    const clean = (t) => t.replace(/ ?나사 ?(좌측|우측)/, '');
    wires.forEach(w => {
      pt[key(w.from)] = pt[key(w.from)] || w.points[0];
      pt[key(w.to)] = pt[key(w.to)] || w.points[w.points.length - 1];
      label[key(w.from)] = label[key(w.from)] || clean(w.from.label);
      label[key(w.to)] = label[key(w.to)] || clean(w.to.label);
    });
    const end = (e) => ({ key: key(e), pt: pt[key(e)], label: label[key(e)] });
    const by = (fc, tc) => wires.filter(w => w.from.comp === fc && w.to.comp === tc);
    const tbIn = {};
    by('TB5', 'MCCB').forEach(w => { tbIn[w.phase] = w.from; });
    const pair = (a, b, phase) => ({ a: end(a), b: end(b), phase });
    const mc1in = by('EOCR', 'MC1');
    const mc12 = by('MC1', 'MC2');
    const peWires = wires.filter(w => w.phase === 'PE');
    const pe0 = peWires.find(w => w.from.comp === 'TB5')?.from;
    return [
      { title: '① TB1 ➜ MCCB ➜ EOCR (1·2·3)', mccb: true,
        tip: 'MCCB 레버를 <b>ON</b>으로 올려야 MCCB를 지나 EOCR까지 소리가 나요. (OFF면 MCCB에서 끊겨 소리 없음)',
        pairs: by('MCCB', 'EOCR').filter(w => tbIn[w.phase]).map(w => pair(tbIn[w.phase], w.to, w.phase)) },
      { title: '② 퓨즈 상단 (갈 · 회)', mccb: true,
        tip: 'TB1 L1(갈)·L3(회)에서 <b>퓨즈 1차(상단)</b>까지 — 제어회로 전원이 퓨즈까지 오는지 확인.',
        pairs: by('EOCR', 'F').filter(w => tbIn[w.phase]).map(w => pair(tbIn[w.phase], w.to, w.phase)) },
      { title: '③ EOCR 7·8·9 ➜ MC1 · MC2 (1·2·3)', mccb: false,
        tip: 'EOCR 출력(7·8·9)에서 MC1 1·2·3, 이어서 MC2 1·2·3까지 같은 상끼리 도통.',
        pairs: [
          ...mc1in.map(w => pair(w.from, w.to, w.phase)),
          ...mc1in.flatMap(w => mc12.filter(x => x.from.pin === w.to.pin).map(x => pair(w.from, x.to, w.phase)))
        ] },
      { title: '④ MC1 ➜ TB2 · MC2 ➜ TB3', mccb: false,
        tip: 'MC 2차(7·8·9)에서 전동기 단자대(TB2·TB3)까지. MC 주접점은 평소 <b>열려 있어서</b> EOCR에서 TB2까지 한 번에 찍으면 소리가 안 나요 — 그래서 구간을 나눠 테스트!',
        pairs: [...by('MC1', 'TB6'), ...by('MC2', 'TB6')].map(w => pair(w.from, w.to, w.phase)) },
      { title: '⑤ 접지(PE) TB1 ➜ 각 단자대 PE', mccb: false,
        tip: '녹황 접지선이 TB1 PE에서 각 단자대 PE까지 이어졌는지 확인.',
        pairs: pe0 ? peWires.map(w => pair(pe0, w.to, 'PE')) : [] }
    ].filter(sec => sec.pairs.length);
  }

  /** 실제로 깔린 전선(+ MCCB ON이면 1차↔2차)으로 이어진 단자 묶음 */
  connectivity(mccbOn) {
    const parent = {};
    const find = (k) => {
      if (parent[k] === undefined) parent[k] = k;
      return parent[k] === k ? k : (parent[k] = find(parent[k]));
    };
    const union = (a, b) => { parent[find(a)] = find(b); };
    const wires = this.problem.board.mainCircuit.steps.flatMap(s => s.wires);
    const installed = wires.filter(w => document.getElementById(`wire-${w.id}`));
    installed.forEach(w => union(`${w.from.comp}:${w.from.pin}`, `${w.to.comp}:${w.to.pin}`));
    if (mccbOn) [1, 2, 3].forEach(k => union(`MCCB:in-${k}`, `MCCB:out-${k}`));
    return { find, installed };
  }

  /**
   * 구간별 도통 테스트 실행: 빨강·검정 리드를 두 단자에 대고 이어졌으면 "삐-" + ✔, 아니면 ✖
   */
  async runContinuityTest(animated = true) {
    const token = this.testToken = (this.testToken || 0) + 1;
    const NS = 'http://www.w3.org/2000/svg';
    let layer = document.getElementById('main-tester-layer');
    if (!layer) {
      layer = document.createElementNS(NS, 'g');
      layer.setAttribute('id', 'main-tester-layer');
      const wl = document.getElementById('main-circuit-wire-layer');
      if (wl) wl.after(layer); else this.svg.appendChild(layer);
    }
    layer.innerHTML = '';
    this.applyFilter('ALL');
    const wait = (ms) => new Promise(r => setTimeout(r, animated ? ms / this.speed : 0));
    if (!document.querySelector('#main-circuit-wire-layer .main-circuit-wire')) {
      this.updateGuideMessage('🔔 <b>[주회로 도통 테스트]</b>: 아직 결선한 주회로가 없어요. 먼저 결선한 뒤 테스트하세요!');
      return;
    }
    const sections = this.buildContinuityTests();
    const mccb = this.problem.board.components.find(c => c.id === 'MCCB');
    const results = [];
    const lines = [];
    const show = (now) => this.updateGuideMessage(`🔔 <b>[2단계 주회로 도통 테스트]</b> ${now || ''}<br>${lines.join('<br>')}`);
    const probe = (p, color, left) => `
      <g transform="translate(${p[0]}, ${p[1]})">
        <circle r="5" fill="none" stroke="${color}" stroke-width="2" />
        <line x1="0" y1="-5" x2="${left ? -9 : 9}" y2="-17" stroke="${color}" stroke-width="2.6" stroke-linecap="round" />
        <circle cx="${left ? -10 : 10}" cy="-19" r="4" fill="${color}" stroke="#0f172a" stroke-width="0.8" />
      </g>`;

    lines.push('<span style="color:#94a3b8;">결선이 끝나면 <b>전원을 넣기 전에</b> 벨 테스터로 구간마다 도통(삐-)을 확인해요. 빨간 리드 = 출발 단자, 검정 리드 = 도착 단자.</span>');
    show();
    await wait(1200);

    for (const sec of sections) {
      if (token !== this.testToken) return;
      const { find, installed } = this.connectivity(sec.mccb);
      let badge = null;
      if (mccb) {
        badge = document.createElementNS(NS, 'g');
        badge.innerHTML = `<g transform="translate(${mccb.x}, ${mccb.y - mccb.height / 2 - 9})">
            <rect x="-22" y="-8" width="44" height="15" rx="7" fill="${sec.mccb ? '#16a34a' : '#475569'}" stroke="#0f172a" stroke-width="0.8" />
            <text y="3.5" text-anchor="middle" font-size="8" font-weight="900" fill="#ffffff">MCCB ${sec.mccb ? 'ON' : 'OFF'}</text></g>`;
        layer.appendChild(badge);
      }
      lines.push(`<b>${sec.title}</b> — <span style="color:#cbd5e1;">${sec.tip}</span>`);
      show();
      await wait(1100);
      const secRes = [];
      for (const pr of sec.pairs) {
        if (token !== this.testToken) return;
        const ok = find(pr.a.key) === find(pr.b.key);
        const g = document.createElementNS(NS, 'g');
        // 이어진 경로 전선 강조 (같은 묶음에 속한 같은 상의 전선)
        const glow = installed
          .filter(w => w.phase === pr.phase && find(`${w.from.comp}:${w.from.pin}`) === find(pr.a.key))
          .map(w => `<path d="${this.pointsToPathD(w.points)}" fill="none" stroke="#38bdf8" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" style="filter: drop-shadow(0 0 3px #38bdf8)" />`)
          .join('');
        g.innerHTML = `${ok ? glow : ''}${probe(pr.a.pt, '#ef4444', true)}${probe(pr.b.pt, '#111827', false)}`;
        layer.appendChild(g);
        if (ok && animated) this.playBeep(0.3);
        show(`${pr.a.label} ➜ ${pr.b.label} : ${ok ? '<b style="color:#4ade80;">삐- 도통 ✔</b>' : '<b style="color:#f87171;">소리 없음 ✖ (끊김)</b>'}`);
        await wait(750);
        g.remove();
        const mark = document.createElementNS(NS, 'g');
        mark.innerHTML = `<g transform="translate(${pr.b.pt[0] + 4}, ${pr.b.pt[1] - 6})"><circle r="4.2" fill="${ok ? '#16a34a' : '#dc2626'}" stroke="#ffffff" stroke-width="0.8" /><text y="2.6" text-anchor="middle" font-size="6" font-weight="900" fill="#ffffff">${ok ? '✔' : '✖'}</text></g>`;
        layer.appendChild(mark);
        secRes.push({ ...pr, ok });
        results.push(ok);
      }
      const nOk = secRes.filter(r => r.ok).length;
      const bad = secRes.filter(r => !r.ok).map(r => `${r.a.label} ➜ ${r.b.label}`);
      lines[lines.length - 1] = `${nOk === secRes.length ? '✅' : '❌'} <b>${sec.title}</b> ${nOk}/${secRes.length}${bad.length ? ` <span style="color:#f87171;">끊김: ${bad.join(', ')}</span>` : ''}`;
      show();
      if (badge) badge.remove();
      await wait(500);
    }
    if (token !== this.testToken) return;
    const okCount = results.filter(Boolean).length;
    this.lastContinuity = { ok: okCount, total: results.length };
    show(okCount === results.length
      ? `🎉 <b style="color:#4ade80;">${okCount}/${results.length} 모두 도통 OK!</b> 주회로 결선 완료 — 3단계 핀번호 & 그루핑으로 진행하세요.`
      : `⚠️ <b style="color:#f87171;">${results.length - okCount}곳 끊김</b> — 빨간 ✖ 표시 구간의 결선을 다시 확인하세요.`);
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
