# Spec Delta

## ADDED Requirements

### Requirement: Browser Match Notifications

The userscript SHALL allow matching Discovery lobbies to raise a browser
notification when the user enables the dedicated browser notification setting
and the OpenFront tab remains open.

#### Scenario: Matching lobby found while OpenFront is in background

- **WHEN** a new lobby matches Discovery criteria and browser notifications are
  enabled
- **AND** OpenFront is not the active visible tab
- **THEN** the userscript SHALL display a browser notification for that match

#### Scenario: Matching lobby found while OpenFront is visible

- **WHEN** a new lobby matches Discovery criteria and browser notifications are
  enabled
- **AND** OpenFront is the active visible tab
- **THEN** the userscript SHALL NOT display a browser notification

#### Scenario: Notification permission is not granted

- **WHEN** browser notification permission is unavailable or denied
- **THEN** the userscript SHALL NOT display browser notifications

#### Scenario: Notification click requests focus

- **WHEN** the user clicks a browser notification for a matching lobby
- **THEN** the userscript SHALL attempt to bring the OpenFront tab to the
  foreground

#### Scenario: Repeated processing of the same match

- **WHEN** the same matching lobby is processed repeatedly during Discovery
  updates while browser notifications are enabled
- **THEN** the userscript SHALL avoid duplicate browser notifications beyond
  the existing deduplication behavior

## MODIFIED Requirements

### Requirement: Notification Controls Persist

The userscript SHALL allow notification enablement, sound preferences, and
browser notification preferences to be configured and persisted across
sessions.

#### Scenario: Discovery is disabled

- **WHEN** the user pauses Discovery
- **THEN** subsequent matching lobbies SHALL NOT create Discovery feedback
  until Discovery is re-enabled

#### Scenario: Sound preference is enabled

- **WHEN** one or more new matching homepage cards begin pulsing while sound is
  enabled
- **THEN** the userscript SHALL play the configured notification sound

#### Scenario: Browser notification preference changes

- **WHEN** the user enables or disables browser notifications
- **THEN** the userscript SHALL persist that preference across sessions
- **AND** it SHALL NOT overwrite the stored sound preference
