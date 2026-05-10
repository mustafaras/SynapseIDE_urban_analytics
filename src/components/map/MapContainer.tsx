import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import DeckGL from '@deck.gl/react';
import { Map as MapGL } from 'react-map-gl/maplibre';
import { useMapState, type ViewState } from './hooks/useMapState';
import { useLayerStack } from './hooks/useLayerStack';
import type { Layer, PickingInfo, ViewStateChangeParameters } from '@deck.gl/core';

import 'maplibre-gl/dist/maplibre-gl.css';

/* ------------------------------------------------------------------ */
/*  Basemap definitions                                                */
/* ------------------------------------------------------------------ */

export const BASEMAP_STYLES: Record<string, string> = {
  'OSM Liberty':
    'https://demotiles.maplibre.org/style.json',
  'CartoDB Positron':
    'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  'CartoDB Dark Matter':
    'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  'CartoDB Voyager':
    'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface MapContainerProps {
  /** Override initial center [lon, lat] */
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  /** Pre-built deck.gl Layer instances to render */
  layers?: Layer[];
  /** Basemap style URL or key from BASEMAP_STYLES */
  basemapStyle?: string;
  onViewStateChange?: (vs: ViewState) => void;
  children?: React.ReactNode;
  /** CSS class on the wrapper div */
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Error Boundary for WebGL context loss                              */
/* ------------------------------------------------------------------ */

interface EBState { hasError: boolean }

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  EBState
> {
  override state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: '#1a1a1a',
            color: '#f5a623',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>WebGL context lost</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{
                background: '#f5a623',
                color: '#1a1a1a',
                border: 'none',
                padding: '6px 16px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Reload Map
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/*  MapContainer                                                       */
/* ------------------------------------------------------------------ */

export const MapContainer: React.FC<MapContainerProps> = ({
  center,
  zoom,
  bearing,
  pitch,
  layers: externalLayers,
  basemapStyle,
  onViewStateChange,
  children,
  className,
  style,
}) => {
  /* ---- refs ---- */
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* ---- viewport store ---- */
  const viewState = useMapState((s) => s.viewState);
  const setViewState = useMapState((s) => s.setViewState);

  // Seed initial overrides once
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const patch: Partial<ViewState> = {};
    if (center) {
      patch.longitude = center[0];
      patch.latitude = center[1];
    }
    if (zoom !== undefined) patch.zoom = zoom;
    if (bearing !== undefined) patch.bearing = bearing;
    if (pitch !== undefined) patch.pitch = pitch;
    if (Object.keys(patch).length) setViewState(patch);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- layer stack from store ---- */
  const storeLayers = useLayerStack((s) => s.layers);
  const layerOrder = useLayerStack((s) => s.layerOrder);

  // Merge external layers (on top) with store-managed layers
  const deckLayers = useMemo<Layer[]>(() => {
    // Store layers don't produce deck.gl Layer instances yet - they are configs.
    // Future prompts will bridge LayerConfig → deck.gl Layer.
    // For now, just pass through external layers.
    const _ordered = layerOrder
      .map((id) => storeLayers.find((l) => l.id === id))
      .filter(Boolean);
    void _ordered; // placeholder for config→layer mapping
    return externalLayers ?? [];
  }, [externalLayers, storeLayers, layerOrder]);

  /* ---- basemap ---- */
  const mapStyle = useMemo(() => {
    if (!basemapStyle) return BASEMAP_STYLES['CartoDB Positron'];
    return BASEMAP_STYLES[basemapStyle] ?? basemapStyle;
  }, [basemapStyle]);

  /* ---- mouse position ---- */
  const [cursor, setCursor] = useState<{ lon: number; lat: number } | null>(null);

  const handleHover = useCallback(
    (info: PickingInfo) => {
      const coordinate = info.coordinate;
      if (Array.isArray(coordinate) && coordinate.length >= 2) {
        setCursor({ lon: coordinate[0] as number, lat: coordinate[1] as number });
      }
    },
    [],
  );

  /* ---- viewport change ---- */
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

      const nextViewState: ViewState = {
        longitude: vs.longitude,
        latitude: vs.latitude,
        zoom: vs.zoom,
        bearing: vs.bearing,
        pitch: vs.pitch,
        ...(typeof vs.transitionDuration === 'number' ? { transitionDuration: vs.transitionDuration } : {}),
      };

      setViewState(nextViewState);
      onViewStateChange?.(nextViewState);
    },
    [setViewState, onViewStateChange],
  );

  /* ---- resize observer ---- */
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <MapErrorBoundary>
      <div
        ref={wrapperRef}
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#1a1a1a',
          ...style,
        }}
      >
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller
          layers={deckLayers}
          onHover={handleHover}
          width={size.width || '100%'}
          height={size.height || '100%'}
        >
          <MapGL mapStyle={mapStyle} />
        </DeckGL>

        {/* Coordinate display */}
        {!!cursor && (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              left: 8,
              background: 'rgba(26,26,26,0.8)',
              color: '#ccc',
              fontSize: 11,
              fontFamily: 'monospace',
              padding: '2px 8px',
              borderRadius: 3,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            {cursor.lat.toFixed(5)}, {cursor.lon.toFixed(5)}
          </div>
        )}

        {children}
      </div>
    </MapErrorBoundary>
  );
};

export default MapContainer;
