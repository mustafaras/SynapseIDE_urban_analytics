# SKILL.md — `modal-fix` runbook

> Detailed spec for the **`modal-fix`** skill. The invocable skill lives at
> [`.claude/skills/modal-fix/SKILL.md`](../../../.claude/skills/modal-fix/SKILL.md) and
> delegates to this runbook. Invoke with a trigger or number: `/modal-fix 8`,
> `/modal-fix ai-settings`, or simply `P8`.

## Purpose

Execute exactly one prompt from the Modal Remediation Final-Wave pack, end-to-end, with
proof capture and anti-amnesia bookkeeping — without flooding context with the whole pack.

## Procedure (the loop)

```
INPUT: a trigger (e.g. "P8", "MFP-08", "ai-settings")
1. RESOLVE   trigger → id            via triggers.json
2. GUARD     read STATE.json[id] + dependsOn; abort if a dep is not done/verified
3. LOAD      read the prompts.json object for that id + its spec file prompts/<id>.md
             (the detailed source). Read nothing else from the pack.
4. RE-ANCHOR open each target file; confirm symbols (anchors are advisory — lines drift)
5. EDIT      apply steps; honour constraints + repo CLAUDE.md rules
6. VALIDATE  run the prompt.validate commands for its gate
7. PROVE     write every prompt.proofRequired artifact to proofs/<id>/
8. RECORD    update STATE.json (status, commit, notes) + append LEDGER.md row
9. FINALIZE  commit ledger/STATE bookkeeping, push the branch, MERGE the PR into master
             (standing owner authorization for this pack — see CLAUDE.md §6)
10. REPORT   short summary: changes, gate result, proofs, merge sha, next prompt
```

Do **not** read other prompts, the full audits, or unrelated files. If the prompt has
`requiresHumanDecision: true`, use `AskUserQuestion` before editing.

## Status transitions (STATE.json)

`pending → in_progress → done → verified`
(`blocked` if a dependency or external decision stops progress). A prompt is `done` only
when its gate passes AND all `proofRequired` artifacts exist in `proofs/<id>/`. `verified`
means a separate review/QA confirmed the proofs.

## Proof matrix (what each token means)

| token | how to capture |
|---|---|
| `typecheck-clean` / `lint-clean` / `deadcode-clean` / `color-guard` / `perf-budgets` | save terminal output → `proofs/<id>/<check>.txt` |
| `unit-test` / `e2e-a11y` | save the run output → `proofs/<id>/test-*.txt` |
| `axe-clean` | save axe output → `proofs/<id>/axe.json` |
| `screenshot` / `visual-diff` | PNG(s) → `proofs/<id>/*.png` (map surfaces: use **screenshot-map-explorer**) |
| `manual-keyboard` | `proofs/<id>/keyboard.md` listing Tab / Shift+Tab / Escape / focus-restore checks |
| `render-smoke` | a mount assertion or console proof → `proofs/<id>/render.txt` |

## Gates

Run the command set for the prompt's `gate` (general / gis / analytics / release — see
[`CLAUDE.md`](./CLAUDE.md) §2). Prefer the matching repo skill where one exists
(**check-gis-modal**, **check-analytics**, **screenshot-map-explorer**).

## Guardrails

- Never weaken the already-strong Map Explorer a11y; keep `test:e2e:a11y` green.
- Never introduce `any`, direct `localStorage`, Tailwind in `centerpanel/`, raw `z-index`
  literals (use tokens), or untyped `CustomEvent`s.
- One prompt = one commit/PR, **merged into `master` at the end of that prompt** (the repo
  owner granted standing authorization for this pack; see [`CLAUDE.md`](./CLAUDE.md) §6).
  Outside this pack, never push to `master` without explicit permission.

## Example

> User: `P1`
> Skill: resolve → MFP-01; STATE shows pending, no deps; load MFP-01; open
> `src/components/ai/panel/KeysModal.tsx`, confirm `GOLD` at the line; replace with
> `var(--syn-accent-gold, #f5b301)`; run `typecheck` + `lint:errors`; save
> `proofs/MFP-01/typecheck.txt` + `render.txt`; set STATE MFP-01 → done with the commit
> sha; append LEDGER row; report.
