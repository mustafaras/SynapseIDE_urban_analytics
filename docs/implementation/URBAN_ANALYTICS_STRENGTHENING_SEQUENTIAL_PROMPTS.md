# SynapseCore Urban Analytics Workbench — Sequential Implementation Prompts

## Prompt 01 — Program Initiation, Architectural Mapping, and Delivery Doctrine

### Objective
Establish a precise implementation framework that maps the strengthening plan to the current codebase, identifies structural gaps, and defines delivery rules that will govern all subsequent phases.

### Permanent Operating Rules For All Subsequent Prompts
This file is optimized for long-horizon implementation agents such as Claude Opus 4.6. Read each prompt as an execution milestone, not as a brainstorming note. Apply the following rules throughout the entire sequence.

#### Program Alignment
- Treat this document as the execution counterpart of [URBAN_ANALYTICS_STRENGTHENING_PLAN.md](c:/Users/PC/Desktop/SynapseIDE_urban_analytics/URBAN_ANALYTICS_STRENGTHENING_PLAN.md).
- Maintain explicit alignment with these seven axes throughout implementation:
  1. Spatial Statistical Depth
  2. Data Ecosystem Expansion
  3. Geospatial Artificial Intelligence
  4. 3D Urban Modelling and Digital Twin
  5. Scenario Planning and Simulation
  6. Visualisation, Reporting and Decision Support
  7. Performance, Scalability and Computation
- Preserve the plan's expectations for planning education, research reproducibility, indicator expansion, technical debt closure, and release hardening.

#### Execution Rules
- Execute prompts strictly in sequence unless a dependency note explicitly permits parallel work.
- Treat each prompt as a bounded milestone: inspect the current codebase state, implement the feature, add or update tests, validate the result, report completion, and identify dependency risks for the next prompt.
- Do not skip validation after any prompt that modifies analytical logic, data contracts, rendering behavior, or reproducible outputs.
- Preserve scientific traceability. Every analytical feature should be explainable to a graduate planning studio, not merely pass a technical smoke test.
- Prefer vertical slices that are complete, testable, and interpretable over wide but shallow scaffolding.
- Preserve stable existing behavior unless the prompt explicitly authorizes redesign.
- When introducing a new engine or service, build the smallest abstraction that is robust enough to support later expansion without forcing a rewrite.

#### Delivery Standards

Analytical standards:
- Mathematical methods must match the formulas, assumptions, and literature intent reflected in the strategic plan.
- Outputs must expose enough metadata to support interpretation, reporting, and teaching.
- Statistical procedures must report uncertainty, significance, diagnostics, or confidence information whenever the method requires it.
- Any approximation, heuristic simplification, or performance shortcut must be documented and isolated so it can later be upgraded.

Engineering standards:
- New modules must be strongly typed, modular, testable, and discoverable through clean export contracts.
- Shared contracts belong in reusable type layers, not duplicated locally inside unrelated feature files.
- CPU-intensive tasks should be routed to workers, GPU, or WASM where justified by scale.
- Modules must fail safely under missing data, malformed geometry, unstable network access, and partial computation.

UI and UX standards:
- Analytical flows must surface method choices, assumptions, and parameter meanings clearly.
- Results must not behave like opaque black boxes. Users should be able to inspect inputs, outputs, warnings, and classifications.
- Interfaces should be usable by expert researchers while remaining intelligible to advanced students.
- Export paths should be designed as first-class outcomes, not bolted on at the end.

Reproducibility standards:
- Major analytical runs must be serializable and reproducible.
- Methodology references and provenance metadata should persist wherever feasible.
- Scenario assumptions, transformation pipelines, and calculator configurations should be exportable in machine-readable form.

#### Global Validation Gate
Run these checks after every substantial implementation prompt unless the repository lacks the corresponding script.

1. `npm run typecheck`
2. `npm run build`
3. `npm run lint`
4. Targeted tests for the modified domain
5. If a user-facing flow changed, run or update the corresponding end-to-end scenario

#### Mandatory Completion Report Format
After each prompt is executed, the implementation agent must provide a concise completion report using the following structure:

```md
### Prompt XX — Completion Report
- Scope Completed:
- Key Files Added or Updated:
- Analytical Methods Implemented:
- Validation Performed:
- Known Limitations:
- Follow-Up Recommended:
```

#### Non-Negotiable Constraints
- Do not lower scientific rigor to gain superficial speed.
- Do not hide uncertainty, caveats, or methodological limitations from the user interface.
- Do not bypass the platform's architectural conventions for short-term convenience.
- Do not ship placeholder logic disguised as finished analytical capability.
- Do not prioritize visual effect over analytical substance.

### Prompt
You are preparing this repository to execute the full Urban Analytics Strengthening Plan as a coordinated engineering and research program.

Perform the following work:
- Audit the existing repository structure and map current modules to the seven strategic axes in the plan.
- Produce a gap matrix that distinguishes between: already implemented, partially implemented, stubbed, missing, and legacy-conflicted capabilities.
- Create or normalize the architectural roots required by the plan, including but not limited to:
  - `src/engine/spatial-stats/`
  - `src/engine/geoai/`
  - `src/engine/simulation/`
  - `src/engine/digital-twin/`
  - `src/features/dashboard/`
  - `src/features/education/`
  - `src/services/reporting/`
  - `src/services/data/`
  - `src/engine/wasm/`
  - `src/engine/streaming/`
- Ensure every new domain root includes a clean export contract through `index.ts` files.
- Create a documentation backbone under `docs/implementation/` containing:
  - `module-matrix.md`
  - `definition-of-done.md`
  - `testing-and-validation.md`
  - `performance-and-budgeting.md`
  - `research-reproducibility.md`
- Define a common delivery doctrine covering naming rules, testing expectations, worker boundaries, performance limits, and reproducibility requirements.

### Deliverables
- A repository-wide implementation matrix.
- A stable module skeleton for all planned domains.
- Documentation that can govern the rest of the implementation program.

### Acceptance Criteria
- Every major section of the strengthening plan has a mapped destination in the codebase.
- Missing domain roots are created without breaking current imports.
- Documentation clearly defines what counts as complete, testable, and research-grade.

---

# Phase 1 — Scientific Foundation

## Prompt 02 — Spatial Weights Infrastructure

### Objective
Build the foundational spatial weights engine required for autocorrelation, spatial diagnostics, clustering, and downstream inferential analytics.

### Prompt
Implement `src/engine/spatial-stats/autocorrelation/SpatialWeights.ts` as a robust, reusable foundation for spatial weights construction.

Required methods:
- `queenContiguity()`
- `rookContiguity()`
- `kNearestNeighbors()`
- `distanceBand()`
- `inverseDistance()`
- `rowStandardize()`

Implementation requirements:
- Support polygon-based contiguity and point-based distance methods.
- Use sparse internal representations suitable for city-scale data.
- Define clear shared types in `src/engine/spatial-stats/types.ts`.
- Ensure deterministic ordering and tie handling.
- Expose metadata required by downstream methods, including total weights, island observations, and symmetry state.
- Add unit tests that cover contiguous polygons, isolated observations, duplicated coordinates, and deterministic KNN behavior.

### Acceptance Criteria
- Weight matrices are computationally stable and test-covered.
- Row-standardization is mathematically correct and documented for islands.
- The output contract is reusable across Moran's I, Gi*, spatial regression, and constrained clustering.

---

## Prompt 03 — Global Moran's I with Permutation Inference

### Objective
Introduce formal global spatial autocorrelation testing with defensible significance estimation.

### Prompt
Implement `src/engine/spatial-stats/autocorrelation/GlobalMoransI.ts`.

Required capabilities:
- `moransI()`
- `expectedI()`
- `varianceI()`
- `zScore()`
- `pseudoPValue()` using permutation inference

Implementation requirements:
- Use typed arrays for efficient numeric computation.
- Support seeded randomization for reproducibility.
- Default to 999 permutations while allowing overrides.
- Return a structured result object including statistic, expected value, variance, z-score, pseudo p-value, and permutation count.
- Add test fixtures for clustered, dispersed, and random spatial patterns.
- Ensure the implementation can later be exposed directly to UI report narratives.

