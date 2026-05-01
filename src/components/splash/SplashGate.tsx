"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

/** Splash toplam süre (ms) — her girişte aynı. */
const SPLASH_TOTAL_MS = 2800;

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [shuttersClosed, setShuttersClosed] = useState(false);

  useLayoutEffect(() => {
    const t = window.setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShuttersClosed(true));
      });
    }, 100);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(onDone, SPLASH_TOTAL_MS);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[2147483646] flex flex-col bg-black text-zinc-100"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
      role="dialog"
      aria-label="ZEPLINPRO"
      aria-busy="true"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[10] h-1/2 origin-top bg-gradient-to-b from-black via-zinc-950 to-zinc-900/95 shadow-[0_16px_48px_rgba(0,0,0,0.75)] transition-transform duration-[950ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          transform: shuttersClosed ? "translateY(0)" : "translateY(-100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[10] h-1/2 origin-bottom bg-gradient-to-t from-black via-zinc-950 to-zinc-900/95 shadow-[0_-16px_48px_rgba(0,0,0,0.75)] transition-transform duration-[950ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          transform: shuttersClosed ? "translateY(0)" : "translateY(100%)",
        }}
        aria-hidden
      />

      <div className="relative z-[30] flex min-h-0 flex-1 items-center justify-center px-4">
        <h1 className="text-center font-sans text-[clamp(1.35rem,8vw,2.75rem)] font-bold uppercase tracking-[0.18em] text-white">
          ZEPLINPRO
        </h1>
      </div>
    </div>
  );
}

export function SplashGate({ children }: { children: React.ReactNode }) {
  const [passed, setPassed] = useState(false);

  const finish = useCallback(() => {
    setPassed(true);
  }, []);

  if (passed) return <>{children}</>;

  return <SplashScreen onDone={finish} />;
}
