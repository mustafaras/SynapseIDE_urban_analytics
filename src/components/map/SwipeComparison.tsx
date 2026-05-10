import React, { useCallback, useEffect, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { Map as MapGL } from 'react-map-gl/maplibre';
import { useMapState } from './hooks/useMapState';
import { BASEMAP_STYLES } from './MapContainer';
import type { Layer, ViewStateChangeParameters } from '@deck.gl/core';

import 'maplibre-gl/dist/maplibre-gl.css';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SwipeComparisonProps {
  /** Basemap style key or URL for the left side */
  leftBasemap?: string;
  /** Basemap style key or URL for the right side */
  rightBasemap?: string;
  /** deck.gl layers for the left side */
  leftLayers?: Layer[];
  /** deck.gl layers for the right side */
  rightLayers?: Layer[];
  /** Label displayed above the left panel */
  leftLabel?: string;
  /** Label displayed above the right panel */
  rightLabel?: string;
  /** Initial divider position as fraction 0-1 (default 0.5) */
  initialSplit?: number;
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: '#1a1a1a',
    userSelect: 'none',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
    cursor: 'col-resize',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: {
    width: 4,
    height: 48,
    borderRadius: 2,
    background: '#f5a623',
    boxShadow: '0 0 6px rgba(245,166,35,0.4)',
  },
  handleLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    background: '#f5a623',
    opacity: 0.6,
    left: 2,
    pointerEvents: 'none' as const,
  },
  label: {
    position: 'absolute',
    top: 10,
    padding: '3px 10px',
    background: 'rgba(26,26,26,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    color: '#f5a623',
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    zIndex: 8,
    pointerEvents: 'none' as const,
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const SwipeComparison: React.FC<SwipeComparisonProps> = ({
  leftBasemap = 'CartoDB Positron',
  rightBasemap = 'CartoDB Dark Matter',
  leftLayers,
  rightLayers,
  leftLabel = 'Before',
  rightLabel = 'After',
  initialSplit = 0.5,
  className,
  style,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(initialSplit);
  const [dragging, setDragging] = useState(false);
  const [wrapperWidth, setWrapperWidth] = useState(1);

  /* ---- Viewport (shared) ---- */
  const viewState = useMapState((s) => s.viewState);
  const setViewState = useMapState((s) => s.setViewState);

  const handleViewStateChange = useCallback(
    ({ viewState: vs }: ViewStateChangeParameters<any>) => {
      if (
        typeof vs.longitude !== 'number' ||
        typeof vs.latitude !== 'number' ||
        typeof vs.zoom !== 'number' ||
        typeof vs.bearing !== 'number' ||
        typeof vs.pitch !== 'number'
      ) {
        return;
      }

      setViewState({
        longitude: vs.longitude,
        latitude: vs.latitude,
        zoom: vs.zoom,
        bearing: vs.bearing,
        pitch: vs.pitch,
        ...(typeof vs.transitionDuration === 'number' ? { transitionDuration: vs.transitionDuration } : {}),
      });
    },
    [setViewState],
  );

  /* ---- Resize observer ---- */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWrapperWidth(entry.contentRect.width || 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---- Drag handlers ---- */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setSplit(Math.max(0.05, Math.min(0.95, x / rect.width)));
    },
    [dragging],
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  /* ---- Basemap resolution ---- */
  const leftStyle = BASEMAP_STYLES[leftBasemap] ?? leftBasemap;
  const rightStyle = BASEMAP_STYLES[rightBasemap] ?? rightBasemap;

  const splitPx = split * wrapperWidth;

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ ...S.wrapper, ...style }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Left panel */}
      <div
        style={{
          ...S.panel,
          left: 0,
          width: splitPx,
        }}
      >
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller
          layers={leftLayers ?? []}
          width={wrapperWidth}
          height="100%"
        >
          <MapGL mapStyle={leftStyle} />
        </DeckGL>
        <div style={{ ...S.label, left: 10 }}>{leftLabel}</div>
      </div>

      {/* Right panel */}
      <div
        style={{
          ...S.panel,
          left: splitPx,
          right: 0,
          width: wrapperWidth - splitPx,
        }}
      >
        <div style={{ position: 'relative', width: wrapperWidth, height: '100%', marginLeft: -splitPx }}>
          <DeckGL
            viewState={viewState}
            onViewStateChange={handleViewStateChange}
            controller
            layers={rightLayers ?? []}
            width={wrapperWidth}
            height="100%"
          >
            <MapGL mapStyle={rightStyle} />
          </DeckGL>
        </div>
        <div style={{ ...S.label, right: 10 }}>{rightLabel}</div>
      </div>

      {/* Draggable divider */}
      <div
        style={{
          ...S.handle,
          left: splitPx - 3,
        }}
        onPointerDown={onPointerDown}
      >
        <div style={S.handleLine} />
        <div style={S.handleBar} />
      </div>
    </div>
  );
};

export default SwipeComparison;
