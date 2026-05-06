# Players-per-team log-scaled slider — design

**Status:** approved, ready for implementation plan
**Date:** 2026-05-05
**Scope:** Lobby Discovery panel, "Players per team" slider

## Motivation

The current "Players per team" slider is linear over `1–62`. In practice the vast majority of public OpenFront team lobbies fall in the `2–20` range, so most of the slider's pixel real estate is wasted on values nobody picks while the high-traffic range is squeezed into a thin segment near the left edge. A quasi-logarithmic scale dedicates more space to the common range.

Two adjacent UX problems are addressed in the same change:

- The minimum is `1`, but `1 player per team` is a solo lobby (FFA) — it should not be selectable as a team size.
- The min/max value displays are read-only `<span>`s; users cannot type a precise value or use stepper buttons. Reference: <https://github.com/users/DeLoVaN/preview-screenshots> (image attached in conversation).
- The "Lock max-per-team to 2× the min" toggle currently dims and disables the *entire* range, including the min thumb. Users still want to adjust min while max is auto-tracked.

## Goals

1. Replace the linear `1–62` per-team slider with an evenly-positioned stop-based scale starting at `2`.
2. Allow precise numeric entry for both min and max via editable number inputs flanked by `−` / `+` stepper buttons.
3. When "Lock max" is on, dim only the max controls; min remains fully interactive.
4. Migrate existing saved settings without surprise.

## Non-goals

- No changes to the matching engine (`LobbyDiscoveryEngine.ts`) — it already accepts any integer `min/max`.
- No changes to data pipeline (`LobbyDataManager.ts`).
- No changes to `CurrentPlayerHighlighter` or the join-modal integration.
- No backend / OpenFront API contact. Notify-only behavior preserved (existing contract tests continue to enforce this).
- The FFA capacity slider keeps its linear behavior (no log stops). It does pick up the editable number-input + stepper UX as a side benefit.

## Resolved decisions

| # | Decision | Rationale |
|---|---|---|
| Q1 | **Hybrid snapping.** Slider thumb snaps to predefined stops on drag; number input accepts any integer in `[2, 62]`. | Matches the screenshot's clean tick-stop visuals while preserving precision via direct entry. |
| Q2 | **Stops:** `[2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62]`. | Denser low end matches the actual lobby-size distribution; 11 stops is dense enough to land on common values without crowding labels. |
| Q3 | **Per-team only gets the log scale.** Editable number-input + steppers extracted as a generic component used by both per-team and FFA sliders. | Log mapping is motivated by per-team distribution specifically; the editable input is a generic UX improvement. |
| Q4 | **Stepper buttons step by 1.** | Predictable; the slider's snap stops already cover coarse navigation. |
| Q5 | **Lock visual: only max thumb + max number input + max stepper dimmed.** Track and fill stay full color. Min remains active. | Matches the user's description ("only the max is disabled"); the existing `2 × min` constraint already makes the relationship obvious. |
| Q6 | **Migration:** clamp saved `minPerTeam < 2` → `2` on load. Other saved values preserved as-is (hybrid snapping treats every integer 2–62 as valid). New-user defaults: `min = 2, max = 62`. | Silent migration. `1` is not a meaningful per-team value under the new design. |

## Architecture

### Files

**New:**

- `src/modules/lobby-discovery/RangeSlider.ts` — dual-thumb range slider component. Owns input wiring, position↔value mapping, snap logic, tick rendering, lock-state visuals, number-input + stepper handlers. Exposes `onChange(min, max)` callback.
- `src/modules/lobby-discovery/RangeSliderHelpers.ts` — pure functions: `valueToPosition`, `positionToValue`, `nearestStop`, `clampToStops`. Side-effect-free.

**Modified:**

- `src/modules/lobby-discovery/LobbyDiscoveryUI.ts` — removes inline `initializeSlider` / `updateSliderRange` methods; instantiates two `RangeSlider`s instead. Markup updated for editable number inputs + steppers + ticks.
- `src/styles/styles.ts` — adds tick mark, stepper, lock-only-max styles. Removes the global `.ld-range.is-locked { opacity: 0.55 }` rule.
- `src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts` — `normalizeSettings` clamps `minPerTeam < 2` to `2` and updates the per-team default.
- `src/config/constants.ts` — adds `TEAM_PLAYERS_PER_TEAM_STOPS`, `TEAM_MIN_PLAYERS_PER_TEAM`, `TEAM_MAX_PLAYERS_PER_TEAM`.

**New tests:**

- `tests/modules/lobby-discovery/RangeSliderHelpers.test.ts`
- `tests/modules/lobby-discovery/RangeSlider.test.ts` (JSDOM)

**Extended tests:**

- `tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts` — migration cases.

### Component boundaries

