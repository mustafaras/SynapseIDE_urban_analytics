# MFP-16 — SettingsModal: extract logic, fix anti-patterns, enable reflow

| Field | Value |
|---|---|
| Trigger | P16, settings-extract |
| Priority / Phase | P3 / Phase 3 |
| Depends on | MFP-06 |
| Gate | general |
| Severity | medium |
| Proof required | typecheck-clean, unit-test, screenshot |

## 1. Why this matters
Findings `Settings-monolith` and `M9` flag `SettingsModal.tsx` as the largest, most fragile dialog in the pack: ~19 `useState` calls, network key verification embedded in the component, a hand-rolled virtualizer that reads `scrollTop` **during render** (a React anti-pattern that can desync the slice from the DOM), and a `globalThis.__KEY_ROUTER_SUSPENDED__` global mutated from many handlers. The fixed `height: 560px` plus the base Modal `min-width: 640px` floor (`M9`) means the dialog cannot reflow on small viewports, violating WCAG 2.1 SC 1.4.10 (Reflow). Splitting the network and virtualization concerns into tested units shrinks the component, removes the render-time side effect, and lets the modal stack vertically at 320px. The strong tab/radio/listbox ARIA already present must be preserved exactly.

## 2. Current state (evidence)

Render-injected `<style>` block and fixed-size wrapper — `SettingsModal.tsx:15-21`:
```ts
const Wrap = styled.div`
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 16px;
  height: 560px;
  min-height: 560px;
  max-height: 560px;
