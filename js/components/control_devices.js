/**
 * 컨트롤박스 기구 실물 표현 (SVG 마크업 생성기)
 * - 푸시버튼(녹색·빨강), 셀렉터 스위치, 파일럿 램프(적·녹·황), 부저, 막음 캡, 명판, 박스 뚜껑
 * - 5단계(외부기구 고정)·6단계(박스 뚜껑 결합)·7단계(동작 테스트)에서 함께 사용
 * - 모든 기구는 (0, 0) 중심, 반지름 약 17mm (2구 박스 90×140mm 기준)
 * - 그라데이션은 deviceDefs()를 해당 SVG의 <defs>에 한 번 넣어 사용 (id 접두어 dev-)
 */

export function deviceDefs() {
  return `
    <radialGradient id="dev-metal" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#f8fafc" /><stop offset="55%" stop-color="#cbd5e1" /><stop offset="100%" stop-color="#64748b" />
    </radialGradient>
    <radialGradient id="dev-btn-green" cx="38%" cy="32%" r="75%">
      <stop offset="0%" stop-color="#86efac" /><stop offset="45%" stop-color="#16a34a" /><stop offset="100%" stop-color="#14532d" />
    </radialGradient>
    <radialGradient id="dev-btn-red" cx="38%" cy="32%" r="75%">
      <stop offset="0%" stop-color="#fca5a5" /><stop offset="45%" stop-color="#dc2626" /><stop offset="100%" stop-color="#7f1d1d" />
    </radialGradient>
    <radialGradient id="dev-lens-red" cx="40%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#fecaca" /><stop offset="50%" stop-color="#b91c1c" /><stop offset="100%" stop-color="#450a0a" />
    </radialGradient>
    <radialGradient id="dev-lens-green" cx="40%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#bbf7d0" /><stop offset="50%" stop-color="#15803d" /><stop offset="100%" stop-color="#052e16" />
    </radialGradient>
    <radialGradient id="dev-lens-yellow" cx="40%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#fef9c3" /><stop offset="50%" stop-color="#ca8a04" /><stop offset="100%" stop-color="#422006" />
    </radialGradient>
    <radialGradient id="dev-lens-white" cx="40%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#ffffff" /><stop offset="50%" stop-color="#cbd5e1" /><stop offset="100%" stop-color="#475569" />
    </radialGradient>
    <radialGradient id="dev-lit-white" cx="45%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#ffffff" /><stop offset="45%" stop-color="#f8fafc" /><stop offset="100%" stop-color="#e2e8f0" />
    </radialGradient>
    <radialGradient id="dev-lit-red" cx="45%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#ffffff" /><stop offset="35%" stop-color="#fca5a5" /><stop offset="100%" stop-color="#ef4444" />
    </radialGradient>
    <radialGradient id="dev-lit-green" cx="45%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#ffffff" /><stop offset="35%" stop-color="#86efac" /><stop offset="100%" stop-color="#22c55e" />
    </radialGradient>
    <radialGradient id="dev-lit-yellow" cx="45%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#ffffff" /><stop offset="35%" stop-color="#fde68a" /><stop offset="100%" stop-color="#facc15" />
    </radialGradient>
    <linearGradient id="dev-cover" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5f5f4" /><stop offset="100%" stop-color="#d6d3d1" />
    </linearGradient>
    <radialGradient id="dev-buzzer-body" cx="40%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#fffbeb" stop-opacity="0.95" /><stop offset="60%" stop-color="#fde68a" stop-opacity="0.8" /><stop offset="100%" stop-color="#eab308" stop-opacity="0.75" />
    </radialGradient>
    <radialGradient id="dev-black" cx="40%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#4b5563" /><stop offset="100%" stop-color="#0b0f17" />
    </radialGradient>
    <filter id="dev-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>`;
}

/**
 * 문서 전체에서 한 번만 그라데이션 정의를 넣음 (여러 단계 SVG가 같은 id를 중복 정의하지 않도록)
 * - 크기 0인 SVG를 body 맨 앞에 두어 숨김(display:none) 영역에 있어도 모든 SVG에서 참조 가능
 */
