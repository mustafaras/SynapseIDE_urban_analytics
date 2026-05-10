# Changelog

## Release Candidate — April 23, 2026

### Phase 1 — Analytical Core and Platform Foundations (Prompts 15–22)

- Established the urban analytics workbench structure inside the preserved IDE shell.
- Added deterministic indicator calculators, spatial-statistics engines, network analysis, and map-layer orchestration.
- Introduced structured reporting, dataset connectors, and the initial workflow framework for urban analysis.

### Phase 2 — Domain Expansion and Operator Workflows (Prompts 23–30)

- Expanded guided analytical flows covering site suitability, accessibility, vulnerability, equity, change detection, scenario comparison, and review workflows.
- Added education-facing workspaces, teaching datasets, methodology explainers, and the dashboard builder.
- Strengthened map IO, 3D and VoxCity surfaces, and reporting/export paths needed for real planning workflows.

### Phase 3 — Reliability, Performance, and Quality Hardening (Prompts 31–37)

- Added broader test coverage, analytical QA reporting, and regression protection for critical engines and flows.
- Improved lazy-loading boundaries, performance budgeting, and accessibility remediation across major workbench surfaces.
- Expanded indicator catalog coverage and made more analytical capabilities discoverable from within the application.

### Phase 4 — Final Integration and Release Hardening (Prompts 38–43)

- Added end-to-end analytical smoke journeys, explicit accessibility audits, and a release-candidate UI smoke suite.
- Closed technical debt around GeoAI hooks, streaming infrastructure, WASM worker execution, right-panel content seeding, RAG corpus breadth, and persistence migration reporting.
- Added the in-app `Capabilities Overview` as the navigable release index for tabs, workflows, runtime labs, and verification walkthroughs.
- Finalized release-facing documentation: public API notes, architecture decision records, visual completeness checklist, known risks, and the release validation record.
- Split Playwright CI into smoke, accessibility, and remaining functional suites, and added `npm run validate:rc` as the explicit local release gate.
