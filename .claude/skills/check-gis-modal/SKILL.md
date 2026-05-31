---
name: check-gis-modal
description: Run the validation gate for Map Explorer and GIS Modal Premium UI work. Use after edits to src/centerpanel/components/map/, src/services/map/, Map Explorer e2e specs, GIS modal CSS modules, map visual QA docs, or GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31 ledger/prompt work.
---

# Validate GIS Modal Work

Use this after any GIS Modal Premium UI prompt or direct Map Explorer change. Prefer prompt-specific validation from `GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/LEDGER.md`; use this as the fallback gate and failure triage guide.

## Baseline Gate

Run in order:

```bash
npm run typecheck
npm run lint:errors
```

If any `src/centerpanel/` file changed:

```bash
npm run lint:no-tailwind-centerpanel
```

If any `src/centerpanel/components/map/` file changed:

```bash
npx vitest run src/centerpanel/components/map
```

If any `src/services/map/` file changed:

```bash
npx vitest run src/services/map
```

If visible layout, activity rail, command center, sidebar, inspector, bottom panel, canvas controls, motion, accessibility, or visual QA changed:

```bash
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

If lazy loading, bundle boundaries, worker boundaries, 3D/raster imports, or final release readiness changed:

```bash
npm run build
```

If Urban Analytics was touched for typed bridge compatibility:

```bash
npm run typecheck
npm run test:analytics
```

## Prompt Evidence Checklist

Record the relevant proof in the GIS modal `LEDGER.md`:

- command coverage: all moved or hidden commands remain mapped and palette-searchable
- layout proof: no overlap, clipped controls, duplicate headers, or status bar obstruction
- motion proof: `prefers-reduced-motion` disables non-essential animation
- scientific truthfulness: CRS, QA, demo, synthetic, sample, generated, external, noData, and provenance caveats remain visible
- accessibility proof: icon labels, disabled reasons, keyboard reachability, focus return, scoped Escape
- performance proof: heavy inactive panels are not eagerly mounted
- push proof: prompt branch pushed and integration branch fast-forwarded

## Failure Triage

- Type errors first. With `exactOptionalPropertyTypes`, do not pass `undefined` to optional props unless the type explicitly allows it.
- Lint failures in `centerpanel/` often mean accidental Tailwind strings or unused imports from abandoned UI attempts.
- Command coverage failures mean a hidden toolbar action lost a new home. Restore it through command metadata or palette routing.
- Visual e2e failures usually indicate panel overlap, short viewport clipping, or a stale selector. Preserve `data-testid` values or update tests in the same prompt.
- Scientific failures are blockers. Do not soften missing CRS, demo/sample/generated labels, provider dependency, metadata-only state, noData caveats, or disabled reasons for polish.
- Build failures after visual work often come from eager imports. Move heavy 3D/raster/model surfaces behind existing lazy boundaries.

## Cleanup Rules

- Do not commit `dist/`, `test-results/`, Playwright reports, or `e2e/__screens__/` screenshots.
- Temporary e2e specs used for screenshots must be deleted before final status.
- Do not mark a GIS prompt complete until validation results and residual risk are in `LEDGER.md`.
