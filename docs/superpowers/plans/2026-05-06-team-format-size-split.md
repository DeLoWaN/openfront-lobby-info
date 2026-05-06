# Team Panel Format/Size Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the Teams panel into a `FORMAT` subsection (Humans Vs Nations only) and a `NUMBER OF TEAMS` subsection (chips 2–7, number-only labels), and remove the `All` / `None` bulk-select buttons.

**Architecture:** A markup-only change inside `discovery-team-config`. Existing chip ids and values stay intact, so persistence, engine, and helpers (`getAllTeamCountValues`, `setTeamCountSelections`, `setAllTeamCounts`, `ALL_TEAM_IDS`) keep working untouched. Two click handlers tied to the deleted buttons are removed.

**Tech Stack:** TypeScript (strict), esbuild, Vitest with JSDOM.

**Spec:** [docs/superpowers/specs/2026-05-06-team-format-size-split-design.md](../specs/2026-05-06-team-format-size-split-design.md)

---

### Task 1: Add failing test asserting the new layout

**Files:**
- Modify: `tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts` (extend the block at line ~830 — same describe used by the duos/trios contract test)

- [ ] **Step 1: Add the failing test**

Append this test inside the existing `describe('Removed legacy team chips', ...)` block (or rename the block to `'Team panel layout'` if you prefer — keep one block, no duplication):

```typescript
    it('renders FORMAT and NUMBER OF TEAMS subsections without All/None buttons', () => {
      Object.assign(globalThis as Record<string, unknown>, {
        GM_getValue: () => undefined,
        GM_setValue: () => undefined,
      });

      ui = new LobbyDiscoveryUI();

      // FORMAT subsection contains only the HvN chip
      const hvnChip = document.getElementById('discovery-team-hvn') as HTMLInputElement | null;
      expect(hvnChip).not.toBeNull();
      const hvnLabel = hvnChip?.closest('label');
      expect(hvnLabel?.textContent?.trim()).toBe('Humans Vs Nations');

      // NUMBER OF TEAMS subsection: count chips show only the number
      for (const n of [2, 3, 4, 5, 6, 7]) {
        const chip = document.getElementById(`discovery-team-${n}`) as HTMLInputElement | null;
        expect(chip).not.toBeNull();
        expect(chip?.closest('label')?.textContent?.trim()).toBe(String(n));
      }

      // Both subsection labels exist
      const labels = Array.from(document.querySelectorAll('.ld-format-label')).map((el) =>
        el.textContent?.trim()
      );
      expect(labels).toContain('FORMAT');
      expect(labels).toContain('NUMBER OF TEAMS');

      // All / None buttons are gone
      expect(document.getElementById('discovery-team-select-all')).toBeNull();
      expect(document.getElementById('discovery-team-deselect-all')).toBeNull();
    });
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts`
Expected: the new test FAILs because the `HvN` label, the `NUMBER OF TEAMS` mini-header, and the count-chip labels do not yet match.

---

### Task 2: Update the markup — split into two subsections, drop bulk-select buttons

**Files:**
- Modify: `src/modules/lobby-discovery/LobbyDiscoveryUI.ts` (the block currently at lines 962–975)

- [ ] **Step 1: Replace the FORMAT block + count row + All/None row with two labeled subsections**

Find this block:

```typescript
              <div class="ld-format-label">FORMAT</div>
              <div class="ld-formats">
                ${this.renderChip('discovery-team-hvn', 'Humans Vs Nations', 'HvN')}
                ${this.renderChip('discovery-team-2', '2', '2 teams')}
                ${this.renderChip('discovery-team-3', '3', '3 teams')}
                ${this.renderChip('discovery-team-4', '4', '4 teams')}
                ${this.renderChip('discovery-team-5', '5', '5 teams')}
                ${this.renderChip('discovery-team-6', '6', '6 teams')}
                ${this.renderChip('discovery-team-7', '7', '7 teams')}
              </div>
              <div class="ld-formats" style="margin-bottom: 14px;">
                <button type="button" id="discovery-team-select-all" class="ld-chip">All</button>
                <button type="button" id="discovery-team-deselect-all" class="ld-chip">None</button>
              </div>
```

Replace it with:

```typescript
              <div class="ld-format-label">FORMAT</div>
              <div class="ld-formats">
                ${this.renderChip('discovery-team-hvn', 'Humans Vs Nations', 'Humans Vs Nations')}
              </div>
              <div class="ld-format-label" style="margin-top: 10px;">NUMBER OF TEAMS</div>
              <div class="ld-formats" style="margin-bottom: 14px;">
                ${this.renderChip('discovery-team-2', '2', '2')}
                ${this.renderChip('discovery-team-3', '3', '3')}
                ${this.renderChip('discovery-team-4', '4', '4')}
                ${this.renderChip('discovery-team-5', '5', '5')}
                ${this.renderChip('discovery-team-6', '6', '6')}
                ${this.renderChip('discovery-team-7', '7', '7')}
              </div>
```

Note:
- The HvN chip's visible label changes from `HvN` to `Humans Vs Nations` (3rd arg). The `value` attribute is unchanged.
- Count chips drop `' teams'` from the visible label.
- The `margin-top: 10px;` inline style on the second `.ld-format-label` keeps the two subsections visually separated. The `margin-bottom: 14px;` on the count row preserves the spacing the deleted button row used to provide before the slider.

---

### Task 3: Remove the click handlers wired to the deleted buttons

**Files:**
- Modify: `src/modules/lobby-discovery/LobbyDiscoveryUI.ts` (lines 810–817)

- [ ] **Step 1: Delete both `addEventListener` calls**

Find:

```typescript
    document.getElementById('discovery-team-select-all')?.addEventListener('click', () => {
      this.setAllTeamCounts(true);
      this.refreshCriteria();
    });
    document.getElementById('discovery-team-deselect-all')?.addEventListener('click', () => {
      this.setAllTeamCounts(false);
      this.refreshCriteria();
    });

```

Delete it entirely (including the trailing blank line). Leave the surrounding `twoTimesCheckbox` and `discovery-reset` handlers intact.

Do **not** delete `setAllTeamCounts` — `resetAll()` still calls it (line ~736).

---

### Task 4: Verify the new test passes and the suite is green

- [ ] **Step 1: Re-run the targeted test**

Run: `npx vitest run tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts`
Expected: PASS, including the new layout test from Task 1.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all suites green. The legacy contract test at line 827 (asserting `discovery-team-hvn` and `discovery-team-2` exist) keeps passing because IDs are unchanged.

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors.

---

### Task 5: Build the production bundle and commit

- [ ] **Step 1: Build**

Run: `npm run build:prod`
Expected: `dist/bundle.user.js` regenerated without errors.

- [ ] **Step 2: Commit everything as one atomic change**

```bash
git add src/modules/lobby-discovery/LobbyDiscoveryUI.ts \
        tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts \
        dist/bundle.user.js
git commit -m "refactor(discovery): split team panel into format and team-count subsections"
```

---

## Self-review notes

- Spec coverage: layout change (Task 2), label rewordings (Task 2), All/None removal (Tasks 2 + 3), backwards-compat assertion via stable ids (Task 1's test reuses existing ids), build step (Task 5). All spec sections covered.
- No placeholders. Every code change is shown verbatim.
- Helper preservation: `setAllTeamCounts` intentionally kept — flagged inline in Task 3.
