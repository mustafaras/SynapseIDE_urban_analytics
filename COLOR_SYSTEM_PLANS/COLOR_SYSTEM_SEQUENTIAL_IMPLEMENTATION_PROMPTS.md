# Color System Sequential Implementation Prompts

## Purpose

This file is the executable prompt ladder for applying the VS Code-inspired color system across the whole application. It is designed for small, low-context agents: each prompt is intentionally narrow, names the unit to inspect, defines allowed edits, and ends with concrete validation and ledger requirements.

## Operating Rule

Execute prompts in order unless `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md` explicitly marks a prompt complete or skipped with reason. Do not batch prompts unless the user explicitly asks for a batch.

## Required Reading For Every Prompt

Before editing for any prompt, read:

1. `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
2. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
3. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
4. The active prompt block in this file
5. The current status section of `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`

## Global Stop Conditions

Stop and report if:

- The task requires resolving the local `master` / `origin/master` branch divergence.
- The task would move or archive `DEVELOPMENT_PLANS/`.
- Product behavior, GIS calculations, evidence provenance, or module ownership would need to change.
- Color changes could make demo, unknown, stale, blocked, or invalid output appear ready.
- Required validation cannot run and no manual substitute is possible.

---

## Prompt 00 - Operating Pack Rebaseline

### Objective

Rebaseline the color-system pack after archive-prep work and confirm the next prompt is safe to execute.

### Required Files

- `COLOR_SYSTEM_PLANS/README.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- `DEVELOPMENT_PLANS/ARCHIVE_READINESS.md`

### Tasks

1. Confirm this color pack is separate from the tri-modal archive preparation.
2. Confirm the local branch divergence warning is recorded.
3. Confirm every color prompt status is `pending` unless already executed.
4. Record the initial migration principle: token infrastructure first, shared shell second, module surfaces third, QA last.

### Acceptance Criteria

- Ledger says Prompt 00 is complete.
- Next pointer is Prompt 01.
- No product code changed.

### Validation

- Documentation-only validation.
- Run JSON parse only if manifest changed.

---

## Prompt 01 - Style Topology Inventory

### Objective

Inventory the live style architecture so later agents do not invent a parallel theme system.

### Required Files

- `src/theme/GlobalSynapseStyles.ts`
- `src/theme/synapse.ts`
- `src/styles/theme.ts`
- `src/styles/GlobalStyles.ts`
- `src/styles/ui.css`
- `src/app/AppThemeProvider.tsx`
- `src/contexts/ThemeContext.tsx`
- `src/constants/design.ts`
- `src/constants/app.ts`

### Tasks

1. Identify each source of global tokens and which one writes CSS variables.
2. Identify legacy `--color-*`, `--glass-*`, and `--syn-*` aliases.
3. Identify styled-components theme consumers and CSS Modules consumers.
4. Record conflicts, duplicate tokens, and the current amber-heavy bias.
5. Update the ledger with a style topology table.

### Acceptance Criteria

- Ledger has a topology summary with exact files.
- No token is renamed yet.
- No product code changed unless a typo in docs is fixed.

### Validation

- Documentation-only validation.

---

## Prompt 02 - Hard-Coded Color Inventory

### Objective

Create the first precise inventory of hard-coded colors and categorize risk.

### Required Search Scope

- `src/**/*.{css,ts,tsx}`
- Exclude `coverage/`, `dist/`, generated files, and package lock files.

### Tasks

1. Search for hex, `rgb()`, `rgba()`, `hsl()`, named color literals, gradients, and CSS variable fallbacks.
2. Group findings by unit from `COLOR_SYSTEM_UNIT_MATRIX.md`.
3. Mark each finding as one of: `token-source`, `component-chrome`, `status-semantic`, `data-visualization`, `fallback`, `test-fixture`, `ignore-with-reason`.
4. Identify dangerous colors: success-looking demo states, warning colors used as neutral accents, UI warning/error reused in charts without semantic meaning.
5. Record the top 20 highest-impact migration targets in the ledger.

