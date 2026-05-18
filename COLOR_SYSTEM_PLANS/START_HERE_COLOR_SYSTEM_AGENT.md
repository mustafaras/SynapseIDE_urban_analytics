# Start Here - Color System Agent

## Purpose

This is the single entry file for any agent implementing the active three-part color-system workstream.

## One-Line Instruction

```text
Read the color protocol, read the active unit matrix, select the first incomplete active prompt from the color ledger, implement only that prompt, validate narrowly, update the ledger, and stop.
```

## Active Priority

1. Complete `A01`-`A10`: Urban Analytics modal.
2. Then complete `C01`-`C10`: Center Panel Workbench excluding Map Explorer files.
3. Then complete `B01`-`B15`: Map Explorer.

Do not start a `C` prompt while any `A` prompt remains pending, in progress, or blocked unless the user explicitly instructs a targeted deviation. Do not start a `B` prompt while any `C` prompt remains pending, in progress, or blocked unless the user explicitly instructs a targeted deviation.

## Required Reading Order

Read these files in order:

1. `COLOR_SYSTEM_PLANS/README.md`
2. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
3. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
4. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
5. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
6. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
7. The active prompt block in `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
8. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md` before finishing

If the prompt touches `src/features/urbanAnalytics/**`, also read `.github/instructions/urban-analytics.instructions.md`.

## Next Prompt Discovery

Manual method:

1. Open `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`.
2. Find the active `Prompt Status Register` table.
3. Select the first prompt whose status is not `completed` or `skipped_with_reason`.
4. If the next prompt is `blocked`, do not skip it unless the user explicitly instructs a targeted deviation.

Current active next prompt:

```text
C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector
```

## Valid Prompt Status Values

- `pending`
- `in_progress`
- `completed`
- `blocked`
- `skipped_with_reason`

## Before Editing

1. Check `git status --short`.
2. Confirm the active prompt ID and title.
3. Read only the files named by the active prompt plus directly imported style files.
4. Run the prompt's pre-edit amber scan.
5. Confirm whether the prompt touches `src/features/urbanAnalytics/**`; if yes, read `.github/instructions/urban-analytics.instructions.md`.
6. Update the ledger status to `in_progress` if documentation updates are allowed.

## During Editing

1. Keep the change color/chrome/layout-density scoped.
2. Use existing token/theme/CSS Module/styled-components/inline-style patterns.
3. Do not introduce Tailwind.
4. Do not change workflows, data contracts, GIS calculations, persistence behavior, or evidence semantics.
5. Do not make demo, unknown, stale, blocked, invalid, residual-gap, environment-dependent, or deferred states look ready.
6. Keep data visualization palettes separate from UI chrome/status tokens.
7. Remove unnecessary card frames and button fills in the active scope.
8. Remove amber/gold/yellow/orange UI chrome from the active scope.

## Before Final Response

1. Run validation required by the active prompt.
2. Re-run the prompt's amber scan.
3. Update `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`.
4. Record exact files inspected and changed.
5. Record tokens added/used/deferred.
6. Record validation commands and results.
7. Record next prompt.

## Stop Conditions

Stop and report if:

- The task requires resolving the local `master` / `origin/master` divergence.
- A prompt would require moving or archiving `DEVELOPMENT_PLANS/`.
- The right owner module is unclear.
- Contrast, focus visibility, or status truthfulness cannot be preserved.
- Product logic must change to complete a color-only prompt.
