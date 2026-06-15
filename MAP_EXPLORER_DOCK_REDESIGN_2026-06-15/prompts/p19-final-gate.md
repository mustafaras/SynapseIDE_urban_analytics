# p19 — Final RC Gate + Visual QA Sweep + Archive

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p19 · **Depends on:** p01–p18 (all) · **Tracks:** A (full gate) + B (before/after + archive)

## Mission
Prove the whole pack landed: run the full validation gate, assemble the before/after visual evidence for all 8 reported problems, and archive the pack per project convention.

## Why
The owner asked for radical, visible, premium changes that are *verified at every step*. p19 is the final, holistic proof and handoff.

## Context primer (self-contained)
- The project RC gate is `npm run validate:rc` (typecheck + lint + test + build + perf:budgets + e2e:ci). The GIS-specific gate is the `check-gis-modal` skill.
- The owner's 8 problems map to: draw first-click (p05), AOI data+analysis (p07/p08), right-dock floating modal + single-click (p09/p10/p12), right single-column (p11), left single-column (p13), Models tab (p14/p15), status bar (p16/p17), badges (p01/p02/p03).

## Files
- `reference` — the entire pack + all redesigned surfaces.
- `create` — `evidence/p19-trackA.md` (gate results), `evidence/p19-before-after.md` (problem-by-problem proof index).

## Do NOT touch / reuse
- Do not start new feature work in p19. Fix only regressions the gate surfaces; if a fix is non-trivial, log it as a follow-up in LEDGER rather than expanding scope.

## Track A — Functional (full gate)
### Steps
1. Run the full gate:
   - `npm run typecheck`
   - `npm run lint:errors`
   - `npm run lint:no-tailwind-centerpanel`
   - `npx vitest run src/centerpanel/components/map`
   - `npm run color:guard`
   - `check-gis-modal` skill
   - (if `src/features/urbanAnalytics/` was touched anywhere) `check-analytics` skill
   - optionally `npm run validate:rc` for the full RC gate.
2. Fix any regressions; if a regression needs a larger change, record it in LEDGER as a follow-up and mark p19 `blocked` with the reason.
3. Write `evidence/p19-trackA.md` with every command's result.

### Verify
- All gate commands pass (or blockers are explicitly logged).

### Done criteria
- Full gate green (or documented blockers). No Tailwind in centerpanel; badge policy enforced; all map specs pass.

## Track B — Visual (before/after + archive)
### Steps
1. Build `evidence/p19-before-after.md`: for each of the 8 problems, link the `baseline/` before shot and the relevant `evidence/` after shot, with a one-line verdict.
2. Capture any final missing after-shots via `screenshot-map-explorer`.
3. Archive: move the entire `MAP_EXPLORER_DOCK_REDESIGN_2026-06-15/` folder to `docs/archive/development-plans/` (per CLAUDE.md). Update the moved `LEDGER.md` with the archival date and final status.

### Verify
- `evidence/p19-before-after.md` covers all 8 problems with before+after; folder archived.

### Done criteria
- Every reported problem has paired before/after proof; pack archived.

## Anti-amnesia exit checklist
- LEDGER: p19 A+B → `done`; set overall status `COMPLETE`; final session-log entry with the archive path.
- STATE: `phases[p19]` trackA/trackB `done`; set `overallStatus="complete"`.

## Guardrails
- No new scope in p19 — gate + proof + archive only.
- Do not mark complete with unresolved gate failures; log blockers explicitly.
- Both tracks verified before closing.
