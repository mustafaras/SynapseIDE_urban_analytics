# p06 — Drawing Premium Modal Redesign

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p06 · **Depends on:** p05 · **Tracks:** A (a11y/support) + B (premium redesign)

## Mission
Turn the functional-but-rough Draw modal into a premium, legible, animated drawing surface: a clear tool rail, a calm one-line status, a footer with a real primary/secondary action hierarchy, and motion that respects reduced-motion.

## Why (problem #1)
The owner wants the drawing module "organized with working functions and premium design." p05 made it work; p06 makes it feel premium.

## Context primer (self-contained)
- The modal is rendered inline in `Core:~6130` as `MapDialogShell` with: a `role="toolbar"` of tool buttons (Select/Point/Line/Polygon/Rectangle/Circle), a body (feature list / no-features empty state), and a footer with `Add as layer` / `Fetch data` / `3D buildings` + a meta count (`N drawings / <tool>`).
- Inline styles: `drawModalToolbarStyle`, `drawModalToolBtnBaseStyle`, `drawModalFooterStyle`, `drawModalActionBtnStyle`, etc. (defined in Core near the render).
- The richer body UI lives in `MapDrawingManager.tsx` (`presentation="modal"` / `"embedded"`). Prefer moving structure there over growing Core's inline styles.
- Shared shell: `MapDialogShell.tsx`. Motion: `design/motion.module.css`. Tokens: `mapTokens.ts`.

## Files
- `edit` — `src/centerpanel/components/MapDrawingManager.tsx` — the `modal`/`embedded` presentation body: tool rail, feature list, status line, empty state.
- `edit` — `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx` — the draw modal block (~6130): footer hierarchy, move inline styles into a CSS module or `MapDrawingManager`.
- `reference` — `src/centerpanel/components/map/MapDialogShell.tsx` — reuse its header/footer/drag affordances.
- `create` (optional) — `src/centerpanel/components/MapDrawingManager.module.css` — if extracting styles (allowed; CSS Modules, no Tailwind).
- `reference` — `src/centerpanel/components/map/design/motion.module.css` — animation classes + reduced-motion.

## Do NOT touch / reuse
- Do not regress p05 open behavior or tool activation.
- Reuse `GisStatusChip`, `GisSectionHeader`, `GisEmptyState`, `GisIconButton` from `ui/` rather than bespoke markup.
- Keep the footer actions wired to the SAME handlers (`handleAddDrawingsAsLayer`, `handleOpenFlowDispatchDialog`, scene tab) — p07/p08 deepen them.

## Track A — Functional (support the redesign safely)
### Steps
1. Ensure focus management: opening the modal focuses the tool rail; Escape closes; focus returns to the Draw trigger (reuse `useFocusTrap.ts` if present).
2. Ensure the tool rail exposes `role="toolbar"` with `aria-pressed` per tool and keyboard arrow navigation.
3. Keep footer action disabled-states correct (e.g. `Add as layer`/`Fetch data` disabled when `drawnFeatures.length === 0`).
4. Add/extend a test in `map-drawing-tools.test.ts` asserting a11y roles + disabled-state logic survive the redesign.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts`
- `npm run typecheck`
- `npm run lint:no-tailwind-centerpanel`
- Save summary → `evidence/p06-trackA.md`.

### Done criteria
- a11y roles + disabled-states verified; no open/tool regression; lint clean.

## Track B — Visual
### Steps
1. **Tool rail:** premium segmented control — icon + label, clear active state (use p01 calm tokens / selection tint), thin separators, no rounds.
2. **Status line:** replace the "Tool Select / Features 0 / Selected None" raw row with a single calm summary line (dense type, hairline).
3. **Footer hierarchy:** make `Fetch data` (or the most analytical action) the primary action (filled/accented restrained amber), `Add as layer` secondary, `3D buildings` tertiary/ghost. Right-align the `N drawings / tool` meta.
4. **Empty state:** use `GisEmptyState` ("No drawn features — pick a tool to start").
5. **Motion:** modal entrance/exit via `motion.module.css`; honor reduced-motion (static when reduced).
6. Save `evidence/p06-draw-premium.png` (with features) and `evidence/p06-draw-empty.png`; compare to `baseline/draw-modal.png`.

### Verify
- `screenshot-map-explorer` produced both shots.
- `npm run test:e2e:a11y` (if drawing modal is covered) or note coverage gap.

### Done criteria
- Modal reads premium: clear rail, calm status, real action hierarchy, smooth motion, reduced-motion respected.

## Anti-amnesia exit checklist
- LEDGER: p06 A+B → `done`, phase closed.
- STATE: `phases[p06]` trackA/trackB `done` + evidence.
- Next action → `prompts/p07-aoi-fetch-data.md`.

## Guardrails
- No Tailwind in centerpanel — CSS Modules only. Reuse `ui/` primitives + p01 tokens (no rounds).
- Do not break footer handler wiring (p07/p08 depend on it).
- Both tracks verified before closing.
