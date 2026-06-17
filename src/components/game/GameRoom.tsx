"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { onSnapshot } from "firebase/firestore";
import {
  cashOut,
  clearLostBetIfNeeded,
  currentFlyingMultiplier,
  ensureGameDocument,
  ensurePlayer,
  gameRefOf,
  placeBet,
  playerDocIdFromUsername,
  playerRefOf,
  tryEndFlyingRound,
  tryStartFlyingRound,
  type GameState,
  type PlayerState,
  adjustPlayerBalance,
} from "@/lib/game";
import {
  pushFeedBet,
  pushFeedBust,
  pushFeedCash,
  subscribeFeed,
  type FeedRow,
} from "@/lib/feed";
import { initAnalytics } from "@/lib/firebase";
import { FlightStage } from "@/components/game/FlightStage";
import { LiveDesk } from "@/components/game/LiveDesk";
import { multCrashPillAppearance } from "@/lib/multHeat";
import { multiplierRawAtElapsedSeconds } from "@/lib/multiplier";

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

type Props = {
  displayName: string;
};

export function GameRoom({ displayName }: Props) {
  const playerId = playerDocIdFromUsername(displayName);
  const [game, setGame] = useState<GameState | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [feed, setFeed] = useState<FeedRow[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [betInput, setBetInput] = useState("100");
  const [adjustInput, setAdjustInput] = useState("1000");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const gameRefState = useRef<GameState | null>(null);
  const prevPhase = useRef<GameState["phase"] | null>(null);
  const [crashFlash, setCrashFlash] = useState<number | null>(null);
  const flightOpRef = useRef({ starting: false, ending: false });
  const bustLoggedRef = useRef(new Set<string>());
  const [mobileBetOpen, setMobileBetOpen] = useState(false);
  const [liveDrawerOpen, setLiveDrawerOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    gameRefState.current = game;
  }, [game]);

  /** Ön planda rAF (akıcı), arka planda setInterval — başka sekmedeyken de süre/çarpan akar. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    let raf = 0;
    let iv = 0;
    const bump = () => setNow(Date.now());

    const startRaf = () => {
      clearInterval(iv);
      iv = 0;
      cancelAnimationFrame(raf);
      const loop = () => {
        bump();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    const startInterval = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      clearInterval(iv);
      bump();
      iv = window.setInterval(bump, 100);
    };

    const onVis = () => {
      bump();
      if (document.visibilityState === "hidden") startInterval();
      else startRaf();
    };

    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(raf);
      clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    return subscribeFeed(setFeed, 180);
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        await ensureGameDocument();
        await ensurePlayer(playerId, displayName);
        initAnalytics();
      } catch (e) {
        if (mounted) {
          console.error(e);
          showToast(
            "Bağlantı hatası — Firestore kurallarında `feed` izni ve internet bağlantısını kontrol edin.",
          );
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [displayName, playerId, showToast]);

  useEffect(() => {
    const gRef = gameRefOf();
    const u1 = onSnapshot(gRef, (snap) => {
      if (!snap.exists()) return;
      setGame(snap.data() as GameState);
    });
    const pRef = playerRefOf(playerId);
    const u2 = onSnapshot(pRef, (snap) => {
      if (!snap.exists()) return;
      setPlayer(snap.data() as PlayerState);
    });
    return () => {
      u1();
      u2();
    };
  }, [playerId]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const g = gameRefState.current;
      if (!g) return;
      const t = Date.now();
      if (g.phase === "betting" && t >= g.bettingEndsAt) {
        if (!flightOpRef.current.starting) {
          flightOpRef.current.starting = true;
          void tryStartFlyingRound().finally(() => {
            flightOpRef.current.starting = false;
          });
        }
      }
      if (
        g.phase === "flying" &&
        g.flyStartedAt &&
        g.crashPoint != null
      ) {
        const raw = multiplierRawAtElapsedSeconds(
          (t - g.flyStartedAt) / 1000,
          g.crashPoint,
        );
        if (raw + 1e-9 >= g.crashPoint && !flightOpRef.current.ending) {
          flightOpRef.current.ending = true;
          void tryEndFlyingRound().finally(() => {
            flightOpRef.current.ending = false;
          });
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!game || !player?.activeBet) return;
    if (
      game.phase === "betting" &&
      player.activeBet.roundSeq < game.roundSeq
    ) {
      const lostRound = player.activeBet.roundSeq;
      const key = `${playerId}@${lostRound}`;
      const amount = player.activeBet.amount;
      if (!bustLoggedRef.current.has(key)) {
        bustLoggedRef.current.add(key);
        void pushFeedBust(displayName, amount, lostRound);
      }
      void clearLostBetIfNeeded(playerId, game.roundSeq);
    }
  }, [
    game,
    player?.activeBet,
    game?.roundSeq,
    game?.phase,
    playerId,
    displayName,
  ]);

  useEffect(() => {
    if (!game) return;
    const prev = prevPhase.current;
    if (prev === "flying" && game.phase === "betting") {
      const c = game.history[0] ?? null;
      if (c != null) {
        setCrashFlash(c);
        window.setTimeout(() => setCrashFlash(null), 2600);
      }
    }
    prevPhase.current = game.phase;
  }, [game]);

  useEffect(() => {
    if (!mobileBetOpen && !liveDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileBetOpen(false);
        setLiveDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileBetOpen, liveDrawerOpen]);

  const multLive =
    game && game.phase === "flying" && game.crashPoint != null && game.flyStartedAt
      ? currentFlyingMultiplier(game, now)
      : null;

  const onBet = async () => {
    const amt = Number(betInput.replace(",", "."));
    const stake = Math.floor(amt * 100) / 100;
    const rs = game?.roundSeq;
    setBusy(true);
    const r = await placeBet(playerId, displayName, amt);
    setBusy(false);
    if (!r.ok) showToast(r.reason);
    else {
      showToast("Bahis alındı — iyi uçuşlar!");
      if (rs != null) void pushFeedBet(displayName, stake, rs);
    }
  };

  const onCash = async () => {
    const rs = game?.roundSeq;
    setBusy(true);
    const r = await cashOut(playerId);
    setBusy(false);
    if (!r.ok) showToast(r.reason);
    else {
      showToast(
        `Çekildi: ${formatMult(r.mult)}× → +${formatMoney(r.win)} TL`,
      );
      if (rs != null) void pushFeedCash(displayName, r.mult, r.win, rs);
    }
  };

  const onAdjust = async (sign: 1 | -1) => {
    const amt = Number(adjustInput.replace(",", "."));
    if (!Number.isFinite(amt) || amt <= 0) {
      showToast("Geçerli bir tutar girin.");
      return;
    }
    setBusy(true);
    await adjustPlayerBalance(playerId, sign * amt);
    setBusy(false);
  };

  const bal = player?.balance ?? 0;
  const hasBet = !!player?.activeBet;
  const canBet = game?.phase === "betting" && !hasBet && !busy;
  const canCash = game?.phase === "flying" && hasBet && !busy;

  const potentialCashout =
    hasBet && multLive != null && player?.activeBet
      ? Math.round(player.activeBet.amount * multLive * 100) / 100
      : null;

  return (
    <div className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-[#04070f] pt-[env(safe-area-inset-top,0px)] text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.4]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -15%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(99,102,241,0.14), transparent 45%)",
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden h-full min-h-0 w-full max-w-[320px] shrink-0 flex-col border-white/[0.05] bg-[#05060c]/95 shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)] backdrop-blur-sm xl:max-w-[340px] lg:flex lg:border-r">
          <LiveDesk rows={feed} />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="relative z-20 flex w-full shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] bg-[#050812]/90 px-3 py-2.5 backdrop-blur-xl sm:gap-4 sm:px-4 sm:py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => setLiveDrawerOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.05] text-zinc-200 transition active:bg-white/10 lg:hidden"
            aria-label="Canlı masa akışını aç"
            aria-expanded={liveDrawerOpen}
            aria-controls="live-desk-drawer"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 md:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 to-indigo-600/10 md:h-11 md:w-11">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 14c3-1 7-1 10 0 2.5.8 4.5 2.2 6 4"
                stroke="currentColor"
                strokeWidth="1.6"
                className="text-cyan-200"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-cyan-300/65 md:text-[10px]">
              Zeplin Pro
            </p>
            <h1 className="truncate text-sm font-semibold text-white md:text-base">
              {displayName}
              <span className="ml-2 hidden font-mono text-[11px] font-normal text-zinc-500 sm:inline">
                #{game?.roundSeq ?? "—"}
              </span>
            </h1>
          </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 backdrop-blur sm:px-3 md:px-4 md:py-2">
            <p className="text-[9px] uppercase tracking-wider text-zinc-500">
              Bakiye
            </p>
            <p className="font-money text-xs font-semibold tracking-tight text-emerald-300 sm:text-sm md:text-base">
              {formatMoney(bal)}
            </p>
          </div>
          <a
            href="/"
            onClick={() => {
              try {
                localStorage.removeItem("zeplin_display_name");
              } catch {
                /* ignore */
              }
            }}
            className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-cyan-500/35 hover:text-white md:px-3 md:text-xs"
          >
            Çıkış
          </a>
        </div>
      </header>

          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-3 pb-16 sm:px-4 sm:py-4 md:px-5 md:py-5 lg:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] [scrollbar-width:thin]">
          <div className="mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col gap-4 lg:max-w-none">
            {!!game?.history?.length && (
              <div className="w-full overflow-hidden">
                <div className="grid w-full grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2">
                  {game.history.slice(0, 10).map((h, i) => {
                    const pill = multCrashPillAppearance(h);
                    return (
                      <span
                        key={`${h}-${i}`}
                        className="flex min-h-[2.25rem] items-center justify-center rounded-xl border px-1 py-2 font-mono text-[10px] font-semibold tabular-nums leading-none sm:min-h-0 sm:rounded-full sm:px-2 sm:text-[11px]"
                        style={{
                          background: pill.background,
                          borderColor: pill.borderColor,
                          color: pill.color,
                          boxShadow: pill.boxShadow,
                        }}
                      >
                        {formatMult(h)}×
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col">
            <FlightStage
              game={game}
              multLive={multLive}
              now={now}
              crashFlash={crashFlash}
            />
            </div>

            <div className="shrink-0 space-y-2 lg:hidden">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-400/16 bg-emerald-950/25 p-3 shadow-[inset_0_1px_0_rgba(52,211,153,0.06)]">
                <button
                  type="button"
                  disabled={!canCash}
                  onClick={onCash}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/22 bg-gradient-to-r from-emerald-500/95 to-teal-600/90 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_-10px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.16)] transition enabled:hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>Kazancı çek</span>
                  <span className="rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums">
                    {multLive != null ? `${formatMult(multLive)}×` : "—"}
                  </span>
                </button>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                  <span>Tahmini ödeme</span>
                  <span
                    className={`font-money text-sm font-semibold tabular-nums tracking-tight ${
                      potentialCashout != null
                        ? "text-emerald-200"
                        : "text-zinc-600"
                    }`}
                  >
                    {potentialCashout != null
                      ? `+${formatMoney(potentialCashout)}`
                      : "—"}
                  </span>
                </div>
              </div>
              {hasBet && player?.activeBet && (
                <p className="text-xs text-zinc-500">
                  Stake{" "}
                  <span className="font-money font-semibold text-zinc-300">
                    {formatMoney(player.activeBet.amount)}
                  </span>
                </p>
              )}
            </div>

            <div className="hidden shrink-0 gap-4 lg:grid lg:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.065] bg-gradient-to-b from-zinc-900/75 via-zinc-950/[0.92] to-[#05070c] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_20px_44px_-22px_rgba(0,0,0,0.65)] backdrop-blur-xl md:p-5">
                <div
                  className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent"
                  aria-hidden
                />

                <div className="relative flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold tracking-tight text-white">
                    Bahis
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      game?.phase === "betting"
                        ? "bg-sky-500/14 text-sky-100 ring-1 ring-sky-400/20"
                        : "bg-amber-500/12 text-amber-100/95 ring-1 ring-amber-400/16"
                    }`}
                  >
                    {game?.phase === "betting" ? "Tur açık" : "Uçuş"}
                  </span>
                </div>
                <p className="relative mt-1 text-xs text-zinc-500">
                  Üst limit{" "}
                  <span className="font-money font-semibold text-zinc-300">
                    {formatMoney(bal)}
                  </span>
                </p>

                <div className="relative mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={betInput}
                    onChange={(e) => setBetInput(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-white/[0.09] bg-black/45 px-3 py-2.5 font-money text-sm tabular-nums text-zinc-100 shadow-[inset_0_1px_4px_rgba(0,0,0,0.35)] outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/35 focus:ring-2 focus:ring-cyan-500/15"
                    placeholder="500"
                  />
                  <button
                    type="button"
                    disabled={!canBet}
                    onClick={onBet}
                    className="rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-500 px-5 py-2.5 text-sm font-semibold tracking-tight text-zinc-950 shadow-[0_0_24px_-8px_rgba(34,211,238,0.5),inset_0_1px_0_rgba(255,255,255,0.35)] transition enabled:hover:brightness-[1.05] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Bahis yap
                  </button>
                </div>

                <div className="relative mt-3 overflow-hidden rounded-xl border border-emerald-400/16 bg-emerald-950/25 p-3">
                  <button
                    type="button"
                    disabled={!canCash}
                    onClick={onCash}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/22 bg-gradient-to-r from-emerald-500/95 to-teal-600/90 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_-10px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.16)] transition enabled:hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>Kazancı çek</span>
                    <span className="rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums">
                      {multLive != null ? `${formatMult(multLive)}×` : "—"}
                    </span>
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                    <span>Tahmini ödeme</span>
                    <span
                      className={`font-money text-sm font-semibold tabular-nums tracking-tight ${
                        potentialCashout != null
                          ? "text-emerald-200"
                          : "text-zinc-600"
                      }`}
                    >
                      {potentialCashout != null
                        ? `+${formatMoney(potentialCashout)}`
                        : "—"}
                    </span>
                  </div>
                </div>

                {hasBet && player?.activeBet && (
                  <p className="relative mt-2.5 text-xs text-zinc-500">
                    Stake{" "}
                    <span className="font-money font-semibold text-zinc-300">
                      {formatMoney(player.activeBet.amount)}
                    </span>
                  </p>
                )}
                <p className="relative mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Tek bahis / tur
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/[0.065] bg-gradient-to-b from-zinc-900/55 to-zinc-950/85 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_16px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl md:p-5">
                <div
                  className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
                  aria-hidden
                />
                <h2 className="text-sm font-semibold tracking-tight text-white">
                  Bakiye ayarı
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Bahis yokken TL ekleyin veya düşürün.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={adjustInput}
                    onChange={(e) => setAdjustInput(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-white/[0.09] bg-black/40 px-3 py-2.5 font-money text-sm tabular-nums text-zinc-100 shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)] outline-none transition focus:border-indigo-400/35 focus:ring-2 focus:ring-indigo-500/15"
                  />
                  <button
                    type="button"
                    disabled={busy || hasBet}
                    onClick={() => void onAdjust(1)}
                    className="rounded-xl border border-white/[0.1] bg-white/[0.07] px-3.5 py-2.5 text-lg font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/12 disabled:opacity-40"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    disabled={busy || hasBet}
                    onClick={() => void onAdjust(-1)}
                    className="rounded-xl border border-white/[0.1] bg-white/[0.07] px-3.5 py-2.5 text-lg font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/12 disabled:opacity-40"
                  >
                    −
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        </div>

        <aside className="hidden h-full min-h-0 w-full max-w-[300px] shrink-0 flex-col border-white/[0.06] bg-[#060912]/95 lg:flex lg:border-l">
          <div className="shrink-0 border-b border-white/[0.06] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Geçmiş
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-200">
              Son çarpanlar
            </p>
          </div>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
            {(game?.history?.length ? game.history : []).map((h, i) => {
              const pill = multCrashPillAppearance(h);
              return (
                <li
                  key={`${h}-${i}`}
                  className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm"
                  style={{
                    background: pill.background,
                    borderColor: pill.borderColor,
                    boxShadow: pill.boxShadow,
                  }}
                >
                  <span className="text-[10px] text-white/45">#{i + 1}</span>
                  <span
                    className="font-mono text-[15px] font-semibold tabular-nums"
                    style={{ color: pill.color }}
                  >
                    {formatMult(h)}×
                  </span>
                </li>
              );
            })}
            {!game?.history?.length && (
              <li className="rounded-xl border border-dashed border-white/10 px-3 py-10 text-center text-xs text-zinc-500">
                Henüz tur yok.
              </li>
            )}
          </ul>
        </aside>
      </div>

      {liveDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[91] bg-black/50 backdrop-blur-[1px] lg:hidden"
            onClick={() => setLiveDrawerOpen(false)}
            role="presentation"
            aria-hidden
          />
          <div
            id="live-desk-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="live-desk-drawer-title"
            className="fixed left-0 top-0 z-[92] flex h-dvh w-[min(90vw,320px)] flex-col border-r border-white/[0.08] bg-[#06080f] pt-[env(safe-area-inset-top,0px)] shadow-2xl lg:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5">
              <p
                id="live-desk-drawer-title"
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400"
              >
                Canlı masa
              </p>
              <button
                type="button"
                onClick={() => setLiveDrawerOpen(false)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                aria-label="Kapat"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <LiveDesk rows={feed} />
            </div>
          </div>
        </>
      )}

      {mobileBetOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileBetOpen(false)}
          role="presentation"
          aria-hidden
        />
      )}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="pointer-events-auto mx-auto flex w-full max-w-[1100px] flex-col rounded-t-2xl border border-white/10 border-b-0 bg-[#0c101a]/98 shadow-[0_-12px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {mobileBetOpen && (
            <div
              id="mobile-bahis-panel"
              className="max-h-[min(58dvh,520px)] overflow-y-auto overscroll-y-contain px-4 pb-3 pt-4"
            >
              <div className="relative overflow-hidden rounded-xl border border-white/[0.065] bg-gradient-to-b from-zinc-900/75 to-zinc-950/95 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold tracking-tight text-white">
                    Bahis
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      game?.phase === "betting"
                        ? "bg-sky-500/14 text-sky-100 ring-1 ring-sky-400/20"
                        : "bg-amber-500/12 text-amber-100/95 ring-1 ring-amber-400/16"
                    }`}
                  >
                    {game?.phase === "betting" ? "Tur açık" : "Uçuş"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Üst limit{" "}
                  <span className="font-money font-semibold text-zinc-300">
                    {formatMoney(bal)}
                  </span>
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={betInput}
                    onChange={(e) => setBetInput(e.target.value)}
                    className="min-w-0 rounded-xl border border-white/[0.09] bg-black/45 px-3 py-2.5 font-money text-sm tabular-nums text-zinc-100 shadow-[inset_0_1px_4px_rgba(0,0,0,0.35)] outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/35 focus:ring-2 focus:ring-cyan-500/15"
                    placeholder="500"
                  />
                  <button
                    type="button"
                    disabled={!canBet}
                    onClick={onBet}
                    className="rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-500 px-5 py-2.5 text-sm font-semibold tracking-tight text-zinc-950 shadow-[0_0_24px_-8px_rgba(34,211,238,0.5),inset_0_1px_0_rgba(255,255,255,0.35)] transition enabled:hover:brightness-[1.05] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Bahis yap
                  </button>
                </div>
                {hasBet && player?.activeBet && (
                  <p className="mt-2.5 text-xs text-zinc-500">
                    Stake{" "}
                    <span className="font-money font-semibold text-zinc-300">
                      {formatMoney(player.activeBet.amount)}
                    </span>
                  </p>
                )}
                <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Tek bahis / tur
                </p>
              </div>
              <div className="relative mt-3 overflow-hidden rounded-xl border border-white/[0.065] bg-gradient-to-b from-zinc-900/55 to-zinc-950/85 p-4">
                <h2 className="text-sm font-semibold tracking-tight text-white">
                  Bakiye ayarı
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Bahis yokken TL ekleyin veya düşürün.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={adjustInput}
                    onChange={(e) => setAdjustInput(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-white/[0.09] bg-black/40 px-3 py-2.5 font-money text-sm tabular-nums text-zinc-100 shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)] outline-none transition focus:border-indigo-400/35 focus:ring-2 focus:ring-indigo-500/15"
                  />
                  <button
                    type="button"
                    disabled={busy || hasBet}
                    onClick={() => void onAdjust(1)}
                    className="rounded-xl border border-white/[0.1] bg-white/[0.07] px-3.5 py-2.5 text-lg font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/12 disabled:opacity-40"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    disabled={busy || hasBet}
                    onClick={() => void onAdjust(-1)}
                    className="rounded-xl border border-white/[0.1] bg-white/[0.07] px-3.5 py-2.5 text-lg font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/12 disabled:opacity-40"
                  >
                    −
                  </button>
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileBetOpen((o) => !o)}
            aria-expanded={mobileBetOpen}
            aria-controls="mobile-bahis-panel"
            id="mobile-bahis-toggle"
            className="flex w-full items-center justify-center gap-3 border-t border-white/[0.08] bg-[#101722] px-4 py-3.5 text-zinc-200 active:bg-white/[0.04]"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              {mobileBetOpen ? "Kapat" : "Bahis"}
            </span>
            {mobileBetOpen ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="text-zinc-300"
                aria-hidden
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="text-zinc-300"
                aria-hidden
              >
                <path
                  d="M6 15l6-6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] left-1/2 z-[110] w-[min(92vw,400px)] -translate-x-1/2 rounded-xl border border-white/10 bg-[#0a0f1e]/95 px-4 py-3 text-center text-sm text-zinc-100 shadow-xl backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}
