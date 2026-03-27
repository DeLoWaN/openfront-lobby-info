/**
 * Helper functions for the lobby discovery module.
 * Pure functions with no side effects.
 */

import type { Lobby } from '@/types/game';
import type {
  DiscoveryCriteria,
  DiscoveryGameMode,
  LegacyAutoJoinSettings,
  LobbyDiscoverySettings,
  ModifierFilters,
  ModifierFilterState,
  NumericModifierState,
  QueueSource,
  TeamCount,
} from './LobbyDiscoveryTypes';

const DEFAULT_MODIFIER_FILTER_STATE: ModifierFilterState = 'allowed';

export function normalizeGameMode(
  mode: string | null | undefined
): DiscoveryGameMode | null {
  if (!mode) return null;

  const lower = mode.toLowerCase().trim();
  if (
    lower === 'free for all' ||
    lower === 'ffa' ||
    lower === 'free-for-all'
  ) {
    return 'FFA';
  }
  if (lower === 'team' || lower === 'teams') {
    return 'Team';
  }
  return null;
}

export function getLobbyGameMode(lobby: Lobby): DiscoveryGameMode | null {
  return normalizeGameMode(lobby.gameConfig?.gameMode);
}

export function getLobbyQueueSource(lobby: Lobby): QueueSource | null {
  const source = lobby.publicGameType?.toLowerCase().trim();
  if (source === 'ffa' || source === 'team' || source === 'special') {
    return source;
  }
  return null;
}

