# Spec Delta

## ADDED Requirements

### Requirement: Current Player Is Visually Prominent In Join Modal

The userscript SHALL make the current player more visually prominent in the
native OpenFront join modal player list without replacing the underlying player
list UI or introducing a new visual language unrelated to the existing
userscript.

#### Scenario: Current player appears in FFA player chips

- **WHEN** the join modal renders a player list entry that corresponds to the
  current player
- **THEN** the userscript SHALL apply an additional visual highlight that is
  stronger than the default native emphasis

#### Scenario: Current player appears inside Team layout

- **WHEN** the join modal renders the current player inside a team card or
  players column
- **THEN** the userscript SHALL apply the same enhanced highlight treatment to
  that entry

### Requirement: Join Modal Highlight Remains Non-Disruptive

The userscript MUST limit the enhancement to visual emphasis only.

#### Scenario: Join modal opens

- **WHEN** the join modal is shown
- **THEN** the userscript MUST NOT auto-scroll, re-render, or replace the
  native player list in order to highlight the current player

#### Scenario: Highlight styling is applied

- **WHEN** the userscript emphasizes the current player
- **THEN** the styling SHALL remain additive and visually consistent with the
  prior userscript accent language
