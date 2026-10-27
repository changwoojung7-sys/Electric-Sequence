/**
 * 2단계 주회로 선로를 가로 통로 중앙(Y=95 / 210 / 330) 쪽으로 모으기
 * - 과제 데이터의 직각 경로(points)에서 통로 안을 지나는 가로 구간만 골라,
 *   통로마다 쓰인 높이(y)를 위아래 순서 그대로 통로 중앙선 기준 일정 간격 차선으로 다시 배정
 * - 가로로 겹치지 않는 선은 같은 차선을 함께 써서 차선 수를 줄임 (선들이 중앙선에 최대한 가깝게)
 * - 위아래 순서를 지키므로 결선 순서·교차 관계는 그대로이고, 단자(경로 양 끝) 좌표는 움직이지 않음
 * - 1·2·3단계 및 4단계(보조회로 차선 배정)가 같은 데이터를 쓰도록 과제 데이터를 한 번만 직접 고침
 */

// 통로 = 위·아래 기구 단자 높이 사이 (단자 y는 제외) / center = 통로 중앙선
const CHANNELS = [
  { center: 95, min: 62.5, max: 117.5 },    // 상단: TB5 아래 단자 ~ 1열 위 단자
  { center: 210, min: 172.5, max: 247.5 },  // 중앙: 1열 아래 단자 ~ 2열 위 단자
  { center: 330, min: 302.5, max: 357.5 }   // 하단: 2열 아래 단자 ~ TB6 위 단자
];
const LANE_GAP = 2.8;   // 차선 간격 (mm) — 주회로 전선 굵기보다 조금 넓게

export function centerMainCircuitLanes(problem) {
  const steps = problem?.board?.mainCircuit?.steps;
  if (!steps || problem.board.mainCircuit.lanesCentered) return;
  const wires = steps.flatMap(s => s.wires || []).filter(w => Array.isArray(w.points) && w.points.length > 2);

  // 경로 안쪽 점끼리 이어진 가로 구간 (양 끝 단자 점은 제외)
  const horizontals = [];
  wires.forEach(w => {
    const pts = w.points;
    for (let i = 1; i < pts.length - 2; i++) {
      if (pts[i][1] === pts[i + 1][1]) horizontals.push({ pts, i, y: pts[i][1] });
    }
  });

  CHANNELS.forEach(ch => {
    const inside = horizontals.filter(h => h.y > ch.min && h.y < ch.max);
    if (!inside.length) return;
    // 원래 높이(y)가 같은 구간끼리 한 묶음 — 가로 범위(x)를 합침
    const items = [...new Set(inside.map(h => h.y))].sort((a, b) => a - b).map(y => {
      const xs = inside.filter(h => h.y === y).flatMap(h => [h.pts[h.i][0], h.pts[h.i + 1][0]]);
      return { y, lo: Math.min(...xs), hi: Math.max(...xs) };
    });
    // 차선 번호: 위에 있던 묶음 중 가로로 겹치는 것보다 한 칸 아래 (겹치지 않으면 같은 차선 공유)
    // ➜ 겹치는 선끼리는 위아래 순서 그대로, 필요한 차선 수는 최소로 (중앙에 가깝게)
    items.forEach((it, k) => {
      it.level = 0;
      for (let j = 0; j < k; j++) {
        const o = items[j];
        if (Math.min(o.hi, it.hi) - Math.max(o.lo, it.lo) > -LANE_GAP) it.level = Math.max(it.level, o.level + 1);
      }
    });
    const levels = Math.max(...items.map(it => it.level)) + 1;
    // 여유가 있는 선은 가능한 범위(위 선보다 아래 ~ 아래 선보다 위) 안에서 가장 중앙에 가까운 차선으로
    const overlaps = (a, b) => Math.min(a.hi, b.hi) - Math.max(a.lo, b.lo) > -LANE_GAP;
    for (let k = items.length - 1; k >= 0; k--) {
      items[k].late = levels - 1;
      for (let j = k + 1; j < items.length; j++) {
        if (overlaps(items[k], items[j])) items[k].late = Math.min(items[k].late, items[j].late - 1);
      }
    }
    const mid = (levels - 1) / 2;
    items.forEach((it, k) => {
      let lo = 0;
      for (let j = 0; j < k; j++) if (overlaps(items[j], it)) lo = Math.max(lo, items[j].level + 1);
      it.level = Math.min(it.late, Math.max(lo, Math.round(mid)));
    });
    const lane = new Map(items.map(it => [it.y, +(ch.center + (it.level - (levels - 1) / 2) * LANE_GAP).toFixed(2)]));
    inside.forEach(h => {
      const ny = lane.get(h.y);
      h.pts[h.i][1] = ny;
      h.pts[h.i + 1][1] = ny;
    });
  });
  problem.board.mainCircuit.lanesCentered = true;
}
