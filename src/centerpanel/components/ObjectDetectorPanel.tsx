/**
 * ObjectDetectorPanel — interactive UI surface for real-model and demo-mode
 * object detection against the shared EO raster registry.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type DetectedObject,
  type DetectionProgress,
  URBAN_OBJECT_CLASSES,
  type UrbanObjectClass,
} from '@/engine/geoai/cv';
import {
  useObjectDetection,
  type ObjectDetectionExecutionMode,
  type ObjectDetectionRunMetadata,
  type ObjectDetectionRunResult,
} from '@/engine/geoai/hooks';
import {
  buildObjectDetectionPublication,
  summarizeDetections,
} from './objectDetectionPublish';
import { createDemoRasterSource, useEOSourceStore } from '@/services/data/eo';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';
import { useFlowStore } from '@/stores/useFlowStore';

/* ── Class palette ───────────────────────────────────── */

const CLASS_COLORS: Record<UrbanObjectClass, string> = {
  vehicle: '#60A5FA',
  tree: '#34D399',
  swimming_pool: '#22D3EE',
  solar_panel: '#F59E0B',
  construction_site: '#FB7185',
};

const CLASS_LABELS: Record<UrbanObjectClass, string> = {
  vehicle: 'Vehicle',
  tree: 'Tree',
  swimming_pool: 'Swimming pool',
  solar_panel: 'Solar panel',
  construction_site: 'Construction site',
};

/* ── Component ───────────────────────────────────────── */

type RunStatus = 'idle' | 'running' | 'done' | 'error';

const DEFAULT_OVERLAP = 96;
const DEFAULT_NMS_IOU = 0.45;

const PANEL: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid rgba(245, 158, 11, 0.2)',
  padding: '1.25rem',
  color: '#e5e5e5',
  fontSize: '0.78rem',
  lineHeight: 1.4,
};

function formatModeLabel(mode: ObjectDetectionExecutionMode): string {
  return mode === 'real-model' ? 'Real model' : 'Demo mode';
}

function formatSourceModeLabel(isDemoSource: boolean): string {
  return isDemoSource ? 'Demo imagery' : 'Project raster';
}

function formatBackendLabel(backend: ObjectDetectionRunMetadata['backend']): string {
  if (backend === 'demo') {
    return 'Demo synthetic inferrer';
  }
  return backend === 'webgpu' ? 'WebGPU' : 'WASM';
}

function formatThresholdSummary(thresholds: Record<string, number>): string {
  return URBAN_OBJECT_CLASSES.map((className) => {
    const value = thresholds[className];
    return `${CLASS_LABELS[className]} ${value >= 1 ? 'off' : value.toFixed(2)}`;
  }).join(' · ');
}

