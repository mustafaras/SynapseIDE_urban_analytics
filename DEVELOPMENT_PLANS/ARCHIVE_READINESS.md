# Development Plans Archive Readiness

## Status

Audit date: 2026-05-14

Decision: do not archive from the current local branch until branch divergence is reconciled.

## Reason

The current local `master` branch is stale relative to `origin/master`. The local ledger still shows Map Explorer Prompt 25 as pending, but `origin/master` records the Map Explorer operating pack as complete.

Current local Map Explorer next prompt helper result:

```text
Prompt 25 - Review Timeline and Audit Trail
Status: pending
```

Local ledger evidence:

- `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` marks prompts 00-24 as completed.
- `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` marks prompts 25-29 as pending.
- `scripts/get-next-map-explorer-prompt.ps1` resolves Prompt 25 as the next active implementation step.

Remote evidence from `origin/master`:

- `origin/master:DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` records: `Map Explorer prompt ladder complete. 30 of 30 prompts completed.`
- The remote ledger records Prompt 29 completed on 2026-05-14.
- The remote ledger records the helper result after Prompt 29 as `status: all_completed` and `nextPrompt: null`.
- The remote manifest still carries static prompt catalog statuses as `pending`; the ledger remains the execution source of truth.

Branch state observed on 2026-05-14:

```text
master...origin/master [ahead 4, behind 8]
local HEAD: d312c6a
origin/master: 024f3e9
```

Dry merge-tree conflict scan reported conflicts in Map Explorer files including:

- `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
- `src/App.tsx`
- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/__tests__/map-layer-management.test.ts`
- `src/centerpanel/components/map/index.ts`
- `src/centerpanel/components/map/mapTypes.ts`
- `src/stores/useMapExplorerStore.ts`

## Archive Gate

Only archive the root operating pack from a reconciled branch after all of the following are true:

1. `scripts/get-next-urban-analytics-prompt.ps1` reports no pending prompt.
2. `scripts/get-next-synapse-ide-prompt.ps1` reports no pending prompt.
3. `scripts/get-next-map-explorer-prompt.ps1` reports no pending prompt.
4. The Map Explorer ledger records Prompt 29 as completed or skipped with reason.
5. The root agent instructions are updated so future agents can still find the archived pack.

If using `origin/master` as source of truth, the Map Explorer completion gate appears satisfied, but the local branch must be merged or rebased carefully first because conflicts are expected.

## Agent-Discoverable Archive Procedure

When the archive gate is satisfied, use this procedure instead of silently moving files away:

1. Create `DEVELOPMENT_PLANS/archive/tri-modal-operating-pack-YYYY-MM-DD/`.
2. Move the completed tri-modal operating-pack documents into that archive folder.
3. Keep a root `DEVELOPMENT_PLANS/README.md` or root start stubs that point to the archive location.
4. Update `AGENTS.md` and `CLAUDE.md` references if canonical file paths change.
5. Keep each module ledger reachable from the root README or start stubs.

Prepared files for this archive pass:

- `DEVELOPMENT_PLANS/README.md`
- `DEVELOPMENT_PLANS/ARCHIVE_PREPARATION_MANIFEST.json`
- `DEVELOPMENT_PLANS/ARCHIVE_PREPARATION_CHECKLIST.md`
- `DEVELOPMENT_PLANS/archive/README.md`
- `DEVELOPMENT_PLANS/archive/tri-modal-operating-pack-2026-05-14/README.md`

## Current Agent Instruction

Future agents should not trust the current local `master` ledger status until branch divergence is resolved. For completion truth, inspect `origin/master` or merge/rebase it carefully, then re-run the next-prompt helpers.
