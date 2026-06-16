# p10 Track B — Single-click visual evidence

Status: done

## Captures
- `evidence/p10-single-click-open.png`
- `evidence/p10-narrow-fallback.png`

## Capture notes
- Created a temporary capture spec (`e2e/p10-right-dock-single-click-capture.spec.ts`) and removed it after capture.
- Wide viewport (`1600x900`): command palette single-click on `inspector` opens right dock with `data-presentation="floating-modal"`.
- Narrow viewport (`1280x760`): same command opens right dock with `data-presentation="side-drawer"`.

## Capture verification
- `npx playwright test e2e/p10-right-dock-single-click-capture.spec.ts --workers=1 --retries=0 --timeout=240000` ✅