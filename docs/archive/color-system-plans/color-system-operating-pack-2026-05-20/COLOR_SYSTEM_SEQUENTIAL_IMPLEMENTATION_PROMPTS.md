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
| Part 3 | `B01`-`B15` | Map Explorer UI, map component tokens, map services that emit default colors, generated/export content, map-store defaults, and related map tests | Amber-free Map Explorer with map-first workbench chrome aligned to the completed Center Panel design: single-surface inspectors, hairline separators, compact ghost controls, restrained blue interaction, and non-amber data defaults |

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

- `src/centerpanel/components/map/**` and any `src/centerpanel/components/Map*.tsx` map-explorer file → Part 3 (`B01`-`B15`).
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

Part 3 must now inherit the completed Center Panel workbench language from code, not from abstract intent. The Center Panel migration established these concrete implementation patterns:

- Single-surface groups: `newProject.module.css` uses `.intakePage`, `.group`, `.groupHeader`, `.groupTitle`, and `--syn-border-subtle` separators instead of nested cards.
- Compact controls: inputs/selects/buttons use `--syn-surface-input`, `--syn-border-subtle`, `--syn-border-focus`, 3px radius, 11-12px type, transparent defaults, and blue text/border for primary actions.
- Dense rows: `registry.module.css` uses table/list rows with `border-bottom: 1px solid var(--syn-border-subtle)`, selected rows with a 2px blue left rail or inset rail, and no filled card highlight.
- Outline/inspector rhythm: Guide, Note, Flow, and Tool surfaces use uppercase muted group labels, hairline section breaks, transparent panels, ghost buttons, and `color-mix(... var(--syn-interaction-active) 8-18%, transparent)` for active tint.
- Preserved motion rule: ambient header motion is preserved only when already present and useful. Map Explorer should not add new decorative animation; existing map/canvas/spinner motion may stay if color stops migrate.
- Status truthfulness: warning/caveat/demo/unknown/stale/blocked states must keep explicit text, aria labels, icons, disabled reasons, or tooltips. In the Map Explorer active scope, do not render caveat/warning with amber or `--syn-status-warning` if it resolves amber.

Map Explorer currently differs from that Center Panel code. `mapTokens.ts` still declares a `Charcoal-Amber Palette`, `DESIGN_TOKENS.mapExplorer.colors` still owns amber aliases, `MAP_STROKES` are amber hairlines, `MapWorkspaceShell.tsx` focus fallback is amber, `MapDataImportHubDialog.tsx` has amber hero gradients and filled primary buttons, `useMapExplorerStore.ts` defaults annotations to `#F59E0B`, and map services/tests encode amber generated defaults. The B prompts below are therefore intentionally narrower and more numerous than the old B01-B10 ladder.

## Part 3 Scope Boundaries

In scope:

- `src/centerpanel/components/MapExplorerModal.tsx`.
- `src/centerpanel/components/map/**`.
- `src/centerpanel/components/Map*.tsx` files that render Map Explorer surfaces, dialogs, tools, generated previews, layer renderers, or export UI.
- `src/services/map/**` files that emit default colors, generated map content, legends, export graphics, query result styles, or persistence defaults.
- `src/stores/useMapExplorerStore.ts` only for visible default map/annotation colors and persisted style defaults.
- `src/constants/design.ts` only for map-specific token aliases required by `mapTokens.ts`; do not globally redesign `DESIGN_TOKENS`.
- Related tests in `src/centerpanel/components/map/__tests__/**`, `src/centerpanel/components/__tests__/**`, `src/services/map/__tests__/**`, and `src/stores/**/__tests__/**` when assertions encode amber or renamed map token contracts.

Out of scope:

- Center Panel non-map tabs already covered by C prompts.
- Urban Analytics source except documented map handoff defaults already closed in Part 1.
- GIS calculations, CRS handling, geometry parsing, layer persistence logic, map-store behavior, evidence semantics, QA readiness logic, workflow dispatch contracts, NL-query safety logic, and report handoff semantics.
- Global theme/token rewrites outside a map-specific compatibility alias.

## Map Explorer Workbench Contract From Center Panel Code

- Root/shell surfaces: `--syn-surface-workbench`, `--syn-surface-panel`, `--syn-surface-editor`, `--syn-surface-overlay`; no charcoal-only literal islands unless needed for map canvas overlay legibility.
- Borders: `--syn-border-subtle` for hairlines, `--syn-border-default` for stronger separators, `--syn-border-focus` for focus. Radius target is 0-4px for rows, fields, chips, buttons, popovers, and drawers; only genuine floating map tools may use up to 6px when readability over the basemap requires it.
- Text: `--syn-text-default`, `--syn-text-secondary`, `--syn-text-muted`, `--syn-text-link`; uppercase group labels use 10-11px, 0.04-0.08em letter spacing.
- Interaction: default controls transparent; hover uses `--syn-interaction-hover`; active/selected uses blue icon/text, 1-2px rail, underline, or `color-mix(in srgb, var(--syn-interaction-active) 8-14%, transparent)`. Avoid filled rounded plates.
- Inputs: `--syn-surface-input`, `--syn-border-subtle`, `--syn-border-focus`, 3px radius, tabular numeric values where coordinates/zoom/opacity are displayed.
- Panels/drawers: one coherent inspector surface with grouped rows and hairlines. Do not nest cards inside drawers. For map overlays, keep the map visually primary and use transparent or near-transparent chrome.
- Status: use `--syn-status-info`, `--syn-status-valid`, `--syn-status-error`, `--syn-status-blocked`, `--syn-status-stale`, `--syn-status-unknown`, `--syn-status-demo`, `--syn-status-running`, and `--syn-status-pending`. Caveat/warning states use explicit text plus non-amber info/stale/error treatment according to severity.
- Data palettes: map symbology may use literal data colors or helper palettes, but UI chrome, defaults, demo data, generated exports, and Query-to-SQL outputs must not default to amber/gold/yellow/orange.

