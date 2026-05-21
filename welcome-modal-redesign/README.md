# Welcome Modal Redesign — Operating Pack

Working folder for the Urban Analytics **welcome modal** redesign. Everything
needed to plan, execute, and track the work lives here.

Target file (the only source file this pack touches):
[`src/features/urbanAnalytics/WelcomeModal.tsx`](../src/features/urbanAnalytics/WelcomeModal.tsx)

Brand asset reused: [`src/components/atoms/Logo.tsx`](../src/components/atoms/Logo.tsx)

## Contents

| File | Role |
|---|---|
| [PROMPTS.md](PROMPTS.md) | The prompt pack — design thesis, constraints, ordered prompts, one-shot prompt, QA, checklist, handoff template. |
| [LEDGER.md](LEDGER.md) | Current-state source of truth — what is implemented, what is planned, validation results, open risks. |
| README.md | This index + how to work from the pack. |

## Current direction

- **v2 "Curved Intelligence Layer"** — premium rectangular glass cockpit. Implemented in the working copy (uncommitted). Baseline.
- **v3 "Orbital Cockpit"** — a genuinely circular ("tam yuvarlak") disc with a large, dominant Synapse IDE brand. **Planned**; the prompt pack now describes this target.

See [LEDGER.md](LEDGER.md) for the authoritative status table.

## How to work from this pack

1. **Read [LEDGER.md](LEDGER.md) first** to see what is implemented vs. planned.
2. Pick the next step from [PROMPTS.md](PROMPTS.md):
   - Single pass → use **Section 17, "One-Shot Implementation Prompt."**
   - Step by step → run **Prompts 01–13** in order.
3. Implement only inside [`WelcomeModal.tsx`](../src/features/urbanAnalytics/WelcomeModal.tsx); keep CSS in its inline `<style>` block. No Tailwind, no new deps, no store/domain changes.
4. **Validate** before claiming done:
   ```bash
   npm run typecheck
   npm run test:analytics
   npm run lint:errors
   ```
5. **Update [LEDGER.md](LEDGER.md)** in the same pass: status changes, commands + results, files changed, remaining risks. This is required (see the Maintenance Rule in the ledger).

## Baked-in v3 decisions

| Decision | Choice |
|---|---|
| Shell shape | Perfect circle on desktop; rounded-capsule below ~560px |
| Brand logo | Synapse glyph, inline-replicated in the modal palette |
| Content fit | Inscribed scroll column + edge fades; light copy condense |
| Disc diameter | `min(92vmin, 940px)` |
| Scroll model | Scroll inside the disc with mask fades + scroll hint |

## Validation gate (must pass)

| Gate | Required result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run test:analytics` | Pass (62 files, 1111 tests) |
| `npm run lint:errors` | Pass |
| Browser visual inspection | Pass (capture desktop + mobile screenshots when implementing v3) |
