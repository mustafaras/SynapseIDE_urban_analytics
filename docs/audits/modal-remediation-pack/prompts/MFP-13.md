# MFP-13 — Migrate bespoke focus traps onto the shared hook

| Field | Value |
|---|---|
| Trigger | P13, migrate-traps, dedupe-traps |
| Priority / Phase | P2 / Phase 2 |
| Depends on | MFP-02 |
| Gate | gis |
| Severity | medium |
| Proof required | typecheck-clean, unit-test, e2e-a11y |

## 1. Why this matters
Findings `M4`, `MX4`, `UA1`: five dialogs each hand-roll a focus trap instead of using the audited shared `useFocusTrap` (promoted to `src/hooks/useFocusTrap.ts` in MFP-02, re-exported from `src/centerpanel/components/map/useFocusTrap.ts`). Duplication means bugs are fixed in one copy and not the others. The most serious is `UA1`: `UrbanAnalyticsModal` binds its Tab listener to the modal element rather than `document`, so once focus escapes the panel the trap cannot recapture it. Consolidating onto one path satisfies WCAG **2.4.3 Focus Order** / **2.1.2 No Keyboard Trap** consistently and shrinks the maintenance surface. The shared hook re-queries focusables per Tab, filters hidden/`aria-hidden`/negative-tabindex nodes, captures+restores the opener with a `document.contains` guard, wraps both directions, and listens at the `document` level in capture phase.

## 2. Current state (evidence)
The canonical hook (`src/centerpanel/components/map/useFocusTrap.ts:51`, post-MFP-02 also at `src/hooks/useFocusTrap.ts`) exposes `{ trapRef, activate }` and binds at document level (`:105`):
```ts
export function useFocusTrap(active: boolean): { trapRef: React.RefObject<HTMLDivElement | null>; activate: () => void; }
...
document.addEventListener("keydown", onKeyDown, true);
```
Five hand-rolled copies remain:

1. `KeysModal.tsx` — separate restore effect (`:99-118`) plus an on-element `onKeyDownTrap` (`:120-136`) that re-implements the query/wrap by hand:
```tsx
const onKeyDownTrap = (e: React.KeyboardEvent) => {
  if (e.key !== 'Tab') return;
  const focusables = Array.from(node.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), ...'));
  ...
};
```
2. `UnsavedChangesDialog.tsx:119-132` — `handleKeyDown` cycles a hardcoded `[cancelRef, discardRef, saveRef]` array, with restore in a separate effect (`:112-116`).
3. `WelcomeModal.tsx` — copies the selector/query helpers `FOCUSABLE_MODAL_SELECTOR` (`:60-68`) and `getFocusableModalElements` (`:70-82`), then a window-bound Tab handler (`:519-562`).
4. `UrbanAnalyticsModal.tsx:782-807` — trap bound to the **modal element** (`el.addEventListener('keydown', onKeyDown)`, `:805`), not `document` → `UA1`:
```tsx
const el = modalRef.current!;
...
el.addEventListener('keydown', onKeyDown);
return () => el.removeEventListener('keydown', onKeyDown);
```
5. `MapDialogShell.tsx:139-265` — its own `getFocusableElements` + `handleDialogKeyDown` Tab/Escape logic and restore effect (`:220-231`).

## 3. Target state
Before: five independent trap implementations, one (UrbanAnalyticsModal) element-bound and broken.
After: each modal consumes `useFocusTrap(isOpen)` from `@/hooks/useFocusTrap`, attaches `trapRef` to its dialog/panel element, and removes its bespoke Tab loop and manual restore effect (the hook restores). `WelcomeModal`'s `FOCUSABLE_MODAL_SELECTOR`/`getFocusableModalElements` are deleted. `UrbanAnalyticsModal`'s document-level capture closes `UA1`. Escape-to-close stays per-modal (the hook does not own Escape); only the Tab trap + restore migrate.

