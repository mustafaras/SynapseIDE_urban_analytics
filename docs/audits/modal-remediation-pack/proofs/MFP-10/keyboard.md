# MFP-10 — manual-keyboard proof (NewFileModal)

Keyboard / focus behaviour of the rebuilt `NewFileModal`. Rows 1–4 are backed by
passing assertions in `src/components/file-explorer/__tests__/NewFileModal.a11y.test.tsx` (4/4).

| Behaviour | Expected | Verified by |
|---|---|---|
| **Dialog boundary** | `role="dialog"` + `aria-label="Create New File"` is on the **panel** (the dismiss overlay is `role="presentation"`). | test: `getByRole('dialog', { name: 'Create New File' })` is the panel; `aria-modal="true"` |
| **Category step** | A `role="radiogroup"` of real `<button role="radio">` controls; exactly one `aria-checked`. | test: radiogroup "File category", all radios are `<button>`, one checked |
| **Keyboard operability** | Each option is a native `<button>` → Tab-reachable + Enter/Space-operable. Activating advances the wizard. | test: activate first radio → "Language" radiogroup appears |
| **Focus move-in / Escape** | Focus moves into the dialog on open; Escape closes (dialog-scoped). | test: `dialog.contains(activeElement)`; Escape → `onClose` |
| **Focus restore** | Closing restores focus to the opener (shared `useFocusTrap`). | `useFocusTrap(isOpen)` (proven in MFP-02/07) |
| **Filename autofocus** | The filename input still autofocuses on the final step (`requestAnimationFrame`). | preserved effect |
| **Full flow** | category → language → template → filename is operable by keyboard alone (all radios + Back/Cancel/Create are buttons). | code + tests |

## axe (real Chromium)
- `axe.json` (= `axe-after.json`) — wcag2a/aa on the open dialog: **0 violations** (12 passes).
- `axe-before.json` — master: **1 serious** (`scrollable-region-focusable`). The div→button
  conversion made the scroll region keyboard-reachable, clearing it too.

## Manual checklist (browser)
- [x] Tab moves through category cards (now buttons); Enter/Space selects and advances.
- [x] Esc closes; focus returns to the trigger.
- [x] The `×` button shows a focus ring after open (see `after.png`).
- [x] Selected option shows the `aria-checked` accent border.
