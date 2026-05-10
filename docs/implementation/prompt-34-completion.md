# Prompt 34 — Arrow and GeoParquet I/O Pipeline

## Scope delivered

- Added a reusable columnar pipeline under `src/services/data/pipeline/columnarIO.ts`.
- Enabled local import for Arrow IPC / Feather and GeoParquet files inside Map Explorer.
- Added a schema preview workflow before commit for columnar imports.
- Added GeoParquet export beside the existing GeoJSON export path.
- Added columnar format badges and metadata visibility in the layer catalog.
- Added worker-ready Arrow IPC transfer for imported columnar datasets through DuckDB-WASM.

## User-facing behavior

- The import hub now advertises Arrow and GeoParquet as first-class local formats.
- Columnar imports show:
  - stage-aware progress
  - row counts
  - estimated memory footprint
  - schema fields and inferred roles
  - preview rows
  - worker table name for downstream analytics
- Export now supports `GeoJSON` and `GeoParquet` from the same Map Explorer flow.
- Imported columnar layers surface `Arrow` or `GeoParquet` badges in the map catalog and expose runtime details in metadata popovers.

## Technical notes

- Browser builds use `parquet-wasm/esm` with explicit wasm asset initialization via `parquet-wasm/esm/parquet_wasm_bg.wasm?url`.
- Vitest uses `parquet-wasm/node` to avoid `.wasm` loader failures in the Node test runtime.
- GeoParquet export writes a WKB geometry column plus `geo` schema metadata.
- Imported columnar datasets are published twice:
  - as standard GeoJSON overlay layers for visualization
  - as Arrow IPC streams for DuckDB-WASM worker ingestion

## Validation

- `npm run typecheck`
- `npx vitest run src/services/data/pipeline/__tests__/columnarIO.test.ts src/services/map/__tests__/MapDataIO.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts`
- `npm run build`
- `npm run lint` (remaining warnings are the pre-existing `react-refresh/only-export-components` warnings in `src/features/collaboration/CollaborationProvider.tsx`)