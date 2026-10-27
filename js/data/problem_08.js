/**
 * 전기기능사 실기 공개문제 08번 데이터 정의
 * - 문제지(assets/problems/08) 도면 판독 결과
 *   · 제어판: 1열 F·MCCB·EOCR·X·FR / 2열 MC1·MC2·T·FLS
 *   · 배관도(1번처럼 J박스가 왼쪽): PB0/PB1·SS/CAP(좌상, J박스 경유), GL/RL(우상), YL/BZ(우하), TB1(상)·TB2(좌하)·TB3(하)·TB4(우하)
 *   · 회로: 자동 = FLS ➜ X·FR, FR b(8-5)로 YL 점멸, X a(1-3) ➜ 운전 모선 ➜ T 한시 b(8-5) ➜ MC1·MC2 동시 운전
 *          수동 = PB1(T 순시 a 1-3 자기유지) ➜ 운전 모선 ➜ MC1·MC2 + X b(8-5) ➜ T ➜ t초 후 T 한시 b 열림 ➜ MC1·MC2 정지
 *          EOCR 트립 시 BZ만 동작
 * - 4단계 보조회로 경로는 auxChains(단자 순서)만 정의하면 엔진이 통로 규칙대로 자동 생성 (세 번째 값 'L'/'R' = 층간 이동 통로 지정)
 */
