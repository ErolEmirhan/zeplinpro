import { cloneGrid, collectBombs, cascadeGrid } from "./grid";
import { detectWins, winsToRemoveIds } from "./wins";
import {
  generateInitialBoard,
  prepareNextTumble,
  generateBonusTriggerBoard,
} from "./boardGenerator";
import { rollSpinContext } from "./spinContext";
import { countScatters, resolveScatter } from "./scatter";
import type { SpinResult } from "../types";

export type WinTier = "none" | "win" | "big" | "mega" | "ultra";

export function simulateSpin(bet: number, forceBonus = false): SpinResult {
  const ctx = rollSpinContext();
  let grid = forceBonus ? generateBonusTriggerBoard() : generateInitialBoard(ctx);
  const initialGrid = cloneGrid(grid);
  const steps: SpinResult["steps"] = [];
  const allBombs: SpinResult["bombMultipliers"] = [];
  let baseWin = 0;

  while (true) {
    const wins = detectWins(grid, bet);
    if (wins.length === 0) break;

    const tumbleWin = wins.reduce((s, w) => s + w.payout, 0);
    baseWin += tumbleWin;
    allBombs.push(...collectBombs(grid));

    steps.push({
      grid: cloneGrid(grid),
      wins,
      tumbleWin,
      bombs: collectBombs(grid),
    });

    const remove = winsToRemoveIds(grid, wins);
    const { grid: nextGrid, meta } = cascadeGrid(grid, remove, ctx);

    const last = steps[steps.length - 1];
    last.afterCascade = cloneGrid(nextGrid);
    last.cascadeMeta = meta;

    grid = nextGrid;
    if (ctx.isWinning) prepareNextTumble(ctx);
    if (steps.length > 12) break;
  }

  const scatterCount = countScatters(grid);
  const scatter = resolveScatter(scatterCount, bet);
  let scatterWin =
    scatter.type === "bonus" ? scatter.payout : 0;

  const totalMultiplier =
    allBombs.length > 0 && baseWin > 0
      ? allBombs.reduce((a, b) => a * b, 1)
      : 1;

  const totalWin =
    (baseWin > 0 ? baseWin * totalMultiplier : 0) + scatterWin;

  return {
    initialGrid,
    steps,
    baseWin,
    bombMultipliers: allBombs,
    totalMultiplier,
    totalWin,
    bet,
    scatter,
    finalGrid: cloneGrid(grid),
  };
}

export function classifyWin(totalWin: number, bet: number): WinTier {
  if (totalWin <= 0) return "none";
  const ratio = totalWin / bet;
  if (ratio >= 100) return "ultra";
  if (ratio >= 50) return "mega";
  if (ratio >= 20) return "big";
  return "win";
}
