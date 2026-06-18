# MFP-18 — Map dialog family: dead code, responsive grids, memoization

| Field | Value |
|---|---|
| Trigger | P18, map-dialog-family |
| Priority / Phase | P2 / Phase 2 |
| Depends on | none |
| Gate | gis |
| Severity | low |
| Proof required | typecheck-clean, deadcode-clean, screenshot |

## 1. Why this matters
Findings `MapStart-dead`, `MapExport-reflow`, `MapColumnar-reflow`, `MapCsv-memo`, and `MapWorkspace-param` are low-severity hygiene defects across the Map Explorer dialog family. Two dialogs use fixed two-column grids whose minimum track widths sum above 320px, so they cannot stack and overflow narrow viewports (WCAG 2.1 SC 1.4.10 Reflow). `MapStartDialog` carries an unused ref, an unused prop, and a dead `demoBadge` branch (dead-code/`deadcode` debt), and risks double `aria-modal` if it is ever wrapped. `MapCsvImportDialog` reprofiles its CSV session on every render. `MapWorkspaceShell.getPanelRailStyle` accepts a `height` it silently ignores. These are cheap to fix and reduce surface area before the release wave.

## 2. Current state (evidence)

`onAddDemoPack` declared in props but never destructured/used — `MapStartDialog.tsx:41`:
```ts
  onAddDemoPack: () => void;
```
…not in the destructure list (`MapStartDialog.tsx:170-175`), so it is dead.

Unused `dialogRef` (assigned to `ref` but never read) — `MapStartDialog.tsx:176`:
```ts
  const dialogRef = useRef<HTMLDivElement | null>(null);
```
The dialog already sets its own `role="dialog"` + `aria-modal="true"` — `MapStartDialog.tsx:351-354`:
```ts
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-start-dialog-title"
      aria-describedby="map-start-dialog-narrative"
```

Dead `demoBadge` branch — no tile in the file sets `demoBadge` (only `primary: true` at `L324`), yet it is rendered — `MapStartDialog.tsx:404`:
```ts
                  {tile.demoBadge ? <span className={styles.tileBadge}>{tile.demoBadge}</span> : null}
```

Non-stacking export grid (`360 + 320 = 680px` min) — `MapExportDialog.tsx:29-31`:
```ts
const dialogBodyStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(360px, 0.9fr) minmax(320px, 1.1fr)",
```

Non-stacking columnar grid — `MapColumnarImportDialog.tsx:51-54`:
```ts
const bodyStyle: React.CSSProperties = {
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
```

CSV profiling on every render (after an early return that precedes it) — `MapCsvImportDialog.tsx:129-134`:
```ts
  if (!open || !session) return null;

  const sourceProfile = profileCsvImportSession(session, {
    latitudeColumn,
    longitudeColumn,
  });
```

Ignored `height` param — `MapWorkspaceShell.tsx:527`:
```ts
function getPanelRailStyle(side: MapPanelRailSide, width: number | string | undefined, _height: number | string | undefined): React.CSSProperties {
```
…called with a real `height` at `MapWorkspaceShell.tsx:732`:
```ts
        ...getPanelRailStyle(side, width, height),
```

## 3. Target state
- `MapStartDialog`: `onAddDemoPack` prop and `dialogRef` removed (or actually wired); the `demoBadge` branch and the `demoBadge?` field removed unless a tile genuinely sets it; a guard so the dialog does not emit `aria-modal` when rendered inside a wrapper that already provides the dialog semantics.
- `MapExportDialog` / `MapColumnarImportDialog`: grids become responsive — collapse to a single column under a small-viewport breakpoint (or `grid-template-columns: 1fr` via media query / `auto-fit`) so they are usable at 320px.
- `MapCsvImportDialog`: `profileCsvImportSession` wrapped in `useMemo` keyed on `session`, `latitudeColumn`, `longitudeColumn` — placed **before** the early return to obey the rules of hooks.
- `MapWorkspaceShell.getPanelRailStyle`: either consume `height` (apply it to the rail style) or drop the parameter and the `height` argument at the call site.

