"use client";

import type { AutoSpinOption, SpeedMode } from "../types";

const AUTO_OPTS: { label: string; value: AutoSpinOption }[] = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "∞", value: "infinite" },
];

const SPEED_OPTS: { label: string; value: SpeedMode }[] = [
  { label: "Normal", value: "normal" },
  { label: "Hızlı", value: "fast" },
  { label: "Turbo", value: "turbo" },
];

type Props = {
  speedMode: SpeedMode;
  setSpeedMode: (m: SpeedMode) => void;
  autoSpin: AutoSpinOption | null;
  autoRemaining: number;
  startAuto: (o: AutoSpinOption) => void;
  stopAuto: () => void;
  disabled: boolean;
};

export function AutoSpinControls({
  speedMode,
  setSpeedMode,
  autoSpin,
  autoRemaining,
  startAuto,
  stopAuto,
  disabled,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300/70">
          Hız Modu
        </p>
        <div className="flex gap-2">
          {SPEED_OPTS.map((s) => (
            <button
              key={s.value}
              type="button"
              disabled={disabled}
              onClick={() => setSpeedMode(s.value)}
              className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
                speedMode === s.value
                  ? "border-violet-400/50 bg-violet-500/25 text-violet-100"
                  : "border-white/10 bg-white/[0.04] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300/70">
          Oto Spin
        </p>
        {autoSpin ? (
          <div className="flex items-center gap-2">
            <span className="flex-1 rounded-xl border border-pink-400/30 bg-pink-500/15 px-3 py-2 text-center text-sm text-pink-200">
              {autoSpin === "infinite"
                ? "Sonsuz"
                : `${autoRemaining} kaldı`}
            </span>
            <button
              type="button"
              onClick={stopAuto}
              className="rounded-xl border border-rose-400/40 bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-200"
            >
              Durdur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            {AUTO_OPTS.map((o) => (
              <button
                key={o.label}
                type="button"
                disabled={disabled}
                onClick={() => startAuto(o.value)}
                className="rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-semibold text-zinc-400 transition hover:border-pink-400/30 hover:text-pink-200 disabled:opacity-40"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
