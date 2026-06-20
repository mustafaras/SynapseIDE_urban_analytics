# Drawing modal behavior verification (2026-06-20)

The Map Explorer "Draw" modal is a `MapDialogShell` in **nonBlocking** mode
(`MapExplorerModalRuntimeCore.tsx`, `title="Draw"`, `memoryKey="map-draw-modal"`).
Verified its interaction contract in real Chromium (chromium-1194) using the real
`MapDialogShell` component with the production drawing-modal props:

| Property | Value | Meaning |
|---|---|---|
| `aria-modal` | `false` | non-blocking — the map stays interactive |
| accessible name | `Draw` (via `aria-labelledby` → visible `<h2>`) | MFP-14 naming working |
| `aria-label` | `null` | no duplicate name |
| overlay `pointer-events` | `none` | clicks pass through to the map |
| overlay `background` | `rgba(0,0,0,0)` | map is not dimmed |

Existing unit coverage (`map-drawing-tools.test.ts` → "nonBlocking mode keeps the
map interactive", 2 passed) asserts the same `aria-modal="false"` /
`pointer-events:none` / `background:transparent` contract.

`draw-modal.png` — the rendered Draw modal: title + subtitle, tool grid (Polygon
selected), header reset/maximize/close, footer actions (Fetch data / Add as layer
/ 3D buildings), over the click-through faux map canvas.

Note: full sketch-on-canvas interaction (MapDrawingManager drawing geometry on a
live maplibre map) requires a browser-capable env with WebGL; that path is exercised
by the broad Playwright functional suite (see MFP-20 validate-rc residuals), not by
this jsdom/harness proof.
