"use client";

import { useMemo } from "react";
import type { FeedRow } from "@/lib/feed";

function formatMoney(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatMult(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function timeLabel(createdAt: FeedRow["createdAt"]) {
  if (!createdAt?.toDate) return "—";
  const d = createdAt.toDate();
  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

type Props = {
  rows: FeedRow[];
};

const rowAccent: Record<FeedRow["kind"], { bar: string; meta: string }> = {
  bet: { bar: "bg-sky-400/80", meta: "text-sky-400/70" },
  cash: { bar: "bg-emerald-400/85", meta: "text-emerald-400/70" },
  bust: { bar: "bg-rose-400/80", meta: "text-rose-400/70" },
};

export function LiveDesk({ rows }: Props) {
  const stats = useMemo(() => {
    let cashed = 0;
    let lost = 0;
    let cashN = 0;
    let bustN = 0;
    let betN = 0;
    const windowRows = rows.slice(0, 200);
    for (const r of windowRows) {
      if (r.kind === "cash" && r.payout != null) {
        cashed += r.payout;
        cashN += 1;
      }
      if (r.kind === "bust" && r.amount != null) {
        lost += r.amount;
        bustN += 1;
      }
      if (r.kind === "bet") betN += 1;
    }
    return {
      cashed,
      lost,
      cashN,
      bustN,
      betN,
      net: cashed - lost,
    };
  }, [rows]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#06080f]">
      <header className="shrink-0 border-b border-white/[0.06] px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-medium tracking-tight text-zinc-100">
              Akış
            </h2>
            <p className="mt-0.5 text-[10px] font-medium tracking-wide text-zinc-600">
              Masa etkinliği
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]"
              aria-hidden
            />
            <span className="text-[10px] font-medium tracking-wide text-zinc-500">
              Canlı
            </span>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-px rounded-lg bg-white/[0.06] p-px">
          <div className="rounded-[7px] bg-[#0a0d14] px-2.5 py-2">
            <dt className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">
              Çekilen
            </dt>
            <dd className="font-money mt-1 truncate text-[12px] font-medium tabular-nums leading-none tracking-tight text-zinc-200">
              {formatMoney(stats.cashed)}
            </dd>
            <dd className="mt-1 text-[9px] tabular-nums text-zinc-600">
              {stats.cashN} işlem
            </dd>
          </div>
          <div className="rounded-[7px] bg-[#0a0d14] px-2.5 py-2">
            <dt className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">
              Kayıp
            </dt>
            <dd className="font-money mt-1 truncate text-[12px] font-medium tabular-nums leading-none tracking-tight text-zinc-200">
              {formatMoney(stats.lost)}
            </dd>
            <dd className="mt-1 text-[9px] tabular-nums text-zinc-600">
              {stats.bustN} işlem
            </dd>
          </div>
          <div className="rounded-[7px] bg-[#0a0d14] px-2.5 py-2">
            <dt className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">
              Net
            </dt>
            <dd
              className={`font-money mt-1 truncate text-[12px] font-medium tabular-nums leading-none tracking-tight ${
                stats.net >= 0 ? "text-zinc-100" : "text-amber-200/90"
              }`}
            >
              {stats.net >= 0 ? "+" : ""}
              {formatMoney(stats.net)}
            </dd>
            <dd className="mt-1 text-[9px] tabular-nums text-zinc-600">
              {stats.betN} bahis
            </dd>
          </div>
        </dl>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(63,63,70,0.35)_transparent]">
        <div className="px-2 py-2">
          {rows.length === 0 ? (
            <div className="mx-2 rounded-lg border border-dashed border-white/[0.07] px-4 py-14 text-center">
              <p className="text-[11px] font-medium text-zinc-500">
                Kayıt yok
              </p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-600">
                Bahis ve çekimler burada listelenir.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {rows.map((r) => {
                const accent = rowAccent[r.kind];
                if (r.kind === "bet") {
                  return (
                    <li
                      key={r.id}
                      className="group border-b border-white/[0.04] last:border-b-0"
                    >
                      <div className="flex gap-0">
                        <div
                          className={`w-0.5 shrink-0 self-stretch rounded-full ${accent.bar}`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1 px-3 py-2.5 transition-colors group-hover:bg-white/[0.02]">
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-[12px] font-medium text-zinc-200">
                              {r.user}
                            </p>
                            <p className="font-money shrink-0 text-[12px] font-medium tabular-nums tracking-tight text-zinc-300">
                              {formatMoney(r.amount ?? 0)}
                            </p>
                          </div>
                          <p className="mt-1 text-[10px] tabular-nums text-zinc-600">
                            <span className={accent.meta}>Bahis</span>
                            <span className="mx-1.5 text-zinc-700">·</span>
                            Tur {r.roundSeq}
                            <span className="mx-1.5 text-zinc-700">·</span>
                            {timeLabel(r.createdAt)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                }
                if (r.kind === "cash") {
                  return (
                    <li
                      key={r.id}
                      className="group border-b border-white/[0.04] last:border-b-0"
                    >
                      <div className="flex gap-0">
                        <div
                          className={`w-0.5 shrink-0 self-stretch rounded-full ${accent.bar}`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1 px-3 py-2.5 transition-colors group-hover:bg-white/[0.02]">
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-[12px] font-medium text-zinc-200">
                              {r.user}
                            </p>
                            <p className="font-money shrink-0 text-[12px] font-medium tabular-nums tracking-tight text-emerald-200/90">
                              +{formatMoney(r.payout ?? 0)}
                            </p>
                          </div>
                          <p className="mt-1 text-[10px] tabular-nums text-zinc-600">
                            <span className={accent.meta}>Çekim</span>
                            <span className="mx-1.5 text-zinc-700">·</span>
                            {formatMult(r.mult ?? 0)}×
                            <span className="mx-1.5 text-zinc-700">·</span>
                            Tur {r.roundSeq}
                            <span className="mx-1.5 text-zinc-700">·</span>
                            {timeLabel(r.createdAt)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                }
                return (
                  <li
                    key={r.id}
                    className="group border-b border-white/[0.04] last:border-b-0"
                  >
                    <div className="flex gap-0">
                      <div
                        className={`w-0.5 shrink-0 self-stretch rounded-full ${accent.bar}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 px-3 py-2.5 transition-colors group-hover:bg-white/[0.02]">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate text-[12px] font-medium text-zinc-200">
                            {r.user}
                          </p>
                          <p className="font-money shrink-0 text-[12px] font-medium tabular-nums tracking-tight text-rose-200/90">
                            −{formatMoney(r.amount ?? 0)}
                          </p>
                        </div>
                        <p className="mt-1 text-[10px] tabular-nums text-zinc-600">
                          <span className={accent.meta}>Patlama</span>
                          <span className="mx-1.5 text-zinc-700">·</span>
                          Tur {r.roundSeq}
                          <span className="mx-1.5 text-zinc-700">·</span>
                          {timeLabel(r.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
