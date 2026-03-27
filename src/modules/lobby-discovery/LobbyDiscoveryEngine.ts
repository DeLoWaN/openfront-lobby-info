/**
 * LobbyDiscoveryEngine - core matching logic for notify-only discovery.
 */

import type { Lobby } from '@/types/game';
import type {
  DiscoveryCriteria,
  ModifierFilters,
  NumericModifierState,
} from './LobbyDiscoveryTypes';
import {
  getLobbyCapacity,
  getLobbyGameMode,
  getLobbyModifierValue,
  getLobbyTeamConfig,
  getPlayersPerTeam,
} from './LobbyDiscoveryHelpers';

interface MatchOptions {
  isTeamTwoTimesMinEnabled?: boolean;
}

const BOOLEAN_MODIFIER_KEYS: Array<keyof ModifierFilters> = [
  'isCompact',
  'isRandomSpawn',
  'isCrowded',
  'isHardNations',
  'isAlliancesDisabled',
  'isPortsDisabled',
  'isNukesDisabled',
  'isSAMsDisabled',
  'isPeaceTime',
];

export class LobbyDiscoveryEngine {
  matchesCriteria(
    lobby: Lobby,
    criteriaList: DiscoveryCriteria[],
    options: MatchOptions = {}
  ): boolean {
    if (!lobby || !lobby.gameConfig || !criteriaList || criteriaList.length === 0) {
      return false;
    }

    const gameMode = getLobbyGameMode(lobby);
    const lobbyCapacity = getLobbyCapacity(lobby);
    if (!gameMode || lobbyCapacity === null) {
      return false;
    }

    const lobbyTeamConfig = getLobbyTeamConfig(lobby);
    const teamComparisonCapacity =
      gameMode === 'Team'
        ? getPlayersPerTeam(lobbyTeamConfig, lobbyCapacity)
        : null;

    for (const criteria of criteriaList) {
      if (criteria.gameMode !== gameMode) {
        continue;
      }

      if (gameMode === 'Team') {
        if (
          criteria.teamCount !== null &&
          criteria.teamCount !== undefined &&
          criteria.teamCount !== lobbyTeamConfig
        ) {
          continue;
        }

        if (
          options.isTeamTwoTimesMinEnabled &&
          criteria.minPlayers !== null &&
          lobbyTeamConfig !== 'Humans Vs Nations' &&
          lobbyCapacity < criteria.minPlayers * 2
        ) {
          continue;
        }

        if (teamComparisonCapacity === null) {
          continue;
        }
      }

      const capacityToCompare = gameMode === 'Team' ? teamComparisonCapacity : lobbyCapacity;
      if (capacityToCompare === null) {
        continue;
      }

      if (criteria.minPlayers !== null && capacityToCompare < criteria.minPlayers) {
        continue;
      }
      if (criteria.maxPlayers !== null && capacityToCompare > criteria.maxPlayers) {
        continue;
      }

      if (!this.matchesModifiers(lobby, criteria.modifiers)) {
        continue;
      }

      return true;
    }

    return false;
  }

  private matchesModifiers(
    lobby: Lobby,
    filters: ModifierFilters | undefined
  ): boolean {
    if (!filters) {
      return true;
    }

    for (const key of BOOLEAN_MODIFIER_KEYS) {
      const state = filters[key];
      if (!state || state === 'allowed') {
        continue;
      }

      const actual = Boolean(getLobbyModifierValue(lobby, key));
      if (state === 'blocked' && actual) {
        return false;
      }
    }

    if (!this.matchesNumericModifier(getLobbyModifierValue(lobby, 'startingGold'), filters.startingGold)) {
      return false;
    }

    if (!this.matchesNumericModifier(getLobbyModifierValue(lobby, 'goldMultiplier'), filters.goldMultiplier)) {
      return false;
    }

    return true;
  }

  private matchesNumericModifier(
    actualValue: boolean | number | undefined,
    states: NumericModifierState | undefined
  ): boolean {
    if (!states) {
      return true;
    }

    const numericActual =
      typeof actualValue === 'number' && Number.isFinite(actualValue)
        ? actualValue
        : null;

    const entries = Object.entries(states);
    if (entries.length === 0) {
      return true;
    }

    const blockedValues = entries
      .filter(([, state]) => state === 'blocked')
      .map(([value]) => Number(value));

    if (numericActual !== null && blockedValues.includes(numericActual)) {
      return false;
    }

    return true;
  }
}
