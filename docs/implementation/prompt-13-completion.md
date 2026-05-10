# Prompt 13 — Land Cover Classification Pipeline

Current-state status: implemented with residual gap  
Updated on: April 23, 2026 during Remediation Prompt 05

## Scope implemented

- Added the browser-side land-cover classification stack, runtime hookup, publication path, and completed-run persistence.
- Refactored GeoAI Lab to run against explicit source choices from the EO registry instead of a hardwired synthetic default.
- Added explicit `real source` versus `demo source` labeling, source metadata review, provenance persistence, and completed-run data outputs for land-cover runs.
- Preserved the existing classifier and post-processing path while allowing real imported/EO raster inputs to drive inference.

## Primary repository surfaces

- `src/engine/geoai/cv/LandCoverClassifier.ts`
- `src/engine/geoai/hooks/useLandCoverClassification.ts`
- `src/centerpanel/Tools/components/GeoAILab.tsx`
- `src/services/data/eo/analysis.ts`
- `src/engine/geoai/cv/__tests__/LandCoverClassifier.test.ts`
- `src/engine/geoai/hooks/__tests__/useLandCoverClassification.test.ts`
- `src/centerpanel/Tools/components/__tests__/GeoAILab.test.tsx`
- `e2e/geoai-real-data.spec.ts`

## User-facing surfaces

- `Tools -> GeoAI Lab` land-cover workflow with explicit source selection
- Map publication and completed-run persistence for classified output

## Validation evidence available

- `src/engine/geoai/cv/__tests__/LandCoverClassifier.test.ts`
- `src/engine/geoai/hooks/__tests__/useLandCoverClassification.test.ts`
- `src/centerpanel/Tools/components/__tests__/GeoAILab.test.tsx`
- `e2e/geoai-real-data.spec.ts`
- Repository validation gates

## Residual risks

- The current browser-safe inference package still loads through the demo runtime/model path (`demo://land-cover`) even when the raster input is real.
- Real-source runs do not have reference labels, so accuracy, F1, and IoU are unavailable unless the selected source is the explicit demo source.
- Imported raster analysis depends on other surfaces registering an analysis-ready raster payload into the EO registry; Prompt 05 enables the consumer path but does not create every upstream import surface.
- Reduced-band Sentinel or single-band raster inputs remain executable but should be treated as exploratory because the current classifier was tuned around multispectral inputs.
