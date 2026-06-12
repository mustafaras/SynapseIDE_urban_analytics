# Prompt 01 — Audit and lock the baseline

You are working in the Map Explorer workspace. This is a prompt-ladder task, not a feature brainstorm.

## Goal
Create a baseline inventory before any redesign work. Lock the current surfaces, the owning files, the tests, and the highest-risk seams so later prompts can move fast without guessing.

## Read first
- `AGENTS.md`
- `CLAUDE.md`
- `MAP_PREMIUM/mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md`
- `MAP_PREMIUM/LEDGER.md`
- The current Map Explorer shell, docking, toolbar, status, right-dock, left-panel, canvas and store files named in the plan

## Task
1. Inspect the canonical Map Explorer surfaces and confirm which files own the visible shell, menu/command surface, left panel, right dock, canvas chrome, bottom/status area, and responsive shell boundaries.
2. Record the current behavior boundaries in the ledger without changing runtime behavior.
3. Identify the shortest test list that proves the baseline is still intact.
4. Write a brief implementation note that names the critical UI surfaces and the main risk areas for the next prompt.

## Hard constraints
- Do not change production behavior.
- Do not delete or rename features.
- Do not edit services unless a non-behavioral note is absolutely necessary.
- Keep the work local to Map Explorer and the prompt/ledger files.
- Prefer concrete, file-backed observations over general statements.

## Deliverable
A short inventory note plus an updated ledger entry that answers:
- what surfaces exist now
- what must not regress
- what tests will guard the shell redesign
- what files are the highest-risk edit points

## Validation
- Run the cheapest local validation that confirms no runtime behavior changed.
- If a test file is available for the baseline surfaces, run only the narrowest relevant subset.
- Record the commands and their outcome in the ledger.

## Visible acceptance
The user should be able to read this prompt and understand exactly which code surfaces are safe to touch next, with no ambiguity about the canonical shell files.