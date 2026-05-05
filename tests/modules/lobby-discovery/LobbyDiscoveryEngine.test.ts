import { describe, it, expect } from 'vitest';
import { LobbyDiscoveryEngine } from '@/modules/lobby-discovery/LobbyDiscoveryEngine';

const engine = new LobbyDiscoveryEngine();

describe('LobbyDiscoveryEngine', () => {
  it('matches FFA by lobby capacity', () => {
    const lobby = {
      gameID: 'ffa-1',
      publicGameType: 'ffa',
      numClients: 7,
      gameConfig: {
        gameMode: 'Free For All',
        maxPlayers: 20,
      },
    } as any;

    const criteria = [{ gameMode: 'FFA', teamCount: null, minPlayers: 10, maxPlayers: 30 }] as any;

    expect(engine.matchesCriteria(lobby, criteria)).toBe(true);
  });

  it('matches valid Team criteria by players per team', () => {
    const lobby = {
      gameID: 'team-1',
      publicGameType: 'team',
      numClients: 17,
      gameConfig: {
        gameMode: 'Team',
        teamCount: 4,
        maxClients: 32,
      },
      maxClients: 32,
    } as any;

    const criteria = [{ gameMode: 'Team', teamCount: 4, minPlayers: 4, maxPlayers: 8 }] as any;

    expect(engine.matchesCriteria(lobby, criteria)).toBe(true);
  });

  it('matches Humans Vs Nations with human-capacity semantics', () => {
    const lobby = {
      gameID: 'hvn-1',
      publicGameType: 'special',
      numClients: 6,
      gameConfig: {
        gameMode: 'Team',
        playerTeams: 'Humans Vs Nations',
        maxClients: 40,
      },
      maxClients: 40,
    } as any;

    const criteria = [
      {
        gameMode: 'Team',
        teamCount: 'Humans Vs Nations',
        minPlayers: 30,
        maxPlayers: 50,
      },
    ] as any;

    expect(engine.matchesCriteria(lobby, criteria)).toBe(true);
  });

  it('treats special queue as source only and still applies Team rules', () => {
    const lobby = {
      gameID: 'team-2',
      publicGameType: 'special',
      gameConfig: {
        gameMode: 'Team',
        teamCount: 6,
        maxClients: 72,
      },
      maxClients: 72,
    } as any;

    const validRange = [{ gameMode: 'Team', teamCount: 6, minPlayers: 10, maxPlayers: 12 }] as any;

    expect(engine.matchesCriteria(lobby, validRange)).toBe(true);
  });

  it('applies the 2x min helper to team capacity', () => {
    const lobby = {
      gameID: 'team-3',
      publicGameType: 'team',
      gameConfig: {
        gameMode: 'Team',
        teamCount: 4,
        maxClients: 12,
      },
      maxClients: 12,
    } as any;

    const criteria = [
      { gameMode: 'Team', teamCount: 4, minPlayers: 8, maxPlayers: 16 },
    ] as any;

    expect(engine.matchesCriteria(lobby, criteria, { isTeamTwoTimesMinEnabled: true })).toBe(false);
  });

  it('does not reject Humans Vs Nations with the 2x min helper before the normal capacity check', () => {
    const lobby = {
      gameID: 'hvn-2x',
      publicGameType: 'special',
      gameConfig: {
        gameMode: 'Team',
        playerTeams: 'Humans Vs Nations',
        maxClients: 62,
      },
      maxClients: 62,
    } as any;

    const criteria = [
      { gameMode: 'Team', teamCount: 'Humans Vs Nations', minPlayers: 40, maxPlayers: 70 },
    ] as any;

    expect(engine.matchesCriteria(lobby, criteria, { isTeamTwoTimesMinEnabled: true })).toBe(true);
  });

  it('applies blocked boolean and numeric modifier filters as an exclusion list', () => {
    const lobby = {
      gameID: 'spec-2',
      publicGameType: 'special',
      gameConfig: {
        gameMode: 'Free For All',
        maxPlayers: 25,
        publicGameModifiers: {
          isCompact: true,
          startingGold: 5000000,
          goldMultiplier: 2,
        },
      },
    } as any;

    const anyCriteria = [
      {
        gameMode: 'FFA',
        teamCount: null,
        minPlayers: 20,
        maxPlayers: 30,
        modifiers: {
          isCompact: 'any',
          startingGold: { 1000000: 'any', 5000000: 'any', 25000000: 'any' },
          goldMultiplier: { 2: 'any' },
        },
      },
    ] as any;

    const blockedCriteria = [
      {
        gameMode: 'FFA',
        teamCount: null,
        minPlayers: 20,
        maxPlayers: 30,
        modifiers: {
          isCompact: 'any',
          startingGold: { 1000000: 'any', 5000000: 'blocked', 25000000: 'any' },
          goldMultiplier: { 2: 'any' },
        },
      },
    ] as any;

    const blockedBooleanCriteria = [
      {
        gameMode: 'FFA',
        teamCount: null,
        minPlayers: 20,
        maxPlayers: 30,
        modifiers: {
          isCompact: 'blocked',
          startingGold: { 5000000: 'any' },
          goldMultiplier: { 2: 'any' },
        },
      },
    ] as any;

    expect(engine.matchesCriteria(lobby, anyCriteria)).toBe(true);
    expect(engine.matchesCriteria(lobby, blockedCriteria)).toBe(false);
    expect(engine.matchesCriteria(lobby, blockedBooleanCriteria)).toBe(false);
  });

  it('matches when a required boolean modifier is present', () => {
    const lobby = {
      gameID: 'ffa-required-on',
      publicGameType: 'ffa',
      gameConfig: {
        gameMode: 'Free For All',
        maxPlayers: 25,
        publicGameModifiers: { isCompact: true },
      },
    } as any;

    const criteria = [
      {
        gameMode: 'FFA',
        teamCount: null,
        minPlayers: 20,
        maxPlayers: 30,
        modifiers: { isCompact: 'required' },
      },
    ] as any;

    expect(engine.matchesCriteria(lobby, criteria)).toBe(true);
  });

  it('rejects when a required boolean modifier is absent', () => {
    const lobby = {
      gameID: 'ffa-required-off',
      publicGameType: 'ffa',
      gameConfig: {
        gameMode: 'Free For All',
        maxPlayers: 25,
        publicGameModifiers: {},
      },
    } as any;

    const criteria = [
      {
        gameMode: 'FFA',
        teamCount: null,
        minPlayers: 20,
        maxPlayers: 30,
        modifiers: { isCompact: 'required' },
      },
    ] as any;

    expect(engine.matchesCriteria(lobby, criteria)).toBe(false);
  });

  it('matches when a required numeric modifier value matches the lobby', () => {
    const lobby = {
      gameID: 'ffa-required-gold-match',
      publicGameType: 'ffa',
      gameConfig: {
        gameMode: 'Free For All',
        maxPlayers: 25,
        publicGameModifiers: { startingGold: 5000000 },
      },
    } as any;

    const criteria = [
      {
        gameMode: 'FFA',
        teamCount: null,
        minPlayers: 20,
        maxPlayers: 30,
        modifiers: {
          startingGold: { 5000000: 'required' },
        },
      },
    ] as any;

    expect(engine.matchesCriteria(lobby, criteria)).toBe(true);
  });

  it('rejects when a required numeric modifier value does not match the lobby', () => {
    const lobby = {
      gameID: 'ffa-required-gold-mismatch',
      publicGameType: 'ffa',
      gameConfig: {
        gameMode: 'Free For All',
        maxPlayers: 25,
        publicGameModifiers: { startingGold: 1000000 },
      },
    } as any;

    const criteria = [
      {
        gameMode: 'FFA',
        teamCount: null,
        minPlayers: 20,
        maxPlayers: 30,
        modifiers: {
          startingGold: { 5000000: 'required' },
        },
      },
    ] as any;

    expect(engine.matchesCriteria(lobby, criteria)).toBe(false);
  });

  it('rejects when a required numeric modifier is absent from the lobby', () => {
    const lobby = {
      gameID: 'ffa-required-gold-missing',
      publicGameType: 'ffa',
      gameConfig: {
        gameMode: 'Free For All',
        maxPlayers: 25,
        publicGameModifiers: {},
      },
    } as any;

    const criteria = [
      {
        gameMode: 'FFA',
        teamCount: null,
        minPlayers: 20,
        maxPlayers: 30,
        modifiers: {
          startingGold: { 5000000: 'required' },
        },
      },
    ] as any;

    expect(engine.matchesCriteria(lobby, criteria)).toBe(false);
  });
});
