import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMapState } from './hooks/useMapState';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

export interface GeocoderSearchProps {
  /** Maximum recent searches to remember */
  maxRecent?: number;
  /** Optional callback when a place is selected */
  onSelect?: (lat: number, lon: number, label: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 7,
    width: 320,
  },
  inputWrap: {
    display: 'flex',
    background: 'rgba(26,26,26,0.94)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#ddd',
    fontSize: 13,
    padding: '8px 12px',
    outline: 'none',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '0 10px',
    fontSize: 14,
  },
  dropdown: {
    marginTop: 2,
    background: 'rgba(26,26,26,0.96)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    maxHeight: 280,
    overflowY: 'auto',
  },
  item: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    padding: '8px 12px',
    fontSize: 12,
    color: '#ccc',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    cursor: 'pointer',
    lineHeight: 1.4,
  },
  itemHover: {
    background: 'rgba(245,166,35,0.08)',
    color: '#f5a623',
  },
  section: {
    padding: '6px 12px 4px',
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
};

/* ------------------------------------------------------------------ */
/*  Nominatim search (OpenStreetMap)                                   */
/* ------------------------------------------------------------------ */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

async function searchNominatim(
  query: string,
  signal: AbortSignal,
): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '0',
    limit: '8',
  });
  const res = await fetch(`${NOMINATIM}?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  return res.json() as Promise<NominatimResult[]>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const RECENT_KEY = 'map.geocoder.recent';

function loadRecent(): { label: string; lat: number; lon: number }[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export const GeocoderSearch: React.FC<GeocoderSearchProps> = ({
  maxRecent = 5,
  onSelect,
}) => {
  const flyTo = useMapState((s) => s.flyTo);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hovered, setHovered] = useState(-1);
  const [recents, setRecents] = useState(loadRecent);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- debounced search ---- */
  const doSearch = useCallback((q: string) => {
    abortRef.current?.abort();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    searchNominatim(q, ctrl.signal)
      .then((r) => {
        setResults(r);
        setShowDropdown(true);
      })
      .catch(() => {});
  }, []);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(val), 350);
    },
    [doSearch],
  );

  /* ---- selection ---- */
  const selectPlace = useCallback(
    (lat: number, lon: number, label: string) => {
      flyTo({ latitude: lat, longitude: lon, zoom: 14 });
      setQuery(label);
      setShowDropdown(false);
      onSelect?.(lat, lon, label);

      // save to recent
      const updated = [
        { label, lat, lon },
        ...recents.filter((r) => r.label !== label),
      ].slice(0, maxRecent);
      setRecents(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    },
    [flyTo, onSelect, recents, maxRecent],
  );

  /* ---- keyboard ---- */
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      } else if (e.key === 'ArrowDown') {
        setHovered((h) => Math.min(h + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        setHovered((h) => Math.max(h - 1, 0));
      } else if (e.key === 'Enter' && hovered >= 0 && results[hovered]) {
        const r = results[hovered];
        selectPlace(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
      }
    },
    [results, hovered, selectPlace],
  );

  /* ---- blur cleanup ---- */
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showRecents = showDropdown && results.length === 0 && query.length < 3 && recents.length > 0;

  return (
    <div style={S.wrapper}>
      <div style={S.inputWrap}>
        <input
          style={S.input}
          value={query}
          onChange={handleInput}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKey}
          placeholder="Search places…"
          spellCheck={false}
        />
        {!!query && (
          <button
            style={S.clearBtn}
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowDropdown(false);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {!!showDropdown && results.length > 0 && (
        <div style={S.dropdown}>
          {results.map((r, i) => (
            <button
              key={r.place_id}
              style={{
                ...S.item,
                ...(i === hovered ? S.itemHover : {}),
              }}
              onMouseEnter={() => setHovered(i)}
              onClick={() =>
                selectPlace(parseFloat(r.lat), parseFloat(r.lon), r.display_name)
              }
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Recent searches */}
      {!!showRecents && (
        <div style={S.dropdown}>
          <div style={S.section}>Recent</div>
          {recents.map((r, i) => (
            <button
              key={i}
              style={S.item}
              onClick={() => selectPlace(r.lat, r.lon, r.label)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeocoderSearch;
