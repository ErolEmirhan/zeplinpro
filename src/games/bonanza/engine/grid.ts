import { spawnRefillCells, generateLossBoard } from "./boardGenerator";
import type { SpinContext } from "./spinContext";
import type { BombMultiplier, Grid, GridCell } from "../types";
import { COLS, ROWS } from "../types";

export function cloneGrid(grid: Grid): Grid {
  return grid.map((col) => col.map((cell) => ({ ...cell })));
}

export function collectBombs(grid: Grid): BombMultiplier[] {
  const bombs: BombMultiplier[] = [];
  for (let c = 0; c < grid.length; c++) {
    for (let r = 0; r < grid[c].length; r++) {
      const cell = grid[c][r];
      if (cell?.kind === "bomb" && cell.multiplier) {
        bombs.push(cell.multiplier);
      }
    }
  }
  return bombs;
}

export type CascadeMeta = {
  fallRows: Record<string, number>;
  newIds: Set<string>;
};

export function cascadeGrid(
  grid: Grid,
  remove: Set<string>,
  ctx: SpinContext,
): { grid: Grid; meta: CascadeMeta } {
  const next: Grid = [];
  const fallRows: Record<string, number> = {};
  const newIds = new Set<string>();

  for (let c = 0; c < COLS; c++) {
    const remaining: GridCell[] = [];
    const removedRows: number[] = [];

    for (let r = 0; r < ROWS; r++) {
      const cell = grid[c][r];
      if (remove.has(cell.id)) {
        removedRows.push(r);
      } else {
        remaining.push({ ...cell, isNew: false });
      }
    }

    const needed = ROWS - remaining.length;
    const fresh = spawnRefillCells(needed, ctx, grid).map((cell) => {
      newIds.add(cell.id);
      fallRows[cell.id] = needed;
      return { ...cell, isNew: true };
    });

    for (const cell of remaining) {
      const origRow = grid[c].findIndex((x) => x.id === cell.id);
      const belowRemoved = removedRows.filter((rr) => rr > origRow).length;
      if (belowRemoved > 0) fallRows[cell.id] = belowRemoved;
    }

    next[c] = [...fresh, ...remaining];
  }

  return { grid: next, meta: { fallRows, newIds } };
}

export function generatePreviewGrid(): Grid {
  return generateLossBoard();
}
