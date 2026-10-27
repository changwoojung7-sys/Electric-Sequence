/**
 * 수업용 진행 조절 (5·6단계 벽면 시연 공용)
 * - 안내 문구가 바뀐 뒤 엔진이 기다리는(sleep) 순간마다 '장면' 하나로 셈 (연달아 바뀌는 문구는 한 장면으로 합침)
 * - ⏸ 한 단계씩: 장면마다 멈추고 [다음 ▶] · Space · → 로 진행 (설명할 시간 확보)
 * - 장면 번호로 이동 / ◀ 이전: 같은 시연을 처음부터 빠르게 다시 돌려 그 장면에서 멈춤
 * - 엔진 연결: 엔진 updateGuideMessage ➜ mark(html), 엔진 sleep ➜ await hold()
 */
export class Presenter {
  /**
   * @param setFast 빠르게 지나가기 켜기/끄기 (엔진 속도 조절, app이 제공)
   */
  constructor({ setFast } = {}) {
    this.setFast = setFast || (() => {});
    this.stepMode = false;   // ⏸ 한 단계씩 멈추기
    this.count = 0;          // 지금 시연에서 몇 번째 장면인지
    this.history = [];       // 장면별 안내 문구 (같은 시연을 다시 돌려도 유지 ➜ 전체 장면 수를 알 수 있음)
    this.pending = false;    // 문구가 바뀌었고 아직 멈춤 확인 전
    this.waiter = null;      // 멈춰 있는 동안 [다음]을 기다리는 resolve
    this.target = 0;         // 장면 이동 목표 (0 = 없음)
    this.key = null;
    this.replay = null;
    this.buildUi();
  }

  // ---------------------------------------------------------------------------
  // 엔진 연결
  // ---------------------------------------------------------------------------

  /** 사용자가 시연 버튼을 누름 (key가 같으면 장면 목록 유지) */
  start(key, replay) {
    if (key !== this.key) this.history = [];
    this.key = key;
    this.replay = replay;
    this.count = 0;
    this.pending = false;
    if (this.target) { this.target = 0; this.setFast(false); }
    this.release();
    this.render();
  }

  /** 안내 문구가 바뀜 ➜ 새 장면 (멈춤 전에 또 바뀌면 같은 장면으로 덮어씀) */
  mark(html) {
    if (!this.key) return;
    if (!this.pending) {
      this.count++;
      this.pending = true;
    }
    this.history[this.count - 1] = html;
    this.render();
  }

  /** 엔진이 기다리기 직전: 한 단계씩 모드면 여기서 멈춤 */
  async hold() {
    if (!this.pending) return;
    this.pending = false;
    if (this.target) {
      if (this.count < this.target) return;   // 목표 장면 전까지는 빠르게 지나감
      this.target = 0;
      this.setFast(false);
    } else if (!this.stepMode) {
      return;
    }
    this.render(true);
    await new Promise(resolve => { this.waiter = resolve; });
    this.render();
  }

  // ---------------------------------------------------------------------------
  // 조작
  // ---------------------------------------------------------------------------

  next() {
    this.release();
  }

  release() {
    if (!this.waiter) return;
    const w = this.waiter;
    this.waiter = null;
    w();
  }

  prev() {
    if (this.count > 1) this.jumpTo(this.count - 1);
  }

  /** n번째 장면으로: 처음부터 빠르게 다시 돌려 n번째에서 멈춤 */
  jumpTo(n) {
    if (!this.replay || n < 1) return;
    const max = this.history.length || n;
    this.target = Math.min(n, max);
    this.count = 0;
    this.pending = false;
    this.setFast(true);
    const w = this.waiter;
    this.waiter = null;
    this.replay();          // 새 시연 시작 (이전 시연은 토큰이 바뀌어 스스로 멈춤)
    if (w) w();
    this.render();
  }

  setStepMode(on) {
    this.stepMode = on;
    if (!on) this.release();
    this.render();
  }

