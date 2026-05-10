# Prompt 27 — Academic Report Engine and Citation Layer

Current-state status: implemented  
Updated on: April 24, 2026 during Remediation Prompt 10

## Remediation Prompt 10 - Completion Report

- Scope completed: Closed the report-history gap by promoting Note snapshots and report recent-changes from placeholders into a project-backed review model with persisted snapshots, persisted recent changes, direct report-save provenance, and execution-grade browser validation.
- Key files added or updated: `src/centerpanel/registry/types.ts`; `src/centerpanel/registry/storage.ts`; `src/features/collaboration/projectHistory.ts`; `src/features/collaboration/types.ts`; `src/features/collaboration/engine.ts`; `src/features/collaboration/CollaborationProvider.tsx`; `src/centerpanel/tabs/Note.tsx`; `src/services/reporting/ReportBuilderPanel.tsx`; `src/features/collaboration/__tests__/projectHistory.test.ts`; `src/centerpanel/tabs/__tests__/Note.test.tsx`; `e2e/report-history.spec.ts`.
- User-facing surfaces added or corrected: The Report workspace now saves review snapshots into the selected project, shows a truthful Recent Changes card per report slot, keeps report-save and restore actions visible in project history, and exposes compare-ready snapshot history directly inside the Note workspace instead of leaving the surface as a stub.
- Runtime truthfulness improvements: Report history is now persisted on the urban project model itself, recent-change rows derive from both explicit history events and stored snapshots, legacy timestamp formats are normalized on load, and report-builder actions write durable provenance rather than transient status only.
- Validation performed: `npm test -- src/features/collaboration/__tests__/projectHistory.test.ts src/centerpanel/tabs/__tests__/Note.test.tsx src/services/reporting/__tests__/ReportBuilderPanel.test.tsx`; `npx playwright test e2e/report-history.spec.ts`; `npm run typecheck`; `npm run build`; `npm run test`.
- Residual risks: No Prompt 27-specific report-history gap remains in the current repository state. Broader release residuals outside reporting still remain tracked in the release docs.