### Acceptance Criteria
- Clustered test data yields positive and significant spatial autocorrelation.
- Random test data yields near-null autocorrelation.
- Seeded permutation results are reproducible.

---

## Prompt 04 — Local Moran's I and LISA Cluster Mapping

### Objective
Enable neighborhood-scale interpretation of spatial concentration, outliers, and localized inequality patterns.

### Prompt
Implement `src/engine/spatial-stats/autocorrelation/LocalMoransI.ts`.

Required capabilities:
- Compute local Moran statistics per observation.
- Classify quadrant types: HH, HL, LH, LL.
- Add significance control using Bonferroni and false discovery rate options.
- Generate a GeoJSON-ready cluster map output with attached statistical fields.
- Produce legend metadata for map rendering and report export.

Implementation requirements:
- Include standardized values and spatial lag handling in a well-documented pipeline.
- Ensure the result contract includes raw local statistic, p-value, significance flag, and cluster type.
- Add tests for multiple testing corrections and cluster labeling logic.

### Acceptance Criteria
- The module correctly distinguishes high-high clustering from outlier conditions.
- Significance filtering changes results in the expected direction.
- Output is directly usable in map layers and report generation.

---

## Prompt 05 — Getis-Ord Gi* Hot Spot Analysis

### Objective
Provide formal hot spot and cold spot detection suitable for policy targeting and spatial intervention design.

### Prompt
Implement `src/engine/spatial-stats/autocorrelation/GetisOrdGi.ts`.

Required capabilities:
- `giStar()`
- `zScoreMap()`
- `confidenceMap()`

Implementation requirements:
- Support confidence categories at 90%, 95%, and 99%.
- Return both numeric z-scores and interpretable class labels.
- Handle nulls, sparse neighbors, and degenerate distributions safely.
- Add tests for hot spot, cold spot, and null-pattern scenarios.
- Include a small benchmark or performance harness for medium-sized urban datasets.

### Acceptance Criteria
- Positive z-scores produce hot spot classes; negative z-scores produce cold spot classes.
- Confidence categorization is internally consistent and documented.
- Results can be serialized into feature properties without lossy conversion.

---

## Prompt 06 — OLS with Full Spatial Diagnostics

### Objective
Create a statistically credible baseline regression engine with diagnostics sufficient to justify downstream spatial model selection.

### Prompt
Implement `src/engine/spatial-stats/regression/OLS.ts` and any required shared math utilities under `src/engine/spatial-stats/math/`.

Required capabilities:
- Core OLS fit
- R-squared, adjusted R-squared, AIC, BIC, log-likelihood
- Residual diagnostics: Jarque-Bera and Breusch-Pagan
- Spatial diagnostics: Moran's I on residuals, LM-lag, LM-error, robust LM variants
- Multicollinearity diagnostics using VIF

Implementation requirements:
- Use numerically stable linear algebra routines.
- Design the output so model comparison tables can be generated later without reshaping.
- Add tests for known synthetic regression cases.
- Clearly separate estimation, residual diagnostics, and spatial diagnostics.
- Make the result explainable in an educational context by attaching diagnostic labels or interpretation hints where appropriate.

### Acceptance Criteria
- Core regression results are numerically plausible and consistent with synthetic expectations.
- Diagnostic outputs provide enough information to justify moving to SAR or SEM in future prompts.
- The module is test-covered and ready for UI wiring.

---

## Prompt 07 — Geographically Weighted Regression

### Objective
Allow spatially varying relationship modeling, with careful attention to bandwidth selection and computation strategy.

### Prompt
Implement `src/engine/spatial-stats/regression/GWR.ts` and a companion worker such as `src/workers/gwr.worker.ts`.

Required capabilities:
- Local coefficient estimation
- Kernel support: Gaussian, bisquare, exponential
- Bandwidth selection using golden-section search and AICc
- Local R-squared output
- Parameter surface generation for mapping

Implementation requirements:
- Use workers for heavy numeric tasks, with a synchronous fallback for environments where workers are unavailable.
- Return outputs that can feed both map styling and report figures.
- Add test fixtures for local variation in relationships.
- Document computational limits and approximation choices if any are introduced.

### Acceptance Criteria
- Bandwidth selection converges reliably.
- Worker and fallback pathways yield equivalent results within acceptable tolerance.
- Result surfaces are mappable without additional transformation glue.

---

## Prompt 08 — STAC Client and Cloud Optimized GeoTIFF Reader

### Objective
Create the Earth observation access layer required by remote sensing, environmental analytics, and future GeoAI pipelines.

### Prompt
Implement `src/services/data/connectors/STACClient.ts` and `src/services/data/connectors/COGReader.ts`.

Required capabilities:
- STAC search by bounding box, time interval, collection, and query filters
- Metadata normalization into a shared internal catalog contract
- HTTP range request reading for Cloud Optimized GeoTIFF assets
- Retry and backoff handling for unstable remote sources
- Partial raster access without full download

Implementation requirements:
- Integrate with a catalog-oriented architecture rather than exposing raw connector responses everywhere.
- Add integration tests with mock responses.
- Design the result shape to support later Sentinel, Planetary Computer, and generic STAC workflows.

### Acceptance Criteria
- STAC item discovery works against mock and real-world-shaped contracts.
- COG window or tile access works without downloading entire rasters.
- Connector output is consistent with future data catalog and ETL expectations.

---

## Prompt 09 — Sentinel Hub Connector

### Objective
Operationalize remote sensing access for Sentinel-2-based urban environmental analysis.

### Prompt
Implement `src/services/data/connectors/SentinelHubConnector.ts`.

Required capabilities:
- Token acquisition and refresh
- Process API requests
- B04 and B08 retrieval helpers for NDVI workflows
- Cloud cover filtering
- Temporal window support
- User-readable error handling

Implementation requirements:
- Isolate credentials and request composition cleanly.
- Produce a response contract useful for both raster visualization and analytic computation.
- Add tests for authentication refresh, malformed responses, and empty result cases.

### Acceptance Criteria
- Imagery requests can be issued for a valid bounding box and time range.
- Authentication refresh is handled gracefully.
- The connector is ready to support environmental indicators and land cover pipelines.

---

## Prompt 10 — Completion of the Five Placeholder Analytical Flows

### Objective
Turn the five placeholder flows in the plan into functional user journeys with valid state handling and reproducible outputs.

### Prompt
Fully implement the following flows under the existing flow architecture in `src/centerpanel/Flows/` and any related registry or orchestration layers:
- Composite Indicator Builder
- Scenario Comparison
- Equity Audit
- Change Detection
- Analytical Run Review

For each flow, provide:
- A step-based UI consistent with existing flow patterns
- Validation and guardrails for each stage
- Persisted state and restore capability
- Result panels with interpretable outputs
- JSON export of parameters and outputs

Implementation requirements:
- Preserve existing flow conventions where they already exist.
- Ensure step labels, field names, and result language reflect the strengthening plan.
- Include lightweight smoke tests for navigation and result generation.

### Acceptance Criteria
- All five flows run from start to finish.
- Session restoration works for partial progress.
- Result outputs are serializable and interpretable.

---

## Prompt 11 — PCA and Cluster Analysis

### Objective
Add core multivariate methods for neighborhood typology, dimensionality reduction, and classification-based urban profiling.

### Prompt
Implement `src/engine/spatial-stats/multivariate/PCA.ts` and `src/engine/spatial-stats/multivariate/ClusterAnalysis.ts`.

Required PCA capabilities:
- Correlation-based decomposition
- Scree output
- Loadings
- Scores
- Kaiser criterion

Required clustering capabilities:
- K-means with k-means++ initialization
- Hierarchical clustering with multiple linkage strategies
- Silhouette scoring
- Elbow diagnostics

