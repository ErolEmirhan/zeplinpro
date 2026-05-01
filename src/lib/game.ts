import {
  getDoc,
  runTransaction,
  setDoc,
  serverTimestamp,
  doc,
  type Transaction,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { multiplierAtElapsedSeconds, multiplierRawAtElapsedSeconds } from "@/lib/multiplier";
import { generateCrashPoint } from "@/lib/crashPoint";
import { withFirestoreRetry } from "@/lib/firestoreRetry";

export type GamePhase = "betting" | "flying";

export type GameState = {
  phase: GamePhase;
  roundSeq: number;
  bettingEndsAt: number;
  flyStartedAt: number | null;
  crashPoint: number | null;
  history: number[];
};

export type ActiveBet = {
  amount: number;
  roundSeq: number;
};

export type PlayerState = {
  username: string;
  balance: number;
  activeBet: ActiveBet | null;
};

function gameRef() {
  return doc(getDb(), "games", "zeplin_odasi");
}

export { CRASH_MAX, CRASH_MIN, generateCrashPoint } from "@/lib/crashPoint";

export function gameRefOf() {
  return gameRef();
}

export function playerRefOf(playerDocId: string) {
  return doc(getDb(), "games", "zeplin_odasi", "players", playerDocId);
}

export async function ensureGameDocument(): Promise<void> {
  const ref = gameRef();
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const now = Date.now();
  await setDoc(ref, {
    phase: "betting",
    roundSeq: 1,
    bettingEndsAt: now + 20_000,
    flyStartedAt: null,
    crashPoint: null,
    history: [] as number[],
    updatedAt: serverTimestamp(),
  });
}

function readPlayer(tx: Transaction, playerDocId: string) {
  const ref = playerRefOf(playerDocId);
  return tx.get(ref).then((s) => ({
    ref,
    data: s.exists() ? (s.data() as PlayerState) : null,
  }));
}

export async function ensurePlayer(
  playerDocId: string,
  displayName: string,
): Promise<void> {
  const ref = playerRefOf(playerDocId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    username: displayName,
    balance: 10_000,
    activeBet: null,
    updatedAt: serverTimestamp(),
  });
}

export function currentFlyingMultiplier(state: GameState, now = Date.now()): number {
  if (state.phase !== "flying" || !state.flyStartedAt || state.crashPoint == null)
    return 0;
  const elapsed = (now - state.flyStartedAt) / 1000;
  return multiplierAtElapsedSeconds(elapsed, state.crashPoint);
}

export async function tryStartFlyingRound(): Promise<boolean> {
  return withFirestoreRetry(async () => {
    let started = false;
    await runTransaction(getDb(), async (tx) => {
      const ref = gameRef();
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const g = snap.data() as GameState;
      const now = Date.now();
      if (g.phase !== "betting" || now < g.bettingEndsAt) return;
      const crashPoint = generateCrashPoint();
      tx.update(ref, {
        phase: "flying",
        flyStartedAt: now,
        crashPoint,
      });
      started = true;
    });
    return started;
  });
}

export async function tryEndFlyingRound(): Promise<boolean> {
  return withFirestoreRetry(async () => {
    let ended = false;
    await runTransaction(getDb(), async (tx) => {
      const ref = gameRef();
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const g = snap.data() as GameState;
      if (g.phase !== "flying" || !g.flyStartedAt || g.crashPoint == null) return;
      const now = Date.now();
      const multRaw = multiplierRawAtElapsedSeconds(
        (now - g.flyStartedAt) / 1000,
        g.crashPoint,
      );
      if (multRaw + 1e-9 < g.crashPoint) return;
      const hist = Array.isArray(g.history) ? [...g.history] : [];
      hist.unshift(g.crashPoint);
      const trimmed = hist.slice(0, 80);
      tx.update(ref, {
        phase: "betting",
        roundSeq: g.roundSeq + 1,
        bettingEndsAt: now + 20_000,
        flyStartedAt: null,
        crashPoint: null,
        history: trimmed,
      });
      ended = true;
    });
    return ended;
  });
}

