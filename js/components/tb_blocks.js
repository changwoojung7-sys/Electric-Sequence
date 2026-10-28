/**
 * 벽면 외부 TB 단자대(TB2·TB3·TB4) 모양·단자 위치 계산 (5단계 그림 · 6단계 결선/인출선 공용)
 * - device: { edge: 'x' | 'y', at, from, step }  (과제 데이터 wall.bundles[].device)
 *   · edge 'x' = 세로 단자대 (단자가 X=at 선 위에 위→아래로 from, from+step, …)
 *   · edge 'y' = 가로 단자대 (단자가 Y=at 선 위에 왼→오른쪽으로)
 * - 배관이 들어오는 쪽 가장자리에 단자(결선 자리)가 있고, 인출선은 반대쪽 가장자리로 나감
 * - 세로 단자대는 배관 중심선이 단자대 정중앙에 오게 (단자 4개의 가운데 = 배관 높이, 사용자 확정)
 *   ➜ 데이터의 from 대신 배관 끝 높이에서 계산 (pipeEnd가 없을 때만 from 사용)
 */

const LONG = 110;    // 단자대 길이 (mm)
const THICK_V = 40;  // 세로 단자대 폭
const THICK_H = 30;  // 가로 단자대 높이
const MARGIN = 15;   // 첫 단자까지 여백

// 1번 과제 기본 외부 단자대 (문제 데이터에 wall.bundles가 없을 때)
export const DEFAULT_TB_BLOCKS = [
  { id: 'TB3', title: '모터 M2', device: { edge: 'x', at: 300, from: 1520, step: 20 } },
  { id: 'TB4', title: 'E1 E2 E3', device: { edge: 'y', at: 1560, from: 910, step: 26 } },
  { id: 'TB2', title: '모터 M1', device: { edge: 'x', at: 1500, from: 1420, step: 20 } }
];

/**
 * @param device 단자대 위치 데이터
 * @param pipeEnd 이 단자대로 오는 배관의 끝점 [x, y] (배관이 들어오는 방향 판단)
 */
export function tbBlockGeometry(device, pipeEnd) {
  if (device.edge === 'x') {
    const fromRight = pipeEnd[0] > device.at;          // 배관이 오른쪽에서 옴 ➜ 단자대는 X=at 왼쪽
    const x0 = fromRight ? device.at - THICK_V : device.at;
    const outerX = fromRight ? x0 : x0 + THICK_V;
    const from = pipeEnd[1] !== device.from ? pipeEnd[1] - device.step * 1.5 : device.from;   // 배관 중심 = 단자대 가운데
    return {
      // 세로 단자대: 배관이 단자대 정중앙 높이로 들어와 위·아래 단자로 나뉘어 결선 (길이는 단자 간격에 맞춤)
      vertical: true, x0, y0: from - MARGIN, w: THICK_V, h: device.step * 3 + MARGIN * 2,
      outward: [fromRight ? -1 : 1, 0],                  // 인출선이 나가는 방향
      along: [0, 1],                                     // 단자 번호가 늘어나는 방향
      slot: (k) => [device.at, from + k * device.step],
      outerSlot: (k) => [outerX, from + k * device.step]
    };
  }
  const fromAbove = pipeEnd[1] < device.at;              // 배관이 위에서 옴 ➜ 단자대는 Y=at 아래
  const y0 = fromAbove ? device.at : device.at - THICK_H;
  const outerY = fromAbove ? y0 + THICK_H : y0;
  return {
    vertical: false, x0: device.from - MARGIN, y0, w: LONG, h: THICK_H,
    outward: [0, fromAbove ? 1 : -1],
    along: [1, 0],
    slot: (k) => [device.from + k * device.step, device.at],
    outerSlot: (k) => [device.from + k * device.step, outerY]
  };
}
