# p10 Track A — Right dock single-click open + state cleanup

Status: done

## Scope delivered
- Added a single topbar inspector command in `src/centerpanel/components/map/MapToolbar.tsx`:
  - command id: `inspector`
  - one click opens the right dock on default panel `inspect`
  - second click closes it (toggle semantics)
- Wired the topbar command in `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx`:
  - new `handleToggleInspectorPanel`
  - opens Inspector with best-available layer context when present
  - uses existing route-model toggle path (`toggleRightDockPanel`) only
- Completed focus behavior through the route model:
  - `src/centerpanel/components/map/controllers/useMapRightDockRouting.ts`
  - toggle-close now restores focus to trigger when `focusReturn === "trigger"`
- Ensured focus enters the dock on open for Inspector too:
  - `src/centerpanel/components/map/MapRightDockHost.tsx`
- Added explicit single-click route contract coverage:
  - `src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts`

## Verification
- `npx vitest run src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts` ✅
  - 3 files passed, 23 tests passed.
- `npm run typecheck` ✅

## Notes
- During capture setup, this environment lacked a local `vitest` installation and had missing runtime deps; installed `vitest`, `@duckdb/duckdb-wasm`, and `onnxruntime-web` to restore required validation/capture tooling.
- Added `optimizeDeps.exclude: ['pdf-lib']` in `vite.config.ts` to avoid a corrupted `pdf-lib/es` package shape breaking dev dependency pre-bundling in this environment.