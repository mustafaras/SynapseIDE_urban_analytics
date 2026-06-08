# TODO Cleanup Checklist (2026-06-08)

Scope: Actionable TODOs identified in source and current release docs.

## Priority 1 - Release-Blocking Documentation TODOs

1. Update RC report claims and TODO statements in [docs/release/map-explorer-p64-rc-report-2026-05-29.md](docs/release/map-explorer-p64-rc-report-2026-05-29.md).
- Lines to revise: 19, 20, 89.
- Action: align text with current implementation status and latest RC evidence.
- Done criteria: no stale TODO claims remain in current release narrative.

2. Cross-check against superseding report before edits.
- Reference: [docs/release/map-explorer-p64-rc-report-2026-05-30.md](docs/release/map-explorer-p64-rc-report-2026-05-30.md).
- Action: ensure 2026-05-29 report is clearly marked historical and non-authoritative for current readiness.
- Done criteria: readers cannot mistake historical TODOs as current release blockers.

## Priority 2 - Source Template TODO Normalization

1. Decide whether scaffold TODO should remain as an intentional prompt.
- File: [src/features/urbanAnalytics/context/codeArtifactRequests.ts](src/features/urbanAnalytics/context/codeArtifactRequests.ts)
- Line: 690.
- Current text: generated snippet includes "// TODO: implement the adapter for the analysis result shape."
- Action options:
  - Keep as-is and document as intentional scaffold guidance.
  - Replace with neutral wording that avoids TODO scanners, e.g. "// Adapter implementation required for the target analysis result shape."
- Done criteria: agreed behavior documented and consistent with repo TODO policy.

## Priority 3 - Archive Mentions (No Code Action)

1. Leave archive TODO legends untouched.
- Files under docs/archive/development-plans/*
- Rationale: historical records, not active implementation backlog.

## Validation After Changes

Run after any edits:

1. npm run typecheck
2. npm run lint:errors

If toolchain is missing locally, record the exact command failures in the release note/ledger for traceability.

## Suggested Ownership

1. Release docs owner: Priority 1
2. Urban Analytics module owner: Priority 2
3. No owner needed: Priority 3 (historical only)
