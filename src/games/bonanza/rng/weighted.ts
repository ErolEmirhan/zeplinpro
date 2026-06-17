export type WeightedItem<T> = { value: T; weight: number };

let seed = Date.now() ^ (Math.random() * 0xffffffff);

/** Mulberry32 — hızlı, doğal hisli PRNG. */
export function setSeed(s: number) {
  seed = s >>> 0;
}

export function random(): number {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function weightedPick<T>(items: WeightedItem<T>[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
