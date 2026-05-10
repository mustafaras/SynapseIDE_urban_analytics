# Prompt 14 — Natural Language to Spatial SQL: Completion Report

**Status**: IMPLEMENTED WITH RESIDUAL GAP  
**Date**: 2025-07-24  
**Updated**: 2026-04-24  
**Validation Gate**: ALL PASS  

---

## Scope Completed

Hardened the existing Natural Language → Spatial SQL pipeline with critical security fixes, advanced injection detection, structured interpretation metadata for UI display, and an expanded golden test suite (87 tests). The module converts free-form English queries into read-only DuckDB Spatial SQL using a deterministic rule-based pipeline (no LLM dependency) that is fully reproducible and auditable.

The GeoAI Lab remediation now also executes accepted NL-to-SQL queries against live project layers and imported worker-backed spatial tables in SpatialDB, preserves an explicit demo mode, publishes geometry-bearing results to Map Explorer and completed-run review, and rejects unavailable or mutating requests without silently swapping to demo data.

## Key Files Added or Updated

| File | Action | Purpose |
|------|--------|---------|
| `src/engine/geoai/nlp/types.ts` | Modified | Added `InterpretationDetail` interface; added `interpretation` field to `GeneratedSQL` |
| `src/engine/geoai/nlp/QueryToSQL.ts` | Modified | Raw input security validation (Stage 1), UNION/hex/catalog injection patterns, `buildInterpretation()` metadata builder, template literal cleanup |
| `src/engine/geoai/nlp/index.ts` | Unchanged | Barrel export — already correct |
| `src/engine/geoai/nlp/__tests__/QueryToSQL.test.ts` | Modified | Fixed golden test safety assertions, added 13 new tests (5 security + 8 interpretation metadata) |
| `src/centerpanel/Tools/components/GeoAILab.tsx` | Modified | Added explicit live-versus-demo query mode, worker-backed import inspection, schema-aware missing-field messaging, SpatialDB execution, result publication, and review persistence |
| `src/engine/spatial-db/SpatialDB.ts` | Modified | Added table inspection plus safe alias binding for worker-backed imports and retained schema-aware GeoJSON export |
| `src/engine/spatial-db/hooks/useSpatialDB.ts` | Modified | Exposed live table inspection and alias binding through the React hook surface |
| `src/engine/spatial-db/__tests__/SpatialDB.test.ts` | Added | Added focused tests for table inspection and alias binding |
| `src/centerpanel/Tools/components/__tests__/GeoAILab.test.tsx` | Modified | Added worker-backed live-query, missing-field, and safe-rejection coverage |
| `e2e/geoai-real-data.spec.ts` | Modified | Added end-to-end coverage for live seeded-layer publication and explicit rejection |

## Analytical Methods Implemented

### Pipeline Architecture

Four-stage deterministic pipeline:

1. **Stage 1 — Raw Input Validation**: NL-safe regex patterns detect mutating intent (DELETE, INSERT, DROP, ALTER, TRUNCATE, etc.) in the user's natural language input *before* any SQL generation occurs. Patterns are tuned to avoid false positives on common English verbs (e.g. "create a buffer" is **not** rejected).

2. **Stage 2 — Parsing**: `normalise()` → `tokenize()` (stop-word removal) → `extractEntities()` (layers, attributes, distances, thresholds, limits, aggregation functions, spatial relations) → `classifyIntent()` (9 intent categories).

3. **Stage 3 — SQL Generation**: Intent-specific template rendering producing read-only `SELECT` statements with DuckDB spatial functions.

4. **Stage 4 — Generated SQL Validation**: Defence-in-depth sandbox check on the generated SQL (mutating keywords, comments, multi-statement, table whitelist, subquery control, UNION injection, hex bypass, system catalog probing).

### Intent Categories

| Intent | Spatial Function(s) | Example |
|--------|---------------------|---------|
| proximity | `ST_DWithin` | "Buildings within 500m of parks" |
| accessibility | `ST_DWithin` | "Areas accessible to schools within 1km" |
| aggregation | `GROUP BY` + agg fn | "Average population per neighbourhood" |
| filter | `WHERE` clause | "Parcels with density > 50" |
| hotspot | `NTILE` | "Crime hotspot areas" |
| ranking | `ORDER BY` + `LIMIT` | "Top 10 buildings by height" |
| spatial_join | `ST_Intersects` / `ST_Overlaps` | "Buildings intersecting flood zones" |
| buffer | `ST_Buffer` | "Buffer of 500m around schools" |
| containment | `ST_Within` / `ST_Contains` | "Parks within district boundaries" |

