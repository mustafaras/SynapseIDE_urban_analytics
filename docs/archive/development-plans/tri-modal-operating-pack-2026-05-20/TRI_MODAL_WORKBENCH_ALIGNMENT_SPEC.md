# Tri-Modal Workbench Alignment Specification
## Canonical Sync, Wire, Premium UX, and Evidence Standard for Synapse IDE, Map Explorer, and Urban Analytics

> Document type: Canonical cross-plan alignment specification  
> Scope: Synapse IDE, Map Explorer, Urban Analytics Modal, and their shared evidence/report/dashboard/education bridge  
> Status: Planning standard for future implementation prompts  
> Date: 2026-05-02  
> Companion plans:
> - `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md`
> - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
> - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`

---

## 0. Purpose

This document is the single alignment standard for the three major workbench surfaces:

1. Synapse IDE
2. Map Explorer
3. Urban Analytics Modal

The three module plans are intentionally detailed. This file exists to make them act like one product. It defines the shared operating model, synchronized workflow, wire/layout rules, premium UI grammar, state ownership boundaries, artifact contracts, QA propagation rules, and future prompt-readiness requirements.

This document does not implement code. It also does not generate the future sequential prompts. It prepares the standard that those prompts must follow later.

## 1. Authority

When a future implementation decision affects more than one surface, this file is authoritative.

Priority order:

1. Safety, truthfulness, data integrity, and non-destructive behavior.
2. This tri-modal alignment specification.
3. The module-specific development plan.
4. Existing implementation docs and release checklists.
5. Local component preference.

If a module-specific plan conflicts with this spec, update the module plan or explicitly document why the exception exists.

## 2. Product Thesis

Synapse Workbench should become a premium scientific environment for urban analytics where code, spatial evidence, and scientific reasoning operate as one synchronized system.

The user should be able to move through this loop without losing context:

```text
Question -> Context -> Data -> QA -> Method -> Run -> Evidence -> Code -> Map -> Report -> Dashboard -> Review
```

The three surfaces express different parts of the same loop:

- Synapse IDE is where code, manifests, notebooks, scripts, SQL, AI plans, file artifacts, and reproducible editing live.
- Map Explorer is where spatial state, layers, AOI, selections, QA, temporal frames, map workflows, and publication maps live.
- Urban Analytics is where methods, indicators, assumptions, validity envelopes, data fitness, interpretation, and evidence reasoning live.

The product should feel like one professional scientific cockpit, not three loosely connected modals.

---

## 3. Module Roles and Ownership

### 3.1 Ownership Table

| Surface | Product role | Owns | Publishes | Consumes |
|---|---|---|---|---|
| Synapse IDE | Coder and artifact authoring surface | files, tabs, editor state, terminal state, AI plans, apply/revert history, generated code artifacts | IDE artifact refs, manifests, code outputs, file metadata, execution notes | map context, urban method context, report/dashboard artifact refs |
| Map Explorer | Spatial operating surface | viewport, base layer, overlays, AOI, selections, drawing, measurement, temporal player, QA, map review session, publication exports | map context, layer evidence, QA summaries, workflow outputs, map report handoffs, map manifests | urban method requirements, IDE generated data refs, report/dashboard destination intents |
| Urban Analytics | Scientific reasoning surface | method cards, indicators, data fitness, validity envelopes, evidence tray, workflow interpretation, report/dashboard/education bindings | urban evidence, method context, data fitness, indicator outputs, report/dashboard bindings, education focus | map context, map QA, IDE code artifacts, report/dashboard state summaries |
| Reporting | Narrative and citation surface | report documents, report sections, citations, report export state | compiled reports, report insert ids, citation refs | map/urban/IDE evidence artifacts |
| Dashboard | Monitoring and visualization surface | dashboard widgets, scenario views, chart bindings, dashboard exports | dashboard binding ids and dashboard state | map/urban/IDE evidence artifacts |
| Education | Method learning surface | explainers, learning paths, exercises, teaching datasets | explainer focus and learning progress | urban method context, map dataset context |

### 3.2 Non-Negotiable Ownership Rules

- IDE must not own map state.
- Map Explorer must not own methodology interpretation.
- Urban Analytics must not own editor state or map rendering.
- Reporting must not become an evidence registry.
- Dashboard must not become the computational source of truth.
- Education must not modify analysis outputs directly.

Cross-module work must use typed summaries, artifact ids, manifests, and events.

### 3.3 Source-of-Truth Matrix

| Data or state | Source of truth |
|---|---|
| active editor tab and file content | Synapse IDE stores |
| generated code artifact | Synapse IDE artifact registry or bridge |
| viewport and map camera | Map Explorer store |
| active AOI | Map Explorer store |
| visible layers and layer metadata | Map Explorer store |
| spatial QA | Map Explorer QA service/store summary |
| selected urban method | Urban Analytics store/context |
| indicator formula and interpretation | Urban Analytics indicator catalog |
| data fitness | Urban Analytics context, using map summaries as inputs |
| report document | reporting service/store |
| dashboard layout and widget binding | dashboard module |
| learning path/explainer | education module |

---

## 4. Unified Evidence Lifecycle

### 4.1 Canonical Lifecycle

Every premium workflow should follow the same lifecycle:

```text
Intent
  -> Context
  -> Data
  -> Quality Gate
  -> Method
  -> Execution
  -> Evidence Artifact
  -> Reproducibility Artifact
  -> Publication or Review
