# Architecture Notes

## Purpose
This file documents the technical and structural logic of the repository.

## Repository Role
This repository is treated as the main working repository for SynapseIDE Urban Analytics.

## Expected Structure
The project should maintain a clear modular structure. Components, styles, contexts, services, utilities, and data logic should remain separated where possible.

## Development Principles
- Keep components focused and reusable.
- Avoid large monolithic files when practical.
- Preserve existing imports and exports unless refactoring is intentional.
- Prefer explicit naming.
- Keep UI state logic understandable.
- Do not remove existing behavior without documenting the reason.

## UI Structure Principles
- Workspace layout should remain stable.
- Panels, sidebars, editors, analytics views, and toolbars should follow a consistent design language.
- Header, file explorer, command areas, and dashboard sections should not visually conflict.
- Responsive behavior should be considered when changing layouts.

## Testing and Verification
When changes are made, check where possible:

- Build success
- TypeScript errors
- UI rendering
- Responsive behavior
- GitHub Pages preview
- Existing functionality
