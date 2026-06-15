# p11 — Right-Panel Single-Column Conversion

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p11 · **Depends on:** p10 · **Tracks:** A (content reflow) + B (single-column shots)

## Mission
Replace the two-column layouts inside right-dock panels with a single, vertical, premium content flow that reads cleanly in the floating modal at any width.

## Why (problem #4)
The owner: *"remove the dual-column approach in the right panel and develop a single-column, fluid, premium, legible design philosophy."* Two columns crammed into a 260–520px dock are unreadable.

## Context primer (self-contained)
- Right-dock panel bodies are routed by `controllers/MapRightDockBodyContent.tsx` (panel id → content node).
- Several panel bodies use `grid-template-columns: 1fr 1fr` (or similar two-up grids) in their CSS modules / inline styles. Find them by scanning the right-dock-rendered components for `gridTemplateColumns` / `1fr 1fr` / `columns`.
- Design language: dense type, section headers (`GisSectionHeader`), hairline separators, vertical rhythm; no cards-in-cards.

## Files
- `edit` — `src/centerpanel/components/map/controllers/MapRightDockBodyContent.tsx` — confirm which components render per panel; adjust container layout.
- `edit` — the right-dock panel bodies that use two columns (scan to enumerate; likely candidates include inspector/style/selection/report bodies and their `*.module.css`).
- `reference` — `src/centerpanel/components/map/MapRightDockHost.module.css` — body wrapper.
- `reference` — `src/centerpanel/components/map/ui/GisSectionHeader.tsx`, `ui/GisPropertyGrid.tsx` — use property grid for label/value pairs instead of free two-column.
- `edit` — `src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts` or a body-layout test — assert single-column structure where feasible.

## Do NOT touch / reuse
- Use `GisPropertyGrid` for dense label/value pairs (that is the sanctioned "two-up within a row" pattern) — but the PANEL itself flows single-column.
- Do not reintroduce dual-column section layouts.
- No Tailwind.

## Track A — Functional
### Steps
1. Enumerate right-dock panel bodies that use a two-column section layout. For each, restructure to a single vertical column: stacked sections, each with a `GisSectionHeader` and hairline separator.
2. Where the two columns were "label | value" pairs, convert to `GisPropertyGrid`/`GisDensePropertyRow` (these stay readable single-column).
3. Ensure content reflows correctly across the floating-modal width range (260–520+). No horizontal scroll; no clipped columns.
4. Keep all existing data/handlers; this is layout-only.
5. Add/extend a test asserting the converted bodies expose a single primary column (e.g. query by structure/test id) and that property rows use the grid primitive.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts`
- `npx vitest run src/centerpanel/components/map` (catch body regressions)
- `npm run typecheck`
- `npm run lint:no-tailwind-centerpanel`
- Save summary → `evidence/p11-trackA.md`.

### Done criteria
- No right-dock panel uses a two-column section layout. Content reflows cleanly across widths. Tests green; lint + typecheck clean.

## Track B — Visual
### Steps
1. Screenshot each converted panel (Inspector, Style, Selection, Report, etc.) at a narrow and a wide floating width. Save `evidence/p11-<panel>-narrow.png` / `-wide.png`. Compare to `baseline/right-dock.png`.

### Verify
- `screenshot-map-explorer` produced the shots.

### Done criteria
- Visual proves single-column, fluid, premium right panels at all widths.

## Anti-amnesia exit checklist
- LEDGER: p11 A+B → `done`, phase closed; session-log lists the panels converted.
- STATE: `phases[p11]` trackA/trackB `done` + evidence.
- Next action → `prompts/p12-right-dock-motion.md`.

## Guardrails
- Single-column panels; `GisPropertyGrid` for label/value density. No cards-in-cards. No Tailwind.
- Layout-only — preserve data + handlers.
- Both tracks verified before closing.