```

### 4.2 Lifecycle Responsibilities

Intent:

- Usually starts in Urban Analytics or IDE.
- May start in Map Explorer when the analyst begins with a layer or AOI.

Context:

- Spatial context comes from Map Explorer.
- Code/file context comes from IDE.
- Scientific/method context comes from Urban Analytics.

Data:

- Map Explorer owns visible spatial data and imported layer summaries.
- IDE owns source files and generated outputs.
- Urban Analytics owns method-specific data requirements and data fitness.

Quality Gate:

- Map Explorer evaluates spatial QA.
- Urban Analytics evaluates method validity and data fitness.
- IDE evaluates code safety, reversibility, file-risk, and apply-plan risk.

Method:

- Urban Analytics defines method assumptions and interpretation.
- Map Explorer defines spatial workflow mechanics.
- IDE defines executable/reproducible code artifacts.

Execution:

- Flow runtime and services execute or simulate analytical operations.
- IDE may execute or prepare code.
- Map Explorer may publish derived layers.

Evidence Artifact:

- Every meaningful output should become a typed artifact.

Reproducibility Artifact:

- Scripts, manifests, parameters, source layer refs, QA summaries, timestamps, and versions.

Publication or Review:

- Report insert, dashboard binding, map export, education handoff, or review timeline event.

---

## 5. Shared Wire and Layout System

### 5.1 Canonical Workbench Wire

All three module surfaces must follow this layout grammar:

```text
Top band
  global or module command state, sync chips, active context, primary actions

Left rail
  navigation, asset list, layer list, file tree, method library, filters

Primary work surface
  editor, map canvas, workflow/method workspace

Right rail
  contextual inspection, dossier, AI bridge, QA, report, review, references

Bottom band
  terminal, timeline, status, problems, output, coordinates, evidence tray
