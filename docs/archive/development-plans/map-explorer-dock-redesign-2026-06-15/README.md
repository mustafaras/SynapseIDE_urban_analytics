# Map Explorer — Dock, Drawing & Status Premium Redesign Pack

**Created:** 2026-06-15
**Owner module:** Map Explorer (`src/centerpanel/components/map/`, `src/centerpanel/components/MapDrawingManager.tsx`, `src/services/map/`)
**Status:** PLAN ONLY — no production code has been changed yet.
**Execution model:** 20 sequential phases (`p00`–`p19`). Every phase runs as a **dual track** — **Track A (Functional)** and **Track B (Visual)** — and a phase is only `done` when **both tracks are independently verified** (Track A by tests/typecheck, Track B by screenshot).

This pack is engineered so that an agent can pick up **any single prompt in a fresh chat session**, with no memory of prior sessions, and execute it correctly. Each prompt in [prompts/](prompts/) is self-contained: it embeds the problem statement, the exact files and line anchors, the contracts it must not break, the verification commands, and its obligation to update the ledger and state before exiting.

---

## The problems this pack solves

Reported by the product owner, plus latent issues found during the 2026-06-15 architecture sweep:

| # | Problem | Severity | Phases |
|---|---|---|---|
| 1 | Topbar **Draw button does not open on first click**; drawing capabilities are unreachable. | blocker | p04, p05 |
| 2 | Drawn/selected **rectangle AOI cannot fetch real data** and is not wired to scientific analysis end-to-end. | blocker | p07, p08 |
| 3 | **Right dock is not a movable/draggable/resizable floating modal** and is not a clean single-click open. | high | p09, p10, p12 |
| 4 | Right-panel **dual-column layout** is cramped and confusing; needs a single-column premium flow. | high | p11 |
| 5 | Left-dock workspace panels (Data / Add Data, etc.) also use **cramped dual-column** layouts. | high | p13 |
| 6 | **Models tab** is unreadable/unusable due to a two-column builder crammed into a narrow dock. | high | p14, p15 |
| 7 | Status bar **"More" overflow** hides items / renders them incorrectly; interactions are not premium. | high | p16, p17 |
| 8 | **Round red/green status badges and meaningless "ready" chips** pollute the whole surface. | high | p01, p02, p03 |
| 9 | *(latent)* **Dual source of truth** for dock visibility: legacy booleans (`showDrawPanel`/`showMeasurePanel`/`showPinSidebar`) vs. the route system (`mapRightDockRoutes`). | high | p04, p10 |
| 10 | *(latent)* Inconsistent **presentation modes** and empty-state/density/motion drift across panels. | medium | p18 |

---

## How to run a phase (agent protocol)

1. **Bootstrap context** (always, even mid-pack): read [ANTI_AMNESIA.md](ANTI_AMNESIA.md) → [LEDGER.md](LEDGER.md) → [STATE.json](STATE.json).
2. Open the next `pending` prompt in [prompts/](prompts/) (lowest `pNN`, Track A before Track B of the same phase unless `dependsOn` says otherwise).
3. Execute the prompt's steps exactly. Honor every guardrail.
4. **Verify**: Track A → run the listed `npm`/`vitest` commands and paste a result summary into `evidence/`. Track B → use the `screenshot-map-explorer` skill and save shots to `baseline/` (before) or `evidence/` (after).
5. **Update anti-amnesia state before exiting**: flip the LEDGER row + session log, and set the matching `STATE.json` track `status: "done"` with an `evidence` path. **Never mark done without evidence.**
6. Stop at the phase boundary unless told to continue. Do not start the next phase's Track A until the current phase's A **and** B are both `done`.

## Verification quick reference

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/<spec>.test.ts
npm run lint:no-tailwind-centerpanel
npm run color:guard          # badge / palette work (p01–p03)
npm run test:e2e:a11y        # accessibility-sensitive phases
```

- Visual proof → `screenshot-map-explorer` skill.
- GIS validation gate → `check-gis-modal` skill.
- Urban Analytics bridge gate (only if a phase touches `src/features/urbanAnalytics/`) → `check-analytics` skill.

## Pack file map

| File | Purpose |
|---|---|
| [README.md](README.md) | This file. |
| [PLAN.md](PLAN.md) | Architecture reference + the full 20-phase plan with file anchors. |
| [LEDGER.md](LEDGER.md) | Anti-amnesia progress ledger (read first, update last, every session). |
| [STATE.json](STATE.json) | Machine-readable phase/track state; conforms to `prompt.schema.json`. |
| [prompt.schema.json](prompt.schema.json) | JSON Schema for the self-contained phase prompts. |
| [ANTI_AMNESIA.md](ANTI_AMNESIA.md) | 60-second recovery card: file map, invariants, commands, "never do". |
| [TRIGGERS.md](TRIGGERS.md) | Token-lean numbered trigger list (1–20). Send one line at a time; each names a prompt file the agent reads from disk, so chat context stays small. |
| [prompts/](prompts/) | 20 self-contained, agent-ready prompt files (`p00`…`p19`). |
| [baseline/](baseline/) | Pre-change screenshots (captured in p00). |
| [evidence/](evidence/) | Per-phase proof: test summaries + after screenshots. |

> When the pack is complete, archive it under `docs/archive/development-plans/` per the project convention in CLAUDE.md.
