/**
 * Stage 5: 배관 제도 및 기구/새들 마킹 & 고정 시뮬레이터 (Piping Drafting & Marking Engine)
 * - 가로 1800mm x 세로 1650mm 실기 시험장 벽면 합판 작업대 (배관 좌표는 공식 배관도 치수 1:1)
 * - 학원 실전 합격 12단계 시공 표준 중 1~7단계 + 12단계(③ 케이블) 시뮬레이션:
 *   1. 메인 배전반 벽면 4x24 나사 4개 고정 (작업자 가슴 높이) — 4단계에서 완성한 실제 배전반 그대로 표시
 *   2. 제어함 상하단 기준 수평선 2줄 긋기 (단자박스 설치 높이) 및 배관선(치수선) 먹줄 제도 — 한 줄씩 순서대로
 *   3. 외부단자 및 새들 위치 마킹 (컨트롤박스 커버 140mm 대기법) — 배관 순서·진행 방향대로 하나씩
 *   4. 외부기구 고정 (단자대 4개, J박스 1개, 2구 박스 본체 4개)
 *   5. 전체 새들 1차 고정 (배관 삽입 편의를 위해 바깥쪽 1개씩 우선 가고정) — 마킹 순서대로 하나씩
 *   6. 배관 커넥터 접속 (① PE관 6개 · ② CD관 7개, TB 단자대 쪽은 커넥터 ✕)
 *   7. 배관 설치 4단계 루틴 (커넥터 접속 ➜ 스프링 벤더(PE관 코너만) ➜ 새들 체결 ➜ 재단·반대편 커넥터) & ③ 메인전원 케이블 장착
 * - 레이어 id는 1단계 기판(board-svg)과 겹치지 않도록 모두 's5-' 접두어 사용
 */

import { ensureGlobalDeviceDefs, deviceFace, BOX_LAYOUTS } from '../components/control_devices.js';
import { tbBlockGeometry, DEFAULT_TB_BLOCKS } from '../components/tb_blocks.js';

const NS = 'http://www.w3.org/2000/svg';

// 1~4단계 배전반(board-svg)에서 5단계 벽면으로 복제해 올 레이어 (치수선·제도선·뱃지 등은 제외)
const BOARD_SNAPSHOT_LAYERS = [
  'plywood-board',
  'components-layer',
  'masking-tape-layer',
  'terminal-markings-layer',
  'main-circuit-wire-layer',
  'aux-circuit-wire-layer'
];

// 컨트롤박스 뚜껑 커버 길이 (새들 마킹 대기법 기준, mm)
const COVER_LEN = 140;
// 이 길이 이하 구간은 새들 1개만 (코너에서 커버 길이만큼 뺀 지점)
const SHORT_RUN = 300;

// 도면 관 종류 기호 (공식 배관도 범례): ① PE 전선관, ② 플렉시블 전선관(CD), ③ 케이블
// 배전반 쪽 커넥터가 배전반 위로 걸쳐 올라오는 길이 (mm)
const PANEL_OVERLAP = 3;

const PIPE_KIND = {
  PE: { code: '①', num: 1, label: 'PE관', color: '#111827', tagFill: '#cbd5e1', badge: { fill: '#111827', text: '#ffffff', stroke: '#e5e7eb' } },   // 검정 PE관
  CD: { code: '②', num: 2, label: 'CD관', color: '#f8fafc', tagFill: '#ffffff', badge: { fill: '#ffffff', text: '#111827', stroke: '#111827' } },   // 흰색 주름관(CD관)
  CABLE: { code: '③', num: 3, badge: { fill: '#10b981', text: '#ffffff', stroke: '#064e3b' }, label: '케이블', color: '#10b981', tagFill: '#4ade80' }
};

/*
 * 실전 배관선 9개 — 공식 배관도(치수 기준점 = 제어함 중심 900, 800) 1:1
 * - 상단: 가로 배관선은 제어함 윗변(590)에서 400 위(Y=190), 출구 X = 150(PB) · 450(J/SS) · 800 · 900(③) · 1000 · 1400(RL)
 *         ③ 케이블은 가로선보다 50 위(Y=140)에서 마감, TB1은 다시 50 위(하단 Y=90) → TB1이 가장 높음
 * - 하단: 출구 X = 제어함 왼쪽+50(750, YL/BZ) · 850(TB3) · 950(TB4) · 1050(TB2)
 *         YL/BZ·TB2 가로선은 제어함 아랫변(1010)에서 400 아래(Y=1410), TB3·TB4 선은 그보다 100 아래(Y=1510)
 *         TB 단자대는 배관 끝에서 50 여유 (TB3 X=300, TB4 Y=1560, TB2 X=1500)
 * - 먹줄을 긋는 순서 = 배열 순서, 각 배관은 points 순서 방향(제어함/J박스 ➜ 바깥)으로 긋는다
 */
const PIPES = [
  { kind: 'CD', name: '제어함 ➜ J박스', tag: { x: 665, y: 152 },
    points: [[800, 590], [800, 190], [450, 190]] },
  { kind: 'CD', name: 'J박스 ➜ PB1/PB0', tag: { x: 175, y: 400 },
    points: [[450, 190], [150, 190], [150, 590]] },
  { kind: 'PE', name: 'J박스 ➜ SS/CAP', tag: { x: 450, y: 400 },
    points: [[450, 190], [450, 590]] },
  { kind: 'CABLE', name: 'TB1(전원)', tag: { x: 900, y: 400 },
    points: [[900, 590], [900, 140]], clearance: 'TB1',
    // 메인전원 케이블은 소형 새들 2개가 별도로 지급됨 → 커버 대기법 대신 고정 위치
    fixedSaddles: [
      { fromEnd: false, dist: 100, label: '하부 새들 (배전반 윗변에서 100mm 위)' },
      { fromEnd: true, dist: 50, label: '상부 새들 (케이블 맨 위 끝에서 50mm 아래)' }
    ] },
  { kind: 'PE', name: 'RL/GL', tag: { x: 1400, y: 400 },
    points: [[1000, 590], [1000, 190], [1400, 190], [1400, 590]] },
  { kind: 'CD', name: 'YL/BZ', tag: { x: 550, y: 1375 },
    points: [[750, 1010], [750, 1410], [350, 1410], [350, 1010]] },
  { kind: 'PE', name: 'TB3(M2)', tag: { x: 600, y: 1545 },
    points: [[850, 1010], [850, 1510], [350, 1510]], clearance: 'TB3' },
  { kind: 'CD', name: 'TB4(수위)', tag: { x: 1020, y: 1250 },
    points: [[950, 1010], [950, 1510]], clearance: 'TB4' },
  { kind: 'PE', name: 'TB2(M1)', tag: { x: 1200, y: 1375 },
    points: [[1050, 1010], [1050, 1410], [1450, 1410]], clearance: 'TB2' }
];

// 1번 과제 기본 J박스 위치·2구 박스 (문제 데이터 board.wall이 있으면 그 값을 사용)
const DEFAULT_JUNCTION = [450, 190];
const DEFAULT_BOXES = [
  { name: 'PB1/PB0', x: 105, y: 590, titlePos: 'below' },
  { name: 'SS/CAP', x: 405, y: 590, titlePos: 'below' },
  { name: 'RL/GL', x: 1355, y: 590, titlePos: 'below' },
  { name: 'YL/BZ', x: 305, y: 870, titlePos: 'above' }
];

// 상단·하단·좌측 치수선 (도면 치수 그대로 표기)
const DIMENSIONS = {
  top: { y: 32, ticks: [150, 450, 800, 900, 1000, 1400] },                    // 300 · 350 · 100 · 100 · 400
  bottom: { y: 1626, ticks: [350, 750, 850, 950, 1050, 1450] },      // 400 · 100 · 100 · 100 · 400 (TB4 인출선 아래)
  left: { x: 45, ticks: [140, 190, 590, 1010, 1410, 1510] }          // 50 · 400 · 420 · 400 · 100
};

// 제어함 가장자리 ➜ 배관 출구 치수 (공식 배관도: 상단 왼쪽 100, 하단 왼쪽 50 · 오른쪽 50)
const BOX_EDGE_DIMS = [
  { y: 570, edgeY: 590, from: 700, to: 800, below: false },    // 상단: 제어함 왼쪽 끝 ➜ ② CD관 출구
  { y: 1080, edgeY: 1010, from: 700, to: 750, below: true },   // 하단: 제어함 왼쪽 끝 ➜ YL/BZ 출구
  { y: 1080, edgeY: 1010, from: 1050, to: 1100, below: true }  // 하단: TB2 출구 ➜ 제어함 오른쪽 끝
];

// TB 단자대 끝단 50mm 배관 마감 여유 표식 (배관 끝 기준, 해당 배관 먹줄을 그은 직후 표시)
// - 배관 끝 방향(위·아래·왼쪽·오른쪽)과 단자대 이름은 과제 데이터(배관 points·clearance)에서
function clearanceMarkup(id, pipe) {
  const pts = pipe.points;
  const [ex, ey] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 2];
  const dx = Math.sign(ex - px);
  const dy = Math.sign(ey - py);
  const text = `📏 ${id} 끝 50mm 배관 마감 여유`;
  const tag = (x, y) => `
      <rect x="${x}" y="${y}" width="185" height="26" fill="#7c2d12" stroke="#f97316" stroke-width="1.5" rx="4" />
      <text x="${x + 8}" y="${y + 17}" font-size="11" font-weight="900" fill="#fef08a">${text}</text>`;
  if (dy !== 0) {
    // 세로로 끝나는 배관 (TB1 위쪽 / TB4·TB3 아래쪽 가로 단자대)
    const s = dy;   // -1 = 위로 끝남, 1 = 아래로 끝남
    return `
    <g transform="translate(${ex}, ${ey})">
      <line x1="-30" y1="0" x2="30" y2="0" stroke="#f97316" stroke-width="3.5" stroke-dasharray="5,4" />
      <line x1="35" y1="0" x2="35" y2="${50 * s}" stroke="#fef08a" stroke-width="1.8" />
      <polygon points="35,0 32,${8 * s} 38,${8 * s}" fill="#fef08a" />
      <polygon points="35,${50 * s} 32,${42 * s} 38,${42 * s}" fill="#fef08a" />
      ${tag(70, s < 0 ? -38 : 12)}
      <line x1="0" y1="0" x2="0" y2="${50 * s}" stroke="${pipe.color}" stroke-width="3" stroke-dasharray="3,3" />
    </g>`;
  }
  // 가로로 끝나는 배관 (왼쪽·오른쪽 세로 단자대)
  const s2 = dx;   // -1 = 왼쪽으로 끝남, 1 = 오른쪽으로 끝남
  return `
    <g transform="translate(${ex}, ${ey})">
      <line x1="0" y1="-25" x2="0" y2="25" stroke="#f97316" stroke-width="3.5" stroke-dasharray="5,4" />
      <line x1="0" y1="30" x2="${50 * s2}" y2="30" stroke="#fef08a" stroke-width="1.8" />
      <polygon points="0,30 ${8 * s2},27 ${8 * s2},33" fill="#fef08a" />
      <polygon points="${50 * s2},30 ${42 * s2},27 ${42 * s2},33" fill="#fef08a" />
      ${tag(s2 < 0 ? -45 : -135, -62)}
      <line x1="0" y1="0" x2="${50 * s2}" y2="0" stroke="${pipe.color}" stroke-width="3" stroke-dasharray="3,3" />
    </g>`;
}

