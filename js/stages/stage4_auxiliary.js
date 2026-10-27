/**
 * Stage 4: 제어판 보조회로 배선 엔진 (Auxiliary Circuit Wiring Simulator)
 * - 황색 전선(KIV 1.5㎟) 90도 칼각(직각) 배선
 * - 3단계 15대 전위 그루핑(①~⑮) 순서 + FLS 전극 최우선 직결 결선
 * - 1단자 최대 2선(루핑/데이지 체인) 규격 완벽 준수
 * - 벨 테스터(도통 시험기) 사운드 및 단자 간 통전 시뮬레이션
 */
import { getAudioContext } from '../components/audio.js';

// KIV 1.5㎟ 보조회로 황색 피복 색상
const AUX_WIRE_COLOR = '#f59e0b';

export class Stage4Auxiliary {
  constructor(boardSvg, problemData) {
    this.svg = boardSvg;
    this.problem = problemData;
    this.speed = 1.0;
    this.currentGroup = null; // null(전체) 또는 0(FLS) ~ 15
    this.isPlaying = false;
    this.audioContext = null;
    this.isMainCircuitVisible = true;
    this.showDirections = true;
    this.wiringCache = null; // 색상·차선 보정이 끝난 배선 데이터 캐시
    this.runToken = 0;       // 진행 중인 배선 애니메이션 취소용 토큰

    // 배선 통로 기본 Y 좌표 (mm)
    this.CHANNELS = {
      TOP_BUS: 95,      // TB5와 1열 기구 사이 상단 가로 배선로
      MID_BUS: 210,     // 1열 기구와 2열 기구 사이 중앙 가로 배선로
      BOT_BUS: 330,     // 2열 기구와 TB6 사이 하단 가로 배선로
      LEFT_WIRE: 25,    // 좌측 25mm 수직 배선로
      RIGHT_WIRE: 375   // 우측 25mm 수직 배선로
    };

    this.init();
  }

  init() {
    this.setupAudio();
    this.ensureLayers();
  }

  setupAudio() {
    this.audioContext = getAudioContext();
  }

