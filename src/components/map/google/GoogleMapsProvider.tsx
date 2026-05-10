/**
 * Google Maps provider — wraps @vis.gl/react-google-maps APIProvider.
 *
 * Loads the Google Maps JS API, configures a mapId for cloud styling,
 * and handles missing / invalid API key states.
 */
import React, { useMemo } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useGoogleMapsAPI } from './hooks/useGoogleMapsAPI';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface GoogleMapsProviderProps {
  /** Override API key (falls back to persisted key). */
  apiKey?: string;
  /** Google Cloud Map ID for vector-map styling. */
  mapId?: string;
  /** Additional libraries to load (e.g. 'places', 'routes'). */
  libraries?: string[];
  children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

const skeletonStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#1a1a1a',
  color: '#888',
  fontFamily: 'monospace',
  fontSize: 14,
};

function LoadingSkeleton() {
  return (
    <div style={skeletonStyle}>
      <span>Loading Google Maps…</span>
    </div>
  );
}

function ErrorFallback({ message }: { message: string }) {
  return (
    <div style={{ ...skeletonStyle, color: '#e05050' }}>
      <span>{message}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  apiKey: keyProp,
  mapId,
  libraries = ['places', 'routes'],
  children,
}) => {
  const { apiKey: storedKey, error } = useGoogleMapsAPI();
  const key = keyProp || storedKey;

  const libraryList = useMemo(() => libraries, [libraries]);

  if (!key) {
    return (
      <ErrorFallback
        message={error ?? 'Google Maps API key not configured. Add it in Settings → Keys.'}
      />
    );
  }

  return (
    <APIProvider
      apiKey={key}
      libraries={libraryList}
      // mapId passed down to child Maps via context
    >
      <GoogleMapsProviderInner {...(mapId ? { mapId } : {})}>
        {children}
      </GoogleMapsProviderInner>
    </APIProvider>
  );
};

/**
 * Inner wrapper that passes `mapId` to any child `<Map>` components via
 * a thin React context.
 */
const MapIdContext = React.createContext<string | undefined>(undefined);

export function useGoogleMapId() {
  return React.useContext(MapIdContext);
}

const GoogleMapsProviderInner: React.FC<{
  mapId?: string;
  children: React.ReactNode;
}> = ({ mapId, children }) => {
  return (
    <MapIdContext.Provider value={mapId}>
      <React.Suspense fallback={<LoadingSkeleton />}>
        {children}
      </React.Suspense>
    </MapIdContext.Provider>
  );
};

export default GoogleMapsProvider;
