# Remove Duos / Trios / Quads chips from team format filter

**Date:** 2026-05-06
**Status:** Approved
**Scope:** UI-only filter simplification in the lobby discovery panel.

## Motivation

The team format chips `Duos`, `Trios`, and `Quads` are redundant with the existing **Players per team** range slider:

- `Duos` ≡ slider 2–2
- `Trios` ≡ slider 3–3
- `Quads` ≡ slider 4–4

Two controls express the same constraint, which adds UI clutter and a "format vs. size" distinction that has no real meaning. The only feature lost by removing the chips is the ability to select non-contiguous values (e.g. Duos + Quads but not Trios), which is not a real use case.

`Humans Vs Nations` (HvN) is **not** redundant — it is a whole-lobby mode rather than a per-team count, and its `getPlayersPerTeam` value is the full lobby capacity. It stays.

The numeric `2 | 3 | 4 | 5 | 6 | 7 teams` chips are also unaffected — they describe number of teams, not players per team.

## Out of scope

- Lobby data model. OpenFront still emits `playerTeams: "Duos" | "Trios" | "Quads"` and the helpers that interpret incoming lobby data (`getPlayersPerTeam`, `getGameDetailsText`, `getLobbyModeLabel`) keep handling those strings unchanged.
- The `TeamCount` TypeScript type. It models lobby data, not user filter state, and stays as `'Duos' | 'Trios' | 'Quads' | 'Humans Vs Nations' | number`.
- Behavior of the per-team slider, range computation, or matching engine.

## Changes

### 1. UI ([src/modules/lobby-discovery/LobbyDiscoveryUI.ts](src/modules/lobby-discovery/LobbyDiscoveryUI.ts))

- Remove the three `renderChip` calls at lines 994–996 (`discovery-team-duos`, `discovery-team-trios`, `discovery-team-quads`).
- Move the HvN `renderChip` from the first `<div class="ld-formats">` block (line 997) into the second `<div class="ld-formats">` block (lines 999–1006), placing it before the `2 teams` chip. Then delete the now-empty first block. Result: one row of `HvN | 2 | 3 | 4 | 5 | 6 | 7 teams`.
- Remove the three entries `['discovery-team-duos', 'Duos', 2]`, `['discovery-team-trios', 'Trios', 3]`, `['discovery-team-quads', 'Quads', 4]` from the `TEAM_PRESET_IDS` array (lines 46–48). After the edit, `TEAM_PRESET_IDS` contains only the HvN entry.
- Remove the `value === 'Duos' || value === 'Trios' || value === 'Quads' ||` branches in the chip → criteria save logic (lines 522–524).
- Remove the chip-restore branches that look up `discovery-team-duos`, `discovery-team-trios`, `discovery-team-quads` by id (lines 726–728).
- `ALL_TEAM_IDS` is derived from `TEAM_PRESET_IDS ++ TEAM_COUNT_IDS`, so the select-all / deselect-all handlers, the per-id event-listener loop (line 846), and the `formatsOn` filter (line 616) update automatically. No further changes needed there.

### 2. Settings normalization ([src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts](src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts))

- In `isValidTeamCount` (lines 56–58), remove `value === 'Duos'`, `value === 'Trios'`, `value === 'Quads'` from the accepted set. Valid criteria team-count values become: `null`, `'Humans Vs Nations'`, or a number.
- Effect: when `normalizeSettings` loads a saved criterion with `teamCount: 'Duos' | 'Trios' | 'Quads'`, validation fails and `teamCount` is silently coerced to `null`. The slider min/max in that criterion are untouched.
- Helpers that interpret lobby data — `getPlayersPerTeam` (lines 110–126), `getGameDetailsText` (lines 187–189), and `getLobbyModeLabel` (lines 218–224) — keep their `Duos | Trios | Quads` branches unchanged.

### 3. Engine ([src/modules/lobby-discovery/LobbyDiscoveryEngine.ts](src/modules/lobby-discovery/LobbyDiscoveryEngine.ts))

- No changes. The existing path (`getPlayersPerTeam(lobbyTeamConfig, lobbyCapacity)` followed by min/max comparison against `criteria.minPlayers` / `criteria.maxPlayers`) already maps lobby `playerTeams: "Duos"` → 2, so a Duos lobby still matches when the slider is at 2–2 with no team-count chip selected.

### 4. Tests

- Update any existing tests under `tests/modules/lobby-discovery/` that assert `Duos | Trios | Quads` as valid criteria values — they need to expect `teamCount: null` after `normalizeSettings`.
- Add a `normalizeSettings` test: input criteria with each of `teamCount: 'Duos' | 'Trios' | 'Quads'` → output has `teamCount: null` and slider range preserved.
- Add a UI test (or update existing) confirming the three chip ids are no longer rendered.
- Lobby-data helpers (`getPlayersPerTeam`, `getGameDetailsText`, `getLobbyModeLabel`) keep their existing test coverage for the three string variants.

## Behavioral effect for users

- Users who had `Duos`, `Trios`, or `Quads` selected: their team-format filter becomes "any team format" on next load. To replicate the old behavior, they set the per-team slider min and max both to 2, 3, or 4 respectively.
- New users see a simpler panel with one fewer concept ("format" vs. "size") to reconcile.
- Lobby detection for Duos / Trios / Quads lobbies is unchanged when the slider matches the corresponding per-team value.

## Migration: drop silently

Saved settings containing `teamCount: 'Duos' | 'Trios' | 'Quads'` are silently coerced to `teamCount: null` by `normalizeSettings` on load. The slider min/max in those criteria are not modified. No user-facing migration notice.

## Files touched

- `src/modules/lobby-discovery/LobbyDiscoveryUI.ts`
- `src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts`
- Test files under `tests/modules/lobby-discovery/`

No type changes, no engine changes, no styles changes, no `dist/bundle.user.js` regeneration in source — that comes from `npm run build:prod` at release time.
