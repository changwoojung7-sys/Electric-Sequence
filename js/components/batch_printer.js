/**
 * 공개문제(01~18번) 특정 페이지 일괄 출력 컴포넌트
 * - 과제 범위 선택 (전체 1~18번, 현재 과제, 급배수 1~9번, 리밋스위치 10~18번, 개별 선택)
 * - 자주 쓰는 도면 프리셋 (핵심 도면 5~7쪽, 7쪽 시퀀스만, 5쪽 배관도만, 6쪽 배치도만, 5~9쪽 도면 전체 등)
 * - 출력 순서 (과제별 묶음 / 페이지별 묶음) 및 공통 페이지 1회만 출력 옵션 지원
 * - 모든 선택 페이지 이미지를 선로드한 후 브라우저 인쇄 창(프린터 출력 / PDF 저장) 즉시 실행
 */

export const PAGE_METADATA = [
  { page: 1, title: '표지 · 시험 요구사항', category: 'common', badge: '공통', isLandscape: false },
  { page: 2, title: '수험자 유의사항 (1)', category: 'common', badge: '공통', isLandscape: false },
  { page: 3, title: '수험자 유의사항 (2)', category: 'common', badge: '공통', isLandscape: false },
  { page: 4, title: '수험자 유의사항 (3) · 실격 기준', category: 'common', badge: '공통', isLandscape: false },
  { page: 5, title: '1) 배관 및 기구 배치도', category: 'core', badge: '핵심 도면', isLandscape: false },
  { page: 6, title: '2) 제어판 내부 기구 배치도', category: 'core', badge: '핵심 도면', isLandscape: false },
  { page: 7, title: '3) 제어회로의 시퀀스 회로도', category: 'core', badge: '핵심 · 가로', isLandscape: true },
  { page: 8, title: '4) 제어회로의 동작 사항', category: 'drawing', badge: '동작 설명', isLandscape: false },
  { page: 9, title: '5) 기구의 내부 결선도 및 구성도', category: 'drawing', badge: '핀번호 참조', isLandscape: false },
  { page: 10, title: '4. 지급재료 목록 (1)', category: 'common', badge: '재료 목록', isLandscape: false },
  { page: 11, title: '4. 지급재료 목록 (2)', category: 'common', badge: '재료 목록', isLandscape: false }
];

export class BatchPrinter {
  constructor(getCurrentProblemId) {
    this.getCurrentProblemId = getCurrentProblemId;
    this.selectedProblems = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
    // 기본 선택: 가장 많이 출력하는 5·6·7쪽 핵심 도면
    this.selectedPages = new Set([5, 6, 7]);
    this.sortMode = 'by-problem'; // 'by-problem' | 'by-page'
    this.dedupeCommonPages = false; // 공통 안내 페이지(1~4, 10~11쪽) 첫 과제에서만 1회 출력 여부
    this.isPrinting = false;

    this.initModal();
    this.bindTriggers();
  }

