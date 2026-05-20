# Urban Analytics Workbench — Agent Instructions

> Browser-based spatial intelligence platform: tri-modal workbench (Synapse IDE + Map Explorer + Urban Analytics modal) built with React 19, Vite 8, TypeScript 5.8, deck.gl 9, and Zustand.

---

## Essential Commands

```bash
npm run dev              # Vite + terminal server (localhost:5173)
npm run typecheck        # tsc --noEmit (run after every change)
npm run lint:errors      # eslint quiet mode (errors only)
npm run test             # vitest run (all)
npm run test:analytics   # Urban Analytics + engine subset (fastest for UA work)
npm run test:e2e         # Playwright (needs dev server running)
npm run build            # production build
npm run validate:rc      # full RC gate: typecheck + lint + test + build + e2e
```

Run `npm run typecheck` and `npm run test:analytics` after any change to `src/features/urbanAnalytics/`.

---

## Architecture

Three bounded modules share state only through typed contracts — never through implicit coupling:

| Module | Owns | Never owns |
|---|---|---|
| **Urban Analytics** (`src/features/urbanAnalytics/`) | Analysis context, method catalog, indicators, evidence artifacts, data fitness, method validity, workflow run manifests | Map rendering, editor tabs, large geometry buffers |
| **Map Explorer** (`src/stores/useMapExplorerStore.ts`, `src/services/map/`) | Map viewport, layer rendering, geometry, feature selection | Analytical interpretation, indicator formulas |
| **Synapse IDE** (`src/stores/appStore.ts`, `src/stores/editorStore.ts`) | Editor state, file buffers, terminal, AI chat | Spatial data, analytical context |

Cross-module sync uses **Zustand store selectors**, **`usePanelBridgeStore`** (flow→right-panel tag mapping), and **typed bridge services** (`src/services/editorBridge.ts`, `src/services/map/`). Do not pass heavy geometry or raw datasets through generic UI events.

---

## State Management

All state is **Zustand**. No Redux, no Context API for app state.

- `persist` middleware: namespaced storage (e.g. `urban.ctx.*`, `urban.config.*`)
- `immer` middleware: immutable drafts — use `draft.field = value` inside producers
- Fine-grained selectors: select individual fields, not entire stores, to avoid unnecessary renders

Key stores:

| Store | Purpose |
|---|---|
| `src/features/urbanAnalytics/useUrbanContextStore.ts` | Core analytical context kernel — evidence artifacts, run/layer/code artifact IDs |
| `src/features/urbanAnalytics/store.ts` | Navigation, section hierarchy, card library filtering |
| `src/stores/useFlowStore.ts` | Analytical workflow state (active flow, completed runs) |
| `src/stores/usePanelBridgeStore.ts` | CenterPanel ↔ RightPanel coordination (flow→tag mapping) |
| `src/stores/useMapExplorerStore.ts` | Map layers, bounds, basemaps, overlay visibility |

---

## UI Conventions

- **CSS approach**: CSS Modules for scoped styles (`*.module.css`), styled-components for shell/templates. **No Tailwind** — enforced by `scripts/check-no-tailwind-centerpanel.ps1` and `npm run lint:no-tailwind-centerpanel`.
- **Component libraries**: Radix UI (headless), deck.gl 9 (geo layers), React Three Fiber (3D), Chart.js, xterm.js
- **Design language**: Minimal premium — dense typography hierarchy, thin separators, restrained amber accents. No decorative cards inside cards, no marketing hero layouts, no idle placeholder strips.
- **Premium UI rule**: Context must be visible without overwhelming the work surface. Every element earns its space.

---

## TypeScript Strictness

