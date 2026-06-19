# MFP-16 Proof Summary

Prompt: MFP-16 - SettingsModal: extract logic, fix anti-patterns, enable reflow
Gate: general

## Change

- Extracted provider key verification to `src/services/ai/verifyProviderKey.ts`.
- Added `src/hooks/useVirtualList.ts` so model-list `scrollTop`/`clientHeight` reads happen from the scroll listener, not during render.
- Updated `SettingsModal.tsx` to call `verifyProviderKey`, consume `useVirtualList`, remove the render-injected `<style>` block, remove `globalThis.__KEY_ROUTER_SUSPENDED__`, and drop ref values from effect dependency arrays.
- Reworked `Wrap` and key rows for 320px reflow: the settings body collapses to a single column and provider key rows stack instead of forcing a 180px + content grid.

## Proofs

- `typecheck-clean.txt`: `npm run typecheck` clean.
- `lint.txt`: `npm run lint:errors` clean.
- `unit-test.txt`: focused P16 unit tests passed, 24 tests.
- `full-test.txt`: full `npm run test` was run; it still has the known unrelated Map Explorer failures (`useMapExplorerStore` x2, `MapExplorerModal.dispatch` x1). P16 focused suites passed.
- `sweep.txt`: targeted anti-pattern sweep.
- `screenshot/before-320.png` and `screenshot/after-320.png`: real Chrome screenshots at 320px using a temporary Vite harness.
- `screenshot/before-default.png` and `screenshot/after-default.png`: default-width screenshots.
- `screenshot/before-metrics.json` and `screenshot/after-metrics.json`: computed layout metrics. After at 320px: `documentScrollWidth=320`, `bodyScrollWidth=320`, and settings grid is one column (`gridTemplateColumns: "174px"`). ARIA checks remained present: vertical tablist, option role, favorite button role.

## Sweep

- `__KEY_ROUTER_SUSPENDED__`: 0 matches.
- Local verifier functions/tester map: 0 matches.
- `listRef.current` / `providersScopeRef` in effect deps: 0 matches.
- Render `<style>` block: 0 matches.
- Old render-time virtualizer block: 0 matches.
- SettingsModal line count: 1244 -> 1230. The net reduction is modest because reflow styles moved into styled-components, but network verification and virtualization logic now live in tested units.
