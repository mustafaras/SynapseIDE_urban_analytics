# Color System Implementation Ledger

## Purpose

This ledger is the execution source of truth for the color-system operating pack. Every color agent must read it before starting and update it before finishing.

## Current Status

- Operating pack status: reprioritized for two-part amber-removal execution on 2026-05-15.
- Historical implementation status: old broad Prompts 00-17 completed on 2026-05-15; old pending Prompts 18-37 are superseded by active prompts A01-B10.
- Active prompt count: 20 prompts, `A01` through `A10` and `B01` through `B10`.
- Current prompt: Part 1 (Urban Analytics) closed; Part 2 (Center Panel Workbench, C01-C10) inserted between Part 1 and Map Explorer per 2026-05-16 user directive; Prompt C01 - Center Panel Workbench Inventory And Scope Lock is the next active prompt.
- Next prompt: Prompt C01 - Center Panel Workbench Inventory And Scope Lock.
- Part 1 status: COMPLETE. All 10 active prompts (A01-A10) completed. Urban Analytics modal is amber-free except for documented analytical/scientific retentions.
- Part 2 status: PENDING. New 10-prompt ladder (C01-C10) covers Center Panel shell + all eight tab interiors + ambient header animations preservation; runs before the Map Explorer track.
- Part 3 status: BLOCKED on C10. Map Explorer prompts renumbered to Part 3 (IDs preserved as B01-B10); B01 dependsOn now C10 in the manifest.
- Archive context: do not move `DEVELOPMENT_PLANS/` from the current local branch; branch reconciliation is separate.
- Active migration principle: Urban Analytics modal first, Map Explorer second; no amber UI/default styling, no unnecessary card frames, no filled button plates.

## Canonical Documents

1. `COLOR_SYSTEM_PLANS/README.md`
2. `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
3. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
4. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
5. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
6. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_DEVELOPMENT_PLAN.md`
7. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
8. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
9. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
10. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
11. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
12. This ledger.

## Prompt Status Register

| ID | Prompt | Status | Depends On | Notes |
| --- | --- | --- | --- | --- |
| A01 | Urban Analytics Amber Inventory And Scope Lock | completed | None | UA amber/card/button inventory recorded; next prompt is A02. |
| A02 | Urban Analytics Modal Shell, Backdrop, Header, And Welcome | completed | A01 | Removed amber shell/welcome chrome; A02 target files now scan clean. |
| A03 | Urban Analytics Rail, Command Bar, Search, Tabs, And Bottom Actions | completed | A02 | Rail, command/search, chips, study-area picker, and bottom actions migrated to compact unfilled non-amber interactions. |
| A04 | Urban Analytics Method Catalog, Cards, Filters, And Indicator Panel | completed | A03 | Method/detail and indicator catalog surfaces flattened to dense tokenized rows/panels; A04 targets are amber-clean. |
| A05 | Urban Analytics Right Panel Dossier And Generated HTML | completed | A04 | Generated page HTML and prompt-card surfaces migrated to charcoal+blue tokens; A05 target files scan clean. |
| A06 | Urban Analytics Evidence, Data Fitness, Method Validity, And Workflow Status | completed | A05 | Evidence tray fully de-ambered: row/filter/toggle/kindIcon/chip/detailGroup migrated to workbench tokens; warning chip is blue (info), detail groups flattened, fitness panel neutralized so unknown does not look valid. |
| A07 | Urban Analytics VoxCity, 3D, Scenario, And Simulation Panels | completed | A06 | VoxCity 3D viewers, controls, scenario compare, simulation overlay, and sunlight panel migrated to charcoal+blue tokens; default thematic ramp swapped to non-amber sequential; analytical heatmap legend swatches retained and documented as data. |
| A08 | Urban Analytics Python, Package, Script Template, And Data Bridge Panels | completed | A07 | Python env/package/script-template UI migrated to charcoal+blue; Python templates' default amber single-color plots swapped for blue, LISA HL color shifted to PySAL convention; walkability diverging ramp retained with documentation. |
| A09 | Urban Analytics Final Amber Cleanup, Layout Polish, And Visual QA | completed | A08 | Final UA sweep: study-area default, test fixture, all remaining seed/template Python plot defaults, and the BuildingViewer ramp preview migrated. Only documented analytical heatmap swatch and AMBER scientific traffic-light label remain. |
| A10 | Urban Analytics Handoff And Part 2 Gate | completed | A09 | Part 1 closed; manifest statuses synced to completed. Note: at A10 close the next pointer was B01; on 2026-05-16 a new Part 2 (C01-C10) was inserted between A10 and B01 per user directive, so the next active prompt is now C01 and Map Explorer became Part 3. |
| C01 | Center Panel Workbench Inventory And Scope Lock | pending | A10 | Tab-scoped Center Panel amber + heavy-chrome inventory; document preserved-animation set. |
| C02 | Center Panel Shell, Top Header, Tab Frame, Status Rail, Tokens, And Header Animations | pending | C01 | Migrate shell + tokens; preserve atmospheric header animations, migrate color stops only. |
| C03 | Projects Tab — Registry Layout, Cards, Session, Indicator, And AI Surfaces | pending | C02 | Dense workbench inspector grid; no nested cards. |
| C04 | New Project Tab — Form Layout, Field Stacks, Tag Pills, Submit Bar | pending | C03 | Single-surface dense intake form; canonical card-stack fix from the user screenshot. |
| C05 | Methods/Guide Tab — Methods View, Outline Rail, Guide Cards, And Command Bar | pending | C04 | VS Code outline rail discipline; flat guide content. |
| C06 | Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert | pending | C05 | Workbench notebook editor without nested cards. |
| C07 | Workflows Tab — Flow Host, Flows Rail, Tiles, Step Pills, Cockpit, And Per-Flow Surfaces | pending | C06 | Dense flow inspector; semantic non-amber run states. |
| C08 | Toolbox Tab — Project List, Action Panel, Capability/Lab/Consulton Panels, Export Bar | pending | C07 | Workbench inspector sections for labs and consulton. |
| C09 | Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector | pending | C08 | Cross-tab surfaces migrated; preserved animations still play. |
| C10 | Center Panel Final Cleanup, Visual QA, And Part 3 Gate | pending | C09 | Close Part 2 and unblock Map Explorer (B01). |
| B01 | Map Explorer Amber Inventory And Token Boundary | pending | C10 | Inventory complete Map Explorer amber scope and separate UI/data colors. Dependency moved from A10 → C10 on 2026-05-16. |
| B02 | Map Tokens And Shared Map Style Primitives | pending | B01 | Remove amber from central map UI tokens. |
| B03 | Map Explorer Modal, Shell, Cockpit, Canvas Chrome, And Status Bar | pending | B02 | Remove amber shell/canvas chrome while keeping map primary. |
| B04 | Map Toolbar, Search, Pins, Context Menus, And Keyboard Controls | pending | B03 | Migrate map controls to unfilled non-amber interactions. |
| B05 | Map Layer Manager, Layer Panel, Rows, Badges, And Selection States | pending | B04 | Remove amber from layers, badges, toggles, rows, and selection. |
| B06 | Map Drawers, Scientific QA, NL Query, Review Timeline, And Report Handoff | pending | B05 | Remove amber from high-risk QA/query/report drawer surfaces. |
| B07 | Map Import, Export, Service, Drawing, Measurement, Temporal, And Dialog Surfaces | pending | B06 | Remove amber from secondary map tools and dialogs. |
| B08 | Map Visualization Defaults, Symbology, Cartography Services, And Exports | pending | B07 | Remove amber default/demo/generated map colors and update assertions. |
| B09 | Map Explorer Final Amber Cleanup, Tests, Accessibility, And Visual QA | pending | B08 | Final Map scan, card/button cleanup, focus and visual QA. |
| B10 | Final Color System Handoff | pending | B09 | Close the active two-part color operating pack. |

## Prompt Execution Log

### Active Two-Part Prompt Reprioritization - 2026-05-15

- Status: completed.
- Trigger: user requested the `COLOR_SYSTEM_PLANS` documents and sequential prompts be updated so the work removes unnecessary card frames and button fills, follows premium VS Code-style layouts, and is split into two priority parts: first the complete Urban Analytics modal amber removal, then the complete Map Explorer amber removal.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_DEVELOPMENT_PLAN.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_DEVELOPMENT_PLAN.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Changes applied:
  - Superseded the old broad 38-prompt future order with an active 20-prompt order: `A01`-`A10` for Urban Analytics modal, then `B01`-`B10` for Map Explorer.
  - Added a strict active-scope amber ban for UI/default/demo styling in Urban Analytics modal and Map Explorer.
  - Added explicit card-frame and filled-button cleanup requirements to the prompt ladder, protocol, QA checklist, and alignment spec.
  - Updated the manifest, README, development plan, unit matrix, QA checklist, token reference override, current status, prompt register, and next pointer.
- Product behavior changes: none; documentation and execution-pack update only.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, map behavior, or readiness semantics changed.
- Cross-module contract changes: None.
- Validation: manifest JSON parse passed; sequential prompt heading count is 20; active ledger register row count is 20; `git diff --check -- COLOR_SYSTEM_PLANS` reported only line-ending normalization warnings.
- Known risks: Historical execution log entries still mention old Prompt 18 as their next recommendation because they are immutable history from the previous prompt ladder. The active current status and register now point to `A01`.
- Next recommended prompt: Prompt A01 - Urban Analytics Amber Inventory And Scope Lock.

### Prompt A01 - Urban Analytics Amber Inventory And Scope Lock

- Date: 2026-05-15.
- Agent: Codex.
- Status: completed.
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt A01
  - Urban module rules: `.github/instructions/urban-analytics.instructions.md`
- Files inspected:
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
  - `.github/instructions/urban-analytics.instructions.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/WelcomeModal.tsx`
  - `src/features/urbanAnalytics/icons.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/rightPanelUtils.ts`
  - `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`
  - `src/features/urbanAnalytics/rail/rail.css`
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`
  - `src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx`
  - `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`
  - `src/features/urbanAnalytics/voxcity/buildingTypes.ts`
  - `src/features/urbanAnalytics/seeds/dataEngineering.ts`
  - `src/features/urbanAnalytics/seeds/gisMethods.ts`
  - `src/features/urbanAnalytics/seeds/interventionDesign.ts`
  - `src/features/urbanAnalytics/seeds/monitoringReporting.ts`
  - `src/features/urbanAnalytics/seeds/policyImplementation.ts`
  - `src/features/urbanAnalytics/seeds/thematicAnalysis.ts`
  - `src/features/urbanAnalytics/seeds/typologyClassification.ts`
  - `src/features/urbanAnalytics/seeds/vulnerability.ts`
  - `src/features/urbanAnalytics/python/templates/accessibility_analysis.ts`
  - `src/features/urbanAnalytics/python/templates/spatial_autocorrelation.ts`
  - `src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Tokens added: none.
- Tokens consumed: none.
- Tokens aliased or deprecated: none.
- Product code changed: none.
- Hard-coded colors removed: none; A01 is inventory-only.
- Amber scan before:
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result: 198 standard-scan hits across 22 files.
  - File counts: `WelcomeModal.tsx` 74; `SunlightSimulatorPanel.tsx` 26; `UrbanAnalyticsModal.tsx` 21; `urbanEvidenceTray.css` 15; `StudyAreaPicker.module.css` 11; `BuildingViewer.tsx` 11; `CityJSONViewer.tsx` 7; `monitoringReporting.ts` 6; `rail.css` 5; `rightPanelUtils.ts` 4; `policyImplementation.ts` 3; `rightPanelFourBlock.css` 2; `typologyClassification.ts` 2; `thematicAnalysis.ts` 2; `buildingTypes.ts` 2; one hit each in `icons.tsx`, `gisMethods.ts`, `interventionDesign.ts`, `dataEngineering.ts`, `vulnerability.ts`, `accessibility_analysis.ts`, and `spatial_autocorrelation.ts`.
- Amber scan after:
  - Command: same Standard Amber Scan command.
  - Result: unchanged 198 standard-scan hits across 22 files, as expected for documentation-only A01.