export function parseTeamCount(
  value: string | number | null | undefined
): TeamCount | null {
  if (
    value === 'Duos' ||
    value === 'Trios' ||
    value === 'Quads' ||
    value === 'Humans Vs Nations'
  ) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export function getLobbyTeamConfig(lobby: Lobby): TeamCount | null {
  const config = lobby.gameConfig;
  if (!config || getLobbyGameMode(lobby) !== 'Team') return null;

  const playerTeams = parseTeamCount(config.playerTeams ?? null);
  if (playerTeams !== null) {
    return playerTeams;
  }

  return parseTeamCount(config.teamCount ?? config.teams ?? null);
}

export function getLobbyCapacity(lobby: Lobby): number | null {
  const config = lobby.gameConfig;
  if (!config) return null;

  return (
    config.maxPlayers ??
    config.maxClients ??
    config.maxPlayersPerGame ??
    lobby.maxClients ??
    null
  );
}

export function getLobbyCurrentPlayers(lobby: Lobby): number | null {
  if (typeof lobby.numClients === 'number') {
    return lobby.numClients;
  }
  return null;
}

export function getPlayersPerTeam(
  playerTeams: TeamCount | null | undefined,
  gameCapacity: number | null
): number | null {
  if (!playerTeams || !gameCapacity) return null;

  if (playerTeams === 'Duos') return 2;
  if (playerTeams === 'Trios') return 3;
  if (playerTeams === 'Quads') return 4;
  if (playerTeams === 'Humans Vs Nations') return gameCapacity;

  if (typeof playerTeams === 'number' && playerTeams > 0) {
    return Math.floor(gameCapacity / playerTeams);
  }

  return null;
}

export function getLobbyModifiers(lobby: Lobby): Record<string, unknown> {
  return lobby.gameConfig?.publicGameModifiers
    ? { ...lobby.gameConfig.publicGameModifiers }
    : {};
}

export function getLobbyModifierValue(
  lobby: Lobby,
  key: keyof ModifierFilters
): boolean | number | undefined {
  const modifiers = lobby.gameConfig?.publicGameModifiers;
  if (!modifiers) return undefined;

  switch (key) {
    case 'isCompact':
      return modifiers.isCompact;
    case 'isRandomSpawn':
      return modifiers.isRandomSpawn;
    case 'isCrowded':
      return modifiers.isCrowded;
    case 'isHardNations':
      return modifiers.isHardNations;
    case 'isAlliancesDisabled':
      return modifiers.isAlliancesDisabled;
    case 'isPortsDisabled':
      return modifiers.isPortsDisabled;
    case 'isNukesDisabled':
      return modifiers.isNukesDisabled;
    case 'isSAMsDisabled':
      return modifiers.isSAMsDisabled;
    case 'isPeaceTime':
      return modifiers.isPeaceTime;
    case 'startingGold':
      return modifiers.startingGold;
    case 'goldMultiplier':
      return modifiers.goldMultiplier;
    default:
      return undefined;
  }
}

export function getGameDetailsText(lobby: Lobby): string {
  const gameMode = getLobbyGameMode(lobby);
  const teamConfig = getLobbyTeamConfig(lobby);
  const capacity = getLobbyCapacity(lobby);

  if (gameMode === 'FFA') {
    return capacity !== null ? `FFA • ${capacity} slots` : 'FFA';
  }

  if (gameMode !== 'Team') {
    return 'Unsupported mode';
  }

  if (teamConfig === 'Humans Vs Nations') {
    return capacity !== null ? `Humans Vs Nations (${capacity})` : 'Humans Vs Nations';
  }

  if (teamConfig === 'Duos') return 'Duos';
  if (teamConfig === 'Trios') return 'Trios';
  if (teamConfig === 'Quads') return 'Quads';

  if (typeof teamConfig === 'number' && capacity !== null) {
    const playersPerTeam = getPlayersPerTeam(teamConfig, capacity);
    return playersPerTeam !== null
      ? `${teamConfig} teams (${playersPerTeam} per team)`
      : `${teamConfig} teams`;
  }

  return 'Team';
}

export interface BrowserNotificationContent {
  title: string;
  body: string;
}

function getLobbyModeLabel(lobby: Lobby): string {
  const gameMode = getLobbyGameMode(lobby);
  const teamConfig = getLobbyTeamConfig(lobby);

  if (gameMode === 'FFA') {
    return 'FFA';
  }

  if (gameMode !== 'Team') {
    return 'Unsupported mode';
  }

  if (teamConfig === 'Humans Vs Nations') {
    return 'Humans Vs Nations';
  }

  if (teamConfig === 'Duos' || teamConfig === 'Trios' || teamConfig === 'Quads') {
    return teamConfig;
  }

  if (typeof teamConfig === 'number') {
    return `${teamConfig} teams`;
  }

  return 'Team';
}

function formatStartingGold(value: number): string {
  if (value >= 1_000_000 && value % 1_000_000 === 0) {
    return `${value / 1_000_000}M`;
  }

  if (value >= 1_000 && value % 1_000 === 0) {
    return `${value / 1_000}K`;
  }

  return String(value);
}

export function getActiveModifierLabels(lobby: Lobby): string[] {
  const modifiers = lobby.gameConfig?.publicGameModifiers;
  if (!modifiers) {
    return [];
  }

  const labels: string[] = [];

  if (modifiers.isCompact) labels.push('Compact');
  if (modifiers.isRandomSpawn) labels.push('Random');
  if (modifiers.isCrowded) labels.push('Crowded');
  if (modifiers.isHardNations) labels.push('Hard');
  if (typeof modifiers.startingGold === 'number') {
    labels.push(formatStartingGold(modifiers.startingGold));
  }
  if (typeof modifiers.goldMultiplier === 'number') {
    labels.push(`x${modifiers.goldMultiplier}`);
  }
  if (modifiers.isAlliancesDisabled) labels.push('No Alliances');
  if (modifiers.isPortsDisabled) labels.push('No Ports');
  if (modifiers.isNukesDisabled) labels.push('No Nukes');
  if (modifiers.isSAMsDisabled) labels.push('No SAMs');
  if (modifiers.isPeaceTime) labels.push('Peace');

  return labels;
}

export function getBrowserNotificationContent(lobby: Lobby): BrowserNotificationContent {
  const titleParts: string[] = [];
  const mapName = lobby.gameConfig?.gameMap?.trim();
  const capacity = getLobbyCapacity(lobby);
  const teamConfig = getLobbyTeamConfig(lobby);
  const modeLabel = getLobbyModeLabel(lobby);

  if (mapName) {
    titleParts.push(mapName);
  }

  if (getLobbyGameMode(lobby) === 'Team' && teamConfig !== 'Humans Vs Nations') {
    titleParts.push(modeLabel);
    const playersPerTeam = getPlayersPerTeam(teamConfig, capacity);
    if (playersPerTeam !== null) {
      titleParts.push(`${playersPerTeam}/team`);
    }
  } else {
    titleParts.push(modeLabel);
  }

  const bodyParts: string[] = [];
  if (capacity !== null) {
    bodyParts.push(`${capacity} slots`);
  }

  const activeModifiers = getActiveModifierLabels(lobby);
  if (activeModifiers.length > 0) {
    bodyParts.push(activeModifiers.join(', '));
  }

  return {
    title: titleParts.join(' • '),
    body: bodyParts.join(' • '),
  };
}

function sanitizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sanitizeModifierFilterState(value: unknown): ModifierFilterState {
  if (value === 'blocked' || value === 'rejected') {
    return 'blocked';
  }

  if (value === 'allowed' || value === 'required' || value === 'indifferent') {
    return 'allowed';
  }

  return DEFAULT_MODIFIER_FILTER_STATE;
}

function sanitizeNumericModifierState(value: unknown): NumericModifierState | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const sanitized: NumericModifierState = {};
  for (const [key, triState] of Object.entries(value as Record<string, unknown>)) {
    const numericKey = Number(key);
    if (Number.isFinite(numericKey)) {
      sanitized[numericKey] = sanitizeModifierFilterState(triState);
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function sanitizeModifierFilters(value: unknown): ModifierFilters | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const sanitized: ModifierFilters = {
    isCompact: sanitizeModifierFilterState(candidate.isCompact),
    isRandomSpawn: sanitizeModifierFilterState(candidate.isRandomSpawn),
    isCrowded: sanitizeModifierFilterState(candidate.isCrowded),
    isHardNations: sanitizeModifierFilterState(candidate.isHardNations),
    isAlliancesDisabled: sanitizeModifierFilterState(candidate.isAlliancesDisabled),
    isPortsDisabled: sanitizeModifierFilterState(candidate.isPortsDisabled),
    isNukesDisabled: sanitizeModifierFilterState(candidate.isNukesDisabled),
    isSAMsDisabled: sanitizeModifierFilterState(candidate.isSAMsDisabled),
    isPeaceTime: sanitizeModifierFilterState(candidate.isPeaceTime),
    startingGold: sanitizeNumericModifierState(candidate.startingGold),
    goldMultiplier: sanitizeNumericModifierState(candidate.goldMultiplier),
  };

  return sanitized;
}

export function sanitizeCriteria(criteria: unknown): DiscoveryCriteria[] {
  if (!Array.isArray(criteria)) {
    return [];
  }

  const sanitized: DiscoveryCriteria[] = [];

  for (const entry of criteria) {
    const candidate = entry as {
      gameMode?: string | null;
      teamCount?: string | number | null;
      minPlayers?: number | null;
      maxPlayers?: number | null;
      modifiers?: ModifierFilters | null;
    };

    const gameMode = normalizeGameMode(candidate.gameMode ?? null);
    if (!gameMode) {
      continue;
    }

    sanitized.push({
      gameMode,
      teamCount: gameMode === 'Team' ? parseTeamCount(candidate.teamCount ?? null) : null,
      minPlayers: sanitizeNumber(candidate.minPlayers),
      maxPlayers: sanitizeNumber(candidate.maxPlayers),
      modifiers: sanitizeModifierFilters(candidate.modifiers),
    });
  }

  return sanitized;
}

export function migrateLegacySettings(
  legacy: LegacyAutoJoinSettings | null | undefined,
  current: LobbyDiscoverySettings | null | undefined
): LobbyDiscoverySettings {
  if (current) {
    return {
      criteria: sanitizeCriteria(current.criteria),
      discoveryEnabled:
        typeof current.discoveryEnabled === 'boolean' ? current.discoveryEnabled : true,
      soundEnabled: typeof current.soundEnabled === 'boolean' ? current.soundEnabled : true,
      desktopNotificationsEnabled:
        typeof current.desktopNotificationsEnabled === 'boolean'
          ? current.desktopNotificationsEnabled
          : false,
      isTeamTwoTimesMinEnabled:
        typeof current.isTeamTwoTimesMinEnabled === 'boolean'
          ? current.isTeamTwoTimesMinEnabled
          : !!current.isTeamThreeTimesMinEnabled,
    };
  }

  return {
    criteria: sanitizeCriteria(legacy?.criteria),
    discoveryEnabled:
      typeof legacy?.autoJoinEnabled === 'boolean' ? legacy.autoJoinEnabled : true,
    soundEnabled: typeof legacy?.soundEnabled === 'boolean' ? legacy.soundEnabled : true,
    desktopNotificationsEnabled: false,
    isTeamTwoTimesMinEnabled:
      typeof legacy?.isTeamTwoTimesMinEnabled === 'boolean'
        ? legacy.isTeamTwoTimesMinEnabled
        : !!legacy?.isTeamThreeTimesMinEnabled,
  };
}