Implementation requirements:
- Return outputs directly suitable for charts and map attribute joins.
- Add at least two realistic fixtures based on urban indicators or mock census-morphology datasets.
- Ensure labels and diagnostics are understandable to advanced students.

### Acceptance Criteria
- PCA outputs are structurally correct and testable.
- Clustering results and diagnostics are usable for typology mapping.
- Modules are ready for future composite and dashboard integration.

---

# Phase 2 — GeoAI and 3D Urban Intelligence

## Prompt 12 — ONNX Runtime Web Infrastructure

### Objective
Provide the runtime foundation for in-browser model inference across land cover, detection, segmentation, and future predictive models.

### Prompt
Implement the GeoAI runtime core under:
- `src/engine/geoai/runtime/ONNXRuntimeManager.ts`
- `src/engine/geoai/runtime/ModelRegistry.ts`

Required capabilities:
- Model loading and session lifecycle management
- Warmup support for frequently used models
- Memory budgeting and eviction behavior
- Abortable inference execution
- Configurable backend selection with WebAssembly as default and optional WebGPU

Implementation requirements:
- Design a registry that can support built-in and user-supplied models.
- Keep runtime behavior observable enough for later telemetry and UI status reporting.
- Add tests using a small inference fixture or mocked runtime adapter.

### Acceptance Criteria
- A small ONNX model can be loaded, warmed, executed, and released.
- The runtime can enforce memory limits predictably.
- The API is stable enough to serve multiple CV and NLP tasks.

---

## Prompt 13 — Land Cover Classification Pipeline

### Objective
Deliver a credible browser-native land cover analysis workflow grounded in modern segmentation practice.

### Prompt
Implement `src/engine/geoai/cv/LandCoverClassifier.ts`.

Required capabilities:
- Raster preprocessing and normalization
- Tile slicing and inference orchestration
- Model adapters for U-Net and SegFormer-style ONNX models
- Postprocessing for patch cleanup
- Accuracy reporting via confusion matrix, F1, and intersection-over-union

Implementation requirements:
- Make the pipeline compatible with Sentinel-derived imagery from the previous prompt.
- Expose both class raster output and summary metrics.
- Support a clear class schema aligned with the plan: built-up, vegetation, water, bare soil, road, agriculture.
- Add a small end-to-end demo harness or integration point.

### Acceptance Criteria
- The full inference pipeline runs from raster input to classified output.
- Accuracy summaries are computable and exportable.
- The module can later feed change detection and environmental reporting.

---

## Prompt 14 — Natural Language to Spatial SQL

### Objective
Enable safe, analyst-oriented natural language querying over spatial datasets without sacrificing control or transparency.

### Prompt
Implement `src/engine/geoai/nlp/QueryToSQL.ts`.

Required capabilities:
- Intent classification
- Entity extraction
- Threshold and distance parsing
- Spatial relation interpretation
- Read-only SQL generation for DuckDB spatial workflows
- Query sandbox validation and rejection of unsafe patterns

Implementation requirements:
- Support common planning analysis prompts such as accessibility thresholds, service proximity, high-risk area filtering, and neighborhood aggregation.
- Prevent generation of mutating SQL.
- Add a golden test suite with at least thirty representative prompt-to-query pairs.
- Return explanation metadata that helps the UI show how the natural language request was interpreted.

### Acceptance Criteria
- A representative benchmark set yields strong parse quality.
- Unsafe requests are blocked.
- The generated SQL is useful, inspectable, and not a black box.

---

### Standing UI Enforcement Directive — Applies to All Prompts 15 and Beyond

Every feature implemented from Prompt 15 onward must satisfy the following UI enforcement rules in addition to its prompt-specific requirements. These rules are non-negotiable and override any interpretation that treats engine-only or backend-only delivery as complete.

#### Mandatory UI Surface Rule
- Every analytical capability, loader, simulator, optimizer, generator, or data pipeline introduced in Prompts 15–43 **must** have a corresponding, functional UI surface within the application.
- "UI surface" means: a visible panel, tool, dialog, sidebar entry, flow step, dashboard widget, map layer control, or context menu action that a user can discover, invoke, configure, and observe results from — without touching code or a console.
- Scaffolding, placeholder text, disabled buttons, empty panels, or "coming soon" labels do **not** satisfy this requirement.

#### Functional Completeness Rule
- The UI surface must be fully wired to the underlying engine or service. Clicking a button must trigger real logic and produce real, inspectable output.
- Loading states, progress indicators, error feedback, and empty-state messaging must all be implemented for every interactive surface.
- Every result must be viewable in at least one of: map layer, chart, table, panel, report section, or exportable artifact.

#### Professional Presentation Rule
- All new UI surfaces must follow the application's established Charcoal-Amber design system (typography, spacing, color tokens, elevation, animation conventions).
- Labels, tooltips, and section headings must use clear, domain-appropriate language — not developer jargon, placeholder Lorem Ipsum, or raw variable names.
- Interactive controls (sliders, dropdowns, toggles, inputs) must have visible labels, sensible defaults, and validation feedback.

#### Discoverability and Navigation Rule
- Every new capability must be reachable through the application's existing navigation structure: sidebar, command palette, flow registry, tool panel, or context menu.
- If the feature introduces a new analytical flow, it must appear in the flow registry with an icon, title, and short description.
- If the feature introduces a new tool or utility, it must be accessible from the relevant tool panel or section.

#### Operational Verification Rule
- After implementation, the agent must manually verify that the feature can be triggered from the UI, runs to completion without console errors, and produces a visible result.
- If a feature requires sample data to function, the implementation must include embedded demo data, a fixture loader, or clear instructions in the UI for data requirements.
- If the implementation agent cannot verify UI operation (e.g., due to environment constraints), it must explicitly document what remains unverified and flag it as a follow-up risk in the completion report.

#### Anti-Pattern Blacklist
The following patterns are explicitly prohibited from Prompt 15 onward:
- Engine modules with no UI entry point.
- Exported classes or functions that are never imported by any React component, flow, or panel.
- "Headless" implementations that assume a future prompt will add the UI — every prompt must deliver its own complete UI surface.
- Test-only code with no user-facing manifestation.
- API-ready modules that have no consumer in the application shell.

#### Completion Report Addendum
The mandatory completion report for each prompt (Prompt 15 onward) must include an additional section:

```md
### UI Verification
- UI Entry Points Added:
- Navigation Path (how user reaches the feature):
- Visual Verification Status: [Verified / Partially Verified / Unverified — with rationale]
- Screenshots or Description of Rendered State:
- Known UI Gaps or Follow-Ups:
```

---

## Prompt 15 — High-Performance Building Extrusion

### Objective
Advance the VoxCity stack from skeleton status to meaningful 3D urban form visualization.

### Prompt
Implement `src/features/urbanAnalytics/voxcity/BuildingExtruder.ts`.

Required capabilities:
- Polygon to 2.5D extrusion
- Level of detail handling for basic and enriched models
- Instanced rendering for large building sets
- Height fallback strategy based on attributes and sensible defaults

Implementation requirements:
- Preserve performance for very large urban building collections.
- Handle invalid footprints gracefully.
- Return or expose metadata useful for thematic styling later.
- Add rendering-oriented tests or geometry validation checks where direct visual testing is difficult.

### UI Deliverables
- A 3D viewer panel displaying extruded buildings with interactive orbit, pan, and zoom controls.
- An LOD toggle (basic / enriched) accessible from the viewer toolbar.
- A height attribute selector dropdown for choosing height source fields.
- Loading spinner and progress indicator during extrusion of large datasets.
- A thematic styling sidebar or control allowing users to color buildings by attribute value.
- The 3D building view must be reachable from the VoxCity section of the application navigation.

### Acceptance Criteria
- Large building datasets remain interactively viewable.
- Height derivation rules are deterministic and documented.
- The module becomes a credible foundation for later CityJSON and solar analysis prompts.
- The 3D viewer is fully operational in the UI with working LOD toggle and attribute-based styling.
- A user can load sample building data and see extruded buildings without touching code.

---

## Prompt 16 — CityJSON Loader

