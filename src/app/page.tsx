"use client";

import { useRouter } from "next/navigation";
import { GAMES } from "@/lib/games";

const THEME_STYLES = {
  cyan: {
    cardHover: "hover:border-cyan-500/25",
    headerBg:
      "linear-gradient(145deg, rgba(34,211,238,0.18) 0%, rgba(99,102,241,0.12) 45%, rgba(7,11,20,0.9) 100%)",
    glow: "radial-gradient(circle, rgba(34,211,238,0.55), transparent 70%)",
    badge: "text-cyan-300/70",
    button:
      "bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 shadow-[0_0_40px_rgba(34,211,238,0.2)]",
  },
  candy: {
    cardHover: "hover:border-fuchsia-500/30",
    headerBg:
      "linear-gradient(145deg, rgba(236,72,153,0.22) 0%, rgba(192,38,211,0.15) 45%, rgba(26,10,46,0.9) 100%)",
    glow: "radial-gradient(circle, rgba(236,72,153,0.55), transparent 70%)",
    badge: "text-fuchsia-300/70",
    button:
      "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 shadow-[0_0_40px_rgba(236,72,153,0.25)]",
  },
} as const;

// --- VEKTÖREL OYUN BANNERLARI (MODERN & GLASSMORPHIC) ---const ZeplinSVG = () => (
  <svg className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="160" fill="url(#zeplinBg)" />
    
    {/* Grid / Horizon Lines */}
    <path d="M0 120 H400 M0 140 H400" stroke="rgba(6,182,212,0.15)" strokeWidth="1" />
    <path d="M0 160 L150 110 M100 160 L180 110 M200 160 L200 110 M300 160 L220 110 M400 160 L250 110" stroke="rgba(6,182,212,0.15)" strokeWidth="0.8" />

    {/* Rocket exhaust plume (glowing fire) */}
    <g transform="translate(160, 42) rotate(-5)" filter="url(#highGlow)">
      <path d="M-10 12 L10 5 L40 12 L10 19 Z" fill="url(#fireGrad)" />
      <path d="M-5 12 L5 8 L20 12 L5 16 Z" fill="#ffffff" />
    </g>

    {/* Highly Detailed 3D Cyberpunk Airship */}
    <g transform="translate(195, 30) rotate(-5)" filter="url(#highGlow)">
      {/* Ship Body Shadow */}
      <ellipse cx="60" cy="42" rx="42" ry="12" fill="black" opacity="0.35" />
      
      {/* Ship Body Capsule */}
      <path d="M10 20 C10 8, 80 2, 110 20 C110 23, 115 25, 122 25 C115 27, 110 32, 95 35 C50 38, 10 32, 10 20 Z" fill="url(#shipBodyGrad)" stroke="#22d3ee" strokeWidth="1" />
      <path d="M10 20 C10 8, 80 2, 110 20 C110 23, 115 25, 122 25 C115 27, 110 32, 95 35 C50 38, 10 32, 10 20 Z" fill="url(#ship3dHighlight)" />

      {/* Cybernetic Plate Linings */}
      <path d="M35 11 Q 60 7, 85 11" stroke="rgba(34,211,238,0.5)" strokeWidth="1.2" fill="none" />
      <path d="M30 22 Q 65 18, 95 23" stroke="rgba(34,211,238,0.5)" strokeWidth="1.2" fill="none" />
      
      {/* Fin/Wings */}
      <polygon points="5,20 -15,10 -8,25 5,22" fill="url(#finGrad)" stroke="#22d3ee" strokeWidth="0.8" />
      <polygon points="12,28 -2,38 2,28" fill="url(#finGrad)" />

      {/* Cockpit Window */}
      <path d="M90 15 C 95 12, 102 15, 105 18 L100 22 C 96 20, 92 18, 90 15 Z" fill="#facc15" filter="url(#highGlow)" />
      
      {/* Jet Engine Pods */}
      <rect x="15" y="22" width="16" height="7" rx="2.5" fill="#1e1b4b" stroke="#22d3ee" strokeWidth="1" />
      <circle cx="31" cy="25.5" r="2.5" fill="#ef4444" />
    </g>

    {/* Glowing Wave/Pulse */}
    <path d="M-10 100 C 100 60, 200 130, 410 40" stroke="url(#waveGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.65" filter="url(#highGlow)" />
    <path d="M-10 100 C 100 60, 200 130, 410 40" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />

    {/* Premium Badge "ZEPLIN LIVE" */}
    <g transform="translate(25, 25)">
      <rect width="110" height="24" rx="12" fill="rgba(34,211,238,0.12)" stroke="rgba(34,211,238,0.3)" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="#22d3ee" />
      <text x="68" y="15" fill="#22d3ee" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1.5">ZEPLIN LIVE</text>
    </g>

    <defs>
      <linearGradient id="zeplinBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#080711" />
        <stop offset="50%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="waveGrad" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
        <stop offset="50%" stopColor="#0891b2" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
      </linearGradient>
      <linearGradient id="shipBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="60%" stopColor="#0e7490" />
        <stop offset="100%" stopColor="#111827" />
      </linearGradient>
      <radialGradient id="ship3dHighlight" cx="30%" cy="25%" r="75%">
        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
        <stop offset="50%" stopColor="transparent" stopOpacity="0" />
        <stop offset="100%" stopColor="black" stopOpacity="0.85" />
      </radialGradient>
      <linearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0891b2" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
        <stop offset="50%" stopColor="#fb923c" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#f43f5e" stopOpacity="1" />
      </linearGradient>
      <filter id="highGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  </svg>
);

