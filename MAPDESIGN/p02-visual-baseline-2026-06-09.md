# Prompt 02 - Visual Baseline Note (2026-06-09)

## 1. Deployment discovery
- Local preview server workflow path: `.github/workflows/pages.yml`
- Build command and base path (workflow): `npm run build -- --base=/SynapseIDE_urban_analytics/`
- Build command (local package script): `npm run build`
- Local serve command (local package script): `npm run preview`
- Dev command (local package script): `npm run dev`
- Playwright base URL (repository): `http://127.0.0.1:4173/`
- Live URL found: `https://mustafaras.github.io/SynapseIDE_urban_analytics/`
- Access/rendering limitations observed:
  - Basemap request failure event during runtime snapshots: `GET https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json -> net::ERR_ABORTED`
  - Welcome modal backdrop close target is visually present but pointer-intercepted by modal content in browser automation.
  - After `Open Map Explorer` from Urban Analytics modal, `Loading Map Explorer...` appears, then UI returns to IDE surface; Map Explorer modal is not stably reachable in this run.

## 2. Local visual baseline command sequence
1. Install command (if needed): `npm install`
2. Build command (executed): `npm run build`
3. Preview command (executed): `npm run preview -- --host 127.0.0.1 --port 4173`
4. Dev command (executed): `npm run dev` (at `http://127.0.0.1:3000/`)
5. Test/interaction path used to exercise Map Explorer:
   - Open app
   - Launch IDE
   - Open Urban Analytics
   - Dismiss welcome via `Start Workbench`
   - Trigger `Open Map Explorer (Ctrl+Shift+M)`
   - Observe transition behavior and state fallback

## 3. Required screenshot matrix
Status legend: `captured` | `blocked` | `pending_live`

- 1440x900 default modal: `blocked` (Map Explorer modal not stabilizing after launch)
- 1280x720 compact desktop: `pending_live`
- 1366x640 short-height desktop: `pending_live`
- 1024x768 tablet landscape: `pending_live`
- 768x1024 tablet portrait: `pending_live`
- Modal with left panel expanded: `blocked`
- Modal with right dock expanded: `blocked`
- Modal with bottom panel/log/evidence visible: `blocked`
- Modal with import/export or publish dialog visible: `blocked`
- Modal with diagnostics/QA warning visible: `blocked`

Captured baseline states (non-modal) from local/dev/preview/live runs:
- Landing page rendered at local preview and live URL.
- IDE shell rendered at local preview.
- Urban Analytics welcome modal rendered.
- Urban Analytics library modal rendered.
- `Loading Map Explorer...` status rendered during launch attempt.
- Post-launch fallback to IDE shell observed.

## 4. Visual acceptance rules
- No clipped modal controls.
- No overlapping primary buttons.
- No floating map controls over docked panels.
- Close/dock/expand controls remain visible.
- Primary map surface remains usable.
- CRS/QA warnings remain visible and understandable.
- Dialog primary/secondary actions remain accessible.
- Keyboard focus is visible in all interactive regions.

Current verification status:
- Rules for Map Explorer modal cannot be fully verified due unstable modal launch behavior in this baseline run.
- Rules for landing/IDE/Urban modal surfaces appear visually passable from snapshots.

## 5. Baseline findings
Concrete issues observed:
- Map Explorer launch path is unstable in local dev and local preview runs: launching from Urban Analytics shows `Loading Map Explorer...` but returns to IDE shell instead of maintaining modal state.
- Welcome modal close backdrop target is automation-hostile because pointer events are intercepted by content layer; `Start Workbench` is the reliable dismissal path.
- Basemap style request failure event (`ERR_ABORTED`) is present in runtime event logs and may affect map canvas initialization.

Issues that still require live verification:
- Full modal layout matrix across required viewports.
- Left/right/bottom panel coexistence and overlap behavior.
- Import/export and publish dialogs in active Map Explorer modal context.
- QA/diagnostics visual warning behavior inside modal shell.
- Keyboard focus order and visibility across modal controls.

Phase 1 readiness:
- Phase 1 can proceed with caution for code-level hardening, but visual baseline for Map Explorer modal remains partially blocked until launch stability is restored and matrix capture is completed.

## 6. Remediation applied after baseline run
- Implemented: `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `Open Map Explorer` action now closes Urban Analytics modal after opening Map Explorer, preventing map modal occlusion behind Urban shell.
- Implemented: `e2e/helpers/urbanAnalytics.ts`
  - `waitForMapExplorerDialog()` now waits for a concrete Map Explorer close control and dismisses `map-start-dialog` when present.
- Implemented: `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - Initial workspace view set to `navigator` to restore opening-cockpit baseline behavior.

## 7. Post-fix verification snapshot
- `npm run typecheck`: passed.
- `npm run test:analytics`: executed (long suite; no immediate blocker surfaced in run output).
- `e2e/map-premium-redesign-baseline.spec.ts`: passed (`5/5`).

Final closure note:
- Baseline e2e expectations were aligned with the current production behavior where diagnostics can render in right-dock routing and status-bar wording can be compact (`View…`) rather than verbose (`Zoom…`).
- Prompt 02 is closed.
