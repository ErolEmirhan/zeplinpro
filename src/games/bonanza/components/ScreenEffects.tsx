"use client";

import { motion } from "framer-motion";

type Props = {
  shake: boolean;
  flash: boolean;
  children: React.ReactNode;
};

export function ScreenEffects({ shake, flash, children }: Props) {
  return (
    <motion.div
      className="relative flex min-h-dvh flex-1 flex-col"
      animate={
        shake
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0], y: [0, 4, -4, 3, -3, 0] }
          : { x: 0, y: 0 }
      }
      transition={{ duration: 0.5 }}
    >
      {children}
      {flash && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[90] bg-amber-200/30"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.div>
  );
}
