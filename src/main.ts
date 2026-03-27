/**
 * OpenFront.io Lobby Intel + Discovery
 *
 * Main entry point for the userscript.
 */

import { getStyles } from '@/styles/styles';
import { SoundUtils } from '@/utils/SoundUtils';
import { URLObserver } from '@/utils/URLObserver';
import { LobbyDataManager } from '@/data/LobbyDataManager';
import { LobbyDiscoveryUI } from '@/modules/lobby-discovery/LobbyDiscoveryUI';
import { CurrentPlayerHighlighter } from '@/modules/lobby-discovery/CurrentPlayerHighlighter';

(function () {
  'use strict';

  console.log('[OpenFront Bundle] Initializing adaptation for OpenFront 0.30...');

  GM_addStyle(getStyles());
  SoundUtils.preloadSounds();
  URLObserver.init();
  LobbyDataManager.start();

  const lobbyDiscovery = new LobbyDiscoveryUI();
  const currentPlayerHighlighter = new CurrentPlayerHighlighter();

  LobbyDataManager.subscribe((lobbies) => {
    lobbyDiscovery.receiveLobbyUpdate(lobbies);
  });

  currentPlayerHighlighter.start();

  console.log('[OpenFront Bundle] Ready! 🚀');
})();
