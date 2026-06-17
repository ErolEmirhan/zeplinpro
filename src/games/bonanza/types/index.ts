export type SymbolId =
  | "banana"
  | "orange"
  | "watermelon"
  | "grapes"
  | "strawberry"
  | "blueberry"
  | "raspberry"
  | "candyGem"
  | "jellyCube"
  | "gummyBear"
  | "crystalCandy";

export type BombMultiplier = 2 | 3 | 5 | 8 | 10 | 12 | 15 | 20 | 25 | 50 | 100;

export type CellKind = "symbol" | "bomb" | "scatter";

export type GridCell = {
  id: string;
  kind: CellKind;
  symbol?: SymbolId;
  multiplier?: BombMultiplier;
  isNew?: boolean;
};

export type CascadeMeta = {
  fallRows: Record<string, number>;
  newIds: Set<string>;
};

export type Grid = GridCell[][];

export type WinCluster = {
  symbol: SymbolId;
  count: number;
  positions: { col: number; row: number }[];
  payout: number;
};

export type ScatterResult =
  | { type: "none" }
  | { type: "bonus"; count: number; payout: number }
  | { type: "freespins"; count: number; spins: number; multBoost: number };

export type TumbleStep = {
  grid: Grid;
  wins: WinCluster[];
  tumbleWin: number;
  bombs: BombMultiplier[];
  afterCascade?: Grid;
  cascadeMeta?: CascadeMeta;
};

export type SpinResult = {
  initialGrid: Grid;
  steps: TumbleStep[];
  baseWin: number;
  bombMultipliers: BombMultiplier[];
  totalMultiplier: number;
  totalWin: number;
  bet: number;
  scatter: ScatterResult;
  finalGrid: Grid;
};

export type GamePhase =
  | "idle"
  | "spinning"
  | "exploding"
  | "cascading"
  | "payout"
  | "celebration"
  | "freeSpinsIntro"
  | "scatterBonus";

export type AutoSpinOption = 10 | 25 | 50 | 100 | "infinite";

export type SpeedMode = "normal" | "fast" | "turbo";

export type SessionStats = {
  totalSpins: number;
  wins: number;
  losses: number;
  totalWagered: number;
  totalWon: number;
  largestWin: number;
  sessionStartBalance: number;
  freeSpinsTriggered: number;
};

export type BonanzaPersist = {
  balance: number;
  stats: SessionStats;
  history: SpinHistoryEntry[];
};

export type SpinHistoryEntry = {
  id: string;
  bet: number;
  win: number;
  multiplier: number;
  timestamp: number;
};

export const COLS = 6;
export const ROWS = 5;

export const BET_OPTIONS = [
  20, 50, 100, 200, 500, 1000, 5000, 10000,
] as const;

export const INITIAL_BALANCE = 100_000;

export const FREE_SPINS_DEFAULT = 10;
export const FREE_SPINS_MEGA = 15;
