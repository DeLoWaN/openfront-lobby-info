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

### Treat new data needs as adapter-layer changes first

If `0.30` requires new queue parsing or helper types, those changes should stay
as close as possible to the data/helper layer and should not be used to justify
rewriting the panel shell, boot flow, or overall styling.

### Extend the existing panel instead of replacing it

`FFA`, `HvN`, and modifier support should be integrated into the prior panel
structure using the established visual language. The goal is that the adapted
script still feels like the same userscript to an existing user.

### Keep the modal enhancement additive and visually conservative

The current-player improvement should be a small highlight layered onto the
native join modal and styled in a way that matches the old userscript accent
language rather than introducing a new UI motif.

## Risks / Trade-offs

- Over-adapting the `0.30` change into another redesign -> explicitly anchor all
  implementation work on the old committed UI/runtime baseline first.
- Queue compatibility may still need helper/type changes -> keep those changes
  localized and prove each one with tests.
- Join-modal selectors may shift -> keep the highlight enhancement optional,
  additive, and easy to remove or adjust without affecting discovery.
