/**
 * LobbyDiscoveryUI - notify-only discovery interface for matching lobbies.
 */

import { STORAGE_KEYS } from '@/config/constants';
import { LobbyUtils } from '@/utils/LobbyUtils';
import { BrowserNotificationUtils } from '@/utils/BrowserNotificationUtils';
import { SoundUtils } from '@/utils/SoundUtils';
import { URLObserver } from '@/utils/URLObserver';
import type { Lobby } from '@/types/game';
import type {
  DiscoveryCriteria,
  LobbyDiscoverySettings,
  ModifierFilters,
  ModifierFilterState,
  QueueSource,
  TeamCount,
} from './LobbyDiscoveryTypes';
import { LobbyDiscoveryEngine } from './LobbyDiscoveryEngine';
import {
  formatElapsedSince,
  getBrowserNotificationContent,
  getGameDetailsText,
  getLobbyQueueSource,
  normalizeSettings,
} from './LobbyDiscoveryHelpers';

const STARTING_GOLD_VALUES = [1_000_000, 5_000_000, 25_000_000] as const;
const GOLD_MULTIPLIER_VALUES = [2] as const;

const MODIFIER_BOOLEAN_IDS = [
  'modifier-isCompact',
  'modifier-isRandomSpawn',
  'modifier-isCrowded',
  'modifier-isHardNations',
  'modifier-isAlliancesDisabled',
  'modifier-isPortsDisabled',
  'modifier-isNukesDisabled',
  'modifier-isSAMsDisabled',
  'modifier-isPeaceTime',
  'modifier-isWaterNukes',
] as const;

const TEAM_PRESET_IDS: Array<[string, string, number | null]> = [
  ['discovery-team-duos', 'Duos', 2],
  ['discovery-team-trios', 'Trios', 3],
  ['discovery-team-quads', 'Quads', 4],
  ['discovery-team-hvn', 'Humans Vs Nations', null],
];

const TEAM_COUNT_IDS: Array<[string, string]> = [
  ['discovery-team-2', '2'],
  ['discovery-team-3', '3'],
  ['discovery-team-4', '4'],
  ['discovery-team-5', '5'],
  ['discovery-team-6', '6'],
  ['discovery-team-7', '7'],
];

const ALL_TEAM_IDS: string[] = [
  ...TEAM_PRESET_IDS.map(([id]) => id),
  ...TEAM_COUNT_IDS.map(([id]) => id),
];

const ICON_CHECK = `<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>`;
const ICON_CROSS = `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
const ICON_SOUND = `<svg viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7"/><path d="M19 5a9 9 0 010 14"/></svg>`;
const ICON_BELL = `<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/></svg>`;

export class LobbyDiscoveryUI {
  private discoveryEnabled = true;
  private criteriaList: DiscoveryCriteria[] = [];
  private searchStartTime: number | null = null;
  private lastMatchTime: number | null = null;
  private soundEnabled = true;
  private desktopNotificationsEnabled = false;
  private desktopNotificationRequestId = 0;
  private activeMatchSources: Set<QueueSource> = new Set();
  private seenLobbies: Set<string> = new Set();
  private desktopNotifiedLobbies: Set<string> = new Set();
  private isTeamTwoTimesMinEnabled = false;
  private sleeping = false;
  private isDisposed = false;

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private gameInfoInterval: ReturnType<typeof setInterval> | null = null;
  private pulseSyncTimeout: ReturnType<typeof setTimeout> | null = null;

  private panel!: HTMLDivElement;
  private engine: LobbyDiscoveryEngine;

  constructor() {
    this.engine = new LobbyDiscoveryEngine();
    this.loadSettings();
    this.createUI();
    this.updateSleepState();
    URLObserver.subscribe(() => this.updateSleepState());
  }

