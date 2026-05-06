# Remove Duos / Trios / Quads chips — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `Duos`, `Trios`, and `Quads` team-format chips from the lobby-discovery panel; rely on the existing per-team slider for the same constraint. Saved criteria with those values are silently coerced to `null` on load.

**Architecture:** UI-only filter simplification. The shared `parseTeamCount` helper continues to accept those strings for *lobby data* parsing (OpenFront still emits them). A new sanitize-side coercion in `sanitizeCriteria` drops them only from *user criteria*. The matching engine is untouched: a Duos lobby still matches when the per-team slider is at 2–2.

**Tech Stack:** TypeScript 5.3 (strict), Vitest + JSDOM, esbuild.

**Spec:** [docs/superpowers/specs/2026-05-06-remove-duos-trios-quads-design.md](docs/superpowers/specs/2026-05-06-remove-duos-trios-quads-design.md).

**Files touched:**
- `src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts` — add criteria-side coercion
- `src/modules/lobby-discovery/LobbyDiscoveryUI.ts` — remove chips, save/restore branches, dead auto-min wiring
- `tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts` — migration test, update legacy fixtures
- `tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts` — drop the auto-team-min describe block, add render assertion

---

## Task 1: Migration in `sanitizeCriteria` (TDD)

**Files:**
- Modify: `src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts`
- Test: `tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`

- [ ] **Step 1: Write the failing test**

Append this `describe` block at the bottom of `tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`, **inside** the outer `describe('LobbyDiscoveryHelpers', ...)` (i.e. before its closing `});` on line 354):

```ts
  describe('sanitizeCriteria — drops deprecated string team counts', () => {
    it('coerces teamCount: "Duos" to null and preserves slider range', () => {
      const result = sanitizeCriteria([
        { gameMode: 'Team', teamCount: 'Duos', minPlayers: 4, maxPlayers: 12 },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]!.teamCount).toBeNull();
      expect(result[0]!.minPlayers).toBe(4);
      expect(result[0]!.maxPlayers).toBe(12);
    });

    it('coerces teamCount: "Trios" to null', () => {
      const result = sanitizeCriteria([
        { gameMode: 'Team', teamCount: 'Trios', minPlayers: 6, maxPlayers: 18 },
      ]);
      expect(result[0]!.teamCount).toBeNull();
    });

    it('coerces teamCount: "Quads" to null', () => {
      const result = sanitizeCriteria([
        { gameMode: 'Team', teamCount: 'Quads', minPlayers: 8, maxPlayers: 24 },
      ]);
      expect(result[0]!.teamCount).toBeNull();
    });

    it('preserves teamCount: "Humans Vs Nations"', () => {
      const result = sanitizeCriteria([
        { gameMode: 'Team', teamCount: 'Humans Vs Nations', minPlayers: 2, maxPlayers: 62 },
      ]);
      expect(result[0]!.teamCount).toBe('Humans Vs Nations');
    });

    it('preserves numeric teamCount', () => {
      const result = sanitizeCriteria([
        { gameMode: 'Team', teamCount: 4, minPlayers: 2, maxPlayers: 16 },
      ]);
      expect(result[0]!.teamCount).toBe(4);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts -t "drops deprecated string team counts"`
Expected: 3 failures — the `Duos`, `Trios`, `Quads` cases assert `null` but get the string back. The HvN and numeric cases pass.

- [ ] **Step 3: Implement the coercion**

In `src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts`, **immediately above** `export function sanitizeCriteria(...)` at line 371, insert this private helper:

```ts
function sanitizeCriteriaTeamCount(
  value: string | number | null | undefined
): TeamCount | null {
  const parsed = parseTeamCount(value);
  if (parsed === 'Duos' || parsed === 'Trios' || parsed === 'Quads') {
    return null;
  }
  return parsed;
}
```

Then in `sanitizeCriteria`, change line 410 from:

```ts
      teamCount: gameMode === 'Team' ? parseTeamCount(candidate.teamCount ?? null) : null,
```

to:

```ts
      teamCount: gameMode === 'Team' ? sanitizeCriteriaTeamCount(candidate.teamCount ?? null) : null,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts -t "drops deprecated string team counts"`
