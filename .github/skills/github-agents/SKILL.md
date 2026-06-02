---
name: github-agents
description: 'Create, review, or maintain workspace custom agents in .github/agents/*.agent.md. Use when editing agent frontmatter, tool permissions, argument hints, agent delegation, GIS Modal UI Prompt Executor behavior, or repo-specific VS Code Copilot agent workflows.'
argument-hint: 'Agent name, workflow, or requested change, for example: update GIS Modal UI Prompt Executor'
user-invocable: true
---

# GitHub Workspace Agents

## What This Produces

Use this skill to create or update a repo-scoped custom agent in `.github/agents/`, or to review an existing agent for discoverability, scope, tool safety, and output discipline. Related `.github/prompts/` and `.github/instructions/` files are context unless the user explicitly asks to edit them too.

The expected result is a valid `*.agent.md` file with trigger-rich frontmatter, a clear operating contract, minimal necessary tool access, and repo-specific completion checks.

## When To Use

- Create a new `.github/agents/*.agent.md` file.
- Update an existing custom agent's `description`, `tools`, delegated `agents`, `argument-hint`, or body instructions.
- Review why an agent is not being invoked or is invoking at the wrong time.
- Convert a repeated prompt-ladder or repo workflow into a custom agent.
- Maintain the GIS Modal UI Prompt Executor or related Urban Analytics Workbench agent workflows.

Do not use this skill for single-run prompts, always-on coding preferences, or generic implementation work. Prefer a prompt for one focused task, instructions for broad rules, and a skill for a reusable workflow that does not need custom agent isolation.

## Inputs To Gather

1. The target agent file or desired workflow outcome.
2. Whether the agent should be user-invocable from chat.
3. The files, plans, ledgers, prompts, or instructions it must read first.
4. The operations it may perform: read, search, edit, execute, delegate to subagents, commit, push, or open PRs.
5. The expected closeout format and validation commands. Default to validation plus summary; include branch, commit, push, or PR steps only when the user asks or the target workflow explicitly owns that closeout.

If any of these are unclear and the choice affects safety or scope, ask a concise clarifying question before writing the final version.

## Procedure

1. Inventory the customization layer.
   - Read `.github/agents/`, `.github/prompts/`, `.github/instructions/`, and the repo's root agent guidance when relevant.
   - For Urban Analytics Workbench work, treat archived prompt ladders as historical unless the user explicitly asks for audit or archive work.

2. Choose the right customization primitive.
   - Use a custom agent when the workflow benefits from context isolation, a specialized role, delegated subagents, or tool restrictions.
   - Use a skill when the same assistant should run a repeatable procedure with optional bundled references.
   - Use a prompt when the task is a single parameterized command.
   - Use an instruction file when the rule should apply automatically to matching paths.

3. Design the frontmatter.
   - `name`: human-readable for custom agents; keep it stable once users invoke it by name.
   - `description`: include concrete trigger phrases, target paths, plan names, and actions. This is the discovery surface.
   - `tools`: grant only the capabilities the workflow needs, such as `read`, `search`, `edit`, `execute`, and `agent`.
   - `agents`: list delegated subagents only when the procedure explicitly uses them.
   - `argument-hint`: show the smallest useful input, such as a prompt number, selected text, or workflow name.
   - `user-invocable`: set deliberately; omit only when the default is intended.

4. Write the agent body.
   - Start with the agent's role and the outcome it must deliver.
   - Add a tight Scope section that says what it owns and what it must not touch.
   - Add Constraints for repo invariants, safety rules, data-truthfulness requirements, and user-change protection.
   - Add an Approach section with ordered steps, including context gathering, implementation, validation, ledger or documentation updates, and closeout.
   - Add an Output Format section that keeps final responses short and operational.

5. Add branching rules.
   - If no target prompt or workflow item is supplied, define how the agent discovers the next eligible item.
   - If required context or validation is missing, define whether the agent should ask, mark blocked, or proceed with a reduced scope.
   - If commit, push, or PR work is requested, define the success and failure states explicitly.
   - If archived plans are mentioned, require explicit user intent before treating them as active work.

6. Validate the customization.
   - Confirm the file lives in `.github/agents/` and ends in `.agent.md`.
   - Check YAML frontmatter starts and ends with `---`, has no tabs, and quotes values containing colons.
   - Check that the description contains the keywords a user is likely to type.
   - Confirm tool permissions match the workflow and do not exceed it.
   - Confirm all referenced paths exist or are intentionally described as user-supplied.
   - For repo workflow agents, include validation commands and a clear blocked-state policy.

## Quality Criteria

- The agent can be discovered from natural user phrasing, not only by exact name.
- The first paragraph says what the agent does and what complete means.
- Scope boundaries protect unrelated modules and user changes.
- The body contains actionable steps, not just aspirations.
- Tool permissions are minimal and justified by the procedure.
- Output expectations are specific enough to prevent long logs or vague summaries.
- Repo-specific scientific, GIS, or validation rules remain visible when the agent touches those domains.

## Review Checklist

- Frontmatter parses as YAML.
- `description` is under 1024 characters and includes trigger keywords.
- `argument-hint` matches the way users will invoke the agent.
- Delegated agents named in `agents` exist in the workspace or environment.
- The agent does not silently resume archived plans.
- The agent says how to handle validation failures, dirty worktrees, and incomplete prompt-pack closeout.
- The final response format names changed files, validation outcomes, branch or commit state when relevant, blockers, and residual risk.