## Map Explorer Heavy-Chrome Scan

Run this alongside the Standard Amber Scan when a B prompt touches UI chrome:

```powershell
rg -n "borderRadius:\\s*(?:['\"]?(?:1[0-9]|[2-9][0-9])px|MAP_RADIUS\\.(?:md|lg|glass|full)|999|50%)|border-radius:\\s*(?:1[0-9]|[2-9][0-9]|999|50%)|radial-gradient|linear-gradient|boxShadow|box-shadow:\\s*0\\s+\\d+px|MAP_SHADOWS\\.(?:modal|dropdown|panel)|DESIGN_TOKENS\\.gradients|DESIGN_TOKENS\\.shadows\\.(?:glow|premium)|background:\\s*MAP_COLORS\\.amber|MAP_COLORS\\.amber|MAP_STROKES\\.(?:hairline|hairlineStrong|hairlineSubtle|dashedStrong)" src/centerpanel/components src/services/map src/stores/useMapExplorerStore.ts -g "*.ts" -g "*.tsx" -g "*.css"
```

---

## Prompt B01 - Map Explorer Amber Inventory And Center Panel Alignment Lock

### Objective

Build the exact amber-removal, heavy-chrome, and Center Panel alignment inventory for the complete Map Explorer before changing product code.

### Scope

- All Part 3 in-scope paths.
- Documentation updates in `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md` only.

### Required Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
- Current Center Panel design anchors:
  - `src/centerpanel/registry-ui/newProject.module.css`
  - `src/centerpanel/styles/registry.module.css`
  - `src/centerpanel/styles/guides.module.css`
  - `src/centerpanel/styles/note.module.css`
  - `src/centerpanel/styles/flows.module.css`
  - `src/centerpanel/styles/tools.module.css`
