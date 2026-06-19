# MFP-17 Proof Summary

## Scope
- UrbanAnalyticsModal close delay now respects `usePrefersReducedMotion`.
- WelcomeModal close delay now respects `usePrefersReducedMotion`; section jumps reuse the same reduced-motion signal.
- Urban Analytics ID/ref-only status-bar actions now emit typed Synapse Bus events.
- `SynapseBusEventMap` documents and types the new analytics/ui event payloads.
- `synapse:editor:insert` was removed; editor bulk content goes through `editorBridge.insertIntoActive`.
- `synapse:chat:insert` remains only as a documented content-transport channel, outside the typed ID/ref-only bus.
- File-wide a11y suppression was removed; the remaining dialog-root exception is narrowed to one justified line.
- `.midCol aria-hidden={false}` was removed.

## Validation
- `typecheck-clean.txt`: `npm run typecheck` passed.
- `lint.txt`: `npm run lint:errors` passed.
- `focused-test.txt`: MFP-17 reduced-motion + typed-event tests passed, 6/6.
- `unit-test.txt`: `npm run test:analytics` passed, 66 files / 1138 tests.

## Visual Proof
- `screenshot/after-welcome.png`: real Chrome reduced-motion WelcomeModal.
- `screenshot/after-urban.png`: real Chrome reduced-motion UrbanAnalyticsModal.
- `screenshot/after-metrics.json`: both dialogs present with `matchMedia('(prefers-reduced-motion: reduce)').matches === true`; animation duration is `1e-05s`.
