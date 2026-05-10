# Prompt 20 — Urban Growth Cellular Automata: Completion Report

**Status**: COMPLETE  
**Date**: 2026-04-12  
**Validation Gate**: PASS

## Scope

Constrained cellular automata workflow for urban growth scenario generation with calibration inputs, explicit constraint surfaces, stochastic controls, temporal playback, validation metrics, completed-run publication, and result-linked narrative generation.

## Primary Files

| File | Purpose |
|---|---|
| `src/centerpanel/Flows/CellularAutomataFlow.tsx` | Full Prompt 20 workflow UI and publishing logic |
| `src/centerpanel/Flows/cellularAutomataDemo.ts` | Demo calibration and observed states |
| `src/services/map/MapEngineAdapter.ts` | CA result adaptation into map outputs and completed runs |
| `src/centerpanel/Flows/narrativeBuilders.ts` | Structured narrative input for validation/export results |

## UI Deliverables

| Deliverable | Status | Location |
|---|---|---|
| Calibration input selection | PASS | `CellularAutomataFlow.tsx` |
| Constraint configuration | PASS | `CellularAutomataFlow.tsx` |
| Perturbation and growth controls | PASS | `CellularAutomataFlow.tsx` |
| Run simulation and publish results | PASS | `CellularAutomataFlow.tsx` |
| Temporal playback and predicted/observed comparison | PASS | `CellularAutomataFlow.tsx` |
| Validation export panel | PASS | `CellularAutomataFlow.tsx` |
| Narrative generation from validation results | PASS | `CellularAutomataFlow.tsx` + `narrativeBuilders.ts` |

## Integration Notes

- Completed CA runs are published into saved analytical runs and can be imported into Scenario Comparison.
- The validation/export surface now includes Prompt 19 narrative generation using the actual validation envelope.

## Validation

| Check | Result |
|---|---|
| `npm run test -- src/centerpanel/Flows/__tests__/flows.test.ts` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
