# p09 Track B — Floating modal visual evidence

Status: done

## Captures
- `evidence/p09-float-default.png`
- `evidence/p09-float-moved.png`
- `evidence/p09-float-resized.png`

## Capture notes
- Opened Map Explorer and activated the QA route to render the right dock host.
- Captured:
  1. default floating-modal placement
  2. post-drag placement in a different corner region
  3. post-resize state after larger then smaller resize interaction
- Baseline reference for comparison remains `baseline/right-dock.png`.

## Capture verification
- `npx playwright test e2e/p09-right-dock-floating-capture.spec.ts --workers=1 --retries=0 --timeout=180000` ✅
- Temporary capture spec removed after screenshots were written.
