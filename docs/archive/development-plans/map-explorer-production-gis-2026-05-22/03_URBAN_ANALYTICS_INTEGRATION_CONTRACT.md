# 03 - Urban Analytics Integration Contract

Date: 2026-05-22

## Goal

Make Map Explorer and Urban Analytics interact like one professional spatial analysis environment while preserving module ownership:

- Map Explorer provides spatial context, layer/source metadata, visible extent, AOI, selections, derived layers, QA, and map-side workflow results.
- Urban Analytics provides method intent, validity requirements, data fitness interpretation, evidence artifacts, report/dashboard bindings, and analytical narratives.

The bridge must be typed, versioned, testable, and lightweight.

## Contract Principles

1. Exchange references and summaries, not raw heavy geometry.
2. Keep IDs stable across layers, sources, AOIs, runs, manifests, evidence artifacts, and report bindings.
3. Every handoff carries runtime mode and QA status.
4. Every data-fitness conclusion treats `null` and unknown metadata as unknown, not ready.
5. Every method request exposes what Map Explorer can validate and what Urban Analytics must still interpret.
6. Demo/sample/synthetic modes must survive every handoff.

## Shared Identity Model

| ID | Owner | Meaning |
| --- | --- | --- |
| `sourceId` | Map Explorer | Data source handle, storage reference, remote endpoint, worker table, or derived source. |
| `layerId` | Map Explorer | Render/query layer visible to the user. |
| `aoiId` | Map Explorer | Drawn/selected study frame or derived AOI. |
| `contextId` | Urban Analytics | Analytical context session ID. |
| `workflowId` | Urban Analytics or Map workflow service | Method/workflow definition or execution chain. |
| `runId` | Urban Analytics | Completed analytical run. |
| `manifestId` | Urban Analytics or Map workflow service | Reproducibility manifest. |
| `artifactId` | Urban Analytics | Immutable evidence artifact ID. |
| `publicationId` | Urban Analytics | Map publication or figure binding record. |

## Map To Urban Payload

Current services already provide `MapToUrbanContextAdapter.ts` and `context/mapContextAdapter.ts`. The production contract should converge on one versioned payload:

```ts
interface MapUrbanContextPayloadV1 {
  version: 1;
  payloadId: string;
  sourceModule: "map-explorer";
  destinationModule: "urban-analytics";
  createdAt: string;
  requestedLayerId: string | null;
  mapContextId: string;
  viewport: {
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
    bounds: [number, number, number, number] | null;
  };
  aoi: {
    aoiId: string | null;
    source: "active-aoi" | "map-view" | "none";
    geometryFamily: string | null;
    bbox: [number, number, number, number] | null;
    validationStatus: string | null;
    caveats: string[];
  };
  layers: MapUrbanLayerSummary[];
  selection: {
    totalSelectedFeatures: number;
    byLayer: Array<{ layerId: string; count: number }>;
  };
  crs: {
    distinct: string[];
    missingLayerIds: string[];
    mixedCrs: boolean;
  };
  qa: {
    status: "passed" | "warning" | "blocked" | "unknown";
    blockingIssueIds: string[];
    warningIssueIds: string[];
    checkedAt: string | null;
  };
  evidenceReferences: MapUrbanEvidenceReference[];
  workflowReferences: {
    activeWorkflowId: string | null;
    activeRunIds: string[];
    activeAnalysisResultLayerIds: string[];
    manifestIds: string[];
  };
  disabledReasons: string[];
}
```

Layer summary minimum:

```ts
interface MapUrbanLayerSummary {
  layerId: string;
  sourceId: string | null;
  name: string;
  sourceKind: "project" | "imported" | "external" | "derived" | "demo";
  visible: boolean;
  queryable: boolean;
  geometryType: string;
  featureCount: number | null;
  fields: Array<{ name: string; role: string; type?: string }>;
  temporalFields: string[];
  crs: {
    crs: string | null;
    status: "known" | "missing" | "unknown";
    notes: string[];
  };
  qa: {
    status: string;
    issueIds: string[];
    caveats: string[];
  };
  readiness: {
    status: string;
    missingFields: string[];
    blockingIssueIds: string[];
    caveats: string[];
  };
  provenance: {
    sourceLabel: string | null;
    attribution: string | null;
    license: string | null;
    runtimeMode: "live" | "demo" | "synthetic" | "unknown";
  };
  workflow: {
    runId: string | null;
    workflowId: string | null;
    manifestId: string | null;
    evidenceArtifactId: string | null;
  };
}
```

## Urban To Map Method Request

