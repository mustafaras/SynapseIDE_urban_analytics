import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { DESIGN_TOKENS } from "@/constants/design";
import { reverseGeocode } from "../../services/data/NominatimConnector";
import { toastError, toastInfo, toastSuccess } from "../../ui/toast/api";
import type {
  DrawnFeature,
  MapPin,
  OverlayLayerConfig,
} from "./map/mapTypes";
import {
  IconGlobe,
  IconMeasure,
  IconPin,
  IconPolygon,
  IconRuler,
} from "./map/MapIcons";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./map/mapTokens";
import {
  clampContextMenuPosition,
  collectVisibleBounds,
  formatCoordinatePair,
  type LngLat,
} from "./map/contextMenuUtils";

interface ContextMenuState {
  coordinate: LngLat;
  point: { x: number; y: number };
}

export interface MapContextMenuProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  pins: MapPin[];
  drawnFeatures: DrawnFeature[];
  overlayLayers: OverlayLayerConfig[];
  reducedMotion?: boolean;
  onAddPin: (coords: { lng: number; lat: number }) => void;
  onStartMeasure: (coord: LngLat) => void;
  onStartPolygonDraw: (coord: LngLat) => void;
  onAnalyzeArea?: (coord: LngLat) => void;
  onIsochroneFromHere?: (coord: LngLat) => void;
  onHotSpotAroundHere?: (coord: LngLat) => void;
  onRunStatisticsOnSelection?: () => void;
  selectionStatsAvailable?: boolean;
  onAnnounce?: (msg: string) => void;
}


const menuStyle: React.CSSProperties = {
  position: "absolute",
  minWidth: 260,
  maxWidth: 320,
  padding: DESIGN_TOKENS.spacing.sm,
  background: MAP_COLORS.bgPanel,
  border: `1px solid ${MAP_COLORS.hairlineStrong}`,
  borderRadius: MAP_RADIUS.sm,
  backdropFilter: DESIGN_TOKENS.glassmorphism.backdrop.glassDark,
  boxShadow: MAP_SHADOWS.none,
  color: MAP_COLORS.text,
  zIndex: MAP_Z_INDEX.importProgress + 2,
};

const menuHeaderStyle: React.CSSProperties = {
  padding: `0 0 ${DESIGN_TOKENS.spacing.sm} 0`,
  marginBottom: DESIGN_TOKENS.spacing.xs,
  borderBottom: `1px solid ${MAP_COLORS.hairline}`,
};

const menuButtonStyle: React.CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "18px 1fr",
  gap: DESIGN_TOKENS.spacing.sm,
  alignItems: "start",
  padding: `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.sm}`,
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.text,
  textAlign: "left",
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  transition: DESIGN_TOKENS.transitions.sm,
};

