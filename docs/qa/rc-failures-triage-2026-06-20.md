# RC functional e2e failures — triage (2026-06-20)

`npm run validate:rc` (MFP-20) passes typecheck, lint, full Vitest, build, perf
budgets, smoke e2e, and a11y e2e, then the **broad non-smoke functional
Playwright** segment reports **43 failures / 45 passes**
(`docs/audits/modal-remediation-pack/proofs/MFP-20/validate-rc.txt`, owner-waived
to merge + deploy). This is the categorization of those 43.

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

→ **Test maintenance, not an app regression.** Remediation: update the shared
`openAdvancedCommand` helper to drive the current command center
(`map-commands-trigger` → search → menuitem). Best done in a browser-capable env so
each spec can be re-run to confirm. **Not fixed here** (the sandbox cannot launch
Playwright — Chromium `…-1217` missing — so spec rewrites cannot be verified).

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
   (`map-modal-layout` inspector checks). **Deferred to MFP-19** (map-core
   decomposition) — it needs a single-source-of-truth inspector mount, an
   architectural change in scope for that prompt, not a blind testid rename.

### C. Layout-dependent visibility (may already be resolved)
Some `map-modal-layout.spec.ts` checks (e.g. "keeps map, layer rail, and bottom
status visible on desktop", :817) depend on the left rail fitting the workspace.
The **left-dock fit fix (PR #48)** restores the rail to full height, so these may now
pass — to be confirmed on the next browser-capable `validate:rc`.

### D. Environment-dependent (not UI regressions)
`geoai-real-data.spec.ts` (5×) and the object-detection "Real model detection
published" notices need real models / network egress. These are
`environment_dependent`, expected to fail without that capability.

## Recommended remediation order (browser-capable env)
1. Update the `openAdvancedCommand` helper → current command center (clears Category A).
2. Land the `map-layer-inspector` single-mount fix inside **MFP-19**.
3. Re-run `npm run validate:rc`; confirm the left-dock fix clears the Category C layout checks.
4. Gate or tag the Category D geoai/object-detection specs behind a real-model capability flag.

After 1–3, the functional suite should be substantially green; remaining reds should
be only the Category D capability-gated specs.
