import { weightedPick, random } from "../rng/weighted";
import type { SymbolId } from "../types";
import { SYMBOL_SPAWN_WEIGHTS } from "./constants";

export type SpinProfile = "loss" | "small" | "medium" | "chain";

export type SpinContext = {
  profile: SpinProfile;
  isWinning: boolean;
  maxTumbles: number;
  tumbleIndex: number;
  bombsSpawned: number;
  maxBombs: number;
  /** Sonraki tumble için hedef sembol */
  cascadeSymbol?: SymbolId;
  cascadeTarget?: number;
};

export function rollSpinContext(): SpinContext {
  const r = random();

  if (r < 0.72) {
    return {
      profile: "loss",
      isWinning: false,
      maxTumbles: 0,
      tumbleIndex: 0,
      bombsSpawned: 0,
      maxBombs: 0,
    };
  }

  if (r < 0.9) {
    return {
      profile: "small",
      isWinning: true,
      maxTumbles: 1,
      tumbleIndex: 0,
      bombsSpawned: 0,
      maxBombs: random() < 0.35 ? 1 : 0,
      cascadeSymbol: weightedPick(SYMBOL_SPAWN_WEIGHTS),
      cascadeTarget: 8 + Math.floor(random() * 2),
    };
  }

  if (r < 0.97) {
    const tumbles = random() < 0.55 ? 2 : 3;
    return {
      profile: "medium",
      isWinning: true,
      maxTumbles: tumbles,
      tumbleIndex: 0,
      bombsSpawned: 0,
      maxBombs: random() < 0.7 ? 1 : 2,
      cascadeSymbol: weightedPick(SYMBOL_SPAWN_WEIGHTS),
      cascadeTarget: 8,
    };
  }

  return {
    profile: "chain",
    isWinning: true,
    maxTumbles: 4 + Math.floor(random() * 3),
    tumbleIndex: 0,
    bombsSpawned: 0,
    maxBombs: 2,
    cascadeSymbol: weightedPick(SYMBOL_SPAWN_WEIGHTS),
    cascadeTarget: 8,
  };
}

export function pickWinSymbol(): SymbolId {
  return weightedPick(SYMBOL_SPAWN_WEIGHTS);
}