### Acceptance Criteria

- Ledger includes grouped counts and top migration targets.
- No code changed.

### Validation

- Documentation-only validation.

---

## Prompt 03 - Token Taxonomy And Naming Contract

### Objective

Finalize the primitive, semantic, component alias, status, and data-palette token taxonomy before any UI migration.

### Required Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
- `src/theme/GlobalSynapseStyles.ts`
- `src/theme/synapse.ts`
- `src/styles/theme.ts`

### Tasks

1. Define the canonical naming layers: primitive, semantic, component alias, status, and data palette.
2. Define which existing tokens are kept as compatibility aliases.
3. Define forbidden direct usages for components, such as primitives in feature UI.
4. Define deprecation notes for old amber-first names without deleting them yet.
5. Update token reference and ledger.

### Acceptance Criteria

- Token reference gives exact token naming rules.
- Agents can tell which token family to use for any component.
- No product code migration yet.

### Validation

- Documentation-only validation.

---

## Prompt 04 - VS Code Primitive Palette Layer

### Objective

Add the VS Code-inspired primitive palette as non-breaking variables.

### Primary Files

- `src/theme/GlobalSynapseStyles.ts`
- `src/theme/synapse.ts`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`

### Allowed Edits

- Add `--syn-vscode-*` primitive variables.
- Add TypeScript raw palette constants if consistent with `src/theme/synapse.ts`.
- Do not replace existing `--syn-*` consumers yet.

### Tasks

1. Add primitive background/surface/text/border/accent/status values from the token reference.
2. Keep amber available as `attention`, not as the only accent.
3. Add blue interactive primitives.
4. Add demo, unknown, stale, and blocked primitives.
5. Update ledger with exact tokens added.

### Acceptance Criteria

- Existing UI still compiles.
- Old tokens remain defined.
- New primitives are documented.

### Validation

- `npm run typecheck` if TypeScript token files changed.
- Otherwise documentation/CSS parse confidence plus ledger record.

---

## Prompt 05 - Semantic Token Alias Layer

### Objective

Create semantic aliases that map product meaning to the new primitives while preserving legacy aliases.

### Primary Files

- `src/theme/GlobalSynapseStyles.ts`
- `src/theme/synapse.ts`
- `src/app/AppThemeProvider.tsx`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`

### Tasks

1. Add semantic surface tokens: workbench, navigation, panel, editor, elevated, input, overlay.
2. Add semantic text tokens: default, secondary, muted, disabled, inverse, link.
3. Add semantic border tokens: default, subtle, strong, active, focus.
4. Add interaction tokens: hover, selected, active, focus ring, disabled.
5. Add status tokens: valid, warning, error, info, blocked, stale, unknown, demo, running, pending.
6. Add compatibility aliases from old `--color-*` and `--syn-*` where safe.

### Acceptance Criteria

- Components can consume semantic tokens without knowing primitive values.
- Legacy tokens still resolve.
- Token reference reflects aliases.

### Validation

- `npm run typecheck` if TS changed.
- Manual app load if feasible.

---

## Prompt 06 - Theme Provider Compatibility Pass

### Objective

Ensure both theme provider paths expose the same color semantics without changing persistence behavior.

### Primary Files

- `src/app/AppThemeProvider.tsx`
- `src/contexts/ThemeContext.tsx`
- `src/styles/theme.ts`
- `src/config/flags.ts`

### Tasks

1. Map new semantic tokens into provider-created CSS variables.
2. Keep existing `theme`, `synapse.theme.mode`, and `auto` behavior intact.
3. Do not add direct `localStorage` calls beyond existing code.
4. Record any existing direct persistence issue as a risk, not a color migration blocker.
5. Add ledger notes for which provider path owns which variables.

### Acceptance Criteria

- No theme mode disappears.
- Existing tests/typecheck are not broken.
- Agents know which provider to touch next.

### Validation

- `npm run typecheck`.

---

## Prompt 07 - Token Regression Guard Plan

### Objective

