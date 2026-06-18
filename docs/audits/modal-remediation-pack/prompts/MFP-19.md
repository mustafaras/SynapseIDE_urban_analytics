# MFP-19 — Decompose MapExplorerModalRuntimeCore (staged)

| Field | Value |
|---|---|
| Trigger | P19, map-core, decompose |
| Priority / Phase | P3 / Phase 3 |
| Depends on | MFP-20 |
| Gate | gis |
| Severity | high |
| Proof required | typecheck-clean, e2e-a11y, perf-budgets |

## 1. Why this matters
Findings `MX1`, `MX2`, `MX3`, `MX5`, and `MX6` identify `MapExplorerModalRuntimeCore.tsx` as a god-component: ~6791 lines with hundreds of hooks. It spreads a **170-field** View props object into a single JSX element, sits behind **three** pure passthrough files, routes **51 `toast*` calls and 0 `reportError`** for errors (violating the repo error-bus convention), has no top-level shell error boundary, and eagerly imports heavy analysis/registry/sample assets on the modal's critical boot path (`MX5`/`MX6`). This is the highest-risk refactor in the pack, so it is **staged (A–E)**, each stage its own PR behind green tests, and it explicitly **depends on MFP-20** so the regression guardrails exist before the code moves. The hard rule: do not regress Map a11y/e2e, and do not bundle this with the foundation changes.

## 2. Current state (evidence)

Three pure passthrough files (`MX3`):
- `MapExplorerModal.tsx:1-2`:
```ts
export { MapExplorerModal } from "./map/controllers/MapExplorerModalRoot";
export type { MapExplorerModalProps } from "./map/controllers/MapExplorerModalRoot";
```
- `MapExplorerModalRoot.tsx:10-12`:
```ts
export const MapExplorerModal: React.FC<MapExplorerModalProps> = (props) => {
  return <MapExplorerModalRuntime {...props} />;
};
```
- `MapExplorerModalRuntime.tsx:1-4`:
```ts
export {
  MapExplorerModal,
  type MapExplorerModalProps,
} from "./MapExplorerModalRuntimeCore";
```

170-field View props interface (`MX2`) — `MapExplorerModalRuntimeView.tsx:37` opens `interface MapExplorerModalRuntimeViewProps {` and closes at `L208` `}` (170 declared members counted), e.g. `MapExplorerModalRuntimeView.tsx:37-48`:
```ts
interface MapExplorerModalRuntimeViewProps {
  announce: (message: string) => void;
  handleOpenSceneTab: (tabId: MapSceneTabId, announcement: string) => void;
  navigatorStageMode: boolean;
  scene3DTabActive: boolean;
  …
  setShowPluginPanel: React.Dispatch<React.SetStateAction<boolean>>;
  pluginExtensions: React.ComponentProps<typeof MapPluginPanel>["extensions"];
```

The entire 170-prop object spread in one JSX element — `MapExplorerModalRuntimeCore.tsx:6609`:
```ts
<MapExplorerModalRuntimeView announce={announce} handleOpenSceneTab={handleOpenSceneTab} navigatorStageMode={navigatorStageMode} … showComparisonStrip={showComparisonStrip} showInteractionStrip={showInteractionStrip} />
```
(single line, ~170 props.)

51 `toast*` calls, 0 `reportError` (`MX1`) — `MapExplorerModalRuntimeCore.tsx:137`:
```ts
import { toastError, toastInfo, toastSuccess, toastWarning } from '../../../../ui/toast/api';
```
(repo grep: 51 `toast*` occurrences in this file, 0 `reportError`.)

Eager heavy imports on the boot path (`MX5`/`MX6`) — `MapExplorerModalRuntimeCore.tsx:21`, `46-48`, `112`:
```ts
import { SAMPLE_BUILDINGS } from '@/features/urbanAnalytics/voxcity';                 // L21
import { createMapProcessingRegistry, previewProcessingTool, runProcessingTool } from '…/services/map/processing';  // L46
import { createMapExtensionRegistry } from '…/services/map/plugins';                  // L47
import { buildMapModelCodeArtifactRequest, executeMapModel, … } from '…/services/map/model';  // L48
import { bindTableAlias, loadGeoJSON, toGeoJSON } from '…/engine/spatial-db/SpatialDB';  // L112
```
(`Suspense`/`React.lazy` already exist in the file at `L1`/`L140` for drawers, so lazy infra is available.)

Note: the View already wraps panels in `MapPanelErrorBoundary` (e.g. `MapExplorerModalRuntimeView.tsx:534`, `554`, `574`, `596`) — but there is no **top-level shell** error boundary around the runtime root.

## 3. Target state
- One controller file instead of three passthroughs; `MapExplorerModal` resolves directly to the runtime.
- The 170-prop View interface is replaced by grouped context objects / per-panel context providers, with panel state lifted into the existing controller hooks (`useMapPanelLayout`, `useMapWorkflowController`, `useMapDataOutputController`, etc., already imported at Core `L62-80`).
- All 51 error-path `toast*` calls route through `reportError` (`src/lib/error-bus.ts`); success/info/warning toasts stay as toasts.
- A top-level shell error boundary wraps the runtime root, in addition to the per-panel `MapPanelErrorBoundary`s.
- Heavy modules (`SAMPLE_BUILDINGS`, processing/plugin/model registries, `SpatialDB`) load lazily where not needed on open, verified by `perf:budgets`.

