"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SPEED_DELAYS } from "../animations/timing";
import { simulateSpin, classifyWin } from "../engine/spin";
import { generatePreviewGrid } from "../engine/grid";
import { playSfx, resumeAudio } from "../sounds/soundEngine";
import type {
  AutoSpinOption,
  CascadeMeta,
  GamePhase,
  Grid,
  SessionStats,
  SpeedMode,
  SpinHistoryEntry,
  WinCluster,
} from "../types";
import { BET_OPTIONS } from "../types";
import {
  calcHitRate,
  calcRtp,
  delay,
  formatCoins,
  loadPersist,
  savePersist,
} from "../utils/storage";

export function useBonanzaGame() {
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState<number>(BET_OPTIONS[2]);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [activeWins, setActiveWins] = useState<WinCluster[]>([]);
  const [cascadeMeta, setCascadeMeta] = useState<CascadeMeta | null>(null);
  const [lastWin, setLastWin] = useState(0);
  const [lastMultiplier, setLastMultiplier] = useState(1);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [history, setHistory] = useState<SpinHistoryEntry[]>([]);
  const [speedMode, setSpeedMode] = useState<SpeedMode>("normal");
  const [autoSpin, setAutoSpin] = useState<AutoSpinOption | null>(null);
  const [autoRemaining, setAutoRemaining] = useState(0);
  const [winBanner, setWinBanner] = useState<string | null>(null);
  const [liveWin, setLiveWin] = useState(0);
  const [showMultiplier, setShowMultiplier] = useState(false);
  const [muted, setMuted] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [inFreeSpins, setInFreeSpins] = useState(false);
  const [fsMultBoost, setFsMultBoost] = useState(1);
  const [fsIntro, setFsIntro] = useState<{
    spins: number;
    multBoost: number;
  } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const spinningRef = useRef(false);
  const autoRef = useRef<AutoSpinOption | null>(null);
  const fsMultBoostRef = useRef(1);

  useEffect(() => {
    fsMultBoostRef.current = fsMultBoost;
  }, [fsMultBoost]);

  useEffect(() => {
    const p = loadPersist();
    setBalance(p.balance);
    setStats({
      ...p.stats,
      freeSpinsTriggered: p.stats.freeSpinsTriggered ?? 0,
    });
    setHistory(p.history.slice(0, 20));
    setGrid(generatePreviewGrid());
  }, []);

  const persist = useCallback(
    (bal: number, st: SessionStats, hist: SpinHistoryEntry[]) => {
      savePersist({ balance: bal, stats: st, history: hist });
    },
    [],
  );

  const timing = SPEED_DELAYS[speedMode];
  const canSpin =
    (balance >= bet || freeSpinsLeft > 0) &&
    phase === "idle" &&
    !spinningRef.current &&
    !fsIntro;

  const runSpinAnimation = useCallback(
    async (currentBet: number, isFreeSpin: boolean) => {
      if (spinningRef.current) return;
      spinningRef.current = true;
      await resumeAudio();
      playSfx("spin");

      setPhase("spinning");
      setActiveWins([]);
      setCascadeMeta(null);
      setLastWin(0);
      setWinBanner(null);
      setLiveWin(0);
      setShowMultiplier(false);
      setScreenShake(false);
      setScreenFlash(false);

      if (isFreeSpin) {
        setFreeSpinsLeft((n) => Math.max(0, n - 1));
      } else {
        setBalance((prev) => prev - currentBet);
      }

      const wasLastFreeSpin = isFreeSpin && freeSpinsLeft === 1;

      const result = simulateSpin(currentBet);
      setGrid(result.initialGrid);
      await delay(timing.spin);
      playSfx("landing");

      let runningBase = 0;

      for (let i = 0; i < result.steps.length; i++) {
        const step = result.steps[i];
        setGrid(step.grid);
        setActiveWins(step.wins);
        setCascadeMeta(null);
        setPhase("exploding");
        runningBase += step.tumbleWin;
        setLiveWin(runningBase);
        playSfx("explosion");
        await delay(timing.explode);

        if (step.afterCascade && step.cascadeMeta) {
          setGrid(step.afterCascade);
          setCascadeMeta(step.cascadeMeta);
          setActiveWins([]);
          setPhase("cascading");
          playSfx("cascade");
          for (let c = 0; c < 6; c++) {
            window.setTimeout(() => playSfx("landing"), c * timing.landStagger);
          }
          await delay(timing.cascade);
          setCascadeMeta(null);
        }
      }

      let finalWin = result.totalWin;
      let mult = result.totalMultiplier;

      if (isFreeSpin && fsMultBoostRef.current > 1 && result.baseWin > 0) {
        const scatterPay =
          result.scatter.type === "bonus" ? result.scatter.payout : 0;
        const boosted =
          result.baseWin * mult * fsMultBoostRef.current + scatterPay;
        finalWin = boosted;
        mult = mult * fsMultBoostRef.current;
      }

      if (result.scatter.type === "bonus") {
        const scatterPay = result.scatter.payout;
        setLiveWin((w) => w + scatterPay);
        setWinBanner("SCATTER BONUS!");
        playSfx("scatter");
        await delay(600);
      }

      if (result.bombMultipliers.length > 0 && finalWin > 0) {
        await delay(100);
        playSfx("multiplier");
        setLiveWin(finalWin);
        setShowMultiplier(true);
        if (mult >= 20) setScreenFlash(true);
      } else if (finalWin > 0) {
        setLiveWin(finalWin);
      }

      setLastWin(finalWin);
      setLastMultiplier(mult);
      setPhase("payout");

      const tier = classifyWin(finalWin, currentBet);
      if (tier === "big") {
        playSfx("bigWin");
        setWinBanner("BÜYÜK KAZANÇ!");
        setScreenShake(true);
      } else if (tier === "mega") {
        playSfx("megaWin");
        setWinBanner("MEGA KAZANÇ!");
        setScreenShake(true);
        setScreenFlash(true);
      } else if (tier === "ultra") {
        playSfx("ultraWin");
        setWinBanner("ULTRA KAZANÇ!");
        setScreenShake(true);
        setScreenFlash(true);
      }

      setBalance((prev) => {
        const next = prev + finalWin;
        setStats((s) => {
          if (!s) return s;
          const updated: SessionStats = {
            ...s,
            totalSpins: s.totalSpins + 1,
            wins: s.wins + (finalWin > 0 ? 1 : 0),
            losses: s.losses + (finalWin > 0 ? 0 : 1),
            totalWagered: s.totalWagered + (isFreeSpin ? 0 : currentBet),
            totalWon: s.totalWon + finalWin,
            largestWin: Math.max(s.largestWin, finalWin),
            freeSpinsTriggered:
              s.freeSpinsTriggered +
              (result.scatter.type === "freespins" && !isFreeSpin ? 1 : 0),
          };
          const entry: SpinHistoryEntry = {
            id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            bet: isFreeSpin ? 0 : currentBet,
            win: finalWin,
            multiplier: mult,
            timestamp: Date.now(),
          };
          setHistory((h) => {
            const nh = [entry, ...h].slice(0, 20);
            persist(next, updated, nh);
            return nh;
          });
          return updated;
        });
        return next;
      });

      if (tier !== "none") {
        setPhase("celebration");
        await delay(timing.celebration);
      }

      if (result.scatter.type === "freespins") {
        const { spins, multBoost } = result.scatter;
        if (isFreeSpin) {
          setFreeSpinsLeft((n) => n + spins);
          setWinBanner(`+${spins} EK FREE SPIN!`);
          playSfx("scatter");
          await delay(800);
        } else {
          spinningRef.current = false;
          setFsIntro({ spins, multBoost });
          setPhase("freeSpinsIntro");
          return;
        }
      }

      if (wasLastFreeSpin) {
        setInFreeSpins(false);
        setFsMultBoost(1);
      }

      setPhase("idle");
      setActiveWins([]);
      setLiveWin(0);
      setShowMultiplier(false);
      if (!result.scatter.type || result.scatter.type === "none") {
        setWinBanner(null);
      }
      spinningRef.current = false;

      if (autoRef.current) {
        setAutoRemaining((r) => {
          if (autoRef.current === "infinite") return r;
          const nr = r - 1;
          if (nr <= 0) {
            autoRef.current = null;
            setAutoSpin(null);
            return 0;
          }
          return nr;
        });
      }
    },
    [persist, timing, freeSpinsLeft],
  );

  const completeFsIntro = useCallback(() => {
    if (!fsIntro) return;
    setFreeSpinsLeft(fsIntro.spins);
    setFsMultBoost(fsIntro.multBoost);
    setInFreeSpins(true);
    setFsIntro(null);
    setPhase("idle");
    spinningRef.current = false;
  }, [fsIntro]);

  const stopAuto = useCallback(() => {
    autoRef.current = null;
    setAutoSpin(null);
    setAutoRemaining(0);
  }, []);

  const spin = useCallback(async () => {
    if (!canSpin || !stats) return;
    const isFree = freeSpinsLeft > 0;
    if (!isFree && balance < bet) {
      stopAuto();
      return;
    }
    await runSpinAnimation(bet, isFree);
  }, [balance, bet, canSpin, freeSpinsLeft, runSpinAnimation, stats, stopAuto]);

  const buyFeature = useCallback(async () => {
    const cost = bet * 100;
    if (balance < cost || phase !== "idle" || spinningRef.current || fsIntro) return;

    spinningRef.current = true;
    await resumeAudio();
    playSfx("spin");

    setPhase("spinning");
    setActiveWins([]);
    setCascadeMeta(null);
    setLastWin(0);
    setWinBanner(null);
    setLiveWin(0);
    setShowMultiplier(false);
    setScreenShake(false);
    setScreenFlash(false);

    const nextBal = balance - cost;
    setBalance(nextBal);

    const result = simulateSpin(bet, true);
    setGrid(result.initialGrid);
    await delay(timing.spin);
    playSfx("landing");

    let runningBase = 0;
    for (let i = 0; i < result.steps.length; i++) {
      const step = result.steps[i];
      setGrid(step.grid);
      setActiveWins(step.wins);
      setCascadeMeta(null);
      setPhase("exploding");
      runningBase += step.tumbleWin;
      setLiveWin(runningBase);
      playSfx("explosion");
      await delay(timing.explode);

      if (step.afterCascade && step.cascadeMeta) {
        setGrid(step.afterCascade);
        setCascadeMeta(step.cascadeMeta);
        setActiveWins([]);
        setPhase("cascading");
        playSfx("cascade");
        for (let c = 0; c < 6; c++) {
          window.setTimeout(() => playSfx("landing"), c * timing.landStagger);
        }
        await delay(timing.cascade);
        setCascadeMeta(null);
      }
    }

    const { spins, multBoost } = result.scatter as { spins: number; multBoost: number };
    setWinBanner("FREE SPINS ALINDI!");
    playSfx("scatter");
    await delay(1200);

    setStats((s) => {
      if (!s) return s;
      const updated: SessionStats = {
        ...s,
        totalSpins: s.totalSpins + 1,
        totalWagered: s.totalWagered + cost,
        freeSpinsTriggered: s.freeSpinsTriggered + 1,
      };
      const entry: SpinHistoryEntry = {
        id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        bet: cost,
        win: 0,
        multiplier: 0,
        timestamp: Date.now(),
      };
      setHistory((h) => {
        const nh = [entry, ...h].slice(0, 20);
        persist(nextBal, updated, nh);
        return nh;
      });
      return updated;
    });

    spinningRef.current = false;
    setFsIntro({ spins, multBoost });
    setPhase("freeSpinsIntro");
  }, [balance, bet, timing, fsIntro, phase, persist]);

  useEffect(() => {
    if (!autoSpin || phase !== "idle" || !canSpin) return;
    const t = window.setTimeout(() => void spin(), timing.autoGap);
    return () => window.clearTimeout(t);
  }, [autoSpin, phase, canSpin, spin, timing.autoGap]);

  const startAuto = useCallback((opt: AutoSpinOption) => {
    autoRef.current = opt;
    setAutoSpin(opt);
    setAutoRemaining(opt === "infinite" ? -1 : opt);
  }, []);

  const resetBalance = useCallback(() => {
    setFreeSpinsLeft(0);
    setInFreeSpins(false);
    setFsMultBoost(1);
    setStats((s) => {
      const st = {
        ...(s ?? {
          totalSpins: 0,
          wins: 0,
          losses: 0,
          totalWagered: 0,
          totalWon: 0,
          largestWin: 0,
          sessionStartBalance: 100_000,
          freeSpinsTriggered: 0,
        }),
        sessionStartBalance: 100_000,
        totalSpins: 0,
        wins: 0,
        losses: 0,
        totalWagered: 0,
        totalWon: 0,
        largestWin: 0,
        freeSpinsTriggered: 0,
      };
      setBalance(100_000);
      persist(100_000, st, history);
      return st;
    });
  }, [history, persist]);

  const derived = useMemo(() => {
    if (!stats) return null;
    return {
      rtp: calcRtp(stats),
      hitRate: calcHitRate(stats),
      sessionProfit: balance - stats.sessionStartBalance,
    };
  }, [stats, balance]);

  return {
    balance,
    bet,
    setBet,
    grid,
    phase,
    activeWins,
    cascadeMeta,
    lastWin,
    lastMultiplier,
    stats,
    history,
    speedMode,
    setSpeedMode,
    autoSpin,
    autoRemaining,
    startAuto,
    stopAuto,
    spin,
    buyFeature,
    canSpin,
    winBanner,
    liveWin,
    showMultiplier,
    muted,
    setMuted,
    resetBalance,
    derived,
    formatCoins,
    freeSpinsLeft,
    inFreeSpins,
    fsIntro,
    completeFsIntro,
    screenShake,
    screenFlash,
  };
}
