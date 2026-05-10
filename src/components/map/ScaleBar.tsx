import React, { useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ScaleBarProps {
  /** Current map zoom level */
  zoom: number;
  /** Latitude of the map center (for Mercator correction) */
  latitude: number;
  /** Show metric, imperial, or both */
  units?: 'metric' | 'imperial' | 'both';
}

/* ------------------------------------------------------------------ */
/*  Scale computation                                                  */
/* ------------------------------------------------------------------ */

const EARTH_CIRCUMFERENCE_M = 40_075_016.686;

/** Meters per pixel at a given latitude and zoom (Web Mercator). */
function metersPerPixel(latitude: number, zoom: number): number {
  return (
    (EARTH_CIRCUMFERENCE_M * Math.cos((latitude * Math.PI) / 180)) /
    Math.pow(2, zoom + 8)
  );
}

/** Pick a "nice" round number for the scale bar. */
const NICE_METRIC = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
const NICE_IMPERIAL = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5280, 10560, 26400, 52800, 105600, 264000, 528000]; // in feet

function pickNice(mPerPx: number, targetPx: number, table: number[], toMeters: number): { value: number; widthPx: number } {
  const targetM = mPerPx * targetPx;
  let best = table[0];
  for (const v of table) {
    if (v * toMeters <= targetM * 1.2) best = v;
    else break;
  }
  return { value: best, widthPx: (best * toMeters) / mPerPx };
}

function formatMetric(m: number): string {
  if (m >= 1000) return `${m / 1000} km`;
  return `${m} m`;
}

function formatImperial(ft: number): string {
  if (ft >= 5280) return `${(ft / 5280).toFixed(ft >= 10560 ? 0 : 1)} mi`;
  return `${ft} ft`;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'absolute',
    bottom: 6,
    right: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    zIndex: 4,
    pointerEvents: 'none',
    userSelect: 'none',
  },
  bar: {
    height: 4,
    background: 'rgba(245,166,35,0.7)',
    borderLeft: '2px solid rgba(245,166,35,0.9)',
    borderRight: '2px solid rgba(245,166,35,0.9)',
    borderRadius: 1,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center' as const,
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const TARGET_PX = 100;

export const ScaleBar: React.FC<ScaleBarProps> = ({
  zoom,
  latitude,
  units = 'both',
}) => {
  const mPerPx = useMemo(() => metersPerPixel(latitude, zoom), [latitude, zoom]);

  const metric = useMemo(
    () => pickNice(mPerPx, TARGET_PX, NICE_METRIC, 1),
    [mPerPx],
  );
  const imperial = useMemo(
    () => pickNice(mPerPx, TARGET_PX, NICE_IMPERIAL, 0.3048),
    [mPerPx],
  );

  return (
    <div style={S.wrapper}>
      {(units === 'metric' || units === 'both') && (
        <div>
          <div style={{ ...S.bar, width: metric.widthPx }} />
          <div style={{ ...S.label, width: metric.widthPx }}>
            {formatMetric(metric.value)}
          </div>
        </div>
      )}
      {(units === 'imperial' || units === 'both') && (
        <div>
          <div style={{ ...S.bar, width: imperial.widthPx, background: 'rgba(180,180,180,0.5)' }} />
          <div style={{ ...S.label, width: imperial.widthPx }}>
            {formatImperial(imperial.value)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScaleBar;