- Map Explorer anchors:
  - `src/constants/design.ts`
  - `src/centerpanel/components/map/mapTokens.ts`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/map/MapToolbar.tsx`
  - `src/centerpanel/components/map/MapLayerManager.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/MapDataImportHubDialog.tsx`
  - `src/stores/useMapExplorerStore.ts`

### Tasks

1. Run the Standard Amber Scan for Map Explorer exactly as written near the top of this file.
2. Run the Map Explorer Heavy-Chrome Scan above.
3. Group every amber hit as `map-ui-token`, `modal-chrome`, `cockpit-chrome`, `toolbar-control`, `search-pin-bookmark-control`, `layer-row`, `drawer-status`, `dialog-form-control`, `interactive-tool-default`, `generated-export-content`, `map-default-style`, `data-palette`, `store-default`, `test-fixture`, or `retain-with-reason`.
4. Group every heavy-chrome hit as `token-source`, `floating-tool-frame`, `nested-card`, `decorative-gradient`, `oversized-radius`, `decorative-shadow`, `filled-button-plate`, `generated-preview-frame`, `map-canvas-overlay-keep`, or `retain-with-reason`.
5. Inventory all `MAP_COLORS.amber*`, `MAP_STROKES.*` amber hairlines, `MAP_RADIUS.md/lg/glass/full` UI uses, `MAP_SHADOWS.dropdown/panel/modal` UI uses, `DESIGN_TOKENS.mapExplorer.colors.amber*`, `DESIGN_TOKENS.colors.primary[500]` map consumers, and `--syn-status-warning` map consumers.
6. Inventory default/demo/generated color emitters separately from analytical data palettes. Include `useMapExplorerStore.ts` annotation defaults, `demoDataPacks.ts`, `heatmapStyleUtils.ts`, `symbolStyleUtils.ts`, `MapEngineAdapter.ts`, `MapCartographyAdvisor.ts`, `MapPersistenceService.ts`, `MapExportService.ts`, `ExternalServiceConnector.ts`, and `MapNLQueryBuilder.ts` if scan hits are present.
7. For each major surface, record the Center Panel pattern it must imitate: single surface groups, dense rows, 3px fields, ghost buttons, blue left rail, hairline separators, transparent overlays, or non-amber status rows.
8. Record a file-by-file migration order in the ledger matching B02-B15.
9. Do not change product code in this prompt unless the user explicitly asks for a batch.

### Acceptance Criteria

- Ledger contains a complete Map Explorer amber and heavy-chrome inventory.
- `mapTokens.ts` and `src/constants/design.ts` map-specific amber dependencies are identified before component-level work.
- UI/default/demo/generated colors are separated from real data visualization palettes.
- Every hit has an owner category and a planned B prompt.
- The next prompt is `B02`.
- No product code changed.

### Validation

- Documentation-only validation.
- Record the exact scan commands, hit counts, retained categories, and next prompt in the ledger.

---

## Prompt B02 - Map Tokens, Style Primitives, And Compatibility Aliases

### Objective

Remove amber from shared Map Explorer token primitives and `mapStyles` so downstream components inherit the Center Panel workbench palette before component-level cleanup.

### Primary Files

- `src/centerpanel/components/map/mapTokens.ts`
- `src/constants/design.ts` only for map-specific `DESIGN_TOKENS.mapExplorer` aliases or compatibility values.
- `src/centerpanel/components/map/__tests__/map-components.test.ts`

### Tasks

1. Rename the `Charcoal-Amber Palette` comment and map UI alias taxonomy to non-amber semantic names: `interaction`, `interactionSoft`, `interactionSubtle`, `selected`, `selectedSubtle`, `focus`, `hairline`, `hairlineStrong`, `hairlineSubtle`, `caveat`, `caveatText`, `neutral`, or similar.
2. Re-point `MAP_COLORS.bg`, `bgPanel`, `bgHeader`, and `bgWorkspace` to `var(--syn-surface-*)` strings where possible; keep literal fallback only when the token must work in generated non-DOM contexts and document the reason.
3. Replace `MAP_COLORS.amber*` primary aliases with non-amber values based on `--syn-interaction-active`, `--syn-interaction-hover`, `--syn-border-subtle`, `--syn-border-focus`, and neutral text tokens.
4. Keep old `MAP_COLORS.amber*` export names only as temporary compatibility aliases if required by many callers, but make them resolve to non-amber values and mark them deprecated in a short comment. Do not leave any alias rendering amber.
5. Convert `MAP_STROKES.hairline`, `hairlineStrong`, `hairlineSubtle`, and `dashedStrong` to neutral/blue workbench borders. `marker` may remain white if it frames a map marker over the basemap.
6. Convert `MAP_RADIUS` and `MAP_SHADOWS` use contracts: default map UI controls and rows should consume 0-4px radius and no shadow; `dropdown/panel` shadow should be restrained or `none` unless a floating tool needs legibility over the map.
7. Rewrite `mapStyles.title`, `btn`, `btnActive`, `workspaceBar`, `workspaceLabel`, `extensionSlotNotice`, `bottomTimelineNotice`, `dragOverlay`, `importProgress`, `layerPanelOpenButton`, `sidePanelTitle`, `sidePanelPrimaryButton`, `sidePanelSearchInput`, and related shared styles to the Center Panel discipline: transparent defaults, 3px controls, muted uppercase labels, hairline separators, and restrained blue active state.
8. Do not route map symbology through UI status tokens. Add separate `MAP_DATA_COLORS` or helper comments only if needed to clarify data-palette separation.
9. Update `map-components.test.ts` so tests assert semantic map token behavior, not amber values or amber names as desired accent.

### Acceptance Criteria

- `mapTokens.ts` no longer exposes amber as the primary map UI accent.
- Any retained `amber*` compatibility alias is non-amber, documented as deprecated, and scheduled for removal after B14 if still referenced.
- Shared `mapStyles` render Center Panel-like workbench chrome by default: neutral hairlines, compact controls, transparent active surfaces, blue interaction.
- Tests no longer encode amber as the expected Map Explorer accent.
- No map data palette is accidentally tied to UI status/chrome tokens.

### Validation

- `npm run typecheck`
- Targeted token test: run the smallest command that covers `src/centerpanel/components/map/__tests__/map-components.test.ts`.
- Re-run the Map Explorer Standard Amber Scan and Heavy-Chrome Scan; record central-token residuals and compatibility aliases in the ledger.

---

## Prompt B03 - Map Shell, Modal, Docking Rails, Canvas Chrome, Focus, And Status Bar

### Objective

Restyle the Map Explorer modal shell, embedded shell, docking rails, canvas-adjacent chrome, focus CSS, and status bar as a map-first workbench surface aligned with the completed Center Panel shell.

### Primary Files

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`
- `src/centerpanel/components/map/mapDocking.ts` only if docking dimensions/metadata expose chrome defaults.
- `src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx`
- `src/centerpanel/components/map/__tests__/map-docking.test.ts`
- `src/centerpanel/components/map/__tests__/map-accessibility.test.ts`

### Tasks

1. Replace `MapWorkspaceShell.tsx` amber focus fallback (`MAP_COLORS.amber`, `rgba(245,158,11,...)`) with `--syn-border-focus` / `--syn-interaction-focus-ring` and a blue `color-mix` focus shadow.
2. Convert modal and embedded surfaces to `--syn-surface-workbench` and `--syn-surface-panel` with no decorative glow, no amber overlay, and no large rounded modal card frame.
3. Docking rails should read like Center Panel inspectors: neutral side rails, `--syn-border-subtle` separators, transparent backgrounds, no card-in-card, no amber rail handles. Resize handles keep hit target size but show focus/hover with blue hairline only.
4. Canvas fallback controls and keyboard controls should be compact overlay tools with transparent/default neutral backgrounds, 3-4px radius, visible focus, and no amber border/fill. Preserve keyboard semantics and aria labels.
5. Status bar warning/caveat rendering must not use `--syn-status-warning` if it is amber. In `MapStatusBar.tsx`, map QA caveats to explicit text plus non-amber `info` or `stale` treatment; blocked/error remains error; valid remains valid.
6. Keep map content primary: controls recede behind basemap/layer symbology, no page-like card framing around the canvas, no hero/header treatment.
7. Preserve modal open/close behavior, focus trap behavior, aria-modal intent, viewport lifecycle, layer sync, map lifecycle, keyboard fallback, and docking state.

### Acceptance Criteria

- Shell, docking rails, focus-visible states, keyboard controls, canvas overlays, and status bar contain no amber UI chrome.
- Status bar labels still expose project, layers, cursor, zoom, CRS, QA, sync, save/load, and AOI state without relying on color alone.
- No map readiness/QA/caveat state is made to look ready.
- Map remains visually primary in modal and embedded modes.

### Validation

