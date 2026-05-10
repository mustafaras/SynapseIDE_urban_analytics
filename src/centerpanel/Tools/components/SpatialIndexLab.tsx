import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../../styles/tools.module.css';
import type { ProjectRecord } from '../../registry/types';
import {
  createSpatialIndexWorkerClient,
  createBenchmarkQuerySuite,
  generateSyntheticSpatialRecords,
  supportsSpatialIndexWorker,
  type SpatialIndexBenchmarkSummary,
  type SpatialIndexBoundingBoxQuery,
  type SpatialIndexNearestQuery,
  type SpatialIndexQueryResult,
  SpatialIndexWASM,
} from '@/engine/wasm';
import { useSpatialIndexStore } from '@/stores/useSpatialIndexStore';

const SIZE_OPTIONS = [5000, 20000, 50000] as const;

function formatBackendLabel(backend: 'wasm' | 'javascript'): string {
  return backend === 'wasm' ? 'WASM' : 'JS fallback';
}

function formatStateLabel(state: 'idle' | 'building' | 'ready' | 'querying' | 'fallback' | 'error'): string {
  switch (state) {
    case 'building':
      return 'Building index';
    case 'ready':
      return 'Ready';
    case 'querying':
      return 'Running query';
    case 'fallback':
      return 'Fallback active';
    case 'error':
      return 'Error';
    default:
      return 'Idle';
  }
}

function formatMs(value: number | undefined): string {
  if (value === undefined) {
    return '—';
  }
  return `${value.toFixed(2)} ms`;
}

function resolveSourceBbox(project?: ProjectRecord): readonly [number, number, number, number] {
  if (project?.bbox) {
    return project.bbox;
  }
  return [2.12, 41.35, 2.22, 41.43];
}

function createDefaultBboxQuery(bbox: readonly [number, number, number, number]): SpatialIndexBoundingBoxQuery {
  const [minX, minY, maxX, maxY] = bbox;
  const width = maxX - minX;
  const height = maxY - minY;
  return {
    minX: minX + width * 0.28,
    minY: minY + height * 0.24,
    maxX: minX + width * 0.62,
    maxY: minY + height * 0.58,
    limit: 12,
  };
}

function createDefaultNearestQuery(bbox: readonly [number, number, number, number]): SpatialIndexNearestQuery {
  const [minX, minY, maxX, maxY] = bbox;
  const width = maxX - minX;
  const height = maxY - minY;
  return {
    x: minX + width * 0.51,
    y: minY + height * 0.47,
    maxResults: 8,
    maxDistance: Math.max(width, height) * 0.18,
  };
}

const metricCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  minHeight: 74,
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid color-mix(in srgb, var(--ui-border) 78%, var(--syn-accent-primary) 22%)',
  background: 'linear-gradient(180deg, color-mix(in srgb, var(--ui-card-bg) 92%, var(--syn-accent-primary) 8%), color-mix(in srgb, var(--ui-card-bg) 96%, var(--syn-bg-root) 4%))',
};

type QuerySectionProps = {
  title: string;
  subtitle: string;
  result: SpatialIndexQueryResult<{ cluster: number; synthetic: true }> | undefined;
  emptyText: string;
  showDistance?: boolean;
};

