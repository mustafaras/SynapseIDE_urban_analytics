# Color System Alignment Spec

## Authority

This spec governs color-only work. It does not override module ownership, scientific/GIS rules, evidence immutability, accessibility requirements, or branch/archive guidance.

Priority order when documents disagree:

1. User instruction and live repository safety.
2. `AGENTS.md`, `CLAUDE.md`, and module instruction files.
3. `COLOR_SYSTEM_AGENT_PROTOCOL.md`.
4. `COLOR_SYSTEM_UNIT_MATRIX.md`.
5. `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`.
6. This spec and the development plan.

## Visual Target

The target is a VS Code-inspired dark workbench:

- Charcoal surfaces with small value differences between app, rail, panel, editor, terminal, and overlay.
- Thin separators instead of heavy cards or decorative boxes.
- Blue interactive accent for active, selected, focus, editor-like affordances, and links.
- Amber attention accent only for meaningful warning, provenance, premium emphasis, or review-needed states.
- Muted text hierarchy and compact density.
- No decorative gradients, glow blobs, or marketing-style hero treatment.

## Product Rules

- The interface is a spatial intelligence workbench, not a theme showcase.
- Color should help scanning, state recognition, and trust.
- Every color state needs a text label, icon, aria name, or stable position cue.
- Status colors must not imply readiness without real readiness.
- Data visualization colors are not UI chrome colors.
- Focus states must be visible on all core surfaces.

## Module Rules

Synapse IDE:

- Preserve VS Code-like editor density.
- Keep diagnostics and AI apply/review states truthful.
- Avoid broad amber fills in editor chrome.

Map Explorer:

- Keep map content primary.
- Keep QA, CRS, publication readiness, blocked, unknown, and stale states explicit.
- Do not let map symbology consume UI status colors accidentally.

Urban Analytics:

- Preserve evidence provenance and method validity semantics.
- Demo, residual gap, environment dependent, deferred, and unknown must be visually distinct.
- `score: null` in data fitness means unknown.

Shared Shell:

- Owns primitive and semantic tokens.
- Provides aliases for legacy consumers until migration is complete.
- Avoid one-note amber, purple, blue, beige, or slate dominance.

## Non-Goals

- No layout redesign.
- No new component library.
- No Tailwind.
- No GIS calculation changes.
- No evidence mutation or readiness reinterpretation.
- No moving `DEVELOPMENT_PLANS/` during color prompts.

## Completion Definition

The color system is complete when all 38 prompts are completed or skipped with reason, semantic tokens are documented, major units consume tokens, data palette boundaries are recorded, QA evidence exists, and the final handoff marks no unresolved blocker.