const popupShellStyle: Partial<CSSStyleDeclaration> = {
  minWidth: "220px",
  maxWidth: "300px",
  padding: `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.md}`,
  background: "var(--syn-surface-panel, rgba(17,17,17,0.96))",
  border: `1px solid ${MAP_COLORS.hairlineStrong}`,
  borderRadius: MAP_RADIUS.sm,
  boxShadow: MAP_SHADOWS.none,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

function createPopupContent(title: string, lines: string[], coordinate: LngLat): HTMLDivElement {
  const shell = document.createElement("div");
  Object.assign(shell.style, popupShellStyle);

  const titleEl = document.createElement("div");
  titleEl.textContent = title;
  titleEl.style.color = MAP_COLORS.interaction;
  titleEl.style.fontWeight = String(MAP_TYPOGRAPHY.fontWeight.semibold);
  titleEl.style.marginBottom = DESIGN_TOKENS.spacing.xs;
  shell.appendChild(titleEl);

  for (const line of lines) {
    const p = document.createElement("div");
    p.textContent = line;
    p.style.fontSize = MAP_TYPOGRAPHY.fontSize.xs;
    p.style.lineHeight = "1.45";
    p.style.color = MAP_COLORS.textSecondary;
    p.style.marginBottom = DESIGN_TOKENS.spacing.xs;
    shell.appendChild(p);
  }

  const coords = document.createElement("div");
  coords.textContent = formatCoordinatePair(coordinate);
  coords.style.fontFamily = MAP_TYPOGRAPHY.fontFamilyMono;
  coords.style.color = MAP_COLORS.text;
  coords.style.fontSize = MAP_TYPOGRAPHY.fontSize.xs;
  coords.style.marginTop = DESIGN_TOKENS.spacing.sm;
  shell.appendChild(coords);

  return shell;
}

function adminLine(address?: {
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  suburb?: string;
}): string | null {
  if (!address) return null;
  const parts = [
    address.suburb,
    address.city,
    address.county,
    address.state,
    address.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : null;
}

export const MapContextMenu: React.FC<MapContextMenuProps> = ({
  mapRef,
  pins,
  drawnFeatures,
  overlayLayers,
  reducedMotion = false,
  onAddPin,
  onStartMeasure,
  onStartPolygonDraw,
  onAnalyzeArea,
  onIsochroneFromHere,
  onHotSpotAroundHere,
  onRunStatisticsOnSelection,
  selectionStatsAvailable = false,
  onAnnounce,
}) => {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const lookupSeqRef = useRef(0);
  const rightMouseRef = useRef<{ x: number; y: number } | null>(null);
  const ignoreNextContextMenuRef = useRef(false);

  const closeMenu = useCallback(() => {
    setMenu(null);
    setPosition(null);
  }, []);

  const focusButton = useCallback((index: number) => {
    const items = itemRefs.current.filter(
      (item): item is HTMLButtonElement => item != null && !item.disabled,
    );
    if (items.length === 0) return;
    const normalized = ((index % items.length) + items.length) % items.length;
    items[normalized]?.focus();
  }, []);

  const showPopup = useCallback(
    (coordinate: LngLat, content: HTMLDivElement) => {
      const map = mapRef.current;
      if (!map) return;
      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 16,
        maxWidth: "320px",
      })
        .setLngLat(coordinate)
        .setDOMContent(content)
        .addTo(map);
    },
    [mapRef],
  );

  const startReverseGeocode = useCallback(async () => {
    if (!menu || isReverseGeocoding) return;
    const coordinate = menu.coordinate;
    const [lng, lat] = coordinate;
    closeMenu();
    setIsReverseGeocoding(true);
    const seq = ++lookupSeqRef.current;
    showPopup(
      coordinate,
      createPopupContent("What's here?", ["Looking up address..."], coordinate),
    );

    try {
      const result = await reverseGeocode(lat, lng);
      if (lookupSeqRef.current !== seq) return;

      if (!result) {
        showPopup(
          coordinate,
          createPopupContent("What's here?", ["No address found for this location."], coordinate),
        );
        toastInfo("No address found for this location.");
        return;
      }

      const lines = [result.displayName];
      const admin = adminLine(result.address);
      if (admin) lines.push(admin);
      showPopup(coordinate, createPopupContent("What's here?", lines, coordinate));
      onAnnounce?.("Reverse geocoding completed");
    } catch (error) {
      if (lookupSeqRef.current !== seq) return;
      showPopup(
        coordinate,
        createPopupContent("What's here?", ["Reverse geocoding failed."], coordinate),
      );
      toastError(error instanceof Error ? error.message : "Reverse geocoding failed.");
      onAnnounce?.("Reverse geocoding failed");
    } finally {
      if (lookupSeqRef.current === seq) {
        setIsReverseGeocoding(false);
      }
    }
  }, [closeMenu, isReverseGeocoding, menu, onAnnounce, showPopup]);

  const zoomToAllVisible = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = collectVisibleBounds({ pins, drawnFeatures, overlayLayers });
    closeMenu();

    if (!bounds) {
      toastInfo("No visible features to zoom to.");
      onAnnounce?.("No visible features to zoom to");
      return;
    }

    const [minLng, minLat, maxLng, maxLat] = bounds;
    if (minLng === maxLng && minLat === maxLat) {
      if (reducedMotion) {
        map.jumpTo({ center: [minLng, minLat], zoom: Math.max(map.getZoom(), 14) });
      } else {
        map.flyTo({ center: [minLng, minLat], zoom: Math.max(map.getZoom(), 14), duration: 900 });
      }
      onAnnounce?.("Zoomed to visible feature");
      return;
    }

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 64,
        duration: reducedMotion ? 0 : 900,
        essential: true,
      },
    );
    onAnnounce?.("Zoomed to all visible features");
  }, [closeMenu, drawnFeatures, mapRef, onAnnounce, overlayLayers, pins, reducedMotion]);

  const actions = useMemo(() => {
    if (!menu) return [];
    const coordinate = menu.coordinate;
    const [lng, lat] = coordinate;
    return [
      {
        id: "whats-here",
        label: "What's here?",
        description: "Reverse geocode address, admin area, and coordinates",
        Icon: IconGlobe,
        onSelect: startReverseGeocode,
        disabled: isReverseGeocoding,
      },
      {
        id: "add-pin",
        label: "Add pin here",
        description: "Create a labeled pin at this location",
        Icon: IconPin,
        onSelect: () => {
          closeMenu();
          onAddPin({ lng, lat });
          onAnnounce?.("Pin added from context menu");
        },
      },
      {
        id: "measure-here",
        label: "Measure from here",
        description: "Start distance measurement from this point",
        Icon: IconRuler,
        onSelect: () => {
          closeMenu();
          onStartMeasure(coordinate);
          onAnnounce?.("Distance measurement started from selected point");
        },
      },
      {
        id: "draw-polygon-here",
        label: "Draw polygon here",
        description: "Start polygon drawing from this point",
        Icon: IconPolygon,
        onSelect: () => {
          closeMenu();
          onStartPolygonDraw(coordinate);
          onAnnounce?.("Polygon drawing started from selected point");
        },
      },
      {
        id: "analyze-area",
        label: "Analyze this area",
        description: "Route the current AOI into a compatible workflow",
        Icon: IconPolygon,
        onSelect: () => {
          closeMenu();
          onAnalyzeArea?.(coordinate);
        },
        disabled: !onAnalyzeArea,
      },
      {
        id: "isochrone-from-here",
        label: "Isochrone from here",
        description: "Launch accessibility analysis from this origin",
        Icon: IconGlobe,
        onSelect: () => {
          closeMenu();
          onIsochroneFromHere?.(coordinate);
        },
        disabled: !onIsochroneFromHere,
      },
      {
        id: "hotspot-around-here",
        label: "Hot spot analysis around here",
        description: "Run Getis-Ord Gi* on the nearest visible polygon dataset",
        Icon: IconMeasure,
        onSelect: () => {
          closeMenu();
          onHotSpotAroundHere?.(coordinate);
        },
        disabled: !onHotSpotAroundHere,
      },
      {
        id: "selection-stats",
        label: "Run statistics on selection",
        description: selectionStatsAvailable
          ? "Summarize numeric fields for selected features"
          : "Select one or more map features to enable quick statistics",
        Icon: IconRuler,
        onSelect: () => {
          closeMenu();
          onRunStatisticsOnSelection?.();
        },
        disabled: !onRunStatisticsOnSelection || !selectionStatsAvailable,
      },
      {
        id: "copy-coordinates",
        label: "Copy coordinates",
        description: "Copy lat, lng with 6 decimal places",
        Icon: IconPin,
        onSelect: async () => {
          closeMenu();
          try {
            await navigator.clipboard.writeText(formatCoordinatePair(coordinate));
            toastSuccess("Coordinates copied to clipboard.");
            onAnnounce?.("Coordinates copied to clipboard");
          } catch {
            toastError("Clipboard write failed.");
            onAnnounce?.("Clipboard write failed");
          }
        },
      },
      {
        id: "zoom-all",
        label: "Zoom to all features",
        description: "Fit pins, drawings, and visible overlay layers",
        Icon: IconGlobe,
        onSelect: zoomToAllVisible,
      },
      {
        id: "center-here",
        label: "Center map here",
        description: "Fly to this point at the current zoom level",
        Icon: IconGlobe,
        onSelect: () => {
          const map = mapRef.current;
          closeMenu();
          if (!map) return;
          if (reducedMotion) {
            map.jumpTo({ center: coordinate, zoom: map.getZoom() });
          } else {
            map.flyTo({ center: coordinate, zoom: map.getZoom(), duration: 900 });
          }
          onAnnounce?.("Map centered on selected point");
        },
      },
    ];
  }, [
    closeMenu,
    isReverseGeocoding,
    mapRef,
    menu,
    onAddPin,
    onAnalyzeArea,
    onAnnounce,
    onHotSpotAroundHere,
    onIsochroneFromHere,
    onRunStatisticsOnSelection,
    onStartMeasure,
    onStartPolygonDraw,
    reducedMotion,
    selectionStatsAvailable,
    startReverseGeocode,
    zoomToAllVisible,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const onMouseDown = (e: maplibregl.MapMouseEvent) => {
      const button = (e.originalEvent as MouseEvent | undefined)?.button;
      if (button === 2) {
        rightMouseRef.current = { x: e.point.x, y: e.point.y };
        ignoreNextContextMenuRef.current = false;
      }
    };

    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (!rightMouseRef.current) return;
      const dx = e.point.x - rightMouseRef.current.x;
      const dy = e.point.y - rightMouseRef.current.y;
      if (Math.hypot(dx, dy) > 6) {
        ignoreNextContextMenuRef.current = true;
      }
    };

    const onMouseUp = () => {
      rightMouseRef.current = null;
    };

    const onMoveStart = () => {
      closeMenu();
    };

    const onContextMenu = (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      (e.originalEvent as MouseEvent | undefined)?.preventDefault();

      if (ignoreNextContextMenuRef.current) {
        ignoreNextContextMenuRef.current = false;
        return;
      }

      const coordinate: LngLat = [
        +e.lngLat.lng.toFixed(6),
        +e.lngLat.lat.toFixed(6),
      ];

      setMenu({
        coordinate,
        point: { x: e.point.x, y: e.point.y },
      });
      setPosition({ x: e.point.x, y: e.point.y });
      onAnnounce?.("Context menu opened");
    };

    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);
    map.on("movestart", onMoveStart);
    map.on("contextmenu", onContextMenu);

    return () => {
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
      map.off("movestart", onMoveStart);
      map.off("contextmenu", onContextMenu);
    };
  }, [closeMenu, mapRef, onAnnounce]);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current || !mapRef.current) return;
    const container = mapRef.current.getContainer();
    const next = clampContextMenuPosition({
      x: menu.point.x,
      y: menu.point.y,
      menuWidth: menuRef.current.offsetWidth,
      menuHeight: menuRef.current.offsetHeight,
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight,
    });
    setPosition((prev) =>
      prev && prev.x === next.x && prev.y === next.y ? prev : next,
    );
  }, [mapRef, menu]);

  useEffect(() => {
    if (!menu) return undefined;
    const frame = window.requestAnimationFrame(() => {
      focusButton(0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusButton, menu]);

  useEffect(() => {
    if (!menu) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        (mapRef.current?.getContainer() as HTMLElement | undefined)?.focus();
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, mapRef, menu]);

  useEffect(() => {
    return () => {
      popupRef.current?.remove();
    };
  }, []);

  if (!menu || !position) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      style={{
        ...menuStyle,
        left: position.x,
        top: position.y,
      }}
      tabIndex={0}
      role="menu"
      aria-label="Map context menu"
      onKeyDown={(event) => {
        const enabledRefs = itemRefs.current.filter(
          (item): item is HTMLButtonElement => item != null && !item.disabled,
        );
        const currentIndex = enabledRefs.findIndex(
          (item) => item === document.activeElement,
        );

        if (event.key === "ArrowDown") {
          event.preventDefault();
          focusButton(currentIndex < 0 ? 0 : currentIndex + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          focusButton(currentIndex < 0 ? enabledRefs.length - 1 : currentIndex - 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          focusButton(0);
        } else if (event.key === "End") {
          event.preventDefault();
          focusButton(enabledRefs.length - 1);
        } else if (event.key === "Enter" || event.key === " ") {
          const active = document.activeElement;
          if (active instanceof HTMLButtonElement) {
            event.preventDefault();
            active.click();
          }
        }
      }}
    >
      <div style={menuHeaderStyle}>
        <div
          style={{
            color: MAP_COLORS.interaction,
            fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
            fontSize: MAP_TYPOGRAPHY.fontSize.sm,
            fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
          }}
        >
          Spatial Actions
        </div>
        <div
          style={{
            color: MAP_COLORS.textMuted,
            fontSize: MAP_TYPOGRAPHY.fontSize.xs,
            marginTop: DESIGN_TOKENS.spacing.xs,
            fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
          }}
        >
          {formatCoordinatePair(menu.coordinate)}
        </div>
      </div>

      {actions.map((action, index) => {
        const Icon = action.Icon;
        return (
          <button
            key={action.id}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="menuitem"
            disabled={action.disabled}
            style={{
              ...menuButtonStyle,
              opacity: action.disabled ? 0.55 : 1,
            }}
            onClick={() => {
              void action.onSelect();
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = MAP_COLORS.selectedSubtle;
              event.currentTarget.style.borderColor = MAP_COLORS.focus;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "transparent";
              event.currentTarget.style.borderColor = "transparent";
            }}
            onFocus={(event) => {
              event.currentTarget.style.background = MAP_COLORS.selectedSubtle;
              event.currentTarget.style.borderColor = MAP_COLORS.focus;
            }}
            onBlur={(event) => {
              event.currentTarget.style.background = "transparent";
              event.currentTarget.style.borderColor = "transparent";
            }}
            aria-label={`${action.label}. ${action.description}`}
          >
            <span style={{ color: MAP_COLORS.interaction, paddingTop: 1 }}>
              <Icon size={14} />
            </span>
            <span>
              <div
                style={{
                  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
                  fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
                  color: MAP_COLORS.text,
                }}
              >
                {action.label}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                  color: MAP_COLORS.textMuted,
                  lineHeight: "1.4",
                }}
              >
                {action.description}
              </div>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MapContextMenu;
