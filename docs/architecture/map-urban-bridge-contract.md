# Map and Urban Bridge Contract

Date: 2026-05-30
Status: Prompt 63 close-out reference

The Map/Urban bridge is a typed summary channel. It lets Urban Analytics reason about available spatial context without taking ownership of map rendering, source bytes, or geometry buffers.

## Ownership Boundary

| Module | Owns | Bridge may reference | Bridge must not carry |
| --- | --- | --- | --- |
| Map Explorer | Layers, viewport, source handles, geometry execution, selection, map evidence, report/export handoff | Layer IDs, source IDs, evidence IDs, CRS summaries, QA caveats, field summaries, AOI bbox, workflow manifests | Raw `sourceData`, full GeoJSON, worker tables, DEM cells, 3D tiles, screenshots, credential-bearing URLs |
| Urban Analytics | Method catalog, validity envelopes, data fitness, analytical interpretation, evidence tray state | Method IDs, required inputs, validity status, data-fitness issues, evidence references | Map viewport state, render layers, feature buffers, tile payloads |
| Synapse IDE | Editor tabs, generated code/artifacts, terminal/chat surfaces | Code artifact IDs, generated manifest references, SQL/script/notebook text after explicit route | Spatial datasets or heavy binary outputs |

## Outbound Map to Urban

Map Explorer builds `MapToUrbanContextPayload` values through `MapUrbanBridgeService` and `MapToUrbanContextAdapter`. Payloads are reference-only:

- active AOI id, label, geometry family, bbox, validation status, and caveats
- layer summaries with IDs, names, source kinds, feature counts, geometry family, CRS summary, QA state, queryability, and evidence IDs
- bounded field descriptors and temporal-field hints
- selected feature counts and lightweight IDs when available
- workflow, model, report, or publication manifest IDs

Urban recommendations and data-fitness checks can use those summaries, but any method readiness claim must remain explicit about missing CRS, demo/sample sources, generated layers, tiled/generalized display, or unknown provenance.

## Inbound Urban to Map

Urban-to-Map requests use `UrbanToMapMethodRequestAdapter` and the modal bridge controller. Inbound requests can ask Map Explorer to preview or focus:

- candidate layers and AOIs
- method-required fields and CRS requirements
- compatibility reasons, disabled reasons, and suggested remedies
- report/evidence publication targets

Inbound bridge requests do not auto-run destructive edits or metric workflows. Apply-capable commands still route through Map command preflight, CRS/QA gates, confirmation surfaces, review timeline audit, and undo/redo rules where reversible.

## AI, Plugins, Collaboration, and Packages

- AI proposals must pass the allowlisted `MapAIGuardrails` action gate, redaction/sanitization, human confirmation, and `AI-proposed` review audit before apply.
- Plugin-contributed source connectors, renderers, processing tools, and Urban method bridges register typed metadata; they cannot bypass CRS/QA gates or the command lifecycle.
- Yjs collaboration sync carries annotations, comments, target IDs, evidence IDs, and presence only. It must not sync raw geometries or source payloads.
- Offline packages preserve source handles, style specs, manifests, review events, and small inline source sidecars only when bounded. Large or external sources restore as unavailable/recoverable with caveats.

## Validation References

- `src/services/map/bridge/MapUrbanBridgeService.ts`
- `src/services/map/MapToUrbanContextAdapter.ts`
- `src/services/map/UrbanToMapMethodRequestAdapter.ts`
- `src/centerpanel/components/map/controllers/useMapUrbanBridgeController.ts`
- `src/features/urbanAnalytics/__tests__/mapContextAdapter.test.ts`
- `src/features/urbanAnalytics/__tests__/urbanMethodValidity.test.ts`
- `src/centerpanel/components/map/controllers/__tests__/useMapUrbanBridgeController.test.tsx`
