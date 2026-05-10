# Prompt 09 — Sentinel Hub Connector

Current-state status: environment-dependent  
Backfilled on: April 23, 2026 during Remediation Prompt 02

## Scope implemented

- Added a typed Sentinel Hub connector for authentication, catalog/process requests, and response normalization.
- Added connector-level tests with mock HTTP coverage.

## Primary repository surfaces

- `src/services/data/connectors/SentinelHubConnector.ts`
- `src/services/data/connectors/__tests__/SentinelHubConnector.test.ts`

## User-facing surfaces

- Sentinel Hub capability is now surfaced in the Toolbox EO connector panel.
- The UI now exposes credential-aware catalog search and process-request controls, explicit external dependency messaging, EO-source publication, and truthful runtime states including `credential-missing`, `failed`, and `ready`.

## Validation evidence available

- `src/services/data/connectors/__tests__/SentinelHubConnector.test.ts`
- `src/centerpanel/Tools/components/__tests__/EOConnectorPanel.test.tsx`
- `e2e/eo-connectors.spec.ts`
- `docs/implementation/remediation-prompt-04-completion.md`
- Repository validation gates in current release docs

## Residual risks

- Successful live use depends on external credentials and upstream service availability.
- Live catalog and raster execution remain environment-dependent even though the operator shell, credential-state messaging, and credential-missing validation path are now present.
