# 06 - QA And Regression Gates

## Validation Philosophy

This redesign is successful only if visual quality improves while GIS behavior remains intact. Tests must cover both layout outcomes and functional workflows. A beautiful broken map is a failed result.

## Required Commands

After any Map Explorer UI change:

```bash
npm run typecheck
npm run lint:errors
```

After changes touching `src/features/urbanAnalytics/`:

```bash
npm run typecheck
npm run test:analytics
```

For this redesign closeout:

```bash
npm run typecheck
npm run lint:errors
npm run test:analytics
npm run test:e2e
npm run build
```

## Targeted Unit Test Areas

| Area | What to prove |
| --- | --- |
| Surface inventory and navigation | No normal workspace route targets `bottom-panel`; activity rail, command palette, toolbar, and status routes point to left panel, right dock, dialog, status bar, or transient canvas overlays. |
| Docking layout | No bottom workspace placement; right dock IDs supported; compact behavior does not reintroduce bottom panel. |
| Modal launch state | Modal opens/closes deterministically; no left-panel embedding; one scroll root. |
| Left panel contracts | Width clamping, responsive content strategy, no horizontal overflow. |
| Right dock migration | Problems, attributes, timeline, tasks, diagnostics render with old data sources. |
| Tool consolidation | Draw/measure/selection detail renders in right dock and existing callbacks still run. |
| Toolbar taxonomy | Command groups, disabled reasons, overflow, shortcuts, and active states. |
| Status bar | Segment values, truncation, callbacks, busy states, warning/error states. |
| Persistence migration | Old bottom-panel state maps to right dock state without trapping users; storage migration is required only if persisted bottom-panel keys are found. |

## E2E Journeys

### Journey 1 - Empty Map Launch

Steps:

1. Open Map Explorer with no project/layers.
2. Verify opening modal appears.
3. Verify primary actions are visible.
4. Continue empty map.
5. Verify map canvas is usable and left panel does not contain launch modal content.

Must pass:

- No nested modal scrollbars at desktop.
- Modal close returns focus.
- Status bar remains visible.

### Journey 2 - Data Import And Layer Review

Steps:

1. Open left `Data`.
2. Import a supported local/test layer or demo pack.
3. Open left `Layers`.
4. Toggle visibility and opacity.
5. Open layer metadata/QA detail.

Must pass:

- Left panel fits at min/default widths.
- Layer actions still work.
- Demo/sample labels remain explicit.

### Journey 3 - Status To Right Dock

Steps:

1. Click status `QA` or `Problems`.
2. Verify right dock opens the correct tab.
3. Click status `Attributes`.
4. Verify right dock switches to attributes.
5. Click status `Diagnostics`.
6. Verify right dock switches to diagnostics.

Must pass:

- No bottom panel appears.
- Map canvas remains visible.
- Focus moves logically.

### Journey 4 - Draw And Measure

Steps:

1. Activate draw polygon.
2. Draw or simulate a geometry.
3. Verify right `Draw` tab shows sketch/detail.
4. Activate measure.
5. Verify right `Measure` tab shows measurement detail.

Must pass:

- No persistent floating sketch card remains.
- Map labels/context menus may appear only as transient anchored UI.
- Counts update in status bar.

### Journey 5 - Toolbar And Search

Steps:

1. Use search from top command surface.
2. Open command overflow.
3. Trigger import/export/report-related commands where prerequisites allow.
4. Verify disabled commands show reasons.

Must pass:

- Toolbar does not clip in desktop or short desktop.
- Search overlay is not cut by panel containers.
- Existing command callbacks still execute.

### Journey 6 - Export And Report Handoff

Steps:

1. Add or enable a visible layer.
2. Open export/report commands.
3. Verify composer/report handoff still receives map snapshot, layer metadata, CRS, QA, and caveats.

Must pass:

- No lost provenance.
- No false readiness.
- Publication/export UI remains reachable.

## Visual Viewport Matrix

Run visual checks at least on:

| Viewport | Purpose |
| --- | --- |
| 1366x768 | Default laptop desktop. |
| 1440x900 | Comfortable desktop. |
| 1280x620 | Short desktop, catches vertical crowding. |
| 1024x768 | Tablet/compact desktop. |
| 390x844 | Narrow mobile-like drawer behavior. |

## Visual Assertions

For each viewport where applicable:

- Opening modal primary actions visible.
- No modal nested scrollbar unless content genuinely exceeds max height.
- Left Data tab has no horizontal overflow.
- Left Layers tab has no horizontal overflow.
- Right Problems tab opens.
- Right Attributes tab opens.
- Right Diagnostics tab opens.
- Draw/Measure detail is docked.
- Top command surface fits or overflows gracefully.
- Status bar remains visible and non-overlapping.
- No bottom panel appears.

## Accessibility Gates

Check:

- Dialog role/name/description.
- Focus trap and return focus.
- Activity rail keyboard movement.
- Toolbar keyboard traversal.
- Status segment buttons have labels.
- Right dock tabs are labelled.
- Disabled reason is exposed through tooltip/aria.
- Reduced motion does not animate progress indefinitely.
- Semantic status has text, not color alone.

## Performance And Layout Gates

Check:

- Map canvas remains nonblank after panel open/close.
- Map resizes after left/right panel changes.
- No expensive spatial loops are added to render.
- No geometry buffers are passed through UI events.
- No layout thrash from constantly changing status text widths.
- No new lazy chunk growth that is disproportionate to UI changes.

## Regression Checklist

Before closeout, manually verify:

- Open/close Map Explorer.
- Switch base map.
- Search a location.
- Add demo pack.
- Import one file path supported by existing test fixtures.
- Toggle layer visibility.
- Open layer metadata.
- Draw AOI.
- Measure distance or area.
- Open QA/problems.
- Open attributes.
- Open timeline/review.
- Open diagnostics.
- Export image or open export dialog.
- Add to report or open report handoff.
- Save/load project where local persistence is available.

## Completion Evidence Template

Use this in `07_ANTI_AMNESIA_LEDGER.md` after each prompt:

```md
### Prompt XX Completion

- Status:
- Files changed:
- Behavior preserved:
- Visual states checked:
- Commands run:
- Screenshots:
- Known risks:
- Next prompt:
```
