# MFP-14 — Proof summary

**Prompt:** MFP-14 — Standardize accessible names across all dialogs
**Gate:** gis · **Depends on:** MFP-06 (done) · **Branch:** claude/modal-fix-p14-di906z
**Findings:** AS3 · Welcome-name · MapDialogShell-name · B3

## Change
- **WelcomeModal** (`src/features/urbanAnalytics/WelcomeModal.tsx`): the `role="dialog"`
  was named by `aria-label="Welcome to Urban Analytics Workbench"` while a visible
  `<h1 id="welcome-modal-title">` sat unreferenced (WCAG 2.5.3 Label in Name mismatch).
  Replaced the `aria-label` with `aria-labelledby="welcome-modal-title"` so the dialog's
  programmatic name **is** the visible heading; no duplicate `aria-label` remains.
- **MapDialogShell** (`src/centerpanel/components/map/MapDialogShell.tsx`): named every shell
  dialog by `aria-label` (prop) only — its `<h2>` title was unwired, so all ~7 shell-based
  dialogs exposed a name that could drift from the visible heading. Added `useId()` →
  rendered on the `<h2 id={titleId}>` → set `aria-labelledby={title ? titleId : undefined}`
  on the dialog, with `aria-label={title ? undefined : ariaLabel}` as a fallback so a shell
  opened without a visible title is still named. `title` is a required prop today, so in
  practice every consumer now gets a visible-heading name.
- **AiSettingsModal** (verify only): confirmed MFP-08 already wired
  `aria-labelledby={titleId}` → `<strong id={titleId}>AI Settings</strong>`. No change needed.
- **Repo sweep (step 4):** swept every `role="dialog"` under `src/`. All were already named
  except the IDE **AI Assistant** side panel in `src/App.tsx` (`data-testid="assistant-modal"`),
  which had `role="dialog"` + `aria-modal` but **no name**. Added `aria-label="AI Assistant"`
  (its visible heading lives inside the `AiAssistant` component with no root-level id to
  reference, so `aria-label` is the correct fallback). Every `role="dialog"` in `src/` now
  exposes either `aria-labelledby` (preferred, visible heading) or `aria-label`.

## Proofs in this directory
- **`after.png` / `welcome-after.png`** — real-Chromium screenshot of the WelcomeModal with
  its visible "Urban Analytics Workbench" heading (the accessible-name source). **(screenshot)**
- **`mapshell-after.png`** — real-Chromium screenshot of a `MapDialogShell` instance; the
  visible `<h2>` "Layer Inspector" is the name source (focus ring on the reset button shows
  focus moved in). **(screenshot)**
- **`axe.json`** — axe-core in Chromium (`chromium-1194` via `playwright-core` + a throwaway
  Vite harness). The best-practice rule **`aria-dialog-name` PASSES (1 node)** for both the
  WelcomeModal and MapDialogShell dialogs; **0 naming violations**; each dialog reports a
  non-empty `aria-labelledby`-resolved name and **no** `aria-label`. **(axe-clean)**
  - WelcomeModal: **0** total wcag2a/2aa violations.
  - MapDialogShell: **1** wcag violation — `color-contrast (serious) x1` — which is on the
    *harness-authored* body paragraph text (`#cdd6e0`), **not** the shell chrome or the dialog
    naming. Out of scope for MFP-14 (naming wiring only).
- **`e2e-a11y.txt`** — `npm run test:e2e:a11y` is **environment-blocked** (Playwright wants
  `chromium_headless_shell-1217`; only `chromium-1194` is present and the download is disabled).
  The new MFP-14 spec assertion (`accessibility-audit.spec.ts:198` — "every opened dialog
  reports a non-empty accessible name") is registered/discovered but cannot launch a browser
  here. Substituted by the real-Chromium axe above + the jsdom suites. **Re-run in a
  browser-capable environment.** **(e2e-a11y — substitute)**
- **`typecheck-clean.txt`** — `npm run typecheck` clean. **(typecheck-clean)**
- **`lint.txt`** — `npm run lint:errors` clean.
- **`unit-test.txt`** — `map-accessibility.test.ts` (+2 new MapDialogShell name tests) and
  `WelcomeModal.a11y.test.tsx` — **40 passed**.

## Tests added
- `src/centerpanel/components/map/__tests__/map-accessibility.test.ts`: a `MapDialogShell` with
  a `title` exposes `aria-labelledby` resolving to that `<h2>` text and carries no `aria-label`;
  a shell with an empty `title` falls back to `aria-label`.
- `src/features/urbanAnalytics/__tests__/WelcomeModal.a11y.test.tsx`: the dialog's accessible
  name resolves (via `aria-labelledby`) to the visible `#welcome-modal-title` text, with no
  stray `aria-label`.
- `e2e/accessibility-audit.spec.ts`: asserts each opened dialog reports a non-empty accessible
  name (`toHaveAccessibleName(/\S/)`) — registered; runs in a browser-capable environment.

## Gate (gis)
- `npm run typecheck` — clean.
- `npm run lint:errors` — clean.
- `npx vitest run src/centerpanel/components/map` — **98 files / 935 passed** (map-accessibility
  intact, +2 new MapDialogShell name tests).
- `lint:no-tailwind-centerpanel` — PowerShell-only, not runnable on Linux; manually verified the
  touched centerpanel file (`MapDialogShell.tsx`) adds no Tailwind class/`className` literal
  (naming-attribute wiring only).

## Acceptance
- [x] axe "dialog has accessible name" (`aria-dialog-name`) passes for the audited modals.
- [x] Names point at visible headings where present (`aria-labelledby`).
- [x] WelcomeModal no longer carries both `aria-label` and an unreferenced `#welcome-modal-title`.
- [x] All MapDialogShell consumers expose a programmatic name sourced from the `<h2>` (or
      `ariaLabel` fallback when no title).
- [x] `npm run typecheck` passes; map unit a11y green. (e2e a11y env-blocked — substitute + re-run note.)
