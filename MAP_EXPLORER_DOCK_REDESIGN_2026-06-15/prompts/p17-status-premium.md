# p17 — Status Bar Premium VS Code Interactions

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p17 · **Depends on:** p16 · **Tracks:** A (interaction behavior) + B (premium shots)

## Mission
Make the whole status bar feel like a premium VS Code status bar: segments are practical, clickable, hover-affordant, grouped sensibly, and route into the right Map Explorer surfaces — calm, dense, and consistent.

## Why (problem #7)
The owner: *"all the status bar's interactions with Map Explorer should be made practical, premium, and functional in the premium VS Code design philosophy."*

## Context primer (self-contained)
- `MapStatusBar.tsx` renders segments (cursor coords, view zoom, scale, project, CRS warnings, etc.) and the More popover (fixed in p16). Segments already route via `MapRightDockRouteSource: "status-bar"` (`mapRightDockRoutes.ts`).
- Host: `controllers/MapStatusBarWithCursor.tsx`. Existing routing test: `__tests__/MapStatusBarRoutes.test.tsx`.
- VS Code idiom: compact segments, hover highlight, click → action (open relevant panel/route), keyboard-focusable, tooltips, left/right grouping, hairline dividers, no rounds, no saturated colors (reuse p01 tokens).

## Files
- `edit` — `src/centerpanel/components/map/MapStatusBar.tsx` — segment interaction model, hover/focus states, grouping, dividers, tooltips.
- `edit` — `src/centerpanel/components/map/controllers/MapStatusBarWithCursor.tsx` — wire segment clicks to routes/actions where missing.
- `reference` — `src/centerpanel/components/map/mapRightDockRoutes.ts` — `status-bar` route source.
- `edit` — `src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx` — assert each interactive segment routes to the right surface.

## Do NOT touch / reuse
- Reuse the route model (status-bar source) and p01 tokens. No new badge shapes.
- Keep p16 overflow correctness intact.
- No Tailwind.

## Track A — Functional
### Steps
1. Make every actionable segment a real button (role/button, keyboard focusable, `aria-label`, tooltip) that performs a sensible action: CRS warnings → open QA/problems route; scale/zoom → view controls; selection count → selection panel; project → project/overview; etc.
2. Group segments left (context: cursor/zoom/scale) vs right (state/actions: CRS, selection, performance, More) with hairline dividers — VS Code style.
3. Ensure non-actionable segments are clearly inert (no hover affordance), so interactivity is honest.
4. Update `MapStatusBarRoutes.test.tsx` to assert each interactive segment opens the correct route/surface and is keyboard-operable.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx`
- `npx vitest run src/centerpanel/components/map/__tests__/mapStatusBarOverflow.test.ts`
- `npm run typecheck`
- `npm run lint:no-tailwind-centerpanel`
- `npm run test:e2e:a11y` (status bar is keyboard-critical) or note coverage.
- Save summary → `evidence/p17-trackA.md`.

### Done criteria
- Actionable segments route correctly and are keyboard-operable; inert segments are visibly inert; grouping is VS Code-like. Tests green; lint + typecheck clean.

## Track B — Visual
### Steps
1. Screenshot the status bar at comfortable width (grouped, hover state) and narrow width (with the corrected More popover). Save `evidence/p17-status-bar.png`, `evidence/p17-status-hover.png`, `evidence/p17-status-more.png`. Compare to `baseline/status-bar-more.png`.

### Verify
- `screenshot-map-explorer` produced the shots.

### Done criteria
- Visual proves a calm, premium, practical VS Code-style status bar.

## Anti-amnesia exit checklist
- LEDGER: p17 A+B → `done`, phase closed (status-bar track p16→p17 complete).
- STATE: `phases[p17]` trackA/trackB `done` + evidence.
- Next action → `prompts/p18-consistency-pass.md`.

## Guardrails
- Reuse route model + p01 tokens. No rounds/saturated colors. No Tailwind. `exactOptionalPropertyTypes`.
- Honest interactivity (don't make inert text look clickable).
- Both tracks verified before closing.
