import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { BASE_STYLES, type BaseLayerId, type MapPin, type ViewportState } from "./mapTypes";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_NUMERIC,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "./mapTokens";
import { useMapExplorerStore } from "../../../stores/useMapExplorerStore";

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapCanvasProps {
  id?: string;
  baseLayer: BaseLayerId;
  pinMode: boolean;
  pins: MapPin[];
  interactiveLayerIds?: string[];
  reducedMotion?: boolean;
  preserveDrawingBuffer?: boolean;
  /**
   * Optional initial viewport for the map at construction time.
   *
   * When provided, MapCanvas does NOT read the initial viewport from the
   * shared Map Explorer store. Use this for self-contained surfaces such as
   * the Urban Analytics study-area mini map, which must not inherit the
   * global Map Explorer viewport. Existing callers that omit this prop keep
   * the legacy behaviour of reading from `useMapExplorerStore`.
   */
  initialViewport?: Partial<ViewportState>;
  /**
   * Viewport ownership mode.
   *
   * - `'shared'` (default): the canvas participates in the global Map
   *   Explorer state — clicking clears feature selections, feature picks
   *   write into `useMapExplorerStore`, etc. Used by the main Map Explorer
   *   modal.
   * - `'controlled'`: the canvas is an isolated preview/selector surface
   *   (e.g. the Urban Analytics study-area mini map). Click and selection
   *   side-effects against the global Map Explorer store are suppressed so
   *   the mini map cannot perturb the main map's selection or analysis
   *   state. The caller still receives `onMapClick` / `onViewportChange`.
   */
  viewportMode?: 'shared' | 'controlled';
  onCursorMove: (coords: { lng: number; lat: number }) => void;
  onZoomChange: (zoom: number) => void;
  onViewportChange: (
    v: {
      center: [number, number];
      zoom: number;
      bearing: number;
      pitch: number;
    },
    meta?: { userInitiated: boolean },
  ) => void;
  onMapClick: (coords: { lng: number; lat: number }) => void;
  onMapReady: (map: maplibregl.Map) => void;
  onMapDestroy: () => void;
  onRenderError?: (message: string) => void;
  onFeatureReportRequest?: (payload: MapFeatureReportRequest) => void;
}

export interface MapFeatureReportRequest {
  layerId?: string;
  featureId: string;
  properties: Record<string, unknown>;
  coordinate: [number, number];
}

/* ================================================================== */
/*  Marker Factory                                                     */
/* ================================================================== */

function createPinElement(label: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = MAP_DIMENSIONS.pinMarkerSize;
  el.style.height = MAP_DIMENSIONS.pinMarkerSize;
  el.style.borderRadius = MAP_RADIUS.full;
  el.style.background = "var(--syn-status-info, #38bdf8)";
  el.style.border = MAP_STROKES.marker;
  el.style.boxShadow = MAP_SHADOWS.marker;
  el.style.cursor = "pointer";
  el.title = label;
  return el;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function humanizePropertyKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatPopupValue(value: unknown): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "n/a";
    }
    return Number.isInteger(value)
      ? String(value)
      : value.toFixed(4).replace(/0+$/g, "").replace(/\.$/, "");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatPopupValue(item)).join(", ");
  }

  return value == null ? "n/a" : String(value);
}

function getFeaturePopupTitle(properties: Record<string, unknown> | undefined, fallback = "Feature Details"): string {
  const preferredTitleKeys = [
    "detection_class",
    "land_cover_class",
    "cluster_label",
    "query_intent",
    "name",
    "label",
  ];
  const title = preferredTitleKeys
    .map((key) => properties?.[key])
    .find((value) => value != null && value !== "");
  return title ? String(title) : fallback;
}

