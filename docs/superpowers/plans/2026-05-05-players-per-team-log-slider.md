# Players-per-team log-scaled slider — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the linear `1–62` "Players per team" slider with an evenly-positioned stop-based log-style scale starting at `2`, add editable number inputs with `−` / `+` steppers, and change the lock-max-to-2× behavior to dim only the max controls.

**Architecture:** Extract slider logic from `LobbyDiscoveryUI` into a reusable `RangeSlider` component backed by pure mapping helpers. Native `<input type="range">` operates on a `0..1000` position scale; `valueToPosition` / `positionToValue` translate between position and integer value via the stops array. The same component serves both per-team (with stops) and FFA (linear, no stops) sliders.

**Tech Stack:** TypeScript 5.3 strict, esbuild, Vitest + JSDOM, GM_setValue/GM_getValue, no runtime dependencies.

**Companion spec:** [`docs/superpowers/specs/2026-05-05-players-per-team-log-slider-design.md`](../specs/2026-05-05-players-per-team-log-slider-design.md)

---

## File Structure

**New files:**

| File | Responsibility |
|---|---|
| `src/modules/lobby-discovery/RangeSliderHelpers.ts` | Pure functions: `valueToPosition`, `positionToValue`, `nearestStop`, `clampToStops`. No DOM. |
| `src/modules/lobby-discovery/RangeSlider.ts` | Dual-thumb slider component class. Wires range inputs, number inputs, stepper buttons, ticks, lock state. Emits `onChange(min, max)`. |
| `tests/modules/lobby-discovery/RangeSliderHelpers.test.ts` | Unit tests for pure helpers. |
| `tests/modules/lobby-discovery/RangeSlider.test.ts` | JSDOM integration tests for the component. |

**Modified files:**

| File | Change |
|---|---|
| `src/config/constants.ts` | Add `TEAM_PLAYERS_PER_TEAM_STOPS`, `TEAM_MIN_PLAYERS_PER_TEAM`, `TEAM_MAX_PLAYERS_PER_TEAM`. |
| `src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts` | Migration: clamp `minPlayers < 2` to `2` when `gameMode === 'Team'` in `sanitizeCriteria`. |
| `src/modules/lobby-discovery/LobbyDiscoveryUI.ts` | Replace inline `initializeSlider`/`updateSliderRange` with two `RangeSlider` instances. Update markup for editable number inputs, steppers, ticks. Update `setMinTeamCount` to feed `RangeSlider.setMin`. |
| `src/styles/styles.ts` | Add tick, stepper, lock-only-max styles. Remove global `.ld-range.is-locked` opacity rule. |
| `tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts` | Add migration test cases. |

---

## Task 1: Add slider constants

**Files:**
- Modify: `src/config/constants.ts`

- [ ] **Step 1: Add the constants**

Append to `src/config/constants.ts`:

```typescript
/**
 * Stops for the "Players per team" slider — quasi-logarithmic spacing
 * with denser low-end resolution to match real-world team-lobby distribution.
 * Values must be strictly monotonically increasing.
 */
export const TEAM_PLAYERS_PER_TEAM_STOPS = [
  2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62,
] as const;

/**
 * Minimum players-per-team value. 1-per-team would be solo (FFA), so the
 * floor is 2.
 */
export const TEAM_MIN_PLAYERS_PER_TEAM = 2;

/**
 * Maximum players-per-team value (matches OpenFront's lobby capacity ceiling).
 */
export const TEAM_MAX_PLAYERS_PER_TEAM = 62;
```

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/config/constants.ts
git commit -m "feat(discovery): add per-team slider stop constants"
```

---

## Task 2: `RangeSliderHelpers` — `clampToStops`

**Files:**
- Create: `src/modules/lobby-discovery/RangeSliderHelpers.ts`
- Test: `tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { clampToStops } from '@/modules/lobby-discovery/RangeSliderHelpers';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `clampToStops`**

Create `src/modules/lobby-discovery/RangeSliderHelpers.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/lobby-discovery/RangeSliderHelpers.ts tests/modules/lobby-discovery/RangeSliderHelpers.test.ts
git commit -m "feat(discovery): add clampToStops helper"
```

---

## Task 3: `RangeSliderHelpers` — `valueToPosition`

**Files:**
- Modify: `src/modules/lobby-discovery/RangeSliderHelpers.ts`
- Modify: `tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to the test file:

```typescript
import { valueToPosition } from '@/modules/lobby-discovery/RangeSliderHelpers';

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`
Expected: FAIL — `valueToPosition is not exported`.

- [ ] **Step 3: Implement `valueToPosition`**

Append to `src/modules/lobby-discovery/RangeSliderHelpers.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/lobby-discovery/RangeSliderHelpers.ts tests/modules/lobby-discovery/RangeSliderHelpers.test.ts
git commit -m "feat(discovery): add valueToPosition helper"
```

---

## Task 4: `RangeSliderHelpers` — `positionToValue`

**Files:**
- Modify: `src/modules/lobby-discovery/RangeSliderHelpers.ts`
- Modify: `tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to the test file:

```typescript
import { positionToValue } from '@/modules/lobby-discovery/RangeSliderHelpers';

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
    // Guard: t = 1 * n = 10, i = 10 would overflow. Must return stops[n].
    expect(positionToValue(1, stops)).toBe(62);
  });

  it('round-trips with valueToPosition for every stop', () => {
    for (const stop of stops) {
      expect(positionToValue(valueToPosition(stop, stops), stops)).toBe(stop);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`
Expected: FAIL — `positionToValue is not exported`.

- [ ] **Step 3: Implement `positionToValue`**

Append to `src/modules/lobby-discovery/RangeSliderHelpers.ts`:

```typescript
/**
 * Inverse of `valueToPosition`. Maps a position in [0, 1] to an integer value
 * by interpolating within the segment containing the position, then rounding.
 */
export function positionToValue(position: number, stops: readonly number[]): number {
  if (stops.length < 2) return stops[0] ?? 0;
  const lastIdx = stops.length - 1;
  if (position <= 0) return stops[0];
  if (position >= 1) return stops[lastIdx];

  const t = position * lastIdx;
  const i = Math.floor(t);
  const frac = t - i;
  // i can equal lastIdx only if position === 1, handled above.
  const raw = stops[i] + frac * (stops[i + 1] - stops[i]);
  return Math.round(raw);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/lobby-discovery/RangeSliderHelpers.ts tests/modules/lobby-discovery/RangeSliderHelpers.test.ts
git commit -m "feat(discovery): add positionToValue helper"
```

