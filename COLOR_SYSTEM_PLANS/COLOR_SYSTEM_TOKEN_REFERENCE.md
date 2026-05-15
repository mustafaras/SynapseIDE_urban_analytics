# Color System Token Reference

## Status

Execution authority through Prompt 05. This document defines the canonical token taxonomy and semantic alias contract before broad UI migration prompts.

## Canonical Naming Layers

Use exactly five token families. Every color usage in product UI must resolve to one of these families.

| Layer | Prefix Pattern | Owner | Allowed Consumers | Example | Forbidden |
| --- | --- | --- | --- | --- | --- |
| Primitive | `--syn-vscode-*` | Global theme/token layer | Semantic tokens only | `--syn-vscode-bg-root` | Feature components reading primitives directly |
| Semantic | `--syn-surface-*`, `--syn-text-*`, `--syn-border-*`, `--syn-accent-*`, `--syn-focus-*` | Shared shell/theme | All product UI | `--syn-surface-panel` | Mapping semantic tokens to business-specific component names |
| Component Alias (temporary bridge) | `--syn-comp-<unit>-<slot>-<state>` or existing local alias | Owning unit/module | Only owning unit; must map to semantic token | `--syn-comp-map-layer-row-bg-default` | Cross-module reuse as global semantic token |
| Status Semantic | `--syn-status-*` | Shared shell + domain status surfaces | Badges, alerts, QA/provenance states | `--syn-status-warning` | Using status colors as decorative accents |
| Data Palette | `--syn-data-*` or data palette helper APIs | Data-viz owners | Charts, maps, legends only | `--syn-data-sequential-3` | Using data palette for UI chrome/focus/selection |

## Prompt 04 Primitive Palette Additions

The following non-breaking primitives were added to `src/theme/GlobalSynapseStyles.ts` and mirrored as raw/var constants in `src/theme/synapse.ts`.

### Surface/Text/Accent Primitives

| Primitive Token | Value |
| --- | --- |
| `--syn-vscode-bg-root` | `#1e1f24` |
| `--syn-vscode-bg-activity` | `#24272f` |
| `--syn-vscode-bg-sidebar` | `#252a31` |
| `--syn-vscode-bg-editor` | `#1f232a` |
| `--syn-vscode-bg-panel` | `#232832` |
| `--syn-vscode-bg-elevated` | `#2b3038` |
| `--syn-vscode-bg-input` | `#1a1f26` |
| `--syn-vscode-bg-hover` | `#303642` |
| `--syn-vscode-border-subtle` | `#343a44` |
| `--syn-vscode-border-strong` | `#4a5260` |
| `--syn-vscode-text-primary` | `#d7dce5` |
| `--syn-vscode-text-secondary` | `#a4adbb` |
| `--syn-vscode-text-muted` | `#778190` |
| `--syn-vscode-accent-blue` | `#3794ff` |
| `--syn-vscode-accent-blue-soft` | `#1f4f7f` |
| `--syn-vscode-attention-amber` | `#d6a84f` |
| `--syn-vscode-attention-amber-soft` | `#4a3a1e` |

### Primitive Status Set

| Primitive Token | Value |
| --- | --- |
| `--syn-vscode-status-valid` | `#4ec27d` |
| `--syn-vscode-status-warning` | `#d6a84f` |
| `--syn-vscode-status-error` | `#f87171` |
| `--syn-vscode-status-info` | `#6aa9ff` |
| `--syn-vscode-status-blocked` | `#f87171` |
| `--syn-vscode-status-stale` | `#9aa3b2` |
| `--syn-vscode-status-unknown` | `#858b96` |
| `--syn-vscode-status-demo` | `#c084fc` |
| `--syn-vscode-status-running` | `#6aa9ff` |
| `--syn-vscode-status-pending` | `#a4adbb` |

Notes:

1. Blue is now defined as interactive primitive (`--syn-vscode-accent-blue`) while amber remains available as attention primitive.
2. Existing legacy `--syn-*`, `--color-*`, `--glass-*`, and theme-path aliases remain intact and unchanged in this prompt.

## Prompt 05 Semantic Alias Layer

Prompt 05 maps product semantics to primitives and keeps legacy aliases resolving safely.

### Semantic-to-Primitive Mapping

