# p15 — Models Tab Premium Visual Flow

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p15 · **Depends on:** p14 · **Tracks:** A (support) + B (premium visual)

## Mission
Make the recomposed single-column Models tab feel premium: clear step rhythm, calm readiness language, a legible workflow graph, and a confident run/output region — minimal premium, not busy.

## Why (problem #6)
p14 made the Models tab readable; p15 makes it look intentional and high-quality so the owner can actually use the model builder comfortably.

## Context primer (self-contained)
- Styles: `modelBuilder/MapModelBuilderPanel.module.css`. Tokens: `mapTokens.ts` (+ p01 calm status).
- Sections (from p14, in order): Define → Steps → Workflow graph → Run preview → Batch → Output/Evidence.
- Design language: dense type, hairline separators between sections, restrained amber for the primary run action, no cards-in-cards, no rounds.

## Files
- `edit` — `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.module.css` — section rhythm, step list styling, run/output emphasis.
- `reference` — `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx` — apply classes / minor markup hooks only (behavior frozen from p14).
- `reference` — `src/centerpanel/components/map/ui/` — `GisSectionHeader`, `GisProgressBar`, `GisStatusChip`.

## Do NOT touch / reuse
- No behavior changes (p14 froze it). Visual only.
- Calm status only; no rounds/saturated fills.
- No Tailwind.

## Track A — Functional (support only)
### Steps
1. Confirm no behavior drift: re-run `MapModelBuilderPanel.test.tsx`.
2. If markup hooks (class names, test ids) are added, keep them additive and non-breaking.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/MapModelBuilderPanel.test.tsx`
- `npm run typecheck`
- `npm run lint:no-tailwind-centerpanel`
- Save summary → `evidence/p15-trackA.md`.

### Done criteria
- No behavior regression; lint + typecheck clean.

## Track B — Visual
### Steps
1. Style the section rhythm: each section a `GisSectionHeader` + hairline separator; consistent vertical spacing from tokens.
2. Step list: numbered/ordered, dense, clear add/remove affordances (no round chips).
3. Workflow graph: legible at narrow width; if it can't fit, make it scroll or collapse gracefully (not overflow).
4. Run region: primary "Run model" with restrained amber accent; "Save and run"/"Rerun saved" secondary; batch + output sections clearly subordinate.
5. Readiness ("All steps ready"/"Blocked"/"Needs input"): calm single-line status (p01 tokens), no pills.
6. Save `evidence/p15-models-premium.png` (full flow) + `evidence/p15-models-run.png` (run/output focus). Compare to `baseline/models-tab.png`.

### Verify
- `screenshot-map-explorer` produced the shots.

### Done criteria
- Visual proves a premium, calm, fully readable Models tab.

## Anti-amnesia exit checklist
- LEDGER: p15 A+B → `done`, phase closed (Models track p14→p15 complete).
- STATE: `phases[p15]` trackA/trackB `done` + evidence.
- Next action → `prompts/p16-status-overflow-fix.md`.

## Guardrails
- Visual only. Calm status. No Tailwind. Reuse `ui/` primitives + p01 tokens.
- Both tracks verified before closing.
