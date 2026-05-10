# Urban Analytics Remediation Correction Prompt

## Remediation Correction Prompt - Close Residual Truthfulness, Documentation, and UX Gaps

### Objective

Close all known residual gaps discovered after reviewing `URBAN_ANALYTICS_REMEDIATION_SEQUENTIAL_PROMPTS.md`, with emphasis on truthful implementation status, placeholder-free production UX, consistent release documentation, and traceable remediation completion reports.

This prompt must be executed as a corrective pass across the existing remediation sequence. It does not replace the original remediation prompts; it reconciles their incomplete or inconsistent outcomes.

---

### Scope

Perform a full corrective pass for the following issues:

1. Right-panel fallback content is still partially placeholder-like.
2. Prompt 42 is over-reported as fully closed while right-panel fallback gaps remain.
3. VoxCity release documentation is internally inconsistent about sample-first versus real-data-first behavior.
4. NL-to-SQL status is inconsistent across ledger, module matrix, and release docs.
5. Remediation Prompt 07-12 completion reports are not independently traceable.
6. Production UX still contains a `coming soon` workflow placeholder.
7. Prompt 12 / Prompt 43 release-hardening claims need to truthfully preserve remaining UI and validation debt.

---

### Required Work

#### 1. Replace right-panel unavailable fallback text with substantive content

Inspect and update:

- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- `src/features/urbanAnalytics/rightPanelUtils.ts`
- `src/features/urbanAnalytics/seeds/index.ts`
- `src/features/urbanAnalytics/seeds/`
- `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
- `e2e/right-panel-fallbacks.spec.ts`

Remove production fallback messages such as:

- `Curated methodology support is currently unavailable for this selection.`
- `Curated data guidance is currently unavailable for this selection.`
- `Curated code guidance is currently unavailable for this selection.`
- `Curated references are currently unavailable for this selection.`

Replace them with concise, useful, academically meaningful fallback material derived from:

- methodology seeds
- section hierarchy
- canonical urban analytics references
- generic but substantive methodological guidance
- safe default code or pseudocode patterns where no specific snippet exists

The right panel must never render empty "unavailable" filler for methodology, data, code, or references in production UX.

Update tests so these unavailable fallback strings cannot return.

---

#### 2. Correct Prompt 42 status and documentation

Inspect and update:

- `docs/implementation/prompt-status-ledger.md`
- `docs/implementation/module-matrix.md`
- `docs/implementation/prompt-42-completion.md`
- `docs/release/known-risks-and-limitations.md`

If the right-panel fallback issue is fully fixed, Prompt 42 may remain `implemented`.

If any right-panel fallback residual remains, Prompt 42 must be downgraded to:

- `implemented with residual gap`

Do not claim debt closure unless the production UI and tests support that claim.

---

#### 3. Reconcile VoxCity documentation

Inspect and update:

- `docs/release/known-risks-and-limitations.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`
- `docs/implementation/module-matrix.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/implementation/prompt-15-completion.md`
- `docs/implementation/prompt-17-completion.md`

Resolve the current contradiction where some docs describe VoxCity extrusion and sunlight workflows as still `sample-first`, while others describe them as real-project-data-capable.

Truthful target wording:

- If real project geometry is now prioritized when available, state that clearly.
- If sample mode still exists, describe it as an explicit quick-start or demo path.
- Do not describe the workflows as `sample-first` unless the runtime actually defaults silently to sample data.

---

#### 4. Reconcile NL-to-SQL implementation status

Inspect and update:

- `docs/implementation/prompt-status-ledger.md`
- `docs/implementation/module-matrix.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`
- `docs/implementation/prompt-14-completion.md`

Make the NL-to-SQL status consistent everywhere.

If live execution is limited to queryable project overlays and imported worker-backed spatial tables, use:

- `implemented with residual gap`

Document the residual clearly:

- NL-to-SQL executes against live project/imported queryable tables.
- It does not automatically federate every possible project dataset, remote catalog, or non-queryable layer.
- Demo mode remains explicit and must not be silently substituted.

---

#### 5. Create traceable remediation completion reports for Prompts 07-12

Create standalone completion reports under:

- `docs/implementation/remediation-prompt-07-completion.md`
- `docs/implementation/remediation-prompt-08-completion.md`
- `docs/implementation/remediation-prompt-09-completion.md`
- `docs/implementation/remediation-prompt-10-completion.md`
- `docs/implementation/remediation-prompt-11-completion.md`
- `docs/implementation/remediation-prompt-12-completion.md`

Each file must use this exact structure:

```md
### Remediation Prompt XX - Completion Report
- Scope Completed:
- Key Files Added or Updated:
- User-Facing Surfaces Added or Corrected:
- Runtime Truthfulness Improvements:
- Validation Performed:
- Residual Risks:
- Follow-Up Required Before Next Prompt:
```

The reports may reference existing historical prompt completion files, but they must be independently readable and must not over-claim.

Update any documentation links that currently rely only on embedded remediation notes inside older prompt completion files.

---

#### 6. Remove production `coming soon` workflow placeholder

Inspect and update:

- `src/centerpanel/Flows/FlowHost.tsx`
- related flow-shell tests if present
- release docs if this surface is documented

Remove or replace:

- `Workflow shell ready. Step-by-step wizard coming soon.`

Acceptable replacements:

- a real workflow entry state
- a truthful empty state explaining required input
- a disabled state that names the missing prerequisite
- a routed fallback to available workflow surfaces

Do not use `coming soon`, `not yet`, or equivalent placeholder language in production UX.

---

#### 7. Keep Prompt 12 / Prompt 43 release hardening truthful

Inspect and update:

- `docs/implementation/prompt-43-completion.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/implementation/module-matrix.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`
- `docs/release/known-risks-and-limitations.md`

Ensure Prompt 43 remains truthful:

- If large UI shells still have maintainability debt, keep that residual visible.
- If some advanced workflows are only launch-verified, keep that status visible.
- Do not convert residual debt into a closed claim unless code and tests actually close it.

---

### Validation Requirements

Run and report:

1. `npm run typecheck`
2. `npm run build`
3. `npm run test`
4. `npm run lint:errors`
5. `npm run perf:budgets`
6. `npm run test:e2e:smoke`

Run targeted tests:

1. `npm test -- src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
2. `npx playwright test e2e/right-panel-fallbacks.spec.ts`
3. `npx playwright test e2e/voxcity-real-data.spec.ts`
4. `npx playwright test e2e/geoai-real-data.spec.ts`
5. `npx playwright test e2e/release-candidate-ui.spec.ts`

If any validation cannot run, document the exact command, failure reason, and whether the failure is caused by the correction work or pre-existing environment constraints.

---

### Acceptance Criteria

This correction pass is complete only when:

- The right panel no longer renders empty unavailable fallback text for methodology, data, code, or references.
- Prompt 42 status matches actual right-panel implementation truth.
- VoxCity docs consistently describe real-data support and explicit sample/demo mode.
- NL-to-SQL has one consistent status across ledger, module matrix, and release docs.
- Remediation Prompts 07-12 have standalone completion reports.
- No production workflow surface contains `coming soon`, `not yet`, or equivalent placeholder language.
- Prompt 43 / release hardening docs truthfully preserve any remaining validation or maintainability debt.
- All validation results are reported with pass/fail status and residual risks.

---

### Mandatory Final Report

After implementation, produce:

```md
### Remediation Correction Pass - Completion Report
- Scope Completed:
- Key Files Added or Updated:
- User-Facing Surfaces Corrected:
- Documentation Truthfulness Corrections:
- Validation Performed:
- Residual Risks:
- Follow-Up Required:
```