Add or document a lightweight guard so future agents can detect newly introduced hard-coded chrome colors.

### Primary Files

- `scripts/` only if adding a script is low-risk.
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
- `package.json` only if adding a script is explicitly safe.

### Tasks

1. Prefer documentation if a script would be too broad.
2. If adding a script, scan only source files and ignore data palettes/tests by allowlist.
3. Document allowed hard-coded color categories.
4. Do not fail CI until the inventory is mature.

### Acceptance Criteria

- Future agents know how to find new hard-coded colors.
- No false CI blocker is introduced.

### Validation

- Run the script if one is added.
- Otherwise documentation-only validation.

---

## Prompt 08 - App Root And Global Surface Migration

### Objective

Apply semantic surface/text/border tokens to the root app surfaces.

### Primary Files

- `src/app/AppThemeProvider.tsx`
- `src/app/AppRoot.tsx`
- `src/App.tsx`
- `src/main.tsx`
- `src/styles/GlobalStyles.ts`
- `src/styles/ui.css`

### Tasks

1. Replace root background and body text values with semantic tokens.
2. Align global selection color with blue interactive accent, not amber unless attention is intended.
3. Keep scrollbar and overlay colors restrained.
4. Preserve font and spacing behavior.
5. Update ledger with before/after token usage.

### Acceptance Criteria

- Root shell reads as VS Code-like dark charcoal.
- No layout movement.
- No module-specific surface is migrated here.

### Validation

- `npm run typecheck` if TS touched.
- Manual shell load if feasible.

---

## Prompt 09 - Error Loading And Utility Surface Migration

### Objective

Tokenize emergency and utility surfaces without reducing clarity.

### Primary Files

- `src/app/ErrorBoundary.tsx`
- `src/components/utilities/Loading.tsx`
- `src/components/utilities/ErrorBoundary.tsx`
- `src/components/utilities/TestHarness.tsx`

### Tasks

1. Replace hard-coded text, border, and surface colors with semantic tokens.
2. Keep danger states visibly dangerous with labels and accessible contrast.
3. Keep test harness pass/fail colors semantic and readable.
4. Record intentionally retained fixture colors if any.

### Acceptance Criteria

- Error and test states remain obvious.
- No behavior changes.

### Validation

- `npm run typecheck`.

---

## Prompt 10 - Center Panel Shell Migration

### Objective

Align the center panel shell with workbench semantic tokens.

### Primary Files

- `src/centerpanel/CenterPanelShell.tsx`
- `src/centerpanel/*.module.css`
- `src/centerpanel/UrbanContextStrip.tsx`
- `src/centerpanel/urban-context-strip.module.css`

### Tasks

1. Tokenize shell background, panel surfaces, separators, focus rings, and compact status text.
2. Preserve dense layout and avoid new cards or decorative chrome.
3. Ensure active tab or active section uses blue interactive markers.
4. Preserve amber only for attention/provenance/warning.

### Acceptance Criteria

- Center shell uses semantic tokens.
- No Tailwind introduced.
- No center panel workflow changes.

### Validation

- `npm run typecheck` if TS touched.
- Changed-file lint when practical.

---

## Prompt 11 - Shared Status Bar And System Chrome Migration

### Objective

Normalize top-level status surfaces, badges, and system indicators.

### Primary Files

- `src/components/StatusBar/statusTheme.ts`
- `src/components/StatusBar/StatusBar.tsx`
- Shared status/badge helpers discovered by Prompt 02.

### Tasks

1. Map status bar colors to semantic surface/status tokens.
2. Distinguish info, warning, error, running, pending, and stale.
3. Ensure compact status labels remain readable.
4. Preserve non-color labels or icons.

### Acceptance Criteria

- Status bar no longer uses unrelated amber for neutral info.
- Semantic status colors are documented.

### Validation

- `npm run typecheck`.

---

## Prompt 12 - Synapse IDE Shell And Header Migration

### Objective

Migrate the IDE shell, header, activity rail, and placeholder panes to VS Code-like workbench tokens.

