# 04 - Visual Interaction System

## Design North Star

Map Explorer should feel like a high-end GIS analysis instrument: calm, dense, legible, exact, and operational. It should not feel like a marketing surface, a scattered prototype, or a stack of unrelated dark panels.

## Visual Principles

- Map first. Panels support spatial work; they do not dominate it.
- Dense hierarchy. Use compact rows, thin separators, and clear section headers.
- Purposeful accent. Accent color marks active state, primary action, and scientific caveat priority.
- One scroll root per panel. Nested scrollbars are a design failure unless the inner area is a real data grid.
- No decorative card stacks. Use panels, rows, lists, grids, and inspectors.
- Every visible element earns space.
- Disabled and empty states name the missing prerequisite.

## Token Rules

Use:

- `src/centerpanel/components/map/mapTokens.ts`
- Existing GIS primitives in `src/centerpanel/components/map/ui/`
- CSS Modules for complex local layout

Avoid:

- Ad hoc hex colors.
- Hardcoded repeated spacing.
- Tailwind classes in `src/centerpanel/`.
- Negative letter spacing.
- Viewport-width font scaling.
- Card-in-card layouts.

## Typography

Recommended hierarchy:

| Role | Treatment |
| --- | --- |
| App/toolbar label | Compact semibold, not hero-sized. |
| Panel title | 13-15 px semibold. |
| Section title | 11-12 px uppercase or compact label style. |
| Body | 12-13 px. |
| Dense metadata | Mono 11-12 px. |
| Status bar | Mono 11 px with stable width constraints. |

Rules:

- Text inside buttons and status chips must fit.
- Long layer names, CRS labels, project names, and source names must truncate with tooltip.
- Do not use giant type inside panels.
- Letter spacing should be 0 unless using an existing token for compact labels.

## Spacing And Density

Recommended values:

- Toolbar height: 56-64 px desktop.
- Status bar height: 28-36 px.
- Panel header: 44-52 px.
- Panel row: 32-40 px.
- Compact row: 28-32 px.
- Panel padding: 12-16 px.
- Dense list padding: 8-12 px.
- Border radius: 4-8 px. Do not exceed 8 px unless existing token requires it.

## Scroll Discipline

Opening modal:

- One modal body scroll at most.
- Primary actions visible without scroll at normal desktop sizes.

Left panel:

- One scroll root per tab.
- Tables transform to row/property layouts when width is limited.

Right dock:

- Header and active tab controls stay visible.
- Body owns scrolling.

Status bar:

- No vertical scroll.
- Overflow moves to compact menu.

## Panel Surface Style

Panels should use:

- Thin outer border.
- Subtle header background.
- Hairline separators.
- Semantic chips with text labels.
- Icon + label commands.
- Stable resize handles.

Panels should avoid:

- Large blank bands.
- Multiple nested bordered boxes.
- Detached floating cards.
- Wide empty metric grids.
- Repeating the same header on every nested section.

## Interaction Patterns

Use:

- Icon buttons with tooltips for familiar commands.
- Segmented controls for modes.
- Tabs for panel views.
- Toggles for binary settings.
- Sliders/steppers/inputs for numeric values.
- Menus for option sets.
- Disclosure rows for advanced details.
- Confirmation popovers for destructive actions.

Avoid:

- Text-only rectangular buttons for common icon actions.
- Hidden interactions without hover/focus feedback.
- Opening a new persistent panel when an existing left/right surface is responsible.
- Actions that change map state without visible feedback.

## Accessibility

Requirements:

- Dialogs keep focus trapped and return focus to opener.
- Side panels have labelled regions.
- Icon buttons have accessible labels.
- Disabled controls expose a disabled reason.
- Keyboard roving works in activity rail and tab lists.
- Reduced motion is respected.
- Status state is not color-only.
- High contrast should remain readable.

## Motion

Allowed:

- Short panel slide/fade.
- Status flash for completed command.
- Progress fill for active background task.
- Focus-visible outline.

Rules:

- Use existing motion module where possible.
- Every animation has reduced-motion behavior.
- No layout-shifting animation that changes map control placement.

## Responsive Composition

Desktop:

- Activity rail left.
- Left panel optional.
- Map center.
- Right dock optional.
- Status bar bottom.

Short desktop:

- Keep side panels but reduce toolbar command density.
- Never create a persistent bottom workbench.

Tablet:

- One side drawer open at a time.
- Toolbar uses overflow.

Narrow:

- Full-height drawer for panel detail.
- Status bar shows critical segments and overflow.

## Visual QA Checklist

For each major prompt, capture or inspect:

- Opening modal over map.
- Data tab at min/default/max left-panel width.
- Layers tab at min/default/max left-panel width.
- Right `Attributes`.
- Right `Problems`.
- Right `Diagnostics`.
- Right `Draw`.
- Unified top command surface.
- Bottom status bar with normal, warning, busy, and long-label states.
- Short desktop viewport.
- Narrow viewport.

## Acceptance Criteria

- The UI reads as one coherent premium GIS application.
- No unnecessary nested scrollbars appear in the modal or panels.
- No persistent bottom panel remains.
- No persistent floating sketch/tool panel remains.
- No text overlaps, clips, or spills out of controls.
- Visual states remain truthful for demo/sample/unknown/blocked states.