  receiveLobbyUpdate(lobbies: Lobby[]): void {
    this.processLobbies(lobbies);
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  private loadSettings(): void {
    const saved = GM_getValue<LobbyDiscoverySettings | null>(
      STORAGE_KEYS.lobbyDiscoverySettings,
      null
    );

    const settings = normalizeSettings(saved);
    GM_setValue(STORAGE_KEYS.lobbyDiscoverySettings, settings);

    this.criteriaList = settings.criteria;
    this.soundEnabled = settings.soundEnabled;
    this.desktopNotificationsEnabled = settings.desktopNotificationsEnabled;
    this.discoveryEnabled = settings.discoveryEnabled;
    this.isTeamTwoTimesMinEnabled = settings.isTeamTwoTimesMinEnabled;
  }

  private saveSettings(): void {
    GM_setValue(STORAGE_KEYS.lobbyDiscoverySettings, {
      criteria: this.criteriaList,
      discoveryEnabled: this.discoveryEnabled,
      soundEnabled: this.soundEnabled,
      desktopNotificationsEnabled: this.desktopNotificationsEnabled,
      isTeamTwoTimesMinEnabled: this.isTeamTwoTimesMinEnabled,
    } satisfies LobbyDiscoverySettings);
  }

  private updateStatusText(): void {
    const text = document.getElementById('discovery-search-timer');
    if (!text) return;

    if (
      !this.discoveryEnabled ||
      this.criteriaList.length === 0 ||
      !this.isDiscoveryFeedbackAllowed()
    ) {
      text.textContent = '';
      text.style.display = 'none';
      return;
    }

    text.style.display = 'inline';
    if (this.lastMatchTime !== null) {
      text.textContent = `last match ${formatElapsedSince(this.lastMatchTime)}`;
    } else if (this.searchStartTime !== null) {
      text.textContent = `searching · ${formatElapsedSince(this.searchStartTime)}`;
    } else {
      text.textContent = 'awaiting filters';
    }
  }

  private updateCurrentGameInfo(): void {
    const gameInfoElement = document.getElementById('discovery-current-game-info');
    if (!gameInfoElement || !LobbyUtils.isOnLobbyPage()) {
      if (gameInfoElement) gameInfoElement.style.display = 'none';
      return;
    }

    const publicLobby = document.querySelector('public-lobby') as any;
    if (!publicLobby || !Array.isArray(publicLobby.lobbies) || publicLobby.lobbies.length === 0) {
      gameInfoElement.style.display = 'none';
      return;
    }

    const currentLobby = publicLobby.lobbies[0];
    if (!currentLobby || !currentLobby.gameConfig) {
      gameInfoElement.style.display = 'none';
      return;
    }

    gameInfoElement.style.display = 'block';
    gameInfoElement.textContent = `Current game: ${getGameDetailsText(currentLobby)}`;
  }

  private processLobbies(lobbies: Lobby[]): void {
    try {
      this.updateCurrentGameInfo();
      this.syncSearchTimer();

      if (
        !this.discoveryEnabled ||
        this.criteriaList.length === 0 ||
        !this.isDiscoveryFeedbackAllowed()
      ) {
        this.seenLobbies.clear();
        this.desktopNotifiedLobbies.clear();
        this.updateQueueCardPulses(new Set());
        this.updateStatusText();
        return;
      }

      const matchedSources = new Set<QueueSource>();
      const matchedKeys = new Set<string>();
      const newMatches: Lobby[] = [];
      let hasNewMatch = false;

      for (const lobby of lobbies) {
        const source = getLobbyQueueSource(lobby);
        if (!source) continue;
        if (
          !this.engine.matchesCriteria(lobby, this.criteriaList, {
            isTeamTwoTimesMinEnabled: this.isTeamTwoTimesMinEnabled,
          })
        ) {
          continue;
        }

        matchedSources.add(source);
        const notificationKey = this.getNotificationKey(lobby);
        matchedKeys.add(notificationKey);
        if (!this.seenLobbies.has(notificationKey)) hasNewMatch = true;
        if (!this.desktopNotifiedLobbies.has(notificationKey)) newMatches.push(lobby);
      }

      this.updateQueueCardPulses(matchedSources);
      if (hasNewMatch) {
        this.lastMatchTime = Date.now();
        if (this.soundEnabled) SoundUtils.playGameFoundSound();
      }
      if (this.desktopNotificationsEnabled) {
        const deliveredKeys = new Set<string>();
        for (const lobby of newMatches) {
          const content = getBrowserNotificationContent(lobby);
          const key = this.getNotificationKey(lobby);
          const delivered = BrowserNotificationUtils.show({
            title: content.title,
            body: content.body,
            tag: key,
          });
          if (delivered) deliveredKeys.add(key);
        }
        this.desktopNotifiedLobbies = new Set([
          ...[...this.desktopNotifiedLobbies].filter((k) => matchedKeys.has(k)),
          ...deliveredKeys,
        ]);
      } else {
        this.desktopNotifiedLobbies.clear();
      }

      this.seenLobbies = matchedKeys;
      if (matchedKeys.size === 0) this.lastMatchTime = null;
      this.updateStatusText();
    } catch (error) {
      console.error('[LobbyDiscovery] Error processing lobbies:', error);
    }
  }

  private getNotificationKey(lobby: Lobby): string {
    return JSON.stringify({
      gameID: lobby.gameID,
      mode: lobby.gameConfig?.gameMode ?? null,
      playerTeams: lobby.gameConfig?.playerTeams ?? lobby.gameConfig?.teamCount ?? null,
      capacity: lobby.gameConfig?.maxPlayers ?? lobby.maxClients ?? null,
      modifiers: lobby.gameConfig?.publicGameModifiers ?? {},
    });
  }

  private isDiscoveryFeedbackAllowed(): boolean {
    if (!LobbyUtils.isOnLobbyPage()) return false;

    const pagePlay = document.getElementById('page-play');
    if (pagePlay?.classList.contains('hidden')) return false;

    const publicLobby = document.querySelector('public-lobby') as
      | { isLobbyHighlighted?: boolean }
      | null;
    if (publicLobby?.isLobbyHighlighted === true) return false;

    const joinLobbyModal = document.querySelector('join-lobby-modal') as
      | { currentLobbyId?: string }
      | null;
    if (joinLobbyModal?.currentLobbyId) return false;

    const hostLobbyModal = document.querySelector('host-lobby-modal') as
      | { lobbyId?: string }
      | null;
    if (hostLobbyModal?.lobbyId) return false;

    return true;
  }

  private getQueueCardElements(): Partial<Record<QueueSource, HTMLElement>> {
    const selector = document.querySelector('game-mode-selector') as HTMLElement | null;
    if (!selector) return {};

    const desktopGrid = Array.from(selector.querySelectorAll('div')).find((element) =>
      element.className.includes('sm:grid-cols-[2fr_1fr]')
    );
    if (!(desktopGrid instanceof HTMLElement)) return {};

    const [leftColumn, rightColumn] = Array.from(desktopGrid.children) as HTMLElement[];
    const rightSections = rightColumn ? (Array.from(rightColumn.children) as HTMLElement[]) : [];

    return {
      ffa: leftColumn?.querySelector('button') as HTMLElement | undefined,
      special: rightSections[0]?.querySelector('button') as HTMLElement | undefined,
      team: rightSections[1]?.querySelector('button') as HTMLElement | undefined,
    };
  }

  private updateQueueCardPulses(nextSources: Set<QueueSource>): void {
    this.activeMatchSources = new Set(nextSources);
    this.applyQueueCardPulses();
    this.scheduleQueueCardPulseSync();
  }

  private applyQueueCardPulses(): void {
    const cards = this.getQueueCardElements();
    for (const source of ['ffa', 'special', 'team'] as const) {
      const card = cards[source];
      if (!card) continue;
      card.classList.toggle('of-discovery-card-active', this.activeMatchSources.has(source));
    }
  }

  private scheduleQueueCardPulseSync(): void {
    if (this.pulseSyncTimeout) clearTimeout(this.pulseSyncTimeout);
    this.pulseSyncTimeout = setTimeout(() => {
      this.pulseSyncTimeout = null;
      this.applyQueueCardPulses();
    }, 16);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private startGameInfoUpdates(): void {
    this.stopGameInfoUpdates();
    this.updateCurrentGameInfo();
    this.gameInfoInterval = setInterval(() => this.updateCurrentGameInfo(), 1000);
  }

  private stopGameInfoUpdates(): void {
    if (this.gameInfoInterval) {
      clearInterval(this.gameInfoInterval);
      this.gameInfoInterval = null;
    }
  }

  private syncSearchTimer(options: { resetStart?: boolean } = {}): void {
    const { resetStart = false } = options;

    this.stopTimer();

    if (resetStart) {
      this.searchStartTime = null;
      this.lastMatchTime = null;
      this.seenLobbies.clear();
      this.desktopNotifiedLobbies.clear();
    }

    if (
      this.discoveryEnabled &&
      this.criteriaList.length > 0 &&
      this.isDiscoveryFeedbackAllowed()
    ) {
      if (this.searchStartTime === null) this.searchStartTime = Date.now();
      this.timerInterval = setInterval(() => this.updateStatusText(), 1000);
    } else {
      this.searchStartTime = null;
      this.lastMatchTime = null;
    }

    this.updateStatusText();
    this.updatePulseIndicator();
  }

  private updatePulseIndicator(): void {
    const pulse = document.querySelector('.ld-pulse') as HTMLElement | null;
    if (!pulse) return;
    const active = this.discoveryEnabled && this.criteriaList.length > 0;
    pulse.classList.toggle('is-paused', !active);
  }

  private setDiscoveryEnabled(enabled: boolean, options: { resetTimer?: boolean } = {}): void {
    this.discoveryEnabled = enabled;
    this.saveSettings();
    this.updateStatusLabel();
    this.syncSearchTimer({ resetStart: options.resetTimer ?? false });
  }

  private updateStatusLabel(): void {
    const label = document.querySelector('.ld-status-text strong') as HTMLElement | null;
    if (!label) return;
    label.textContent = this.discoveryEnabled ? 'Discovery active' : 'Discovery paused';
  }

  private getNumberValue(id: string): number | null {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) return null;
    const val = parseInt(input.value, 10);
    return Number.isNaN(val) ? null : val;
  }

  private getModifierState(id: string): ModifierFilterState {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    const state = button?.dataset.state;
    if (state === 'required' || state === 'blocked') return state;
    return 'any';
  }

  private setModifierState(id: string, state: ModifierFilterState): void {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    if (!button) return;
    button.dataset.state = state;
    button.setAttribute('aria-pressed', String(state !== 'any'));
    const ind = button.querySelector('.ld-mod-ind') as HTMLElement | null;
    if (ind) {
      if (state === 'required') ind.innerHTML = ICON_CHECK;
      else if (state === 'blocked') ind.innerHTML = ICON_CROSS;
      else ind.innerHTML = '';
    }
  }

  private cycleModifierState(id: string): void {
    const cur = this.getModifierState(id);
    const next: ModifierFilterState =
      cur === 'any' ? 'required' : cur === 'required' ? 'blocked' : 'any';
    this.setModifierState(id, next);
  }

  private getNumericModifierState(
    ids: Record<number, string>
  ): Record<number, ModifierFilterState> | undefined {
    const states: Record<number, ModifierFilterState> = {};
    for (const [numericValue, id] of Object.entries(ids)) {
      states[Number(numericValue)] = this.getModifierState(id);
    }
    return states;
  }

  private getModifierFiltersFromUI(): ModifierFilters {
    return {
      isCompact: this.getModifierState('modifier-isCompact'),
      isRandomSpawn: this.getModifierState('modifier-isRandomSpawn'),
      isCrowded: this.getModifierState('modifier-isCrowded'),
      isHardNations: this.getModifierState('modifier-isHardNations'),
      isAlliancesDisabled: this.getModifierState('modifier-isAlliancesDisabled'),
      isPortsDisabled: this.getModifierState('modifier-isPortsDisabled'),
      isNukesDisabled: this.getModifierState('modifier-isNukesDisabled'),
      isSAMsDisabled: this.getModifierState('modifier-isSAMsDisabled'),
      isPeaceTime: this.getModifierState('modifier-isPeaceTime'),
      isWaterNukes: this.getModifierState('modifier-isWaterNukes'),
      startingGold: this.getNumericModifierState({
        1000000: 'modifier-startingGold-1000000',
        5000000: 'modifier-startingGold-5000000',
        25000000: 'modifier-startingGold-25000000',
      }),
      goldMultiplier: this.getNumericModifierState({
        2: 'modifier-goldMultiplier-2',
      }),
    };
  }

  private getAllTeamCountValues(): TeamCount[] {
    const values: TeamCount[] = [];
    for (const id of ALL_TEAM_IDS) {
      const checkbox = document.getElementById(id) as HTMLInputElement | null;
      if (!checkbox?.checked) continue;
      const value = checkbox.value;
      if (
        value === 'Duos' ||
        value === 'Trios' ||
        value === 'Quads' ||
        value === 'Humans Vs Nations'
      ) {
        values.push(value);
      } else {
        const numeric = parseInt(value, 10);
        if (!Number.isNaN(numeric)) values.push(numeric);
      }
    }
    return values;
  }

  private applyAutoTeamMin(): void {
    const checked = TEAM_PRESET_IDS.filter(
      ([id, , min]) =>
        min !== null && (document.getElementById(id) as HTMLInputElement | null)?.checked
    ).map(([, , min]) => min as number);

    if (checked.length === 0) return;

    const newMin = Math.min(...checked);
    const minSlider = document.getElementById('discovery-team-min-slider') as HTMLInputElement | null;
    if (!minSlider) return;

    minSlider.value = String(newMin);
    this.updateSliderRange(
      'discovery-team-min-slider',
      'discovery-team-max-slider',
      'discovery-team-min',
      'discovery-team-max',
      'discovery-team-range-fill',
      'discovery-team-min-value',
      'discovery-team-max-value',
      true
    );
  }

  private setAllTeamCounts(checked: boolean): void {
    for (const id of ALL_TEAM_IDS) {
      const checkbox = document.getElementById(id) as HTMLInputElement | null;
      if (!checkbox) continue;
      checkbox.checked = checked;
      this.syncChipState(id);
    }
  }

  private syncChipState(checkboxId: string): void {
    const checkbox = document.getElementById(checkboxId) as HTMLInputElement | null;
    if (!checkbox) return;
    const chip = checkbox.closest('.ld-chip, .ld-mode-btn, .ld-2x') as HTMLElement | null;
    if (!chip) return;
    chip.classList.toggle('is-on', checkbox.checked);
    chip.setAttribute('aria-pressed', String(checkbox.checked));
  }

  private buildCriteriaFromUI(): DiscoveryCriteria[] {
    const modifiers = this.getModifierFiltersFromUI();
    const criteria: DiscoveryCriteria[] = [];

    const ffaCheckbox = document.getElementById('discovery-ffa') as HTMLInputElement | null;
    if (ffaCheckbox?.checked) {
      criteria.push({
        gameMode: 'FFA',
        teamCount: null,
        minPlayers: this.getNumberValue('discovery-ffa-min'),
        maxPlayers: this.getNumberValue('discovery-ffa-max'),
        modifiers,
      });
    }

    const teamCheckbox = document.getElementById('discovery-team') as HTMLInputElement | null;
    if (!teamCheckbox?.checked) return criteria;

    const teamCounts = this.getAllTeamCountValues();
    if (teamCounts.length === 0) {
      criteria.push({
        gameMode: 'Team',
        teamCount: null,
        minPlayers: this.getNumberValue('discovery-team-min'),
        maxPlayers: this.getNumberValue('discovery-team-max'),
        modifiers,
      });
      return criteria;
    }

    for (const teamCount of teamCounts) {
      criteria.push({
        gameMode: 'Team',
        teamCount,
        minPlayers: this.getNumberValue('discovery-team-min'),
        maxPlayers: this.getNumberValue('discovery-team-max'),
        modifiers,
      });
    }

    return criteria;
  }

  private updateFilterCount(): void {
    const num = document.getElementById('discovery-filter-count');
    const wordEl = document.getElementById('discovery-filter-word');
    if (!num || !wordEl) return;

    const ffaOn = (document.getElementById('discovery-ffa') as HTMLInputElement | null)?.checked;
    const teamOn = (document.getElementById('discovery-team') as HTMLInputElement | null)?.checked;
    const formatsOn = ALL_TEAM_IDS.filter(
      (id) => (document.getElementById(id) as HTMLInputElement | null)?.checked
    ).length;
    const modsOn = [
      ...MODIFIER_BOOLEAN_IDS,
      ...STARTING_GOLD_VALUES.map((v) => `modifier-startingGold-${v}`),
      ...GOLD_MULTIPLIER_VALUES.map((v) => `modifier-goldMultiplier-${v}`),
    ].filter((id) => this.getModifierState(id) !== 'any').length;

    const count = (ffaOn ? 1 : 0) + (teamOn ? 1 : 0) + formatsOn + modsOn;
    num.textContent = String(count);
    wordEl.textContent = count === 1 ? 'filter' : 'filters';
  }

  private setModePanelActive(panelId: string, active: boolean): void {
    const el = document.getElementById(panelId);
    if (el) el.classList.toggle('is-off', !active);
  }

  private setIconButtonState(checkboxId: string, on: boolean): void {
    const btn = document
      .getElementById(checkboxId)
      ?.closest('.ld-icon-btn') as HTMLElement | null;
    if (btn) btn.classList.toggle('is-on', on);
  }

  private loadUIFromSettings(): void {
    const ffaCriteria = this.criteriaList.find((c) => c.gameMode === 'FFA');
    const teamCriteria = this.criteriaList.filter((c) => c.gameMode === 'Team');

    const ffaCheckbox = document.getElementById('discovery-ffa') as HTMLInputElement | null;
    const teamCheckbox = document.getElementById('discovery-team') as HTMLInputElement | null;
    if (ffaCheckbox) {
      ffaCheckbox.checked = !!ffaCriteria;
      this.syncChipState('discovery-ffa');
      this.setModePanelActive('discovery-ffa-config', !!ffaCriteria);
    }
    if (teamCheckbox) {
      teamCheckbox.checked = teamCriteria.length > 0;
      this.syncChipState('discovery-team');
      this.setModePanelActive('discovery-team-config', teamCriteria.length > 0);
    }

    if (ffaCriteria) {
      const min = document.getElementById('discovery-ffa-min') as HTMLInputElement | null;
      const max = document.getElementById('discovery-ffa-max') as HTMLInputElement | null;
      if (min && ffaCriteria.minPlayers !== null) min.value = String(ffaCriteria.minPlayers);
      if (max && ffaCriteria.maxPlayers !== null) max.value = String(ffaCriteria.maxPlayers);
    }

    if (teamCriteria[0]) {
      const min = document.getElementById('discovery-team-min') as HTMLInputElement | null;
      const max = document.getElementById('discovery-team-max') as HTMLInputElement | null;
      if (min && teamCriteria[0].minPlayers !== null) min.value = String(teamCriteria[0].minPlayers);
      if (max && teamCriteria[0].maxPlayers !== null) max.value = String(teamCriteria[0].maxPlayers);
      this.setTeamCountSelections(teamCriteria.map((c) => c.teamCount));
    }

    const modifiers = (ffaCriteria ?? teamCriteria[0])?.modifiers;
    if (modifiers) {
      this.setModifierState('modifier-isCompact', modifiers.isCompact ?? 'any');
      this.setModifierState('modifier-isRandomSpawn', modifiers.isRandomSpawn ?? 'any');
      this.setModifierState('modifier-isCrowded', modifiers.isCrowded ?? 'any');
      this.setModifierState('modifier-isHardNations', modifiers.isHardNations ?? 'any');
      this.setModifierState('modifier-isAlliancesDisabled', modifiers.isAlliancesDisabled ?? 'any');
      this.setModifierState('modifier-isPortsDisabled', modifiers.isPortsDisabled ?? 'any');
      this.setModifierState('modifier-isNukesDisabled', modifiers.isNukesDisabled ?? 'any');
      this.setModifierState('modifier-isSAMsDisabled', modifiers.isSAMsDisabled ?? 'any');
      this.setModifierState('modifier-isPeaceTime', modifiers.isPeaceTime ?? 'any');
      this.setModifierState('modifier-isWaterNukes', modifiers.isWaterNukes ?? 'any');

      for (const value of STARTING_GOLD_VALUES) {
        this.setModifierState(
          `modifier-startingGold-${value}`,
          modifiers.startingGold?.[value] ?? 'any'
        );
      }
      for (const value of GOLD_MULTIPLIER_VALUES) {
        this.setModifierState(
          `modifier-goldMultiplier-${value}`,
          modifiers.goldMultiplier?.[value] ?? 'any'
        );
      }
    }

    const soundCheckbox = document.getElementById('discovery-sound-toggle') as HTMLInputElement | null;
    if (soundCheckbox) {
      soundCheckbox.checked = this.soundEnabled;
      this.setIconButtonState('discovery-sound-toggle', this.soundEnabled);
    }

    const desktopCheckbox = document.getElementById('discovery-desktop-toggle') as HTMLInputElement | null;
    if (desktopCheckbox) {
      desktopCheckbox.checked = this.desktopNotificationsEnabled;
      this.setIconButtonState('discovery-desktop-toggle', this.desktopNotificationsEnabled);
    }

    const twoTimes = document.getElementById('discovery-team-two-times') as HTMLInputElement | null;
    if (twoTimes) {
      twoTimes.checked = this.isTeamTwoTimesMinEnabled;
      this.syncChipState('discovery-team-two-times');
    }

    this.updateFilterCount();
    this.updateStatusLabel();
  }

  private setTeamCountSelections(values: Array<TeamCount | null | undefined>): void {
    for (const teamCount of values) {
      let checkbox: HTMLInputElement | null = null;
      if (teamCount === 'Duos') checkbox = document.getElementById('discovery-team-duos') as HTMLInputElement;
      else if (teamCount === 'Trios') checkbox = document.getElementById('discovery-team-trios') as HTMLInputElement;
      else if (teamCount === 'Quads') checkbox = document.getElementById('discovery-team-quads') as HTMLInputElement;
      else if (teamCount === 'Humans Vs Nations') checkbox = document.getElementById('discovery-team-hvn') as HTMLInputElement;
      else if (typeof teamCount === 'number') checkbox = document.getElementById(`discovery-team-${teamCount}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = true;
        this.syncChipState(checkbox.id);
      }
    }
  }

  private initializeSlider(
    minSliderId: string,
    maxSliderId: string,
    minInputId: string,
    maxInputId: string,
    fillId: string,
    minValueId: string,
    maxValueId: string,
    applyTwoTimesConstraint: boolean = false
  ): void {
    const minSlider = document.getElementById(minSliderId) as HTMLInputElement | null;
    const maxSlider = document.getElementById(maxSliderId) as HTMLInputElement | null;
    const minInput = document.getElementById(minInputId) as HTMLInputElement | null;
    const maxInput = document.getElementById(maxInputId) as HTMLInputElement | null;

    if (!minSlider || !maxSlider || !minInput || !maxInput) return;

    const savedMin = parseInt(minInput.value, 10);
    const savedMax = parseInt(maxInput.value, 10);
    if (!Number.isNaN(savedMin)) minSlider.value = String(savedMin);
    if (!Number.isNaN(savedMax)) maxSlider.value = String(savedMax);

    const update = () => {
      this.updateSliderRange(
        minSliderId,
        maxSliderId,
        minInputId,
        maxInputId,
        fillId,
        minValueId,
        maxValueId,
        applyTwoTimesConstraint
      );
      this.refreshCriteria();
    };

    minSlider.addEventListener('input', update);
    maxSlider.addEventListener('input', update);

    this.updateSliderRange(
      minSliderId,
      maxSliderId,
      minInputId,
      maxInputId,
      fillId,
      minValueId,
      maxValueId,
      applyTwoTimesConstraint
    );
  }

  private updateSliderRange(
    minSliderId: string,
    maxSliderId: string,
    minInputId: string,
    maxInputId: string,
    fillId: string,
    minValueId: string,
    maxValueId: string,
    applyTwoTimesConstraint: boolean
  ): void {
    const minSlider = document.getElementById(minSliderId) as HTMLInputElement | null;
    const maxSlider = document.getElementById(maxSliderId) as HTMLInputElement | null;
    const minInput = document.getElementById(minInputId) as HTMLInputElement | null;
    const maxInput = document.getElementById(maxInputId) as HTMLInputElement | null;
    const range = document.getElementById(fillId)?.parentElement?.parentElement as HTMLElement | null;
    const minValueSpan = document.getElementById(minValueId);
    const maxValueSpan = document.getElementById(maxValueId);

    if (!minSlider || !maxSlider || !minInput || !maxInput) return;

    let minVal = parseInt(minSlider.value, 10);
    let maxVal = parseInt(maxSlider.value, 10);

    if (applyTwoTimesConstraint && this.isTeamTwoTimesMinEnabled) {
      maxVal = Math.min(parseInt(maxSlider.max, 10), Math.max(1, maxVal));
    }

    if (minVal > maxVal) {
      minVal = maxVal;
      minSlider.value = String(minVal);
    }

    minInput.value = String(minVal);
    maxInput.value = String(maxVal);

    if (minValueSpan) minValueSpan.textContent = String(minVal);
    if (maxValueSpan) maxValueSpan.textContent = String(maxVal);

    if (range) {
      const sliderMin = parseInt(minSlider.min, 10);
      const sliderMax = parseInt(minSlider.max, 10);
      const span = sliderMax - sliderMin || 1;
      const minPct = ((minVal - sliderMin) / span) * 100;
      const maxPct = ((maxVal - sliderMin) / span) * 100;
      range.style.setProperty('--lo', `${minPct}%`);
      range.style.setProperty('--hi', `${maxPct}%`);
    }
  }

  private refreshCriteria(): void {
    this.criteriaList = this.buildCriteriaFromUI();
    this.saveSettings();
    this.updateFilterCount();
    this.syncSearchTimer({ resetStart: true });
  }

  private resetAll(): void {
    const ffaCheckbox = document.getElementById('discovery-ffa') as HTMLInputElement | null;
    const teamCheckbox = document.getElementById('discovery-team') as HTMLInputElement | null;
    if (ffaCheckbox) {
      ffaCheckbox.checked = false;
      this.syncChipState('discovery-ffa');
      this.setModePanelActive('discovery-ffa-config', false);
    }
    if (teamCheckbox) {
      teamCheckbox.checked = false;
      this.syncChipState('discovery-team');
      this.setModePanelActive('discovery-team-config', false);
    }

    this.setAllTeamCounts(false);

    const twoTimes = document.getElementById('discovery-team-two-times') as HTMLInputElement | null;
    if (twoTimes) {
      twoTimes.checked = false;
      this.syncChipState('discovery-team-two-times');
      this.isTeamTwoTimesMinEnabled = false;
    }

    for (const id of MODIFIER_BOOLEAN_IDS) this.setModifierState(id, 'any');
    for (const v of STARTING_GOLD_VALUES) this.setModifierState(`modifier-startingGold-${v}`, 'any');
    for (const v of GOLD_MULTIPLIER_VALUES) this.setModifierState(`modifier-goldMultiplier-${v}`, 'any');

    const ffaMinSlider = document.getElementById('discovery-ffa-min-slider') as HTMLInputElement | null;
    const ffaMaxSlider = document.getElementById('discovery-ffa-max-slider') as HTMLInputElement | null;
    if (ffaMinSlider && ffaMaxSlider) {
      ffaMinSlider.value = ffaMinSlider.min;
      ffaMaxSlider.value = ffaMaxSlider.max;
      this.updateSliderRange(
        'discovery-ffa-min-slider',
        'discovery-ffa-max-slider',
        'discovery-ffa-min',
        'discovery-ffa-max',
        'discovery-ffa-range-fill',
        'discovery-ffa-min-value',
        'discovery-ffa-max-value',
        false
      );
    }
    const teamMinSlider = document.getElementById('discovery-team-min-slider') as HTMLInputElement | null;
    const teamMaxSlider = document.getElementById('discovery-team-max-slider') as HTMLInputElement | null;
    if (teamMinSlider && teamMaxSlider) {
      teamMinSlider.value = teamMinSlider.min;
      teamMaxSlider.value = teamMaxSlider.max;
      this.updateSliderRange(
        'discovery-team-min-slider',
        'discovery-team-max-slider',
        'discovery-team-min',
        'discovery-team-max',
        'discovery-team-range-fill',
        'discovery-team-min-value',
        'discovery-team-max-value',
        true
      );
    }

    this.refreshCriteria();
  }

  private async handleDesktopNotificationToggleChange(
    desktopToggle: HTMLInputElement
  ): Promise<void> {
    const requestId = ++this.desktopNotificationRequestId;

    if (!desktopToggle.checked) {
      this.desktopNotificationsEnabled = false;
      this.setIconButtonState('discovery-desktop-toggle', false);
      this.saveSettings();
      return;
    }

    const granted = await BrowserNotificationUtils.ensurePermission();
    if (
      requestId !== this.desktopNotificationRequestId ||
      this.isDisposed ||
      !desktopToggle.isConnected ||
      !desktopToggle.checked
    ) {
      return;
    }

    this.desktopNotificationsEnabled = granted;
    desktopToggle.checked = granted;
    desktopToggle.toggleAttribute('checked', granted);
    this.setIconButtonState('discovery-desktop-toggle', granted);
    this.saveSettings();
  }

  private setupEventListeners(): void {
    document.getElementById('discovery-status')?.addEventListener('click', () => {
      this.setDiscoveryEnabled(!this.discoveryEnabled, { resetTimer: true });
    });

    for (const [checkboxId, configId] of [
      ['discovery-ffa', 'discovery-ffa-config'],
      ['discovery-team', 'discovery-team-config'],
    ] as const) {
      const checkbox = document.getElementById(checkboxId) as HTMLInputElement | null;
      checkbox?.addEventListener('change', () => {
        this.syncChipState(checkboxId);
        this.setModePanelActive(configId, checkbox.checked);
        this.refreshCriteria();
      });
    }

    const twoTimesCheckbox = document.getElementById('discovery-team-two-times') as HTMLInputElement | null;
    twoTimesCheckbox?.addEventListener('change', () => {
      this.isTeamTwoTimesMinEnabled = twoTimesCheckbox.checked;
      this.syncChipState('discovery-team-two-times');
      this.updateSliderRange(
        'discovery-team-min-slider',
        'discovery-team-max-slider',
        'discovery-team-min',
        'discovery-team-max',
        'discovery-team-range-fill',
        'discovery-team-min-value',
        'discovery-team-max-value',
        true
      );
      this.refreshCriteria();
    });

    document.getElementById('discovery-team-select-all')?.addEventListener('click', () => {
      this.setAllTeamCounts(true);
      this.refreshCriteria();
    });
    document.getElementById('discovery-team-deselect-all')?.addEventListener('click', () => {
      this.setAllTeamCounts(false);
      this.refreshCriteria();
    });

    document.getElementById('discovery-reset')?.addEventListener('click', () => {
      this.resetAll();
    });

    for (const id of [...ALL_TEAM_IDS, 'discovery-sound-toggle', 'discovery-desktop-toggle']) {
      const element = document.getElementById(id) as HTMLInputElement | null;
      if (!element) continue;
      element.addEventListener('change', () => {
        if (id === 'discovery-sound-toggle') {
          this.soundEnabled = element.checked;
          this.setIconButtonState('discovery-sound-toggle', element.checked);
          this.saveSettings();
          return;
        }
        if (id === 'discovery-desktop-toggle') {
          void this.handleDesktopNotificationToggleChange(element);
          return;
        }
        this.syncChipState(id);
        if (
          id === 'discovery-team-duos' ||
          id === 'discovery-team-trios' ||
          id === 'discovery-team-quads'
        ) {
          this.applyAutoTeamMin();
        }
        this.refreshCriteria();
      });
    }

    const allModifierIds: string[] = [
      ...MODIFIER_BOOLEAN_IDS,
      ...STARTING_GOLD_VALUES.map((v) => `modifier-startingGold-${v}`),
      ...GOLD_MULTIPLIER_VALUES.map((v) => `modifier-goldMultiplier-${v}`),
    ];
    for (const id of allModifierIds) {
      const button = document.getElementById(id) as HTMLButtonElement | null;
      button?.addEventListener('click', () => {
        this.cycleModifierState(id);
        this.refreshCriteria();
      });
    }
  }

  private renderModeButton(id: string, label: string): string {
    return `
      <label class="ld-mode-btn" aria-pressed="false">
        <input type="checkbox" id="${id}" value="${id === 'discovery-ffa' ? 'FFA' : 'Team'}">
        <span class="check">${ICON_CHECK}</span>
        <span>${label}</span>
      </label>
    `;
  }

  private renderChip(id: string, value: string, label: string): string {
    return `
      <label class="ld-chip" aria-pressed="false">
        <input type="checkbox" id="${id}" value="${value}">${label}
      </label>
    `;
  }

  private renderModifierChip(id: string, name: string): string {
    return `
      <button type="button" class="ld-mod" id="${id}" data-state="any" aria-pressed="false" aria-label="${name}">
        <span class="ld-mod-ind"></span>
        <span class="ld-mod-name">${name}</span>
      </button>
    `;
  }

  private renderIconButton(id: string, title: string, svg: string): string {
    return `
      <label class="ld-icon-btn" title="${title}" aria-label="${title}">
        <input type="checkbox" id="${id}">${svg}
      </label>
    `;
  }

  private createUI(): void {
    if (document.getElementById('openfront-discovery-panel')) return;

    this.panel = document.createElement('div');
    this.panel.id = 'openfront-discovery-panel';
    this.panel.className = 'of-panel discovery-panel';
    this.panel.style.width = '380px';
    this.panel.innerHTML = `
      <div class="ld-status">
        <span class="ld-pulse" aria-hidden="true"></span>
        <div class="ld-status-text" id="discovery-status" role="button" tabindex="0">
          <strong>Discovery active</strong>
          <span class="sep">·</span>
          <span class="meta" id="discovery-search-timer"></span>
        </div>
        <div class="ld-icons">
          ${this.renderIconButton('discovery-sound-toggle', 'Sound alert', ICON_SOUND)}
          ${this.renderIconButton('discovery-desktop-toggle', 'Desktop notification', ICON_BELL)}
        </div>
      </div>
      <div class="ld-head">
        <div class="ld-eyebrow">Notify only · never auto-joins</div>
        <h2 class="ld-title">Lobby Discovery</h2>
      </div>
      <div class="discovery-body">
        <div class="discovery-content" style="overflow-y: auto;">
          <div class="ld-section">
            <div class="ld-section-head">
              <div class="ld-section-label">Modes</div>
              <div class="ld-section-aside">Pick one or both</div>
            </div>
            <div class="ld-modes">
              ${this.renderModeButton('discovery-ffa', 'FFA')}
              ${this.renderModeButton('discovery-team', 'Teams')}
            </div>

            <div class="ld-mode-panel" id="discovery-ffa-config">
              <div class="ld-mode-panel-head">
                <span class="dot"></span>
                <span class="title">FFA · Lobby capacity</span>
              </div>
              <div class="ld-slider-row">
                <div class="ld-slider-label">
                  <span>Total players</span>
                  <span class="val">
                    <span id="discovery-ffa-min-value">1</span>
                    <span class="sep">–</span>
                    <span id="discovery-ffa-max-value">125</span>
                  </span>
                </div>
                <div class="ld-range">
                  <div class="track"><div class="track-fill" id="discovery-ffa-range-fill"></div></div>
                  <input type="range" id="discovery-ffa-min-slider" min="1" max="125" value="1" class="capacity-slider capacity-slider-min">
                  <input type="range" id="discovery-ffa-max-slider" min="1" max="125" value="125" class="capacity-slider capacity-slider-max">
                </div>
                <input type="number" id="discovery-ffa-min" min="1" max="125" value="1" hidden>
                <input type="number" id="discovery-ffa-max" min="1" max="125" value="125" hidden>
              </div>
            </div>

            <div class="ld-mode-panel" id="discovery-team-config">
              <div class="ld-mode-panel-head">
                <span class="dot"></span>
                <span class="title">Teams · Format & size</span>
              </div>
              <div class="ld-format-label">FORMAT</div>
              <div class="ld-formats">
                ${this.renderChip('discovery-team-duos', 'Duos', 'Duos')}
                ${this.renderChip('discovery-team-trios', 'Trios', 'Trios')}
                ${this.renderChip('discovery-team-quads', 'Quads', 'Quads')}
                ${this.renderChip('discovery-team-hvn', 'Humans Vs Nations', 'HvN')}
              </div>
              <div class="ld-formats">
                ${this.renderChip('discovery-team-2', '2', '2 teams')}
                ${this.renderChip('discovery-team-3', '3', '3 teams')}
                ${this.renderChip('discovery-team-4', '4', '4 teams')}
                ${this.renderChip('discovery-team-5', '5', '5 teams')}
                ${this.renderChip('discovery-team-6', '6', '6 teams')}
                ${this.renderChip('discovery-team-7', '7', '7 teams')}
              </div>
              <div class="ld-formats" style="margin-bottom: 14px;">
                <button type="button" id="discovery-team-select-all" class="ld-chip">All</button>
                <button type="button" id="discovery-team-deselect-all" class="ld-chip">None</button>
              </div>
              <div class="ld-slider-row">
                <div class="ld-slider-label">
                  <span>Players per team</span>
                  <span class="val">
                    <span id="discovery-team-min-value">1</span>
                    <span class="sep">–</span>
                    <span id="discovery-team-max-value">62</span>
                  </span>
                </div>
                <div class="ld-range">
                  <div class="track"><div class="track-fill" id="discovery-team-range-fill"></div></div>
                  <input type="range" id="discovery-team-min-slider" min="1" max="62" value="1" class="capacity-slider capacity-slider-min">
                  <input type="range" id="discovery-team-max-slider" min="1" max="62" value="62" class="capacity-slider capacity-slider-max">
                </div>
                <input type="number" id="discovery-team-min" min="1" max="62" value="1" hidden>
                <input type="number" id="discovery-team-max" min="1" max="62" value="62" hidden>
              </div>
              <label class="ld-2x" aria-pressed="false">
                <input type="checkbox" id="discovery-team-two-times">
                <span class="check">${ICON_CHECK}</span>
                <span class="lbl">
                  <strong>2× lobby capacity</strong>
                  <span class="hint">total seats ≥ 2 × per-team min</span>
                </span>
              </label>
              <div class="ld-current-game-info" id="discovery-current-game-info" style="display: none;"></div>
            </div>
          </div>

          <div class="ld-section">
            <div class="ld-section-head">
              <div class="ld-section-label">Modifiers</div>
              <div class="ld-mods-legend">
                <span class="key"><span class="swatch"></span>Any</span>
                <span class="key"><span class="swatch req"></span>Req</span>
                <span class="key"><span class="swatch blk"></span>Block</span>
              </div>
            </div>

            <div class="ld-mod-group">
              <div class="ld-mod-group-label">Map</div>
              <div class="ld-mods discovery-modifier-grid">
                ${this.renderModifierChip('modifier-isCompact', 'Compact')}
                ${this.renderModifierChip('modifier-isRandomSpawn', 'Random Spawn')}
                ${this.renderModifierChip('modifier-isCrowded', 'Crowded')}
                ${this.renderModifierChip('modifier-isHardNations', 'Hard Nations')}
              </div>
            </div>

            <div class="ld-mod-group">
              <div class="ld-mod-group-label">Gameplay</div>
              <div class="ld-mods">
                ${this.renderModifierChip('modifier-isAlliancesDisabled', 'Alliances Off')}
                ${this.renderModifierChip('modifier-isPortsDisabled', 'Ports Off')}
                ${this.renderModifierChip('modifier-isNukesDisabled', 'Nukes Off')}
                ${this.renderModifierChip('modifier-isSAMsDisabled', 'SAMs Off')}
                ${this.renderModifierChip('modifier-isPeaceTime', 'Peace Time')}
                ${this.renderModifierChip('modifier-isWaterNukes', 'Water Nukes')}
              </div>
            </div>

            <div class="ld-mod-group">
              <div class="ld-mod-group-label">Economy</div>
              <div class="ld-mods">
                ${this.renderModifierChip('modifier-startingGold-1000000', 'Start Gold 1M')}
                ${this.renderModifierChip('modifier-startingGold-5000000', 'Start Gold 5M')}
                ${this.renderModifierChip('modifier-startingGold-25000000', 'Start Gold 25M')}
                ${this.renderModifierChip('modifier-goldMultiplier-2', 'Gold ×2')}
              </div>
            </div>

            <div class="ld-mods-hint">
              Click to cycle <strong>Any</strong> → <strong class="req">Required</strong> → <strong class="blk">Blocked</strong>.
            </div>
          </div>
        </div>
        <div class="discovery-footer">
          <div class="summary">
            <span class="num" id="discovery-filter-count">0</span>
            <span>active <span id="discovery-filter-word">filters</span></span>
          </div>
          <button type="button" class="reset" id="discovery-reset">Reset all</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);

    this.setupEventListeners();
    this.loadUIFromSettings();
    this.initializeSlider(
      'discovery-ffa-min-slider',
      'discovery-ffa-max-slider',
      'discovery-ffa-min',
      'discovery-ffa-max',
      'discovery-ffa-range-fill',
      'discovery-ffa-min-value',
      'discovery-ffa-max-value'
    );
    this.initializeSlider(
      'discovery-team-min-slider',
      'discovery-team-max-slider',
      'discovery-team-min',
      'discovery-team-max',
      'discovery-team-range-fill',
      'discovery-team-min-value',
      'discovery-team-max-value',
      true
    );
    this.updateStatusLabel();
    this.updateFilterCount();
    this.syncSearchTimer();
    this.startGameInfoUpdates();
  }

  private updateSleepState(): void {
    const onLobby = LobbyUtils.isOnLobbyPage();
    this.sleeping = !onLobby;

    if (this.sleeping) {
      this.panel.classList.add('hidden');
      this.stopTimer();
      this.stopGameInfoUpdates();
      this.updateQueueCardPulses(new Set());
    } else {
      this.panel.classList.remove('hidden');
      this.syncSearchTimer();
      this.startGameInfoUpdates();
    }
  }

  cleanup(): void {
    this.isDisposed = true;
    this.stopTimer();
    this.stopGameInfoUpdates();
    if (this.pulseSyncTimeout) {
      clearTimeout(this.pulseSyncTimeout);
      this.pulseSyncTimeout = null;
    }
    this.activeMatchSources.clear();
    this.applyQueueCardPulses();
    this.panel.parentNode?.removeChild(this.panel);
  }
}
