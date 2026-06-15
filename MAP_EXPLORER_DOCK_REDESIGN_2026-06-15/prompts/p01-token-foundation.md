# p01 — Status-Language & De-Roundification Token Foundation

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p01 · **Depends on:** p00 · **Tracks:** A (tokens + policy test) + B (preview)

## Mission
Create the single design-token + policy foundation that lets p02/p03 strip round red/green badges and meaningless "ready" chips across the whole module — without each later phase re-litigating what "calm status" means.

## Why (problem #8)
The owner: *"meaningless round red/green warning cards and 'ready' badges everywhere break the design; remove the round-badge approach entirely and reduce them to a calm, legible, non-distracting treatment."* We fix the **tokens and the enforcement test** here so the cleanup phases have a target and a guardrail.

## Context primer (self-contained)
- Status chips render via `ui/GisStatusChip.tsx`, which is ALREADY square (`borderRadius: 0`) and carries status by **text color + dashed/dotted border for provenance** — not by green/red fills or pills. Good baseline; keep this philosophy.
- Tokens live in `mapTokens.ts`: `GisStatusKey` (~1228), `MAP_STATUS_TOKENS`, `GIS_STATUS_KEYS` (~1335). `MAP_STATUS_TOKENS[status]` returns `{ text, bg }`.
- The round badges are NOT from `GisStatusChip`; they are inline `borderRadius: 999 / 50%` in workspace files (see p03). The "ready/Primary" chips come from `MapRightDockHost` `routeStatus` (see p02).
- "Minimal premium": dense type, thin separators, restrained amber accent, no saturated status fills.

## Files
- `edit` — `src/centerpanel/components/map/mapTokens.ts` — `MAP_STATUS_TOKENS` (calm tones), add a `MAP_RADIUS.badge = 0` (or 2px) export if not present, optional `MAP_STATUS_TONE` helper.
- `edit` — `src/centerpanel/components/map/ui/GisStatusChip.tsx` — only if needed to consume the calmer tokens; do not change its square geometry.
- `create` — `src/centerpanel/components/map/__tests__/mapBadgePolicy.test.ts` — the enforcement test.
- `reference` — `src/centerpanel/components/map/__tests__/mapTokenStatus.test.ts` (existing token test to stay green).

## Do NOT touch / reuse
- Do not change `GisStatusChip`'s `borderRadius: 0` or switch it back to pills.
- Do not redefine `GisStatusKey` membership without updating `mapTokenStatus.test.ts`.

## Track A — Functional
### Steps
1. In `mapTokens.ts`, retune `MAP_STATUS_TOKENS` so NO status uses a saturated green or red fill. Status meaning is carried by **muted text tone** + the existing dashed/dotted provenance borders. Keep `bg` near-neutral (panel-tinted), `text` a calm tone (e.g. success → muted teal/grey, warning → muted amber, error → muted clay) — legible, not alarming. Preserve all existing `GisStatusKey` members.
2. Export a single radius source of truth for badges (e.g. `MAP_RADIUS.badge = 0`) and ensure `GisStatusChip` uses it (it should already be 0).
3. Create `__tests__/mapBadgePolicy.test.ts` that asserts, by scanning the map source tree:
   - No file under `src/centerpanel/components/map/**` contains an inline `borderRadius: 999`, `9999`, `"50%"`, or `'50%'`. (This test will START RED because of the p03 offenders — that is intended. Mark those offenders as a known allowlist that p03 must empty, OR `it.todo`/`it.fails` with a comment, so CI stays green until p03. Prefer an explicit shrinking allowlist array so p03 deletes entries one-by-one.)
   - `MAP_STATUS_TOKENS` contains no fully-saturated `#0f0`/`#f00`-class fills (assert against a small banned-color list).
4. Run typecheck + the new test + the existing token test.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/mapBadgePolicy.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/mapTokenStatus.test.ts`
- `npm run typecheck`
- `npm run color:guard`
- Save summary → `evidence/p01-trackA.md`.

### Done criteria
- `mapBadgePolicy.test.ts` exists; passes today via an explicit allowlist of the known p03 offenders (which p03 will shrink to zero). `mapTokenStatus.test.ts` and `color:guard` stay green. typecheck clean.

## Track B — Visual
### Steps
1. With the retuned tokens, capture a chip sampler: open a surface that renders several `GisStatusChip` states (e.g. right dock header or a workspace with QA/Workflow/Publish chips).
2. Save `evidence/p01-status-language.png` and compare against `baseline/badges.png`. Confirm the chips read as calm hairline labels, not green/red alarms.

### Verify
- `screenshot-map-explorer` produced `evidence/p01-status-language.png`.

### Done criteria
- Visual diff shows calmer, square, text-toned status chips; no saturated fills.

## Anti-amnesia exit checklist
- LEDGER: p01 A+B → `done`, phase closed, session-log entry with evidence paths and the note "p03 must empty the badge allowlist".
- STATE: `phases[p01]` trackA/trackB `status="done"` + evidence paths.
- Next action → `prompts/p02-badge-right-dock.md`.

## Guardrails
- No Tailwind in centerpanel. No `localStorage`. `exactOptionalPropertyTypes`.
- Token change must keep `GIS_STATUS_KEYS` complete; do not drop a status key.
- Both tracks verified before closing the phase.
