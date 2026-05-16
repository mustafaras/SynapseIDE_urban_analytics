# Color System Sequential Implementation Prompts

## Purpose

This is the active prompt ladder for the next color-system workstream. It supersedes the old broad 38-prompt rollout for future execution. The previous token infrastructure and shared shell work remain historical baseline; the active priority is now intentionally narrower and stricter:

1. Part 1 removes amber from the complete Urban Analytics modal experience and restyles it as a compact premium VS Code-like workbench surface.
2. Part 2 removes amber from the entire Center Panel shell + every tab interior (Projects, New Project, Methods, Education entry, Report/Note, Workflows, Dashboard entry, Toolbox) excluding the Map Explorer files reserved for Part 3, and restyles every tab with the same VS Code premium discipline while preserving existing atmospheric header animations and ambient background motion.
3. Part 3 removes amber from the complete Map Explorer experience and restyles it with the same premium VS Code-like discipline.

Each prompt is written for a small agent: narrow scope, exact search targets, allowed edits, acceptance criteria, validation, and ledger requirements.

## Active Priority Order

Run parts strictly in order. Do not start Center Panel Workbench prompts until Part 1 is complete or explicitly skipped with reason. Do not start Map Explorer prompts until Part 2 is complete or explicitly skipped with reason.

| Part | Prompt IDs | Scope | Outcome |
| --- | --- | --- | --- |
| Part 1 | `A01`-`A10` | Only `src/features/urbanAnalytics/**` and directly rendered Urban Analytics modal content | Amber-free Urban Analytics modal with VS Code-like premium density, neutral workbench surfaces, thin separators, and unfilled controls |
| Part 2 | `C01`-`C10` | Center Panel shell, top tab bar, status rail, and the eight tab contents (Projects, New Project, Methods, Education entry, Report/Note, Workflows/Flows, Dashboard entry, Toolbox) excluding `src/centerpanel/components/map/**` and the `Map*` files reserved for Part 3 | Amber-free Center Panel with VS Code-like premium layout: dense inspector rows, flat panel hierarchy, hairline separators, transparent controls, restrained blue interaction across every tab |
| Part 3 | `B01`-`B10` | Map Explorer UI, map component tokens, map services that emit default colors, and related map tests | Amber-free Map Explorer with map-first workbench chrome, unfilled controls, neutral panel hierarchy, and non-amber data defaults |

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

Center Panel (Part 2 — non-Map Explorer):

```powershell
rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/centerpanel -g "*.ts" -g "*.tsx" -g "*.css" -g "!components/map/**" -g "!components/Map*.tsx"
```

Center Panel Heavy-Chrome Scan (Part 2):

```powershell
rg -n "border-radius:\\s*(?:1[0-9]|[2-9][0-9]|999|50%)|borderRadius:\\s*(?:1[0-9]|[2-9][0-9]|999)|radial-gradient|linear-gradient|box-shadow:\\s*0\\s+\\d+px|--ui-card-bg|--ui-card-border|--ui-tag-|--ui-pill-" src/centerpanel -g "*.ts" -g "*.tsx" -g "*.css" -g "!components/map/**" -g "!components/Map*.tsx"
```

Map Explorer (Part 3):

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

Close Part 1 and make it safe to start Part 2 (Center Panel Workbench).

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
5. Set the next prompt to `C01 - Center Panel Workbench Inventory And Scope Lock`.

### Acceptance Criteria

- Ledger marks Part 1 complete.
- Manifest status matches the ledger.
- No unresolved Urban Analytics amber UI debt remains.
- Part 2 (Center Panel Workbench) work is explicitly unblocked.

### Validation

- JSON parse for manifest if changed.
- Documentation-only validation otherwise.

---
![1778871737098](image/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS/1778871737098.png)

# Part 2 - Center Panel Workbench Second

The Center Panel hosts the eight tabs the user works in (Projects, New Project, Methods, Education entry, Report/Note, Workflows, Dashboard entry, Toolbox) plus the shared shell — top tab bar, status rail, urban context strip, outline nav, background tasks, engine capabilities, and overflow surfaces. Part 1 finished the Urban Analytics modal; Part 2 finishes the rest of the Center Panel before Part 3 starts on the Map Explorer. The user-flagged New Project screenshot is the canonical example of the kind of card-in-card stacking and legacy local-token chrome these prompts must remove.

## Scope Boundaries For Part 2

In scope:

- `src/centerpanel/CenterPanelShell.tsx`, `src/centerpanel/SessionPersistence.tsx`, `src/centerpanel/UrbanContextStrip.tsx`, `src/centerpanel/OutlineNav.tsx`, `src/centerpanel/sections.ts`.
- `src/centerpanel/components/*` excluding any file under `src/centerpanel/components/map/**` and the `Map*.tsx` map-explorer files reserved for Part 3.
- `src/centerpanel/registry-ui/**` (Projects tab + New Project tab).
- `src/centerpanel/Guide/**` and `src/centerpanel/nav/**` (Methods tab).
- `src/centerpanel/tabs/**` (Report/Note tab).
- `src/centerpanel/Flows/**` (Workflows tab).
- `src/centerpanel/Tools/**` (Toolbox tab).
- `src/centerpanel/rail/**`.
- `src/centerpanel/styles/*.css` and `src/centerpanel/styles/*.module.css`.
- `src/centerpanel/registry/**` only when state-shape changes affect default colors or status semantics that bleed into UI.
- Tests inside `src/centerpanel/**/__tests__/**` only when assertions need token/name updates.

Out of scope (covered elsewhere):

- `src/centerpanel/components/map/**` and any `src/centerpanel/components/Map*.tsx` map-explorer file → Part 3 (`B01`-`B10`).
- `src/features/urbanAnalytics/**` → Part 1 (already completed).
- `src/features/education/**` Education module internals → only the Center Panel entry frame is in scope; the Education feature itself stays as documented external work.
- `src/features/dashboard/**` Dashboard builder internals → only the Center Panel entry frame is in scope; the Dashboard feature stays as documented external work.

## Center Panel Visual Contract Additions (Part 2 Only)

The Global Visual Contract at the top of this file applies in full. In addition, for the Center Panel specifically:

- Replace legacy local tokens (`--ui-card-bg`, `--ui-card-border`, `--ui-pill-*`, `--ui-tag-*`, and similar found in `registry-ui/newProject.module.css` and adjacent files) with the workbench `--syn-surface-*`, `--syn-border-*`, and `--syn-text-*` families.
- **Preserve existing atmospheric header animations and ambient background motion** (subtle particle/glow drifts, slow gradient shifts, the live "session timer + connected" pulse, animated TASKS counter, etc.). Migrate only the color stops/values inside those animations from amber/gold/yellow tones to the workbench charcoal + restrained blue palette. Do not remove the animations themselves, do not flatten the header into a static bar, do not strip the "premium ambient feel" — only de-amber the colors used inside the animations.
- Tab CONTENTS were not migrated in the historical baseline. Part 2 finishes the tab interiors, not the top tab bar's existing motion language unless an active prompt explicitly says so.
- `MAIN_SCROLL_ROOT_ID`, lazy-load shells, `ChunkLoadBoundary`, and `Suspense` fallbacks must keep working. No behavior changes to lazy import wiring, panel bridge syncs, or tab-switch state.
- Tabs render under `CenterPanelShell` and may re-mount on tab switch; keep first-paint cheap (no large gradients or shadow stacks added; existing ones must be migrated, not amplified).
- Card-in-card stacking is the primary anti-pattern to remove. A single tab surface should read as one workbench inspector with group headers + hairline separators, not three nested filled cards inside one panel.

---

## Prompt C01 - Center Panel Workbench Inventory And Scope Lock

### Objective

Build the exact amber-removal and card-removal inventory for the entire Center Panel surface (excluding the Map Explorer scope reserved for Part 3) before changing code.

### Scope

- All Part 2 in-scope paths listed above.

### Required Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
- `src/centerpanel/CenterPanelShell.tsx`
- `src/centerpanel/components/TopHeader.tsx`
- `src/centerpanel/components/CenterPanelTabFrame.tsx`
- `src/centerpanel/components/StatusRail.tsx`
- `src/centerpanel/components/BackgroundTasksControl.tsx`
- `src/centerpanel/components/OverflowMenu.tsx`
- `src/centerpanel/components/EngineCapabilitiesPanel.tsx`
- `src/centerpanel/components/NarrativeGenerationPanel.tsx`
- `src/centerpanel/components/ObjectDetectorPanel.tsx`
- `src/centerpanel/UrbanContextStrip.tsx`
- `src/centerpanel/registry-ui/Registry.tsx`
- `src/centerpanel/registry-ui/NewProjectPage.tsx`
- `src/centerpanel/registry-ui/newProject.module.css`
- `src/centerpanel/registry-ui/ProjectSummaryCard.tsx`
- `src/centerpanel/registry-ui/SessionCard.tsx`
- `src/centerpanel/registry-ui/IndicatorsCard.tsx`
- `src/centerpanel/registry-ui/ConsultantAI.tsx`
- `src/centerpanel/Guide/MethodsView.tsx`
- `src/centerpanel/Guide/GuideViewV2.tsx`
- `src/centerpanel/Guide/OutlineRailV2.tsx`
- `src/centerpanel/tabs/Note.tsx`
- `src/centerpanel/tabs/NoteEditor.tsx`
- `src/centerpanel/tabs/NoteSections.tsx`
- `src/centerpanel/tabs/ProjectHeader.tsx`
- `src/centerpanel/Flows/FlowHost.tsx`
- `src/centerpanel/Flows/FlowsRail.tsx`
- `src/centerpanel/Flows/FlowTile.tsx`
- `src/centerpanel/Flows/StepPills.tsx`
- `src/centerpanel/Flows/WorkflowCockpit.tsx`
- `src/centerpanel/Tools/ToolsProjectList.tsx`
- `src/centerpanel/Tools/ToolsActionPanel.tsx`
- `src/centerpanel/Tools/ConsultonPanel.tsx`
- `src/centerpanel/Tools/components/CapabilitiesOverviewPanel.tsx`
- `src/centerpanel/styles/centerpanel.module.css`
- `src/centerpanel/styles/header-new.module.css`
- `src/centerpanel/styles/header-tokens.css`
- `src/centerpanel/styles/radical-tabs.module.css`
- `src/centerpanel/styles/registry.module.css`
- `src/centerpanel/styles/guides.module.css`
- `src/centerpanel/styles/guides.panel.module.css`
- `src/centerpanel/styles/guides.rail.module.css`
- `src/centerpanel/styles/navtree.module.css`
- `src/centerpanel/styles/note.module.css`
- `src/centerpanel/styles/project-header.module.css`
- `src/centerpanel/styles/flows.module.css`
- `src/centerpanel/styles/tools.module.css`
- `src/centerpanel/styles/tools.left.module.css`
- `src/centerpanel/styles/tokens.css`
- `src/centerpanel/styles/a11y.module.css`
- `src/centerpanel/rail/DraftSnapshotCard.tsx`
- `src/centerpanel/rail/WorkspaceInfoCard.tsx`
- `src/centerpanel/rail/rail.module.css`

