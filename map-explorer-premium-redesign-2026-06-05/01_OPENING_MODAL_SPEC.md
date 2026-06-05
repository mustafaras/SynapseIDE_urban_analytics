# 01 - Opening Modal Specification

## Problem

The current opening/readiness surface is visually heavy, scroll-heavy, and semantically confused. It behaves like a large panel placed over the map, has avoidable internal scrollbars, contains large low-value gaps, and appears to have influenced left-panel design. The opening modal must be a focused launch dialog, not a reusable left-panel body.

## Required Outcome

Create a premium Map Explorer launch dialog that:

- Opens only when a launch/readiness decision is needed.
- Is never embedded inside the left panel.
- Provides clear next actions without hiding the whole map experience behind a dense wall of text.
- Uses one scroll root at most.
- Fits common desktop and short-view heights without nested scrolling.
- Makes project/data/readiness state clear and truthful.
- Allows the analyst to dismiss it and continue directly in the map.

## Naming Recommendation

Prefer a dedicated component name:

- `MapStartDialog`
- `MapLaunchDialog`
- `MapReadinessDialog`

Avoid naming it `Cockpit` if the component is modal-only. Keep `MapWorkspaceCockpit` available only as a compact in-workspace summary if still needed.

## Modal Anatomy

### 1. Header Band

Content:

- Product label: `Map Explorer`
- Current project label or `No active project`
- Save state: `Draft`, `Saved HH:MM`, `Local-only`, or `Unsaved`
- Close button
- Optional compact status chip: data readiness, QA, or sync state

Rules:

- Height target: 56-64 px.
- Header must not wrap into two rows on normal desktop.
- No oversized title typography.
- Close button must be keyboard reachable and labelled.

### 2. Primary Decision Row

Content:

- Primary action: `Import Data`
- Secondary actions: `Open Existing Project`, `Add Demo Pack`, `Continue Empty Map`
- Disabled actions must show a reason.

Rules:

- Use a 2x2 grid on desktop.
- Collapse to one column on narrow widths.
- Each action includes icon, concise label, and one line of outcome text.
- Do not use decorative cards. These are command tiles with clear hit areas.

### 3. Readiness Summary Strip

Content:

- Layers: total / visible
- AOI: drawn / none
- QA: ready / caveats / blocked / unchecked
- CRS: project CRS / unknown / view-only
- Mode: project / demo / local-only

Rules:

- Strip must be compact and scannable.
- Unknown values must read as unknown, not ready.
- Demo/sample state must be explicit.

### 4. Context Preview

Content:

- Recent saved map state if available.
- Active extent label if available.
- Last import or source health issue if available.
- One recommended next action based on true state.

Rules:

- Maximum height: 120-160 px.
- If no context exists, show a truthful minimal empty state with one action.
- No repeated metric rows that duplicate the status bar.

### 5. Optional Advanced Disclosure

Content:

- Source support matrix summary.
- CRS caveat summary.
- Import limitations.

Rules:

- Closed by default.
- Uses disclosure, not a nested scrolling table.
- Link or button opens the right `Source Health` or `Problems` panel after the dialog closes.

## Layout Constraints

Desktop target:

- Width: `min(960px, calc(100vw - 96px))`
- Max height: `min(720px, calc(100vh - 96px))`
- Body grid: header, body, footer.
- Body scroll: only if content exceeds max height.

Short desktop:

- Width: `min(900px, calc(100vw - 48px))`
- Max height: `calc(100vh - 48px)`
- Primary action grid remains visible without scrolling.

Narrow/mobile:

- Width: `calc(100vw - 24px)`
- Max height: `calc(100vh - 24px)`
- One-column action list.
- Footer buttons stay visible.

## Visual Tone

- Premium GIS instrument, not a marketing splash.
- Calm dark surface with thin dividers.
- One restrained accent for primary action.
- No giant empty cards.
- No internal table with heavy scroll.
- Typography hierarchy must support scanning: label, value, action, detail.

## Behavior Rules

- The dialog must close on explicit close, `Esc`, successful primary action handoff where appropriate, or `Continue Empty Map`.
- The dialog must not reopen repeatedly in the same session after dismissal unless the user invokes it.
- First-run behavior must be deterministic and testable.
- If persisted state contains old `showCockpit` or similar values, migrate without trapping the user.
- The left panel must not import or render this dialog component.

## State And Events

Recommended state shape:

```ts
type MapStartDialogReason =
  | "first-open"
  | "no-project"
  | "no-layers"
  | "user-requested"
  | "restored-session";

interface MapStartDialogState {
  open: boolean;
  reason: MapStartDialogReason | null;
  dismissedAt: string | null;
}
```

Store rules:

- Keep this state separate from left-panel tab state.
- Persist only dismissal and user preference if needed.
- Do not persist derived readiness metrics. Recompute from store selectors.

## Content Hierarchy

Primary labels:

- `Import Data`
- `Open Project`
- `Add Demo Pack`
- `Continue Empty`

Status labels:

- `Layers`
- `AOI`
- `QA`
- `CRS`
- `Mode`
- `Saved`

Avoid:

- Long instructional paragraphs.
- Vague readiness claims.
- Repeating all source support tables in the modal.
- Showing all workflow control sections before the user has data.

## Implementation Targets

Likely files:

- Add `src/centerpanel/components/map/MapStartDialog.tsx`
- Add `src/centerpanel/components/map/MapStartDialog.module.css`
- Add or update tests under `src/centerpanel/components/map/__tests__/`
- Update `MapExplorerModalComposition.tsx` only to wire the dialog and remove modal-body reuse from left panel flows.
- Update navigation inventory if launch-related surfaces are currently listed as panel surfaces.

## Acceptance Criteria

- `IMG-01` no longer reproduces the over-large scroll-heavy readiness cockpit.
- Opening modal has at most one scroll container.
- Primary actions are visible at initial desktop and short desktop viewports.
- Modal is not reachable as a left-panel tab body.
- Modal can be dismissed and does not block map use.
- Project/data/QA/CRS states are truthful.
- Existing import, demo pack, save/load, and continue workflows still function.
- Keyboard focus starts in the modal, cycles inside it, and returns to the opener.

## Tests

Unit/component:

- Renders primary actions and readiness summary from empty state.
- Renders with existing layers/project state.
- Does not render source-support table as a nested scroll region.
- Close, escape, and primary action callbacks fire.
- Disabled action shows disabled reason.

E2E/visual:

- Desktop 1366x768: modal fits without body clipping.
- Short desktop 1280x620: primary actions visible without nested scroll.
- Narrow 390x844: one-column layout, no horizontal overflow.
- Left panel open: no launch modal content appears inside the left panel.