const BonanzaSVG = () => (
  <svg className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="160" fill="url(#bonanzaBg)" />

    {/* Candy Cloud Glows */}
    <circle cx="340" cy="30" r="70" fill="rgba(219,39,119,0.25)" filter="url(#candyGlowFilter)" />
    <circle cx="60" cy="120" r="60" fill="rgba(192,38,211,0.2)" filter="url(#candyGlowFilter)" />

    {/* Detailed 3D Swirl Lollipop */}
    <g transform="translate(280, 20)" filter="url(#candyGlowFilter)">
      <ellipse cx="32" cy="72" rx="16" ry="4" fill="black" opacity="0.3" />
      <rect x="29" y="32" width="6" height="42" rx="3" fill="url(#stickGrad)" stroke="#f472b6" strokeWidth="0.8" />
      <circle cx="32" cy="32" r="28" fill="url(#lollyGrad)" stroke="#db2777" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="28" fill="url(#lollyHighlight)" />
      <path d="M 32 32 A 4 4 0 0 1 36 36 A 8 8 0 0 1 28 40 A 12 12 0 0 1 20 28 A 16 16 0 0 1 36 16 A 20 20 0 0 1 52 32" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
    </g>

    {/* 3D Glossy Candy Gem */}
    <g transform="translate(60, 45)" filter="url(#candyGlowFilter)">
      <polygon points="10,38 30,38 36,42 4,42" fill="black" opacity="0.4" />
      <polygon points="4,20 20,26 20,38 4,32" fill="#d946ef" />
      <polygon points="20,26 36,20 36,32 20,38" fill="#a21caf" />
      <polygon points="20,8 36,20 20,26 4,20" fill="url(#gemTopPinkGrad)" stroke="#f0abfc" strokeWidth="1" />
      <circle cx="20" cy="18" r="1.5" fill="#fff" />
    </g>

    {/* Small Spherical Candy ball */}
    <g transform="translate(160, 95) scale(0.8)" filter="url(#candyGlowFilter)">
      <circle cx="15" cy="15" r="12" fill="url(#blueCandyGrad)" />
      <circle cx="15" cy="15" r="12" fill="url(#lollyHighlight)" />
    </g>

    {/* Floating Candy Star */}
    <g transform="translate(195, 30) rotate(15) scale(0.95)" filter="url(#candyGlowFilter)">
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
    </g>

    {/* Huge Glowing Badge "SWEET SPIN" */}
    <g transform="translate(25, 25)">
      <rect width="115" height="24" rx="12" fill="rgba(236,72,153,0.12)" stroke="rgba(236,72,153,0.35)" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.5" fill="#ec4899" />
      <text x="71" y="15" fill="#f472b6" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1.5">SWEET SPIN</text>
    </g>

    <defs>
      <linearGradient id="bonanzaBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e0b36" />
        <stop offset="50%" stopColor="#3b0728" />
        <stop offset="100%" stopColor="#12021c" />
      </linearGradient>
      <linearGradient id="lollyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="50%" stopColor="#db2777" />
        <stop offset="100%" stopColor="#831843" />
      </linearGradient>
      <radialGradient id="lollyHighlight" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="white" stopOpacity="0.45" />
        <stop offset="60%" stopColor="transparent" stopOpacity="0" />
        <stop offset="100%" stopColor="black" stopOpacity="0.75" />
      </radialGradient>
      <linearGradient id="stickGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f472b6" />
      </linearGradient>
      <linearGradient id="gemTopPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fdf4ff" />
        <stop offset="100%" stopColor="#f0abfc" />
      </linearGradient>
      <linearGradient id="blueCandyGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
      <filter id="candyGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  </svg>
);

