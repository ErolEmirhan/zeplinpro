export const SPRING = {
  snappy: { type: "spring" as const, stiffness: 520, damping: 28, mass: 0.8 },
  soft: { type: "spring" as const, stiffness: 320, damping: 22, mass: 1 },
  bouncy: { type: "spring" as const, stiffness: 400, damping: 14, mass: 0.9 },
  drop: { type: "spring" as const, stiffness: 450, damping: 24, mass: 1.1 },
};

export const EASE = {
  pop: [0.34, 1.56, 0.64, 1] as const,
  out: [0.22, 1, 0.36, 1] as const,
  explode: [0.6, 0.05, 0.2, 0.95] as const,
};
