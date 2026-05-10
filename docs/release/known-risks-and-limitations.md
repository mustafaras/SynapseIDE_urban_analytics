# Known Risks and Limitations

Date: April 24, 2026  
Audience: Internal release review  
Status: Current release note

## Visibility vs Execution Depth

Release visibility and execution depth are not interchangeable.

- `launch verified` means a surface opens and renders expected UI during automated validation.
- `execution verified` means a representative user journey completed in automation.
- `demo-mode verified` means execution succeeded only on an explicit demo/synthetic path.
- `external dependency gated` means the success path depends on credentials, provider availability, or live endpoints.

Implementation status is tracked separately from verification depth through the following vocabulary:

- `implemented`
- `implemented with demo mode`
- `implemented with residual gap`
- `environment-dependent`
- `deferred`

## Operational Risks

| Risk | Impact | Current mitigation | Residual note |
|---|---|---|---|
| Live AI providers require valid credentials and upstream availability. | Provider-backed chat, inference, and external model routing can be unavailable in local or CI environments. | Provider configuration is optional and the workbench remains locally operable without live credentials. | Live upstream responses are intentionally documented as environment-dependent rather than assumed available. |
| WebSocket and MQTT streaming depend on reachable live endpoints. | Live streaming modes may fail despite the runtime surface being correct. | Deterministic replay mode is built into the Streaming Runtime and is the guaranteed release-verification path. | Live-feed verification remains conditional on broker and network health. |
| Map-provider features depend on external map credentials. | Google Maps and some commercial basemap capabilities may not render in a bare local environment. | The workbench retains browser-local analytical surfaces and non-provider-specific map capabilities. | External provider failures should not be mistaken for app-shell regression. |
| Browser memory and CPU ceilings still bound large analytical runs. | Very large datasets or long-running simulations may degrade responsiveness on weaker hardware. | Lazy loading, workers, bundle budgets, and browser-side runtime status surfaces are in place. | The platform is a browser-first analytical environment, not an unbounded server compute cluster. |
| Several analytical lazy chunks require approved exception budgets. | VoxCity, Sunlight, RightPanel, and GeoAI Lab carry large but isolated lazy payloads because they bundle 3D, seed-derived support, or GeoAI runtime surfaces. | `npm run perf:budgets` passes with explicit exception ceilings and keeps these chunks visible in the budget report. | Future chunk splitting should reduce these exceptions, but the current release budget gate is green. |

## Analytical Limitations

| Limitation | Why it exists | Release interpretation |
|---|---|---|
| Map Explorer external services remain provider-dependent. | WMS, WFS, XYZ, OSM, reverse geocoding, and external basemaps can be blocked by credentials, CORS, rate limits, network failures, or provider downtime. | Treat these as `environment-dependent`; local map state, import/export, and analytical panels remain independently testable. |
| Map Explorer large-data performance is browser bounded. | Large GeoJSON, Arrow, GeoParquet, temporal frames, CA outputs, detection boxes, and heatmaps execute in a browser-first runtime even when workers are used. | Treat large workloads as `implemented with residual gap`; progress, memory estimates, workers, and lazy loading mitigate but do not remove client hardware ceilings. |
| Map Explorer CRS defaults are truthful fallbacks, not authoritative reprojection. | Some local/imported sources omit projection metadata. The UI labels missing CRS and may show `EPSG:4326` where no better metadata is available. | Users must confirm CRS before publication or statutory decisions; missing projection metadata remains a visible QA caveat. |
| Map Explorer NL query execution is intentionally scoped. | NL-to-SQL runs only against visible queryable layers and imported/worker-backed tables. Remote catalogs and non-queryable layers are not silently substituted. | Treat as `implemented with residual gap`; scope is truthful and auditable rather than pretending full federation. |
| GeoAI land cover still relies on a demo-hosted model package even when the raster source is real. | The classifier pipeline now executes against explicit EO/imported raster sources, but the browser-safe model artifact is still shipped through the demo runtime/model path and real-source runs do not have reference labels for accuracy scoring. | Treat the current validation state as `implemented with residual gap`, not as full production-grade remote-sensing validation parity. |
| NL-to-SQL still depends on queryable project-context data rather than arbitrary remote catalogs. | Deterministic SQL generation and safety logic are implemented, and the GeoAI Lab UI executes accepted queries through SpatialDB across live project overlays and imported worker-backed spatial tables. Remote sources still need to be imported or published into the project context before they become queryable tables, and non-queryable layers are not silently substituted with demo data. | Treat the current validation state as `implemented with residual gap`: live project/imported queryable tables work, but automatic federation across every dataset surface is not implemented. |
| Real object detection still depends on a configured browser-loadable model source. | The workflow now supports a real GeoAI runtime path, but the repository does not hard-ship detector weights; real execution requires `VITE_GEOAI_OBJECT_DETECTION_MODEL_URL` or an equivalent runtime override. | Treat the current validation state as `implemented` with explicit environment/configuration requirements for the real model path; Demo mode remains the truthful local fallback when the model source is unavailable. |
| VoxCity extrusion and solar workflows retain explicit sample mode. | The 3D tools now prioritize real project geometry when Map Explorer layers, imported layers, CityJSON-derived volumes, or Building Viewer handoffs are available. Sample mode remains as a visible quick-start/demo path rather than a silent runtime default. | Treat them as `implemented with demo mode`: real project geometry is prioritized when available, and sample runs remain explicit. |
| Map Explorer publication chunk is still large. | The full map workspace includes MapLibre, import/export, QA, workflow, report, temporal, and analytical panels behind one lazy modal boundary. | Current `npm run build` passes and the chunk is isolated, but future chunk splitting should continue. |
| Built-in RAG corpus is curated rather than exhaustive. | Prompt 42 expanded the baseline corpus with academically relevant official sources, but not a complete planning literature index. | The system is materially better grounded, but literature completeness still depends on future corpus expansion. |
| Some planning models are exploratory rather than policy-grade forecasting systems. | Many flows intentionally prioritize interpretability and reproducibility for urban analysis workflows. | Outputs support analytical review and scenario exploration; they do not replace field validation or statutory decision processes. |

## Governance and Documentation Risks

| Risk | Current state | Planned action |
|---|---|---|
| Historical completion notes can overstate current surface depth. | Remediation Prompt 02 added `docs/implementation/prompt-status-ledger.md` and rebuilt the module matrix as the current-state source of truth. | When current truth changes, update the ledger, module matrix, completion note, and release docs together. |

## Visual Verification Exceptions

These items are explicitly flagged because they cannot be fully guaranteed through a credential-free local walkthrough:

- Live upstream AI responses from external providers.
- Live WebSocket and MQTT feeds beyond the deterministic replay connector.
- Provider-gated map integrations that require external API keys.
- Provider-gated Map Explorer services and external basemaps beyond local/imported data paths.

These are not hidden risks. They are visible operational dependencies and are intentionally separated from the locally verifiable release surface.