- `npm run typecheck`
- Targeted tests for map lifecycle/docking/accessibility if affected.
- Manual or Playwright visual smoke if a dev server is available: modal mode, embedded mode, compact width, keyboard focus traversal.
- Re-run the Map Explorer Standard Amber Scan and Heavy-Chrome Scan for B03 files.

---

## Prompt B04 - Map Command Cockpit, Workspace Bars, Timeline, And Progress Surfaces

### Objective

Migrate the Map Workspace cockpit and workspace command surfaces to the same dense Center Panel workbench language while preserving the command model and operational status truthfulness.

### Primary Files

- `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
- `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx` only for workspace bar/timeline slots not completed in B03.
- `src/centerpanel/components/map/mapExperience.ts`
- `src/centerpanel/components/map/mapContextSummary.ts`
- `src/centerpanel/components/map/__tests__/map-workspace-experience.test.ts`
- `src/centerpanel/components/map/__tests__/mapContextSummary.test.ts`

### Tasks

1. Replace cockpit decorative gradients, radial accent washes, heavy shadows, and filled primary command plates with flat inspector panes, hairline separators, transparent buttons, and blue text/border affordance.
2. Keep the cockpit layout operational and dense: context cells, signal rows, sequence rows, mode buttons, recommended bands, integration rows, and quick action grids should look like Center Panel row groups, not dashboard cards.
3. Change `--cockpit-warning` away from `--syn-status-warning` if that resolves amber. Caveat/warning/attention rows use explicit text plus `--syn-status-info`, `--syn-status-stale`, or `--syn-status-error` according to severity.
4. Active mode buttons use blue left rail, underline, or subtle 8-12% blue tint. Avoid filled card states and large rounded plates.
5. Running/progress surfaces keep motion and progress semantics but use blue/valid status colors and neutral tracks. Do not introduce decorative animation.
6. Workspace bars, extension slots, bottom timeline notices, import progress strips, and drag overlays should use Center Panel group labels, neutral surfaces, and thin separators; no amber progress fill or dashed amber drop zone.
7. Preserve workspace view selection, quick action command wiring, context summary text, command disabled reasons, and all existing aria labels.

### Acceptance Criteria

- Cockpit and workspace bars are amber-free and visually match the completed Center Panel: dense rows, flat panes, muted uppercase labels, hairlines, ghost controls.
- Existing command/status behavior and disabled reasons are unchanged.
- Warning/caveat statuses remain explicit and do not render as ready/valid.
- No new heavy gradients, glows, or shadow stacks are introduced.

### Validation

- `npm run typecheck`
- Targeted workspace/context tests if changed.
- Manual visual smoke for the cockpit at 960px, 1280px, and compact modal width if a dev server is available.
- Re-run the Map Explorer Standard Amber Scan and Heavy-Chrome Scan for B04 files.

---

## Prompt B05 - Toolbar, Search, Pins, Bookmarks, Context Menus, And Map Explorer Entry Button

### Objective

Remove amber and filled-button styling from the command toolbar, location search, pin/sidebar surfaces, bookmark controls, context menus, and the Map Explorer launch button.

### Primary Files

- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapSearchBar.tsx`
- `src/centerpanel/components/map/MapPinSidebar.tsx`
- `src/centerpanel/components/MapBookmarkBar.tsx`
- `src/centerpanel/components/MapContextMenu.tsx`
- `src/centerpanel/components/map/contextMenuUtils.ts`
- `src/centerpanel/components/MapExplorerButton.tsx`
- `src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx`
- `src/centerpanel/components/map/__tests__/map-context-menu.test.ts`
- `src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx`

### Tasks

1. Convert toolbar command buttons to Center Panel icon-button discipline: transparent default, 24-32px stable dimensions where possible, neutral hover, blue icon/text or 2px rail for active state, visible focus ring.
2. Remove amber from `toneColor`, active command styles, focus outlines, status badges, hover handlers, menu items, and toolbar overflow surfaces. `warning` command tone should remain text-backed and non-amber.
3. Search input and results should match Center Panel compact input/list patterns: `--syn-surface-input`, `--syn-border-subtle`, `--syn-border-focus`, 3px radius, row hover via neutral/blue tint, no amber result hover.
4. Pin rows, bookmark rows, context action rows, and launcher button should be dense row controls, not mini cards. Selected/active state uses blue rail/text; destructive actions use error token with explicit label.
5. Preserve tooltips, aria labels, disabled reasons, shortcuts, command routing, pin persistence, bookmark limit behavior, context menu positioning, and search result selection.
6. Update tests only when expected token names or non-amber defaults change.

### Acceptance Criteria

- Toolbar/search/pin/bookmark/context controls contain no amber UI styling.
- No filled rounded button plates remain for routine map commands.
- Active state is legible through icon/text/rail/focus, not a large filled card.
- Keyboard focus remains visible, and control text fits at compact widths.

### Validation

- `npm run typecheck`
- Targeted toolbar/search/bookmark/context/accessibility tests if touched.
- Re-run the Map Explorer Standard Amber Scan for B05 files.

---

## Prompt B06 - Layer Manager, Layer Panel, Registry Rows, Badges, Popovers, And Sync States

### Objective

Convert layer management from amber-tinted control cards to dense, truthful workbench inspector rows without altering layer store behavior or sync semantics.

### Primary Files

- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- `src/centerpanel/components/map/mapLayerMetadata.ts`
- `src/centerpanel/components/map/useLayerSync.ts`
- `src/centerpanel/components/map/__tests__/map-layer-management.test.ts`

### Tasks