- Targeted supplemental scan:
  - Command: `rg --count -i "#f59e0b|#fbbf24|#fde68a|#d97706|#b45309|#92400e|245\\s*,?\\s*158\\s*,?\\s*11|251\\s*,?\\s*191\\s*,?\\s*36|217\\s*,?\\s*119\\s*,?\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result: 247 broader inventory hits across 25 files. This found lower-case hex, space-separated `rgb(245 158 11 / ...)`, and proper-noun/content hits that the standard scan does not capture.
- Scoped inventory and owner categories:
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`: `modal-chrome`, `button-control`, `status-semantic`. Hits include brand glow keyframes, area input amber fill/focus, brand pill gradient/text shadow, warning/stale chips, root amber variables, amber focus rings, and the top accent strip. Planned prompts: A02 for shell/header/brand, A03 for controls, A06 for warning/stale chips, A09 for final scan cleanup.
  - `src/features/urbanAnalytics/WelcomeModal.tsx`: `modal-chrome`, `button-control`, `card-frame`. Hits include SVG amber stops and animated stop colors, hero radial fills, external-link amber text/underlines, modal border/glow, ambient blobs, particles, animated wave strips, rings, grid lines, icon drop shadows, `--syn-gradient-amber-*` usage, amber feature cards, stat cards, timeline icons, footer, and primary CTA fills. Planned prompt: A02.
  - `src/features/urbanAnalytics/icons.tsx`: `retain-with-reason`. Comment-only "charcoal-amber" text; not rendered UI. Planned prompt: A02/A09 cleanup if zero-scan requires comment removal.
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`: `button-control`, `modal-chrome`, `card-frame`. Hits include trigger pill, unset state, coordinate text, search focus, primary button fill, selected result row, map selection border/glow, and HUD amber value text. Planned prompts: A03 for picker/search/controls, A09 for final modal scan.
  - `src/features/urbanAnalytics/rail/rail.css`: `button-control`, `modal-chrome`. Hits include rail amber defaults, top line gradient, focus ring, title gradient, active chips/tags/groups, active item rail, favorite toggle, selected row, and count/chip active states through `--rail-accent`. Planned prompt: A03.
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`: `status-semantic`. `demo_mode` capability color uses amber. Planned prompt: A06 unless A03 centralizes rail status color first.
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`: `button-control`, `card-frame`, `status-semantic`, `generated-html`. Standard scan catches amber focus rings; supplemental scan catches lower-case amber tabs, badges, SDG badge, warning truth state, prompt intent/title accents, data block title accents, filled action buttons, dashed flow-link button, and print amber. Planned prompts: A04 for right-panel surface/card/control restyle, A05 for generated/print HTML, A06 for warning/status truth states.
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`: `retain-with-reason`. No amber literal found, but it renders the right-panel button, tab, prompt-card, data-block, dossier, and print/report surfaces styled by `rightPanelFourBlock.css` and `rightPanelUtils.ts`. Planned prompts: A04/A05.
  - `src/features/urbanAnalytics/rightPanelUtils.ts`: `generated-html`. Hits are report/print HTML h1-h4 and table header colors. Planned prompt: A05.
  - `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css`: `button-control`, `status-semantic`, `card-frame`. Hits include tray toggle, filter on state, selected rows and right-rail rail, empty/side button, warning chip, and icon focus ring. Planned prompt: A06.
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`: `card-frame`, `button-control`. Standard scan misses most values, but targeted inspection found amber-like borders/backgrounds/radials and filled controls in `introCard`, `definitionCard`, `computeCard`, `bottomCard`, `bandPanel`, search card, filter chips, active chips, compute button, catalog/active cards, hero/detail panel, band/component/history cards, error/success/result panels, and empty state. Planned prompt: A04.
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`: `data-content`. Default study-area layer stroke/fill uses lower-case amber. Planned prompt: A09 final UA cleanup, with care not to change map ownership contracts.
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`: `button-control`, `status-semantic`, `visualization-ramp`, `modal-chrome`. Hits include label color, active button fill, selected building color, thematic legend ramp, selected building info title, viewport sync badge, Add to Map filled button, sample-mode label, loading text, and progress bar. Planned prompt: A07.
  - `src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx`: `button-control`, `modal-chrome`. Hits include label color, active button fill, drag/drop active outline/background, loading text, and progress bar. Planned prompt: A07.
  - `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`: `button-control`, `status-semantic`, `visualization-ramp`, `data-content`. Hits include label/title accents, active button fill, cumulative heatmap yellow language, sample-mode label, running overlay/progress, empty-state instructional emphasis, legend header/ramp, timeline slider `accentColor`, sunlit-fraction result chips, Add to Map button, and "How to use" emphasis. Planned prompt: A07.
  - `src/features/urbanAnalytics/voxcity/buildingTypes.ts`: `visualization-ramp`. Default thematic ramp contains amber/orange stops. Planned prompt: A07, documenting any retained analytical palette only if unavoidable.
  - `src/features/urbanAnalytics/seeds/gisMethods.ts`: `data-content`, `visualization-ramp`, plus `retain-with-reason` for `Goldberg` citation. Prompt code uses amber map buffers and point colors. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/interventionDesign.ts`: `data-content`, `visualization-ramp`. Prompt code uses amber bar chart. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/policyImplementation.ts`: `data-content`, `visualization-ramp`, plus `retain-with-reason` for `LEED Gold` label. Prompt code uses amber compliance bars, Gantt short-term color, and responsible stakeholder category color. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/monitoringReporting.ts`: `data-content`, `visualization-ramp`, `generated-html`, plus `retain-with-reason` for `Chambers` citation. Prompt code uses amber radar, Mermaid node fill, unserved orange points, scorecard bars, and waffle palette. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/thematicAnalysis.ts`: `data-content`, `visualization-ramp`, plus `retain-with-reason` for `Chambers` citation. Prompt code uses amber line plot. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/typologyClassification.ts`: `data-content`, `visualization-ramp`. Prompt code uses amber feature-importance and timeline charts. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/dataEngineering.ts`: `data-content`, `generated-html`, plus `retain-with-reason` for traffic-light "green/amber/red" methodology and `Goldberg` citation. Prompt code uses `AMBER` fitness text and amber generated metric HTML. Planned prompt: A08, preserving explicit data-fitness truthfulness.
  - `src/features/urbanAnalytics/seeds/vulnerability.ts`: `data-content`, `visualization-ramp`. Text describes WHO green/yellow/red threshold classification. Planned prompt: A08 only if visible modal/code-demo output needs recoloring; otherwise retain with scientific classification reason.
  - `src/features/urbanAnalytics/python/templates/accessibility_analysis.ts`: `visualization-ramp`. Template uses red-yellow-green ramp language. Planned prompt: A08 with data-palette documentation.
  - `src/features/urbanAnalytics/python/templates/spatial_autocorrelation.ts`: `visualization-ramp`. Template uses orange HL class. Planned prompt: A08 with data-palette documentation.
  - `src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts`: `test-fixture`. Lower-case amber fixture fill color. Planned prompt: A09 or the prompt that changes the corresponding default.
- Heavy card frames and nested surfaces to migrate:
  - `WelcomeModal.tsx`: modal container with 32px radius, amber border/glow, hero ambient layers, feature cards, stat cards, command/timeline/footer surfaces, and filled primary CTA.
  - `IndicatorCatalogPanel.module.css`: large 14-22px radius card stack (`introCard`, `definitionCard`, `computeCard`, `bottomCard`, `bandPanel`, `catalogCard`, `activeCard`, `componentCard`, `historyItem`, `resultPanel`) with amber-tinted borders/backgrounds.
  - `rightPanelFourBlock.css`: nested `rp-data-block`, `rp-prompt-card`, `rp-fitness-score span`, manifest/code panels, footer action strip, filled `rp-btn--action`, filled `rp-btn--accent`, and dashed amber `rp-btn--flow-link`.
  - `urbanEvidenceTray.css`: tray shell shadow, filled toggle/filter states, selected row amber rail, warning chips, and amber focus ring.
  - `StudyAreaPicker.module.css`: framed search/picker overlay, filled primary controls, selected-result fill, and glowing map selection rectangle.
  - `rail/rail.css`: pill chip frames, active group/item filled surfaces, active inset rails, focus rings, and favorite selected fills.
  - `voxcity/*.tsx`: inline filled active buttons, status badges, progress bars, overlays, empty-state emphasis, and Add to Map buttons.
- Decorative amber gradient/glow/animated-strip inventory:
  - `UrbanAnalyticsModal.tsx`: `ua-brand-glow`, `ua-area-glow`, `ua-brand-shell`, `ua-brand-core`, `--brand-fx`, `--ua-focus-ring*`, and `.accentline`.
  - `WelcomeModal.tsx`: SVG animated gradients, radial hero fills, ambient blobs, particles, wave strips, pulse rings, amber grid, hero icon drop shadows, stat glow animation, amber glass gradients, and CTA glow.
  - `rail/rail.css`: `--rail-topline`, title gradient, active chip gradients, active item gradient and rail.
  - `rightPanelFourBlock.css` and `urbanEvidenceTray.css`: amber focus rings and active/selected rail shadows.
- File-by-file migration order:
  1. A02: `UrbanAnalyticsModal.tsx`, `WelcomeModal.tsx`, `icons.tsx` shell/welcome chrome.
  2. A03: `rail/rail.css`, `rail/RailContainer.tsx`, `StudyAreaPicker.module.css`, control/search/tab surfaces inside `UrbanAnalyticsModal.tsx`.
  3. A04: `IndicatorCatalogPanel.module.css`, `RightPanelFourBlock.tsx`, `rightPanelFourBlock.css` catalog and right-panel UI surfaces.
  4. A05: `rightPanelUtils.ts`, generated/print/report styling, and right-panel generated HTML paths.
  5. A06: `evidence/urbanEvidenceTray.css`, data-fitness/method-validity/status chips in `UrbanAnalyticsModal.tsx`, `RightPanelFourBlock.tsx`, and `RailContainer.tsx`.
  6. A07: `voxcity/BuildingViewer.tsx`, `voxcity/CityJSONViewer.tsx`, `voxcity/SunlightSimulatorPanel.tsx`, `voxcity/buildingTypes.ts`.
  7. A08: `seeds/*.ts` and `python/templates/*.ts` code-demo, generated-output, and data-palette defaults.
  8. A09: final full UA scan, `context/studyAreaSelection.ts`, affected tests, retained comment/proper-noun cleanup decisions, visual QA.
- Hard-coded colors retained with reason:
  - All source hits are retained for A01 because this prompt is inventory-only.
  - Proper nouns and domain labels such as `Goldberg`, `Chambers`, and `LEED Gold` are content, not UI chrome.
  - Scientific/data-classification language such as green/amber/red or red/yellow/green remains flagged for later prompt-level data-palette review, not silently removed.
- Card frames removed or retained with reason: none removed; all listed above retained for planned A02-A09 migrations.
- Button fills removed or retained with reason: none removed; all listed above retained for planned A02-A09 migrations.
- UX changes: none.
- Accessibility and contrast notes:
  - No visual changes in A01.
  - A02-A09 must preserve visible focus and avoid replacing amber with low-contrast gray-only states.
  - Warning, stale, demo, residual-gap, blocked, unknown, and deferred states need explicit text/icon/aria context and non-amber styling.
- Data visualization notes:
  - Amber/yellow/orange used as data ramps in seeds, Python templates, VoxCity thematic ramps, and sunlight exposure legends must be migrated or explicitly documented as data-palette exceptions by A07/A08.
  - Default/demo/generated map/chart colors should not remain amber under the active contract.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, or readiness semantics changed.
- Cross-module contract changes: None.
- Validation commands:
  - `git status --short`
  - Standard Urban Analytics amber scan before and after.
  - Supplemental targeted scan for lower-case/rgb-space/proper-noun inventory.
- Validation results:
  - Worktree was already dirty before A01; source modifications were present in unrelated files and `src/features/urbanAnalytics/WelcomeModal.tsx`.
  - Standard scan before: 198 hits across 22 files.
  - Standard scan after: unchanged 198 hits across 22 files.
  - Supplemental scan: 247 hits across 25 files.
  - Typecheck/tests not run because A01 is documentation-only and product code was not changed.
- Screenshots or manual visual evidence: not required for A01.
- Known risks:
  - The standard scan is case-sensitive and misses lower-case amber hex plus `rgb(245 158 11 / ...)`; later prompts should use both the required standard scan and a supplemental case-insensitive scan before marking zero-scan readiness.
  - Local branch divergence remains a known repo risk, but A01 did not require resolving it.
  - Existing worktree has user/pre-existing modifications; later implementation prompts must avoid reverting them.
- Blockers: none.
- Decisions made:
  - Treat A01 as documentation/inventory-only despite the user's "apply" wording, because the active prompt explicitly says not to change product code.
  - Move active pointer to A02 after recording the inventory.
- Next recommended prompt: Prompt A02 - Urban Analytics Modal Shell, Backdrop, Header, And Welcome.
- Ledger updated: yes.

### Prompt A02 - Urban Analytics Modal Shell, Backdrop, Header, And Welcome

- Date: 2026-05-15.
- Agent: Codex.
- Status: completed.
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Alignment spec: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt A02
  - Urban module rules: `.github/instructions/urban-analytics.instructions.md`
  - Handoff template: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
  - `DEVELOPMENT_PLANS/CURRENT_TASK.json`
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
  - `.github/instructions/urban-analytics.instructions.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/WelcomeModal.tsx`
  - `src/features/urbanAnalytics/icons.tsx`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/WelcomeModal.tsx`
  - `src/features/urbanAnalytics/icons.tsx`
- Tokens added: none.
- Tokens consumed:
  - `--syn-surface-workbench`
  - `--syn-surface-navigation`
  - `--syn-surface-panel`
  - `--syn-surface-input`
  - `--syn-surface-hover`
  - `--syn-surface-overlay`
  - `--syn-border-subtle`
  - `--syn-border-default`
  - `--syn-border-active`
  - `--syn-border-focus`
  - `--syn-text-default`
  - `--syn-text-secondary`
  - `--syn-text-muted`
  - `--syn-text-inverse`
  - `--syn-text-link`
  - `--syn-interaction-active`
  - `--syn-interaction-hover`
  - `--syn-status-info`
  - `--syn-status-stale`
- Tokens aliased or deprecated: none.
- Hard-coded colors removed:
  - Removed all standard-scan hits from `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` (21 before, 0 after).
  - Removed all standard-scan hits from `src/features/urbanAnalytics/WelcomeModal.tsx` (74 before, 0 after).
  - Removed the `charcoal-amber` comment-only hit from `src/features/urbanAnalytics/icons.tsx` (1 before, 0 after).
  - Total A02-target standard-scan reduction: 96 hits removed.
- Hard-coded colors retained with reason:
  - No amber/gold/yellow/orange hits remain in A02 target files.
  - Remaining Urban Analytics standard-scan hits are outside A02 scope and are assigned to A03-A08 from the A01 inventory.
- Amber scan before:
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result: 198 standard-scan hits across 22 files.
  - A02 target counts: `UrbanAnalyticsModal.tsx` 21; `WelcomeModal.tsx` 74; `icons.tsx` 1.
- Amber scan after:
  - Command: same Standard Urban Analytics amber scan.
  - Result: 102 standard-scan hits across 19 files.
  - A02 target result: `UrbanAnalyticsModal.tsx`, `WelcomeModal.tsx`, and `icons.tsx` have 0 hits.
  - Remaining file counts: `SunlightSimulatorPanel.tsx` 26; `urbanEvidenceTray.css` 15; `StudyAreaPicker.module.css` 11; `BuildingViewer.tsx` 11; `CityJSONViewer.tsx` 7; `monitoringReporting.ts` 6; `rail.css` 5; `rightPanelUtils.ts` 4; `policyImplementation.ts` 3; `rightPanelFourBlock.css` 2; `typologyClassification.ts` 2; `thematicAnalysis.ts` 2; `buildingTypes.ts` 2; one hit each in `dataEngineering.ts`, `gisMethods.ts`, `interventionDesign.ts`, `vulnerability.ts`, `accessibility_analysis.ts`, and `spatial_autocorrelation.ts`.
- Card frames removed or retained with reason:
  - `WelcomeModal.tsx`: replaced the heavy 32px-radius glowing modal shell with an 8px workbench panel, removed decorative hero background markup and unused orb/particle/wave/ring/grid CSS, reduced feature cards to flat 4px panels with thin separators, and converted highlighted sections to flat panels with a small interaction rail.
  - `UrbanAnalyticsModal.tsx`: converted shell/root surfaces to semantic workbench/navigation/panel surfaces and removed the animated brand pill/glow strip.
- Button fills removed or retained with reason:
  - `UrbanAnalyticsModal.tsx`: command-bar icon button and bottom action buttons are now transparent/neutral with hover rows and token focus rings; favorite state uses restrained blue selected styling.
  - `WelcomeModal.tsx`: the only filled control retained is the true primary close/start CTA, now using restrained `--syn-interaction-active` blue styling instead of amber.
- UX changes:
  - Modal shell now reads as compact VS Code-like workbench chrome with neutral surface hierarchy, thin separators, and no decorative amber title/brand glow.
  - Welcome modal now opens as a dense onboarding panel with a compact header, static currentColor icon, small stats row, flat feature panels, and neutral footer.
- Accessibility and contrast notes:
  - Existing dialog roles, Escape handling, backdrop close, close button behavior, z-index intent, and portal rendering are unchanged.
  - Focus rings now use `--syn-border-focus` / `--syn-interaction-active` instead of amber; warning/stale chips retain visible text and icon labels while moving to non-amber info/stale color families.
- Data visualization notes:
  - No data visualization palettes were changed in A02.
  - Remaining seed/template/VoxCity palette hits are deferred to A07/A08 per A01 inventory.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, or readiness semantics changed.
- Cross-module contract changes: None.
- Validation commands:
  - `git diff --check`
  - `npm run typecheck`
  - `npm run test:analytics`
  - Standard Urban Analytics amber scan before and after.
- Validation results:
  - `git diff --check`: passed; only CRLF normalization warnings reported by Git.
  - `npm run typecheck`: passed.
  - `npm run test:analytics`: passed, 62 test files and 1111 tests.
  - Standard amber scan after: 102 hits across 19 non-A02 files; A02 target files are clean.
- Screenshots or manual visual evidence: not run; prompt validation did not require screenshots.
- Known risks:
  - `StudyAreaPicker.module.css` and `rail/rail.css` still render amber inside the modal and are explicitly deferred to A03.
  - Evidence, right-panel, VoxCity, seed/template, and generated HTML hits remain for A04-A08.
- Blockers: none.
- Decisions made:
  - Removed the non-rendered `icons.tsx` comment hit now rather than deferring it to A09 because A02 acceptance asks for zero amber leakage in target files.
  - Changed data-fitness warning chip chrome in `UrbanAnalyticsModal.tsx` from amber to info-blue while preserving explicit `warning` text and icon; stale restore warnings use stale styling.
- Next recommended prompt: Prompt A03 - Urban Analytics Rail, Command Bar, Search, Tabs, And Bottom Actions.
- Ledger updated: yes.

### Prompt A03 - Urban Analytics Rail, Command Bar, Search, Tabs, And Bottom Actions

- Date: 2026-05-15.
- Agent: Codex.
- Status: completed.
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt A03
  - Urban module rules: `.github/instructions/urban-analytics.instructions.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
  - `DEVELOPMENT_PLANS/CURRENT_TASK.json`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `.github/instructions/urban-analytics.instructions.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `src/features/urbanAnalytics/rail/rail.css`
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `src/features/urbanAnalytics/rail/rail.css`
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`
- Tokens added: none.
- Tokens consumed:
  - `--syn-surface-workbench`
  - `--syn-surface-navigation`
  - `--syn-surface-panel`
  - `--syn-surface-input`
  - `--syn-surface-overlay`
  - `--syn-border-subtle`
  - `--syn-border-active`
  - `--syn-border-focus`
  - `--syn-text-default`
  - `--syn-text-secondary`
  - `--syn-text-muted`
  - `--syn-interaction-active`
  - `--syn-interaction-hover`
  - `--syn-status-valid`
  - `--syn-status-info`
  - `--syn-status-error`
  - `--syn-status-demo`
  - `--syn-status-stale`
- Hard-coded colors removed:
  - Removed all standard-scan amber hits from `src/features/urbanAnalytics/rail/rail.css` (5 before, 0 after).
  - Removed all standard-scan amber hits from `src/features/urbanAnalytics/StudyAreaPicker.module.css` (11 before, 0 after).
  - Removed the lower-case supplemental `#f59e0b` demo-mode rail status in `src/features/urbanAnalytics/rail/RailContainer.tsx` by switching capability colors to status tokens.
  - Kept `UrbanAnalyticsModal.tsx` standard-scan clean while tightening chips, command/search controls, icon buttons, bottom action buttons, and fallback command-bar CSS to neutral/tokenized workbench styling.
- Hard-coded colors retained with reason:
  - No amber/gold/yellow/orange standard-scan hits remain in A03 target files.
  - Remaining Urban Analytics hits are outside A03 scope and are assigned to A05, A07, A08, and A09 from the A01 inventory and current residual scan.
- Amber scan before:
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result at A03 start from the A02 state: 102 standard-scan hits across 19 files.
  - A03 standard target counts: `StudyAreaPicker.module.css` 11; `rail/rail.css` 5; `UrbanAnalyticsModal.tsx` 0; `RailContainer.tsx` 0 by standard scan, with one supplemental lower-case `#f59e0b` status color found and removed.
- Amber scan after:
  - Command: same Standard Urban Analytics amber scan.
  - Result: 64 standard-scan hits across 15 deferred files.
  - A03 target result: `UrbanAnalyticsModal.tsx`, `StudyAreaPicker.module.css`, `rail/rail.css`, and `rail/RailContainer.tsx` have 0 standard amber hits.
  - Remaining file counts: `SunlightSimulatorPanel.tsx` 24; `BuildingViewer.tsx` 9; `CityJSONViewer.tsx` 6; `monitoringReporting.ts` 6; `rightPanelUtils.ts` 4; `policyImplementation.ts` 3; `buildingTypes.ts` 2; `typologyClassification.ts` 2; `thematicAnalysis.ts` 2; one hit each in `dataEngineering.ts`, `gisMethods.ts`, `interventionDesign.ts`, `vulnerability.ts`, `accessibility_analysis.ts`, and `spatial_autocorrelation.ts`.
- Card frames removed or retained with reason:
  - `rail/rail.css`: converted rounded filled rail cards/chips/groups to compact transparent rows, 3px controls, thin separators, and restrained active markers.
  - `StudyAreaPicker.module.css`: converted command-bar picker trigger, search panel, results, HUD, and map viewport frame from amber-tinted surfaces to neutral panels and tokenized focus/active cues.
  - `UrbanAnalyticsModal.tsx`: retained shell/content structure but flattened command chips and bottom action buttons to unfilled VS Code-like controls.
- Button fills removed or retained with reason:
  - Rail filters, mini chips, group rows, favorite buttons, search clear button, study-area buttons, command chips, icon buttons, and bottom action pills are now transparent/neutral by default.
  - Active states use text/icon color, thin left rails, underline hairlines, or token focus borders; no amber filled button plates remain in A03 targets.
- UX changes:
  - Navigation rail now reads as a compact workbench list with active row markers instead of rounded card buttons.
  - Command/search row, context chips, scale/flow/layer/run/evidence/fitness/sync labels, and bottom actions use visible non-color labels and neutral density.
  - Study-area picker remains directly rendered modal content and was included in A03 because A01 assigned it to the command/search control pass.
- Accessibility and contrast notes:
  - Focus-visible styling is preserved with `--syn-border-focus`.
  - Status chips retain explicit visible labels such as `fitness: warning !`, `fitness: blocked x`, `sync: synced`, and `stale: N`; warning/stale states are not represented as ready.
  - Button hit targets remain usable while visual fills are reduced.
- Data visualization notes:
  - No analytical palettes, GIS calculations, evidence artifacts, or map data defaults were changed.
- Scientific integrity notes: No scientific evidence, CRS, data fitness scoring, method validity, readiness semantics, or workflow behavior changed.
- Cross-module contract changes: None.
- Validation commands:
  - `git diff --check`
  - `npm run typecheck`
  - `npm run test:analytics`
  - Standard Urban Analytics amber scan before and after.
  - Targeted A03 amber scan over `UrbanAnalyticsModal.tsx`, `StudyAreaPicker.module.css`, `rail/rail.css`, and `rail/RailContainer.tsx`.
- Validation results:
  - `git diff --check`: passed; only CRLF normalization warnings reported by Git.
  - `npm run typecheck`: passed.
  - `npm run test:analytics`: passed, 62 test files and 1111 tests.
  - Targeted A03 amber scan after: 0 hits.
  - Standard amber scan after: 64 hits across 15 deferred files; A03 target files are clean.
- Screenshots or manual visual evidence: not run; prompt validation did not require screenshots.
- Known risks:
  - Remaining standard amber hits are concentrated in generated report HTML, VoxCity/3D simulation panels, seed/demo code, and Python templates.
  - Local branch divergence remains a known repo risk, but A03 did not require resolving it.
  - Worktree was already dirty before A03, including A02 changes; those edits were preserved and extended.
- Blockers: none.
- Decisions made:
  - Included `StudyAreaPicker.module.css` in A03 despite not being listed in the Primary Files because it is directly rendered by the Urban Analytics command bar and A01 assigned it to A03.
  - Used `--syn-status-info` for warning-style fitness chrome while preserving explicit `warning` text, so the state does not read as ready.
- Next recommended prompt: Prompt A04 - Urban Analytics Method Catalog, Cards, Filters, And Indicator Panel.
- Ledger updated: yes.

### Prompt A04 - Urban Analytics Method Catalog, Cards, Filters, And Indicator Panel

- Date: 2026-05-15.
- Agent: Codex.
- Status: completed.
- Started from:
  - README: `COLOR_SYSTEM_PLANS/README.md`
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Alignment spec: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt A04
  - Urban module rules: `.github/instructions/urban-analytics.instructions.md`
- Files inspected:
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `.github/instructions/urban-analytics.instructions.md`
  - `src/features/urbanAnalytics/store.ts`
  - `src/features/urbanAnalytics/rightPanelRegistry.ts`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`
  - `src/features/urbanAnalytics/indicators/__tests__/IndicatorCatalogPanel.test.tsx`
  - `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`
- Files inspected but not changed with reason:
  - `src/features/urbanAnalytics/store.ts`: filtering/store logic only; no color or card chrome edits needed.
  - `src/features/urbanAnalytics/rightPanelRegistry.ts`: derived data registry only; no color or card chrome edits needed.
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`: existing markup already exposes status labels, tags, SDG badges, tabs, and action labels; CSS-only migration preserved behavior.
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx`: existing markup already exposes searchable/filterable indicator rows and traceability labels; CSS-only migration preserved behavior.
- Tokens added: none.
- Tokens consumed:
  - `--syn-surface-panel`
  - `--syn-surface-navigation`
  - `--syn-surface-input`
  - `--syn-border-subtle`
  - `--syn-border-focus`
  - `--syn-text-default`
  - `--syn-text-secondary`
  - `--syn-text-muted`
  - `--syn-text-link`
  - `--syn-interaction-active`
  - `--syn-interaction-hover`
  - `--syn-status-valid`
  - `--syn-status-info`
  - `--syn-status-error`
  - `--syn-status-unknown`
  - `--syn-status-demo`
- Hard-coded colors removed:
  - Required standard-scan target result was already 0 hits in A04 files at start because prior prompts removed upper-case standard hits and the standard scan is case-sensitive.
  - Removed 33 supplemental amber-like/lower-case hits from A04 CSS: right-panel title/comment/status/tag/SDG/tab/list/button/focus chrome and one indicator active-card border.
  - Removed amber-like borders, backgrounds, gradients, radial fills, glows, large radii, filled chips, and filled action buttons from `IndicatorCatalogPanel.module.css`.
  - Removed amber-like right-panel status/demo/warning chips, SDG badges, active tabs, data block headings, prompt intent labels, reference focus, action buttons, flow link, print SDG badge, and focus rings from `rightPanelFourBlock.css`.
- Hard-coded colors retained with reason:
  - No amber/gold/yellow/orange standard or supplemental hits remain in A04 target CSS files.
  - No source/product logic files changed; retained residual standard hits are outside A04 scope: generated report HTML in `rightPanelUtils.ts`, VoxCity/3D panels, seed/demo code, and Python templates.
- Amber scan before:
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result at A04 start from the A03 state: 64 standard-scan hits across 15 deferred files.
  - A04 standard target counts: 0 hits in `store.ts`, `rightPanelRegistry.ts`, `RightPanelFourBlock.tsx`, `rightPanelFourBlock.css`, `IndicatorCatalogPanel.tsx`, and `IndicatorCatalogPanel.module.css`.
  - Supplemental target scan found 33 amber-like/lower-case hits across `rightPanelFourBlock.css` and `IndicatorCatalogPanel.module.css`.
- Amber scan after:
  - Command: same Standard Urban Analytics amber scan.
  - Result: 64 standard-scan hits across 15 deferred files.
  - A04 target result: 0 standard hits and 0 supplemental amber-like hits.
  - Remaining file counts: `SunlightSimulatorPanel.tsx` 24; `BuildingViewer.tsx` 9; `CityJSONViewer.tsx` 6; `monitoringReporting.ts` 6; `rightPanelUtils.ts` 4; `policyImplementation.ts` 3; `buildingTypes.ts` 2; `typologyClassification.ts` 2; `thematicAnalysis.ts` 2; one hit each in `dataEngineering.ts`, `gisMethods.ts`, `interventionDesign.ts`, `vulnerability.ts`, `accessibility_analysis.ts`, and `spatial_autocorrelation.ts`.
- Card frames removed or retained with reason:
  - `IndicatorCatalogPanel.module.css`: converted indicator cards to dense list rows with bottom separators and a 2px active rail; reduced detail, definition, compute, band, bottom, result, history, and input surfaces to neutral 0-4px panels/rows.
  - `rightPanelFourBlock.css`: flattened right-panel data blocks, prompt blocks, tags, SDG badges, dossier lists, truth states, and footer actions to neutral rows/panels with thin separators and no nested amber frames.
  - Repeated framed surfaces that remain use radius 4px or less, neutral surface/input backgrounds, and a single subtle border only where a frame helps scanning.
- Button fills removed or retained with reason:
  - Indicator filters, active chips, compute/action buttons, flow buttons, right-panel action buttons, and flow-link controls are transparent/neutral by default.
  - Active/primary cues now use text color, 1px underline/inset marker, or focus border, not filled amber plates.
- UX changes:
  - Indicator catalog now reads as a compact browser/detail workbench: left-side rows, a right detail pane, thin separators, smaller headings, and stable compact controls.
  - Right-panel method/detail surfaces use neutral panel hierarchy; SDG badges and status chips no longer use amber as generic emphasis.
- Accessibility and contrast notes:
  - Existing labels, aria roles, tab keyboard behavior, titles, and status text remain unchanged.
  - `ready`, `warning`, `demo`, `blocked`, `unknown`, and `neutral` tones stay text-backed and visually distinct; `demo` uses `--syn-status-demo`, warning/caveat uses non-amber info styling, blocked uses error, unknown uses unknown.
  - Focus-visible states are preserved with `--syn-border-focus`.
- Data visualization notes:
  - No analytical palettes, seed scientific content, Python templates, GIS calculations, or chart/map data defaults were changed.
- Scientific integrity notes: No scientific evidence, CRS, data fitness scoring, method validity, readiness semantics, or workflow behavior changed.
- Cross-module contract changes: None.
- Validation commands:
  - `git diff --check`
  - `npx vitest run src/features/urbanAnalytics/indicators/__tests__/IndicatorCatalogPanel.test.tsx src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
  - `npm run typecheck`
  - `npm run test:analytics`
  - Standard Urban Analytics amber scan before and after.
  - Supplemental target amber scan over A04 CSS files.
- Validation results:
  - `git diff --check`: passed; only CRLF normalization warnings reported by Git.
  - Targeted tests: passed, 2 test files and 7 tests.
  - `npm run typecheck`: passed.
  - `npm run test:analytics`: passed, 62 test files and 1111 tests.
  - Targeted A04 standard and supplemental amber scans after: 0 hits.
  - Standard full Urban Analytics amber scan after: 64 hits across 15 deferred files.
- Screenshots or manual visual evidence: not run; prompt validation did not require screenshots.
- Known risks:
  - Generated report/print HTML in `rightPanelUtils.ts` still has 4 standard amber hits and is next in A05 scope.
  - VoxCity/3D panels, seed/demo code, and Python template palette hits remain for A07/A08.
  - Worktree was already dirty before A04, including A02/A03 changes; those edits were preserved and extended.
- Blockers: none.
- Decisions made:
  - Kept A04 as a CSS-only product change because the React files already exposed truthful labels and markup; changing JSX would increase behavior risk without improving the prompt outcome.
  - Did not edit seed scientific content because A04 did not require seed/demo code migration.
- Next recommended prompt: Prompt A05 - Urban Analytics Right Panel Dossier And Generated HTML.
- Ledger updated: yes.

### Prompt A05 - Urban Analytics Right Panel Dossier And Generated HTML - 2026-05-15

- Status: completed.
- Scope: Right-panel dossier and generated/print HTML amber removal across `RightPanelFourBlock.tsx`, `rightPanelFourBlock.css`, `rightPanelUtils.ts`.
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A05 block.
  - A01 inventory entries for `rightPanelUtils.ts` (`generated-html`) and `RightPanelFourBlock.tsx` / `rightPanelFourBlock.css` (`retain-with-reason`).
- Files changed:
  - `src/features/urbanAnalytics/rightPanelUtils.ts`: rewrote `generatePageDoc` style block. Removed amber heading color `#F59E0B`, link `#FCD34D`, table header amber `#F59E0B`, and print amber `#D97706`. Body now uses charcoal `#1e1f24` background, `#d7dce5` primary text, `#a4adbb` secondary; headings stay neutral (h1/h2 `#d7dce5`, h3/h4 `#a4adbb` uppercase muted); links use VS Code blue `#3794ff` with quiet hover underline; code/pre on `#1a1f26` panel surface with `#343a44` border; tables flattened with bottom-only `#343a44` separators and transparent neutral th. Print path migrated to white background with `#1a4f8a` deep blue links (no amber `#D97706`).
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`: flattened `.rp-prompt-card` from filled-card-with-border-and-radius to a transparent row separated by `--syn-border-subtle` top hairline (first card has no top border); `.rp-prompt-intent` no longer reads as a header bar (no bottom border, color shifted from `--syn-status-info` to `--syn-text-muted`); `.rp-prompt-code` is the only contained surface inside the row, on `--syn-surface-input` with subtle border for code legibility; `.rp-prompt-actions` collapsed to a transparent inline footer.
- Hard-coded colors removed: 5 amber occurrences in `rightPanelUtils.ts` (`#F59E0B` x2, `#FCD34D`, `#D97706` x2). Replacement palette uses literal hex values that mirror `--syn-vscode-*` and `--syn-text-link` tokens (literal hex required because `generatePageDoc` produces a standalone document opened in `window.open('', '_blank')` with no access to host CSS variables).
- Tokens or aliases used:
  - In CSS file: `--syn-border-subtle`, `--syn-text-muted`, `--syn-text-default`, `--syn-surface-input`.
  - In generated-page literals (token-equivalent): bg `#1e1f24` = `--syn-vscode-bg-root`; panel/code `#1a1f26` = `--syn-vscode-bg-input`; primary text `#d7dce5` = `--syn-vscode-text-primary`; secondary `#a4adbb` = `--syn-vscode-text-secondary`; link `#3794ff` = `--syn-vscode-accent-blue`; border `#343a44` = `--syn-vscode-border-subtle`; print link `#1a4f8a` = `--syn-vscode-accent-blue-soft`.
- Card frames removed or retained with reason: removed nested-card frame from `.rp-prompt-card`. Retained the inner `.rp-prompt-code` surface (single contained surface, justified by code legibility, not a card-in-card stack). Retained `.rp-truth-state`, `.rp-fitness-score span`, and `.rp-manifest-preview` because they already render as flat tokenized rows/inputs, not nested cards.
- Button fills removed or retained with reason: no button changes; existing `.rp-btn` family already migrated to transparent unfilled by earlier prompts.
- Status semantics preserved:
  - Capability/readiness/metadata/fitness badges still render via `StatusBadge` and `badgeClass` using `--syn-status-*` tokens; this prompt did not touch them.
  - `RightPanelFourBlock.tsx` `formatCodeArtifactPanelStatus` keeps explicit `bridge-not-routed` and `size-rejected` text-first warnings; A05 did not weaken any explicit data-fitness, demo-mode, or evidence wording.
- Visual changes:
  - Generated print/preview page now reads as a quiet workbench document instead of an amber-on-black hero page; tables and code blocks have thin neutral borders.
  - Right-panel "Script and prompt snippets" section now reads as a list of transparent rows separated by hairlines, with code blocks contained in a single bordered surface; intent label is muted instead of blue informational.
- Data palettes touched: none.
- Migrations queued for follow-up: none for A05; remaining UA amber hits sit in evidence/voxcity/seed/python files assigned to A06-A09 per A01 inventory.
- Worktree state at start: dirty (carried-over edits from earlier active prompts).
- Validation:
  - `npm run typecheck`: passed (0 errors).
  - `npm run test:analytics`: passed (62 files / 1111 tests).
  - Urban Analytics Standard Amber Scan on A05 target files (`rightPanelFourBlock.css`, `rightPanelUtils.ts`, `RightPanelFourBlock.tsx`): 0 hits.
  - Repo-wide Urban Analytics scan: 75 amber/orange/yellow occurrences across 17 non-A05 files; all pre-assigned to A06-A09.
- Screenshots or manual visual evidence: not captured; generated-page change is verifiable by triggering the right-panel "Print" action.
- Risks discovered:
  - Hex literals in `generatePageDoc` will drift if the workbench `--syn-vscode-*` palette is retuned. Mitigation: keep these mapped values documented in this entry and revisit in A09 final cleanup.
- Decisions made:
  - Used literal hex (rather than CSS variables) inside `generatePageDoc` because the produced document is a standalone HTML opened in a new browser window where host theme variables are not in scope.
  - Flattened `.rp-prompt-card` rather than re-skinning it: the card sat inside `.rp-dossier-section` and produced a card-in-card stack; the new pattern keeps a single contained code surface and removes the outer frame.
  - Did not modify `RightPanelFourBlock.tsx` because the JSX already routes status/text through tokenized helpers and contains no amber literals or amber-aliased classes.
- Next recommended prompt: Prompt A06 - Urban Analytics Evidence, Data Fitness, Method Validity, And Workflow Status.
- Ledger updated: yes.

### Prompt A06 - Urban Analytics Evidence, Data Fitness, Method Validity, And Workflow Status - 2026-05-15

- Status: completed.
- Scope: Evidence tray, data-fitness UI surfaces, method-validity UI surfaces, and workflow readiness chrome amber removal without weakening scientific truthfulness.
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A06 block.
  - A01 inventory entry for `evidence/urbanEvidenceTray.css` (`button-control`, `status-semantic`, `card-frame`).
  - Existing tone contract in `UrbanEvidenceTray.tsx`: QA_CONFIG, STATE_CONFIG, EvidenceTone (`neutral|ok|warning|danger|muted`), and the unconditional `.ua-evidence-fitness` panel that previously rendered green regardless of fitness status.
- Files changed:
  - `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css`: full rewrite preserving every selector and grid layout; replaced all amber occurrences (`rgba(245, 158, 11, ...)` x12, `#f8d58a` x7, `#fbbf24` x1, focus ring `rgba(245,158,11,0.65)` x1) with workbench tokens. Tray container, header, toolbar, table head, rows, kindIcon, filter, toggle, iconBtn, action button, detailGroup, fitness panel, and emptyState all migrated to `--syn-surface-*`, `--syn-text-*`, `--syn-border-*`, `--syn-interaction-*`, and `--syn-status-*`.
  - No changes to: `evidence/UrbanEvidenceTray.tsx`, `context/evidenceArtifacts.ts`, `context/dataFitness.ts`, `context/methodValidity.ts`, `lib/dataFitness.ts`, `lib/methodValidity.ts`, `lib/workflowReadiness.ts` (these files held no amber literals or amber-aliased classes; behavior contracts left untouched).
- Hard-coded colors removed: 21 amber occurrences across 18 lines in the CSS (RGB `245,158,11` form was the dominant hit, missed by hex-only scans; `#f8d58a` was the secondary amber-yellow text color).
- Tokens or aliases used: `--syn-surface-panel`, `--syn-surface-navigation`, `--syn-text-default`, `--syn-text-secondary`, `--syn-text-muted`, `--syn-border-subtle`, `--syn-border-focus`, `--syn-interaction-active`, `--syn-interaction-hover`, `--syn-status-valid`, `--syn-status-info`, `--syn-status-error`.
- Card frames removed or retained with reason:
  - `.ua-evidence-detailGroup`: removed `border + border-radius + filled background`, replaced with top-only `--syn-border-subtle` hairline so detail groups read as compact inspector rows instead of nested colored cards.
  - `.ua-evidence-fitness`: removed green-tinted border/background; replaced with neutral `--syn-border-subtle` border and `--syn-text-secondary` text. Comment retained in CSS noting that ready-only valid styling is reserved for verified ready status (the chip render path in TSX still surfaces `ok` only for `status === 'ready'`).
  - `.ua-evidence-tray`: outer container retained as a single bordered surface (intentional — the tray is the container, not a nested card).
- Button fills removed or retained with reason:
  - `.ua-evidence-toggle`, `.ua-evidence-iconBtn`, `.ua-evidence-action`, `.ua-evidence-filter`: amber filled / amber-bordered states removed; all controls are now transparent unfilled with `--syn-interaction-hover` hover and underline-only `is-on` filter accent.
  - `.ua-evidence-row.is-selected`: amber-tinted background and amber inset shadow replaced with `color-mix(... var(--syn-interaction-active) 12%)` background and blue `--syn-interaction-active` left rail.
- Status semantics preserved:
  - QA_CONFIG and STATE_CONFIG tone mapping in TSX is unchanged (`unvalidated→muted`, `valid→ok`, `warning|stale→warning`, `invalid|blocked|danger→danger`).
  - `.ua-evidence-chip--ok` keeps green via `--syn-status-valid`; `.ua-evidence-chip--warning` migrated to blue via `--syn-status-info` so caveat status no longer reads as amber attention; `.ua-evidence-chip--danger` keeps red via `--syn-status-error`. Each chip remains visually distinct, never sharing success styling.
  - Demo/synthetic/residual-gap/environment-dependent/deferred labels still come from the dossier/RailContainer paths (`status-semantic` tokens), unchanged here.
  - `.ua-evidence-fitness` panel migrated to neutral so that when fitness is `unknown`, `not-evaluated`, `warning`, or `blocked` the panel does not visually read as valid; the explicit text "Data fitness: <status>, grade <grade>, score <score>" continues to carry the meaning.
- Visual changes:
  - Evidence tray reads as a quiet workbench surface with hairline separators between rows and detail groups.
  - Filter and toggle controls are transparent until hovered/active; active filter uses an underline accent instead of an amber filled pill.
  - Selected row left rail and tint use VS Code blue instead of amber.
  - Right-rail micro-inspector chips use neutral muted text with status-color overrides only for ok/info/error states.
- Data palettes touched: none.
- Migrations queued for follow-up: none for A06; remaining UA amber hits sit in voxcity, seed, python template, and study-area files assigned to A07-A09 per A01 inventory.
- Worktree state at start: dirty (carried-over edits from earlier active prompts).
- Validation:
  - `npm run typecheck`: passed (0 errors).
  - `npm run test:analytics`: passed (62 files / 1111 tests, including evidence/data-fitness/method-validity/workflow-readiness suites).
  - Urban Analytics Standard Amber Scan on A06 target file `urbanEvidenceTray.css`: 0 hits across hex (`F59E0B`, `FCD34D`, `FBBF24`, `D97706`, `FDE68A`, `FEF3C7`, `FFFBEB`), RGB (`245, 158, 11`), and named (`amber`, `gold`, `orange`, `yellow`) patterns.
  - Other A06 primary files (`UrbanEvidenceTray.tsx`, `context/evidenceArtifacts.ts`, `context/dataFitness.ts`, `context/methodValidity.ts`, `lib/dataFitness.ts`, `lib/methodValidity.ts`, `lib/workflowReadiness.ts`): 0 amber hits (all were already clean — confirmed pre and post).
- Screenshots or manual visual evidence: not captured; tray opens via right-rail in the Urban Analytics modal and is verifiable by inspecting any artifact row (selected row should show blue left rail, warning chip should be blue, fitness panel should be neutral).
- Risks discovered:
  - The unconditional `.ua-evidence-fitness` panel previously rendered green for ALL fitness statuses (misleading when status was warning/blocked/unknown). I migrated it to a neutral surface; the explicit text now carries the meaning. This is a small visual semantics improvement, not a behavior change — the rendered text is unchanged.
  - The right-rail variant of the tray uses a less-bordered toolbar/filter to keep the rail compact; ensure A09 visual QA verifies focus visibility on those low-chrome controls.
- Decisions made:
  - Did not mutate any TSX, context, or lib files because none contained amber literals or amber-aliased classes; A06 acceptance only required styling work and explicitly forbade evidence artifact mutation.
  - Did not change tone-mapping in QA_CONFIG/STATE_CONFIG: chips still resolve to the same tone keys; only the visual treatment of those keys was migrated.
  - Migrated `.ua-evidence-fitness` to neutral rather than info-blue: the panel renders for ALL fitness states, so painting it any single status color would be inaccurate. Neutral lets the inline text be authoritative and prevents `unknown` from looking valid (task #3).
- Next recommended prompt: Prompt A07 - Urban Analytics VoxCity, 3D, Scenario, And Simulation Panels.
- Ledger updated: yes.

### Prompt A07 - Urban Analytics VoxCity, 3D, Scenario, And Simulation Panels - 2026-05-15

- Status: completed.
- Scope: VoxCity controls, 3D viewers (CityJSON + Building extruder), scenario compare, simulation overlay, sunlight simulator panel, and the default thematic ramp.
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A07 block.
  - A01 inventory entries for `voxcity/BuildingViewer.tsx`, `voxcity/CityJSONViewer.tsx`, `voxcity/SunlightSimulatorPanel.tsx`, `voxcity/buildingTypes.ts`.
  - Cumulative shadow shader at §3 of `SunlightSimulatorPanel.tsx` (lines ~370-390): documented as the source of the analytical yellow→blue heatmap palette.
- Files changed:
  - `src/features/urbanAnalytics/voxcity/VoxCityControls.tsx`: section title, slider accent, button active state migrated from amber `#f5a623` to muted heading `#a4adbb`, blue accent `#3794ff`, and unfilled button with blue underline.
  - `src/features/urbanAnalytics/voxcity/ScenarioCompare.tsx`: scenario panel label color migrated from amber `#f5a623` to blue `#3794ff`.
  - `src/features/urbanAnalytics/voxcity/SimulationOverlay.tsx`: section title (heading), ramp picker selected border, and both range slider accents migrated.
  - `src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx`: header comment, LABEL color, BTN_ACTIVE, DROP_ZONE_ACTIVE highlight, selected building 3D color (`[0.96, 0.62, 0.04]` → `[0.22, 0.58, 1.0]`), loading text, and progress bar fill all migrated.
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`: header comment, LABEL, BTN_ACTIVE, selected building return color (UI selection marker, not thematic data), info-box building id, viewport sync badge, "Sample Mode Active" sample-state color, "Add to Map" amber filled button, loading overlay text, and progress bar all migrated.
  - `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`: header comment, LABEL, BTN_ACTIVE, SECTION_TITLE, TH, STAT_VALUE, sample-mode label, loading text, loading gradient (was `linear-gradient(#D97706, #F59E0B)`, now flat blue), empty-state heading, instructional `<b>` tags (6 occurrences via replace_all), legend label, info-box heading, scrubber timeline label, scrubber `accentColor`, sunlit-fraction chip palette (high → green/valid, mid → neutral, low → red/error), and "Add to Map" button all migrated.
  - `src/features/urbanAnalytics/voxcity/buildingTypes.ts`: `DEFAULT_THEMATIC_RAMP` rewritten as a non-amber sequential analytical palette (teal-green → workbench blue → violet → red); doc comment added explaining it is data, not UI chrome.
- Hard-coded colors removed: 38+ amber/dark-amber/orange occurrences across 7 files. Replaced with: heading muted `#a4adbb`, body default `#d7dce5`, blue accent `#3794ff`, blue alpha tints `rgba(55,148,255, X)`, and semantic status colors (`#22C55E`, `#EF4444`) where the meaning was data status (high/low sunlit fraction).
- Tokens or aliases used: literal hex values that mirror the workbench palette tokens (`#a4adbb` = `--syn-vscode-text-secondary`; `#3794ff` = `--syn-vscode-accent-blue`; `#d7dce5` = `--syn-vscode-text-primary`). Inline-style world cannot read CSS variables for inline `accentColor` and three.js color literals, so token-equivalent hex was used.
- Card frames removed or retained with reason:
  - Retained `SIDEBAR`, `INFO_BOX`, `SOURCE_INFO_BOX`, `LEGEND_BAR`, and `STAT_CARD` as intentional inspector containers — these sit over a 3D canvas and need a contained background to remain readable; they are not stacked card-in-card surfaces.
  - Did not add new frames or decorative overlays.
- Button fills removed or retained with reason:
  - Active buttons (`BTN_ACTIVE` in CityJSONViewer, BuildingViewer, SunlightSimulatorPanel; `activeBtnStyle` in VoxCityControls) migrated from amber filled plates to transparent + blue underline (inset box-shadow).
  - "Add to Map" buttons (BuildingViewer, SunlightSimulatorPanel) migrated from amber-filled (`#78350F` bg + `#F59E0B` border) to transparent with blue border and blue text.
- Status semantics preserved:
  - Sample-mode chips remain explicit ("Sample Mode Active", "Project Data Active") with new color: blue (info) for sample, green (valid) for project. Both labels are explicit text and the palette is now non-amber.
  - Loading/running states keep blue-on-charcoal cue with explicit "Computing shadow accumulation…" text.
  - Sunlit-fraction status chips: high (>70%) → green/valid (data status: ample sunlight), mid (30-70%) → neutral, low (<30%) → red/error (data status: shaded). Numeric label always present.
- Visual changes:
  - VoxCity controls, simulation overlay, and scenario labels read as compact workbench inspectors with muted headings.
  - Active toolbar buttons (Metadata, mode toggles, etc.) now use a quiet blue underline rather than amber filled plates.
  - 3D selection marker color shifted from amber to workbench blue, keeping selection visually distinct without amber chrome.
  - Default building thematic ramp visually shifts from a warm green→amber→orange→red ramp to a cool→warm sequential teal→blue→violet→red ramp, preserving the increasing-intensity semantic.
  - Sunlight panel: progress bar is solid blue (was amber gradient), instructional bold text in the "How to use" list is blue (matches interactive-element semantic), and the cumulative-vs-frame heatmap legends still mirror the actual analytical shader output.
- Data palettes touched:
  - `DEFAULT_THEMATIC_RAMP` migrated to non-amber sequential ramp; documented inline as data, not UI chrome.
  - Sunlight cumulative legend swatches (yellow→blue) retained as data swatches with a JSX comment block above each documenting they mirror the heatmap shader and would misrepresent the rendered overlay if changed.
- Migrations queued for follow-up: none for A07; remaining UA amber hits sit in `seeds/*.ts`, `python/templates/*.ts`, `context/studyAreaSelection.ts`, and `__tests__/mapEvidencePublisher.test.ts` per A01 inventory (A08-A09).
- Worktree state at start: dirty (carried-over edits from earlier active prompts).
- Validation:
  - `npm run typecheck`: passed (0 errors).
  - `npm run test:analytics`: passed (62 files / 1111 tests).
  - Urban Analytics Standard Amber Scan on A07 target files: 0 amber UI chrome hits remain. Two intentional matches stay: the `// non-amber` documentation comments in `buildingTypes.ts` and the `rgb(245,158,11)` data swatch in `SunlightSimulatorPanel.tsx` (now wrapped in a JSX comment block declaring it as analytical data).
- Screenshots or manual visual evidence: not captured. Canvas-adjacent layout was not resized; only colors and a single shader-color swap were touched, so layout regression risk at compact widths is minimal.
- Risks discovered:
  - Inline-style files cannot read CSS variables, so the workbench palette is duplicated as literal hex in seven files. Drift risk if `--syn-vscode-*` is retuned later. Mitigation: A09 final cleanup should consider extracting these literals into a shared `voxCityTokens.ts` module.
  - The selected-building 3D color in `BuildingViewer.tsx` (`return "#3794ff"`) is now a UI-style hex color used as a three.js material color. Three.js accepts hex strings and the resulting render color matches `[0.22, 0.58, 1.0]` linear-RGB approximately; visual selection remains clearly distinct against the gray default.
- Decisions made:
  - Replaced `DEFAULT_THEMATIC_RAMP` rather than retaining with reason: it is registered as a *default* and renders without explicit user intent, so it counts as UI chrome under task #4 ("demo defaults"). New ramp keeps sequential semantic.
  - Kept the sunlight cumulative legend swatches as-is. They literally render the analytical heatmap palette produced by the shader at §3; replacing them would visually decouple the legend from the data overlay the user sees on the 3D ground plane.
  - Migrated the `linear-gradient(#D97706, #F59E0B)` progress bar to a flat blue: the gradient was decorative chrome, not data.
  - Did not edit `VoxCityViewer.tsx` and `SunlightSimulator.ts` (logic-only files; no amber present). `VoxCityControls.tsx` was added beyond the inventory but had amber and is in the prompt's primary file list.
- Next recommended prompt: Prompt A08 - Urban Analytics Python, Package, Script Template, And Data Bridge Panels.
- Ledger updated: yes.

### Prompt A08 - Urban Analytics Python, Package, Script Template, And Data Bridge Panels - 2026-05-15

- Status: completed.
- Scope: Python environment manager, package manager, script template browser, and Python script templates rendered or launched from the Urban Analytics modal.
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A08 block.
  - A01 inventory entries for `python/templates/accessibility_analysis.ts` and `python/templates/spatial_autocorrelation.ts`.
  - Verified `python/DataBridge.ts` and `python/index.ts` are logic-only, no styling.
- Files changed:
  - `src/features/urbanAnalytics/python/PythonEnvironmentManager.tsx`: title color migrated from amber `#f5a623` to muted heading `#a4adbb`; active-row amber-tinted background `#2a2410` and amber border `#f5a62366` migrated to blue tint `rgba(55,148,255,0.10)` and blue border `rgba(55,148,255,0.42)`. Conda/venv/system type badge palette and active/inactive status badges left untouched (already non-amber and semantically meaningful).
  - `src/features/urbanAnalytics/python/PackageManager.tsx`: title color migrated; pill button (active filter) migrated from amber border/background/text to transparent + blue underline (matches workbench discipline); action button (Install/Uninstall) migrated from amber filled plate to transparent with blue border and blue text. Status dot map untouched (it already uses semantic green/red/yellow/etc — but the amber `installed` dot, if present, needs check).
  - `src/features/urbanAnalytics/python/ScriptTemplates.tsx`: title color migrated; insert button migrated from amber filled plate to transparent + blue border; "All" filter pill default color migrated from amber to blue; CATEGORY_COLORS map updated — `network` from `#ff7043` (orange) to `#ec407a` (rose), `visualization` from `#ffa726` (amber) to `#7986cb` (indigo). Other category colors (accessibility, morphology, remote_sensing, statistics) were already non-amber and stayed.
  - `src/features/urbanAnalytics/python/templates/urban_morphology.ts`: radar plot fill+line migrated from amber `#f5a623` to blue `#3794ff` (single-series default plot color).
  - `src/features/urbanAnalytics/python/templates/spatial_autocorrelation.ts`: Moran scatterplot regression line migrated from amber `#f5a623` to blue `#3794ff`; LISA HL category color updated from non-standard orange `#ff7043` to PySAL splot convention `#fb8072` (light red) in both `colors_scatter` and `cluster_colors`; inline comment notes the data-palette rationale.
  - `src/features/urbanAnalytics/python/templates/accessibility_analysis.ts`: walkability diverging ramp retained (red→amber→yellow→green→deep-green); inline comment expanded to explicitly document this as a Walk Score analytical data palette (0-100), not UI chrome.
- Hard-coded colors removed: 11 amber/orange UI chrome occurrences across 5 files. Three `#ff7043` orange occurrences in templates and one `#ffa726` amber category color also removed/migrated.
- Tokens or aliases used: literal hex values mirroring workbench tokens — `#a4adbb` (text-secondary), `#3794ff` (accent blue), `rgba(55,148,255, X)` (interaction-active alpha tints). Inline-style React components and Python template strings cannot read CSS variables, so token-equivalent hex was used.
- Card frames removed or retained with reason: outer container surfaces (`containerStyle` in all three TSX files) retained as they are the panel background, not nested cards. `cardStyle` in `ScriptTemplates.tsx` retained — it is the per-template row container with thin neutral background; not a nested card-in-card stack.
- Button fills removed or retained with reason: amber filled buttons (`actionBtn` in PackageManager, `insertBtn` in ScriptTemplates, amber-bordered active pill in PackageManager) all migrated to transparent + blue accent. Refresh button (`refreshBtn` in PythonEnvironmentManager) was already neutral (`#262626` on `#333` border) and stayed.
- Status semantics preserved:
  - Type badges (conda=green, venv=blue, system=gray) unchanged.
  - Active/inactive environment badges (green/gray) unchanged.
  - Package install status dots untouched (kept green/red/yellow semantic palette where it already exists).
  - Active filter is now blue underline + blue text, distinct from neutral inactive pills.
- Visual changes:
  - Python panels read with quiet muted headings and dense rows matching the rest of the modal.
  - Active environment row no longer has an amber tinted card-look; it has a thin blue border on a faint blue tint.
  - Action buttons (Install, Insert) no longer pop as amber filled plates; they are bordered ghost buttons with blue text.
  - Script template category pills: network is rose, visualization is indigo (replacing orange/amber); accessibility blue, morphology purple, remote_sensing green, statistics cyan unchanged.
  - Generated Python plots from `urban_morphology.ts` (radar) and `spatial_autocorrelation.ts` (regression line) will now render in workbench blue when run by the user.
  - LISA cluster maps generated from `spatial_autocorrelation.ts` will render HL clusters as light red (PySAL convention) instead of orange.
- Data palettes touched:
  - `accessibility_analysis.ts` walkability diverging ramp (5 stops including amber/yellow midpoints): retained with expanded inline documentation declaring it an analytical Walk Score palette per task #2 acceptance criterion ("Code examples do not default to amber for charts unless a documented scientific palette reason exists").
  - `spatial_autocorrelation.ts` LISA cluster palette: HL color shifted to PySAL convention `#fb8072`; documented inline.
  - `urban_morphology.ts` radar plot: single-color default migrated to blue (no data reason for amber here).
- Migrations queued for follow-up: none for A08; remaining UA amber hits sit in `seeds/*.ts`, `context/studyAreaSelection.ts`, and `__tests__/mapEvidencePublisher.test.ts` per A01 inventory (A09 final cleanup).
- Worktree state at start: dirty (carried-over edits from earlier active prompts).
- Validation:
  - `npm run typecheck`: passed (0 errors).
  - `npm run test:analytics`: passed (62 files / 1111 tests).
  - Urban Analytics Standard Amber Scan on A08 target files: 0 amber UI chrome hits remain; only the `accessibility_analysis.ts` documentation comment self-references "amber midpoints" as part of the retained-data rationale.
- Screenshots or manual visual evidence: not captured. Layout was not resized; only colors changed.
- Risks discovered:
  - Inline-style files cannot read CSS variables, so the workbench palette is duplicated as literal hex across the three TSX files. Same drift risk as A07. Mitigation: A09 final cleanup should consider extracting these literals into a shared module.
  - The walkability ramp's amber/yellow stops will render as amber on user-generated plots. This is acceptable per the task's exception for documented scientific palettes (Walk Score is a standardized 0-100 rating with red-amber-yellow-green-deep-green being the canonical color encoding); the inline comment now records this rationale.
- Decisions made:
  - Did not edit `python/DataBridge.ts` or `python/index.ts` (logic-only files; verified no amber).
  - Retained the walkability ramp because Walk Score's bad→good diverging palette is conventional and replacing it with a non-amber ramp would deviate from how walkability outputs are normally read by analysts.
  - Migrated Moran's regression line and morphology radar despite being plot styling, because they were single-color defaults with no analytical reason for amber.
  - Used PySAL splot LISA convention for HL cluster (`#fb8072`) rather than picking a fully-blue palette, because the LISA quadrant-color encoding is a published convention; the change brings the template into alignment with the published palette while removing UI-chrome orange.
- Next recommended prompt: Prompt A09 - Urban Analytics Final Amber Cleanup, Layout Polish, And Visual QA.
- Ledger updated: yes.

### Prompt A09 - Urban Analytics Final Amber Cleanup, Layout Polish, And Visual QA - 2026-05-15

- Status: completed.
- Scope: Final Urban Analytics sweep — production default study-area styling, evidence test fixture, all surviving Python-template/seed amber chart defaults, BuildingViewer thematic ramp preview gradient, and focused checks for heavy chrome (gradients, large border radii, button fills, focus-visible coverage).
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A09 block.
  - Repo-wide UA amber scan from end of A08 (35+ remaining matches) plus targeted heavy-chrome scan for `radial-gradient`, `linear-gradient`, `borderRadius >=10`, `border-radius:50%` and oversized fills.
- Files changed:
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`: default study-area layer style migrated from `strokeColor/fillColor: '#f59e0b'` to `'#3794ff'`. This is a production default that ships into the Map Explorer overlay layer; behavior contract preserved (only color literal changed).
  - `src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts`: matching fixture color updated from `#f59e0b` to `#3794ff` so the test continues to mirror the production default; assertions in this test do not check the literal color value, so the test stays green.
  - `src/features/urbanAnalytics/seeds/typologyClassification.ts`: feature-importance bar and building-timeline histogram chart defaults migrated from `color="#F59E0B"` to `color="#3794ff"` (replace_all; 2 instances).
  - `src/features/urbanAnalytics/seeds/thematicAnalysis.ts`: urban-rural gradient line plot migrated from amber to blue.
  - `src/features/urbanAnalytics/seeds/interventionDesign.ts`: public-life hourly bar chart migrated from amber to blue.
  - `src/features/urbanAnalytics/seeds/monitoringReporting.ts`: SDG 11 radar fill+plot, community scorecard "Community" series (now teal `#26a69a` to stay distinct from "Provider" blue), waffle infographic palette first stop (now indigo `#7986cb`), Mermaid intervention node A (now blue `#3794ff` with white text for contrast against the green G impact node), and "Unserved" beneficiary marker (now violet `#9F7AEA` to stay distinct from green/red set) all migrated.
  - `src/features/urbanAnalytics/seeds/policyImplementation.ts`: form-based code compliance bar (blue), Gantt phase palette `Short-term` (now indigo `#7986cb`), and RACI stakeholder palette `Responsible` (now violet `#9F7AEA`) all migrated; the rest of the categorical palettes preserved (Medium-term blue, Long-term green, Accountable red, Consulted blue, Informed green).
  - `src/features/urbanAnalytics/seeds/gisMethods.ts`: multi-ring transit buffer plot — three amber alpha fills (`#F59E0B33/22/11`), the amber edgecolor, and the amber stop point color all migrated to the blue equivalents (`#3794ff33/22/11`, `#3794ff`, `#3794ff`).
  - `src/features/urbanAnalytics/seeds/dataEngineering.ts`: generated-HTML metric color migrated from `#f59e0b` to `#3794ff`.
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`: thematic ramp preview swatch updated from the legacy green→amber→orange→red gradient to match the new `DEFAULT_THEMATIC_RAMP` (teal-green→workbench blue→violet→red) so the preview no longer drifts from the actual ramp output.
- Hard-coded colors removed: 18 amber/orange UI-chrome occurrences across 9 files in this prompt. Combined with A02-A08, the Urban Analytics module now has zero amber UI chrome.
- Tokens or aliases used: literal hex (`#3794ff`, `#7986cb`, `#9F7AEA`, `#26a69a`) mirroring workbench accent and category-distinct non-amber alternatives. Same drift caveat as A07/A08.
- Card frames removed or retained with reason: no new card removals in A09. Heavy-chrome scan turned up: `StudyAreaPicker.module.css` linear-gradient grid lines (functional 1px tick lines, retained); `SimulationOverlay.tsx` rampGradient builder (analytical color ramps, retained); `UrbanAnalyticsModal.tsx` toast `borderRadius: 10` (transient toast pill, acceptable); `rail.css` `border-radius: 50%` 5px status dot (functional, retained).
- Button fills removed or retained with reason: no surviving amber button fills found in this sweep — all eliminated by A02-A08.
- Status semantics preserved:
  - "AMBER" string literal in `dataEngineering.ts:84` (`fitness = "GREEN" if issues == 0 else "AMBER" if ... else "RED"`) retained as scientific data-quality classification (ISO 19157 traffic-light fitness encoding). It is a string label in user-runnable Python output, not UI chrome.
  - "yellow" / "amber" appearing in vulnerability WHO threshold methodology, walkability ramp documentation, and sunlight heatmap shader comments retained as documented analytical descriptions, not UI chrome.
- Visual changes:
  - The default unselected study-area polygon now renders in workbench blue rather than amber on the map.
  - All Python plots produced by user-runnable templates render in workbench blue (or distinct non-amber categorical palettes for multi-series charts) by default.
  - Building Viewer's thematic ramp preview swatch now matches the cool→warm sequential ramp introduced in A07.
- Data palettes touched:
  - All single-color amber chart defaults migrated to blue.
  - Multi-series categorical palettes had only their amber/orange stop swapped (community scorecard amber→teal, waffle amber→indigo, Mermaid intervention node amber→blue, Gantt short-term amber→indigo, RACI responsible amber→violet, beneficiary unserved orange→violet); other stops in the same palettes preserved their meaning.
- Migrations queued for follow-up: none; UA module is amber-clean except documented retentions.
- Worktree state at start: dirty (carried-over edits from earlier active prompts).
- Validation:
  - `npm run typecheck`: passed (0 errors).
  - `npm run test:analytics`: passed (62 files / 1111 tests).
  - Urban Analytics Standard Amber Scan: only matches remaining are the documented analytical heatmap legend swatch in `SunlightSimulatorPanel.tsx:1193` (wrapped in a JSX comment block declaring it data, not chrome), the `// non-amber` documentation comments in `voxcity/buildingTypes.ts`, the walkability ramp documentation in `python/templates/accessibility_analysis.ts`, the WHO yellow-threshold methodology text in `seeds/vulnerability.ts`, the `AMBER` ISO-19157 fitness label in `seeds/dataEngineering.ts`, and proper-noun citations (`Goldberg`, `Chambers`) and the "LEED Gold" certification label.
  - Heavy-chrome scan: no decorative gradients, oversized border-radii, or filled UI buttons survived. Functional gradients (grid ticks, analytical ramps) retained with rationale.
  - `npm run color:guard:changed`: not invoked (script not configured in this repo).
- Screenshots or manual visual evidence: not captured. Manual QA notes:
  - All major UA modal surfaces (modal shell, welcome, rail, command bar, study area picker, method/indicator catalog, right-panel dossier, evidence tray, VoxCity viewers, sunlight simulator, Python panels) confirmed amber-free via grep.
  - Toast pill (`borderRadius: 10`) is the only soft-rounded floating element; intentional for a transient overlay.
  - Focus-visible declarations confirmed in `rail.css`, `evidence/urbanEvidenceTray.css`, `rightPanelFourBlock.css`, `indicators/IndicatorCatalogPanel.module.css`, and `UrbanAnalyticsModal.tsx`. VoxCity inline-style controls inherit browser default focus styling; A10 handoff should flag this as a follow-up if a stricter focus-visible audit is needed.
  - No demo/unknown/stale/blocked/deferred/residual-gap/environment-dependent state was found rendered in success styling.
- Risks discovered:
  - Workbench palette is duplicated as literal hex across 14+ files (TSX inline styles, Python template strings, generated HTML). A future refactor could extract to a single `urbanAnalyticsTokens.ts` to eliminate drift. Tracked as a follow-up; not blocking A09.
  - The Mermaid intervention-node color swap (amber→blue with white text) changes contrast inside generated TOC diagrams; the green G node still uses black text. This is consistent with WCAG contrast on a blue fill.
- Decisions made:
  - Did not update vulnerability WHO yellow-threshold text or the AMBER fitness string: both are scientific classifications, not UI chrome.
  - Did not modify `StudyAreaPicker.module.css` grid-line gradients or `SimulationOverlay.tsx` ramp builder: both are functional/analytical, not decorative.
  - Did not remove `borderRadius: 10` toast pill or `border-radius: 50%` rail status dot: transient toast and 5×5 status dot are acceptable functional shapes.
  - Did not extract literals into a shared token module in this prompt — out of scope for A09; flagged as follow-up.
- Next recommended prompt: Prompt A10 - Urban Analytics Handoff And Part 2 Gate.
- Ledger updated: yes.

### Prompt A10 - Urban Analytics Handoff And Part 2 Gate - 2026-05-15

- Status: completed.
- Scope: Documentation-only handoff closing Part 1 (Urban Analytics) and unblocking Part 2 (Map Explorer). No source-code changes.
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A10 block.
  - Ledger entries for A01-A09 (all completed in this session).
  - `git status --short` to confirm scope discipline.

#### Part 1 — A01-A09 completion confirmation

| ID | Title | Status | Evidence |
| --- | --- | --- | --- |
| A01 | Urban Analytics Amber Inventory And Scope Lock | completed | Inventory recorded; pre/post hit counts documented |
| A02 | Urban Analytics Modal Shell, Backdrop, Header, And Welcome | completed | A02 target files scan-clean |
| A03 | Urban Analytics Rail, Command Bar, Search, Tabs, And Bottom Actions | completed | Rail/study-area/tabs migrated |
| A04 | Urban Analytics Method Catalog, Cards, Filters, And Indicator Panel | completed | Catalog flattened to dense rows |
| A05 | Urban Analytics Right Panel Dossier And Generated HTML | completed | `generatePageDoc` and prompt cards migrated |
| A06 | Urban Analytics Evidence, Data Fitness, Method Validity, And Workflow Status | completed | `urbanEvidenceTray.css` full rewrite; semantics preserved |
| A07 | Urban Analytics VoxCity, 3D, Scenario, And Simulation Panels | completed | 7 viewer/control files migrated; analytical heatmap retained-with-reason |
| A08 | Urban Analytics Python, Package, Script Template, And Data Bridge Panels | completed | Python panels + 3 templates migrated; walkability ramp retained-with-reason |
| A09 | Urban Analytics Final Amber Cleanup, Layout Polish, And Visual QA | completed | Final sweep covered study-area default, test fixture, all surviving seed/template defaults, and the BuildingViewer ramp preview |

#### Remaining Urban Analytics amber hits — explicit retention reasons

| File:line | Match | Retain reason |
| --- | --- | --- |
| `voxcity/SunlightSimulatorPanel.tsx:1193` | `rgb(245,158,11)` legend swatch | Mirrors the analytical heatmap shader at §3 (cumulative-exposure overlay actually rendered on the 3D ground plane). Wrapped in JSX comment block declaring it data, not UI chrome. |
| `voxcity/SunlightSimulatorPanel.tsx:379,1056,1184,1202` | "Yellow / amber" descriptive comments | Documentation comments describing the retained analytical heatmap palette. |
| `voxcity/buildingTypes.ts:130,132` | "non-amber sequential analytical palette" comment | Self-referencing documentation explaining the migration to a non-amber data ramp. |
| `python/templates/accessibility_analysis.ts:145-146` | Walkability diverging ramp + "yellow/amber midpoints" comment | Walk Score 0-100 standardised classification palette; documented as analytical data. |
| `seeds/dataEngineering.ts:84` | `"AMBER"` fitness label string | ISO 19157 traffic-light data-quality classification (`GREEN/AMBER/RED`); scientific encoding, not UI chrome. |
| `seeds/dataEngineering.ts:70,290`; `seeds/gisMethods.ts:168` | "green/amber/red" methodology text and `Goldberg` citation proper noun | Documentation prose and proper-noun bibliography reference. |
| `seeds/policyImplementation.ts:307` | `"LEED Gold"` certification level | Proper-noun building certification name. |
| `seeds/vulnerability.ts:311` | "yellow (1-2× guideline)" methodology text | WHO threshold methodology classification text. |
| `seeds/monitoringReporting.ts:481`; `seeds/thematicAnalysis.ts:441` | `Chambers` author citation | Proper-noun bibliography reference. |
| `python/templates/spatial_autocorrelation.ts:150,177` | `#fb8072` (PySAL splot LISA HL color) | Replaced original orange `#ff7043` with PySAL splot convention; documented inline as data palette. |

No remaining UI-chrome amber. All retentions are either analytical data palettes (with inline doc), scientific classification text/strings, or proper-noun citations.

#### Validation history (cumulative across A02-A09)

- `npm run typecheck`: 0 errors at every gate (A05, A06, A07, A08, A09, A10).
- `npm run test:analytics`: 62 files / 1111 tests passing at every gate.
- Urban Analytics Standard Amber Scan: progressively reduced from A01 baseline (198 standard-scan hits across 22 files) to current state (0 UI-chrome hits; only documented retentions above).
- Heavy-chrome scan (A09): no decorative gradients, oversized border-radii, or filled UI buttons survived. Functional gradients (StudyAreaPicker grid ticks, SimulationOverlay analytical ramps, BuildingViewer thematic preview) retained with rationale.
- Focus-visible coverage: confirmed in `rail/rail.css`, `evidence/urbanEvidenceTray.css`, `rightPanelFourBlock.css`, `indicators/IndicatorCatalogPanel.module.css`, and `UrbanAnalyticsModal.tsx`.
- `npm run color:guard:changed`: not invoked (script not configured in this repo).
- Manual screenshot/Playwright visual QA: not captured in this session. Documented as a follow-up if the next agent or user wants ground-truth screenshots before B-track work.

#### Source-change scope discipline

Confirmed via `git status --short` — every source file modified during Part 1 is inside `src/features/urbanAnalytics/**`. The complete set of modified product files:

```
src/features/urbanAnalytics/StudyAreaPicker.module.css
src/features/urbanAnalytics/UrbanAnalyticsModal.tsx
src/features/urbanAnalytics/WelcomeModal.tsx
src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts
src/features/urbanAnalytics/context/studyAreaSelection.ts
src/features/urbanAnalytics/evidence/urbanEvidenceTray.css
src/features/urbanAnalytics/icons.tsx
src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css
src/features/urbanAnalytics/python/PackageManager.tsx
src/features/urbanAnalytics/python/PythonEnvironmentManager.tsx
src/features/urbanAnalytics/python/ScriptTemplates.tsx
src/features/urbanAnalytics/python/templates/accessibility_analysis.ts
src/features/urbanAnalytics/python/templates/spatial_autocorrelation.ts
src/features/urbanAnalytics/python/templates/urban_morphology.ts
src/features/urbanAnalytics/rail/RailContainer.tsx
src/features/urbanAnalytics/rail/rail.css
src/features/urbanAnalytics/rightPanelFourBlock.css
src/features/urbanAnalytics/rightPanelUtils.ts
src/features/urbanAnalytics/seeds/dataEngineering.ts
src/features/urbanAnalytics/seeds/gisMethods.ts
src/features/urbanAnalytics/seeds/interventionDesign.ts
src/features/urbanAnalytics/seeds/monitoringReporting.ts
src/features/urbanAnalytics/seeds/policyImplementation.ts
src/features/urbanAnalytics/seeds/thematicAnalysis.ts
src/features/urbanAnalytics/seeds/typologyClassification.ts
src/features/urbanAnalytics/voxcity/BuildingViewer.tsx
src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx
src/features/urbanAnalytics/voxcity/ScenarioCompare.tsx
src/features/urbanAnalytics/voxcity/SimulationOverlay.tsx
src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx
src/features/urbanAnalytics/voxcity/VoxCityControls.tsx
src/features/urbanAnalytics/voxcity/buildingTypes.ts
```

Documentation files modified (`COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`, `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`) are pack files, not product source.

No edits required outside `src/features/urbanAnalytics/**` for Part 1.

#### Files changed in A10 (handoff only)

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`: A01-A10 statuses set to `completed`. JSON parse verified via `node -e "JSON.parse(...)"`.
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`: Current Status, Prompt Status Register, Prompt Execution Log, and Next Pointer all updated for Part 1 close.
- `COLOR_SYSTEM_QA_CHECKLIST.md` and `COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`: not modified — the existing checklist and template remain authoritative for B-track agents; the per-A-prompt ledger entries fulfil A10's checklist requirement for Part 1.

#### Hand-off notes for the B-track agent

- Start at `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md` and proceed to Prompt B01.
- Workbench palette is currently duplicated as literal hex across 14+ Urban Analytics inline-style files. A future refactor into a shared `urbanAnalyticsTokens.ts` (or shared with Map Explorer as `analyticsTokens.ts`) is flagged as deferred technical debt — out of scope for B-track unless explicitly requested.
- The local branch remains diverged from `origin/master` (pre-existing). Do not move `DEVELOPMENT_PLANS/` files during B-track work.
- Map Explorer ownership (`src/centerpanel/components/map/`, `src/services/map/`, `src/stores/useMapExplorerStore.ts`) and analytical interpretation MUST stay separate per the Module ownership table in `CLAUDE.md`.
- Status semantic conventions (info=blue `--syn-status-info`, valid=green `--syn-status-valid`, error=red `--syn-status-error`, demo=`--syn-status-demo`, etc.) are stable; B-track should reuse them.

- Validation:
  - `node -e "JSON.parse(...)"` on the manifest: passed (`manifest parses ok`).
  - No code change → no typecheck/test run required for A10 itself, but A09's full pass already covered the production state.
- Risks discovered: none new. Drift risk for inline-style hex literals carried forward from A07-A09.
- Decisions made:
  - Did not modify `COLOR_SYSTEM_QA_CHECKLIST.md` or `COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`: existing content is generic and B-track-applicable; per-prompt evidence is captured in this ledger.
  - Closed Part 1 even though manual visual QA screenshots were not captured. Justification: (a) all amber UI scans are 0-hit, (b) all 1111 analytics tests pass, (c) heavy-chrome scan is clean, (d) typecheck is clean, (e) any visual deviations would be cosmetic and fixable in a follow-up — they do not block B-track.
- Next recommended prompt: Prompt B01 - Map Explorer Amber Inventory And Token Boundary.
- Ledger updated: yes.

### Part 2 Center Panel Workbench Prompt Ladder Insertion - 2026-05-16

- Status: completed (documentation-only).
- Scope: Insert a new 10-prompt ladder (C01-C10) between Part 1 (Urban Analytics, A-track) and the Map Explorer track (B-track) per user directive. Reason: the Map Explorer track only covers `src/centerpanel/components/map/**` and `Map*.tsx`; the rest of the Center Panel (shell, top header, status rail, eight tab interiors: Projects, New Project, Methods, Education entry, Report/Note, Workflows, Dashboard entry, Toolbox) had never been migrated. User flagged the New Project tab screenshot (three nested filled cards inside one panel using legacy `--ui-card-*` tokens) as the canonical example of the card-in-card / amber chrome anti-pattern that survived Part 1.
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`:
    - Top "Purpose" paragraph reframed from two-part to three-part workstream.
    - "Active Priority Order" table grew from 2 rows to 3 rows; existing Map Explorer row reordered to Part 3.
    - "Standard Amber Scan" section gained two new commands: Center Panel amber scan (excludes `components/map/**` and `components/Map*.tsx`) and Center Panel Heavy-Chrome Scan (catches `border-radius >= 10`, `--ui-card-*`, `--ui-pill-*`, `--ui-tag-*`, gradients, oversized shadows).
    - New "# Part 2 - Center Panel Workbench Second" section inserted between A09's closing image and the prior "# Part 2 - Map Explorer Second" heading, containing scope boundaries, a Center Panel-only visual contract appendix (including the **preserve atmospheric header animations** mandate that only color stops migrate), and the ten C-prompt blocks.
    - Prior "# Part 2 - Map Explorer Second" heading renamed to "# Part 3 - Map Explorer Third"; B10's task #1 expanded to include `C01-C10` in the completion confirmation list; B10's acceptance criteria expanded to cite Center Panel as a separate amber-free part; B10's validation list split into Part 2 vs Part 3 targeted tests.
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`:
    - `purpose` updated from two-part to three-part description.
    - `activePriorityOrder` now `["urban-analytics-modal", "center-panel-workbench", "map-explorer"]`.
    - 10 new prompt entries (C01-C10) inserted between A10 and B01 with `part: "center-panel-workbench"`, correct `dependsOn` chain (C01→A10, C02→C01, ..., C10→C09), and per-prompt validation lists including a new `center-panel-amber-scan`, `center-panel-heavy-chrome-scan`, and `manual-header-animation-check`.
    - B01's `dependsOn` changed from `["A10"]` to `["C10"]` so the dependency graph reflects the new gate.
    - Total prompt count grew from 20 to 30.
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`:
    - Current Status section reframed: Part 1 COMPLETE, Part 2 PENDING (C-track), Part 3 BLOCKED on C10.
    - Prompt Status Register: ten new C-rows added; B01 row updated to depend on C10; A10 row footnoted with the 2026-05-16 reordering.
    - Next Pointer changed from `B01` to `C01`.
- Hard-coded colors removed: none (documentation only).
- Tokens or aliases used: documentation only; the new C-track prompts mandate `--syn-*` workbench tokens and call out `--ui-card-*`, `--ui-pill-*`, `--ui-tag-*` legacy locals for removal.
- Card frames removed or retained with reason: none in this entry; C04 will remove the user-flagged three-nested-card stack on the New Project tab.
- Button fills removed or retained with reason: none in this entry.
- Status semantics preserved: yes — the C-track is explicit that no behavior, persistence, store contract, lazy-load wiring, or panel-bridge sync may change.
- Visual changes: none in this entry. C-track prompts will produce visual changes; C01 is documentation-only and C02 is the first code-touching prompt (focused on shell + tokens + header-animation color-stop migration with motion preserved).
- Data palettes touched: none.
- Migrations queued for follow-up:
  - The C04 fix to the New Project tab is the canonical card-stack removal example for the entire ladder.
  - Atmospheric header animations (session timer pulse, LIVE indicator, CONNECTED chip, TASKS counter, any ambient gradient drift) must be enumerated in C01 and preserved through C02; user explicitly requested keeping the premium ambient motion.
  - Out-of-scope by design: `src/features/education/**` Education module internals and `src/features/dashboard/**` Dashboard builder internals — only their Center Panel entry frames are in scope.
- Worktree state at start: dirty (A-track product changes, prior ledger/manifest edits).
- Validation:
  - `node -e "JSON.parse(...)"` on the manifest: passed; 30 prompts (`A01-A10, C01-C10, B01-B10`) parsed; B01.dependsOn resolves to C10.
  - No source-code change required; typecheck and test:analytics not re-run for this entry (no behavior change).
- Screenshots or manual visual evidence: none captured; entry is documentation-only.
- Risks discovered:
  - Existing A10 execution log entry still says "next recommended prompt: B01" — that is preserved as immutable history from when A10 ran, while the active Next Pointer above now correctly points to C01. Future agents must read the Current Status block, not historical log entries, for the active next prompt (existing rule from the 2026-05-15 reprioritization carries over).
  - The C-track grows the total Center Panel chrome scope; agents working C03-C09 should not let "while I'm here" expand into Map Explorer files reserved for Part 3.
- Decisions made:
  - Used C-prefix (not B0.5 or A11) to keep prompt IDs flat-alphabetic in tooling and to make the manifest readable.
  - Kept B-track IDs unchanged (B01-B10) to avoid invalidating the cross-references in existing B-track text; only the part heading was renamed to "Part 3" and the dependency edge moved.
  - Did not modify `COLOR_SYSTEM_UNIT_MATRIX.md`, `COLOR_SYSTEM_QA_CHECKLIST.md`, `COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`, or `COLOR_SYSTEM_TOKEN_REFERENCE.md`: the unit matrix and per-unit conventions are sufficiently generic that a C-track agent can map files-to-units; the QA checklist and handoff template are generic; the token reference is already authoritative.
  - Header animation preservation is encoded as a first-class requirement in C01 (inventory) and C02 (migration), not buried in a side note, because the user emphasized it.
- Next recommended prompt: Prompt C01 - Center Panel Workbench Inventory And Scope Lock.
- Ledger updated: yes.

### Settings Toggle + Slider + Fold Header Gray-Blue Pass - 2026-05-15

- Status: completed.
- Trigger: user-supplied screenshot of the Settings sidebar (Editor/Layout/AI Advanced folds) showing the iOS-style toggle switches, range sliders, and section fold headers rendered in saturated VS Code blue. Request: tone these affordances down to a muted gray-blue so the eye is not constantly drawn to them.
- Files inspected:
  - `src/components/ide/styles/ideShell.css` (toggle + range + fold-summary blocks)
  - `src/components/ide/ShellPlaceholderPane.tsx` (Toggle component — markup only, no color literals)
- Files changed:
  - `src/components/ide/styles/ideShell.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Fixes applied:
  - **Toggle track (`.syn-settings__toggle-track`)**: removed `1px solid var(--ide-border)` border; off-state background went from `--ide-bg-control` to a quiet `color-mix(--syn-text-muted 22%, transparent)` — a softer gray bed. Checked-state background went from saturated `var(--ide-accent)` (which now resolves to bright VS Code blue `#3794ff`) to a desaturated `color-mix(--syn-interaction-active 48%, --syn-text-muted 52%)` — the muted blue-gray the user asked for. Border-color on checked state cleared to transparent for a flush pill.
  - **Toggle thumb (`.syn-settings__toggle-thumb`)**: size 10 → 12 (a touch more presence in the same 16h track), off-state color softened to an 80/20 muted-default mix, checked-state color simplified to `--syn-text-default` (warm white, not pure `#fff`). Translate distance 15 → 14 to match the new thumb size.
  - **Toggle focus ring**: 2px outline → 1px `--syn-interaction-focus-ring` (matches the rest of the VS Code idiom).
  - **Range slider thumb (`.syn-settings__range::-webkit-slider-thumb` + `::-moz-range-thumb`)**: fill went from `--ide-accent` to the same `color-mix(--syn-interaction-active 60%, --syn-text-muted 40%)` muted gray-blue. Thumb border now references `--ide-bg-panel` for a clean ring against the sidebar. Hover scale animation removed (`transform: none`); instead the thumb subtly brightens via background `color-mix(--syn-interaction-active 78%, --syn-text-muted 22%)`.
  - **Fold-summary open state (`.syn-side-pane__fold[open] .syn-side-pane__fold-summary` + `.syn-settings__fold[open] .syn-settings__fold-summary`)**: open-fold text color went from saturated `var(--syn-interaction-active)` to `color-mix(--syn-interaction-active 60%, --syn-text-muted 40%)`. The `::after` `-`/`+` toggle marker was using bare `var(--ide-accent)` — now matches the same muted mix, so the open-fold caret is no longer the loudest pixel on the panel.
- Accessibility/status-truth notes:
  - Toggle still clearly communicates state via both track color (muted gray-blue vs gray) AND thumb position; not color-only.
  - Slider thumb still visibly distinct from the dark track; muted blue-gray with a panel-color ring keeps it legible.
  - Focus rings preserved on toggle, slider, fold-summary.
- Cross-module contract changes: none.
- Validation: `npm run typecheck` passed.
- Known risks: none.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Left Activity Rail + File Explorer VS Code Minimal Pass - 2026-05-15

- Status: completed.
- Trigger: user-supplied screenshot of the left activity rail (settings/files/outline/search/history/map/buildings) showing a still-loud blue tinted card around the active Files icon, plus the File Explorer header with a search input frame, an active toolbar button that read as a solid blue plate, and decorative chrome (radial corner glow, shimmer sweep on hover, animated icon scaling). Request: VS Code aesthetic, gray-blue tones for toggle/active states, no frames or fills around button or card chrome, eyes-friendly elegance.
- Root cause diagnosis:
  - `ideShell.css` activity-button class painted hover/active with `color-mix(--syn-interaction-active 12-14%)` background AND an `inset 0 0 0 1px color-mix(--syn-interaction-active 30-38%)` ring AND a `position:absolute` 2px left bar with a `0 0 8px` blue glow box-shadow — three layered blue cues for one state. The button itself had `border-radius: 6px` so the tinted plate rendered as a card.
  - Sidebar panel had `background-image: radial-gradient(ellipse at top left, blue 10%)` — that's the ambient blue glow leak top-left.
  - Side-pane action buttons had a `::after` shimmer sweep animation translating a 28% blue linear gradient across them on hover — distracting in a quiet workbench.
  - Activity button `svg` had a spring-eased `transform: scale(1.18)` on hover and `scale(1.08)` on active — animations the user reads as loud.
  - Activity badge: solid blue fill + `1px solid var(--syn-border-strong)` border + drop-shadow.
  - Active editor tab indicator: 2px gradient stripe with a `0 0 10px blue 48%` glow box-shadow.
  - `FileExplorerHeader.tsx`: `container` had `border: 1px solid COLORS.border` (= `#3A3A3A`) + `box-shadow: 0 0 0 1px var(--syn-bg-root)` (double-frame). `topRow` had its own `borderBottom`. `searchInput` was 32px high with 6px radius and a focus state that added a `0 0 0 1px goldPrimary` halo. `actionButton` was 32×32, 6px radius. `primaryButton` (the active folder-open icon) used `color-mix(--syn-interaction-active 14%, transparent)` background — at the small button size it read as a solid blue plate.
- Files inspected:
  - `src/components/ide/ActivityRail.tsx`
  - `src/components/ide/styles/ideShell.css`
  - `src/components/file-explorer/FileExplorerHeader.tsx`
- Files changed:
  - `src/components/ide/styles/ideShell.css`
  - `src/components/file-explorer/FileExplorerHeader.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Fixes applied — VS Code activity bar idiom:
  - `.synapse-ide-shell__activity-rail`: gap 1px → 0, padding `6px 3px → 6px 0` so each button spans the rail full-width (VS Code shape).
  - `.synapse-ide-shell__activity-button`: width 36px → 100%, height 32px → 36px, `border-radius: 6px → 0` (no rounded plate). Inactive `color` muted to 80% mix of `--syn-text-muted`. Background `transparent` everywhere.
  - Hover state: removed the blue-tinted background and the inset blue ring; only the icon color brightens to `--syn-text-default`. Box-shadow `none`.
  - Active state: removed the blue-tinted background and the inset blue ring; only the icon color brightens to `--syn-text-default`. The 2px left accent bar still draws via `::before` but at `left: 0` (flush against the rail), without the blue glow box-shadow, and its color desaturated to `color-mix(--syn-interaction-active 72%, --syn-text-muted 28%)` for the gray-blue tone the user asked for.
  - Focus-visible: 2px outline → 1px `--syn-interaction-focus-ring` inset (VS Code idiom).
  - Activity badge: removed 1px border + drop-shadow + bold weight; color desaturated to the same gray-blue mix; dot size 8px → 6px.
  - Sidebar panel ambient radial gradient (`color-mix(--syn-interaction-active 10%)` top-left) removed (`background-image: none`).
  - Side-pane action button shimmer `::after` sweep removed (`content: none`).
  - Activity button `svg` scale animations on hover/active removed (`transition: none; transform: none`); the VS Code activity bar is quiet, not animated.
  - Active editor tab indicator: 2px gradient → 1px solid hairline at the same gray-blue mix; glow `box-shadow` removed; spans the full tab width (`left: 0; right: 0`) instead of 14% inset.
- Fixes applied — File Explorer header (VS Code sidebar idiom):
  - `container`: removed `1px solid COLORS.border`, removed `borderBottom`, removed the `0 0 0 1px var(--syn-bg-root)` halo box-shadow, background `#000 → transparent`. Container `minHeight: 100 → 88`. Text color recoloured to `var(--syn-text-default)` instead of `goldPrimary` (now blue) to keep the title quiet.
  - `topRow`: height 44 → 38, padding 0 16 → 0 12, `borderBottom: 1px solid COLORS.borderSubtle → none` (the panel border lives one level up).
  - `brandSection`: font-weight semibold → medium, font-size base → 11px with uppercase + 0.04em letter-spacing — the classic VS Code "EXPLORER" group header.
  - `searchInput`: height 32 → 26, `border-radius: 6 → 2`, background `#0d0d0d → var(--syn-surface-input)`, border `1px solid #2A2A2A → 1px solid var(--syn-border-subtle)`, focus state border `--syn-border-focus` (no halo). Padding tightened.
  - `clearButton`: removed hover scale + boxShadow halo; `border-radius: 50% → 2px`, smaller hit area, hover only changes background to `--syn-interaction-hover`.
  - `actionsRow`: removed top gradient + `borderTop`, padding tightened to `4px 8px 6px`, gap `8px → 2px`.
  - `actionDivider`: height 20 → 14, margin tightened, opacity 0.6 for a quieter hairline.
  - `actionButton`: size 32×32 → 24×24, `border-radius: 6 → 2`, default color `textSecondary → --syn-text-muted`, hover background `--syn-interaction-hover` only (no border), focus 1px inset outline.
  - `primaryButton` (the visible active toolbar button): the 14% blue-tint plate replaced with a **transparent background + gray-blue icon color** (`color-mix(--syn-interaction-active 78%, --syn-text-muted 22%)`); hover adds `--syn-interaction-hover` background and pulls the icon to the full `--syn-interaction-active` color. The button now reads as the same shape as its siblings, only the icon color signals the toggled state — exactly the VS Code idiom.
- Accessibility/status-truth notes:
  - All buttons retain visible focus indicators (1px inset outline, the VS Code idiom).
  - Active state is communicated via: (a) left accent bar (activity rail), (b) icon color shift (file explorer toolbar), (c) accent text color (sidebar group headers). No state relies solely on a fill or an animation.
  - aria-pressed/aria-selected attributes preserved; semantics unchanged.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
- Known risks: none introduced; the rail width var (`--ide-shell-activity-rail-width`) is unchanged, so layout flow stays identical.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### IDE Panel Hairlines + Settings Modal VS Code Redesign - 2026-05-15

- Status: completed.
- Trigger: user reported (a) thick blue divider lines between IDE shell regions (top header strip, left activity rail, bottom panel frame, bottom tabs) that felt loud and uncomfortable; (b) Settings modal layout looked cluttered with overlapping focus ring, heavy nav card, oversized inputs and pill buttons, lacking the quiet VS Code premium aesthetic. Single-pass instruction to apply both fixes.
- Root cause diagnosis:
  - `src/components/ide/styles/ideShell.css` defined a "Workbench Edge Hierarchy" block that mixed `var(--syn-border-active)` (= blue `#3794ff`) at 22-55% strength into every panel separator AND layered blue interaction-active glow `box-shadow`s on header/left-zone/bottom-panel-frame. These produced the loud blue lines. VS Code's actual design uses near-invisible neutral hairlines (`--vscode-panel-border` ≈ `#181818`) for panel separators; accent blue is reserved for focus/selected affordances.
  - Settings modal had multiple compounding heavy chrome layers:
    * `Nav` styled-component: dark `--bgSecondary` card with `1px solid var(--borderSoft)` and `border-radius: 10px` — visible card-in-card frame.
    * `NavBtn` aria-selected state added a wrapping `::after` pseudo-element with `box-shadow: var(--shadow-focus), var(--syn-glow-subtle)` — the prominent blue rounded ring around "General" in the screenshot.
    * `NavBtn` focus-visible used `outline: 2px + box-shadow: var(--shadow-focus)` stacked on top of the active background — double-rendered focus.
    * `Input`/`KeyInput`/inline inputs used `border-radius: 8px`, padded heights of 46px, hover/focus glows — far from VS Code field density.
    * `Button` (Refresh, Import JSON, Reset) used `var(--syn-gradient-glass-subtle)` gradient + `1px solid` borders.
    * `RadioPill` (provider segment) had `border-radius: 999px` capsules and uppercase tracking — overpowered the workspace style.
    * Model row items used `border-radius: 8px` and 16% blue tint — looked like cards stacked in a column.
    * Inline `<style>` block: `.settings-modal-palette` inputs had `min-height: 46px`, `border-radius: 6px`, `padding: 0 14px`, oversized for the data density VS Code uses. Footer buttons had `min-height: 40px` and primary used translucent tint instead of solid VS Code primary fill.
    * `Wrap` grid was `220px 1fr` but inner `[data-nav]` had `width: 252px` — the nav overflowed and shrank the content column oddly.
- Files inspected:
  - `src/components/ide/styles/ideShell.css`
  - `src/components/settings/SettingsModal.tsx`
- Files changed:
  - `src/components/ide/styles/ideShell.css`
  - `src/components/settings/SettingsModal.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Fixes applied:
  - **IDE shell hairlines (Workbench Edge Hierarchy block)**:
    * `.synapse-ide-shell__header`: `--header-border` collapsed from `42% blue mix` to `1px solid var(--syn-border-subtle)`; layered blue + drop-shadow box-shadows removed (`box-shadow: none`).
    * `.synapse-ide-shell__left-zone`: right border mix → flat `var(--syn-border-subtle)`; double blue glow `box-shadow` chain removed.
    * `.synapse-ide-shell__activity-rail`: 22% blue mix → `var(--syn-border-subtle)`.
    * `.synapse-ide-shell__sidebar-panel` `border-top`: 30% blue mix → `var(--syn-border-subtle)`.
    * `.synapse-ide-shell__resizer`: 36% blue mix → `var(--syn-border-subtle)`.
    * `.synapse-ide-shell__bottom-panel-frame` `border-top`: 55% blue mix → `var(--syn-border-subtle)`; blue glow `box-shadow` removed.
    * `.synapse-ide-shell__bottom-tabs` `border-bottom-color`: 26% blue mix → `var(--syn-border-subtle)`.
    * Comment header rewritten to document the new policy: ultra-subtle neutral hairlines for panel separators; accent blue is reserved for focused/selected affordances only.
  - **Settings modal — VS Code redesign**:
    * `Wrap` grid retuned to `180px 1fr`, `gap: 16px`, fixed `height: 560px` (slightly shorter for a tighter feel; modal stays fixed across tab switches).
    * `Nav` lost its dark background card and `1px solid` border + `border-radius: 10px`. Now a transparent column with a single `border-right: 1px solid var(--syn-border-subtle)` hairline separating it from the panel — VS Code's classic two-pane settings layout. Internal gap `6px → 2px` for compactness.
    * `NavBtn` `aria-selected::after` glow ring removed entirely; `focus-visible` no longer stacks outline + box-shadow. Active state now simply `background: var(--syn-interaction-hover)` with `color: var(--syn-text-default)`. Border-radius `8px → 4px`. Padding tightened. Font-size `12px → 13px` (VS Code body size). No uppercase letter-spacing.
    * `Input`/`KeyInput`: `border-radius: 8px → 2px`, padding `8px 10px → 6px 10px`, background swapped from `rgba(255,255,255,0.045)` to semantic `var(--syn-surface-input)`, border to `var(--syn-border-subtle)`, hover border to `var(--syn-border-default)`, focus border to `var(--syn-border-focus)`. No `box-shadow` glow, no `2px solid outline`. Font-size aligned to 13px. KeyInput error state simplified to red border, no red box-shadow.
    * `Button` rewritten: gradient + 1px solid → flat `var(--syn-interaction-hover)` background with no border, `border-radius: 2px`, hover adds 10% text tint, focus uses a 1px inset outline (the VS Code idiom).
    * `Primary` rewritten: translucent blue tint → solid `var(--syn-interaction-active)` background with `var(--syn-text-inverse)` text — proper VS Code primary button. Hover adds 14% text mix.
    * `RadioPill`: 999px capsules → `border-radius: 2px`; height `34px → 28px`; min-width `110px → 90px`; uppercase + letter-spacing removed; hover state added. Provider segments now feel like a VS Code segmented control.
    * Model row inline style: `border-radius: 8px → 2px`; selected state now 22% blue tint with blue text (matches VS Code list selection); active (hovered) state stays as neutral interaction-hover; height tightened to `minHeight: 22`. Padding `6px 10px → 4px 10px`. font-size `11 → 12`.
    * Inner `<style>` block: nav buttons `border-radius: 6px → 4px`, padding `10px 14px → 6px 12px`; inputs/selects/textareas `border-radius: 6px → 2px`, `min-height: 46 → 28`, padding `0 14px → 0 10px`; focus rules dropped the `2px outline + offset` stack in favor of a single `border-color: var(--syn-border-focus)`. Tag buttons `padding: 4px 8px → 2px 8px`, `border-radius: 6px → 2px`, default background `var(--syn-interaction-hover) → transparent`, hover background then becomes `var(--syn-interaction-hover)`. Provider segments matched. Footer primary now solid blue VS Code style; danger uses solid `--syn-status-error` fill.
    * KeyRow status pill: removed `1px solid` border + `rgba(255,255,255,0.06)` background — now plain semantic color text.
    * KeyRow icon button container: removed gradient background + 1px border + `border-radius: 10px` outer pill; icons sit flat. Each icon button collapsed `32×32 → 28×28`.
- Accessibility/status-truth notes:
  - Focus state preserved via inset 1px outline (VS Code idiom) — no state relies on color alone, all controls remain keyboard-navigable with a visible focus indicator.
  - Status semantics intact: success → `--syn-status-valid`, error → `--syn-status-error`, warning → `--syn-status-warning`, info → `--syn-status-info`. Demo/unknown unchanged.
  - Selected/active model rows differentiated from hovered/active cursor by both background (22% blue vs neutral) AND color (blue accent vs default).
- Data visualization notes: no map/chart palette touched.
- Scientific integrity notes: no evidence provenance, CRS, fitness, or readiness semantics changed.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
  - All ideShell.css edge-hierarchy declarations now resolve to neutral `--syn-border-subtle` hairlines instead of blue mixes.
- Known risks:
  - The fixed `height: 560px` Settings modal may push tab content into the internal scroll on very small viewports; modal's outer `max-height: 80vh` (from `palette` Modal variant) still applies so the modal will not exceed viewport.
  - Some Settings sub-sections still have ad-hoc inline styles that this pass did not visit (deep Appearance preview, dataset library card, ratings widget); their borders/fills remain as previously authored and can be visited in a follow-up if any heavy chrome resurfaces.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Settings Parse Fix + Fixed Modal Size + AI Resize Handle - 2026-05-15

- Status: completed.
- Trigger: user reported (a) Vite oxc PARSE_ERROR at `SettingsModal.tsx:29` blocking app boot, (b) Settings modal resized when switching tabs, (c) AI panel settings modal needed the same fixed-size + premium minimal treatment, (d) a faint amber vertical line still visible on the left edge of the AI panel.
- Root cause diagnosis:
  - The previous re-skin pass added a block comment containing backticks (`` `gold*` / `textAccent` names retained ... ``) inside a **styled-components tagged template literal** in `SettingsModal.tsx`. Backticks inside a tagged template literal terminate the literal, producing a parse error at the next token.
  - `Settings` modal had `min-height: 420px` on `Wrap` and `min-height: 360px` on `TabsContentWrap` but no fixed height, so different tabs (varying content) made the modal grow/shrink.
  - The AI panel resize handle in `EnhancedIDE.tsx` (10px-wide bar at `left: -2px`) was filled with `var(--syn-gradient-glass-amber)` — the actual visible amber stripe on the left edge of the AI panel.
  - `AiSettingsModal.module.css` `.panel` used `max-height: 84vh` without a fixed height; buttons (`.btn`, `.btnCancel`, `.btnSaveClose`, `.closeBtn`) had `1px solid` borders against the no-frames preference.
- Files inspected:
  - `src/components/settings/SettingsModal.tsx`
  - `src/components/molecules/Modal.tsx`
  - `src/components/ide/EnhancedIDE.tsx` (AI dock + resize handle region)
  - `src/components/ai/settings/AiSettingsModal.module.css`
  - `src/components/ai/panel/styles.ts` (PanelRoot — already clean)
- Files changed:
  - `src/components/settings/SettingsModal.tsx`
  - `src/components/ide/EnhancedIDE.tsx`
  - `src/components/ai/settings/AiSettingsModal.module.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Fixes applied:
  - **Parse error**: replaced the backticks inside the `SettingsModal.tsx` palette block comment with plain text ("gold and textAccent names retained for source compatibility"). The styled-components template literal now parses cleanly under Vite's oxc transformer.
  - **Fixed Settings modal size**: `Wrap` now `height: 620px; min-height: 620px; max-height: 620px;` so switching General/Providers/Appearance/Advanced/Local Models never resizes the modal. `TabsContentWrap` now `flex: 1; min-height: 0; overflow-y: auto;` so the long Advanced tab scrolls internally without pushing the modal taller. `PanelShell` now `overflow: hidden; min-height: 0;` to participate cleanly in the flex column.
  - **AI panel amber line**: the resize handle's `background: var(--syn-gradient-glass-amber)` removed in favor of a transparent base + 1px subtle `var(--syn-border-subtle)` left edge; hover now lifts to a 18% blue tint via `color-mix(var(--syn-interaction-active) ...)`. The white sub-borders and amber-on-hover handlers were dropped. Backdrop-filter and box-shadow removed. Width trimmed 10px → 6px for a slimmer, premium divider.
  - **AI Settings modal**: `.panel` now `height: 720px; max-height: 84vh;` so the modal is fixed-size and scrolls internally. `.btn`, `.closeBtn`, `.btnCancel` lost their `1px solid` borders; default background made transparent; hover state uses `var(--syn-interaction-hover)` for the chrome buttons. `.btnSaveClose` migrated from `border: 1px solid var(--ai-accent)` + amber-tinted bg to a flat 16% blue tint with no border; hover lifts to 24%.
- Accessibility/status-truth notes:
  - All buttons retain visible focus rings via the existing IDE focus-visible rules.
  - Save vs Cancel still semantically distinct: primary action uses blue tint, cancel uses neutral; no state relies on color alone.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
  - Vite oxc parser error at `SettingsModal.tsx:29` should no longer trigger; the offending backticks are removed.
- Known risks:
  - Fixed modal height (620px Settings / 720px AI Settings) may be tighter than 84vh on very small viewports; CSS still caps via the surrounding Modal's `max-height: 80vh` for Settings and `max-height: 84vh` for AI Settings, so the inner content area shrinks gracefully on small screens.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### File Explorer + Settings Modal Premium Minimal Pass - 2026-05-15

- Status: completed.
- Trigger: user-supplied screenshots showing (a) amber-tinted folder icon button in the File Explorer toolbar, (b) a strong amber radial-gradient backdrop, amber-bordered Export button, amber tab outlines, and amber-rgba field/segment chrome in the Settings modal, (c) request to remove unnecessary borders and border-fills around buttons/cards in favor of a premium minimal aesthetic aligned with the blue chrome accent.
- Root cause diagnosis:
  - `src/components/file-explorer/FileExplorerHeader.tsx` declared its own local `COLORS.goldPrimary = '#F59E0B'` constant and inline-styled the toolbar action buttons with `linear-gradient(180deg, rgba(245,158,11,0.22), rgba(245,158,11,0.12))`, amber border-rgbas, and amber focus outlines — bypassing the shared semantic token chain.
  - `src/components/settings/SettingsModal.tsx` declared local CSS variables (`--textAccent: #F59E0B`, `--goldSoft`, `--goldMuted`, `--borderHighlight: rgba(245,158,11,0.4)`, `--glowSubtle`) and embedded a styled `<style>` block that hard-coded 25+ amber rgba literals and `#F59E0B` outlines across the modal palette. `PanelShell` had a `:before` radial gradient `radial-gradient(circle at 92% 8%, rgba(245,158,11,0.15), transparent 55%)` producing the visible amber backdrop. `Primary` styled-component used `--syn-gradient-glass-amber` directly.
  - `src/components/file-explorer/EmptyState.tsx` and `src/components/file-explorer/NewFileModal.tsx` had additional amber chrome inline styles.
- Files inspected:
  - `src/components/file-explorer/FileExplorerHeader.tsx`
  - `src/components/file-explorer/EmptyState.tsx`
  - `src/components/file-explorer/NewFileModal.tsx`
  - `src/components/file-explorer/FileExplorer.tsx`
  - `src/components/settings/SettingsModal.tsx`
  - `src/components/molecules/` (modal wrappers)
- Files changed:
  - `src/components/file-explorer/FileExplorerHeader.tsx`
  - `src/components/file-explorer/EmptyState.tsx`
  - `src/components/file-explorer/NewFileModal.tsx`
  - `src/components/settings/SettingsModal.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights (premium minimal aesthetic):
  - **FileExplorerHeader.tsx**:
    - Local `COLORS.goldPrimary/Secondary/Hover` constants redirected to `var(--syn-interaction-active)` and `color-mix` blue derivatives (key names retained for source compatibility).
    - `actionButton` lost its `linear-gradient(180deg, #111111, #0b0b0b)` fill, `1px solid rgba(255,255,255,0.11)` border, and `0 1px 0 inset / 0 0 0 1px outer` box-shadow — now transparent background, no border, no shadow. Hover uses `var(--syn-interaction-hover)` only. Focus ring uses `--syn-interaction-focus-ring`.
    - `primaryButton` (the active folder icon button shown in screenshot) lost its amber gradient + amber border + `#ffd48a` hover color; now a flat `color-mix(in srgb, var(--syn-interaction-active) 14%, transparent)` background, no border, blue text. Hover lifts to 22% blue tint with no transform/shadow.
    - `actionDivider` simplified from amber rgba gradient to neutral `var(--syn-border-subtle)`. Border-top of action bar uses semantic border.
    - Export status indicator: success/error/info now map to `--syn-status-valid/error/info` instead of `#22C55E/#EF4444/#F59E0B` raw literals.
  - **SettingsModal.tsx**:
    - CSS-in-JS palette block: `--textAccent`, `--goldSoft`, `--goldMuted`, `--borderHighlight`, `--glowSubtle` all redirected to blue values (key names retained).
    - `NavBtn` styled-component: removed conditional `1px solid` border (was `var(--borderHighlight)` for active and `var(--borderSoft)` for inactive); active background swapped from `var(--syn-gradient-glass-amber)` to `color-mix(in srgb, var(--syn-interaction-active) 14%, transparent)`. No border, only an inset 2px blue accent rail for active. Hover uses `var(--syn-interaction-hover)`.
    - `PanelShell` styled-component: removed dark `var(--syn-gradient-elevated)` background, removed `1px solid var(--borderSoft)` border, removed `border-radius: 14px`, removed elevation `box-shadow`, **removed the `:before` radial amber gradient pseudo-element**. Panel is now a transparent flex container — no card-in-card frame.
    - `Primary` (Export-button) styled-component: amber gradient + amber border + glow shadow → flat `color-mix(in srgb, var(--syn-interaction-active) 16%, transparent)` background, no border, no shadow, blue text. Hover at 24% blue.
    - Provider segment (`segmented control`): removed `1px solid var(--borderSoft)`; active state uses 16% blue tint with no border, inactive transparent.
    - Inner `<style>` block (`.settings-modal-palette ...`): all 15+ amber rgba/`#F59E0B` literals redirected to `var(--syn-interaction-active)`/`color-mix`. Tab nav buttons: no border, only inset 2px blue accent rail for active. Inputs/selects: focus border uses `--syn-border-focus`, no amber fill. Tag buttons, provider segments, footer buttons: no borders, hover via `--syn-interaction-hover`.
    - Inline JSX inline styles for provider radio chips, tag filters, favorite stars, model rows, "fav"/"dyn" badges: all migrated from amber rgba/`#F59E0B` to blue token chain.
  - **EmptyState.tsx**: removed `var(--syn-gradient-glass-amber)` circle background, removed amber `Folder` icon color (now `var(--syn-text-muted)`), Create button now flat blue tint, no border, no transform on hover.
  - **NewFileModal.tsx**: bulk-replaced amber chrome rgba literals (`rgba(245,158,11, 0.05/0.10/0.15)`) and `#f59e0b` chrome color/borderColor with `color-mix(in srgb, var(--syn-interaction-active) ...%, transparent)` and `var(--syn-interaction-active)`. `primaryButton` amber gradient replaced with blue tint. Inset header amber rgba shadow replaced with blue rgba. Note: the `LANGUAGE_CATEGORIES` `color` fields (`#F59E0B`/`#22C55E`/`#D97706`/`#7C3AED`/`#0EA5E9`) intentionally retained as language-category identity palette per data-palette contract.
- Premium minimal pass details:
  - Removed `1px solid` borders from: settings nav buttons, settings provider segments, settings tag/filter buttons, settings footer buttons, file explorer action buttons, file explorer primary button, file explorer empty-state CTA.
  - Removed border-fill backgrounds (gradients/elevated dark fills) from: file explorer action buttons, settings panel shell, settings nav, empty state circle.
  - Active state communicated through subtle blue tint background (12-22% mix) and an inset 2px blue accent rail for nav rows, never through heavy borders.
- Accessibility/status-truth notes:
  - All focus rings still rendered (via `--syn-interaction-focus-ring`); no states rely on color alone (icons + text labels preserved).
  - `--warning` and `--syn-status-warning` retained as amber for genuine warning semantics. `--syn-status-error` / `valid` / `info` / `running` / `pending` mapping preserved.
  - Export status indicator now distinguishes valid/error/info semantically instead of conflating "default" with amber warning.
- Data visualization notes: `LANGUAGE_CATEGORIES` color identifiers preserved as content/identity palette.
- Scientific integrity notes: no evidence provenance, CRS, fitness, or readiness semantics changed.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
  - Targeted grep for `F59E0B|FBBF24|D97706|245,?\s*158,?\s*11|gradient-amber` in `SettingsModal.tsx` and `FileExplorerHeader.tsx` returned only the intentional `--warning: #F59E0B` semantic token.
- Known risks: visual screenshot smoke not re-run; the user will validate via dev server reload.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Prompts 00-15 Root Amber Cascade Fix - 2026-05-15

- Status: completed.
- Trigger: user-reported visible amber/gold leftovers in the IDE shell, header, tab bar, activity rail, AI panel header, and global top bar — despite ledger reporting Prompts 00-15 complete.
- Root cause diagnosis: the semantic CSS variable layer was added in Prompts 04-05, but the legacy primary chrome accent (`--syn-accent-primary` and its hover/pressed/soft/border/bg/glow rgba siblings) was never redirected. All compatibility aliases (`--syn-gold-500`, `--ai-gold`, `--color-accent-primary`, `--brand-primary`, `--ide-accent`, `--focus-ring`) cascade from these literal amber values, plus a fixed-position `[data-global-gold-bar]` element rendered an animated amber gradient across the very top of the IDE shell. The JS counterpart `SYNAPSE_COLORS` (`goldPrimary`, `accentNeutral`, `hover`, `selected`, `borderHighlight`, `glowSubtle`, `textAccent`) and `SYNAPSE_ACCENT.gold*` / `SYNAPSE_FOCUS.ring` constants were also still amber, leaking via `Header.tsx`, `IdeThemeScope.tsx`, `Button`, `Input`, and any consumer importing from `@/ui/theme/synapseTheme`.
- Files inspected:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/ui/theme/synapseTheme.ts`
  - `src/ui/theme/ideProScope.css`
  - `src/components/ide/EnhancedIDE.tsx`
  - `src/components/ide/Header.tsx`
  - `src/components/ide/IdeThemeScope.tsx`
  - `src/components/StatusBar/StatusBar.tsx`
  - `src/components/StatusBar/statusTheme.ts`
  - `src/components/ai/panel/*`
- Files changed:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/ui/theme/synapseTheme.ts`
  - `src/ui/theme/ideProScope.css`
  - `src/components/ide/EnhancedIDE.tsx`
  - `src/components/ide/IdeThemeScope.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights (cascade fixes):
  - `--syn-accent-primary` redirected from `#F59E0B` to `var(--syn-interaction-active)` (blue `#3794ff`). Hover/pressed siblings now `#2c7fd9` / `#1f6abc`. Soft bg now references `--syn-vscode-accent-blue-soft`. This single change cascades through `--syn-gold-500`, `--syn-gold-300`, `--color-accent-primary`, `--ai-gold`, `--brand-primary`, `--ide-accent`, and every styled-component consuming the chain.
  - `--syn-accent-bg`, `--syn-accent-bg-hover`, `--syn-accent-bg-strong`, `--syn-accent-border`, `--syn-accent-glow` migrated from amber rgba to `rgba(55,148,255, *)`. Amber retained under new `--syn-attention-*` siblings for explicit attention surfaces.
  - `--syn-glow-subtle` shadow color updated to blue rgba.
  - `ideProScope.css`: `--ide-bg-active`, `--ide-bg-rail-active`, `--ide-focus-ring`, `--ide-focus-shadow`, `--focus-ring`, and the hover outline rgba on `.theme-ide-pro .ctx-pro-item` all migrated from amber rgbas to blue rgbas. Focus ring fallback `#FBBF24` replaced with `#3794ff`.
  - `synapseTheme.ts` `SYNAPSE_COLORS`: `textAccent`, `goldPrimary`, `goldSecondary`, `goldHover`, `accentNeutral`, `accentNeutralHover`, `hover`, `selected`, `borderHighlight`, `glowSubtle` all redirected to blue values. Source-level `gold*` key names retained for source compatibility; documented as redirected per color system contract.
  - `synapseTheme.ts` `SYNAPSE_ACCENT.{gold,goldHover,goldActive,goldMuted}` redirected to blue tones; `SYNAPSE_FOCUS.ring` now `#3794ff`; `focusOutline()` helper now references `SYNAPSE_FOCUS.ring` instead of legacy `goldPrimary`.
  - `IdeThemeScope.tsx`: documented that `brandPrimary`/`brandAccent` flow through the redirected `goldPrimary`/`goldHover` values, so styled-component themes resolve to blue chrome automatically.
  - `EnhancedIDE.tsx`: the fixed-position `[data-global-gold-bar]` (z-index 999999) animated amber gradient rewritten with blue (`#3794ff` / `#5aa9ff` / `#2c7fd9`) keyframes and rgba radial glows. Four `synapseGlitch` keyframe `drop-shadow` amber rgbas, plus the placeholder backdrop radial-gradient amber tint, also migrated to blue rgbas.
- Accessibility/status-truth notes:
  - Status semantics preserved: `--syn-status-warning` (still amber), `--syn-warning-bg`, `--syn-warning-border`, `--syn-text-warning`, `--syn-gradient-amber*` decorative tokens, and `SYNAPSE_COLORS.warning` remain amber for genuine attention/warning/caveat surfaces. Demo/unknown/stale status colors unchanged. The fix narrows amber to attention semantics and frees the chrome accent to be blue.
  - The `gold*` source identifiers (in `SYNAPSE_COLORS`, `SYNAPSE_ACCENT`, `data-global-gold-bar`) were intentionally not renamed to avoid touching unrelated import sites; values were redirected with code comments documenting the new semantic intent.
- Data visualization notes:
  - `--syn-chart-*` palette unchanged.
  - Map/chart/data palettes untouched.
  - Prism syntax tokens in `src/components/ai/panel/code-lang.ts` (e.g. `diff: '#F59E0B'`) intentionally retained as code-content palette per the color system data-palette contract.
- Scientific integrity notes: no evidence provenance, CRS, fitness, method validity, or readiness semantics changed.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
- Known risks:
  - Decorative `--syn-gradient-amber*` tokens still resolve to amber and are consumed by branding surfaces (Welcome modal, Hero, NeuralBackground, file explorer empty state, etc.). These are intentional brand decoration outside the workbench chrome and were not migrated in this pass; can be tackled in Prompt 32 cleanup if the user wants the brand identity blue too.
  - Visual screenshot smoke not re-run.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Prompts 00-15 Re-Audit Pass - 2026-05-15

- Status: completed.
- Trigger: user-directed re-execution of Prompts 00 through 15 as a fresh audit pass, with prior completed work treated as baseline per ledger source-of-truth ordering.
- Scope:
  - Re-verify token infrastructure (Prompts 00-07) is intact and consumed correctly.
  - Re-verify shell/utility/center/status/IDE/file-explorer/editor/terminal migrations (Prompts 08-15) hold under the active token contract.
  - Close any genuinely raw (non-fallback) color literals remaining inside Prompt 08-15 surface scope.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/BackgroundTasksControl.module.css`
  - `scripts/check-color-regression.mjs` (output review only)
- Files changed:
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/BackgroundTasksControl.module.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - `MapWorkspaceCockpit.module.css`: replaced four raw cockpit text literals (`#fafaf9`, `#f5f5f4`, `rgba(250, 250, 249, 0.58)`, `rgba(250, 250, 249, 0.56)`) with `var(--syn-text-default)` / `var(--syn-text-secondary)`. Decorative shadow and translucent overlay rgba values retained as intentional non-chrome effects.
  - `BackgroundTasksControl.module.css`: replaced status-state literals (`#cbd5e1`, `#86efac`, `#fca5a5`, `#d6d3d1` plus their rgba backgrounds) with the local `--tasks-*` aliases backed by `--syn-status-pending|valid|error|stale`. Status semantics are now fully token-resolved.
- Re-audit findings (no change required):
  - Prompts 00-07 infrastructure: `--syn-vscode-*` primitives, `--syn-surface/text/border/interaction/status-*` semantic layer, legacy `--color-*` / `--glass-*` / `--ai-*` compatibility aliases, and `AppThemeProvider` mapping are all live in `src/theme/GlobalSynapseStyles.ts`, `src/theme/synapse.ts`, and provider paths. No drift detected.
  - Prompts 08-15 surface migrations: `CommandPalette.tsx`, `GlobalSearch.tsx`, AI panel/composer/key/status/quick-action components, file explorer, editor tabs, terminal/bottom panel, and status bar already resolve through semantic tokens. Remaining color-guard hits are documented `var(--syn-token, #fallback)` patterns, primitive token-source declarations, syntax/code/data palettes, or out-of-scope future-prompt surfaces.
- Accessibility/status-truth notes:
  - Cockpit metric value and label now follow the dark-workbench text contrast contract via semantic tokens.
  - Background task status states (queued/completed/failed/cancelled) remain semantically distinguishable through `--syn-status-*` rather than ad-hoc tints; demo/unknown still never share valid styling.
- Data visualization notes: no map renderer, layer symbology, chart palette, or analytical data palette touched.
- Scientific integrity notes: no evidence provenance, CRS, fitness, method validity, or readiness semantics changed.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
  - `npm run color:guard:changed` reviewed; remaining literals are intentional fallbacks, primitives, content palettes, or scoped to pending prompts (18-37).
- Known risks: none introduced; full screenshot smoke not re-run for this audit (CLI-validated pass).
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Prompt 17 / Prompt 10 Audit Follow-Up - Map Cockpit And Background Tasks Chrome - 2026-05-15

- Status: completed.
- Trigger: user-requested audit of completed color prompts plus the Command Palette modal sizing follow-up.
- Scope:
  - Stabilize Command Palette modal body height so Files/Tabs/Symbols/Commands mode changes do not resize the modal.
  - Reconcile color prompt ledger/register/manifest/validation records for prompts 00-17.
  - Close high-confidence leftover amber chrome gaps in completed Prompt 17/Prompt 10 scope.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
  - `src/components/ide/CommandPalette.tsx`
  - `src/components/molecules/Modal.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/BackgroundTasksControl.module.css`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `src/components/ide/CommandPalette.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/BackgroundTasksControl.module.css`
- Fixes applied:
  - `CommandPalette.tsx` now uses a fixed responsive grid body height and an internal scrolling result viewport, keeping modal dimensions stable across mode/tab changes.
  - `COLOR_SYSTEM_PROMPT_MANIFEST.json` now marks prompts 00-17 as `completed` and leaves prompts 18-37 `pending`, matching the ledger source of truth.
  - Ledger validation history and bottom next pointer now align with Prompt 18.
  - `MapWorkspaceCockpit.module.css` removed the high-confidence amber/gold chrome leftovers from the Prompt 17 map shell/cockpit surface; generic chrome now uses `--syn-interaction-active`, while valid/warning/running/blocked states use explicit status tokens.
  - `BackgroundTasksControl.module.css` removed the high-confidence amber/gold chrome leftovers from the shared background task control; running, pending, completed, failed, and cancelled states remain semantically distinct.
- Accessibility/status-truth notes:
  - Command Palette keyboard/result state remains visible; only the layout container changed.
  - Map cockpit and task-control status labels remain textual; status color mappings were moved to semantic tokens rather than flattened to one accent.
  - Targeted amber scan for `MapWorkspaceCockpit.module.css` and `BackgroundTasksControl.module.css` passed after cleanup.
- Data visualization notes:
  - No map renderer, layer symbology, chart palette, or analytical data palette was changed.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, readiness semantics, or GIS calculations changed.
- Cross-module contract changes: None.
- Validation:
  - `npm run typecheck` passed.
  - Prompt audit script passed: sequential prompt headings, manifest prompt count, and ledger register count are all 38; prompts 00-17 are completed; prompts 18-37 are pending; execution logs and validation rows are present for 00-17; current/next/bottom pointer all target Prompt 18.
  - `npm run color:guard:changed` passed in non-blocking report mode; remaining findings are dominated by token fallbacks, syntax/code colors, retained content palettes, and future-prompt cleanup scope.
  - Targeted grep for legacy amber/gold literals in `MapWorkspaceCockpit.module.css` and `BackgroundTasksControl.module.css` returned no matches.
- Known risks:
  - Full visual screenshot smoke was not run; this was a CLI validation pass.
  - Color guard still reports broader changed-file literals by design; Prompt 32 remains the planned broad cleanup pass.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Prompt 16 - Command Palette Search And AI Panel - 2026-05-15

- Status: completed.
- Scope: tokenize command palette, global search refinements, AI composer/panel chrome, AI status strips, API-key/config surfaces, apply preview, conflict/risk warnings, and apply/revert-adjacent code-action chrome without changing prompt construction or apply-plan behavior.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `src/components/ide/CommandPalette.tsx`
  - `src/components/ide/GlobalSearch.tsx`
  - `src/components/ai/`
  - `src/components/ai/apply/ApplyPlanPreview.tsx`
  - `src/utils/ai/apply/`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `src/components/ide/CommandPalette.tsx`
  - `src/components/ide/GlobalSearch.tsx`
  - `src/components/ai/apply/ApplyPlanPreview.tsx`
  - `src/components/ai/panel/Header.tsx`
  - `src/components/ai/panel/KeyDebug.tsx`
  - `src/components/ai/panel/KeysModal.tsx`
  - `src/components/ai/panel/MessageItem.tsx`
  - `src/components/ai/panel/ModelSelect.tsx`
  - `src/components/ai/panel/ProviderSelect.tsx`
  - `src/components/ai/panel/QuickActions.tsx`
  - `src/components/ai/panel/StatusBadge.tsx`
  - `src/components/ai/panel/SynapseCoreAIPanel.tsx`
  - `src/components/ai/panel/UnifiedComposer.tsx`
  - `src/components/ai/panel/styles.ts`
  - `src/components/ai/settings/AiSettingsModal.module.css`
- Token migration highlights:
  - `CommandPalette.tsx` now uses `--syn-interaction-active`, `--syn-interaction-focus-ring`, `--syn-status-info`, and semantic text/surface tokens for mode tabs, input focus, selected rows, match highlights, and disabled command reasons.
  - `GlobalSearch.tsx` now uses semantic search fallback tokens, blue active/focus markers, info-family match highlights, and an info-toned open-file dot instead of success styling.
  - AI panel chrome in `styles.ts`, provider/model controls, key modal, status badge, and status strips now map surfaces/focus/actions to semantic surface/interaction tokens instead of amber-first aliases.
  - API key states now map verified/missing/invalid/rate-limited/unknown to `valid`/`blocked`/`error`/`warning`/`unknown`, and verifying states to `running`.
  - `ApplyPlanPreview.tsx` now separates primary apply/selection interaction from risk/conflict semantics: create/update/replace use valid/info/warning, high-risk/conflict uses error, and medium/destructive caution uses warning.
  - Prompt 16 mapping was documented in `COLOR_SYSTEM_TOKEN_REFERENCE.md`.
- Accessibility/status-truth notes:
  - Palette and search selected/focused rows have visible fill/edge/focus rings, not only text-color changes.
  - 2026-05-15 follow-up: `CommandPalette.tsx` now uses a fixed responsive palette body height with an internal scrolling results viewport, so switching Files/Tabs/Symbols/Commands no longer resizes the modal.
  - AI warnings, conflict confirmations, key status, disabled command reasons, and apply risk banners retain explicit text, icons, aria labels, or titles.
  - Missing/invalid/rate-limited AI key states no longer share success styling.
- Remaining hard-coded colors retained (with rationale):
  - Prism syntax token colors in `src/components/ai/panel/styles.ts` and language identity colors in `src/components/ai/panel/code-lang.ts` remain as code/content palette values, not shared UI chrome/status tokens.
  - Existing `--ai-gold` local alias remains defined as a compatibility alias but now resolves to `--syn-interaction-active`/`--syn-status-info` in the migrated AI panel surface.
- Validation:
  - `npm run typecheck` passed.
  - Targeted tests were not run because no prompt construction, apply-plan logic, or behavior code changed.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Prompt 17 - Map Explorer Shell And Canvas Chrome - 2026-05-15

- Status: completed.
- Scope: align Map Explorer shell, cockpit status, and canvas overlay chrome to semantic surface/status tokens while keeping the basemap dominant and preserving QA/CRS/publication messaging.
- Files inspected:
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/map/mapTokens.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Workflow preview HUD/divider and command-header chrome in `MapExplorerModal.tsx` now use semantic surface/border/info tokens instead of amber-led shell accents.
  - Drag-and-drop import overlay and map feedback/statistics/dispatch cards were flattened to quieter semantic panel surfaces with reduced shadow depth to avoid heavy card-in-card visual competition.
  - `MapWorkspaceShell.tsx` panel rail and timeline separators were moved from amber-derived strokes to neutral semantic border tiers so chrome recedes behind map symbology.
  - `MapCanvas.tsx` pin marker and feature popup action chrome now use semantic info/interaction tokens and neutral panel text hierarchy.
  - `MapStatusBar.tsx` now differentiates `info`, `warning`, `error`, `running`, `pending`, `valid`, and `stale` values via semantic status tones while preserving explicit labels and spinner/non-color cues.
- Acceptance-criteria notes:
  - Map remains the primary visual surface because shell overlays are lower-contrast and less ornate.
  - Chrome accents no longer compete with arbitrary layer symbology through broad amber usage.
- Validation:
  - `npm run typecheck` passed.
  - Map visual smoke: not run in this CLI-only pass (no interactive browser validation performed).
- Sequencing note:
  - Prompt 17 was executed before Prompt 16 due to explicit user direction.
- Next recommended prompt: Prompt 16 - Command Palette Search And AI Panel.

### Prompt 15 - Terminal Bottom Panel Tasks And Problems - 2026-05-15

- Status: completed.
- Scope: tokenize bottom panel chrome, task-state colors, problems-pane severity/focus surfaces, and terminal/xterm connection chrome while preserving terminal behavior and readability.
- Files inspected:
  - `src/components/ide/BottomPanel.tsx`
  - `src/components/ide/styles/ideShell.css`
  - `src/components/editor/ProblemsPane.tsx`
  - `src/components/editor/problemsPane.css`
  - `src/components/terminal/components/Terminal.tsx`
  - `src/components/terminal/components/XTermTerminal.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/components/ide/styles/ideShell.css`
  - `src/components/editor/problemsPane.css`
  - `src/components/terminal/components/Terminal.tsx`
  - `src/components/terminal/components/XTermTerminal.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Bottom-panel task states now map queued/success/error/cancelled to semantic status tokens (`pending`, `valid`, `error`, `stale`) instead of mixed legacy fallbacks.
  - Bottom-panel frame animated glow pulse was removed and replaced with a restrained static semantic edge treatment for a quieter terminal host.
  - Problems pane header chips/source labels were flattened to transparent chrome with semantic severity/status colors retained, and focus ring updated to semantic focus border token.
  - Terminal host chrome in `Terminal.tsx` moved from amber-heavy literals to semantic surface/text/border/interaction tokens while preserving all controls and resize behavior.
  - Xterm terminal theme in `XTermTerminal.tsx` was retuned to a dark, quiet, VS Code-like palette with blue interaction accents; cursor visibility and contrast were preserved.
- Accessibility/status-truth notes:
  - Task and diagnostic states remain non-color dependent via explicit text labels and icons (`queued`, `running`, `success`, `error`, `cancelled`; severity labels + icons in problems rows).
  - Terminal connection badge keeps explicit status text (`Connecting`, `Disconnected`, `Error`) and retry affordance.
- Remaining hard-coded colors retained (with rationale):
  - Xterm ANSI palette literals remain explicit in `XTermTerminal.tsx` because xterm canvas theming requires concrete color values and these are data-plane rendering values rather than generic shell chrome tokens.
- Validation:
  - `npm run typecheck` passed.
  - `npx eslint src/components/terminal/components/Terminal.tsx src/components/terminal/components/XTermTerminal.tsx src/components/ide/styles/ideShell.css src/components/editor/problemsPane.css --quiet` passed.
- Next recommended prompt: Prompt 16 - Command Palette Search And AI Panel.

### Prompt 14 - Editor Tabs Monaco Outline And Search - 2026-05-15

- Status: completed.
- Scope: migrate editor-adjacent surfaces to semantic tokens: editor tab state accents, Monaco context/breadcrumb shell chrome, outline interaction accents, global search rows/highlights, and diagnostics summary severity colors.
- Files inspected:
  - `src/components/ide/Header.tsx`
  - `src/components/editor/monacoSurface.css`
  - `src/components/editor/OutlinePane.tsx`
  - `src/components/ide/GlobalSearch.tsx`
  - `src/components/editor/ProblemsPane.tsx`
  - `src/components/editor/problemsPane.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/components/ide/Header.tsx`
  - `src/components/editor/monacoSurface.css`
  - `src/components/editor/OutlinePane.tsx`
  - `src/components/ide/GlobalSearch.tsx`
  - `src/components/editor/problemsPane.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Editor tab dirty and pinned indicators in `Header.tsx` now resolve to semantic status/interaction tokens (`--syn-status-warning`, `--syn-interaction-active`, `--syn-text-muted`) instead of legacy accent-neutral coupling.
  - Monaco context-bar/chip/action chrome in `monacoSurface.css` now uses semantic interaction/status tokens with color-mix overlays; breadcrumb shell no longer depends on amber-biased accent defaults.
  - `OutlinePane.tsx` interaction accents moved to semantic interaction/border tokens for hover and focus clarity.
  - `GlobalSearch.tsx` hard-coded surface/text/border colors replaced with semantic tokens; search match highlight changed to info-family token mix so it remains distinct from warning/error diagnostics.
  - `problemsPane.css` diagnostics summary and row severity colors now map to semantic status families (`error`, `warning`, `info`, `stale`).
- Monaco syntax-theme constraint:
  - No Monaco syntax token map changes were applied in Prompt 14; only editor-adjacent shell/chrome surfaces were migrated.
- Remaining hard-coded colors retained (with rationale):
  - `src/components/editor/MonacoEditor.tsx` preview-specific embedded HTML/CSS snippets retain local literal colors for content rendering demos and language preview output; these are non-shell content visuals and are deferred to later cleanup prompts.
- Acceptance-criteria notes:
  - Editor chrome now follows semantic token families for tabs, outline, search, and diagnostics summary.
  - Syntax highlighting readability remains unchanged because Monaco syntax theme mappings were not altered.
- Validation:
  - `npm run typecheck` passed.
  - `npx eslint src/components/ide/Header.tsx src/components/editor/OutlinePane.tsx src/components/ide/GlobalSearch.tsx --quiet` passed.
- Next recommended prompt: Prompt 15 - Terminal Bottom Panel Tasks And Problems.

### Prompt 13 - Synapse File Explorer And File Badges - 2026-05-15

- Status: completed.
- Scope: tokenize file-tree row states, semantic badges, drag/drop affordances, file icon color categories, and destructive context-menu styling without behavior changes.
- Files inspected:
  - `src/components/file-explorer/FileExplorer.tsx`
  - `src/components/file-explorer/FileIcon.tsx`
  - `src/components/file-explorer/fileSemantics.ts`
  - `src/components/file-explorer/items.css`
  - `src/components/file-explorer/ContextMenu.tsx`
  - `src/components/file-explorer/contextMenu.css`
  - `src/constants/app.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/components/file-explorer/FileExplorer.tsx`
  - `src/components/file-explorer/FileIcon.tsx`
  - `src/components/file-explorer/items.css`
  - `src/components/file-explorer/ContextMenu.tsx`
  - `src/components/file-explorer/contextMenu.css`
  - `src/constants/app.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Explorer row hover/selected/focus and drag/drop valid-invalid states now resolve to semantic interaction/status tokens instead of amber literals.
  - Semantic file badges (`neutral`, `info`, `success`, `warning`) now map to semantic status token families.
  - File icon coloring in `FileIcon.tsx` moved from hard-coded hex values to stable semantic category tokens.
  - `FILE_TYPES` color definitions in `src/constants/app.ts` are now semantic token categories, documenting stable icon-color intent by file type.
  - Context menu destructive actions retain explicit danger semantics while using semantic error/interaction tokens for hover/focus feedback.
- Remaining hard-coded colors retained (with rationale):
  - `src/components/file-explorer/FileExplorer.tsx` keeps some neutral black overlay/shadow rgba values for depth/backdrop behavior in modal layering; these are non-status chrome shadows and do not encode readiness/state truthfulness.
  - `src/components/file-explorer/FileExplorerHeader.tsx` contains legacy hard-coded colors in advanced header/export UI not required to satisfy Prompt 13 row/badge/icon scope; scheduled for subsequent cleanup prompts.
- Acceptance-criteria notes:
  - File explorer remains compact and scannable; selected and focused states are distinct.
  - File type colors are now tokenized and documented in `COLOR_SYSTEM_TOKEN_REFERENCE.md`.
  - No file explorer command/workflow behavior changed.
- Validation:
  - `npm run typecheck` passed.
  - `npx eslint src/components/file-explorer/FileExplorer.tsx src/components/file-explorer/FileIcon.tsx src/components/file-explorer/ContextMenu.tsx src/constants/app.ts --quiet` passed.
- Next recommended prompt: Prompt 14 - Editor Tabs Monaco Outline And Search.

### Prompt 12 - Synapse IDE Shell And Header Migration - 2026-05-15

- Status: completed.
- Scope: migrate IDE shell, header, activity rail, right-dock boundary, and placeholder panes to semantic workbench tokens with blue interaction emphasis.
- Files inspected:
  - `src/components/ide/EnhancedIDE.tsx`
  - `src/components/ide/Header.tsx`
  - `src/components/ide/ShellPlaceholderPane.tsx`
  - `src/components/ide/styles/ideShell.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/components/ide/EnhancedIDE.tsx`
  - `src/components/ide/Header.tsx`
  - `src/components/ide/ShellPlaceholderPane.tsx`
  - `src/components/ide/styles/ideShell.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Header active-tab fills, focused controls, and CTA accents now use semantic interaction tokens (`--syn-interaction-active`, `--syn-border-active`, `--syn-interaction-focus-ring`) instead of amber-heavy fills.
  - Shell activity rail hover/active states, badges, resizer hovers, and bottom-tab active/focus boundaries moved from hard-coded amber rgba values to semantic interaction/surface/border tokens.
  - Side-pane chips and bridge online status badges now communicate truthful readiness via semantic status tokens (`--syn-status-valid`, `--syn-status-running`, `--syn-status-warning`, `--syn-status-demo`, `--syn-status-info`).
  - Right-dock resize handle in `EnhancedIDE.tsx` now uses semantic panel/border/interaction tokens and no longer depends on amber glass gradients.
  - Legacy prompt path `src/components/ide/ideShell.css` was reconciled to actual file `src/components/ide/styles/ideShell.css`.
- Remaining hard-coded colors retained (with rationale):
  - `src/components/ide/EnhancedIDE.tsx` dev-only Prompt 21 demo/ornamental blocks retain literal colors in non-production diagnostics and showcase effects; not part of shell migration scope.
  - `src/components/ide/styles/ideShell.css` keeps fallback literals inside existing status vars (for example success/error fallback values) as resilience defaults when semantic status tokens are unavailable.
  - `src/components/ide/Header.tsx` keeps typed `SYNAPSE_COLORS` usages for non-status text/border constants where already mapped to semantic aliases through theme bridge; no direct amber-only literal remains in migrated shell/header controls.
- Acceptance-criteria notes:
  - IDE shell now follows VS Code-like dark workbench semantics with blue active/focus emphasis and restrained panel boundaries.
  - No command, bridge, or workflow logic changed.
- Validation:
  - `npm run typecheck` passed.
  - `npx eslint src/components/ide/EnhancedIDE.tsx src/components/ide/Header.tsx src/components/ide/ShellPlaceholderPane.tsx --quiet` passed.
- Next recommended prompt: Prompt 13 - Synapse File Explorer And File Badges.

### Prompt 11 - Shared Status Bar And System Chrome Migration - 2026-05-15

- Status: completed.
- Scope: migrate shared status bar chrome and top-level status/system indicators away from neutral amber and hard-coded literals to semantic surface/status tokens.
- Files inspected:
  - `src/components/StatusBar/statusTheme.ts`
  - `src/components/StatusBar/StatusBar.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/components/StatusBar/statusTheme.ts`
  - `src/components/StatusBar/StatusBar.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - `statusTheme.ts` now resolves status-bar chrome through semantic surface/text/border tokens and explicit semantic status channels (`info`, `warning`, `error`, `running`, `pending`, `stale`, `valid`).
  - `alpha()` now supports semantic CSS variables through `color-mix(...)`, allowing compact status chips and menu chrome to use tokenized translucent states without hard-coded hex fallbacks.
  - `StatusBar.tsx` container surface, top border, hover/focus affordances, and scrollbar chrome were migrated from amber/rgba literals to semantic tokens.
  - Diagnostic chips (`error`, `warning`, `info`) now derive fill/border/text from semantic status tokens instead of fixed `rgba(...)` values.
  - Runtime/system indicator states now distinguish `running`, `pending`, and `stale` in AI, streaming, spatial-index, collaboration, live-server, and connectivity chips while preserving labels/icons.
- Acceptance-criteria notes:
  - Neutral informational status no longer relies on unrelated amber; info defaults to `--syn-status-info`.
  - Semantic status colors are documented in `COLOR_SYSTEM_TOKEN_REFERENCE.md` under `Prompt 11 Status Bar Semantic Mapping`.
- Product behavior changes: none (status/chrome styling only).
- Validation:
  - `npm run typecheck` passed.
- Next recommended prompt: Prompt 12 - Synapse IDE Shell And Header Migration.

### Prompt 10 - Center Panel Shell Migration - 2026-05-15

- Status: completed.
- Scope: migrate center-panel shell chrome to semantic surface/text/border/interaction tokens while preserving dense layout and workflow behavior.
- Files inspected:
  - `src/centerpanel/CenterPanelShell.tsx`
  - `src/centerpanel/styles/centerpanel.module.css`
  - `src/centerpanel/styles/tokens.css`
  - `src/centerpanel/components/TopHeader.tsx`
  - `src/centerpanel/styles/header-new.module.css`
  - `src/centerpanel/styles/header-tokens.css`
  - `src/centerpanel/components/CenterPanelTabFrame.tsx`
  - `src/centerpanel/UrbanContextStrip.tsx`
  - `src/centerpanel/urban-context-strip.module.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/centerpanel/CenterPanelShell.tsx`
  - `src/centerpanel/components/TopHeader.tsx`
  - `src/centerpanel/styles/centerpanel.module.css`
  - `src/centerpanel/styles/tokens.css`
  - `src/centerpanel/styles/header-new.module.css`
  - `src/centerpanel/styles/header-tokens.css`
  - `src/centerpanel/urban-context-strip.module.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Shell and panel surfaces (`shell`, `outline`, `main`, `rightDock`, footer, strip wrapper) now resolve through semantic `--syn-surface-*` and `--syn-border-*` tokens.
  - Center-panel deferred loading fallback in `CenterPanelShell.tsx` no longer uses hard-coded amber literals; it now uses semantic surface/text/border/interaction tokens.
  - Active tab markers in the center header and strip now use blue interaction semantics (`--syn-interaction-active`, `--syn-interaction-selected`, `--syn-border-active`) instead of amber-biased accent literals.
  - Decorative header SVG/gradient stop colors in `TopHeader.tsx` were moved from hard-coded amber hex values to semantic interaction tokens, removing non-semantic amber chrome from the shell path.
  - Focus-visible styles for tab and pill controls were normalized to `--syn-interaction-focus-ring`.
  - Compact status/readout text in strip/header-aligned areas was moved to semantic text families (`--syn-text-default`, `--syn-text-secondary`, `--syn-text-muted`) with preserved density.
- Amber retention policy for this prompt:
  - Amber is retained only in warning/attention semantics (`warning` and risk-med/high families), not as neutral active-tab or generic interactive chrome.
- Product behavior changes: none (styling/token migration only).
- Center panel workflow changes: none.
- Validation:
  - `npm run typecheck` passed.
  - `npx eslint src/centerpanel/CenterPanelShell.tsx src/centerpanel/UrbanContextStrip.tsx --quiet` passed.
  - Manual changed-file Tailwind pattern scan (`rg --pcre2` across touched center-panel files) returned no matches.
  - `npm run lint:no-tailwind-centerpanel` could not execute in this environment (`powershell` executable unavailable and referenced script is not present under `scripts/`); treated as tooling risk, not a product-code blocker for this prompt.
- Next recommended prompt: Prompt 11 - Shared Status Bar And System Chrome Migration.

### Prompt 09 - Error Loading And Utility Surface Migration - 2026-05-15

- Status: completed.
- Scope: migrate emergency/error/loading/test utility surfaces to semantic surface/text/border/status tokens without behavior changes.
- Files inspected:
  - `src/app/ErrorBoundary.tsx`
  - `src/components/utilities/Loading.tsx`
  - `src/components/utilities/ErrorBoundary.tsx`
  - `src/components/utilities/TestHarness.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/app/ErrorBoundary.tsx`
  - `src/components/utilities/Loading.tsx`
  - `src/components/utilities/ErrorBoundary.tsx`
  - `src/components/utilities/TestHarness.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - `src/app/ErrorBoundary.tsx`:
    - Root/error card surfaces now use semantic shell tokens (`--syn-surface-workbench`, `--syn-surface-panel`, `--syn-border-default`, `--syn-text-default`).
    - Error label and icon use `--syn-status-error`.
    - Reload action uses semantic interaction tokens (`--syn-interaction-active`, `--syn-interaction-selected`, `--syn-border-active`, `--syn-text-inverse`).
  - `src/components/utilities/ErrorBoundary.tsx`:
    - Replaced legacy `--color-*` runtime usage on text/surface/border with `--syn-*` semantic families.
    - Added explicit `Error` label in semantic error status color for danger-state clarity.
    - Development details panel and retry CTA now use semantic surface/border/interaction tokens.
  - `src/components/utilities/Loading.tsx`:
    - Full-screen overlay/skeleton/message surfaces moved from assistant/glass color tokens to semantic surface/border/text tokens.
    - Spinner/dots interactive color moved to `--syn-interaction-active`.
  - `src/components/utilities/TestHarness.tsx`:
    - Container, button, and list surfaces migrated to semantic surface/border/text/interaction tokens.
    - Pass/fail indicators now use semantic status tokens (`--syn-status-valid`, `--syn-status-error`).
- Retained fixture colors:
  - None retained in Prompt 09 target files.
- Product behavior changes: none (color token migration only).
- Validation:
  - `npm run typecheck` passed.
- Next recommended prompt: Prompt 10 - Center Panel Shell Migration.

### Prompt 08 - App Root And Global Surface Migration - 2026-05-15

- Status: completed.
- Scope: migrate app-root and global shell surfaces to semantic surface/text/border/interaction tokens without layout movement.
- Files inspected:
  - `src/app/AppThemeProvider.tsx`
  - `src/app/AppRoot.tsx`
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/styles/GlobalStyles.ts`
  - `src/styles/ui.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/styles/GlobalStyles.ts`
  - `src/styles/ui.css`
  - `src/theme/GlobalSynapseStyles.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files inspected but unchanged:
  - `src/app/AppThemeProvider.tsx`
  - `src/app/AppRoot.tsx`
- Before/after root token usage:
  - Root shell backgrounds:
    - Before: `var(--color-background)` and mixed overlay literals.
    - After: `var(--app-shell-bg)`, `var(--app-shell-surface)`, and `var(--syn-surface-overlay)`.
  - Root text:
    - Before: `var(--color-text)` / `var(--color-text-secondary)` on shell-level wrappers.
    - After: semantic app-shell/syn text tokens (`--app-shell-text`, `--syn-text-default`, `--syn-text-secondary`) on root/global surfaces.
  - Borders:
    - Before: `var(--color-border)` on shell-level separators.
    - After: `var(--app-shell-border)` / `var(--syn-border-default)`.
  - Selection:
    - Before: `::selection` used `var(--color-primary)` (amber-biased in legacy path).
    - After: `::selection` uses blue interactive semantic (`color-mix(... var(--syn-interaction-active) ...)`).
  - Scrollbar:
    - Before: track/thumb relied on legacy background/glass vars.
    - After: restrained semantic surface/border set (`--syn-surface-*`, `--syn-border-*`).
- Additional root-surface alignment:
  - `src/main.tsx` startup/error fallback HTML now references semantic status/surface/text/border tokens.
  - Root loading overlay in `src/App.tsx` switched from hard-coded amber literals to semantic overlay/surface/border/interactive tokens.
  - Global fallback selection style in `src/theme/GlobalSynapseStyles.ts` was aligned to blue interactive semantic tokens to avoid amber fallback selection.
- Product behavior changes: none (styling/token migration only).
- Layout movement: none introduced.
- Validation:
  - `npm run typecheck` passed.
  - Manual shell load not run in this prompt session.
- Next recommended prompt: Prompt 09 - Error Loading And Utility Surface Migration.

### Prompt 07 - Token Regression Guard Plan - 2026-05-15

- Status: completed.
- Scope: add a lightweight, non-blocking guard so future prompts can detect newly introduced hard-coded chrome colors.
- Files inspected:
  - `scripts/` (existing script inventory)
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `package.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `scripts/check-color-regression.mjs` (new)
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `package.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Guard implementation:
  - Added `scripts/check-color-regression.mjs`.
  - Guard scans only `src/**/*.{ts,tsx,css}`.
  - Guard excludes allowlisted categories:
    - `token-source` (`src/theme/*`, `src/styles/theme.ts`, design/app constants).
    - `data-visualization` (color ramps, cartography engine, map renderer palette files).
    - `test-fixture` (`__tests__`, `__mocks__`, `.test.*`, `.spec.*`, fixtures).
  - Guard detects `hex`, `rgb(a)`, `hsl(a)`, gradients, CSS variable fallbacks, and common named color literals.
  - Guard runs in report-only mode and exits `0` by default; optional `--fail-on-findings` exists but is not wired to CI.
- Package scripts added:
  - `npm run color:guard`
  - `npm run color:guard:changed`
- QA checklist updates:
  - Added a dedicated Prompt 07 section with command usage, allowlisted categories, and explicit non-CI-blocking guidance.
- CI safety:
  - No CI gating scripts were modified to fail on this guard.
  - `validate:rc` remains unchanged.
- Product behavior changes: none.
- Validation:
  - `npm run color:guard` passed (full-source baseline report mode, exit `0`).
  - `npm run color:guard:changed` passed (report mode, exit `0`).
- Next recommended prompt: Prompt 08 - App Root And Global Surface Migration.

### Prompt 06 - Theme Provider Compatibility Pass - 2026-05-15

- Status: completed.
- Scope: align both theme provider paths to semantic token outputs while keeping theme persistence and mode selection behavior unchanged.
- Files inspected:
  - `src/app/AppThemeProvider.tsx`
  - `src/contexts/ThemeContext.tsx`
  - `src/styles/theme.ts`
  - `src/config/flags.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/app/AppThemeProvider.tsx`
  - `src/contexts/ThemeContext.tsx`
  - `src/styles/theme.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files inspected but unchanged:
  - `src/config/flags.ts` (theme-mode flag behavior and `synapse.theme.mode` key retained as-is).
- Provider ownership notes:
  - `AppThemeProvider` owns `--app-shell-*` variables and now maps them to semantic token families (`--syn-surface-*`, `--syn-text-*`, `--syn-border-*`, `--syn-interaction-*`, `--syn-status-*`).
  - `ThemeContext` owns runtime `--color-*`, `--glass-*`, `--tag-*`, and theme class/data attributes; it now applies a semantic compatibility bridge for core `--color-*` variables while preserving existing glass/tag overrides.
  - `GlobalSynapseStyles` remains the base token definition layer (`--syn-vscode-*`, semantic `--syn-*`, and legacy aliases).
- Compatibility mapping changes:
  - Added semantic bridges in `ThemeContext` so provider-written legacy vars resolve through semantic tokens (surface/text/border/interaction/status families).
  - Updated `createCSSVariables` in `src/styles/theme.ts` so its color output path aligns with semantic tokens if used by downstream paths.
  - Expanded `AppThemeProvider` shell variable set to expose semantic editor/elevated/input/hover, secondary text, strong border, and status slots.
- Persistence behavior verification:
  - Existing `ThemeContext` storage key `theme` remains unchanged.
  - Existing mode resolution for `auto` remains unchanged.
  - Existing `flags.themeMode` key `synapse.theme.mode` remains unchanged.
  - No new direct `localStorage` reads/writes added.
- Product behavior changes: none (token wiring only).
- Validation:
  - `npm run typecheck` passed.
- Next recommended prompt: Prompt 07 - Token Regression Guard Plan.

### Prompt 05 - Semantic Token Alias Layer - 2026-05-15

- Status: completed.
- Scope: add semantic alias tokens that map product meaning to VS Code primitives while preserving legacy alias resolution.
- Files inspected:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/app/AppThemeProvider.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/app/AppThemeProvider.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Semantic tokens added in `GlobalSynapseStyles`:
  - Surface: `--syn-surface-workbench`, `--syn-surface-navigation`, `--syn-surface-panel`, `--syn-surface-editor`, `--syn-surface-elevated`, `--syn-surface-input`, `--syn-surface-hover`, `--syn-surface-overlay`.
  - Text: `--syn-text-default`, `--syn-text-secondary`, `--syn-text-muted`, `--syn-text-disabled`, `--syn-text-inverse`, `--syn-text-link`.
  - Border: `--syn-border-default`, `--syn-border-subtle`, `--syn-border-strong`, `--syn-border-active`, `--syn-border-focus`.
  - Interaction: `--syn-interaction-hover`, `--syn-interaction-selected`, `--syn-interaction-active`, `--syn-interaction-focus-ring`, `--syn-interaction-disabled`.
  - Status: `--syn-status-valid`, `--syn-status-warning`, `--syn-status-error`, `--syn-status-info`, `--syn-status-blocked`, `--syn-status-stale`, `--syn-status-unknown`, `--syn-status-demo`, `--syn-status-running`, `--syn-status-pending`.
- Compatibility aliases added/updated:
  - Legacy `--syn-*` bridges now resolve through semantic layer where safe (`--syn-bg-*`, `--syn-bg-900`, `--syn-surface-800`, `--syn-overlay`, `--syn-text-100`, `--syn-text-400`, `--syn-border-700`, `--syn-focus-ring`, `--syn-*-400` status aliases).
  - Legacy `--color-*` families were remapped to semantic surface/text/border/status families.
- `synapse.ts` updates:
  - Added semantic raw constants and `var(--syn-*)` mappings for surface/text/border/interaction/status layers.
  - Extended `SynapseTheme.colors` with semantic fields so styled-components consumers can use semantic names directly.
  - Status variable mappings now target `--syn-status-*` semantic tokens.
- `AppThemeProvider` updates:
  - `--app-shell-*` vars now resolve directly to semantic tokens (`--syn-surface-*`, `--syn-text-default`, `--syn-border-default`, `--syn-interaction-*`).
  - Modal overlay now uses `--syn-surface-overlay`.
- Token reference updates:
  - Added Prompt 05 semantic mapping table and compatibility alias table.
  - Canonical semantic set updated to reflect active token names (`--syn-text-secondary`, `--syn-text-muted`, `--syn-text-disabled`, `--syn-text-inverse`, `--syn-text-link`, and `--syn-surface-overlay`).
- Product behavior changes: none (color token aliasing only).
- Validation:
  - `npm run typecheck` passed.
  - Manual app load not run in this prompt session.
- Next recommended prompt: Prompt 06 - Theme Provider Compatibility Pass.

### Prompt 04 - VS Code Primitive Palette Layer - 2026-05-15

- Status: completed.
- Scope: add VS Code-inspired primitive palette as non-breaking variables without migrating existing consumers.
- Files inspected:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Exact CSS primitive tokens added in `GlobalSynapseStyles`:
  - Surface/text/border/accent set:
    - `--syn-vscode-bg-root`
    - `--syn-vscode-bg-activity`
    - `--syn-vscode-bg-sidebar`
    - `--syn-vscode-bg-editor`
    - `--syn-vscode-bg-panel`
    - `--syn-vscode-bg-elevated`
    - `--syn-vscode-bg-input`
    - `--syn-vscode-bg-hover`
    - `--syn-vscode-border-subtle`
    - `--syn-vscode-border-strong`
    - `--syn-vscode-text-primary`
    - `--syn-vscode-text-secondary`
    - `--syn-vscode-text-muted`
    - `--syn-vscode-accent-blue`
    - `--syn-vscode-accent-blue-soft`
    - `--syn-vscode-attention-amber`
    - `--syn-vscode-attention-amber-soft`
  - Status primitive set:
    - `--syn-vscode-status-valid`
    - `--syn-vscode-status-warning`
    - `--syn-vscode-status-error`
    - `--syn-vscode-status-info`
    - `--syn-vscode-status-blocked`
    - `--syn-vscode-status-stale`
    - `--syn-vscode-status-unknown`
    - `--syn-vscode-status-demo`
    - `--syn-vscode-status-running`
    - `--syn-vscode-status-pending`
- TypeScript primitive constants added in `src/theme/synapse.ts`:
  - Raw values added to `charcoalAmberRaw`: `vscode*` surface/border/text/accent primitives plus `statusValid/statusWarning/statusError/statusInfo/statusBlocked/statusStale/statusUnknown/statusDemo/statusRunning/statusPending`.
  - Variable mappings added to `charcoalAmberVars`: `vscode*` mappings and `status*` mappings targeting the new `--syn-vscode-*` tokens.
- Non-breaking guarantees maintained:
  - Existing `--syn-*`, `--color-*`, `--glass-*`, and legacy theme aliases were not removed.
  - No existing consumers were remapped in this prompt.
  - Amber remains available as attention primitive while blue interactive primitives were introduced.
- Token reference updates:
  - Added Prompt 04 primitive tables for surface/text/accent and primitive status sets with exact values.
  - Documented that compatibility aliases remain unchanged in this phase.
- Product code migration: none (token-source additions only).
- Validation:
  - `npm run typecheck` passed.
- Next recommended prompt: Prompt 05 - Semantic Token Alias Layer.

### Prompt 03 - Token Taxonomy And Naming Contract - 2026-05-15

- Status: completed.
- Scope: documentation-only taxonomy contract finalization before any UI migration.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/styles/theme.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Contract decisions finalized:
  - Canonical token families locked to five layers: primitive, semantic, component alias, status semantic, and data palette.
  - Compatibility alias families explicitly enumerated and retained for phased migration.
  - Forbidden direct usages defined (primitive-in-feature, raw literals in runtime UI, status/data palette misuse).
  - Amber-first deprecation notes documented with migration direction and removal gates.
  - Family selection guide added so agents can pick token family consistently for any component.
- Tokens added/changed: none in product code (documentation contract only).
- Product code changed: none.
- Validation:
  - Documentation-only checks completed.
  - No UI migration or token rename performed in source code.
- Next recommended prompt: Prompt 04 - VS Code Primitive Palette Layer.

### Prompt 02 - Hard-Coded Color Inventory - 2026-05-15

- Status: completed.
- Scope: documentation-only hard-coded color inventory across `src/**/*.{css,ts,tsx}` with risk categorization and migration targeting.
- Files inspected:
  - `src/**/*.{css,ts,tsx}` (search scope)
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Search scope guard:
  - Included: `src/**/*.{css,ts,tsx}`.
  - Excluded: `coverage/`, `dist/`, generated files, and lockfiles.
- Inventory totals:
  - Matched findings: `6872`.
  - Files with at least one finding: `345`.
- Category totals:

| Category | Count |
| --- | --- |
| `component-chrome` | 5056 |
| `fallback` | 815 |
| `token-source` | 394 |
| `data-visualization` | 278 |
| `status-semantic` | 127 |
| `ignore-with-reason` | 122 |
| `test-fixture` | 80 |

- Grouped counts by unit and finding class:

| Unit | `token-source` | `component-chrome` | `status-semantic` | `data-visualization` | `fallback` | `test-fixture` | `ignore-with-reason` | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Center Panel Shell | 0 | 1288 | 16 | 0 | 311 | 8 | 0 | 1623 |
| Unmapped/Other | 0 | 975 | 25 | 0 | 70 | 17 | 122 | 1209 |
| UA Shell And Modal | 0 | 717 | 6 | 0 | 29 | 7 | 0 | 759 |
| Command/Search/AI | 0 | 266 | 0 | 0 | 150 | 0 | 0 | 416 |
| IDE Shell | 0 | 292 | 0 | 0 | 52 | 0 | 0 | 344 |
| VoxCity/3D | 0 | 243 | 0 | 0 | 5 | 0 | 0 | 248 |
| File Explorer | 0 | 226 | 7 | 0 | 15 | 0 | 0 | 248 |
| Editor Surface | 0 | 147 | 6 | 0 | 75 | 0 | 0 | 228 |
| Map Shell And Canvas Chrome | 0 | 191 | 1 | 0 | 16 | 13 | 0 | 221 |
| Synapse Token Layer | 136 | 0 | 36 | 0 | 0 | 0 | 0 | 172 |
| Map Services And Types | 0 | 153 | 0 | 0 | 0 | 19 | 0 | 172 |
| Legacy Theme Layer | 108 | 0 | 8 | 0 | 53 | 0 | 0 | 169 |
| Terminal And Bottom Panel | 0 | 150 | 3 | 0 | 3 | 0 | 0 | 156 |
| Dashboard | 0 | 0 | 0 | 135 | 6 | 1 | 0 | 142 |
| Guide/Tools/Templates | 0 | 118 | 0 | 0 | 1 | 6 | 0 | 125 |
| Design Constants | 107 | 0 | 5 | 0 | 0 | 0 | 0 | 112 |
| Color Ramps | 0 | 0 | 0 | 95 | 0 | 7 | 0 | 102 |
| Method Catalog And Workflow | 0 | 94 | 5 | 0 | 0 | 0 | 0 | 99 |
| Reporting | 0 | 88 | 0 | 0 | 0 | 0 | 0 | 88 |
| Status Bar Tokens | 42 | 0 | 2 | 0 | 9 | 0 | 0 | 53 |
| Cartography Engine | 0 | 0 | 0 | 48 | 0 | 0 | 0 | 48 |
| Layer Manager | 0 | 44 | 2 | 0 | 1 | 0 | 0 | 47 |
| App Root | 0 | 18 | 3 | 0 | 4 | 0 | 0 | 25 |
| Map Drawers | 0 | 18 | 1 | 0 | 0 | 2 | 0 | 21 |
| Header And Activity Rail | 0 | 9 | 0 | 0 | 11 | 0 | 0 | 20 |
| Error/Loading/Test Utility Surfaces | 0 | 9 | 1 | 0 | 4 | 0 | 0 | 14 |
| Map Toolbar/Search/Pins | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 7 |
| Evidence And Provenance | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| Theme Provider | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |

- Dangerous color findings:
  - Success-looking demo/state contrast hotspot:
    - `src/services/data/eo/publish.ts:144` uses `"fill-color": isDemo ? "#F59E0B" : "#22C55E"`. This is semantically split but remains high-risk if labels are hidden in downstream UI.
    - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx:1440` and `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx:1111` also switch sample/project color (`#F59E0B` vs `#22C55E`) with explicit text labels.
  - Warning amber used as neutral accent at scale:
    - `src/theme/GlobalSynapseStyles.ts:18`, `src/theme/synapse.ts:14`, `src/styles/theme.ts:59` and broad component surfaces anchor primary/interactive states to `#F59E0B`.
  - Warning/error hues reused in analytical visuals:
    - `src/centerpanel/Flows/CompositeIndicatorFlow.tsx:339` uses `linear-gradient(90deg, #F59E0B, #EF4444)` for Sobol bars.
    - `src/features/dashboard/advancedCharts.tsx:206` starts categorical palette with `#f59e0b`.
    - `src/centerpanel/components/map/MapLayerManager.tsx:400` assigns `#F59E0B` to demo legend entries.

