# Charcoal + Amber Ops — Sequential Folder-Specific Prompt Pack

## How to Use
- Execute prompts **strictly in order**.
- Complete each prompt and validate before moving to the next.
- Keep global identity fixed: `#000000` real black base.
- No blue accents, no blue gradients, no blue status colors.

## Locked Palette
- Base Black: `#000000`
- Surface 1: `#121212`
- Surface 2: `#1A1A1A`
- Primary Accent: `#F59E0B`
- Secondary Accent: `#D97706`
- Text Primary: `#FAFAF9`
- Text Muted: `#A8A29E`
- Border Default: `#2A2A2A`
- Focus Ring: `#FBBF24`

## Global Rules (Apply to All Prompts)
1. Use semantic tokens first; avoid arbitrary hardcoded color values.
2. Preserve behavior and component APIs; perform visual/theming migration only.
3. WCAG AA minimum for all text/background and actionable controls.
4. Keep spacing scale and layout rhythm stable.
5. Do not introduce new design language per folder; remain system-consistent.

---

## Prompt 01 — `src/theme`
You are updating `src/theme` as the primary design-token source.

Tasks:
- Define semantic token map for: root, surfaces, elevated layers, text, borders, accents, states, charts.
- Ensure all exports are reusable by CSS modules, TS style maps, and component props.
- Add hover/active/disabled/focus variants for primary and neutral actions.
- Remove any blue references in theme constants.

Deliverables:
- Updated token architecture.
- Migration map from old tokens to Charcoal+Amber tokens.
- Brief compatibility note for downstream folders.

Acceptance:
- No blue token remains.
- Theme API remains stable or includes a clear backward-compatible adapter.

---

## Prompt 02 — `src/styles`
You are updating global style infrastructure in `src/styles`.

Tasks:
- Replace global color variables with semantic theme tokens.
- Normalize page background layers: root black + charcoal surfaces.
- Standardize borders/dividers and remove noisy glow artifacts.
- Ensure typography contrast is optimized for dark analytics UI.

Deliverables:
- Refined global CSS foundations.
- Visual consistency across root/body/panel layers.

Acceptance:
- Base black remains globally dominant.
- No legacy blue remains in global style files.

---

## Prompt 03 — `src/ui`
You are updating shared UI primitives and utility UI systems in `src/ui`.

Tasks:
- Theme `a11y`, `theme`, `toast`, `virtual`, and `keys` related visual surfaces.
- Make info/warning messaging amber-based (no blue info badges).
- Ensure focus states are visible and consistent (`focus ring` token).
- Align primitive wrappers to new semantic colors.

Deliverables:
- Updated primitives with consistent states.
- Accessibility-focused visual pass summary.

Acceptance:
- All primitive states match palette and remain legible.

---

## Prompt 04 — `src/constants`
You are updating color-related constants in `src/constants`.

Tasks:
- Replace color literals and old aliases with semantic references.
- Ensure constants support analytics-focused hierarchy (neutral first, amber for signal).

Deliverables:
- Clean constant layer free of stale palette values.

Acceptance:
- No raw blue literals remain.

---

## Prompt 05 — `src/config`
You are updating theme/config wiring in `src/config`.

Tasks:
- Verify theme flags/config selectors point to new token keys.
- Remove stale fallback palette options if they include blue-first defaults.

Deliverables:
- Reliable runtime configuration for Charcoal+Amber.

Acceptance:
- App can initialize with correct palette without patching consumers.

---

## Prompt 06 — `src/app`
You are updating shell-level composition in `src/app`.

Tasks:
- Apply theme to app root containers, boundaries, and frame-level UI.
- Ensure modal overlays and shell chrome align with dark analytics tone.

Deliverables:
- Cohesive shell-level appearance.

Acceptance:
- Top-level app feels unified before component-level pass.

---

## Prompt 07 — `src/components`
You are updating shared component library in `src/components`.

