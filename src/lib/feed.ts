import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export type FeedKind = "bet" | "cash" | "bust";

export type FeedRow = {
  id: string;
  kind: FeedKind;
  user: string;
  amount?: number;
  mult?: number;
  payout?: number;
  roundSeq: number;
  createdAt: Timestamp | null;
};

function feedCollection() {
  return collection(getDb(), "games", "zeplin_odasi", "feed");
}

export function subscribeFeed(
  onRows: (rows: FeedRow[]) => void,
  max = 160,
): () => void {
  const q = query(
    feedCollection(),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  return onSnapshot(q, (snap) => {
    const rows: FeedRow[] = snap.docs.map((d) => {
      const x = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        kind: x.kind as FeedKind,
        user: String(x.user ?? "?"),
        amount: typeof x.amount === "number" ? x.amount : undefined,
        mult: typeof x.mult === "number" ? x.mult : undefined,
        payout: typeof x.payout === "number" ? x.payout : undefined,
        roundSeq: typeof x.roundSeq === "number" ? x.roundSeq : 0,
        createdAt: (x.createdAt as Timestamp) ?? null,
      };
    });
    onRows(rows);
  });
}

export async function pushFeedBet(
  user: string,
  amount: number,
  roundSeq: number,
): Promise<void> {
  await addDoc(feedCollection(), {
    kind: "bet",
    user,
    amount,
    roundSeq,
    createdAt: serverTimestamp(),
  });
}

export async function pushFeedCash(
  user: string,
  mult: number,
  payout: number,
  roundSeq: number,
): Promise<void> {
  await addDoc(feedCollection(), {
    kind: "cash",
    user,
    mult,
    payout,
    roundSeq,
    createdAt: serverTimestamp(),
  });
}

export async function pushFeedBust(
  user: string,
  lostAmount: number,
  roundSeq: number,
): Promise<void> {
  await addDoc(feedCollection(), {
    kind: "bust",
    user,
    amount: lostAmount,
    roundSeq,
    createdAt: serverTimestamp(),
  });
}
