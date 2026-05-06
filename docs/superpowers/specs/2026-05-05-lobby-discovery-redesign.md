# Lobby Discovery — Visual Redesign + Tri-State Modifiers

**Date:** 2026-05-05
**Status:** Approved (pending implementation plan)
**Source design:** Claude Design bundle, `Lobby Discovery.html` (handoff 2026-05-05)
**Accent:** Blue (`#7aa7d4`)

## Goal

Replace the current `LobbyDiscoveryUI` panel with a refined dark visual design (compact status pill, segmented modes, format chips, tri-state modifier chips, footer with reset) and expand the modifier filter from binary `Allowed/Blocked` to tri-state `Any/Required/Blocked`. Preserve all existing matching behavior, the `notify-only` posture, the queue-card pulse, and the native join-modal player highlight. Remove the panel resize handle in favor of a fixed 380px width.

## Out of scope

- The Tweaks panel from the design bundle (designer-only accent/font/layout switcher).
- The placeholder homepage backdrop in the mockup — userscript already attaches to the real openfront.io homepage.
- `LobbyDataManager`, `URLObserver`, `BrowserNotificationUtils`, `SoundUtils` — no changes.
- Native join-lobby modal logic in `CurrentPlayerHighlighter` (palette references update only).

## File impact

| File | Change kind |
|---|---|
| `src/config/theme.ts` | Replace palette with warm-neutral darks + blue accent. Add `accentLine`, `dangerSoft`, `bgElevated`, `bgRaised`. Keep legacy keys as aliases. |
| `src/styles/styles.ts` | Rewrite `.discovery-*` classes to the design system. Keep `.of-current-player-boost`, `.of-current-player-team-boost`, `.of-discovery-card-active` (queue-card pulse stays orange). |
| `src/modules/lobby-discovery/LobbyDiscoveryTypes.ts` | `ModifierFilterState` becomes `'any' \| 'required' \| 'blocked'`. |
| `src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts` | `normalizeSettings` migrates `'allowed'` → `'any'`. New `formatLastMatchAgo(timestampMs)` helper. |
| `src/modules/lobby-discovery/LobbyDiscoveryEngine.ts` | Modifier matching: `'any'` no constraint; `'required'` lobby must have it; `'blocked'` lobby must not have it. |
| `src/modules/lobby-discovery/LobbyDiscoveryUI.ts` | Full rewrite of `createUI`, `setupEventListeners`, `loadUIFromSettings`, modifier read/write. Remove `ResizeHandler` wiring. New `lastMatchTime` state, `resetAll` method. |
| `tests/modules/lobby-discovery/*.test.ts` | Update `'allowed'` → `'any'` fixtures. Add `'required'` matching tests. Add migration test. Two contract tests (no auto-join, no programmatic click) preserved verbatim. |

Files unchanged: `LobbyDataManager.ts`, `CurrentPlayerHighlighter.ts`, `URLObserver.ts`, `BrowserNotificationUtils.ts`, `SoundUtils.ts`, `ResizeHandler.ts` (kept in `src/utils/` but no longer wired into the panel), `main.ts`.

## Visual layout

Single fixed-width column, `380px`, top-right with `24px` margins. Five vertical regions:

1. **Status pill** (sticky top): live blue pulse dot, `Discovery active · last match 0m 12s` text, two icon buttons (sound, bell). Click the text region toggles discovery on/off (preserves current click target). `is-on` icons get `accentSoft` background + `accent` color.
2. **Header** (sticky): mono eyebrow `NOTIFY ONLY · NEVER AUTO-JOINS` + display title `Lobby Discovery`.
3. **Modes section** (scroll body):
   - Segmented FFA/Teams selector (two buttons, both can be on).
   - **FFA panel** — single dual-thumb range slider, label "Total players", range 1–125 (unchanged). Dimmed (`opacity: 0.4`, `pointer-events: none`) when FFA is off.
   - **Teams panel** — `FORMAT` row 1 (Duos/Trios/Quads/HvN preset chips), `FORMAT` row 2 (2/3/4/5/6/7 team-count chips), per-team slider labeled "Players per team" range 1–62 (unchanged engine semantics — engine already interprets as per-team via `gameCapacity / playerTeams`), and a `2× lobby capacity` labeled checkbox card with hint "total seats ≥ 2 × per-team min".
