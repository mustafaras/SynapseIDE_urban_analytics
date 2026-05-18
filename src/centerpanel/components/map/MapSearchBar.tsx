import React, { useCallback, useState } from "react";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapSearchBarProps {
  onFlyTo: (lng: number, lat: number, zoom?: number) => void;
  onResultCount?: (count: number) => void;
  onPlaceSelected?: (place: {
    label: string;
    center: [number, number];
    bbox?: [number, number, number, number];
    source: string;
  }) => void;
  compact?: boolean;
}

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
}

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const searchInput: React.CSSProperties = {
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: "var(--syn-surface-input, #1a1f26)",
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  width: MAP_DIMENSIONS.searchWidth,
  transition: MAP_TRANSITIONS.fast,
};

const dropdownContainer: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: MAP_SPACING.zero,
  zIndex: MAP_Z_INDEX.dropdown,
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  overflow: "hidden",
  maxWidth: MAP_DIMENSIONS.searchMaxWidth,
  minWidth: MAP_DIMENSIONS.searchWidth,
  boxShadow: MAP_SHADOWS.none,
  marginTop: MAP_SPACING.xs,
};

const dropdownItem: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  background: MAP_COLORS.transparent,
  border: MAP_STROKES.none,
  borderBottom: MAP_STROKES.hairline,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  cursor: "pointer",
  transition: MAP_TRANSITIONS.fast,
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapSearchBar: React.FC<MapSearchBarProps> = ({ onFlyTo, onResultCount, onPlaceSelected, compact = false }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5`;
      const resp = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });
      if (!resp.ok) throw new Error("Search failed");
      const data = (await resp.json()) as NominatimSearchResult[];
      setResults(data);
      onResultCount?.(data.length);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, onResultCount]);

  const selectResult = useCallback(
    (result: NominatimSearchResult) => {
      const lng = Number(result.lon);
      const lat = Number(result.lat);
      onFlyTo(lng, lat, 14);
      const bbox = parseNominatimBoundingBox(result.boundingbox);
      onPlaceSelected?.({
        label: result.display_name,
        center: [lng, lat],
        ...(bbox ? { bbox } : {}),
        source: "Nominatim",
      });
      setResults([]);
    },
    [onFlyTo, onPlaceSelected],
  );

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: compact ? MAP_SPACING.xs : MAP_SPACING.sm,
        minWidth: compact ? "8rem" : undefined,
        flex: compact ? "0 1 16rem" : undefined,
      }}
    >
      <input
        type="text"
        role="combobox"
        style={{
          ...searchInput,
          width: compact ? "clamp(8rem, 12vw, 13rem)" : MAP_DIMENSIONS.searchWidth,
          minHeight: compact ? "1.625rem" : undefined,
          padding: compact ? `${MAP_SPACING.zero} ${MAP_SPACING.sm}` : searchInput.padding,
          fontFamily: compact ? MAP_TYPOGRAPHY.fontFamilyMono : undefined,
        }}
        placeholder="Search location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = MAP_COLORS.focus;
          e.currentTarget.style.outline = `2px solid ${MAP_COLORS.focus}`;
          e.currentTarget.style.outlineOffset = "2px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = MAP_COLORS.hairlineSubtle;
          e.currentTarget.style.outline = "";
          e.currentTarget.style.outlineOffset = "";
        }}
        aria-label="Search location (Enter to search)"
        aria-autocomplete="list"
        aria-controls={results.length > 0 ? "map-search-results" : undefined}
        aria-expanded={results.length > 0}
      />
      <button
        type="button"
        style={{
          ...mapStyles.btn,
          minHeight: compact ? "1.625rem" : undefined,
          padding: compact ? `${MAP_SPACING.zero} ${MAP_SPACING.sm}` : mapStyles.btn.padding,
          fontFamily: compact ? MAP_TYPOGRAPHY.fontFamilyMono : mapStyles.btn.fontFamily,
        }}
        onClick={handleSearch}
        disabled={isSearching}
        aria-label="Execute location search"
      >
        {isSearching ? "..." : "Search"}
      </button>

      {results.length > 0 && (
        <div id="map-search-results" style={dropdownContainer} role="listbox" aria-label="Search results">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={false}
              style={dropdownItem}
              onClick={() => selectResult(r)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  MAP_COLORS.selectedSubtle;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  MAP_COLORS.transparent;
              }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function parseNominatimBoundingBox(
  boundingbox: NominatimSearchResult["boundingbox"],
): [number, number, number, number] | null {
  if (!boundingbox || boundingbox.length !== 4) return null;
  const [south, north, west, east] = boundingbox.map(Number);
  if (![south, north, west, east].every(Number.isFinite)) return null;
  return [west, south, east, north];
}
