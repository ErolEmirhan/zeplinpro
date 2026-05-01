/**
 * Patlama çarpanı — tur başında tek gizli eşik.
 *
 * 0–1× bantları (toplam ~%24; düşük turlar hâlâ var ama yüksekler daha sık):
 * - %4  → 0,03×–(0,40×]
 * - %10 → (0,40×, 0,70×]
 * - %10 → (0,70×, 1×]
 * Kalan ~%76 → 1× üstü kovalar.
 */
export const CRASH_MIN = 0.03;
export const CRASH_MAX = 5000;

function logUniform(lo: number, hi: number): number {
  const a = Math.log(lo);
  const b = Math.log(hi);
  return Math.exp(a + Math.random() * (b - a));
}

function linearUniform(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

function finalize(n: number): number {
  return (
    Math.round(Math.min(CRASH_MAX, Math.max(CRASH_MIN, n)) * 100) / 100
  );
}

export function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.04) return finalize(linearUniform(CRASH_MIN, 0.4));
  if (r < 0.14) return finalize(linearUniform(0.4, 0.7));
  if (r < 0.24) return finalize(linearUniform(0.7, 1));
  if (r < 0.54) return finalize(logUniform(1, 14));
  if (r < 0.7) return finalize(logUniform(14, 48));
  if (r < 0.84) return finalize(logUniform(48, 140));
  if (r < 0.95) return finalize(logUniform(140, 620));
  return finalize(logUniform(620, CRASH_MAX));
}
