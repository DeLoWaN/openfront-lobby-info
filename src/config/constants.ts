/**
 * Application-wide configuration constants
 */

export const CONFIG = {
  threadCount: 20,
  lobbyPollingRate: 1000,
} as const;

/**
 * Storage keys for GM_getValue/GM_setValue
 * Using centralized keys prevents typos and makes refactoring easier
 */
export const STORAGE_KEYS = {
  lobbyDiscoverySettings: "OF_LOBBY_DISCOVERY_SETTINGS",
  lobbyDiscoveryPanelSize: "OF_LOBBY_DISCOVERY_PANEL_SIZE",
  playerListPanelPosition: "OF_PLAYER_LIST_PANEL_POSITION",
  playerListPanelSize: "OF_PLAYER_LIST_PANEL_SIZE",
  playerListShowOnlyClans: "OF_PLAYER_LIST_SHOW_ONLY_CLANS",
  playerListCollapseStates: "OF_PLAYER_LIST_COLLAPSE_STATES",
  playerListRecentTags: "OF_PLAYER_LIST_RECENT_TAGS",
} as const;

/**
 * Z-index layers for UI elements
 */
export const Z_INDEX = {
  panel: 9998,
  panelOverlay: 9999,
  modal: 10000,
  notification: 20000,
} as const;

/**
 * Type helper for storage keys
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
