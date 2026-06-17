"use client";

import { motion } from "framer-motion";

const FLOATERS = [
  { e: "🍬", x: "8%", y: "12%", d: 5.2, delay: 0 },
  { e: "🍭", x: "88%", y: "18%", d: 4.8, delay: 0.6 },
  { e: "✨", x: "15%", y: "72%", d: 6, delay: 1.2 },
  { e: "💜", x: "82%", y: "65%", d: 5.5, delay: 0.3 },
  { e: "🍇", x: "5%", y: "42%", d: 7, delay: 1.8 },
  { e: "🍉", x: "92%", y: "38%", d: 6.2, delay: 0.9 },
];

export function FloatingCandies() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl opacity-[0.18] sm:text-4xl"
          style={{ left: f.x, top: f.y }}
          animate={{
            y: [0, -24, 0],
            x: [0, i % 2 ? 10 : -10, 0],
            rotate: [0, 15, -10, 0],
            opacity: [0.1, 0.22, 0.1],
          }}
          transition={{
            duration: f.d,
            repeat: Infinity,
            delay: f.delay,
            ease: "easeInOut",
          }}
        >
          {f.e}
        </motion.span>
      ))}
      <div className="absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-3xl" />
      <div className="absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
    </div>
  );
}

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-80"
        animate={{ opacity: [0.7, 0.9, 0.7] }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% -15%, rgba(192,38,211,0.4), transparent 55%), radial-gradient(ellipse 55% 45% at 95% 20%, rgba(236,72,153,0.25), transparent 50%), radial-gradient(ellipse 50% 40% at 5% 75%, rgba(124,58,237,0.3), transparent 45%), linear-gradient(180deg, #0a0412 0%, #150820 40%, #0d0618 100%)",
        }}
      />
      <FloatingCandies />
    </div>
  );
}
