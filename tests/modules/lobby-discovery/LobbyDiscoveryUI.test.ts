import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LobbyDiscoveryUI } from '@/modules/lobby-discovery/LobbyDiscoveryUI';
import { STORAGE_KEYS } from '@/config/constants';
import { SoundUtils } from '@/utils/SoundUtils';
import { BrowserNotificationUtils } from '@/utils/BrowserNotificationUtils';

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

vi.mock('@/utils/BrowserNotificationUtils', () => ({
  BrowserNotificationUtils: {
    isSupported: vi.fn(() => true),
    isBackgrounded: vi.fn(() => true),
    ensurePermission: vi.fn(async () => true),
    show: vi.fn(() => true),
    focusWindow: vi.fn(),
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
    vi.mocked(BrowserNotificationUtils.isSupported).mockReturnValue(true);
    vi.mocked(BrowserNotificationUtils.isBackgrounded).mockReturnValue(true);
    vi.mocked(BrowserNotificationUtils.ensurePermission).mockResolvedValue(true);
    vi.mocked(BrowserNotificationUtils.show).mockReturnValue(true);
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

    expect(maxSlider.max).toBe('1000');
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

    expect(maxSlider.max).toBe('1000');
    expect(maxInput.max).toBe('62');
  });

  it('locks team max slider to 2x min and disables it when the 2x toggle is enabled', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    // Use number inputs (change events) to set min=8, max=20 since slider
    // positions are now 0..1000 and RangeSlider owns that mapping.
    const minInput = document.getElementById('discovery-team-min') as HTMLInputElement;
    const maxInput = document.getElementById('discovery-team-max') as HTMLInputElement;
    const maxSlider = document.getElementById('discovery-team-max-slider') as HTMLInputElement;
    const twoTimesCheckbox = document.getElementById('discovery-team-two-times') as HTMLInputElement;

    minInput.value = '8';
    minInput.dispatchEvent(new Event('change'));
    maxInput.value = '20';
    maxInput.dispatchEvent(new Event('change'));

    twoTimesCheckbox.checked = true;
    twoTimesCheckbox.dispatchEvent(new Event('change'));

    // 2×8 = 16. valueToPosition(16, stops) = 720 (between stop 15@idx7 and 20@idx8).
    expect(maxInput.value).toBe('16');
    expect(maxSlider.value).toBe('720');
    expect(maxSlider.disabled).toBe(true);
    expect(maxSlider.classList.contains('is-max-locked')).toBe(true);
  });

  it('keeps the locked max value when the 2x toggle is turned off (no rollback)', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    // Use number inputs (change events) to set min=5, max=30 (nearest stop to 40)
    // since slider positions are now 0..1000 and RangeSlider owns that mapping.
    const minInput = document.getElementById('discovery-team-min') as HTMLInputElement;
    const maxInput = document.getElementById('discovery-team-max') as HTMLInputElement;
    const maxSlider = document.getElementById('discovery-team-max-slider') as HTMLInputElement;
    const twoTimes = document.getElementById('discovery-team-two-times') as HTMLInputElement;

    minInput.value = '5';
    minInput.dispatchEvent(new Event('change'));
    maxInput.value = '30';
    maxInput.dispatchEvent(new Event('change'));

    twoTimes.checked = true;
    twoTimes.dispatchEvent(new Event('change'));
    // 2×5 = 10. valueToPosition(10, stops) = 600 (stop at idx 6).
    expect(maxInput.value).toBe('10');
    expect(maxSlider.value).toBe('600');
    expect(maxSlider.disabled).toBe(true);

    twoTimes.checked = false;
    twoTimes.dispatchEvent(new Event('change'));
    expect(maxInput.value).toBe('10');
    expect(maxSlider.value).toBe('600');
    expect(maxSlider.disabled).toBe(false);
    expect(maxSlider.classList.contains('is-max-locked')).toBe(false);
  });

  it('renders without the old player-list discovery slot and exposes FFA and 2x controls', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      desktopNotificationsEnabled: false,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    expect(document.getElementById('openfront-discovery-panel')).toBeTruthy();
    expect(document.getElementById('discovery-ffa')).toBeTruthy();
    expect(document.getElementById('discovery-team-hvn')).toBeTruthy();
    expect(document.getElementById('discovery-team-two-times')).toBeTruthy();
    expect(document.getElementById('discovery-desktop-toggle')).toBeTruthy();
    expect(document.getElementById('discovery-modes-rail')).toBeFalsy();
  });

  it('restores and persists the desktop notification toggle independently from sound', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: false,
      desktopNotificationsEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const soundToggle = document.getElementById('discovery-sound-toggle') as HTMLInputElement;
    const desktopToggle = document.getElementById('discovery-desktop-toggle') as HTMLInputElement;

    expect(soundToggle.checked).toBe(false);
    expect(desktopToggle.checked).toBe(true);

    desktopToggle.checked = false;
    desktopToggle.dispatchEvent(new Event('change'));

    expect(store.get(STORAGE_KEYS.lobbyDiscoverySettings)).toEqual({
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: false,
      desktopNotificationsEnabled: false,
      isTeamTwoTimesMinEnabled: false,
    });
  });

  it('requests permission when enabling desktop notifications and reverts on denial', async () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      desktopNotificationsEnabled: false,
      isTeamTwoTimesMinEnabled: false,
    });
    vi.mocked(BrowserNotificationUtils.ensurePermission).mockResolvedValue(false);

    ui = new LobbyDiscoveryUI();

    const desktopToggle = document.getElementById('discovery-desktop-toggle') as HTMLInputElement;
    desktopToggle.checked = true;
    desktopToggle.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(BrowserNotificationUtils.ensurePermission).toHaveBeenCalledTimes(1);
      expect(store.get(STORAGE_KEYS.lobbyDiscoverySettings)).toEqual({
        criteria: [],
        discoveryEnabled: true,
        soundEnabled: true,
        desktopNotificationsEnabled: false,
        isTeamTwoTimesMinEnabled: false,
      });
    });

    ui.cleanup();
    ui = new LobbyDiscoveryUI();

    expect((document.getElementById('discovery-desktop-toggle') as HTMLInputElement).checked).toBe(
      false
    );
  });

  it('ignores stale permission results if the desktop toggle is turned off before resolve', async () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      desktopNotificationsEnabled: false,
      isTeamTwoTimesMinEnabled: false,
    });

    let resolvePermission!: (value: boolean) => void;
    const permissionPromise = new Promise<boolean>((resolve) => {
      resolvePermission = resolve;
    });
    vi.mocked(BrowserNotificationUtils.ensurePermission).mockImplementation(() => permissionPromise);

    ui = new LobbyDiscoveryUI();

    const desktopToggle = document.getElementById('discovery-desktop-toggle') as HTMLInputElement;
    desktopToggle.checked = true;
    desktopToggle.dispatchEvent(new Event('change'));

    desktopToggle.checked = false;
    desktopToggle.dispatchEvent(new Event('change'));
    resolvePermission(true);

    await vi.waitFor(() => {
      expect(store.get(STORAGE_KEYS.lobbyDiscoverySettings)).toEqual({
        criteria: [],
        discoveryEnabled: true,
        soundEnabled: true,
        desktopNotificationsEnabled: false,
        isTeamTwoTimesMinEnabled: false,
      });
    });
    expect(desktopToggle.checked).toBe(false);
  });

  it('sends one browser notification for a new match and deduplicates repeated updates', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [{ gameMode: 'FFA', teamCount: null, minPlayers: null, maxPlayers: null }],
      discoveryEnabled: true,
      soundEnabled: false,
      desktopNotificationsEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const lobbies = [
      {
        gameID: 'ffa-desktop-1',
        publicGameType: 'ffa',
        gameConfig: {
          gameMode: 'Free For All',
          maxPlayers: 25,
        },
      },
    ] as any;

    ui.receiveLobbyUpdate(lobbies);
    ui.receiveLobbyUpdate(lobbies);

    expect(BrowserNotificationUtils.show).toHaveBeenCalledTimes(1);
    const [notificationPayload] = vi.mocked(BrowserNotificationUtils.show).mock.calls[0] ?? [];
    expect(notificationPayload).toBeTruthy();
    if (!notificationPayload) {
      throw new Error('Expected a browser notification payload');
    }
    expect(notificationPayload.title).toBe('FFA');
    expect(notificationPayload.body).toBe('25 slots');
    expect(typeof notificationPayload.tag).toBe('string');
    expect(SoundUtils.playGameFoundSound).not.toHaveBeenCalled();
  });

  it('delivers a desktop notification when a still-matching lobby moves from foreground to background', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [{ gameMode: 'FFA', teamCount: null, minPlayers: null, maxPlayers: null }],
      discoveryEnabled: true,
      soundEnabled: false,
      desktopNotificationsEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();
    vi.mocked(BrowserNotificationUtils.show).mockReturnValueOnce(false).mockReturnValueOnce(true);

    const lobbies = [
      {
        gameID: 'ffa-desktop-late',
        publicGameType: 'ffa',
        gameConfig: {
          gameMode: 'Free For All',
          maxPlayers: 25,
        },
      },
    ] as any;

    ui.receiveLobbyUpdate(lobbies);
    ui.receiveLobbyUpdate(lobbies);

    expect(BrowserNotificationUtils.show).toHaveBeenCalledTimes(2);
  });

  it('ignores hidden lobby matches entirely — no pulse, no sound, no notification', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [{ gameMode: 'FFA', teamCount: null, minPlayers: 30, maxPlayers: null }],
      discoveryEnabled: true,
      soundEnabled: true,
      desktopNotificationsEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    // OpenFront only renders games[source][0]. Clicking the card joins the
    // visible lobby — a hidden match isn't actionable, so we don't ping the
    // user about it.
    const lobbies = [
      {
        gameID: 'ffa-visible-too-small',
        publicGameType: 'ffa',
        gameConfig: { gameMode: 'Free For All', maxPlayers: 25 },
      },
      {
        gameID: 'ffa-hidden-match',
        publicGameType: 'ffa',
        gameConfig: { gameMode: 'Free For All', maxPlayers: 40 },
      },
    ] as any;

    ui.receiveLobbyUpdate(lobbies);

    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(
      false
    );
    expect(BrowserNotificationUtils.show).not.toHaveBeenCalled();
    expect(SoundUtils.playGameFoundSound).not.toHaveBeenCalled();
  });

  it('pulses the queue card when the featured (first) lobby matches', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [{ gameMode: 'FFA', teamCount: null, minPlayers: 30, maxPlayers: null }],
      discoveryEnabled: true,
      soundEnabled: false,
      desktopNotificationsEnabled: false,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const lobbies = [
      {
        gameID: 'ffa-visible-match',
        publicGameType: 'ffa',
        gameConfig: { gameMode: 'Free For All', maxPlayers: 40 },
      },
      {
        gameID: 'ffa-hidden-too-small',
        publicGameType: 'ffa',
        gameConfig: { gameMode: 'Free For All', maxPlayers: 25 },
      },
    ] as any;

    ui.receiveLobbyUpdate(lobbies);

    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(
      true
    );
  });

  it('cleanup clears queue card pulses without scheduling another sync tick', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [{ gameMode: 'FFA', teamCount: null, minPlayers: null, maxPlayers: null }],
      discoveryEnabled: true,
      soundEnabled: false,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();
    ui.receiveLobbyUpdate([
      {
        gameID: 'ffa-cleanup',
        publicGameType: 'ffa',
        gameConfig: {
          gameMode: 'Free For All',
          maxPlayers: 25,
        },
      },
    ] as any);

    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(
      true
    );

    ui.cleanup();
    ui = null;
    vi.advanceTimersByTime(32);

    expect(document.getElementById('ffa-card')?.classList.contains('of-discovery-card-active')).toBe(
      false
    );
  });

  it('renders tri-state modifier chips that cycle Any → Required → Blocked', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const chip = document.getElementById('modifier-isCompact') as HTMLButtonElement;

    expect(chip).toBeTruthy();
    expect(chip.tagName).toBe('BUTTON');
    expect(document.querySelector('#modifier-isCompact input[type="radio"]')).toBeFalsy();
    expect(document.querySelector('#modifier-isCompact-allowed')).toBeFalsy();
    expect(document.querySelector('#modifier-isCompact-blocked')).toBeFalsy();
    expect(chip.dataset.state).toBe('any');
    expect(chip.getAttribute('aria-pressed')).toBe('false');

    chip.click();
    expect(chip.dataset.state).toBe('required');
    expect(chip.getAttribute('aria-pressed')).toBe('true');

    chip.click();
    expect(chip.dataset.state).toBe('blocked');
    expect(chip.getAttribute('aria-pressed')).toBe('true');

    chip.click();
    expect(chip.dataset.state).toBe('any');
    expect(chip.getAttribute('aria-pressed')).toBe('false');
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

  it('uses the design-tuned 380px default width with no resize handle', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const panel = document.getElementById('openfront-discovery-panel') as HTMLDivElement;
    expect(panel.style.width).toBe('380px');
    expect(panel.querySelector('.of-resize-handle')).toBeFalsy();
  });

  it('exposes a Water Nukes modifier control as a tri-state chip', () => {
    store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: [],
      discoveryEnabled: true,
      soundEnabled: true,
      isTeamTwoTimesMinEnabled: false,
    });

    ui = new LobbyDiscoveryUI();

    const chip = document.getElementById('modifier-isWaterNukes') as HTMLButtonElement;
    expect(chip).toBeTruthy();
    expect(chip.tagName).toBe('BUTTON');
    expect(chip.dataset.state).toBe('any');
  });

  describe('team panel layout', () => {
    it('does not render discovery-team-duos, -trios, or -quads', () => {
      store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
        criteria: [],
        discoveryEnabled: true,
        soundEnabled: true,
        isTeamTwoTimesMinEnabled: false,
      });

      ui = new LobbyDiscoveryUI();

      expect(document.getElementById('discovery-team-duos')).toBeNull();
      expect(document.getElementById('discovery-team-trios')).toBeNull();
      expect(document.getElementById('discovery-team-quads')).toBeNull();
      expect(document.getElementById('discovery-team-hvn')).not.toBeNull();
      expect(document.getElementById('discovery-team-2')).not.toBeNull();
    });

    it('renders FORMAT and NUMBER OF TEAMS subsections without All/None buttons', () => {
      Object.assign(globalThis as Record<string, unknown>, {
        GM_getValue: () => undefined,
        GM_setValue: () => undefined,
      });

      ui = new LobbyDiscoveryUI();

      const hvnChip = document.getElementById('discovery-team-hvn') as HTMLInputElement | null;
      expect(hvnChip).not.toBeNull();
      const hvnLabel = hvnChip?.closest('label');
      expect(hvnLabel?.textContent?.trim()).toBe('Humans Vs Nations');

      for (const n of [2, 3, 4, 5, 6, 7]) {
        const chip = document.getElementById(`discovery-team-${n}`) as HTMLInputElement | null;
        expect(chip).not.toBeNull();
        expect(chip?.closest('label')?.textContent?.trim()).toBe(String(n));
      }

      const labels = Array.from(document.querySelectorAll('.ld-format-label')).map((el) =>
        el.textContent?.trim()
      );
      expect(labels).toContain('FORMAT');
      expect(labels).toContain('NUMBER OF TEAMS');

      expect(document.getElementById('discovery-team-select-all')).toBeNull();
      expect(document.getElementById('discovery-team-deselect-all')).toBeNull();
    });
  });
});
