// ==UserScript==
// @name         OpenFront Game Notifier
// @namespace    https://openfront.io/
// @version      2.10.0
// @description  Notifies you when a public OpenFront lobby matches your filters (mode, team format, capacity, modifiers) via in-page highlight, sound, and optional desktop notifications. Never auto-joins.
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

"use strict";(()=>{var u={bgPrimary:"#0d0f10",bgSecondary:"#14171a",bgElevated:"#1a1e22",bgRaised:"#20252a",bgHover:"rgba(255,255,255,0.04)",textPrimary:"#f2f1ee",textSecondary:"#c8c6c0",textMuted:"#8e8c85",textFaint:"#5a5853",border:"rgba(255,255,255,0.06)",borderSubtle:"rgba(255,255,255,0.10)",borderStrong:"rgba(255,255,255,0.16)",accent:"#7aa7d4",accentSoft:"rgba(122,167,212,0.14)",accentLine:"rgba(122,167,212,0.32)",accentShadow:"122,167,212",warning:"#d4a056",warningSoft:"rgba(212,160,86,0.14)",danger:"#d27a6b",dangerSoft:"rgba(210,122,107,0.14)",dangerLine:"rgba(210,122,107,0.30)",accentMuted:"rgba(122,167,212,0.14)",accentHover:"#9bbfe0",accentAlt:"#9bbfe0",borderAccent:"rgba(122,167,212,0.32)",highlight:"rgba(122,167,212,0.20)",success:"#74c69d",successSolid:"#74c69d",error:"#d27a6b"},p={body:"'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",display:"'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",mono:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"};var G={sm:"6px",md:"7px",lg:"10px",xl:"14px"},E={sm:"0 1px 3px rgba(0,0,0,0.4)",md:"0 2px 8px rgba(0,0,0,0.3)",lg:"0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)"},c={fast:"0.12s",normal:"0.2s",slow:"0.3s"};var j={threadCount:20,lobbyPollingRate:1e3},C={lobbyDiscoverySettings:"OF_LOBBY_DISCOVERY_SETTINGS",lobbyDiscoveryPanelSize:"OF_LOBBY_DISCOVERY_PANEL_SIZE"},W={panel:9998,panelOverlay:9999,modal:1e4,notification:2e4};function K(){return`
    :root {
      --of-hud-accent: ${u.accent};
      --of-hud-accent-soft: ${u.accentSoft};
      --of-hud-accent-line: ${u.accentLine};
      --of-hud-bg-0: ${u.bgPrimary};
      --of-hud-bg-1: ${u.bgSecondary};
      --of-hud-bg-2: ${u.bgElevated};
      --of-hud-bg-3: ${u.bgRaised};
      --of-hud-text-1: ${u.textPrimary};
      --of-hud-text-2: ${u.textSecondary};
      --of-hud-text-3: ${u.textMuted};
      --of-hud-text-4: ${u.textFaint};
      --of-hud-line-1: ${u.border};
      --of-hud-line-2: ${u.borderSubtle};
      --of-hud-line-3: ${u.borderStrong};
      --of-hud-danger: ${u.danger};
      --of-hud-danger-soft: ${u.dangerSoft};
      --of-hud-danger-line: ${u.dangerLine};
    }

    @keyframes ofPanelEnter {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes livePulse {
      0%   { box-shadow: 0 0 0 0 rgba(${u.accentShadow}, 0.5); }
      70%  { box-shadow: 0 0 0 8px rgba(${u.accentShadow}, 0); }
      100% { box-shadow: 0 0 0 0 rgba(${u.accentShadow}, 0); }
    }

    .of-panel {
      position: fixed;
      background: linear-gradient(180deg, var(--of-hud-bg-2) 0%, var(--of-hud-bg-1) 100%);
      border: 1px solid var(--of-hud-line-2);
      border-radius: ${G.xl};
      box-shadow: ${E.lg};
      font-family: ${p.body};
      color: var(--of-hud-text-1);
      user-select: none;
      z-index: ${W.panel};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: ofPanelEnter ${c.slow} ease;
    }
    .of-panel.hidden { display: none; }

    .discovery-panel {
      top: 24px;
      right: 24px;
      width: 380px;
      max-height: calc(100vh - 48px);
    }

    .discovery-body {
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
      overflow: hidden;
    }

    /* Status pill */
    .ld-status {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid var(--of-hud-line-1);
      background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
    }
    .ld-pulse {
      position: relative;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--of-hud-accent);
      box-shadow: 0 0 0 0 var(--of-hud-accent);
      animation: livePulse 2s cubic-bezier(.4,0,.2,1) infinite;
      flex-shrink: 0;
    }
    .ld-pulse.is-paused {
      background: var(--of-hud-text-4);
      animation: none;
      box-shadow: none;
    }
    .ld-status-text {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-size: 12px;
      color: var(--of-hud-text-2);
      cursor: pointer;
    }
    .ld-status-text strong {
      font-weight: 500;
      color: var(--of-hud-text-1);
      letter-spacing: 0.01em;
    }
    .ld-status-text .sep { color: var(--of-hud-text-4); }
    .ld-status-text .meta {
      font-family: ${p.mono};
      font-size: 11px;
      color: var(--of-hud-text-3);
      font-variant-numeric: tabular-nums;
    }
    .ld-icons {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .ld-icon-btn {
      appearance: none;
      border: 0;
      cursor: pointer;
      width: 26px;
      height: 26px;
      display: grid;
      place-items: center;
      border-radius: 7px;
      background: transparent;
      color: var(--of-hud-text-3);
      transition: background ${c.fast}, color ${c.fast};
      padding: 0;
    }
    .ld-icon-btn:hover {
      background: var(--of-hud-bg-3);
      color: var(--of-hud-text-1);
    }
    .ld-icon-btn.is-on {
      background: var(--of-hud-accent-soft);
      color: var(--of-hud-accent);
    }
    .ld-icon-btn svg {
      width: 14px;
      height: 14px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .ld-icon-btn input { display: none; }

    /* Header */
    .ld-head {
      padding: 16px 18px 12px;
      border-bottom: 1px solid var(--of-hud-line-1);
      flex-shrink: 0;
    }
    .ld-eyebrow {
      font-family: ${p.mono};
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--of-hud-text-4);
      margin-bottom: 4px;
    }
    .ld-title {
      font-family: ${p.display};
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--of-hud-text-1);
      margin: 0;
    }

    /* Scroll body */
    .discovery-content {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.08) transparent;
    }
    .discovery-content::-webkit-scrollbar { width: 8px; }
    .discovery-content::-webkit-scrollbar-track { background: transparent; }
    .discovery-content::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.08);
      border-radius: 4px;
      border: 2px solid transparent;
      background-clip: content-box;
    }

    .ld-section {
      padding: 16px 18px 14px;
      border-bottom: 1px solid var(--of-hud-line-1);
    }
    .ld-section:last-child { border-bottom: 0; }

    .ld-section-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .ld-section-label {
      font-family: ${p.mono};
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--of-hud-text-3);
    }
    .ld-section-aside {
      font-size: 11px;
      color: var(--of-hud-text-4);
    }

    /* Mode segmented selector */
    .ld-modes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 4px;
      background: var(--of-hud-bg-0);
      border: 1px solid var(--of-hud-line-1);
      border-radius: 10px;
      margin-bottom: 14px;
    }
    .ld-mode-btn {
      appearance: none;
      border: 0;
      cursor: pointer;
      background: transparent;
      color: var(--of-hud-text-3);
      padding: 8px 10px;
      border-radius: 7px;
      font: inherit;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background ${c.fast}, color ${c.fast};
    }
    .ld-mode-btn:hover { color: var(--of-hud-text-1); }
    .ld-mode-btn.is-on {
      background: var(--of-hud-bg-3);
      color: var(--of-hud-text-1);
      box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.3);
    }
    .ld-mode-btn .check {
      width: 14px;
      height: 14px;
      border-radius: 4px;
      border: 1.5px solid var(--of-hud-text-4);
      display: grid;
      place-items: center;
      transition: background ${c.fast}, border-color ${c.fast};
      flex-shrink: 0;
    }
    .ld-mode-btn.is-on .check {
      background: var(--of-hud-accent);
      border-color: var(--of-hud-accent);
    }
    .ld-mode-btn.is-on .check svg {
      width: 9px;
      height: 9px;
      stroke: var(--of-hud-bg-0);
      stroke-width: 2.5;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Mode panel */
    .ld-mode-panel {
      background: rgba(0,0,0,0.18);
      border: 1px solid var(--of-hud-line-1);
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 10px;
      transition: opacity ${c.normal};
    }
    .ld-mode-panel.is-off {
      opacity: 0.4;
      pointer-events: none;
    }
    .ld-mode-panel-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .ld-mode-panel-head .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--of-hud-accent);
    }
    .ld-mode-panel.is-off .ld-mode-panel-head .dot {
      background: var(--of-hud-text-4);
    }
    .ld-mode-panel-head .title {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: var(--of-hud-text-1);
      text-transform: uppercase;
    }

    .ld-format-label {
      font-size: 11px;
      color: var(--of-hud-text-4);
      font-family: ${p.mono};
      letter-spacing: 0.06em;
      margin-bottom: 6px;
    }

    /* Format chips */
    .ld-formats {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 6px;
    }
    .ld-formats:last-of-type { margin-bottom: 14px; }
    .ld-chip {
      appearance: none;
      cursor: pointer;
      background: var(--of-hud-bg-3);
      color: var(--of-hud-text-3);
      padding: 5px 10px;
      border-radius: 6px;
      font: inherit;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid transparent;
      transition: background ${c.fast}, color ${c.fast}, border-color ${c.fast};
    }
    .ld-chip:hover { color: var(--of-hud-text-1); }
    .ld-chip.is-on {
      background: var(--of-hud-accent-soft);
      color: var(--of-hud-accent);
      border-color: var(--of-hud-accent-line);
    }

    /* Slider */
    .ld-slider-row { margin-bottom: 4px; }
    .ld-slider-label {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 11px;
      color: var(--of-hud-text-3);
      margin-bottom: 8px;
    }
    .ld-slider-label .val {
      font-family: ${p.mono};
      color: var(--of-hud-text-1);
      font-variant-numeric: tabular-nums;
    }
    .ld-slider-label .val .sep {
      color: var(--of-hud-text-4);
      margin: 0 4px;
    }
    .ld-range {
      --lo: 0%;
      --hi: 100%;
      position: relative;
      height: 22px;
      margin: 0 6px;
    }
    .ld-range .track {
      position: absolute;
      left: -6px;
      right: -6px;
      top: 9px;
      height: 4px;
      background: var(--of-hud-bg-3);
      border-radius: 2px;
    }
    .ld-range .track-fill {
      position: absolute;
      top: 0;
      bottom: 0;
      left: var(--lo);
      right: calc(100% - var(--hi));
      background: var(--of-hud-accent);
      border-radius: 2px;
    }
    .capacity-slider {
      position: absolute;
      left: -6px;
      right: -6px;
      width: calc(100% + 12px);
      top: 0;
      height: 22px;
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      pointer-events: none;
      margin: 0;
      outline: none;
    }
    .capacity-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--of-hud-text-1);
      border: 1px solid rgba(0,0,0,0.4);
      box-shadow: ${E.sm};
      pointer-events: auto;
      cursor: grab;
    }
    .capacity-slider::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--of-hud-text-1);
      border: 1px solid rgba(0,0,0,0.4);
      box-shadow: ${E.sm};
      pointer-events: auto;
      cursor: grab;
    }
    .capacity-slider-min { z-index: 2; }
    .capacity-slider-max { z-index: 1; }

    /* 2x card */
    .ld-2x {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 8px 10px;
      background: rgba(0,0,0,0.2);
      border: 1px solid var(--of-hud-line-1);
      border-radius: 7px;
      cursor: pointer;
      user-select: none;
    }
    .ld-2x .check {
      width: 14px;
      height: 14px;
      border-radius: 4px;
      border: 1.5px solid var(--of-hud-text-4);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: background ${c.fast}, border-color ${c.fast};
    }
    .ld-2x.is-on .check {
      background: var(--of-hud-accent);
      border-color: var(--of-hud-accent);
    }
    .ld-2x.is-on .check svg {
      width: 9px;
      height: 9px;
      stroke: var(--of-hud-bg-0);
      stroke-width: 2.5;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .ld-2x .lbl {
      font-size: 11px;
      color: var(--of-hud-text-2);
    }
    .ld-2x .lbl strong {
      font-family: ${p.mono};
      font-weight: 500;
      color: var(--of-hud-text-1);
    }
    .ld-2x .lbl .hint {
      color: var(--of-hud-text-4);
      margin-left: 6px;
    }
    .ld-2x input { display: none; }

    /* Current game info */
    .ld-current-game-info {
      margin-top: 10px;
      padding: 6px 10px;
      background: var(--of-hud-accent-soft);
      border: 1px solid var(--of-hud-accent-line);
      border-radius: ${G.sm};
      font-size: 11px;
      color: var(--of-hud-text-2);
      text-align: center;
    }

    /* Modifiers */
    .ld-mods-legend {
      display: flex;
      gap: 10px;
      font-size: 10px;
      color: var(--of-hud-text-4);
      font-family: ${p.mono};
      letter-spacing: 0.06em;
    }
    .ld-mods-legend .key {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .ld-mods-legend .swatch {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: var(--of-hud-bg-3);
    }
    .ld-mods-legend .swatch.req { background: var(--of-hud-accent); }
    .ld-mods-legend .swatch.blk { background: var(--of-hud-danger); }

    .ld-mod-group {
      margin-bottom: 10px;
    }
    .ld-mod-group:last-child { margin-bottom: 0; }
    .ld-mod-group-label {
      font-size: 10px;
      color: var(--of-hud-text-4);
      font-family: ${p.mono};
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .ld-mods {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 8px;
    }
    .ld-mod {
      appearance: none;
      cursor: pointer;
      background: transparent;
      color: var(--of-hud-text-3);
      padding: 7px 8px 7px 9px;
      border-radius: 7px;
      font: inherit;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background ${c.fast}, color ${c.fast}, border-color ${c.fast};
      text-align: left;
      border: 1px solid transparent;
    }
    .ld-mod:hover {
      background: rgba(255,255,255,0.025);
      color: var(--of-hud-text-1);
    }
    .ld-mod-ind {
      width: 14px;
      height: 14px;
      border-radius: 4px;
      border: 1.5px solid var(--of-hud-text-4);
      flex-shrink: 0;
      display: grid;
      place-items: center;
      transition: background ${c.fast}, border-color ${c.fast};
    }
    .ld-mod-ind svg {
      width: 9px;
      height: 9px;
      fill: none;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .ld-mod[data-state="required"] {
      color: var(--of-hud-text-1);
      background: var(--of-hud-accent-soft);
      border-color: var(--of-hud-accent-line);
    }
    .ld-mod[data-state="required"] .ld-mod-ind {
      background: var(--of-hud-accent);
      border-color: var(--of-hud-accent);
    }
    .ld-mod[data-state="required"] .ld-mod-ind svg {
      stroke: var(--of-hud-bg-0);
    }
    .ld-mod[data-state="blocked"] {
      color: var(--of-hud-text-2);
      background: var(--of-hud-danger-soft);
      border-color: var(--of-hud-danger-line);
    }
    .ld-mod[data-state="blocked"] .ld-mod-name {
      text-decoration: line-through;
      text-decoration-color: rgba(210,122,107,0.6);
      text-decoration-thickness: 1px;
    }
    .ld-mod[data-state="blocked"] .ld-mod-ind {
      background: var(--of-hud-danger);
      border-color: var(--of-hud-danger);
    }
    .ld-mod[data-state="blocked"] .ld-mod-ind svg {
      stroke: var(--of-hud-bg-0);
    }
    .ld-mod-name {
      flex: 1;
      min-width: 0;
    }
    .ld-mods-hint {
      font-size: 11px;
      color: var(--of-hud-text-4);
      margin-top: 8px;
      line-height: 1.5;
    }
    .ld-mods-hint strong { font-weight: 500; }
    .ld-mods-hint .req { color: var(--of-hud-accent); }
    .ld-mods-hint .blk { color: var(--of-hud-danger); }

    /* Footer */
    .discovery-footer {
      padding: 10px 14px;
      border-top: 1px solid var(--of-hud-line-1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0,0,0,0.15);
      flex-shrink: 0;
    }
    .discovery-footer .summary {
      font-size: 11px;
      color: var(--of-hud-text-3);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .discovery-footer .summary .num {
      font-family: ${p.mono};
      color: var(--of-hud-text-1);
      font-variant-numeric: tabular-nums;
    }
    .discovery-footer .reset {
      appearance: none;
      border: 0;
      cursor: pointer;
      background: transparent;
      color: var(--of-hud-text-3);
      font: inherit;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background ${c.fast}, color ${c.fast};
    }
    .discovery-footer .reset:hover {
      color: var(--of-hud-text-1);
      background: rgba(255,255,255,0.04);
    }

    /* Native join-modal player highlights \u2014 re-themed to blue accent */
    .of-current-player-boost {
      box-shadow: 0 0 0 1px var(--of-hud-accent), 0 0 16px var(--of-hud-accent-soft);
      background: linear-gradient(90deg, var(--of-hud-accent-soft), rgba(${u.accentShadow}, 0.06));
    }
    .of-current-player-team-boost {
      box-shadow: inset 0 0 0 1px var(--of-hud-accent-line), 0 0 20px var(--of-hud-accent-soft);
    }

    /* Queue card pulse \u2014 orange alarm contrast against the blue panel (intentional) */
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
        box-shadow ${c.fast},
        filter ${c.fast},
        border-color ${c.fast};
      animation: discoveryCardActiveBeacon 1.45s ease-in-out infinite;
    }
  `}var M={gameFoundAudio:null,gameStartAudio:null,audioUnlocked:!1,preloadSounds(){try{this.gameFoundAudio=new Audio("https://github.com/DeLoWaN/openfront-autojoin-lobby/raw/refs/heads/main/notification_sounds/new-notification-014-363678.mp3"),this.gameFoundAudio.volume=.5,this.gameFoundAudio.preload="auto",this.gameStartAudio=new Audio("https://github.com/DeLoWaN/openfront-autojoin-lobby/raw/refs/heads/main/notification_sounds/opening-bell-421471.mp3"),this.gameStartAudio.volume=.5,this.gameStartAudio.preload="auto",this.setupAudioUnlock()}catch(i){console.warn("[SoundUtils] Could not preload audio:",i)}},setupAudioUnlock(){let i=()=>{if(this.audioUnlocked)return;let e=[];this.gameFoundAudio&&(this.gameFoundAudio.volume=.01,e.push(this.gameFoundAudio.play().then(()=>{this.gameFoundAudio&&(this.gameFoundAudio.pause(),this.gameFoundAudio.currentTime=0,this.gameFoundAudio.volume=.5)}).catch(()=>{}))),this.gameStartAudio&&(this.gameStartAudio.volume=.01,e.push(this.gameStartAudio.play().then(()=>{this.gameStartAudio&&(this.gameStartAudio.pause(),this.gameStartAudio.currentTime=0,this.gameStartAudio.volume=.5)}).catch(()=>{}))),Promise.all(e).then(()=>{this.audioUnlocked=!0,console.log("[SoundUtils] Audio unlocked successfully"),document.removeEventListener("click",i),document.removeEventListener("keydown",i),document.removeEventListener("touchstart",i)})};document.addEventListener("click",i,{once:!0}),document.addEventListener("keydown",i,{once:!0}),document.addEventListener("touchstart",i,{once:!0})},playGameFoundSound(){this.gameFoundAudio?(console.log("[SoundUtils] Attempting to play game found sound"),this.gameFoundAudio.currentTime=0,this.gameFoundAudio.play().catch(i=>{console.warn("[SoundUtils] Failed to play game found sound:",i)})):console.warn("[SoundUtils] Game found audio not initialized")},playGameStartSound(){this.gameStartAudio?(console.log("[SoundUtils] Attempting to play game start sound"),this.gameStartAudio.currentTime=0,this.gameStartAudio.play().catch(i=>{console.warn("[SoundUtils] Failed to play game start sound:",i)})):console.warn("[SoundUtils] Game start audio not initialized")}};var T={callbacks:[],lastUrl:location.href,initialized:!1,init(){if(this.initialized)return;this.initialized=!0;let i=()=>{location.href!==this.lastUrl&&(this.lastUrl=location.href,this.notify())};window.addEventListener("popstate",i),window.addEventListener("hashchange",i);let e=history.pushState,t=history.replaceState;history.pushState=function(...o){e.apply(history,o),setTimeout(i,0)},history.replaceState=function(...o){t.apply(history,o),setTimeout(i,0)},setInterval(i,200)},subscribe(i){this.callbacks.push(i),this.init()},notify(){this.callbacks.forEach(i=>i(location.href))}};var U={subscribers:[],fallbackInterval:null,fallbackStartTimeout:null,lastLobbies:[],pollingRate:j.lobbyPollingRate,started:!1,publicLobbiesListener:null,start(){this.started||(this.started=!0,this.publicLobbiesListener=i=>this.handlePublicLobbiesUpdate(i),document.addEventListener("public-lobbies-update",this.publicLobbiesListener),this.scheduleFallbackPolling())},stop(){this.started&&(this.started=!1,this.publicLobbiesListener&&(document.removeEventListener("public-lobbies-update",this.publicLobbiesListener),this.publicLobbiesListener=null),this.fallbackStartTimeout&&(clearTimeout(this.fallbackStartTimeout),this.fallbackStartTimeout=null),this.stopFallbackPolling())},subscribe(i){this.subscribers.push(i),this.lastLobbies.length>0&&i(this.lastLobbies)},scheduleFallbackPolling(){!this.started||this.fallbackInterval||this.fallbackStartTimeout||(this.fallbackStartTimeout=setTimeout(()=>{this.fallbackStartTimeout=null,this.startFallbackPolling()},this.pollingRate*2))},startFallbackPolling(){this.fallbackInterval||(this.fetchData(),this.fallbackInterval=setInterval(()=>void this.fetchData(),this.pollingRate))},stopFallbackPolling(){this.fallbackInterval&&(clearInterval(this.fallbackInterval),this.fallbackInterval=null)},async fetchData(){if(!(location.pathname!=="/"&&!location.pathname.startsWith("/public-lobby")))try{let i=await fetch("/api/public_lobbies");if(i.status===429){console.warn("[Bundle] Rate limited.");return}if(!i.ok){console.warn(`[Bundle] API error: ${i.status}`);return}let e=await i.json();this.lastLobbies=this.extractLobbies(e),this.notifySubscribers()}catch(i){console.error("[Bundle] API Error:",i)}},notifySubscribers(){this.subscribers.forEach(i=>i(this.lastLobbies))},handlePublicLobbiesUpdate(i){this.fallbackStartTimeout&&(clearTimeout(this.fallbackStartTimeout),this.fallbackStartTimeout=null),this.stopFallbackPolling();let e=i.detail?.payload;this.lastLobbies=this.extractLobbies(e),this.notifySubscribers(),this.scheduleFallbackPolling()},extractLobbies(i){if(!i||typeof i!="object")return[];if(Array.isArray(i.lobbies))return i.lobbies;let e=i.games;return e?["ffa","team","special"].flatMap(t=>(e[t]??[]).map(o=>({...o,publicGameType:o.publicGameType??t}))):[]}};var w={lastActionTime:0,debounceDelay:800,getLobbyButton(){return document.querySelector("public-lobby")?.querySelector("button.group.relative.isolate")},canJoinLobby(){let i=document.querySelector("public-lobby");if(!i)return!1;let e=this.getLobbyButton();return!!(e&&!i.isLobbyHighlighted&&i.lobbies&&i.lobbies.length>0&&!e.disabled&&e.offsetParent!==null)},verifyState(i){let e=document.querySelector("public-lobby");if(!e)return!1;let t=this.getLobbyButton();return!t||t.disabled||t.offsetParent===null?!1:i==="in"?e.isLobbyHighlighted===!0:i==="out"?!!(!e.isLobbyHighlighted&&e.lobbies&&e.lobbies.length>0):!1},tryJoinLobby(){let i=Date.now();if(i-this.lastActionTime<this.debounceDelay)return!1;let e=this.getLobbyButton(),t=document.querySelector("public-lobby");return e&&t&&!t.isLobbyHighlighted&&t.lobbies&&t.lobbies.length>0&&!e.disabled&&e.offsetParent!==null?(this.lastActionTime=i,e.click(),setTimeout(()=>{this.verifyState("in")||console.warn("[LobbyUtils] Join may have failed, state not updated")},100),!0):!1},isOnLobbyPage(){let i=document.getElementById("page-game");if(i&&!i.classList.contains("hidden"))return!1;let e=document.querySelector("canvas");if(e&&e.offsetParent!==null){let n=e.getBoundingClientRect();if(n.width>100&&n.height>100)return!1}let t=document.querySelector("public-lobby");if(t&&t.offsetParent!==null)return!0;if(t&&t.offsetParent===null)return!1;let o=document.getElementById("page-play");if(o&&!o.classList.contains("hidden")&&t)return!0;let s=window.location.pathname.replace(/\/+$/,"")||"/";return s==="/"||s==="/public-lobby"}};var O={isSupported(){return typeof Notification<"u"},isBackgrounded(){let i=document.visibilityState==="hidden"||document.hidden,e=typeof document.hasFocus=="function"?document.hasFocus():!0;return i||!e},async ensurePermission(){if(typeof Notification>"u")return!1;if(Notification.permission==="granted")return!0;if(Notification.permission==="denied")return!1;try{return await Notification.requestPermission()==="granted"}catch(i){return console.warn("[BrowserNotificationUtils] Permission request failed:",i),!1}},show(i){if(!this.isSupported()||!this.isBackgrounded())return!1;if(Notification.permission==="granted"){let e=new Notification(i.title,{body:i.body});return e.onclick=()=>{this.focusWindow(),e.close()},!0}return!1},focusWindow(){window.focus()}};var ae="any";function Z(i){if(!i)return null;let e=i.toLowerCase().trim();return e==="free for all"||e==="ffa"||e==="free-for-all"?"FFA":e==="team"||e==="teams"?"Team":null}function L(i){return Z(i.gameConfig?.gameMode)}function X(i){let e=i.publicGameType?.toLowerCase().trim();return e==="ffa"||e==="team"||e==="special"?e:null}function q(i){if(i==="Duos"||i==="Trios"||i==="Quads"||i==="Humans Vs Nations"||typeof i=="number"&&Number.isFinite(i)&&i>0)return i;if(typeof i=="string"){let e=parseInt(i,10);if(!Number.isNaN(e)&&e>0)return e}return null}function k(i){let e=i.gameConfig;if(!e||L(i)!=="Team")return null;let t=q(e.playerTeams??null);return t!==null?t:q(e.teamCount??e.teams??null)}function I(i){let e=i.gameConfig;return e?e.maxPlayers??e.maxClients??e.maxPlayersPerGame??i.maxClients??null:null}function N(i,e){return!i||!e?null:i==="Duos"?2:i==="Trios"?3:i==="Quads"?4:i==="Humans Vs Nations"?e:typeof i=="number"&&i>0?Math.floor(e/i):null}function A(i,e){let t=i.gameConfig?.publicGameModifiers;if(t)switch(e){case"isCompact":return t.isCompact;case"isRandomSpawn":return t.isRandomSpawn;case"isCrowded":return t.isCrowded;case"isHardNations":return t.isHardNations;case"isAlliancesDisabled":return t.isAlliancesDisabled;case"isPortsDisabled":return t.isPortsDisabled;case"isNukesDisabled":return t.isNukesDisabled;case"isSAMsDisabled":return t.isSAMsDisabled;case"isPeaceTime":return t.isPeaceTime;case"isWaterNukes":return t.isWaterNukes;case"startingGold":return t.startingGold;case"goldMultiplier":return t.goldMultiplier;default:return}}function ee(i){let e=L(i),t=k(i),o=I(i);if(e==="FFA")return o!==null?`FFA \u2022 ${o} slots`:"FFA";if(e!=="Team")return"Unsupported mode";if(t==="Humans Vs Nations")return o!==null?`Humans Vs Nations (${o})`:"Humans Vs Nations";if(t==="Duos")return"Duos";if(t==="Trios")return"Trios";if(t==="Quads")return"Quads";if(typeof t=="number"&&o!==null){let s=N(t,o);return s!==null?`${t} teams (${s} per team)`:`${t} teams`}return"Team"}function re(i){let e=L(i),t=k(i);return e==="FFA"?"FFA":e!=="Team"?"Unsupported mode":t==="Humans Vs Nations"?"Humans Vs Nations":t==="Duos"||t==="Trios"||t==="Quads"?t:typeof t=="number"?`${t} teams`:"Team"}function le(i){return i>=1e6&&i%1e6===0?`${i/1e6}M`:i>=1e3&&i%1e3===0?`${i/1e3}K`:String(i)}function de(i){let e=i.gameConfig?.publicGameModifiers;if(!e)return[];let t=[];return e.isCompact&&t.push("Compact"),e.isRandomSpawn&&t.push("Random"),e.isCrowded&&t.push("Crowded"),e.isHardNations&&t.push("Hard"),typeof e.startingGold=="number"&&t.push(le(e.startingGold)),typeof e.goldMultiplier=="number"&&t.push(`x${e.goldMultiplier}`),e.isAlliancesDisabled&&t.push("No Alliances"),e.isPortsDisabled&&t.push("No Ports"),e.isNukesDisabled&&t.push("No Nukes"),e.isSAMsDisabled&&t.push("No SAMs"),e.isPeaceTime&&t.push("Peace"),e.isWaterNukes&&t.push("Water Nukes"),t}function te(i){let e=[],t=i.gameConfig?.gameMap?.trim(),o=I(i),s=k(i),n=re(i);if(t&&e.push(t),L(i)==="Team"&&s!=="Humans Vs Nations"){e.push(n);let a=N(s,o);a!==null&&e.push(`${a}/team`)}else e.push(n);let r=[];o!==null&&r.push(`${o} slots`);let l=de(i);return l.length>0&&r.push(l.join(", ")),{title:e.join(" \u2022 "),body:r.join(" \u2022 ")}}function Y(i){return typeof i=="number"&&Number.isFinite(i)?i:null}function h(i){return i==="blocked"||i==="rejected"?"blocked":i==="required"?"required":i==="any"||i==="allowed"||i==="indifferent"?"any":ae}function J(i){if(!i||typeof i!="object")return;let e={};for(let[t,o]of Object.entries(i)){let s=Number(t);Number.isFinite(s)&&(e[s]=h(o))}return Object.keys(e).length>0?e:void 0}function ce(i){if(!i||typeof i!="object")return;let e=i;return{isCompact:h(e.isCompact),isRandomSpawn:h(e.isRandomSpawn),isCrowded:h(e.isCrowded),isHardNations:h(e.isHardNations),isAlliancesDisabled:h(e.isAlliancesDisabled),isPortsDisabled:h(e.isPortsDisabled),isNukesDisabled:h(e.isNukesDisabled),isSAMsDisabled:h(e.isSAMsDisabled),isPeaceTime:h(e.isPeaceTime),isWaterNukes:h(e.isWaterNukes),startingGold:J(e.startingGold),goldMultiplier:J(e.goldMultiplier)}}function ue(i){if(!Array.isArray(i))return[];let e=[];for(let t of i){let o=t,s=Z(o.gameMode??null);s&&e.push({gameMode:s,teamCount:s==="Team"?q(o.teamCount??null):null,minPlayers:Y(o.minPlayers),maxPlayers:Y(o.maxPlayers),modifiers:ce(o.modifiers)})}return e}function _(i,e=Date.now()){let t=Math.max(0,Math.floor((e-i)/1e3));return`${Math.floor(t/60)}m ${t%60}s`}function ie(i){return{criteria:ue(i?.criteria),discoveryEnabled:typeof i?.discoveryEnabled=="boolean"?i.discoveryEnabled:!0,soundEnabled:typeof i?.soundEnabled=="boolean"?i.soundEnabled:!0,desktopNotificationsEnabled:typeof i?.desktopNotificationsEnabled=="boolean"?i.desktopNotificationsEnabled:!1,isTeamTwoTimesMinEnabled:typeof i?.isTeamTwoTimesMinEnabled=="boolean"?i.isTeamTwoTimesMinEnabled:!!i?.isTeamThreeTimesMinEnabled}}var me=["isCompact","isRandomSpawn","isCrowded","isHardNations","isAlliancesDisabled","isPortsDisabled","isNukesDisabled","isSAMsDisabled","isPeaceTime","isWaterNukes"],P=class{matchesCriteria(e,t,o={}){if(!e||!e.gameConfig||!t||t.length===0)return!1;let s=L(e),n=I(e);if(!s||n===null)return!1;let r=k(e),l=s==="Team"?N(r,n):null;for(let a of t){if(a.gameMode!==s||s==="Team"&&(a.teamCount!==null&&a.teamCount!==void 0&&a.teamCount!==r||o.isTeamTwoTimesMinEnabled&&a.minPlayers!==null&&r!=="Humans Vs Nations"&&n<a.minPlayers*2||l===null))continue;let d=s==="Team"?l:n;if(d!==null&&!(a.minPlayers!==null&&d<a.minPlayers)&&!(a.maxPlayers!==null&&d>a.maxPlayers)&&this.matchesModifiers(e,a.modifiers))return!0}return!1}matchesModifiers(e,t){if(!t)return!0;for(let o of me){let s=t[o];if(!s||s==="any")continue;let n=!!A(e,o);if(s==="blocked"&&n||s==="required"&&!n)return!1}return!(!this.matchesNumericModifier(A(e,"startingGold"),t.startingGold)||!this.matchesNumericModifier(A(e,"goldMultiplier"),t.goldMultiplier))}matchesNumericModifier(e,t){if(!t)return!0;let o=typeof e=="number"&&Number.isFinite(e)?e:null,s=Object.entries(t);if(s.length===0)return!0;let n=s.filter(([,l])=>l==="blocked").map(([l])=>Number(l));if(o!==null&&n.includes(o))return!1;let r=s.filter(([,l])=>l==="required").map(([l])=>Number(l));return!(r.length>0&&(o===null||!r.includes(o)))}};var D=[1e6,5e6,25e6],H=[2],z=["modifier-isCompact","modifier-isRandomSpawn","modifier-isCrowded","modifier-isHardNations","modifier-isAlliancesDisabled","modifier-isPortsDisabled","modifier-isNukesDisabled","modifier-isSAMsDisabled","modifier-isPeaceTime","modifier-isWaterNukes"],oe=[["discovery-team-duos","Duos",2],["discovery-team-trios","Trios",3],["discovery-team-quads","Quads",4],["discovery-team-hvn","Humans Vs Nations",null]],fe=[["discovery-team-2","2"],["discovery-team-3","3"],["discovery-team-4","4"],["discovery-team-5","5"],["discovery-team-6","6"],["discovery-team-7","7"]],$=[...oe.map(([i])=>i),...fe.map(([i])=>i)],V='<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>',pe='<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',be='<svg viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7"/><path d="M19 5a9 9 0 010 14"/></svg>',he='<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/></svg>',F=class{constructor(){this.discoveryEnabled=!0;this.criteriaList=[];this.searchStartTime=null;this.lastMatchTime=null;this.soundEnabled=!0;this.desktopNotificationsEnabled=!1;this.desktopNotificationRequestId=0;this.activeMatchSources=new Set;this.seenLobbies=new Set;this.desktopNotifiedLobbies=new Set;this.isTeamTwoTimesMinEnabled=!1;this.sleeping=!1;this.isDisposed=!1;this.timerInterval=null;this.gameInfoInterval=null;this.pulseSyncTimeout=null;this.engine=new P,this.loadSettings(),this.createUI(),this.updateSleepState(),T.subscribe(()=>this.updateSleepState())}receiveLobbyUpdate(e){this.processLobbies(e)}isSoundEnabled(){return this.soundEnabled}loadSettings(){let e=GM_getValue(C.lobbyDiscoverySettings,null),t=ie(e);GM_setValue(C.lobbyDiscoverySettings,t),this.criteriaList=t.criteria,this.soundEnabled=t.soundEnabled,this.desktopNotificationsEnabled=t.desktopNotificationsEnabled,this.discoveryEnabled=t.discoveryEnabled,this.isTeamTwoTimesMinEnabled=t.isTeamTwoTimesMinEnabled}saveSettings(){GM_setValue(C.lobbyDiscoverySettings,{criteria:this.criteriaList,discoveryEnabled:this.discoveryEnabled,soundEnabled:this.soundEnabled,desktopNotificationsEnabled:this.desktopNotificationsEnabled,isTeamTwoTimesMinEnabled:this.isTeamTwoTimesMinEnabled})}updateStatusText(){let e=document.getElementById("discovery-search-timer");if(e){if(!this.discoveryEnabled||this.criteriaList.length===0||!this.isDiscoveryFeedbackAllowed()){e.textContent="",e.style.display="none";return}e.style.display="inline",this.lastMatchTime!==null?e.textContent=`last match ${_(this.lastMatchTime)}`:this.searchStartTime!==null?e.textContent=`searching \xB7 ${_(this.searchStartTime)}`:e.textContent="awaiting filters"}}updateCurrentGameInfo(){let e=document.getElementById("discovery-current-game-info");if(!e||!w.isOnLobbyPage()){e&&(e.style.display="none");return}let t=document.querySelector("public-lobby");if(!t||!Array.isArray(t.lobbies)||t.lobbies.length===0){e.style.display="none";return}let o=t.lobbies[0];if(!o||!o.gameConfig){e.style.display="none";return}e.style.display="block",e.textContent=`Current game: ${ee(o)}`}processLobbies(e){try{if(this.updateCurrentGameInfo(),this.syncSearchTimer(),!this.discoveryEnabled||this.criteriaList.length===0||!this.isDiscoveryFeedbackAllowed()){this.seenLobbies.clear(),this.desktopNotifiedLobbies.clear(),this.updateQueueCardPulses(new Set),this.updateStatusText();return}let t=new Set,o=new Set,s=[],n=!1;for(let r of e){let l=X(r);if(!l||!this.engine.matchesCriteria(r,this.criteriaList,{isTeamTwoTimesMinEnabled:this.isTeamTwoTimesMinEnabled}))continue;t.add(l);let a=this.getNotificationKey(r);o.add(a),this.seenLobbies.has(a)||(n=!0),this.desktopNotifiedLobbies.has(a)||s.push(r)}if(this.updateQueueCardPulses(t),n&&(this.lastMatchTime=Date.now(),this.soundEnabled&&M.playGameFoundSound()),this.desktopNotificationsEnabled){let r=new Set;for(let l of s){let a=te(l),d=this.getNotificationKey(l);O.show({title:a.title,body:a.body,tag:d})&&r.add(d)}this.desktopNotifiedLobbies=new Set([...[...this.desktopNotifiedLobbies].filter(l=>o.has(l)),...r])}else this.desktopNotifiedLobbies.clear();this.seenLobbies=o,o.size===0&&(this.lastMatchTime=null),this.updateStatusText()}catch(t){console.error("[LobbyDiscovery] Error processing lobbies:",t)}}getNotificationKey(e){return JSON.stringify({gameID:e.gameID,mode:e.gameConfig?.gameMode??null,playerTeams:e.gameConfig?.playerTeams??e.gameConfig?.teamCount??null,capacity:e.gameConfig?.maxPlayers??e.maxClients??null,modifiers:e.gameConfig?.publicGameModifiers??{}})}isDiscoveryFeedbackAllowed(){return!(!w.isOnLobbyPage()||document.getElementById("page-play")?.classList.contains("hidden")||document.querySelector("public-lobby")?.isLobbyHighlighted===!0||document.querySelector("join-lobby-modal")?.currentLobbyId||document.querySelector("host-lobby-modal")?.lobbyId)}getQueueCardElements(){let e=document.querySelector("game-mode-selector");if(!e)return{};let t=Array.from(e.querySelectorAll("div")).find(r=>r.className.includes("sm:grid-cols-[2fr_1fr]"));if(!(t instanceof HTMLElement))return{};let[o,s]=Array.from(t.children),n=s?Array.from(s.children):[];return{ffa:o?.querySelector("button"),special:n[0]?.querySelector("button"),team:n[1]?.querySelector("button")}}updateQueueCardPulses(e){this.activeMatchSources=new Set(e),this.applyQueueCardPulses(),this.scheduleQueueCardPulseSync()}applyQueueCardPulses(){let e=this.getQueueCardElements();for(let t of["ffa","special","team"]){let o=e[t];o&&o.classList.toggle("of-discovery-card-active",this.activeMatchSources.has(t))}}scheduleQueueCardPulseSync(){this.pulseSyncTimeout&&clearTimeout(this.pulseSyncTimeout),this.pulseSyncTimeout=setTimeout(()=>{this.pulseSyncTimeout=null,this.applyQueueCardPulses()},16)}stopTimer(){this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null)}startGameInfoUpdates(){this.stopGameInfoUpdates(),this.updateCurrentGameInfo(),this.gameInfoInterval=setInterval(()=>this.updateCurrentGameInfo(),1e3)}stopGameInfoUpdates(){this.gameInfoInterval&&(clearInterval(this.gameInfoInterval),this.gameInfoInterval=null)}syncSearchTimer(e={}){let{resetStart:t=!1}=e;this.stopTimer(),t&&(this.searchStartTime=null,this.lastMatchTime=null,this.seenLobbies.clear(),this.desktopNotifiedLobbies.clear()),this.discoveryEnabled&&this.criteriaList.length>0&&this.isDiscoveryFeedbackAllowed()?(this.searchStartTime===null&&(this.searchStartTime=Date.now()),this.timerInterval=setInterval(()=>this.updateStatusText(),1e3)):(this.searchStartTime=null,this.lastMatchTime=null),this.updateStatusText(),this.updatePulseIndicator()}updatePulseIndicator(){let e=document.querySelector(".ld-pulse");if(!e)return;let t=this.discoveryEnabled&&this.criteriaList.length>0;e.classList.toggle("is-paused",!t)}setDiscoveryEnabled(e,t={}){this.discoveryEnabled=e,this.saveSettings(),this.updateStatusLabel(),this.syncSearchTimer({resetStart:t.resetTimer??!1})}updateStatusLabel(){let e=document.querySelector(".ld-status-text strong");e&&(e.textContent=this.discoveryEnabled?"Discovery active":"Discovery paused")}getNumberValue(e){let t=document.getElementById(e);if(!t)return null;let o=parseInt(t.value,10);return Number.isNaN(o)?null:o}getModifierState(e){let o=document.getElementById(e)?.dataset.state;return o==="required"||o==="blocked"?o:"any"}setModifierState(e,t){let o=document.getElementById(e);if(!o)return;o.dataset.state=t,o.setAttribute("aria-pressed",String(t!=="any"));let s=o.querySelector(".ld-mod-ind");s&&(t==="required"?s.innerHTML=V:t==="blocked"?s.innerHTML=pe:s.innerHTML="")}cycleModifierState(e){let t=this.getModifierState(e),o=t==="any"?"required":t==="required"?"blocked":"any";this.setModifierState(e,o)}getNumericModifierState(e){let t={};for(let[o,s]of Object.entries(e))t[Number(o)]=this.getModifierState(s);return t}getModifierFiltersFromUI(){return{isCompact:this.getModifierState("modifier-isCompact"),isRandomSpawn:this.getModifierState("modifier-isRandomSpawn"),isCrowded:this.getModifierState("modifier-isCrowded"),isHardNations:this.getModifierState("modifier-isHardNations"),isAlliancesDisabled:this.getModifierState("modifier-isAlliancesDisabled"),isPortsDisabled:this.getModifierState("modifier-isPortsDisabled"),isNukesDisabled:this.getModifierState("modifier-isNukesDisabled"),isSAMsDisabled:this.getModifierState("modifier-isSAMsDisabled"),isPeaceTime:this.getModifierState("modifier-isPeaceTime"),isWaterNukes:this.getModifierState("modifier-isWaterNukes"),startingGold:this.getNumericModifierState({1e6:"modifier-startingGold-1000000",5e6:"modifier-startingGold-5000000",25e6:"modifier-startingGold-25000000"}),goldMultiplier:this.getNumericModifierState({2:"modifier-goldMultiplier-2"})}}getAllTeamCountValues(){let e=[];for(let t of $){let o=document.getElementById(t);if(!o?.checked)continue;let s=o.value;if(s==="Duos"||s==="Trios"||s==="Quads"||s==="Humans Vs Nations")e.push(s);else{let n=parseInt(s,10);Number.isNaN(n)||e.push(n)}}return e}applyAutoTeamMin(){let e=oe.filter(([s,,n])=>n!==null&&document.getElementById(s)?.checked).map(([,,s])=>s);if(e.length===0)return;let t=Math.min(...e),o=document.getElementById("discovery-team-min-slider");o&&(o.value=String(t),this.updateSliderRange("discovery-team-min-slider","discovery-team-max-slider","discovery-team-min","discovery-team-max","discovery-team-range-fill","discovery-team-min-value","discovery-team-max-value",!0))}setAllTeamCounts(e){for(let t of $){let o=document.getElementById(t);o&&(o.checked=e,this.syncChipState(t))}}syncChipState(e){let t=document.getElementById(e);if(!t)return;let o=t.closest(".ld-chip, .ld-mode-btn, .ld-2x");o&&(o.classList.toggle("is-on",t.checked),o.setAttribute("aria-pressed",String(t.checked)))}buildCriteriaFromUI(){let e=this.getModifierFiltersFromUI(),t=[];if(document.getElementById("discovery-ffa")?.checked&&t.push({gameMode:"FFA",teamCount:null,minPlayers:this.getNumberValue("discovery-ffa-min"),maxPlayers:this.getNumberValue("discovery-ffa-max"),modifiers:e}),!document.getElementById("discovery-team")?.checked)return t;let n=this.getAllTeamCountValues();if(n.length===0)return t.push({gameMode:"Team",teamCount:null,minPlayers:this.getNumberValue("discovery-team-min"),maxPlayers:this.getNumberValue("discovery-team-max"),modifiers:e}),t;for(let r of n)t.push({gameMode:"Team",teamCount:r,minPlayers:this.getNumberValue("discovery-team-min"),maxPlayers:this.getNumberValue("discovery-team-max"),modifiers:e});return t}updateFilterCount(){let e=document.getElementById("discovery-filter-count"),t=document.getElementById("discovery-filter-word");if(!e||!t)return;let o=document.getElementById("discovery-ffa")?.checked,s=document.getElementById("discovery-team")?.checked,n=$.filter(a=>document.getElementById(a)?.checked).length,r=[...z,...D.map(a=>`modifier-startingGold-${a}`),...H.map(a=>`modifier-goldMultiplier-${a}`)].filter(a=>this.getModifierState(a)!=="any").length,l=(o?1:0)+(s?1:0)+n+r;e.textContent=String(l),t.textContent=l===1?"filter":"filters"}setModePanelActive(e,t){let o=document.getElementById(e);o&&o.classList.toggle("is-off",!t)}setIconButtonState(e,t){let o=document.getElementById(e)?.closest(".ld-icon-btn");o&&o.classList.toggle("is-on",t)}loadUIFromSettings(){let e=this.criteriaList.find(d=>d.gameMode==="FFA"),t=this.criteriaList.filter(d=>d.gameMode==="Team"),o=document.getElementById("discovery-ffa"),s=document.getElementById("discovery-team");if(o&&(o.checked=!!e,this.syncChipState("discovery-ffa"),this.setModePanelActive("discovery-ffa-config",!!e)),s&&(s.checked=t.length>0,this.syncChipState("discovery-team"),this.setModePanelActive("discovery-team-config",t.length>0)),e){let d=document.getElementById("discovery-ffa-min"),f=document.getElementById("discovery-ffa-max");d&&e.minPlayers!==null&&(d.value=String(e.minPlayers)),f&&e.maxPlayers!==null&&(f.value=String(e.maxPlayers))}if(t[0]){let d=document.getElementById("discovery-team-min"),f=document.getElementById("discovery-team-max");d&&t[0].minPlayers!==null&&(d.value=String(t[0].minPlayers)),f&&t[0].maxPlayers!==null&&(f.value=String(t[0].maxPlayers)),this.setTeamCountSelections(t.map(y=>y.teamCount))}let n=(e??t[0])?.modifiers;if(n){this.setModifierState("modifier-isCompact",n.isCompact??"any"),this.setModifierState("modifier-isRandomSpawn",n.isRandomSpawn??"any"),this.setModifierState("modifier-isCrowded",n.isCrowded??"any"),this.setModifierState("modifier-isHardNations",n.isHardNations??"any"),this.setModifierState("modifier-isAlliancesDisabled",n.isAlliancesDisabled??"any"),this.setModifierState("modifier-isPortsDisabled",n.isPortsDisabled??"any"),this.setModifierState("modifier-isNukesDisabled",n.isNukesDisabled??"any"),this.setModifierState("modifier-isSAMsDisabled",n.isSAMsDisabled??"any"),this.setModifierState("modifier-isPeaceTime",n.isPeaceTime??"any"),this.setModifierState("modifier-isWaterNukes",n.isWaterNukes??"any");for(let d of D)this.setModifierState(`modifier-startingGold-${d}`,n.startingGold?.[d]??"any");for(let d of H)this.setModifierState(`modifier-goldMultiplier-${d}`,n.goldMultiplier?.[d]??"any")}let r=document.getElementById("discovery-sound-toggle");r&&(r.checked=this.soundEnabled,this.setIconButtonState("discovery-sound-toggle",this.soundEnabled));let l=document.getElementById("discovery-desktop-toggle");l&&(l.checked=this.desktopNotificationsEnabled,this.setIconButtonState("discovery-desktop-toggle",this.desktopNotificationsEnabled));let a=document.getElementById("discovery-team-two-times");a&&(a.checked=this.isTeamTwoTimesMinEnabled,this.syncChipState("discovery-team-two-times")),this.updateFilterCount(),this.updateStatusLabel()}setTeamCountSelections(e){for(let t of e){let o=null;t==="Duos"?o=document.getElementById("discovery-team-duos"):t==="Trios"?o=document.getElementById("discovery-team-trios"):t==="Quads"?o=document.getElementById("discovery-team-quads"):t==="Humans Vs Nations"?o=document.getElementById("discovery-team-hvn"):typeof t=="number"&&(o=document.getElementById(`discovery-team-${t}`)),o&&(o.checked=!0,this.syncChipState(o.id))}}initializeSlider(e,t,o,s,n,r,l,a=!1){let d=document.getElementById(e),f=document.getElementById(t),y=document.getElementById(o),x=document.getElementById(s);if(!d||!f||!y||!x)return;let b=parseInt(y.value,10),m=parseInt(x.value,10);Number.isNaN(b)||(d.value=String(b)),Number.isNaN(m)||(f.value=String(m));let g=()=>{this.updateSliderRange(e,t,o,s,n,r,l,a),this.refreshCriteria()};d.addEventListener("input",g),f.addEventListener("input",g),this.updateSliderRange(e,t,o,s,n,r,l,a)}updateSliderRange(e,t,o,s,n,r,l,a){let d=document.getElementById(e),f=document.getElementById(t),y=document.getElementById(o),x=document.getElementById(s),b=document.getElementById(n)?.parentElement?.parentElement,m=document.getElementById(r),g=document.getElementById(l);if(!d||!f||!y||!x)return;let S=parseInt(d.value,10),v=parseInt(f.value,10);if(a&&this.isTeamTwoTimesMinEnabled&&(v=Math.min(parseInt(f.max,10),Math.max(1,v))),S>v&&(S=v,d.value=String(S)),y.value=String(S),x.value=String(v),m&&(m.textContent=String(S)),g&&(g.textContent=String(v)),b){let R=parseInt(d.min,10),Q=parseInt(d.max,10)-R||1,se=(S-R)/Q*100,ne=(v-R)/Q*100;b.style.setProperty("--lo",`${se}%`),b.style.setProperty("--hi",`${ne}%`)}}refreshCriteria(){this.criteriaList=this.buildCriteriaFromUI(),this.saveSettings(),this.updateFilterCount(),this.syncSearchTimer({resetStart:!0})}resetAll(){let e=document.getElementById("discovery-ffa"),t=document.getElementById("discovery-team");e&&(e.checked=!1,this.syncChipState("discovery-ffa"),this.setModePanelActive("discovery-ffa-config",!1)),t&&(t.checked=!1,this.syncChipState("discovery-team"),this.setModePanelActive("discovery-team-config",!1)),this.setAllTeamCounts(!1);let o=document.getElementById("discovery-team-two-times");o&&(o.checked=!1,this.syncChipState("discovery-team-two-times"),this.isTeamTwoTimesMinEnabled=!1);for(let a of z)this.setModifierState(a,"any");for(let a of D)this.setModifierState(`modifier-startingGold-${a}`,"any");for(let a of H)this.setModifierState(`modifier-goldMultiplier-${a}`,"any");let s=document.getElementById("discovery-ffa-min-slider"),n=document.getElementById("discovery-ffa-max-slider");s&&n&&(s.value=s.min,n.value=n.max,this.updateSliderRange("discovery-ffa-min-slider","discovery-ffa-max-slider","discovery-ffa-min","discovery-ffa-max","discovery-ffa-range-fill","discovery-ffa-min-value","discovery-ffa-max-value",!1));let r=document.getElementById("discovery-team-min-slider"),l=document.getElementById("discovery-team-max-slider");r&&l&&(r.value=r.min,l.value=l.max,this.updateSliderRange("discovery-team-min-slider","discovery-team-max-slider","discovery-team-min","discovery-team-max","discovery-team-range-fill","discovery-team-min-value","discovery-team-max-value",!0)),this.refreshCriteria()}async handleDesktopNotificationToggleChange(e){let t=++this.desktopNotificationRequestId;if(!e.checked){this.desktopNotificationsEnabled=!1,this.setIconButtonState("discovery-desktop-toggle",!1),this.saveSettings();return}let o=await O.ensurePermission();t!==this.desktopNotificationRequestId||this.isDisposed||!e.isConnected||!e.checked||(this.desktopNotificationsEnabled=o,e.checked=o,e.toggleAttribute("checked",o),this.setIconButtonState("discovery-desktop-toggle",o),this.saveSettings())}setupEventListeners(){document.getElementById("discovery-status")?.addEventListener("click",()=>{this.setDiscoveryEnabled(!this.discoveryEnabled,{resetTimer:!0})});for(let[o,s]of[["discovery-ffa","discovery-ffa-config"],["discovery-team","discovery-team-config"]]){let n=document.getElementById(o);n?.addEventListener("change",()=>{this.syncChipState(o),this.setModePanelActive(s,n.checked),this.refreshCriteria()})}let e=document.getElementById("discovery-team-two-times");e?.addEventListener("change",()=>{this.isTeamTwoTimesMinEnabled=e.checked,this.syncChipState("discovery-team-two-times"),this.updateSliderRange("discovery-team-min-slider","discovery-team-max-slider","discovery-team-min","discovery-team-max","discovery-team-range-fill","discovery-team-min-value","discovery-team-max-value",!0),this.refreshCriteria()}),document.getElementById("discovery-team-select-all")?.addEventListener("click",()=>{this.setAllTeamCounts(!0),this.refreshCriteria()}),document.getElementById("discovery-team-deselect-all")?.addEventListener("click",()=>{this.setAllTeamCounts(!1),this.refreshCriteria()}),document.getElementById("discovery-reset")?.addEventListener("click",()=>{this.resetAll()});for(let o of[...$,"discovery-sound-toggle","discovery-desktop-toggle"]){let s=document.getElementById(o);s&&s.addEventListener("change",()=>{if(o==="discovery-sound-toggle"){this.soundEnabled=s.checked,this.setIconButtonState("discovery-sound-toggle",s.checked),this.saveSettings();return}if(o==="discovery-desktop-toggle"){this.handleDesktopNotificationToggleChange(s);return}this.syncChipState(o),(o==="discovery-team-duos"||o==="discovery-team-trios"||o==="discovery-team-quads")&&this.applyAutoTeamMin(),this.refreshCriteria()})}let t=[...z,...D.map(o=>`modifier-startingGold-${o}`),...H.map(o=>`modifier-goldMultiplier-${o}`)];for(let o of t)document.getElementById(o)?.addEventListener("click",()=>{this.cycleModifierState(o),this.refreshCriteria()})}renderModeButton(e,t){return`
      <label class="ld-mode-btn" aria-pressed="false">
        <input type="checkbox" id="${e}" value="${e==="discovery-ffa"?"FFA":"Team"}">
        <span class="check">${V}</span>
        <span>${t}</span>
      </label>
    `}renderChip(e,t,o){return`
      <label class="ld-chip" aria-pressed="false">
        <input type="checkbox" id="${e}" value="${t}">${o}
      </label>
    `}renderModifierChip(e,t){return`
      <button type="button" class="ld-mod" id="${e}" data-state="any" aria-pressed="false" aria-label="${t}">
        <span class="ld-mod-ind"></span>
        <span class="ld-mod-name">${t}</span>
      </button>
    `}renderIconButton(e,t,o){return`
      <label class="ld-icon-btn" title="${t}" aria-label="${t}">
        <input type="checkbox" id="${e}">${o}
      </label>
    `}createUI(){document.getElementById("openfront-discovery-panel")||(this.panel=document.createElement("div"),this.panel.id="openfront-discovery-panel",this.panel.className="of-panel discovery-panel",this.panel.style.width="380px",this.panel.innerHTML=`
      <div class="ld-status">
        <span class="ld-pulse" aria-hidden="true"></span>
        <div class="ld-status-text" id="discovery-status" role="button" tabindex="0">
          <strong>Discovery active</strong>
          <span class="sep">\xB7</span>
          <span class="meta" id="discovery-search-timer"></span>
        </div>
        <div class="ld-icons">
          ${this.renderIconButton("discovery-sound-toggle","Sound alert",be)}
          ${this.renderIconButton("discovery-desktop-toggle","Desktop notification",he)}
        </div>
      </div>
      <div class="ld-head">
        <div class="ld-eyebrow">Notify only \xB7 never auto-joins</div>
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
              ${this.renderModeButton("discovery-ffa","FFA")}
              ${this.renderModeButton("discovery-team","Teams")}
            </div>

            <div class="ld-mode-panel" id="discovery-ffa-config">
              <div class="ld-mode-panel-head">
                <span class="dot"></span>
                <span class="title">FFA \xB7 Lobby capacity</span>
              </div>
              <div class="ld-slider-row">
                <div class="ld-slider-label">
                  <span>Total players</span>
                  <span class="val">
                    <span id="discovery-ffa-min-value">1</span>
                    <span class="sep">\u2013</span>
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
                <span class="title">Teams \xB7 Format & size</span>
              </div>
              <div class="ld-format-label">FORMAT</div>
              <div class="ld-formats">
                ${this.renderChip("discovery-team-duos","Duos","Duos")}
                ${this.renderChip("discovery-team-trios","Trios","Trios")}
                ${this.renderChip("discovery-team-quads","Quads","Quads")}
                ${this.renderChip("discovery-team-hvn","Humans Vs Nations","HvN")}
              </div>
              <div class="ld-formats">
                ${this.renderChip("discovery-team-2","2","2 teams")}
                ${this.renderChip("discovery-team-3","3","3 teams")}
                ${this.renderChip("discovery-team-4","4","4 teams")}
                ${this.renderChip("discovery-team-5","5","5 teams")}
                ${this.renderChip("discovery-team-6","6","6 teams")}
                ${this.renderChip("discovery-team-7","7","7 teams")}
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
                    <span class="sep">\u2013</span>
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
                <span class="check">${V}</span>
                <span class="lbl">
                  <strong>2\xD7 lobby capacity</strong>
                  <span class="hint">total seats \u2265 2 \xD7 per-team min</span>
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
                ${this.renderModifierChip("modifier-isCompact","Compact")}
                ${this.renderModifierChip("modifier-isRandomSpawn","Random Spawn")}
                ${this.renderModifierChip("modifier-isCrowded","Crowded")}
                ${this.renderModifierChip("modifier-isHardNations","Hard Nations")}
              </div>
            </div>

            <div class="ld-mod-group">
              <div class="ld-mod-group-label">Gameplay</div>
              <div class="ld-mods">
                ${this.renderModifierChip("modifier-isAlliancesDisabled","Alliances Off")}
                ${this.renderModifierChip("modifier-isPortsDisabled","Ports Off")}
                ${this.renderModifierChip("modifier-isNukesDisabled","Nukes Off")}
                ${this.renderModifierChip("modifier-isSAMsDisabled","SAMs Off")}
                ${this.renderModifierChip("modifier-isPeaceTime","Peace Time")}
                ${this.renderModifierChip("modifier-isWaterNukes","Water Nukes")}
              </div>
            </div>

            <div class="ld-mod-group">
              <div class="ld-mod-group-label">Economy</div>
              <div class="ld-mods">
                ${this.renderModifierChip("modifier-startingGold-1000000","Start Gold 1M")}
                ${this.renderModifierChip("modifier-startingGold-5000000","Start Gold 5M")}
                ${this.renderModifierChip("modifier-startingGold-25000000","Start Gold 25M")}
                ${this.renderModifierChip("modifier-goldMultiplier-2","Gold \xD72")}
              </div>
            </div>

            <div class="ld-mods-hint">
              Click to cycle <strong>Any</strong> \u2192 <strong class="req">Required</strong> \u2192 <strong class="blk">Blocked</strong>.
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
    `,document.body.appendChild(this.panel),this.setupEventListeners(),this.loadUIFromSettings(),this.initializeSlider("discovery-ffa-min-slider","discovery-ffa-max-slider","discovery-ffa-min","discovery-ffa-max","discovery-ffa-range-fill","discovery-ffa-min-value","discovery-ffa-max-value"),this.initializeSlider("discovery-team-min-slider","discovery-team-max-slider","discovery-team-min","discovery-team-max","discovery-team-range-fill","discovery-team-min-value","discovery-team-max-value",!0),this.updateStatusLabel(),this.updateFilterCount(),this.syncSearchTimer(),this.startGameInfoUpdates())}updateSleepState(){let e=w.isOnLobbyPage();this.sleeping=!e,this.sleeping?(this.panel.classList.add("hidden"),this.stopTimer(),this.stopGameInfoUpdates(),this.updateQueueCardPulses(new Set)):(this.panel.classList.remove("hidden"),this.syncSearchTimer(),this.startGameInfoUpdates())}cleanup(){this.isDisposed=!0,this.stopTimer(),this.stopGameInfoUpdates(),this.pulseSyncTimeout&&(clearTimeout(this.pulseSyncTimeout),this.pulseSyncTimeout=null),this.activeMatchSources.clear(),this.applyQueueCardPulses(),this.panel.parentNode?.removeChild(this.panel)}};var B=class{constructor(){this.observer=null;this.animationFrameId=null}start(){this.observer||(this.observer=new MutationObserver(()=>this.scheduleApplyHighlights()),this.observer.observe(document.body,{attributes:!1,childList:!0,subtree:!0}),this.applyHighlights())}stop(){this.observer?.disconnect(),this.observer=null,this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}scheduleApplyHighlights(){this.animationFrameId===null&&(this.animationFrameId=requestAnimationFrame(()=>{this.animationFrameId=null,this.applyHighlights()}))}applyHighlights(){for(let e of Array.from(document.querySelectorAll("lobby-player-view")))this.applyHighlightToView(e)}applyHighlightToView(e){this.clearHighlights(e);let t=Array.from(e.querySelectorAll(".player-tag.current-player"));if(t.length>0){t.forEach(n=>n.classList.add("of-current-player-boost"));return}let o=this.getNativeTeamRows(e);o.forEach(n=>n.classList.add("of-current-player-boost"));let s=this.getNativeTeamCards(e);s.forEach(n=>n.classList.add("of-current-player-team-boost")),!(o.length>0||s.length>0)&&this.applyFallbackHighlight(e)}clearHighlights(e){e.querySelectorAll(".of-current-player-boost").forEach(t=>{t.classList.remove("of-current-player-boost")}),e.querySelectorAll(".of-current-player-team-boost").forEach(t=>{t.classList.remove("of-current-player-team-boost")})}getNativeTeamRows(e){return Array.from(e.querySelectorAll("div")).filter(t=>{let o=t.classList;return o.contains("bg-sky-600/20")&&o.contains("border-sky-500/40")})}getNativeTeamCards(e){return Array.from(e.querySelectorAll("div")).filter(t=>{let o=t.classList;return o.contains("rounded-xl")&&o.contains("border-sky-500/60")})}applyFallbackHighlight(e){let t=e.currentClientID,o=Array.isArray(e.clients)?e.clients:[];if(!t||o.length===0)return;let s=o.findIndex(m=>m?.clientID===t);if(s<0)return;let n=o[s],r=this.formatDisplayName(n),l=Array.from(e.querySelectorAll(".player-tag"));if(l[s]){l[s].classList.add("of-current-player-boost");return}Array.from(e.querySelectorAll("[data-client-id]")).filter(m=>m.dataset.clientId===t).forEach(m=>m.classList.add("of-current-player-boost")),this.findRowsByDisplayName(e,r).forEach(m=>m.classList.add("of-current-player-boost"));let f=Array.from(e.querySelectorAll(".rounded-xl")),b=(Array.isArray(e.teamPreview)?e.teamPreview:[]).filter(m=>Array.isArray(m.players)&&m.players.length>0).findIndex(m=>Array.isArray(m.players)&&m.players.some(g=>g?.clientID===t));b>=0&&f[b]&&(f[b].classList.add("of-current-player-team-boost"),this.findRowsByDisplayName(f[b],r).forEach(g=>g.classList.add("of-current-player-boost")))}formatDisplayName(e){return e?.username?e.clanTag?`[${e.clanTag}] ${e.username}`:e.username:""}findRowsByDisplayName(e,t){if(!t)return[];let o=[];for(let s of Array.from(e.querySelectorAll("span, div"))){let n=s.textContent?.trim();if(!n||n!==t)continue;let r=s.closest("[data-client-id]")??s.closest(".player-tag")??s.closest(".team-player-row")??s.closest("div");r&&!o.includes(r)&&o.push(r)}return o}};(function(){"use strict";console.log("[OpenFront Game Notifier] Initializing adaptation for OpenFront 0.30..."),GM_addStyle(K()),M.preloadSounds(),T.init(),U.start();let i=new F,e=new B;U.subscribe(s=>{i.receiveLobbyUpdate(s)}),e.start();let t=s=>{try{return new URL(s).searchParams.has("live")}catch{return!1}},o=t(location.href);T.subscribe(s=>{let n=t(s);!o&&n&&i.isSoundEnabled()&&M.playGameStartSound(),o=n}),console.log("[OpenFront Game Notifier] Ready! \u{1F680}")})();})();
