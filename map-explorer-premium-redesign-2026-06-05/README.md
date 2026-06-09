# Map Explorer Premium Redesign Operating Pack

Status: Active plan  
Date: 2026-06-05  
Scope owner: Map Explorer canonical surface  
Primary code surface: `src/centerpanel/components/map/` and `src/centerpanel/components/MapExplorerModal.tsx`

## Purpose

This operating pack defines a focused, non-breaking redesign plan for the Map Explorer UI. The target is a premium, legible, efficient GIS workbench that preserves every existing Map Explorer capability while fixing the current layout, modal, panel, toolbar, and status-bar problems reported from the June 5, 2026 visual review.

The redesign is not a new feature program. It is a UI architecture and interaction repair program for the existing Map Explorer.

## Hard Rules

- Do not remove or degrade existing GIS functionality.
- Do not silently change scientific, CRS, provenance, QA, import/export, report, workflow, or map-state behavior.
- Do not introduce a persistent bottom panel. The bottom edge is reserved for an advanced status bar only.
- Do not embed the opening/readiness modal inside the left panel.
- Do not add scattered floating sketch/tool panels. Tool workspaces must dock into the left or right panel system.
- Keep the map canvas primary and continuously inspectable.
- Use the canonical Map Explorer surface documented in `docs/architecture/map-explorer-canonical-surface.md`.
- Use tokenized styling and existing Map GIS primitives. No Tailwind in `src/centerpanel/`.

## Anti-Amnesia Protocol

Simplest agent handoff:

1. Open `AGENT_NEXT_PROMPT.md`.
2. Copy its instruction into the next agent run.
3. The agent picks the first `pending` prompt from `05_IMPLEMENTATION_PROMPTS.json`.
4. Repeat with the same instruction after each completed prompt.

Before implementing any prompt in this pack, read only these files in order:

1. `README.md`
2. `00_SCOPE_AND_GUARDRAILS.md`
3. `07_ANTI_AMNESIA_LEDGER.md`
4. The specific prompt section in `05_IMPLEMENTATION_PROMPTS.md`
5. The specific spec file linked by that prompt

After each implementation prompt:

- Update `07_ANTI_AMNESIA_LEDGER.md`.
- Record changed files, validation commands, screenshots, and unresolved risks.
- Keep the status vocabulary stable: `pending`, `in_progress`, `implemented`, `blocked`, `verified`, `deferred`.
- Do not rewrite completed history unless correcting a factual error.

This lets future agents resume without rereading the entire codebase or inventing a new plan.

## Token-Friendly File Map

| File | Read when |
| --- | --- |
| `AGENT_NEXT_PROMPT.md` | You want the shortest reusable instruction for the next agent run. |
| `00_SCOPE_AND_GUARDRAILS.md` | You need the non-regression contract, issue IDs, current surface map, or source-file guardrails. |
| `01_OPENING_MODAL_SPEC.md` | You are fixing the startup/readiness modal, modal scroll, modal spacing, or left-panel misuse. |
| `02_PANEL_ARCHITECTURE_SPEC.md` | You are fixing left/right panels, removing the bottom panel, or consolidating floating panels. |
| `03_TOP_AND_STATUS_BAR_SPEC.md` | You are redesigning the header, top toolbar, command hierarchy, or bottom status bar. |
| `04_VISUAL_INTERACTION_SYSTEM.md` | You need visual language, spacing, density, accessibility, scroll, motion, and responsive rules. |
| `05_IMPLEMENTATION_PROMPTS.md` | You need the exact sequential implementation prompts. |
| `05_IMPLEMENTATION_PROMPTS.json` | You need the prompt list as structured machine-readable data. |
| `05_IMPLEMENTATION_PROMPTS.schema.json` | You need the JSON Schema contract for the structured prompt list. |
| `06_QA_AND_REGRESSION_GATES.md` | You need validation commands, screenshot gates, and non-regression test scenarios. |
| `07_ANTI_AMNESIA_LEDGER.md` | You need current status, decisions, issue registry, and handoff notes. |
| `08_BASELINE_SURFACE_INVENTORY.md` | You need the Prompt 00 baseline inventory of current bottom, floating, dialog, drawer, and route entry points. |

## Visual Review Problems

| ID | User-reported problem | Target outcome |
| --- | --- | --- |
| `UX-01` | Opening/readiness modal is visually weak, internally scroll-heavy, and has meaningless empty space. | A compact, premium, single-purpose launch dialog with one controlled scroll region and clear next actions. |
| `UX-02` | Left panel content does not fit its resizable width; other tabs have width/content mismatch. The opening modal was incorrectly embedded there. | A real left navigation/data panel with width-aware layouts and no launch modal content. |
| `UX-03` | A bottom panel should not exist. | Move problems, attributes, timeline, tasks, diagnostics, and similar workspaces into the right dock. Leave only an advanced status bar at the bottom. |
| `UX-04` | Floating sketch panels look scattered and non-premium. | Consolidate drawing, measurement, selection, annotations, and related inspectors into left/right dock surfaces. |
| `UX-05` | Header and top bar need to behave like one hierarchical professional toolbar with slightly more height. | A unified command surface with project context, search, tool groups, primary actions, overflow, and clear disabled reasons. |
| `UX-06` | Lowest edge should be a rich status bar, not a panel stack. | Dense clickable status bar that opens right-panel tabs for detail. |

## Execution Order

The active implementation list is the 20-prompt sequence in `05_IMPLEMENTATION_PROMPTS.md`. It intentionally splits the redesign by code seam so the bottom-panel migration, right-dock routing, navigation model, toolbar, status bar, and responsive/a11y work can be verified independently.

1. Inventory and screenshot the current failing surfaces.
2. Separate and redesign the opening dialog.
3. Remove launch dialog content from left-panel paths.
4. Make bottom workspace placement impossible in docking types and layout.
5. Build the right-dock route model and host.
6. Migrate navigation/surface inventory away from bottom-panel targets.
7. Extract bottom-panel content bodies without behavior loss.
8. Move Problems, QA, Diagnostics, Attributes, Timeline, Tasks, Selection, and Measurements into the right dock.
9. Remove the persistent bottom workspace host.
10. Rebuild left-panel content contracts and responsive fit.
11. Consolidate draw, sketch, annotation, measure, selection, and inspect detail into docked surfaces.
12. Redesign the top command surface.
13. Replace the bottom edge with the advanced status bar.
14. Run visual, accessibility, functional regression, documentation, and ledger closeout gates.

## Definition Of Done

The redesign is done only when:

- The reported screenshots no longer reproduce the modal, panel, bottom-panel, floating-panel, toolbar, or status-bar problems.
- All existing Map Explorer workflows still work: import, layers, catalog, source health, draw, measure, selection, QA, analysis, workflow, export, report handoff, review timeline, diagnostics, project save/load, CRS preflight, and map state persistence.
- `npm run typecheck` passes.
- `npm run lint:errors` passes.
- Relevant unit tests pass.
- Relevant Playwright visual/smoke tests pass against desktop, short desktop, tablet, and narrow viewport compositions.
- `07_ANTI_AMNESIA_LEDGER.md` reflects final status and remaining risks.
