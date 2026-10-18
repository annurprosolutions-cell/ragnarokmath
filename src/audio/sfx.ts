// Synthesised sound effects with WebAudio — no audio files to download or cache.

let ctx: AudioContext | null = null;
let enabled = true;

export function setSound(on: boolean): void {
  enabled = on;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, slideTo?: number): void {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(start: number, dur: number, vol = 0.2, freq = 1200): void {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + start;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

export const sfx = {
  click: () => tone(660, 0, 0.06, 'triangle', 0.08),
  correct: () => {
    tone(784, 0, 0.12, 'triangle', 0.14);
    tone(1175, 0.08, 0.18, 'triangle', 0.14);
  },
  wrong: () => tone(220, 0, 0.3, 'sawtooth', 0.08, 140),
  hit: () => noise(0, 0.15, 0.35, 900),
  hurt: () => {
    noise(0, 0.2, 0.3, 400);
    tone(180, 0, 0.2, 'square', 0.05, 90);
  },
  crit: () => {
    noise(0, 0.2, 0.4, 1500);
    tone(1400, 0, 0.15, 'square', 0.06, 2000);
  },
  heal: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.07, 0.2, 'sine', 0.12)),
  coin: () => {
    tone(988, 0, 0.08, 'square', 0.05);
    tone(1319, 0.07, 0.15, 'square', 0.05);
  },
  victory: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.13)),
  levelUp: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.08, 0.3, 'triangle', 0.13)),
  portal: () => tone(300, 0, 0.6, 'sine', 0.12, 1200),
  defeat: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.18, 0.35, 'triangle', 0.12)),
};
