# Map Explorer Modal Prompt Ladder (Compact)

Repository: SynapseIDE_urban_analytics
Mode: local-first, token-efficient execution

## 0) Why this file exists
Use this file as the primary execution source for prompt runs.
Use `MAPDESIGN/prompts-detailed-en.md` only when a prompt needs edge-case clarification.

Detail ownership:
- `MAPDESIGN/prompts-detailed-en.md` remains the canonical source for full acceptance details.
- This compact file is an execution accelerator, not a replacement for prompt intent.
- If any ambiguity appears, resolve it by reading only the matching `Prompt NN` block from the detailed file.

## 1) Shared guardrails (apply to every prompt)
1. Local-only execution by default; do not block on remote deployment checks.
2. Never commit to main/master.
3. Preserve GIS/CRS/QA/evidence/diagnostics/import-export/publish semantics.
4. Keep edits small and reversible.
5. Do not delete tests to make changes pass.
6. Keep work synced with `MAPDESIGN/execution-ledger.md`.
7. Follow `MAPDESIGN/local-executor.agent.md` anti-amnesia and commit discipline.
8. Push only if explicitly requested.

## 2) Minimal per-prompt packet template
Copy this packet, fill only the bracket fields, and run.

```text
Map Explorer Local Prompt Executor: Prompt NN

Context:
- Workspace: SynapseIDE_urban_analytics
- Prompt: PNN - [title]
- Scope files: [file/path/a], [file/path/b], [file/path/c]
- Non-goals: [what not to touch]

Task:
[1 paragraph max]

Acceptance:
- [criterion 1]
- [criterion 2]
- [criterion 3]

Validation:
- npm run typecheck
- npm run lint:errors
- [targeted test command]
- [optional build/test command]

Output contract:
1. What changed
2. Files changed
3. Risks
4. Validation results
5. Next prompt
```

## 3) Validation profiles (pick one)
- Light: `npm run typecheck`
- Standard: `npm run typecheck` + `npm run lint:errors` + targeted tests
- Heavy: Standard + `npm run build` + focused e2e

## 4) Prompt index (one-line objective)

Phase 0
- P01: Build repository inventory for Map Explorer modal surfaces.
- P02: Establish local/live visual baseline and screenshot matrix.
- P03: Lock test contracts and stable selectors before layout changes.

Phase 1 (Layout stabilization)
- P04: Consolidate layout tokens and modal safe inset model.
- P05: Stabilize modal shell grid and region placement.
- P06: Apply safe-zone rules to floating map furniture.
- P07: Add containment rules for popups/tooltips/dropdowns/dialogs.
- P08: Make status bar production-readable and non-intrusive.
- P09: Add/update layout regression coverage.

Phase 2 (Header and command clarity)
- P10: Inventory header and command surfaces.
- P11: Stabilize header and modal-control hierarchy.
- P12: Regroup toolbar actions (visible/overflow/contextual).
- P13: Standardize icon-only buttons and affordances.
- P14: Calm search/CRS/project/active-layer header indicators.
- P15: Add/update command/header regression coverage.

Phase 3 (Panel density and IA)
- P16: Audit panel density and information architecture.
- P17: Improve left/layer panel grouping.
- P18: Reduce layer-row action density; improve focus/touch.
- P19: Apply right-dock primary/secondary hierarchy.
- P20: Make inspector/properties summary-first.
- P21: Organize evidence/export/publish with progressive disclosure.
- P22: Make diagnostics/logs/QA/performance production-appropriate.
- P23: Add/update panel-density regression coverage.

Phase 4 (Containment and overlap)
- P24: Unify z-index and elevation discipline.
- P25: Strengthen popover/dropdown/menu collision behavior.
- P26: Fix scroll containment and short-height viewport behavior.
- P27: Reconcile legacy controls with canonical modal controls.
- P28: Add collision/z-index/scroll regression coverage.

Phase 5 (Accessibility and responsive)
- P29: Audit keyboard and focus model.
- P30: Strengthen focus trap, Escape, and return focus behavior.
- P31: Apply roving tabindex and ARIA state on dock/toolbar.
- P32: Harden contrast/reduced-motion/high-contrast/touch targets.
- P33: Harden responsive panel collapse and tablet behavior.
- P34: Add accessibility/responsive regression coverage.

Phase 6 (QA and release readiness)
- P35: Build final visual QA matrix and screenshot states.
- P36: Compare dev vs preview local build variants.
- P37: Run full validation and draft release notes.
- P38: Prepare merge plan and PR chain recommendation.

Optional
- P39: Split oversized phase into smaller PRs.
- P40: Create blocker-only fix prompt.
- P41: Produce reviewer-ready visual QA checklist only.
- P42: Prepare consolidated final PR description.

## 5) P03 quick packet (ready to run)

```text
Map Explorer Local Prompt Executor: Prompt 03

Context:
- Workspace: SynapseIDE_urban_analytics
- Prompt: P03 - Map test contracts and stable selectors
- Scope files: e2e/**/*.spec.ts, src/**/__tests__/**/*.test.tsx, map modal components
- Non-goals: broad refactor, test deletion, selector renames without migration

Task:
Inventory Map Explorer tests and selector contracts. Identify stable selectors, fragile selectors, and test gaps before any Phase 1 layout edits.

Acceptance:
- Contract note includes file path, purpose, critical selectors, and risk level.
- Stable selector map covers shell/header/controls/panels/dialogs/warnings.
- Migration rules and gap list are explicit and actionable.

Validation:
- Analysis-only; run targeted searches and read tests.
- No mandatory code changes.

Output contract:
1. What changed
2. Files changed
3. Risks
4. Validation results
5. Next prompt
```

## 6) Token hygiene rules while running prompts
1. Do not paste full prompt text into each run; reference `Pnn` + compact packet.
2. Reuse shared guardrails from this file instead of repeating constraints.
3. For updates, send deltas only: changed files, decisions, risks, next action.
4. Prefer focused file reads (`read_file` ranges) over full long-file dumps.
5. If detail is needed, read only the matching prompt section from `prompts-detailed-en.md`.

## 7) Detail fallback protocol (when compact is not enough)
1. Start from compact packet for `PNN`.
2. Open the single `Prompt NN` section in `prompts-detailed-en.md`.
3. Copy only missing acceptance clauses into the active run note.
4. Keep implementation scoped to current phase and non-goals.
5. Record any detail override in `execution-ledger.md` under Decisions.