### Objective
Enable semantic 3D city model ingestion suitable for digital twin and urban morphology workflows.

### Prompt
Implement `src/features/urbanAnalytics/voxcity/CityJSONLoader.ts`.

Required capabilities:
- Parse CityJSON v2.0 structures
- Convert CityObjects into renderable geometry
- Preserve semantic surfaces such as roof, wall, and ground
- Expose attribute query hooks

Implementation requirements:
- Structure the loader so it can later coexist with 3D Tiles and IFC ingestion.
- Add realistic fixtures or sample loaders.
- Support metadata retention for reporting and thematic mapping.

### UI Deliverables
- A file import dialog or drag-and-drop zone for CityJSON files in the data import panel.
- A loading progress bar with file size and parsing status.
- A metadata inspection panel showing CityObject counts, semantic surface types, and attribute summary after loading.
- Loaded CityJSON objects rendered in the 3D viewer with semantic surface coloring (roof, wall, ground).
- An attribute query panel allowing users to click objects and view attached properties.

### Acceptance Criteria
- Sample CityJSON content loads and renders correctly.
- Semantic surfaces are accessible for styling.
- The loader architecture supports future extension.
- The file import dialog is discoverable from the data import or VoxCity section of the UI.
- Users can visually inspect semantic surfaces and object attributes without using the console.

---

## Prompt 17 — Sunlight and Solar Exposure Simulation

### Objective
Support urban form analysis, solar rights assessment, and environmental design evaluation in 3D.

### Prompt
Implement `src/features/urbanAnalytics/voxcity/SunlightSimulator.ts`.

Required capabilities:
- Sun position simulation over a date and interval sequence
- Shadow accumulation output
- Solar exposure estimation
- Overlay compatibility with 2D and 3D views

Implementation requirements:
- Use a clear temporal parameter model.
- Produce outputs that can later feed building-level or ground-level summaries.
- Add validation against simple benchmark geometries where possible.

### UI Deliverables
- A simulation configuration panel with date picker, time range selector, and interval controls.
- A play/pause animation control for stepping through shadow positions over the selected time range.
- A shadow overlay rendered on the 3D view, updating visually as the simulation progresses.
- A solar exposure summary panel showing hours of sunlight per building or ground area.
- Export buttons for shadow maps and exposure data.
- The simulation must be launchable from the VoxCity tools section without manual code invocation.

### Acceptance Criteria
- Repeated runs with identical inputs are deterministic.
- Results are spatially interpretable and visually plottable.
- Performance is acceptable for neighborhood-scale use.
- The shadow animation runs smoothly in the 3D viewer and can be started, paused, and scrubbed from the UI.
- Solar exposure results are visible in a summary panel and exportable.

---

## Prompt 18 — YOLO-Nano Urban Object Detection

### Objective
Introduce lightweight object detection from very high resolution imagery for urban feature extraction.

### Prompt
Implement `src/engine/geoai/cv/ObjectDetector.ts`.

Required capabilities:
- Tile-based inference orchestration
- Non-maximum suppression across tile boundaries
- Multi-class support for vehicle, tree, swimming pool, solar panel, and construction site
- GeoJSON-ready output with class and confidence

Implementation requirements:
- Ensure coordinate conversion back to map space is reliable.
- Expose class schema and confidence thresholds as configurable parameters.
- Add tests for tiling, merge behavior, and empty-image cases.

### UI Deliverables
- An inference launch panel with class selection checkboxes and confidence threshold slider.
- A real-time progress indicator showing tile processing status during detection.
- Detection results rendered as a GeoJSON map layer with class-colored bounding boxes or markers.
- A result summary table listing detected objects by class and count.
- Click-to-inspect behavior on detected objects showing class, confidence, and geographic coordinates.
- The detection tool must be accessible from the GeoAI tools section of the application.

### Acceptance Criteria
- Detection output can be rendered directly as a map layer.
- Duplicate detections are reduced effectively.
- Runtime is appropriate for browser-based exploratory use.
- Users can launch detection, monitor progress, and explore results entirely through the UI.
- The results map layer and summary table are live and interactive.

---

## Prompt 19 — Analytical Narrative Generation

### Objective
Generate academically credible analytical prose from structured results, while preserving traceability to methods.

### Prompt
Implement `src/engine/geoai/nlp/ReportNarrativeGenerator.ts`.

Required capabilities:
- Narrative templates for finding, comparison, trend, recommendation, and method note generation
- Tone modes such as academic, policy brief, executive summary, and public communication
- Citation insertion based on methodology metadata

Implementation requirements:
- The generated text must remain grounded in structured analysis results, not free-floating prose.
- Avoid unsupported causal claims.
- Return structured output so the reporting engine can edit, replace, or annotate generated sections.

### UI Deliverables
- A narrative generation panel accessible from any analytical result view via a "Generate Narrative" action.
- A tone mode selector (academic, policy brief, executive summary, public communication) with preview of tone style.
- A live preview area showing the generated narrative text with highlighted citation anchors.
- An inline edit interface allowing users to modify, accept, or reject generated sections.
- An "Insert to Report" button wiring generated narratives into the reporting engine.
- The narrative panel must be reachable from result views of all major analytical flows.

### Acceptance Criteria
- Generated narratives are coherent and tied to actual result fields.
- Citation hooks are compatible with the future report engine.
- Output is suitable for both policy and academic reporting contexts.
- Users can generate, preview, edit, and insert narratives without leaving the application UI.
- Tone selection visibly changes the style and vocabulary of generated output.

---

# Phase 3 — Scenario Planning and Simulation

## Prompt 20 — Cellular Automata Urban Growth Model

### Objective
Implement a tractable but credible growth simulation capability for scenario-based urban expansion analysis.

### Prompt
Implement `src/engine/simulation/CellularAutomata.ts`.

Required capabilities:
- Calibration from temporal land-use states
- Simulation using suitability and constraint surfaces
- Validation through figure of merit and Kappa-style metrics

Implementation requirements:
- Encode protected areas, water, slope, and existing urban structure as explicit constraints.
- Support stochastic perturbation factors.
- Return both predicted surfaces and validation summaries.
- Document any simplifications relative to full SLEUTH-like systems.

### UI Deliverables
- A simulation flow with step-by-step parameter configuration: calibration inputs, constraint surface selection, perturbation factor slider.
- An animated temporal map showing urban growth progression across simulation steps with a time-step scrubber.
- A validation results panel displaying figure of merit, Kappa metrics, and overall fit quality.
- A comparison overlay showing predicted vs. observed land-use states side by side or as a toggle.
- Export controls for predicted surfaces and validation summaries.
- The simulation must be launchable from the Simulation section of the flow registry.

### Acceptance Criteria
- Calibration and simulation both run end-to-end.
- Validation metrics are computed and reportable.
- Output can feed scenario comparison workflows.
- The full simulation workflow is operable from the UI including parameter adjustment, execution, and result inspection.
- Validation results are displayed in a clearly labeled panel without requiring console access.

---

## Prompt 21 — Facility Siting and Location-Allocation

### Objective
Support evidence-based service siting with explicit trade-offs between efficiency and equity.

### Prompt
Implement `src/engine/simulation/FacilityOptimisation.ts`.

Required capabilities:
- P-median
- LSCP
- MCLP
- Equity-aware constraints or maximin-style logic

Implementation requirements:
- Provide a result contract that includes chosen sites, demand served, mean travel burden, and equity-sensitive diagnostics.
- Use a practical optimization strategy suitable for browser execution, such as greedy initialization with local improvement.
- Ensure compatibility with the Equity Audit flow.

### UI Deliverables
- A facility optimization flow with model selection (P-median, LSCP, MCLP), candidate site map input, and constraint configuration controls.
- A results map showing selected facility locations with service catchment area polygons.
- A demand coverage summary panel with travel burden statistics and equity diagnostic charts.
- A comparison table when multiple model variants are run, allowing side-by-side evaluation.
- Integration hooks allowing the Equity Audit flow to consume and display facility optimization results.
- The optimization flow must be accessible from the Simulation or Planning Tools section of the navigation.

