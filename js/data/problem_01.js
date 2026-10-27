/**
 * 전기기능사 실기 공개문제 01번 데이터 정의
 * - 가로 400mm x 세로 420mm 기판 치수 및 부품 좌표
 * - 좌우 50mm 여백선 (X=50, X=350) 내에 기구 배치 (전선 통로: X=25, X=375)
 */
export const problem01 = {
  id: 1,
  title: "공개문제 1번",
  subtitle: "급·배수 제어 회로 (FLS + FR + X + T + MC1 + MC2 + EOCR)",
  board: {
    width: 400,
    height: 420,
    dimensions: {
      topMargin: 50,
      row1Dist: 95,
      rowDist: 130,
      row2Dist: 95,
      bottomMargin: 50,
      sideMargin: 50, // 좌우 50mm 여백
      wireChannel: 25 // 50mm 통로 중앙 (25mm)
    },
    // Y축 가이드선 좌표 (mm)
    guideLinesY: [
      { y: 50, label: "상단 단자대 중심선 (TB5)", type: "terminal" },
      { y: 145, label: "1열 기구 중심선 (F, EOCR, MCCB, X, FR)", type: "component" },
      { y: 275, label: "2열 기구 중심선 (T, FLS, MC1, MC2)", type: "component" },
      { y: 370, label: "하단 단자대 중심선 (TB6)", type: "terminal" }
    ],
    // X축 가이드선 좌표 (mm)
    guideLinesX: [
      { x: 25, label: "좌측 전선 통로 중심선 (25mm)", type: "wire-path" },
      { x: 50, label: "좌측 기구 배치 한계선 (50mm)", type: "boundary" },
      { x: 200, label: "제어판 중앙선 (200mm)", type: "center" },
      { x: 350, label: "우측 기구 배치 한계선 (350mm)", type: "boundary" },
      { x: 375, label: "우측 전선 통로 중심선 (375mm)", type: "wire-path" }
    ],
    // 1번 문제 부품 배치 정보 (중심 x, y 좌표 및 규격)
    // 모든 기구는 X=50mm ~ 350mm 범위 내에 배치됨
    components: [
      // 최상단 단자대 (10P + 10P = 20P, 폭 250mm, X: 75 ~ 325)
      {
        id: "TB5",
        name: "TB5 (10P+10P 단자대)",
        label: "TB5",
        type: "terminal_block_20p",
        x: 200,
        y: 50,
        width: 250,
        height: 38,
        pins: 20,
        desc: "상부 외부 기구(PB, 램프, TB1 전원 등)와 연결되는 20P 단자대"
      },
      // 1열 (Y = 145) : X=50 ~ 350 범위 내 배치
      // F (폭 38, left: 50, right: 88) -> x = 69
      {
        id: "F",
        name: "퓨즈홀더 (FUSE)",
        label: "F",
        type: "fuse_holder",
        x: 69,
        y: 145,
        width: 38,
        height: 65,
        pins: 4,
        desc: "제어회로 과전류 보호용 2구 퓨즈홀더 (위: 1차측 입력, 아래: 2차측 출력)"
      },
      // EOCR (폭 50, left: 106, right: 156) -> x = 131
      {
        id: "EOCR",
        name: "전자식 과전류 계전기",
        label: "EOCR",
        type: "socket_12p",
        x: 131,
        y: 145,
        width: 50,
        height: 68,
        pins: 12,
        notchDirection: "bottom",
        desc: "모터 과부하 보호 계전기 (12핀 소켓, 홈은 반드시 아래쪽!)"
      },
      // MCCB (폭 52, left: 174, right: 226) -> x = 200 (중앙)
      {
        id: "MCCB",
        name: "배선용 차단기",
        label: "MCCB",
        type: "mccb",
        x: 200,
        y: 145,
        width: 52,
        height: 72,
        pins: 6,
        desc: "3상 메인 전원 차단기 (ON/OFF 레버 장착)"
      },
      // X (폭 44, left: 247, right: 291) -> x = 269
      {
        id: "X",
        name: "8핀 릴레이",
        label: "X",
        type: "socket_8p",
        x: 269,
        y: 145,
        width: 44,
        height: 62,
        pins: 8,
        notchDirection: "bottom",
        desc: "보조 계전기 (8핀 원형 소켓, 홈은 반드시 아래쪽!)"
      },
      // FR (폭 44, left: 306, right: 350) -> x = 328
      {
        id: "FR",
        name: "플리커 릴레이",
        label: "FR",
        type: "socket_8p",
        x: 328,
        y: 145,
        width: 44,
        height: 62,
        pins: 8,
        notchDirection: "bottom",
        desc: "경보 깜빡이 릴레이 (8핀 원형 소켓, 부저/램프 교대 점멸)"
      },
      // 2열 (Y = 275) : X=50 ~ 350 범위 내 배치
      // T (폭 44, left: 56, right: 100) -> x = 78
      {
        id: "T",
        name: "타이머",
        label: "T",
        type: "socket_8p",
        x: 78,
        y: 275,
        width: 44,
        height: 62,
        pins: 8,
        notchDirection: "bottom",
        desc: "설정 시간 후 접점을 바꾸는 한시 계전기 (8핀 소켓)"
      },
      // FLS (폭 44, left: 136, right: 180) -> x = 158
      {
        id: "FLS",
        name: "플로트레스 스위치",
        label: "FLS",
        type: "socket_8p",
        x: 158,
        y: 275,
        width: 44,
        height: 62,
        pins: 8,
        notchDirection: "bottom",
        desc: "물탱크 수위 감지 스위치 (8핀 소켓, E1-E2-E3 전극봉 연동)"
      },
      // MC1 (폭 50, left: 218, right: 268) -> x = 243
      {
        id: "MC1",
        name: "전자 접촉기 1",
        label: "MC1",
        type: "socket_12p",
        x: 243,
        y: 275,
        width: 50,
        height: 68,
        pins: 12,
        notchDirection: "bottom",
        desc: "전동기 M1을 구동하는 대용량 전자 스위치 (12핀 소켓)"
      },
      // MC2 (폭 50, left: 298, right: 348) -> x = 323
      {
        id: "MC2",
        name: "전자 접촉기 2",
        label: "MC2",
        type: "socket_12p",
        x: 323,
        y: 275,
        width: 50,
        height: 68,
        pins: 12,
        notchDirection: "bottom",
        desc: "전동기 M2를 구동하는 대용량 전자 스위치 (12핀 소켓)"
      },
      // 최하단 단자대 (10P + 10P = 20P, 폭 250mm, X: 75 ~ 325)
      {
        id: "TB6",
        name: "TB6 (10P+10P 단자대)",
        label: "TB6",
        type: "terminal_block_20p",
        x: 200,
        y: 370,
        width: 250,
        height: 38,
        pins: 20,
        desc: "하부 외부 기구(전동기 TB2, TB3, 수위단자 TB4 등)와 연결되는 20P 단자대"
      }
    ],
    // 배관도 기반 상단(TB5) 및 하단(TB6) 핀 마킹 데이터
    // 규칙:
    // 1) 버튼/램프/스위치: 양쪽 맨 끝 핀부터 3개씩 활용
    // 2) TB1, TB2, TB3, TB4 단자대: 중앙에서 좌우 4개씩 먼저 활용, 나머지는 버튼/램프 배치 후 붙여서 4개 활용
    terminalMarkings: {
      tb5: [
        // 좌측 끝: PB 박스 (핀 1, 2, 3)
        { pin: 1, label: "PB0", group: "PB0/PB1", color: "#ef4444", desc: "푸시버튼 0 (적색, b접점)" },
        { pin: 2, label: "PB1", group: "PB0/PB1", color: "#22c55e", desc: "푸시버튼 1 (녹색, a접점)" },
        { pin: 3, label: "공통", group: "PB0/PB1", color: "#f59e0b", desc: "푸시버튼 공통선 (COM)" },
        // 이어서 SS 셀렉터 박스 (핀 4, 5, 6)
        { pin: 4, label: "SS-M", group: "SS", color: "#38bdf8", desc: "셀렉터스위치 수동 (M, 11시)" },
        { pin: 5, label: "SS-A", group: "SS", color: "#38bdf8", desc: "셀렉터스위치 자동 (A, 1시)" },
        { pin: 6, label: "공통", group: "SS", color: "#f59e0b", desc: "셀렉터스위치 공통선 (COM)" },
        { pin: 7, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 8, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        // 정중앙 4핀: TB1 주전원 인입 (핀 9, 10, 11, 12)
        { pin: 9, label: "L1", group: "TB1", color: "#92400e", desc: "주전원 L1 (갈색)" },
        { pin: 10, label: "L2", group: "TB1", color: "#1e293b", desc: "주전원 L2 (흑색)" },
        { pin: 11, label: "L3", group: "TB1", color: "#64748b", desc: "주전원 L3 (회색)" },
        { pin: 12, label: "PE", group: "TB1", color: "#84cc16", desc: "보호도체 접지 (녹황색)" },
        { pin: 13, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 14, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 15, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 16, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 17, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        // 우측 끝: RL/GL 표시등 박스 (핀 18, 19, 20)
        { pin: 18, label: "RL", group: "RL/GL", color: "#ef4444", desc: "적색 표시등 (RL)" },
        { pin: 19, label: "GL", group: "RL/GL", color: "#22c55e", desc: "녹색 표시등 (GL)" },
        { pin: 20, label: "공통", group: "RL/GL", color: "#f59e0b", desc: "표시등 공통선 (COM)" }
      ],
      tb6: [
        // 좌측 끝: YL/BZ 경보 박스 (핀 1, 2, 3)
        { pin: 1, label: "YL", group: "YL/BZ", color: "#eab308", desc: "황색 표시등 (YL)" },
        { pin: 2, label: "BZ", group: "YL/BZ", color: "#f97316", desc: "부저 (BZ)" },
        { pin: 3, label: "공통", group: "YL/BZ", color: "#f59e0b", desc: "경보장치 공통선 (COM)" },
        { pin: 4, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 5, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 6, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        // 중앙 좌측 4핀: TB3 (전동기 M2 단자대 - 핀 7, 8, 9, 10)
        { pin: 7, label: "U2", group: "TB3", color: "#92400e", desc: "전동기 M2 U2 (갈색)" },
        { pin: 8, label: "V2", group: "TB3", color: "#1e293b", desc: "전동기 M2 V2 (흑색)" },
        { pin: 9, label: "W2", group: "TB3", color: "#64748b", desc: "전동기 M2 W2 (회색)" },
        { pin: 10, label: "PE", group: "TB3", color: "#84cc16", desc: "전동기 M2 접지 (녹황색)" },
        // 중앙 우측 4핀: TB4 (FLS 수위 단자대 - 핀 11, 12, 13, 14)
        { pin: 11, label: "E1", group: "TB4", color: "#06b6d4", desc: "FLS 7번 ➜ 수위 E1 (단)" },
        { pin: 12, label: "E2", group: "TB4", color: "#06b6d4", desc: "FLS 8번 ➜ 수위 E2 (중)" },
        { pin: 13, label: "E3", group: "TB4", color: "#06b6d4", desc: "FLS 1번 ➜ 수위 E3 + 접지(PE) 함께 체결" },
        { pin: 14, label: "-", group: "empty", color: "#64748b", desc: "여유 단자 (TB4 네 번째 단자는 사용 안 함)" },
        { pin: 15, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 16, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        // 우측 끝: TB2 (전동기 M1 단자대 - 핀 17, 18, 19, 20)
        { pin: 17, label: "U1", group: "TB2", color: "#92400e", desc: "전동기 M1 U1 (갈색)" },
        { pin: 18, label: "V1", group: "TB2", color: "#1e293b", desc: "전동기 M1 V1 (흑색)" },
        { pin: 19, label: "W1", group: "TB2", color: "#64748b", desc: "전동기 M1 W1 (회색)" },
        { pin: 20, label: "PE", group: "TB2", color: "#84cc16", desc: "전동기 M1 접지 (녹황색)" }
      ]
    },
    // 2단계: 주회로 결선 데이터 (KEC 규정 색상 및 직각 배선 경로)
    mainCircuit: {
      wireSpecs: {
        type: "HIV/KIV 2.5㎟",
        l1Color: "#92400e", // 갈색 (Brown)
        l2Color: "#1e293b", // 흑색 (Black)
        l3Color: "#64748b", // 회색 (Gray)
        peColor: "#15803d", // 녹황색 (녹색 베이스 + 황색 스트라이프)
        peStripe: "#eab308"
      },
      // 주회로 6대 세부 결선 스텝 (실제 실기 작업 순서: 접지선 최우선 결선)
      steps: [
        {
          step: 1,
          name: "1. 보호도체(PE) 접지선 결선 (최우선 작업!)",
          desc: "바닥에 먼저 깔리는 PE 접지선(녹황색)을 가장 먼저 결선합니다. TB1 ➜ 우측 25mm 배선로 ➜ TB2 ➜ TB3 ➜ FLS(TB4) 순서로 배선합니다.",
          tip: "⚠️ <b>실격 방지 초특급 꿀팁</b>: FLS 접지(TB4)는 보조회로 E3와 겹치므로 반드시 맨 마지막에 단 1가닥만 들어가야 합니다! (한 핀에 전선 3가닥 체결 시 실격!) 또한 같은 단자에서 선이 다시 나갈 때는 나사 좌우로 분리 체결합니다.",
          wires: [
            // 1) TB1 12번 PE ➜ 상단 통로 중앙(Y=95) ➜ 우측 25mm 배선로(X=375) ➜ 하단 통로 중앙(Y=330) ➜ TB2 20번 PE 나사 좌측
            {
              id: "w-pe-tb1-tb2",
              phase: "PE",
              color: "#15803d",
              stripe: "#eab308",
              from: { comp: "TB5", pin: "bot-12", label: "TB1 PE (12번)" },
              to: { comp: "TB6", pin: "top-20", label: "TB2 PE (20번 나사 좌측)" },
              points: [[218.5, 62.5], [218.5, 95], [375, 95], [375, 330], [315.4, 330], [315.4, 357.5]]
            },
            // 2) TB2 20번 PE (나사 우측 318.6) ➜ 하단 가로 통로 중앙(Y=333) ➜ TB3 10번 PE 나사 좌측(192.2)
            {
              id: "w-pe-tb2-tb3",
              phase: "PE",
              color: "#15803d",
              stripe: "#eab308",
              from: { comp: "TB6", pin: "top-20", label: "TB2 PE (20번 나사 우측)" },
              to: { comp: "TB6", pin: "top-10", label: "TB3 PE (10번 나사 좌측)" },
              points: [[318.6, 357.5], [318.6, 333], [192.2, 333], [192.2, 357.5]]
            },
            // 3) TB3 10번 PE (나사 우측 195.4) ➜ 하단 가로 통로 중앙(Y=336) ➜ TB4 E3(13번) 접지 종단 (FLS 1번 보조선과 함께 2가닥, 14번은 사용 안 함)
            {
              id: "w-pe-tb3-tb4",
              phase: "PE",
              color: "#15803d",
              stripe: "#eab308",
              from: { comp: "TB6", pin: "top-10", label: "TB3 PE (10번 나사 우측)" },
              to: { comp: "TB6", pin: "top-13", label: "TB4 E3 (13번) 접지 종단 — FLS 1번 보조선과 함께" },
              points: [[195.4, 357.5], [195.4, 336], [229.2, 336], [229.2, 357.5]]
            }
          ]
        },
        {
          step: 2,
          name: "2. 전원 인입선 결선 (TB1 ➜ MCCB 1차)",
          desc: "상단 TB1 단자대(L1, L2, L3)에서 상단 가로 중앙(Y=90~94)을 거쳐 배선용 차단기(MCCB) 1차측 3개 단자로 직각 배선합니다.",
          tip: "💡 전선 색상: L1(갈색), L2(흑색), L3(회색) 순서를 절대 바꾸지 마세요! (오결선 시 실격)",
          wires: [
            {
              id: "w-tb1-mccb-l1",
              phase: "L1",
              color: "#92400e",
              from: { comp: "TB5", pin: "bot-9", label: "TB1 L1 (9번)" },
              to: { comp: "MCCB", pin: "in-1", label: "MCCB 1차 L1" },
              points: [[181.5, 62.5], [181.5, 90], [184, 90], [184, 117]]
            },
            {
              id: "w-tb1-mccb-l2",
              phase: "L2",
              color: "#1e293b",
              from: { comp: "TB5", pin: "bot-10", label: "TB1 L2 (10번)" },
              to: { comp: "MCCB", pin: "in-2", label: "MCCB 1차 L2" },
              points: [[193.8, 62.5], [193.8, 92], [200, 92], [200, 117]]
            },
            {
              id: "w-tb1-mccb-l3",
              phase: "L3",
              color: "#64748b",
              from: { comp: "TB5", pin: "bot-11", label: "TB1 L3 (11번)" },
              to: { comp: "MCCB", pin: "in-3", label: "MCCB 1차 L3" },
              points: [[206.2, 62.5], [206.2, 94], [216, 94], [216, 117]]
            }
          ]
        },
        {
          step: 3,
          name: "3. 차단기 ➜ EOCR 1차측 결선 (중간 가로 중앙 ➜ 좌측 25mm 통로)",
          desc: "MCCB 2차측에서 중간 가로 중앙(Y=210)으로 내려와 좌측 끝 25mm 세로선(X=25)을 타고 상단 가로 중앙(Y=95)을 거쳐 EOCR 1, 2, 3번 나사 좌측으로 연결합니다.",
          tip: "💡 단자와 단자 사이를 가로지르지 않고, 위아래 단자 사이의 중앙 통로와 좌측 25mm 배선로를 경유하여 완벽한 칼각 직각 배선을 만듭니다.",
          wires: [
            {
              id: "w-mccb-eocr-l1",
              phase: "L1",
              color: "#92400e",
              from: { comp: "MCCB", pin: "out-1", label: "MCCB 2차 L1" },
              to: { comp: "EOCR", pin: "1", label: "EOCR 1번 나사 좌측" },
              points: [[184, 173], [184, 207], [23, 207], [23, 91], [112.5, 91], [112.5, 117.5]]
            },
            {
              id: "w-mccb-eocr-l2",
              phase: "L2",
              color: "#1e293b",
              from: { comp: "MCCB", pin: "out-2", label: "MCCB 2차 L2" },
              to: { comp: "EOCR", pin: "2", label: "EOCR 2번 (L2)" },
              points: [[200, 173], [200, 210], [25, 210], [25, 94], [122, 94], [122, 117.5]]
            },
            {
              id: "w-mccb-eocr-l3",
              phase: "L3",
              color: "#64748b",
              from: { comp: "MCCB", pin: "out-3", label: "MCCB 2차 L3" },
              to: { comp: "EOCR", pin: "3", label: "EOCR 3번 나사 좌측" },
              points: [[216, 173], [216, 213], [27, 213], [27, 97], [128.5, 97], [128.5, 117.5]]
            }
          ]
        },
        {
          step: 4,
          name: "4. 퓨즈홀더 1차측 전원 인출 (EOCR 1, 3번 나사 우측 ➜ 퓨즈 1, 2번)",
          desc: "EOCR 1번 나사 우측에서 갈색(L1), 3번 나사 우측에서 회색(L3) 전선을 인출하여 상단 가로 중앙(Y=92, 90)을 통해 퓨즈 1, 2번으로 직각 연결합니다.",
          tip: "⚠️ <b>초특급 중요</b>: 퓨즈 1차측은 반드시 갈색(L1)과 회색(L3) 2.5㎟ 주회로 전선을 사용해야 합니다! EOCR 나사 좌우로 나누어 체결된 모습을 확인하세요.",
          wires: [
            {
              id: "w-fuse-l1",
              phase: "L1",
              color: "#92400e",
              from: { comp: "EOCR", pin: "1", label: "EOCR 1번 나사 우측" },
              to: { comp: "F", pin: "in-1", label: "퓨즈홀더 1차 1번" },
              points: [[115.5, 117.5], [115.5, 92], [61, 92], [61, 120.5]]
            },
            {
              id: "w-fuse-l3",
              phase: "L3",
              color: "#64748b",
              from: { comp: "EOCR", pin: "3", label: "EOCR 3번 나사 우측" },
              to: { comp: "F", pin: "in-2", label: "퓨즈홀더 1차 2번" },
              points: [[131.5, 117.5], [131.5, 89], [77, 89], [77, 120.5]]
            }
          ]
        },
        {
          step: 5,
          name: "5. EOCR 2차 ➜ MC1, MC2 1차측 병렬 분기 (중간 가로 중앙 Y=210 활용)",
          desc: "EOCR 7, 8, 9번에서 중간 가로 중앙 통로(Y=206~212)를 통해 MC1 1, 2, 3번 나사 좌측으로 가고, MC1 나사 우측에서 중간 통로(Y=215~221)를 통해 MC2 1, 2, 3번으로 점프 분기합니다.",
          tip: "💡 한 단자에 전선 2가닥 체결 시 나사 좌우로 분리 체결: MC1 단자 나사 좌측에는 EOCR 선, 우측에는 MC2로 가는 선이 물립니다.",
          wires: [
            // EOCR ➜ MC1 (MC1 나사 좌측으로 진입)
            {
              id: "w-eocr-mc1-l1",
              phase: "L1",
              color: "#92400e",
              from: { comp: "EOCR", pin: "7", label: "EOCR 7번 (U)" },
              to: { comp: "MC1", pin: "1", label: "MC1 1번 나사 좌측" },
              points: [[114, 172.5], [114, 206], [221.5, 206], [221.5, 247.5]]
            },
            {
              id: "w-eocr-mc1-l2",
              phase: "L2",
              color: "#1e293b",
              from: { comp: "EOCR", pin: "8", label: "EOCR 8번 (V)" },
              to: { comp: "MC1", pin: "2", label: "MC1 2번 나사 좌측" },
              points: [[122, 172.5], [122, 209], [229.5, 209], [229.5, 247.5]]
            },
            {
              id: "w-eocr-mc1-l3",
              phase: "L3",
              color: "#64748b",
              from: { comp: "EOCR", pin: "9", label: "EOCR 9번 (W)" },
              to: { comp: "MC1", pin: "3", label: "MC1 3번 나사 좌측" },
              points: [[130, 172.5], [130, 212], [237.5, 212], [237.5, 247.5]]
            },
            // MC1 ➜ MC2 병렬 점프 결선 (MC1 나사 우측에서 인출)
            {
              id: "w-mc1-mc2-l1",
              phase: "L1",
              color: "#92400e",
              from: { comp: "MC1", pin: "1", label: "MC1 1번 나사 우측" },
              to: { comp: "MC2", pin: "1", label: "MC2 1번" },
              points: [[224.5, 247.5], [224.5, 215], [303, 215], [303, 247.5]]
            },
            {
              id: "w-mc1-mc2-l2",
              phase: "L2",
              color: "#1e293b",
              from: { comp: "MC1", pin: "2", label: "MC1 2번 나사 우측" },
              to: { comp: "MC2", pin: "2", label: "MC2 2번" },
              points: [[232.5, 247.5], [232.5, 218], [311, 218], [311, 247.5]]
            },
            {
              id: "w-mc1-mc2-l3",
              phase: "L3",
              color: "#64748b",
              from: { comp: "MC1", pin: "3", label: "MC1 3번 나사 우측" },
              to: { comp: "MC2", pin: "3", label: "MC2 3번" },
              points: [[240.5, 247.5], [240.5, 221], [319, 221], [319, 247.5]]
            }
          ]
        },
        {
          step: 6,
          name: "6. MC1 ➜ TB2, MC2 ➜ TB3 부하 결선 (하단 가로 중앙 Y=330 활용)",
          desc: "MC1 2차측(7, 8, 9번)과 MC2 2차측(7, 8, 9번)에서 하단 가로 중앙 통로(Y=327~342)를 통해 TB2(17, 18, 19번) 및 TB3(7, 8, 9번) 단자대로 직각 결선합니다.",
          tip: "💡 전동기 1번(M1)은 TB2(우측 끝 17, 18, 19번), 전동기 2번(M2)은 TB3(중앙좌측 7, 8, 9번)입니다!",
          wires: [
            // MC1 ➜ TB2 (우측 끝 전동기 M1)
            {
              id: "w-mc1-tb2-u1",
              phase: "L1",
              color: "#92400e",
              from: { comp: "MC1", pin: "7", label: "MC1 7번 (U1)" },
              to: { comp: "TB6", pin: "top-17", label: "TB2 U1 (17번)" },
              points: [[223, 302.5], [223, 327], [280, 327], [280, 357.5]]
            },
            {
              id: "w-mc1-tb2-v1",
              phase: "L2",
              color: "#1e293b",
              from: { comp: "MC1", pin: "8", label: "MC1 8번 (V1)" },
              to: { comp: "TB6", pin: "top-18", label: "TB2 V1 (18번)" },
              points: [[231, 302.5], [231, 330], [292.4, 330], [292.4, 357.5]]
            },
            {
              id: "w-mc1-tb2-w1",
              phase: "L3",
              color: "#64748b",
              from: { comp: "MC1", pin: "9", label: "MC1 9번 (W1)" },
              to: { comp: "TB6", pin: "top-19", label: "TB2 W1 (19번)" },
              points: [[239, 302.5], [239, 333], [304.7, 333], [304.7, 357.5]]
            },
            // MC2 ➜ TB3 (중앙 좌측 전동기 M2)
            {
              id: "w-mc2-tb3-u2",
              phase: "L1",
              color: "#92400e",
              from: { comp: "MC2", pin: "7", label: "MC2 7번 (U2)" },
              to: { comp: "TB6", pin: "top-7", label: "TB3 U2 (7번)" },
              points: [[303, 302.5], [303, 336], [156.9, 336], [156.9, 357.5]]
            },
            {
              id: "w-mc2-tb3-v2",
              phase: "L2",
              color: "#1e293b",
              from: { comp: "MC2", pin: "8", label: "MC2 8번 (V2)" },
              to: { comp: "TB6", pin: "top-8", label: "TB3 V2 (8번)" },
              points: [[311, 302.5], [311, 339], [169.2, 339], [169.2, 357.5]]
            },
            {
              id: "w-mc2-tb3-w2",
              phase: "L3",
              color: "#64748b",
              from: { comp: "MC2", pin: "9", label: "MC2 9번 (W2)" },
              to: { comp: "TB6", pin: "top-9", label: "TB3 W2 (9번)" },
              points: [[319, 302.5], [319, 342], [181.5, 342], [181.5, 357.5]]
            }
          ]
        }
      ]
    },
    // 3단계: 시퀀스 도면 핀번호 부여 및 전위 그루핑(Grouping) 데이터
    sequenceCircuit: {
      // 부품별 핀번호 매핑 사전 (내부 결선도 기준)
      pinDictionary: [
        { comp: "EOCR", power: "6 - 12", contacts: [{ type: "b접점", pins: "10 - 4" }, { type: "a접점", pins: "10 - 5" }] },
        { comp: "FR", power: "2 - 7", contacts: [{ type: "b접점", pins: "8 - 5" }, { type: "a접점", pins: "8 - 6" }] },
        { comp: "FLS", power: "5 - 6", contacts: [{ type: "a접점", pins: "4 - 3" }], electrodes: "7(E1) - 8(E2) - 1(E3)" },
        { comp: "X", power: "2 - 7", contacts: [{ type: "a접점", pins: "1 - 3" }, { type: "b접점", pins: "8 - 5" }] },
        { comp: "T", power: "2 - 7", contacts: [{ type: "순시 a접점", pins: "1 - 3" }, { type: "한시 a접점", pins: "8 - 6" }] },
        { comp: "MC1", power: "6 - 12", contacts: [{ type: "보조 a접점", pins: "4 - 10" }, { type: "주접점", pins: "1-7, 2-8, 3-9" }] },
        { comp: "MC2", power: "6 - 12", contacts: [{ type: "보조 a접점", pins: "4 - 10" }, { type: "주접점", pins: "1-7, 2-8, 3-9" }] }
      ],
      // 1번 과제 시퀀스 회로도 접점별 실측 픽셀 좌표 리스트 (OpenCV 도면 라인/단자 원 1:1 실측)
      // 모든 세로 접점은 세로선 좌측 여백에 배치하여 도면 기호 및 텍스트 100% 보존
      pinPlacements: [
        // 1. EOCR 첫번째 열동계 b접점 (가로선 Y=292, 좌측단자 X=636, 우측단자 X=670)
        { id: "p-eocr-b", comp: "EOCR", label: "10 - 4", type: "b접점", orientation: "horizontal", x: 653, y: 292, left: "10", right: "4", leftX: 595, rightX: 710, badgeY: 264 },

        // 2. EOCR 트립 접점 (* EOCR b/a 전환 접점: 수직선 X=674, 상단원 Y=540, 하단원 Y=574)
        { id: "p-eocr-a", comp: "EOCR", label: "10 - 5", type: "a접점", orientation: "vertical_exact", x: 674, topX: 682, topY: 519, botX: 682, botY: 573, top: "10", bot: "5" },

        // 3. 하단 코일 전원핀들 (원형 중심 Y=760, 인입선 좌측 및 인출선 좌측에 배치하여 원 안 글자 100% 보존)
        { id: "p-eocr-pwr", comp: "EOCR", label: "6, 12", type: "전원", orientation: "coil_exact", x: 592,  y: 760, top: "6", bot: "12" },
        { id: "p-fr-pwr",   comp: "FR",   label: "2, 7",  type: "전원", orientation: "coil_exact", x: 672,  y: 760, top: "2", bot: "7" },
        { id: "p-fls-pwr",  comp: "FLS",  label: "5, 6",  type: "전원", orientation: "fls_coil_exact", x: 918, y: 760, top: "5", bot: "6" },
        { id: "p-x-pwr",    comp: "X",    label: "2, 7",  type: "전원", orientation: "coil_exact", x: 1080, y: 760, top: "2", bot: "7" },
        { id: "p-t-pwr",    comp: "T",    label: "2, 7",  type: "전원", orientation: "coil_exact", x: 1160, y: 760, top: "2", bot: "7" },
        { id: "p-mc1-pwr",  comp: "MC1",  label: "6, 12", type: "전원", orientation: "coil_exact", x: 1324, y: 760, top: "6", bot: "12" },
        { id: "p-mc2-pwr",  comp: "MC2",  label: "6, 12", type: "전원", orientation: "coil_exact", x: 1406, y: 760, top: "6", bot: "12" },

        // 4. FR 플리커 접점 (내부결선도 대조: 8-6 a접점은 날이 원과 떨어짐, 8-5 b접점은 날이 원에 붙음)
        //    왼쪽 X=754(YL 위) = a접점 8-6 / 오른쪽 X=836(BZ 위) = b접점 8-5, 상단원 Y=662, 하단원 Y=696
        //    오른쪽 접점은 좌측에 왼쪽 FR 글자가 있어 뱃지를 원 오른쪽 여백에 배치
        { id: "p-fr-a", comp: "FR", label: "8, 6", type: "a접점", orientation: "vertical_exact", x: 754, topX: 762, topY: 641, botX: 762, botY: 695, top: "8", bot: "6" },
        { id: "p-fr-b", comp: "FR", label: "8, 5", type: "b접점", orientation: "vertical_exact", x: 836, topX: 844, topY: 642, botX: 844, botY: 696, top: "8", bot: "5" },

        // 5. FLS 접점 (A라인 a접점: X=1080, 상단원 Y=540, 하단원 Y=574) 및 전극봉
        { id: "p-fls-a",  comp: "FLS", label: "4, 3",     type: "a접점", orientation: "vertical_exact", x: 1080, topX: 1088, topY: 519, botX: 1088, botY: 573, top: "4", bot: "3" },
        // [사용자 핵심 지시] FLS 7, 8, 1 전극 뱃지는 왼쪽으로 한 칸 이동 (X: 940)
        { id: "p-fls-el", comp: "FLS", label: "7, 8, 1", type: "전극", orientation: "electrode", x: 940, y: 806, e1: "7", e2: "8", e3: "1" },

        // 6. 상단 라인 접점들 (X 순시 a접점 X=1324, MC1 보조a X=1486, MC2 보조a X=1568, 상단원 Y=336, 하단원 Y=370)
        { id: "p-x-a",   comp: "X",   label: "1, 3",  type: "순시a접점", orientation: "vertical_exact", x: 1324, topX: 1332, topY: 316, botX: 1332, botY: 370, top: "1", bot: "3" },
        { id: "p-mc1-a", comp: "MC1", label: "4, 10", type: "보조a접점", orientation: "vertical_exact", x: 1486, topX: 1494, topY: 316, botX: 1494, botY: 370, top: "4", bot: "10" },
        { id: "p-mc2-a", comp: "MC2", label: "4, 10", type: "보조a접점", orientation: "vertical_exact", x: 1568, topX: 1576, topY: 316, botX: 1576, botY: 370, top: "4", bot: "10" },

        // 7. 중간 라인 접점들
        // [사용자 볼펜 확인] T 순시 a접점 (PB1 병렬 오른쪽 라인 X=1242, 상단원 Y=540, 하단원 Y=574)
        { id: "p-t-inst",  comp: "T", label: "1, 3", type: "순시a접점", orientation: "vertical_exact", x: 1242, topX: 1250, topY: 519, botX: 1250, botY: 573, top: "1", bot: "3" },
        // X 릴레이 접점 (T코일 위 X=1162, 상단원 Y=662, 하단원 Y=696)
        // [문제지 동작 사항 대조] T 코일 위 X 접점은 날이 원에 붙은 b접점 8-5 (자동 시 T 차단, 수동 시 T 여자)
        { id: "p-x-self",  comp: "X", label: "8, 5", type: "b접점", orientation: "vertical_exact", x: 1162, topX: 1170, topY: 641, botX: 1170, botY: 695, top: "8", bot: "5" },
        // T 한시 a접점 8-6 (도면 '>' 기호, MC2 라인 위 X=1406, 상단원 Y=662, 하단원 Y=696)
        { id: "p-t-delay", comp: "T", label: "8, 6", type: "한시a접점", orientation: "vertical_exact", x: 1406, topX: 1414, topY: 641, botX: 1414, botY: 695, top: "8", bot: "6" }
      ],
      // [사용자 핵심 지시] FLS 전극선(7·8·1 ➜ E1·E2·E3)은 주회로 직후 최우선 결선으로 가이드 (그루핑 제외!)
      flsPreWiring: {
        id: "fls-electrode-prewire",
        name: "⚡ [주회로 직후 최우선 결선] FLS 전극봉선 (7·8·1 ➜ E1·E2·E3)",
        color: "#2563eb",
        wires: [
          { from: "FLS 7번", to: "TB4 E1 (단봉)", color: "#2563eb" },
          { from: "FLS 8번", to: "TB4 E2 (중봉)", color: "#3b82f6" },
          { from: "FLS 1번", to: "TB4 E3 (장봉/접지)", color: "#60a5fa" }
        ],
        path: "M 958 775 L 958 822 M 978 775 L 978 822 M 999 775 L 999 822",
        guideHtml: `⚡ <b>[주회로 직후 최우선 결선 가이드: FLS 7·8·1 ➜ TB4 E1·E2·E3]</b><br>
        주회로(PE 접지선, 전원 인입선, 모터 부하선) 작업이 완료되면, <b>일반 15개 보조회로 결선에 들어가기 전에 가장 먼저 FLS 소켓 7·8·1번에서 하단 TB4의 E1·E2·E3 단자로 3가닥을 직결</b>합니다!<br>
        <span style="color: #60a5fa; font-weight: bold;">(핵심 이유: 전극선은 보조회로 전원과 무관한 초단거리 독립 결선이므로, 먼저 결선해 두어야 이후 복잡한 15개 릴레이 제어 배선 시 전선 간섭 및 오결선 위험을 100% 방지할 수 있습니다.)</span>`
      },
      // 전위 그룹별 시퀀스 도면 경로 (1753 x 1240 도면 픽셀 좌표, 3단계 형광펜·7단계 전류 흐름 표시에 공용)
      // 공통선(COM) 표시: 셀렉터 A·M 공통 곡선, PB0·PB1 공통, 램프·부저 아래 공통, FR 8번 공통 뱃지
      commons: {
        ssArc: [1080, 1162, 292],
        // PB0·PB1 공통(위아래 두 단자 사이)과 같은 박스 램프·부저의 아래 단자 공통을 초록 선으로 표시
        pbLink: [1162, 448, 537],
        links: [[754, 836, 822], [1486, 1568, 822]],
        badges: [[770, 595, 56]]
      },
      groupPaths: {
        // ① 퓨즈 2차 L1 -> X=511 -> 상단모선 Y=292 -> EOCR 10번, (X=592) EOCR 6번 코일 및 *EOCR 10번 트립접점 분기
        1: "M 370 373 L 511 373 L 511 292 L 636 292 M 592 292 L 592 740 M 592 496 L 674 496 L 674 540",
      
        // ② EOCR 4번 -> 상단 모선(Y=292) 전체, SS(A/M 탑 분기), X 1번, MC1 4번, MC2 4번
        2: "M 670 292 L 1568 292 M 1080 292 L 1080 328 M 1162 292 L 1162 328 M 1324 292 L 1324 324 M 1486 292 L 1486 324 M 1568 292 L 1568 324",
      
        // ③ EOCR 5번 -> FR 2번 코일 및 FR 8번 공통선
        3: "M 674 574 L 674 740 M 674 618 L 836 618 M 754 618 L 754 662 M 836 618 L 836 662",
      
        // ④ FR 6번(a접점, 왼쪽 X=754) -> YL
        4: "M 754 696 L 754 740",
      
        // ⑤ FR 5번(b접점, 오른쪽 X=836) -> BZ
        5: "M 836 696 L 836 740",
      
        // ⑥ SS-A -> FLS 4번 a접점 및 FLS 5번 코일 전원
        6: "M 1080 370 L 1080 540 M 1080 496 L 918 496 L 918 740",
      
        // ⑦ FLS 3번 -> X 2번 코일
        7: "M 1080 574 L 1080 740",
      
        // ⑧ [사용자 실측 교정] SS-M 하단 (Y=368) -> PB0 상단 (Y=412)
        8: "M 1162 368 L 1162 412",
      
        // ⑨ [사용자 실측 교정] PB0 하단 (Y=444) -> PB1 상단 (Y=540) 및 T 순시 1번 상단 (Y=540) 분기
        9: "M 1162 444 L 1162 540 M 1162 492 L 1242 492 L 1242 540",
      
        // ⑩ [사용자 지시: X 3번 포함] PB1 출력 / T 3번 / X 3번(X=1324, Y=370) -> X 8번 -> MC1 6번 -> T 8번 한시공통
        10: "M 1162 574 L 1162 662 M 1242 574 L 1242 618 M 1324 370 L 1324 740 M 1162 618 L 1406 618 M 1406 618 L 1406 662",
      
        // ⑪ X 5번(b접점) -> T 2번 코일
        11: "M 1162 696 L 1162 740",
      
        // ⑫ T한시 6번 -> MC2 6번 코일
        12: "M 1406 696 L 1406 740",
      
        // ⑬ MC1 10번 -> RL
        13: "M 1486 370 L 1486 740",
      
        // ⑭ MC2 10번 -> GL
        14: "M 1568 370 L 1568 740",
      
        // ⑮ [사용자 지시 완벽 반영] 하부 N상 공통모선 전체: 퓨즈 2차 L3 -> X=511 수직 배선로 하강 -> Y=822 하단 모선 -> EOCR 12번 및 전체 코일/표시등 체결
        15: "M 370 404 L 511 404 L 511 822 L 1568 822 M 592 780 L 592 822 M 672 780 L 672 822 M 754 780 L 754 822 M 836 780 L 836 822 M 918 780 L 918 822 M 1080 780 L 1080 822 M 1160 780 L 1160 822 M 1324 780 L 1324 822 M 1406 780 L 1406 822 M 1486 780 L 1486 822 M 1568 780 L 1568 822"
      },
      // [사용자 실제 시험지 정답 기준] 15대 전위 그루핑 (Grouping ① ~ ⑮)
      groups: [
        {
          num: 1,
          name: "① 상부 주전원 공급선",
          color: "#ef4444",
          nodes: ["EOCR 6번(코일)", "퓨즈 2차 L1(out-1)", "EOCR 10번(b접점·트립접점 공통 단자)"],
          loopOrder: "EOCR 6번 ➜ 퓨즈 2차 L1(out-1) ➜ EOCR 10번",
          tip: "EOCR 6번(코일 전원)에서 출발해 퓨즈 2차 L1을 거쳐 EOCR 10번으로 내려오는 제어 전원선입니다. 도면에 10번이 두 번(열동 b접점·트립 접점) 나오지만 실제로는 <b>같은 단자 하나</b>입니다!"
        },
        {
          num: 2,
          name: "② EOCR b접점 출력 간선",
          color: "#f97316",
          nodes: ["SS 공통(TB5 6번)", "EOCR 4번", "MC1 4번", "X 1번", "MC2 4번"],
          loopOrder: "TB5 6번(SS공통) ➜ EOCR 4번 ➜ MC1 4번 ➜ X 1번 ➜ MC2 4번",
          tip: "맨 위 SS공통에서 시작하여 EOCR 4번을 거쳐 좌측 통로로 하강 후 중앙통로에서 MC1 4번 ➜ X 1번 ➜ MC2 4번 순서로 진행 방향(좌➜우)을 따라 순차 배선합니다."
        },
        {
          num: 3,
          name: "③ EOCR a접점 트립 경보선",
          color: "#eab308",
          nodes: ["*EOCR 5번", "FR 2번", "FR 8번 공통"],
          loopOrder: "*EOCR 5번 ➜ FR 2번 ➜ FR 8번",
          tip: "과부하 트립 시 EOCR 5번에서 플리커 릴레이(FR) 2번 전원과 8번 접점 공통으로 연결됩니다."
        },
        {
          num: 4,
          name: "④ 플리커 a접점 경보 (황색 램프)",
          color: "#84cc16",
          nodes: ["FR 6번", "YL(TB6 1번)"],
          loopOrder: "FR 6번 ➜ TB6 1번(YL)",
          tip: "플리커 릴레이 6번(a접점)에서 하단 TB6 단자대의 1번(YL)으로 1:1 직결합니다."
        },
        {
          num: 5,
          name: "⑤ 플리커 b접점 경보 (부저 BZ)",
          color: "#10b981",
          nodes: ["FR 5번", "BZ(TB6 2번)"],
          loopOrder: "FR 5번 ➜ TB6 2번(BZ)",
          tip: "플리커 릴레이 5번(b접점)에서 하단 TB6 단자대의 2번(BZ)으로 1:1 직결합니다."
        },
        {
          num: 6,
          name: "⑥ 셀렉터 스위치 자동(A) 라인",
          color: "#06b6d4",
          nodes: ["SS-A(TB5 5번)", "FLS 5번", "FLS 4번"],
          loopOrder: "TB5 5번(SS-A) ➜ FLS 5번 ➜ FLS 4번",
          tip: "셀렉터 스위치 SS-A에서 좌측 통로로 하강 후 진행 방향(좌➜우)에 따라 먼저 만나는 FLS 5번(코일)에 체결 후 FLS 4번(a접점)으로 순차 배선합니다."
        },
        {
          num: 7,
          name: "⑦ FLS 수위 감지 동작선",
          color: "#3b82f6",
          nodes: ["FLS 3번", "X 2번"],
          loopOrder: "FLS 3번 ➜ X 2번",
          tip: "수위가 차올라 FLS a접점(4-3)이 닫히면 릴레이 X 코일(2번)을 여자시킵니다."
        },
        {
          num: 8,
          name: "⑧ 셀렉터 스위치 수동(M) 라인",
          color: "#ec4899",
          nodes: ["SS-M 출력(TB5 4번)", "PB0 입력(TB5 1번)"],
          loopOrder: "TB5 4번(SS-M) ➜ TB5 1번(PB0)",
          tip: "셀렉터 스위치 M(수동) 접점 하단에서 나와 정지 버튼 PB0 상단으로 연결되는 수동 제어 전원선입니다."
        },
        {
          num: 9,
          name: "⑨ 수동 정지(PB0) ➜ 기동(PB1) 및 T순시",
          color: "#f43f5e",
          nodes: ["PB0 출력·PB1 입력(TB5 3번 공통)", "T 1번(순시a)"],
          loopOrder: "TB5 3번(PB공통) ➜ T 1번",
          tip: "PB0 하단 출력에서 나와 기동 버튼 PB1 상단과 타이머 T 1번(순시 a접점)으로 분기되는 기동 대기 전원선입니다."
        },
        {
          num: 10,
          name: "⑩ 수동 자기유지 & MC1 기동 라인",
          color: "#fb923c",
          nodes: ["PB1 출력(TB5 2번)", "X 3번", "X 8번", "MC1 6번", "T 3번", "T 8번"],
          loopOrder: "TB5 2번(PB1) ➜ X 3번 ➜ X 8번 ➜ MC1 6번 ➜ T 3번 ➜ T 8번",
          tip: "기동 버튼 PB1, 타이머 순시 T(3번), 릴레이 자기유지 X(3번)가 합쳐져 릴레이 X(8번), MC1 코일(6번), 타이머 한시공통 T(8번)으로 전원이 전달되는 핵심 제어 모선입니다."
        },
        {
          num: 11,
          name: "⑪ 타이머 T 기동 신호선",
          color: "#a3e635",
          nodes: ["X 5번", "T 2번"],
          loopOrder: "X 5번 ➜ T 2번",
          tip: "릴레이 X b접점(8-5)을 통해 타이머 T 2번 코일로 전원이 투입됩니다. 자동 운전(X 여자) 때는 b접점이 열려 타이머가 동작하지 않아요."
        },
        {
          num: 12,
          name: "⑫ 전자접촉기 MC2 기동 라인",
          color: "#38bdf8",
          nodes: ["T 6번(한시a)", "MC2 6번"],
          loopOrder: "T 6번 ➜ MC2 6번",
          tip: "설정 시간이 지나 타이머 한시 a접점(8-6)이 닫히면 MC2 코일(6번)이 여자됩니다."
        },
        {
          num: 13,
          name: "⑬ MC1 운전 표시등 (RL)",
          color: "#818cf8",
          nodes: ["MC1 10번", "RL(TB5 18번)"],
          loopOrder: "TB5 18번(RL) ➜ MC1 10번",
          tip: "MC1이 여자되어 4-10번 보조 a접점이 닫히면 적색 램프(RL)가 켜집니다."
        },
        {
          num: 14,
          name: "⑭ MC2 운전 표시등 (GL)",
          color: "#c084fc",
          nodes: ["MC2 10번", "GL(TB5 19번)"],
          loopOrder: "TB5 19번(GL) ➜ MC2 10번",
          tip: "MC2가 여자되어 4-10번 보조 a접점이 닫히면 녹색 램프(GL)가 켜집니다."
        },
        {
          num: 15,
          name: "⑮ 하부 공통 중성선 (완벽 S자 N상 스네이크 루프)",
          color: "#94a3b8",
          nodes: [
            "TB5 20번(RL/GL공통)", "퓨즈 2차 L3", "FLS 6번", "EOCR 12번", "X 7번", "FR 7번", 
            "MC2 12번", "MC1 12번", "T 7번", "TB6 3번(YL/BZ공통)"
          ],
          loopOrder: "TB5 20번(RL/GL공통) ➜ 퓨즈 2차 L3 ➜ FLS 6번 ➜ EOCR 12번 ➜ X 7번 ➜ FR 7번 ➜ MC2 12번 ➜ MC1 12번 ➜ T 7번 ➜ TB6 3번(YL/BZ공통)",
          tip: "⚠️ <b>진행 방향 우선 (완벽 S자 스네이크)</b>: 최상단 우측(TB5 20)에서 좌측(퓨즈)으로, 중앙통로를 타고 우측으로(FLS 6 ➜ EOCR 12 ➜ X 7 ➜ FR 7), 하단통로를 타고 좌측으로(MC2 12 ➜ MC1 12 ➜ T 7), 그리고 하단 단자대(TB6 3)로 종단 체결하는 단방향 순차 배선입니다."
        }
      ]
    },

    // 6단계 결선: TB 단자대 바깥쪽 인출선 (약 10cm 빼고 끝 1cm 피복 탈피)
    // - TB1: 전원 인입선 갈(L1)·회(L3) 2가닥
    // - TB4: 1~9번 과제 = FLS 전극 E1·E2·E3 황색 3가닥 / 10~18번 과제 = 리밋스위치 2가닥
    externalLeads: {
      TB1: { title: '전원 인입선', wires: [{ label: 'L1', wire: 'L1', pin: 1 }, { label: 'L3', wire: 'L3', pin: 3 }] },
      TB4: { title: 'FLS 전극선 E1·E2·E3', wires: [{ label: 'E1', wire: 'AUX', pin: 1 }, { label: 'E2', wire: 'AUX', pin: 2 }, { label: 'E3', wire: 'AUX', pin: 3 }] }
    },

    // 7단계: 전원 투입 & 동작 테스트용 회로 정의 (전위 그룹 ①~⑮ = 노드)
    // - 접점(contacts): 두 노드 사이, type에 따라 닫힘 조건 결정
    //   input-nc/input-no: 푸시버튼(누르면 NC 열림·NO 닫힘), selector: 셀렉터 위치, relay-no/relay-nc: 코일 여자 시,
    //   timer-no: 타이머 한시 접점(설정 시간 경과 후), flicker-no/flicker-nc: 플리커 출력, eocr-nc/eocr-no: 과부하 트립, fls-no: 수위 감지 출력
    // - 코일·램프·부저(loads): 노드 ➜ ⑮(공통 N상) 사이, 노드에 전기가 오면 동작
    // - x, y: 시퀀스 도면(1753 x 1240) 위 표시 위치
    operation: {
      source: 1,      // ① 퓨즈 2차 L1
      neutral: 15,    // ⑮ 하부 공통선 (퓨즈 2차 L3)
      timerSetSec: 5,
      flickerSec: 0.6,
      levels: { E1: 80, E2: 40, E3: 6 },   // 수조 전극 높이(%): E1 단봉(고수위), E2 중봉(저수위), E3 장봉(공통)
      contacts: [
        { id: 'EOCR_b', name: 'EOCR b접점 (10-4)', from: 1, to: 2, type: 'eocr-nc', x: 653, y: 292 },
        { id: 'EOCR_a', name: 'EOCR a접점 (10-5)', from: 1, to: 3, type: 'eocr-no', x: 674, y: 557 },
        { id: 'SS_A', name: 'SS 자동(A)', from: 2, to: 6, type: 'selector', position: 'A', x: 1080, y: 350 },
        { id: 'SS_M', name: 'SS 수동(M)', from: 2, to: 8, type: 'selector', position: 'M', x: 1162, y: 350 },
        { id: 'FLS', name: 'FLS 접점 (4-3)', from: 6, to: 7, type: 'fls-no', coil: 'FLS', x: 1080, y: 557 },
        { id: 'PB0', name: 'PB0 정지 (NC)', from: 8, to: 9, type: 'input-nc', input: 'pb0', x: 1162, y: 428 },
        { id: 'PB1', name: 'PB1 기동 (NO)', from: 9, to: 10, type: 'input-no', input: 'pb1', x: 1162, y: 557 },
        { id: 'T_inst', name: 'T 순시 a접점 (1-3)', from: 9, to: 10, type: 'relay-no', coil: 'T', x: 1242, y: 557 },
        { id: 'X_13', name: 'X a접점 (1-3)', from: 2, to: 10, type: 'relay-no', coil: 'X', x: 1324, y: 353 },
        { id: 'X_85', name: 'X b접점 (8-5)', from: 10, to: 11, type: 'relay-nc', coil: 'X', x: 1162, y: 679 },
        { id: 'T_delay', name: 'T 한시 a접점 (8-6)', from: 10, to: 12, type: 'timer-no', coil: 'T', x: 1406, y: 679 },
        { id: 'MC1_aux', name: 'MC1 보조 a접점 (4-10)', from: 2, to: 13, type: 'relay-no', coil: 'MC1', x: 1486, y: 353 },
        { id: 'MC2_aux', name: 'MC2 보조 a접점 (4-10)', from: 2, to: 14, type: 'relay-no', coil: 'MC2', x: 1568, y: 353 },
        { id: 'FR_a', name: 'FR a접점 (8-6) ➜ YL', from: 3, to: 4, type: 'flicker-no', coil: 'FR', x: 754, y: 679 },
        { id: 'FR_b', name: 'FR b접점 (8-5) ➜ BZ', from: 3, to: 5, type: 'flicker-nc', coil: 'FR', x: 836, y: 679 }
      ],
      // 문제지 '4) 제어회로의 동작 사항' — 7단계에서 한 단계씩 실행·판정 (모두 통과하면 동작 테스트 성공)
      // actions: reset·power·ss·level·press(target, ms)·wait(ms)·waitTimer·trip·eocrReset
      // expect: on(켜져야 함)·off(꺼져야 함)·alternate(번갈아 동작, within ms 동안 관찰)
      steps: [
        { id: '가', title: '가) MCCB로 전원 투입 ➜ EOCR에 전원 공급',
          actions: [{ do: 'reset' }, { do: 'power', value: true }],
          expect: { on: ['EOCR'], off: ['X', 'MC1', 'MC2', 'FR'] } },
        { id: '나1', title: '나)(1) SS 자동(A) ➜ FLS 수위 감지 ➜ X·MC1 여자, M1 회전, RL 점등',
          actions: [{ do: 'ss', value: 'A' }, { do: 'level', value: 20 }],
          expect: { on: ['FLS', 'X', 'MC1', 'RL'], off: ['T', 'MC2', 'GL'] } },
        { id: '나2-1', title: '나)(2) 운전 중 FLS 수위 감지 해제 ➜ 모두 정지',
          actions: [{ do: 'level', value: 90 }],
          expect: { off: ['X', 'MC1', 'RL', 'T', 'MC2'] } },
        { id: '나2-2', title: '나)(2) 운전 중 SS를 M(수동)으로 ➜ 모두 정지',
          actions: [{ do: 'level', value: 20 }, { do: 'wait', ms: 900 }, { do: 'ss', value: 'M' }],
          expect: { off: ['FLS', 'X', 'MC1', 'RL'] } },
        { id: '다1', title: '다)(1) SS 수동(M) ➜ PB1 누름 ➜ T·MC1 여자(자기유지), M1 회전, RL 점등',
          actions: [{ do: 'ss', value: 'M' }, { do: 'press', target: 'pb1', ms: 700 }],
          expect: { on: ['T', 'MC1', 'RL'], off: ['X', 'MC2', 'GL'] } },
        { id: '다2', title: '다)(2) 타이머 설정시간 t초 후 ➜ MC2 여자, M2 회전, GL 점등',
          actions: [{ do: 'waitTimer' }],
          expect: { on: ['MC1', 'MC2', 'RL', 'GL'] } },
        { id: '다3-1', title: '다)(3) 운전 중 PB0 누름 ➜ 모두 정지',
          actions: [{ do: 'press', target: 'pb0', ms: 600 }],
          expect: { off: ['T', 'MC1', 'MC2', 'RL', 'GL'] } },
        { id: '다3-2', title: '다)(3) 운전 중 SS를 A(자동)로 ➜ 모두 정지',
          actions: [{ do: 'level', value: 90 }, { do: 'press', target: 'pb1', ms: 600 }, { do: 'wait', ms: 900 }, { do: 'ss', value: 'A' }],
          expect: { off: ['T', 'MC1', 'MC2', 'X'] } },
        { id: '라1', title: '라)(1) 운전 중 과부하 ➜ EOCR 동작: 전동기 정지, FR 여자, BZ 동작',
          actions: [{ do: 'ss', value: 'M' }, { do: 'press', target: 'pb1', ms: 600 }, { do: 'wait', ms: 900 }, { do: 'trip' }],
          expect: { on: ['FR', 'BZ'], off: ['MC1', 'MC2', 'T', 'YL'] } },
        { id: '라2', title: '라)(2) FR 설정시간 간격으로 BZ와 YL 교대 동작',
          actions: [],
          expect: { alternate: ['BZ', 'YL'], within: 2600 } },
        { id: '라3', title: '라)(3) EOCR 리셋 ➜ 제어회로 초기 상태로 복귀',
          actions: [{ do: 'eocrReset' }],
          expect: { on: ['EOCR'], off: ['FR', 'BZ', 'YL', 'MC1', 'MC2', 'T'] } }
      ],
      loads: [
        { id: 'EOCR', name: 'EOCR 전원', node: 1, kind: 'relay', x: 592, y: 760 },
        { id: 'FR', name: '플리커 릴레이 FR', node: 3, kind: 'relay', x: 672, y: 760 },
        { id: 'YL', name: '황색 램프 YL', node: 4, kind: 'lamp', color: 'yellow', x: 754, y: 760 },
        { id: 'BZ', name: '부저 BZ', node: 5, kind: 'buzzer', x: 836, y: 760 },
        { id: 'FLS', name: '플로트리스 FLS', node: 6, kind: 'relay', x: 918, y: 760 },
        { id: 'X', name: '릴레이 X', node: 7, kind: 'relay', x: 1080, y: 760 },
        { id: 'T', name: '타이머 T', node: 11, kind: 'timer', x: 1160, y: 760 },
        { id: 'MC1', name: '전자접촉기 MC1 (M1)', node: 10, kind: 'contactor', motor: 'M1', x: 1324, y: 760 },
        { id: 'MC2', name: '전자접촉기 MC2 (M2)', node: 12, kind: 'contactor', motor: 'M2', x: 1406, y: 760 },
        { id: 'RL', name: '적색 램프 RL', node: 13, kind: 'lamp', color: 'red', x: 1486, y: 760 },
        { id: 'GL', name: '녹색 램프 GL', node: 14, kind: 'lamp', color: 'green', x: 1568, y: 760 }
      ]
    }
  }
};
