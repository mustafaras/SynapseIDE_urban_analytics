# p03 — Badge Cleanup: Workspaces, Scene Strips & Tables (Global De-Roundification)

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p03 · **Depends on:** p01 · **Tracks:** A (de-round + empty allowlist) + B (sweep shots)

## Mission
Eliminate every remaining round (`borderRadius: 999/50%`) status dot/pill across Map Explorer, converting them to calm square/hairline treatments, and shrink the p01 policy-test allowlist to empty so the rule becomes permanently enforced.

## Why (problem #8)
The round red/green dots the owner dislikes are inline radii scattered across workspace, scene, and table files — not in the shared chip primitive. They must all become the calm hairline language established in p01.

## Context primer (self-contained)
- p01 created `__tests__/mapBadgePolicy.test.ts` with an explicit allowlist of files still containing round radii. p03's job is to fix each file and delete it from the allowlist until the list is empty and the test enforces zero round badges.
- Replacement pattern: a circular status dot → either a `GisStatusChip` (text-toned, square) or a 1px hairline square/tick. Never a saturated fill.

## Files (confirmed offenders — re-scan to refresh)
Re-scan first: search `borderRadius:\s*(999|9999|"50%"|'50%')` under `src/centerpanel/components/map`. Expected offenders (2026-06-15):
- `edit` — `src/centerpanel/components/map/style/MapStyleWorkspace.tsx`
- `edit` — `src/centerpanel/components/map/ui/GisProgressBar.tsx` *(progress fill rounding may be intentional — see step 3)*
- `edit` — `src/centerpanel/components/map/table/MapAttributeTable.tsx`
- `edit` — `src/centerpanel/components/map/scene3d/SunShadowPanel.tsx`
- `edit` — `src/centerpanel/components/map/scene3d/Scene3DInteractionStrip.tsx`
- `edit` — `src/centerpanel/components/map/scene3d/ScenarioComparisonStrip.tsx`
- `edit` — `src/centerpanel/components/map/review/MapReviewSidebar.tsx`
- `edit` — `src/centerpanel/components/map/processing/MapProcessingToolboxPanel.tsx`
- `edit` — `src/centerpanel/components/map/problems/MapProblemsPanel.tsx`
- `edit` — `src/centerpanel/components/map/MapSwipeCompareOverlay.tsx`
- `edit` — `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `edit` — `src/centerpanel/components/map/__tests__/mapBadgePolicy.test.ts` (shrink allowlist to empty).

## Do NOT touch / reuse
- Reuse `GisStatusChip` and p01 tokens. Do not create a new badge component.
- Do not redefine shared contracts/fixtures.

## Track A — Functional
### Steps
1. For each offender, locate the round element. If it is a **status dot** (red/green/amber circle), replace with a calm square chip or hairline marker driven by p01 tokens. If it is a **decorative pill** around a label, square it (radius 0 or `MAP_RADIUS.badge`).
2. Distinguish genuinely non-status rounds: `GisProgressBar` end-caps, draggable handles, avatar/presence dots in `MapReviewSidebar` (collaboration presence may legitimately be a small dot). For those, either (a) keep but exempt via a NARROW, documented allowlist entry that explains why, or (b) square them if they read as status. Prefer squaring status; keep true affordance handles. Document each kept exemption inline and in the test.
3. After fixing each file, remove it from the `mapBadgePolicy.test.ts` allowlist. Goal: allowlist empty (or only documented non-status affordances remain, asserted explicitly by purpose, not by file).
4. Run typecheck + the policy test + each affected component's existing test.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/mapBadgePolicy.test.ts`
- `npx vitest run src/centerpanel/components/map` (catch regressions in the edited components)
- `npm run typecheck`
- `npm run color:guard`
- Save summary → `evidence/p03-trackA.md`.

### Done criteria
- `mapBadgePolicy.test.ts` passes with an EMPTY round-badge allowlist (or only explicitly-justified affordance exemptions). All map specs green. typecheck + color:guard clean.

## Track B — Visual
### Steps
1. Screenshot each surface family after the change: Style workspace, a scene strip (Sun/Shadow or Interaction), the attribute table, the problems panel, the review timeline.
2. Save as `evidence/p03-<surface>.png` and compare to `baseline/badges.png` and `baseline/*` where applicable. Confirm no round red/green dots remain.

### Verify
- `screenshot-map-explorer` produced the surface shots.

### Done criteria
- No round status badges visible on any captured surface; status reads as calm hairline labels.

## Anti-amnesia exit checklist
- LEDGER: p03 A+B → `done`, phase closed; session-log notes "badge policy now fully enforced (allowlist empty)".
- STATE: `phases[p03]` trackA/trackB `done` + evidence.
- Next action → `prompts/p04-dock-state-unification.md`.

## Guardrails
- No Tailwind in centerpanel. Reuse `GisStatusChip`/p01 tokens.
- Keep true affordance handles (sliders, drag grips) — only de-round STATUS shapes.
- Both tracks verified before closing.