  initModal() {
    if (document.getElementById('batch-print-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'batch-print-modal';
    modal.className = 'modal-overlay batch-print-overlay';
    modal.innerHTML = `
      <div class="modal-content batch-print-modal-content" role="dialog" aria-labelledby="batch-print-title">
        <div class="modal-header batch-print-header">
          <div>
            <h3 id="batch-print-title">🖨️ 공개문제 특정 페이지 일괄 출력 (인쇄 / PDF 저장)</h3>
            <p class="batch-print-subtitle">원하는 과제(1~18번)와 필요한 도면 페이지만 골라 한 번에 인쇄하거나 하나의 PDF로 저장하세요.</p>
          </div>
          <button id="batch-print-close-btn" class="btn btn-secondary" style="padding: 5px 12px;">✕ 닫기</button>
        </div>

        <div class="batch-print-body">
          <!-- 1. 과제 범위 선택 섹션 -->
          <section class="bp-section">
            <div class="bp-section-header">
              <h4>1️⃣ 출력할 과제 선택 <span id="bp-prob-count-badge" class="bp-count-badge">18개 선택됨</span></h4>
              <div class="bp-preset-group">
                <button type="button" class="bp-preset-btn active" data-prob-preset="all">전체 (1~18번)</button>
                <button type="button" class="bp-preset-btn" data-prob-preset="current">현재 과제만</button>
                <button type="button" class="bp-preset-btn" data-prob-preset="fls">급배수 (1~9번)</button>
                <button type="button" class="bp-preset-btn" data-prob-preset="ls">리밋스위치 (10~18번)</button>
                <button type="button" class="bp-preset-btn bp-preset-clear" data-prob-preset="none">전체 해제</button>
              </div>
            </div>
            <div class="bp-problem-grid" id="bp-problem-grid">
              ${Array.from({ length: 18 }, (_, i) => {
                const num = i + 1;
                const tag = num <= 9 ? 'FLS' : 'LS';
                return `
                  <label class="bp-prob-chip selected" data-prob="${num}">
                    <input type="checkbox" value="${num}" checked>
                    <span class="bp-prob-num">${String(num).padStart(2, '0')}번</span>
                    <small class="bp-prob-tag">${tag}</small>
                  </label>
                `;
              }).join('')}
            </div>
          </section>

          <!-- 2. 페이지(도면) 선택 섹션 -->
          <section class="bp-section">
            <div class="bp-section-header">
              <h4>2️⃣ 출력할 페이지 선택 <span id="bp-page-count-badge" class="bp-count-badge">3개 쪽 선택됨</span></h4>
              <div class="bp-preset-group">
                <button type="button" class="bp-preset-btn bp-preset-star active" data-page-preset="core3">⭐ 핵심 도면 3종 (5·6·7쪽)</button>
                <button type="button" class="bp-preset-btn" data-page-preset="seq7">⚡ 7쪽 시퀀스 회로도만</button>
                <button type="button" class="bp-preset-btn" data-page-preset="piping5">📐 5쪽 배관도만</button>
                <button type="button" class="bp-preset-btn" data-page-preset="board6">🪵 6쪽 제어판 배치도만</button>
                <button type="button" class="bp-preset-btn" data-page-preset="drawings5to9">📋 도면·동작·결선도 (5~9쪽)</button>
                <button type="button" class="bp-preset-btn" data-page-preset="all11">📄 전 페이지 (1~11쪽)</button>
                <button type="button" class="bp-preset-btn bp-preset-clear" data-page-preset="none">선택 해제</button>
              </div>
            </div>
            <div class="bp-page-grid" id="bp-page-grid">
              ${PAGE_METADATA.map(meta => {
                const isSelected = this.selectedPages.has(meta.page);
                return `
                  <label class="bp-page-card ${isSelected ? 'selected' : ''} bp-cat-${meta.category}" data-page="${meta.page}">
                    <input type="checkbox" value="${meta.page}" ${isSelected ? 'checked' : ''}>
                    <div class="bp-page-top">
                      <span class="bp-page-num">${meta.page}쪽</span>
                      <span class="bp-page-badge ${meta.isLandscape ? 'is-landscape' : ''}">${meta.badge}</span>
                    </div>
                    <div class="bp-page-title">${meta.title}</div>
                  </label>
                `;
              }).join('')}
            </div>
          </section>

          <!-- 3. 출력 옵션 섹션 -->
          <section class="bp-section bp-options-section">
            <div class="bp-options-row">
              <div class="bp-option-group">
                <span class="bp-option-label">🗂️ 출력 정렬 순서:</span>
                <label class="bp-radio-label">
                  <input type="radio" name="bp-sort-mode" value="by-problem" checked>
                  <span>과제별 묶음 <small>(1번 도면들 ➜ 2번 도면들...)</small></span>
                </label>
                <label class="bp-radio-label">
                  <input type="radio" name="bp-sort-mode" value="by-page">
                  <span>페이지별 묶음 <small>(1~18번 시퀀스 모음 ➜ 배관도 모음...)</small></span>
                </label>
              </div>

              <label class="bp-dedupe-label" title="1~4쪽(유의사항)과 10~11쪽(지급재료 목록)은 모든 과제가 동일하므로 첫 과제에서만 1번 인쇄합니다">
                <input type="checkbox" id="bp-dedupe-common">
                <span>💡 공통 안내 페이지(1~4쪽, 10~11쪽)는 첫 과제에서만 1번 출력 (용지 절약)</span>
              </label>
            </div>
          </section>
        </div>

        <div class="batch-print-footer">
          <div class="bp-summary" id="bp-summary-text">
            총 <b>18개 과제</b> × <b>3개 페이지</b> = <strong class="bp-total-sheets">54장</strong> 출력 예정
          </div>
          <div class="bp-footer-actions">
            <span id="bp-progress-status" class="bp-progress-status"></span>
            <button type="button" id="bp-QuickCurrentBtn" class="btn btn-secondary" title="현재 보고 있는 과제의 선택한 페이지만 바로 인쇄">
              📄 현재 과제만 바로 출력
            </button>
            <button type="button" id="bp-start-print-btn" class="btn btn-primary bp-submit-btn">
              <span>🖨️</span> 선택 페이지 일괄 인쇄 / PDF 저장
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;
    this.bindModalEvents();
    this.updateUI();
  }

  bindTriggers() {
    // 헤더·0단계·사이드바의 일괄 출력 열기 버튼 바인딩
    document.querySelectorAll('[data-open-batch-print]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.open();
      });
    });
  }

  bindModalEvents() {
    const closeBtn = document.getElementById('batch-print-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal && !this.isPrinting) this.close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active') && !this.isPrinting) {
        this.close();
      }
    });

    // 과제 개별 체크박스
    this.modal.querySelectorAll('#bp-problem-grid input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const num = parseInt(cb.value, 10);
        if (cb.checked) this.selectedProblems.add(num);
        else this.selectedProblems.delete(num);
        this.clearActivePresets('[data-prob-preset]');
        this.updateUI();
      });
    });

    // 과제 프리셋 버튼
    this.modal.querySelectorAll('[data-prob-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.probPreset;
        this.applyProblemPreset(preset);
        this.clearActivePresets('[data-prob-preset]');
        btn.classList.add('active');
        this.updateUI();
      });
    });

    // 페이지 개별 체크박스
    this.modal.querySelectorAll('#bp-page-grid input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const page = parseInt(cb.value, 10);
        if (cb.checked) this.selectedPages.add(page);
        else this.selectedPages.delete(page);
        this.clearActivePresets('[data-page-preset]');
        this.updateUI();
      });
    });

    // 페이지 프리셋 버튼
    this.modal.querySelectorAll('[data-page-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.pagePreset;
        this.applyPagePreset(preset);
        this.clearActivePresets('[data-page-preset]');
        btn.classList.add('active');
        this.updateUI();
      });
    });

    // 정렬 방식 라디오
    this.modal.querySelectorAll('input[name="bp-sort-mode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          this.sortMode = radio.value;
          this.updateUI();
        }
      });
    });

    // 공통 페이지 중복 제거 체크박스
    const dedupeCb = document.getElementById('bp-dedupe-common');
    dedupeCb?.addEventListener('change', () => {
      this.dedupeCommonPages = dedupeCb.checked;
      this.updateUI();
    });

    // 현재 과제만 바로 출력 버튼
    document.getElementById('bp-QuickCurrentBtn')?.addEventListener('click', () => {
      const curId = this.getCurrentProblemId?.() || 1;
      this.applyProblemPreset('current');
      this.clearActivePresets('[data-prob-preset]');
      this.modal.querySelector('[data-prob-preset="current"]')?.classList.add('active');
      this.updateUI();
      this.executePrint([curId], [...this.selectedPages].sort((a, b) => a - b));
    });

    // 일괄 출력 실행 버튼
    document.getElementById('bp-start-print-btn')?.addEventListener('click', () => {
      const probs = [...this.selectedProblems].sort((a, b) => a - b);
      const pages = [...this.selectedPages].sort((a, b) => a - b);
      this.executePrint(probs, pages);
    });
  }

  clearActivePresets(selector) {
    this.modal.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
  }

  applyProblemPreset(preset) {
    this.selectedProblems.clear();
    if (preset === 'all') {
      for (let i = 1; i <= 18; i++) this.selectedProblems.add(i);
    } else if (preset === 'current') {
      const curId = this.getCurrentProblemId?.() || 1;
      this.selectedProblems.add(curId);
    } else if (preset === 'fls') {
      for (let i = 1; i <= 9; i++) this.selectedProblems.add(i);
    } else if (preset === 'ls') {
      for (let i = 10; i <= 18; i++) this.selectedProblems.add(i);
    }
  }

  applyPagePreset(preset) {
    this.selectedPages.clear();
    if (preset === 'core3') {
      [5, 6, 7].forEach(p => this.selectedPages.add(p));
    } else if (preset === 'seq7') {
      this.selectedPages.add(7);
    } else if (preset === 'piping5') {
      this.selectedPages.add(5);
    } else if (preset === 'board6') {
      this.selectedPages.add(6);
    } else if (preset === 'drawings5to9') {
      [5, 6, 7, 8, 9].forEach(p => this.selectedPages.add(p));
    } else if (preset === 'all11') {
      for (let p = 1; p <= 11; p++) this.selectedPages.add(p);
    }
  }

  buildPrintQueue(problems, pages) {
    const commonPages = new Set([1, 2, 3, 4, 10, 11]);
    const seenCommon = new Set();
    const queue = [];

    if (this.sortMode === 'by-page') {
      for (const page of pages) {
        const meta = PAGE_METADATA.find(m => m.page === page);
        for (const prob of problems) {
          if (this.dedupeCommonPages && commonPages.has(page)) {
            if (seenCommon.has(page)) continue;
            seenCommon.add(page);
          }
          queue.push({
            problem: prob,
            page,
            title: meta?.title || `${page}쪽`,
            isLandscape: !!meta?.isLandscape,
            src: `assets/problems/${String(prob).padStart(2, '0')}/page-${String(page).padStart(2, '0')}.png`
          });
        }
      }
    } else {
      for (const prob of problems) {
        for (const page of pages) {
          if (this.dedupeCommonPages && commonPages.has(page)) {
            if (seenCommon.has(page)) continue;
            seenCommon.add(page);
          }
          const meta = PAGE_METADATA.find(m => m.page === page);
          queue.push({
            problem: prob,
            page,
            title: meta?.title || `${page}쪽`,
            isLandscape: !!meta?.isLandscape,
            src: `assets/problems/${String(prob).padStart(2, '0')}/page-${String(page).padStart(2, '0')}.png`
          });
        }
      }
    }
    return queue;
  }

  updateUI() {
    const curId = this.getCurrentProblemId?.() || 1;
    const currentPresetBtn = this.modal.querySelector('[data-prob-preset="current"]');
    if (currentPresetBtn) {
      currentPresetBtn.textContent = `현재 과제만 (${String(curId).padStart(2, '0')}번)`;
    }

    // 과제 칩 상태 동기화
    this.modal.querySelectorAll('#bp-problem-grid .bp-prob-chip').forEach(chip => {
      const num = parseInt(chip.dataset.prob, 10);
      const checked = this.selectedProblems.has(num);
      chip.classList.toggle('selected', checked);
      const input = chip.querySelector('input');
      if (input) input.checked = checked;
    });

    // 페이지 카드 상태 동기화
    this.modal.querySelectorAll('#bp-page-grid .bp-page-card').forEach(card => {
      const page = parseInt(card.dataset.page, 10);
      const checked = this.selectedPages.has(page);
      card.classList.toggle('selected', checked);
      const input = card.querySelector('input');
      if (input) input.checked = checked;
    });

    const probCount = this.selectedProblems.size;
    const pageCount = this.selectedPages.size;
    const probBadge = document.getElementById('bp-prob-count-badge');
    const pageBadge = document.getElementById('bp-page-count-badge');
    if (probBadge) probBadge.textContent = `${probCount}개 과제 선택됨`;
    if (pageBadge) pageBadge.textContent = `${pageCount}개 쪽 선택됨`;

    const probs = [...this.selectedProblems].sort((a, b) => a - b);
    const pages = [...this.selectedPages].sort((a, b) => a - b);
    const queue = this.buildPrintQueue(probs, pages);

    const summaryEl = document.getElementById('bp-summary-text');
    const startBtn = document.getElementById('bp-start-print-btn');
    const quickBtn = document.getElementById('bp-QuickCurrentBtn');

    if (summaryEl) {
      if (queue.length === 0) {
        summaryEl.innerHTML = `<span style="color:#f87171;">⚠️ 출력할 과제와 페이지를 1개 이상 선택해 주세요.</span>`;
      } else {
        const pageNames = pages.map(p => `${p}쪽`).join(', ');
        summaryEl.innerHTML = `선택: <b>${probCount}개 과제</b> × <b>[${pageNames}]</b> = 총 <strong class="bp-total-sheets">${queue.length}장</strong> 출력 예정`;
      }
    }

    if (startBtn) startBtn.disabled = queue.length === 0 || this.isPrinting;
    if (quickBtn) quickBtn.disabled = pageCount === 0 || this.isPrinting;
  }

  open() {
    this.updateUI();
    this.modal.classList.add('active');
  }

  close() {
    if (this.isPrinting) return;
    this.modal.classList.remove('active');
  }

  async executePrint(problems, pages) {
    const queue = this.buildPrintQueue(problems, pages);
    if (queue.length === 0 || this.isPrinting) return;

    this.isPrinting = true;
    const statusEl = document.getElementById('bp-progress-status');
    const startBtn = document.getElementById('bp-start-print-btn');
    const quickBtn = document.getElementById('bp-QuickCurrentBtn');
    if (startBtn) startBtn.disabled = true;
    if (quickBtn) quickBtn.disabled = true;

    try {
      // 1. 숨겨진 인쇄 전용 iframe 생성 (현재 화면 레이아웃을 전혀 깨뜨리지 않고 인쇄 가능)
      let printFrame = document.getElementById('batch-print-iframe');
      if (printFrame) printFrame.remove();

      printFrame = document.createElement('iframe');
      printFrame.id = 'batch-print-iframe';
      printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
      document.body.appendChild(printFrame);

      // 2. 이미지 선로드 및 진행 상태 업데이트
      let loaded = 0;
      const total = queue.length;
      if (statusEl) statusEl.textContent = `⏳ 도면 고해상도 이미지 준비 중... (0 / ${total}장)`;

      await Promise.all(queue.map(item => new Promise((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loaded++;
          if (statusEl) statusEl.textContent = `⏳ 도면 준비 중... (${loaded} / ${total}장)`;
          resolve();
        };
        img.src = item.src;
      })));

      // 3. 인쇄 문서 제목 생성 (PDF 저장 시 기본 파일명으로 사용됨)
      const probLabel = problems.length === 18
        ? '전체(01~18번)'
        : problems.length === 1
          ? `${String(problems[0]).padStart(2, '0')}번`
          : `${String(problems[0]).padStart(2, '0')}~${String(problems[problems.length - 1]).padStart(2, '0')}번(${problems.length}과제)`;
      const pageLabel = pages.map(p => `${p}p`).join('_');
      const docTitle = `전기기능사_실기_공개문제_${probLabel}_${pageLabel}`;

      // 4. 인쇄 전용 HTML 작성 (세로 페이지는 A4 portrait, 7쪽 가로 도면은 A4 landscape 자동 지정)
      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @page landscape-sheet {
      size: A4 landscape;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-sheet {
      width: 210mm;
      height: 297mm;
      display: flex;
      align-items: center;
      justify-content: center;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      background: #ffffff;
    }
    .print-sheet.is-landscape {
      page: landscape-sheet;
      width: 297mm;
      height: 210mm;
    }
    .print-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .print-sheet img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  </style>
</head>
<body>
  ${queue.map(item => `
    <div class="print-sheet ${item.isLandscape ? 'is-landscape' : ''}">
      <img src="${new URL(item.src, window.location.href).href}" alt="공개문제 ${item.problem}번 ${item.page}쪽">
    </div>
  `).join('')}
</body>
</html>`);
      frameDoc.close();

      // 5. iframe 내 이미지가 렌더링될 때까지 잠시 대기 후 인쇄 호출
      const frameImages = [...frameDoc.querySelectorAll('img')];
      await Promise.all(frameImages.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; })));

      if (statusEl) statusEl.textContent = `✅ 총 ${total}장 인쇄 창을 열었습니다!`;

      // 부모 문서 타이틀도 일시 변경하여 브라우저 PDF 저장 시 파일명이 깔끔하게 들어가도록 처리
      const originalTitle = document.title;
      document.title = docTitle;

      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        document.title = originalTitle;
        this.isPrinting = false;
        this.updateUI();
        setTimeout(() => {
          if (statusEl) statusEl.textContent = '';
        }, 3000);
      }, 150);
    } catch (err) {
      console.error('일괄 인쇄 오류:', err);
      if (statusEl) statusEl.textContent = '⚠️ 인쇄 준비 중 오류가 발생했습니다.';
      this.isPrinting = false;
      this.updateUI();
    }
  }
}

