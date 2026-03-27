# Proposal

## Why

OpenFront `0.30` changed the homepage lobby surface enough that the existing
userscript no longer maps cleanly onto the live queues and filters. The mistake
to avoid is solving that compatibility gap with a ground-up redesign that
changes the userscript's established UI language and introduces unnecessary
regressions.

## What Changes

- Restore the last good committed userscript UI/runtime baseline before making
  any `0.30` adaptations.
- Adapt the existing discovery flow to OpenFront `0.30` public queue data while
  preserving the prior userscript look-and-feel, panel structure, and visual
  personality wherever practical.
- Remove the obsolete player-list/sidebar product surface instead of trying to
  keep it alive alongside the `0.30` homepage.
- Add `FFA`, `Team`, `Humans Vs Nations`, and modifier support through minimal
  extensions of the existing panel instead of a redesign.
- Keep the desktop discovery panel fully visible, wider by default,
  redimensionnable, and vertically scrollable when content exceeds the viewport.
- Replace awkward modifier selects with a clearer binary exclusion toggle:
  `Allowed` or `Blocked`, implemented as a true two-button segmented control.
- Keep discovery notify-only, but use homepage card feedback instead of
  floating popups when a displayed queue matches: one continuous high-contrast
  animated highlight on the matching card, using a contrast color that stays
  clearly visible against native OpenFront blues.
- Keep FFA capacity filtering aligned with total lobby capacity, but interpret
  Team min/max filters as `players per team` so formats like `4 teams x 8` and
  `6 teams x 12` match as users expect.
- Add a small, additive enhancement that makes the current player easier to spot
  in the native join modal without replacing the modal UI.

## Capabilities

### New Capabilities

- `current-player-visibility`: Add a lightweight current-player highlight to the
  native OpenFront join modal in a way that fits the existing userscript style.

### Modified Capabilities

- `notification-based-lobby-discovery`: Discovery requirements change to follow
  the OpenFront `0.30` queue model while preserving the established userscript
  presentation as the baseline.
- `mode-selector-pruning`: Mode-selector requirements change to support the
  needed `0.30` filters without implying a new homepage-only UI redesign.
- `manual-join-only-lobby-assist`: Manual-join requirements remain strict, but
  the adaptation must stay visually and structurally close to the prior script.

## Impact

- Affected code: the existing discovery/runtime files, the old player-list boot
  path and layout wrapper, their tests, and the join-modal enhancement point.
- Main constraint: reuse the last good UI shell rather than replacing it.
- Tests: focus on queue compatibility, filter behavior, notify-only guarantees,
  and additive current-player highlighting.
