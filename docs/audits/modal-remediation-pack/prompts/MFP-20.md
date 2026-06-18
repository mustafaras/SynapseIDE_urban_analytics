# MFP-20 — Test coverage + regression guardrails for all modals

| Field | Value |
|---|---|
| Trigger | P20, tests, guardrails |
| Priority / Phase | P2 / Phase 2 |
| Depends on | MFP-06 |
| Gate | general |
| Severity | medium |
| Proof required | unit-test, e2e-a11y |

## 1. Why this matters
Finding `audit-8`: modal-a11y tests exist **only** for Map Explorer (see `e2e/accessibility-audit.spec.ts`, which covers the map dialog, import hub, inspector, QA dock, and command palette). The base `Modal`, `GlobalSearch`, `KeysModal`, `SettingsModal`, `AiSettingsModal`, `WelcomeModal`, `UrbanAnalyticsModal`, `UnsavedChangesDialog`, `MapServiceDialog`, and `MapStartDialog` have no focus/Escape/axe coverage, so the fixes from MFP-06/08/09/10/12 etc. can silently regress. This prompt adds per-modal unit tests, a parametrized axe/focus e2e loop, and CI guardrails (no raw z-index literals in modal files; every `role="dialog"` has an accessible name). It depends on MFP-06 so the shared `assertDialogA11y` helper (introduced in MFP-07) and the conformant base Modal exist first. Together these enforce WCAG SC 2.1.2 (No Keyboard Trap), 2.4.3 (Focus Order), 4.1.2 (Name, Role, Value), and 1.4.10 (Reflow).

## 2. Current state (evidence)

The e2e a11y spec covers only Map Explorer / Urban flows — `e2e/accessibility-audit.spec.ts:165-197` (Prompt 03), `199-280` (Prompt 55), `282-373` (Prompt 39). The axe helper and focus-indicator assertion already exist and are reusable — `accessibility-audit.spec.ts:2`, `25-51`:
```ts
import { expectNoAxeViolations } from "./helpers/accessibility";
…
async function expectVisibleFocusIndicator(page: Page) { … }
```
…and the established axe call shape — `accessibility-audit.spec.ts:189`:
```ts
await expectNoAxeViolations(page, '[role="dialog"][aria-labelledby="map-explorer-title"]', "minor");
```
There is no loop that opens the non-map app modals (Settings, AI Settings, Global Search, Keys, Welcome, Unsaved, New File/Project) and runs axe + scoped-Escape + 320px reflow. No unit `.a11y.test.tsx` files exist for those modals (the `create` targets in this prompt do not yet exist).

The guardrails this prompt adds do not exist yet: bespoke modals still hardcode raw z-index literals (e.g. per MFP-15: AI Settings `1000`, Keys `2200`, Unsaved `9999`, gold bars `2147483648`), and there is no automated check that every `role="dialog"` carries `aria-labelledby`/`aria-label`.

## 3. Target state
- Each previously untested modal has ≥1 unit test using the shared `assertDialogA11y(render)` helper from MFP-07: asserts role + accessible name, initial focus moves in, `Tab`/`Shift+Tab` wrap, focus restores to the opener on close, and `Escape` closes.
- `e2e/accessibility-audit.spec.ts` gains a parametrized loop that, for each app modal, opens it, runs axe (no serious/critical), verifies scoped `Escape` returns focus to the trigger, and checks reflow at 320px.
- CI guardrails: an ESLint rule (or `color:guard`-style script) forbidding raw z-index literals in modal files, plus a check that any `role="dialog"` has an accessible name. `lint:no-tailwind-centerpanel` stays green. The whole thing passes under `npm run validate:rc`.

