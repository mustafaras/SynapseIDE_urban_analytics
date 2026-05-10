# ADR-0001: Browser-First Analytical Runtime

- Status: Accepted
- Date: April 23, 2026

## Context

The strengthening program pushed the workbench toward research-grade ambition: spatial statistics, indicator synthesis, simulations, map IO, GeoAI, reporting, education, and runtime diagnostics. That breadth becomes fragile if core analytical behavior depends on opaque services or hidden infrastructure that reviewers cannot reproduce locally.

## Decision

The release candidate remains browser-first by default:

- Deterministic analytical engines run locally in TypeScript, WebAssembly, or browser workers where feasible.
- Heavy capabilities are lazy-loaded instead of bundled into the initial application path.
- External services stay behind explicit adapters or connector surfaces and must present visible runtime state to operators.
- Status-critical subsystems publish operational state into user-visible UI surfaces rather than console-only traces.

## Consequences

Positive:

- Reviewers can validate most major features with local commands and the in-app capabilities overview.
- The application can ship a coherent release candidate without requiring a full backend platform.
- Performance and memory tradeoffs remain inspectable because runtime boundaries are explicit.

Negative:

- Some capabilities remain bounded by browser constraints rather than server-side scale.
- Live-provider features still depend on credentials, network reachability, and third-party uptime.
- Advanced GeoAI and streaming modes need explicit risk documentation because local reproducibility and live realism are not always the same thing.
