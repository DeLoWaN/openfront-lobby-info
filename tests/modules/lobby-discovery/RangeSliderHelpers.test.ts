import { describe, it, expect } from 'vitest';
import {
  clampToStops,
  valueToPosition,
  positionToValue,
  nearestStop,
} from '@/modules/lobby-discovery/RangeSliderHelpers';

describe('clampToStops', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];

  it('returns value when inside [first, last]', () => {
    expect(clampToStops(7, stops)).toBe(7);
    expect(clampToStops(2, stops)).toBe(2);
    expect(clampToStops(62, stops)).toBe(62);
  });

  it('clamps below the first stop', () => {
    expect(clampToStops(1, stops)).toBe(2);
    expect(clampToStops(-100, stops)).toBe(2);
  });

  it('clamps above the last stop', () => {
    expect(clampToStops(63, stops)).toBe(62);
    expect(clampToStops(9999, stops)).toBe(62);
  });
});

describe('valueToPosition', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];
  // 11 stops, n = 10 segments, so each stop sits at i / 10.

  it('maps each stop to its index / n position', () => {
    expect(valueToPosition(2, stops)).toBeCloseTo(0.0);
    expect(valueToPosition(3, stops)).toBeCloseTo(0.1);
    expect(valueToPosition(4, stops)).toBeCloseTo(0.2);
    expect(valueToPosition(5, stops)).toBeCloseTo(0.3);
    expect(valueToPosition(6, stops)).toBeCloseTo(0.4);
    expect(valueToPosition(8, stops)).toBeCloseTo(0.5);
    expect(valueToPosition(10, stops)).toBeCloseTo(0.6);
    expect(valueToPosition(15, stops)).toBeCloseTo(0.7);
    expect(valueToPosition(20, stops)).toBeCloseTo(0.8);
    expect(valueToPosition(30, stops)).toBeCloseTo(0.9);
    expect(valueToPosition(62, stops)).toBeCloseTo(1.0);
  });

  it('interpolates linearly within a segment', () => {
    // 7 is halfway between 6 (pos 0.4) and 8 (pos 0.5).
    expect(valueToPosition(7, stops)).toBeCloseTo(0.45);
    // 25 is halfway between 20 (pos 0.8) and 30 (pos 0.9).
    expect(valueToPosition(25, stops)).toBeCloseTo(0.85);
    // 12 is 2/5 of the way between 10 (pos 0.6) and 15 (pos 0.7).
    expect(valueToPosition(12, stops)).toBeCloseTo(0.6 + 0.4 * 0.1);
  });

  it('clamps below the first stop to position 0', () => {
    expect(valueToPosition(1, stops)).toBeCloseTo(0.0);
  });

  it('clamps above the last stop to position 1', () => {
    expect(valueToPosition(99, stops)).toBeCloseTo(1.0);
  });

  it('handles linear fallback (two-stop range)', () => {
    // With only [min, max], it reduces to (v - min) / (max - min).
    const linear = [1, 125];
    expect(valueToPosition(1, linear)).toBeCloseTo(0.0);
    expect(valueToPosition(125, linear)).toBeCloseTo(1.0);
    expect(valueToPosition(63, linear)).toBeCloseTo((63 - 1) / 124);
  });
});

describe('positionToValue', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];

  it('returns each stop at its anchor position', () => {
    expect(positionToValue(0.0, stops)).toBe(2);
    expect(positionToValue(0.1, stops)).toBe(3);
    expect(positionToValue(0.4, stops)).toBe(6);
    expect(positionToValue(0.5, stops)).toBe(8);
    expect(positionToValue(0.9, stops)).toBe(30);
    expect(positionToValue(1.0, stops)).toBe(62);
  });

  it('interpolates within a segment and rounds to integer', () => {
    // Halfway through 6→8 (0.4–0.5) is 7.
    expect(positionToValue(0.45, stops)).toBe(7);
    // Halfway through 20→30 (0.8–0.9) is 25.
    expect(positionToValue(0.85, stops)).toBe(25);
  });

  it('clamps positions outside [0, 1]', () => {
    expect(positionToValue(-0.5, stops)).toBe(2);
    expect(positionToValue(2, stops)).toBe(62);
  });

  it('handles position = 1 without overflow (last stop)', () => {
    expect(positionToValue(1, stops)).toBe(62);
  });

  it('round-trips with valueToPosition for every stop', () => {
    for (const stop of stops) {
      expect(positionToValue(valueToPosition(stop, stops), stops)).toBe(stop);
    }
  });
});

describe('nearestStop', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];

  it('returns exact stops unchanged', () => {
    expect(nearestStop(6, stops)).toBe(6);
    expect(nearestStop(15, stops)).toBe(15);
  });

  it('rounds toward the closer neighbor', () => {
    expect(nearestStop(11, stops)).toBe(10); // |11-10|=1 < |11-15|=4
    expect(nearestStop(13, stops)).toBe(15); // |13-15|=2 < |13-10|=3
    expect(nearestStop(40, stops)).toBe(30); // |40-30|=10 < |40-62|=22
  });

  it('breaks ties by preferring the lower stop', () => {
    // 7 is equidistant from 6 and 8 -> prefer 6.
    expect(nearestStop(7, stops)).toBe(6);
    // 9 is equidistant from 8 and 10 -> prefer 8.
    expect(nearestStop(9, stops)).toBe(8);
    // 25 is equidistant from 20 and 30 -> prefer 20.
    expect(nearestStop(25, stops)).toBe(20);
  });

  it('clamps to first/last stop for out-of-range values', () => {
    expect(nearestStop(0, stops)).toBe(2);
    expect(nearestStop(100, stops)).toBe(62);
  });
});