### Acceptance Criteria
- Each model can solve realistic medium-sized candidate sets.
- Equity constraints change output behavior in a measurable way.
- Results are suitable for both maps and comparison tables.
- Users can configure, run, and compare facility optimization scenarios entirely from the UI.
- Catchment maps and equity diagnostics are visually rendered, not just returned as data.

---

## Prompt 22 — Full Composite Indicator Builder

### Objective
Upgrade the Composite Indicator Builder from placeholder or MVP status into an OECD/JRC-style methodological workflow.

### Prompt
Expand the Composite Indicator Builder into a complete seven-step analytical flow.

Required stages:
- Indicator selection
- Missing data handling or imputation
- Normalization
- Weighting
- Aggregation
- Sensitivity and uncertainty analysis
- Final reporting and export

Implementation requirements:
- Support methods listed in the strategic plan, including Min-Max, Z-score, rank, percentile, distance-to-reference, equal weights, expert weights, PCA-derived weights, AHP, budget allocation, additive aggregation, geometric aggregation, Monte Carlo sensitivity, and Sobol-style outputs where feasible.
- Produce confidence bands and robustness summaries.
- Export reproducible configuration packages.

### UI Deliverables
- A complete seven-step wizard with visible stage navigation bar, stage validation indicators, and back/next controls.
- Interactive configuration at each stage: indicator selection checklist, imputation method picker, normalization method picker, weighting interface (manual sliders and method-derived), aggregation selector, sensitivity parameter controls, and final report preview.
- A live composite map updating as the user adjusts parameters at any stage.
- Confidence band and robustness visualizations in the final reporting step.
- Full export of configuration, results, and uncertainty data as downloadable artifacts.
- The flow must appear in the flow registry and be completable from first step to final export without leaving the UI.

### Acceptance Criteria
- The seven-stage workflow is complete and repeatable.
- Uncertainty outputs are visible and interpretable.
- The flow is sufficiently rigorous for graduate teaching and research demonstration.
- Every stage of the wizard is fully interactive with working controls, validation feedback, and live previews.
- A user can complete the entire composite indicator workflow and export results without any console interaction.

---

## Prompt 23 — Scenario Comparison and Trade-Off Dashboard

### Objective
Support structured comparison of multiple intervention pathways using both delta analysis and trade-off reasoning.

### Prompt
Implement a fully operational Scenario Comparison system that extends the earlier flow into a dashboard-capable analytical module.

Required capabilities:
- Baseline and multiple alternative scenarios
- Parameter adjustment and recalculation
- Absolute and percent delta maps
- Radar and parallel coordinate comparisons
- Trade-off matrix and Pareto candidate identification

Implementation requirements:
- Support at least two to four scenarios.
- Ensure result comparison operates on aligned indicators and consistent scales.
- Add export and narrative-ready summaries.

### UI Deliverables
- A multi-scenario layout panel supporting baseline and up to four alternative scenarios displayed side by side.
- Per-scenario parameter adjustment controls with recalculation triggers and loading states.
- Delta maps (absolute and percent change) rendered as toggleable layers on the map.
- Radar and parallel coordinate charts rendered interactively with hover details and axis labeling.
- A trade-off matrix panel with Pareto frontier candidates highlighted visually.
- Export buttons for comparison summaries, charts, and delta data.
- The scenario comparison dashboard must be accessible from the flow registry and the dashboard module.

### Acceptance Criteria
- Scenario differences are correctly computed and visualized.
- Trade-off output is analytically intelligible, not cosmetic.
- Results can feed reporting and policy briefing workflows.
- All comparison views (delta maps, radar charts, parallel coordinates, trade-off matrix) are fully rendered and interactive in the UI.
- Users can add, configure, and compare scenarios without code or console.

---

## Prompt 24 — System Dynamics Module

### Objective
Model long-run urban change through stocks, flows, and feedback structure.

### Prompt
Implement `src/engine/simulation/SystemDynamics.ts`.

Required capabilities:
- Stocks for population, housing, employment, transport capacity, and green space
- Flows for growth, decline, construction, demolition, and network expansion
- Annual time-step simulation using explicit numerical integration
- Causal loop graph data for visualization

Implementation requirements:
- Allow scenario parameters to function as policy levers.
- Keep the initial implementation legible enough for teaching.
- Add tests for stability under multiple parameter sets.

### UI Deliverables
- A stock-and-flow diagram panel rendered from the system model structure, showing stocks as boxes, flows as valves, and feedback loops as arcs.
- Parameter sliders functioning as policy levers with immediate re-simulation on change and visible loading state.
- Timeline charts showing stock trajectories (population, housing, employment, transport capacity, green space) over the simulation period.
- A causal loop diagram view for educational and diagnostic purposes, launchable from the simulation panel.
- Export controls for simulation traces, model parameters, and diagram images.
- The system dynamics module must be accessible from the Simulation section of the navigation.

### Acceptance Criteria
- Multi-year simulations produce stable, inspectable results.
- Parameter changes alter dynamics in expected directions.
- The module supports both policy exploration and pedagogical explanation.
- The stock-flow and causal loop diagrams are visually rendered in the UI.
- Policy lever sliders trigger re-simulation and update charts in real time.

---

## Prompt 25 — Emerging Hot Spot Analysis

### Objective
Extend hotspot reasoning into temporal dynamics for urban monitoring and change interpretation.

### Prompt
Implement `src/engine/spatial-stats/spatiotemporal/EmergingHotSpots.ts`.

Required capabilities:
- Time-step-specific Gi* analysis
- Mann-Kendall trend assessment
- Eight-category emerging hotspot classification
- Output suitable for temporal maps and animation controls

Implementation requirements:
- Preserve classification transparency by returning intermediate diagnostics where useful.
- Add test fixtures for multiple known category patterns.
- Ensure integration readiness with temporal UI controls.

### UI Deliverables
- A temporal slider or playback control for stepping through Gi* results per time step.
- An animated hotspot map showing spatial evolution over time with smooth transitions.
- A classification legend displaying all eight emerging hotspot categories with distinct color coding.
- A summary table listing observation counts per hotspot category.
- Integration with temporal UI controls (play, pause, step forward/back, speed control).
- The emerging hot spot analysis must be accessible from the Spatial Statistics tools section.

### Acceptance Criteria
- Hotspot evolution categories are assigned correctly on fixtures.
- Output works with temporal visualization layers.
- The result contract is compatible with reporting and education modules.
- The temporal animation runs smoothly in the map view with working playback controls.
- Users can explore emerging hotspot categories through the legend and summary table without console access.

---

# Phase 4 — Visualization, Reporting, and Planning Education

## Prompt 26 — Dashboard Builder

### Objective
Provide a flexible decision-support layer that can serve municipal dashboards, classroom studios, and research summaries.

### Prompt
Implement the dashboard system under `src/features/dashboard/`.

Required capabilities:
- Drag-and-drop layout canvas
- Responsive widget grid
- Widget library including KPI cards, maps, charts, tables, text blocks, comparison widgets, and live indicator widgets
- Template loading for city profile, SDG monitoring, risk assessment, accessibility equity, and neighborhood comparison dashboards
- Export to PDF, PNG, and embeddable HTML

Implementation requirements:
- Keep widget data binding explicit and reusable.
- Support save and restore of dashboard layouts.
- Ensure templates are grounded in actual plan use cases.

### UI Deliverables
- A fully functional drag-and-drop layout canvas with snap-to-grid behavior.
- A widget library sidebar listing all widget types (KPI cards, maps, charts, tables, text blocks, comparison widgets, live indicator widgets) with drag handles.
- Widget configuration popovers for data binding, label editing, and style customization.
- Five pre-built template dashboards (city profile, SDG monitoring, risk assessment, accessibility equity, neighborhood comparison) loadable as one-click presets from a template gallery.
- Save, restore, and rename controls for user-created dashboards.
- Export buttons for PDF, PNG, and embeddable HTML — all fully operational and producing valid output.
- The dashboard builder must be a primary navigation destination, not buried in a submenu.

