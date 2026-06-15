# p02 — Badge Cleanup: Right Dock & Dock Frame

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p02 · **Depends on:** p01 · **Tracks:** A (remove chip noise) + B (header shots)

## Mission
Stop the right dock from stamping a status chip onto every panel header regardless of whether there is anything to report. Status should appear only when it carries real meaning (a QA caveat, a running workflow), never as decorative "ready"/"Primary".

## Why (problem #8)
`MapRightDockHost` currently shows a `GisStatusChip` for the active route in the frame's `actions` slot. The chip is derived from tier (`TIER_STATUS.primary = "ready"`, `advanced = "generated"`, etc.), so every primary panel reads "ready" and contextual panels read "caveat" with no actual condition behind them. This is the exact noise the owner called out.

## Context primer (self-contained)
- `MapRightDockHost.tsx` (~117-148) defines `TIER_LABELS`, `TIER_STATUS`, `PANEL_STATUS`, and `getRouteStatus(panel)`. `getRouteStatus` falls back to the tier status for any panel without an explicit `PANEL_STATUS` entry, so it ALWAYS returns something.
- The chip is rendered in the `actions` prop passed to `MapDockPanelFrame` (~353-361): `<GisStatusChip status={routeStatus.status} label={routeStatus.label} ... />`.
- `MapDockPanelFrame.tsx` (`shell/`) renders whatever `actions` it receives next to the title.
- After p01, chips are already calm/square; p02 removes the *unconditional* ones.

## Files
- `edit` — `src/centerpanel/components/map/MapRightDockHost.tsx` — `TIER_STATUS`, `PANEL_STATUS`, `getRouteStatus`, the `actions` chip (~117-361).
- `reference` — `src/centerpanel/components/map/shell/MapDockPanelFrame.tsx` — confirms how `actions` renders.
- `reference` — `src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx` — keep green; update assertions that expect the old chip.

## Do NOT touch / reuse
- Reuse `GisStatusChip` for the cases that DO keep a chip; do not invent a new badge.
- Do not remove the pin/overflow icon buttons; only the meaningless status chip changes.

## Track A — Functional
### Steps
1. Replace `getRouteStatus` semantics: return a chip **only** when the panel has a real, current condition. Concretely, drive it from live signals available to the host (e.g. an optional prop the host already receives, or `PANEL_STATUS` reserved for genuinely stateful panels like `problems` → QA count, `workflow` → running, `report` → publish-blocked). When there is no condition, return `null` and render **no chip** (not a "ready" chip).
2. Delete the tier→status fallback (`TIER_STATUS`) so "primary" no longer maps to "ready". Keep `TIER_LABELS` only if still used for the `activeWorkspaceName`/subtitle; otherwise remove.
3. In the `actions` slot, render the chip conditionally (`{routeStatus ? <GisStatusChip .../> : null}`). Preserve the pin and overflow buttons.
4. If the host lacks live signals to decide a real status, thread a minimal `panelStatus?: { status: GisStatusKey; label: string } | null` prop from the caller (`MapRightDockHost` consumers in the View) instead of fabricating one. Keep it optional (`exactOptionalPropertyTypes`).
5. Update `MapRightDockHost.test.tsx` to assert: primary panels render NO status chip by default; a panel given a real condition renders exactly one calm chip.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx`
- `npx vitest run src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts`
- `npm run typecheck`
- Save summary → `evidence/p02-trackA.md`.

### Done criteria
- No right-dock panel shows a "ready"/"Primary" chip without an actual condition. Tests updated and green. typecheck clean.

## Track B — Visual
### Steps
1. Screenshot the right dock on a primary panel (Inspector/Style) — header should have title + pin + overflow, NO status chip.
2. Screenshot a panel that DOES have a condition (e.g. QA/Problems with issues) — exactly one calm chip.
3. Save `evidence/p02-right-dock-clean.png` and `evidence/p02-right-dock-condition.png`; compare to `baseline/right-dock.png`.

### Verify
- `screenshot-map-explorer` produced both shots.

### Done criteria
- Visual confirms headers are quiet by default and only show a chip when meaningful.

## Anti-amnesia exit checklist
- LEDGER: p02 A+B → `done`, phase closed, session-log entry.
- STATE: `phases[p02]` trackA/trackB `done` + evidence.
- Next action → `prompts/p03-badge-global.md`.

## Guardrails
- No Tailwind in centerpanel. `exactOptionalPropertyTypes` for the new optional prop.
- Reuse `GisStatusChip`; do not reintroduce pills/rounds.
- Both tracks verified before closing.
