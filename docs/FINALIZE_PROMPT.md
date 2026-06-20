# Finalization prompt — bring Synapse IDE to its 1.0-ready state

> **Hand this whole file to a VS Code coding agent** (Cursor / Copilot / Claude in VS Code)
> running in a **browser-capable environment** (real Playwright Chromium installed —
> `npx playwright install chromium` works). The previous wave was completed in a sandbox that
> **could not launch Playwright** (`chromium_headless_shell-1217` missing), so everything that
> needs `npm run test:e2e` / `test:e2e:a11y` / `validate:rc` was deferred. Your job is to close
> those gaps and ship.

---

## 0. Context you must load first

- Repo: `mustafaras/synapseide_urban_analytics`. Work from latest `master`.
- Operating manual: **`docs/audits/modal-remediation-pack/CLAUDE.md`** (read it).
- State machine: `docs/audits/modal-remediation-pack/STATE.json` (+ `LEDGER.md`). A `modal-fix`
  skill exists for running pack prompts by trigger (`P19`, `P20`, …).
- Triage of the broken functional suite: **`docs/qa/rc-failures-triage-2026-06-20.md`**.
- Repo guardrails (do not violate): `exactOptionalPropertyTypes`, **no `any`**, no direct
  `localStorage` (Zustand `persist`), errors via `reportError` (`src/lib/error-bus.ts`), **no
  Tailwind under `src/centerpanel/`**, no raw `z-index` literals (use `var(--z-*)` / design
  tokens), one audited focus trap (`src/hooks/useFocusTrap.ts`), cross-module events via typed
  `synapseBus`.

### Current state (start line)
`MFP-01…18, 20, 21, 22 = done` · `MFP-19 = in_progress (STAGE A merged)` · the broad
functional Playwright suite has **43 residual failures** (owner-waived for the 0.9.0 cut).
Version is **0.9.0** (`BRAND` in `src/constants/brand.ts`, `package.json`, `index.html` all in
sync). Brand is **"Synapse IDE — GIS & Urban Analytics Workbench"**.

