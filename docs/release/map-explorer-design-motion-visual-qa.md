# Map Explorer Design, Motion, and Visual QA Notes

Date: 2026-05-30
Status: Prompt 63 close-out reference

Map Explorer's GIS shell uses the Prompt 35/36 token and primitive layer. Visual state must carry text labels and semantic status, not color alone.

## Design Contract

- Canonical UI surface: `src/centerpanel/components/map/`.
- Shared primitives: `GisIconButton`, `GisStatusChip`, `GisTabs`, `GisSectionHeader`, `GisPropertyGrid`, `GisToolbar`, `GisEmptyState`, `GisProgressBar`, and `GisTooltip`.
- Status vocabulary: ready, caveat, blocked, demo, generated, unknown, external, sampled, tiled, and local-only/offline where applicable.
- CSS approach: CSS Modules or local tokenized styles. `src/centerpanel/` remains guarded by `npm run lint:no-tailwind-centerpanel`.
- Layout rule: the map canvas remains primary. Rails, drawers, floating panels, and bottom timeline/status surfaces must not overlap or hide critical controls at desktop, tablet, or short viewport sizes.

## Motion Contract

- Motion classes live in `src/centerpanel/components/map/design/motion.module.css`.
- Current animated classes are `panelIn`, `layerFade`, `accentGrow`, `statusFlash`, `progressFill`, `fadeIn`, and `featurePulse`.
- Every animated class has a `prefers-reduced-motion: reduce` counterpart that disables animation and transition.
- Temporal playback must respect reduced-motion by preventing auto-play when reduced motion is active.
- 3D interaction strips and scene controls must avoid layout shifts and preserve keyboard/focus visibility.

## Visual QA Coverage

| Gate | Evidence |
| --- | --- |
| Token/status layer | `src/centerpanel/components/map/__tests__/mapTokenStatus.test.ts`, `e2e/map-token-status.spec.ts` |
| Workbench shell primitives | `src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx`, `e2e/map-shell-p36.spec.ts` |
| Operator visual pass | `src/centerpanel/components/map/__tests__/mapOperatorVisualPass.test.tsx`, `e2e/map-shell-p37.spec.ts` |
| Table/toolbox/layout visual pass | `e2e/map-processing-toolbox-design.spec.ts`, layout composer tests |
| Reduced motion | `src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts`, `e2e/map-motion-p39.spec.ts` |
| Canvas nonblank and visual release gate | `src/centerpanel/components/map/__tests__/mapVisualQA.test.ts`, `e2e/map-visual-qa-p40.spec.ts` |
| Raster/temporal/3D evidence states | `e2e/map-evidence-visual-p62.spec.ts` with raster, temporal, and 3D screenshots |

## Manual Review

Use [`../map-visual-qa-checklist.md`](../map-visual-qa-checklist.md) before a release-candidate tag. Automated tests prove the release gate surface, but manual review should still check high-contrast mode, provider-tile behavior, wide/short viewport composition, and any screenshot artifacts produced under `e2e/__screens__/`.
