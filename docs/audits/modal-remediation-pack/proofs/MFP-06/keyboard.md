# MFP-06 — manual-keyboard proof (base Modal)

Keyboard / focus behaviours of the rebuilt `src/components/molecules/Modal.tsx`.
Each item is backed by a deterministic assertion in
`src/components/molecules/__tests__/Modal.a11y.test.tsx` (6/6 passing, jsdom).

| Behaviour | Expected | Verified by |
|---|---|---|
| **Focus move-in** | On open, focus moves from the opener into the dialog (first focusable, or the dialog container as fallback). | test 1 — `dialog.contains(document.activeElement) === true` |
| **Focus restore** | On close, focus returns to the element that was focused before opening (the opener). | test 1 — `document.activeElement === opener` after close |
| **Tab wrap (forward)** | `Tab` from the last focusable wraps to the first. | test 3 — `activeElement === first` |
| **Shift+Tab wrap (backward)** | `Shift+Tab` from the first focusable wraps to the last. | test 3 — `activeElement === last` |
| **Escape (enabled)** | `Escape` closes the dialog when `closeOnEscape` is set. | test 4 — `onClose` called once |
| **Escape (disabled)** | `Escape` does nothing when `closeOnEscape={false}`. | test 4 — `onClose` not called |
| **Escape scope** | The handler is on the dialog (`onKeyDown` on the overlay/panel), not `window`; it `stopPropagation()`s so a stacked child popover can own Escape. | code: `onOverlayKeyDown`; no global `useKeyPress` |
| **Overlay click** | Clicking the backdrop closes (when `closeOnOverlayClick`); clicking inside the panel does not. | test 5 — close only on `e.target === e.currentTarget` |
| **Background inert** | While open, background siblings are `inert` + `aria-hidden="true"`; restored on close. Keyboard/AT cannot reach the page behind the dialog. | test 6 |
| **Unique title id** | Two modals never collide on `id="modal-title"`; each uses `useId()`. | test 2 |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)` disables the slide/fade animations. | CSS in `Overlay` + `ModalContainer` |

## Manual checklist (to re-run in a browser)
- [ ] Open a base-Modal consumer (Command Palette / Global Search / New Project / Settings).
- [ ] Tab through: focus stays inside, wraps both directions.
- [ ] Esc closes (if enabled); focus returns to the trigger.
- [ ] Screen reader: page behind the dialog is not reachable; dialog name announced.
- [ ] Narrow the viewport below 688px (palette size): the panel reflows without horizontal overflow.
