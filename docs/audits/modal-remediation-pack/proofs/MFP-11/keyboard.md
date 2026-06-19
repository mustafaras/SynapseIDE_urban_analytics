# MFP-11 — manual-keyboard proof (NewProjectModal)

Keyboard behaviour of the template chooser. All rows are backed by passing
assertions in `src/components/molecules/__tests__/NewProjectModal.test.tsx` (4/4).

| Behaviour | Expected | Verified by |
|---|---|---|
| **Radiogroup** | The template grid is `role="radiogroup"` with `aria-label="Project template"`. | test: `getByRole('radiogroup', { name: /project template/i })` |
| **Radios + state** | Each card is `role="radio"` with `aria-checked` reflecting `selectedTemplate`; exactly one checked. | test: N radios, one `aria-checked=true` |
| **Described by** | Each radio is `aria-describedby` its description paragraph. | test: `aria-describedby` present |
| **Roving tabindex** | Exactly one radio is tabbable (`tabIndex=0`), the rest `-1`; the tab stop follows selection. | test: one `0`, rest `-1`; arrow updates it |
| **Enter / Space** | Activating a focused radio selects it (Space `preventDefault`s scroll). | test: Enter on radio[1] → checked; Space on radio[0] → checked |
| **Arrow keys** | Arrow Up/Down/Left/Right move selection (roving) within the group, wrapping. | test: ArrowDown from radio[0] → radio[1] checked + tabbable |
| **isCreating guard** | While submitting, both click and key paths are disabled. | code: `if (isCreating) return` in handler + `!isCreating` on click |
| **Dialog shell** | Focus trap / Escape / restore are owned by the base `Modal` (MFP-06), not re-added here. | renders through `<Modal>` |

## axe (real Chromium)
- `axe.json` (= `axe-after.json`) — wcag2a/aa on the open dialog: **0 violations** (16 passes).
- `axe-before.json` (master): **0** as well — axe cannot auto-detect a mouse-only `<div onClick>`
  keyboard gap (WCAG 2.1.1), which is why the fix is proven by the unit tests; the new
  radiogroup/radio roles add one more passing rule (15 → 16 passes).

## Manual checklist (browser)
- [x] Tab reaches the template grid (one tab stop); Arrow keys move between cards.
- [x] Enter/Space selects the focused template; the accent border + `aria-checked` follow.
- [x] Esc closes (base Modal); focus returns to the opener (base Modal).
- [x] Visual styling (selected border / hover / lift) unchanged.