export class Stage5PipingDraft {
  constructor(container, problemData) {
    this.container = container;
    this.problem = problemData;
    this.speed = 1.0;
    this.isPlaying = false;
    this.currentStep = 0;
    this.runToken = 0; // 진행 중인 애니메이션 취소용 토큰

    // 작업대 규격 (mm)
    this.WALL = {
      WIDTH: 1800,
      HEIGHT: 1650,   // 하단 TB4(Y=1560~1590)와 하단 치수선 자리 확보
      // 제어함 (400 x 420mm) 중심 좌표
      BOX_CX: 900,
      BOX_CY: 800,
      BOX_W: 400,
      BOX_H: 420,
      BOX_TOP: 590,    // 800 - 210 = 590
      BOX_BOT: 1010,   // 800 + 210 = 1010
      BOX_LEFT: 700,   // 900 - 200 = 700
      BOX_RIGHT: 1100  // 900 + 200 = 1100
    };

    // 배관 데이터에 도면 관 종류(①PE ②CD ③케이블) 기호·색상을 붙여 정규화
    // 과제별 벽면 데이터 (배관·치수·J박스·2구 박스)
    const wall = problemData.board.wall || {};
    this.junction = wall.junction || DEFAULT_JUNCTION;
    this.boxes = wall.boxes || DEFAULT_BOXES;
    // 외부 TB 단자대(TB2·TB3·TB4): 위치·이름은 과제 데이터(입선 다발의 device), 없으면 1번 기본값
    this.tbBlocks = (wall.bundles || []).filter(b => b.device?.type === 'tbBlock').map(b => ({
      id: b.id,
      title: /\(([^)]+)\)/.exec(b.name)?.[1]?.replace(/전동기 /, '모터 ').replace(/수위 /, '').replace(/·/g, ' ') || b.id,
      device: b.device
    }));
    if (!this.tbBlocks.length) this.tbBlocks = DEFAULT_TB_BLOCKS;
    this.dimensions = wall.dimensions || DIMENSIONS;
    this.edgeDims = wall.edgeDims || BOX_EDGE_DIMS;
    this.pipes = (wall.pipes || PIPES).map(p => {
      const kind = PIPE_KIND[p.kind];
      const name = `${kind.label}: ${p.name}`;
      return { ...p, no: kind.code, name, color: kind.color, tagFill: kind.tagFill,
        badge: kind.badge, num: kind.num,
        tag: { ...p.tag, w: Math.max(120, name.length * 11 + 34) } };
    });
    this.saddleOrder = this.buildSaddles();
    this.view = { x: 0, y: 0, w: this.WALL.WIDTH, h: this.WALL.HEIGHT }; // 현재 보이는 벽면 영역 (viewBox)
    this.follow = true;  // 🎥 따라가며 보기: 시연 중 작업 부분으로 확대·이동
    this.init();
  }

  init() {
    this.renderWallSvg();
    this.bindZoomPan();
  }

  // ---------------------------------------------------------------------------
  // 확대·이동 (viewBox 조절 → 확대해도 벡터 선이 선명)
  // ---------------------------------------------------------------------------

  get zoomLevel() {
    return this.WALL.WIDTH / this.view.w;
  }

  applyView() {
    const W = this.WALL;
    const v = this.view;
    v.w = Math.min(W.WIDTH, Math.max(W.WIDTH / 6, v.w));
    v.h = v.w * (W.HEIGHT / W.WIDTH);
    v.x = Math.min(W.WIDTH - v.w, Math.max(0, v.x));
    v.y = Math.min(W.HEIGHT - v.h, Math.max(0, v.y));
    this.svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
    this.svg.style.cursor = this.zoomLevel > 1.001 ? 'grab' : 'default';
    const label = document.getElementById('zoom-level-label');
    if (label) label.textContent = `${Math.round(this.zoomLevel * 100)}%`;
  }

  /** factor > 1 이면 확대. (cx, cy): 고정할 벽면 좌표(기본: 화면 중앙) */
  zoomBy(factor, cx = null, cy = null) {
    const v = this.view;
    const fx = cx === null ? v.x + v.w / 2 : cx;
    const fy = cy === null ? v.y + v.h / 2 : cy;
    const newW = Math.min(this.WALL.WIDTH, Math.max(this.WALL.WIDTH / 6, v.w / factor));
    const ratio = newW / v.w;
    v.x = fx - (fx - v.x) * ratio;
    v.y = fy - (fy - v.y) * ratio;
    v.w = newW;
    this.applyView();
  }

  /**
   * 🎥 카메라: 보이는 영역(viewBox)을 목표로 부드럽게 이동 (따라가며 보기가 꺼져 있으면 그대로)
   * target = { x, y, w } (벽면 mm, 높이는 벽면 비율로 자동)
   */
  cameraTo(target, ms = 650) {
    if (!this.follow) return Promise.resolve();
    const W = this.WALL;
    const from = { ...this.view };
    const w = Math.min(W.WIDTH, Math.max(W.WIDTH / 6, target.w));
    const h = w * (W.HEIGHT / W.WIDTH);
    const to = {
      x: Math.min(W.WIDTH - w, Math.max(0, target.x)),
      y: Math.min(W.HEIGHT - h, Math.max(0, target.y)),
      w, h
    };
    const duration = ms / this.speed;
    return new Promise(resolve => {
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   // 부드럽게 출발·도착
        this.view = {
          x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e,
          w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e
        };
        this.applyView();
        if (t < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  /** 벽면 사각 영역(mm)이 화면에 꽉 차도록 확대 (여유 pad, 너무 크게 확대하지 않도록 최소 폭 minW) */
  focusBox(x0, y0, x1, y1, pad = 110, minW = 520) {
    const W = this.WALL;
    const w = Math.max(minW, x1 - x0 + pad * 2, (y1 - y0 + pad * 2) * (W.WIDTH / W.HEIGHT));
    const h = w * (W.HEIGHT / W.WIDTH);
    return this.cameraTo({ x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w });
  }

  focusPipe(pipe) {
    const xs = pipe.points.map(p => p[0]);
    const ys = pipe.points.map(p => p[1]);
    return this.focusBox(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
  }

  focusElement(el) {
    const r = el.getBoundingClientRect();
    const [x0, y0] = this.toWall(r.left, r.top);
    const [x1, y1] = this.toWall(r.right, r.bottom);
    return this.focusBox(x0, y0, x1, y1, 150, 480);
  }

  focusAll() {
    return this.cameraTo({ x: 0, y: 0, w: this.WALL.WIDTH });
  }

  resetZoom() {
    this.view = { x: 0, y: 0, w: this.WALL.WIDTH, h: this.WALL.HEIGHT };
    this.applyView();
  }

  /** 화면 좌표 ➜ 벽면(mm) 좌표 */
  toWall(clientX, clientY) {
    const ctm = this.svg.getScreenCTM();
    if (!ctm) return [this.view.x + this.view.w / 2, this.view.y + this.view.h / 2];
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return [pt.x, pt.y];
  }

  bindZoomPan() {
    const svg = this.svg;
    // 마우스 휠: 커서 위치를 중심으로 확대·축소
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const [cx, cy] = this.toWall(e.clientX, e.clientY);
      this.zoomBy(e.deltaY < 0 ? 1.2 : 1 / 1.2, cx, cy);
    }, { passive: false });

    // 드래그: 화면 이동
    let drag = null;
    svg.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      drag = { start: this.toWall(e.clientX, e.clientY) };
      svg.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!drag) return;
      const [x, y] = this.toWall(e.clientX, e.clientY);
      this.view.x -= x - drag.start[0];
      this.view.y -= y - drag.start[1];
      this.applyView();
    });
    window.addEventListener('mouseup', () => {
      if (!drag) return;
      drag = null;
      this.applyView();
    });

    // 더블클릭: 원래 크기
    svg.addEventListener('dblclick', () => this.resetZoom());
  }

  /**
   * 5단계 벽면 SVG 안의 레이어 찾기 (1단계 기판과 id가 겹치지 않도록 s5- 접두어 + 자기 SVG 안에서만 검색)
   */
  layer(name) {
    return this.svg ? this.svg.querySelector(`#s5-${name}`) : null;
  }

  /**
   * 1800x1600mm 실기 벽면 합판 SVG 렌더링
   */
  renderWallSvg() {
    ensureGlobalDeviceDefs();  // 컨트롤박스 기구 실물 표현용 공용 그라데이션
    this.container.innerHTML = '';
    const W = this.WALL;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('id', 'piping-wall-svg');
    svg.setAttribute('viewBox', `0 0 ${W.WIDTH} ${W.HEIGHT}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.filter = 'drop-shadow(0 15px 30px rgba(0,0,0,0.6))';
    svg.style.userSelect = 'none';

    // SVG Defs (그라데이션 및 패턴)
    svg.innerHTML = `
      <defs>
        <!-- 나무 합판 배경 그라데이션 -->
        <linearGradient id="s5-plywood-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b48a58" />
          <stop offset="50%" stop-color="#a67c48" />
          <stop offset="100%" stop-color="#936838" />
        </linearGradient>
        <!-- 먹줄 분필 필터 -->
        <filter id="s5-chalk-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#38bdf8" flood-opacity="0.8" />
        </filter>
        <!-- 흰 분필 질감: 가장자리를 살짝 거칠게 + 나무 바탕에서 잘 보이도록 옅은 그림자 -->
        <filter id="s5-chalk" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feDropShadow in="rough" dx="0.6" dy="0.8" stdDeviation="0.6" flood-color="#1c1917" flood-opacity="0.45" />
        </filter>
        <filter id="s5-saddle-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#f59e0b" flood-opacity="0.9" />
        </filter>
      </defs>

      <!-- 1. 합판 벽면 베이스 (1800 x 1600mm) -->
      <g id="s5-wall-base-layer">
        <rect x="0" y="0" width="${W.WIDTH}" height="${W.HEIGHT}" fill="url(#s5-plywood-grad)" stroke="#5c3e1e" stroke-width="4" rx="6" />
        <!-- 합판 나무 결 라인들 -->
        <path d="M 0 400 L 1800 400 M 0 800 L 1800 800 M 0 1200 L 1800 1200 M 600 0 L 600 1600 M 1200 0 L 1200 1600" stroke="#785028" stroke-width="0.8" opacity="0.35" />
        <!-- 시험장 기준 안내 텍스트 -->
        <text x="1770" y="48" text-anchor="end" font-size="20" font-weight="900" fill="#fef08a" opacity="0.85">전기기능사 실기 작업벽면</text>
        <text x="1770" y="72" text-anchor="end" font-size="13" font-weight="700" fill="#f8fafc" opacity="0.65">1800 × 1650mm · 치수 기준점: 제어함 중심 (900, 800)</text>
      </g>

      <!-- 2. 먹줄/분필 제도선 레이어 (수평선, 배관선, 치수선) -->
      <g id="s5-drafting-lines-layer"></g>

      <!-- 3. 새들 마킹 레이어 -->
      <g id="s5-saddle-marks-layer"></g>

      <!-- 4. 제어함 (400x420) 레이어 -->
      <g id="s5-control-box-layer"></g>

      <!-- 5. 외부 기구 레이어 (단자대 4개, J박스 1개, 2구 박스 4개) -->
      <g id="s5-external-devices-layer"></g>

      <!-- 6. 실물 배관·케이블 레이어 (7단계) -->
      <g id="s5-pipes-layer"></g>

      <!-- 7. 배관 커넥터 레이어 (6단계) -->
      <g id="s5-connectors-layer"></g>

      <!-- 8. 고정 새들 레이어 (배관 위를 감싸 고정) -->
      <g id="s5-saddles-layer"></g>

      <!-- 9. 배관 명칭 태그·치수선·50mm 마감 표식 (설치된 배관에 가려지지 않도록 배관 위) -->
      <g id="s5-labels-layer"></g>

      <!-- 10. 커버·스프링 벤더·커터 등 작업 도구 레이어 (최상단) -->
      <g id="s5-tool-layer"></g>
    `;

    this.container.appendChild(svg);
    this.svg = svg;

    // 초기 상태 제어함 아웃라인 살짝 힌트 표시
    this.renderInitialGuide();
  }

  /**
   * SVG 마크업 문자열을 레이어에 직접 주입 (브라우저 표준 SVGElement.innerHTML)
   */
  setSvgContent(layer, svgString) {
    if (!layer) return;
    layer.innerHTML = svgString;
  }

  /**
   * 마크업 조각을 레이어에 추가하고 추가된 요소 반환
   */
  appendSvg(layer, svgString) {
    const tmp = document.createElementNS(NS, 'g');
    tmp.innerHTML = svgString;
    const added = [...tmp.childNodes].filter(n => n.nodeType === 1);
    added.forEach(n => layer.appendChild(n));
    return added;
  }

  renderInitialGuide() {
    const W = this.WALL;
    this.setSvgContent(this.layer('control-box-layer'), `
      <!-- 제어함 임시 가이드 아웃라인 점선 -->
      <rect id="s5-control-box-ghost" x="${W.BOX_LEFT}" y="${W.BOX_TOP}" width="${W.BOX_W}" height="${W.BOX_H}" fill="rgba(30, 41, 59, 0.4)" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6,6" rx="4" />
      <text x="${W.BOX_CX}" y="${W.BOX_CY - 10}" text-anchor="middle" font-size="16" font-weight="900" fill="#e2e8f0" opacity="0.8">제어함 설치 위치 (400 × 420)</text>
      <text x="${W.BOX_CX}" y="${W.BOX_CY + 15}" text-anchor="middle" font-size="13" font-weight="700" fill="#38bdf8" opacity="0.9">높이: 작업자 가슴(어깨아래 젖꼭지 사이) 높이 맞춤</text>
    `);
  }

  // ---------------------------------------------------------------------------
  // 애니메이션 공통 유틸
  // ---------------------------------------------------------------------------

  /** 직접 버튼을 누른 경우 이전 애니메이션을 취소하고 새 토큰 발급 */
  beginRun(token) {
    if (token !== null) return token;
    this.isPlaying = false;
    return ++this.runToken;
  }

  alive(token) {
    return token === this.runToken;
  }

  async sleep(ms) {
    // 수업용 진행 조절: 한 단계씩 모드면 안내 문구가 바뀐 장면마다 여기서 멈춤
    if (this.presenter) await this.presenter.hold();
    return new Promise(r => setTimeout(r, ms / this.speed));
  }

  /** 경로를 시작점 ➜ 끝점 방향으로 그리는 애니메이션 (실선 전용) */
  async drawStroke(el, msPer100mm = 260) {
    let len = 0;
    try { len = el.getTotalLength(); } catch (e) { len = 0; }
    if (!len) return;
    const duration = Math.max(250, (len / 100) * msPer100mm) / this.speed;
    el.style.strokeDasharray = `${len} ${len}`;
    el.style.strokeDashoffset = `${len}`;
    const anim = el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration, easing: 'linear', fill: 'forwards' });
    await anim.finished.catch(() => {});
    anim.cancel();
    el.style.strokeDasharray = '';
    el.style.strokeDashoffset = '';
  }

  /** 점선 수평선을 왼쪽 ➜ 오른쪽으로 늘려 그리는 애니메이션 */
  async drawLineX(line, ms = 900) {
    const x1 = parseFloat(line.getAttribute('x1'));
    const x2 = parseFloat(line.getAttribute('x2'));
    const duration = ms / this.speed;
    const start = performance.now();
    await new Promise(resolve => {
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        line.setAttribute('x2', x1 + (x2 - x1) * t);
        if (t < 1) requestAnimationFrame(tick); else resolve();
      };
      line.setAttribute('x2', x1);
      requestAnimationFrame(tick);
    });
  }

  /**
   * 요소를 살짝 커지며 나타나게 함
   * - CSS transform 애니메이션은 SVG transform 속성(위치)을 덮어쓰므로, 자식을 감싼 안쪽 그룹에 적용
   */
  popIn(el, ms = 220) {
    const inner = document.createElementNS(NS, 'g');
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
    inner.style.transformBox = 'fill-box';
    inner.style.transformOrigin = 'center';
    inner.animate([{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: ms / this.speed, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
  }

  fadeIn(el, ms = 300) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms / this.speed });
  }

  pointsToD(points) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  }

  /**
   * 도면 치수선 마크업 (눈금 사이 거리를 자동 계산해 표기)
   */
  dimensionMarkup() {
    const style = 'stroke="#111827" stroke-width="1.8"';
    const text = 'fill="#111827" font-size="14" font-weight="900" text-anchor="middle"';
    let out = '<g class="s5-dimension-lines">';
    const { top, bottom, left } = this.dimensions;
    [top, bottom].forEach(({ y, ticks }, idx) => {
      out += `<line x1="${ticks[0]}" y1="${y}" x2="${ticks[ticks.length - 1]}" y2="${y}" ${style} />`;
      ticks.forEach(x => { out += `<line x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}" ${style} /><circle cx="${x}" cy="${y}" r="2.5" fill="#111827" />`; });
      for (let i = 0; i < ticks.length - 1; i++) {
        out += `<text x="${(ticks[i] + ticks[i + 1]) / 2}" y="${idx === 0 ? y - 8 : y + 19}" ${text}>${ticks[i + 1] - ticks[i]}</text>`;
      }
    });
    out += `<line x1="${left.x}" y1="${left.ticks[0]}" x2="${left.x}" y2="${left.ticks[left.ticks.length - 1]}" ${style} />`;
    left.ticks.forEach(y => { out += `<line x1="${left.x - 7}" y1="${y}" x2="${left.x + 7}" y2="${y}" ${style} /><circle cx="${left.x}" cy="${y}" r="2.5" fill="#111827" />`; });
    for (let i = 0; i < left.ticks.length - 1; i++) {
      const my = (left.ticks[i] + left.ticks[i + 1]) / 2;
      out += `<text x="${left.x - 12}" y="${my + 5}" ${text.replace('middle', 'end')}>${left.ticks[i + 1] - left.ticks[i]}</text>`;
    }
    // 제어함 가장자리 ➜ 배관 출구 치수 (도면 표기 그대로)
    this.edgeDims.forEach(({ y, edgeY, from, to, below }) => {
      const ty = below ? y + 17 : y - 6;
      out += `<line x1="${from}" y1="${y}" x2="${to}" y2="${y}" ${style} />`;
      // 연장선: 제어함 가장자리(또는 배관 출구)에서 치수선까지
      [from, to].forEach(x => { out += `<line x1="${x}" y1="${edgeY}" x2="${x}" y2="${y + (below ? 6 : -6)}" stroke="#111827" stroke-width="1" stroke-dasharray="3 2" />`; });
      [from, to].forEach(x => { out += `<line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}" ${style} />`; });
      out += `<rect x="${(from + to) / 2 - 16}" y="${ty - 13}" width="32" height="17" rx="3" fill="#fef3c7" opacity="0.9" />`;
      out += `<text x="${(from + to) / 2}" y="${ty}" ${text}>${Math.abs(to - from)}</text>`;
    });
    return out + '</g>';
  }

  /**
   * 배관 구간 i에서 '꺾이는 바깥쪽' 방향 [dx, dy]
   * - 코너가 있으면: 코너에서 이어지는 다른 구간이 향하는 방향의 반대쪽 (예: ㄱ자 꺾임의 바깥)
   * - 곧은 배관(코너 없음): 제어함 중심(900, 800)에서 먼 쪽
   */
  outwardOf(pts, i) {
    const [a, b] = [pts[i], pts[i + 1]];
    const unit = (from, to) => [Math.sign(to[0] - from[0]), Math.sign(to[1] - from[1])];
    if (i + 1 < pts.length - 1) {
      const t = unit(b, pts[i + 2]);
      return [-t[0], -t[1]];
    }
    if (i > 0) {
      const t = unit(a, pts[i - 1]);
      return [-t[0], -t[1]];
    }
    const W = this.WALL;
    return a[1] === b[1]
      ? [0, a[1] < W.BOX_CY ? -1 : 1]
      : [a[0] < W.BOX_CX ? -1 : 1, 0];
  }

  /**
   * 새들(정면도): 배관을 가로질러 덮는 금속 띠 + 배관 양옆 나사 구멍 2개
   * - 로컬 좌표: 배관 = x축 방향, 띠 = y축 방향 (rotate(angle)로 배관 방향에 맞춤)
   * - screwSide(+1/-1): 가고정 나사가 박히는 쪽 = 배관이 꺾이는 바깥쪽
   */
  screwSideOf(m) {
    // rotate(90)이면 로컬 +y ➜ 벽면 -x, rotate(0)이면 로컬 +y ➜ 벽면 +y
    return m.angle === 90 ? -m.outward[0] : m.outward[1];
  }

  saddleBracketMarkup(m) {
    const side = this.screwSideOf(m);
    return `
        <g class="saddle-bracket${m.small ? ' small' : ''}" data-pipe="${m.pipeIdx}" data-side="${side}" transform="translate(${m.x}, ${m.y}) rotate(${m.angle})${m.small ? ' scale(0.65)' : ''}">
          <!-- 배관을 가로질러 덮는 새들 띠 (가운데 볼록) -->
          <rect x="-4" y="-17" width="8" height="34" rx="2.5" fill="#cbd5e1" stroke="#334155" stroke-width="1.2" />
          <rect x="-4" y="-8" width="8" height="16" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="0.8" />
          <!-- 나사 구멍 2개 (배관 양옆) — 아직 안 박힌 구멍은 빈 동그라미 -->
          <circle cx="0" cy="-13" r="2.8" fill="none" stroke="#334155" stroke-width="1.1" />
          <circle cx="0" cy="13" r="2.8" fill="none" stroke="#334155" stroke-width="1.1" />
          <!-- 바깥쪽 나사 1개만 가체결 -->
          ${this.screwMarkup(side, 'half')}
        </g>`;
  }

  screwMarkup(side, kind) {
    const cy = side * 13;
    return `
          <g class="${kind === 'full' ? 's5-full-screw' : 's5-half-screw'}">
            <!-- 박힌 나사 = 검정 굵은 + (십자 나사 머리) -->
            <path d="M -4 ${cy} L 4 ${cy} M 0 ${cy - 4} L 0 ${cy + 4}" stroke="#0f172a" stroke-width="2.3" stroke-linecap="round" />
          </g>`;
  }

  /**
   * 배관 좌표로부터 새들 위치를 자동 계산 (먹줄을 긋는 방향 순서 그대로)
   * - 각 직선 구간의 양 끝(배관 끝 또는 코너)에서 커버 길이(140mm)만큼 들어간 지점에 1개씩
   * - 300mm 이하 구간은 1개만: 코너에서 커버 길이만큼 뺀 지점 (코너가 없으면 시작점 기준)
   * - ref: 커버(자)를 대는 기준점(배관 끝/코너), gap: 기준점에서 새들까지 거리 → 3단계 마킹 시연에 사용
   * - fixedSaddles가 있는 배관(③ 메인전원 케이블)은 지정 위치에 소형 새들(small)만 배치
   */
  buildSaddles() {
    const order = [];
    this.pipes.forEach((pipe, pipeIdx) => {
      const pts = pipe.points;
      let seq = 0;

      if (pipe.fixedSaddles) {
        // 직선 1구간 배관 전용: 시작점 또는 끝점에서 지정 거리
        const [a, b] = [pts[0], pts[pts.length - 1]];
        const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        const dir = [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
        pipe.fixedSaddles
          .map(f => ({ ...f, along: f.fromEnd ? len - f.dist : f.dist }))
          .sort((f1, f2) => f1.along - f2.along)
          .forEach(f => order.push({
            x: a[0] + dir[0] * f.along,
            y: a[1] + dir[1] * f.along,
            angle: a[1] === b[1] ? 0 : 90,
            outward: this.outwardOf(pts, 0),
            ref: f.fromEnd ? b : a,
            gap: f.dist,
            small: true,
            pipeIdx,
            label: f.label
          }));
        return;
      }

      for (let i = 0; i < pts.length - 1; i++) {
        const [a, b] = [pts[i], pts[i + 1]];
        const horizontal = a[1] === b[1];
        const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        const dir = [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
        const aIsCorner = i > 0;
        const bIsCorner = i + 1 < pts.length - 1;
        const outward = this.outwardOf(pts, i);

        // [기준점, 시작점으로부터의 거리] 목록
        let picks;
        if (len <= SHORT_RUN) {
          picks = (bIsCorner && !aIsCorner) ? [[b, len - COVER_LEN]] : [[a, COVER_LEN]];
        } else {
          picks = [[a, COVER_LEN], [b, len - COVER_LEN]];
        }

        picks.forEach(([ref, along]) => {
          seq++;
          order.push({
            x: a[0] + dir[0] * along,
            y: a[1] + dir[1] * along,
            angle: horizontal ? 0 : 90,
            outward,
            ref,
            gap: COVER_LEN,
            small: false,
            pipeIdx,
            label: `${seq}번째 새들 (${ref === a ? (aIsCorner ? '코너' : '배관 시작') : (bIsCorner ? '코너' : '배관 끝')}에서 140mm)`
          });
        });
      }
    });
    return order;
  }

  // ---------------------------------------------------------------------------
  // 배전반 스냅샷 (4단계에서 완성한 실제 배전반 그대로)
  // ---------------------------------------------------------------------------

  /**
   * 1~4단계 기판(board-svg)의 합판·기구·이름표·단자마킹·주회로·보조회로를 복제하여
   * 벽면의 제어함 위치(700, 590)에 1:1(mm) 축척으로 배치
   */
  buildBoardSnapshot() {
    const board = document.getElementById('board-svg');
    if (!board) return null;
    const W = this.WALL;

    const nested = document.createElementNS(NS, 'svg');
    nested.setAttribute('x', W.BOX_LEFT);
    nested.setAttribute('y', W.BOX_TOP);
    nested.setAttribute('width', W.BOX_W);
    nested.setAttribute('height', W.BOX_H);
    nested.setAttribute('viewBox', `0 0 ${W.BOX_W} ${W.BOX_H}`);
    nested.setAttribute('overflow', 'visible');

    const defs = board.querySelector('defs');
    if (defs) nested.appendChild(defs.cloneNode(true));
    BOARD_SNAPSHOT_LAYERS.forEach(id => {
      const src = board.querySelector(`#${id}`);
      if (src) nested.appendChild(src.cloneNode(true));
    });

    // id 충돌 방지: 복제본 id에 접두어를 붙이고 url(#id)·href 참조도 함께 변경
    const idMap = {};
    nested.querySelectorAll('[id]').forEach(el => {
      idMap[el.id] = `s5p-${el.id}`;
      el.id = idMap[el.id];
    });
    nested.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        if (attr.value.includes('url(#') || (/href$/.test(attr.name) && attr.value.startsWith('#'))) {
          attr.value = attr.value.replace(/#([\w-]+)/g, (m, id) => (idMap[id] ? `#${idMap[id]}` : m));
        }
      });
      // 그리기 도중 상태(대시 오프셋)·숨김·필터 상태로 남은 인라인 스타일 정리 → 완성 상태로 표시
      const st = el.style;
      if (st) {
        if (st.strokeDashoffset && parseFloat(st.strokeDashoffset) !== 0) {
          st.strokeDasharray = '';
          st.strokeDashoffset = '';
        }
        st.transition = '';
        st.display = '';
        if (st.opacity !== '' && parseFloat(st.opacity) < 1) st.opacity = '';
      }
    });

    return nested;
  }

  /**
   * [1단계] 메인 배전반(제어함) 4x24 긴 나사 4개로 벽면 고정
   */
  async runStep1(isAnimated = true, token = null) {
    token = this.beginRun(token);
    this.currentStep = 1;
    const W = this.WALL;
    const boxLayer = this.layer('control-box-layer');
    if (!boxLayer) return;

    this.updateGuideMessage("🔩 <b>[1단계: 배전반 벽면 고정]</b><br>4단계까지 완성한 배전반을 4×24 긴 나사 4개로 벽면에 고정합니다.<br>💡 <b>합격 꿀팁</b>: 배전반 상단이 작업자 가슴(어깨아래 젖꼭지 사이) 높이에 오도록 맞추어 상단 단자박스 작업 공간을 여유 있게 확보합니다.");

    boxLayer.innerHTML = '';
    const mount = document.createElementNS(NS, 'g');
    mount.setAttribute('id', 's5-mounted-control-box');

    // 배전반 판재 두께 그림자
    this.appendSvg(mount, `
      <rect x="${W.BOX_LEFT + 4}" y="${W.BOX_TOP + 6}" width="${W.BOX_W}" height="${W.BOX_H}" fill="#3b2a17" opacity="0.55" rx="4" />
    `);

    const snapshot = this.buildBoardSnapshot();
    if (snapshot) {
      mount.appendChild(snapshot);
    } else {
      // 기판이 아직 없으면 단순 판재로 대체
      this.appendSvg(mount, `
        <rect x="${W.BOX_LEFT}" y="${W.BOX_TOP}" width="${W.BOX_W}" height="${W.BOX_H}" fill="#cbb389" stroke="#78350f" stroke-width="4" rx="4" />
        <text x="${W.BOX_CX}" y="${W.BOX_CY}" text-anchor="middle" font-size="14" font-weight="900" fill="#78350f">제어함 (400 × 420)</text>
      `);
    }

    // 4×24 긴 나사 4개 고정 피스 (모서리 체결)
    const screwPos = [
      [W.BOX_LEFT + 10, W.BOX_TOP + 10], [W.BOX_RIGHT - 10, W.BOX_TOP + 10],
      [W.BOX_LEFT + 10, W.BOX_BOT - 10], [W.BOX_RIGHT - 10, W.BOX_BOT - 10]
    ];
    boxLayer.appendChild(mount);
    if (isAnimated) this.fadeIn(mount, 400);

    for (const [sx, sy] of screwPos) {
      if (isAnimated) {
        await this.sleep(220);
        if (!this.alive(token)) return;
      }
      const [screw] = this.appendSvg(boxLayer, `
        <g class="mounting-screw" transform="translate(${sx}, ${sy})">
          <circle r="6" fill="#94a3b8" stroke="#0f172a" stroke-width="1.5" />
          <path d="M -3 -3 L 3 3 M -3 3 L 3 -3" stroke="#0f172a" stroke-width="1.5" />
        </g>
      `);
      if (isAnimated) this.popIn(screw);
    }

    if (isAnimated) await this.sleep(300);
  }

  /**
   * 배관 길 잡기 (기준 수평선 다음, 배관 중심선 전)
   * ① 배전반 윗변·아랫변에 배관 출구 위치 마킹 (배전반 가장자리 기준 치수 사슬: 예 100·100·100·100 / 50·100·100·100·50)
   * ② 마킹한 곳에서 위·아래로 도면 치수만큼 세로선 (예 400 · 500)
   * ③ 세로선 끝 높이에서 가로로 수평선 ➜ 이 선을 따라 배관이 지나감
   */
  async draftPipeGuides(lineLayer, labelLayer, isAnimated, token) {
    const W = this.WALL;
    const exits = { top: [], bot: [] };
    this.pipes.forEach(pipe => {
      const [a, b] = pipe.points;
      const side = a[1] === W.BOX_TOP ? 'top' : (a[1] === W.BOX_BOT ? 'bot' : null);
      if (!side || a[0] < W.BOX_LEFT || a[0] > W.BOX_RIGHT || b[0] !== a[0]) return;
      exits[side].push({ x: a[0], y0: a[1], y1: b[1], corner: pipe.points.length > 2 && pipe.kind !== 'CABLE' });
    });
    const guide = this.appendSvg(lineLayer, `<g id="s5-pipe-guides" fill="none" stroke-linecap="round"></g>`)[0];
    const marks = this.appendSvg(labelLayer, `<g id="s5-exit-marks" font-family="sans-serif" font-weight="900" text-anchor="middle"></g>`)[0];
    const temp = this.appendSvg(labelLayer, `<g id="s5-guide-lengths" font-family="sans-serif" font-weight="900"></g>`)[0];
    const say = (html) => { if (isAnimated) this.updateGuideMessage(`📐 <b>[2단계: 배관 길 잡기]</b><br>${html}`); };
    const wait = async (ms) => { if (isAnimated) await this.sleep(ms); return this.alive(token); };

    for (const side of ['top', 'bot']) {
      const list = [...new Map(exits[side].map(e => [e.x, e])).values()].sort((p, q) => p.x - q.x);
      if (!list.length) continue;
      const ey = side === 'top' ? W.BOX_TOP : W.BOX_BOT;
      const dir = side === 'top' ? -1 : 1;
      const edgeName = side === 'top' ? '윗변' : '아랫변';
      const xs = [W.BOX_LEFT, ...list.map(e => e.x), W.BOX_RIGHT];
      const chain = xs.slice(1).map((x, i) => x - xs[i]);
      if (isAnimated) {
        await this.focusBox(W.BOX_LEFT - 120, ey - 140, W.BOX_RIGHT + 120, ey + 140, 20, 460);
        if (!this.alive(token)) return;
      }

      // ① 출구 마킹 + 치수 사슬 (배전반 가장자리 기준)
      say(`① 배전반 <b>${edgeName}</b>에 배관이 나갈 자리를 표시합니다. 배전반 가장자리부터 <b>${chain.join(' · ')}</b> mm`);
      const ty = ey + dir * 22;   // 치수 글씨: 배전반 바깥쪽
      for (let i = 0; i < xs.length - 1; i++) {
        const [x1, x2] = [xs[i], xs[i + 1]];
        const [seg] = this.appendSvg(marks, `
          <g>
            <line x1="${x1}" y1="${ey + dir * 10}" x2="${x2}" y2="${ey + dir * 10}" stroke="#111827" stroke-width="1.5" />
            <line x1="${x1}" y1="${ey + dir * 4}" x2="${x1}" y2="${ey + dir * 16}" stroke="#111827" stroke-width="1.5" />
            <line x1="${x2}" y1="${ey + dir * 4}" x2="${x2}" y2="${ey + dir * 16}" stroke="#111827" stroke-width="1.5" />
            <text x="${(x1 + x2) / 2}" y="${ty + (side === 'top' ? 0 : 8)}" font-size="13" fill="#111827" paint-order="stroke" stroke="#fef3c7" stroke-width="3">${x2 - x1}</text>
          </g>`);
        if (isAnimated) { this.fadeIn(seg, 160); if (!await wait(180)) return; }
      }
      for (const e of list) {
        const [m] = this.appendSvg(marks, `
          <g filter="url(#s5-chalk)" stroke="#f8fafc" stroke-width="4" stroke-linecap="round">
            <line x1="${e.x - 9}" y1="${ey}" x2="${e.x + 9}" y2="${ey}" />
            <line x1="${e.x}" y1="${ey - 9}" x2="${e.x}" y2="${ey + 9}" />
          </g>`);
        if (isAnimated) { this.popIn(m, 180); if (!await wait(220)) return; }
      }
      if (!await wait(500)) return;

      // ② 마킹한 곳에서 위·아래로 세로선
      const span = list.reduce((s, e) => [Math.min(s[0], e.y1), Math.max(s[1], e.y1)], [ey, ey]);
      if (isAnimated) {
        await this.focusBox(W.BOX_LEFT - 200, span[0] - 60, W.BOX_RIGHT + 200, span[1] + 60, 20, 460);
        if (!this.alive(token)) return;
      }
      const lens = [...new Set(list.map(e => Math.abs(e.y1 - ey)))].join(' · ');
      say(`② 표시한 자리에서 ${side === 'top' ? '위쪽' : '아래쪽'}으로 도면 치수만큼 <b>세로선</b>을 긋습니다. (<b>${lens}</b> mm)`);
      for (const e of list) {
        const len = Math.abs(e.y1 - e.y0);
        const [v] = this.appendSvg(guide, `<line x1="${e.x}" y1="${e.y0}" x2="${e.x}" y2="${e.y1}" stroke="#fef9c3" stroke-width="2.5" stroke-dasharray="12,6" opacity="0.95" />`);
        const [t] = this.appendSvg(temp, `<text x="${e.x + 8}" y="${(e.y0 + e.y1) / 2 + 5}" font-size="14" fill="#111827" paint-order="stroke" stroke="#fef3c7" stroke-width="3">${len}</text>`);
        if (isAnimated) {
          v.style.strokeDasharray = 'none';
          await this.drawStroke(v, 120);
          v.style.strokeDasharray = '';
          this.fadeIn(t, 160);
          if (!await wait(150)) return;
        }
      }

      // ③ 세로선 끝 높이에서 수평선 (배관이 꺾여 지나가는 높이)
      const ys = [...new Set(list.filter(e => e.corner).map(e => e.y1))];
      if (ys.length) {
        say(`③ 세로선 끝에서 <b>수평선</b>을 긋습니다. 이 선을 따라 배관이 옆으로 지나갑니다. (배전반 ${edgeName}에서 <b>${ys.map(y => Math.abs(y - ey)).join(' · ')}</b> mm)`);
        for (const y of ys) {
          const [h] = this.appendSvg(guide, `<line x1="80" y1="${y}" x2="1720" y2="${y}" stroke="#fef9c3" stroke-width="2.5" stroke-dasharray="12,6" opacity="0.85" />`);
          if (isAnimated) {
            await this.focusBox(80, y - 120, 1720, y + 120, 20, 460);
            if (!this.alive(token)) return;
            await this.drawLineX(h, 800);
            if (!await wait(250)) return;
          }
          // ④ 수평선 위에 꺾이는 곳·J박스 자리 마킹: 바깥쪽 첫 세로선에서 J박스 쪽(예 350 · 300)과 반대쪽(예 400)
          await this.markGuideLine(y, list.filter(e => e.y1 === y).map(e => e.x), side, marks, temp, say, isAnimated, token);
          if (!this.alive(token)) return;
        }
      }
    }
    // 세로선 길이 숫자는 길 잡기 동안만 (완성 후에는 도면 치수선으로 확인)
    if (isAnimated) {
      say('✅ 배관이 지나갈 길(세로선·수평선)을 모두 잡았습니다. 이제 이 선을 따라 <b>배관 중심선</b>을 하나씩 긋습니다.');
      if (!await wait(900)) return;
    }
    temp.remove();
  }

  /**
   * 수평선 위 마킹: 배관이 꺾이는 곳·J박스 자리를 바깥쪽 첫 세로선부터 잰 치수로 표시
   * (1번 위: 800 세로선에서 J박스 쪽 350 · 300, 1000 세로선에서 반대쪽 400)
   */
  async markGuideLine(y, vxs, side, marks, temp, say, isAnimated, token) {
    if (!vxs.length) return;
    const J = this.junction;
    const xs = new Set();
    this.pipes.forEach(p => p.points.forEach(q => { if (q[1] === y) xs.add(q[0]); }));
    const [vmin, vmax] = [Math.min(...vxs), Math.max(...vxs)];
    const left = [...xs].filter(x => x < vmin).sort((a, b) => b - a);
    const right = [...xs].filter(x => x > vmax).sort((a, b) => a - b);
    const groups = [{ from: vmin, pts: left }, { from: vmax, pts: right }].filter(g => g.pts.length);
    if (!groups.length) return;
    const jSide = J[1] === y ? (J[0] < vmin ? 0 : 1) : -1;
    const desc = groups.map(g => {
      const chain = g.pts.map((x, i) => Math.abs(x - (i ? g.pts[i - 1] : g.from)));
      const isJ = jSide >= 0 && g === (jSide === 0 ? groups.find(q => q.from === vmin) : groups.find(q => q.from === vmax));
      return `${isJ ? 'J박스 쪽' : (jSide >= 0 ? '반대쪽' : (g.from === vmin ? '왼쪽' : '오른쪽'))} <b>${chain.join(' · ')}</b>`;
    }).join(', ');
    if (isAnimated) {
      await this.focusBox(Math.min(...xs, vmin) - 60, y - 110, Math.max(...xs, vmax) + 60, y + 110, 20, 460);
      if (!this.alive(token)) return;
    }
    say(`④ 수평선 위에 배관이 꺾이는 곳·J박스 자리를 마킹합니다. 첫 세로선에서 ${desc} mm`);
    const dir = side === 'top' ? -1 : 1;   // 치수는 배전반 반대쪽(바깥)에
    for (const g of groups) {
      let prev = g.from;
      for (const x of g.pts) {
        const [dim] = this.appendSvg(temp, `
          <g text-anchor="middle">
            <line x1="${prev}" y1="${y + dir * 14}" x2="${x}" y2="${y + dir * 14}" stroke="#111827" stroke-width="1.5" />
            <line x1="${prev}" y1="${y + dir * 6}" x2="${prev}" y2="${y + dir * 22}" stroke="#111827" stroke-width="1.5" />
            <line x1="${x}" y1="${y + dir * 6}" x2="${x}" y2="${y + dir * 22}" stroke="#111827" stroke-width="1.5" />
            <text x="${(prev + x) / 2}" y="${y + dir * 22 + (dir > 0 ? 12 : 0)}" font-size="14" fill="#111827" paint-order="stroke" stroke="#fef3c7" stroke-width="3">${Math.abs(x - prev)}</text>
          </g>`);
        const [m] = this.appendSvg(marks, `
          <g filter="url(#s5-chalk)" stroke="#f8fafc" stroke-width="4" stroke-linecap="round">
            <line x1="${x - 9}" y1="${y}" x2="${x + 9}" y2="${y}" />
            <line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}" />
          </g>`);
        if (isAnimated) {
          this.fadeIn(dim, 160);
          this.popIn(m, 180);
          await this.sleep(300);
          if (!this.alive(token)) return;
        }
        prev = x;
      }
    }
    if (isAnimated) await this.sleep(500);
  }

  /**
   * [2단계] 수평선 및 배관선(치수선) 먹줄 제도 — 순서대로 한 줄씩
   * - 1) 제어함 상단과 하단 수평선 2줄 (외부단자박스 상단/하단 높이와 100% 일치!)
   * - 2) 배관 9개 중심 먹줄 ➜ 관체 ➜ 명칭 태그 (TB 단자대 배관은 끝단 50mm 마감 여유 표식까지)
   * - 3) 상단 치수 표기
   */
  async runStep2(isAnimated = true, token = null) {
    token = this.beginRun(token);
    if (this.currentStep < 1) await this.runStep1(false, token);
    this.currentStep = 2;
    const W = this.WALL;
    const lineLayer = this.layer('drafting-lines-layer');
    const labelLayer = this.layer('labels-layer');
    if (!lineLayer || !labelLayer) return;
    lineLayer.innerHTML = '';
    labelLayer.innerHTML = '';

    this.updateGuideMessage("📐 <b>[2단계: 수평선 및 배관선 먹줄 제도]</b><br>1) 먼저 <b>제어함 상단/하단 기준 수평선 2줄</b>을 길게 긋습니다. (상단선은 상단 박스 윗변과, 하단선은 하단 박스 아랫변과 100% 일치!)");

    if (isAnimated) await this.focusAll();

    // 1) 기준 수평선 2줄
    const datum = [
      { y: W.BOX_TOP, labelY: W.BOX_TOP - 26, textY: W.BOX_TOP - 9, text: '상단 수평선 Y=590 (배전반·상부박스 윗변 일치)' },
      { y: W.BOX_BOT, labelY: W.BOX_BOT + 6, textY: W.BOX_BOT + 23, text: '하단 수평선 Y=1010 (배전반·하부박스 아랫변 일치)' }
    ];
    // 이름표는 J박스 반대쪽에 (J박스 쪽에는 상부 박스가 몰려 있어 겹침)
    // 왼쪽에 둘 때는 좌측 치수선(X=45)과 왼쪽 박스(X≥305) 사이 빈 자리
    const labelX = this.junction[0] < 900 ? 1505 : 58;
    for (const d of datum) {
      const [line] = this.appendSvg(lineLayer, `
        <line x1="80" y1="${d.y}" x2="1720" y2="${d.y}" stroke="#38bdf8" stroke-width="3" stroke-dasharray="10,6" opacity="0.95" />
      `);
      if (isAnimated) {
        await this.drawLineX(line, 900);
        if (!this.alive(token)) return;
      }
      const label = this.appendSvg(labelLayer, `
        <g>
          <rect x="${labelX}" y="${d.labelY}" width="285" height="24" fill="#0369a1" stroke="#38bdf8" stroke-width="1.5" rx="4" />
          <text x="${labelX + 10}" y="${d.textY}" font-size="12" font-weight="900" fill="#ffffff">${d.text}</text>
        </g>
      `)[0];
      if (isAnimated) this.fadeIn(label);
    }

    // 1-2) 배관 길 잡기: 배전반 윗변·아랫변 출구 마킹 ➜ 세로선(배전반에서 위·아래로 도면 치수만큼) ➜ 그 끝에서 수평선
    await this.draftPipeGuides(lineLayer, labelLayer, isAnimated, token);
    if (!this.alive(token)) return;

    // 2) 배관 9개: 중심 먹줄 ➜ 관체 ➜ 태그 ➜ (TB 배관) 50mm 마감 여유
    const bodyGroup = this.appendSvg(lineLayer, `<g id="s5-pipe-outer-conduits" opacity="0.55" stroke-linecap="round" stroke-linejoin="round"></g>`)[0];
    const centerGroup = this.appendSvg(lineLayer, `<g id="s5-pipe-center-lines" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.95" filter="url(#s5-chalk-glow)"></g>`)[0];
    const extraGroup = this.appendSvg(labelLayer, `<g id="s5-pipe-detail-tags" font-family="sans-serif"></g>`)[0];

    for (let i = 0; i < this.pipes.length; i++) {
      const pipe = this.pipes[i];
      const d = this.pointsToD(pipe.points);
      if (isAnimated) {
        await this.focusPipe(pipe);   // 🎥 지금 긋는 배관으로 확대
        if (!this.alive(token)) return;
        this.updateGuideMessage(`📐 <b>[2단계: 배관선 먹줄 제도 ${i + 1}/${this.pipes.length}]</b><br>✏️ <b>${pipe.no} ${pipe.name}</b> 배관 중심선을 도면 치수대로 긋습니다.${pipe.clearance ? `<br>⚠️ <b>${pipe.clearance} 단자대</b>는 커넥터를 끼우지 않으므로 <b>단자대 끝에서 50mm 여유</b>를 두고 배관을 마감합니다!` : ''}`);
      }

      const [center] = this.appendSvg(centerGroup, `<path d="${d}" />`);
      if (isAnimated) {
        await this.drawStroke(center);
        if (!this.alive(token)) return;
      }

      const [body] = this.appendSvg(bodyGroup, `<path d="${d}" stroke="${pipe.color}" stroke-width="18" fill="none" />`);
      const [tag] = this.appendSvg(extraGroup, `
        <g transform="translate(${pipe.tag.x}, ${pipe.tag.y})">
          <rect x="${-pipe.tag.w / 2}" y="-14" width="${pipe.tag.w}" height="28" fill="#1e293b" stroke="${pipe.tagFill}" stroke-width="2" rx="4" />
          <circle cx="${-pipe.tag.w / 2 + 15}" cy="0" r="9" fill="${pipe.badge.fill}" stroke="${pipe.badge.stroke}" stroke-width="1.5" />
          <text x="${-pipe.tag.w / 2 + 15}" y="4.5" text-anchor="middle" font-size="12" font-weight="900" fill="${pipe.badge.text}">${pipe.num}</text>
          <text x="${-pipe.tag.w / 2 + 30}" y="4" font-size="11" font-weight="900" fill="${pipe.tagFill}">${pipe.name}</text>
        </g>
      `);
      const clearance = pipe.clearance ? this.appendSvg(extraGroup, clearanceMarkup(pipe.clearance, pipe))[0] : null;
      if (isAnimated) {
        this.fadeIn(body);
        this.popIn(tag);
        if (clearance) this.fadeIn(clearance, 400);
        await this.sleep(clearance ? 700 : 250);
        if (!this.alive(token)) return;
      }
    }

    // 3) 도면 치수선 (상단·하단·좌측) — 공식 배관도 치수 그대로
    const dims = this.appendSvg(extraGroup, this.dimensionMarkup())[0];
    if (isAnimated) {
      this.fadeIn(dims);
      this.updateGuideMessage("✅ <b>[2단계 먹줄 제도 완료]</b><br>기준 수평선 2줄과 배관 9개 중심선을 모두 그었습니다.<br>📏 상단·하단·좌측 치수선으로 도면 치수(300·350·100·100·400 / 400·100·100·100·400 / 50·400·420·400·100)를 확인하세요.<br>⚠️ <b>TB 단자대 4개(TB1~TB4)</b>는 커넥터를 끼우지 않으므로 <b>단자대 끝에서 50mm 여유</b>를 두고 배관을 마감합니다!");
      await this.sleep(400);
    }
  }

  /**
   * [3단계] 외부단자 및 새들 위치 마킹 (컨트롤박스 커버 140mm 대기법) — 배관 순서·진행 방향대로 하나씩
   */
  async runStep3(isAnimated = true, token = null) {
    token = this.beginRun(token);
    if (this.currentStep < 2) await this.runStep2(false, token);
    this.currentStep = 3;
    const marksLayer = this.layer('saddle-marks-layer');
    const toolLayer = this.layer('tool-layer');
    if (!marksLayer || !toolLayer) return;
    marksLayer.innerHTML = '';
    toolLayer.innerHTML = '';

    this.updateGuideMessage("✍️ <b>[3단계: 외부단자 & 새들 위치 마킹]</b><br>💡 <b>합격 황금 공식 (컨트롤박스 커버 대기법)</b>:<br>새들 위치를 줄자로 재지 않고, <b>2구 컨트롤박스 뚜껑 커버(140mm)를 배관 끝과 코너 모서리에 직접 대고</b> 그 길이만큼 새들 마킹선(+)을 긋습니다!<br>300mm 이하 구간은 코너에서 커버 길이만큼 뺀 지점에 1개만 고정합니다.<br>🔩 <b>③ 메인전원 케이블</b>은 별도로 주는 <b>소형 새들 2개</b>를 씁니다: 맨 위 끝에서 <b>50mm 아래</b>, 배전반 윗변에서 <b>100mm 위</b>.");

    const group = this.appendSvg(marksLayer, `<g id="s5-saddle-cross-marks"></g>`)[0];
    const total = this.saddleOrder.length;

    let lastPipe = -1;
    for (let i = 0; i < total; i++) {
      const m = this.saddleOrder[i];
      const pipe = this.pipes[m.pipeIdx];

      if (isAnimated && m.pipeIdx !== lastPipe) {
        lastPipe = m.pipeIdx;
        await this.focusPipe(pipe);   // 🎥 마킹할 배관으로 확대
        if (!this.alive(token)) return;
      }

      if (isAnimated) {
        // 커버(140mm)를 기준점(배관 끝/코너) ➜ 마킹점 사이에 대는 모습
        toolLayer.innerHTML = '';
        if (m.ref) {
          const x = Math.min(m.ref[0], m.x), y = Math.min(m.ref[1], m.y);
          const vertical = m.ref[0] === m.x;
          const L = m.gap;
          const [cover] = this.appendSvg(toolLayer, `
            <g>
              <rect x="${vertical ? x - 20 : x}" y="${vertical ? y : y - 20}" width="${vertical ? 40 : L}" height="${vertical ? L : 40}"
                    fill="rgba(245, 158, 11, 0.4)" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,4" rx="4" />
              <text x="${vertical ? x + 26 : x + L / 2}" y="${vertical ? y + L / 2 + 4 : y - 26}" text-anchor="${vertical ? 'start' : 'middle'}"
                    font-size="12" font-weight="900" fill="#fef08a">${m.small ? `📏 ${L}mm (소형 새들)` : '📏 커버 140mm'}</text>
            </g>
          `);
          this.fadeIn(cover, 180);
        }
        this.updateGuideMessage(`✍️ <b>[3단계: 새들 위치 마킹 ${i + 1}/${total}]</b><br>${pipe ? `<b>${pipe.no} ${pipe.name}</b> 배관 — ` : ''}<b>${m.label}</b><br>${m.small ? `🔩 메인전원 케이블 전용 <b>소형 새들</b> 자리: 기준점에서 <b>${m.gap}mm</b> 지점에 + 마킹!` : '📏 커버(140mm)를 배관 끝/코너에 대고 반대쪽 끝에 + 마킹!'}`);
        await this.sleep(m.ref ? 380 : 200);
        if (!this.alive(token)) return;
      }

      const [mark] = this.appendSvg(group, `
        <g class="saddle-mark-item${m.small ? ' small' : ''}" data-order="${i + 1}" transform="translate(${m.x}, ${m.y}) rotate(${m.angle})${m.small ? ' scale(0.65)' : ''}">
          <!-- 새들 마킹 십자선 (흰색 분필로 굵게) -->
          <g filter="url(#s5-chalk)" stroke="#f8fafc" stroke-linecap="round" opacity="0.95">
            <line x1="-14" y1="0" x2="14" y2="0" stroke-width="5" />
            <line x1="0" y1="-9" x2="0" y2="9" stroke-width="4.5" />
          </g>
        </g>
      `);
      if (isAnimated) {
        this.popIn(mark);
        await this.sleep(160);
        if (!this.alive(token)) return;
      }
    }

    toolLayer.innerHTML = '';
    if (isAnimated) {
      this.updateGuideMessage(`✅ <b>[3단계 새들 마킹 완료]</b><br>배관 9개를 따라 새들 위치 <b>${total}곳</b>을 순서대로 마킹했습니다.<br>💡 300mm 이하 구간은 코너에서 커버 길이만큼 뺀 지점에 1개만 고정합니다.`);
      await this.sleep(400);
    }
  }

  /**
   * 2구 박스 본체 + 실제 기구 (PB1 녹색·PB0 빨강 푸시버튼, 셀렉터, 램프, 부저, 막음 캡)
   * - 이름표는 박스 아래(below) 또는 위(above)
   */
  deviceBoxMarkup(box, x, y, titlePos) {
    // box: 이름(1번 기본 구성) 또는 { name, top, bottom } (문제 데이터)
    const layoutName = typeof box === 'object' ? box.name : box;
    const [top, bottom] = typeof box === 'object' && box.top ? [box.top, box.bottom] : BOX_LAYOUTS[layoutName];
    return `
      <g class="ext-device-box" transform="translate(${x}, ${y})">
        <rect width="90" height="140" fill="#334155" stroke="#94a3b8" stroke-width="2" rx="4" />
        <rect x="4" y="4" width="82" height="132" rx="3" fill="#1e293b" opacity="0.55" />
        <g transform="translate(45, 40)">${deviceFace(top.type)}</g>
        <g transform="translate(45, 100)">${deviceFace(bottom.type)}</g>
        <text x="45" y="${titlePos === 'above' ? -10 : 158}" text-anchor="middle" font-size="12" font-weight="900" fill="#facc15">${layoutName.replace('/', ' / ')}</text>
      </g>`;
  }

  /**
   * [4단계] 외부기구 고정 (단자대 4개, 정션박스 1개, 박스본체 4개)
   * - 핵심: 상단 2구 박스 3개 상단 라인은 Y = 590 (메인배전반 상단 수평선과 100% 일치)
   * - 핵심: 하단 2구 박스 YL/BZ 하단 라인은 Y = 1010 (메인배전반 하단 수평선과 100% 일치)
   */
  async runStep4(isAnimated = true, token = null) {
    token = this.beginRun(token);
    if (this.currentStep < 3) await this.runStep3(false, token);
    this.currentStep = 4;
    const devLayer = this.layer('external-devices-layer');
    if (!devLayer) return;

    this.updateGuideMessage("📦 <b>[4단계: 외부기구 벽면 고정]</b><br>1) <b>TB 단자대 4개</b> (TB1 상단가로, TB2 하단우측세로, TB3 하단좌측세로, TB4 하단중앙가로)<br>2) <b>8각 정션박스(J박스) 1개</b><br>3) <b>2구 스위치박스 본체 4개</b> (PB, SS, RL/GL, YL/BZ)를 벽면에 피스로 단단히 고정합니다!<br>🎯 <b>위치 확인</b>: 상단 박스 3개의 윗변과 제어함 윗변은 Y=590으로 정확히 일치하며, 하단 박스 YL/BZ의 아랫변과 제어함 아랫변은 Y=1010으로 정확히 일치합니다!");

    this.setSvgContent(devLayer, `
      <!-- 1. 2구 스위치박스 본체 4개 (규격: 가로 90mm x 세로 140mm) — 실제 기구 모양으로 표시 -->
      ${this.boxes.map(b => this.deviceBoxMarkup(b, b.x, b.y, b.titlePos)).join('')}

      <!-- 2. 8각 조인트 박스 (J박스, 과제별 위치) -->
      <g class="ext-junction-box" transform="translate(${this.junction[0]}, ${this.junction[1]})">
        <polygon points="-35,-15 -15,-35 15,-35 35,-15 35,15 15,35 -15,35 -35,15" fill="#475569" stroke="#cbd5e1" stroke-width="2.5" />
        <circle r="18" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
        <text y="5" text-anchor="middle" font-size="14" font-weight="900" fill="#38bdf8">J</text>
        <text y="-42" text-anchor="middle" font-size="12" font-weight="900" fill="#fef08a">8각 정션박스</text>
      </g>

      <!-- 3. TB 단자대 4개 -->
      <!-- TB1 (상단 중앙 가로 단자대, 가장 높음: 케이블 끝 Y=140에서 50 위 → 하단 Y=90) -->
      <g class="ext-terminal-tb1" transform="translate(845, 60)">
        <rect width="110" height="30" fill="#1e293b" stroke="#cbd5e1" stroke-width="2" rx="3" />
        <text x="55" y="19" text-anchor="middle" font-size="11" font-weight="bold" fill="#f8fafc">TB1 (L1 L2 L3 PE)</text>
        <text x="-8" y="20" text-anchor="end" font-size="12" font-weight="900" fill="#facc15">TB1 (가로)</text>
      </g>

      <!-- TB2·TB3·TB4: 과제 데이터 위치에서 계산 (배관 끝에서 50mm 떨어진 곳) -->
      ${this.tbBlocks.map(t => this.tbBlockMarkup(t)).join('')}
    `);

    if (isAnimated) {
      // 기구를 하나씩 붙이는 느낌으로 순차 등장
      const items = [...devLayer.children];
      items.forEach(el => { el.style.opacity = '0'; });
      for (const el of items) {
        await this.focusElement(el);   // 🎥 붙일 기구로 확대
        if (!this.alive(token)) return;
        el.style.opacity = '';
        this.popIn(el, 260);
        await this.sleep(350);
        if (!this.alive(token)) return;
      }
      await this.sleep(300);
      await this.focusAll();
    }
  }

  /**
   * [5단계] 전체 새들 1차 고정 (배관 삽입 편의를 위해 바깥쪽 1개씩 우선 가체결) — 마킹 순서대로 하나씩
   */
  async runStep5(isAnimated = true, token = null) {
    token = this.beginRun(token);
    if (this.currentStep < 4) await this.runStep4(false, token);
    this.currentStep = 5;
    const saddleLayer = this.layer('saddles-layer');
    if (!saddleLayer) return;
    saddleLayer.innerHTML = '';

    this.updateGuideMessage("🛠️ <b>[5단계: 전체 새들 1차 가고정 (합격 꿀팁)]</b><br>💡 <b>배관 삽입 편의 꿀팁</b>: 배관이 꺾이는 <b>바깥쪽 나사 1개만 먼저 살짝 가고정</b>해 둡니다!<br>이렇게 하면 다음 6단계에서 배관을 새들 틈으로 밀어 넣기가 훨씬 수월해져 작업 시간이 15분 이상 단축됩니다!");

    // 3단계 마킹 순서대로 바깥쪽 나사 1개씩 고정된 새들 클립 렌더링
    const group = this.appendSvg(saddleLayer, `<g id="s5-half-mounted-saddles"></g>`)[0];
    const total = this.saddleOrder.length;

    let lastPipe = -1;
    for (let i = 0; i < total; i++) {
      const m = this.saddleOrder[i];
      if (isAnimated && m.pipeIdx !== lastPipe) {
        lastPipe = m.pipeIdx;
        await this.focusPipe(this.pipes[m.pipeIdx]);   // 🎥 가고정할 배관으로 확대
        if (!this.alive(token)) return;
      }
      const [bracket] = this.appendSvg(group, this.saddleBracketMarkup(m));
      if (isAnimated) {
        this.popIn(bracket);
        if (i % 4 === 0) {
          this.updateGuideMessage(`🛠️ <b>[5단계: 새들 1차 가고정 ${i + 1}/${total}]</b><br><b>${this.pipes[m.pipeIdx].no} ${this.pipes[m.pipeIdx].name}</b> 배관 — 바깥쪽 나사 1개만 살짝 가고정!`);
        }
        await this.sleep(140);
        if (!this.alive(token)) return;
      }
    }

    if (isAnimated) {
      await this.sleep(400);
      await this.focusAll();
    }

    this.updateGuideMessage("✅ <b>[새들 1차 가고정 완료]</b><br>배전반 고정부터 수평선 먹줄, 외부단자/새들 마킹, 기구 고정 및 바깥쪽 새들 가체결까지 끝났습니다!<br>다음은 <b>'6. 🔗 커넥터 접속'</b>입니다.");
  }

  // ---------------------------------------------------------------------------
  // 6~7단계: 커넥터 접속 · 배관 설치 · ③ 케이블 장착
  // ---------------------------------------------------------------------------

  /**
   * 배관별 커넥터 위치 계산
   * - 박스(제어함·2구 박스)에 붙는 끝: 끝점 그대로, J박스에 붙는 끝: J 테두리(중심에서 35mm)
   * - TB 단자대 쪽 끝(clearance 배관의 끝점): 커넥터 없음 (실기 절대 주의)
   * - ③ 케이블은 PE·CD 커넥터 대상이 아님 (7단계에서 케이블 커넥터 별도 조립)
   */
  /** 외부 TB 단자대 그림 (세로/가로, 배관이 들어오는 쪽에 단자) */
  tbBlockMarkup(t) {
    const pipe = this.pipes.find(p => p.clearance === t.id);
    const end = pipe ? pipe.points[pipe.points.length - 1] : [t.device.at, t.device.from];
    const g = tbBlockGeometry(t.device, end);
    const cls = `ext-terminal-${t.id.toLowerCase()}`;
    if (g.vertical) {
      const cx = g.outward[0] < 0 ? 9 : g.w - 9;   // 제목은 바깥쪽(인출선 쪽) 가장자리, 안쪽은 단자 표기 자리
      return `
      <g class="${cls}" transform="translate(${g.x0}, ${g.y0})">
        <rect width="${g.w}" height="${g.h}" fill="#1e293b" stroke="#cbd5e1" stroke-width="2" rx="3" />
        <text x="${cx}" y="${g.h / 2}" text-anchor="middle" font-size="9" font-weight="bold" fill="#f8fafc" transform="rotate(-90 ${cx} ${g.h / 2})">${t.id} (${t.title})</text>
        <text x="${g.w / 2}" y="${g.h + 15}" text-anchor="middle" font-size="12" font-weight="900" fill="#facc15">${t.id} (세로)</text>
      </g>`;
    }
    return `
      <g class="${cls}" transform="translate(${g.x0}, ${g.y0})">
        <rect width="${g.w}" height="${g.h}" fill="#1e293b" stroke="#cbd5e1" stroke-width="2" rx="3" />
        <text x="${g.w / 2}" y="19" text-anchor="middle" font-size="11" font-weight="bold" fill="#f8fafc">${t.id} (${t.title})</text>
        <text x="-8" y="20" text-anchor="end" font-size="12" font-weight="900" fill="#facc15">${t.id} (가로)</text>
      </g>`;
  }

  getConnectors() {
    const J = this.junction;
    const J_RADIUS = 35;
    const list = [];
    const count = { PE: 0, CD: 0 };
    this.pipes.forEach((pipe, pipeIdx) => {
      if (pipe.kind === 'CABLE') return;
      const pts = pipe.points;
      const ends = [
        { p: pts[0], inner: pts[1], isEnd: false },
        { p: pts[pts.length - 1], inner: pts[pts.length - 2], isEnd: true }
      ];
      ends.forEach(e => {
        const d = [Math.sign(e.inner[0] - e.p[0]), Math.sign(e.inner[1] - e.p[1])];
        if (e.isEnd && pipe.clearance) {
          list.push({ pipeIdx, kind: pipe.kind, none: true, x: e.p[0], y: e.p[1], d, tb: pipe.clearance });
          return;
        }
        const atJ = e.p[0] === J[0] && e.p[1] === J[1];
        // 배전반(제어함) 쪽 커넥터는 배전반 위로 3mm 걸쳐 올라오게 (결선하기 편하도록)
        const W = this.WALL;
        const atPanel = (e.p[1] === W.BOX_TOP || e.p[1] === W.BOX_BOT) && e.p[0] >= W.BOX_LEFT && e.p[0] <= W.BOX_RIGHT;
        const shift = atJ ? J_RADIUS : (atPanel ? -PANEL_OVERLAP : 0);
        const x = e.p[0] + d[0] * shift;
        const y = e.p[1] + d[1] * shift;
        count[pipe.kind]++;
        list.push({ pipeIdx, kind: pipe.kind, none: false, x, y, d, isEnd: e.isEnd, no: count[pipe.kind], where: atJ ? 'J박스' : '박스 노크아웃' });
      });
    });
    return { list, count };
  }

  /** 커넥터 그림 (끝점에서 배관 안쪽 방향으로 길이 20mm) */
  connectorMarkup(c) {
    const kind = PIPE_KIND[c.kind];
    const angle = Math.atan2(c.d[1], c.d[0]) * 180 / Math.PI;
    const label = `${c.kind}${c.no}`;
    // 뱃지는 배관 진행 방향의 옆쪽에 배치
    const bx = c.d[0] === 0 ? 28 : c.d[0] * 40;
    const by = c.d[0] === 0 ? c.d[1] * 42 : -26;
    return `
      <g class="s5-connector" data-pipe="${c.pipeIdx}" data-end="${c.isEnd ? 'end' : 'start'}" transform="translate(${c.x}, ${c.y})">
        <g transform="rotate(${angle})">
          <rect x="0" y="-13" width="20" height="26" rx="3" fill="${kind.color}" stroke="${c.kind === 'PE' ? '#64748b' : '#0f172a'}" stroke-width="2" />
          <rect x="4" y="-13" width="3" height="26" fill="#0f172a" opacity="0.35" />
          <rect x="11" y="-13" width="3" height="26" fill="#0f172a" opacity="0.35" />
        </g>
        <g transform="translate(${bx}, ${by})">
          <rect x="-19" y="-10" width="38" height="20" rx="10" fill="#0f172a" stroke="${kind.tagFill}" stroke-width="2" />
          <text y="5" text-anchor="middle" font-size="11" font-weight="900" fill="${kind.tagFill}">${label}</text>
        </g>
      </g>`;
  }

  /** TB 단자대 쪽 '커넥터 없음' 표식 */
  noConnectorMarkup(c) {
    const bx = c.d[0] === 0 ? 34 : 0;
    const by = c.d[0] === 0 ? 0 : 30;
    return `
      <g class="s5-no-connector" transform="translate(${c.x}, ${c.y})">
        <circle r="11" fill="#7f1d1d" stroke="#f87171" stroke-width="2" />
        <path d="M -5 -5 L 5 5 M -5 5 L 5 -5" stroke="#fecaca" stroke-width="2.5" />
        <text x="${bx}" y="${by + 4}" text-anchor="middle" font-size="10" font-weight="900" fill="#fecaca">커넥터 ✕</text>
      </g>`;
  }

  /**
   * [6단계] 배관 커넥터 접속 (PE·CD) — 제어함·J박스·2구 박스 노크아웃에 하나씩
   * ★ 실기 절대 주의: TB 단자대 쪽은 커넥터를 접속하지 않음
   */
  async runStep6(isAnimated = true, token = null) {
    token = this.beginRun(token);
    if (this.currentStep < 5) await this.runStep5(false, token);
    this.currentStep = 6;
    const layer = this.layer('connectors-layer');
    if (!layer) return;
    layer.innerHTML = '';

    const { list, count } = this.getConnectors();
    this.updateGuideMessage(`🔗 <b>[6단계: 배관 커넥터 접속]</b><br>제어함·J박스·2구 박스 노크아웃에 커넥터를 끼웁니다: <b style="color:#cbd5e1;">① PE관(검정) ${count.PE}개</b> · <b style="color:#ffffff;">② CD관(흰색 주름관) ${count.CD}개</b><br>⚠️ <b>실기 절대 주의</b>: <b>TB 단자대 쪽은 커넥터를 절대 접속하지 않습니다!</b> (TB1~TB4 배관 끝은 커넥터 ✕)`);
    if (isAnimated) await this.sleep(600);

    let done = 0;
    const total = list.filter(c => !c.none).length;
    let lastPipe = -1;
    for (const c of list) {
      if (!this.alive(token)) return;
      if (isAnimated && c.pipeIdx !== lastPipe) {
        lastPipe = c.pipeIdx;
        await this.focusPipe(this.pipes[c.pipeIdx]);   // 🎥 커넥터를 끼울 배관으로 확대
        if (!this.alive(token)) return;
      }
      const [el] = this.appendSvg(layer, c.none ? this.noConnectorMarkup(c) : this.connectorMarkup(c));
      if (c.none) {
        if (isAnimated) {
          this.popIn(el);
          this.updateGuideMessage(`🔗 <b>[6단계: 커넥터 접속 ${done}/${total}]</b><br>⛔ <b>${c.tb} 단자대 쪽 배관 끝</b>: 커넥터를 끼우지 않습니다! (50mm 여유를 두고 배관만 마감)`);
          await this.sleep(450);
        }
        continue;
      }
      done++;
      if (isAnimated) {
        this.popIn(el);
        const pipe = this.pipes[c.pipeIdx];
        this.updateGuideMessage(`🔗 <b>[6단계: 커넥터 접속 ${done}/${total}]</b><br><b>${pipe.no} ${pipe.name}</b> — ${c.where}에 <b>${PIPE_KIND[c.kind].label} 커넥터 ${c.kind}${c.no}</b> 체결<br><span style="color:#94a3b8;">${PIPE_KIND[c.kind].label} 커넥터 ${c.no}/${count[c.kind]}개째</span>`);
        await this.sleep(320);
      }
    }

    if (isAnimated) await this.focusAll();

    // 커넥터 개수 요약 카드: 기본은 오른쪽 아래, 그 자리에 외부 단자대(인출선 포함)가 있으면 왼쪽 위 빈 자리
    const busyBottomRight = this.tbBlocks.some(t => t.device.edge === 'x' && t.device.at >= 1400 && t.device.from >= 1400);
    const [cardX, cardY] = busyBottomRight ? [60, 50] : [1545, 1500];
    const [card] = this.appendSvg(layer, `
      <g class="s5-connector-summary" transform="translate(${cardX}, ${cardY})">
        <rect width="240" height="78" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="2" opacity="0.95" />
        <text x="12" y="22" font-size="13" font-weight="900" fill="#f8fafc">🔗 커넥터 접속 결과</text>
        <text x="12" y="44" font-size="12" font-weight="900" fill="#cbd5e1">① PE관 커넥터 ${count.PE}개</text>
        <text x="128" y="44" font-size="12" font-weight="900" fill="#ffffff">② CD관 커넥터 ${count.CD}개</text>
        <text x="12" y="66" font-size="11" font-weight="800" fill="#fca5a5">TB1~TB4 쪽 커넥터 ✕ · ③ 케이블은 7단계</text>
      </g>
    `);
    if (isAnimated) {
      this.fadeIn(card);
      this.updateGuideMessage(`✅ <b>[6단계 커넥터 접속 완료]</b><br><b style="color:#cbd5e1;">① PE관(검정) 커넥터 ${count.PE}개</b> · <b style="color:#ffffff;">② CD관(흰색 주름관) 커넥터 ${count.CD}개</b>를 모두 끼웠습니다.<br>TB 단자대 쪽은 커넥터 없이 배관만 마감합니다. 이제 <b>7. 배관 설치</b>로 진행하세요!`);
      await this.sleep(400);
    }
  }

  /** 배관 실물 경로 (J박스에 붙는 끝은 J 테두리까지만) */
  pipeBodyPoints(pipe) {
    const J = this.junction;
    const pts = pipe.points.map(p => [p[0], p[1]]);
    [[0, 1], [pts.length - 1, pts.length - 2]].forEach(([i, inner]) => {
      if (pts[i][0] === J[0] && pts[i][1] === J[1]) {
        pts[i][0] += Math.sign(pts[inner][0] - J[0]) * 35;
        pts[i][1] += Math.sign(pts[inner][1] - J[1]) * 35;
      }
    });
    return pts;
  }

  /** 반쯤 고정된 새들에 나머지 나사를 체결해 본고정 */
  fixSaddlesOfPipe(pipeIdx, isAnimated) {
    const brackets = [...this.svg.querySelectorAll(`.saddle-bracket[data-pipe="${pipeIdx}"]`)];
    brackets.forEach(b => {
      if (b.querySelector('.s5-full-screw')) return;
      const [screw] = this.appendSvg(b, this.screwMarkup(-parseInt(b.dataset.side, 10), 'full'));
      if (isAnimated) this.popIn(screw, 200);
    });
    return brackets.length;
  }

  /** 짧은 작업 도구 표시 (스프링 벤더·커터 등) */
  async flashTool(markup, ms, isAnimated) {
    if (!isAnimated) return;
    const toolLayer = this.layer('tool-layer');
    const [el] = this.appendSvg(toolLayer, markup);
    this.popIn(el, 180);
    await this.sleep(ms);
    el.remove();
  }

  /**
   * 밀착 재단: 파이프 커터를 배전반 나무판(윗변·아랫변) 또는 컨트롤박스에 딱 붙이고(날은 바깥쪽 = 내 쪽),
   * 파이프 끝도 판·박스에 딱 붙인 채 자르면 커터 두께만큼 짧게 잘려 커넥터를 끼웠을 때 길이가 딱 맞음
   * (배전반 쪽은 커넥터가 나무판 위로 약 3mm 걸침)
   * @param p 배관 끝점(판·박스 가장자리) / inner 배관 안쪽 다음 점 / target 'panel' | 'box'
   */
  async flushCut(pipe, p, inner, target, say, token) {
    const d = [Math.sign(inner[0] - p[0]), Math.sign(inner[1] - p[1])];
    const angle = Math.atan2(d[1], d[0]) * 180 / Math.PI;
    const kind = PIPE_KIND[pipe.kind];
    const W = this.WALL;
    const where = target === 'panel'
      ? `배전반 나무판 ${p[1] === W.BOX_TOP ? '윗변' : '아랫변'}`
      : (target === 'junction' ? 'J박스(정션박스)' : '컨트롤박스');
    // 설명 글씨는 배관 옆(세로 배관 = 오른쪽, 가로 배관 = 위쪽)
    // 설명 글씨는 배관 옆 — 벽 오른쪽 끝에 가까우면 왼쪽에 (세로 배관), 가로 배관은 위쪽
    const leftSide = d[0] === 0 && p[0] > W.WIDTH - 420;
    const [lx, ly] = d[0] === 0 ? [p[0] + (leftSide ? -60 : 60), p[1] + (d[1] > 0 ? 20 : -95)] : [p[0] + d[0] * 60, p[1] - 120];
    const anchor = d[0] === 0 ? (leftSide ? 'end' : 'start') : 'middle';
    // 커터와 설명 글씨가 함께 보이게 (글씨 쪽으로 넓게)
    if (d[0] === 0) await this.focusBox(leftSide ? p[0] - 330 : p[0] - 90, p[1] - 110, leftSide ? p[0] + 90 : p[0] + 330, p[1] + 110, 20, 460);
    else await this.focusBox(p[0] - 200, p[1] - 140, p[0] + 200, p[1] + 60, 20, 460);
    if (!this.alive(token)) return;

    const toolLayer = this.layer('tool-layer');
    const [g] = this.appendSvg(toolLayer, `
      <g class="s5-flush-cut">
        <g transform="translate(${p[0]}, ${p[1]}) rotate(${angle})">
          <!-- 판·박스 면 (밀착 기준면) -->
          <line class="fc-face" x1="0" y1="-46" x2="0" y2="46" stroke="#facc15" stroke-width="5" stroke-linecap="round" />
          <!-- 파이프 커터: 머리(두께 20, 반투명 — 안쪽 파이프가 보이게) + 손잡이 2개, 날은 머리 한가운데 -->
          <g class="fc-cutter">
            <line x1="20" y1="-22" x2="119" y2="-48" stroke="#dc2626" stroke-width="9" stroke-linecap="round" />
            <line x1="20" y1="22" x2="119" y2="48" stroke="#dc2626" stroke-width="9" stroke-linecap="round" />
            <rect x="0" y="-30" width="20" height="60" rx="3" fill="#e5e7eb" fill-opacity="0.45" stroke="#334155" stroke-width="2" />
          </g>
          <!-- 파이프 (끝을 판·박스에 딱 붙임) · 빨간 부분 = 잘려 나갈 커터 두께만큼 -->
          <g class="fc-pipe" style="visibility:hidden">
            <rect x="10" y="-8" width="140" height="16" fill="${kind.color}" stroke="#0f172a" stroke-width="2" />
            <rect class="fc-piece" x="0" y="-8" width="10" height="16" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" />
          </g>
          <!-- 커터 날: 바깥쪽(내 쪽) — 파이프 위에 -->
          <!-- 커터 날: 머리 한가운데 (커터 두께의 절반 지점에서 잘림) -->
          <rect class="fc-blade" x="8.5" y="-26" width="3" height="52" rx="1" fill="#f97316" stroke="#7c2d12" stroke-width="0.8" />
          <line class="fc-cutline" x1="10" y1="-34" x2="10" y2="34" stroke="#ffffff" stroke-width="3" style="visibility:hidden" />
          <!-- 자른 뒤 커넥터 (배전반 쪽은 판 위로 3mm 걸침) -->
          <g class="fc-conn" style="visibility:hidden">
            <rect x="${target === 'panel' ? -PANEL_OVERLAP : 0}" y="-13" width="${10 + (target === 'panel' ? PANEL_OVERLAP : 0) + 10}" height="26" rx="3" fill="${kind.color}" stroke="#22c55e" stroke-width="2.5" />
          </g>
        </g>
        <g class="fc-label" font-weight="900" text-anchor="${anchor}" paint-order="stroke" stroke="#0f172a" stroke-width="4">
          <text class="fc-t1" x="${lx}" y="${ly}" font-size="12" fill="#fde68a">① 커터를 ${where}에 딱 밀착 · 날은 바깥쪽(내 쪽)</text>
          <text class="fc-t2" x="${lx}" y="${ly + 18}" font-size="12" fill="#bae6fd" style="visibility:hidden">② 파이프도 ${where}에 딱 붙이고</text>
          <text class="fc-t3" x="${lx}" y="${ly + 36}" font-size="13" fill="#fca5a5" style="visibility:hidden">③ 싹둑! 날이 커터 가운데 ➜ 빨간 부분(커터 반 두께)만큼 잘림</text>
          <text class="fc-t4" x="${lx}" y="${ly + 54}" font-size="12" fill="#86efac" style="visibility:hidden">${target === 'panel' ? '④ 커넥터를 끼우면 나무판 위로 약 3mm 걸침 ✔' : (target === 'junction' ? '④ 커넥터를 끼우면 J박스 노크아웃에 딱 맞음 ✔' : '④ 커넥터를 끼우면 박스 노크아웃에 딱 맞음 ✔')}</text>
        </g>
      </g>`);
    const show = (sel) => { const el = g.querySelector(sel); if (el) el.style.visibility = ''; return el; };

    say(`✂️ <b>밀착 재단</b> — 파이프 커터를 <b>${where}에 딱 밀착</b>시키고, <b>커터 날은 바깥쪽(내가 바라보는 쪽)</b>으로 향하게 합니다.`);
    this.popIn(g.querySelector('.fc-cutter'), 220);
    await this.sleep(700);
    if (!this.alive(token)) { g.remove(); return; }

    say(`✂️ <b>밀착 재단</b> — 파이프를 커터에 넣고 <b>끝을 ${where}에 딱 붙인 채</b> 잡습니다.`);
    show('.fc-pipe'); show('.fc-t2');
    g.querySelector('.fc-pipe').animate([{ transform: 'translateX(40px)' }, { transform: 'translateX(0)' }], { duration: 400 / this.speed, easing: 'ease-out' });
    await this.sleep(700);
    if (!this.alive(token)) { g.remove(); return; }

    say('✂️ <b>싹둑!</b> 커터 날은 머리 <b>한가운데</b>에 있어서 커터 두께의 절반쯤(빨간 부분)이 잘려 나가요 — <b>따로 재지 않아도 길이가 딱 맞습니다.</b>');
    const cut = show('.fc-cutline'); show('.fc-t3');
    cut.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], { duration: 300 / this.speed, iterations: 2 });
    g.querySelector('.fc-cutter').animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.82)' }, { transform: 'scaleY(1)' }], { duration: 300 / this.speed, iterations: 2 });
    await this.sleep(600);
    g.querySelector('.fc-piece').animate([{ transform: 'translate(0, 0)', opacity: 1 }, { transform: 'translate(-6px, 40px)', opacity: 0 }], { duration: 500 / this.speed, fill: 'forwards' });
    ['.fc-cutter', '.fc-blade'].forEach(sel => g.querySelector(sel).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400 / this.speed, fill: 'forwards' }));
    await this.sleep(500);
    if (!this.alive(token)) { g.remove(); return; }

    say(target === 'panel'
      ? '✂️ 자른 파이프에 커넥터를 끼우면 <b>커넥터가 배전반 나무판 위로 약 3mm 살짝 걸치는</b> 딱 맞는 길이가 됩니다. (결선하기 편해요!)'
      : `✂️ 자른 파이프에 커넥터를 끼우면 <b>${where} 노크아웃에 딱 맞게</b> 들어갑니다.`);
    this.popIn(show('.fc-conn'), 220); show('.fc-t4');
    await this.sleep(1000);
    g.remove();
    if (this.alive(token)) await this.focusPipe(pipe);
  }

  /**
   * [7단계] 배관 설치 (4단계 루틴) & ③ 메인전원 케이블 장착
   * - PE·CD관: ① 커넥터에 배관 접속 ➜ ② 스프링 벤더 삽입(PE관 코너만) ➜ ③ 새들 체결 ➜ ④ 배관 커터로 재단 후 반대편 커넥터
   * - ③ 케이블: 손 네 마디(약 10cm) 외피 탈피 ➜ TB1에 꽂기 ➜ 상부 새들 ➜ 하부 탈피 ➜ 케이블 커넥터 ➜ 하부 새들
   */
  async runStep7(isAnimated = true, token = null) {
    token = this.beginRun(token);
    if (this.currentStep < 6) await this.runStep6(false, token);
    this.currentStep = 7;
    const pipeLayer = this.layer('pipes-layer');
    if (!pipeLayer) return;
    pipeLayer.innerHTML = '';
    // 다시 실행할 때를 대비해 본고정 나사 초기화
    this.svg.querySelectorAll('.s5-full-screw').forEach(el => el.remove());

    this.updateGuideMessage("🚰 <b>[7단계: 배관 설치 4단계 루틴]</b><br>① 커넥터에 배관 접속 ➜ ② 스프링 벤더 삽입(PE관 코너만) ➜ ③ 새들 체결 ➜ ④ 배관 커터로 재단 후 반대편 커넥터 끼우기<br>✂️ <b>절단은 한쪽 끝에서만!</b> J박스·컨트롤박스 쪽은 연결만 하고 배전반(또는 J박스 건너편 컨트롤박스)에서 절단, TB 단자대 배관은 배전반에서 연결하고 TB 쪽 끝에서 절단<br>💡 이 순서를 지키면 배관이 꺾이지 않고 새들 사이로 깔끔하게 들어갑니다!");
    if (isAnimated) await this.sleep(700);

    for (let i = 0; i < this.pipes.length; i++) {
      if (!this.alive(token)) return;
      const pipe = this.pipes[i];
      if (pipe.kind === 'CABLE') {
        await this.installCable(i, isAnimated, token);
        continue;
      }
      await this.installPipe(i, isAnimated, token);
    }
    if (!this.alive(token)) return;
    if (isAnimated) await this.focusAll();

    this.updateGuideMessage("🎉 <b>[5단계 배관 제도 · 커넥터 · 배관 설치 완료!]</b><br>배전반 고정부터 먹줄, 새들 마킹, 기구 고정, 새들 가고정, <b>커넥터 접속(PE 6 · CD 7)</b>, <b>배관 설치와 ③ 메인전원 케이블 장착</b>까지 끝났습니다!<br>우측 상단의 <b>'⚡ 6단계 기구장착 & 입선 진행 ▶'</b>을 눌러 입선·결선으로 진행하세요!");
  }

  async installPipe(pipeIdx, isAnimated, token) {
    const pipe = this.pipes[pipeIdx];
    if (isAnimated) {
      await this.focusPipe(pipe);   // 🎥 설치할 배관으로 확대
      if (!this.alive(token)) return;
    }
    const pipeLayer = this.layer('pipes-layer');
    const say = (stepHtml) => this.updateGuideMessage(`🚰 <b>[7단계: 배관 설치 ${pipeIdx + 1}/${this.pipes.length}] ${pipe.no} ${pipe.name}</b><br>${stepHtml}`);

    // 배관 끝이 어디에 붙는지: 배전반(나무판 윗변·아랫변) / J박스 / 컨트롤박스 (TB 쪽은 clearance)
    const W = this.WALL;
    const J = this.junction;
    const endTarget = (q) => {
      if (q[0] === J[0] && q[1] === J[1]) return 'junction';
      if ((q[1] === W.BOX_TOP || q[1] === W.BOX_BOT) && q[0] >= W.BOX_LEFT && q[0] <= W.BOX_RIGHT) return 'panel';
      return 'box';
    };
    // 연결만 하는 쪽 ➜ 반대쪽 끝에서만 절단 (사용자 확정):
    //   J박스 쪽 = 연결만 (J ➜ 컨트롤박스·배전반에서 절단) / 컨트롤박스 쪽 = 연결만 (배전반에서 절단)
    //   TB 단자대 배관 = 배전반에서 연결 ➜ TB 쪽 끝에서 절단 (커넥터 ✕)
    const startT = endTarget(pipe.points[0]);
    const lastT = pipe.clearance ? 'tb' : endTarget(pipe.points[pipe.points.length - 1]);
    const flip = lastT === 'junction' || (lastT === 'box' && startT === 'panel');
    const pts = flip ? this.pipeBodyPoints(pipe).reverse() : this.pipeBodyPoints(pipe);
    const d = this.pointsToD(pts);
    const corners = pipe.points.slice(1, -1);
    const [connEnd, cutEnd] = flip ? ['end', 'start'] : ['start', 'end'];
    const connTarget = flip ? lastT : startT;
    const cutTarget = flip ? startT : lastT;
    const connWhere = { junction: 'J박스(정션박스)', box: '컨트롤박스', panel: '배전반' }[connTarget];

    // ① 커넥터에 배관 접속 (연결만 하는 쪽 — 자르지 않음)
    const startConn = this.svg.querySelector(`.s5-connector[data-pipe="${pipeIdx}"][data-end="${connEnd}"]`);
    if (isAnimated) {
      say(`① <b>${connWhere} 쪽은 자르지 않고</b> 커넥터에 배관을 끝까지 밀어 <b>연결만</b> 합니다. (절단은 반대쪽 끝에서 한 번만!)`);
      await this.flashTool(`
        <g transform="translate(${pts[0][0]}, ${pts[0][1]})">
          <circle r="16" fill="#0f172a" stroke="#22c55e" stroke-width="2.5" opacity="0.9" />
          <text y="6" text-anchor="middle" font-size="15">🔗</text>
          <text y="-22" text-anchor="middle" font-size="11" font-weight="900" fill="#86efac" paint-order="stroke" stroke="#0f172a" stroke-width="3">연결만 (절단 ✕)</text>
        </g>`, 450, isAnimated);
      if (!this.alive(token)) return;
      if (startConn) startConn.animate([{ filter: 'drop-shadow(0 0 0 #fff)' }, { filter: 'drop-shadow(0 0 8px #fef08a)' }, { filter: 'drop-shadow(0 0 0 #fff)' }], { duration: 600 / this.speed });
      await this.sleep(450);
      if (!this.alive(token)) return;
    }

    // 배관 본체 (실물): 외곽 + 몸통 + 주름(CD관) 무늬
    const kind = PIPE_KIND[pipe.kind];
    const [g] = this.appendSvg(pipeLayer, `
      <g class="s5-pipe" data-pipe="${pipeIdx}" fill="none" stroke-linecap="butt" stroke-linejoin="round">
        <path class="s5-pipe-edge" d="${d}" stroke="#0f172a" stroke-width="16" opacity="0.55" />
        <path class="s5-pipe-body" d="${d}" stroke="${kind.color}" stroke-width="12" />
        ${pipe.kind === 'CD'
          ? `<path class="s5-pipe-ridge" d="${d}" stroke="#94a3b8" stroke-width="12" stroke-dasharray="2 3" opacity="0.75" />`
          : `<path class="s5-pipe-ridge" d="${d}" stroke="#4b5563" stroke-width="2.5" opacity="0.9" />`}
      </g>
    `);
    const parts = [...g.querySelectorAll('path')];
    if (isAnimated) {
      parts.forEach(p => { p.style.visibility = 'hidden'; });
      const body = g.querySelector('.s5-pipe-body');
      body.style.visibility = '';
      // ② 스프링 벤더 삽입 — 딱딱한 PE관이 꺾이는 코너에만 사용 (CD관은 주름관이라 손으로 구부림)
      const useSpring = pipe.kind === 'PE' && corners.length > 0;
      if (useSpring) {
        say(`② 꺾이는 코너 <b>${corners.length}곳</b>에 <b>스프링 벤더를 넣고</b> 천천히 구부립니다. (PE관 찌그러짐 방지)`);
      } else if (pipe.kind === 'CD') {
        say('② CD관(주름관)은 부드러워서 <b>스프링 벤더 없이</b> 손으로 구부려 밀어 넣습니다.');
      } else {
        say('② 곧은 배관이라 스프링 벤더 없이 바로 밀어 넣습니다.');
      }
      const springs = (useSpring ? corners : []).map(([cx, cy]) => `
        <g transform="translate(${cx}, ${cy})">
          <circle r="22" fill="none" stroke="#fef08a" stroke-width="2" stroke-dasharray="4,3" />
          <path d="M -14 -6 l 4 12 l 4 -12 l 4 12 l 4 -12 l 4 12 l 4 -12" fill="none" stroke="#e2e8f0" stroke-width="2.2" />
          <text y="-28" text-anchor="middle" font-size="11" font-weight="900" fill="#fef08a">스프링 벤더</text>
        </g>`).join('');
      const toolLayer = this.layer('tool-layer');
      const springEls = springs ? this.appendSvg(toolLayer, `<g>${springs}</g>`) : [];
      await this.drawStroke(body, 160);
      springEls.forEach(el => el.remove());
      if (!this.alive(token)) return;
      parts.forEach(p => { p.style.visibility = ''; });
      this.fadeIn(g.querySelector('.s5-pipe-edge'), 200);
    }

    // ③ 새들 체결 (가고정 ➜ 나머지 나사까지 본고정)
    if (isAnimated) {
      say('③ 새들 사이로 배관을 넣고 <b>나머지 나사까지 체결</b>해 단단히 고정합니다.');
    }
    this.fixSaddlesOfPipe(pipeIdx, isAnimated);
    if (isAnimated) {
      await this.sleep(400);
      if (!this.alive(token)) return;
    }

    // ④ 반대쪽 끝에서만 밀착 재단 후 커넥터 (TB 쪽은 50mm 앞에서 재단만)
    const end = pts[pts.length - 1];
    if (isAnimated && cutTarget !== 'tb') {
      await this.flushCut(pipe, pts[pts.length - 1], pts[pts.length - 2], cutTarget, say, token);
      if (!this.alive(token)) return;
      const endConn = this.svg.querySelector(`.s5-connector[data-pipe="${pipeIdx}"][data-end="${cutEnd}"]`);
      if (endConn) endConn.animate([{ filter: 'drop-shadow(0 0 0 #fff)' }, { filter: 'drop-shadow(0 0 8px #fef08a)' }, { filter: 'drop-shadow(0 0 0 #fff)' }], { duration: 600 / this.speed });
      await this.sleep(250);
    } else if (isAnimated) {
      say(pipe.clearance
        ? `④ <b>배관 커터</b>로 ${pipe.clearance} 단자대 50mm 앞에서 재단합니다. <b>TB 쪽은 커넥터 없이 마감!</b>`
        : '④ <b>배관 커터</b>로 길이에 맞게 재단한 뒤 <b>반대편 커넥터</b>에 끼웁니다.');
      await this.flashTool(`
        <g transform="translate(${end[0]}, ${end[1]})">
          <circle r="16" fill="#0f172a" stroke="#f97316" stroke-width="2" opacity="0.9" />
          <text y="6" text-anchor="middle" font-size="16">✂️</text>
          <text y="-22" text-anchor="middle" font-size="11" font-weight="900" fill="#fdba74">배관 커터</text>
        </g>`, 450, isAnimated);
      const endConn = this.svg.querySelector(`.s5-connector[data-pipe="${pipeIdx}"][data-end="end"]`);
      if (endConn) endConn.animate([{ filter: 'drop-shadow(0 0 0 #fff)' }, { filter: 'drop-shadow(0 0 8px #fef08a)' }, { filter: 'drop-shadow(0 0 0 #fff)' }], { duration: 600 / this.speed });
      await this.sleep(250);
    }
  }

  async installCable(pipeIdx, isAnimated, token) {
    const pipe = this.pipes[pipeIdx];
    const pipeLayer = this.layer('pipes-layer');
    const [bottom, top] = [pipe.points[0], pipe.points[pipe.points.length - 1]];  // (900,590) ➜ (900,140)
    const say = (stepHtml) => this.updateGuideMessage(`🔌 <b>[7단계: ③ 메인전원 케이블 장착]</b><br>${stepHtml}`);
    const wait = async (ms) => { if (isAnimated) await this.sleep(ms); return this.alive(token); };
    if (isAnimated) {
      await this.focusBox(820, 50, 980, 600, 90, 520);   // 🎥 TB1 ~ 제어함 케이블 구간으로 확대
      if (!this.alive(token)) return;
    }

    // TB1 단자 4개 (L1 갈 · L2 흑 · L3 회 · PE 녹황) — TB1 박스(845~955, 60~90) 하단
    const cores = [
      { x: 863, color: '#92400e', label: 'L1' },
      { x: 888, color: '#1e293b', label: 'L2' },
      { x: 912, color: '#64748b', label: 'L3' },
      { x: 937, color: '#15803d', stripe: '#eab308', label: 'PE' }
    ];

    // 1) 손 네 마디(약 10cm) 외피 탈피 ➜ TB1에 꽂기
    if (isAnimated) say('① 케이블 위쪽 끝 <b>손 네 마디(약 10cm) 외피를 벗기고</b> 4가닥(갈·흑·회·녹황)을 <b>TB1에 꽂습니다.</b>');
    const [cable] = this.appendSvg(pipeLayer, `
      <g class="s5-cable" data-pipe="${pipeIdx}">
        <path d="M ${bottom[0]} ${bottom[1]} L ${top[0]} ${top[1]}" stroke="#0f172a" stroke-width="13" opacity="0.55" fill="none" />
        <path class="s5-cable-sheath" d="M ${bottom[0]} ${bottom[1]} L ${top[0]} ${top[1]}" stroke="#334155" stroke-width="10" fill="none" />
        <path d="M ${bottom[0]} ${bottom[1]} L ${top[0]} ${top[1]}" stroke="${PIPE_KIND.CABLE.color}" stroke-width="2" stroke-dasharray="6 6" fill="none" opacity="0.8" />
        ${cores.map(c => `
          <path d="M ${top[0]} ${top[1]} L ${c.x} ${top[1] - 18} L ${c.x} 90" stroke="${c.color}" stroke-width="3" fill="none" />
          ${c.stripe ? `<path d="M ${top[0]} ${top[1]} L ${c.x} ${top[1] - 18} L ${c.x} 90" stroke="${c.stripe}" stroke-width="3" stroke-dasharray="4 4" fill="none" />` : ''}
        `).join('')}
      </g>
    `);
    if (isAnimated) {
      this.fadeIn(cable, 500);
      await this.flashTool(`
        <g transform="translate(${top[0] + 40}, ${top[1] - 25})">
          <rect x="0" y="-12" width="150" height="24" rx="5" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
          <text x="8" y="5" font-size="11" font-weight="900" fill="#86efac">✋ 손 네 마디(약 10cm) 탈피</text>
        </g>`, 700, isAnimated);
    }
    if (!await wait(100)) return;

    // 2) 상부 새들 고정 (케이블 맨 위 끝에서 50mm 아래)
    if (isAnimated) say('② <b>상부 소형 새들</b>(케이블 맨 위 끝에서 50mm 아래)을 고정합니다.');
    this.fixSaddleAt(pipeIdx, 190, isAnimated);
    if (!await wait(450)) return;

    // 3) 하부(제어함 인입부) 외피 탈피
    if (isAnimated) {
      say('③ 제어함 인입부에서도 <b>손 네 마디(약 10cm) 외피를 벗깁니다.</b>');
      await this.flashTool(`
        <g transform="translate(${bottom[0] + 40}, ${bottom[1] - 30})">
          <rect x="0" y="-12" width="150" height="24" rx="5" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
          <text x="8" y="5" font-size="11" font-weight="900" fill="#86efac">✋ 손 네 마디(약 10cm) 탈피</text>
        </g>`, 700, isAnimated);
    }
    if (!this.alive(token)) return;

    // 4) 케이블 커넥터 조립 (제어함 윗변)
    if (isAnimated) say('④ 제어함 윗변에 <b>케이블 커넥터</b>를 조립하고 케이블을 통과시킵니다.');
    const [conn] = this.appendSvg(this.layer('connectors-layer'), `
      <g class="s5-cable-connector" transform="translate(${bottom[0]}, ${bottom[1] + PANEL_OVERLAP})">
        <rect x="-14" y="-22" width="28" height="22" rx="4" fill="${PIPE_KIND.CABLE.color}" stroke="#0f172a" stroke-width="2" />
        <rect x="-14" y="-12" width="28" height="3" fill="#0f172a" opacity="0.4" />
        <g transform="translate(46, -12)">
          <rect x="-28" y="-10" width="56" height="20" rx="10" fill="#0f172a" stroke="${PIPE_KIND.CABLE.color}" stroke-width="2" />
          <text y="5" text-anchor="middle" font-size="10" font-weight="900" fill="#86efac">케이블 C</text>
        </g>
      </g>
    `);
    if (isAnimated) this.popIn(conn);
    if (!await wait(450)) return;

    // 5) 하부 새들 고정 (배전반 윗변에서 100mm 위)
    if (isAnimated) say('⑤ 마지막으로 <b>하부 소형 새들</b>(배전반 윗변에서 100mm 위)을 고정합니다.<br>🎯 TB1 핀맵: 갈(L1)·흑(L2)·회(L3)·녹황(PE) 순서 엄수!');
    this.fixSaddleAt(pipeIdx, 490, isAnimated);
    await wait(500);
  }

  /** 특정 배관의 특정 Y 위치 새들만 본고정 (케이블 상부/하부 새들 순서 재현) */
  fixSaddleAt(pipeIdx, y, isAnimated) {
    const b = [...this.svg.querySelectorAll(`.saddle-bracket[data-pipe="${pipeIdx}"]`)]
      .find(el => el.getAttribute('transform').includes(`, ${y})`));
    if (!b || b.querySelector('.s5-full-screw')) return;
    const [screw] = this.appendSvg(b, this.screwMarkup(-parseInt(b.dataset.side, 10), 'full'));
    if (isAnimated) this.popIn(screw, 200);
  }

  /**
   * 5단계 전체 자동 시연
   */
  async playAll() {
    // 진행 중이어도 처음부터 다시 (clearAll이 이전 시연을 멈춤 — 장면 이동·이전에서 다시 돌릴 때 필요)
    this.clearAll();
    this.isPlaying = true;
    const token = this.runToken;

    const steps = [this.runStep1, this.runStep2, this.runStep3, this.runStep4, this.runStep5, this.runStep6, this.runStep7];
    for (const step of steps) {
      await step.call(this, true, token);
      if (!this.alive(token)) return;
    }

    this.isPlaying = false;
  }

  /**
   * 배전반이 바뀌었을 때(4단계 재배선 등) 이미 고정된 배전반 그림을 최신 상태로 다시 그림
   */
  refreshBoardSnapshot() {
    if (this.currentStep >= 1) this.runStep1(false, ++this.runToken);
  }

  /**
   * 제도 및 기구 초기화
   */
  clearAll() {
    this.runToken++; // 진행 중인 애니메이션 중단
    this.isPlaying = false;
    this.currentStep = 0;
    ['drafting-lines-layer', 'saddle-marks-layer', 'control-box-layer', 'external-devices-layer', 'pipes-layer', 'connectors-layer', 'saddles-layer', 'labels-layer', 'tool-layer']
      .forEach(name => {
        const l = this.layer(name);
        if (l) l.innerHTML = '';
      });

    // 6단계(입선·결선) 레이어도 함께 비움 — 배관이 없는데 전선만 남지 않도록
    this.svg.querySelectorAll('[id^="s6-"]').forEach(l => { l.innerHTML = ''; });

    this.renderInitialGuide();
    this.updateGuideMessage("🪵 <b>[5단계 초기화]</b>: 깨끗한 벽면 합판입니다. 상단의 <b>'1. 🔩 배전반 고정'</b> 또는 <b>'▶ 전체 자동 시연'</b>을 눌러 작업을 시작하세요!");
  }

  updateGuideMessage(html) {
    const box = document.getElementById('step-guide-box');
    if (box) {
      box.innerHTML = html;
      box.style.animation = 'none';
      box.offsetHeight;
      box.style.animation = 'pulse-border 1.5s ease-in-out';
    }
    this.presenter?.mark(html);   // 수업용 진행 조절: 장면 번호 매기기
  }

  setSpeed(val) {
    this.speed = val;
  }
}