4. **Modifiers section**: tri-state chip grid (2 cols), grouped under three mono headers — `MAP` (Compact, Random Spawn, Crowded, Hard Nations), `GAMEPLAY` (Alliances Off, Ports Off, Nukes Off, SAMs Off, Peace Time, Water Nukes), `ECONOMY` (Start Gold 1M/5M/25M, Gold ×2). Cycle order: `any → required → blocked → any`. Indicator: empty / check / cross. Blocked chips strike-through the label.
5. **Footer** (sticky bottom): `N active filters` (mono numeric) + `Reset all` button. Filter count = enabled modes + non-`any` modifiers + selected formats.

**Current game info** (existing "Current game: …" element) stays, restyled, inside the Team panel under the slider.

## Tri-state modifier semantics

```ts
export type ModifierFilterState = 'any' | 'required' | 'blocked';
```

Boolean modifiers (e.g. `isCompact`):
- `'any'` → no constraint.
- `'required'` → pass iff `lobby.gameConfig.publicGameModifiers?.isCompact === true`.
- `'blocked'` → pass iff `lobby.gameConfig.publicGameModifiers?.isCompact !== true`.

Numeric value modifiers (`startingGold`, `goldMultiplier`):
- `'any'` → no constraint for this value.
- `'required'` → pass iff lobby's value equals this key.
- `'blocked'` → pass iff lobby's value does not equal this key.

Mutually-exclusive contradictions (e.g. `startingGold[1M] = required` AND `startingGold[5M] = required`) silently produce zero matches; no UI guard.

Default state on fresh install: every modifier `'any'`.

## Settings migration

`normalizeSettings(saved)`:
- For each modifier value: `'allowed'` → `'any'`. `'blocked'` preserved. `'required'` preserved (defensive). Anything else → `'any'`.
- Idempotent. Runs on every `loadSettings()`. Result is written back via `GM_setValue` so the new shape is durable.
- `'allowed'` and `'any'` are functionally identical in the engine — migration is a no-op for matching behavior.

`STORAGE_KEYS.lobbyDiscoveryPanelSize` is no longer read or written. Existing persisted values are left in place (harmless, supports rollback).

## State changes in `LobbyDiscoveryUI`

Added:
- `private lastMatchTime: number | null = null` — set every time a new matching lobby arrives. Drives the status pill text.

Removed:
- `private resizeHandler: ResizeHandler | null` and its construction in `createUI`.
- `private gameFoundTime: number | null` — superseded by `lastMatchTime` (different semantics: `lastMatchTime` updates on every new match; `gameFoundTime` only set on first match per session).
- Hidden `<input type="number">` mirrors for slider min/max — slider values read directly.

Status text logic (`formatLastMatchAgo`):
- `lastMatchTime !== null` → `last match Xm Ys` (computed from `Date.now() - lastMatchTime`).
- `lastMatchTime === null && searchStartTime !== null` → `searching · Xm Ys`.
- Otherwise → `awaiting filters`.

## DOM contract

Modifier chip:
```html
<button class="ld-mod" id="modifier-isCompact" data-state="any" data-mod-key="isCompact"
        type="button" aria-label="Compact" aria-pressed="false">
  <span class="ld-mod-ind"><svg>…</svg></span>
  <span class="ld-mod-name">Compact</span>
</button>
```

State stored as `data-state="any|required|blocked"`. CSS handles all three visual states. JS reads/writes through `getModifierState(id)` / `setModifierState(id, state)` / `cycleModifierState(id)`.

Format chip:
```html
<button class="ld-chip" data-format="Duos" type="button" aria-pressed="false">Duos</button>
```

`is-on` class toggled on click.

Mode segment:
```html
<div class="ld-modes">
  <button class="ld-mode-btn" data-mode="ffa" type="button" aria-pressed="false">
    <span class="check">…</span><span>FFA</span>
  </button>
  <button class="ld-mode-btn" data-mode="team" type="button" aria-pressed="false">
    <span class="check">…</span><span>Teams</span>
  </button>
</div>
```

Slider wrapper exposes `--lo` and `--hi` CSS variables for the fill width:
```html
<div class="ld-range" style="--lo:0%; --hi:100%;">
  <div class="track"><div class="track-fill"></div></div>
  <input type="range" class="capacity-slider capacity-slider-min" …>
  <input type="range" class="capacity-slider capacity-slider-max" …>
</div>
```

## Theme tokens