1. Replace active layer, visible layer, stale layer, symbology-active, cartography-review, and selected base-layer amber states with blue rail/text, neutral row backgrounds, or semantic non-amber status chips.
2. Replace layer opacity/range `accentColor` amber with `--syn-interaction-active` or an equivalent non-amber token.
3. Flatten layer rows into Center Panel table/list rhythm: no card border per layer, no amber row fills, no heavy shadows; use hairline row separators and compact metadata/badge rails.
4. Popovers, action menus, dialog mini-forms, add-layer controls, manual layer forms, and demo layer controls should use 3px workbench fields, transparent/ghost buttons, and neutral `--syn-border-subtle` borders.
5. Badges for demo, external, stale, QA warning, invalid, hidden, unsynced, selected, published, queryable, and derived states must keep explicit text/tooltips. Demo/stale/caveat states must not share valid/success styling.
6. Preserve layer order, visibility, opacity, registry metadata normalization, publication readiness computation, layer sync, map dispatch, drag behavior, and context menus.
7. Update tests that expect amber layer defaults, active layer styles, or old token names.

### Acceptance Criteria

- Layer rows, badges, toggles, popovers, dropdowns, active states, and layer panel base-style buttons are amber-free.
- Row surfaces are compact and separator-led rather than card-led.
- State truthfulness is preserved through text/tooltips/labels, not color alone.
- Layer behavior, registry metadata, sync semantics, and order/visibility logic are unchanged.

### Validation

- `npm run typecheck`
- Targeted layer management tests.
- Re-run the Map Explorer Standard Amber Scan and Heavy-Chrome Scan for B06 files.

---

## Prompt B07 - Scientific QA, Readiness, Evidence, And Status Semantics

### Objective

Remove amber from scientific QA and readiness status surfaces while preserving CRS safety, evidence provenance, publication readiness, and blocked/caveat truthfulness.

### Primary Files

- `src/centerpanel/components/map/ScientificQAPanel.tsx`
- `src/centerpanel/components/map/mapEvidenceArtifacts.ts`
- `src/centerpanel/components/map/mapLayerMetadata.ts`
- `src/centerpanel/components/map/mapTypes.ts` only if default visible color literals are present; do not rename domain status types.
- `src/services/map/MapScientificQA.ts`
- `src/services/map/MapScientificQA.worker.ts`
- `src/services/map/MapPublicationOutputBindingService.ts`
- `src/services/map/__tests__/MapScientificQA.test.ts`
- `src/services/map/__tests__/MapPublicationOutputBindingService.test.ts`
- `src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts`

### Tasks

1. Replace amber warning/caveat panels, left borders, issue highlights, QA summary accents, and readiness chips with non-amber status treatments.
2. Keep status labels and domain values (`warning`, `ready-with-caveats`, `needs-review`, `blocked`, `unknown`, `unchecked`, `passed`) unchanged unless a test assertion only names color. Do not rename scientific statuses to avoid downstream contract drift.
3. Map visual tones as: blocked/error -> error; passed/ready -> valid; running -> running/info; unchecked/unknown -> unknown/stale; warning/caveat/needs-review -> explicit text plus info/stale treatment, never amber.
4. Flatten QA panels into inspector sections: muted uppercase group labels, rows separated by hairlines, transparent backgrounds, compact badges.
5. Do not change CRS validation, worker execution, QA issue generation, evidence artifact creation, evidence QA state, max artifact behavior, or publication output binding logic.
6. Update tests only for style/token expectations, not scientific status logic.

### Acceptance Criteria

- Scientific QA and readiness UI no longer uses amber, gold, yellow, or `--syn-status-warning` as rendered chrome.
- Caveats and warnings remain more explicit than neutral text through labels, icons, counts, aria text, or disabled reasons.
- No scientific readiness state is weakened or made to look valid.
- Evidence and QA behavior are unchanged.

### Validation

- `npm run typecheck`
- Targeted QA/evidence/publication tests if touched.
- Re-run the Map Explorer Standard Amber Scan for B07 files.

---

## Prompt B08 - Workflow Drawer, NL Query, Review Timeline, Cartography Recommendations, And Report Handoff Drawer

### Objective

Migrate the high-risk map drawers and recommendation surfaces to dense Center Panel inspector chrome without changing workflow, NL-query safety, review, cartography, or report handoff logic.

### Primary Files

- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/centerpanel/components/map/MapNLQueryPanel.tsx`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/centerpanel/components/map/CartographyRecommendationList.tsx`
- `src/services/map/MapWorkflowService.ts`
- `src/services/map/MapNLQueryBuilder.ts` only for generated default styles; deeper service defaults are B13 if broad.
- `src/services/map/MapReviewSessionService.ts`
- `src/services/map/MapReportHandoffService.ts`
- `src/services/map/MapCartographyAdvisor.ts` only for UI recommendation display defaults; broader generated colors are B13.
- Targeted tests for the above files.

### Tasks

1. Replace amber drawer titles, recommendation highlights, report-readiness badges, caveat strips, prompt panels, links, and left borders with Center Panel workbench tokens.
2. Drawers should be one coherent inspector surface: header hairline, option rows, body sections, sticky footer if needed, no nested cards unless a live preview/frame genuinely needs containment.
3. Report handoff and export readiness states distinguish `ready`, `ready-with-caveats`, `needs-review`, `blocked`, `unknown`, and `stale` with explicit text plus non-amber status styling.
4. NL-query blockers/warnings must remain text-backed. Query safety and schema field availability must not be softened visually.
5. Cartography recommendations should use row severity labels/icons and blue/neutral selection affordances, not amber recommendation cards.
6. Preserve workflow preview/apply logic, NL-query preview execution, review event lifecycle, recommendation application, report draft generation, evidence registration, PDF/download/insert actions, drawer sizing, and aria naming.

