# 14 - Modern Premium GIS Gap Analysis

Date: 2026-05-22
Status: gap analysis after reading the full operating pack
Purpose: identify what is still missing or under-specified for a modern first-class premium GIS tool.

## Verdict

The plan is strong for a browser-native professional GIS workbench: it covers source registry, CRS safety, layer inspection, attribute table, processing toolbox, model builder, layout composer, Urban Analytics evidence, 3D blocks, zoning, massing, and premium workbench design.

The remaining gap is not "more map buttons." The missing layer is enterprise-grade product depth:

- Multiuser editing and conflict management.
- Standards-first web interoperability.
- Cloud/backend execution and long-running job architecture.
- Security, governance, permissions, and audit policy.
- Field/offline workflows.
- Raster/EO and cloud-native geospatial depth.
- Spatial database workbench depth.
- Advanced cartography and labeling.
- Network and utility/parcel domain workflows.
- Plugin SDK maturity.
- Observability, performance fixtures, and conformance tests.

## External Calibration Notes

The gap analysis was calibrated against current official/public documentation checked on 2026-05-22:

- QGIS Model Designer emphasizes reusable chained workflows, model validation, partial execution, embedded project models, documentation/help, and export as scripts.
  Source: https://docs.qgis.org/3.44/en/docs/user_manual/processing/modeler.html
- OGC API - Tiles defines standard web API building blocks for retrieving vector tiles, map/image tiles, coverage tiles, and related tileset metadata.
  Source: https://ogcapi.ogc.org/tiles/overview.html
- 3D Tiles is positioned as an open, streamable standard for massive heterogeneous 3D geospatial content such as buildings, point clouds, and photogrammetry.
  Source: https://cesium.com/why-cesium/3d-tiles/
- ArcGIS Pro offline feature service workflows highlight branch versioning, replica tracking, synchronization, permissions, and conflict review as important multiuser/offline editing requirements.
  Source: https://doc.esri.com/en/arcgis-pro/latest/help/data/geodatabases/overview/prepare-feature-layer-data-for-offline.html
- ArcGIS Utility Network documentation shows enterprise network tools depend on domains, subtypes, association rules, network attributes, categories, tiers, topology, and versioning.
  Source: https://doc.esri.com/en/arcgis-pro/latest/help/data/utility-network/configure-a-utility-network.html

## Gap Priority Legend

- P0: needed before claiming production-grade professional GIS.
- P1: needed before claiming first-class premium GIS.
- P2: advanced differentiator or later enterprise expansion.

## Gap 1 - Enterprise Geodatabase Semantics

Priority: P0/P1

Current pack coverage:

- Source registry, source handles, restore policies, CRS/schema/provenance.
- Editing, topology checks, undo, review timeline.

Missing depth:

- Attribute domains and coded/range value constraints.
- Subtypes.
- Relationship classes.
- Attachments.
- Editor tracking and audit fields.
- Attribute rules and validation rules.
- Constraint validation before edit commit.
- Transaction boundaries.
- Versioned editing model.
- Conflict detection and resolution.
- Geodatabase-like project schema metadata.

Why it matters:

Professional GIS is not just files on a map. Analysts expect layer schemas to carry editing rules, domains, defaults, relationships, attachments, and validation behavior.

Recommended additions:

- `MapSchemaRuleRegistry`
- `MapAttributeDomainService`
- `MapSubtypeService`
- `MapRelationshipClassService`
- `MapEditTransactionService`
- `MapConflictResolutionPanel`

Acceptance:

- Editing a feature respects domain/subtype constraints.
- Invalid attribute edits are blocked before save.
- Related records and attachments can be inspected.
- Edit sessions produce reviewable transactions and conflicts.

## Gap 2 - Multiuser Collaboration And Versioning

Priority: P0 for production teams, P1 for single-user release

Current pack coverage:

- Review timeline.
- Reproducible packages.
- Map/Urban evidence references.

Missing depth:

- Project sharing.
- Role-based collaborative sessions.
- Comments/annotations tied to features/layers/scenarios.
- Presence and activity indicators.
- Layer/source locking.
- Named versions or branches.
- Replica/offline versions.
- Conflict review.
- Approval workflow for evidence publication.
- Diff view between map/session/scenario versions.

Why it matters:

A premium GIS product is usually used by teams, not only by one analyst. Multiuser editing without versioning becomes risky quickly.

Recommended additions:

- `MapProjectCollaborationService`
- `MapVersionGraphService`
- `MapEditLockService`
- `MapReviewCommentService`
- `MapConflictReviewPanel`

