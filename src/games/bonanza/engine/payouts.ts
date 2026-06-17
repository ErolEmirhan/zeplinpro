import type { SymbolId } from "../types";

const BASE: Record<SymbolId, number[]> = {
  banana: [0.25, 0.3, 0.4, 0.55, 0.75, 1.0, 1.4, 2.0, 3.0, 5.0],
  orange: [0.35, 0.4, 0.5, 0.7, 0.95, 1.3, 1.8, 2.6, 4.0, 7.0],
  watermelon: [0.4, 0.5, 0.65, 0.85, 1.15, 1.55, 2.2, 3.2, 5.0, 8.5],
  grapes: [0.45, 0.55, 0.7, 0.95, 1.25, 1.7, 2.4, 3.5, 5.5, 9.0],
  strawberry: [0.5, 0.65, 0.8, 1.05, 1.4, 1.9, 2.7, 4.0, 6.5, 11.0],
  blueberry: [0.55, 0.7, 0.9, 1.2, 1.6, 2.2, 3.2, 4.8, 7.5, 12.0],
  raspberry: [0.65, 0.8, 1.0, 1.35, 1.8, 2.5, 3.5, 5.5, 9.0, 15.0],
  candyGem: [1.0, 1.25, 1.6, 2.1, 2.8, 3.8, 5.5, 8.0, 13.0, 22.0],
  jellyCube: [1.5, 1.9, 2.4, 3.2, 4.3, 5.8, 8.5, 12.5, 20.0, 35.0],
  gummyBear: [2.5, 3.2, 4.0, 5.5, 7.5, 10.0, 15.0, 22.0, 35.0, 60.0],
  crystalCandy: [5.0, 6.5, 8.5, 11.0, 15.0, 20.0, 30.0, 45.0, 75.0, 120.0],
};

export function payoutForSymbol(symbol: SymbolId, count: number): number {
  if (count < 8) return 0;
  const table = BASE[symbol];
  const idx = Math.min(count - 8, table.length - 1);
  const base = table[idx];
  if (count >= 8 + table.length) {
    const extra = count - (8 + table.length - 1);
    return base * (1 + extra * 0.15);
  }
  return base;
}

export function tumbleWinAmount(
  symbol: SymbolId,
  count: number,
  bet: number,
): number {
  return bet * payoutForSymbol(symbol, count);
}