## 4. Implementation steps
1. Create the five `create` target unit specs and cover the remaining modals using `assertDialogA11y` (from MFP-07's `src/components/molecules/__tests__/Modal.test.tsx` helper — import or re-export it):
   - `src/components/ide/__tests__/GlobalSearch.a11y.test.tsx`
   - `src/components/ai/panel/__tests__/KeysModal.a11y.test.tsx`
   - `src/components/ai/settings/__tests__/AiSettingsModal.a11y.test.tsx`
   - `src/components/settings/__tests__/SettingsModal.a11y.test.tsx`
   - `src/components/ide/__tests__/UnsavedChangesDialog.a11y.test.tsx`
   Each renders the modal open, runs `assertDialogA11y`, and adds modal-specific assertions (e.g. GlobalSearch combobox/listbox semantics from MFP-12; AiSettings accessible name + Escape from MFP-08).
2. Extend `e2e/accessibility-audit.spec.ts` with a parametrized loop. Define an array of `{ name, open(page), dialogSelector, triggerSelector }` descriptors for each app modal (reuse the existing `openMapExplorerFromStore`/`openUrbanAnalyticsWorkbench` helpers and add openers for Settings/AI Settings/Global Search/Keys/Welcome/Unsaved). For each: open → `expectNoAxeViolations(page, dialogSelector, "serious")` → focus an in-dialog control, press `Escape`, assert the dialog is hidden and focus returns to the trigger → `page.setViewportSize({ width: 320, height: 800 })` and assert no horizontal overflow on the dialog.
3. Add CI guardrails:
   - A check (custom ESLint rule under the repo's lint config, or a `color:guard`-style node script) that fails when a file matching the modal globs contains a raw numeric `z-index:` / `zIndex:` literal instead of `var(--z-*)`.
   - A check that every `role="dialog"` occurrence is accompanied by `aria-labelledby` or `aria-label` (lint rule or grep-based assertion in the guardrail script).
   - Keep `lint:no-tailwind-centerpanel` green; wire the new checks so `npm run validate:rc` runs them.

## 5. Constraints & edge cases
- Use `@axe-core/playwright` via the existing `expectNoAxeViolations` helper (already imported in the spec) — do not add a second axe integration.
- Unit tests run in vitest + jsdom; satisfy `src/config/coveragePolicy.json`.
- Map Explorer a11y must stay green — the new e2e loop adds modals, it does not alter the existing Prompt 03/39/55 suites.
- The z-index guardrail must allow `var(--z-modal)`/`var(--z-system-banner)` (the tokens published by MFP-05) and only fail on raw literals.
- Depends on MFP-06: `assertDialogA11y` and the conformant base Modal must exist; if a modal under test is not yet conformant (e.g. MapServiceDialog before MFP-09), scope its assertions to what is fixed and note the gap.
- `exactOptionalPropertyTypes` applies to any test fixtures that pass optional props.

## 6. Acceptance criteria
- [ ] Every listed modal (base Modal, GlobalSearch, KeysModal, SettingsModal, AiSettingsModal, WelcomeModal, UrbanAnalyticsModal, UnsavedChangesDialog, MapServiceDialog, MapStartDialog) has ≥1 focus/Escape/axe test.
- [ ] `e2e/accessibility-audit.spec.ts` runs a parametrized per-modal loop (axe serious/critical clean, scoped Escape returns focus to trigger, 320px reflow).
- [ ] CI guardrails fail on a raw z-index literal in a modal file and on a `role="dialog"` without an accessible name.
- [ ] `lint:no-tailwind-centerpanel` stays green.
- [ ] `npm run validate:rc` passes end-to-end.

## 7. Validation
```bash
npm run validate:rc
# expands to: typecheck + lint + test + build + perf:budgets + e2e:ci
# (general gate; this prompt's validate IS the full RC gate)
```

## 8. Tests to add
- **Per-modal unit specs** (one per `create` target): import `assertDialogA11y(render)` from the MFP-07 helper and assert — initial focus moves into the dialog; `Tab` from the last focusable wraps to the first and `Shift+Tab` wraps backward; closing restores focus to the opener; `Escape` invokes the close path. Add modal-specific checks: GlobalSearch → input `role="combobox"` with `aria-expanded`/`aria-activedescendant` and results `role="listbox"`/`option` (per MFP-12); AiSettings → dialog has an accessible name and `Escape` closes (per MFP-08); SettingsModal → tablist/radio/listbox roles present and preserved (per MFP-16).
- **Parametrized e2e loop** (in `accessibility-audit.spec.ts`): a `for (const modal of MODALS)` `test()` that opens each modal, asserts `expectNoAxeViolations(page, modal.dialogSelector, "serious")`, focuses an in-dialog control, presses `Escape`, expects `dialog` hidden + `trigger` focused, then sets the viewport to 320px and asserts the dialog has no horizontal scroll. Tag `@a11y`.
- **Guardrail tests**: a small node/vitest test that the z-index linter flags a fixture file with `z-index: 9999` and passes a fixture using `var(--z-modal)`; and that the dialog-name check flags a `role="dialog"` without `aria-labelledby`/`aria-label`.

## 9. Proof checklist
- `proofs/MFP-20/unit-test.txt` — vitest run output for the new `.a11y.test.tsx` specs.
- `proofs/MFP-20/e2e-a11y.txt` — `npm run test:e2e:a11y` output showing the parametrized per-modal loop green.
- `proofs/MFP-20/validate-rc.txt` — `npm run validate:rc` output (the full RC gate) showing guardrails active and passing.