### Tasks

1. Run the Center Panel Standard Amber Scan and the Center Panel Heavy-Chrome Scan.
2. Group each amber hit as `shell-chrome`, `tab-bar`, `status-rail`, `card-frame`, `button-control`, `form-control`, `status-semantic`, `header-animation`, `data-content`, `legacy-token-alias`, `test-fixture`, or `retain-with-reason`.
3. Group each heavy-chrome hit as `nested-card`, `decorative-gradient`, `oversized-radius`, `decorative-shadow`, `filled-button-plate`, `legacy-local-token` (e.g. `--ui-card-bg`, `--ui-card-border`, `--ui-pill-*`, `--ui-tag-*`), or `ambient-motion-keep` (animations that must be preserved with only their color stops migrated).
4. Inventory all legacy `--ui-*` token islands — files that use these non-`--syn-*` aliases — and list them so C02-C09 can re-point them to workbench tokens.
5. Inventory all card-in-card stacking on each tab; the New Project tab in particular has three nested cards inside one panel, which the user flagged as the canonical example.
6. Inventory atmospheric/ambient header animations and the live status indicators (session timer, LIVE pulse, CONNECTED chip, TASKS counter): list every animated element + its color stops so C02 can migrate stops without removing motion.
7. Record a tab-by-tab migration order in the ledger (Shell → Projects → New Project → Methods → Report/Note → Workflows → Toolbox → cross-cutting → final QA).
8. Do not change product code in this prompt unless the user explicitly asks for a batch.

### Acceptance Criteria

- Ledger contains a tab-scoped Center Panel amber + heavy-chrome inventory.
- Every amber hit and every heavy-chrome hit has an owner category and a planned C-prompt.
- Header animations to preserve are explicitly enumerated with their current color stops and target stops.
- The next prompt is `C02`.
- No product code changed.

### Validation

- Documentation-only validation.
- Record both scan commands and full hit summaries in the ledger.

---

## Prompt C02 - Center Panel Shell, Top Header, Tab Frame, Status Rail, Tokens, And Header Animations

### Objective

Migrate the Center Panel shared shell, shared tokens, and the top header chrome so every tab inherits the workbench palette and density automatically. Preserve all existing atmospheric header animations and ambient background motion — only their color stops migrate from amber/gold to the workbench palette.

### Primary Files

- `src/centerpanel/CenterPanelShell.tsx`
- `src/centerpanel/components/TopHeader.tsx`
- `src/centerpanel/components/CenterPanelTabFrame.tsx`
- `src/centerpanel/components/StatusRail.tsx`
- `src/centerpanel/components/BackgroundTasksControl.tsx`
- `src/centerpanel/components/OverflowMenu.tsx`
- `src/centerpanel/styles/tokens.css`
- `src/centerpanel/styles/centerpanel.module.css`
- `src/centerpanel/styles/header-tokens.css`
- `src/centerpanel/styles/header-new.module.css`
- `src/centerpanel/styles/radical-tabs.module.css`
- `src/centerpanel/styles/a11y.module.css`

### Tasks

