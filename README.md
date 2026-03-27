# OpenFront.io Lobby Intel + Discovery

A TypeScript userscript for OpenFront `v0.30+` that adds notify-only lobby
discovery, homepage queue highlighting, optional sound and desktop
notifications, and a stronger highlight for your own player entry in the
native join modal.

## For Players

OpenFront `0.30` changed the homepage queue UI and exposed native lobby
rosters, so this project now focuses on manual lobby discovery instead of the
old duplicate sidebar player list.

<img width="525" height="1119" alt="image" src="https://github.com/user-attachments/assets/4a022e58-d25f-4100-9b54-cf76fe245ccd" />

### What Changed For OpenFront 0.30

- The legacy sidebar player list was removed from the live runtime.
- Discovery remains strictly notify-only and never auto-joins or rejoins.
- Matching queues are highlighted directly on the native OpenFront homepage.
- The native join modal gets an additive highlight for your own player row.

### Features

- Notify-only discovery for `FFA` and `Team` public lobbies
- Homepage card pulse/highlight when one or more displayed queues match
- Team format filters for `Duos`, `Trios`, `Quads`, `Humans Vs Nations`, and
  custom `2-7` team formats
- Capacity filters with correct `0.30` semantics for both lobby types
- `FFA` filters use total lobby capacity
- `Team` filters use players per team
- Modifier filters with explicit `Allowed` / `Blocked` controls
- Optional sound alerts for new matches
- Optional desktop notifications when the OpenFront tab is in the background
- Resizable desktop discovery panel with persisted settings
- Stronger visual emphasis for your own entry in the native join modal

### Supported Modifier Filters

- Compact
- Random Spawn
- Crowded
- Hard Nations
- Alliances Disabled
- Ports Disabled
- Nukes Disabled
- SAMs Disabled
- Peace Time
- Starting Gold `1M`, `5M`, `25M`
- Gold Multiplier `x2`

### Requirements

- OpenFront `v0.30+`
- Tampermonkey or Greasemonkey
- Browser notification permission if you want desktop alerts

### Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or
   [Greasemonkey](https://www.greasespot.net/).
2. Install from Greasy Fork: [OpenFront.io Lobby Intel + Discovery][greasyfork]
3. Confirm the userscript installation.
4. Visit [openfront.io](https://openfront.io/).

### How To Use

1. Open the Play page on [openfront.io](https://openfront.io/).
2. Configure the `Lobby Discovery` panel.
3. Enable `FFA`, `Team`, or both.
4. For Team lobbies, optionally select formats such as `Duos`, `Quads`, `HvN`,
   or a custom team count.
5. Mark unwanted modifiers as `Blocked` if you want them excluded.
6. Wait for a matching queue card to pulse on the homepage.
7. Click the native OpenFront queue card yourself to join.

### Behavior Notes

- The script does not auto-join, auto-rejoin, or switch lobbies for you.
- Desktop notifications require the setting to be enabled.
- Desktop notifications require notification permission to be granted.
- Desktop notifications only appear when the OpenFront tab is not the active
  visible tab.
- `Special` queues are normalized internally and matched as `FFA` or `Team`
  depending on the resolved lobby mode.
- The current-player enhancement is visual only. It does not replace or
  re-render the native join modal.

### Local Install

1. Open [`dist/bundle.user.js`](dist/bundle.user.js).
2. Copy the file contents.
3. Open the Tampermonkey dashboard.
4. Create a new script.
5. Paste the bundle and save.

## For Developers

### Current Runtime Overview

The active OpenFront `0.30` runtime is centered on lobby discovery and native
UI enhancements:

- `src/main.ts` boots the script and wires the runtime together
- `src/data/LobbyDataManager.ts` fetches and normalizes lobby data
- `src/modules/lobby-discovery/` contains the discovery UI, matching engine,
  helpers, and join-modal enhancer
- `src/utils/BrowserNotificationUtils.ts` manages background desktop
  notifications
- `src/styles/styles.ts` contains the HUD and queue-highlight styling

The legacy `src/modules/player-list/` source still exists in the repository,
but it is not mounted in the OpenFront `0.30` runtime.

### Project Structure

```text
.
├── src/
│   ├── config/
│   ├── data/
│   │   └── LobbyDataManager.ts
│   ├── modules/
│   │   ├── lobby-discovery/
│   │   │   ├── CurrentPlayerHighlighter.ts
│   │   │   ├── LobbyDiscoveryEngine.ts
│   │   │   ├── LobbyDiscoveryHelpers.ts
│   │   │   ├── LobbyDiscoveryTypes.ts
│   │   │   └── LobbyDiscoveryUI.ts
│   │   └── player-list/        # Legacy source, not booted on v0.30
│   ├── styles/
│   ├── types/
│   ├── utils/
│   │   ├── BrowserNotificationUtils.ts
│   │   ├── LobbyUtils.ts
│   │   ├── ResizeHandler.ts
│   │   ├── SoundUtils.ts
│   │   └── URLObserver.ts
│   └── main.ts
├── tests/
├── dist/
│   └── bundle.user.js
├── package.json
├── tsconfig.json
├── esbuild.config.js
└── vitest.config.js
```

### Quick Start

Prerequisites: Node.js `18+` and npm.

```bash
npm install
npm run build
```

The bundled userscript is written to `dist/bundle.user.js`.

### Available Commands

```bash
# Development build
npm run build

# Watch mode
npm run dev

# Production build
npm run build:prod

# Test suite
npm run test

# Vitest UI
npm run test:ui

# TypeScript only
npm run type-check

# Bundle size
npm run size-check
```

### Runtime Behavior

- Discovery criteria are stored under `OF_LOBBY_DISCOVERY_SETTINGS`.
- Panel width is stored under `OF_LOBBY_DISCOVERY_PANEL_SIZE`.
- Queue-card feedback is deduplicated so repeated polling does not create
  repeated match surfaces.
- Sound and desktop notification preferences persist independently.
- Discovery feedback is suppressed while the user is already inside a joined
  lobby flow.

### Testing

The project uses Vitest with JSDOM.

```bash
# Run all tests
npm run test

# Watch tests
npm run test -- --watch

# Coverage
npm run test -- --coverage

# Type checking
npm run type-check
```

### Recent Version History

- `v2.8.17` - OpenFront `0.30` adaptation, queue-card highlighting, current
  player emphasis, and browser notifications
- `v2.7.1` - Removed all automated join and rejoin behavior
- `v2.6.0` - Added clan-based team colors and HUD improvements
- `v2.3.0` - Refactored the bundle into a modular TypeScript architecture

### Contributing

1. Follow the existing layered architecture.
2. Prefer `@/` path aliases for imports.
3. Keep new logic covered by tests.
4. Run `npm run test` and `npm run type-check` before shipping changes.
5. Rebuild `dist/bundle.user.js` for release-ready updates.

### License

UNLICENSED - Private project

### Authors

- DeLoVaN
- SyntaxMenace
- DeepSeek
- Claude

[greasyfork]:
  https://greasyfork.org/en/scripts/555551-openfront-io-lobby-intel-discovery
[screenshot]:
  https://github.com/user-attachments/assets/4a022e58-d25f-4100-9b54-cf76fe245ccd
