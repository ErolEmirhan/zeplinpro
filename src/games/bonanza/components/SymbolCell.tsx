"use client";

import { memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  SymbolArt,
  ScatterArt,
  BombArt,
} from "../assets/SymbolArt";
import { SYMBOL_META } from "../engine/constants";
import { EASE } from "../animations/easing";
import type { GridCell, SpeedMode, GamePhase } from "../types";

type Props = {
  cell: GridCell;
  isWinning: boolean;
  exploding: boolean;
  fallRows: number;
  col?: number;
  row?: number;
  speedMode?: SpeedMode;
  phase?: GamePhase;
  onBurst?: (x: number, y: number, color: string) => void;
};

function SymbolCellInner({
  cell,
  isWinning,
  exploding,
  fallRows,
  col,
  row,
  speedMode = "normal",
  phase = "idle",
  onBurst,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const burstRef = useRef(false);

  useEffect(() => {
    if (exploding && !burstRef.current && onBurst && ref.current) {
      burstRef.current = true;
      const rect = ref.current.getBoundingClientRect();
      let color = "#f472b6";
      if (cell.kind === "bomb") color = "rgba(250,204,21,0.95)";
      else if (cell.kind === "scatter") color = "rgba(250,204,21,0.85)";
      else color = SYMBOL_META[cell.symbol!]?.accent ?? color;
      onBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, color);
    }
    if (!exploding) burstRef.current = false;
  }, [exploding, cell, onBurst]);

  // Compute staggered delay depending on the current speed mode when reel spinning
  const isSpinning = phase === "spinning";
  let staggerDelay = 0.08;
  if (speedMode === "fast") staggerDelay = 0.04;
  if (speedMode === "turbo") staggerDelay = 0.01;
  const delayVal = isSpinning && col !== undefined ? col * staggerDelay : 0;

  // Professional physics-based spring config adapting to speed mode
  const springConfig = {
    type: "spring" as const,
    stiffness: speedMode === "turbo" ? 240 : speedMode === "fast" ? 180 : 120,
    damping: speedMode === "turbo" ? 22 : speedMode === "fast" ? 16 : 13,
    mass: 1.0,
    delay: delayVal,
  };

  const wrap = (children: React.ReactNode, glow?: string) => (
    <motion.div
      ref={ref}
      layout="position"
      className="relative flex aspect-square w-full items-center justify-center p-[4%]"
      initial={{ y: -450, opacity: 0 }}
      animate={
        exploding
          ? {
              scale: [1, 1.22, 1.5, 0],
              opacity: [1, 1, 0.6, 0],
              rotate: [0, 10, -14, 24],
            }
          : {
              y: 0,
              scale: isWinning ? [1, 1.14, 1.06] : 1,
              opacity: 1,
            }
      }
      transition={
        exploding
          ? { duration: 0.55, ease: EASE.explode }
          : {
              y: springConfig,
              opacity: { duration: 0.22, delay: delayVal },
              scale: isWinning
                ? { duration: 0.4, repeat: Infinity, repeatType: "reverse" }
                : { type: "spring", stiffness: 300, damping: 20 },
              layout: {
                type: "spring",
                stiffness: speedMode === "turbo" ? 360 : speedMode === "fast" ? 270 : 190,
                damping: speedMode === "turbo" ? 24 : speedMode === "fast" ? 20 : 16
              }
            }
      }
    >
      {glow && (
        <motion.div
          className="pointer-events-none absolute inset-[2%] rounded-[1.25rem]"
          animate={{
            boxShadow: [
              `0 0 16px ${glow}`,
              `0 0 32px ${glow}`,
              `0 0 16px ${glow}`,
            ],
          }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
      {children}
      {isWinning && !exploding && (
        <motion.div
          className="pointer-events-none absolute inset-[2%] rounded-[1.25rem] border-2 border-white/90"
          animate={{ opacity: [0.25, 1, 0.25], scale: [1, 1.06, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );

  if (cell.kind === "scatter") {
    return wrap(
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 6, -6, 0],
        }}
        transition={{
          scale: { duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          rotate: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
        }}
        className="z-20 filter drop-shadow-[0_8px_16px_rgba(236,72,153,0.6)]"
      >
        <ScatterArt size={88} />
      </motion.div>,
      "rgba(250,204,21,0.85)", // Vibrant gold/pink scatter glow
    );
  }

  if (cell.kind === "bomb") {
    return wrap(
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="z-10"
      >
        <BombArt multiplier={cell.multiplier ?? 2} size={76} />
      </motion.div>,
      "rgba(250,204,21,0.75)"
    );
  }

  const meta = SYMBOL_META[cell.symbol!];
  return wrap(
    <motion.div
      whileHover={{ scale: 1.08 }}
      className="relative z-10 drop-shadow-xl"
    >
      <SymbolArt symbol={cell.symbol!} size={72} />
    </motion.div>,
    meta.glow,
  );
}

export const SymbolCell = memo(SymbolCellInner);

export function isCellWinning(
  col: number,
  row: number,
  wins: import("../types").WinCluster[],
): boolean {
  return wins.some((w) =>
    w.positions.some((p) => p.col === col && p.row === row),
  );
}
