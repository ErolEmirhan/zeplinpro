"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// --- TEAMS DATA ---
type Team = {
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  league: string;
  players: string[];
};

const TEAMS: Team[] = [
  // Premier League
  {
    name: "Manchester City",
    shortName: "MCI",
    logo: "https://crests.football-data.org/65.png",
    primaryColor: "#6CABDD",
    secondaryColor: "#1C2C5B",
    league: "Premier League",
    players: ["Haaland", "De Bruyne", "Foden", "Bernardo Silva", "Rodri"]
  },
  {
    name: "Arsenal",
    shortName: "ARS",
    logo: "https://crests.football-data.org/57.svg",
    primaryColor: "#EF0107",
    secondaryColor: "#063672",
    league: "Premier League",
    players: ["Saka", "Odegaard", "Havertz", "Martinelli", "Rice"]
  },
  {
    name: "Liverpool",
    shortName: "LIV",
    logo: "https://crests.football-data.org/64.png",
    primaryColor: "#C8102E",
    secondaryColor: "#F6EB61",
    league: "Premier League",
    players: ["Salah", "Luis Diaz", "Darwin Nunez", "Szoboszlai", "Mac Allister"]
  },
  {
    name: "Manchester United",
    shortName: "MUN",
    logo: "https://crests.football-data.org/66.png",
    primaryColor: "#DA291C",
    secondaryColor: "#000000",
    league: "Premier League",
    players: ["Rashford", "Bruno Fernandes", "Hojlund", "Garnacho", "Mainoo"]
  },
  // La Liga
  {
    name: "Real Madrid",
    shortName: "RMA",
    logo: "https://crests.football-data.org/86.png",
    primaryColor: "#EAEAEA",
    secondaryColor: "#132B50",
    league: "La Liga",
    players: ["Vinicius Jr.", "Bellingham", "Mbappe", "Rodrygo", "Valverde"]
  },
  {
    name: "Barcelona",
    shortName: "FCB",
    logo: "https://crests.football-data.org/81.png",
    primaryColor: "#004D98",
    secondaryColor: "#A50044",
    league: "La Liga",
    players: ["Lewandowski", "Lamine Yamal", "Raphinha", "Pedri", "Gavi"]
  },
  {
    name: "Atletico Madrid",
    shortName: "ATM",
    logo: "https://crests.football-data.org/78.png",
    primaryColor: "#CB3524",
    secondaryColor: "#192E6B",
    league: "La Liga",
    players: ["Griezmann", "Sorloth", "Julian Alvarez", "De Paul", "Koke"]
  },
  // Bundesliga
  {
    name: "Bayern Munich",
    shortName: "FCB",
    logo: "https://crests.football-data.org/5.png",
    primaryColor: "#DC052D",
    secondaryColor: "#0066B2",
    league: "Bundesliga",
    players: ["Harry Kane", "Musiala", "Leroy Sane", "Gnabry", "Thomas Muller"]
  },
  {
    name: "Borussia Dortmund",
    shortName: "BVB",
    logo: "https://crests.football-data.org/4.png",
    primaryColor: "#FDE100",
    secondaryColor: "#000000",
    league: "Bundesliga",
    players: ["Guirassy", "Brandt", "Sabitzer", "Malen", "Adeyemi"]
  },
  {
    name: "Bayer Leverkusen",
    shortName: "B04",
    logo: "https://crests.football-data.org/3.png",
    primaryColor: "#E32221",
    secondaryColor: "#000000",
    league: "Bundesliga",
    players: ["Wirtz", "Boniface", "Schick", "Grimaldo", "Frimpong"]
  },
  // Serie A
  {
    name: "Inter Milan",
    shortName: "INT",
    logo: "https://crests.football-data.org/108.png",
    primaryColor: "#0053A0",
    secondaryColor: "#000000",
    league: "Serie A",
    players: ["Lautaro Martinez", "Thuram", "Barella", "Calhanoglu", "Dimarco"]
  },
  {
    name: "AC Milan",
    shortName: "ACM",
    logo: "https://crests.football-data.org/98.png",
    primaryColor: "#E32221",
    secondaryColor: "#000000",
    league: "Serie A",
    players: ["Rafael Leao", "Morata", "Pulisic", "Loftus-Cheek", "Reijnders"]
  },
  {
    name: "Juventus",
    shortName: "JUV",
    logo: "https://crests.football-data.org/109.png",
    primaryColor: "#1A1A1A",
    secondaryColor: "#E0E0E0",
    league: "Serie A",
    players: ["Vlahovic", "Kenan Yildiz", "Weah", "Locatelli", "Koopmeiners"]
  },
  // Ligue 1
  {
    name: "Paris Saint-Germain",
    shortName: "PSG",
    logo: "https://crests.football-data.org/524.png",
    primaryColor: "#004170",
    secondaryColor: "#DA291C",
    league: "Ligue 1",
    players: ["Dembele", "Barcola", "Vitinha", "Hakimi", "Kolo Muani"]
  }
];

// --- MATCH EVENTS ---
type MatchEvent = {
  minute: number;
  text: string;
  type: "goal" | "card" | "shot" | "info" | "whistle";
  team?: "home" | "away";
};

// --- ACTIVE BETS ---
type ActiveBet = {
  type: "1" | "X" | "2" | "over" | "under" | "kgVar" | "kgYok";
  amount: number;
  odds: number;
  cashedOut: boolean;
  cashOutAmount: number | null;
  resolved: "won" | "lost" | null;
};

// --- CHAT MESSAGES ---
type ChatMsg = {
  id: string;
  user: string;
  text: string;
  time: string;
};

const SIMULATED_USERNAMES = [
  "Ahmet_Iddiaci", "Cimbomlu99", "Karakartal_1903", "Fenerli_Bora", "Bahis_Krali", 
  "Analiz_Ustadı", "Slotçu_Dede", "Kuponcu_Ali", "Kasa_Katlayan", "Gol_Var_Diyen", 
  "Altci_Hasan", "Tek_Maçtan_Yatan", "ZirvedekiKupon"
];

