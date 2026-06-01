---
applyTo: "src/features/urbanAnalytics/**"
description: >
  Rules for maintaining the Urban Analytics feature module. Use only the
  section relevant to your edit: methods/indicators/calculators, context and
  evidence, seeds/validity/data fitness, or the urban modal shell.
---

# Urban Analytics — Implementation Rules

## Before Editing

1. Treat Urban Analytics as a maintained module, not an active prompt ladder. The historical implementation pack is archived under [`docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/`](../../docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/).
2. Verify live imports and current tests before editing — archived plan APIs may differ from current code.
3. Apply only the rule sections relevant to the file being edited.

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

Both should pass before treating maintenance work as complete.

## Historical Archive

The former Urban Analytics prompt ledger is complete and archived. Read archived ledgers only for historical context or user-requested audits; do not treat them as active scope or update them for normal maintenance work.