Expected: all 5 cases PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/lobby-discovery/LobbyDiscoveryHelpers.ts tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts
git commit -m "feat(discovery): drop duos/trios/quads from saved criteria"
```

---

## Task 2: Update legacy fixture tests

**Files:**
- Modify: `tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`

The existing `'sanitizes legacy criteria...'` test (around lines 19–44) currently asserts that `teamCount: 'Duos'` survives sanitization. After Task 1, it survives no longer — it becomes `null`. Two existing clamping tests (lines 320, 338) feed `'Duos'` / `'Trios'` as criteria fixtures; we update them to use `null` so test inputs reflect the post-migration shape.

- [ ] **Step 1: Run the test file to see which existing tests now fail**

Run: `npx vitest run tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`
Expected: previously-passing tests now fail at:
- `'sanitizes legacy criteria...'` — expected `teamCount: 'Duos'`, got `null`.
- The two clamping tests at lines 318 and 336 still pass (their assertions don't touch `teamCount`), but their input fixtures use deprecated values.

- [ ] **Step 2: Fix the legacy-criteria assertion**

In `tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`, in the `'sanitizes legacy criteria by keeping FFA and Team entries'` test, change the expected output array (lines 33–43) so the `Duos` entry's `teamCount` becomes `null`:

```ts
    expect(criteria).toEqual([
      { gameMode: 'FFA', teamCount: null, minPlayers: 10, maxPlayers: 30 },
      { gameMode: 'Team', teamCount: null, minPlayers: 8, maxPlayers: 16 },
      { gameMode: 'Team', teamCount: 3, minPlayers: 9, maxPlayers: 18 },
      {
        gameMode: 'Team',
        teamCount: 'Humans Vs Nations',
        minPlayers: 12,
        maxPlayers: 40,
      },
    ]);
```

(Input array on lines 20–31 is left unchanged — it represents legacy persisted data.)

- [ ] **Step 3: Update the two clamping-test inputs**

In the `'clamps Team minPlayers below 2 to 2'` test (around line 318), change line 320 from:

```ts
        { gameMode: 'Team', teamCount: 'Duos', minPlayers: 1, maxPlayers: 62 },
```

to:

```ts
        { gameMode: 'Team', teamCount: null, minPlayers: 1, maxPlayers: 62 },
```

In the `'preserves Team minPlayers >= 2 untouched even if not on stops list'` test (around line 336), change line 338 from:

```ts
        { gameMode: 'Team', teamCount: 'Trios', minPlayers: 7, maxPlayers: 12 },
```

to:

```ts
        { gameMode: 'Team', teamCount: 3, minPlayers: 7, maxPlayers: 12 },
```

- [ ] **Step 4: Run the helpers test file**

Run: `npx vitest run tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/modules/lobby-discovery/LobbyDiscoveryHelpers.test.ts
git commit -m "test(discovery): drop duos/trios from legacy criteria fixtures"
```

---

## Task 3: Remove the three chips from the UI render

**Files:**
- Modify: `src/modules/lobby-discovery/LobbyDiscoveryUI.ts`

This task removes the visible chips and merges HvN into the numeric-teams row. UI test updates come in Task 5.

- [ ] **Step 1: Remove Duos/Trios/Quads chip render and merge HvN row**

In `src/modules/lobby-discovery/LobbyDiscoveryUI.ts`, replace the block at lines 992–1006:

```ts
              <div class="ld-format-label">FORMAT</div>
              <div class="ld-formats">
                ${this.renderChip('discovery-team-duos', 'Duos', 'Duos')}
                ${this.renderChip('discovery-team-trios', 'Trios', 'Trios')}
                ${this.renderChip('discovery-team-quads', 'Quads', 'Quads')}
                ${this.renderChip('discovery-team-hvn', 'Humans Vs Nations', 'HvN')}
              </div>
              <div class="ld-formats">
                ${this.renderChip('discovery-team-2', '2', '2 teams')}
                ${this.renderChip('discovery-team-3', '3', '3 teams')}
                ${this.renderChip('discovery-team-4', '4', '4 teams')}
                ${this.renderChip('discovery-team-5', '5', '5 teams')}
                ${this.renderChip('discovery-team-6', '6', '6 teams')}
                ${this.renderChip('discovery-team-7', '7', '7 teams')}
              </div>