export function ensureGlobalDeviceDefs() {
  if (document.getElementById('dev-global-defs')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', 'dev-global-defs');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = `<defs>${deviceDefs()}</defs>`;
  document.body.prepend(svg);
}

/** 은색 금속 베젤 (모든 기구 공통 테두리) */
function bezel(r = 17) {
  return `
    <circle r="${r + 1.5}" fill="#0f172a" opacity="0.35" transform="translate(1.2, 1.6)" />
    <circle r="${r}" fill="url(#dev-metal)" stroke="#475569" stroke-width="1" />
    <circle r="${r - 3}" fill="#1f2937" />`;
}

/**
 * 푸시버튼: color 'green' | 'red', pressed = 눌린 상태
 * - 실제 Ø25 푸시버튼처럼 둥근 은색(크롬) 테두리 + 불투명한 납작 버튼 머리
 * - 누르면 머리가 살짝 들어가고 어두워지며 노란 링이 퍼짐 (7단계 조작 효과)
 */
export function pushButton(color, { pressed = false } = {}) {
  const r = pressed ? 11.2 : 12.5;
  const rim = color === 'green' ? '#14532d' : '#7f1d1d';
  const face = color === 'green' ? '#16a34a' : '#dc2626';
  return `
    <g class="dev-pushbutton${pressed ? ' pressed' : ''}" data-color="${color}">
      <circle r="18.5" fill="#0f172a" opacity="0.35" transform="translate(1.2, 1.6)" />
      <circle r="17" fill="url(#dev-metal)" stroke="#475569" stroke-width="1" />
      <circle r="14.2" fill="none" stroke="#94a3b8" stroke-width="0.8" />
      <circle r="13.6" fill="#1f2937" />
      <g transform="translate(0, ${pressed ? 1 : 0})">
        <circle r="${r}" fill="${face}" stroke="${rim}" stroke-width="1.6" ${pressed ? 'opacity="0.78"' : ''} />
        <!-- 납작한 버튼 윗면 (불투명) -->
        <circle r="${r - 2.6}" fill="url(#dev-btn-${color})" opacity="${pressed ? 0.7 : 0.95}" />
        <path d="M ${-(r - 4)} -2 A ${r - 4} ${r - 4} 0 0 1 ${r - 4} -2" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="${pressed ? 0.15 : 0.4}" stroke-linecap="round" />
      </g>
      ${pressed ? '<circle class="dev-press-ring" r="18" fill="none" stroke="#fde047" stroke-width="2.2" />' : ''}
    </g>`;
}

/**
 * 파일럿 램프: color 'red' | 'green' | 'yellow' | 'white', lit = 점등
 * - 검정 몸체 + 볼록한 반투명 렌즈(프레넬 동심원·방사선 무늬)로 버튼과 구분
 * - 점등 시 밝은 렌즈 + 맥박치는 빛 번짐 + 빛줄기 (7단계 동작 효과)
 */
export function pilotLamp(color, { lit = false } = {}) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
    .map(a => `<line x1="0" y1="-21" x2="0" y2="-26" transform="rotate(${a})" />`).join('');
  const spokes = [0, 30, 60, 90, 120, 150]
    .map(a => `<line x1="0" y1="-11.5" x2="0" y2="11.5" transform="rotate(${a})" />`).join('');
  const rayColor = { red: '#f87171', green: '#4ade80', yellow: '#facc15', white: '#38bdf8' }[color];   // 밝은 박스 뚜껑 위에서도 보이게 진한 빛 (백색은 하늘색 빛)
  return `
    <g class="dev-lamp${lit ? ' dev-lamp-lit' : ''}" data-color="${color}">
      ${lit ? `<circle class="dev-lamp-aura" r="30" fill="${rayColor}" opacity="0.55" filter="url(#dev-glow)" />
      <circle class="dev-lamp-ring" r="22" fill="none" stroke="${rayColor}" stroke-width="3" />
      <g class="dev-lamp-rays" stroke="${rayColor}" stroke-width="3" stroke-linecap="round">${rays}</g>` : ''}
      <!-- 검정 몸체 -->
      <rect x="-16.5" y="-16.5" width="35" height="35" rx="8" fill="#0f172a" opacity="0.35" transform="translate(0.8, 1.2)" />
      <rect x="-17" y="-17" width="34" height="34" rx="8" fill="url(#dev-black)" stroke="#020617" stroke-width="1" />
      <circle r="14" fill="#0b0f17" stroke="#334155" stroke-width="1" />
      ${lit ? `<circle class="dev-lamp-halo" r="16.5" fill="url(#dev-lit-${color})" opacity="0.6" filter="url(#dev-glow)" />` : ''}
      <!-- 볼록한 반투명 렌즈 + 프레넬 무늬 -->
      <circle r="12" fill="url(#dev-${lit ? 'lit' : 'lens'}-${color})" stroke="#020617" stroke-width="0.8" />
      <g fill="none" stroke="#ffffff" stroke-width="0.6" opacity="${lit ? 0.55 : 0.22}">
        <circle r="9" /><circle r="6" /><circle r="3" />
        ${spokes}
      </g>
      <ellipse cx="-4" cy="-5" rx="4.2" ry="2.6" fill="#ffffff" opacity="${lit ? 0.65 : 0.35}" />
    </g>`;
}

