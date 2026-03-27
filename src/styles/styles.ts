/**
 * CSS styles for the userscript UI
 * Uses CSS-in-JS with theme tokens for consistent styling
 */

import { COLORS, SPACING, RADIUS, SHADOWS, TIMING, FONTS } from '@/config/theme';
import { Z_INDEX } from '@/config/constants';

/**
 * Generate all CSS styles as a string for GM_addStyle
 */
export function getStyles(): string {
  return `
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
      --of-hud-accent: ${COLORS.accent};
      --of-hud-accent-soft: ${COLORS.accentMuted};
      --of-hud-accent-alt: ${COLORS.accentAlt};
      --of-hud-border: ${COLORS.border};
      --of-hud-border-strong: ${COLORS.borderAccent};
      --of-hud-bg: ${COLORS.bgPrimary};
      --of-hud-bg-2: ${COLORS.bgSecondary};
      --of-hud-text: ${COLORS.textPrimary};
    }

    @keyframes ofPanelEnter {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .of-panel {
      position: fixed;
      background: linear-gradient(145deg, rgba(12, 18, 30, 0.98) 0%, rgba(10, 16, 26, 0.94) 60%, rgba(8, 12, 20, 0.96) 100%);
      border: 1px solid ${COLORS.border};
      border-radius: ${RADIUS.lg};
      box-shadow: ${SHADOWS.lg};
      font-family: ${FONTS.body};
      color: ${COLORS.textPrimary};
      user-select: none;
      z-index: ${Z_INDEX.panel};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      animation: ofPanelEnter ${TIMING.slow} ease;
    }
    .of-panel input[type="checkbox"] { accent-color: ${COLORS.accent}; }
    .of-panel.hidden { display: none; }
    .of-header {
      padding: ${SPACING.md} ${SPACING.lg};
      background: linear-gradient(90deg, rgba(20, 30, 46, 0.85), rgba(12, 18, 30, 0.6));
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      font-size: 0.85em;
      border-bottom: 1px solid ${COLORS.border};
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${FONTS.display};
    }
    .of-header-title {
      display: flex;
      align-items: center;
      gap: ${SPACING.sm};
    }
    .of-player-list-title {
      font-size: 1em;
      color: ${COLORS.textPrimary};
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
      gap: ${SPACING.sm};
      padding: ${SPACING.sm} ${SPACING.md};
      font-size: 0.85em;
      position: relative;
    }
    .discovery-header:hover {
      background: ${COLORS.bgHover};
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
      color: ${COLORS.textPrimary};
      font-weight: 700;
    }
    .discovery-title-sub {
      font-size: 0.72em;
      color: ${COLORS.textMuted};
      letter-spacing: 0.2em;
    }
    .of-content { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(80,110,160,0.4) transparent; }
    .of-content::-webkit-scrollbar { width: 7px; }
    .of-content::-webkit-scrollbar-thumb { background: rgba(80,110,160,0.4); border-radius: 5px; }
    .of-footer {
      padding: ${SPACING.sm} ${SPACING.lg};
      display: flex;
      justify-content: space-between;
      background: ${COLORS.bgSecondary};
      flex-shrink: 0;
      border-top: 1px solid ${COLORS.border};
    }
    .of-button {
      background: ${COLORS.bgHover};
      border: 1px solid ${COLORS.border};
      color: ${COLORS.textPrimary};
      padding: ${SPACING.sm} ${SPACING.md};
      border-radius: ${RADIUS.md};
      cursor: pointer;
      font-size: 0.95em;
      font-weight: 600;
      transition: background ${TIMING.fast}, border-color ${TIMING.fast}, color ${TIMING.fast};
      outline: none;
    }
    .of-button:hover { background: rgba(80,110,160,0.5); border-color: ${COLORS.borderAccent}; }
    .of-button.primary { background: ${COLORS.accent}; color: #04131a; }
    .of-button.primary:hover { background: ${COLORS.accentHover}; }
    .of-input {
      padding: ${SPACING.sm};
      background: rgba(20, 30, 46, 0.7);
      border: 1px solid ${COLORS.border};
      border-radius: ${RADIUS.md};
      color: ${COLORS.textPrimary};
      font-size: 0.95em;
      outline: none;
      transition: border ${TIMING.fast};
    }
    .of-input:focus { border-color: ${COLORS.accent}; }
    .of-badge {
      background: ${COLORS.accentMuted};
      border: 1px solid ${COLORS.borderAccent};
      border-radius: ${RADIUS.xl};
      padding: 2px 10px;
      font-size: 0.75em;
      color: ${COLORS.textPrimary};
    }
    .of-toggle {
      width: 34px;
      height: 18px;
      border-radius: 11px;
      background: rgba(35, 48, 70, 0.9);
      border: 1px solid ${COLORS.border};
      position: relative;
      transition: background ${TIMING.fast}, border-color ${TIMING.fast};
      cursor: pointer;
    }
    .of-toggle.on { background: ${COLORS.successSolid}; }
    .of-toggle-ball {
      position: absolute; left: 2px; top: 2px; width: 14px; height: 14px;
      border-radius: 50%; background: #fff; transition: left ${TIMING.fast};
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
      border: 1px solid ${COLORS.border};
      border-left: 1px solid ${COLORS.borderAccent};
      border-radius: 0;
      box-shadow: ${SHADOWS.lg};
      font-family: ${FONTS.body};
      color: ${COLORS.textPrimary};
      user-select: none;
      z-index: ${Z_INDEX.panel};
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
      background: linear-gradient(180deg, ${COLORS.accent}, rgba(46, 211, 241, 0.1));
      cursor: ew-resize;
      z-index: ${Z_INDEX.panel + 1};
      opacity: 0.35;
      transition: opacity ${TIMING.fast}, box-shadow ${TIMING.fast};
    }
    .of-resize-handle:hover {
      opacity: 0.8;
      box-shadow: 0 0 12px rgba(46, 211, 241, 0.4);
    }
    .of-resize-handle.dragging {
      opacity: 1;
    }
    .of-player-list-count { font-size: 0.72em; letter-spacing: 0.12em; font-family: ${FONTS.mono}; }
    .of-player-debug-info { font-size: 0.75em; color: rgba(148, 170, 210, 0.7); padding: 2px 6px; display: none; font-family: ${FONTS.mono}; }

    .of-quick-tag-switch {
      padding: ${SPACING.md} ${SPACING.lg};
      background: rgba(14, 22, 34, 0.75);
      border-bottom: 1px solid ${COLORS.border};
      display: flex;
      align-items: center;
      gap: ${SPACING.sm};
      flex-shrink: 0;
      flex-wrap: nowrap;
      overflow-x: auto;
    }
    .of-quick-tag-switch::-webkit-scrollbar { height: 5px; }
    .of-quick-tag-switch::-webkit-scrollbar-thumb { background: rgba(80,110,160,0.45); border-radius: 4px; }
    .of-quick-tag-label {
      font-size: 0.75em;
      color: ${COLORS.textMuted};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }
    .of-quick-tag-item {
      display: flex;
      align-items: center;
      gap: ${SPACING.xs};
    }
    .of-quick-tag-btn {
      padding: 4px 12px;
      font-size: 0.8em;
      background: rgba(22, 34, 52, 0.9);
      color: ${COLORS.textPrimary};
      border: 1px solid ${COLORS.border};
      border-radius: ${RADIUS.md};
      cursor: pointer;
      transition: all ${TIMING.fast};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${FONTS.display};
    }
    .of-quick-tag-btn:hover {
      background: ${COLORS.accentMuted};
      border-color: ${COLORS.accent};
    }
    .of-quick-tag-remove {
      width: 16px;
      height: 16px;
      padding: 0;
      font-size: 11px;
      line-height: 1;
      background: rgba(255, 125, 135, 0.15);
      color: ${COLORS.error};
      border: 1px solid rgba(255, 125, 135, 0.6);
      border-radius: 50%;
      cursor: pointer;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background ${TIMING.fast}, border-color ${TIMING.fast}, transform ${TIMING.fast};
    }
    .of-quick-tag-remove:hover {
      background: rgba(255, 117, 117, 0.25);
      border-color: ${COLORS.error};
      transform: scale(1.05);
    }

    .of-clan-checkbox-filter {
      padding: ${SPACING.md} ${SPACING.lg};
      background: rgba(14, 22, 34, 0.75);
      border-bottom: 1px solid ${COLORS.border};
      display: flex;
      align-items: center;
      gap: ${SPACING.sm};
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
      color: ${COLORS.textPrimary};
      font-size: 0.85em;
      user-select: none;
      flex: 1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${FONTS.display};
    }

    .of-team-group {
      position: relative;
      padding: 12px ${SPACING.md} 6px ${SPACING.md};
    }
    .of-team-group + .of-team-group {
      border-top: 1px dashed rgba(90, 110, 150, 0.35);
    }
    .of-team-group.current-player-team .of-team-band {
      border-left-width: 5px;
      box-shadow: 0 0 12px var(--team-color, ${COLORS.accent});
    }
    .of-team-band {
      position: absolute;
      inset: 0;
      border-left: 3px solid var(--team-color, ${COLORS.accent});
      background: transparent;
      pointer-events: none;
    }
    .of-team-header {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: ${SPACING.xs};
      padding: 4px 10px;
      border-radius: ${RADIUS.xl};
      border: 1px solid var(--team-color, ${COLORS.borderAccent});
      background: rgba(10, 16, 28, 0.7);
      font-size: 0.7em;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--team-color, ${COLORS.textPrimary});
      font-family: ${FONTS.display};
      margin-bottom: ${SPACING.xs};
    }
    .of-team-group.current-player-team .of-team-header::before {
      content: "◆";
      color: var(--team-color, ${COLORS.accent});
      font-size: 0.85em;
      margin-right: 2px;
    }
    .of-team-label {
      font-weight: 700;
    }
    .of-team-count {
      color: ${COLORS.textSecondary};
      font-size: 0.85em;
      letter-spacing: 0.1em;
      font-family: ${FONTS.mono};
      margin-left: ${SPACING.xs};
    }

    .of-clan-group {
      margin: 8px ${SPACING.md};
      border: 1px solid rgba(90, 110, 150, 0.35);
      border-radius: ${RADIUS.md};
      background: rgba(14, 20, 32, 0.78);
      overflow: hidden;
      box-shadow: 0 10px 18px rgba(2, 6, 16, 0.35);
      --clan-color: ${COLORS.accent};
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
      animation: clanGroupEnter ${TIMING.slow} cubic-bezier(.27,.82,.48,1.06) forwards;
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
      padding: calc(${SPACING.sm} - 2px) ${SPACING.md};
      background: linear-gradient(90deg, var(--clan-color-soft), rgba(22, 32, 48, 0.9) 65%);
      border-left: 3px solid var(--clan-color-border);
      cursor: default;
      display: flex;
      align-items: center;
      gap: ${SPACING.sm};
      transition: background ${TIMING.fast}, border-color ${TIMING.fast};
      flex-wrap: wrap;
      font-family: ${FONTS.display};
    }
    .of-clan-group-header:hover {
      background: linear-gradient(90deg, var(--clan-color-strong), rgba(28, 40, 60, 0.95) 65%);
    }
    .of-clan-arrow {
      font-size: 0.8em;
      color: ${COLORS.textSecondary};
      transition: transform ${TIMING.fast};
      width: 16px;
      display: inline-block;
    }
    .of-clan-group.collapsed .of-clan-arrow {
      transform: rotate(-90deg);
    }
    .of-clan-tag {
      font-weight: 700;
      color: ${COLORS.textPrimary};
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-family: ${FONTS.display};
    }
    .of-clan-you-badge {
      font-size: 0.7em;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      padding: 2px 6px;
      border-radius: ${RADIUS.xl};
      border: 1px solid var(--clan-color-border);
      background: var(--clan-color-soft);
      color: ${COLORS.textPrimary};
      font-family: ${FONTS.mono};
    }
    .of-clan-count {
      font-size: 0.75em;
      color: ${COLORS.textPrimary};
      background: var(--clan-color-soft);
      padding: 2px 7px;
      border-radius: ${RADIUS.xl};
      border: 1px solid var(--clan-color-border);
      letter-spacing: 0.1em;
      font-family: ${FONTS.mono};
    }
    .of-clan-actions {
      display: flex;
      gap: ${SPACING.xs};
      flex-wrap: wrap;
      align-items: center;
      margin-left: auto;
    }
    .of-clan-stats {
      display: flex;
      gap: ${SPACING.xs};
      font-size: 0.66em;
      color: ${COLORS.textSecondary};
      flex-wrap: wrap;
      font-family: ${FONTS.mono};
      line-height: 1.2;
    }
    .of-clan-stats span {
      white-space: nowrap;
    }
    .of-clan-use-btn {
      padding: 4px 10px;
      font-size: 0.75em;
      background: rgba(46, 211, 241, 0.15);
      color: ${COLORS.textPrimary};
      border: 1px solid ${COLORS.borderAccent};
      border-radius: ${RADIUS.sm};
      cursor: pointer;
      transition: all ${TIMING.fast};
      font-weight: 700;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${FONTS.display};
    }
    .of-clan-use-btn:hover {
      background: ${COLORS.accent};
      border-color: ${COLORS.accent};
      color: #04131a;
    }
    .of-clan-group-players {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 10px 12px 10px;
      overflow: visible;
      transition: max-height ${TIMING.normal} ease-in-out, opacity ${TIMING.normal} ease-in-out;
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
      border-radius: ${RADIUS.sm};
      background: var(--clan-color-soft);
      cursor: default;
      transition: background ${TIMING.fast}, border-color ${TIMING.fast}, transform ${TIMING.fast};
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
      border-radius: ${RADIUS.sm};
      background: var(--player-accent-soft, rgba(90, 105, 130, 0.18));
      cursor: default;
      transition: background ${TIMING.fast}, border-color ${TIMING.fast}, transform ${TIMING.fast};
      font-size: 0.85em;
    }
    .of-solo-players .of-player-item:hover {
      background: var(--player-accent-strong, rgba(120, 135, 170, 0.28));
      border-color: var(--player-accent, rgba(150, 165, 190, 0.6));
      transform: translateY(-1px);
    }
    .of-player-list-content { flex: 1; padding: ${SPACING.xs} 0; }
    /* Base player item styles (for untagged players) */
    .of-player-list-content > .of-player-item {
      padding: 6px ${SPACING.md};
      border-bottom: 1px solid rgba(60, 80, 120, 0.35);
      font-size: 0.85em;
      line-height: 1.4;
      position: relative;
      transition: background-color ${TIMING.slow}, border-color ${TIMING.slow};
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
      border-left: 4px solid var(--clan-color, ${COLORS.accent});
      background: var(--clan-color);
      box-shadow: 0 0 0 1px var(--clan-color-border) inset, 0 0 12px rgba(46, 211, 241, 0.3);
      color: #fff;
      text-shadow: 0 1px 2px rgba(6, 10, 18, 0.8);
    }
    .of-player-name { color: ${COLORS.textPrimary}; white-space: nowrap; overflow: visible; font-weight: 400; flex: 1; }
    .of-player-highlighted { background: linear-gradient(90deg, ${COLORS.highlight} 40%, rgba(46, 211, 241, 0.05)); border-left: 3px solid ${COLORS.accent}; }
    .of-player-enter { animation: playerEnter ${TIMING.slow} cubic-bezier(.27,.82,.48,1.06) forwards; }
    .of-player-enter-stagger-1 { animation-delay: 30ms; }
    .of-player-enter-stagger-2 { animation-delay: 60ms; }
    .of-player-enter-stagger-3 { animation-delay: 90ms; }
    .of-player-enter-stagger-4 { animation-delay: 120ms; }
    .of-player-enter-highlight { background-color: rgba(110,160,255,0.14) !important; }
    .of-player-exit-highlight { background-color: rgba(220, 70, 90, 0.18); }
    .of-player-exit { animation: playerExit 0.25s cubic-bezier(.51,.01,1,1.01) forwards; }
    @keyframes playerEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes playerExit { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }
    .of-player-list-footer { padding: ${SPACING.sm} ${SPACING.lg}; display: flex; justify-content: space-between; background: ${COLORS.bgSecondary}; font-size: 0.95em; flex-shrink: 0; border-top: 1px solid ${COLORS.border}; }
    .of-player-list-button { background: ${COLORS.bgHover}; border: 1px solid ${COLORS.border}; color: ${COLORS.textPrimary}; padding: 6px 13px; border-radius: ${RADIUS.md}; cursor: pointer; font-size: 0.9em; font-weight: 600; transition: background ${TIMING.fast}, border-color ${TIMING.fast}; outline: none; }
    .of-player-list-button:hover { background: rgba(80,110,160,0.5); border-color: ${COLORS.borderAccent}; }

    .discovery-panel {
      position: fixed;
      top: 24px;
      right: 24px;
      width: min(560px, calc(100vw - 32px));
      max-height: calc(100vh - 48px);
      margin: 0;
      border: 1px solid ${COLORS.border};
      border-radius: ${RADIUS.lg};
      box-shadow: ${SHADOWS.lg};
      transition: opacity ${TIMING.slow}, transform ${TIMING.slow};
      cursor: default;
      overflow: hidden;
    }
    .discovery-panel::after { display: none; }
    .discovery-panel.hidden { display: none; }
    .discovery-body { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .discovery-content { display: flex; flex-direction: column; gap: ${SPACING.sm}; padding: ${SPACING.sm} ${SPACING.md} ${SPACING.md}; overflow-y: auto; overflow-x: hidden; min-height: 0; }
    .discovery-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: ${SPACING.sm};
      flex-wrap: wrap;
      padding: ${SPACING.sm} ${SPACING.md};
      background: rgba(18, 26, 40, 0.75);
      border: 1px solid ${COLORS.border};
      border-radius: ${RADIUS.md};
    }
    .discovery-action-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: ${SPACING.sm};
    }
    .discovery-modes { display: flex; flex-direction: column; gap: ${SPACING.sm}; }
    .discovery-clanmate-button {
      width: 100%;
      background: rgba(22, 34, 52, 0.9);
      border: 1px solid ${COLORS.border};
      color: ${COLORS.textPrimary};
      padding: ${SPACING.sm} ${SPACING.md};
      border-radius: ${RADIUS.md};
      font-size: 0.8em;
      font-weight: 700;
      cursor: pointer;
      transition: background ${TIMING.fast}, border-color ${TIMING.fast};
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${FONTS.display};
    }
    .discovery-clanmate-button:hover { background: rgba(30, 44, 66, 0.95); border-color: ${COLORS.borderAccent}; }
    .discovery-clanmate-button.armed { background: ${COLORS.accent}; border-color: ${COLORS.accentHover}; color: #04131a; box-shadow: 0 0 12px rgba(46, 211, 241, 0.35); }
    .discovery-clanmate-button:disabled { opacity: 0.6; cursor: not-allowed; }
    .discovery-config-grid { display: flex; flex-direction: column; gap: ${SPACING.sm}; }
    .discovery-config-card { flex: 1 1 auto; min-width: 0; width: 100%; background: rgba(14, 22, 34, 0.7); border: 1px solid ${COLORS.border}; border-radius: ${RADIUS.md}; }
    .discovery-mode-inner {
      display: flex;
      flex-direction: column;
      gap: ${SPACING.xs};
      margin-top: ${SPACING.xs};
    }
    .discovery-mode-inner.is-disabled {
      opacity: 0.72;
    }
    .discovery-section {
      display: flex;
      flex-direction: column;
      gap: ${SPACING.xs};
    }
    .discovery-section-title {
      font-size: 0.72em;
      color: ${COLORS.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-family: ${FONTS.display};
      margin-top: ${SPACING.xs};
    }
    .discovery-footer { align-items: center; justify-content: flex-start; gap: ${SPACING.sm}; flex-wrap: wrap; padding: ${SPACING.sm} ${SPACING.md}; background: rgba(14, 22, 34, 0.75); border-top: 1px solid ${COLORS.border}; }
    .discovery-main-button {
      width: auto;
      flex: 1 1 160px;
      padding: ${SPACING.sm} ${SPACING.md};
      border: 1px solid ${COLORS.border};
      border-radius: ${RADIUS.md};
      font-size: 0.8em;
      font-weight: 700;
      cursor: pointer;
      transition: all ${TIMING.slow};
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: ${FONTS.display};
    }
    .discovery-main-button.active { background: ${COLORS.accent}; color: #04131a; border-color: ${COLORS.accentHover}; box-shadow: 0 0 14px rgba(46, 211, 241, 0.35); }
    .discovery-main-button.inactive { background: rgba(28, 38, 58, 0.9); color: ${COLORS.textSecondary}; }
    .discovery-mode-config { margin-bottom: ${SPACING.xs}; padding: ${SPACING.sm}; background: rgba(18, 26, 40, 0.8); border-radius: ${RADIUS.md}; border: 1px solid rgba(90, 110, 150, 0.35); }
    .mode-checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      cursor: pointer;
      margin-bottom: 6px;
      font-size: 0.8em;
      color: ${COLORS.textPrimary};
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-family: ${FONTS.display};
    }
    .mode-checkbox-label input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
    .player-filter-info { margin-bottom: 4px; padding: 2px 0; }
    .player-filter-info small { color: ${COLORS.textSecondary}; font-size: 0.8em; }
    .capacity-range-wrapper { margin-top: 4px; }
    .capacity-range-visual { position: relative; padding: 8px 0 4px 0; }
    .capacity-track { position: relative; height: 6px; background: rgba(46, 211, 241, 0.2); border-radius: 3px; margin-bottom: ${SPACING.sm}; }
    .team-count-options-centered { display: flex; justify-content: space-between; gap: 10px; margin: ${SPACING.xs} 0; }
    .team-count-column { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; background: rgba(12, 18, 30, 0.6); padding: 5px; border-radius: ${RADIUS.sm}; border: 1px solid rgba(90, 110, 150, 0.25); }
    .team-count-column label { display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.78em; color: ${COLORS.textPrimary}; white-space: nowrap; user-select: none; }
    .team-count-column input[type="checkbox"] { width: 16px; height: 16px; margin: 0; }
    .select-all-btn { background: rgba(46, 211, 241, 0.15); color: ${COLORS.textPrimary}; border: 1px solid ${COLORS.borderAccent}; border-radius: ${RADIUS.sm}; padding: ${SPACING.xs} ${SPACING.sm}; font-size: 0.75em; cursor: pointer; flex: 1; text-align: center; margin: 0 2px; text-transform: uppercase; letter-spacing: 0.1em; font-family: ${FONTS.display}; }
    .select-all-btn:hover { background: rgba(46, 211, 241, 0.25); }
    .team-count-section > div:first-of-type { display: flex; gap: 5px; margin-bottom: ${SPACING.xs}; }
    .team-count-section > label { font-size: 0.8em; color: ${COLORS.textPrimary}; font-weight: 600; margin-bottom: 4px; display: block; text-transform: uppercase; letter-spacing: 0.08em; font-family: ${FONTS.display}; }
    .capacity-labels { display: flex; justify-content: space-between; align-items: center; margin-top: ${SPACING.sm}; }
    .three-times-checkbox { display: flex; align-items: center; gap: ${SPACING.xs}; font-size: 0.78em; color: ${COLORS.textPrimary}; margin: 0 5px; }
    .three-times-checkbox input[type="checkbox"] { width: 15px; height: 15px; }
    .capacity-range-fill { position: absolute; height: 100%; background: rgba(46, 211, 241, 0.5); border-radius: 3px; pointer-events: none; opacity: 0.7; transition: left 0.1s ease, width 0.1s ease; }
    .discovery-modifier-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: ${SPACING.xs};
    }
    .discovery-modifier-grid label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${SPACING.sm};
      font-size: 0.82em;
      color: ${COLORS.textSecondary};
      min-width: 0;
    }
    .discovery-modifier-grid label > span:first-child {
      flex: 1 1 auto;
      min-width: 0;
      color: ${COLORS.textPrimary};
      white-space: nowrap;
    }
    .discovery-binary-toggle {
      display: inline-grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2px;
      flex: 0 0 144px;
      min-width: 144px;
      padding: 2px;
      border: 1px solid ${COLORS.border};
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
      color: ${COLORS.textMuted};
      font-size: 0.66em;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-family: ${FONTS.display};
      transition: background ${TIMING.fast}, color ${TIMING.fast}, box-shadow ${TIMING.fast};
      user-select: none;
      white-space: nowrap;
    }
    .discovery-binary-option[aria-pressed="true"] .discovery-binary-label {
      color: ${COLORS.textPrimary};
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
    .capacity-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${COLORS.accent}; cursor: pointer; pointer-events: all; border: 2px solid rgba(5, 20, 26, 0.9); box-shadow: ${SHADOWS.sm}; }
    .capacity-slider-min { z-index: 2; }
    .capacity-slider-max { z-index: 1; }
    .capacity-label-group { display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .capacity-label-group label { font-size: 0.8em; color: ${COLORS.textSecondary}; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; font-family: ${FONTS.display}; }
    .capacity-value { font-size: 0.85em; color: #FFFFFF; font-weight: 600; min-width: 40px; text-align: center; }
    .capacity-inputs-hidden { display: none; }
    .discovery-status { display: flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; flex-wrap: wrap; }
    @keyframes statusPulse {
      0% { box-shadow: 0 0 0 0 rgba(20, 220, 170, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(20, 220, 170, 0); }
      100% { box-shadow: 0 0 0 0 rgba(20, 220, 170, 0); }
    }
    .status-indicator { width: 8px; height: 8px; border-radius: 50%; background: ${COLORS.success}; box-shadow: 0 0 10px rgba(20, 220, 170, 0.4); }
    .status-indicator.active { animation: statusPulse 2s infinite; }
    .status-indicator.inactive { animation: none; box-shadow: none; }
    .status-text { font-size: 0.8em; color: ${COLORS.textPrimary}; text-transform: uppercase; letter-spacing: 0.12em; font-family: ${FONTS.display}; }
    .search-timer { font-size: 0.8em; color: rgba(147, 197, 253, 0.9); font-weight: 500; font-family: ${FONTS.mono}; }
    .discovery-settings { display: flex; align-items: center; gap: ${SPACING.sm}; flex-wrap: wrap; }
    .discovery-toggle-label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.8em; color: ${COLORS.textPrimary}; font-family: ${FONTS.display}; text-transform: uppercase; letter-spacing: 0.08em; }
    .discovery-toggle-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }
    .current-game-info { margin: 6px 0; padding: 6px ${SPACING.sm}; background: rgba(46, 211, 241, 0.1); border-radius: ${RADIUS.sm}; font-size: 0.8em; color: rgba(147, 197, 253, 0.9); text-align: center; border: 1px solid rgba(46, 211, 241, 0.25); }
    .current-game-info.not-applicable { background: rgba(100, 100, 100, 0.1); color: ${COLORS.textMuted}; border-color: rgba(100, 100, 100, 0.2); font-style: italic; }
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
        box-shadow ${TIMING.fast},
        filter ${TIMING.fast},
        border-color ${TIMING.fast};
      animation: discoveryCardActiveBeacon 1.45s ease-in-out infinite;
    }

  `;
}
