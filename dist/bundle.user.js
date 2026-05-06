// ==UserScript==
// @name         OpenFront Game Notifier
// @namespace    https://openfront.io/
// @version      2.10.8
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

"use strict";(()=>{var u={bgPrimary:"#0d0f10",bgSecondary:"#14171a",bgElevated:"#1a1e22",bgRaised:"#20252a",bgHover:"rgba(255,255,255,0.04)",textPrimary:"#f2f1ee",textSecondary:"#c8c6c0",textMuted:"#8e8c85",textFaint:"#5a5853",border:"rgba(255,255,255,0.06)",borderSubtle:"rgba(255,255,255,0.10)",borderStrong:"rgba(255,255,255,0.16)",accent:"#7aa7d4",accentSoft:"rgba(122,167,212,0.14)",accentLine:"rgba(122,167,212,0.32)",accentShadow:"122,167,212",warning:"#d4a056",warningSoft:"rgba(212,160,86,0.14)",danger:"#d27a6b",dangerSoft:"rgba(210,122,107,0.14)",dangerLine:"rgba(210,122,107,0.30)",accentMuted:"rgba(122,167,212,0.14)",accentHover:"#9bbfe0",accentAlt:"#9bbfe0",borderAccent:"rgba(122,167,212,0.32)",highlight:"rgba(122,167,212,0.20)",success:"#74c69d",successSolid:"#74c69d",error:"#d27a6b"},f={body:"'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",display:"'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",mono:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"};var O={sm:"6px",md:"7px",lg:"10px",xl:"14px"},C={sm:"0 1px 3px rgba(0,0,0,0.4)",md:"0 2px 8px rgba(0,0,0,0.3)",lg:"0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)"},c={fast:"0.12s",normal:"0.2s",slow:"0.3s"};var K={threadCount:20,lobbyPollingRate:1e3},w={lobbyDiscoverySettings:"OF_LOBBY_DISCOVERY_SETTINGS"},J={panel:9998,panelOverlay:9999,modal:1e4,notification:2e4},X=[2,3,4,5,6,8,10,15,20,30,62],y=2,U=62;function Z(){return`
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
      z-index: ${J.panel};
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
  `}var L={gameFoundAudio:null,gameStartAudio:null,audioUnlocked:!1,preloadSounds(){try{this.gameFoundAudio=new Audio("https://github.com/DeLoWaN/openfront-autojoin-lobby/raw/refs/heads/main/notification_sounds/new-notification-014-363678.mp3"),this.gameFoundAudio.volume=.5,this.gameFoundAudio.preload="auto",this.gameStartAudio=new Audio("https://github.com/DeLoWaN/openfront-autojoin-lobby/raw/refs/heads/main/notification_sounds/opening-bell-421471.mp3"),this.gameStartAudio.volume=.5,this.gameStartAudio.preload="auto",this.setupAudioUnlock()}catch(i){console.warn("[SoundUtils] Could not preload audio:",i)}},setupAudioUnlock(){let i=()=>{if(this.audioUnlocked)return;let e=[];this.gameFoundAudio&&(this.gameFoundAudio.volume=.01,e.push(this.gameFoundAudio.play().then(()=>{this.gameFoundAudio&&(this.gameFoundAudio.pause(),this.gameFoundAudio.currentTime=0,this.gameFoundAudio.volume=.5)}).catch(()=>{}))),this.gameStartAudio&&(this.gameStartAudio.volume=.01,e.push(this.gameStartAudio.play().then(()=>{this.gameStartAudio&&(this.gameStartAudio.pause(),this.gameStartAudio.currentTime=0,this.gameStartAudio.volume=.5)}).catch(()=>{}))),Promise.all(e).then(()=>{this.audioUnlocked=!0,console.log("[SoundUtils] Audio unlocked successfully"),document.removeEventListener("click",i),document.removeEventListener("keydown",i),document.removeEventListener("touchstart",i)})};document.addEventListener("click",i,{once:!0}),document.addEventListener("keydown",i,{once:!0}),document.addEventListener("touchstart",i,{once:!0})},playGameFoundSound(){this.gameFoundAudio?(console.log("[SoundUtils] Attempting to play game found sound"),this.gameFoundAudio.currentTime=0,this.gameFoundAudio.play().catch(i=>{console.warn("[SoundUtils] Failed to play game found sound:",i)})):console.warn("[SoundUtils] Game found audio not initialized")},playGameStartSound(){this.gameStartAudio?(console.log("[SoundUtils] Attempting to play game start sound"),this.gameStartAudio.currentTime=0,this.gameStartAudio.play().catch(i=>{console.warn("[SoundUtils] Failed to play game start sound:",i)})):console.warn("[SoundUtils] Game start audio not initialized")}};var k={callbacks:[],lastUrl:location.href,initialized:!1,init(){if(this.initialized)return;this.initialized=!0;let i=()=>{location.href!==this.lastUrl&&(this.lastUrl=location.href,this.notify())};window.addEventListener("popstate",i),window.addEventListener("hashchange",i);let e=history.pushState,t=history.replaceState;history.pushState=function(...n){e.apply(history,n),setTimeout(i,0)},history.replaceState=function(...n){t.apply(history,n),setTimeout(i,0)},setInterval(i,200)},subscribe(i){this.callbacks.push(i),this.init()},notify(){this.callbacks.forEach(i=>i(location.href))}};var V={subscribers:[],fallbackInterval:null,fallbackStartTimeout:null,lastLobbies:[],pollingRate:K.lobbyPollingRate,started:!1,publicLobbiesListener:null,start(){this.started||(this.started=!0,this.publicLobbiesListener=i=>this.handlePublicLobbiesUpdate(i),document.addEventListener("public-lobbies-update",this.publicLobbiesListener),this.scheduleFallbackPolling())},stop(){this.started&&(this.started=!1,this.publicLobbiesListener&&(document.removeEventListener("public-lobbies-update",this.publicLobbiesListener),this.publicLobbiesListener=null),this.fallbackStartTimeout&&(clearTimeout(this.fallbackStartTimeout),this.fallbackStartTimeout=null),this.stopFallbackPolling())},subscribe(i){this.subscribers.push(i),this.lastLobbies.length>0&&i(this.lastLobbies)},scheduleFallbackPolling(){!this.started||this.fallbackInterval||this.fallbackStartTimeout||(this.fallbackStartTimeout=setTimeout(()=>{this.fallbackStartTimeout=null,this.startFallbackPolling()},this.pollingRate*2))},startFallbackPolling(){this.fallbackInterval||(this.fetchData(),this.fallbackInterval=setInterval(()=>void this.fetchData(),this.pollingRate))},stopFallbackPolling(){this.fallbackInterval&&(clearInterval(this.fallbackInterval),this.fallbackInterval=null)},async fetchData(){if(!(location.pathname!=="/"&&!location.pathname.startsWith("/public-lobby")))try{let i=await fetch("/api/public_lobbies");if(i.status===429){console.warn("[Bundle] Rate limited.");return}if(!i.ok){console.warn(`[Bundle] API error: ${i.status}`);return}let e=await i.json();this.lastLobbies=this.extractLobbies(e),this.notifySubscribers()}catch(i){console.error("[Bundle] API Error:",i)}},notifySubscribers(){this.subscribers.forEach(i=>i(this.lastLobbies))},handlePublicLobbiesUpdate(i){this.fallbackStartTimeout&&(clearTimeout(this.fallbackStartTimeout),this.fallbackStartTimeout=null),this.stopFallbackPolling();let e=i.detail?.payload;this.lastLobbies=this.extractLobbies(e),this.notifySubscribers(),this.scheduleFallbackPolling()},extractLobbies(i){if(!i||typeof i!="object")return[];if(Array.isArray(i.lobbies))return i.lobbies;let e=i.games;return e?["ffa","team","special"].flatMap(t=>(e[t]??[]).map(n=>({...n,publicGameType:n.publicGameType??t}))):[]}};var A={lastActionTime:0,debounceDelay:800,getLobbyButton(){return document.querySelector("public-lobby")?.querySelector("button.group.relative.isolate")},canJoinLobby(){let i=document.querySelector("public-lobby");if(!i)return!1;let e=this.getLobbyButton();return!!(e&&!i.isLobbyHighlighted&&i.lobbies&&i.lobbies.length>0&&!e.disabled&&e.offsetParent!==null)},verifyState(i){let e=document.querySelector("public-lobby");if(!e)return!1;let t=this.getLobbyButton();return!t||t.disabled||t.offsetParent===null?!1:i==="in"?e.isLobbyHighlighted===!0:i==="out"?!!(!e.isLobbyHighlighted&&e.lobbies&&e.lobbies.length>0):!1},tryJoinLobby(){let i=Date.now();if(i-this.lastActionTime<this.debounceDelay)return!1;let e=this.getLobbyButton(),t=document.querySelector("public-lobby");return e&&t&&!t.isLobbyHighlighted&&t.lobbies&&t.lobbies.length>0&&!e.disabled&&e.offsetParent!==null?(this.lastActionTime=i,e.click(),setTimeout(()=>{this.verifyState("in")||console.warn("[LobbyUtils] Join may have failed, state not updated")},100),!0):!1},isOnLobbyPage(){let i=document.getElementById("page-game");if(i&&!i.classList.contains("hidden"))return!1;let e=document.querySelector("canvas");if(e&&e.offsetParent!==null){let a=e.getBoundingClientRect();if(a.width>100&&a.height>100)return!1}let t=document.querySelector("public-lobby");if(t&&t.offsetParent!==null)return!0;if(t&&t.offsetParent===null)return!1;let n=document.getElementById("page-play");if(n&&!n.classList.contains("hidden")&&t)return!0;let o=window.location.pathname.replace(/\/+$/,"")||"/";return o==="/"||o==="/public-lobby"}};var q={isSupported(){return typeof Notification<"u"},isBackgrounded(){let i=document.visibilityState==="hidden"||document.hidden,e=typeof document.hasFocus=="function"?document.hasFocus():!0;return i||!e},async ensurePermission(){if(typeof Notification>"u")return!1;if(Notification.permission==="granted")return!0;if(Notification.permission==="denied")return!1;try{return await Notification.requestPermission()==="granted"}catch(i){return console.warn("[BrowserNotificationUtils] Permission request failed:",i),!1}},show(i){if(!this.isSupported()||!this.isBackgrounded())return!1;if(Notification.permission==="granted"){let e=new Notification(i.title,{body:i.body});return e.onclick=()=>{this.focusWindow(),e.close()},!0}return!1},focusWindow(){window.focus()}};var re="any";function ie(i){if(!i)return null;let e=i.toLowerCase().trim();return e==="free for all"||e==="ffa"||e==="free-for-all"?"FFA":e==="team"||e==="teams"?"Team":null}function v(i){return ie(i.gameConfig?.gameMode)}function ne(i){let e=i.publicGameType?.toLowerCase().trim();return e==="ffa"||e==="team"||e==="special"?e:null}function z(i){if(i==="Duos"||i==="Trios"||i==="Quads"||i==="Humans Vs Nations"||typeof i=="number"&&Number.isFinite(i)&&i>0)return i;if(typeof i=="string"){let e=parseInt(i,10);if(!Number.isNaN(e)&&e>0)return e}return null}function T(i){let e=i.gameConfig;if(!e||v(i)!=="Team")return null;let t=z(e.playerTeams??null);return t!==null?t:z(e.teamCount??e.teams??null)}function N(i){let e=i.gameConfig;return e?e.maxPlayers??e.maxClients??e.maxPlayersPerGame??i.maxClients??null:null}function P(i,e){return!i||!e?null:i==="Duos"?2:i==="Trios"?3:i==="Quads"?4:i==="Humans Vs Nations"?e:typeof i=="number"&&i>0?Math.floor(e/i):null}function D(i,e){let t=i.gameConfig?.publicGameModifiers;switch(e){case"isCompact":return t?.isCompact;case"isRandomSpawn":return t?.isRandomSpawn;case"isCrowded":return t?.isCrowded;case"isHardNations":return t?.isHardNations;case"isAlliancesDisabled":return t?.isAlliancesDisabled;case"isPortsDisabled":return t?.isPortsDisabled;case"isNukesDisabled":return t?.isNukesDisabled;case"isSAMsDisabled":return t?.isSAMsDisabled;case"isPeaceTime":return t?.isPeaceTime;case"isWaterNukes":return t?.isWaterNukes;case"startingGold":return t?.startingGold??i.gameConfig?.startingGold??void 0;case"goldMultiplier":return t?.goldMultiplier??i.gameConfig?.goldMultiplier??void 0;default:return}}function oe(i){let e=v(i),t=T(i),n=N(i);if(e==="FFA")return n!==null?`FFA \u2022 ${n} slots`:"FFA";if(e!=="Team")return"Unsupported mode";if(t==="Humans Vs Nations")return n!==null?`Humans Vs Nations (${n})`:"Humans Vs Nations";if(t==="Duos")return"Duos";if(t==="Trios")return"Trios";if(t==="Quads")return"Quads";if(typeof t=="number"&&n!==null){let o=P(t,n);return o!==null?`${t} teams (${o} per team)`:`${t} teams`}return"Team"}function le(i){let e=v(i),t=T(i);return e==="FFA"?"FFA":e!=="Team"?"Unsupported mode":t==="Humans Vs Nations"?"Humans Vs Nations":t==="Duos"||t==="Trios"||t==="Quads"?t:typeof t=="number"?`${t} teams`:"Team"}function de(i){return i>=1e6&&i%1e6===0?`${i/1e6}M`:i>=1e3&&i%1e3===0?`${i/1e3}K`:String(i)}function ce(i){let e=i.gameConfig?.publicGameModifiers,t=[];e?.isCompact&&t.push("Compact"),e?.isRandomSpawn&&t.push("Random"),e?.isCrowded&&t.push("Crowded"),e?.isHardNations&&t.push("Hard");let n=e?.startingGold??i.gameConfig?.startingGold;typeof n=="number"&&t.push(de(n));let o=e?.goldMultiplier??i.gameConfig?.goldMultiplier;return typeof o=="number"&&t.push(`x${o}`),e?.isAlliancesDisabled&&t.push("No Alliances"),e?.isPortsDisabled&&t.push("No Ports"),e?.isNukesDisabled&&t.push("No Nukes"),e?.isSAMsDisabled&&t.push("No SAMs"),e?.isPeaceTime&&t.push("Peace"),e?.isWaterNukes&&t.push("Water Nukes"),t}function ae(i){let e=[],t=i.gameConfig?.gameMap?.trim(),n=N(i),o=T(i),a=le(i);if(t&&e.push(t),v(i)==="Team"&&o!=="Humans Vs Nations"){e.push(a);let l=P(o,n);l!==null&&e.push(`${l}/team`)}else e.push(a);let s=[];n!==null&&s.push(`${n} slots`);let r=ce(i);return r.length>0&&s.push(r.join(", ")),{title:e.join(" \u2022 "),body:s.join(" \u2022 ")}}function ee(i){return typeof i=="number"&&Number.isFinite(i)?i:null}function b(i){return i==="blocked"||i==="rejected"?"blocked":i==="required"?"required":i==="any"||i==="allowed"||i==="indifferent"?"any":re}function te(i){if(!i||typeof i!="object")return;let e={};for(let[t,n]of Object.entries(i)){let o=Number(t);Number.isFinite(o)&&(e[o]=b(n))}return Object.keys(e).length>0?e:void 0}function ue(i){if(!i||typeof i!="object")return;let e=i;return{isCompact:b(e.isCompact),isRandomSpawn:b(e.isRandomSpawn),isCrowded:b(e.isCrowded),isHardNations:b(e.isHardNations),isAlliancesDisabled:b(e.isAlliancesDisabled),isPortsDisabled:b(e.isPortsDisabled),isNukesDisabled:b(e.isNukesDisabled),isSAMsDisabled:b(e.isSAMsDisabled),isPeaceTime:b(e.isPeaceTime),isWaterNukes:b(e.isWaterNukes),startingGold:te(e.startingGold),goldMultiplier:te(e.goldMultiplier)}}function me(i){let e=z(i);return e==="Duos"||e==="Trios"||e==="Quads"?null:e}function pe(i){if(!Array.isArray(i))return[];let e=[];for(let t of i){let n=t,o=ie(n.gameMode??null);if(!o)continue;let a=ee(n.minPlayers),s=ee(n.maxPlayers);o==="Team"&&(typeof a=="number"&&a<y&&(a=y),typeof a=="number"&&typeof s=="number"&&s<a&&(s=a)),e.push({gameMode:o,teamCount:o==="Team"?me(n.teamCount??null):null,minPlayers:a,maxPlayers:s,modifiers:ue(n.modifiers)})}return e}function Q(i,e=Date.now()){let t=Math.max(0,Math.floor((e-i)/1e3));return`${Math.floor(t/60)}m ${t%60}s`}function se(i){return{criteria:pe(i?.criteria),discoveryEnabled:typeof i?.discoveryEnabled=="boolean"?i.discoveryEnabled:!0,soundEnabled:typeof i?.soundEnabled=="boolean"?i.soundEnabled:!0,desktopNotificationsEnabled:typeof i?.desktopNotificationsEnabled=="boolean"?i.desktopNotificationsEnabled:!1,isTeamTwoTimesMinEnabled:typeof i?.isTeamTwoTimesMinEnabled=="boolean"?i.isTeamTwoTimesMinEnabled:!!i?.isTeamThreeTimesMinEnabled}}var fe=["isCompact","isRandomSpawn","isCrowded","isHardNations","isAlliancesDisabled","isPortsDisabled","isNukesDisabled","isSAMsDisabled","isPeaceTime","isWaterNukes"],F=class{matchesCriteria(e,t){if(!e||!e.gameConfig||!t||t.length===0)return!1;let n=v(e),o=N(e);if(!n||o===null)return!1;let a=T(e),s=n==="Team"?P(a,o):null;for(let r of t){if(r.gameMode!==n||n==="Team"&&(r.teamCount!==null&&r.teamCount!==void 0&&r.teamCount!==a||s===null))continue;let l=n==="Team"?s:o;if(l!==null&&!(r.minPlayers!==null&&l<r.minPlayers)&&!(r.maxPlayers!==null&&l>r.maxPlayers)&&this.matchesModifiers(e,r.modifiers))return!0}return!1}matchesModifiers(e,t){if(!t)return!0;for(let n of fe){let o=t[n];if(!o||o==="any")continue;let a=!!D(e,n);if(o==="blocked"&&a||o==="required"&&!a)return!1}return!(!this.matchesNumericModifier(D(e,"startingGold"),t.startingGold)||!this.matchesNumericModifier(D(e,"goldMultiplier"),t.goldMultiplier))}matchesNumericModifier(e,t){if(!t)return!0;let n=typeof e=="number"&&Number.isFinite(e)?e:null,o=Object.entries(t);if(o.length===0)return!0;let a=o.filter(([,r])=>r==="blocked").map(([r])=>Number(r));if(n!==null&&a.includes(n))return!1;let s=o.filter(([,r])=>r==="required").map(([r])=>Number(r));return!(s.length>0&&(n===null||!s.includes(n)))}};function g(i,e){if(e.length===0)return i;let t=e[0],n=e[e.length-1];return i<t?t:i>n?n:i}function x(i,e){if(e.length<2)return 0;let t=g(i,e),n=e.length-1;if(t>=e[n])return 1;if(t<=e[0])return 0;for(let o=0;o<n;o++){let a=e[o],s=e[o+1];if(t>=a&&t<=s){let r=(t-a)/(s-a);return(o+r)/n}}return 1}function j(i,e){if(e.length<2)return e[0]??0;let t=e.length-1;if(i<=0)return e[0];if(i>=1)return e[t];let n=i*t,o=Math.floor(n),a=n-o,s=e[o]+a*(e[o+1]-e[o]);return Math.round(s)}var S=1e3,E=class{constructor(e){this.onMinSliderInput=()=>{let e=parseInt(this.minSlider.value,10)/S,t=j(e,this.stops);this.applyValues(t,this.lastMax,{fireOnChange:!0,changed:"min"})};this.onMaxSliderInput=()=>{let e=parseInt(this.maxSlider.value,10)/S,t=j(e,this.stops);this.applyValues(this.lastMin,t,{fireOnChange:!0,changed:"max"})};this.onMinInputChange=()=>{let e=parseInt(this.minInput.value,10);if(!Number.isFinite(e)){this.applyValues(this.lastMin,this.lastMax,{fireOnChange:!1,changed:"both"});return}let t=g(e,[this.cfg.bounds.min,this.cfg.bounds.max]);this.applyValues(t,this.lastMax,{fireOnChange:!0,changed:"min"})};this.onMaxInputChange=()=>{let e=parseInt(this.maxInput.value,10);if(!Number.isFinite(e)){this.applyValues(this.lastMin,this.lastMax,{fireOnChange:!1,changed:"both"});return}let t=g(e,[this.cfg.bounds.min,this.cfg.bounds.max]);this.applyValues(this.lastMin,t,{fireOnChange:!0,changed:"max"})};if(this.cfg=e,this.stops=e.stops??[e.bounds.min,e.bounds.max],this.minSlider=document.getElementById(e.minSliderId),this.maxSlider=document.getElementById(e.maxSliderId),this.minInput=document.getElementById(e.minInputId),this.maxInput=document.getElementById(e.maxInputId),this.rangeRoot=document.getElementById(e.rangeRootId),this.container=document.getElementById(e.containerId),!this.minSlider||!this.maxSlider||!this.minInput||!this.maxInput)throw new Error(`RangeSlider: missing required element in ${e.rangeRootId}`);this.minSlider.min="0",this.minSlider.max=String(S),this.maxSlider.min="0",this.maxSlider.max=String(S),this.lastMin=this.readInputClamped(this.minInput,e.bounds.min),this.lastMax=this.readInputClamped(this.maxInput,e.bounds.max),this.lastMax<this.lastMin&&(this.lastMax=this.lastMin),this.minSlider.addEventListener("input",this.onMinSliderInput),this.maxSlider.addEventListener("input",this.onMaxSliderInput),this.minInput.addEventListener("change",this.onMinInputChange),this.maxInput.addEventListener("change",this.onMaxInputChange),this.applyValues(this.lastMin,this.lastMax,{fireOnChange:!1,changed:"both"}),this.renderTicks(),this.wireSteppers(),this.applyLockState()}applyLockState(){let e=!!this.cfg.lockMaxToTwiceMin?.();this.maxSlider.disabled=e,this.maxSlider.classList.toggle("is-max-locked",e),this.maxInput.disabled=e,this.container&&this.container.querySelectorAll('.ld-step-btn[data-target="max"]').forEach(t=>{t.disabled=e}),e&&this.applyValues(this.lastMin,this.lastMax,{fireOnChange:!1,changed:"min"})}setMin(e){this.applyValues(e,this.lastMax,{fireOnChange:!0,changed:"min"})}setRange(e,t){this.applyValues(e,t,{fireOnChange:!1,changed:"both"})}readInputClamped(e,t){let n=parseInt(e.value,10);return Number.isFinite(n)?g(n,[this.cfg.bounds.min,this.cfg.bounds.max]):t}applyValues(e,t,n){let o=e,a=t;if(this.cfg.lockMaxToTwiceMin?.()&&(a=g(o*2,[this.cfg.bounds.min,this.cfg.bounds.max])),o>a){let s=n.changed??"both";s==="min"?a=o:s==="max"?o=a:(o=Math.min(e,t),a=Math.max(e,t))}if(this.lastMin=o,this.lastMax=a,this.minInput.value=String(o),this.maxInput.value=String(a),this.minSlider.value=String(Math.round(x(o,this.stops)*S)),this.maxSlider.value=String(Math.round(x(a,this.stops)*S)),this.rangeRoot){let s=x(o,this.stops)*100,r=x(a,this.stops)*100;this.rangeRoot.style.setProperty("--lo",`${s}%`),this.rangeRoot.style.setProperty("--hi",`${r}%`)}n.fireOnChange&&this.cfg.onChange(o,a)}renderTicks(){if(!this.cfg.ticksContainerId||!this.cfg.stops)return;let e=document.getElementById(this.cfg.ticksContainerId);if(e){e.innerHTML="";for(let t of this.cfg.stops){let n=x(t,this.cfg.stops)*100,o=document.createElement("div");o.className="ld-tick",o.style.left=`${n}%`;let a=document.createElement("span");a.className="ld-tick-label",a.style.left=`${n}%`,a.textContent=String(t),e.appendChild(o),e.appendChild(a)}}}wireSteppers(){if(!this.container)return;this.container.querySelectorAll(".ld-step-btn").forEach(t=>{let n=t.dataset.target,o=t.dataset.action;!n||!o||t.addEventListener("click",()=>{let a=o==="inc"?1:-1;if(n==="min"){let s=g(this.lastMin+a,[this.cfg.bounds.min,this.cfg.bounds.max]);this.applyValues(s,this.lastMax,{fireOnChange:!0,changed:"min"})}else{let s=g(this.lastMax+a,[this.cfg.bounds.min,this.cfg.bounds.max]);this.applyValues(this.lastMin,s,{fireOnChange:!0,changed:"max"})}})})}};var H=[1e6,5e6,25e6],$=[2],W=["modifier-isCompact","modifier-isRandomSpawn","modifier-isCrowded","modifier-isHardNations","modifier-isAlliancesDisabled","modifier-isPortsDisabled","modifier-isNukesDisabled","modifier-isSAMsDisabled","modifier-isPeaceTime","modifier-isWaterNukes"],be=[["discovery-team-hvn","Humans Vs Nations",null]],he=[["discovery-team-2","2"],["discovery-team-3","3"],["discovery-team-4","4"],["discovery-team-5","5"],["discovery-team-6","6"],["discovery-team-7","7"]],R=[...be.map(([i])=>i),...he.map(([i])=>i)];function ge(){try{if(typeof unsafeWindow<"u"&&unsafeWindow.__OF_DEBUG_DISCOVERY===!0)return!0}catch{}if(globalThis.__OF_DEBUG_DISCOVERY===!0)return!0;try{if(typeof localStorage<"u"&&localStorage.getItem("__OF_DEBUG_DISCOVERY")==="true")return!0}catch{}return!1}var Y='<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>',ye='<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',ve='<svg viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7"/><path d="M19 5a9 9 0 010 14"/></svg>',xe='<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/></svg>',B=class{constructor(){this.discoveryEnabled=!0;this.criteriaList=[];this.searchStartTime=null;this.lastMatchTime=null;this.soundEnabled=!0;this.desktopNotificationsEnabled=!1;this.desktopNotificationRequestId=0;this.activeMatchSources=new Set;this.seenLobbies=new Set;this.desktopNotifiedLobbies=new Set;this.isTeamTwoTimesMinEnabled=!1;this.ffaSlider=null;this.teamSlider=null;this.sleeping=!1;this.isDisposed=!1;this.timerInterval=null;this.gameInfoInterval=null;this.pulseSyncTimeout=null;this.engine=new F,this.loadSettings(),this.createUI(),this.updateSleepState(),k.subscribe(()=>this.updateSleepState())}receiveLobbyUpdate(e){this.processLobbies(e)}isSoundEnabled(){return this.soundEnabled}loadSettings(){let e=GM_getValue(w.lobbyDiscoverySettings,null),t=se(e);GM_setValue(w.lobbyDiscoverySettings,t),this.criteriaList=t.criteria,this.soundEnabled=t.soundEnabled,this.desktopNotificationsEnabled=t.desktopNotificationsEnabled,this.discoveryEnabled=t.discoveryEnabled,this.isTeamTwoTimesMinEnabled=t.isTeamTwoTimesMinEnabled}saveSettings(){GM_setValue(w.lobbyDiscoverySettings,{criteria:this.criteriaList,discoveryEnabled:this.discoveryEnabled,soundEnabled:this.soundEnabled,desktopNotificationsEnabled:this.desktopNotificationsEnabled,isTeamTwoTimesMinEnabled:this.isTeamTwoTimesMinEnabled})}updateStatusText(){let e=document.getElementById("discovery-search-timer");if(e){if(!this.discoveryEnabled||this.criteriaList.length===0||!this.isDiscoveryFeedbackAllowed()){e.textContent="",e.style.display="none";return}e.style.display="inline",this.lastMatchTime!==null?e.textContent=`last match ${Q(this.lastMatchTime)}`:this.searchStartTime!==null?e.textContent=`searching \xB7 ${Q(this.searchStartTime)}`:e.textContent="awaiting filters"}}updateCurrentGameInfo(){let e=document.getElementById("discovery-current-game-info");if(!e||!A.isOnLobbyPage()){e&&(e.style.display="none");return}let t=document.querySelector("public-lobby");if(!t||!Array.isArray(t.lobbies)||t.lobbies.length===0){e.style.display="none";return}let n=t.lobbies[0];if(!n||!n.gameConfig){e.style.display="none";return}e.style.display="block",e.textContent=`Current game: ${oe(n)}`}processLobbies(e){try{if(this.updateCurrentGameInfo(),this.syncSearchTimer(),!this.discoveryEnabled||this.criteriaList.length===0||!this.isDiscoveryFeedbackAllowed()){this.seenLobbies.clear(),this.desktopNotifiedLobbies.clear(),this.updateQueueCardPulses(new Set),this.updateStatusText();return}let t=new Set,n=new Set,o=[],a=!1,s=ge(),r=new Set;for(let l of e){let d=ne(l);if(!d)continue;let m=this.engine.matchesCriteria(l,this.criteriaList),h=!r.has(d);if(h&&r.add(d),s&&console.log("[OF Discovery]",{lobbyId:l.gameID,source:d,featured:h,mode:l.gameConfig?.gameMode,playerTeams:l.gameConfig?.playerTeams,modifiers:l.gameConfig?.publicGameModifiers,hostGold:{startingGold:l.gameConfig?.startingGold,goldMultiplier:l.gameConfig?.goldMultiplier},criteriaCount:this.criteriaList.length,matched:m}),!m||!h)continue;t.add(d);let M=this.getNotificationKey(l);n.add(M),this.seenLobbies.has(M)||(a=!0),this.desktopNotifiedLobbies.has(M)||o.push(l)}if(this.updateQueueCardPulses(t),a&&(this.lastMatchTime=Date.now(),this.soundEnabled&&L.playGameFoundSound()),this.desktopNotificationsEnabled){let l=new Set;for(let d of o){let m=ae(d),h=this.getNotificationKey(d);q.show({title:m.title,body:m.body,tag:h})&&l.add(h)}this.desktopNotifiedLobbies=new Set([...[...this.desktopNotifiedLobbies].filter(d=>n.has(d)),...l])}else this.desktopNotifiedLobbies.clear();this.seenLobbies=n,n.size===0&&(this.lastMatchTime=null),this.updateStatusText()}catch(t){console.error("[LobbyDiscovery] Error processing lobbies:",t)}}getNotificationKey(e){return JSON.stringify({gameID:e.gameID,mode:e.gameConfig?.gameMode??null,playerTeams:e.gameConfig?.playerTeams??e.gameConfig?.teamCount??null,capacity:e.gameConfig?.maxPlayers??e.maxClients??null,modifiers:e.gameConfig?.publicGameModifiers??{}})}isDiscoveryFeedbackAllowed(){return!(!A.isOnLobbyPage()||document.getElementById("page-play")?.classList.contains("hidden")||document.querySelector("public-lobby")?.isLobbyHighlighted===!0||document.querySelector("join-lobby-modal")?.currentLobbyId||document.querySelector("host-lobby-modal")?.lobbyId)}getQueueCardElements(){let e=document.querySelector("game-mode-selector");if(!e)return{};let t=Array.from(e.querySelectorAll("div")).find(s=>s.className.includes("sm:grid-cols-[2fr_1fr]"));if(!(t instanceof HTMLElement))return{};let[n,o]=Array.from(t.children),a=o?Array.from(o.children):[];return{ffa:n?.querySelector("button"),special:a[0]?.querySelector("button"),team:a[1]?.querySelector("button")}}updateQueueCardPulses(e){this.activeMatchSources=new Set(e),this.applyQueueCardPulses(),this.scheduleQueueCardPulseSync()}applyQueueCardPulses(){let e=this.getQueueCardElements();for(let t of["ffa","special","team"]){let n=e[t];n&&n.classList.toggle("of-discovery-card-active",this.activeMatchSources.has(t))}}scheduleQueueCardPulseSync(){this.pulseSyncTimeout&&clearTimeout(this.pulseSyncTimeout),this.pulseSyncTimeout=setTimeout(()=>{this.pulseSyncTimeout=null,this.applyQueueCardPulses()},16)}stopTimer(){this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null)}startGameInfoUpdates(){this.stopGameInfoUpdates(),this.updateCurrentGameInfo(),this.gameInfoInterval=setInterval(()=>this.updateCurrentGameInfo(),1e3)}stopGameInfoUpdates(){this.gameInfoInterval&&(clearInterval(this.gameInfoInterval),this.gameInfoInterval=null)}syncSearchTimer(e={}){let{resetStart:t=!1}=e;this.stopTimer(),t&&(this.searchStartTime=null,this.lastMatchTime=null,this.seenLobbies.clear(),this.desktopNotifiedLobbies.clear()),this.discoveryEnabled&&this.criteriaList.length>0&&this.isDiscoveryFeedbackAllowed()?(this.searchStartTime===null&&(this.searchStartTime=Date.now()),this.timerInterval=setInterval(()=>this.updateStatusText(),1e3)):(this.searchStartTime=null,this.lastMatchTime=null),this.updateStatusText(),this.updatePulseIndicator()}updatePulseIndicator(){let e=document.querySelector(".ld-pulse");if(!e)return;let t=this.discoveryEnabled&&this.criteriaList.length>0;e.classList.toggle("is-paused",!t)}setDiscoveryEnabled(e,t={}){this.discoveryEnabled=e,this.saveSettings(),this.updateStatusLabel(),this.syncSearchTimer({resetStart:t.resetTimer??!1})}updateStatusLabel(){let e=document.querySelector(".ld-status-text strong");e&&(e.textContent=this.discoveryEnabled?"Discovery active":"Discovery paused")}getNumberValue(e){let t=document.getElementById(e);if(!t)return null;let n=parseInt(t.value,10);return Number.isNaN(n)?null:n}getModifierState(e){let n=document.getElementById(e)?.dataset.state;return n==="required"||n==="blocked"?n:"any"}setModifierState(e,t){let n=document.getElementById(e);if(!n)return;n.dataset.state=t,n.setAttribute("aria-pressed",String(t!=="any"));let o=n.dataset.modName??n.getAttribute("aria-label")??"",a=t==="blocked"?"excluded":t;o&&n.setAttribute("aria-label",t==="any"?o:`${o} \xB7 ${a}`);let s=n.querySelector(".ld-mod-ind");s&&(t==="required"?s.innerHTML=Y:t==="blocked"?s.innerHTML=ye:s.innerHTML="")}cycleModifierState(e){let t=this.getModifierState(e),n=t==="any"?"required":t==="required"?"blocked":"any";this.setModifierState(e,n)}getNumericModifierState(e){let t={};for(let[n,o]of Object.entries(e))t[Number(n)]=this.getModifierState(o);return t}getModifierFiltersFromUI(){return{isCompact:this.getModifierState("modifier-isCompact"),isRandomSpawn:this.getModifierState("modifier-isRandomSpawn"),isCrowded:this.getModifierState("modifier-isCrowded"),isHardNations:this.getModifierState("modifier-isHardNations"),isAlliancesDisabled:this.getModifierState("modifier-isAlliancesDisabled"),isPortsDisabled:this.getModifierState("modifier-isPortsDisabled"),isNukesDisabled:this.getModifierState("modifier-isNukesDisabled"),isSAMsDisabled:this.getModifierState("modifier-isSAMsDisabled"),isPeaceTime:this.getModifierState("modifier-isPeaceTime"),isWaterNukes:this.getModifierState("modifier-isWaterNukes"),startingGold:this.getNumericModifierState({1e6:"modifier-startingGold-1000000",5e6:"modifier-startingGold-5000000",25e6:"modifier-startingGold-25000000"}),goldMultiplier:this.getNumericModifierState({2:"modifier-goldMultiplier-2"})}}getAllTeamCountValues(){let e=[];for(let t of R){let n=document.getElementById(t);if(!n?.checked)continue;let o=n.value;if(o==="Humans Vs Nations")e.push(o);else{let a=parseInt(o,10);Number.isNaN(a)||e.push(a)}}return e}setAllTeamCounts(e){for(let t of R){let n=document.getElementById(t);n&&(n.checked=e,this.syncChipState(t))}}syncChipState(e){let t=document.getElementById(e);if(!t)return;let n=t.closest(".ld-chip, .ld-mode-btn, .ld-2x");n&&(n.classList.toggle("is-on",t.checked),n.setAttribute("aria-pressed",String(t.checked)))}buildCriteriaFromUI(){let e=this.getModifierFiltersFromUI(),t=[];if(document.getElementById("discovery-ffa")?.checked&&t.push({gameMode:"FFA",teamCount:null,minPlayers:this.getNumberValue("discovery-ffa-min"),maxPlayers:this.getNumberValue("discovery-ffa-max"),modifiers:e}),!document.getElementById("discovery-team")?.checked)return t;let a=this.getAllTeamCountValues();if(a.length===0)return t.push({gameMode:"Team",teamCount:null,minPlayers:this.getNumberValue("discovery-team-min"),maxPlayers:this.getNumberValue("discovery-team-max"),modifiers:e}),t;for(let s of a)t.push({gameMode:"Team",teamCount:s,minPlayers:this.getNumberValue("discovery-team-min"),maxPlayers:this.getNumberValue("discovery-team-max"),modifiers:e});return t}updateFilterCount(){let e=document.getElementById("discovery-filter-count"),t=document.getElementById("discovery-filter-word");if(!e||!t)return;let n=document.getElementById("discovery-ffa")?.checked,o=document.getElementById("discovery-team")?.checked,a=R.filter(l=>document.getElementById(l)?.checked).length,s=[...W,...H.map(l=>`modifier-startingGold-${l}`),...$.map(l=>`modifier-goldMultiplier-${l}`)].filter(l=>this.getModifierState(l)!=="any").length,r=(n?1:0)+(o?1:0)+a+s;e.textContent=String(r),t.textContent=r===1?"filter":"filters"}setModePanelActive(e,t){let n=document.getElementById(e);n&&n.classList.toggle("is-off",!t)}setIconButtonState(e,t){let n=document.getElementById(e)?.closest(".ld-icon-btn");n&&n.classList.toggle("is-on",t)}loadUIFromSettings(){let e=this.criteriaList.find(d=>d.gameMode==="FFA"),t=this.criteriaList.filter(d=>d.gameMode==="Team"),n=document.getElementById("discovery-ffa"),o=document.getElementById("discovery-team");if(n&&(n.checked=!!e,this.syncChipState("discovery-ffa"),this.setModePanelActive("discovery-ffa-config",!!e)),o&&(o.checked=t.length>0,this.syncChipState("discovery-team"),this.setModePanelActive("discovery-team-config",t.length>0)),e){let d=document.getElementById("discovery-ffa-min"),m=document.getElementById("discovery-ffa-max");d&&e.minPlayers!==null&&(d.value=String(e.minPlayers)),m&&e.maxPlayers!==null&&(m.value=String(e.maxPlayers))}if(t[0]){let d=document.getElementById("discovery-team-min"),m=document.getElementById("discovery-team-max");d&&t[0].minPlayers!==null&&(d.value=String(t[0].minPlayers)),m&&t[0].maxPlayers!==null&&(m.value=String(t[0].maxPlayers)),this.setTeamCountSelections(t.map(h=>h.teamCount))}let a=(e??t[0])?.modifiers;if(a){this.setModifierState("modifier-isCompact",a.isCompact??"any"),this.setModifierState("modifier-isRandomSpawn",a.isRandomSpawn??"any"),this.setModifierState("modifier-isCrowded",a.isCrowded??"any"),this.setModifierState("modifier-isHardNations",a.isHardNations??"any"),this.setModifierState("modifier-isAlliancesDisabled",a.isAlliancesDisabled??"any"),this.setModifierState("modifier-isPortsDisabled",a.isPortsDisabled??"any"),this.setModifierState("modifier-isNukesDisabled",a.isNukesDisabled??"any"),this.setModifierState("modifier-isSAMsDisabled",a.isSAMsDisabled??"any"),this.setModifierState("modifier-isPeaceTime",a.isPeaceTime??"any"),this.setModifierState("modifier-isWaterNukes",a.isWaterNukes??"any");for(let d of H)this.setModifierState(`modifier-startingGold-${d}`,a.startingGold?.[d]??"any");for(let d of $)this.setModifierState(`modifier-goldMultiplier-${d}`,a.goldMultiplier?.[d]??"any")}let s=document.getElementById("discovery-sound-toggle");s&&(s.checked=this.soundEnabled,this.setIconButtonState("discovery-sound-toggle",this.soundEnabled));let r=document.getElementById("discovery-desktop-toggle");r&&(r.checked=this.desktopNotificationsEnabled,this.setIconButtonState("discovery-desktop-toggle",this.desktopNotificationsEnabled));let l=document.getElementById("discovery-team-two-times");l&&(l.checked=this.isTeamTwoTimesMinEnabled,this.syncChipState("discovery-team-two-times")),this.updateFilterCount(),this.updateStatusLabel()}setTeamCountSelections(e){for(let t of e){let n=null;t==="Humans Vs Nations"?n=document.getElementById("discovery-team-hvn"):typeof t=="number"&&(n=document.getElementById(`discovery-team-${t}`)),n&&(n.checked=!0,this.syncChipState(n.id))}}refreshCriteria(){this.criteriaList=this.buildCriteriaFromUI(),this.saveSettings(),this.updateFilterCount(),this.syncSearchTimer({resetStart:!0})}resetAll(){let e=document.getElementById("discovery-ffa"),t=document.getElementById("discovery-team");e&&(e.checked=!1,this.syncChipState("discovery-ffa"),this.setModePanelActive("discovery-ffa-config",!1)),t&&(t.checked=!1,this.syncChipState("discovery-team"),this.setModePanelActive("discovery-team-config",!1)),this.setAllTeamCounts(!1);let n=document.getElementById("discovery-team-two-times");n&&(n.checked=!1,this.syncChipState("discovery-team-two-times"),this.isTeamTwoTimesMinEnabled=!1);for(let o of W)this.setModifierState(o,"any");for(let o of H)this.setModifierState(`modifier-startingGold-${o}`,"any");for(let o of $)this.setModifierState(`modifier-goldMultiplier-${o}`,"any");this.ffaSlider?.setRange(1,125),this.teamSlider?.setRange(y,U),this.teamSlider?.applyLockState(),this.refreshCriteria()}async handleDesktopNotificationToggleChange(e){let t=++this.desktopNotificationRequestId;if(!e.checked){this.desktopNotificationsEnabled=!1,this.setIconButtonState("discovery-desktop-toggle",!1),this.saveSettings();return}let n=await q.ensurePermission();t!==this.desktopNotificationRequestId||this.isDisposed||!e.isConnected||!e.checked||(this.desktopNotificationsEnabled=n,e.checked=n,e.toggleAttribute("checked",n),this.setIconButtonState("discovery-desktop-toggle",n),this.saveSettings())}setupEventListeners(){document.getElementById("discovery-status")?.addEventListener("click",()=>{this.setDiscoveryEnabled(!this.discoveryEnabled,{resetTimer:!0})});for(let[n,o]of[["discovery-ffa","discovery-ffa-config"],["discovery-team","discovery-team-config"]]){let a=document.getElementById(n);a?.addEventListener("change",()=>{this.syncChipState(n),this.setModePanelActive(o,a.checked),this.refreshCriteria()})}let e=document.getElementById("discovery-team-two-times");e?.addEventListener("change",()=>{this.isTeamTwoTimesMinEnabled=e.checked,this.syncChipState("discovery-team-two-times"),this.teamSlider?.applyLockState(),this.refreshCriteria()}),document.getElementById("discovery-reset")?.addEventListener("click",()=>{this.resetAll()});for(let n of[...R,"discovery-sound-toggle","discovery-desktop-toggle"]){let o=document.getElementById(n);o&&o.addEventListener("change",()=>{if(n==="discovery-sound-toggle"){this.soundEnabled=o.checked,this.setIconButtonState("discovery-sound-toggle",o.checked),this.saveSettings();return}if(n==="discovery-desktop-toggle"){this.handleDesktopNotificationToggleChange(o);return}this.syncChipState(n),this.refreshCriteria()})}let t=[...W,...H.map(n=>`modifier-startingGold-${n}`),...$.map(n=>`modifier-goldMultiplier-${n}`)];for(let n of t)document.getElementById(n)?.addEventListener("click",()=>{this.cycleModifierState(n),this.refreshCriteria()})}renderModeButton(e,t){return`
      <label class="ld-mode-btn" aria-pressed="false">
        <input type="checkbox" id="${e}" value="${e==="discovery-ffa"?"FFA":"Team"}">
        <span class="check">${Y}</span>
        <span>${t}</span>
      </label>
    `}renderChip(e,t,n){return`
      <label class="ld-chip" aria-pressed="false">
        <input type="checkbox" id="${e}" value="${t}">${n}
      </label>
    `}renderModifierChip(e,t){return`
      <button type="button" class="ld-mod" id="${e}" data-state="any" data-mod-name="${t}" aria-pressed="false" aria-label="${t}">
        <span class="ld-mod-ind"></span>
        <span class="ld-mod-name">${t}</span>
      </button>
    `}renderIconButton(e,t,n){return`
      <label class="ld-icon-btn" title="${t}" aria-label="${t}">
        <input type="checkbox" id="${e}">${n}
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
              <div class="ld-slider-row" id="discovery-ffa-slider-row">
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
                ${this.renderChip("discovery-team-hvn","Humans Vs Nations","Humans Vs Nations")}
              </div>
              <div class="ld-format-label" style="margin-top: 10px;">NUMBER OF TEAMS</div>
              <div class="ld-formats" style="margin-bottom: 14px;">
                ${this.renderChip("discovery-team-2","2","2")}
                ${this.renderChip("discovery-team-3","3","3")}
                ${this.renderChip("discovery-team-4","4","4")}
                ${this.renderChip("discovery-team-5","5","5")}
                ${this.renderChip("discovery-team-6","6","6")}
                ${this.renderChip("discovery-team-7","7","7")}
              </div>
              <div class="ld-slider-row" id="discovery-team-slider-row">
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
                <span class="check">${Y}</span>
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
    `,document.body.appendChild(this.panel),this.setupEventListeners(),this.loadUIFromSettings(),this.ffaSlider=new E({containerId:"discovery-ffa-slider-row",rangeRootId:"discovery-ffa-range-root",minSliderId:"discovery-ffa-min-slider",maxSliderId:"discovery-ffa-max-slider",minInputId:"discovery-ffa-min",maxInputId:"discovery-ffa-max",fillId:"discovery-ffa-range-fill",bounds:{min:1,max:125},onChange:()=>this.refreshCriteria()}),this.teamSlider=new E({containerId:"discovery-team-slider-row",rangeRootId:"discovery-team-range-root",minSliderId:"discovery-team-min-slider",maxSliderId:"discovery-team-max-slider",minInputId:"discovery-team-min",maxInputId:"discovery-team-max",fillId:"discovery-team-range-fill",ticksContainerId:"discovery-team-ticks",bounds:{min:y,max:U},stops:X,lockMaxToTwiceMin:()=>this.isTeamTwoTimesMinEnabled,onChange:()=>this.refreshCriteria()}),this.updateStatusLabel(),this.updateFilterCount(),this.syncSearchTimer(),this.startGameInfoUpdates())}updateSleepState(){let e=A.isOnLobbyPage();this.sleeping=!e,this.sleeping?(this.panel.classList.add("hidden"),this.stopTimer(),this.stopGameInfoUpdates(),this.updateQueueCardPulses(new Set)):(this.panel.classList.remove("hidden"),this.syncSearchTimer(),this.startGameInfoUpdates())}cleanup(){this.isDisposed=!0,this.stopTimer(),this.stopGameInfoUpdates(),this.pulseSyncTimeout&&(clearTimeout(this.pulseSyncTimeout),this.pulseSyncTimeout=null),this.activeMatchSources.clear(),this.applyQueueCardPulses(),this.panel.parentNode?.removeChild(this.panel)}};var G=class{constructor(){this.observer=null;this.animationFrameId=null}start(){this.observer||(this.observer=new MutationObserver(()=>this.scheduleApplyHighlights()),this.observer.observe(document.body,{attributes:!1,childList:!0,subtree:!0}),this.applyHighlights())}stop(){this.observer?.disconnect(),this.observer=null,this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}scheduleApplyHighlights(){this.animationFrameId===null&&(this.animationFrameId=requestAnimationFrame(()=>{this.animationFrameId=null,this.applyHighlights()}))}applyHighlights(){for(let e of Array.from(document.querySelectorAll("lobby-player-view")))this.applyHighlightToView(e)}applyHighlightToView(e){this.clearHighlights(e);let t=Array.from(e.querySelectorAll(".player-tag.current-player"));if(t.length>0){t.forEach(a=>a.classList.add("of-current-player-boost"));return}let n=this.getNativeTeamRows(e);n.forEach(a=>a.classList.add("of-current-player-boost"));let o=this.getNativeTeamCards(e);o.forEach(a=>a.classList.add("of-current-player-team-boost")),!(n.length>0||o.length>0)&&this.applyFallbackHighlight(e)}clearHighlights(e){e.querySelectorAll(".of-current-player-boost").forEach(t=>{t.classList.remove("of-current-player-boost")}),e.querySelectorAll(".of-current-player-team-boost").forEach(t=>{t.classList.remove("of-current-player-team-boost")})}getNativeTeamRows(e){return Array.from(e.querySelectorAll("div")).filter(t=>{let n=t.classList;return n.contains("bg-sky-600/20")&&n.contains("border-sky-500/40")})}getNativeTeamCards(e){return Array.from(e.querySelectorAll("div")).filter(t=>{let n=t.classList;return n.contains("rounded-xl")&&n.contains("border-sky-500/60")})}applyFallbackHighlight(e){let t=e.currentClientID,n=Array.isArray(e.clients)?e.clients:[];if(!t||n.length===0)return;let o=n.findIndex(p=>p?.clientID===t);if(o<0)return;let a=n[o],s=this.formatDisplayName(a),r=Array.from(e.querySelectorAll(".player-tag"));if(r[o]){r[o].classList.add("of-current-player-boost");return}Array.from(e.querySelectorAll("[data-client-id]")).filter(p=>p.dataset.clientId===t).forEach(p=>p.classList.add("of-current-player-boost")),this.findRowsByDisplayName(e,s).forEach(p=>p.classList.add("of-current-player-boost"));let m=Array.from(e.querySelectorAll(".rounded-xl")),I=(Array.isArray(e.teamPreview)?e.teamPreview:[]).filter(p=>Array.isArray(p.players)&&p.players.length>0).findIndex(p=>Array.isArray(p.players)&&p.players.some(_=>_?.clientID===t));I>=0&&m[I]&&(m[I].classList.add("of-current-player-team-boost"),this.findRowsByDisplayName(m[I],s).forEach(_=>_.classList.add("of-current-player-boost")))}formatDisplayName(e){return e?.username?e.clanTag?`[${e.clanTag}] ${e.username}`:e.username:""}findRowsByDisplayName(e,t){if(!t)return[];let n=[];for(let o of Array.from(e.querySelectorAll("span, div"))){let a=o.textContent?.trim();if(!a||a!==t)continue;let s=o.closest("[data-client-id]")??o.closest(".player-tag")??o.closest(".team-player-row")??o.closest("div");s&&!n.includes(s)&&n.push(s)}return n}};(function(){"use strict";console.log("[OpenFront Game Notifier] Initializing adaptation for OpenFront 0.30..."),GM_addStyle(Z()),L.preloadSounds(),k.init(),V.start();let i=new B,e=new G;V.subscribe(o=>{i.receiveLobbyUpdate(o)}),e.start();let t=o=>{try{return new URL(o).searchParams.has("live")}catch{return!1}},n=t(location.href);k.subscribe(o=>{let a=t(o);!n&&a&&i.isSoundEnabled()&&L.playGameStartSound(),n=a}),console.log("[OpenFront Game Notifier] Ready! \u{1F680}")})();})();
