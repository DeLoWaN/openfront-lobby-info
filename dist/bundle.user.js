// ==UserScript==
// @name         OpenFront Game Notifier
// @namespace    https://openfront.io/
// @version      2.10.5
// @description  Notifies you when a public OpenFront lobby matches your filters (mode, team format, capacity, modifiers) via in-page highlight, sound, and optional desktop notifications. Never auto-joins.
// @homepageURL  https://github.com/DeLoWaN/openfront-autojoin-lobby
// @downloadURL  https://raw.githubusercontent.com/DeLoWaN/openfront-autojoin-lobby/main/dist/bundle.user.js
// @updateURL    https://raw.githubusercontent.com/DeLoWaN/openfront-autojoin-lobby/main/dist/bundle.user.js
// @author       DeLoVaN + SyntaxMenace + DeepSeek + Claude
// @match        https://openfront.io/
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @license      UNLICENSED
// ==/UserScript==

"use strict";(()=>{var u={bgPrimary:"#0d0f10",bgSecondary:"#14171a",bgElevated:"#1a1e22",bgRaised:"#20252a",bgHover:"rgba(255,255,255,0.04)",textPrimary:"#f2f1ee",textSecondary:"#c8c6c0",textMuted:"#8e8c85",textFaint:"#5a5853",border:"rgba(255,255,255,0.06)",borderSubtle:"rgba(255,255,255,0.10)",borderStrong:"rgba(255,255,255,0.16)",accent:"#7aa7d4",accentSoft:"rgba(122,167,212,0.14)",accentLine:"rgba(122,167,212,0.32)",accentShadow:"122,167,212",warning:"#d4a056",warningSoft:"rgba(212,160,86,0.14)",danger:"#d27a6b",dangerSoft:"rgba(210,122,107,0.14)",dangerLine:"rgba(210,122,107,0.30)",accentMuted:"rgba(122,167,212,0.14)",accentHover:"#9bbfe0",accentAlt:"#9bbfe0",borderAccent:"rgba(122,167,212,0.32)",highlight:"rgba(122,167,212,0.20)",success:"#74c69d",successSolid:"#74c69d",error:"#d27a6b"},f={body:"'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",display:"'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",mono:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"};var O={sm:"6px",md:"7px",lg:"10px",xl:"14px"},C={sm:"0 1px 3px rgba(0,0,0,0.4)",md:"0 2px 8px rgba(0,0,0,0.3)",lg:"0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)"},c={fast:"0.12s",normal:"0.2s",slow:"0.3s"};var J={threadCount:20,lobbyPollingRate:1e3},w={lobbyDiscoverySettings:"OF_LOBBY_DISCOVERY_SETTINGS",lobbyDiscoveryPanelSize:"OF_LOBBY_DISCOVERY_PANEL_SIZE"},X={panel:9998,panelOverlay:9999,modal:1e4,notification:2e4},Z=[2,3,4,5,6,8,10,15,20,30,62],y=2,U=62;function ee(){return`
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
      border-radius: ${O.xl};
      box-shadow: ${C.lg};
      font-family: ${f.body};
      color: var(--of-hud-text-1);
      user-select: none;
      z-index: ${X.panel};
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
      font-family: ${f.mono};
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
    .ld-mode-btn input { display: none; }
    .ld-chip input { display: none; }

    /* Header */
    .ld-head {
      padding: 16px 18px 12px;
      border-bottom: 1px solid var(--of-hud-line-1);
      flex-shrink: 0;
    }
    .ld-eyebrow {
      font-family: ${f.mono};
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--of-hud-text-4);
      margin-bottom: 4px;
    }
    .ld-title {
      font-family: ${f.display};
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
      font-family: ${f.mono};
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
      font-family: ${f.mono};
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
      font-family: ${f.mono};
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
    .capacity-slider.is-max-locked::-webkit-slider-thumb {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .capacity-slider.is-max-locked::-moz-range-thumb {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .capacity-slider.is-max-locked {
      pointer-events: none;
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
      box-shadow: ${C.sm};
      pointer-events: auto;
      cursor: grab;
    }
    .capacity-slider::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--of-hud-text-1);
      border: 1px solid rgba(0,0,0,0.4);
      box-shadow: ${C.sm};
      pointer-events: auto;
      cursor: grab;
    }
    .capacity-slider-min { z-index: 2; }
    .capacity-slider-max { z-index: 1; }

    /* Stepper (number input + - / + buttons) */
    .ld-stepper {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: rgba(0,0,0,0.25);
      border: 1px solid var(--of-hud-line-1);
      border-radius: 6px;
      padding: 2px 4px;
      font-family: ${f.mono};
    }
    .ld-stepper input[type="number"] {
      width: 2.5em;
      background: transparent;
      border: none;
      color: var(--of-hud-text-1);
      font: inherit;
      text-align: center;
      padding: 0 2px;
      font-variant-numeric: tabular-nums;
      -moz-appearance: textfield;
    }
    .ld-stepper input[type="number"]::-webkit-outer-spin-button,
    .ld-stepper input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .ld-stepper input[type="number"]:focus { outline: none; color: var(--of-hud-accent); }
    .ld-stepper input[type="number"]:disabled { opacity: 0.45; cursor: not-allowed; }
    .ld-step-btn {
      width: 18px; height: 18px;
      display: inline-flex; align-items: center; justify-content: center;
      background: transparent;
      border: none;
      color: var(--of-hud-text-3);
      cursor: pointer;
      border-radius: 3px;
      font: inherit;
      line-height: 1;
      padding: 0;
    }
    .ld-step-btn:hover:not(:disabled) {
      background: var(--of-hud-bg-3);
      color: var(--of-hud-text-1);
    }
    .ld-step-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Ticks under the slider track */
    .ld-ticks {
      position: relative;
      height: 18px;
      margin: 6px 6px 4px;
      pointer-events: none;
    }
    .ld-tick {
      position: absolute;
      top: 0;
      width: 1px;
      height: 4px;
      background: var(--of-hud-text-4);
      transform: translateX(-0.5px);
    }
    .ld-tick-label {
      position: absolute;
      top: 6px;
      transform: translateX(-50%);
      font-family: ${f.mono};
      font-size: 10px;
      color: var(--of-hud-text-3);
      font-variant-numeric: tabular-nums;
    }

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
      font-family: ${f.mono};
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
      border-radius: ${O.sm};
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
      font-family: ${f.mono};
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
      font-family: ${f.mono};
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
      color: var(--of-hud-text-2);
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
    .ld-mod-name { font-weight: 500; }
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
      font-family: ${f.mono};
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
  `}var L={gameFoundAudio:null,gameStartAudio:null,audioUnlocked:!1,preloadSounds(){try{this.gameFoundAudio=new Audio("https://github.com/DeLoWaN/openfront-autojoin-lobby/raw/refs/heads/main/notification_sounds/new-notification-014-363678.mp3"),this.gameFoundAudio.volume=.5,this.gameFoundAudio.preload="auto",this.gameStartAudio=new Audio("https://github.com/DeLoWaN/openfront-autojoin-lobby/raw/refs/heads/main/notification_sounds/opening-bell-421471.mp3"),this.gameStartAudio.volume=.5,this.gameStartAudio.preload="auto",this.setupAudioUnlock()}catch(n){console.warn("[SoundUtils] Could not preload audio:",n)}},setupAudioUnlock(){let n=()=>{if(this.audioUnlocked)return;let e=[];this.gameFoundAudio&&(this.gameFoundAudio.volume=.01,e.push(this.gameFoundAudio.play().then(()=>{this.gameFoundAudio&&(this.gameFoundAudio.pause(),this.gameFoundAudio.currentTime=0,this.gameFoundAudio.volume=.5)}).catch(()=>{}))),this.gameStartAudio&&(this.gameStartAudio.volume=.01,e.push(this.gameStartAudio.play().then(()=>{this.gameStartAudio&&(this.gameStartAudio.pause(),this.gameStartAudio.currentTime=0,this.gameStartAudio.volume=.5)}).catch(()=>{}))),Promise.all(e).then(()=>{this.audioUnlocked=!0,console.log("[SoundUtils] Audio unlocked successfully"),document.removeEventListener("click",n),document.removeEventListener("keydown",n),document.removeEventListener("touchstart",n)})};document.addEventListener("click",n,{once:!0}),document.addEventListener("keydown",n,{once:!0}),document.addEventListener("touchstart",n,{once:!0})},playGameFoundSound(){this.gameFoundAudio?(console.log("[SoundUtils] Attempting to play game found sound"),this.gameFoundAudio.currentTime=0,this.gameFoundAudio.play().catch(n=>{console.warn("[SoundUtils] Failed to play game found sound:",n)})):console.warn("[SoundUtils] Game found audio not initialized")},playGameStartSound(){this.gameStartAudio?(console.log("[SoundUtils] Attempting to play game start sound"),this.gameStartAudio.currentTime=0,this.gameStartAudio.play().catch(n=>{console.warn("[SoundUtils] Failed to play game start sound:",n)})):console.warn("[SoundUtils] Game start audio not initialized")}};var k={callbacks:[],lastUrl:location.href,initialized:!1,init(){if(this.initialized)return;this.initialized=!0;let n=()=>{location.href!==this.lastUrl&&(this.lastUrl=location.href,this.notify())};window.addEventListener("popstate",n),window.addEventListener("hashchange",n);let e=history.pushState,t=history.replaceState;history.pushState=function(...i){e.apply(history,i),setTimeout(n,0)},history.replaceState=function(...i){t.apply(history,i),setTimeout(n,0)},setInterval(n,200)},subscribe(n){this.callbacks.push(n),this.init()},notify(){this.callbacks.forEach(n=>n(location.href))}};var q={subscribers:[],fallbackInterval:null,fallbackStartTimeout:null,lastLobbies:[],pollingRate:J.lobbyPollingRate,started:!1,publicLobbiesListener:null,start(){this.started||(this.started=!0,this.publicLobbiesListener=n=>this.handlePublicLobbiesUpdate(n),document.addEventListener("public-lobbies-update",this.publicLobbiesListener),this.scheduleFallbackPolling())},stop(){this.started&&(this.started=!1,this.publicLobbiesListener&&(document.removeEventListener("public-lobbies-update",this.publicLobbiesListener),this.publicLobbiesListener=null),this.fallbackStartTimeout&&(clearTimeout(this.fallbackStartTimeout),this.fallbackStartTimeout=null),this.stopFallbackPolling())},subscribe(n){this.subscribers.push(n),this.lastLobbies.length>0&&n(this.lastLobbies)},scheduleFallbackPolling(){!this.started||this.fallbackInterval||this.fallbackStartTimeout||(this.fallbackStartTimeout=setTimeout(()=>{this.fallbackStartTimeout=null,this.startFallbackPolling()},this.pollingRate*2))},startFallbackPolling(){this.fallbackInterval||(this.fetchData(),this.fallbackInterval=setInterval(()=>void this.fetchData(),this.pollingRate))},stopFallbackPolling(){this.fallbackInterval&&(clearInterval(this.fallbackInterval),this.fallbackInterval=null)},async fetchData(){if(!(location.pathname!=="/"&&!location.pathname.startsWith("/public-lobby")))try{let n=await fetch("/api/public_lobbies");if(n.status===429){console.warn("[Bundle] Rate limited.");return}if(!n.ok){console.warn(`[Bundle] API error: ${n.status}`);return}let e=await n.json();this.lastLobbies=this.extractLobbies(e),this.notifySubscribers()}catch(n){console.error("[Bundle] API Error:",n)}},notifySubscribers(){this.subscribers.forEach(n=>n(this.lastLobbies))},handlePublicLobbiesUpdate(n){this.fallbackStartTimeout&&(clearTimeout(this.fallbackStartTimeout),this.fallbackStartTimeout=null),this.stopFallbackPolling();let e=n.detail?.payload;this.lastLobbies=this.extractLobbies(e),this.notifySubscribers(),this.scheduleFallbackPolling()},extractLobbies(n){if(!n||typeof n!="object")return[];if(Array.isArray(n.lobbies))return n.lobbies;let e=n.games;return e?["ffa","team","special"].flatMap(t=>(e[t]??[]).map(i=>({...i,publicGameType:i.publicGameType??t}))):[]}};var A={lastActionTime:0,debounceDelay:800,getLobbyButton(){return document.querySelector("public-lobby")?.querySelector("button.group.relative.isolate")},canJoinLobby(){let n=document.querySelector("public-lobby");if(!n)return!1;let e=this.getLobbyButton();return!!(e&&!n.isLobbyHighlighted&&n.lobbies&&n.lobbies.length>0&&!e.disabled&&e.offsetParent!==null)},verifyState(n){let e=document.querySelector("public-lobby");if(!e)return!1;let t=this.getLobbyButton();return!t||t.disabled||t.offsetParent===null?!1:n==="in"?e.isLobbyHighlighted===!0:n==="out"?!!(!e.isLobbyHighlighted&&e.lobbies&&e.lobbies.length>0):!1},tryJoinLobby(){let n=Date.now();if(n-this.lastActionTime<this.debounceDelay)return!1;let e=this.getLobbyButton(),t=document.querySelector("public-lobby");return e&&t&&!t.isLobbyHighlighted&&t.lobbies&&t.lobbies.length>0&&!e.disabled&&e.offsetParent!==null?(this.lastActionTime=n,e.click(),setTimeout(()=>{this.verifyState("in")||console.warn("[LobbyUtils] Join may have failed, state not updated")},100),!0):!1},isOnLobbyPage(){let n=document.getElementById("page-game");if(n&&!n.classList.contains("hidden"))return!1;let e=document.querySelector("canvas");if(e&&e.offsetParent!==null){let s=e.getBoundingClientRect();if(s.width>100&&s.height>100)return!1}let t=document.querySelector("public-lobby");if(t&&t.offsetParent!==null)return!0;if(t&&t.offsetParent===null)return!1;let i=document.getElementById("page-play");if(i&&!i.classList.contains("hidden")&&t)return!0;let o=window.location.pathname.replace(/\/+$/,"")||"/";return o==="/"||o==="/public-lobby"}};var V={isSupported(){return typeof Notification<"u"},isBackgrounded(){let n=document.visibilityState==="hidden"||document.hidden,e=typeof document.hasFocus=="function"?document.hasFocus():!0;return n||!e},async ensurePermission(){if(typeof Notification>"u")return!1;if(Notification.permission==="granted")return!0;if(Notification.permission==="denied")return!1;try{return await Notification.requestPermission()==="granted"}catch(n){return console.warn("[BrowserNotificationUtils] Permission request failed:",n),!1}},show(n){if(!this.isSupported()||!this.isBackgrounded())return!1;if(Notification.permission==="granted"){let e=new Notification(n.title,{body:n.body});return e.onclick=()=>{this.focusWindow(),e.close()},!0}return!1},focusWindow(){window.focus()}};var de="any";function ne(n){if(!n)return null;let e=n.toLowerCase().trim();return e==="free for all"||e==="ffa"||e==="free-for-all"?"FFA":e==="team"||e==="teams"?"Team":null}function v(n){return ne(n.gameConfig?.gameMode)}function oe(n){let e=n.publicGameType?.toLowerCase().trim();return e==="ffa"||e==="team"||e==="special"?e:null}function z(n){if(n==="Duos"||n==="Trios"||n==="Quads"||n==="Humans Vs Nations"||typeof n=="number"&&Number.isFinite(n)&&n>0)return n;if(typeof n=="string"){let e=parseInt(n,10);if(!Number.isNaN(e)&&e>0)return e}return null}function T(n){let e=n.gameConfig;if(!e||v(n)!=="Team")return null;let t=z(e.playerTeams??null);return t!==null?t:z(e.teamCount??e.teams??null)}function N(n){let e=n.gameConfig;return e?e.maxPlayers??e.maxClients??e.maxPlayersPerGame??n.maxClients??null:null}function P(n,e){return!n||!e?null:n==="Duos"?2:n==="Trios"?3:n==="Quads"?4:n==="Humans Vs Nations"?e:typeof n=="number"&&n>0?Math.floor(e/n):null}function D(n,e){let t=n.gameConfig?.publicGameModifiers;switch(e){case"isCompact":return t?.isCompact;case"isRandomSpawn":return t?.isRandomSpawn;case"isCrowded":return t?.isCrowded;case"isHardNations":return t?.isHardNations;case"isAlliancesDisabled":return t?.isAlliancesDisabled;case"isPortsDisabled":return t?.isPortsDisabled;case"isNukesDisabled":return t?.isNukesDisabled;case"isSAMsDisabled":return t?.isSAMsDisabled;case"isPeaceTime":return t?.isPeaceTime;case"isWaterNukes":return t?.isWaterNukes;case"startingGold":return t?.startingGold??n.gameConfig?.startingGold??void 0;case"goldMultiplier":return t?.goldMultiplier??n.gameConfig?.goldMultiplier??void 0;default:return}}function se(n){let e=v(n),t=T(n),i=N(n);if(e==="FFA")return i!==null?`FFA \u2022 ${i} slots`:"FFA";if(e!=="Team")return"Unsupported mode";if(t==="Humans Vs Nations")return i!==null?`Humans Vs Nations (${i})`:"Humans Vs Nations";if(t==="Duos")return"Duos";if(t==="Trios")return"Trios";if(t==="Quads")return"Quads";if(typeof t=="number"&&i!==null){let o=P(t,i);return o!==null?`${t} teams (${o} per team)`:`${t} teams`}return"Team"}function ce(n){let e=v(n),t=T(n);return e==="FFA"?"FFA":e!=="Team"?"Unsupported mode":t==="Humans Vs Nations"?"Humans Vs Nations":t==="Duos"||t==="Trios"||t==="Quads"?t:typeof t=="number"?`${t} teams`:"Team"}function ue(n){return n>=1e6&&n%1e6===0?`${n/1e6}M`:n>=1e3&&n%1e3===0?`${n/1e3}K`:String(n)}function me(n){let e=n.gameConfig?.publicGameModifiers,t=[];e?.isCompact&&t.push("Compact"),e?.isRandomSpawn&&t.push("Random"),e?.isCrowded&&t.push("Crowded"),e?.isHardNations&&t.push("Hard");let i=e?.startingGold??n.gameConfig?.startingGold;typeof i=="number"&&t.push(ue(i));let o=e?.goldMultiplier??n.gameConfig?.goldMultiplier;return typeof o=="number"&&t.push(`x${o}`),e?.isAlliancesDisabled&&t.push("No Alliances"),e?.isPortsDisabled&&t.push("No Ports"),e?.isNukesDisabled&&t.push("No Nukes"),e?.isSAMsDisabled&&t.push("No SAMs"),e?.isPeaceTime&&t.push("Peace"),e?.isWaterNukes&&t.push("Water Nukes"),t}function ae(n){let e=[],t=n.gameConfig?.gameMap?.trim(),i=N(n),o=T(n),s=ce(n);if(t&&e.push(t),v(n)==="Team"&&o!=="Humans Vs Nations"){e.push(s);let l=P(o,i);l!==null&&e.push(`${l}/team`)}else e.push(s);let a=[];i!==null&&a.push(`${i} slots`);let r=me(n);return r.length>0&&a.push(r.join(", ")),{title:e.join(" \u2022 "),body:a.join(" \u2022 ")}}function te(n){return typeof n=="number"&&Number.isFinite(n)?n:null}function b(n){return n==="blocked"||n==="rejected"?"blocked":n==="required"?"required":n==="any"||n==="allowed"||n==="indifferent"?"any":de}function ie(n){if(!n||typeof n!="object")return;let e={};for(let[t,i]of Object.entries(n)){let o=Number(t);Number.isFinite(o)&&(e[o]=b(i))}return Object.keys(e).length>0?e:void 0}function pe(n){if(!n||typeof n!="object")return;let e=n;return{isCompact:b(e.isCompact),isRandomSpawn:b(e.isRandomSpawn),isCrowded:b(e.isCrowded),isHardNations:b(e.isHardNations),isAlliancesDisabled:b(e.isAlliancesDisabled),isPortsDisabled:b(e.isPortsDisabled),isNukesDisabled:b(e.isNukesDisabled),isSAMsDisabled:b(e.isSAMsDisabled),isPeaceTime:b(e.isPeaceTime),isWaterNukes:b(e.isWaterNukes),startingGold:ie(e.startingGold),goldMultiplier:ie(e.goldMultiplier)}}function fe(n){if(!Array.isArray(n))return[];let e=[];for(let t of n){let i=t,o=ne(i.gameMode??null);if(!o)continue;let s=te(i.minPlayers),a=te(i.maxPlayers);o==="Team"&&(typeof s=="number"&&s<y&&(s=y),typeof s=="number"&&typeof a=="number"&&a<s&&(a=s)),e.push({gameMode:o,teamCount:o==="Team"?z(i.teamCount??null):null,minPlayers:s,maxPlayers:a,modifiers:pe(i.modifiers)})}return e}function Q(n,e=Date.now()){let t=Math.max(0,Math.floor((e-n)/1e3));return`${Math.floor(t/60)}m ${t%60}s`}function re(n){return{criteria:fe(n?.criteria),discoveryEnabled:typeof n?.discoveryEnabled=="boolean"?n.discoveryEnabled:!0,soundEnabled:typeof n?.soundEnabled=="boolean"?n.soundEnabled:!0,desktopNotificationsEnabled:typeof n?.desktopNotificationsEnabled=="boolean"?n.desktopNotificationsEnabled:!1,isTeamTwoTimesMinEnabled:typeof n?.isTeamTwoTimesMinEnabled=="boolean"?n.isTeamTwoTimesMinEnabled:!!n?.isTeamThreeTimesMinEnabled}}var be=["isCompact","isRandomSpawn","isCrowded","isHardNations","isAlliancesDisabled","isPortsDisabled","isNukesDisabled","isSAMsDisabled","isPeaceTime","isWaterNukes"],H=class{matchesCriteria(e,t){if(!e||!e.gameConfig||!t||t.length===0)return!1;let i=v(e),o=N(e);if(!i||o===null)return!1;let s=T(e),a=i==="Team"?P(s,o):null;for(let r of t){if(r.gameMode!==i||i==="Team"&&(r.teamCount!==null&&r.teamCount!==void 0&&r.teamCount!==s||a===null))continue;let l=i==="Team"?a:o;if(l!==null&&!(r.minPlayers!==null&&l<r.minPlayers)&&!(r.maxPlayers!==null&&l>r.maxPlayers)&&this.matchesModifiers(e,r.modifiers))return!0}return!1}matchesModifiers(e,t){if(!t)return!0;for(let i of be){let o=t[i];if(!o||o==="any")continue;let s=!!D(e,i);if(o==="blocked"&&s||o==="required"&&!s)return!1}return!(!this.matchesNumericModifier(D(e,"startingGold"),t.startingGold)||!this.matchesNumericModifier(D(e,"goldMultiplier"),t.goldMultiplier))}matchesNumericModifier(e,t){if(!t)return!0;let i=typeof e=="number"&&Number.isFinite(e)?e:null,o=Object.entries(t);if(o.length===0)return!0;let s=o.filter(([,r])=>r==="blocked").map(([r])=>Number(r));if(i!==null&&s.includes(i))return!1;let a=o.filter(([,r])=>r==="required").map(([r])=>Number(r));return!(a.length>0&&(i===null||!a.includes(i)))}};function g(n,e){if(e.length===0)return n;let t=e[0],i=e[e.length-1];return n<t?t:n>i?i:n}function x(n,e){if(e.length<2)return 0;let t=g(n,e),i=e.length-1;if(t>=e[i])return 1;if(t<=e[0])return 0;for(let o=0;o<i;o++){let s=e[o],a=e[o+1];if(t>=s&&t<=a){let r=(t-s)/(a-s);return(o+r)/i}}return 1}function j(n,e){if(e.length<2)return e[0]??0;let t=e.length-1;if(n<=0)return e[0];if(n>=1)return e[t];let i=n*t,o=Math.floor(i),s=i-o,a=e[o]+s*(e[o+1]-e[o]);return Math.round(a)}function W(n,e){if(e.length===0)return n;let t=g(n,e),i=e[0],o=Math.abs(t-i);for(let s=1;s<e.length;s++){let a=Math.abs(t-e[s]);a<o&&(i=e[s],o=a)}return i}var S=1e3,E=class{constructor(e){this.onMinSliderInput=()=>{let e=parseInt(this.minSlider.value,10)/S,t=j(e,this.stops);this.cfg.stops&&(t=W(t,this.stops)),this.applyValues(t,this.lastMax,{fireOnChange:!0})};this.onMaxSliderInput=()=>{let e=parseInt(this.maxSlider.value,10)/S,t=j(e,this.stops);this.cfg.stops&&(t=W(t,this.stops)),this.applyValues(this.lastMin,t,{fireOnChange:!0})};this.onMinInputChange=()=>{let e=parseInt(this.minInput.value,10);if(!Number.isFinite(e)){this.applyValues(this.lastMin,this.lastMax,{fireOnChange:!1});return}let t=g(e,[this.cfg.bounds.min,this.cfg.bounds.max]);this.applyValues(t,this.lastMax,{fireOnChange:!0})};this.onMaxInputChange=()=>{let e=parseInt(this.maxInput.value,10);if(!Number.isFinite(e)){this.applyValues(this.lastMin,this.lastMax,{fireOnChange:!1});return}let t=g(e,[this.cfg.bounds.min,this.cfg.bounds.max]);this.applyValues(this.lastMin,t,{fireOnChange:!0})};if(this.cfg=e,this.stops=e.stops??[e.bounds.min,e.bounds.max],this.minSlider=document.getElementById(e.minSliderId),this.maxSlider=document.getElementById(e.maxSliderId),this.minInput=document.getElementById(e.minInputId),this.maxInput=document.getElementById(e.maxInputId),this.fill=document.getElementById(e.fillId),this.rangeRoot=this.fill?.parentElement?.parentElement??null,!this.minSlider||!this.maxSlider||!this.minInput||!this.maxInput)throw new Error(`RangeSlider: missing required element in ${e.rootId}`);this.minSlider.min="0",this.minSlider.max=String(S),this.maxSlider.min="0",this.maxSlider.max=String(S),this.lastMin=this.readInputClamped(this.minInput,e.bounds.min),this.lastMax=this.readInputClamped(this.maxInput,e.bounds.max),this.lastMax<this.lastMin&&(this.lastMax=this.lastMin),this.minSlider.addEventListener("input",this.onMinSliderInput),this.maxSlider.addEventListener("input",this.onMaxSliderInput),this.minInput.addEventListener("change",this.onMinInputChange),this.maxInput.addEventListener("change",this.onMaxInputChange),this.applyValues(this.lastMin,this.lastMax,{fireOnChange:!1}),this.renderTicks(),this.wireSteppers(),this.applyLockState()}applyLockState(){let e=!!this.cfg.lockMaxToTwiceMin?.();this.maxSlider.disabled=e,this.maxSlider.classList.toggle("is-max-locked",e),this.maxInput.disabled=e;let t=document.getElementById(this.cfg.rootId);t&&t.querySelectorAll('.ld-step-btn[data-target="max"]').forEach(i=>{i.disabled=e}),e&&this.applyValues(this.lastMin,this.lastMax,{fireOnChange:!1})}setMin(e){this.applyValues(e,this.lastMax,{fireOnChange:!0})}setRange(e,t){this.applyValues(e,t,{fireOnChange:!1})}readInputClamped(e,t){let i=parseInt(e.value,10);return Number.isFinite(i)?g(i,[this.cfg.bounds.min,this.cfg.bounds.max]):t}applyValues(e,t,i){let o=e,s=t;if(this.cfg.lockMaxToTwiceMin?.()&&(s=g(o*2,[this.cfg.bounds.min,this.cfg.bounds.max])),o>s&&(o>this.lastMin?s=o:o=s),this.lastMin=o,this.lastMax=s,this.minInput.value=String(o),this.maxInput.value=String(s),this.minSlider.value=String(Math.round(x(o,this.stops)*S)),this.maxSlider.value=String(Math.round(x(s,this.stops)*S)),this.rangeRoot){let a=x(o,this.stops)*100,r=x(s,this.stops)*100;this.rangeRoot.style.setProperty("--lo",`${a}%`),this.rangeRoot.style.setProperty("--hi",`${r}%`)}i.fireOnChange&&this.cfg.onChange(o,s)}renderTicks(){if(!this.cfg.ticksContainerId||!this.cfg.stops)return;let e=document.getElementById(this.cfg.ticksContainerId);if(e){e.innerHTML="";for(let t of this.cfg.stops){let i=x(t,this.cfg.stops)*100,o=document.createElement("div");o.className="ld-tick",o.style.left=`${i}%`;let s=document.createElement("span");s.className="ld-tick-label",s.style.left=`${i}%`,s.textContent=String(t),e.appendChild(o),e.appendChild(s)}}}wireSteppers(){let e=document.getElementById(this.cfg.rootId);if(!e)return;e.querySelectorAll(".ld-step-btn").forEach(i=>{let o=i.dataset.target,s=i.dataset.action;!o||!s||i.addEventListener("click",()=>{let a=s==="inc"?1:-1;if(o==="min"){let r=g(this.lastMin+a,[this.cfg.bounds.min,this.cfg.bounds.max]);this.applyValues(r,this.lastMax,{fireOnChange:!0})}else{let r=g(this.lastMax+a,[this.cfg.bounds.min,this.cfg.bounds.max]);this.applyValues(this.lastMin,r,{fireOnChange:!0})}})})}};var $=[1e6,5e6,25e6],F=[2],Y=["modifier-isCompact","modifier-isRandomSpawn","modifier-isCrowded","modifier-isHardNations","modifier-isAlliancesDisabled","modifier-isPortsDisabled","modifier-isNukesDisabled","modifier-isSAMsDisabled","modifier-isPeaceTime","modifier-isWaterNukes"],le=[["discovery-team-duos","Duos",2],["discovery-team-trios","Trios",3],["discovery-team-quads","Quads",4],["discovery-team-hvn","Humans Vs Nations",null]],he=[["discovery-team-2","2"],["discovery-team-3","3"],["discovery-team-4","4"],["discovery-team-5","5"],["discovery-team-6","6"],["discovery-team-7","7"]],R=[...le.map(([n])=>n),...he.map(([n])=>n)];function ge(){try{if(typeof unsafeWindow<"u"&&unsafeWindow.__OF_DEBUG_DISCOVERY===!0)return!0}catch{}if(globalThis.__OF_DEBUG_DISCOVERY===!0)return!0;try{if(typeof localStorage<"u"&&localStorage.getItem("__OF_DEBUG_DISCOVERY")==="true")return!0}catch{}return!1}var K='<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>',ye='<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',ve='<svg viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7"/><path d="M19 5a9 9 0 010 14"/></svg>',xe='<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/></svg>',B=class{constructor(){this.discoveryEnabled=!0;this.criteriaList=[];this.searchStartTime=null;this.lastMatchTime=null;this.soundEnabled=!0;this.desktopNotificationsEnabled=!1;this.desktopNotificationRequestId=0;this.activeMatchSources=new Set;this.seenLobbies=new Set;this.desktopNotifiedLobbies=new Set;this.isTeamTwoTimesMinEnabled=!1;this.ffaSlider=null;this.teamSlider=null;this.sleeping=!1;this.isDisposed=!1;this.timerInterval=null;this.gameInfoInterval=null;this.pulseSyncTimeout=null;this.engine=new H,this.loadSettings(),this.createUI(),this.updateSleepState(),k.subscribe(()=>this.updateSleepState())}receiveLobbyUpdate(e){this.processLobbies(e)}isSoundEnabled(){return this.soundEnabled}loadSettings(){let e=GM_getValue(w.lobbyDiscoverySettings,null),t=re(e);GM_setValue(w.lobbyDiscoverySettings,t),this.criteriaList=t.criteria,this.soundEnabled=t.soundEnabled,this.desktopNotificationsEnabled=t.desktopNotificationsEnabled,this.discoveryEnabled=t.discoveryEnabled,this.isTeamTwoTimesMinEnabled=t.isTeamTwoTimesMinEnabled}saveSettings(){GM_setValue(w.lobbyDiscoverySettings,{criteria:this.criteriaList,discoveryEnabled:this.discoveryEnabled,soundEnabled:this.soundEnabled,desktopNotificationsEnabled:this.desktopNotificationsEnabled,isTeamTwoTimesMinEnabled:this.isTeamTwoTimesMinEnabled})}updateStatusText(){let e=document.getElementById("discovery-search-timer");if(e){if(!this.discoveryEnabled||this.criteriaList.length===0||!this.isDiscoveryFeedbackAllowed()){e.textContent="",e.style.display="none";return}e.style.display="inline",this.lastMatchTime!==null?e.textContent=`last match ${Q(this.lastMatchTime)}`:this.searchStartTime!==null?e.textContent=`searching \xB7 ${Q(this.searchStartTime)}`:e.textContent="awaiting filters"}}updateCurrentGameInfo(){let e=document.getElementById("discovery-current-game-info");if(!e||!A.isOnLobbyPage()){e&&(e.style.display="none");return}let t=document.querySelector("public-lobby");if(!t||!Array.isArray(t.lobbies)||t.lobbies.length===0){e.style.display="none";return}let i=t.lobbies[0];if(!i||!i.gameConfig){e.style.display="none";return}e.style.display="block",e.textContent=`Current game: ${se(i)}`}processLobbies(e){try{if(this.updateCurrentGameInfo(),this.syncSearchTimer(),!this.discoveryEnabled||this.criteriaList.length===0||!this.isDiscoveryFeedbackAllowed()){this.seenLobbies.clear(),this.desktopNotifiedLobbies.clear(),this.updateQueueCardPulses(new Set),this.updateStatusText();return}let t=new Set,i=new Set,o=[],s=!1,a=ge(),r=new Set;for(let l of e){let d=oe(l);if(!d)continue;let m=this.engine.matchesCriteria(l,this.criteriaList),h=!r.has(d);if(h&&r.add(d),a&&console.log("[OF Discovery]",{lobbyId:l.gameID,source:d,featured:h,mode:l.gameConfig?.gameMode,playerTeams:l.gameConfig?.playerTeams,modifiers:l.gameConfig?.publicGameModifiers,hostGold:{startingGold:l.gameConfig?.startingGold,goldMultiplier:l.gameConfig?.goldMultiplier},criteriaCount:this.criteriaList.length,matched:m}),!m||!h)continue;t.add(d);let M=this.getNotificationKey(l);i.add(M),this.seenLobbies.has(M)||(s=!0),this.desktopNotifiedLobbies.has(M)||o.push(l)}if(this.updateQueueCardPulses(t),s&&(this.lastMatchTime=Date.now(),this.soundEnabled&&L.playGameFoundSound()),this.desktopNotificationsEnabled){let l=new Set;for(let d of o){let m=ae(d),h=this.getNotificationKey(d);V.show({title:m.title,body:m.body,tag:h})&&l.add(h)}this.desktopNotifiedLobbies=new Set([...[...this.desktopNotifiedLobbies].filter(d=>i.has(d)),...l])}else this.desktopNotifiedLobbies.clear();this.seenLobbies=i,i.size===0&&(this.lastMatchTime=null),this.updateStatusText()}catch(t){console.error("[LobbyDiscovery] Error processing lobbies:",t)}}getNotificationKey(e){return JSON.stringify({gameID:e.gameID,mode:e.gameConfig?.gameMode??null,playerTeams:e.gameConfig?.playerTeams??e.gameConfig?.teamCount??null,capacity:e.gameConfig?.maxPlayers??e.maxClients??null,modifiers:e.gameConfig?.publicGameModifiers??{}})}isDiscoveryFeedbackAllowed(){return!(!A.isOnLobbyPage()||document.getElementById("page-play")?.classList.contains("hidden")||document.querySelector("public-lobby")?.isLobbyHighlighted===!0||document.querySelector("join-lobby-modal")?.currentLobbyId||document.querySelector("host-lobby-modal")?.lobbyId)}getQueueCardElements(){let e=document.querySelector("game-mode-selector");if(!e)return{};let t=Array.from(e.querySelectorAll("div")).find(a=>a.className.includes("sm:grid-cols-[2fr_1fr]"));if(!(t instanceof HTMLElement))return{};let[i,o]=Array.from(t.children),s=o?Array.from(o.children):[];return{ffa:i?.querySelector("button"),special:s[0]?.querySelector("button"),team:s[1]?.querySelector("button")}}updateQueueCardPulses(e){this.activeMatchSources=new Set(e),this.applyQueueCardPulses(),this.scheduleQueueCardPulseSync()}applyQueueCardPulses(){let e=this.getQueueCardElements();for(let t of["ffa","special","team"]){let i=e[t];i&&i.classList.toggle("of-discovery-card-active",this.activeMatchSources.has(t))}}scheduleQueueCardPulseSync(){this.pulseSyncTimeout&&clearTimeout(this.pulseSyncTimeout),this.pulseSyncTimeout=setTimeout(()=>{this.pulseSyncTimeout=null,this.applyQueueCardPulses()},16)}stopTimer(){this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null)}startGameInfoUpdates(){this.stopGameInfoUpdates(),this.updateCurrentGameInfo(),this.gameInfoInterval=setInterval(()=>this.updateCurrentGameInfo(),1e3)}stopGameInfoUpdates(){this.gameInfoInterval&&(clearInterval(this.gameInfoInterval),this.gameInfoInterval=null)}syncSearchTimer(e={}){let{resetStart:t=!1}=e;this.stopTimer(),t&&(this.searchStartTime=null,this.lastMatchTime=null,this.seenLobbies.clear(),this.desktopNotifiedLobbies.clear()),this.discoveryEnabled&&this.criteriaList.length>0&&this.isDiscoveryFeedbackAllowed()?(this.searchStartTime===null&&(this.searchStartTime=Date.now()),this.timerInterval=setInterval(()=>this.updateStatusText(),1e3)):(this.searchStartTime=null,this.lastMatchTime=null),this.updateStatusText(),this.updatePulseIndicator()}updatePulseIndicator(){let e=document.querySelector(".ld-pulse");if(!e)return;let t=this.discoveryEnabled&&this.criteriaList.length>0;e.classList.toggle("is-paused",!t)}setDiscoveryEnabled(e,t={}){this.discoveryEnabled=e,this.saveSettings(),this.updateStatusLabel(),this.syncSearchTimer({resetStart:t.resetTimer??!1})}updateStatusLabel(){let e=document.querySelector(".ld-status-text strong");e&&(e.textContent=this.discoveryEnabled?"Discovery active":"Discovery paused")}getNumberValue(e){let t=document.getElementById(e);if(!t)return null;let i=parseInt(t.value,10);return Number.isNaN(i)?null:i}getModifierState(e){let i=document.getElementById(e)?.dataset.state;return i==="required"||i==="blocked"?i:"any"}setModifierState(e,t){let i=document.getElementById(e);if(!i)return;i.dataset.state=t,i.setAttribute("aria-pressed",String(t!=="any"));let o=i.dataset.modName??i.getAttribute("aria-label")??"",s=t==="blocked"?"excluded":t;o&&i.setAttribute("aria-label",t==="any"?o:`${o} \xB7 ${s}`);let a=i.querySelector(".ld-mod-ind");a&&(t==="required"?a.innerHTML=K:t==="blocked"?a.innerHTML=ye:a.innerHTML="")}cycleModifierState(e){let t=this.getModifierState(e),i=t==="any"?"required":t==="required"?"blocked":"any";this.setModifierState(e,i)}getNumericModifierState(e){let t={};for(let[i,o]of Object.entries(e))t[Number(i)]=this.getModifierState(o);return t}getModifierFiltersFromUI(){return{isCompact:this.getModifierState("modifier-isCompact"),isRandomSpawn:this.getModifierState("modifier-isRandomSpawn"),isCrowded:this.getModifierState("modifier-isCrowded"),isHardNations:this.getModifierState("modifier-isHardNations"),isAlliancesDisabled:this.getModifierState("modifier-isAlliancesDisabled"),isPortsDisabled:this.getModifierState("modifier-isPortsDisabled"),isNukesDisabled:this.getModifierState("modifier-isNukesDisabled"),isSAMsDisabled:this.getModifierState("modifier-isSAMsDisabled"),isPeaceTime:this.getModifierState("modifier-isPeaceTime"),isWaterNukes:this.getModifierState("modifier-isWaterNukes"),startingGold:this.getNumericModifierState({1e6:"modifier-startingGold-1000000",5e6:"modifier-startingGold-5000000",25e6:"modifier-startingGold-25000000"}),goldMultiplier:this.getNumericModifierState({2:"modifier-goldMultiplier-2"})}}getAllTeamCountValues(){let e=[];for(let t of R){let i=document.getElementById(t);if(!i?.checked)continue;let o=i.value;if(o==="Duos"||o==="Trios"||o==="Quads"||o==="Humans Vs Nations")e.push(o);else{let s=parseInt(o,10);Number.isNaN(s)||e.push(s)}}return e}applyAutoTeamMin(){let e=le.filter(([i,,o])=>o!==null&&document.getElementById(i)?.checked).map(([,,i])=>i);if(e.length===0)return;let t=Math.min(...e);this.teamSlider?.setMin(t)}setAllTeamCounts(e){for(let t of R){let i=document.getElementById(t);i&&(i.checked=e,this.syncChipState(t))}}syncChipState(e){let t=document.getElementById(e);if(!t)return;let i=t.closest(".ld-chip, .ld-mode-btn, .ld-2x");i&&(i.classList.toggle("is-on",t.checked),i.setAttribute("aria-pressed",String(t.checked)))}buildCriteriaFromUI(){let e=this.getModifierFiltersFromUI(),t=[];if(document.getElementById("discovery-ffa")?.checked&&t.push({gameMode:"FFA",teamCount:null,minPlayers:this.getNumberValue("discovery-ffa-min"),maxPlayers:this.getNumberValue("discovery-ffa-max"),modifiers:e}),!document.getElementById("discovery-team")?.checked)return t;let s=this.getAllTeamCountValues();if(s.length===0)return t.push({gameMode:"Team",teamCount:null,minPlayers:this.getNumberValue("discovery-team-min"),maxPlayers:this.getNumberValue("discovery-team-max"),modifiers:e}),t;for(let a of s)t.push({gameMode:"Team",teamCount:a,minPlayers:this.getNumberValue("discovery-team-min"),maxPlayers:this.getNumberValue("discovery-team-max"),modifiers:e});return t}updateFilterCount(){let e=document.getElementById("discovery-filter-count"),t=document.getElementById("discovery-filter-word");if(!e||!t)return;let i=document.getElementById("discovery-ffa")?.checked,o=document.getElementById("discovery-team")?.checked,s=R.filter(l=>document.getElementById(l)?.checked).length,a=[...Y,...$.map(l=>`modifier-startingGold-${l}`),...F.map(l=>`modifier-goldMultiplier-${l}`)].filter(l=>this.getModifierState(l)!=="any").length,r=(i?1:0)+(o?1:0)+s+a;e.textContent=String(r),t.textContent=r===1?"filter":"filters"}setModePanelActive(e,t){let i=document.getElementById(e);i&&i.classList.toggle("is-off",!t)}setIconButtonState(e,t){let i=document.getElementById(e)?.closest(".ld-icon-btn");i&&i.classList.toggle("is-on",t)}loadUIFromSettings(){let e=this.criteriaList.find(d=>d.gameMode==="FFA"),t=this.criteriaList.filter(d=>d.gameMode==="Team"),i=document.getElementById("discovery-ffa"),o=document.getElementById("discovery-team");if(i&&(i.checked=!!e,this.syncChipState("discovery-ffa"),this.setModePanelActive("discovery-ffa-config",!!e)),o&&(o.checked=t.length>0,this.syncChipState("discovery-team"),this.setModePanelActive("discovery-team-config",t.length>0)),e){let d=document.getElementById("discovery-ffa-min"),m=document.getElementById("discovery-ffa-max");d&&e.minPlayers!==null&&(d.value=String(e.minPlayers)),m&&e.maxPlayers!==null&&(m.value=String(e.maxPlayers))}if(t[0]){let d=document.getElementById("discovery-team-min"),m=document.getElementById("discovery-team-max");d&&t[0].minPlayers!==null&&(d.value=String(t[0].minPlayers)),m&&t[0].maxPlayers!==null&&(m.value=String(t[0].maxPlayers)),this.setTeamCountSelections(t.map(h=>h.teamCount))}let s=(e??t[0])?.modifiers;if(s){this.setModifierState("modifier-isCompact",s.isCompact??"any"),this.setModifierState("modifier-isRandomSpawn",s.isRandomSpawn??"any"),this.setModifierState("modifier-isCrowded",s.isCrowded??"any"),this.setModifierState("modifier-isHardNations",s.isHardNations??"any"),this.setModifierState("modifier-isAlliancesDisabled",s.isAlliancesDisabled??"any"),this.setModifierState("modifier-isPortsDisabled",s.isPortsDisabled??"any"),this.setModifierState("modifier-isNukesDisabled",s.isNukesDisabled??"any"),this.setModifierState("modifier-isSAMsDisabled",s.isSAMsDisabled??"any"),this.setModifierState("modifier-isPeaceTime",s.isPeaceTime??"any"),this.setModifierState("modifier-isWaterNukes",s.isWaterNukes??"any");for(let d of $)this.setModifierState(`modifier-startingGold-${d}`,s.startingGold?.[d]??"any");for(let d of F)this.setModifierState(`modifier-goldMultiplier-${d}`,s.goldMultiplier?.[d]??"any")}let a=document.getElementById("discovery-sound-toggle");a&&(a.checked=this.soundEnabled,this.setIconButtonState("discovery-sound-toggle",this.soundEnabled));let r=document.getElementById("discovery-desktop-toggle");r&&(r.checked=this.desktopNotificationsEnabled,this.setIconButtonState("discovery-desktop-toggle",this.desktopNotificationsEnabled));let l=document.getElementById("discovery-team-two-times");l&&(l.checked=this.isTeamTwoTimesMinEnabled,this.syncChipState("discovery-team-two-times")),this.updateFilterCount(),this.updateStatusLabel()}setTeamCountSelections(e){for(let t of e){let i=null;t==="Duos"?i=document.getElementById("discovery-team-duos"):t==="Trios"?i=document.getElementById("discovery-team-trios"):t==="Quads"?i=document.getElementById("discovery-team-quads"):t==="Humans Vs Nations"?i=document.getElementById("discovery-team-hvn"):typeof t=="number"&&(i=document.getElementById(`discovery-team-${t}`)),i&&(i.checked=!0,this.syncChipState(i.id))}}refreshCriteria(){this.criteriaList=this.buildCriteriaFromUI(),this.saveSettings(),this.updateFilterCount(),this.syncSearchTimer({resetStart:!0})}resetAll(){let e=document.getElementById("discovery-ffa"),t=document.getElementById("discovery-team");e&&(e.checked=!1,this.syncChipState("discovery-ffa"),this.setModePanelActive("discovery-ffa-config",!1)),t&&(t.checked=!1,this.syncChipState("discovery-team"),this.setModePanelActive("discovery-team-config",!1)),this.setAllTeamCounts(!1);let i=document.getElementById("discovery-team-two-times");i&&(i.checked=!1,this.syncChipState("discovery-team-two-times"),this.isTeamTwoTimesMinEnabled=!1);for(let o of Y)this.setModifierState(o,"any");for(let o of $)this.setModifierState(`modifier-startingGold-${o}`,"any");for(let o of F)this.setModifierState(`modifier-goldMultiplier-${o}`,"any");this.ffaSlider?.setRange(1,125),this.teamSlider?.setRange(y,U),this.teamSlider?.applyLockState(),this.refreshCriteria()}async handleDesktopNotificationToggleChange(e){let t=++this.desktopNotificationRequestId;if(!e.checked){this.desktopNotificationsEnabled=!1,this.setIconButtonState("discovery-desktop-toggle",!1),this.saveSettings();return}let i=await V.ensurePermission();t!==this.desktopNotificationRequestId||this.isDisposed||!e.isConnected||!e.checked||(this.desktopNotificationsEnabled=i,e.checked=i,e.toggleAttribute("checked",i),this.setIconButtonState("discovery-desktop-toggle",i),this.saveSettings())}setupEventListeners(){document.getElementById("discovery-status")?.addEventListener("click",()=>{this.setDiscoveryEnabled(!this.discoveryEnabled,{resetTimer:!0})});for(let[i,o]of[["discovery-ffa","discovery-ffa-config"],["discovery-team","discovery-team-config"]]){let s=document.getElementById(i);s?.addEventListener("change",()=>{this.syncChipState(i),this.setModePanelActive(o,s.checked),this.refreshCriteria()})}let e=document.getElementById("discovery-team-two-times");e?.addEventListener("change",()=>{this.isTeamTwoTimesMinEnabled=e.checked,this.syncChipState("discovery-team-two-times"),this.teamSlider?.applyLockState(),this.refreshCriteria()}),document.getElementById("discovery-team-select-all")?.addEventListener("click",()=>{this.setAllTeamCounts(!0),this.refreshCriteria()}),document.getElementById("discovery-team-deselect-all")?.addEventListener("click",()=>{this.setAllTeamCounts(!1),this.refreshCriteria()}),document.getElementById("discovery-reset")?.addEventListener("click",()=>{this.resetAll()});for(let i of[...R,"discovery-sound-toggle","discovery-desktop-toggle"]){let o=document.getElementById(i);o&&o.addEventListener("change",()=>{if(i==="discovery-sound-toggle"){this.soundEnabled=o.checked,this.setIconButtonState("discovery-sound-toggle",o.checked),this.saveSettings();return}if(i==="discovery-desktop-toggle"){this.handleDesktopNotificationToggleChange(o);return}this.syncChipState(i),(i==="discovery-team-duos"||i==="discovery-team-trios"||i==="discovery-team-quads")&&this.applyAutoTeamMin(),this.refreshCriteria()})}let t=[...Y,...$.map(i=>`modifier-startingGold-${i}`),...F.map(i=>`modifier-goldMultiplier-${i}`)];for(let i of t)document.getElementById(i)?.addEventListener("click",()=>{this.cycleModifierState(i),this.refreshCriteria()})}renderModeButton(e,t){return`
      <label class="ld-mode-btn" aria-pressed="false">
        <input type="checkbox" id="${e}" value="${e==="discovery-ffa"?"FFA":"Team"}">
        <span class="check">${K}</span>
        <span>${t}</span>
      </label>
    `}renderChip(e,t,i){return`
      <label class="ld-chip" aria-pressed="false">
        <input type="checkbox" id="${e}" value="${t}">${i}
      </label>
    `}renderModifierChip(e,t){return`
      <button type="button" class="ld-mod" id="${e}" data-state="any" data-mod-name="${t}" aria-pressed="false" aria-label="${t}">
        <span class="ld-mod-ind"></span>
        <span class="ld-mod-name">${t}</span>
      </button>
    `}renderIconButton(e,t,i){return`
      <label class="ld-icon-btn" title="${t}" aria-label="${t}">
        <input type="checkbox" id="${e}">${i}
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
          ${this.renderIconButton("discovery-sound-toggle","Sound alert",ve)}
          ${this.renderIconButton("discovery-desktop-toggle","Desktop notification",xe)}
        </div>
      </div>
      <div class="ld-head">
        <div class="ld-eyebrow">Notify only \xB7 never auto-joins</div>
        <h2 class="ld-title">OpenFront Game Notifier</h2>
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
                  <span>Players</span>
                  <span class="val">
                    <div class="ld-stepper" data-role="min">
                      <button type="button" class="ld-step-btn" data-action="dec" data-target="min" aria-label="Decrease minimum">\u2212</button>
                      <input type="number" id="discovery-ffa-min" min="1" max="125" value="1" inputmode="numeric">
                      <button type="button" class="ld-step-btn" data-action="inc" data-target="min" aria-label="Increase minimum">+</button>
                    </div>
                    <span class="sep">\u2013</span>
                    <div class="ld-stepper" data-role="max">
                      <button type="button" class="ld-step-btn" data-action="dec" data-target="max" aria-label="Decrease maximum">\u2212</button>
                      <input type="number" id="discovery-ffa-max" min="1" max="125" value="125" inputmode="numeric">
                      <button type="button" class="ld-step-btn" data-action="inc" data-target="max" aria-label="Increase maximum">+</button>
                    </div>
                  </span>
                </div>
                <div class="ld-range" id="discovery-ffa-range-root">
                  <div class="track"><div class="track-fill" id="discovery-ffa-range-fill"></div></div>
                  <input type="range" id="discovery-ffa-min-slider" min="0" max="1000" value="0" class="capacity-slider capacity-slider-min">
                  <input type="range" id="discovery-ffa-max-slider" min="0" max="1000" value="1000" class="capacity-slider capacity-slider-max">
                </div>
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
                    <div class="ld-stepper" data-role="min">
                      <button type="button" class="ld-step-btn" data-action="dec" data-target="min" aria-label="Decrease minimum">\u2212</button>
                      <input type="number" id="discovery-team-min" min="2" max="62" value="2" inputmode="numeric">
                      <button type="button" class="ld-step-btn" data-action="inc" data-target="min" aria-label="Increase minimum">+</button>
                    </div>
                    <span class="sep">\u2013</span>
                    <div class="ld-stepper" data-role="max">
                      <button type="button" class="ld-step-btn" data-action="dec" data-target="max" aria-label="Decrease maximum">\u2212</button>
                      <input type="number" id="discovery-team-max" min="2" max="62" value="62" inputmode="numeric">
                      <button type="button" class="ld-step-btn" data-action="inc" data-target="max" aria-label="Increase maximum">+</button>
                    </div>
                  </span>
                </div>
                <div class="ld-range" id="discovery-team-range-root">
                  <div class="track"><div class="track-fill" id="discovery-team-range-fill"></div></div>
                  <input type="range" id="discovery-team-min-slider" min="0" max="1000" value="0" class="capacity-slider capacity-slider-min">
                  <input type="range" id="discovery-team-max-slider" min="0" max="1000" value="1000" class="capacity-slider capacity-slider-max">
                </div>
                <div class="ld-ticks" id="discovery-team-ticks"></div>
              </div>
              <label class="ld-2x" aria-pressed="false">
                <input type="checkbox" id="discovery-team-two-times">
                <span class="check">${K}</span>
                <span class="lbl"><strong>Lock max-per-team to 2\xD7 the min</strong></span>
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
                <span class="key"><span class="swatch blk"></span>Excl</span>
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
              Click to cycle <strong>Any</strong> \u2192 <strong class="req">Required</strong> \u2192 <strong class="blk">Excluded</strong>.
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
    `,document.body.appendChild(this.panel),this.setupEventListeners(),this.loadUIFromSettings(),this.ffaSlider=new E({rootId:"discovery-ffa-range-root",minSliderId:"discovery-ffa-min-slider",maxSliderId:"discovery-ffa-max-slider",minInputId:"discovery-ffa-min",maxInputId:"discovery-ffa-max",fillId:"discovery-ffa-range-fill",bounds:{min:1,max:125},onChange:()=>this.refreshCriteria()}),this.teamSlider=new E({rootId:"discovery-team-range-root",minSliderId:"discovery-team-min-slider",maxSliderId:"discovery-team-max-slider",minInputId:"discovery-team-min",maxInputId:"discovery-team-max",fillId:"discovery-team-range-fill",ticksContainerId:"discovery-team-ticks",bounds:{min:y,max:U},stops:Z,lockMaxToTwiceMin:()=>this.isTeamTwoTimesMinEnabled,onChange:()=>this.refreshCriteria()}),this.updateStatusLabel(),this.updateFilterCount(),this.syncSearchTimer(),this.startGameInfoUpdates())}updateSleepState(){let e=A.isOnLobbyPage();this.sleeping=!e,this.sleeping?(this.panel.classList.add("hidden"),this.stopTimer(),this.stopGameInfoUpdates(),this.updateQueueCardPulses(new Set)):(this.panel.classList.remove("hidden"),this.syncSearchTimer(),this.startGameInfoUpdates())}cleanup(){this.isDisposed=!0,this.stopTimer(),this.stopGameInfoUpdates(),this.pulseSyncTimeout&&(clearTimeout(this.pulseSyncTimeout),this.pulseSyncTimeout=null),this.activeMatchSources.clear(),this.applyQueueCardPulses(),this.panel.parentNode?.removeChild(this.panel)}};var _=class{constructor(){this.observer=null;this.animationFrameId=null}start(){this.observer||(this.observer=new MutationObserver(()=>this.scheduleApplyHighlights()),this.observer.observe(document.body,{attributes:!1,childList:!0,subtree:!0}),this.applyHighlights())}stop(){this.observer?.disconnect(),this.observer=null,this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}scheduleApplyHighlights(){this.animationFrameId===null&&(this.animationFrameId=requestAnimationFrame(()=>{this.animationFrameId=null,this.applyHighlights()}))}applyHighlights(){for(let e of Array.from(document.querySelectorAll("lobby-player-view")))this.applyHighlightToView(e)}applyHighlightToView(e){this.clearHighlights(e);let t=Array.from(e.querySelectorAll(".player-tag.current-player"));if(t.length>0){t.forEach(s=>s.classList.add("of-current-player-boost"));return}let i=this.getNativeTeamRows(e);i.forEach(s=>s.classList.add("of-current-player-boost"));let o=this.getNativeTeamCards(e);o.forEach(s=>s.classList.add("of-current-player-team-boost")),!(i.length>0||o.length>0)&&this.applyFallbackHighlight(e)}clearHighlights(e){e.querySelectorAll(".of-current-player-boost").forEach(t=>{t.classList.remove("of-current-player-boost")}),e.querySelectorAll(".of-current-player-team-boost").forEach(t=>{t.classList.remove("of-current-player-team-boost")})}getNativeTeamRows(e){return Array.from(e.querySelectorAll("div")).filter(t=>{let i=t.classList;return i.contains("bg-sky-600/20")&&i.contains("border-sky-500/40")})}getNativeTeamCards(e){return Array.from(e.querySelectorAll("div")).filter(t=>{let i=t.classList;return i.contains("rounded-xl")&&i.contains("border-sky-500/60")})}applyFallbackHighlight(e){let t=e.currentClientID,i=Array.isArray(e.clients)?e.clients:[];if(!t||i.length===0)return;let o=i.findIndex(p=>p?.clientID===t);if(o<0)return;let s=i[o],a=this.formatDisplayName(s),r=Array.from(e.querySelectorAll(".player-tag"));if(r[o]){r[o].classList.add("of-current-player-boost");return}Array.from(e.querySelectorAll("[data-client-id]")).filter(p=>p.dataset.clientId===t).forEach(p=>p.classList.add("of-current-player-boost")),this.findRowsByDisplayName(e,a).forEach(p=>p.classList.add("of-current-player-boost"));let m=Array.from(e.querySelectorAll(".rounded-xl")),I=(Array.isArray(e.teamPreview)?e.teamPreview:[]).filter(p=>Array.isArray(p.players)&&p.players.length>0).findIndex(p=>Array.isArray(p.players)&&p.players.some(G=>G?.clientID===t));I>=0&&m[I]&&(m[I].classList.add("of-current-player-team-boost"),this.findRowsByDisplayName(m[I],a).forEach(G=>G.classList.add("of-current-player-boost")))}formatDisplayName(e){return e?.username?e.clanTag?`[${e.clanTag}] ${e.username}`:e.username:""}findRowsByDisplayName(e,t){if(!t)return[];let i=[];for(let o of Array.from(e.querySelectorAll("span, div"))){let s=o.textContent?.trim();if(!s||s!==t)continue;let a=o.closest("[data-client-id]")??o.closest(".player-tag")??o.closest(".team-player-row")??o.closest("div");a&&!i.includes(a)&&i.push(a)}return i}};(function(){"use strict";console.log("[OpenFront Game Notifier] Initializing adaptation for OpenFront 0.30..."),GM_addStyle(ee()),L.preloadSounds(),k.init(),q.start();let n=new B,e=new _;q.subscribe(o=>{n.receiveLobbyUpdate(o)}),e.start();let t=o=>{try{return new URL(o).searchParams.has("live")}catch{return!1}},i=t(location.href);k.subscribe(o=>{let s=t(o);!i&&s&&n.isSoundEnabled()&&L.playGameStartSound(),i=s}),console.log("[OpenFront Game Notifier] Ready! \u{1F680}")})();})();