1. Replace legacy local tokens (`--ui-card-bg`, `--ui-card-border`, `--ui-pill-*`, `--ui-tag-*`, etc.) declared in `tokens.css` / `header-tokens.css` with re-points to the workbench `--syn-surface-*`, `--syn-border-*`, `--syn-text-*`, `--syn-interaction-*`, and `--syn-status-*` families.
2. **Preserve every header animation enumerated in the C01 inventory.** Migrate only the color stops inside `@keyframes`, gradient stops, glow rgba alphas, and animated SVG fills from amber/gold/yellow tones to charcoal + restrained blue (`#3794ff`, `#a4adbb`, `color-mix(... var(--syn-interaction-active) X%, transparent)`). Do not delete the keyframes, do not shorten durations, do not remove `animation:` declarations, do not flatten the header into a static bar.
3. The live status indicators on the right side of the top header (session timer, `LIVE` pulse, `CONNECTED` chip, `TASKS X QUEUED` counter) must keep their existing motion (pulse, fade, tick) but their tint must use `--syn-status-valid` / `--syn-status-info` / `--syn-text-muted` rather than amber.
4. Migrate the deferred-panel `Suspense` fallback inline style in `CenterPanelShell.tsx` from raw `border-radius: 12` + `--syn-surface-elevated` literal styling to a hairline-bordered compact loading row (radius ≤ 4px, transparent background, blue progress accent).
5. Top tab bar (`radical-tabs.module.css`) active/hover states: blue underline + restrained surface tint; never amber; never a filled card pill. Keep tab-switch transitions if they already exist; remigrate amber transition colors only.
6. Overflow menu, status rail, and background tasks control: transparent default, neutral hover (`--syn-interaction-hover`), explicit text labels for every state. Animated task spinners keep their motion but migrate any amber stroke to `--syn-interaction-active`.
7. Tab-frame `Suspense` fallback should not introduce a card frame larger than the eventual content; keep first-paint visually quiet.
8. Preserve `MAIN_SCROLL_ROOT_ID`, tab switch behavior, lazy-load wiring, `ChunkLoadBoundary`, focus restoration, keyboard navigation, and `usePanelBridgeStore` syncs.

### Acceptance Criteria

- Center Panel shell, top header (with motion intact), tab bar, status rail, and overflow controls are amber-free.
- Every animated element listed in the C01 inventory still animates with the same timing and shape; only its color values migrated.
- Legacy `--ui-*` token aliases either resolve to `--syn-*` workbench values or are deleted.
- Tab switch latency is unchanged or improved.
- No tab content visual changes from this prompt yet — those are C03-C08.

### Validation

- `npm run typecheck`
- `npm run test:analytics` (smoke; not in scope but must still pass)
- Targeted vitest for `src/centerpanel/components/__tests__/*` if styling assertions exist.
- Manual visual verification that header animations still play after the migration (record the keyframes touched in the ledger as evidence).
- Re-run the Center Panel Standard Amber Scan and Heavy-Chrome Scan.

---

## Prompt C03 - Projects Tab — Registry Layout, Cards, Session, Indicator, And AI Surfaces

### Objective

Convert the Projects tab from boxed-card stacks to a dense workbench inspector layout with VS Code-like row hierarchy.

### Primary Files

- `src/centerpanel/registry-ui/Registry.tsx`
- `src/centerpanel/registry-ui/ProjectSummaryCard.tsx`
- `src/centerpanel/registry-ui/SessionCard.tsx`
- `src/centerpanel/registry-ui/IndicatorsCard.tsx`
- `src/centerpanel/registry-ui/ConsultantAI.tsx`
- `src/centerpanel/registry-ui/consultantAI.module.css`
- `src/centerpanel/styles/registry.module.css`
- `src/centerpanel/rail/DraftSnapshotCard.tsx`
- `src/centerpanel/rail/WorkspaceInfoCard.tsx`
- `src/centerpanel/rail/rail.module.css`

### Tasks

1. Convert the project card grid from filled-card-with-border tiles to dense list rows or thin-bordered tiles with `--syn-border-subtle` and no nested card frames.
2. Replace amber/gold/yellow status accents on indicator chips, session badges, and AI hint cards with `--syn-status-info` / `--syn-status-valid` / `--syn-status-error` per meaning. Demo/unknown/stale states must remain explicit text.
3. Flatten right-rail draft snapshot and workspace info from card surfaces to grouped sections separated by `--syn-border-subtle` hairlines.
4. Replace filled "Open" / "Resume" / "Archive" button plates with transparent ghost buttons; primary affordance uses blue underline or icon+text.
5. Keep project registry behavior, session persistence, indicator binding, and ConsultantAI message wiring unchanged.
6. Update tests only where token names are asserted.

### Acceptance Criteria

- Projects tab reads as a workbench inspector grid: dense rows, hairline separators, transparent controls.
- No nested cards, no amber chrome, no filled action button plates.
- Selected/active project row uses blue left rail or text/icon color, not an amber filled card.
- Empty states use muted text plus icon, not a hero card.

### Validation

- `npm run typecheck`
- Targeted vitest for `registry-ui/**/__tests__/*` if present.
- Re-run the Center Panel Standard Amber Scan.

