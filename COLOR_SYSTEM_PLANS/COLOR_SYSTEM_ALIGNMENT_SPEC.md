# Color System Alignment Spec

## Authority

This spec governs the active two-part color and chrome workstream. It does not override module ownership, scientific/GIS rules, evidence immutability, accessibility requirements, or branch/archive guidance.

Priority order when documents disagree:

1. User instruction and live repository safety.
2. `AGENTS.md`, `CLAUDE.md`, and module instruction files.
3. `COLOR_SYSTEM_AGENT_PROTOCOL.md`.
4. `COLOR_SYSTEM_UNIT_MATRIX.md`.
5. `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`.
6. This spec and the development plan.

## Visual Target

The target is a premium VS Code-inspired dark workbench:

- Charcoal surfaces with small value differences between modal, rail, panel, drawer, canvas overlay, and inspector areas.
- Thin separators instead of heavy cards or decorative boxes.
- Transparent or neutral default buttons instead of filled rounded plates.
- Blue/gray-blue interaction accent for active, selected, focus, editor-like affordances, and links.
- Muted text hierarchy and compact density.
- No amber/gold/yellow/orange UI chrome in Urban Analytics modal or Map Explorer.
- No decorative gradients, glow blobs, shimmer, animated strips, marketing hero treatment, or card-in-card compositions.

## Active Amber Rule

The earlier broad-plan allowance for amber attention does not apply inside the active scopes.

Urban Analytics modal and Map Explorer must not use amber as:

- Brand emphasis.
- Active/focus/selected state.
- Button fill, hover fill, border, or glow.
- Card border, card background, section rail, or badge tint.
- Header/title/link color.
- Default/demo/generated map or chart color.
- Warning/caveat fill if the token resolves amber.

Warning/caveat states must remain truthful through text, icon, aria label, disabled reason, and non-amber status styling.

## Product Rules

- The interface is a spatial intelligence workbench, not a theme showcase.
- Color should help scanning, state recognition, and trust.
- Every color state needs a text label, icon, aria name, or stable position cue.
- Status colors must not imply readiness without real readiness.
- Data visualization colors are not UI chrome colors.
- Focus states must be visible on all core surfaces.
- Layout polish is allowed only to remove unnecessary frames/fills, improve compact VS Code-like panel density, and prevent overlap. Do not redesign workflows.

## Module Rules

Urban Analytics:

- Part 1 owns only the complete modal experience and directly rendered modal content.
- Preserve evidence provenance, method validity, data-fitness semantics, and workflow readiness.
- Demo, residual gap, environment dependent, deferred, blocked, stale, and unknown must be visually distinct and text-backed.
- `score: null` in data fitness means unknown.
- Replace card-heavy method/evidence/dossier surfaces with inspector rows, panels, and separators where possible.

Map Explorer:

- Part 2 starts only after Part 1 is completed or skipped with reason.
- Keep map content primary.
- Keep QA, CRS, publication readiness, blocked, unknown, stale, and caveat states explicit.
- Do not let map symbology consume UI status colors accidentally.
- Remove amber from central map UI tokens before component-level migration.
- Remove amber from default/demo/generated map colors unless a documented analytical palette exception exists.

Shared Shell:

- Owns primitive and semantic tokens.
- Provides aliases for legacy consumers until migration is complete.
- Existing global amber tokens may remain for historical compatibility, but active scopes must not render amber UI chrome from them.

## Non-Goals

- No workflow redesign.
- No new component library.
- No Tailwind.
- No GIS calculation changes.
- No evidence mutation or readiness reinterpretation.
- No moving `DEVELOPMENT_PLANS/` during color prompts.
- No broad app-wide cleanup outside the active prompt scope.

## Completion Definition

The active color workstream is complete when all 20 prompts `A01`-`B10` are completed or skipped with reason, Urban Analytics modal and Map Explorer are amber-free in UI/default styling, retained literals are documented, QA evidence exists, and the final handoff marks no unresolved blocker.
