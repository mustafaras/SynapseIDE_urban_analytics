# Evidence — p04 Track B (Dock-visibility unification — behavior-parity capture)

**Run:** 2026-06-15. **Track B complete.**

p04 is a refactor: the success bar is **no visual change** — every contextual surface must open
exactly as before, now driven by the single right-dock route model. Captured the four contextual
surfaces in their open state after the unification and confirmed each renders correctly.

## Capture method
Temporary spec `e2e/p04-parity-capture.spec.ts` (deleted at closeout) opens the Map Explorer, seeds a
demo layer, then opens each surface from its toolbar command and screenshots the open state.

## Screenshots
| Surface | Route | Render path | Evidence |
|---|---|---|---|
| Drawing modal | `draw` | floating `MapDialogShell` (no rail, host hidden) | `evidence/p04-parity-draw.png` |
| Measure | `measure` | host-rendered dock panel | `evidence/p04-parity-measure.png` |
| Pin sidebar | `pins` | floating `MapPinSidebar` (reserves rail, host hidden) | `evidence/p04-parity-pins.png` |
| Scientific QA | `scientificQA`/`problems` | host-rendered dock panel | `evidence/p04-parity-scientificqa.png` |

## Observations (parity confirmed)
- **Draw** opens as the floating "Draw" modal (Select / Insert / Features / Snapping tabs, Add-as-layer
  + Fetch-data actions). Removing the racing draw-route→boolean effect means the modal now opens cleanly
  from a single route — the p00 "draw never opens via command" symptom no longer reproduces. (p05 formally
  owns/hardens the open path; this is a parity-positive side effect, not a regression.)
- **Pins** opens as the dedicated floating pin sidebar over the map — and crucially there is **no empty
  "No routed content" right-dock shell** behind it, confirming the `isHostRenderedRoutePanel` exclusion
  for externally-rendered routes works. The pin rail is still reserved (parity).
- **Measure** opens as the host-rendered "Measure" dock panel (Measurements / Distance), unchanged.
- **Scientific QA** opens as the host-rendered "QA" dock with issue cards, unchanged.
- Mutual exclusivity holds: each surface is the single active route; opening one closes the previous.

## Capture run
`npx playwright test e2e/p04-parity-capture.spec.ts --reporter=line --workers=1` → 4 / 4 capture tests
pass (draw / measure / pins / scientific-QA each open and are asserted visible).

## Done criteria
- No visual regression; all four contextual surfaces open with correct single-route exclusivity and the
  correct dedicated-vs-host render path. ✅
