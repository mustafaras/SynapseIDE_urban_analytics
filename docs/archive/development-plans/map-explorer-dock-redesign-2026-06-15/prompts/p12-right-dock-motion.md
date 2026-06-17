# p12 — Right Dock Premium Motion & Chrome

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p12 · **Depends on:** p11 · **Tracks:** A (motion behavior + reduced-motion) + B (animated shots)

## Mission
Add the premium, animated feel to the right-dock floating modal — smooth open/close, drag/resize feedback, tab transitions — strictly honoring reduced-motion and keeping focus/keyboard behavior correct.

## Why (problem #3)
The owner asked for a "premium, animated" modal. p09/p10/p11 made it floating, single-click, single-column; p12 makes motion feel intentional and calm, not flashy.

## Context primer (self-contained)
- Motion classes live in `design/motion.module.css` (existing). There is a motion-system test: `__tests__/mapMotionSystem.test.ts`. Reduced-motion is a first-class requirement across the module (`reducedMotion` flows through Core).
- The host renders inside `MapDockPanelFrame`; tab rail + body are in `MapRightDockHost.tsx` / `.module.css`.
- Keep it restrained: short durations, ease-out, subtle translate/opacity. No bounce, no large scale.

## Files
- `edit` — `src/centerpanel/components/map/MapRightDockHost.module.css` — enter/exit, tab transition, resize/drag affordance states.
- `edit` — `src/centerpanel/components/map/design/motion.module.css` — add/extend shared classes if needed (reused elsewhere — additive, don't break existing).
- `reference` — `src/centerpanel/components/map/shell/MapDockPanelFrame.tsx` — apply entrance class at the frame root.
- `reference` — `src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts` — keep green; extend if it governs class contracts.
- `edit` — `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeView.tsx` / `Core` — pass `reducedMotion` to gate animation.

## Do NOT touch / reuse
- Reuse the shared motion module; additive changes only (other surfaces depend on it).
- Do not animate in a way that breaks focus trap or drag (p09) — animation must not intercept pointer/keyboard.
- Respect reduced-motion: when set, render final state immediately.

## Track A — Functional
### Steps
1. Gate all new animations on `reducedMotion` (no transition when reduced). Verify via the motion-system test or add a case.
2. Ensure entrance/exit do not delay interactivity: the modal is focusable/draggable immediately; animation is purely visual.
3. Ensure tab switches animate content without losing scroll/focus position semantics.
4. Confirm no layout thrash on drag/resize (transform-based, not width/height transitions during active drag).

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx`
- `npm run typecheck`
- `npm run lint:no-tailwind-centerpanel`
- Save summary → `evidence/p12-trackA.md`.

### Done criteria
- Motion is gated by reduced-motion; interactivity is immediate; no focus/drag regressions. Tests green; lint + typecheck clean.

## Track B — Visual
### Steps
1. Capture open and close mid-animation (or a short sequence) → `evidence/p12-open.png` / `evidence/p12-close.png`.
2. Capture the reduced-motion variant (static) → `evidence/p12-reduced-motion.png`.

### Verify
- `screenshot-map-explorer` produced the shots (use its reduced-motion capability).

### Done criteria
- Visual proves restrained premium motion + correct reduced-motion fallback.

## Anti-amnesia exit checklist
- LEDGER: p12 A+B → `done`, phase closed (right-dock track p09→p12 complete).
- STATE: `phases[p12]` trackA/trackB `done` + evidence.
- Next action → `prompts/p13-left-dock-single-column.md`.

## Guardrails
- Reduced-motion mandatory. Reuse shared motion module (additive). No Tailwind.
- Animation must not break focus trap or drag.
- Both tracks verified before closing.
