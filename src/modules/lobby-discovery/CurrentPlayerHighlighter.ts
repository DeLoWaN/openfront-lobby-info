/**
 * Additive enhancer for the native join-lobby modal player list.
 */

interface LobbyClient {
  clientID?: string;
  username?: string;
  clanTag?: string | null;
}

interface TeamPreview {
  players?: LobbyClient[];
}

interface LobbyPlayerViewElement extends HTMLElement {
  currentClientID?: string;
  clients?: LobbyClient[];
  teamPreview?: TeamPreview[];
}

export class CurrentPlayerHighlighter {
  private observer: MutationObserver | null = null;
  private animationFrameId: number | null = null;

  start(): void {
    if (this.observer) {
      return;
    }

    this.observer = new MutationObserver(() => this.scheduleApplyHighlights());
    this.observer.observe(document.body, {
      attributes: false,
      childList: true,
      subtree: true,
    });

    this.applyHighlights();
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private scheduleApplyHighlights(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.applyHighlights();
    });
  }

  private applyHighlights(): void {
    for (const view of Array.from(document.querySelectorAll('lobby-player-view'))) {
      this.applyHighlightToView(view as LobbyPlayerViewElement);
    }
  }

  private applyHighlightToView(view: LobbyPlayerViewElement): void {
    this.clearHighlights(view);

    const nativeFfaRows = Array.from(
      view.querySelectorAll<HTMLElement>('.player-tag.current-player')
    );
    if (nativeFfaRows.length > 0) {
      nativeFfaRows.forEach((row) => row.classList.add('of-current-player-boost'));
      return;
    }

    const nativeTeamRows = this.getNativeTeamRows(view);
    nativeTeamRows.forEach((row) => row.classList.add('of-current-player-boost'));

    const nativeTeamCards = this.getNativeTeamCards(view);
    nativeTeamCards.forEach((card) => card.classList.add('of-current-player-team-boost'));

    if (nativeTeamRows.length > 0 || nativeTeamCards.length > 0) {
      return;
    }

    this.applyFallbackHighlight(view);
  }

  private clearHighlights(view: ParentNode): void {
    view.querySelectorAll('.of-current-player-boost').forEach((element) => {
      element.classList.remove('of-current-player-boost');
    });
    view.querySelectorAll('.of-current-player-team-boost').forEach((element) => {
      element.classList.remove('of-current-player-team-boost');
    });
  }

  private getNativeTeamRows(view: ParentNode): HTMLElement[] {
    return Array.from(view.querySelectorAll<HTMLElement>('div')).filter((element) => {
      const classList = element.classList;
      return (
        classList.contains('bg-sky-600/20') &&
        classList.contains('border-sky-500/40')
      );
    });
  }

  private getNativeTeamCards(view: ParentNode): HTMLElement[] {
    return Array.from(view.querySelectorAll<HTMLElement>('div')).filter((element) => {
      const classList = element.classList;
      return classList.contains('rounded-xl') && classList.contains('border-sky-500/60');
    });
  }

  private applyFallbackHighlight(view: LobbyPlayerViewElement): void {
    const currentClientID = view.currentClientID;
    const clients = Array.isArray(view.clients) ? view.clients : [];
    if (!currentClientID || clients.length === 0) {
      return;
    }

    const currentClientIndex = clients.findIndex(
      (client) => client?.clientID === currentClientID
    );
    if (currentClientIndex < 0) {
      return;
    }

    const currentClient = clients[currentClientIndex];
    const displayName = this.formatDisplayName(currentClient);

    const ffaRows = Array.from(view.querySelectorAll<HTMLElement>('.player-tag'));
    if (ffaRows[currentClientIndex]) {
      ffaRows[currentClientIndex].classList.add('of-current-player-boost');
      return;
    }

    const exactRows = Array.from(view.querySelectorAll<HTMLElement>('[data-client-id]')).filter(
      (row) => row.dataset.clientId === currentClientID
    );
    exactRows.forEach((row) => row.classList.add('of-current-player-boost'));

    const matchingTextRows = this.findRowsByDisplayName(view, displayName);
    matchingTextRows.forEach((row) => row.classList.add('of-current-player-boost'));

    const teamCards = Array.from(view.querySelectorAll<HTMLElement>('.rounded-xl'));
    const teamPreview = Array.isArray(view.teamPreview) ? view.teamPreview : [];
    const activePreviews = teamPreview.filter(
      (preview) => Array.isArray(preview.players) && preview.players.length > 0
    );
    const currentTeamIndex = activePreviews.findIndex((preview) =>
      Array.isArray(preview.players) &&
      preview.players.some((player) => player?.clientID === currentClientID)
    );

    if (currentTeamIndex >= 0 && teamCards[currentTeamIndex]) {
      teamCards[currentTeamIndex].classList.add('of-current-player-team-boost');

      const cardRows = this.findRowsByDisplayName(teamCards[currentTeamIndex], displayName);
      cardRows.forEach((row) => row.classList.add('of-current-player-boost'));
    }
  }

  private formatDisplayName(client: LobbyClient | undefined): string {
    if (!client?.username) {
      return '';
    }

    return client.clanTag ? `[${client.clanTag}] ${client.username}` : client.username;
  }

  private findRowsByDisplayName(root: ParentNode, displayName: string): HTMLElement[] {
    if (!displayName) {
      return [];
    }

    const matches: HTMLElement[] = [];

    for (const element of Array.from(root.querySelectorAll<HTMLElement>('span, div'))) {
      const text = element.textContent?.trim();
      if (!text || text !== displayName) {
        continue;
      }

      const row =
        element.closest<HTMLElement>('[data-client-id]') ??
        element.closest<HTMLElement>('.player-tag') ??
        element.closest<HTMLElement>('.team-player-row') ??
        element.closest<HTMLElement>('div');

      if (row && !matches.includes(row)) {
        matches.push(row);
      }
    }

    return matches;
  }
}