### Primary Files

- `src/components/ide/EnhancedIDE.tsx`
- `src/components/ide/ideShell.css`
- `src/components/ide/Header.tsx`
- `src/components/ide/ShellPlaceholderPane.tsx`

### Tasks

1. Tokenize shell regions: activity rail, side bar, editor host, right panel, bottom panel boundaries.
2. Use blue for active/focus, not broad amber fills.
3. Keep truthful online/offline/sync statuses.
4. Avoid card-in-card styling in shell regions.
5. Record any remaining hard-coded colors with reasons.

### Acceptance Criteria

- IDE shell visually matches the VS Code-inspired target.
- No command or bridge behavior changes.

### Validation

- `npm run typecheck`.
- Changed-file lint when practical.

---

## Prompt 13 - Synapse File Explorer And File Badges

### Objective

Tokenize file explorer rows, GIS-aware badges, file icons, and destructive states.

### Primary Files

- `src/components/file-explorer/`
- `src/stores/fileExplorerStore.ts` only if needed for tests or fixtures.
- `src/constants/app.ts`

### Tasks

1. Tokenize tree background, hover, selected, focus, drag/drop, and muted metadata.
2. Review file-type colors in `src/constants/app.ts` and map them to stable token categories.
3. Preserve generated artifact warnings and destructive operation danger styling.
4. Ensure selected file and focused file are distinguishable.

### Acceptance Criteria

- File explorer remains compact and scannable.
- File type colors are documented or tokenized.

### Validation

- `npm run typecheck`.
- Existing file explorer tests if behavior code changes.

---

## Prompt 14 - Editor Tabs Monaco Outline And Search

### Objective

Align editor-adjacent surfaces with the token system while preserving code readability.

### Primary Files

- `src/components/editor/`
- Monaco wrapper files discovered in Prompt 02.
- `src/components/ide/GlobalSearch.tsx`
- Outline/symbol components.

### Tasks

1. Tokenize editor tab active/inactive/dirty/pinned states.
2. Tokenize breadcrumbs, outline, search results, match highlights, and diagnostics summary colors.
3. Do not change Monaco syntax theme unless a dedicated token mapping exists.
4. Keep search match highlighting distinct from warning/error.

### Acceptance Criteria

- Editor chrome follows semantic tokens.
- Syntax highlighting remains readable.

### Validation

- `npm run typecheck`.

---

## Prompt 15 - Terminal Bottom Panel Tasks And Problems

### Objective

Tokenize terminal, tasks, output, problems, and bottom panel states.

### Primary Files

- `src/components/terminal/`
- `src/components/ide/BottomPanel.tsx`
- `src/components/editor/ProblemsPane.tsx`
- Related CSS files.

### Tasks

1. Keep terminal background dark and quiet.
2. Tokenize task states: queued, running, success, error, cancelled.
3. Tokenize diagnostics severity without relying on color alone.
4. Preserve xterm theme readability and cursor visibility.

### Acceptance Criteria

- Problems and terminal states remain accessible.
- No terminal connection behavior changes.

### Validation

- `npm run typecheck`.
- Terminal/component tests if touched logic exists.

---

## Prompt 16 - Command Palette Search And AI Panel

### Objective

Tokenize command palette, global search, AI composer, context strips, apply preview, and warnings.

### Primary Files

- `src/components/ide/CommandPalette.tsx`
- `src/components/ide/GlobalSearch.tsx`
- `src/components/ai/`
- `src/utils/ai/apply/` UI-facing components.

### Tasks

1. Tokenize palette input, grouped results, selected row, disabled reason, and focus states.
2. Tokenize AI context, diagnostics, evidence, conflict, and apply/revert states.
3. Keep generated-code and uncertainty warnings explicit.
4. Do not change prompt construction or apply-plan behavior.

### Acceptance Criteria

- AI warnings remain truthful and prominent.
- Palette keyboard state remains visible.

### Validation

- `npm run typecheck`.
- Targeted tests only if logic changes.

---

