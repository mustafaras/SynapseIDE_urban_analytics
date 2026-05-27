---
name: add-ua-card
description: Add a new analytical method, indicator, or dataset card to the Urban Analytics seed library. Use when asked to "add a new UA method", "add a card to the analytics library", "register a new indicator", or "add a new seed".
---

# Add a New Urban Analytics Card / Seed

Cards are the discoverable units in the Urban Analytics right-panel library. Each card maps to an analytical method, indicator, or dataset. This recipe covers the full addition: seed entry → validity preset → test → typecheck.

## Where cards live

```
src/features/urbanAnalytics/seeds/
├── index.ts                   ← aggregates all builders into buildFullLibrary()
├── projectScoping.ts
├── urbanIndicators.ts
├── additionalIndicators.ts
├── vulnerability.ts
├── transportNetworks.ts
├── remoteSensing.ts
├── spatialStats.ts
├── thematicAnalysis.ts
├── typologyClassification.ts
├── gisMethods.ts
├── interventionDesign.ts
├── monitoringReporting.ts
├── policyImplementation.ts
├── dataEngineering.ts
├── supplementary.ts
└── voxcity.ts
```

Pick the file whose domain best matches your card. If none fit, add a new file and register its builder in `index.ts`.

## Step 1 — Add the card object

Open the target seed file and add to its builder function:

```ts
import type { Card } from '../lib/types';
import { applyUrbanMethodValidityPreset } from '../context/methodValidity';

// Inside buildXxxCards():
{
  id: 'domain-short-slug',           // unique, kebab-case, no spaces
  title: 'Human-readable Title',
  sectionId: 'matching_section_id',  // must exist in lib/sectionHierarchy.ts
  summary: 'One or two sentences describing what this method/indicator does.',

  // Optional — include only if meaningful:
  tags: ['spatial', 'equity'],
  dataRequirements: ['census_tract', 'road_network'],
  capabilityStatus: 'implemented',   // implemented | demo_mode | residual_gap | environment_dependent | deferred
  requiredCrs: 'EPSG:3857',          // if the method needs a projected CRS
  scale: 'neighbourhood',            // city | district | neighbourhood | parcel | building
},
```

Then immediately apply the validity preset:

```ts
const card = { …cardObject };
applyUrbanMethodValidityPreset(card);
```

**Rules:**
- `id` must be globally unique across all seed files — grep before choosing.
- `capabilityStatus` must reflect reality. `implemented` = runs today; `demo_mode` = synthetic output only; `deferred` = not yet built.
- Never set `score` directly — that's computed at runtime from actual data.
- If the method operates on spatial data, declare `requiredCrs`. Leave undefined only for purely tabular methods.

## Step 2 — Check the section exists

The `sectionId` you use must be registered in `src/features/urbanAnalytics/lib/sectionHierarchy.ts`. If you need a new section, add it there first.

```bash
grep -n "sectionId\|id:" src/features/urbanAnalytics/lib/sectionHierarchy.ts | grep "your_section_id"
```

## Step 3 — The right-panel registry is automatic

`src/features/urbanAnalytics/rightPanelRegistry.ts` derives from `buildFullLibrary()` at startup. **Do not touch it** — your card appears automatically once the seed builder returns it.

## Step 4 — Validate

```bash
npm run typecheck
npm run test:analytics
```

If you added a method card that runs through the execution engine, also add a unit test in `src/features/urbanAnalytics/__tests__/` verifying the card's `id` is present in the library and its `capabilityStatus` is not `undefined`.

Minimal test pattern:

```ts
import { buildFullLibrary } from '@/features/urbanAnalytics/seeds';

it('my-new-card is in the library with a declared capabilityStatus', () => {
  const library = buildFullLibrary();
  const card = library.find(c => c.id === 'domain-short-slug');
  expect(card).toBeDefined();
  expect(card?.capabilityStatus).toBeTruthy();
});
```

## Step 5 — Evidence contract (if the card produces output)

If your card produces analytical output published as a `UrbanEvidenceArtifact`:

1. Artifacts are **immutable after creation** — never mutate fields post-creation.
2. Mark stale output via QA state (`context/evidenceArtifacts.ts`), not by deleting/rewriting.
3. Max 200 artifacts per session — the registry enforces this; your card should not create multiple artifacts per run without cleaning up prior ones.
4. `score` on `DataFitnessAssessment` is `null` when source metadata is unavailable — guard it.

## Common mistakes

- Duplicate `id` → `buildFullLibrary()` will silently overwrite (grep first).
- Missing `sectionId` → card renders in the wrong panel section or throws at runtime.
- `capabilityStatus: 'implemented'` on a card that calls a stub → violates the no-false-readiness rule; use `demo_mode`.
- Skipping `applyUrbanMethodValidityPreset` → validity envelope is `undefined`, which breaks method compatibility checks.