Acceptance:

- Users can compare two project/session/scenario states.
- Concurrent edits are detected.
- Evidence publication can require review/approval where configured.

## Gap 3 - Standards-First Web GIS Interoperability

Priority: P0/P1

Current pack coverage:

- WMS/WFS/XYZ, PMTiles, FlatGeobuf, GeoJSON URL, raster/GeoTIFF, CityJSON/3D Tiles are mentioned.

Missing depth:

- OGC API - Features client.
- OGC API - Tiles client.
- OGC API - Processes client/server contract.
- OGC API - Records / catalog discovery.
- STAC catalog/search browser.
- COG range-read strategy and tile pipeline.
- 3D Tiles metadata/styling/LOD streaming strategy.
- COPC/LAZ point cloud path.
- GeoParquet metadata profile handling.
- Vector tile schema/provenance inspection.

Why it matters:

Modern web GIS is moving beyond only WMS/WFS endpoints. A first-class browser GIS should treat cloud-native and OGC API sources as normal data connections.

Recommended additions:

- `OgcApiFeaturesConnector`
- `OgcApiTilesConnector`
- `OgcApiProcessesConnector`
- `StacCatalogConnector`
- `CogRasterSourceRuntime`
- `Tile3DSourceRuntime`
- `PointCloudSourceRuntime`

Acceptance:

- User can connect to an OGC API landing page and discover collections/tiles/processes.
- User can search STAC items by bbox/time/cloud cover and add assets.
- COG and 3D Tiles sources stream progressively without full download.
- Source profiles expose standards conformance and limitations.

## Gap 4 - Cloud/Backend Execution Architecture

Priority: P0 if large data is in scope, P1 otherwise

Current pack coverage:

- Browser workers, WASM, DuckDB-WASM, GPU, external services.
- Browser limits are acknowledged.

Missing depth:

- Optional backend job runner for long-running operations.
- Job queue and cancellation.
- Server-side tile generation.
- Server-side reprojection/cache.
- Object storage layout.
- Artifact storage and retention.
- Signed URLs for sensitive exports.
- CDN/cache invalidation.
- Progressive result streaming.
- Backend capability negotiation.

Why it matters:

Browser-only is excellent for many workflows but not enough for national-scale rasters, huge vector overlays, large 3D tilesets, or long simulations.

Recommended additions:

- `MapExecutionBackendAdapter`
- `MapJobQueueService`
- `MapArtifactStore`
- `MapTileCacheService`
- `MapBackendCapabilityPanel`

Acceptance:

- Each tool declares whether it can run in browser, worker, WASM, GPU, or backend.
- Long jobs can run asynchronously, report progress, resume UI state, and preserve manifests.
- Backend absence is a visible environment state, not a silent failure.

## Gap 5 - Security, Governance, And Compliance

Priority: P0

Current pack coverage:

- Credential isolation is mentioned.
- PII redaction exists elsewhere in repo instructions.
- Evidence truthfulness is strongly covered.

Missing depth:

- Authentication/authorization model.
- Role-based permissions.
- Project-level access control.
- Source-level access control.
- Secret storage strategy.
- Connector credential scopes.
- Export policy.
- Data classification.
- License/attribution compliance enforcement.
- Sensitive geometry/privacy warning.
- Audit log retention.
- Tenant/project separation if multi-tenant.

Why it matters:

Professional GIS frequently handles sensitive locations, infrastructure, parcels, demographic data, and licensed imagery.

Recommended additions:

- `MapAccessPolicyService`
- `MapCredentialVaultAdapter`
- `MapDataClassificationService`
- `MapExportPolicyService`
- `MapLicenseComplianceGate`
- `MapAuditLogService`

Acceptance:

- A restricted source cannot be exported or published without permission.
- Credentials never appear in layer metadata, manifests, exports, or logs.
- Exports carry license/attribution and privacy caveats.

## Gap 6 - Field And Offline Workflows

Priority: P1

Current pack coverage:

- Offline package and source restore are mentioned.

Missing depth:

- Offline editable project package.
- GPS/location capture.
- Field data collection forms.
- Attachments/photos.
- Sync/reconcile workflow.
- Replica tracking.
- Mobile/touch UI mode.
- Conflict review after reconnect.
- Offline basemap/tiles strategy.

Why it matters:

Premium GIS often extends from desktop/web planning to field validation and data collection.

Recommended additions:

- `MapOfflineReplicaService`
- `MapFieldFormBuilder`
- `MapAttachmentService`
- `MapGpsCaptureController`
- `MapOfflineSyncPanel`

