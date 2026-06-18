# MFP-17 — Urban Analytics + Welcome: reduced-motion, typed events, cleanups

| Field | Value |
|---|---|
| Trigger | P17, urban-welcome, reduced-motion |
| Priority / Phase | P2 / Phase 2 |
| Depends on | none |
| Gate | analytics |
| Severity | medium |
| Proof required | typecheck-clean, unit-test |

## 1. Why this matters
Findings `UA3`, `UA4`, `UA5`, and `Welcome-rm` cover four correctness/convention defects in the two largest Urban Analytics dialogs. The close animations use unconditional `setTimeout` delays (300ms / 400ms) that ignore `prefers-reduced-motion`, so motion-sensitive users are forced to wait through (and perceive) the close transition — a WCAG 2.1 SC 2.3.3 (Animation from Interactions) concern. `UrbanAnalyticsModal` fires **untyped** `window.dispatchEvent(new CustomEvent('synapse:…'))` for cross-module actions instead of the typed `synapseBus`, bypassing the repo's `SynapseBusEventMap` contract (CLAUDE.md: "Do not add new events without updating `SynapseBusEventMap`"). A file-wide `jsx-a11y/no-noninteractive-element-interactions` suppression at the top of the file hides real handler-placement issues, and a leftover no-op `aria-hidden={false}` on `.midCol` is dead attribute noise.

## 2. Current state (evidence)

File-wide a11y-lint suppression — `UrbanAnalyticsModal.tsx:1`:
```ts
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
```

Close delay ignores reduced motion — `UrbanAnalyticsModal.tsx:519-526`:
```ts
const setOpen = useCallback((v: boolean) => {
 if (!v) {
 setIsClosing(true);
 setTimeout(() => {
 setIsClosing(false);
 if (open === undefined) store?.close?.();
 onClose?.();
 }, 300);
```

Untyped cross-module `CustomEvent` dispatches — `UrbanAnalyticsModal.tsx:687-756` (representative):
```ts
window.dispatchEvent(
 new CustomEvent('synapse:chat:insert', {
 detail: { plainText: plain, html: htmlWrapped, meta: { cardId: selected?.id, title: selected?.title } },
 }),
);
// also: 'synapse:editor:insert' (L698-702), 'synapse:urban:open-recent' (L734),
// 'synapse:urban:refresh-recs' (L739), 'synapse:open-shortcuts' (L744),
// 'synapse:theme:toggle' (L749), 'synapse:urban:compare' (L754)
```

Leftover no-op attribute — `UrbanAnalyticsModal.tsx:966`:
```ts
<div className="midCol" aria-hidden={false} style={{ pointerEvents: 'auto', overflow: 'hidden', minHeight: 0 }}>
```

WelcomeModal close delay ignores reduced motion — `WelcomeModal.tsx:465-471`:
```ts
const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  }, [onClose]);
```

A `usePrefersReducedMotion()` hook already exists and is reusable — `src/hooks/usePrefersReducedMotion.ts:4`:
```ts
export function usePrefersReducedMotion(): boolean {
```
WelcomeModal already reads `prefers-reduced-motion` inline elsewhere (`WelcomeModal.tsx:94-95`, `509-510`), confirming the media query is the right gate.

## 3. Target state
- Both close-delay `setTimeout`s are gated on `prefers-reduced-motion`: when reduced, skip the delay and run the close callbacks synchronously (or via `setTimeout(..., 0)`), so motion-sensitive users get an instant close.
- The seven `CustomEvent` dispatches in `UrbanAnalyticsModal` are replaced by typed `synapseBus.emit(...)`. Events not yet in `SynapseBusEventMap` are added there (IDs/refs only — no `htmlWrapped`/`plainText` bulk payloads on the bus; those route through the existing editor bridge, not the bus).
- The file-wide `jsx-a11y/no-noninteractive-element-interactions` disable is removed by correcting the offending non-interactive element's handlers, or narrowed to the single line with a justification comment.
- The no-op `aria-hidden={false}` on `.midCol` is deleted.

