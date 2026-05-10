# SynapseCore Urban Analytics — Research Reproducibility Standards

> **Scope**: All analytical modules producing research-grade output

---

## 1. Reproducibility Requirements

### 1.1 Determinism
- All deterministic methods must produce bit-identical results across runs.
- Stochastic methods (permutation inference, Monte Carlo, k-means++ init) must accept a seed parameter.
- Default seed: not set (true randomness). When a seed is provided, results must be reproducible.

### 1.2 Parameter Serialization
Every analytical run must capture:

```typescript
interface AnalyticalRunRecord {
  /** Unique run identifier */
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Flow or module that produced the result */
  source: string;
  /** Complete parameter set */
  parameters: Record<string, unknown>;
  /** Input data references (dataset IDs, file names, query definitions) */
  inputs: DataReference[];
  /** Method choices and configuration */
  methodConfig: MethodConfig;
  /** Software version */
  version: string;
  /** Duration in milliseconds */
  durationMs: number;
}

interface MethodConfig {
  /** Method name (e.g., "Global Moran's I", "OLS with spatial diagnostics") */
  method: string;
  /** Literature reference */
  reference: string;
  /** Key assumptions or defaults applied */
  assumptions: string[];
  /** Approximations or shortcuts used */
  approximations: string[];
}

interface DataReference {
  /** Dataset identifier or name */
  id: string;
  /** Source type (file, connector, derived) */
  sourceType: 'file' | 'connector' | 'derived';
  /** Row/feature count at time of use */
  featureCount: number;
  /** CRS identifier */
  crs?: string;
  /** Hash of input data for integrity verification */
  contentHash?: string;
}
```

### 1.3 Methodology Metadata
- Every calculator and statistical method must expose a `methodology` descriptor including:
  - Method name and formal reference (author, year, journal)
  - Key assumptions
  - Known limitations
  - Interpretation guidance
- This metadata must be accessible to the UI for display in result panels and report generation.

---

## 2. Export Standards

### 2.1 Result Export
- All analytical results must be exportable as structured JSON.
- GeoJSON results must include statistical fields as feature properties.
- Export must include both raw values and interpretive labels (e.g., cluster type, confidence class).

### 2.2 Pipeline Export
- Multi-step analytical flows must be exportable as a reproducible configuration file.
- The exported configuration must be sufficient to re-run the analysis given the same input data.

### 2.3 Report Export
- PDF reports must include methodology sections with literature citations.
- Data tables must include units, sources, and collection dates.
- Figures must include titles, legends, scale bars, and CRS information.

---

## 3. Provenance Tracking

### 3.1 Lineage Graph
- When data passes through transformations (reproject, join, buffer, aggregate), each step is recorded.
- The lineage graph supports forward tracing (input → output) and backward tracing (output → input).

### 3.2 Version Awareness
- Analytical results should record the platform version that produced them.
- Method implementations should carry a version or revision marker.

---

## 4. Citation Support

### 4.1 Built-in References
All 27 existing calculators and all new statistical methods must include their primary literature reference. These references feed into:
- Report auto-narrative citation insertion
- Methodology cards in the UI
- Bibliography generation

### 4.2 Citation Formats
Supported output formats: APA 7th, Chicago Author-Date, BibTeX, RIS.

---

## 5. Educational Traceability

For planning education use:
- Every analytical step should be explainable: what it does, why, and what the result means.
- Intermediate values (e.g., spatial lag, z-scores, residuals) should be inspectable, not hidden.
- Warnings and diagnostics should use plain language alongside statistical terminology.
