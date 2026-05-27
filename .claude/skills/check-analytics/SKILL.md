---
name: check-analytics
description: Run the required post-change validation for Urban Analytics and engine code. Use after any edit to src/features/urbanAnalytics/, src/engine/, src/services/data/, or src/workers/pool/. Runs typecheck then test:analytics and surfaces failures with context.
---

# Validate Urban Analytics / Engine Changes

This is the **mandatory** post-change check for the analytics domain. Run it every time you touch:

- `src/features/urbanAnalytics/`
- `src/engine/` (spatial-stats, simulation, wasm, spatial-db, gpu)
- `src/services/data/` (connectors, pipeline, eo)
- `src/workers/pool/`

## The check

```bash
npm run typecheck
npm run test:analytics
```

Run them **in order**. Type errors often cause test failures — fix the type errors first.

## What `test:analytics` covers

```
src/engine
src/features/urbanAnalytics
src/services/data
src/workers/pool
src/centerpanel/Tools/__tests__/CoverageDiagnosticsPanel.test.tsx
```

It does **not** cover centerpanel map components — for those use `npx vitest run <path>`.

## Reading failures

**TypeScript errors** (`npm run typecheck`):

- `exactOptionalPropertyTypes` violations: `prop?: string` ≠ `prop: string | undefined`. Add the explicit `| undefined` union or remove the `?`.
- `noUnusedLocals` / `noUnusedParameters`: delete the symbol or prefix with `_`.
- Generic `any`: replace with `unknown` + type narrowing.

**Test failures** (`npm run test:analytics`):

- Evidence artifact mutations: `UrbanEvidenceArtifact` is immutable after creation — use QA state transitions, not direct mutation.
- `score === null` treated as a value: `null` means *unknown*, not high/zero fitness. Add a null guard.
- CRS errors: any area/distance calculation must project out of EPSG:4326 first.
- Store selector failures: select individual fields, not entire store objects.

## When to escalate to the full gate

Run `npm run validate:rc` before committing a feature branch or PR. It runs:

```bash
npm run typecheck
npm run lint:errors
npm run test        # full vitest
npm run build
npm run perf:budgets
npm run test:e2e:ci
```

`perf:budgets` will fail if a new import bloats a vendor chunk beyond its budget — check the chunk report and move heavy imports behind a dynamic `import()` if needed.

## Common pitfalls

- Importing a store you don't own (cross-module coupling) will often compile fine but break the evidence or validity contracts at test time. Check module ownership in `CLAUDE.md` if a test fails unexpectedly.
- The `test:analytics` runner can hang if a test opens a Zustand `persist` store that tries to write `localStorage` in a Node environment. Mock the store or use `vi.mock()` on the persist layer.