```

Brittle global suspension flag, mutated from input handlers — `SettingsModal.tsx:188-191`:
```ts
onMouseDownCapture={() => { try { (globalThis as any).__KEY_ROUTER_SUSPENDED__ = true; } catch {} }}
onPointerDownCapture={() => { try { (globalThis as any).__KEY_ROUTER_SUSPENDED__ = true; } catch {} }}
onFocus={() => { try { (globalThis as any).__KEY_ROUTER_SUSPENDED__ = true; } catch {} }}
onBlur={() => { try { delete (globalThis as any).__KEY_ROUTER_SUSPENDED__; } catch {} }}
```
…and again at the scope level — `SettingsModal.tsx:563-564`:
```ts
const onFocusIn = () => { try { (globalThis as any).__KEY_ROUTER_SUSPENDED__ = true; } catch {} };
const onFocusOut = () => { try { delete (globalThis as any).__KEY_ROUTER_SUSPENDED__; } catch {} };
```

Ref-in-deps effect (the ref object identity is stable, so `listRef.current` in deps does not retrigger) — `SettingsModal.tsx:443-448`:
```ts
useEffect(() => {
  const el = listRef.current; if (!el) return;
  const onScroll = () => setScrollTick(t => (t + 1) % 1000);
  el.addEventListener('scroll', onScroll);
  return () => { el.removeEventListener('scroll', onScroll); };
}, [listRef.current]);
```
A second `providersScopeRef`-in-deps effect ends at `SettingsModal.tsx:573`.

Embedded network key verification — `SettingsModal.tsx:613-631`:
```ts
async function testOpenAI(k: string): Promise<Status> {
  try {
    const r = await fetch('/api/openai/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: k }) });
    if (r.status === 200) return 'Verified'; if (r.status === 401 || r.status === 403) return 'Invalid'; if (r.status === 429) return 'Rate-limited'; return 'Untested';
  } catch { return 'Untested'; }
}
async function testAnthropic(k: string): Promise<Status> { /* https://api.anthropic.com/v1/models */ }
async function testGemini(k: string): Promise<Status> { /* generativelanguage.googleapis.com */ }
const testers: Record<NewProv, (k: string) => Promise<Status>> = { openai: testOpenAI, anthropic: testAnthropic, gemini: testGemini };
```

Render-injected inline `<style>` opens at `SettingsModal.tsx:690` (`<style>{`…`}</style>`) and closes at `728`, inside the `Modal` body.

Hand-rolled virtualization reading `scrollTop` during render — `SettingsModal.tsx:829-843`:
```ts
const container = listRef.current;
let scrollTop = 0; let viewH = 260;
if (container) { scrollTop = container.scrollTop; viewH = container.clientHeight; }
const start = Math.max(0, Math.floor(scrollTop / ITEM_H) - 4);
const end = Math.min(total, Math.ceil((scrollTop + viewH)/ITEM_H) + 4);
const slice = filtered.slice(start, end);
```
The slice is computed from a DOM read inside the JSX IIFE (opens `829`, closes `894`).

## 3. Target state
- **Network verification** moves to `src/services/ai/verifyProviderKey.ts` (pure async functions keyed by provider) with its own unit tests; `SettingsModal` imports and calls it. The component keeps only UI state (`status` map, `onTest`/`onTestAll`).
- **Virtualization** moves to a tested `useVirtualList` hook (or a vetted in-budget lib) that owns the `scrollTop` subscription and returns `{ start, end, topSpacer, bottomSpacer }` from effect/state — no `scrollTop` read during render.
- **`globalThis.__KEY_ROUTER_SUSPENDED__`** is replaced by a scoped keydown handler on the providers scope (or a ref-held boolean read by the key router), removing the cross-cutting global.
- **`Wrap`** drops the hard `height/min-height/max-height: 560px` triple to a `max-height`-with-flex layout; the base Modal `min-width: 640px` floor is parametrized via MFP-06 so the dialog reflows to a single column under a breakpoint.

## 4. Implementation steps
1. Create `src/services/ai/verifyProviderKey.ts` exporting `verifyProviderKey(provider: NewProv, key: string): Promise<Status>` (moving `testOpenAI`/`testAnthropic`/`testGemini` verbatim, behind one dispatch). Export the `Status` type from a shared location or re-use the existing one. Add `src/services/ai/__tests__/verifyProviderKey.test.ts` mocking `fetch` for 200/401/429/network-error paths per provider.
2. In `SettingsModal`, delete the three local `test*` functions (`L613-631`) and the `testers` record; replace `onTest`'s `testers[p](key)` call with `verifyProviderKey(p, key)`.
3. Add `src/hooks/useVirtualList.ts` (or adopt a vetted lib within `perf:budgets`) that takes `{ itemCount, itemHeight, overscan, containerRef }` and returns `{ start, end, topSpacer, bottomSpacer }`, computed in a scroll-listener effect + state (never during render). Add `src/hooks/__tests__/useVirtualList.test.ts`.
4. Replace the IIFE at `L829-894`: feed `filtered.length` into `useVirtualList`, render the slice from its `start`/`end`, drop the `listRef.current` DOM read. Remove the now-redundant `setScrollTick` effect (`L442-448`).
5. Remove every `globalThis.__KEY_ROUTER_SUSPENDED__` mutation (`L188-191`, `L200-201`, `L563-564`). Replace with a scoped `keydown`/`focusin` handler on `providersScopeRef` (keep the existing `L576-598` capture-phase stop logic; it already excludes `Escape`) or a ref boolean the key router consults.
6. Fix the two ref-in-deps effects: remove `listRef.current` (`L448`) and `providersScopeRef` (`L573`) from dependency arrays; rebind on `open`/`tab` changes only.
7. In `Wrap` (`L15-21`), drop the fixed `height`/`min-height`/`max-height: 560px`; use `max-height: min(560px, …)` with the grid collapsing to one column under a small-viewport media query, and coordinate the `min-width` lift with MFP-06's parametrized `size`.

## 5. Constraints & edge cases
- Preserve the strong tab/radio/listbox ARIA exactly (`role="tablist"`/`aria-orientation="vertical"` at `L730`; `role="option"`/`aria-selected` at `L857-858`; the favorite control's `role="button"`/`tabIndex={0}` at `L876-884`).
- No `localStorage` — Settings persistence stays in its Zustand stores (`useAiSettingsStore`, `useSettingsStore`, `useSpatialIndexStore`).
- No new `any`; the extracted service must be typed (use the existing `Status`/`NewProv` types, narrow `fetch` results).
- Errors in verification are already swallowed to `'Untested'`; keep that behaviour (do not route to `reportError` — verification failure is a status, not a user-facing error).
- Respect `exactOptionalPropertyTypes` when threading the new Modal size/min-width props.

## 6. Acceptance criteria
- [ ] `verifyProviderKey` lives in `src/services/ai/` with passing unit tests (200/401/429/network per provider).
- [ ] `useVirtualList` (or vetted lib) has passing unit tests; no `scrollTop`/`clientHeight` read occurs during render.
- [ ] `globalThis.__KEY_ROUTER_SUSPENDED__` no longer appears in `SettingsModal.tsx`.
- [ ] Ref values removed from the two effect dependency arrays.
- [ ] Modal usable (reflowed to one column, no horizontal scroll) at 320px width.
- [ ] Tab/radio/listbox ARIA unchanged; component line count materially reduced.
- [ ] `npm run typecheck` and `npm run lint:errors` clean.

## 7. Validation
```bash
npm run typecheck
npm run lint:errors
npm run test
# (general gate: typecheck + lint:errors)
```

## 8. Tests to add
- `src/services/ai/__tests__/verifyProviderKey.test.ts`: per provider, mock `fetch` to return 200 → `'Verified'`, 401/403 → `'Invalid'`, 429 → `'Rate-limited'`, and a thrown error → `'Untested'`. Assert the OpenAI path posts to `/api/openai/verify` and the Anthropic path sends `x-api-key` + `anthropic-version` headers.
- `src/hooks/__tests__/useVirtualList.test.ts` (jsdom): given `itemCount=1000`, `itemHeight=34`, simulate a scroll event on the container and assert `start`/`end`/`topSpacer`/`bottomSpacer` update only after the event (not on initial render), and that the window is clamped to `[0, itemCount]`.
- (Optional, supports MFP-20) a focused render test that the providers scope no longer sets the global flag.

## 9. Proof checklist
- `proofs/MFP-16/typecheck-clean.txt` — `npm run typecheck` output.
- `proofs/MFP-16/unit-test.txt` — `verifyProviderKey` + `useVirtualList` test run output.
- `proofs/MFP-16/screenshot/` — before/after PNGs of the Settings modal at 320px and at default width showing single-column reflow and unchanged ARIA structure.
