import type { SpeedMode } from "../types";

export const SPEED_DELAYS: Record<
  SpeedMode,
  {
    spin: number;
    explode: number;
    cascade: number;
    celebration: number;
    autoGap: number;
    landStagger: number;
  }
> = {
  normal: {
    spin: 720,
    explode: 580,
    cascade: 520,
    celebration: 1400,
    autoGap: 500,
    landStagger: 45,
  },
  fast: {
    spin: 380,
    explode: 300,
    cascade: 280,
    celebration: 700,
    autoGap: 250,
    landStagger: 22,
  },
  turbo: {
    spin: 120,
    explode: 90,
    cascade: 80,
    celebration: 250,
    autoGap: 80,
    landStagger: 8,
  },
};
