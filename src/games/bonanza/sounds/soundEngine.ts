type SfxKind =
  | "spin"
  | "landing"
  | "explosion"
  | "cascade"
  | "multiplier"
  | "bigWin"
  | "megaWin"
  | "ultraWin"
  | "scatter"
  | "freeSpins";

let ctx: AudioContext | null = null;
let muted = false;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    const c = ac();
    if (!c) return;
    if (c.state === "suspended") {
      c.resume();
    }
    const buffer = c.createBuffer(1, 1, 22050);
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.connect(c.destination);
    source.start(0);
  } catch (e) {
    console.warn("Unlock failed:", e);
  }
}

export function setSoundMuted(m: boolean) {
  muted = m;
}

export function isSoundMuted() {
  return muted;
}

function env(
  gain: GainNode,
  t: number,
  attack: number,
  decay: number,
  peak: number,
) {
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.5,
  when = 0,
) {
  const c = ac();
  if (!c || muted) return;
  if (c.state === "suspended") {
    c.resume();
  }
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  env(g, t, 0.01, dur, gain);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noiseBurst(dur: number, gain = 0.45, when = 0) {
  const c = ac();
  if (!c || muted) return;
  if (c.state === "suspended") {
    c.resume();
  }
  const t = c.currentTime + when;
  const bufferSize = c.sampleRate * dur;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  env(g, t, 0.005, dur, gain);
  src.connect(g);
  g.connect(c.destination);
  src.start(t);
}

export function playSfx(kind: SfxKind) {
  switch (kind) {
    case "spin":
      tone(180, 0.15, "triangle", 0.45);
      tone(280, 0.12, "triangle", 0.35, 0.06);
      tone(420, 0.1, "sine", 0.25, 0.12);
      break;
    case "landing":
      tone(520 + Math.random() * 80, 0.06, "sine", 0.32);
      break;
    case "explosion":
      noiseBurst(0.18, 0.5);
      tone(90, 0.2, "sawtooth", 0.45);
      tone(60, 0.25, "square", 0.3, 0.02);
      break;
    case "cascade":
      tone(340, 0.08, "triangle", 0.35);
      tone(480, 0.06, "sine", 0.28, 0.05);
      break;
    case "multiplier":
      [523, 659, 784, 988].forEach((f, i) =>
        tone(f, 0.12, "triangle", 0.5, i * 0.07),
      );
      break;
    case "bigWin":
      [392, 494, 587, 698, 784].forEach((f, i) =>
        tone(f, 0.16, "triangle", 0.6, i * 0.09),
      );
      break;
    case "megaWin":
      [330, 415, 523, 659, 784, 988].forEach((f, i) =>
        tone(f, 0.18, "triangle", 0.7, i * 0.1),
      );
      break;
    case "ultraWin":
      [262, 330, 392, 523, 659, 784, 988, 1175].forEach((f, i) =>
        tone(f, 0.2, "sawtooth", 0.75, i * 0.11),
      );
      noiseBurst(0.3, 0.35, 0.2);
      break;
    case "scatter":
      [440, 554, 659, 880].forEach((f, i) =>
        tone(f, 0.14, "triangle", 0.6, i * 0.08),
      );
      break;
    case "freeSpins":
      [330, 392, 494, 587, 659, 784, 988, 1175, 1319].forEach((f, i) =>
        tone(f, 0.22, "triangle", 0.7, i * 0.12),
      );
      noiseBurst(0.4, 0.4, 0.3);
      break;
  }
}

export async function resumeAudio() {
  const c = ac();
  if (c?.state === "suspended") await c.resume();
}