### Acceptance Criteria

- Workflow/NL/review/report/cartography drawers contain no amber UI styling.
- Drawers look like VS Code inspectors: dense rows, muted group labels, hairline separators, ghost controls.
- Warning/caveat/readiness semantics remain explicit and cannot be mistaken for ready/valid.
- Service contracts and generated draft data are unchanged except non-amber visible defaults if local to these surfaces.

### Validation

- `npm run typecheck`
- Targeted NL query, workflow, review timeline, report handoff, and cartography tests if touched.
- Re-run the Map Explorer Standard Amber Scan and Heavy-Chrome Scan for B08 files.

---

## Prompt B09 - Import, CSV, Columnar, External Service, And Dataset Dialogs

### Objective

Remove amber and card-heavy styling from map import and external service dialogs while preserving parsing, validation, dataset loading, and service connection behavior.

### Primary Files

- `src/centerpanel/components/MapDataImportHubDialog.tsx`
- `src/centerpanel/components/MapCsvImportDialog.tsx`
- `src/centerpanel/components/MapColumnarImportDialog.tsx`
- `src/centerpanel/components/MapServiceDialog.tsx`
- `src/services/map/MapDataImporter.ts`
- `src/services/map/ExternalServiceConnector.ts` only for generated/default visible layer colors; broad defaults are B13.
- `src/services/map/__tests__/MapDataIO.test.ts`
- `src/services/map/__tests__/ExternalServiceConnector.test.ts`

### Tasks

1. Remove amber hero/header gradients, filled primary import buttons, amber badges, table headers, row preview fills, form focus rings, progress chips, and local format cards.
2. Convert dialogs to compact workbench modals: neutral panel surface, 3-4px radius, hairline header/footer, dense form rows, muted uppercase labels, scrollable body, transparent/ghost secondary controls, and restrained blue primary action.
3. Replace local format cards with row/list sections or thin-bordered tiles only when scanability requires them; avoid card-in-card stacking.
4. CSV and columnar preview tables use Center Panel table rhythm: sticky muted header, hairline row separators, tabular numerics, no amber header background.
5. Quality scores, import readiness, CRS metadata, worker-transfer state, external-service errors, and loading/progress states remain explicit through text/icons/status labels.
6. Preserve file parsing, schema preview, quality scoring, worker transfer, local file browse, curated dataset loading, external service URL handling, progress callbacks, and error handling.

### Acceptance Criteria

- Import and service dialogs are amber-free and visually aligned with New Project/Toolbox workbench form discipline.
- Dialog buttons no longer use decorative filled amber plates.
- Preview tables and format lists do not create nested card stacks.
- Import/readiness statuses remain truthful and accessible.

### Validation

- `npm run typecheck`
- Targeted import/service tests if touched.
- Manual dialog smoke for import hub, CSV, columnar, and external service flows if a dev server is available.
- Re-run the Map Explorer Standard Amber Scan and Heavy-Chrome Scan for B09 files.

---

## Prompt B10 - Export, Publication, Composition, Snapshot Preview, And Generated Output Chrome

### Objective

Remove amber from export/publication UI and generated preview/output chrome without changing export structure, PDF generation, publication readiness, or report package content.

### Primary Files

- `src/centerpanel/components/MapDataExportDialog.tsx`
- `src/centerpanel/components/MapExportDialog.tsx`
- `src/centerpanel/components/MapCompositionLayout.tsx`
- `src/services/map/MapExportService.ts`
- `src/services/map/MapDataExporter.ts`
- `src/services/map/MapReportHandoffService.ts` only if generated snapshot/readiness colors are local.
- `src/services/map/__tests__/MapExportService.test.ts`
- `src/services/map/__tests__/MapReportHandoffService.test.ts`

### Tasks

1. Remove amber export dialog titles, tab/format fills, primary button plates, readiness chips, table headers, comparison cards, generated preview borders, and print/export HTML/SVG accents.
2. Generated map decorations such as compass, north arrow, crosshair, crop/registration marks, snapshot frames, and PDF/SVG helper graphics must use non-amber neutral/blue values unless they are actual layer symbology.
3. Publication readiness colors distinguish `ready`, `ready-with-caveats`, `needs-review`, `blocked`, `stale`, and `unknown` with non-amber text-backed status treatment.
4. Export modals and composition controls follow Center Panel form discipline: single surface, hairline header/footer, 3px controls, transparent defaults, blue primary outline/text, compact table rows.
5. Do not change export output schema, manifest structure, PDF layout dimensions, file download behavior, report handoff payloads, evidence QA mapping, or data serialization.
6. Update tests that expect `#F59E0B`, amber compass/crosshair output, amber medium-density fixtures, or amber readiness chrome.

### Acceptance Criteria

- Export dialogs and generated export-adjacent chrome are amber-free.
- Generated output still distinguishes map decorations from data symbology and remains readable in dark/print contexts.
- Readiness caveats remain explicit and non-ambiguous.
- Export/report tests no longer encode amber defaults.

### Validation

- `npm run typecheck`
- Targeted export/report handoff tests.
- Manual export-preview smoke if a dev server is available.
- Re-run the Map Explorer Standard Amber Scan for B10 files.

---

## Prompt B11 - Drawing, Measurement, Annotation, Temporal, VoxCity Overlay, And Store Defaults

### Objective

Remove amber from interactive map tool defaults and panels while preserving drawing, measurement, annotation, temporal playback, VoxCity overlay, and persisted map-store behavior.