/** 셀렉터 스위치: position 'M' | 'A' (손잡이가 가리키는 쪽) */
export function selectorSwitch({ position = 'A' } = {}) {
  const angle = position === 'M' ? -40 : 40;
  return `
    <g class="dev-selector" data-position="${position}">
      ${bezel()}
      <circle r="13" fill="url(#dev-black)" />
      <g class="dev-selector-knob" transform="rotate(${angle})">
        <rect x="-4" y="-12.5" width="8" height="25" rx="3.5" fill="#e5e7eb" stroke="#334155" stroke-width="0.8" />
        <path d="M 0 -11 L -2.2 -7 L 2.2 -7 Z" fill="#dc2626" />
      </g>
      <text x="-15" y="-19" text-anchor="middle" font-size="7.5" font-weight="900" fill="${position === 'M' ? '#fde047' : '#94a3b8'}">M</text>
      <text x="15" y="-19" text-anchor="middle" font-size="7.5" font-weight="900" fill="${position === 'A' ? '#fde047' : '#94a3b8'}">A</text>
    </g>`;
}

/** 부저: on = 울림(소리 물결 표시) */
export function buzzer({ on = false } = {}) {
  const holes = [];
  [[0, 0], [-4.5, 0], [4.5, 0], [0, -4.5], [0, 4.5], [-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]]
    .forEach(([x, y]) => holes.push(`<circle cx="${x}" cy="${y}" r="1.1" fill="#78350f" opacity="0.75" />`));
  return `
    <g class="dev-buzzer">
      ${bezel()}
      <!-- 옅은 투명 황색 몸체 (안쪽 진동판이 비쳐 보임) -->
      <circle r="12.5" fill="url(#dev-buzzer-body)" stroke="#a16207" stroke-width="0.8" />
      <circle r="7.5" fill="none" stroke="#ca8a04" stroke-width="0.8" opacity="0.6" />
      ${holes.join('')}
      <ellipse cx="-4" cy="-5" rx="4" ry="2.4" fill="#ffffff" opacity="0.55" />
      ${on ? `<g class="dev-buzz-waves" fill="none" stroke="#fb923c" stroke-width="1.6" stroke-linecap="round">
        <path d="M 21 -7 Q 25 0 21 7" /><path d="M 25 -11 Q 31 0 25 11" />
        <path d="M -21 -7 Q -25 0 -21 7" /><path d="M -25 -11 Q -31 0 -25 11" />
      </g>` : ''}
    </g>`;
}

