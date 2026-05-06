# Split Team panel into Format + Number of Teams subsections

## Goal

Reorganize the Teams · Format & size panel so the qualitative variant (Humans Vs Nations) is visually separated from the quantitative team-count selectors, and remove the now-unneeded bulk-select buttons.

## Current state

In [LobbyDiscoveryUI.ts:962-975](../../../src/modules/lobby-discovery/LobbyDiscoveryUI.ts):

- One `FORMAT` mini-header
- One row of 7 chips: `HvN`, `2 teams`, `3 teams`, `4 teams`, `5 teams`, `6 teams`, `7 teams`
- One row of bulk-select buttons: `All`, `None`

## Target layout

```
TEAMS · FORMAT & SIZE
─────────────────────
FORMAT
[ Humans Vs Nations ]

NUMBER OF TEAMS
[ 2 ] [ 3 ] [ 4 ] [ 5 ] [ 6 ] [ 7 ]

Players per team
<slider unchanged>
```

## Changes

### Markup (LobbyDiscoveryUI.ts)

- Keep the existing `<div class="ld-format-label">FORMAT</div>` and the `.ld-formats` row that follows, but trim that row to a single chip.
- Change the HvN chip's visible label from `HvN` to `Humans Vs Nations`. The `value` attribute and id stay the same.
- Insert a new `<div class="ld-format-label">NUMBER OF TEAMS</div>` after the FORMAT row.
- Add a new `.ld-formats` row containing the 6 count chips, with visible labels reduced to just the number (`2`, `3`, … `7`). Ids and values unchanged.
- Delete the `<div class="ld-formats">` block that holds the `discovery-team-select-all` and `discovery-team-deselect-all` buttons.

### Wiring (LobbyDiscoveryUI.ts)

- Remove the click handlers for `discovery-team-select-all` and `discovery-team-deselect-all` (around lines 810-815).
- Keep `setAllTeamCounts` — `resetAll` still uses it.
- `getAllTeamCountValues`, `setTeamCountSelections`, and `ALL_TEAM_IDS` keep working unchanged because IDs are stable.

### Styles

No new CSS. Reuse existing `.ld-format-label` and `.ld-formats` rules.

## Why "NUMBER OF TEAMS" rather than "TEAM SIZE"

The slider directly below the chips is labeled `Players per team`, which is what most readers would assume "Team size" means. Using "NUMBER OF TEAMS" eliminates that overlap.

## Backwards compatibility

- Persisted settings under `OF_LOBBY_DISCOVERY_SETTINGS` are unaffected: chip ids and values are unchanged, so existing saved criteria still round-trip.
- No changes to the engine, criteria types, helpers, or data layer.

## Tests

- Existing tests in `tests/modules/lobby-discovery/` should continue to pass without changes.
- Manual: load the userscript, open the panel, verify the two labeled subsections render, the HvN chip reads "Humans Vs Nations", count chips show just numbers, and All/None buttons are gone. Toggle each chip and confirm criteria still serialize/deserialize correctly.

## Out of scope

- Engine, slider, 2× lock, persistence schema, modifier UI, FFA panel.
