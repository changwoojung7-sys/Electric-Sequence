/**
 * 메인 애플리케이션 컨트롤러
 */
import { problem01 } from './data/problem_01.js';
import { problem02 } from './data/problem_02.js';
import { problem03 } from './data/problem_03.js';
import { problem04 } from './data/problem_04.js';
import { problem05 } from './data/problem_05.js';
import { problem06 } from './data/problem_06.js';
import { problem07 } from './data/problem_07.js';
import { problem08 } from './data/problem_08.js';
import { problem09 } from './data/problem_09.js';
import { problem10 } from './data/problem_10.js';
import { problem11 } from './data/problem_11.js';
import { problem12 } from './data/problem_12.js';
import { problem13 } from './data/problem_13.js';
import { problem14 } from './data/problem_14.js';
import { problem15 } from './data/problem_15.js';
import { problem16 } from './data/problem_16.js';
import { problem17 } from './data/problem_17.js';
import { problem18 } from './data/problem_18.js';

// 구현된 공개문제 (번호 ➜ 데이터). 나머지 번호는 과제 선택에서 '준비 중'
const PROBLEMS = { 1: problem01, 2: problem02, 3: problem03, 4: problem04, 5: problem05, 6: problem06, 7: problem07, 8: problem08, 9: problem09, 10: problem10, 11: problem11, 12: problem12, 13: problem13, 14: problem14, 15: problem15, 16: problem16, 17: problem17, 18: problem18 };
import { centerMainCircuitLanes } from './components/main_lanes.js';
import { Stage1Board } from './stages/stage1_board.js';
import { Stage2MainCircuit } from './stages/stage2_main_circuit.js';
import { Stage3PinGrouping, pinBadgeMarkup } from './stages/stage3_pin_grouping.js';
import { Stage4Auxiliary } from './stages/stage4_auxiliary.js';
import { Stage5PipingDraft } from './stages/stage5_piping_draft.js';
import { Stage6Wiring } from './stages/stage6_wiring.js';
import { Stage7Operation } from './stages/stage7_operation.js';
import { Presenter } from './components/presenter.js';

class AppController {
  constructor() {
    // 과제 선택: 주소의 ?p=번호 (없거나 미구현이면 1번)
    const requested = parseInt(new URLSearchParams(location.search).get('p') || '1', 10);
    this.currentProblem = PROBLEMS[requested] || problem01;
    centerMainCircuitLanes(this.currentProblem);   // 주회로 가로 선로를 통로 중앙 쪽으로
    this.currentStage = 1;
    this.stage1Engine = null;
    this.stage2Engine = null;
    this.stage3Engine = null;
    this.stage4Engine = null;
    this.stage5Engine = null;
    this.stage6Engine = null;
    this.stage7Engine = null;

    // 줌 및 팬 상태 변수
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    this.init();
  }

  init() {
    const container = document.getElementById('board-stage-container');
    if (!container) return;

    // 1단계 엔진 초기화
    this.stage1Engine = new Stage1Board(container, this.currentProblem);
    // 1단계 4. 단자대 핀 마킹: 왼쪽 도면에 문제지 5쪽(배관 및 기구 배치도)을 띄워 배관도 위치와 함께 보기
    this.stage1Engine.onShowPiping = () => this.showPipingPage();

    // 이벤트 리스너 등록
    this.bindEvents();
    this.bindStage2Events();
    this.bindStage3Events();
    this.buildStage4Chips();
    this.bindStage4Events();
    // FLS 전극 최우선 결선이 없는 과제(10~18번 리밋스위치 과제)는 FLS 버튼 숨김
    if (!this.currentProblem.board.sequenceCircuit.flsPreWiring) {
      const flsBtn = document.getElementById('btn-stage4-fls');
      if (flsBtn) flsBtn.style.display = 'none';
    }
    // 수업용 진행 조절 (5·6단계 벽면 시연: 한 단계씩 멈춤 · 장면 번호로 이동)
    this.presenter = new Presenter({
      setFast: (on) => {
        const speed = on ? 40 : parseFloat(document.querySelector('.speed-btn.active')?.dataset.speed || '1.0');
        this.stage5Engine?.setSpeed(speed);
        this.stage6Engine?.setSpeed(speed);
      }
    });
    this.bindStage5Events();
    this.bindStage6Events();
    this.bindStage7Events();
    this.bindZoomPanEvents();
    this.bindLayoutEvents();
    this.bindLayoutSplitter();
    this.bindProblemSelect();
    this.bindDocViewer();

    // 시작 화면: 선택한 과제의 도면을 공식 도면 카드에 바로 표시하고 0단계(공개문제 보기)부터
    // (과제 선택·전체 초기화는 페이지를 다시 불러오므로 항상 여기서 시작)
    const blueprintImg = document.getElementById('blueprint-img');
    const modalImg = document.getElementById('modal-img');
    if (blueprintImg) blueprintImg.src = this.asset('board');
    if (modalImg) modalImg.src = this.asset('board');
    this.switchStage(0);
  }