| Semantic Token | Primitive Source |
| --- | --- |
| `--syn-surface-workbench` | `--syn-vscode-bg-root` |
| `--syn-surface-navigation` | `--syn-vscode-bg-sidebar` |
| `--syn-surface-panel` | `--syn-vscode-bg-panel` |
| `--syn-surface-editor` | `--syn-vscode-bg-editor` |
| `--syn-surface-elevated` | `--syn-vscode-bg-elevated` |
| `--syn-surface-input` | `--syn-vscode-bg-input` |
| `--syn-surface-hover` | `--syn-vscode-bg-hover` |
| `--syn-surface-overlay` | `rgba(12,15,20,0.78)` |
| `--syn-text-default` | `--syn-vscode-text-primary` |
| `--syn-text-secondary` | `--syn-vscode-text-secondary` |
| `--syn-text-muted` | `--syn-vscode-text-muted` |
| `--syn-text-disabled` | `#6f7785` |
| `--syn-text-inverse` | `#0f1218` |
| `--syn-text-link` | `--syn-vscode-accent-blue` |
| `--syn-border-default` | `--syn-vscode-border-subtle` |
| `--syn-border-subtle` | `--syn-vscode-border-subtle` |
| `--syn-border-strong` | `--syn-vscode-border-strong` |
| `--syn-border-active` | `--syn-vscode-accent-blue` |
| `--syn-border-focus` | `--syn-vscode-accent-blue` |
| `--syn-interaction-hover` | `--syn-vscode-bg-hover` |
| `--syn-interaction-selected` | `--syn-vscode-accent-blue-soft` |
| `--syn-interaction-active` | `--syn-vscode-accent-blue` |
| `--syn-interaction-focus-ring` | `--syn-vscode-accent-blue` |
| `--syn-interaction-disabled` | `rgba(119,129,144,0.36)` |
| `--syn-status-valid` ... `--syn-status-pending` | Matching `--syn-vscode-status-*` primitives |

### Compatibility Aliases Added In Prompt 05

| Legacy Alias | Now Resolves To |
| --- | --- |
| `--syn-bg-root`, `--syn-bg-900` | `--syn-surface-workbench` |
| `--syn-bg-surface-1`, `--syn-surface-800` | `--syn-surface-panel` |
| `--syn-bg-surface-2` | `--syn-surface-navigation` |
| `--syn-bg-elevated` | `--syn-surface-elevated` |
| `--syn-overlay` | `--syn-surface-overlay` |
| `--syn-text-primary`, `--syn-text-100` | `--syn-text-default` |
| `--syn-text-400` | `--syn-text-muted` |
| `--syn-border-700` | `--syn-border-default` |
| `--syn-focus-ring` | `--syn-interaction-focus-ring` |
| `--syn-danger-400`, `--syn-success-400`, `--syn-warning-400`, `--syn-info-400` | Semantic status tokens |
| `--color-bg-*`, `--color-text-*`, `--color-border-*`, `--color-status-*` | Semantic surface/text/border/status families |

## Canonical Semantic Set

These semantic names are the canonical targets for migration prompts.

| Token | Semantic Meaning | Primary Surfaces |
| --- | --- | --- |
| `--syn-surface-workbench` | App root background | Root shell |
| `--syn-surface-activity` | Activity rail/outer chrome | IDE/rails |
| `--syn-surface-navigation` | Navigation/sidebar surfaces | File tree/layer rail |
| `--syn-surface-editor` | Primary work surface | Editor/map center |
| `--syn-surface-panel` | Secondary utility panels | Bottom/right drawers |
| `--syn-surface-elevated` | Overlays and popovers | Menus/modals/tooltips |
| `--syn-surface-input` | Inputs/search controls | Forms/search |
| `--syn-surface-hover` | Hover/row emphasis surface | Lists/buttons |
| `--syn-surface-overlay` | Modal/scrim overlay | Dialog and overlay shells |
| `--syn-border-default` | Standard border token | Inputs/panels/separators |
| `--syn-border-subtle` | Default separators | Hairlines/dividers |
| `--syn-border-strong` | Higher-contrast border | Dense panel boundaries |
| `--syn-border-active` | Active/selected border | Focused rows/active tabs |
| `--syn-border-focus` | Focus border and ring source | Keyboard focus states |
| `--syn-accent-interactive` | Interactive emphasis | Focus/selected/action links |
| `--syn-accent-interactive-soft` | Subtle interactive fill | Selected row backgrounds |
| `--syn-accent-attention` | Caution/provenance emphasis | Warning/provenance |
| `--syn-focus-ring-blue` | Focus ring color | Keyboard focus |
| `--syn-text-default` | Primary readable text | Body/labels |
| `--syn-text-secondary` | Secondary metadata text | Captions/meta |
| `--syn-text-muted` | Muted/de-emphasized text | Disabled/ancillary |
| `--syn-text-disabled` | Disabled/blocked text | Disabled controls |
| `--syn-text-inverse` | Inverse readability text | Light chips/contrast surfaces |
| `--syn-text-link` | Link/action text | Links and interactive labels |

## Status Token Contract

Status tokens are semantic states, not decoration:

- `--syn-status-valid`
- `--syn-status-warning`
- `--syn-status-error`
- `--syn-status-info`
- `--syn-status-blocked`
- `--syn-status-stale`
- `--syn-status-unknown`
- `--syn-status-demo`
- `--syn-status-running`
- `--syn-status-pending`

