/**
 * 전기기능사 실기 부품 실물 SVG 그래픽 생성기
 * - 12P 소켓, 8P 소켓, MCCB, 퓨즈홀더, 20P 단자대, 마스킹 테이프
 */

export const SvgSymbols = {
  /**
   * 12핀 소켓 (EOCR, MC1, MC2)
   * x, y는 부품의 중심 좌표 (mm)
   */
  createSocket12P(comp) {
    const { x, y, width = 50, height = 68, id, label } = comp;
    const left = x - width / 2;
    const top = y - height / 2;

    // 상단 핀 (1~6), 하단 핀 (7~12)
    const pinRadius = 2.4;
    const screwRadius = 3.2;

    return `
      <g id="comp-${id}" class="component socket-12p" transform="translate(0, 0)">
        <!-- 베이스 몸체 (검정 엔지니어링 플라스틱) -->
        <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="3" 
              fill="#1e2229" stroke="#333945" stroke-width="1.2" filter="url(#shadow)" />
        
        <!-- 나사 체결 홀 (좌/우) -->
        <circle cx="${left + 4}" cy="${y}" r="2.2" fill="#0d1117" stroke="#4a5568" stroke-width="0.8" />
        <circle cx="${left + width - 4}" cy="${y}" r="2.2" fill="#0d1117" stroke="#4a5568" stroke-width="0.8" />
        
        <!-- 중앙 원형 소켓 삽입부 -->
        <circle cx="${x}" cy="${y}" r="14" fill="#13161c" stroke="#2d3748" stroke-width="1.2" />
        <circle cx="${x}" cy="${y}" r="9" fill="#1a202c" stroke="#374151" stroke-width="0.8" />
        
        <!-- 중앙 하측부 홈 (▲) - 거꾸로 설치 방지 키 -->
        <polygon points="${x - 2.5},${y + 11.5} ${x + 2.5},${y + 11.5} ${x},${y + 7.5}" fill="#e2e8f0" />
        <text x="${x}" y="${y + 15}" font-size="3" fill="#cbd5e1" text-anchor="middle" font-weight="bold">▲하측</text>

        <!-- 12개 내부 핀 구멍 -->
        ${Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const px = x + 11.5 * Math.cos(angle);
          const py = y + 11.5 * Math.sin(angle);
          return `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="1" fill="#facc15" stroke="#713f12" stroke-width="0.3" />`;
        }).join('')}

        <!-- 상단 나사 단자 (1, 2, 3, 4, 5, 6) -->
        ${[1, 2, 3, 4, 5, 6].map((num, i) => {
          const sx = left + 5 + i * ((width - 10) / 5);
          const sy = top + 6.5;
          return `
            <g class="terminal-screw" data-comp="${id}" data-pin="${num}" id="pin-${id}-${num}">
              <rect x="${sx - 3.5}" y="${sy - 4.5}" width="7" height="9" rx="1" fill="#2d3748" stroke="#4b5563" stroke-width="0.5" />
              <circle cx="${sx}" cy="${sy}" r="${screwRadius}" fill="#d1d5db" stroke="#6b7280" stroke-width="0.6" />
              <!-- 십자 나사선 -->
              <line x1="${sx - 2}" y1="${sy}" x2="${sx + 2}" y2="${sy}" stroke="#4b5563" stroke-width="0.7" />
              <line x1="${sx}" y1="${sy - 2}" x2="${sx}" y2="${sy + 2}" stroke="#4b5563" stroke-width="0.7" />
              <text x="${sx}" y="${sy + 7}" font-size="3.5" fill="#f97316" font-family="monospace" font-weight="bold" text-anchor="middle">${num}</text>
            </g>
          `;
        }).join('')}

        <!-- 하단 나사 단자 (7, 8, 9, 10, 11, 12) -->
        ${[7, 8, 9, 10, 11, 12].map((num, i) => {
          const sx = left + 5 + i * ((width - 10) / 5);
          const sy = top + height - 6.5;
          return `
            <g class="terminal-screw" data-comp="${id}" data-pin="${num}" id="pin-${id}-${num}">
              <rect x="${sx - 3.5}" y="${sy - 4.5}" width="7" height="9" rx="1" fill="#2d3748" stroke="#4b5563" stroke-width="0.5" />
              <circle cx="${sx}" cy="${sy}" r="${screwRadius}" fill="#d1d5db" stroke="#6b7280" stroke-width="0.6" />
              <line x1="${sx - 2}" y1="${sy}" x2="${sx + 2}" y2="${sy}" stroke="#4b5563" stroke-width="0.7" />
              <line x1="${sx}" y1="${sy - 2}" x2="${sx}" y2="${sy + 2}" stroke="#4b5563" stroke-width="0.7" />
              <text x="${sx}" y="${sy - 4.5}" font-size="3.5" fill="#f97316" font-family="monospace" font-weight="bold" text-anchor="middle">${num}</text>
            </g>
          `;
        }).join('')}

        <!-- 부품 라벨 / 모델명 -->
        <text x="${x}" y="${y - 3}" font-size="5" fill="#94a3b8" font-family="sans-serif" font-weight="800" text-anchor="middle" letter-spacing="0.5">${label}</text>
        <text x="${x}" y="${y + 3}" font-size="2.8" fill="#64748b" text-anchor="middle">12-PIN SOCKET</text>
      </g>
    `;
  },

  /**
   * 8핀 소켓 (릴레이 X, 타이머 T, 플리커 FR, 플로트레스 FLS)
   */
  createSocket8P(comp) {
    const { x, y, width = 44, height = 62, id, label } = comp;
    const left = x - width / 2;
    const top = y - height / 2;
    const screwRadius = 3.0;

    return `
      <g id="comp-${id}" class="component socket-8p" transform="translate(0, 0)">
        <!-- 몸체 -->
        <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="3" 
              fill="#1e2229" stroke="#333945" stroke-width="1.2" filter="url(#shadow)" />
        
        <!-- 나사 체결 홀 (좌/우) -->
        <circle cx="${left + 3.5}" cy="${y}" r="2" fill="#0d1117" stroke="#4a5568" stroke-width="0.8" />
        <circle cx="${left + width - 3.5}" cy="${y}" r="2" fill="#0d1117" stroke="#4a5568" stroke-width="0.8" />

        <!-- 중앙 원형 소켓 -->
        <circle cx="${x}" cy="${y}" r="12" fill="#13161c" stroke="#2d3748" stroke-width="1.2" />
        <circle cx="${x}" cy="${y}" r="7" fill="#1a202c" stroke="#374151" stroke-width="0.8" />
        
        <!-- 중앙 하측부 홈 (아래쪽 돌기 방향) -->
        <rect x="${x - 1.8}" y="${y + 4.5}" width="3.6" height="3" fill="#e2e8f0" rx="0.5" />
        <text x="${x}" y="${y + 13}" font-size="2.8" fill="#cbd5e1" text-anchor="middle" font-weight="bold">▲하측</text>

        <!-- 8개 내부 핀 구멍 -->
        ${Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45 - 90) * (Math.PI / 180);
          const px = x + 9.5 * Math.cos(angle);
          const py = y + 9.5 * Math.sin(angle);
          return `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="1" fill="#facc15" stroke="#713f12" stroke-width="0.3" />`;
        }).join('')}

        <!-- 상단 나사 단자 (6, 5, 4, 3) -->
        ${[6, 5, 4, 3].map((num, i) => {
          const sx = left + 6 + i * ((width - 12) / 3);
          const sy = top + 6.5;
          return `
            <g class="terminal-screw" data-comp="${id}" data-pin="${num}" id="pin-${id}-${num}">
              <rect x="${sx - 3.5}" y="${sy - 4.5}" width="7" height="9" rx="1" fill="#2d3748" stroke="#4b5563" stroke-width="0.5" />
              <circle cx="${sx}" cy="${sy}" r="${screwRadius}" fill="#d1d5db" stroke="#6b7280" stroke-width="0.6" />
              <line x1="${sx - 1.8}" y1="${sy}" x2="${sx + 1.8}" y2="${sy}" stroke="#4b5563" stroke-width="0.7" />
              <line x1="${sx}" y1="${sy - 1.8}" x2="${sx}" y2="${sy + 1.8}" stroke="#4b5563" stroke-width="0.7" />
              <text x="${sx}" y="${sy + 7}" font-size="3.5" fill="#f97316" font-family="monospace" font-weight="bold" text-anchor="middle">${num}</text>
            </g>
          `;
        }).join('')}

        <!-- 하단 나사 단자 (7, 8, 1, 2) -->
        ${[7, 8, 1, 2].map((num, i) => {
          const sx = left + 6 + i * ((width - 12) / 3);
          const sy = top + height - 6.5;
          return `
            <g class="terminal-screw" data-comp="${id}" data-pin="${num}" id="pin-${id}-${num}">
              <rect x="${sx - 3.5}" y="${sy - 4.5}" width="7" height="9" rx="1" fill="#2d3748" stroke="#4b5563" stroke-width="0.5" />
              <circle cx="${sx}" cy="${sy}" r="${screwRadius}" fill="#d1d5db" stroke="#6b7280" stroke-width="0.6" />
              <line x1="${sx - 1.8}" y1="${sy}" x2="${sx + 1.8}" y2="${sy}" stroke="#4b5563" stroke-width="0.7" />
              <line x1="${sx}" y1="${sy - 1.8}" x2="${sx}" y2="${sy + 1.8}" stroke="#4b5563" stroke-width="0.7" />
              <text x="${sx}" y="${sy - 4.5}" font-size="3.5" fill="#f97316" font-family="monospace" font-weight="bold" text-anchor="middle">${num}</text>
            </g>
          `;
        }).join('')}

        <!-- 부품 라벨 -->
        <text x="${x}" y="${y - 2}" font-size="5" fill="#94a3b8" font-family="sans-serif" font-weight="800" text-anchor="middle">${label}</text>
        <text x="${x}" y="${y + 3}" font-size="2.6" fill="#64748b" text-anchor="middle">8-PIN SOCKET</text>
      </g>
    `;
  },

  /**
   * MCCB (배선용 차단기 3P)
   */
  createMCCB(comp) {
    const { x, y, width = 52, height = 72, id, label } = comp;
    const left = x - width / 2;
    const top = y - height / 2;

    return `
      <g id="comp-${id}" class="component mccb" transform="translate(0, 0)">
        <!-- 본체 -->
        <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="2" 
              fill="#181c24" stroke="#2f3746" stroke-width="1.2" filter="url(#shadow)" />
        
        <!-- 상단 단자 (1차측 L1, L2, L3) -->
        ${[1, 2, 3].map((num, i) => {
          const sx = left + 10 + i * ((width - 20) / 2);
          const sy = top + 8;
          return `
            <g class="terminal-screw" data-comp="${id}" data-pin="in-${num}" id="pin-${id}-in-${num}">
              <rect x="${sx - 4.5}" y="${sy - 5}" width="9" height="10" fill="#2d3748" stroke="#4a5568" stroke-width="0.5" />
              <circle cx="${sx}" cy="${sy}" r="3.2" fill="#e5e7eb" stroke="#6b7280" stroke-width="0.6" />
              <line x1="${sx - 2}" y1="${sy}" x2="${sx + 2}" y2="${sy}" stroke="#374151" stroke-width="0.8" />
              <line x1="${sx}" y1="${sy - 2}" x2="${sx}" y2="${sy + 2}" stroke="#374151" stroke-width="0.8" />
            </g>
          `;
        }).join('')}

        <!-- 하단 단자 (2차측 U, V, W) -->
        ${[1, 2, 3].map((num, i) => {
          const sx = left + 10 + i * ((width - 20) / 2);
          const sy = top + height - 8;
          return `
            <g class="terminal-screw" data-comp="${id}" data-pin="out-${num}" id="pin-${id}-out-${num}">
              <rect x="${sx - 4.5}" y="${sy - 5}" width="9" height="10" fill="#2d3748" stroke="#4a5568" stroke-width="0.5" />
              <circle cx="${sx}" cy="${sy}" r="3.2" fill="#e5e7eb" stroke="#6b7280" stroke-width="0.6" />
              <line x1="${sx - 2}" y1="${sy}" x2="${sx + 2}" y2="${sy}" stroke="#374151" stroke-width="0.8" />
              <line x1="${sx}" y1="${sy - 2}" x2="${sx}" y2="${sy + 2}" stroke="#374151" stroke-width="0.8" />
            </g>
          `;
        }).join('')}

        <!-- 중앙 스위치 베젤 -->
        <rect x="${x - 12}" y="${y - 14}" width="24" height="28" fill="#111827" stroke="#374151" stroke-width="1" rx="2" />
        
        <!-- ON / OFF 인디케이터 -->
        <text x="${x}" y="${y - 7}" font-size="3.5" fill="#ef4444" font-weight="bold" text-anchor="middle">ON</text>
        <text x="${x}" y="${y + 11}" font-size="3.5" fill="#22c55e" font-weight="bold" text-anchor="middle">OFF</text>

        <!-- 스위치 레버 (기본 OFF 위치) -->
        <rect id="mccb-lever" class="clickable-lever" x="${x - 5}" y="${y + 1}" width="10" height="7" rx="1.5" 
              fill="#e2e8f0" stroke="#475569" stroke-width="0.8" style="cursor: pointer;" />

        <!-- 트립 테스트 버튼 -->
        <circle cx="${left + 8}" cy="${y + 8}" r="2" fill="#ef4444" stroke="#991b1b" stroke-width="0.5" />
        <text x="${left + 8}" y="${y + 13}" font-size="2" fill="#94a3b8" text-anchor="middle">TRIP</text>

        <!-- 명판 라벨 -->
        <text x="${x}" y="${y - 18}" font-size="4.5" fill="#f8fafc" font-weight="bold" text-anchor="middle">MCCB 30A</text>
      </g>
    `;
  },

  /**
   * 퓨즈 홀더 (2구 FUSE)
   */
  createFuseHolder(comp) {
    const { x, y, width = 38, height = 65, id, label } = comp;
    const left = x - width / 2;
    const top = y - height / 2;

    return `
      <g id="comp-${id}" class="component fuse-holder" transform="translate(0, 0)">
        <!-- 베이스 -->
        <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="2" 
              fill="#1e2430" stroke="#334155" stroke-width="1.2" filter="url(#shadow)" />
        
        <!-- 1구 퓨즈 (좌측), 2구 퓨즈 (우측) -->
        ${[0, 1].map((col) => {
          const fx = left + 11 + col * 16;
          const topScrewY = top + 8;
          const botScrewY = top + height - 8;
          return `
            <!-- 상단 단자 (1차측) -->
            <g class="terminal-screw" data-comp="${id}" data-pin="in-${col + 1}" id="pin-${id}-in-${col + 1}">
              <rect x="${fx - 4}" y="${topScrewY - 4}" width="8" height="8" fill="#334155" stroke="#475569" stroke-width="0.5" />
              <circle cx="${fx}" cy="${topScrewY}" r="2.8" fill="#cbd5e1" stroke="#64748b" stroke-width="0.6" />
              <line x1="${fx - 1.5}" y1="${topScrewY}" x2="${fx + 1.5}" y2="${topScrewY}" stroke="#475569" stroke-width="0.6" />
            </g>

            <!-- 투명 유리 퓨즈 바디 -->
            <rect x="${fx - 3.5}" y="${y - 12}" width="7" height="24" rx="2" 
                  fill="rgba(203, 213, 225, 0.25)" stroke="#94a3b8" stroke-width="0.8" />
            <!-- 퓨즈 금속 캡 (위/아래) -->
            <rect x="${fx - 3.5}" y="${y - 12}" width="7" height="4" fill="#fbbf24" stroke="#d97706" stroke-width="0.5" />
            <rect x="${fx - 3.5}" y="${y + 8}" width="7" height="4" fill="#fbbf24" stroke="#d97706" stroke-width="0.5" />
            <!-- 내부 퓨즈선 -->
            <line x1="${fx}" y1="${y - 8}" x2="${fx}" y2="${y + 8}" stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="1,1" />

            <!-- 하단 단자 (2차측) -->
            <g class="terminal-screw" data-comp="${id}" data-pin="out-${col + 1}" id="pin-${id}-out-${col + 1}">
              <rect x="${fx - 4}" y="${botScrewY - 4}" width="8" height="8" fill="#334155" stroke="#475569" stroke-width="0.5" />
              <circle cx="${fx}" cy="${botScrewY}" r="2.8" fill="#cbd5e1" stroke="#64748b" stroke-width="0.6" />
              <line x1="${fx - 1.5}" y1="${botScrewY}" x2="${fx + 1.5}" y2="${botScrewY}" stroke="#475569" stroke-width="0.6" />
            </g>
          `;
        }).join('')}

        <!-- 퓨즈 홀더 라벨 -->
        <text x="${x}" y="${y - 16}" font-size="3.5" fill="#94a3b8" font-weight="bold" text-anchor="middle">1차측</text>
        <text x="${x}" y="${y + 20}" font-size="3.5" fill="#94a3b8" font-weight="bold" text-anchor="middle">2차측</text>
        <text x="${x}" y="${y}" font-size="4.5" fill="#f8fafc" font-weight="bold" text-anchor="middle">${label}</text>
      </g>
    `;
  },

  /**
   * 20P 단자대 (10P + 10P = 20P)
   */
  createTerminalBlock20P(comp) {
    const { x, y, width = 250, height = 38, id, label } = comp;
    const left = x - width / 2;
    const top = y - height / 2;
    const pinsCount = 20;
    const pinPitch = (width - 16) / (pinsCount - 1);

    return `
      <g id="comp-${id}" class="component terminal-block-20p" transform="translate(0, 0)">
        <!-- 단자대 외곽 베이스 (검정 절연 바디) -->
        <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="2" 
              fill="#181c24" stroke="#2e3848" stroke-width="1.2" filter="url(#shadow)" />
        
        <!-- 좌우 마운팅 나사 구멍 -->
        <circle cx="${left + 4}" cy="${y}" r="2.2" fill="#0b0f17" stroke="#475569" stroke-width="0.8" />
        <circle cx="${left + width - 4}" cy="${y}" r="2.2" fill="#0b0f17" stroke="#475569" stroke-width="0.8" />

        <!-- 중앙 흰색 번호 기입 마킹 테이프 라인 -->
        <rect x="${left + 8}" y="${y - 3.5}" width="${width - 16}" height="7" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.5" />
        
        <!-- 20개 단자 (위쪽 나사, 아래쪽 나사, 번호) -->
        ${Array.from({ length: pinsCount }).map((_, i) => {
          const px = left + 8 + i * pinPitch;
          const topScrewY = top + 6.5;
          const botScrewY = top + height - 6.5;
          const num = i + 1;
          return `
            <!-- 상단 나사 -->
            <g class="terminal-screw" data-comp="${id}" data-pin="top-${num}" id="pin-${id}-top-${num}">
              <rect x="${px - 4}" y="${topScrewY - 4}" width="8" height="8" rx="0.8" fill="#334155" stroke="#475569" stroke-width="0.5" />
              <circle cx="${px}" cy="${topScrewY}" r="2.6" fill="#fbbf24" stroke="#b45309" stroke-width="0.6" />
              <line x1="${px - 1.5}" y1="${topScrewY}" x2="${px + 1.5}" y2="${topScrewY}" stroke="#78350f" stroke-width="0.6" />
              <line x1="${px}" y1="${topScrewY - 1.5}" x2="${px}" y2="${topScrewY + 1.5}" stroke="#78350f" stroke-width="0.6" />
            </g>

            <!-- 번호 라벨 -->
            <text x="${px}" y="${y + 1.5}" font-size="3" fill="#1e293b" font-family="monospace" font-weight="bold" text-anchor="middle">${num}</text>

            <!-- 하단 나사 -->
            <g class="terminal-screw" data-comp="${id}" data-pin="bot-${num}" id="pin-${id}-bot-${num}">
              <rect x="${px - 4}" y="${botScrewY - 4}" width="8" height="8" rx="0.8" fill="#334155" stroke="#475569" stroke-width="0.5" />
              <circle cx="${px}" cy="${botScrewY}" r="2.6" fill="#fbbf24" stroke="#b45309" stroke-width="0.6" />
              <line x1="${px - 1.5}" y1="${botScrewY}" x2="${px + 1.5}" y2="${botScrewY}" stroke="#78350f" stroke-width="0.6" />
              <line x1="${px}" y1="${botScrewY - 1.5}" x2="${px}" y2="${botScrewY + 1.5}" stroke="#78350f" stroke-width="0.6" />
            </g>
          `;
        }).join('')}

        <!-- 10P + 10P 분할 경계선 표시 -->
        <line x1="${left + 8 + 9.5 * pinPitch}" y1="${top}" x2="${left + 8 + 9.5 * pinPitch}" y2="${top + height}" 
              stroke="#64748b" stroke-width="1.2" stroke-dasharray="2,2" />

        <!-- 단자대 명칭 라벨 -->
        <text x="${left - 5}" y="${y + 2}" font-size="4" fill="#38bdf8" font-weight="bold" text-anchor="end">${label}</text>
      </g>
    `;
  },

  /**
   * 마스킹 테이프 네이밍 라벨 (실제 수험생이 기구 위에 붙이는 종이 테이프)
   */
  createMaskingTape(comp) {
    const { x, y, label, type, width = 50 } = comp;
    let tapeWidth = 38;
    let tapeHeight = 14;
    let tapeX = x;
    let tapeY = y;

    if (type === "terminal_block_20p") {
      // 단자대 핀(1~20)을 가리지 않도록 단자대 좌측 귀퉁이 여백에 배치
      tapeWidth = 24;
      tapeHeight = 11;
      tapeX = x - width / 2 - 14; // 단자대 좌측 바깥 X ≈ 61mm
      tapeY = y;
    } else if (type === "fuse_holder") {
      tapeWidth = 30;
      tapeHeight = 11;
      tapeY = y;
    } else if (type === "mccb") {
      tapeWidth = 42;
      tapeHeight = 13;
      tapeY = y + 18; // 레버 아래쪽
    }

    const left = tapeX - tapeWidth / 2;
    const top = tapeY - tapeHeight / 2;

    return `
      <g id="tape-${comp.id}" class="masking-tape" transform="translate(0, 0)">
        <!-- 실제 흰색/미색 종이 마스킹 테이프 (불투명, 종이 질감) -->
        <rect x="${left}" y="${top}" width="${tapeWidth}" height="${tapeHeight}" rx="1.5" 
              fill="#fefce8" stroke="#facc15" stroke-width="0.8" opacity="0.96" filter="url(#shadow-sm)" />
        
        <!-- 테이프 양쪽 뜯긴 톱니 효과 -->
        <path d="M${left},${top} l-1,3 l1,3 l-1,3 l1,3 l-1,2" stroke="#ca8a04" stroke-width="0.5" fill="none"/>
        <path d="M${left + tapeWidth},${top} l1,3 l-1,3 l1,3 l-1,3 l1,2" stroke="#ca8a04" stroke-width="0.5" fill="none"/>
        
        <!-- 유성 매직 굵은 손글씨 -->
        <text x="${tapeX}" y="${tapeY + 3.8}" font-size="7.5" fill="#090d16" 
              font-family="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" 
              font-weight="900" text-anchor="middle" letter-spacing="0.5">${label}</text>
      </g>
    `;
  }
};
