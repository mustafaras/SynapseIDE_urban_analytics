import React, { useCallback, useMemo, useState } from 'react';
import * as turf from '@turf/turf';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DrawMode = 'point' | 'line' | 'polygon' | 'rectangle' | 'circle' | null;

export interface DrawnFeature {
  id: string;
  geometry: GeoJSON.Geometry;
  measurement: string;
}

export interface DrawingToolsProps {
  /** Call with null to indicate active mode changed (for cursor) */
  onModeChange?: (mode: DrawMode) => void;
  /** Emitted when a feature is completed */
  onFeatureComplete?: (feature: DrawnFeature) => void;
  /** All drawn features so far */
  features?: DrawnFeature[];
  /** Clear all features */
  onClear?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let _fid = 0;
function nextId(): string {
  return `draw_${++_fid}`;
}

function formatArea(m2: number): string {
  if (m2 >= 1e6) return `${(m2 / 1e6).toFixed(2)} km²`;
  return `${m2.toFixed(0)} m²`;
}

function formatLength(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m.toFixed(0)} m`;
}

function measureGeometry(geom: GeoJSON.Geometry): string {
  try {
    switch (geom.type) {
      case 'Point':
        return `${(geom.coordinates as number[])[1].toFixed(5)}, ${(geom.coordinates as number[])[0].toFixed(5)}`;
      case 'LineString': {
        const line = turf.lineString(geom.coordinates as number[][]);
        return formatLength(turf.length(line, { units: 'meters' }));
      }
      case 'Polygon': {
        const poly = turf.polygon(geom.coordinates as number[][][]);
        return formatArea(turf.area(poly));
      }
      default:
        return '';
    }
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
  toolbar: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 2,
    background: 'rgba(26,26,26,0.92)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: 3,
    zIndex: 6,
  },
  btn: {
    padding: '5px 10px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 4,
    color: '#ccc',
    fontSize: 12,
    cursor: 'pointer',
  },
  btnActive: {
    background: 'rgba(245,166,35,0.15)',
    border: '1px solid rgba(245,166,35,0.4)',
    color: '#f5a623',
  },
  featureList: {
    position: 'absolute',
    bottom: 36,
    left: 10,
    background: 'rgba(26,26,26,0.92)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: 6,
    maxHeight: 180,
    overflowY: 'auto',
    zIndex: 6,
    minWidth: 180,
  },
  featureRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
    fontSize: 11,
    color: '#bbb',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
};

const MODES: { mode: DrawMode; label: string; icon: string }[] = [
  { mode: 'point', label: 'Point', icon: '●' },
  { mode: 'line', label: 'Line', icon: '╱' },
  { mode: 'polygon', label: 'Polygon', icon: '⬠' },
  { mode: 'rectangle', label: 'Rect', icon: '▭' },
  { mode: 'circle', label: 'Circle', icon: '◯' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const DrawingTools: React.FC<DrawingToolsProps> = ({
  onModeChange,
  onFeatureComplete,
  features = [],
  onClear,
}) => {
  const [activeMode, setActiveMode] = useState<DrawMode>(null);
  const [vertices, setVertices] = useState<[number, number][]>([]);

  const toggle = useCallback(
    (mode: DrawMode) => {
      const next = activeMode === mode ? null : mode;
      setActiveMode(next);
      setVertices([]);
      onModeChange?.(next);
    },
    [activeMode, onModeChange],
  );

  /** Accept a map-click coordinate [lon, lat] */
  const addVertex = useCallback(
    (coord: [number, number]) => {
      if (!activeMode) return;

      if (activeMode === 'point') {
        const geom: GeoJSON.Geometry = { type: 'Point', coordinates: coord };
        onFeatureComplete?.({
          id: nextId(),
          geometry: geom,
          measurement: measureGeometry(geom),
        });
        return;
      }

      const next = [...vertices, coord];
      setVertices(next);

      // Rectangle closes after 2 clicks (diagonals)
      if (activeMode === 'rectangle' && next.length === 2) {
        const [a, b] = next;
        const geom: GeoJSON.Geometry = {
          type: 'Polygon',
          coordinates: [
            [a, [b[0], a[1]], b, [a[0], b[1]], a],
          ],
        };
        onFeatureComplete?.({
          id: nextId(),
          geometry: geom,
          measurement: measureGeometry(geom),
        });
        setVertices([]);
        return;
      }

      // Circle closes after 2 clicks (center + edge)
      if (activeMode === 'circle' && next.length === 2) {
        const [c, edge] = next;
        const from = turf.point(c);
        const to = turf.point(edge);
        const radius = turf.distance(from, to, { units: 'meters' });
        const circle = turf.circle(c, radius, { units: 'meters', steps: 64 });
        const geom = circle.geometry;
        onFeatureComplete?.({
          id: nextId(),
          geometry: geom,
          measurement: formatArea(turf.area(circle)),
        });
        setVertices([]);
      }
    },
    [activeMode, vertices, onFeatureComplete],
  );

  /** Double-click to finish line/polygon */
  const finishDrawing = useCallback(() => {
    if (activeMode === 'line' && vertices.length >= 2) {
      const geom: GeoJSON.Geometry = { type: 'LineString', coordinates: vertices };
      onFeatureComplete?.({
        id: nextId(),
        geometry: geom,
        measurement: measureGeometry(geom),
      });
    } else if (activeMode === 'polygon' && vertices.length >= 3) {
      const closed = [...vertices, vertices[0]];
      const geom: GeoJSON.Geometry = { type: 'Polygon', coordinates: [closed] };
      onFeatureComplete?.({
        id: nextId(),
        geometry: geom,
        measurement: measureGeometry(geom),
      });
    }
    setVertices([]);
  }, [activeMode, vertices, onFeatureComplete]);

  /** Export all drawn features as GeoJSON */
  const exportGeoJSON = useMemo(() => {
    if (features.length === 0) return null;
    return JSON.stringify(
      {
        type: 'FeatureCollection',
        features: features.map((f) => ({
          type: 'Feature',
          geometry: f.geometry,
          properties: { id: f.id, measurement: f.measurement },
        })),
      },
      null,
      2,
    );
  }, [features]);

  const handleExport = useCallback(() => {
    if (!exportGeoJSON) return;
    const blob = new Blob([exportGeoJSON], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drawn_features.geojson';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportGeoJSON]);

  // Expose addVertex/finishDrawing for parent integration
  React.useEffect(() => {
    (window as unknown as Record<string, unknown>).__mapDrawing = {
      addVertex,
      finishDrawing,
      activeMode,
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).__mapDrawing;
    };
  }, [addVertex, finishDrawing, activeMode]);

  return (
    <>
      {/* Toolbar */}
      <div style={S.toolbar}>
        {MODES.map(({ mode, label, icon }) => (
          <button
            key={mode}
            style={{
              ...S.btn,
              ...(activeMode === mode ? S.btnActive : {}),
            }}
            onClick={() => toggle(mode)}
            title={label}
          >
            {icon} {label}
          </button>
        ))}
        {!!activeMode && vertices.length > 0 && (
          <button style={S.btn} onClick={finishDrawing} title="Finish">
            Done
          </button>
        )}
        {features.length > 0 && (
          <>
            <button style={S.btn} onClick={onClear} title="Clear all">✕ Clear</button>
            <button style={S.btn} onClick={handleExport} title="Export GeoJSON">Export</button>
          </>
        )}
      </div>

      {/* Feature list */}
      {features.length > 0 && (
        <div style={S.featureList}>
          {features.map((f) => (
            <div key={f.id} style={S.featureRow}>
              <span>{f.geometry.type}</span>
              <span style={{ color: '#f5a623' }}>{f.measurement}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default DrawingTools;
