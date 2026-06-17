"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type CardState = {
  id: number;
  revealed: boolean;
  isBomb: boolean;
  revealedIndex?: number;
};

type GamePhase = "betting" | "playing" | "lost" | "won";

type HistoryItem = {
  win: boolean;
  multiplier: number;
  bet: number;
};

// ULTRA MATHEMATICAL EXPONENTIAL MULTIPLIER SERIES
const MULTIPLIERS = [
  1.05, 1.28, 1.62, 2.12, 2.88, 4.02, 5.78, 8.42, 
  12.58, 19.42, 30.68, 49.32, 81.25, 137.60, 238.45, 423.10,
  774.80, 1475.20, 2900.50, 5950.00, 12800.00, 29000.00, 72000.00, 250000.00
];

export default function PatladinGame() {
  const [balance, setBalance] = useState<number>(100000);
  const [betAmount, setBetAmount] = useState<string>("1000");
  const [cards, setCards] = useState<CardState[]>([]);
  const [bombIndex, setBombIndex] = useState<number>(-1);
  const [phase, setPhase] = useState<GamePhase>("betting");
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [muted, setMuted] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [screenFlash, setScreenFlash] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize cards
  useEffect(() => {
    resetBoard();
  }, []);

  // Sync balance storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bonanza_session_v1");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.balance === "number") {
            setBalance(parsed.balance);
          }
        } catch (e) {
          console.error("Storage load error:", e);
        }
      }
    }
  }, []);

  const updatePersistentBalance = useCallback((updater: (prev: number) => number) => {
    setBalance(prev => {
      const next = updater(prev);
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("bonanza_session_v1");
        let parsed: any = {};
        if (saved) {
          try {
            parsed = JSON.parse(saved);
          } catch (e) {}
        }
        parsed.balance = next;
        localStorage.setItem("bonanza_session_v1", JSON.stringify(parsed));
      }
      return next;
    });
  }, []);

  // --- AUDIO SYNTH ENGINE FOR PWA COMPATIBILITY ---
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      // Silent buffer play to force unlock iOS/Safari
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.warn("Failed to init AudioContext:", e);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("click", initAudioContext);
    window.addEventListener("touchstart", initAudioContext);
    return () => {
      window.removeEventListener("click", initAudioContext);
      window.removeEventListener("touchstart", initAudioContext);
    };
  }, [initAudioContext]);

  const playSound = useCallback((type: "click" | "success" | "explosion" | "cashout") => {
    if (muted) return;
    try {
      initAudioContext();
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === "suspended") return;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "explosion") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.6);
        gainNode.gain.setValueAtTime(0.65, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(60, ctx.currentTime);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        gain2.gain.setValueAtTime(0.85, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      } else if (type === "cashout") {
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(freq, now + index * 0.08);
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.3, now + index * 0.08);
          g.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.2);
          o.start(now + index * 0.08);
          o.stop(now + index * 0.08 + 0.2);
        });
      }
    } catch (e) {
      console.warn("PlaySound error:", e);
    }
  }, [muted, initAudioContext]);

  // Board resets
  const resetBoard = () => {
    setCards(
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        revealed: false,
        isBomb: false
      }))
    );
    setBombIndex(-1);
    setRevealedCount(0);
  };

  const handleStartGame = () => {
    setErrorMsg(null);
    const parsedBet = Math.floor(parseFloat(betAmount));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      setErrorMsg("Lütfen geçerli bir bahis tutarı girin.");
      return;
    }
    if (balance < parsedBet) {
      setErrorMsg("Bakiye yetersiz.");
      return;
    }

    // Deduct balance
    updatePersistentBalance(prev => prev - parsedBet);

    // Setup single random bomb
    const bombIdx = Math.floor(Math.random() * 25);
    setBombIndex(bombIdx);
    setRevealedCount(0);
    setPhase("playing");
    setCards(
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        revealed: false,
        isBomb: i === bombIdx
      }))
    );
    playSound("click");
  };

  const handleCardClick = (id: number) => {
    if (phase !== "playing") return;
    const clickedCard = cards[id];
    if (clickedCard.revealed) return;

    // Set revealed state with current sequence index
    setCards(prev =>
      prev.map(c => (c.id === id ? { ...c, revealed: true, revealedIndex: revealedCount } : c))
    );

    if (clickedCard.isBomb) {
      // Hit bomb
      setPhase("lost");
      setScreenFlash(true);
      setScreenShake(true);
      playSound("explosion");
      setTimeout(() => {
        setScreenFlash(false);
        setScreenShake(false);
      }, 500);

      // Reveal all cards
      setCards(prev => prev.map(c => ({ ...c, revealed: true })));

      const parsedBet = Math.floor(parseFloat(betAmount));
      setHistory(prev => [
        { win: false, multiplier: 0, bet: parsedBet },
        ...prev.slice(0, 9)
      ]);
    } else {
      // Hit safe card
      const newCount = revealedCount + 1;
      setRevealedCount(newCount);
      playSound("success");

      // Auto cash out if all 24 green cards are found
      if (newCount === 24) {
        const parsedBet = Math.floor(parseFloat(betAmount));
        const finalMult = MULTIPLIERS[23];
        const winAmt = Math.floor(parsedBet * finalMult);
        updatePersistentBalance(prev => prev + winAmt);
        setPhase("won");
        setCards(prev => prev.map(c => ({ ...c, revealed: true })));
        playSound("cashout");
        setHistory(prev => [
          { win: true, multiplier: finalMult, bet: parsedBet },
          ...prev.slice(0, 9)
        ]);
      }
    }
  };

  const handleCashOut = () => {
    if (phase !== "playing" || revealedCount === 0) return;

    const parsedBet = Math.floor(parseFloat(betAmount));
    const currentMult = MULTIPLIERS[revealedCount - 1];
    const winAmt = Math.floor(parsedBet * currentMult);

    updatePersistentBalance(prev => prev + winAmt);
    setPhase("won");
    setCards(prev => prev.map(c => ({ ...c, revealed: true })));
    playSound("cashout");
    setHistory(prev => [
      { win: true, multiplier: currentMult, bet: parsedBet },
      ...prev.slice(0, 9)
    ]);
  };

  const handleNewGame = () => {
    resetBoard();
    setPhase("betting");
    playSound("click");
  };

  const nextMultiplier = MULTIPLIERS[revealedCount] ?? MULTIPLIERS[23];
  const currentMultiplier = revealedCount > 0 ? MULTIPLIERS[revealedCount - 1] : 0;
  const currentWin = Math.floor(parseFloat(betAmount) * currentMultiplier);

  return (
    <div className={`relative flex min-h-dvh flex-col bg-[#06040e] text-zinc-100 transition-all duration-300 ${screenShake ? "animate-bounce" : ""}`}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(244,63,94,0.08), transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(16,185,129,0.06), transparent 50%)' }} />

      {/* Screen flash on explosion */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-50 bg-red-600/35 mix-blend-color-dodge backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <header className="relative z-10 border-b border-white/[0.05] bg-black/40 px-4 py-4 backdrop-blur-2xl sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onClick={() => playSound("click")}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-pink-500/30 hover:text-white"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Oyunlar
            </Link>
            <div className="hidden sm:block h-5 w-px bg-white/[0.06]" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-pink-400/80">Patladın Kanka</p>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>Mayın Tarlası</span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMuted(!muted)}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-zinc-500 transition hover:text-white hover:border-white/[0.12]"
            >
              {muted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 9H1.5v6h3l4.5 3.75V5.25z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 px-3.5 py-1.5 backdrop-blur-md">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/70">Bakiye</span>
              <span className="font-mono text-sm font-bold text-emerald-300">
                {balance.toLocaleString("tr-TR")}
              </span>
              <span className="text-[9px] text-emerald-500/60 font-semibold">TL</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:py-10">
        
        {/* CONTROL SIDEBAR PANEL */}
        <section className="flex w-full flex-col gap-5 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl md:w-80 shrink-0">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Bahis Paneli</h2>
            <p className="text-[11px] text-zinc-600 mt-1">Mayınsız kartları bularak kasayı katla.</p>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2 text-xs font-semibold text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Bet Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Bahis Tutarı</label>
            <div className="relative">
              <input
                type="number"
                disabled={phase === "playing"}
                value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm font-bold text-white outline-none focus:border-pink-500/50 disabled:opacity-50"
              />
              <span className="absolute right-4 top-3.5 text-xs text-zinc-500 font-bold">TL</span>
            </div>

            {/* Quick selectors */}
            {phase !== "playing" && (
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                <button
                  onClick={() => setBetAmount("100")}
                  className="rounded-lg bg-white/[0.04] hover:bg-white/[0.08] py-1 text-[10px] font-black transition"
                >
                  100
                </button>
                <button
                  onClick={() => setBetAmount((prev) => String(Math.floor(parseFloat(prev || "0") * 2)))}
                  className="rounded-lg bg-white/[0.04] hover:bg-white/[0.08] py-1 text-[10px] font-black transition"
                >
                  2X
                </button>
                <button
                  onClick={() => setBetAmount((prev) => String(Math.max(10, Math.floor(parseFloat(prev || "0") / 2))))}
                  className="rounded-lg bg-white/[0.04] hover:bg-white/[0.08] py-1 text-[10px] font-black transition"
                >
                  1/2
                </button>
                <button
                  onClick={() => setBetAmount(String(Math.floor(balance)))}
                  className="rounded-lg bg-white/[0.04] hover:bg-pink-900/20 py-1 text-[10px] font-black text-pink-400 transition"
                >
                  MAX
                </button>
              </div>
            )}
          </div>

          {/* Current multiplier status */}
          {phase === "playing" && revealedCount > 0 && (
            <div className="rounded-2xl bg-zinc-900/50 border border-white/5 p-4.5 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-bold">Mevcut Çarpan</span>
                <span className="font-mono font-black text-emerald-400">x{currentMultiplier.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-bold">Mevcut Kazanç</span>
                <span className="font-mono font-black text-emerald-400">{currentWin.toLocaleString("tr-TR")} TL</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
                <span className="text-zinc-500 font-bold">Sıradaki Çarpan</span>
                <span className="font-mono font-black text-pink-400">x{nextMultiplier.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Main Action Button */}
          {phase === "betting" ? (
            <button
              onClick={handleStartGame}
              className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-[0.98] py-3.5 font-black text-white text-sm shadow-lg border border-white/10 transition"
            >
              OYUNA BAŞLA
            </button>
          ) : phase === "playing" ? (
            <button
              onClick={handleCashOut}
              disabled={revealedCount === 0}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 active:scale-[0.98] py-3.5 font-black text-slate-950 text-sm shadow-lg border border-white/20 transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {revealedCount === 0 ? "BİR KUTU SEÇ" : "PARAYI ÇEK"}
            </button>
          ) : (
            <button
              onClick={handleNewGame}
              className="w-full rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] py-3.5 font-black text-white text-sm border border-white/5 transition"
            >
              YENİ OYUN BAŞLAT
            </button>
          )}

          {/* Game Stats */}
          <div className="mt-2 text-center text-[10px] leading-relaxed text-zinc-600">
            5×5 ızgarada 24 yeşil elmas, 1 kırmızı bomba bulunur.<br />
            Her yeşilde çarpan katlanır, bombada oyun biter.
          </div>
        </section>

        {/* 5x5 BOARD GRID VIEW */}
        <section className="flex-1 flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl min-h-[400px]">
          
          {/* MOBILE REAL-TIME POTENTIAL CASHOUT WIDGET (Directly visible next to board on tap) */}
          {phase === "playing" && revealedCount > 0 && (
            <div className="w-full max-w-[420px] mb-4 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-950/35 px-4.5 py-3 backdrop-blur-md shadow-lg md:hidden">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400/80">MEVCUT BAKİYEN (ÇEKERSEN)</span>
                <span className="font-mono text-sm font-black text-emerald-300">
                  {currentWin.toLocaleString("tr-TR")} <span className="text-[10px] text-emerald-400">TL</span>
                </span>
                <span className="text-[9px] font-bold text-zinc-400 mt-0.5">Sıradaki: x{nextMultiplier.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCashOut}
                className="rounded-xl bg-emerald-400 hover:bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 shadow-md transition active:scale-95"
              >
                PARAYI ÇEK
              </button>
            </div>
          )}

          {phase === "betting" && (
            <div className="absolute z-20 pointer-events-none flex flex-col items-center justify-center bg-black/75 rounded-2xl px-5 py-4.5 border border-white/5 backdrop-blur-sm">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">Kilitli</span>
              <span className="text-[11px] text-zinc-500">Bahis girip "Oyuna Başla" butonuna basın.</span>
            </div>
          )}

          <div className={`grid grid-cols-5 gap-3 max-w-[420px] w-full aspect-square transition-all duration-300 ${phase === "betting" ? "opacity-35 blur-[1px]" : ""}`}>
            {cards.map((card) => {
              let cardStyle = "border-white/10 bg-white/[0.03] hover:border-pink-500/40 hover:bg-white/[0.06]";
              let content = null;

              if (card.revealed) {
                if (card.isBomb) {
                  cardStyle = "border-red-500/40 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.25)]";
                  content = (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                      className="flex items-center justify-center text-red-500"
                    >
                      <svg className="w-10 h-10 animate-pulse text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="14" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                        <rect x="10.5" y="6.5" width="3" height="2" rx="0.5" fill="#f87171" stroke="#ffffff" strokeWidth="1" />
                        <path d="M12 6.5 Q 14 3.5, 17 4.5" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" fill="none" />
                        <circle cx="17.5" cy="4.5" r="1.5" fill="#facc15" />
                        <path d="M17.5 1.5 L17.5 3 M20.5 4.5 L19 4.5 M19.5 6.5 L18.5 5.5" stroke="#facc15" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </motion.div>
                  );
                } else {
                  cardStyle = "border-emerald-500/40 bg-emerald-950/25 shadow-[0_0_20px_rgba(16,185,129,0.25)]";
                  const itemMult = card.revealedIndex !== undefined ? MULTIPLIERS[card.revealedIndex] : 1.0;
                  content = (
                    <motion.div
                      initial={{ scale: 0, y: 5 }}
                      animate={{ scale: 1, y: 0 }}
                      className="flex flex-col items-center justify-center text-emerald-400"
                    >
                      <span className="text-[12px] font-black tracking-tight leading-none">x{itemMult.toFixed(2)}</span>
                      <span className="text-[7.5px] text-emerald-500/80 font-black uppercase mt-1 tracking-wider">KAZANDIN</span>
                    </motion.div>
                  );
                }
              }

              return (
                <button
                  key={card.id}
                  disabled={phase !== "playing" || card.revealed}
                  onClick={() => handleCardClick(card.id)}
                  className={`relative flex items-center justify-center rounded-2xl border transition-all duration-300 ${cardStyle} cursor-pointer active:scale-95 aspect-square`}
                >
                  <AnimatePresence>
                    {content}
                  </AnimatePresence>
                  
                  {/* Holographic light reflection on unrevealed active cards */}
                  {!card.revealed && phase === "playing" && (
                    <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none transition-opacity duration-300" />
                  )}
                </button>
              );
            })}
          </div>

          {/* End result overlays */}
          {phase === "lost" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-6 text-center"
            >
              <h3 className="text-lg font-black text-red-500 uppercase tracking-widest">BOMBA PATLADI!</h3>
              <p className="text-xs text-zinc-500 mt-1">Girdiğin bahis kül oldu. Kankam bir dahaki sefere!</p>
            </motion.div>
          )}

          {phase === "won" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-6 text-center"
            >
              <h3 className="text-lg font-black text-emerald-400 uppercase tracking-widest">TEBRİKLER!</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Kasanı katladın! Kazanç: <span className="font-mono text-emerald-300 font-bold">+{currentWin.toLocaleString("tr-TR")}</span> TL.
              </p>
            </motion.div>
          )}
        </section>

      </main>

      {/* GAME HISTORY WIDGET BAR */}
      <footer className="relative z-10 border-t border-white/[0.04] bg-black/25 py-5 px-4 backdrop-blur-2xl">
        <div className="mx-auto w-full max-w-5xl">
          <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">Son Oyunlar Geçmişi</h3>
          <div className="flex flex-wrap gap-2">
            {history.length === 0 ? (
              <span className="text-[10px] text-zinc-600">Henüz oynanmış oyun bulunmuyor.</span>
            ) : (
              history.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${
                    item.win
                      ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400"
                      : "border-red-500/25 bg-red-500/5 text-red-400"
                  }`}
                >
                  <span className="font-mono">{item.bet} TL</span>
                  <span>|</span>
                  <span className="font-mono">{item.win ? `x${item.multiplier.toFixed(2)}` : "PATLADI"}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