export const problem08 = {
  id: 8,
  title: "공개문제 8번",
  subtitle: "급수 동시 운전 회로 (자동: MC1·MC2 동시 + YL 점멸 / 수동: t초 후 정지)",
  // 단계별 도면 이미지 (문제지 PDF에서 150dpi로 변환)
  assets: {
    piping: "assets/problems/08/piping_layout.png",
    board: "assets/problems/08/board_layout.png",
    sequence: "assets/problems/08/sequence_diagram.png",
    internal: "assets/problems/08/internal_wiring.png"
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
      { y: 145, label: "1열 기구 중심선 (F, MCCB, EOCR, X, FR)", type: "component" },
      { y: 275, label: "2열 기구 중심선 (MC1, MC2, T, FLS)", type: "component" },
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
        desc: "상부 외부 기구(누름버튼, 셀렉터, 램프, TB1 전원)와 연결되는 20P 단자대" },
      { id: "F", name: "퓨즈홀더 (FUSE)", label: "F", type: "fuse_holder", x: 69, y: 145, width: 38, height: 65, pins: 4,
        desc: "제어회로 과전류 보호용 2구 퓨즈홀더 (위: 1차측 입력, 아래: 2차측 출력) — 맨 왼쪽" },
      { id: "MCCB", name: "배선용 차단기", label: "MCCB", type: "mccb", x: 133, y: 145, width: 52, height: 72, pins: 6,
        desc: "3상 메인 전원 차단기 (ON/OFF 레버 장착)" },
      { id: "EOCR", name: "전자식 과전류 계전기", label: "EOCR", type: "socket_12p", x: 204, y: 145, width: 50, height: 68, pins: 12, notchDirection: "bottom",
        desc: "모터 과부하 보호 계전기 (12핀 소켓, 홈은 반드시 아래쪽!)" },
      { id: "X", name: "8핀 릴레이", label: "X", type: "socket_8p", x: 268, y: 145, width: 44, height: 62, pins: 8, notchDirection: "bottom",
        desc: "자동 운전 릴레이 (a 1-3으로 운전 모선, b 8-5로 타이머 차단)" },
      { id: "FR", name: "플리커 릴레이", label: "FR", type: "socket_8p", x: 328, y: 145, width: 44, height: 62, pins: 8, notchDirection: "bottom",
        desc: "자동 운전 중 YL을 점멸시키는 플리커 릴레이 (b 8-5)" },
      { id: "MC1", name: "전자 접촉기 1", label: "MC1", type: "socket_12p", x: 81, y: 275, width: 50, height: 68, pins: 12, notchDirection: "bottom",
        desc: "전동기 M1을 구동하는 전자 접촉기 (12핀 소켓)" },
      { id: "MC2", name: "전자 접촉기 2", label: "MC2", type: "socket_12p", x: 161, y: 275, width: 50, height: 68, pins: 12, notchDirection: "bottom",
        desc: "전동기 M2를 구동하는 전자 접촉기 (12핀 소켓)" },
      { id: "T", name: "타이머", label: "T", type: "socket_8p", x: 235, y: 275, width: 44, height: 62, pins: 8, notchDirection: "bottom",
        desc: "수동 운전 타이머 (순시 a 1-3 자기유지, 한시 b 8-5로 t초 후 MC1·MC2 정지)" },
      { id: "FLS", name: "플로트레스 스위치", label: "FLS", type: "socket_8p", x: 305, y: 275, width: 44, height: 62, pins: 8, notchDirection: "bottom",
        desc: "물탱크 수위 감지 스위치 (8핀 소켓, E1-E2-E3 전극봉 연동)" },
      { id: "TB6", name: "TB6 (10P+10P 단자대)", label: "TB6", type: "terminal_block_20p", x: 200, y: 370, width: 250, height: 38, pins: 20,
        desc: "하부 외부 기구(램프·부저, 전동기 TB2·TB3, 수위 TB4)와 연결되는 20P 단자대" }
    ],
    // 배관도(문제지 5쪽) 기반 단자대 핀 마킹
    // - 박스: 바깥쪽 끝부터 3개씩 (TB5: PB 좌측 끝, SS 그 안쪽, GL/RL 우측 끝 / TB6: YL/BZ 우측 끝)
    // - TB1 9~12, TB4 11~13(14번 비움), 전동기 TB2·TB3은 남은 4핀 자리를 배관도 좌우 순서대로(TB2 1~4 · 간격 5·6 · TB3 7~10)
    terminalMarkings: {
      tb5: [
        { pin: 1, label: "PB0", group: "PB0/PB1", color: "#ef4444", desc: "푸시버튼 0 (적색, NC)" },
        { pin: 2, label: "PB1", group: "PB0/PB1", color: "#22c55e", desc: "푸시버튼 1 (녹색, NO)" },
        { pin: 3, label: "공통", group: "PB0/PB1", color: "#f59e0b", desc: "PB0·PB1 연결점 공통선 (COM)" },
        { pin: 4, label: "SS-M", group: "SS", color: "#38bdf8", desc: "셀렉터 스위치 수동 (M)" },
        { pin: 5, label: "SS-A", group: "SS", color: "#38bdf8", desc: "셀렉터 스위치 자동 (A)" },
        { pin: 6, label: "공통", group: "SS", color: "#f59e0b", desc: "셀렉터 스위치 공통선 (COM)" },
        { pin: 7, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 8, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 9, label: "L1", group: "TB1", color: "#92400e", desc: "주전원 L1 (갈색)" },
        { pin: 10, label: "L2", group: "TB1", color: "#1e293b", desc: "주전원 L2 (흑색)" },
        { pin: 11, label: "L3", group: "TB1", color: "#64748b", desc: "주전원 L3 (회색)" },
        { pin: 12, label: "PE", group: "TB1", color: "#84cc16", desc: "보호도체 접지 (녹황색)" },
        { pin: 13, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 14, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 15, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 16, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 17, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 18, label: "GL", group: "GL/RL", color: "#22c55e", desc: "녹색 램프 (GL, MC2 운전)" },
        { pin: 19, label: "RL", group: "GL/RL", color: "#ef4444", desc: "적색 램프 (RL, MC1 운전)" },
        { pin: 20, label: "공통", group: "GL/RL", color: "#f59e0b", desc: "램프 공통선 (COM)" }
      ],
      tb6: [
        { pin: 1, label: "U1", group: "TB2", color: "#92400e", desc: "전동기 M1 U1 (갈색)" },
        { pin: 2, label: "V1", group: "TB2", color: "#1e293b", desc: "전동기 M1 V1 (흑색)" },
        { pin: 3, label: "W1", group: "TB2", color: "#64748b", desc: "전동기 M1 W1 (회색)" },
        { pin: 4, label: "PE", group: "TB2", color: "#84cc16", desc: "전동기 M1 접지 (녹황색)" },
        { pin: 5, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 6, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 7, label: "U2", group: "TB3", color: "#92400e", desc: "전동기 M2 U2 (갈색)" },
        { pin: 8, label: "V2", group: "TB3", color: "#1e293b", desc: "전동기 M2 V2 (흑색)" },
        { pin: 9, label: "W2", group: "TB3", color: "#64748b", desc: "전동기 M2 W2 (회색)" },
        { pin: 10, label: "PE", group: "TB3", color: "#84cc16", desc: "전동기 M2 접지 (녹황색)" },
        { pin: 11, label: "E1", group: "TB4", color: "#06b6d4", desc: "FLS 7번 ➜ 수위 E1" },
        { pin: 12, label: "E2", group: "TB4", color: "#06b6d4", desc: "FLS 8번 ➜ 수위 E2" },
        { pin: 13, label: "E3", group: "TB4", color: "#06b6d4", desc: "FLS 1번 ➜ 수위 E3 + 접지(PE) 함께 체결" },
        { pin: 14, label: "-", group: "empty", color: "#64748b", desc: "여유 단자 (TB4 네 번째 단자는 사용 안 함)" },
        { pin: 15, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 16, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 17, label: "-", group: "empty", color: "#64748b", desc: "여유 단자" },
        { pin: 18, label: "YL", group: "YL/BZ", color: "#eab308", desc: "황색 램프 (YL, 자동 운전 점멸)" },
        { pin: 19, label: "BZ", group: "YL/BZ", color: "#f97316", desc: "부저 (BZ, EOCR 경보)" },
        { pin: 20, label: "공통", group: "YL/BZ", color: "#f59e0b", desc: "YL·BZ 공통선 (COM)" }
      ]
    },
    // 2단계: 주회로 (퓨즈 맨 왼쪽, MCCB·EOCR 순서 ➜ EOCR 1차는 좌측 통로로 돌아 상단 통로에서 진입)
    mainCircuit: {
      wireSpecs: { type: "HIV/KIV 2.5㎟", l1Color: "#92400e", l2Color: "#1e293b", l3Color: "#64748b", peColor: "#15803d", peStripe: "#eab308" },
      steps: [
        {
          step: 1,
          name: "1. 보호도체(PE) 접지선 결선 (최우선 작업!)",
          desc: "PE 접지선(녹황색)을 가장 먼저 결선합니다. TB1 ➜ 우측 25mm 배선로 ➜ TB2 ➜ TB3 ➜ 마지막에 TB4(E3) 순서입니다.",
          tip: "⚠️ <b>실격 방지</b>: FLS 접지는 E3 단자(13번)에 보조선과 함께 물리므로 <b>지나가는 길에 물리지 말고 맨 마지막</b>에 종단합니다! 같은 단자에서 선이 다시 나갈 때는 나사 좌우로 나누어 체결합니다.",
          wires: [
            { id: "w-pe-tb1-tb2", phase: "PE", color: "#15803d", stripe: "#eab308",
              from: { comp: "TB5", pin: "bot-12", label: "TB1 PE (12번)" }, to: { comp: "TB6", pin: "top-4", label: "TB2 PE (4번 나사 좌측)" },
              points: [[218.5, 62.5], [218.5, 95], [375, 95], [375, 330], [118.4, 330], [118.4, 357.5]] },
            { id: "w-pe-tb2-tb3", phase: "PE", color: "#15803d", stripe: "#eab308",
              from: { comp: "TB6", pin: "top-4", label: "TB2 PE (4번 나사 우측)" }, to: { comp: "TB6", pin: "top-10", label: "TB3 PE (10번 나사 좌측)" },
              points: [[121.6, 357.5], [121.6, 350], [192.2, 350], [192.2, 357.5]] },
            { id: "w-pe-tb3-tb4", phase: "PE", color: "#15803d", stripe: "#eab308",
              from: { comp: "TB6", pin: "top-10", label: "TB3 PE (10번 나사 우측)" }, to: { comp: "TB6", pin: "top-13", label: "TB4 E3 (13번) 접지 종단 — FLS 1번 보조선과 함께" },
              points: [[195.4, 357.5], [195.4, 353], [229.2, 353], [229.2, 357.5]] }
          ]
        },
        {
          step: 2,
          name: "2. 전원 인입선 결선 (TB1 ➜ MCCB 1차)",
          desc: "상단 TB1(L1·L2·L3)에서 상단 가로 통로를 거쳐 왼쪽의 배선용 차단기(MCCB) 1차측 3개 단자로 직각 배선합니다.",
          tip: "💡 L1(갈색)·L2(흑색)·L3(회색) 순서를 절대 바꾸지 마세요!",
          wires: [
            { id: "w-tb1-mccb-l1", phase: "L1", color: "#92400e", from: { comp: "TB5", pin: "bot-9", label: "TB1 L1 (9번)" }, to: { comp: "MCCB", pin: "in-1", label: "MCCB 1차 L1" },
              points: [[181.5, 62.5], [181.5, 80], [117, 80], [117, 117]] },
            { id: "w-tb1-mccb-l2", phase: "L2", color: "#1e293b", from: { comp: "TB5", pin: "bot-10", label: "TB1 L2 (10번)" }, to: { comp: "MCCB", pin: "in-2", label: "MCCB 1차 L2" },
              points: [[193.8, 62.5], [193.8, 84], [133, 84], [133, 117]] },
            { id: "w-tb1-mccb-l3", phase: "L3", color: "#64748b", from: { comp: "TB5", pin: "bot-11", label: "TB1 L3 (11번)" }, to: { comp: "MCCB", pin: "in-3", label: "MCCB 1차 L3" },
              points: [[206.2, 62.5], [206.2, 88], [149, 88], [149, 117]] }
          ]
        },
        {
          step: 3,
          name: "3. 차단기 ➜ EOCR 1차측 결선 (중앙 통로 ➜ 좌측 25mm 통로)",
          desc: "MCCB 2차측에서 중앙 가로 통로로 내려와 좌측 끝 25mm 통로를 타고 올라가, 상단 가로 통로에서 오른쪽 EOCR 1·2·3번 나사 좌측으로 연결합니다.",
          tip: "💡 MCCB와 EOCR 사이 틈새로 가로지르지 않고, 반드시 좌측 25mm 배선로로 돌아갑니다.",
          wires: [
            { id: "w-mccb-eocr-l1", phase: "L1", color: "#92400e", from: { comp: "MCCB", pin: "out-1", label: "MCCB 2차 L1" }, to: { comp: "EOCR", pin: "1", label: "EOCR 1번 나사 좌측" },
              points: [[117, 173], [117, 200], [27, 200], [27, 98], [182.5, 98], [182.5, 117.5]] },
            { id: "w-mccb-eocr-l2", phase: "L2", color: "#1e293b", from: { comp: "MCCB", pin: "out-2", label: "MCCB 2차 L2" }, to: { comp: "EOCR", pin: "2", label: "EOCR 2번 (L2)" },
              points: [[133, 173], [133, 203], [25, 203], [25, 95], [192, 95], [192, 117.5]] },
            { id: "w-mccb-eocr-l3", phase: "L3", color: "#64748b", from: { comp: "MCCB", pin: "out-3", label: "MCCB 2차 L3" }, to: { comp: "EOCR", pin: "3", label: "EOCR 3번 나사 좌측" },
              points: [[149, 173], [149, 206], [23, 206], [23, 92], [198.5, 92], [198.5, 117.5]] }
          ]
        },
        {
          step: 4,
          name: "4. 퓨즈홀더 1차측 전원 인출 (EOCR 1, 3번 나사 우측 ➜ 퓨즈 1, 2번)",
          desc: "EOCR 1번 나사 우측에서 갈색(L1), 3번 나사 우측에서 회색(L3)을 인출하여 상단 가로 통로를 지나 맨 왼쪽 퓨즈 1·2번으로 연결합니다.",
          tip: "⚠️ <b>초특급 중요</b>: 퓨즈 1차측은 반드시 갈색(L1)과 회색(L3) 2.5㎟ 주회로 전선을 사용합니다!",
          wires: [
            { id: "w-fuse-l1", phase: "L1", color: "#92400e", from: { comp: "EOCR", pin: "1", label: "EOCR 1번 나사 우측" }, to: { comp: "F", pin: "in-1", label: "퓨즈홀더 1차 1번" },
              points: [[185.5, 117.5], [185.5, 104], [61, 104], [61, 120.5]] },
            { id: "w-fuse-l3", phase: "L3", color: "#64748b", from: { comp: "EOCR", pin: "3", label: "EOCR 3번 나사 우측" }, to: { comp: "F", pin: "in-2", label: "퓨즈홀더 1차 2번" },
              points: [[201.5, 117.5], [201.5, 108], [77, 108], [77, 120.5]] }
          ]
        },
        {
          step: 5,
          name: "5. EOCR 2차 ➜ MC1, MC2 1차측 병렬 분기 (중앙 통로 활용)",
          desc: "EOCR 7·8·9번에서 중앙 가로 통로를 지나 왼쪽 아래 MC1 1·2·3번 나사 좌측으로 내려가고, MC1 나사 우측에서 MC2 1·2·3번으로 점프 분기합니다.",
          tip: "💡 한 단자에 전선 2가닥 체결 시 나사 좌우로 나누어 체결합니다.",
          wires: [
            { id: "w-eocr-mc1-l1", phase: "L1", color: "#92400e", from: { comp: "EOCR", pin: "7", label: "EOCR 7번 (U)" }, to: { comp: "MC1", pin: "1", label: "MC1 1번 나사 좌측" },
              points: [[184, 172.5], [184, 212], [59.5, 212], [59.5, 247.5]] },
            { id: "w-eocr-mc1-l2", phase: "L2", color: "#1e293b", from: { comp: "EOCR", pin: "8", label: "EOCR 8번 (V)" }, to: { comp: "MC1", pin: "2", label: "MC1 2번 나사 좌측" },
              points: [[192, 172.5], [192, 215], [67.5, 215], [67.5, 247.5]] },
            { id: "w-eocr-mc1-l3", phase: "L3", color: "#64748b", from: { comp: "EOCR", pin: "9", label: "EOCR 9번 (W)" }, to: { comp: "MC1", pin: "3", label: "MC1 3번 나사 좌측" },
              points: [[200, 172.5], [200, 218], [75.5, 218], [75.5, 247.5]] },
            { id: "w-mc1-mc2-l1", phase: "L1", color: "#92400e", from: { comp: "MC1", pin: "1", label: "MC1 1번 나사 우측" }, to: { comp: "MC2", pin: "1", label: "MC2 1번" },
              points: [[62.5, 247.5], [62.5, 224], [141, 224], [141, 247.5]] },
            { id: "w-mc1-mc2-l2", phase: "L2", color: "#1e293b", from: { comp: "MC1", pin: "2", label: "MC1 2번 나사 우측" }, to: { comp: "MC2", pin: "2", label: "MC2 2번" },
              points: [[70.5, 247.5], [70.5, 227], [149, 227], [149, 247.5]] },
            { id: "w-mc1-mc2-l3", phase: "L3", color: "#64748b", from: { comp: "MC1", pin: "3", label: "MC1 3번 나사 우측" }, to: { comp: "MC2", pin: "3", label: "MC2 3번" },
              points: [[78.5, 247.5], [78.5, 230], [157, 230], [157, 247.5]] }
          ]
        },
        {
          step: 6,
          name: "6. MC1 ➜ TB2, MC2 ➜ TB3 부하 결선 (하단 통로 활용)",
          desc: "MC1 2차측(7·8·9)은 하단 통로를 지나 TB2(1·2·3)로, MC2 2차측(7·8·9)은 TB3(7·8·9)로 직각 결선합니다.",
          tip: "💡 8번 과제는 전동기 M1이 TB2(1·2·3, 왼쪽 아래 단자대), 전동기 M2가 TB3(7·8·9, 아래 가운데 단자대)입니다!",
          wires: [
            { id: "w-mc1-tb2-u1", phase: "L1", color: "#92400e", from: { comp: "MC1", pin: "7", label: "MC1 7번 (U1)" }, to: { comp: "TB6", pin: "top-1", label: "TB2 U1 (1번)" },
              points: [[61, 302.5], [61, 326], [83, 326], [83, 357.5]] },
            { id: "w-mc1-tb2-v1", phase: "L2", color: "#1e293b", from: { comp: "MC1", pin: "8", label: "MC1 8번 (V1)" }, to: { comp: "TB6", pin: "top-2", label: "TB2 V1 (2번)" },
              points: [[69, 302.5], [69, 322], [95.3, 322], [95.3, 357.5]] },
            { id: "w-mc1-tb2-w1", phase: "L3", color: "#64748b", from: { comp: "MC1", pin: "9", label: "MC1 9번 (W1)" }, to: { comp: "TB6", pin: "top-3", label: "TB2 W1 (3번)" },
              points: [[77, 302.5], [77, 318], [107.6, 318], [107.6, 357.5]] },
            { id: "w-mc2-tb3-u2", phase: "L1", color: "#92400e", from: { comp: "MC2", pin: "7", label: "MC2 7번 (U2)" }, to: { comp: "TB6", pin: "top-7", label: "TB3 U2 (7번)" },
              points: [[141, 302.5], [141, 344], [156.9, 344], [156.9, 357.5]] },
            { id: "w-mc2-tb3-v2", phase: "L2", color: "#1e293b", from: { comp: "MC2", pin: "8", label: "MC2 8번 (V2)" }, to: { comp: "TB6", pin: "top-8", label: "TB3 V2 (8번)" },
              points: [[149, 302.5], [149, 340], [169.2, 340], [169.2, 357.5]] },
            { id: "w-mc2-tb3-w2", phase: "L3", color: "#64748b", from: { comp: "MC2", pin: "9", label: "MC2 9번 (W2)" }, to: { comp: "TB6", pin: "top-9", label: "TB3 W2 (9번)" },
              points: [[157, 302.5], [157, 336], [181.5, 336], [181.5, 357.5]] }
          ]
        }
      ]
    },
    // 3단계: 시퀀스 도면 핀번호 부여 및 전위 그루핑 (문제지 7쪽, 1753 x 1240 픽셀)
    sequenceCircuit: {
      pinDictionary: [
        { comp: "EOCR", power: "6 - 12", contacts: [{ type: "b접점", pins: "10 - 4" }, { type: "a접점 ➜ BZ", pins: "10 - 5" }] },
        { comp: "X", power: "2 - 7", contacts: [{ type: "a접점 ➜ 운전 모선", pins: "1 - 3" }, { type: "b접점 ➜ T", pins: "8 - 5" }] },
        { comp: "FR", power: "2 - 7", contacts: [{ type: "b접점 ➜ YL 점멸", pins: "8 - 5" }] },
        { comp: "T", power: "2 - 7", contacts: [{ type: "순시 a접점(자기유지)", pins: "1 - 3" }, { type: "한시 b접점 ➜ MC1·MC2", pins: "8 - 5" }] },
        { comp: "FLS", power: "5 - 6", contacts: [{ type: "a접점", pins: "4 - 3" }], electrodes: "7(E1) - 8(E2) - 1(E3)" },
        { comp: "MC1", power: "6 - 12", contacts: [{ type: "보조 a접점", pins: "4 - 10" }, { type: "주접점", pins: "1-7, 2-8, 3-9" }] },
        { comp: "MC2", power: "6 - 12", contacts: [{ type: "보조 a접점", pins: "4 - 10" }, { type: "주접점", pins: "1-7, 2-8, 3-9" }] }
      ],
      pinPlacements: [
        { id: "p-eocr-b", comp: "EOCR", label: "10 - 4", type: "b접점", orientation: "horizontal", x: 653, y: 292, left: "10", right: "4", leftX: 595, rightX: 710, badgeY: 264 },
        { id: "p-eocr-a", comp: "EOCR", label: "10 - 5", type: "a접점", orientation: "vertical_exact", x: 673, topX: 681, topY: 647, botX: 681, botY: 701, top: "10", bot: "5" },
        { id: "p-eocr-pwr", comp: "EOCR", label: "6, 12", type: "전원", orientation: "coil_exact", x: 592, y: 766, top: "6", bot: "12" },
        { id: "p-fls-pwr", comp: "FLS", label: "5, 6", type: "전원", orientation: "fls_coil_exact", x: 755, y: 766, top: "5", bot: "6" },
        { id: "p-x-pwr", comp: "X", label: "2, 7", type: "전원", orientation: "coil_exact", x: 917, y: 766, top: "2", bot: "7" },
        { id: "p-fr-pwr", comp: "FR", label: "2, 7", type: "전원", orientation: "coil_exact", x: 999, y: 766, top: "2", bot: "7" },
        { id: "p-t-pwr", comp: "T", label: "2, 7", type: "전원", orientation: "coil_exact", x: 1162, y: 766, top: "2", bot: "7" },
        { id: "p-mc1-pwr", comp: "MC1", label: "6, 12", type: "전원", orientation: "coil_exact", x: 1324, y: 766, top: "6", bot: "12" },
        { id: "p-mc2-pwr", comp: "MC2", label: "6, 12", type: "전원", orientation: "coil_exact", x: 1405, y: 766, top: "6", bot: "12" },
        { id: "p-fls-a", comp: "FLS", label: "4, 3", type: "a접점", orientation: "vertical_exact", x: 917, topX: 925, topY: 523, botX: 925, botY: 577, top: "4", bot: "3" },
        { id: "p-fr-b", comp: "FR", label: "8, 5", type: "b접점", orientation: "vertical_exact", x: 1080, topX: 1088, topY: 647, botX: 1088, botY: 701, top: "8", bot: "5" },
        { id: "p-t-inst", comp: "T", label: "1, 3", type: "순시a접점(자기유지)", orientation: "vertical_exact", x: 1243, topX: 1251, topY: 523, botX: 1251, botY: 577, top: "1", bot: "3" },
        { id: "p-x-b", comp: "X", label: "8, 5", type: "b접점", orientation: "vertical_exact", x: 1162, topX: 1170, topY: 647, botX: 1170, botY: 701, top: "8", bot: "5" },
        { id: "p-x-a", comp: "X", label: "1, 3", type: "a접점", orientation: "vertical_exact", x: 1324, topX: 1332, topY: 317, botX: 1332, botY: 371, top: "1", bot: "3" },
        { id: "p-t-b", comp: "T", label: "8, 5", type: "한시b접점", orientation: "vertical_exact", x: 1405, topX: 1413, topY: 523, botX: 1413, botY: 577, top: "8", bot: "5" },
        { id: "p-mc1-a", comp: "MC1", label: "4, 10", type: "보조a접점", orientation: "vertical_exact", x: 1487, topX: 1495, topY: 317, botX: 1495, botY: 371, top: "4", bot: "10" },
        { id: "p-mc2-a", comp: "MC2", label: "4, 10", type: "보조a접점", orientation: "vertical_exact", x: 1567, topX: 1575, topY: 317, botX: 1575, botY: 371, top: "4", bot: "10" },
        { id: "p-fls-el", comp: "FLS", label: "7, 8, 1", type: "전극", orientation: "electrode", x: 785, y: 812, e1: "7", e2: "8", e3: "1" }
      ],
      flsPreWiring: {
        id: "fls-electrode-prewire",
        name: "⚡ [주회로 직후 최우선 결선] FLS 전극봉선 (7·8·1 ➜ E1·E2·E3)",
        color: "#2563eb",
        wires: [
          { from: "FLS 7번", to: "TB4 E1 (단봉)", color: "#2563eb" },
          { from: "FLS 8번", to: "TB4 E2 (중봉)", color: "#3b82f6" },
          { from: "FLS 1번", to: "TB4 E3 (장봉/접지)", color: "#60a5fa" }
        ],
        path: "M 776 782 L 795 782 L 795 857 M 777 766 L 815 766 L 815 857 M 776 750 L 836 750 L 836 857",
        guideHtml: `⚡ <b>[주회로 직후 최우선 결선 가이드: FLS 7·8·1 ➜ TB4 E1·E2·E3]</b><br>
        주회로 작업이 끝나면, <b>일반 14개 보조회로 결선에 들어가기 전에 가장 먼저 FLS 소켓 7·8·1번에서 하단 TB4의 E1·E2·E3 단자로 3가닥을 직결</b>합니다!<br>
        <span style="color: #60a5fa; font-weight: bold;">(전극선은 보조회로 전원과 무관한 짧은 독립 결선이라 먼저 해 두면 이후 배선과 엉키지 않아요.)</span>`
      },
      // 공통선(COM) 초록 뱃지 위치: SS 상단(A·M), PB0·PB1 연결점, YL·BZ 하단, RL·GL 하단
      commons: {
        ssArc: [917, 1162, 292],
        // PB0·PB1 공통(위아래 두 단자 사이)과 같은 박스 램프·부저의 아래 단자 공통을 초록 선으로 표시
        pbLink: [1162, 457, 540],
        links: [[673, 1080, 828], [1487, 1567, 828]],
        badges: []
      },
      // 전위 그룹별 시퀀스 도면 경로 (3단계 형광펜·7단계 전류 흐름 공용)
      groupPaths: {
        1: "M 370 375 L 511 375 L 511 292 L 637 292 M 592 292 L 592 746 M 592 622 L 673 622 L 673 663",
        2: "M 670 292 L 1567 292 M 917 292 L 917 334 M 1162 292 L 1162 334 M 1324 292 L 1324 334 M 1487 292 L 1487 334 M 1567 292 L 1567 334",
        3: "M 673 704 L 673 746",
        4: "M 917 375 L 917 540 M 917 498 L 755 498 L 755 746",
        5: "M 917 581 L 917 746 M 917 622 L 1080 622 L 1080 663 M 999 622 L 999 746",
        6: "M 1080 704 L 1080 746",
        7: "M 1162 375 L 1162 416",
        8: "M 1162 457 L 1162 540 M 1162 498 L 1243 498 L 1243 540",
        9: "M 1162 581 L 1162 663 M 1243 581 L 1243 622 M 1162 622 L 1324 622 M 1324 375 L 1324 622 M 1324 498 L 1405 498 L 1405 540",
        10: "M 1162 704 L 1162 746",
        11: "M 1405 581 L 1405 746 M 1405 704 L 1324 704 L 1324 746",
        12: "M 1487 375 L 1487 746",
        13: "M 1567 375 L 1567 746",
        14: "M 370 406 L 511 406 L 511 828 L 1567 828 M 592 786 L 592 828 M 673 786 L 673 828 M 755 786 L 755 828 M 917 786 L 917 828 M 999 786 L 999 828 M 1080 786 L 1080 828 M 1162 786 L 1162 828 M 1324 786 L 1324 828 M 1405 786 L 1405 828 M 1487 786 L 1487 828 M 1567 786 L 1567 828"
      },
      // 14대 전위 그루핑 (문제지 '도면별 시퀀스회로 그룹수' 8번 = 14개, FLS 7·8·1 제외) — 번호는 도면 왼쪽 열부터
      groups: [
        { num: 1, name: "① 제어 전원선 (퓨즈 L1)", color: "#ef4444",
          nodes: ["EOCR 6번(코일)", "퓨즈 2차 L1(out-1)", "EOCR 10번(b접점·트립 공통)"],
          loopOrder: "EOCR 6번 ➜ (좌측 통로 하강) ➜ 퓨즈 2차 L1(out-1) ➜ EOCR 10번",
          tip: "퓨즈 2차 L1에서 EOCR 코일(6번)과 EOCR 10번으로 전원을 공급합니다. 도면의 10번 두 개는 같은 단자입니다." },
        { num: 2, name: "② EOCR b접점 출력 모선", color: "#f97316",
          nodes: ["EOCR 4번", "SS 공통(TB5 6번)", "MC1 4번", "MC2 4번", "X 1번"],
          loopOrder: "EOCR 4번 ➜ TB5 6번(SS공통) ➜ (좌측 통로 하강) ➜ MC1 4번 ➜ MC2 4번 ➜ X 1번",
          tip: "EOCR b접점(10-4)을 지난 전원이 셀렉터 공통, X a접점(1번), MC1·MC2 보조접점(4번)으로 나갑니다." },
        { num: 3, name: "③ EOCR 트립 경보선 (BZ)", color: "#eab308",
          nodes: ["EOCR 5번", "BZ(TB6 19번)"],
          loopOrder: "EOCR 5번 ➜ (우측 통로 하강) ➜ TB6 19번(BZ)",
          tip: "과부하 트립 시 EOCR a접점(10-5)이 닫혀 부저 BZ가 울립니다(8번 과제는 YL이 아니라 BZ만)." },
        { num: 4, name: "④ 셀렉터 자동(A) ➜ FLS 전원", color: "#06b6d4",
          nodes: ["SS-A(TB5 5번)", "FLS 4번", "FLS 5번"],
          loopOrder: "TB5 5번(SS-A) ➜ (우측 통로 하강) ➜ FLS 4번 ➜ FLS 5번",
          tip: "자동(A)에서 FLS 전원(5번)과 FLS 접점 공통(4번)에 전원이 들어갑니다." },
        { num: 5, name: "⑤ FLS 출력 ➜ X·FR (FR 접점 공통)", color: "#ec4899",
          nodes: ["FR 2번(코일)", "FR 8번(공통)", "FLS 3번", "X 2번(코일)"],
          loopOrder: "FR 2번 ➜ FR 8번 ➜ FLS 3번 ➜ X 2번 (중앙 통로 우→좌)",
          tip: "수위가 낮으면 FLS 접점(4-3)이 닫혀 릴레이 X와 플리커 릴레이 FR이 여자되고, FR 접점 공통(8번)에도 전원이 갑니다." },
        { num: 6, name: "⑥ FR b접점 ➜ YL 점멸", color: "#f43f5e",
          nodes: ["FR 5번", "YL(TB6 18번)"],
          loopOrder: "FR 5번 ➜ (우측 통로 하강) ➜ TB6 18번(YL)",
          tip: "FR b접점(8-5)이 FR 설정시간 간격으로 열렸다 닫혀 YL이 점멸합니다." },
        { num: 7, name: "⑦ 셀렉터 수동(M) ➜ PB0", color: "#3b82f6",
          nodes: ["SS-M(TB5 4번)", "PB0(TB5 1번)"],
          loopOrder: "TB5 4번(SS-M) ➜ TB5 1번(PB0)",
          tip: "수동(M) 전원이 정지 버튼 PB0(NC)으로 갑니다." },
        { num: 8, name: "⑧ PB0 출력 ➜ PB1·T 자기유지", color: "#fb923c",
          nodes: ["PB0·PB1 연결점(TB5 3번 공통)", "T 1번"],
          loopOrder: "TB5 3번(PB공통) ➜ (좌측 통로 하강) ➜ T 1번",
          tip: "PB0을 지난 전원이 PB1(NO)과 T 순시 a접점(1-3, 자기유지)으로 나뉩니다." },
        { num: 9, name: "⑨ 운전 모선 (X a·PB1·T 순시 ➜ X b·T 한시 b 공통)", color: "#a3e635",
          nodes: ["PB1(TB5 2번)", "X 3번", "X 8번", "T 3번", "T 8번(공통)"],
          loopOrder: "TB5 2번(PB1) ➜ X 3번 (좌→우) ➜ 우측 하강 ➜ X 8번 ➜ T 3번 (우→좌) ➜ 좌측 하강 ➜ T 8번",
          tip: "자동은 X a접점(1-3), 수동은 PB1·T 순시 a접점(1-3)으로 이 모선에 전원이 들어와 T 한시 b접점·X b접점 공통(8번)으로 갑니다." },
        { num: 10, name: "⑩ X b접점 ➜ 타이머 T", color: "#38bdf8",
          nodes: ["X 5번", "T 2번(코일)"],
          loopOrder: "X 5번 ➜ (우측 통로 하강) ➜ T 2번",
          tip: "X가 꺼져 있을 때(수동)만 X b접점(8-5)으로 타이머 T가 여자됩니다." },
        { num: 11, name: "⑪ T 한시 b접점 ➜ MC1·MC2", color: "#818cf8",
          nodes: ["MC1 6번", "MC2 6번", "T 5번"],
          loopOrder: "MC1 6번 ➜ MC2 6번 ➜ T 5번 (중앙 통로 좌→우)",
          tip: "T 한시 b접점(8-5)으로 MC1·MC2가 함께 여자되고, 수동에서 t초가 지나면 b접점이 열려 둘 다 멈춥니다." },
        { num: 12, name: "⑫ MC1 운전 표시등 (RL)", color: "#c084fc",
          nodes: ["RL(TB5 19번)", "MC1 10번"],
          loopOrder: "TB5 19번(RL) ➜ (좌측 통로 하강) ➜ MC1 10번",
          tip: "MC1 보조 a접점(4-10)이 닫히면 RL이 켜집니다." },
        { num: 13, name: "⑬ MC2 운전 표시등 (GL)", color: "#10b981",
          nodes: ["GL(TB5 18번)", "MC2 10번"],
          loopOrder: "TB5 18번(GL) ➜ (우측 통로 하강) ➜ MC2 10번",
          tip: "MC2 보조 a접점(4-10)이 닫히면 GL이 켜집니다." },
        { num: 14, name: "⑭ 하부 공통 중성선 (N상)", color: "#94a3b8",
          nodes: ["TB5 20번(GL/RL공통)", "FR 7번", "FLS 6번", "X 7번", "EOCR 12번", "퓨즈 2차 L3", "MC1 12번", "MC2 12번", "T 7번", "TB6 20번(YL/BZ공통)"],
          loopOrder: "TB5 20번 ➜ 우측 하강 ➜ FR 7번 ➜ FLS 6번 ➜ X 7번 ➜ EOCR 12번 ➜ 퓨즈 2차 L3 (우→좌) ➜ 좌측 하강 ➜ MC1 12번 ➜ MC2 12번 ➜ T 7번 ➜ TB6 20번 (좌→우)",
          tip: "모든 코일과 램프의 반대쪽 단자를 묶는 공통선입니다. 우측 하강 ➜ 중앙 통로 우→좌 ➜ 좌측 하강 ➜ 하단 통로 좌→우로 <b>S자 지그재그</b>로 이어 갑니다." }
      ]
    },

    // 4단계: 보조회로 결선 순서 (제어판 단자 체인) — 엔진이 통로 규칙(Y=95/210/330, X=25/375)대로 경로 자동 생성
    auxChains: {
      0: [[["FLS", 7], ["TB6", 11]], [["FLS", 8], ["TB6", 12]], [["FLS", 1], ["TB6", 13]]],
      1: [["EOCR", 6], ["F", "out-1"], ["EOCR", 10]],
      2: [["EOCR", 4], ["TB5", 6], ["MC1", 4], ["MC2", 4], ["X", 1]],
      3: [["EOCR", 5], ["TB6", 19]],
      4: [["TB5", 5], ["FLS", 4], ["FLS", 5]],
      5: [["FR", 2], ["FR", 8], ["FLS", 3], ["X", 2]],
      6: [["FR", 5], ["TB6", 18]],
      7: [["TB5", 4], ["TB5", 1]],
      8: [["TB5", 3], ["T", 1]],
      9: [["TB5", 2], ["X", 3], ["X", 8], ["T", 3], ["T", 8, "L"]],
      10: [["X", 5], ["T", 2]],
      11: [["MC1", 6], ["MC2", 6], ["T", 5]],
      12: [["TB5", 19], ["MC1", 10]],
      13: [["TB5", 18], ["MC2", 10]],
      14: [["TB5", 20], ["FR", 7], ["FLS", 6], ["X", 7], ["EOCR", 12], ["F", "out-2"], ["MC1", 12], ["MC2", 12], ["T", 7], ["TB6", 20]]
    },

    // 5·6단계: 벽면 배관 · 박스 · 입선 (문제지 5쪽 배관도, 치수 기준점 = 제어함 중심 900, 800 / J박스 왼쪽)
    wall: {
      junction: [450, 190],
      pipes: [
        { kind: 'CD', name: '제어함 ➜ J박스', tag: { x: 665, y: 152 }, points: [[800, 590], [800, 190], [450, 190]] },
        { kind: 'CD', name: 'J박스 ➜ PB0/PB1', tag: { x: 175, y: 400 }, points: [[450, 190], [150, 190], [150, 590]] },
        { kind: 'PE', name: 'J박스 ➜ SS/CAP', tag: { x: 450, y: 400 }, points: [[450, 190], [450, 590]] },
        { kind: 'CABLE', name: 'TB1(전원)', tag: { x: 900, y: 400 }, points: [[900, 590], [900, 140]], clearance: 'TB1',
          fixedSaddles: [
            { fromEnd: false, dist: 100, label: '하부 새들 (배전반 윗변에서 100mm 위)' },
            { fromEnd: true, dist: 50, label: '상부 새들 (케이블 맨 위 끝에서 50mm 아래)' }
          ] },
        { kind: 'PE', name: 'GL/RL', tag: { x: 1400, y: 400 }, points: [[1000, 590], [1000, 190], [1400, 190], [1400, 590]] },
        { kind: 'PE', name: 'TB2(M1)', tag: { x: 550, y: 1375 }, points: [[750, 1010], [750, 1410], [350, 1410]], clearance: 'TB2' },
        { kind: 'CD', name: 'TB3(M2)', tag: { x: 790, y: 1250 }, points: [[850, 1010], [850, 1510]], clearance: 'TB3' },
        { kind: 'PE', name: 'TB4(수위)', tag: { x: 1200, y: 1545 }, points: [[950, 1010], [950, 1510], [1450, 1510]], clearance: 'TB4' },
        { kind: 'CD', name: 'YL/BZ', tag: { x: 1250, y: 1375 }, points: [[1050, 1010], [1050, 1410], [1450, 1410], [1450, 1010]] }
      ],
      dimensions: {
        top: { y: 32, ticks: [150, 450, 800, 900, 1000, 1400] },          // 300 · 350 · 100 · 100 · 400
        bottom: { y: 1626, ticks: [350, 750, 850, 950, 1050, 1450] },     // 400 · 100 · 100 · 100 · 400
        left: { x: 45, ticks: [140, 190, 590, 1010, 1410, 1510] }         // 50 · 400 · 420 · 400 · 100
      },
      edgeDims: [
        { y: 570, edgeY: 590, from: 700, to: 800, below: false },   // 상단: 제어함 왼쪽 끝 ➜ ② 출구 100
        { y: 1080, edgeY: 1010, from: 700, to: 750, below: true }   // 하단: 제어함 왼쪽 끝 ➜ 첫 출구 50
      ],
      // 2구 박스 (x, y = 박스 왼쪽 위, 90 x 140mm) — 위·아래 기구 (램프 박스는 위 GL·아래 RL)
      boxes: [
        { name: 'PB0/PB1', x: 105, y: 590, titlePos: 'below', top: { type: 'pb-red', name: 'PB0 (정지)', input: 'pb0' }, bottom: { type: 'pb-green', name: 'PB1 (기동)', input: 'pb1' } },
        { name: 'SS/CAP', x: 405, y: 590, titlePos: 'below', top: { type: 'selector', name: 'SS (M·A)', input: 'ss' }, bottom: { type: 'cap', name: 'CAP' } },
        { name: 'GL/RL', x: 1355, y: 590, titlePos: 'below', top: { type: 'lamp-green', name: 'GL (MC2 운전)', load: 'GL' }, bottom: { type: 'lamp-red', name: 'RL (MC1 운전)', load: 'RL' } },
        { name: 'YL/BZ', x: 1405, y: 870, titlePos: 'above', top: { type: 'lamp-yellow', name: 'YL (점멸)', load: 'YL' }, bottom: { type: 'buzzer', name: 'BZ (부저)', load: 'BZ' } }
      ],
      // 6단계 입선 다발: via = 지나는 배관 번호(위 pipes 순서), pins = 제어함 단자 (결선 순서: 공통·PE 먼저)
      bundles: [
        { id: 'PB', name: 'PB0/PB1 박스', via: [0, 1], tb: 'TB5', device: { type: 'box' },
          pins: [{ pin: 3, label: '공통', wire: 'AUX', common: true }, { pin: 1, label: 'PB0', wire: 'AUX' }, { pin: 2, label: 'PB1', wire: 'AUX' }] },
        { id: 'SS', name: 'SS/CAP 박스', via: [0, 2], tb: 'TB5', device: { type: 'box' },
          pins: [{ pin: 6, label: '공통', wire: 'AUX', common: true }, { pin: 4, label: 'SS-M', wire: 'AUX' }, { pin: 5, label: 'SS-A', wire: 'AUX' }] },
        { id: 'RL', name: 'GL/RL 박스', via: [4], tb: 'TB5', device: { type: 'box' },
          pins: [{ pin: 20, label: '공통', wire: 'AUX', common: true }, { pin: 19, label: 'RL', wire: 'AUX' }, { pin: 18, label: 'GL', wire: 'AUX' }] },
        { id: 'YL', name: 'YL/BZ 박스', via: [8], tb: 'TB6', device: { type: 'box' },
          pins: [{ pin: 20, label: '공통', wire: 'AUX', common: true }, { pin: 18, label: 'YL', wire: 'AUX' }, { pin: 19, label: 'BZ', wire: 'AUX' }] },
        { id: 'TB2', name: 'TB2 (전동기 M1)', via: [5], tb: 'TB6',
          device: { type: 'tbBlock', edge: 'x', at: 300, from: 1420, step: 20 },
          pins: [{ pin: 4, label: 'PE', wire: 'PE', common: true, slot: 3 }, { pin: 1, label: 'U1', wire: 'L1', slot: 0 }, { pin: 2, label: 'V1', wire: 'L2', slot: 1 }, { pin: 3, label: 'W1', wire: 'L3', slot: 2 }] },
        { id: 'TB3', name: 'TB3 (전동기 M2)', via: [6], tb: 'TB6',
          device: { type: 'tbBlock', edge: 'y', at: 1560, from: 810, step: 26 },
          pins: [{ pin: 10, label: 'PE', wire: 'PE', common: true, slot: 3 }, { pin: 7, label: 'U2', wire: 'L1', slot: 0 }, { pin: 8, label: 'V2', wire: 'L2', slot: 1 }, { pin: 9, label: 'W2', wire: 'L3', slot: 2 }] },
        { id: 'TB4', name: 'TB4 (수위 E1·E2·E3)', via: [7], tb: 'TB6',
          device: { type: 'tbBlock', edge: 'x', at: 1500, from: 1520, step: 20 },
          pins: [{ pin: 11, label: 'E1', wire: 'AUX' }, { pin: 12, label: 'E2', wire: 'AUX' }, { pin: 13, label: 'E3', wire: 'AUX' }] },
        { id: 'TB1', name: 'TB1 메인전원 케이블', via: [], cableEntry: [900, 590], tb: 'TB5', pullSkip: true,
          pins: [{ pin: 12, label: 'PE', wire: 'PE', common: true }, { pin: 9, label: 'L1', wire: 'L1' }, { pin: 10, label: 'L2', wire: 'L2' }, { pin: 11, label: 'L3', wire: 'L3' }] }
      ],
      // 2구 박스 내부 결선 (박스 왼쪽 위 기준 로컬 좌표) — 6단계 결선에서 표시
      boxInternals: {
        // PB0(빨강, 위) = NC / PB1(녹색, 아래) = NO, 두 접점 한쪽을 잇고 그 점에서 공통선 (위에서 들어옴)
        PB: { origin: [105, 590],
          terms: { PB0a: [19, 40], PB0b: [71, 40], PB1a: [19, 100], PB1b: [71, 100] },
          jumper: { from: 'PB0a', to: 'PB1a', lane: 9, text: 'PB0(NC)·PB1(NO) 한쪽 단자 연결' },
          wires: { '공통': { term: 'PB0a', lane: 19 }, 'PB0': { term: 'PB0b', lane: 71 }, 'PB1': { term: 'PB1b', lane: 83 } },
          contacts: [
            { a: 'PB0a', b: 'PB0b', y: 61, type: 'NC', label: 'PB0 NC (빨강·정지)' },
            { a: 'PB1a', b: 'PB1b', y: 121, type: 'NO', label: 'PB1 NO (녹색·기동)' }
          ] },
        SS: { origin: [405, 590],
          terms: { M1: [12, 30], M2: [12, 56], A1: [78, 30], A2: [78, 56] },
          jumper: { from: 'M2', to: 'A2', laneY: 68, text: 'M·A 한쪽 단자 내부 연결' },
          wires: { '공통': { term: 'M2', lane: 21 }, 'SS-M': { term: 'M1', lane: 12 }, 'SS-A': { term: 'A1', lane: 78 } },
          contacts: [
            { a: 'M1', b: 'M2', vertical: true, type: 'NO', label: 'M: 끊김', labelY: 80 },
            { a: 'A1', b: 'A2', vertical: true, type: 'NC', label: 'A: 연결', labelY: 80 }
          ] },
        RL: { origin: [1355, 590],
          terms: { GLa: [19, 40], GLb: [71, 40], RLa: [19, 100], RLb: [71, 100] },
          jumper: { from: 'GLa', to: 'RLa', lane: 9, text: 'GL·RL 한쪽 단자 묶음' },
          wires: { '공통': { term: 'GLa', lane: 19 }, 'GL': { term: 'GLb', lane: 71 }, 'RL': { term: 'RLb', lane: 83 } },
          contacts: [] },
        YL: { origin: [1405, 870],
          terms: { YLa: [19, 40], YLb: [71, 40], BZa: [19, 100], BZb: [71, 100] },
          jumper: { from: 'BZa', to: 'YLa', lane: 9, text: 'YL·BZ 한쪽 단자 묶음' },
          wires: { '공통': { term: 'BZa', lane: 19 }, 'YL': { term: 'YLb', lane: 83 }, 'BZ': { term: 'BZb', lane: 71 } },
          contacts: [] }
      }
    },

    // 6단계 결선: TB 단자대 바깥쪽 인출선 (약 10cm 빼고 끝 1cm 피복 탈피)
    externalLeads: {
      TB1: { title: '전원 인입선', wires: [{ label: 'L1', wire: 'L1', pin: 1 }, { label: 'L3', wire: 'L3', pin: 3 }] },
      TB4: { title: 'FLS 전극선 E1·E2·E3', wires: [{ label: 'E1', wire: 'AUX', pin: 1 }, { label: 'E2', wire: 'AUX', pin: 2 }, { label: 'E3', wire: 'AUX', pin: 3 }] }
    },

    // 7단계: 전원 투입 & 동작 테스트 (노드 = 전위 그룹 ①~⑭, 도면 왼쪽부터 번호)
    operation: {
      source: 1,
      neutral: 14,
      timerSetSec: 3,
      flickerSec: 1.0,
      levels: { E1: 80, E2: 40, E3: 6 },
      contacts: [
        { id: 'EOCR_b', name: 'EOCR b접점 (10-4)', from: 1, to: 2, type: 'eocr-nc', x: 653, y: 292 },
        { id: 'EOCR_a', name: 'EOCR a접점 (10-5) ➜ BZ', from: 1, to: 3, type: 'eocr-no', x: 673, y: 684 },
        { id: 'SS_A', name: 'SS 자동(A)', from: 2, to: 4, type: 'selector', position: 'A', x: 917, y: 355 },
        { id: 'SS_M', name: 'SS 수동(M)', from: 2, to: 7, type: 'selector', position: 'M', x: 1162, y: 355 },
        { id: 'FLS', name: 'FLS 접점 (4-3)', from: 4, to: 5, type: 'fls-no', coil: 'FLS', x: 917, y: 560 },
        { id: 'FR_b', name: 'FR b접점 (8-5) ➜ YL', from: 5, to: 6, type: 'flicker-nc', coil: 'FR', x: 1080, y: 684 },
        { id: 'PB0', name: 'PB0 정지 (NC)', from: 7, to: 8, type: 'input-nc', input: 'pb0', x: 1162, y: 437 },
        { id: 'PB1', name: 'PB1 기동 (NO)', from: 8, to: 9, type: 'input-no', input: 'pb1', x: 1162, y: 560 },
        { id: 'T_13', name: 'T 순시 a접점 (1-3) 자기유지', from: 8, to: 9, type: 'relay-no', coil: 'T', x: 1243, y: 560 },
        { id: 'X_13', name: 'X a접점 (1-3)', from: 2, to: 9, type: 'relay-no', coil: 'X', x: 1324, y: 355 },
        { id: 'X_b', name: 'X b접점 (8-5) ➜ T', from: 9, to: 10, type: 'relay-nc', coil: 'X', x: 1162, y: 684 },
        { id: 'T_b', name: 'T 한시 b접점 (8-5) ➜ MC1·MC2', from: 9, to: 11, type: 'timer-nc', coil: 'T', x: 1405, y: 560 },
        { id: 'MC1_aux', name: 'MC1 보조 a접점 (4-10)', from: 2, to: 12, type: 'relay-no', coil: 'MC1', x: 1487, y: 355 },
        { id: 'MC2_aux', name: 'MC2 보조 a접점 (4-10)', from: 2, to: 13, type: 'relay-no', coil: 'MC2', x: 1567, y: 355 }
      ],
      steps: [
        { id: '가', title: '가) MCCB로 전원 투입 ➜ EOCR에 전원 공급',
          actions: [{ do: 'reset' }, { do: 'power', value: true }],
          expect: { on: ['EOCR'], off: ['X', 'FR', 'T', 'MC1', 'MC2', 'YL', 'BZ'] } },
        { id: '나1', title: '나)(1) SS 자동(A) ➜ FLS 수위 감지 ➜ FR·X·MC1·MC2 여자, M1·M2 회전, RL·GL 점등',
          actions: [{ do: 'ss', value: 'A' }, { do: 'level', value: 20 }],
          expect: { on: ['FLS', 'X', 'FR', 'MC1', 'MC2', 'RL', 'GL'], off: ['T'] } },
        { id: '나2', title: '나)(2) FR 설정시간 간격으로 YL 점멸',
          actions: [],
          expect: { blink: ['YL'], within: 2600 } },
        { id: '나3-1', title: '나)(3) 운전 중 FLS 수위 감지 해제 ➜ 모두 정지',
          actions: [{ do: 'level', value: 90 }],
          expect: { off: ['X', 'FR', 'MC1', 'MC2', 'RL', 'GL', 'YL'] } },
        { id: '나3-2', title: '나)(3) 운전 중 SS를 M(수동)으로 ➜ 모두 정지',
          actions: [{ do: 'level', value: 20 }, { do: 'wait', ms: 900 }, { do: 'ss', value: 'M' }],
          expect: { off: ['FLS', 'X', 'FR', 'MC1', 'MC2', 'YL'] } },
        { id: '다1', title: '다)(1) SS 수동(M) ➜ PB1 누름 ➜ T·MC1·MC2 여자, M1·M2 회전, RL·GL 점등',
          actions: [{ do: 'ss', value: 'M' }, { do: 'press', target: 'pb1', ms: 600 }],
          expect: { on: ['T', 'MC1', 'MC2', 'RL', 'GL'], off: ['X', 'FR', 'YL'] } },
        { id: '다2', title: '다)(2) T 설정시간 t초 후 ➜ MC1·MC2 소자, M1·M2 정지, RL·GL 소등',
          actions: [{ do: 'waitTimer', extraMs: 300 }],
          expect: { on: ['T'], off: ['MC1', 'MC2', 'RL', 'GL'] } },
        { id: '다3-1', title: '다)(3) 타이머에 의해 정지된 상태에서 PB0 누름 ➜ 모두 정지(초기화)',
          actions: [{ do: 'press', target: 'pb0', ms: 600 }],
          expect: { off: ['T', 'MC1', 'MC2'] } },
        { id: '다3-2', title: '다)(3) 운전 중 SS를 A(자동)로 ➜ 모두 정지',
          actions: [{ do: 'level', value: 90 }, { do: 'press', target: 'pb1', ms: 600 }, { do: 'wait', ms: 900 }, { do: 'ss', value: 'A' }],
          expect: { off: ['X', 'FR', 'T', 'MC1', 'MC2'] } },
        { id: '라1', title: '라)(1) 운전 중 과부하 ➜ EOCR 동작: 전동기 정지, BZ 동작',
          actions: [{ do: 'ss', value: 'M' }, { do: 'press', target: 'pb1', ms: 600 }, { do: 'wait', ms: 500 }, { do: 'trip' }],
          expect: { on: ['BZ'], off: ['MC1', 'MC2', 'X', 'FR', 'T', 'YL'] } },
        { id: '라2', title: '라)(2) EOCR 리셋 ➜ 제어회로 초기 상태로 복귀',
          actions: [{ do: 'eocrReset' }],
          expect: { on: ['EOCR'], off: ['BZ', 'X', 'FR', 'T', 'MC1', 'MC2'] } }
      ],
      loads: [
        { id: 'EOCR', name: 'EOCR 전원', node: 1, kind: 'relay', x: 592, y: 766 },
        { id: 'BZ', name: '부저 BZ', node: 3, kind: 'buzzer', x: 673, y: 766 },
        { id: 'FLS', name: '플로트리스 FLS', node: 4, kind: 'relay', x: 755, y: 766 },
        { id: 'X', name: '릴레이 X', node: 5, kind: 'relay', x: 917, y: 766 },
        { id: 'FR', name: '플리커 릴레이 FR', node: 5, kind: 'relay', x: 999, y: 766 },
        { id: 'YL', name: '황색 램프 YL', node: 6, kind: 'lamp', color: 'yellow', x: 1080, y: 766 },
        { id: 'T', name: '타이머 T', node: 10, kind: 'timer', x: 1162, y: 766 },
        { id: 'MC1', name: '전자접촉기 MC1 (M1)', node: 11, kind: 'contactor', motor: 'M1', x: 1324, y: 766 },
        { id: 'MC2', name: '전자접촉기 MC2 (M2)', node: 11, kind: 'contactor', motor: 'M2', x: 1405, y: 766 },
        { id: 'RL', name: '적색 램프 RL', node: 12, kind: 'lamp', color: 'red', x: 1487, y: 766 },
        { id: 'GL', name: '녹색 램프 GL', node: 13, kind: 'lamp', color: 'green', x: 1567, y: 766 }
      ],
      // 상태가 바뀔 때 안내 문구 (없으면 기본 문구)
      notes: {
        FLS: { on: '🔌 <b>자동(A)</b>: SS-A ➜ <b>FLS 전원</b> 공급, 수위를 감시합니다.' },
        X: { on: '🔁 <b>X·FR 여자</b> ➜ X a접점(1-3)으로 운전 모선 ➜ T 한시 b접점 ➜ <b>MC1·MC2 동시 운전</b>, FR b접점으로 <b>YL 점멸</b>' },
        T: { on: '⏱️ <b>수동</b>: X b접점(8-5) ➜ <b>타이머 T 여자</b>, T 순시 a접점(1-3)으로 자기유지 — t초 뒤 MC1·MC2 정지' },
        MC1: { on: '🟢 <b>MC1 여자</b>, M1 운전 + RL 점등', off: '⏹️ MC1 해제 (M1 정지, RL 소등)' },
        MC2: { on: '🟢 <b>MC2 여자</b>, M2 운전 + GL 점등', off: '⏹️ MC2 해제 (M2 정지, GL 소등)' },
        BZ: { on: '⚠️ <b>EOCR 트립!</b> b접점(10-4) 열림 ➜ 전체 정지, a접점(10-5) 닫힘 ➜ <b>BZ 동작</b>' }
      }
    }
  }
};