---

## Prompt C04 - New Project Tab — Form Layout, Field Stacks, Tag Pills, Submit Bar

### Objective

Rebuild the New Project intake page as a single-surface dense intake form rather than three nested cards stacked inside one panel. This is the canonical fix for the user-flagged screenshot.

### Primary Files

- `src/centerpanel/registry-ui/NewProjectPage.tsx`
- `src/centerpanel/registry-ui/newProject.module.css`
- `src/centerpanel/styles/registry.module.css` (only if shared form tokens move there)
- `src/stores/useNewProjectDraftStore.ts` (read-only; do not change behavior)

### Tasks

1. Remove the three nested `.card` wrappers (Project Identity, Spatial Configuration, Thematic Tags) and replace them with one `intakePage` surface broken by group headers, `--syn-border-subtle` hairlines, and dense field rows.
2. Migrate `--ui-card-bg` / `--ui-card-border` literal fallbacks to `--syn-surface-panel` / `--syn-border-subtle`. Remove the `rgba(0,0,0,0.18)` and `rgba(255,255,255,0.08)` literal fallbacks.
3. Field labels: `--syn-text-muted` uppercase 11px with 0.04em letter-spacing, matching the rest of the workbench.
4. Inputs and selects: `--syn-surface-input` background, `--syn-border-subtle` border, `--syn-border-focus` on focus, 3px radius. Replace any larger radii (8-12px) with 3-4px.
5. Tag pills: remove filled rounded plates; compact pill with transparent background, `--syn-border-subtle` border, `--syn-text-secondary` text; selected uses `color-mix(in srgb, var(--syn-interaction-active) 12%, transparent)` background and `--syn-interaction-active` text + 1px border.
6. Submit bar: "Reset" stays as a transparent ghost button; "Create Project" uses blue text + 1px blue border on transparent (no amber, no filled plate). Disabled state preserves explicit aria-disabled.
7. Left intro card ("New Project" hero + bullet list): flatten into a quiet section with muted text; no card frame.
8. BBox numeric inputs: align in a 2×2 grid (or 4-up at wide widths) with consistent label widths and tabular numerics; no per-field card wrapper.
9. Preserve `useNewProjectDraftStore` reads/writes, validation, `handleCreate`, `reset`, and tag toggle behavior verbatim.

### Acceptance Criteria

- New Project tab reads as one coherent intake form, not three stacked cards.
- All inputs, selects, tag pills, and submit controls match the workbench tokens.
- No `rgba(0,0,0,0.18)` or `rgba(255,255,255,0.08)` literal surfaces remain.
- Form values still bind to the draft store; "Create Project" still creates the project; "Reset" still clears the draft.
- Layout fits at 720-1200px modal width without overlap or text overflow.

### Validation

- `npm run typecheck`
- Targeted vitest for any `useNewProjectDraftStore` test.
- Manual visual verification of the New Project tab at 720, 960, and 1200px widths if a dev server is available.
- Re-run the Center Panel Standard Amber Scan.

---

## Prompt C05 - Methods/Guide Tab — Methods View, Outline Rail, Guide Cards, And Command Bar

### Objective

Migrate the Methods/Guide tab to dense workbench inspector layout with VS Code-like outline rail and quiet guide content.

### Primary Files

- `src/centerpanel/Guide/MethodsView.tsx`
- `src/centerpanel/Guide/GuideViewV2.tsx`
- `src/centerpanel/Guide/GuideView.tsx`
- `src/centerpanel/Guide/OutlineRailV2.tsx`
- `src/centerpanel/Guide/OutlineRail.tsx`
- `src/centerpanel/Guide/GuideCard.tsx`
- `src/centerpanel/Guide/GuideCommandBar.tsx`
- `src/centerpanel/Guide/GuideMacros.tsx`
- `src/centerpanel/nav/GuideTree.tsx`
- `src/centerpanel/styles/guides.module.css`
- `src/centerpanel/styles/guides.panel.module.css`
- `src/centerpanel/styles/guides.rail.module.css`
- `src/centerpanel/styles/navtree.module.css`

### Tasks

1. Migrate outline rail (`OutlineRailV2.tsx`, `navtree.module.css`) to dense rows with thin selected-row tint and no card-style outline; active item uses blue left rail (2px) + blue text.
2. Replace amber expand/collapse caret accents and amber group-active tint with neutral muted icons and `color-mix(... var(--syn-interaction-active) 12%)` row background.
3. Convert guide cards (`GuideCard.tsx`) from rounded filled cards to flat panels separated by `--syn-border-subtle` rules; keep section headers uppercase muted.
4. Command bar (`GuideCommandBar.tsx`): compact input + transparent inline action buttons; no amber active state, no filled primary plate.
5. Guide macros (`GuideMacros.tsx`): replace any amber/gold "tip"/"note" badges with `--syn-status-info` blue badges plus explicit text.
6. Preserve guide selection state, outline scroll-spy, command palette routing, and macro injection behavior.