`tsconfig.app.json` enforces: `strict`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noImplicitOverride`. No silent `any`. Use `unknown` with narrowing.

**Path aliases** (configured in `tsconfig.json` and `vite.config.ts`):
`@/*` → `src/*` plus `@/components/*`, `@/hooks/*`, `@/utils/*`, `@/types/*`, `@/stores/*`, `@/services/*`, `@/ai/*`, `@/features/*`

---

## Testing Conventions

- Framework: **vitest** with v8 coverage
- Location: `src/**/__tests__/**/*.test.{ts,tsx}` — colocated `__tests__` folders
- Coverage policy: `src/config/coveragePolicy.json`
- Use `vi.mock()` for stores and services; test store logic through actions + selectors, not internals
- E2E: Playwright in `e2e/`, tagged `@smoke` / `@a11y` / functional; requires dev server

---

## Scientific / GIS Domain Rules

These rules are enforced by the domain and must not be violated silently:

1. **CRS**: Never compute area or distance in EPSG:4326 (geographic). Methods must declare `requiredCrs`. Always project before spatial calculations.
2. **Evidence provenance**: `UrbanEvidenceArtifact` is immutable after creation. Mark stale/invalid via QA state — never silently mutate or delete.
3. **Data fitness**: `score` is `null` when required metadata is unknown. Treat `null` as unknown, not as high fitness. Never claim readiness without a real source.
4. **Method validity**: Methods expose a `UrbanMethodValidityEnvelope` — valid scale, required CRS, data types, limitations. Capability status must be explicit: `implemented` | `demo_mode` | `residual_gap` | `environment_dependent` | `deferred`.
5. **Max artifacts**: 200 `UrbanEvidenceArtifact` instances per context session (enforced in `context/evidenceArtifacts.ts`).
6. **No false readiness**: Never represent demo or synthetic data as real analytical output. Always label mode.

---

## Development Plans Archive

The previous `DEVELOPMENT_PLANS/` operating pack is complete. The root planning folder has been removed; the historical ledgers, manifests, prompt ladders, and alignment documents live here:

```text
docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/
```

Before using any archived Urban Analytics, Map Explorer, or Synapse IDE plan material, read:

1. [`docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/README.md`](docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/README.md)
2. [`docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/ARCHIVE_INDEX.md`](docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/ARCHIVE_INDEX.md)

Completion status at archive time:

- Urban Analytics: `all_completed`
- Map Explorer: `all_completed`
- Synapse IDE: `all_completed`

Archived material is historical reference only. New structured work should start from a new operating pack or a user-directed task, not by continuing the archived prompt ladders.

---

## Key Source Files

| Path | What it is |
|---|---|
| `src/features/urbanAnalytics/lib/types.ts` | Core domain types (~900 lines): scales, tags, indicator kinds, evidence artifact, method validity, data fitness |
| `src/features/urbanAnalytics/useUrbanContextStore.ts` | Context kernel store with `immer` + `persist` |
| `src/features/urbanAnalytics/context/evidenceArtifacts.ts` | Evidence artifact registry, provenance, QA |
| `src/features/urbanAnalytics/lib/methodValidity.ts` | Method validity assessment helpers |
| `src/features/urbanAnalytics/lib/dataFitness.ts` | Data fitness scoring helpers |
| `src/features/urbanAnalytics/seeds/` | 16+ seed method/dataset definitions |
| `src/centerpanel/Flows/flowTypes.ts` | Workflow run shapes |
| `src/stores/usePanelBridgeStore.ts` | Cross-panel coordination contract |
| `src/services/map/MapEngineAdapter.ts` | Map layer publication API |
| `src/services/editorBridge.ts` | IDE code artifact bridge |
| `src/lib/error-bus.ts` | Centralized error emission and deduplication |

---

## Worker / Compute Architecture

- **Web workers**: `src/workers/` — GWR regression, hashing, PII redaction, search indexing
- **Worker pool**: `src/workers/pool/BackgroundWorkerPool.ts` — thread lifecycle, task queuing
- **WASM**: `src/engine/wasm/SpatialIndexWASM.ts` — R-tree spatial index with JS fallback (`preferredBackend: 'wasm' | 'javascript'`)
- **DuckDB-WASM**: `src/engine/spatial-db/` — in-browser SQL for large datasets
- **GPU**: `src/engine/gpu/` — WebGPU-accelerated spatial operations

Offload heavy computation to workers. Do not block the main thread with spatial loops over large feature sets.

---

## Common Pitfalls

- Importing from a store you don't own creates implicit cross-module coupling — use bridge services or typed events.
- Adding fake citations, synthetic QA scores, or placeholder evidence violates the scientific evidence contract.
- `exactOptionalPropertyTypes: true` means `prop?: string` and `prop: string | undefined` are not interchangeable — be precise.
- CSS Modules use camelCase in JSX (`styles.myClass`) but kebab-case in `.module.css` (`.my-class`).
- The `centerpanel/` tree must not use Tailwind — the lint rule `lint:no-tailwind-centerpanel` will fail CI.
- Never call `localStorage` directly — use the project's persistence abstraction (Zustand `persist` middleware).
