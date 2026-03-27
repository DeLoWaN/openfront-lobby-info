# Change: Add Browser Notifications For Lobby Discovery

## Why

Lobby Discovery currently alerts users with in-page visual feedback and an
optional sound. That works only when the player is actively watching the
OpenFront tab, which undermines the "notify-only" workflow when users want to
keep the tab open in the background and do something else.

## What Changes

- Add an optional browser/system notification path for new Discovery matches.
- Show browser notifications only when the OpenFront tab is still open and not
  the active visible tab.
- Add a dedicated browser notification setting that is independent from the
  existing sound toggle.
- Attempt to bring the OpenFront tab to the foreground when the user clicks a
  browser notification.
- Keep the current notify-only and deduplicated discovery behavior intact.
- Use the standard browser `Notification` API for desktop delivery.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `notification-based-lobby-discovery`: Extend notify-only discovery so matching
  lobbies can raise browser/system notifications with permission-aware,
  background-only, persisted behavior.

## Impact

- Affected code:
  - `src/modules/lobby-discovery/LobbyDiscoveryUI.ts`
  - `src/modules/lobby-discovery/LobbyDiscoveryTypes.ts`
  - New notification utility under `src/utils/`
  - Discovery UI tests under `tests/modules/lobby-discovery/`
- APIs and dependencies:
  - Browser `Notification` API
  - Existing GM storage key `OF_LOBBY_DISCOVERY_SETTINGS`
- Breaking changes: None. This is an additive, opt-in change.
