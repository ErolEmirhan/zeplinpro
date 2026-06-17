"use client";

import type { SessionStats, SpinHistoryEntry } from "../types";
import { GlassPanel } from "./GlassPanel";

type Props = {
  stats: SessionStats | null;
  derived: { rtp: number; hitRate: number; sessionProfit: number } | null;
  history: SpinHistoryEntry[];
  formatCoins: (n: number) => string;
};

export function StatsPanel({ stats, derived, history, formatCoins }: Props) {
  if (!stats || !derived) return null;

  const rows = [
    { label: "Toplam Spin", value: String(stats.totalSpins) },
    { label: "Kazanç", value: String(stats.wins) },
    { label: "Kayıp", value: String(stats.losses) },
    { label: "RTP", value: `%${derived.rtp.toFixed(1)}` },
    { label: "İsabet", value: `%${derived.hitRate.toFixed(1)}` },
    { label: "En Büyük", value: formatCoins(stats.largestWin) },
    {
      label: "Oturum",
      value: `${derived.sessionProfit >= 0 ? "+" : ""}${formatCoins(derived.sessionProfit)}`,
      accent: derived.sessionProfit >= 0 ? "text-emerald-300" : "text-rose-300",
    },
  ];

  return (
    <div className="space-y-3">
      <GlassPanel title="İstatistikler">
        <dl className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between text-sm">
              <dt className="text-zinc-500">{r.label}</dt>
              <dd className={`font-money font-semibold ${r.accent ?? "text-zinc-100"}`}>
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </GlassPanel>

      {history.length > 0 && (
        <GlassPanel title="Geçmiş">
          <ul className="max-h-44 space-y-1.5 overflow-y-auto text-xs [scrollbar-width:thin]">
            {history.slice(0, 10).map((h) => (
              <li
                key={h.id}
                className="flex justify-between rounded-xl bg-black/25 px-2.5 py-2"
              >
                <span className="text-zinc-500">
                  {formatCoins(h.bet)}
                  {h.multiplier > 1 && (
                    <span className="ml-1 text-amber-400/90">×{h.multiplier}</span>
                  )}
                </span>
                <span
                  className={`font-money font-semibold ${h.win > 0 ? "text-emerald-300" : "text-zinc-600"}`}
                >
                  {h.win > 0 ? `+${formatCoins(h.win)}` : "—"}
                </span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}
    </div>
  );
}
