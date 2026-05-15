# Color System Sequential Implementation Prompts

## Purpose

This is the active prompt ladder for the next color-system workstream. It supersedes the old broad 38-prompt rollout for future execution. The previous token infrastructure and shared shell work remain historical baseline; the active priority is now intentionally narrower and stricter:

1. Part 1 removes amber from the complete Urban Analytics modal experience and restyles it as a compact premium VS Code-like workbench surface.
2. Part 2 removes amber from the complete Map Explorer experience and restyles it with the same premium VS Code-like discipline.

Each prompt is written for a small agent: narrow scope, exact search targets, allowed edits, acceptance criteria, validation, and ledger requirements.

## Active Priority Order

Do not run Map Explorer prompts until all Urban Analytics prompts are completed or explicitly skipped with reason.

| Part | Prompt IDs | Scope | Outcome |
| --- | --- | --- | --- |
| Part 1 | `A01`-`A10` | Only `src/features/urbanAnalytics/**` and directly rendered Urban Analytics modal content | Amber-free Urban Analytics modal with VS Code-like premium density, neutral workbench surfaces, thin separators, and unfilled controls |
| Part 2 | `B01`-`B10` | Map Explorer UI, map component tokens, map services that emit default colors, and related map tests | Amber-free Map Explorer with map-first workbench chrome, unfilled controls, neutral panel hierarchy, and non-amber data defaults |

## Required Reading For Every Prompt

Before editing for any prompt, read:

1. `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
2. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
3. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
4. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
5. The active prompt block in this file
6. The current status section of `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`

For any prompt touching `src/features/urbanAnalytics/**`, also read `.github/instructions/urban-analytics.instructions.md` before editing.

## Global Visual Contract

The active workstream has a stricter rule than the earlier general color plan:

- No amber/gold/yellow/orange chrome in Urban Analytics modal or Map Explorer surfaces.
- No `#F59E0B`, `#FBBF24`, `#FDE68A`, `#D97706`, `#B45309`, `#92400E`, `rgb(245 158 11 / ...)`, `rgba(245,158,11,...)`, `MAP_COLORS.amber*`, `--syn-gradient-amber*`, or amber/gold named aliases in the active scope unless a prompt explicitly documents a non-UI data-palette exception.
- Do not use `--syn-status-warning` in these two modules if it renders amber. Preserve warning meaning with explicit text, icons, disabled reasons, and non-amber status styling.
- Use VS Code-like workbench tokens: `--syn-surface-*`, `--syn-text-*`, `--syn-border-*`, `--syn-interaction-*`, and non-amber `--syn-status-*` tokens.
- Default buttons are transparent or neutral. Hover uses `--syn-interaction-hover`; active state uses icon/text color, a 1-2px rail, underline, or hairline. Avoid filled rounded button plates.
- Replace unnecessary card frames with panel rows, group headers, split gutters, thin separators, and compact spacing.
- Avoid card-in-card styling, large border radii, glow, decorative gradients, shimmer, animated background strips, marketing hero treatments, and idle placeholder panels.
- Keep feature behavior, data contracts, GIS calculations, persistence, evidence semantics, method validity, and readiness logic unchanged.

## Global Stop Conditions

Stop and report if:

- The task requires resolving the local `master` / `origin/master` branch divergence.
- The task would move or archive `DEVELOPMENT_PLANS/`.
- Product behavior, GIS calculations, evidence provenance, method validity, data-fitness interpretation, or module ownership would need to change.
- A color change would make demo, unknown, stale, blocked, invalid, residual-gap, or deferred output appear ready.
- Contrast, focus visibility, or keyboard reachability cannot be preserved without broader product redesign.
- Required validation cannot run and no manual substitute can be recorded.

## Standard Amber Scan

Run the relevant scan before and after any implementation prompt. Document every remaining hit in the ledger.

Urban Analytics:

```powershell
rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"
```

Map Explorer:

```powershell
rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning|MAP_COLORS\\.amber" src/centerpanel/components src/services/map src/stores/useMapExplorerStore.ts -g "*.ts" -g "*.tsx" -g "*.css"
```

---

# Part 1 - Urban Analytics Modal First

## Prompt A01 - Urban Analytics Amber Inventory And Scope Lock

### Objective

Build the exact amber-removal inventory for the complete Urban Analytics modal before changing code.

### Scope

- `src/features/urbanAnalytics/**`
- Directly rendered Urban Analytics modal content, including modal shell, welcome/onboarding modal, right panel dossier, evidence tray, indicators, Python utilities, and VoxCity/3D controls.

### Required Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
- `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
- `src/features/urbanAnalytics/WelcomeModal.tsx`
- `src/features/urbanAnalytics/rightPanelFourBlock.css`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css`
- `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`
- `src/features/urbanAnalytics/voxcity/*.tsx`

### Tasks

1. Run the Standard Amber Scan for Urban Analytics.
2. Group each hit as `modal-chrome`, `button-control`, `card-frame`, `status-semantic`, `generated-html`, `data-content`, `visualization-ramp`, `test-fixture`, or `retain-with-reason`.
3. Identify every heavy card frame, nested card surface, filled button, decorative amber gradient, glow, SVG amber stop, amber animated strip, and amber focus/active state.
4. Record a file-by-file migration order in the ledger.
5. Do not change product code in this prompt unless the user explicitly asks for a batch.

### Acceptance Criteria

- Ledger contains a scoped Urban Analytics amber inventory.
- Every amber hit has an owner category and a planned prompt.
- The next prompt is `A02`.
- No product code changed.

### Validation

- Documentation-only validation.
- Record the exact scan command and hit summary in the ledger.

---

## Prompt A02 - Urban Analytics Modal Shell, Backdrop, Header, And Welcome

### Objective

Remove amber and decorative card chrome from the modal shell, backdrop, top header, loading/empty shell, and welcome/onboarding modal.

### Primary Files

- `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
- `src/features/urbanAnalytics/WelcomeModal.tsx`
- `src/features/urbanAnalytics/icons.tsx` if comments or icon colors leak amber semantics

### Tasks

1. Replace amber title gradients, SVG stops, radial glows, animated strips, and top bars with neutral workbench surfaces and blue-gray interaction accents.
2. Remove marketing-style hero treatment from the welcome modal. Preserve content, but make the first viewport read like a dense workbench onboarding panel, not a brand landing page.
3. Convert shell surfaces to `--syn-surface-workbench`, `--syn-surface-panel`, `--syn-surface-elevated`, `--syn-border-subtle`, and `--syn-text-*`.
4. Replace heavy modal cards with flat panels, hairline separators, compact section headers, and scrollable panes.
5. Replace filled icon buttons with transparent icon buttons. Active/focus state should be icon/text color, 1px inset outline, or a small rail only.
6. Keep all modal open/close behavior, z-index intent, keyboard behavior, and rendered content unchanged.

### Acceptance Criteria

- No amber/gold/yellow/orange visual chrome remains in `UrbanAnalyticsModal.tsx` or `WelcomeModal.tsx`.
- Welcome modal no longer uses amber decorative gradients, radial orbs, animated brand stripes, amber CTA fills, or feature-card amber hover fills.
- Modal shell reads as a VS Code-like dark workbench: compact, panelized, neutral, and premium.
- Buttons are not filled rounded plates unless the action is truly primary; primary action uses restrained blue interaction styling, not amber.

### Validation

- `npm run typecheck`
- `npm run test:analytics`
- Re-run the Urban Analytics Standard Amber Scan and document remaining hits.

---

## Prompt A03 - Urban Analytics Rail, Command Bar, Search, Tabs, And Bottom Actions

### Objective

Restyle the modal's navigation rail, command/search row, tab-like controls, icon buttons, chips, and bottom action bar to VS Code-like compact controls without amber or heavy fills.

### Primary Files

- `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
- `src/features/urbanAnalytics/rail/rail.css`
- `src/features/urbanAnalytics/rail/RailContainer.tsx`
- Any CSS blocks embedded in `UrbanAnalyticsModal.tsx`

### Tasks

1. Convert rail buttons from rounded filled cards to VS Code-like rows or rail items.
2. Active rail state should use a thin left marker, text/icon color, or subtle selected surface. Do not use amber fill or bordered plates.
3. Search and command-bar controls should use compact input styling: `--syn-surface-input`, `--syn-border-subtle`, `--syn-border-focus`, and 2-4px radius.
4. Replace `btnpill`, `iconbtn`, tag chips, scale/flow/run chips, and bottom action buttons with neutral defaults and blue focus/active cues.
5. Preserve visible non-color labels for scale, flow, layer, run, data fitness, context sync, and evidence status.
6. Remove unnecessary button borders, glows, and card-like fills while keeping hit targets usable.

### Acceptance Criteria

- Rail, command bar, search, chips, and bottom actions contain no amber literals or amber aliases.
- Active navigation does not render as a filled amber/blue card; it uses a restrained VS Code indicator.
- Status chips still expose labels or aria text and do not imply readiness incorrectly.
- Layout remains dense and stable with no text overlap at compact widths.

### Validation

- `npm run typecheck`
- `npm run test:analytics`
- Re-run the Urban Analytics Standard Amber Scan and record residual hits.

---

## Prompt A04 - Urban Analytics Method Catalog, Cards, Filters, And Indicator Panel

### Objective

Remove amber and unnecessary card frames from the method library, card listings, section hierarchy, filters, tags, and indicator catalog.

### Primary Files

- `src/features/urbanAnalytics/store.ts`
- `src/features/urbanAnalytics/rightPanelRegistry.ts`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx` if card shell markup is shared
- `src/features/urbanAnalytics/rightPanelFourBlock.css`
- `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx`
- `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`

### Tasks

1. Convert method cards and indicator rows from boxed cards to dense list rows where possible.
2. If repeated cards must remain, use radius <= 4px, neutral background, single subtle border or no border, and no nested frame.
3. Replace amber tag, SDG badge, selected-card, hover, and focus styling with semantic neutral/blue-gray tokens.
4. Capability statuses must remain explicit: `implemented`, `demo_mode`, `residual_gap`, `environment_dependent`, `deferred`.
5. `demo_mode`, `residual_gap`, `environment_dependent`, `deferred`, and unknown states must not share valid/success styling.
6. Do not edit seed scientific content except color literals used only for visible UI examples or code-demo chart styling identified in A01.

### Acceptance Criteria

- Method/indicator surfaces no longer use amber as neutral emphasis, card highlight, icon color, tag color, or active state.
- No card-in-card frame remains in the catalog/detail transition.
- Status labels remain truthful and accessible without relying on color alone.
- Any retained color literals are documented as data/content examples, not UI chrome.

### Validation

- `npm run typecheck`
- `npm run test:analytics`
- Targeted tests for indicator/catalog files if changed.
- Re-run the Urban Analytics Standard Amber Scan.

---

## Prompt A05 - Urban Analytics Right Panel Dossier And Generated HTML

### Objective

Make the right-panel dossier and generated report/print HTML amber-free and visually aligned with the modal workbench.

### Primary Files

- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- `src/features/urbanAnalytics/rightPanelFourBlock.css`
- `src/features/urbanAnalytics/rightPanelUtils.ts`

### Tasks

1. Replace amber headings, links, table headers, SDG badges, prompt cards, and export-page styles with semantic blue/neutral workbench tokens.
2. Flatten `.rp-prompt-card`, `.rp-panel`, badges, tables, and generated HTML blocks where they currently look like nested cards.
3. Ensure generated print/export HTML remains readable in dark and print contexts without amber headers.
4. Preserve dossier assembly, evidence matching, Python scaffold dispatch, related flow mapping, and card metadata behavior.
5. Replace amber emphasized inline text with `--syn-text-link`, `--syn-interaction-active`, `--syn-status-info`, or neutral text depending on meaning.

### Acceptance Criteria

- `rightPanelFourBlock.css` and `rightPanelUtils.ts` contain no amber UI styling.
- Generated HTML no longer uses amber headings, links, or table headers.
- Right panel appears as one coherent inspector surface rather than stacked decorative cards.
- Evidence, citation, data-fitness, and method-validity warnings remain explicit in text.

### Validation

- `npm run typecheck`
- `npm run test:analytics`
- Re-run the Urban Analytics Standard Amber Scan.

---

## Prompt A06 - Urban Analytics Evidence, Data Fitness, Method Validity, And Workflow Status

### Objective

Remove amber from evidence/provenance/status surfaces without weakening scientific truthfulness.

### Primary Files

- `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
- `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css`
- `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
- `src/features/urbanAnalytics/context/dataFitness.ts`
- `src/features/urbanAnalytics/context/methodValidity.ts`
- `src/features/urbanAnalytics/lib/dataFitness.ts`
- `src/features/urbanAnalytics/lib/methodValidity.ts`
- `src/features/urbanAnalytics/lib/workflowReadiness.ts`

### Tasks

1. Replace amber warning/provenance styling with non-amber status treatments that still read as caveat, blocked, stale, unknown, or info.
2. Do not change evidence artifact creation, immutability, QA state, max artifact enforcement, scoring logic, or validity envelopes.
3. `score: null` remains unknown. Unknown must not look valid.
4. Demo/synthetic/residual-gap/environment-dependent/deferred states must keep explicit labels and must not share success styling.
5. Evidence tray rows should be compact inspector rows with separators, not nested colored cards.
6. If a status previously used amber only for attention, replace with text/icon plus neutral or blue-gray treatment.

### Acceptance Criteria

- No amber remains in evidence tray, data-fitness UI, method-validity UI, or workflow readiness chrome.
- Scientific status labels remain more explicit, not less explicit.
- No evidence artifact is mutated or deleted as part of styling work.
- Tests covering evidence/data fitness/method validity still pass.

### Validation

- `npm run typecheck`
- `npm run test:analytics`
- Targeted vitest files if touched: evidence, data fitness, method validity, workflow readiness.
- Re-run the Urban Analytics Standard Amber Scan.

---

## Prompt A07 - Urban Analytics VoxCity, 3D, Scenario, And Simulation Panels

### Objective

Remove amber from VoxCity controls, 3D viewers, sunlight simulation, scenario comparison, overlays, sliders, legends, and simulation result panels.

### Primary Files

- `src/features/urbanAnalytics/voxcity/VoxCityControls.tsx`
- `src/features/urbanAnalytics/voxcity/VoxCityViewer.tsx`
- `src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx`
- `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`
- `src/features/urbanAnalytics/voxcity/SimulationOverlay.tsx`
- `src/features/urbanAnalytics/voxcity/ScenarioCompare.tsx`
- `src/features/urbanAnalytics/voxcity/SunlightSimulator.tsx`
- `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`

### Tasks

1. Replace amber slider `accentColor`, button fills, panel headings, instructional bold text, selected ramp borders, and add-to-map controls.
2. Keep 3D canvas backgrounds dark and quiet; do not introduce decorative overlays or frame cards.
3. Use blue-gray active/focus controls and semantic status tokens for blocked/error/unknown/running.
4. Simulation legends and ramps may keep analytical color meaning only if they are not amber UI chrome. Prefer non-amber sequential palettes when these are demo defaults.
5. Verify canvas-adjacent UI does not overlap or resize unexpectedly at compact modal widths.
6. Preserve all simulation, loading, scene hook, data bridge, and map handoff logic.

### Acceptance Criteria

- VoxCity and simulation UI no longer uses amber as control, heading, selected, focus, or instruction color.
- Demo/sample state remains labeled and visually distinct.
- Controls read as compact workbench inspectors, not separate dark cards.
- Any retained visualization color ramp is documented as data, not UI chrome.

### Validation

- `npm run typecheck`
- `npm run test:analytics`
- Run VoxCity targeted tests if touched.
- Manual or Playwright screenshot smoke if canvas-adjacent layout changes.
- Re-run the Urban Analytics Standard Amber Scan.

---

## Prompt A08 - Urban Analytics Python, Package, Script Template, And Data Bridge Panels

### Objective

Remove amber and card-heavy styling from Urban Analytics Python/package/data-bridge surfaces rendered inside or launched from the modal.

### Primary Files

- `src/features/urbanAnalytics/python/PackageManager.tsx`
- `src/features/urbanAnalytics/python/PythonEnvironmentManager.tsx`
- `src/features/urbanAnalytics/python/DataBridge.ts`
- `src/features/urbanAnalytics/python/ScriptTemplates.tsx`
- `src/features/urbanAnalytics/python/templates/**/*.ts`

### Tasks

1. Replace amber status/control styling in Python environment, package, and script-template UI.
2. Keep code-template content behavior unchanged; only change visible color examples if they use amber as default plot styling and are part of modal content.
3. Use neutral surfaces, compact rows, thin separators, and transparent controls.
4. Package/install/running/error states must remain explicit with text and non-amber status colors.
5. Do not change Python execution, package installation, template generation, or data bridge contracts.

### Acceptance Criteria

- Python-related Urban Analytics UI has no amber/gold styling.
- Code examples do not default to amber for charts unless a documented scientific palette reason exists.
- Controls match the rest of the Urban Analytics modal density.

### Validation

- `npm run typecheck`
- `npm run test:analytics`
- Re-run the Urban Analytics Standard Amber Scan.

---

## Prompt A09 - Urban Analytics Final Amber Cleanup, Layout Polish, And Visual QA

### Objective

Perform the final Urban Analytics modal sweep for amber, unnecessary card frames, filled buttons, layout density, focus visibility, and text fit.

### Scope

- All `src/features/urbanAnalytics/**` runtime UI files.
- Tests only where assertions need token/name updates.

### Tasks

1. Re-run the Urban Analytics Standard Amber Scan and eliminate every UI amber hit.
2. Run a targeted scan for heavy chrome: `boxShadow`, `radial-gradient`, `linear-gradient`, `borderRadius: 10`, `border-radius:10px`, `border-radius: 999`, filled button backgrounds, and nested card classes.
3. Remove decorative gradients, card-in-card frames, and button fills that survived earlier prompts.
4. Check compact modal widths for text overflow, overlapping controls, and unstable toolbar/chip dimensions.
5. Confirm focus-visible states exist for rail, search, tabs, action buttons, close buttons, filters, sliders, and copy/export controls.
6. Update tests or snapshots only when styling token names changed.

### Acceptance Criteria

- Urban Analytics modal is amber-free except documented non-UI data-palette exceptions.
- All major modal surfaces use VS Code-like premium layout: dense inspector rows, neutral panel hierarchy, thin separators, transparent controls, restrained blue interaction.
- No demo/unknown/stale/blocked/deferred/residual-gap/environment-dependent state looks valid.
- Ledger includes screenshot/manual QA notes.

### Validation

- `npm run typecheck`
- `npm run test:analytics`
- `npm run color:guard:changed` if available.
- Manual screenshot review or Playwright smoke for the modal if a dev server is available.

---

## Prompt A10 - Urban Analytics Handoff And Part 2 Gate

### Objective

Close Part 1 and make it safe to start Map Explorer.

### Required Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`

### Tasks

1. Confirm prompts `A01`-`A09` are completed or skipped with reason.
2. Record remaining Urban Analytics amber hits, if any, with exact retain reason.
3. Record validation history: `typecheck`, `test:analytics`, scans, and visual QA.
4. Confirm no source changes outside `src/features/urbanAnalytics/**` were required for Part 1 unless documented.
5. Set the next prompt to `B01 - Map Explorer Amber Inventory And Token Boundary`.

### Acceptance Criteria

- Ledger marks Part 1 complete.
- Manifest status matches the ledger.
- No unresolved Urban Analytics amber UI debt remains.
- Map Explorer work is explicitly unblocked.

### Validation

- JSON parse for manifest if changed.
- Documentation-only validation otherwise.

---

# Part 2 - Map Explorer Second

## Prompt B01 - Map Explorer Amber Inventory And Token Boundary

### Objective

Build the exact amber-removal inventory for the complete Map Explorer before changing code.

### Scope

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/map/**`
- `src/centerpanel/components/Map*` files that render Map Explorer surfaces
- `src/services/map/**` files that emit default colors, legends, exports, or generated map content
- `src/stores/useMapExplorerStore.ts`
- Related map tests where color assertions exist

### Tasks

1. Run the Standard Amber Scan for Map Explorer.
2. Group hits as `map-ui-token`, `modal-chrome`, `control-button`, `layer-row`, `drawer-status`, `export-generated-content`, `map-default-style`, `data-palette`, `test-fixture`, or `retain-with-reason`.
3. Identify all `MAP_COLORS.amber*`, `MAP_STROKES.*` amber hairlines, `MAP_COLORS.amberDim`, amber active states, and amber default layer styles.
4. Separate UI chrome from real data visualization palettes. UI and default/demo colors must be amber-free; any retained analytical palette must be documented.
5. Record a file-by-file migration order in the ledger.
6. Do not change product code in this prompt unless the user explicitly asks for a batch.

### Acceptance Criteria

- Ledger contains a complete Map Explorer amber inventory.
- `mapTokens.ts` central amber dependencies are identified before component-level work.
- The next prompt is `B02`.
- No product code changed.

### Validation

- Documentation-only validation.
- Record the exact scan command and hit summary in the ledger.

---

## Prompt B02 - Map Tokens And Shared Map Style Primitives

### Objective

Remove amber from shared Map Explorer tokens so downstream components can migrate consistently.

### Primary Files

- `src/centerpanel/components/map/mapTokens.ts`
- `src/centerpanel/components/map/__tests__/map-components.test.ts`
- `src/constants/design.ts` only if map-specific token aliases must be re-pointed without breaking other modules

### Tasks

1. Replace `MAP_COLORS.amber*` UI aliases with non-amber names and values, such as interaction, focus, selected, info, caveat, or neutral aliases.
2. Convert `MAP_STROKES.hairline`, `hairlineStrong`, `hairlineSubtle`, and dashed strokes away from amber borders.
3. Default active/selected/focus tokens should use `--syn-interaction-active`, `--syn-border-focus`, `--syn-interaction-hover`, and neutral separators.
4. Keep map data-palette helpers separate from UI chrome. Do not route symbology through UI status tokens.
5. Update tests that explicitly assert amber token values to assert the new semantic map token contract.
6. Keep old exported names only as temporary compatibility aliases if needed, but they must no longer render amber and must be marked deprecated in comments.

### Acceptance Criteria

- `mapTokens.ts` no longer exposes amber as the primary map UI accent.
- Map styles, strokes, modal headers, tabs, and active buttons can consume non-amber shared tokens.
- Tests no longer encode amber as the expected Map Explorer accent.

### Validation

- `npm run typecheck`
- Targeted map token tests if available.
- Re-run the Map Explorer Standard Amber Scan and record central-token residuals.

---

## Prompt B03 - Map Explorer Modal, Shell, Cockpit, Canvas Chrome, And Status Bar

### Objective

Restyle the Map Explorer shell and canvas chrome as a map-first VS Code-like workbench without amber, glow, or heavy panel cards.

### Primary Files

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
- `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`

### Tasks

1. Remove amber shell accents, map header emphasis, workflow preview amber lines, canvas overlay amber borders, and focus fallback amber.
2. Replace panel-card chrome with thin separators, map-first transparent overlays, and compact inspector rows.
3. Keep map content visually primary; controls must recede behind basemap/layer symbology.
4. Status bar states must remain explicit with labels for info, warning/caveat, error, running, pending, valid, and stale. Use non-amber rendering for warnings/caveats.
5. Remove decorative gradients and glow. Use neutral panels and restrained blue/gray-blue focus.
6. Preserve map lifecycle, layer sync, viewport, keyboard fallback, and cockpit behavior.

### Acceptance Criteria

- Shell, cockpit, canvas overlays, and status bar contain no amber UI chrome.
- No button or panel reads as a decorative card unless it frames an actual floating tool.
- Map status remains truthful and text-backed.
- Map remains primary in desktop and compact layouts.

### Validation

- `npm run typecheck`
- Targeted map lifecycle/accessibility tests if touched.
- Manual or Playwright visual smoke if dev server is available.
- Re-run the Map Explorer Standard Amber Scan.

---

## Prompt B04 - Map Toolbar, Search, Pins, Context Menus, And Keyboard Controls

### Objective

Remove amber and filled button styling from Map Explorer controls, search, pins, menus, and keyboard/fallback control surfaces.

### Primary Files

- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapSearchBar.tsx`
- `src/centerpanel/components/map/MapPinSidebar.tsx`
- `src/centerpanel/components/MapContextMenu.tsx`
- `src/centerpanel/components/MapBookmarkBar.tsx`
- `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`
- `src/centerpanel/components/map/contextMenuUtils.ts`

### Tasks

1. Convert toolbar buttons to VS Code-like icon buttons: transparent default, neutral hover, blue/gray-blue active icon or rail, visible focus ring.
2. Remove amber hover/focus/active backgrounds from search results, pin rows, context actions, bookmark controls, and keyboard controls.
3. Replace filled rounded controls with compact 24-32px controls where the existing layout supports it.
4. Preserve tooltips, aria labels, disabled reasons, shortcut text, and command behavior.
5. Do not change map commands, search result resolution, pin persistence, or context menu action routing.

### Acceptance Criteria

- Controls have no amber styling and no unnecessary filled button plates.
- Active state is legible through icon/text/rail/focus, not a large filled card.
- Keyboard focus remains visible and consistent.
- Text fits inside controls at compact widths.

### Validation

- `npm run typecheck`
- Map toolbar/search/accessibility tests if touched.
- Re-run the Map Explorer Standard Amber Scan.

---

## Prompt B05 - Map Layer Manager, Layer Panel, Rows, Badges, And Selection States

### Objective

Remove amber from layer management and replace card-like layer rows with dense, truthful inspector rows.

### Primary Files

- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- `src/centerpanel/components/map/mapLayerMetadata.ts`
- `src/centerpanel/components/map/useLayerSync.ts`
- `src/centerpanel/components/map/__tests__/map-layer-management.test.ts`

### Tasks

1. Replace active layer amber fill/border/text with non-amber selected-row styling.
2. Replace layer checkbox/range `accentColor` amber with blue-gray interaction tokens.
3. Remove amber delete/dropdown/popup borders and heavy panel shadows where they read as cards.
4. Disabled, stale, hidden, invalid, unsynced, selected, and published states must remain explicit with labels, icons, or tooltips.
5. Do not change layer store behavior, order, visibility logic, style metadata, or sync semantics.
6. Update tests that expect amber layer defaults or token names.

### Acceptance Criteria

- Layer rows, badges, toggles, dropdowns, and active states are amber-free.
- Row surfaces are compact and separator-led rather than card-led.
- State truthfulness is preserved without color-only communication.

### Validation

- `npm run typecheck`
- Targeted layer management tests.
- Re-run the Map Explorer Standard Amber Scan.

---

## Prompt B06 - Map Drawers, Scientific QA, NL Query, Review Timeline, And Report Handoff

### Objective

Remove amber from high-risk Map Explorer drawers while preserving QA, CRS, publication readiness, query safety, review, and report status semantics.

### Primary Files

- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/centerpanel/components/map/ScientificQAPanel.tsx`
- `src/centerpanel/components/map/MapNLQueryPanel.tsx`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/centerpanel/components/map/CartographyRecommendationList.tsx`

### Tasks

1. Replace amber warning/caveat backgrounds, left borders, links, drawer titles, recommendation highlights, and report-readiness badges.
2. Use explicit labels and non-amber status tones for `blocked`, `ready-with-caveats`, `needs-review`, `unknown`, `stale`, and `info`.
3. Flatten drawer content: remove nested cards where list rows, sections, and thin separators are sufficient.
4. Keep QA, CRS, NL-query safety, review timeline, report handoff, and cartography recommendation logic unchanged.
5. Ensure report/action buttons are transparent or restrained blue, not filled amber plates.
6. Preserve text labels and aria naming for scientific status surfaces.

### Acceptance Criteria

- Drawer surfaces contain no amber UI styling.
- Warning/caveat semantics remain stronger than neutral text through labels, icons, and non-amber status treatment.
- Drawers look like VS Code inspectors, not card stacks.
- No scientific readiness state is weakened or misrepresented.

### Validation

- `npm run typecheck`
- Targeted tests for NL query, report handoff, QA, and recommendations if touched.
- Re-run the Map Explorer Standard Amber Scan.

---

## Prompt B07 - Map Import, Export, Service, Drawing, Measurement, Temporal, And Dialog Surfaces

### Objective

Remove amber from secondary Map Explorer tools and generated/export-adjacent UI without changing import/export or analysis behavior.

### Primary Files

- `src/centerpanel/components/MapDataImportHubDialog.tsx`
- `src/centerpanel/components/MapCsvImportDialog.tsx`
- `src/centerpanel/components/MapColumnarImportDialog.tsx`
- `src/centerpanel/components/MapDataExportDialog.tsx`
- `src/centerpanel/components/MapExportDialog.tsx`
- `src/centerpanel/components/MapServiceDialog.tsx`
- `src/centerpanel/components/MapDrawingManager.tsx`
- `src/centerpanel/components/MapMeasurementTool.tsx`
- `src/centerpanel/components/MapTemporalPlayer.tsx`
- `src/centerpanel/components/MapVoxCityOverlay.tsx`

### Tasks

1. Remove amber dialog titles, primary buttons, tab fills, progress/status chips, form focus rings, and generated preview chrome.
2. Convert dialogs to compact workbench modal styling: neutral panels, thin borders, dense form rows, restrained focus.
3. Ensure export and report statuses distinguish valid/error/info/blocked/stale without amber warning fill.
4. Preserve file parsing, import validation, export services, drawing tools, measurement CRS warnings, temporal playback, and VoxCity overlay behavior.
5. Replace any amber generated preview marker only if it is UI chrome or default/demo styling; document real data-palette exceptions.

### Acceptance Criteria

- Map tool dialogs and secondary tools are amber-free in UI chrome.
- Dialog buttons no longer use decorative filled amber plates.
- CRS/measurement/export warnings remain explicit with text and non-amber status treatment.

### Validation

- `npm run typecheck`
- Targeted component/service tests if touched.
- Re-run the Map Explorer Standard Amber Scan.

---

## Prompt B08 - Map Visualization Defaults, Symbology, Cartography Services, And Exports

### Objective

Remove amber as a default/demo/generated map color while preserving legitimate analytical palette separation.

### Primary Files

- `src/centerpanel/components/MapChoroplethLayer.tsx`
- `src/centerpanel/components/MapHeatmapLayer.tsx`
- `src/centerpanel/components/MapSymbolLayer.tsx`
- `src/centerpanel/components/MapClusterViz.tsx`
- `src/centerpanel/components/MapHotSpotViz.tsx`
- `src/centerpanel/components/MapEmergingHotSpotViz.tsx`
- `src/centerpanel/components/map/heatmapStyleUtils.ts`
- `src/centerpanel/components/map/symbologyUtils.ts`
- `src/centerpanel/components/map/spatialStatsVizUtils.ts`
- `src/centerpanel/components/map/symbolStyleUtils.ts`
- `src/centerpanel/components/map/demoDataPacks.ts`
- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapCartographyAdvisor.ts`
- `src/services/map/MapPersistenceService.ts`
- `src/services/map/MapExportService.ts`
- `src/services/map/ExternalServiceConnector.ts`

### Tasks

1. Replace amber default layer colors, fallback style colors, demo pack colors, generated export compass/crosshair accents, and Query-to-SQL default layer colors.
2. Use non-amber defaults such as blue, cyan, teal, violet, slate, or documented data-ramp colors that do not collide with UI status meanings.
3. Do not conflate data visualization palettes with UI chrome tokens. Data colors may be literals or helper palettes when they represent symbology.
4. If an external palette contains a yellow/orange stop for analytical reasons, document it as a data-palette exception and ensure it is not named amber/gold or used as UI chrome.
5. Update service and renderer tests that explicitly expect `#F59E0B` defaults.
6. Preserve geometry handling, CRS handling, export output structure, data persistence, and rendering logic.

### Acceptance Criteria

- No default/demo/generated Map Explorer style uses amber.
- Tests no longer describe Query-to-SQL or layer defaults as amber.
- Data palette exceptions are documented with purpose and are visually distinct from UI status colors.
- UI status colors remain separate from map symbology.

### Validation

- `npm run typecheck`
- Targeted map service/renderer tests touched by color defaults.
- Re-run the Map Explorer Standard Amber Scan and classify any data-palette residuals.

---

## Prompt B09 - Map Explorer Final Amber Cleanup, Tests, Accessibility, And Visual QA

### Objective

Perform the final Map Explorer sweep for amber, unnecessary card frames, filled controls, layout density, focus visibility, data-palette boundaries, and test drift.

### Scope

- All Map Explorer runtime UI files.
- Map services that generate visible colors.
- Related tests with color assertions.

### Tasks

1. Re-run the Map Explorer Standard Amber Scan and eliminate every UI/default amber hit.
2. Run targeted scans for `boxShadow`, `radial-gradient`, `linear-gradient`, `borderRadius: 10`, `border-radius: 999`, filled button backgrounds, and `MAP_COLORS.amber`.
3. Remove unnecessary card frames and button fills while keeping genuine floating tools framed enough to read over the map.
4. Check map desktop and compact layouts for control overlap, text overflow, focus visibility, and map content occlusion.
5. Verify all drawers, dialogs, layer rows, search results, toolbar controls, and status surfaces preserve labels or aria names.
6. Update tests and docs only where token names or expected non-amber defaults changed.

### Acceptance Criteria

- Map Explorer is amber-free except documented analytical palette exceptions.
- Map UI uses VS Code-like premium layout: map-first, quiet chrome, neutral hairlines, compact controls, restrained blue-gray interaction.
- No map readiness/QA/CRS/publication status is made less explicit.
- Ledger includes screenshot/manual QA notes.

### Validation

- `npm run typecheck`
- Targeted map tests for changed files.
- `npm run color:guard:changed` if available.
- Manual screenshot review or Playwright smoke if a dev server is available.

---

## Prompt B10 - Final Color System Handoff

### Objective

Close the two-part color-system workstream.

### Required Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md` if final token notes changed

### Tasks

1. Confirm prompts `A01`-`A10` and `B01`-`B09` are completed or skipped with reason.
2. Record remaining amber hits by exact file and category. UI/default amber debt should be zero.
3. Record validation history: typecheck, analytics tests, targeted map tests, scans, color guard, and visual QA.
4. Confirm all retained color literals are either token-source, test-fixture, or documented data-palette/content exceptions.
5. Confirm no GIS calculations, evidence semantics, method validity, workflow readiness, map persistence, or cross-module contracts changed.
6. Update manifest statuses to match the ledger and mark the workstream complete.

### Acceptance Criteria

- Ledger and manifest agree.
- Urban Analytics modal is amber-free and premium VS Code-like.
- Map Explorer is amber-free and premium VS Code-like.
- No unnecessary card frames or button fills remain in the active scope.
- Final handoff lists no unresolved blocker.

### Validation

- JSON parse for manifest.
- Broadest practical validation if product files changed:
  - `npm run typecheck`
  - `npm run test:analytics`
  - targeted map tests changed by Part 2
  - screenshot/manual QA evidence
