/**
 * 배관 코너 구부림(라운딩) — 5단계 배관 설치 · 6단계 배관 속 전선 공용
 * - 문제지 '수험자 유의사항 3)': 전선관의 곡률 반지름은 전선관 안지름의 6배 이상, 8배 이하로 작업
 * - PE관(안지름 약 16mm ➜ 96~128mm): 딱딱해서 스프링 벤더를 넣고 크게 구부림 ➜ 라운딩이 큼
 * - CD관(안지름 약 14mm ➜ 84~112mm): 주름관이라 손으로 부드럽게 구부림 ➜ 라운딩이 조금 작음
 */
export const PIPE_BORE = { PE: 16, CD: 14 };          // 관 안지름(mm, 교육용 대표값)
export const BEND_RADIUS = { PE: 110, CD: 90 };       // 그림에 쓰는 구부림 반지름(mm) — 둘 다 안지름 × 6 ~ × 8 범위 안
export const MIN_BEND = (kind) => PIPE_BORE[kind] * 6;
export const MAX_BEND = (kind) => PIPE_BORE[kind] * 8;

/**
 * 꺾은선 ➜ 코너를 원호로 둥글린 SVG path
 * @param pts 꺾은선 점들
 * @param radiusAt (i, p) => 이 꼭짓점의 반지름 (0이면 각지게) — 숫자 하나를 주면 모든 안쪽 꼭짓점에 적용
 */
export function roundedPathD(pts, radiusAt) {
  const rOf = typeof radiusAt === 'function' ? radiusAt : () => radiusAt;
  const f = (v) => +v.toFixed(1);
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const last = i === pts.length - 1;
    let r = last ? 0 : rOf(i, p) || 0;
    if (r > 0) {
      const a = pts[i - 1], b = pts[i + 1];
      const lin = Math.hypot(p[0] - a[0], p[1] - a[1]);
      const lout = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const uin = [(p[0] - a[0]) / (lin || 1), (p[1] - a[1]) / (lin || 1)];
      const uout = [(b[0] - p[0]) / (lout || 1), (b[1] - p[1]) / (lout || 1)];
      const cross = uin[0] * uout[1] - uin[1] * uout[0];
      if (Math.abs(cross) < 1e-6) r = 0;                     // 일직선이면 그대로
      else {
        r = Math.min(r, lin / 2, lout / 2);                   // 짧은 구간은 반지름을 줄임
        const s = [p[0] - uin[0] * r, p[1] - uin[1] * r];
        const e = [p[0] + uout[0] * r, p[1] + uout[1] * r];
        d += ` L ${f(s[0])} ${f(s[1])} A ${f(r)} ${f(r)} 0 0 ${cross > 0 ? 1 : 0} ${f(e[0])} ${f(e[1])}`;
        continue;
      }
    }
    d += ` L ${f(p[0])} ${f(p[1])}`;
  }
  return d;
}