Sub-order (mandatory):
1. `atoms`
2. `molecules`
3. `utilities`
4. `settings`
5. `StatusBar`
6. `editor`
7. `file-explorer`
8. `ide`
9. `terminal`
10. `timer`
11. `ai`
12. `keys`
13. `templates`

Tasks:
- Convert each subfolder to semantic token usage.
- Buttons: amber primary, neutral secondary, subtle tertiary.
- Inputs/selects: dark surface, high-contrast text, clear focus ring.
- Ensure table/list/editor contrast remains comfortable for long sessions.

Deliverables:
- Subfolder-by-subfolder changelog entries.

Acceptance:
- Shared components are visually consistent and reusable.

---

## Prompt 08 — `src/centerpanel`
You are updating the core workspace in `src/centerpanel`.

Sub-order (mandatory):
1. `styles`
2. `components`
3. `tabs`
4. `nav`
5. `Guide`
6. `Flows`
7. `registry`
8. `registry-ui`
9. `Note`
10. `rail`
11. `timerHooks`
12. `Tools`
13. `hooks`
14. `lib`
15. `services`
16. `state`
17. root files in `centerpanel`

Tasks:
- Keep center workspace calm and operational: neutral planes + amber highlights.
- Apply controlled accent usage for actionable controls, not decorative overuse.
- Optimize readability for note/flow/registry heavy screens.

Deliverables:
- Visual consistency across all centerpanel modules.
- Priority list of any edge-state visual debt.

Acceptance:
- Clinical/analytics workflow remains fast, legible, and non-fatiguing.

---

## Prompt 09 — `src/features`
You are updating feature domain UI in `src/features`.

Sub-order:
1. `attachments`
2. `chat`
3. `psychiatry`
4. feature root files

Tasks:
- Harmonize feature-specific chips/badges/status labels with global tokens.
- Keep feature personality but remove palette divergence.

Deliverables:
- Feature-level visual harmonization note.

Acceptance:
- Features look native to the same design system.

---

## Prompt 10 — `src/services`
You are updating any UI-facing generated templates/styles in `src/services`.

Tasks:
- Replace embedded color literals in generated HTML/CSS snippets.
- Ensure exports and previews respect new palette.

Deliverables:
- Service output style consistency report.

Acceptance:
- No user-facing generated content appears off-theme.

---

## Prompt 11 — `src/lib`
You are updating UI-adjacent helpers in `src/lib`.

Tasks:
- Remove hardcoded UI colors from helper modules.
- Align utility outputs with semantic tokens.

Deliverables:
- Utility color normalization summary.

Acceptance:
- No legacy palette leakage from helper layer.

---

## Prompt 12 — `src/hooks`
You are updating theme-dependent logic in `src/hooks`.

Tasks:
- Update hooks that compute styles, classes, or mode-specific visuals.
- Preserve memoization and behavior while replacing stale color references.

Deliverables:
- Hook-level compatibility note.

Acceptance:
- No regressions in interaction behavior or rendering.

---

## Prompt 13 — `src/store`
You are updating theme state handling in `src/store`.

Tasks:
- Validate token keys and palette defaults in app-level stores.
- Ensure persisted settings remain backward-compatible.

Deliverables:
- Store migration note.

Acceptance:
- Existing users do not break on reload.

---

## Prompt 14 — `src/stores`
You are updating multi-store modules in `src/stores`.

Tasks:
- Align all UI-related store defaults and flags with new palette semantics.
- Remove stale references to blue theme assumptions.

Deliverables:
- Store-by-store palette compatibility checklist.

Acceptance:
- UI state transitions remain stable after migration.

---

## Prompt 15 — `src/state`
You are updating state utilities in `src/state`.

Tasks:
- Ensure persisted UI fragments and view states map to current token scheme.

Deliverables:
- State persistence migration sanity note.

Acceptance:
- No color mode mismatch after session restore.

---

## Prompt 16 — `src/templates`
You are updating template-level screens in `src/templates`.

Tasks:
- Bring hero/landing/empty templates to urban analytics tone.
- Keep message hierarchy and brand feel premium and concise.