Rules:

1. Every status color must be paired with visible text/icon/aria context.
2. `demo`, `unknown`, `stale`, `blocked` must never share `valid` styling.
3. `warning` and `error` status colors cannot be reused as neutral UI accent.

## Data Palette Contract

Data-viz tokens and helpers are separate from UI chrome:

- Sequential: ordered magnitude ramps.
- Diverging: explicit midpoint/zero-point semantics.
- Categorical: balanced category distinction without semantic confusion.
- Residual/uncertainty/no-data: explicit legend semantics.

Data palettes must not silently imply readiness, validity, or error states.

## Compatibility Aliases Kept (Do Not Remove Yet)

These aliases remain active until migration prompts complete their target units.

| Existing Alias Family | Keep Reason | Canonical Target |
| --- | --- | --- |
| `--syn-bg-root`, `--syn-bg-surface-1`, `--syn-bg-surface-2`, `--syn-bg-elevated` | High legacy usage in CSS Modules and theme bridge | `--syn-surface-*` |
| `--syn-bg-900`, `--syn-surface-800`, `--syn-border-700`, `--syn-text-100`, `--syn-text-400` | Legacy theme object compatibility (`synapseTheme.colors.*`) | semantic text/surface/border tokens |
| `--syn-accent-primary`, `--syn-accent-primary-hover`, `--syn-accent-primary-pressed`, `--syn-accent-soft-bg`, `--syn-focus-ring` | Broad usage in IDE/UI shell | `--syn-accent-*`, `--syn-focus-ring-blue` |
| `--syn-gold-500`, `--syn-gold-300` | Historical amber naming | `--syn-accent-attention` or interactive semantic aliases (context-dependent) |
| `--color-*` (`--color-text-*`, `--color-border-*`, `--color-accent-*`, `--color-status-*`) | Legacy ThemeContext writer path remains active | semantic/status tokens |
| `--glass-*`, `--ai-*` | Legacy shell + AI surfaces still consume them | semantic surface/accent/status mappings |
| `ThemeColors.primary`, `ThemeColors.accent`, `ThemeColors.warning/info` in `src/styles/theme.ts` | Legacy typed theme path still present | semantic/status split in future prompt |

## Forbidden Direct Usages

These are policy violations for migration prompts:

1. Feature/component UI must not consume primitive tokens directly.
2. Runtime product UI must not introduce new raw hex/rgb/hsl literals outside token-source files.
3. Data palette tokens/colors must not style chrome controls, focus rings, or shell borders.
4. Status semantic tokens must not be used as generic brand/accent colors.
5. New component aliases must not become cross-module global contracts.

## Deprecation Notes (Amber-First Legacy Names)

No deletion in Prompt 03. Mark and migrate in later prompts.

| Legacy Name | Current Problem | Migration Direction | Removal Gate |
| --- | --- | --- | --- |
| `--syn-accent-primary` | Amber currently doubles as interactive default and warning tone | Move interactive default to `--syn-accent-interactive`; keep amber for attention/status where appropriate | After Prompts 08-34 migrations + Prompt 36 QA |
| `--syn-gold-500`, `--syn-gold-300` | Ambiguous gold naming hides semantic intent | Replace callsites with `--syn-accent-attention` or component alias mapped to semantic token | After consumer inventory reaches zero |
| `ThemeColors.primary` / `ThemeColors.accent` (`src/styles/theme.ts`) | Encourages amber-first coupling in legacy path | Map to semantic token families and explicit status tokens | During provider compatibility and cleanup prompts |
| Amber chart entries in shared theme (`--syn-chart-1`, `chart1`) | Risk of chart/status/chrome semantic collision | Move to explicit data palette naming (`--syn-data-*`) in data-viz prompts | After Prompt 27 and Prompt 29 sweeps |

## Family Selection Guide

Use this decision flow for any new or migrated color usage:

1. Is this map/chart/legend encoding data?
   - Yes: use data palette layer.
   - No: continue.
2. Is this a domain/system status?
   - Yes: use status semantic token.
   - No: continue.
3. Is this shared cross-module UI meaning?
   - Yes: use semantic token.
   - No: continue.
4. Is this unit-local transitional styling?
   - Yes: use component alias mapped to semantic token.
5. Primitive tokens are only for token definition layers.

## Usage Examples

Semantic token usage:

```css
.panel {
  background: var(--syn-surface-panel);
  color: var(--syn-text-default);
  border: 1px solid var(--syn-border-subtle);
}
```

Component alias bridging to semantic:

```css
:root {
  --syn-comp-map-layer-row-bg-default: var(--syn-surface-panel);
}
```

Status semantic usage:

```tsx
style={{ color: "var(--syn-status-warning)" }}
```

Data palette usage:

```ts
const ramp = ["var(--syn-data-sequential-1)", "var(--syn-data-sequential-2)"];
```
