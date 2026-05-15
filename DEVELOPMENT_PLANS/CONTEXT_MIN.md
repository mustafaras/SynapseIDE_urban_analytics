# Context Min

This is the first file agents should read for Urban Analytics, Map Explorer, or Synapse IDE work. It is a token-budgeted entry point; large ledgers and plans remain authoritative but should be searched only for the active prompt or exact topic.

## First-Read Protocol

1. Read this file.
2. Read `DEVELOPMENT_PLANS/CURRENT_TASK.json`.
3. Run the relevant next-prompt helper with `-Json`.
4. Use `rg` to pull only the active prompt block, status row, or named section from large plan files.
5. Open full ledgers, full development plans, or full sequential prompt files only when targeted search is insufficient.

## Current Module State

| Module | Helper | Current status |
|---|---|---|
| Urban Analytics | `scripts/get-next-urban-analytics-prompt.ps1 -Json` | all prompts completed |
| Map Explorer | `scripts/get-next-map-explorer-prompt.ps1 -Json` | next prompt is 25, Review Timeline and Audit Trail |
| Synapse IDE | `scripts/get-next-synapse-ide-prompt.ps1 -Json` | all prompts completed |

## Authority Order

1. Live repository
2. Relevant implementation ledger, searched by exact prompt id or heading
3. Relevant manifest
4. Relevant sequential prompt block
5. Relevant development plan section
6. Alignment spec
7. Chat history

When documents disagree, prefer the ledger for execution state and the live repository for implementation truth.

## Token Budget Rules

- Do not read entire files over 50 KB unless the active task explicitly needs their full context.
- Prefer `rg "Prompt 25" DEVELOPMENT_PLANS/MAP_EXPLORER_*` over opening a full ledger.
- Prefer `rg "symbolOrComponentName" src/...` over opening large TSX/TS files.
- Read line windows around matches, not whole files.
- Record any new durable knowledge in `CURRENT_TASK.json` or the relevant ledger, not in chat only.

## High-Risk Domain Rules

- Never compute distance or area in EPSG:4326.
- Never present demo, synthetic, or unknown data as real analytical readiness.
- Evidence artifacts are append-only; mark stale or invalid through QA state.
- Preserve module ownership boundaries: Urban Analytics owns interpretation, Map Explorer owns rendering and geometry, Synapse IDE owns editor state.

## Validation Defaults

- Urban Analytics source changes: `npm run typecheck` and `npm run test:analytics`.
- Map Explorer source changes: `npm run typecheck` plus targeted map tests when available.
- Synapse IDE source changes: `npm run typecheck` plus targeted IDE/editor tests when available.
- Docs or script-only changes: validate JSON and run the touched scripts.
