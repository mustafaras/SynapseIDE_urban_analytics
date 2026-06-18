# TRIGGERS — fire one prompt at a time

**How to use:** send **one trigger** (the `P#` form). The agent loads only that prompt
(`prompts.json` object + its `prompts/<id>.md` spec) and runs the
[`modal-fix`](../../../.claude/skills/modal-fix/SKILL.md) procedure — it does **not** read
the rest of the pack. One trigger = one focused change + proof.

> **To avoid confusion, use the `P#` form below.** `MFP-0#` and the slugs in
> [`triggers.json`](./triggers.json) also resolve, but `P#` is the single recommended way.

## The 22 triggers (one-line goal each)

| Send | id | Goal (one sentence) | Pri | Needs |
|---|---|---|---|---|
| `P1` | MFP-01 | Fix the undefined `GOLD` crash in KeysModal (replace with an amber token). | P0 | — |
| `P2` | MFP-02 | Move `useFocusTrap` to `src/hooks/` so every modal can share one trap. | P0 | — |
| `P3` | MFP-03 | Add a ref-counted `useScrollLock` so stacked modals don't fight body scroll. | P1 | — |
| `P4` | MFP-04 | Add `useInertBackground` so the page behind a modal is inert to assistive tech. | P1 | — |
| `P5` | MFP-05 | Add the missing `--z-system-banner` z-index token. | P1 | — |
| `P6` | MFP-06 | Rebuild the base `Modal`: focus trap, focus restore, inert, unique title id, scoped Escape. | P1 | P2,P3,P4,P5 |
| `P7` | MFP-07 | Unit-test the foundation (base `Modal` + the three new hooks). | P1 | P6 |
| `P8` | MFP-08 | Make AiSettingsModal a real dialog: name, portal, Escape, focus trap, token z-index, no `any`. | P0 | P2 |
| `P9` | MFP-09 | Give MapServiceDialog a focus trap + Escape and fix its listbox/option roles. | P0 | — |
| `P10` | MFP-10 | Make NewFileModal keyboard-operable, move the dialog role to the panel, extract template data. | P1 | P6 |
| `P11` | MFP-11 | Turn NewProjectModal's template cards into keyboard-operable radios. | P1 | P6 |
| `P12` | MFP-12 | Fix GlobalSearch combobox/listbox semantics, arrow navigation, and the 640px reflow floor. | P1 | P6 |
| `P13` | MFP-13 | Replace the five hand-rolled focus traps with the shared hook. | P2 | P2 |
| `P14` | MFP-14 | Give every dialog a real `aria-labelledby` accessible name. | P1 | P6 |
| `P15` | MFP-15 | Replace raw modal z-index numbers with tokens (fix occlusion). | P2 | P5 |
| `P16` | MFP-16 | Slim SettingsModal: extract key-verification + virtualization and enable reflow. | P3 | P6 |
| `P17` | MFP-17 | Gate close-delays on reduced-motion and replace Urban's untyped events with `synapseBus`. | P2 | — |
| `P18` | MFP-18 | Map dialog family cleanup: dead code, responsive grids, CSV memoization. | P2 | — |
| `P19` | MFP-19 | Decompose the 6,791-line Map Explorer Core (staged) and route errors via `reportError`. | P3 | P20 |
| `P20` | MFP-20 | Add focus/Escape/axe tests for every modal + z-index/name lint guardrails. | P2 | P6 |
| `P21` | MFP-21 | Establish `brand.ts` and unify the product name across modals/shell. ⚠ needs your sign-off | P2 | — |
| `P22` | MFP-22 | Fix `index.html` title/favicon/meta + version for release. ⚠ needs your sign-off | P2 | P21 |

⚠ = the agent confirms the canonical name/version with you (via a question) before editing.

## Recommended order

Dependencies are enforced automatically (the agent refuses a prompt whose prerequisite
isn't `done`). A safe path:

```
P1 → P2 → P9        (quick wins / blockers)
P3 → P4 → P5 → P6 → P7   (foundation)
P8 → P10 → P11 → P12 → P14 → P15 → P13 → P17 → P18 → P20   (migrate + fix)
P21 → P22           (branding/release — your sign-off)
P16 → P19           (decomposition — last)
```

## Shortcuts (optional)

- `status` → summarise [`STATE.json`](./STATE.json) (counts + the next actionable prompt).
- `next` → run the lowest-numbered `pending` prompt whose dependencies are met.

That's it — send a `P#` and I'll execute just that one, with proof.
