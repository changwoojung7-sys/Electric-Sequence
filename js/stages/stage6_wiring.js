/**
 * Stage 6: 외부기구 가조립 · 전선 입선 · 결선 · 박스 뚜껑 결합 (Wiring Pull & Termination Engine)
 * - 5단계 벽면(배관 설치 완료 상태) 위에 이어서 작업 — 같은 SVG에 s6- 레이어를 추가
 * - 학원 실전 합격 12단계 시공 표준 8~11단계:
 *   1. 외부단자 가조립
 *   2. 전선 입선 (먼 쪽 배관부터 요비선으로 당겨 넣기)
 *   3. 양쪽 선 탈피 및 결선 (공통선 먼저 ➜ 단독선)
 *   4. 박스 뚜껑 결합 (네 모서리 나사)
 * - 제어함 쪽 단자 번호는 1단계 단자대 마킹(terminalMarkings: TB5 상단 / TB6 하단)과 1:1
 */

import { boxCover } from '../components/control_devices.js';
import { getAudioContext } from '../components/audio.js';
import { tbBlockGeometry } from '../components/tb_blocks.js';
import { BEND_RADIUS, roundedPathD } from '../components/pipe_bend.js';

const NS = 'http://www.w3.org/2000/svg';

// 전선 색상 (KEC): 제어선 황색, 주회로 갈·흑·회, 보호도체 녹황
const WIRE = {
  AUX: { color: '#facc15', outline: '#0f172a' },
  L1: { color: '#92400e', outline: '#0f172a' },
  L2: { color: '#1e293b', outline: '#e2e8f0' },
  L3: { color: '#64748b', outline: '#0f172a' },
  PE: { color: '#15803d', stripe: '#eab308', outline: '#0f172a' }
};

// 배관 안 전선 간격 (mm)
const WIRE_GAP = 2.4;

/*
 * 입선 다발 정의
 * - via: 지나가는 5단계 배관 번호(PIPES 순서) — 제어함 쪽에서 기구 쪽 방향
 * - tb/pins: 제어함 단자대와 핀 (결선 순서 = 배열 순서: 공통선·PE 먼저 ➜ 단독선)
 * - device: 기구 쪽 끝 처리 (box: 2구 박스 안쪽으로 / tbBlock: 외부 TB 단자대 핀으로)
 */
const BUNDLES = [
  { id: 'PB', name: 'PB1/PB0 박스', via: [0, 1], tb: 'TB5', device: { type: 'box' },
    pins: [{ pin: 3, label: '공통', wire: 'AUX', common: true }, { pin: 1, label: 'PB0', wire: 'AUX' }, { pin: 2, label: 'PB1', wire: 'AUX' }] },
  { id: 'SS', name: 'SS/CAP 박스', via: [0, 2], tb: 'TB5', device: { type: 'box' },
    pins: [{ pin: 6, label: '공통', wire: 'AUX', common: true }, { pin: 4, label: 'SS-M', wire: 'AUX' }, { pin: 5, label: 'SS-A', wire: 'AUX' }] },
  { id: 'RL', name: 'RL/GL 박스', via: [4], tb: 'TB5', device: { type: 'box' },
    pins: [{ pin: 20, label: '공통', wire: 'AUX', common: true }, { pin: 18, label: 'RL', wire: 'AUX' }, { pin: 19, label: 'GL', wire: 'AUX' }] },
  { id: 'YL', name: 'YL/BZ 박스', via: [5], tb: 'TB6', device: { type: 'box' },
    pins: [{ pin: 3, label: '공통', wire: 'AUX', common: true }, { pin: 1, label: 'YL', wire: 'AUX' }, { pin: 2, label: 'BZ', wire: 'AUX' }] },
  { id: 'TB3', name: 'TB3 (전동기 M2)', via: [6], tb: 'TB6',
    device: { type: 'tbBlock', edge: 'x', at: 300, from: 1520, step: 20 },
    // slot: 외부 단자대 위치 — 세로는 위에서부터, 가로는 왼쪽부터 갈(U)·흑(V)·회(W)·녹황(PE) (결선 순서는 PE 먼저)
    pins: [{ pin: 10, label: 'PE', wire: 'PE', common: true, slot: 3 }, { pin: 7, label: 'U2', wire: 'L1', slot: 0 }, { pin: 8, label: 'V2', wire: 'L2', slot: 1 }, { pin: 9, label: 'W2', wire: 'L3', slot: 2 }] },
  // TB4(수위): 문제지 NOTE — E1·E2·E3는 보조회로(황색) 전선, FLS 보호도체(접지)는 제어판(TB6/FLS 소켓)에서 결선
  //            → TB4로는 황색선 3가닥만 내려보내고 PE선은 입선하지 않음
  { id: 'TB4', name: 'TB4 (수위 E1·E2·E3)', via: [7], tb: 'TB6',
    device: { type: 'tbBlock', edge: 'y', at: 1560, from: 910, step: 26 },
    pins: [{ pin: 11, label: 'E1', wire: 'AUX' }, { pin: 12, label: 'E2', wire: 'AUX' }, { pin: 13, label: 'E3', wire: 'AUX' }] },
  { id: 'TB2', name: 'TB2 (전동기 M1)', via: [8], tb: 'TB6',
    device: { type: 'tbBlock', edge: 'x', at: 1500, from: 1420, step: 20 },
    pins: [{ pin: 20, label: 'PE', wire: 'PE', common: true, slot: 3 }, { pin: 17, label: 'U1', wire: 'L1', slot: 0 }, { pin: 18, label: 'V1', wire: 'L2', slot: 1 }, { pin: 19, label: 'W1', wire: 'L3', slot: 2 }] },
  // ③ 메인전원 케이블: 5단계에서 TB1 쪽 결선·케이블 커넥터까지 완료 → 6단계는 제어함 안 TB5 9~12 결선만
  { id: 'TB1', name: 'TB1 메인전원 케이블', via: [], cableEntry: [900, 590], tb: 'TB5', pullSkip: true,
    pins: [{ pin: 12, label: 'PE', wire: 'PE', common: true }, { pin: 9, label: 'L1', wire: 'L1' }, { pin: 10, label: 'L2', wire: 'L2' }, { pin: 11, label: 'L3', wire: 'L3' }] }
];

/*
 * 2구 박스 내부 결선 구조 (박스 왼쪽 위 기준 로컬 좌표, 박스 90 x 140mm)
 * - terms: 기구 단자 (기구 원 좌우 x=19 / x=71)
 * - jumper: 박스 안에서 서로 잇는 단자 쌍 (점퍼) ➜ 그 점에서 '공통' 선을 제어함으로
 * - wires: 제어함에서 온 선(라벨) ➜ 연결 단자, lane = 박스 안에서 내려가는 세로 길(x)
 * - contacts: 단자 옆 접점 표시 (NO = 평상시 열림, NC = 평상시 닫힘)
 */
const BOX_INTERNALS = {
  // PB1(녹색, 기동) = NO 접점, PB0(빨강, 정지) = NC 접점. 두 접점 한쪽을 서로 잇고 그 점에서 공통선
  PB: {
    origin: [105, 590],
    terms: { PB1a: [19, 40], PB1b: [71, 40], PB0a: [19, 100], PB0b: [71, 100] },
    jumper: { from: 'PB1a', to: 'PB0a', lane: 9, text: 'PB1(NO)·PB0(NC) 한쪽 단자 연결' },
    wires: { '공통': { term: 'PB1a', lane: 19 }, 'PB1': { term: 'PB1b', lane: 71 }, 'PB0': { term: 'PB0b', lane: 83 } },
    contacts: [
      { a: 'PB1a', b: 'PB1b', y: 61, type: 'NO', label: 'PB1 NO (녹색·기동)' },
      { a: 'PB0a', b: 'PB0b', y: 121, type: 'NC', label: 'PB0 NC (빨강·정지)' }
    ]
  },
  // SS: 접점 4개 — M 접점(끊어진 상태)·A 접점(연결된 상태), 한쪽 단자끼리 내부 연결 후 공통선
  SS: {
    origin: [405, 590],
    // 단자 4개는 SS 원(가운데) 바깥 좌우에, 이름표는 원 아래에 두어 기호·글자를 가리지 않음
    terms: { M1: [12, 30], M2: [12, 56], A1: [78, 30], A2: [78, 56] },
    jumper: { from: 'M2', to: 'A2', laneY: 68, text: 'M·A 한쪽 단자 내부 연결' },
    wires: { '공통': { term: 'M2', lane: 21 }, 'SS-M': { term: 'M1', lane: 12 }, 'SS-A': { term: 'A1', lane: 78 } },
    contacts: [
      { a: 'M1', b: 'M2', vertical: true, type: 'NO', label: 'M: 끊김', labelY: 80 },
      { a: 'A1', b: 'A2', vertical: true, type: 'NC', label: 'A: 연결', labelY: 80 }
    ]
  },
  // 램프: 램프마다 단자 2개 ➜ 각자 선 1가닥씩, 반대쪽 단자끼리 묶어 공통선
  RL: {
    origin: [1355, 590],
    terms: { RLa: [19, 40], RLb: [71, 40], GLa: [19, 100], GLb: [71, 100] },
    jumper: { from: 'RLa', to: 'GLa', lane: 9, text: 'RL·GL 한쪽 단자 묶음' },
    wires: { '공통': { term: 'RLa', lane: 19 }, 'RL': { term: 'RLb', lane: 71 }, 'GL': { term: 'GLb', lane: 83 } },
    contacts: []
  },
  // YL/BZ: 아래에서 들어오므로 아래쪽 기구(BZ)가 가까움
  YL: {
    origin: [305, 870],
    terms: { YLa: [19, 40], YLb: [71, 40], BZa: [19, 100], BZb: [71, 100] },
    jumper: { from: 'BZa', to: 'YLa', lane: 9, text: 'YL·BZ 한쪽 단자 묶음' },
    wires: { '공통': { term: 'BZa', lane: 19 }, 'BZ': { term: 'BZb', lane: 71 }, 'YL': { term: 'YLb', lane: 83 } },
    contacts: []
  }
};

