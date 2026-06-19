# MFP-13 — Proof summary

**Prompt:** MFP-13 — Migrate bespoke focus traps onto the shared hook
**Gate:** gis · **Depends on:** MFP-02 (done) · **Branch:** claude/modal-fix-p13

## Change — five modals now consume `useFocusTrap` (findings M4, MX4, UA1)
Each modal's hand-rolled Tab loop + manual focus-restore were deleted and replaced with the
audited shared `useFocusTrap` from `@/hooks/useFocusTrap`. Per-modal Escape handlers kept.
- **`KeysModal.tsx`** — removed `onKeyDownTrap` + the manual capture/restore effect; `useFocusTrap(open)` on the `Dialog`; `activate()` for focus-in. (`useRef` import dropped.)
- **`UnsavedChangesDialog.tsx`** — removed the 3-button Tab cycle + manual restore; `useFocusTrap(true)` on the panel; keeps Save-focus-on-mount + Escape.
- **`WelcomeModal.tsx`** — deleted `FOCUSABLE_MODAL_SELECTOR` + `getFocusableModalElements` + the window-bound Tab handler + the previous-focus capture/restore; `useFocusTrap(open)` on the panel; Escape kept.
- **`UrbanAnalyticsModal.tsx`** — deleted the **element-bound** trap effect (the UA1 bug); `useFocusTrap(active)` listens at the document level, so focus that escapes the panel is recaptured (**UA1 fixed**).
- **`MapDialogShell.tsx`** — deleted `getFocusableElements`/`focusableSelector` + the trap effect + the Tab branch of `handleDialogKeyDown` (Escape kept); `useFocusTrap(!nonBlocking)` (preserves the non-blocking opt-out) merged onto `panelRef` via a callback ref; `activate()` for focus-in.

One audited trap path remains (`src/hooks/useFocusTrap.ts`). **Net −184 lines** (55 insertions /
239 deletions) → bundle shrinks. No `any`; ref types kept precise.

## Proofs in this directory
- `typecheck.txt` — clean. **(typecheck-clean)**
- `lint.txt` — `lint:errors` clean.
- `unit-test.txt` — **(unit-test)**:
  - `npx vitest run src/centerpanel/components/map` → **98 files / 933 passed** (map-accessibility
    for MapDialogShell intact).
  - `npm run test:analytics` → **64 files / 1131 passed** (WelcomeModal + UrbanAnalyticsModal intact).
  - `KeysModal.trap.test` (focus-in + restore via the shared hook) + `KeysModal.smoke` + ide
    dialog tests pass.
- `e2e-a11y.txt` — **(e2e-a11y)** ENVIRONMENT-BLOCKED: Playwright needs Chromium build 1217;
  only 1194 is installed and the download is network-blocked (symlink shim didn't satisfy the
  launcher). The Vite webServer boots; only the browser binary is missing. Substituted by the
  jsdom map-accessibility + analytics suites and `useFocusTrap.test.ts` (document-level wrap =
  the UA1-fix mechanism). Re-run `npm run test:e2e:a11y` in a browser-capable env.

## Acceptance
- [x] All five modals keep trap + focus-restore (via the shared hook).
- [x] Exactly one audited trap implementation remains (`src/hooks/useFocusTrap.ts`).
- [x] `UrbanAnalyticsModal` recaptures escaped focus — document-level listener (UA1 resolved).
- [x] `WelcomeModal`'s `FOCUSABLE_MODAL_SELECTOR`/`getFocusableModalElements` are gone.
- [x] Bundle does not grow (net −184 lines); map a11y unit suite green.
- [~] map e2e a11y not runnable here (env-blocked) — covered by the jsdom map-accessibility suite.

## Tests added
`src/components/ai/panel/__tests__/KeysModal.trap.test.tsx` — focus-in + restore via the shared
hook (the assertDialogA11y Tab-wrap on this styled modal is flaky under jsdom's `getComputedStyle`;
the wrap is covered canonically by `useFocusTrap.test.ts`).