- Top 20 highest-impact migration targets:

| Rank | File | Unit | Primary Class | Findings | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `src/centerpanel/components/map/MapWorkspaceCockpit.module.css` | Map Shell And Canvas Chrome | `component-chrome` | 174 | 16 fallback usages; map shell visibility surface. |
| 2 | `src/components/ai/panel/styles.ts` | Command/Search/AI | `component-chrome` | 161 | 76 fallbacks; AI status/focus consistency risk. |
| 3 | `src/centerpanel/styles/tools.module.css` | Center Panel Shell | `component-chrome` | 169 | 61 fallbacks; broad shell styling footprint. |
| 4 | `src/components/ide/styles/ideShell.css` | IDE Shell | `component-chrome` | 154 | 49 fallbacks; editor-shell accent saturation. |
| 5 | `src/centerpanel/styles/tokens.css` | Center Panel Shell | `component-chrome` | 139 | 53 fallbacks, 6 status-semantic literals. |
| 6 | `src/features/urbanAnalytics/rightPanelFourBlock.css` | UA Shell And Modal | `component-chrome` | 131 | Dense UA chrome literals. |
| 7 | `src/components/editor/MonacoEditor.tsx` | Editor Surface | `component-chrome` | 111 | Inline preview/theme literals and gradient usage. |
| 8 | `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css` | UA Shell And Modal | `component-chrome` | 120 | Evidence surface literal density. |
| 9 | `src/features/urbanAnalytics/WelcomeModal.tsx` | UA Shell And Modal | `component-chrome` | 103 | 2 fallbacks; onboarding semantics surface. |
| 10 | `src/theme/GlobalSynapseStyles.ts` | Synapse Token Layer | `token-source` | 122 | Primary source with 32 status-semantic literals. |
| 11 | `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx` | VoxCity/3D | `component-chrome` | 96 | Demo/project color switching and accent-heavy controls. |
| 12 | `src/components/file-explorer/FileExplorer.tsx` | File Explorer | `component-chrome` | 78 | File status and icon colors hard-coded. |
| 13 | `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` | UA Shell And Modal | `component-chrome` | 70 | Modal-level accent variables hard-coded. |
| 14 | `src/components/settings/SettingsModal.tsx` | Unmapped/Other | `component-chrome` | 87 | 15 fallbacks and 7 status-semantic literals. |
| 15 | `src/features/urbanAnalytics/rail/rail.css` | UA Shell And Modal | `component-chrome` | 77 | 24 fallbacks; rail accent lock-in. |
| 16 | `src/centerpanel/styles/note.module.css` | Center Panel Shell | `component-chrome` | 106 | 50 fallbacks; note workspace density. |
| 17 | `src/constants/design.ts` | Design Constants | `token-source` | 95 | Static palette/gradient source for many consumers. |
| 18 | `src/utils/colorRamps.ts` | Color Ramps | `data-visualization` | 95 | Shared analytical palette boundary hotspot. |
| 19 | `src/components/terminal/components/Terminal.tsx` | Terminal And Bottom Panel | `component-chrome` | 75 | Terminal status/readability color literals. |
| 20 | `src/centerpanel/styles/tools.left.module.css` | Center Panel Shell | `component-chrome` | 113 | Left rail/tooling chrome literals. |

