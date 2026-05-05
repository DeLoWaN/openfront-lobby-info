/**
 * Pure mapping helpers for the dual-thumb range slider.
 *
 * The slider stores a "position" in [0, 1] (mapped to a 0..1000 native range
 * input) and a "value" (an integer in [stops[0], stops[stops.length - 1]]).
 * These helpers translate between the two.
 */

export function clampToStops(value: number, stops: readonly number[]): number {
  if (stops.length === 0) return value;
  const lo = stops[0];
  const hi = stops[stops.length - 1];
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

/**
 * Map an integer value to a position in [0, 1] using `stops` as anchor points.
 * Each stop sits at evenly-spaced position `i / (stops.length - 1)`.
 * Values between stops interpolate linearly within their segment.
 */
export function valueToPosition(value: number, stops: readonly number[]): number {
  if (stops.length < 2) return 0;
  const clamped = clampToStops(value, stops);
  const lastIdx = stops.length - 1;
  if (clamped >= stops[lastIdx]) return 1;
  if (clamped <= stops[0]) return 0;

  for (let i = 0; i < lastIdx; i++) {
    const lo = stops[i];
    const hi = stops[i + 1];
    if (clamped >= lo && clamped <= hi) {
      const segFrac = (clamped - lo) / (hi - lo);
      return (i + segFrac) / lastIdx;
    }
  }

  return 1;
}
