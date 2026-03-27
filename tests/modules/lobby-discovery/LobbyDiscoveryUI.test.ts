import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LobbyDiscoveryUI } from '@/modules/lobby-discovery/LobbyDiscoveryUI';
import { STORAGE_KEYS } from '@/config/constants';
import { SoundUtils } from '@/utils/SoundUtils';

vi.mock('@/utils/LobbyUtils', () => ({
  LobbyUtils: {
    isOnLobbyPage: vi.fn(() => true),
  },
}));

vi.mock('@/utils/URLObserver', () => ({
  URLObserver: {
    subscribe: vi.fn(),
  },
}));

vi.mock('@/utils/SoundUtils', () => ({
  SoundUtils: {
    playGameFoundSound: vi.fn(),
    preloadSounds: vi.fn(),
  },
}));

describe('LobbyDiscoveryUI', () => {
  let store: Map<string, any>;
  let ui: LobbyDiscoveryUI | null;

  function mountHomepageCards(joined = false): void {
    document.body.innerHTML = `
      <div id="page-play">
        <game-mode-selector>
          <div class="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
            <div class="hidden sm:block">
              <button id="ffa-card" class="queue-card">FFA</button>
            </div>
            <div class="hidden sm:flex sm:flex-col sm:gap-4">
              <div class="flex-1 min-h-0">
                <button id="special-card" class="queue-card">Special</button>
              </div>
              <div class="flex-1 min-h-0">
                <button id="team-card" class="queue-card">Team</button>
              </div>
            </div>
          </div>
        </game-mode-selector>
      </div>
      <join-lobby-modal></join-lobby-modal>
      <host-lobby-modal></host-lobby-modal>
    `;

    const joinLobbyModal = document.querySelector('join-lobby-modal') as any;
    joinLobbyModal.currentLobbyId = joined ? 'joined-lobby' : '';
  }

  beforeEach(() => {
    vi.useFakeTimers();
    store = new Map();
    ui = null;

    (globalThis as any).GM_getValue = vi.fn((key: string, defaultValue?: unknown) => {
      return store.has(key) ? store.get(key) : defaultValue;
    });
    (globalThis as any).GM_setValue = vi.fn((key: string, value: unknown) => {
      store.set(key, value);
    });

    mountHomepageCards();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (ui) {
      ui.cleanup();
      ui = null;
    }
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('keeps matching cards in one animated active state and deduplicates sound across repeated updates', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [
        { gameMode: 'FFA', teamCount: null, minPlayers: null, maxPlayers: null },
        { gameMode: 'Team', teamCount: null, minPlayers: null, maxPlayers: null },
      ],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const lobbies = [
      {
        gameID: 'ffa-101',
        publicGameType: 'ffa',
        gameConfig: {
          gameMode: 'Free For All',
          maxPlayers: 25,
        },
      },
      {
        gameID: 'team-101',
        publicGameType: 'team',
        gameConfig: {
          gameMode: 'Team',
          teamCount: 2,
          maxClients: 10,
        },
      },
    ] as any;

    ui.receiveLobbyUpdate(lobbies);

    expect(document.querySelectorAll('.game-found-notification')).toHaveLength(0);
    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(true);
    expect(document.getElementById('team-card')?.classList.contains('of-discovery-card-active')).toBe(true);
    expect(document.getElementById('special-card')?.classList.contains('of-discovery-card-active')).toBe(false);
    expect(document.querySelectorAll('.of-discovery-card-badge')).toHaveLength(0);
    expect(SoundUtils.playGameFoundSound).toHaveBeenCalledTimes(1);

    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(
      true
    );
    expect(document.getElementById('team-card')?.classList.contains('of-discovery-card-active')).toBe(
      true
    );

    ui.receiveLobbyUpdate(lobbies);

    expect(SoundUtils.playGameFoundSound).toHaveBeenCalledTimes(1);
  });

  it('suppresses pulse and sound completely while already joined in a public lobby', () => {
    mountHomepageCards(true);
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [{ gameMode: 'Team', teamCount: null, minPlayers: null, maxPlayers: null }],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const lobbies = [
      {
        gameID: 'team-202',
        publicGameType: 'team',
        gameConfig: {
          gameMode: 'Team',
          teamCount: 3,
          maxClients: 12,
        },
      },
    ] as any;

    ui.receiveLobbyUpdate(lobbies);

    expect(document.querySelectorAll('.game-found-notification')).toHaveLength(0);
    expect(document.querySelector('.of-discovery-card-active')).toBeFalsy();
    expect(SoundUtils.playGameFoundSound).not.toHaveBeenCalled();
  });

  it('resumes pulsing once the joined public lobby state is cleared', () => {
    mountHomepageCards(true);
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [{ gameMode: 'FFA', teamCount: null, minPlayers: null, maxPlayers: null }],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const lobbies = [
      {
        gameID: 'ffa-303',
        publicGameType: 'ffa',
        gameConfig: {
          gameMode: 'Free For All',
          maxPlayers: 25,
        },
      },
    ] as any;

    ui.receiveLobbyUpdate(lobbies);
    expect(document.querySelector('.of-discovery-card-active')).toBeFalsy();

    const joinLobbyModal = document.querySelector('join-lobby-modal') as any;
    joinLobbyModal.currentLobbyId = '';

    ui.receiveLobbyUpdate(lobbies);

    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(
      true
    );
    expect(SoundUtils.playGameFoundSound).toHaveBeenCalledTimes(1);
  });

  it('reapplies pulses after homepage cards render after the lobby update event', () => {
    document.body.innerHTML = `
      <div id="page-play">
        <game-mode-selector></game-mode-selector>
      </div>
      <join-lobby-modal></join-lobby-modal>
      <host-lobby-modal></host-lobby-modal>
    `;
    const joinLobbyModal = document.querySelector('join-lobby-modal') as any;
    joinLobbyModal.currentLobbyId = '';

    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [{ gameMode: 'FFA', teamCount: null, minPlayers: null, maxPlayers: null }],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const lobbies = [
      {
        gameID: 'ffa-late',
        publicGameType: 'ffa',
        gameConfig: {
          gameMode: 'Free For All',
          maxPlayers: 25,
        },
      },
    ] as any;

    ui.receiveLobbyUpdate(lobbies);
    expect(document.querySelector('.of-discovery-card-active')).toBeFalsy();

    const selector = document.querySelector('game-mode-selector') as HTMLElement;
    selector.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
        <div class="hidden sm:block">
          <button id="ffa-card" class="queue-card">FFA</button>
        </div>
        <div class="hidden sm:flex sm:flex-col sm:gap-4">
          <div class="flex-1 min-h-0">
            <button id="special-card" class="queue-card">Special</button>
          </div>
          <div class="flex-1 min-h-0">
            <button id="team-card" class="queue-card">Team</button>
          </div>
        </div>
      </div>
    `;

    vi.advanceTimersByTime(32);

    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(
      true
    );
  });

  it('pulses on the real 0.30 homepage structure without requiring a public-lobby element', () => {
    mountHomepageCards(false);
    document.querySelector('public-lobby')?.remove();
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [{ gameMode: 'FFA', teamCount: null, minPlayers: null, maxPlayers: null }],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    ui.receiveLobbyUpdate([
      {
        gameID: 'ffa-real-homepage',
        publicGameType: 'ffa',
        numClients: 12,
        gameConfig: {
          gameMode: 'Free For All',
          maxPlayers: 25,
        },
      },
    ] as any);

    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(
      true
    );
  });

  it('removes the animated active state when a queue stops matching', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [{ gameMode: 'FFA', teamCount: null, minPlayers: null, maxPlayers: null }],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const matchingLobbies = [
      {
        gameID: 'ffa-404',
        publicGameType: 'ffa',
        gameConfig: {
          gameMode: 'Free For All',
          maxPlayers: 25,
        },
      },
    ] as any;

    ui.receiveLobbyUpdate(matchingLobbies);
    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(
      true
    );

    ui.receiveLobbyUpdate([]);

    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(
      false
    );
  });

  it('supports FFA capacity filters up to 125 slots', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const maxSlider = document.getElementById('discovery-ffa-max-slider') as HTMLInputElement;
    const maxInput = document.getElementById('discovery-ffa-max') as HTMLInputElement;

    expect(maxSlider.max).toBe('125');
    expect(maxInput.max).toBe('125');
  });

  it('caps Team capacity filters to 62 players per team', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const maxSlider = document.getElementById('discovery-team-max-slider') as HTMLInputElement;
    const maxInput = document.getElementById('discovery-team-max') as HTMLInputElement;

    expect(maxSlider.max).toBe('62');
    expect(maxInput.max).toBe('62');
  });

  it('renders without the old player-list discovery slot and exposes FFA and 2x controls', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    expect(document.getElementById('openfront-discovery-panel')).toBeTruthy();
    expect(document.getElementById('discovery-ffa')).toBeTruthy();
    expect(document.getElementById('discovery-team-hvn')).toBeTruthy();
    expect(document.getElementById('discovery-team-two-times')).toBeTruthy();
    expect(document.getElementById('discovery-modes-rail')).toBeFalsy();
  });

  it('uses a compact desktop panel, persists width, and restores it on init', () => {
    store.set(STORAGE_KEYS.lobbyDiscoveryPanelSize, { width: 740 });
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const panel = document.getElementById('openfront-discovery-panel') as HTMLDivElement;
    expect(panel.style.width).toBe('740px');
    expect(panel.querySelector('.of-resize-handle')).toBeTruthy();
  });

  it('renders binary modifier button controls instead of radios and updates on click', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const control = document.getElementById('modifier-isCompact') as HTMLDivElement;
    const allowed = document.getElementById(
      'modifier-isCompact-allowed'
    ) as HTMLButtonElement;
    const blocked = document.getElementById(
      'modifier-isCompact-blocked'
    ) as HTMLButtonElement;

    expect(control).toBeTruthy();
    expect(document.querySelector('select.discovery-modifier-select')).toBeFalsy();
    expect(document.querySelector('.discovery-tristate-knob')).toBeFalsy();
    expect(document.querySelector('#modifier-isCompact input[type="radio"]')).toBeFalsy();
    expect(allowed.tagName).toBe('BUTTON');
    expect(blocked.tagName).toBe('BUTTON');
    expect(control.dataset.state).toBe('allowed');
    expect(allowed.getAttribute('aria-pressed')).toBe('true');
    expect(blocked.getAttribute('aria-pressed')).toBe('false');

    blocked.click();
    expect(control.dataset.state).toBe('blocked');
    expect(blocked.getAttribute('aria-pressed')).toBe('true');
    expect(allowed.getAttribute('aria-pressed')).toBe('false');

    allowed.click();
    expect(control.dataset.state).toBe('allowed');
    expect(allowed.getAttribute('aria-pressed')).toBe('true');
    expect(blocked.getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps all filter sections visible and lets the body scroll when constrained', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const body = document.querySelector('.discovery-body') as HTMLDivElement;
    const content = document.querySelector('.discovery-content') as HTMLDivElement;
    const ffa = document.getElementById('discovery-ffa-config') as HTMLDivElement;
    const team = document.getElementById('discovery-team-config') as HTMLDivElement;
    const modifiers = document.querySelector('.discovery-modifier-grid') as HTMLDivElement;

    expect(body).toBeTruthy();
    expect(content).toBeTruthy();
    expect(ffa.style.display).not.toBe('none');
    expect(team.style.display).not.toBe('none');
    expect(modifiers).toBeTruthy();
    expect(getComputedStyle(content).overflowY).toBe('auto');
  });

  it('uses a smaller default width when no saved size exists', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const panel = document.getElementById('openfront-discovery-panel') as HTMLDivElement;
    expect(panel.style.width).toBe('560px');
  });
});
