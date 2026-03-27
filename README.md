# OpenFront.io Lobby Intel + Discovery

A modular, TypeScript-based userscript that enhances the OpenFront.io gaming experience with real-time lobby information and notify-only lobby discovery.

## For Players

This userscript combines a live lobby player list with an intelligent lobby-discovery system for OpenFront.io.

<img width="525" height="1119" alt="image" src="https://github.com/user-attachments/assets/4a022e58-d25f-4100-9b54-cf76fe245ccd" />

### Requirements
- Tampermonkey or Greasemonkey

### Features
- Live player list: shows everyone in your lobby, grouped by clan tag, with counts and highlights for you and your clanmates
- Clan stats: displays win/loss performance for known clans when leaderboard data is available
- Quick tag switch: swap to your recent clan tags in one click
- Notify-only lobby discovery: scans public lobbies and alerts you when a matching Team lobby appears
- Team filters: configure team formats (duos/trios/quads or custom team counts) and player-per-team ranges
- Alerts and layout: full-screen notifications, optional sound cues, and saved settings

### Recent updates (v2.7.1)
- 🔒 Removed all automated join/rejoin behaviors for TOS-safe manual joining
- 🔎 Renamed Auto-Join module/UI to Lobby Discovery with notify-only Team filtering

### Install
1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/)
2. Install from greasyfork: [https://greasyfork.org/en/scripts/555551-openfront-io-lobby-intel-discovery](https://greasyfork.org/en/scripts/555551-openfront-io-lobby-intel-discovery)
3. Confirm installation when prompted
4. Visit https://openfront.io/ to use the script

### Use
- Join any lobby and the player list appears automatically
- Configure lobby discovery criteria in the Lobby Discovery panel
- Switch clan tags from the quick switch section
- Updates install automatically via Tampermonkey

**Alternative (local install):**
1. Open `dist/bundle.user.js` in your text editor
2. Copy the entire contents
3. Open Tampermonkey dashboard
4. Click "Create a new script"
5. Paste the contents and save

## For Developers

### Project Structure

```
userscript/
├── src/                         # Source files (TypeScript)
│   ├── main.ts                  # Entry point & initialization
│   ├── config/                  # Configuration & constants
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility classes & helpers
│   ├── data/                    # Data management layer
│   ├── styles/                  # CSS-in-JS styles
│   └── modules/                 # Feature modules
│       ├── player-list/         # Player list functionality
│       └── lobby-discovery/           # Lobby discovery functionality
├── tests/                       # Unit tests (mirrors src/)
├── dist/                        # Build output
│   └── bundle.user.js           # Final userscript
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript configuration
└── esbuild.config.js            # Build configuration
```

### Quick Start

Prerequisites: Node.js 18+ (LTS recommended), npm or yarn.

```bash
# Install dependencies
npm install

# Build the userscript
npm run build

# The output will be in dist/bundle.user.js
```

### Available Commands

```bash
# Development build (with source maps)
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev

# Production build (minified, no source maps)
npm run build:prod

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Type checking only (no build)
npm run type-check

# Check bundle size
npm run size-check
```

### Development Workflow

1. **Make changes** to TypeScript files in `src/`
2. **Run `npm run dev`** to start watch mode
3. **Test in browser** by refreshing the page (Tampermonkey auto-reloads)
4. **Write tests** in `tests/` for new functionality
5. **Run `npm run test`** to verify tests pass
6. **Build production** with `npm run build:prod` before release

### Project Conventions

- **TypeScript strict mode** - All code must type-check
- **No default exports** - Use named exports only
- **Path aliases** - Use `@/` prefix for imports (e.g., `@/utils/DragHandler`)
- **Max 500 lines per file** - Keep files focused and readable
- **Tests mirror source** - `tests/utils/Foo.test.ts` for `src/utils/Foo.ts`

### Build Output

The build process:

1. Compiles TypeScript → JavaScript (ES2020)
2. Bundles all modules → Single IIFE file
3. Injects userscript metadata header
4. Adds source maps (development only)
5. Minifies code (production only)

**Development build:**
- Includes inline source maps for debugging
- Readable variable names
- ~100KB output

**Production build:**
- Minified and optimized
- No source maps
- ~80KB output

The GitHub Actions workflow builds `dist/bundle.user.js` on every push to `main` and commits it so the raw install URL stays current.

### Testing

Tests are written using Vitest with JSDOM environment.

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage report
npm run test -- --coverage

# Run specific test file
npm run test src/utils/DragHandler.test.ts
```

### Writing Tests

Example test structure:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { YourFunction } from '@/utils/YourModule';

describe('YourFunction', () => {
  it('should do something', () => {
    const result = YourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Architecture

#### Layered Design

The codebase follows a layered architecture:

```
┌─────────────────────────────────────┐
│           main.ts                   │  ← Entry point
├─────────────────────────────────────┤
│     Feature Modules                 │  ← PlayerList, LobbyDiscovery
├─────────────────────────────────────┤
│     Styles                          │  ← CSS-in-JS
├─────────────────────────────────────┤
│     Data Layer                      │  ← LobbyDataManager, Cache
├─────────────────────────────────────┤
│     Utilities                       │  ← Drag, Sound, URL Observer
├─────────────────────────────────────┤
│     Config & Types                  │  ← Constants, Theme, Types
└─────────────────────────────────────┘
```

**Dependency Rules:**
- Lower layers never import from higher layers
- Modules can import from utils, data, config
- No circular dependencies (enforced by TypeScript)

#### Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| `config/` | Application constants, storage keys, theme tokens |
| `types/` | TypeScript type definitions, interfaces |
| `utils/` | Reusable utilities (drag, sound, URL observation) |
| `data/` | Data fetching and caching (lobbies, clan stats) |
| `styles/` | CSS-in-JS style generation |
| `modules/player-list/` | Player list UI and clan grouping |
| `modules/lobby-discovery/` | Notify-only lobby discovery UI and matching logic |
| `main.ts` | Bootstrap and wire up all modules |

### Configuration

#### TypeScript Path Aliases

Configured in `tsconfig.json` and `esbuild.config.js`:

```typescript
import { CONFIG } from '@/config/constants';
import { DragHandler } from '@/utils/DragHandler';
import { PlayerListUI } from '@/modules/player-list/PlayerListUI';
```

#### Environment Variables

- `NODE_ENV=production` - Enables minification, disables source maps

### Version History

- **v2.7.1** - Removed automation, renamed to Lobby Discovery, and kept notify-only Team filtering
- **v2.6.0** - Added clan-based team colors and tactical HUD improvements
- **v2.3.0** - Refactored to modular TypeScript architecture
- **v2.2.0** - Original monolithic bundle.js

### Contributing

1. Follow the existing code structure
2. Write tests for new functionality
3. Ensure `npm run type-check` passes
4. Keep files under 500 lines
5. Use meaningful commit messages (see [Global CLAUDE.md](../CLAUDE.md))

### License

UNLICENSED - Private project

### Authors

- DeLoVaN
- SyntaxMenace
- DeepSeek
- Claude

### Links

- [OpenFront.io](https://openfront.io/)
- [Tampermonkey](https://www.tampermonkey.net/)
- [Greasemonkey](https://www.greasespot.net/)