Acceptance:

- User can package a small AOI for offline field review.
- Edits and attachments sync back with conflicts visible.

## Gap 7 - Raster, Earth Observation, And Multidimensional Data

Priority: P1

Current pack coverage:

- Raster/GeoTIFF, GeoAI/raster, zonal stats, temporal playback, NetCDF dependencies are mentioned.

Missing depth:

- Raster catalog and STAC search.
- COG progressive reading.
- Raster calculator/map algebra.
- Band math and indices.
- Raster histogram/classification.
- Time-series raster cube.
- Multidimensional NetCDF/Zarr strategy.
- Terrain derivatives: slope, aspect, hillshade.
- Raster reprojection/resampling policy.
- Uncertainty/no-data propagation.

Why it matters:

Modern urban analytics increasingly combines vector GIS with EO, climate, elevation, heat, flood, and time-series raster products.

Recommended additions:

- `MapRasterSourceRegistry`
- `MapRasterCalculator`
- `MapRasterStatsService`
- `MapRasterTimeSeriesPanel`
- `MapTerrainAnalysisService`
- `MapStacBrowser`

Acceptance:

- User can add a COG/STAC raster source, inspect bands, view histogram, run zonal stats, and publish caveated evidence.

## Gap 8 - Spatial Database And SQL Workbench

Priority: P1

Current pack coverage:

- DuckDB-WASM spatial DB is named.
- Spatial SQL is in backlog.

Missing depth:

- SQL editor.
- Query builder.
- Saved queries/views.
- Temporary/materialized output layers.
- Spatial indexes as visible artifacts.
- Query explain/estimate.
- Transactions for data changes.
- Join relationship explorer.
- Query result provenance.

Why it matters:

A professional GIS analyst expects to work with tables and queries, not only UI buttons.

Recommended additions:

- `MapSpatialSqlEditor`
- `MapQueryViewRegistry`
- `MapSpatialIndexManager`
- `MapSqlRunHistory`

Acceptance:

- A SQL query can produce a source-backed result layer with schema, CRS, lineage, and rerun manifest.

## Gap 9 - Advanced Cartography And Labeling

Priority: P1

Current pack coverage:

- Choropleth, categorical, graduated symbols, labels, no-data, legend parity.

Missing depth:

- Symbol library.
- Rule-based styling.
- Scale-dependent label rules.
- Label collision strategies.
- Annotation layers.
- Map grids/graticules.
- Blend modes and effects policy.
- Cartographic presets.
- Color accessibility checks.
- Style import/export.
- Multi-map layout themes.

Why it matters:

Premium GIS output quality depends heavily on cartography, not just data correctness.

Recommended additions:

- `MapSymbolLibrary`
- `MapLabelEngine`
- `MapAnnotationLayer`
- `MapStylePackageService`
- `MapColorAccessibilityChecker`

Acceptance:

- A map figure can meet professional cartographic expectations with labels, legends, grids, annotations, and accessible palettes.

## Gap 10 - Network, Parcel, And Utility Domain Workflows

Priority: P1/P2

Current pack coverage:

- Network/accessibility bridge.
- Blocks/parcels/zoning.
- Topology checks.

Missing depth:

- Multimodal transportation network dataset model.
- GTFS/transit schedules.
- Turn restrictions and impedance rules.
- Service areas/isochrones at production depth.
- Parcel fabric concepts: lots, plans, splits/merges, lineage.
- Utility network tracing concepts: domain networks, associations, containment, structural attachments, network attributes, tiers, topology state.

Why it matters:

Urban analytics often needs transportation access, parcels, cadastral changes, and infrastructure networks. Generic lines/polygons are not enough.

Recommended additions:

- `MapNetworkDatasetService`
- `MapTransitScheduleConnector`
- `MapParcelFabricService`
- `MapUtilityNetworkLiteService`

Acceptance:

- Network/accessibility outputs can cite impedance, mode, schedule assumptions, and network version.
- Parcel split/merge edits carry lineage.
- Utility-like traces are clearly limited or domain-complete depending on implementation.

## Gap 11 - 3D Streaming, Point Clouds, BIM, And Vertical Reference Depth

Priority: P1/P2

Current pack coverage:

- 2.5D, CityJSON, 3D Tiles, terrain, massing, sun/shadow, vertical assumptions.

Missing depth:

- 3D Tiles LOD streaming details.
- 3D Tiles metadata and styling.
- Point cloud/COPC/LAZ path.
- BIM/IFC source path for planning/building context.
- Vertical CRS and geoid/datum conversion policy.
- Underground/indoor/utility 3D layer handling.
- 3D performance budgets per layer type.
- 3D measurement precision rules.

Why it matters:

Premium 3D GIS needs scalable streaming, precise metadata, and vertical accuracy. Simple extrusion is only the entry point.

Recommended additions:

- `Map3DTilesRuntime`
- `MapPointCloudRuntime`
- `MapBimIfcConnector`
- `MapVerticalDatumService`
- `Map3DPerformanceDiagnostics`

Acceptance:

- 3D source profile shows LoD, tile stats, vertical reference, metadata availability, and runtime budget.

## Gap 12 - Plugin SDK And Extension Governance

Priority: P1

Current pack coverage:

- Plugin/extension registry is mentioned.

Missing depth:

- Plugin manifest schema.
- Permission model.
- API versioning.
- Sandboxing.
- Extension lifecycle.
- Tool/source/renderer registration contracts.
- Compatibility checks.
- Signing/trust policy if plugins are external.
- Developer docs and examples.

Why it matters:

Plugin architecture without governance often becomes another implicit coupling path.

Recommended additions:

- `MapPluginManifest`
- `MapPluginRegistry`
- `MapPluginPermissionService`
- `MapExtensionApi`
- `MapPluginDiagnosticsPanel`

Acceptance:

- A new processing tool or source connector can be added without touching the central shell, and its permissions/capabilities are visible.

## Gap 13 - AI-Assisted GIS With Guardrails

Priority: P1/P2

Current pack coverage:

- Natural language query panel.
- Synapse IDE code artifact handoff.
- Urban method recommendations.

Missing depth:

- AI tool recommendation with deterministic preflight.
- Natural language to processing model with reviewable steps.
- AI-generated SQL/geoprocessing scripts with sandbox and tests.
- Explain-why readiness/caveat summaries.
- Source-grounded citations for analytical claims.
- Hallucination prevention: no unsupported data claims.
- User confirmation for destructive/high-impact actions.

Why it matters:

AI can make GIS workflows faster, but in scientific/urban analytics it must remain auditable and grounded.

Recommended additions:

- `MapAiCommandPlanner`
- `MapAiWorkflowDraftService`
- `MapAiExplanationService`
- `MapAiSafetyGate`

Acceptance:

- AI can draft a workflow, but execution still goes through command preflight, CRS gates, QA gates, and user approval.

## Gap 14 - Observability, Benchmark Fixtures, And SLOs

Priority: P0/P1

Current pack coverage:

- Performance budgets and visual QA exist, but initial budgets are broad.

Missing depth:

- Standard benchmark datasets.
- Automated performance dashboard.
- Memory budget per source/layer/tool.
- Render FPS and frame timing.
- Worker job trace.
- GPU/WASM fallback matrix.
- Crash/error fingerprinting.
- Export timing budgets.
- Regression thresholds.

Why it matters:

Premium feel depends on measurable performance and reliability, not only design polish.

Recommended additions:

- `MapBenchmarkFixtureRegistry`
- `MapPerformanceHarness`
- `MapWorkerTraceService`
- `MapRenderTelemetryPanel`
- `MapPerfBudgetConfig`

Acceptance:

- Release candidates include performance results against fixed fixtures and fail on defined regressions.

## Gap 15 - Documentation, Help, And Operator Training

Priority: P1

Current pack coverage:

- Planning docs and release gates.

Missing depth:

- In-app command help.
- Tool help pages.
- Method-specific GIS prerequisites.
- Sample projects.
- Guided onboarding.
- Keyboard shortcut reference.
- Troubleshooting guide.
- "Why blocked?" explanations.
- Glossary for CRS, QA, source modes, evidence states.

Why it matters:

Professional tools are dense. Without excellent help, density becomes friction.

Recommended additions:

- `MapHelpRegistry`
- `MapToolHelpPanel`
- `MapOnboardingProject`
- `MapShortcutManager`

Acceptance:

- Every processing tool, source connector, and blocked state links to concise help.

## Gap 16 - Localization, Units, And Regional Planning Semantics

Priority: P1/P2

Current pack coverage:

- CRS, scale, and planning assumptions are mentioned.

Missing depth:

- Unit system handling: metric/imperial/custom planning units.
- Locale-specific number/date formatting.
- Timezone handling for sun/shadow and temporal layers.
- Local planning terms and zoning schemas.
- International address/geocoder strategies.
- RTL/localized UI readiness if product scope requires it.

Why it matters:

