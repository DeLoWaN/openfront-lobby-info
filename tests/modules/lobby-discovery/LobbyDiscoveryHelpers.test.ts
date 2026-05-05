import { describe, it, expect } from 'vitest';
import {
  sanitizeCriteria,
  normalizeSettings,
  getLobbyTeamConfig,
  getLobbyGameMode,
  getLobbyCapacity,
  getLobbyCurrentPlayers,
  getLobbyModifiers,
  getLobbyQueueSource,
  getGameDetailsText,
  getBrowserNotificationContent,
} from '@/modules/lobby-discovery/LobbyDiscoveryHelpers';

describe('LobbyDiscoveryHelpers', () => {
  it('sanitizes legacy criteria by keeping FFA and Team entries', () => {
    const criteria = sanitizeCriteria([
      { gameMode: 'FFA', minPlayers: 10, maxPlayers: 30 },
      { gameMode: 'HvN', minPlayers: null, maxPlayers: null },
      { gameMode: 'Team', teamCount: 'Duos', minPlayers: 8, maxPlayers: 16 },
      { gameMode: 'team', teamCount: 3, minPlayers: 9, maxPlayers: 18 },
      {
        gameMode: 'Team',
        teamCount: 'Humans Vs Nations',
        minPlayers: 12,
        maxPlayers: 40,
      },
    ]);

    expect(criteria).toEqual([
      { gameMode: 'FFA', teamCount: null, minPlayers: 10, maxPlayers: 30 },
      { gameMode: 'Team', teamCount: 'Duos', minPlayers: 8, maxPlayers: 16 },
      { gameMode: 'Team', teamCount: 3, minPlayers: 9, maxPlayers: 18 },
      {
        gameMode: 'Team',
        teamCount: 'Humans Vs Nations',
        minPlayers: 12,
        maxPlayers: 40,
      },
    ]);
  });

  it('returns defaults when no settings are persisted', () => {
    const normalized = normalizeSettings(null);

    expect(normalized).toEqual({
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      desktopNotificationsEnabled: false,
      isTeamTwoTimesMinEnabled: false,
    });
  });

  it('preserves persisted settings on load', () => {
    const normalized = normalizeSettings({
      criteria: [{ gameMode: 'FFA', teamCount: null, minPlayers: 5, maxPlayers: 25 }],
      discoveryEnabled: true,
      soundEnabled: true,
      desktopNotificationsEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    expect(normalized.desktopNotificationsEnabled).toBe(true);
    expect(normalized.criteria).toHaveLength(1);
  });

  it('upgrades the legacy isTeamThreeTimesMinEnabled flag when isTeamTwoTimesMinEnabled is absent', () => {
    const normalized = normalizeSettings({
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      desktopNotificationsEnabled: false,
      isTeamThreeTimesMinEnabled: true,
    } as any);

    expect(normalized.isTeamTwoTimesMinEnabled).toBe(true);
  });

  it('collapses legacy modifier states into the new allowed or blocked model', () => {
    const criteria = sanitizeCriteria([
      {
        gameMode: 'FFA',
        minPlayers: 10,
        maxPlayers: 30,
        modifiers: {
          isCompact: 'required',
          isCrowded: 'rejected',
          startingGold: {
            1000000: 'indifferent',
            5000000: 'required',
            25000000: 'rejected',
          },
        },
      },
    ]);

    expect(criteria).toEqual([
      {
        gameMode: 'FFA',
        teamCount: null,
        minPlayers: 10,
        maxPlayers: 30,
        modifiers: {
          isCompact: 'allowed',
          isRandomSpawn: 'allowed',
          isCrowded: 'blocked',
          isHardNations: 'allowed',
          isAlliancesDisabled: 'allowed',
          isPortsDisabled: 'allowed',
          isNukesDisabled: 'allowed',
          isSAMsDisabled: 'allowed',
          isPeaceTime: 'allowed',
          isWaterNukes: 'allowed',
          startingGold: {
            1000000: 'allowed',
            5000000: 'allowed',
            25000000: 'blocked',
          },
        },
      },
    ]);
  });

  it('detects Humans Vs Nations as a valid team config', () => {
    const config = { gameMode: 'Team', playerTeams: 'Humans Vs Nations' } as any;
    const lobby = { gameID: 'hvn', gameConfig: config } as any;

    expect(getLobbyTeamConfig(lobby)).toBe('Humans Vs Nations');
  });

  it('reads 0.30 queue source, mode, capacity, occupancy, and modifiers', () => {
    const lobby = {
      gameID: 'spec-1',
      publicGameType: 'special',
      numClients: 11,
      gameConfig: {
        gameMode: 'Free For All',
        maxPlayers: 20,
        publicGameModifiers: {
          isCompact: true,
          isRandomSpawn: true,
          isCrowded: false,
          isHardNations: true,
          startingGold: 5000000,
          goldMultiplier: 2,
          isAlliancesDisabled: true,
          isPortsDisabled: true,
          isNukesDisabled: false,
          isSAMsDisabled: true,
          isPeaceTime: true,
        },
      },
    } as any;

    expect(getLobbyQueueSource(lobby)).toBe('special');
    expect(getLobbyGameMode(lobby)).toBe('FFA');
    expect(getLobbyCapacity(lobby)).toBe(20);
    expect(getLobbyCurrentPlayers(lobby)).toBe(11);
    expect(getLobbyModifiers(lobby)).toEqual({
      isCompact: true,
      isRandomSpawn: true,
      isCrowded: false,
      isHardNations: true,
      startingGold: 5000000,
      goldMultiplier: 2,
      isAlliancesDisabled: true,
      isPortsDisabled: true,
      isNukesDisabled: false,
      isSAMsDisabled: true,
      isPeaceTime: true,
    });
  });

  it('formats FFA details with explicit capacity wording', () => {
    const lobby = {
      gameID: 'ffa-text',
      publicGameType: 'ffa',
      gameConfig: {
        gameMode: 'Free For All',
        maxPlayers: 25,
      },
    } as any;

    expect(getGameDetailsText(lobby)).toBe('FFA • 25 slots');
  });

  it('builds compact browser notification content for team lobbies with map and modifiers', () => {
    const lobby = {
      gameID: 'team-notif',
      publicGameType: 'team',
      gameConfig: {
        gameMode: 'Team',
        playerTeams: 4,
        maxPlayers: 32,
        gameMap: 'Europe',
        publicGameModifiers: {
          isCompact: true,
          isRandomSpawn: true,
          startingGold: 5000000,
          goldMultiplier: 2,
          isAlliancesDisabled: true,
        },
      },
    } as any;

    expect(getBrowserNotificationContent(lobby)).toEqual({
      title: 'Europe • 4 teams • 8/team',
      body: '32 slots • Compact, Random, 5M, x2, No Alliances',
    });
  });

  it('builds compact browser notification content for ffa lobbies', () => {
    const lobby = {
      gameID: 'ffa-notif',
      publicGameType: 'ffa',
      gameConfig: {
        gameMode: 'Free For All',
        maxPlayers: 25,
        gameMap: 'Black Sea',
        publicGameModifiers: {
          isCrowded: true,
          isPortsDisabled: true,
        },
      },
    } as any;

    expect(getBrowserNotificationContent(lobby)).toEqual({
      title: 'Black Sea • FFA',
      body: '25 slots • Crowded, No Ports',
    });
  });
});
