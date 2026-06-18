# LEDGER — Modal Remediation Final-Wave

Append-only human progress log (anti-amnesia). One row per prompt execution. The machine
mirror is [`STATE.json`](./STATE.json); keep them in sync. Newest entries at the bottom.

## Status legend
`pending` · `in_progress` · `blocked` · `done` (gate green + proofs captured) · `verified` (reviewed)

## Log

| Date | Prompt | Status | Commit | Gate | Proofs | Notes |
|---|---|---|---|---|---|---|
| 2026-06-17 | — | pack created | 69bee05.. | n/a | n/a | Pack scaffolded: prompts.json (22), schema, triggers, STATE, CLAUDE/SKILL/PROOF, modal-fix skill. No prompt executed yet. |
| 2026-06-18 | MFP-01 | done | 3f393e3ea3.. | general | proofs/MFP-01/ | KeysModal.tsx:174 undefined `color:GOLD` → `var(--syn-accent-gold, #f5b301)`. typecheck + lint:errors clean; render-smoke test added (1 passed). |
| 2026-06-18 | MFP-02 | done | 0dceb8adea.. | gis | proofs/MFP-02/ | Promoted useFocusTrap to src/hooks/ (verbatim); map path → `export * from '@/hooks/useFocusTrap';`. Pure move + re-export. typecheck clean; 932 unit tests pass (map-accessibility unchanged + new hooks trap test); lint:errors clean; no-tailwind check env-blocked (no PowerShell) — manually verified. Unblocks MFP-06/MFP-13. |
| 2026-06-18 | MFP-03 | done | 80eda980c7.. | general | proofs/MFP-03/ | Added src/hooks/useScrollLock.ts — ref-counted body-scroll lock; first lock saves prior overflow + sets 'hidden', last release restores saved value (not 'unset'); SSR-safe. Fixes M5. Modal.tsx untouched (MFP-06 wires it). typecheck clean; vitest src/hooks = 5 passed; lint:errors clean. |
| 2026-06-18 | MFP-04 | done | 07996b68c0.. | general | proofs/MFP-04/ | Added src/hooks/useInertBackground.ts — generalizes map-shell sibling-exclusion; sets inert + aria-hidden on body siblings while active (excludes self branch + modal/portal root + data-map-overlay-root), restores prior state (nested-safe), SSR-safe, no any. Fixes M6. Modal.tsx untouched (MFP-06 wires it). typecheck clean; vitest src/hooks = 8 passed; lint:errors clean. |
| 2026-06-18 | MFP-05 | done | 7966fd5ae5.. | general | proofs/MFP-05/ | Published z-index CSS vars: design.ts zIndex += systemBanner:10090 (above toast); theme.ts publishes --z-system-banner + --z-statusbar. Single source of truth = design.ts; no consumer migrated (MFP-15). typecheck clean; color:guard clean; zIndexTokens drift test = 2 passed; lint:errors clean. Unblocks MFP-15. |
| 2026-06-18 | MFP-06 | done | 6bb6635f5c.. | general | proofs/MFP-06/ | Rebuilt base Modal on MFP-02/03/04/05 hooks (M1–M9): useFocusTrap trap+restore, useId title id, dialog-scoped Escape + backdrop-only click, useScrollLock, useInertBackground, aria-live, token surface, min-width reflow, reduced-motion; optional ariaLabel/describedby; no any. typecheck + lint:errors clean; Modal.a11y.test.tsx 6/6; full vitest 3085 passed (3 failures pre-existing on master, verified). CAVEAT: e2e-a11y env-blocked (no Playwright browser) — jsdom a11y suite + keyboard.md substitute. Unblocks MFP-07/10/11/12/14/16/20. |

## How to add a row (when you run a prompt)
1. Run the prompt via the **modal-fix** skill (trigger, e.g. `P1`).
2. After the gate is green and `proofs/<id>/` is populated, append a row here:
   `| <date> | MFP-XX | done | <sha> | <gate> | proofs/MFP-XX/ | <one line> |`
3. Update `STATE.json[MFP-XX]` to match (status, commit, notes).
4. **Finalize (standing policy):** commit this ledger/STATE update, push the branch, open
   the PR, and **merge it into `master`**. The owner authorized this end-of-prompt flow for
   the pack (see [`CLAUDE.md`](./CLAUDE.md) §6) — no need to re-ask. Never merge a prompt
   whose gate failed or whose proofs are missing.

## Release checklist (all must be `verified`)
- [ ] Phase 0: MFP-01, MFP-08, MFP-09
- [ ] Phase 1: MFP-02, MFP-03, MFP-04, MFP-05, MFP-06, MFP-07
- [ ] Phase 2: MFP-10, MFP-11, MFP-12, MFP-13, MFP-14, MFP-15, MFP-17, MFP-18, MFP-20, MFP-21, MFP-22
- [ ] Phase 3: MFP-16, MFP-19
- [ ] `npm run validate:rc` green
- [ ] Branding confirmed with owner (MFP-21/MFP-22)
