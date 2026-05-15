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

## Development Plans System (Ongoing Structured Work)

The `DEVELOPMENT_PLANS/` folder is the **durable memory system** for multi-session agent work. It is intentionally large, so agents must use the token-minimized entry path before opening any full ledger or plan.

### Token-Minimized Startup

Before editing Urban Analytics, Map Explorer, or Synapse IDE features:

1. Read [`DEVELOPMENT_PLANS/CONTEXT_MIN.md`](DEVELOPMENT_PLANS/CONTEXT_MIN.md).
2. Read [`DEVELOPMENT_PLANS/CURRENT_TASK.json`](DEVELOPMENT_PLANS/CURRENT_TASK.json).
3. Run the relevant next-prompt helper with `-Json`.
4. Use `rg` to pull only the active prompt block, status row, or named section from large files.
5. Open a full ledger, full development plan, or full sequential prompt file only when targeted search is insufficient.

Large files remain authoritative; they are not default startup context.

| File | Role |
|---|---|
| [`DEVELOPMENT_PLANS/CONTEXT_MIN.md`](DEVELOPMENT_PLANS/CONTEXT_MIN.md) | **First-read context budget** — concise startup protocol, authority order, current module state |
| [`DEVELOPMENT_PLANS/CURRENT_TASK.json`](DEVELOPMENT_PLANS/CURRENT_TASK.json) | **Machine-readable task pointer** — current prompt status and active file paths |
| [`DEVELOPMENT_PLANS/MODULE_INDEX.json`](DEVELOPMENT_PLANS/MODULE_INDEX.json) | Compact module ownership and validation map |
| [`DEVELOPMENT_PLANS/LARGE_FILE_INDEX.md`](DEVELOPMENT_PLANS/LARGE_FILE_INDEX.md) | Large-file access guide; search first, line-window second |
| [`DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`](DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md) | **Execution source of truth** — prompt status, files changed, validation history, risks |
| [`DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`](DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md) | Ordered prompt ladder — scope, acceptance criteria, stop conditions |
| [`DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`](DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json) | Machine-readable prompt catalog |
| [`DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`](DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md) | Cross-module product authority |
| [`DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`](DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md) | Single entry point for any Urban Analytics session |
| [`DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`](DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md) | Protocol for durable memory handoff between sessions |

To find the next pending prompt:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\get-next-urban-analytics-prompt.ps1 -Json
```

**Priority order when documents disagree**: Live repository > relevant ledger status/search hit > Manifest > targeted sequential prompt block > targeted development plan section > Alignment spec > Chat history (non-authoritative).

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
