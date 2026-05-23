# Urban Analytics Workbench — Claude Code quick context

Browser-based spatial intelligence platform: tri-modal workbench (Synapse IDE + Map Explorer + Urban Analytics) — React 19, Vite 8, TypeScript 5.8, deck.gl 9, Zustand.

> Full conventions: [AGENTS.md](AGENTS.md). Read it on demand, not eagerly.

## Always-true rules (do not violate)

- **No Tailwind in `src/centerpanel/`** — enforced by `npm run lint:no-tailwind-centerpanel`.
- **CRS**: never compute area/distance in EPSG:4326. Project first.
- **`exactOptionalPropertyTypes: true`** — `prop?: string` ≠ `prop: string | undefined`.
- **Evidence artifacts immutable** — mark stale via QA, never silently mutate.
- **No fake/synthetic data labelled as real** — capability status must be explicit.
- **State**: Zustand only. No Redux, no Context for app state. Use fine-grained selectors.
- **No direct `localStorage`** — use Zustand `persist`.

## After any change to `src/features/urbanAnalytics/`

```bash
npm run typecheck
npm run test:analytics
```

## Other commands (only when relevant)

```bash
npm run dev              # Vite + terminal server
npm run lint:errors      # eslint quiet
npm run test             # full vitest
npm run test:e2e         # Playwright (needs dev server)
npm run validate:rc      # full RC gate
```

## Multi-session work — archived UA / Map / IDE pack

The previous `DEVELOPMENT_PLANS/` operating pack is complete. The root planning folder has been removed; historical ledgers, manifests, prompt ladders, and alignment documents live here:

```text
docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/
```

Completion status at archive time:
- Urban Analytics: `all_completed`
- Map Explorer: `all_completed`
- Synapse IDE: `all_completed`

For archive lookup, start with [README.md](docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/README.md) and [ARCHIVE_INDEX.md](docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/ARCHIVE_INDEX.md). Treat the archived pack as historical reference only; new structured work should begin from a new operating pack or a user-directed task.

## Active operating pack — Map Explorer Production GIS (2026-05-22)

If asked to implement a "Prompt N" / "Map Explorer GIS" / "production GIS" task, the active pack is `MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/`. **Start with [LEDGER.md](MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/LEDGER.md)** — it holds execution state (which prompts are done/next), the cold-start resume steps, and the update protocol. Then read [15_AGENT_EXECUTION_PROMPTS.md](MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/15_AGENT_EXECUTION_PROMPTS.md) — specifically its "Cold-start protocol (anti-amnesia)", "Repo Reality Notes", "Agent Contract v2", "Canonical Type Contracts", and "Shared Test Fixtures" sections. After finishing a prompt, update the ledger (status + Done Log) in the same commit. Shared shapes are committed in [`gisContracts.ts`](src/services/map/contracts/gisContracts.ts); shared test fixtures in [gisFixtures.ts](src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts). Import these rather than re-defining them. Map tests run via `npx vitest run <path>` (not `test:analytics`).

## Token-economy guidelines for this repo

- Don't `Get-ChildItem -Recurse` from project root — `.venv`/`node_modules` are huge. Use Glob.
- Don't Read `package-lock.json` or any file in `dist/` / `coverage/`.
- For "where is X" type questions across the repo, delegate to the Explore subagent.
- Use `/clear` after long ledger reads; use `/compact` in long sessions.

## Module ownership (cross-module coupling = bug)

| Module | Owns | Never owns |
|---|---|---|
| Urban Analytics (`src/features/urbanAnalytics/`) | analysis context, methods, indicators, evidence, validity | map rendering, editor tabs, geometry buffers |
| Map Explorer (`src/stores/useMapExplorerStore.ts`, `src/services/map/`) | viewport, layers, geometry, selection | analytical interpretation, indicator formulas |
| Synapse IDE (`src/stores/appStore.ts`, `src/stores/editorStore.ts`) | editor, buffers, terminal, AI chat | spatial data, analytical context |

Sync via Zustand selectors, [`usePanelBridgeStore`](src/stores/usePanelBridgeStore.ts), and typed bridges ([`editorBridge.ts`](src/services/editorBridge.ts), [`MapEngineAdapter.ts`](src/services/map/MapEngineAdapter.ts)). No heavy geometry through generic UI events.

## Path aliases

`@/*` → `src/*` (also `@/components/*`, `@/hooks/*`, `@/utils/*`, `@/types/*`, `@/stores/*`, `@/services/*`, `@/ai/*`, `@/features/*`).
