# Project Decisions

This file records important design, technical, and workflow decisions.

## Decision 001 — Repository as Source of Truth
The GitHub repository is the primary source of truth for project memory and context. Chat history should not be treated as the only project memory.

## Decision 002 — AI Workspace Folder
All persistent AI working context should be stored under `.ai-workspace/`.

## Decision 003 — Branch-Based Workflow
Changes should be made through branches and pull requests. Direct commits to main/master should be avoided unless explicitly requested.

## Decision 004 — UI Direction
The project should follow a professional, technical, VS Code-like interface direction. Visual effects should be restrained and functional.

## Decision 005 — Preserve Functionality
Existing functionality should not be broken during UI or structural improvements.

## Decision 006 — Forking Rule
Forking or separate variant repositories should be used only for large experimental changes, domain-specific transformations, or risky architectural rewrites.
