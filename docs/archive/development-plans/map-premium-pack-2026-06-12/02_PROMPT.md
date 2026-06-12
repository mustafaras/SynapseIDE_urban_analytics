# Prompt 02 — Add premium shell tokens and CSS module

## Goal
Establish the premium shell foundation: layout tokens, safe insets, and a central CSS module that makes the modal immediately look more map-first, more compact, and more professional.

## Read first
- `AGENTS.md`
- `MAP_PREMIUM/mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md` section 5, 6, 12, 14, 15
- `MAP_PREMIUM/LEDGER.md`
- `src/centerpanel/components/map/mapTokens.ts`
- `src/centerpanel/components/map/mapLayoutTokens.ts`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`

## Target files
- `src/centerpanel/components/map/mapTokens.ts`
- `src/centerpanel/components/map/mapLayoutTokens.ts`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/shell/MapPremiumShell.module.css`
- `src/centerpanel/components/map/shell/mapShellResponsive.ts`
- `src/centerpanel/components/map/shell/index.ts`

## Task
1. Add shell-level tokens for menu height, status height, drawer height, safe insets, panel widths, and responsive breakpoints.
2. Create the premium shell CSS module that defines the modal frame, workspace grid, panel boundaries, and compact map-first spacing.
3. Add small responsive helpers that calculate visibility and inset behavior without introducing new dependencies.
4. Wrap the existing workspace shell in the new premium shell styling without moving business logic.
5. Preserve all public exports used by existing tests.

## Hard constraints
- Do not remove existing tokens.
- Do not change CRS, QA, evidence, import/export, publish, or analysis behavior.
- Do not add dependencies.
- Do not move logic into the CSS layer.
- Keep the shell visually premium but restrained: thin separators, compact hierarchy, minimal chrome.

## Required visible changes
- The modal should feel immediately cleaner and more map-first.
- The map must gain visual priority over panels.
- The shell should clearly reserve space for left panel, right dock, status bar, and bottom drawer.

## Validation
- Run `typecheck`.
- Run the narrow shell/visual/a11y test subset that exercises the workspace shell.
- If a visual test exists for shell primitives or shell layout, run it now.
- Record exact commands and outcomes in the ledger.

## Output
- Updated shell token and CSS files
- Ledger entry with changed files, visible effect, and validation results
- No behavior regression