// 뚜껑을 덮을 2구 박스 (5단계 외부기구 위치)
const BOX_COVERS = [
  { name: 'PB1/PB0', x: 105, y: 590 },
  { name: 'SS/CAP', x: 405, y: 590 },
  { name: 'RL/GL', x: 1355, y: 590 },
  { name: 'YL/BZ', x: 305, y: 870 }
];

// TB4 인출선 길이 차이 (E1 < E2 < E3, 약 1.5cm씩)
const LEAD_STEP = 15;

export class Stage6Wiring {
  constructor(stage5Engine, problemData) {
    this.s5 = stage5Engine;
    this.problem = problemData;
    this.speed = 1.0;
    this.currentStep = 0;
    this.isPlaying = false;
    this.runToken = 0;
    // 과제별 벽면 데이터 (없으면 1번 기본값)
    const wall = problemData.board.wall || {};
    this.bundles = wall.bundles || BUNDLES;
    this.boxInternals = wall.boxInternals || BOX_INTERNALS;
    this.boxCovers = wall.boxes || BOX_COVERS;
    this.junction = stage5Engine.junction;
    this.wires = this.buildWires();
    this.ensureLayers();
  }

  get svg() {
    return this.s5.svg;
  }

  // ---------------------------------------------------------------------------
  // 레이어 · 유틸
  // ---------------------------------------------------------------------------

  /**
   * 5단계 벽면 SVG에 6단계 레이어 추가
   * - 전선: 배관 위, 새들 아래 (새들이 배관과 전선을 함께 감쌈)
   * - 결선 표시·뚜껑·뱃지: 라벨 레이어 아래
   */
  ensureLayers() {
    const add = (id, beforeId) => {
      if (this.svg.querySelector(`#${id}`)) return;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', id);
      const before = this.svg.querySelector(`#${beforeId}`);
      this.svg.insertBefore(g, before);
    };
    add('s6-wires-layer', 's5-saddles-layer');
    add('s6-slack-layer', 's5-labels-layer');   // 여유선(기구 쪽 꼬리 · J박스 여유 고리·말아 넣은 선)
    add('s6-terminals-layer', 's5-labels-layer');
    add('s6-covers-layer', 's5-labels-layer');
    add('s6-badges-layer', 's5-labels-layer');
  }

  layer(name) {
    return this.svg.querySelector(`#s6-${name}`);
  }

  beginRun(token) {
    if (token !== null) return token;
    this.isPlaying = false;
    return ++this.runToken;
  }

  alive(token) {
    return token === this.runToken;
  }

  async sleep(ms) {
    // 수업용 진행 조절 (5단계와 공용): 한 단계씩 모드면 장면마다 멈춤
    if (this.s5.presenter) await this.s5.presenter.hold();
    return new Promise(r => setTimeout(r, ms / this.speed));
  }

  appendSvg(layer, markup) {
    return this.s5.appendSvg(layer, markup);
  }

  popIn(el, ms) {
    this.s5.speed = this.speed;
    this.s5.popIn(el, ms);
  }

  /** 🎥 카메라: 5단계 벽면 카메라를 그대로 사용 (따라가며 보기 ON/OFF도 공유) */
  async focusBox(x0, y0, x1, y1, pad = 110, minW = 520) {
    this.s5.speed = this.speed;
    await this.s5.focusBox(x0, y0, x1, y1, pad, minW);
  }

