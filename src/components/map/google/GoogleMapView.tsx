/**
 * Google Map view with deck.gl overlay — syncs with the shared MapState store.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import type { Layer } from '@deck.gl/core';
import { useMapState } from '../hooks/useMapState';
import { useGoogleMapId } from './GoogleMapsProvider';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface GoogleMapViewProps {
  /** deck.gl layers to render above / interleaved with the Google basemap. */
  layers?: Layer[];
  /** Use interleaved rendering (deck.gl layers between vector tiles). */
  interleaved?: boolean;
  /** CSS class on the wrapper div. */
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const GMAPS_ID = 'synapse-google-map';

const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  layers = [],
  interleaved = true,
  className,
  style,
}) => {
  const mapId = useGoogleMapId();
  const map = useMap(GMAPS_ID);
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);

  const { viewState, setViewState } = useMapState();

  /* --- Overlay lifecycle --- */
  useEffect(() => {
    if (!map) return;
    const overlay = new GoogleMapsOverlay({ interleaved });
    overlay.setMap(map);
    overlayRef.current = overlay;
    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
  }, [map, interleaved]);

  /* --- Push layer updates --- */
  useEffect(() => {
    overlayRef.current?.setProps({ layers });
  }, [layers]);

  /* --- Sync viewport back to shared store --- */
  const handleCameraChange = useCallback(
    (ev: { detail: { center: { lat: number; lng: number }; zoom: number; heading: number; tilt: number } }) => {
      const { center, zoom, heading, tilt } = ev.detail;
      setViewState({
        latitude: center.lat,
        longitude: center.lng,
        zoom,
        bearing: heading,
        pitch: tilt,
      });
    },
    [setViewState],
  );

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    >
      <Map
        id={GMAPS_ID}
        defaultCenter={{ lat: viewState.latitude, lng: viewState.longitude }}
        defaultZoom={viewState.zoom}
        defaultHeading={viewState.bearing}
        defaultTilt={viewState.pitch}
        gestureHandling="greedy"
        disableDefaultUI
        onCameraChanged={handleCameraChange as any}
        style={{ width: '100%', height: '100%' }}
        {...(mapId ? { mapId } : {})}
      />
    </div>
  );
};

export default GoogleMapView;