## Prompt 17 - Map Explorer Shell And Canvas Chrome

### Objective

Align Map Explorer shell, cockpit, and canvas chrome while keeping the map visually primary.

### Primary Files

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`

### Tasks

1. Tokenize map shell surfaces, separators, cockpit status, and canvas overlays.
2. Keep map controls legible over basemaps.
3. Avoid decorative overlays, glow, or heavy cards.
4. Preserve QA/CRS/publication readiness text.

### Acceptance Criteria

- Map remains the largest and clearest visual surface.
- Chrome colors do not compete with layer symbology.

### Validation

- `npm run typecheck`.
- Map visual smoke if practical.

---

## Prompt 18 - Map Toolbar Search Pins And Controls

### Objective

Tokenize interactive map controls and their keyboard/focus states.

### Primary Files

- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapSearchBar.tsx`
- `src/centerpanel/components/map/MapPinSidebar.tsx`
- `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`

### Tasks

1. Tokenize icon button default, hover, active, disabled, and focus states.
2. Ensure selected basemap/tool state is visible without only color.
3. Preserve accessible names and keyboard fallbacks.
4. Keep amber rare: warnings or provenance only.

### Acceptance Criteria

- All toolbar controls have visible focus and selected states.
- No map command behavior changes.

### Validation

- `npm run typecheck`.
- Map accessibility tests if touched.

---

## Prompt 19 - Map Layer Manager And Layer Rows

### Objective

Tokenize layer manager rows, badges, action buttons, and layer metadata states.

### Primary Files

- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- `src/centerpanel/components/map/mapTypes.ts` only if status color metadata is typed.

### Tasks

1. Tokenize row hover, selected, disabled, hidden, stale, derived, and queryable states.
2. Tokenize source, CRS, QA, readiness, evidence, and demo badges.
3. Ensure delete/destructive actions use danger tokens and labels.
4. Keep layer swatches tied to symbology, not shell status colors.

### Acceptance Criteria

- Layer rows are scan-friendly and truthful.
- Unknown metadata is visibly unknown, not ready.

### Validation

- `npm run typecheck`.
- Layer-manager tests if behavior code changes.

---

## Prompt 20 - Map Drawers QA NL Query Review And Report

### Objective

Tokenize Map Explorer drawers and high-risk scientific status surfaces.

### Primary Files

