# Design: Browser Notifications For Lobby Discovery

## Context

Lobby Discovery already has a single decision point for new matches in
`LobbyDiscoveryUI.processLobbies()`, where it deduplicates matches and triggers
sound feedback. That makes browser notifications a cross-cutting but localized
addition: the feature touches userscript permissions, stored settings, the
Discovery UI, and runtime notification delivery, while leaving the matching
engine unchanged.

The userscript must stay compatible with Tampermonkey/Greasemonkey, preserve
its notify-only behavior, and avoid surprising users with permission prompts or
foreground notifications when they are already looking at the OpenFront tab.

## Goals / Non-Goals

**Goals:**

- Add an opt-in browser notification channel for newly matched Discovery lobbies
- Request permission only from an explicit user action in the Discovery UI
- Keep browser notifications separate from the existing sound preference
- Restrict browser notifications to background-tab usage
- Preserve existing deduplication semantics and notify-only behavior

**Non-Goals:**

- Deliver notifications after the OpenFront tab is closed
- Change lobby matching rules or reintroduce any auto-join behavior
- Redesign the Discovery panel beyond the new control needed for this feature
- Guarantee tab focusing behavior uniformly across all browsers or userscript
  managers

## Decisions

### Decision: Use The Native Notification API Only

Use the standard browser `Notification` API as the only desktop notification
backend.

This keeps the feature aligned with the permission flow users already see in the
browser, avoids userscript-manager-specific behavior differences, and matches
the environment where the feature is confirmed to work.

Alternative considered: `GM_notification` fallback support. Rejected because it
proved unreliable in the target Arc Browser environment and would make the
desktop notification path harder to reason about.

### Decision: Request Permission From The Toggle Interaction

Add a dedicated Discovery toggle for browser notifications and request
permission only when the user enables it.

This avoids surprise permission prompts during boot, keeps the feature opt-in,
and matches browser restrictions that require permission requests from a user
gesture. If permission is denied, the toggle remains off.

Alternative considered: request permission automatically on userscript startup.
Rejected because it is intrusive and unreliable.

### Decision: Gate Notifications To Background Usage

Emit browser notifications only when OpenFront is not visible or not focused.

This avoids redundant desktop notifications while the user is already looking at
the Discovery UI. Sound and in-page pulse behavior continue to follow their own
existing rules.

Alternative considered: always show a browser notification for every new match.
Rejected because it adds unnecessary noise during active use.

### Decision: Reuse Existing Deduplication And Match Detection

Hook the notification backend into the existing `hasNewMatch` /
`notificationKey` flow in `LobbyDiscoveryUI.processLobbies()`.

This preserves the current meaning of "new match" and avoids inventing a second
dedupe system for desktop notifications. A given matching lobby should create at
most one browser notification until the dedupe key changes or the match clears.

Alternative considered: separate desktop-notification dedupe state. Rejected as
unnecessary complexity.

### Decision: Persist A Separate Desktop Notification Flag

Extend `LobbyDiscoverySettings` with a dedicated
`desktopNotificationsEnabled` boolean stored in the existing Discovery settings
object.

This keeps migration simple, preserves the storage key, and avoids conflating
desktop notifications with sound. The new flag defaults to `false` for existing
and new users until explicitly enabled.

Alternative considered: couple desktop notifications to `soundEnabled`.
Rejected because the user intent is to allow silent background discovery.

### Decision: Treat Notification Click As Best-Effort Focus

On notification click, attempt to bring the OpenFront tab to the foreground via
`window.focus()` or equivalent manager callback support, but do not guarantee
focus semantics beyond that attempt.

This gives users a useful shortcut without overspecifying behavior that varies
by browser and userscript manager.

Alternative considered: do nothing on click. Rejected because the notification
is more valuable when it can return the user to the game quickly.

## Risks / Trade-offs

- Permission UX can fail or be denied -> Keep the toggle off when permission is
  unavailable and avoid repeated prompts from background logic.
- Browser focus behavior is inconsistent -> Specify and implement best-effort
  focus only; do not rely on it for core functionality.
- Browser notification rendering differs by browser and OS -> Keep the feature
  on the standard `Notification` API and avoid manager-specific fallbacks.
- Added UI surface can clutter the panel -> Reuse the existing compact status
  toggle area and avoid broader layout changes.

## Migration Plan

1. Create the new change artifacts and spec delta.
2. Extend the Discovery settings type with the new persisted boolean defaulting
   to `false`.
3. Add the notification utility for native browser delivery.
4. Wire the UI toggle and permission request flow.
5. Trigger browser notifications from the existing new-match detection path.
6. Add tests for permission handling, background gating, deduplication,
   persistence, and click handling.

Rollback is straightforward: remove the new setting and notification path while
preserving the existing sound and in-page Discovery feedback.

## Open Questions

- None for this change. The user-facing behavior, scope, and defaults are fixed
  by this design.