const SIMULATED_CHAT_TEXTS = [
  "amına koyayım böyle maçın bas bas bas",
  "ulan city gibi takımın ta aq gol atın artık",
  "has siktir o nasıl goldü lan öyle öf",
  "amk hakemi penaltıyı yedi resmen orospu çocuğu",
  "lan olum bu maç 2.5 üst bitmezse sikin beni",
  "kupon yattı amk sikeyim böyle işi ya",
  "real madrid bu maçı vermez sike sike kazanacak",
  "o golü kaçıran forvetin anasını avradını sikeyim",
  "ya siktir git oradan hakem gibi senin ta aq",
  "ev sahibi golü attı götünüze girsin kuponcular",
  "hadi be bir gol daha amk hadi be canlanın",
  "kg var aldık hadi kupon gelsin amına koyayım",
  "piç hakem maçı katletti piç kurusu"
];

export default function IddiaGame() {
  // --- STATE VARIABLES ---
  const [balance, setBalance] = useState<number>(100000);
  const [betAmount, setBetAmount] = useState<string>("1000");

  // Teams & Match Stats
  const [homeTeam, setHomeTeam] = useState<Team>(TEAMS[0]);
  const [awayTeam, setAwayTeam] = useState<Team>(TEAMS[1]);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);

  // Match Flow State
  // "betting" -> pre match 15s countdown
  // "firstHalf" -> minute 0 to 45
  // "halfTime" -> 5s countdown (5 4 3 2 1)
  // "secondHalf" -> minute 45 to 90
  // "finished" -> match ends, settling bets
  const [phase, setPhase] = useState<"betting" | "firstHalf" | "halfTime" | "secondHalf" | "finished">("betting");
  const [minute, setMinute] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(15);

  // Odds State (Locked once match starts)
  const [odds1, setOdds1] = useState<number>(2.10);
  const [oddsX, setOddsX] = useState<number>(3.30);
  const [odds2, setOdds2] = useState<number>(2.90);
  const [oddsOver, setOddsOver] = useState<number>(1.85);
  const [oddsUnder, setOddsUnder] = useState<number>(1.85);
  const [oddsKgVar, setOddsKgVar] = useState<number>(1.75);
  const [oddsKgYok, setOddsKgYok] = useState<number>(1.95);

  // Logs & Bets
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([]);
  const [matchHistory, setMatchHistory] = useState<Array<{ teams: string; score: string; winner: string; homeLogo: string; awayLogo: string }>>([]);
  const [chat, setChat] = useState<ChatMsg[]>([]);

  // Sound effects
  const [muted, setMuted] = useState(false);

  // Goal scorer display animation
  const [goalScorer, setGoalScorer] = useState<{ name: string; team: string } | null>(null);

  // References
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- PLAY SFX & PWA AUDIO AUTO-UNLOCK ---
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
      // Play a short silent buffer note to force-unlock iOS/Safari audio context
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

  const playWhistle = useCallback((type: "start" | "half" | "full") => {
    if (muted) return;
    try {
      initAudioContext();
      const audioCtx = audioCtxRef.current;
      if (!audioCtx) return;
      
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      gain.gain.setValueAtTime(0.95, audioCtx.currentTime); // High volume (0.95)
      
      if (type === "start") {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } else if (type === "half") {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
        
        setTimeout(() => {
          const ctx2 = audioCtxRef.current;
          if (!ctx2 || muted) return;
          const osc2 = ctx2.createOscillator();
          const gain2 = ctx2.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(880, ctx2.currentTime);
          gain2.gain.setValueAtTime(0.95, ctx2.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.25);
          osc2.connect(gain2);
          gain2.connect(ctx2.destination);
          osc2.start();
          osc2.stop(ctx2.currentTime + 0.25);
        }, 300);
      } else {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
        
        setTimeout(() => {
          const ctx2 = audioCtxRef.current;
          if (!ctx2 || muted) return;
          const osc2 = ctx2.createOscillator();
          const gain2 = ctx2.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(880, ctx2.currentTime);
          gain2.gain.setValueAtTime(0.95, ctx2.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.25);
          osc2.connect(gain2);
          gain2.connect(ctx2.destination);
          osc2.start();
          osc2.stop(ctx2.currentTime + 0.25);
        }, 300);

        setTimeout(() => {
          const ctx3 = audioCtxRef.current;
          if (!ctx3 || muted) return;
          const osc3 = ctx3.createOscillator();
          const gain3 = ctx3.createGain();
          osc3.type = "sine";
          osc3.frequency.setValueAtTime(880, ctx3.currentTime);
          gain3.gain.setValueAtTime(0.95, ctx3.currentTime);
          gain3.gain.exponentialRampToValueAtTime(0.01, ctx3.currentTime + 0.75);
          osc3.connect(gain3);
          gain3.connect(ctx3.destination);
          osc3.start();
          osc3.stop(ctx3.currentTime + 0.75);
        }, 600);
      }
    } catch (e) {
      console.warn("AudioContext whistle failed to start:", e);
    }
  }, [muted, initAudioContext]);

  const playCoin = useCallback(() => {
    if (muted) return;
    try {
      initAudioContext();
      const audioCtx = audioCtxRef.current;
      if (!audioCtx) return;
      
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.85, audioCtx.currentTime); // High volume (0.85)
      gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn("Coin SFX failed:", e);
    }
  }, [muted, initAudioContext]);

  // --- BALANCE PERSISTENCE ---
  useEffect(() => {
    const cached = localStorage.getItem("bonanza_session_v1");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.balance === "number") {
          setBalance(parsed.balance);
        }
      } catch (e) {}
    } else {
      localStorage.setItem("bonanza_session_v1", JSON.stringify({ balance: 100000 }));
    }
  }, []);

  const updatePersistentBalance = useCallback((newBal: number | ((prev: number) => number)) => {
    setBalance(prev => {
      const next = typeof newBal === "function" ? newBal(prev) : newBal;
      const saved = localStorage.getItem("bonanza_session_v1");
      let parsed: any = {};
      if (saved) {
        try {
          parsed = JSON.parse(saved);
        } catch (e) {}
      }
      parsed.balance = next;
      localStorage.setItem("bonanza_session_v1", JSON.stringify(parsed));
      return next;
    });
  }, []);

  const resetBalance = () => {
    updatePersistentBalance(100000);
  };

  // --- INITIAL CHAT LOAD ---
  useEffect(() => {
    const initialMsgs: ChatMsg[] = Array.from({ length: 6 }).map((_, i) => {
      const timeStr = new Date(Date.now() - (6 - i) * 60000).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit"
      });
      return {
        id: String(Math.random()),
        user: SIMULATED_USERNAMES[Math.floor(Math.random() * SIMULATED_USERNAMES.length)],
        text: SIMULATED_CHAT_TEXTS[Math.floor(Math.random() * SIMULATED_CHAT_TEXTS.length)],
        time: timeStr
      };
    });
    setChat(initialMsgs);
  }, []);

  // Scroll logic for logs and chat without browser viewport jumps
  useEffect(() => {
    const el = eventsContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [events]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chat]);

  // --- MATCH INITIALIZER ---
  const generateNewMatch = useCallback(() => {
    // Select two random teams
    let idxA = Math.floor(Math.random() * TEAMS.length);
    let idxB = Math.floor(Math.random() * TEAMS.length);
    while (idxA === idxB) {
      idxB = Math.floor(Math.random() * TEAMS.length);
    }
    
    setHomeTeam(TEAMS[idxA]);
    setAwayTeam(TEAMS[idxB]);
    setHomeScore(0);
    setAwayScore(0);
    setMinute(0);
    setActiveBets([]);
    setEvents([]);
    setGoalScorer(null);

    // Calculate realistic pre-match odds based on teams
    // Add small random noise for variety
    const baseHome = 1.6 + Math.random() * 1.5;
    const baseAway = 1.6 + Math.random() * 1.5;
    const draw = 2.8 + Math.random() * 1.2;

    setOdds1(Number(baseHome.toFixed(2)));
    setOddsX(Number(draw.toFixed(2)));
    setOdds2(Number(baseAway.toFixed(2)));

    const overOdds = 1.6 + Math.random() * 0.7;
    const underOdds = 3.5 - overOdds; // Inverse relationship
    setOddsOver(Number(overOdds.toFixed(2)));
    setOddsUnder(Number(underOdds.toFixed(2)));

    const kgVarOdds = 1.5 + Math.random() * 0.5;
    const kgYokOdds = 3.3 - kgVarOdds;
    setOddsKgVar(Number(kgVarOdds.toFixed(2)));
    setOddsKgYok(Number(kgYokOdds.toFixed(2)));

    setPhase("betting");
    setCountdown(15);
  }, []);

  // --- RECALCULATE CASH OUT OPTION ---
  // Calculates live cash out multiplier based on score and time
  const getLiveProbability = useCallback((type: "1" | "X" | "2" | "over" | "under" | "kgVar" | "kgYok", currentMin: number, homeSc: number, awaySc: number) => {
    if (currentMin >= 90) {
      if (type === "1") return homeSc > awaySc ? 1.0 : 0.0;
      if (type === "X") return homeSc === awaySc ? 1.0 : 0.0;
      if (type === "2") return awaySc > homeSc ? 1.0 : 0.0;
      if (type === "over") return (homeSc + awaySc) >= 3 ? 1.0 : 0.0;
      if (type === "under") return (homeSc + awaySc) < 3 ? 1.0 : 0.0;
      if (type === "kgVar") return (homeSc > 0 && awaySc > 0) ? 1.0 : 0.0;
      if (type === "kgYok") return (homeSc === 0 || awaySc === 0) ? 1.0 : 0.0;
    }

    const t = (90 - currentMin) / 90; // Remaining time ratio
    const scoreDiff = homeSc - awaySc;
    const totalGoals = homeSc + awaySc;

    switch (type) {
      case "1": {
        if (scoreDiff > 0) {
          // Home is leading: higher probability as time decreases
          return Math.min(0.99, 1 - Math.exp(-scoreDiff * 2) * t);
        } else if (scoreDiff === 0) {
          // Draw: Home has standard chance decaying towards draw
          return Math.max(0.05, 0.35 * (1 - t) + 0.38 * t);
        } else {
          // Home is losing: very low probability decaying to 0
          return Math.max(0.01, Math.exp(scoreDiff * 2) * t);
        }
      }
      case "2": {
        if (scoreDiff < 0) {
          // Away is leading
          return Math.min(0.99, 1 - Math.exp(scoreDiff * 2) * t);
        } else if (scoreDiff === 0) {
          // Draw
          return Math.max(0.05, 0.35 * (1 - t) + 0.32 * t);
        } else {
          // Away is losing
          return Math.max(0.01, Math.exp(-scoreDiff * 2) * t);
        }
      }
      case "X": {
        if (scoreDiff === 0) {
          // Currently draw: goes to 1.0 as time runs out
          return Math.min(0.99, 1 - 0.6 * t);
        } else if (Math.abs(scoreDiff) === 1) {
          // 1 goal difference: medium chance to equalize
          return Math.max(0.01, 0.3 * (1 - t));
        } else {
          // 2+ goal difference: very small chance to equalize
          return Math.max(0.005, 0.05 * (1 - t));
        }
      }
      case "over": {
        if (totalGoals >= 3) return 1.0;
        const needed = 3 - totalGoals;
        if (needed === 1) return Math.max(0.01, 0.5 * t);
        if (needed === 2) return Math.max(0.005, 0.22 * t * t);
        return Math.max(0.001, 0.08 * t * t * t);
      }
      case "under": {
        if (totalGoals >= 3) return 0.0;
        if (totalGoals === 0) return Math.min(0.99, 1 - 0.5 * t);
        if (totalGoals === 1) return Math.min(0.99, 1 - 0.35 * t);
        return Math.min(0.99, 1 - 0.2 * t);
      }
      case "kgVar": {
        if (homeSc > 0 && awaySc > 0) return 1.0;
        if (homeSc === 0 && awaySc === 0) return Math.max(0.01, 0.25 * t * t);
        return Math.max(0.05, 0.45 * t);
      }
      case "kgYok": {
        if (homeSc > 0 && awaySc > 0) return 0.0;
        if (homeSc === 0 && awaySc === 0) return Math.min(0.99, 1 - 0.25 * t * t);
        return Math.min(0.99, 1 - 0.45 * t);
      }
    }
  }, []);

  const calculateLiveCashOut = useCallback((bet: ActiveBet, currentMin: number, homeSc: number, awaySc: number): number | null => {
    if (bet.cashedOut || bet.resolved !== null) return null;
    const prob = getLiveProbability(bet.type, currentMin, homeSc, awaySc);
    if (prob <= 0.02) return 0;
    if (prob >= 0.99) return Math.round(bet.amount * bet.odds);
    
    // Live Cash-Out formula: bet * (originalOdds / liveOdds) * 0.93 (7% margin/fee)
    const liveOdds = 1 / prob;
    const cashOutVal = bet.amount * (bet.odds / liveOdds) * 0.93;
    return Math.max(0, Math.min(Math.round(bet.amount * bet.odds), Math.round(cashOutVal)));
  }, [getLiveProbability]);

  // Recalculates cashout for all active bets on every minute increment
  const updateCashOuts = useCallback((currentMin: number, homeSc: number, awaySc: number) => {
    setActiveBets(prev => 
      prev.map(b => {
        if (b.cashedOut || b.resolved !== null) return b;
        const val = calculateLiveCashOut(b, currentMin, homeSc, awaySc);
        return {
          ...b,
          cashOutAmount: val
        };
      })
    );
  }, [calculateLiveCashOut]);

  // --- CASH OUT ACTION ---
  const handleCashOut = (index: number) => {
    const bet = activeBets[index];
    if (!bet || bet.cashedOut || bet.resolved !== null) return;
    const amt = bet.cashOutAmount;
    if (amt === null || amt <= 0) return;

    setActiveBets(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        cashedOut: true
      };
      return copy;
    });

    updatePersistentBalance(balance + amt);
    playCoin();

    const typeText = bet.type === "1" ? "Ev Sahibi" : bet.type === "2" ? "Deplasman" : bet.type === "X" ? "Beraberlik" : bet.type === "over" ? "2.5 Üst" : bet.type === "under" ? "2.5 Alt" : bet.type === "kgVar" ? "KG Var" : "KG Yok";
    // Add cashout event to commentary
    setEvents(prev => [
      ...prev,
      {
        minute,
        text: `💰 BAHSİ BOZDURDU! Bahis türü: ${typeText} | Bozdurulan Tutar: +${amt.toLocaleString("tr-TR")} jeton`,
        type: "info"
      }
    ]);
  };

  // --- BET PLACE ACTION ---
  const handlePlaceBet = (type: "1" | "X" | "2" | "over" | "under" | "kgVar" | "kgYok", odds: number) => {
    if (phase !== "betting") return;
    const amt = Number(betAmount);
    if (isNaN(amt) || amt <= 0 || amt > balance) return;

    // Check if there is already a bet of this type
    if (activeBets.some(b => b.type === type)) return;

    const newBet: ActiveBet = {
      type,
      amount: amt,
      odds,
      cashedOut: false,
      cashOutAmount: amt,
      resolved: null
    };

    setActiveBets(prev => [...prev, newBet]);
    updatePersistentBalance((prev: number) => prev - amt);
    playCoin();
  };

  // --- SETTLE ALL BETS ---
  const settleBets = useCallback((homeSc: number, awaySc: number) => {
    setActiveBets(prev => 
      prev.map(b => {
        if (b.cashedOut) return { ...b, resolved: "won" }; // already settled via cash out
        
        let won = false;
        if (b.type === "1" && homeSc > awaySc) won = true;
        else if (b.type === "2" && awaySc > homeSc) won = true;
        else if (b.type === "X" && homeSc === awaySc) won = true;
        else if (b.type === "over" && (homeSc + awaySc) >= 3) won = true;
        else if (b.type === "under" && (homeSc + awaySc) < 3) won = true;
        else if (b.type === "kgVar" && homeSc > 0 && awaySc > 0) won = true;
        else if (b.type === "kgYok" && (homeSc === 0 || awaySc === 0)) won = true;

        if (won) {
          const winAmt = Math.round(b.amount * b.odds);
          setTimeout(() => {
            updatePersistentBalance((prevBal: number) => prevBal + winAmt);
            playCoin();
          }, 100);
          return { ...b, resolved: "won" };
        } else {
          return { ...b, resolved: "lost" };
        }
      })
    );
  }, [playCoin]);

  // --- MAIN LOOP SCHEDULER ---
  useEffect(() => {
    generateNewMatch();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generateNewMatch]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Dynamic Interval based on game phases
    let delayTime = 1000;
    if (phase === "firstHalf" || phase === "secondHalf") {
      delayTime = 280; // Fast ticks (simulate 90 mins in 25-30 seconds)
    }

    intervalRef.current = setInterval(() => {
      // 1. Betting Phase Countdown
      if (phase === "betting") {
        setCountdown(prev => {
          if (prev <= 1) {
            setPhase("firstHalf");
            playWhistle("start");
            setEvents([{
              minute: 0,
              text: `🏁 Hakem maçı başlatan düdüğü çalıyor! Maç başladı. Başarılar!`,
              type: "whistle"
            }]);
            return 0;
          }
          return prev - 1;
        });
      }

      // 2. First Half Match Simulation
      else if (phase === "firstHalf") {
        setMinute(prevMin => {
          const nextMin = prevMin + Math.floor(Math.random() * 3) + 1;
          
          if (nextMin >= 45) {
            // Half time reached
            setPhase("halfTime");
            setCountdown(5);
            playWhistle("half");
            setEvents(prev => [
              ...prev,
              {
                minute: 45,
                text: `⏸️ Hakem ilk yarıyı bitiriyor! Devre arası. Skor: ${homeTeam.name} ${homeScore} - ${awayScore} ${awayTeam.name}`,
                type: "whistle"
              }
            ]);
            updateCashOuts(45, homeScore, awayScore);
            return 45;
          }

          // Random Match Events
          const roll = Math.random();
          if (roll < 0.12) {
            // Event occurs!
            const eventRoll = Math.random();
            if (eventRoll < 0.35) {
              // Goal!
              const scoreTeam = Math.random() < 0.5 ? "home" : "away";
              let scorer = "";
              if (scoreTeam === "home") {
                setHomeScore(h => h + 1);
                scorer = homeTeam.players[Math.floor(Math.random() * homeTeam.players.length)];
                setGoalScorer({ name: scorer, team: homeTeam.name });
                setEvents(prev => [
                  ...prev,
                  {
                    minute: nextMin,
                    text: `⚽ GOL! ${homeTeam.name} golü buldu! Golü atan oyuncu: ${scorer} (${nextMin}')`,
                    type: "goal",
                    team: "home"
                  }
                ]);
              } else {
                setAwayScore(a => a + 1);
                scorer = awayTeam.players[Math.floor(Math.random() * awayTeam.players.length)];
                setGoalScorer({ name: scorer, team: awayTeam.name });
                setEvents(prev => [
                  ...prev,
                  {
                    minute: nextMin,
                    text: `⚽ GOL! ${awayTeam.name} golü buldu! Golü atan oyuncu: ${scorer} (${nextMin}')`,
                    type: "goal",
                    team: "away"
                  }
                ]);
              }
              // Clear scorer popup after 3 seconds
              setTimeout(() => setGoalScorer(null), 3000);
            } else if (eventRoll < 0.70) {
              // Shot / Danger
              const attackTeam = Math.random() < 0.5 ? homeTeam : awayTeam;
              const attacker = attackTeam.players[Math.floor(Math.random() * attackTeam.players.length)];
              const shotText = Math.random() < 0.5 
                ? `🏹 Tehlikeli atak! ${attacker} kaleyi yokladı, top direğin hemen yanından dışarıda!`
                : `🧤 Kaleci devleşti! ${attacker} karşı karşıya pozisyonda şutunu çekti, kaleci kornere çeldi!`;
              setEvents(prev => [...prev, { minute: nextMin, text: shotText, type: "shot" }]);
            } else {
              // Yellow Card
              const cardTeam = Math.random() < 0.5 ? "home" : "away";
              const teamObj = cardTeam === "home" ? homeTeam : awayTeam;
              const player = teamObj.players[Math.floor(Math.random() * teamObj.players.length)];
              setEvents(prev => [
                ...prev,
                {
                  minute: nextMin,
                  text: `🟨 Sarı Kart: ${player} (${teamObj.name}) - Hakeme sert itiraz veya faul.`,
                  type: "card",
                  team: cardTeam
                }
              ]);
            }
          }

          updateCashOuts(nextMin, homeScore, awayScore);
          return nextMin;
        });
      }

      // 3. Half-Time Countdown (5 4 3 2 1)
      else if (phase === "halfTime") {
        setCountdown(prev => {
          if (prev <= 1) {
            setPhase("secondHalf");
            playWhistle("start");
            setEvents(prev => [
              ...prev,
              {
                minute: 46,
                text: `🏁 Hakem düdüğünü çalıyor ve ikinci yarı başlıyor!`,
                type: "whistle"
              }
            ]);
            return 0;
          }
          return prev - 1;
        });
      }

      // 4. Second Half Match Simulation
      else if (phase === "secondHalf") {
        setMinute(prevMin => {
          const nextMin = prevMin + Math.floor(Math.random() * 3) + 1;

          if (nextMin >= 90) {
            // Full time reached
            setPhase("finished");
            setCountdown(8); // Wait 8 seconds before restarting
            playWhistle("full");
            setEvents(prev => [
              ...prev,
              {
                minute: 90,
                text: `🛑 Hakem son düdüğü çalıyor! Maç bitti! Maç Sonucu: ${homeTeam.name} ${homeScore} - ${awayScore} ${awayTeam.name}`,
                type: "whistle"
              }
            ]);
            settleBets(homeScore, awayScore);
            
            // Add to match history
            const winnerName = homeScore > awayScore 
              ? homeTeam.name 
              : awayScore > homeScore 
                ? awayTeam.name 
                : "Beraberlik";
            setMatchHistory(prev => [
              {
                teams: `${homeTeam.shortName} vs ${awayTeam.shortName}`,
                score: `${homeScore} - ${awayScore}`,
                winner: winnerName,
                homeLogo: homeTeam.logo,
                awayLogo: awayTeam.logo
              },
              ...prev.slice(0, 7)
            ]);
            return 90;
          }

          // Random Match Events
          const roll = Math.random();
          if (roll < 0.13) {
            const eventRoll = Math.random();
            if (eventRoll < 0.38) {
              // Goal
              const scoreTeam = Math.random() < 0.5 ? "home" : "away";
              let scorer = "";
              if (scoreTeam === "home") {
                setHomeScore(h => h + 1);
                scorer = homeTeam.players[Math.floor(Math.random() * homeTeam.players.length)];
                setGoalScorer({ name: scorer, team: homeTeam.name });
                setEvents(prev => [
                  ...prev,
                  {
                    minute: nextMin,
                    text: `⚽ GOL! ${homeTeam.name} golü buldu! Golü atan oyuncu: ${scorer} (${nextMin}')`,
                    type: "goal",
                    team: "home"
                  }
                ]);
              } else {
                setAwayScore(a => a + 1);
                scorer = awayTeam.players[Math.floor(Math.random() * awayTeam.players.length)];
                setGoalScorer({ name: scorer, team: awayTeam.name });
                setEvents(prev => [
                  ...prev,
                  {
                    minute: nextMin,
                    text: `⚽ GOL! ${awayTeam.name} golü buldu! Golü atan oyuncu: ${scorer} (${nextMin}')`,
                    type: "goal",
                    team: "away"
                  }
                ]);
              }
              setTimeout(() => setGoalScorer(null), 3000);
            } else if (eventRoll < 0.72) {
              // Shot / Danger
              const attackTeam = Math.random() < 0.5 ? homeTeam : awayTeam;
              const attacker = attackTeam.players[Math.floor(Math.random() * attackTeam.players.length)];
              const shotText = Math.random() < 0.5 
                ? `🏹 Tehlikeli atak! ${attacker} ceza sahası dışından şut çekti, top kalecinin kucağında kaldı.`
                : `💥 Müthiş şut! ${attacker} çok sert vurdu, top direkten döndü! Tribünler ayakta!`;
              setEvents(prev => [...prev, { minute: nextMin, text: shotText, type: "shot" }]);
            } else if (eventRoll < 0.90) {
              // Yellow Card
              const cardTeam = Math.random() < 0.5 ? "home" : "away";
              const teamObj = cardTeam === "home" ? homeTeam : awayTeam;
              const player = teamObj.players[Math.floor(Math.random() * teamObj.players.length)];
              setEvents(prev => [
                ...prev,
                {
                  minute: nextMin,
                  text: `🟨 Sarı Kart: ${player} (${teamObj.name}) - Sert kayarak müdahale.`,
                  type: "card",
                  team: cardTeam
                }
              ]);
            } else {
              // Red Card!
              const cardTeam = Math.random() < 0.5 ? "home" : "away";
              const teamObj = cardTeam === "home" ? homeTeam : awayTeam;
              const player = teamObj.players[Math.floor(Math.random() * teamObj.players.length)];
              setEvents(prev => [
                ...prev,
                {
                  minute: nextMin,
                  text: `🟥 KIRMIZI KART! ${player} (${teamObj.name}) - Rakibine yaptığı sert faul sonrası direkt kırmızı kartla atıldı!`,
                  type: "card",
                  team: cardTeam
                }
              ]);
            }
          }

          updateCashOuts(nextMin, homeScore, awayScore);
          return nextMin;
        });
      }

      // 5. Match Finished Settle Timeout
      else if (phase === "finished") {
        setCountdown(prev => {
          if (prev <= 1) {
            generateNewMatch();
            return 0;
          }
          return prev - 1;
        });
      }

      // 6. Simulate chat activity
      if (Math.random() < 0.35) {
        const timeStr = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
        setChat(prev => [
          ...prev,
          {
            id: String(Math.random()),
            user: SIMULATED_USERNAMES[Math.floor(Math.random() * SIMULATED_USERNAMES.length)],
            text: SIMULATED_CHAT_TEXTS[Math.floor(Math.random() * SIMULATED_CHAT_TEXTS.length)],
            time: timeStr
          }
        ].slice(-40)); // keep last 40 chat messages
      }

    }, delayTime);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, homeScore, awayScore, homeTeam, awayTeam, generateNewMatch, updateCashOuts, settleBets, playWhistle]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#070b14] text-zinc-100 pb-12">
      {/* Stadium ambient light overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% -20%, rgba(34,197,94,0.15), transparent 50%), radial-gradient(circle at 100% 100%, rgba(129,140,248,0.06), transparent 45%)"
        }}
      />

      {/* Header bar */}
      <header className="relative z-20 flex items-center justify-between border-b border-white/[0.05] bg-black/35 px-4 py-3.5 backdrop-blur-2xl sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-emerald-400/30 hover:text-white"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Oyunlar
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/[0.06]" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-400/80 leading-none">
              Sanal Lig Simültörü
            </p>
            <h2 className="bg-gradient-to-r from-emerald-300 to-indigo-400 bg-clip-text text-sm font-bold text-transparent">
              İddia Pro Live
            </h2>
          </div>
        </div>

        {/* Balance Panel */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[8px] font-bold text-zinc-600 uppercase block tracking-[0.15em] leading-none">SANAL BAKİYE</span>
            <span className="font-mono text-emerald-300 font-bold text-sm">
              {balance.toLocaleString("tr-TR")} TL
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setMuted(!muted)}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-xs text-zinc-500 hover:text-white hover:border-white/[0.12] transition"
              title="Sesi Aç/Kapat"
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={resetBalance}
              className="rounded-xl border border-emerald-500/15 bg-emerald-500/8 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/15 transition"
            >
              Sıfırla
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid: Pitch Scoreboard vs Bet Console vs Chat */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 gap-6 p-4 sm:p-6 lg:grid-cols-12 lg:p-8">
        
        {/* LEFT & CENTER (8 Columns on desktop): The pitch & match events */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          
          {/* THE STADIUM PITCH SCOREBOARD */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#0f1f17] to-[#0a1118] p-6 shadow-2xl">
            {/* Pitch markings */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_80%)]" />
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 border-l border-white/[0.04]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-white/[0.04]" />

            {/* League info badge */}
            <div className="relative z-10 flex justify-center mb-4">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 text-[10px] font-black text-emerald-300 uppercase tracking-widest">
                {homeTeam.league} • CANLI SIMÜLASYON
              </span>
            </div>

            {/* Scoreboard Arena */}
            <div className="relative z-10 grid grid-cols-7 items-center gap-2">
              
              {/* Home Team */}
              <div className="col-span-2 flex flex-col items-center text-center">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-3.5 shadow-lg border-2 transition-transform duration-300"
                  style={{
                    backgroundColor: `${homeTeam.primaryColor}15`,
                    borderColor: homeTeam.primaryColor
                  }}
                >
                  <img src={homeTeam.logo} alt={homeTeam.name} className="w-full h-full object-contain" />
                </div>
                <h3 className="mt-3 text-xs sm:text-sm font-black text-white">{homeTeam.name}</h3>
                <span className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">{homeTeam.shortName}</span>
              </div>

              {/* Central score and time */}
              <div className="col-span-3 flex flex-col items-center justify-center">
                {/* Time Indicator */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {phase !== "betting" && phase !== "finished" && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    )}
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="font-mono text-xs font-black text-zinc-400 tracking-wider">
                    {phase === "betting" ? "ISINIYORLAR" : phase === "halfTime" ? "DEVRE ARASI" : phase === "finished" ? "MAÇ SONU" : `${minute}'`}
                  </span>
                </div>

                {/* Score */}
                <div className="flex items-center justify-center gap-4">
                  <span className="font-mono text-3xl sm:text-5xl font-black text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                    {homeScore}
                  </span>
                  <span className="text-zinc-600 font-black text-xl sm:text-3xl">-</span>
                  <span className="font-mono text-3xl sm:text-5xl font-black text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                    {awayScore}
                  </span>
                </div>

                {/* Countdown alerts for Betting and Devre Arası */}
                {phase === "betting" && (
                  <div className="mt-4 text-center">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">MAÇ BAŞLIYOR</p>
                    <p className="font-mono text-lg font-black text-emerald-400 leading-none mt-1">
                      {countdown}s
                    </p>
                  </div>
                )}

                {phase === "halfTime" && (
                  <div className="mt-4 text-center">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">İKİNCİ YARI BAŞLIYOR</p>
                    <p className="font-mono text-lg font-black text-yellow-400 leading-none mt-1">
                      {countdown}s
                    </p>
                  </div>
                )}

                {phase === "finished" && (
                  <div className="mt-4 text-center">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">SONRAKİ MAÇ</p>
                    <p className="font-mono text-lg font-black text-indigo-400 leading-none mt-1">
                      {countdown}s
                    </p>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="col-span-2 flex flex-col items-center text-center">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-3.5 shadow-lg border-2 transition-transform duration-300"
                  style={{
                    backgroundColor: `${awayTeam.primaryColor}15`,
                    borderColor: awayTeam.primaryColor
                  }}
                >
                  <img src={awayTeam.logo} alt={awayTeam.name} className="w-full h-full object-contain" />
                </div>
                <h3 className="mt-3 text-xs sm:text-sm font-black text-white">{awayTeam.name}</h3>
                <span className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">{awayTeam.shortName}</span>
              </div>

            </div>

            {/* Goal scorer animation banner */}
            <AnimatePresence>
              {goalScorer && (
                <motion.div
                  initial={{ scale: 0.8, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.8, y: -20, opacity: 0 }}
                  className="absolute inset-x-6 bottom-6 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-emerald-400 bg-[#0d1c13] py-3 text-center shadow-2xl"
                >
                  <span className="text-[10px] font-black text-emerald-400 tracking-[0.25em] uppercase">⚽ GOL ATILDI!</span>
                  <span className="mt-1 text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                    {goalScorer.name}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400 mt-0.5">{goalScorer.team}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* COMMENTARY MATCH EVENTS LOG */}
          <div className="flex flex-col rounded-[2rem] border border-white/10 bg-black/45 p-5 backdrop-blur-md shadow-xl flex-1 max-h-[360px] overflow-hidden">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
              Maç Anlatımı / Canlı Akış
            </h3>
            
            <div ref={eventsContainerRef} className="flex-1 overflow-y-auto space-y-2.5 pr-2">
              {events.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 py-12 text-xs">
                  <span>Maç öncesi bahisler toplanıyor...</span>
                  <span className="mt-1">Düdük çaldığında canlı akış başlayacaktır.</span>
                </div>
              ) : (
                events.map((ev, i) => {
                  let badgeColor = "bg-zinc-800 text-zinc-400";
                  if (ev.type === "goal") badgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-400/25";
                  if (ev.type === "card" && ev.text.includes("Kırmızı")) badgeColor = "bg-red-500/15 text-red-400 border border-red-400/25";
                  if (ev.type === "card" && ev.text.includes("Sarı")) badgeColor = "bg-yellow-500/15 text-yellow-400 border border-yellow-400/25";
                  if (ev.type === "whistle") badgeColor = "bg-indigo-500/15 text-indigo-400 border border-indigo-400/25";

                  return (
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      key={i}
                      className="flex items-start gap-3 text-xs leading-relaxed"
                    >
                      <span className={`w-10 text-center font-mono font-bold py-0.5 rounded ${badgeColor} shrink-0`}>
                        {ev.minute}'
                      </span>
                      <p className="text-zinc-300 font-medium pt-0.5">{ev.text}</p>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT (4 Columns on desktop): Betting panel & chat */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          
          {/* BET CONSOLE CARD */}
          <div className="rounded-[2rem] border border-white/10 bg-black/45 p-5 backdrop-blur-md shadow-xl">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
              Bahis Paneli
            </h3>

            {/* Bet amount input field */}
            <div className="mb-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1.5">
                Bahis Tutarı (TL)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={phase !== "betting"}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono font-bold text-white text-sm outline-none focus:border-emerald-500/50"
                  placeholder="Bahis girin"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button 
                    onClick={() => setBetAmount(String(Math.max(100, Number(betAmount) - 100)))} 
                    disabled={phase !== "betting"}
                    className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-zinc-400 hover:text-white"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => setBetAmount(String(Number(betAmount) + 500))} 
                    disabled={phase !== "betting"}
                    className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-zinc-400 hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Odds / Outcomes */}
            <div className="space-y-3">
              {phase === "betting" ? (
                <>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Maç Sonucu Oranları</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handlePlaceBet("1", odds1)}
                      className="group flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center transition hover:bg-emerald-500/10 hover:border-emerald-500/30"
                    >
                      <span className="text-[9px] font-bold text-zinc-500 group-hover:text-emerald-400 uppercase">1 (Ev)</span>
                      <span className="font-mono text-sm font-black text-white mt-0.5">{odds1}</span>
                    </button>
                    <button
                      onClick={() => handlePlaceBet("X", oddsX)}
                      className="group flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center transition hover:bg-emerald-500/10 hover:border-emerald-500/30"
                    >
                      <span className="text-[9px] font-bold text-zinc-500 group-hover:text-emerald-400 uppercase">X (Ber)</span>
                      <span className="font-mono text-sm font-black text-white mt-0.5">{oddsX}</span>
                    </button>
                    <button
                      onClick={() => handlePlaceBet("2", odds2)}
                      className="group flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center transition hover:bg-emerald-500/10 hover:border-emerald-500/30"
                    >
                      <span className="text-[9px] font-bold text-zinc-500 group-hover:text-emerald-400 uppercase">2 (Dep)</span>
                      <span className="font-mono text-sm font-black text-white mt-0.5">{odds2}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5">2.5 Gol Alt/Üst</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handlePlaceBet("over", oddsOver)}
                          className="group flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] py-2 text-center transition hover:bg-emerald-500/10 hover:border-emerald-500/30"
                        >
                          <span className="text-[8px] font-bold text-zinc-500 group-hover:text-emerald-400 uppercase">ÜST</span>
                          <span className="font-mono text-xs font-black text-white mt-0.5">{oddsOver}</span>
                        </button>
                        <button
                          onClick={() => handlePlaceBet("under", oddsUnder)}
                          className="group flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] py-2 text-center transition hover:bg-emerald-500/10 hover:border-emerald-500/30"
                        >
                          <span className="text-[8px] font-bold text-zinc-500 group-hover:text-emerald-400 uppercase">ALT</span>
                          <span className="font-mono text-xs font-black text-white mt-0.5">{oddsUnder}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1.5">Karşılıklı Gol (KG)</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handlePlaceBet("kgVar", oddsKgVar)}
                          className="group flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] py-2 text-center transition hover:bg-emerald-500/10 hover:border-emerald-500/30"
                        >
                          <span className="text-[8px] font-bold text-zinc-500 group-hover:text-emerald-400 uppercase">VAR</span>
                          <span className="font-mono text-xs font-black text-white mt-0.5">{oddsKgVar}</span>
                        </button>
                        <button
                          onClick={() => handlePlaceBet("kgYok", oddsKgYok)}
                          className="group flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] py-2 text-center transition hover:bg-emerald-500/10 hover:border-emerald-500/30"
                        >
                          <span className="text-[8px] font-bold text-zinc-500 group-hover:text-emerald-400 uppercase">YOK</span>
                          <span className="font-mono text-xs font-black text-white mt-0.5">{oddsKgYok}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-xs font-semibold text-zinc-500">
                  ⚠️ Maç başladı, yeni bahis alımı kapandı.
                </div>
              )}
            </div>

            {/* Active bets and cash-outs (The "Zeppelin" cash-out aspect) */}
            {activeBets.length > 0 && (
              <div className="mt-5 border-t border-white/5 pt-4">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2.5">Aktif Kuponlarım</p>
                <div className="space-y-3">
                  {activeBets.map((bet, index) => {
                    const typeLabel = bet.type === "1" ? "Ev Sahibi" : bet.type === "2" ? "Deplasman" : bet.type === "X" ? "Beraberlik" : bet.type === "over" ? "2.5 Üst" : bet.type === "under" ? "2.5 Alt" : bet.type === "kgVar" ? "KG Var" : "KG Yok";
                    return (
                      <div 
                        key={index}
                        className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-black text-zinc-400">{typeLabel}</span>
                            <span className="font-mono text-zinc-500 ml-1.5">@{bet.odds}</span>
                          </div>
                          <span className="font-mono text-zinc-400">{bet.amount} TL</span>
                        </div>

                        {/* Cash out or result state */}
                        {bet.cashedOut ? (
                          <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-center py-2 text-xs font-black text-emerald-400 uppercase">
                            BOZDURULDU!
                          </div>
                        ) : bet.resolved !== null ? (
                          <div className={`rounded-xl text-center py-2 text-xs font-black uppercase ${
                            bet.resolved === "won" 
                              ? "bg-emerald-500/10 border border-emerald-400/20 text-emerald-400" 
                              : "bg-red-500/10 border border-red-400/20 text-red-400"
                          }`}>
                            {bet.resolved === "won" ? "KAZANDI!" : "KAYBETTİ!"}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCashOut(index)}
                            disabled={bet.cashOutAmount === null || bet.cashOutAmount <= 0}
                            className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 active:scale-[0.98] py-2.5 font-black text-slate-950 text-xs shadow-md border border-white/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            <span>BAHSİ BOZDUR:</span>
                            <span className="font-mono">
                              +{bet.cashOutAmount?.toLocaleString("tr-TR") ?? 0} TL
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SIMULATED LIVE SOHBET / CHAT PANEL */}
          <div className="flex flex-col rounded-[2rem] border border-white/10 bg-black/45 p-5 backdrop-blur-md shadow-xl h-[280px] overflow-hidden">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2 flex items-center justify-between">
              <span>Canlı Sohbet</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
              {chat.map((msg) => (
                <div key={msg.id} className="leading-snug">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-zinc-400">{msg.user}</span>
                    <span className="text-[9px] text-zinc-600 font-mono">{msg.time}</span>
                  </div>
                  <p className="text-zinc-300 font-medium">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR MATCH HISTORY WIDGET */}
          {matchHistory.length > 0 && (
            <div className="flex flex-col rounded-[2rem] border border-white/10 bg-black/45 p-5 backdrop-blur-md shadow-xl max-h-[320px] overflow-hidden">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                Son Sonuçlar / Maç Geçmişi
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {matchHistory.map((h, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1.5 bg-black/35 rounded-lg p-1 border border-white/[0.04]">
                        <img src={h.homeLogo} alt="home" className="w-4 h-4 object-contain" />
                        <img src={h.awayLogo} alt="away" className="w-4 h-4 object-contain" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-300 block">{h.teams}</span>
                        <span className="text-[8px] font-medium text-zinc-500 block leading-none mt-0.5">Kazanan: {h.winner}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                      {h.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
