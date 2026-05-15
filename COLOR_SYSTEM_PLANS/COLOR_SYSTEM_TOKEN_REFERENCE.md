# Color System Token Reference

## Status

Planning authority for color prompts. Implementation must validate and adapt this reference against live files.

## Token Layers

1. Primitive: raw palette values, for example `--syn-vscode-bg-root`.
2. Semantic: product meaning, for example `--syn-surface-workbench`.
3. Component alias: temporary bridge, for example `--map-layer-row-bg`.
4. Data palette: analytical colors, for example `--syn-data-sequential-1`.

Components should consume semantic tokens or component aliases, not primitives.

## VS Code-Inspired Primitive Palette

| Token | Value | Purpose |
| --- | --- | --- |
| `--syn-vscode-bg-root` | `#1e1f24` | App root |
| `--syn-vscode-bg-activity` | `#24272f` | Activity rail / outer chrome |
| `--syn-vscode-bg-sidebar` | `#252a31` | Sidebars and navigation |
| `--syn-vscode-bg-editor` | `#1f232a` | Editor/map work area |
| `--syn-vscode-bg-panel` | `#232832` | Bottom/right panels |
| `--syn-vscode-bg-elevated` | `#2b3038` | Menus, popovers, selected tabs |
| `--syn-vscode-bg-input` | `#1a1f26` | Inputs and search boxes |
| `--syn-vscode-bg-hover` | `#303642` | Hover rows/buttons |
| `--syn-vscode-border-subtle` | `#343a44` | Separators |
| `--syn-vscode-border-strong` | `#4a5260` | Strong/active edges |
| `--syn-vscode-text-primary` | `#d7dce5` | Main text |
| `--syn-vscode-text-secondary` | `#a4adbb` | Secondary metadata |
| `--syn-vscode-text-muted` | `#778190` | Muted/disabled context |
| `--syn-vscode-accent-blue` | `#3794ff` | Interactive active/focus/link |
| `--syn-vscode-accent-blue-soft` | `#1f4f7f` | Subtle selected fill |
| `--syn-vscode-attention-amber` | `#d6a84f` | Attention/provenance/warning |
| `--syn-vscode-attention-amber-soft` | `#4a3a1e` | Subtle attention fill |

## Semantic Tokens To Add

| Token | Maps To | Purpose |
| --- | --- | --- |
| `--syn-surface-workbench` | root | App background |
| `--syn-surface-activity` | activity | Activity rail |
| `--syn-surface-navigation` | sidebar | File tree/layer rail |
| `--syn-surface-editor` | editor | Code/map work area |
| `--syn-surface-panel` | panel | Terminal/drawers/right panels |
| `--syn-surface-elevated` | elevated | Popovers/menus |
| `--syn-surface-input` | input | Inputs/search |
| `--syn-surface-hover` | hover | Hover state |
| `--syn-border-subtle` | border subtle | Thin separator |
| `--syn-border-active` | border strong | Active edge |
| `--syn-focus-ring-blue` | accent blue | Keyboard focus |
| `--syn-accent-interactive` | accent blue | Links/active controls |
| `--syn-accent-interactive-soft` | blue soft | Selected background |
| `--syn-accent-attention` | amber | Warning/provenance attention |
| `--syn-text-default` | text primary | Main text |
| `--syn-text-secondary-vscode` | text secondary | Metadata |
| `--syn-text-muted-vscode` | text muted | Muted text |

## Status Tokens

| Token | Suggested Value | Notes |
| --- | --- | --- |
| `--syn-status-valid` | `#4ec27d` | Valid/ready only |
| `--syn-status-warning` | `#d6a84f` | Caution/review |
| `--syn-status-error` | `#f87171` | Error/invalid/destructive |
| `--syn-status-info` | `#6aa9ff` | Neutral information |
| `--syn-status-blocked` | `#f87171` | Blocked, with label |
| `--syn-status-stale` | `#9aa3b2` | Stale/archived/outdated |
| `--syn-status-unknown` | `#858b96` | Unknown/unverified |
| `--syn-status-demo` | `#c084fc` | Demo/synthetic only |
| `--syn-status-running` | `#6aa9ff` | Running/in progress |
| `--syn-status-pending` | `#a4adbb` | Waiting/pending |

## Existing Compatibility Aliases

Do not remove these until all consumers are migrated:

- `--syn-bg-root`, `--syn-bg-surface-1`, `--syn-bg-surface-2`, `--syn-bg-elevated`
- `--syn-accent-primary`, `--syn-focus-ring`, `--syn-gold-500`, `--syn-gold-300`
- `--color-bg-app`, `--color-bg-surface`, `--color-text-primary`, `--color-border-default`
- `--glass-background`, `--glass-border`, `--ai-background`

## Data Palette Families

Data visualization colors must live in data palette helpers or dedicated `--syn-data-*` tokens.

- Sequential: neutral-to-teal/blue ramps for ordered magnitude.
- Diverging: blue-to-amber or blue-to-red only when analytical meaning is explicit.
- Categorical: balanced muted hues; avoid reusing warning/error as arbitrary categories.
- Residual: diverging with clear zero point.
- Uncertainty: pattern/opacity/label supported, not only gray.
- No data: neutral muted plus legend label.

## Usage Examples

CSS Module:

```css
.panel {
  background: var(--syn-surface-panel);
  color: var(--syn-text-default);
  border: 1px solid var(--syn-border-subtle);
}
```

Inline style:

```tsx
style={{ color: 'var(--syn-status-warning)' }}
```

Styled-components:

```ts
background: var(--syn-surface-elevated);
box-shadow: var(--shadow-focus);
```