  /**
   * 벨 테스터(도통 시험기) 연속 부저음 (1200Hz 삐- 소리)
   */
  playBuzzerSound(duration = 0.35) {
    if (!this.audioContext) return;
    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1180, this.audioContext.currentTime);
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
   * 전선 체결 찰칵 사운드
   */
  playWireSnapSound() {
    if (!this.audioContext) return;
    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.08);
    } catch (e) {
      // ignore
    }
  }

  ensureLayers() {
    let wireLayer = document.getElementById('aux-circuit-wire-layer');
    if (!wireLayer) {
      wireLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wireLayer.setAttribute('id', 'aux-circuit-wire-layer');
      // 주회로 레이어 위에 배치
      const mainCircuitLayer = document.getElementById('main-circuit-wire-layer');
      if (mainCircuitLayer && mainCircuitLayer.nextSibling) {
        this.svg.insertBefore(wireLayer, mainCircuitLayer.nextSibling);
      } else {
        this.svg.appendChild(wireLayer);
      }
    }

    // 결선 진행 방향 화살표 및 단자 순번 뱃지 전용 레이어
    let dirLayer = document.getElementById('aux-direction-layer');
    if (!dirLayer) {
      dirLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      dirLayer.setAttribute('id', 'aux-direction-layer');
      if (wireLayer && wireLayer.nextSibling) {
        this.svg.insertBefore(dirLayer, wireLayer.nextSibling);
      } else {
        this.svg.appendChild(dirLayer);
      }
    }

    let testerLayer = document.getElementById('aux-tester-effect-layer');
    if (!testerLayer) {
      testerLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      testerLayer.setAttribute('id', 'aux-tester-effect-layer');
      this.svg.appendChild(testerLayer);
    }
  }

  /**
   * 주회로 결선 레이어 표시/숨김 토글
   */
  toggleMainCircuit(show = null) {
    const mainLayer = document.getElementById('main-circuit-wire-layer');
    if (!mainLayer) return true;

    if (show === null) {
      this.isMainCircuitVisible = !this.isMainCircuitVisible;
    } else {
      this.isMainCircuitVisible = show;
    }

    if (this.isMainCircuitVisible) {
      mainLayer.style.display = '';
      mainLayer.style.opacity = '1';
    } else {
      mainLayer.style.display = 'none';
    }

    // UI 버튼 상태 동기화
    const label = document.getElementById('label-toggle-main');
    const icon = document.getElementById('icon-toggle-main');
    const btn = document.getElementById('btn-stage4-toggle-main');
    if (label && icon) {
      if (this.isMainCircuitVisible) {
        label.textContent = '주회로 숨김';
        icon.textContent = '👁️';
        if (btn) btn.classList.remove('active');
      } else {
        label.textContent = '주회로 표시';
        icon.textContent = '🙈';
        if (btn) btn.classList.add('active');
      }
    }

    return this.isMainCircuitVisible;
  }

  /**
   * 결선 방향 화살표 및 순번 뱃지 표시/숨김 토글
   */
  toggleDirections(show = null) {
    if (show === null) {
      this.showDirections = !this.showDirections;
    } else {
      this.showDirections = show;
    }

    const dirLayer = document.getElementById('aux-direction-layer');
    if (dirLayer) {
      dirLayer.style.display = this.showDirections ? '' : 'none';
    }

    const btn = document.getElementById('btn-stage4-toggle-dir');
    if (btn) {
      if (this.showDirections) {
        btn.classList.add('active');
        btn.innerHTML = '<span>🧭</span> 방향·순번 ON';
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span>🧭</span> 방향·순번 OFF';
      }
    }

    return this.showDirections;
  }

  /**
   * 부품 단자 정확한 (cx, cy) 좌표 계산
   */
  getTerminalPos(compId, pin) {
    const comps = this.problem.board.components;
    const comp = comps.find(c => c.id === compId);
    if (!comp) return [0, 0];

    const { x, y, width = 50, height = 68, type } = comp;
    const left = x - width / 2;
    const top = y - height / 2;

    if (type === 'socket_12p') {
      const p = parseInt(pin, 10);
      if (p >= 1 && p <= 6) {
        const sx = left + 5 + (p - 1) * ((width - 10) / 5);
        const sy = top + 6.5;
        return [sx, sy];
      } else if (p >= 7 && p <= 12) {
        const sx = left + 5 + (p - 7) * ((width - 10) / 5);
        const sy = top + height - 6.5;
        return [sx, sy];
      }
    } else if (type === 'socket_8p') {
      const p = parseInt(pin, 10);
      const topPins = [6, 5, 4, 3];
      const botPins = [7, 8, 1, 2];
      if (topPins.includes(p)) {
        const i = topPins.indexOf(p);
        const sx = left + 6 + i * ((width - 12) / 3);
        const sy = top + 6.5;
        return [sx, sy];
      } else if (botPins.includes(p)) {
        const i = botPins.indexOf(p);
        const sx = left + 6 + i * ((width - 12) / 3);
        const sy = top + height - 6.5;
        return [sx, sy];
      }
    } else if (type === 'fuse_holder') {
      // 퓨즈홀더 2차측: L1(좌측 col 0 out-1), L3(우측 col 1 out-2)
      const col = (pin === 'out-1' || pin === 'L1-out' || pin === 1) ? 0 : 1;
      const fx = left + 11 + col * 16;
      const botScrewY = top + height - 8;
      return [fx, botScrewY];
    } else if (type === 'terminal_block_20p') {
      const p = parseInt(pin, 10);
      const pinPitch = (width - 16) / 19;
      const px = left + 8 + (p - 1) * pinPitch;
      // TB5는 하단 나사(기판 내부 연결), TB6는 상단 나사(기판 내부 연결)
      const py = compId === 'TB5' ? (top + height - 6.5) : (top + 6.5);
      return [px, py];
    }

    return [x, y];
  }

  /**
   * 15대 보조회로 그루핑 및 FLS 최우선 결선 데이터 정의
   * [실기 시험 절대 원칙 반영]: 단자 사이 관통 금지!
   * 상하 가로 통로(Y=95, 210, 330)와 좌우 양끝 수직 통로(X=25, 375)로만 이동!
   * - 그룹 색상은 3단계 데이터(sequenceCircuit)에서 가져와 3·4단계 색을 통일
   * - 통로 안 선로는 차선 자동 배정(allocateLanes)으로 다른 전위·주회로와 겹치지 않게 보정
   */
  getWiringData() {
    if (this.wiringCache) return this.wiringCache;

    const { groups, flsPreWiring } = this.problem.board.sequenceCircuit;
    const raw = this.buildRawWiringData();
    raw.forEach(g => {
      const src = g.group === 0 ? flsPreWiring : groups.find(x => x.num === g.group);
      if (src?.color) g.color = src.color;
      // 좌표 배열을 복사해 차선 보정이 원본 터미널 좌표를 건드리지 않게 함
      g.segments.forEach(seg => { seg.points = seg.points.map(p => [p[0], p[1]]); });
    });

    this.allocateLanes(raw);
    this.wiringCache = raw;
    return raw;
  }

  /**
   * 통로 중앙 정렬 + 차선 미세 분리 (사용자 지침: 보조회로는 통로 중앙으로 이동)
   * 1) 통로(가로 Y=95/210/330, 세로 X=25/375) 안의 꺾임 구간을 모두 통로 중앙선에 붙인다.
   * 2) 다른 전위 그룹·주회로와 같은 선 위에 겹치면 중앙에서 1mm씩, 최대 ±4mm 안에서만 비켜 놓는다.
   *    (그 안에 빈 자리가 없으면 겹침이 가장 적은 위치를 쓰고 겹침을 허용 → 중앙 다발 유지가 우선)
   * - 단자에 닿는 첫/끝 점은 절대 움직이지 않음 (내부 꺾임 구간만 이동)
   * - 배선 경로·순서·통로 규칙은 그대로 유지
   */
  allocateLanes(wiringData) {
    const LANE = 1;     // 다발 안 전선 간격 (mm)
    const SPREAD = 4;   // 통로 중앙에서 최대 이탈 거리 (mm)
    const C = this.CHANNELS;
    const CHANNELS = {
      h: [{ band: [78, 104], center: C.TOP_BUS }, { band: [186, 236], center: C.MID_BUS }, { band: [314, 346], center: C.BOT_BUS }],
      v: [{ band: [8, 44], center: C.LEFT_WIRE }, { band: [356, 392], center: C.RIGHT_WIRE }]
    };
    const channelOf = (orient, c) => CHANNELS[orient].find(({ band }) => c >= band[0] && c <= band[1]);
    const runOf = (a, b) => {
      if (Math.abs(a[1] - b[1]) < 1e-6) return { orient: 'h', c: a[1], lo: Math.min(a[0], b[0]), hi: Math.max(a[0], b[0]) };
      if (Math.abs(a[0] - b[0]) < 1e-6) return { orient: 'v', c: a[0], lo: Math.min(a[1], b[1]), hi: Math.max(a[1], b[1]) };
      return null;
    };
    const conflicts = (run, owner, placed) => placed.some(p =>
      p.owner !== owner && p.orient === run.orient && Math.abs(p.c - run.c) < LANE - 1e-6 &&
      Math.min(p.hi, run.hi) - Math.max(p.lo, run.lo) > 0.5
    );
    const forEachChannelRun = (pts, orient, fn) => {
      for (let i = 1; i + 1 <= pts.length - 2; i++) {
        const run = runOf(pts[i], pts[i + 1]);
        if (!run || run.orient !== orient) continue;
        const ch = channelOf(orient, run.c);
        if (ch) fn(i, run, ch);
      }
    };

    // 0) 모든 통로 구간을 통로 중앙선에 정렬 (세로 먼저 → 가로)
    ['v', 'h'].forEach(orient => {
      const axis = orient === 'h' ? 1 : 0;
      wiringData.forEach(g => g.segments.forEach(seg => {
        forEachChannelRun(seg.points, orient, (i, run, ch) => {
          seg.points[i][axis] = ch.center;
          seg.points[i + 1][axis] = ch.center;
        });
      }));
    });

    // 주회로 전선은 움직이지 않는 고정 장애물
    const mainRuns = [];
    (this.problem.board.mainCircuit?.steps || []).forEach(step => step.wires.forEach(w => {
      for (let i = 0; i < w.points.length - 1; i++) {
        const r = runOf(w.points[i], w.points[i + 1]);
        if (r) mainRuns.push({ ...r, owner: 'main' });
      }
    }));

    // 1) 중앙 ±SPREAD 안에서 겹침이 가장 적은 차선 선택 (같으면 중앙에 가까운 쪽)
    for (let iter = 0; iter < 6; iter++) {
      let moved = false;
      ['v', 'h'].forEach(orient => {
        const axis = orient === 'h' ? 1 : 0;
        const placed = [...mainRuns];
        wiringData.forEach(g => g.segments.forEach(seg => {
          const pts = seg.points;
          // 구간 i를 좌표 c로 옮겼을 때 자신과 양옆 연결선(길이가 바뀜)의 겹침 개수
          const scoreAt = (i, c) => {
            const trial = pts.map(p => [p[0], p[1]]);
            trial[i][axis] = c;
            trial[i + 1][axis] = c;
            return [i - 1, i, i + 1].filter(j => {
              if (j < 0 || j >= trial.length - 1) return false;
              const r = runOf(trial[j], trial[j + 1]);
              return r && conflicts(r, g.group, placed);
            }).length;
          };
          forEachChannelRun(pts, orient, (i, run, ch) => {
            let best = { c: ch.center, score: scoreAt(i, ch.center) };
            for (let k = 1; k <= SPREAD / LANE && best.score > 0; k++) {
              [ch.center + k * LANE, ch.center - k * LANE].forEach(c => {
                const score = scoreAt(i, c);
                if (score < best.score) best = { c, score };
              });
            }
            if (best.c !== run.c) {
              pts[i][axis] = best.c;
              pts[i + 1][axis] = best.c;
              moved = true;
            }
          });
          // 확정된 이 전선의 모든 구간을 점유 목록에 등록
          for (let i = 0; i < pts.length - 1; i++) {
            const run = runOf(pts[i], pts[i + 1]);
            if (run) placed.push({ ...run, owner: g.group });
          }
        }));
      });
      if (!moved) break;
    }
  }

  /**
   * 자동 경로 생성 (문제 데이터 auxChains: 그룹별 결선 순서 단자 목록)
   * - 단자 → 가장 가까운 가로 통로(TB5·1열 위 = Y95, 1열 아래·2열 위 = Y210, 2열 아래·TB6 = Y330)
   * - 같은 통로면 그 통로로 가로 이동, 다르면 좌측(X25) 또는 우측(X375) 끝 통로로 층간 이동 (기구 사이 관통 금지)
   * - 통로 안 차선은 allocateLanes가 중앙 다발로 정리
   */
  buildAutoWiring() {
    const C = this.CHANNELS;
    const sc = this.problem.board.sequenceCircuit;
    const chains = this.problem.board.auxChains;
    const comps = this.problem.board.components;
    const marks = this.problem.board.terminalMarkings || {};
    const labelOf = (comp, pin) => {
      if (comp === 'TB5' || comp === 'TB6') {
        const m = (marks[comp.toLowerCase()] || []).find(x => x.pin === pin);
        return `${comp} ${pin}번${m && m.label !== '-' ? ` (${m.label})` : ''}`;
      }
      if (comp === 'F') return pin === 'out-1' ? 'F 2차 L1 (out-1)' : 'F 2차 L3 (out-2)';
      return `${comp} ${pin}번`;
    };
    const channelOf = (comp, pos) => {
      if (comp === 'TB5') return C.TOP_BUS;
      if (comp === 'TB6') return C.BOT_BUS;
      const c = comps.find(x => x.id === comp);
      if (c.y < 200) return pos[1] < c.y ? C.TOP_BUS : C.MID_BUS;
      return pos[1] < c.y ? C.MID_BUS : C.BOT_BUS;
    };
    // 도착 단자에 세 번째 값 'L' / 'R'이 있으면 층간 이동을 그쪽 끝 통로로 (없으면 가까운 쪽)
    const route = ([ca, pa], [cb, pb, side]) => {
      const pA = this.getTerminalPos(ca, pa);
      const pB = this.getTerminalPos(cb, pb);
      const yA = channelOf(ca, pA);
      const yB = channelOf(cb, pB);
      let pts;
      if (yA === yB) {
        pts = [pA, [pA[0], yA], [pB[0], yA], pB];
      } else {
        const nearLeft = side ? side === 'L' : (pA[0] + pB[0]) / 2 < 200;
        const sx = nearLeft ? C.LEFT_WIRE : C.RIGHT_WIRE;
        pts = [pA, [pA[0], yA], [sx, yA], [sx, yB], [pB[0], yB], pB];
      }
      return pts.filter((p, i) => i === 0 || Math.abs(p[0] - pts[i - 1][0]) > 0.01 || Math.abs(p[1] - pts[i - 1][1]) > 0.01);
    };
    return Object.entries(chains).map(([num, chain]) => {
      const group = Number(num);
      const meta = group === 0 ? sc.flsPreWiring : sc.groups.find(g => g.num === group);
      const pairs = group === 0 ? chain : chain.slice(0, -1).map((t, i) => [t, chain[i + 1]]);
      const order = group === 0 ? chain.map(([x, y]) => `${labelOf(...x)} ➜ ${labelOf(...y)}`).join(', ') : chain.map(t => labelOf(...t)).join(' ➜ ');
      return {
        group,
        name: meta?.name || `그룹 ${group}`,
        desc: `${order} 순서로 결선합니다. (가로 통로 ➜ 양 끝 25mm 통로로만 이동)`,
        tip: meta?.tip || (group === 0 ? '⚡ 주회로 직후 가장 먼저 FLS 전극선을 직결합니다.' : ''),
        color: meta?.color || '#f59e0b',
        segments: pairs.map(([a, b], k) => ({
          id: `g${group}-${k}-${a.join('_')}-${b.join('_')}`,
          from: labelOf(...a),
          to: labelOf(...b),
          points: route(a, b)
        }))
      };
    });
  }

  buildRawWiringData() {
    if (this.problem.board.auxChains) return this.buildAutoWiring();
    const C = this.CHANNELS;

    return [
      // ⚡ [최우선 결선] FLS 전극봉 ➜ 하단 단자대 TB4(11, 12, 13)
      {
        group: 0,
        name: "⚡ [최우선 결선] FLS 전극 직결선 (7·8·1 ➜ E1·E2·E3)",
        desc: "주회로 완료 직후 보조회로에 앞서 가장 먼저 FLS 7·8·1번과 하단 단자대 TB4의 E1·E2·E3 단자를 하단 가로 배선로를 통해 직결합니다.",
        tip: "⚠️ <b>실격 방지 핵심</b>: 수위 센서선은 단자 사이를 가로지르지 않고 하단 통로(Y=330)로만 직결합니다.",
        color: "#06b6d4",
        segments: [
          {
            id: "fls-e1",
            from: "FLS 7번",
            to: "TB6 11번 (E1)",
            points: [
              this.getTerminalPos('FLS', 7),
              [this.getTerminalPos('FLS', 7)[0], C.BOT_BUS - 4],
              [this.getTerminalPos('TB6', 11)[0], C.BOT_BUS - 4],
              this.getTerminalPos('TB6', 11)
            ]
          },
          {
            id: "fls-e2",
            from: "FLS 8번",
            to: "TB6 12번 (E2)",
            points: [
              this.getTerminalPos('FLS', 8),
              [this.getTerminalPos('FLS', 8)[0], C.BOT_BUS],
              [this.getTerminalPos('TB6', 12)[0], C.BOT_BUS],
              this.getTerminalPos('TB6', 12)
            ]
          },
          {
            id: "fls-e3",
            from: "FLS 1번",
            to: "TB6 13번 (E3)",
            points: [
              this.getTerminalPos('FLS', 1),
              [this.getTerminalPos('FLS', 1)[0], C.BOT_BUS + 4],
              [this.getTerminalPos('TB6', 13)[0], C.BOT_BUS + 4],
              this.getTerminalPos('TB6', 13)
            ]
          }
        ]
      },

      // ① EOCR 6번 ➜ 퓨즈 2차 L1 (out-1) ➜ EOCR 10번
      // [위에서 아래로 일관된 방향]: 1열 상단 EOCR 6번 ➜ 좌측 끝 통로 ➜ 퓨즈 2차 L1 ➜ 중앙 통로 ➜ 1열 하단 EOCR 10번
      {
        group: 1,
        name: "① 제어회로 상단 전원 인입선",
        desc: "EOCR 6번 ➜ 상단 통로 ➜ 좌측 끝 25mm 통로(X=25) 하강 ➜ 퓨즈 2차 L1(out-1) ➜ 중앙 통로(Y=210) ➜ EOCR 10번 순서로 위에서 아래로 일관되게 배선합니다.",
        tip: "⚠️ <b>위에서 아래로 일관된 방향</b>: EOCR 6번(상단)에서 출발하여 좌측 끝 통로를 타고 퓨즈로 내려온 후, 중앙 통로를 통해 EOCR 10번(하단)으로 결선합니다.",
        color: "#f59e0b",
        segments: [
          {
            id: "g1-eocr6-f",
            from: "EOCR 6번",
            to: "F 2차 L1 (out-1)",
            points: [
              this.getTerminalPos('EOCR', 6),
              [this.getTerminalPos('EOCR', 6)[0], C.TOP_BUS + 4],
              [C.LEFT_WIRE + 2, C.TOP_BUS + 4],
              [C.LEFT_WIRE + 2, C.MID_BUS - 6],
              [this.getTerminalPos('F', 'out-1')[0], C.MID_BUS - 6],
              this.getTerminalPos('F', 'out-1')
            ]
          },
          {
            id: "g1-f-eocr10",
            from: "F 2차 L1 (out-1)",
            to: "EOCR 10번",
            points: [
              this.getTerminalPos('F', 'out-1'),
              [this.getTerminalPos('F', 'out-1')[0], C.MID_BUS - 4],
              [this.getTerminalPos('EOCR', 10)[0], C.MID_BUS - 4],
              this.getTerminalPos('EOCR', 10)
            ]
          }
        ]
      },

      // ② TB5 6번(SS공통) ➜ EOCR 4번 ➜ (좌측 끝 통로 U턴 하강) ➜ MC1 4번 ➜ X 1번 ➜ MC2 4번
      // [맨 위 SS공통 시작 ➜ EOCR 거쳐 왼쪽으로 돌아 내려와 오른쪽으로 순차 이동 (좌 ➜ 우 완벽 일치)]
      {
        group: 2,
        name: "② 제어회로 메인 상시전원 공급 모선",
        desc: "맨 위 TB5 6번(SS공통)에서 시작하여 EOCR 4번을 거친 뒤, 좌측 끝 25mm 통로(X=25)로 돌아 내려와 중앙 통로(Y=210)에서 오른쪽으로 MC1 4번 ➜ X 1번 ➜ MC2 4번 순서로 진행 방향을 따라 물 흐르듯 순차 배선합니다.",
        tip: "⚠️ <b>진행 방향 우선 (좌 ➜ 우 순차 배선)</b>: 좌측 통로(X=25)에서 중앙 통로로 진입한 후 만나는 순서(MC1 4번 ➜ X 1번 ➜ MC2 4번)대로 결선하여 역주행이나 꼬임이 전혀 없습니다.",
        color: "#eab308",
        segments: [
          {
            id: "g2-tb5_6-eocr4",
            from: "TB5 6번 (SS공통)",
            to: "EOCR 4번",
            points: [
              this.getTerminalPos('TB5', 6),
              [this.getTerminalPos('TB5', 6)[0], C.TOP_BUS + 2],
              [this.getTerminalPos('EOCR', 4)[0], C.TOP_BUS + 2],
              this.getTerminalPos('EOCR', 4)
            ]
          },
          {
            id: "g2-eocr4-mc1_4",
            from: "EOCR 4번",
            to: "MC1 4번",
            points: [
              this.getTerminalPos('EOCR', 4),
              [this.getTerminalPos('EOCR', 4)[0], C.TOP_BUS - 2],
              [C.LEFT_WIRE + 6, C.TOP_BUS - 2],
              [C.LEFT_WIRE + 6, C.MID_BUS - 4],
              [this.getTerminalPos('MC1', 4)[0], C.MID_BUS - 4],
              this.getTerminalPos('MC1', 4)
            ]
          },
          {
            id: "g2-mc1_4-x1",
            from: "MC1 4번",
            to: "X 1번",
            points: [
              this.getTerminalPos('MC1', 4),
              [this.getTerminalPos('MC1', 4)[0], C.MID_BUS - 2],
              [this.getTerminalPos('X', 1)[0], C.MID_BUS - 2],
              this.getTerminalPos('X', 1)
            ]
          },
          {
            id: "g2-x1-mc2_4",
            from: "X 1번",
            to: "MC2 4번",
            points: [
              this.getTerminalPos('X', 1),
              [this.getTerminalPos('X', 1)[0], C.MID_BUS],
              [this.getTerminalPos('MC2', 4)[0], C.MID_BUS],
              this.getTerminalPos('MC2', 4)
            ]
          }
        ]
      },

      // ③ *EOCR 5번 ➜ FR 2번 코일 ➜ FR 8번 공통
      {
        group: 3,
        name: "③ EOCR 트립 과부하 경보선",
        desc: "EOCR 5번(상단)에서 상단 통로 ➜ 우측 끝 통로(X=375) ➜ 중앙 통로 ➜ FR 2번 ➜ FR 8번으로 결선합니다.",
        tip: "⚠️ <b>단자 사이 관통 금지</b>: 기구 사이 틈새를 타지 않고 우측 끝 25mm 통로(X=375)로 층간 이동합니다.",
        color: "#fb923c",
        segments: [
          {
            id: "g3-eocr5-fr2",
            from: "EOCR 5번",
            to: "FR 2번",
            points: [
              this.getTerminalPos('EOCR', 5),
              [this.getTerminalPos('EOCR', 5)[0], C.TOP_BUS - 4],
              [C.RIGHT_WIRE - 4, C.TOP_BUS - 4],
              [C.RIGHT_WIRE - 4, C.MID_BUS - 6],
              [this.getTerminalPos('FR', 2)[0], C.MID_BUS - 6],
              this.getTerminalPos('FR', 2)
            ]
          },
          {
            id: "g3-fr2-fr8",
            from: "FR 2번",
            to: "FR 8번",
            points: [
              this.getTerminalPos('FR', 2),
              [this.getTerminalPos('FR', 2)[0], C.MID_BUS - 2],
              [this.getTerminalPos('FR', 8)[0], C.MID_BUS - 2],
              this.getTerminalPos('FR', 8)
            ]
          }
        ]
      },

      // ④ FR 6번(a접점) ➜ TB6 1번(YL)
      {
        group: 4,
        name: "④ 황색 표시등(YL) 점멸선",
        desc: "FR 6번(a접점) ➜ 상단 통로 ➜ 우측 끝 통로(X=375) ➜ 하단 통로(Y=330) ➜ TB6 1번(YL)으로 배선합니다.",
        tip: "💡 기구 사이를 가로지르지 않고 외곽 배선로(X=375)를 따라 안전하게 하강합니다.",
        color: "#facc15",
        segments: [
          {
            id: "g4-fr6-tb6_1",
            from: "FR 6번",
            to: "TB6 1번 (YL)",
            points: [
              this.getTerminalPos('FR', 6),
              [this.getTerminalPos('FR', 6)[0], C.TOP_BUS + 4],
              [C.RIGHT_WIRE - 6, C.TOP_BUS + 4],
              [C.RIGHT_WIRE - 6, C.BOT_BUS + 6],
              [this.getTerminalPos('TB6', 1)[0], C.BOT_BUS + 6],
              this.getTerminalPos('TB6', 1)
            ]
          }
        ]
      },

      // ⑤ FR 5번(b접점) ➜ TB6 2번(BZ)
      {
        group: 5,
        name: "⑤ 전자 부저(BZ) 경보음 점멸선",
        desc: "FR 5번(b접점) ➜ 상단 통로 ➜ 우측 끝 통로(X=375) ➜ 하단 통로(Y=330) ➜ TB6 2번(BZ)으로 배선합니다.",
        tip: "💡 우측 25mm 배선로(X=375)를 타고 1단자 2선 원칙을 지키며 하강합니다.",
        color: "#f87171",
        segments: [
          {
            id: "g5-fr5-tb6_2",
            from: "FR 5번",
            to: "TB6 2번 (BZ)",
            points: [
              this.getTerminalPos('FR', 5),
              [this.getTerminalPos('FR', 5)[0], C.TOP_BUS + 6],
              [C.RIGHT_WIRE - 8, C.TOP_BUS + 6],
              [C.RIGHT_WIRE - 8, C.BOT_BUS + 8],
              [this.getTerminalPos('TB6', 2)[0], C.BOT_BUS + 8],
              this.getTerminalPos('TB6', 2)
            ]
          }
        ]
      },

      // ⑥ SS-A(TB5 5번) ➜ FLS 5번 코일 전원 ➜ FLS 4번 a접점
      // [진행 방향 좌 ➜ 우 완벽 일치]: 좌측 통로 진입 후 먼저 만나는 5번(코일) ➜ 4번(접점)으로 순차 전진
      {
        group: 6,
        name: "⑥ 자동(A) 운전 모드 FLS 전원선",
        desc: "TB5 5번(SS-A) ➜ 상단 통로 ➜ 좌측 끝 통로(X=25) ➜ 중앙 통로(Y=210)로 하강한 후, 진행 방향을 따라 먼저 만나는 FLS 5번(코일)에 결선하고 이어서 FLS 4번(a접점)으로 일관되게 전진 결선합니다.",
        tip: "⚠️ <b>진행 방향 우선 (좌 ➜ 우 일관 순서)</b>: 8핀 소켓 상단핀 [6, 5, 4, 3] 중 좌측에서 진입하면서 먼저 만나는 5번에 체결 후 4번으로 전진하여 역주행이 없습니다.",
        color: "#38bdf8",
        segments: [
          {
            id: "g6-tb5_5-fls5",
            from: "TB5 5번 (SS-A)",
            to: "FLS 5번",
            points: [
              this.getTerminalPos('TB5', 5),
              [this.getTerminalPos('TB5', 5)[0], C.TOP_BUS],
              [C.LEFT_WIRE + 6, C.TOP_BUS],
              [C.LEFT_WIRE + 6, C.MID_BUS - 6],
              [this.getTerminalPos('FLS', 5)[0], C.MID_BUS - 6],
              this.getTerminalPos('FLS', 5)
            ]
          },
          {
            id: "g6-fls5-fls4",
            from: "FLS 5번",
            to: "FLS 4번",
            points: [
              this.getTerminalPos('FLS', 5),
              [this.getTerminalPos('FLS', 5)[0], C.MID_BUS - 4],
              [this.getTerminalPos('FLS', 4)[0], C.MID_BUS - 4],
              this.getTerminalPos('FLS', 4)
            ]
          }
        ]
      },

      // ⑦ FLS 3번 ➜ X 2번 코일
      {
        group: 7,
        name: "⑦ 자동 수위 감지 릴레이(X) 기동선",
        desc: "FLS 3번(2열 상단) ➜ 중앙 가로 통로(Y=210) ➜ X 2번(1열 하단)으로 수평 직진 결선합니다.",
        tip: "💡 둘 다 중앙 가로 배선로(Y=210)에 접해 있어 층간 이동 없이 칼각 직진 배선합니다.",
        color: "#60a5fa",
        segments: [
          {
            id: "g7-fls3-x2",
            from: "FLS 3번",
            to: "X 2번",
            points: [
              this.getTerminalPos('FLS', 3),
              [this.getTerminalPos('FLS', 3)[0], C.MID_BUS - 2],
              [this.getTerminalPos('X', 2)[0], C.MID_BUS - 2],
              this.getTerminalPos('X', 2)
            ]
          }
        ]
      },

      // ⑧ SS-M(TB5 4번) ➜ PB0(TB5 1번)
      {
        group: 8,
        name: "⑧ 수동(M) 운전 모드 정지버튼 전원선",
        desc: "상단 단자대(TB5) 4번(SS-M)에서 나와 상단 가로 배선로(Y=95)를 타고 1번(PB0)으로 배선합니다.",
        tip: "💡 상단 통로(Y=95) 내에서 단자 사이 침범 없이 직각 루핑합니다.",
        color: "#a855f7",
        segments: [
          {
            id: "g8-tb5_4-tb5_1",
            from: "TB5 4번 (SS-M)",
            to: "TB5 1번 (PB0)",
            points: [
              this.getTerminalPos('TB5', 4),
              [this.getTerminalPos('TB5', 4)[0], C.TOP_BUS - 4],
              [this.getTerminalPos('TB5', 1)[0], C.TOP_BUS - 4],
              this.getTerminalPos('TB5', 1)
            ]
          }
        ]
      },

      // ⑨ PB0/PB1 공통(TB5 3번) ➜ T 1번 순시 a접점
      {
        group: 9,
        name: "⑨ 수동 기동 신호 및 타이머 순시 공급선",
        desc: "TB5 3번(PB공통) ➜ 상단 통로 ➜ 좌측 끝 통로(X=25) ➜ 하단 통로 ➜ T 1번(순시 a접점)으로 배선합니다.",
        tip: "⚠️ <b>단자 사이 관통 금지</b>: 좌측 끝 25mm 통로(X=25)를 경유하여 기구 사이 침범 없이 안전 배선합니다.",
        color: "#ec4899",
        segments: [
          {
            id: "g9-tb5_3-t1",
            from: "TB5 3번 (PB공통)",
            to: "T 1번 (순시a)",
            points: [
              this.getTerminalPos('TB5', 3),
              [this.getTerminalPos('TB5', 3)[0], C.TOP_BUS - 2],
              [C.LEFT_WIRE + 8, C.TOP_BUS - 2],
              [C.LEFT_WIRE + 8, C.BOT_BUS - 8],
              [this.getTerminalPos('T', 1)[0], C.BOT_BUS - 8],
              this.getTerminalPos('T', 1)
            ]
          }
        ]
      },

      // ⑩ TB5 2번(PB1) ➜ X 3번(자기유지) ➜ X 8번 ➜ MC1 6번 ➜ T 3번 ➜ T 8번
      // [상단 ➜ 하단 일관된 순차 결선]: TB5(최상단) ➜ X 3(상단핀) ➜ X 8(하단핀) ➜ MC1 6(2열상단) ➜ T 3(상단핀) ➜ T 8(하단핀)
      {
        group: 10,
        name: "⑩ 수동/자동 공통 메인 기동 루프 모선",
        desc: "TB5 2번(최상단) ➜ 상단 통로 ➜ X 3번(상단핀) ➜ 우측끝 통로 ➜ X 8번(하단핀) ➜ MC1 6번 ➜ 중앙 통로 ➜ T 3번(상단핀) ➜ 좌측끝 통로 ➜ T 8번(하단핀) 순으로 일관되게 하강 결선합니다.",
        tip: "⚠️ <b>실기 합격 핵심</b>: 상단부터 하단으로 일관되게 이동하며, 기구 상하단 결선 시 진행방향으로 가까운 상단핀부터 순차 결선합니다.",
        color: "#14b8a6",
        segments: [
          {
            id: "g10-tb5_2-x3",
            from: "TB5 2번 (PB1)",
            to: "X 3번 (자기유지)",
            points: [
              this.getTerminalPos('TB5', 2),
              [this.getTerminalPos('TB5', 2)[0], C.TOP_BUS + 2],
              [this.getTerminalPos('X', 3)[0], C.TOP_BUS + 2],
              this.getTerminalPos('X', 3)
            ]
          },
          {
            id: "g10-x3-x8",
            from: "X 3번",
            to: "X 8번",
            points: [
              this.getTerminalPos('X', 3),
              [this.getTerminalPos('X', 3)[0], C.TOP_BUS + 4],
              [C.RIGHT_WIRE - 10, C.TOP_BUS + 4],
              [C.RIGHT_WIRE - 10, C.MID_BUS + 2],
              [this.getTerminalPos('X', 8)[0], C.MID_BUS + 2],
              this.getTerminalPos('X', 8)
            ]
          },
          {
            id: "g10-x8-mc1_6",
            from: "X 8번",
            to: "MC1 6번",
            points: [
              this.getTerminalPos('X', 8),
              [this.getTerminalPos('X', 8)[0], C.MID_BUS + 4],
              [this.getTerminalPos('MC1', 6)[0], C.MID_BUS + 4],
              this.getTerminalPos('MC1', 6)
            ]
          },
          {
            id: "g10-mc1_6-t3",
            from: "MC1 6번",
            to: "T 3번",
            points: [
              this.getTerminalPos('MC1', 6),
              [this.getTerminalPos('MC1', 6)[0], C.MID_BUS + 6],
              [this.getTerminalPos('T', 3)[0], C.MID_BUS + 6],
              this.getTerminalPos('T', 3)
            ]
          },
          {
            id: "g10-t3-t8",
            from: "T 3번",
            to: "T 8번",
            points: [
              this.getTerminalPos('T', 3),
              [this.getTerminalPos('T', 3)[0], C.MID_BUS + 8],
              [C.LEFT_WIRE + 14, C.MID_BUS + 8],
              [C.LEFT_WIRE + 14, C.BOT_BUS - 6],
              [this.getTerminalPos('T', 8)[0], C.BOT_BUS - 6],
              this.getTerminalPos('T', 8)
            ]
          }
        ]
      },

      // ⑪ X 5번(b접점) ➜ T 2번 코일
      {
        group: 11,
        name: "⑪ 타이머(T) 기동 여자선",
        desc: "X 5번(b접점, 상단) ➜ 상단 통로 ➜ 좌측 끝 통로(X=25) ➜ 하단 통로 ➜ T 2번 코일로 배선합니다.",
        tip: "⚠️ <b>단자 사이 관통 금지</b>: 좌측 끝 25mm 통로(X=25)로 안전하게 하강합니다.",
        color: "#84cc16",
        segments: [
          {
            id: "g11-x5-t2",
            from: "X 5번",
            to: "T 2번",
            points: [
              this.getTerminalPos('X', 5),
              [this.getTerminalPos('X', 5)[0], C.TOP_BUS + 6],
              [C.LEFT_WIRE + 16, C.TOP_BUS + 6],
              [C.LEFT_WIRE + 16, C.BOT_BUS - 4],
              [this.getTerminalPos('T', 2)[0], C.BOT_BUS - 4],
              this.getTerminalPos('T', 2)
            ]
          }
        ]
      },

      // ⑫ T 한시 a접점 6번 ➜ MC2 6번 코일
      {
        group: 12,
        name: "⑫ MC2 전동기2 지연 기동선",
        desc: "타이머 T 6번(2열 상단) ➜ 중앙 가로 배선로(Y=210) ➜ MC2 6번(2열 상단)으로 직진 결선합니다.",
        tip: "💡 둘 다 중앙 통로(Y=210) 상에 위치하여 층간 이동 없이 중앙 통로로만 직진 배선합니다.",
        color: "#0284c7",
        segments: [
          {
            id: "g12-t6-mc2_6",
            from: "T 6번",
            to: "MC2 6번",
            points: [
              this.getTerminalPos('T', 6),
              [this.getTerminalPos('T', 6)[0], C.MID_BUS - 6],
              [this.getTerminalPos('MC2', 6)[0], C.MID_BUS - 6],
              this.getTerminalPos('MC2', 6)
            ]
          }
        ]
      },

      // ⑬ TB5 18번(RL) ➜ MC1 10번
      // [상단 ➜ 하단 결선]: 최상단 단자대 TB5 18번에서 출발하여 2열 하단 MC1 10번으로 하강
      {
        group: 13,
        name: "⑬ MC1 운전 적색 표시등(RL) 점등선",
        desc: "TB5 18번(최상단) ➜ 상단 통로 ➜ 우측 끝 통로(X=375) ➜ 하단 통로 ➜ MC1 10번(2열 하단)으로 하강 배선합니다.",
        tip: "⚠️ <b>상단 ➜ 하단 일관된 방향</b>: 최상단에서 출발하여 우측 끝 25mm 통로(X=375)를 타고 2열 하단으로 하강합니다.",
        color: "#ef4444",
        segments: [
          {
            id: "g13-tb5_18-mc1_10",
            from: "TB5 18번 (RL)",
            to: "MC1 10번",
            points: [
              this.getTerminalPos('TB5', 18),
              [this.getTerminalPos('TB5', 18)[0], C.TOP_BUS - 4],
              [C.RIGHT_WIRE - 12, C.TOP_BUS - 4],
              [C.RIGHT_WIRE - 12, C.BOT_BUS + 2],
              [this.getTerminalPos('MC1', 10)[0], C.BOT_BUS + 2],
              this.getTerminalPos('MC1', 10)
            ]
          }
        ]
      },

      // ⑭ TB5 19번(GL) ➜ MC2 10번
      // [상단 ➜ 하단 결선]: 최상단 단자대 TB5 19번에서 출발하여 2열 하단 MC2 10번으로 하강
      {
        group: 14,
        name: "⑭ MC2 운전 녹색 표시등(GL) 점등선",
        desc: "TB5 19번(최상단) ➜ 상단 통로 ➜ 우측 끝 통로(X=375) ➜ 하단 통로 ➜ MC2 10번(2열 하단)으로 하강 배선합니다.",
        tip: "⚠️ <b>상단 ➜ 하단 일관된 방향</b>: 최상단에서 출발하여 우측 끝 25mm 통로(X=375)를 타고 하강합니다.",
        color: "#22c55e",
        segments: [
          {
            id: "g14-tb5_19-mc2_10",
            from: "TB5 19번 (GL)",
            to: "MC2 10번",
            points: [
              this.getTerminalPos('TB5', 19),
              [this.getTerminalPos('TB5', 19)[0], C.TOP_BUS - 2],
              [C.RIGHT_WIRE - 14, C.TOP_BUS - 2],
              [C.RIGHT_WIRE - 14, C.BOT_BUS + 4],
              [this.getTerminalPos('MC2', 10)[0], C.BOT_BUS + 4],
              this.getTerminalPos('MC2', 10)
            ]
          }
        ]
      },

      // ⑮ 하부 N상 공통 중성선 루프
      // [완벽한 S자 대형 스네이크 지그재그 - 역주행 0% 단방향 진행]:
      // 1행 (우 ➜ 좌): TB5 20번(최상단 우측) ➜ 상단통로 ➜ 좌측 통로(X=25) ➜ 퓨즈 2차 L3(F out-2)
      // 2행 (좌 ➜ 우): F out-2 ➜ 중앙통로(Y=210) 타고 우측 전진 ➜ FLS 6 ➜ EOCR 12 ➜ X 7 ➜ FR 7 ➜ 우측 통로(X=375) 하강
      // 3행 (우 ➜ 좌): 우측 통로 ➜ 하단통로(Y=330) 타고 좌측 직진 ➜ MC2 12 ➜ MC1 12 ➜ T 7
      // 4행 (종단 체결): T 7 ➜ 하단 단자대 TB6 3번 (YL/BZ 공통)
      {
        group: 15,
        name: "⑮ 하부 공통 중성선 (완벽 S자 N상 스네이크 루프)",
        desc: "TB5 20번(최상단 우측)에서 시작하여 좌측으로 이동해 퓨즈(F out-2)를 연결하고, 중앙통로를 타고 오른쪽으로 이동하며 FLS 6번 ➜ EOCR 12번 ➜ X 7번 ➜ FR 7번을 순차 연결한 후, 우측 통로를 타고 하강하여 하단통로에서 왼쪽으로 직진하며 MC2 12번 ➜ MC1 12번 ➜ T 7번을 연결하고 마지막으로 TB6 3번에 체결하는 역주행 없는 완벽한 지그재그 배선입니다.",
        tip: "⚠️ <b>진행 방향 우선 (스네이크 단방향 순차 배선)</b>: 1행(우➜좌) ➜ 2행(좌➜우) ➜ 3행(우➜좌) ➜ 4행(종단)으로 진행 방향에 위치한 단자 순서대로 100% 직진 체결하여 전선 꼬임과 왕복이 완전히 배제됩니다.",
        color: "#94a3b8",
        segments: [
          // 1행 (우 ➜ 좌): TB5 20번 ➜ F 2차 L3
          {
            id: "g15-tb5_20-f",
            from: "TB5 20번 (RL/GL공통)",
            to: "F 2차 L3 (out-2)",
            points: [
              this.getTerminalPos('TB5', 20),
              [this.getTerminalPos('TB5', 20)[0], C.TOP_BUS - 6],
              [C.LEFT_WIRE, C.TOP_BUS - 6],
              [C.LEFT_WIRE, C.MID_BUS + 8],
              [this.getTerminalPos('F', 'out-2')[0], C.MID_BUS + 8],
              this.getTerminalPos('F', 'out-2')
            ]
          },
          // 2행 (좌 ➜ 우): F 2차 L3 ➜ FLS 6번 ➜ EOCR 12번 ➜ X 7번 ➜ FR 7번 ➜ MC2 12번(우측 하강)
          {
            id: "g15-f-fls6",
            from: "F 2차 L3 (out-2)",
            to: "FLS 6번",
            points: [
              this.getTerminalPos('F', 'out-2'),
              [this.getTerminalPos('F', 'out-2')[0], C.MID_BUS + 2],
              [this.getTerminalPos('FLS', 6)[0], C.MID_BUS + 2],
              this.getTerminalPos('FLS', 6)
            ]
          },
          {
            id: "g15-fls6-eocr12",
            from: "FLS 6번",
            to: "EOCR 12번",
            points: [
              this.getTerminalPos('FLS', 6),
              [this.getTerminalPos('FLS', 6)[0], C.MID_BUS + 4],
              [this.getTerminalPos('EOCR', 12)[0], C.MID_BUS + 4],
              this.getTerminalPos('EOCR', 12)
            ]
          },
          {
            id: "g15-eocr12-x7",
            from: "EOCR 12번",
            to: "X 7번",
            points: [
              this.getTerminalPos('EOCR', 12),
              [this.getTerminalPos('EOCR', 12)[0], C.MID_BUS + 4],
              [this.getTerminalPos('X', 7)[0], C.MID_BUS + 4],
              this.getTerminalPos('X', 7)
            ]
          },
          {
            id: "g15-x7-fr7",
            from: "X 7번",
            to: "FR 7번",
            points: [
              this.getTerminalPos('X', 7),
              [this.getTerminalPos('X', 7)[0], C.MID_BUS + 6],
              [this.getTerminalPos('FR', 7)[0], C.MID_BUS + 6],
              this.getTerminalPos('FR', 7)
            ]
          },
          {
            id: "g15-fr7-mc2_12",
            from: "FR 7번",
            to: "MC2 12번",
            points: [
              this.getTerminalPos('FR', 7),
              [this.getTerminalPos('FR', 7)[0], C.MID_BUS + 8],
              [C.RIGHT_WIRE, C.MID_BUS + 8],
              [C.RIGHT_WIRE, C.BOT_BUS + 2],
              [this.getTerminalPos('MC2', 12)[0], C.BOT_BUS + 2],
              this.getTerminalPos('MC2', 12)
            ]
          },
          // 3행 (우 ➜ 좌): MC2 12번 ➜ MC1 12번 ➜ T 7번 (하단통로 수평 직진!)
          {
            id: "g15-mc2_12-mc1_12",
            from: "MC2 12번",
            to: "MC1 12번",
            points: [
              this.getTerminalPos('MC2', 12),
              [this.getTerminalPos('MC2', 12)[0], C.BOT_BUS + 4],
              [this.getTerminalPos('MC1', 12)[0], C.BOT_BUS + 4],
              this.getTerminalPos('MC1', 12)
            ]
          },
          {
            id: "g15-mc1_12-t7",
            from: "MC1 12번",
            to: "T 7번",
            points: [
              this.getTerminalPos('MC1', 12),
              [this.getTerminalPos('MC1', 12)[0], C.BOT_BUS + 6],
              [this.getTerminalPos('T', 7)[0], C.BOT_BUS + 6],
              this.getTerminalPos('T', 7)
            ]
          },
          // 4행 (종단 체결): T 7번 ➜ TB6 3번 (YL/BZ공통)
          {
            id: "g15-t7-tb6_3",
            from: "T 7번",
            to: "TB6 3번 (YL/BZ공통)",
            points: [
              this.getTerminalPos('T', 7),
              [this.getTerminalPos('T', 7)[0], C.BOT_BUS + 8],
              [this.getTerminalPos('TB6', 3)[0], C.BOT_BUS + 8],
              this.getTerminalPos('TB6', 3)
            ]
          }
        ]
      }
    ];
  }

  /**
   * 점 배열을 SVG path d 문자열로 변환
   */
  pointsToPathD(points) {
    if (!points || points.length === 0) return '';
    return points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt[0]} ${pt[1]}` : `${acc} L ${pt[0]} ${pt[1]}`;
    }, '');
  }

  /**
   * 선분 중간에 진행 방향 화살표 삼각형 요소들 생성
   */
  createDirectionArrows(points, color = '#fef08a') {
    const arrowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    arrowGroup.setAttribute('class', 'aux-direction-arrow-group');

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const dist = Math.hypot(dx, dy);

      // 16mm 이상의 주요 통로(가로/세로 배선로)에 방향 화살표 배치
      if (dist >= 16) {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        // 거리가 60mm 이상이면 2개 배치 (35%, 70%), 그 외는 50% 중앙 1개 배치
        const ratios = dist >= 60 ? [0.35, 0.7] : [0.5];

        ratios.forEach(r => {
          const mx = p1[0] + dx * r;
          const my = p1[1] + dy * r;

          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('class', 'aux-direction-arrow');
          g.setAttribute('transform', `translate(${mx.toFixed(1)}, ${my.toFixed(1)}) rotate(${angle.toFixed(1)})`);

          // 선명한 꺾쇠 삼각 화살표 (fill: 피복 하이라이트색, stroke: 다크엠버)
          const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          poly.setAttribute('points', '-2.6,-2.0 3.2,0 -2.6,2.0');
          poly.setAttribute('fill', color);
          poly.setAttribute('stroke', '#78350f');
          poly.setAttribute('stroke-width', '0.5');
          g.appendChild(poly);

          arrowGroup.appendChild(g);
        });
      }
    }

    return arrowGroup;
  }

  /**
   * 전위 그룹의 단자 결선 순서 번호 뱃지 (① ➜ ② ➜ ③...) 렌더링
   */
  renderOrderBadges(groupData) {
    const dirLayer = document.getElementById('aux-direction-layer');
    if (!dirLayer) return;

    // 해당 그룹 기존 뱃지 제거
    const existingBadges = dirLayer.querySelectorAll(`[data-badge-group="${groupData.group}"]`);
    existingBadges.forEach(el => el.remove());

    const badgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badgeGroup.setAttribute('data-badge-group', groupData.group);

    // 순서대로 단자 목록과 좌표 추출
    // (FLS 전극선처럼 서로 이어지지 않은 독립 전선은 각 전선의 출발 단자도 따로 추가)
    const terminals = [];
    groupData.segments.forEach(seg => {
      if (terminals.length === 0 || terminals[terminals.length - 1].name !== seg.from) {
        terminals.push({ name: seg.from, pos: seg.points[0] });
      }
      terminals.push({ name: seg.to, pos: seg.points[seg.points.length - 1] });
    });

    terminals.forEach((term, idx) => {
      const orderNum = idx + 1;
      const [tx, ty] = term.pos;

      // 뱃지 오프셋: 단자대를 가리지 않도록 위치 조정
      let ox = tx + 4;
      let oy = ty - 4;
      if (ty < 75) {
        oy = ty + 7.5;
        ox = tx;
      } else if (ty > 340) {
        oy = ty - 7.5;
        ox = tx;
      }

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'aux-order-badge');
      g.setAttribute('transform', `translate(${ox.toFixed(1)}, ${oy.toFixed(1)})`);

      // 원형 배경 (시작단: 초록, 종단: 빨강, 중간단: 파랑)
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '4.2');
      circle.setAttribute('fill', idx === 0 ? '#10b981' : (idx === terminals.length - 1 ? '#ef4444' : '#0284c7'));
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '0.8');
      g.appendChild(circle);

      // 숫자 텍스트
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('font-size', '4.6');
      text.setAttribute('font-weight', '900');
      text.setAttribute('fill', '#ffffff');
      text.textContent = `${orderNum}`;
      g.appendChild(text);

      badgeGroup.appendChild(g);
    });

    dirLayer.appendChild(badgeGroup);
  }

  /**
   * 황색 보조회로 전선 SVG 요소 생성
   */
  createAuxWireElement(segment, tagColor = '#fef08a', isAnimated = true) {
    const d = this.pointsToPathD(segment.points);
    const wireId = `aux-wire-${segment.id}`;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', wireId);
    g.setAttribute('class', 'aux-circuit-wire');
    g.setAttribute('data-segment', segment.id);

    // 1. 단자 링 터미널 (시작점 & 끝점 압착 단자)
    const startPt = segment.points[0];
    const endPt = segment.points[segment.points.length - 1];

    [startPt, endPt].forEach(pt => {
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', pt[0]);
      ring.setAttribute('cy', pt[1]);
      ring.setAttribute('r', '2.4');
      ring.setAttribute('fill', '#d97706');
      ring.setAttribute('stroke', '#78350f');
      ring.setAttribute('stroke-width', '0.6');
      g.appendChild(ring);
    });

    // 2. 전선 외곽 그림자
    const pathBg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathBg.setAttribute('d', d);
    pathBg.setAttribute('fill', 'none');
    pathBg.setAttribute('stroke', '#451a03');
    pathBg.setAttribute('stroke-width', '2.8');
    pathBg.setAttribute('stroke-linecap', 'round');
    pathBg.setAttribute('stroke-linejoin', 'round');
    pathBg.setAttribute('opacity', '0.6');
    g.appendChild(pathBg);

    // 3. 메인 황색 피복 (1.5mm² 규격 두께 2.0)
    // ⚠️ KEC 규정: 보조회로 피복은 그룹과 무관하게 항상 황색! (그룹 색은 심선 표시에만 사용)
    const pathMain = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathMain.setAttribute('d', d);
    pathMain.setAttribute('fill', 'none');
    pathMain.setAttribute('stroke', AUX_WIRE_COLOR);
    pathMain.setAttribute('stroke-width', '2.0');
    pathMain.setAttribute('stroke-linecap', 'round');
    pathMain.setAttribute('stroke-linejoin', 'round');
    pathMain.setAttribute('class', 'aux-wire-main');
    g.appendChild(pathMain);

    // 4. 중앙 심선: 3단계 그루핑 색으로 표시해 전위 그룹 구분 (방향성 흐름 점선 적용)
    const pathCore = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathCore.setAttribute('d', d);
    pathCore.setAttribute('fill', 'none');
    pathCore.setAttribute('stroke', tagColor);
    pathCore.setAttribute('stroke-width', '0.8');
    pathCore.setAttribute('stroke-linecap', 'round');
    pathCore.setAttribute('stroke-linejoin', 'round');
    pathCore.setAttribute('class', 'aux-wire-core aux-wire-flowing');
    pathCore.setAttribute('opacity', '0.85');
    g.appendChild(pathCore);

    // 5. 진행 방향 화살표 마커 생성 및 첨부
    const arrowGroup = this.createDirectionArrows(segment.points, '#fef08a');
    g.appendChild(arrowGroup);

    if (isAnimated) {
      // 실제 전선 길이를 측정하여 시작점 ➜ 끝점 방향 드로잉 애니메이션 적용
      let len = 400;
      try {
        len = pathMain.getTotalLength() || 400;
      } catch (e) {
        len = 400;
      }
      pathMain.style.strokeDasharray = `${len}`;
      pathMain.style.strokeDashoffset = `${len}`;

      pathMain.animate([
        { strokeDashoffset: len },
        { strokeDashoffset: 0 }
      ], {
        duration: Math.max(300, len * 1.5) / this.speed,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        fill: 'forwards'
      });
    }

    return g;
  }

  /**
   * 단일 그룹 배선 실행
   */
  async runGroup(groupNum, isAnimated = true, token = null) {
    // 사용자가 직접 누른 경우(token 없음): 진행 중인 자동 시연을 취소하고 새로 시작
    if (token === null) {
      token = ++this.runToken;
      this.isPlaying = false;
    }

    const dataList = this.getWiringData();
    const groupData = dataList.find(g => g.group === groupNum);
    if (!groupData) return;

    this.currentGroup = groupNum;
    const wireLayer = document.getElementById('aux-circuit-wire-layer');
    if (!wireLayer) return;

    // 해당 그룹 기존 전선 제거
    const existing = wireLayer.querySelectorAll(`[data-group="${groupNum}"]`);
    existing.forEach(el => el.remove());

    // 단자 순번 뱃지 렌더링
    this.renderOrderBadges(groupData);
    // 교육용: 지금 배선하는 보조회로만 보이게 (다른 그룹은 잠시 숨김, 결선 상태는 유지)
    this.showOnlyGroup(groupNum);

    this.updateGuideMessage(`⚡ <b>[4단계 ${groupData.name}]</b> 결선 중...<br>${groupData.desc}`);

    for (const segment of groupData.segments) {
      if (token !== this.runToken) return; // 초기화·다른 그룹 클릭 시 즉시 중단
      const wireEl = this.createAuxWireElement(segment, groupData.color, isAnimated);
      wireEl.setAttribute('data-group', groupNum);
      wireLayer.appendChild(wireEl);

      if (isAnimated) {
        this.playWireSnapSound();
        await new Promise(r => setTimeout(r, 450 / this.speed));
      }
    }

    if (token !== this.runToken) return;
    this.updateGuideMessage(`✅ <b>[4단계 ${groupData.name}] 결선 완료!</b><br>${groupData.tip}`);
  }

  /**
   * 전체 보조회로 순차 자동 배선 시연 (FLS 최우선 ➜ ① ~ ⑮)
   */
  async playAll() {
    if (this.isPlaying) return;
    this.clearWires();
    this.isPlaying = true;
    const token = this.runToken;

    const dataList = this.getWiringData();
    for (const groupData of dataList) {
      // 번호 순서대로 한 그룹씩만 보여주며 배선
      await this.runGroup(groupData.group, true, token);
      if (token !== this.runToken) return; // 중간에 취소됨
      await new Promise(r => setTimeout(r, 900 / this.speed));
      if (token !== this.runToken) return;
    }

    // 마지막에 전체 보조회로를 한꺼번에
    this.showOnlyGroup(null);
    this.isPlaying = false;
    this.updateGuideMessage(`🎉 <b>[4단계 보조회로 배선 완료!]</b><br>FLS 최우선 결선부터 ${this.problem.board.sequenceCircuit.groups.length}개 전위 그루핑까지 하나씩 배선한 뒤, <b>전체 보조회로</b>를 한꺼번에 보여줍니다!<br>번호 칩을 누르면 그 회로만, <b>'전체'</b>를 누르면 모두 볼 수 있어요. <b>'🔔 벨 테스터(도통 시험)'</b>로 검사해보세요!`);
  }

  /**
   * 보조회로 보기 전환: groupNum만 보이게 (null = 전체)
   * - 전선과 방향·순번 뱃지 모두 적용, 숨긴 전선도 결선 상태(벨 테스터·5단계 배전반)는 그대로
   */
  showOnlyGroup(groupNum) {
    const show = (g) => groupNum === null || String(g) === String(groupNum);
    document.querySelectorAll('#aux-circuit-wire-layer [data-group]').forEach(el => {
      el.style.display = show(el.dataset.group) ? '' : 'none';
    });
    document.querySelectorAll('#aux-direction-layer [data-badge-group]').forEach(el => {
      el.style.display = show(el.dataset.badgeGroup) ? '' : 'none';
    });
    this.visibleGroup = groupNum;
    // 왼쪽 3단계 핀번호·그루핑 도면도 같은 회로를 강조 (app.js에서 연결)
    this.onGroupChange?.(groupNum);
  }

  /**
   * 애니메이션 없이 아직 깔리지 않은 그룹만 즉시 결선 (5단계 배전반 고정 시 완성품 준비용)
   */
  completeAllInstantly() {
    const installed = this.getInstalledSegmentIds();
    const token = ++this.runToken;
    this.isPlaying = false;
    this.getWiringData().forEach(g => {
      if (g.segments.some(seg => !installed.has(seg.id))) this.runGroup(g.group, false, token);
    });
    this.showOnlyGroup(null);
  }

  /**
   * 현재 기판에 실제로 깔려 있는 보조회로 전선 구간 id 목록
   */
  getInstalledSegmentIds() {
    const wireLayer = document.getElementById('aux-circuit-wire-layer');
    if (!wireLayer) return new Set();
    return new Set([...wireLayer.querySelectorAll('.aux-circuit-wire')].map(el => el.dataset.segment));
  }

  /**
   * 벨 테스터 (도통 시험) 시뮬레이션
   * - 실제로 깔린 전선만으로 그룹 단자들이 모두 이어졌는지 검사 (Union-Find)
   * - 모든 단자의 전선 수를 세어 1단자 2선 초과 여부도 함께 검사
   * - 도통 성공 시에만 1200Hz 부저음, 끊긴 구간은 빨간 점선으로 표시
   */
  async testContinuity(groupNum = null) {
    const targetGroup = groupNum !== null ? groupNum : this.currentGroup;
    const testerLayer = document.getElementById('aux-tester-effect-layer');
    if (!testerLayer) return;
    testerLayer.innerHTML = '';

    if (targetGroup === null) {
      this.updateGuideMessage("🔔 <b>[벨 테스터]</b>: 검사할 그룹이 없습니다.<br>먼저 <b>⚡ FLS</b> 버튼이나 <b>번호 그룹 칩</b>을 눌러 전선을 연결한 뒤 다시 눌러보세요!");
      return;
    }

    const dataList = this.getWiringData();
    const groupData = dataList.find(g => g.group === targetGroup);
    if (!groupData) return;

    const installed = this.getInstalledSegmentIds();
    const keyOf = (pt) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;

    // 1) 도통 검사: FLS 전극선(0번)은 3가닥 각각 독립, 나머지는 그룹 전체가 하나로 이어져야 함
    // 단자는 이름이 아니라 좌표로 식별 (같은 단자라도 구간마다 이름 표기가 다를 수 있음)
    const parent = {};
    const find = (k) => (parent[k] === k ? k : (parent[k] = find(parent[k])));
    const union = (a, b) => { parent[find(a)] = find(b); };
    const ends = (seg) => [keyOf(seg.points[0]), keyOf(seg.points[seg.points.length - 1])];
    groupData.segments.forEach(seg => ends(seg).forEach(k => { parent[k] = k; }));
    groupData.segments.forEach(seg => { if (installed.has(seg.id)) union(...ends(seg)); });

    const missingSegs = groupData.segments.filter(seg => !installed.has(seg.id));
    let isContinuous;
    if (groupData.group === 0) {
      isContinuous = missingSegs.length === 0;
    } else {
      const roots = new Set(Object.keys(parent).map(find));
      isContinuous = roots.size === 1;
    }

    // 2) 1단자 2선 검사 (기판 전체 보조회로 전선 기준)
    const wiresPerTerminal = {};
    dataList.forEach(g => g.segments.forEach(seg => {
      if (!installed.has(seg.id)) return;
      [[seg.points[0], seg.from], [seg.points[seg.points.length - 1], seg.to]].forEach(([pt, name]) => {
        const k = keyOf(pt);
        wiresPerTerminal[k] = wiresPerTerminal[k] || { name, count: 0 };
        wiresPerTerminal[k].count++;
      });
    }));
    const overloaded = Object.values(wiresPerTerminal).filter(t => t.count > 2);

    // 3) 시각 효과: 연결된 구간은 파란 펄스, 끊긴 구간은 빨간 점선
    groupData.segments.forEach(seg => {
      const ok = installed.has(seg.id);
      const pulsePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pulsePath.setAttribute('d', this.pointsToPathD(seg.points));
      pulsePath.setAttribute('fill', 'none');
      pulsePath.setAttribute('stroke', ok ? '#38bdf8' : '#ef4444');
      pulsePath.setAttribute('stroke-width', ok ? '4.5' : '1.6');
      pulsePath.setAttribute('stroke-linecap', 'round');
      pulsePath.setAttribute('opacity', '0.9');
      if (ok) {
        pulsePath.style.filter = 'drop-shadow(0 0 4px #38bdf8)';
      } else {
        pulsePath.setAttribute('stroke-dasharray', '3 2');
      }
      testerLayer.appendChild(pulsePath);

      [seg.points[0], seg.points[seg.points.length - 1]].forEach(pt => {
        const pulseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulseCircle.setAttribute('cx', pt[0]);
        pulseCircle.setAttribute('cy', pt[1]);
        pulseCircle.setAttribute('r', '6');
        pulseCircle.setAttribute('fill', 'none');
        pulseCircle.setAttribute('stroke', ok ? '#38bdf8' : '#ef4444');
        pulseCircle.setAttribute('stroke-width', '1.5');
        testerLayer.appendChild(pulseCircle);
      });
    });

    const overloadHtml = overloaded.length
      ? `<br>⛔ <b style="color:#f87171;">1단자 2선 초과(실격)</b>: ${overloaded.map(t => `${t.name} ${t.count}선`).join(', ')}`
      : '';

    if (isContinuous) {
      this.playBuzzerSound(0.5);
      this.updateGuideMessage(`🔔 <b>[벨 테스터 도통 시험 성공]</b> 삐-익! 🎵<br><b>${groupData.name}</b>의 모든 단자가 하나로 이어져 <b>0Ω(완전 도통)</b>입니다!${overloadHtml}`);
    } else {
      const missingHtml = missingSegs.map(seg => `${seg.from} ➜ ${seg.to}`).join('<br>• ');
      this.updateGuideMessage(`🔕 <b>[벨 테스터: 소리 없음 (∞Ω 단선)]</b><br><b>${groupData.name}</b>에 아직 연결되지 않은 구간이 있어요! (빨간 점선)<br>• ${missingHtml}${overloadHtml}`);
    }

    setTimeout(() => {
      testerLayer.innerHTML = '';
    }, isContinuous ? 900 : 2500);
  }

  /**
   * 보조회로 전선 초기화
   */
  clearWires() {
    this.runToken++; // 진행 중인 배선 애니메이션 중단
    this.isPlaying = false;
    const wireLayer = document.getElementById('aux-circuit-wire-layer');
    if (wireLayer) wireLayer.innerHTML = '';
    const dirLayer = document.getElementById('aux-direction-layer');
    if (dirLayer) dirLayer.innerHTML = '';
    const testerLayer = document.getElementById('aux-tester-effect-layer');
    if (testerLayer) testerLayer.innerHTML = '';
    this.currentGroup = null;
  }

  /**
   * 12세 눈높이 가이드 메시지 갱신
   */
  updateGuideMessage(html) {
    const box = document.getElementById('step-guide-box');
    if (box) {
      box.innerHTML = html;
      box.style.animation = 'none';
      box.offsetHeight;
      box.style.animation = 'pulse-border 1.5s ease-in-out';
    }
  }

  setSpeed(val) {
    this.speed = val;
  }
}
