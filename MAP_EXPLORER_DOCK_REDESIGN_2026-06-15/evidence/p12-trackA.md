# p12 Track A — Right dock motion + reduced-motion behavior

Status: done

## Scope delivered
- Added motion-aware open/close gating for the right-dock host in `src/centerpanel/components/map/MapRightDockHost.tsx` and `src/centerpanel/components/map/MapRightDockHost.module.css`.
- Kept entrance/exit visuals restrained and transform-based so the dock remains immediately interactive while the animation plays.
- Passed `reducedMotion` and `closing` state from `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeView.tsx` so the host renders its final state immediately when reduced-motion is enabled.
- Added regression coverage in `src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx` for the motion flags and body wrapper contract.

## Tests and validation
- `npx vitest run src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx` ✅
- `npm run typecheck` ✅
- `pwsh -File scripts/check-no-tailwind-centerpanel.ps1` ✅

## Evidence
- `evidence/p12-open.png`
- `evidence/p12-close.png`
- `evidence/p12-reduced-motion.png`