```ts
COLORS = {
  bgPrimary:    '#0d0f10',
  bgSecondary:  '#14171a',
  bgElevated:   '#1a1e22',
  bgRaised:     '#20252a',
  bgHover:      'rgba(255,255,255,0.04)',
  textPrimary:   '#f2f1ee',
  textSecondary: '#c8c6c0',
  textMuted:     '#8e8c85',
  textFaint:     '#5a5853',
  border:        'rgba(255,255,255,0.06)',
  borderSubtle:  'rgba(255,255,255,0.10)',
  borderStrong:  'rgba(255,255,255,0.16)',
  accent:        '#7aa7d4',
  accentSoft:    'rgba(122,167,212,0.14)',
  accentLine:    'rgba(122,167,212,0.32)',
  accentShadow:  '122,167,212',
  warning:       '#d4a056',
  warningSoft:   'rgba(212,160,86,0.14)',
  danger:        '#d27a6b',
  dangerSoft:    'rgba(210,122,107,0.14)',
  dangerLine:    'rgba(210,122,107,0.30)',
  // legacy aliases
  accentMuted:   'rgba(122,167,212,0.14)',
  accentHover:   '#9bbfe0',
  accentAlt:     '#9bbfe0',
  borderAccent:  'rgba(122,167,212,0.32)',
  highlight:     'rgba(122,167,212,0.20)',
  success:       '#74c69d',
  successSolid:  '#74c69d',
  error:         '#d27a6b',
}

FONTS = {
  body:    "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  display: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
}

RADIUS = { sm: '6px', md: '7px', lg: '10px', xl: '14px' }

SHADOWS = {
  sm: '0 1px 3px rgba(0,0,0,0.4)',
  md: '0 2px 8px rgba(0,0,0,0.3)',
  lg: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
}

SPACING and TIMING unchanged.
```

`.of-current-player-boost` and `.of-current-player-team-boost` rewrite their hardcoded cyan box-shadow to `var(--of-hud-accent)` so the native-modal player highlight matches the new blue accent.

`.of-discovery-card-active` queue-card pulse keeps its current orange/saturated colors — the alarm-color contrast against a blue panel is intentional.

## Test plan

- **`LobbyDiscoveryEngine.test.ts`**: rewrite `'allowed'` fixtures to `'any'`. Add tests:
  - `'required'` matches when boolean modifier is `true`, rejects when absent or `false`.
  - `'required'` matches numeric modifier when value matches, rejects when value differs.
  - `'blocked'` rejects when value matches.
- **`LobbyDiscoveryHelpers.test.ts`**: add `normalizeSettings` migration tests for `'allowed'` → `'any'` (boolean and numeric), `'blocked'` preserved, undefined → `'any'`. Idempotency test (second call is a no-op).
- **`LobbyDiscoveryUI.test.ts`**: update DOM-querying tests for new chip class names (`.ld-mod`) and IDs. The two contract tests — *no auto-join* and *no programmatic click on join controls* — preserved byte-for-byte.

No new test infrastructure. Vitest + jsdom suffices.

## Manual QA checklist

1. Fresh install → panel renders, no modes selected, all modifiers `any`, no errors in console.
2. Returning user with `'allowed'`/`'blocked'` settings → loads as `any`/`blocked`, matching behavior preserved.
3. FFA/Teams toggle → mode panel un-dims/dims correctly; sliders responsive.
4. Click Duos chip → per-team min slider bumps to 2 (preserves `applyAutoTeamMin`).
5. Modifier chip cycles `any → required → blocked → any` over three clicks; footer count updates; reload preserves state.
6. New matching lobby → queue-card pulses orange, status pill shows `last match 0m 0s` and ticks; sound plays if enabled; desktop notification fires if enabled and permission granted.
7. `Reset all` → all chips back to `any`, modes off, sliders to bounds, footer count `0`.
8. Game start (`?live` URL) → panel hides, restores on lobby return.
9. Open native join-lobby modal → current player and team card glow blue.

## Build & rollout

```
npm run type-check
npm test
npm run build:prod
```

Bump version: `npm version minor` → `2.10.0` (visible UX redesign + behavior addition). `build:prod` propagates the new version into the `@version` header of `dist/bundle.user.js`.

## Risks

- **Resize regression**: users who widened the panel lose that width. Acceptable given the design is tuned for 380px and the choice was explicit.
- **Migration miss**: any unexpected modifier-state value not in `{any, required, blocked, allowed, blocked}` falls through to `any`. Defensive default; no panic.
- **Font fallback variance**: users without Inter installed see a system sans-serif. Acceptable — the warm-neutral palette and spacing carry most of the design feel.
- **DOM/JS state divergence on chips**: `data-state` is the single source of truth; only `cycle/setModifierState` write it. Risk low.

## References

- Design source: `Lobby Discovery.html` from Claude Design handoff bundle.
- Chat transcript intent: refined dark UI, less vertical scroll, tri-state chip modifiers, single tall panel, compact status pill.
- Related project doc: `CLAUDE.md` (project conventions, version policy).