  bindEvents() {
    // 1단계 툴바 버튼
    document.getElementById('btn-play-all')?.addEventListener('click', () => {
      this.showBoardPage();   // 시작은 문제지 6쪽 배치도 (4. 핀 마킹에서 5쪽 배관도로)
      this.stage1Engine.playAll();
    });

    document.getElementById('btn-draw-lines')?.addEventListener('click', () => {
      this.showBoardPage();
      this.stage1Engine.drawDraftingLines(true);
    });

    document.getElementById('btn-mount-comps')?.addEventListener('click', () => {
      this.showBoardPage();
      this.stage1Engine.mountComponents(true);
    });

    document.getElementById('btn-masking-tape')?.addEventListener('click', () => {
      this.showBoardPage();
      this.stage1Engine.applyMaskingTape(true);
    });

    document.getElementById('btn-terminal-marks')?.addEventListener('click', () => {
      this.stage1Engine.markTerminalBlocks(true);
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
      // 기판을 비우면 그 위의 주회로·보조회로 전선도 함께 제거
      this.stage2Engine?.clearWires();
      if (this.stage2Engine) this.stage2Engine.currentStep = 0;
      this.stage4Engine?.clearWires();
      this.stage1Engine.reset();
      this.showBoardPage();
      this.resetZoom();
    });

    // 전체 초기화: 모든 단계 작업을 처음 상태로 (페이지를 다시 불러 모든 엔진 상태를 깨끗하게 ➜ 0단계 공개문제 보기로)
    document.getElementById('btn-reset-all')?.addEventListener('click', () => {
      if (!confirm('1~7단계의 모든 작업을 지우고 0단계(공개문제 보기)로 돌아갈까요?')) return;
      location.reload();
    });

    // 1단계에서 2단계로 진행 버튼
    document.getElementById('btn-goto-stage2')?.addEventListener('click', () => {
      this.switchStage(2);
    });

    // 2단계에서 1단계로 복귀 버튼
    document.getElementById('btn-goto-stage1')?.addEventListener('click', () => {
      this.switchStage(1);
    });

    // 2단계에서 3단계로 진행 버튼
    document.getElementById('btn-goto-stage3')?.addEventListener('click', () => {
      this.switchStage(3);
    });

    // 3단계에서 2단계로 복귀 버튼
    document.getElementById('btn-goto-stage2-back')?.addEventListener('click', () => {
      this.switchStage(2);
    });

    // 3단계에서 4단계 진행 버튼
    document.getElementById('btn-goto-stage4')?.addEventListener('click', () => {
      this.switchStage(4);
    });

    // 배속 조절
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const speed = parseFloat(e.target.dataset.speed || '1.0');
        this.stage1Engine?.setSpeed(speed);
        this.stage2Engine?.setSpeed(speed);
        this.stage3Engine?.setSpeed(speed);
        this.stage4Engine?.setSpeed(speed);
        this.stage5Engine?.setSpeed(speed);
        this.stage6Engine?.setSpeed(speed);
        this.stage7Engine?.setSpeed(speed);
      });
    });

    // 도면 모달 열기 / 닫기
    const modal = document.getElementById('blueprint-modal');
    document.getElementById('blueprint-btn')?.addEventListener('click', () => {
      if (this.docMode) {
        const mi = document.getElementById('modal-img');
        const mt = document.getElementById('modal-title');
        if (mi) mi.src = this.docPagePath();
        if (mt) mt.textContent = `공개문제 ${String(this.currentProblem.id).padStart(2, '0')}번 문제지 ${this.docPage} / ${this.docPages}쪽`;
      }
      modal?.classList.add('active');
    });

    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });

    // 단계 탭 버튼 클릭 이벤트 (1단계 ~ 5단계 정식 지원)
    document.querySelectorAll('.stage-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const stage = parseInt(btn.dataset.stage || '1', 10);
        if (stage >= 0 && stage <= 7) {
          this.switchStage(stage);
        } else {
          alert(`현재 1단계~6단계(입선·결선)까지 구축되었습니다.\n다음 단계(${stage}단계)도 곧 공개됩니다!`);
        }
      });
    });

    // 부품 마우스오버 툴팁 이벤트
    this.bindTooltips();
  }

  /**
   * 2단계 주회로 전용 이벤트 리스너 등록
   */
  bindStage2Events() {
    document.getElementById('btn-stage2-play-all')?.addEventListener('click', () => {
      this.stage2Engine?.playAll();
    });

    document.getElementById('btn-stage2-step1')?.addEventListener('click', () => {
      this.stage2Engine?.runStep(1, true);
    });

    document.getElementById('btn-stage2-step2')?.addEventListener('click', () => {
      this.stage2Engine?.runStep(2, true);
    });

    document.getElementById('btn-stage2-step3')?.addEventListener('click', () => {
      this.stage2Engine?.runStep(3, true);
    });

    document.getElementById('btn-stage2-step4')?.addEventListener('click', () => {
      this.stage2Engine?.runStep(4, true);
    });

    document.getElementById('btn-stage2-step5')?.addEventListener('click', () => {
      this.stage2Engine?.runStep(5, true);
    });

    document.getElementById('btn-stage2-step6')?.addEventListener('click', () => {
      this.stage2Engine?.runStep(6, true);
    });

    document.getElementById('btn-stage2-clear')?.addEventListener('click', () => {
      this.stage2Engine?.clearWires();
      this.stage2Engine?.updateGuideMessage("⚡ <b>[2단계 주회로 결선]</b>: 전선이 초기화되었습니다. 아래 <b>'1. ⚡ PE 접지선 결선 (최우선)'</b> 버튼을 눌러보세요!");
    });

    // 상별 필터 버튼 이벤트
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const phase = e.target.dataset.phase || 'ALL';
        this.stage2Engine?.applyFilter(phase);
      });
    });
  }

  /**
   * 3단계 핀번호 & 그루핑 전용 이벤트 리스너 등록
   */
  bindStage3Events() {
    document.getElementById('btn-stage3-play-all')?.addEventListener('click', () => {
      this.stage3Engine?.playAll();
    });

    document.getElementById('btn-stage3-write-pins')?.addEventListener('click', () => {
      this.stage3Engine?.renderPinBadges(true);
    });

    document.getElementById('btn-stage3-ref-internal')?.addEventListener('click', () => {
      const modal = document.getElementById('blueprint-modal');
      const modalImg = document.getElementById('modal-img');
      const modalTitle = document.getElementById('modal-title');
      if (modal && modalImg && modalTitle) {
        modalImg.src = this.asset('internal');
        modalTitle.textContent = '공식 도면: 5) 기구의 내부 결선도 및 구성도 (EOCR, MC, 8P 소켓)';
        modal.classList.add('active');
      }
    });
  }

  /**
   * 4단계 보조회로 전용 이벤트 리스너 등록
   */
  bindStage4Events() {
    // 보조회로 전체 자동 배선
    document.getElementById('btn-stage4-play-all')?.addEventListener('click', () => {
      this.stage4Engine?.playAll();
    });

    // FLS 최우선 결선 버튼
    document.getElementById('btn-stage4-fls')?.addEventListener('click', () => {
      this.stage4Engine?.runGroup(0, true);
    });

    // 그룹 칩 클릭 (1 ~ 15) — 3단계 그루핑과 같은 색으로 표시
    const groupColorOf = (num) =>
      this.currentProblem.board.sequenceCircuit.groups.find(g => g.num === num)?.color || '#64748b';
    const chips = document.querySelectorAll('.stage4-group-chip');
    chips.forEach(b => { b.style.borderColor = groupColorOf(parseInt(b.dataset.group, 10)); });

    chips.forEach(btn => {
      btn.addEventListener('click', () => {
        chips.forEach(b => {
          b.style.borderColor = groupColorOf(parseInt(b.dataset.group, 10));
          b.style.background = '#1e293b';
        });
        btn.style.background = groupColorOf(parseInt(btn.dataset.group, 10));

        const gNum = parseInt(btn.dataset.group, 10);
        this.stage4Engine?.runGroup(gNum, true);
      });
    });

    // 배선한 보조회로 전체 보기
    document.getElementById('btn-stage4-show-all')?.addEventListener('click', () => {
      this.stage4Engine?.showOnlyGroup(null);
      chips.forEach(b => {
        b.style.borderColor = groupColorOf(parseInt(b.dataset.group, 10));
        b.style.background = '#1e293b';
      });
      this.stage4Engine?.updateGuideMessage("🌈 <b>[보조회로 전체 보기]</b>: 지금까지 배선한 모든 보조회로를 함께 보여줍니다. 번호 칩을 누르면 그 회로만 볼 수 있어요.");
    });

    // 벨 테스터 (도통 시험)
    document.getElementById('btn-stage4-tester')?.addEventListener('click', () => {
      this.stage4Engine?.testContinuity();
    });

    // 주회로 결선 숨김/표시 토글
    document.getElementById('btn-stage4-toggle-main')?.addEventListener('click', () => {
      const isVisible = this.stage4Engine?.toggleMainCircuit();
      if (!isVisible) {
        this.stage4Engine?.updateGuideMessage("👁️ <b>[주회로 결선 숨김]</b>: 주회로 선로를 숨겨 보조회로 황색 전선과 결선 경로를 선명하게 확인합니다.");
      } else {
        this.stage4Engine?.updateGuideMessage("👁️ <b>[주회로 결선 표시]</b>: 주회로와 보조회로가 함께 표시됩니다.");
      }
    });

    // 결선 진행 방향 화살표 & 순번 뱃지 토글
    document.getElementById('btn-stage4-toggle-dir')?.addEventListener('click', () => {
      const showDir = this.stage4Engine?.toggleDirections();
      if (showDir) {
        this.stage4Engine?.updateGuideMessage("🧭 <b>[방향·순번 뱃지 표시]</b>: 전선 위의 진행 방향 화살표와 단자 결선 순서 번호(①➜②➜③...)가 표시됩니다.");
      } else {
        this.stage4Engine?.updateGuideMessage("🧭 <b>[방향·순번 뱃지 숨김]</b>: 깔끔한 완성 배선 상태로 확인합니다.");
      }
    });

    // 배선 초기화
    document.getElementById('btn-stage4-clear')?.addEventListener('click', () => {
      this.stage4Engine?.clearWires();
      this.stage4Engine?.updateGuideMessage("↺ <b>[4단계 보조회로 배선 초기화]</b>: 전선이 리셋되었습니다. 상단의 <b>'▶ 보조회로 전체 자동 배선'</b> 또는 <b>'⚡ [최우선] FLS'</b>를 눌러 작업을 시작하세요!");
    });

    // 3단계로 복귀
    document.getElementById('btn-goto-stage3-back')?.addEventListener('click', () => {
      this.switchStage(3);
    });

    // 5단계 배관 제도 & 새들 진행
    document.getElementById('btn-goto-stage5')?.addEventListener('click', () => {
      this.switchStage(5);
    });
  }

  /**
   * 4단계 왼쪽 카드: 공식 도면 대신 3단계 핀번호·그루핑 시퀀스 도면 표시
   * - 4단계에서 번호(①~⑮, FLS)를 누르면 해당 전위 그룹 회로를 형광펜으로 강조, 전체 보기면 모든 그룹
   */
  setSequenceMini(on) {
    const wrapper = document.getElementById('blueprint-btn');
    const img = document.getElementById('blueprint-img');
    const title = document.querySelector('.blueprint-card .card-title');
    if (!wrapper || !img) return;
    let svg = document.getElementById('seq-mini-svg');
    if (on && !svg) {
      const sc = this.currentProblem.board.sequenceCircuit;
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'seq-mini-svg');
      svg.setAttribute('class', 'seq-mini');
      // 보조회로 부분(EOCR ~ GL)만 크게 보이도록 잘라서 표시
      svg.setAttribute('viewBox', '480 225 1220 650');
      svg.innerHTML = `
        <image href="${this.asset('sequence')}" x="0" y="0" width="1753" height="1240" />
        <g id="seq-mini-highlight"></g>
        <g>${sc.pinPlacements.map(p => `<g>${pinBadgeMarkup(p)}</g>`).join('')}</g>`;
      wrapper.insertBefore(svg, img);
    }
    if (svg) svg.style.display = on ? '' : 'none';
    img.style.display = on ? 'none' : '';
    if (title) title.innerHTML = on ? '📍 3단계 핀번호 · 그루핑 <small id="seq-mini-label" style="color:#94a3b8; font-weight:700;"></small>' : '📜 국가기술자격 공식 도면';
  }

  highlightSequenceGroup(groupNum) {
    const layer = document.getElementById('seq-mini-highlight');
    if (!layer) return;
    const sc = this.currentProblem.board.sequenceCircuit;
    const label = document.getElementById('seq-mini-label');
    const path = (d, color, width, opacity) =>
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />`;
    if (groupNum === null || groupNum === undefined) {
      layer.innerHTML = sc.groups.map(g => sc.groupPaths[g.num] ? path(sc.groupPaths[g.num], g.color, 12, 0.4) : '').join('');
      if (label) label.textContent = '— 전체 그룹';
    } else if (groupNum === 0 && sc.flsPreWiring) {
      layer.innerHTML = path(sc.flsPreWiring.path, sc.flsPreWiring.color, 20, 0.65);
      if (label) label.textContent = '— ⚡ FLS 전극선 (7·8·1 ➜ E1·E2·E3)';
    } else {
      const g = sc.groups.find(x => x.num === groupNum);
      layer.innerHTML = g && sc.groupPaths[g.num] ? path(sc.groupPaths[g.num], g.color, 20, 0.55) : '';
      if (label) label.textContent = g ? `— ${g.name}` : '';
    }
  }

  /**
   * 공식 도면 ↔ 작업 화면 크기 조절 (가운데 분할선을 좌우로 끌기, 더블클릭 = 기본 크기)
   * - 조절한 폭은 브라우저에 기억 (저장 불가 환경이면 기본값)
   */
  bindLayoutSplitter() {
    const layout = document.querySelector('.main-layout');
    const splitter = document.getElementById('layout-splitter');
    if (!layout || !splitter) return;
    const DEFAULT_W = 400;
    const KEY = 'es-side-width';
    const apply = (w) => {
      const max = Math.max(320, layout.clientWidth - 520);   // 작업 화면은 최소 520px 확보
      const width = Math.round(Math.min(max, Math.max(240, w)));
      layout.style.setProperty('--side-w', `${width}px`);
      return width;
    };
    try {
      const saved = parseFloat(localStorage.getItem(KEY));
      if (saved) apply(saved);
    } catch (e) { /* 저장소 사용 불가 */ }

    let dragging = false;
    splitter.addEventListener('pointerdown', (e) => {
      dragging = true;
      e.preventDefault();
      document.body.classList.add('resizing');
    });
    // 드래그 중에는 손잡이 밖으로 빨리 움직여도 따라오도록 창 전체에서 이동을 받음
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const left = layout.getBoundingClientRect().left + parseFloat(getComputedStyle(layout).paddingLeft);
      apply(e.clientX - left - 7);
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('resizing');
      try {
        localStorage.setItem(KEY, parseFloat(getComputedStyle(layout).getPropertyValue('--side-w')) || DEFAULT_W);
      } catch (e) { /* 저장소 사용 불가 */ }
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    splitter.addEventListener('dblclick', () => {
      apply(DEFAULT_W);
      try { localStorage.removeItem(KEY); } catch (e) { /* 저장소 사용 불가 */ }
    });
  }

  /** 과제별 도면 이미지 경로 (board · sequence · internal · piping) */
  asset(key) {
    const fallback = { board: 'board_layout', sequence: 'sequence_diagram', internal: 'internal_wiring', piping: 'piping_layout' };
    return this.currentProblem.assets?.[key] || `assets/images/${fallback[key]}.png`;
  }

  /** 과제 선택 드롭다운: 구현된 과제만 선택 가능, 바꾸면 그 과제로 처음부터 */
  bindProblemSelect() {
    const select = document.getElementById('problem-select');
    if (!select) return;
    [...select.options].forEach(o => {
      const ready = !!PROBLEMS[o.value];
      o.disabled = !ready;
      if (!ready && !o.textContent.includes('준비 중')) o.textContent += ' — 준비 중';
    });
    select.value = String(this.currentProblem.id);
    select.addEventListener('change', () => {
      location.search = `?p=${select.value}`;
    });
  }

  /** 1 ➜ ①, 14 ➜ ⑭ */
  circled(n) {
    return String.fromCharCode(0x2460 + n - 1);
  }

  /** 4단계 전위 루프 칩을 과제의 그룹 수에 맞게 다시 만듦 */
  buildStage4Chips() {
    const first = document.querySelector('.stage4-group-chip');
    if (!first) return;
    const box = first.parentElement;
    const style = first.getAttribute('style');
    box.querySelectorAll('.stage4-group-chip').forEach(b => b.remove());
    const allBtn = document.getElementById('btn-stage4-show-all');
    this.currentProblem.board.sequenceCircuit.groups.forEach(g => {
      const b = document.createElement('button');
      b.className = 'stage4-group-chip';
      b.dataset.group = g.num;
      b.setAttribute('style', style);
      b.title = g.name;
      b.textContent = this.circled(g.num);
      box.insertBefore(b, allBtn);
    });
  }

  /**
   * 0단계 · 공개문제 문제지 전체 보기 (페이지 넘김)
   * - 왼쪽 공식 도면 카드에서 '📄 문제지 전체'로 언제든 페이지를 넘겨 볼 수 있고,
   *   0단계 탭에서는 메인 화면에도 같은 페이지를 크게 표시
   * - 페이지 이미지: assets/problems/NN/page-XX.png (PDF에서 미리 변환, 오프라인 구동)
   */
  bindDocViewer() {
    this.docPage = 1;
    this.docPages = 11;
    this.docMode = false;
    fetch('assets/problems/manifest.json').then(r => r.json()).then(m => {
      this.docPages = m[String(this.currentProblem.id)] || this.docPages;
      this.updateDocView();
    }).catch(() => { /* 기본 11쪽 */ });

    document.querySelectorAll('.doc-prev').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); this.gotoDocPage(this.docPage - 1); }));
    document.querySelectorAll('.doc-next').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); this.gotoDocPage(this.docPage + 1); }));
    document.getElementById('btn-doc-toggle')?.addEventListener('click', () => this.setDocMode(!this.docMode));
    window.addEventListener('keydown', (e) => {
      if (!this.docMode || e.target.closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') this.gotoDocPage(this.docPage + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') this.gotoDocPage(this.docPage - 1);
    });
  }

  updateGuideMessage(html) {
    const box = document.getElementById('step-guide-box');
    if (box) box.innerHTML = html;
  }

  docPagePath(page = this.docPage) {
    return `assets/problems/${String(this.currentProblem.id).padStart(2, '0')}/page-${String(page).padStart(2, '0')}.png`;
  }

  /** 왼쪽 도면을 문제지 6쪽(2) 제어판 내부 기구 배치도 · 단자대)으로 — 18과제 모두 6쪽 */
  showBoardPage() {
    this.docPage = 6;
    if (!this.docMode) this.setDocMode(true);
    else this.updateDocView();
  }

  /** 왼쪽 도면을 문제지 5쪽(1) 배관 및 기구 배치도)으로 — 18과제 모두 5쪽 */
  showPipingPage() {
    this.docPage = 5;
    if (!this.docMode) this.setDocMode(true);
    else this.updateDocView();
  }

  gotoDocPage(page) {
    this.docPage = Math.min(this.docPages, Math.max(1, page));
    this.updateDocView();
  }

  setDocMode(on) {
    this.docMode = on;
    const card = document.querySelector('.blueprint-card');
    card?.classList.toggle('doc-mode', on);
    const btn = document.getElementById('btn-doc-toggle');
    if (btn) btn.textContent = on ? '📜 단계 도면으로' : '📄 문제지 전체';
    const img = document.getElementById('blueprint-img');
    if (img) {
      if (on) {
        if (!img.dataset.stageSrc) img.dataset.stageSrc = img.getAttribute('src');
      } else if (img.dataset.stageSrc) {
        img.src = img.dataset.stageSrc;
        delete img.dataset.stageSrc;
      }
    }
    // 4단계 핀번호 미니 도면이 떠 있으면 문제지를 볼 때는 잠시 숨김
    const mini = document.getElementById('seq-mini-svg');
    if (mini) mini.style.display = on || this.currentStage !== 4 ? 'none' : '';
    if (img && this.currentStage === 4 && !on && mini) img.style.display = 'none';
    else if (img) img.style.display = '';
    this.updateDocView();
  }

  updateDocView() {
    const label = `${this.docPage} / ${this.docPages}`;
    document.querySelectorAll('.doc-page-label').forEach(el => { el.textContent = label; });
    const main = document.getElementById('doc-page-main');
    if (main) main.src = this.docPagePath();
    if (this.docMode) {
      const img = document.getElementById('blueprint-img');
      if (img) img.src = this.docPagePath();
    }
  }

  /**
   * 7단계 동작 테스트 이벤트 리스너 등록
   */
  bindStage7Events() {
    // 문제지 '4) 제어회로의 동작 사항' 단계별 테스트
    document.getElementById('btn-stage7-all')?.addEventListener('click', () => this.stage7Engine?.runAllSteps());
    document.getElementById('btn-stage7-next')?.addEventListener('click', () => this.stage7Engine?.runNextStep());
    document.getElementById('btn-stage7-reset')?.addEventListener('click', () => this.stage7Engine?.resetAll());
    document.getElementById('btn-goto-stage6-back')?.addEventListener('click', () => this.switchStage(6));
    document.getElementById('btn-goto-stage7')?.addEventListener('click', () => this.switchStage(7));
  }

  /**
   * 화면 공간 확보: 단계 버튼 접기 · 크게 보기(집중 모드, 단축키 F / Esc)
   */
  bindLayoutEvents() {
    const toolbarBtn = document.getElementById('btn-toggle-toolbar');
    const focusBtn = document.getElementById('btn-focus-mode');

    const setToolbarCollapsed = (collapsed) => {
      document.body.classList.toggle('toolbar-collapsed', collapsed);
      if (toolbarBtn) toolbarBtn.textContent = collapsed ? '▼ 도구 펼치기' : '▲ 도구 접기';
    };
    const setFocusMode = (on) => {
      document.body.classList.toggle('focus-mode', on);
      if (focusBtn) focusBtn.textContent = on ? '✕ 크게 보기 끝 (Esc)' : '⛶ 크게 보기';
    };

    toolbarBtn?.addEventListener('click', () => {
      setToolbarCollapsed(!document.body.classList.contains('toolbar-collapsed'));
    });
    focusBtn?.addEventListener('click', () => {
      setFocusMode(!document.body.classList.contains('focus-mode'));
    });

    // 단축키: F = 크게 보기 전환, Esc = 크게 보기 끝 (입력 중에는 무시)
    window.addEventListener('keydown', (e) => {
      if (e.target.closest('input, select, textarea')) return;
      if (e.key === 'f' || e.key === 'F') {
        setFocusMode(!document.body.classList.contains('focus-mode'));
      } else if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) {
        setFocusMode(false);
      }
    });

    // 작업대 설명 줄은 화면 공간 확보를 위해 숨기고, 제목에 마우스를 올리면 보이도록 title로 복사
    const descEl = document.querySelector('.workbench-title-group p');
    const titleEl = document.querySelector('.workbench-title-group h2');
    if (descEl && titleEl) {
      const syncDesc = () => { titleEl.title = descEl.textContent; };
      syncDesc();
      new MutationObserver(syncDesc).observe(descEl, { childList: true, characterData: true, subtree: true });
    }

    // 크게 보기 모드에서는 사이드바가 숨겨지므로 꿀팁 안내를 미니 창에 그대로 복사
    const guide = document.getElementById('step-guide-box');
    const mirror = document.getElementById('focus-guide-box');
    if (guide && mirror) {
      const sync = () => { mirror.innerHTML = guide.innerHTML; };
      sync();
      new MutationObserver(sync).observe(guide, { childList: true, subtree: true, characterData: true });
    }
    document.getElementById('focus-guide-toggle')?.addEventListener('click', (e) => {
      const box = document.getElementById('focus-guide');
      box?.classList.toggle('collapsed');
      e.currentTarget.textContent = box?.classList.contains('collapsed') ? '💡 안내 ▸' : '💡 안내 ▾';
    });
  }

  /** 벽면 시연 시작: 진행 조절기에 '처음부터 다시 돌리기' 함수를 알려 두고 실행 (장면 이동·이전에 사용) */
  present(key, run) {
    this.presenter?.start(key, run);
    run();
  }

  /**
   * 6단계 외부단자 가조립 · 입선 · 결선 · 박스 뚜껑 이벤트 리스너 등록
   */
  bindStage6Events() {
    document.getElementById('btn-stage6-play-all')?.addEventListener('click', () => {
      this.present('s6-all', () => this.stage6Engine?.playAll());
    });
    // 1. 외부단자 가조립
    document.getElementById('btn-stage6-step1')?.addEventListener('click', () => {
      this.present('s6-1', () => this.stage6Engine?.runStep1(true));
    });
    // 2. 전선 입선 (먼 쪽 배관부터)
    document.getElementById('btn-stage6-step2')?.addEventListener('click', () => {
      this.present('s6-2', () => this.stage6Engine?.runStep2(true));
    });
    // 3. 양쪽 선 탈피 및 결선 (공통선 먼저)
    document.getElementById('btn-stage6-step3')?.addEventListener('click', () => {
      this.present('s6-3', () => this.stage6Engine?.runStep3(true));
    });
    // 4. 박스 뚜껑 결합
    document.getElementById('btn-stage6-step4')?.addEventListener('click', () => {
      this.present('s6-4', () => this.stage6Engine?.runStep4(true));
    });
    // 입선 초기화 (5단계 배관은 그대로)
    document.getElementById('btn-stage6-clear')?.addEventListener('click', () => {
      this.stage6Engine?.clearAll();
      this.stage6Engine?.updateGuideMessage("↺ <b>[6단계 입선 초기화]</b>: 배관만 설치된 상태로 돌아갔습니다. <b>'1. 🔧 외부단자 가조립'</b>부터 다시 시작하세요!");
    });
    // 5단계로 복귀
    document.getElementById('btn-goto-stage5-back')?.addEventListener('click', () => {
      this.switchStage(5);
    });
  }

  /**
   * 벽면 단계(5·6) 공통 준비: 1·2·4단계 배전반을 완성하고 5단계 벽면 엔진을 준비
   */
  /**
   * 7단계 벽면 보기용: 5단계 배관 설치·6단계 입선·결선·뚜껑까지 끝난 벽면 엔진을 돌려줌
   * - 아직 안 했으면 애니메이션 없이 즉시 완성 (7단계 화면은 그대로)
   */
  async buildWallForOperation() {
    this.prepareWallStage();
    if (!this.stage5Engine) return null;
    if (this.stage5Engine.currentStep < 7) await this.stage5Engine.runStep7(false);
    if (!this.stage6Engine) this.stage6Engine = new Stage6Wiring(this.stage5Engine, this.currentProblem);
    if (this.stage6Engine.currentStep < 4) await this.stage6Engine.runStep4(false);
    return this.stage5Engine;
  }

  prepareWallStage() {
    const pipingContainer = document.getElementById('piping-stage-container');
    // 5단계 벽면에는 4단계에서 완성한 배전반을 그대로 고정 → 1·2·4단계가 덜 끝났으면 즉시 완성
    if (this.stage1Engine.currentSubStep < 4) {
      this.stage1Engine.drawDraftingLines(false);
      this.stage1Engine.mountComponents(false);
      this.stage1Engine.applyMaskingTape(false);
      this.stage1Engine.markTerminalBlocks(false);
    }
    const boardSvg = document.getElementById('board-svg');
    if (boardSvg && !this.stage2Engine) {
      this.stage2Engine = new Stage2MainCircuit(boardSvg, this.currentProblem);
    }
    if (this.stage2Engine && this.stage2Engine.currentStep < 6) {
      for (let s = 1; s <= 6; s++) {
        this.stage2Engine.runStep(s, false);
      }
    }
    if (boardSvg && !this.stage4Engine) {
      this.stage4Engine = new Stage4Auxiliary(boardSvg, this.currentProblem);
    }
    this.stage4Engine?.completeAllInstantly();

    // 5단계 엔진 초기화 (이미 배전반을 고정한 상태라면 최신 배전반으로 다시 그림)
    if (pipingContainer && !this.stage5Engine) {
      this.stage5Engine = new Stage5PipingDraft(pipingContainer, this.currentProblem);
      this.stage5Engine.presenter = this.presenter;
    } else {
      this.stage5Engine?.refreshBoardSnapshot();
    }
  }

  /**
   * 5단계 배관 제도 & 새들 전용 이벤트 리스너 등록
   */
  bindStage5Events() {
    // 5단계 전체 자동 시연
    document.getElementById('btn-stage5-play-all')?.addEventListener('click', () => {
      this.present('s5-all', () => this.stage5Engine?.playAll());
    });

    // 1. 배전반 고정 (4x24 나사 4개)
    document.getElementById('btn-stage5-step1')?.addEventListener('click', () => {
      this.present('s5-1', () => this.stage5Engine?.runStep1(true));
    });

    // 2. 수평선 및 배관선 긋기 (먹줄)
    document.getElementById('btn-stage5-step2')?.addEventListener('click', () => {
      this.present('s5-2', () => this.stage5Engine?.runStep2(true));
    });

    // 3. 외부단자 및 새들 마킹 (커버 대기법)
    document.getElementById('btn-stage5-step3')?.addEventListener('click', () => {
      this.present('s5-3', () => this.stage5Engine?.runStep3(true));
    });

    // 4. 외부기구 고정 (단자대 4개, J박스 1개, 2구 박스 4개)
    document.getElementById('btn-stage5-step4')?.addEventListener('click', () => {
      this.present('s5-4', () => this.stage5Engine?.runStep4(true));
    });

    // 5. 전체 새들 1차 고정 (바깥쪽 1개씩)
    document.getElementById('btn-stage5-step5')?.addEventListener('click', () => {
      this.present('s5-5', () => this.stage5Engine?.runStep5(true));
    });

    // 🎥 따라가며 보기 (시연 중 작업 부분으로 확대·이동) — 5·6단계 공통 설정
    const toggleFollow = () => {
      if (!this.stage5Engine) return;
      this.stage5Engine.follow = !this.stage5Engine.follow;
      ['btn-stage5-follow', 'btn-stage6-follow'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.innerHTML = `<span>🎥</span> 따라가며 보기 ${this.stage5Engine.follow ? 'ON' : 'OFF'}`;
        btn.classList.toggle('btn-primary', this.stage5Engine.follow);
      });
      if (!this.stage5Engine.follow) this.stage5Engine.resetZoom();
    };
    document.getElementById('btn-stage5-follow')?.addEventListener('click', toggleFollow);
    document.getElementById('btn-stage6-follow')?.addEventListener('click', toggleFollow);

    // 6. 배관 커넥터 접속 (PE·CD, TB 단자대 쪽 제외)
    document.getElementById('btn-stage5-step6')?.addEventListener('click', () => {
      this.present('s5-6', () => this.stage5Engine?.runStep6(true));
    });

    // 7. 배관 설치 4단계 루틴 & ③ 메인전원 케이블 장착
    document.getElementById('btn-stage5-step7')?.addEventListener('click', () => {
      this.present('s5-7', () => this.stage5Engine?.runStep7(true));
    });

    // 제도 초기화
    document.getElementById('btn-stage5-clear')?.addEventListener('click', () => {
      this.stage5Engine?.clearAll();
    });

    // 4단계로 복귀
    document.getElementById('btn-goto-stage4-back')?.addEventListener('click', () => {
      this.switchStage(4);
    });

    // 6단계 진행 안내
    document.getElementById('btn-goto-stage6')?.addEventListener('click', () => {
      this.switchStage(6);
    });
  }

  /**
   * 단계 전환 컨트롤러 (Stage 1 <-> Stage 2 <-> Stage 3)
   */
  switchStage(stageNum) {
    // 문제지 보기 중이었다면 단계 도면으로 먼저 되돌린 뒤 전환 (0단계는 문제지 보기 유지)
    if (this.docMode && stageNum !== 0) this.setDocMode(false);
    this.currentStage = stageNum;
    const docContainer = document.getElementById('doc-stage-container');
    if (docContainer) docContainer.style.display = stageNum === 0 ? 'flex' : 'none';

    // 1. 파이프라인 탭 활성화 상태 변경
    document.querySelectorAll('.stage-step').forEach(btn => {
      const s = parseInt(btn.dataset.stage || '1', 10);
      btn.classList.toggle('active', s === stageNum);
    });

    const stage1Toolbar = document.getElementById('stage1-toolbar');
    const stage2Toolbar = document.getElementById('stage2-toolbar');
    const stage3Toolbar = document.getElementById('stage3-toolbar');
    const stage4Toolbar = document.getElementById('stage4-toolbar');
    const stage5Toolbar = document.getElementById('stage5-toolbar');
    const boardContainer = document.getElementById('board-stage-container');
    const sequenceContainer = document.getElementById('sequence-stage-container');
    const pipingContainer = document.getElementById('piping-stage-container');
    const zoomControls = document.querySelector('.zoom-controls');

    const headerTitle = document.querySelector('.workbench-title-group h2');
    const headerDesc = document.querySelector('.workbench-title-group p');
    const blueprintImg = document.getElementById('blueprint-img');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');

    const stage6Toolbar = document.getElementById('stage6-toolbar');
    if (stage6Toolbar) stage6Toolbar.style.display = stageNum === 6 ? 'flex' : 'none';
    const stage7Toolbar = document.getElementById('stage7-toolbar');
    if (stage7Toolbar) stage7Toolbar.style.display = stageNum === 7 ? 'flex' : 'none';
    const operationContainer = document.getElementById('operation-stage-container');
    if (operationContainer) operationContainer.style.display = stageNum === 7 ? 'flex' : 'none';
    if (stageNum !== 7) this.stage7Engine?.stop();
    this.presenter?.setVisible(stageNum === 5 || stageNum === 6);
    this.setSequenceMini(stageNum === 4);

    // 벽면 단계(5·6)에서는 기판 전용 TB5/TB6 포커스 버튼 숨김, 줌 배율 표시는 해당 화면 기준으로
    const isWall = stageNum === 5 || stageNum === 6;
    ['btn-focus-tb5', 'btn-focus-tb6'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.style.display = isWall ? 'none' : '';
    });
    const zoomLabelEl = document.getElementById('zoom-level-label');
    if (zoomLabelEl) {
      zoomLabelEl.textContent = isWall
        ? `${Math.round((this.stage5Engine?.zoomLevel || 1) * 100)}%`
        : `${Math.round(this.zoomLevel * 100)}%`;
    }

    // 4단계 전용 레이어(황색 보조회로선·방향 뱃지)와 주회로 숨김 상태가 다른 단계에 남지 않도록 정리
    if (stageNum !== 4) {
      ['aux-circuit-wire-layer', 'aux-direction-layer', 'aux-tester-effect-layer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      const mainLayer = document.getElementById('main-circuit-wire-layer');
      if (mainLayer) mainLayer.style.display = '';
    }

    if (stageNum === 0) {
      // 0단계: 공개문제 문제지 전체 보기 (메인 화면 크게 + 왼쪽 카드 페이지 넘김)
      document.querySelectorAll('.action-toolbar').forEach(t => { t.style.display = 'none'; });
      [boardContainer, sequenceContainer, pipingContainer].forEach(c => { if (c) c.style.display = 'none'; });
      if (zoomControls) zoomControls.style.display = 'none';
      if (headerTitle) headerTitle.textContent = `📄 공개문제 ${String(this.currentProblem.id).padStart(2, '0')}번 문제지 전체 보기`;
      if (headerDesc) headerDesc.textContent = '요구사항 · 수험자 유의사항 · 도면(배관/기구 배치, 제어판 배치, 시퀀스 회로, 동작 사항, 내부 결선도) 전체를 페이지 넘겨 확인';
      this.setDocMode(true);
      this.updateGuideMessage?.('📄 <b>[0단계: 공개문제 보기]</b><br>작업 전에 문제지 전체를 먼저 읽어 보세요! <b>◀ ▶</b> 버튼이나 <b>← →</b> 키로 페이지를 넘길 수 있어요.<br>다른 단계에서도 왼쪽 <b>📄 문제지 전체</b> 버튼으로 언제든 다시 볼 수 있어요.');
    } else if (stageNum === 1) {
      // 1단계 UI 활성화
      if (stage1Toolbar) stage1Toolbar.style.display = 'flex';
      if (stage2Toolbar) stage2Toolbar.style.display = 'none';
      if (stage3Toolbar) stage3Toolbar.style.display = 'none';
      if (stage4Toolbar) stage4Toolbar.style.display = 'none';
      if (stage5Toolbar) stage5Toolbar.style.display = 'none';

      if (boardContainer) boardContainer.style.display = 'flex';
      if (sequenceContainer) sequenceContainer.style.display = 'none';
      if (pipingContainer) pipingContainer.style.display = 'none';
      if (zoomControls) zoomControls.style.display = 'flex';

      if (headerTitle) headerTitle.textContent = '🪵 제어판 기구 배치 시뮬레이터 (400mm × 420mm)';
      if (headerDesc) headerDesc.textContent = '치수선 제도 → 기구 부착(홈 방향 확인) → 마스킹 테이프 이름표 → 배관도 단자대 마킹';

      if (blueprintImg) blueprintImg.src = this.asset('board');
      if (modalImg) modalImg.src = this.asset('board');
      if (modalTitle) modalTitle.textContent = '공식 도면: 2) 제어판 내부 기구 배치도';

      this.stage1Engine?.updateGuideMessage("🪵 <b>[1단계 기구 배치]</b>: 치수선 긋기, 기구 부착, 마스킹 테이프 부착, 배관도 기반 단자대 핀 마킹을 진행하세요.");
    } else if (stageNum === 2) {
      // 2단계 UI 활성화
      if (stage1Toolbar) stage1Toolbar.style.display = 'none';
      if (stage2Toolbar) stage2Toolbar.style.display = 'flex';
      if (stage3Toolbar) stage3Toolbar.style.display = 'none';
      if (stage4Toolbar) stage4Toolbar.style.display = 'none';
      if (stage5Toolbar) stage5Toolbar.style.display = 'none';

      if (boardContainer) boardContainer.style.display = 'flex';
      if (sequenceContainer) sequenceContainer.style.display = 'none';
      if (pipingContainer) pipingContainer.style.display = 'none';
      if (zoomControls) zoomControls.style.display = 'flex';

      if (headerTitle) headerTitle.textContent = '⚡ 제어판 주회로 결선 시뮬레이터 (KEC 규정 배선)';
      if (headerDesc) headerDesc.textContent = 'PE 접지선 최우선 ➜ TB1 전원인입 ➜ MCCB ➜ EOCR ➜ 퓨즈 1차 ➜ MC1/MC2 병렬 ➜ TB2/TB3 모터';

      if (blueprintImg) blueprintImg.src = this.asset('sequence');
      if (modalImg) modalImg.src = this.asset('sequence');
      if (modalTitle) modalTitle.textContent = '공식 도면: 3) 시퀀스 회로도 (주회로 결선)';

      // 1단계 기판 상태가 완성되어 있지 않다면 즉시 완성 상태로 로드
      if (this.stage1Engine.currentSubStep < 4) {
        this.stage1Engine.drawDraftingLines(false);
        this.stage1Engine.mountComponents(false);
        this.stage1Engine.applyMaskingTape(false);
        this.stage1Engine.markTerminalBlocks(false);
      }

      // 2단계 엔진 초기화
      const svg = document.getElementById('board-svg');
      if (svg && !this.stage2Engine) {
        this.stage2Engine = new Stage2MainCircuit(svg, this.currentProblem);
      }

      this.stage2Engine?.updateGuideMessage("⚡ <b>[2단계 주회로 결선 시작!]</b><br>실기 시험의 정석대로 <b>보호도체(PE) 접지선(녹황색)을 가장 먼저 결선</b>합니다!<br>아래 <b>'1. ⚡ PE 접지선 결선 (최우선)'</b> 버튼을 누르거나 <b>'▶ 주회로 전체 결선 시연'</b>을 눌러보세요!");
    } else if (stageNum === 3) {
      // 3단계 UI 활성화
      if (stage1Toolbar) stage1Toolbar.style.display = 'none';
      if (stage2Toolbar) stage2Toolbar.style.display = 'none';
      if (stage3Toolbar) stage3Toolbar.style.display = 'flex';
      if (stage4Toolbar) stage4Toolbar.style.display = 'none';
      if (stage5Toolbar) stage5Toolbar.style.display = 'none';

      if (boardContainer) boardContainer.style.display = 'none';
      if (sequenceContainer) sequenceContainer.style.display = 'flex';
      if (pipingContainer) pipingContainer.style.display = 'none';
      if (zoomControls) zoomControls.style.display = 'none'; // 3단계는 회로도 뷰어가 채움

      if (headerTitle) headerTitle.textContent = `📜 시퀀스 회로도 핀번호 부여 & 전위 그루핑 (Grouping ① ~ ${this.circled(this.currentProblem.board.sequenceCircuit.groups.length)})`;
      if (headerDesc) headerDesc.textContent = `회로도 접점 핀번호 표기 → 내부결선도 대조 → ${this.currentProblem.board.sequenceCircuit.groups.length}대 전위 그루핑 + FLS 최우선 직결 결선`;

      if (blueprintImg) blueprintImg.src = this.asset('internal');
      if (modalImg) modalImg.src = this.asset('internal');
      if (modalTitle) modalTitle.textContent = '공식 도면: 5) 기구의 내부 결선도 및 구성도 (EOCR, MC, 8P 소켓)';

      // 3단계 엔진 초기화
      if (sequenceContainer && !this.stage3Engine) {
        this.stage3Engine = new Stage3PinGrouping(sequenceContainer, this.currentProblem);
      }

      this.stage3Engine?.updateGuideMessage(`📜 <b>[3단계 핀번호 & 그루핑 시작!]</b><br>보조회로 배선의 성패를 가르는 <b>핀번호 넘버링과 ${this.currentProblem.board.sequenceCircuit.groups.length}개 동그라미 전위 그루핑</b>입니다.<br>위의 ${this.currentProblem.board.sequenceCircuit.flsPreWiring ? "<b>'⚡ [최우선 결선] FLS'</b> 또는 " : ''}<b>'동그라미 그루핑(①~${this.circled(this.currentProblem.board.sequenceCircuit.groups.length)})'</b> 번호를 클릭해 보세요!`);
    } else if (stageNum === 4) {
      // 4단계 UI 활성화
      if (stage1Toolbar) stage1Toolbar.style.display = 'none';
      if (stage2Toolbar) stage2Toolbar.style.display = 'none';
      if (stage3Toolbar) stage3Toolbar.style.display = 'none';
      if (stage4Toolbar) stage4Toolbar.style.display = 'flex';
      if (stage5Toolbar) stage5Toolbar.style.display = 'none';

      if (boardContainer) boardContainer.style.display = 'flex';
      if (sequenceContainer) sequenceContainer.style.display = 'none';
      if (pipingContainer) pipingContainer.style.display = 'none';
      if (zoomControls) zoomControls.style.display = 'flex';

      if (headerTitle) headerTitle.textContent = '🟡 제어판 보조회로 배선 시뮬레이터 (황색 KIV 1.5㎟)';
      if (headerDesc) headerDesc.textContent = `${this.currentProblem.board.sequenceCircuit.flsPreWiring ? 'FLS 최우선 결선 ➜ ' : ''}${this.currentProblem.board.sequenceCircuit.groups.length}대 전위 그루핑 루핑(1단자 2선 원칙) ➜ 벨 테스터 도통 시험`;

      if (blueprintImg) blueprintImg.src = this.asset('sequence');
      if (modalImg) modalImg.src = this.asset('sequence');
      if (modalTitle) modalTitle.textContent = '공식 도면: 3) 시퀀스 회로도 (보조회로 결선)';

      // 1단계 기판 상태 미완성 시 즉시 완성 로드
      if (this.stage1Engine.currentSubStep < 4) {
        this.stage1Engine.drawDraftingLines(false);
        this.stage1Engine.mountComponents(false);
        this.stage1Engine.applyMaskingTape(false);
        this.stage1Engine.markTerminalBlocks(false);
      }

      // 2단계 주회로 배선 상태 로드
      const svg = document.getElementById('board-svg');
      if (svg && !this.stage2Engine) {
        this.stage2Engine = new Stage2MainCircuit(svg, this.currentProblem);
      }
      // 주회로 전선이 깔려있지 않다면 즉시 완성 상태로 로드
      if (this.stage2Engine && this.stage2Engine.currentStep < 6) {
        for (let s = 1; s <= 6; s++) {
          this.stage2Engine.runStep(s, false);
        }
      }

      // 4단계 엔진 초기화
      if (svg && !this.stage4Engine) {
        this.stage4Engine = new Stage4Auxiliary(svg, this.currentProblem);
      }
      if (this.stage4Engine) {
        this.stage4Engine.onGroupChange = (n) => this.highlightSequenceGroup(n);
        this.highlightSequenceGroup(this.stage4Engine.visibleGroup ?? null);
      }

      // 다른 단계에서 숨겨둔 4단계 레이어 복원 (주회로 숨김·방향 뱃지 상태는 4단계 설정 그대로)
      ['aux-circuit-wire-layer', 'aux-tester-effect-layer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
      });
      this.stage4Engine?.toggleDirections(this.stage4Engine.showDirections);
      this.stage4Engine?.toggleMainCircuit(this.stage4Engine.isMainCircuitVisible);

      this.stage4Engine?.updateGuideMessage(this.currentProblem.board.sequenceCircuit.flsPreWiring
        ? "🟡 <b>[4단계 제어판 보조회로 배선 시작!]</b><br>주회로 배선 완료 후, 실기 정석대로 <b>FLS 전극선(7·8·1 ➜ E1·E2·E3)을 최우선 결선</b>합니다!<br>위의 <b>'▶ 보조회로 전체 자동 배선'</b> 또는 <b>'⚡ [최우선] FLS'</b> 버튼을 눌러보세요!"
        : "🟡 <b>[4단계 제어판 보조회로 배선 시작!]</b><br>주회로 배선 완료 후 ① 번부터 차례로 보조회로를 결선합니다. 리밋스위치(LS1·LS2) 선은 TB4로 나가는 보조회로에 포함돼요.<br>위의 <b>'▶ 보조회로 전체 자동 배선'</b> 또는 번호 칩을 눌러보세요!");
    } else if (stageNum === 5) {
      // 5단계 UI 활성화 (1800x1600 실기 시험장 벽면 합판 배관 제도)
      if (stage1Toolbar) stage1Toolbar.style.display = 'none';
      if (stage2Toolbar) stage2Toolbar.style.display = 'none';
      if (stage3Toolbar) stage3Toolbar.style.display = 'none';
      if (stage4Toolbar) stage4Toolbar.style.display = 'none';
      if (stage5Toolbar) stage5Toolbar.style.display = 'flex';

      if (boardContainer) boardContainer.style.display = 'none';
      if (sequenceContainer) sequenceContainer.style.display = 'none';
      if (pipingContainer) pipingContainer.style.display = 'flex';
      if (zoomControls) zoomControls.style.display = 'flex'; // 벽면 확대 (휠·드래그·더블클릭 리셋)

      if (headerTitle) headerTitle.textContent = '📐 제어판 배관 제도 및 기구/새들 마킹 시뮬레이터 (1800mm × 1650mm 벽면)';
      if (headerDesc) headerDesc.textContent = '12단계 합격 루틴: 1.배전반 고정 ➜ 2.수평선&배관선 먹줄 ➜ 3.외부단자&새들 마킹(커버 대기법) ➜ 4.외부기구 고정 ➜ 5.새들 1차 가고정 ➜ 6.커넥터 접속(PE 6·CD 7) ➜ 7.배관 설치 & ③ 케이블 장착';

      if (blueprintImg) blueprintImg.src = this.asset('piping');
      if (modalImg) modalImg.src = this.asset('piping');
      if (modalTitle) modalTitle.textContent = '공식 도면: 1) 배관 및 기구 배치도';

      this.prepareWallStage();

      this.stage5Engine?.updateGuideMessage("📐 <b>[5단계 배관 제도 & 새들 마킹 시작!]</b><br>실기 합격 12단계 시공 표준에 따라 <b>1. 🔩 배전반 고정 (4×24 긴 나사 4개)</b>부터 순서대로 작업을 시작하세요!");
    } else if (stageNum === 6) {
      // 6단계 UI 활성화 (5단계 벽면 위에서 입선·결선)
      [stage1Toolbar, stage2Toolbar, stage3Toolbar, stage4Toolbar, stage5Toolbar].forEach(t => { if (t) t.style.display = 'none'; });
      if (boardContainer) boardContainer.style.display = 'none';
      if (sequenceContainer) sequenceContainer.style.display = 'none';
      if (pipingContainer) pipingContainer.style.display = 'flex';
      if (zoomControls) zoomControls.style.display = 'flex';

      if (headerTitle) headerTitle.textContent = '🧵 외부기구 가조립 · 전선 입선 · 결선 시뮬레이터 (벽면 배관)';
      if (headerDesc) headerDesc.textContent = '12단계 합격 루틴: 8.외부단자 가조립 ➜ 9.전선 입선(먼 쪽부터) ➜ 10.탈피&결선(공통선 먼저) ➜ 11.박스 뚜껑 결합';

      if (blueprintImg) blueprintImg.src = this.asset('piping');
      if (modalImg) modalImg.src = this.asset('piping');
      if (modalTitle) modalTitle.textContent = '공식 도면: 1) 배관 및 기구 배치도';

      this.prepareWallStage();
      // 6단계는 5단계 배관 설치가 끝난 벽면에서 시작 → 덜 끝났으면 즉시 완성
      (async () => {
        if (this.stage5Engine && this.stage5Engine.currentStep < 7) {
          await this.stage5Engine.runStep7(false);
          this.stage6Engine?.clearAll();
        }
        if (!this.stage6Engine) {
          this.stage6Engine = new Stage6Wiring(this.stage5Engine, this.currentProblem);
          const activeSpeed = document.querySelector('.speed-btn.active');
          if (activeSpeed) this.stage6Engine.setSpeed(parseFloat(activeSpeed.dataset.speed || '1.0'));
        }
        this.stage6Engine.updateGuideMessage("🧵 <b>[6단계 입선·결선 시작!]</b><br>배관 설치가 끝난 벽면입니다. <b>1. 🔧 외부단자 가조립</b> ➜ <b>2. 전선 입선(먼 쪽부터)</b> ➜ <b>3. 결선(공통선 먼저)</b> ➜ <b>4. 박스 뚜껑</b> 순서로 진행하세요!");
      })();
    } else if (stageNum === 7) {
      // 7단계 UI 활성화 (시퀀스 도면 전류 흐름 + 조작반)
      [stage1Toolbar, stage2Toolbar, stage3Toolbar, stage4Toolbar, stage5Toolbar].forEach(t => { if (t) t.style.display = 'none'; });
      if (boardContainer) boardContainer.style.display = 'none';
      if (sequenceContainer) sequenceContainer.style.display = 'none';
      if (pipingContainer) pipingContainer.style.display = 'none';
      if (zoomControls) zoomControls.style.display = 'none';

      if (headerTitle) headerTitle.textContent = '⚡ 전원 투입 & 시퀀스 동작 테스트';
      if (headerDesc) headerDesc.textContent = 'MCCB ON ➜ 셀렉터(자동/수동) ➜ 버튼·수위 조작 ➜ 릴레이·타이머·전자접촉기 동작 ➜ 램프·부저·전동기 확인 (EOCR 과부하 트립 포함)';

      if (blueprintImg) blueprintImg.src = this.asset('sequence');
      if (modalImg) modalImg.src = this.asset('sequence');
      if (modalTitle) modalTitle.textContent = '공식 도면: 3) 시퀀스 회로도';

      const operationEl = document.getElementById('operation-stage-container');
      if (operationEl && !this.stage7Engine) {
        this.stage7Engine = new Stage7Operation(operationEl, this.currentProblem);
        // 7단계 '🧱 벽면' 보기: 6단계 완성 벽면을 받아 씀 (덜 끝났으면 화면 밖에서 즉시 완성)
        this.stage7Engine.wallProvider = () => this.buildWallForOperation();
        const activeSpeed = document.querySelector('.speed-btn.active');
        if (activeSpeed) this.stage7Engine.setSpeed(parseFloat(activeSpeed.dataset.speed || '1.0'));
      }
      this.stage7Engine?.start();
      this.stage7Engine?.updateGuideMessage("⚡ <b>[7단계 동작 테스트 시작!]</b><br>오른쪽 조작반에서 <b>MCCB를 올려 전원</b>을 넣고, 셀렉터(자동/수동)·버튼·수위를 바꿔 보세요.<br>왼쪽 도면에서 <b style='color:#f97316;'>주황색</b>으로 빛나는 선이 지금 전기가 흐르는 곳입니다!");
    }
  }

  /**
   * 줌(확대/축소) 및 팬(화면 이동) 인터랙션 로직
   */
  bindZoomPanEvents() {
    const container = document.getElementById('board-stage-container');
    const zoomLabel = document.getElementById('zoom-level-label');

    const updateTransform = (smooth = true) => {
      const wrapper = document.querySelector('.board-view-wrapper');
      if (wrapper) {
        wrapper.style.transition = smooth ? 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
        wrapper.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
      }
      if (zoomLabel) {
        zoomLabel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
      }
    };

    // 5·6단계(벽면 배관·입선)는 벽면 SVG 자체 확대(viewBox) 사용
    const isWallStage = () => this.currentStage === 5 || this.currentStage === 6;

    // 확대 버튼
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      if (isWallStage()) return this.stage5Engine?.zoomBy(1.25);
      this.zoomLevel = Math.min(3.5, this.zoomLevel + 0.25);
      updateTransform(true);
    });

    // 축소 버튼
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      if (isWallStage()) return this.stage5Engine?.zoomBy(1 / 1.25);
      this.zoomLevel = Math.max(0.75, this.zoomLevel - 0.25);
      updateTransform(true);
    });

    // 원래 크기 (100%) 리셋 버튼
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
      if (isWallStage()) return this.stage5Engine?.resetZoom();
      this.resetZoom();
    });

    // 상단 단자대(TB5) 초밀착 줌 (2.2배)
    document.getElementById('btn-focus-tb5')?.addEventListener('click', async () => {
      if (this.stage1Engine.currentSubStep < 4) {
        await this.stage1Engine.markTerminalBlocks(false);
      }
      this.zoomLevel = 2.2;
      this.panX = 0;
      this.panY = 180; // 상단 TB5가 화면 중앙에 오도록 아래로 내림
      updateTransform(true);
    });

    // 하단 단자대(TB6) 초밀착 줌 (2.2배)
    document.getElementById('btn-focus-tb6')?.addEventListener('click', async () => {
      if (this.stage1Engine.currentSubStep < 4) {
        await this.stage1Engine.markTerminalBlocks(false);
      }
      this.zoomLevel = 2.2;
      this.panX = 0;
      this.panY = -180; // 하단 TB6가 화면 중앙에 오도록 위로 올림
      updateTransform(true);
    });

    // 마우스 휠 줌 (휠 스크롤 시 부드럽게 줌)
    container?.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      this.zoomLevel = Math.max(0.75, Math.min(3.5, this.zoomLevel + delta));
      updateTransform(false);
    }, { passive: false });

    // 마우스 드래그 팬(Pan)
    container?.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      this.isDragging = true;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
      container.classList.add('panning');
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.dragStartX;
      this.panY = e.clientY - this.dragStartY;
      updateTransform(false);
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        container?.classList.remove('panning');
      }
    });
  }

  resetZoom() {
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    const wrapper = document.querySelector('.board-view-wrapper');
    if (wrapper) {
      wrapper.style.transition = 'transform 0.2s ease-out';
      wrapper.style.transform = `scale(1) translate(0px, 0px)`;
    }
    const zoomLabel = document.getElementById('zoom-level-label');
    if (zoomLabel) {
      zoomLabel.textContent = `100%`;
    }
  }

  bindTooltips() {
    const tooltip = document.getElementById('comp-tooltip');
    const container = document.getElementById('board-stage-container');

    container?.addEventListener('mouseover', (e) => {
      const compGroup = e.target.closest('.component');
      if (compGroup) {
        const compId = compGroup.id.replace('comp-', '');
        const compData = this.currentProblem.board.components.find(c => c.id === compId);
        if (compData && tooltip) {
          tooltip.innerHTML = `
            <div style="font-weight: 800; color: #38bdf8; margin-bottom: 2px;">${compData.name}</div>
            <div style="color: #cbd5e1; font-size: 11px;">${compData.desc}</div>
            ${compData.notchDirection ? `<div style="color: #facc15; font-size: 10.5px; margin-top: 4px;">⚠️ 키 홈(▲): 반드시 아래쪽(6시 방향)을 향해야 합격!</div>` : ''}
          `;
          tooltip.style.display = 'block';
        }
      }
    });

    container?.addEventListener('mousemove', (e) => {
      if (tooltip && tooltip.style.display === 'block') {
        tooltip.style.left = `${e.pageX + 15}px`;
        tooltip.style.top = `${e.pageY + 15}px`;
      }
    });

    container?.addEventListener('mouseout', (e) => {
      const compGroup = e.target.closest('.component');
      if (compGroup && tooltip) {
        tooltip.style.display = 'none';
      }
    });
  }
}

// 브라우저 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
  window.__appCtl = new AppController();   // 브라우저 콘솔·자동 검사용
});
