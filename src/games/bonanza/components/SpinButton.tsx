"use client";

import { motion } from "framer-motion";

type Props = {
  onClick: () => void;
  disabled: boolean;
  spinning: boolean;
  autoActive: boolean;
  freeSpin?: boolean;
};

export function SpinButton({ onClick, disabled, spinning, autoActive, freeSpin }: Props) {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="pointer-events-none absolute h-24 w-24 rounded-full bg-pink-500/30 blur-2xl sm:h-28 sm:w-28"
        animate={{
          scale: spinning ? [1, 1.2, 1] : [1, 1.08, 1],
          opacity: spinning ? [0.5, 0.8, 0.5] : [0.35, 0.55, 0.35],
        }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.03 }}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        className="relative overflow-hidden rounded-[1.75rem] px-14 py-5 text-xl font-bold tracking-[0.25em] text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-16 sm:py-6 sm:text-2xl"
        style={{
          background:
            "linear-gradient(135deg, #ec4899 0%, #d946ef 35%, #a855f7 70%, #7c3aed 100%)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.2) inset, 0 8px 32px rgba(236,72,153,0.45), 0 0 48px rgba(192,38,211,0.35)",
        }}
      >
        <span className="relative z-10 drop-shadow-md">
          {autoActive ? "OTO" : freeSpin ? "FREE" : spinning ? "···" : "SPIN"}
        </span>
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/25 via-transparent to-white/10"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>
    </div>
  );
}
