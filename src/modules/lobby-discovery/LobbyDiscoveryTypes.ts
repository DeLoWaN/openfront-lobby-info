/**
 * Type definitions for the lobby discovery module.
 */

export type QueueSource = 'ffa' | 'team' | 'special';
export type DiscoveryGameMode = 'FFA' | 'Team';
export type TeamCount = 'Duos' | 'Trios' | 'Quads' | 'Humans Vs Nations' | number;
export type ModifierFilterState = 'allowed' | 'blocked';

export interface NumericModifierState {
  [value: number]: ModifierFilterState | undefined;
}

export interface ModifierFilters {
  isCompact?: ModifierFilterState;
  isRandomSpawn?: ModifierFilterState;
  isCrowded?: ModifierFilterState;
  isHardNations?: ModifierFilterState;
  isAlliancesDisabled?: ModifierFilterState;
  isPortsDisabled?: ModifierFilterState;
  isNukesDisabled?: ModifierFilterState;
  isSAMsDisabled?: ModifierFilterState;
  isPeaceTime?: ModifierFilterState;
  startingGold?: NumericModifierState;
  goldMultiplier?: NumericModifierState;
}

export interface DiscoveryCriteria {
  gameMode: DiscoveryGameMode;
  teamCount?: TeamCount | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  modifiers?: ModifierFilters;
}

export interface LobbyDiscoverySettings {
  criteria: DiscoveryCriteria[];
  discoveryEnabled: boolean;
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  isTeamTwoTimesMinEnabled: boolean;
  isTeamThreeTimesMinEnabled?: boolean;
}

export interface LegacyAutoJoinSettings {
  criteria?: Array<{
    gameMode?: string | null;
    teamCount?: string | number | null;
    minPlayers?: number | null;
    maxPlayers?: number | null;
    modifiers?: ModifierFilters | null;
  }>;
  autoJoinEnabled?: boolean;
  soundEnabled?: boolean;
  isTeamThreeTimesMinEnabled?: boolean;
  isTeamTwoTimesMinEnabled?: boolean;
}
