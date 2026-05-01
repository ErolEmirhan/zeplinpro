/** Üst çarpan (spektrum genişliği). */
export const MULT_HEAT_CAP = 5000;

export type MultTier = "red" | "yellow" | "green" | "diamond";

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

function smoothstep01(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

type HSL = { h: number; s: number; l: number };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHsl(from: HSL, to: HSL, t: number): HSL {
  let dh = to.h - from.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return {
    h: from.h + dh * t,
    s: lerp(from.s, to.s, t),
    l: lerp(from.l, to.l, t),
  };
}

/** Kırmızı → sarı → yeşil → elmas: tüm ara çarpanlarda yumuşak HSL geçişi. */
function multSpectrum(mult: number): {
  accent: HSL;
  accent2: HSL;
  deep: HSL;
  glow: HSL;
  tier: MultTier;
} {
  const m = clamp(Number.isFinite(mult) ? mult : 0, 0, MULT_HEAT_CAP);

  const red: HSL = { h: 358, s: 88, l: 50 };
  const yellow: HSL = { h: 48, s: 94, l: 54 };
  const green: HSL = { h: 154, s: 76, l: 48 };
  const ice: HSL = { h: 198, s: 92, l: 66 };
  const gem: HSL = { h: 258, s: 72, l: 58 };

  let accent: HSL;
  if (m < 1) {
    accent = lerpHsl(red, yellow, smoothstep01(m / 1));
  } else if (m < 5) {
    accent = lerpHsl(yellow, green, smoothstep01((m - 1) / 4));
  } else if (m < 10) {
    accent = lerpHsl(green, ice, smoothstep01((m - 5) / 5));
  } else {
    const u = smoothstep01(clamp((m - 10) / 28, 0, 1));
    accent = lerpHsl(ice, gem, u);
  }

  const accent2 = lerpHsl(accent, gem, 0.28);
  const deep: HSL = {
    h: accent.h + 6,
    s: clamp(accent.s * 0.72, 18, 72),
    l: lerp(10, 18, smoothstep01(m / 12)),
  };
  const glow: HSL = {
    h: accent.h,
    s: clamp(accent.s * 0.95, 40, 98),
    l: lerp(44, 58, smoothstep01(m / 15)),
  };

  let tier: MultTier;
  if (m < 1) tier = "red";
  else if (m < 5) tier = "yellow";
  else if (m < 10) tier = "green";
  else tier = "diamond";

  return { accent, accent2, deep, glow, tier };
}

function hsla(c: HSL, a: number): string {
  return `hsla(${c.h.toFixed(1)}, ${c.s.toFixed(1)}%, ${c.l.toFixed(1)}%, ${a})`;
}

function hsl(c: HSL): string {
  return `hsl(${c.h.toFixed(1)}, ${c.s.toFixed(1)}%, ${c.l.toFixed(1)}%)`;
}

/**
 * Görsel kademe etiketi (mantık); arka planlar `multSpectrum` ile süreklidir.
 */
export function multTier(mult: number): MultTier {
  return multSpectrum(mult).tier;
}

type BoxStyles = {
  color: string;
  background: string;
  borderColor: string;
  boxShadow: string;
  hue: number;
  tier: MultTier;
};

type FlightCtx = {
  chartBackdrop: string;
  chartVignette: string;
  gridLine: string;
  gridLineFaint: string;
  curveStroke: string;
  curveGlow: string;
  areaTop: string;
  areaBot: string;
  hue: number;
  tier: MultTier;
  stripeFrom: string;
  stripeTo: string;
};

export function multCrashPillAppearance(mult: number): {
  background: string;
  borderColor: string;
  color: string;
  boxShadow: string;
} {
  const { accent, accent2, deep } = multSpectrum(mult);
  const a1 = hsla(deep, 0.68);
  const a2 = hsla(
    { h: accent.h + 14, s: accent.s * 0.65, l: deep.l * 0.85 },
    0.78,
  );
  const rim = hsla(accent, 0.52);
  const text = hsl({ h: accent.h, s: Math.min(96, accent.s + 6), l: 92 });
  const glow = hsla(accent, 0.22);

  return {
    background: `linear-gradient(145deg, ${a1}, ${a2}), linear-gradient(125deg, ${hsl(accent2)}, transparent)`,
    borderColor: rim,
    color: text,
    boxShadow: `0 0 24px ${glow}, inset 0 1px 0 hsla(0,0%,100%,0.07)`,
  };
}

/**
 * Çarpan kutusu: sürekli spektrum gradient.
 */
export function multHeatStyles(
  mult: number,
  _roundCap?: number | null,
): BoxStyles {
  const { accent, accent2, deep, glow, tier } = multSpectrum(mult);
  const color = hsl({
    h: accent.h,
    s: Math.min(98, accent.s + 4),
    l: lerp(86, 94, smoothstep01(mult / 12)),
  });

  const c1 = hsla({ ...deep, l: deep.l + 6 }, 0.93);
  const c2 = hsla(
    { h: accent2.h + 8, s: accent2.s * 0.62, l: 12 },
    0.95,
  );
  const radial = hsla(glow, 0.26);
  const background = `linear-gradient(148deg, ${c1}, ${c2}), radial-gradient(ellipse 100% 90% at 50% -20%, ${radial}, transparent 52%)`;
  const borderColor = hsla(accent, 0.5);
  const boxShadow = `0 0 52px ${hsla(accent, 0.22)}, inset 0 1px 0 hsla(0,0%,100%,0.07)`;

  return {
    color,
    background,
    borderColor,
    boxShadow,
    hue: accent.h,
    tier,
  };
}

/**
 * Uçuş grafiği zemini: spektrumla uyumlu, yumuşak tonlar.
 */
export function multHeatFlightContext(
  mult: number,
  _roundCap?: number | null,
): FlightCtx {
  const { accent, accent2, glow, tier } = multSpectrum(mult);
  const m = clamp(Number.isFinite(mult) ? mult : 0, 0, MULT_HEAT_CAP);
  const satBg = clamp(26 + accent.s * 0.28, 22, 48);
  const satLine = clamp(12 + accent.s * 0.14, 10, 28);

  const chartBackdrop = `
    radial-gradient(ellipse 95% 88% at 50% 108%, ${hsla(
      { h: accent.h + 18, s: accent.s * 0.45, l: 16 },
      0.46,
    )}, transparent 58%),
    radial-gradient(ellipse 72% 55% at 18% -6%, ${hsla(
      { h: accent2.h, s: accent2.s * 0.4, l: 22 },
      0.14,
    )}, transparent 54%),
    linear-gradient(188deg, ${hsla(
      { h: accent.h, s: satBg, l: 5.4 },
      0.98,
    )} 0%, ${hsla(
      { h: accent2.h + 12, s: satBg * 0.82, l: 3.8 },
      0.99,
    )} 100%)
  `
    .replace(/\s+/g, " ")
    .trim();

  const chartVignette = `radial-gradient(ellipse 85% 70% at 50% 45%, transparent 40%, hsla(${accent.h.toFixed(
    0,
  )}, ${satLine}%, 4%, 0.54) 100%)`;

  const gridLine = `hsla(${accent.h.toFixed(1)}, ${satLine}%, 52%, 0.09)`;
  const gridLineFaint = `hsla(${accent.h.toFixed(1)}, ${
    satLine * 0.75
  }%, 50%, 0.045)`;

  const strokeL = lerp(52, 68, smoothstep01(m / 14));
  const curveStroke = `hsl(${accent.h.toFixed(1)}, ${clamp(
    accent.s * 0.78,
    62,
    90,
  ).toFixed(0)}%, ${strokeL.toFixed(1)}%)`;
  const curveGlow = hsla(
    { h: glow.h, s: glow.s, l: glow.l },
    0.28 + smoothstep01(m / 20) * 0.14,
  );

  const areaTop = hsla(
    { h: accent.h, s: clamp(accent.s * 0.62, 38, 72), l: 52 },
    0.14 + smoothstep01(m / 16) * 0.12,
  );
  const areaBot = `hsla(${accent.h.toFixed(0)}, 35%, 6%, 0)`;

  const stripeFrom = hsl({
    h: accent.h,
    s: clamp(accent.s * 0.82, 55, 92),
    l: lerp(48, 58, smoothstep01(m / 12)),
  });
  const stripeTo = hsl({
    h: accent2.h + 18,
    s: clamp(accent2.s * 0.72, 48, 85),
    l: lerp(40, 52, smoothstep01(m / 12)),
  });

  return {
    chartBackdrop,
    chartVignette,
    gridLine,
    gridLineFaint,
    curveStroke,
    curveGlow,
    areaTop,
    areaBot,
    hue: accent.h,
    tier,
    stripeFrom,
    stripeTo,
  };
}