- `RangeSliderHelpers` knows nothing about the DOM.
- `RangeSlider` knows nothing about discovery criteria — it only emits `(min, max)` changes via `onChange`.
- `LobbyDiscoveryUI` keeps its current criteria-orchestration role; subscribes to each `RangeSlider`.

### `RangeSlider` configuration shape

```typescript
interface RangeSliderConfig {
  rootId: string;             // container element id
  minSliderId: string;        // <input type="range"> for min position
  maxSliderId: string;        // <input type="range"> for max position
  minInputId: string;         // <input type="number"> for min value
  maxInputId: string;         // <input type="number"> for max value
  fillId: string;             // <div> for the colored fill bar
  ticksContainerId?: string;  // <div> for tick marks (optional, only with stops)
  bounds: { min: number; max: number };
  stops?: readonly number[];  // when present, snap-on-drag uses these
  lockMaxToTwiceMin?: () => boolean;  // returns current lock-checkbox state
  onChange: (min: number, max: number) => void;
}
```

## Position ↔ value mapping

Native `<input type="range">` is configured `min=0 max=1000 step=1` and stores **position**. The number input stores **value**. Helpers keep them in sync.

### `valueToPosition(value, stops): number → 0..1`

For stops `[s₀, s₁, …, sₙ]` (n+1 stops), each stop sits at `i / n`.

1. Clamp `value` to `[s₀, sₙ]`.
2. Find segment `i` such that `sᵢ ≤ value ≤ sᵢ₊₁`.
3. `position = (i + (value - sᵢ) / (sᵢ₊₁ - sᵢ)) / n`.

Example with `[2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62]` (11 stops, n=10 segments). Stop `6` is at index 4:
- `value=6` → position `4 / 10 = 0.4`
- `value=7` → position `0.45` (halfway through the `6→8` segment, which spans `0.4–0.5`)
- `value=62` → position `1.0`

### `positionToValue(position, stops): number → integer`

1. Clamp `position` to `[0, 1]`.
2. `t = position * n; i = floor(t); frac = t - i`.
3. If `position === 1`, return `sₙ` directly (overflow guard).
4. Raw value = `sᵢ + frac * (sᵢ₊₁ - sᵢ)`.
5. Round to nearest integer.

### `nearestStop(value, stops): number`

Linear scan through stops; return the closest. Tie-break: prefer the lower stop (deterministic, locked in test).

### Linear fallback (FFA, no stops)

When `stops` is absent: `valueToPosition(v) = (v - min) / (max - min)`, `positionToValue(p) = round(min + p * (max - min))`. Same code path; no special-case branches in the UI layer.

### Resolution

1000 positions across a ~300px-wide slider = ~3 positions/px. The smallest segment in the per-team stops is `[2,3]` and `[3,4]` etc., each getting 100 positions of headroom — stable snapping.

## Behavior flows

### Drag (with stops)

```
range input fires `input`
  → position = rangeInput.value / 1000
  → rawValue = positionToValue(position, stops)
  → snappedValue = nearestStop(rawValue, stops)
  → numberInput.value = snappedValue
  → rangeInput.value = valueToPosition(snappedValue) * 1000   // visual snap
  → onChange(min, max)
```

### Drag (no stops, FFA)

Same flow, omitting the `nearestStop` step. Drag produces every integer in range.

### Typed value (number input `change` / `blur`)

```
value = clamp(parseInt(numberInput.value), bounds.min, bounds.max)
  if NaN → revert to last known value
numberInput.value = value
rangeInput.value = valueToPosition(value) * 1000   // exact, no snap
onChange(min, max)
```

### Stepper buttons

`−` decrements the corresponding number input's value by 1; `+` increments by 1. Clamps at bounds. Each click goes through the same typed-value flow above (so the slider thumb tracks).

### Min/max cross-clamp

If `min > max` after a change, the *other* value is bumped to match. Same direction as today (line 828–831 of `LobbyDiscoveryUI.ts`). Applies to both drag and typed entry.

### Lock-max-to-2×-min

When the lock checkbox is checked:

- Max range input → `disabled` attribute set; `.capacity-slider-max` gets `.is-max-locked` (CSS dims thumb to `opacity: 0.45`, `cursor: not-allowed`).
- Max number input → `disabled` attribute set; CSS dims it.
- Max stepper buttons → `disabled` attribute set; CSS dims them.
- Track + fill bar + min controls → unchanged, full color, fully active.
- On any min change: `max = clamp(stops[0], bounds.max, min × 2)`. Auto-update flows through the same onChange.

The current `.ld-range.is-locked { opacity: 0.55 }` rule (line 381–384 of `styles.ts`) is **removed**. The class is renamed to `.is-max-locked` and only targets max-side selectors.

## Markup

### Slider header (per-team)

