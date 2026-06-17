import { random } from "../rng/weighted";
import { weightedPick } from "../rng/weighted";
import { BOMB_VALUE_WEIGHTS } from "./constants";
import type { SpinContext } from "./spinContext";
import type { GridCell, SymbolId } from "../types";

let cellSeq = 0;

export function resetCellSeq(n = 0) {
  cellSeq = n;
}

export function nextCellId() {
  cellSeq += 1;
  return `c-${cellSeq}`;
}

export function symbolCell(symbol: SymbolId, isNew = false): GridCell {
  return { id: nextCellId(), kind: "symbol", symbol, isNew };
}

export function scatterCell(isNew = false): GridCell {
  return { id: nextCellId(), kind: "scatter", isNew };
}

export function bombCell(ctx?: SpinContext): GridCell {
  if (ctx) ctx.bombsSpawned += 1;
  const multiplier = weightedPick(BOMB_VALUE_WEIGHTS);
  return { id: nextCellId(), kind: "bomb", multiplier, isNew: true };
}

export function maybeScatterCell(
  scatterCount: number,
  maxScatters: number,
): GridCell | null {
  if (scatterCount >= maxScatters) return null;
  if (random() < 0.022) return scatterCell(true);
  return null;
}