export const ObjectDetectorPanel: React.FC = () => {
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const openMap = useMapExplorerStore((state) => state.open);
  const upsertCompletedRun = useFlowStore((state) => state.upsertCompletedRun);
  const registrySources = useEOSourceStore((state) => state.sources);
  const selectedEOSourceId = useEOSourceStore((state) => state.selectedSourceId);
  const [selectedClasses, setSelectedClasses] = useState<Set<UrbanObjectClass>>(
    () => new Set(URBAN_OBJECT_CLASSES),
  );
  const [confidence, setConfidence] = useState(0.4);
  const [overlap, setOverlap] = useState(DEFAULT_OVERLAP);
  const [iouThreshold, setIouThreshold] = useState(DEFAULT_NMS_IOU);
  const [executionMode, setExecutionMode] = useState<ObjectDetectionExecutionMode>('real-model');
  const [progress, setProgress] = useState<DetectionProgress | null>(null);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [sourceId, setSourceId] = useState<string>(() => selectedEOSourceId ?? 'demo-raster-bosphorus');
  const [selectedDetection, setSelectedDetection] = useState<DetectedObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const detector = useObjectDetection();
  const demoSource = useMemo(() => createDemoRasterSource(), []);
  const sources = useMemo(() => {
    const byId = new Map<string, ReturnType<typeof createDemoRasterSource>>();
    byId.set(demoSource.id, demoSource);
    registrySources.forEach((source) => {
      byId.set(source.id, source);
    });
    return [...byId.values()].sort((left, right) => {
      if (left.provenance.isDemo && !right.provenance.isDemo) {
        return 1;
      }
      if (!left.provenance.isDemo && right.provenance.isDemo) {
        return -1;
      }
      return left.title.localeCompare(right.title);
    });
  }, [demoSource, registrySources]);

  useEffect(() => {
    if (!sources.some((source) => source.id === sourceId)) {
      setSourceId(selectedEOSourceId ?? demoSource.id);
    }
  }, [demoSource.id, selectedEOSourceId, sourceId, sources]);

  const selectedSource = useMemo(
    () => sources.find((source) => source.id === sourceId) ?? demoSource,
    [demoSource, sourceId, sources],
  );
  const readiness = useMemo(
    () => detector.assessReadiness(selectedSource, executionMode),
    [detector, executionMode, selectedSource],
  );
  const result = detector.result;

  const publishRun = useCallback((run: ObjectDetectionRunResult, runConfidence: number, runClasses: UrbanObjectClass[]) => {
    const publication = buildObjectDetectionPublication({
      detection: run.detection,
      confidenceThreshold: runConfidence,
      selectedClasses: runClasses,
      classColors: CLASS_COLORS,
      classLabels: CLASS_LABELS,
      runMetadata: run.metadata,
    });

    addOverlayLayer(publication.adapted.layer);
    openMap();
    upsertCompletedRun(publication.completedRun);
    setPublishMessage(`${formatModeLabel(run.metadata.executionMode)} detection published from ${run.source.title}. ${publication.publishMessage}`);
  }, [addOverlayLayer, openMap, upsertCompletedRun]);

  const toggleClass = (cls: UrbanObjectClass) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(cls)) next.delete(cls);
      else next.add(cls);
      return next;
    });
  };

  const runDetection = useCallback(async () => {
    if (status === 'running') return;
    setError(null);
    setSelectedDetection(null);
    setPublishMessage(null);
    setStatus('running');
    setProgress(null);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const run = await detector.runDetection({
        source: selectedSource,
        executionMode,
        selectedClasses: Array.from(selectedClasses),
        defaultConfidence: confidence,
        overlap,
        iouThreshold,
        signal: ac.signal,
        onProgress: setProgress,
      });
      publishRun(run, confidence, Array.from(selectedClasses));
      setStatus('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStatus('idle');
        setProgress(null);
      } else {
        setStatus('error');
        const message = (err as Error).message;
        setError(message);
      }
    } finally {
      abortRef.current = null;
    }
  }, [confidence, detector, executionMode, iouThreshold, overlap, publishRun, selectedClasses, selectedSource, status]);

  const cancel = () => {
    abortRef.current?.abort();
  };

  const summary = useMemo(() => {
    if (!result) return null;
    return summarizeDetections(result.detection.detections);
  }, [result]);

  const mapExtent = useMemo(() => {
    if (!result || result.detection.detections.length === 0) return null;
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const d of result.detection.detections) {
      const [w, s, e, n] = d.bbox;
      if (w < minLon) minLon = w;
      if (e > maxLon) maxLon = e;
      if (s < minLat) minLat = s;
      if (n > maxLat) maxLat = n;
    }
    const padLon = (maxLon - minLon) * 0.1 || 0.0001;
    const padLat = (maxLat - minLat) * 0.1 || 0.0001;
    return {
      minLon: minLon - padLon,
      maxLon: maxLon + padLon,
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
    };
  }, [result]);

  const progressPct = progress && progress.totalTiles > 0
    ? Math.round((progress.processedTiles / progress.totalTiles) * 100)
    : 0;

  return (
    <section style={PANEL} aria-labelledby="obj-detector-heading" data-testid="object-detector-panel">
      <header style={{ marginBottom: '0.75rem' }}>
        <h3
          id="obj-detector-heading"
          style={{ color: '#F59E0B', margin: 0, fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.03em' }}
        >
          YOLO-Nano Urban Object Detection
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', margin: '0.25rem 0 0 0' }}>
          Run a real browser-managed detector against imported or EO raster sources when a model is configured,
          or switch to the explicitly labeled Demo mode synthetic fallback.
        </p>
      </header>

      <div style={{ marginBottom: '0.75rem', display: 'grid', gap: 8 }}>
        <div
          style={{
            border: '1px solid rgba(245, 158, 11, 0.22)',
            background: 'rgba(245, 158, 11, 0.06)',
            padding: '0.55rem 0.65rem',
          }}
        >
          <div data-testid="object-detector-mode" style={{ color: '#F59E0B', fontSize: '0.72rem', fontWeight: 700 }}>
            {formatModeLabel(executionMode)} · {formatSourceModeLabel(selectedSource.provenance.isDemo)}
          </div>
          <div data-testid="object-detector-model-status" style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.72rem', marginTop: 4 }}>
            {executionMode === 'real-model'
              ? detector.runtimeConfig.configured
                ? `${detector.runtimeConfig.label} · ${formatBackendLabel(detector.runtimeConfig.preferredBackend)}`
                : detector.runtimeConfig.missingSourceReason
              : 'Demo mode keeps the synthetic inferrer explicit and never presents it as a real model-backed run.'}
          </div>
          <div data-testid="object-detector-readiness" style={{ color: readiness.ready ? '#34D399' : '#FCA5A5', fontSize: '0.7rem', marginTop: 4 }}>
            {readiness.ready
              ? `Ready to run on ${selectedSource.title}.`
              : readiness.reason ?? 'The selected object detection configuration is not ready.'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>Raster source</span>
            <select
              data-testid="object-detector-source-select"
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
              disabled={status === 'running'}
              style={{ background: '#101010', color: '#e5e5e5', border: '1px solid rgba(255,255,255,0.15)', padding: '0.4rem' }}
            >
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>Execution mode</span>
            <select
              data-testid="object-detector-mode-select"
              value={executionMode}
              onChange={(event) => setExecutionMode(event.target.value as ObjectDetectionExecutionMode)}
              disabled={status === 'running'}
              style={{ background: '#101010', color: '#e5e5e5', border: '1px solid rgba(255,255,255,0.15)', padding: '0.4rem' }}
            >
              <option value="real-model">Real model</option>
              <option value="demo-mode">Demo mode</option>
            </select>
          </label>
        </div>
      </div>

      {/* Class selection */}
      <fieldset style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '0.5rem 0.65rem', marginBottom: '0.6rem' }}>
        <legend style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', padding: '0 0.3rem' }}>
          Target classes
        </legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
          {URBAN_OBJECT_CLASSES.map((cls) => {
            const checked = selectedClasses.has(cls);
            return (
              <label key={cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleClass(cls)}
                  disabled={status === 'running'}
                  aria-label={`Detect ${CLASS_LABELS[cls]}`}
                />
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    background: CLASS_COLORS[cls],
                    borderRadius: 2,
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '0.74rem' }}>{CLASS_LABELS[cls]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Confidence slider */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="obj-detector-conf" style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
          Minimum confidence to retain a detection: <span style={{ color: '#F59E0B', fontWeight: 600 }}>{confidence.toFixed(2)}</span>
        </label>
        <input
          id="obj-detector-conf"
          data-testid="object-detector-confidence"
          type="range"
          min={0.1}
          max={0.95}
          step={0.05}
          value={confidence}
          onChange={(e) => setConfidence(parseFloat(e.target.value))}
          disabled={status === 'running'}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '0.75rem' }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>Tile overlap (px)</span>
          <input
            data-testid="object-detector-overlap"
            type="number"
            min={0}
            max={Math.max(0, detector.runtimeConfig.tileSize - 1)}
            step={8}
            value={overlap}
            onChange={(event) => setOverlap(Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0))}
            disabled={status === 'running'}
            style={{ background: '#101010', color: '#e5e5e5', border: '1px solid rgba(255,255,255,0.15)', padding: '0.4rem' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>NMS IoU threshold</span>
          <input
            data-testid="object-detector-iou"
            type="number"
            min={0.05}
            max={0.95}
            step={0.05}
            value={iouThreshold}
            onChange={(event) => setIouThreshold(Number.parseFloat(event.target.value || `${DEFAULT_NMS_IOU}`) || DEFAULT_NMS_IOU)}
            disabled={status === 'running'}
            style={{ background: '#101010', color: '#e5e5e5', border: '1px solid rgba(255,255,255,0.15)', padding: '0.4rem' }}
          />
        </label>
      </div>

      {/* Launch / cancel */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={runDetection}
          data-testid="object-detector-run"
          disabled={status === 'running' || selectedClasses.size === 0 || !readiness.ready}
          style={{
            padding: '0.4rem 0.9rem',
            background: 'rgba(245,158,11,0.15)',
            color: '#F59E0B',
            border: '1px solid rgba(245,158,11,0.5)',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: status === 'running' || selectedClasses.size === 0 || !readiness.ready ? 'not-allowed' : 'pointer',
            borderRadius: 0,
          }}
        >
          {status === 'running' ? 'Running Detection…' : `Start ${formatModeLabel(executionMode)} Run`}
        </button>
        {status === 'running' && (
          <button
            type="button"
            onClick={cancel}
            data-testid="object-detector-cancel"
            style={{
              padding: '0.4rem 0.75rem',
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              borderRadius: 0,
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress */}
      {!!progress && (
        <div style={{ marginBottom: '0.75rem' }} aria-live="polite">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
            <span>
              Tile {progress.processedTiles}/{progress.totalTiles}
            </span>
            <span>
              {progress.rawDetections} raw candidates · {progressPct}%
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 0 }}>
            <div
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: '#F59E0B',
                transition: 'width 0.12s linear',
              }}
            />
          </div>
        </div>
      )}

      {!!error && (
        <div data-testid="object-detector-error" style={{ color: '#FB7185', fontSize: '0.72rem', marginBottom: '0.5rem' }} role="alert">
          {error}
        </div>
      )}

      {!!publishMessage && (
        <div
          data-testid="object-detector-notice"
          style={{
            color: '#34D399',
            fontSize: '0.72rem',
            marginBottom: '0.75rem',
            border: '1px solid rgba(52,211,153,0.28)',
            background: 'rgba(16,185,129,0.08)',
            padding: '0.5rem 0.65rem',
          }}
          role="status"
        >
          {publishMessage}
        </div>
      )}

      {!!result && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <button
            type="button"
            onClick={openMap}
            data-testid="object-detector-open-map"
            style={{
              padding: '0.4rem 0.9rem',
              background: 'rgba(96,165,250,0.12)',
              color: '#93C5FD',
              border: '1px solid rgba(96,165,250,0.35)',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: 0,
            }}
          >
            Open Published Layer
          </button>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', alignSelf: 'center' }}>
            Every completed run updates Map Explorer and Completed Run Review with the published layer, chart summary, detection preview table, and run metadata record.
          </div>
        </div>
      )}

      {!!result && (
        <div
          data-testid="object-detector-run-metadata"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 8,
            marginBottom: '0.85rem',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '0.55rem 0.65rem',
          }}
        >
          <MetricCard label="Execution mode" value={formatModeLabel(result.metadata.executionMode)} />
          <MetricCard label="Model" value={result.metadata.modelId} />
          <MetricCard label="Backend" value={formatBackendLabel(result.metadata.backend)} />
          <MetricCard label="Tile size" value={`${result.metadata.tileSize}px`} />
          <MetricCard label="Overlap" value={`${result.metadata.overlap}px`} />
          <MetricCard label="NMS IoU" value={result.metadata.nmsIouThreshold.toFixed(2)} />
          <MetricCard label="Source raster" value={result.metadata.sourceTitle} />
          <MetricCard label="Source identity" value={`${result.metadata.sourceKind} · ${result.metadata.sourceId}`} />
          <MetricCard label="Confidence thresholds" value={formatThresholdSummary(result.metadata.confidenceThresholds)} />
        </div>
      )}

      {/* Results: map preview + summary + inspector */}
      {!!result && !!mapExtent && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '0.75rem', marginTop: '0.5rem' }}>
          <DetectionMap
            detections={result.detection.detections}
            extent={mapExtent}
            onSelect={setSelectedDetection}
            selectedId={selectedDetection?.id ?? null}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <DetectionSummaryTable counts={summary ?? new Map()} />
            {!!selectedDetection && <DetectionInspector detection={selectedDetection} />}
          </div>
        </div>
      )}

      {!!result && result.detection.detections.length === 0 && (
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
          No objects were retained at this threshold. Lower the confidence filter or widen the class set to inspect weaker candidates.
        </p>
      )}
    </section>
  );
};