- `src/centerpanel/components/map/ScientificQAPanel.tsx`
- `src/centerpanel/components/map/MapNLQueryPanel.tsx`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`

### Tasks

1. Tokenize QA severity, blockers, warnings, unknowns, stale findings, and publication readiness.
2. Keep NL query accepted/rejected/applied/failed states explicit.
3. Tokenize timeline events by semantic category without hiding text labels.
4. Keep report handoff caveats, citations, and reproducibility blocks readable.

### Acceptance Criteria

- Scientific risk states cannot be mistaken for ready states.
- Drawer density remains professional.

### Validation

- `npm run typecheck`.
- Focused Map drawer tests if changed.

---

## Prompt 21 - Map Data Visualization Palette Boundary

### Objective

Separate map data colors from UI chrome/status colors.

### Primary Files

- `src/centerpanel/components/MapChoroplethLayer.tsx`
- `src/centerpanel/components/MapHeatmapLayer.tsx`
- `src/centerpanel/components/MapSymbolLayer.tsx`
- `src/centerpanel/components/MapClusterViz.tsx`
- `src/centerpanel/components/MapHotSpotViz.tsx`
- `src/centerpanel/components/MapTemporalPlayer.tsx`
- `src/utils/colorRamps.ts`

### Tasks

1. Inventory map renderer palettes and legend colors.
2. Document which colors are data palettes and should not be replaced by UI tokens.
3. Add or map dedicated data palette tokens only if useful.
4. Ensure no-data/unknown/uncertainty are labeled and not only gray.

### Acceptance Criteria

- Data palette boundaries are recorded in token reference or ledger.
- UI warning/error colors are not reused for unrelated data categories.

### Validation

- `npm run typecheck` if TS changed.
- `npm run test -- src/utils/__tests__/colorRamps.test.ts` if color ramp helpers changed.

---

## Prompt 22 - Urban Analytics Shell And Navigation

### Objective

Align Urban Analytics modal shell and navigation with semantic tokens.

### Required Instruction

Before editing `src/features/urbanAnalytics/**`, read `.github/instructions/urban-analytics.instructions.md`.

### Primary Files

- `src/features/urbanAnalytics/`
- Relevant CSS Modules in the Urban Analytics tree.

### Tasks

1. Tokenize modal surfaces, navigation, tabs, compact headings, and separators.
2. Preserve minimal premium density.
3. Do not change analytical context or evidence logic.
4. Record every touched UA file in the ledger.

### Acceptance Criteria

- UA shell aligns with shared workbench tokens.
- No evidence semantics changed.

### Validation

- `npm run typecheck`.
- `npm run test:analytics` if any UA file changes.

---

## Prompt 23 - Urban Analytics Method Catalog And Workflow States

### Objective

Tokenize method catalog, workflow, capability, and recommendation states.

### Primary Files

- `src/features/urbanAnalytics/seeds/`
- Method catalog/workflow components discovered by Prompt 02.
- `src/features/urbanAnalytics/lib/methodValidity.ts`

### Tasks

1. Distinguish `implemented`, `demo_mode`, `residual_gap`, `environment_dependent`, and `deferred` visually and textually.
2. Ensure demo mode cannot look like implemented/ready.
3. Tokenize workflow running/pending/blocked/success states.
4. Preserve method validity envelope semantics.

### Acceptance Criteria

- Capability statuses are explicit and accessible.
- No method formulas or validity logic changed.

### Validation

- `npm run typecheck`.
- `npm run test:analytics`.

---

## Prompt 24 - Urban Analytics Evidence Data Fitness And Provenance

### Objective

Tokenize evidence artifacts, data fitness, provenance, QA, and uncertainty states.

### Primary Files

- `src/features/urbanAnalytics/context/`
- `src/features/urbanAnalytics/lib/dataFitness.ts`
- Evidence and data fitness UI components discovered by Prompt 02.

### Tasks

1. Treat `score: null` as unknown visually and textually.
2. Tokenize stale, invalid, warning, blocked, unknown, and valid evidence states.
3. Preserve artifact immutability and QA-state semantics.
4. Record scientific integrity notes in the ledger.

### Acceptance Criteria

- Unknown data fitness never appears ready.
- Evidence provenance remains explicit.

### Validation

- `npm run typecheck`.
- `npm run test:analytics`.

---

## Prompt 25 - Urban Analytics VoxCity And 3D Surfaces

### Objective

Tokenize 3D/VoxCity adjacent controls and sample/demo labels without affecting rendering logic.

### Primary Files

- `src/features/urbanAnalytics/voxcity/`
- Related 3D controls and panels.

### Tasks

1. Tokenize panel chrome, overlays, legends, and warnings.
2. Keep sample/demo caveats visible.
3. Do not change Three.js scene logic or simulation calculations.
4. Plan screenshot verification if a canvas is touched.

### Acceptance Criteria

- 3D controls align with the workbench palette.
- Demo/sample mode stays explicit.

### Validation

- `npm run typecheck`.
- `npm run test:analytics` if UA logic touched.
- Screenshot smoke if 3D scene styling changes.

---

## Prompt 26 - Dashboard Education Reporting And Guide Surfaces

### Objective

Tokenize supporting surfaces outside the main IDE/Map/UA modules.

### Primary Files

- `src/features/dashboard/`
- `src/services/reporting/` UI-facing files
- `src/centerpanel/Guide/`
- `src/centerpanel/Tools/`
- `src/components/templates/`

### Tasks

1. Tokenize chart containers, report caveats, education references, guide rails, and tool panels.
2. Keep report/publication readiness and caveats explicit.
3. Avoid marketing-style hero or decorative card treatments.
4. Record any retained illustrative colors.

### Acceptance Criteria

- Supporting surfaces align with workbench chrome.
- Data/chart colors remain separate from UI status colors.

### Validation

- `npm run typecheck`.
- Targeted tests only if behavior changes.

---

## Prompt 27 - Analytical Palette Helpers And Cartography Engine

### Objective

Document and, where safe, token-align analytical palette helpers without breaking cartographic semantics.

### Primary Files

- `src/utils/colorRamps.ts`
- `src/engine/carto/ColorBrewerIntegration.ts`
- `src/engine/carto/SymbologyManager.ts`
- `src/engine/carto/ClassificationSchemes.ts`
- `src/engine/carto/BivariateChoropleth.ts`

### Tasks

1. Define sequential, diverging, categorical, residual, uncertainty, and no-data palettes.
2. Preserve established cartographic palette behavior unless a bug is found.
3. Add comments or docs for why data colors are separate from chrome colors.
4. Add tests only for helper behavior, not visual snapshots.

### Acceptance Criteria

- Analytical palettes are documented and test-safe.
- UI status colors are not used accidentally as arbitrary data categories.

### Validation

- `npm run test -- src/utils/__tests__/colorRamps.test.ts` if helpers change.
- `npm run typecheck`.

---

## Prompt 28 - Interaction Focus And Disabled State Sweep

### Objective

Normalize focus, hover, selected, active, disabled, drag, and loading states across migrated units.

### Primary Files

- Shared CSS/token files.
- Components changed by prompts 08 through 27.

### Tasks

1. Audit focus ring visibility on keyboard navigation.
2. Audit selected vs focused vs hover states.
3. Audit disabled controls and loading states for readability.
4. Ensure no state relies on color alone.
5. Update QA checklist with findings.

### Acceptance Criteria

- Focus never disappears.
- Disabled text remains readable enough for context.
- Active states are consistent.

### Validation

- Keyboard smoke.
- `npm run typecheck` if files changed.

---

## Prompt 29 - Status Truthfulness Sweep

### Objective

Audit every semantic status color for truthfulness and accessibility.

### Primary Files

- Status/badge components discovered by Prompt 02.
- Map QA/publication surfaces.
- UA evidence/method validity surfaces.
- IDE diagnostics/apply surfaces.

### Tasks

1. Verify success is used only for valid/complete/ready states.
2. Verify warning, blocked, stale, unknown, demo, and error are distinct.
3. Verify each status has text or accessible naming.
4. Record violations and fix scoped cases.

### Acceptance Criteria

- Demo and unknown never appear as valid.
- Warning is not used as a generic decorative accent.

### Validation

- `npm run typecheck` if files changed.
- Targeted tests if status-rendering logic changed.

---

## Prompt 30 - Contrast Baseline And Token Math

### Objective

Record contrast results for core text, surfaces, focus rings, and status badges.

### Primary Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
- Optional helper script only if low-risk.

### Tasks

1. Check core token pairs manually or with a small helper.
2. Record pass/fail for primary, secondary, muted, disabled, inverse text.
3. Record focus ring contrast on core surfaces.
4. Record status badge text/fill/border combinations.
5. If failures remain, create prompt-specific follow-ups in the ledger.

### Acceptance Criteria

- QA checklist contains contrast evidence.
- Remaining failures are explicit.

### Validation

- Run helper if added.
- Documentation-only validation otherwise.

---

## Prompt 31 - Screenshot Baseline Harness

### Objective

Create or document repeatable screenshot checks for representative color surfaces.

### Primary Files

- `e2e/` if adding stable Playwright coverage.
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
- `docs/implementation/` if a manual checklist is preferred.

### Tasks

1. Prefer stable smoke screenshots over brittle full-page snapshots.
2. Cover shell, IDE, terminal, command palette, Map Explorer, Urban Analytics, and status surfaces.
3. Record viewport sizes and required local server command.
4. Avoid adding tests that fail because of dynamic map tiles or animations.

### Acceptance Criteria

- Future agents can reproduce screenshot review.
- Any automated tests are stable and scoped.

### Validation

- Run Playwright only if the dev server/test setup is ready.
- Otherwise record manual screenshot instructions.

---

## Prompt 32 - Hard-Coded Color Cleanup Pass One

### Objective

Remove remaining high-impact hard-coded chrome colors after the main unit migrations.

### Primary Files

- Top 20 migration targets from Prompt 02.

### Tasks

1. Re-run the hard-coded color inventory.
2. Fix only component chrome colors, not data palettes or fixtures.
3. Record retained literals with categories and reasons.
4. Avoid churn in low-risk tests or docs.

### Acceptance Criteria

- High-impact chrome literals are reduced.
- Retained colors are intentional.

### Validation

- `npm run typecheck` if TS/TSX changed.
- Changed-file lint when practical.

---

## Prompt 33 - CSS Modules Consistency Sweep

### Objective

Ensure CSS Modules use semantic tokens consistently and camelCase JSX references are preserved.

### Primary Files

- `src/**/*.module.css`
- JSX/TSX files importing touched CSS Modules.

### Tasks

1. Replace module-local hard-coded chrome colors with semantic tokens.
2. Preserve kebab-case CSS class names and existing JSX access style.
3. Do not rename classes unless necessary.
4. Keep component dimensions stable.

### Acceptance Criteria

- CSS Modules follow token naming.
- No class reference breakage.

### Validation

- `npm run typecheck` if TSX references changed.
- Changed-file lint when practical.

---

## Prompt 34 - Styled Components And Inline Style Sweep

### Objective

Tokenize styled-components and inline style color literals that remain after module sweeps.

### Primary Files

- `src/**/*.{ts,tsx}` files identified by Prompt 02.

### Tasks

1. Replace inline chrome color literals with semantic tokens.
2. Preserve inline data visualization colors unless categorized for a data palette migration.
3. Keep style object structure stable.
4. Avoid introducing broad helper abstractions.

### Acceptance Criteria

- Inline chrome literals are reduced.
- Data palette literals are intentionally retained or moved to palette helpers.

### Validation

- `npm run typecheck`.

---

## Prompt 35 - Documentation And Developer Guidance Update

### Objective

Update developer-facing docs so future code uses the new color system correctly.

### Primary Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
- `AGENTS.md` only if a short rule is needed.
- `CLAUDE.md` only if a short rule is needed.

### Tasks

1. Document token usage examples for CSS Modules, styled-components, and inline styles.
2. Document status color rules and data visualization separation.
3. Document validation commands by module.
4. Keep root agent docs short; detailed guidance belongs in this folder.

### Acceptance Criteria

- New agents can choose the right token without guessing.
- Docs do not duplicate huge prompt content unnecessarily.

### Validation

- Documentation-only validation.

---

## Prompt 36 - Full Color QA Gate

### Objective

Run the broad color QA gate and record final pass/fail evidence.

### Primary Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`

### Tasks

1. Run typecheck.
2. Run relevant changed-file lint or `npm run lint:errors` if practical.
3. Run module tests required by touched areas.
4. Run screenshot or manual visual smoke.
5. Record failures as related or pre-existing.

### Acceptance Criteria

- QA checklist has final evidence.
- Ledger has exact commands and results.

### Validation

- Broadest practical validation set.

---

## Prompt 37 - Final Color System Handoff

### Objective

Close the color-system operating pack with durable handoff instructions.

### Required Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- `COLOR_SYSTEM_PLANS/README.md`

### Tasks

1. Confirm every prompt is completed or skipped with reason.
2. Confirm final token names and compatibility aliases are documented.
3. Confirm known deferred migrations and retained literals are recorded.
4. Confirm QA evidence is recorded.
5. Mark the color operating pack complete.

### Acceptance Criteria

- No pending prompts remain unless explicitly skipped with reason.
- Future color work has a clear source of truth.
- Final response can summarize status without relying on chat memory.

### Validation

- JSON parse for manifest.
- Broadest practical validation if product files changed.