const IddiaSVG = () => (
  <svg className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="160" fill="url(#iddiaBg)" />
    
    {/* FIFA/EA FC style futuristic polygonal grid background */}
    <path d="M-20 100 L160 50 L420 120 M-20 140 L240 70 L420 150" stroke="rgba(16,185,129,0.15)" strokeWidth="1" />
    <path d="M0 160 L180 80 M100 160 L240 80 M200 160 L300 80 M300 160 L360 80" stroke="rgba(16,185,129,0.1)" strokeWidth="0.8" />
    
    {/* Futuristic EA FC polygon cursor / player indicator */}
    <g transform="translate(180, 50)" filter="url(#sportsGlow)">
      <polygon points="12,0 24,18 18,18 12,28 6,18 0,18" fill="url(#fcNeonGrad)" />
      <polygon points="12,4 20,16 12,22 4,16" fill="#10b981" opacity="0.6" />
    </g>

    {/* Soccer stadium glowing beams (FIFA style) */}
    <path d="M0 0 L150 160 M400 0 L250 160" stroke="rgba(52,211,153,0.08)" strokeWidth="25" filter="url(#sportsGlow)" />

    {/* 3D Soccer Ball with detailed glowing panels */}
    <g transform="translate(280, 40)" filter="url(#sportsGlow)">
      <circle cx="30" cy="30" r="28" fill="url(#ball3dGrad)" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="30" cy="30" r="28" fill="url(#ball3dShadow)" />
      <path d="M30 2 L30 14 L18 20 L8 12 M30 14 L42 20 L52 12 M18 20 L18 34 L30 40 L42 34 L42 20 M30 40 L30 58 M8 12 L8 28 L18 34 M52 12 L52 28 L42 34 M8 28 L2 34 M52 28 L58 34 M18 20 L12 20 M42 20 L48 20" stroke="rgba(52,211,153,0.75)" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="30,14 42,20 42,34 30,40 18,34 18,20" fill="rgba(16,185,129,0.3)" stroke="#10b981" strokeWidth="1" />
    </g>

    {/* EA FC Playstyles/Badge UI overlay */}
    <g transform="translate(30, 95)" filter="url(#sportsGlow)">
      <polygon points="10,0 20,18 0,18" fill="#10b981" />
      <text x="32" y="14" fill="#34d399" fontSize="10" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">PLAYSTYLE+</text>
    </g>

    {/* Live Match Badge */}
    <g transform="translate(25, 25)">
      <rect width="120" height="24" rx="6" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
      <circle cx="14" cy="12" r="3.5" fill="#10b981" />
      <text x="73" y="15" fill="#34d399" fontSize="8" fontWeight="950" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1.5">FC 26 SIMULATE</text>
    </g>

    <defs>
      <linearGradient id="iddiaBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#021f15" />
        <stop offset="45%" stopColor="#03120e" />
        <stop offset="100%" stopColor="#050811" />
      </linearGradient>
      <linearGradient id="fcNeonGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#52e597" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
      <linearGradient id="ball3dGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="60%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>
      <radialGradient id="ball3dShadow" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="white" stopOpacity="0.35" />
        <stop offset="50%" stopColor="transparent" stopOpacity="0" />
        <stop offset="100%" stopColor="black" stopOpacity="0.75" />
      </radialGradient>
      <filter id="sportsGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  </svg>
);

