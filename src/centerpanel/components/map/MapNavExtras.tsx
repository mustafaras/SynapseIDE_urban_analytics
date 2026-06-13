/**
 * MapNavExtras — premium navigation extras for the Map Explorer canvas:
 * "Locate me" (geolocation), "Go to coordinate", and "Full screen".
 *
 * Rendered as a compact vertical pill on the right edge, vertically centred and
 * offset by the active right-dock width (`--map-dock-right`) so it never
 * collides with the top-right control dock or the bottom-right legend/minimap.
 * Self-contained: reads viewport from the store and moves the map via `flyTo`.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Maximize, Minimize, Navigation, X } from "lucide-react";

import { useMapExplorerStore } from "../../../stores/useMapExplorerStore";
import { reportError } from "../../../lib/error-bus";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";
import { GisIconButton } from "./ui";

export interface MapNavExtrasProps {
  /** Move the map to a coordinate (lng, lat, optional zoom). */
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  visible?: boolean;
  onAnnounce?: (message: string) => void;
}

const wrapperStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: "calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  transform: "translateY(-50%)",
  zIndex: MAP_Z_INDEX.mapFurniture,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: 3,
  borderRadius: MAP_RADIUS.sm,
  border: "1px solid var(--syn-border-subtle, rgba(148,163,184,0.32))",
  background: "color-mix(in srgb, var(--syn-surface-panel, rgba(12,16,24,0.96)) 92%, transparent)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.26)",
  pointerEvents: "auto",
};

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: "calc(100% + 6px)",
  width: "13.5rem",
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderRadius: MAP_RADIUS.sm,
  border: "1px solid var(--syn-border-subtle, rgba(148,163,184,0.32))",
  background: "var(--syn-surface-panel, rgba(12,16,24,0.98))",
  boxShadow: "0 8px 24px rgba(0,0,0,0.34)",
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const popoverHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const popoverTitleStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
  color: MAP_COLORS.textMuted,
};

const fieldLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.1875rem",
  fontSize: "0.625rem",
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.3125rem 0.5rem",
  borderRadius: MAP_RADIUS.xs,
  border: "1px solid var(--syn-border-subtle, rgba(148,163,184,0.34))",
  background: "var(--syn-surface-subtle, rgba(15,23,42,0.6))",
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.75rem",
};

const goButtonStyle: React.CSSProperties = {
  marginTop: "0.125rem",
  padding: "0.375rem 0.5rem",
  borderRadius: MAP_RADIUS.xs,
  border: "1px solid transparent",
  background: MAP_COLORS.interaction,
  color: MAP_COLORS.bgPanel,
  fontSize: "0.75rem",
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  cursor: "pointer",
};

const errorTextStyle: React.CSSProperties = {
  fontSize: "0.625rem",
  color: MAP_COLORS.error,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

export function MapNavExtras({
  flyTo,
  visible = true,
  onAnnounce,
}: MapNavExtrasProps): React.ReactElement | null {
  const currentZoom = useMapExplorerStore((state) => state.zoom);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coordOpen, setCoordOpen] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [coordError, setCoordError] = useState<string | null>(null);

  useEffect(() => {
    const handleChange = (): void => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const handleToggleFullscreen = useCallback((): void => {
    const target =
      wrapperRef.current?.closest<HTMLElement>('[data-map-explorer-shell="true"]') ??
      document.documentElement;
    if (!document.fullscreenElement) {
      target.requestFullscreen?.().then(
        () => onAnnounce?.("Map entered full screen"),
        (error: unknown) =>
          reportError({
            source: "ui",
            code: "FULLSCREEN_FAILED",
            message: "Could not enter full screen",
            detail: error instanceof Error ? error.message : String(error),
          }),
      );
    } else {
      void document.exitFullscreen?.();
      onAnnounce?.("Map exited full screen");
    }
  }, [onAnnounce]);

  const handleLocate = useCallback((): void => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reportError({
        source: "ui",
        code: "GEOLOCATE_UNSUPPORTED",
        message: "Geolocation is not available in this browser",
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        flyTo(longitude, latitude, Math.max(currentZoom, 14));
        onAnnounce?.(`Centred on your location near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setLocating(false);
      },
      (error) => {
        reportError({
          source: "ui",
          code: "GEOLOCATE_FAILED",
          message: "Could not determine your location",
          detail: error.message,
        });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }, [currentZoom, flyTo, onAnnounce]);

  const handleGoToCoordinate = useCallback((): void => {
    const lat = Number.parseFloat(latInput.trim());
    const lng = Number.parseFloat(lngInput.trim());
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setCoordError("Latitude must be between -90 and 90.");
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setCoordError("Longitude must be between -180 and 180.");
      return;
    }
    setCoordError(null);
    flyTo(lng, lat, Math.max(currentZoom, 12));
    onAnnounce?.(`Centred on ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setCoordOpen(false);
  }, [currentZoom, flyTo, latInput, lngInput, onAnnounce]);

  if (!visible) return null;

  return (
    <div
      ref={wrapperRef}
      style={wrapperStyle}
      role="group"
      aria-label="Map navigation extras"
      data-map-furniture="nav-extras"
      data-map-safe-inset-consumer="nav-extras"
    >
      <GisIconButton
        label={locating ? "Locating your position" : "Locate me"}
        tooltip={locating ? "Locating…" : "Locate me"}
        icon={<Crosshair size={14} aria-hidden="true" />}
        size="sm"
        active={locating}
        disabled={locating}
        disabledReason="Locating your position"
        onClick={handleLocate}
        data-testid="map-nav-locate"
      />
      <GisIconButton
        label="Go to coordinate"
        tooltip="Go to coordinate"
        icon={<Navigation size={14} aria-hidden="true" />}
        size="sm"
        active={coordOpen}
        aria-expanded={coordOpen}
        onClick={() => {
          setCoordError(null);
          setCoordOpen((open) => !open);
        }}
        data-testid="map-nav-goto"
      />
      <GisIconButton
        label={isFullscreen ? "Exit full screen" : "Full screen"}
        tooltip={isFullscreen ? "Exit full screen" : "Full screen"}
        icon={isFullscreen ? <Minimize size={14} aria-hidden="true" /> : <Maximize size={14} aria-hidden="true" />}
        size="sm"
        active={isFullscreen}
        onClick={handleToggleFullscreen}
        data-testid="map-nav-fullscreen"
      />

      {coordOpen ? (
        <div
          style={popoverStyle}
          role="dialog"
          aria-label="Go to coordinate"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              setCoordOpen(false);
            }
          }}
        >
          <div style={popoverHeaderStyle}>
            <span style={popoverTitleStyle}>Go to coordinate</span>
            <GisIconButton
              label="Close go to coordinate"
              icon={<X size={13} aria-hidden="true" />}
              size="sm"
              onClick={() => setCoordOpen(false)}
            />
          </div>
          <label style={fieldLabelStyle}>
            Latitude
            <input
              style={inputStyle}
              inputMode="decimal"
              placeholder="41.0082"
              value={latInput}
              onChange={(event) => setLatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleGoToCoordinate();
              }}
              aria-label="Latitude"
            />
          </label>
          <label style={fieldLabelStyle}>
            Longitude
            <input
              style={inputStyle}
              inputMode="decimal"
              placeholder="28.9784"
              value={lngInput}
              onChange={(event) => setLngInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleGoToCoordinate();
              }}
              aria-label="Longitude"
            />
          </label>
          {coordError ? <span style={errorTextStyle}>{coordError}</span> : null}
          <button type="button" style={goButtonStyle} onClick={handleGoToCoordinate}>
            Fly to coordinate
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default MapNavExtras;