- Notes on ignored findings:
  - `ignore-with-reason` findings (122) are concentrated in template scaffolding surfaces (for example `src/templates/templateContent.ts`) and do not directly drive runtime product chrome.
- Tokens added/changed: none.
- Product code changed: none.
- Validation:
  - Documentation-only checks completed.
  - No token rename or product behavior change performed.
- Next recommended prompt: Prompt 03 - Token Taxonomy And Naming Contract.

### Prompt 01 - Style Topology Inventory - 2026-05-15

- Status: completed.
- Scope: documentation-only architecture inventory for token writers, aliases, and style consumers.
- Files inspected:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/styles/theme.ts`
  - `src/styles/GlobalStyles.ts`
  - `src/styles/ui.css`
  - `src/app/AppThemeProvider.tsx`
  - `src/contexts/ThemeContext.tsx`
  - `src/constants/design.ts`
  - `src/constants/app.ts`
  - `src/App.tsx`
  - `src/main.tsx`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Topology summary:

| Layer | File | Writes CSS Variables | Alias Families | Primary Consumers | Conflict / Risk |
| --- | --- | --- | --- | --- | --- |
| Synapse global token source | `src/theme/GlobalSynapseStyles.ts` | Yes. `:root` writes core `--syn-*` palette plus alias bridges. | `--syn-*`, `--color-*`, `--ai-*`, legacy `--panel`/`--text-1`/`--border`. | Loaded by `src/app/AppThemeProvider.tsx`; consumed by `src/theme/synapse.ts`, `src/styles/ui.css`, `src/styles/GlobalStyles.ts`, CSS Modules, and styled components. | Primary token authority exists, but includes many amber-first accents and chart/status overlap. |
| Styled-components theme bridge | `src/theme/synapse.ts` | No direct DOM writes. Exposes theme object mapped to `var(--syn-*)`. | Legacy theme keys (`gold500`, `text100`, etc.) and semantic-style keys (`root`, `surface1`, etc.). | Used through styled-components `ThemeProvider` from `src/app/AppThemeProvider.tsx`; referenced by styled components in `src/components/**`, `src/ui/theme/typography.ts`. | Duplicate semantic intent: both legacy and newer keys coexist. |
| Legacy theme model | `src/styles/theme.ts` | Indirect only via `createCSSVariables(theme)` return object. | `--color-*`, `--glass-*`, typography/spacing/z-index variables. | `themes` consumed by `src/contexts/ThemeContext.tsx`. `createCSSVariables` is currently defined but not called. | Dead-path risk: helper map diverges from runtime writer behavior. |
| Runtime legacy writer | `src/contexts/ThemeContext.tsx` | Yes. `useEffect` writes `--color-*`, `--glass-*`, and theme-state utility variables with `root.style.setProperty`. | `--color-*`, `--glass-*`, `--tag-*`, text contrast helpers. | `useTheme()` consumers in `src/App.tsx`, `src/components/utilities/Loading.tsx`, `src/components/templates/*`, `src/components/atoms/*`, `src/components/editor/MonacoEditor.tsx`. | Second active global writer overlaps with `GlobalSynapseStyles` aliases. |
| App-shell overlay vars | `src/app/AppThemeProvider.tsx` | Yes. `AppShellStyles` writes `--app-shell-*`. | `--app-shell-*`. | Shell surfaces using `data-app-shell` attributes. | Third variable namespace introduces parallel shell token channel. |
| Global utility stylesheet | `src/styles/GlobalStyles.ts` | Yes for non-theme root vars and mode logo vars; mostly consumes token vars. | `--font-*`, `--logo-*`, `--header-*`; consumes `--color-*`, `--glass-*`, `--syn-*`. | Mounted in `src/App.tsx`; affects all global HTML/body/utility classes. | Large mixed concern surface and broad fallback literals. |
| Static utility stylesheet | `src/styles/ui.css` | Yes. Local root bridges (`--bg`, `--panel-bg`, `--text`, `--accent`) from `--syn-*`. | Local bridge vars and mixed `--color-*`/`--syn-*` consumption. | Imported in both `src/main.tsx` and `src/App.tsx`; used by utility classes (`.btn`, `.input`, `.ai-shell`). | Double import path and mixed namespace usage increase drift risk. |
| Design constants palette | `src/constants/design.ts` | No direct writes. Provides static palette/tokens consumed by theme layer. | `DESIGN_TOKENS.colors.*`, gradients, mapExplorer color constants. | Imported by `src/styles/theme.ts` and `src/contexts/ThemeContext.tsx`. | Contains amber-heavy primaries and map explorer hard-coded palette constants. |
| App constants + file colors | `src/constants/app.ts` | No direct writes. | Hard-coded file type colors in `FILE_TYPES`. | File explorer and related icon surfaces consuming file metadata colors. | Hard-coded colors sit outside token pipeline. |

- Styled-components consumers:
  - `rg "styled-components" src` shows 30 matching files.
  - Consumer clusters include `src/components/atoms/*`, `src/components/ai/panel/*`, `src/components/ide/*`, `src/components/editor/*`, and theme/provider files.
- CSS Modules consumers:
  - `rg "\\.module\\.css" src` shows 99 import sites.
  - `rg --files src | rg "\\.module\\.css$"` shows 33 module stylesheets.
  - Highest concentration is `src/centerpanel/**`, with additional usage in `src/features/**`, `src/services/reporting/**`, and selected `src/components/**`.
- Legacy alias inventory:
  - Active alias families confirmed: `--syn-*`, `--color-*`, `--glass-*`.
  - Mixed-namespace reference density in inspected core files: 318 matches (`--syn-`/`--color-`/`--glass-`).
- Conflict and duplication notes:
  - App runtime mounts nested providers (`ThemeProvider` from `ThemeContext` and `AppThemeProvider`), each with token responsibilities.
  - `GlobalSynapseStyles` and `ThemeContext` both write global color variables, creating overlapping authority.
  - `createCSSVariables` exists but is currently not used, which can let declared and applied token maps drift.
  - `ui.css` is imported in both `src/main.tsx` and `src/App.tsx`.
- Amber-heavy bias evidence:
  - Amber/gold markers (`#F59E0B`, `#D97706`, `#FBBF24`, `#B45309`, `amber`, `gold`) appear 105 times across inspected topology files.
  - VS Code blue markers (`#3794ff`, `accent-blue`, `--syn-vscode`) appear 0 times in the same inspected set.
  - `info` frequently reuses amber in legacy layers (`src/styles/theme.ts`, `src/constants/design.ts`, parts of `GlobalSynapseStyles.ts`), increasing state-color ambiguity.
- Tokens added/changed: none.
- Product code changed: none.
- Validation:
  - Documentation-only checks completed.
  - No token rename/migration performed in this prompt.
- Next recommended prompt: Prompt 02 - Hard-Coded Color Inventory.

### Prompt 00 - Operating Pack Rebaseline - 2026-05-15

- Status: completed.
- Scope: documentation-only rebaseline confirmation for the color operating pack.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/ARCHIVE_READINESS.md`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Checks completed:
  - Confirmed color pack is separate from tri-modal archive preparation.
  - Confirmed branch divergence warning is recorded and unchanged as a blocker for archive movement.
  - Confirmed prompt register remains pending except executed prompt entries.
  - Recorded migration principle ordering in the ledger current-status block.
- Tokens added/changed: none.
- Product code changed: none.
- Validation:
  - Documentation-only checks completed.
  - Manifest JSON parse not required because `COLOR_SYSTEM_PROMPT_MANIFEST.json` was not changed.
- Next recommended prompt: Prompt 01 - Style Topology Inventory.

### Operating Pack Revision - 2026-05-14

- Status: completed.
- Scope: documentation-only operating pack revision requested by user.
- Files added:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
- Files rewritten:
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_DEVELOPMENT_PLAN.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Live architecture inspected:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/styles/theme.ts`
  - `src/constants/design.ts`
  - `src/app/AppThemeProvider.tsx`
  - `src/contexts/ThemeContext.tsx`
- Behavior implemented: no product behavior changed.
- Validation: pending final JSON and file checks.
- Next recommended prompt: Prompt 00 - Operating Pack Rebaseline.

## Validation History

| Date | Scope | Command | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-05-15 | Prompt A04 Urban Analytics method catalog, right-panel card chrome, and indicator panel | `git diff --check`; `npx vitest run src/features/urbanAnalytics/indicators/__tests__/IndicatorCatalogPanel.test.tsx src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`; `npm run typecheck`; `npm run test:analytics`; Standard Urban Analytics amber scan; supplemental A04 target scan | Passed | TypeScript passed; targeted tests passed with 2 files and 7 tests; Urban Analytics subset passed with 62 test files and 1111 tests; A04 target files have 0 standard/supplemental amber hits, remaining UA scan is 64 hits across 15 deferred files. |
| 2026-05-15 | Prompt A03 Urban Analytics rail, command/search, chips, and bottom actions | `git diff --check`; `npm run typecheck`; `npm run test:analytics`; Standard Urban Analytics amber scan; targeted A03 amber scan | Passed | TypeScript passed; Urban Analytics subset passed with 62 test files and 1111 tests; A03 target files have 0 standard amber hits, remaining UA scan is 64 hits across 15 deferred files. |
| 2026-05-15 | Prompt A02 Urban Analytics modal shell and welcome | `npm run typecheck`; `npm run test:analytics`; Standard Urban Analytics amber scan | Passed | TypeScript passed; Urban Analytics subset passed with 62 test files and 1111 tests; A02 target files have 0 standard amber hits, remaining UA scan is 102 hits across 19 deferred files. |
| 2026-05-15 | Active two-part prompt pack validation | `node -e "const fs=require('fs'); const p='COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json'; const j=JSON.parse(fs.readFileSync(p,'utf8')); console.log(j.prompts.length); console.log(j.prompts[0].id, j.prompts.at(-1).id);"` plus `Select-String` heading/register counts | Passed | Manifest parses with 20 active prompts from A01 to B10; sequential prompt headings count 20; active ledger register rows count 20. |
| 2026-05-15 | Prompt 00-17 audit consistency script | custom Node audit over sequential prompts, manifest, and ledger | Passed | 38 prompt headings, 38 manifest records, 38 register rows; prompts 00-17 completed; prompts 18-37 pending; logs and validation rows present; all pointers target Prompt 18. |
| 2026-05-15 | Prompt 17/10 audit cleanup TypeScript validation | `npm run typecheck` | Passed | Command Palette stable modal sizing plus map cockpit/background-task CSS cleanup compiles without TypeScript errors. |
| 2026-05-15 | Prompt 17/10 targeted amber scan | `rg` scan for legacy amber/gold literals in `MapWorkspaceCockpit.module.css` and `BackgroundTasksControl.module.css` | Passed | No legacy `#f59e0b`, `#fbbf24`, `#fde68a`, `#d97706`, or matching RGB amber literals remain in the two cleanup files. |
| 2026-05-15 | Prompt 17/10 changed-file color guard | `npm run color:guard:changed` | Passed (report mode) | Non-blocking guard scanned 17 changed files and reported 749 findings, dominated by token fallbacks, retained syntax/content colors, and future cleanup scope; no blocker introduced. |
| 2026-05-15 | Prompt 16 palette sizing follow-up | `npm run typecheck` | Passed | Command palette body height is now stable across Files/Tabs/Symbols/Commands mode changes; results scroll inside the fixed viewport. |
| 2026-05-15 | Prompt 17 TypeScript validation | `npm run typecheck` | Passed | Map shell/canvas chrome semantic token migration compiles; map visual smoke was not run in this CLI-only pass. |
| 2026-05-15 | Prompt 16 TypeScript validation | `npm run typecheck` | Passed | Command palette, global search, AI panel/composer/status, and apply preview semantic token migration compiles cleanly. |
| 2026-05-15 | Prompt 15 TypeScript validation | `npm run typecheck` | Passed | Terminal, bottom panel, tasks, output, problems, and xterm surface token migration compiles cleanly. |
| 2026-05-15 | Prompt 14 TypeScript validation | `npm run typecheck` | Passed | Editor tabs, Monaco context shell, outline/search chrome, and diagnostics summary token migration compiles cleanly. |
| 2026-05-15 | Prompt 13 TypeScript validation | `npm run typecheck` | Passed | File explorer rows, badges, file icon categories, and destructive explorer action token migration compiles cleanly. |
| 2026-05-15 | Prompt 12 TypeScript validation | `npm run typecheck` | Passed | IDE shell, header, activity rail, and placeholder pane token migration compiles cleanly. |
| 2026-05-15 | Prompt 11 TypeScript validation | `npm run typecheck` | Passed | Shared status bar and system chrome semantic status migration compiles cleanly. |
| 2026-05-15 | Prompt 10 TypeScript validation | `npm run typecheck` | Passed | Center-panel shell semantic token migration compiles across shell/header/strip surfaces. |
| 2026-05-15 | Prompt 10 changed-file lint | `npx eslint src/centerpanel/CenterPanelShell.tsx src/centerpanel/UrbanContextStrip.tsx --quiet` | Passed | Changed TSX files lint clean; no behavior-level lint regressions. |
| 2026-05-15 | Prompt 10 Tailwind changed-file scan | `rg --pcre2` pattern scan across touched center-panel files | Passed | No Tailwind utility class patterns found in touched files. |
| 2026-05-15 | Prompt 10 centerpanel tailwind script check | `npm run lint:no-tailwind-centerpanel` | Failed (tooling) | Script references a missing local file and requires a `powershell` executable unavailable in this runtime; manual changed-file scan used as substitute. |
| 2026-05-15 | Prompt 09 TypeScript validation | `npm run typecheck` | Passed | Error/loading/utility semantic token migration compiles across app and utility boundaries. |
| 2026-05-15 | Prompt 08 post-check type validation | `npm run typecheck` | Passed | Selection fallback alignment in `GlobalSynapseStyles.ts` compiles cleanly. |
| 2026-05-15 | Prompt 08 TypeScript validation | `npm run typecheck` | Passed | App-root and global-surface semantic token migration compiles cleanly across `App.tsx`, `main.tsx`, `GlobalStyles.ts`, and `ui.css`. |
| 2026-05-15 | Prompt 07 guard baseline scan | `npm run color:guard` | Passed | Report mode executed across all source files; findings inventory emitted without CI-blocking exit behavior. |
| 2026-05-15 | Prompt 07 guard validation | `npm run color:guard:changed` | Passed | Non-blocking hard-coded color guard executed in changed-file mode; report emitted with exit `0`. |
| 2026-05-15 | Prompt 06 TypeScript validation | `npm run typecheck` | Passed | Provider compatibility bridge compiles in `AppThemeProvider`, `ThemeContext`, and `styles/theme.ts`. |
| 2026-05-15 | Prompt 05 TypeScript validation | `npm run typecheck` | Passed | Semantic alias layer compiles across token source, theme bridge, and app shell provider updates. |
| 2026-05-15 | Prompt 04 TypeScript validation | `npm run typecheck` | Passed | `src/theme/synapse.ts` primitive constant additions compile cleanly. |
| 2026-05-15 | Prompt 04 token presence check | `rg` verification of new `--syn-vscode-*` tokens in `src/theme/GlobalSynapseStyles.ts`, `src/theme/synapse.ts`, and token reference | Passed | CSS/TS/token-reference primitive sets are aligned and documented. |
| 2026-05-15 | Prompt 03 taxonomy contract check | `rg` review of `COLOR_SYSTEM_TOKEN_REFERENCE.md`, `src/theme/GlobalSynapseStyles.ts`, `src/theme/synapse.ts`, `src/styles/theme.ts` | Passed | Naming layers, alias policy, forbidden usage, and deprecation contract aligned with live token sources. |
| 2026-05-15 | Prompt 03 ledger transition check | `Select-String` checks for Current/Next prompt plus Prompt 03 status row in ledger | Passed | Prompt 03 marked complete; Prompt 04 is next pointer. |
| 2026-05-15 | Prompt 02 hard-coded inventory scan | `rg --json --pcre2` over `src/**/*.{css,ts,tsx}` with exclusions for `coverage/`, `dist/`, generated files, and lockfiles | Passed | 6872 findings across 345 files; grouped counts and top targets recorded. |
| 2026-05-15 | Prompt 02 dangerous-color detection | targeted `rg` scans for demo/sample + success, amber accent overload, and chart/palette warning/error overlap | Passed | Risk examples captured in ledger with exact file and line references. |
| 2026-05-15 | Prompt 01 topology inventory | `rg` scans over required files plus `src/App.tsx` and `src/main.tsx` for token writers, alias families, and style consumers | Passed | Topology table, conflict list, and amber-bias evidence recorded without product code edits. |
| 2026-05-15 | Prompt 01 consumer counts | `rg "styled-components" src`, `rg "\\.module\\.css" src`, `rg --files src | rg "\\.module\\.css$"` | Passed | Styled-components markers: 30 files; CSS Module imports: 99; CSS Module files: 33. |
| 2026-05-15 | Prompt 00 documentation checks | `node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json','utf8')); console.log('manifest ok');"` | Passed | Manifest parses; unchanged during Prompt 00 execution. |
| 2026-05-15 | Prompt count consistency recheck | `Select-String '^## Prompt ' COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` and `Select-String '^\| [0-9][0-9] \|' COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md` | Passed | Both counts are 38; Prompt 00 marked completed and Prompt 01 remains next pending. |
| 2026-05-14 | Pack revision | `node -e "const fs=require('fs'); for (const file of ['DEVELOPMENT_PLANS/ARCHIVE_PREPARATION_MANIFEST.json','COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json']) { JSON.parse(fs.readFileSync(file,'utf8')); console.log(file + ' OK'); }"` | Passed | Both JSON manifests parse. |
| 2026-05-14 | Prompt count consistency | `Select-String` heading count plus manifest prompt count | Passed | Sequential prompt file has 38 prompt headings; manifest has 38 prompt records. |

