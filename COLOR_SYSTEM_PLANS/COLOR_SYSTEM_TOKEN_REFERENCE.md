# Color System Token Reference

## Status

Execution authority through the historical token baseline and the active two-part workstream. This document defines the canonical token taxonomy and semantic alias contract.

## Active Scope Override - Urban Analytics Modal And Map Explorer

The active `A01`-`B10` prompts apply a stricter rule than the original broad color plan:

- Urban Analytics modal and Map Explorer must not render amber/gold/yellow/orange UI chrome.
- Do not use amber for active, selected, focus, button fill, hover fill, card border, card background, title/link emphasis, decorative gradient, glow, or default/demo/generated map/chart color.
- `--syn-vscode-attention-amber`, `--syn-vscode-attention-amber-soft`, `--syn-status-warning`, `--syn-gradient-amber*`, historical `--syn-gold-*`, and `MAP_COLORS.amber*` may remain as compatibility/history outside the active UI scopes, but active-scope components must not consume them for rendered UI chrome.
- Warning/caveat meaning must remain explicit through text, icons, aria names, disabled reasons, and non-amber status styling.
- Use `--syn-interaction-active`, `--syn-interaction-hover`, `--syn-interaction-selected`, `--syn-interaction-focus-ring`, `--syn-border-focus`, `--syn-status-info`, `--syn-status-error`, `--syn-status-stale`, `--syn-status-unknown`, and `--syn-status-demo` according to meaning.

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

## Prompt 11 Status Bar Semantic Mapping

Prompt 11 migrates the shared status bar and top-level system indicators to semantic status tokens.

### Status Bar Chrome

| Surface / Role | Token |
| --- | --- |
| Status bar background | `--syn-surface-navigation` |
| Top border / subtle separators | `--syn-border-subtle` |
| Focus outline | `--syn-border-focus` |
| Hover emphasis | `--syn-interaction-hover` |

### Status Indicator Mapping

| Indicator State | Token |
| --- | --- |
| `info` | `--syn-status-info` |
| `warning` | `--syn-status-warning` |
| `error` | `--syn-status-error` |
| `running` | `--syn-status-running` |
| `pending` | `--syn-status-pending` |
| `stale` | `--syn-status-stale` |
| `valid` | `--syn-status-valid` |

Notes:

1. Neutral informational status no longer uses amber; `info` is blue (`--syn-status-info`).
2. Compact status labels retain text/icon pairing; color is not the only status signal.
3. Amber remains constrained to warning semantics.

## Prompt 12 IDE Shell And Header Semantic Mapping

Prompt 12 migrates IDE shell chrome and header interactions to semantic workbench/status tokens.

### Shell Region Mapping

| Shell Region | Token Direction |
| --- | --- |
| Activity rail hover/active surfaces | `--syn-interaction-active` mixed over transparent/surface layers |
| Activity rail active indicator | `--syn-interaction-active` |
| Activity badges | `--syn-interaction-active` + `--syn-text-inverse` + `--syn-border-strong` |
| Left/right boundary separators | `--syn-border-subtle`, `--syn-border-active` |
| Bottom panel active tab/focus | `--syn-interaction-active`, `--syn-border-active`, `--syn-border-focus` |
| Resizer hover and right-dock handle | `--syn-interaction-active` mixed with `--syn-surface-panel` |
| Side-pane category badges | Semantic status tokens (`--syn-status-info`, `--syn-status-demo`, `--syn-status-valid`, `--syn-status-warning`) |

### Header Interaction Mapping

| Header Element | Token |
| --- | --- |
| Active tab text | `--syn-interaction-active` |
| Active tab fill | `color-mix` with `--syn-interaction-active` |
| Toggle active border/fill | `--syn-border-active` + `--syn-interaction-active` mixed surfaces |
| Focus ring fallback | `--syn-interaction-focus-ring` |
| Primary action gradient | `--syn-interaction-active` blended with semantic shell surfaces |

### Prompt 12 Retained Literal Categories

1. Development-only showcase/diagnostic visuals in `EnhancedIDE.tsx` keep literals because they are non-production and out of shell migration scope.
2. Existing status fallback literals (success/error defaults) remain as safety fallbacks where semantic vars might be unavailable; primary path resolves to semantic tokens.

## Prompt 13 File Explorer And File Badge Semantic Mapping

Prompt 13 migrates file-tree row states, semantic badges, drag/drop affordances, and file-type icon categories.

### File Tree Interaction Mapping

| Explorer State | Token |
| --- | --- |
| Row hover | `--syn-interaction-active` mixed over transparent |
| Row selected | `--syn-interaction-active` mixed fill + active edge |
| Keyboard focus ring | `--syn-interaction-focus-ring` |
| Valid drop target | `--syn-interaction-active` mixed dashed outline |
| Invalid drop target | `--syn-status-error` mixed dashed outline |

