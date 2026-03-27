import { describe, it, expect } from 'vitest';
import {
  sanitizeCriteria,
  migrateLegacySettings,
  getLobbyTeamConfig,
  getLobbyGameMode,
  getLobbyCapacity,
  getLobbyCurrentPlayers,
  getLobbyModifiers,
  getLobbyQueueSource,
  getGameDetailsText,
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

  it('migrates legacy settings to notify-only discovery settings', () => {
    const migrated = migrateLegacySettings(
      {
        autoJoinEnabled: false,
        soundEnabled: false,
        isTeamThreeTimesMinEnabled: true,
        criteria: [
          { gameMode: 'FFA', minPlayers: 10, maxPlayers: 30 },
          { gameMode: 'Team', teamCount: 'Quads', minPlayers: 2, maxPlayers: 4 },
        ],
      },
      null
    );

    expect(migrated).toEqual({
      criteria: [
        { gameMode: 'FFA', teamCount: null, minPlayers: 10, maxPlayers: 30 },
        { gameMode: 'Team', teamCount: 'Quads', minPlayers: 2, maxPlayers: 4 },
      ],
      discoveryEnabled: false,
      soundEnabled: false,
      isTeamTwoTimesMinEnabled: true,
    });
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
});
