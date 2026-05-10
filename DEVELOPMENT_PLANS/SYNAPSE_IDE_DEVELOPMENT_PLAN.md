# Synapse IDE — Premium Scientific Development Plan
## A Coder Workspace Engineered for Urban Analytics

> **Document type**: Strategic Engineering & UX Plan — Module 1 of a Three-Module Sequence
> **Module sequence**: **Synapse IDE (this document)** → Map Explorer → Urban Analytics Modal
> **Status**: PROPOSED — Implementation-grade foundation milestone for the Synapse Workbench coder module
> **Document version**: 1.0
> **Date**: 2026-05-02
> **Audience**: Senior front-end engineers, urban-informatics product leads, scientific UX designers, accessibility reviewers, engineering managers
> **Companion plans**: `MAP_EXPLORER_ENHANCEMENT_PLAN.md`, `URBAN_ANALYTICS_STRENGTHENING_PLAN.md`, `URBAN_ANALYTICS_TRANSFORMATION_PLAN.md`

---

## 0. Reading Guide

This document is the **first** of three coupled plans that will refactor the Synapse Workbench's three primary surfaces into a tri-modal scientific workspace:

1. **Synapse IDE** — the coder, file, and terminal surface (this document).
2. **Map Explorer** — the spatial operating surface (next plan).
3. **Urban Analytics Modal** — the indicator/methodology library and analytical reasoning surface (third plan).

The IDE plan is intentionally written **with the other two surfaces already in mind**. Every contract, store extension, and event channel introduced here must remain valid when the Map Explorer and Urban Analytics plans extend them. The IDE is the *lexical anchor* of the workbench — the surface where code, data files, AI plans, and analytical artifacts physically live — so it carries the strongest obligation to remain non-destructive, reversible, and synchronized.

**Non-goals of this plan** (handled by the other two):
- New map layers, deck.gl rendering features, MapLibre style trees.
- New urban indicator calculators, methodology cards, SDG flows.
- Changes to the Right-Panel Four-Block (`RightPanelFourBlock.tsx`) content surface.

**This plan's scope** (the *coder* module of the IDE):
- The IDE shell as composed in `src/components/ide/EnhancedIDE.tsx` and `src/components/ide/Header.tsx`.
- The Monaco editor surface at `src/components/editor/MonacoEditor.tsx` and the editor-bridge (`src/services/editor/bridge.ts`).
- The integrated terminal at `src/components/terminal/components/Terminal.tsx`.
- The file explorer at `src/components/file-explorer/`.
- The command palette and global search at `src/components/ide/CommandPalette.tsx` and `GlobalSearch.tsx`.
- The IDE-side AI panel at `src/components/ai/panel/SynapseCoreAIPanel.tsx`, plus the apply-plan pipeline at `src/utils/ai/apply/`.
- The IDE design tokens at `src/ui/theme/synapseTheme.ts`, `src/ui/theme/ideProScope.css`, `src/ui/theme/semanticTokens.ts`.
- The IDE-relevant stores: `src/stores/editorStore.ts`, `src/stores/fileExplorerStore.ts`, `src/stores/appStore.ts`.
- New **bidirectional sync seams** with the Map Explorer (`src/stores/useMapExplorerStore.ts`) and Urban Analytics Modal (`src/features/urbanAnalytics/store.ts`) — *defined here, implemented across all three plans*.

**How to read this document**:

- §1–§4 are the **why** (charter, audit, architecture, UX doctrine).
- §5 is the **what** (seven engineering tracks with files-to-touch and acceptance criteria).
- §6 is the **shared contract** that the next two plans inherit verbatim.
- §7–§16 are **cross-cutting concerns** (theming, state, i18n, security, performance, telemetry, onboarding, conflicts, keyboard, safety).
- §17–§20 are the **how and when** (roadmap, gates, risks, out-of-scope).
- Appendices are operational checklists and indices.

---

## 0.5. Table of Contents

| § | Section |
|---|---|
| 0 | Reading Guide |
| 0.5 | Table of Contents |
| 1 | Product Charter |
| 2 | Current-State Audit (Baseline) |
| 3 | Architectural Vision |
| 4 | UX Doctrine for the IDE |
| 5 | Track-by-Track Plan (T1–T7) |
| 6 | The Three-Module Synchronization Contract |
| 7 | Theming Plan |
| 8 | State, Persistence & Data Contracts |
| 9 | Internationalization & Locale |
| 10 | Security, Guardrails, and the AI Trust Boundary |
| 11 | Performance Budgets |
| 12 | Telemetry & Observability |
| 13 | Onboarding & First-Run |
| 14 | Conflict Resolution |
| 15 | Keyboard Map (Definitive) |
| 16 | Reversibility & Safety |
| 17 | Phased Roadmap |
| 18 | Quality Gates & Definition of Done |
| 19 | Risk Register |
| 20 | Out of Scope |
| 21 | Closing Principle |
| A | Appendix A — Glossary |
| B | Appendix B — Files-to-Touch Master Index |
| C | Appendix C — Implementation Checklist by Phase |

---

## 1. Product Charter

### 1.1 The IDE's role in the workbench

The Synapse IDE is **not a generic web IDE**. It is the **coder surface of an urban-informatics workbench**. Its first-class users are:

- **Urban scientists** who write Python (GeoPandas, OSMnx, momepy, rasterio) against the platform's spatial data.
- **GIS analysts** who edit GeoJSON, parameterize indicator runs, and tune flow steps.
- **Planning educators and graduate students** who read, annotate, and re-execute reproducible notebooks.
- **Spatial data engineers** who pipe DuckDB-WASM SQL, Arquero transforms, and worker-side ETL.

Therefore the IDE must satisfy two simultaneous standards:

| Standard | Implication |
|---|---|
| **Premium engineering tool** | Dense, keyboard-first, low-chrome, no marketing surface. Matches the quality bar of VS Code, JetBrains Fleet, Cursor, and Zed. |
| **Scientifically credible instrument** | Every artifact (file, run, plan, snippet) carries provenance: who/what created it, against which AOI, with which engine version, at which timestamp. |

The IDE must never become a "demo IDE for the map." It is the **canonical lexical record** of an analytical project, and the Map Explorer and Urban Analytics Modal are *derived views* over the artifacts the IDE owns.

### 1.2 Doctrine

Five non-negotiable principles govern every change in this plan:

