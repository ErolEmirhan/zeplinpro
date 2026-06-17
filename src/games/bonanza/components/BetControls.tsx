"use client";

import { BET_OPTIONS } from "../types";

type Props = {
  bet: number;
  setBet: (n: number) => void;
  disabled: boolean;
};

export function BetControls({ bet, setBet, disabled }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300/70">
        Bahis Seç
      </p>
      <div className="grid grid-cols-4 gap-2">
        {BET_OPTIONS.map((b) => (
          <button
            key={b}
            type="button"
            disabled={disabled}
            onClick={() => setBet(b)}
            className={`rounded-xl border px-1 py-2.5 font-money text-xs font-semibold transition sm:text-sm ${
              bet === b
                ? "border-pink-400/60 bg-pink-500/25 text-pink-100 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                : "border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-white"
            } disabled:opacity-40`}
          >
            {b >= 1000 ? `${b / 1000}K` : b}
          </button>
        ))}
      </div>
    </div>
  );
}
