"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { CascadeMeta, GamePhase, Grid, WinCluster, SpeedMode } from "../types";
import { COLS } from "../types";
import { isCellWinning, SymbolCell } from "./SymbolCell";
import { particlePool } from "../animations/particles";

type Props = {
  grid: Grid | null;
  activeWins: WinCluster[];
  phase: GamePhase;
  cascadeMeta: CascadeMeta | null;
  speedMode: SpeedMode;
};

function GridColumn({
  col,
  cells,
  activeWins,
  exploding,
  cascadeMeta,
  speedMode,
  phase,
  onBurst,
}: {
  col: number;
  cells: Grid["0"];
  activeWins: WinCluster[];
  exploding: boolean;
  cascadeMeta: CascadeMeta | null;
  speedMode: SpeedMode;
  phase: GamePhase;
  onBurst: (x: number, y: number, color: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 sm:gap-1.5">
      {cells.map((cell, row) => (
        <SymbolCell
          key={cell.id}
          col={col}
          row={row}
          speedMode={speedMode}
          phase={phase}
          cell={cell}
          isWinning={isCellWinning(col, row, activeWins)}
          exploding={exploding && isCellWinning(col, row, activeWins)}
          fallRows={cascadeMeta?.fallRows[cell.id] ?? 0}
          onBurst={onBurst}
        />
      ))}
    </div>
  );
}

const MemoColumn = memo(GridColumn);

export function GameGrid({ grid, activeWins, phase, cascadeMeta, speedMode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) particlePool.attach(canvasRef.current);
    return () => particlePool.detach();
  }, []);

  const onBurst = useCallback((x: number, y: number, color: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    particlePool.burst(x - rect.left, y - rect.top, color);
  }, []);

  const exploding = phase === "exploding";

  if (!grid) {
    return (
      <div className="aspect-[6/5] w-full max-w-[min(100%,560px)] animate-pulse rounded-[2rem] bg-white/5" />
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-[min(100%,560px)]">
      <motion.div
        className="relative overflow-hidden rounded-[2rem] border border-fuchsia-400/25 p-2 sm:p-3"
        style={{
          background:
            "linear-gradient(165deg, rgba(88,28,135,0.55) 0%, rgba(46,16,74,0.85) 40%, rgba(24,8,40,0.95) 100%)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.06) inset, 0 25px 80px rgba(0,0,0,0.55), 0 0 60px rgba(192,38,211,0.2)",
        }}
        animate={
          phase === "spinning"
            ? { scale: [1, 1.008, 1], boxShadow: ["0 0 60px rgba(192,38,211,0.2)", "0 0 80px rgba(236,72,153,0.35)", "0 0 60px rgba(192,38,211,0.2)"] }
            : { scale: 1 }
        }
        transition={{ duration: 0.6 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(236,72,153,0.15),transparent_55%)]" />
        <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
          {Array.from({ length: COLS }, (_, c) => (
            <MemoColumn
              key={c}
              col={c}
              cells={grid[c]}
              activeWins={activeWins}
              exploding={exploding}
              cascadeMeta={cascadeMeta}
              speedMode={speedMode}
              phase={phase}
              onBurst={onBurst}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10" />
      </motion.div>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      />
    </div>
  );
}