function buildFeaturePopupHtml(properties: Record<string, unknown> | undefined): string | null {
  const visibleEntries = Object.entries(properties ?? {}).filter(([key, value]) => {
    if (key.startsWith("__")) {
      return false;
    }
    return value != null && value !== "";
  });

  if (visibleEntries.length === 0) {
    return null;
  }

  const title = getFeaturePopupTitle(properties);

  const rows = visibleEntries
    .slice(0, 12)
    .map(([key, value]) => {
      return `
        <div style="display:grid;grid-template-columns:auto 1fr;gap:${MAP_SPACING.sm};padding:${MAP_SPACING.xs} 0;border-top:${MAP_STROKES.hairlineSubtle}">
          <span style="font-size:${MAP_TYPOGRAPHY.fontSize.xs};color:${MAP_COLORS.textMuted};text-transform:uppercase;letter-spacing:${MAP_TYPOGRAPHY.letterSpacing.caps}">${escapeHtml(humanizePropertyKey(key))}</span>
          <span style="font-size:${MAP_TYPOGRAPHY.fontSize.xs};color:${MAP_COLORS.textSecondary};text-align:right">${escapeHtml(formatPopupValue(value))}</span>
        </div>`;
    })
    .join("");

  return `
    <div style="min-width:${MAP_DIMENSIONS.searchWidth};max-width:${MAP_DIMENSIONS.pinSidebarWidth};padding:${MAP_SPACING.sm};font-family:${MAP_TYPOGRAPHY.fontFamily}">
      <div style="font-size:${MAP_TYPOGRAPHY.fontSize.sm};font-weight:${MAP_TYPOGRAPHY.fontWeight.bold};color:var(--syn-text-primary, ${MAP_COLORS.text});margin-bottom:${MAP_SPACING.sm}">${escapeHtml(title)}</div>
      <div>${rows}</div>
      <button type="button" data-map-feature-report="true" style="margin-top:${MAP_SPACING.sm};width:100%;border:1px solid var(--syn-border-strong, rgba(148, 163, 184, 0.5));border-radius:${MAP_RADIUS.sm};background:var(--syn-interaction-hover, rgba(56, 189, 248, 0.14));color:var(--syn-text-primary, ${MAP_COLORS.text});font-size:${MAP_TYPOGRAPHY.fontSize.xs};font-weight:${MAP_TYPOGRAPHY.fontWeight.semibold};padding:${MAP_SPACING.xs} ${MAP_SPACING.sm};cursor:pointer">Add to report</button>
    </div>`;
}

function isAbortLikeError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }
  if (error instanceof Error) {
    return error.name === "AbortError" || /abort/i.test(error.message);
  }
  if (typeof error === "object" && error !== null && "name" in error) {
    return (error as { name?: string }).name === "AbortError";
  }
  return false;
}

