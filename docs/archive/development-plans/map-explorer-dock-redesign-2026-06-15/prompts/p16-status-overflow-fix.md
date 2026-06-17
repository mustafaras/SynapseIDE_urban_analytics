# p16 — Status Bar Overflow Correctness Fix

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p16 · **Depends on:** p00 · **Tracks:** A (overflow correctness + test) + B (support shots)

## Mission
Fix the status bar "More" overflow so that every segment that doesn't fit is correctly moved into the overflow popover and rendered there — nothing hidden, nothing duplicated, nothing clipped.

## Why (problem #7)
The owner: *"when I click 'More' in the status bar, the items that aren't visible don't show up properly."* The overflow measurement/partition is buggy.

## Context primer (self-contained)
- `MapStatusBar.tsx` computes `{ visibleSegments, overflowSegments }` (~998-1045) from `availableWidth` minus a fixed `overflowTriggerWidth = 92`, partitioning segments by an estimated width budget. The "More" popover renders `overflowSegments` (~1139-1199) and closes on outside click (~1049-1071). `data-map-status-overflow*` markers exist for tests.
- Host: `controllers/MapStatusBarWithCursor.tsx`. Existing test: `__tests__/MapStatusBarRoutes.test.tsx`.
- Likely bugs: per-segment width is estimated, not measured, so the budget mis-partitions; the fixed trigger width is wrong when labels vary; segments may be both counted as visible and overflow, or dropped entirely; popover may not render segments that lack a render branch.

## Files
- `edit` — `src/centerpanel/components/map/MapStatusBar.tsx` — `visibleSegments`/`overflowSegments` computation (~998-1045) and popover render (~1139-1199).
- `reference` — `src/centerpanel/components/map/controllers/MapStatusBarWithCursor.tsx` — host/measurement context.
- `create` — `src/centerpanel/components/map/__tests__/mapStatusBarOverflow.test.ts` — overflow partition correctness.
- `reference` — `src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx` — keep green.

## Do NOT touch / reuse
- Keep `data-map-status-overflow*` test hooks (other tests rely on them).
- No Tailwind.

## Track A — Functional
### Steps
1. Make the partition robust: prefer actual measurement (ResizeObserver / measured segment widths) over fixed estimates, OR if estimating, ensure the algorithm is exhaustive and disjoint — every segment is in EXACTLY one of `visibleSegments`/`overflowSegments`, and the overflow trigger width is accounted for only when overflow exists.
2. Ensure the popover renders ALL `overflowSegments` with the same content each segment has inline (every segment type has a render branch in the popover). No segment silently missing.
3. Fix edge cases: 0 overflow (no trigger), all overflow (very narrow), label width variance, and re-measure on container resize.
4. Write `mapStatusBarOverflow.test.ts`: at several widths, assert visible ∪ overflow = all segments, visible ∩ overflow = ∅, and the popover lists exactly `overflowSegments`.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/mapStatusBarOverflow.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx`
- `npm run typecheck`
- Save summary → `evidence/p16-trackA.md`.

### Done criteria
- Overflow partition is exhaustive + disjoint at all widths; popover shows every overflow segment; edge cases handled. Tests green; typecheck clean.

## Track B — Visual (support)
### Steps
1. Narrow the viewport so overflow triggers; open "More"; screenshot showing ALL hidden segments present. Save `evidence/p16-status-more.png`. Compare to `baseline/status-bar-more.png`.

### Verify
- `screenshot-map-explorer` produced the shot.

### Done criteria
- Visual proves no segment is missing from the More popover.

## Anti-amnesia exit checklist
- LEDGER: p16 A+B → `done`, phase closed.
- STATE: `phases[p16]` trackA/trackB `done` + evidence.
- Next action → `prompts/p17-status-premium.md`.

## Guardrails
- Keep `data-map-status-overflow*` hooks. No Tailwind. `exactOptionalPropertyTypes`.
- Both tracks verified before closing.
