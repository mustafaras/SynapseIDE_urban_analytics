# p08 — AOI → Compatible Scientific Flows → Evidence

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p08 · **Depends on:** p07 · **Tracks:** A (analysis chain) + B (dispatch shots)

## Mission
Close the GIS loop: from a drawn/selected AOI, surface the **compatible scientific analyses**, let the user dispatch one, and produce a real **evidence artifact** that flows to Urban Analytics — so the drawn area genuinely gets analyzed, not just outlined.

## Why (problem #2 — blocker)
The owner wants drawn/selected areas to "run scientific analytical analyses" and for these capabilities to "connect to each other and work as a complete, real, flawless GIS tool."

## Context primer (self-contained)
- `MapAnalysisDispatcher.ts`: `getCompatibleAoiFlows(aoi)` returns analyses valid for the AOI; `dispatchRecommendationFlow(...)` runs one; `SelectionStatisticsSummary` for selection stats.
- Evidence: `mapEvidenceArtifacts.ts` (`upsertMapEvidenceArtifact`) registers artifacts; the cross-module bus `synapseBus` emits `analytics.artifact.publish` / `evidence.artifact.register` (IDs only, no geometry payloads). Urban Analytics consumes via the bridge.
- Hard limits: max 200 evidence artifacts per session (`context/evidenceArtifacts.ts`); evidence is immutable (mark stale via QA, never mutate); `data.score === null` means unknown, not high.
- Flow dispatch UI: `controllers/MapFlowDispatchDialog.tsx`. Urban method preview path: `handlePreviewUrbanMethodWorkflow`, `activeUrbanMethodRequest` in Core.

## Files
- `edit` — `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx` — AOI → `getCompatibleAoiFlows` → dispatch → evidence handlers.
- `reference` — `src/services/map/MapAnalysisDispatcher.ts` — flow compatibility + dispatch.
- `reference` — `src/centerpanel/components/map/mapEvidenceArtifacts.ts` — artifact registration.
- `reference` — `src/services/synapseBus.ts` + `src/types/synapse-bus.ts` — `analytics.artifact.publish`, `evidence.artifact.register` (IDs only).
- `reference` — `src/centerpanel/components/map/controllers/MapFlowDispatchDialog.tsx`.
- `edit` — `src/centerpanel/components/map/__tests__/map-drawing-aoi-data.test.ts` — extend with the analysis→evidence assertions (or add `mapAoiAnalysis.test.ts`).

## Do NOT touch / reuse
- Reuse the dispatcher + evidence registry — do not invent a parallel analysis path.
- Bus payloads carry IDs/refs only — never raw GeoJSON or bulk geometry.
- Do not fabricate QA scores or citations; respect the evidence contract.

## Track A — Functional
### Steps
1. From the AOI (drawn rectangle/polygon or selection), call `getCompatibleAoiFlows(aoi)` and present the compatible analyses in the Flow Dispatch dialog (the "Fetch data" footer action already opens it — extend it to list analyses, not just data fetch).
2. On user pick, run `dispatchRecommendationFlow(...)`; produce the analysis output layer + a real evidence artifact via `upsertMapEvidenceArtifact` (respect the 200-artifact cap; immutable; explicit capability status; `score: null` when unknown).
3. Emit `analytics.artifact.publish` / `evidence.artifact.register` on `synapseBus` with IDs only, so Urban Analytics can pick it up. Clean up subscriptions.
4. Ensure the dispatch is user-confirmed (no auto-apply) and that CRS-sensitive analyses declare `requiredCrs` and project before measuring.
5. Extend the test: AOI → compatible flows non-empty for a known fixture → dispatch → assert an immutable evidence artifact with provenance + a bus publish (IDs only).

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/map-drawing-aoi-data.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts`
- `npm run typecheck`
- If `src/features/urbanAnalytics/` was touched: run the `check-analytics` skill.
- Save summary → `evidence/p08-trackA.md`.

### Done criteria
- AOI surfaces real compatible analyses; dispatch yields an immutable evidence artifact + IDs-only bus publish to Urban Analytics. Tests green; typecheck clean; evidence contract respected.

## Track B — Visual
### Steps
1. Screenshot: AOI drawn → dispatch dialog listing compatible analyses → chosen analysis result on map → evidence registered (evidence tray / artifact reference). Save `evidence/p08-aoi-analysis.png` and `evidence/p08-evidence-registered.png`.

### Verify
- `screenshot-map-explorer` produced the shots.

### Done criteria
- Visual proves AOI → analysis → evidence end to end.

## Anti-amnesia exit checklist
- LEDGER: p08 A+B → `done`, phase closed; session-log notes which analyses are wired and their capability status.
- STATE: `phases[p08]` trackA/trackB `done` + evidence.
- Next action → `prompts/p09-right-dock-floating-modal.md`.

## Guardrails
- Evidence immutable; max 200; `score:null`=unknown; explicit capability status; no fake citations.
- Bus payloads = IDs/refs only. Reuse dispatcher/registry/contracts.
- CRS: project before metrics. No Tailwind. No `localStorage`.
- Both tracks verified before closing.
