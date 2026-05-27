# Urban Analytics Workbench — Claude Code quick context

Browser-based spatial intelligence platform: tri-modal workbench (Synapse IDE + Map Explorer + Urban Analytics) — React 19, Vite 8, TypeScript 5.8, deck.gl 9, Zustand.

> Full conventions: [AGENTS.md](AGENTS.md). Read it on demand, not eagerly.

---

## Always-true rules (do not violate)

- **No Tailwind in `src/centerpanel/`** — enforced by `npm run lint:no-tailwind-centerpanel`.
- **CRS**: never compute area/distance in EPSG:4326. Project first (`requiredCrs` on every method).
- **`exactOptionalPropertyTypes: true`** — `prop?: string` ≠ `prop: string | undefined`.
- **Evidence artifacts immutable** — mark stale via QA state, never silently mutate or delete.
- **No fake/synthetic data labelled as real** — capability status must be explicit: `implemented` | `demo_mode` | `residual_gap` | `environment_dependent` | `deferred`.
- **State**: Zustand only. No Redux, no Context for app state. Use fine-grained selectors.
- **No direct `localStorage`** — use Zustand `persist` middleware (namespaced: `urban.ctx.*`, `urban.config.*`).
- **Max 200 `UrbanEvidenceArtifact` instances** per context session (enforced in `context/evidenceArtifacts.ts`).
- **`data.score` is `null` when metadata unknown** — treat `null` as unknown, never as high fitness.
- **No heavy geometry through generic UI events** — use bridge services or typed events.

---

## Commands

```bash
npm run dev              # Vite + terminal server (localhost:5173, port 9231)
npm run typecheck        # tsc --noEmit — run after every change
npm run lint:errors      # eslint quiet (errors only)
npm run lint:no-tailwind-centerpanel  # fails if Tailwind found in centerpanel/
npm run test             # vitest run (full suite)
npm run test:analytics   # UA + engine subset — fastest for UA/engine work
npm run test:e2e         # Playwright (needs dev server running)
npm run test:e2e:smoke   # @smoke tagged only
npm run test:e2e:a11y    # accessibility audit only
npm run validate:rc      # full RC gate: typecheck + lint + test + build + perf:budgets + e2e:ci
npm run build            # production build (12 GB heap)
npm run color:guard      # regression check on color palette
npm run deadcode         # ts-prune dead export scan
npm run format           # prettier
```

**After any change to `src/features/urbanAnalytics/`:**
```bash
npm run typecheck && npm run test:analytics
```

**Map tests** run via `npx vitest run <path>` (not `test:analytics`).

---

## Architecture — three bounded modules

| Module | Owns | Never owns |
|---|---|---|
| **Urban Analytics** (`src/features/urbanAnalytics/`) | Analysis context, method catalog, indicators, evidence artifacts, data fitness, method validity, workflow run manifests | Map rendering, editor tabs, large geometry buffers |
| **Map Explorer** (`src/stores/useMapExplorerStore.ts`, `src/services/map/`) | Map viewport, layer rendering, geometry, feature selection | Analytical interpretation, indicator formulas |
| **Synapse IDE** (`src/stores/appStore.ts`, `src/stores/editorStore.ts`) | Editor state, file buffers, terminal, AI chat | Spatial data, analytical context |

Cross-module sync: Zustand selectors → [`usePanelBridgeStore`](src/stores/usePanelBridgeStore.ts) → typed bridges ([`editorBridge.ts`](src/services/editorBridge.ts), [`MapEngineAdapter.ts`](src/services/map/MapEngineAdapter.ts)).

---

## Key source files

| Path | What it is |
|---|---|
| `src/features/urbanAnalytics/lib/types.ts` | Core domain types (~2 070 lines): scales, tags, indicator kinds, evidence artifacts, method validity, data fitness |
| `src/features/urbanAnalytics/useUrbanContextStore.ts` | Context kernel store — immer + persist |
| `src/features/urbanAnalytics/context/evidenceArtifacts.ts` | Evidence artifact registry, provenance, QA |
| `src/features/urbanAnalytics/lib/methodValidity.ts` | Method validity assessment helpers |
| `src/features/urbanAnalytics/lib/dataFitness.ts` | Data fitness scoring helpers |
| `src/features/urbanAnalytics/seeds/` | 16+ seed method/dataset definitions |
| `src/centerpanel/Flows/flowTypes.ts` | Workflow run shapes |
| `src/stores/usePanelBridgeStore.ts` | CenterPanel ↔ RightPanel coordination contract |
| `src/services/map/MapEngineAdapter.ts` | Map layer publication API |
| `src/services/editorBridge.ts` | IDE code artifact bridge |
| `src/services/map/contracts/gisContracts.ts` | **Shared GIS type contracts — import, never redefine** |
| `src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts` | **Shared test fixtures — import, never redefine** |
| `src/lib/error-bus.ts` | Centralized error emission and deduplication |