export async function placeBet(
  playerDocId: string,
  displayName: string,
  amount: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "Geçerli bir tutar girin." };
  }
  const rounded = Math.floor(amount * 100) / 100;
  return withFirestoreRetry(async () => {
    let reason = "İşlem yapılamadı.";
    let ok = false;
    await runTransaction(getDb(), async (tx) => {
      const gSnap = await tx.get(gameRef());
      if (!gSnap.exists()) {
        reason = "Oyun hazır değil.";
        return;
      }
      const g = gSnap.data() as GameState;
      if (g.phase !== "betting") {
        reason = "Bahis süresi kapandı.";
        return;
      }
      const p = await readPlayer(tx, playerDocId);
      if (!p.data) {
        tx.set(p.ref, {
          username: displayName,
          balance: Math.round((10_000 - rounded) * 100) / 100,
          activeBet: { amount: rounded, roundSeq: g.roundSeq },
          updatedAt: serverTimestamp(),
        });
        ok = true;
        return;
      }
      if (p.data.activeBet) {
        reason = "Zaten bir bahisiniz var.";
        return;
      }
      if (p.data.balance < rounded) {
        reason = "Bakiye yetersiz.";
        return;
      }
      tx.update(p.ref, {
        balance: Math.round((p.data.balance - rounded) * 100) / 100,
        activeBet: { amount: rounded, roundSeq: g.roundSeq },
      });
      ok = true;
    });
    return ok ? { ok: true } : { ok: false, reason };
  });
}

export async function cashOut(
  playerDocId: string,
): Promise<{ ok: true; mult: number; win: number } | { ok: false; reason: string }> {
  return withFirestoreRetry(async () => {
    let result:
      | { ok: true; mult: number; win: number }
      | { ok: false; reason: string } = { ok: false, reason: "Çekilemedi." };
    await runTransaction(getDb(), async (tx) => {
      const gSnap = await tx.get(gameRef());
      if (!gSnap.exists()) {
        result = { ok: false, reason: "Oyun hazır değil." };
        return;
      }
      const g = gSnap.data() as GameState;
      if (g.phase !== "flying" || !g.flyStartedAt || g.crashPoint == null) {
        result = { ok: false, reason: "Uçuş yok." };
        return;
      }
      const p = await readPlayer(tx, playerDocId);
      if (!p.data?.activeBet) {
        result = { ok: false, reason: "Aktif bahis yok." };
        return;
      }
      if (p.data.activeBet.roundSeq !== g.roundSeq) {
        result = { ok: false, reason: "Bu tur için bahis geçersiz." };
        return;
      }
      const now = Date.now();
      const multRaw = multiplierRawAtElapsedSeconds(
        (now - g.flyStartedAt) / 1000,
        g.crashPoint,
      );
      if (multRaw + 1e-9 >= g.crashPoint) {
        result = { ok: false, reason: "Tur bitti." };
        return;
      }
      const mult = multiplierAtElapsedSeconds(
        (now - g.flyStartedAt) / 1000,
        g.crashPoint,
      );
      const win = Math.round(p.data.activeBet.amount * mult * 100) / 100;
      const newBal = Math.round((p.data.balance + win) * 100) / 100;
      tx.update(p.ref, {
        balance: newBal,
        activeBet: null,
      });
      result = { ok: true, mult, win };
    });
    return result;
  });
}

export async function adjustPlayerBalance(
  playerDocId: string,
  delta: number,
): Promise<void> {
  await withFirestoreRetry(async () => {
    await runTransaction(getDb(), async (tx) => {
      const p = await readPlayer(tx, playerDocId);
      if (!p.data) {
        const start = Math.max(0, 10_000 + delta);
        tx.set(p.ref, {
          username: playerDocId,
          balance: Math.round(start * 100) / 100,
          activeBet: null,
          updatedAt: serverTimestamp(),
        });
        return;
      }
      if (p.data.activeBet) return;
      const next = Math.max(0, Math.round((p.data.balance + delta) * 100) / 100);
      tx.update(p.ref, {
        balance: next,
      });
    });
  });
}

export async function clearLostBetIfNeeded(
  playerDocId: string,
  roomRoundSeq: number,
): Promise<void> {
  await withFirestoreRetry(async () => {
    await runTransaction(getDb(), async (tx) => {
      const p = await readPlayer(tx, playerDocId);
      if (!p.data?.activeBet) return;
      if (p.data.activeBet.roundSeq >= roomRoundSeq) return;
      tx.update(p.ref, {
        activeBet: null,
      });
    });
  });
}

export function playerDocIdFromUsername(username: string): string {
  const t = username.trim();
  if (!t) return "misafir";
  return (
    t
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "oyuncu"
  );
}