`UrbanToMapMethodRequestAdapter.ts` already models the right direction. Production work should make this the canonical UI path from method cards and Urban right panel actions.

Request lifecycle:

```text
Urban method/card/action selected
-> request created with method requirements
-> Map bridge previews compatibility
-> Map opens or focuses compatible context
-> user reviews missing prerequisites and warnings
-> command created for workflow/report/export
-> apply creates map layer, map evidence, Urban run output, or report binding
```

Required method request fields:

- `requestId`
- `methodId`
- `methodLabel`
- `cardId`
- `workflowId`
- `selectedIndicatorKind`
- `outputIntent`
- `requirements.layer`
- `requirements.aoi`
- `requirements.workflow`
- `requirements.recommendedScale`
- `requirements.dataFitnessThreshold`
- `requestedActions`

Compatibility preview must answer:

- Which layers match required geometry?
- Which required fields are present or missing?
- Is CRS known and compatible?
- Is an AOI present and valid?
- Are QA blockers present?
- Is the method live, demo, synthetic, environment-dependent, deferred, or residual-gap?
- What workflow draft can Map Explorer preview?
- What report snapshot can be prepared?

## Data Fitness Mapping

Map Explorer supplies observable metadata:

- Geometry family and validity.
- Feature count.
- CRS availability.
- Temporal fields.
- Missing required fields.
- Layer source kind.
- License/attribution.
- QA issue counts.
- Demo/sample/synthetic status.

Urban Analytics interprets this metadata into:

- Fitness grade.
- Readiness status.
- Missing inputs.
- Method suitability.
- Limitations and caveats.
- Evidence eligibility.

Rule: Map Explorer may say "metadata is missing" or "layer CRS is unknown." It must not say the method is analytically valid. Urban Analytics owns that conclusion.

## Evidence Rules

Map-originated Urban evidence must be created only when:

- The evidence references stable map IDs.
- The evidence includes provenance and QA state.
- Runtime mode is known or explicitly unknown.
- Demo/synthetic/sample status is visible.
- CRS state is included.
- The artifact is immutable after creation.

Evidence updates should never mutate original claims. They should:

- Mark stale.
- Add QA warning/blocker state.
- Link superseding artifact.
- Link rerun or replacement manifest.

## UI Choreography

### Scenario A - Urban method needs map context

1. User selects an Urban method.
2. Urban right panel shows map prerequisites.
3. User clicks "Prepare in Map".
4. Map Explorer opens with compatible layers focused.
5. Right rail shows method compatibility preview.
6. User draws/selects AOI if required.
7. User previews workflow.
8. User applies workflow or publishes output.
9. Urban evidence tray receives output reference and QA caveats.

### Scenario B - Map context suggests Urban method

1. User loads or selects map layers.
2. Map bridge emits summarized context.
3. Urban panel recalculates method recommendations and data fitness.
4. User opens recommended method.
5. Method panel references the exact map layers/AOI that triggered it.

### Scenario C - Map finding to report

1. User inspects map result, feature, or layer.
2. User chooses "Add to report".
3. Map report drawer previews snapshot, legend, scale, CRS, attribution, QA, and caveats.
4. Urban report artifact builder receives structured references.
5. Report block includes evidence IDs and limitations.

## Bridge Implementation Requirements

- Use Zustand selectors for state reads.
- Keep bridge service pure where practical and test payload builders separately.
- Use browser events only as transport adapters, not as the core API.
- Do not pass raw large `FeatureCollection` payloads in bridge events.
- Include payload versions and migration handlers.
- Add contract tests for old and new payload shapes during migration.

## Contract Test Matrix

| Test | Expected Result |
| --- | --- |
| Empty map context | Payload blocks send with actionable missing prerequisite. |
| Visible layer with missing CRS | Urban receives unknown/missing CRS and data fitness does not mark ready. |
| Demo layer | Urban receives demo source kind and evidence/report labels remain demo. |
| Selected feature | Selection count passes through without raw geometry. |
| Active AOI | AOI ID, geometry family, bbox, validation status, and caveats pass through. |
| Urban method requiring polygon | Map preview blocks point-only layer and explains geometry mismatch. |
| Urban method requiring CRS | Map preview blocks missing/wrong CRS. |
| QA blocker | Publish-derived-layer action blocks or requires explicit acknowledged policy. |
| Report snapshot | Snapshot preview includes layers, CRS, QA, scale/legend requirements, and attribution. |
| Reproducible output | Layer, Urban run, evidence artifact, and manifest IDs are linked. |

