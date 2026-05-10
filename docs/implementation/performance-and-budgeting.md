# SynapseCore Urban Analytics — Performance & Budgeting Standards

> **Scope**: All computation-intensive modules in the Urban Analytics Strengthening Program

---

## 1. Computation Tiers

| Tier | Feature Count | Latency Target | Execution Strategy |
|------|--------------|----------------|-------------------|
| **Interactive** | < 1,000 | < 200 ms | Main thread |
| **Deferred** | 1,000 – 50,000 | < 2 s | Web Worker |
| **Batch** | 50,000 – 500,000 | < 30 s | Worker + progress callback |
| **Heavy** | > 500,000 | User-acknowledged | Worker + WASM/GPU + cancel support |

---

## 2. Main-Thread Budget

- **Frame budget**: 16 ms per frame (60 fps target).
- **Interaction budget**: 100 ms for UI responses (click, hover, step navigation).
- **No blocking**: Any computation exceeding 50 ms must be offloaded to a Web Worker.

---

## 3. Memory Budgets

| Resource | Budget | Policy |
|----------|--------|--------|
| ONNX model sessions | 500 MB total | LRU eviction when exceeded |
| DuckDB-WASM | 256 MB default | Configurable; warn at 80% |
| Tile cache (IndexedDB) | 200 MB | TTL + LRU eviction |
| In-memory feature collections | 100 MB per dataset | Warn; suggest simplification |
| Web Worker heap | 512 MB per worker | Terminate on OOM |

---

## 4. Worker Architecture

### 4.1 Existing Workers
- `src/workers/hash.worker.ts` — Compute-intensive hashing
- `src/workers/redaction.worker.ts` — Data anonymization
- `src/workers/searchWorker.ts` — Full-text search indexing

### 4.2 Planned Workers
- `src/workers/gwr.worker.ts` — GWR local estimation
- `src/workers/kriging.worker.ts` — Geostatistical interpolation
- `src/workers/simulation.worker.ts` — CA/ABM simulation steps
- `src/workers/inference.worker.ts` — ONNX model inference

### 4.3 Worker Communication Protocol
- Use `postMessage` with typed payloads (discriminated union on `type` field).
- Support `AbortSignal`-compatible cancellation.
- Report progress via incremental messages (`{ type: 'progress', percent: number }`).
- Return structured results (`{ type: 'result', data: T }` or `{ type: 'error', message: string }`).

---

## 5. GPU Compute Rules

- WebGPU is optional; always provide CPU fallback.
- GPU shaders must be validated against CPU reference output.
- Workgroup size default: 16×16 for 2D operations.
- Avoid GPU for datasets < 10,000 elements (overhead exceeds benefit).

---

## 6. Network & I/O Budgets

| Operation | Timeout | Retry Policy |
|-----------|---------|-------------|
| Connector API call | 30 s | 3 retries, exponential backoff (1s, 2s, 4s) |
| STAC search | 15 s | 2 retries |
| COG tile fetch | 10 s | 2 retries |
| ONNX model download | 120 s | 1 retry |
| Sentinel Hub token | 10 s | 2 retries |

---

## 7. Bundle Size Awareness

- New dependencies must be justified by functionality gain.
- Tree-shakeable imports preferred over full-package imports.
- ONNX models are loaded on demand, not bundled.
- WASM modules are lazy-loaded.

---

## 8. Progressive Loading Strategy

- Large feature collections: load simplified geometry first, refine on zoom.
- Raster data: COG tile-level access, not full download.
- 3D tiles: LOD-based refinement by screen-space error.
- Tables: virtual scrolling for > 100 rows.
