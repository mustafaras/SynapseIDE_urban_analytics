# 07 - Anti-Amnesia Ledger

Status: Draft
Last updated: 2026-06-11
Purpose: Keep the MAP_PREMIUM prompt ladder resumable without rereading the full plan.

## Current Snapshot

- Pack: MAP_PREMIUM
- Active prompt: none yet
- Ledger: `LEDGER.md`
- Detailed prompts: `01_DETAILED_PROMPTS.md` (single file, Prompt 01–10)
- Trigger prompts: `02_TRIGGER_PROMPTS.md`
- Manifest: `prompts.json` + `prompts.schema.json`

## Resume Protocol

1. Read `AGENTS.md`, `LEDGER.md`, this file, and the selected prompt section in `01_DETAILED_PROMPTS.md`.
2. Confirm the pack is MAP_PREMIUM, not an archived ladder.
3. Run the narrowest read-only checks needed to understand the current state.
4. Implement only the selected prompt.
5. Update `LEDGER.md` in the same change with exact proof and outcome.

## Anti-Amnesia Audit

- Confirm the selected prompt number.
- Confirm the target files exist.
- Confirm no unrelated workspace change is being pulled into the prompt.
- Confirm the prompt validation set is understood before editing.
- Confirm the ledger is updated before closeout.

## Token Hygiene

- Start sessions by pasting only one trigger from `02_TRIGGER_PROMPTS.md`; the agent then reads only its prompt section.
- Keep execution state in the ledger, not in chat.
- `prompts.json` is the machine-readable index (id, trigger, dependsOn, validation).
- Every prompt requires ≥20 numbered visible UI/UX changes — never close one without all delivered or blockers logged.
