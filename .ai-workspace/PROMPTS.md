# Prompt Library

## Start New Work
Use this prompt when starting a new task:

```text
Read the repository context files under .ai-workspace first. Use mustafaras/SynapseIDE_urban_analytics as the default repository. Do not commit directly to main/master. Create a branch and prepare a PR. Preserve existing functionality.
```

## UI Improvement Prompt

```text
Improve the requested UI area while preserving all existing functionality. Follow the project direction in .ai-workspace/PROJECT_CONTEXT.md and .ai-workspace/DECISIONS.md. Keep the design professional, technical, restrained, and VS Code-like.
```

## Bug Fix Prompt

```text
Find the cause of the bug, make the smallest safe fix, avoid unrelated changes, and document the risk and test notes in the PR summary.
```

## Refactor Prompt

```text
Refactor only the requested area. Preserve public behavior, imports, and user-facing functionality unless explicitly instructed otherwise. Keep the change modular and reversible.
```

## GitHub Pages Review Prompt

```text
Check the GitHub Pages preview if available. Compare the intended change with the rendered UI. Identify visual, layout, responsive, or interaction issues before finalizing the PR.
```
