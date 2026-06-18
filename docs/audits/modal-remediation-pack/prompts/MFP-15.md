# MFP-15 — Apply z-index tokens to bespoke modals (fix occlusion)

| Field | Value |
|---|---|
| Trigger | P15, apply-ztokens, z-index-fix |
| Priority / Phase | P2 / Phase 2 |
| Depends on | MFP-05 |
| Gate | general |
| Severity | medium |
| Proof required | typecheck-clean, color-guard, screenshot |

## 1. Why this matters
Finding `audit-4.3`: bespoke modals each invent their own stacking number, producing real occlusion bugs. AI Settings sits at `z-index:1000` — below the backdrop (`1040`) and status bar (`9999`) tiers — so it can be visually buried. Keys uses `2200`, Unsaved uses `9999` (the status-bar tier, below the `modal` tier `10050`). Meanwhile three global "gold bars" use the absurd literal `2147483648` (and EnhancedIDE `999999`). MFP-05 already published the scale as CSS variables (`--z-modal`, `--z-backdrop`, `--z-popover`, `--z-tooltip`, `--z-toast`, and a new `--z-system-banner` tier above toast). This prompt makes the consumers use those tokens so no modal can be occluded and the banners stop fighting the stack. The single source of truth is `DESIGN_TOKENS.zIndex` in `src/constants/design.ts`.

## 2. Current state (evidence)
The scale is centralized in `src/constants/design.ts:323-339`:
```ts
zIndex: {
  ... backdrop: 1040, statusBar: 9999, modal: 10050, popover: 10060, tooltip: 10070, toast: 10080, ...
},
```
Modal overlays hardcode raw, wrong-tier numbers:

`KeysModal.tsx:21` — Backdrop at `2200` (below `modal` 10050):
```tsx
position: fixed; inset: 0; background: var(--syn-surface-overlay, ...);
display: flex; align-items: center; justify-content: center; z-index: 2200;
```
`AiSettingsModal.module.css:11` — `.modal` overlay at `1000` (below backdrop/statusbar):
```css
  z-index: 1000;
```
`UnsavedChangesDialog.tsx:144` — backdrop at `9999` (status-bar tier):
```tsx
zIndex: 9999,
```
Global gold/accent bars use max-int and near-max literals:

`UrbanAnalyticsModal.tsx:1291` — `.accentline`:
```tsx
 position: fixed; top:0; left:0; right:0; height:2px; z-index:2147483648;
```
`WelcomeModal.tsx:599` inline `style={{ zIndex: 2147483648 }}` and `:945` CSS `z-index: 2147483648 !important;`.
`EnhancedIDE.tsx:1696` — `[data-global-gold-bar]`:
```tsx
[data-global-gold-bar]{position:fixed;top:0;left:0;right:0;height:2px;z-index:999999;pointer-events:none;}
```

## 3. Target state
Before: five different z-index strategies; modals occludable by the status bar/backdrop; banners at max-int.
After: every modal **overlay** uses `var(--z-modal)`; every global banner uses `var(--z-system-banner)` (published by MFP-05). UrbanAnalyticsModal's deliberate dialog z-index (`10049`) is left as-is unless it now conflicts; only its `.accentline` banner is retokenized. No raw z-index literals remain in modal overlays.

## 4. Implementation steps
1. `KeysModal.tsx:21` — replace `z-index: 2200;` with `z-index: var(--z-modal);`.
2. `AiSettingsModal.module.css:11` — replace `z-index: 1000;` with `z-index: var(--z-modal);` (coordinate with MFP-08, which also targets this line — whichever lands first sets the token).
3. `UnsavedChangesDialog.tsx:144` — replace `zIndex: 9999,` with `zIndex: 'var(--z-modal)',` in the backdrop inline style object.
4. `UrbanAnalyticsModal.tsx:1291` — replace the `.accentline` `z-index:2147483648` with `z-index: var(--z-system-banner);`. Leave the modal's deliberate `10049` dialog z-index alone unless it now conflicts.
5. `WelcomeModal.tsx` — replace the banner/overlay `2147483648` at `:599` (inline `style`) and `:945` (CSS `!important`) with `var(--z-system-banner)`. Keep this distinct from the dialog naming change in MFP-14 (same lines, different attributes — coordinate ordering).
6. `EnhancedIDE.tsx:1696` — replace `z-index:999999` on `[data-global-gold-bar]` with `z-index:var(--z-system-banner);`.

## 5. Constraints & edge cases
- Single source of truth = `design.ts` `zIndex`; the CSS vars come from MFP-05 — do **not** redefine values here.
- No raw z-index literals left in modal **overlays** after this change.
- Visual QA unchanged — banners stay above modals, modals stay above backdrop/status bar.
- styled-components inline `zIndex` takes a string (`'var(--z-modal)'`); `exactOptionalPropertyTypes` — keep the inline style object shapes intact.
- `centerpanel/` (UrbanAnalyticsModal lives under `features/`, but verify no Tailwind creeps in if any styled-component is shared).
- `--z-system-banner` must exist (MFP-05 dependency); if it is missing, STOP and flag the prerequisite.

## 6. Acceptance criteria
- [ ] No modal can be occluded by the status bar or backdrop (all overlays at `var(--z-modal)`).
- [ ] Global gold/accent bars use `var(--z-system-banner)`; no `2147483648` / `999999` literals remain.
- [ ] `npm run color:guard` clean.
- [ ] Screenshot spot-check shows banner-over-modal-over-backdrop ordering unchanged.
- [ ] `npm run typecheck` passes.

## 7. Validation
```bash
npm run typecheck
npm run color:guard
# gate: general
```

## 8. Tests to add
Primarily visual/regression. Optionally add a guardrail check (foreshadowing MFP-20) that greps the six modal files for raw `z-index:` numeric literals in overlay declarations and fails if any remain (allowing only `var(--z-*)`). Add a CSS-module/computed-style assertion if the test harness can read the resolved `--z-modal` value.

## 9. Proof checklist
- [ ] `proofs/MFP-15/typecheck-clean.txt` — `npm run typecheck` output.
- [ ] `proofs/MFP-15/color-guard.txt` — `npm run color:guard` output.
- [ ] `proofs/MFP-15/screenshot/` — before/after PNGs of a stacked modal + global banner showing unchanged ordering (use screenshot-map-explorer skill for map surfaces).
