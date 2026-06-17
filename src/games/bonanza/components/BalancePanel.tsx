"use client";

import { GlassPanel } from "./GlassPanel";

type Props = {
  balance: number;
  bet: number;
  lastWin: number;
  formatCoins: (n: number) => string;
};

export function BalancePanel({ balance, bet, lastWin, formatCoins }: Props) {
  return (
    <div className="space-y-3">
      <GlassPanel title="Bakiye">
        <p className="font-money text-2xl font-bold text-emerald-300 sm:text-3xl">
          {formatCoins(balance)}
        </p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500">
          Sanal TL · eğlence amaçlı
        </p>
      </GlassPanel>
      <GlassPanel title="Bahis">
        <p className="font-money text-xl font-semibold text-pink-200">
          {formatCoins(bet)}
        </p>
      </GlassPanel>
      {lastWin > 0 && (
        <GlassPanel title="Son Kazanç">
          <p className="font-money text-xl font-bold text-amber-300">
            +{formatCoins(lastWin)}
          </p>
        </GlassPanel>
      )}
    </div>
  );
}
