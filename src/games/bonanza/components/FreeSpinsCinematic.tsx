"use client";

import { motion } from "framer-motion";
import { playSfx } from "../sounds/soundEngine";

type Props = {
  spins: number;
  multBoost: number;
  onComplete: () => void;
};

export function FreeSpinsCinematic({ spins, multBoost, onComplete }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationStart={() => {
        playSfx("freeSpins");
      }}
    >
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1.15, 1], opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => {
          window.setTimeout(onComplete, 1400);
        }}
        className="relative px-6 text-center"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-amber-300"
            style={{ left: "50%", top: "50%" }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos((i / 24) * Math.PI * 2) * (120 + Math.random() * 80),
              y: Math.sin((i / 24) * Math.PI * 2) * (80 + Math.random() * 60),
              opacity: 0,
            }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        ))}
        <motion.p
          className="text-sm font-bold uppercase tracking-[0.5em] text-fuchsia-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Bonus
        </motion.p>
        <h2
          className="mt-2 bg-gradient-to-r from-amber-200 via-pink-200 to-violet-200 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-7xl"
          style={{ textShadow: "0 0 60px rgba(236,72,153,0.5)" }}
        >
          FREE SPINS
        </h2>
        <p className="mt-4 font-money text-3xl font-bold text-amber-300 sm:text-4xl">
          {spins} Spin
        </p>
        {multBoost > 1 && (
          <p className="mt-2 text-lg text-pink-200">Başlangıç çarpanı ×{multBoost}</p>
        )}
      </motion.div>
    </motion.div>
  );
}
