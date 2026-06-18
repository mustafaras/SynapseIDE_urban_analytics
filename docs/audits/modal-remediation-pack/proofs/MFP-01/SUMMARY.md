# MFP-01 — Proof summary

**Prompt:** MFP-01 — Fix the undefined `GOLD` runtime bug in KeysModal
**Gate:** general (`npm run typecheck` + `npm run lint:errors`)
**Branch:** claude/modal-fix-p1-0r2g87

## Change
`src/components/ai/panel/KeysModal.tsx:174` — the dialog title used a bare,
undefined identifier `color:GOLD`. Repo-wide grep for `\bGOLD\b` confirmed a
single occurrence (the bug itself); only `GOLDEN_RATIO`/`GOLDEN_PAIRS` exist,
so there was no import to restore. Replaced with the file's `var(--syn-*)`
convention:

```diff
- ... textTransform:'uppercase', color:GOLD }}>Provider Keys</div>
+ ... textTransform:'uppercase', color: 'var(--syn-accent-gold, #f5b301)' }}>Provider Keys</div>
```

Inline-style object shape, key order, and the surrounding file are otherwise
unchanged. No module-level `const GOLD` introduced (avoids unused-token lint).
No `z-index` touched (centralized later in MFP-15). No new `any`.

## Proofs in this directory
- `typecheck.txt` — `npm run typecheck` clean, no `Cannot find name 'GOLD'`. **(typecheck-clean)**
- `render.txt` — vitest render smoke: `KeysModal` mounts without a
  `ReferenceError`, exposes `role="dialog"` + `aria-labelledby`. 1 passed. **(render-smoke)**
- `lint.txt` — `npm run lint:errors` clean (exit 0).

## Acceptance
- [x] typecheck passes with no `Cannot find name 'GOLD'`.
- [x] `KeysModal` mounts without `ReferenceError: GOLD is not defined`.
- [x] Title renders in amber accent (`var(--syn-accent-gold, #f5b301)`).
- [x] No other line changed; inline style key order preserved.

## Test added
`src/components/ai/panel/__tests__/KeysModal.smoke.test.tsx` — render smoke
(jsdom). Uses plain DOM assertions (jest-dom not installed in this repo).