GIS is local. A global professional product needs units, dates, CRS, zoning semantics, and language behavior to be explicit.

Recommended additions:

- `MapUnitPreferenceService`
- `MapLocaleFormattingService`
- `MapPlanningVocabularyRegistry`
- `MapTimezoneService`

Acceptance:

- Reports and evidence use explicit units, timezone, locale, and planning vocabulary assumptions.

## Missing Gap Backlog Summary

| Priority | Gap | First concrete deliverable |
| --- | --- | --- |
| P0 | Enterprise schema/edit rules | Domain/subtype/attribute rule registry. |
| P0 | Collaboration/versioning | Version graph and conflict review model. |
| P0 | Security/governance | Access/export policy service. |
| P0 | Backend execution | Capability-aware job adapter. |
| P0 | Observability | Benchmark fixture registry and perf harness. |
| P1 | OGC/STAC/cloud-native sources | OGC API and STAC connectors. |
| P1 | Field/offline | Offline replica/sync plan. |
| P1 | Raster/EO | STAC + COG raster workbench. |
| P1 | SQL workbench | DuckDB spatial SQL editor and saved views. |
| P1 | Advanced cartography | Symbol/label/annotation system. |
| P1 | Network/parcel/utility domains | Domain-specific lightweight service contracts. |
| P1 | 3D streaming/point clouds/BIM | 3D Tiles runtime plus vertical datum service. |
| P1 | Plugin SDK | Manifest, permissions, API versioning. |
| P1 | AI GIS guardrails | AI workflow draft service routed through command gates. |
| P1 | Help/training | Tool help registry and sample projects. |
| P2 | Localization/planning semantics | Units, locale, timezone, planning vocabulary. |

## Suggested New Prompt Blocks

These should be added after Prompt 38 only when the existing foundation is stable.

### Prompt 39 - Enterprise Schema Rules

Add domain, subtype, relationship, attachment, attribute rule, and edit validation contracts.

### Prompt 40 - Collaboration, Versioning, And Conflict Review

Add project/session version graph, lock model, comments, approvals, and conflict review.

### Prompt 41 - Standards Connectors

Add OGC API Features/Tiles/Processes, STAC, COG, 3D Tiles metadata, and source conformance profiles.

### Prompt 42 - Backend Job Execution

Add optional backend job adapter, long-running job state, artifact storage, cancellation, and resumable progress.

### Prompt 43 - Security And Governance

Add access policy, export policy, credential vault adapter, data classification, license gates, and audit retention.

### Prompt 44 - Offline And Field Workflow

Add offline package, field forms, GPS capture, attachments, sync/reconcile, and conflict handling.

### Prompt 45 - Raster And EO Workbench

Add STAC browser, COG runtime, raster calculator, band math, histograms, terrain derivatives, and zonal stats evidence.

### Prompt 46 - Spatial SQL Workbench

Add SQL editor, saved views, spatial indexes, query explain, result layers, and provenance manifests.

### Prompt 47 - Advanced Cartography

Add symbol library, label engine, annotation layers, style packages, color accessibility checks, and layout themes.

### Prompt 48 - Network, Parcel, And Utility Domain Models

Add lightweight but explicit domain contracts for transit/network, parcel fabric, and utility network workflows.

### Prompt 49 - 3D Streaming And Vertical Reference

Add 3D Tiles runtime, point cloud runtime, BIM/IFC connector, vertical datum policy, and 3D performance diagnostics.

### Prompt 50 - Plugin SDK

Add plugin manifest, permission model, API versioning, sandboxing, extension lifecycle, and diagnostics.

### Prompt 51 - AI GIS Guardrails

Add AI workflow drafting, explanation, SQL/script generation, safety gates, and source-grounded review.

### Prompt 52 - Product Help, Localization, And Operator Training

Add tool help registry, guided sample projects, shortcut manager, units/locale/timezone handling, and planning vocabulary.

## Final Product Standard

A modern first-class premium GIS tool should be able to say all of this truthfully:

- Data is source-backed, restorable, governed, and standards-aware.
- Edits are validated, versioned, reviewable, and conflict-safe.
- Analysis is CRS-safe, worker/backend-aware, reproducible, and evidence-ready.
- Cartography and layouts produce professional outputs, not screenshots.
- 2D, 3D, raster, vector, network, and tabular workflows share one coherent workbench.
- Urban Analytics receives trusted summaries and evidence references, not raw hidden state.
- Performance, accessibility, security, and visual quality are release gates.
- AI assists the workflow without bypassing scientific QA or user approval.

