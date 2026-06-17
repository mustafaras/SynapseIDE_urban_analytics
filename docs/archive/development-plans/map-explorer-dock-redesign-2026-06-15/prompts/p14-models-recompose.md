# p14 — Models Tab Single-Column Recompose (Functional)

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p14 · **Depends on:** p13 · **Tracks:** A (recompose) + B (support shots)

## Mission
Recompose the Models tab from a cramped two-column (builder form | run preview/batch/output) layout into one vertical, top-to-bottom flow, so the whole model-building task is readable in the narrow left dock.

## Why (problem #6)
The owner (third screenshot): *"the Models tab design is very bad; content can't be fully read or used because of the crammed multi-column layout."* The form and the run-preview/batch/output columns fight for ~300–440px.

## Context primer (self-contained)
- The Models tab lives in the LEFT dock: Analyze workspace (`analyze/MapAnalyzeWorkspace.tsx`, tab `analyze-models`) renders `modelBuilder/MapModelBuilderPanel.tsx`.
- `MapModelBuilderPanel.tsx` currently splits into: LEFT = Model name / Primary source / Add processing step / Workflow graph; RIGHT = RUN PREVIEW / BATCH TARGETS / OUTPUT AND EVIDENCE. It uses model `state`/handlers from `@/services/map/model` (`saveMapModel`, `MapModelDefinition`, run/batch results).
- The "Blocked" / "Needs input" / "All steps ready" pills shown there must also follow the p01/p03 calm-status rule (no rounds, no saturated fills).

## Files
- `edit` — `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx` — composition: merge the two columns into one vertical flow (Define → Steps → Workflow graph → Run preview → Batch → Output/Evidence).
- `reference` — `src/centerpanel/components/map/analyze/MapAnalyzeWorkspace.tsx` — how the tab mounts (`width="100%"`).
- `reference` — `@/services/map/model` — state/handlers (do not change the model contract).
- `edit` — `src/centerpanel/components/map/__tests__/MapModelBuilderPanel.test.tsx` — update structure assertions; keep behavior coverage.

## Do NOT touch / reuse
- Do not change the model definition/run/batch contracts in `@/services/map/model` — composition only.
- Reuse `GisSectionHeader`, `GisPropertyGrid`, `GisStatusChip`, `GisProgressBar` from `ui/`.
- No rounds / saturated status (p01 rule).

## Track A — Functional
### Steps
1. Replace the two-column grid with a single vertical column of clearly labeled sections in task order:
   1) Define (model name, primary/overlay source) → 2) Steps (add processing step, ordered step list) → 3) Workflow graph → 4) Run preview (inputs, chain, output, blockers) → 5) Batch targets → 6) Output & evidence.
2. Keep all existing handlers (`onRun`, `onRunBatch`, `onExportToIdeAndUrban`, `saveMapModel`) and state. The readiness signals ("All steps ready"/"Blocked"/"Needs input") become calm inline status lines/chips (no rounds).
3. Ensure run/batch/output actions remain reachable and correctly enabled/disabled (e.g. disabled until a source + a step exist).
4. Update `MapModelBuilderPanel.test.tsx`: assert single-column section order and that run/batch actions + readiness logic still work.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/MapModelBuilderPanel.test.tsx`
- `npx vitest run src/centerpanel/components/map`
- `npm run typecheck`
- `npm run lint:no-tailwind-centerpanel`
- Save summary → `evidence/p14-trackA.md`.

### Done criteria
- Models tab is a single vertical flow; all run/batch/output behavior preserved; readiness uses calm status. Tests green; lint + typecheck clean.

## Track B — Visual (support)
### Steps
1. Screenshot the recomposed Models tab (empty model + a model with steps + a blocked state). Save `evidence/p14-models-flow.png`, `evidence/p14-models-blocked.png`. Compare to `baseline/models-tab.png`. (Premium polish is p15; this proves readability of the new structure.)

### Verify
- `screenshot-map-explorer` produced the shots.

### Done criteria
- Visual proves the whole Models task is readable top-to-bottom in the left dock.

## Anti-amnesia exit checklist
- LEDGER: p14 A+B → `done`, phase closed.
- STATE: `phases[p14]` trackA/trackB `done` + evidence.
- Next action → `prompts/p15-models-visual.md`.

## Guardrails
- Composition only — do not alter `@/services/map/model` contracts.
- Calm status (p01); reuse `ui/` primitives. No Tailwind.
- Both tracks verified before closing.
