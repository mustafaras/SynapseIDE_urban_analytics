# CLAUDE.md — Modal Remediation Final-Wave Operating Manual

> **This file is the context an agent loads when working inside this pack.** It is the
> anti-amnesia entry point. Read this + the **one** prompt you were asked to run — do NOT
> ingest the whole pack. Everything here OVERRIDES default behaviour for pack work.

This pack executes the **final wave** of modal/dialog fixes for the
**Synapse IDE — GIS & Urban Analytics Workbench** before release. It turns two audits into a
controlled, proof-backed execution sequence.

- Findings: [`../modal-design-audit-2026-06-17.md`](../modal-design-audit-2026-06-17.md)
- Plan: [`../modal-remediation-plan-2026-06-17.md`](../modal-remediation-plan-2026-06-17.md)
- Readable prompts: [`../modal-remediation-prompts-2026-06-17.md`](../modal-remediation-prompts-2026-06-17.md)
- **Canonical prompt data:** [`prompts.json`](./prompts.json) (validated by [`prompts.schema.json`](./prompts.schema.json))

---

## 0. The context-economy protocol (READ FIRST)

When the user gives a trigger (e.g. `P8`, `MFP-08`, `ai-settings`, or `/modal-fix 8`):

1. **Resolve** the trigger → prompt id via [`triggers.json`](./triggers.json) (or read the
   one-line goal in [`TRIGGERS.md`](./TRIGGERS.md)).
2. **Load that prompt's object** from `prompts.json` (by `id`) **and** read its `spec`
   file — `prompts/<id>.md` — which is the detailed source (why / evidence / before→after /
   steps / edge cases / tests / proof). Do **not** read the other prompts, the full audits,
   or unrelated source.
3. **Check `STATE.json`** for that id and its `dependsOn`. If a dependency is not `done`/
   `verified`, STOP and tell the user which prerequisite is missing.
4. **Execute** the spec's steps against the listed `targets`. Re-verify line anchors
   before editing (lines drift — anchors are advisory, `symbols` are authoritative).
5. **Validate** with the prompt's `validate` commands and capture every `proofRequired`
   artifact into `proofs/<id>/` (see [`PROOF.md`](./PROOF.md)).
6. **Update `STATE.json`** (status + commit sha + notes) and append a [`LEDGER.md`](./LEDGER.md) row.
7. Reply with a short summary: what changed, proofs captured, gate result.

This keeps each turn cheap: **1 prompt object + its `prompts/<id>.md` spec + the target
files**, never the whole pack.

---

## 1. Always-true rules (inherited from repo root `CLAUDE.md`, do not violate)

- **TypeScript:** `strict` + `exactOptionalPropertyTypes` — `prop?: string` ≠ `prop: string | undefined`. No silent `any`; use `unknown` + narrowing.
- **State:** Zustand only (no Redux/Context for app state). No direct `localStorage` (use `persist`).
- **Errors:** `reportError()` from `src/lib/error-bus.ts` — never `showToast` directly for error conditions.
- **Events:** typed `synapseBus` (`src/services/synapseBus.ts`); update `SynapseBusEventMap` (`src/types/synapse-bus.ts`) for new events; payloads carry IDs/refs only.
- **CSS:** no Tailwind under `src/centerpanel/` (`npm run lint:no-tailwind-centerpanel` gates CI). CSS Modules in `centerpanel/`; styled-components in shell/templates.
- **Design language:** minimal premium — dense typography, thin separators, restrained amber accent. No marketing hero layouts, no cards-in-cards.

## 2. Validation gates (per `gate` field on each prompt)

| gate | commands |
|---|---|
| `general` | `npm run typecheck` · `npm run lint:errors` |
| `gis` | general + `npm run lint:no-tailwind-centerpanel` + `npx vitest run src/centerpanel/components/map` (skill: **check-gis-modal**) |
| `analytics` | `npm run typecheck` + `npm run test:analytics` (skill: **check-analytics**) |
| `release` | general + `npm run build` + `npm run test:e2e:a11y` |

Never mark a prompt `done` if its gate fails. **Map Explorer e2e a11y must stay green** on
every prompt that touches shared/foundation or map code.

## 3. Proof requirements (no proof → not done)

Each prompt lists `proofRequired`. Capture artifacts into `proofs/<id>/`:
- `typecheck-clean`, `lint-clean`, `deadcode-clean`, `color-guard`, `perf-budgets`,
  `unit-test`, `e2e-a11y` → save the terminal output (`<check>.txt`).
- `axe-clean` → save the axe results JSON/output.
- `screenshot` / `visual-diff` → use the **screenshot-map-explorer** skill for map surfaces;
  for other modals capture a before/after PNG.
- `manual-keyboard` → a short `keyboard.md` noting Tab/Shift+Tab/Escape/focus-restore checked.
- `render-smoke` → a test/console proof the component mounts.
See [`PROOF.md`](./PROOF.md) for the exact layout and naming.

## 4. Sequencing & dependencies

- Phases: **0** quick wins → **1** foundation → **2** migrate consumers → **3** decomposition.
- The hard dependency: **MFP-06 (base Modal)** depends on MFP-02/03/04/05 and unblocks
  MFP-10/11/12/14/16/20. **MFP-19 (Map Core decomposition)** runs last, after MFP-20 tests.
- Branding: **MFP-21 → MFP-22** (naming source of truth before release assets). Both have
  `requiresHumanDecision: true` — confirm the canonical name/version with the owner first
  (use `AskUserQuestion`).

## 5. Branding note (release wave)

This is the last wave before publish. The product brand currently diverges three ways and
`index.html` still says *"Coder App - Professional Code Editor"*. MFP-21 establishes
`src/constants/brand.ts` as the single source of truth; MFP-22 fixes the public-facing
title/favicon/meta/version. Do not invent taglines or names — confirm with the owner.

## 6. Git & PR discipline

- One prompt = one focused commit/PR. Do not bundle foundation changes with decomposition.
- Develop on the designated feature branch. Use `git push -u origin <branch>` with
  exponential-backoff retry on network errors only.
- **End-of-prompt finalize (standing owner authorization for THIS pack):** at the end of
  **every** prompt — once the gate is green, all `proofRequired` artifacts exist, and
  `STATE.json` + `LEDGER.md` are updated — commit the bookkeeping, push the branch, open the
  PR, and **merge it into `master`**. The owner has authorized this standing flow, so do not
  re-ask per prompt. Sequence: **gate green → proofs → ledger/STATE → commit → push → PR →
  merge to `master`**.
  - This standing authorization is scoped to the modal-remediation pack only. Anywhere else,
    never push to or merge into `master` without explicit permission.
  - If the gate fails or a `proofRequired` artifact is missing, the prompt is **not** `done`
    — do **not** merge. Fix first, or mark `blocked` and report.
- Commit trailer (chat-only model id never in commits):
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