export default ObjectDetectorPanel;

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: '0.72rem', color: '#f5f5f5' }}>{value}</div>
  </div>
);

/* ══════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════ */

interface MapExtent {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

const DetectionMap: React.FC<{
  detections: DetectedObject[];
  extent: MapExtent;
  selectedId: string | null;
  onSelect: (d: DetectedObject) => void;
}> = ({ detections, extent, selectedId, onSelect }) => {
  const viewW = 360;
  const viewH = 240;
  const lonRange = extent.maxLon - extent.minLon;
  const latRange = extent.maxLat - extent.minLat;

  const project = (lon: number, lat: number): [number, number] => {
    const px = ((lon - extent.minLon) / lonRange) * viewW;
    const py = ((extent.maxLat - lat) / latRange) * viewH;
    return [px, py];
  };

  return (
    <div
      aria-label="Detection preview map"
      style={{
        background: '#0d0d0d',
        border: '1px solid rgba(245,158,11,0.25)',
        position: 'relative',
      }}
    >
      <svg
        width={viewW}
        height={viewH}
        viewBox={`0 0 ${viewW} ${viewH}`}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        <rect x={0} y={0} width={viewW} height={viewH} fill="#0d0d0d" />
        {detections.map((d) => {
          const [w, s, e, n] = d.bbox;
          const [x1, y1] = project(w, n);
          const [x2, y2] = project(e, s);
          const color = CLASS_COLORS[d.className as UrbanObjectClass] ?? '#D6D3D1';
          const isSelected = d.id === selectedId;
          return (
            <rect
              key={d.id}
              x={Math.min(x1, x2)}
              y={Math.min(y1, y2)}
              width={Math.max(2, Math.abs(x2 - x1))}
              height={Math.max(2, Math.abs(y2 - y1))}
              fill={`${color}22`}
              stroke={color}
              strokeWidth={isSelected ? 2.5 : 1.25}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(d)}
              role="button"
              aria-label={`${d.className} detection at ${d.confidence.toFixed(2)} confidence`}
            >
              <title>{`${d.className} — ${d.confidence.toFixed(2)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          right: 6,
          fontSize: '0.62rem',
          color: 'rgba(255,255,255,0.35)',
          pointerEvents: 'none',
        }}
      >
        {detections.length} retained detections · click a box to inspect
      </div>
    </div>
  );
};

const DetectionSummaryTable: React.FC<{ counts: Map<string, number> }> = ({ counts }) => {
  const rows = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, [, n]) => s + n, 0);
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ padding: '4px 8px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        Detected classes · {total} retained
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.4)' }}>No retained classes</td>
            </tr>
          )}
          {rows.map(([cls, count]) => {
            const color = CLASS_COLORS[cls as UrbanObjectClass] ?? '#D6D3D1';
            return (
              <tr key={cls}>
                <td style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, background: color, display: 'inline-block', borderRadius: 2 }} />
                  {CLASS_LABELS[cls as UrbanObjectClass] ?? cls}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#F59E0B' }}>
                  {count}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const DetectionInspector: React.FC<{ detection: DetectedObject }> = ({ detection }) => {
  const [w, s, e, n] = detection.bbox;
  return (
    <div style={{ border: '1px solid rgba(245,158,11,0.3)', padding: '6px 8px', fontSize: '0.7rem', background: 'rgba(245,158,11,0.05)' }}>
      <div style={{ color: '#F59E0B', fontWeight: 600, marginBottom: 3 }}>
        Selected detection · {CLASS_LABELS[detection.className as UrbanObjectClass] ?? detection.className}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.6)' }}>
        Confidence: <strong style={{ color: '#FAFAF9' }}>{detection.confidence.toFixed(3)}</strong>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
        <div>W: {w.toFixed(6)}°</div>
        <div>S: {s.toFixed(6)}°</div>
        <div>E: {e.toFixed(6)}°</div>
        <div>N: {n.toFixed(6)}°</div>
      </div>
    </div>
  );
};