### Acceptance Criteria
- Users can build, save, reload, and export dashboards.
- Template dashboards load without manual repair.
- The system is suitable for both internal analysis and external presentation.
- All five export targets (PDF, PNG, HTML, and navigable template types) produce valid output when clicked.
- Drag-and-drop, widget configuration, and template loading are fully operational and visually polished.

---

## Prompt 27 — Academic Report Engine and Citation Layer

### Objective
Transform analytical outputs into publication-style and policy-style deliverables.

### Prompt
Implement the reporting stack under `src/services/reporting/`.

Required modules:
- `ReportEngine.ts`
- `AutoNarrative.ts`
- `CitationManager.ts`
- Template modules for Technical Report, Policy Brief, Environmental Impact Assessment, and SDG Progress Report

Implementation requirements:
- Support figure and table numbering, captions, cross-references, and bibliography generation.
- Support citation formats including APA 7th, Chicago, BibTeX, and RIS.
- Wire the narrative generator to structured result sections rather than freeform text insertion.
- Ensure reporting output can target both Markdown and PDF-oriented rendering.

### UI Deliverables
- A report builder panel with template selection dropdown, section ordering via drag-and-drop, and live preview.
- A live preview pane rendering the report as it is assembled, updating in real time as sections are reordered or edited.
- A citation insertion UI allowing users to add, edit, search, and format references within the report body.
- Export buttons for Markdown and PDF-ready output that produce actual downloadable files.
- Generated narrative sections visually distinguished (e.g., with a subtle background or badge) from user-written content.
- The report engine must be accessible from the Tools section and from result views of analytical flows.

### Acceptance Criteria
- At least two report templates compile successfully from real or fixture analysis data.
- Citations and bibliography formatting work correctly.
- The engine can serve research output and policy communication without duplicated logic.
- The report builder is fully interactive: template selection, section ordering, preview, citation management, and export all work from the UI.
- Report output quality is professional and suitable for submission or distribution.

---

## Prompt 28 — Advanced Chart Library Expansion

### Objective
Add the visualization vocabulary required for multivariate urban analysis and scenario communication.

### Prompt
Expand the chart system to include the fourteen chart types named in the strategic plan:
- Parallel coordinates
- Radar chart
- Sankey diagram
- Treemap
- Violin plot
- Beeswarm plot
- Small multiples
- Cartogram
- Dot density map
- Sparkline grid
- Waffle chart
- Slope chart
- Lollipop chart
- Box-and-whisker map

Implementation requirements:
- Define a clean data contract for each chart.
- Add tooltip and export behavior.
- Provide at least one integrated usage example per major chart family.
- Favor analytical clarity over visual novelty.

### UI Deliverables
- All fourteen chart types selectable from a chart type picker in dashboard widget configuration and report insertion contexts.
- Interactive tooltips, legends, and labeled axes on every chart type.
- A chart gallery or preview panel where users can browse available chart types with sample data thumbnails.
- Export-to-image (PNG/SVG) functionality on every chart widget.
- Charts must be resizable and respond correctly within dashboard grid layouts.
- Each chart type must be usable by dragging it into a dashboard or inserting it into a report section.

### Acceptance Criteria
- All chart types render with stable inputs.
- Data contracts are typed and documented.
- Performance remains acceptable in realistic dashboard contexts.
- Every chart type is visually rendered, interactive, and exportable from the UI.
- The chart gallery provides a discoverable browse experience for all fourteen types.

---

## Prompt 29 — Learning Path Engine and Methodology Explainers

### Objective
Turn the platform into a structured pedagogical environment for graduate planning education.

### Prompt
Implement the education module under `src/features/education/`.

Required capabilities:
- Learning path engine for the eight paths described in the strengthening plan
- Prerequisite logic
- Progress tracking
- Adaptive difficulty hooks
- Methodology explainers with formulas, assumptions, limitations, and misuse warnings
- KaTeX-backed mathematical presentation where appropriate

Implementation requirements:
- Learning paths should reference actual platform tools, not placeholder descriptions.
- Explainability content should be attached to indicators and methods contextually.
- Design the module so it can support both self-guided learning and instructor-led teaching.

### UI Deliverables
- A learning path browser showing all eight paths with visual progress indicators (progress bars or step markers).
- A path detail view with prerequisite dependency map, module list, and estimated effort per module.
- Methodology explainer cards accessible contextually (e.g., info icon or tooltip) from within analytical tools.
- KaTeX-rendered formulas displayed correctly in explainer content.
- An instructor dashboard view showing student progress and completion metrics (if applicable).
- The education module must be a top-level navigation destination in the application.

### Acceptance Criteria
- Multiple learning paths are navigable and stateful.
- Methodology explainers are tied to real analytical modules.
- The experience is credible for coursework, not just product marketing.
- Learning paths are fully navigable from the UI with working progress tracking.
- Methodology explainers display correct formulas, assumptions, and limitations in a readable, formatted layout.

---

## Prompt 30 — Pre-Loaded Teaching Dataset Library

### Objective
Provide curated city datasets that support instruction, demonstration, benchmarking, and rapid onboarding.

### Prompt
Implement `DatasetLibrary` support for the six cities named in the plan:
- New York City
- London
- Barcelona
- Istanbul
- Singapore
- Melbourne

Implementation requirements:
- Include metadata for source, license, update date, spatial extent, schema summary, and thematic coverage.
- Validate CRS and schema consistency at import time.
- Ensure the UI makes the datasets discoverable and intelligible.
- Design the dataset packaging approach so more cities can be added later without redesign.

### UI Deliverables
- A dataset library browser with visual cards for each city showing metadata summary, spatial extent thumbnail, and thematic tags.
- One-click "Load Dataset" buttons that import the dataset and configure the workspace automatically.
- A metadata inspection panel per dataset showing source, license, update date, CRS, schema, and thematic coverage.
- Search and filter controls within the dataset browser (by city, by theme, by data type).
- The dataset library must be accessible from the data import section and from the education module.

### Acceptance Criteria
- All six teaching datasets are represented in the library.
- Metadata is complete and usable.
- The import pathway is stable and quality-controlled.
- The dataset browser is fully rendered with working cards, filters, and one-click loading.
- Users can discover, inspect, and load teaching datasets entirely from the UI.

---

## Prompt 31 — Interactive Exercise Framework and Auto-Grading

### Objective
Operationalize hands-on learning through structured exercises, rubrics, and feedback.

### Prompt
Implement the exercise system under the education domain.

Required exercise categories:
- Calculator exercise
- Flow exercise
- Interpretation exercise
- Comparison exercise
- Critical thinking exercise
- Data ethics exercise

Implementation requirements:
- Support rubric-based assessment.
- Add tolerance-aware auto-grading where numerically appropriate.
- Support hints and targeted feedback without simply revealing answers.
- Seed the system with at least ten realistic exemplar exercises.

### UI Deliverables
- An exercise player panel with exercise description, instructions, input area, and submit button.
- Rubric display showing scoring criteria before submission and detailed score breakdown after submission.
- Inline feedback with hints (without revealing answers) and targeted guidance messages.
- A completion dashboard showing exercise history, scores, and progress across categories.
- At least ten exercises navigable from the education module with category filtering.
- The exercise system must be reachable from the Education section and linked to relevant learning paths.

### Acceptance Criteria
- Exercises can be assigned, completed, and evaluated.
- Rubric outputs are inspectable.
- The framework can support planning pedagogy rather than generic quiz mechanics.
- The exercise player is fully interactive with working submission, grading, feedback, and hint display.
- Users can browse, attempt, and review exercises entirely from the UI.

---

# Phase 5 — Collaboration, Scale, Quality Assurance, and Production Hardening

## Prompt 32 — Real-Time Collaboration with CRDTs

### Objective
Introduce multi-user analytical collaboration suitable for shared research, classroom work, and planning team review.

