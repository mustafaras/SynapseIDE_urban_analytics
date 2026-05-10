import React, { useCallback, useState } from 'react';
import { transformCoords } from './utils/projections';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CoordFormat = 'DD' | 'DMS' | 'UTM';

export interface CoordinateDisplayProps {
  /** Decimal-degree latitude */
  lat: number | null;
  /** Decimal-degree longitude */
  lon: number | null;
  /** Override initial format */
  initialFormat?: CoordFormat;
}

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

function toDD(lat: number, lon: number): string {
  return `${lat.toFixed(6)}°, ${lon.toFixed(6)}°`;
}

function toDMS(lat: number, lon: number): string {
  const fmt = (v: number, pos: string, neg: string): string => {
    const abs = Math.abs(v);
    const d = Math.floor(abs);
    const mFull = (abs - d) * 60;
    const m = Math.floor(mFull);
    const s = ((mFull - m) * 60).toFixed(1);
    return `${d}°${m}′${s}″${v >= 0 ? pos : neg}`;
  };
  return `${fmt(lat, 'N', 'S')}  ${fmt(lon, 'E', 'W')}`;
}

function toUTM(lat: number, lon: number): string {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const hemi = lat >= 0 ? 'N' : 'S';
  const epsg = `EPSG:${lat >= 0 ? 32600 + zone : 32700 + zone}`;
  try {
    const [easting, northing] = transformCoords([lon, lat], 'EPSG:4326', epsg);
    return `${zone}${hemi}  ${easting.toFixed(0)}E  ${northing.toFixed(0)}N`;
  } catch {
    return `Zone ${zone}${hemi}`;
  }
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(26,26,26,0.85)',
    borderRadius: 4,
    padding: '3px 8px',
    zIndex: 4,
    userSelect: 'none',
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#bbb',
    whiteSpace: 'nowrap' as const,
  },
  btn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 3,
    color: '#888',
    fontSize: 9,
    padding: '1px 5px',
    cursor: 'pointer',
    lineHeight: 1.4,
  },
  btnActive: {
    color: '#f5a623',
    borderColor: 'rgba(245,166,35,0.3)',
  },
  copy: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: 12,
    padding: '0 4px',
    lineHeight: 1,
  },
};

const FORMATS: CoordFormat[] = ['DD', 'DMS', 'UTM'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({
  lat,
  lon,
  initialFormat = 'DD',
}) => {
  const [format, setFormat] = useState<CoordFormat>(initialFormat);
  const [copied, setCopied] = useState(false);

  const formatted =
    lat !== null && lon !== null
      ? format === 'DD'
        ? toDD(lat, lon)
        : format === 'DMS'
          ? toDMS(lat, lon)
          : toUTM(lat, lon)
      : '—';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(formatted).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }, [formatted]);

  return (
    <div style={S.wrapper}>
      <span style={S.text}>{formatted}</span>
      {FORMATS.map((f) => (
        <button
          key={f}
          style={{ ...S.btn, ...(f === format ? S.btnActive : {}) }}
          onClick={() => setFormat(f)}
        >
          {f}
        </button>
      ))}
      <button style={S.copy} onClick={handleCopy} title="Copy coordinates">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
};

export default CoordinateDisplay;
