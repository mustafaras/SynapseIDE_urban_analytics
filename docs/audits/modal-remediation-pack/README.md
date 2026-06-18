# Modal Remediation — Final-Wave Operating Pack

The controlled, proof-backed execution pack that closes **every** finding from the modal
audits before release of **Synapse IDE — GIS & Urban Analytics Workbench**. Fire prompts by
trigger; the agent loads one prompt at a time and records proof + progress.

## Contents

| File | Role |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Operating manual + anti-amnesia entry point + context-economy protocol |
| [`SKILL.md`](./SKILL.md) | `modal-fix` runbook (procedure + proof matrix) |
| [`TRIGGERS.md`](./TRIGGERS.md) | Human trigger table + phase/batch triggers |
| [`triggers.json`](./triggers.json) | Machine: trigger → prompt id (auto-derived) |
| [`prompts.json`](./prompts.json) | **Canonical** 22 prompts (file-specific) + `spec` link to each long form |
| [`prompts/`](./prompts/) | **Full per-prompt specs** (`MFP-01.md`..`MFP-22.md`) — why / evidence / before→after / steps / edge cases / acceptance / tests / proof |
| [`prompts.schema.json`](./prompts.schema.json) | JSON Schema validating `prompts.json` |
| [`STATE.json`](./STATE.json) | **Anti-amnesia** machine state (status/commit/proof per prompt) |
| [`LEDGER.md`](./LEDGER.md) | **Anti-amnesia** human progress log |
| [`PROOF.md`](./PROOF.md) | Evidence requirements + `proofs/<id>/` layout |
| `proofs/` | Captured evidence per prompt |

Source audits (one level up): [`../modal-design-audit-2026-06-17.md`](../modal-design-audit-2026-06-17.md),
[`../modal-remediation-plan-2026-06-17.md`](../modal-remediation-plan-2026-06-17.md),
[`../modal-remediation-prompts-2026-06-17.md`](../modal-remediation-prompts-2026-06-17.md).

## Quick start

```
# fire a single prompt (any of these are equivalent)
P8            MFP-08            ai-settings

# see where we are
status

# do the next actionable prompt
next
```

The agent resolves the trigger, checks dependencies in `STATE.json`, loads **only** that
prompt from `prompts.json`, edits the named files, runs the gate, captures proofs into
`proofs/<id>/`, updates `STATE.json` + `LEDGER.md`, and reports.

## The 22 prompts at a glance

- **Phase 0 — quick wins / blockers:** MFP-01 (GOLD bug), MFP-08 (AI Settings), MFP-09 (Map Service).
- **Phase 1 — foundation:** MFP-02 promote `useFocusTrap`, MFP-03 `useScrollLock`, MFP-04 `useInertBackground`, MFP-05 z-index tokens, MFP-06 rebuild base `Modal`, MFP-07 foundation tests.
- **Phase 2 — migrate consumers:** MFP-10 New File, MFP-11 New Project, MFP-12 Global Search, MFP-13 migrate traps, MFP-14 names, MFP-15 z-index apply, MFP-17 Urban/Welcome, MFP-18 Map dialog family, MFP-20 tests/guardrails, **MFP-21 branding**, **MFP-22 release assets**.
- **Phase 3 — decomposition (last):** MFP-16 Settings extract, MFP-19 Map Core decomposition.

## Invariants (enforced by the gates)

Every accessible dialog ends with: a name, focus trap, focus restore, Escape, inert
background, token z-index, keyboard-operable controls, reflow at 320px, reduced-motion
respect — proven by a focus/Escape/axe test. See [`CLAUDE.md`](./CLAUDE.md) for the full
rule set.