### Per-task workflow (standing policy — same as the pack)
For **each** task below: branch from `master` → implement → **gate green** → capture proofs →
update `STATE.json` + `LEDGER.md` → commit → push → open PR → **squash-merge to `master`** →
sync local `master`. One focused PR per stage/task. Commit trailer:
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` (never put a model id in commits/PRs).
Do **not** merge a task whose gate fails or whose proofs are missing.

---

## TASK 1 — MFP-19 Stages B–E (finish the map-core decomposition)

**File:** `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx` (~6.8k
lines) + `MapExplorerModalRuntimeView.tsx`. Stage A (collapse passthroughs) is already merged.
**Gate per stage:** `gis` **+ `npm run test:e2e`** (must stay green — esp.
`e2e/accessibility-audit.spec.ts` Prompt 03/55 @a11y) **+ `npm run perf:budgets`**. One PR per stage.

- **Stage B — group the 170-field View props.** Replace `MapExplorerModalRuntimeViewProps`
  (`MapExplorerModalRuntimeView.tsx` ~L37–208) with a small set of explicit grouped context
  objects / per-panel context providers (e.g. `SceneContext`, `AnalyzeContext`, `DrawContext`,
  `RightDockContext`). Lift panel state into the existing controller hooks (`useMapPanelLayout`,
  `useMapWorkflowController`, `useMapDataOutputController`, … already imported in Core). Shrink the
  single ~170-prop spread materially. **No `any`; explicit context types.**
  - **Fold in the `map-layer-inspector` single-mount fix** (a real strict-mode bug):
    `LayerInspector` renders `data-testid="map-layer-inspector"` and is mounted in **both**
    `controllers/MapRightDockBodyContent.tsx:~532` **and** `inspector/MapInspectorHost.tsx:~168`.
    When both are visible, Playwright sees 2 elements. Make the inspector a **single source of
    truth** (one mount path) so only one `map-layer-inspector` exists at a time.
- **Stage C — route errors through `reportError`.** Convert the ~51 **error-path** `toast*` calls
  in Core to `reportError({ source, code, message, detail })`. Keep `toastSuccess`/`toastInfo`/
  `toastWarning`. Remove the now-unused `toastError` import. Add a unit test asserting an induced
  error path calls `reportError` (spy), not `toastError`. (`reportError` dedups within 2s — don't
  double-report from catch + finally.)
- **Stage D — top-level shell error boundary.** Wrap the runtime root in a shell-level error
  boundary (reuse/generalize `MapPanelErrorBoundary`) so a render failure shows a recoverable
  shell error instead of unmounting the modal. Keep the per-panel boundaries.
- **Stage E — lazy-load heavy modules off the open path.** Move `SAMPLE_BUILDINGS` (Core ~L21),
  the processing/plugin/model registries (Core ~L46–48), and `SpatialDB` (Core ~L112) behind
  dynamic `import()` / `React.lazy` gated on the feature actually opening (reuse the existing
  `Suspense` infra). Prove the eager open-path chunk shrank with `npm run perf:budgets`
  (before/after).
- **Proofs → `proofs/MFP-19/`:** `e2e-a11y.txt` (green), `perf-budgets.txt` (Stage E before/after),
  per-stage `typecheck-clean.txt`. Flip `STATE.json[MFP-19]` to `done` only after **Stage E**.

## TASK 2 — Make `npm run validate:rc` green (the 43 functional e2e residuals)

Read `docs/qa/rc-failures-triage-2026-06-20.md` first. The dominant cluster is **stale specs**, not
app bugs.

- **2A — fix the obsolete `openAdvancedCommand` helper.** It is duplicated across ~10 specs
  (`map-observability-p56`, `map-plugins-p55`, `map-model-builder`, `map-join-relate-preview`,
  `map-layout-book`, `map-processing-toolbox{,-tools,-design}`, `map-modal-layout`,
  `map-performance-diagnostics`). Its fallback targets a button named **"Scientific QA, 3D sync,
  density, and command controls"** opening a `role="menu"` named **"Advanced commands"** — **both
  removed** in the command-center redesign. The current command center is
  `ToolbarMenuButton` `ariaLabel="Open map commands"` / `testId="map-commands-trigger"`
  (`src/centerpanel/components/map/MapToolbar.tsx:~2300`), with a searchable "Search commands"
  menu. **Rewrite the helper** to open `map-commands-trigger`, search/select the command by name,
  and **extract it to `e2e/helpers/mapExplorer.ts`** so all specs import one copy (dedupe).
- **2B** — confirm the **`map-layer-inspector` single-mount** fix (Task 1 Stage B) clears the
  `map-modal-layout` inspector strict-mode failures.
- **2C** — `map-worker-recovery-retry` was already de-duped (`map-worker-recovery-retry-status`,
  merged in `53fa1c7`); confirm `map-observability-p56` passes.
- **2D** — re-run `npm run validate:rc` and confirm the **left-dock fit fix** (PR #48) cleared the
  layout-visibility checks (e.g. `map-modal-layout` "keeps map, layer rail, and bottom status
  visible on desktop").
- **2E — environment-dependent specs.** `e2e/geoai-real-data.spec.ts` and the object-detection
  "Real model detection published" assertions require real models / network egress. **Do not
  fake them.** Tag them (e.g. `@real-model`) and exclude from `validate:rc` unless
  `RUN_REAL_MODELS=1`; document as `environment_dependent` in the triage doc.
- **Goal:** `npm run validate:rc` exits **0** (only capability-gated specs skipped). Then update
  `STATE.json[MFP-20]` notes — replace the "owner-waived RC residual" caveat with **"RC green"** —
  and add a LEDGER row.

## TASK 3 — Convert env-blocked `e2e-a11y` substitutes to full proofs

Run `npm run test:e2e:a11y` for real. For each prompt that recorded an env-blocked substitute
(**MFP-06, 13, 14, 20, 22**), save a green `proofs/<id>/e2e-a11y.txt` and drop the "env-blocked"
caveat in its `STATE.json` note. Confirm the Map Explorer `@a11y` suites stay green
(`aria-labelledby="map-explorer-title"`, skip link, scoped Escape).

## TASK 4 — Release finalization

1. `npm run validate:rc` green end-to-end (typecheck + lint + vitest + build + perf:budgets +
   e2e:ci/a11y). Save `proofs/MFP-22/validate-rc.txt`.
2. Confirm the **GitHub Pages** deploy (`.github/workflows/pages.yml`) succeeds on the merge.
3. **(Owner decision)** if cutting a true 1.0: bump `BRAND.version` + `package.json.version` +
   `index.html` together (the MFP-22 pattern) — otherwise stay on `0.9.0`.
4. Flip remaining `STATE.json` entries to `done`/`verified`; final `LEDGER.md` row; update the
   README release badge if the version changes.

---

## Definition of done

- `MFP-19` = `done` (Stages A–E merged); `map-layer-inspector` single-mounted.
- `npm run validate:rc` exits **0** (capability-gated `@real-model` specs excluded by default).
- `npm run test:e2e:a11y` green; MFP-06/13/14/20/22 carry real `e2e-a11y.txt` proofs.
- No `any`, no raw `z-index`, no Tailwind in `centerpanel/`, errors via `reportError`.
- `STATE.json` all `done`/`verified`; `LEDGER.md` current; Pages deploy green.
