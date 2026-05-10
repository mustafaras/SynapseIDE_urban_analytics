---
applyTo: "src/features/urbanAnalytics/**"
description: >
  Rules for working inside the Urban Analytics feature module. Use only the
  section relevant to your edit (methods/indicators/calculators, context and
  evidence, seeds/validity/data fitness, or the urban modal shell).
---

# Urban Analytics — Implementation Rules

## Before Editing

1. Read the ledger status: [`DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`](../../DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md) — confirm which prompts are complete and which is active.
2. Check the active prompt in [`DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`](../../DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md) for exact scope, acceptance criteria, and stop conditions.
3. Verify live imports and then apply only the rule sections relevant to the file being edited — planned APIs may differ from current code.

## Module Ownership

Urban Analytics owns and must not leak into:

| Owns | Does NOT own |
|---|---|
| `useUrbanContextStore` — analytical context state | Map rendering state (`useMapExplorerStore`) |
| `evidenceArtifacts.ts` — artifact registry | Editor tabs or file buffers (`editorStore`) |
| Method validity envelopes (`lib/methodValidity.ts`) | Heavy GeoJSON or raw feature arrays |
| Data fitness profiles (`lib/dataFitness.ts`) | Terminal execution state |
| Indicator definitions and calculators | Reporting template rendering |
| Seed method/dataset definitions (`seeds/`) | |

## Scientific Evidence Rules

- `UrbanEvidenceArtifact` is **immutable after registration**. Never mutate; mark stale via QA state.
- `UrbanDataFitnessProfile.score` must be `null` when inputs are unknown — never coerce to `0` or `1`.
- `UrbanMethodValidityEnvelope.capabilityStatus` must be one of: `implemented` | `demo_mode` | `residual_gap` | `environment_dependent` | `deferred`. Never omit.
- Methods must declare their valid spatial scale range. A method valid at `city` scale must not silently run at `parcel` scale.
- CRS: never compute area or distance in EPSG:4326. Declare `requiredCrs` on validity envelopes.

## Store Patterns

```ts
// Correct: fine-grained selector
const activeScale = useUrbanContextStore(s => s.activeScale);

// Incorrect: subscribes to entire store
const store = useUrbanContextStore();
```

Use `immer` drafts for all multi-field updates:

```ts
patchContext: (patch) => set(produce(draft => { Object.assign(draft, patch); }))
```

## Seed Library

- Do not rewrite all seeds in one pass.
- When adding `validityEnvelope` to a seed, add it to a representative subset first.
- Seeds without metadata must use `getDefaultValidityEnvelope()` so validity fields stay explicit and consistent when metadata is missing.

## Calculator / Indicator Rules

- Never change a formula without a test that validates the mathematical output.
- `IndicatorResult` must carry: `unit`, `inputCount`, `missingnessRatio`, `valid`, `warnings[]`, `sourceCalculator`, `computedAt`.
- Invalid inputs → return a result with `valid: false` and descriptive `warnings[]`, not a throw.

## CSS

- Use CSS Modules (`.module.css`). No Tailwind. No inline style objects for layout.
- Follow the dense premium style: thin `1px` separators, amber accent tokens, no decorative card nesting.

## Validation After Each Change

```bash
npm run typecheck
npm run test:analytics
```

Both must pass before marking a prompt complete in the ledger.

## Ledger Update

After completing any prompt scope, update:
- Prompt Status Register (set to `completed`)
- Files Inspected and Files Changed registries
- Validation History (command + outcome)
- Next Prompt Pointer
