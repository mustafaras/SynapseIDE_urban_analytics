# PROOF — evidence requirements

**No proof → not done.** A prompt is `done` only when its `gate` passes **and** every
`proofRequired` token (in [`prompts.json`](./prompts.json)) has a saved artifact under
`proofs/<id>/`. Proof is what lets a later session (or reviewer) trust the work without
re-running everything — it is the anti-amnesia backbone alongside [`STATE.json`](./STATE.json).

## Folder layout

```
proofs/
  MFP-01/
    typecheck.txt          # full `npm run typecheck` output (must show 0 errors)
    render.txt             # mount/smoke proof
    SUMMARY.md             # 3-5 lines: what changed, commit sha, result
  MFP-08/
    typecheck.txt
    axe.json               # axe results (no serious/critical)
    keyboard.md            # Tab / Shift+Tab / Escape / focus-restore checklist
    before.png  after.png  # visual proof
    SUMMARY.md
  ...
```

Every `proofs/<id>/` MUST contain a `SUMMARY.md` (what changed, commit sha, gate result,
which proofs are present).

## Token → artifact

| token | artifact in `proofs/<id>/` | pass condition |
|---|---|---|
| `typecheck-clean` | `typecheck.txt` | `tsc --noEmit` 0 errors |
| `lint-clean` | `lint.txt` | `lint:errors` 0 errors |
| `deadcode-clean` | `deadcode.txt` | no **new** dead exports |
| `color-guard` | `color-guard.txt` | palette regression check passes |
| `perf-budgets` | `perf.txt` | chunk budgets within limits |
| `unit-test` | `test-unit.txt` | new/affected tests pass |
| `e2e-a11y` | `test-e2e-a11y.txt` | `test:e2e:a11y` green |
| `axe-clean` | `axe.json` | no serious/critical violations |
| `screenshot` / `visual-diff` | `*.png` (before/after) | shows the change; map → **screenshot-map-explorer** |
| `manual-keyboard` | `keyboard.md` | Tab/Shift+Tab/Escape/focus-restore all checked |
| `render-smoke` | `render.txt` | component mounts without error |

## Capture tips

- Pipe check output to a file, e.g. `npm run typecheck > docs/audits/modal-remediation-pack/proofs/MFP-01/typecheck.txt 2>&1`.
- Map screenshots: invoke the **screenshot-map-explorer** skill and move the PNGs into the
  prompt's proof folder.
- `keyboard.md` template:
  ```
  # MFP-08 keyboard proof
  - [x] Focus enters dialog on open (lands on first control)
  - [x] Tab cycles within; does not escape to background
  - [x] Shift+Tab wraps backward
  - [x] Escape closes
  - [x] Focus returns to the trigger button on close
  ```

## Review → `verified`

After proofs exist and the gate is green, a reviewer (or a second pass) confirms the
artifacts and flips `STATE.json[id].status` from `done` to `verified`. Only `verified`
prompts count as fully closed for the release checklist.
