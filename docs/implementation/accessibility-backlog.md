# Accessibility Backlog

## Audit Scope
- Automated axe-core audit run on critical analytical flows: Accessibility, Composite Indicator Builder, Change Detection, Scenario Comparison, and Completed Run Review.
- Keyboard-only focus order and operability verified across the same five flows using Playwright.
- Current status: no open serious or critical axe violations on the audited flow surfaces after Prompt 39 remediation.

## Remaining Non-Critical Issues

| Priority | Severity | Area | Issue | Evidence | Owner | Follow-Up Intent | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P2 | Moderate | Workbench Shell / Terminal | Native terminal shell selector styles suppressed browser outlines with repeated `outline: none !important` overrides. Focus is now driven by explicit tokenized `:focus-visible` styles, adjacent shell-control focus styles, and forced-colors fallbacks. | `src/components/terminal/components/Terminal.tsx` focus and option styling blocks around the `.terminal-shell-select` rules | IDE Shell | Keep the shell-specific Playwright regression as the guard against future focus suppression. | Closed in Prompt 40 |
| P2 | Moderate | Global Visual Layer | Legacy `.neural-glass-card-final` reset rules zeroed out outline and box-shadow aggressively. The reset is now scoped to the surface layer so descendant focus indicators survive, and the live `NeuralGlassCardFinal` consumer is keyboard-focusable with regression coverage. | `src/styles/GlobalStyles.ts` global reset block for `.neural-glass-card-final`; `src/components/atoms/NeuralGlassCardFinal.tsx` | Design System | No additional shell consumers were identified during implementation; rely on the narrowed reset and regression coverage to protect future reuse. | Closed in Prompt 40 |
| P3 | Low | Analytical Flows | Some repeated form rows outside the Prompt 39 audited flow set still rely on placeholder-derived names or adjacent text instead of explicit label associations, especially dynamic Site Suitability criteria and dataset rows. | `src/centerpanel/Flows/SiteSuitabilityFlow.tsx` criteria and data-layer inputs | Flow UX | Standardize dynamic field naming with `aria-label` or `aria-labelledby` during the next flow-form cleanup pass. | Open |

## Closed In Prompt 39
- Added explicit programmatic labels to Scenario Comparison baseline, scenario notes, lever sliders, and trade-off notes.
- Added explicit programmatic labels to Run Review reviewer notes.
- Added explicit programmatic labels to Change Detection T0/T1 description textareas.
- Added explicit programmatic labels to Composite Indicator Builder geometric floor slider.
- Added a dedicated Playwright accessibility suite using axe-core plus keyboard focus-order checks.

## Closed In Prompt 40
- Replaced terminal shell focus suppression with tokenized `:focus-visible` treatment, explicit shell-control labels, and forced-colors-safe fallback styling.
- Narrowed the legacy `.neural-glass-card-final` reset so it no longer strips descendant focus indicators while preserving the existing visual reset on the surface itself.
- Added targeted Playwright regression coverage for terminal shell focus visibility and the live `NeuralGlassCardFinal` keyboard-focus path.
