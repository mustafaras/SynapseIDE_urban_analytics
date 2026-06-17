# Evidence — p01 (Status-language & de-roundification token foundation)

**Run:** 2026-06-15 · **Both tracks complete**

## Changes made (production code)
1. `src/centerpanel/components/map/mapTokens.ts`
   - Added `MAP_RADIUS.badge` (= geometric/0) as the single source of truth for status-chip corners.
   - Retuned `MAP_STATUS_TOKENS`: removed all saturated green/red **fills and borders**. Status now reads via a **muted text tone**; fills are `neutralSubtle`, borders are hairlines.
     - `ready.text` → `MAP_STATUS_TONE_SUCCESS` (= `color-mix(success 60%, textSecondary)`), `bg`/`border` → neutral/hairline.
     - `blocked.text` & `external-offline.text` → `MAP_STATUS_TONE_ERROR` (= `color-mix(error 60%, textSecondary)`), `bg`/`border` → neutral/hairline. (Kept equal per the token contract.)
     - `external`, `stale` → neutral `bg`; `caveat`/`running` (amber/interaction accents) and the provenance triplets (demo/synthetic/generated/external/metadata-only distinctness) preserved.
2. `src/centerpanel/components/map/ui/GisStatusChip.tsx` — both `borderRadius: 0` → `borderRadius: MAP_RADIUS.badge` (single source of truth); imported `MAP_RADIUS`.
3. **New test** `src/centerpanel/components/map/__tests__/mapBadgePolicy.test.ts`:
   - **Hard rule (enforced now):** no status `bg`/`border` contains `--syn-status-valid` / `--syn-status-error`; `ready.text != blocked.text`; `blocked.text == external-offline.text`.
   - **Round-shape budget (shrinking allowlists, driven by p03):** `ROUND_TOKEN_ALLOWLIST` (16 `MAP_RADIUS.full` files) + `ROUND_LITERAL_ALLOWLIST` (4 files: `MapRightDockHost.module.css`, `MapWorkspaceOverviewSummary.module.css`, `problems/MapProblemsPanel.tsx`, `shell/MapPremiumShell.module.css`). Asserts no NEW offenders outside the lists and no stale entries.
4. `src/centerpanel/components/map/__tests__/__snapshots__/mapTokenStatus.test.ts.snap` — refreshed (`-u`) to match the intentional token retune.

## CORRECTIONS vs the original plan (important for p03)
- Round badges come from **`MAP_RADIUS.full` in 16 files** (not 11) + literal radii in 4 files (incl. 3 CSS modules). The original 11-file list (the `borderRadius:`-prefixed subset) was incomplete. The policy test's allowlists are now the authoritative de-roundification backlog.
- Many `MAP_RADIUS.full` uses are **legitimate affordances** (legend swatches, progress-bar caps, toolbar, canvas markers) — p03 must de-round STATUS shapes only and may keep documented affordances in the allowlist. The policy test therefore enforces the **token colour rule hard** and tracks shapes via a shrinking allowlist (rather than a blanket round ban).

## Verification
| Check | Command | Result |
|---|---|---|
| Policy test | `vitest run mapBadgePolicy.test.ts` | **PASS** (5 tests) |
| Token test + snapshot | `vitest run mapTokenStatus.test.ts` (`-u`) | **PASS** (18 tests; snapshot updated) |
| Typecheck | `npm run typecheck` | **PASS** |
| Color guard | `npm run color:guard` | **PASS** (exit 0) |
| Full map suite | `vitest run src/centerpanel/components/map` | **830 / 831 pass** — only failure is the documented pre-existing `mapShellPrimitives` `MAP_PRIMARY_ACTIVITY_ORDER` drift (p00); **no new regressions** from the token/chip change. |

## Track B — visual proof
- `evidence/p01-status-language.png` (Models tab, the most chip-dense surface; same surface as `baseline/badges.png`).
- Before (`baseline/badges.png`): saturated red "Blocked"/"Needs input", bright green "All steps ready", colored "0 steps"/"0 selected".
- After (`p01-status-language.png`): all chips calm — muted clay text for blocked states, soft muted-green for ready, neutral chips with hairline borders; **no saturated red/green fills**.
- Note: the text **overlap** in the Models tab persists — that is the dual-column cramming bug owned by **p14/p15**, not p01 (p01 only retunes badge colour/geometry).

## Verdict
p01 complete. The calm status-language foundation + enforcement test are in place; p02 (remove right-dock chip noise) and p03 (de-round STATUS shapes, shrink the allowlists) can now build on it.
