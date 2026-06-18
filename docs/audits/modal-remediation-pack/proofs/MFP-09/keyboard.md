# MFP-09 — manual-keyboard proof (MapServiceDialog)

Keyboard / focus behaviour of the conformant `MapServiceDialog`. The first three
rows are backed by passing assertions in
`src/centerpanel/components/map/__tests__/MapServiceDialog.a11y.test.tsx` (3/3).

| Behaviour | Expected | Verified by |
|---|---|---|
| **Focus move-in** | On open, focus moves into the dialog (first focusable). | test: `overlay.contains(document.activeElement)` |
| **Escape (scoped)** | `Escape` closes via a handler on the dialog overlay (`stopPropagation` so it doesn't steal keys from the map canvas), not a global listener. | test: `fireEvent.keyDown(dialog, {key:'Escape'})` → `onClose` |
| **Focus restore** | On close, focus returns to the opener (shared `useFocusTrap`). | test: rerender `open=false` → `document.activeElement === opener` |
| **Tab / Shift+Tab** | Focus cycles within the dialog; cannot leak behind. | `useFocusTrap(open)` wrap handler (proven in MFP-02/07) |
| **Layer semantics** | No invalid `listbox`+`button`+`aria-pressed`; the layer list is a labelled `role="group"` of toggle buttons (`aria-pressed`), which screen readers announce correctly. | test: no `[role="listbox"]`; code review |
| **Errors** | Fetch/service failures route through `reportError` (source `adapter`), not a raw toast. | code: `catch` blocks in `runBusy` / XYZ add |

## axe (real Chromium)
- `axe.json` — wcag2a/aa **excluding the pre-existing color-contrast** rule: **0 violations**
  (16 passes). Proves the MFP-09-targeted categories — dialog name/role, keyboard, valid ARIA
  roles — are conformant.
- `axe-after.json` — full wcag2a/aa: **8 `color-contrast`** residuals, all from **shared map
  design tokens** (`#778190` muted text 4.17/3.74:1, `#3794ff` active-tab 4.04:1) used across
  the whole Map Explorer. Out of MFP-09's scope (keyboard/roles/shadow/reportError); belongs in
  a dedicated map color-contrast pass (broad blast radius — `mapTokens`). MFP-09 introduced none.

## Manual checklist (browser)
- [x] Tab cycles within the dialog; Shift+Tab wraps; focus cannot reach the map behind.
- [x] Esc closes; focus returns to the trigger.
- [x] The `×` button shows a focus ring after open (see `after.png` — focus moved into dialog).
- [x] Discovered layers render as labelled toggle buttons (group), announced with pressed state.
