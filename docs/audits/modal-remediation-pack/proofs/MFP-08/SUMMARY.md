# MFP-08 — Proof summary

**Prompt:** MFP-08 — Make AiSettingsModal a conformant dialog
**Gate:** general · **Depends on:** MFP-02 (done) · **Branch:** claude/modal-fix-p8

## Change — `src/components/ai/settings/AiSettingsModal.tsx` (+ `.module.css`)
Fixes AS1–AS7:
- **AS4 portal:** wrapped the render in `createPortal(…, document.body)`.
- **AS1/AS2 trap + restore + Escape:** `const { trapRef, activate } = useFocusTrap(open)` (MFP-02)
  on the dialog root; a focus-in effect calls `activate()` on open; the trap restores focus to
  the opener on close. Added a dialog-scoped `onKeyDown` Escape handler (no global listener).
- **AS3 name:** `useId()` → `aria-labelledby` on the dialog wired to `<strong id>` "AI Settings".
- **AS5 close button name:** `aria-label="Close AI settings"` (kept `title` as tooltip).
- **AS6 z-index:** `.modal { z-index: 1000 }` → `z-index: var(--z-modal)` (MFP-05 tier).
- **AS7 no `any`:** removed all four `any` (`Snapshot.keys` → `Record<ProviderId, ProviderKey>`,
  three `keyPayload: ProviderKey`, preview `opt: BuildParams`); `keys[provider]?.x` optional chaining.
- **WCAG 1.4.3 contrast (conformance):** label/hint fallback `var(--ai-fg-secondary, var(--syn-text-muted))`
  → `var(--ai-fg-secondary, var(--syn-text-secondary))`. `--ai-fg-secondary` is undefined repo-wide,
  so labels really fell back to `--syn-text-muted` (#778190 → 4.17:1, fails AA); the new fallback
  passes AA. CSS-module-only, uses an existing var (no hardcoded hex → color:guard safe).
- **scrollable-region:** request-preview `<pre>` made keyboard-reachable (`tabIndex={0}` + aria-label).

## Proofs in this directory
- **`before.png` / `after.png`** — real Chromium screenshots of the open modal (visual proof).
  `after.png` shows the close button's focus ring (focus moved into the dialog) and the
  AA-contrast labels. **(screenshot)**
- **`axe.json`** (= `axe-after.json`) — real axe-core run **in Chromium**, scoped to the open
  `[role="dialog"]`, wcag2a/wcag2aa: **0 violations** (17 passes). **(axe-clean)**
- `axe-before.json` — same run on the pre-change modal: **2 serious** (`color-contrast` ×11,
  `scrollable-region-focusable` ×1). Confirms the change fixed all of them and added none.
- **`keyboard.md`** — Tab/Shift+Tab/Escape/focus-restore checklist (test-backed). **(manual-keyboard)**
- `typecheck.txt` — `npm run typecheck` clean, **no `any`**. **(typecheck-clean)**
- `lint.txt` — `npm run lint:errors` clean.
- `unit-test.txt` — `vitest run src/components/ai/settings` → **5/5 passed**
  (`AiSettingsModal.a11y.test.tsx`).

### How the screenshots + axe were produced (reproducible)
The sandbox blocks Playwright's browser *download*, but a Chromium build is already installed at
`/opt/pw-browsers/chromium-1194`. A temporary Vite harness mounted `<AiSettingsModal open />` with
the real `GlobalSynapseStyles` tokens; `playwright-core` (executablePath → that Chromium) loaded it,
captured the PNGs, and ran the in-page `axe-core` (a repo dependency). Harness was removed after use
(never committed; dot-dir ignored by eslint/tsc).

## Acceptance
- [x] axe: no serious/critical violations on the open modal.
- [x] Dialog has an accessible name; close button named "Close AI settings".
- [x] Tab/Shift+Tab cycle; Escape closes; focus returns to the opener.
- [x] Dialog portaled to `document.body`; overlay `z-index: var(--z-modal)`.
- [x] `npm run typecheck` clean, no `any` in the file.
