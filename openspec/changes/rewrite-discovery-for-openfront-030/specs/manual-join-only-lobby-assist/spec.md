# Spec Delta

## MODIFIED Requirements

### Requirement: Programmatic Join/Rejoin Is Prohibited

The userscript MUST NOT initiate lobby join, rejoin, or lobby-switch actions
from background logic, criteria matching, watcher callbacks, or timed
processing. Lobby entry MUST require explicit user interaction with OpenFront
UI controls.

#### Scenario: Matching lobby is detected

- **WHEN** discovery processing finds a lobby that matches the configured criteria
- **THEN** the userscript MUST NOT trigger a join action for that lobby

### Requirement: Manual-Join Guardrails Must Survive The 0.30 Adaptation

The OpenFront `0.30` adaptation MUST preserve the existing manual-join
guardrails without requiring a new homepage-only UX.

#### Scenario: Discovery behavior is adapted for 0.30

- **WHEN** queue compatibility and filters are extended
- **THEN** the userscript MUST keep all matching flows strictly non-automated
  while staying visually close to the prior userscript