### Semantic Badge Tone Mapping

| Badge Tone | Token |
| --- | --- |
| `neutral` | `--syn-status-unknown` |
| `info` | `--syn-status-info` |
| `success` | `--syn-status-valid` |
| `warning` | `--syn-status-warning` |

### File Type Stable Categories (from `FILE_TYPES`)

| Category | Token |
| --- | --- |
| Folder | `--syn-status-warning` |
| Code/script family | `--syn-interaction-active` |
| GIS/geo files | `--syn-status-valid` / `--syn-status-info` |
| Config/text/archive/unknown | `--syn-text-secondary`, `--syn-text-muted`, `--syn-status-unknown` |
| Media/image | `--syn-status-demo` |

## Prompt 14 Editor Tabs Monaco Outline And Search Semantic Mapping

Prompt 14 migrates editor-adjacent chrome (tab state indicators, Monaco context/breadcrumb shell, outline controls, search results, and diagnostics summary accents) to semantic interaction/status tokens while preserving syntax readability.

### Editor Tab State Mapping

| Editor Tab State | Token |
| --- | --- |
| Active tab text and marker | `--syn-interaction-active` |
| Active tab surface tint | `--syn-interaction-active` mixed fill |
| Pinned indicator | `--syn-interaction-active` when active, `--syn-text-muted` otherwise |
| Dirty indicator dot | `--syn-status-warning` |

### Monaco Context And Breadcrumb Mapping

| Monaco Surface | Token |
| --- | --- |
| Context bar emphasis | `--syn-surface-editor` mixed with `--syn-interaction-active` |
| File icon accent | `--syn-interaction-active` |
| Context chips (default) | `--syn-surface-hover` + `--syn-text-secondary` + `--syn-border-subtle` |
| Dirty / clean / large chips | `--syn-status-warning` / `--syn-status-valid` / `--syn-status-caveat` |

### Outline And Search Mapping

| Surface | Token |
| --- | --- |
| Outline kicker and interactive focus | `--syn-interaction-active`, `--syn-border-active` |
| Search scope active state | `--syn-interaction-active` + `--syn-border-active` |
| Search result row hover/focus | `--syn-surface-hover`, `--syn-interaction-focus-ring` |
| Search match highlight (distinct from warning/error) | `--syn-status-info` mixed mark background |

### Diagnostics Summary Mapping

| Diagnostics Surface | Token |
| --- | --- |
| Problems summary error/warning/info | `--syn-status-error` / `--syn-status-warning` / `--syn-status-info` |
| Source state stale marker | `--syn-status-stale` |

Notes:

1. Monaco syntax token theme mappings are intentionally unchanged in Prompt 14.
2. Search match highlights use the info family to avoid ambiguity with warning/error diagnostics.

## Prompt 16 Command Palette Search And AI Panel Semantic Mapping

Prompt 16 migrates command palette, global search refinements, AI composer chrome, AI status strips, apply preview, and warning/conflict surfaces to semantic tokens without changing prompt construction or apply-plan behavior.

### Palette And Search Interaction Mapping

| Surface | Token |
| --- | --- |
| Palette/search input surface | `--syn-surface-input`, `--syn-surface-hover` mixed fills |
| Active mode/scope marker | `--syn-interaction-active` |
| Selected result row | `--syn-interaction-active` mixed fill + active edge |
| Keyboard focus ring | `--syn-interaction-focus-ring` |
| Disabled command reason | `--syn-status-error` |
| Match highlight | `--syn-status-info` mixed mark background |

### AI And Apply Preview Mapping

| AI / Apply Surface | Token |
| --- | --- |
| Composer input focus and primary apply/send controls | `--syn-interaction-active` |
| AI panel surfaces, overlays, code-block chrome | `--syn-surface-panel`, `--syn-surface-overlay`, `--syn-surface-editor`, `--syn-border-subtle` |
| API key verified / missing / invalid / rate-limited / unknown | `--syn-status-valid` / `--syn-status-blocked` / `--syn-status-error` / `--syn-status-warning` / `--syn-status-unknown` |
| Verifying/generating/running AI state | `--syn-status-running` |
| Apply preview create / replace / update actions | `--syn-status-valid` / `--syn-status-warning` / `--syn-status-info` |
| Apply preview conflicts and high-risk warnings | `--syn-status-error` with explicit labels/icons |
| Medium-risk or destructive-caution surfaces | `--syn-status-warning` with explicit labels/icons |

Notes:

1. AI warnings and conflicts retain text labels, icons, aria labels, or visible status text; color is never the only signal.
2. Prism syntax colors and language-dot colors are retained as code/content palette values rather than UI chrome tokens.

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
