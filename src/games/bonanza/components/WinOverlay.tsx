"use client";

import { AnimatePresence, motion } from "framer-motion";

type Props = {
  amount: number;
  visible: boolean;
  multiplier: number;
  showMultiplier: boolean;
  celebrationMessage: string | null;
  formatCoins: (n: number) => string;
};

export function WinOverlay({
  amount,
  visible,
  multiplier,
  showMultiplier,
  celebrationMessage,
  formatCoins,
}: Props) {
  return (
    <AnimatePresence>
      {visible && amount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -16 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-4 sm:top-6"
        >
          <div
            className="rounded-2xl px-8 py-3.5 text-center backdrop-blur-xl sm:py-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(251,191,36,0.28), rgba(236,72,153,0.22), rgba(168,85,247,0.28))",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 60px rgba(251,191,36,0.35)",
            }}
          >
            {celebrationMessage && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-1 text-sm font-bold tracking-widest text-amber-200/90 sm:text-base"
              >
                {celebrationMessage}
              </motion.p>
            )}
            <motion.p
              key={amount}
              initial={{ scale: 1.35, y: -6 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="font-money text-2xl font-bold tracking-wide text-amber-50 sm:text-4xl"
            >
              +{formatCoins(amount)}
            </motion.p>
            {showMultiplier && multiplier > 1 && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-1 font-mono text-sm text-amber-200/90 sm:text-base"
              >
                ×{multiplier} çarpan uygulandı
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
