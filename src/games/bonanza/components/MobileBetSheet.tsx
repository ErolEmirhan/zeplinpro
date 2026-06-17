"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BetControls } from "./BetControls";
import { AutoSpinControls } from "./AutoSpinControls";
import type { AutoSpinOption, SpeedMode } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  bet: number;
  setBet: (n: number) => void;
  speedMode: SpeedMode;
  setSpeedMode: (m: SpeedMode) => void;
  autoSpin: AutoSpinOption | null;
  autoRemaining: number;
  startAuto: (o: AutoSpinOption) => void;
  stopAuto: () => void;
  disabled: boolean;
};

export function MobileBetSheet({
  open,
  onClose,
  bet,
  setBet,
  speedMode,
  setSpeedMode,
  autoSpin,
  autoRemaining,
  startAuto,
  stopAuto,
  disabled,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[75dvh] overflow-y-auto rounded-t-[1.75rem] border border-white/10 bg-[#1a0a2e]/95 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <BetControls bet={bet} setBet={setBet} disabled={disabled} />
            <div className="mt-5">
              <AutoSpinControls
                speedMode={speedMode}
                setSpeedMode={setSpeedMode}
                autoSpin={autoSpin}
                autoRemaining={autoRemaining}
                startAuto={startAuto}
                stopAuto={stopAuto}
                disabled={disabled}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
