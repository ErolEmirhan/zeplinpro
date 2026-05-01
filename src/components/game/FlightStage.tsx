"use client";

import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import type { CSSProperties } from "react";
import type { GameState } from "@/lib/game";
import {
  elapsedToReachMultiplier,
  EPS,
  GROWTH,
  multiplierRawAtElapsedSeconds,
  multiplierRawDerivativeAtElapsedSeconds,
} from "@/lib/multiplier";
import { multHeatStyles, multHeatFlightContext } from "@/lib/multHeat";
import {
  playBettingCountdownTick,
  playFlightStartStinger,
  playRoundCrashBurst,
  playShutterCloseInferno,
  playShutterSlide,
} from "@/lib/bettingCountdownTick";
import {
  catmullRomToSmoothPath,
  tangentDegreesAtEnd,
  trimTrailingCoincidentPoints,
  type Point2,
} from "@/lib/flightCurve";

function formatCountdown(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return "0,0";
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(sec);
}

function formatFlightElapsed(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0,00 s";
  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(sec)} s`;
}

type Props = {
  game: GameState | null;
  multLive: number | null;
  now: number;
  crashFlash: number | null;
};

/** md kırılımının altı: daha büyük grafik / zeplin için yer açarız. */
function useIsNarrowViewport() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

/** Sahne boyutu — plot için geniş alan. */
const W = 1200;
const H = 580;
/** Grafiğin sol / alt köşesi panele yakın; üst-sağdan geniş çizim alanı. */
const CHART_MARGIN_L = 32;
const CHART_MARGIN_B = 28;
const CHART_MARGIN_R = 20;
const CHART_MARGIN_T = 64;
const CHART_OX = CHART_MARGIN_L;
const CHART_OY = H - CHART_MARGIN_B;
const CHART_EDGE_R = W - CHART_MARGIN_R;
const CHART_EDGE_T = CHART_MARGIN_T;
const PLOT_W = CHART_EDGE_R - CHART_OX;
const PLOT_H = CHART_OY - CHART_EDGE_T;

const VIEW_X = -175;
const VIEW_Y = -135;
const VIEW_W = W - VIEW_X + 248;
const VIEW_H = H - VIEW_Y + 100;

/** Bahis / kepenk “uçuşa hazır” görünümü: spektrumda kırmızı 0× yerine nötr-uçuş tonu. */
const FLIGHT_IDLE_HEAT_MULT = 1;

/** Görsel eksen patlamaya bağlı değil (tahmin edilebilirlik). */
const VIS_MULT_CAP = 5000;
const VIS_Y_BAND_LO = 0.18;
const VIS_Y_BAND_HI = 0.82;
const CHART_Y_GAMMA = 0.62;
const CHART_Y_TOP_PAD = 0.04;
/**
 * Anlık çarpan artışına göre log eksenini genişlet (zoom out); hızlandıkça denge.
 */
const RATE_ZOOM_STRENGTH = 0.52;

/** Uçuş + bahis: eski nötr ince ızgara. */
const THIN_CHART_GRID_STYLE: CSSProperties = {
  background: `
    repeating-linear-gradient(90deg, rgba(255,255,255,0.026) 0 1px, transparent 1px 34px),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.026) 0 1px, transparent 1px 34px),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.052) 0 1px, transparent 1px 136px),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.044) 0 1px, transparent 1px 120px)
  `
    .replace(/\s+/g, " ")
    .trim(),
};

/** Uçuş: sadece kaba ızgara — drift ile çizgi yığılmaz. */
const THIN_CHART_GRID_FLY: CSSProperties = {
  background: `
    repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 88px),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.042) 0 1px, transparent 1px 96px)
  `
    .replace(/\s+/g, " ")
    .trim(),
};

const ZEP_VISUAL_SCALE = 0.56;
/** Dar ekranda zeplin gövdesi (grafik viewBox ile aynı ölçekte büyür; ek çarpan). */
const ZEP_MOBILE_SCALE_BOOST = 1.26;

/**
 * dm/dt = turun tepe türevi (crashPoint) iken yaklaşık px/s sola kayma.
 * vel = (DRIFT_MAX_PX_S / dmCeil) * dmDt — dm/dt ile birebir doğru orantılı.
 */
const DRIFT_MAX_PX_S = 395;

/** Bahis geri sayımı — sürekli `now` ile birebir; `scaleX` ile GPU, genişlik transition yok. */
const BettingCountdownBar = memo(function BettingCountdownBar({
  progress,
  stripes,
  className,
}: {
  progress: number;
  stripes: { stripeFrom: string; stripeTo: string };
  className?: string;
}) {
  const p = Math.min(1, Math.max(0, progress));
  const pct = Math.round(p * 100);
  return (
    <div
      className={className}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Bahis süresi"
    >
      <div className="relative w-full overflow-hidden rounded-full p-[3px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-white/[0.11] md:p-[3.5px] bg-gradient-to-b from-zinc-800/55 to-zinc-950/95">
        <div className="relative h-[5px] overflow-hidden rounded-full bg-black/75 shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)] md:h-2">
          <div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full will-change-transform"
            style={{
              transform: `scaleX(${p})`,
              backfaceVisibility: "hidden",
              background: `linear-gradient(90deg, ${stripes.stripeFrom} 0%, ${stripes.stripeTo} 55%, ${stripes.stripeTo} 100%)`,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.38), inset 0 -1px 0 rgba(0,0,0,0.35), 0 0 20px -4px rgba(255,255,255,0.14)",
            }}
          />
        </div>
      </div>
    </div>
  );
});

export const FlightStage = memo(function FlightStage({
  game,
  multLive,
  now,
  crashFlash,
}: Props) {
  const isNarrow = useIsNarrowViewport();
  const zepVisualScale = isNarrow
    ? ZEP_VISUAL_SCALE * ZEP_MOBILE_SCALE_BOOST
    : ZEP_VISUAL_SCALE;

  const rid = useId().replace(/:/g, "");
  const I = (name: string) => `${name}_${rid}`;

  const phase = game?.phase ?? "betting";
  const flyStartedAt = game?.flyStartedAt ?? null;
  const crashPoint = game?.crashPoint ?? null;
  const bettingEndsAt = game?.bettingEndsAt ?? 0;

  const countdownSec =
    phase === "betting" ? Math.max(0, (bettingEndsAt - now) / 1000) : 0;
  const bettingProgress =
    phase === "betting" ? Math.min(1, Math.max(0, 1 - countdownSec / 20)) : 0;

  const [afterCrashBetting, setAfterCrashBetting] = useState(false);
  const [shutterClosed, setShutterClosed] = useState(true);
  /** Donma süresi: ref + setState yarışını önlemek için (kırmızı 0× ara kare yok). */
  const [crashFreezeActive, setCrashFreezeActive] = useState(false);
  const freezeSnapRef = useRef<{
    flyStartedAt: number;
    crashPoint: number;
  } | null>(null);
  const prevPhaseForFreezeRef = useRef(phase);
  const prevPhaseRef = useRef<typeof phase | undefined>(undefined);
  /** Patlama sonrası tur: geri sayım ≤1’de kepenk sesi → `flying` girişinde tekrar çalma. */
  const skipShutterSoundOnFlyingEnterRef = useRef(false);
  /** Uçuşta zeplin hızı hissi: arka plan sola akar. */
  const driftScrollPxRef = useRef(0);
  const driftLastNowRef = useRef(now);
  const driftRoundAnchorRef = useRef<number | null>(null);
  const lastFlyingSnapRef = useRef<{
    flyStartedAt: number;
    crashPoint: number;
  } | null>(null);

  if (phase === "flying" && flyStartedAt != null && crashPoint != null) {
    lastFlyingSnapRef.current = { flyStartedAt, crashPoint };
  }

  useLayoutEffect(() => {
    const prev = prevPhaseForFreezeRef.current;
    if (phase === "flying") {
      setCrashFreezeActive(false);
      freezeSnapRef.current = null;
    } else if (prev === "flying" && phase === "betting") {
      const s = lastFlyingSnapRef.current;
      if (s) {
        freezeSnapRef.current = s;
        setCrashFreezeActive(true);
      }
    }
    prevPhaseForFreezeRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const prev = prevPhaseRef.current;

    if (phase === "flying") {
      setAfterCrashBetting(false);
      if (prev !== "flying") {
        if (skipShutterSoundOnFlyingEnterRef.current) {
          skipShutterSoundOnFlyingEnterRef.current = false;
        } else {
          playShutterSlide();
        }
      }
      setShutterClosed(false);
      prevPhaseRef.current = phase;
      return;
    }

    if (prev === "flying" && phase === "betting") {
      const t = window.setTimeout(() => {
        flushSync(() => {
          setCrashFreezeActive(false);
          setAfterCrashBetting(true);
        });
        freezeSnapRef.current = null;
        playShutterCloseInferno();
        setShutterClosed(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setShutterClosed(true));
        });
      }, 1000);
      prevPhaseRef.current = phase;
      return () => window.clearTimeout(t);
    }

    prevPhaseRef.current = phase;
  }, [phase]);

  const prevCountdownForShutterRef = useRef<number | null>(null);
  useEffect(() => {
    if (!afterCrashBetting || phase !== "betting") {
      prevCountdownForShutterRef.current = null;
      return;
    }
    const prevC = prevCountdownForShutterRef.current;
    prevCountdownForShutterRef.current = countdownSec;
    if (prevC !== null && prevC > 1 && countdownSec <= 1) {
      skipShutterSoundOnFlyingEnterRef.current = true;
      playShutterSlide();
    }
    if (countdownSec <= 1) setShutterClosed(false);
  }, [afterCrashBetting, phase, countdownSec]);

  const prevBettingCountdownRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== "betting") {
      prevBettingCountdownRef.current = null;
      return;
    }
    const prev = prevBettingCountdownRef.current;
    if (prev === null) {
      prevBettingCountdownRef.current = countdownSec;
      return;
    }
    prevBettingCountdownRef.current = countdownSec;

    if (countdownSec > 3 || countdownSec <= 0) return;

    const prevF = Math.floor(prev + 1e-6);
    const curF = Math.floor(countdownSec + 1e-6);
    if (prevF > curF) {
      playBettingCountdownTick();
    }
  }, [phase, countdownSec]);

  const phaseSfxPrevRef = useRef<typeof phase | undefined>(undefined);
  useEffect(() => {
    const prev = phaseSfxPrevRef.current;
    phaseSfxPrevRef.current = phase;
    if (prev === "betting" && phase === "flying") {
      playFlightStartStinger();
    }
    if (prev === "flying" && phase === "betting") {
      playRoundCrashBurst();
    }
  }, [phase]);

  const showBettingShutter = afterCrashBetting && phase === "betting";
  const freezePatlama = phase === "betting" && crashFreezeActive;
  /** Kepenk açılırken arkada kırmızı 0× değil, uçuş sahnesi (preflight ile aynı çizim). */
  const shutterFlightHazir =
    showBettingShutter && phase === "betting" && !freezePatlama;
  const preflight =
    phase === "betting" &&
    !freezePatlama &&
    countdownSec > 0 &&
    countdownSec <= 1.35;
  const hideCornerCountdown = showBettingShutter || freezePatlama;
  const finalCountdownDigit =
    showBettingShutter && countdownSec > 0 && countdownSec <= 3
      ? Math.min(3, Math.max(1, Math.ceil(countdownSec)))
      : null;

  const activeFlight = useMemo(() => {
    const sn = freezeSnapRef.current;
    if (phase === "flying" && flyStartedAt != null && crashPoint != null) {
      return { fly: flyStartedAt, crash: crashPoint, simNow: now } as const;
    }
    if (freezePatlama && sn) {
      const simNow =
        sn.flyStartedAt + elapsedToReachMultiplier(sn.crashPoint) * 1000;
      return {
        fly: sn.flyStartedAt,
        crash: sn.crashPoint,
        simNow,
      } as const;
    }
    return null;
  }, [phase, flyStartedAt, crashPoint, now, freezePatlama]);

  const visFlyShell =
    phase === "flying" ||
    freezePatlama ||
    preflight ||
    shutterFlightHazir;

  const multForHeat =
    freezePatlama && freezeSnapRef.current
      ? freezeSnapRef.current.crashPoint
      : phase === "flying" && multLive != null
        ? multLive
        : FLIGHT_IDLE_HEAT_MULT;

  const heat = useMemo(() => multHeatStyles(multForHeat), [multForHeat]);

  const flight = useMemo(
    () => multHeatFlightContext(multForHeat),
    [multForHeat],
  );

  const curve = useMemo(() => {
    if (preflight || shutterFlightHazir) {
      return {
        smoothPath: "",
        areaPath: "",
        zep: { x: CHART_OX, y: CHART_OY } as Point2,
        rotDeg: -8,
        thrustOpacity: 0.05,
        elapsedSec: 0,
      };
    }
    if (!activeFlight) {
      return {
        smoothPath: "",
        areaPath: "",
        zep: { x: CHART_OX, y: CHART_OY } as Point2,
        rotDeg: -8,
        thrustOpacity: 0,
        elapsedSec: 0,
      };
    }

    const { fly: flyAt, crash: crashAt, simNow } = activeFlight;
    const elapsed = Math.max(0, (simNow - flyAt) / 1000);
    const steps = Math.min(
      560,
      Math.max(120, Math.ceil(elapsed * 160) + 72),
    );
    const origin: Point2 = { x: CHART_OX, y: CHART_OY };
    const pts: Point2[] = [origin];
    const span = PLOT_W;
    const rateDamp = 1 / Math.sqrt(1 + crashAt * 0.035);
    const el = Math.max(0, elapsed);

    /**
     * Semantik zoom: başta düşük sanal tavan (chartLogDenom küçük) → 0,07×→0,30×
     * belirgin yükseliş; süreyle tam VIS_MULT_CAP eksenine yumuşak geçiş.
     */
    const smoothstep01 = (u: number) => {
      const x = Math.min(1, Math.max(0, u));
      return x * x * (3 - 2 * x);
    };
    const T_CHART_ZOOM = 3.15;
    const zoomBlend = smoothstep01(Math.min(1, el / T_CHART_ZOOM));
    const ZOOM_CAP_EARLY = 0.44;
    const denomTime = Math.max(
      1e-9,
      (1 - zoomBlend) * Math.log1p(ZOOM_CAP_EARLY) +
        zoomBlend * Math.log1p(VIS_MULT_CAP),
    );

    const dmDt = multiplierRawDerivativeAtElapsedSeconds(el, crashAt);
    const dmDtCeil = GROWTH * (Math.max(crashAt, EPS) + EPS);
    const rateNorm = Math.min(
      1.35,
      dmDt / Math.max(1e-9, dmDtCeil),
    );
    const rateZoom =
      1 + RATE_ZOOM_STRENGTH * Math.pow(rateNorm, 0.82);
    const chartLogDenom = denomTime * rateZoom;

    const xFromM = (m: number) => {
      const mv = Math.max(0, m);
      const tu = Math.min(1, Math.log1p(mv) / chartLogDenom);
      /** dm/dt arttıkça yatayda biraz daha “nefes” (ekran hızı çarpanla uyumlu). */
      const horizGamma = 0.48 + 0.14 * Math.pow(rateNorm, 0.75);
      return CHART_OX + Math.pow(tu, horizGamma) * span * 0.98;
    };

    const yFromM = (m: number) => {
      const mv = Math.max(0, m);
      const t = Math.min(1, Math.log1p(mv) / chartLogDenom);
      const bandT =
        VIS_Y_BAND_LO * t + (VIS_Y_BAND_HI - VIS_Y_BAND_LO) * t * t;
      const norm =
        Math.pow(bandT, CHART_Y_GAMMA) * (1 - CHART_Y_TOP_PAD) +
        CHART_Y_TOP_PAD * bandT;
      return CHART_OY - norm * PLOT_H;
    };

    if (el < 1e-9) {
      pts.push({ x: CHART_OX, y: CHART_OY });
    } else {
      for (let i = 1; i <= steps; i++) {
        const te = (i / steps) * el;
        const m = multiplierRawAtElapsedSeconds(te, crashAt);
        pts.push({ x: xFromM(m), y: yFromM(m) });
      }
    }
    pts[0] = { ...origin };

    const smoothPath =
      pts.length >= 2 ? catmullRomToSmoothPath(pts) : "";
    const last = pts[pts.length - 1] ?? origin;
    const areaPath = smoothPath
      ? `${smoothPath} L ${last.x.toFixed(2)} ${CHART_OY} L ${CHART_OX} ${CHART_OY} Z`
      : "";

    let rotDeg = tangentDegreesAtEnd(trimTrailingCoincidentPoints(pts));
    if (
      el < 0.075 &&
      multiplierRawAtElapsedSeconds(el, crashAt) < crashAt * 0.03
    ) {
      rotDeg = -10;
    }

    const mNow = multiplierRawAtElapsedSeconds(elapsed, crashAt);
    const mPrev = multiplierRawAtElapsedSeconds(
      Math.max(0, elapsed - 0.02),
      crashAt,
    );
    const mEarly = multiplierRawAtElapsedSeconds(
      Math.max(0, elapsed - 0.05),
      crashAt,
    );
    const rate = ((mNow - mPrev) / 0.02) * rateDamp;
    const ratePrev = ((mPrev - mEarly) / 0.05) * rateDamp;
    const damp = 1 / (1 + Math.abs((rate - ratePrev) / 0.04) * 0.12);
    const thrustOpacity = Math.min(
      0.72,
      Math.max(
        0.06,
        (0.1 + rate * 0.14 + Math.sqrt(Math.max(0, rate)) * 0.07) *
          damp *
          Math.min(1, elapsed / 0.1),
      ),
    );

    return {
      smoothPath,
      areaPath,
      zep: last,
      rotDeg,
      thrustOpacity,
      elapsedSec: elapsed,
    };
  }, [preflight, shutterFlightHazir, activeFlight]);

  const dynamics = useMemo(() => {
    if (preflight || shutterFlightHazir) {
      return {
        bob: 0,
        pitch: 0,
        scale: 1,
        sway: 0,
        cruisePitch: 0,
        forwardPx: 0,
        upPx: 0,
        rateNorm: 0,
      };
    }
    if (!activeFlight) {
      return {
        bob: 0,
        pitch: 0,
        scale: 1,
        sway: 0,
        cruisePitch: 0,
        forwardPx: 0,
        upPx: 0,
        rateNorm: 0,
      };
    }
    const { fly: flyAt, crash: crashAt, simNow } = activeFlight;
    const elapsed = Math.max(0, (simNow - flyAt) / 1000);
    const dt = 0.02;
    const tCrash = Math.max(
      0.08,
      elapsedToReachMultiplier(Math.max(0.02, crashAt)),
    );
    const progress = Math.min(1, elapsed / tCrash);
    const rateDamp = 1 / Math.sqrt(1 + crashAt * 0.035);

    const m1 = multiplierRawAtElapsedSeconds(elapsed, crashAt);
    if (m1 >= crashAt - 1e-6) {
      return {
        bob: 0,
        pitch: 0,
        scale: 1,
        sway: 0,
        cruisePitch: 0,
        forwardPx: 0,
        upPx: 0,
        rateNorm: 0,
      };
    }

    const m0 = multiplierRawAtElapsedSeconds(Math.max(0, elapsed - dt), crashAt);
    const m_1 = multiplierRawAtElapsedSeconds(
      Math.max(0, elapsed - 2 * dt),
      crashAt,
    );
    const rate = ((m1 - m0) / dt) * rateDamp;
    const ratePrev = ((m0 - m_1) / dt) * rateDamp;
    const damp = 1 / (1 + Math.abs((rate - ratePrev) / dt) * 0.16);

    const rateNorm = Math.min(
      1.45,
      Math.abs(rate) / Math.max(0.38, crashAt * 0.012 + 0.16),
    );
    const speed = Math.pow(rateNorm, 0.88);

    const startEase = Math.min(1, elapsed / 0.14);
    const calm = 1 - 0.62 * speed;

    const pitchRaw = (rate * 1.45 + rate * rate * 0.024) * damp;
    const pitch = -Math.min(6.2, Math.max(-6.2, pitchRaw * (0.42 + 0.58 * calm)));

    const bob = Math.sin(elapsed * 1.05) * 0.11 * calm * startEase;
    const sway = Math.sin(elapsed * 0.62) * 0.055 * calm * startEase;
    const scale =
      0.985 + 0.1 * speed + Math.sin(elapsed * 0.88) * 0.004 * calm;

    const cruisePitch =
      (-3.1 - 10 * progress * progress - 12.5 * speed) * startEase;
    const forwardPx =
      (1.05 + 14.5 * speed * (0.38 + 0.62 * progress)) * startEase;
    const upPx = (-0.42 - 4.6 * speed) * startEase;

    return {
      bob,
      pitch,
      scale,
      sway,
      cruisePitch,
      forwardPx,
      upPx,
      rateNorm,
    };
  }, [preflight, shutterFlightHazir, activeFlight]);

  const showZep =
    preflight || shutterFlightHazir || activeFlight != null;

  const roundAnchorRef = useRef<number | null>(null);
  const lagRef = useRef<Point2>({ x: CHART_OX, y: CHART_OY });
  const rotRef = useRef(-8);
  const thrustSmRef = useRef(0);
  const prevNowRef = useRef(now);

  let zepRot = curve.rotDeg + dynamics.pitch + dynamics.cruisePitch;
  let zepX = curve.zep.x + dynamics.sway + dynamics.forwardPx;
  let zepY = curve.zep.y + dynamics.bob + dynamics.upPx;
  let thrustDraw = curve.thrustOpacity;

  if (!showZep) {
    roundAnchorRef.current = null;
    lagRef.current = { x: CHART_OX, y: CHART_OY };
    rotRef.current = -8;
    thrustSmRef.current = 0;
    prevNowRef.current = now;
  } else if (activeFlight != null) {
    const elapsedSec = Math.max(
      0,
      (activeFlight.simNow - activeFlight.fly) / 1000,
    );
    const mBoot = multiplierRawAtElapsedSeconds(
      elapsedSec,
      activeFlight.crash,
    );
    /** Köşede kilit: süre üst sınırı (çarpan ~0,001 iken 0,012 eşiği pratikte dolmaz). */
    const pinOrigin = mBoot < 0.012 && elapsedSec < 0.16;

    let targetX = curve.zep.x + dynamics.sway + dynamics.forwardPx;
    let targetY = curve.zep.y + dynamics.bob + dynamics.upPx;
    let targetRot =
      curve.rotDeg + dynamics.pitch + dynamics.cruisePitch;
    if (pinOrigin) {
      targetX = CHART_OX;
      targetY = CHART_OY;
      targetRot = curve.rotDeg;
    }
    const targetThrust = curve.thrustOpacity;

    if (freezePatlama) {
      roundAnchorRef.current = activeFlight.fly;
      lagRef.current = { x: targetX, y: targetY };
      rotRef.current = targetRot;
      thrustSmRef.current = targetThrust;
      prevNowRef.current = now;
      zepX = targetX;
      zepY = targetY;
      zepRot = targetRot;
      thrustDraw = targetThrust;
    } else if (roundAnchorRef.current !== activeFlight.fly) {
      roundAnchorRef.current = activeFlight.fly;
      lagRef.current = { x: targetX, y: targetY };
      rotRef.current = targetRot;
      thrustSmRef.current = targetThrust;
      prevNowRef.current = now;
      zepX = targetX;
      zepY = targetY;
      zepRot = targetRot;
      thrustDraw = targetThrust;
    } else {
      let dt = (now - prevNowRef.current) / 1000;
      if (!Number.isFinite(dt) || dt < 0) dt = 0;
      dt = Math.min(0.05, dt);
      prevNowRef.current = now;

      const tauPos = Math.max(0.038, 0.148 / (1 + dynamics.rateNorm * 3));
      const tauRot = Math.max(0.08, 0.18 / (1 + dynamics.rateNorm * 1.7));
      const tauTh = 0.16;
      const kP = 1 - Math.exp(-dt / tauPos);
      const kR = 1 - Math.exp(-dt / tauRot);
      const kT = 1 - Math.exp(-dt / tauTh);

      lagRef.current.x += (targetX - lagRef.current.x) * kP;
      lagRef.current.y += (targetY - lagRef.current.y) * kP;
      rotRef.current += (targetRot - rotRef.current) * kR;
      thrustSmRef.current +=
        (targetThrust - thrustSmRef.current) * kT;

      zepX = lagRef.current.x;
      zepY = lagRef.current.y;
      zepRot = rotRef.current;
      thrustDraw = thrustSmRef.current;
    }
  }

  if (!activeFlight) {
    driftScrollPxRef.current = 0;
    driftLastNowRef.current = now;
    driftRoundAnchorRef.current = null;
  } else {
    const { fly: driftFly, crash: driftCrash, simNow: driftSim } =
      activeFlight;
    if (driftRoundAnchorRef.current !== driftFly) {
      driftRoundAnchorRef.current = driftFly;
      driftScrollPxRef.current = 0;
      driftLastNowRef.current = now;
    }
    let dt = (now - driftLastNowRef.current) / 1000;
    driftLastNowRef.current = now;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    if (dt > 0.085) dt = 0.022;

    const el = Math.max(0, (driftSim - driftFly) / 1000);
    const dmDt = multiplierRawDerivativeAtElapsedSeconds(el, driftCrash);
    const dmCeil = GROWTH * (Math.max(driftCrash, EPS) + EPS);
    const vel =
      dmDt <= 0
        ? 0
        : (DRIFT_MAX_PX_S / Math.max(dmCeil, 1e-9)) * dmDt;
    driftScrollPxRef.current += freezePatlama ? 0 : vel * dt;
  }

  const uf = (n: string) => `url(#${I(n)})`;

  const chartCardBorder = visFlyShell
    ? "rgba(255,255,255,0.09)"
    : flight.gridLine;
  const chartCardBg = flight.chartBackdrop;

  const multDisplayVal =
    multLive != null
      ? multLive
      : freezePatlama && freezeSnapRef.current
        ? freezeSnapRef.current.crashPoint
        : null;

  return (
    <div
      className="relative flex min-h-[min(54svh,520px)] w-full flex-1 flex-col overflow-hidden rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:min-h-[min(58svh,640px)]"
      style={{
        borderColor: chartCardBorder,
        background: chartCardBg,
      }}
    >
      {visFlyShell && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
          aria-hidden
        >
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 76px, hsla(${flight.hue}, 38%, 58%, 0.075) 76px, hsla(${flight.hue}, 38%, 58%, 0.075) 77px)`
                .replace(/\s+/g, " ")
                .trim(),
              backgroundSize: "308px 100%",
              backgroundPosition: `${-driftScrollPxRef.current}px 0`,
              opacity: 0.42,
            }}
          />
        </div>
      )}
      <div
        className={`pointer-events-none absolute inset-0 z-[2] ${visFlyShell ? "opacity-[0.48]" : "opacity-[0.92]"}`}
        style={visFlyShell ? THIN_CHART_GRID_FLY : THIN_CHART_GRID_STYLE}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-3 pt-2 md:pt-3">
        <div className="flex max-w-[min(96vw,400px)] flex-col items-center">
          <div
            className="mb-0 flex w-[min(200px,42vw)] items-end justify-between gap-[clamp(3rem,18vw,5.5rem)] px-1"
            aria-hidden
          >
            <div className="h-3 w-px rounded-full bg-gradient-to-b from-white/35 via-white/12 to-transparent shadow-[0_0_10px_rgba(255,255,255,0.12)]" />
            <div className="h-3 w-px rounded-full bg-gradient-to-b from-white/35 via-white/12 to-transparent shadow-[0_0_10px_rgba(255,255,255,0.12)]" />
          </div>
          <div
            className="relative w-full min-w-0 rounded-2xl border px-4 pb-3 pt-2.5 text-center shadow-[0_20px_50px_rgba(0,0,0,0.45),0_4px_14px_rgba(0,0,0,0.25)] backdrop-blur-[2px] sm:px-6 md:min-w-[min(90vw,360px)] md:rounded-[1.35rem] md:px-10 md:pb-5 md:pt-4"
            style={{
              background: heat.background,
              borderColor: heat.borderColor,
              boxShadow: `0 24px 56px rgba(0,0,0,0.48), 0 2px 0 rgba(255,255,255,0.05) inset, ${heat.boxShadow}`,
            }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.42em] text-white/50 md:text-[10px] md:tracking-[0.48em]">
              Çarpan
            </p>
            <p
              className="mt-1.5 font-mono text-[clamp(1.5rem,5vw,2.85rem)] font-semibold tabular-nums leading-none tracking-tight md:text-[3.15rem]"
              style={{
                color:
                  multDisplayVal != null ||
                  (phase === "betting" && !freezePatlama)
                    ? heat.color
                    : "rgb(113 113 122)",
              }}
            >
              {multDisplayVal != null ? (
                `${new Intl.NumberFormat("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(multDisplayVal)}×`
              ) : phase === "betting" ? (
                `0,00×`
              ) : (
                "—"
              )}
            </p>
            {phase !== "flying" &&
              !preflight &&
              !freezePatlama &&
              !shutterFlightHazir && (
              <p className="mt-2 text-[10px] font-medium text-white/38 md:text-[11px]">
                Renkler çarpanla birlikte yumuşak geçişle akar
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-0 top-0 z-30 flex flex-col items-end px-3 pt-3 text-right md:px-5 md:pt-4">
        <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          Oturum
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-200">
          {freezePatlama
            ? "Tur bitti"
            : preflight || shutterFlightHazir
              ? "Başlıyor"
              : phase === "betting"
                ? "Bahis açık"
                : "Uçuş aktif"}
        </p>
        {phase === "betting" && !hideCornerCountdown && (
          <>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-100 md:text-2xl">
              {formatCountdown(countdownSec)}{" "}
              <span className="text-sm font-medium text-zinc-500">sn</span>
            </p>
            <BettingCountdownBar
              progress={bettingProgress}
              stripes={flight}
              className="mt-2.5 w-40 max-w-[50vw] md:mt-3 md:w-44"
            />
          </>
        )}
      </div>

      {freezePatlama && (
        <div
          className="pointer-events-none absolute inset-0 z-[72] bg-gradient-to-b from-black/58 via-black/42 to-zinc-950/70"
          aria-hidden
        />
      )}

      {crashFlash != null && (
        <div
          className="pointer-events-none absolute inset-0 z-[73] bg-[radial-gradient(ellipse_85%_72%_at_50%_40%,rgba(248,113,113,0.42)_0%,rgba(220,38,38,0.22)_38%,rgba(127,29,29,0.08)_58%,transparent_72%)] mix-blend-screen"
          aria-hidden
        />
      )}

      {crashFlash != null && (
        <div
          className="pointer-events-none absolute inset-0 z-[76] flex items-center justify-center"
          aria-hidden
        >
          <div className="relative flex flex-col items-center">
            <div
              className="absolute h-[min(72vw,17.5rem)] w-[min(72vw,17.5rem)] rounded-full bg-red-500/25 blur-md md:h-72 md:w-72"
              aria-hidden
            />
            <p className="relative font-sans text-[clamp(1.35rem,6.5vw,1.75rem)] font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)] md:text-[28px]">
              PATLADI
            </p>
            <p className="relative mt-1 font-mono text-[clamp(1.1rem,5vw,1.35rem)] font-semibold tabular-nums text-red-100 drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)] md:text-[22px]">
              {new Intl.NumberFormat("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(crashFlash)}
              ×
            </p>
          </div>
        </div>
      )}

      {showBettingShutter && (
        <div
          className="pointer-events-none absolute inset-0 z-[80] flex flex-col"
          aria-hidden
        >
          {finalCountdownDigit != null && (
            <div
              className="absolute inset-0 z-[79] bg-black"
              aria-hidden
            />
          )}
          <div
            className="relative z-[80] h-1/2 w-full origin-top bg-gradient-to-b from-black via-zinc-950 to-zinc-900/95 shadow-[0_16px_48px_rgba(0,0,0,0.75)] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transform: shutterClosed
                ? "translateY(0)"
                : "translateY(-100%)",
              transition: shutterClosed
                ? "transform 820ms cubic-bezier(0.4,0,0.2,1)"
                : "transform 1100ms cubic-bezier(0.22,0.94,0.36,1)",
            }}
          />
          <div
            className="relative z-[80] h-1/2 w-full origin-bottom bg-gradient-to-t from-black via-zinc-950 to-zinc-900/95 shadow-[0_-16px_48px_rgba(0,0,0,0.75)] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transform: shutterClosed ? "translateY(0)" : "translateY(100%)",
              transition: shutterClosed
                ? "transform 820ms cubic-bezier(0.4,0,0.2,1)"
                : "transform 1100ms cubic-bezier(0.22,0.94,0.36,1)",
            }}
          />

          <div className="pointer-events-none absolute inset-0 z-[90] flex items-center justify-center px-4">
            {finalCountdownDigit != null ? (
              <div className="flex flex-col items-center gap-7 md:gap-9">
                <div
                  key={finalCountdownDigit}
                  className="final-countdown-ring flex h-[min(40vmin,15.5rem)] w-[min(40vmin,15.5rem)] shrink-0 items-center justify-center rounded-full border border-white/22 bg-white/[0.085] shadow-[0_0_72px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[3px] md:h-[min(36vmin,17rem)] md:w-[min(36vmin,17rem)]"
                >
                  <span
                    className="font-mono text-[min(26vmin,6.75rem)] font-bold leading-none tabular-nums tracking-tight text-white/95 md:text-[min(22vmin,7.5rem)]"
                    style={{
                      textShadow:
                        "0 0 48px rgba(255,255,255,0.22), 0 6px 36px rgba(0,0,0,0.75), 0 0 2px rgba(255,255,255,0.95)",
                    }}
                  >
                    {finalCountdownDigit}
                  </span>
                </div>
                <p
                  className="max-w-[min(92vw,420px)] text-center text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-400 antialiased sm:text-xs md:text-[13px] md:tracking-[0.44em]"
                  style={{
                    textShadow: "0 0 40px rgba(255,255,255,0.06)",
                  }}
                >
                  Son Bahisler Geliyor
                  <span className="text-zinc-500">...</span>
                </p>
              </div>
            ) : (
              <div className="flex max-w-[min(96vw,720px)] flex-col items-center text-center">
                <p
                  className="mb-3 text-[11px] font-semibold uppercase tracking-[0.42em] text-white/50 md:text-xs md:tracking-[0.48em]"
                  style={{ textShadow: "0 0 32px rgba(255,255,255,0.12)" }}
                >
                  Bahis açık
                </p>
                <p
                  className="font-mono text-[clamp(3.5rem,12vw,7.5rem)] font-semibold leading-none tabular-nums tracking-tight text-white"
                  style={{
                    textShadow:
                      "0 0 60px rgba(255,255,255,0.2), 0 4px 28px rgba(0,0,0,0.85), 0 0 1px rgba(255,255,255,0.9)",
                  }}
                >
                  {formatCountdown(countdownSec)}
                  <span className="align-super text-[0.42em] font-medium tracking-normal text-white/75">
                    {" "}
                    sn
                  </span>
                </p>
                <BettingCountdownBar
                  progress={bettingProgress}
                  stripes={flight}
                  className="mt-9 w-full max-w-md md:mt-10"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative z-[1] min-h-0 w-full flex-1 pt-[4.35rem] sm:pt-[6.25rem] md:pt-[7.25rem]">
        <svg
          className="absolute inset-0 h-full w-full min-h-[min(380px,55dvh)] sm:min-h-[340px] md:min-h-[420px]"
          viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          overflow="visible"
          role="img"
          aria-label="Zeplin uçuş grafiği"
        >
          <defs>
            <linearGradient id={I("areaDyn")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={flight.areaTop} stopOpacity="0.45" />
              <stop offset="88%" stopColor={flight.areaBot} stopOpacity="0.2" />
              <stop offset="100%" stopColor={flight.areaBot} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={I("hull")} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f4f4f5" />
              <stop offset="45%" stopColor="#d4d4d8" />
              <stop offset="100%" stopColor="#71717a" />
            </linearGradient>
            <linearGradient id={I("hullShade")} x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
            </linearGradient>
            <linearGradient id={I("stripe")} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={flight.stripeFrom} />
              <stop offset="100%" stopColor={flight.stripeTo} />
            </linearGradient>
            <linearGradient id={I("gondola")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52525b" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <radialGradient id={I("sheen")} cx="32%" cy="28%" r="58%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <filter id={I("softGlow")} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={I("zepShadow")} x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow
                dx="0"
                dy="14"
                stdDeviation="12"
                floodColor="rgba(0,0,0,0.55)"
              />
            </filter>
            <radialGradient id={I("plotAtmosphere")} cx="50%" cy="38%" r="68%">
              <stop offset="0%" stopColor={flight.curveGlow} stopOpacity="0.42" />
              <stop offset="58%" stopColor={flight.areaTop} stopOpacity="0.1" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          <g className="pointer-events-none">
            <rect
              x={VIEW_X}
              y={VIEW_Y}
              width={VIEW_W}
              height={VIEW_H}
              fill={uf("plotAtmosphere")}
            />
          </g>

          {visFlyShell && (
            <g opacity={0.9} pointerEvents="none">
              <line
                x1={CHART_OX}
                y1={CHART_EDGE_T}
                x2={CHART_OX}
                y2={CHART_OY}
                stroke="rgba(148,163,184,0.18)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={CHART_OX}
                y1={CHART_OY}
                x2={CHART_EDGE_R}
                y2={CHART_OY}
                stroke="rgba(148,163,184,0.18)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={CHART_OX + 8}
                y={CHART_OY + 22}
                textAnchor="start"
                className="font-sans text-[13px] font-medium tabular-nums"
                style={{ fill: "rgba(161,161,170,0.9)" }}
              >
                0,00×
              </text>
            </g>
          )}

          {phase === "betting" &&
            !preflight &&
            !freezePatlama &&
            !shutterFlightHazir && (
            <g opacity={0.92}>
              <line
                x1={CHART_OX}
                y1={CHART_OY}
                x2={CHART_EDGE_R}
                y2={CHART_OY}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <g transform={`translate(${CHART_OX + 52}, ${CHART_OY - 88})`}>
                <text
                  x="0"
                  y="0"
                  textAnchor="start"
                  className="fill-zinc-400 font-sans text-[16px] font-semibold"
                  style={{ fill: `hsla(${flight.hue}, 25%, 62%, 0.88)` }}
                >
                  Pist hazır
                </text>
                <text
                  x="0"
                  y="26"
                  textAnchor="start"
                  className="font-sans text-[13px]"
                  style={{ fill: `hsla(${flight.hue}, 18%, 45%, 0.65)` }}
                >
                  0,00× köşesinden kalkış
                </text>
              </g>
            </g>
          )}

          {curve.areaPath ? (
            <path
              d={curve.areaPath}
              fill={uf("areaDyn")}
              stroke="none"
            />
          ) : null}
          {curve.smoothPath ? (
            <path
              d={curve.smoothPath}
              fill="none"
              stroke="rgba(15,23,42,0.35)"
              strokeWidth={6 + 5 * Math.min(1, dynamics.rateNorm)}
              strokeLinecap="round"
              strokeLinejoin="round"
              shapeRendering="geometricPrecision"
            />
          ) : null}
          {curve.smoothPath ? (
            <path
              d={curve.smoothPath}
              fill="none"
              stroke={flight.curveStroke}
              strokeWidth={1.4 + 4.2 * Math.min(1, dynamics.rateNorm)}
              strokeLinecap="round"
              strokeLinejoin="round"
              shapeRendering="geometricPrecision"
              filter={uf("softGlow")}
              opacity={0.88 + 0.12 * Math.min(1, dynamics.rateNorm)}
            />
          ) : null}

          {showZep && (
            <g pointerEvents="none">
              <line
                x1={CHART_OX}
                y1={zepY}
                x2={zepX}
                y2={zepY}
                stroke="rgba(165,243,252,0.2)"
                strokeWidth="1"
                strokeDasharray="5 7"
                vectorEffect="non-scaling-stroke"
              />
              {multDisplayVal != null ? (
                <text
                  x={VIEW_X + 36}
                  y={zepY + 5}
                  textAnchor="start"
                  className="font-sans text-[12.5px] font-semibold tabular-nums"
                  style={{ fill: "rgba(224,242,254,0.95)" }}
                >
                  {new Intl.NumberFormat("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(multDisplayVal)}
                  ×
                </text>
              ) : null}
              <line
                x1={zepX}
                y1={Math.min(zepY, CHART_OY - 0.5)}
                x2={zepX}
                y2={CHART_OY}
                stroke="rgba(226,232,240,0.22)"
                strokeWidth="1"
                strokeDasharray="4 6"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={Math.min(
                  CHART_EDGE_R - 24,
                  Math.max(CHART_OX + 24, zepX),
                )}
                y={CHART_OY + 22}
                textAnchor="middle"
                className="font-sans text-[12.5px] font-medium tabular-nums"
                style={{ fill: "rgba(228,228,231,0.92)" }}
              >
                {formatFlightElapsed(curve.elapsedSec)}
              </text>
            </g>
          )}

          {showZep && (
            <g
              transform={`translate(${zepX.toFixed(2)},${zepY.toFixed(2)}) rotate(${zepRot.toFixed(2)}) scale(${(dynamics.scale * zepVisualScale).toFixed(4)})`}
              filter={uf("zepShadow")}
            >
              <g opacity={thrustDraw} transform="rotate(180)">
                <ellipse
                  cx="-118"
                  cy="0"
                  rx="52"
                  ry="12"
                  fill={flight.curveGlow}
                  opacity="0.85"
                />
                <ellipse
                  cx="-96"
                  cy="0"
                  rx="30"
                  ry="6"
                  fill="rgba(255,255,255,0.4)"
                />
              </g>

              <ellipse cx="8" cy="18" rx="102" ry="18" fill="rgba(0,0,0,0.35)" />

              <path
                d="M -128 2 C -134 -52 -78 -68 12 -70 C 108 -67 152 -48 158 4 C 162 42 118 66 28 68 C -62 70 -124 44 -128 2 Z"
                fill={uf("hull")}
                stroke="rgba(255,255,255,0.42)"
                strokeWidth="1.8"
              />
              <path
                d="M -128 2 C -134 -52 -78 -68 12 -70 C 108 -67 152 -48 158 4"
                fill="none"
                stroke="rgba(255,255,255,0.32)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M -128 2 C -134 -52 -78 -68 12 -70 C 108 -67 152 -48 158 4 C 162 42 118 66 28 68 C -62 70 -124 44 -128 2 Z"
                fill={uf("hullShade")}
                opacity="0.55"
              />
              <ellipse
                cx="-12"
                cy="-34"
                rx="86"
                ry="28"
                fill={uf("sheen")}
                opacity="0.75"
              />
              <rect
                x="-82"
                y="-26"
                width="164"
                height="18"
                rx="9"
                fill={uf("stripe")}
              />
              <rect
                x="-82"
                y="-26"
                width="164"
                height="18"
                rx="9"
                fill="none"
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="1"
              />

              {[-54, -18, 18, 54].map((wx) => (
                <circle
                  key={wx}
                  cx={wx}
                  cy="-42"
                  r="5"
                  fill="rgba(15,23,42,0.55)"
                  stroke="rgba(255,255,255,0.28)"
                  strokeWidth="1.1"
                />
              ))}

              <path
                d="M -40 40 L -48 98 Q -50 114 0 116 Q 50 114 48 98 L 40 40 Q 0 32 -40 40 Z"
                fill={uf("gondola")}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1.3"
              />
              <rect
                x="-22"
                y="56"
                width="16"
                height="10"
                rx="2"
                fill="rgba(56,189,248,0.25)"
                stroke="rgba(125,211,252,0.35)"
                strokeWidth="0.8"
              />
              <rect
                x="6"
                y="56"
                width="16"
                height="10"
                rx="2"
                fill="rgba(56,189,248,0.18)"
                stroke="rgba(125,211,252,0.25)"
                strokeWidth="0.8"
              />
              <line
                x1="-58"
                y1="12"
                x2="-44"
                y2="92"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.4"
              />
              <line
                x1="58"
                y1="12"
                x2="44"
                y2="92"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.4"
              />

              <path
                d="M -142 -2 L -178 6 L -172 26 L -136 16 Z"
                fill="rgba(228,228,231,0.3)"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
              />
              <path
                d="M 146 0 L 186 10 L 178 28 L 140 18 Z"
                fill="rgba(228,228,231,0.26)"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1"
              />
              <circle cx="128" cy="-40" r="6" fill="#fde68a">
                <animate
                  attributeName="opacity"
                  values="0.5;1;0.5"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}

        </svg>
      </div>
    </div>
  );
});
