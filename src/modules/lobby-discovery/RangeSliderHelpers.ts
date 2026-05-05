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