  async focusPoints(points, pad = 110, minW = 520) {
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    await this.focusBox(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), pad, minW);
  }

  async focusElement(el) {
    this.s5.speed = this.speed;
    await this.s5.focusElement(el);
  }

  async focusAll() {
    this.s5.speed = this.speed;
    await this.s5.focusAll();
  }

  async drawStroke(el, msPer100mm) {
    this.s5.speed = this.speed;
    await this.s5.drawStroke(el, msPer100mm);
  }

  /** 제어함 단자대 바깥쪽 나사 좌표 (벽면 mm): TB5 = 윗줄, TB6 = 아랫줄 */
  panelPin(tbId, pin) {
    const comp = this.problem.board.components.find(c => c.id === tbId);
    const W = this.s5.WALL;
    const left = comp.x - comp.width / 2;
    const top = comp.y - comp.height / 2;
    const pitch = (comp.width - 16) / 19;
    const x = left + 8 + (pin - 1) * pitch;
    const y = tbId === 'TB5' ? top + 6.5 : top + comp.height - 6.5;
    return [W.BOX_LEFT + x, W.BOX_TOP + y];
  }

  /** 직각 경로를 옆으로 평행 이동 (코너는 직각 유지) */
  offsetPolyline(pts, o) {
    const unit = (a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      return [dx / len, dy / len];
    };
    const normal = (u) => [-u[1], u[0]];
    return pts.map((p, i) => {
      const nIn = i > 0 ? normal(unit(pts[i - 1], p)) : null;
      const nOut = i < pts.length - 1 ? normal(unit(p, pts[i + 1])) : null;
      const n = nIn && nOut ? [nIn[0] + nOut[0], nIn[1] + nOut[1]] : (nIn || nOut);
      return [p[0] + n[0] * o, p[1] + n[1] * o];
    });
  }

  /**
   * 다발별·가닥별 전선 경로 계산
   * - 같은 배관을 함께 지나는 다발(PB·SS)은 배관 안 위치(offset)가 겹치지 않게 배정
   * - 경로: 제어함 단자 ➜ 제어함 안 가로 통로 ➜ 배관 입구 ➜ 배관(평행) ➜ 기구 쪽 끝
   */
  buildWires() {
    const pipes = this.s5.pipes;
    const usage = {};  // 배관별로 지나가는 가닥 수
    this.bundles.forEach(b => b.via.forEach(v => { usage[v] = (usage[v] || 0) + b.pins.length; }));
    const slotStart = {};
    Object.keys(usage).forEach(v => { slotStart[v] = 0; });

    const result = [];
    const laneCount = { TB5: 0, TB6: 0 };  // 제어함 안 가로 통로: 단자대별로 가닥마다 다른 높이
    this.bundles.forEach(bundle => {
      // 이 다발이 쓸 배관 안 위치: 지나가는 배관 중 가장 붐비는 배관 기준으로 slot 배정
      const busiest = bundle.via.reduce((m, v) => (usage[v] > (usage[m] || 0) ? v : m), bundle.via[0]);
      const total = bundle.via.length ? usage[busiest] : bundle.pins.length;
      const base = bundle.via.length ? slotStart[busiest] : 0;
      bundle.via.forEach(v => { slotStart[v] += bundle.pins.length; });

      // 배관 중심선을 이어 붙인 경로 (제어함 쪽 ➜ 기구 쪽)
      let center = [];
      let radii = [];   // 배관 코너 구부림 반지름 (J박스 이음점·끝점 = 0)
      bundle.via.forEach(v => {
        const pts = pipes[v].points;
        const r = pts.map((p, i) => (i > 0 && i < pts.length - 1 ? BEND_RADIUS[pipes[v].kind] || 0 : 0));
        center = center.length ? center.concat(pts.slice(1)) : pts.map(p => [p[0], p[1]]);
        radii = radii.length ? radii.concat(r.slice(1)) : r;
      });

      const top = bundle.tb === 'TB5';
      bundle.pins.forEach((pinInfo, k) => {
        const o = (base + k - (total - 1) / 2) * WIRE_GAP;
        const pin = this.panelPin(bundle.tb, pinInfo.pin);
        // 제어함 안 가로 통로 (판 가장자리와 단자대 사이, 가닥마다 1.5mm 간격)
        const lane = top ? 596 + laneCount.TB5++ * 1.5 : 1006 - laneCount.TB6++ * 1.5;
        let pts;
        let entryRef = null;
        let splitRef = null;
        let tb1End = null;    // TB1 케이블: 실제 결선·벨 테스트하는 반대쪽 끝 (TB1 단자)
        let testPts = null;   // 벨 테스터로 빛낼 전체 경로 (케이블 속 포함)
        const bendAt = new Map();   // 배관 코너에 있는 점 ➜ 구부림 반지름 (전선도 배관처럼 둥글게)
        if (bundle.via.length) {
          const inPipe = this.offsetPolyline(center, o);
          inPipe.forEach((p, i) => { if (radii[i]) bendAt.set(p, radii[i]); });
          const entry = inPipe[0];
          entryRef = entry;
          // 정션 경유 다발: 첫 배관(제어함 ➜ J박스)의 끝 = J박스 분기점
          if (bundle.via.length > 1) splitRef = inPipe[pipes[bundle.via[0]].points.length - 1];
          pts = [pin, [pin[0], lane], [entry[0], lane], ...inPipe];
          const last = inPipe[inPipe.length - 1];
          const prev = inPipe[inPipe.length - 2];
          const dir = [Math.sign(last[0] - prev[0]), Math.sign(last[1] - prev[1])];
          if (bundle.device.type === 'box') {
            // 2구 박스 안쪽으로 14mm 인입 (기구 원·글자와 떨어진 가장자리 쪽)
            pts.push([last[0] + dir[0] * 14, last[1] + dir[1] * 14]);
          } else {
            // 외부 TB 단자대 핀으로
            const d = bundle.device;
            const slot = pinInfo.slot ?? k;   // 단자 위치 (결선 순서와 별개)
            const tPin = this.tbGeometry(bundle).slot(slot);   // 5단계 그림과 같은 계산 (세로 단자대 = 배관 중앙 기준)
            const mid = d.edge === 'x' ? [(last[0] + d.at) / 2, last[1]] : [last[0], (last[1] + d.at) / 2];
            pts.push(mid, d.edge === 'x' ? [mid[0], tPin[1]] : [tPin[0], mid[1]], tPin);
          }
        } else {
          // ③ 케이블: 케이블 커넥터에서 제어함 안 단자로
          const e = bundle.cableEntry;
          const ex = e[0] + (k - (bundle.pins.length - 1) / 2) * WIRE_GAP;
          pts = [pin, [pin[0], lane], [ex, lane], [ex, e[1]]];
          // 반대쪽 끝 = 벽 위쪽 TB1 단자 (5단계에서 케이블 심선을 꽂은 위치: L1 863 · L2 888 · L3 912 · PE 937, 단자 y=90)
          const tbX = { L1: 863, L2: 888, L3: 912, PE: 937 }[pinInfo.label];
          tb1End = [tbX, 90];
          testPts = [...pts, [ex, 140], [tbX, 140], [tbX, 90]];
        }
        // 연속 중복 점 제거
        pts = pts.filter((p, i) => i === 0 || Math.abs(p[0] - pts[i - 1][0]) > 0.01 || Math.abs(p[1] - pts[i - 1][1]) > 0.01);
        result.push({
          bundle, pinInfo, k, pts, bendAt, panelEnd: pin, deviceEnd: tb1End || pts[pts.length - 1], testPts: testPts || pts,
          entryIdx: entryRef ? pts.indexOf(entryRef) : -1,   // 배관 입구(제어함 가장자리) 위치
          splitIdx: splitRef ? pts.indexOf(splitRef) : -1    // J박스 분기점 위치 (정션 경유 다발만)
        });
      });
    });
    return result;
  }

  /** 경로 pts의 startIdx 지점에서 진행 방향으로 dist(mm) 간 점과 그 방향 */
  pointAlong(pts, startIdx, dist) {
    let remain = dist;
    for (let i = startIdx; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const dir = [(b[0] - a[0]) / (len || 1), (b[1] - a[1]) / (len || 1)];
      if (remain <= len) return { p: [a[0] + dir[0] * remain, a[1] + dir[1] * remain], dir };
      remain -= len;
    }
    const n = pts.length;
    return { p: pts[n - 1], dir: [0, 0] };
  }

  /** 전선 묶음을 감는 절연 테이프 (여러 가닥의 같은 지점을 가로질러 감쌈) */
  tapeMarkup(points, dir, label = '') {
    const vertical = Math.abs(dir[1]) > Math.abs(dir[0]);
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const across = (vertical ? Math.max(...xs) - Math.min(...xs) : Math.max(...ys) - Math.min(...ys)) + 5;
    const along = 7;
    const w = vertical ? across : along;
    const h = vertical ? along : across;
    return `
      <g class="s6-tape" transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)})">
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="1.5" fill="#0f172a" stroke="#64748b" stroke-width="0.8" />
        <path d="${vertical ? `M ${-w / 2} -1.2 L ${w / 2} -1.2 M ${-w / 2} 1.2 L ${w / 2} 1.2` : `M -1.2 ${-h / 2} L -1.2 ${h / 2} M 1.2 ${-h / 2} L 1.2 ${h / 2}`}" stroke="#334155" stroke-width="0.6" />
        ${label ? `<text x="${vertical ? w / 2 + 4 : 0}" y="${vertical ? 3 : -h / 2 - 4}" text-anchor="${vertical ? 'start' : 'middle'}" font-size="8" font-weight="900" fill="#f8fafc">${label}</text>` : ''}
      </g>`;
  }

  /** 정션 경유 다발(PB·SS) 입선: 제어함에서 3가닥씩 테이핑 ➜ 6가닥 한 묶음 ➜ J박스까지 ➜ 3가닥씩 분리 */
  async pullJunctionGroup(group, isAnimated, token, stepNo, total) {
    const wireLayer = this.layer('wires-layer');
    const tapeLayer = this.layer('badges-layer');
    const toolLayer = this.s5.layer('tool-layer');
    const all = group.flatMap(b => this.wires.filter(w => w.bundle === b));
    const names = group.map(b => b.id).join('·');
    const say = (html) => { if (isAnimated) this.updateGuideMessage(`🧵 <b>[6단계-2: 전선 입선 ${stepNo}/${total}] 정션 경유 ${names} (${all.length}가닥)</b><br>${html}`); };
    const callout = async (x, y, text, ms) => {
      if (!isAnimated) return;
      const [el] = this.appendSvg(toolLayer, `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="-13" width="${text.length * 11 + 16}" height="26" rx="6" fill="#0f172a" stroke="#facc15" stroke-width="1.5" />
          <text x="8" y="5" font-size="12" font-weight="900" fill="#fef08a">${text}</text>
        </g>`);
      this.popIn(el, 200);
      await this.sleep(ms);
      el.remove();
    };

    // ① 제어함 쪽: 다발별 3가닥 테이핑 ➜ ② 6가닥 한 묶음 테이핑
    const ids = group.map(b => b.id);
    const entry = all[0].pts[all[0].entryIdx];        // 제어함 쪽 배관 입구
    const split = all[0].pts[all[0].splitIdx];        // J박스 분기점
    const tapeCallout = [entry[0] - 240, entry[1] - 70];
    if (isAnimated) {
      await this.focusBox(entry[0] - 150, entry[1] - 120, entry[0] + 60, entry[1] + 50, 80, 460);   // 🎥 제어함 입구(테이핑 위치)
      if (!this.alive(token)) return;
    }
    say(`① 제어함에서 <b>${ids.map(n => `${n} 3가닥`).join(', ')}을 각각 테이핑</b>합니다.`);
    group.forEach(b => {
      const ws = this.wires.filter(w => w.bundle === b);
      const at = ws.map(w => this.pointAlong(w.pts, w.entryIdx, 16));
      const [el] = this.appendSvg(tapeLayer, this.tapeMarkup(at.map(a => a.p), at[0].dir));
      if (isAnimated) this.popIn(el, 200);
    });
    await callout(tapeCallout[0], tapeCallout[1], `✋ ${ids.map(n => `${n} 3가닥`).join(' · ')} 각각 테이핑`, 900);
    if (!this.alive(token)) return;

    say(`② 두 묶음을 다시 <b>하나(${all.length}가닥)로 테이핑</b>해서 한 번에 넣습니다.`);
    const at6 = all.map(w => this.pointAlong(w.pts, w.entryIdx, 40));
    const [big] = this.appendSvg(tapeLayer, this.tapeMarkup(at6.map(a => a.p), at6[0].dir));
    if (isAnimated) this.popIn(big, 200);
    await callout(tapeCallout[0], tapeCallout[1], `✋ ${all.length}가닥 한 묶음으로 다시 테이핑`, 900);
    if (!this.alive(token)) return;

    // ③ 가까운 곳 ➜ 먼 곳: 제어함에서 J박스까지 6가닥 한 묶음으로 밀어 넣기
    if (isAnimated) {
      await this.focusPoints(all.flatMap(w => w.pts.slice(0, w.splitIdx + 1)));   // 🎥 제어함 ➜ J박스 구간
      if (!this.alive(token)) return;
    }
    say(`③ <b>가까운 곳(제어함)에서 먼 곳으로</b> — ${all.length}가닥 묶음을 <b>J박스까지</b> 밀어 넣습니다.`);
    const firstHalf = all.map(w => this.appendSvg(wireLayer, this.wireMarkup(w, { range: [0, w.splitIdx] }))[0]);
    if (isAnimated) {
      await Promise.all(firstHalf.map(el => Promise.all([...el.querySelectorAll('path')].map(p => this.drawStroke(p, 70)))));
      if (!this.alive(token)) return;
    }

    // ④ J박스에서 3가닥씩 분리해 각 박스로
    if (isAnimated) {
      await this.focusPoints(all.flatMap(w => w.pts.slice(w.splitIdx)));   // 🎥 J박스 ➜ PB·SS 분기
      if (!this.alive(token)) return;
    }
    say(`④ <b>J박스에서 3가닥씩 분리</b>해 ${group.map(b => b.name).join('·')} 쪽으로 각각 보냅니다.`);
    await callout(split[0] + 30, split[1] + 42, '✂️ J박스에서 3가닥씩 분리', 700);
    if (!this.alive(token)) return;
    for (const b of group) {
      const ws = this.wires.filter(w => w.bundle === b);
      const els = ws.map(w => this.appendSvg(wireLayer, this.wireMarkup(w, { range: [w.splitIdx, w.pts.length - 1] }))[0]);
      const at = ws.map(w => this.pointAlong(w.pts, w.splitIdx, 48));
      const [tape] = this.appendSvg(tapeLayer, this.tapeMarkup(at.map(a => a.p), at[0].dir));
      if (isAnimated) {
        await Promise.all(els.map(el => Promise.all([...el.querySelectorAll('path')].map(p => this.drawStroke(p, 70)))));
        this.popIn(tape, 200);
        if (!this.alive(token)) return;
        await this.sleep(150);
      }
    }
    // ⑤ J박스에서 양쪽(제어함 쪽·박스 쪽)으로 각각 약 15cm씩 여유 있게 빼 둠 ➜ 결선 후 말아서 J박스 안에 넣음
    if (isAnimated) {
      await this.focusBox(split[0] - 170, split[1] - 190, split[0] + 170, split[1] + 70, 40, 460);
      if (!this.alive(token)) return;
    }
    say('⑤ <b>J박스에서 양쪽으로 각각 약 15cm씩 여유 있게</b> 선을 빼 둡니다. (제어함 쪽 · 박스 쪽) 결선이 끝나면 남는 선을 <b>J박스 쪽으로 당겨 둥글게 말아 넣어요.</b>');
    const [loops] = this.appendSvg(this.layer('slack-layer'), this.junctionSlackMarkup('out', all.length));
    if (isAnimated) {
      this.popIn(loops, 300);
      await this.sleep(1300);
      if (!this.alive(token)) return;
    }
    await this.addSlackTails(all, isAnimated, token);
  }

  /** 결선 후 J박스 여유선(양쪽 15cm 고리) ➜ J박스 쪽으로 당겨 둥글게 말아 넣기 */
  async coilJunctionSlack(isAnimated, token) {
    if (!this.bundles.some(b => b.via.length > 1)) return;
    const layer = this.layer('slack-layer');
    const out = layer.querySelector('.s6-jslack-out');
    const [jx, jy] = this.junction;
    if (isAnimated) {
      await this.focusBox(jx - 170, jy - 190, jx + 170, jy + 70, 40, 460);
      if (!this.alive(token)) return;
      this.updateGuideMessage('🌀 <b>[6단계-3: J박스 정리]</b><br>양쪽 결선이 끝나면, J박스에서 <b>양쪽으로 15cm씩 빼 두었던 남는 선</b>을 <b>J박스 쪽으로 당겨 둥글게 말아</b> J박스 안에 넣습니다.<br>💡 시험에서는 <b>J박스(8각 박스) 뚜껑이 없어서</b> 말아 넣은 선이 그대로 보여요 — 깔끔하게 말아 넣으세요!');
      if (out) {
        out.style.transformOrigin = `${jx}px ${jy}px`;
        await out.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.25)', opacity: 0 }], { duration: 900 / this.speed, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {});
      }
    }
    layer.querySelectorAll('.s6-jslack').forEach(el => el.remove());
    const n = this.bundles.filter(b => b.via.length > 1).reduce((k, b) => k + b.pins.length, 0);
    const [coil] = this.appendSvg(layer, this.junctionSlackMarkup('coil', n));
    if (isAnimated) {
      this.popIn(coil, 300);
      await this.sleep(1200);
    }
  }

  /** 기구 쪽 끝 여유선: 결선 자리 너머로 약 6cm 더 빼 둔 선 (결선할 때 길이에 맞춰 절단) */
  async addSlackTails(wires, isAnimated, token) {
    const layer = this.layer('slack-layer');
    const tails = wires.filter(w => !w.bundle.pullSkip).map(w => {
      const n = w.pts.length;
      const [a, b] = [w.pts[n - 2], w.pts[n - 1]];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
      const nrm = [-u[1], u[0]];
      const o = (w.k - 1) * 4;
      const p = (t, side) => [b[0] + u[0] * t + nrm[0] * side, b[1] + u[1] * t + nrm[1] * side];
      const pts = [p(0, 0), p(18, o * 0.5 + 4), p(36, o - 4), p(54, o + 6), p(62, o)];
      const d = `M ${pts[0].join(' ')} C ${pts[1].join(' ')} ${pts[2].join(' ')} ${pts[3].join(' ')} S ${pts[4].join(' ')} ${pts[4].join(' ')}`;
      const style = WIRE[w.pinInfo.wire];
      return `<g class="s6-slack-tail" data-bundle="${w.bundle.id}" fill="none" stroke-linecap="round">
        <path d="${d}" stroke="${style.outline}" stroke-width="2.6" opacity="0.7" /><path d="${d}" stroke="${style.color}" stroke-width="1.6" />
        ${style.stripe ? `<path d="${d}" stroke="${style.stripe}" stroke-width="1.6" stroke-dasharray="4 4" />` : ''}</g>`;
    }).join('');
    if (!tails) return;
    const [g] = this.appendSvg(layer, `<g class="s6-slack-tails">${tails}</g>`);
    if (isAnimated) {
      this.popIn(g, 200);
      await this.sleep(250);
    }
  }

  /**
   * J박스 여유선
   * - 'out': 양쪽(제어함 쪽·박스 쪽)으로 각각 약 15cm씩 빼 둔 고리 (벽면 위쪽 빈 곳으로)
   * - 'coil': 결선 후 남는 선을 J박스 쪽으로 당겨 둥글게 말아 넣은 모습 (시험에서는 J박스 뚜껑 없음 ➜ 보임)
   */
  junctionSlackMarkup(mode, strands = 6) {
    const [jx, jy] = this.junction;
    const up = jy < 825 ? -1 : 1;                      // 벽면 빈 쪽(위쪽)으로 고리
    const lines = Math.min(6, Math.max(3, strands));
    if (mode === 'out') {
      const loop = (cx, label, color, side) => {
        const H = 62, W = 24;   // 여유 15cm (고리 한쪽 높이 ≈ 6cm)
        const paths = Array.from({ length: lines }, (_, i) => {
          const o = (i - (lines - 1) / 2) * 2.2;
          const x0 = cx - W / 2 + o, x1 = cx + W / 2 - o;
          const y0 = jy + up * 20, yt = jy + up * (H + o);
          return `<path d="M ${x0} ${y0} L ${x0} ${yt + up * -W / 2} A ${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 ${up < 0 ? 1 : 0} ${x1} ${yt + up * -W / 2} L ${x1} ${y0}" />`;
        }).join('');
        return `<g fill="none" stroke-linecap="round">
            <g stroke="#78350f" stroke-width="2.6" opacity="0.7">${paths}</g><g stroke="#facc15" stroke-width="1.6">${paths}</g>
          </g>
          <g transform="translate(${cx + side * 84}, ${jy + up * (H + 4)})">
            <rect x="-56" y="-12" width="112" height="22" rx="11" fill="#0f172a" stroke="${color}" stroke-width="1.5" />
            <text y="4" text-anchor="middle" font-size="11" font-weight="900" fill="${color}">${label}</text>
          </g>`;
      };
      return `<g class="s6-jslack s6-jslack-out">${loop(jx - 24, '제어함 쪽 여유 15cm', '#fde68a', -1)}${loop(jx + 24, '박스 쪽 여유 15cm', '#bae6fd', 1)}</g>`;
    }
    // 'coil': J박스 안에 둥글게 말아 넣은 선
    const turns = Array.from({ length: lines }, (_, i) => {
      const r = 10 + i * 3.2;
      return `<circle cx="${jx}" cy="${jy}" r="${r.toFixed(1)}" />`;
    }).join('');
    return `<g class="s6-jslack s6-jslack-coil">
        <g fill="none" stroke="#78350f" stroke-width="2.6" opacity="0.7">${turns}</g>
        <g fill="none" stroke="#facc15" stroke-width="1.6" stroke-dasharray="40 6">${turns}</g>
      </g>`;
  }

  wireMarkup(w, { reverse = false, range = null } = {}) {
    const style = WIRE[w.pinInfo.wire];
    const base = range ? w.pts.slice(range[0], range[1] + 1) : w.pts;
    const pts = reverse ? [...base].reverse() : base;
    const d = roundedPathD(pts, (i, p) => w.bendAt?.get(p) || 0);   // 배관 코너에서는 배관처럼 둥글게
    return `
      <g class="s6-wire" data-bundle="${w.bundle.id}" data-pin="${w.pinInfo.pin}" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path class="s6-wire-outline" d="${d}" stroke="${style.outline}" stroke-width="2.6" opacity="0.7" />
        <path class="s6-wire-core" d="${d}" stroke="${style.color}" stroke-width="1.6" />
        ${style.stripe ? `<path class="s6-wire-stripe" d="${d}" stroke="${style.stripe}" stroke-width="1.6" stroke-dasharray="4 4" />` : ''}
      </g>`;
  }

  // ---------------------------------------------------------------------------
  // [1] 외부단자 가조립 (시공 표준 8) — 접지는 6단계-3 결선에서 주회로 선과 함께
  // ---------------------------------------------------------------------------
  /** 컨트롤박스 안 단자 + 공통 연결선(점퍼) — 가조립 때 미리 연결 (애니메이션 없이 그림) */
  drawPreassembledCommons() {
    const layer = this.layer('terminals-layer');
    this.bundles.filter(b => b.device?.type === 'box' && this.boxInternals[b.id]).forEach(b => {
      const spec = this.boxInternals[b.id];
      this.appendSvg(layer, this.boxTerminalsMarkup(spec) + this.boxJumperMarkup(spec));
    });
  }

  async runStep1(isAnimated = true, token = null) {
    token = this.beginRun(token);
    this.currentStep = 1;
    const badges = this.layer('badges-layer');
    badges.innerHTML = '';
    this.layer('terminals-layer').innerHTML = '';

    // 주회로 4가닥(갈·흑·회·녹황, 접지 포함)이 들어가는 단자대 = PE선이 있는 단자대(TB1·TB2·TB3)
    const groundTBs = this.bundles.filter(b => b.device?.type !== 'box' && this.wires.some(w => w.bundle === b && w.pinInfo.wire === 'PE'));
    // 보조선만 들어가는 단자대(TB4: 수위센서 3가닥 / 리밋스위치 2가닥) ➜ 접지 없음
    const auxTBs = this.bundles.filter(b => b.device?.type === 'tbBlock' && !groundTBs.includes(b));
    const tb4Lead = this.problem.board.externalLeads?.TB4;
    const tb4Text = tb4Lead ? `${tb4Lead.wires.length}가닥(${tb4Lead.wires.map(w => w.label).join('·')})` : '보조선';

    this.updateGuideMessage(`🔧 <b>[6단계-1: 외부단자 가조립]</b><br>
      ① 컨트롤박스 ${this.boxCovers.length}개(${this.boxCovers.map(b => b.name).join(' · ')})는 박스 안 <b>공통선(공통 연결점)만 미리 연결</b>해 두고 가조립합니다.<br>
      ② 외부 단자대(${this.bundles.filter(b => b.device?.type === 'tbBlock').map(b => b.id).join('·')})를 가조립합니다. <b>${groundTBs.map(b => b.id).join('·')}</b>의 접지(녹황)는 나중에 <b>주회로 4가닥(갈·흑·회·녹황)을 결선할 때 함께</b> 연결해요.<br>
      ③ <b>${auxTBs.map(b => b.id).join('·') || 'TB4'}</b>는 보조선 ${tb4Text}만 들어가고 <b>접지는 없어요</b>.`);

    // 단자대 가조립 표시 위치 (과제 데이터의 외부 단자대 위치에서 계산)
    // 단자대 이름 표기((세로)/(가로)) 바로 아래 — 단자대 상자·단자·인출선과 겹치지 않는 자리
    const tbBadgePos = (b, w) => {
      const g = this.tbGeometry(b);
      if (g.vertical) return { x: g.x0 + g.w / 2 + g.outward[0] * (w / 2 - 10), y: g.y0 - 16 };   // 단자대 위쪽 (배관 반대편으로)
      return { x: g.x0 - 8 - w / 2, y: g.y0 + 44 };
    };

    // ① 컨트롤박스: 공통 연결선(점퍼) 먼저 ➜ 가조립
    for (const box of this.boxCovers) {
      const bundle = this.bundles.find(b => b.device?.type === 'box' && this.boxInternals[b.id]
        && this.boxInternals[b.id].origin[0] === box.x && this.boxInternals[b.id].origin[1] === box.y);
      const spec = bundle && this.boxInternals[bundle.id];
      const els = [];
      if (spec) {
        els.push(...this.appendSvg(this.layer('terminals-layer'), this.boxTerminalsMarkup(spec)));
        els.push(...this.appendSvg(this.layer('terminals-layer'), this.boxJumperMarkup(spec)));
      }
      const [badge] = this.appendSvg(badges, `
        <g class="s6-badge" transform="translate(${box.x + 45}, ${box.y - 14})">
          <rect x="-56" y="-11" width="112" height="22" rx="11" fill="#0f172a" stroke="#a78bfa" stroke-width="1.5" />
          <text y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#ddd6fe">🔧 공통선 연결 · 가조립</text>
        </g>`);
      els.push(badge);
      if (isAnimated) {
        await this.focusBox(box.x - 60, box.y - 40, box.x + 150, box.y + 170, 60, 420);   // 🎥 박스 안이 보이게
        if (!this.alive(token)) return;
        if (spec) this.updateGuideMessage(spec.jumper ? `🔧 <b>[6단계-1: 가조립] ${box.name}</b><br>박스 안에서 먼저 <b>${spec.jumper.text}</b> — 공통선(공통 연결점)만 미리 이어 둡니다.` : `🔧 <b>[6단계-1: 가조립] ${box.name}</b><br>기구가 하나뿐이라 공통선 없이 바로 가조립합니다.`);
        for (const el of els) this.popIn(el, 220);
        await this.sleep(600);
        if (!this.alive(token)) return;
      }
    }

    // 외부 단자대 가조립 (TB4는 접지 없음 표시)
    for (const b of this.bundles.filter(x => x.device?.type === 'tbBlock')) {
      const aux = auxTBs.includes(b);
      const text = aux ? `🔧 가조립 · 접지 없음 · ${tb4Text}` : '🔧 가조립';
      const w = aux ? 210 : 72;
      const { x, y } = tbBadgePos(b, w);
      const [el] = this.appendSvg(badges, `
        <g class="s6-badge" transform="translate(${x}, ${y})">
          <rect x="${-w / 2}" y="-11" width="${w}" height="22" rx="11" fill="#0f172a" stroke="${aux ? '#facc15' : '#a78bfa'}" stroke-width="1.5" />
          <text y="4" text-anchor="middle" font-size="11" font-weight="900" fill="${aux ? '#fde68a' : '#ddd6fe'}">${text}</text>
        </g>`);
      if (isAnimated) {
        await this.focusElement(el);   // 🎥 가조립하는 단자대로
        if (!this.alive(token)) return;
        this.popIn(el, 220);
        await this.sleep(200);
        if (!this.alive(token)) return;
      }
    }

    if (isAnimated) {
      await this.sleep(300);
      await this.focusAll();
    }
  }

  // ---------------------------------------------------------------------------
  // [2] 전선 입선 (시공 표준 9): 먼 쪽 배관부터 요비선으로 당겨 넣기
  // ---------------------------------------------------------------------------
  pullOrder() {
    const lengthOf = (pts) => pts.reduce((s, p, i) => (i ? s + Math.abs(p[0] - pts[i - 1][0]) + Math.abs(p[1] - pts[i - 1][1]) : 0), 0);
    return this.bundles.filter(b => !b.pullSkip)
      .map(b => ({ b, len: lengthOf(this.wires.find(w => w.bundle === b).pts) }))
      .sort((a, c) => c.len - a.len)
      .map(x => x.b);
  }

  async runStep2(isAnimated = true, token = null) {
    token = this.beginRun(token);
    if (this.currentStep < 1) await this.runStep1(false, token);
    this.currentStep = 2;
    const wireLayer = this.layer('wires-layer');
    wireLayer.innerHTML = '';
    this.layer('slack-layer').innerHTML = '';
    this.layer('terminals-layer').innerHTML = '';
    this.drawPreassembledCommons();   // 가조립 때 이어 둔 박스 공통 연결선은 그대로
    this.layer('badges-layer').querySelectorAll('.s6-tape, .s6-count').forEach(el => el.remove());

    this.updateGuideMessage("🧵 <b>[6단계-2: 전선 입선]</b><br><b>먼 쪽 배관부터</b> 요비선에 전선을 감아 당겨 넣습니다. (먼 곳을 먼저 넣어야 이미 들어간 전선과 엉키지 않아요!)<br>🔀 <b>J박스를 거치는 다발</b>은 제어함에서 3가닥씩 테이핑 ➜ 한 묶음 ➜ J박스까지 ➜ 3가닥씩 분리합니다.<br>제어선은 <b>황색</b>, 전동기선은 <b>갈·흑·회</b>, 접지선은 <b>녹황</b>입니다.<br>✂️ 선은 <b>항상 여유 있게 빼 두고</b>, 결선할 때 길이에 맞춰 잘라 마무리합니다.");
    if (isAnimated) await this.sleep(600);

    // 정션(J박스)을 거치는 다발은 하나의 작업으로 묶음 (첫 배관이 같은 다발들)
    const junction = this.bundles.filter(b => b.via.length > 1);
    const order = [];
    this.pullOrder().forEach(b => {
      if (junction.includes(b)) {
        if (!order.includes(junction)) order.push(junction);
      } else {
        order.push(b);
      }
    });
    for (let i = 0; i < order.length; i++) {
      if (!this.alive(token)) return;
      if (Array.isArray(order[i])) {
        await this.pullJunctionGroup(order[i], isAnimated, token, i + 1, order.length);
        if (!this.alive(token)) return;
        continue;
      }
      const bundle = order[i];
      const wires = this.wires.filter(w => w.bundle === bundle);
      if (isAnimated) {
        this.updateGuideMessage(`🧵 <b>[6단계-2: 전선 입선 ${i + 1}/${order.length}]</b> ${bundle.name} — <b>${wires.length}가닥</b><br>기구 쪽에서 요비선을 걸어 <b>제어함 쪽으로 당겨</b> 넣습니다.<br><span style="color:#94a3b8;">먼 쪽부터: ${order.map(b => (Array.isArray(b) ? b.map(x => x.id).join('·') + '(정션)' : b.id)).join(' ➜ ')}</span>`);
      }
      if (isAnimated) {
        await this.focusPoints(wires.flatMap(w => w.pts));   // 🎥 입선하는 배관 다발 경로
        if (!this.alive(token)) return;
      }
      // 기구 쪽 ➜ 제어함 쪽으로 당기는 방향으로 그림
      const els = wires.map(w => this.appendSvg(wireLayer, this.wireMarkup(w, { reverse: true }))[0]);
      if (isAnimated) {
        await Promise.all(els.map(el => Promise.all([...el.querySelectorAll('path')].map(p => this.drawStroke(p, 70)))));
        if (!this.alive(token)) return;
      }
      await this.addSlackTails(wires, isAnimated, token);
      if (!this.alive(token)) return;
      if (isAnimated) await this.sleep(200);
    }

    // ③ 케이블 심선 (제어함 안, 커넥터 ➜ TB5): 결선 단계에서 함께 처리하도록 여기서 미리 배치
    this.wires.filter(w => w.bundle.pullSkip).forEach(w => this.appendSvg(wireLayer, this.wireMarkup(w)));

    // 배관별 가닥 수 표시
    const counts = {};
    this.bundles.forEach(b => b.via.forEach(v => { counts[v] = (counts[v] || 0) + b.pins.length; }));
    const badges = this.layer('badges-layer');
    Object.entries(counts).forEach(([v, n]) => {
      const pts = this.s5.pipes[v].points;
      const [a, c] = [pts[0], pts[1]];
      const mx = (a[0] + c[0]) / 2 + (a[0] === c[0] ? 26 : 0);
      const my = (a[1] + c[1]) / 2 + (a[1] === c[1] ? -22 : 60);
      const [el] = this.appendSvg(badges, `
        <g class="s6-count" transform="translate(${mx}, ${my})">
          <rect x="-24" y="-10" width="48" height="20" rx="10" fill="#422006" stroke="#facc15" stroke-width="1.5" />
          <text y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#fef08a">${n}가닥</text>
        </g>`);
      if (isAnimated) this.popIn(el, 200);
    });

    if (isAnimated) {
      await this.focusAll();
      this.updateGuideMessage(`✅ <b>[6단계-2 입선 완료]</b><br>배관 ${Object.keys(counts).length}개에 전선을 모두 넣었습니다. (제어함 ➜ J박스 구간은 ${this.bundles.filter(b => b.via.length > 1).map(b => `${b.id} ${b.pins.length}`).join(' + ')} = <b>${this.bundles.filter(b => b.via.length > 1).reduce((n, b) => n + b.pins.length, 0)}가닥</b>)<br>다음은 <b>3. 탈피 & 결선</b>입니다.`);
      await this.sleep(400);
    }
  }

  // ---------------------------------------------------------------------------
  // [3] 양쪽 선 탈피 및 결선 (시공 표준 10): 공통선 먼저 ➜ 단독선
  // ---------------------------------------------------------------------------
  terminalMarkup(x, y, num, common, label, labelSide = 1) {
    return `
      <g class="s6-term" transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})">
        <circle r="3.2" fill="#d97706" stroke="#78350f" stroke-width="1" />
        <g transform="translate(0, -10)">
          <circle r="6.5" fill="${common ? '#16a34a' : '#0284c7'}" stroke="#ffffff" stroke-width="1" />
          <text y="3" text-anchor="middle" font-size="8" font-weight="900" fill="#ffffff">${num}</text>
        </g>
        ${label ? `<text x="${labelSide * 9}" y="3" text-anchor="${labelSide > 0 ? 'start' : 'end'}" font-size="8" font-weight="900" fill="#f8fafc">${label}</text>` : ''}
      </g>`;
  }

  /** 박스 로컬 좌표 ➜ 벽면 좌표 */
  boxPoint(spec, local) {
    return [spec.origin[0] + local[0], spec.origin[1] + local[1]];
  }

  /** 박스 기구 단자(나사) + 접점 표시(NO 열림 / NC 닫힘) */
  boxTerminalsMarkup(spec) {
    let out = '<g class="s6-box-internal">';
    spec.contacts.forEach(c => {
      const [a, b] = [this.boxPoint(spec, spec.terms[c.a]), this.boxPoint(spec, spec.terms[c.b])];
      const open = c.type === 'NO';
      if (c.vertical) {
        // 세로 접점 (SS): 위·아래 단자 사이 날 — 박스 가장자리 쪽에 그리고 이름표는 원 아래
        const leftSide = spec.terms[c.a][0] < 45;  // 박스 로컬 x로 판정
        const x = a[0] + (leftSide ? -6 : 6), y1 = a[1] + 4, y2 = b[1] - 4, my = (y1 + y2) / 2;
        const color = open ? '#fca5a5' : '#86efac';
        out += `<path d="M ${x} ${y1} L ${x} ${my - 4} ${open ? `M ${x + (leftSide ? 4 : -4)} ${my - 4} L ${x} ${my + 4}` : `L ${x} ${my + 4}`} L ${x} ${y2}" stroke="${color}" stroke-width="1.6" fill="none" />`;
        out += `<text x="${spec.origin[0] + (leftSide ? 5 : 85)}" y="${spec.origin[1] + c.labelY}" text-anchor="${leftSide ? 'start' : 'end'}" font-size="8" font-weight="900" fill="${color}">${c.label}</text>`;
      } else {
        // 가로 접점 (PB): 버튼 아래에 접점 기호와 이름
        const y = spec.origin[1] + c.y;
        const x1 = a[0] + 4, x2 = b[0] - 4, mx = (x1 + x2) / 2;
        out += `<path d="M ${x1} ${y} L ${mx - 6} ${y} ${open ? `M ${mx - 6} ${y - 5} L ${mx + 6} ${y}` : `L ${mx + 6} ${y}`} L ${x2} ${y}" stroke="${open ? '#fca5a5' : '#86efac'}" stroke-width="1.6" fill="none" />`;
        out += `<text x="${mx}" y="${y + 10}" text-anchor="middle" font-size="7.5" font-weight="900" fill="${open ? '#fca5a5' : '#86efac'}">${c.label}</text>`;
      }
    });
    Object.values(spec.terms).forEach(t => {
      const [x, y] = this.boxPoint(spec, t);
      out += `<g transform="translate(${x}, ${y})"><circle r="4" fill="#cbd5e1" stroke="#334155" stroke-width="1" /><path d="M -2.4 0 L 2.4 0" stroke="#334155" stroke-width="1" /></g>`;
    });
    return out + '</g>';
  }

  /** 박스 안 점퍼선 (같은 박스의 두 단자를 서로 연결) */
  boxJumperMarkup(spec) {
    const j = spec.jumper;
    if (!j) return '';   // 기구가 하나뿐인 박스(예: PB2/CAP)는 공통 연결선 없음
    const a = this.boxPoint(spec, spec.terms[j.from]);
    const b = this.boxPoint(spec, spec.terms[j.to]);
    const pts = j.laneY !== undefined
      ? [a, [a[0], spec.origin[1] + j.laneY], [b[0], spec.origin[1] + j.laneY], b]
      : [a, [spec.origin[0] + j.lane, a[1]], [spec.origin[0] + j.lane, b[1]], b];
    const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
    return `
      <g class="s6-jumper">
        <path d="${d}" fill="none" stroke="#0f172a" stroke-width="2.6" opacity="0.7" />
        <path d="${d}" fill="none" stroke="#facc15" stroke-width="1.6" />
        <circle cx="${a[0]}" cy="${a[1]}" r="2.6" fill="#d97706" /><circle cx="${b[0]}" cy="${b[1]}" r="2.6" fill="#d97706" />
      </g>`;
  }

  /** 제어함에서 온 선의 박스 안쪽 끝(deviceEnd) ➜ 기구 단자까지 */
  boxWireMarkup(spec, w) {
    const route = spec.wires[w.pinInfo.label];
    const term = this.boxPoint(spec, spec.terms[route.term]);
    const laneX = spec.origin[0] + route.lane;
    const [ex, ey] = w.deviceEnd;
    // 가닥마다 3mm씩 엇갈려 가로질러 겹침 방지 — 기구(원) 쪽이 아니라 박스 가장자리(입구) 쪽으로
    const hy = ey - Math.sign(term[1] - ey) * w.k * 3;
    const pts = [[ex, ey], [ex, hy], [laneX, hy], [laneX, term[1]], term]
      .filter((p, i, arr) => i === 0 || Math.abs(p[0] - arr[i - 1][0]) > 0.01 || Math.abs(p[1] - arr[i - 1][1]) > 0.01);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    const style = WIRE[w.pinInfo.wire];
    return {
      term,
      markup: `
      <g class="s6-box-wire">
        <path d="${d}" fill="none" stroke="${style.outline}" stroke-width="2.6" opacity="0.7" />
        <path d="${d}" fill="none" stroke="${style.color}" stroke-width="1.6" />
      </g>`
    };
  }

  /**
   * 🔔 벨 테스터: 제어함 단자와 반대쪽 전선 끝에 리드를 대고, 도통되면 "삐-" 소리 + 전선이 빛남
   */
  async bellTest(w) {
    const layer = this.s5.layer('tool-layer');
    const d = roundedPathD(w.testPts, (i, p) => w.bendAt?.get(p) || 0);
    const probe = ([x, y], color) => `
      <g transform="translate(${x}, ${y})">
        <circle r="10" fill="none" stroke="${color}" stroke-width="3.5" />
        <path d="M 0 -10 L 0 -32" stroke="${color}" stroke-width="3.5" stroke-linecap="round" />
        <circle cy="-35" r="4.5" fill="${color}" stroke="#ffffff" stroke-width="1" />
      </g>`;
    const [g] = this.appendSvg(layer, `
      <g class="s6-bell">
        <path d="${d}" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0" />
        ${probe(w.panelEnd, '#ef4444')}
        ${probe(w.deviceEnd, '#111827')}
        <g transform="translate(${w.deviceEnd[0] + 12}, ${w.deviceEnd[1] - 30})">
          <rect width="64" height="20" rx="10" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
          <text x="32" y="14" text-anchor="middle" font-size="11" font-weight="900" fill="#7dd3fc">🔔 ${w.pinInfo.label}</text>
        </g>
      </g>`);
    await this.sleep(250);
    const glow = g.querySelector('path');
    glow.setAttribute('opacity', '0.85');
    glow.style.filter = 'drop-shadow(0 0 4px #38bdf8)';
    this.beep();
    await this.sleep(450);
    g.remove();
  }

  /** 벨 테스터 "삐-" 소리 */
  beep() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* ignore */ }
  }

  async runStep3(isAnimated = true, token = null) {
    token = this.beginRun(token);
    if (this.currentStep < 2) await this.runStep2(false, token);
    this.currentStep = 3;
    const termLayer = this.layer('terminals-layer');
    termLayer.innerHTML = '';

    this.updateGuideMessage("✂️ <b>[6단계-3: 양쪽 선 탈피 및 결선]</b><br>다발마다 <b>① 제어함 단자대 쪽 먼저 결선 ➜ ② 🔔 벨 테스터로 한 가닥씩 찍어 확인 ➜ ③ 박스의 버튼·스위치·램프에 결선</b> 순서로 합니다. (벨 테스터 확인 없이 결선하면 선이 뒤바뀌기 쉬워요!)<br>각 쪽에서는 <b>공통선(초록 ①)을 먼저</b>, 그다음 <b>단독선(파랑)</b>.<br>2구 박스는 <b>박스 안 내부 연결(점퍼) ➜ 공통선 ➜ 단독선</b> 순서입니다.<br>전동기 단자대(TB2·TB3)는 <b>PE(접지)부터</b>, TB4(수위)는 <b>E1 ➜ E2 ➜ E3</b> 순서로 결선합니다.");
    if (isAnimated) await this.sleep(600);

    for (const bundle of this.bundles) {
      const wires = this.wires.filter(w => w.bundle === bundle);
      const spec = this.boxInternals[bundle.id];
      const say = (html) => { if (isAnimated) this.updateGuideMessage(`✂️ <b>[6단계-3: 결선] ${bundle.name}</b><br>${html}`); };

      if (isAnimated) {
        // 🎥 결선하는 곳: 기구(2구 박스·외부 단자대)와 제어함 단자대(TB5/TB6)의 해당 단자를 함께
        const points = wires.flatMap(w => [w.panelEnd, w.deviceEnd]);
        if (spec) points.push([spec.origin[0], spec.origin[1]], [spec.origin[0] + 90, spec.origin[1] + 140]);
        await this.focusPoints(points, 80, 440);
        if (!this.alive(token)) return;
      }

      // ① 제어함 단자대 쪽 먼저 결선 (공통선·PE 먼저 ➜ 단독선)
      for (const w of wires) {
        if (!this.alive(token)) return;
        const [a] = this.appendSvg(termLayer, this.terminalMarkup(w.panelEnd[0], w.panelEnd[1], w.k + 1, w.pinInfo.common, ''));
        if (isAnimated) {
          say(`① <b>제어함 단자대 쪽 먼저</b> 결선 — ${w.k + 1}번째 <b>${w.pinInfo.label}</b> ➜ <b>${bundle.tb} ${w.pinInfo.pin}번</b> ${w.pinInfo.common ? '(공통선/접지 먼저!)' : ''}`);
          this.popIn(a, 200);
          await this.sleep(260);
        }
      }

      // ② 벨 테스터로 한 가닥씩 찍어 어느 선인지 확인 (반대쪽 끝 = 박스·단자대 안)
      for (const w of wires) {
        if (!this.alive(token)) return;
        if (isAnimated) {
          say(`② 🔔 <b>벨 테스터로 확인</b> — 제어함 <b>${bundle.tb} ${w.pinInfo.pin}번</b>에 한쪽 리드를 대고, 반대쪽 전선 끝을 찍어 <b>"삐-"</b> 소리가 나는 선이 <b>${w.pinInfo.label}</b>선!`);
          await this.bellTest(w);
          if (!this.alive(token)) return;
        }
      }

      // ✂️ 기구 쪽에 여유 있게 빼 둔 선을 결선 자리 길이에 맞춰 절단
      const tails = [...this.layer('slack-layer').querySelectorAll(`.s6-slack-tail[data-bundle="${bundle.id}"]`)];
      if (tails.length && isAnimated) {
        say(`✂️ 여유 있게 빼 둔 선을 <b>결선할 길이에 맞춰 절단</b>하고 피복을 벗깁니다. (짧게 자르면 다시 뺄 수 없으니 넉넉하게 빼 두었다가 마지막에 잘라요)`);
        tails.forEach(t => t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450 / this.speed, fill: 'forwards' }));
        await this.sleep(550);
        if (!this.alive(token)) return;
      }
      tails.forEach(t => t.remove());

      // ③ 확인한 선을 박스의 버튼·스위치·램프(또는 외부 단자대)에 결선
      if (spec) {
        const [terms] = this.appendSvg(termLayer, this.boxTerminalsMarkup(spec));
        const [jumper] = this.appendSvg(termLayer, this.boxJumperMarkup(spec));
        if (isAnimated) {
          say(`③ ${spec.jumper ? `가조립 때 미리 이어 둔 <b>${spec.jumper.text}</b>(공통 연결점)에 <b>공통선</b>을 먼저 결선합니다.` : '기구가 하나라 공통선 없이 두 단자에 차례로 결선합니다.'}${bundle.id === 'PB' ? '<br>💡 PB1(녹색)은 <b>NO</b>, PB0(빨강)은 <b>NC</b> 접점에 결선!' : ''}${bundle.id === 'SS' ? '<br>💡 SS 접점 4개: <b>M = 끊어진 상태</b>, <b>A = 연결된 상태</b>' : ''}`);
          this.popIn(terms, 200);
          if (jumper) this.popIn(jumper, 200);   // 기구가 하나뿐인 박스는 공통 연결선 없음
          await this.sleep(700);
          if (!this.alive(token)) return;
        }
      }
      for (const w of wires) {
        if (!this.alive(token)) return;
        const num = w.k + 1;
        let devicePoint = w.deviceEnd;
        if (spec) {
          // 박스 안쪽 끝 ➜ 해당 기구 단자까지 선을 이어 결선
          const { term, markup } = this.boxWireMarkup(spec, w);
          const [inner] = this.appendSvg(termLayer, markup);
          if (isAnimated) this.popIn(inner, 200);
          devicePoint = term;
        }
        // 외부 단자대 단자 이름은 단자대 안쪽(전선이 오는 반대쪽)에 표시
        let labelSide = 1;
        if (bundle.device?.type === 'tbBlock' && bundle.device.edge === 'x') {
          const pipeEnd = this.s5.pipes[bundle.via[bundle.via.length - 1]].points.slice(-1)[0];
          labelSide = pipeEnd[0] < bundle.device.at ? 1 : -1;
        }
        const [b] = this.appendSvg(termLayer, this.terminalMarkup(devicePoint[0], devicePoint[1], num, w.pinInfo.common,
          bundle.device?.type === 'box' ? '' : w.pinInfo.label, labelSide));
        if (isAnimated) {
          const where = spec
            ? `${bundle.name} <b>${w.pinInfo.common ? '내부 연결점' : `${w.pinInfo.label} 단자`}</b>`
            : (bundle.via.length ? `${bundle.name} ${w.pinInfo.label}` : 'TB1 케이블 심선');
          say(`③ 확인한 선 결선 — ${num}번째 <b>${w.pinInfo.label}</b> ${w.pinInfo.common ? '(공통선/접지 먼저!)' : '(단독선)'} ➜ ${where}`);
          this.popIn(b, 200);
          await this.sleep(260);
        }
      }
    }
    // J박스: 결선이 끝나면 양쪽 여유선을 J박스 쪽으로 당겨 둥글게 말아 넣음 (시험에서는 J박스 뚜껑 없음)
    await this.coilJunctionSlack(isAnimated, token);
    if (!this.alive(token)) return;

    // TB 단자대 바깥쪽 인출선 (TB1 전원 인입선, TB4 전극/리밋스위치선)
    await this.drawExternalLeads(isAnimated, token);
    if (!this.alive(token)) return;

    if (isAnimated) {
      await this.focusAll();
      this.updateGuideMessage("✅ <b>[6단계-3 결선 완료]</b><br>모든 다발을 <b>공통선 ➜ 단독선</b> 순서로 결선하고, TB1·TB4 바깥쪽 인출선(10cm 인출·끝 1cm 탈피)까지 준비했습니다. 1단자에는 최대 2선까지만!<br>다음은 <b>4. 박스 뚜껑 결합</b>입니다.");
      await this.sleep(400);
    }
  }

  /**
   * TB 단자대 바깥쪽 인출선: 약 10cm(100mm) 빼고 끝 1cm(10mm) 피복 탈피 (구리색)
   * - TB1(상단 가로, 하단 = 케이블 쪽) ➜ 윗면에서 위로 뺀 뒤 옆으로
   * - TB4(하단 가로, 윗면 = 배관 쪽) ➜ 아랫면에서 아래로 뺀 뒤 옆으로
   * - 가닥 구성은 문제 데이터 externalLeads (1~9번 E1·E2·E3 / 10~18번 리밋스위치 2가닥)
   */
  /** 외부 TB 단자대 상자·단자 위치 (5단계 그림과 같은 계산) */
  tbGeometry(bundle) {
    const pipe = this.s5.pipes[bundle.via[bundle.via.length - 1]];
    return tbBlockGeometry(bundle.device, pipe.points[pipe.points.length - 1]);
  }

  leadGeometry(tbId, k, n, w) {
    const LEAD = 100;     // 인출 길이 (mm)
    if (tbId === 'TB1') {
      // TB1 박스 845~955, 위 변 y=60. L1은 왼쪽, L3는 오른쪽으로
      const x = 845 + 110 * (k + 1) / (n + 1);
      const up = 8 + k * 5;   // 벽면 위쪽 여유가 좁아 조금만 올린 뒤 옆으로
      const dir = k < n / 2 ? -1 : 1;
      return { pin: [x, 60], pts: [[x, 60], [x, 60 - up], [x + dir * (LEAD - up), 60 - up]], dir: [dir, 0] };
    }
    // TB4 등 외부 단자대: 각 단자(E1·E2·E3) 바로 반대쪽 가장자리에서 빠져나옴
    // 길이는 단자 순서대로 15mm씩 길게 (E1 < E2 < E3)
    const g = this.tbGeometry(this.bundles.find(b => b.id === tbId));
    const slot = (w?.pin ?? k + 1) - 1;
    // E1 < E2 < E3처럼 길이 차이를 두는 인출선 (리밋스위치는 stagger: false ➜ 같은 길이)
    const step = this.problem.board.externalLeads?.[tbId]?.stagger === false ? 0 : LEAD_STEP;
    const len = LEAD + slot * step;
    const start = g.outerSlot(slot);
    const [ox, oy] = g.outward;
    // 바깥쪽으로 벽 끝까지 여유가 있으면 곧게, 없으면 조금 나간 뒤 단자 번호 방향으로 꺾음
    const room = ox > 0 ? 1800 - start[0] : ox < 0 ? start[0] : oy > 0 ? 1650 - start[1] : start[1];
    const maxLen = LEAD + (n - 1) * step;
    if (room - 15 >= maxLen) {
      const end = [start[0] + ox * len, start[1] + oy * len];
      return { pin: start, pts: [start, end], dir: [ox, oy] };
    }
    // 꺾는 경우: 먼저 꺾는 선(E3 쪽)이 짧게 나가고, E1이 가장 바깥으로 돌아 서로 교차하지 않게
    const out = 8 + (n - 1 - slot) * 6;
    const [ax, ay] = g.along;
    const bend = [start[0] + ox * out, start[1] + oy * out];
    const end = [bend[0] + ax * (len - out), bend[1] + ay * (len - out)];
    return { pin: start, pts: [start, bend, end], dir: [ax, ay] };
  }

  leadMarkup(tbId, w, k, n) {
    const style = WIRE[w.wire];
    const { pin, pts, dir } = this.leadGeometry(tbId, k, n, w);
    const end = pts[pts.length - 1];
    const strip = [end[0] - dir[0] * 10, end[1] - dir[1] * 10];   // 끝 1cm 탈피 시작점
    const insulated = [...pts.slice(0, -1), strip];
    const d = insulated.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    return `
      <g class="s6-lead" data-tb="${tbId}" data-label="${w.label}">
        <path d="${d}" fill="none" stroke="${style.outline}" stroke-width="3.6" opacity="0.6" stroke-linejoin="round" />
        <path d="${d}" fill="none" stroke="${style.color}" stroke-width="2.6" stroke-linejoin="round" />
        ${style.stripe ? `<path d="${d}" fill="none" stroke="${style.stripe}" stroke-width="2.6" stroke-dasharray="4 4" />` : ''}
        <!-- 끝 1cm 피복 탈피 (구리 심선) -->
        <path d="M ${strip[0]} ${strip[1]} L ${end[0]} ${end[1]}" stroke="#b45309" stroke-width="1.8" stroke-linecap="round" />
        <path d="M ${strip[0]} ${strip[1]} L ${end[0]} ${end[1]}" stroke="#fbbf24" stroke-width="0.7" stroke-linecap="round" />
        <circle cx="${pin[0]}" cy="${pin[1]}" r="2.6" fill="#d97706" stroke="#78350f" stroke-width="0.8" />
        <text x="${end[0] + dir[0] * 4}" y="${end[1] + (dir[1] ? dir[1] * 10 : 3)}" text-anchor="${dir[0] < 0 ? 'end' : dir[0] > 0 ? 'start' : 'middle'}" font-size="9" font-weight="900" fill="#f8fafc">${w.label}</text>
      </g>`;
  }

  async drawExternalLeads(isAnimated, token) {
    const leads = this.problem.board.externalLeads;
    if (!leads) return;
    const termLayer = this.layer('terminals-layer');
    for (const [tbId, spec] of Object.entries(leads)) {
      const n = spec.wires.length;
      if (isAnimated) {
        // 🎥 인출선을 빼는 단자대로
        const pts = spec.wires.flatMap((w, k) => this.leadGeometry(tbId, k, n, w).pts);
        const xs = pts.map(p => p[0]);
        const ys = pts.map(p => p[1]);
        await this.focusBox(Math.min(...xs) - 60, Math.min(...ys) - 40, Math.max(...xs) + 60, Math.max(...ys) + 40, 60, 440);
        if (!this.alive(token)) return;
        this.updateGuideMessage(`✂️ <b>[6단계-3: ${tbId} 바깥쪽 인출선]</b><br><b>${spec.title}</b> ${n}가닥(${spec.wires.map(w => w.label).join('·')})을 단자대 바깥쪽으로 <b>약 10cm 빼고</b>, 끝을 <b>1cm 피복 탈피</b>합니다.${tbId === 'TB4' && spec.stagger !== false ? `<br>각 단자(${spec.wires.map(w => w.label).join('·')})에서 바로 빼고, 길이는 <b>${spec.wires.map(w => w.label).join(' &lt; ')}</b> 순서로 <b>약 1.5cm씩</b> 길게!<br><span style="color:#94a3b8;">※ 1~9번 과제는 E1·E2·E3 황색 3가닥, 10~18번 과제는 리밋스위치 2가닥</span>` : ''}`);
      }
      for (let k = 0; k < n; k++) {
        const [el] = this.appendSvg(termLayer, this.leadMarkup(tbId, spec.wires[k], k, n));
        if (isAnimated) {
          await Promise.all([...el.querySelectorAll('path')].slice(0, 2).map(p => this.drawStroke(p, 120)));
          if (!this.alive(token)) return;
        }
      }
      // 안내 뱃지
      const leadText = tbId === 'TB1'
        ? `✋ ${spec.wires.map(w => w.label).join('·')} 10cm 인출 · 끝 1cm 탈피`
        : spec.stagger === false
          ? `✋ ${spec.wires.map(w => w.label).join('·')} 10cm 인출 · 끝 1cm 탈피`
          : `✋ ${spec.wires.map(w => w.label).join(' &lt; ')} (1.5cm씩 길게) · 끝 1cm 탈피`;
      let badge;
      if (tbId === 'TB1') badge = { x: 600, y: 37, w: 175, text: leadText };
      else {
        // 인출선 끝 오른쪽에 자리가 있으면 그 옆, 없으면 인출선 묶음 아래 (단자대·인출선과 겹치지 않게)
        const all = spec.wires.flatMap((w, k) => this.leadGeometry(tbId, k, n, w).pts);
        const xs = all.map(p => p[0]);
        const ys = all.map(p => p[1]);
        const bw = 225;
        const labelGap = 30;   // 끝 이름(E1·E2·E3) 글자 자리
        badge = Math.max(...xs) + labelGap + bw <= 1790
          ? { x: Math.max(...xs) + labelGap, y: (Math.min(...ys) + Math.max(...ys)) / 2 - 10, w: bw, text: leadText }
          : { x: Math.min(...xs), y: Math.max(...ys) + 18, w: bw, text: leadText };
      }
      const [b] = this.appendSvg(termLayer, `
        <g class="s6-lead-badge" transform="translate(${badge.x}, ${badge.y})">
          <rect width="${badge.w}" height="20" rx="6" fill="#0f172a" stroke="#fbbf24" stroke-width="1.2" opacity="0.95" />
          <text x="8" y="14" font-size="10" font-weight="900" fill="#fde68a">${badge.text}</text>
        </g>`);
      if (isAnimated) {
        this.popIn(b, 200);
        await this.sleep(700);
        if (!this.alive(token)) return;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // [4] 박스 뚜껑 결합 (시공 표준 11): 네 모서리 나사
  // ---------------------------------------------------------------------------
  async runStep4(isAnimated = true, token = null) {
    token = this.beginRun(token);
    if (this.currentStep < 3) await this.runStep3(false, token);
    this.currentStep = 4;
    const coverLayer = this.layer('covers-layer');
    coverLayer.innerHTML = '';

    this.updateGuideMessage("📦 <b>[6단계-4: 박스 뚜껑 결합]</b><br>2구 박스 4개에 뚜껑을 덮고 <b>네 모서리 나사</b>를 조입니다.<br>💡 <b>J박스(8각 박스)는 시험에서 뚜껑이 없어서</b> 말아 넣은 선이 보이는 그대로 둡니다.");
    if (isAnimated) await this.sleep(500);

    const covers = [
      // 뚜껑 앞면으로 버튼·셀렉터·램프·부저가 드러난 실제 완성 모습 (네 모서리 나사)
      ...this.boxCovers.map(b => `<g class="s6-cover" transform="translate(${b.x}, ${b.y})">${boxCover(b.top ? b : b.name)}</g>`)
      // J박스(8각 박스)는 시험에서 뚜껑 없음 ➜ 말아 넣은 선이 보이게 그대로
    ];
    for (const markup of covers) {
      const [el] = this.appendSvg(coverLayer, markup);
      if (isAnimated) {
        el.style.opacity = '0';
        await this.focusElement(el);   // 🎥 뚜껑을 덮는 박스로
        if (!this.alive(token)) return;
        el.style.opacity = '';
        this.popIn(el, 260);
        await this.sleep(450);
        if (!this.alive(token)) return;
      }
    }
    if (isAnimated) await this.focusAll();

    // 가조립 뱃지 정리
    this.layer('badges-layer').querySelectorAll('.s6-badge').forEach(el => el.remove());

    this.updateGuideMessage("🎉 <b>[6단계 입선·결선 완료!]</b><br>외부단자 가조립 ➜ <b>먼 쪽부터 입선</b> ➜ <b>공통선 먼저 결선</b> ➜ 박스 뚜껑 결합까지 끝났습니다!<br>이제 <b>7단계: 전원 투입 & 동작 테스트</b>에서 회로를 확인할 차례입니다.");
  }

  async playAll() {
    // 진행 중이어도 처음부터 다시 (clearAll이 이전 시연을 멈춤 — 장면 이동·이전에서 다시 돌릴 때 필요)
    this.clearAll();
    this.isPlaying = true;
    const token = this.runToken;
    for (const step of [this.runStep1, this.runStep2, this.runStep3, this.runStep4]) {
      await step.call(this, true, token);
      if (!this.alive(token)) return;
    }
    this.isPlaying = false;
  }

  clearAll() {
    this.runToken++;
    this.isPlaying = false;
    this.currentStep = 0;
    ['wires-layer', 'slack-layer', 'terminals-layer', 'covers-layer', 'badges-layer'].forEach(n => {
      const l = this.layer(n);
      if (l) l.innerHTML = '';
    });
  }

  updateGuideMessage(html) {
    this.s5.updateGuideMessage(html);
  }

  setSpeed(val) {
    this.speed = val;
  }
}
