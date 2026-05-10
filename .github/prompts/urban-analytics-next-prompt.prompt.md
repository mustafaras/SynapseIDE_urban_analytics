---
name: urban-analytics-next-prompt
description: >
  Resume Urban Analytics implementation from the ledger. Discovers the next
  incomplete prompt, reads required plan sections and files, implements scoped
  changes in priority order, validates, and updates the ledger.
  USE FOR: continuing urban analytics feature development, running the next
  implementation prompt, resuming after interruption.
---

# Urban Analytics — Resume Next Prompt

## Step 1: Discover next prompt

```powershell
powershell -ExecutionPolicy Bypass -File scripts/get-next-urban-analytics-prompt.ps1
```

If the script is unavailable, read the **Prompt Status Register** in:
[`DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`](../../DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md)

## Step 2: Read required documents

Read in this order (use targeted section extraction, not full file reads):
1. Ledger — Current Status, Next Prompt Pointer, Prompt Status Register, latest completed entries
2. Active prompt block in [`DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`](../../DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md)
3. Named plan sections from the active prompt's "Required Reading"
4. Every file listed in the active prompt's "Files To Inspect"
5. If a listed file is missing or corrupted, record it in the ledger Known Risks, continue with remaining files, and stop only if the missing file blocks acceptance criteria.

## Step 3: Implement

1. Scope edits strictly to the active prompt.
2. Add new functionality to existing contracts without altering their current behavior or structure.
3. Preserve all prior prompt content, ledger records, and public event names.
4. Do not make changes to Map Explorer, Synapse IDE, report, dashboard, or workflow state without logging and validating the changes.
5. Do not claim data readiness or method validity without a real source.

## Step 4: Validate

```bash
npm run typecheck
npm run test:analytics
```

Run additional tests if the prompt names them.

## Step 5: Update ledger

Record in [`DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`](../../DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md):
- Prompt status → `completed`
- Files Inspected and Files Changed
- Validation History (command + result)
- Cross-Module Contract Registry (if changed)
- Scientific Decision Registry (if changed)
- Known Risks update
- Next Prompt Pointer

## Step 6: Final report

```
Completed Prompt:
Files inspected:
Files changed:
Behavior implemented:
Evidence/provenance changed:
Method validity changed:
Cross-module contracts changed:
Validation run:
Validation result:
Risks or blockers:
Next recommended prompt:
Ledger updated: yes/no
```
