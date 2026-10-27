/**
 * 전기기능사 실기 공개문제 17번 데이터 정의 (10~18번: 리밋스위치 과제 — FLS·셀렉터·부저 없음)
 * - 문제지(assets/problems/17) 도면 판독 결과
 *   · 제어판: 1열 MCCB·F·EOCR·X1·X2 / 2열 MC1·MC2·T1·T2 (1열 = 7번, 2열 = 5번 과제와 같은 자리)
 *   · 배관도: PB0/PB1(좌상), WL/YL·RL/GL(우상, J박스 경유), PB2/CAP(우하), TB1(상)·TB2(좌하)·TB4(하, 가로 — LS1·LS2)·TB3(우하)
 *   · 회로: EOCR b ➜ PB0(NC) ➜ 모선 ── LS1 ➜ X1, LS2 ➜ X2 (리밋스위치가 직접 릴레이를 여자)
 *          PB1 ‖ T1 순시 a(1-3) ➜ [X1 a(1-3)·X2 b(1-4)] ‖ [X1 b(8-5)·X2 a(8-6)] ➜ MC1 · T1  (LS1·LS2 중 하나만 감지될 때 운전)
 *          PB2 ‖ T2 순시 a(1-3) ➜ T1 한시 a(8-6) ➜ (T2 한시 b 8-5 ➜ MC2 / T2 한시 a 8-6 ➜ WL / T2 코일)
 *          RL = MC1 a, GL = MC2 a, EOCR 트립 시 YL
 *          (X 릴레이는 도면 왼쪽 위에서 먼저 쓰는 접점이 공통 1번(1-3·1-4), 그다음 오른쪽이 공통 8번(8-6·8-5))
 * - 단자대: PB2/CAP이 TB6 오른쪽 끝(19·20)이라 전동기 단자대는 TB4 왼쪽에 배관도 순서대로 (TB2 1~4 · 간격 · TB3 7~10)
 * - 4단계 보조회로 경로는 auxChains(단자 순서)만 정의하면 엔진이 통로 규칙대로 자동 생성
 */
