# Start Here - Color System Agent

## Purpose

This is the single entry file for any agent implementing color-system work. It is optimized for small agents with limited context windows.

## One-Line Instruction

```text
Read the color protocol, read the unit matrix, select the first incomplete prompt from the color ledger, implement only that prompt, validate narrowly, update the ledger, and stop.
```

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

## Next Prompt Discovery

Manual method:

1. Open `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`.
2. Find the `Prompt Status Register` table.
3. Select the first prompt whose status is not `completed` or `skipped_with_reason`.
4. If the next prompt is `blocked`, do not skip it unless the user explicitly instructs a targeted deviation.

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
4. Confirm whether the prompt touches `src/features/urbanAnalytics/**`; if yes, read `.github/instructions/urban-analytics.instructions.md`.
5. Update the ledger status to `in_progress` if documentation updates are allowed.

## During Editing

1. Keep the change color-scoped.
2. Use existing token/theme/CSS Module/styled-components patterns.
3. Do not introduce Tailwind.
4. Do not change workflows, data contracts, GIS calculations, persistence behavior, or evidence semantics.
5. Do not make demo, unknown, stale, blocked, invalid, or deferred states look ready.
6. Keep data visualization palettes separate from UI chrome/status tokens.

## Before Final Response

1. Run validation required by the active prompt.
2. Update `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`.
3. Record exact files inspected and changed.
4. Record tokens added/used/deferred.
5. Record validation commands and results.
6. Record next prompt.

## Stop Conditions

Stop and report if:

- The task requires resolving the local `master` / `origin/master` divergence.
- A prompt would require moving or archiving `DEVELOPMENT_PLANS/`.
- The right owner module is unclear.
- Contrast or status truthfulness cannot be preserved.
- Product logic must change to complete a color-only prompt.