---

## State management

All state is Zustand. No Redux, no Context API for app state.

| Store | Purpose |
|---|---|
| `src/features/urbanAnalytics/useUrbanContextStore.ts` | Core analytical context kernel |
| `src/features/urbanAnalytics/store.ts` | Navigation, section hierarchy, card library filtering |
| `src/stores/useFlowStore.ts` | Analytical workflow state (active flow, completed runs) |
| `src/stores/usePanelBridgeStore.ts` | CenterPanel ↔ RightPanel coordination |
| `src/stores/useMapExplorerStore.ts` | Map layers, bounds, basemaps, overlay visibility |
| `src/stores/useAiConfigStore.ts` | AI provider settings (OpenAI, Anthropic, local) |
| `src/stores/useUrbanContextStore.ts` (alias) | See urbanAnalytics above |

---

## TypeScript strictness

`tsconfig.app.json`: `strict`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noImplicitOverride`. No silent `any` — use `unknown` + narrowing.

**Path aliases** (`@/*` → `src/*`): `@/components/*`, `@/hooks/*`, `@/utils/*`, `@/types/*`, `@/stores/*`, `@/services/*`, `@/ai/*`, `@/features/*`.

---

## UI conventions

- **CSS**: CSS Modules (`*.module.css`) for `centerpanel/` — no Tailwind. Styled-components for shell/templates. camelCase in JSX (`styles.myClass`), kebab-case in `.module.css` (`.my-class`).
- **Component libraries**: Radix UI (headless), deck.gl 9 (geo layers), React Three Fiber (3D), Chart.js, xterm.js.
- **Design language**: Minimal premium — dense typography, thin separators, restrained amber accents. No decorative cards-in-cards, no marketing hero layouts.

---

## Worker / compute architecture

- **Web workers** (`src/workers/`): GWR regression, hashing, PII redaction, search indexing.
- **Worker pool** (`src/workers/pool/BackgroundWorkerPool.ts`): thread lifecycle, task queuing, resource limits.
- **WASM** (`src/engine/wasm/SpatialIndexWASM.ts`): R-tree spatial index with JS fallback (`preferredBackend: 'wasm' | 'javascript'`).
- **DuckDB-WASM** (`src/engine/spatial-db/`): in-browser SQL for large datasets.
- **GPU** (`src/engine/gpu/`): WebGPU-accelerated spatial operations.

Offload heavy computation to workers. Never block the main thread with spatial loops over large feature sets.

---

## Testing conventions

- **Framework**: vitest with v8 coverage; coverage policy in `src/config/coveragePolicy.json`.
- **Location**: `src/**/__tests__/**/*.test.{ts,tsx}` — colocated `__tests__` folders.
- **Mocking**: `vi.mock()` for stores and services; test store logic through actions + selectors, not internals.
- **E2E**: Playwright in `e2e/` — 25+ specs tagged `@smoke` / `@a11y` / functional; needs dev server.

---

## Cross-module event bus (SynapseBus)

Use `synapseBus` (`src/services/synapseBus.ts`) for cross-module events. **Payloads carry IDs and references only — no raw GeoJSON, no bulk geometry, no full file contents.** Consumers read their own store after receiving an event.

```ts
import { synapseBus } from '@/services/synapseBus';

// Publish
synapseBus.emit('map.layer.focus', {
  layerId: 'layer-abc',
  source: 'map-explorer',          // SynapseModule
  requestedAt: new Date().toISOString(),
});

// Subscribe (always clean up)
const sub = synapseBus.on('map.layer.focus', (payload) => { … });
sub.off(); // in useEffect cleanup or component unmount
```

**Full event map** (`src/types/synapse-bus.ts` → `SynapseBusEventMap`):

| Event | Owner | Consumers |
|---|---|---|
| `ide.file.open` | ide | audit, MRU, cross-nav |
| `ide.range.open` | ide | problems, outline, map-ref |
| `ide.code.insert` | ide | ai-panel, apply-pipeline |
| `map.layer.focus` | map-explorer | ide, urban-analytics |
| `map.selection.export` | map-explorer | ide, urban-analytics |
| `analytics.scenario.open` | urban-analytics | ide, map-explorer |
| `analytics.artifact.publish` | urban-analytics | ide, evidence-tray |
| `evidence.artifact.register` | system | all three modules |

Do not add new events without updating `SynapseBusEventMap` — the bus is fully typed.

---

## Error handling

Use `reportError()` from `src/lib/error-bus.ts` for all user-facing errors. It deduplicates within 2 s, maps to a toast, and emits to error listeners.

```ts
import { reportError } from '@/lib/error-bus';

