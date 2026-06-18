# MFP-10 — Proof summary

**Prompt:** MFP-10 — NewFileModal: correct dialog role, keyboard selectors, focus, data extraction
**Gate:** general · **Depends on:** MFP-06 (done) · **Branch:** claude/modal-fix-p10

## Change
- **NF1 — dialog boundary:** moved `role="dialog"` / `aria-modal` / `aria-label="Create New File"`
  off the dismiss overlay onto the panel; the overlay is now `role="presentation"` (keeps
  click-to-dismiss).
- **NF2 — keyboard selectors:** the category / language / template groups are now
  `role="radiogroup"`s of real `<button role="radio" aria-checked>` controls (Tab-reachable,
  Enter/Space-operable natively), each with the visible name as its accessible name.
- **NF3 — focus:** replaced the hand-rolled Escape + body-scroll effect with `useFocusTrap(isOpen)`
  (trap + restore, MFP-02) + `useScrollLock(isOpen)` (MFP-03); `activate()` moves initial focus
  in; dialog-scoped `onKeyDown` Escape. Preserved the filename-input `requestAnimationFrame`
  autofocus.
- **NF4 — data extraction + lazy load:** moved the static data out of the component:
  `newFileTemplates.ts` (lightweight `LANGUAGE_CATEGORIES` + `TEMPLATE_TYPES`, statically imported)
  and `newFileTemplateContent.ts` (the heavy per-language content map, **lazy `import()`ed** only
  when a file is created). The build now emits `newFileTemplateContent-*.js` as its **own ~16.8 kB
  chunk** (no "ineffective dynamic import" warning). `NewFileModal.tsx`: **940 → 553 lines**.
- **NF5 — dead pseudo-selectors:** removed the inline `&:hover`/`&:focus` (which React never
  applied); hover/focus styling moved to `NewFileModal.module.css` (`.interactive`, `.btn`,
  `.closeBtn`, `.input`). No `any` (dropped the `as any` borderColor read).

## Proofs in this directory
- **`before.png` / `after.png`** — real-Chromium screenshots. `after.png` shows the panel dialog,
  the category radiogroup with the selected (`aria-checked`) accent border, and the `×` focus ring
  (focus moved in). **(screenshot)**
- **`axe.json`** (= `axe-after.json`) — axe-core in Chromium on the open dialog, wcag2a/aa:
  **0 violations** (12 passes). **(axe-clean)** `axe-before.json` (master): **1 serious**
  (`scrollable-region-focusable`) — also cleared by the div→button conversion.
- **`keyboard.md`** — full keyboard checklist (test-backed). **(manual-keyboard)**
- `typecheck.txt` — clean. **(typecheck-clean)**
- `lint.txt` — `lint:errors` clean.
- `unit-test.txt` — `NewFileModal.a11y.test.tsx` **4/4**.
- `perf-budgets.txt` — **Bundle budgets passed** (lazy split keeps the chunk budget).
- `build.txt` — production build OK; `newFileTemplateContent-*.js` is a separate chunk.

## Acceptance
- [x] category → language → template → filename operable by keyboard alone (all radios/buttons).
- [x] axe reports no serious/critical violations.
- [x] SR dialog boundary is the panel, not the dismiss overlay.
- [x] Focus trapped + restored to the opener.
- [x] `NewFileModal.tsx` shrank materially (940 → 553); static data moved out.
- [x] Dead `&:hover`/`&:focus` inline pseudo-selectors removed.
- [x] `npm run perf:budgets` passes (effective lazy chunk).