```

with:

```ts
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
```

- [ ] **Step 2: Trim `TEAM_PRESET_IDS`**

Replace lines 45–50:

```ts
const TEAM_PRESET_IDS: Array<[string, string, number | null]> = [
  ['discovery-team-duos', 'Duos', 2],
  ['discovery-team-trios', 'Trios', 3],
  ['discovery-team-quads', 'Quads', 4],
  ['discovery-team-hvn', 'Humans Vs Nations', null],
];
```

with:

```ts
const TEAM_PRESET_IDS: Array<[string, string, number | null]> = [
  ['discovery-team-hvn', 'Humans Vs Nations', null],
];
```

- [ ] **Step 3: Strip the deprecated branches in `getAllTeamCountValues`**

In `src/modules/lobby-discovery/LobbyDiscoveryUI.ts`, replace the block at lines 521–526:

```ts
      if (
        value === 'Duos' ||
        value === 'Trios' ||
        value === 'Quads' ||
        value === 'Humans Vs Nations'
      ) {
        values.push(value);
```

with:

```ts
      if (value === 'Humans Vs Nations') {
        values.push(value);
```

- [ ] **Step 4: Strip the deprecated branches in `setTeamCountSelections`**

Replace the block at lines 723–736:

```ts
  private setTeamCountSelections(values: Array<TeamCount | null | undefined>): void {
    for (const teamCount of values) {
      let checkbox: HTMLInputElement | null = null;
      if (teamCount === 'Duos') checkbox = document.getElementById('discovery-team-duos') as HTMLInputElement;
      else if (teamCount === 'Trios') checkbox = document.getElementById('discovery-team-trios') as HTMLInputElement;
      else if (teamCount === 'Quads') checkbox = document.getElementById('discovery-team-quads') as HTMLInputElement;
      else if (teamCount === 'Humans Vs Nations') checkbox = document.getElementById('discovery-team-hvn') as HTMLInputElement;
      else if (typeof teamCount === 'number') checkbox = document.getElementById(`discovery-team-${teamCount}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = true;
        this.syncChipState(checkbox.id);
      }
    }
  }
```

with:

```ts
  private setTeamCountSelections(values: Array<TeamCount | null | undefined>): void {
    for (const teamCount of values) {
      let checkbox: HTMLInputElement | null = null;
      if (teamCount === 'Humans Vs Nations') checkbox = document.getElementById('discovery-team-hvn') as HTMLInputElement;
      else if (typeof teamCount === 'number') checkbox = document.getElementById(`discovery-team-${teamCount}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = true;
        this.syncChipState(checkbox.id);
      }
    }
  }
```

(After Task 1, persisted `'Duos' | 'Trios' | 'Quads'` values are coerced to `null` before they reach this method, so the deprecated branches are unreachable.)

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/modules/lobby-discovery/LobbyDiscoveryUI.ts
git commit -m "feat(discovery): remove duos/trios/quads chips, fold hvn into team row"
```

---

## Task 4: Remove the now-dead `applyAutoTeamMin` wiring

**Files:**
- Modify: `src/modules/lobby-discovery/LobbyDiscoveryUI.ts`

After Task 3, `TEAM_PRESET_IDS` contains only HvN with `min: null`, so `applyAutoTeamMin` is a no-op and its call site can never fire. Delete both.

- [ ] **Step 1: Remove the call site for `applyAutoTeamMin`**

In `src/modules/lobby-discovery/LobbyDiscoveryUI.ts`, replace the block at lines 860–868:

```ts
        this.syncChipState(id);
        if (
          id === 'discovery-team-duos' ||
          id === 'discovery-team-trios' ||
          id === 'discovery-team-quads'
        ) {
          this.applyAutoTeamMin();
        }
        this.refreshCriteria();
      });
```

with:

```ts
        this.syncChipState(id);
        this.refreshCriteria();
      });
```

- [ ] **Step 2: Delete the `applyAutoTeamMin` method**

Delete the entire method body at lines 536–546:

```ts
  private applyAutoTeamMin(): void {
    const checked = TEAM_PRESET_IDS.filter(
      ([id, , min]) =>
        min !== null && (document.getElementById(id) as HTMLInputElement | null)?.checked
    ).map(([, , min]) => min as number);

    if (checked.length === 0) return;

    const newMin = Math.min(...checked);
    this.teamSlider?.setMin(newMin);
  }
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors. (`TEAM_PRESET_IDS` is still referenced via `ALL_TEAM_IDS`, so the array itself stays.)

- [ ] **Step 4: Commit**

```bash
git add src/modules/lobby-discovery/LobbyDiscoveryUI.ts
git commit -m "refactor(discovery): drop dead applyAutoTeamMin path"
```

---

## Task 5: Delete the auto-team-min UI tests, add a render assertion

**Files:**
- Modify: `tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts`

The whole `auto-set team min on Duos/Trios/Quads toggle` describe block is now testing deleted behavior.

- [ ] **Step 1: Delete the obsolete describe block**

In `tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts`, delete lines 813–910 — the entire `describe('auto-set team min on Duos/Trios/Quads toggle', () => { ... })`. The closing `});` at line 911 (which closes the outer `describe`) stays.

- [ ] **Step 2: Add a render assertion that the three chips no longer exist**

In `tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts`, find the outer `describe('LobbyDiscoveryUI', ...)`. Inside it, append this `describe` block immediately before that outer describe's closing `});`:

```ts
  describe('removed Duos/Trios/Quads chips', () => {
    it('does not render discovery-team-duos, -trios, or -quads', () => {
      store.set(STORAGE_KEYS.lobbyDiscoverySettings, {
        criteria: [],
        discoveryEnabled: true,
        soundEnabled: true,
        isTeamTwoTimesMinEnabled: false,
      });

      ui = new LobbyDiscoveryUI();

      expect(document.getElementById('discovery-team-duos')).toBeNull();
      expect(document.getElementById('discovery-team-trios')).toBeNull();
      expect(document.getElementById('discovery-team-quads')).toBeNull();
      expect(document.getElementById('discovery-team-hvn')).not.toBeNull();
      expect(document.getElementById('discovery-team-2')).not.toBeNull();
    });
  });