### Primary Files

- `src/centerpanel/components/MapDrawingManager.tsx`
- `src/centerpanel/components/MapMeasurementTool.tsx`
- `src/centerpanel/components/MapAnnotationLayer.tsx`
- `src/centerpanel/components/MapTemporalPlayer.tsx`
- `src/centerpanel/components/MapVoxCityOverlay.tsx`
- `src/stores/useMapExplorerStore.ts`
- `src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts`
- `src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts`
- `src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx`
- `src/stores/__tests__/useMapExplorerStore.test.ts` if present and affected.

### Tasks

1. Replace drawing, measurement, annotation, and temporal tool control chrome with workbench ghost controls, 3px fields, hairline sections, and blue active cues.
2. Replace map style defaults that use `MAP_COLORS.amber` for draw fills/lines/circles, measurement outlines, annotation text/line defaults, selected annotation focus, temporal active state, and VoxCity overlay controls.
3. Update `DEFAULT_ANNOTATION_SETTINGS.color` in `useMapExplorerStore.ts` from amber to a non-amber default. Treat this as a visible map style default, not a logic change. Preserve persisted-store migration behavior.
4. Measurement CRS warnings must remain explicit with text and non-amber status treatment; never soften geodesic/projection caveats.
5. Keep data-editing and geometry behavior unchanged: draw modes, feature IDs, measurements, annotation CRUD, leader lines, temporal playback, VoxCity footprint handoff, and map layer integration.
6. Update annotation/drawing/store tests that assert old amber defaults.

### Acceptance Criteria

- Drawing, measurement, annotation, temporal, VoxCity overlay, and store-provided visible defaults are amber-free.
- Interactive tools remain legible over the map without heavy cards or filled amber controls.
- CRS/measurement caveats remain explicit and accessible.
- Persisted state shape and tool behavior are unchanged.

### Validation

- `npm run typecheck`
- Targeted drawing, measurement, annotation, and store tests if affected.
- Manual smoke for draw/select/measure/annotation focus if a dev server is available.
- Re-run the Map Explorer Standard Amber Scan for B11 files.

---

## Prompt B12 - Visualization Panels, Symbology Utilities, Demo Packs, And Renderer Defaults

### Objective

Remove amber as a default/demo/generated visualization color from renderer panels and symbology utilities while keeping analytical palettes separate from UI chrome.

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
- Renderer and symbology tests under `src/centerpanel/components/map/__tests__/**`.

### Tasks

1. Replace amber UI chrome in visualization panels: panel headings, controls, sliders, ramp buttons, selected ramp state, legend toggles, table/list row active state, empty states, and add-to-map actions.
2. Replace amber default/fallback symbology values in renderer helpers and layer style utilities. Use non-amber defaults such as blue, cyan, teal, violet, slate, or documented data-ramp colors.
3. Replace demo pack amber colors and labels such as `Primary (demo)` / `Moderate access (demo)` when they use amber as a default/demo output. Preserve demo labeling truthfully.
4. Heatmap/hotspot ramps may keep non-UI analytical sequential/diverging colors only if documented. Any yellow/orange stop must be justified as data-palette, not UI/default/demo chrome, and must not be named amber/gold.
5. Visualization panels should match Center Panel density: flat inspector sections, no amber card borders, compact 3px controls, hairline table/list rows, transparent buttons.
6. Preserve data classification logic, geometry handling, spatial stats rendering, symbology expression building, layer output shape, and legend behavior.
7. Update tests that expect amber renderer defaults or amber demo data.

### Acceptance Criteria

- Renderer panels and default/demo symbology are amber-free except documented analytical palette exceptions.
- Data palette exceptions list palette purpose, classification type, legend behavior, no-data treatment, and why the color cannot be confused with UI warning/status.
- UI status/chrome tokens remain separate from map symbology.
- Rendering and symbology tests reflect the new non-amber defaults.

### Validation

- `npm run typecheck`
- Targeted symbology/spatial stats/renderer tests.
- Re-run the Map Explorer Standard Amber Scan and classify any residual data-palette hits.

---

## Prompt B13 - Map Services, Query Defaults, Cartography Advisor, Persistence, External Connectors, And Engine Outputs

### Objective

Remove amber from service-level default/generated map colors and tests without changing map analysis, persistence, export, or external service contracts.

### Primary Files

- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapCartographyAdvisor.ts`
- `src/services/map/MapPersistenceService.ts`
- `src/services/map/MapNLQueryBuilder.ts`
- `src/services/map/ExternalServiceConnector.ts`
- `src/services/map/MapAnalysisDispatcher.ts` if default visible layer styles appear in scans.
- `src/services/map/MapWorkflowService.ts` if preview layer colors appear in scans.
- `src/services/map/MapToUrbanContextAdapter.ts` and `UrbanToMapMethodRequestAdapter.ts` only if scan hits show visible map defaults.
- Related tests in `src/services/map/__tests__/**`.

### Tasks

1. Replace Query-to-SQL result layer amber defaults, analysis output highlight colors, generated color ramps, cartography advisor fallbacks, persistence restore fallback colors, external connector preview colors, and workflow preview layer colors.
2. Choose non-amber defaults that stay visually distinct from status colors and basemap styles. Prefer blue/cyan/teal/violet/slate defaults and documented data palettes for analytical ramps.
3. Do not change geometry handling, CRS handling, bounds restriction, completed run creation, analysis rerun metadata, persisted snapshot shape, external service request behavior, or NL-query audit metadata.
4. Avoid routing generated map symbology through UI status tokens. Use service-local data palette constants or renderer helper palettes where appropriate.
5. Update tests that describe or assert amber defaults, including Query-to-SQL layer tests, cartography advisor tests, persistence fallback tests, export/report tests if not handled in B10, and external service tests.
6. Document any retained yellow/orange analytical palette as `data-palette` in the ledger with purpose and non-UI justification.

### Acceptance Criteria

- No service-level default/demo/generated map output uses amber unless documented as a true analytical data-palette exception.
- Tests no longer name Query-to-SQL or map service defaults as amber.
- UI chrome/status tokens are not used as symbology defaults.
- Map service contracts, persistence, analysis output shape, and export structure are unchanged.

### Validation

- `npm run typecheck`
- Targeted map service tests for changed files.
- Re-run the Map Explorer Standard Amber Scan and classify all residual service hits.

---

## Prompt B14 - Map Explorer Final Cleanup, Test Drift, Accessibility, Heavy Chrome, And Visual QA

### Objective

Perform the final Map Explorer sweep for amber, unnecessary card frames, filled controls, layout density, focus visibility, data-palette boundaries, and test drift.

### Scope

- All Part 3 runtime UI files.
- Map services that generate visible colors.
- Store defaults that render visible map/annotation styles.
- Related tests with color assertions.

### Tasks

1. Re-run the Map Explorer Standard Amber Scan and eliminate every UI/default/demo/generated amber hit.
2. Re-run the Map Explorer Heavy-Chrome Scan and eliminate unnecessary card frames, oversized radii, decorative gradients, decorative shadows, filled button plates, and lingering `MAP_COLORS.amber*` / amber `MAP_STROKES` compatibility usages.
3. Confirm all retained color literals are one of: token-source outside active render path, test fixture with explicit non-UI reason, or documented analytical data-palette exception.
4. Check map desktop and compact layouts for control overlap, text overflow, focus visibility, drawer sizing, popover clipping, map content occlusion, and stable toolbar dimensions at 720, 960, 1280, and 1440px widths if a dev server is available.
5. Verify keyboard reachability and focus-visible states for toolbar, search, bookmarks, context menus, layer rows, layer action menus, drawers, dialogs, sliders, range inputs, export controls, draw/measure/annotation controls, and close buttons.
6. Confirm status truthfulness across `ready`, `ready-with-caveats`, `needs-review`, `blocked`, `unknown`, `stale`, `unchecked`, `warning`, `error`, `running`, and `demo` states. No caveat/unknown/stale/blocked/demo state should look valid.
7. Run targeted map tests touched across B02-B13 and update snapshots/assertions only for legitimate token/default changes.
8. Record manual or Playwright screenshot notes in the ledger covering shell, cockpit, toolbar/search, layer manager, QA/report drawers, import/export dialogs, drawing/measurement, and at least one renderer panel.

### Acceptance Criteria

- Map Explorer is amber-free except documented analytical palette exceptions.
- Map UI matches the completed Center Panel workbench discipline: map-first surface, flat inspectors, neutral hairlines, compact controls, transparent defaults, restrained blue interaction.
- No map readiness/QA/CRS/publication/report state is made less explicit.
- Related tests pass or residual failures are documented as unrelated existing failures.
- Ledger includes screenshot/manual QA notes and residual scan classifications.

### Validation

- `npm run typecheck`
- Targeted map tests for changed files.
- `npm run color:guard:changed` if available.
- Manual screenshot review or Playwright smoke if a dev server is available.
- Final Map Explorer Standard Amber Scan and Heavy-Chrome Scan.

---

## Prompt B15 - Final Color System Handoff

### Objective

Close the three-part color-system workstream after Urban Analytics, Center Panel, and Map Explorer have all completed their amber-removal and workbench-restyle gates.

### Required Files

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md` if final token notes changed.
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md` if prompt count or ownership notes changed outside this file.

### Tasks

1. Confirm prompts `A01`-`A10`, `C01`-`C10`, and `B01`-`B14` are completed or skipped with reason.
2. Record remaining amber hits by exact file and category. UI/default/demo/generated amber debt should be zero.
3. Record validation history: typecheck, analytics tests, targeted Center Panel tests, targeted map tests, scans, color guard, and visual QA.
4. Confirm all retained color literals are either token-source outside active scope, test fixture with explicit reason, or documented data-palette/content exceptions.
5. Confirm no GIS calculations, CRS behavior, evidence semantics, method validity, workflow readiness, map persistence, map service contracts, QA logic, NL-query safety, or report handoff contracts changed.
6. Update manifest statuses to match the ledger and mark the workstream complete. If B prompt count changed from earlier `B01`-`B10`, ensure manifest, ledger status register, unit matrix notes, and QA checklist references are synchronized.
7. Record final handoff notes using `COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`.

### Acceptance Criteria

- Ledger and manifest agree.
- Urban Analytics modal is amber-free and premium VS Code-like.
- Center Panel (all tabs + shell + header animations) is amber-free and premium VS Code-like, with preserved ambient motion intact.
- Map Explorer is amber-free and premium VS Code-like, aligned to the completed Center Panel code language.
- No unnecessary card frames, oversized radii, decorative amber gradients, amber data defaults, or filled button plates remain in the active scope.
- Final handoff lists no unresolved blocker.

### Validation

- JSON parse for manifest.
- Broadest practical validation if product files changed:
  - `npm run typecheck`
  - `npm run test:analytics`
  - targeted Center Panel tests changed by Part 2
  - targeted map tests changed by Part 3
  - screenshot/manual QA evidence
