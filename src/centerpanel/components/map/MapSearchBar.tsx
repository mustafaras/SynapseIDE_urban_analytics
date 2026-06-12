import React, { useCallback, useState } from "react";
import { Search } from "lucide-react";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_ICON_SIZES,
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
  background: "color-mix(in srgb, var(--syn-surface-input, #1a1f26) 88%, transparent)",
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
  const [focused, setFocused] = useState(false);

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
      data-testid={compact ? "map-search-capsule" : undefined}
      data-map-search-expanded={compact && (focused || results.length > 0) ? "true" : "false"}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: compact ? MAP_SPACING.xs : MAP_SPACING.sm,
        minWidth: compact ? "9.5rem" : undefined,
        width: compact
          ? focused || results.length > 0
            ? "min(24rem, calc(100vw - 4rem))"
            : "clamp(10rem, 14vw, 14rem)"
          : undefined,
        maxWidth: compact ? "100%" : undefined,
        flex: compact ? "1 1 100%" : undefined,
        padding: compact ? "0.125rem" : undefined,
        border: compact ? MAP_STROKES.hairlineSubtle : undefined,
        borderRadius: compact ? MAP_RADIUS.full : undefined,
        background: compact ? "color-mix(in srgb, var(--syn-surface-panel, rgba(12, 16, 24, 0.88)) 86%, transparent)" : undefined,
        boxShadow: compact && (focused || results.length > 0) ? MAP_SHADOWS.dropdown : undefined,
        transition: compact ? MAP_TRANSITIONS.fast : undefined,
      }}
    >
      <input
        type="text"
        role="combobox"
        style={{
          ...searchInput,
          width: compact ? "100%" : MAP_DIMENSIONS.searchWidth,
          minHeight: compact ? "1.875rem" : undefined,
          padding: compact ? `${MAP_SPACING.zero} ${MAP_SPACING.sm}` : searchInput.padding,
          fontFamily: compact ? MAP_TYPOGRAPHY.fontFamilyMono : undefined,
          borderColor: compact ? "transparent" : undefined,
          background: compact ? MAP_COLORS.transparent : searchInput.background,
        }}
        placeholder="Search location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
        onFocus={(e) => {
          setFocused(true);
          e.currentTarget.style.outline = `2px solid ${MAP_COLORS.focus}`;
          e.currentTarget.style.outlineOffset = "2px";
        }}
        onBlur={(e) => {
          setFocused(false);
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
          minHeight: compact ? "1.875rem" : undefined,
          width: compact ? "1.875rem" : undefined,
          justifyContent: "center",
          padding: compact ? MAP_SPACING.zero : mapStyles.btn.padding,
          border: compact ? "1px solid transparent" : mapStyles.btn.border,
          fontFamily: compact ? MAP_TYPOGRAPHY.fontFamilyMono : mapStyles.btn.fontFamily,
        }}
        onClick={handleSearch}
        disabled={isSearching}
        aria-label="Execute location search"
      >
        {isSearching ? "..." : compact ? (
          <>
            <Search size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />
            <span style={mapStyles.srOnly}>Search</span>
          </>
        ) : "Search"}
      </button>

      {results.length > 0 && (
        <div
          id="map-search-results"
          style={{
            ...dropdownContainer,
            minWidth: compact ? "100%" : dropdownContainer.minWidth,
            maxWidth: compact ? "min(24rem, calc(100vw - 4rem))" : dropdownContainer.maxWidth,
          }}
          role="listbox"
          aria-label="Search results"
        >
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
