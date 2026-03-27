# Tasks

## 1. Baseline Recovery

- [x] 1.1 Restore the last good committed userscript UI/runtime files as the
      implementation baseline
- [x] 1.2 Confirm the worktree no longer contains accidental rewrite changes
      outside this OpenSpec change, then remove the obsolete player-list boot
      path and sidebar layout reservation

## 2. OpenFront 0.30 Data Adaptation

- [x] 2.1 Adapt the existing lobby data source to the OpenFront `0.30` public
      queue model with minimal interface churn
- [x] 2.2 Extend helper and engine logic for `FFA`, `Team`, `Humans Vs
      Nations`, and Special-as-source behavior without redesigning the panel
      shell

## 3. Minimal UI Extension

- [x] 3.1 Add the needed `0.30` filters to the existing discovery panel while
      preserving the prior userscript look-and-feel, including the binary
      modifier exclusion controls and their final segmented-button usability
      polish
- [x] 3.2 Add the current-player join-modal highlight as a small additive
      enhancement consistent with the old accent language

## 4. Verification

- [x] 4.1 Run focused tests for queue compatibility, homepage card pulse
      behavior, joined-lobby suppression, current-player highlighting, and the
      final Team per-player matching semantics
- [x] 4.2 Run full verification and only then bump version/build for release
