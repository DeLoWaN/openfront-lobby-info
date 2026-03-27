# Design

## Context

The existing userscript still assumes an older homepage and a legacy lobby data
flow. OpenFront `0.30` changed the public queue model, but the accidental
response was to replace the userscript's UI shell, styling language, and boot
flow as well. This recovery change re-establishes the last good committed
userscript UI/runtime as the implementation baseline and treats `0.30`
compatibility as a narrow adaptation problem, not a redesign problem.

## Goals / Non-Goals

**Goals:**

- Restore the last good committed userscript UI/runtime baseline before further
  `0.30` work.
- Adapt the existing discovery experience to `0.30` queues with minimal DOM and
  CSS churn.
- Preserve the established panel look, spacing, typography, and motion language
  unless a concrete incompatibility forces a local change.
- Remove the obsolete player-list/sidebar product surface and the old body
  layout reservation it required.
- Make the remaining discovery panel work as a desktop tool first: wider by
  default, resizable, persisted, and not artificially collapsed.
- Add current-player highlighting as an additive enhancement only.

**Non-Goals:**

- Redesign the userscript into a new visual system.
- Replace the existing discovery panel structure with a new homepage-only
  shell.
- Introduce a broad new settings model unless the old one is proven unusable.

## Decisions

### Restore the old shell before adapting behavior

The implementation baseline should be the last committed versions of
`main.ts`, `styles.ts`, and the existing discovery UI structure. This prevents
the `0.30` work from being coupled to an accidental redesign and lowers the
risk of new visual regressions.

The one intentional exception is the legacy player-list/sidebar feature: the
homepage no longer needs that duplicated player view, so the adaptation should
stop booting `PlayerListUI` and remove the wrapper/layout-reservation logic that
only existed to make room for that sidebar.

### Treat new data needs as adapter-layer changes first

If `0.30` requires new queue parsing or helper types, those changes should stay
as close as possible to the data/helper layer and should not be used to justify
rewriting the panel shell, boot flow, or overall styling.

### Extend the existing panel instead of replacing it

`FFA`, `HvN`, and modifier support should be integrated into the prior panel
structure using the established visual language. The goal is that the adapted
script still feels like the same userscript to an existing user.

The follow-up usability pass keeps that same shell but removes the collapsible
filters behavior, makes the panel wider and resizable on desktop, and uses
binary `Allowed / Blocked` controls for modifiers instead of select boxes. The
matching model is now an exclusion list: `Allowed` does not constrain matching,
while `Blocked` suppresses discovery feedback for lobbies where that modifier is
present.
The final control implementation should use a true two-button segmented control
rather than radios disguised as a slider, so both states occupy equal width and
the active `Blocked` side aligns flush with the right edge of the control.

Discovery feedback on the homepage should no longer rely on stacked floating
popups. The displayed queue card itself becomes the feedback surface, using one
continuous, clearly visible animated highlight while that queue's currently
rendered lobby matches discovery criteria. That highlight should use a contrast
color that is distinct from OpenFront's existing sky-blue accents so it does
not visually blend into the native card styling, and its opacity should stay
strong enough that the highlighted card is easy to spot at a glance.

The pulse must stop completely while the user is already joined in a public
lobby. On OpenFront `0.30`, that guard should be derived from the actual joined
lobby modal state (`join-lobby-modal.currentLobbyId` and
`host-lobby-modal.lobbyId`), with `public-lobby` treated only as a legacy
compatibility signal if it exists, instead of relying on URL or page
visibility alone.

Team capacity filtering should use `players per team`, not total lobby
capacity. FFA continues to use total lobby capacity. This distinction is
important because users reason about Team filters as `4 to 8 per team`, not as
the overall lobby capacity. The Team slider cap should therefore reflect the
largest coherent per-team value supported by the current public lobby cap, while
FFA can use the full total-capacity bound.

### Keep the modal enhancement additive and visually conservative

The current-player improvement should be a small highlight layered onto the
native join modal and styled in a way that matches the old userscript accent
language rather than introducing a new UI motif. It should be anchored on the
real `currentClientID` state from `lobby-player-view`, not only on heuristic CSS
class matching, and the DOM observer must avoid recursive attribute watching
that could destabilize the team join modal.

## Risks / Trade-offs

- Over-adapting the `0.30` change into another redesign -> explicitly anchor all
  implementation work on the old committed UI/runtime baseline first.
- Queue compatibility may still need helper/type changes -> keep those changes
  localized and prove each one with tests.
- Join-modal selectors may shift -> keep the highlight enhancement optional,
  additive, and easy to remove or adjust without affecting discovery.
