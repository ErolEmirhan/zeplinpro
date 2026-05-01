export type Point2 = { x: number; y: number };

/**
 * Catmull-Rom → kübik Bézier SVG yolu (akıcı uçuş eğrisi).
 */
export function catmullRomToSmoothPath(points: Point2[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0]!;
    return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  let d = `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Son nokta için teğet (°): uzun segment ortalaması + sert clamp — yüksek çarpanda
 * son adımın dikey fırlaması burnu yukarı kaldırmaz.
 */
export function tangentDegreesAtEnd(points: Point2[]): number {
  if (points.length < 2) return -8;
  const n = points.length;
  const look = Math.min(10, n - 1);
  let sx = 0;
  let sy = 0;
  let sw = 0;
  for (let i = 0; i < look; i++) {
    const p = points[n - 1 - i]!;
    const q = points[n - 2 - i]!;
    const w = look - i;
    sx += (p.x - q.x) * w;
    sy += (p.y - q.y) * w;
    sw += w;
  }
  const dx = sx / sw;
  const dy = sy / sw;
  if (Math.abs(dx) < 1e-5 && Math.abs(dy) < 1e-5) return -8;
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return Math.min(8, Math.max(-36, deg));
}

/**
 * Çarpan platoda son örnekler aynı piksele çökünce teğet dalgalanmasın diye kırpma.
 */
export function trimTrailingCoincidentPoints(
  points: Point2[],
  eps = 0.35,
): Point2[] {
  if (points.length < 2) return points;
  let n = points.length;
  while (n > 2) {
    const a = points[n - 1]!;
    const b = points[n - 2]!;
    if (Math.hypot(a.x - b.x, a.y - b.y) > eps) break;
    n--;
  }
  return points.slice(0, n);
}
