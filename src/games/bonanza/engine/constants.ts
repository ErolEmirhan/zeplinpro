import type { SymbolId } from "../types";
import type { WeightedItem } from "../rng/weighted";

export const SYMBOL_META: Record<
  SymbolId,
  { label: string; gradient: string; glow: string; accent: string }
> = {
  banana: {
    label: "Muz",
    gradient: "linear-gradient(145deg, #fff3a3 0%, #fbbf24 40%, #b45309 100%)",
    glow: "rgba(251,191,36,0.7)",
    accent: "#f59e0b",
  },
  orange: {
    label: "Portakal",
    gradient: "linear-gradient(145deg, #fed7aa 0%, #f97316 45%, #c2410c 100%)",
    glow: "rgba(249,115,22,0.7)",
    accent: "#f97316",
  },
  watermelon: {
    label: "Karpuz",
    gradient: "linear-gradient(145deg, #86efac 0%, #22c55e 35%, #f43f5e 100%)",
    glow: "rgba(34,197,94,0.65)",
    accent: "#22c55e",
  },
  grapes: {
    label: "Üzüm",
    gradient: "linear-gradient(145deg, #ddd6fe 0%, #8b5cf6 50%, #5b21b6 100%)",
    glow: "rgba(139,92,246,0.7)",
    accent: "#8b5cf6",
  },
  strawberry: {
    label: "Çilek",
    gradient: "linear-gradient(145deg, #fecdd3 0%, #f43f5e 50%, #be123c 100%)",
    glow: "rgba(244,63,94,0.75)",
    accent: "#f43f5e",
  },
  blueberry: {
    label: "Yaban mersini",
    gradient: "linear-gradient(145deg, #a5b4fc 0%, #4f46e5 50%, #312e81 100%)",
    glow: "rgba(79,70,229,0.7)",
    accent: "#6366f1",
  },
  raspberry: {
    label: "Ahududu",
    gradient: "linear-gradient(145deg, #fda4af 0%, #e11d48 50%, #9f1239 100%)",
    glow: "rgba(225,29,72,0.75)",
    accent: "#e11d48",
  },
  candyGem: {
    label: "Renkli Şeker",
    gradient: "linear-gradient(145deg, #67e8f9 0%, #ec4899 50%, #a855f7 100%)",
    glow: "rgba(236,72,153,0.75)",
    accent: "#ec4899",
  },
  jellyCube: {
    label: "Jöle",
    gradient: "linear-gradient(145deg, #bbf7d0 0%, #34d399 50%, #059669 100%)",
    glow: "rgba(52,211,153,0.75)",
    accent: "#34d399",
  },
  gummyBear: {
    label: "Ayıcık",
    gradient: "linear-gradient(145deg, #f9a8d4 0%, #db2777 50%, #9d174d 100%)",
    glow: "rgba(219,39,119,0.75)",
    accent: "#db2777",
  },
  crystalCandy: {
    label: "Kristal",
    gradient: "linear-gradient(145deg, #e0f2fe 0%, #38bdf8 40%, #7c3aed 100%)",
    glow: "rgba(56,189,248,0.8)",
    accent: "#38bdf8",
  },
};

export const SYMBOL_SPAWN_WEIGHTS: WeightedItem<SymbolId>[] = [
  { value: "banana", weight: 17 },
  { value: "orange", weight: 16 },
  { value: "grapes", weight: 14 },
  { value: "watermelon", weight: 12 },
  { value: "strawberry", weight: 11 },
  { value: "blueberry", weight: 10 },
  { value: "raspberry", weight: 8 },
  { value: "candyGem", weight: 5 },
  { value: "jellyCube", weight: 4 },
  { value: "gummyBear", weight: 2 },
  { value: "crystalCandy", weight: 1 },
];

export const SCATTER_SPAWN_CHANCE = 0.022;
export const MAX_SCATTERS_LOSS = 2;
export const MAX_SCATTERS_WIN = 1;

export const BOMB_VALUE_WEIGHTS: WeightedItem<
  import("../types").BombMultiplier
>[] = [
  { value: 2, weight: 400 },
  { value: 3, weight: 300 },
  { value: 5, weight: 180 },
  { value: 8, weight: 60 },
  { value: 10, weight: 30 },
  { value: 12, weight: 15 },
  { value: 15, weight: 8 },
  { value: 20, weight: 4 },
  { value: 25, weight: 2 },
  { value: 50, weight: 0.8 },
  { value: 100, weight: 0.2 },
];

export const MIN_CLUSTER = 8;
