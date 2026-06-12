# Prompt 10 — Full regression and visual QA pass

## Goal
Finish with a strict regression gate that proves the redesign is visible, accessible, and behavior-safe.

## Read first
- `AGENTS.md`
- `MAP_PREMIUM/mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md` sections 17, 18, 20, 21
- `MAP_PREMIUM/LEDGER.md`
- The prompt-specific files changed in prompts 01 through 09
- The highest-risk Map Explorer tests named in the plan

## Task
1. Run the narrowest test set that proves the shell redesign, the menu surface, the left panel, the right dock, the canvas chrome, the status/drawer area, and the advanced panels all still work.
2. Run accessibility, reduced-motion, forced-colors, and visual-blankness checks where they exist.
3. Confirm that no critical action became unreachable.
4. Summarize the remaining risks honestly.

## Hard constraints
- Do not treat a passing visual test as enough if a core action is hidden or broken.
- Do not claim readiness unless the required validation commands actually passed.
- Do not ignore obvious overlap, focus, or reachability regressions.

## Validation checklist
- `typecheck`
- `lint:errors`
- `lint:no-tailwind-centerpanel` if any centerpanel CSS changed
- targeted vitest suites for touched Map Explorer surfaces
- targeted Playwright e2e coverage for the visible UI changes
- build if the repo’s local workflow expects it for final verification

## Output
- A concise closeout note with what changed, what was tested, and what residual risk remains
- A final ledger update that marks the prompt complete only if the gate passed

## Visible acceptance
The final state must be easy to explain: the modal is cleaner, more map-first, and more premium, while all core GIS workflows remain reachable and test-backed.