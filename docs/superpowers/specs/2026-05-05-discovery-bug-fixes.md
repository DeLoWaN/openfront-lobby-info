# Lobby Discovery — Post-Redesign Bug Fix Bundle

**Date:** 2026-05-05
**Status:** Approved (pending implementation)
**Target version:** 2.10.1

## Goal

Fix five user-reported issues from the 2.10.0 redesign and harden modifier-filter matching against a previously-uncovered lobby data shape.

## Issues addressed

1. FFA/Teams chips render with doubled, unstyled browser checkboxes alongside the styled labels.
2. Format and team-size chips show the same doubled checkboxes.
3. The "2× lobby capacity" hint is unclear; the toggle should override and disable the manual maximum.
4. The Modifiers panel reads as visually disabled because chips share the same muted gray as dimmed mode panels.
5. The "Blocked" filter appears not to fire for at least one production lobby (1M starting gold, screenshot-confirmed). JSDOM cannot reproduce when `gameConfig.publicGameModifiers.startingGold` carries the value, but a real gap exists for host-set fields directly on `gameConfig`.

## Out of scope

- Engine semantics for `'required'` and `'blocked'` (correct as of 2.10.0; verified by tests).
- Persisted-settings shape changes (no migration needed; rename is cosmetic only).
- Network/data layer.

## Specification

### 1. Doubled checkbox cleanup

Add to `src/styles/styles.ts`:

```css
.ld-mode-btn input { display: none; }
.ld-chip input { display: none; }
```

The chips already contain a hidden `<input type="checkbox">` whose `change` event drives behavior; the input's visible rendering was never intended.

### 2. 2× toggle becomes a max-slider lock

**Behavior change.** When `discovery-team-two-times` is checked:

- The max-per-team slider value is set to `min × 2`, clamped to slider max.
- The `<input class="capacity-slider-max">` element receives the `disabled` attribute.
- The `.ld-range` wrapper receives an `is-locked` class adding `opacity: 0.45` and `cursor: not-allowed`.
- The criterion saved to `criteriaList` carries `maxPlayers = minPlayers * 2`.

When unchecked:

- The max slider is re-enabled (`disabled` removed, `is-locked` class removed).
- The slider value is restored from a stored "last manual max" kept on the UI instance (`lastTeamManualMax: number | null`). If null (user has never set it manually), use the slider's `max` attribute.

**Engine simplification.** `LobbyDiscoveryEngine.matchesCriteria` no longer reads `options.isTeamTwoTimesMinEnabled`. The constraint is now encoded directly in the criterion's `maxPlayers`. The `MatchOptions.isTeamTwoTimesMinEnabled` field is removed; callers stop passing it.

**Persisted settings.** `isTeamTwoTimesMinEnabled` stays in the settings shape (it controls the UI lock state). `LobbyDiscoveryHelpers.normalizeSettings` continues to read/write it as today.

**Label.** Replace the existing `<strong>2× lobby capacity</strong>` + hint with a single line:

```
Lock max-per-team to 2× the min
```

### 3. Modifier panel visual contrast

In `src/styles/styles.ts`:

- `.ld-mod { color: var(--of-hud-text-2); }` (was `--of-hud-text-3`).
- `.ld-mod-name { font-weight: 500; }` (new).

The dimmed-mode-panel state stays at `opacity: 0.4`; the brighter baseline ensures modifier chips don't get visually mistaken for a disabled section.

### 4. Rename "Blocked" → "Excluded" (user-facing only)

Internal value stays `'blocked'` so persisted settings need no migration.

Surfaces to update:

- Cycle hint (in `createUI`): `"Click to cycle Any → Required → Excluded."`
- Legend swatch label `Block` → `Excl`.
- Modifier chip `aria-label` for excluded state: `"<modifier name> · excluded"`.
- The user-visible hint span class `.blk` is reused as-is (color coding unchanged).
- Spec doc references and any inline JSDoc comments updated for clarity.

The cycle order itself stays `any → required → blocked → any`. Tests using literal `'blocked'` continue to pass (they assert internal state, not UI labels).

### 5. Modifier read fallback for host-set gold fields

`LobbyDiscoveryHelpers.getLobbyModifierValue`:

```ts
case 'startingGold':
  return modifiers.startingGold ?? lobby.gameConfig?.startingGold ?? undefined;
case 'goldMultiplier':
  return modifiers.goldMultiplier ?? lobby.gameConfig?.goldMultiplier ?? undefined;
```

This is also reflected in:

- `getActiveModifierLabels` — pick the first non-null source for badge text.
- A new helper test covering the host-set fallback.
- A new engine test: a lobby with `gameConfig.startingGold = 1_000_000` and no `publicGameModifiers` is excluded when `startingGold[1_000_000] === 'blocked'`.