## 4. Implementation steps
1. Import `usePrefersReducedMotion` into both files. In `UrbanAnalyticsModal.setOpen` (`L519-526`), read `const reduced = usePrefersReducedMotion()` at hook scope and replace `setTimeout(fn, 300)` with `setTimeout(fn, reduced ? 0 : 300)` (or run `fn()` directly when reduced). Do the same in `WelcomeModal.handleClose` (`L465-471`) for the 400ms delay. Keep `setIsClosing(true)` so the transition class still applies for non-reduced users.
2. Audit the seven dispatches (`L687-756`). For ID/ref-only signals (`synapse:urban:open-recent`, `synapse:urban:refresh-recs`, `synapse:open-shortcuts`, `synapse:theme:toggle`, `synapse:urban:compare`), add typed events to `SynapseBusEventMap` in `src/types/synapse-bus.ts` (each with a `source: SynapseModule` + `requestedAt: string` base, plus only scalar IDs such as `cardId`) and call `synapseBus.emit('<event>', { source: 'urban-analytics', requestedAt: new Date().toISOString(), … })`.
3. For `synapse:chat:insert` (`L687-691`) and `synapse:editor:insert` (`L698-702`), which carry `htmlWrapped`/`plainText` bulk content: do **not** put that payload on the bus (violates the IDs/refs-only rule). Route the insert through the existing editor/chat bridge (`src/services/editor/bridge.ts` / `bridgeAdapter.ts`, which already handle `chat:insert`/`editor:insert`), or keep a local `CustomEvent` with a clear comment that this is a content-transport channel, not a bus event — confirm the intended path against `src/services/editor/bridgeAdapter.ts` before changing the consumer.
4. Update the contract docs block in `synapse-bus.ts` (ownership table) for any added Urban Analytics events; add them to the `SynapseBusEventMap` interface and they automatically flow into `SynapseBusEventType`.
5. Remove `aria-hidden={false}` from `.midCol` (`L966`); leave the rest of the `div` unchanged.
6. Inspect the dialog-root interaction handlers the file-wide suppression was covering; move click/key handlers onto interactive elements (or add the correct role) so `jsx-a11y/no-noninteractive-element-interactions` passes, then delete the `/* eslint-disable … */` at `L1`. If a genuine non-interactive backdrop handler must remain, narrow to an inline `// eslint-disable-next-line` with a one-line justification.

## 5. Constraints & edge cases
- **analytics gate** — after any edit under `src/features/urbanAnalytics/`, run `npm run typecheck && npm run test:analytics`.
- `synapseBus` payloads carry IDs/refs only: no GeoJSON, no `htmlWrapped`, no full card objects. The chat/editor insert content must travel via the bridge, not the bus.
- Adding to `SynapseBusEventMap` requires the matching `source`/`requestedAt` base (`SynapseBusBase`) — keep the pattern consistent with existing payloads.
- `exactOptionalPropertyTypes`: optional payload fields (e.g. `cardId?`) must be omitted, not set to `undefined`, when absent.
- Do not change the visible close transition for non-reduced-motion users (the 300/400ms timing stays).

## 6. Acceptance criteria
- [ ] Reduced-motion users get an instant close in both modals (no perceptible delay), verified by a unit test mocking `matchMedia`.
- [ ] No untyped `window.dispatchEvent(new CustomEvent('synapse:…'))` remains in `UrbanAnalyticsModal` for ID/ref-only signals; those use `synapseBus.emit`.
- [ ] Any new event appears in `SynapseBusEventMap` with a documented owner and ID/ref-only payload.
- [ ] Bulk content inserts route through the bridge, not the bus.
- [ ] The file-wide `jsx-a11y/no-noninteractive-element-interactions` disable is removed or narrowed with justification.
- [ ] `aria-hidden={false}` on `.midCol` is gone.
- [ ] `npm run typecheck` and `npm run test:analytics` pass.

## 7. Validation
```bash
npm run typecheck
npm run test:analytics
# (analytics gate)
```

## 8. Tests to add
- A reduced-motion close test for both modals: mock `window.matchMedia('(prefers-reduced-motion: reduce)')` → `matches: true`, trigger close, assert `onClose` is called without advancing fake timers by 300/400ms (i.e. immediately). Repeat with `matches: false` and assert the delay still applies (advance timers).
- A typed-event test: spy on `synapseBus.emit` and assert each migrated action emits the correct event key with `source: 'urban-analytics'` and an ID-only payload (no `html`/`plainText`).
- A lint-level assertion is covered by `test:analytics` + the lint gate; no extra unit needed for the suppression removal beyond `lint:errors` staying clean.

## 9. Proof checklist
- `proofs/MFP-17/typecheck-clean.txt` — `npm run typecheck` output.
- `proofs/MFP-17/unit-test.txt` — `npm run test:analytics` output including the new reduced-motion + typed-event tests.