Replaces the current `<span class="val">…</span>`:

```html
<div class="ld-stepper" data-role="min">
  <button type="button" class="ld-step-btn" data-action="dec" aria-label="Decrease minimum">−</button>
  <input type="number" id="discovery-team-min" min="2" max="62" value="2" inputmode="numeric">
  <button type="button" class="ld-step-btn" data-action="inc" aria-label="Increase minimum">+</button>
</div>
<span class="sep">–</span>
<div class="ld-stepper" data-role="max">
  <button type="button" class="ld-step-btn" data-action="dec" aria-label="Decrease maximum">−</button>
  <input type="number" id="discovery-team-max" min="2" max="62" value="62" inputmode="numeric">
  <button type="button" class="ld-step-btn" data-action="inc" aria-label="Increase maximum">+</button>
</div>
```

The current hidden `<input type="number">` mirrors at lines 1177–1178 are removed; the new visible inputs replace them as the source of truth.

### Tick marks

A new container directly below the `.ld-range` div:

```html
<div class="ld-ticks" id="discovery-team-ticks"></div>
```

`RangeSlider` populates it on init: one `<div class="ld-tick">` per stop, absolutely positioned at `left: ${valueToPosition(stop) * 100}%`. Labels render as `<span class="ld-tick-label">` underneath each tick.

The FFA slider's container is rendered without a ticks div; `RangeSlider` skips tick rendering when `stops` is absent.

### FFA slider

Same stepper structure for min/max number inputs; no ticks. Otherwise unchanged.

## Migration

In `normalizeSettings` (LobbyDiscoveryHelpers.ts), per-criterion sanitization gains:

```typescript
if (typeof minPerTeam === 'number' && minPerTeam < 2) minPerTeam = 2;
if (typeof maxPerTeam === 'number' && maxPerTeam < minPerTeam) maxPerTeam = minPerTeam;
```

`createDefaultCriterion` (or equivalent) updates per-team default to `{ min: 2, max: 62 }`. FFA defaults unchanged.

No user-facing migration message. Silent on first load.

## Constants

```typescript
// src/config/constants.ts
export const TEAM_PLAYERS_PER_TEAM_STOPS = [
  2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62,
] as const;
export const TEAM_MIN_PLAYERS_PER_TEAM = 2;
export const TEAM_MAX_PLAYERS_PER_TEAM = 62;
```

Removes inline `1` / `62` literals throughout the per-team slider code path.

## Testing

### `RangeSliderHelpers.test.ts` (new)

- Each stop maps to its expected `i / n` position.
- Mid-segment values interpolate correctly (e.g. `7` ≈ `0.45`).
- `position = 1` returns `sₙ` exactly (overflow guard).
- Round-trip `valueToPosition` ∘ `positionToValue` returns input for every stop.
- Out-of-range values clamp.
- `nearestStop` tie-break is deterministic.
- Linear fallback (no stops) reduces to `(v - min) / (max - min)`.

### `RangeSlider.test.ts` (new, JSDOM)

- Drag range input → number input updates with snapped value; `onChange` fires.
- Type `7` + blur → range thumb position equals `valueToPosition(7) * 1000`; no snap.
- Type `200` + blur → clamps to `62`.
- Type empty + blur → reverts to last value.
- Stepper `+` increments by 1; clamps at bounds.
- Lock toggle on → `.is-max-locked` on max range input, max number input + stepper buttons all `disabled`. Min controls remain enabled.
- Lock active + change min → max recomputes as `clamp(stops[0], bounds.max, min × 2)`.

### `LobbyDiscoveryHelpers.test.ts` (extend)

- Saved `minPerTeam = 1` → clamps to `2`.
- Saved `minPerTeam = 7` (non-stop, valid integer) → preserved.
- New-user default per-team criterion is `{ min: 2, max: 62 }`.

### Existing contract tests

Re-run unchanged. Confirms discovery UI never touches the join API.

## Manual QA checklist

- Per-team slider: drag both thumbs across the full range; thumbs snap to ticks; fill tracks correctly.
- Type non-stop values (e.g. `7`, `12`, `25`) → thumbs sit between ticks at correct log-mapped positions.
- Lock toggle: only max thumb + max input + max stepper look dimmed; min remains fully responsive.
- FFA slider: dragging behavior unchanged; new editable min/max number inputs with `−` / `+` work.
- Settings round-trip: change values → reload → values restore.
- Old install upgrade simulation: pre-seed `OF_LOBBY_DISCOVERY_SETTINGS` with `minPerTeam = 1` → reload → silently becomes `2`.

## Rollout

Single bundle build via `npm run build:prod`. Userscript users update by reinstalling. No version migration UX needed — silent settings clamp on first load. Bump patch version in `package.json` per the project's version-management rules.