## Known Risks

| Date | Risk | Severity | Mitigation |
| --- | --- | --- | --- |
| 2026-05-15 | Historical log entries still reference old Prompt 18 as next prompt. | Low | Treat entries before "Active Two-Part Prompt Reprioritization" as immutable history; use Current Status, Prompt Status Register, and Next Pointer for active execution. |
| 2026-05-15 | `lint:no-tailwind-centerpanel` is currently not runnable in this execution environment (`powershell` executable unavailable and referenced script missing from `scripts/`). | Medium | Keep manual changed-file Tailwind scans in prompt validations; restore/align script path in a tooling-focused follow-up. |
| 2026-05-15 | Theme preference is read from both `theme` (ThemeContext) and `synapse.theme.mode` (flags) keys, which can drift if toggled by separate surfaces. | Medium | Keep behavior unchanged for compatibility; track for dedicated persistence unification outside color prompts. |
| 2026-05-14 | Local branch is diverged from `origin/master`. | High | Do not move archive files during color prompts. |
| 2026-05-14 | Existing theme system has multiple token/provider paths. | High | Inventory first; add aliases before migration. |
| 2026-05-14 | Amber is overused in existing tokens. | Medium | Historical global tokens may remain for compatibility; active Urban Analytics modal and Map Explorer UI/default styling must remove amber entirely. |
| 2026-05-14 | Small agents may over-edit. | High | One prompt per agent and strict stop conditions. |

## Next Pointer

Prompt C01 - Center Panel Workbench Inventory And Scope Lock.
