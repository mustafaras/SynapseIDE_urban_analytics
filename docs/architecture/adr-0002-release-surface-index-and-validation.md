# ADR-0002: Release Surface Index and Explicit Validation Stack

- Status: Accepted
- Date: April 23, 2026

## Context

By Prompt 42, major capabilities existed across tabs, workflows, runtime labs, reporting, education, dashboards, and Map Explorer. The risk was no longer "missing features"; it was hidden features, partial validation, and release review that depended on team memory instead of an observable product path.

## Decision

The release candidate adopts two complementary rules:

1. The application must expose an in-product feature index.
   - Implemented as `Toolbox -> Capabilities Overview`.
   - It links every major workspace tab, toolbox surface, and guided workflow.
2. Validation must be split into named, reviewable gates.
   - Type safety, lint integrity, unit/integration tests, build integrity, bundle budgets, smoke E2E, accessibility E2E, and remaining functional E2E are separate checks.
   - `npm run validate:rc` is the local aggregation command for the full release gate.

## Consequences

Positive:

- Internal reviewers can navigate the whole release candidate without hidden entry points.
- CI output is easier to interpret because smoke, accessibility, and general functional regressions are not conflated.
- Release documentation can point to concrete UI surfaces instead of relying on source-tree archaeology.

Negative:

- The toolbox now carries additional release-review responsibility and must stay curated as new surfaces are added.
- Smoke coverage grows with the flow library and requires maintenance when flow IDs or tab names change.
