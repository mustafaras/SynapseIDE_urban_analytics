import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";
import { IconClose, IconGlobe } from "./MapIcons";
import {
  parseDeclarableCrs,
  searchCrsCatalog,
  suggestLocalCrsForExtent,
  type CrsCatalogEntry,
  type SuggestedCrs,
} from "@/services/map/crs/crsCatalog";

/**
 * "Declare CRS" control for a layer whose CRS is missing/unknown (or already
 * user-declared, to allow correction). It offers a local UTM / equal-area
 * suggestion derived from the layer extent plus a searchable EPSG catalog.
 *
 * Declaring is always a *caveated assertion*: the control surfaces that fact and
 * the resulting metadata (see `buildUserDeclaredCrsSummary`) keeps a permanent
 * caveat. The control never claims a declared CRS is verified.
 */
export interface DeclareCrsControlProps {
  layerId: string;
  layerName: string;
  /** Current resolved CRS (declared or known), for display. */
  currentCrs: string | null;
  /** Whether the current CRS is already user-declared. */
  isUserDeclared: boolean;
  /** Layer extent in lng/lat, used for the local-CRS suggestion. */
  bounds?: [number, number, number, number] | null;
  onDeclare: (layerId: string, crs: string) => void;
  onAnnounce?: (message: string) => void;
}

const triggerButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  cursor: "pointer",
};

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  right: 0,
  width: 300,
  maxWidth: "min(300px, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 1rem))",
  maxHeight: "var(--map-popover-max-height, min(24rem, calc(100vh - 8rem)))",
  overflowY: "auto",
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.md,
  boxShadow: MAP_SHADOWS.dropdown,
  zIndex: MAP_Z_INDEX.dropdown,
  padding: MAP_SPACING.sm,
  display: "flex",
  flexDirection: "column",
  gap: MAP_SPACING.sm,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.text,
};

const closeButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: MAP_STROKES.none,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textMuted,
  cursor: "pointer",
  padding: 2,
  borderRadius: MAP_RADIUS.sm,
};

const caveatBannerStyle: React.CSSProperties = {
  background: MAP_COLORS.caveat,
  color: MAP_COLORS.caveatText,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.4,
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const suggestionButtonStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  width: "100%",
  textAlign: "left",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.selectedSubtle,
  color: MAP_COLORS.text,
  cursor: "pointer",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgWorkspace,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
};

const resultsListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  maxHeight: 184,
  overflowY: "auto",
};

const resultCodeStyle: React.CSSProperties = {
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  color: MAP_COLORS.text,
};

const resultLabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const rationaleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.35,
};

const currentLineStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textMuted,
};

function resultButtonStyle(hovered: boolean): React.CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 0,
    width: "100%",
    textAlign: "left",
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    border: MAP_STROKES.none,
    borderRadius: MAP_RADIUS.sm,
    background: hovered ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
    color: MAP_COLORS.text,
    cursor: "pointer",
  };
}

