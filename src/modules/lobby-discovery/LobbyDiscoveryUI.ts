/**
 * LobbyDiscoveryUI - notify-only discovery interface for matching lobbies.
 */

import { STORAGE_KEYS } from '@/config/constants';
import { LobbyUtils } from '@/utils/LobbyUtils';
import { BrowserNotificationUtils } from '@/utils/BrowserNotificationUtils';
import { ResizeHandler } from '@/utils/ResizeHandler';
import { SoundUtils } from '@/utils/SoundUtils';
import { URLObserver } from '@/utils/URLObserver';
import type { Lobby } from '@/types/game';
import type {
  DiscoveryCriteria,
  LegacyAutoJoinSettings,
  LobbyDiscoverySettings,
  ModifierFilters,
  ModifierFilterState,
  QueueSource,
  TeamCount,
} from './LobbyDiscoveryTypes';
import { LobbyDiscoveryEngine } from './LobbyDiscoveryEngine';
import {
  getBrowserNotificationContent,
  getGameDetailsText,
  getLobbyQueueSource,
  migrateLegacySettings,
} from './LobbyDiscoveryHelpers';

const STARTING_GOLD_VALUES = [1_000_000, 5_000_000, 25_000_000] as const;
const GOLD_MULTIPLIER_VALUES = [2] as const;
export class LobbyDiscoveryUI {
  private discoveryEnabled = true;
  private criteriaList: DiscoveryCriteria[] = [];
  private searchStartTime: number | null = null;
  private gameFoundTime: number | null = null;
  private soundEnabled = true;
  private desktopNotificationsEnabled = false;
  private activeMatchSources: Set<QueueSource> = new Set();
  private seenLobbies: Set<string> = new Set();
  private desktopNotifiedLobbies: Set<string> = new Set();
  private isTeamTwoTimesMinEnabled = false;
  private sleeping = false;

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private gameInfoInterval: ReturnType<typeof setInterval> | null = null;
  private pulseSyncTimeout: ReturnType<typeof setTimeout> | null = null;

  private panel!: HTMLDivElement;
  private engine: LobbyDiscoveryEngine;
  private resizeHandler: ResizeHandler | null = null;

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

  private migrateSettings(): void {
    const legacySettings = GM_getValue<LegacyAutoJoinSettings | null>('autoJoinSettings', null);
    const currentSettings = GM_getValue<LobbyDiscoverySettings | null>(
      STORAGE_KEYS.lobbyDiscoverySettings,
      null
    );

    const migrated = migrateLegacySettings(legacySettings, currentSettings);
    GM_setValue(STORAGE_KEYS.lobbyDiscoverySettings, migrated);
  }