### Acceptance Criteria

- Methods/Guide tab is amber-free and uses workbench tokens.
- Outline rail reads as a VS Code file tree, not card stacks.
- Guide content uses flat sections with hairline separators; no nested cards.
- Command bar matches the workbench input and action discipline.

### Validation

- `npm run typecheck`
- Targeted vitest for any Guide tests.
- Re-run the Center Panel Standard Amber Scan.

---

## Prompt C06 - Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert

### Objective

Migrate the Report/Note tab (rich notebook editor) to workbench discipline without breaking the slot/format/library bridges.

### Primary Files

- `src/centerpanel/tabs/Note.tsx`
- `src/centerpanel/tabs/NoteEditor.tsx`
- `src/centerpanel/tabs/NoteSections.tsx`
- `src/centerpanel/tabs/NoteFooterBar.tsx`
- `src/centerpanel/tabs/ProjectHeader.tsx`
- `src/centerpanel/tabs/RecentChanges.tsx`
- `src/centerpanel/tabs/SlotEditorContentBridge.tsx`
- `src/centerpanel/tabs/SlotEditorFormatBar.tsx`
- `src/centerpanel/tabs/LibraryInsertCard.tsx`
- `src/centerpanel/styles/note.module.css`
- `src/centerpanel/styles/project-header.module.css`

### Tasks

1. Project header (`ProjectHeader.tsx`, `project-header.module.css`): flatten any amber/gold accent and large radii into a quiet workbench header strip with muted metadata row. If the header itself has ambient motion (similar to the top tab bar), preserve it and migrate stops only.
2. Note editor (`NoteEditor.tsx`, `note.module.css`): editor surface uses `--syn-surface-editor` / `--syn-surface-input`; format bar uses transparent icon buttons with blue active state; no filled "save"/"insert" amber plates.
3. Note sections (`NoteSections.tsx`): section headers uppercase muted, hairline separators, no nested card frames per section.
4. Library insert card (`LibraryInsertCard.tsx`): replace any amber emphasis with `--syn-status-info` or `--syn-text-link`; flatten card chrome.
5. Footer bar (`NoteFooterBar.tsx`): match `MapStatusBar` / `UrbanContextStrip` discipline — compact, hairline top border, muted text, no amber.
6. Recent changes (`RecentChanges.tsx`): dense rows with relative timestamps; no card per change.
7. Preserve Note persistence, slot editor bridge contracts, format bar actions, and library insert dispatch.

### Acceptance Criteria

- Report/Note tab is amber-free and uses workbench tokens.
- Editor surface, format bar, and section headers match VS Code-like density.
- Library insert and recent changes do not appear as nested cards.
- Persistence and slot/format bridges unchanged.

### Validation

- `npm run typecheck`
- Targeted vitest for `src/centerpanel/tabs/__tests__/Note.test.tsx`.
- Re-run the Center Panel Standard Amber Scan.

---

## Prompt C07 - Workflows Tab — Flow Host, Flows Rail, Tiles, Step Pills, Cockpit, And Per-Flow Surfaces

### Objective

Migrate the Workflows tab and the per-flow shells to dense workbench inspector layout while preserving every flow's data contract.

### Primary Files

- `src/centerpanel/Flows/FlowHost.tsx`
- `src/centerpanel/Flows/FlowsRail.tsx`
- `src/centerpanel/Flows/FlowLibraryCard.tsx`
- `src/centerpanel/Flows/FlowTile.tsx`
- `src/centerpanel/Flows/StepPills.tsx`
- `src/centerpanel/Flows/WorkflowCockpit.tsx`
- `src/centerpanel/Flows/ReadOnlyRunView.tsx`
- `src/centerpanel/Flows/AnalyticalRunReviewFlow.tsx`
- `src/centerpanel/Flows/rail/CompletedRunsCard.tsx`
- `src/centerpanel/Flows/rail/CrossPanelActions.tsx`
- `src/centerpanel/Flows/rail/RelatedMethodsCard.tsx`
- `src/centerpanel/Flows/rail/SuggestedCard.tsx`
- `src/centerpanel/Flows/shells/CompletedRunReviewShell.tsx`
- `src/centerpanel/styles/flows.module.css`
- Per-flow files only when they render amber/gold UI chrome (e.g. `AccessibilityFlow.tsx`, `CompositeIndicatorFlow.tsx`, `FacilityOptimisationFlow.tsx`, `SystemDynamicsFlow.tsx`, `VulnerabilityFlow.tsx`, `SiteSuitabilityFlow.tsx`, etc.).

### Tasks

