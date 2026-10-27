/**
 * Stage 7: 전원 투입 & 시퀀스 동작 테스트 (Operation Simulator)
 * - 왼쪽: 시퀀스 도면 위에 전기가 흐르는 전위 그룹(①~⑮)·닫힌 접점·동작 중인 코일/램프를 실시간 표시
 * - 오른쪽: 조작반 — MCCB, 셀렉터(M/A), PB0·PB1(누르고 있는 동안), EOCR 트립·리셋, 수조 수위(FLS 전극),
 *           램프·부저(소리)·전동기 회전, 릴레이·타이머 상태, 동작 기록
 * - 회로는 problem.board.operation 데이터(접점·부하 목록)로만 계산 → 다른 과제도 데이터만 추가
 */
import { ensureGlobalDeviceDefs, pushButton, selectorSwitch, pilotLamp, buzzer, blankCap, nameplate, boxCover } from '../components/control_devices.js';
import { tbBlockGeometry } from '../components/tb_blocks.js';
import { getAudioContext, playRelayClick, playTimerChime, playButtonClick, playSelectorClick, playWaterAlert, playResetChime } from '../components/audio.js';

// 7단계 회로도 기본 보기 영역 (문제지 시퀀스 도면 1753×1240 중 회로 부분)
const DIAGRAM_VIEW = [60, 210, 1640, 690];
// 벽면 보기 기본 영역 (5·6단계 벽면 1800×1650)
const WALL_VIEW = [0, 0, 1800, 1650];
// 벽면에서 배전반(400×420) 왼쪽 위 좌표 (5단계 BOX_LEFT·BOX_TOP)
const WALL_PANEL = [700, 590];
const TICK_MS = 100;

// 1번 과제 기본 조작 박스 (문제 데이터 board.wall.boxes가 있으면 그 값을 사용)
const DEFAULT_BOXES = [
  { name: 'PB1/PB0', top: { type: 'pb-green', name: 'PB1 (기동)', input: 'pb1' }, bottom: { type: 'pb-red', name: 'PB0 (정지)', input: 'pb0' } },
  { name: 'SS/CAP', top: { type: 'selector', name: 'SS', input: 'ss' }, bottom: { type: 'cap', name: 'CAP' } },
  { name: 'RL/GL', top: { type: 'lamp-red', name: 'RL (MC1 운전)', load: 'RL' }, bottom: { type: 'lamp-green', name: 'GL (MC2 운전)', load: 'GL' } },
  { name: 'YL/BZ', top: { type: 'lamp-yellow', name: 'YL (경보)', load: 'YL' }, bottom: { type: 'buzzer', name: 'BZ (부저)', load: 'BZ' } }
];

export class Stage7Operation {
  constructor(container, problemData) {
    this.container = container;
    this.problem = problemData;
    this.op = problemData.board.operation;
    this.groupPaths = problemData.board.sequenceCircuit.groupPaths;
    this.boxes = problemData.board.wall?.boxes || DEFAULT_BOXES;
    this.seqImage = problemData.assets?.sequence || 'assets/images/sequence_diagram.png';
    this.speed = 1.0;
    this.runToken = 0;
    this.timer = null;
    this.buzzOsc = null;
    this.resetState();
    this.render();
    this.bindEvents();
  }

  // ---------------------------------------------------------------------------
  // 상태
  // ---------------------------------------------------------------------------

  resetState() {
    this.input = { power: false, ss: 'A', pb0: false, pb1: false, eocrTrip: false, level: 30, autoLevel: true };
    this.timerSet = this.op.timerSetSec;
    this.coil = {};
    this.energized = new Set();
    this.tStart = null;
    this.tDone = false;
    // 타이머가 여러 개인 과제(T1·T2) — 타이머별 여자 시각·동작 여부 (tStart·tDone은 첫 타이머)
    this.timerIds = this.op.loads.filter(l => l.kind === 'timer').map(l => l.id);
    this.timerStart = {};
    this.timerDone = {};
    this.prevTimerDone = {};
    // 리밋스위치 등 켜고 끄는 입력 (과제 데이터 operation.switches)
    (this.op.switches || []).forEach(sw => { this.input[sw.input] = false; });
    this.frStart = null;
    this.frPhase = false;
    this.flsOut = false;
    this.lastSigs = null;
    this.prevCoil = {};
    this.prevFls = false;
    this.events = [];
  }

  /** 접점이 닫혀 있는지 (데이터의 type으로 판단) */
  contactClosed(c) {
    const I = this.input;
    const C = this.coil;
    switch (c.type) {
      case 'eocr-nc': return !I.eocrTrip;
      case 'eocr-no': return I.eocrTrip;
      case 'selector': return I.ss === c.position;
      case 'input-nc': return !I[c.input];
      case 'input-no': return !!I[c.input];   // 누름버튼 NO · 리밋스위치 a접점
      case 'relay-no': return !!C[c.coil];
      case 'relay-nc': return !C[c.coil];
      case 'timer-no': return !!C[c.coil] && !!this.timerDone[c.coil];
      case 'timer-nc': return !(C[c.coil] && this.timerDone[c.coil]);   // 한시 b접점: 설정시간이 지나면 열림
      case 'flicker-no': return !!C[c.coil] && this.frPhase;
      case 'flicker-nc': return !(C[c.coil] && this.frPhase);
      case 'fls-no': return !!C[c.coil] && this.flsOut;
      default: return false;
    }
  }

  /**
   * 회로 계산: 전원(①)에서 닫힌 접점을 따라 전기가 오는 노드를 찾고, 그 노드의 코일·램프를 동작시킴
   * - 코일이 바뀌면 접점도 바뀌므로 안정될 때까지 반복
   */
  solve(now) {
    const { source, levels } = this.op;
    for (let iter = 0; iter < 12; iter++) {
      const en = new Set();
      if (this.input.power) {
        en.add(source);
        const queue = [source];
        while (queue.length) {
          const n = queue.shift();
          this.op.contacts.forEach(c => {
            if (!this.contactClosed(c)) return;
            const other = c.from === n ? c.to : (c.to === n ? c.from : null);
            if (other !== null && !en.has(other)) { en.add(other); queue.push(other); }
          });
        }
      }
      this.energized = en;

      let changed = false;
      this.op.loads.forEach(l => {
        const on = en.has(l.node);
        if (!!this.coil[l.id] !== on) { this.coil[l.id] = on; changed = true; }
      });

      // 타이머: 여자된 순간부터 설정 시간 경과 후 한시 접점 동작 (타이머마다 따로)
      let timerChanged = false;
      this.timerIds.forEach(id => {
        if (this.coil[id]) {
          if (this.timerStart[id] == null) this.timerStart[id] = now;
        } else {
          this.timerStart[id] = null;
        }
        const done = this.timerStart[id] != null && (now - this.timerStart[id]) >= this.timerSet * 1000;
        if (done !== !!this.timerDone[id]) timerChanged = true;
        this.timerDone[id] = done;
      });
      const first = this.timerIds[0];
      this.tStart = first ? this.timerStart[first] ?? null : null;
      const tDone = first ? !!this.timerDone[first] : false;
      // 플리커: 여자 중 일정 주기로 a/b 교대
      if (this.coil.FR) {
        if (this.frStart === null) this.frStart = now;
      } else {
        this.frStart = null;
      }
      // 여자 직후에는 출력 OFF ➜ b접점(BZ)이 먼저 동작하고, 설정 간격마다 a접점(YL)과 교대
      const frPhase = this.frStart !== null && Math.floor((now - this.frStart) / (this.op.flickerSec * 1000)) % 2 === 1;
      // 플로트리스: 수위가 E2 아래면 접점 닫힘, E1에 닿으면 열림 (그 사이는 이전 상태 유지)
      let flsOut = this.flsOut;
      if (!this.coil.FLS) flsOut = false;
      else if (this.input.level <= levels.E2) flsOut = true;
      else if (this.input.level >= levels.E1) flsOut = false;

      const derivedChanged = timerChanged || tDone !== this.tDone || frPhase !== this.frPhase || flsOut !== this.flsOut;
      this.tDone = tDone;
      this.frPhase = frPhase;
      this.flsOut = flsOut;
      if (!changed && !derivedChanged) break;
    }
  }