### Entity Extraction

Regex-based extraction with alias normalisation:

- **Layers**: 21+ aliases → canonical names (buildings, parks, roads, schools, etc.)
- **Attributes**: 21+ aliases → canonical names (population, height, area, density, etc.)
- **Distances**: metres, km, miles with unit conversion
- **Thresholds**: `>`, `>=`, `<`, `<=`, `=` operators with numeric values
- **Limits**: "top N", "first N" patterns
- **Aggregation functions**: avg, sum, count, min, max
- **Spatial relations**: intersect, overlap, cross, touch, contain, within

### Security Model

Two-layer defence:

$$\text{safe} = \text{rawInputCheck}(q) \wedge \text{sandboxCheck}(\text{generatedSQL})$$

**Raw input patterns** (NL-safe — avoids English verb false positives):
- `RAW_INPUT_KEYWORDS`: `/\b(DELETE|INSERT|DROP|ALTER|TRUNCATE|MERGE|GRANT|REVOKE|EXEC|EXECUTE)\b/i`
- `RAW_INPUT_MUTATION`: Structured patterns like `UPDATE\s+\w+\s+SET`, `ATTACH\s+`, `PRAGMA\s+`

**Sandbox patterns** (applied to generated SQL):
- `MUTATING_KEYWORDS`: Full SQL keyword set including CREATE, UPDATE, COPY, LOAD, etc.
- `UNION_INJECTION`: `/\bUNION\s+(ALL\s+)?SELECT\b/i`
- `HEX_BYPASS`: `/0x[0-9a-fA-F]{2,}/`
- `SYSTEM_PROBE`: `/\b(information_schema|pg_catalog|sqlite_master|duckdb_)\b/i`

### Interpretation Metadata

`InterpretationDetail` provides structured decomposition for UI display:

```typescript
interface InterpretationDetail {
  classifiedIntent: QueryIntent;
  intentConfidence: 'high' | 'medium' | 'low';
  recognisedLayers: string[];
  recognisedAttributes: string[];
  distancesDetected: { value: number; unit: string }[];
  thresholdsDetected: { operator: string; value: number }[];
  aggregationFunctions: string[];
  spatialRelations: string[];
}
```

## Validation Performed

| Check | Result |
|-------|--------|
| `npx vitest run src/engine/geoai/nlp/` | **87 / 87 tests pass** |
| `npm exec vitest run src/centerpanel/Tools/components/__tests__/GeoAILab.test.tsx src/engine/spatial-db/__tests__/SpatialDB.test.ts` | **8 / 8 tests pass** |
| `npm run test:e2e -- e2e/geoai-real-data.spec.ts` | **4 / 4 tests pass** |
| `npx tsc --noEmit` | **Clean** — 0 errors |
| `npx eslint src/engine/geoai/nlp/` | **Clean** — 0 errors, 0 warnings |

### Test Coverage Breakdown

| Section | Tests |
|---------|-------|
| normalise | 2 |
| tokenize | 1 |
| extractEntities | 9 |
| classifyIntent | 7 |
| parseQuery | 3 |
| validateSandbox | 7 |
| isSafeSQL | 2 |
| Golden test suite (35 pairs + count check) | 36 |
| Edge cases | 7 |
| Advanced security patterns | 5 |
| Interpretation metadata | 8 |
| **Total** | **87** |

## Known Limitations

1. **Rule-based only**: No LLM fallback — unrecognised phrasing produces `unknown` intent with a warning. This is by design for reproducibility.
2. **English only**: Entity aliases and intent keywords are English. i18n would require locale-specific pattern sets.
3. **Fixed layer vocabulary**: 21 layer aliases are hard-coded. New datasets require adding aliases to `LAYER_ALIASES` or explicit alias binding in the GeoAI Lab live catalog.
4. **Project context still governs live scope**: Live SQL targets datasets already present in the sandboxed project context, including project overlays and imported worker-backed spatial tables. It does not automatically federate every possible project dataset, remote catalog, or non-queryable layer; remote catalogs still need an explicit import or publication step before they become query tables.
5. **No spatial function composition**: Cannot chain multiple spatial operations in a single query (e.g. "buffer then intersect").

## Follow-Up Recommended

- **Prompt 15+**: Build the Query Builder UI panel that surfaces `InterpretationDetail` — show classified intent, recognised entities, and confidence level as the user types.
- Consider adding fuzzy matching for layer/attribute names to handle typos.
- Add telemetry logging for `unknown` intent queries to discover missing patterns.
