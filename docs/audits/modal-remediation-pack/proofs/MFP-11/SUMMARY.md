# MFP-11 — Proof summary

**Prompt:** MFP-11 — NewProjectModal: keyboard-operable template cards
**Gate:** general · **Depends on:** MFP-06 (done) · **Branch:** claude/modal-fix-p11

## Change — `src/components/molecules/NewProjectModal.tsx`
Finding `NewProject` (WCAG 2.1.1 Keyboard / 4.1.2 Name·Role·Value): the template chooser was a
`<div>` grid of mouse-only `<div onClick>` cards. Now:
- `TemplateGrid` carries `role="radiogroup"` + `aria-label="Project template"`.
- Each `TemplateCard` is `role="radio"` with `aria-checked={isSelected}`, `aria-label`,
  `aria-describedby` → its description paragraph (`id`), and **roving `tabIndex`** (0 for the
  selected card, -1 otherwise).
- `onKeyDown` handles **Enter/Space** (select; Space `preventDefault`) and **Arrow keys**
  (move selection within the group, wrapping, focusing the new card via a ref array).
- Existing `onClick` and the `isCreating` guard kept on both paths; **visual styling unchanged**
  (the `$isSelected` border/hover/transform CSS is untouched).
- Built on the base `Modal` — focus trap / Escape / restore are owned by MFP-06, not re-added.

No `any`; `aria-describedby` is always a concrete string (exactOptionalPropertyTypes).

## Proofs in this directory
- **`before.png` / `after.png`** — real-Chromium screenshots. The grid is visually identical
  (per spec); the change is semantic/keyboard. `after.png` shows the selected card's accent border.
  **(screenshot — per standing request)**
- **`axe.json`** (= `axe-after.json`) — axe-core in Chromium on the open dialog: **0 violations**
  (16 passes). `axe-before.json` (master): **0** too — axe cannot auto-detect a mouse-only
  `<div onClick>` keyboard gap, so the keyboard fix is proven by the unit tests; the new
  radiogroup/radio roles add one more passing rule (15 → 16).
- **`keyboard.md`** — full keyboard checklist (test-backed). **(manual-keyboard)**
- `typecheck.txt` — clean. **(typecheck-clean)**
- `lint.txt` — `lint:errors` clean.
- `unit-test.txt` — `NewProjectModal.test.tsx` **4/4** (radiogroup, roving tabindex,
  Enter/Space select, arrow-key roving).

## Acceptance
- [x] Template grid reachable by Tab; selectable by keyboard alone (Enter/Space + arrows).
- [x] Each card exposes `role="radio"` + `aria-checked` reflecting `selectedTemplate`.
- [x] `radiogroup` has an accessible name; each radio described by its description text.
- [x] axe reports no serious violations.
- [x] `npm run typecheck` and `npm run lint:errors` pass.