The `lobby.gameConfig` schema includes `startingGold?: number | null` and `goldMultiplier?: number | null` — the `null` case must be tolerated (treated identically to undefined).

### 6. Debug toggle

In `LobbyDiscoveryUI.processLobbies`, add a guarded log:

```ts
if ((globalThis as any).__OF_DEBUG_DISCOVERY === true) {
  console.debug('[OF Discovery]', {
    lobbyId: lobby.gameID,
    mode: getLobbyGameMode(lobby),
    teamConfig: getLobbyTeamConfig(lobby),
    modifiers: lobby.gameConfig?.publicGameModifiers,
    hostGold: { startingGold: lobby.gameConfig?.startingGold, goldMultiplier: lobby.gameConfig?.goldMultiplier },
    criteriaCount: this.criteriaList.length,
    matched,
  });
}
```

Off by default. Activated by typing `window.__OF_DEBUG_DISCOVERY = true` in DevTools. No user-visible effect; lets you (and any future bug reporters) capture the raw flow in production.

## Test plan

**`tests/modules/lobby-discovery/LobbyDiscoveryEngine.test.ts`:**

- Update `applies the 2x min helper to team capacity` — the test now passes a criterion with `maxPlayers: minPlayers * 2` and no `MatchOptions` flag; same expectation (rejected when lobby capacity falls below 2× min).
- New: `excludes a Team lobby with gameConfig.startingGold (host-set) when 1M is excluded`.
- New: `excludes a Team lobby with publicGameModifiers.startingGold when 1M is excluded` (regression for the screenshot scenario, with the standard data shape).

**`tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`:**

- New: `getLobbyModifierValue falls back to gameConfig.startingGold when publicGameModifiers absent`.
- New: tolerance for `null` host-set gold values.

**`tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts`:**

- Update the slider test for the 2× toggle — assert `maxSlider.value === minSlider.value * 2`, `maxSlider.disabled === true`, and the `.is-locked` class is present on the range wrapper.
- New: `restores last manual max when 2× toggle is turned off`.
- New: a chip cycle test checking the post-rename DOM/aria text (`aria-label`, legend, hint).

**Manual smoke test on openfront.io:** verify (a) chips no longer render with a leftover OS checkbox, (b) the 2× toggle disables and clamps the max slider, (c) Modifiers section reads as enabled at a glance, (d) cycling a chip through three clicks shows Any/Required/Excluded labels, (e) enabling `__OF_DEBUG_DISCOVERY` produces console output for each evaluated lobby.

## Files touched

| File | Change |
|---|---|
| `src/styles/styles.ts` | Two `display: none` rules; `.ld-mod` color bump; `.ld-mod-name` weight; `.ld-range.is-locked` styles; legend label `Excl`. |
| `src/modules/lobby-discovery/LobbyDiscoveryUI.ts` | 2× toggle behavior (`applyTwoTimesLock`, `lastTeamManualMax`); rename strings; debug log; remove `MatchOptions` flag passing. |
| `src/modules/lobby-discovery/LobbyDiscoveryEngine.ts` | Drop the `isTeamTwoTimesMinEnabled` branch and the `MatchOptions` field. |
| `src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts` | `getLobbyModifierValue` fallback for `startingGold` and `goldMultiplier`; `getActiveModifierLabels` uses the same fallback. |
| Tests as listed above. | |
| `package.json` / `package-lock.json` / `dist/bundle.user.js` | Version 2.10.1 + rebuild. |

Files unchanged: `LobbyDiscoveryTypes.ts`, `LobbyDataManager.ts`, `CurrentPlayerHighlighter.ts`, `URLObserver.ts`, `BrowserNotificationUtils.ts`, `SoundUtils.ts`, `main.ts`.

## Risks

- **Host-gold fallback could create false negatives** if a lobby has both `publicGameModifiers.goldMultiplier = 2` and `gameConfig.goldMultiplier = 1` (the host overrode the public-pool multiplier). Mitigation: `??` order prefers `publicGameModifiers` first, falling back only when undefined. The schema makes `gameConfig.goldMultiplier` `nullable().optional()`, so a `null` falls through to undefined-equivalent. Acceptable.
- **`is-locked` class collision** with future generic styles. Mitigation: keep it scoped to `.ld-range.is-locked`, not a global utility class.
- **Debug toggle could leak in production output** if a user enables it and forgets. Mitigation: it's `console.debug`, which most browsers hide from the default Console pane (visible only with the Verbose level enabled). No persistent storage — clears on page reload.
