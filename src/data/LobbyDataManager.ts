/**
 * LobbyDataManager - Manages lobby data using the OpenFront 0.30 homepage
 * event as the primary source with HTTP polling as fallback.
 */

import { CONFIG } from '@/config/constants';
import type { Lobby, PublicGamesResponse } from '@/types/game';

type LobbyCallback = (lobbies: Lobby[]) => void;

interface LobbyDataManagerSingleton {
  subscribers: LobbyCallback[];
  fallbackInterval: ReturnType<typeof setInterval> | null;
  fallbackStartTimeout: ReturnType<typeof setTimeout> | null;
  lastLobbies: Lobby[];
  pollingRate: number;
  started: boolean;
  publicLobbiesListener: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  subscribe(callback: LobbyCallback): void;
  scheduleFallbackPolling(): void;
  startFallbackPolling(): void;
  stopFallbackPolling(): void;
  fetchData(): Promise<void>;
  notifySubscribers(): void;
  handlePublicLobbiesUpdate(event: Event): void;
  extractLobbies(payload: unknown): Lobby[];
}

export const LobbyDataManager: LobbyDataManagerSingleton = {
  subscribers: [],
  fallbackInterval: null,
  fallbackStartTimeout: null,
  lastLobbies: [],
  pollingRate: CONFIG.lobbyPollingRate,
  started: false,
  publicLobbiesListener: null,

  start() {
    if (this.started) {
      return;
    }

    this.started = true;
    this.publicLobbiesListener = (event) => this.handlePublicLobbiesUpdate(event);
    document.addEventListener('public-lobbies-update', this.publicLobbiesListener);
    this.scheduleFallbackPolling();
  },

  stop() {
    if (!this.started) {
      return;
    }

    this.started = false;
    if (this.publicLobbiesListener) {
      document.removeEventListener('public-lobbies-update', this.publicLobbiesListener);
      this.publicLobbiesListener = null;
    }
    if (this.fallbackStartTimeout) {
      clearTimeout(this.fallbackStartTimeout);
      this.fallbackStartTimeout = null;
    }
    this.stopFallbackPolling();
  },

  subscribe(callback: LobbyCallback) {
    this.subscribers.push(callback);
    if (this.lastLobbies.length > 0) {
      callback(this.lastLobbies);
    }
  },

  scheduleFallbackPolling() {
    if (!this.started || this.fallbackInterval || this.fallbackStartTimeout) {
      return;
    }

    this.fallbackStartTimeout = setTimeout(() => {
      this.fallbackStartTimeout = null;
      this.startFallbackPolling();
    }, this.pollingRate * 2);
  },

  startFallbackPolling() {
    if (this.fallbackInterval) return;

    void this.fetchData();
    this.fallbackInterval = setInterval(() => void this.fetchData(), this.pollingRate);
  },

  stopFallbackPolling() {
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  },

  async fetchData() {
    if (location.pathname !== '/' && !location.pathname.startsWith('/public-lobby')) {
      return;
    }

    try {
      const response = await fetch('/api/public_lobbies');

      if (response.status === 429) {
        console.warn('[Bundle] Rate limited.');
        return;
      }
      if (!response.ok) {
        console.warn(`[Bundle] API error: ${response.status}`);
        return;
      }

      const data = (await response.json()) as PublicGamesResponse;
      this.lastLobbies = this.extractLobbies(data);
      this.notifySubscribers();
    } catch (e) {
      console.error('[Bundle] API Error:', e);
    }
  },

  notifySubscribers() {
    this.subscribers.forEach((cb) => cb(this.lastLobbies));
  },

  handlePublicLobbiesUpdate(event: Event) {
    if (this.fallbackStartTimeout) {
      clearTimeout(this.fallbackStartTimeout);
      this.fallbackStartTimeout = null;
    }
    this.stopFallbackPolling();
    const payload = (event as CustomEvent<{ payload?: unknown }>).detail?.payload;
    this.lastLobbies = this.extractLobbies(payload);
    this.notifySubscribers();
    this.scheduleFallbackPolling();
  },

  extractLobbies(payload: unknown): Lobby[] {
    if (!payload || typeof payload !== 'object') {
      return [];
    }

    if (Array.isArray((payload as { lobbies?: Lobby[] }).lobbies)) {
      return (payload as { lobbies: Lobby[] }).lobbies;
    }

    const games = (payload as PublicGamesResponse).games;
    if (!games) {
      return [];
    }

    return (['ffa', 'team', 'special'] as const).flatMap((source) =>
      (games[source] ?? []).map((lobby) => ({
        ...lobby,
        publicGameType: lobby.publicGameType ?? source,
      }))
    );
  },
};
