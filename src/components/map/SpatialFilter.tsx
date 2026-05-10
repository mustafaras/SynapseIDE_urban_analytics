import React, { useCallback, useMemo, useState } from 'react';
import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SpatialOp = 'clip' | 'buffer' | 'intersect' | 'point-in-polygon';

export interface SpatialFilterProps {
  /** Source layers as GeoJSON FeatureCollections keyed by layer id */
  layers: Record<string, FeatureCollection>;
  /** Called when a drawn filter polygon is completed */
  onDrawPolygon?: (polygon: Feature<Polygon>) => void;
  /** Called when the spatial operation produces results */
  onResult?: (result: FeatureCollection, op: SpatialOp) => void;
}

export interface SpatialResultRow {
  id: number;
  sourceLayer: string;
  featureIndex: number;
  properties: Record<string, unknown>;
  area?: number;
  length?: number;
}

/* ------------------------------------------------------------------ */
/*  Spatial operation helpers (Turf.js)                                */
/* ------------------------------------------------------------------ */

function clipLayers(
  layers: Record<string, FeatureCollection>,
  mask: Feature<Polygon | MultiPolygon>,
): FeatureCollection {
  const features: Feature[] = [];
  for (const [, fc] of Object.entries(layers)) {
    for (const feat of fc.features) {
      try {
        if (feat.geometry.type === 'Point' || feat.geometry.type === 'MultiPoint') {
          if (turf.booleanPointInPolygon(feat as Feature<Point>, mask)) {
            features.push(feat);
          }
        } else if (
          feat.geometry.type === 'Polygon' ||
          feat.geometry.type === 'MultiPolygon'
        ) {
          const clipped = turf.intersect(
            turf.featureCollection([feat as Feature<Polygon | MultiPolygon>, mask]),
          );
          if (clipped) features.push(clipped);
        } else if (feat.geometry.type === 'LineString' || feat.geometry.type === 'MultiLineString') {
          // Use booleanIntersects as a quick filter
          if (turf.booleanIntersects(feat, mask)) {
            features.push(feat);
          }
        }
      } catch {
        // Skip features that fail spatial ops
      }
    }
  }
  return turf.featureCollection(features);
}

function bufferFeatures(
  fc: FeatureCollection,
  radiusKm: number,
): FeatureCollection {
  const features: Feature[] = [];
  for (const feat of fc.features) {
    try {
      const buffered = turf.buffer(feat, radiusKm, { units: 'kilometers' });
      if (buffered) features.push(buffered);
    } catch {
      // Skip
    }
  }
  return turf.featureCollection(features);
}

function intersectFeatures(
  sourceFC: FeatureCollection,
  targetFC: FeatureCollection,
): FeatureCollection {
  const features: Feature[] = [];
  for (const src of sourceFC.features) {
    for (const tgt of targetFC.features) {
      try {
        if (turf.booleanIntersects(src, tgt)) {
          features.push(src);
          break;
        }
      } catch {
        // Skip
      }
    }
  }
  return turf.featureCollection(features);
}