Deliverables:
- Template visual consistency updates.

Acceptance:
- Templates match app shell quality level.

---

## Prompt 17 — `src/locales`
You are updating locale-driven visual labels in `src/locales`.

Tasks:
- Identify and replace text references implying blue-based semantics where applicable.

Deliverables:
- Locale wording note for design-semantic alignment.

Acceptance:
- UX text aligns with non-blue color semantics.

---

## Prompt 18 — `src/i18n`
You are updating i18n layer behavior in `src/i18n`.

Tasks:
- Ensure any theme-dependent labels and keys remain valid.

Deliverables:
- i18n compatibility note for theme migration.

Acceptance:
- No translation key drift caused by style-system updates.

---

## Prompt 19 — `src/observability`
You are updating observability UI touchpoints in `src/observability`.

Tasks:
- Align telemetry/diagnostic visual markers with palette.
- Keep warning/error semantics clear and accessible.

Deliverables:
- Observability visuals style alignment summary.

Acceptance:
- Telemetry surfaces are clear and consistent with design system.

---

## Prompt 20 — `src/utils`
You are updating style-adjacent helpers in `src/utils`.

Tasks:
- Remove hardcoded color values from utility outputs (markdown/html/render helpers).
- Keep generated outputs theme-aware.

Deliverables:
- Utility modernization report.

Acceptance:
- Utility-produced visuals are token-consistent.

---

## Prompt 21 — `src/workers`
You are updating worker-produced UI-adjacent outputs in `src/workers`.

Tasks:
- Ensure serialized visual payloads (if any) use semantic values.

Deliverables:
- Worker output compatibility note.

Acceptance:
- No worker-generated UI data breaks theme consistency.

---

## Prompt 22 — `src/ai`
You are updating AI-layer UI-related structures in `src/ai`.

Tasks:
- Validate any provider/meta rendering cues or color indicators are neutral/amber aligned.
- Keep provider distinction clear without blue dependence.

Deliverables:
- AI layer visual metadata alignment summary.

Acceptance:
- AI surfaces remain readable and consistent.

---

## Prompt 23 — `src/assets`
You are updating static visual assets in `src/assets`.

Tasks:
- Audit icons/illustrations/backgrounds for blue hues.
- Replace/retone assets to match black-charcoal-amber direction.

Deliverables:
- Asset migration list (updated/replaced/kept).

Acceptance:
- No off-theme blue dominant asset remains.

---

## Prompt 24 — `src/contexts`
You are updating theme-aware contexts in `src/contexts`.

Tasks:
- Ensure context providers expose and consume new token keys correctly.
- Maintain backward compatibility for existing consumers.

Deliverables:
- Context contract verification note.

Acceptance:
- No runtime context mismatch for theming.

---

## Prompt 25 — `src/types`
You are updating type definitions in `src/types`.

Tasks:
- Add/update type-safe token keys and theme contracts.
- Remove deprecated color enum entries tied to blue theme assumptions.

Deliverables:
- Type migration and safety summary.

Acceptance:
- Typechecking supports full Charcoal+Amber token model.

---

## Prompt 26 — Final Integration (`src/App.tsx`, `src/main.tsx`)
You are performing final integration and stabilization.

Tasks:
- Confirm root provider/theme wiring points to new palette stack.
- Validate app bootstrap, shell rendering, and global visual consistency.

Deliverables:
- Final migration summary.
- Residual risk list and v2 polish opportunities.

Acceptance:
- End-to-end visual system is coherent, non-blue, and production-ready.

---

## Required Output After Each Prompt
For every prompt completion, output:
1. Files changed
2. Tokens used/updated
3. Accessibility checks done
4. Regressions found (if any)
5. Ready for next prompt? PASS/FAIL

## Final Program Exit Criteria
- All 26 prompts completed in order.
- No blue accents remain.
- Real black base remains intact.
- Shared and domain UI are visually unified.
- Build/typecheck pass after migration.