  /**
   * advance = true: 주기 타이머에서만 시간(수위) 진행, 버튼 조작 시에는 회로만 다시 계산
   */
  tick(advance = false) {
    const now = performance.now();
    const dt = TICK_MS / 1000 * this.speed;
    // 수위 자동 변화: 펌프 전동기 1대당 +4%/s 급수, 사용으로 -1.5%/s 감소
    // (M1만 돌면 천천히 차서 타이머 T가 끝나 M2까지 기동하는 모습을 볼 수 있음)
    if (advance && this.input.autoLevel && this.input.power) {
      const pumps = (this.coil.MC1 ? 1 : 0) + (this.coil.MC2 ? 1 : 0);
      this.input.level = Math.max(0, Math.min(100, this.input.level + (pumps * 4 - 1.5) * dt));
    }
    this.solve(now);
    this.reportTransitions();
    this.updateView();
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(true), TICK_MS);
    this.tick();
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.setBuzzer(false);
  }

  // ---------------------------------------------------------------------------
  // 안내 (상태가 바뀔 때 12세 눈높이 설명)
  // ---------------------------------------------------------------------------

  reportTransitions() {
    const on = (id) => this.coil[id] && !this.prevCoil[id];
    const off = (id) => !this.coil[id] && this.prevCoil[id];
    const msgs = [];
    this.playTransitionSounds(on, off);
    if (this.op.notes) {
      // 과제별 안내 문구 (문제 데이터)
      if (this.flsOut && !this.prevFls) msgs.push('💧 수위가 <b>E2(중봉) 아래</b> ➜ <b>FLS 접점(4-3) 닫힘</b>!');
      if (!this.flsOut && this.prevFls && this.coil.FLS) msgs.push('💧 물이 <b>E1(단봉)</b>까지 찼어요 ➜ <b>FLS 접점 열림</b> ➜ 운전 정지');
      this.op.loads.forEach(l => {
        const n = this.op.notes[l.id];
        if (!n) return;
        if (n.on && on(l.id)) msgs.push(n.on);
        if (n.off && off(l.id) && !this.input.eocrTrip) msgs.push(n.off);
      });
      this.prevCoil = { ...this.coil };
      this.prevFls = this.flsOut;
      msgs.forEach(m => this.logEvent(m));
      return;
    }
    if (on('FR')) msgs.push('⚠️ <b>EOCR 트립!</b> b접점(10-4)이 열려 <b>모든 운전 정지</b>, a접점(10-5)이 닫혀 <b>FR 플리커 동작</b> ➜ YL·BZ가 번갈아 울려요.');
    if (on('FLS')) msgs.push('🔌 <b>자동(A)</b>: SS-A ➜ <b>FLS(플로트리스)에 전원</b>이 들어갔어요. 수위를 감시합니다.');
    if (this.flsOut && !this.prevFls) msgs.push('💧 수위가 <b>E2(중봉) 아래</b> ➜ <b>FLS 접점(4-3) 닫힘</b> ➜ 릴레이 X에 전기가 가요!');
    if (!this.flsOut && this.prevFls && this.coil.FLS) msgs.push('💧 물이 <b>E1(단봉)</b>까지 찼어요 ➜ <b>FLS 접점 열림</b> ➜ X·MC1·T·MC2 모두 멈춰요.');
    if (on('X')) msgs.push('🔁 <b>X 여자</b> ➜ X a접점(1-3)으로 <b>MC1</b> 운전, X b접점(8-5)이 열려 <b>타이머 T는 동작하지 않아요</b>.');
    if (on('T')) msgs.push(`⏱️ <b>수동 운전</b>: PB1 ➜ X b접점(8-5) ➜ <b>타이머 T 여자</b>, T 순시 a접점(1-3)으로 <b>자기유지</b> (설정 <b>${this.timerSet}초</b>)`);
    if (on('MC1')) msgs.push('🟢 <b>MC1 여자</b> ➜ 전동기 <b>M1 운전</b>, 보조 a접점(4-10)으로 <b>RL(적색) 점등</b>');
    if (on('MC2')) msgs.push('🟢 T 설정 시간 경과 ➜ <b>T 한시 a접점(8-6) 닫힘</b> ➜ <b>MC2 여자</b>, 전동기 <b>M2 운전</b> + <b>GL(녹색) 점등</b>');
    if (off('MC1') && !this.input.eocrTrip) msgs.push('⏹️ <b>MC1 해제</b> ➜ M1 정지, RL 소등');
    if (off('MC2') && !this.input.eocrTrip) msgs.push('⏹️ <b>MC2 해제</b> ➜ M2 정지, GL 소등');
    this.prevCoil = { ...this.coil };
    this.prevFls = this.flsOut;
    msgs.forEach(m => this.logEvent(m));
  }

  /**
   * 효과음: 릴레이·MC가 붙고 떨어질 때 "딸깍", 플리커가 a/b 접점을 바꿀 때마다 "딸깍",
   * 타이머 설정시간이 지나 한시 접점이 붙는 순간 "띵-동" + 화면 반짝임
   */
  playTransitionSounds(on, off) {
    const kinds = { relay: 'relay', timer: 'relay', contactor: 'contactor' };
    let contactor = 0;
    let relay = 0;
    this.op.loads.forEach(l => {
      const k = kinds[l.kind];
      if (!k || l.id === 'EOCR' || l.id === 'FLS') return;
      if (on(l.id) || off(l.id)) {
        if (k === 'contactor') contactor = on(l.id) ? 2 : Math.max(contactor, 1);
        else relay = on(l.id) ? 2 : Math.max(relay, 1);
      }
    });
    // 플리커 접점 전환 (FR 여자 중 a/b 교대)
    if (this.coil.FR && this.prevFrPhase !== undefined && this.frPhase !== this.prevFrPhase) relay = Math.max(relay, 2);
    // 타이머 한시 접점 동작 (타이머마다)
    this.timerIds.forEach(id => {
      if (this.timerDone[id] && !this.prevTimerDone[id]) {
        relay = Math.max(relay, 2);
        playTimerChime();
        this.timerBurst(id);
      }
      this.prevTimerDone[id] = !!this.timerDone[id];
    });
    // 수위: FLS 전원이 있는 동안 E1 도달(만수) / E2 아래(저수위)
    if (this.coil.FLS && this.prevFls !== undefined && this.flsOut !== this.prevFls) {
      this.tankAlert(!this.flsOut);
    }
    this.prevFrPhase = this.coil.FR ? this.frPhase : undefined;
    this.prevTDone = this.tDone;
    // 동시에 여러 개가 바뀌어도 소리는 한 번씩 (MC는 조금 늦게 겹쳐 "딸깍-철컥")
    if (relay) playRelayClick('relay', relay === 2);
    if (contactor) setTimeout(() => playRelayClick('contactor', contactor === 2), relay ? 45 : 0);
  }

  /** 조작 박스 번쩍임 (버튼 누름·셀렉터 전환) */
  flashBox(id) {
    const box = this.container.querySelector(`#${id}`)?.closest('svg.op-box');
    if (!box) return;
    box.classList.remove('op-box-flash');
    void box.getBoundingClientRect();   // 애니메이션 다시 시작
    box.classList.add('op-box-flash');
  }

  /** 푸시버튼 누름/뗌 효과 (직접 누를 때와 자동 테스트 공용) */
  pressFeedback(key, down) {
    playButtonClick(down);
    if (down) this.flashBox(`op-${key}`);
  }

  /** 수조 알림: full = E1 도달(만수) / false = E2 아래(저수위) — 소리 + 수조 빛남 + 안내 띠 */
  tankAlert(full) {
    playWaterAlert(full);
    this.tankBanner = { full, until: performance.now() + 2600 };
    const tank = this.container.querySelector('#op-tank');
    if (tank) {
      tank.classList.remove('op-tank-full', 'op-tank-low');
      void tank.getBoundingClientRect();
      tank.classList.add(full ? 'op-tank-full' : 'op-tank-low');
    }
    this.lastSigs = { ...(this.lastSigs || {}), tank: null };   // 안내 띠를 바로 그림
  }

  /** EOCR 리셋 효과: 복귀음 + 상태 칸 초록 번쩍임 + 회로도 EOCR 접점 둘레 초록 빛 고리 */
  resetFeedback() {
    playResetChime();
    this.resetFlashUntil = performance.now() + 2200;
    const btn = this.container.querySelector('#op-eocr-reset');
    if (btn) {
      btn.classList.remove('op-btn-press');
      void btn.getBoundingClientRect();
      btn.classList.add('op-btn-press');
    }
    const spots = this.op.contacts.filter(c => c.type === 'eocr-nc' || c.type === 'eocr-no');
    this.fxBurst(spots, '✔ 리셋!', 'reset');
  }

  /** 회로도 위 지점들에 퍼지는 빛 고리 + 글자 (variant: '' = 타이머 주황, 'reset' = 리셋 초록) */
  fxBurst(spots, text, variant = '') {
    const layer = this.container.querySelector('#op-fx-layer');
    if (!layer || !spots.length) return;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = spots.map(p => `<g transform="translate(${p.x}, ${p.y})" class="${variant}">
        <circle r="20" class="op-timer-burst" />
        <circle r="20" class="op-timer-burst late" />
        <text y="-34" text-anchor="middle" class="op-timer-done-text">${text}</text>
      </g>`).join('');
    layer.appendChild(g);
    setTimeout(() => g.remove(), 1600);
  }

  /** 타이머 시간 도달 순간: 타이머 코일과 한시 접점 둘레에 퍼지는 빛 고리 */
  timerBurst(id) {
    this.fxBurst([
      ...this.op.loads.filter(l => l.kind === 'timer' && (!id || l.id === id)),
      ...this.op.contacts.filter(c => (c.type === 'timer-no' || c.type === 'timer-nc') && (!id || c.coil === id))
    ], '⏰ 딸깍!');
  }

  logEvent(html) {
    this.events.unshift(html);
    this.events = this.events.slice(0, 6);
    const log = this.container.querySelector('#op-log');
    if (log) log.innerHTML = this.events.map((e, i) => `<li class="${i === 0 ? 'latest' : ''}">${e}</li>`).join('');
    this.updateGuideMessage(`⚡ <b>[7단계 동작 테스트]</b><br>${html}`);
  }

  // ---------------------------------------------------------------------------
  // 부저 소리
  // ---------------------------------------------------------------------------

  /**
   * 현장 경고용 부저 소리: 살짝 어긋난 두 고음 + 찌그러짐(디스토션) + 초당 약 9회 떨림 ➜ 거친 "꽥꽥" 소리
   * - FR 플리커가 켜고 끄므로 전체 리듬은 "꽥꽥— (멈춤) — 꽥꽥—"
   */
  setBuzzer(on) {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (on && !this.buzzOsc) {
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      // 소리 원천: 2.7kHz·3.05kHz 사각파를 겹쳐 맥놀이(거친 느낌)
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      oscA.type = 'square';
      oscB.type = 'sawtooth';
      oscA.frequency.value = 2700;
      oscB.frequency.value = 3050;
      // 찌그러짐: 강하게 깎아 금속성 경고음으로
      const shaper = ctx.createWaveShaper();
      const curve = new Float32Array(1024);
      for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * 6);
      }
      shaper.curve = curve;
      // 떨림: 초당 9회로 소리를 끊었다 이음 (전자 부저 특유의 "꽥꽥")
      const chop = ctx.createGain();
      chop.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      const lfoDepth = ctx.createGain();
      lfo.type = 'square';
      lfo.frequency.value = 9;
      lfoDepth.gain.value = 0.5;
      lfo.connect(lfoDepth).connect(chop.gain);
      // 음량 (경고음이라 크게, 급격한 시작 잡음 방지용 짧은 페이드인)
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(0.22, now + 0.02);
      const mix = ctx.createGain();
      mix.gain.value = 0.5;
      oscA.connect(mix);
      oscB.connect(mix);
      mix.connect(shaper).connect(chop).connect(master).connect(ctx.destination);
      [oscA, oscB, lfo].forEach(o => o.start(now));
      this.buzzOsc = { nodes: [oscA, oscB, lfo], master };
    } else if (!on && this.buzzOsc) {
      const { nodes, master } = this.buzzOsc;
      const now = ctx.currentTime;
      try {
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0, now + 0.02);
        nodes.forEach(n => n.stop(now + 0.03));
      } catch (e) { /* ignore */ }
      this.buzzOsc = null;
    }
  }

  // ---------------------------------------------------------------------------
  // 화면
  // ---------------------------------------------------------------------------

  render() {
    ensureGlobalDeviceDefs();
    const L = this.op.levels;
    this.container.innerHTML = `
      <div class="op-layout">
        <!-- 왼쪽: 회로도(위) + 조작 줄(아래, 가로 배열) -->
        <div class="op-main">
        <div class="op-diagram">
          <div class="op-view-tabs" role="tablist">
            <button type="button" data-view="seq" class="active" title="시퀀스 회로도에서 전류 흐름 보기">📐 시퀀스 도면</button>
            <button type="button" data-view="wall" title="6단계에서 완성한 벽면에서 램프·부저·버튼·전동기 동작 보기">🧱 벽면 (6단계 완성)</button>
            <button type="button" data-view="panel" title="벽면의 제어판을 크게 — 소켓에 꽂은 테스트용 기구의 동작 확인">🔍 제어판</button>
          </div>
          <div class="op-zoom-tools" title="휠: 확대·축소 / 드래그: 이동 / 더블클릭: 처음 크기">
            <button type="button" data-zoom="in" title="확대">＋</button>
            <span id="op-zoom-label">100%</span>
            <button type="button" data-zoom="out" title="축소">－</button>
            <button type="button" data-zoom="fit" title="회로 전체 맞춤">⤢ 맞춤</button>
          </div>
          <svg id="op-seq-svg" viewBox="${DIAGRAM_VIEW.join(' ')}">
            <image href="${this.seqImage}" x="0" y="0" width="1753" height="1240" />
            <g id="op-flow-layer"></g>
            <g id="op-contact-layer"></g>
            <g id="op-load-layer"></g>
            <g id="op-fx-layer"></g>
          </svg>
          <svg id="op-wall-svg" viewBox="${WALL_VIEW.join(' ')}" style="display:none">
            <g id="op-wall-base"></g>
            <g id="op-wall-live"></g>
          </svg>
          <div class="op-legend" id="op-legend-seq">
            <span><i class="lg-flow"></i>전기가 흐르는 선</span>
            <span><i class="lg-return"></i>공통선(N상)</span>
            <span><i class="lg-closed"></i>닫힌 접점</span>
            <span><i class="lg-open"></i>열린 접점</span>
          </div>
          <div class="op-legend" id="op-legend-wall" style="display:none">
            <span>💡 6단계 완성 벽면 — 박스의 램프·부저·버튼·셀렉터와 전동기(M1·M2)가 실시간으로 동작해요. 벽면의 버튼·셀렉터도 직접 누를 수 있어요!</span>
          </div>
        </div>

        <div class="op-controls">
          <section class="op-card">
            <h4>🎛️ 조작 박스 <small>버튼은 누르고 있는 동안 동작 · 램프·부저 동작 확인</small></h4>
            <div class="op-row op-boxes">
              ${this.boxes.map((b, i) => `<svg class="op-box" viewBox="-4 -4 98 152" id="op-box-${i}"></svg>`).join('')}
            </div>
          </section>

          <section class="op-card">
            <h4>⚡ 전원 · 보호</h4>
            <div class="op-row">
              <button id="op-mccb" class="op-mccb" title="배선용 차단기 ON/OFF">
                <span class="op-mccb-lever"></span><b>MCCB</b><em id="op-mccb-label">OFF</em>
              </button>
              <div class="op-eocr">
                <div class="op-eocr-state" id="op-eocr-state">EOCR 정상</div>
                <div class="op-row-tight">
                  <button class="op-btn danger" id="op-eocr-trip">⚠️ 과부하 트립</button>
                  <button class="op-btn" id="op-eocr-reset">↺ 리셋</button>
                </div>
              </div>
            </div>
          </section>

          <section class="op-card op-split">
            ${this.op.levels ? `<div>
              <h4>💧 수조 (FLS 전극)</h4>
              <svg class="op-tank" viewBox="0 0 130 184" id="op-tank"></svg>
              <input type="range" id="op-level" min="0" max="100" step="1" value="${this.input.level}" />
              <label class="op-check"><input type="checkbox" id="op-auto-level" checked /> 펌프 운전 시 급수(자동 수위 변화)</label>
            </div>` : `<div>
              <h4>🔘 리밋스위치</h4>
              <div class="op-switches" id="op-switches"></div>
              <p class="op-check">눌러서 감지(ON) ⇄ 해제(OFF)</p>
            </div>`}
            <div>
              <h4>🌀 전동기</h4>
              <div class="op-motors">
                <div class="op-motor" id="op-m1"><svg viewBox="-30 -30 60 60">${this.motorSvg()}</svg><b>M1</b><span>MC1</span></div>
                <div class="op-motor" id="op-m2"><svg viewBox="-30 -30 60 60">${this.motorSvg()}</svg><b>M2</b><span>MC2</span></div>
              </div>
              <h4>🔁 릴레이 · 타이머</h4>
              <div class="op-chips" id="op-chips"></div>
              <div class="op-timer">
                <span>T 설정</span>
                <input type="number" id="op-timer-set" min="1" max="30" step="0.5" value="${this.timerSet}" /> 초
                <div class="op-timer-bar"><div id="op-timer-fill"></div></div>
              </div>
              <div class="op-timer-warn" id="op-timer-warn" style="display:none"></div>
            </div>
          </section>

        </div>
        </div>

        <!-- 오른쪽: 문제지 동작 사항 체크리스트 + 동작 기록 (항상 보이게) -->
        <div class="op-side">
          ${this.checklistMarkup()}
          <section class="op-card op-log-card">
            <h4>📝 동작 기록</h4>
            <ul class="op-log" id="op-log"><li>MCCB를 올려 전원을 투입해 보세요!</li></ul>
          </section>
        </div>
      </div>`;
    this.levelsCache = L;
    this.updateView(true);
  }

  motorSvg() {
    return `
      <circle r="27" fill="#334155" stroke="#94a3b8" stroke-width="2" />
      <g class="op-fan">
        ${[0, 90, 180, 270].map(a => `<path transform="rotate(${a})" d="M 0 0 C 6 -6 14 -6 18 -2 C 12 2 6 4 0 0 Z" fill="#cbd5e1" />`).join('')}
        <circle r="4" fill="#0f172a" />
      </g>`;
  }

  /** 박스 기구 정의 ➜ 현재 상태가 반영된 실제 모양 (버튼 눌림·셀렉터 위치·램프 점등·부저) */
  deviceView(d) {
    const I = this.input;
    const C = this.coil;
    switch (d.type) {
      case 'pb-green':
      case 'pb-red':
        return { id: `op-${d.input}`, face: pushButton(d.type === 'pb-green' ? 'green' : 'red', { pressed: !!I[d.input] }), name: d.name };
      case 'selector':
        return { id: 'op-ss', face: selectorSwitch({ position: I.ss }), name: `SS (${I.ss === 'A' ? '자동' : '수동'})` };
      case 'lamp-red':
      case 'lamp-green':
      case 'lamp-yellow':
      case 'lamp-white':
        return { face: pilotLamp(d.type.slice(5), { lit: !!C[d.load] }), name: d.name };
      case 'buzzer':
        return { face: buzzer({ on: !!C[d.load] }), name: d.name };
      default:
        return { face: blankCap(), name: d.name };
    }
  }

  boxMarkup(name, devices) {
    const screws = [[9, 9], [81, 9], [9, 131], [81, 131]]
      .map(([x, y]) => `<g transform="translate(${x}, ${y})"><circle r="3.6" fill="url(#dev-metal)" stroke="#475569" stroke-width="0.8" /></g>`).join('');
    return `
      <rect width="90" height="140" rx="7" fill="url(#dev-cover)" stroke="#78716c" stroke-width="1.5" />
      ${screws}
      ${devices.map((d, i) => `
        <g transform="translate(45, ${i === 0 ? 40 : 100})" ${d.id ? `id="${d.id}" class="op-clickable"` : ''}>${d.face}</g>
        <g transform="translate(45, ${i === 0 ? 64 : 124})">${nameplate(d.name)}</g>`).join('')}
      <text x="45" y="148" text-anchor="middle" font-size="8" font-weight="900" fill="#facc15">${name}</text>`;
  }

  updateView(force = false) {
    const C = this.coil;
    const I = this.input;
    const lampOn = (id) => !!C[id];
    // 영역별 서명: 바뀐 영역만 다시 그림 (조작 박스를 매번 다시 그리면 클릭이 사라짐)
    const sigOf = (v) => JSON.stringify(v);
    const sigs = {
      diagram: sigOf([I.power, C, [...this.energized].sort(), this.tDone, this.frPhase, this.flsOut, I.ss, I.pb0, I.pb1, I.eocrTrip,
        this.timerIds.map(id => this.coil[id] && !this.timerDone[id] ? Math.floor((performance.now() - this.timerStart[id]) / 100) : 0),
        (this.op.switches || []).map(sw => !!I[sw.input])]),
      boxes: sigOf([I.pb1, I.pb0, I.ss, C.RL, C.GL, C.YL, C.BZ, C.FR]),
      tank: sigOf([Math.round(I.level), this.flsOut, this.tankBanner && performance.now() < this.tankBanner.until ? this.tankBanner.full : null]),
      status: sigOf([I.power, I.eocrTrip, C, !!(this.resetFlashUntil && performance.now() < this.resetFlashUntil)])
    };
    const prev = this.lastSigs || {};
    const need = (k) => force || sigs[k] !== prev[k];
    this.lastSigs = sigs;
    const tFill = this.container.querySelector('#op-timer-fill');
    if (tFill) {
      const ratio = this.tStart !== null ? Math.min(1, (performance.now() - this.tStart) / (this.timerSet * 1000)) : 0;
      tFill.style.width = `${ratio * 100}%`;
      tFill.classList.toggle('done', this.tDone);
    }
    // 도면: 전기가 흐르는 그룹, 공통선, 접점, 부하
    if (need('diagram')) {
    const flow = this.container.querySelector('#op-flow-layer');
    const anyLoad = this.op.loads.some(l => C[l.id]);
    flow.innerHTML = [
      ...(I.power && anyLoad && this.groupPaths[this.op.neutral]
        ? [`<path d="${this.groupPaths[this.op.neutral]}" class="op-return" />`] : []),
      ...[...this.energized].filter(n => this.groupPaths[n]).map(n => `<path d="${this.groupPaths[n]}" class="op-flow" />`)
    ].join('');
    this.container.querySelector('#op-contact-layer').innerHTML = this.op.contacts.map(c => {
      const closed = this.contactClosed(c);
      // 표시 위치: 세로 접점은 위쪽 단자 바로 위 전선 위(양옆은 기호 글자 자리라 피함 — 이웃 접점이 가까워도 안 가림),
      // 맨 위 가로 EOCR b접점은 선 아래 / 데이터에 badge: [dx, dy]가 있으면 그 값
      const [dx, dy] = c.badge || (c.id === 'EOCR_b' ? [0, 18] : [0, -31]);
      const badge = `<g transform="translate(${c.x + dx}, ${c.y + dy})"><circle r="8" class="${closed ? 'op-c-closed' : 'op-c-open'}" /><text y="3" text-anchor="middle" font-size="8.5" font-weight="900" fill="#fff">${closed ? 'ON' : ''}</text></g>`;
      // 리밋스위치 접점: 도면의 접점 기호를 직접 눌러 감지 ON/OFF (깜빡이는 고리 = 누를 수 있음)
      const sw = (this.op.switches || []).find(s => s.input === c.input);
      if (!sw) return badge;
      return `<g class="op-clickable op-seq-switch ${I[sw.input] ? 'on' : ''}" data-switch="${sw.input}">
        <rect x="${c.x - 24}" y="${c.y - 44}" width="${I[sw.input] ? 86 : 104}" height="80" rx="8" class="op-seq-switch-hit" />
        ${badge}
        <text x="${c.x + 24}" y="${c.y + 5}" font-size="13" font-weight="900" class="op-seq-switch-tip">👆${I[sw.input] ? '감지' : '누르기'}</text>
      </g>`;
    }).join('');
    this.container.querySelector('#op-load-layer').innerHTML = this.op.loads.map(l => {
      if (!C[l.id]) return '';
      const color = l.kind === 'lamp' ? { red: '#ef4444', green: '#22c55e', yellow: '#facc15', white: '#e2e8f0' }[l.color] : (l.kind === 'buzzer' ? '#fb923c' : '#f97316');
      const extra = l.kind === 'timer' && !this.timerDone[l.id] ? `<text x="0" y="-30" text-anchor="middle" font-size="18" font-weight="900" fill="#b45309">⏱ ${Math.max(0, this.timerSet - (performance.now() - this.timerStart[l.id]) / 1000).toFixed(1)}s</text>` : '';
      return `<g transform="translate(${l.x}, ${l.y})"><circle r="24" fill="${color}" opacity="0.28" /><circle r="24" fill="none" stroke="${color}" stroke-width="5" class="op-load-on" />${extra}</g>`;
    }).join('');
    }

    // 조작 박스 (실제 기구 모양)
    if (need('boxes')) {
    this.boxes.forEach((box, i) => {
      const el = this.container.querySelector(`#op-box-${i}`);
      if (el) el.innerHTML = this.boxMarkup(box.name.replace('/', ' / '), [box.top, box.bottom].map(d => this.deviceView(d)));
    });
    }
    if (this.viewMode === 'wall' && (need('boxes') || need('status') || need('diagram'))) this.renderWallLive();
    this.setBuzzer(lampOn('BZ'));

    // 전원 · EOCR
    if (need('status')) {
    const mccb = this.container.querySelector('#op-mccb');
    mccb.classList.toggle('on', I.power);
    this.container.querySelector('#op-mccb-label').textContent = I.power ? 'ON' : 'OFF';
    const eocr = this.container.querySelector('#op-eocr-state');
    const justReset = !I.eocrTrip && this.resetFlashUntil && performance.now() < this.resetFlashUntil;
    eocr.textContent = I.eocrTrip ? 'EOCR 트립 (과부하)' : (justReset ? '✔ 리셋 완료 ➜ 정상 복귀' : (I.power ? 'EOCR 정상 감시 중' : 'EOCR 정상'));
    eocr.classList.toggle('trip', I.eocrTrip);
    eocr.classList.toggle('reset-ok', !!justReset);
    this.container.querySelector('#op-m1').classList.toggle('on', !!C.MC1);
    this.container.querySelector('#op-m2').classList.toggle('on', !!C.MC2);
    this.container.querySelector('#op-chips').innerHTML = this.op.loads
      .filter(l => ['relay', 'timer', 'contactor'].includes(l.kind))
      .map(l => `<span class="op-chip ${C[l.id] ? 'on' : ''}" title="${l.name}">${l.id}</span>`).join('');
    }

    // 리밋스위치 (FLS가 없는 과제)
    // 상태가 바뀔 때만 다시 그림 (매번 그리면 누르는 사이 버튼이 바뀌어 클릭이 사라짐)
    const swBox = this.container.querySelector('#op-switches');
    const swSig = sigOf((this.op.switches || []).map(sw => !!I[sw.input]));
    if (swBox && (force || swSig !== this.swSig)) {
      this.swSig = swSig;
      swBox.innerHTML = (this.op.switches || []).map(sw => `
        <button type="button" class="op-switch ${I[sw.input] ? 'on' : ''}" data-switch="${sw.input}">
          <svg viewBox="-22 -16 44 32" width="54" height="40">
            <rect x="-20" y="-6" width="26" height="14" rx="2" fill="#334155" stroke="#0f172a" />
            <line x1="6" y1="0" x2="${I[sw.input] ? 16 : 18}" y2="${I[sw.input] ? 6 : -10}" stroke="#94a3b8" stroke-width="2.4" stroke-linecap="round" />
            <circle cx="${I[sw.input] ? 17 : 19}" cy="${I[sw.input] ? 7 : -11}" r="3.4" fill="${I[sw.input] ? '#22c55e' : '#e2e8f0'}" stroke="#0f172a" />
          </svg>
          <b>${sw.name}</b><span>${I[sw.input] ? '감지 ON' : '해제'}</span>
        </button>`).join('');
    }
    // 수조
    if (!this.op.levels || !need('tank')) return;
    const L = this.op.levels;
    const wy = (lv) => 12 + 148 * (1 - lv / 100);
    this.container.querySelector('#op-tank').innerHTML = `
      <rect x="22" y="10" width="86" height="152" rx="6" fill="#0f172a" stroke="#94a3b8" stroke-width="2" />
      <rect x="24" y="${wy(I.level)}" width="82" height="${160 - wy(I.level)}" rx="4" fill="#0284c7" opacity="0.75" />
      <rect x="24" y="${wy(I.level)}" width="82" height="3" fill="#7dd3fc" />
      ${[['E1', 48, L.E1], ['E2', 66, L.E2], ['E3', 84, L.E3]].map(([n, x, lv]) => `
        <line x1="${x}" y1="2" x2="${x}" y2="${wy(lv)}" stroke="#e2e8f0" stroke-width="3" />
        <circle cx="${x}" cy="${wy(lv)}" r="2.6" fill="#facc15" />
        <text x="${x + 5}" y="${wy(lv) + 3}" font-size="8" font-weight="900" fill="#fde68a">${n}</text>`).join('')}
      <text x="8" y="${wy(L.E1) + 3}" font-size="7" fill="#94a3b8">고</text>
      <text x="8" y="${wy(L.E2) + 3}" font-size="7" fill="#94a3b8">저</text>
      <text x="65" y="${wy(I.level) - 4 < 18 ? 22 : wy(I.level) - 4}" text-anchor="middle" font-size="9" font-weight="900" fill="#f8fafc">${Math.round(I.level)}%</text>
      <text x="65" y="178" text-anchor="middle" font-size="9" font-weight="900" fill="${this.flsOut ? '#86efac' : '#94a3b8'}">FLS 접점 ${this.flsOut ? '닫힘(ON)' : '열림'}</text>
      ${this.tankBanner && performance.now() < this.tankBanner.until ? `
        <g class="op-tank-banner">
          <rect x="6" y="${this.tankBanner.full ? 30 : 120}" width="118" height="22" rx="6" fill="${this.tankBanner.full ? '#0369a1' : '#b45309'}" stroke="#ffffff" stroke-width="1.5" />
          <text x="65" y="${this.tankBanner.full ? 45 : 135}" text-anchor="middle" font-size="9.5" font-weight="900" fill="#ffffff">${this.tankBanner.full ? '💧 만수! E1 도달 ➜ 정지' : '⬇ 저수위 E2 ➜ 급수 시작'}</text>
        </g>` : ''}`;
    const slider = this.container.querySelector('#op-level');
    if (slider && document.activeElement !== slider) slider.value = Math.round(I.level);
  }

  // ---------------------------------------------------------------------------
  // 조작
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 회로도 확대·이동 (휠 확대 / 드래그 이동 / 더블클릭·맞춤 = 처음 크기)
  // ---------------------------------------------------------------------------
  /** 지금 보기(시퀀스 도면 / 벽면)의 svg와 기본 보기 영역 */
  activeSvg() {
    return this.container.querySelector(this.viewMode === 'wall' ? '#op-wall-svg' : '#op-seq-svg');
  }

  viewBase() {
    return this.viewMode === 'wall' ? WALL_VIEW : DIAGRAM_VIEW;
  }

  applyDiagramView() {
    const svg = this.activeSvg();
    if (!svg) return;
    const v = this.diagramView;
    svg.setAttribute('viewBox', `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`);
    const label = this.container.querySelector('#op-zoom-label');
    if (label) label.textContent = `${Math.round(this.viewBase()[2] / v.w * 100)}%`;
  }

  /** factor < 1 = 확대. (cx, cy) = 도면 좌표 기준점 (없으면 화면 가운데) */
  zoomDiagram(factor, cx, cy) {
    const base = this.viewBase();
    const v = this.diagramView;
    const minW = base[2] / 6;     // 최대 600%
    const maxW = base[2];         // 최소 = 전체
    const w = Math.min(maxW, Math.max(minW, v.w * factor));
    const f = w / v.w;
    if (cx === undefined) { cx = v.x + v.w / 2; cy = v.y + v.h / 2; }
    v.x = cx - (cx - v.x) * f;
    v.y = cy - (cy - v.y) * f;
    v.w = w;
    v.h = v.h * f;
    if (w >= maxW) Object.assign(v, { x: base[0], y: base[1], w: base[2], h: base[3] });
    this.applyDiagramView();
  }

  resetDiagramView() {
    const base = this.viewBase();
    this.diagramView = { x: base[0], y: base[1], w: base[2], h: base[3] };
    this.applyDiagramView();
  }

  bindDiagramZoom() {
    this.viewMode = 'seq';
    this.resetDiagramView();
    ['#op-seq-svg', '#op-wall-svg'].forEach(sel => {
      const svg = this.container.querySelector(sel);
      if (!svg) return;
      // 화면 좌표 ➜ 도면 좌표
      const toSvg = (e) => {
        const m = svg.getScreenCTM();
        if (!m) return [undefined, undefined];
        const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
        return [pt.x, pt.y];
      };
      svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const [x, y] = toSvg(e);
        this.zoomDiagram(e.deltaY < 0 ? 0.85 : 1 / 0.85, x, y);
      }, { passive: false });
      let drag = null;
      svg.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.target.closest('[data-wall-input], [data-switch]')) return;   // 벽면 버튼·셀렉터·리밋스위치는 조작
        drag = { client: [e.clientX, e.clientY], view: { ...this.diagramView } };
        svg.setPointerCapture(e.pointerId);
        svg.classList.add('dragging');
      });
      svg.addEventListener('pointermove', (e) => {
        if (!drag) return;
        // 이동 중에는 viewBox가 바뀌므로 누른 시점의 보기 영역 기준으로 계산
        const m = svg.getScreenCTM();
        const scale = m ? m.a : 1;
        const v = this.diagramView;
        v.x = drag.view.x - (e.clientX - drag.client[0]) / scale;
        v.y = drag.view.y - (e.clientY - drag.client[1]) / scale;
        this.applyDiagramView();
      });
      const end = () => { drag = null; svg.classList.remove('dragging'); };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);
      svg.addEventListener('dblclick', (e) => { if (!e.target.closest('[data-wall-input], [data-switch]')) this.resetDiagramView(); });
    });
    this.container.querySelector('.op-zoom-tools')?.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.zoom === 'in') this.zoomDiagram(0.8);
      else if (b.dataset.zoom === 'out') this.zoomDiagram(1 / 0.8);
      else this.resetDiagramView();
    });
    this.container.querySelector('.op-view-tabs')?.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-view]');
      if (!b) return;
      if (b.dataset.view === 'panel') this.zoomToPanel();
      else this.setViewMode(b.dataset.view);
    });
  }

  // ---------------------------------------------------------------------------
  // 벽면 보기 (6단계 완성 벽면 + 실시간 기구 상태)
  // ---------------------------------------------------------------------------
  async setViewMode(mode) {
    if (mode === this.viewMode) return;
    if (mode === 'wall' && !this.wallReady) {
      const ok = await this.prepareWall();
      if (!ok) return;
    }
    this.viewMode = mode;
    const wallMode = mode === 'wall';
    this.container.querySelector('#op-seq-svg').style.display = wallMode ? 'none' : '';
    this.container.querySelector('#op-wall-svg').style.display = wallMode ? '' : 'none';
    this.container.querySelector('#op-legend-seq').style.display = wallMode ? 'none' : '';
    this.container.querySelector('#op-legend-wall').style.display = wallMode ? '' : 'none';
    this.container.querySelectorAll('.op-view-tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === mode));
    this.resetDiagramView();
    if (wallMode) this.renderWallLive();
  }

  /** 벽면 보기에서 제어판(테스트용 기구)만 크게 */
  async zoomToPanel() {
    await this.setViewMode('wall');
    if (this.viewMode !== 'wall') return;
    const svg = this.container.querySelector('#op-wall-svg');
    const r = svg.getBoundingClientRect();
    const h = 440;
    const w = Math.max(420, h * r.width / Math.max(1, r.height));
    this.diagramView = { x: WALL_PANEL[0] + 200 - w / 2, y: WALL_PANEL[1] - 10, w, h: w * r.height / Math.max(1, r.width) };
    this.applyDiagramView();
  }

  /** 6단계 완성 벽면을 받아 복사 (5·6단계가 덜 끝났으면 app이 화면 밖에서 즉시 완성) */
  async prepareWall() {
    if (!this.wallProvider) return false;
    const tab = this.container.querySelector('.op-view-tabs button[data-view="wall"]');
    if (tab) tab.textContent = '⏳ 벽면 준비 중…';
    const s5 = await this.wallProvider();
    if (tab) tab.textContent = '🧱 벽면 (6단계 완성)';
    if (!s5?.svg) return false;
    const base = this.container.querySelector('#op-wall-base');
    base.innerHTML = s5.svg.innerHTML;
    // 복사본의 id는 지움 (원본 5·6단계 레이어 id와 겹치지 않게, 공용 defs는 그대로)
    base.querySelectorAll('[id]').forEach(el => { if (!el.closest('defs')) el.removeAttribute('id'); });
    // 박스 위치: 과제 데이터(wall.boxes)에 좌표가 있으면 그대로, 없으면(1번) 5단계 기본 박스 좌표를 이름으로 찾아 붙임
    this.wallBoxes = this.boxes
      .map(b => (b.x !== undefined ? b : { ...b, ...(s5.boxes.find(x => x.name === b.name) || {}) }))
      .filter(b => b.x !== undefined);
    // 전동기 위치: TB2(M1) · TB3(M2) 단자대 바깥쪽
    this.wallMotors = (s5.tbBlocks || []).filter(t => t.id === 'TB2' || t.id === 'TB3').map(t => {
      const pipe = s5.pipes.find(p => p.clearance === t.id);
      const g = tbBlockGeometry(t.device, pipe ? pipe.points[pipe.points.length - 1] : [t.device.at, t.device.from]);
      const mid = g.outerSlot(1.5);
      let pos = [mid[0] + g.outward[0] * 60, mid[1] + g.outward[1] * 60];
      // 바깥쪽이 벽 끝에 너무 가까우면(맨 아래 가로 단자대 등) 단자대 옆으로
      if (pos[0] < 50 || pos[0] > WALL_VIEW[2] - 50 || pos[1] < 50 || pos[1] > WALL_VIEW[3] - 60) {
        const last = g.outerSlot(3);
        pos = [last[0] + g.along[0] * 85 - g.outward[0] * 15, last[1] + g.along[1] * 85 - g.outward[1] * 15];
      }
      return { id: t.id, motor: t.id === 'TB2' ? 'M1' : 'M2', coil: t.id === 'TB2' ? 'MC1' : 'MC2', x: pos[0], y: pos[1] };
    });
    // 리밋스위치(10~18번): TB4 단자대 인출선 끝 너머에 나란히 (벽면에서 직접 눌러 감지)
    const tb4 = (s5.tbBlocks || []).find(t => t.id === 'TB4');
    this.wallSwitches = [];
    if (tb4 && (this.op.switches || []).length) {
      const pipe = s5.pipes.find(p => p.clearance === 'TB4');
      const g = tbBlockGeometry(tb4.device, pipe ? pipe.points[pipe.points.length - 1] : [tb4.device.from, tb4.device.at]);
      const last = g.outerSlot(3);
      this.wallSwitches = this.op.switches.map((sw, i) => {
        // 가로 단자대: 단자 번호 방향으로 나란히 / 세로 단자대(15번 등): 인출선 바깥쪽으로 나란히
        const mid = g.outerSlot(1.5);
        const [px, py] = g.vertical
          ? [last[0] + g.outward[0] * (150 + i * 110), mid[1] + 20]
          : [last[0] + g.along[0] * (120 + i * 120) + g.outward[0] * 30, last[1] + g.along[1] * (120 + i * 120) + g.outward[1] * 20];
        const x = Math.min(WALL_VIEW[2] - 50, Math.max(50, px));
        const y = Math.min(WALL_VIEW[3] - 45, Math.max(45, py));
        return { ...sw, x, y };
      });
    }
    this.wallReady = true;
    return true;
  }

  /** 박스 기구 하나의 현재 상태 (버튼 눌림·셀렉터 위치·램프 점등·부저) */
  deviceState(d) {
    const I = this.input;
    const C = this.coil;
    if (d.type === 'pb-green' || d.type === 'pb-red') return { pressed: !!I[d.input] };
    if (d.type === 'selector') return { position: I.ss };
    if (d.type?.startsWith('lamp-')) return { lit: !!C[d.load] };
    if (d.type === 'buzzer') return { on: !!C[d.load] };
    return {};
  }

  /**
   * 소켓에 꽂은 테스트용 기구 (교육용 — 실제 시험에서는 감독관이 꽂아 측정)
   * - 몸체는 소켓 위·아래 나사 줄이 보이도록 가운데에만
   * - 코일이 붙으면 LED 점등 + 표시창 ON, 바뀌는 순간 '딸깍' 눌림 효과
   * - MC: 보조접점 a(4-10)·b(5-11) 표시 / 릴레이·FR: a·b 표시 / T: 남은 시간 고리 / EOCR: 정상·TRIP / FLS: 수위 접점
   */
  testDeviceMarkup(c) {
    const C = this.coil;
    const I = this.input;
    const on = !!C[c.id];
    const w = c.width - 4;
    const h = c.height - 26;
    const x0 = c.x - w / 2;
    const y0 = c.y - h / 2;
    this.prevDevState = this.prevDevState || {};
    // a접점 닫힘 여부 (FR은 플리커 상태, T는 한시 동작, FLS는 수위 접점)
    let aClosed = on;
    if (c.id === 'FR') aClosed = on && this.frPhase;
    if (this.timerIds.includes(c.id)) aClosed = on && !!this.timerDone[c.id];
    if (c.id === 'FLS') aClosed = on && this.flsOut;
    if (c.id === 'EOCR') aClosed = !!I.eocrTrip;
    const key = `${on}|${aClosed}`;
    const clicked = this.prevDevState[c.id] !== undefined && this.prevDevState[c.id] !== key;
    this.prevDevState[c.id] = key;
    const led = (cx, cy, color, lit) => `<circle cx="${cx}" cy="${cy}" r="2.2" fill="${lit ? color : '#334155'}" stroke="#0f172a" stroke-width="0.5" ${lit ? `style="filter: drop-shadow(0 0 2px ${color})"` : ''} />`;
    const ab = (y) => `
      <text x="${c.x - w / 2 + 3}" y="${y}" font-size="4.6" font-weight="900" fill="${aClosed ? '#16a34a' : '#64748b'}">a ${aClosed ? '●' : '○'}</text>
      <text x="${c.x + w / 2 - 3}" y="${y}" text-anchor="end" font-size="4.6" font-weight="900" fill="${aClosed ? '#64748b' : '#dc2626'}">b ${aClosed ? '○' : '●'}</text>`;
    let body;
    if (c.type === 'socket_12p' && c.id !== 'EOCR') {
      // 전자접촉기: 회색 몸체 + 가운데 가동 표시창(여자되면 안으로 쑥 들어감)
      body = `
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="3" fill="#e5e7eb" stroke="#475569" stroke-width="0.8" />
        <rect x="${x0 + 2}" y="${y0 + 2}" width="${w - 4}" height="7" rx="1.5" fill="#cbd5e1" />
        <text x="${c.x}" y="${y0 + 7.5}" text-anchor="middle" font-size="5" font-weight="900" fill="#0f172a">${c.id}</text>
        <rect x="${c.x - 8}" y="${c.y - 6}" width="16" height="12" rx="1.5" fill="#1e293b" />
        <rect x="${c.x - 6}" y="${c.y - 4 + (on ? 3 : 0)}" width="12" height="${on ? 5 : 8}" rx="1" fill="${on ? '#22c55e' : '#94a3b8'}" />
        <text x="${c.x}" y="${c.y + 11}" text-anchor="middle" font-size="4.6" font-weight="900" fill="${on ? '#15803d' : '#64748b'}">${on ? '여자 ON' : 'OFF'}</text>
        ${led(x0 + w - 5, y0 + h - 5, '#22c55e', on)}
        ${ab(y0 + h - 2.5)}`;
    } else if (c.id === 'EOCR') {
      const trip = !!I.eocrTrip;
      body = `
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="3" fill="#1f2937" stroke="#0f172a" stroke-width="0.8" />
        <text x="${c.x}" y="${y0 + 7}" text-anchor="middle" font-size="5" font-weight="900" fill="#e5e7eb">EOCR</text>
        <rect x="${c.x - 15}" y="${c.y - 6}" width="30" height="11" rx="1.5" fill="${trip ? '#7f1d1d' : '#052e16'}" stroke="#0f172a" stroke-width="0.6" />
        <text x="${c.x}" y="${c.y + 2}" text-anchor="middle" font-size="6" font-weight="900" fill="${trip ? '#fca5a5' : '#86efac'}">${trip ? 'TRIP' : (on ? '정상' : '----')}</text>
        ${led(x0 + 5, y0 + h - 5, '#22c55e', on && !trip)}${led(x0 + w - 5, y0 + h - 5, '#ef4444', trip)}`;
    } else if (this.timerIds.includes(c.id)) {
      // 타이머: 둥근 다이얼 + 진행 고리 + 남은 시간
      const tStart = this.timerStart[c.id];
      const tDone = !!this.timerDone[c.id];
      const ratio = on && tStart != null ? Math.min(1, (performance.now() - tStart) / (this.timerSet * 1000)) : 0;
      const r = 10;
      const len = 2 * Math.PI * r;
      const left = on && !tDone ? Math.max(0, this.timerSet - (performance.now() - tStart) / 1000).toFixed(1) : (tDone && on ? '동작' : `${this.timerSet}s`);
      body = `
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="4" fill="#f1f5f9" stroke="#475569" stroke-width="0.8" />
        <circle cx="${c.x}" cy="${c.y - 1}" r="${r + 2}" fill="#0f172a" />
        <circle cx="${c.x}" cy="${c.y - 1}" r="${r}" fill="none" stroke="#334155" stroke-width="2.4" />
        <circle cx="${c.x}" cy="${c.y - 1}" r="${r}" fill="none" stroke="${tDone && on ? '#22c55e' : '#f59e0b'}" stroke-width="2.4"
          stroke-dasharray="${(len * ratio).toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 ${c.x} ${c.y - 1})" />
        <text x="${c.x}" y="${c.y + 1}" text-anchor="middle" font-size="5" font-weight="900" fill="#fde68a">${left}</text>
        <text x="${c.x}" y="${y0 + 5.5}" text-anchor="middle" font-size="4.6" font-weight="900" fill="#0f172a">${c.id}</text>
        ${led(x0 + w - 4.5, y0 + 4.5, '#f59e0b', on)}
        ${ab(y0 + h - 2.5)}`;
    } else {
      // 8핀 릴레이 · 플리커 · 플로트레스: 투명 케이스 + 코일 LED + 접점 표시
      const color = c.id === 'FR' ? '#f97316' : (c.id === 'FLS' ? '#38bdf8' : '#22c55e');
      const sub = c.id === 'FR' ? (on ? (this.frPhase ? 'a측' : 'b측') : 'OFF')
        : c.id === 'FLS' ? (on ? (this.flsOut ? '수위감지' : '감시중') : 'OFF')
          : (on ? '여자 ON' : 'OFF');
      body = `
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="4" fill="#dbeafe" fill-opacity="0.85" stroke="#475569" stroke-width="0.8" />
        <rect x="${c.x - 9}" y="${c.y - 8}" width="18" height="12" rx="1.5" fill="${on ? '#fef3c7' : '#cbd5e1'}" stroke="#64748b" stroke-width="0.5" />
        <path d="M ${c.x - 7} ${c.y - 2} q 3.5 ${on ? -4 : 0} 7 0 t 7 0" stroke="#b45309" stroke-width="1" fill="none" />
        <text x="${c.x}" y="${y0 + 6}" text-anchor="middle" font-size="5" font-weight="900" fill="#0f172a">${c.id}</text>
        <text x="${c.x}" y="${c.y + 10}" text-anchor="middle" font-size="4.4" font-weight="900" fill="${on ? '#b45309' : '#64748b'}">${sub}</text>
        ${led(x0 + w - 4.5, y0 + 4.5, color, on)}
        ${ab(y0 + h - 2.5)}`;
    }
    return `<g class="op-test-device ${on ? 'on' : ''} ${clicked ? 'dev-click' : ''}" style="transform-origin: ${c.x}px ${c.y}px">${body}</g>`;
  }

  /** 벽면 위 실시간 상태: 박스 뚜껑(기구 상태 반영) + 전동기 회전 */
  renderWallLive() {
    const live = this.container.querySelector('#op-wall-live');
    if (!live || !this.wallReady) return;
    const C = this.coil;
    const boxes = this.wallBoxes.map(b => {
      const devs = [b.top, b.bottom];
      // 버튼·셀렉터 자리에 누를 수 있는 투명 영역
      const hits = devs.map((d, i) => (d?.input
        ? `<circle cx="45" cy="${i === 0 ? 40 : 100}" r="24" fill="transparent" class="op-clickable" data-wall-input="${d.input}" />`
        : '')).join('');
      return `<g transform="translate(${b.x}, ${b.y})">${boxCover(b, devs.map(d => this.deviceState(d || {})))}${hits}</g>`;
    }).join('');
    const motors = this.wallMotors.map(m => `
      <g transform="translate(${m.x}, ${m.y})" class="op-wall-motor ${C[m.coil] ? 'on' : ''}">
        <g transform="scale(1.3)">${this.motorSvg()}</g>
        <text y="-44" text-anchor="middle" font-size="16" font-weight="900" fill="${C[m.coil] ? '#4ade80' : '#e2e8f0'}">${m.motor} ${C[m.coil] ? '운전 중' : '정지'}</text>
        <text y="56" text-anchor="middle" font-size="12" font-weight="900" fill="#cbd5e1">${m.id} · ${m.coil}</text>
      </g>`).join('');
    // 제어판 소켓에 꽂힌 테스트용 기구 (배전반은 벽면 BOX_LEFT·BOX_TOP 위치에 1:1)
    const devices = `<g transform="translate(${WALL_PANEL[0]}, ${WALL_PANEL[1]})">${this.problem.board.components
      .filter(c => c.type === 'socket_12p' || c.type === 'socket_8p')
      .map(c => this.testDeviceMarkup(c)).join('')}</g>`;
    live.innerHTML = devices + boxes + motors + (this.wallSwitches || []).map(sw => this.limitSwitchMarkup(sw)).join('');
  }

  /** 벽면 리밋스위치: 몸체 + 레버·롤러 (감지 ON이면 레버가 눌려 내려가고 초록 빛) — 눌러서 ON/OFF */
  limitSwitchMarkup(sw) {
    const on = !!this.input[sw.input];
    const lever = on ? 'rotate(38)' : 'rotate(0)';
    return `
      <g transform="translate(${sw.x}, ${sw.y})" class="op-clickable op-wall-ls ${on ? 'on' : ''}" data-switch="${sw.input}">
        <rect x="-50" y="-44" width="100" height="92" rx="10" fill="transparent" />
        ${on ? '<circle r="40" fill="#22c55e" opacity="0.22" />' : ''}
        <rect x="-26" y="-6" width="52" height="34" rx="4" fill="#475569" stroke="#0f172a" stroke-width="1.5" />
        <rect x="-20" y="0" width="40" height="8" rx="2" fill="#1e293b" />
        <circle cx="16" cy="18" r="3.5" fill="${on ? '#4ade80' : '#334155'}" stroke="#0f172a" />
        <circle cx="-14" cy="-6" r="4.5" fill="#94a3b8" stroke="#0f172a" />
        <g transform="translate(-14, -6) ${lever}">
          <line x1="0" y1="0" x2="34" y2="-24" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />
          <circle cx="36" cy="-26" r="7" fill="${on ? '#22c55e' : '#e2e8f0'}" stroke="#0f172a" stroke-width="1.5" />
        </g>
        <text y="44" text-anchor="middle" font-size="13" font-weight="900" fill="${on ? '#4ade80' : '#f8fafc'}">${sw.name} ${on ? '감지 ON' : '👆 누르기'}</text>
      </g>`;
  }

  bindEvents() {
    const $ = (sel) => this.container.querySelector(sel);
    this.bindDiagramZoom();
    const userAct = () => { this.runToken++; };  // 직접 조작하면 진행 중인 테스트 중단

    this.container.querySelector('#op-steps')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.op-step-run');
      if (btn) this.runStep(parseInt(btn.dataset.idx, 10));
    });

    $('#op-mccb').addEventListener('click', () => {
      userAct();
      this.setPower(!this.input.power);
    });
    $('#op-eocr-trip').addEventListener('click', () => { userAct(); this.input.eocrTrip = true; this.tick(); });
    $('#op-eocr-reset').addEventListener('click', () => {
      userAct();
      const wasTripped = this.input.eocrTrip;
      this.input.eocrTrip = false;
      if (wasTripped) this.resetFeedback();
      this.logEvent('↺ <b>EOCR 리셋</b> ➜ b접점(10-4) 다시 닫힘, 경보 해제');
      this.tick();
    });

    // 푸시버튼: 누르고 있는 동안만 (조작 박스는 다시 그려지므로 위임 방식)
    const press = (e, on) => {
      const btn = e.target.closest('[id^="op-pb"], [data-wall-input^="pb"]');
      if (!btn && on) return;
      if (on) {
        userAct();
        const key = btn.dataset.wallInput || btn.id.slice(3);
        this.input[key] = true;
        this.pressed = key;
        this.pressFeedback(key, true);
        const hasSS = this.boxes.some(b => [b.top, b.bottom].some(d => d?.type === 'selector'));
        this.logEvent(key === 'pb0'
          ? '👆 <b>PB0(빨강) 누름</b> ➜ NC 접점 열림 ➜ 회로 차단'
          : `👆 <b>${key.toUpperCase()}(녹색) 누름</b> ➜ NO 접점 닫힘` + (hasSS ? (this.input.ss === 'M' ? ' ➜ 수동 기동 (자기유지로 손을 떼도 계속 운전)' : ' (수동(M)일 때만 동작해요)') : ' ➜ 기동 (자기유지)'));
      } else if (this.pressed) {
        this.input[this.pressed] = false;
        this.pressFeedback(this.pressed, false);
        this.pressed = null;
      }
      this.tick();
    };
    $('.op-boxes').addEventListener('pointerdown', (e) => press(e, true));
    $('#op-wall-svg').addEventListener('pointerdown', (e) => press(e, true));
    window.addEventListener('pointerup', (e) => press(e, false));

    const selectorClick = (e) => {
      if (!e.target.closest('#op-ss, [data-wall-input="ss"]')) return;
      userAct();
      this.setSelector(this.input.ss === 'A' ? 'M' : 'A');
      playSelectorClick();
      this.flashBox('op-ss');
      this.logEvent(this.input.ss === 'A'
        ? '🔄 셀렉터 <b>자동(A)</b> ➜ FLS가 수위를 보고 자동 운전'
        : '🔄 셀렉터 <b>수동(M)</b> ➜ PB0 ➜ PB1로 직접 운전 (FLS 전원 끊김)');
      this.tick();
    };
    $('.op-boxes').addEventListener('click', selectorClick);
    $('#op-wall-svg').addEventListener('click', selectorClick);

    // 리밋스위치: 조작 칸 버튼 · 시퀀스 도면의 LS 접점 · 벽면 TB4 옆 리밋스위치 어디서든 누르면 감지 ON/OFF
    // (도면은 타이머 진행 중 자주 다시 그려지므로 click 대신 pointerdown으로 받음)
    this.container.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-switch]');
      if (!b || e.button !== 0) return;
      e.preventDefault();
      userAct();
      const key = b.dataset.switch;
      this.input[key] = !this.input[key];
      playSelectorClick();
      const sw = (this.op.switches || []).find(x => x.input === key);
      this.logEvent(`🔘 <b>${sw?.name || key}</b> ${this.input[key] ? '감지(ON) ➜ a접점 닫힘' : '감지 해제(OFF) ➜ a접점 열림'}`);
      this.lastSigs = null;
      this.tick();
    });
    $('#op-level')?.addEventListener('input', (e) => {
      this.input.level = parseFloat(e.target.value);
      this.tick();
    });
    $('#op-auto-level')?.addEventListener('change', (e) => { this.input.autoLevel = e.target.checked; });
    $('#op-timer-set').addEventListener('change', (e) => {
      this.timerSet = Math.max(1, Math.min(30, parseFloat(e.target.value) || this.op.timerSetSec));
      e.target.value = this.timerSet;
      if (this.updateTimerWarn() === false) {
        this.logEvent(`⚠️ <b>T 설정 ${this.timerSet}초 ≥ FR 설정 ${this.op.flickerSec}초</b> ➜ 문제지 초기 운전 조건(T &lt; FR)과 달라요. ①→②→③ 순서대로 동작하지 않을 수 있어요.`);
      }
    });
    this.updateTimerWarn();
  }

  /**
   * 문제지 '초기 운전 조건: 타이머 설정시간 < 플리커릴레이 설정시간'(4·7번, operation.timerBelowFlicker)
   * T 설정을 바꾸면 조건을 지키는지 바로 보여 줌 — 지키면 true, 어기면 false, 해당 없는 과제는 null
   */
  updateTimerWarn() {
    const box = this.container.querySelector('#op-timer-warn');
    if (!box || !this.op.timerBelowFlicker) return null;
    const ok = this.timerSet < this.op.flickerSec;
    box.style.display = '';
    box.classList.toggle('bad', !ok);
    box.innerHTML = ok
      ? `✅ 초기 운전 조건: T 설정 <b>${this.timerSet}초</b> &lt; FR 설정 <b>${this.op.flickerSec}초</b>`
      : `⚠️ T 설정 <b>${this.timerSet}초</b>가 FR 설정 <b>${this.op.flickerSec}초</b>보다 길거나 같아요!<br>문제지 초기 운전 조건(T &lt; FR)을 지켜야 ①→②→③ 순서대로 동작합니다.`;
    return ok;
  }

  /**
   * 셀렉터 전환: 실제 셀렉터처럼 한쪽 접점이 먼저 떨어진 뒤(양쪽 모두 열림) 다른 쪽이 닿음 (break-before-make)
   * - 전환 순간 자기유지 회로가 끊겨 '자동 ↔ 수동 전환 시 모두 정지'가 도면대로 동작
   */
  setSelector(pos) {
    if (this.input.ss === pos) return;
    this.input.ss = null;
    this.tick();
    this.input.ss = pos;
    this.tick();
  }

  setPower(on) {
    this.input.power = on;
    if (!on) {
      this.input.pb0 = this.input.pb1 = false;
    }
    this.logEvent(on
      ? '🔌 <b>MCCB ON</b> ➜ 퓨즈를 지나 ① 전원선에 전기가 와요. EOCR b접점(10-4)을 지나 ② 모선까지 전기가 흘러요!'
      : '⏻ <b>MCCB OFF</b> ➜ 모든 회로에 전기가 끊겼어요.');
    this.tick();
  }

  // ---------------------------------------------------------------------------
  // 문제지 '4) 제어회로의 동작 사항' 단계별 테스트 (모두 통과하면 동작 테스트 성공)
  // ---------------------------------------------------------------------------

  checklistMarkup() {
    const steps = this.op.steps || [];
    return `
      <section class="op-card op-checklist">
        <h4>📋 제어회로 동작 사항 <small>문제지 4번 — 단계마다 ▶를 눌러 확인</small></h4>
        <ol class="op-steps" id="op-steps">
          ${steps.map((st, i) => `
            <li class="op-step" data-idx="${i}">
              <span class="op-step-state" id="op-step-state-${i}">○</span>
              <span class="op-step-title">${st.title}</span>
              <button class="op-step-run" data-idx="${i}" title="이 단계 실행">▶</button>
            </li>`).join('')}
        </ol>
        <div class="op-step-summary" id="op-step-summary">아직 테스트하지 않았어요. 위에서부터 차례로 ▶를 눌러 보세요!</div>
      </section>`;
  }

  setStepState(i, state) {
    this.stepResults = this.stepResults || {};
    this.stepResults[i] = state;
    const el = this.container.querySelector(`#op-step-state-${i}`);
    const li = this.container.querySelector(`.op-step[data-idx="${i}"]`);
    if (el) el.textContent = { running: '⏳', pass: '✅', fail: '❌', idle: '○' }[state];
    if (li) {
      li.classList.toggle('running', state === 'running');
      li.classList.toggle('pass', state === 'pass');
      li.classList.toggle('fail', state === 'fail');
      if (state === 'running') li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    this.updateSummary();
  }

  updateSummary() {
    const total = (this.op.steps || []).length;
    const results = Object.values(this.stepResults || {});
    const pass = results.filter(r => r === 'pass').length;
    const fail = results.filter(r => r === 'fail').length;
    const box = this.container.querySelector('#op-step-summary');
    if (!box) return;
    box.classList.toggle('success', pass === total);
    box.classList.toggle('failed', fail > 0);
    box.innerHTML = pass === total
      ? `🎉 <b>동작 사항 ${total}개 모두 통과 — 동작 테스트 성공!</b>`
      : `통과 <b>${pass}</b> / ${total}${fail ? ` · 실패 <b>${fail}</b>` : ''}`;
  }

  /** 단계 하나 실행: 조작(actions) ➜ 잠시 기다린 뒤 기대 결과(expect) 판정 */
  async runStep(i, token = null) {
    const st = this.op.steps[i];
    if (!st) return false;
    if (token === null) token = ++this.runToken;
    const alive = () => token === this.runToken;
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    // 테스트 중에는 수위가 저절로 바뀌지 않게 (판정이 흔들리지 않도록)
    this.input.autoLevel = false;
    const autoBox = this.container.querySelector('#op-auto-level');
    if (autoBox) autoBox.checked = false;

    this.setStepState(i, 'running');
    this.logEvent(`📋 <b>${st.title}</b> 테스트 시작`);

    for (const a of st.actions) {
      if (!alive()) return false;
      switch (a.do) {
        case 'reset':
          this.input = { ...this.input, power: false, ss: 'A', pb0: false, pb1: false, pb2: false, eocrTrip: false, level: 50 };
          (this.op.switches || []).forEach(sw => { this.input[sw.input] = false; });
          this.tick();
          await wait(300);
          break;
        case 'power':
          this.setPower(a.value);
          await wait(500);
          break;
        case 'ss':
          if (this.input.ss !== a.value) { playSelectorClick(); this.flashBox('op-ss'); }
          this.setSelector(a.value);
          this.logEvent(a.value === 'A' ? '🔄 셀렉터를 <b>자동(A)</b>으로' : '🔄 셀렉터를 <b>수동(M)</b>으로');
          this.tick();
          await wait(500);
          break;
        case 'level':
          this.input.level = a.value;
          this.logEvent(a.value <= this.op.levels.E2
            ? `💧 수위를 <b>${a.value}%</b>로 (E2 아래 ➜ FLS 수위 감지)`
            : `💧 수위를 <b>${a.value}%</b>로 (E1 위 ➜ FLS 수위 감지 해제)`);
          this.tick();
          await wait(500);
          break;
        case 'press':
          this.input[a.target] = true;
          this.pressFeedback(a.target, true);
          this.logEvent(a.target === 'pb0' ? '👆 <b>PB0(빨강·정지)</b> 누름' : `👆 <b>${a.target.toUpperCase()}(녹색·기동)</b> 누름`);
          this.tick();
          // holdTimer: 타이머 설정시간 이상 누르고 있기 (11번처럼 타이머 접점으로 자기유지되는 회로)
          await wait(a.holdTimer ? this.timerSet * 1000 + (a.extraMs ?? 500) : a.ms);
          this.input[a.target] = false;
          this.pressFeedback(a.target, false);
          this.tick();
          await wait(300);
          break;
        case 'wait':
          await wait(a.ms);
          break;
        case 'waitCoil': {
          // 지정한 코일이 켜질(on: true) / 꺼질(on: false) 때까지 기다림 (교대 운전 순서 확인용)
          const want = a.on ?? true;
          const until = performance.now() + (a.timeout ?? 9000);
          this.logEvent(`⏳ <b>${a.coil}</b> ${want ? '여자' : '소자'}될 때까지 기다리는 중...`);
          while (!!this.coil[a.coil] !== want && performance.now() < until) {
            if (!alive()) return false;
            await wait(60);
          }
          await wait(a.extraMs ?? 200);
          break;
        }
        case 'switch': {
          const sw = (this.op.switches || []).find(x => x.input === a.target);
          this.input[a.target] = a.value;
          playSelectorClick();
          this.logEvent(`🔘 <b>${sw?.name || a.target}</b> ${a.value ? '감지(ON)' : '감지 해제(OFF)'}`);
          this.tick();
          await wait(a.ms ?? 400);
          break;
        }
        case 'waitTimer':
          this.logEvent(`⏱️ 타이머 설정시간 <b>${this.timerSet}초</b> 기다리는 중...`);
          {
            // 타이머가 이미 동작 중이면 남은 시간만 기다림 (그 타이머가 여자된 시점 기준, a.coil로 지정)
            const st = a.coil ? this.timerStart[a.coil] : this.tStart;
            const elapsed = st != null ? performance.now() - st : 0;
            await wait(Math.max(0, this.timerSet * 1000 - elapsed) + (a.extraMs ?? 600));
          }
          break;
        case 'trip':
          this.input.eocrTrip = true;
          this.tick();
          await wait(250);
          break;
        case 'eocrReset':
          if (this.input.eocrTrip) this.resetFeedback();
          this.input.eocrTrip = false;
          this.logEvent('↺ <b>EOCR 리셋</b>');
          this.tick();
          await wait(500);
          break;
        default:
          break;
      }
    }
    if (!alive()) return false;

    // 판정
    const C = this.coil;
    const ex = st.expect || {};
    const problems = [];
    (ex.on || []).forEach(id => { if (!C[id]) problems.push(`${id} 꺼짐(켜져야 함)`); });
    (ex.off || []).forEach(id => { if (C[id]) problems.push(`${id} 켜짐(꺼져야 함)`); });
    if (ex.alternate) {
      // 교대 동작: 쌍마다 둘 다 한 번 이상 켜지고, 동시에 켜진 적이 없어야 함
      const pairs = Array.isArray(ex.alternate[0]) ? ex.alternate : [ex.alternate];
      const seen = {};
      const both = new Set();
      const until = performance.now() + (ex.within || 2500);
      while (performance.now() < until) {
        if (!alive()) return false;
        pairs.forEach((pair, k) => {
          pair.forEach(id => { if (this.coil[id]) seen[id] = true; });
          if (pair.every(id => this.coil[id])) both.add(k);
        });
        await wait(80);
      }
      pairs.forEach((pair, k) => {
        pair.forEach(id => { if (!seen[id]) problems.push(`${id} 동작 안 함`); });
        if (both.has(k)) problems.push(`${pair.join('·')} 동시에 동작(교대가 아님)`);
      });
    }
    if (ex.blink) {
      // 점멸: 지켜보는 동안 켜진 때와 꺼진 때가 모두 있어야 함
      const lit = {};
      const dark = {};
      const until = performance.now() + (ex.within || 2500);
      while (performance.now() < until) {
        if (!alive()) return false;
        ex.blink.forEach(id => { if (this.coil[id]) lit[id] = true; else dark[id] = true; });
        await wait(80);
      }
      ex.blink.forEach(id => {
        if (!lit[id]) problems.push(`${id} 켜지지 않음(점멸 아님)`);
        else if (!dark[id]) problems.push(`${id} 계속 켜짐(점멸 아님)`);
      });
    }

    const ok = problems.length === 0;
    this.setStepState(i, ok ? 'pass' : 'fail');
    this.logEvent(ok
      ? `✅ <b>${st.title}</b> — 동작 사항과 일치!`
      : `❌ <b>${st.title}</b> — ${problems.join(', ')}`);
    return ok;
  }

  /** 아직 통과하지 않은 첫 단계부터 하나 실행 */
  async runNextStep() {
    const steps = this.op.steps || [];
    const results = this.stepResults || {};
    const next = steps.findIndex((_, i) => results[i] !== 'pass');
    if (next === -1) {
      this.logEvent('🎉 모든 동작 사항을 이미 통과했어요! ↺ 초기화 후 다시 해볼 수 있어요.');
      return;
    }
    await this.runStep(next);
  }

  /** 전체 단계를 처음부터 차례로 실행 */
  async runAllSteps() {
    const token = ++this.runToken;
    this.stepResults = {};
    (this.op.steps || []).forEach((_, i) => this.setStepState(i, 'idle'));
    for (let i = 0; i < this.op.steps.length; i++) {
      if (token !== this.runToken) return;
      await this.runStep(i, token);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  resetAll() {
    this.runToken++;
    this.setBuzzer(false);
    this.resetState();
    this.stepResults = {};
    (this.op.steps || []).forEach((_, i) => this.setStepState(i, 'idle'));
    const log = this.container.querySelector('#op-log');
    if (log) log.innerHTML = '<li>MCCB를 올려 전원을 투입하거나, 📋 동작 사항의 ▶를 눌러 보세요!</li>';
    this.container.querySelector('#op-auto-level').checked = true;
    this.container.querySelector('#op-timer-set').value = this.timerSet;
    this.tick();
  }

  updateGuideMessage(html) {
    const box = document.getElementById('step-guide-box');
    if (box) box.innerHTML = html;
  }

  setSpeed(val) {
    this.speed = val;
  }
}