  setVisible(on) {
    this.el.style.display = on ? 'flex' : 'none';
  }

  // ---------------------------------------------------------------------------
  // 화면 (벽면 아래 떠 있는 작은 조절 막대)
  // ---------------------------------------------------------------------------

  buildUi() {
    const el = document.createElement('div');
    el.className = 'presenter-bar';
    el.style.display = 'none';
    el.innerHTML = `
      <span class="pr-grip" title="끌어서 옮기기 (작업 화면을 가리면 다른 곳으로)">⠿</span>
      <button type="button" class="pr-mode" title="장면마다 멈추고 [다음]으로 진행 (설명할 때)">⏸ 한 단계씩 OFF</button>
      <button type="button" class="pr-prev" title="이전 장면 (←)">◀ 이전</button>
      <span class="pr-label">장면 -</span>
      <button type="button" class="pr-next" title="다음 장면 (Space · →)">다음 ▶</button>
      <select class="pr-jump" title="장면 번호를 골라 그 장면으로 이동"><option value="">장면으로 이동…</option></select>`;
    document.body.appendChild(el);
    this.el = el;
    // ⠿ 손잡이로 끌어서 옮기기 (벽면 작업 부분을 가리지 않게)
    const grip = el.querySelector('.pr-grip');
    grip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const dx = e.clientX - r.left;
      const dy = e.clientY - r.top;
      grip.setPointerCapture(e.pointerId);
      const move = (ev) => {
        el.style.left = `${Math.max(0, Math.min(window.innerWidth - r.width, ev.clientX - dx))}px`;
        el.style.top = `${Math.max(0, Math.min(window.innerHeight - r.height, ev.clientY - dy))}px`;
        el.style.bottom = 'auto';
        el.style.transform = 'none';
      };
      const up = () => { grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); };
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', up);
    });
    el.querySelector('.pr-mode').addEventListener('click', () => this.setStepMode(!this.stepMode));
    el.querySelector('.pr-prev').addEventListener('click', () => this.prev());
    el.querySelector('.pr-next').addEventListener('click', () => this.next());
    el.querySelector('.pr-jump').addEventListener('change', (e) => {
      const n = parseInt(e.target.value, 10);
      e.target.value = '';
      if (n) this.jumpTo(n);
    });
    // 단축키: Space · → 다음, ← 이전 (조절 막대가 보일 때만, 입력 중에는 무시)
    window.addEventListener('keydown', (e) => {
      if (el.style.display === 'none' || e.target.closest('input, select, textarea')) return;
      if (e.key === ' ' || e.key === 'ArrowRight') {
        if (!this.waiter) return;
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      }
    });
  }

  render(waiting = !!this.waiter) {
    if (!this.el) return;
    const mode = this.el.querySelector('.pr-mode');
    mode.textContent = this.stepMode ? '⏸ 한 단계씩 ON' : '⏸ 한 단계씩 OFF';
    mode.classList.toggle('on', this.stepMode);
    const total = this.history.length;
    this.el.querySelector('.pr-label').innerHTML = this.count
      ? `장면 <b>${this.count}</b>${total > this.count ? ` / ${total}` : ''}${this.target ? ' ⏩' : (waiting ? ' · <em>멈춤</em>' : '')}`
      : '장면 -';
    this.el.querySelector('.pr-next').classList.toggle('waiting', waiting);
    this.el.querySelector('.pr-next').disabled = !waiting;
    this.el.querySelector('.pr-prev').disabled = !(this.count > 1 && this.replay);
    const sel = this.el.querySelector('.pr-jump');
    if (sel.options.length - 1 !== total) {
      const strip = (h) => (h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      sel.innerHTML = '<option value="">장면으로 이동…</option>' + this.history
        .map((h, i) => {
          const t = strip(h);
          return `<option value="${i + 1}">${i + 1}. ${t.length > 46 ? t.slice(0, 46) + '…' : t}</option>`;
        }).join('');
    }
  }
}
