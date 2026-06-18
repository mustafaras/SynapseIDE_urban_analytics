# TRIGGERS — context-light prompt dispatch

**Why:** so you can fire any prompt without re-pasting it and without flooding context.
Type a trigger; the agent loads **only** that one prompt object from
[`prompts.json`](./prompts.json) and runs the [`modal-fix`](../../../.claude/skills/modal-fix/SKILL.md)
procedure. Machine map: [`triggers.json`](./triggers.json).

## How to fire a prompt

Any of these resolve to the same task — e.g. for AI Settings:

```
P8            MFP-08            ai-settings            /modal-fix 8
```

The agent then: resolve → guard deps (STATE.json) → load one prompt → edit → validate →
capture proofs → update STATE/LEDGER → report. It will **not** read the other prompts or
the full audits.

## Trigger table

| Trigger(s) | id | Pri | Phase | Title |
|---|---|---|---|---|
| `P1` · `keys-gold` · `gold-bug` | MFP-01 | P0 | 0 | Fix undefined `GOLD` in KeysModal |
| `P2` · `promote-focustrap` · `shared-hook` | MFP-02 | P0 | 1 | Promote `useFocusTrap` to a shared hook |
| `P3` · `scroll-lock` | MFP-03 | P1 | 1 | Ref-counted `useScrollLock` |
| `P4` · `inert` · `inert-background` | MFP-04 | P1 | 1 | `useInertBackground` |
| `P5` · `z-index-tokens` · `ztokens` | MFP-05 | P1 | 1 | Publish z-index CSS tokens |
| `P6` · `base-modal` · `rebuild-modal` | MFP-06 | P1 | 1 | Rebuild base `Modal` on foundation |
| `P7` · `foundation-tests` | MFP-07 | P1 | 1 | Foundation unit tests |
| `P8` · `ai-settings` | MFP-08 | P0 | 0 | AiSettingsModal conformant dialog |
| `P9` · `map-service` | MFP-09 | P0 | 0 | MapServiceDialog trap/role/shadowing |
| `P10` · `new-file` | MFP-10 | P1 | 2 | NewFileModal role/selectors/focus/data |
| `P11` · `new-project` | MFP-11 | P1 | 2 | NewProjectModal keyboard cards |
| `P12` · `global-search` | MFP-12 | P1 | 2 | GlobalSearch combobox/listbox/reflow |
| `P13` · `migrate-traps` · `dedupe-traps` | MFP-13 | P2 | 2 | Migrate bespoke traps to hook |
| `P14` · `names` · `accessible-names` | MFP-14 | P1 | 2 | Standardize accessible names |
| `P15` · `apply-ztokens` · `z-index-fix` | MFP-15 | P2 | 2 | Apply z-index tokens (occlusion) |
| `P16` · `settings-extract` | MFP-16 | P3 | 3 | SettingsModal extract/reflow |
| `P17` · `urban-welcome` · `reduced-motion` | MFP-17 | P2 | 2 | Urban/Welcome RM + typed events |
| `P18` · `map-dialog-family` | MFP-18 | P2 | 2 | Map dialog family cleanups |
| `P19` · `map-core` · `decompose` | MFP-19 | P3 | 3 | Decompose Map Explorer Core |
| `P20` · `tests` · `guardrails` | MFP-20 | P2 | 2 | Tests + regression guardrails |
| `P21` · `branding` · `naming` | MFP-21 | P2 | 2 | Branding & name consistency ⚠ decision |
| `P22` · `release` · `publish-assets` | MFP-22 | P2 | 2 | Release assets (title/favicon/meta) ⚠ decision |

⚠ = `requiresHumanDecision` — the agent will confirm the canonical name/version first.

## Batch / phase triggers (optional)

- `phase 0` → MFP-01, MFP-08, MFP-09 (quick wins / blockers)
- `phase 1` → MFP-02..MFP-07 (foundation)
- `phase 2` → MFP-10..MFP-15, MFP-17, MFP-18, MFP-20, MFP-21, MFP-22
- `phase 3` → MFP-16, MFP-19 (decomposition, last)
- `next` → the lowest-id prompt in STATE.json whose status is `pending` and whose deps are met
- `status` → summarise STATE.json (counts per status, next actionable prompt)

When firing a batch, run prompts **one at a time**, committing + recording each before the
next, so the ledger stays truthful and context stays small.
