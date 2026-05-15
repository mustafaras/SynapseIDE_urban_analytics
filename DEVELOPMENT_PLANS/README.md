# Development Plans Index

## Current State

Archive preparation status: prepared, not moved.

The tri-modal operating pack appears complete on `origin/master`, but the current local `master` branch is stale and diverged. Do not archive or move the root plan files from this local branch until the divergence is reconciled.

Read first:

1. `DEVELOPMENT_PLANS/ARCHIVE_READINESS.md`
2. `DEVELOPMENT_PLANS/ARCHIVE_PREPARATION_MANIFEST.json`
3. The module launcher for the work you are about to do.

## Source Of Truth

Priority order for archive decisions:

1. Reconciled branch state.
2. Implementation ledgers.
3. Helper script results.
4. Live repository evidence.
5. Manifests and sequential prompt catalogs.

Important note: prompt manifests are static catalogs and may keep `status: "pending"` even after execution. The implementation ledgers are the execution source of truth.

## Module Launchers

- `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
- `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
- `DEVELOPMENT_PLANS/START_HERE_SYNAPSE_IDE_AGENT.md`

## Completion Evidence

As of the archive-prep audit on 2026-05-14:

- Urban Analytics: complete locally and on `origin/master`.
- Synapse IDE: complete locally and on `origin/master`.
- Map Explorer: complete on `origin/master`; local `master` still shows Prompt 25 pending because it is behind `origin/master`.

## Archive Target

When the branch is reconciled and helper scripts report no pending prompts, archive the completed tri-modal pack under:

```text
DEVELOPMENT_PLANS/archive/tri-modal-operating-pack-2026-05-14/
```

Keep this README or equivalent root stubs in `DEVELOPMENT_PLANS/` so future agents can find the archived ledgers.

## New Work

New color-system planning lives outside this tri-modal archive path:

```text
COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md
```