## 4. Implementation steps
1. In `MapStartDialog.tsx`: remove `onAddDemoPack` from the props interface (`L41`) and confirm no caller passes it meaningfully (grep `onAddDemoPack` across `src/centerpanel/components/map`); remove the unused `dialogRef` (`L176`, `L349`) — keep `primaryActionRef` (`L177`, used by the focus effect at `L192`). Delete the `demoBadge` render branch (`L404`) and the `demoBadge?: string` field (`L72`).
2. Add a wrap-aware guard for `aria-modal`: when the dialog is rendered inside a wrapper that already sets `role="dialog"`/`aria-modal` (e.g. `MapDialogShell`), do not set `aria-modal="true"` here. Thread a prop (e.g. `wrapped?: boolean`) or detect via context, and apply `aria-modal={wrapped ? undefined : "true"}` (respect `exactOptionalPropertyTypes` — omit when undefined).
3. In `MapExportDialog.tsx` (`L29-31`): make the grid responsive. Since `centerpanel` forbids Tailwind, use a CSS Module class with a `@media (max-width: …)` that sets `grid-template-columns: 1fr`, or switch the inline grid to `repeat(auto-fit, minmax(min(100%, 320px), 1fr))`. Verify against the dialog's container width.
4. In `MapColumnarImportDialog.tsx` (`L51-54`): same treatment — stack the `1.15fr / 0.85fr` columns under the breakpoint.
5. In `MapCsvImportDialog.tsx`: move the `profileCsvImportSession` call into `useMemo` **above** the `if (!open || !session) return null` guard (`L129`) so the hook is unconditional; guard for `null` session inside the memo (`session ? profileCsvImportSession(session, {…}) : null`) and bail the render after. Import `useMemo` from React.
6. In `MapWorkspaceShell.tsx`: either apply `_height` inside `getPanelRailStyle` (e.g. when a numeric/`string` height is provided, set `height`/`maxHeight`) and rename the param to `height`, or remove the third parameter and the `height` argument at `L732`. Pick the option that matches the rail's intended sizing — verify whether the rail is meant to be height-constrained.

## 5. Constraints & edge cases
- **centerpanel = no Tailwind** — `npm run lint:no-tailwind-centerpanel` gates CI. Use CSS Modules or inline `React.CSSProperties` only.
- Rules of hooks: the CSV `useMemo` must run on every render path, so it goes before the early return.
- `npm run deadcode` (ts-prune) must show no new dead exports; removing `onAddDemoPack`/`demoBadge` should reduce, not add, dead surface.
- Keep all existing `role`/`aria-*` semantics on the dialogs intact except the deliberate double-`aria-modal` fix.
- `exactOptionalPropertyTypes`: omit `aria-modal`/optional props rather than passing `undefined` through a required slot.

## 6. Acceptance criteria
- [ ] `npm run deadcode` shows no new dead exports; `onAddDemoPack`, `dialogRef`, and the `demoBadge` branch/field are gone (or wired).
- [ ] `MapStartDialog` does not produce nested `aria-modal="true"` when wrapped.
- [ ] `MapExportDialog` and `MapColumnarImportDialog` stack to a single column and are usable (no horizontal overflow) at 320px.
- [ ] `MapCsvImportDialog` no longer calls `profileCsvImportSession` on every render (memoized; hook ordering correct).
- [ ] `getPanelRailStyle`'s `height` param is consumed or removed.
- [ ] `npm run typecheck`, `npm run lint:no-tailwind-centerpanel`, and `npx vitest run src/centerpanel/components/map` pass.

## 7. Validation
```bash
npm run typecheck
npm run lint:no-tailwind-centerpanel
npm run deadcode
npx vitest run src/centerpanel/components/map
# (gis gate)
```

## 8. Tests to add
- Extend the existing `src/centerpanel/components/map/__tests__/` suite: a render test for `MapCsvImportDialog` asserting `profileCsvImportSession` (spied) is called once across two renders with identical `session`/`lat`/`lng`, and recomputed when an input changes.
- A `MapStartDialog` render test asserting it exposes exactly one `aria-modal="true"` (and none when the `wrapped` prop is set), and that no `demoBadge` node renders for the default tiles.
- Reflow is primarily proved by screenshot; optionally assert the responsive grid class is applied under a narrow container in a jsdom test.

## 9. Proof checklist
- `proofs/MFP-18/typecheck-clean.txt` — `npm run typecheck` output.
- `proofs/MFP-18/deadcode-clean.txt` — `npm run deadcode` output showing no new dead exports.
- `proofs/MFP-18/screenshot/` — before/after PNGs of `MapExportDialog` and `MapColumnarImportDialog` at 320px (use the **screenshot-map-explorer** skill) showing single-column stacking.