## 4. Implementation steps
1. In each of the five files, import `{ useFocusTrap }` from `@/hooks/useFocusTrap` and call `const { trapRef } = useFocusTrap(isOpenFlag)` (the flag is `open`/`active`/`isOpen` per file).
2. Attach `trapRef` to the existing dialog/panel ref target: `KeysModal` `Dialog` (currently `dialogRef`, `:167`), `UnsavedChangesDialog` panel/backdrop, `WelcomeModal` panel (`ref`, `:612`), `UrbanAnalyticsModal` `modalRef`, `MapDialogShell` `panelRef` (`:312`). Where a ref is already used for layout, either reuse `trapRef` or merge refs.
3. Delete each bespoke Tab handler: `KeysModal.onKeyDownTrap` (`:120-136`) and its `onKeyDown` wiring (`:172`); `UnsavedChangesDialog`'s Tab branch in `handleKeyDown` (keep the Escape branch); `WelcomeModal`'s Tab block in the `:519-562` effect (keep Escape); `UrbanAnalyticsModal`'s whole `:782-807` effect; `MapDialogShell`'s Tab branch in `handleDialogKeyDown` (keep Escape).
4. Remove the now-redundant manual restore effects: `KeysModal` `:99-118`, `UnsavedChangesDialog` `:112-116`, `WelcomeModal` `:564-587` previous-focus restore, `MapDialogShell` `:220-231` (the hook restores via `document.contains` guard).
5. Delete `WelcomeModal.tsx:60-82` (`FOCUSABLE_MODAL_SELECTOR`, `getFocusableModalElements`) once nothing references them.
6. Keep each modal's Escape handler intact (per-modal `onClose`/`handleClose`).

## 5. Constraints & edge cases
- `gis` + `analytics` gates apply (touches `centerpanel/` and `urbanAnalytics/`); no Tailwind in `centerpanel/`.
- No behavioural regression: trap + restore must still work in all five; `UrbanAnalyticsModal` must now recapture escaped focus (UA1 fix).
- `MapDialogShell` retains its draggable/resize/`nonBlocking` behaviour — when `nonBlocking` the original skipped trapping (`:240`); preserve that by passing `useFocusTrap(!nonBlocking)` or guarding equivalently.
- Bundle must not grow — net deletion of duplicate code.
- `exactOptionalPropertyTypes`: keep ref types precise (`RefObject<HTMLDivElement | null>`).

## 6. Acceptance criteria
- [ ] All five modals keep trap + focus-restore behaviour.
- [ ] Exactly one audited trap implementation remains (`src/hooks/useFocusTrap.ts`).
- [ ] `UrbanAnalyticsModal` recaptures focus that escapes the panel (UA1 resolved).
- [ ] `WelcomeModal`'s `FOCUSABLE_MODAL_SELECTOR`/`getFocusableModalElements` are gone.
- [ ] Bundle does not grow; map e2e a11y stays green.

## 7. Validation
```bash
npm run typecheck
npm run test:analytics
npx vitest run src/centerpanel/components/map
npm run test:e2e:a11y
# gate: gis
```

## 8. Tests to add
Reuse the `assertDialogA11y` helper from MFP-07 across all five: assert initial focus enters the dialog, Tab/Shift+Tab wrap at both ends, focus restores to the opener on close. Add a regression test for `UrbanAnalyticsModal` that programmatically moves `document.activeElement` outside the panel, fires Tab, and asserts focus returns inside (proves the document-level recapture). Confirm `src/centerpanel/components/map/__tests__/map-accessibility.test.ts` still passes for `MapDialogShell`.

## 9. Proof checklist
- [ ] `proofs/MFP-13/typecheck-clean.txt` — `npm run typecheck` output.
- [ ] `proofs/MFP-13/unit-test.txt` — `npm run test:analytics` + `npx vitest run src/centerpanel/components/map` output.
- [ ] `proofs/MFP-13/e2e-a11y.txt` — `npm run test:e2e:a11y` output (map a11y green).
