const STORAGE_KEY = "bonanza_session_v1";

import type { BonanzaPersist, SessionStats } from "../types";
import { INITIAL_BALANCE } from "../types";

export function defaultStats(): SessionStats {
  return {
    totalSpins: 0,
    wins: 0,
    losses: 0,
    totalWagered: 0,
    totalWon: 0,
    largestWin: 0,
    sessionStartBalance: INITIAL_BALANCE,
    freeSpinsTriggered: 0,
  };
}

export function defaultPersist(): BonanzaPersist {
  return {
    balance: INITIAL_BALANCE,
    stats: defaultStats(),
    history: [],
  };
}

export function loadPersist(): BonanzaPersist {
  if (typeof window === "undefined") return defaultPersist();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersist();
    const parsed = JSON.parse(raw) as BonanzaPersist;
    return {
      balance: parsed.balance ?? INITIAL_BALANCE,
      stats: { ...defaultStats(), ...parsed.stats, freeSpinsTriggered: parsed.stats?.freeSpinsTriggered ?? 0 },
      history: parsed.history ?? [],
    };
  } catch {
    return defaultPersist();
  }
}

export function savePersist(data: BonanzaPersist) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function formatCoins(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(Math.floor(n));
}

export function calcRtp(stats: SessionStats): number {
  if (stats.totalWagered <= 0) return 0;
  return (stats.totalWon / stats.totalWagered) * 100;
}

export function calcHitRate(stats: SessionStats): number {
  if (stats.totalSpins <= 0) return 0;
  return (stats.wins / stats.totalSpins) * 100;
}

export function delay(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}
