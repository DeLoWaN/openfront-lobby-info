# Implementation Tasks

## 1. Settings And Userscript Runtime

- [x] 1.1 Extend `LobbyDiscoverySettings` and related migration helpers with a
  persisted `desktopNotificationsEnabled` flag defaulting to `false`
- [x] 1.2 Add the runtime support needed for native `Notification` delivery and
  best-effort focus handling
- [x] 1.3 Ensure the existing Discovery settings storage key continues to load
  older saved payloads without breaking sound or criteria persistence

## 2. Browser Notification Delivery

- [x] 2.1 Add a dedicated utility in `src/utils/` that encapsulates permission
  checks, native `Notification` delivery, and click-to-focus behavior
- [x] 2.2 Implement background-only gating so browser notifications are emitted
  only when OpenFront is not visible or not focused
- [x] 2.3 Implement best-effort click handling that attempts to focus the
  OpenFront tab without changing Discovery's notify-only semantics
- [x] 2.4 Reuse the existing Discovery deduplication key so repeated updates for
  the same match do not produce duplicate browser notifications

## 3. Discovery UI Integration

- [x] 3.1 Add a dedicated browser notification toggle to the Discovery panel
  alongside the existing status and sound controls
- [x] 3.2 Request browser notification permission only when the user explicitly
  enables the new toggle and keep the toggle disabled when permission is denied
- [x] 3.3 Persist the new toggle independently from the sound preference and
  restore it on startup
- [x] 3.4 Trigger the browser notification path from the existing new-match
  branch in `LobbyDiscoveryUI.processLobbies()`

## 4. Verification

- [x] 4.1 Add or update Vitest coverage for permission handling, background-only
  behavior, deduplication, setting persistence, and click-to-focus behavior
- [x] 4.2 Verify the sound toggle and in-page Discovery feedback remain
  unchanged when browser notifications are disabled
- [x] 4.3 Run `npm test` and `npm run type-check`
