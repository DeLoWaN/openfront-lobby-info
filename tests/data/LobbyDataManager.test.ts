import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LobbyDataManager } from '@/data/LobbyDataManager';

describe('LobbyDataManager', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    LobbyDataManager.stop();
    LobbyDataManager.subscribers = [];
    LobbyDataManager.lastLobbies = [];
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: vi.fn().mockResolvedValue({ games: { ffa: [], team: [], special: [] } }),
    }) as any;
  });

  afterEach(() => {
    LobbyDataManager.stop();
    LobbyDataManager.subscribers = [];
    LobbyDataManager.lastLobbies = [];
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('does not start fallback polling while push updates keep arriving', async () => {
    LobbyDataManager.start();

    for (let index = 0; index < 3; index += 1) {
      document.dispatchEvent(
        new CustomEvent('public-lobbies-update', {
          detail: {
            payload: {
              lobbies: [
                {
                  gameID: `push-${index}`,
                  publicGameType: 'ffa',
                  gameConfig: { gameMode: 'Free For All' },
                },
              ],
            },
          },
        })
      );

      await vi.advanceTimersByTimeAsync(LobbyDataManager.pollingRate);
    }

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('starts fallback polling after push updates go quiet', async () => {
    LobbyDataManager.start();

    await vi.advanceTimersByTimeAsync(LobbyDataManager.pollingRate * 2);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
