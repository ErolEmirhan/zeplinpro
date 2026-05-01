import { type FirestoreError } from "firebase/firestore";

const RETRYABLE = new Set([
  "failed-precondition",
  "aborted",
  "resource-exhausted",
  "unavailable",
]);

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withFirestoreRetry<T>(fn: () => Promise<T>, max = 10): Promise<T> {
  let last: unknown;
  for (let i = 0; i < max; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const code = (e as FirestoreError)?.code;
      if (code && RETRYABLE.has(code)) {
        const backoff = 40 * 2 ** i + Math.random() * 60;
        await delay(Math.min(backoff, 2500));
        continue;
      }
      throw e;
    }
  }
  throw last;
}
