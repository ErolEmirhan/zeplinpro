"use client";

import type { FC } from "react";
import type { SymbolId } from "../types";

type Props = { size?: number; className?: string };

export const ScatterArt: FC<Props> = ({ size = 64, className = "" }) => (
  <div
    className={`relative select-none flex items-center justify-center ${className}`}
    style={{
      width: size,
      height: size,
      filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))"
    }}
  >
    <img
      src="/images/symbols/scatter.png"
      alt="Lollipop Scatter"
      className="w-full h-full object-contain"
      draggable={false}
    />
  </div>
);

export const BombArt: FC<Props & { multiplier: number }> = ({ size = 64, className = "", multiplier }) => {
  // Determine which bomb asset to use based on the multiplier value (Heybetli çarpanlar)
  let bombSrc = "/images/symbols/bomb_low.png";
  if (multiplier >= 50) {
    bombSrc = "/images/symbols/bomb_high.png"; // Ultra majestic (Gold/Rainbow with Crown)
  } else if (multiplier >= 10) {
    bombSrc = "/images/symbols/bomb_med.png";  // Majestic (Purple with Stars & Sparks)
  }

  return (
    <div
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.4))"
      }}
    >
      <img
        src={bombSrc}
        alt={`${multiplier}x Bomb`}
        className="w-full h-full object-contain"
        draggable={false}
      />
      {/* Overlay text for the multiplier value styled beautifully like Sweet Bonanza */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "translateY(5px)" }}>
        <span
          className="font-black text-white tracking-tighter"
          style={{
            fontSize: `${size * 0.30}px`,
            fontFamily: "var(--font-money), 'Arial Black', sans-serif",
            textShadow: `
              -2px -2px 0 #000,  
               2px -2px 0 #000,
              -2px  2px 0 #000,
               2px  2px 0 #000,
               -3px -3px 0 #000,  
               3px -3px 0 #000,
              -3px  3px 0 #000,
               3px  3px 0 #000,
               0 4px 6px rgba(0,0,0,0.7)
            `
          }}
        >
          {multiplier}x
        </span>
      </div>
    </div>
  );
};

export function SymbolArt({ symbol, size = 64, className = "" }: Props & { symbol: SymbolId }) {
  return (
    <div
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
      }}
    >
      <img
        src={`/images/symbols/${symbol}.png`}
        alt={symbol}
        className="w-full h-full object-contain transition-transform duration-200"
        draggable={false}
      />
    </div>
  );
}