1. Flow library tiles (`FlowLibraryCard.tsx`, `FlowTile.tsx`): convert from filled tiles with amber/gold accents to compact tiles with hairline border and blue selected state.
2. Step pills (`StepPills.tsx`): replace amber active step with blue underline + blue text; completed step is `--syn-status-valid`; pending is muted.
3. Workflow cockpit (`WorkflowCockpit.tsx`): control bar transparent icon buttons; no filled "Run"/"Stop"/"Save" amber plates; running state uses `--syn-status-info` plus explicit text. Preserve any running-state spinner motion; migrate its stroke color only.
4. Flows rail right-side cards (`CompletedRunsCard`, `RelatedMethodsCard`, `SuggestedCard`, `CrossPanelActions`): flatten to dense sections with hairlines; no card-in-card.
5. Read-only run view + completed-run review shell: workbench inspector layout; status badges semantic non-amber.
6. Per-flow files: scan and remove amber UI chrome only; preserve every flow's analytical data contracts, validity envelopes, and status semantics. Demo/unknown/blocked states remain explicit.
7. Preserve `useFlowStore`, `useFlowsUIStore`, flow registration, run dispatch, and map dispatch behavior.

### Acceptance Criteria

- Workflows tab is amber-free and uses workbench tokens.
- Flow tiles, step pills, cockpit controls, and rail cards match VS Code-like density.
- Per-flow chrome is non-amber; analytical palettes stay separate and documented.
- Run state semantics (running/completed/blocked/error) remain truthful and text-backed.

### Validation

- `npm run typecheck`
- Targeted vitest for `src/centerpanel/Flows/__tests__/*` (e.g. `AccessibilityFlow.map-dispatch.test.tsx`, `CellularAutomataFlow.test.tsx`).
- Re-run the Center Panel Standard Amber Scan.

---

## Prompt C08 - Toolbox Tab — Project List, Action Panel, Capability/Lab/Consulton Panels, Export Bar

### Objective

Migrate the Toolbox tab and its action/capability surfaces to dense workbench discipline without changing tool execution or recipe contracts.

### Primary Files

- `src/centerpanel/Tools/ToolsProjectList.tsx`
- `src/centerpanel/Tools/ToolsActionPanel.tsx`
- `src/centerpanel/Tools/ConsultonPanel.tsx`
- `src/centerpanel/Tools/ConsultonDiff.tsx`
- `src/centerpanel/Tools/ConsultonSessions.ts`
- `src/centerpanel/Tools/ExportBar.tsx`
- `src/centerpanel/Tools/PreviewPanel.tsx`
- `src/centerpanel/Tools/components/CapabilitiesOverviewPanel.tsx`
- `src/centerpanel/Tools/components/CoverageDiagnosticsPanel.tsx`
- `src/centerpanel/Tools/components/EOConnectorPanel.tsx`
- `src/centerpanel/Tools/components/GeoAILab.tsx`
- `src/centerpanel/Tools/components/SpatialIndexLab.tsx`
- `src/centerpanel/Tools/components/StreamingLab.tsx`
- `src/centerpanel/styles/tools.module.css`
- `src/centerpanel/styles/tools.left.module.css`

### Tasks

1. Tools project list and action panel: dense rows with hairline separators; no card-per-tool stack; selected tool uses blue left rail.
2. Capability overview, coverage diagnostics, EO connector, GeoAI lab, spatial index lab, streaming lab: convert each panel to a workbench inspector section. Capability badges use semantic non-amber tokens; demo/unsupported/blocked states remain explicit.
3. Consulton panel + diff: chat/transcript surface with quiet message rows; user/assistant distinguished by left rail color, not amber bubbles.
4. Export bar: transparent action buttons grouped by hairline divider; no filled amber primary plate.
5. Preview panel: flat preview surface with hairline border; no decorative gradient or oversized radius (unless that gradient is part of an inventoried preserved animation).
6. Preserve every tool's recipe, capability check, EO/streaming/spatial-index dispatch, `ConsultonSessions` persistence, and export behavior.

### Acceptance Criteria

- Toolbox tab is amber-free and uses workbench tokens.
- Capability/lab/consulton/export surfaces match VS Code-like density.
- No nested cards or amber chrome remain.
- Tool contracts unchanged.

### Validation

- `npm run typecheck`
- Targeted vitest for `src/centerpanel/Tools/__tests__/*` and `src/centerpanel/Tools/components/__tests__/*`.
- Re-run the Center Panel Standard Amber Scan.

---

## Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector

### Objective

Migrate the cross-tab Center Panel surfaces that float above or alongside the active tab content.

### Primary Files

- `src/centerpanel/UrbanContextStrip.tsx`
- `src/centerpanel/urban-context-strip.module.css`
- `src/centerpanel/OutlineNav.tsx`
- `src/centerpanel/components/BackgroundTasksControl.tsx`
- `src/centerpanel/components/EngineCapabilitiesPanel.tsx`
- `src/centerpanel/components/NarrativeGenerationPanel.tsx`
- `src/centerpanel/components/ObjectDetectorPanel.tsx`
- `src/centerpanel/components/StatusRail.tsx` if not finalized in C02

