# AI Workspace Guide

This repository uses a persistent workspace under:

```text
.ai-workspace/
```

Before making changes, assistants and coding agents should review:

```text
.ai-workspace/PROJECT_CONTEXT.md
.ai-workspace/DECISIONS.md
.ai-workspace/WORKFLOW.md
.ai-workspace/ARCHITECTURE.md
```

## Core Rule
The repository is the source of truth for project context. Chat history should not be treated as the only memory.

## Default Workflow
- Use branches.
- Avoid direct commits to main/master.
- Prepare pull requests.
- Preserve existing functionality.
- Document risks and test notes.
- Use GitHub Pages preview when available.
