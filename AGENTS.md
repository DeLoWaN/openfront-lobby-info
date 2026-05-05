
# OpenFront Game Notifier

## Project Overview

This userscript (**OpenFront Game Notifier**) is a **notify-only** lobby discovery tool for OpenFront.io. It surfaces public lobbies that match user-defined criteria (game mode, player counts, team configuration, modifiers) and alerts the user via in-page UI, sound, and optional desktop notifications. It does **not** auto-join lobbies and does **not** programmatically click any join buttons.

It also enhances OpenFront's native join-lobby modal by highlighting the current player and their team.

**Requirements:** OpenFront.io v0.30+

The userscript is built from modular TypeScript source in `src/` and compiled to `dist/bundle.user.js` for distribution.

---

## Development Architecture

### Build System

- **Language**: TypeScript 5.3+ with strict mode enabled
- **Bundler**: esbuild
- **Testing**: Vitest with JSDOM environment

### Directory Structure

```
.
├── src/
│   ├── config/
│   │   ├── constants.ts     # CONFIG, STORAGE_KEYS, Z_INDEX
│   │   └── theme.ts         # COLORS, SPACING, design tokens
│   ├── types/
│   │   ├── game.d.ts
│   │   └── greasemonkey.d.ts
│   ├── styles/
│   │   └── styles.ts
│   ├── utils/
│   │   ├── BrowserNotificationUtils.ts
│   │   ├── LobbyUtils.ts
│   │   ├── ResizeHandler.ts
│   │   ├── SoundUtils.ts
│   │   └── URLObserver.ts
│   ├── data/
│   │   └── LobbyDataManager.ts        # WebSocket + HTTP fallback
│   ├── modules/
│   │   └── lobby-discovery/
│   │       ├── LobbyDiscoveryTypes.ts
│   │       ├── LobbyDiscoveryHelpers.ts
│   │       ├── LobbyDiscoveryEngine.ts
│   │       ├── LobbyDiscoveryUI.ts
│   │       └── CurrentPlayerHighlighter.ts
│   └── main.ts
├── tests/
├── dist/
├── package.json
├── tsconfig.json
├── esbuild.config.js
└── vitest.config.js
```

### Architecture Layers

Unidirectional dependency flow:

1. **Config** — constants and theme tokens
2. **Types** — TypeScript interfaces
3. **Styles** — CSS-in-JS using theme tokens
4. **Utils** — pure helpers and DOM/audio utilities
5. **Data** — `LobbyDataManager` (WebSocket with HTTP polling fallback, subscriber pattern)
6. **Modules** — `lobby-discovery` (panel UI + matching engine + native modal highlighter)
7. **Main** — wires everything together

### Development Workflow

```bash
npm install
npm run dev         # esbuild watch mode
npm run build:prod  # production bundle
npm test            # vitest
npm run type-check  # tsc --noEmit
```

### Key Architectural Decisions

- **No automation**: The script never invokes the lobby join API or simulates clicks on join controls. Two contract tests in `tests/modules/lobby-discovery/` enforce this.
- **Path aliases**: `@/` maps to `src/`.
- **Pure functions**: Helpers in `*Helpers.ts` are side-effect-free for testability.
- **Subscriber pattern**: `LobbyDataManager` publishes lobby snapshots; `LobbyDiscoveryUI` subscribes.
- **Type safety**: TypeScript strict mode.

### Module Overview

**Lobby Discovery** ([src/modules/lobby-discovery/](src/modules/lobby-discovery/)):
- `LobbyDiscoveryTypes.ts` — settings, criteria, modifier filter types
- `LobbyDiscoveryHelpers.ts` — pure functions: criteria sanitization, settings normalization, lobby parsing, notification text formatting
- `LobbyDiscoveryEngine.ts` — matching logic over lobby snapshots
- `LobbyDiscoveryUI.ts` — panel UI, sound and desktop notification dispatch
- `CurrentPlayerHighlighter.ts` — additive enhancer for OpenFront's native join-lobby modal

**Data Layer** ([src/data/](src/data/)):
- `LobbyDataManager.ts` — WebSocket connection with automatic HTTP fallback, subscriber pattern

---

## Core Features

### 1. Lobby Discovery (notify-only)

- **Criteria-based matching**: filter by game mode (FFA / Team), player count range, team format (Duos / Trios / Quads / Humans Vs Nations / 2–7 teams), and lobby modifiers (compact, random spawn, crowded, hard nations, alliances/ports/nukes/SAMs disabled, peace time, starting gold, gold multiplier).
- **Three notification channels**: in-page panel highlight on the matching queue card, sound alert, and (optional) browser desktop notification.
- **Search timer**: shows how long the current search has been running.
- **Sleep when in-game**: panel hides while a game is live (URL has `?live`).

### 2. Current Player Highlight on Native Modal

- **Additive enhancer**: when OpenFront opens its native join-lobby modal, the current player's row gets a glow and their team card is also highlighted.
- Uses a MutationObserver and reads OpenFront's own custom-element properties (`currentClientID`, `clients`, `teamPreview`); does not modify any of OpenFront's internals.

### 3. Smart Lobby Data Pipeline

- **WebSocket-first**: real-time lobby updates via WebSocket.
- **HTTP fallback**: after 3 failed WebSocket connection attempts, falls back to polling.
- **URL-aware sleep**: stops processing while a game is live.

---

## Settings Persistence

Stored under `OF_LOBBY_DISCOVERY_SETTINGS` and `OF_LOBBY_DISCOVERY_PANEL_SIZE` via `GM_setValue`. Settings include:

- Discovery criteria list
- Discovery enabled/disabled
- Sound enabled/disabled
- Desktop notifications enabled/disabled
- `isTeamTwoTimesMinEnabled` constraint flag

`normalizeSettings` in `LobbyDiscoveryHelpers.ts` validates and applies defaults on load.

---

## Project Context

Integrates with:
- OpenFront.io public lobby endpoint and WebSocket feed
- OpenFront.io game configuration shape
- Tampermonkey / Greasemonkey

Contributors: DeLoVaN, SyntaxMenace, DeepSeek, Claude.

# Version Management

Version is centralized in `package.json` and propagates to:
- `package-lock.json` (via `npm install`)
- `dist/bundle.user.js` userscript header (via build)

## How to Upgrade Version

1. **Update version in package.json**:
   ```bash
   npm version patch   # 2.5.0 → 2.5.1
   npm version minor   # 2.5.0 → 2.6.0
   npm version major   # 2.5.0 → 3.0.0
   ```

2. **Rebuild the production bundle**:
   ```bash
   npm run build:prod
   ```

3. **Verify version consistency**:
   ```bash
   grep '"version"' package.json
   grep '@version' dist/bundle.user.js
   ```

The build reads the version from `package.json` and injects it into the userscript header. Always run `npm run build:prod` after a version bump.