```

(`store` and `ui` are declared at the outer-`describe` scope (lines 37–38) and `mountHomepageCards()` already runs in `beforeEach` (line 79), so the new test reuses both without extra setup.)

- [ ] **Step 3: Run the UI test file**

Run: `npx vitest run tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts`
Expected: all tests PASS, including the new render assertion.

- [ ] **Step 4: Commit**

```bash
git add tests/modules/lobby-discovery/LobbyDiscoveryUI.test.ts
git commit -m "test(discovery): drop auto-min tests, assert chips removed"
```

---

## Task 6: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests PASS, no skipped suites.

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 3: Sanity-check residual references**

Run: `rg -n "discovery-team-duos|discovery-team-trios|discovery-team-quads|applyAutoTeamMin" src tests`
Expected: zero results.

Run: `rg -n "Duos|Trios|Quads" src/modules/lobby-discovery/`
Expected: only matches in lobby-data interpreters — `parseTeamCount` (lines ~56–58), `getPlayersPerTeam` (~116–118), `getGameDetailsText` (~187–189), `getLobbyModeLabel` (~222), and the `TeamCount` type. Zero matches in `LobbyDiscoveryUI.ts`.

- [ ] **Step 4: Manual smoke test in dev mode**

Run: `npm run dev`
Then load the userscript in the browser. Expected:
- The FORMAT row shows a single line: `HvN | 2 | 3 | 4 | 5 | 6 | 7 teams`.
- No Duos/Trios/Quads chips appear.
- Saving a criterion with the per-team slider at 2–2 still triggers a notification on a real Duos lobby.
- Reloading the page after upgrading from a save that contained `teamCount: "Duos"` produces no console errors and the criterion shows no team-format chip selected (slider min/max preserved).

- [ ] **Step 5: No release-build commit yet**

Per `CLAUDE.md`, `dist/bundle.user.js` is rebuilt at release time via `npm run build:prod` and version bump. **Do not** rebuild or bump version as part of this plan.