### Prompt
Implement CRDT-based collaboration using a suitable architecture such as Yjs.

Required capabilities:
- Shared project editing
- Presence indicators
- Comment or annotation support
- Offline merge compatibility

Implementation requirements:
- Scope the first collaboration layer to project state, dashboards, and notes before expanding to all analytical engines.
- Preserve deterministic project persistence where possible.
- Add tests for reconnect and merge behavior.

### UI Deliverables
- Presence avatars or indicators showing connected collaborators in the top bar or project header.
- Real-time cursor or selection indicators in shared editing contexts (dashboard, notes, project state).
- A comments/annotations sidebar with resolve, reply, and thread capabilities.
- A connection status indicator showing online/offline/reconnecting state in the status bar.
- A collaborator list panel showing who is active in the shared session.
- Collaboration features must be visually integrated into existing project and dashboard views.

### Acceptance Criteria
- Two clients can collaborate on the same project without state corruption.
- Offline edits reconcile cleanly.
- Presence and shared state changes are observable in the UI.
- Presence indicators, comment threads, and connection status are all rendered and functional in the UI.
- A user can see who else is active and what they are working on without external tools.

---

## Prompt 33 — WASM Spatial Indexing

### Objective
Substantially improve performance of large-scale spatial queries.

### Prompt
Implement `src/engine/wasm/SpatialIndexWASM.ts` backed by a Rust-to-WASM or equivalent performant spatial indexing implementation.

Required capabilities:
- R-tree or kd-tree style indexing
- Query support for bounding box and nearest-neighbor style operations
- JavaScript bridge layer
- Pure JavaScript fallback

Implementation requirements:
- Add benchmarks against the JavaScript baseline.
- Keep the consumer API stable regardless of backend.
- Document build and packaging constraints for the WASM asset.

### UI Deliverables
- A performance status indicator (e.g., in the status bar or settings panel) showing whether the WASM backend is active or JavaScript fallback is in use.
- Query response time displayed in relevant spatial analysis panels where WASM acceleration applies.
- A settings toggle under Performance or Advanced settings allowing users to enable or disable the WASM backend.

### Acceptance Criteria
- The WASM backend provides meaningful speed improvements on large datasets.
- Fallback behavior preserves correctness.
- Integration is clean enough to support later geometry and raster WASM work.
- Users can confirm whether WASM acceleration is active through a visible indicator in the UI.
- The settings toggle works correctly and switching between backends does not corrupt analysis state.

---

## Prompt 34 — Arrow and GeoParquet I/O Pipeline

### Objective
Modernize large dataset ingestion and exchange for scale, memory efficiency, and worker-friendly processing.

### Prompt
Implement columnar I/O support for Apache Arrow and GeoParquet.

Required capabilities:
- Arrow ingestion and worker transfer
- GeoParquet import and export
- Backward-compatible coexistence with existing JSON-based pathways

Implementation requirements:
- Keep spatial metadata intact.
- Avoid brittle one-off adapters.
- Add performance and fidelity tests using large fixture datasets.

### UI Deliverables
- GeoParquet and Arrow file types selectable from the data import dialog alongside existing formats.
- A format selection dropdown in export interfaces offering GeoParquet alongside existing formats (GeoJSON, CSV, etc.).
- An import progress indicator with row count and estimated memory usage.
- A schema preview panel shown before committing a large import, allowing users to inspect columns and types.
- Format-specific status or badges in the data catalog showing which datasets use columnar formats.

### Acceptance Criteria
- Large datasets load more efficiently than equivalent JSON pathways.
- Spatial and attribute fidelity is preserved.
- The new I/O layer integrates with catalog, ETL, and analytics modules.
- Users can import and export GeoParquet files entirely through the data import/export UI.
- The schema preview and progress indicators are functional and informative.

---

## Prompt 35 — Web Worker Pool and Job Orchestration

### Objective
Reduce main-thread blocking and create a reusable execution substrate for heavy analytical workloads.

### Prompt
Implement a shared worker pool under `src/workers/pool/`.

Required capabilities:
- Configurable worker count
- Job queueing
- Cancellation
- Progress reporting
- Reusable dispatch contracts for spatial statistics, clustering, simulation, and raster tasks

Implementation requirements:
- Avoid bespoke worker logic duplicated across modules.
- Add tests or harnesses for cancellation and cleanup behavior.
- Expose enough state to drive progress UI later.

### UI Deliverables
- A background task panel (or status bar section) showing active jobs, queue depth, and per-job progress percentage.
- Cancel buttons on long-running tasks visible in the task panel.
- A toast or notification when background jobs complete or fail, with a link to view results.
- If multiple jobs are queued, display a queue list with status indicators per job.
- The task panel must be accessible from the status bar or a dedicated toolbar button.

### Acceptance Criteria
- Heavy analytical tasks can be dispatched off the main thread.
- Cancellation works cleanly.
- The worker pool becomes shared infrastructure rather than a one-off optimization.
- Users can monitor, cancel, and be notified of background task progress entirely through the UI.
- The main UI thread remains responsive while heavy tasks execute in the background.

---

## Prompt 36 — Implementation of the 53 Additional Indicators

### Objective
Expand the platform from a strong initial indicator set into a far broader urban intelligence environment aligned with the strategic plan.

### Prompt
Implement all additional indicator groups specified in Section 11 of the strengthening plan:
- Transport and Mobility
- Energy and Climate
- Urban Form and Landscape Ecology
- Social Infrastructure and Liveability
- Water and Infrastructure
- Governance and Innovation
- Heritage and Culture
- Pandemic Resilience

Implementation requirements:
- Group indicators by coherent modules.
- For every indicator, define input schema, output schema, formula or method summary, unit, classification or interpretation guidance, and methodological reference.
- Ensure indicators can be surfaced in dashboards, reporting, and learning paths.
- Add no fewer than three tests per indicator where computation is non-trivial.

### UI Deliverables
- An indicator catalog browser organized by thematic group (Transport & Mobility, Energy & Climate, Urban Form & Landscape Ecology, Social Infrastructure & Liveability, Water & Infrastructure, Governance & Innovation, Heritage & Culture, Pandemic Resilience).
- Indicator detail cards showing formula, unit, classification, interpretation guidance, and methodological reference.
- Every indicator computable from a relevant flow step, calculator, or dashboard widget.
- Indicators surfaceable in report generation, dashboard widgets, and learning path contexts.
- Search, filter, and browse functionality in the indicator catalog.
- The indicator catalog must be accessible from the Tools section and linked from relevant analytical flows.

### Acceptance Criteria
- All 53 indicators are callable and documented.
- Each indicator has a stable contract and test coverage.
- Indicator outputs are not isolated utilities; they integrate with the platform.
- All indicators are browsable from the indicator catalog UI with working detail cards.
- Users can compute, inspect, and export any indicator from the UI without writing code.

---

## Prompt 37 — Comprehensive Vitest Unit Test Matrix

### Objective
Create a serious analytical quality assurance layer for the expanding platform.

### Prompt
Expand the unit test architecture to cover the analytical engine comprehensively.

Implementation requirements:
- Cover all calculators and newly added indicators.
- Add edge-case testing for missing values, geometry pathologies, extreme values, and invalid parameters.
- Produce coverage reporting and define minimum thresholds for critical analytical modules.
- Keep fixtures organized by domain rather than ad hoc scattering.

### UI Deliverables
- Test coverage results must be accessible through a developer diagnostics panel or CI build output dashboard.
- Any analytical module that gains new test coverage must have its existing UI surface verified as still functional after test refactoring.
- No user-facing UI regression is acceptable as a side-effect of test matrix expansion.

### Acceptance Criteria
- Core analytical modules have strong automated coverage.
- Edge cases are explicitly tested.
- Coverage reporting can support CI enforcement.
- All UI surfaces associated with tested modules remain operational after test infrastructure changes.

---

## Prompt 38 — End-to-End Flow Coverage with Playwright

### Objective
Protect the platform's user journeys as the number of flows, dashboards, and exports increases.