const QuerySection: React.FC<QuerySectionProps> = ({ title, subtitle, result, emptyText, showDistance = false }) => (
  <section className={`${styles.callout} ${styles.calloutInfo}`} style={{ display: 'grid', gap: 10 }}>
    <div className={styles.calloutHeader}>
      <div className={styles.calloutTitle}>{title}</div>
      <div className={styles.calloutMeta}>{subtitle}</div>
    </div>
    <div className={styles.calloutBody}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
        <div className={styles.metric} style={metricCardStyle}>
          <div className={styles.metricLabel}>Backend</div>
          <div className={styles.metricValue}>{result ? formatBackendLabel(result.timing.backend) : '—'}</div>
        </div>
        <div className={styles.metric} style={metricCardStyle}>
          <div className={styles.metricLabel}>Latency</div>
          <div className={styles.metricValue}>{result ? formatMs(result.timing.elapsedMs) : '—'}</div>
        </div>
        <div className={styles.metric} style={metricCardStyle}>
          <div className={styles.metricLabel}>Candidates</div>
          <div className={styles.metricValue}>{result ? result.timing.candidateCount.toLocaleString() : '—'}</div>
        </div>
        <div className={styles.metric} style={metricCardStyle}>
          <div className={styles.metricLabel}>Results</div>
          <div className={styles.metricValue}>{result ? result.hits.length.toLocaleString() : '—'}</div>
        </div>
      </div>
      {result && result.hits.length > 0 ? (
        <div className={styles.tableScroll}>
          <table className={`${styles.tableV2} ${styles.rowZebra}`}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Record</th>
                <th style={{ textAlign: 'right' }}>Centroid X</th>
                <th style={{ textAlign: 'right' }}>Centroid Y</th>
                <th style={{ textAlign: 'right' }}>Cluster</th>
                {showDistance ? <th style={{ textAlign: 'right' }}>Distance</th> : null}
              </tr>
            </thead>
            <tbody>
              {result.hits.map((hit) => (
                <tr key={hit.id}>
                  <td>{hit.id}</td>
                  <td style={{ textAlign: 'right' }}>{hit.centroidX.toFixed(5)}</td>
                  <td style={{ textAlign: 'right' }}>{hit.centroidY.toFixed(5)}</td>
                  <td style={{ textAlign: 'right' }}>{hit.properties?.cluster ?? '—'}</td>
                  {showDistance ? <td style={{ textAlign: 'right' }}>{hit.distance?.toFixed(5) ?? '—'}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`${styles.meta} ${styles.metaBlock}`}>{emptyText}</div>
      )}
    </div>
  </section>
);

const SpatialIndexLab: React.FC<{ project: ProjectRecord | undefined }> = ({ project }) => {
  const enableWasm = useSpatialIndexStore((state) => state.enableWasm);
  const setEnableWasm = useSpatialIndexStore((state) => state.setEnableWasm);
  const runtimeState = useSpatialIndexStore((state) => state.state);
  const runtimeBackend = useSpatialIndexStore((state) => state.backend);
  const runtimeRecords = useSpatialIndexStore((state) => state.records);
  const runtimeLastSpeedup = useSpatialIndexStore((state) => state.lastSpeedup);
  const runtimeFallbackReason = useSpatialIndexStore((state) => state.fallbackReason);
  const updateRuntime = useSpatialIndexStore((state) => state.updateRuntime);
  const reportQuery = useSpatialIndexStore((state) => state.reportQuery);
  const reportBenchmark = useSpatialIndexStore((state) => state.reportBenchmark);
  const reportError = useSpatialIndexStore((state) => state.reportError);

  const [datasetSize, setDatasetSize] = useState<(typeof SIZE_OPTIONS)[number]>(20000);
  const [datasetSeed, setDatasetSeed] = useState(33);
  const [refreshToken, setRefreshToken] = useState(0);
  const [buildMessage, setBuildMessage] = useState('');
  const [buildInfo, setBuildInfo] = useState<{ buildMs: number; bucketCount: number; leafSize: number } | null>(null);
  const [bboxResult, setBboxResult] = useState<SpatialIndexQueryResult<{ cluster: number; synthetic: true }> | undefined>(undefined);
  const [nearestResult, setNearestResult] = useState<SpatialIndexQueryResult<{ cluster: number; synthetic: true }> | undefined>(undefined);
  const [benchmark, setBenchmark] = useState<SpatialIndexBenchmarkSummary | undefined>(undefined);
  const [index, setIndex] = useState<SpatialIndexWASM<{ cluster: number; synthetic: true }> | null>(null);
  const [workerState, setWorkerState] = useState<'idle' | 'building' | 'ready' | 'error'>('idle');
  const [workerMessage, setWorkerMessage] = useState('Worker bridge not initialised.');
  const [workerBackend, setWorkerBackend] = useState<'wasm' | 'javascript'>('javascript');
  const [workerRoundtripMs, setWorkerRoundtripMs] = useState<number | undefined>(undefined);
  const workerRef = useRef<ReturnType<typeof createSpatialIndexWorkerClient> | null>(null);

  const sourceBbox = useMemo(() => resolveSourceBbox(project), [project?.bbox, project?.id]);
  const sourceBboxKey = sourceBbox.join('|');
  const dataset = useMemo(
    () => generateSyntheticSpatialRecords({ size: datasetSize, bbox: sourceBbox, seed: datasetSeed }),
    [datasetSeed, datasetSize, sourceBboxKey],
  );
  const bboxQuery = useMemo(() => createDefaultBboxQuery(sourceBbox), [sourceBboxKey]);
  const nearestQuery = useMemo(() => createDefaultNearestQuery(sourceBbox), [sourceBboxKey]);

  useEffect(() => {
    let disposed = false;

    async function buildIndex() {
      updateRuntime({
        state: 'building',
        backend: enableWasm ? 'wasm' : 'javascript',
        records: dataset.length,
        fallbackReason: undefined,
      });
      setBuildMessage('Preparing kd-partitioned records and selecting the active query backend.');
      setBenchmark(undefined);

      try {
        const nextIndex = await SpatialIndexWASM.create(dataset, {
          preferredBackend: enableWasm ? 'wasm' : 'javascript',
          leafSize: 64,
        });
        if (disposed) {
          return;
        }

        setIndex(nextIndex);
        setBuildInfo({
          buildMs: nextIndex.buildInfo.buildMs,
          bucketCount: nextIndex.buildInfo.bucketCount,
          leafSize: nextIndex.buildInfo.leafSize,
        });

        const capability = nextIndex.getCapability();
        const initialBboxResult = nextIndex.queryBoundingBox(bboxQuery);
        const initialNearestResult = nextIndex.queryNearest(nearestQuery);

        setBboxResult(initialBboxResult);
        setNearestResult(initialNearestResult);
        setBuildMessage(capability.usingFallback
          ? `WASM kernel was requested but the session fell back to JavaScript. ${capability.fallbackReason ?? ''}`.trim()
          : 'WASM kernel is active. Bbox and nearest-neighbor timings below are measured against the selected project extent.');

        reportQuery({
          backend: capability.resolvedBackend,
          records: dataset.length,
          elapsedMs: initialBboxResult.timing.elapsedMs,
          kind: 'bbox',
          resultCount: initialBboxResult.hits.length,
          state: capability.usingFallback ? 'fallback' : 'ready',
          fallbackReason: capability.fallbackReason,
        });
      } catch (error) {
        if (disposed) {
          return;
        }
        setIndex(null);
        setBuildInfo(null);
        setBuildMessage(error instanceof Error ? error.message : 'Spatial index build failed.');
        reportError(error instanceof Error ? error.message : 'Spatial index build failed.');
      }
    }

    void buildIndex();
    return () => {
      disposed = true;
    };
  }, [bboxQuery, dataset, enableWasm, nearestQuery, refreshToken, reportError, reportQuery, updateRuntime]);

  useEffect(() => {
    let disposed = false;

    async function buildWorkerProbe() {
      if (!supportsSpatialIndexWorker()) {
        setWorkerState('error');
        setWorkerBackend('javascript');
        setWorkerMessage('Dedicated worker support is unavailable in this runtime.');
        return;
      }

      const client = createSpatialIndexWorkerClient();
      workerRef.current?.terminate();
      workerRef.current = client;
      setWorkerState('building');
      setWorkerMessage('Building worker-owned spatial index and validating asynchronous query path.');

      try {
        const t0 = performance.now();
        const build = await client.build(dataset, {
          preferredBackend: enableWasm ? 'wasm' : 'javascript',
          leafSize: 64,
        });
        const probe = await client.queryBoundingBox(bboxQuery);
        if (disposed) {
          client.terminate();
          return;
        }

        const capability = build.capability;
        setWorkerState('ready');
        setWorkerBackend(capability.resolvedBackend);
        setWorkerRoundtripMs(performance.now() - t0);
        setWorkerMessage(
          capability.usingFallback
            ? `Worker bridge is operational with JavaScript fallback. ${capability.fallbackReason ?? ''}`.trim()
            : `Worker bridge is operational on WASM with ${probe.hits.length} bbox hits in the validation probe.`,
        );
      } catch (error) {
        if (disposed) {
          client.terminate();
          return;
        }
        setWorkerState('error');
        setWorkerBackend(enableWasm ? 'wasm' : 'javascript');
        setWorkerMessage(error instanceof Error ? error.message : 'Worker probe failed.');
      }
    }

    void buildWorkerProbe();
    return () => {
      disposed = true;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [bboxQuery, dataset, enableWasm, refreshToken]);

  const runBboxQuery = () => {
    if (!index) {
      return;
    }
    const result = index.queryBoundingBox(bboxQuery);
    const capability = index.getCapability();
    setBboxResult(result);
    reportQuery({
      backend: capability.resolvedBackend,
      records: dataset.length,
      elapsedMs: result.timing.elapsedMs,
      kind: 'bbox',
      resultCount: result.hits.length,
      state: capability.usingFallback ? 'fallback' : 'ready',
      fallbackReason: capability.fallbackReason,
    });
  };

  const runNearestQuery = () => {
    if (!index) {
      return;
    }
    const result = index.queryNearest(nearestQuery);
    const capability = index.getCapability();
    setNearestResult(result);
    reportQuery({
      backend: capability.resolvedBackend,
      records: dataset.length,
      elapsedMs: result.timing.elapsedMs,
      kind: 'nearest',
      resultCount: result.hits.length,
      state: capability.usingFallback ? 'fallback' : 'ready',
      fallbackReason: capability.fallbackReason,
    });
  };

  const runBenchmark = () => {
    if (!index) {
      return;
    }
    const snapshot = index.benchmark(createBenchmarkQuerySuite(sourceBbox, datasetSeed + 9));
    setBenchmark(snapshot);
    reportBenchmark({
      datasetSize: snapshot.datasetSize,
      baselineMs: snapshot.baselineMs,
      backendMs: snapshot.backendMs,
      speedup: snapshot.speedup,
      queryCount: snapshot.queryCount,
    }, snapshot.backend, dataset.length);
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className={`${styles.callout} ${styles.calloutSuccess}`}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Active backend</div>
          <div className={styles.calloutMeta}>{formatStateLabel(runtimeState)} · {formatBackendLabel(runtimeBackend)}</div>
        </div>
        <div className={styles.calloutBody} style={{ display: 'grid', gap: 10 }}>
          <div className={styles.meta}>{buildMessage}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Records</div>
              <div className={styles.metricValue}>{(runtimeRecords || dataset.length).toLocaleString()}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Leaves</div>
              <div className={styles.metricValue}>{buildInfo?.bucketCount.toLocaleString() ?? '—'}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Build time</div>
              <div className={styles.metricValue}>{buildInfo ? formatMs(buildInfo.buildMs) : '—'}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Last speedup</div>
              <div className={styles.metricValue}>{runtimeLastSpeedup ? `${runtimeLastSpeedup.toFixed(2)}×` : '—'}</div>
            </div>
          </div>
          <div className={`${styles.callout} ${workerState === 'error' ? styles.calloutWarn : styles.calloutInfo}`}>
            <div className={styles.calloutHeader}>
              <div className={styles.calloutTitle}>Worker bridge</div>
              <div className={styles.calloutMeta}>
                {workerState.toUpperCase()} · {formatBackendLabel(workerBackend)}
              </div>
            </div>
            <div className={styles.calloutBody}>
              <div className={styles.meta}>{workerMessage}</div>
              <div className={styles.meta}>
                Last worker round-trip: {formatMs(workerRoundtripMs)}
              </div>
            </div>
          </div>
          <div className={styles.hstack}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={enableWasm}
                onChange={(event) => setEnableWasm(event.target.checked)}
              />
              Prefer WASM backend for spatial bbox and nearest queries
            </label>
            <span className={`${styles.meta} ${styles.metaTiny}`}>This preference is also mirrored in Advanced Settings.</span>
          </div>
          {runtimeFallbackReason ? <div className={styles.metaWarn}>{runtimeFallbackReason}</div> : null}
        </div>
      </div>

      <section className={`${styles.callout} ${styles.calloutInfo}`} style={{ display: 'grid', gap: 10 }}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Dataset and query controls</div>
          <div className={styles.calloutMeta}>{project?.name ?? 'Benchmark demo extent'}</div>
        </div>
        <div className={styles.calloutBody} style={{ display: 'grid', gap: 12 }}>
          <div className={styles.hstack}>
            {SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                className={styles.segBtn}
                aria-pressed={datasetSize === size}
                onClick={() => setDatasetSize(size)}
              >
                {size.toLocaleString()} records
              </button>
            ))}
            <button type="button" className={styles.segBtn} onClick={() => setDatasetSeed((value) => value + 1)}>
              Reseed dataset
            </button>
            <button type="button" className={styles.segBtn} onClick={() => setRefreshToken((value) => value + 1)}>
              Rebuild index
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <div className={styles.meta}>
              <strong>Study extent:</strong> [{sourceBbox.map((value) => value.toFixed(4)).join(', ')}]
            </div>
            <div className={styles.meta}>
              <strong>Default bbox query:</strong> [{bboxQuery.minX.toFixed(4)}, {bboxQuery.minY.toFixed(4)}, {bboxQuery.maxX.toFixed(4)}, {bboxQuery.maxY.toFixed(4)}]
            </div>
            <div className={styles.meta}>
              <strong>Nearest probe:</strong> {nearestQuery.x.toFixed(4)}, {nearestQuery.y.toFixed(4)}
            </div>
            <div className={styles.meta}>
              <strong>Leaf size:</strong> {buildInfo?.leafSize ?? 64} records per terminal bucket
            </div>
          </div>
          <div className={styles.hstack}>
            <button type="button" className={styles.segBtn} onClick={runBboxQuery} disabled={!index}>
              Run bbox query
            </button>
            <button type="button" className={styles.segBtn} onClick={runNearestQuery} disabled={!index}>
              Run nearest query
            </button>
            <button type="button" className={styles.segBtn} onClick={runBenchmark} disabled={!index}>
              Benchmark vs JS baseline
            </button>
          </div>
        </div>
      </section>

      <QuerySection
        title="Bounding-box prefilter"
        subtitle={`Query latency ${formatMs(bboxResult?.timing.elapsedMs)} · ${bboxResult?.hits.length ?? 0} hits`}
        result={bboxResult}
        emptyText="Run the bbox query to inspect intersecting synthetic parcels inside the active study extent."
      />

      <QuerySection
        title="Nearest-neighbor lookup"
        subtitle={`Query latency ${formatMs(nearestResult?.timing.elapsedMs)} · ${nearestResult?.hits.length ?? 0} candidates retained`}
        result={nearestResult}
        emptyText="Run the nearest query to rank the closest indexed features around the probe point."
        showDistance
      />

      <section className={`${styles.callout} ${benchmark?.consistent ? styles.calloutSuccess : styles.calloutWarn}`} style={{ display: 'grid', gap: 10 }}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Benchmark ledger</div>
          <div className={styles.calloutMeta}>{benchmark ? `${benchmark.queryCount} queries` : 'Not run yet'}</div>
        </div>
        <div className={styles.calloutBody}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Baseline</div>
              <div className={styles.metricValue}>{benchmark ? formatMs(benchmark.baselineMs) : '—'}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Backend</div>
              <div className={styles.metricValue}>{benchmark ? formatMs(benchmark.backendMs) : '—'}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Speedup</div>
              <div className={styles.metricValue}>{benchmark ? `${benchmark.speedup.toFixed(2)}×` : '—'}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Bbox split</div>
              <div className={styles.metricValue}>{benchmark ? `${benchmark.bboxBaselineMs.toFixed(1)} / ${benchmark.bboxBackendMs.toFixed(1)}` : '—'}</div>
            </div>
            <div className={styles.metric} style={metricCardStyle}>
              <div className={styles.metricLabel}>Consistency</div>
              <div className={styles.metricValue}>{benchmark ? (benchmark.consistent ? 'Verified' : 'Mismatch') : '—'}</div>
            </div>
          </div>
          <div className={`${styles.meta} ${styles.metaBlock}`}>
            Benchmark compares the active backend against a deterministic JavaScript brute-force baseline over the same bbox and nearest-neighbor query suite. This panel is intended to expose whether index construction is materially reducing candidate scans for later map, geometry, and raster workflows.
          </div>
        </div>
      </section>
    </div>
  );
};

export default SpatialIndexLab;
