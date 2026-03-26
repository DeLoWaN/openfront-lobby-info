# Spec Delta

## MODIFIED Requirements

### Requirement: Notify-Only Discovery

The userscript SHALL continue discovering matching lobbies and presenting
notifications, while remaining strictly notify-only and non-joining.

#### Scenario: Matching FFA or Team criteria triggers notification

- **WHEN** a public lobby matches the configured FFA or Team criteria
- **THEN** the userscript SHALL display a game-found notification without
  joining the lobby

#### Scenario: Repeated processing of the same match

- **WHEN** the same matching lobby is processed repeatedly during discovery
  updates
- **THEN** the userscript SHALL avoid duplicating notifications beyond the
  configured deduplication behavior

### Requirement: Discovery Adapts To OpenFront 0.30 While Preserving The UI

The userscript SHALL support OpenFront `0.30` public queue compatibility while
preserving the prior userscript discovery presentation as the baseline.

#### Scenario: 0.30 adaptation is implemented

- **WHEN** discovery behavior is updated for OpenFront `0.30`
- **THEN** the implementation SHALL extend the existing userscript panel
  language instead of replacing it with a new shell

### Requirement: Team Criteria Filtering Remains Available

The userscript SHALL keep Team criteria configuration available for manual
discovery, including team-format filters, `Humans Vs Nations`, and
capacity-based constraints.

#### Scenario: Team format criteria is configured

- **WHEN** the user selects specific Team formats (for example Duos, Trios,
  Quads, numeric team counts, or Humans Vs Nations)
- **THEN** discovery matching SHALL evaluate lobbies against those selected
  Team formats

#### Scenario: Team capacity range is configured

- **WHEN** the user sets Team min/max capacity constraints
- **THEN** discovery matching SHALL only notify for Team lobbies whose capacity
  satisfies the configured range

### Requirement: FFA Criteria Filtering Is Available

The userscript SHALL provide FFA criteria configuration for manual discovery.

#### Scenario: FFA discovery is enabled

- **WHEN** the user enables FFA filtering and sets a capacity range
- **THEN** discovery matching SHALL only notify for FFA lobbies whose capacity
  satisfies the configured range

### Requirement: Public Queue Sources Are Normalized

The userscript SHALL treat OpenFront public queue payloads as the source of
discovery state and normalize FFA, Team, and Special queues into one internal
lobby model.

#### Scenario: Special queue contains a Team lobby

- **WHEN** a Special queue lobby resolves to Team mode
- **THEN** discovery matching SHALL evaluate it using the configured Team
  criteria and modifier filters

#### Scenario: Special queue contains an FFA lobby

- **WHEN** a Special queue lobby resolves to FFA mode
- **THEN** discovery matching SHALL evaluate it using the configured FFA
  criteria and modifier filters

### Requirement: Modifier Filters Are Added With Minimal UI Churn

The userscript SHALL add the required modifier filters in a way that preserves
the established discovery panel identity as much as practical.

#### Scenario: Modifier controls are introduced

- **WHEN** the panel gains new modifier controls for `0.30`
- **THEN** those controls SHALL be integrated into the prior panel structure
  and visual language rather than presented as a redesigned interface

### Requirement: Modifier Filters Support Tri-State Matching

The userscript SHALL let users keep modifier filters indifferent by default and
optionally require or reject specific modifiers.

#### Scenario: Boolean modifier is required

- **WHEN** the user marks a boolean modifier as required
- **THEN** matching SHALL only succeed for lobbies where that modifier is active

#### Scenario: Numeric modifier value is rejected

- **WHEN** the user marks an exact numeric modifier value as rejected
- **THEN** matching SHALL fail for lobbies containing that exact value

### Requirement: Notification Controls Persist

Notification enablement and sound preferences SHALL be configurable and
persisted across sessions.

#### Scenario: Discovery is disabled

- **WHEN** the user pauses discovery
- **THEN** subsequent matching lobbies SHALL NOT create game-found
  notifications until discovery is re-enabled

#### Scenario: Sound preference is enabled

- **WHEN** a game-found notification is shown while sound is enabled
- **THEN** the userscript SHALL play the configured notification sound
