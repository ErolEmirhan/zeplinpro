/**
 * 0,00× başlangıç; üstel büyüme; crashPoint’e kadar (ham değer) kenetlenir.
 * Görüntü için yuvarlanmış değer ayrı fonksiyonda.
 */
/** büyüme katsayısı — türev ve görsel senkron için dışa açık (yüksek = 0–0,3× bandı daha çabuk). */
export const GROWTH = 0.24;
/** Başlangıç ölçeği; GROWTH ile birlikte erken çarpan tırmanışını belirler. */
export const EPS = 0.032;

/** Tur mantığı / patlama eşiği (yuvarlanmamış, monoton). */
export function multiplierRawAtElapsedSeconds(
  elapsedSec: number,
  crashPoint: number,
): number {
  if (elapsedSec <= 0) return 0;
  const raw = EPS * (Math.exp(GROWTH * elapsedSec) - 1);
  return Math.min(raw, crashPoint);
}

export function multiplierAtElapsedSeconds(
  elapsedSec: number,
  crashPoint: number,
): number {
  const raw = multiplierRawAtElapsedSeconds(elapsedSec, crashPoint);
  return Math.round(raw * 100) / 100;
}

export function elapsedToReachMultiplier(target: number): number {
  if (target <= 0) return 0;
  return Math.log(target / EPS + 1) / GROWTH;
}

/** Patlamadan önce: dm/dt = GROWTH·EPS·e^(GROWTH t); plato sonrası 0 (görsel senkron). */
export function multiplierRawDerivativeAtElapsedSeconds(
  elapsedSec: number,
  crashPoint: number,
): number {
  if (elapsedSec <= 0) return 0;
  const uncapped = EPS * (Math.exp(GROWTH * elapsedSec) - 1);
  if (uncapped >= crashPoint - 1e-12) return 0;
  return GROWTH * EPS * Math.exp(GROWTH * elapsedSec);
}
