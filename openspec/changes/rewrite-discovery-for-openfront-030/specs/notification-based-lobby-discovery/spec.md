# Spec Delta

## MODIFIED Requirements

### Requirement: Notify-Only Discovery

The userscript SHALL continue discovering matching lobbies and presenting
visual feedback, while remaining strictly notify-only and non-joining.

#### Scenario: Matching displayed queues remain visibly animated on the homepage

- **WHEN** a public lobby matches the configured FFA or Team criteria
- **THEN** the userscript SHALL animate the corresponding displayed homepage
  card without joining the lobby
- **AND** it SHALL keep that animated state while the displayed queue continues
  to match

#### Scenario: Repeated processing of the same match

- **WHEN** the same matching lobby is processed repeatedly during discovery
  updates
- **THEN** the userscript SHALL keep one continuous animated matched state on
  the corresponding card instead of creating duplicate feedback surfaces

#### Scenario: Multiple queues match simultaneously

- **WHEN** several displayed queues match at the same time
- **THEN** each corresponding homepage card SHALL show its own animated matched
  state independently

#### Scenario: User is already joined in a public lobby

- **WHEN** the native joined-lobby UI indicates the user is already in a lobby
  through an active `join-lobby-modal` or `host-lobby-modal`
- **THEN** the userscript SHALL suppress discovery pulse feedback and sound
  until that joined state ends

### Requirement: Discovery Adapts To OpenFront 0.30 While Preserving The UI

The userscript SHALL support OpenFront `0.30` public queue compatibility while
preserving the prior userscript discovery presentation as the baseline.

#### Scenario: 0.30 adaptation is implemented

- **WHEN** discovery behavior is updated for OpenFront `0.30`
- **THEN** the implementation SHALL extend the existing userscript panel
  language instead of replacing it with a new shell

### Requirement: Obsolete Player List Surface Is Removed

The userscript SHALL remove the old duplicate player-list/sidebar surface now
that OpenFront exposes player rosters in the native join flow.

#### Scenario: Userscript boots on the homepage

- **WHEN** the adapted userscript initializes
- **THEN** it SHALL not mount the legacy player-list sidebar or reserve page
  layout space for it

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
- **THEN** discovery matching SHALL interpret that range as `players per team`
  rather than total lobby capacity
- **AND** it SHALL only notify for Team lobbies whose per-team size satisfies
  the configured range

#### Scenario: Team capacity UI reflects per-team semantics

- **WHEN** the desktop panel renders Team min/max controls
- **THEN** the Team slider and numeric inputs SHALL use a maximum that reflects
  the highest coherent per-team value for the currently supported public lobby
  cap
- **AND** they SHALL NOT reuse the full FFA total-capacity bound

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

#### Scenario: Modifier controls are made easier to use

- **WHEN** the desktop discovery panel renders modifier filters
- **THEN** it SHALL use an always-visible binary `Allowed / Blocked` control
  instead of a compact dropdown select
- **AND** the control SHALL be implemented as a true two-button segmented
  control with equal-width states
- **AND** the active `Blocked` side SHALL align flush with the right edge of
  the control instead of leaving unused interior space

### Requirement: Modifier Filters Support Binary Exclusion Matching

The userscript SHALL treat modifier filters as an exclusion list where each
modifier stays `Allowed` by default and may optionally be marked `Blocked`.

#### Scenario: Boolean modifier is blocked

- **WHEN** the user marks a boolean modifier as blocked
- **THEN** matching SHALL fail for lobbies where that modifier is active

#### Scenario: Numeric modifier value is blocked

- **WHEN** the user marks an exact numeric modifier value as blocked
- **THEN** matching SHALL fail for lobbies containing that exact value

### Requirement: Notification Controls Persist

Notification enablement and sound preferences SHALL be configurable and
persisted across sessions.

#### Scenario: Discovery is disabled

- **WHEN** the user pauses discovery
- **THEN** subsequent matching lobbies SHALL NOT create discovery feedback
  until discovery is re-enabled

#### Scenario: Sound preference is enabled

- **WHEN** one or more new matching homepage cards begin pulsing while sound is
  enabled
- **THEN** the userscript SHALL play the configured notification sound

### Requirement: Discovery Panel Is Desktop-Resizable And Always Visible

The desktop discovery panel SHALL keep all filter sections visible by default,
support persisted horizontal resizing, and allow vertical scrolling when its
content exceeds the viewport.

#### Scenario: User resizes the panel

- **WHEN** the user changes the panel width on desktop
- **THEN** the userscript SHALL persist and restore that width across reloads

#### Scenario: Modifier list exceeds available height

- **WHEN** the panel content is taller than the available viewport
- **THEN** the panel body SHALL scroll normally instead of clipping controls

### Requirement: Homepage Match Highlight Stays Clearly Visible

The homepage match highlight SHALL remain visually distinct from native
OpenFront queue styling for as long as the queue stays matched.

#### Scenario: A queue card is matched

- **WHEN** a displayed queue card matches discovery criteria
- **THEN** the applied animated highlight SHALL use a contrast color that does
  not blend into OpenFront's default blue accents
- **AND** it SHALL remain opaque enough that the matched card is easy to spot
