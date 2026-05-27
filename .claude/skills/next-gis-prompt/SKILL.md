---
name: next-gis-prompt
description: Resume the Map Explorer Production GIS prompt ladder from a cold start. Use when asked to "do the next GIS prompt", "continue the map explorer plan", "advance the production GIS plan", or "what's next in the GIS pack".
---

# Resume the Map Explorer Production GIS Prompt Ladder

The active operating pack is `MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/`. This skill boots you safely from a cold start and advances to the next unfinished prompt.

## Step 1 — Read the ledger first

```
MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/LEDGER.md
```

Read **only this file** first. It tells you:
- Which prompts are done (`[x]`), in progress (`[~]`), or TODO (`[ ]`)
- The cold-start resume steps (top of file)
- The Done Log (what was merged and why)
- Drift notes (known deviations from the original spec)

**Current state (as of last CLAUDE.md update):** Prompts 0–22 complete. Next is Prompt 23 — performance budgets + render diagnostics.

## Step 2 — Read the Agent Contract

Open `MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/15_AGENT_EXECUTION_PROMPTS.md` and read:

1. **"⚠️ Cold-start protocol (anti-amnesia)"** — copy the BOOT BLOCK
2. **"Repo Reality Notes"** — known deviations between the plan and the actual repo
3. **"Agent Contract v2"** — non-negotiables (CRS gate, evidence contract, test requirements, commit format)
4. **"Canonical Type Contracts"** — import from `gisContracts.ts`, never redefine
5. **"Shared Test Fixtures"** — import from `gisFixtures.ts`, never redefine

## Step 3 — Pick the next prompt

From the ledger status table, pick the **lowest-numbered `[ ] TODO`** prompt that has no unfinished dependencies. The sequencing dependency graph is in `15_AGENT_EXECUTION_PROMPTS.md` under "Sequencing Cheat Sheet".

## Step 4 — Shared contracts (never redefine)

```ts
// GIS type contracts
import { ... } from "@/services/map/contracts/gisContracts";

// Shared test fixtures
import { ... } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
```

Adding duplicate types or fixtures will be caught at review — always import.

## Step 5 — Execute

1. Create a checkpoint branch: `git checkout -b gis/p<NN>-<slug>`
2. Implement the prompt
3. Deliver the **Proof** specified in the prompt (usually: test output + type output)
4. Run the **Validate** commands from the prompt (usually: `npm run typecheck` + `npx vitest run <path>` + optional e2e)
5. **Append a Done Log row and flip `[x]`** in `LEDGER.md` in the same commit

## Validate commands by track

| Track | Validate |
|---|---|
| Foundation (0–22) | `npm run typecheck` + `npx vitest run <changed paths>` |
| Publication / Perf (23–25b) | Above + `npm run perf:budgets` |
| Operator surfaces (26–28) | Above + map e2e: `npx playwright test e2e/map-*.spec.ts` |
| Layouts + 3D (29–34) | Above + 3D e2e spec |
| Premium design (35+) | Above + `npm run color:guard` |

## Map test command

Map-specific tests do **not** run under `test:analytics`. Use:

```bash
npx vitest run src/centerpanel/components/map/__tests__/<spec>
npx vitest run src/services/map/__tests__/<spec>
```

## Ledger update format

Append to the Done Log table at the bottom of `LEDGER.md`:

```
| NN | Slug | YYYY-MM-DD | <branch> | <one-line summary> |
```

And flip the status: `[ ] NN —` → `[x] NN — ✅ verified`

Both changes go in the **same commit** as the implementation.