## 4. Implementation steps (staged A–E — each stage = its own PR behind green tests)
1. **STAGE A — collapse passthroughs.** Merge `MapExplorerModal.tsx` → `MapExplorerModalRoot.tsx` → `MapExplorerModalRuntime.tsx` into a single re-export. Keep `MapExplorerModal` and `MapExplorerModalProps` exported from the one surviving entry; update imports. No behavioural change. Verify `npx vitest run src/centerpanel/components/map` + e2e a11y stay green. PR #1.
2. **STAGE B — group the View props.** Replace the 170-field `MapExplorerModalRuntimeViewProps` (`View:37-208`) with grouped context objects (e.g. `SceneContext`, `AnalyzeContext`, `DrawContext`, `RightDockContext`) or per-panel context providers. Lift remaining panel state into the existing controller hooks. Reduce the `L6609` spread to a small number of context provider props. Do this incrementally (one group per commit if needed). PR #2.
3. **STAGE C — route errors through `reportError`.** Convert the 51 `toast*` **error** calls to `reportError({ source: 'adapter' | 'ui' | …, code, message, detail })`. Keep `toastSuccess`/`toastInfo`/`toastWarning` (non-error) as toasts. Remove the unused `toastError` import if all its call sites migrate. PR #3.
4. **STAGE D — top-level shell error boundary.** Add a shell-level error boundary around the runtime root (reusing or generalizing `MapPanelErrorBoundary`) so a render failure anywhere shows a recoverable shell error instead of unmounting the modal. PR #4.
5. **STAGE E — lazy-load heavy modules.** Move `SAMPLE_BUILDINGS` (`L21`), the processing/plugin/model registries (`L46-48`), and `SpatialDB` (`L112`) behind dynamic `import()` / `React.lazy` gated on the feature actually being opened (reuse the existing `Suspense` infra at `L1`/`L140`). Confirm the modal open-time improves and chunk budgets hold with `npm run perf:budgets`. PR #5.

## 5. Constraints & edge cases
- **MUST NOT regress Map a11y/e2e** — `npm run test:e2e` (esp. `accessibility-audit.spec.ts` Prompt 03/55 suites) must stay green after every stage. The map dialog's `aria-labelledby="map-explorer-title"`, skip link, and scoped-Escape behaviour are asserted there.
- **Do not bundle with foundation changes** (MFP-02/03/04/05/06) or with MFP-18 — each stage is an isolated PR.
- **Depends on MFP-20**: the parametrized axe/focus e2e loop + per-modal guardrails must land first so this refactor is fenced by regression tests.
- centerpanel = no Tailwind; CSS Modules only. No new `any`; grouped context types must be explicit.
- Keep the existing per-panel `MapPanelErrorBoundary` wrappers (`View:534/554/574/596`); STAGE D adds a shell boundary, it does not replace them.
- `reportError` dedups within 2s — do not double-report the same failure from both a catch and a finally.

## 6. Acceptance criteria
- [ ] Three passthrough files collapsed to one entry; imports updated; tests green (STAGE A).
- [ ] View prop surface is grouped into context objects/providers; the `L6609` spread is materially smaller (STAGE B).
- [ ] All error-path `toast*` calls go through `reportError`; success/info/warning toasts retained (STAGE C).
- [ ] A top-level shell error boundary wraps the runtime root (STAGE D).
- [ ] Heavy modules are lazy where not needed on open; `perf:budgets` passes and modal open time improves (STAGE E).
- [ ] `npm run typecheck`, `npx vitest run src/centerpanel/components/map`, `npm run test:e2e`, and `npm run perf:budgets` all pass at each stage.

## 7. Validation
```bash
npm run typecheck
npx vitest run src/centerpanel/components/map
npm run test:e2e
npm run perf:budgets
# (gis gate: typecheck + lint:errors + lint:no-tailwind-centerpanel + vitest map)
```

## 8. Tests to add
- No new test files are required by this prompt (MFP-20 supplies the guardrails), but each stage must re-run and keep green: the map vitest suite, `accessibility-audit.spec.ts` (`@a11y`), and `perf:budgets`. For STAGE C, add/extend a unit assertion that an induced error path calls `reportError` (spy) rather than `toastError`. For STAGE E, capture a `perf:budgets` before/after delta proving the eager chunk shrank.

## 9. Proof checklist
- `proofs/MFP-19/typecheck-clean.txt` — `npm run typecheck` output (per stage).
- `proofs/MFP-19/e2e-a11y.txt` — `npm run test:e2e:a11y` (or full `test:e2e`) output showing Map Explorer a11y suites green.
- `proofs/MFP-19/perf-budgets.txt` — `npm run perf:budgets` before/after for STAGE E showing the open-path chunk reduction.
- (Per-stage PR notes captured in `LEDGER.md`; one focused PR per stage.)