  private loadSettings(): void {
    this.migrateSettings();

    const saved = GM_getValue<LobbyDiscoverySettings | null>(
      STORAGE_KEYS.lobbyDiscoverySettings,
      null
    );

    if (!saved) {
      return;
    }

    this.criteriaList = saved.criteria || [];
    this.soundEnabled = saved.soundEnabled !== undefined ? saved.soundEnabled : true;
    this.desktopNotificationsEnabled =
      saved.desktopNotificationsEnabled !== undefined ? saved.desktopNotificationsEnabled : false;
    this.discoveryEnabled = saved.discoveryEnabled !== undefined ? saved.discoveryEnabled : true;
    this.isTeamTwoTimesMinEnabled = saved.isTeamTwoTimesMinEnabled || false;
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

  private updateSearchTimer(): void {
    const timerElement = document.getElementById('discovery-search-timer');
    if (!timerElement) return;

    if (
      !this.discoveryEnabled ||
      this.criteriaList.length === 0 ||
      this.searchStartTime === null ||
      !this.isDiscoveryFeedbackAllowed()
    ) {
      timerElement.style.display = 'none';
      return;
    }

    const endTime = this.gameFoundTime ?? Date.now();
    const elapsed = Math.floor((endTime - this.searchStartTime) / 1000);
    timerElement.textContent = this.gameFoundTime
      ? `Match found (${Math.floor(elapsed / 60)}m ${elapsed % 60}s)`
      : `Scanning ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    timerElement.style.display = 'inline';
  }

  private updateCurrentGameInfo(): void {
    const gameInfoElement = document.getElementById('discovery-current-game-info');
    if (!gameInfoElement || !LobbyUtils.isOnLobbyPage()) {
      if (gameInfoElement) {
        gameInfoElement.style.display = 'none';
      }
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
    gameInfoElement.classList.remove('not-applicable');
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
        this.gameFoundTime = null;
        this.updateSearchTimer();
        return;
      }

      const displayedLobbies = this.getDisplayedLobbiesBySource(lobbies);
      const matchedSources = new Set<QueueSource>();
      const matchedKeys = new Set<string>();
      const newMatches: Lobby[] = [];
      let hasNewMatch = false;

      for (const [source, lobby] of Object.entries(displayedLobbies) as Array<
        [QueueSource, Lobby | undefined]
      >) {
        if (!lobby) continue;
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
        if (!this.seenLobbies.has(notificationKey)) {
          hasNewMatch = true;
        }
        if (!this.desktopNotifiedLobbies.has(notificationKey)) {
          newMatches.push(lobby);
        }
      }

      this.updateQueueCardPulses(matchedSources);
      if (hasNewMatch && this.soundEnabled) {
        SoundUtils.playGameFoundSound();
      }
      if (this.desktopNotificationsEnabled) {
        const deliveredNotificationKeys = new Set<string>();
        for (const lobby of newMatches) {
          const notificationContent = getBrowserNotificationContent(lobby);
          const notificationKey = this.getNotificationKey(lobby);
          const delivered = BrowserNotificationUtils.show({
            title: notificationContent.title,
            body: notificationContent.body,
            tag: notificationKey,
          });
          if (delivered) {
            deliveredNotificationKeys.add(notificationKey);
          }
        }
        this.desktopNotifiedLobbies = new Set([
          ...[...this.desktopNotifiedLobbies].filter((key) => matchedKeys.has(key)),
          ...deliveredNotificationKeys,
        ]);
      } else {
        this.desktopNotifiedLobbies.clear();
      }

      this.seenLobbies = matchedKeys;
      this.gameFoundTime = matchedKeys.size > 0 ? this.gameFoundTime ?? Date.now() : null;
      this.updateSearchTimer();
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
    if (!LobbyUtils.isOnLobbyPage()) {
      return false;
    }

    const pagePlay = document.getElementById('page-play');
    if (pagePlay?.classList.contains('hidden')) {
      return false;
    }

    const publicLobby = document.querySelector('public-lobby') as
      | { isLobbyHighlighted?: boolean }
      | null;
    if (publicLobby?.isLobbyHighlighted === true) {
      return false;
    }

    const joinLobbyModal = document.querySelector('join-lobby-modal') as
      | { currentLobbyId?: string }
      | null;
    if (joinLobbyModal?.currentLobbyId) {
      return false;
    }

    const hostLobbyModal = document.querySelector('host-lobby-modal') as
      | { lobbyId?: string }
      | null;
    if (hostLobbyModal?.lobbyId) {
      return false;
    }

    return true;
  }

  private getDisplayedLobbiesBySource(
    lobbies: Lobby[]
  ): Partial<Record<QueueSource, Lobby>> {
    const displayed: Partial<Record<QueueSource, Lobby>> = {};

    for (const lobby of lobbies) {
      const source = getLobbyQueueSource(lobby);
      if (!source || displayed[source]) {
        continue;
      }

      displayed[source] = lobby;
    }

    return displayed;
  }

  private getQueueCardElements(): Partial<Record<QueueSource, HTMLElement>> {
    const selector = document.querySelector('game-mode-selector') as HTMLElement | null;
    if (!selector) {
      return {};
    }

    const desktopGrid = Array.from(selector.querySelectorAll('div')).find((element) =>
      element.className.includes('sm:grid-cols-[2fr_1fr]')
    );
    if (!(desktopGrid instanceof HTMLElement)) {
      return {};
    }

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

      const isActive = this.activeMatchSources.has(source);

      card.classList.toggle('of-discovery-card-active', isActive);
      card.classList.remove('of-discovery-card-burst');
      const badge = card.querySelector('.of-discovery-card-badge') as HTMLElement | null;
      if (badge) {
        badge.remove();
      }
    }
  }

  private scheduleQueueCardPulseSync(): void {
    if (this.pulseSyncTimeout) {
      clearTimeout(this.pulseSyncTimeout);
    }

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
      this.gameFoundTime = null;
      this.seenLobbies.clear();
      this.desktopNotifiedLobbies.clear();
    }

    if (
      this.discoveryEnabled &&
      this.criteriaList.length > 0 &&
      this.isDiscoveryFeedbackAllowed()
    ) {
      if (this.searchStartTime === null) {
        this.searchStartTime = Date.now();
      }
      this.timerInterval = setInterval(() => this.updateSearchTimer(), 1000);
    } else {
      this.searchStartTime = null;
      this.gameFoundTime = null;
    }

    this.updateSearchTimer();
  }

  private setDiscoveryEnabled(enabled: boolean, options: { resetTimer?: boolean } = {}): void {
    this.discoveryEnabled = enabled;
    this.saveSettings();
    this.updateUI();
    this.syncSearchTimer({ resetStart: options.resetTimer ?? false });
  }

  private getNumberValue(id: string): number | null {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) return null;
    const val = parseInt(input.value, 10);
    return Number.isNaN(val) ? null : val;
  }

  private getModifierFilterValue(id: string): ModifierFilterState {
    const allowedButton = document.getElementById(
      `${id}-allowed`
    ) as HTMLButtonElement | null;
    const blockedButton = document.getElementById(
      `${id}-blocked`
    ) as HTMLButtonElement | null;

    if (blockedButton?.getAttribute('aria-pressed') === 'true') {
      return 'blocked';
    }

    return allowedButton?.getAttribute('aria-pressed') === 'false' ? 'blocked' : 'allowed';
  }

  private getNumericModifierState(
    ids: Record<number, string>
  ): Record<number, ModifierFilterState> | undefined {
    const states: Record<number, ModifierFilterState> = {};

    for (const [numericValue, id] of Object.entries(ids)) {
      states[Number(numericValue)] = this.getModifierFilterValue(id);
    }

    return states;
  }

  private getModifierFiltersFromUI(): ModifierFilters {
    return {
      isCompact: this.getModifierFilterValue('modifier-isCompact'),
      isRandomSpawn: this.getModifierFilterValue('modifier-isRandomSpawn'),
      isCrowded: this.getModifierFilterValue('modifier-isCrowded'),
      isHardNations: this.getModifierFilterValue('modifier-isHardNations'),
      isAlliancesDisabled: this.getModifierFilterValue('modifier-isAlliancesDisabled'),
      isPortsDisabled: this.getModifierFilterValue('modifier-isPortsDisabled'),
      isNukesDisabled: this.getModifierFilterValue('modifier-isNukesDisabled'),
      isSAMsDisabled: this.getModifierFilterValue('modifier-isSAMsDisabled'),
      isPeaceTime: this.getModifierFilterValue('modifier-isPeaceTime'),
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
    const ids = [
      'discovery-team-duos',
      'discovery-team-trios',
      'discovery-team-quads',
      'discovery-team-hvn',
      'discovery-team-2',
      'discovery-team-3',
      'discovery-team-4',
      'discovery-team-5',
      'discovery-team-6',
      'discovery-team-7',
    ];

    for (const id of ids) {
      const checkbox = document.getElementById(id) as HTMLInputElement | null;
      if (!checkbox?.checked) {
        continue;
      }

      if (
        checkbox.value === 'Duos' ||
        checkbox.value === 'Trios' ||
        checkbox.value === 'Quads' ||
        checkbox.value === 'Humans Vs Nations'
      ) {
        values.push(checkbox.value);
      } else {
        const numeric = parseInt(checkbox.value, 10);
        if (!Number.isNaN(numeric)) {
          values.push(numeric);
        }
      }
    }

    return values;
  }

  private setAllTeamCounts(checked: boolean): void {
    const ids = [
      'discovery-team-duos',
      'discovery-team-trios',
      'discovery-team-quads',
      'discovery-team-hvn',
      'discovery-team-2',
      'discovery-team-3',
      'discovery-team-4',
      'discovery-team-5',
      'discovery-team-6',
      'discovery-team-7',
    ];

    for (const id of ids) {
      const checkbox = document.getElementById(id) as HTMLInputElement | null;
      if (checkbox) {
        checkbox.checked = checked;
      }
    }
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
    if (!teamCheckbox?.checked) {
      return criteria;
    }

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

  private updateUI(): void {
    const statusText = document.querySelector('.status-text') as HTMLElement | null;
    const statusIndicator = document.querySelector('.status-indicator') as HTMLElement | null;

    if (!statusText || !statusIndicator) return;

    if (this.discoveryEnabled) {
      statusText.textContent = 'Discovery Active';
      statusIndicator.style.background = '#38d9a9';
      statusIndicator.classList.add('active');
      statusIndicator.classList.remove('inactive');
    } else {
      statusText.textContent = 'Discovery Paused';
      statusIndicator.style.background = '#888';
      statusIndicator.classList.remove('active');
      statusIndicator.classList.add('inactive');
    }
  }

  private applyModeVisibility(id: string, visible: boolean): void {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle('is-disabled', !visible);
    }
  }

  private setTeamCountSelections(values: Array<TeamCount | null | undefined>): void {
    for (const teamCount of values) {
      let checkbox: HTMLInputElement | null = null;
      if (teamCount === 'Duos') checkbox = document.getElementById('discovery-team-duos') as HTMLInputElement;
      else if (teamCount === 'Trios') checkbox = document.getElementById('discovery-team-trios') as HTMLInputElement;
      else if (teamCount === 'Quads') checkbox = document.getElementById('discovery-team-quads') as HTMLInputElement;
      else if (teamCount === 'Humans Vs Nations') checkbox = document.getElementById('discovery-team-hvn') as HTMLInputElement;
      else if (typeof teamCount === 'number') checkbox = document.getElementById(`discovery-team-${teamCount}`) as HTMLInputElement;
      if (checkbox) checkbox.checked = true;
    }
  }

  private setModifierControl(id: string, value: ModifierFilterState | undefined): void {
    const state = value ?? 'allowed';
    const control = document.getElementById(id) as HTMLDivElement | null;
    const allowedButton = document.getElementById(
      `${id}-allowed`
    ) as HTMLButtonElement | null;
    const blockedButton = document.getElementById(
      `${id}-blocked`
    ) as HTMLButtonElement | null;

    if (!control || !allowedButton || !blockedButton) return;

    control.dataset.state = state;
    control.setAttribute('aria-valuetext', state);
    allowedButton.setAttribute('aria-pressed', String(state === 'allowed'));
    blockedButton.setAttribute('aria-pressed', String(state === 'blocked'));
  }

  private loadUIFromSettings(): void {
    const ffaCriteria = this.criteriaList.find((c) => c.gameMode === 'FFA');
    const teamCriteria = this.criteriaList.filter((c) => c.gameMode === 'Team');

    const ffaCheckbox = document.getElementById('discovery-ffa') as HTMLInputElement | null;
    const teamCheckbox = document.getElementById('discovery-team') as HTMLInputElement | null;
    if (ffaCheckbox) {
      ffaCheckbox.checked = !!ffaCriteria;
      this.applyModeVisibility('discovery-ffa-config', !!ffaCriteria);
    }
    if (teamCheckbox) {
      teamCheckbox.checked = teamCriteria.length > 0;
      this.applyModeVisibility('discovery-team-config', teamCriteria.length > 0);
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
      this.setTeamCountSelections(teamCriteria.map((criterion) => criterion.teamCount));
    }

    const modifierCriteria = ffaCriteria ?? teamCriteria[0];
    const modifiers = modifierCriteria?.modifiers;
    if (modifiers) {
      this.setModifierControl('modifier-isCompact', modifiers.isCompact);
      this.setModifierControl('modifier-isRandomSpawn', modifiers.isRandomSpawn);
      this.setModifierControl('modifier-isCrowded', modifiers.isCrowded);
      this.setModifierControl('modifier-isHardNations', modifiers.isHardNations);
      this.setModifierControl('modifier-isAlliancesDisabled', modifiers.isAlliancesDisabled);
      this.setModifierControl('modifier-isPortsDisabled', modifiers.isPortsDisabled);
      this.setModifierControl('modifier-isNukesDisabled', modifiers.isNukesDisabled);
      this.setModifierControl('modifier-isSAMsDisabled', modifiers.isSAMsDisabled);
      this.setModifierControl('modifier-isPeaceTime', modifiers.isPeaceTime);

      for (const value of STARTING_GOLD_VALUES) {
        this.setModifierControl(
          `modifier-startingGold-${value}`,
          modifiers.startingGold?.[value]
        );
      }

      for (const value of GOLD_MULTIPLIER_VALUES) {
        this.setModifierControl(
          `modifier-goldMultiplier-${value}`,
          modifiers.goldMultiplier?.[value]
        );
      }
    } else {
      for (const id of [
        'modifier-isCompact',
        'modifier-isRandomSpawn',
        'modifier-isCrowded',
        'modifier-isHardNations',
        'modifier-isAlliancesDisabled',
        'modifier-isPortsDisabled',
        'modifier-isNukesDisabled',
        'modifier-isSAMsDisabled',
        'modifier-isPeaceTime',
        'modifier-startingGold-1000000',
        'modifier-startingGold-5000000',
        'modifier-startingGold-25000000',
        'modifier-goldMultiplier-2',
      ]) {
        this.setModifierControl(id, 'allowed');
      }
    }

    const soundCheckbox = document.getElementById('discovery-sound-toggle') as HTMLInputElement | null;
    if (soundCheckbox) {
      soundCheckbox.checked = this.soundEnabled;
    }

    const desktopCheckbox = document.getElementById(
      'discovery-desktop-toggle'
    ) as HTMLInputElement | null;
    if (desktopCheckbox) {
      desktopCheckbox.checked = this.desktopNotificationsEnabled;
    }

    const twoTimesCheckbox = document.getElementById('discovery-team-two-times') as HTMLInputElement | null;
    if (twoTimesCheckbox) {
      twoTimesCheckbox.checked = this.isTeamTwoTimesMinEnabled;
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
    const fill = document.getElementById(fillId);
    const minValueSpan = document.getElementById(minValueId);
    const maxValueSpan = document.getElementById(maxValueId);

    if (!minSlider || !maxSlider || !minInput || !maxInput) return;

    let minVal = parseInt(minSlider.value, 10);
    let maxVal = parseInt(maxSlider.value, 10);

    if (applyTwoTimesConstraint && this.isTeamTwoTimesMinEnabled) {
      maxVal = Math.min(parseInt(maxSlider.max, 10), Math.max(1, 2 * minVal));
      maxSlider.value = String(maxVal);
    }

    if (minVal > maxVal) {
      minVal = maxVal;
      minSlider.value = String(minVal);
    }

    minInput.value = String(minVal);
    maxInput.value = String(maxVal);

    if (minValueSpan) {
      minValueSpan.textContent = minVal === 1 ? 'Any' : String(minVal);
    }
    if (maxValueSpan) {
      maxValueSpan.textContent = maxVal === parseInt(maxSlider.max, 10) ? 'Any' : String(maxVal);
    }

    if (fill) {
      const minPercent =
        ((minVal - parseInt(minSlider.min, 10)) /
          (parseInt(minSlider.max, 10) - parseInt(minSlider.min, 10))) *
        100;
      const maxPercent =
        ((maxVal - parseInt(minSlider.min, 10)) /
          (parseInt(maxSlider.max, 10) - parseInt(maxSlider.min, 10))) *
        100;
      fill.style.left = `${minPercent}%`;
      fill.style.width = `${maxPercent - minPercent}%`;
    }
  }

  private refreshCriteria(): void {
    this.criteriaList = this.buildCriteriaFromUI();
    this.saveSettings();
    this.syncSearchTimer({ resetStart: true });
  }

  private async handleDesktopNotificationToggleChange(
    desktopToggle: HTMLInputElement
  ): Promise<void> {
    if (!desktopToggle.checked) {
      this.desktopNotificationsEnabled = false;
      this.saveSettings();
      return;
    }

    const permissionGranted = await BrowserNotificationUtils.ensurePermission();
    this.desktopNotificationsEnabled = permissionGranted;

    desktopToggle.checked = permissionGranted;
    desktopToggle.toggleAttribute('checked', permissionGranted);

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
        this.applyModeVisibility(configId, checkbox.checked);
        this.refreshCriteria();
      });
    }

    const twoTimesCheckbox = document.getElementById('discovery-team-two-times') as HTMLInputElement | null;
    twoTimesCheckbox?.addEventListener('change', () => {
      this.isTeamTwoTimesMinEnabled = twoTimesCheckbox.checked;
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

    for (const id of [
      'discovery-team-2',
      'discovery-team-3',
      'discovery-team-4',
      'discovery-team-5',
      'discovery-team-6',
      'discovery-team-7',
      'discovery-team-duos',
      'discovery-team-trios',
      'discovery-team-quads',
      'discovery-team-hvn',
      'discovery-sound-toggle',
      'discovery-desktop-toggle',
    ]) {
      const element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
      if (!element) continue;
      element.addEventListener('change', () => {
        if (id === 'discovery-sound-toggle' && element instanceof HTMLInputElement) {
          this.soundEnabled = element.checked;
          this.saveSettings();
          return;
        }
        if (id === 'discovery-desktop-toggle' && element instanceof HTMLInputElement) {
          void this.handleDesktopNotificationToggleChange(element);
          return;
        }
        this.refreshCriteria();
      });
    }

    for (const id of [
      'modifier-isCompact',
      'modifier-isRandomSpawn',
      'modifier-isCrowded',
      'modifier-isHardNations',
      'modifier-isAlliancesDisabled',
      'modifier-isPortsDisabled',
      'modifier-isNukesDisabled',
      'modifier-isSAMsDisabled',
      'modifier-isPeaceTime',
      'modifier-startingGold-1000000',
      'modifier-startingGold-5000000',
      'modifier-startingGold-25000000',
      'modifier-goldMultiplier-2',
    ]) {
      const allowedButton = document.getElementById(
        `${id}-allowed`
      ) as HTMLButtonElement | null;
      const blockedButton = document.getElementById(
        `${id}-blocked`
      ) as HTMLButtonElement | null;

      for (const button of [allowedButton, blockedButton]) {
        button?.addEventListener('click', () => {
          this.setModifierControl(id, button.dataset.value as ModifierFilterState);
          this.refreshCriteria();
        });
      }
    }
  }

  private createModifierControl(id: string): string {
    return `
      <div
        id="${id}"
        class="discovery-binary-toggle"
        data-state="allowed"
        role="group"
        aria-valuetext="allowed"
      >
        <button
            type="button"
            class="discovery-binary-option"
            id="${id}-allowed"
            data-value="allowed"
            aria-pressed="true"
          >
          <span class="discovery-binary-label">Allowed</span>
        </button>
        <button
            type="button"
            class="discovery-binary-option"
            id="${id}-blocked"
            data-value="blocked"
            aria-pressed="false"
          >
          <span class="discovery-binary-label">Blocked</span>
        </button>
      </div>
    `;
  }

  private createUI(): void {
    if (document.getElementById('openfront-discovery-panel')) {
      return;
    }

    this.panel = document.createElement('div');
    this.panel.id = 'openfront-discovery-panel';
    this.panel.className = 'of-panel discovery-panel';
    this.panel.style.width = '560px';
    this.panel.innerHTML = `
      <div class="of-header discovery-header">
        <div class="discovery-title">
          <span class="discovery-title-text">Lobby Discovery</span>
          <span class="discovery-title-sub">NOTIFY ONLY</span>
        </div>
      </div>
      <div class="discovery-body">
        <div class="of-content discovery-content" style="overflow-y: auto;">
          <div class="discovery-status-bar">
            <div class="discovery-status" id="discovery-status">
              <span class="status-indicator"></span>
              <span class="status-text">Discovery Active</span>
              <span class="search-timer" id="discovery-search-timer" style="display: none;"></span>
            </div>
            <label class="discovery-toggle-label">
              <input type="checkbox" id="discovery-sound-toggle">
              <span>Sound</span>
            </label>
            <label class="discovery-toggle-label">
              <input type="checkbox" id="discovery-desktop-toggle">
              <span>Desktop</span>
            </label>
          </div>
          <div class="discovery-modes" id="discovery-modes">
              <div class="discovery-section">
                <div class="discovery-section-title">Modes</div>
                <div class="discovery-config-grid">
                  <div class="discovery-mode-config discovery-config-card">
                    <label class="mode-checkbox-label">
                      <input type="checkbox" id="discovery-ffa" value="FFA">
                      <span>FFA</span>
                    </label>
                    <div class="discovery-mode-inner" id="discovery-ffa-config">
                      <div class="player-filter-info"><small>Filter by lobby capacity:</small></div>
                      <div class="capacity-range-wrapper">
                        <div class="capacity-range-visual">
                          <div class="capacity-track">
                            <div class="capacity-range-fill" id="discovery-ffa-range-fill"></div>
                            <input type="range" id="discovery-ffa-min-slider" min="1" max="125" value="1" class="capacity-slider capacity-slider-min">
                            <input type="range" id="discovery-ffa-max-slider" min="1" max="125" value="125" class="capacity-slider capacity-slider-max">
                          </div>
                          <div class="capacity-labels">
                            <div class="capacity-label-group"><label for="discovery-ffa-min-slider">Min:</label><span class="capacity-value" id="discovery-ffa-min-value">1</span></div>
                            <div class="capacity-label-group"><label for="discovery-ffa-max-slider">Max:</label><span class="capacity-value" id="discovery-ffa-max-value">125</span></div>
                          </div>
                        </div>
                        <div class="capacity-inputs-hidden">
                          <input type="number" id="discovery-ffa-min" min="1" max="125" style="display: none;">
                          <input type="number" id="discovery-ffa-max" min="1" max="125" style="display: none;">
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="discovery-mode-config discovery-config-card">
                    <label class="mode-checkbox-label">
                      <input type="checkbox" id="discovery-team" value="Team">
                      <span>Team</span>
                    </label>
                    <div class="discovery-mode-inner" id="discovery-team-config">
                      <div class="team-count-section">
                        <label>Formats (optional):</label>
                        <div>
                          <button type="button" id="discovery-team-select-all" class="select-all-btn">Select All</button>
                          <button type="button" id="discovery-team-deselect-all" class="select-all-btn">Deselect All</button>
                        </div>
                        <div class="team-count-options-centered">
                          <div class="team-count-column">
                            <label><input type="checkbox" id="discovery-team-duos" value="Duos"> Duos</label>
                            <label><input type="checkbox" id="discovery-team-trios" value="Trios"> Trios</label>
                            <label><input type="checkbox" id="discovery-team-quads" value="Quads"> Quads</label>
                            <label><input type="checkbox" id="discovery-team-hvn" value="Humans Vs Nations"> HvN</label>
                          </div>
                          <div class="team-count-column">
                            <label><input type="checkbox" id="discovery-team-2" value="2"> 2 teams</label>
                            <label><input type="checkbox" id="discovery-team-3" value="3"> 3 teams</label>
                            <label><input type="checkbox" id="discovery-team-4" value="4"> 4 teams</label>
                          </div>
                          <div class="team-count-column">
                            <label><input type="checkbox" id="discovery-team-5" value="5"> 5 teams</label>
                            <label><input type="checkbox" id="discovery-team-6" value="6"> 6 teams</label>
                            <label><input type="checkbox" id="discovery-team-7" value="7"> 7 teams</label>
                          </div>
                        </div>
                      </div>
                      <div class="player-filter-info"><small>Filter by lobby capacity:</small></div>
                      <div class="capacity-range-wrapper">
                        <div class="capacity-range-visual">
                          <div class="capacity-track">
                            <div class="capacity-range-fill" id="discovery-team-range-fill"></div>
                            <input type="range" id="discovery-team-min-slider" min="1" max="62" value="1" class="capacity-slider capacity-slider-min">
                            <input type="range" id="discovery-team-max-slider" min="1" max="62" value="62" class="capacity-slider capacity-slider-max">
                          </div>
                          <div class="capacity-labels">
                            <div class="capacity-label-group"><label for="discovery-team-min-slider">Min:</label><span class="capacity-value" id="discovery-team-min-value">1</span></div>
                            <div class="three-times-checkbox"><label for="discovery-team-two-times">2×</label><input type="checkbox" id="discovery-team-two-times"></div>
                            <div class="capacity-label-group"><label for="discovery-team-max-slider">Max:</label><span class="capacity-value" id="discovery-team-max-value">62</span></div>
                          </div>
                        </div>
                        <div class="capacity-inputs-hidden">
                          <input type="number" id="discovery-team-min" min="1" max="62" style="display: none;">
                          <input type="number" id="discovery-team-max" min="1" max="62" style="display: none;">
                        </div>
                      </div>
                      <div class="current-game-info" id="discovery-current-game-info" style="display: none;"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="discovery-section">
                <div class="discovery-section-title">Modifiers</div>
                <div class="discovery-mode-config discovery-config-card discovery-modifier-grid">
                  <label><span>Compact</span>${this.createModifierControl('modifier-isCompact')}</label>
                  <label><span>Random Spawn</span>${this.createModifierControl('modifier-isRandomSpawn')}</label>
                  <label><span>Crowded</span>${this.createModifierControl('modifier-isCrowded')}</label>
                  <label><span>Hard Nations</span>${this.createModifierControl('modifier-isHardNations')}</label>
                  <label><span>Alliances Disabled</span>${this.createModifierControl('modifier-isAlliancesDisabled')}</label>
                  <label><span>Ports Disabled</span>${this.createModifierControl('modifier-isPortsDisabled')}</label>
                  <label><span>Nukes Disabled</span>${this.createModifierControl('modifier-isNukesDisabled')}</label>
                  <label><span>SAMs Disabled</span>${this.createModifierControl('modifier-isSAMsDisabled')}</label>
                  <label><span>Peace Time</span>${this.createModifierControl('modifier-isPeaceTime')}</label>
                  <label><span>Starting Gold 1M</span>${this.createModifierControl('modifier-startingGold-1000000')}</label>
                  <label><span>Starting Gold 5M</span>${this.createModifierControl('modifier-startingGold-5000000')}</label>
                  <label><span>Starting Gold 25M</span>${this.createModifierControl('modifier-startingGold-25000000')}</label>
                  <label><span>Gold Multiplier x2</span>${this.createModifierControl('modifier-goldMultiplier-2')}</label>
                </div>
              </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.resizeHandler = new ResizeHandler(
      this.panel,
      (width) => {
        this.panel.style.width = `${width}px`;
      },
      STORAGE_KEYS.lobbyDiscoveryPanelSize,
      460,
      88
    );

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
    this.updateUI();
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
    this.stopTimer();
    this.stopGameInfoUpdates();
    if (this.pulseSyncTimeout) {
      clearTimeout(this.pulseSyncTimeout);
      this.pulseSyncTimeout = null;
    }
    this.activeMatchSources.clear();
    this.resizeHandler?.destroy();
    this.resizeHandler = null;
    this.applyQueueCardPulses();
    this.panel.parentNode?.removeChild(this.panel);
  }
}