1. **Preserve the existing shell.** No layout demolition. The current `EnhancedIDE.tsx` composition (header → sidebar/editor → terminal → AI dock) and `IdeThemeScope` token plumbing must remain intact. We *thicken* the surface; we do not redraw it.
2. **Truthful states.** Empty, loading, partial, error, disabled, sample, and demo states must each render a concrete, attributable label. No "Coming soon," no decorative "feature" tiles.
3. **Reversibility.** Every IDE action that mutates files, tabs, layouts, or cross-module state must be undoable or recoverable. The editor history (`editorStore.history`) is the model; we extend the same shape to file operations and apply-plan executions.
4. **Bidirectional sync, not coupling.** The IDE communicates with Map Explorer and Urban Analytics Modal through a typed event bus and three small store-to-store subscriptions. No direct cross-module imports of UI components.
5. **Token-driven theming.** Every new surface uses `SYNAPSE_COLORS`, `SEMANTIC_COLORS`, and the CSS variables in `ideProScope.css`. No new hard-coded hex values, no inline `style={{ background: '#000' }}` for surfaces. Existing inline-style hotspots (notably `Header.tsx`, `EnhancedIDE.tsx`'s welcome canvas) are migrated incrementally to CSS modules under `src/components/ide/styles/`.

### 1.3 Definition of "Premium" for this IDE

Premium does **not** mean glassmorphism, gradients, or motion. It means:

- **Information density**: 14 px monospace UI body, ≥ 1.4 line-height, 8/12/16/24 px spacing scale (`SPACING_SCALE`), ≤ 56 px header.
- **Affordance fidelity**: every clickable element shows an icon, label, tooltip with shortcut, hover state, focus ring (`FOCUS_VARIANTS.default` / `--focus-color: #FBBF24`), pressed state, and disabled-with-reason.
- **Determinism**: same input produces same output. Same prompt re-applied via "Apply Last Plan" produces the same diff against the same workspace fingerprint.
- **Deference to data**: the spatial data, code, and analytical results are the hero. The chrome is dark, neutral, and recedes. Brand presence is one 2 px gold gradient bar at the top (`[data-global-gold-bar]`, already present in `EnhancedIDE.tsx`).
- **Operational predictability**: keyboard maps are never silently overridden, layouts persist between sessions, and resizers always show numeric width feedback (already present at `EnhancedIDE.tsx:836–852` for the sidebar; we generalize this).

### 1.4 Anti-patterns the plan refuses to ship

These are explicitly disallowed in this module:

- Pop-up tutorials, coach marks, "did you know?" tips, lottie animations on idle.
- Cards-in-cards, inset shadows on inset shadows, gradient surfaces deeper than one level.
- Generic illustrations of laptops, cogs, brains, lightbulbs.
- Marketing copy in chrome ("Welcome to your future of coding!").
- Hidden features behind unlabelled icons (every icon must have an accessible name + tooltip + keyboard path).
- Silent failures (every error renders a `reportError` event and a non-blocking toast; nothing is swallowed by `try/catch` without an audit trail).

---

## 2. Current-State Audit (Baseline)

Read against the live codebase as of 2026-05-02. All file references are exact paths under `src/`.

### 2.1 IDE shell composition

`components/ide/EnhancedIDE.tsx` (≈ 1475 lines) wires:
- `Header` (top bar, ~1073 lines, dense, ~37 inline `style={{}}` blocks).
- A horizontal layout: `FileExplorer` (resizable 220–600 px) → editor area (Monaco, lazy-loaded) → AI dock (`AiAssistant` or `SynapseCoreAIPanel`, resizable 320–900 px).
- A vertical bottom split: `Terminal` (28–600 px, `terminalLogBus`-driven mock).
- A `CommandPalette` (Ctrl+K) and `GlobalSearch` (Ctrl+Shift+F).
- A `NewFileModal` for guided file creation.
- Cross-module hooks already in place:
  - `useUrbanStore.getState().open()` (line 743) — opens the Urban Analytics Modal from the IDE header.
  - `subscribeEditorBridge` (line 117) — receives `editor:openTab` events into the IDE.

### 2.2 Editor surface

`components/editor/MonacoEditor.tsx`:
- Theme map: `light → synapse-pro-light`, `neutral → synapse-pro-neutral`, `dark → synapse-pro` (defined in `monacoTheme.ts`).
- Bridges: `editor:insertAtCursor`, `editor:replaceActive` via `services/editor/bridge.ts`.
- Status bridge: `sbCounts`, `sbCursor`, `sbOptions`, `sbSelection`.
- **Missing**: language-server bridge, GeoJSON visual preview, Python diagnostics surface, breadcrumb path navigator, symbol outline, inline diff viewer.

### 2.3 Terminal

`components/terminal/components/Terminal.tsx` (~950 lines):
- Drives a **mock command processor** (line ~820–949). No PTY, no spawn, no shell interop. Hard-coded handlers for `help`, `clear`, `git`, `npm`, `docker`, etc., with synthetic latency.
- Subscribes to `terminalLogBus` for synthetic log streaming.
- Persists height to `localStorage` and supports minimize/maximize.
- **Missing**: real shell integration (or honest "log-only" framing), multi-tab, search-in-output, tagged channels (`build`, `python`, `flow-run`).

### 2.4 File Explorer

`components/file-explorer/FileExplorer.tsx`:
- Drag-and-drop, inline rename, context menu, multi-select, fuzzy filter, sort by name/type/modified/size.
- Sample seed tree in `fileExplorerStore.ts` (line 53–161).
- `pro/` subfolder includes `HeaderPro` with language/template selectors.
- **Missing**: virtualization for ≥ 500 nodes, GIS file icons (.geojson, .shp, .tif, .gpkg, .csv, .parquet) with proper visual differentiation, "Preview on Map" / "Run as Flow input" context menu actions, drop-target onto the Map Explorer, file-status badges for in-flight analyses.

### 2.5 Command Palette & Global Search

`components/ide/CommandPalette.tsx`:
- Modes `files | tabs | symbols | commands` exist; **`symbols` is unimplemented**.
- Custom fuzzy scorer (prefix +100, contains +60, gap-tolerant +40) in `services/commandRegistry.ts`. Adequate but not weighted.

`components/ide/GlobalSearch.tsx`:
- Indexes tabs and file names via `services/search.ts` (`indexDocs`/`queryDocs`).
- **Missing**: file-content search, symbol/AST search, regex toggle, scoped search (folder), search history.

### 2.6 AI integration

`components/ai/panel/SynapseCoreAIPanel.tsx`:
- Streaming via `useChatFSM`, `useAiStreaming`, or simple OpenAI streaming.
- Telemetry through `beginTrace`/`spanStart`/`endTraceOk`.
- `utils/ai/apply/buildApplyPlan.ts` and `executeApplyPlan.ts` translate assistant output into a typed file plan (create/replace/insertIntoActive/setActiveTab) that the IDE applies through `useFileExplorerStore` and `useEditorStore`.
- Three AI commands wired in `EnhancedIDE.tsx`:
  - `ai.improveSelection` (Ctrl+Alt+I)
  - `ai.explainSelection` (Ctrl+Alt+E)
  - `ai.addBeginnerComments` (Ctrl+Alt+C)
- **Missing**: visible diff/preview before apply, named-plan history, per-file undo across an applied plan, project-brief refresh transparency (`ai.refreshProjectBrief` exists but has no UI surface).

### 2.7 Stores & persistence

| Store | Purpose | Persistence |
|---|---|---|
| `stores/editorStore.ts` | Tabs, history (≤ 50 per tab), undo/redo, dirty tracking | `enhanced-ide-editor-state` (localStorage) |
| `stores/fileExplorerStore.ts` | Tree, expanded folders, selection, sort, search query | localStorage (subset) |
| `stores/appStore.ts` | Layout (sidebar, terminal, AI dock), theme, font, glass intensity | `enhanced-ide-app-state` v2 with migration |
| `stores/usePanelBridgeStore.ts` | Cross-panel context tags | In-memory |
| `stores/useMapExplorerStore.ts` | Viewport, layers, AOI, annotations, copilot, review session | `synapse-map-explorer-state` (selective) |
| `features/urbanAnalytics/store.ts` | Modal open, selected card, query, section, favorites | localStorage (`urban.nav.*`) |

The bones are excellent. The plan extends, never replaces.

### 2.8 Existing cross-module seams

- Document-level events already in use: `synapse:ui:close`, `synapse:chat:insert`, `synapse:editor:insert`, `synapse-map-layer-registry-change` (from `useMapExplorerStore`).
- Direct calls: `useUrbanStore.open()` from IDE header; `useMapExplorerStore.open()` from Urban Analytics Modal header.
- The IDE has **no inbound subscription** to map state, no inbound subscription to urban-analytics card selection, and no outbound "send-to-map" affordance.

This asymmetry is the largest single product gap in the workbench, and §6 of this plan defines the contract that closes it.

### 2.9 Audit metrics summary

| Metric | Current value | Source |
|---|---|---|
| Header inline `style={{}}` blocks | ~37 | `Header.tsx` |
| EnhancedIDE inline `style={{}}` blocks | ~28 | `EnhancedIDE.tsx` |
| Hard-coded hex literals in IDE chrome | 60+ | grep on `components/ide/**` |
| Language services available | 0 (Monaco built-in TS only) | — |
| Real shell processes | 0 (all simulated) | `Terminal.tsx:820-949` |
| AI mutations preview-then-apply | No (silent apply) | `executeApplyPlan.ts` |
| Plan history persistence | None | — |
| Cross-module subscribers in IDE | 0 inbound | — |
| GIS-specific file icons | 0 | `FileIcon.tsx` |
| Virtualized explorer trees | No | `FileExplorer.tsx` |
| Bottom-panel tabs | 1 (Terminal only) | `EnhancedIDE.tsx:1243` |
| Symbol outline | Not implemented | `CommandPalette.tsx` mode dead |

---

## 3. Architectural Vision

### 3.1 Layered architecture for the IDE

```
┌─────────────────────────────────────────────────────────────┐
│ Layer A — Presentation (React, styled-components, CSS vars) │
│   Header · TabBar · MonacoSurface · TerminalSurface         │
│   FileExplorer · CommandPalette · GlobalSearch · AiDock     │
│   Breadcrumbs · ProblemsPane · OutlinePane · DiffPane (new) │
├─────────────────────────────────────────────────────────────┤
│ Layer B — IDE State (Zustand + persist + immer)             │
│   editorStore · fileExplorerStore · appStore                │
│   problemsStore (new) · outlineStore (new)                  │
│   diffStore (new) · planHistoryStore (new) · tasksStore (new)│
│   searchIndexStore (new)                                    │
├─────────────────────────────────────────────────────────────┤
│ Layer C — Bridges & Services                                │
│   editor/bridge.ts · commandRegistry · tasksBridge          │
│   languageService (new, LSP-lite) · fileSystemAdapter (new) │
│   synapseBus (new, typed cross-module event bus)            │
│   searchIndexer (new, worker-side)                          │
├─────────────────────────────────────────────────────────────┤
│ Layer D — Cross-Module Contracts                            │
│   Map Explorer sync (selection, AOI, viewport)              │
│   Urban Analytics sync (active card, applied indicator)     │
│   Apply-Plan provenance (runId, parameters, source layers)  │
├─────────────────────────────────────────────────────────────┤
│ Layer E — Workspace Persistence                             │
│   Versioned project bundle (.synapse/workspace.json)        │
│   Plan-history ledger (.synapse/plans/*.json)               │
│   QA sidecars (.synapse/qa/<path>.json)                     │
│   Console transcripts (.synapse/console/*.log)              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 The seven engineering tracks

The plan is organized along seven engineering tracks. Each track owns a folder, a store (where stateful), a contract, and a Playwright spec. Phasing in §17 sequences them.

| # | Track | Owner folder | Store | Contract |
|---|---|---|---|---|
| **T1** | IDE shell & layout | `components/ide/`, `components/ide/styles/` | `appStore` | `LayoutSnapshot` versioned schema |
| **T2** | Editor surface | `components/editor/` | `editorStore`, `outlineStore`, `problemsStore` | `EditorBridgeEvent` typed channel |
| **T3** | Terminal & tasks | `components/terminal/`, `services/tasks/` | new `tasksStore` | `TaskRun` (id, kind, status, channel, source) |
| **T4** | File explorer & file system | `components/file-explorer/`, `services/fs/` | `fileExplorerStore` | `FileSystemAdapter` interface |
| **T5** | Search & navigation | `components/ide/CommandPalette`, `GlobalSearch`, `services/search/` | new `searchIndexStore` | `Indexable<File\|Symbol\|Tab\|Command>` |
| **T6** | AI & apply pipeline | `components/ai/`, `utils/ai/apply/`, `components/editor/DiffPane` | new `planHistoryStore` | `AppliedPlan` (runId, diffs, sourceMessageId) |
| **T7** | Cross-module sync | `services/synapseBus/`, `stores/usePanelBridgeStore.ts` | extends `usePanelBridgeStore` | `SynapseEvent` discriminated union |

### 3.3 The `synapseBus` event channel

A new typed event bus, defined once in `src/services/synapseBus/index.ts`, replaces ad-hoc `window.dispatchEvent` calls.

#### 3.3.1 Public API

```ts
// src/services/synapseBus/index.ts

export type SynapseSource = 'ide' | 'map' | 'urban' | 'flow' | 'engine';

export interface SynapseEnvelope<P> {
  payload: P;
  source: SynapseSource;
  timestamp: string;       // ISO 8601
  runId?: string;          // links event to an apply-plan or flow run
  correlationId?: string;  // links request/response pairs
}

export type SynapseEvent =
  // Editor surface
  | { kind: 'editor:openTab';         envelope: SynapseEnvelope<EditorOpenTabPayload> }
  | { kind: 'editor:insertAtCursor';  envelope: SynapseEnvelope<EditorInsertPayload> }
  | { kind: 'editor:replaceActive';   envelope: SynapseEnvelope<EditorReplacePayload> }
  | { kind: 'editor:fileSaved';       envelope: SynapseEnvelope<FileSavedPayload> }
  | { kind: 'editor:selectionChanged';envelope: SynapseEnvelope<EditorSelectionPayload> }
  // Filesystem
  | { kind: 'fs:fileChanged';         envelope: SynapseEnvelope<FileChangePayload> }
  | { kind: 'fs:fileDeleted';         envelope: SynapseEnvelope<{ path: string }> }
  | { kind: 'fs:fileRenamed';         envelope: SynapseEnvelope<{ from: string; to: string }> }
  // Tasks
  | { kind: 'task:run';               envelope: SynapseEnvelope<TaskRunRequest> }
  | { kind: 'task:status';            envelope: SynapseEnvelope<TaskRunStatus> }
  | { kind: 'task:log';               envelope: SynapseEnvelope<TaskLogLine> }
  // Plans
  | { kind: 'plan:previewing';        envelope: SynapseEnvelope<PendingPlan> }
  | { kind: 'plan:applied';           envelope: SynapseEnvelope<AppliedPlan> }
  | { kind: 'plan:reverted';          envelope: SynapseEnvelope<AppliedPlanRevert> }
  // Map (publishers from IDE; receiver in Map Explorer)
  | { kind: 'map:registerLayer';      envelope: SynapseEnvelope<OverlayLayerConfig> }
  | { kind: 'map:flyTo';              envelope: SynapseEnvelope<ViewportTarget> }
  | { kind: 'map:selectFeature';      envelope: SynapseEnvelope<FeatureSelection | null> }
  | { kind: 'map:layerRegistry:change'; envelope: SynapseEnvelope<MapLayerRegistryChangeDetail> }
  // Urban Analytics (publishers from IDE; receiver in Urban Analytics Modal)
  | { kind: 'urban:openCard';         envelope: SynapseEnvelope<{ cardId: string }> }
  | { kind: 'urban:applyCard';        envelope: SynapseEnvelope<UrbanCardApply> }
  // Workbench
  | { kind: 'workbench:snapshotRequest'; envelope: SynapseEnvelope<{}> }
  | { kind: 'workbench:snapshotReply';   envelope: SynapseEnvelope<WorkbenchSnapshot> };

export function publish<E extends SynapseEvent>(event: E): void;

export function subscribe<K extends SynapseEvent['kind']>(
  kind: K,
  handler: (envelope: Extract<SynapseEvent, { kind: K }>['envelope']) => void
): () => void;

export function subscribeAll(
  handler: (event: SynapseEvent) => void
): () => void;
```

#### 3.3.2 Migration path for legacy events

The existing string-named events (`synapse:chat:insert`, `synapse:editor:insert`, `synapse-map-layer-registry-change`) are migrated through `services/synapseBus/legacyAdapter.ts`:

```ts
// Bridges legacy DOM events ↔ typed bus for one release cycle.
// CI lint rule forbids new emit/subscribe of legacy event names outside this file.
export function installLegacyAdapter(): () => void;
```

After one release, the adapter is removed and only `synapseBus` remains.

#### 3.3.3 Subscriber discipline

All subscribers must:

- Memoize their handler (`useEffect` with empty deps + ref to latest selectors).
- Coalesce rapid bursts via `requestIdleCallback` or microtask queue when the handler triggers a Zustand write.
- Tear down on unmount (`return unsubscribe`).
- Survive `workbench:snapshotRequest` after a page reload by re-emitting current state.

A unit test (`services/synapseBus/__tests__/discipline.test.ts`) exercises 1000 events across 50 subscribers and asserts < 16 ms total handler time and zero memory leaks.

---

## 4. UX Doctrine for the IDE

### 4.1 Information architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [⎯ 2 px gold bar — workspace heartbeat] (existing data-global-gold-bar)    │
├────────────────────────────────────────────────────────────────────────────┤
│ Header: brand · tabs · run/build · save · sidebar/term/AI                  │
│         · global-search · command-palette · Urban Analytics · profile      │
├──┬───────────┬─────────────────────────────────────────────┬───────────────┤
│ A│ FileExpl  │  Editor surface (Monaco)                    │ AI dock       │
│ c│  - tree   │  ┌── Breadcrumb (new) ────────────────────┐ │  - chat       │
│ t│  - QA     │  │ /src/features/.../store.ts › exports    │ │  - context    │
│ i│   badges  │  ├──────────────────────────────────┬─────┤ │  - AiBrief    │
│ v│  - search │  │ Code                             │ Out │ │   panel       │
│ i│   filter  │  │                                  │ line│ │   (new)       │
│ t│           │  │                                  │(new)│ │               │
│ y│           │  └──────────────────────────────────┴─────┘ │               │
│ R│           │  Diff Pane (new, mounted when previewing)   │               │
│ a│           │                                             │               │
│ i│           │                                             │               │
│ l│           │                                             │               │
│  │           ├─────────────────────────────────────────────┤               │
│  │           │ Bottom Panel (new tabs):                    │               │
│  │           │ Terminal · Tasks · Problems · Plan History  │               │
│  │           │  · Search Results · Output                  │               │
├──┴───────────┴─────────────────────────────────────────────┴───────────────┤
│ Status bar (cursor · encoding · indent · errors · warnings · git)          │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Density & spacing

- Header height: **56 px** (current 56–64 px range, fixed).
- Tab height: **32 px** at comfortable density, **28 px** compact, **36 px** relaxed.
- Activity rail (left of explorer): **44 px** fixed.
- Bottom panel header: **32 px** (Terminal/Problems/Tasks tabs).
- Spacing scale: `SPACING_SCALE` (4/8/12/16/20/24/32/40 px). No 5/7/11/13/17 values.
- Radius scale: `RADIUS_SCALE` (6/10/16/20 px + pill).

### 4.3 Color & motion

- Backgrounds: `--color-bg-primary: #000`, `--color-bg-secondary: #121212`, `--color-bg-elevated: #202020`.
- Accent: `--brand-primary: #F59E0B`, used **sparingly** — primary CTA, focus ring, active tab indicator, the gold bar, and dirty-marker dot. Not on body text.
- Motion: `--anim-quick: 120ms`, `--anim-base: 200ms`, `--anim-gentle: 280ms`, all `cubic-bezier(.2,0,0,1)`. Honor `prefers-reduced-motion` (already done in `transition()` helper).
- Glass surfaces: only on overlays (Command Palette, Global Search, modals). The IDE workspace itself is opaque for legibility.

### 4.4 Typography

- UI: `--font-ui` (Inter / system).
- Code & monospace UI: `--font-code` (JetBrains Mono).
- Tab labels: `--font-code` 13 px / 1.2 line-height.
- Body explorer entries: `--font-ui` 13 px / 1.4.
- Headers: `--font-ui` 14 px / 1.3, `font-weight: 600`.
- Status bar: `--font-code` 12 px.

### 4.5 Accessibility floor

- All interactive elements have visible focus state (`FOCUS_VARIANTS.default`, 2 px solid `#FBBF24`, 2 px offset).
- Every region has `role` + `aria-label`: `header`, `navigation` (file explorer), `main` (editor), `complementary` (AI dock), `region` (terminal/problems).
- Tabs are roving-tabindex with arrow-key navigation and `aria-selected`.
- Status bar values changing (cursor position, errors) live in `aria-live="polite"` regions.
- Keyboard map (§15) is exhaustive and matches platform conventions (VS Code base + Synapse-specific superset).
- Color contrast: every text/background pair ≥ 4.5:1 against `#000`/`#121212` (verified by an axe-core spec extending `e2e/accessibility-audit.spec.ts`).

### 4.6 Component wireframes

Each new component below shows the intended structure as low-fidelity ASCII. Production components match these structures via CSS modules under `src/components/ide/styles/`.

#### 4.6.1 Activity Rail (`components/ide/ActivityRail.tsx`)

```
┌──┐
│⊟ │  Explorer       Ctrl+Alt+1   ← active when sidebar open
├──┤
│⌕ │  Search         Ctrl+Alt+2
├──┤
│↻ │  Plan History   Ctrl+Alt+3   ● badge: count of unrev'd plans
├──┤
│! │  Problems       Ctrl+Alt+4   ● red badge: error count
├──┤
│◗ │  Map Bridge     Ctrl+Alt+5   ● gold badge: # selected features
├──┤
│U │  Urban Bridge   Ctrl+Alt+6   ● gold badge: active card?
├──┤
│⚙ │  Settings       Ctrl+Alt+7
└──┘
```

Width fixed 44 px. Each button:

- 40×40 px hit-area, 24 px icon.
- `aria-label`, `aria-keyshortcuts`, `aria-current="page"` when active.
- Tooltip with label + shortcut + status (e.g., "Problems · 3 errors, 2 warnings").
- Focus ring inset 2 px gold.

#### 4.6.2 Breadcrumb (`components/ide/Breadcrumb.tsx`)

```
src › features › urbanAnalytics › store.ts │ exports › useUrbanStore › open()
```

- Each segment is keyboard-focusable; Enter opens a context popover (folder view / symbol picker).
- Path segments resolve via `fileExplorerStore.getFileByPath` and navigate the explorer.
- Symbol segments resolve via `outlineStore.byTabId[activeTabId]`.
- Truncation: middle ellipsis (`src › … › store.ts › useUrbanStore`) preserving first and last two segments.
- Renders for the active editor pane only; on split, each side has its own Breadcrumb.

#### 4.6.3 Outline Pane (`components/editor/OutlinePane.tsx`)

```
┌─ Outline ──────────── ⌕ ▼
│ ▼ class UrbanStore               L42
│   ▾ method open()                L58
│     ▸ method close()             L67
│   ▾ method recordView()          L73
│ ▼ exports                         
│   ▸ const FLOW_TAG_MAP           L15
│   ▸ default useUrbanStore        L210
└─────────────────────────────────┘
```

- Width 240 px default (resizable 180–360 px); collapsible to 0 with `Ctrl+\\` outline-side.
- Tree of `SymbolNode` with `kind: 'class'|'function'|'method'|'const'|'export'|'import'|'interface'|'type'`.
- Icon per kind, line number right-aligned.
- Inline filter input (`⌕` field) fuzzy-filters symbols.
- Click → cursor jumps + highlight; hover → snippet preview after 250 ms.

#### 4.6.4 Problems Pane (Bottom-panel tab)

```
┌─ Problems ─────────────────────── 3 errors · 2 warnings · 1 info
│ ▼ src/features/urbanAnalytics/store.ts                     (2)
│   ✖ 'open' is declared but never used                  L65 c12
│   ⚠ Implicit any on parameter 'card'                   L71 c18
│ ▼ src/services/data/overpass.ts                            (1)
│   ✖ Cannot find module './geometry' or its types       L8 c20
│ ▼ src/centerpanel/Flows/builders/SuitabilityFlow.tsx       (3)
│   ✖ Property 'criteria' does not exist on type 'Flow…' L120 c8
│   ⚠ React Hook useEffect has missing dependency        L88 c5
│   ℹ Suggest extracting magic number 0.42                L42 c30
└──────────────────────────────────────────────────────────────
```

- Group by file with collapsible sections; expand-all / collapse-all in header.
- Click row → opens tab and jumps to line:column.
- Filters in header: severity (✖ / ⚠ / ℹ), source (TS / Python / QA / lint), text query.
- Counts driven by `problemsStore.severityCounts` and live-update the activity-rail badge.

#### 4.6.5 Diff Pane (`components/editor/DiffPane.tsx`)

```
┌─ Plan preview · runId: pln_1728…  · 4 files changed ─────── ⏷ ✔ Apply  ✘ Reject ─┐
│ ▾ src/features/urbanAnalytics/store.ts            +12 −3   [✔] Accept [✘] Reject │
│   ┌─────────── before ────────────┬─────────── after ────────────┐                │
│   │ … existing code …             │ … existing code …            │                │
│   │ class UrbanStore {            │ class UrbanStore {           │                │
│   │   open() { … }                │   open(opts?: OpenOpts) {    │                │
│   │                               │     this.lastOpened = …      │                │
│   │   }                           │   }                          │                │
│   └───────────────────────────────┴──────────────────────────────┘                │
│ ▸ src/features/urbanAnalytics/types.ts            +6 −0    [✔] Accept [✘] Reject │
│ ▸ src/features/urbanAnalytics/store.test.ts       +18 −0   [✔] Accept [✘] Reject │
│ ▸ src/features/urbanAnalytics/index.ts            +1 −0    [✔] Accept [✘] Reject │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- Built on Monaco's `DiffEditor` (already in bundle).
- Header shows `runId`, file count, and global Apply / Reject. Disabled until at least one per-file decision is "Accept."
- Per-file accept/reject controls; partial application supported.
- Pending plan stored in `planHistoryStore.pending`; applying transitions to `applied`; rejecting transitions to `discarded` and writes a reasoning note.
- Mounts in the editor area when a plan preview is requested via `synapseBus.publish('plan:previewing', …)`. Dismisses on apply/reject or `Escape`.

#### 4.6.6 Plan History Pane (Bottom-panel tab)

```
┌─ Plan History ───────────── filter: [all ▾] model: [all ▾] ⌕ ──┐
│ ▼ pln_1728_a3b2  applied   2026-05-02 14:31  claude-opus-4-7   │
│   files: store.ts, types.ts, store.test.ts, index.ts            │
│   actions: [Reveal in Diff] [Re-open Conversation] [Revert]    │
│ ▾ pln_1727_92f1  reverted  2026-05-02 11:08  gpt-4o            │
│   files: walkScore.ts                                           │
│   actions: [Reveal in Diff] [Re-open Conversation] [Restore]   │
│ ▸ pln_1726_7e44  applied   2026-05-01 23:47  claude-sonnet-4-6 │
└─────────────────────────────────────────────────────────────────┘
```

- Reads from `planHistoryStore.byRunId`.
- Revert dialog warns when downstream plans depend on the one being reverted.

#### 4.6.7 Tasks Pane (Bottom-panel tab)

```
┌─ Tasks ────────── channels: [console][build][python][flow-run][ai] ─┐
│ ▼ build · dev:vite                          status: ● running  4.2s │
│   [13:42:01] starting Vite dev server on :3000                       │
│   [13:42:02] vite v8.0.8 dev server running                          │
│ ▾ ai · pln_1728_a3b2                         status: ✔ applied 1.1s │
│   [14:31:14] reading 4 files                                         │
│   [14:31:15] applied 4 diffs (+37 −12)                               │
│ ▸ flow-run · suitability_2026_05_02         status: ✔ done   72.4s │
└──────────────────────────────────────────────────────────────────────┘
```

- Streamed lines from `task:log` events via `tasksStore.byChannel`.
- Header channel chips toggle visibility; `Ctrl+F` opens find-in-output for the active channel.

#### 4.6.8 Map Bridge & Urban Bridge mini-panes

A click on the activity rail's "Map Bridge" or "Urban Bridge" opens a 280-px-wide pane in the file-explorer column:

```
┌─ Map Bridge ──────────────────────┐    ┌─ Urban Bridge ─────────────────────┐
│ Active map layers (3)             │    │ Active card                        │
│  ◆ districts.geojson  [open file] │    │  Walk Score (id: walk_score)       │
│  ◆ vulnerability_run_42 [revert]  │    │  [open in Modal] [send to editor]  │
│  ◆ heatmap_temp.tif [delete]      │    │ Recommended for current selection: │
│ Selected feature                  │    │  • Pedestrian Network Density      │
│  layer: districts                 │    │  • Population Density              │
│  feature: 38_FATIH                │    │  • Service Coverage Score          │
│  [open referenced file]           │    │ Inserted cards (3)                 │
│  [run flow with this AOI]         │    │  • Gini Coefficient (#a31)         │
└───────────────────────────────────┘    │  • Walkability Composite (#a17)    │
                                          └────────────────────────────────────┘
```

These panes do not duplicate Map or Urban functionality; they project the **slice of cross-module state that's actionable from the IDE**. Both subscribe to `usePanelBridgeStore`.

---

## 5. Track-by-Track Plan

### Track T1 — IDE Shell & Layout

**Goal**: a stable, semantic, token-driven shell that survives module additions for two years.

**Changes**:

1. **Inline-style purge in `Header.tsx`**. Migrate the ~37 `style={{}}` blocks to `components/ide/styles/Header.module.css` and `components/ide/styles/TabBar.module.css`. Every color reference resolves to a CSS variable. Density variants (compact/comfortable/relaxed) become CSS classes instead of arithmetic-on-numbers.
2. **Activity rail.** Add a 44 px fixed left rail (`components/ide/ActivityRail.tsx`) with vertical icon buttons: Explorer, Search, Plan History, Problems, Map Bridge, Urban Bridge, Settings. Each button is a single source of truth for which workspace pane is active; toggling closes the others or opens its dedicated pane. The rail is keyboard-cycle-able (`Ctrl+Alt+1..7`).
3. **Breadcrumb strip.** New `components/ide/Breadcrumb.tsx` mounted above the editor. Renders `/src/features/urbanAnalytics/store.ts › exports › useUrbanStore`, with each segment clickable (folder navigates explorer; symbol opens outline). On split panes, each side has its own breadcrumb.
4. **Bottom panel system.** Convert today's terminal-only bottom area into a tabbed bottom panel: **Terminal · Tasks · Problems · Plan History · Search Results · Output**. Each tab is its own component; resize handle stays the same. Tab order, last-active tab, and height persist in `appStore.layout.bottomPanel`.
5. **Layout snapshots.** Introduce a versioned `LayoutSnapshot` (sidebar widths, AI dock width/height, bottom panel height & tab, font size). Provide `Save Layout As…`, `Restore Layout`, and `Reset Layout` commands. Snapshots persist under `.synapse/layouts/` in the workspace bundle (§T4).
6. **Resizer feedback generalization.** The numeric `Math.round(sidebarPreviewWidth)px` tooltip already implemented at `EnhancedIDE.tsx:836–852` is extracted to a `<ResizeAffordance />` component reused by every drag handle (sidebar, AI dock, bottom panel, AI panel height resizer at line 1364).
7. **Right gutter math.** The current `marginRight` calculation (`EnhancedIDE.tsx:779–782`) is brittle. Replace with a `useWorkspaceMetrics()` hook that returns memoized `{ leftRailWidth, sidebarWidth, editorWidth, aiDockWidth, terminalHeight, headerHeight }`. Every consumer reads from one source.

**Component contracts**:

```ts
// components/ide/ActivityRail.tsx
export interface ActivityRailProps {
  active: ActivityRailItem;
  badges: Partial<Record<ActivityRailItem, number | 'dot'>>;
  onSelect: (item: ActivityRailItem) => void;
}
export type ActivityRailItem =
  | 'explorer' | 'search' | 'planHistory'
  | 'problems' | 'mapBridge' | 'urbanBridge' | 'settings';

// components/ide/Breadcrumb.tsx
export interface BreadcrumbProps {
  tabId: string;
  pathSegments: PathSegment[];
  symbolPath: SymbolNode[];
  onNavigateFolder: (path: string) => void;
  onNavigateSymbol: (symbol: SymbolNode) => void;
}

// components/ide/BottomPanel.tsx
export interface BottomPanelProps {
  activeTab: BottomTab;
  height: number;
  collapsed: boolean;
  onTabChange: (tab: BottomTab) => void;
  onHeightChange: (h: number) => void;
  onToggleCollapsed: () => void;
}
export type BottomTab =
  | 'terminal' | 'tasks' | 'problems'
  | 'planHistory' | 'searchResults' | 'output';

// components/ide/ResizeAffordance.tsx
export interface ResizeAffordanceProps {
  axis: 'x' | 'y';
  onDragStart: (e: React.PointerEvent) => void;
  onDragEnd?: () => void;
  previewValue: number | null;        // shows numeric tooltip if non-null
  unit?: string;                      // 'px' default
  ariaLabel: string;
  ariaValueNow?: number;
}

// hooks/useWorkspaceMetrics.ts
export function useWorkspaceMetrics(): {
  leftRailWidth: number;
  sidebarWidth: number;
  editorWidth: number;
  aiDockWidth: number;
  terminalHeight: number;
  headerHeight: number;
  bottomPanelHeight: number;
};
```

**Files to touch (T1)**:

| Action | Path |
|---|---|
| Modify | `src/components/ide/EnhancedIDE.tsx` |
| Modify | `src/components/ide/Header.tsx` |
| Create | `src/components/ide/ActivityRail.tsx` |
| Create | `src/components/ide/Breadcrumb.tsx` |
| Create | `src/components/ide/BottomPanel.tsx` |
| Create | `src/components/ide/ResizeAffordance.tsx` |
| Create | `src/components/ide/styles/Header.module.css` |
| Create | `src/components/ide/styles/TabBar.module.css` |
| Create | `src/components/ide/styles/ActivityRail.module.css` |
| Create | `src/components/ide/styles/Breadcrumb.module.css` |
| Create | `src/components/ide/styles/BottomPanel.module.css` |
| Create | `src/hooks/useWorkspaceMetrics.ts` |
| Modify | `src/stores/appStore.ts` (v2 → v3 migration; bottom-panel and snapshots) |

**Acceptance**:
- Zero hard-coded hex values in `Header.tsx` and `EnhancedIDE.tsx` (CI grep gate).
- `npm run test:e2e:smoke` passes with new bottom panel.
- Layout reload across F5 restores last-used snapshot byte-identically.
- `npm run perf:budgets` shows no chunk regression > 5 %.

---

### Track T2 — Editor Surface

**Goal**: a Monaco surface that is intelligible to non-coders, scientifically rigorous for power users, and aware of urban-analytics file types.

**Changes**:

1. **Symbol Outline pane.** New `components/editor/OutlinePane.tsx`. Uses Monaco's symbol provider where present, falls back to a regex-based extractor for Python (`def`, `class`) and JavaScript/TypeScript (`function`, `class`, top-level `const/let/var`, exported symbols). Connects to the **`symbols`** mode in CommandPalette (currently dead). Opens to active editor's symbols and filters with the palette query.
2. **Problems pane.** Bottom-panel tab. Sources:
   - Monaco model markers (`monaco.editor.getModelMarkers`).
   - A typed `problemsStore` populated by:
     - The new `languageService` (lightweight TS/Python diagnostics — see point 5).
     - `task:status` events when a task fails (compile/lint).
     - Apply-plan validation errors.
   - QA flags from analysis-result files (e.g., a `.geojson` with `metadata.scientificQA.status === 'warning'`).
3. **GeoJSON & spatial-data preview mode.** When the active tab's path matches `.geojson|.shp|.gpkg|.csv|.parquet|.tif|.tiff`, the editor toolbar (`EditorPreviewToolbar.tsx`) gains a **Preview on Map** action. It publishes a `synapseBus` `map:registerLayer` event with metadata matching the existing `OverlayLayerConfig` shape from `centerpanel/components/map/mapTypes.ts:204-218`:
   ```ts
   const config: OverlayLayerConfig = {
     id: `ide-preview-${fileId}`,
     name: file.name,
     type: 'geojson',
     visible: true,
     opacity: 0.92,
     sourceData: parsedFeatureCollection,
     queryable: true,
     sourceKind: 'project',
     group: 'data',
     metadata: {
       featureCount,
       geometryType,
       bounds,
       fields,
       datasetContext: {
         datasetId: file.path,
         source: 'IDE preview',
         updateDate: file.lastModified
       }
     },
     provenance: {
       label: 'IDE preview',
       sourceName: file.path,
       method: 'visual',
       collectedAt: new Date().toISOString()
     }
   };
   publish({ kind: 'map:registerLayer', envelope: { payload: config, source: 'ide', timestamp: nowIso() } });
   ```
   The Map Explorer plan defines the receiver. This plan ships only the *publisher* and the toolbar affordance.
4. **Diff Pane.** New `components/editor/DiffPane.tsx` using Monaco's `DiffEditor`. Surfaces appear in two contexts:
   - **Apply-plan preview**: before `executeApplyPlan` mutates files, Diff Pane renders side-by-side diffs per file with a per-file Accept/Reject and a top-level Accept All / Reject All. Replaces the implicit "trust the assistant" flow.
   - **Tab-vs-disk diff**: visualizes what changes from the last saved version; usable as a manual review surface.
5. **Lightweight language service.** New `services/language/` with two providers:
   - **TypeScript/JS**: thin wrapper around Monaco's built-in TypeScript worker (already in the bundle).
   - **Python**: a worker-side, regex+Tree-sitter-WASM analyzer (no real LSP). Catches obvious issues — undefined names, unbalanced brackets, unused imports, missing `from X import Y`. Outputs typed `Diagnostic` objects into `problemsStore`.
   - Emits markers into Monaco models so the gutter shows red/yellow squiggles consistent with the problems pane.
6. **Editor split.** The existing localStorage `synapse.editor.split` (50/50 default) becomes a typed config under `appStore.layout.editorSplit`. Add a "Split Right" command and a vertical splitter affordance in the breadcrumb strip.
7. **Inline AI affordances.** The three existing commands (`ai.improveSelection|explainSelection|addBeginnerComments`) get visible UI: a small editor-action menu (Monaco's `editor.addAction`) and a context-menu group **Synapse AI**. Every action shows a Diff Pane preview before applying.

**Component contracts**:

```ts
// components/editor/OutlinePane.tsx
export interface OutlinePaneProps {
  tabId: string;
  symbols: SymbolNode[];
  filter: string;
  onJumpToSymbol: (symbol: SymbolNode) => void;
  onFilterChange: (q: string) => void;
}
export interface SymbolNode {
  id: string;
  name: string;
  kind: SymbolKind;
  range: { startLine: number; startColumn: number; endLine: number; endColumn: number };
  children?: SymbolNode[];
  detail?: string;       // for tooltip: signature snippet
}
export type SymbolKind =
  | 'class' | 'function' | 'method' | 'property' | 'const' | 'let' | 'var'
  | 'interface' | 'type' | 'enum' | 'export' | 'import' | 'namespace';

// components/editor/DiffPane.tsx
export interface DiffPaneProps {
  pendingPlan: PendingPlan;
  onAcceptFile: (path: string) => void;
  onRejectFile: (path: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClose: () => void;
}

// services/language/types.ts
export interface Diagnostic {
  id: string;             // stable per (path, line, message)
  path: string;
  range: Range;
  severity: 'error' | 'warning' | 'info' | 'hint';
  source: 'ts' | 'python' | 'qa' | 'plan' | 'lint';
  message: string;
  code?: string | number;
  relatedInformation?: Array<{ path: string; range: Range; message: string }>;
}
```

**Files to touch (T2)**:

| Action | Path |
|---|---|
| Modify | `src/components/editor/MonacoEditor.tsx` |
| Modify | `src/components/editor/EditorPreviewToolbar.tsx` |
| Create | `src/components/editor/OutlinePane.tsx` |
| Create | `src/components/editor/ProblemsPane.tsx` |
| Create | `src/components/editor/DiffPane.tsx` |
| Create | `src/services/language/index.ts` |
| Create | `src/services/language/typescriptProvider.ts` |
| Create | `src/services/language/pythonProvider.ts` |
| Create | `src/services/language/types.ts` |
| Create | `src/workers/pythonAnalyzer.worker.ts` |
| Create | `src/stores/problemsStore.ts` |
| Create | `src/stores/outlineStore.ts` |
| Modify | `src/components/ide/CommandPalette.tsx` (activate `symbols` mode) |

**Acceptance**:
- Open a `.geojson` file in the IDE, click **Preview on Map**, observe the corresponding `synapseBus` event payload (verified in a unit test; the Map Explorer plan owns the visual landing).
- Apply an AI plan: Diff Pane appears with file list, accepts/rejects work per-file, plan is stored in `planHistoryStore`.
- A Python file with an undefined symbol shows a marker; Problems pane lists it; double-click jumps to source.
- Outline pane updates within 250 ms of stopping typing.

---

### Track T3 — Terminal & Tasks

**Goal**: turn the simulated terminal into an honest, scoped, multi-channel observability surface — without pretending to be a real shell.

**Changes**:

1. **Honest framing.** The header strip explicitly labels the terminal **"Synapse Console (workspace log + simulated shell)"**. Reasoning: shipping a fake `npm install` that writes nothing is misleading. We keep the simulated commands as **demo helpers** (visibly tagged `[demo]`) and add real channels.
2. **Tabs/channels.** Move the existing log multiplexing from `terminalLogBus` into a typed `tasksStore`. Channels:
   - `console` — interactive simulated shell (current behavior, demo-tagged).
   - `build` — receives `task:status` events from the build/run subsystem.
   - `python` — receives output from Python execution surfaces (Pyodide / Jupyter bridge if/when added; today, scaffolded as empty pane with a clear "no Python runtime connected" empty state).
   - `flow-run` — receives output from analytical flow executions (engine bridge).
   - `ai` — receives a structured stream of AI plan applications (which file, which range, runId). Crucial for auditability.
3. **Search-in-output.** `Ctrl+F` while focused in the console opens an inline find with regex toggle, scoped to the active channel.
4. **Persistent transcripts.** Per-channel transcripts persist in `.synapse/console/<channel>.log` (§T4). Cleared via explicit "Clear" button only. Cap: 4 MB per channel; rotated to `<channel>.log.1`.
5. **Run/Build button wiring.** The Header's Run/Build dropdown (`Header.tsx:756–793`) currently calls `triggerTask('run'|'build')` whose receiver is undefined. The plan introduces `services/tasks/` with a registry: `registerTask({ id, label, exec, channel })`. `exec` is a function returning an `AsyncIterable<TaskEvent>`. Out of the box we register:
   - `dev:vite` → spawns a `console.info` placeholder until a real backend exists, but emits realistic `task:status` events so the bottom-panel **Tasks** tab and the Run button show running/idle states.
   - `build:vite` → same shape.
   - `lint` → wraps `eslint --quiet` output via a future Node-side adapter; for now, a clearly-labeled `[no runtime]` stub.
6. **Status badges.** Run button gains a badge dot: green idle, gold running, red failed. Wired to the `tasksStore.activeRuns` selector.
7. **Resizer & UX polish.** Reuse `<ResizeAffordance />` from T1. Header chevron toggles the bottom panel collapsed state without losing tab selection.

**Component contracts**:

```ts
// services/tasks/types.ts
export type ChannelId = 'console' | 'build' | 'python' | 'flow-run' | 'ai';

export interface TaskRun {
  id: string;
  taskId: string;
  channel: ChannelId;
  startedAt: string;
  endedAt?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  exitCode?: number;
  source: 'ide-button' | 'palette' | 'ai' | 'flow';
}

export interface TaskRunRequest {
  taskId: string;
  args?: Record<string, unknown>;
}

export type TaskEvent =
  | { kind: 'started';  run: TaskRun }
  | { kind: 'log';      run: TaskRun; level: 'info'|'warn'|'error'; line: string; channel: ChannelId }
  | { kind: 'progress'; run: TaskRun; percent: number; note?: string }
  | { kind: 'finished'; run: TaskRun };

export interface TaskDefinition {
  id: string;
  label: string;
  channel: ChannelId;
  exec: (req: TaskRunRequest) => AsyncIterable<TaskEvent>;
}

export function registerTask(def: TaskDefinition): () => void;  // returns unregister
export function listTasks(): TaskDefinition[];
export function runTask(req: TaskRunRequest): Promise<TaskRun>;
```

**Files to touch (T3)**:

| Action | Path |
|---|---|
| Modify | `src/components/terminal/components/Terminal.tsx` |
| Modify | `src/components/terminal/terminalLogBus.ts` (compatibility shim) |
| Modify | `src/services/tasksBridge.ts` (delegate to new `services/tasks/`) |
| Create | `src/services/tasks/registry.ts` |
| Create | `src/services/tasks/runtime.ts` |
| Create | `src/services/tasks/builtins/devVite.ts` |
| Create | `src/services/tasks/builtins/buildVite.ts` |
| Create | `src/services/tasks/builtins/lint.ts` |
| Create | `src/services/tasks/types.ts` |
| Create | `src/stores/tasksStore.ts` |
| Create | `src/components/editor/ProblemsPane.tsx` (T2 also touches; shared file) |
| Create | `src/components/ide/TasksPane.tsx` |

**Acceptance**:
- Click Run in header → console shows `[task:dev:vite] starting`, `tasksStore.activeRuns` contains the run, header badge turns gold, then idle.
- Switch channel to `flow-run` → empty state explains "Flow runs from the Map Explorer or Urban Analytics flows will appear here. The Map Explorer plan registers the producer side."
- Demo-tagged simulated commands continue to work, but `[demo]` chip clarifies their nature.

---

### Track T4 — File Explorer & File System

**Goal**: a GIS-aware, virtualizable, undo-safe file tree backed by a versioned project bundle.

**Changes**:

1. **GIS-aware icons.** Extend `FileIcon.tsx` with explicit handling for `.geojson`, `.shp`, `.gpkg`, `.tif/.tiff`, `.parquet`, `.csv`, `.dbf`, `.prj`, `.kml`, `.wkt`. Each icon carries a tag color (vector / raster / tabular / project metadata).
2. **QA badges.** When a file's metadata or a sidecar `.synapse/qa/<path>.json` indicates a `LayerQaStatus` ≠ `passed`, a discrete badge (small dot, color from `--syn-warning|--syn-danger`) renders on the file row. Hover reveals reason from `LayerScientificQABadge` enum: `invalid_geometry`, `missing_crs`, `sample_data`, `stale_result`, `uncertain_output`.
3. **Virtualization.** Use `react-window`'s `FixedSizeList` for trees with > 200 visible rows. Below the threshold, render natively to avoid micro-jank on small projects.
4. **Context menu (`ContextMenu.tsx`) extensions** — only for relevant file types:
   - **Open**, **Open to Side**, **Rename**, **Duplicate**, **Delete** (with undo via §16).
   - **Preview on Map** — publishes `synapseBus` `map:registerLayer` and `map:flyTo` to bounds.
   - **Send to Urban Analytics** — opens the Urban Analytics Modal scoped to a contextual card recommendation derived from the file's metadata (publishes `urban:openCard` if the file's metadata includes a known indicator id).
   - **Use as Flow input** — opens the Flow tab with the file pre-bound to the appropriate input slot.
   - **Reveal in Plan History** — if the file was created/modified by an applied AI plan, jumps to that plan's entry.
5. **Drop targets.** `application/x-synapse-file` drag MIME is published when dragging a file from the explorer. The Map Explorer plan defines the corresponding drop receiver. The IDE plan defines the publisher and a small ghost preview tile.
6. **`FileSystemAdapter`.** A clean interface in `services/fs/index.ts` that abstracts where files live: today, the in-memory `fileExplorerStore` tree; tomorrow, an OPFS-backed adapter (Origin Private File System) for true persistence between sessions; eventually, a remote adapter. Every existing call to `useFileExplorerStore.getState().addFile/updateFile/...` is funneled through the adapter.
7. **Workspace bundle.** Define a versioned project bundle layout under `.synapse/`:
   - `.synapse/workspace.json` — version, metadata, layout snapshot ref.
   - `.synapse/layouts/*.json` — saved layouts.
   - `.synapse/plans/*.json` — applied AI plan ledger (§T6).
   - `.synapse/console/*.log` — per-channel transcripts.
   - `.synapse/qa/<path>.json` — per-file scientific QA sidecars (matches Map Explorer's QA model).
   - `.synapse/index.bin` — search-indexer cache.
8. **File-status badges in tabs.** The tab bar (Header) displays the same QA badge inline; dirty (gold dot, already present), conflict (yellow), unsaved-and-conflict (gold + yellow stripe).

**Component contracts**:

```ts
// services/fs/types.ts
export interface FileSystemAdapter {
  list(dir: string): Promise<FsEntry[]>;
  read(path: string): Promise<{ content: string; encoding: string }>;
  write(path: string, content: string, opts?: { encoding?: string; createOnly?: boolean }): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  remove(path: string, opts?: { recursive?: boolean }): Promise<void>;
  exists(path: string): Promise<boolean>;
  watch(globOrPath: string, cb: (event: FsChange) => void): () => void;
  metadata(path: string): Promise<FsMetadata>;
  readQa(path: string): Promise<LayerScientificQAMetadata | null>;
  writeQa(path: string, qa: LayerScientificQAMetadata): Promise<void>;
}

export interface FsChange {
  kind: 'added' | 'changed' | 'removed' | 'renamed';
  path: string;
  oldPath?: string;
}

export interface FsMetadata {
  size: number;
  mtime: string;
  encoding?: string;
  language?: string;
  qaStatus?: LayerQaStatus;
  qaBadges?: LayerScientificQABadge[];
  createdByPlanRunId?: string;
}
```

**Workspace bundle schema** (`docs/architecture/synapse-workspace-bundle.md`):

```jsonc
// .synapse/workspace.json
{
  "version": 1,
  "createdAt": "2026-05-02T13:42:01.000Z",
  "synapseVersion": "1.0.0",
  "activeLayoutId": "default",
  "metadata": {
    "name": "Istanbul Walkability Study",
    "description": "Multi-criteria pedestrian accessibility audit",
    "license": "CC-BY-4.0",
    "authors": ["mustafarasit"]
  }
}
```

```jsonc
// .synapse/plans/pln_1728_a3b2.json (matches AppliedPlan)
{
  "runId": "pln_1728_a3b2",
  "sourceMessageId": "msg_…",
  "sourceConversationId": "conv_…",
  "model": "claude-opus-4-7",
  "mode": "pro",
  "timestamp": "2026-05-02T14:31:14.000Z",
  "workspaceFingerprint": "sha256:…",
  "diffs": [
    { "path": "src/features/urbanAnalytics/store.ts", "before": "…", "after": "…", "changeKind": "modify" }
  ],
  "undoSnapshots": [
    { "path": "src/features/urbanAnalytics/store.ts", "prevContent": "…", "prevCursor": { "line": 65, "column": 1 } }
  ],
  "status": "applied",
  "dependents": []
}
```

**Files to touch (T4)**:

| Action | Path |
|---|---|
| Modify | `src/components/file-explorer/FileExplorer.tsx` |
| Modify | `src/components/file-explorer/FileIcon.tsx` |
| Modify | `src/components/file-explorer/ContextMenu.tsx` |
| Modify | `src/components/file-explorer/pro/HeaderPro.tsx` |
| Create | `src/services/fs/index.ts` |
| Create | `src/services/fs/types.ts` |
| Create | `src/services/fs/InMemoryAdapter.ts` |
| Create | `src/services/fs/OPFSAdapter.ts` (stub w/ README) |
| Create | `src/services/fs/SynapseBundle.ts` (.synapse/ I/O) |
| Modify | `src/stores/fileExplorerStore.ts` (route through adapter) |
| Create | `docs/architecture/synapse-workspace-bundle.md` |

**Acceptance**:
- Dragging `data/districts.geojson` to the Map Explorer area registers it as a layer (publisher tested in unit; receiver in Map Explorer plan).
- Right-clicking a `.geojson` shows **Preview on Map**, **Send to Urban Analytics**, and **Use as Flow input**; each publishes the correct typed event.
- A 1,000-file tree scrolls at 60 fps under React Profiler.
- Reload the IDE: `.synapse/workspace.json` reads cleanly; layout & open tabs restore.

---

### Track T5 — Search & Navigation

**Goal**: one keystroke, four destinations.

**Changes**:

1. **Unified palette modes**. `CommandPalette` becomes the single entry point. Modes (with prefix shortcuts):
   - `> ` Commands (default).
   - `@ ` Symbols (active editor).
   - `# ` Workspace symbols (all open + indexed files).
   - `: ` Go to line:column.
   - `? ` Help / shortcuts.
   - blank Files (default file-finder behavior).
2. **Indexer.** New `services/search/indexer.ts` runs in a Web Worker (extends existing `workers/`). It indexes:
   - File names and paths.
   - First N kilobytes of each text file (content search).
   - Symbols (from §T2's outline extractor).
   - Registered commands.
   - **Urban Analytics card titles & summaries** — so typing in the IDE palette can surface `Urban: Walk Score`, etc., and selecting it publishes `urban:openCard`.
   - **Map Explorer bookmarks & saved AOIs** — selecting publishes `map:flyTo` or restores a bookmark.
3. **Weighted scoring.** The current fuzzy scorer is replaced with a small weighted composite: `0.5 * fuzzy(query, name) + 0.3 * fuzzy(query, path) + 0.15 * recency + 0.05 * pinned`. Recency uses a per-item LRU; pinned items are user-toggled.
4. **Search history.** Persist last 50 queries; render them as suggestions when the input is empty.
5. **Scoped find/replace.** `GlobalSearch` becomes Find & Replace with regex toggle, case toggle, whole-word toggle, scope selector (workspace / open editors / current folder), and a results pane mounted in the bottom panel as a new tab **Search Results**. Replace operations route through the same Diff Pane (T2.4) and `planHistoryStore` (T6) for undo.

**Component contracts**:

```ts
// services/search/types.ts
export type IndexableKind = 'file' | 'symbol' | 'tab' | 'command' | 'urban-card' | 'map-bookmark';

export interface Indexable {
  kind: IndexableKind;
  id: string;
  label: string;
  detail?: string;
  path?: string;       // for files / symbols
  range?: Range;       // for symbols
  cardId?: string;     // for urban-card
  bookmarkId?: string; // for map-bookmark
  tags?: string[];
  pinned?: boolean;
  recencyTs?: number;
}

export interface SearchResult {
  item: Indexable;
  score: number;
  highlight: Array<{ field: 'label' | 'detail' | 'path'; ranges: Array<[number, number]> }>;
}

export function indexAll(items: Indexable[]): Promise<void>;
export function query(q: string, opts?: { kinds?: IndexableKind[]; limit?: number }): Promise<SearchResult[]>;
```

**Files to touch (T5)**:

| Action | Path |
|---|---|
| Modify | `src/components/ide/CommandPalette.tsx` |
| Modify | `src/components/ide/GlobalSearch.tsx` |
| Modify | `src/services/commandRegistry.ts` (weighted scoring) |
| Create | `src/services/search/indexer.ts` |
| Create | `src/services/search/types.ts` |
| Create | `src/workers/searchIndex.worker.ts` |
| Create | `src/stores/searchIndexStore.ts` |
| Create | `src/components/ide/SearchResultsPane.tsx` |

**Acceptance**:
- `Ctrl+P`, type `walk` → Urban Analytics card "Walk Score" appears in the palette; pressing Enter publishes `urban:openCard`.
- `Ctrl+Shift+F`, regex on, type `^def\s+\w+_index`, scope = workspace → all matching Python definitions appear; Replace All flows through Diff Pane and is undoable from Plan History.

---

### Track T6 — AI & Apply Pipeline

**Goal**: every AI mutation is **previewable, attributable, undoable, and auditable**.

**Changes**:

1. **Diff-first apply.** `executeApplyPlan` is wrapped by a new `previewApplyPlan(plan)` that opens the Diff Pane (T2.4) and stages the plan in a pending state. Apply commits; Cancel discards. The current **`ai.plan.applyLast`** command becomes **Preview Last Plan**, with a subordinate "Apply Pending Plan" command behind it.
2. **Plan history ledger.** New `planHistoryStore` and `.synapse/plans/<runId>.json` files record `AppliedPlan` (see schema below). Bottom-panel **Plan History** tab lists these chronologically with filters (by model, by file). Each entry has Reveal in Diff, Re-Open Conversation, and Revert.
3. **Per-file undo across plans.** Today, undo is per-tab via the editor history. Plan-level undo iterates `undoSnapshots` in reverse, restores file contents, and re-emits markers/state. Reverting a plan publishes `plan:reverted` so any cross-module consumer (e.g., a registered map layer derived from a plan-created file) reacts correctly.
4. **Project-brief surface.** The hidden command `ai.refreshProjectBrief` (already wired) gains a small **AI Brief** panel inside the AI dock with last-refreshed timestamp, file scope summary, and a manual refresh button. This is the only place the user sees what context the AI has pinned.
5. **Provenance in tabs and explorer.** A tab opened from an applied plan shows a tiny `AI` chip; hovering shows runId and timestamp. Files created by a plan show the same chip in the explorer row.
6. **Guardrails surface.** When the existing redaction layer (`services/ai/guardrails/redact.ts`) flags a prompt, the AI dock now renders a non-blocking warning bar with the count and category of redactions, and a "View redacted" toggle. No silent rewrites.

**`AppliedPlan` schema**:

```ts
export interface AppliedPlan {
  runId: string;                           // 'pln_<unix>_<rand>'
  sourceMessageId: string;
  sourceConversationId: string;
  mode: 'beginner' | 'pro';
  model: string;                           // e.g. 'claude-opus-4-7'
  promptTokens?: number;
  completionTokens?: number;
  timestamp: string;                       // ISO 8601
  workspaceFingerprint: string;            // sha256 of file list at apply time
  diffs: PlanDiff[];
  undoSnapshots: UndoSnapshot[];
  status: 'pending' | 'applied' | 'reverted' | 'partially-reverted' | 'discarded';
  dependents: string[];                    // runIds of later plans that touched same files
  reverters?: string[];                    // runIds of plans that reverted this one
  notes?: string;                          // user-editable post-hoc note
}

export interface PlanDiff {
  path: string;
  before: string;
  after: string;
  changeKind: 'create' | 'modify' | 'delete' | 'rename';
  language?: string;
  accepted: boolean;                       // for partial-application
}

export interface UndoSnapshot {
  path: string;
  prevContent: string;
  prevCursor?: { line: number; column: number };
  prevSelections?: Array<{ start: Position; end: Position }>;
}
```

**Files to touch (T6)**:

| Action | Path |
|---|---|
| Modify | `src/utils/ai/apply/buildApplyPlan.ts` |
| Modify | `src/utils/ai/apply/executeApplyPlan.ts` |
| Create | `src/utils/ai/apply/previewApplyPlan.ts` |
| Modify | `src/components/ide/EnhancedIDE.tsx` (preview-first wiring) |
| Modify | `src/components/ai/panel/SynapseCoreAIPanel.tsx` |
| Create | `src/components/ai/AiBriefPanel.tsx` |
| Create | `src/components/ai/PlanHistoryPane.tsx` |
| Create | `src/stores/planHistoryStore.ts` |
| Create | `docs/architecture/applied-plan-schema.md` |

**Acceptance**:
- Apply an AI plan: Diff Pane previews it, Apply commits, Plan History shows the entry with file list, model, timestamp, and Revert action; Revert restores files byte-identically.
- Triggering `ai.refreshProjectBrief` from the AI Brief panel updates the timestamp without touching files.

---

### Track T7 — Cross-Module Sync

**Goal**: the IDE participates as an equal peer in a tri-modal workspace, synchronized through a single typed bus and three small store-to-store subscriptions.

**Changes**:

1. **`synapseBus`** (already specified in §3.3).
2. **IDE-as-publisher** events (this plan ships):
   - `editor:openTab`, `editor:fileSaved`, `editor:insertAtCursor`, `editor:replaceActive`, `editor:selectionChanged`.
   - `fs:fileChanged`, `fs:fileDeleted`, `fs:fileRenamed`.
   - `map:registerLayer` (from Preview on Map).
   - `map:flyTo` (from "Reveal AOI of this file" if metadata.bounds present).
   - `map:selectFeature` (from in-editor GeoJSON feature picker; future).
   - `urban:openCard`, `urban:applyCard` (from explorer context menu and palette).
   - `task:run`, `task:status`, `task:log`.
   - `plan:previewing`, `plan:applied`, `plan:reverted`.
3. **IDE-as-subscriber** events (this plan ships, the other plans complete):
   - `map:selectFeature` → IDE highlights any open file whose metadata references the feature; if a `.geojson` file matches, the editor scrolls to the feature in the JSON view.
   - `urban:openCard` (when the source is the Map Explorer) → if the card has an associated code snippet (Python/SQL), the IDE opens it in a non-active, dismissable tab in a "Snippets" group.
   - `map:layerRegistry:change` → the file explorer marks the corresponding source file (when traceable via `metadata.datasetContext.datasetId`) with a small "in-map" badge.
4. **Extend `usePanelBridgeStore`.** Today it tracks `activeTab`, `activeFlowId`, `activeReportSlot`, and `contextTags`. Add:
   - `activeMapLayerId: string | null`
   - `selectedMapFeatureRefs: Array<{ layerId: string; featureId: string }>`
   - `activeUrbanCardId: string | null`
   - `lastIdeTabPath: string | null`
   These four fields are populated by IDE/Map/Urban subscribers in their own modules and read by all three when computing context tags. The IDE uses them to drive the activity-rail badges (e.g., "Map Bridge" badge shows the count of selected features).
5. **Workspace-level command palette commands**:
   - `map.registerActiveTabAsLayer` — for `.geojson` tabs.
   - `map.flyToActiveTabBounds` — if the active tab's metadata has bounds.
   - `urban.suggestCardsForActiveTab` — calls into Panel Bridge's tag computation.
   - `workbench.synchronizeAll` — emits a `workbench:snapshotRequest` so the other modules rebroadcast their state (used after a hard reload while other modules' subscribers attach).

**Files to touch (T7)**:

| Action | Path |
|---|---|
| Create | `src/services/synapseBus/index.ts` |
| Create | `src/services/synapseBus/types.ts` |
| Create | `src/services/synapseBus/legacyAdapter.ts` |
| Modify | `src/stores/usePanelBridgeStore.ts` |
| Modify | `src/components/ide/EnhancedIDE.tsx` (subscribers) |
| Create | `src/components/ide/MapBridgePane.tsx` |
| Create | `src/components/ide/UrbanBridgePane.tsx` |
| Create | `docs/architecture/synapse-bus.md` |

**Acceptance**:
- Right-click a `.geojson` in the IDE → **Preview on Map** → Map Explorer registers the layer (Map Explorer plan supplies receiver) → IDE explorer row shows "in-map" badge within 100 ms.
- Click a feature in the Map Explorer (Map Explorer plan) → IDE highlights the open `.geojson` tab and scrolls to the feature; Panel Bridge's `selectedMapFeatureRefs` reflects the selection; the Urban Analytics Modal can now read it (Urban Analytics plan).
- Disabling all three other modules does not break the IDE — the bus has no required subscribers.

---

## 6. The Three-Module Synchronization Contract

This section defines the **shared contract** that the next two plans must inherit verbatim. It is repeated in each plan as a single source of truth.

### 6.1 The single-bus principle

All cross-module communication uses `synapseBus`. Direct cross-module store imports are restricted to **read-only** access (e.g., the IDE may *read* `useMapExplorerStore.getState().selectedFeatureIds`, but must not *write* to it). Writes happen via `synapseBus.publish(...)`, and the owning store subscribes.

### 6.2 The shared identifier vocabulary

Five identifiers are coined here and must be honored by every module:

| Identifier | Type | Meaning | Producer | Consumers |
|---|---|---|---|---|
| `runId` | `string` (`'pln_…'` for plans, `'flow_…'` for flow runs) | Unique id of an apply-plan or analytical-flow execution | IDE (apply-plan), Urban Analytics (flow run) | All three |
| `layerId` | `string` | Stable id of a Map Explorer overlay layer | Map Explorer | All three |
| `cardId` | `string` (e.g. `'walk_score'`) | Stable id of an Urban Analytics methodology card | Urban Analytics seed library | All three |
| `featureRef` | `{ layerId: string; featureId: string }` | A selected feature on the map | Map Explorer | IDE, Urban Analytics |
| `datasetId` | `string` (path or URI) | Canonical id of a source dataset | IDE (file path) or external | All three |

### 6.3 Provenance triplet

Every artifact crossing module boundaries carries:

```ts
interface Provenance {
  source: 'ide' | 'map' | 'urban' | 'flow' | 'engine';
  runId?: string;
  timestamp: string;        // ISO 8601
  actor?: string;           // 'user' | 'ai' | model id
}
```

The Map Explorer's existing `provenance` and `metadata.datasetContext` already match this contract; the IDE plan introduces it for plans (`AppliedPlan`); the Urban Analytics plan applies it to applied indicator cards.

### 6.4 Selection sync rules

- A Map Explorer feature selection updates `usePanelBridgeStore.selectedMapFeatureRefs` and emits `map:selectFeature`.
- The IDE highlights the tab matching `metadata.datasetContext.datasetId === selectedRef.layerSourcePath`.
- The Urban Analytics Modal computes context tags from the selected feature's properties and surfaces matching cards in the right panel.
- Closing the selection in any module emits `map:selectFeature` with `payload: null`.

### 6.5 Layer registration rules

- Anyone publishing `map:registerLayer` must include `provenance` and either `sourceData` (inline) or a resolvable `sourceData` reference.
- The Map Explorer is the registration authority; it is the only owner of `useMapExplorerStore.overlayLayers`.
- The IDE never writes to `overlayLayers` directly. It publishes events; the Map Explorer adds (or refuses).

### 6.6 Event ordering & idempotency

- Each event has a `timestamp`. Subscribers must tolerate out-of-order delivery: identical `runId`+`kind` pairs must be idempotent.
- `plan:applied` must arrive after all `plan:previewing` events for the same `runId`. Subscribers ignore `plan:applied` if no prior `plan:previewing` was seen, unless a `workbench:snapshotReply` re-establishes context.
- `map:registerLayer` is idempotent on `layerId`: a second registration with the same `layerId` is a *replace*, not an *add*.

### 6.7 Backward-compatible adapter

For one release cycle after this plan ships, the legacy `synapse:chat:insert`, `synapse:editor:insert`, and `synapse-map-layer-registry-change` events continue to work via `legacyAdapter.ts`. After that release, an ESLint rule (`no-legacy-synapse-events`) bans direct dispatch outside the adapter file.

---

## 7. Theming Plan

### 7.1 Token consolidation

We currently have three overlapping token sources:

1. `src/ui/theme/synapseTheme.ts` (TS constants, used by inline-style code).
2. `src/ui/theme/semanticTokens.ts` (TS semantic layer over the constants).
3. `src/ui/theme/ideProScope.css` (CSS variables on `.theme-ide-pro` and `.synapse-ide-scope`).

The plan **does not delete any of these**. Instead, it formalizes:

- `synapseTheme.ts` → primitive token source (color hexes, typography stack, spacing constants).
- `semanticTokens.ts` → role-mapped tokens (e.g., `SEMANTIC_COLORS.bg.surface`). All new TS code reads from here.
- `ideProScope.css` → CSS-variable export of `semanticTokens` for runtime use in CSS modules and inline `var(--…)` references. A small TS-driven generator (`scripts/generate-ide-css-vars.ts`) keeps the CSS file in sync and adds a CI check.

### 7.2 Light / neutral / dark parity

`monacoTheme.ts` defines three Monaco themes. The IDE shell currently renders dark-on-black regardless of the global `theme` value in `appStore`. The plan adds:
- A neutral and light mode for the IDE shell driven by `appStore.theme`. Surfaces remap via CSS variables; no component changes needed.
- A theme toggle in the activity rail (T1) and a command-palette command `view.toggleTheme`.

### 7.3 Density modes

- Compact / Comfortable / Relaxed already exist in `Header.tsx` (localStorage-persisted). The plan moves them into `appStore.layout.density` and rewires every panel (Explorer, Tabs, Bottom Panel, AI dock) to honor them through CSS variables (`--ui-row-h`, `--ui-tab-h`, `--ui-pad-x`).

### 7.4 Reduced motion & high contrast

- `transition()` already respects `prefers-reduced-motion`. The plan extends to **all** new animations and adds a CSS rule under `.synapse-ide-scope` that disables all background gradients and pulse animations under `prefers-reduced-motion`.
- A high-contrast fallback (`.theme-ide-hc`) raises borders to 2 px and removes glass blurs. Triggered by `prefers-contrast: more` automatically.

### 7.5 The gold bar discipline

The 2 px gold gradient bar (`[data-global-gold-bar]`, lines 706–708 of `EnhancedIDE.tsx`) is the **only** decorative chrome of the IDE. It stays.

---

## 8. State, Persistence & Data Contracts

### 8.1 Store extensions

| Store | Additions |
|---|---|
| `appStore` | `layout.bottomPanel { tab, height, collapsed }`, `layout.density`, `layout.editorSplit`, `layoutSnapshots[]`, `activeLayoutSnapshotId`. Migration v2→v3. |
| `editorStore` | `tab.provenance?: Provenance`, `tab.qa?: { status, issues[] }`, `tab.previewBoundLayerId?: string`. |
| `fileExplorerStore` | `node.qa?`, `node.provenance?`, `node.previewBoundLayerId?`. |
| `usePanelBridgeStore` | `activeMapLayerId`, `selectedMapFeatureRefs`, `activeUrbanCardId`, `lastIdeTabPath` (see §5/T7). |
| **new** `problemsStore` | `byPath: Map<string, Diagnostic[]>`, `severityCounts`. |
| **new** `outlineStore` | `byTabId: Map<string, SymbolNode[]>`. |
| **new** `tasksStore` | `byChannel: Map<ChannelId, TaskRun[]>`, `activeRuns`. |
| **new** `planHistoryStore` | `byRunId: Map<string, AppliedPlan>`, `recentRunIds[]`, `pending: PendingPlan \| null`. |
| **new** `searchIndexStore` | `recentQueries[]`, `pinned: Set<string>`. |

### 8.2 Persistence keys

| Key | Owner | Scope |
|---|---|---|
| `enhanced-ide-app-state` (v3) | `appStore` | Layout, theme, density, snapshots metadata |
| `enhanced-ide-editor-state` | `editorStore` | Tabs (minus content where large), history (capped) |
| `enhanced-ide-file-explorer-state` | `fileExplorerStore` | Tree, expanded folders |
| `synapse-map-explorer-state` (existing) | `useMapExplorerStore` | Viewport, base, pins, bookmarks, annotations |
| `urban.nav.*` (existing) | `useUrbanStore` | Section, query, favorites |
| `.synapse/` files | Workspace bundle | Layouts, plans, console logs, QA sidecars |

### 8.3 Migration discipline

Every store with a `version` field gets an explicit migration path. A `migrations/` test ensures v2 → v3 of `appStore` survives a roundtrip with realistic seed data.

### 8.4 Workspace fingerprint

Used to detect drift between when a plan was generated and when it is applied:

```ts
function fingerprintWorkspace(files: FileNode[]): string {
  const sorted = files
    .filter(f => f.type === 'file')
    .map(f => `${f.path}\t${f.size}\t${f.lastModified.toISOString()}`)
    .sort()
    .join('\n');
  return 'sha256:' + sha256(sorted);
}
```

If `AppliedPlan.workspaceFingerprint` differs from the current fingerprint at apply time, the Diff Pane shows a banner: *"Workspace has changed since this plan was generated. Review carefully."*

---

## 9. Internationalization & Locale

### 9.1 Current state

Static strings are mostly in English, but `EnhancedIDE.tsx:413` carries a Turkish confirm dialog ("Tüm dosyalar ve açık sekmeler temizlenecek..."), revealing an inconsistent i18n posture. The repository has `src/i18n/` and `src/locales/` directories that are partially used.

### 9.2 Target state

- Every IDE chrome string flows through the existing `src/i18n/` infrastructure.
- A flat key namespace `ide.*` covers the IDE module: `ide.workspace.clear.confirm`, `ide.tabs.closeAll`, `ide.command.run`, etc.
- New components ship with English keys + Turkish translations as a parity floor (since the codebase already serves both).
- A CI gate (`scripts/check-no-string-literals-in-chrome.ts`) flags raw user-visible strings in `components/ide/**` and `components/editor/**`.
- Date and number formatting uses `Intl.DateTimeFormat` / `Intl.NumberFormat`. The `transformProvenance.ts` helper formats timestamps in the user's locale on render but stores them in ISO 8601 internally.
- Direction: all IDE chrome supports LTR. RTL is not in scope for this module but no string assumes LTR with hard-coded paddings.

### 9.3 Locale-aware copy patterns

- Empty states: "No tabs open" / "Açık sekme yok" — both explicitly render the actionable next step.
- Plurals: route through ICU MessageFormat (`{count, plural, one {# error} other {# errors}}`).
- Demo chips: `[demo]` is a code chip, not translated; the *explanation* under it is.

---

## 10. Security, Guardrails, and the AI Trust Boundary

### 10.1 Threat model for the IDE

The IDE handles three classes of input that warrant explicit trust handling:

1. **User-typed code & data files** — trusted by definition; loaded into Monaco models and the file tree.
2. **AI-generated content** — semi-trusted; could contain secrets reflected from prior context, hallucinated paths, or malicious patterns. Must be previewable before apply.
3. **Cross-module events** — trusted only when source is `'ide' | 'map' | 'urban' | 'flow' | 'engine'`. Events with unknown sources are dropped with a warning log.

### 10.2 Guardrails at the AI boundary

- `services/ai/guardrails/redact.ts` already exists and applies PII-like pattern redaction. The plan exposes its output in the AI dock UI (T6.6) so users see *what was redacted*, not just that *something happened*.
- An additional **plan validator** runs before `previewApplyPlan`:
  - Each `PlanDiff.path` must resolve to a workspace-local path (no absolute paths, no `..` traversal beyond workspace root).
  - File extensions in `create` operations must be on an allowlist (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.json`, `.geojson`, `.csv`, `.md`, `.css`, `.html`, `.yml`, `.yaml`, `.toml`, `.ini`, `.txt`, `.sql`, `.sh`, `.ps1`).
  - Total plan size capped (1 MB after, 100 files max). Plans exceeding it require explicit user override.
  - "Risky command" patterns (e.g., `rm -rf`, `curl … | sh`) embedded in created/replaced files raise a non-blocking warning in the Diff Pane.

### 10.3 Secrets hygiene

- `.env*` files are filtered out of the search index.
- `.synapse/plans/<runId>.json` is stripped of any line matching common secret patterns before persistence (`/(api[_-]?key|token|secret)\s*[:=]/i`).
- The AI Brief panel never prints a file's content if its path matches the `.env*` pattern; it shows only the existence of the file.

### 10.4 Cross-module event sanitization

`synapseBus.publish` validates the envelope's `source` against the discriminated-union literal type at runtime (in `legacyAdapter.ts`'s entry path). Events with `source` not in the allowlist are dropped and logged via `reportError`.

### 10.5 Subprocess execution boundary

- Today the terminal is simulated and runs no subprocesses. The plan does not change this.
- When (in a future plan) a real shell adapter is added, it must:
  - Run inside an isolated worker / subprocess scope with no DOM access.
  - Whitelist commands by registry rather than allow arbitrary input.
  - Stream output through `task:log` so it lives in the audit trail.

---

## 11. Performance Budgets

### 11.1 Bundle budgets

The plan must not regress chunk sizes by > 5 % at the top-level. Specific budgets:

| Chunk | Current ceiling | New ceiling |
|---|---|---|
| `index.html` initial JS | per `perf:budgets` manifest | unchanged |
| `ide` route chunk | per manifest | + 60 KB max (Activity Rail + Breadcrumb + BottomPanel + new stores + synapseBus) |
| `editor` chunk | per manifest | + 80 KB max (DiffPane + OutlinePane + ProblemsPane + language service core) |
| `python-analyzer.worker` | n/a | new, cap 250 KB gzipped |
| `searchIndex.worker` | n/a | new, cap 80 KB gzipped |

### 11.2 Runtime budgets

| Metric | Target | Measurement |
|---|---|---|
| First IDE paint after route change | ≤ 350 ms (P75) | Playwright `performance.mark` instrumentation |
| Tab switch (200-line file) | ≤ 16 ms | React Profiler |
| Tab switch (3000-line TS file) | ≤ 50 ms | React Profiler |
| Outline pane refresh after edit | ≤ 250 ms (P95) | dedicated test |
| Problems pane update after edit | ≤ 500 ms (P95) | dedicated test |
| Command palette open + first results | ≤ 80 ms | Playwright trace |
| File explorer scroll @ 1000 files | ≥ 60 fps sustained | React Profiler |
| Memory after opening 50 tabs | ≤ 400 MB | Chrome heap snapshot in CI |
| `synapseBus` 1000-event burst | ≤ 16 ms total | unit test |

### 11.3 Test strategy

- A new `e2e/perf-ide.spec.ts` measures first IDE paint and tab switch times.
- `vitest` perf tests under `src/__perf__/` exercise store throughput.
- The existing `npm run perf:budgets` is extended to fail CI if any new ceiling is breached.

---

## 12. Telemetry & Observability

### 12.1 Existing instrumentation

The codebase has OpenTelemetry traces (`src/observability/otel.ts`, `spans.ts`, `aiRouteTelemetry.ts`). The plan reuses this, never circumvents it.

### 12.2 New spans introduced by the IDE plan

| Span | Where | Attributes |
|---|---|---|
| `ide.apply-plan.preview` | `previewApplyPlan` | `runId`, `model`, `fileCount`, `totalBytes`, `workspaceFingerprintMatch` |
| `ide.apply-plan.commit` | `executeApplyPlan` | `runId`, `acceptedFiles`, `rejectedFiles`, `durationMs` |
| `ide.apply-plan.revert` | revert action | `runId`, `dependentsAffected` |
| `ide.search.query` | `queryDocs` / `searchIndex.worker` | `kinds`, `queryLength`, `resultCount`, `durationMs` |
| `ide.task.run` | `runTask` | `taskId`, `channel`, `source`, `exitCode`, `durationMs` |
| `ide.language.diagnostics` | language providers | `path`, `language`, `errorCount`, `warningCount`, `durationMs` |
| `ide.bus.publish` | `synapseBus.publish` | `kind`, `source`, `subscriberCount` |
| `ide.bus.subscriberError` | uncaught subscriber error | `kind`, `source`, `errorMessage` |

### 12.3 Metrics

- Counter `ide.plan.applied` — incremented once per applied plan.
- Counter `ide.plan.reverted` — once per revert.
- Histogram `ide.search.duration_ms`.
- Histogram `ide.tabSwitch.duration_ms`.
- Gauge `ide.openTabs.count`.
- Gauge `ide.problems.errorCount`, `ide.problems.warningCount`.

### 12.4 Privacy in telemetry

- Span attributes never contain file contents, prompt text, or AI completions.
- File paths are hashed at the workspace boundary (`sha1(workspaceRoot + relativePath)`) so traces correlate within a session but cannot be reverse-mapped to the user's filesystem.

---

## 13. Onboarding & First-Run

### 13.1 The "first launch" surface

Today, opening the IDE with no tabs renders a large welcome canvas (`EnhancedIDE.tsx:898–1238`) with a 120×120 logo and two big buttons. Premium-grade onboarding is **smaller, denser, and more useful**.

### 13.2 New empty-state design

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Synapse IDE                                                 │
│  Open a file from the explorer, drop one here, or pick one:  │
│                                                              │
│  ▸ Recent projects                                           │
│    • Istanbul Walkability Study   3 days ago                 │
│    • Climate Vulnerability Demo   1 week ago                 │
│                                                              │
│  ▸ Templates                                                 │
│    • New GeoPandas notebook                                  │
│    • New SQL transform (DuckDB)                              │
│    • New TypeScript flow step                                │
│                                                              │
│  ▸ Cross-module shortcuts                                    │
│    • Open Map Explorer            Ctrl+Shift+M               │
│    • Open Urban Analytics         Ctrl+Shift+U               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Replaces the oversized hero block.
- "Recent projects" reads from `storage.getRecentProjects()` (already wired).
- "Templates" creates a new file via `NewFileModal`-equivalent flows and immediately opens it.
- Drop-target accepts both files and `.synapse/` directories.

### 13.3 Demo project

A single shippable demo project in `public/demos/istanbul-walk/` exposes a `.synapse/workspace.json` plus three files (one Python, one GeoJSON, one Markdown) the user can load with one click. Clearly tagged `[demo]`. Used by Playwright smoke tests.

### 13.4 Empty bottom-panel tabs

Each new bottom-panel tab has its own truthful empty state:

- **Tasks**: "No tasks running. Press Ctrl+R to start the dev server."
- **Problems**: "No diagnostics. Open a TS or Python file to enable analysis."
- **Plan History**: "No applied plans. The AI dock applies plans here once you accept one."
- **Search Results**: "Press Ctrl+Shift+F to search across the workspace."

---

## 14. Conflict Resolution

### 14.1 Concurrent AI plans on the same file

When two AI plans target the same path:
- The Diff Pane of plan B detects an overlap with un-applied plan A's `pending` set and shows a banner: *"Plan A is pending changes to this file. Resolve plan A first."*
- If plan A is already applied, plan B's `before` is reconciled against the post-A state automatically; if reconciliation fails (line offsets shifted past confidence threshold), the file is marked **needs manual merge** and surfaced in Problems.

### 14.2 External file change vs. open dirty tab

- The `FileSystemAdapter.watch` channel emits `fs:fileChanged` for files that exist outside the IDE.
- When a watched file changes and its tab is dirty, the tab gains a yellow stripe and a warning toast offers: **Reload from disk**, **Keep my changes**, or **Open three-way merge**.
- The three-way merge uses the same Monaco `DiffEditor` infrastructure and routes its commit through `planHistoryStore` for undo (a "manual merge" plan with `mode: 'pro'`, `model: 'manual'`).

### 14.3 Plan revert affecting downstream work

- Each `AppliedPlan` records `dependents: string[]` — the runIds of later plans that touched the same files.
- Reverting plan A with non-empty `dependents` shows the modal:
  > *"Plan pln_… has 2 dependent plans (pln_… and pln_…). Reverting plan A will leave dependents in an undefined state. Choose:*
  > *— **Revert this plan only** (dependents will reference content that no longer exists in this form)*
  > *— **Revert this plan and all dependents** (full chain rollback)*
  > *— **Cancel***
- The chosen path is recorded in the revert plan's metadata.

### 14.4 Layer registration race

- If the IDE publishes `map:registerLayer` for `layerId="X"` while the Map Explorer already has a layer with that id, the Map Explorer (per its plan) treats it as a *replace* and emits `map:layerRegistry:change` with `operation: 'replace'`.
- The IDE's file explorer subscribes to that event and updates its "in-map" badge without removing and re-adding it.

### 14.5 Workspace fingerprint mismatch

- See §8.4. A pre-apply check warns the user. Apply is not blocked, but the warning is recorded in the plan's `notes`.

---

## 15. Keyboard Map (Definitive)

| Shortcut | Action |
|---|---|
| `Ctrl+P` | Files (palette default) |
| `Ctrl+Shift+P` | Commands (palette `>` mode) |
| `Ctrl+T` | Workspace symbols (palette `#` mode) |
| `Ctrl+G` | Go to line:column |
| `Ctrl+K` | Command palette (legacy alias) |
| `Ctrl+Shift+F` | Find & Replace (workspace) |
| `Ctrl+F` | Find in active editor / channel |
| `Ctrl+B` | Toggle file explorer |
| `Ctrl+J` | Toggle bottom panel |
| `Ctrl+Alt+J` | Cycle bottom-panel tabs |
| `` Ctrl+` `` | Focus terminal / console channel |
| `` Ctrl+Shift+` `` | New terminal channel scope |
| `Ctrl+Shift+M` | Toggle Map Explorer (existing) |
| `Ctrl+Shift+U` | Toggle Urban Analytics Modal |
| `Ctrl+Shift+A` | Focus AI dock |
| `Ctrl+S` | Save active tab |
| `Ctrl+Shift+S` | Save all (existing) |
| `Ctrl+W` | Close tab |
| `Ctrl+Shift+T` | Reopen last closed tab |
| `Ctrl+\\` | Split editor |
| `Alt+Left` / `Alt+Right` | Editor history back/forward |
| `Alt+Shift+←` / `Alt+Shift+→` | Reorder tabs (existing) |
| `Ctrl+Alt+I` | AI: Improve Selection (existing) |
| `Ctrl+Alt+E` | AI: Explain Selection (existing) |
| `Ctrl+Alt+C` | AI: Add Beginner Comments (existing) |
| `Alt+Shift+D` | AI: Dry-Run Last Plan (existing) |
| `Alt+Shift+A` | AI: Apply Pending Plan |
| `Alt+Shift+B` | AI: Refresh Project Brief (existing) |
| `Ctrl+Alt+Z` | Undo last layout change |
| `Ctrl+Alt+1..7` | Activity rail: Explorer / Search / Plan History / Problems / Map Bridge / Urban Bridge / Settings |

A printable cheat sheet is generated at build time from the `commandRegistry` and exposed via the palette `?` mode.

---

## 16. Reversibility & Safety

### 16.1 Three layers of undo

1. **Editor undo (Monaco)** — character-level, per tab, already present.
2. **Plan-level undo** (T6) — file-level, per applied AI plan, restores byte-for-byte.
3. **Layout undo** — last 5 layout changes are stack-undoable via `Ctrl+Alt+Z` (separate from editor undo to avoid collisions).

### 16.2 Destructive-action confirmations

- File delete: confirmation dialog **with file count**; multi-file delete shows a list. Move-to-trash semantics: delete sets `node.tombstone = true` and a 30-second toast offers "Undo".
- Workspace clear: confirmation already present (`EnhancedIDE.tsx:413`); remove the localized Turkish copy and replace with i18n key `ide.workspace.clear.confirm` so other locales work. Add a "this will close N tabs and remove M files; type CLEAR to confirm" pattern.
- Plan revert: confirmation lists files affected and warns when downstream plans built on top; offers a "Revert plan and all dependents" option.

### 16.3 Crash recovery

- Tab dirty state is autosaved to `IndexedDB` every 5 seconds (snapshot only, not committed to file). On reload, the IDE detects unsaved snapshots and offers to restore.
- The `subscribeEditorBridge` failure path (`EnhancedIDE.tsx:133`) is upgraded from `console.error` to `reportError` (already present) plus a non-blocking toast.
- Plan-history writes are atomic (write to `<runId>.json.tmp` then rename); a partial write never corrupts the ledger.

### 16.4 Safety floors

- `Ctrl+Shift+T` reopens the last closed tab from a 50-deep ring.
- Every file delete is paired with an `undo` token valid for 30 s.
- The editor never silently discards content on language change; if Monaco's mode change would alter content (it shouldn't), an assertion fires in dev.
- Apply-plan never touches a file whose content's sha256 differs from the plan's `before` hash unless the user confirms.

---

## 17. Phased Roadmap

The plan splits into five phases, each ending with a demonstrable milestone. **No phase ships without its acceptance criteria green and its Playwright suite passing.**

### Phase 1 — Shell & Theming (Weeks 1–2)

| Week | Focus |
|---|---|
| 1 | Inline-style purge in `Header.tsx`. CSS modules for Header & TabBar. `useWorkspaceMetrics` hook. |
| 2 | ActivityRail. Breadcrumb. BottomPanel skeleton (Terminal-only initially). LayoutSnapshots in `appStore` (v3 migration). `synapseBus` skeleton + legacy adapter. Density modes wired to CSS variables. Theme parity (light/neutral/dark) for shell. |

**Milestone**: visually identical IDE, but every surface reads from CSS variables, layout snapshots work, `synapseBus.publish/subscribe` is callable, activity rail shows in the empty state. Bottom panel still only has Terminal.

### Phase 2 — Editor & Search (Weeks 3–5)

| Week | Focus |
|---|---|
| 3 | OutlinePane. `outlineStore`. Symbol provider (TS via Monaco, Python via worker). |
| 4 | `languageService`. ProblemsPane. `problemsStore`. Language diagnostics rendering in Monaco gutter and Problems pane. |
| 5 | Unified palette modes (commands/symbols/lines/files). Worker-side indexer. `searchIndexStore`. SearchResultsPane. Find & Replace with regex + scope. |

**Milestone**: Outline pane, Problems pane, language service (TS + Python diagnostics), GeoJSON Preview-on-Map publisher (toolbar wired but DiffPane still stub), unified palette modes, Find & Replace bottom-panel tab.

### Phase 3 — Terminal, Tasks, File System (Weeks 6–7)

| Week | Focus |
|---|---|
| 6 | `services/tasks/` registry + runtime. `tasksStore`. TasksPane. Built-in tasks (`dev:vite`, `build:vite`, `lint`). Run/Build button badging. |
| 7 | GIS-aware FileIcons. QA badges. Virtualized explorer for > 200 nodes. Context-menu extensions (Preview on Map / Send to Urban / Use as Flow input). `FileSystemAdapter` interface + `InMemoryAdapter`. `.synapse/` bundle skeleton (workspace.json, layouts/, console/). |

**Milestone**: tabbed bottom panel with Tasks/Problems/Plan-History/Console; GIS-aware file explorer with QA badges; `.synapse/` workspace bundle skeleton with layouts and console transcripts.

### Phase 4 — AI & Apply Pipeline (Weeks 8–9)

| Week | Focus |
|---|---|
| 8 | DiffPane (Monaco DiffEditor). `previewApplyPlan`. `planHistoryStore`. Plan ledger persistence in `.synapse/plans/`. PlanHistoryPane. |
| 9 | Per-file accept/reject. Plan-level undo. Conflict detection on overlapping plans. AI Brief panel. Guardrails redaction surface. Provenance chips on tabs and explorer rows. |

**Milestone**: every AI mutation is preview-then-apply, recorded, and revertable; AI Brief shows the user what context the AI has pinned.

### Phase 5 — Cross-Module Sync Hardening (Week 10)

| Week | Focus |
|---|---|
| 10 | Subscribers for `map:selectFeature`, `urban:openCard`, `map:layerRegistry:change`. Extended `usePanelBridgeStore`. MapBridgePane and UrbanBridgePane. `workbench:snapshotRequest`/`snapshotReply`. ESLint rule banning legacy events. Public `docs/architecture/synapse-bus.md`. |

**Milestone**: the IDE participates as an equal peer in the tri-modal workspace; the Map Explorer plan can begin against a stable IDE contract.

---

## 18. Quality Gates & Definition of Done

### 18.1 Code-level gates

- `npm run typecheck` clean.
- `npm run lint:errors` zero errors. New code uses CSS modules; CI grep gate forbids new hex literals in `components/ide/**` and `components/editor/**`.
- `npm run test` suite extended:
  - `stores/__tests__/appStore.migration.v2-to-v3.test.ts`
  - `stores/__tests__/planHistoryStore.test.ts`
  - `stores/__tests__/problemsStore.test.ts`
  - `stores/__tests__/outlineStore.test.ts`
  - `stores/__tests__/tasksStore.test.ts`
  - `services/__tests__/synapseBus.test.ts`
  - `services/__tests__/synapseBus.discipline.test.ts`
  - `services/__tests__/language.python.test.ts`
  - `services/__tests__/language.typescript.test.ts`
  - `services/__tests__/search.indexer.test.ts`
  - `services/__tests__/fs.InMemoryAdapter.test.ts`
- `npm run perf:budgets` budgets respected (no chunk regression > 5 %).

### 18.2 E2E gates

- `e2e/ide-shell.spec.ts` (new): activity rail, layout snapshot save/restore, bottom panel cycling.
- `e2e/ide-apply-plan.spec.ts` (new): Diff preview → apply → revert.
- `e2e/ide-map-bridge.spec.ts` (new): `.geojson` Preview on Map publishes the bus event; explorer badge appears after Map Explorer registers (mocked Map Explorer subscriber).
- `e2e/ide-search.spec.ts` (new): palette modes, Find & Replace through Diff Pane.
- `e2e/perf-ide.spec.ts` (new): tab switch & first paint budgets.

### 18.3 Accessibility gates

- `e2e/accessibility-audit.spec.ts` extended to cover: activity rail, bottom-panel tabs, Plan History, Diff Pane, Search Results, Outline pane, Problems pane.
- All new interactive elements have `aria-label`, focus ring, and keyboard activation.
- Color contrast ≥ 4.5:1 against every surface.

### 18.4 Truthfulness gates

- No "Coming soon" copy.
- Every empty state names what would populate it ("Flow runs from the Map Explorer or Urban Analytics flows will appear here").
- Every demo affordance carries a `[demo]` chip.
- Plan apply, plan revert, file delete, and workspace clear all show the count and identity of affected items.

### 18.5 Documentation gates

- `docs/architecture/synapse-bus.md` (T7) ships with the discriminated-union catalogue.
- `docs/architecture/synapse-workspace-bundle.md` (T4) ships with `.synapse/` schema.
- `docs/architecture/applied-plan-schema.md` (T6) ships with the `AppliedPlan` schema.
- `README.md` "Project Structure" section is updated where new top-level folders appear (`services/synapseBus/`, `services/tasks/`, `services/language/`, `services/search/`).

---

## 19. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Inline-style purge regresses Header layout | Medium | High | Visual regression tests via Playwright screenshots before/after; CSS modules tested against the same DOM tree. |
| Diff Pane (Monaco DiffEditor) inflates bundle | Low | Medium | DiffEditor already in Monaco bundle; lazy-load on first preview. |
| `synapseBus` becomes the new global event soup | Medium | High | Strict discriminated union; lint rule forbids `window.dispatchEvent('synapse:*')` outside `legacyAdapter.ts`; one owning maintainer for the catalogue. |
| OPFS adapter introduces sync issues | Low (Phase 4+ scope) | Medium | OPFS adapter is a stub in this plan; full implementation is its own future plan. |
| Cross-module subscriptions create render storms | Medium | High | Each subscriber memoizes by `runId`/`layerId`/`cardId`; `usePanelBridgeStore` writes are coalesced via microtask queue; perf budget includes max-subscriber-fanout test. |
| Python language service produces false positives | Medium | Medium | Surface as **info-level** by default; user can promote to warning. Document its limitations. |
| Plan-revert across dependent plans is ambiguous | High | High | Plan dependency graph; revert dialog enumerates dependents and forces explicit choice. |
| Workspace fingerprint check too strict | Medium | Low | Banner-only, never blocking. User can override. Fingerprint compares file list metadata, not content hashes. |
| `.synapse/` directory pollutes user workspaces | Low | Low | Documented opt-out. `.synapse/` defaults to gitignored template. |
| New keyboard shortcuts collide with browser/OS | Medium | Medium | All new shortcuts checked against VS Code, Chrome, and macOS/Windows defaults. Conflicts (if any) recorded in §15 with notes. |

---

## 20. Out of Scope (Explicit)

To keep the IDE plan focused, the following are **explicitly out of scope** here and live in their own plans or future phases:

- Real OS-level shell / PTY integration.
- Real Python execution (Pyodide / Jupyter bridge).
- Git surface (status, diff, blame) — covered by a future Track T8.
- Real-time multi-user collaboration (Yjs is in `package.json` but unused in the IDE today).
- Map rendering changes, deck.gl layer additions — owned by `MAP_EXPLORER_ENHANCEMENT_PLAN.md`.
- New urban indicators, cards, flows — owned by `URBAN_ANALYTICS_STRENGTHENING_PLAN.md`.
- AI-provider migrations or new sampling logic — owned by `src/ai/` and its own roadmap.
- Mobile-specific layouts (the IDE is a desktop-first workspace; tablet usage is best-effort).
- Marketplace, extension API, plugin system.

---

## 21. Closing Principle

> The Synapse IDE is the **pen** of the urban-analytics workbench. The Map Explorer is the **drafting table**. The Urban Analytics Modal is the **library**. Each tool must work alone, but its full power emerges only when the three are kept in sync. The contracts in this plan exist so that, when the planner edits a GeoJSON file, the map updates; when the analyst selects a feature on the map, the indicator card surfaces; when the AI applies a plan, the result is auditable in code, on map, and against methodology — all within one breath.

---

## Appendix A — Glossary

| Term | Meaning |
|---|---|
| **Activity Rail** | The 44 px vertical icon column at the far left of the IDE (Explorer, Search, Plan History, Problems, Map Bridge, Urban Bridge, Settings). |
| **AppliedPlan** | A persisted record of an AI-generated file mutation, including its diffs, undo snapshots, model, runId, and dependents. |
| **AOI** | Area of interest — a polygon or multipolygon that scopes a spatial operation. |
| **Bottom Panel** | The tabbed area below the editor (Terminal, Tasks, Problems, Plan History, Search Results, Output). |
| **cardId** | Stable id of an Urban Analytics methodology card (e.g. `walk_score`). |
| **datasetId** | Canonical id of a source dataset; in the IDE, normally the file's relative path. |
| **DiffPane** | A Monaco DiffEditor surface for previewing file mutations before apply (used by AI plans and three-way merges). |
| **featureRef** | A reference to a single map feature: `{ layerId, featureId }`. |
| **layerId** | Stable id of a Map Explorer overlay layer. |
| **LayoutSnapshot** | A versioned record of all panel widths/heights, density, font size, and active bottom tab. |
| **Outline Pane** | The right-side editor pane listing symbols (classes, functions, exports) of the active tab. |
| **Pending Plan** | An AI plan that has been previewed but not yet applied; held in `planHistoryStore.pending`. |
| **Plan History** | A bottom-panel tab listing every applied or reverted AI plan. |
| **Problems Pane** | A bottom-panel tab listing diagnostics from language services, QA flags, lint, and plan validators. |
| **Provenance** | The triplet `{ source, runId?, timestamp, actor? }` carried by every cross-module artifact. |
| **runId** | Unique id of an apply-plan or analytical-flow execution (`pln_…` or `flow_…`). |
| **synapseBus** | The typed cross-module event bus (`services/synapseBus/`). |
| **TasksPane** | A bottom-panel tab grouping log streams by channel (console, build, python, flow-run, ai). |
| **Workspace fingerprint** | A sha256 of the workspace's file metadata (path/size/mtime list) used to detect drift between plan generation and apply. |

---

## Appendix B — Files-to-Touch Master Index

### Created files (new)

```
src/components/ide/
├── ActivityRail.tsx
├── Breadcrumb.tsx
├── BottomPanel.tsx
├── ResizeAffordance.tsx
├── MapBridgePane.tsx
├── UrbanBridgePane.tsx
├── TasksPane.tsx
├── SearchResultsPane.tsx
└── styles/
    ├── Header.module.css
    ├── TabBar.module.css
    ├── ActivityRail.module.css
    ├── Breadcrumb.module.css
    ├── BottomPanel.module.css
    ├── DiffPane.module.css
    ├── OutlinePane.module.css
    └── ProblemsPane.module.css

src/components/editor/
├── OutlinePane.tsx
├── ProblemsPane.tsx
└── DiffPane.tsx

src/components/ai/
├── AiBriefPanel.tsx
└── PlanHistoryPane.tsx

src/services/
├── synapseBus/
│   ├── index.ts
│   ├── types.ts
│   └── legacyAdapter.ts
├── tasks/
│   ├── registry.ts
│   ├── runtime.ts
│   ├── types.ts
│   └── builtins/
│       ├── devVite.ts
│       ├── buildVite.ts
│       └── lint.ts
├── language/
│   ├── index.ts
│   ├── typescriptProvider.ts
│   ├── pythonProvider.ts
│   └── types.ts
├── search/
│   ├── indexer.ts
│   └── types.ts
└── fs/
    ├── index.ts
    ├── types.ts
    ├── InMemoryAdapter.ts
    ├── OPFSAdapter.ts
    └── SynapseBundle.ts

src/stores/
├── problemsStore.ts
├── outlineStore.ts
├── tasksStore.ts
├── planHistoryStore.ts
└── searchIndexStore.ts

src/workers/
├── pythonAnalyzer.worker.ts
└── searchIndex.worker.ts

src/hooks/
└── useWorkspaceMetrics.ts

src/utils/ai/apply/
└── previewApplyPlan.ts

docs/architecture/
├── synapse-bus.md
├── synapse-workspace-bundle.md
└── applied-plan-schema.md

e2e/
├── ide-shell.spec.ts
├── ide-apply-plan.spec.ts
├── ide-map-bridge.spec.ts
├── ide-search.spec.ts
└── perf-ide.spec.ts

scripts/
├── generate-ide-css-vars.ts
└── check-no-string-literals-in-chrome.ts
```

### Modified files (existing)

```
src/App.tsx                                          (no change planned; surface noted)
src/components/ide/EnhancedIDE.tsx                   (subscriber wiring, gutter math, bottom panel)
src/components/ide/Header.tsx                        (inline-style purge → CSS modules)
src/components/ide/CommandPalette.tsx                (palette modes, symbols)
src/components/ide/GlobalSearch.tsx                  (Find & Replace + regex + scope)
src/components/ide/IdeThemeScope.tsx                 (density modes, theme parity)
src/components/editor/MonacoEditor.tsx               (markers, language service hookup, split)
src/components/editor/EditorPreviewToolbar.tsx       (Preview on Map button)
src/components/editor/monacoTheme.ts                 (light/neutral parity finalization)
src/components/terminal/components/Terminal.tsx      (tabs/channels, [demo] chips, find)
src/components/terminal/terminalLogBus.ts            (compat shim into tasksStore)
src/components/file-explorer/FileExplorer.tsx        (virtualization, badges, drag MIME)
src/components/file-explorer/FileIcon.tsx            (GIS file types)
src/components/file-explorer/ContextMenu.tsx         (Preview on Map / Send to Urban)
src/components/file-explorer/pro/HeaderPro.tsx       (template/lang selectors)
src/components/ai/panel/SynapseCoreAIPanel.tsx       (preview-first, guardrails surface)
src/services/commandRegistry.ts                      (weighted scoring)
src/services/tasksBridge.ts                          (delegate to services/tasks/)
src/services/editor/bridge.ts                        (typed events through synapseBus)
src/services/editorBridge.ts                         (typed events through synapseBus)
src/services/search.ts                               (delegate to services/search/)
src/services/storage.ts                              (.synapse bundle integration)
src/stores/appStore.ts                               (v2 → v3 migration; bottom panel; snapshots)
src/stores/editorStore.ts                            (provenance + qa fields on tabs)
src/stores/fileExplorerStore.ts                      (provenance + qa fields on nodes)
src/stores/usePanelBridgeStore.ts                    (cross-module fields)
src/utils/ai/apply/buildApplyPlan.ts                 (validator)
src/utils/ai/apply/executeApplyPlan.ts               (commits via planHistoryStore)
src/ui/theme/synapseTheme.ts                         (no semantic changes; cleanup only)
src/ui/theme/semanticTokens.ts                       (additions for new surfaces)
src/ui/theme/ideProScope.css                         (regenerated by generate-ide-css-vars.ts)
src/observability/spans.ts                           (new IDE spans)
src/i18n/                                            (ide.* namespace)
README.md                                            (Project Structure update)
```

---

## Appendix C — Implementation Checklist by Phase

### Phase 1 — Shell & Theming

- [ ] T1.1 Inline-style purge in `Header.tsx` (CSS modules).
- [ ] T1.2 ActivityRail mounted, keyboard-cycle-able.
- [ ] T1.3 Breadcrumb above editor, click-navigable.
- [ ] T1.4 BottomPanel skeleton with Terminal tab.
- [ ] T1.5 LayoutSnapshot schema + appStore v3 migration test.
- [ ] T1.6 `<ResizeAffordance />` reused on every drag handle.
- [ ] T1.7 `useWorkspaceMetrics` wired everywhere.
- [ ] T7.1 `synapseBus` skeleton + legacy adapter.
- [ ] §7 Density modes & theme parity for shell.
- [ ] CI grep gate: zero hex literals in `components/ide/**`.
- [ ] Visual regression: Header pixel-equivalent before/after.

### Phase 2 — Editor & Search

- [ ] T2.1 OutlinePane (TS + Python).
- [ ] T2.2 ProblemsPane + `problemsStore`.
- [ ] T2.5 Language service (TS via Monaco worker, Python via worker).
- [ ] T2.7 Inline AI affordances visible in Monaco context menu.
- [ ] T5.1 Palette modes (`>`, `@`, `#`, `:`, `?`, blank).
- [ ] T5.2 Worker indexer + `searchIndexStore`.
- [ ] T5.3 Weighted scoring.
- [ ] T5.5 Find & Replace bottom-panel tab with regex + scope.
- [ ] Acceptance: typing `walk` in palette surfaces Urban Analytics card.

### Phase 3 — Terminal, Tasks, File System

- [ ] T3.1 Honest framing on terminal header.
- [ ] T3.2 TasksPane + `tasksStore` + 5 channels.
- [ ] T3.3 Search-in-output (Ctrl+F).
- [ ] T3.5 Built-in tasks `dev:vite`, `build:vite`, `lint`.
- [ ] T3.6 Run/Build status badge on header.
- [ ] T4.1 GIS-aware FileIcons.
- [ ] T4.2 QA badges in tree rows.
- [ ] T4.3 Virtualization for > 200 nodes.
- [ ] T4.4 Context-menu extensions (Preview on Map / Send to Urban / Use as Flow input).
- [ ] T4.5 Drag MIME `application/x-synapse-file`.
- [ ] T4.6 `FileSystemAdapter` interface + `InMemoryAdapter`.
- [ ] T4.7 `.synapse/` skeleton (workspace.json, layouts/, console/).

### Phase 4 — AI & Apply Pipeline

- [ ] T2.4 DiffPane mounted in editor area.
- [ ] T6.1 `previewApplyPlan` wraps `executeApplyPlan`.
- [ ] T6.2 `planHistoryStore` + `.synapse/plans/` ledger.
- [ ] T6.3 Per-file accept/reject + plan-level revert.
- [ ] T6.4 AI Brief panel.
- [ ] T6.5 Provenance chips on tabs and explorer rows.
- [ ] T6.6 Guardrails surface (visible redaction summary).
- [ ] §10.2 Plan validator (path, extension, size, risky-pattern checks).
- [ ] §14.1 Concurrent-plan banner.
- [ ] §14.3 Dependent-plan revert dialog.

### Phase 5 — Cross-Module Sync Hardening

- [ ] T7.2 IDE-as-publisher events fully wired.
- [ ] T7.3 IDE-as-subscriber events fully wired (via mocks where the other plans aren't ready).
- [ ] T7.4 `usePanelBridgeStore` extended with map/urban fields.
- [ ] T7.5 Workbench-level commands (`map.registerActiveTabAsLayer`, etc.).
- [ ] MapBridgePane and UrbanBridgePane mounted from activity rail.
- [ ] ESLint rule `no-legacy-synapse-events`.
- [ ] `docs/architecture/synapse-bus.md` published.
- [ ] `e2e/ide-map-bridge.spec.ts` green.
- [ ] Final accessibility audit pass.

---

## Appendix D — Tri-Modal Alignment Charter

This appendix is the binding alignment layer between:

- `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`

It exists so the three plans evolve as one premium scientific workbench rather than three visually polished but disconnected modules. It does not generate the future sequential prompts. It only defines the operational, wire/layout, synchronization, and premium-design standard those prompts must follow later.

The standalone canonical version of this alignment layer is `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`. When future prompt sequences are generated, that file should be treated as the shared source of truth across the three module plans.

### D.1 Shared Product Model

The workbench has three primary surfaces:

| Surface | Product role | State ownership | Primary output |
|---|---|---|---|
| Synapse IDE | Coder, file, terminal, script, manifest, and AI apply surface. | editor tabs, file tree, AI plans, tasks, terminal sessions, generated code artifacts. | code artifacts, manifests, notebooks, diffs, execution notes. |
| Map Explorer | Spatial operating surface. | viewport, layers, AOI, selections, QA, drawing, measurement, temporal state, map evidence, report snapshots. | map layers, map evidence, spatial QA, publication exports, map report handoffs. |
| Urban Analytics | Scientific reasoning and methodology surface. | method cards, indicators, data fitness, evidence tray, workflow interpretation, report/dashboard/education bindings. | urban evidence, method dossiers, indicator records, report sections, dashboard bindings. |

The IDE must not become a map store. Map Explorer must not become a methodology catalog. Urban Analytics must not become a code editor or map renderer. Premium synchronization means each surface keeps its ownership and publishes typed summaries to the others.

### D.2 Shared Work Cycle

All three plans must support the same evidence lifecycle:

```text
Question -> Context -> Data -> QA -> Method -> Run -> Evidence -> Code -> Map -> Report -> Dashboard -> Review
```

IDE responsibility in this lifecycle:

- open or create scripts, manifests, notebooks, SQL, markdown notes, and adapter files;
- preserve provenance of generated artifacts;
- expose file-level QA and artifact lineage in tabs and file explorer;
- receive map and urban artifacts as named, reversible code/file outputs;
- publish generated outputs back to Map Explorer or Urban Analytics only through typed bridges.

Map Explorer responsibility in this lifecycle:

- define spatial context through viewport, AOI, selected features, and visible layers;
- validate spatial evidence through QA;
- publish derived spatial layers and map evidence;
- create report/export-ready map snapshots and manifests.

Urban Analytics responsibility in this lifecycle:

- define the scientific method, assumptions, data requirements, validity envelope, and interpretation;
- convert map/code/report/dashboard outputs into an evidence system;
- keep data fitness, uncertainty, limitations, and references visible.

### D.3 Shared Wire/Layout Contract

The three modules must look like coordinated zones in one professional workbench.

Canonical desktop wire:

```text
Global app shell
  Top command/status band
  Left navigation or asset rail
  Primary work surface
  Right context/dossier/inspection rail
  Bottom status, terminal, timeline, or output band
```

IDE wire:

```text
Top: header, tabs, run/build/sync status
Left: activity rail + file explorer/search/git-like future slots
Center: Monaco editor, diff/editor groups, preview when relevant
Right: AI assistant, bridge panes, artifact metadata
Bottom: terminal, problems, tasks, output, plan history
```

Map Explorer wire:

```text
Top: map cockpit, mode, sync, QA, save/readiness status
Left: layer/evidence rail, imports, cartography, source metadata
Center: map canvas and direct spatial interaction
Right: QA, workflow, report handoff, NL query, review timeline
Bottom: coordinates, scale, CRS, temporal player, active tool, memory/worker state
```

Urban Analytics wire:

```text
Top: research context, search, study area, sync, QA, evidence count
Left: method/indicator/library rail with filters and readiness badges
Center: analytical workflow and current research task
Right: four-block scientific dossier: methodology, data, code, references
Bottom/Tray: evidence timeline, report/dashboard/IDE/map actions
```

Shared layout rules:

- All three must keep the primary work surface first: editor for IDE, map for Map Explorer, workflow/method surface for Urban Analytics.
- Right rails are context and evidence surfaces, not decorative panels.
- Bottom bands are operational status surfaces, not marketing copy.
- Constrained widths collapse secondary rails into drawers without hiding primary work.
- Panel density should match across modules: compact, readable, operational.

### D.4 Shared Premium Design Contract

The premium design language is:

- dark professional shell with restrained contrast;
- compact panels;
- precise icon buttons with labels/tooltips;
- visible status chips for sync, QA, readiness, provenance, and unsaved state;
- no large decorative hero sections inside tool surfaces;
- no vague cards that do not perform an action;
- no card-in-card UI for dense workbench areas;
- no hidden disabled states;
- no text overflow in buttons, chips, tabs, or row labels;
- stable dimensions for rails, toolbars, rows, tabs, and status bands;
- color used as a signal only when paired with text or icon meaning.

Shared status vocabulary:

| Status | Meaning | Visual treatment |
|---|---|---|
| Ready | Action can run with current context. | compact positive chip, no exaggerated success treatment. |
| Ready with caveats | Action can run but limitations must travel with output. | warning chip with caveat count. |
| Needs context | Missing AOI, layer, file, method, field, or destination. | neutral chip with specific missing item. |
| Blocked | Scientific, safety, or data issue prevents formal output. | error chip plus exact blocker. |
| Demo/sample | Output uses sample data or fixture mode. | persistent sample label. |
| Unsynced | Another module has not received current state. | sync chip and action. |

### D.5 Shared Synchronization Contract

The three modules should share one typed integration spine.

Canonical event families:

| Family | Direction | Purpose |
|---|---|---|
| `ide:*` | IDE to workbench | Open, update, annotate, or publish code/file artifacts. |
| `map:*` | Map Explorer to workbench | Publish map context, layer evidence, QA, exports, and workflow outputs. |
| `urban:*` | Urban Analytics to workbench | Publish method context, evidence artifacts, report/dashboard bindings, and data fitness. |
| `synapse:navigate` | shared | Move between tabs, flows, report, dashboard, map, education, and IDE surfaces. |
| `reporting/*` | reporting | Queue or refresh structured report inserts. |

Canonical artifact references:

```text
artifactId
artifactKind
sourceModule
sourceId
createdAt
title
summary
provenance
qa
relatedLayerIds
relatedCardIds
relatedFlowIds
relatedFilePaths
manifestId
reportInsertId
dashboardBindingId
```

Rules:

- Large data is never copied through events.
- Events carry ids, summaries, manifests, and references.
- Every generated code artifact links back to map/urban evidence when applicable.
- Every map evidence artifact can be converted into an Urban evidence artifact.
- Every Urban method can request map context and IDE artifact generation.
- Every report/dashboard insert carries QA and provenance.

### D.6 IDE-Specific Alignment Obligations

Synapse IDE must implement the alignment standard as follows:

- Tabs must display artifact origin when a file was generated from Map Explorer or Urban Analytics.
- File explorer rows should eventually show GIS/Urban artifact badges for `.geojson`, `.geoparquet`, `.map.json`, `.urban.json`, `.ipynb`, `.py`, `.sql`, and report notes.
- Command palette must surface cross-module commands with the same names used in Map Explorer and Urban Analytics.
- Generated files must use stable names and manifest headers.
- Apply-plan and AI-generated edits must remain reversible and auditable.
- IDE bridge panes must show active map context and active urban method context without owning that state.

### D.7 Cross-Plan Acceptance Gate

No future implementation prompt should be considered complete if it improves only one module visually while breaking cross-module coherence.

Shared acceptance criteria:

- The same artifact can be opened from its owning module and referenced from the other two.
- The same QA caveat appears consistently in IDE manifest, Map Explorer panel, Urban dossier, report insert, and dashboard binding where relevant.
- A user can move from Urban method -> Map context -> IDE script -> Map output -> Report insert without losing provenance.
- A user can move from IDE generated file -> Map layer -> Urban method recommendation without duplicate state ownership.
- A user can move from Map layer -> Urban evidence -> IDE reproducibility script without manual copy-paste.

### D.8 Prompt-Readiness Note

Future sequential prompts must be generated later from the three aligned plans in this order:

```text
Foundation sync contracts -> IDE artifact handling -> Map context/evidence -> Urban context/evidence -> cross-module workflows -> premium UI polish -> validation
```

This appendix intentionally stops at alignment. It does not create the future prompt sequence.

---

*End of Synapse IDE Development Plan. Companion plans: `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` and `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`.*
