# Tasks

## 1. Baseline Recovery

- [ ] 1.1 Restore the last good committed userscript UI/runtime files as the
      implementation baseline
- [ ] 1.2 Confirm the worktree no longer contains accidental rewrite changes
      outside this OpenSpec change

## 2. OpenFront 0.30 Data Adaptation

- [ ] 2.1 Adapt the existing lobby data source to the OpenFront `0.30` public
      queue model with minimal interface churn
- [ ] 2.2 Extend helper and engine logic for `FFA`, `Team`, `Humans Vs
      Nations`, and Special-as-source behavior without redesigning the panel
      shell

## 3. Minimal UI Extension

- [ ] 3.1 Add the needed `0.30` filters to the existing discovery panel while
      preserving the prior userscript look-and-feel
- [ ] 3.2 Add the current-player join-modal highlight as a small additive
      enhancement consistent with the old accent language

## 4. Verification

- [ ] 4.1 Run focused tests for queue compatibility, notify-only behavior, and
      current-player highlighting
- [ ] 4.2 Run full verification and only then bump version/build for release
