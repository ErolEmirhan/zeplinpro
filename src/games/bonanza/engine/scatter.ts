import type { ScatterResult } from "../types";
import { FREE_SPINS_DEFAULT, FREE_SPINS_MEGA } from "../types";
import type { Grid } from "../types";
import { COLS, ROWS } from "../types";

export function countScatters(grid: Grid): number {
  let n = 0;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (grid[c][r].kind === "scatter") n++;
    }
  }
  return n;
}

export function resolveScatter(count: number, bet: number): ScatterResult {
  if (count < 3) return { type: "none" };
  if (count === 3) {
    return { type: "bonus", count, payout: bet * 3 };
  }
  if (count === 4) {
    return { type: "freespins", count, spins: FREE_SPINS_DEFAULT, multBoost: 1 };
  }
  return {
    type: "freespins",
    count,
    spins: FREE_SPINS_MEGA,
    multBoost: 2,
  };
}