reportError({
  source: 'adapter',   // 'http' | 'adapter' | 'fsm' | 'ui' | 'unknown'
  code: 'LAYER_LOAD_FAILED',
  message: 'Could not load GeoJSON layer',
  detail: err.message,
});
```

Never call `showToast` directly for error conditions — go through `reportError`.

---

## Centerpanel flows (15 workflow types)

All flows live in `src/centerpanel/Flows/`. Each is a self-contained `<XxxFlow />` component registered in `flowLibraryMeta.ts`. Existing flows:

`AccessibilityFlow` · `CellularAutomataFlow` · `ChangeDetectionFlow` · `CityJSONFlow` · `CompositeIndicatorFlow` · `EmergingHotSpotFlow` · `EquityAuditFlow` · `FacilityOptimisationFlow` · `ObjectDetectionFlow` · `ScenarioComparisonFlow` · `SiteSuitabilityFlow` · `SunlightSimFlow` · `SystemDynamicsFlow` · `UrbanMorphologyFlow` · `VoxCity3DFlow` · `VulnerabilityFlow`

Adding a new flow: create `<Name>Flow.tsx`, add a `FlowDefinition` entry to `flowLibraryMeta.ts`, and register it in `FlowHost.tsx`.

---

## Urban Analytics seed library (card catalog)

Cards are built in `src/features/urbanAnalytics/seeds/` — one file per domain, all aggregated by `index.ts → buildFullLibrary()`. Seed modules:

`projectScoping` · `urbanIndicators` · `additionalIndicators` · `vulnerability` · `transportNetworks` · `remoteSensing` · `spatialStats` · `thematicAnalysis` · `typologyClassification` · `gisMethods` · `interventionDesign` · `monitoringReporting` · `policyImplementation` · `dataEngineering` · `supplementary` · `voxcity`

Adding a new card: add an object to the relevant seed module's builder function. Required fields: `id` (kebab-case, unique), `title`, `sectionId`, `summary`. Then call `applyUrbanMethodValidityPreset(card)` if the card represents an analytical method. The `rightPanelRegistry.ts` auto-derives from the live library — no manual registry update needed.

---

## Vite chunk budget

Heavy libraries (monaco, deck.gl, three.js, mapbox-gl) are in manual vendor chunks defined in `vite.config.ts`. Never import these on the critical boot path — use dynamic `import()` inside event handlers or lazy components. Run `npm run perf:budgets` after adding any new dependency to check chunk sizes.

---

## Common pitfalls

- Importing from a store you don't own → implicit cross-module coupling. Use bridge services or typed events.
- Adding fake citations, synthetic QA scores, or placeholder evidence violates the scientific evidence contract.
- `exactOptionalPropertyTypes` means `prop?: string` and `prop: string | undefined` are different — be precise.
- The `centerpanel/` tree must not use Tailwind — `lint:no-tailwind-centerpanel` will fail CI.
- Never call `localStorage` directly.
- `data.score === null` means unknown fitness, not high fitness.

---

## Active operating pack — Map Explorer Production GIS (2026-05-22)

If asked to implement a "Prompt N" / "Map Explorer GIS" / "production GIS" task, the active pack is `MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/`. **Start with [LEDGER.md](MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/LEDGER.md)** — it holds execution state (which prompts are done/next), cold-start resume steps, and the update protocol. Then read [15_AGENT_EXECUTION_PROMPTS.md](MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/15_AGENT_EXECUTION_PROMPTS.md) — especially "Cold-start protocol (anti-amnesia)", "Repo Reality Notes", "Agent Contract v2", "Canonical Type Contracts", and "Shared Test Fixtures".

**Current ledger state (as of 2026-05-27):** Prompts 0–22 complete ✅. Next: Prompt 23 (performance budgets + render diagnostics).

After finishing a prompt, update the ledger (status + Done Log) in the same commit.

---

## Multi-session work — archived pack

The previous `DEVELOPMENT_PLANS/` operating pack is complete (UA, Map Explorer, Synapse IDE: `all_completed`). Historical ledgers live at:

```text
docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/
```

Start with [README.md](docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/README.md) and [ARCHIVE_INDEX.md](docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/ARCHIVE_INDEX.md). Treat as historical reference only.

---

## Token-economy guidelines

- Don't `Get-ChildItem -Recurse` from project root — `.venv`/`node_modules` are huge. Use Glob or targeted `find`.
- Don't Read `package-lock.json` or any file in `dist/` / `coverage/`.
- For "where is X" questions across the repo, delegate to the Explore subagent.
- Use `/clear` after long ledger reads; use `/compact` in long sessions.
- Import shared GIS contracts and test fixtures — never redefine them locally.
