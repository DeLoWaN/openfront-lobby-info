# Spec Delta

## MODIFIED Requirements

### Requirement: Existing Discovery UI Gains The Needed 0.30 Mode Selectors

The discovery configuration UI MUST gain the selectors required for OpenFront
`0.30` without replacing the established panel presentation.

#### Scenario: Discovery panel is rendered

- **WHEN** the adapted discovery panel is rendered
- **THEN** it SHALL expose the needed `FFA` and `Team` selectors while
  remaining recognizably the same userscript UI

### Requirement: Team Selectors Include Humans Vs Nations

The Team discovery configuration UI MUST allow `Humans Vs Nations` to be
selected as a supported Team format.

#### Scenario: Team formats are displayed

- **WHEN** the user expands Team filtering options
- **THEN** `Humans Vs Nations` SHALL be available alongside Duos, Trios,
  Quads, and numeric team counts

### Requirement: Special Is Not A Standalone Selector

Discovery matching MUST NOT expose Special as an independent mode selector.

#### Scenario: Discovery panel is rendered without a Special toggle

- **WHEN** the adapted discovery panel is shown
- **THEN** no standalone Special mode selector SHALL be presented
