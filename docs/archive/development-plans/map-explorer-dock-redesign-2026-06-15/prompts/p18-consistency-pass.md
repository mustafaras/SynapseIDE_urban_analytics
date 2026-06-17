# p18 — Cross-Cutting Consistency Pass

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p18 · **Depends on:** p02, p03, p11, p12, p13, p15, p17 · **Tracks:** A (consistency + a11y) + B (cross-surface QA)

## Mission
Sweep the now-redesigned surfaces for consistency: shared empty states, density, typography rhythm, focus order, keyboard operability, and reduced-motion — so the whole Map Explorer reads as one premium system, not a patchwork.

## Why (problem #10 — latent)
After 17 phases of targeted changes, drift accumulates: slightly different empty states, spacing, or focus behavior between docks. This phase harmonizes them.

## Context primer (self-contained)
- Shared primitives live in `ui/` (`GisEmptyState`, `GisSectionHeader`, `GisPropertyGrid`, `GisStatusChip`, `GisIconButton`, `GisTooltip`) and `design/` (motion, tokens). Use them everywhere instead of bespoke markup.
- A11y matrix: `mapAccessibilityMatrix.ts`; a11y test surface: `__tests__/map-accessibility.test.ts`; visual QA inventory: `__tests__/mapVisualQA.test.ts`, `mapSurfaceInventory.test.ts`.
- Reduced-motion + high-contrast are first-class (the `screenshot-map-explorer` skill can capture both).

## Files
- `edit` — any redesigned surface that diverges (drawing modal, right dock panels, left workspaces, Models tab, status bar) — only to align to shared primitives/tokens.
- `reference`/`edit` — `src/centerpanel/components/map/ui/*`, `design/*` — extend shared primitives if a real gap exists (additive).
- `edit` — `src/centerpanel/components/map/__tests__/map-accessibility.test.ts`, `mapVisualQA.test.ts` — extend coverage to the redesigned surfaces.

## Do NOT touch / reuse
- Reuse shared `ui/`/`design/` primitives; do not fork new one-off components.
- Do not undo earlier phases' decisions (single-column, calm status, route model) — only harmonize.
- No Tailwind.

## Track A — Functional
### Steps
1. Audit empty states across redesigned surfaces → all use `GisEmptyState` with consistent voice.
2. Audit density/typography → consistent use of `MAP_SPACING`/`MAP_TYPOGRAPHY` section rhythm; no ad-hoc font sizes.
3. Audit focus order + keyboard operability across the floating right dock, drawing modal, Models tab, status bar → tab order logical, Escape consistent, focus return correct.
4. Confirm reduced-motion holds everywhere (no surface animates when reduced).
5. Extend a11y + visual-QA tests to cover the redesigned surfaces.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/map-accessibility.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/mapVisualQA.test.ts`
- `npx vitest run src/centerpanel/components/map`
- `npm run typecheck`
- `npm run lint:no-tailwind-centerpanel`
- `npm run test:e2e:a11y`
- Save summary → `evidence/p18-trackA.md`.

### Done criteria
- Shared empty states/density/typography; consistent focus + keyboard; reduced-motion everywhere. a11y + visual-QA tests extended and green. lint + typecheck clean.

## Track B — Visual
### Steps
1. Capture a cross-surface sweep: drawing modal, right dock, left workspace, Models tab, status bar — in default, reduced-motion, and high-contrast variants. Save under `evidence/p18-<surface>-<variant>.png`.

### Verify
- `screenshot-map-explorer` produced the sweep (use its reduced-motion + high-contrast capture).

### Done criteria
- Visual proves one coherent premium system across default/reduced-motion/high-contrast.

## Anti-amnesia exit checklist
- LEDGER: p18 A+B → `done`, phase closed; session-log notes any shared primitive extended.
- STATE: `phases[p18]` trackA/trackB `done` + evidence.
- Next action → `prompts/p19-final-gate.md`.

## Guardrails
- Reuse shared primitives. Don't reverse earlier phases. Reduced-motion + high-contrast mandatory. No Tailwind.
- Both tracks verified before closing.
