import { MIN_CLUSTER } from "./constants";
import { tumbleWinAmount } from "./payouts";
import type { Grid, SymbolId, WinCluster } from "../types";
import { COLS, ROWS } from "../types";

export function detectWins(grid: Grid, bet: number): WinCluster[] {
  const counts = new Map<SymbolId, { col: number; row: number }[]>();

  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const cell = grid[c][r];
      if (cell.kind !== "symbol" || !cell.symbol) continue;
      const list = counts.get(cell.symbol) ?? [];
      list.push({ col: c, row: r });
      counts.set(cell.symbol, list);
    }
  }

  const wins: WinCluster[] = [];
  for (const [symbol, positions] of counts) {
    if (positions.length < MIN_CLUSTER) continue;
    wins.push({
      symbol,
      count: positions.length,
      positions,
      payout: tumbleWinAmount(symbol, positions.length, bet),
    });
  }

  return wins.sort((a, b) => b.payout - a.payout);
}

export function winningCellIds(wins: WinCluster[]): Set<string> {
  const ids = new Set<string>();
  for (const w of wins) {
    for (const p of w.positions) {
      ids.add(`${p.col}:${p.row}`);
    }
  }
  return ids;
}

export function winsToRemoveIds(grid: Grid, wins: WinCluster[]): Set<string> {
  const remove = new Set<string>();
  for (const w of wins) {
    for (const p of w.positions) {
      remove.add(grid[p.col][p.row].id);
    }
  }
  return remove;
}
