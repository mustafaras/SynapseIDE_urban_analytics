# Prompt 29 — Learning Path Engine and Methodology Explainers

Current-state status: implemented  
Backfilled on: April 23, 2026 during Remediation Prompt 02

## Scope implemented

- Added learning-path state, methodology explainers, explainer navigation, and education workspace integration.

## Primary repository surfaces

- `src/features/education/LearningPathEngine.ts`
- `src/features/education/learningPaths.ts`
- `src/features/education/MethodologyExplainer.tsx`
- `src/features/education/MethodologyInfoButton.tsx`
- `src/features/education/EducationModule.tsx`

## User-facing surfaces

- Education workspace learning paths
- Methodology explainer cards and related navigation

## Validation evidence available

- `e2e/education.spec.ts`
- Education unit tests under `src/features/education/__tests__/`

## Residual risks

- Prompt 29 is materially implemented. Ongoing work should update these surfaces when new explainers or paths are added.
