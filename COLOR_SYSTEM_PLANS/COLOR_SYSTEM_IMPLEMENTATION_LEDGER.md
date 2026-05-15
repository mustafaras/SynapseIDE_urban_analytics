# Color System Implementation Ledger

## Purpose

This ledger is the execution source of truth for the color-system operating pack. Every color agent must read it before starting and update it before finishing.

## Current Status

- Operating pack status: reprioritized for two-part amber-removal execution on 2026-05-15.
- Historical implementation status: old broad Prompts 00-17 completed on 2026-05-15; old pending Prompts 18-37 are superseded by active prompts A01-B10.
- Active prompt count: 20 prompts, `A01` through `A10` and `B01` through `B10`.
- Current prompt: Prompt A02 - Urban Analytics Modal Shell, Backdrop, Header, And Welcome.
- Next prompt: Prompt A02 - Urban Analytics Modal Shell, Backdrop, Header, And Welcome.
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
| A02 | Urban Analytics Modal Shell, Backdrop, Header, And Welcome | pending | A01 | Remove amber shell/welcome chrome and make the modal VS Code-like. |
| A03 | Urban Analytics Rail, Command Bar, Search, Tabs, And Bottom Actions | pending | A02 | Migrate UA controls to compact unfilled non-amber interactions. |
| A04 | Urban Analytics Method Catalog, Cards, Filters, And Indicator Panel | pending | A03 | Remove amber/card-heavy method and indicator surfaces. |
| A05 | Urban Analytics Right Panel Dossier And Generated HTML | pending | A04 | Remove amber from dossier and generated report/print HTML. |
| A06 | Urban Analytics Evidence, Data Fitness, Method Validity, And Workflow Status | pending | A05 | Preserve scientific truthfulness with non-amber status surfaces. |
| A07 | Urban Analytics VoxCity, 3D, Scenario, And Simulation Panels | pending | A06 | Remove amber from VoxCity and simulation controls/panels. |
| A08 | Urban Analytics Python, Package, Script Template, And Data Bridge Panels | pending | A07 | Remove amber from UA utility/Python-adjacent surfaces. |
| A09 | Urban Analytics Final Amber Cleanup, Layout Polish, And Visual QA | pending | A08 | Final UA scan, card/button cleanup, focus and visual QA. |
| A10 | Urban Analytics Handoff And Part 2 Gate | pending | A09 | Close Part 1 and unblock Map Explorer. |
| B01 | Map Explorer Amber Inventory And Token Boundary | pending | A10 | Inventory complete Map Explorer amber scope and separate UI/data colors. |
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

Prompt A02 - Urban Analytics Modal Shell, Backdrop, Header, And Welcome.