export const DeclareCrsControl: React.FC<DeclareCrsControlProps> = ({
  layerId,
  layerName,
  currentCrs,
  isUserDeclared,
  bounds,
  onDeclare,
  onAnnounce,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestion = useMemo(() => suggestLocalCrsForExtent(bounds ?? null), [bounds]);
  const results = useMemo(() => searchCrsCatalog(query), [query]);
  const typedCode = useMemo(() => parseDeclarableCrs(query), [query]);
  const typedCodeIsNovel = typedCode !== null && !results.some((entry) => entry.code === typedCode);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHoveredCode(null);
  }, []);

  const declare = useCallback(
    (code: string) => {
      onDeclare(layerId, code);
      onAnnounce?.(`Declared CRS ${code} for ${layerName} as a user-declared (caveated) assertion.`);
      close();
    },
    [close, layerId, layerName, onAnnounce, onDeclare],
  );

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [close, open]);

  const renderSuggestion = (suggested: SuggestedCrs, testId: string) => (
    <button
      type="button"
      data-testid={testId}
      style={suggestionButtonStyle}
      onClick={() => declare(suggested.entry.code)}
      aria-label={`Declare suggested CRS ${suggested.entry.code} (${suggested.entry.label})`}
    >
      <span>
        <span style={resultCodeStyle}>{suggested.entry.code}</span>{" "}
        <span style={resultLabelStyle}>{suggested.entry.label}</span>
      </span>
      <span style={rationaleStyle}>{suggested.rationale}</span>
    </button>
  );

  const renderResult = (entry: CrsCatalogEntry) => (
    <button
      key={entry.code}
      type="button"
      style={resultButtonStyle(hoveredCode === entry.code)}
      onMouseEnter={() => setHoveredCode(entry.code)}
      onMouseLeave={() => setHoveredCode((current) => (current === entry.code ? null : current))}
      onClick={() => declare(entry.code)}
      aria-label={`Declare ${entry.code} — ${entry.label}`}
    >
      <span style={resultCodeStyle}>{entry.code}</span>
      <span style={resultLabelStyle}>{entry.label}</span>
    </button>
  );

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        data-testid="map-declare-crs-trigger"
        style={triggerButtonStyle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Declare CRS for ${layerName}`}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <IconGlobe size={12} />
        {isUserDeclared ? "Re-declare CRS" : "Declare CRS"}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={`Declare CRS for ${layerName}`}
          data-testid="map-declare-crs-popover"
          style={popoverStyle}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
        >
          <div style={headerStyle}>
            <span style={headerTitleStyle}>Declare source CRS</span>
            <button
              type="button"
              style={closeButtonStyle}
              onClick={close}
              aria-label="Close declare CRS control"
            >
              <IconClose size={12} />
            </button>
          </div>

          <p style={caveatBannerStyle} data-testid="map-declare-crs-caveat">
            A declared CRS is a caveated assertion, not verified truth. Coordinates are not
            re-checked against the code — distance and area results inherit this uncertainty.
          </p>

          {currentCrs ? (
            <div style={currentLineStyle}>
              Current: <span style={resultCodeStyle}>{currentCrs}</span>
              {isUserDeclared ? " (user-declared)" : ""}
            </div>
          ) : null}

          {suggestion ? (
            <div style={{ display: "flex", flexDirection: "column", gap: MAP_SPACING.xs }}>
              <span style={sectionLabelStyle}>Suggested for this layer</span>
              {renderSuggestion(suggestion.utm, "map-declare-crs-suggested-utm")}
              {renderSuggestion(suggestion.equalArea, "map-declare-crs-suggested-equal-area")}
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: MAP_SPACING.xs }}>
            <label style={sectionLabelStyle} htmlFor={`declare-crs-search-${layerId}`}>
              Search EPSG catalog
            </label>
            <input
              id={`declare-crs-search-${layerId}`}
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="EPSG code or name (e.g. 32635, UTM, Mercator)"
              aria-label="Search CRS by EPSG code or name"
              data-testid="map-declare-crs-search"
              style={searchInputStyle}
              autoComplete="off"
            />
            <div style={resultsListStyle} data-testid="map-declare-crs-results">
              {typedCodeIsNovel && typedCode ? (
                <button
                  type="button"
                  style={resultButtonStyle(hoveredCode === typedCode)}
                  onMouseEnter={() => setHoveredCode(typedCode)}
                  onMouseLeave={() => setHoveredCode((current) => (current === typedCode ? null : current))}
                  onClick={() => declare(typedCode)}
                  aria-label={`Declare ${typedCode}`}
                >
                  <span style={resultCodeStyle}>{typedCode}</span>
                  <span style={resultLabelStyle}>Declare this exact code</span>
                </button>
              ) : null}
              {results.length === 0 && !typedCodeIsNovel ? (
                <span style={resultLabelStyle}>No matching CRS. Type a full EPSG code to declare it.</span>
              ) : (
                results.map(renderResult)
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