### Prompt
Implement Playwright-based end-to-end coverage for the platform's major analytical journeys.

Required flows include at minimum:
- Site Suitability
- Accessibility
- Vulnerability
- Composite Indicator Builder
- Scenario Comparison
- Equity Audit
- Change Detection
- Run Review

Implementation requirements:
- Use deterministic fixtures and stable waits.
- Cover flow completion, result generation, and export where feasible.
- Reduce flakiness proactively.

### UI Deliverables
- All flows covered by E2E tests must be fully navigable and functional in the running application as a precondition for test passage.
- Any flow that fails E2E testing due to incomplete UI wiring must be flagged and fixed as part of this prompt — not deferred.
- E2E tests must exercise real UI controls (buttons, dropdowns, inputs) — not bypass the UI layer.

### Acceptance Criteria
- Core user journeys are protected by automated E2E tests.
- Test runs are repeatable in CI.
- Failures point to meaningful regressions rather than timing noise.
- All tested flows are confirmed fully operational in the UI as a result of E2E verification.

---

## Prompt 39 — Accessibility Audit and WCAG Hardening

### Objective
Ensure the platform's analytical sophistication is matched by inclusive and accessible interaction design.

### Prompt
Run and remediate an accessibility audit using tools such as axe-core across the platform's critical screens.

Implementation requirements:
- Audit color contrast, keyboard navigation, focus order, semantic roles, labels, and interactive discoverability.
- Prioritize fixes by severity.
- Record any remaining issues in a structured backlog.

### UI Deliverables
- All accessibility fixes must be visually verifiable: corrected contrast, visible focus rings, semantic labels, and keyboard navigation paths must be operational in the running application.
- Screen reader compatibility must be tested on at least the five most-used analytical flows.
- No accessibility fix may break existing visual design or functionality.

### Acceptance Criteria
- Critical accessibility issues are resolved.
- Remaining non-critical issues are documented with owners and follow-up intent.
- The platform moves materially closer to WCAG 2.1 AA compliance.
- All accessibility improvements are verifiable through visual inspection and keyboard-only navigation testing.

---

## Prompt 40 — Shell Focus Visibility and Legacy Visual Layer Accessibility Hardening

### Objective
Close the highest-priority accessibility backlog items left open after the Prompt 39 audit by hardening shell-level focus visibility and legacy visual-layer focus treatment.

### Prompt
Implement the P2 backlog items recorded in `docs/implementation/accessibility-backlog.md`.

Required work:
- Replace terminal shell selector focus suppression with explicit, tokenized `:focus-visible` behavior that remains visible across supported browsers and high-contrast modes.
- Narrow legacy `.neural-glass-card-final` reset behavior so it no longer wipes out focus indicators on reused shell surfaces.
- Add targeted accessibility regression coverage for the shell surfaces affected by these changes.

Implementation requirements:
- Preserve the existing Charcoal-Amber visual language while restoring visible, keyboard-discernible focus treatment.
- Validate focus behavior using keyboard-only navigation and at least one automated accessibility regression covering the affected shell surfaces.
- Do not regress Prompt 39 flow-level accessibility fixes or broader application styling.
- Update the structured backlog with closure status or any residual follow-up that remains after implementation.

### UI Deliverables
- Terminal and adjacent shell controls show visible focus treatment when reached by keyboard.
- Legacy surfaces that still use `.neural-glass-card-final` retain their intended aesthetic without suppressing focus rings or equivalent focus-visible affordances.
- Accessibility verification for the shell surfaces is visually confirmable in the running application and backed by regression automation.

### Acceptance Criteria
- The two P2 accessibility backlog items are resolved or reduced to explicitly documented residual risk.
- Keyboard users can reliably identify focus location on the affected shell surfaces.
- Visual design remains consistent with the platform's existing shell styling.
- Automated regression coverage exists for the remediated shell-level accessibility behaviors.

---

## Prompt 41 — Bundle Budgets and Performance Governance

### Objective
Introduce measurable performance discipline so the platform remains usable as its scope expands.

### Prompt
Implement bundle budget and performance gate infrastructure.

Required targets from the strategic direction:
- Initial load budget under 2 MB where feasible
- Lazy chunk budget under 500 KB where feasible

Implementation requirements:
- Add budget checks to CI.
- Analyze heavy dependencies and split or isolate them where justified.
- Produce a written performance report in `docs/implementation/performance-report.md`.

### UI Deliverables
- Lazy loading and code splitting must not introduce blank screens, missing panels, or non-functional routes. All UI surfaces must remain fully operational after optimization.
- Route-based code splitting must be verified by navigating every major section and confirming content loads without error.
- Loading skeletons or spinners must be shown during lazy chunk loading — no blank flashes.

### Acceptance Criteria
- Performance budgets are enforced automatically.
- The repository contains a current performance assessment.
- Large analytical features are integrated without uncontrolled bundle growth.
- No UI surface regresses to a blank or broken state as a result of bundle optimization.

---

## Prompt 42 — Technical Debt Closure Program

### Objective
Resolve the technical debt explicitly named in the strengthening plan so the platform does not carry research-grade ambition on top of fragile foundations.

### Prompt
Execute a focused technical debt closure pass that addresses the items listed in Section 14 of the strengthening plan.

Required areas:
- Replace GeoAI scaffolding with real implementations and stable exports
- Replace empty streaming and WASM stubs with functional infrastructure
- Seed right-panel analytical content where the UX currently lacks substantive material
- Expand the RAG corpus with academically relevant sources
- Improve agent autonomy infrastructure in a controlled, safe way
- Resolve legacy compatibility burdens through migration utilities and deprecation strategy
- Strengthen documentation coverage

Implementation requirements:
- Track each debt item with a closure note.
- Avoid hidden breaking changes.
- Where a debt item cannot be fully closed in one pass, leave a documented residual plan rather than silent partial work.

### UI Deliverables
- All replaced stubs must have functional UI counterparts. No previously visible UI element may regress to a placeholder or empty state as a result of debt closure.
- Right-panel analytical content must be populated with real, substantive material — not placeholder text.
- Any GeoAI scaffolding replaced with real implementations must have corresponding UI entry points that work end-to-end.
- Streaming and WASM replacements must have visible status indicators confirming their operational state.

### Acceptance Criteria
- The technical debt list has clear closure status or explicit residual rationale.
- Empty stubs are no longer masquerading as capabilities.
- The codebase is materially more coherent and maintainable.
- No UI surface has regressed from a functional state to a placeholder or stub as a result of debt closure.
- All replaced components have working, professional UI surfaces.

---

## Prompt 43 — Final Integration Hardening and Release Candidate

### Objective
Prepare a release candidate that is architecturally coherent, analytically defensible, and operationally verifiable.

### Prompt
Perform final hardening for a release candidate aligned with the full strengthening program.

Required work:
- Run integration smoke testing across major analytical engines and flows.
- Expand or finalize repository documentation, including README updates, API documentation, and architecture decision records.
- Ensure the final validation stack covers type safety, build integrity, unit tests, end-to-end tests, accessibility, and bundle budgets.
- Prepare a release-oriented change summary in `CHANGELOG.md` grouped by phase.
- Produce a known-risks and known-limitations note suitable for internal review.

### UI Deliverables
- A complete walkthrough of all major UI surfaces must confirm operational status. No feature introduced in Prompts 15–42 may ship as UI-invisible or console-only.
- The release candidate must pass a visual completeness checklist covering all flows, dashboards, panels, tools, and navigation paths introduced throughout the program.
- Any feature that cannot be verified visually must be explicitly flagged in the known-risks document.
- The final integration must include a navigable feature index or capabilities overview accessible from within the application.

### Acceptance Criteria
- The repository can be evaluated as a coherent release candidate.
- Major capabilities are documented and test-backed.
- Remaining risks are explicit rather than hidden.
- Every feature implemented in Prompts 15–42 has a verified, functional UI surface in the release candidate.
- The visual completeness checklist is documented and all items pass or have explicit exception rationale.

---