```

### 5.2 Surface-Specific Wire

Synapse IDE:

```text
Top: header, tabs, run/build/sync status
Left: activity rail, file explorer, global search, future git-like slots
Center: Monaco editor, diff/editor groups, preview surfaces
Right: AI assistant, map bridge pane, urban bridge pane, artifact metadata
Bottom: terminal, tasks, problems, output, plan history
```

Map Explorer:

```text
Top: map cockpit, map mode, sync, QA, save/readiness status
Left: layer/evidence rail, imports, cartography, source metadata
Center: map canvas and direct spatial interaction
Right: QA, workflow drawer, report handoff, NL query, review timeline
Bottom: coordinates, scale, CRS, temporal player, active tool, memory/worker state
```

Urban Analytics:

```text
Top: research context, search, study area, sync, QA, evidence count
Left: method/indicator/library rail with scientific filters and readiness badges
Center: analytical workflow and current research task
Right: scientific dossier: methodology, data, code, references
Bottom/Tray: evidence timeline, report/dashboard/IDE/map actions
```

### 5.3 Layout Equivalence Rules

- Top bands must summarize current context, not advertise features.
- Left rails list assets or methods; they do not host long narrative explanations.
- Primary surfaces are always the most visually dominant region.
- Right rails explain or inspect the active object.
- Bottom bands are operational status/output surfaces.
- Rails and bottom bands should be compact, scannable, and keyboard reachable.
- Constrained layouts collapse secondary rails into drawers while preserving the primary surface.

### 5.4 Wire Consistency Checklist

Before implementing a UI change in any plan:

- Does it preserve the primary surface?
- Does it fit the same top/left/center/right/bottom grammar?
- Does it have an equivalent sync/status affordance as the other modules?
- Does it avoid decorative panels that do not perform work?
- Does it work in constrained layouts?
- Does it expose focus and keyboard behavior?

---

## 6. Premium Visual and Interaction Language

### 6.1 Premium Definition

Premium means:

- precise;
- fast;
- compact;
- legible;
- stateful;
- honest about limitations;
- consistent across modules;
- built for repeated expert use.

Premium does not mean:

- oversized hero content;
- decorative gradients or filler;
- vague marketing copy;
- hidden disabled states;
- single-purpose cards that do not map to a real action;
- card-in-card layouts inside dense work surfaces;
- visual polish without evidence integrity.

### 6.2 Shared Component Grammar

Buttons:

- icon-first where an icon is clear;
- label or tooltip required;
- disabled reason required;
- destructive/high-impact actions require clear confirmation or preview.

Chips:

- used for status, QA, sync, provenance, readiness, demo/sample state;
- concise text;
- do not rely only on color.

Rows:

- stable row height;
- clear leading icon;
- title;
- metadata strip;
- status chips;
- action menu.

Panels:

- one primary purpose per panel;
- no nested cards unless displaying repeated individual items;
- clear header, body, footer/action area when needed;
- scroll only inside panel body.

Drawers:

- used for constrained layouts or secondary workflows;
- preserve primary surface visibility when possible;
- restore focus to invoking control.

Modals:

- reserved for focused tasks;
- must have focus trap, Escape behavior, accessible label, and close affordance.

### 6.3 Shared Status Vocabulary

| Status | Meaning | Required display |
|---|---|---|
| Ready | Action can run with current context. | positive chip and available command. |
| Ready with caveats | Action can run but caveats must travel. | warning chip, caveat count, and caveat detail path. |
| Needs context | Missing AOI, layer, file, method, field, or destination. | neutral chip naming the missing prerequisite. |
| Blocked | Scientific, safety, data, or file issue prevents formal output. | error chip, exact blocker, and fix path when known. |
| Demo/sample | Output uses sample, fixture, or fallback data. | persistent sample label in every surface. |
| Unsynced | Another module has not received current state. | sync chip and explicit sync action. |
| Stale | Output exists but inputs changed. | stale chip and rerun/update action. |
| Draft | Artifact exists but not yet published. | draft chip and publish/attach action. |

### 6.4 Shared Empty-State Rules

Empty states must name the missing prerequisite.

Good examples:

- "Import or add a layer before spatial workflows can run."
- "Draw or select an AOI before this method can evaluate a study area."
- "Open or generate a manifest before the IDE can publish this output to Map Explorer."
- "Run QA before this artifact can be inserted into a formal report."

Avoid:

- "Coming soon."
- "Nothing here."
- "Unavailable."
- "No data" without naming what kind of data is missing.

### 6.5 Shared Density Rules

- Tool surfaces should be compact.
- Text inside buttons and chips must not overflow.
- Use smaller headings inside panels.
- Keep hero-scale text out of workbench interiors.
- Avoid one-note palettes.
- Keep repeated rows and grid cells dimensionally stable.

---

## 7. Synchronization Architecture

### 7.1 Integration Spine

The workbench should use typed events, stores, selectors, and artifact references.

Canonical event families:

| Family | Purpose |
|---|---|
| `ide:*` | IDE publishes or receives code/file artifacts. |
| `map:*` | Map Explorer publishes or receives spatial context and map evidence. |
| `urban:*` | Urban Analytics publishes or receives method context and scientific evidence. |
| `synapse:navigate` | shared navigation between major surfaces. |
| `reporting/*` | report insert and report state notifications. |
| `dashboard:*` | dashboard binding and dashboard state notifications. |
| `education:*` | methodology/explainer focus notifications. |

### 7.2 Event Payload Rules

Events should include:

- ids;
- summaries;
- timestamps;
- source module;
- artifact references;
- QA summaries;
- provenance;
- destination intent.

Events should not include:

- huge GeoJSON payloads;
- full data tables;
- raw binary data;
- complete editor content unless explicitly an editor command;
- duplicate module-owned state.

### 7.3 Canonical Artifact Reference

```ts
export interface SynapseWorkbenchArtifactRef {
  artifactId: string;
  artifactKind:
    | "ide-code"
    | "ide-manifest"
    | "map-layer"
    | "map-workflow"
    | "map-qa"
    | "map-export"
    | "urban-method"
    | "urban-indicator"
    | "urban-run"
    | "report-insert"
    | "dashboard-binding"
    | "education-link";
  sourceModule: "ide" | "map" | "urban" | "reporting" | "dashboard" | "education";
  sourceId?: string;
  createdAt: string;
  title: string;
  summary: string;
  provenance?: SynapseWorkbenchProvenance[];
  qa?: SynapseWorkbenchQASummary;
  relatedLayerIds?: string[];
  relatedCardIds?: string[];
  relatedFlowIds?: string[];
  relatedFilePaths?: string[];
  manifestId?: string;
  reportInsertId?: string;
  dashboardBindingId?: string;
}
```

### 7.4 Canonical Provenance Record

```ts
export interface SynapseWorkbenchProvenance {
  sourceName: string;
  sourceKind: "project" | "imported" | "external" | "derived" | "generated" | "demo";
  sourceUrl?: string;
  license?: string;
  createdAt?: string;
  updatedAt?: string;
  method?: string;
  inputIds?: string[];
  notes?: string[];
}
```

### 7.5 Canonical QA Summary

```ts
export interface SynapseWorkbenchQASummary {
  status: "unchecked" | "passed" | "warning" | "error" | "blocked";
  issueCount: number;
  blockerCount: number;
  caveats: string[];
  checkedAt?: string;
  sourceModule: "ide" | "map" | "urban";
}
```

### 7.6 Sync Handshake

Every cross-module workflow should follow this handshake:

1. requesting module publishes intent;
2. owning module returns a typed summary;
3. requesting module validates readiness;
4. user previews the cross-module action;
5. owning module creates artifact or state change;
6. artifact reference is registered;
7. report/dashboard/review state is updated if requested.

---

## 8. Cross-Module Journey Contracts

### 8.1 Urban Method to Map to IDE to Report

```text
Urban method selected
  -> Urban requests map context
  -> Map Explorer provides AOI/layers/QA/readiness
  -> Urban validates method fit
  -> Map Explorer previews workflow
  -> Map Explorer applies workflow and creates map evidence
  -> IDE opens reproducibility script and manifest
  -> Report receives structured insert with QA and provenance
```

Acceptance:

- no manual copy-paste;
- same artifact id or linked artifact refs travel across modules;
- QA caveats remain visible in every destination.

### 8.2 IDE File to Map Layer to Urban Recommendation

```text
IDE generated or edited spatial file
  -> IDE publishes artifact ref
  -> Map Explorer validates and registers layer
  -> Map Explorer creates layer evidence and QA
  -> Urban Analytics receives layer summary
  -> Urban recommends compatible methods
```

Acceptance:

- IDE does not push large payloads through events;
- Map Explorer owns layer state after registration;
- Urban Analytics interprets but does not render the map.

### 8.3 Map Layer to Urban Evidence to IDE Script

```text
Map layer selected
  -> Map Explorer publishes layer evidence
  -> Urban Analytics converts to urban evidence
  -> Urban selects method and data fitness
  -> IDE opens method-specific script and manifest
```

Acceptance:

- the method script references source layer ids and QA caveats;
- report/dashboard bindings can later attach to the same evidence.

### 8.4 QA Blocker Propagation

```text
Map QA finds blocker
  -> Map panel shows blocker
  -> Urban data fitness marks method blocked or exploratory
  -> IDE manifest includes blocker
  -> Report/dashboard publication is blocked unless exploratory override is explicit
```

Acceptance:

- the same blocker is visible by id or equivalent summary in all destinations.

### 8.5 Publication Export Path

```text
Map composition prepared
  -> publication readiness checked
  -> export manifest created
  -> file exported
  -> report/dashboard can reference export artifact
  -> IDE can open manifest
```

Acceptance:

- title, legend, scale, attribution, layers, viewport, QA, and provenance are preserved.

---

## 9. Shared Artifact Model

### 9.1 Artifact Kinds

IDE artifacts:

- code file;
- notebook;
- manifest;
- SQL query;
- markdown note;
- diff/apply plan;
- terminal or task output summary.

Map artifacts:

- layer;
- AOI;
- selection;
- workflow result;
- QA finding;
- publication export;
- report handoff;
- NL query;
- cartography review;
- temporal state;
- VoxCity handoff.

Urban artifacts:

- method card;
- indicator;
- data fitness result;
- completed run;
- scientific dossier;
- report insert;
- dashboard binding;
- education link.

### 9.2 Artifact State

Artifacts should support:

- draft;
- active;
- published;
- stale;
- blocked;
- archived.

### 9.3 Artifact Actions

Common actions:

- open source;
- focus in owner module;
- attach to report;
- bind to dashboard;
- open in IDE;
- show on map;
- add to Urban evidence tray;
- export manifest;
- rerun or refresh;
- mark reviewed.

### 9.4 Artifact Naming

Artifact filenames should be stable and readable:

```text
urban_<method_slug>_<timestamp>.manifest.json
map_<workflow_slug>_<timestamp>.manifest.json
map_qa_audit_<timestamp>.md
map_nl_query_<timestamp>.sql
urban_indicator_<indicator_slug>_<timestamp>.json
synapse_apply_plan_<timestamp>.md
```

---

## 10. Scientific QA and Truthfulness

### 10.1 QA Domains

Map QA:

- CRS;
- geometry validity;
- topology;
- precision;
- scale;
- temporal metadata;
- source lineage;
- queryability;
- worker readiness;
- publication readiness.

Urban QA:

- method assumptions;
- data requirements;
- validity envelope;
- denominator validity;
- uncertainty;
- sample size;
- ethics/policy risk;
- interpretation limits.

IDE QA:

- generated code provenance;
- file overwrite risk;
- apply-plan reversibility;
- dependency requirements;
- risky operations;
- output contract validity.

### 10.2 Truthfulness Rules

- Demo/sample state must be explicit.
- Missing metadata must not be silently replaced by confident text.
- QA caveats must travel with artifacts.
- Reports and dashboards must not hide blockers.
- Generated scripts must include limitations and input references.
- Map exports must include attribution and scale context.

### 10.3 Formal Output Gate

Formal outputs include:

- report inserts;
- dashboard bindings;
- publication exports;
- official-looking summary documents;
- non-demo presentation surfaces.

Formal outputs require:

- artifact id;
- provenance;
- QA summary;
- source context;
- caveats;
- reproducibility manifest or explanation why not available.

---

## 11. Premium UI Cross-Module Requirements

### 11.1 Shared Context Strip

Each module should eventually expose a compact context strip:

- active project/session;
- active method/layer/file;
- QA state;
- sync state;
- evidence count;
- last save/update state;
- active destination intent.

### 11.2 Shared Evidence Tray

The evidence tray can be implemented in Urban Analytics first, but all modules should produce compatible artifact references.

Tray row fields:

- icon by artifact kind;
- title;
- source module;
- timestamp;
- QA chip;
- provenance/source chip;
- linked modules;
- action menu.

### 11.3 Shared Command Language

Use consistent labels:

- Open in IDE
- Show on Map
- Send to Urban
- Add to Report
- Bind to Dashboard
- Open Method
- Export Manifest
- Review QA
- Rerun
- Mark Reviewed

Avoid per-module synonyms unless there is a real domain distinction.

### 11.4 Shared Disabled Reasons

Every disabled cross-module command should state why:

- "No active AOI."
- "No visible queryable layer."
- "QA has blockers."
- "No generated manifest."
- "No report destination available."
- "Method requires polygon geometry."
- "File is too large to open directly; create a manifest instead."

---

## 12. Persistence and Restore

### 12.1 Persistence Rules

Persist lightweight references:

- artifact ids;
- source ids;
- manifests;
- filenames;
- layer metadata summaries;
- method ids;
- report insert ids;
- dashboard binding ids.

Avoid persisting:

- large data payloads;
- full binary blobs;
- full generated screenshots;
- volatile UI-only state unless it improves restore;
- external fetched data beyond explicit cache policy.

### 12.2 Restore Rules

After reload:

- IDE can restore files/tabs and artifact metadata.
- Map Explorer can restore viewport and map project snapshot references.
- Urban Analytics can restore active method/evidence context.
- Report/dashboard can restore linked artifacts.

If a referenced artifact cannot be restored:

- show a missing reference state;
- preserve the artifact id and title;
- explain which source is missing;
- avoid silently substituting demo data.

---

## 13. Accessibility and Keyboard Alignment

Shared rules:

- all primary commands are keyboard reachable;
- focus returns to invoking element;
- Escape closes topmost local surface first;
- status chips include text labels;
- color is not the only status signal;
- drawers and dialogs have accessible names;
- command palettes expose disabled reasons;
- map keyboard controls only trigger when map canvas is focused;
- editor keyboard shortcuts must not break modal focus traps.

Minimum cross-module keyboard journey:

```text
Open Urban method
  -> request map context
  -> open Map Explorer
  -> focus layer/AOI
  -> open IDE artifact
  -> return to report insert
```

This journey should be possible without a mouse after the implementation cycle is complete.

---

## 14. Performance and Data Movement

### 14.1 Data Movement Rules

- Use references instead of large payloads.
- Keep large spatial data in Map Explorer, spatial DB, worker tables, or external files.
- Open code and manifests in IDE, not full datasets.
- Keep report/dashboard payloads structured and lightweight.
- Use lazy loading for heavyweight panels and engines.

### 14.2 Budget Targets

| Operation | Target |
|---|---:|
| Generate cross-module context summary | under 50 ms |
| Emit artifact event | under 20 ms |
| Open generated IDE manifest | under 150 ms |
| Update evidence tray after artifact creation | under 100 ms |
| Render sync/status chips | under 50 ms |

### 14.3 Chunking Rules

Heavy surfaces should remain lazy:

- Map Explorer modal and optional panels;
- Urban Analytics right panel and workflow views;
- IDE Monaco, AI panel, terminal, heavy search;
- report export/PDF tooling;
- dashboard advanced charts;
- VoxCity/3D and GeoAI modules.

---

## 15. Cross-Plan Acceptance Criteria

The aligned workbench is acceptable when:

- each plan preserves clear module ownership;
- three plans use the same evidence lifecycle;
- three plans use the same status vocabulary;
- three plans use compatible artifact references;
- map QA can appear in Urban dossier, IDE manifest, report insert, and dashboard binding;
- IDE artifacts can reference map layers and urban methods;
- Urban evidence can reference map and IDE artifacts;
- report/dashboard outputs preserve provenance and QA;
- prompt generation can happen from these plans without resolving contradictory architecture.

The aligned workbench is not acceptable if:

- a feature requires manual copy-paste between modules;
- a module imports another module's component to read private state;
- large data is passed through global events;
- demo/sample mode is hidden;
- report/dashboard outputs omit QA caveats;
- premium UI polish hides missing prerequisites;
- one module uses different terminology for the same artifact/status.

---

## 16. Drift Control

When one plan changes:

1. Check whether the change affects shared ownership, wire, status vocabulary, artifacts, events, QA, or cross-module journeys.
2. If yes, update this spec first.
3. Then update the affected module plan.
4. If the change affects all modules, update all three plans.
5. Add validation or acceptance criteria for the new contract.

Drift examples:

- New map artifact kind -> update this spec, Map plan, Urban evidence model, IDE artifact handling.
- New IDE manifest type -> update this spec, IDE plan, Map/Urban consumers if relevant.
- New Urban evidence kind -> update this spec, Urban plan, report/dashboard bindings, and any map/IDE references.
- New QA status -> update this spec and all module status vocabularies.

---

## 17. Future Prompt Readiness

Sequential prompts should be generated later. Do not generate them from this document until requested.

When the user asks for prompts, derive them in this order:

```text
Foundation sync contracts
  -> artifact reference model
  -> IDE artifact handling
  -> Map context and evidence
  -> Urban context and evidence
  -> report/dashboard bindings
  -> cross-module user journeys
  -> premium UI unification
  -> accessibility and keyboard hardening
  -> validation and release gates
```

Each future prompt must include:

- scope;
- files to inspect;
- files to edit;
- state ownership rule;
- UI/wire acceptance;
- sync contract acceptance;
- QA/provenance acceptance;
- tests to add or run;
- explicit non-goals.

---

## 18. Final Alignment Checklist

Before implementation begins, confirm:

- `SYNAPSE_IDE_DEVELOPMENT_PLAN.md` references this spec conceptually or through its appendix.
- `MAP_EXPLORER_DEVELOPMENT_PLAN.md` references this spec conceptually or through its appendix.
- `URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` references this spec conceptually or through its section 31.
- The three plans agree on module ownership.
- The three plans agree on wire/layout grammar.
- The three plans agree on status vocabulary.
- The three plans agree on artifact references.
- The three plans agree that prompts will be generated later, not now.

---

## 19. Glossary

Artifact:

- A typed, inspectable output or reference produced by any module.

Evidence:

- An artifact with scientific, spatial, code, report, dashboard, or methodological meaning.

Manifest:

- A reproducibility document describing inputs, parameters, source refs, QA, outputs, and environment.

Context:

- The active state summary needed by another module to make a valid decision.

Readiness:

- Whether the current context can support a requested action.

QA gate:

- A rule-based status that can allow, warn, or block an output.

Primary surface:

- The module's main work area: editor, map canvas, or analytical workspace.

Bridge:

- A typed, non-owning connection between modules.

---

## 20. Closing Rule

The three-module system is premium only when a user can move from method to map to code to report and back again without losing source, QA, assumptions, provenance, or intent.
