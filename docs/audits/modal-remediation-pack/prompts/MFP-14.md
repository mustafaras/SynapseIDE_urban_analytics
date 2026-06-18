# MFP-14 — Standardize accessible names across all dialogs

| Field | Value |
|---|---|
| Trigger | P14, names, accessible-names |
| Priority / Phase | P1 / Phase 2 |
| Depends on | MFP-06 |
| Gate | gis |
| Severity | medium |
| Proof required | typecheck-clean, axe-clean, e2e-a11y |

## 1. Why this matters
Findings `AS3`, `Welcome-name`, `MapDialogShell-name`, `B3`: several `role="dialog"` elements either lack a programmatic name or name themselves with `aria-label` while a perfectly good visible heading sits unreferenced. WelcomeModal renders a visible `<h1 id="welcome-modal-title">` but names the dialog with a separate `aria-label`, so the visible title is never the accessible name (a WCAG **2.5.3 Label in Name** / APG mismatch). MapDialogShell names every shell dialog with `aria-label` only — its `<h2>` title is unwired — so all seven shell-based dialogs expose a name that can drift from the visible heading. The fix prefers `aria-labelledby` → the visible heading, satisfying WCAG **4.1.2 Name, Role, Value** and **1.3.1 Info and Relationships** consistently.

## 2. Current state (evidence)
WelcomeModal names via `aria-label` while a visible titled `<h1>` exists. `src/features/urbanAnalytics/WelcomeModal.tsx:596-599`:
```tsx
role="dialog"
aria-modal="true"
aria-label="Welcome to Urban Analytics Workbench"
style={{ zIndex: 2147483648 }}
```
and the unreferenced heading `src/features/urbanAnalytics/WelcomeModal.tsx:708`:
```tsx
<h1 id="welcome-modal-title" className="brand-title">
```
MapDialogShell names via `aria-label` (prop) and never wires its `<h2>`. `src/centerpanel/components/map/MapDialogShell.tsx:313-315`:
```tsx
role="dialog"
aria-modal={nonBlocking ? false : true}
aria-label={ariaLabel}
```
and the title heading `src/centerpanel/components/map/MapDialogShell.tsx:338`:
```tsx
<h2 style={titleStyle}>{title}</h2>
```
AiSettingsModal (verify only — its naming is added by MFP-08) currently has no name. `src/components/ai/settings/AiSettingsModal.tsx:159-166`:
```tsx
<div role='dialog' aria-modal='true' className={styles.modal}>
  <div className={styles.panel}>
    <div className={styles.header}>
      <strong className={styles.title}>AI Settings</strong>
```

## 3. Target state
Before: dialogs named by `aria-label` (or unnamed), with visible headings ignored by AT.
After: WelcomeModal's dialog uses `aria-labelledby="welcome-modal-title"` and drops the duplicate `aria-label`. MapDialogShell generates a unique title id, renders it on the `<h2>`, and sets `aria-labelledby` on the dialog (falling back to `aria-label={ariaLabel}` only when no `title` is provided) — propagating a real, visible-heading name to all shell dialogs. AiSettingsModal is verified to gain `aria-labelledby="ai-settings-title"` (delivered by MFP-08).

## 4. Implementation steps
1. **WelcomeModal** (`:596-599`): replace `aria-label="Welcome to Urban Analytics Workbench"` with `aria-labelledby="welcome-modal-title"`. Leave the `<h1 id="welcome-modal-title">` (`:708`) as the visible source of the name. Keep `role="dialog"`/`aria-modal`.
2. **MapDialogShell**: add `const titleId = useId();` (import `useId`). Render it on the `<h2>` (`:338`): `<h2 id={titleId} style={titleStyle}>{title}</h2>`. On the dialog `<div>` (`:311-321`) set `aria-labelledby={title ? titleId : undefined}` and keep `aria-label={!title ? ariaLabel : undefined}` so dialogs without a visible title still have a name. Because `ariaLabel` is a required prop today, prefer `aria-labelledby` when `title` is present and fall back to `aria-label` otherwise.
3. **AiSettingsModal** (verify): confirm MFP-08 added the heading id + `aria-labelledby="ai-settings-title"`. If MFP-08 has not yet landed, leave the wiring to it and only record the verification gap.
4. Sweep the repo for remaining `role="dialog"` without `aria-labelledby`/`aria-label` and note any not already covered by another MFP prompt.

## 5. Constraints & edge cases
- Prefer `aria-labelledby` → visible heading; only use `aria-label` when there is no visible title.
- `exactOptionalPropertyTypes`: compute `aria-labelledby` / `aria-label` as `string | undefined` deliberately (ternaries above), never an optional-vs-undefined mismatch.
- `gis` gate (touches `centerpanel/`); no Tailwind in `centerpanel/`.
- Do not change visible copy or layout; this is naming wiring only.
- MapDialogShell is shared by ~7 dialogs — verify each still has either a `title` or an `ariaLabel` so none ends up unnamed.

## 6. Acceptance criteria
- [ ] axe "dialog has accessible name" passes for every modal.
- [ ] Names point at visible headings where a heading exists (`aria-labelledby`).
- [ ] WelcomeModal no longer carries both `aria-label` and an unreferenced `#welcome-modal-title`.
- [ ] All MapDialogShell consumers expose a programmatic name sourced from the `<h2>` (or `ariaLabel` fallback).
- [ ] `npm run typecheck` passes; map e2e a11y green.

## 7. Validation
```bash
npm run typecheck
npm run test:e2e:a11y
# gate: gis
```

## 8. Tests to add
Extend the map a11y unit tests (`src/centerpanel/components/map/__tests__/map-accessibility.test.ts`) to assert a `MapDialogShell` with a `title` exposes `aria-labelledby` resolving to that `<h2>` text, and a shell with only `ariaLabel` falls back to `aria-label`. Add a WelcomeModal test asserting `getByRole('dialog')` has accessible name equal to the visible `#welcome-modal-title` text and no stray `aria-label`. In `e2e/accessibility-audit.spec.ts`, assert each opened dialog reports a non-empty accessible name via axe.

## 9. Proof checklist
- [ ] `proofs/MFP-14/typecheck-clean.txt` — `npm run typecheck` output.
- [ ] `proofs/MFP-14/axe.json` — axe results showing "dialog has accessible name" passing for all modals.
- [ ] `proofs/MFP-14/e2e-a11y.txt` — `npm run test:e2e:a11y` output.