function pointInPolygonQuery(
  points: FeatureCollection,
  zones: FeatureCollection,
): FeatureCollection {
  const features: Feature[] = [];
  for (const pt of points.features) {
    if (pt.geometry.type !== 'Point') continue;
    for (const zone of zones.features) {
      if (
        zone.geometry.type !== 'Polygon' &&
        zone.geometry.type !== 'MultiPolygon'
      )
        continue;
      try {
        if (turf.booleanPointInPolygon(pt as Feature<Point>, zone as Feature<Polygon | MultiPolygon>)) {
          features.push({
            ...pt,
            properties: {
              ...pt.properties,
              _zone: zone.properties?.name ?? zone.properties?.id ?? 'unknown',
            },
          });
          break;
        }
      } catch {
        // Skip
      }
    }
  }
  return turf.featureCollection(features);
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  toolbar: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    padding: '8px 10px',
    background: 'rgba(26,26,26,0.92)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
  },
  btn: {
    padding: '5px 12px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
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
  paramRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '4px 10px',
    color: '#bbb',
    fontSize: 12,
  },
  input: {
    width: 80,
    padding: '3px 6px',
    background: '#222',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 3,
    color: '#eee',
    fontSize: 12,
  },
  select: {
    padding: '3px 6px',
    background: '#222',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 3,
    color: '#eee',
    fontSize: 12,
  },
  runBtn: {
    padding: '5px 16px',
    background: 'rgba(245,166,35,0.85)',
    border: 'none',
    borderRadius: 4,
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 11,
    color: '#ccc',
  },
  th: {
    textAlign: 'left' as const,
    padding: '4px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    color: '#f5a623',
    fontWeight: 600,
  },
  td: {
    padding: '3px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  resultWrapper: {
    maxHeight: 240,
    overflowY: 'auto' as const,
    background: 'rgba(26,26,26,0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
  },
  empty: {
    padding: 16,
    textAlign: 'center' as const,
    color: '#666',
    fontSize: 12,
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const OPS: { id: SpatialOp; label: string; icon: string }[] = [
  { id: 'clip', label: 'Clip', icon: '✂' },
  { id: 'buffer', label: 'Buffer', icon: '◎' },
  { id: 'intersect', label: 'Intersect', icon: '∩' },
  { id: 'point-in-polygon', label: 'Point in Polygon', icon: '◉' },
];

export const SpatialFilter: React.FC<SpatialFilterProps> = ({
  layers,
  onDrawPolygon,
  onResult,
}) => {
  const [activeOp, setActiveOp] = useState<SpatialOp | null>(null);
  const [bufferRadius, setBufferRadius] = useState(0.5);
  const [sourceLayerId, setSourceLayerId] = useState<string>('');
  const [targetLayerId, setTargetLayerId] = useState<string>('');
  const [maskPolygon, setMaskPolygon] = useState<Feature<Polygon> | null>(null);
  const [results, setResults] = useState<FeatureCollection | null>(null);

  const layerIds = useMemo(() => Object.keys(layers), [layers]);

  // Auto-select first layer if none selected
  useMemo(() => {
    if (!sourceLayerId && layerIds.length > 0) setSourceLayerId(layerIds[0]);
    if (!targetLayerId && layerIds.length > 1) setTargetLayerId(layerIds[1]);
  }, [layerIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDrawPolygon = useCallback(() => {
    // This would integrate with DrawingTools via onDrawPolygon callback.
    // For now, if window.__mapDrawing has a polygon, use it.
    const win = window as unknown as Record<string, unknown>;
    const drawData = win.__mapDrawing as { features?: { geometry: GeoJSON.Geometry }[] } | undefined;
    if (drawData?.features?.length) {
      const last = drawData.features[drawData.features.length - 1];
      if (last.geometry.type === 'Polygon') {
        const poly = turf.feature(last.geometry as Polygon);
        setMaskPolygon(poly);
        onDrawPolygon?.(poly);
      }
    }
  }, [onDrawPolygon]);

  const runOperation = useCallback(() => {
    if (!activeOp) return;
    let result: FeatureCollection | null = null;

    switch (activeOp) {
      case 'clip': {
        if (!maskPolygon) {
          handleDrawPolygon();
          return;
        }
        result = clipLayers(layers, maskPolygon);
        break;
      }
      case 'buffer': {
        const src = layers[sourceLayerId];
        if (src) {
          result = bufferFeatures(src, bufferRadius);
        }
        break;
      }
      case 'intersect': {
        const src = layers[sourceLayerId];
        const tgt = layers[targetLayerId];
        if (src && tgt) {
          result = intersectFeatures(src, tgt);
        }
        break;
      }
      case 'point-in-polygon': {
        const pts = layers[sourceLayerId];
        const zones = layers[targetLayerId];
        if (pts && zones) {
          result = pointInPolygonQuery(pts, zones);
        }
        break;
      }
    }

    if (result) {
      setResults(result);
      onResult?.(result, activeOp);
    }
  }, [activeOp, layers, sourceLayerId, targetLayerId, bufferRadius, maskPolygon, handleDrawPolygon, onResult]);

  /* ---- Result rows for table ---- */
  const resultRows = useMemo<SpatialResultRow[]>(() => {
    if (!results) return [];
    return results.features.map((f, i) => ({
      id: i,
      sourceLayer: (f.properties?._sourceLayer as string) ?? '-',
      featureIndex: i,
      properties: f.properties ?? {},
      ...(f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
        ? { area: turf.area(f) }
        : {}),
      ...(f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'
        ? { length: turf.length(f, { units: 'meters' }) }
        : {}),
    }));
  }, [results]);

  return (
    <div style={S.wrapper}>
      {/* Operation selector */}
      <div style={S.toolbar}>
        {OPS.map((op) => (
          <button
            key={op.id}
            style={{
              ...S.btn,
              ...(activeOp === op.id ? S.btnActive : {}),
            }}
            onClick={() => setActiveOp(activeOp === op.id ? null : op.id)}
            title={op.label}
          >
            {op.icon} {op.label}
          </button>
        ))}
      </div>

      {/* Parameters */}
      {!!activeOp && (
        <div style={S.paramRow}>
          {(activeOp === 'buffer' || activeOp === 'intersect' || activeOp === 'point-in-polygon') && (
            <label>
              Source:{' '}
              <select
                style={S.select}
                value={sourceLayerId}
                onChange={(e) => setSourceLayerId(e.target.value)}
              >
                {layerIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
          )}
          {(activeOp === 'intersect' || activeOp === 'point-in-polygon') && (
            <label>
              Target:{' '}
              <select
                style={S.select}
                value={targetLayerId}
                onChange={(e) => setTargetLayerId(e.target.value)}
              >
                {layerIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
          )}
          {activeOp === 'buffer' && (
            <label>
              Radius (km):{' '}
              <input
                type="number"
                style={S.input}
                value={bufferRadius}
                min={0.01}
                step={0.1}
                onChange={(e) => setBufferRadius(Math.max(0.01, Number(e.target.value)))}
              />
            </label>
          )}
          {activeOp === 'clip' && !maskPolygon && (
            <span style={{ color: '#f5a623', fontSize: 11 }}>
              Draw a polygon on the map, then click Run
            </span>
          )}
          <button style={S.runBtn} onClick={runOperation}>
            Run
          </button>
        </div>
      )}

      {/* Results table */}
      {resultRows.length > 0 && (
        <div style={S.resultWrapper}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Properties</th>
                <th style={S.th}>Area / Length</th>
              </tr>
            </thead>
            <tbody>
              {resultRows.map((row) => (
                <tr key={row.id}>
                  <td style={S.td}>{row.id + 1}</td>
                  <td style={S.td}>
                    {results!.features[row.featureIndex]?.geometry.type ?? '-'}
                  </td>
                  <td style={S.td}>
                    {Object.entries(row.properties)
                      .filter(([k]) => !k.startsWith('_'))
                      .slice(0, 3)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ') || '-'}
                  </td>
                  <td style={S.td}>
                    {row.area != null
                      ? row.area >= 1e6
                        ? `${(row.area / 1e6).toFixed(2)} km²`
                        : `${row.area.toFixed(0)} m²`
                      : row.length != null
                        ? row.length >= 1000
                          ? `${(row.length / 1000).toFixed(2)} km`
                          : `${row.length.toFixed(0)} m`
                        : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!!activeOp && resultRows.length === 0 && !!results && <div style={S.empty}>No features matched the spatial query.</div>}
    </div>
  );
};

export default SpatialFilter;
