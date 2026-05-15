# Large File Index

Use this file to avoid opening large files by default. Refresh the report with `scripts/get-context-min-report.ps1`.

## Startup Documents

Read first:

- `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
- `DEVELOPMENT_PLANS/CURRENT_TASK.json`
- `DEVELOPMENT_PLANS/MODULE_INDEX.json` when ownership is unclear

Search only when needed:

- `DEVELOPMENT_PLANS/*_IMPLEMENTATION_LEDGER.md`
- `DEVELOPMENT_PLANS/*_DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_PLANS/*_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
- `docs/implementation/*.md`

## Current Large Documentation Files

| File | Approx size | Default access pattern |
|---|---:|---|
| `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | 289 KB | `rg "Prompt 25|Prompt Status Register|Review Timeline" ...` |
| `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md` | 126 KB | exact prompt/status search only |
| `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md` | 126 KB | exact section search only |
| `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` | 119 KB | exact section search only |
| `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md` | 108 KB | exact prompt/status search only |
| `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` | 100 KB | exact section search only |

## Current Large Source Files

| File | Approx size | Default access pattern |
|---|---:|---|
| `src/centerpanel/components/MapExplorerModal.tsx` | 235 KB | search for component state/effect names first |
| `src/components/editor/MonacoEditor.tsx` | 135 KB | search exported component and command handlers first |
| `src/services/map/MapEngineAdapter.ts` | 116 KB | search public adapter method names first |
| `src/services/map/MapExportService.ts` | 105 KB | search export format/service method names first |
| `src/centerpanel/components/map/MapLayerManager.tsx` | 94 KB | search layer action names first |
| `src/features/urbanAnalytics/seeds/urbanIndicators.ts` | 86 KB | search indicator ids/tags first |

## Line-Window Rule

For files above 50 KB, use a match first and then inspect nearby lines. Full-file reads are reserved for broad refactors, file splits, or contract changes where local windows are insufficient.
