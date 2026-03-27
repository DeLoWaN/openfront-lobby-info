import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CurrentPlayerHighlighter } from '@/modules/lobby-discovery/CurrentPlayerHighlighter';

describe('CurrentPlayerHighlighter', () => {
  let highlighter: CurrentPlayerHighlighter;

  beforeEach(() => {
    document.body.innerHTML = '';
    highlighter = new CurrentPlayerHighlighter();
  });

  afterEach(() => {
    highlighter.stop();
    document.body.innerHTML = '';
  });

  it('boosts the current player chip in FFA layouts from currentClientID', () => {
    document.body.innerHTML = `
      <join-lobby-modal>
        <lobby-player-view></lobby-player-view>
      </join-lobby-modal>
    `;

    const view = document.querySelector('lobby-player-view') as any;
    view.currentClientID = 'me';
    view.clients = [
      { clientID: 'a', username: 'Other' },
      { clientID: 'me', username: 'Damien' },
    ];
    view.innerHTML = `
      <span class="player-tag">Other</span>
      <span class="player-tag">Damien</span>
    `;

    highlighter.start();

    const rows = Array.from(document.querySelectorAll('.player-tag'));
    expect(rows[1]?.classList.contains('of-current-player-boost')).toBe(true);
    expect(rows[0]?.classList.contains('of-current-player-boost')).toBe(false);
  });

  it('boosts the current player entry and team card in Team layouts from currentClientID', () => {
    document.body.innerHTML = `
      <join-lobby-modal>
        <lobby-player-view></lobby-player-view>
      </join-lobby-modal>
    `;

    const view = document.querySelector('lobby-player-view') as any;
    view.currentClientID = 'me';
    view.clients = [
      { clientID: 'me', username: 'Damien' },
      { clientID: 'b', username: 'Other' },
    ];
    view.teamPreview = [
      { team: 'Red', players: [{ clientID: 'me', username: 'Damien' }] },
      { team: 'Blue', players: [{ clientID: 'b', username: 'Other' }] },
    ];
    view.innerHTML = `
      <div class="bg-gray-800 border rounded-xl">
        <div class="team-player-row" data-client-id="me">Damien</div>
      </div>
      <div class="bg-gray-800 border rounded-xl">
        <div class="team-player-row" data-client-id="b">Other</div>
      </div>
    `;

    highlighter.start();

    const rows = Array.from(document.querySelectorAll('.team-player-row'));
    const cards = Array.from(document.querySelectorAll('.rounded-xl'));
    expect(rows[0]?.classList.contains('of-current-player-boost')).toBe(true);
    expect(rows[1]?.classList.contains('of-current-player-boost')).toBe(false);
    expect(cards[0]?.classList.contains('of-current-player-team-boost')).toBe(true);
    expect(cards[1]?.classList.contains('of-current-player-team-boost')).toBe(false);
  });

  it('does not scroll or replace the modal DOM to highlight the player', () => {
    const scrollIntoView = HTMLElement.prototype.scrollIntoView;
    let scrollCalls = 0;
    HTMLElement.prototype.scrollIntoView = () => {
      scrollCalls += 1;
    };

    document.body.innerHTML = `
      <join-lobby-modal>
        <lobby-player-view></lobby-player-view>
      </join-lobby-modal>
    `;

    const view = document.querySelector('lobby-player-view') as any;
    view.currentClientID = 'me';
    view.clients = [{ clientID: 'me', username: 'Damien' }];
    view.innerHTML = `<span class="player-tag">Damien</span>`;

    const player = document.querySelector('.player-tag');
    highlighter.start();

    expect(scrollCalls).toBe(0);
    expect(document.querySelector('.player-tag')).toBe(player);

    HTMLElement.prototype.scrollIntoView = scrollIntoView;
  });

  it('observes DOM changes without watching attributes to avoid recursive team crashes', () => {
    const OriginalMutationObserver = globalThis.MutationObserver;
    const observe = vi.fn();
    const disconnect = vi.fn();

    class FakeMutationObserver {
      constructor(_callback: MutationCallback) {}

      observe = observe;
      disconnect = disconnect;
      takeRecords = () => [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).MutationObserver = FakeMutationObserver as any;

    const isolatedHighlighter = new CurrentPlayerHighlighter();
    isolatedHighlighter.start();

    expect(observe).toHaveBeenCalled();
    expect(observe.mock.calls[0][0]).toBe(document.body);
    expect(observe.mock.calls[0][1]).toMatchObject({
      childList: true,
      subtree: true,
    });
    expect(observe.mock.calls[0][1]).not.toHaveProperty('attributes', true);

    isolatedHighlighter.stop();
    globalThis.MutationObserver = OriginalMutationObserver;
  });
});
