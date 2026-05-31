---
name: next-gis-prompt
description: Execute or resume the active GIS Modal Premium UI Redesign prompt ladder from GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31. Use when asked to do the next GIS prompt, continue the GIS modal plan, advance the premium Map Explorer UI pack, resume the GIS modal pack, or implement a specific gis-modal-ui/pNN prompt.
---

# Execute the GIS Modal Premium UI Pack

This skill is for the fresh `GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/` pack. Do not resume the archived Map Explorer Production GIS ladder unless the user explicitly asks for historical audit context.

## Pack Files

- Plan: `GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/GIS_MODAL_PREMIUM_UI_REDESIGN_PLAN.md`
- Prompts: `GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/01_AGENT_EXECUTION_PROMPTS.md`
- Ledger: `GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/LEDGER.md`
- Historical archive entry point: `docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/README.md`

## Start Protocol

1. Read `AGENTS.md`, the pack cold-start block, `LEDGER.md`, and the selected prompt body.
2. Choose the lowest-numbered incomplete prompt in the ledger unless the user names a prompt.
3. Read only the plan sections referenced by that prompt, the Premium Prompt Matrix row, and the Files Expected row.
4. Run:

```bash
git status --short
git branch --show-current
git log --oneline -5
```

5. Work from the integration branch `gis-modal-ui/premium-redesign`. If it does not exist, create it from the agreed base, normally `origin/master`.
6. Create the prompt branch named in the ledger, for example `gis-modal-ui/p01-inventory`.

## Prompt Selection Rules

- `[ ]` means ready if dependencies are satisfied.
- `[~]` means resume only after reading the ledger notes and current branch state.
- `[!]` means do not continue blindly; resolve or record the blocker first.
- `[x]` means complete; do not reopen unless the user explicitly requests a correction.
- Prompt 56 runs last.
- Prompts 22-56 are the preferred detailed implementation ladder when broad prompts 01-21 are too coarse.

Use `rg` instead of loading the full prompt file:

```bash
rg "^## Prompt 0?1|^## Prompt 22|^## Premium Prompt Matrix" GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/01_AGENT_EXECUTION_PROMPTS.md
```

## Implementation Guardrails

- Keep the map canvas primary.
- Keep every current GIS command reachable through the activity rail, command center, sidebar, inspector, bottom panel, canvas controls, or palette.
- Keep command palette coverage complete when hiding toolbar buttons.
- Keep missing CRS, user-declared CRS, demo, synthetic, sample, generated, metadata-only, unavailable, external, noData, vertical datum, and QA blocker states visible.
- Use `src/centerpanel/components/map/mapTokens.ts`, existing GIS primitives under `src/centerpanel/components/map/ui/`, and CSS Modules.
- Do not add Tailwind to `centerpanel/`.
- Do not persist heavy geometry, source bytes, raster cells, 3D payloads, or worker tables in UI layout state.
- Do not touch Urban Analytics or Synapse IDE unless a typed bridge compatibility issue forces it.

## Ledger Discipline

Update `LEDGER.md` in the same commit as the prompt work.

Before marking `[x]`, confirm:

- prompt validation ran or an exact blocker is logged
- changed files match the prompt scope
- premium UI proof is recorded when UI changed
- reduced-motion or high-contrast proof is recorded when relevant
- prompt branch is pushed
- integration branch is fast-forwarded and pushed
- Current Pointer is updated

If any closeout item fails, mark `[!]` and record the blocker instead of marking complete.

## Validation

Run prompt-specific commands first. Common fallback:

```bash
npm run typecheck
npm run lint:errors
npm run lint:no-tailwind-centerpanel
npx vitest run src/centerpanel/components/map
npm run test:e2e -- e2e/map-modal-layout.spec.ts
npm run build
```

For `src/services/map/` changes:

```bash
npx vitest run src/services/map
```

For forced Urban Analytics bridge changes:

```bash
npm run typecheck
npm run test:analytics
```

## Closeout

Commit message pattern:

```bash
feat(gis-modal-ui): pNN short-title
test(gis-modal-ui): pNN short-title
docs(gis-modal-ui): pNN short-title
```

Push the prompt branch, fast-forward `gis-modal-ui/premium-redesign`, push integration, then give a short final response with files changed, validation, branch/commit/push status, and residual risk.
