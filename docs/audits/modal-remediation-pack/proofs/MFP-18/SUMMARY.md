# MFP-18 Proof Summary

Prompt: `MFP-18` - Map dialog family cleanup

Implementation commit: `ed9de0b7cb733346d09c4f6a29fe6432d0559635`

## Scope completed

- Removed the dead `MapStartDialog` demo-pack insertion path, unused badge rendering, and stale dialog ref.
- Added `wrapped` mode to `MapStartDialog` so hosted usage can avoid duplicate `aria-modal` ownership.
- Fixed `MapExportDialog` and `MapColumnarImportDialog` outer grids so they collapse cleanly at 320px.
- Memoized CSV import profiling in `MapCsvImportDialog` so rerenders do not recompute the profile unless the session or mapping changes.
- Consumed the `height` parameter in `MapWorkspaceShell` rail positioning to remove the dead parameter and avoid over-constrained absolute layout.
- Updated `prompts.schema.json` to include the canonical manifest fields used by `prompts.json` (`canonicalProductName.candidates`, per-prompt `gate`, and per-prompt `spec`).

## Gate evidence

- `typecheck.txt` / `typecheck-clean.txt`: `npm run typecheck` passed.
- `lint.txt`: `npm run lint:errors` passed.
- `lint-no-tailwind-centerpanel.txt`: `npm run lint:no-tailwind-centerpanel` passed.
- `deadcode.txt` / `deadcode-clean.txt`: `npm run deadcode` passed.
- `test-map.txt`: `npx vitest run src/centerpanel/components/map` passed, 98 files / 937 tests.
- `schema-validation.txt`: `prompts.json` validates against `prompts.schema.json`.
- `screenshot/capture.txt`: Playwright/Vite proof harness passed at 320px with no document-level horizontal overflow.

## Screenshot evidence

- `screenshot/map-export-320-after.png`
- `screenshot/map-columnar-320-after.png`

The screenshot proof records the final 320px state. True pre-edit screenshots were not captured before the remediation; the after-state screenshots and overflow assertions are retained as the reproducibility evidence for this prompt.