function renderErrorMessage(event: { error?: unknown; sourceId?: unknown; status?: unknown }): string | null {
  const sourceId = typeof event.sourceId === "string" ? event.sourceId : null;
  const layer = sourceId
    ? useMapExplorerStore.getState().overlayLayers.find((candidate) => candidate.id === sourceId)
    : null;
  const rawMessage = event.error instanceof Error ? event.error.message : String(event.error ?? "Map render request failed.");
  const status = typeof event.status === "number" ? ` HTTP ${event.status}.` : "";

  if (!layer || layer.sourceKind !== "external") {
    return null;
  }

  const isRaster = layer.type === "raster-tile" || layer.type === "vector-tile";
  const isNetworkLike = /cors|failed to fetch|network|tile|http|unauthorized|forbidden/i.test(rawMessage) || event.status != null;
  if (!isRaster && !isNetworkLike) {
    return null;
  }

  return `External service layer "${layer.name}" could not load from the browser.${status} ${rawMessage} If the endpoint is blocked by CORS or service permissions, use an HTTPS CORS proxy or a server-side geospatial proxy.`;
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapCanvas: React.FC<MapCanvasProps> = ({
  id,
  baseLayer,
  pinMode,
  pins,
  interactiveLayerIds = [],
  reducedMotion = false,
  preserveDrawingBuffer = false,
  initialViewport,
  viewportMode = 'shared',
  onCursorMove,
  onZoomChange,
  onViewportChange,
  onMapClick,
  onMapReady,
  onMapDestroy,
  onRenderError,
  onFeatureReportRequest,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const pinModeRef = useRef(pinMode);
  const interactiveLayerIdsRef = useRef<string[]>(interactiveLayerIds);
  const cursorMoveRef = useRef(onCursorMove);
  const pendingCursorRef = useRef<{ lng: number; lat: number } | null>(null);
  const cursorFrameRef = useRef<number | null>(null);
  const featureReportRequestRef = useRef<MapCanvasProps["onFeatureReportRequest"]>(onFeatureReportRequest);
  const initialBaseLayerRef = useRef<BaseLayerId | null>(baseLayer);
  const initialViewportRef = useRef<Partial<ViewportState> | undefined>(initialViewport);
  const viewportModeRef = useRef(viewportMode);
  const tearingDownRef = useRef(false);

  useEffect(() => {
    viewportModeRef.current = viewportMode;
  }, [viewportMode]);

  /* Keep ref in sync so click handler sees latest value */
  useEffect(() => {
    pinModeRef.current = pinMode;
  }, [pinMode]);

  useEffect(() => {
    interactiveLayerIdsRef.current = interactiveLayerIds;
  }, [interactiveLayerIds]);

  useEffect(() => {
    cursorMoveRef.current = onCursorMove;
  }, [onCursorMove]);

  useEffect(() => {
    featureReportRequestRef.current = onFeatureReportRequest;
  }, [onFeatureReportRequest]);

  /* ---- Initialize map ---- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    tearingDownRef.current = false;

    /* Resolve the initial viewport.
     *
     * When the caller passes `initialViewport` (e.g. the Urban Analytics
     * mini map), use those values exclusively so the surface does not
     * inherit the global Map Explorer viewport. Otherwise fall back to the
     * persisted Map Explorer store snapshot. */
    const storeSnapshot = useMapExplorerStore.getState();
    const explicit = initialViewportRef.current;
    const center: [number, number] = explicit?.center ?? storeSnapshot.center;
    const zoom = explicit?.zoom ?? storeSnapshot.zoom;
    const bearing = explicit?.bearing ?? storeSnapshot.bearing;
    const pitch = explicit?.pitch ?? storeSnapshot.pitch;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLES[baseLayer].url,
      center,
      zoom,
      bearing,
      pitch,
      attributionControl: false,
      preserveDrawingBuffer,
      ...(reducedMotion ? { fadeDuration: 0 } : {}),
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: MAP_NUMERIC.scaleMaxWidth }), "bottom-left");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left",
    );

    const handleMapError = (event: { error?: unknown; sourceId?: unknown; status?: unknown; preventDefault?: () => void }) => {
      if (tearingDownRef.current && isAbortLikeError(event.error)) {
        event.preventDefault?.();
        return;
      }

      const message = renderErrorMessage(event);
      if (message) {
        onRenderError?.(message);
      }
    };

    map.on("error", handleMapError);

    map.on("mousemove", (e) => {
      pendingCursorRef.current = {
        lng: +e.lngLat.lng.toFixed(6),
        lat: +e.lngLat.lat.toFixed(6),
      };
      if (cursorFrameRef.current != null) return;
      cursorFrameRef.current = window.requestAnimationFrame(() => {
        cursorFrameRef.current = null;
        const pendingCursor = pendingCursorRef.current;
        pendingCursorRef.current = null;
        if (pendingCursor) {
          cursorMoveRef.current(pendingCursor);
        }
      });
    });

    map.on("zoomend", () => {
      onZoomChange(+map.getZoom().toFixed(2));
    });

    map.on("moveend", (e: { originalEvent?: unknown } | undefined) => {
      const c = map.getCenter();
      onViewportChange(
        {
          center: [+c.lng.toFixed(6), +c.lat.toFixed(6)],
          zoom: +map.getZoom().toFixed(2),
          bearing: +map.getBearing().toFixed(2),
          pitch: +map.getPitch().toFixed(2),
        },
        { userInitiated: e?.originalEvent != null },
      );
    });

    map.on("click", (e) => {
      if (pinModeRef.current) {
        onMapClick({
          lng: +e.lngLat.lng.toFixed(6),
          lat: +e.lngLat.lat.toFixed(6),
        });
        return;
      }

      const queryableLayerIds = interactiveLayerIdsRef.current.filter((layerId) => Boolean(map.getLayer(layerId)));
      if (queryableLayerIds.length === 0) {
        popupRef.current?.remove();
        popupRef.current = null;
        if (viewportModeRef.current !== 'controlled') {
          useMapExplorerStore.getState().clearSelectedFeatures();
        }
        return;
      }

      const feature = map
        .queryRenderedFeatures(e.point, { layers: queryableLayerIds })
        .find((candidate) => buildFeaturePopupHtml(candidate.properties as Record<string, unknown> | undefined) != null);
      const popupHtml = buildFeaturePopupHtml(feature?.properties as Record<string, unknown> | undefined);

      if (!feature || !popupHtml) {
        popupRef.current?.remove();
        popupRef.current = null;
        if (viewportModeRef.current !== 'controlled') {
          useMapExplorerStore.getState().clearSelectedFeatures();
        }
        return;
      }

      const properties = feature.properties as Record<string, unknown> | undefined;
      const sourceLayerId = (feature as { source?: string }).source ?? feature.layer.id;
      const featureId = String(
        feature.id ??
          properties?.id ??
          properties?.feature_id ??
          properties?.detection_id ??
          properties?.cell_id ??
          properties?.agent_id ??
          properties?.name ??
          `${sourceLayerId}-feature`,
      );
      if (viewportModeRef.current !== 'controlled') {
        const store = useMapExplorerStore.getState();
        store.setSelectedFeatures(sourceLayerId, [featureId]);
        store.setActiveAnalysisResultLayers([sourceLayerId]);
      }

      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({ offset: MAP_NUMERIC.popupOffset, closeButton: true })
        .setLngLat(e.lngLat)
        .setHTML(popupHtml)
        .addTo(map);
      const reportButton = popupRef.current.getElement()?.querySelector<HTMLButtonElement>("[data-map-feature-report]");
      reportButton?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        featureReportRequestRef.current?.({
          layerId: sourceLayerId,
          featureId,
          properties: properties ?? {},
          coordinate: [+e.lngLat.lng.toFixed(6), +e.lngLat.lat.toFixed(6)],
        });
      });
    });

    mapRef.current = map;
    onMapReady(map);

    return () => {
      if (tearingDownRef.current) {
        return;
      }

      tearingDownRef.current = true;
      mapRef.current = null;
      if (cursorFrameRef.current != null) {
        window.cancelAnimationFrame(cursorFrameRef.current);
        cursorFrameRef.current = null;
      }
      pendingCursorRef.current = null;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      popupRef.current?.remove();
      popupRef.current = null;
      try {
        map.remove();
      } catch (error) {
        if (!isAbortLikeError(error)) {
          throw error;
        }
      }
      onMapDestroy();
    };
  }, [preserveDrawingBuffer]);

  /* ---- Switch base layer ---- */
  useEffect(() => {
    if (!mapRef.current) return;
    // Skip the first run — the map constructor already used this style URL
    if (initialBaseLayerRef.current === baseLayer) {
      initialBaseLayerRef.current = null;
      return;
    }
    mapRef.current.setStyle(BASE_STYLES[baseLayer].url);
  }, [baseLayer]);

  /* ---- Sync markers ---- */
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const pin of pins) {
      const el = createPinElement(pin.label ?? `${pin.lat}, ${pin.lng}`);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(
            `<div style="padding:${MAP_SPACING.xs} ${MAP_SPACING.sm};font-size:${MAP_TYPOGRAPHY.fontSize.xs};color:${MAP_COLORS.textSecondary}"><b>${pin.label ?? "Pin"}</b><br/>${pin.lat}, ${pin.lng}</div>`,
          ),
        )
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    }
  }, [pins]);

  return (
    <div
      id={id}
      role="application"
      aria-label="Interactive map canvas — use Arrow keys to pan, +/− to zoom, R to reset view"
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight + - R"
      aria-roledescription="map"
      data-map-keyboard-scope="true"
      style={{ position: "absolute", inset: MAP_SPACING.zero }}
      ref={containerRef}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- map canvas needs focus for keyboard navigation
      tabIndex={0}
    />
  );
};
