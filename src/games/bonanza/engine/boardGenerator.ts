import { random, shuffle, weightedPick } from "../rng/weighted";
import type { Grid, SymbolId } from "../types";
import { COLS, ROWS } from "../types";
import {
  MAX_SCATTERS_LOSS,
  MAX_SCATTERS_WIN,
  MIN_CLUSTER,
  SYMBOL_SPAWN_WEIGHTS,
} from "./constants";
import { detectWins } from "./wins";
import { countScatters } from "./scatter";
import type { SpinContext } from "./spinContext";
import { pickWinSymbol } from "./spinContext";
import { symbolCell, bombCell, maybeScatterCell, scatterCell } from "./cells";

const ALL_SYMBOLS = SYMBOL_SPAWN_WEIGHTS.map((s) => s.value);

function countSymbols(grid: Grid): Map<SymbolId, number> {
  const m = new Map<SymbolId, number>();
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const cell = grid[c][r];
      if (cell.kind === "symbol" && cell.symbol) {
        m.set(cell.symbol, (m.get(cell.symbol) ?? 0) + 1);
      }
    }
  }
  return m;
}

function pickSymbolUnderCap(
  counts: Map<SymbolId, number>,
  cap: number,
): SymbolId {
  const allowed = ALL_SYMBOLS.filter((s) => (counts.get(s) ?? 0) < cap);
  if (allowed.length === 0) return weightedPick(SYMBOL_SPAWN_WEIGHTS);
  const weights = SYMBOL_SPAWN_WEIGHTS.filter((w) => allowed.includes(w.value));
  return weightedPick(weights);
}

function spawnRegularCell(
  counts: Map<SymbolId, number>,
  scatterCount: { n: number },
  maxScatters: number,
) {
  const sc = maybeScatterCell(scatterCount.n, maxScatters);
  if (sc) {
    scatterCount.n += 1;
    return sc;
  }
  const sym = pickSymbolUnderCap(counts, 7);
  counts.set(sym, (counts.get(sym) ?? 0) + 1);
  return symbolCell(sym);
}

export function generateLossBoard(): Grid {
  for (let attempt = 0; attempt < 80; attempt++) {
    const counts = new Map<SymbolId, number>();
    const scatterCount = { n: 0 };
    const flat: import("../types").GridCell[] = [];

    for (let i = 0; i < COLS * ROWS; i++) {
      flat.push(spawnRegularCell(counts, scatterCount, MAX_SCATTERS_LOSS));
    }

    const shuffled = shuffle(flat);
    const grid: Grid = Array.from({ length: COLS }, (_, c) =>
      Array.from({ length: ROWS }, (_, r) => shuffled[c * ROWS + r]),
    );

    if (detectWins(grid, 100).length === 0) return grid;
  }

  const counts = new Map<SymbolId, number>();
  const scatterCount = { n: 0 };
  return Array.from({ length: COLS }, () =>
    Array.from({ length: ROWS }, () =>
      spawnRegularCell(counts, scatterCount, MAX_SCATTERS_LOSS),
    ),
  );
}

export function generateWinBoard(symbol: SymbolId, count: number): Grid {
  const positions: { c: number; r: number }[] = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) positions.push({ c, r });
  }
  const chosen = shuffle(positions).slice(0, count);
  const chosenSet = new Set(chosen.map((p) => `${p.c}:${p.r}`));
  const counts = new Map<SymbolId, number>([[symbol, count]]);
  const scatterCount = { n: 0 };

  return Array.from({ length: COLS }, (_, c) =>
    Array.from({ length: ROWS }, (_, r) => {
      if (chosenSet.has(`${c}:${r}`)) return symbolCell(symbol);
      return spawnRegularCell(counts, scatterCount, MAX_SCATTERS_WIN);
    }),
  );
}

export function generateInitialBoard(ctx: SpinContext): Grid {
  if (!ctx.isWinning) return generateLossBoard();
  const sym = ctx.cascadeSymbol ?? pickWinSymbol();
  const count = ctx.cascadeTarget ?? 8 + Math.floor(random() * 2);
  ctx.cascadeSymbol = sym;
  return generateWinBoard(sym, Math.min(count, 12));
}

export function spawnRefillCells(
  count: number,
  ctx: SpinContext,
  grid: Grid,
): import("../types").GridCell[] {
  const cells: import("../types").GridCell[] = [];
  const boardCounts = countSymbols(grid);
  const scatterOnBoard = countScatters(grid);
  let cascadePlaced = 0;
  const cascadeGoal =
    ctx.isWinning && ctx.tumbleIndex < ctx.maxTumbles
      ? 4 + Math.floor(random() * 3)
      : 0;

  for (let i = 0; i < count; i++) {
    if (
      ctx.isWinning &&
      ctx.tumbleIndex >= 1 &&
      ctx.bombsSpawned < ctx.maxBombs &&
      random() < 0.035
    ) {
      cells.push(bombCell(ctx));
      continue;
    }

    const sc = maybeScatterCell(
      scatterOnBoard + cells.filter((x) => x.kind === "scatter").length,
      ctx.isWinning ? MAX_SCATTERS_WIN : MAX_SCATTERS_LOSS,
    );
    if (sc) {
      cells.push(sc);
      continue;
    }

    if (
      cascadeGoal > 0 &&
      cascadePlaced < cascadeGoal &&
      ctx.cascadeSymbol &&
      (boardCounts.get(ctx.cascadeSymbol) ?? 0) < MIN_CLUSTER &&
      random() < 0.55
    ) {
      cells.push(symbolCell(ctx.cascadeSymbol));
      boardCounts.set(
        ctx.cascadeSymbol,
        (boardCounts.get(ctx.cascadeSymbol) ?? 0) + 1,
      );
      cascadePlaced += 1;
      continue;
    }

    const sym = pickSymbolUnderCap(boardCounts, 7);
    boardCounts.set(sym, (boardCounts.get(sym) ?? 0) + 1);
    cells.push(symbolCell(sym));
  }

  return cells;
}

export function prepareNextTumble(ctx: SpinContext) {
  ctx.tumbleIndex += 1;
  if (ctx.tumbleIndex < ctx.maxTumbles) {
    ctx.cascadeSymbol = pickWinSymbol();
    ctx.cascadeTarget = 8;
  }
}

export function generateBonusTriggerBoard(): Grid {
  const grid = generateLossBoard();
  const positions: { c: number; r: number }[] = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      positions.push({ c, r });
    }
  }
  const chosen = shuffle(positions).slice(0, 4);
  for (const pos of chosen) {
    grid[pos.c][pos.r] = scatterCell(true);
  }
  return grid;
}
