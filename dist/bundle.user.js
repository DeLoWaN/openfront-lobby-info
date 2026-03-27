// ==UserScript==
// @name         OpenFront.io Lobby Intel + Discovery
// @namespace    https://openfront.io/
// @version      2.8.17
// @description  Live lobby player list and notify-only lobby discovery with Team criteria filters, shared API calls, and optional alerts.
// @homepageURL  https://github.com/DeLoWaN/openfront-autojoin-lobby
// @downloadURL  https://raw.githubusercontent.com/DeLoWaN/openfront-autojoin-lobby/main/dist/bundle.user.js
// @updateURL    https://raw.githubusercontent.com/DeLoWaN/openfront-autojoin-lobby/main/dist/bundle.user.js
// @author       DeLoVaN + SyntaxMenace + DeepSeek + Claude
// @match        https://openfront.io/
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @license      UNLICENSED
// ==/UserScript==

"use strict";(()=>{var a={bgPrimary:"rgba(10, 14, 22, 0.92)",bgSecondary:"rgba(18, 26, 40, 0.75)",bgHover:"rgba(35, 48, 70, 0.6)",textPrimary:"#e7f1ff",textSecondary:"rgba(231, 241, 255, 0.7)",textMuted:"rgba(231, 241, 255, 0.5)",accent:"rgba(46, 211, 241, 0.95)",accentHover:"rgba(99, 224, 255, 0.95)",accentMuted:"rgba(46, 211, 241, 0.18)",accentAlt:"rgba(99, 110, 255, 0.9)",success:"rgba(20, 220, 170, 0.9)",successSolid:"#38d9a9",warning:"#f2c94c",error:"#ff7d87",highlight:"rgba(88, 211, 255, 0.2)",border:"rgba(120, 140, 180, 0.3)",borderAccent:"rgba(46, 211, 241, 0.55)"},m={display:"'Trebuchet MS', 'Segoe UI', Tahoma, Verdana, sans-serif",body:"'Segoe UI', Tahoma, Verdana, sans-serif",mono:"'Consolas', 'Courier New', monospace"},n={xs:"4px",sm:"8px",md:"12px",lg:"16px",xl:"20px",xxl:"24px"},b={sm:"4px",md:"6px",lg:"8px",xl:"12px"},T={sm:"0 2px 8px rgba(3, 8, 18, 0.35)",md:"0 10px 22px rgba(3, 8, 18, 0.45)",lg:"0 24px 40px rgba(2, 6, 16, 0.55), 0 0 24px rgba(46, 211, 241, 0.08)"},d={fast:"0.12s",normal:"0.2s",slow:"0.3s"};var V={threadCount:20,lobbyPollingRate:1e3},k={lobbyDiscoverySettings:"OF_LOBBY_DISCOVERY_SETTINGS",lobbyDiscoveryPanelSize:"OF_LOBBY_DISCOVERY_PANEL_SIZE",playerListPanelPosition:"OF_PLAYER_LIST_PANEL_POSITION",playerListPanelSize:"OF_PLAYER_LIST_PANEL_SIZE",playerListShowOnlyClans:"OF_PLAYER_LIST_SHOW_ONLY_CLANS",playerListCollapseStates:"OF_PLAYER_LIST_COLLAPSE_STATES",playerListRecentTags:"OF_PLAYER_LIST_RECENT_TAGS"},E={panel:9998,panelOverlay:9999,modal:1e4,notification:2e4};function q(){return`
    /* Body layout wrapper for flexbox */
    #of-game-layout-wrapper {
      display: flex;
      height: 100vh;
      width: 100vw;
    }
    #of-game-content {
      flex: 1;
      overflow: auto;
      min-width: 0;
    }

    :root {
      --of-hud-accent: ${a.accent};
      --of-hud-accent-soft: ${a.accentMuted};
      --of-hud-accent-alt: ${a.accentAlt};
      --of-hud-border: ${a.border};
      --of-hud-border-strong: ${a.borderAccent};
      --of-hud-bg: ${a.bgPrimary};
      --of-hud-bg-2: ${a.bgSecondary};
      --of-hud-text: ${a.textPrimary};
    }

    @keyframes ofPanelEnter {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .of-panel {
      position: fixed;
      background: linear-gradient(145deg, rgba(12, 18, 30, 0.98) 0%, rgba(10, 16, 26, 0.94) 60%, rgba(8, 12, 20, 0.96) 100%);
      border: 1px solid ${a.border};
      border-radius: ${b.lg};
      box-shadow: ${T.lg};
      font-family: ${m.body};
      color: ${a.textPrimary};
      user-select: none;
      z-index: ${E.panel};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      animation: ofPanelEnter ${d.slow} ease;
    }
    .of-panel input[type="checkbox"] { accent-color: ${a.accent}; }
    .of-panel.hidden { display: none; }
    .of-header {
      padding: ${n.md} ${n.lg};
      background: linear-gradient(90deg, rgba(20, 30, 46, 0.85), rgba(12, 18, 30, 0.6));
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      font-size: 0.85em;
      border-bottom: 1px solid ${a.border};
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${m.display};
    }
    .of-header-title {
      display: flex;
      align-items: center;
      gap: ${n.sm};
    }
    .of-player-list-title {
      font-size: 1em;
      color: ${a.textPrimary};
    }
    .of-player-list-header {
      position: relative;
    }
    .of-player-list-header::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(46, 211, 241, 0.7), transparent);
      pointer-events: none;
    }
    .discovery-header {
      cursor: pointer;
      gap: ${n.sm};
      padding: ${n.sm} ${n.md};
      font-size: 0.85em;
      position: relative;
    }
    .discovery-header:hover {
      background: ${a.bgHover};
    }
    .discovery-header::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(46, 211, 241, 0.7), transparent);
      pointer-events: none;
    }
    .discovery-title {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .discovery-title-text {
      color: ${a.textPrimary};
      font-weight: 700;
    }
    .discovery-title-sub {
      font-size: 0.72em;
      color: ${a.textMuted};
      letter-spacing: 0.2em;
    }
    .of-content { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(80,110,160,0.4) transparent; }
    .of-content::-webkit-scrollbar { width: 7px; }
    .of-content::-webkit-scrollbar-thumb { background: rgba(80,110,160,0.4); border-radius: 5px; }
    .of-footer {
      padding: ${n.sm} ${n.lg};
      display: flex;
      justify-content: space-between;
      background: ${a.bgSecondary};
      flex-shrink: 0;
      border-top: 1px solid ${a.border};
    }
    .of-button {
      background: ${a.bgHover};
      border: 1px solid ${a.border};
      color: ${a.textPrimary};
      padding: ${n.sm} ${n.md};
      border-radius: ${b.md};
      cursor: pointer;
      font-size: 0.95em;
      font-weight: 600;
      transition: background ${d.fast}, border-color ${d.fast}, color ${d.fast};
      outline: none;
    }
    .of-button:hover { background: rgba(80,110,160,0.5); border-color: ${a.borderAccent}; }
    .of-button.primary { background: ${a.accent}; color: #04131a; }
    .of-button.primary:hover { background: ${a.accentHover}; }
    .of-input {
      padding: ${n.sm};
      background: rgba(20, 30, 46, 0.7);
      border: 1px solid ${a.border};
      border-radius: ${b.md};
      color: ${a.textPrimary};
      font-size: 0.95em;
      outline: none;
      transition: border ${d.fast};
    }
    .of-input:focus { border-color: ${a.accent}; }
    .of-badge {
      background: ${a.accentMuted};
      border: 1px solid ${a.borderAccent};
      border-radius: ${b.xl};
      padding: 2px 10px;
      font-size: 0.75em;
      color: ${a.textPrimary};
    }
    .of-toggle {
      width: 34px;
      height: 18px;
      border-radius: 11px;
      background: rgba(35, 48, 70, 0.9);
      border: 1px solid ${a.border};
      position: relative;
      transition: background ${d.fast}, border-color ${d.fast};
      cursor: pointer;
    }
    .of-toggle.on { background: ${a.successSolid}; }
    .of-toggle-ball {
      position: absolute; left: 2px; top: 2px; width: 14px; height: 14px;
      border-radius: 50%; background: #fff; transition: left ${d.fast};
    }
    .of-toggle.on .of-toggle-ball { left: 18px; }

    .of-player-list-container {
      width: var(--player-list-width, 320px);
      min-width: 240px;
      max-width: 50vw;
      height: 100vh;
      flex-shrink: 0;
      position: relative;
      background: linear-gradient(180deg, rgba(12, 18, 30, 0.98), rgba(8, 12, 20, 0.95));
      border: 1px solid ${a.border};
      border-left: 1px solid ${a.borderAccent};
      border-radius: 0;
      box-shadow: ${T.lg};
      font-family: ${m.body};
      color: ${a.textPrimary};
      user-select: none;
      z-index: ${E.panel};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      resize: none;
    }
    .of-discovery-slot {
      width: 100%;
      flex-shrink: 0;
    }
    .of-resize-handle {
      position: absolute;
      left: 0;
      top: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, ${a.accent}, rgba(46, 211, 241, 0.1));
      cursor: ew-resize;
      z-index: ${E.panel+1};
      opacity: 0.35;
      transition: opacity ${d.fast}, box-shadow ${d.fast};
    }
    .of-resize-handle:hover {
      opacity: 0.8;
      box-shadow: 0 0 12px rgba(46, 211, 241, 0.4);
    }
    .of-resize-handle.dragging {
      opacity: 1;
    }
    .of-player-list-count { font-size: 0.72em; letter-spacing: 0.12em; font-family: ${m.mono}; }
    .of-player-debug-info { font-size: 0.75em; color: rgba(148, 170, 210, 0.7); padding: 2px 6px; display: none; font-family: ${m.mono}; }

    .of-quick-tag-switch {
      padding: ${n.md} ${n.lg};
      background: rgba(14, 22, 34, 0.75);
      border-bottom: 1px solid ${a.border};
      display: flex;
      align-items: center;
      gap: ${n.sm};
      flex-shrink: 0;
      flex-wrap: nowrap;
      overflow-x: auto;
    }
    .of-quick-tag-switch::-webkit-scrollbar { height: 5px; }
    .of-quick-tag-switch::-webkit-scrollbar-thumb { background: rgba(80,110,160,0.45); border-radius: 4px; }
    .of-quick-tag-label {
      font-size: 0.75em;
      color: ${a.textMuted};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }
    .of-quick-tag-item {
      display: flex;
      align-items: center;
      gap: ${n.xs};
    }
    .of-quick-tag-btn {
      padding: 4px 12px;
      font-size: 0.8em;
      background: rgba(22, 34, 52, 0.9);
      color: ${a.textPrimary};
      border: 1px solid ${a.border};
      border-radius: ${b.md};
      cursor: pointer;
      transition: all ${d.fast};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${m.display};
    }
    .of-quick-tag-btn:hover {
      background: ${a.accentMuted};
      border-color: ${a.accent};
    }
    .of-quick-tag-remove {
      width: 16px;
      height: 16px;
      padding: 0;
      font-size: 11px;
      line-height: 1;
      background: rgba(255, 125, 135, 0.15);
      color: ${a.error};
      border: 1px solid rgba(255, 125, 135, 0.6);
      border-radius: 50%;
      cursor: pointer;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background ${d.fast}, border-color ${d.fast}, transform ${d.fast};
    }
    .of-quick-tag-remove:hover {
      background: rgba(255, 117, 117, 0.25);
      border-color: ${a.error};
      transform: scale(1.05);
    }

    .of-clan-checkbox-filter {
      padding: ${n.md} ${n.lg};
      background: rgba(14, 22, 34, 0.75);
      border-bottom: 1px solid ${a.border};
      display: flex;
      align-items: center;
      gap: ${n.sm};
      flex-shrink: 0;
    }
    .of-clan-checkbox-filter input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      margin: 0;
    }
    .of-clan-checkbox-filter label {
      cursor: pointer;
      color: ${a.textPrimary};
      font-size: 0.85em;
      user-select: none;
      flex: 1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${m.display};
    }

    .of-team-group {
      position: relative;
      padding: 12px ${n.md} 6px ${n.md};
    }
    .of-team-group + .of-team-group {
      border-top: 1px dashed rgba(90, 110, 150, 0.35);
    }
    .of-team-group.current-player-team .of-team-band {
      border-left-width: 5px;
      box-shadow: 0 0 12px var(--team-color, ${a.accent});
    }
    .of-team-band {
      position: absolute;
      inset: 0;
      border-left: 3px solid var(--team-color, ${a.accent});
      background: transparent;
      pointer-events: none;
    }
    .of-team-header {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: ${n.xs};
      padding: 4px 10px;
      border-radius: ${b.xl};
      border: 1px solid var(--team-color, ${a.borderAccent});
      background: rgba(10, 16, 28, 0.7);
      font-size: 0.7em;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--team-color, ${a.textPrimary});
      font-family: ${m.display};
      margin-bottom: ${n.xs};
    }
    .of-team-group.current-player-team .of-team-header::before {
      content: "\u25C6";
      color: var(--team-color, ${a.accent});
      font-size: 0.85em;
      margin-right: 2px;
    }
    .of-team-label {
      font-weight: 700;
    }
    .of-team-count {
      color: ${a.textSecondary};
      font-size: 0.85em;
      letter-spacing: 0.1em;
      font-family: ${m.mono};
      margin-left: ${n.xs};
    }

    .of-clan-group {
      margin: 8px ${n.md};
      border: 1px solid rgba(90, 110, 150, 0.35);
      border-radius: ${b.md};
      background: rgba(14, 20, 32, 0.78);
      overflow: hidden;
      box-shadow: 0 10px 18px rgba(2, 6, 16, 0.35);
      --clan-color: ${a.accent};
      --clan-color-soft: rgba(46, 211, 241, 0.14);
      --clan-color-strong: rgba(46, 211, 241, 0.28);
      --clan-color-border: rgba(46, 211, 241, 0.6);
    }
    .of-clan-group.of-clan-group-neutral {
      --clan-color: rgba(150, 165, 190, 0.5);
      --clan-color-soft: rgba(90, 105, 130, 0.2);
      --clan-color-strong: rgba(120, 135, 170, 0.35);
      --clan-color-border: rgba(120, 135, 170, 0.6);
    }
    .of-clan-group-enter {
      animation: clanGroupEnter ${d.slow} cubic-bezier(.27,.82,.48,1.06) forwards;
    }
    @keyframes clanGroupEnter {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .of-clan-group-exit {
      animation: clanGroupExit 0.25s cubic-bezier(.51,.01,1,1.01) forwards;
    }
    @keyframes clanGroupExit {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-8px); }
    }
    .of-clan-group-header {
      padding: calc(${n.sm} - 2px) ${n.md};
      background: linear-gradient(90deg, var(--clan-color-soft), rgba(22, 32, 48, 0.9) 65%);
      border-left: 3px solid var(--clan-color-border);
      cursor: default;
      display: flex;
      align-items: center;
      gap: ${n.sm};
      transition: background ${d.fast}, border-color ${d.fast};
      flex-wrap: wrap;
      font-family: ${m.display};
    }
    .of-clan-group-header:hover {
      background: linear-gradient(90deg, var(--clan-color-strong), rgba(28, 40, 60, 0.95) 65%);
    }
    .of-clan-arrow {
      font-size: 0.8em;
      color: ${a.textSecondary};
      transition: transform ${d.fast};
      width: 16px;
      display: inline-block;
    }
    .of-clan-group.collapsed .of-clan-arrow {
      transform: rotate(-90deg);
    }
    .of-clan-tag {
      font-weight: 700;
      color: ${a.textPrimary};
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-family: ${m.display};
    }
    .of-clan-you-badge {
      font-size: 0.7em;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      padding: 2px 6px;
      border-radius: ${b.xl};
      border: 1px solid var(--clan-color-border);
      background: var(--clan-color-soft);
      color: ${a.textPrimary};
      font-family: ${m.mono};
    }
    .of-clan-count {
      font-size: 0.75em;
      color: ${a.textPrimary};
      background: var(--clan-color-soft);
      padding: 2px 7px;
      border-radius: ${b.xl};
      border: 1px solid var(--clan-color-border);
      letter-spacing: 0.1em;
      font-family: ${m.mono};
    }
    .of-clan-actions {
      display: flex;
      gap: ${n.xs};
      flex-wrap: wrap;
      align-items: center;
      margin-left: auto;
    }
    .of-clan-stats {
      display: flex;
      gap: ${n.xs};
      font-size: 0.66em;
      color: ${a.textSecondary};
      flex-wrap: wrap;
      font-family: ${m.mono};
      line-height: 1.2;
    }
    .of-clan-stats span {
      white-space: nowrap;
    }
    .of-clan-use-btn {
      padding: 4px 10px;
      font-size: 0.75em;
      background: rgba(46, 211, 241, 0.15);
      color: ${a.textPrimary};
      border: 1px solid ${a.borderAccent};
      border-radius: ${b.sm};
      cursor: pointer;
      transition: all ${d.fast};
      font-weight: 700;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${m.display};
    }
    .of-clan-use-btn:hover {
      background: ${a.accent};
      border-color: ${a.accent};
      color: #04131a;
    }
    .of-clan-group-players {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 10px 12px 10px;
      overflow: visible;
      transition: max-height ${d.normal} ease-in-out, opacity ${d.normal} ease-in-out;
      border-top: 1px solid rgba(60, 80, 120, 0.35);
    }
    .of-clan-group.collapsed .of-clan-group-players {
      max-height: 0;
      padding: 0;
      opacity: 0;
      overflow: hidden;
    }
    .of-clan-group-players .of-player-item {
      display: inline-flex;
      padding: 4px 10px;
      border: 1px solid var(--clan-color-border);
      border-radius: ${b.sm};
      background: var(--clan-color-soft);
      cursor: default;
      transition: background ${d.fast}, border-color ${d.fast}, transform ${d.fast};
      font-size: 0.85em;
    }
    .of-clan-group-players .of-player-item:hover {
      background: var(--clan-color-strong);
      border-color: var(--clan-color);
      transform: translateY(-1px);
    }
    .of-solo-players {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px 10px 12px 10px;
      border-top: 1px dashed rgba(70, 90, 120, 0.35);
    }
    .of-solo-players .of-player-item {
      display: inline-flex;
      padding: 4px 10px;
      border: 1px solid var(--player-accent-border, rgba(120, 135, 170, 0.5));
      border-radius: ${b.sm};
      background: var(--player-accent-soft, rgba(90, 105, 130, 0.18));
      cursor: default;
      transition: background ${d.fast}, border-color ${d.fast}, transform ${d.fast};
      font-size: 0.85em;
    }
    .of-solo-players .of-player-item:hover {
      background: var(--player-accent-strong, rgba(120, 135, 170, 0.28));
      border-color: var(--player-accent, rgba(150, 165, 190, 0.6));
      transform: translateY(-1px);
    }
    .of-player-list-content { flex: 1; padding: ${n.xs} 0; }
    /* Base player item styles (for untagged players) */
    .of-player-list-content > .of-player-item {
      padding: 6px ${n.md};
      border-bottom: 1px solid rgba(60, 80, 120, 0.35);
      font-size: 0.85em;
      line-height: 1.4;
      position: relative;
      transition: background-color ${d.slow}, border-color ${d.slow};
      cursor: default;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .of-player-list-content > .of-player-item:hover {
      background: rgba(24, 34, 52, 0.7);
      border-bottom-color: rgba(80, 110, 160, 0.5);
    }
    .of-player-item.of-player-item-accent {
      border-left: 3px solid var(--player-accent-border, rgba(120, 135, 170, 0.6));
      background: var(--player-accent-soft, rgba(120, 135, 170, 0.18));
    }
    .of-clan-group-players .of-player-item.of-player-item-clanmate {
      border-left: 4px solid var(--clan-color, ${a.accent});
      background: var(--clan-color);
      box-shadow: 0 0 0 1px var(--clan-color-border) inset, 0 0 12px rgba(46, 211, 241, 0.3);
      color: #fff;
      text-shadow: 0 1px 2px rgba(6, 10, 18, 0.8);
    }
    .of-player-name { color: ${a.textPrimary}; white-space: nowrap; overflow: visible; font-weight: 400; flex: 1; }
    .of-player-highlighted { background: linear-gradient(90deg, ${a.highlight} 40%, rgba(46, 211, 241, 0.05)); border-left: 3px solid ${a.accent}; }
    .of-player-enter { animation: playerEnter ${d.slow} cubic-bezier(.27,.82,.48,1.06) forwards; }
    .of-player-enter-stagger-1 { animation-delay: 30ms; }
    .of-player-enter-stagger-2 { animation-delay: 60ms; }
    .of-player-enter-stagger-3 { animation-delay: 90ms; }
    .of-player-enter-stagger-4 { animation-delay: 120ms; }
    .of-player-enter-highlight { background-color: rgba(110,160,255,0.14) !important; }
    .of-player-exit-highlight { background-color: rgba(220, 70, 90, 0.18); }
    .of-player-exit { animation: playerExit 0.25s cubic-bezier(.51,.01,1,1.01) forwards; }
    @keyframes playerEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes playerExit { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }
    .of-player-list-footer { padding: ${n.sm} ${n.lg}; display: flex; justify-content: space-between; background: ${a.bgSecondary}; font-size: 0.95em; flex-shrink: 0; border-top: 1px solid ${a.border}; }
    .of-player-list-button { background: ${a.bgHover}; border: 1px solid ${a.border}; color: ${a.textPrimary}; padding: 6px 13px; border-radius: ${b.md}; cursor: pointer; font-size: 0.9em; font-weight: 600; transition: background ${d.fast}, border-color ${d.fast}; outline: none; }
    .of-player-list-button:hover { background: rgba(80,110,160,0.5); border-color: ${a.borderAccent}; }

    .discovery-panel {
      position: fixed;
      top: 24px;
      right: 24px;
      width: min(560px, calc(100vw - 32px));
      max-height: calc(100vh - 48px);
      margin: 0;
      border: 1px solid ${a.border};
      border-radius: ${b.lg};
      box-shadow: ${T.lg};
      transition: opacity ${d.slow}, transform ${d.slow};
      cursor: default;
      overflow: hidden;
    }
    .discovery-panel::after { display: none; }
    .discovery-panel.hidden { display: none; }
    .discovery-body { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .discovery-content { display: flex; flex-direction: column; gap: ${n.sm}; padding: ${n.sm} ${n.md} ${n.md}; overflow-y: auto; overflow-x: hidden; min-height: 0; }
    .discovery-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: ${n.sm};
      flex-wrap: wrap;
      padding: ${n.sm} ${n.md};
      background: rgba(18, 26, 40, 0.75);
      border: 1px solid ${a.border};
      border-radius: ${b.md};
    }
    .discovery-action-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: ${n.sm};
    }
    .discovery-modes { display: flex; flex-direction: column; gap: ${n.sm}; }
    .discovery-clanmate-button {
      width: 100%;
      background: rgba(22, 34, 52, 0.9);
      border: 1px solid ${a.border};
      color: ${a.textPrimary};
      padding: ${n.sm} ${n.md};
      border-radius: ${b.md};
      font-size: 0.8em;
      font-weight: 700;
      cursor: pointer;
      transition: background ${d.fast}, border-color ${d.fast};
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${m.display};
    }
    .discovery-clanmate-button:hover { background: rgba(30, 44, 66, 0.95); border-color: ${a.borderAccent}; }
    .discovery-clanmate-button.armed { background: ${a.accent}; border-color: ${a.accentHover}; color: #04131a; box-shadow: 0 0 12px rgba(46, 211, 241, 0.35); }
    .discovery-clanmate-button:disabled { opacity: 0.6; cursor: not-allowed; }
    .discovery-config-grid { display: flex; flex-direction: column; gap: ${n.sm}; }
    .discovery-config-card { flex: 1 1 auto; min-width: 0; width: 100%; background: rgba(14, 22, 34, 0.7); border: 1px solid ${a.border}; border-radius: ${b.md}; }
    .discovery-mode-inner {
      display: flex;
      flex-direction: column;
      gap: ${n.xs};
      margin-top: ${n.xs};
    }
    .discovery-mode-inner.is-disabled {
      opacity: 0.72;
    }
    .discovery-section {
      display: flex;
      flex-direction: column;
      gap: ${n.xs};
    }
    .discovery-section-title {
      font-size: 0.72em;
      color: ${a.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-family: ${m.display};
      margin-top: ${n.xs};
    }
    .discovery-footer { align-items: center; justify-content: flex-start; gap: ${n.sm}; flex-wrap: wrap; padding: ${n.sm} ${n.md}; background: rgba(14, 22, 34, 0.75); border-top: 1px solid ${a.border}; }
    .discovery-main-button {
      width: auto;
      flex: 1 1 160px;
      padding: ${n.sm} ${n.md};
      border: 1px solid ${a.border};
      border-radius: ${b.md};
      font-size: 0.8em;
      font-weight: 700;
      cursor: pointer;
      transition: all ${d.slow};
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${m.display};
    }
    .discovery-main-button.active { background: ${a.accent}; color: #04131a; border-color: ${a.accentHover}; box-shadow: 0 0 14px rgba(46, 211, 241, 0.35); }
    .discovery-main-button.inactive { background: rgba(28, 38, 58, 0.9); color: ${a.textSecondary}; }
    .discovery-mode-config { margin-bottom: ${n.xs}; padding: ${n.sm}; background: rgba(18, 26, 40, 0.8); border-radius: ${b.md}; border: 1px solid rgba(90, 110, 150, 0.35); }
    .mode-checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      cursor: pointer;
      margin-bottom: 6px;
      font-size: 0.8em;
      color: ${a.textPrimary};
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-family: ${m.display};
    }
    .mode-checkbox-label input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
    .player-filter-info { margin-bottom: 4px; padding: 2px 0; }
    .player-filter-info small { color: ${a.textSecondary}; font-size: 0.8em; }
    .capacity-range-wrapper { margin-top: 4px; }
    .capacity-range-visual { position: relative; padding: 8px 0 4px 0; }
    .capacity-track { position: relative; height: 6px; background: rgba(46, 211, 241, 0.2); border-radius: 3px; margin-bottom: ${n.sm}; }
    .team-count-options-centered { display: flex; justify-content: space-between; gap: 10px; margin: ${n.xs} 0; }
    .team-count-column { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; background: rgba(12, 18, 30, 0.6); padding: 5px; border-radius: ${b.sm}; border: 1px solid rgba(90, 110, 150, 0.25); }
    .team-count-column label { display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.78em; color: ${a.textPrimary}; white-space: nowrap; user-select: none; }
    .team-count-column input[type="checkbox"] { width: 16px; height: 16px; margin: 0; }
    .select-all-btn { background: rgba(46, 211, 241, 0.15); color: ${a.textPrimary}; border: 1px solid ${a.borderAccent}; border-radius: ${b.sm}; padding: ${n.xs} ${n.sm}; font-size: 0.75em; cursor: pointer; flex: 1; text-align: center; margin: 0 2px; text-transform: uppercase; letter-spacing: 0.1em; font-family: ${m.display}; }
    .select-all-btn:hover { background: rgba(46, 211, 241, 0.25); }
    .team-count-section > div:first-of-type { display: flex; gap: 5px; margin-bottom: ${n.xs}; }
    .team-count-section > label { font-size: 0.8em; color: ${a.textPrimary}; font-weight: 600; margin-bottom: 4px; display: block; text-transform: uppercase; letter-spacing: 0.08em; font-family: ${m.display}; }
    .capacity-labels { display: flex; justify-content: space-between; align-items: center; margin-top: ${n.sm}; }
    .three-times-checkbox { display: flex; align-items: center; gap: ${n.xs}; font-size: 0.78em; color: ${a.textPrimary}; margin: 0 5px; }
    .three-times-checkbox input[type="checkbox"] { width: 15px; height: 15px; }
    .capacity-range-fill { position: absolute; height: 100%; background: rgba(46, 211, 241, 0.5); border-radius: 3px; pointer-events: none; opacity: 0.7; transition: left 0.1s ease, width 0.1s ease; }
    .discovery-modifier-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: ${n.xs};
    }
    .discovery-modifier-grid label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${n.sm};
      font-size: 0.82em;
      color: ${a.textSecondary};
      min-width: 0;
    }
    .discovery-modifier-grid label > span:first-child {
      flex: 1 1 auto;
      min-width: 0;
      color: ${a.textPrimary};
      white-space: nowrap;
    }
    .discovery-binary-toggle {
      display: inline-grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2px;
      flex: 0 0 144px;
      min-width: 144px;
      padding: 2px;
      border: 1px solid ${a.border};
      border-radius: 999px;
      background: rgba(20, 30, 46, 0.78);
    }
    .discovery-binary-option {
      position: relative;
      display: flex;
      width: 100%;
      min-width: 0;
      cursor: pointer;
      border: 0;
      padding: 0;
      margin: 0;
      background: transparent;
      appearance: none;
      -webkit-appearance: none;
    }
    .discovery-binary-option:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.28);
      outline-offset: 1px;
      border-radius: 999px;
    }
    .discovery-binary-label {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 24px;
      padding: 0 8px;
      border-radius: 999px;
      color: ${a.textMuted};
      font-size: 0.66em;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-family: ${m.display};
      transition: background ${d.fast}, color ${d.fast}, box-shadow ${d.fast};
      user-select: none;
      white-space: nowrap;
    }
    .discovery-binary-option[aria-pressed="true"] .discovery-binary-label {
      color: ${a.textPrimary};
      background: rgba(46, 211, 241, 0.18);
      box-shadow: inset 0 0 0 1px rgba(46, 211, 241, 0.24);
    }
    .discovery-binary-toggle[data-state="blocked"] .discovery-binary-option[aria-pressed="true"] .discovery-binary-label {
      background: rgba(245, 101, 101, 0.22);
      box-shadow: inset 0 0 0 1px rgba(245, 101, 101, 0.3);
    }
    .of-current-player-boost {
      box-shadow: 0 0 0 1px rgba(46, 211, 241, 0.75), 0 0 16px rgba(46, 211, 241, 0.25);
      background: linear-gradient(90deg, rgba(46, 211, 241, 0.16), rgba(46, 211, 241, 0.06));
    }
    .of-current-player-team-boost {
      box-shadow: inset 0 0 0 1px rgba(46, 211, 241, 0.55), 0 0 20px rgba(46, 211, 241, 0.15);
    }
    .capacity-slider { position: absolute; width: 100%; height: 6px; top: 0; left: 0; background: transparent; outline: none; -webkit-appearance: none; pointer-events: none; margin: 0; }
    .capacity-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${a.accent}; cursor: pointer; pointer-events: all; border: 2px solid rgba(5, 20, 26, 0.9); box-shadow: ${T.sm}; }
    .capacity-slider-min { z-index: 2; }
    .capacity-slider-max { z-index: 1; }
    .capacity-label-group { display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .capacity-label-group label { font-size: 0.8em; color: ${a.textSecondary}; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; font-family: ${m.display}; }
    .capacity-value { font-size: 0.85em; color: #FFFFFF; font-weight: 600; min-width: 40px; text-align: center; }
    .capacity-inputs-hidden { display: none; }
    .discovery-status { display: flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; flex-wrap: wrap; }
    @keyframes statusPulse {
      0% { box-shadow: 0 0 0 0 rgba(20, 220, 170, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(20, 220, 170, 0); }
      100% { box-shadow: 0 0 0 0 rgba(20, 220, 170, 0); }
    }
    .status-indicator { width: 8px; height: 8px; border-radius: 50%; background: ${a.success}; box-shadow: 0 0 10px rgba(20, 220, 170, 0.4); }
    .status-indicator.active { animation: statusPulse 2s infinite; }
    .status-indicator.inactive { animation: none; box-shadow: none; }
    .status-text { font-size: 0.8em; color: ${a.textPrimary}; text-transform: uppercase; letter-spacing: 0.12em; font-family: ${m.display}; }
    .search-timer { font-size: 0.8em; color: rgba(147, 197, 253, 0.9); font-weight: 500; font-family: ${m.mono}; }
    .discovery-settings { display: flex; align-items: center; gap: ${n.sm}; flex-wrap: wrap; }
    .discovery-toggle-label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.8em; color: ${a.textPrimary}; font-family: ${m.display}; text-transform: uppercase; letter-spacing: 0.08em; }
    .discovery-toggle-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }
    .current-game-info { margin: 6px 0; padding: 6px ${n.sm}; background: rgba(46, 211, 241, 0.1); border-radius: ${b.sm}; font-size: 0.8em; color: rgba(147, 197, 253, 0.9); text-align: center; border: 1px solid rgba(46, 211, 241, 0.25); }
    .current-game-info.not-applicable { background: rgba(100, 100, 100, 0.1); color: ${a.textMuted}; border-color: rgba(100, 100, 100, 0.2); font-style: italic; }
    @keyframes discoveryCardActiveBeacon {
      0% {
        box-shadow:
          0 0 0 3px rgba(255, 168, 38, 0.98) inset,
          0 0 28px rgba(255, 122, 26, 0.42);
        filter: saturate(1.08) brightness(1.04);
      }
      50% {
        box-shadow:
          0 0 0 4px rgba(255, 209, 102, 1) inset,
          0 0 48px rgba(255, 122, 26, 0.72),
          0 0 0 12px rgba(255, 168, 38, 0.18);
        filter: saturate(1.2) brightness(1.14);
      }
      100% {
        box-shadow:
          0 0 0 3px rgba(255, 168, 38, 0.98) inset,
          0 0 28px rgba(255, 122, 26, 0.42);
        filter: saturate(1.08) brightness(1.04);
      }
    }
    .of-discovery-card-active {
      border-color: rgba(255, 168, 38, 0.96) !important;
      transition:
        box-shadow ${d.fast},
        filter ${d.fast},
        border-color ${d.fast};
      animation: discoveryCardActiveBeacon 1.45s ease-in-out infinite;
    }

  `}var C={gameFoundAudio:null,gameStartAudio:null,audioUnlocked:!1,preloadSounds(){try{this.gameFoundAudio=new Audio("https://github.com/DeLoWaN/openfront-autojoin-lobby/raw/refs/heads/main/notification_sounds/new-notification-014-363678.mp3"),this.gameFoundAudio.volume=.5,this.gameFoundAudio.preload="auto",this.gameStartAudio=new Audio("https://github.com/DeLoWaN/openfront-autojoin-lobby/raw/refs/heads/main/notification_sounds/opening-bell-421471.mp3"),this.gameStartAudio.volume=.5,this.gameStartAudio.preload="auto",this.setupAudioUnlock()}catch(i){console.warn("[SoundUtils] Could not preload audio:",i)}},setupAudioUnlock(){let i=()=>{if(this.audioUnlocked)return;let e=[];this.gameFoundAudio&&(this.gameFoundAudio.volume=.01,e.push(this.gameFoundAudio.play().then(()=>{this.gameFoundAudio&&(this.gameFoundAudio.pause(),this.gameFoundAudio.currentTime=0,this.gameFoundAudio.volume=.5)}).catch(()=>{}))),this.gameStartAudio&&(this.gameStartAudio.volume=.01,e.push(this.gameStartAudio.play().then(()=>{this.gameStartAudio&&(this.gameStartAudio.pause(),this.gameStartAudio.currentTime=0,this.gameStartAudio.volume=.5)}).catch(()=>{}))),Promise.all(e).then(()=>{this.audioUnlocked=!0,console.log("[SoundUtils] Audio unlocked successfully"),document.removeEventListener("click",i),document.removeEventListener("keydown",i),document.removeEventListener("touchstart",i)})};document.addEventListener("click",i,{once:!0}),document.addEventListener("keydown",i,{once:!0}),document.addEventListener("touchstart",i,{once:!0})},playGameFoundSound(){this.gameFoundAudio?(console.log("[SoundUtils] Attempting to play game found sound"),this.gameFoundAudio.currentTime=0,this.gameFoundAudio.play().catch(i=>{console.warn("[SoundUtils] Failed to play game found sound:",i)})):console.warn("[SoundUtils] Game found audio not initialized")},playGameStartSound(){this.gameStartAudio?(console.log("[SoundUtils] Attempting to play game start sound"),this.gameStartAudio.currentTime=0,this.gameStartAudio.play().catch(i=>{console.warn("[SoundUtils] Failed to play game start sound:",i)})):console.warn("[SoundUtils] Game start audio not initialized")}};var I={callbacks:[],lastUrl:location.href,initialized:!1,init(){if(this.initialized)return;this.initialized=!0;let i=()=>{location.href!==this.lastUrl&&(this.lastUrl=location.href,this.notify())};window.addEventListener("popstate",i),window.addEventListener("hashchange",i);let e=history.pushState,t=history.replaceState;history.pushState=function(...o){e.apply(history,o),setTimeout(i,0)},history.replaceState=function(...o){t.apply(history,o),setTimeout(i,0)},setInterval(i,200)},subscribe(i){this.callbacks.push(i),this.init()},notify(){this.callbacks.forEach(i=>i(location.href))}};var G={subscribers:[],fallbackInterval:null,fallbackStartTimeout:null,lastLobbies:[],pollingRate:V.lobbyPollingRate,started:!1,publicLobbiesListener:null,start(){this.started||(this.started=!0,this.publicLobbiesListener=i=>this.handlePublicLobbiesUpdate(i),document.addEventListener("public-lobbies-update",this.publicLobbiesListener),this.scheduleFallbackPolling())},stop(){this.started&&(this.started=!1,this.publicLobbiesListener&&(document.removeEventListener("public-lobbies-update",this.publicLobbiesListener),this.publicLobbiesListener=null),this.fallbackStartTimeout&&(clearTimeout(this.fallbackStartTimeout),this.fallbackStartTimeout=null),this.stopFallbackPolling())},subscribe(i){this.subscribers.push(i),this.lastLobbies.length>0&&i(this.lastLobbies)},scheduleFallbackPolling(){!this.started||this.fallbackInterval||this.fallbackStartTimeout||(this.fallbackStartTimeout=setTimeout(()=>{this.fallbackStartTimeout=null,this.startFallbackPolling()},this.pollingRate*2))},startFallbackPolling(){this.fallbackInterval||(this.fetchData(),this.fallbackInterval=setInterval(()=>void this.fetchData(),this.pollingRate))},stopFallbackPolling(){this.fallbackInterval&&(clearInterval(this.fallbackInterval),this.fallbackInterval=null)},async fetchData(){if(!(location.pathname!=="/"&&!location.pathname.startsWith("/public-lobby")))try{let i=await fetch("/api/public_lobbies");if(i.status===429){console.warn("[Bundle] Rate limited.");return}if(!i.ok){console.warn(`[Bundle] API error: ${i.status}`);return}let e=await i.json();this.lastLobbies=this.extractLobbies(e),this.notifySubscribers()}catch(i){console.error("[Bundle] API Error:",i)}},notifySubscribers(){this.subscribers.forEach(i=>i(this.lastLobbies))},handlePublicLobbiesUpdate(i){this.fallbackStartTimeout&&(clearTimeout(this.fallbackStartTimeout),this.fallbackStartTimeout=null),this.stopFallbackPolling();let e=i.detail?.payload;this.lastLobbies=this.extractLobbies(e),this.notifySubscribers(),this.scheduleFallbackPolling()},extractLobbies(i){if(!i||typeof i!="object")return[];if(Array.isArray(i.lobbies))return i.lobbies;let e=i.games;return e?["ffa","team","special"].flatMap(t=>(e[t]??[]).map(o=>({...o,publicGameType:o.publicGameType??t}))):[]}};var P={lastActionTime:0,debounceDelay:800,getLobbyButton(){return document.querySelector("public-lobby")?.querySelector("button.group.relative.isolate")},canJoinLobby(){let i=document.querySelector("public-lobby");if(!i)return!1;let e=this.getLobbyButton();return!!(e&&!i.isLobbyHighlighted&&i.lobbies&&i.lobbies.length>0&&!e.disabled&&e.offsetParent!==null)},verifyState(i){let e=document.querySelector("public-lobby");if(!e)return!1;let t=this.getLobbyButton();return!t||t.disabled||t.offsetParent===null?!1:i==="in"?e.isLobbyHighlighted===!0:i==="out"?!!(!e.isLobbyHighlighted&&e.lobbies&&e.lobbies.length>0):!1},tryJoinLobby(){let i=Date.now();if(i-this.lastActionTime<this.debounceDelay)return!1;let e=this.getLobbyButton(),t=document.querySelector("public-lobby");return e&&t&&!t.isLobbyHighlighted&&t.lobbies&&t.lobbies.length>0&&!e.disabled&&e.offsetParent!==null?(this.lastActionTime=i,e.click(),setTimeout(()=>{this.verifyState("in")||console.warn("[LobbyUtils] Join may have failed, state not updated")},100),!0):!1},isOnLobbyPage(){let i=document.getElementById("page-game");if(i&&!i.classList.contains("hidden"))return!1;let e=document.querySelector("canvas");if(e&&e.offsetParent!==null){let s=e.getBoundingClientRect();if(s.width>100&&s.height>100)return!1}let t=document.querySelector("public-lobby");if(t&&t.offsetParent!==null)return!0;if(t&&t.offsetParent===null)return!1;let o=document.getElementById("page-play");if(o&&!o.classList.contains("hidden")&&t)return!0;let r=window.location.pathname.replace(/\/+$/,"")||"/";return r==="/"||r==="/public-lobby"}};var z={isSupported(){return typeof Notification<"u"},isBackgrounded(){let i=document.visibilityState==="hidden"||document.hidden,e=typeof document.hasFocus=="function"?document.hasFocus():!0;return i||!e},async ensurePermission(){if(typeof Notification>"u")return!1;if(Notification.permission==="granted")return!0;if(Notification.permission==="denied")return!1;try{return await Notification.requestPermission()==="granted"}catch(i){return console.warn("[BrowserNotificationUtils] Permission request failed:",i),!1}},show(i){if(!this.isSupported()||!this.isBackgrounded())return!1;if(Notification.permission==="granted"){let e=new Notification(i.title,{body:i.body});return e.onclick=()=>{this.focusWindow(),e.close()},!0}return!1},focusWindow(){window.focus()}};var A=class{constructor(e,t,o=null,r=200,s=50){this.isDragging=!1;this.startX=0;this.startWidth=0;this.el=e,this.onResize=t,this.storageKey=o,this.minWidth=r,this.maxWidthVw=s,this.handleMouseDown=this._handleMouseDown.bind(this),this.handleMouseMove=this._handleMouseMove.bind(this),this.handleMouseUp=this._handleMouseUp.bind(this),this.handle=this.createHandle(),e.appendChild(this.handle),o&&this.loadWidth()}createHandle(){let e=document.createElement("div");return e.className="of-resize-handle",e.addEventListener("mousedown",this.handleMouseDown),e}loadWidth(){if(!this.storageKey)return;let e=GM_getValue(this.storageKey,null);if(e&&e.width){let t=this.clampWidth(e.width);this.el.style.width=t+"px",this.onResize(t)}}saveWidth(){this.storageKey&&GM_setValue(this.storageKey,{width:this.el.offsetWidth})}clampWidth(e){let t=window.innerWidth*(this.maxWidthVw/100);return Math.max(this.minWidth,Math.min(e,t))}_handleMouseDown(e){e.preventDefault(),e.stopPropagation(),this.isDragging=!0,this.startX=e.clientX,this.startWidth=this.el.offsetWidth,this.handle.classList.add("dragging"),document.addEventListener("mousemove",this.handleMouseMove),document.addEventListener("mouseup",this.handleMouseUp)}_handleMouseMove(e){if(!this.isDragging)return;let t=this.startX-e.clientX,o=this.clampWidth(this.startWidth+t);this.el.style.width=o+"px",this.onResize(o)}_handleMouseUp(){this.isDragging&&(this.isDragging=!1,this.handle.classList.remove("dragging"),document.removeEventListener("mousemove",this.handleMouseMove),document.removeEventListener("mouseup",this.handleMouseUp),this.saveWidth())}destroy(){this.handle.removeEventListener("mousedown",this.handleMouseDown),document.removeEventListener("mousemove",this.handleMouseMove),document.removeEventListener("mouseup",this.handleMouseUp),this.handle.parentNode&&this.handle.parentNode.removeChild(this.handle)}};var ee="allowed";function j(i){if(!i)return null;let e=i.toLowerCase().trim();return e==="free for all"||e==="ffa"||e==="free-for-all"?"FFA":e==="team"||e==="teams"?"Team":null}function M(i){return j(i.gameConfig?.gameMode)}function _(i){let e=i.publicGameType?.toLowerCase().trim();return e==="ffa"||e==="team"||e==="special"?e:null}function U(i){if(i==="Duos"||i==="Trios"||i==="Quads"||i==="Humans Vs Nations"||typeof i=="number"&&Number.isFinite(i)&&i>0)return i;if(typeof i=="string"){let e=parseInt(i,10);if(!Number.isNaN(e)&&e>0)return e}return null}function $(i){let e=i.gameConfig;if(!e||M(i)!=="Team")return null;let t=U(e.playerTeams??null);return t!==null?t:U(e.teamCount??e.teams??null)}function N(i){let e=i.gameConfig;return e?e.maxPlayers??e.maxClients??e.maxPlayersPerGame??i.maxClients??null:null}function D(i,e){return!i||!e?null:i==="Duos"?2:i==="Trios"?3:i==="Quads"?4:i==="Humans Vs Nations"?e:typeof i=="number"&&i>0?Math.floor(e/i):null}function F(i,e){let t=i.gameConfig?.publicGameModifiers;if(t)switch(e){case"isCompact":return t.isCompact;case"isRandomSpawn":return t.isRandomSpawn;case"isCrowded":return t.isCrowded;case"isHardNations":return t.isHardNations;case"isAlliancesDisabled":return t.isAlliancesDisabled;case"isPortsDisabled":return t.isPortsDisabled;case"isNukesDisabled":return t.isNukesDisabled;case"isSAMsDisabled":return t.isSAMsDisabled;case"isPeaceTime":return t.isPeaceTime;case"startingGold":return t.startingGold;case"goldMultiplier":return t.goldMultiplier;default:return}}function K(i){let e=M(i),t=$(i),o=N(i);if(e==="FFA")return o!==null?`FFA \u2022 ${o} slots`:"FFA";if(e!=="Team")return"Unsupported mode";if(t==="Humans Vs Nations")return o!==null?`Humans Vs Nations (${o})`:"Humans Vs Nations";if(t==="Duos")return"Duos";if(t==="Trios")return"Trios";if(t==="Quads")return"Quads";if(typeof t=="number"&&o!==null){let r=D(t,o);return r!==null?`${t} teams (${r} per team)`:`${t} teams`}return"Team"}function te(i){let e=M(i),t=$(i);return e==="FFA"?"FFA":e!=="Team"?"Unsupported mode":t==="Humans Vs Nations"?"Humans Vs Nations":t==="Duos"||t==="Trios"||t==="Quads"?t:typeof t=="number"?`${t} teams`:"Team"}function ie(i){return i>=1e6&&i%1e6===0?`${i/1e6}M`:i>=1e3&&i%1e3===0?`${i/1e3}K`:String(i)}function oe(i){let e=i.gameConfig?.publicGameModifiers;if(!e)return[];let t=[];return e.isCompact&&t.push("Compact"),e.isRandomSpawn&&t.push("Random"),e.isCrowded&&t.push("Crowded"),e.isHardNations&&t.push("Hard"),typeof e.startingGold=="number"&&t.push(ie(e.startingGold)),typeof e.goldMultiplier=="number"&&t.push(`x${e.goldMultiplier}`),e.isAlliancesDisabled&&t.push("No Alliances"),e.isPortsDisabled&&t.push("No Ports"),e.isNukesDisabled&&t.push("No Nukes"),e.isSAMsDisabled&&t.push("No SAMs"),e.isPeaceTime&&t.push("Peace"),t}function J(i){let e=[],t=i.gameConfig?.gameMap?.trim(),o=N(i),r=$(i),s=te(i);if(t&&e.push(t),M(i)==="Team"&&r!=="Humans Vs Nations"){e.push(s);let u=D(r,o);u!==null&&e.push(`${u}/team`)}else e.push(s);let l=[];o!==null&&l.push(`${o} slots`);let p=oe(i);return p.length>0&&l.push(p.join(", ")),{title:e.join(" \u2022 "),body:l.join(" \u2022 ")}}function Q(i){return typeof i=="number"&&Number.isFinite(i)?i:null}function v(i){return i==="blocked"||i==="rejected"?"blocked":i==="allowed"||i==="required"||i==="indifferent"?"allowed":ee}function W(i){if(!i||typeof i!="object")return;let e={};for(let[t,o]of Object.entries(i)){let r=Number(t);Number.isFinite(r)&&(e[r]=v(o))}return Object.keys(e).length>0?e:void 0}function ae(i){if(!i||typeof i!="object")return;let e=i;return{isCompact:v(e.isCompact),isRandomSpawn:v(e.isRandomSpawn),isCrowded:v(e.isCrowded),isHardNations:v(e.isHardNations),isAlliancesDisabled:v(e.isAlliancesDisabled),isPortsDisabled:v(e.isPortsDisabled),isNukesDisabled:v(e.isNukesDisabled),isSAMsDisabled:v(e.isSAMsDisabled),isPeaceTime:v(e.isPeaceTime),startingGold:W(e.startingGold),goldMultiplier:W(e.goldMultiplier)}}function Y(i){if(!Array.isArray(i))return[];let e=[];for(let t of i){let o=t,r=j(o.gameMode??null);r&&e.push({gameMode:r,teamCount:r==="Team"?U(o.teamCount??null):null,minPlayers:Q(o.minPlayers),maxPlayers:Q(o.maxPlayers),modifiers:ae(o.modifiers)})}return e}function X(i,e){return e?{criteria:Y(e.criteria),discoveryEnabled:typeof e.discoveryEnabled=="boolean"?e.discoveryEnabled:!0,soundEnabled:typeof e.soundEnabled=="boolean"?e.soundEnabled:!0,desktopNotificationsEnabled:typeof e.desktopNotificationsEnabled=="boolean"?e.desktopNotificationsEnabled:!1,isTeamTwoTimesMinEnabled:typeof e.isTeamTwoTimesMinEnabled=="boolean"?e.isTeamTwoTimesMinEnabled:!!e.isTeamThreeTimesMinEnabled}:{criteria:Y(i?.criteria),discoveryEnabled:typeof i?.autoJoinEnabled=="boolean"?i.autoJoinEnabled:!0,soundEnabled:typeof i?.soundEnabled=="boolean"?i.soundEnabled:!0,desktopNotificationsEnabled:!1,isTeamTwoTimesMinEnabled:typeof i?.isTeamTwoTimesMinEnabled=="boolean"?i.isTeamTwoTimesMinEnabled:!!i?.isTeamThreeTimesMinEnabled}}var re=["isCompact","isRandomSpawn","isCrowded","isHardNations","isAlliancesDisabled","isPortsDisabled","isNukesDisabled","isSAMsDisabled","isPeaceTime"],H=class{matchesCriteria(e,t,o={}){if(!e||!e.gameConfig||!t||t.length===0)return!1;let r=M(e),s=N(e);if(!r||s===null)return!1;let l=$(e),p=r==="Team"?D(l,s):null;for(let u of t){if(u.gameMode!==r||r==="Team"&&(u.teamCount!==null&&u.teamCount!==void 0&&u.teamCount!==l||o.isTeamTwoTimesMinEnabled&&u.minPlayers!==null&&l!=="Humans Vs Nations"&&s<u.minPlayers*2||p===null))continue;let f=r==="Team"?p:s;if(f!==null&&!(u.minPlayers!==null&&f<u.minPlayers)&&!(u.maxPlayers!==null&&f>u.maxPlayers)&&this.matchesModifiers(e,u.modifiers))return!0}return!1}matchesModifiers(e,t){if(!t)return!0;for(let o of re){let r=t[o];if(!r||r==="allowed")continue;let s=!!F(e,o);if(r==="blocked"&&s)return!1}return!(!this.matchesNumericModifier(F(e,"startingGold"),t.startingGold)||!this.matchesNumericModifier(F(e,"goldMultiplier"),t.goldMultiplier))}matchesNumericModifier(e,t){if(!t)return!0;let o=typeof e=="number"&&Number.isFinite(e)?e:null,r=Object.entries(t);if(r.length===0)return!0;let s=r.filter(([,l])=>l==="blocked").map(([l])=>Number(l));return!(o!==null&&s.includes(o))}};var ne=[1e6,5e6,25e6],se=[2],B=class{constructor(){this.discoveryEnabled=!0;this.criteriaList=[];this.searchStartTime=null;this.gameFoundTime=null;this.soundEnabled=!0;this.desktopNotificationsEnabled=!1;this.desktopNotificationRequestId=0;this.activeMatchSources=new Set;this.seenLobbies=new Set;this.desktopNotifiedLobbies=new Set;this.isTeamTwoTimesMinEnabled=!1;this.sleeping=!1;this.isDisposed=!1;this.timerInterval=null;this.gameInfoInterval=null;this.pulseSyncTimeout=null;this.resizeHandler=null;this.engine=new H,this.loadSettings(),this.createUI(),this.updateSleepState(),I.subscribe(()=>this.updateSleepState())}receiveLobbyUpdate(e){this.processLobbies(e)}migrateSettings(){let e=GM_getValue("autoJoinSettings",null),t=GM_getValue(k.lobbyDiscoverySettings,null),o=X(e,t);GM_setValue(k.lobbyDiscoverySettings,o)}loadSettings(){this.migrateSettings();let e=GM_getValue(k.lobbyDiscoverySettings,null);e&&(this.criteriaList=e.criteria||[],this.soundEnabled=e.soundEnabled!==void 0?e.soundEnabled:!0,this.desktopNotificationsEnabled=e.desktopNotificationsEnabled!==void 0?e.desktopNotificationsEnabled:!1,this.discoveryEnabled=e.discoveryEnabled!==void 0?e.discoveryEnabled:!0,this.isTeamTwoTimesMinEnabled=e.isTeamTwoTimesMinEnabled||!1)}saveSettings(){GM_setValue(k.lobbyDiscoverySettings,{criteria:this.criteriaList,discoveryEnabled:this.discoveryEnabled,soundEnabled:this.soundEnabled,desktopNotificationsEnabled:this.desktopNotificationsEnabled,isTeamTwoTimesMinEnabled:this.isTeamTwoTimesMinEnabled})}updateSearchTimer(){let e=document.getElementById("discovery-search-timer");if(!e)return;if(!this.discoveryEnabled||this.criteriaList.length===0||this.searchStartTime===null||!this.isDiscoveryFeedbackAllowed()){e.style.display="none";return}let t=this.gameFoundTime??Date.now(),o=Math.floor((t-this.searchStartTime)/1e3);e.textContent=this.gameFoundTime?`Match found (${Math.floor(o/60)}m ${o%60}s)`:`Scanning ${Math.floor(o/60)}m ${o%60}s`,e.style.display="inline"}updateCurrentGameInfo(){let e=document.getElementById("discovery-current-game-info");if(!e||!P.isOnLobbyPage()){e&&(e.style.display="none");return}let t=document.querySelector("public-lobby");if(!t||!Array.isArray(t.lobbies)||t.lobbies.length===0){e.style.display="none";return}let o=t.lobbies[0];if(!o||!o.gameConfig){e.style.display="none";return}e.style.display="block",e.textContent=`Current game: ${K(o)}`,e.classList.remove("not-applicable")}processLobbies(e){try{if(this.updateCurrentGameInfo(),this.syncSearchTimer(),!this.discoveryEnabled||this.criteriaList.length===0||!this.isDiscoveryFeedbackAllowed()){this.seenLobbies.clear(),this.desktopNotifiedLobbies.clear(),this.updateQueueCardPulses(new Set),this.gameFoundTime=null,this.updateSearchTimer();return}let t=new Set,o=new Set,r=[],s=!1;for(let l of e){let p=_(l);if(!p||!this.engine.matchesCriteria(l,this.criteriaList,{isTeamTwoTimesMinEnabled:this.isTeamTwoTimesMinEnabled}))continue;t.add(p);let u=this.getNotificationKey(l);o.add(u),this.seenLobbies.has(u)||(s=!0),this.desktopNotifiedLobbies.has(u)||r.push(l)}if(this.updateQueueCardPulses(t),s&&this.soundEnabled&&C.playGameFoundSound(),this.desktopNotificationsEnabled){let l=new Set;for(let p of r){let u=J(p),f=this.getNotificationKey(p);z.show({title:u.title,body:u.body,tag:f})&&l.add(f)}this.desktopNotifiedLobbies=new Set([...[...this.desktopNotifiedLobbies].filter(p=>o.has(p)),...l])}else this.desktopNotifiedLobbies.clear();this.seenLobbies=o,this.gameFoundTime=o.size>0?this.gameFoundTime??Date.now():null,this.updateSearchTimer()}catch(t){console.error("[LobbyDiscovery] Error processing lobbies:",t)}}getNotificationKey(e){return JSON.stringify({gameID:e.gameID,mode:e.gameConfig?.gameMode??null,playerTeams:e.gameConfig?.playerTeams??e.gameConfig?.teamCount??null,capacity:e.gameConfig?.maxPlayers??e.maxClients??null,modifiers:e.gameConfig?.publicGameModifiers??{}})}isDiscoveryFeedbackAllowed(){return!(!P.isOnLobbyPage()||document.getElementById("page-play")?.classList.contains("hidden")||document.querySelector("public-lobby")?.isLobbyHighlighted===!0||document.querySelector("join-lobby-modal")?.currentLobbyId||document.querySelector("host-lobby-modal")?.lobbyId)}getDisplayedLobbiesBySource(e){let t={};for(let o of e){let r=_(o);!r||t[r]||(t[r]=o)}return t}getQueueCardElements(){let e=document.querySelector("game-mode-selector");if(!e)return{};let t=Array.from(e.querySelectorAll("div")).find(l=>l.className.includes("sm:grid-cols-[2fr_1fr]"));if(!(t instanceof HTMLElement))return{};let[o,r]=Array.from(t.children),s=r?Array.from(r.children):[];return{ffa:o?.querySelector("button"),special:s[0]?.querySelector("button"),team:s[1]?.querySelector("button")}}updateQueueCardPulses(e){this.activeMatchSources=new Set(e),this.applyQueueCardPulses(),this.scheduleQueueCardPulseSync()}applyQueueCardPulses(){let e=this.getQueueCardElements();for(let t of["ffa","special","team"]){let o=e[t];if(!o)continue;let r=this.activeMatchSources.has(t);o.classList.toggle("of-discovery-card-active",r),o.classList.remove("of-discovery-card-burst");let s=o.querySelector(".of-discovery-card-badge");s&&s.remove()}}scheduleQueueCardPulseSync(){this.pulseSyncTimeout&&clearTimeout(this.pulseSyncTimeout),this.pulseSyncTimeout=setTimeout(()=>{this.pulseSyncTimeout=null,this.applyQueueCardPulses()},16)}stopTimer(){this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null)}startGameInfoUpdates(){this.stopGameInfoUpdates(),this.updateCurrentGameInfo(),this.gameInfoInterval=setInterval(()=>this.updateCurrentGameInfo(),1e3)}stopGameInfoUpdates(){this.gameInfoInterval&&(clearInterval(this.gameInfoInterval),this.gameInfoInterval=null)}syncSearchTimer(e={}){let{resetStart:t=!1}=e;this.stopTimer(),t&&(this.searchStartTime=null,this.gameFoundTime=null,this.seenLobbies.clear(),this.desktopNotifiedLobbies.clear()),this.discoveryEnabled&&this.criteriaList.length>0&&this.isDiscoveryFeedbackAllowed()?(this.searchStartTime===null&&(this.searchStartTime=Date.now()),this.timerInterval=setInterval(()=>this.updateSearchTimer(),1e3)):(this.searchStartTime=null,this.gameFoundTime=null),this.updateSearchTimer()}setDiscoveryEnabled(e,t={}){this.discoveryEnabled=e,this.saveSettings(),this.updateUI(),this.syncSearchTimer({resetStart:t.resetTimer??!1})}getNumberValue(e){let t=document.getElementById(e);if(!t)return null;let o=parseInt(t.value,10);return Number.isNaN(o)?null:o}getModifierFilterValue(e){let t=document.getElementById(`${e}-allowed`);return document.getElementById(`${e}-blocked`)?.getAttribute("aria-pressed")==="true"||t?.getAttribute("aria-pressed")==="false"?"blocked":"allowed"}getNumericModifierState(e){let t={};for(let[o,r]of Object.entries(e))t[Number(o)]=this.getModifierFilterValue(r);return t}getModifierFiltersFromUI(){return{isCompact:this.getModifierFilterValue("modifier-isCompact"),isRandomSpawn:this.getModifierFilterValue("modifier-isRandomSpawn"),isCrowded:this.getModifierFilterValue("modifier-isCrowded"),isHardNations:this.getModifierFilterValue("modifier-isHardNations"),isAlliancesDisabled:this.getModifierFilterValue("modifier-isAlliancesDisabled"),isPortsDisabled:this.getModifierFilterValue("modifier-isPortsDisabled"),isNukesDisabled:this.getModifierFilterValue("modifier-isNukesDisabled"),isSAMsDisabled:this.getModifierFilterValue("modifier-isSAMsDisabled"),isPeaceTime:this.getModifierFilterValue("modifier-isPeaceTime"),startingGold:this.getNumericModifierState({1e6:"modifier-startingGold-1000000",5e6:"modifier-startingGold-5000000",25e6:"modifier-startingGold-25000000"}),goldMultiplier:this.getNumericModifierState({2:"modifier-goldMultiplier-2"})}}getAllTeamCountValues(){let e=[],t=["discovery-team-duos","discovery-team-trios","discovery-team-quads","discovery-team-hvn","discovery-team-2","discovery-team-3","discovery-team-4","discovery-team-5","discovery-team-6","discovery-team-7"];for(let o of t){let r=document.getElementById(o);if(r?.checked)if(r.value==="Duos"||r.value==="Trios"||r.value==="Quads"||r.value==="Humans Vs Nations")e.push(r.value);else{let s=parseInt(r.value,10);Number.isNaN(s)||e.push(s)}}return e}setAllTeamCounts(e){let t=["discovery-team-duos","discovery-team-trios","discovery-team-quads","discovery-team-hvn","discovery-team-2","discovery-team-3","discovery-team-4","discovery-team-5","discovery-team-6","discovery-team-7"];for(let o of t){let r=document.getElementById(o);r&&(r.checked=e)}}buildCriteriaFromUI(){let e=this.getModifierFiltersFromUI(),t=[];if(document.getElementById("discovery-ffa")?.checked&&t.push({gameMode:"FFA",teamCount:null,minPlayers:this.getNumberValue("discovery-ffa-min"),maxPlayers:this.getNumberValue("discovery-ffa-max"),modifiers:e}),!document.getElementById("discovery-team")?.checked)return t;let s=this.getAllTeamCountValues();if(s.length===0)return t.push({gameMode:"Team",teamCount:null,minPlayers:this.getNumberValue("discovery-team-min"),maxPlayers:this.getNumberValue("discovery-team-max"),modifiers:e}),t;for(let l of s)t.push({gameMode:"Team",teamCount:l,minPlayers:this.getNumberValue("discovery-team-min"),maxPlayers:this.getNumberValue("discovery-team-max"),modifiers:e});return t}updateUI(){let e=document.querySelector(".status-text"),t=document.querySelector(".status-indicator");!e||!t||(this.discoveryEnabled?(e.textContent="Discovery Active",t.style.background="#38d9a9",t.classList.add("active"),t.classList.remove("inactive")):(e.textContent="Discovery Paused",t.style.background="#888",t.classList.remove("active"),t.classList.add("inactive")))}applyModeVisibility(e,t){let o=document.getElementById(e);o&&o.classList.toggle("is-disabled",!t)}setTeamCountSelections(e){for(let t of e){let o=null;t==="Duos"?o=document.getElementById("discovery-team-duos"):t==="Trios"?o=document.getElementById("discovery-team-trios"):t==="Quads"?o=document.getElementById("discovery-team-quads"):t==="Humans Vs Nations"?o=document.getElementById("discovery-team-hvn"):typeof t=="number"&&(o=document.getElementById(`discovery-team-${t}`)),o&&(o.checked=!0)}}setModifierControl(e,t){let o=t??"allowed",r=document.getElementById(e),s=document.getElementById(`${e}-allowed`),l=document.getElementById(`${e}-blocked`);!r||!s||!l||(r.dataset.state=o,r.setAttribute("aria-valuetext",o),s.setAttribute("aria-pressed",String(o==="allowed")),l.setAttribute("aria-pressed",String(o==="blocked")))}loadUIFromSettings(){let e=this.criteriaList.find(c=>c.gameMode==="FFA"),t=this.criteriaList.filter(c=>c.gameMode==="Team"),o=document.getElementById("discovery-ffa"),r=document.getElementById("discovery-team");if(o&&(o.checked=!!e,this.applyModeVisibility("discovery-ffa-config",!!e)),r&&(r.checked=t.length>0,this.applyModeVisibility("discovery-team-config",t.length>0)),e){let c=document.getElementById("discovery-ffa-min"),y=document.getElementById("discovery-ffa-max");c&&e.minPlayers!==null&&(c.value=String(e.minPlayers)),y&&e.maxPlayers!==null&&(y.value=String(e.maxPlayers))}if(t[0]){let c=document.getElementById("discovery-team-min"),y=document.getElementById("discovery-team-max");c&&t[0].minPlayers!==null&&(c.value=String(t[0].minPlayers)),y&&t[0].maxPlayers!==null&&(y.value=String(t[0].maxPlayers)),this.setTeamCountSelections(t.map(w=>w.teamCount))}let l=(e??t[0])?.modifiers;if(l){this.setModifierControl("modifier-isCompact",l.isCompact),this.setModifierControl("modifier-isRandomSpawn",l.isRandomSpawn),this.setModifierControl("modifier-isCrowded",l.isCrowded),this.setModifierControl("modifier-isHardNations",l.isHardNations),this.setModifierControl("modifier-isAlliancesDisabled",l.isAlliancesDisabled),this.setModifierControl("modifier-isPortsDisabled",l.isPortsDisabled),this.setModifierControl("modifier-isNukesDisabled",l.isNukesDisabled),this.setModifierControl("modifier-isSAMsDisabled",l.isSAMsDisabled),this.setModifierControl("modifier-isPeaceTime",l.isPeaceTime);for(let c of ne)this.setModifierControl(`modifier-startingGold-${c}`,l.startingGold?.[c]);for(let c of se)this.setModifierControl(`modifier-goldMultiplier-${c}`,l.goldMultiplier?.[c])}else for(let c of["modifier-isCompact","modifier-isRandomSpawn","modifier-isCrowded","modifier-isHardNations","modifier-isAlliancesDisabled","modifier-isPortsDisabled","modifier-isNukesDisabled","modifier-isSAMsDisabled","modifier-isPeaceTime","modifier-startingGold-1000000","modifier-startingGold-5000000","modifier-startingGold-25000000","modifier-goldMultiplier-2"])this.setModifierControl(c,"allowed");let p=document.getElementById("discovery-sound-toggle");p&&(p.checked=this.soundEnabled);let u=document.getElementById("discovery-desktop-toggle");u&&(u.checked=this.desktopNotificationsEnabled);let f=document.getElementById("discovery-team-two-times");f&&(f.checked=this.isTeamTwoTimesMinEnabled)}initializeSlider(e,t,o,r,s,l,p,u=!1){let f=document.getElementById(e),c=document.getElementById(t),y=document.getElementById(o),w=document.getElementById(r);if(!f||!c||!y||!w)return;let h=parseInt(y.value,10),g=parseInt(w.value,10);Number.isNaN(h)||(f.value=String(h)),Number.isNaN(g)||(c.value=String(g));let x=()=>{this.updateSliderRange(e,t,o,r,s,l,p,u),this.refreshCriteria()};f.addEventListener("input",x),c.addEventListener("input",x),this.updateSliderRange(e,t,o,r,s,l,p,u)}updateSliderRange(e,t,o,r,s,l,p,u){let f=document.getElementById(e),c=document.getElementById(t),y=document.getElementById(o),w=document.getElementById(r),h=document.getElementById(s),g=document.getElementById(l),x=document.getElementById(p);if(!f||!c||!y||!w)return;let S=parseInt(f.value,10),L=parseInt(c.value,10);if(u&&this.isTeamTwoTimesMinEnabled&&(L=Math.min(parseInt(c.max,10),Math.max(1,L))),S>L&&(S=L,f.value=String(S)),y.value=String(S),w.value=String(L),g&&(g.textContent=S===1?"Any":String(S)),x&&(x.textContent=L===parseInt(c.max,10)?"Any":String(L)),h){let O=(S-parseInt(f.min,10))/(parseInt(f.max,10)-parseInt(f.min,10))*100,Z=(L-parseInt(f.min,10))/(parseInt(c.max,10)-parseInt(c.min,10))*100;h.style.left=`${O}%`,h.style.width=`${Z-O}%`}}refreshCriteria(){this.criteriaList=this.buildCriteriaFromUI(),this.saveSettings(),this.syncSearchTimer({resetStart:!0})}async handleDesktopNotificationToggleChange(e){let t=++this.desktopNotificationRequestId;if(!e.checked){this.desktopNotificationsEnabled=!1,this.saveSettings();return}let o=await z.ensurePermission();t!==this.desktopNotificationRequestId||this.isDisposed||!e.isConnected||!e.checked||(this.desktopNotificationsEnabled=o,e.checked=o,e.toggleAttribute("checked",o),this.saveSettings())}setupEventListeners(){document.getElementById("discovery-status")?.addEventListener("click",()=>{this.setDiscoveryEnabled(!this.discoveryEnabled,{resetTimer:!0})});for(let[t,o]of[["discovery-ffa","discovery-ffa-config"],["discovery-team","discovery-team-config"]]){let r=document.getElementById(t);r?.addEventListener("change",()=>{this.applyModeVisibility(o,r.checked),this.refreshCriteria()})}let e=document.getElementById("discovery-team-two-times");e?.addEventListener("change",()=>{this.isTeamTwoTimesMinEnabled=e.checked,this.updateSliderRange("discovery-team-min-slider","discovery-team-max-slider","discovery-team-min","discovery-team-max","discovery-team-range-fill","discovery-team-min-value","discovery-team-max-value",!0),this.refreshCriteria()}),document.getElementById("discovery-team-select-all")?.addEventListener("click",()=>{this.setAllTeamCounts(!0),this.refreshCriteria()}),document.getElementById("discovery-team-deselect-all")?.addEventListener("click",()=>{this.setAllTeamCounts(!1),this.refreshCriteria()});for(let t of["discovery-team-2","discovery-team-3","discovery-team-4","discovery-team-5","discovery-team-6","discovery-team-7","discovery-team-duos","discovery-team-trios","discovery-team-quads","discovery-team-hvn","discovery-sound-toggle","discovery-desktop-toggle"]){let o=document.getElementById(t);o&&o.addEventListener("change",()=>{if(t==="discovery-sound-toggle"&&o instanceof HTMLInputElement){this.soundEnabled=o.checked,this.saveSettings();return}if(t==="discovery-desktop-toggle"&&o instanceof HTMLInputElement){this.handleDesktopNotificationToggleChange(o);return}this.refreshCriteria()})}for(let t of["modifier-isCompact","modifier-isRandomSpawn","modifier-isCrowded","modifier-isHardNations","modifier-isAlliancesDisabled","modifier-isPortsDisabled","modifier-isNukesDisabled","modifier-isSAMsDisabled","modifier-isPeaceTime","modifier-startingGold-1000000","modifier-startingGold-5000000","modifier-startingGold-25000000","modifier-goldMultiplier-2"]){let o=document.getElementById(`${t}-allowed`),r=document.getElementById(`${t}-blocked`);for(let s of[o,r])s?.addEventListener("click",()=>{this.setModifierControl(t,s.dataset.value),this.refreshCriteria()})}}createModifierControl(e){return`
      <div
        id="${e}"
        class="discovery-binary-toggle"
        data-state="allowed"
        role="group"
        aria-valuetext="allowed"
      >
        <button
            type="button"
            class="discovery-binary-option"
            id="${e}-allowed"
            data-value="allowed"
            aria-pressed="true"
          >
          <span class="discovery-binary-label">Allowed</span>
        </button>
        <button
            type="button"
            class="discovery-binary-option"
            id="${e}-blocked"
            data-value="blocked"
            aria-pressed="false"
          >
          <span class="discovery-binary-label">Blocked</span>
        </button>
      </div>
    `}createUI(){document.getElementById("openfront-discovery-panel")||(this.panel=document.createElement("div"),this.panel.id="openfront-discovery-panel",this.panel.className="of-panel discovery-panel",this.panel.style.width="560px",this.panel.innerHTML=`
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
                            <div class="three-times-checkbox"><label for="discovery-team-two-times">2\xD7</label><input type="checkbox" id="discovery-team-two-times"></div>
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
                  <label><span>Compact</span>${this.createModifierControl("modifier-isCompact")}</label>
                  <label><span>Random Spawn</span>${this.createModifierControl("modifier-isRandomSpawn")}</label>
                  <label><span>Crowded</span>${this.createModifierControl("modifier-isCrowded")}</label>
                  <label><span>Hard Nations</span>${this.createModifierControl("modifier-isHardNations")}</label>
                  <label><span>Alliances Disabled</span>${this.createModifierControl("modifier-isAlliancesDisabled")}</label>
                  <label><span>Ports Disabled</span>${this.createModifierControl("modifier-isPortsDisabled")}</label>
                  <label><span>Nukes Disabled</span>${this.createModifierControl("modifier-isNukesDisabled")}</label>
                  <label><span>SAMs Disabled</span>${this.createModifierControl("modifier-isSAMsDisabled")}</label>
                  <label><span>Peace Time</span>${this.createModifierControl("modifier-isPeaceTime")}</label>
                  <label><span>Starting Gold 1M</span>${this.createModifierControl("modifier-startingGold-1000000")}</label>
                  <label><span>Starting Gold 5M</span>${this.createModifierControl("modifier-startingGold-5000000")}</label>
                  <label><span>Starting Gold 25M</span>${this.createModifierControl("modifier-startingGold-25000000")}</label>
                  <label><span>Gold Multiplier x2</span>${this.createModifierControl("modifier-goldMultiplier-2")}</label>
                </div>
              </div>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.panel),this.resizeHandler=new A(this.panel,e=>{this.panel.style.width=`${e}px`},k.lobbyDiscoveryPanelSize,460,88),this.setupEventListeners(),this.loadUIFromSettings(),this.initializeSlider("discovery-ffa-min-slider","discovery-ffa-max-slider","discovery-ffa-min","discovery-ffa-max","discovery-ffa-range-fill","discovery-ffa-min-value","discovery-ffa-max-value"),this.initializeSlider("discovery-team-min-slider","discovery-team-max-slider","discovery-team-min","discovery-team-max","discovery-team-range-fill","discovery-team-min-value","discovery-team-max-value",!0),this.updateUI(),this.syncSearchTimer(),this.startGameInfoUpdates())}updateSleepState(){let e=P.isOnLobbyPage();this.sleeping=!e,this.sleeping?(this.panel.classList.add("hidden"),this.stopTimer(),this.stopGameInfoUpdates(),this.updateQueueCardPulses(new Set)):(this.panel.classList.remove("hidden"),this.syncSearchTimer(),this.startGameInfoUpdates())}cleanup(){this.isDisposed=!0,this.stopTimer(),this.stopGameInfoUpdates(),this.pulseSyncTimeout&&(clearTimeout(this.pulseSyncTimeout),this.pulseSyncTimeout=null),this.activeMatchSources.clear(),this.resizeHandler?.destroy(),this.resizeHandler=null,this.applyQueueCardPulses(),this.panel.parentNode?.removeChild(this.panel)}};var R=class{constructor(){this.observer=null;this.animationFrameId=null}start(){this.observer||(this.observer=new MutationObserver(()=>this.scheduleApplyHighlights()),this.observer.observe(document.body,{attributes:!1,childList:!0,subtree:!0}),this.applyHighlights())}stop(){this.observer?.disconnect(),this.observer=null,this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}scheduleApplyHighlights(){this.animationFrameId===null&&(this.animationFrameId=requestAnimationFrame(()=>{this.animationFrameId=null,this.applyHighlights()}))}applyHighlights(){for(let e of Array.from(document.querySelectorAll("lobby-player-view")))this.applyHighlightToView(e)}applyHighlightToView(e){this.clearHighlights(e);let t=Array.from(e.querySelectorAll(".player-tag.current-player"));if(t.length>0){t.forEach(s=>s.classList.add("of-current-player-boost"));return}let o=this.getNativeTeamRows(e);o.forEach(s=>s.classList.add("of-current-player-boost"));let r=this.getNativeTeamCards(e);r.forEach(s=>s.classList.add("of-current-player-team-boost")),!(o.length>0||r.length>0)&&this.applyFallbackHighlight(e)}clearHighlights(e){e.querySelectorAll(".of-current-player-boost").forEach(t=>{t.classList.remove("of-current-player-boost")}),e.querySelectorAll(".of-current-player-team-boost").forEach(t=>{t.classList.remove("of-current-player-team-boost")})}getNativeTeamRows(e){return Array.from(e.querySelectorAll("div")).filter(t=>{let o=t.classList;return o.contains("bg-sky-600/20")&&o.contains("border-sky-500/40")})}getNativeTeamCards(e){return Array.from(e.querySelectorAll("div")).filter(t=>{let o=t.classList;return o.contains("rounded-xl")&&o.contains("border-sky-500/60")})}applyFallbackHighlight(e){let t=e.currentClientID,o=Array.isArray(e.clients)?e.clients:[];if(!t||o.length===0)return;let r=o.findIndex(g=>g?.clientID===t);if(r<0)return;let s=o[r],l=this.formatDisplayName(s),p=Array.from(e.querySelectorAll(".player-tag"));if(p[r]){p[r].classList.add("of-current-player-boost");return}Array.from(e.querySelectorAll("[data-client-id]")).filter(g=>g.dataset.clientId===t).forEach(g=>g.classList.add("of-current-player-boost")),this.findRowsByDisplayName(e,l).forEach(g=>g.classList.add("of-current-player-boost"));let c=Array.from(e.querySelectorAll(".rounded-xl")),h=(Array.isArray(e.teamPreview)?e.teamPreview:[]).filter(g=>Array.isArray(g.players)&&g.players.length>0).findIndex(g=>Array.isArray(g.players)&&g.players.some(x=>x?.clientID===t));h>=0&&c[h]&&(c[h].classList.add("of-current-player-team-boost"),this.findRowsByDisplayName(c[h],l).forEach(x=>x.classList.add("of-current-player-boost")))}formatDisplayName(e){return e?.username?e.clanTag?`[${e.clanTag}] ${e.username}`:e.username:""}findRowsByDisplayName(e,t){if(!t)return[];let o=[];for(let r of Array.from(e.querySelectorAll("span, div"))){let s=r.textContent?.trim();if(!s||s!==t)continue;let l=r.closest("[data-client-id]")??r.closest(".player-tag")??r.closest(".team-player-row")??r.closest("div");l&&!o.includes(l)&&o.push(l)}return o}};(function(){"use strict";console.log("[OpenFront Bundle] Initializing adaptation for OpenFront 0.30..."),GM_addStyle(q()),C.preloadSounds(),I.init(),G.start();let i=new B,e=new R;G.subscribe(t=>{i.receiveLobbyUpdate(t)}),e.start(),console.log("[OpenFront Bundle] Ready! \u{1F680}")})();})();