const PatladinSVG = () => (
  <svg className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="160" fill="url(#patladinBg)" />
    
    {/* Cybernetic grid perspective background */}
    <path d="M-50 140 L150 70 L450 140 M-50 160 L150 90 L450 160" stroke="rgba(244,63,94,0.12)" strokeWidth="1" />
    <path d="M30 160 L130 90 M100 160 L170 90 M200 160 L220 90 M300 160 L270 90" stroke="rgba(244,63,94,0.1)" strokeWidth="0.8" />

    {/* Glowing 3D bomb */}
    <g transform="translate(260, 35)" filter="url(#mineGlow)">
      <ellipse cx="30" cy="55" rx="22" ry="6" fill="black" opacity="0.4" />
      <circle cx="30" cy="32" r="22" fill="url(#bombBodyGrad)" stroke="#f43f5e" strokeWidth="1.5" />
      <circle cx="30" cy="32" r="22" fill="url(#bomb3dHighlight)" />
      <rect x="25" y="8" width="10" height="4" rx="1.5" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
      <path d="M30 8 Q 36 0, 44 4" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <g transform="translate(44, 4)">
        <circle cx="0" cy="0" r="4.5" fill="#facc15" />
        <path d="M-6 0 L6 0 M0 -6 L0 6 M-4 -4 L4 4 M-4 4 L4 -4" stroke="#ffffff" strokeWidth="1.2" />
      </g>
    </g>

    {/* 3D Mini Green Diamond Box 1 */}
    <g transform="translate(70, 50)" filter="url(#mineGlow)">
      <polygon points="15,42 35,42 42,47 8,47" fill="black" opacity="0.4" />
      <polygon points="5,20 20,28 20,42 5,34" fill="#047857" />
      <polygon points="20,28 35,20 35,34 20,42" fill="#065f46" />
      <polygon points="20,10 35,20 20,28 5,20" fill="url(#gemTopGrad)" stroke="#10b981" strokeWidth="1" />
      <circle cx="20" cy="20" r="1.5" fill="#ffffff" />
    </g>

    {/* 3D Mini Green Diamond Box 2 (Smaller, floating) */}
    <g transform="translate(130, 85) scale(0.75)" filter="url(#mineGlow)">
      <polygon points="5,20 20,28 20,42 5,34" fill="#047857" />
      <polygon points="20,28 35,20 35,34 20,42" fill="#065f46" />
      <polygon points="20,10 35,20 20,28 5,20" fill="url(#gemTopGrad)" stroke="#10b981" strokeWidth="1" />
    </g>

    {/* Floating neon multipliers */}
    <g transform="translate(160, 35)">
      <rect width="60" height="20" rx="6" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
      <text x="30" y="14" fill="#34d399" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="monospace">x1.27</text>
    </g>
    <g transform="translate(185, 65)">
      <rect width="60" height="20" rx="6" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />
      <text x="30" y="14" fill="#34d399" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="monospace">x2.53</text>
    </g>

    {/* Live Status Badge */}
    <g transform="translate(25, 25)">
      <rect width="115" height="24" rx="12" fill="rgba(244,63,94,0.12)" stroke="rgba(244,63,94,0.35)" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.5" fill="#f43f5e" />
      <text x="71" y="15" fill="#fb7185" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1.5">PATLADIN KANKA</text>
    </g>

    <defs>
      <linearGradient id="patladinBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e020c" />
        <stop offset="50%" stopColor="#140216" />
        <stop offset="100%" stopColor="#08000a" />
      </linearGradient>
      <linearGradient id="bombBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fda4af" />
        <stop offset="40%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#4c0519" />
      </linearGradient>
      <radialGradient id="bomb3dHighlight" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
        <stop offset="40%" stopColor="transparent" stopOpacity="0" />
        <stop offset="100%" stopColor="black" stopOpacity="0.8" />
      </radialGradient>
      <linearGradient id="gemTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6ee7b7" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
      <filter id="mineGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  </svg>
);

export default function GamesPage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#060a12] text-zinc-100">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -25%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(ellipse 55% 45% at 100% 0%, rgba(129,140,248,0.14), transparent 50%), radial-gradient(ellipse 40% 35% at 0% 100%, rgba(236,72,153,0.1), transparent 50%)",
        }}
      />
      {/* Noise texture overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-black/30 px-4 py-5 backdrop-blur-2xl sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Logo icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-300/70">
                Zeplinpro
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Oyunlar
              </h1>
            </div>
          </div>
          {/* Version badge */}
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-zinc-400">v2.0</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-400">
            Bir oyun seç ve oyna.{" "}
            <span className="text-zinc-500">Tüm oyunlar sanal bakiye ile — gerçek para yok.</span>
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {GAMES.map((game) => {
            const theme = THEME_STYLES[game.theme];
            return (
              <article
                key={game.id}
                onClick={() => router.push(game.joinPath)}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-white/[0.15] hover:bg-white/[0.06] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] hover:-translate-y-1`}
              >
                {/* Banner section */}
                <div
                  className="relative flex h-40 items-end overflow-hidden p-5 sm:h-44"
                  style={{ background: theme.headerBg }}
                >
                  {game.id === "zeplin" && <ZeplinSVG />}
                  {game.id === "bonanza" && <BonanzaSVG />}
                  {game.id === "iddia" && <IddiaSVG />}
                  {game.id === "patladin" && <PatladinSVG />}
                  <div
                    className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full opacity-30 blur-3xl transition-all duration-700 group-hover:opacity-50 group-hover:scale-110"
                    style={{ background: theme.glow }}
                  />
                  <div className="relative z-10">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme.badge}`}
                    >
                      {game.badge}
                    </p>
                    <h2 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                      {game.name}
                    </h2>
                  </div>
                </div>

                {/* Content section */}
                <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
                  <p className="text-sm font-semibold text-zinc-200">
                    {game.tagline}
                  </p>
                  <p className="flex-1 text-xs leading-relaxed text-zinc-500">
                    {game.description}
                  </p>
                  <div
                    className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all duration-300 group-hover:brightness-110 ${theme.button} ${game.theme === "cyan" ? "text-slate-950" : "text-white"}`}
                  >
                    <span>Oyna</span>
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-white/[0.04] pt-8">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-cyan-400/60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-zinc-600">Zeplinpro</span>
          </div>
          <p className="text-center text-[10px] leading-relaxed text-zinc-600">
            Bu yazılım yalnızca eğlence içindir · Gerçek para veya kumar içermez
          </p>
        </div>
      </main>
    </div>
  );
}