/** 막음 캡 (2구 박스의 빈 구멍) */
export function blankCap() {
  return `
    <g class="dev-cap">
      <circle r="13" fill="#0f172a" opacity="0.3" transform="translate(1, 1.4)" />
      <!-- 검정 막음 캡 -->
      <circle r="12" fill="url(#dev-black)" stroke="#020617" stroke-width="1" />
      <circle r="8.5" fill="none" stroke="#475569" stroke-width="0.8" opacity="0.7" />
      <ellipse cx="-3.5" cy="-4.5" rx="3.5" ry="2" fill="#ffffff" opacity="0.25" />
    </g>`;
}

/** 흰색 명판 (기구 이름) */
export function nameplate(text, { width = 46 } = {}) {
  return `
    <g class="dev-nameplate">
      <rect x="${-width / 2}" y="-5.5" width="${width}" height="11" rx="1.5" fill="#ffffff" stroke="#94a3b8" stroke-width="0.8" />
      <text y="3.2" text-anchor="middle" font-size="7" font-weight="900" fill="#111827">${text}</text>
    </g>`;
}

/** type 문자열로 기구 그리기 */
export function deviceFace(type, state = {}) {
  switch (type) {
    case 'pb-green': return pushButton('green', state);
    case 'pb-red': return pushButton('red', state);
    case 'lamp-red': return pilotLamp('red', state);
    case 'lamp-green': return pilotLamp('green', state);
    case 'lamp-yellow': return pilotLamp('yellow', state);
    case 'lamp-white': return pilotLamp('white', state);
    case 'selector': return selectorSwitch(state);
    case 'buzzer': return buzzer(state);
    default: return blankCap();
  }
}

// 2구 박스 4종 구성 (위 기구 / 아래 기구) — 공개문제 1번 배관도
export const BOX_LAYOUTS = {
  'PB1/PB0': [{ type: 'pb-green', name: 'PB1 (기동)' }, { type: 'pb-red', name: 'PB0 (정지)' }],
  'SS/CAP': [{ type: 'selector', name: 'SS (M·A)' }, { type: 'cap', name: 'CAP' }],
  'RL/GL': [{ type: 'lamp-red', name: 'RL (적색)' }, { type: 'lamp-green', name: 'GL (녹색)' }],
  'YL/BZ': [{ type: 'lamp-yellow', name: 'YL (황색)' }, { type: 'buzzer', name: 'BZ (부저)' }]
};

/**
 * 2구 박스 뚜껑 (뚜껑 앞면으로 기구가 드러난 완성 모습)
 * - (0, 0) = 박스 왼쪽 위, 크기 90 × 140, 기구 중심 (45, 40) · (45, 100), 명판은 기구 아래
 */
export function boxCover(layoutName, states = [{}, {}]) {
  // 문제 데이터의 박스 정의({ name, top, bottom })도 받음
  const spec = typeof layoutName === 'object' ? layoutName : null;
  const layout = spec ? [spec.top, spec.bottom] : (BOX_LAYOUTS[layoutName] || []);
  if (spec) layoutName = spec.name;
  const screws = [[9, 9], [81, 9], [9, 131], [81, 131]]
    .map(([x, y]) => `<g transform="translate(${x}, ${y})"><circle r="3.6" fill="url(#dev-metal)" stroke="#475569" stroke-width="0.8" /><path d="M -2.2 0 L 2.2 0" stroke="#475569" stroke-width="1" /></g>`)
    .join('');
  const devices = layout.map((d, i) => {
    const cy = i === 0 ? 40 : 100;
    return `
      <g transform="translate(45, ${cy})">${deviceFace(d.type, states[i] || {})}</g>
      <g transform="translate(45, ${cy + 24})">${nameplate(d.name)}</g>`;
  }).join('');
  return `
    <g class="dev-box-cover" data-layout="${layoutName}">
      <rect x="1.5" y="2.5" width="90" height="140" rx="7" fill="#0f172a" opacity="0.35" />
      <rect width="90" height="140" rx="7" fill="url(#dev-cover)" stroke="#78716c" stroke-width="1.5" />
      <rect x="5" y="5" width="80" height="130" rx="5" fill="none" stroke="#a8a29e" stroke-width="0.8" />
      ${screws}
      ${devices}
    </g>`;
}
