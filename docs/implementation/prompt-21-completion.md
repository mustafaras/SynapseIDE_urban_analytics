# Prompt 21 — Facility Optimisation: Completion Report

**Status**: COMPLETE  
**Date**: 2026-04-12  
**Validation Gate**: PASS

## Scope

Location-allocation workflow covering p-median, LSCP, and MCLP scenario testing with equity-aware controls, map publication, comparison/export, completed-run persistence, and result-linked narrative generation.

## Primary Files

| File | Purpose |
|---|---|
| `src/centerpanel/Flows/FacilityOptimisationFlow.tsx` | Prompt 21 workflow UI, execution, publication, and exports |
| `src/centerpanel/Flows/facilityOptimisationDemo.ts` | Demo demand and candidate-site dataset |
| `src/services/map/MapEngineAdapter.ts` | Catchment and selected-site adaptation for map outputs |
| `src/centerpanel/Flows/narrativeBuilders.ts` | Structured narrative input for comparison/export results |

## UI Deliverables

| Deliverable | Status | Location |
|---|---|---|
| Model selection and candidate filters | PASS | `FacilityOptimisationFlow.tsx` |
| Constraint and equity controls | PASS | `FacilityOptimisationFlow.tsx` |
| Scenario execution and variant persistence | PASS | `FacilityOptimisationFlow.tsx` |
| Results map and demand coverage view | PASS | `FacilityOptimisationFlow.tsx` |
| Comparison/export table | PASS | `FacilityOptimisationFlow.tsx` |
| Map publication and completed-run review outputs | PASS | `FacilityOptimisationFlow.tsx` |
| Narrative generation from active result view | PASS | `FacilityOptimisationFlow.tsx` + `narrativeBuilders.ts` |

## Integration Notes

- Facility optimisation outputs are bridged into Map Explorer and saved runs.
- The comparison/export result view now includes Prompt 19 narrative generation using real coverage and equity diagnostics.
- Completed runs remain importable into the Equity Audit workflow.

## Validation

| Check | Result |
|---|---|
| `npm run test -- src/centerpanel/Flows/__tests__/flows.test.ts` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
