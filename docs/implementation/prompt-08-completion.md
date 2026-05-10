# Prompt 08 — STAC Client and Cloud Optimized GeoTIFF Reader

Current-state status: implemented with residual gap  
Backfilled on: April 23, 2026 during Remediation Prompt 02

## Scope implemented

- Added a typed STAC client with search/listing helpers and normalized item handling.
- Added a COG reader with metadata inspection, bbox reads, and window/sample access helpers.
- Added connector-level tests for both surfaces.

## Primary repository surfaces

- `src/services/data/connectors/STACClient.ts`
- `src/services/data/connectors/COGReader.ts`
- `src/services/data/connectors/__tests__/STACClient.test.ts`
- `src/services/data/connectors/__tests__/COGReader.test.ts`

## User-facing surfaces

- Connector capability is now exposed through the Toolbox EO connector panel as a first-class operator workflow.
- Operators can run STAC catalog search with collection, bbox, time, and cloud-cover filters; inspect COG metadata; run a sample-window read when the asset uses an uncompressed tile layout; select EO sources; and publish provenance-backed footprint layers from a visible UI surface.
- Connector actions now persist into the EO activity/import history shown in the operator panel.

## Validation evidence available

- `src/services/data/connectors/__tests__/STACClient.test.ts`
- `src/services/data/connectors/__tests__/COGReader.test.ts`
- `src/services/data/eo/__tests__/eoRegistry.test.ts`
- `src/centerpanel/Tools/components/__tests__/EOConnectorPanel.test.tsx`
- `e2e/eo-connectors.spec.ts`
- `docs/implementation/remediation-prompt-04-completion.md`
- Repository validation gates in current release docs

## Residual risks

- Prompt 08 is now discoverable as an operator journey, but imported local raster UX is still not exposed from this panel.
- Current map publication uses truthful footprint/provenance layers rather than direct raster-image rendering.
- COG sample preview is currently truthful but limited: it works for uncompressed tiled assets and explicitly reports when compressed-tile sample reads are unavailable in the current reader.
