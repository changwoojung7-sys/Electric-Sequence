/**
 * 공용 오디오 컨텍스트 (모든 단계 엔진이 하나의 AudioContext를 공유)
 * - 단계마다 new AudioContext()를 만들면 브라우저 자원을 낭비하고 개수 제한에 걸릴 수 있음
 */
let sharedContext = null;

export function getAudioContext() {
  if (sharedContext) return sharedContext;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedContext = new AudioCtx();
    }
  } catch (e) {
    // ignore
  }
  return sharedContext;
}

/** 짧은 잡음 덩어리 (딸깍 소리의 재료) */
function noiseBurst(ctx, at, { dur, freq, q = 1, gain, type = 'bandpass' }) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start(at);
}

/** 짧은 감쇠 사인파 (철심이 붙을 때의 "쿵" 울림) */
function thump(ctx, at, { freq, dur, gain }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, at + dur);
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/**
 * 릴레이·전자접촉기 "딸깍" 소리
 * - kind: 'contactor'(MC, 크고 묵직한 "철컥"), 'relay'(X·FR·T, 작고 가벼운 "딸깍")
 * - on: true = 여자(붙음, 조금 더 큼), false = 해제(떨어짐, 조금 작음)
 */
export function playRelayClick(kind = 'relay', on = true) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime + 0.005;
  const v = on ? 1 : 0.65;
  if (kind === 'contactor') {
    noiseBurst(ctx, t, { dur: 0.05, freq: 1800, q: 0.8, gain: 0.9 * v });
    thump(ctx, t, { freq: 140, dur: 0.09, gain: 0.45 * v });
    noiseBurst(ctx, t + 0.018, { dur: 0.03, freq: 3200, q: 1.5, gain: 0.35 * v });   // 접점 되튐
  } else {
    noiseBurst(ctx, t, { dur: 0.025, freq: 4200, q: 1.2, gain: 0.7 * v });
    thump(ctx, t, { freq: 420, dur: 0.035, gain: 0.18 * v });
  }
}

/** 타이머 설정시간 도달 알림: "띵-동" 두 음 */
export function playTimerChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime + 0.01;
  [[1318.5, 0], [987.8, 0.16]].forEach(([f, d]) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0, t + d);
    g.gain.linearRampToValueAtTime(0.22, t + d + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.5);
    osc.connect(g).connect(ctx.destination);
    osc.start(t + d);
    osc.stop(t + d + 0.55);
  });
}

/** 푸시버튼 "톡" (down = 누를 때 또렷하게, 뗄 때 가볍게) */
export function playButtonClick(down = true) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime + 0.005;
  noiseBurst(ctx, t, { dur: down ? 0.03 : 0.02, freq: down ? 2600 : 3400, q: 2, gain: down ? 0.8 : 0.45 });
  thump(ctx, t, { freq: down ? 900 : 1200, dur: 0.05, gain: down ? 0.25 : 0.12 });
}

/** 셀렉터 스위치 "철컥" (돌아가는 소리 + 걸리는 소리) */
export function playSelectorClick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime + 0.005;
  noiseBurst(ctx, t, { dur: 0.06, freq: 1500, q: 0.7, gain: 0.35 });
  noiseBurst(ctx, t + 0.07, { dur: 0.03, freq: 3000, q: 1.5, gain: 0.8 });
  thump(ctx, t + 0.07, { freq: 500, dur: 0.05, gain: 0.25 });
}

/** 수위 알림: full = 만수(올라가는 "뽀로롱" + 물 소리) / 아니면 저수위(내려가는 두 음) */
export function playWaterAlert(full = true) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime + 0.01;
  const notes = full ? [784, 988, 1175, 1568] : [880, 587];
  notes.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const at = t + i * 0.11;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.2, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.35);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.4);
  });
  if (full) {
    // 물 소리: 낮은 대역 잡음 + 방울 소리 몇 번
    noiseBurst(ctx, t, { dur: 0.5, freq: 500, q: 0.6, gain: 0.25, type: 'lowpass' });
    [0.05, 0.18, 0.3].forEach(d => thump(ctx, t + d, { freq: 700 + d * 900, dur: 0.06, gain: 0.12 }));
  }
}

/** EOCR 리셋: 계전기 "딸깍" + 올라가는 "딩-동-댕" 복귀음 */
export function playResetChime() {
  playRelayClick('relay', true);
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime + 0.08;
  [1047, 1319, 1568].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    const at = t + i * 0.12;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.2, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.45);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.5);
  });
}

/**
 * 분필로 칠판(합판)에 긋는 "사각사각" 소리
 * - 거친 잡음에 빠르게 떨리는 크기 변화를 주어 분필 알갱이가 긁히는 느낌
 * - strokes: 긋는 횟수 (+ 마킹 = 2획), dur: 한 획 길이(초)
 */
export function playChalkStroke(strokes = 2, dur = 0.22) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  let t = ctx.currentTime + 0.01;
  for (let s = 0; s < strokes; s++) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let grain = 0;
    for (let i = 0; i < len; i++) {
      if (i % 90 === 0) grain = 0.35 + Math.random() * 0.65;          // 알갱이마다 세기가 달라짐
      const env = Math.min(1, i / (len * 0.12)) * Math.min(1, (len - i) / (len * 0.25));
      data[i] = (Math.random() * 2 - 1) * grain * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(2600 + Math.random() * 500, t);
    band.frequency.linearRampToValueAtTime(3400, t + dur);
    band.Q.value = 0.9;
    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.value = 0.32;
    src.connect(band).connect(high).connect(g).connect(ctx.destination);
    src.start(t);
    t += dur + 0.06;
  }
}
