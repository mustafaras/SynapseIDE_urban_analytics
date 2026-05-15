# Development Plans Archive Preparation Checklist

## Status

Prepared on 2026-05-14. Do not move the tri-modal operating pack from the current local branch yet.

## Why The Archive Is Not Moved Yet

The local `master` branch is ahead 4 and behind 8 relative to `origin/master`. The local Map Explorer ledger is stale and reports Prompt 25 pending, while `origin/master` records Map Explorer 30/30 complete.

Dry merge-tree conflict scan found conflicts in Map Explorer source and ledger files. A manual reconcile step is required before the archive move.

## Required Reconcile Step

Use one of these safe approaches:

1. Create a backup branch for the current local state, then merge `origin/master` and resolve conflicts deliberately.
2. Create a clean branch from `origin/master`, then re-apply only the new archive/color planning docs from the current local branch.

Do not use `git reset --hard` unless the user explicitly asks for it.

## Validation Before Moving Files

Run on the reconciled branch:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/get-next-urban-analytics-prompt.ps1
powershell -ExecutionPolicy Bypass -File scripts/get-next-synapse-ide-prompt.ps1
powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1
```

Expected result:

- Urban Analytics: no pending prompts.
- Synapse IDE: no pending prompts.
- Map Explorer: no pending prompts or `all_completed`.

Then run the broadest reasonable verification for the branch state, normally:

```powershell
npm run typecheck
npm run build
```

Use additional tests only if source conflicts were resolved in product files.

## Archive Move Procedure

After the reconcile and validation pass:

1. Create `DEVELOPMENT_PLANS/archive/tri-modal-operating-pack-2026-05-14/`.
2. Move completed Urban Analytics, Map Explorer, Synapse IDE, and tri-modal operating-pack documents into that folder.
3. Keep root files that point future agents to the archive:
   - `DEVELOPMENT_PLANS/README.md`
   - `DEVELOPMENT_PLANS/ARCHIVE_READINESS.md`
   - `DEVELOPMENT_PLANS/ARCHIVE_PREPARATION_MANIFEST.json`
   - `DEVELOPMENT_PLANS/archive/README.md`
4. Update `AGENTS.md` and `CLAUDE.md` if archived canonical paths become final.
5. Keep `COLOR_SYSTEM_PLANS/` outside the archived tri-modal operating pack.

## Final Archive Gate

- Branch reconciled.
- Helpers report no pending prompts.
- Module ledgers agree with helper outputs.
- Root README points to archived ledgers.
- Color planning pack remains discoverable.
