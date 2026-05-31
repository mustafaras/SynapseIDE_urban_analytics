---
name: next-gis-prompt
description: The Map Explorer Production GIS prompt ladder is archived and complete. Use when asked to "do the next GIS prompt", "continue the map explorer plan", "advance the production GIS plan", or "what's next in the GIS pack" to explain that there is no active next prompt and point to the archive.
---

# Map Explorer Production GIS Pack Is Archived

The former active operating pack has been archived at `docs/archive/development-plans/map-explorer-production-gis-2026-05-22/`.

There is no unfinished prompt to resume. Prompts 0-64 are complete, and final production hardening plus release-candidate validation landed on `master` in commit `401fb34e187e12656e28e27ebcb293ece90ed94e`.

When a user asks for the next GIS prompt:

1. Do not continue the old ladder or create a `gis/p<NN>-...` branch from it.
2. Explain that the ladder is archived and complete.
3. For historical reference, start with `docs/archive/development-plans/map-explorer-production-gis-2026-05-22/ARCHIVE_INDEX.md`, then `LEDGER.md` if audit detail is needed.
4. For new GIS work, proceed from the user's concrete task or create a fresh operating pack if they ask for another multi-session plan.

Map-specific validation conventions still apply to new Map Explorer work:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/<spec>
npx vitest run src/services/map/__tests__/<spec>
```
