import React, { useState } from 'react';
import type { RGBA } from './utils/colorScales';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type LegendType = 'graduated' | 'categorical' | 'heatmap' | 'size';

export interface LegendEntry {
  label: string;
  color: RGBA | string;
  size?: number;
}

export interface LegendItem {
  layerId: string;
  title: string;
  type: LegendType;
  entries: LegendEntry[];
}

export interface MapLegendProps {
  items: LegendItem[];
  /** Initial position offset from bottom-right */
  position?: 'bottom-right' | 'bottom-left' | 'top-left';
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toCSS(c: RGBA | string): string {
  if (typeof c === 'string') return c;
  return `rgba(${c[0]},${c[1]},${c[2]},${(c[3] / 255).toFixed(2)})`;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const posMap: Record<string, React.CSSProperties> = {
  'bottom-right': { bottom: 36, right: 10 },
  'bottom-left': { bottom: 36, left: 10 },
  'top-left': { top: 50, left: 10 },
};

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'absolute',
    background: 'rgba(26,26,26,0.92)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    zIndex: 5,
    minWidth: 150,
    maxWidth: 260,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  title: {
    fontSize: 11,
    fontWeight: 600,
    color: '#f5a623',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  toggle: {
    fontSize: 10,
    color: '#888',
  },
  body: {
    padding: '4px 10px 8px',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#ccc',
    fontWeight: 600,
    marginBottom: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '2px 0',
    fontSize: 11,
    color: '#aaa',
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 2,
    border: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  ramp: {
    width: '100%',
    height: 10,
    borderRadius: 2,
    border: '1px solid rgba(255,255,255,0.08)',
    marginTop: 2,
  },
  rampLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const MapLegend: React.FC<MapLegendProps> = ({
  items,
  position = 'bottom-right',
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;

  const renderGraduated = (entries: LegendEntry[]) => (
    <div>
      {entries.map((e, i) => (
        <div key={i} style={S.row}>
          <div style={{ ...S.swatch, background: toCSS(e.color) }} />
          <span>{e.label}</span>
        </div>
      ))}
    </div>
  );

  const renderCategorical = (entries: LegendEntry[]) => (
    <div>
      {entries.map((e, i) => (
        <div key={i} style={S.row}>
          <div style={{ ...S.swatch, background: toCSS(e.color) }} />
          <span>{e.label}</span>
        </div>
      ))}
    </div>
  );

  const renderHeatmap = (entries: LegendEntry[]) => {
    const colors = entries.map((e) => toCSS(e.color));
    const gradient = `linear-gradient(to right, ${colors.join(', ')})`;
    return (
      <div>
        <div style={{ ...S.ramp, background: gradient }} />
        <div style={S.rampLabels}>
          <span>{entries[0]?.label ?? 'Low'}</span>
          <span>{entries[entries.length - 1]?.label ?? 'High'}</span>
        </div>
      </div>
    );
  };

  const renderSize = (entries: LegendEntry[]) => (
    <div>
      {entries.map((e, i) => (
        <div key={i} style={S.row}>
          <div
            style={{
              width: e.size ?? 10,
              height: e.size ?? 10,
              borderRadius: '50%',
              background: toCSS(e.color),
              border: '1px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
            }}
          />
          <span>{e.label}</span>
        </div>
      ))}
    </div>
  );

  const renderEntries = (item: LegendItem) => {
    switch (item.type) {
      case 'graduated': return renderGraduated(item.entries);
      case 'categorical': return renderCategorical(item.entries);
      case 'heatmap': return renderHeatmap(item.entries);
      case 'size': return renderSize(item.entries);
    }
  };

  return (
    <div style={{ ...S.wrapper, ...posMap[position] }}>
      <div style={S.header} onClick={() => setCollapsed((p) => !p)}>
        <span style={S.title}>Legend</span>
        <span style={S.toggle}>{collapsed ? '▸' : '▾'}</span>
      </div>
      {!collapsed && (
        <div style={S.body}>
          {items.map((item) => (
            <div key={item.layerId} style={S.section}>
              <div style={S.sectionTitle}>{item.title}</div>
              {renderEntries(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapLegend;