### Tasks

1. Urban context strip: dense single-row surface, hairline borders, muted metadata, blue active context chip. Remove any amber pill or gold accent. Preserve any context-change pulse animation; migrate its color stops only.
2. Outline nav: align with the Methods outline rail discipline; no amber tree highlights.
3. Background tasks control: compact inline status surface with semantic non-amber states (running=blue, completed=green, blocked/error=red, queued=muted). Filled amber spinner background must be transparent with blue progress accent. Preserve spinner motion.
4. Engine capabilities panel: dense capability rows; supported/demo/missing states explicit and non-amber.
5. Narrative generation panel: quiet workbench surface; primary action transparent + blue text.
6. Object detector panel: same discipline; active detection state non-amber + explicit text.
7. Preserve cross-panel context syncs, task progress dispatch, capability checks, narrative generation, and object detector lifecycle.

### Acceptance Criteria

- All cross-cutting surfaces are amber-free and use workbench tokens.
- Status semantics are explicit and text-backed.
- No nested cards remain in cross-cutting surfaces.
- All preserved animations from the C01 inventory still play.

### Validation

- `npm run typecheck`
- Targeted vitest for any `__tests__` covering these panels (e.g. `ObjectDetectorPanel.test.tsx`).
- Re-run the Center Panel Standard Amber Scan.

---

## Prompt C10 - Center Panel Final Cleanup, Visual QA, And Part 3 Gate

### Objective

Final Center Panel sweep — close Part 2 and unblock Part 3 (Map Explorer).

### Scope

- All Part 2 in-scope paths.
- Tests only where assertions need token/name updates.

### Tasks

1. Re-run the Center Panel Standard Amber Scan and Heavy-Chrome Scan; eliminate every UI hit.
2. Confirm no card-in-card stacks survive on any tab; confirm no decorative gradients/shadows/oversized radii survive beyond the inventoried preserved-animation set.
3. Confirm every inventoried preserved header animation still plays (manual or recorded test) with migrated color stops.
4. Check tab-switch behavior and lazy-fallback latency at 720, 960, 1200, and 1440px widths.
5. Confirm focus-visible states exist for top tab bar, status rail, all tab content's inputs, buttons, sliders, filters, and copy/export controls.
6. Confirm no demo/unknown/stale/blocked/deferred state looks valid across any tab.
7. Update `COLOR_SYSTEM_PROMPT_MANIFEST.json` C-prompt statuses to `completed` (or `skipped_with_reason` with rationale).
8. Update `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md` with the Part 2 close summary and the Part 3 unblock note.
9. Set the next prompt to `B01 - Map Explorer Amber Inventory And Token Boundary`.

### Acceptance Criteria

- Center Panel is amber-free and uses VS Code-like premium layout across every tab.
- Manifest and ledger agree.
- Map Explorer (Part 3) is explicitly unblocked.
- No unresolved Center Panel amber UI debt remains.
- Ledger includes screenshot/manual QA notes covering at minimum Projects, New Project, Methods, Report, Workflows, and Toolbox tabs.

### Validation

- `npm run typecheck`
- `npm run test:analytics`
- Targeted Center Panel vitest files touched by Part 2.
- Manual or Playwright screenshot smoke for at least the Projects, New Project, Methods, Report, Workflows, and Toolbox tabs at 960px and 1280px widths.
- Re-run the Center Panel Standard Amber Scan and Heavy-Chrome Scan.
- JSON parse for the manifest after status updates.

---

# Part 3 - Map Explorer Third

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

Close the three-part color-system workstream.

### Required Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md` if final token notes changed

### Tasks

1. Confirm prompts `A01`-`A10`, `C01`-`C10`, and `B01`-`B09` are completed or skipped with reason.
2. Record remaining amber hits by exact file and category. UI/default amber debt should be zero.
3. Record validation history: typecheck, analytics tests, targeted map tests, scans, color guard, and visual QA.
4. Confirm all retained color literals are either token-source, test-fixture, or documented data-palette/content exceptions.
5. Confirm no GIS calculations, evidence semantics, method validity, workflow readiness, map persistence, or cross-module contracts changed.
6. Update manifest statuses to match the ledger and mark the workstream complete.

### Acceptance Criteria

- Ledger and manifest agree.
- Urban Analytics modal is amber-free and premium VS Code-like.
- Center Panel (all tabs + shell + header animations) is amber-free and premium VS Code-like, with preserved ambient motion intact.
- Map Explorer is amber-free and premium VS Code-like.
- No unnecessary card frames or button fills remain in the active scope.
- Final handoff lists no unresolved blocker.

### Validation

- JSON parse for manifest.
- Broadest practical validation if product files changed:
  - `npm run typecheck`
  - `npm run test:analytics`
  - targeted Center Panel tests changed by Part 2
  - targeted map tests changed by Part 3
  - screenshot/manual QA evidence
