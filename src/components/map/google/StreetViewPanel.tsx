/**
 * Embedded Street View panorama panel.
 *
 * Opens from a map location, supports split-screen mode,
 * and syncs position changes back to the map state.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useMapState } from '../hooks/useMapState';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface StreetViewPanelProps {
  /** Initial position [lat, lng]. Falls back to current map centre. */
  position?: { lat: number; lng: number };
  /** Heading in degrees (default 0). */
  heading?: number;
  /** Pitch in degrees (default 0). */
  pitch?: number;
  /** Zoom level 0-5 (default 1). */
  zoom?: number;
  /** If true, renders as an overlay on top of the map. Otherwise side-by-side. */
  overlay?: boolean;
  /** Notify parent when the user navigates to a new position. */
  onPositionChange?: (pos: { lat: number; lng: number }) => void;
  /** Close handler. */
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const StreetViewPanel: React.FC<StreetViewPanelProps> = ({
  position: positionProp,
  heading = 0,
  pitch = 0,
  zoom = 1,
  overlay = false,
  onPositionChange,
  onClose,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const { viewState, setViewState } = useMapState();
  const [error, setError] = useState<string | null>(null);

  const defaultPos = positionProp ?? {
    lat: viewState.latitude,
    lng: viewState.longitude,
  };

  /* --- Initialise / tear down the panorama --- */
  useEffect(() => {
    if (!containerRef.current) return;
    if (typeof google === 'undefined' || !google.maps) {
      setError('Google Maps API not loaded');
      return;
    }

    const pano = new google.maps.StreetViewPanorama(containerRef.current, {
      position: defaultPos,
      pov: { heading, pitch },
      zoom,
      addressControl: false,
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
    });

    const posListener = pano.addListener('position_changed', () => {
      const p = pano.getPosition();
      if (!p) return;
      const pos = { lat: p.lat(), lng: p.lng() };
      onPositionChange?.(pos);
      setViewState({ latitude: pos.lat, longitude: pos.lng });
    });

    svRef.current = pano;

    return () => {
      google.maps.event.removeListener(posListener);
      svRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- Sync incoming position prop --- */
  useEffect(() => {
    if (positionProp && svRef.current) {
      svRef.current.setPosition(positionProp);
    }
  }, [positionProp]);

  /* --- Wrapper styles --- */
  const wrapperStyle: React.CSSProperties = overlay
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        ...style,
      }
    : {
        width: '100%',
        height: '100%',
        ...style,
      };

  return (
    <div className={className} style={wrapperStyle}>
      {!!onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 51,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 14,
          }}
          aria-label="Close Street View"
        >
          ✕
        </button>
      )}
      {error ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1a1a',
            color: '#e05050',
            fontFamily: 'monospace',
          }}
        >
          {error}
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
};

export default StreetViewPanel;
