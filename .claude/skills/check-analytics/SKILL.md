---
name: check-analytics
description: Run required validation for Urban Analytics, analytical engines, data services, and worker-pool code. Use after edits to src/features/urbanAnalytics/, src/engine/, src/services/data/, src/workers/pool/, or when a GIS Modal Premium UI prompt is forced to touch Urban Analytics bridge contracts.
---

# Validate Urban Analytics and Engine Changes

This is the mandatory post-change check for the analytics domain. In the GIS Modal Premium UI pack, touching Urban Analytics should be exceptional and limited to typed bridge compatibility.

Run this when you touch:

- `src/features/urbanAnalytics/`
- `src/engine/`
- `src/services/data/`
- `src/workers/pool/`
- Map Explorer to Urban Analytics bridge code that changes analytical contracts

## Core Gate

Run in order:

```bash
npm run typecheck
npm run test:analytics
```

Fix type errors first. Test failures after type errors are often noise.

## What `test:analytics` Covers

```text
src/engine
src/features/urbanAnalytics
src/services/data
src/workers/pool
src/centerpanel/Tools/__tests__/CoverageDiagnosticsPanel.test.tsx
```

It does not cover most Map Explorer UI. For GIS modal UI work, use `check-gis-modal` as well.

## GIS Modal Bridge Rule

If a GIS modal prompt touches Urban Analytics:

1. Confirm the prompt explicitly requires typed bridge compatibility.
2. Preserve module ownership: Urban Analytics owns interpretation, indicators, evidence, fitness, and method validity; Map Explorer owns viewport, layers, geometry, and rendering.
3. Do not pass heavy geometry or raw source payloads through generic UI events.
4. Run both gates:

```bash
npm run typecheck
npm run test:analytics
npx vitest run src/services/map
```

Add targeted tests for any changed bridge contract.

## Reading Failures

TypeScript:

- `exactOptionalPropertyTypes`: `prop?: string` is not the same as `prop: string | undefined`.
- `noUnusedLocals` or `noUnusedParameters`: remove the symbol or deliberately prefix an unused parameter with `_`.
- Avoid silent `any`; use `unknown` with narrowing.

Analytics tests:

- Evidence artifacts are immutable after creation. Mark stale or invalid through QA state, not direct mutation.
- `DataFitnessAssessment.score === null` means unknown metadata, not ready and not zero.
- Area and distance must not be computed in EPSG:4326. Project first and declare `requiredCrs`.
- Capability status must be explicit: `implemented`, `demo_mode`, `residual_gap`, `environment_dependent`, or `deferred`.
- Store tests should use actions and selectors, not internal implementation details.

## Escalate to Full Gate

Before a release branch or broad PR:

```bash
npm run validate:rc
```

If the GIS modal pack is involved, also ensure its ledger records prompt-specific validation, scientific truthfulness proof, and residual risk.
