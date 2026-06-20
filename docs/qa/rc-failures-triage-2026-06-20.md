# RC functional e2e failures — triage (2026-06-20)

`npm run validate:rc` (MFP-20) originally passed typecheck, lint, full Vitest,
build, perf budgets, smoke e2e, and a11y e2e, then the **broad non-smoke
functional Playwright** segment reported **43 failures / 45 passes**. The
2026-06-20 finalization pass resolved the stale/strict-mode/layout clusters and
capability-gated real-model coverage; `npm run validate:rc` now exits **0**.
Proof: `docs/audits/modal-remediation-pack/proofs/MFP-22/validate-rc.txt`.

## Root-cause categories

### A. Stale e2e specs vs. the redesigned command center (dominant cluster)
The largest share of failures — the **"element(s) not found" (24×)** and downstream
**`toBeVisible()` failed (25×)** clusters — trace to an **obsolete UI affordance**
the specs depend on.

The `openAdvancedCommand(page, mapExplorer, directName, menuName)` helper
(duplicated across ~10 specs: `map-observability-p56`, `map-plugins-p55`,
`map-model-builder`, `map-join-relate-preview`, `map-layout-book`,
`map-processing-toolbox{,-tools,-design}`, `map-modal-layout`,
`map-performance-diagnostics`) falls back to:

```ts
mapExplorer.getByRole("button", { name: "Scientific QA, 3D sync, density, and command controls" })
// then: page.getByRole("menu", { name: "Advanced commands" }).getByRole("menuitem", { name: menuName })
```

**Neither the button label nor the `"Advanced commands"` menu exists in current
source** (`git log -S` shows the literal was never present). The command center was
redesigned to **"Open map commands"** (`MapToolbar.tsx` → `ToolbarMenuButton`
`ariaLabel="Open map commands"`, `testId="map-commands-trigger"`, with a searchable
"Search commands" menu). The underlying commands (Diagnostics, processing toolbox,
plugins, …) are still reachable — only the spec helper targets a dead affordance.

→ **Test maintenance, not an app regression.** Remediation landed in
`e2e/helpers/mapExplorer.ts`: stale duplicated helpers now drive the current
command center (`map-commands-trigger` → search → menuitem, with command palette
fallback).

### B. Real duplicate-`data-testid` bugs (strict-mode violations)
1. **`map-worker-recovery-retry` ×2** — `MapPerformanceDiagnosticsPanel.tsx`
   rendered the same testid on both the telemetry-feed event retry (:596) and the
   operational-status retry (:729); for a recoverable failure both mount → strict
   mode violation (`map-observability-p56`). **FIXED** — the operational-status one
   is now `map-worker-recovery-retry-status`; the event retry keeps the canonical id
   the spec targets. Diagnostics unit tests 6/6 green.
2. **`map-layer-inspector` ×2** — `LayerInspector` (renders `data-testid="map-layer-inspector"`)
   is mounted in **both** `controllers/MapRightDockBodyContent.tsx:532` and
   `inspector/MapInspectorHost.tsx:168`; when both are visible, two elements collide
   (`map-modal-layout` inspector checks). **FIXED in MFP-19** — the canonical
   inspector mount is `MapInspectorHost`; the right dock now points operators to
   that single source of truth.

### C. Layout-dependent visibility
Some `map-modal-layout.spec.ts` checks (e.g. "keeps map, layer rail, and bottom
status visible on desktop", :817) depend on the left rail fitting the workspace.
The **left-dock fit fix (PR #48)** restores the rail to full height. **CONFIRMED**
in the final `validate:rc`: the broad functional segment passed 83/83 default
tests, including the `map-modal-layout` layout-visibility checks.

### D. Environment-dependent (not UI regressions)
`geoai-real-data.spec.ts` (5×) and the object-detection "Real model detection
published" notices need real models / network egress. These are
`environment_dependent` and are tagged `@real-model`. `npm run validate:rc`
excludes them by default through `scripts/run-e2e-functional.mjs`; set
`RUN_REAL_MODELS=1` to include them in the functional Playwright segment.

## Recommended remediation order (browser-capable env)
1. Update the `openAdvancedCommand` helper → current command center (clears Category A). **Done.**
2. Land the `map-layer-inspector` single-mount fix inside **MFP-19**. **Done.**
3. Re-run `npm run validate:rc`; confirm the left-dock fix clears the Category C layout checks. **Done; RC green.**
4. Gate or tag the Category D geoai/object-detection specs behind a real-model capability flag. **Done.**

Final status: default RC is green. Real-model assertions remain
`environment_dependent` and run only with `RUN_REAL_MODELS=1`.