export const problem17 = {
  id: 17,
  title: "공개문제 17번",
  subtitle: "리밋스위치 배타 운전 회로 (LS 하나만 ➜ PB1 ➜ MC1·T1 / t1초 후 PB2 ➜ MC2·T2 ➜ t2초 후 WL)",
  // 단계별 도면 이미지 (문제지 PDF에서 150dpi로 변환)
  assets: {
    piping: "assets/problems/17/piping_layout.png",
    board: "assets/problems/17/board_layout.png",
    sequence: "assets/problems/17/sequence_diagram.png",
    internal: "assets/problems/17/internal_wiring.png"
  },
  board: {
    width: 400,
    height: 420,
    dimensions: {
      topMargin: 50,
      row1Dist: 95,
      rowDist: 130,
      row2Dist: 95,
      bottomMargin: 50,
      sideMargin: 50,
      wireChannel: 25
    },
    guideLinesY: [
      { y: 50, label: "상단 단자대 중심선 (TB5)", type: "terminal" },
      { y: 145, label: "1열 기구 중심선 (MCCB, F, EOCR, X1, X2)", type: "component" },
      { y: 275, label: "2열 기구 중심선 (MC1, MC2, T1, T2)", type: "component" },
      { y: 370, label: "하단 단자대 중심선 (TB6)", type: "terminal" }
    ],
    guideLinesX: [
      { x: 25, label: "좌측 전선 통로 중심선 (25mm)", type: "wire-path" },
      { x: 50, label: "좌측 기구 배치 한계선 (50mm)", type: "boundary" },
      { x: 200, label: "제어판 중앙선 (200mm)", type: "center" },
      { x: 350, label: "우측 기구 배치 한계선 (350mm)", type: "boundary" },
      { x: 375, label: "우측 전선 통로 중심선 (375mm)", type: "wire-path" }
    ],
    // 제어판 내부 기구 배치도(문제지 6쪽) — 모든 기구는 X=50~350mm 안
    components: [
      { id: "TB5", name: "TB5 (10P+10P 단자대)", label: "TB5", type: "terminal_block_20p", x: 200, y: 50, width: 250, height: 38, pins: 20,
        desc: "상부 외부 기구(PB0/PB1, 램프, TB1 전원)와 연결되는 20P 단자대" },
      { id: "MCCB", name: "배선용 차단기", label: "MCCB", type: "mccb", x: 76, y: 145, width: 52, height: 72, pins: 6,
        desc: "3상 메인 전원 차단기 (ON/OFF 레버 장착) — 맨 왼쪽" },
      { id: "F", name: "퓨즈홀더 (FUSE)", label: "F", type: "fuse_holder", x: 134, y: 145, width: 38, height: 65, pins: 4,
        desc: "제어회로 과전류 보호용 2구 퓨즈홀더 (위: 1차측 입력, 아래: 2차측 출력)" },
      { id: "EOCR", name: "전자식 과전류 계전기", label: "EOCR", type: "socket_12p", x: 204, y: 145, width: 50, height: 68, pins: 12, notchDirection: "bottom",
        desc: "모터 과부하 보호 계전기 (12핀 소켓, 홈은 반드시 아래쪽!)" },
      { id: "X1", name: "8핀 릴레이 X1", label: "X1", type: "socket_8p", x: 268, y: 145, width: 44, height: 62, pins: 8, notchDirection: "bottom",
        desc: "LS1 감지 릴레이 (a 1-3, b 8-5)" },
      { id: "X2", name: "8핀 릴레이 X2", label: "X2", type: "socket_8p", x: 326, y: 145, width: 44, height: 62, pins: 8, notchDirection: "bottom",
        desc: "LS2 감지 릴레이 (b 1-4, a 8-6)" },
      { id: "MC1", name: "전자 접촉기 1", label: "MC1", type: "socket_12p", x: 95, y: 275, width: 50, height: 68, pins: 12, notchDirection: "bottom",
        desc: "전동기 M1을 구동하는 전자 접촉기 (보조 a 4-10 = RL)" },
      { id: "MC2", name: "전자 접촉기 2", label: "MC2", type: "socket_12p", x: 172, y: 275, width: 50, height: 68, pins: 12, notchDirection: "bottom",
        desc: "전동기 M2를 구동하는 전자 접촉기 (보조 a 4-10 = GL)" },
      { id: "T1", name: "타이머 T1", label: "T1", type: "socket_8p", x: 245, y: 275, width: 44, height: 62, pins: 8, notchDirection: "bottom",
        desc: "MC1 운전 타이머 (순시 a 1-3 자기유지, 한시 a 8-6 = t1초 후 PB2 허가)" },
      { id: "T2", name: "타이머 T2", label: "T2", type: "socket_8p", x: 316, y: 275, width: 44, height: 62, pins: 8, notchDirection: "bottom",
        desc: "MC2 운전 타이머 (순시 a 1-3 자기유지, 한시 b 8-5 = MC2 정지, 한시 a 8-6 = WL)" },
      { id: "TB6", name: "TB6 (10P+10P 단자대)", label: "TB6", type: "terminal_block_20p", x: 200, y: 370, width: 250, height: 38, pins: 20,
        desc: "하부 외부 기구(PB2, 전동기 TB2·TB3, 리밋스위치 TB4)와 연결되는 20P 단자대" }
    ],
    // 배관도(문제지 5쪽) 기반 단자대 핀 마킹
    // - 박스: 바깥쪽 끝부터 3개씩 (TB5: PB0/PB1 좌측 끝, RL/GL 우측 끝, WL/YL 그 안쪽 / TB6: PB2/CAP 우측 끝(2가닥))
    // - TB1 9~12, TB4(LS1·LS2) 11~14 / TB6 오른쪽 끝을 PB2가 쓰므로 TB2 1~4 · 간격 · TB3 7~10, TB4에 접지 없음
    terminalMarkings: {
      tb5: [
        { pin: 1, label: "PB0", group: "PB0/PB1", color: "#ef4444", desc: "푸시버튼 0 (적색, NC) — EOCR 쪽" },
        { pin: 2, label: "PB1", group: "PB0/PB1", color: "#22c55e", desc: "푸시버튼 1 (녹색, NO) — MC1 기동 쪽" },
        { pin: 3, label: "공통", group: "PB0/PB1", color: "#f59e0b", desc: "PB0·PB1 연결점 공통선 (COM, 모선)" },
        { pin: 4, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 5, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 6, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 7, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 8, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 9, label: "L1", group: "TB1", color: "#92400e", desc: "주전원 L1 (갈색)" },
        { pin: 10, label: "L2", group: "TB1", color: "#1e293b", desc: "주전원 L2 (흑색)" },
        { pin: 11, label: "L3", group: "TB1", color: "#64748b", desc: "주전원 L3 (회색)" },
        { pin: 12, label: "PE", group: "TB1", color: "#84cc16", desc: "보호도체 접지 (녹황색)" },
        { pin: 13, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 14, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 15, label: "WL", group: "WL/YL", color: "#e2e8f0", desc: "백색 램프 (WL, T2 시간 경과 표시)" },
        { pin: 16, label: "YL", group: "WL/YL", color: "#eab308", desc: "황색 램프 (YL, EOCR 경보)" },
        { pin: 17, label: "공통", group: "WL/YL", color: "#f59e0b", desc: "WL·YL 공통선 (COM)" },
        { pin: 18, label: "RL", group: "RL/GL", color: "#ef4444", desc: "적색 램프 (RL, MC1 운전)" },
        { pin: 19, label: "GL", group: "RL/GL", color: "#22c55e", desc: "녹색 램프 (GL, MC2 운전)" },
        { pin: 20, label: "공통", group: "RL/GL", color: "#f59e0b", desc: "RL·GL 공통선 (COM)" }
      ],
      tb6: [
        { pin: 1, label: "U1", group: "TB2", color: "#92400e", desc: "전동기 M1 U1 (갈색)" },
        { pin: 2, label: "V1", group: "TB2", color: "#1e293b", desc: "전동기 M1 V1 (흑색)" },
        { pin: 3, label: "W1", group: "TB2", color: "#64748b", desc: "전동기 M1 W1 (회색)" },
        { pin: 4, label: "PE", group: "TB2", color: "#84cc16", desc: "전동기 M1 접지 (녹황색) — PE 종단" },
        { pin: 5, label: "-", group: "empty", color: "#64748b", desc: "여유 단자 (TB2·TB3 사이 간격)" },
        { pin: 6, label: "-", group: "empty", color: "#64748b", desc: "여유 단자 (TB2·TB3 사이 간격)" },
        { pin: 7, label: "U2", group: "TB3", color: "#92400e", desc: "전동기 M2 U2 (갈색)" },
        { pin: 8, label: "V2", group: "TB3", color: "#1e293b", desc: "전동기 M2 V2 (흑색)" },
        { pin: 9, label: "W2", group: "TB3", color: "#64748b", desc: "전동기 M2 W2 (회색)" },
        { pin: 10, label: "PE", group: "TB3", color: "#84cc16", desc: "전동기 M2 접지 (녹황색)" },
        { pin: 11, label: "LS1", group: "TB4", color: "#06b6d4", desc: "리밋스위치 LS1 — 모선 쪽" },
        { pin: 12, label: "LS1", group: "TB4", color: "#06b6d4", desc: "리밋스위치 LS1 — X1 코일 쪽" },
        { pin: 13, label: "LS2", group: "TB4", color: "#0ea5e9", desc: "리밋스위치 LS2 — 모선 쪽" },
        { pin: 14, label: "LS2", group: "TB4", color: "#0ea5e9", desc: "리밋스위치 LS2 — X2 코일 쪽" },
        { pin: 15, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 16, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 17, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 18, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 19, label: "PB2", group: "PB2", color: "#22c55e", desc: "푸시버튼 2 (녹색, NO) — 모선 쪽" },
        { pin: 20, label: "PB2", group: "PB2", color: "#22c55e", desc: "푸시버튼 2 (녹색, NO) — MC2 기동 쪽" }
      ]
    },
    // 2단계: 주회로 (1열은 7번, 2열은 5번 과제와 같은 배치 — TB2 1~4, TB3 7~10 / PE는 TB4 없이 TB2에서 종단)
    mainCircuit: {
      wireSpecs: { type: "HIV/KIV 2.5㎟", l1Color: "#92400e", l2Color: "#1e293b", l3Color: "#64748b", peColor: "#15803d", peStripe: "#eab308" },
      steps: [
        {
          step: 1,
          name: "1. 보호도체(PE) 접지선 결선 (최우선 작업!)",
          desc: "PE 접지선(녹황색)을 가장 먼저 결선합니다. TB1 ➜ 우측 25mm 배선로 ➜ TB3(10번) ➜ TB2(4번) 순서입니다. (리밋스위치 TB4에는 접지가 없어요)",
          tip: "⚠️ <b>실격 방지</b>: 같은 단자에서 선이 다시 나갈 때는 나사 좌우로 나누어 체결하고, 한 단자에 3가닥 이상 물리지 않습니다!",
          wires: [
            { id: "w-pe-tb1-tb3", phase: "PE", color: "#15803d", stripe: "#eab308",
              from: { comp: "TB5", pin: "bot-12", label: "TB1 PE (12번)" }, to: { comp: "TB6", pin: "top-10", label: "TB3 PE (10번 나사 우측)" },
              points: [[218.5, 62.5], [218.5, 95], [375, 95], [375, 330], [195.4, 330], [195.4, 357.5]] },
            { id: "w-pe-tb3-tb2", phase: "PE", color: "#15803d", stripe: "#eab308",
              from: { comp: "TB6", pin: "top-10", label: "TB3 PE (10번 나사 좌측)" }, to: { comp: "TB6", pin: "top-4", label: "TB2 PE (4번 종단)" },
              points: [[192.2, 357.5], [192.2, 350], [121.6, 350], [121.6, 357.5]] }
          ]
        },
        {
          step: 2,
          name: "2. 전원 인입선 결선 (TB1 ➜ MCCB 1차)",
          desc: "상단 TB1(L1·L2·L3)에서 상단 가로 통로를 거쳐 맨 왼쪽의 배선용 차단기(MCCB) 1차측 3개 단자로 직각 배선합니다.",
          tip: "💡 L1(갈색)·L2(흑색)·L3(회색) 순서를 절대 바꾸지 마세요!",
          wires: [
            { id: "w-tb1-mccb-l1", phase: "L1", color: "#92400e", from: { comp: "TB5", pin: "bot-9", label: "TB1 L1 (9번)" }, to: { comp: "MCCB", pin: "in-1", label: "MCCB 1차 L1" },
              points: [[181.5, 62.5], [181.5, 80], [60, 80], [60, 117]] },
            { id: "w-tb1-mccb-l2", phase: "L2", color: "#1e293b", from: { comp: "TB5", pin: "bot-10", label: "TB1 L2 (10번)" }, to: { comp: "MCCB", pin: "in-2", label: "MCCB 1차 L2" },
              points: [[193.8, 62.5], [193.8, 84], [76, 84], [76, 117]] },
            { id: "w-tb1-mccb-l3", phase: "L3", color: "#64748b", from: { comp: "TB5", pin: "bot-11", label: "TB1 L3 (11번)" }, to: { comp: "MCCB", pin: "in-3", label: "MCCB 1차 L3" },
              points: [[206.2, 62.5], [206.2, 88], [92, 88], [92, 117]] }
          ]
        },
        {
          step: 3,
          name: "3. 차단기 ➜ EOCR 1차측 결선 (중앙 통로 ➜ 좌측 25mm 통로)",
          desc: "MCCB 2차측에서 중앙 가로 통로로 내려와 좌측 끝 25mm 통로를 타고 올라가, 상단 가로 통로에서 퓨즈 너머 EOCR 1·2·3번 나사 좌측으로 연결합니다.",
          tip: "💡 MCCB·퓨즈·EOCR 사이 틈새로 가로지르지 않고, 반드시 좌측 25mm 배선로로 돌아갑니다.",
          wires: [
            { id: "w-mccb-eocr-l1", phase: "L1", color: "#92400e", from: { comp: "MCCB", pin: "out-1", label: "MCCB 2차 L1" }, to: { comp: "EOCR", pin: "1", label: "EOCR 1번 나사 좌측" },
              points: [[60, 173], [60, 200], [27, 200], [27, 98], [182.5, 98], [182.5, 117.5]] },
            { id: "w-mccb-eocr-l2", phase: "L2", color: "#1e293b", from: { comp: "MCCB", pin: "out-2", label: "MCCB 2차 L2" }, to: { comp: "EOCR", pin: "2", label: "EOCR 2번 (L2)" },
              points: [[76, 173], [76, 203], [25, 203], [25, 95], [192, 95], [192, 117.5]] },
            { id: "w-mccb-eocr-l3", phase: "L3", color: "#64748b", from: { comp: "MCCB", pin: "out-3", label: "MCCB 2차 L3" }, to: { comp: "EOCR", pin: "3", label: "EOCR 3번 나사 좌측" },
              points: [[92, 173], [92, 206], [23, 206], [23, 92], [198.5, 92], [198.5, 117.5]] }
          ]
        },
        {
          step: 4,
          name: "4. 퓨즈홀더 1차측 전원 인출 (EOCR 1, 3번 나사 우측 ➜ 퓨즈 1, 2번)",
          desc: "EOCR 1번 나사 우측에서 갈색(L1), 3번 나사 우측에서 회색(L3)을 인출하여 상단 가로 통로를 지나 왼쪽 퓨즈 1·2번으로 연결합니다.",
          tip: "⚠️ <b>초특급 중요</b>: 퓨즈 1차측은 반드시 갈색(L1)과 회색(L3) 2.5㎟ 주회로 전선을 사용합니다!",
          wires: [
            { id: "w-fuse-l1", phase: "L1", color: "#92400e", from: { comp: "EOCR", pin: "1", label: "EOCR 1번 나사 우측" }, to: { comp: "F", pin: "in-1", label: "퓨즈홀더 1차 1번" },
              points: [[185.5, 117.5], [185.5, 104], [126, 104], [126, 120.5]] },
            { id: "w-fuse-l3", phase: "L3", color: "#64748b", from: { comp: "EOCR", pin: "3", label: "EOCR 3번 나사 우측" }, to: { comp: "F", pin: "in-2", label: "퓨즈홀더 1차 2번" },
              points: [[201.5, 117.5], [201.5, 108], [142, 108], [142, 120.5]] }
          ]
        },
        {
          step: 5,
          name: "5. EOCR 2차 ➜ MC1, MC2 1차측 병렬 분기 (중앙 통로 활용)",
          desc: "EOCR 7·8·9번에서 중앙 가로 통로를 지나 왼쪽 아래 MC1 1·2·3번 나사 좌측으로 내려가고, MC1 나사 우측에서 MC2 1·2·3번으로 점프 분기합니다.",
          tip: "💡 한 단자에 전선 2가닥 체결 시 나사 좌우로 나누어 체결합니다.",
          wires: [
            { id: "w-eocr-mc1-l1", phase: "L1", color: "#92400e", from: { comp: "EOCR", pin: "7", label: "EOCR 7번 (U)" }, to: { comp: "MC1", pin: "1", label: "MC1 1번 나사 좌측" },
              points: [[184, 172.5], [184, 212], [73.5, 212], [73.5, 247.5]] },
            { id: "w-eocr-mc1-l2", phase: "L2", color: "#1e293b", from: { comp: "EOCR", pin: "8", label: "EOCR 8번 (V)" }, to: { comp: "MC1", pin: "2", label: "MC1 2번 나사 좌측" },
              points: [[192, 172.5], [192, 215], [81.5, 215], [81.5, 247.5]] },
            { id: "w-eocr-mc1-l3", phase: "L3", color: "#64748b", from: { comp: "EOCR", pin: "9", label: "EOCR 9번 (W)" }, to: { comp: "MC1", pin: "3", label: "MC1 3번 나사 좌측" },
              points: [[200, 172.5], [200, 218], [89.5, 218], [89.5, 247.5]] },
            { id: "w-mc1-mc2-l1", phase: "L1", color: "#92400e", from: { comp: "MC1", pin: "1", label: "MC1 1번 나사 우측" }, to: { comp: "MC2", pin: "1", label: "MC2 1번" },
              points: [[76.5, 247.5], [76.5, 224], [150.5, 224], [150.5, 247.5]] },
            { id: "w-mc1-mc2-l2", phase: "L2", color: "#1e293b", from: { comp: "MC1", pin: "2", label: "MC1 2번 나사 우측" }, to: { comp: "MC2", pin: "2", label: "MC2 2번" },
              points: [[84.5, 247.5], [84.5, 227], [158.5, 227], [158.5, 247.5]] },
            { id: "w-mc1-mc2-l3", phase: "L3", color: "#64748b", from: { comp: "MC1", pin: "3", label: "MC1 3번 나사 우측" }, to: { comp: "MC2", pin: "3", label: "MC2 3번" },
              points: [[92.5, 247.5], [92.5, 230], [166.5, 230], [166.5, 247.5]] }
          ]
        },
        {
          step: 6,
          name: "6. MC1 ➜ TB2, MC2 ➜ TB3 부하 결선 (하단 통로 활용)",
          desc: "MC1 2차측(7·8·9)은 바로 아래 TB2(1·2·3)로, MC2 2차측(7·8·9)은 바로 아래 TB3(7·8·9)로 직각 결선합니다.",
          tip: "💡 전동기 M1은 TB2(왼쪽 끝 1·2·3), 전동기 M2는 TB3(7·8·9)입니다! 두 다발 모두 짧게 오른쪽으로 비켜 내려갑니다.",
          wires: [
            { id: "w-mc1-tb2-u1", phase: "L1", color: "#92400e", from: { comp: "MC1", pin: "7", label: "MC1 7번 (U1)" }, to: { comp: "TB6", pin: "top-1", label: "TB2 U1 (1번)" },
              points: [[75, 302.5], [75, 338], [83, 338], [83, 357.5]] },
            { id: "w-mc1-tb2-v1", phase: "L2", color: "#1e293b", from: { comp: "MC1", pin: "8", label: "MC1 8번 (V1)" }, to: { comp: "TB6", pin: "top-2", label: "TB2 V1 (2번)" },
              points: [[83, 302.5], [83, 334], [95.3, 334], [95.3, 357.5]] },
            { id: "w-mc1-tb2-w1", phase: "L3", color: "#64748b", from: { comp: "MC1", pin: "9", label: "MC1 9번 (W1)" }, to: { comp: "TB6", pin: "top-3", label: "TB2 W1 (3번)" },
              points: [[91, 302.5], [91, 330], [107.6, 330], [107.6, 357.5]] },
            { id: "w-mc2-tb3-u2", phase: "L1", color: "#92400e", from: { comp: "MC2", pin: "7", label: "MC2 7번 (U2)" }, to: { comp: "TB6", pin: "top-7", label: "TB3 U2 (7번)" },
              points: [[152, 302.5], [152, 338], [156.9, 338], [156.9, 357.5]] },
            { id: "w-mc2-tb3-v2", phase: "L2", color: "#1e293b", from: { comp: "MC2", pin: "8", label: "MC2 8번 (V2)" }, to: { comp: "TB6", pin: "top-8", label: "TB3 V2 (8번)" },
              points: [[160, 302.5], [160, 334], [169.2, 334], [169.2, 357.5]] },
            { id: "w-mc2-tb3-w2", phase: "L3", color: "#64748b", from: { comp: "MC2", pin: "9", label: "MC2 9번 (W2)" }, to: { comp: "TB6", pin: "top-9", label: "TB3 W2 (9번)" },
              points: [[168, 302.5], [168, 330], [181.5, 330], [181.5, 357.5]] }
          ]
        }
      ]
    },
    // 3단계: 시퀀스 도면 핀번호 부여 및 전위 그루핑 (문제지 7쪽, 1753 x 1240 픽셀)
    sequenceCircuit: {
      pinDictionary: [
        { comp: "EOCR", power: "6 - 12", contacts: [{ type: "b접점", pins: "10 - 4" }, { type: "a접점 ➜ YL", pins: "10 - 5" }] },
        { comp: "X1", power: "2 - 7", contacts: [{ type: "a접점 (X2 b와 직렬)", pins: "1 - 3" }, { type: "b접점 (X2 a와 직렬)", pins: "8 - 5" }] },
        { comp: "X2", power: "2 - 7", contacts: [{ type: "b접점 (X1 a와 직렬)", pins: "1 - 4" }, { type: "a접점 (X1 b와 직렬)", pins: "8 - 6" }] },
        { comp: "T1", power: "2 - 7", contacts: [{ type: "순시 a접점(자기유지)", pins: "1 - 3" }, { type: "한시 a접점 ➜ PB2 허가", pins: "8 - 6" }] },
        { comp: "T2", power: "2 - 7", contacts: [{ type: "순시 a접점(자기유지)", pins: "1 - 3" }, { type: "한시 b접점 ➜ MC2 정지", pins: "8 - 5" }, { type: "한시 a접점 ➜ WL", pins: "8 - 6" }] },
        { comp: "MC1", power: "6 - 12", contacts: [{ type: "보조 a접점 ➜ RL", pins: "4 - 10" }, { type: "주접점", pins: "1-7, 2-8, 3-9" }] },
        { comp: "MC2", power: "6 - 12", contacts: [{ type: "보조 a접점 ➜ GL", pins: "4 - 10" }, { type: "주접점", pins: "1-7, 2-8, 3-9" }] }
      ],
      pinPlacements: [
        { id: "p-eocr-b", comp: "EOCR", label: "10 - 4", type: "b접점", orientation: "horizontal", x: 653, y: 292, left: "10", right: "4", leftX: 595, rightX: 682, badgeY: 264 },
        { id: "p-eocr-a", comp: "EOCR", label: "10 - 5", type: "a접점", orientation: "vertical_exact", x: 673, topX: 681, topY: 642, botX: 681, botY: 696, top: "10", bot: "5" },
        { id: "p-eocr-pwr", comp: "EOCR", label: "6, 12", type: "전원", orientation: "coil_exact", x: 592, y: 760, top: "6", bot: "12" },
        { id: "p-x1-pwr", comp: "X1", label: "2, 7", type: "전원", orientation: "coil_exact", x: 796, y: 760, top: "2", bot: "7" },
        { id: "p-x2-pwr", comp: "X2", label: "2, 7", type: "전원", orientation: "coil_exact", x: 877, y: 760, top: "2", bot: "7" },
        { id: "p-mc1-pwr", comp: "MC1", label: "6, 12", type: "전원", orientation: "coil_exact", x: 958, y: 760, top: "6", bot: "12" },
        { id: "p-t1-pwr", comp: "T1", label: "2, 7", type: "전원", orientation: "coil_exact", x: 1040, y: 760, top: "2", bot: "7" },
        { id: "p-mc2-pwr", comp: "MC2", label: "6, 12", type: "전원", orientation: "coil_exact", x: 1202, y: 760, top: "6", bot: "12" },
        { id: "p-t2-pwr", comp: "T2", label: "2, 7", type: "전원", orientation: "coil_exact", x: 1365, y: 760, top: "2", bot: "7" },
        { id: "p-t1-i", comp: "T1", label: "1, 3", type: "순시a접점(자기유지)", orientation: "vertical_exact", x: 1040, topX: 1048, topY: 316, botX: 1048, botY: 370, top: "1", bot: "3" },
        { id: "p-mc1-a", comp: "MC1", label: "4, 10", type: "보조a접점", orientation: "vertical_exact", x: 1121, topX: 1129, topY: 316, botX: 1129, botY: 370, top: "4", bot: "10" },
        { id: "p-t2-i", comp: "T2", label: "1, 3", type: "순시a접점(자기유지)", orientation: "vertical_exact", x: 1283, topX: 1291, topY: 316, botX: 1291, botY: 370, top: "1", bot: "3" },
        { id: "p-mc2-a", comp: "MC2", label: "4, 10", type: "보조a접점", orientation: "vertical_exact", x: 1446, topX: 1454, topY: 316, botX: 1454, botY: 370, top: "4", bot: "10" },
        { id: "p-x1-a", comp: "X1", label: "1, 3", type: "a접점", orientation: "vertical_exact", x: 958, topX: 966, topY: 433, botX: 966, botY: 487, top: "1", bot: "3" },
        { id: "p-x1-b", comp: "X1", label: "8, 5", type: "b접점", orientation: "vertical_exact", x: 1040, topX: 1048, topY: 441, botX: 1048, botY: 495, top: "8", bot: "5" },
        { id: "p-x2-b", comp: "X2", label: "1, 4", type: "b접점", orientation: "vertical_exact", x: 958, topX: 966, topY: 533, botX: 966, botY: 587, top: "1", bot: "4" },
        { id: "p-x2-a", comp: "X2", label: "8, 6", type: "a접점", orientation: "vertical_exact", x: 1040, topX: 1048, topY: 525, botX: 1048, botY: 579, top: "8", bot: "6" },
        { id: "p-t1-a", comp: "T1", label: "8, 6", type: "한시a접점", orientation: "vertical_exact", x: 1202, topX: 1210, topY: 441, botX: 1210, botY: 495, top: "8", bot: "6" },
        { id: "p-t2-b", comp: "T2", label: "8, 5", type: "한시b접점", orientation: "vertical_exact", x: 1202, topX: 1210, topY: 642, botX: 1210, botY: 696, top: "8", bot: "5" },
        { id: "p-t2-a", comp: "T2", label: "8, 6", type: "한시a접점", orientation: "vertical_exact", x: 1283, topX: 1291, topY: 642, botX: 1291, botY: 696, top: "8", bot: "6" }
      ],
      // 10~18번은 FLS가 없어 전극 최우선 결선 없음
      flsPreWiring: null,
      // 공통선(COM): PB0·PB1 연결점(모선) 뱃지, 같은 박스 램프의 아래 단자 공통(YL·WL, RL·GL) 곡선
      commons: {
        ssArc: null,
        // PB0 출력 끝(752) ➜ PB1 입력(958): 박스 안 PB0·PB1 공통선 (PB1이 LS1·LS2 오른쪽에 있음)
        pbArc: [752, 958, 292],
        badges: [],
        links: [[673, 1283, 822], [1121, 1446, 822]]
      },
      // 전위 그룹별 시퀀스 도면 경로 (3단계 형광펜·7단계 전류 흐름 공용)
      groupPaths: {
        1: "M 370 373 L 511 373 L 511 292 L 637 292 M 592 292 L 592 740 M 592 618 L 673 618 L 673 659",
        2: "M 670 292 L 718 292",
        3: "M 673 699 L 673 740",
        4: "M 752 292 L 1446 292 M 796 292 L 796 333 M 877 292 L 877 333 M 958 292 L 958 333 M 1040 292 L 1040 333 M 1121 292 L 1121 333 M 1202 292 L 1202 333 M 1283 292 L 1283 333 M 1446 292 L 1446 333",
        5: "M 796 373 L 796 740",
        6: "M 877 373 L 877 740",
        7: "M 958 373 L 958 455 M 958 414 L 1040 414 L 1040 373 M 1040 414 L 1040 455",
        8: "M 958 495 L 958 537",
        9: "M 1040 495 L 1040 537",
        10: "M 958 577 L 958 740 M 1040 577 L 1040 618 L 958 618 M 958 700 L 1040 700 L 1040 740",
        11: "M 1121 373 L 1121 740",
        12: "M 1202 373 L 1202 455 M 1202 414 L 1283 414 L 1283 373",
        13: "M 1202 495 L 1202 659 M 1202 618 L 1365 618 L 1365 740 M 1283 618 L 1283 659",
        14: "M 1202 699 L 1202 740",
        15: "M 1283 699 L 1283 740",
        16: "M 1446 373 L 1446 740",
        17: "M 370 404 L 511 404 L 511 822 L 1446 822 M 592 781 L 592 822 M 673 781 L 673 822 M 796 781 L 796 822 M 877 781 L 877 822 M 958 781 L 958 822 M 1040 781 L 1040 822 M 1121 781 L 1121 822 M 1202 781 L 1202 822 M 1283 781 L 1283 822 M 1365 781 L 1365 822 M 1446 781 L 1446 822"
      },
      // 17대 전위 그루핑 (문제지 '도면별 시퀀스회로 그룹수' 17번 = 17개) — 번호는 도면 왼쪽 열부터
      groups: [
        { num: 1, name: "① 제어 전원선 (퓨즈 L1)", color: "#ef4444",
          nodes: ["EOCR 6번(코일)", "퓨즈 2차 L1(out-1)", "EOCR 10번(b접점·트립 공통)"],
          loopOrder: "EOCR 6번 ➜ (상단 통로 ➜ 좌측 통로 하강) ➜ 퓨즈 2차 L1(out-1) ➜ EOCR 10번 (중앙 통로 좌→우)",
          tip: "퓨즈 2차 L1에서 EOCR 코일(6번)과 EOCR 10번으로 전원을 공급합니다. 도면의 10번 두 개는 같은 단자입니다." },
        { num: 2, name: "② EOCR b접점 ➜ PB0", color: "#f97316",
          nodes: ["PB0(TB5 1번)", "EOCR 4번"],
          loopOrder: "TB5 1번(PB0) ➜ EOCR 4번 (상단 통로 좌→우)",
          tip: "EOCR b접점(10-4)을 지난 전원이 정지 버튼 PB0(NC)으로 갑니다." },
        { num: 3, name: "③ EOCR 트립 경보선 (YL)", color: "#eab308",
          nodes: ["YL(TB5 16번)", "EOCR 5번"],
          loopOrder: "TB5 16번(YL) ➜ EOCR 5번 (상단 통로 우→좌)",
          tip: "과부하 트립 시 EOCR a접점(10-5)이 닫혀 YL이 켜집니다." },
        { num: 4, name: "④ PB0 출력 모선", color: "#06b6d4",
          nodes: ["PB0·PB1 공통(TB5 3번)", "MC1 4번", "MC2 4번", "T2 1번", "PB2(TB6 19번)", "T1 1번", "LS2(TB6 13번)", "LS1(TB6 11번)"],
          loopOrder: "TB5 3번(공통) ➜ 좌측 하강 ➜ MC1 4번 ➜ MC2 4번 (중앙 통로 좌→우) ➜ 우측 하강 ➜ T2 1번 ➜ TB6 19번(PB2) ➜ T1 1번 ➜ TB6 13번(LS2) ➜ TB6 11번(LS1) (하단 통로 우→좌)",
          tip: "PB0을 지난 전원이 LS1·LS2, PB1·PB2, T1·T2 순시 접점(자기유지), MC1·MC2 보조 a접점으로 나갑니다." },
        { num: 5, name: "⑤ LS1 ➜ X1", color: "#ec4899",
          nodes: ["X1 2번(코일)", "LS1(TB6 12번)"],
          loopOrder: "X1 2번 ➜ (우측 하강) ➜ TB6 12번(LS1) (하단 통로 우→좌)",
          tip: "리밋스위치 LS1이 감지되는 동안 X1이 여자됩니다." },
        { num: 6, name: "⑥ LS2 ➜ X2", color: "#f43f5e",
          nodes: ["X2 2번(코일)", "LS2(TB6 14번)"],
          loopOrder: "X2 2번 ➜ (우측 하강) ➜ TB6 14번(LS2) (하단 통로 우→좌)",
          tip: "리밋스위치 LS2가 감지되는 동안 X2가 여자됩니다." },
        { num: 7, name: "⑦ MC1 기동선 (PB1·T1 순시 a ➜ X1 a·X1 b)", color: "#3b82f6",
          nodes: ["PB1(TB5 2번)", "T1 3번", "X1 8번", "X1 1번"],
          loopOrder: "TB5 2번(PB1) ➜ 좌측 하강 ➜ T1 3번 ➜ X1 8번 ➜ X1 1번 (중앙 통로 좌→우)",
          tip: "PB1을 누르면(또는 T1 순시 a접점으로 자기유지) 두 갈래 X 접점 쪽으로 전원이 갑니다." },
        { num: 8, name: "⑧ X1 a(1-3) ➜ X2 b(1-4) 직렬", color: "#a855f7",
          nodes: ["X1 3번", "X2 1번"],
          loopOrder: "X1 3번 ➜ (상단 통로 ➜ 우측 하강) ➜ X2 1번 (중앙 통로 우→좌)",
          tip: "LS1만 감지(X1 ON, X2 OFF)일 때 통하는 길입니다." },
        { num: 9, name: "⑨ X1 b(8-5) ➜ X2 a(8-6) 직렬", color: "#fb923c",
          nodes: ["X1 5번", "X2 8번"],
          loopOrder: "X1 5번 ➜ (상단 통로 ➜ 우측 하강) ➜ X2 8번 (중앙 통로 우→좌)",
          tip: "LS2만 감지(X1 OFF, X2 ON)일 때 통하는 길입니다. 둘 다 감지되거나 둘 다 해제되면 두 길 모두 끊어져요." },
        { num: 10, name: "⑩ X 접점 출력 ➜ MC1 · T1 코일", color: "#a3e635",
          nodes: ["X2 4번", "X2 6번", "MC1 6번(코일)", "T1 2번(코일)"],
          loopOrder: "X2 4번 ➜ X2 6번 (상단 통로 우→좌) ➜ 좌측 하강 ➜ MC1 6번 (중앙 통로 좌→우) ➜ 우측 하강 ➜ T1 2번 (하단 통로 우→좌)",
          tip: "LS1·LS2 중 하나만 감지된 상태에서 PB1을 누르면 MC1·T1이 여자되고 T1 순시 a접점으로 자기유지됩니다." },
        { num: 11, name: "⑪ MC1 운전 표시등 (RL)", color: "#f472b6",
          nodes: ["RL(TB5 18번)", "MC1 10번"],
          loopOrder: "TB5 18번(RL) ➜ 우측 하강 ➜ MC1 10번 (하단 통로 우→좌)",
          tip: "MC1 보조 a접점(4-10)이 닫히면 RL이 켜집니다." },
        { num: 12, name: "⑫ MC2 기동선 (PB2·T2 순시 a ➜ T1 한시 a)", color: "#38bdf8",
          nodes: ["T2 3번", "T1 8번", "PB2(TB6 20번)"],
          loopOrder: "T2 3번 ➜ (중앙 통로 ➜ 좌측 하강) ➜ T1 8번 ➜ TB6 20번(PB2) (하단 통로 좌→우)",
          tip: "PB2(또는 T2 순시 a접점)를 지난 전원이 T1 한시 a접점으로 갑니다 — T1이 t1초를 다 센 뒤에만 PB2가 허가돼요." },
        { num: 13, name: "⑬ T1 한시 a 출력 ➜ T2 한시 b·한시 a · T2 코일", color: "#c084fc",
          nodes: ["T1 6번", "T2 2번(코일)", "T2 8번"],
          loopOrder: "T1 6번 ➜ (중앙 통로 ➜ 우측 하강) ➜ T2 2번 ➜ T2 8번 (하단 통로 우→좌)",
          tip: "T2가 여자되고, T2 한시 b(8-5) ➜ MC2, T2 한시 a(8-6) ➜ WL로 갈라집니다." },
        { num: 14, name: "⑭ T2 한시 b ➜ MC2", color: "#10b981",
          nodes: ["T2 5번", "MC2 6번(코일)"],
          loopOrder: "T2 5번 ➜ MC2 6번 (중앙 통로 우→좌)",
          tip: "T2가 시간을 다 세기 전에는 한시 b접점이 닫혀 MC2가 돕니다. t2초 후 열려서 MC2 정지." },
        { num: 15, name: "⑮ T2 한시 a ➜ WL", color: "#e2e8f0",
          nodes: ["WL(TB5 15번)", "T2 6번"],
          loopOrder: "TB5 15번(WL) ➜ 우측 하강 ➜ T2 6번 (중앙 통로 우→좌)",
          tip: "T2 설정시간 t2초가 지나면 한시 a접점이 닫혀 WL이 켜집니다." },
        { num: 16, name: "⑯ MC2 운전 표시등 (GL)", color: "#22d3ee",
          nodes: ["GL(TB5 19번)", "MC2 10번"],
          loopOrder: "TB5 19번(GL) ➜ 우측 하강 ➜ MC2 10번 (하단 통로 우→좌)",
          tip: "MC2 보조 a접점(4-10)이 닫히면 GL이 켜집니다." },
        { num: 17, name: "⑰ 하부 공통 중성선 (N상)", color: "#94a3b8",
          nodes: ["TB5 17번(WL/YL공통)", "TB5 20번(RL/GL공통)", "X2 7번", "X1 7번", "EOCR 12번", "퓨즈 2차 L3", "MC1 12번", "MC2 12번", "T1 7번", "T2 7번"],
          loopOrder: "TB5 17번 ➜ TB5 20번 (좌→우) ➜ 우측 하강 ➜ X2 7번 ➜ X1 7번 ➜ EOCR 12번 ➜ 퓨즈 2차 L3 (우→좌) ➜ 좌측 하강 ➜ MC1 12번 ➜ MC2 12번 ➜ T1 7번 ➜ T2 7번 (좌→우)",
          tip: "모든 코일과 램프의 반대쪽 단자를 묶는 공통선입니다. 상단 좌→우 ➜ 중앙 통로 우→좌 ➜ 하단 통로 좌→우로 <b>S자 지그재그</b>로 이어 갑니다." }
      ]
    },

    // 4단계: 보조회로 결선 순서 (제어판 단자 체인) — 엔진이 통로 규칙(Y=95/210/330, X=25/375)대로 경로 자동 생성
    // 8핀 소켓: 위 6·5·4·3 / 아래 7·8·1·2, 12핀: 위 1~6 / 아래 7~12
    auxChains: {
      1: [["EOCR", 6], ["F", "out-1"], ["EOCR", 10]],
      2: [["TB5", 1], ["EOCR", 4]],
      3: [["TB5", 16], ["EOCR", 5]],
      4: [["TB5", 3], ["MC1", 4], ["MC2", 4], ["T2", 1], ["TB6", 19], ["T1", 1], ["TB6", 13], ["TB6", 11]],
      5: [["X1", 2], ["TB6", 12]],
      6: [["X2", 2], ["TB6", 14]],
      7: [["TB5", 2], ["T1", 3], ["X1", 8], ["X1", 1]],
      8: [["X1", 3], ["X2", 1]],
      9: [["X1", 5], ["X2", 8]],
      10: [["X2", 4], ["X2", 6], ["MC1", 6, "L"], ["T1", 2, "R"]],
      11: [["TB5", 18], ["MC1", 10]],
      12: [["T2", 3], ["T1", 8, "L"], ["TB6", 20]],
      13: [["T1", 6], ["T2", 2], ["T2", 8]],
      14: [["T2", 5], ["MC2", 6]],
      15: [["TB5", 15], ["T2", 6]],
      16: [["TB5", 19], ["MC2", 10]],
      17: [["TB5", 17], ["TB5", 20], ["X2", 7], ["X1", 7], ["EOCR", 12], ["F", "out-2"], ["MC1", 12], ["MC2", 12], ["T1", 7], ["T2", 7]]
    },

    // 5·6단계: 벽면 배관 · 박스 · 입선 (문제지 5쪽 배관도: 위쪽은 13번, 아래쪽은 16번과 같은 모양 / 치수 기준점 = 제어함 중심 900, 800)
    wall: {
      junction: [1350, 190],
      pipes: [
        { kind: 'PE', name: '제어함 ➜ PB0/PB1', tag: { x: 560, y: 400 }, points: [[800, 590], [800, 190], [400, 190], [400, 590]] },
        { kind: 'CABLE', name: 'TB1(전원)', tag: { x: 900, y: 400 }, points: [[900, 590], [900, 140]], clearance: 'TB1',
          fixedSaddles: [
            { fromEnd: false, dist: 100, label: '하부 새들 (배전반 윗변에서 100mm 위)' },
            { fromEnd: true, dist: 50, label: '상부 새들 (케이블 맨 위 끝에서 50mm 아래)' }
          ] },
        { kind: 'CD', name: '제어함 ➜ J박스', tag: { x: 1175, y: 152 }, points: [[1000, 590], [1000, 190], [1350, 190]] },
        { kind: 'PE', name: 'J박스 ➜ WL/YL', tag: { x: 1350, y: 400 }, points: [[1350, 190], [1350, 590]] },
        { kind: 'CD', name: 'J박스 ➜ RL/GL', tag: { x: 1600, y: 400 }, points: [[1350, 190], [1650, 190], [1650, 590]] },
        { kind: 'CD', name: 'TB2(M1)', tag: { x: 550, y: 1375 }, points: [[750, 1010], [750, 1410], [350, 1410]], clearance: 'TB2' },
        { kind: 'PE', name: 'TB4(LS1·LS2)', tag: { x: 920, y: 1250 }, points: [[850, 1010], [850, 1510]], clearance: 'TB4' },
        { kind: 'CD', name: 'TB3(M2)', tag: { x: 1200, y: 1545 }, points: [[950, 1010], [950, 1510], [1450, 1510]], clearance: 'TB3' },
        { kind: 'PE', name: '제어함 ➜ PB2/CAP', tag: { x: 1250, y: 1375 }, points: [[1050, 1010], [1050, 1410], [1450, 1410], [1450, 1010]] }
      ],
      dimensions: {
        top: { y: 32, ticks: [400, 800, 900, 1000, 1350, 1650] },          // 400 · 100 · 100 · 350 · 300
        bottom: { y: 1626, ticks: [350, 750, 850, 950, 1050, 1450] },     // 400 · 100 · 100 · 100 · 400
        left: { x: 45, ticks: [140, 190, 590, 1010, 1410, 1510] }         // 50 · 400 · 420 · 400 · 100
      },
      edgeDims: [
        { y: 570, edgeY: 590, from: 700, to: 800, below: false },   // 상단: 제어함 왼쪽 끝 ➜ ① 출구 100
        { y: 1080, edgeY: 1010, from: 700, to: 750, below: true }   // 하단: 제어함 왼쪽 끝 ➜ 첫 출구 50
      ],
      // 2구 박스 (x, y = 박스 왼쪽 위, 90 x 140mm) — 위·아래 기구
      boxes: [
        { name: 'PB0/PB1', x: 355, y: 590, titlePos: 'below', top: { type: 'pb-red', name: 'PB0 (정지)', input: 'pb0' }, bottom: { type: 'pb-green', name: 'PB1 (MC1 기동)', input: 'pb1' } },
        { name: 'WL/YL', x: 1305, y: 590, titlePos: 'below', top: { type: 'lamp-white', name: 'WL (T2 시간 경과)', load: 'WL' }, bottom: { type: 'lamp-yellow', name: 'YL (경보)', load: 'YL' } },
        { name: 'RL/GL', x: 1605, y: 590, titlePos: 'below', top: { type: 'lamp-red', name: 'RL (MC1 운전)', load: 'RL' }, bottom: { type: 'lamp-green', name: 'GL (MC2 운전)', load: 'GL' } },
        { name: 'PB2/CAP', x: 1405, y: 870, titlePos: 'above', top: { type: 'pb-green', name: 'PB2 (MC2 기동)', input: 'pb2' }, bottom: { type: 'cap', name: 'CAP' } }
      ],
      // 6단계 입선 다발: via = 지나는 배관 번호(위 pipes 순서), pins = 제어함 단자 (결선 순서: 공통·PE 먼저)
      bundles: [
        { id: 'PB', name: 'PB0/PB1 박스', via: [0], tb: 'TB5', device: { type: 'box' },
          pins: [{ pin: 3, label: '공통', wire: 'AUX', common: true }, { pin: 1, label: 'PB0', wire: 'AUX' }, { pin: 2, label: 'PB1', wire: 'AUX' }] },
        { id: 'WL', name: 'WL/YL 박스', via: [2, 3], tb: 'TB5', device: { type: 'box' },
          pins: [{ pin: 17, label: '공통', wire: 'AUX', common: true }, { pin: 15, label: 'WL', wire: 'AUX' }, { pin: 16, label: 'YL', wire: 'AUX' }] },
        { id: 'RL', name: 'RL/GL 박스', via: [2, 4], tb: 'TB5', device: { type: 'box' },
          pins: [{ pin: 20, label: '공통', wire: 'AUX', common: true }, { pin: 18, label: 'RL', wire: 'AUX' }, { pin: 19, label: 'GL', wire: 'AUX' }] },
        { id: 'TB2', name: 'TB2 (전동기 M1)', via: [5], tb: 'TB6',
          device: { type: 'tbBlock', edge: 'x', at: 300, from: 1420, step: 20 },
          pins: [{ pin: 4, label: 'PE', wire: 'PE', common: true, slot: 3 }, { pin: 1, label: 'U1', wire: 'L1', slot: 0 }, { pin: 2, label: 'V1', wire: 'L2', slot: 1 }, { pin: 3, label: 'W1', wire: 'L3', slot: 2 }] },
        { id: 'TB4', name: 'TB4 (리밋스위치 LS1·LS2)', via: [6], tb: 'TB6',
          device: { type: 'tbBlock', edge: 'y', at: 1560, from: 810, step: 26 },
          pins: [{ pin: 11, label: 'LS1-1', wire: 'AUX' }, { pin: 12, label: 'LS1-2', wire: 'AUX' }, { pin: 13, label: 'LS2-1', wire: 'AUX' }, { pin: 14, label: 'LS2-2', wire: 'AUX' }] },
        { id: 'TB3', name: 'TB3 (전동기 M2)', via: [7], tb: 'TB6',
          device: { type: 'tbBlock', edge: 'x', at: 1500, from: 1520, step: 20 },
          pins: [{ pin: 10, label: 'PE', wire: 'PE', common: true, slot: 3 }, { pin: 7, label: 'U2', wire: 'L1', slot: 0 }, { pin: 8, label: 'V2', wire: 'L2', slot: 1 }, { pin: 9, label: 'W2', wire: 'L3', slot: 2 }] },
        { id: 'PB2', name: 'PB2/CAP 박스', via: [8], tb: 'TB6', device: { type: 'box' },
          pins: [{ pin: 19, label: 'PB2-1', wire: 'AUX' }, { pin: 20, label: 'PB2-2', wire: 'AUX' }] },
        { id: 'TB1', name: 'TB1 메인전원 케이블', via: [], cableEntry: [900, 590], tb: 'TB5', pullSkip: true,
          pins: [{ pin: 12, label: 'PE', wire: 'PE', common: true }, { pin: 9, label: 'L1', wire: 'L1' }, { pin: 10, label: 'L2', wire: 'L2' }, { pin: 11, label: 'L3', wire: 'L3' }] }
      ],
      // 2구 박스 내부 결선 (박스 왼쪽 위 기준 로컬 좌표) — 6단계 결선에서 표시
      boxInternals: {
        // PB0(빨강, 위) = NC / PB1(녹색, 아래) = NO, 두 접점 한쪽을 잇고 그 점에서 공통선 (위에서 들어옴)
        PB: { origin: [355, 590],
          terms: { PB0a: [19, 40], PB0b: [71, 40], PB1a: [19, 100], PB1b: [71, 100] },
          jumper: { from: 'PB0a', to: 'PB1a', lane: 9, text: 'PB0(NC)·PB1(NO) 한쪽 단자 연결' },
          wires: { '공통': { term: 'PB0a', lane: 19 }, 'PB0': { term: 'PB0b', lane: 71 }, 'PB1': { term: 'PB1b', lane: 83 } },
          contacts: [
            { a: 'PB0a', b: 'PB0b', y: 61, type: 'NC', label: 'PB0 NC (빨강·정지)' },
            { a: 'PB1a', b: 'PB1b', y: 121, type: 'NO', label: 'PB1 NO (녹색·기동)' }
          ] },
        WL: { origin: [1305, 590],
          terms: { WLa: [19, 40], WLb: [71, 40], YLa: [19, 100], YLb: [71, 100] },
          jumper: { from: 'WLa', to: 'YLa', lane: 9, text: 'WL·YL 한쪽 단자 묶음' },
          wires: { '공통': { term: 'WLa', lane: 19 }, 'WL': { term: 'WLb', lane: 71 }, 'YL': { term: 'YLb', lane: 83 } },
          contacts: [] },
        RL: { origin: [1605, 590],
          terms: { RLa: [19, 40], RLb: [71, 40], GLa: [19, 100], GLb: [71, 100] },
          jumper: { from: 'RLa', to: 'GLa', lane: 9, text: 'RL·GL 한쪽 단자 묶음' },
          wires: { '공통': { term: 'RLa', lane: 19 }, 'RL': { term: 'RLb', lane: 71 }, 'GL': { term: 'GLb', lane: 83 } },
          contacts: [] },
        // PB2(녹색, 위) = NO 하나뿐 — 공통선 없이 두 단자에 각각 (아래에서 들어옴)
        PB2: { origin: [1405, 870],
          terms: { PB2a: [19, 40], PB2b: [71, 40] },
          wires: { 'PB2-1': { term: 'PB2a', lane: 19 }, 'PB2-2': { term: 'PB2b', lane: 71 } },
          contacts: [
            { a: 'PB2a', b: 'PB2b', y: 61, type: 'NO', label: 'PB2 NO (녹색·기동)' }
          ] }
      }
    },

    // 6단계 결선: TB 단자대 바깥쪽 인출선 (약 10cm 빼고 끝 1cm 피복 탈피)
    externalLeads: {
      TB1: { title: '전원 인입선', wires: [{ label: 'L1', wire: 'L1', pin: 1 }, { label: 'L3', wire: 'L3', pin: 3 }] },
      // 리밋스위치 보조선 2가닥: LS1-1(1번 단자) · LS2-1(3번 단자)
      TB4: { title: '리밋스위치 보조선', stagger: false,
        wires: [{ label: 'LS1-1', wire: 'AUX', pin: 1 }, { label: 'LS2-1', wire: 'AUX', pin: 3 }] }
    },

    // 7단계: 전원 투입 & 동작 테스트 (노드 = 전위 그룹 ①~⑰, 도면 왼쪽부터 번호)
    operation: {
      source: 1,
      neutral: 17,
      timerSetSec: 3,
      flickerSec: 1.0,
      // 리밋스위치 (FLS 수조 대신 조작판에 표시)
      switches: [
        { input: 'ls1', name: 'LS1' },
        { input: 'ls2', name: 'LS2' }
      ],
      contacts: [
        { id: 'EOCR_b', name: 'EOCR b접점 (10-4)', from: 1, to: 2, type: 'eocr-nc', x: 653, y: 292 },
        { id: 'PB0', name: 'PB0 정지 (NC)', from: 2, to: 4, type: 'input-nc', input: 'pb0', x: 735, y: 292, badge: [0, 18] },
        { id: 'EOCR_a', name: 'EOCR a접점 (10-5) ➜ YL', from: 1, to: 3, type: 'eocr-no', x: 673, y: 679 },
        { id: 'LS1', name: '리밋스위치 LS1 (a) ➜ X1', from: 4, to: 5, type: 'input-no', input: 'ls1', x: 796, y: 353 },
        { id: 'LS2', name: '리밋스위치 LS2 (a) ➜ X2', from: 4, to: 6, type: 'input-no', input: 'ls2', x: 877, y: 353 },
        { id: 'PB1', name: 'PB1 기동 (NO)', from: 4, to: 7, type: 'input-no', input: 'pb1', x: 958, y: 353 },
        { id: 'T1_13', name: 'T1 순시 a접점 (1-3) 자기유지', from: 4, to: 7, type: 'relay-no', coil: 'T1', x: 1040, y: 353 },
        { id: 'X1_13', name: 'X1 a접점 (1-3)', from: 7, to: 8, type: 'relay-no', coil: 'X1', x: 958, y: 475, badge: [-24, -14] },
        { id: 'X2_14', name: 'X2 b접점 (1-4)', from: 8, to: 10, type: 'relay-nc', coil: 'X2', x: 958, y: 557, badge: [-24, -14] },
        { id: 'X1_85', name: 'X1 b접점 (8-5)', from: 7, to: 9, type: 'relay-nc', coil: 'X1', x: 1040, y: 475, badge: [-24, -14] },
        { id: 'X2_86', name: 'X2 a접점 (8-6)', from: 9, to: 10, type: 'relay-no', coil: 'X2', x: 1040, y: 557, badge: [-24, -14] },
        { id: 'MC1_aux', name: 'MC1 보조 a접점 (4-10) ➜ RL', from: 4, to: 11, type: 'relay-no', coil: 'MC1', x: 1121, y: 353 },
        { id: 'PB2', name: 'PB2 기동 (NO)', from: 4, to: 12, type: 'input-no', input: 'pb2', x: 1202, y: 353 },
        { id: 'T2_13', name: 'T2 순시 a접점 (1-3) 자기유지', from: 4, to: 12, type: 'relay-no', coil: 'T2', x: 1283, y: 353 },
        { id: 'T1_86', name: 'T1 한시 a접점 (8-6) ➜ PB2 허가', from: 12, to: 13, type: 'timer-no', coil: 'T1', x: 1202, y: 475, badge: [-24, -14] },
        { id: 'T2_b', name: 'T2 한시 b접점 (8-5) ➜ MC2 정지', from: 13, to: 14, type: 'timer-nc', coil: 'T2', x: 1202, y: 679 },
        { id: 'T2_86', name: 'T2 한시 a접점 (8-6) ➜ WL', from: 13, to: 15, type: 'timer-no', coil: 'T2', x: 1283, y: 679 },
        { id: 'MC2_aux', name: 'MC2 보조 a접점 (4-10) ➜ GL', from: 4, to: 16, type: 'relay-no', coil: 'MC2', x: 1446, y: 353 }
      ],
      steps: [
        { id: '가', title: '가) MCCB로 전원 투입 ➜ EOCR에 전원 공급',
          actions: [{ do: 'reset' }, { do: 'power', value: true }],
          expect: { on: ['EOCR'], off: ['X1', 'X2', 'T1', 'T2', 'MC1', 'MC2', 'WL', 'RL', 'GL', 'YL'] } },
        { id: '나1', title: '나)(1) LS1·LS2 중 하나만 감지된 상태에서 PB1 누름 ➜ T1·MC1 여자, M1 회전, RL 점등',
          actions: [{ do: 'switch', target: 'ls1', value: true }, { do: 'press', target: 'pb1', ms: 600 }],
          expect: { on: ['X1', 'T1', 'MC1', 'RL'], off: ['X2', 'MC2', 'GL'] } },
        { id: '나2가', title: '나)(2)(가) t1초 후 ➜ PB2에 의한 동작 허가 (T1 한시 a접점 닫힘)',
          actions: [{ do: 'waitTimer', coil: 'T1', extraMs: 300 }],
          expect: { on: ['T1', 'MC1', 'RL'], off: ['MC2', 'T2'] } },
        { id: '다1', title: '다)(1) T1 여자 후 t1초가 지나 PB2 누름 ➜ T2·MC2 여자, M2 회전, GL 점등',
          actions: [{ do: 'press', target: 'pb2', ms: 600 }],
          expect: { on: ['T1', 'MC1', 'T2', 'MC2', 'GL'], off: ['WL'] } },
        { id: '다2', title: '다)(2) t2초 후 ➜ MC2 소자, M2 정지, GL 소등, WL 점등',
          actions: [{ do: 'waitTimer', coil: 'T2', extraMs: 300 }],
          expect: { on: ['T2', 'WL'], off: ['MC2', 'GL'] } },
        { id: '나2나1', title: '나)(2)(나) LS1·LS2가 모두 감지되면 ➜ T1·MC1 소자, M1 정지, RL 소등',
          actions: [{ do: 'switch', target: 'ls2', value: true }],
          expect: { on: ['X1', 'X2'], off: ['T1', 'MC1', 'RL', 'T2', 'MC2', 'WL'] } },
        { id: '나2나2', title: '나)(2)(나) (LS1만 감지 ➜ PB1로 운전 중) LS1·LS2 감지가 모두 해제되어도 ➜ T1·MC1 소자, RL 소등',
          actions: [{ do: 'switch', target: 'ls2', value: false }, { do: 'press', target: 'pb1', ms: 600 }, { do: 'wait', ms: 300 }, { do: 'switch', target: 'ls1', value: false }],
          expect: { off: ['X1', 'X2', 'T1', 'MC1', 'RL'] } },
        { id: '다3', title: '나)(2)(다)·다)(3) 제어회로 동작 중 PB0 누름 ➜ 모두 정지',
          actions: [{ do: 'switch', target: 'ls2', value: true }, { do: 'press', target: 'pb1', ms: 600 }, { do: 'wait', ms: 300 }, { do: 'press', target: 'pb0', ms: 600 }],
          expect: { on: ['X2'], off: ['T1', 'T2', 'MC1', 'MC2', 'RL', 'GL', 'WL'] } },
        { id: '라1', title: '라)(1) 운전 중 과부하 ➜ EOCR 동작: 전동기 정지, YL 점등',
          actions: [{ do: 'press', target: 'pb1', ms: 500 }, { do: 'wait', ms: 300 }, { do: 'trip' }],
          expect: { on: ['YL'], off: ['MC1', 'MC2', 'X1', 'X2', 'T1', 'T2', 'WL', 'RL', 'GL'] } },
        { id: '라2', title: '라)(2) EOCR 리셋 ➜ 제어회로 초기 상태로 복귀',
          actions: [{ do: 'switch', target: 'ls2', value: false }, { do: 'eocrReset' }],
          expect: { on: ['EOCR'], off: ['YL', 'X1', 'X2', 'T1', 'T2', 'MC1', 'MC2', 'WL', 'RL', 'GL'] } }
      ],
      loads: [
        { id: 'EOCR', name: 'EOCR 전원', node: 1, kind: 'relay', x: 592, y: 760 },
        { id: 'YL', name: '황색 램프 YL', node: 3, kind: 'lamp', color: 'yellow', x: 673, y: 760 },
        { id: 'X1', name: '릴레이 X1', node: 5, kind: 'relay', x: 796, y: 760 },
        { id: 'X2', name: '릴레이 X2', node: 6, kind: 'relay', x: 877, y: 760 },
        { id: 'MC1', name: '전자접촉기 MC1 (M1)', node: 10, kind: 'contactor', motor: 'M1', x: 958, y: 760 },
        { id: 'T1', name: '타이머 T1', node: 10, kind: 'timer', x: 1040, y: 760 },
        { id: 'RL', name: '적색 램프 RL', node: 11, kind: 'lamp', color: 'red', x: 1121, y: 760 },
        { id: 'MC2', name: '전자접촉기 MC2 (M2)', node: 14, kind: 'contactor', motor: 'M2', x: 1202, y: 760 },
        { id: 'WL', name: '백색 램프 WL', node: 15, kind: 'lamp', color: 'white', x: 1283, y: 760 },
        { id: 'T2', name: '타이머 T2', node: 13, kind: 'timer', x: 1365, y: 760 },
        { id: 'GL', name: '녹색 램프 GL', node: 16, kind: 'lamp', color: 'green', x: 1446, y: 760 }
      ],
      // 상태가 바뀔 때 안내 문구 (없으면 기본 문구)
      notes: {
        X1: { on: '🔁 <b>LS1 감지</b> ➜ <b>X1 여자</b> (X1 a 1-3 닫힘, b 8-5 열림)', off: '⏹️ LS1 감지 해제 ➜ X1 소자' },
        X2: { on: '🔁 <b>LS2 감지</b> ➜ <b>X2 여자</b> (X2 b 1-4 열림, a 8-6 닫힘)', off: '⏹️ LS2 감지 해제 ➜ X2 소자' },
        T1: { on: '⏱️ <b>T1 여자</b> ➜ 순시 a접점(1-3)으로 <b>자기유지</b>, t1초 후 한시 a접점이 닫혀 <b>PB2 허가</b>', off: '⏹️ T1 소자' },
        T2: { on: '⏱️ <b>T2 여자</b> ➜ 순시 a접점(1-3)으로 <b>자기유지</b>, t2초 후 MC2 정지·WL 점등', off: '⏹️ T2 소자' },
        MC1: { on: '🟢 <b>MC1 여자</b> ➜ M1 회전 + RL 점등', off: '⏹️ MC1 해제 (M1 정지, RL 소등)' },
        MC2: { on: '🟢 <b>MC2 여자</b> ➜ M2 회전 + GL 점등', off: '⏹️ MC2 해제 (M2 정지, GL 소등)' },
        WL: { on: '💡 T2 한시 a접점(8-6) ➜ <b>WL 점등</b>' },
        YL: { on: '⚠️ <b>EOCR 트립!</b> b접점(10-4) 열림 ➜ 전체 정지, a접점(10-5) 닫힘 ➜ <b>YL 점등</b>' }
      }
    }
  }
};
