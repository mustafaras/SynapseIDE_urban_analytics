# MFP-09 — Proof summary

**Prompt:** MFP-09 — Make MapServiceDialog keyboard-conformant + fix roles/shadowing
**Gate:** gis · **Depends on:** none · **Branch:** claude/modal-fix-p9

## Change — `src/centerpanel/components/MapServiceDialog.tsx`
Fixes finding `MapService` (WCAG 2.1.2 / 2.4.3 / 4.1.2):
- **Focus trap + Escape + restore:** `useFocusTrap(open)` (MFP-02) attached to the dialog
  overlay; `activate()` on open moves initial focus in; the trap restores focus to the opener
  on close. Added a dialog-scoped `onKeyDown` Escape (`stopPropagation` so it doesn't steal
  keys from the map canvas) — no global listener.
- **Valid ARIA roles:** the layer list was `role="listbox"` with `<button aria-pressed>` children
  (invalid). Changed the container to `role="group"` (kept the `aria-label`); the children stay
  real toggle `<button aria-pressed>` — a conformant labelled button group.
- **Shadow fix:** module-level `boundsLabel(...)` → `formatBoundsLabel(...)` (updated
  `scopedBoundsLabel`), removing the collision with the `boundsLabel` prop (aliased
  `requestBoundsLabel`).
- **Errors via `reportError`:** the two fetch/service `catch` blocks (`runBusy`, XYZ add) now
  emit through `reportError({ source: 'adapter', code, detail })` (seeds the MFP-19 pattern);
  the inline `setError` message is kept for the visible banner.

`centerpanel/` rules respected: inline `mapTokens` style objects only, **no Tailwind / no
className** added. No `any`. `data-testid` hooks preserved.

## Proofs in this directory
- **`after.png`** — real-Chromium screenshot of the open dialog; the `×` button shows a focus
  ring (focus moved into the dialog). **(screenshot — extra, per request)**
- **`axe.json`** — real axe-core in Chromium, wcag2a/aa **excluding pre-existing color-contrast**:
  **0 violations** (16 passes) — proves the MFP-09 categories (name/role, keyboard, valid ARIA)
  are conformant. **(axe-clean)**
- `axe-after.json` — full wcag2a/aa: **8 `color-contrast`** residuals, all **shared map design
  tokens** (`#778190` 4.17/3.74:1, `#3794ff` 4.04:1) used Map-Explorer-wide. Out of MFP-09
  scope (a `mapTokens` color pass); MFP-09 added none.
- **`keyboard.md`** — Tab/Shift+Tab/Escape/restore + layer-semantics checklist. **(manual-keyboard)**
- `typecheck.txt` — `npm run typecheck` clean. **(typecheck-clean)**
- `lint.txt` — `npm run lint:errors` clean; `lint:no-tailwind-centerpanel` is PowerShell-only
  (not runnable on this Linux runner) — manually verified no `class=`/`className` added.
- `unit-test.txt` — `vitest run src/centerpanel/components/map` → **98 files / 933 passed**
  (incl. `map-accessibility` unchanged + the new `MapServiceDialog.a11y.test.tsx` 3/3).

## Acceptance
- [x] Keyboard: Tab within, Escape out, focus restores to the opener; initial focus inside.
- [x] No `listbox`+`button`+`aria-pressed`; layer list is a labelled group of toggle buttons.
- [x] `boundsLabel` no longer collides (renamed to `formatBoundsLabel`).
- [x] Fetch failures route through `reportError`.
- [x] `map-*` vitest specs pass; no Tailwind in centerpanel (verified).
- [~] axe fully clean except pre-existing shared map-token contrast (documented, out of scope).