---

## Task 5: `RangeSliderHelpers` — `nearestStop`

**Files:**
- Modify: `src/modules/lobby-discovery/RangeSliderHelpers.ts`
- Modify: `tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to the test file:

```typescript
import { nearestStop } from '@/modules/lobby-discovery/RangeSliderHelpers';

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
    // 7 is equidistant from 6 and 8 → prefer 6.
    expect(nearestStop(7, stops)).toBe(6);
    // 9 is equidistant from 8 and 10 → prefer 8.
    expect(nearestStop(9, stops)).toBe(8);
    // 25 is equidistant from 20 and 30 → prefer 20.
    expect(nearestStop(25, stops)).toBe(20);
  });

  it('clamps to first/last stop for out-of-range values', () => {
    expect(nearestStop(0, stops)).toBe(2);
    expect(nearestStop(100, stops)).toBe(62);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`
Expected: FAIL — `nearestStop is not exported`.

- [ ] **Step 3: Implement `nearestStop`**

Append to `src/modules/lobby-discovery/RangeSliderHelpers.ts`:

```typescript
/**
 * Return the stop closest to `value`. Ties are broken by preferring the
 * lower stop (deterministic; locked by tests).
 */
export function nearestStop(value: number, stops: readonly number[]): number {
  if (stops.length === 0) return value;
  const clamped = clampToStops(value, stops);
  let best = stops[0];
  let bestDelta = Math.abs(clamped - best);
  for (let i = 1; i < stops.length; i++) {
    const delta = Math.abs(clamped - stops[i]);
    // Strict `<` preserves the lower stop on ties.
    if (delta < bestDelta) {
      best = stops[i];
      bestDelta = delta;
    }
  }
  return best;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/lobby-discovery/RangeSliderHelpers.ts tests/modules/lobby-discovery/RangeSliderHelpers.test.ts
git commit -m "feat(discovery): add nearestStop helper"
```

---

## Task 6: Settings migration — clamp `minPlayers < 2` for Team criteria

**Files:**
- Modify: `src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts:370-401`
- Modify: `tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`

Note: `DiscoveryCriteria` shares `minPlayers` / `maxPlayers` field names between FFA and Team modes; the per-team values are stored in these fields when `gameMode === 'Team'`. Migration must therefore be gameMode-aware.

- [ ] **Step 1: Write the failing tests**

Append to `tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`:

```typescript
describe('sanitizeCriteria — Team minPlayers floor', () => {
  it('clamps Team minPlayers below 2 to 2', () => {
    const result = sanitizeCriteria([
      { gameMode: 'Team', teamCount: 'Duos', minPlayers: 1, maxPlayers: 62 },
    ]);
    expect(result[0].minPlayers).toBe(2);
    expect(result[0].maxPlayers).toBe(62);
  });

  it('clamps Team minPlayers below 2, bumps maxPlayers if needed', () => {
    const result = sanitizeCriteria([
      { gameMode: 'Team', teamCount: null, minPlayers: 1, maxPlayers: 1 },
    ]);
    expect(result[0].minPlayers).toBe(2);
    expect(result[0].maxPlayers).toBe(2);
  });

  it('preserves Team minPlayers >= 2 untouched even if not on stops list', () => {
    const result = sanitizeCriteria([
      { gameMode: 'Team', teamCount: 'Trios', minPlayers: 7, maxPlayers: 12 },
    ]);
    expect(result[0].minPlayers).toBe(7);
    expect(result[0].maxPlayers).toBe(12);
  });

  it('does not apply the per-team floor to FFA criteria', () => {
    const result = sanitizeCriteria([
      { gameMode: 'FFA', teamCount: null, minPlayers: 1, maxPlayers: 125 },
    ]);
    expect(result[0].minPlayers).toBe(1);
    expect(result[0].maxPlayers).toBe(125);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`
Expected: FAIL — first three assertions fail (no clamping yet).

- [ ] **Step 3: Implement the migration**

In `src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts`, add the constant import and update `sanitizeCriteria`. Replace the existing `sanitized.push(...)` block (around lines 391–397) with:

```typescript
    let minPlayers = sanitizeNumber(candidate.minPlayers);
    let maxPlayers = sanitizeNumber(candidate.maxPlayers);

    if (gameMode === 'Team') {
      if (typeof minPlayers === 'number' && minPlayers < TEAM_MIN_PLAYERS_PER_TEAM) {
        minPlayers = TEAM_MIN_PLAYERS_PER_TEAM;
      }
      if (
        typeof minPlayers === 'number' &&
        typeof maxPlayers === 'number' &&
        maxPlayers < minPlayers
      ) {
        maxPlayers = minPlayers;
      }
    }

    sanitized.push({
      gameMode,
      teamCount: gameMode === 'Team' ? parseTeamCount(candidate.teamCount ?? null) : null,
      minPlayers,
      maxPlayers,
      modifiers: sanitizeModifierFilters(candidate.modifiers),
    });
```

Add the import at the top of the file (next to existing imports):

```typescript
import { TEAM_MIN_PLAYERS_PER_TEAM } from '@/config/constants';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`
Expected: PASS for the new tests; existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts
git commit -m "fix(discovery): clamp saved per-team min below 2 to floor"
```

---

## Task 7: `RangeSlider` — class skeleton + linear fallback drag

**Files:**
- Create: `src/modules/lobby-discovery/RangeSlider.ts`
- Test: `tests/modules/lobby-discovery/RangeSlider.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/modules/lobby-discovery/RangeSlider.test.ts`:

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RangeSlider } from '@/modules/lobby-discovery/RangeSlider';

function setupDOM(): void {
  document.body.innerHTML = `
    <div id="root">
      <div class="ld-range">
        <div class="track"><div class="track-fill" id="fill"></div></div>
        <input type="range" id="min-pos" min="0" max="1000" value="0" class="capacity-slider capacity-slider-min">
        <input type="range" id="max-pos" min="0" max="1000" value="1000" class="capacity-slider capacity-slider-max">
      </div>
      <div class="ld-stepper" data-role="min">
        <button type="button" class="ld-step-btn" data-action="dec" data-target="min">−</button>
        <input type="number" id="min-num" value="1">
        <button type="button" class="ld-step-btn" data-action="inc" data-target="min">+</button>
      </div>
      <div class="ld-stepper" data-role="max">
        <button type="button" class="ld-step-btn" data-action="dec" data-target="max">−</button>
        <input type="number" id="max-num" value="125">
        <button type="button" class="ld-step-btn" data-action="inc" data-target="max">+</button>
      </div>
      <div id="ticks"></div>
    </div>
  `;
}

describe('RangeSlider — linear fallback (no stops)', () => {
  beforeEach(setupDOM);

  it('initialises number inputs from config bounds when defaults are out of range', () => {
    const onChange = vi.fn();
    new RangeSlider({
      rootId: 'root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 1, max: 125 },
      onChange,
    });
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    const maxNum = document.getElementById('max-num') as HTMLInputElement;
    expect(minNum.value).toBe('1');
    expect(maxNum.value).toBe('125');
  });

  it('drag on min position fires onChange with new (min, max)', () => {
    const onChange = vi.fn();
    new RangeSlider({
      rootId: 'root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 1, max: 125 },
      onChange,
    });
    const minPos = document.getElementById('min-pos') as HTMLInputElement;
    minPos.value = '500';  // halfway → value ≈ 63
    minPos.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalled();
    const [min, max] = onChange.mock.calls.at(-1)!;
    expect(min).toBe(63);  // round(1 + 0.5 * 124) = 63
    expect(max).toBe(125);
  });

  it('drag past max bumps min back so min <= max', () => {
    const onChange = vi.fn();
    new RangeSlider({
      rootId: 'root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 1, max: 125 },
      onChange,
    });
    const minPos = document.getElementById('min-pos') as HTMLInputElement;
    const maxPos = document.getElementById('max-pos') as HTMLInputElement;
    maxPos.value = '500';
    maxPos.dispatchEvent(new Event('input'));
    minPos.value = '900';  // would map to ~112, > 63
    minPos.dispatchEvent(new Event('input'));
    const [min, max] = onChange.mock.calls.at(-1)!;
    expect(min).toBeLessThanOrEqual(max);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSlider.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the `RangeSlider` skeleton**

Create `src/modules/lobby-discovery/RangeSlider.ts`:

```typescript
import {
  clampToStops,
  nearestStop,
  positionToValue,
  valueToPosition,
} from '@/modules/lobby-discovery/RangeSliderHelpers';

export interface RangeSliderConfig {
  rootId: string;
  minSliderId: string;  // <input type="range"> 0..1000 for min position
  maxSliderId: string;  // <input type="range"> 0..1000 for max position
  minInputId: string;   // <input type="number"> for min value
  maxInputId: string;   // <input type="number"> for max value
  fillId: string;       // <div> whose --lo / --hi CSS vars draw the fill
  ticksContainerId?: string;
  bounds: { min: number; max: number };
  stops?: readonly number[];
  lockMaxToTwiceMin?: () => boolean;
  onChange: (min: number, max: number) => void;
}

const POSITION_RANGE = 1000;

export class RangeSlider {
  private readonly minSlider: HTMLInputElement;
  private readonly maxSlider: HTMLInputElement;
  private readonly minInput: HTMLInputElement;
  private readonly maxInput: HTMLInputElement;
  private readonly fill: HTMLElement | null;
  private readonly rangeRoot: HTMLElement | null;
  private readonly stops: readonly number[];
  private readonly cfg: RangeSliderConfig;
  private lastMin: number;
  private lastMax: number;

  constructor(cfg: RangeSliderConfig) {
    this.cfg = cfg;
    this.stops = cfg.stops ?? [cfg.bounds.min, cfg.bounds.max];
    this.minSlider = document.getElementById(cfg.minSliderId) as HTMLInputElement;
    this.maxSlider = document.getElementById(cfg.maxSliderId) as HTMLInputElement;
    this.minInput = document.getElementById(cfg.minInputId) as HTMLInputElement;
    this.maxInput = document.getElementById(cfg.maxInputId) as HTMLInputElement;
    this.fill = document.getElementById(cfg.fillId);
    this.rangeRoot = this.fill?.parentElement?.parentElement ?? null;

    if (!this.minSlider || !this.maxSlider || !this.minInput || !this.maxInput) {
      throw new Error(`RangeSlider: missing required element in ${cfg.rootId}`);
    }

    this.minSlider.min = '0';
    this.minSlider.max = String(POSITION_RANGE);
    this.maxSlider.min = '0';
    this.maxSlider.max = String(POSITION_RANGE);

    this.lastMin = this.readInputClamped(this.minInput, cfg.bounds.min);
    this.lastMax = this.readInputClamped(this.maxInput, cfg.bounds.max);
    if (this.lastMax < this.lastMin) this.lastMax = this.lastMin;

    this.minSlider.addEventListener('input', this.onMinSliderInput);
    this.maxSlider.addEventListener('input', this.onMaxSliderInput);
    this.minInput.addEventListener('change', this.onMinInputChange);
    this.maxInput.addEventListener('change', this.onMaxInputChange);

    this.applyValues(this.lastMin, this.lastMax, { fireOnChange: false });
  }

  /** Public setter — used when min is auto-bumped from outside (e.g. team-count chips). */
  setMin(value: number): void {
    this.applyValues(value, this.lastMax, { fireOnChange: true });
  }

  /** Public setter — used by reset / load. */
  setRange(min: number, max: number): void {
    this.applyValues(min, max, { fireOnChange: false });
  }

  private readInputClamped(el: HTMLInputElement, fallback: number): number {
    const parsed = parseInt(el.value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return clampToStops(parsed, [this.cfg.bounds.min, this.cfg.bounds.max]);
  }

  private onMinSliderInput = (): void => {
    const position = parseInt(this.minSlider.value, 10) / POSITION_RANGE;
    let value = positionToValue(position, this.stops);
    if (this.cfg.stops) value = nearestStop(value, this.stops);
    this.applyValues(value, this.lastMax, { fireOnChange: true });
  };

  private onMaxSliderInput = (): void => {
    const position = parseInt(this.maxSlider.value, 10) / POSITION_RANGE;
    let value = positionToValue(position, this.stops);
    if (this.cfg.stops) value = nearestStop(value, this.stops);
    this.applyValues(this.lastMin, value, { fireOnChange: true });
  };

  private onMinInputChange = (): void => {
    const parsed = parseInt(this.minInput.value, 10);
    if (!Number.isFinite(parsed)) {
      this.applyValues(this.lastMin, this.lastMax, { fireOnChange: false });
      return;
    }
    const clamped = clampToStops(parsed, [this.cfg.bounds.min, this.cfg.bounds.max]);
    this.applyValues(clamped, this.lastMax, { fireOnChange: true });
  };

  private onMaxInputChange = (): void => {
    const parsed = parseInt(this.maxInput.value, 10);
    if (!Number.isFinite(parsed)) {
      this.applyValues(this.lastMin, this.lastMax, { fireOnChange: false });
      return;
    }
    const clamped = clampToStops(parsed, [this.cfg.bounds.min, this.cfg.bounds.max]);
    this.applyValues(this.lastMin, clamped, { fireOnChange: true });
  };

  private applyValues(
    min: number,
    max: number,
    opts: { fireOnChange: boolean }
  ): void {
    let nextMin = min;
    let nextMax = max;

    // Lock-max-to-2× takes precedence when active.
    if (this.cfg.lockMaxToTwiceMin?.()) {
      nextMax = clampToStops(nextMin * 2, [this.cfg.bounds.min, this.cfg.bounds.max]);
    }

    if (nextMin > nextMax) {
      // Whichever was just changed wins; bump the other to match.
      // Heuristic: if min increased above max, bump max; otherwise bump min.
      if (nextMin > this.lastMin) nextMax = nextMin;
      else nextMin = nextMax;
    }

    this.lastMin = nextMin;
    this.lastMax = nextMax;

    this.minInput.value = String(nextMin);
    this.maxInput.value = String(nextMax);
    this.minSlider.value = String(Math.round(valueToPosition(nextMin, this.stops) * POSITION_RANGE));
    this.maxSlider.value = String(Math.round(valueToPosition(nextMax, this.stops) * POSITION_RANGE));

    if (this.rangeRoot) {
      const lo = valueToPosition(nextMin, this.stops) * 100;
      const hi = valueToPosition(nextMax, this.stops) * 100;
      this.rangeRoot.style.setProperty('--lo', `${lo}%`);
      this.rangeRoot.style.setProperty('--hi', `${hi}%`);
    }

    if (opts.fireOnChange) this.cfg.onChange(nextMin, nextMax);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSlider.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full test suite — nothing else should break**

Run: `npm test -- --run`
Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/modules/lobby-discovery/RangeSlider.ts tests/modules/lobby-discovery/RangeSlider.test.ts
git commit -m "feat(discovery): add RangeSlider component (linear mode)"
```

---

## Task 8: `RangeSlider` — snap-on-drag with stops

**Files:**
- Modify: `tests/modules/lobby-discovery/RangeSlider.test.ts`

The implementation in Task 7 already handles `nearestStop` when `cfg.stops` is provided. This task just adds tests proving stop-mode behavior.

- [ ] **Step 1: Write the failing tests**

Append to `tests/modules/lobby-discovery/RangeSlider.test.ts`:

```typescript
describe('RangeSlider — with stops (snap-on-drag)', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];

  beforeEach(() => {
    setupDOM();
    // Reset starting values to per-team defaults.
    (document.getElementById('min-num') as HTMLInputElement).value = '2';
    (document.getElementById('max-num') as HTMLInputElement).value = '62';
  });

  function build(onChange = vi.fn(), lockFn?: () => boolean) {
    return new RangeSlider({
      rootId: 'root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 2, max: 62 },
      stops,
      lockMaxToTwiceMin: lockFn,
      onChange,
    });
  }

  it('drag snaps the value to the nearest stop', () => {
    const onChange = vi.fn();
    build(onChange);
    const minPos = document.getElementById('min-pos') as HTMLInputElement;
    // Position 0.42 maps to value ≈ 6.2; nearest stop is 6.
    minPos.value = '420';
    minPos.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledWith(6, 62);
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    expect(minNum.value).toBe('6');
  });

  it('typing a non-stop value into the number input keeps that exact value', () => {
    const onChange = vi.fn();
    build(onChange);
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    minNum.value = '7';
    minNum.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalledWith(7, 62);
    expect(minNum.value).toBe('7');
  });

  it('typed value > bounds.max clamps to bounds.max', () => {
    const onChange = vi.fn();
    build(onChange);
    const maxNum = document.getElementById('max-num') as HTMLInputElement;
    maxNum.value = '200';
    maxNum.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalledWith(2, 62);
    expect(maxNum.value).toBe('62');
  });

  it('typed empty string reverts to last value', () => {
    const onChange = vi.fn();
    build(onChange);
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    minNum.value = '';
    minNum.dispatchEvent(new Event('change'));
    expect(minNum.value).toBe('2');  // unchanged from default
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSlider.test.ts`
Expected: PASS — Task 7's implementation already covers these.

- [ ] **Step 3: Commit (test-only addition)**

```bash
git add tests/modules/lobby-discovery/RangeSlider.test.ts
git commit -m "test(discovery): cover RangeSlider snap-on-drag and typed values"
```

---

## Task 9: `RangeSlider` — stepper buttons

**Files:**
- Modify: `src/modules/lobby-discovery/RangeSlider.ts`
- Modify: `tests/modules/lobby-discovery/RangeSlider.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/modules/lobby-discovery/RangeSlider.test.ts`:

```typescript
describe('RangeSlider — stepper buttons', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];

  beforeEach(() => {
    setupDOM();
    (document.getElementById('min-num') as HTMLInputElement).value = '5';
    (document.getElementById('max-num') as HTMLInputElement).value = '20';
  });

  function build(onChange = vi.fn()) {
    return new RangeSlider({
      rootId: 'root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 2, max: 62 },
      stops,
      onChange,
    });
  }

  function clickStep(target: 'min' | 'max', action: 'inc' | 'dec'): void {
    const btn = document.querySelector(
      `.ld-step-btn[data-action="${action}"][data-target="${target}"]`
    ) as HTMLButtonElement;
    btn.click();
  }

  it('+ button increments the value by 1', () => {
    const onChange = vi.fn();
    build(onChange);
    clickStep('min', 'inc');
    expect(onChange).toHaveBeenCalledWith(6, 20);
    expect((document.getElementById('min-num') as HTMLInputElement).value).toBe('6');
  });

  it('− button decrements the value by 1', () => {
    const onChange = vi.fn();
    build(onChange);
    clickStep('max', 'dec');
    expect(onChange).toHaveBeenCalledWith(5, 19);
  });

  it('+ button clamps at bounds.max', () => {
    (document.getElementById('max-num') as HTMLInputElement).value = '62';
    const onChange = vi.fn();
    build(onChange);
    clickStep('max', 'inc');
    expect((document.getElementById('max-num') as HTMLInputElement).value).toBe('62');
  });

  it('− button clamps at bounds.min', () => {
    (document.getElementById('min-num') as HTMLInputElement).value = '2';
    const onChange = vi.fn();
    build(onChange);
    clickStep('min', 'dec');
    expect((document.getElementById('min-num') as HTMLInputElement).value).toBe('2');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSlider.test.ts`
Expected: FAIL — stepper buttons not wired.

- [ ] **Step 3: Implement stepper wiring**

Add to `RangeSlider` constructor (after the existing `addEventListener` calls):

```typescript
    this.wireSteppers();
```

Add this method to the class:

```typescript
  private wireSteppers(): void {
    const root = document.getElementById(this.cfg.rootId);
    if (!root) return;
    const buttons = root.querySelectorAll<HTMLButtonElement>('.ld-step-btn');
    buttons.forEach((btn) => {
      const target = btn.dataset.target as 'min' | 'max' | undefined;
      const action = btn.dataset.action as 'inc' | 'dec' | undefined;
      if (!target || !action) return;
      btn.addEventListener('click', () => {
        const delta = action === 'inc' ? 1 : -1;
        if (target === 'min') {
          const next = clampToStops(
            this.lastMin + delta,
            [this.cfg.bounds.min, this.cfg.bounds.max]
          );
          this.applyValues(next, this.lastMax, { fireOnChange: true });
        } else {
          const next = clampToStops(
            this.lastMax + delta,
            [this.cfg.bounds.min, this.cfg.bounds.max]
          );
          this.applyValues(this.lastMin, next, { fireOnChange: true });
        }
      });
    });
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSlider.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/lobby-discovery/RangeSlider.ts tests/modules/lobby-discovery/RangeSlider.test.ts
git commit -m "feat(discovery): wire stepper buttons in RangeSlider"
```

---

## Task 10: `RangeSlider` — lock-max-to-2× and is-max-locked class

**Files:**
- Modify: `src/modules/lobby-discovery/RangeSlider.ts`
- Modify: `tests/modules/lobby-discovery/RangeSlider.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/modules/lobby-discovery/RangeSlider.test.ts`:

```typescript
describe('RangeSlider — lock-max-to-2×', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];
  let locked = false;

  beforeEach(() => {
    setupDOM();
    locked = false;
    (document.getElementById('min-num') as HTMLInputElement).value = '4';
    (document.getElementById('max-num') as HTMLInputElement).value = '62';
  });

  function build() {
    const onChange = vi.fn();
    const slider = new RangeSlider({
      rootId: 'root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 2, max: 62 },
      stops,
      lockMaxToTwiceMin: () => locked,
      onChange,
    });
    return { slider, onChange };
  }

  it('with lock active, changing min updates max to 2× min', () => {
    locked = true;
    const { onChange } = build();
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    minNum.value = '5';
    minNum.dispatchEvent(new Event('change'));
    const [min, max] = onChange.mock.calls.at(-1)!;
    expect(min).toBe(5);
    expect(max).toBe(10);
  });

  it('with lock active and min × 2 exceeding bounds.max, max clamps to bounds.max', () => {
    locked = true;
    const { onChange } = build();
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    minNum.value = '40';
    minNum.dispatchEvent(new Event('change'));
    const [, max] = onChange.mock.calls.at(-1)!;
    expect(max).toBe(62);
  });

  it('toggling lock applies disabled + .is-max-locked on max controls', () => {
    const { slider } = build();
    locked = true;
    slider.applyLockState();
    const maxSlider = document.getElementById('max-pos') as HTMLInputElement;
    const maxNum = document.getElementById('max-num') as HTMLInputElement;
    expect(maxSlider.disabled).toBe(true);
    expect(maxNum.disabled).toBe(true);
    expect(maxSlider.classList.contains('is-max-locked')).toBe(true);
    const decBtn = document.querySelector(
      '.ld-step-btn[data-target="max"][data-action="dec"]'
    ) as HTMLButtonElement;
    const incBtn = document.querySelector(
      '.ld-step-btn[data-target="max"][data-action="inc"]'
    ) as HTMLButtonElement;
    expect(decBtn.disabled).toBe(true);
    expect(incBtn.disabled).toBe(true);
  });

  it('removing lock re-enables max controls', () => {
    const { slider } = build();
    locked = true;
    slider.applyLockState();
    locked = false;
    slider.applyLockState();
    const maxSlider = document.getElementById('max-pos') as HTMLInputElement;
    expect(maxSlider.disabled).toBe(false);
    expect(maxSlider.classList.contains('is-max-locked')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSlider.test.ts`
Expected: FAIL — `applyLockState is not a function` and disabled-state assertions fail.

- [ ] **Step 3: Add `applyLockState` to `RangeSlider`**

Add this public method to the class:

```typescript
  /** Toggle the disabled appearance + behavior on max-side controls. */
  applyLockState(): void {
    const locked = !!this.cfg.lockMaxToTwiceMin?.();
    this.maxSlider.disabled = locked;
    this.maxSlider.classList.toggle('is-max-locked', locked);
    this.maxInput.disabled = locked;

    const root = document.getElementById(this.cfg.rootId);
    if (root) {
      root
        .querySelectorAll<HTMLButtonElement>('.ld-step-btn[data-target="max"]')
        .forEach((btn) => { btn.disabled = locked; });
    }

    if (locked) {
      // Re-apply the 2× constraint so visual state matches.
      this.applyValues(this.lastMin, this.lastMax, { fireOnChange: false });
    }
  }
```

Call `this.applyLockState();` once at the end of the constructor so initial state is correct.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSlider.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/lobby-discovery/RangeSlider.ts tests/modules/lobby-discovery/RangeSlider.test.ts
git commit -m "feat(discovery): lock only max controls in RangeSlider"
```

---

## Task 11: `RangeSlider` — tick rendering

**Files:**
- Modify: `src/modules/lobby-discovery/RangeSlider.ts`
- Modify: `tests/modules/lobby-discovery/RangeSlider.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/modules/lobby-discovery/RangeSlider.test.ts`:

```typescript
describe('RangeSlider — tick rendering', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];

  beforeEach(setupDOM);

  it('renders one tick + label per stop in the ticks container', () => {
    new RangeSlider({
      rootId: 'root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      ticksContainerId: 'ticks',
      bounds: { min: 2, max: 62 },
      stops,
      onChange: () => {},
    });
    const ticks = document.querySelectorAll('#ticks .ld-tick');
    const labels = document.querySelectorAll('#ticks .ld-tick-label');
    expect(ticks.length).toBe(stops.length);
    expect(labels.length).toBe(stops.length);
    expect(labels[0].textContent).toBe('2');
    expect(labels[labels.length - 1].textContent).toBe('62');
  });

  it('positions each tick at valueToPosition(stop) * 100%', () => {
    new RangeSlider({
      rootId: 'root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      ticksContainerId: 'ticks',
      bounds: { min: 2, max: 62 },
      stops,
      onChange: () => {},
    });
    const ticks = document.querySelectorAll<HTMLElement>('#ticks .ld-tick');
    expect(ticks[0].style.left).toBe('0%');
    expect(ticks[4].style.left).toBe('40%');  // value 6 → 0.4
    expect(ticks[ticks.length - 1].style.left).toBe('100%');
  });

  it('does not render ticks when ticksContainerId is omitted', () => {
    new RangeSlider({
      rootId: 'root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 1, max: 125 },
      onChange: () => {},
    });
    expect(document.querySelectorAll('#ticks .ld-tick').length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSlider.test.ts`
Expected: FAIL — ticks aren't rendered yet.

- [ ] **Step 3: Implement tick rendering**

Call `this.renderTicks();` once in the constructor (after `applyValues`). Add the method:

```typescript
  private renderTicks(): void {
    if (!this.cfg.ticksContainerId || !this.cfg.stops) return;
    const container = document.getElementById(this.cfg.ticksContainerId);
    if (!container) return;

    container.innerHTML = '';
    for (const stop of this.cfg.stops) {
      const pct = valueToPosition(stop, this.cfg.stops) * 100;
      const tick = document.createElement('div');
      tick.className = 'ld-tick';
      tick.style.left = `${pct}%`;
      const label = document.createElement('span');
      label.className = 'ld-tick-label';
      label.style.left = `${pct}%`;
      label.textContent = String(stop);
      container.appendChild(tick);
      container.appendChild(label);
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/modules/lobby-discovery/RangeSlider.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/lobby-discovery/RangeSlider.ts tests/modules/lobby-discovery/RangeSlider.test.ts
git commit -m "feat(discovery): render ticks for stop-based RangeSlider"
```

---

## Task 12: Add styles for steppers, ticks, and lock-only-max

**Files:**
- Modify: `src/styles/styles.ts:381-388` (existing `.ld-range.is-locked` rules)
- Modify: `src/styles/styles.ts` (append new rules)

- [ ] **Step 1: Remove the global `.ld-range.is-locked` opacity rule**

In `src/styles/styles.ts`, replace:

```css
    .ld-range.is-locked {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .ld-range.is-locked .capacity-slider-max {
      pointer-events: none;
    }
```

with this new max-thumb-only rule:

```css
    .capacity-slider.is-max-locked::-webkit-slider-thumb {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .capacity-slider.is-max-locked::-moz-range-thumb {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .capacity-slider.is-max-locked {
      pointer-events: none;
    }
```

- [ ] **Step 2: Append stepper, ticks, and disabled-input styles**

Append to the styles string (after the existing slider styles):

```css
    /* Stepper (number input + - / + buttons) */
    .ld-stepper {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: rgba(0,0,0,0.25);
      border: 1px solid var(--of-hud-line-1);
      border-radius: 6px;
      padding: 2px 4px;
      font-family: ${FONTS.mono};
    }
    .ld-stepper input[type="number"] {
      width: 2.5em;
      background: transparent;
      border: none;
      color: var(--of-hud-text-1);
      font: inherit;
      text-align: center;
      padding: 0 2px;
      font-variant-numeric: tabular-nums;
      -moz-appearance: textfield;
    }
    .ld-stepper input[type="number"]::-webkit-outer-spin-button,
    .ld-stepper input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .ld-stepper input[type="number"]:focus { outline: none; color: var(--of-hud-accent); }
    .ld-stepper input[type="number"]:disabled { opacity: 0.45; cursor: not-allowed; }
    .ld-step-btn {
      width: 18px; height: 18px;
      display: inline-flex; align-items: center; justify-content: center;
      background: transparent;
      border: none;
      color: var(--of-hud-text-3);
      cursor: pointer;
      border-radius: 3px;
      font: inherit;
      line-height: 1;
      padding: 0;
    }
    .ld-step-btn:hover:not(:disabled) {
      background: var(--of-hud-bg-3);
      color: var(--of-hud-text-1);
    }
    .ld-step-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Ticks under the slider track */
    .ld-ticks {
      position: relative;
      height: 18px;
      margin: 6px 6px 4px;
      pointer-events: none;
    }
    .ld-tick {
      position: absolute;
      top: 0;
      width: 1px;
      height: 4px;
      background: var(--of-hud-text-4);
      transform: translateX(-0.5px);
    }
    .ld-tick-label {
      position: absolute;
      top: 6px;
      transform: translateX(-50%);
      font-family: ${FONTS.mono};
      font-size: 10px;
      color: var(--of-hud-text-3);
      font-variant-numeric: tabular-nums;
    }
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles/styles.ts
git commit -m "feat(discovery): add stepper, tick, and lock-only-max styles"
```

---

## Task 13: Update markup in `LobbyDiscoveryUI`

**Files:**
- Modify: `src/modules/lobby-discovery/LobbyDiscoveryUI.ts:1163-1179` (per-team slider markup)
- Modify: `src/modules/lobby-discovery/LobbyDiscoveryUI.ts` (FFA slider markup, ~line 1117–1135)

- [ ] **Step 1: Replace per-team slider markup**

Find the per-team `<div class="ld-slider-row">` block (currently around lines 1163–1179) and replace with:

```html
<div class="ld-slider-row">
  <div class="ld-slider-label">
    <span>Players per team</span>
    <span class="val">
      <div class="ld-stepper" data-role="min">
        <button type="button" class="ld-step-btn" data-action="dec" data-target="min" aria-label="Decrease minimum">−</button>
        <input type="number" id="discovery-team-min" min="2" max="62" value="2" inputmode="numeric">
        <button type="button" class="ld-step-btn" data-action="inc" data-target="min" aria-label="Increase minimum">+</button>
      </div>
      <span class="sep">–</span>
      <div class="ld-stepper" data-role="max">
        <button type="button" class="ld-step-btn" data-action="dec" data-target="max" aria-label="Decrease maximum">−</button>
        <input type="number" id="discovery-team-max" min="2" max="62" value="62" inputmode="numeric">
        <button type="button" class="ld-step-btn" data-action="inc" data-target="max" aria-label="Increase maximum">+</button>
      </div>
    </span>
  </div>
  <div class="ld-range" id="discovery-team-range-root">
    <div class="track"><div class="track-fill" id="discovery-team-range-fill"></div></div>
    <input type="range" id="discovery-team-min-slider" min="0" max="1000" value="0" class="capacity-slider capacity-slider-min">
    <input type="range" id="discovery-team-max-slider" min="0" max="1000" value="1000" class="capacity-slider capacity-slider-max">
  </div>
  <div class="ld-ticks" id="discovery-team-ticks"></div>
</div>
```

The `id="discovery-team-min-value"` and `discovery-team-max-value` spans are removed (no longer used). The two hidden number inputs (lines 1177-1178) are also removed — the new visible inputs replace them.

- [ ] **Step 2: Replace FFA slider markup**

Find the FFA `<div class="ld-slider-row">` block (around line 1120, look for `discovery-ffa-min-slider`) and replace with the same structure but FFA IDs and bounds:

```html
<div class="ld-slider-row">
  <div class="ld-slider-label">
    <span>Players</span>
    <span class="val">
      <div class="ld-stepper" data-role="min">
        <button type="button" class="ld-step-btn" data-action="dec" data-target="min" aria-label="Decrease minimum">−</button>
        <input type="number" id="discovery-ffa-min" min="1" max="125" value="1" inputmode="numeric">
        <button type="button" class="ld-step-btn" data-action="inc" data-target="min" aria-label="Increase minimum">+</button>
      </div>
      <span class="sep">–</span>
      <div class="ld-stepper" data-role="max">
        <button type="button" class="ld-step-btn" data-action="dec" data-target="max" aria-label="Decrease maximum">−</button>
        <input type="number" id="discovery-ffa-max" min="1" max="125" value="125" inputmode="numeric">
        <button type="button" class="ld-step-btn" data-action="inc" data-target="max" aria-label="Increase maximum">+</button>
      </div>
    </span>
  </div>
  <div class="ld-range" id="discovery-ffa-range-root">
    <div class="track"><div class="track-fill" id="discovery-ffa-range-fill"></div></div>
    <input type="range" id="discovery-ffa-min-slider" min="0" max="1000" value="0" class="capacity-slider capacity-slider-min">
    <input type="range" id="discovery-ffa-max-slider" min="0" max="1000" value="1000" class="capacity-slider capacity-slider-max">
  </div>
</div>
```

(No ticks container for FFA.)

- [ ] **Step 3: Type-check (will fail — slider methods still reference old ids)**

Run: `npm run type-check`
Expected: probably PASS at type-check level (typed strings); the next task wires up actual logic. Tests likely break — that's expected, fix in Task 14.

- [ ] **Step 4: Commit**

```bash
git add src/modules/lobby-discovery/LobbyDiscoveryUI.ts
git commit -m "feat(discovery): update slider markup for ticks and stepper inputs"
```

---

## Task 14: Wire `RangeSlider` into `LobbyDiscoveryUI`

**Files:**
- Modify: `src/modules/lobby-discovery/LobbyDiscoveryUI.ts`

- [ ] **Step 1: Add imports**

Near the top of `LobbyDiscoveryUI.ts`:

```typescript
import { RangeSlider } from '@/modules/lobby-discovery/RangeSlider';
import {
  TEAM_PLAYERS_PER_TEAM_STOPS,
  TEAM_MIN_PLAYERS_PER_TEAM,
  TEAM_MAX_PLAYERS_PER_TEAM,
} from '@/config/constants';
```

- [ ] **Step 2: Add slider instance fields**

Add to the class field declarations (near `private isTeamTwoTimesMinEnabled`):

```typescript
  private ffaSlider: RangeSlider | null = null;
  private teamSlider: RangeSlider | null = null;
```

- [ ] **Step 3: Replace slider initialisation**

Find the two existing `this.initializeSlider(...)` call sites in `LobbyDiscoveryUI.ts` (one for FFA, one for Team — grep for `initializeSlider(` to locate both). Replace both call sites with:

```typescript
    this.ffaSlider = new RangeSlider({
      rootId: 'discovery-ffa-range-root',
      minSliderId: 'discovery-ffa-min-slider',
      maxSliderId: 'discovery-ffa-max-slider',
      minInputId: 'discovery-ffa-min',
      maxInputId: 'discovery-ffa-max',
      fillId: 'discovery-ffa-range-fill',
      bounds: { min: 1, max: 125 },
      onChange: () => this.refreshCriteria(),
    });

    this.teamSlider = new RangeSlider({
      rootId: 'discovery-team-range-root',
      minSliderId: 'discovery-team-min-slider',
      maxSliderId: 'discovery-team-max-slider',
      minInputId: 'discovery-team-min',
      maxInputId: 'discovery-team-max',
      fillId: 'discovery-team-range-fill',
      ticksContainerId: 'discovery-team-ticks',
      bounds: {
        min: TEAM_MIN_PLAYERS_PER_TEAM,
        max: TEAM_MAX_PLAYERS_PER_TEAM,
      },
      stops: TEAM_PLAYERS_PER_TEAM_STOPS,
      lockMaxToTwiceMin: () => this.isTeamTwoTimesMinEnabled,
      onChange: () => this.refreshCriteria(),
    });
```

- [ ] **Step 4: Delete `initializeSlider` and `updateSliderRange` methods**

Remove both methods entirely from `LobbyDiscoveryUI`. Their responsibility now lives in `RangeSlider`.

- [ ] **Step 5: Re-route the team-count-chip min-bump through `RangeSlider`**

Locate the method that imperatively bumps the team min slider when team-count chips change (grep for `Math.min(...checked)` in `LobbyDiscoveryUI.ts`; it ends with a call to `this.updateSliderRange(...)`). Replace its body with:

```typescript
    const newMin = Math.min(...checked);
    this.teamSlider?.setMin(newMin);
```

- [ ] **Step 6: Update the lock-checkbox handler**

Locate the lock checkbox listener (grep for `discovery-team-two-times` and find the `addEventListener('change'` block). Replace it with:

```typescript
    twoTimesCheckbox?.addEventListener('change', () => {
      this.isTeamTwoTimesMinEnabled = twoTimesCheckbox.checked;
      this.syncChipState('discovery-team-two-times');
      this.teamSlider?.applyLockState();
      this.refreshCriteria();
    });
```

- [ ] **Step 7: Update the reset path**

Locate `resetAll`. Find the section that resets both sliders (grep for `discovery-ffa-min-slider` inside `resetAll`'s body — it currently sets `.value = .min` then calls `updateSliderRange`). Replace the entire FFA-and-team reset block with:

```typescript
    this.ffaSlider?.setRange(1, 125);
    this.teamSlider?.setRange(TEAM_MIN_PLAYERS_PER_TEAM, TEAM_MAX_PLAYERS_PER_TEAM);
    this.teamSlider?.applyLockState();
```

- [ ] **Step 8: Update settings-load path**

Locate the method that hydrates UI from saved settings (grep for `discovery-team-min-value` — those writes appear in the load path). For each saved criterion that supplies `minPlayers`/`maxPlayers`, route the values through `setRange` instead of writing directly into the DOM:

```typescript
    // FFA criterion load
    if (ffaMin != null && ffaMax != null) {
      this.ffaSlider?.setRange(ffaMin, ffaMax);
    }
    // Team criterion load
    if (teamMin != null && teamMax != null) {
      this.teamSlider?.setRange(teamMin, teamMax);
    }
    this.teamSlider?.applyLockState();
```

After this step, no remaining code should reference the deleted `discovery-team-min-value` / `discovery-team-max-value` / `discovery-ffa-min-value` / `discovery-ffa-max-value` span IDs. Verify with: `rg "min-value|max-value" src/`. Expected output: empty.

- [ ] **Step 9: Type-check**

Run: `npm run type-check`
Expected: no errors. If references to deleted `initializeSlider` / `updateSliderRange` remain, remove them.

- [ ] **Step 10: Run the full test suite**

Run: `npm test -- --run`
Expected: all tests pass (existing `LobbyDiscoveryUI.test.ts` may need ID-name updates if it asserts on `discovery-team-min-value` spans — fix as needed by reading those tests and migrating to the new ids).

- [ ] **Step 11: Commit**

```bash
git add src/modules/lobby-discovery/LobbyDiscoveryUI.ts
git commit -m "feat(discovery): wire RangeSlider into discovery panel"
```

---

## Task 15: Production build + version bump

**Files:**
- Modify: `package.json` (version)

- [ ] **Step 1: Bump patch version**

Run: `npm version patch --no-git-tag-version`
Expected: version bumps (e.g. `2.10.4` → `2.10.5`); `package.json` and `package-lock.json` update.

- [ ] **Step 2: Production build**

Run: `npm run build:prod`
Expected: builds successfully; `dist/bundle.user.js` updated.

- [ ] **Step 3: Verify version consistency**

Run: `grep '"version"' package.json && grep '@version' dist/bundle.user.js`
Expected: both show the same bumped version.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json dist/bundle.user.js
git commit -m "chore(release): build per-team log slider"
```

---

## Task 16: Manual QA pass

This task is not automated. Execute the following manually in a browser with the userscript installed against a fresh OpenFront page (or with stored discovery settings).

- [ ] **Drag** the per-team min thumb across the full range. Confirm: the thumb snaps to each stop tick; the number input updates; the fill bar tracks correctly; tick labels (`2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62`) sit under the corresponding ticks.
- [ ] **Type** `7` into the min input + Tab. Confirm: thumb sits *between* the `6` and `8` ticks (not snapped to either); the input retains `7`.
- [ ] **Type** `200` into the max input + Tab. Confirm: clamped to `62`.
- [ ] **Type** an empty string + Tab. Confirm: reverts to last value.
- [ ] **Click** stepper `+` on min repeatedly. Confirm: increments `2 → 3 → 4 …`; clamps at the value above which `min > max` would trigger a max bump.
- [ ] **Click** stepper `−` on max repeatedly. Confirm: decrements 1-by-1; clamps so `max ≥ min`.
- [ ] **Toggle** "Lock max-per-team to 2× the min" on. Confirm: only the max thumb + max number input + max stepper buttons appear dimmed; track and fill remain full color; min is still draggable and editable.
- [ ] With lock active, drag min from `2` upward. Confirm: max auto-tracks at `2 × min`, clamped to `62`.
- [ ] **Toggle** lock off. Confirm: max thumb, max input, max stepper buttons all return to normal styling.
- [ ] **Reload** the page. Confirm: previously-set values persist.
- [ ] **Old-install simulation:** in DevTools, set `localStorage.OF_LOBBY_DISCOVERY_SETTINGS` (or whatever GM storage uses) to a payload containing a Team criterion with `minPlayers: 1`. Reload. Confirm: silently shows `2`.
- [ ] **FFA slider:** drag, type, and step on the FFA slider. Confirm: dragging is linear (no snap), but typing and steppers work the same. No tick marks render.
- [ ] **Run** the test suite once more from the project root: `npm test -- --run`. Confirm: all tests pass.

---

## Notes for the executing engineer

- Never bypass git hooks. If `pre-commit` fails, fix the underlying issue and create a new commit.
- The path alias `@/` maps to `src/`. Use it consistently in imports.
- Pure functions live in `*Helpers.ts`; no DOM access.
- The two contract tests in `tests/modules/lobby-discovery/RuntimeContract.test.ts` enforce the no-automation invariant. They should not need changes — confirm by running them.
- If you find existing code in `LobbyDiscoveryUI` that wrote `id="discovery-team-min-value"` (the deleted spans), every such reference must be removed during Task 14. Use `rg "min-value\\|max-value" src/` to confirm zero references remain afterward.
