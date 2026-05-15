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

## Multi-session work — read before editing UA / Map / IDE

The `DEVELOPMENT_PLANS/` folder is durable memory. Source-of-truth order:
**Ledger > live repo > manifest > sequential prompts > development plan > alignment spec**

For archive or handoff work, start with [DEVELOPMENT_PLANS/README.md](DEVELOPMENT_PLANS/README.md) and [DEVELOPMENT_PLANS/ARCHIVE_READINESS.md](DEVELOPMENT_PLANS/ARCHIVE_READINESS.md). The local branch can be stale relative to `origin/master`; reconcile branch state before moving archived plans.

Single entry point per module:
- [DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md](DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md)
- [DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md](DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md)
- [DEVELOPMENT_PLANS/START_HERE_SYNAPSE_IDE_AGENT.md](DEVELOPMENT_PLANS/START_HERE_SYNAPSE_IDE_AGENT.md)

Ledger files are large (200+ KB). Read only the section you need (use Read with `offset`/`limit`), not the whole file. Spawn an Explore subagent for cross-ledger searches so the main context stays clean.

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
