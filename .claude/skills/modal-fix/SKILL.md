---
name: modal-fix
description: Execute one prompt from the Modal Remediation Final-Wave pack (docs/audits/modal-remediation-pack) by trigger or number, with proof capture and anti-amnesia bookkeeping. Use when the user types a modal-fix trigger like "P1".."P22", "MFP-08", a slug like "ai-settings"/"new-file"/"base-modal"/"branding", or asks to run/continue/advance the modal remediation prompts, fix a modal/dialog accessibility issue, or solve the final-wave modal tasks.
---

# Run a Modal Remediation prompt

Execute exactly **one** prompt from the pack at
`docs/audits/modal-remediation-pack/` — without ingesting the whole pack (context economy).

## Steps

1. **Resolve** the trigger → prompt id using
   `docs/audits/modal-remediation-pack/triggers.json` (keys are lower-cased; `P8`, `MFP-08`,
   and slugs all resolve).
2. **Guard:** read `STATE.json` for that id and its `dependsOn`. If any dependency is not
   `done`/`verified`, STOP and tell the user the missing prerequisite.
3. **Load that prompt object** from `prompts.json` (match by `id`) **and read its spec
   file** `docs/audits/modal-remediation-pack/prompts/<id>.md` (the detailed source). Do not
   read other prompts, the full audits, or unrelated source.
4. **Re-anchor:** open each `target.file`; confirm the `symbols` (line `anchors` are
   advisory — lines drift). If `requiresHumanDecision: true`, use `AskUserQuestion` first.
5. **Edit** per `steps`, honouring `constraints` and the pack operating manual
   (`docs/audits/modal-remediation-pack/CLAUDE.md`).
6. **Validate** with the prompt's `validate` commands (its `gate`). Prefer repo skills
   **check-gis-modal** / **check-analytics** / **screenshot-map-explorer** where they match.
7. **Prove:** write every `proofRequired` artifact into
   `docs/audits/modal-remediation-pack/proofs/<id>/` (see that folder's `PROOF.md`).
8. **Record:** update `STATE.json` (status → `done`, commit sha, notes) and append a row to
   `LEDGER.md`.
9. **Finalize (standing policy):** at the end of **every** prompt, once the gate is green and
   all proofs are captured, commit the ledger/STATE bookkeeping, push the feature branch, and
   **merge the PR into `master`**. The repo owner has granted standing authorization for the
   modal-remediation pack — do this without re-asking. (See CLAUDE.md §6.)
10. **Report** concisely: changes, gate result, proofs captured, merge sha, suggested next prompt.

## Hard rules

- One prompt = one focused commit/PR, **merged into `master` at the end of that prompt**
  (standing owner authorization for this pack — see CLAUDE.md §6). Outside this pack, never
  push to `master` without explicit permission.
- No `any`, no direct `localStorage`, no Tailwind in `centerpanel/`, no raw `z-index`
  literals (use tokens), no untyped `CustomEvent` (use `synapseBus`), errors via
  `reportError`.
- Keep `npm run test:e2e:a11y` green; never regress Map Explorer accessibility.
- A prompt is `done` only when its gate passes **and** all `proofRequired` artifacts exist.

The full procedure and proof matrix live in
`docs/audits/modal-remediation-pack/SKILL.md`.
