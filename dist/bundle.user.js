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

"use strict";(()=>{var r={bgPrimary:"rgba(10, 14, 22, 0.92)",bgSecondary:"rgba(18, 26, 40, 0.75)",bgHover:"rgba(35, 48, 70, 0.6)",textPrimary:"#e7f1ff",textSecondary:"rgba(231, 241, 255, 0.7)",textMuted:"rgba(231, 241, 255, 0.5)",accent:"rgba(46, 211, 241, 0.95)",accentHover:"rgba(99, 224, 255, 0.95)",accentMuted:"rgba(46, 211, 241, 0.18)",accentAlt:"rgba(99, 110, 255, 0.9)",success:"rgba(20, 220, 170, 0.9)",successSolid:"#38d9a9",warning:"#f2c94c",error:"#ff7d87",highlight:"rgba(88, 211, 255, 0.2)",border:"rgba(120, 140, 180, 0.3)",borderAccent:"rgba(46, 211, 241, 0.55)"},b={display:"'Trebuchet MS', 'Segoe UI', Tahoma, Verdana, sans-serif",body:"'Segoe UI', Tahoma, Verdana, sans-serif",mono:"'Consolas', 'Courier New', monospace"},l={xs:"4px",sm:"8px",md:"12px",lg:"16px",xl:"20px",xxl:"24px"},v={sm:"4px",md:"6px",lg:"8px",xl:"12px"},I={sm:"0 2px 8px rgba(3, 8, 18, 0.35)",md:"0 10px 22px rgba(3, 8, 18, 0.45)",lg:"0 24px 40px rgba(2, 6, 16, 0.55), 0 0 24px rgba(46, 211, 241, 0.08)"},f={fast:"0.12s",normal:"0.2s",slow:"0.3s"};var _={threadCount:20,lobbyPollingRate:1e3},w={lobbyDiscoverySettings:"OF_LOBBY_DISCOVERY_SETTINGS",lobbyDiscoveryPanelSize:"OF_LOBBY_DISCOVERY_PANEL_SIZE"},R={panel:9998,panelOverlay:9999,modal:1e4,notification:2e4};function O(){return`
    :root {
      --of-hud-accent: ${r.accent};
      --of-hud-accent-soft: ${r.accentMuted};
      --of-hud-accent-alt: ${r.accentAlt};
      --of-hud-border: ${r.border};
      --of-hud-border-strong: ${r.borderAccent};
      --of-hud-bg: ${r.bgPrimary};
      --of-hud-bg-2: ${r.bgSecondary};
      --of-hud-text: ${r.textPrimary};
    }

    @keyframes ofPanelEnter {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .of-panel {
      position: fixed;
      background: linear-gradient(145deg, rgba(12, 18, 30, 0.98) 0%, rgba(10, 16, 26, 0.94) 60%, rgba(8, 12, 20, 0.96) 100%);
      border: 1px solid ${r.border};
      border-radius: ${v.lg};
      box-shadow: ${I.lg};
      font-family: ${b.body};
      color: ${r.textPrimary};
      user-select: none;
      z-index: ${R.panel};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      animation: ofPanelEnter ${f.slow} ease;
    }
    .of-panel input[type="checkbox"] { accent-color: ${r.accent}; }
    .of-panel.hidden { display: none; }
    .of-header {
      padding: ${l.md} ${l.lg};
      background: linear-gradient(90deg, rgba(20, 30, 46, 0.85), rgba(12, 18, 30, 0.6));
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      font-size: 0.85em;
      border-bottom: 1px solid ${r.border};
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${b.display};
    }
    .of-header-title {
      display: flex;
      align-items: center;
      gap: ${l.sm};
    }
    .discovery-header {
      cursor: pointer;
      gap: ${l.sm};
      padding: ${l.sm} ${l.md};
      font-size: 0.85em;
      position: relative;
    }
    .discovery-header:hover {
      background: ${r.bgHover};
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
      color: ${r.textPrimary};
      font-weight: 700;
    }
    .discovery-title-sub {
      font-size: 0.72em;
      color: ${r.textMuted};
      letter-spacing: 0.2em;
    }
    .of-content { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(80,110,160,0.4) transparent; }
    .of-content::-webkit-scrollbar { width: 7px; }
    .of-content::-webkit-scrollbar-thumb { background: rgba(80,110,160,0.4); border-radius: 5px; }

    .of-resize-handle {
      position: absolute;
      left: 0;
      top: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, ${r.accent}, rgba(46, 211, 241, 0.1));
      cursor: ew-resize;
      z-index: ${R.panel+1};
      opacity: 0.35;
      transition: opacity ${f.fast}, box-shadow ${f.fast};
    }
    .of-resize-handle:hover {
      opacity: 0.8;
      box-shadow: 0 0 12px rgba(46, 211, 241, 0.4);
    }
    .of-resize-handle.dragging {
      opacity: 1;
    }

    .discovery-panel {
      position: fixed;
      top: 24px;
      right: 24px;
      width: min(560px, calc(100vw - 32px));
      max-height: calc(100vh - 48px);
      margin: 0;
      border: 1px solid ${r.border};
      border-radius: ${v.lg};
      box-shadow: ${I.lg};
      transition: opacity ${f.slow}, transform ${f.slow};
      cursor: default;
      overflow: hidden;
    }
    .discovery-panel::after { display: none; }
    .discovery-panel.hidden { display: none; }
    .discovery-body { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .discovery-content { display: flex; flex-direction: column; gap: ${l.sm}; padding: ${l.sm} ${l.md} ${l.md}; overflow-y: auto; overflow-x: hidden; min-height: 0; }
    .discovery-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: ${l.sm};
      flex-wrap: wrap;
      padding: ${l.sm} ${l.md};
      background: rgba(18, 26, 40, 0.75);
      border: 1px solid ${r.border};
      border-radius: ${v.md};
    }
    .discovery-action-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: ${l.sm};
    }
    .discovery-modes { display: flex; flex-direction: column; gap: ${l.sm}; }
    .discovery-config-grid { display: flex; flex-direction: column; gap: ${l.sm}; }
    .discovery-config-card { flex: 1 1 auto; min-width: 0; width: 100%; background: rgba(14, 22, 34, 0.7); border: 1px solid ${r.border}; border-radius: ${v.md}; }
    .discovery-mode-inner {
      display: flex;
      flex-direction: column;
      gap: ${l.xs};
      margin-top: ${l.xs};
    }
    .discovery-mode-inner.is-disabled {
      opacity: 0.72;
    }
    .discovery-section {
      display: flex;
      flex-direction: column;
      gap: ${l.xs};
    }
    .discovery-section-title {
      font-size: 0.72em;
      color: ${r.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-family: ${b.display};
      margin-top: ${l.xs};
    }
    .discovery-footer { align-items: center; justify-content: flex-start; gap: ${l.sm}; flex-wrap: wrap; padding: ${l.sm} ${l.md}; background: rgba(14, 22, 34, 0.75); border-top: 1px solid ${r.border}; }
    .discovery-main-button {
      width: auto;
      flex: 1 1 160px;
      padding: ${l.sm} ${l.md};
      border: 1px solid ${r.border};
      border-radius: ${v.md};
      font-size: 0.8em;
      font-weight: 700;
      cursor: pointer;
      transition: all ${f.slow};
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${b.display};
    }
    .discovery-main-button.active { background: ${r.accent}; color: #04131a; border-color: ${r.accentHover}; box-shadow: 0 0 14px rgba(46, 211, 241, 0.35); }
    .discovery-main-button.inactive { background: rgba(28, 38, 58, 0.9); color: ${r.textSecondary}; }
    .discovery-mode-config { margin-bottom: ${l.xs}; padding: ${l.sm}; background: rgba(18, 26, 40, 0.8); border-radius: ${v.md}; border: 1px solid rgba(90, 110, 150, 0.35); }
    .mode-checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      cursor: pointer;
      margin-bottom: 6px;
      font-size: 0.8em;
      color: ${r.textPrimary};
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-family: ${b.display};
    }
    .mode-checkbox-label input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
    .player-filter-info { margin-bottom: 4px; padding: 2px 0; }
    .player-filter-info small { color: ${r.textSecondary}; font-size: 0.8em; }
    .capacity-range-wrapper { margin-top: 4px; }
    .capacity-range-visual { position: relative; padding: 8px 0 4px 0; }
    .capacity-track { position: relative; height: 6px; background: rgba(46, 211, 241, 0.2); border-radius: 3px; margin-bottom: ${l.sm}; }
    .team-count-options-centered { display: flex; justify-content: space-between; gap: 10px; margin: ${l.xs} 0; }
    .team-count-column { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; background: rgba(12, 18, 30, 0.6); padding: 5px; border-radius: ${v.sm}; border: 1px solid rgba(90, 110, 150, 0.25); }
    .team-count-column label { display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.78em; color: ${r.textPrimary}; white-space: nowrap; user-select: none; }
    .team-count-column input[type="checkbox"] { width: 16px; height: 16px; margin: 0; }
    .select-all-btn { background: rgba(46, 211, 241, 0.15); color: ${r.textPrimary}; border: 1px solid ${r.borderAccent}; border-radius: ${v.sm}; padding: ${l.xs} ${l.sm}; font-size: 0.75em; cursor: pointer; flex: 1; text-align: center; margin: 0 2px; text-transform: uppercase; letter-spacing: 0.1em; font-family: ${b.display}; }
    .select-all-btn:hover { background: rgba(46, 211, 241, 0.25); }
    .team-count-section > div:first-of-type { display: flex; gap: 5px; margin-bottom: ${l.xs}; }
    .team-count-section > label { font-size: 0.8em; color: ${r.textPrimary}; font-weight: 600; margin-bottom: 4px; display: block; text-transform: uppercase; letter-spacing: 0.08em; font-family: ${b.display}; }
    .capacity-labels { display: flex; justify-content: space-between; align-items: center; margin-top: ${l.sm}; }
    .three-times-checkbox { display: flex; align-items: center; gap: ${l.xs}; font-size: 0.78em; color: ${r.textPrimary}; margin: 0 5px; }
    .three-times-checkbox input[type="checkbox"] { width: 15px; height: 15px; }
    .capacity-range-fill { position: absolute; height: 100%; background: rgba(46, 211, 241, 0.5); border-radius: 3px; pointer-events: none; opacity: 0.7; transition: left 0.1s ease, width 0.1s ease; }
    .discovery-modifier-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: ${l.xs};
    }
    .discovery-modifier-grid label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${l.sm};
      font-size: 0.82em;
      color: ${r.textSecondary};
      min-width: 0;
    }
    .discovery-modifier-grid label > span:first-child {
      flex: 1 1 auto;
      min-width: 0;
      color: ${r.textPrimary};
      white-space: nowrap;
    }
    .discovery-binary-toggle {
      display: inline-grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2px;
      flex: 0 0 144px;
      min-width: 144px;
      padding: 2px;
      border: 1px solid ${r.border};
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
      color: ${r.textMuted};
      font-size: 0.66em;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-family: ${b.display};
      transition: background ${f.fast}, color ${f.fast}, box-shadow ${f.fast};
      user-select: none;
      white-space: nowrap;
    }
    .discovery-binary-option[aria-pressed="true"] .discovery-binary-label {
      color: ${r.textPrimary};
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
    .capacity-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${r.accent}; cursor: pointer; pointer-events: all; border: 2px solid rgba(5, 20, 26, 0.9); box-shadow: ${I.sm}; }
    .capacity-slider-min { z-index: 2; }
    .capacity-slider-max { z-index: 1; }
    .capacity-label-group { display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .capacity-label-group label { font-size: 0.8em; color: ${r.textSecondary}; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; font-family: ${b.display}; }
    .capacity-value { font-size: 0.85em; color: #FFFFFF; font-weight: 600; min-width: 40px; text-align: center; }
    .capacity-inputs-hidden { display: none; }
    .discovery-status { display: flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; flex-wrap: wrap; }
    @keyframes statusPulse {
      0% { box-shadow: 0 0 0 0 rgba(20, 220, 170, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(20, 220, 170, 0); }
      100% { box-shadow: 0 0 0 0 rgba(20, 220, 170, 0); }
    }
    .status-indicator { width: 8px; height: 8px; border-radius: 50%; background: ${r.success}; box-shadow: 0 0 10px rgba(20, 220, 170, 0.4); }
    .status-indicator.active { animation: statusPulse 2s infinite; }
    .status-indicator.inactive { animation: none; box-shadow: none; }
    .status-text { font-size: 0.8em; color: ${r.textPrimary}; text-transform: uppercase; letter-spacing: 0.12em; font-family: ${b.display}; }
    .search-timer { font-size: 0.8em; color: rgba(147, 197, 253, 0.9); font-weight: 500; font-family: ${b.mono}; }
    .discovery-settings { display: flex; align-items: center; gap: ${l.sm}; flex-wrap: wrap; }
    .discovery-toggle-label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.8em; color: ${r.textPrimary}; font-family: ${b.display}; text-transform: uppercase; letter-spacing: 0.08em; }
    .discovery-toggle-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }
    .current-game-info { margin: 6px 0; padding: 6px ${l.sm}; background: rgba(46, 211, 241, 0.1); border-radius: ${v.sm}; font-size: 0.8em; color: rgba(147, 197, 253, 0.9); text-align: center; border: 1px solid rgba(46, 211, 241, 0.25); }
    .current-game-info.not-applicable { background: rgba(100, 100, 100, 0.1); color: ${r.textMuted}; border-color: rgba(100, 100, 100, 0.2); font-style: italic; }
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
        box-shadow ${f.fast},
        filter ${f.fast},
        border-color ${f.fast};
      animation: discoveryCardActiveBeacon 1.45s ease-in-out infinite;
    }

  `}var E={gameFoundAudio:null,gameStartAudio:null,audioUnlocked:!1,preloadSounds(){try{this.gameFoundAudio=new Audio("https://github.com/DeLoWaN/openfront-autojoin-lobby/raw/refs/heads/main/notification_sounds/new-notification-014-363678.mp3"),this.gameFoundAudio.volume=.5,this.gameFoundAudio.preload="auto",this.gameStartAudio=new Audio("https://github.com/DeLoWaN/openfront-autojoin-lobby/raw/refs/heads/main/notification_sounds/opening-bell-421471.mp3"),this.gameStartAudio.volume=.5,this.gameStartAudio.preload="auto",this.setupAudioUnlock()}catch(i){console.warn("[SoundUtils] Could not preload audio:",i)}},setupAudioUnlock(){let i=()=>{if(this.audioUnlocked)return;let e=[];this.gameFoundAudio&&(this.gameFoundAudio.volume=.01,e.push(this.gameFoundAudio.play().then(()=>{this.gameFoundAudio&&(this.gameFoundAudio.pause(),this.gameFoundAudio.currentTime=0,this.gameFoundAudio.volume=.5)}).catch(()=>{}))),this.gameStartAudio&&(this.gameStartAudio.volume=.01,e.push(this.gameStartAudio.play().then(()=>{this.gameStartAudio&&(this.gameStartAudio.pause(),this.gameStartAudio.currentTime=0,this.gameStartAudio.volume=.5)}).catch(()=>{}))),Promise.all(e).then(()=>{this.audioUnlocked=!0,console.log("[SoundUtils] Audio unlocked successfully"),document.removeEventListener("click",i),document.removeEventListener("keydown",i),document.removeEventListener("touchstart",i)})};document.addEventListener("click",i,{once:!0}),document.addEventListener("keydown",i,{once:!0}),document.addEventListener("touchstart",i,{once:!0})},playGameFoundSound(){this.gameFoundAudio?(console.log("[SoundUtils] Attempting to play game found sound"),this.gameFoundAudio.currentTime=0,this.gameFoundAudio.play().catch(i=>{console.warn("[SoundUtils] Failed to play game found sound:",i)})):console.warn("[SoundUtils] Game found audio not initialized")},playGameStartSound(){this.gameStartAudio?(console.log("[SoundUtils] Attempting to play game start sound"),this.gameStartAudio.currentTime=0,this.gameStartAudio.play().catch(i=>{console.warn("[SoundUtils] Failed to play game start sound:",i)})):console.warn("[SoundUtils] Game start audio not initialized")}};var k={callbacks:[],lastUrl:location.href,initialized:!1,init(){if(this.initialized)return;this.initialized=!0;let i=()=>{location.href!==this.lastUrl&&(this.lastUrl=location.href,this.notify())};window.addEventListener("popstate",i),window.addEventListener("hashchange",i);let e=history.pushState,t=history.replaceState;history.pushState=function(...s){e.apply(history,s),setTimeout(i,0)},history.replaceState=function(...s){t.apply(history,s),setTimeout(i,0)},setInterval(i,200)},subscribe(i){this.callbacks.push(i),this.init()},notify(){this.callbacks.forEach(i=>i(location.href))}};var G={subscribers:[],fallbackInterval:null,fallbackStartTimeout:null,lastLobbies:[],pollingRate:_.lobbyPollingRate,started:!1,publicLobbiesListener:null,start(){this.started||(this.started=!0,this.publicLobbiesListener=i=>this.handlePublicLobbiesUpdate(i),document.addEventListener("public-lobbies-update",this.publicLobbiesListener),this.scheduleFallbackPolling())},stop(){this.started&&(this.started=!1,this.publicLobbiesListener&&(document.removeEventListener("public-lobbies-update",this.publicLobbiesListener),this.publicLobbiesListener=null),this.fallbackStartTimeout&&(clearTimeout(this.fallbackStartTimeout),this.fallbackStartTimeout=null),this.stopFallbackPolling())},subscribe(i){this.subscribers.push(i),this.lastLobbies.length>0&&i(this.lastLobbies)},scheduleFallbackPolling(){!this.started||this.fallbackInterval||this.fallbackStartTimeout||(this.fallbackStartTimeout=setTimeout(()=>{this.fallbackStartTimeout=null,this.startFallbackPolling()},this.pollingRate*2))},startFallbackPolling(){this.fallbackInterval||(this.fetchData(),this.fallbackInterval=setInterval(()=>void this.fetchData(),this.pollingRate))},stopFallbackPolling(){this.fallbackInterval&&(clearInterval(this.fallbackInterval),this.fallbackInterval=null)},async fetchData(){if(!(location.pathname!=="/"&&!location.pathname.startsWith("/public-lobby")))try{let i=await fetch("/api/public_lobbies");if(i.status===429){console.warn("[Bundle] Rate limited.");return}if(!i.ok){console.warn(`[Bundle] API error: ${i.status}`);return}let e=await i.json();this.lastLobbies=this.extractLobbies(e),this.notifySubscribers()}catch(i){console.error("[Bundle] API Error:",i)}},notifySubscribers(){this.subscribers.forEach(i=>i(this.lastLobbies))},handlePublicLobbiesUpdate(i){this.fallbackStartTimeout&&(clearTimeout(this.fallbackStartTimeout),this.fallbackStartTimeout=null),this.stopFallbackPolling();let e=i.detail?.payload;this.lastLobbies=this.extractLobbies(e),this.notifySubscribers(),this.scheduleFallbackPolling()},extractLobbies(i){if(!i||typeof i!="object")return[];if(Array.isArray(i.lobbies))return i.lobbies;let e=i.games;return e?["ffa","team","special"].flatMap(t=>(e[t]??[]).map(s=>({...s,publicGameType:s.publicGameType??t}))):[]}};var N={lastActionTime:0,debounceDelay:800,getLobbyButton(){return document.querySelector("public-lobby")?.querySelector("button.group.relative.isolate")},canJoinLobby(){let i=document.querySelector("public-lobby");if(!i)return!1;let e=this.getLobbyButton();return!!(e&&!i.isLobbyHighlighted&&i.lobbies&&i.lobbies.length>0&&!e.disabled&&e.offsetParent!==null)},verifyState(i){let e=document.querySelector("public-lobby");if(!e)return!1;let t=this.getLobbyButton();return!t||t.disabled||t.offsetParent===null?!1:i==="in"?e.isLobbyHighlighted===!0:i==="out"?!!(!e.isLobbyHighlighted&&e.lobbies&&e.lobbies.length>0):!1},tryJoinLobby(){let i=Date.now();if(i-this.lastActionTime<this.debounceDelay)return!1;let e=this.getLobbyButton(),t=document.querySelector("public-lobby");return e&&t&&!t.isLobbyHighlighted&&t.lobbies&&t.lobbies.length>0&&!e.disabled&&e.offsetParent!==null?(this.lastActionTime=i,e.click(),setTimeout(()=>{this.verifyState("in")||console.warn("[LobbyUtils] Join may have failed, state not updated")},100),!0):!1},isOnLobbyPage(){let i=document.getElementById("page-game");if(i&&!i.classList.contains("hidden"))return!1;let e=document.querySelector("canvas");if(e&&e.offsetParent!==null){let a=e.getBoundingClientRect();if(a.width>100&&a.height>100)return!1}let t=document.querySelector("public-lobby");if(t&&t.offsetParent!==null)return!0;if(t&&t.offsetParent===null)return!1;let s=document.getElementById("page-play");if(s&&!s.classList.contains("hidden")&&t)return!0;let o=window.location.pathname.replace(/\/+$/,"")||"/";return o==="/"||o==="/public-lobby"}};var U={isSupported(){return typeof Notification<"u"},isBackgrounded(){let i=document.visibilityState==="hidden"||document.hidden,e=typeof document.hasFocus=="function"?document.hasFocus():!0;return i||!e},async ensurePermission(){if(typeof Notification>"u")return!1;if(Notification.permission==="granted")return!0;if(Notification.permission==="denied")return!1;try{return await Notification.requestPermission()==="granted"}catch(i){return console.warn("[BrowserNotificationUtils] Permission request failed:",i),!1}},show(i){if(!this.isSupported()||!this.isBackgrounded())return!1;if(Notification.permission==="granted"){let e=new Notification(i.title,{body:i.body});return e.onclick=()=>{this.focusWindow(),e.close()},!0}return!1},focusWindow(){window.focus()}};var P=class{constructor(e,t,s=null,o=200,a=50){this.isDragging=!1;this.startX=0;this.startWidth=0;this.el=e,this.onResize=t,this.storageKey=s,this.minWidth=o,this.maxWidthVw=a,this.handleMouseDown=this._handleMouseDown.bind(this),this.handleMouseMove=this._handleMouseMove.bind(this),this.handleMouseUp=this._handleMouseUp.bind(this),this.handle=this.createHandle(),e.appendChild(this.handle),s&&this.loadWidth()}createHandle(){let e=document.createElement("div");return e.className="of-resize-handle",e.addEventListener("mousedown",this.handleMouseDown),e}loadWidth(){if(!this.storageKey)return;let e=GM_getValue(this.storageKey,null);if(e&&e.width){let t=this.clampWidth(e.width);this.el.style.width=t+"px",this.onResize(t)}}saveWidth(){this.storageKey&&GM_setValue(this.storageKey,{width:this.el.offsetWidth})}clampWidth(e){let t=window.innerWidth*(this.maxWidthVw/100);return Math.max(this.minWidth,Math.min(e,t))}_handleMouseDown(e){e.preventDefault(),e.stopPropagation(),this.isDragging=!0,this.startX=e.clientX,this.startWidth=this.el.offsetWidth,this.handle.classList.add("dragging"),document.addEventListener("mousemove",this.handleMouseMove),document.addEventListener("mouseup",this.handleMouseUp)}_handleMouseMove(e){if(!this.isDragging)return;let t=this.startX-e.clientX,s=this.clampWidth(this.startWidth+t);this.el.style.width=s+"px",this.onResize(s)}_handleMouseUp(){this.isDragging&&(this.isDragging=!1,this.handle.classList.remove("dragging"),document.removeEventListener("mousemove",this.handleMouseMove),document.removeEventListener("mouseup",this.handleMouseUp),this.saveWidth())}destroy(){this.handle.removeEventListener("mousedown",this.handleMouseDown),document.removeEventListener("mousemove",this.handleMouseMove),document.removeEventListener("mouseup",this.handleMouseUp),this.handle.parentNode&&this.handle.parentNode.removeChild(this.handle)}};var Z="allowed";function Q(i){if(!i)return null;let e=i.toLowerCase().trim();return e==="free for all"||e==="ffa"||e==="free-for-all"?"FFA":e==="team"||e==="teams"?"Team":null}function T(i){return Q(i.gameConfig?.gameMode)}function j(i){let e=i.publicGameType?.toLowerCase().trim();return e==="ffa"||e==="team"||e==="special"?e:null}function z(i){if(i==="Duos"||i==="Trios"||i==="Quads"||i==="Humans Vs Nations"||typeof i=="number"&&Number.isFinite(i)&&i>0)return i;if(typeof i=="string"){let e=parseInt(i,10);if(!Number.isNaN(e)&&e>0)return e}return null}function C(i){let e=i.gameConfig;if(!e||T(i)!=="Team")return null;let t=z(e.playerTeams??null);return t!==null?t:z(e.teamCount??e.teams??null)}function A(i){let e=i.gameConfig;return e?e.maxPlayers??e.maxClients??e.maxPlayersPerGame??i.maxClients??null:null}function D(i,e){return!i||!e?null:i==="Duos"?2:i==="Trios"?3:i==="Quads"?4:i==="Humans Vs Nations"?e:typeof i=="number"&&i>0?Math.floor(e/i):null}function $(i,e){let t=i.gameConfig?.publicGameModifiers;if(t)switch(e){case"isCompact":return t.isCompact;case"isRandomSpawn":return t.isRandomSpawn;case"isCrowded":return t.isCrowded;case"isHardNations":return t.isHardNations;case"isAlliancesDisabled":return t.isAlliancesDisabled;case"isPortsDisabled":return t.isPortsDisabled;case"isNukesDisabled":return t.isNukesDisabled;case"isSAMsDisabled":return t.isSAMsDisabled;case"isPeaceTime":return t.isPeaceTime;case"isWaterNukes":return t.isWaterNukes;case"startingGold":return t.startingGold;case"goldMultiplier":return t.goldMultiplier;default:return}}function K(i){let e=T(i),t=C(i),s=A(i);if(e==="FFA")return s!==null?`FFA \u2022 ${s} slots`:"FFA";if(e!=="Team")return"Unsupported mode";if(t==="Humans Vs Nations")return s!==null?`Humans Vs Nations (${s})`:"Humans Vs Nations";if(t==="Duos")return"Duos";if(t==="Trios")return"Trios";if(t==="Quads")return"Quads";if(typeof t=="number"&&s!==null){let o=D(t,s);return o!==null?`${t} teams (${o} per team)`:`${t} teams`}return"Team"}function ee(i){let e=T(i),t=C(i);return e==="FFA"?"FFA":e!=="Team"?"Unsupported mode":t==="Humans Vs Nations"?"Humans Vs Nations":t==="Duos"||t==="Trios"||t==="Quads"?t:typeof t=="number"?`${t} teams`:"Team"}function te(i){return i>=1e6&&i%1e6===0?`${i/1e6}M`:i>=1e3&&i%1e3===0?`${i/1e3}K`:String(i)}function ie(i){let e=i.gameConfig?.publicGameModifiers;if(!e)return[];let t=[];return e.isCompact&&t.push("Compact"),e.isRandomSpawn&&t.push("Random"),e.isCrowded&&t.push("Crowded"),e.isHardNations&&t.push("Hard"),typeof e.startingGold=="number"&&t.push(te(e.startingGold)),typeof e.goldMultiplier=="number"&&t.push(`x${e.goldMultiplier}`),e.isAlliancesDisabled&&t.push("No Alliances"),e.isPortsDisabled&&t.push("No Ports"),e.isNukesDisabled&&t.push("No Nukes"),e.isSAMsDisabled&&t.push("No SAMs"),e.isPeaceTime&&t.push("Peace"),e.isWaterNukes&&t.push("Water Nukes"),t}function Y(i){let e=[],t=i.gameConfig?.gameMap?.trim(),s=A(i),o=C(i),a=ee(i);if(t&&e.push(t),T(i)==="Team"&&o!=="Humans Vs Nations"){e.push(a);let c=D(o,s);c!==null&&e.push(`${c}/team`)}else e.push(a);let n=[];s!==null&&n.push(`${s} slots`);let u=ie(i);return u.length>0&&n.push(u.join(", ")),{title:e.join(" \u2022 "),body:n.join(" \u2022 ")}}function W(i){return typeof i=="number"&&Number.isFinite(i)?i:null}function g(i){return i==="blocked"||i==="rejected"?"blocked":i==="allowed"||i==="required"||i==="indifferent"?"allowed":Z}function q(i){if(!i||typeof i!="object")return;let e={};for(let[t,s]of Object.entries(i)){let o=Number(t);Number.isFinite(o)&&(e[o]=g(s))}return Object.keys(e).length>0?e:void 0}function se(i){if(!i||typeof i!="object")return;let e=i;return{isCompact:g(e.isCompact),isRandomSpawn:g(e.isRandomSpawn),isCrowded:g(e.isCrowded),isHardNations:g(e.isHardNations),isAlliancesDisabled:g(e.isAlliancesDisabled),isPortsDisabled:g(e.isPortsDisabled),isNukesDisabled:g(e.isNukesDisabled),isSAMsDisabled:g(e.isSAMsDisabled),isPeaceTime:g(e.isPeaceTime),isWaterNukes:g(e.isWaterNukes),startingGold:q(e.startingGold),goldMultiplier:q(e.goldMultiplier)}}function oe(i){if(!Array.isArray(i))return[];let e=[];for(let t of i){let s=t,o=Q(s.gameMode??null);o&&e.push({gameMode:o,teamCount:o==="Team"?z(s.teamCount??null):null,minPlayers:W(s.minPlayers),maxPlayers:W(s.maxPlayers),modifiers:se(s.modifiers)})}return e}function X(i){return{criteria:oe(i?.criteria),discoveryEnabled:typeof i?.discoveryEnabled=="boolean"?i.discoveryEnabled:!0,soundEnabled:typeof i?.soundEnabled=="boolean"?i.soundEnabled:!0,desktopNotificationsEnabled:typeof i?.desktopNotificationsEnabled=="boolean"?i.desktopNotificationsEnabled:!1,isTeamTwoTimesMinEnabled:typeof i?.isTeamTwoTimesMinEnabled=="boolean"?i.isTeamTwoTimesMinEnabled:!!i?.isTeamThreeTimesMinEnabled}}var ae=["isCompact","isRandomSpawn","isCrowded","isHardNations","isAlliancesDisabled","isPortsDisabled","isNukesDisabled","isSAMsDisabled","isPeaceTime","isWaterNukes"],F=class{matchesCriteria(e,t,s={}){if(!e||!e.gameConfig||!t||t.length===0)return!1;let o=T(e),a=A(e);if(!o||a===null)return!1;let n=C(e),u=o==="Team"?D(n,a):null;for(let c of t){if(c.gameMode!==o||o==="Team"&&(c.teamCount!==null&&c.teamCount!==void 0&&c.teamCount!==n||s.isTeamTwoTimesMinEnabled&&c.minPlayers!==null&&n!=="Humans Vs Nations"&&a<c.minPlayers*2||u===null))continue;let m=o==="Team"?u:a;if(m!==null&&!(c.minPlayers!==null&&m<c.minPlayers)&&!(c.maxPlayers!==null&&m>c.maxPlayers)&&this.matchesModifiers(e,c.modifiers))return!0}return!1}matchesModifiers(e,t){if(!t)return!0;for(let s of ae){let o=t[s];if(!o||o==="allowed")continue;let a=!!$(e,s);if(o==="blocked"&&a)return!1}return!(!this.matchesNumericModifier($(e,"startingGold"),t.startingGold)||!this.matchesNumericModifier($(e,"goldMultiplier"),t.goldMultiplier))}matchesNumericModifier(e,t){if(!t)return!0;let s=typeof e=="number"&&Number.isFinite(e)?e:null,o=Object.entries(t);if(o.length===0)return!0;let a=o.filter(([,n])=>n==="blocked").map(([n])=>Number(n));return!(s!==null&&a.includes(s))}};var ne=[1e6,5e6,25e6],re=[2],H=class{constructor(){this.discoveryEnabled=!0;this.criteriaList=[];this.searchStartTime=null;this.gameFoundTime=null;this.soundEnabled=!0;this.desktopNotificationsEnabled=!1;this.desktopNotificationRequestId=0;this.activeMatchSources=new Set;this.seenLobbies=new Set;this.desktopNotifiedLobbies=new Set;this.isTeamTwoTimesMinEnabled=!1;this.sleeping=!1;this.isDisposed=!1;this.timerInterval=null;this.gameInfoInterval=null;this.pulseSyncTimeout=null;this.resizeHandler=null;this.engine=new F,this.loadSettings(),this.createUI(),this.updateSleepState(),k.subscribe(()=>this.updateSleepState())}receiveLobbyUpdate(e){this.processLobbies(e)}isSoundEnabled(){return this.soundEnabled}loadSettings(){let e=GM_getValue(w.lobbyDiscoverySettings,null),t=X(e);GM_setValue(w.lobbyDiscoverySettings,t),this.criteriaList=t.criteria,this.soundEnabled=t.soundEnabled,this.desktopNotificationsEnabled=t.desktopNotificationsEnabled,this.discoveryEnabled=t.discoveryEnabled,this.isTeamTwoTimesMinEnabled=t.isTeamTwoTimesMinEnabled}saveSettings(){GM_setValue(w.lobbyDiscoverySettings,{criteria:this.criteriaList,discoveryEnabled:this.discoveryEnabled,soundEnabled:this.soundEnabled,desktopNotificationsEnabled:this.desktopNotificationsEnabled,isTeamTwoTimesMinEnabled:this.isTeamTwoTimesMinEnabled})}updateSearchTimer(){let e=document.getElementById("discovery-search-timer");if(!e)return;if(!this.discoveryEnabled||this.criteriaList.length===0||this.searchStartTime===null||!this.isDiscoveryFeedbackAllowed()){e.style.display="none";return}let t=this.gameFoundTime??Date.now(),s=Math.floor((t-this.searchStartTime)/1e3);e.textContent=this.gameFoundTime?`Match found (${Math.floor(s/60)}m ${s%60}s)`:`Scanning ${Math.floor(s/60)}m ${s%60}s`,e.style.display="inline"}updateCurrentGameInfo(){let e=document.getElementById("discovery-current-game-info");if(!e||!N.isOnLobbyPage()){e&&(e.style.display="none");return}let t=document.querySelector("public-lobby");if(!t||!Array.isArray(t.lobbies)||t.lobbies.length===0){e.style.display="none";return}let s=t.lobbies[0];if(!s||!s.gameConfig){e.style.display="none";return}e.style.display="block",e.textContent=`Current game: ${K(s)}`,e.classList.remove("not-applicable")}processLobbies(e){try{if(this.updateCurrentGameInfo(),this.syncSearchTimer(),!this.discoveryEnabled||this.criteriaList.length===0||!this.isDiscoveryFeedbackAllowed()){this.seenLobbies.clear(),this.desktopNotifiedLobbies.clear(),this.updateQueueCardPulses(new Set),this.gameFoundTime=null,this.updateSearchTimer();return}let t=new Set,s=new Set,o=[],a=!1;for(let n of e){let u=j(n);if(!u||!this.engine.matchesCriteria(n,this.criteriaList,{isTeamTwoTimesMinEnabled:this.isTeamTwoTimesMinEnabled}))continue;t.add(u);let c=this.getNotificationKey(n);s.add(c),this.seenLobbies.has(c)||(a=!0),this.desktopNotifiedLobbies.has(c)||o.push(n)}if(this.updateQueueCardPulses(t),a&&this.soundEnabled&&E.playGameFoundSound(),this.desktopNotificationsEnabled){let n=new Set;for(let u of o){let c=Y(u),m=this.getNotificationKey(u);U.show({title:c.title,body:c.body,tag:m})&&n.add(m)}this.desktopNotifiedLobbies=new Set([...[...this.desktopNotifiedLobbies].filter(u=>s.has(u)),...n])}else this.desktopNotifiedLobbies.clear();this.seenLobbies=s,this.gameFoundTime=s.size>0?this.gameFoundTime??Date.now():null,this.updateSearchTimer()}catch(t){console.error("[LobbyDiscovery] Error processing lobbies:",t)}}getNotificationKey(e){return JSON.stringify({gameID:e.gameID,mode:e.gameConfig?.gameMode??null,playerTeams:e.gameConfig?.playerTeams??e.gameConfig?.teamCount??null,capacity:e.gameConfig?.maxPlayers??e.maxClients??null,modifiers:e.gameConfig?.publicGameModifiers??{}})}isDiscoveryFeedbackAllowed(){return!(!N.isOnLobbyPage()||document.getElementById("page-play")?.classList.contains("hidden")||document.querySelector("public-lobby")?.isLobbyHighlighted===!0||document.querySelector("join-lobby-modal")?.currentLobbyId||document.querySelector("host-lobby-modal")?.lobbyId)}getQueueCardElements(){let e=document.querySelector("game-mode-selector");if(!e)return{};let t=Array.from(e.querySelectorAll("div")).find(n=>n.className.includes("sm:grid-cols-[2fr_1fr]"));if(!(t instanceof HTMLElement))return{};let[s,o]=Array.from(t.children),a=o?Array.from(o.children):[];return{ffa:s?.querySelector("button"),special:a[0]?.querySelector("button"),team:a[1]?.querySelector("button")}}updateQueueCardPulses(e){this.activeMatchSources=new Set(e),this.applyQueueCardPulses(),this.scheduleQueueCardPulseSync()}applyQueueCardPulses(){let e=this.getQueueCardElements();for(let t of["ffa","special","team"]){let s=e[t];if(!s)continue;let o=this.activeMatchSources.has(t);s.classList.toggle("of-discovery-card-active",o),s.classList.remove("of-discovery-card-burst");let a=s.querySelector(".of-discovery-card-badge");a&&a.remove()}}scheduleQueueCardPulseSync(){this.pulseSyncTimeout&&clearTimeout(this.pulseSyncTimeout),this.pulseSyncTimeout=setTimeout(()=>{this.pulseSyncTimeout=null,this.applyQueueCardPulses()},16)}stopTimer(){this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null)}startGameInfoUpdates(){this.stopGameInfoUpdates(),this.updateCurrentGameInfo(),this.gameInfoInterval=setInterval(()=>this.updateCurrentGameInfo(),1e3)}stopGameInfoUpdates(){this.gameInfoInterval&&(clearInterval(this.gameInfoInterval),this.gameInfoInterval=null)}syncSearchTimer(e={}){let{resetStart:t=!1}=e;this.stopTimer(),t&&(this.searchStartTime=null,this.gameFoundTime=null,this.seenLobbies.clear(),this.desktopNotifiedLobbies.clear()),this.discoveryEnabled&&this.criteriaList.length>0&&this.isDiscoveryFeedbackAllowed()?(this.searchStartTime===null&&(this.searchStartTime=Date.now()),this.timerInterval=setInterval(()=>this.updateSearchTimer(),1e3)):(this.searchStartTime=null,this.gameFoundTime=null),this.updateSearchTimer()}setDiscoveryEnabled(e,t={}){this.discoveryEnabled=e,this.saveSettings(),this.updateUI(),this.syncSearchTimer({resetStart:t.resetTimer??!1})}getNumberValue(e){let t=document.getElementById(e);if(!t)return null;let s=parseInt(t.value,10);return Number.isNaN(s)?null:s}getModifierFilterValue(e){let t=document.getElementById(`${e}-allowed`);return document.getElementById(`${e}-blocked`)?.getAttribute("aria-pressed")==="true"||t?.getAttribute("aria-pressed")==="false"?"blocked":"allowed"}getNumericModifierState(e){let t={};for(let[s,o]of Object.entries(e))t[Number(s)]=this.getModifierFilterValue(o);return t}getModifierFiltersFromUI(){return{isCompact:this.getModifierFilterValue("modifier-isCompact"),isRandomSpawn:this.getModifierFilterValue("modifier-isRandomSpawn"),isCrowded:this.getModifierFilterValue("modifier-isCrowded"),isHardNations:this.getModifierFilterValue("modifier-isHardNations"),isAlliancesDisabled:this.getModifierFilterValue("modifier-isAlliancesDisabled"),isPortsDisabled:this.getModifierFilterValue("modifier-isPortsDisabled"),isNukesDisabled:this.getModifierFilterValue("modifier-isNukesDisabled"),isSAMsDisabled:this.getModifierFilterValue("modifier-isSAMsDisabled"),isPeaceTime:this.getModifierFilterValue("modifier-isPeaceTime"),isWaterNukes:this.getModifierFilterValue("modifier-isWaterNukes"),startingGold:this.getNumericModifierState({1e6:"modifier-startingGold-1000000",5e6:"modifier-startingGold-5000000",25e6:"modifier-startingGold-25000000"}),goldMultiplier:this.getNumericModifierState({2:"modifier-goldMultiplier-2"})}}getAllTeamCountValues(){let e=[],t=["discovery-team-duos","discovery-team-trios","discovery-team-quads","discovery-team-hvn","discovery-team-2","discovery-team-3","discovery-team-4","discovery-team-5","discovery-team-6","discovery-team-7"];for(let s of t){let o=document.getElementById(s);if(o?.checked)if(o.value==="Duos"||o.value==="Trios"||o.value==="Quads"||o.value==="Humans Vs Nations")e.push(o.value);else{let a=parseInt(o.value,10);Number.isNaN(a)||e.push(a)}}return e}applyAutoTeamMin(){let t=[["discovery-team-duos",2],["discovery-team-trios",3],["discovery-team-quads",4]].filter(([a])=>document.getElementById(a)?.checked).map(([,a])=>a);if(t.length===0)return;let s=Math.min(...t),o=document.getElementById("discovery-team-min-slider");o&&(o.value=String(s),this.updateSliderRange("discovery-team-min-slider","discovery-team-max-slider","discovery-team-min","discovery-team-max","discovery-team-range-fill","discovery-team-min-value","discovery-team-max-value",!0))}setAllTeamCounts(e){let t=["discovery-team-duos","discovery-team-trios","discovery-team-quads","discovery-team-hvn","discovery-team-2","discovery-team-3","discovery-team-4","discovery-team-5","discovery-team-6","discovery-team-7"];for(let s of t){let o=document.getElementById(s);o&&(o.checked=e)}}buildCriteriaFromUI(){let e=this.getModifierFiltersFromUI(),t=[];if(document.getElementById("discovery-ffa")?.checked&&t.push({gameMode:"FFA",teamCount:null,minPlayers:this.getNumberValue("discovery-ffa-min"),maxPlayers:this.getNumberValue("discovery-ffa-max"),modifiers:e}),!document.getElementById("discovery-team")?.checked)return t;let a=this.getAllTeamCountValues();if(a.length===0)return t.push({gameMode:"Team",teamCount:null,minPlayers:this.getNumberValue("discovery-team-min"),maxPlayers:this.getNumberValue("discovery-team-max"),modifiers:e}),t;for(let n of a)t.push({gameMode:"Team",teamCount:n,minPlayers:this.getNumberValue("discovery-team-min"),maxPlayers:this.getNumberValue("discovery-team-max"),modifiers:e});return t}updateUI(){let e=document.querySelector(".status-text"),t=document.querySelector(".status-indicator");!e||!t||(this.discoveryEnabled?(e.textContent="Discovery Active",t.style.background="#38d9a9",t.classList.add("active"),t.classList.remove("inactive")):(e.textContent="Discovery Paused",t.style.background="#888",t.classList.remove("active"),t.classList.add("inactive")))}applyModeVisibility(e,t){let s=document.getElementById(e);s&&s.classList.toggle("is-disabled",!t)}setTeamCountSelections(e){for(let t of e){let s=null;t==="Duos"?s=document.getElementById("discovery-team-duos"):t==="Trios"?s=document.getElementById("discovery-team-trios"):t==="Quads"?s=document.getElementById("discovery-team-quads"):t==="Humans Vs Nations"?s=document.getElementById("discovery-team-hvn"):typeof t=="number"&&(s=document.getElementById(`discovery-team-${t}`)),s&&(s.checked=!0)}}setModifierControl(e,t){let s=t??"allowed",o=document.getElementById(e),a=document.getElementById(`${e}-allowed`),n=document.getElementById(`${e}-blocked`);!o||!a||!n||(o.dataset.state=s,o.setAttribute("aria-valuetext",s),a.setAttribute("aria-pressed",String(s==="allowed")),n.setAttribute("aria-pressed",String(s==="blocked")))}loadUIFromSettings(){let e=this.criteriaList.find(d=>d.gameMode==="FFA"),t=this.criteriaList.filter(d=>d.gameMode==="Team"),s=document.getElementById("discovery-ffa"),o=document.getElementById("discovery-team");if(s&&(s.checked=!!e,this.applyModeVisibility("discovery-ffa-config",!!e)),o&&(o.checked=t.length>0,this.applyModeVisibility("discovery-team-config",t.length>0)),e){let d=document.getElementById("discovery-ffa-min"),y=document.getElementById("discovery-ffa-max");d&&e.minPlayers!==null&&(d.value=String(e.minPlayers)),y&&e.maxPlayers!==null&&(y.value=String(e.maxPlayers))}if(t[0]){let d=document.getElementById("discovery-team-min"),y=document.getElementById("discovery-team-max");d&&t[0].minPlayers!==null&&(d.value=String(t[0].minPlayers)),y&&t[0].maxPlayers!==null&&(y.value=String(t[0].maxPlayers)),this.setTeamCountSelections(t.map(L=>L.teamCount))}let n=(e??t[0])?.modifiers;if(n){this.setModifierControl("modifier-isCompact",n.isCompact),this.setModifierControl("modifier-isRandomSpawn",n.isRandomSpawn),this.setModifierControl("modifier-isCrowded",n.isCrowded),this.setModifierControl("modifier-isHardNations",n.isHardNations),this.setModifierControl("modifier-isAlliancesDisabled",n.isAlliancesDisabled),this.setModifierControl("modifier-isPortsDisabled",n.isPortsDisabled),this.setModifierControl("modifier-isNukesDisabled",n.isNukesDisabled),this.setModifierControl("modifier-isSAMsDisabled",n.isSAMsDisabled),this.setModifierControl("modifier-isPeaceTime",n.isPeaceTime),this.setModifierControl("modifier-isWaterNukes",n.isWaterNukes);for(let d of ne)this.setModifierControl(`modifier-startingGold-${d}`,n.startingGold?.[d]);for(let d of re)this.setModifierControl(`modifier-goldMultiplier-${d}`,n.goldMultiplier?.[d])}else for(let d of["modifier-isCompact","modifier-isRandomSpawn","modifier-isCrowded","modifier-isHardNations","modifier-isAlliancesDisabled","modifier-isPortsDisabled","modifier-isNukesDisabled","modifier-isSAMsDisabled","modifier-isPeaceTime","modifier-isWaterNukes","modifier-startingGold-1000000","modifier-startingGold-5000000","modifier-startingGold-25000000","modifier-goldMultiplier-2"])this.setModifierControl(d,"allowed");let u=document.getElementById("discovery-sound-toggle");u&&(u.checked=this.soundEnabled);let c=document.getElementById("discovery-desktop-toggle");c&&(c.checked=this.desktopNotificationsEnabled);let m=document.getElementById("discovery-team-two-times");m&&(m.checked=this.isTeamTwoTimesMinEnabled)}initializeSlider(e,t,s,o,a,n,u,c=!1){let m=document.getElementById(e),d=document.getElementById(t),y=document.getElementById(s),L=document.getElementById(o);if(!m||!d||!y||!L)return;let h=parseInt(y.value,10),p=parseInt(L.value,10);Number.isNaN(h)||(m.value=String(h)),Number.isNaN(p)||(d.value=String(p));let x=()=>{this.updateSliderRange(e,t,s,o,a,n,u,c),this.refreshCriteria()};m.addEventListener("input",x),d.addEventListener("input",x),this.updateSliderRange(e,t,s,o,a,n,u,c)}updateSliderRange(e,t,s,o,a,n,u,c){let m=document.getElementById(e),d=document.getElementById(t),y=document.getElementById(s),L=document.getElementById(o),h=document.getElementById(a),p=document.getElementById(n),x=document.getElementById(u);if(!m||!d||!y||!L)return;let S=parseInt(m.value,10),M=parseInt(d.value,10);if(c&&this.isTeamTwoTimesMinEnabled&&(M=Math.min(parseInt(d.max,10),Math.max(1,M))),S>M&&(S=M,m.value=String(S)),y.value=String(S),L.value=String(M),p&&(p.textContent=S===1?"Any":String(S)),x&&(x.textContent=M===parseInt(d.max,10)?"Any":String(M)),h){let V=(S-parseInt(m.min,10))/(parseInt(m.max,10)-parseInt(m.min,10))*100,J=(M-parseInt(m.min,10))/(parseInt(d.max,10)-parseInt(d.min,10))*100;h.style.left=`${V}%`,h.style.width=`${J-V}%`}}refreshCriteria(){this.criteriaList=this.buildCriteriaFromUI(),this.saveSettings(),this.syncSearchTimer({resetStart:!0})}async handleDesktopNotificationToggleChange(e){let t=++this.desktopNotificationRequestId;if(!e.checked){this.desktopNotificationsEnabled=!1,this.saveSettings();return}let s=await U.ensurePermission();t!==this.desktopNotificationRequestId||this.isDisposed||!e.isConnected||!e.checked||(this.desktopNotificationsEnabled=s,e.checked=s,e.toggleAttribute("checked",s),this.saveSettings())}setupEventListeners(){document.getElementById("discovery-status")?.addEventListener("click",()=>{this.setDiscoveryEnabled(!this.discoveryEnabled,{resetTimer:!0})});for(let[t,s]of[["discovery-ffa","discovery-ffa-config"],["discovery-team","discovery-team-config"]]){let o=document.getElementById(t);o?.addEventListener("change",()=>{this.applyModeVisibility(s,o.checked),this.refreshCriteria()})}let e=document.getElementById("discovery-team-two-times");e?.addEventListener("change",()=>{this.isTeamTwoTimesMinEnabled=e.checked,this.updateSliderRange("discovery-team-min-slider","discovery-team-max-slider","discovery-team-min","discovery-team-max","discovery-team-range-fill","discovery-team-min-value","discovery-team-max-value",!0),this.refreshCriteria()}),document.getElementById("discovery-team-select-all")?.addEventListener("click",()=>{this.setAllTeamCounts(!0),this.refreshCriteria()}),document.getElementById("discovery-team-deselect-all")?.addEventListener("click",()=>{this.setAllTeamCounts(!1),this.refreshCriteria()});for(let t of["discovery-team-2","discovery-team-3","discovery-team-4","discovery-team-5","discovery-team-6","discovery-team-7","discovery-team-duos","discovery-team-trios","discovery-team-quads","discovery-team-hvn","discovery-sound-toggle","discovery-desktop-toggle"]){let s=document.getElementById(t);s&&s.addEventListener("change",()=>{if(t==="discovery-sound-toggle"&&s instanceof HTMLInputElement){this.soundEnabled=s.checked,this.saveSettings();return}if(t==="discovery-desktop-toggle"&&s instanceof HTMLInputElement){this.handleDesktopNotificationToggleChange(s);return}(t==="discovery-team-duos"||t==="discovery-team-trios"||t==="discovery-team-quads")&&this.applyAutoTeamMin(),this.refreshCriteria()})}for(let t of["modifier-isCompact","modifier-isRandomSpawn","modifier-isCrowded","modifier-isHardNations","modifier-isAlliancesDisabled","modifier-isPortsDisabled","modifier-isNukesDisabled","modifier-isSAMsDisabled","modifier-isPeaceTime","modifier-isWaterNukes","modifier-startingGold-1000000","modifier-startingGold-5000000","modifier-startingGold-25000000","modifier-goldMultiplier-2"]){let s=document.getElementById(`${t}-allowed`),o=document.getElementById(`${t}-blocked`);for(let a of[s,o])a?.addEventListener("click",()=>{this.setModifierControl(t,a.dataset.value),this.refreshCriteria()})}}createModifierControl(e){return`
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
                  <label><span>Water Nukes</span>${this.createModifierControl("modifier-isWaterNukes")}</label>
                  <label><span>Starting Gold 1M</span>${this.createModifierControl("modifier-startingGold-1000000")}</label>
                  <label><span>Starting Gold 5M</span>${this.createModifierControl("modifier-startingGold-5000000")}</label>
                  <label><span>Starting Gold 25M</span>${this.createModifierControl("modifier-startingGold-25000000")}</label>
                  <label><span>Gold Multiplier x2</span>${this.createModifierControl("modifier-goldMultiplier-2")}</label>
                </div>
              </div>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.panel),this.resizeHandler=new P(this.panel,e=>{this.panel.style.width=`${e}px`},w.lobbyDiscoveryPanelSize,460,88),this.setupEventListeners(),this.loadUIFromSettings(),this.initializeSlider("discovery-ffa-min-slider","discovery-ffa-max-slider","discovery-ffa-min","discovery-ffa-max","discovery-ffa-range-fill","discovery-ffa-min-value","discovery-ffa-max-value"),this.initializeSlider("discovery-team-min-slider","discovery-team-max-slider","discovery-team-min","discovery-team-max","discovery-team-range-fill","discovery-team-min-value","discovery-team-max-value",!0),this.updateUI(),this.syncSearchTimer(),this.startGameInfoUpdates())}updateSleepState(){let e=N.isOnLobbyPage();this.sleeping=!e,this.sleeping?(this.panel.classList.add("hidden"),this.stopTimer(),this.stopGameInfoUpdates(),this.updateQueueCardPulses(new Set)):(this.panel.classList.remove("hidden"),this.syncSearchTimer(),this.startGameInfoUpdates())}cleanup(){this.isDisposed=!0,this.stopTimer(),this.stopGameInfoUpdates(),this.pulseSyncTimeout&&(clearTimeout(this.pulseSyncTimeout),this.pulseSyncTimeout=null),this.activeMatchSources.clear(),this.resizeHandler?.destroy(),this.resizeHandler=null,this.applyQueueCardPulses(),this.panel.parentNode?.removeChild(this.panel)}};var B=class{constructor(){this.observer=null;this.animationFrameId=null}start(){this.observer||(this.observer=new MutationObserver(()=>this.scheduleApplyHighlights()),this.observer.observe(document.body,{attributes:!1,childList:!0,subtree:!0}),this.applyHighlights())}stop(){this.observer?.disconnect(),this.observer=null,this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}scheduleApplyHighlights(){this.animationFrameId===null&&(this.animationFrameId=requestAnimationFrame(()=>{this.animationFrameId=null,this.applyHighlights()}))}applyHighlights(){for(let e of Array.from(document.querySelectorAll("lobby-player-view")))this.applyHighlightToView(e)}applyHighlightToView(e){this.clearHighlights(e);let t=Array.from(e.querySelectorAll(".player-tag.current-player"));if(t.length>0){t.forEach(a=>a.classList.add("of-current-player-boost"));return}let s=this.getNativeTeamRows(e);s.forEach(a=>a.classList.add("of-current-player-boost"));let o=this.getNativeTeamCards(e);o.forEach(a=>a.classList.add("of-current-player-team-boost")),!(s.length>0||o.length>0)&&this.applyFallbackHighlight(e)}clearHighlights(e){e.querySelectorAll(".of-current-player-boost").forEach(t=>{t.classList.remove("of-current-player-boost")}),e.querySelectorAll(".of-current-player-team-boost").forEach(t=>{t.classList.remove("of-current-player-team-boost")})}getNativeTeamRows(e){return Array.from(e.querySelectorAll("div")).filter(t=>{let s=t.classList;return s.contains("bg-sky-600/20")&&s.contains("border-sky-500/40")})}getNativeTeamCards(e){return Array.from(e.querySelectorAll("div")).filter(t=>{let s=t.classList;return s.contains("rounded-xl")&&s.contains("border-sky-500/60")})}applyFallbackHighlight(e){let t=e.currentClientID,s=Array.isArray(e.clients)?e.clients:[];if(!t||s.length===0)return;let o=s.findIndex(p=>p?.clientID===t);if(o<0)return;let a=s[o],n=this.formatDisplayName(a),u=Array.from(e.querySelectorAll(".player-tag"));if(u[o]){u[o].classList.add("of-current-player-boost");return}Array.from(e.querySelectorAll("[data-client-id]")).filter(p=>p.dataset.clientId===t).forEach(p=>p.classList.add("of-current-player-boost")),this.findRowsByDisplayName(e,n).forEach(p=>p.classList.add("of-current-player-boost"));let d=Array.from(e.querySelectorAll(".rounded-xl")),h=(Array.isArray(e.teamPreview)?e.teamPreview:[]).filter(p=>Array.isArray(p.players)&&p.players.length>0).findIndex(p=>Array.isArray(p.players)&&p.players.some(x=>x?.clientID===t));h>=0&&d[h]&&(d[h].classList.add("of-current-player-team-boost"),this.findRowsByDisplayName(d[h],n).forEach(x=>x.classList.add("of-current-player-boost")))}formatDisplayName(e){return e?.username?e.clanTag?`[${e.clanTag}] ${e.username}`:e.username:""}findRowsByDisplayName(e,t){if(!t)return[];let s=[];for(let o of Array.from(e.querySelectorAll("span, div"))){let a=o.textContent?.trim();if(!a||a!==t)continue;let n=o.closest("[data-client-id]")??o.closest(".player-tag")??o.closest(".team-player-row")??o.closest("div");n&&!s.includes(n)&&s.push(n)}return s}};(function(){"use strict";console.log("[OpenFront Bundle] Initializing adaptation for OpenFront 0.30..."),GM_addStyle(O()),E.preloadSounds(),k.init(),G.start();let i=new H,e=new B;G.subscribe(o=>{i.receiveLobbyUpdate(o)}),e.start();let t=o=>{try{return new URL(o).searchParams.has("live")}catch{return!1}},s=t(location.href);k.subscribe(o=>{let a=t(o);!s&&a&&i.isSoundEnabled()&&E.playGameStartSound(),s=a}),console.log("[OpenFront Bundle] Ready! \u{1F680}")})();})();
