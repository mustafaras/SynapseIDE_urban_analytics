/**
 * Google Places Autocomplete with session tokens for cost optimisation.
 *
 * Uses `google.maps.places.AutocompleteService` (new) to get predictions,
 * and `google.maps.places.PlacesService` for full details on selection.
 */
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useMapState } from '../hooks/useMapState';
import { useTrackApiCall } from './hooks/useGoogleMapsAPI';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  types?: string[];
}

export interface GooglePlacesSearchProps {
  /** Fly-to zoom level on place selection (default 15). */
  flyToZoom?: number;
  /** Callback when a place is selected. */
  onSelect?: (place: PlaceResult) => void;
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const GooglePlacesSearch: React.FC<GooglePlacesSearchProps> = ({
  flyToZoom = 15,
  onSelect,
  className,
  style,
}) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const serviceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const dummyRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flyTo = useMapState((s) => s.flyTo);
  const trackCall = useTrackApiCall();

  /* --- Initialise services once --- */
  useEffect(() => {
    if (typeof google === 'undefined' || !google.maps?.places) return;
    serviceRef.current = new google.maps.places.AutocompleteService();
    sessionTokenRef.current =
      new google.maps.places.AutocompleteSessionToken();
  }, []);

  /* --- Debounced autocomplete --- */
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!query.trim() || !serviceRef.current || !sessionTokenRef.current) {
      setPredictions([]);
      return;
    }
    timerRef.current = setTimeout(() => {
      serviceRef.current!.getPlacePredictions(
        {
          input: query,
          sessionToken: sessionTokenRef.current!,
        },
        (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            setPredictions(results);
            setOpen(true);
            trackCall('autocomplete', 1, 0.00283); // $2.83/1000
          } else {
            setPredictions([]);
          }
        },
      );
    }, 300);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, trackCall]);

  /* --- Place Details on select --- */
  const handleSelect = useCallback(
    (placeId: string) => {
      if (!dummyRef.current) return;
      if (!placesServiceRef.current) {
        placesServiceRef.current = new google.maps.places.PlacesService(
          dummyRef.current,
        );
      }
      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: ['name', 'formatted_address', 'geometry', 'rating', 'types'],
          sessionToken: sessionTokenRef.current!,
        },
        (result, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            result?.geometry?.location
          ) {
            const loc = {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
            };
            const place: PlaceResult = {
              placeId,
              name: result.name ?? '',
              address: result.formatted_address ?? '',
              location: loc,
              ...(typeof result.rating === 'number' ? { rating: result.rating } : {}),
              ...(result.types ? { types: result.types } : {}),
            };
            onSelect?.(place);
            flyTo({ latitude: loc.lat, longitude: loc.lng, zoom: flyToZoom });
            trackCall('placeDetails', 1, 0.017); // $17/1000
          }
          // Reset session token after a details call.
          sessionTokenRef.current =
            new google.maps.places.AutocompleteSessionToken();
        },
      );
      setOpen(false);
      setQuery('');
      setPredictions([]);
    },
    [flyTo, flyToZoom, onSelect, trackCall],
  );

  /* --- Keyboard --- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIdx((i) => Math.min(i + 1, predictions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIdx((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIdx >= 0 && predictions[activeIdx]) {
            handleSelect(predictions[activeIdx].place_id);
          }
          break;
        case 'Escape':
          setOpen(false);
          break;
      }
    },
    [open, activeIdx, predictions, handleSelect],
  );

  return (
    <div
      className={className}
      style={{ position: 'relative', width: 280, ...style }}
    >
      {/* Hidden element for PlacesService */}
      <div ref={dummyRef} style={{ display: 'none' }} />

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIdx(-1);
        }}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder="Search Google Places…"
        aria-label="Google Places search"
        style={{
          width: '100%',
          padding: '6px 10px',
          border: '1px solid #555',
          borderRadius: 4,
          background: '#2a2a2a',
          color: '#eee',
          fontSize: 13,
          outline: 'none',
        }}
      />

      {!!open && predictions.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            background: '#2a2a2a',
            border: '1px solid #555',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            maxHeight: 260,
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          {predictions.map((p, i) => (
            <li
              key={p.place_id}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={() => handleSelect(p.place_id)}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 12,
                color: i === activeIdx ? '#fff' : '#ccc',
                background: i === activeIdx ? '#444' : 'transparent',
              }}
            >
              {p.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GooglePlacesSearch;
