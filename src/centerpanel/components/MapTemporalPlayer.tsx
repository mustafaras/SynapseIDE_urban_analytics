/* ================================================================== */
/*  MapTemporalPlayer — Time-series animation & playback controls      */
/*  Temporal Animation & Time-Series Playback                          */
/*                                                                     */
/*  Renders a glassmorphic player bar at the bottom of the map with    */
/*  a timeline scrubber, playback controls, speed selector, and a      */
/*  prominent time label overlay. Drives GeoJSON source updates on     */
/*  the MapLibre map instance via requestAnimationFrame.               */
/* ================================================================== */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type maplibregl from "maplibre-gl";
import type { MapTemporalEvidenceMetadata, PlaybackSpeed } from "./map/mapTypes";
import { createMapTemporalEvidenceArtifact } from "./map/mapEvidenceArtifacts";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";
import { type MapExplorerState, useMapExplorerStore } from "../../stores/useMapExplorerStore";

/* ================================================================== */
/*  Public types                                                       */
/* ================================================================== */

/** A single timestep frame — either a full snapshot or extracted from continuous data */
export interface TemporalFrame {
  /** Unique timestep key (ISO 8601, unix ts, or integer index) */
  key: string;
  /** Human-readable label for the time label overlay */
  label: string;
  /** GeoJSON FeatureCollection for this timestep */
  data: GeoJSON.FeatureCollection;
}

export interface MapTemporalPlayerProps {
  /** Reference to the live MapLibre map instance */
  map: maplibregl.Map | null;
  /**
   * **Snapshot mode**: provide pre-split frames directly.
   * Mutually exclusive with `featureCollection` + `timeProperty`.
   */
  frames?: TemporalFrame[];
  /**
   * **Continuous mode**: a single FeatureCollection whose features carry
   * temporal attributes. Combined with `timeProperty` to auto-extract frames.
   */
  featureCollection?: GeoJSON.FeatureCollection;
  /** Property name on each Feature that holds the temporal value (default: "timestamp") */
  timeProperty?: string;
  /** MapLibre source ID to update with `setData()` (default: "temporal-source") */
  sourceId?: string;
  /** MapLibre layer ID (created automatically if absent) */
  layerId?: string;
  /** Human-readable map layer name shown in the compact player rail */
  layerName?: string;
  /** Whether the player bar is visible */
  visible?: boolean;
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 4];
const BASE_FRAME_INTERVAL_MS = 66;

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

/** Parse a temporal property value into a sortable number */
function parseTime(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const d = Date.parse(value);
    if (!Number.isNaN(d)) return d;
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

/** Build sorted frames from a FeatureCollection with a time property */
function buildFramesFromCollection(
  fc: GeoJSON.FeatureCollection,
  timeProp: string,
): TemporalFrame[] {
  // Group features by their temporal value
  const groups = new Map<string, GeoJSON.Feature[]>();
  for (const f of fc.features) {
    const raw =
      f.properties?.[timeProp] ??
      (timeProp !== "timestamp" ? f.properties?.timestamp : undefined) ??
      (timeProp !== "time_step" ? f.properties?.time_step : undefined);
    if (raw == null) {
      continue;
    }
    const key = String(raw ?? "");
    let arr = groups.get(key);
    if (!arr) {
      arr = [];
      groups.set(key, arr);
    }
    arr.push(f);
  }

  // Sort keys by parsed numeric time
  const sorted = [...groups.entries()].sort(
    (a, b) => parseTime(a[0]) - parseTime(b[0]),
  );

  return sorted.map(([key, features]) => ({
    key,
    label: formatLabel(key),
    data: { type: "FeatureCollection" as const, features },
  }));
}

/** Format a temporal key into a human-readable label */
function formatLabel(key: string): string {
  const n = Number(key);
  // Integer step index
  if (Number.isInteger(n) && n >= 0 && n < 100_000) return `Step ${n}`;
  // Unix timestamp (seconds or ms)
  if (!Number.isNaN(n) && n > 1e9) {
    const ms = n > 1e12 ? n : n * 1000;
    return new Date(ms).toLocaleString();
  }
  // ISO string
  const d = Date.parse(key);
  if (!Number.isNaN(d)) return new Date(d).toLocaleString();
  return key;
}

function humanizeTemporalLabel(label: string | undefined): string {
  const trimmed = label?.trim() ?? "";
  if (!trimmed) return "Frame";
  if (/^step\s+\d+$/i.test(trimmed)) return trimmed;

  const readable = trimmed
    .replace(/^_+/, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\banalysis\b/i, "Analysis")
    .replace(/\s+/g, " ")
    .trim();

  if (!readable) return "Frame";
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function compactTemporalLabel(label: string, maxLength = 30): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 3)}...`;
}

function safeTemporalEvidencePart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "temporal";
}

function collectTemporalSourceFields(frames: readonly TemporalFrame[], timeProperty: string): string[] {
  const fields = new Set<string>();
  for (const frame of frames) {
    for (const feature of frame.data.features) {
      for (const key of Object.keys(feature.properties ?? {})) {
        if (key.trim()) fields.add(key);
        if (fields.size >= 24) break;
      }
      if (fields.size >= 24) break;
    }
    if (fields.size >= 24) break;
  }
  if (timeProperty.trim()) fields.add(timeProperty);
  return [...fields].sort((left, right) => left.localeCompare(right));
}

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

/* ================================================================== */
/*  Inline SVG icons for playback controls                             */
/* ================================================================== */

const IconPlay: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = "currentColor",
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 2.5V13.5L13 8Z" fill={color} />
  </svg>
);

const IconPause: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = "currentColor",
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="3" y="2" width="3.5" height="12" rx="0.8" fill={color} />
    <rect x="9.5" y="2" width="3.5" height="12" rx="0.8" fill={color} />
  </svg>
);

const IconStepBack: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = "currentColor",
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M12 2.5V13.5L5 8Z" fill={color} />
    <rect x="3" y="3" width="2" height="10" rx="0.5" fill={color} />
  </svg>
);

const IconStepForward: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = "currentColor",
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 2.5V13.5L11 8Z" fill={color} />
    <rect x="11" y="3" width="2" height="10" rx="0.5" fill={color} />
  </svg>
);

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const playerBarStyle: React.CSSProperties = {
  position: "absolute",
  bottom: `calc(${MAP_SPACING.xl} + ${MAP_SPACING.xs})`,
  left: MAP_SPACING.zero,
  right: MAP_SPACING.zero,
  zIndex: 15,
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minWidth: MAP_SPACING.zero,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  background: MAP_COLORS.bgPanel,
  borderTop: MAP_STROKES.hairlineSubtle,
  borderBottom: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.none,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  transition: MAP_TRANSITIONS.fast,
};

const timeLabelOverlayStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: "4.25rem",
  transform: "translateX(-50%)",
  zIndex: 16,
  maxWidth: "min(32rem, calc(100% - 2rem))",
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textAlign: "center",
  pointerEvents: "none",
};

const controlRowStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  flexShrink: 0,
};

const controlBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: MAP_SPACING.xl,
  height: MAP_SPACING.xl,
  padding: 0,
  border: MAP_STROKES.none,
  borderRadius: MAP_RADIUS.sm,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  transition: MAP_TRANSITIONS.fast,
  flexShrink: 0,
};

const controlBtnActiveStyle: React.CSSProperties = {
  ...controlBtnStyle,
  color: MAP_COLORS.amber,
};

const controlBtnDisabledStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  cursor: "default",
  opacity: 0.45,
};

const playerLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  flex: "0 1 auto",
  overflow: "hidden",
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  whiteSpace: "nowrap",
};

const playerKickerStyle: React.CSSProperties = {
  color: MAP_COLORS.amberSoft,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
  flexShrink: 0,
};

const playerValueStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const mutedDividerStyle: React.CSSProperties = {
  color: MAP_COLORS.amberHairline,
  flexShrink: 0,
};

const speedBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 22,
  padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
  border: MAP_STROKES.none,
  borderBottom: `1px solid ${MAP_COLORS.transparent}`,
  borderRadius: MAP_RADIUS.none,
  background: "transparent",
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  cursor: "pointer",
  transition: MAP_TRANSITIONS.fast,
  flexShrink: 0,
};

const speedBtnActiveStyle: React.CSSProperties = {
  ...speedBtnStyle,
  borderBottom: `1px solid ${MAP_COLORS.amber}`,
  color: MAP_COLORS.amber,
};

const scrubberShellStyle: React.CSSProperties = {
  flex: 1,
  minWidth: "8rem",
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const scrubberTrackStyle: React.CSSProperties = {
  position: "relative",
  height: MAP_SPACING.xs,
  background: MAP_COLORS.amberHairline,
  borderRadius: MAP_RADIUS.full,
  cursor: "pointer",
  touchAction: "none",
};

const scrubberFillStyle = (pct: number): React.CSSProperties => ({
  position: "absolute",
  left: 0,
  top: 0,
  height: "100%",
  width: `${pct}%`,
  background: MAP_COLORS.amber,
  borderRadius: MAP_RADIUS.full,
  pointerEvents: "none",
  transition: "none",
});

const scrubberThumbStyle = (pct: number): React.CSSProperties => ({
  position: "absolute",
  left: `${pct}%`,
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: MAP_SPACING.sm,
  height: MAP_SPACING.sm,
  borderRadius: "50%",
  background: MAP_COLORS.amber,
  border: MAP_STROKES.none,
  boxShadow: MAP_STROKES.none,
  pointerEvents: "none",
});

const scrubberTickRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  lineHeight: 1.1,
};

const scrubberTickTextStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapTemporalPlayer: React.FC<MapTemporalPlayerProps> = ({
  map,
  frames: framesProp,
  featureCollection,
  timeProperty = "timestamp",
  sourceId = "temporal-source",
  layerId = "temporal-layer",
  layerName,
  visible = true,
}) => {
  /* ---- Resolve frames ---- */
  const resolvedFrames = useMemo<TemporalFrame[]>(() => {
    if (framesProp && framesProp.length > 0) return framesProp;
    if (featureCollection && featureCollection.features.length > 0) {
      return buildFramesFromCollection(featureCollection, timeProperty);
    }
    return [];
  }, [framesProp, featureCollection, timeProperty]);

  const totalSteps = resolvedFrames.length;

  /* ---- Store bindings ---- */
  const currentTimestep = useMapExplorerStore((s: MapExplorerState) => s.currentTimestep);
  const isPlaying = useMapExplorerStore((s: MapExplorerState) => s.isPlaying);
  const playbackSpeed = useMapExplorerStore((s: MapExplorerState) => s.playbackSpeed);
  const setCurrentTimestep = useMapExplorerStore((s: MapExplorerState) => s.setCurrentTimestep);
  const setIsPlaying = useMapExplorerStore((s: MapExplorerState) => s.setIsPlaying);
  const setPlaybackSpeed = useMapExplorerStore((s: MapExplorerState) => s.setPlaybackSpeed);
  const setTimeRange = useMapExplorerStore((s: MapExplorerState) => s.setTimeRange);
  const upsertMapEvidenceArtifact = useMapExplorerStore((s: MapExplorerState) => s.upsertMapEvidenceArtifact);
  const evidenceCreatedAtRef = useRef<string>(new Date().toISOString());

  /* Sync time range when frames change */
  useEffect(() => {
    if (totalSteps > 0) {
      setTimeRange({ start: 0, end: totalSteps });
    }
  }, [totalSteps, setTimeRange]);

  /* Clamp current timestep to valid range */
  const clampedStep = Math.max(0, Math.min(currentTimestep, totalSteps - 1));
  const currentFrame = resolvedFrames[clampedStep] ?? null;
  const pct = totalSteps > 1 ? (clampedStep / (totalSteps - 1)) * 100 : 0;
  const sourceFields = useMemo(
    () => collectTemporalSourceFields(resolvedFrames, timeProperty),
    [resolvedFrames, timeProperty],
  );

  const temporalEvidenceMetadata = useMemo<MapTemporalEvidenceMetadata | null>(() => {
    if (totalSteps === 0) return null;
    const firstFrame = resolvedFrames[0];
    const lastFrame = resolvedFrames[totalSteps - 1];
    const temporalEvidenceId = `temporal-${safeTemporalEvidencePart(sourceId)}-${safeTemporalEvidencePart(layerId)}`;
    const frameInterval = BASE_FRAME_INTERVAL_MS / playbackSpeed;
    const caveats = [
      "Temporal playback evidence records frame references and parameters only; frame geometries remain in the MapLibre source.",
      "Playback order is derived from frame keys or the declared time property and should be reviewed before causal interpretation.",
    ];

    const metadata: MapTemporalEvidenceMetadata = {
      version: 1,
      temporalEvidenceId,
      mode: framesProp && framesProp.length > 0 ? "snapshot" : "continuous",
      activeLayerId: layerId,
      frameCount: totalSteps,
      timeRange: {
        startIndex: 0,
        endIndex: Math.max(totalSteps - 1, 0),
        ...(firstFrame?.key ? { startKey: firstFrame.key } : {}),
        ...(lastFrame?.key ? { endKey: lastFrame.key } : {}),
        ...(firstFrame?.label ? { startLabel: firstFrame.label } : {}),
        ...(lastFrame?.label ? { endLabel: lastFrame.label } : {}),
      },
      step: {
        index: clampedStep,
        ...(currentFrame?.key ? { key: currentFrame.key } : {}),
        ...(currentFrame?.label ? { label: currentFrame.label } : {}),
      },
      sourceFields,
      ...(timeProperty ? { timeField: timeProperty } : {}),
      playback: {
        speed: playbackSpeed,
        isPlaying,
        frameAdvanceMs: frameInterval,
      },
      playbackParameters: {
        sourceId,
        layerId,
        timeProperty,
        playbackSpeed,
        frameAdvanceMs: frameInterval,
        prefetchFrames: 2,
      },
      layerReferences: {
        activeLayerId: layerId,
        sourceId,
        layerId,
        sourceLayerIds: [],
      },
      reportExportFrameReference: {
        frameIndex: clampedStep,
        sourceId,
        layerId,
        ...(currentFrame?.key ? { frameKey: currentFrame.key } : {}),
        ...(currentFrame?.label ? { frameLabel: currentFrame.label } : {}),
      },
      qa: {
        state: sourceFields.length > 0 ? "warning" : "unchecked",
        caveats,
        uncertaintyNotes: [
          "Temporal frames are visual playback states; statistical change claims require a separate validated method.",
        ],
      },
      caveats,
    };
    if (layerName?.trim()) metadata.layerName = layerName.trim();
    return metadata;
  }, [
    clampedStep,
    currentFrame?.key,
    currentFrame?.label,
    framesProp,
    isPlaying,
    layerId,
    layerName,
    playbackSpeed,
    resolvedFrames,
    sourceFields,
    sourceId,
    timeProperty,
    totalSteps,
  ]);

  useEffect(() => {
    if (!visible || !temporalEvidenceMetadata) return;
    upsertMapEvidenceArtifact(createMapTemporalEvidenceArtifact({
      temporal: temporalEvidenceMetadata,
      createdAt: evidenceCreatedAtRef.current,
      updatedAt: new Date().toISOString(),
    }));
  }, [temporalEvidenceMetadata, upsertMapEvidenceArtifact, visible]);

  /* ---- Prefetch buffer: keep current + next frame refs ---- */
  const prefetchRef = useRef<{
    current: GeoJSON.FeatureCollection;
    next: GeoJSON.FeatureCollection;
    currentIdx: number;
  }>({ current: EMPTY_FC, next: EMPTY_FC, currentIdx: -1 });

  useEffect(() => {
    if (totalSteps === 0) return;
    const idx = clampedStep;
    if (prefetchRef.current.currentIdx !== idx) {
      prefetchRef.current.current = resolvedFrames[idx]?.data ?? EMPTY_FC;
      prefetchRef.current.next =
        resolvedFrames[Math.min(idx + 1, totalSteps - 1)]?.data ?? EMPTY_FC;
      prefetchRef.current.currentIdx = idx;
    }
  }, [clampedStep, resolvedFrames, totalSteps]);

  /* ---- Ensure MapLibre source + layer exist ---- */
  const sourceReady = useRef(false);
  const createdSourceRef = useRef(false);
  const createdLayerRef = useRef(false);

  const ensureSourceAndLayer = useCallback(() => {
    if (!map) return;
    try {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "geojson",
          data: EMPTY_FC,
        });
        createdSourceRef.current = true;
      }
      if (!map.getLayer(layerId)) {
        // Auto-detect a sensible default layer type from first frame
        const firstFeature = resolvedFrames[0]?.data?.features?.[0];
        const geomType = firstFeature?.geometry?.type;
        if (geomType === "Point" || geomType === "MultiPoint") {
          map.addLayer({
            id: layerId,
            type: "circle",
            source: sourceId,
            paint: {
              "circle-radius": 5,
              "circle-color": MAP_COLORS.amber,
              "circle-opacity": 0.85,
            },
          });
          createdLayerRef.current = true;
        } else if (
          geomType === "LineString" ||
          geomType === "MultiLineString"
        ) {
          map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": MAP_COLORS.amber,
              "line-width": 2,
              "line-opacity": 0.85,
            },
          });
          createdLayerRef.current = true;
        } else {
          map.addLayer({
            id: layerId,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": MAP_COLORS.amber,
              "fill-opacity": 0.4,
              "fill-outline-color": MAP_COLORS.amber,
            },
          });
          createdLayerRef.current = true;
        }
      }
      sourceReady.current = true;
    } catch {
      // map style may not be loaded yet — retry on next frame
    }
  }, [map, sourceId, layerId, resolvedFrames]);

  /* Create source when map loads or style changes */
  useEffect(() => {
    if (!map) return;
    const setup = () => ensureSourceAndLayer();
    if (map.isStyleLoaded()) {
      setup();
    }
    map.on("styledata", setup);
    return () => {
      map.off("styledata", setup);
    };
  }, [map, ensureSourceAndLayer]);

  /* ---- Push data to map when timestep changes ---- */
  useEffect(() => {
    if (!map || !sourceReady.current || totalSteps === 0) return;
    const src = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(currentFrame?.data ?? EMPTY_FC);
    }
  }, [map, sourceId, clampedStep, currentFrame, totalSteps]);

  /* ---- Animation loop ---- */
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || totalSteps <= 1) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    // Target interval: base ~15 FPS divided by speed
    const intervalMs = BASE_FRAME_INTERVAL_MS / playbackSpeed;

    const tick = (now: number) => {
      const elapsed = now - lastFrameTimeRef.current;
      if (elapsed >= intervalMs) {
        lastFrameTimeRef.current = now - (elapsed % intervalMs);
        const { currentTimestep: cur } = useMapExplorerStore.getState();
        const next = cur + 1;
        if (next >= totalSteps) {
          // Reached the end — stop playback
          setIsPlaying(false);
          return;
        }
        setCurrentTimestep(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    lastFrameTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, totalSteps, setCurrentTimestep, setIsPlaying]);

  /* ---- Keyboard shortcuts ---- */
  useEffect(() => {
    if (!visible || totalSteps === 0) return;

    const handler = (e: KeyboardEvent) => {
      // Don't intercept if focus is in an input / textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;

      switch (e.key) {
        case " ": {
          e.preventDefault();
          const { isPlaying: playing } = useMapExplorerStore.getState();
          setIsPlaying(!playing);
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (e.shiftKey) {
            // Decrease speed
            const { playbackSpeed: spd } = useMapExplorerStore.getState();
            const idx = SPEEDS.indexOf(spd);
            if (idx > 0) setPlaybackSpeed(SPEEDS[idx - 1]);
          } else {
            // Step backward
            const { currentTimestep: cur } = useMapExplorerStore.getState();
            if (cur > 0) {
              setIsPlaying(false);
              setCurrentTimestep(cur - 1);
            }
          }
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (e.shiftKey) {
            // Increase speed
            const { playbackSpeed: spd } = useMapExplorerStore.getState();
            const idx = SPEEDS.indexOf(spd);
            if (idx < SPEEDS.length - 1) setPlaybackSpeed(SPEEDS[idx + 1]);
          } else {
            // Step forward
            const { currentTimestep: cur } = useMapExplorerStore.getState();
            if (cur < totalSteps - 1) {
              setIsPlaying(false);
              setCurrentTimestep(cur + 1);
            }
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    visible,
    totalSteps,
    setIsPlaying,
    setCurrentTimestep,
    setPlaybackSpeed,
  ]);

  /* ---- Scrubber interaction ---- */
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const stepFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current || totalSteps <= 1) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const step = Math.round(ratio * (totalSteps - 1));
      setCurrentTimestep(step);
    },
    [totalSteps, setCurrentTimestep],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      setIsPlaying(false);
      stepFromPointer(e.clientX);
    },
    [stepFromPointer, setIsPlaying],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      stepFromPointer(e.clientX);
    },
    [isDragging, stepFromPointer],
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /* ---- Cleanup source/layer on unmount ---- */
  useEffect(() => {
    return () => {
      if (!map) return;
      try {
        if (createdLayerRef.current && map.getLayer(layerId)) map.removeLayer(layerId);
        if (createdSourceRef.current && map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // map already removed
      }
      createdLayerRef.current = false;
      createdSourceRef.current = false;
      sourceReady.current = false;
    };
  }, [map, layerId, sourceId]);

  /* ---- Render ---- */
  if (!visible || totalSteps === 0) return null;

  const readableLayerName = compactTemporalLabel(
    humanizeTemporalLabel(layerName),
    28,
  );
  const readableFrameLabel = compactTemporalLabel(
    humanizeTemporalLabel(currentFrame?.label ?? `Step ${clampedStep + 1}`),
    34,
  );
  const fullFrameLabel = humanizeTemporalLabel(currentFrame?.label ?? `Step ${clampedStep + 1}`);
  const firstFrameLabel = compactTemporalLabel(
    humanizeTemporalLabel(resolvedFrames[0]?.label ?? "Start"),
    18,
  );
  const lastFrameLabel = compactTemporalLabel(
    humanizeTemporalLabel(resolvedFrames[totalSteps - 1]?.label ?? "End"),
    18,
  );

  return (
    <>
    <div style={timeLabelOverlayStyle} aria-live="polite" aria-atomic="true">
      {fullFrameLabel}
    </div>

    <div
      style={playerBarStyle}
      role="region"
      aria-label="Temporal animation player"
    >
      <div style={controlRowStyle}>
          <button
            type="button"
            style={{
              ...controlBtnStyle,
              ...(clampedStep <= 0 ? controlBtnDisabledStyle : null),
            }}
            onClick={() => {
              if (clampedStep > 0) {
                setIsPlaying(false);
                setCurrentTimestep(clampedStep - 1);
              }
            }}
            disabled={clampedStep <= 0}
            aria-label="Step backward"
            title="Step backward (Left arrow)"
          >
            <IconStepBack size={12} />
          </button>

          <button
            type="button"
            style={isPlaying ? controlBtnActiveStyle : controlBtnStyle}
            onClick={() => {
              // If at end, restart from beginning
              if (!isPlaying && clampedStep >= totalSteps - 1) {
                setCurrentTimestep(0);
              }
              setIsPlaying(!isPlaying);
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <IconPause size={12} /> : <IconPlay size={12} />}
          </button>

          <button
            type="button"
            style={{
              ...controlBtnStyle,
              ...(clampedStep >= totalSteps - 1 ? controlBtnDisabledStyle : null),
            }}
            onClick={() => {
              if (clampedStep < totalSteps - 1) {
                setIsPlaying(false);
                setCurrentTimestep(clampedStep + 1);
              }
            }}
            disabled={clampedStep >= totalSteps - 1}
            aria-label="Step forward"
            title="Step forward (Right arrow)"
          >
            <IconStepForward size={12} />
          </button>
      </div>

      <div style={playerLabelStyle} aria-live="polite" aria-atomic="true">
        <span style={playerKickerStyle}>Temporal</span>
        <span style={mutedDividerStyle}>/</span>
        <span style={playerValueStyle} title={layerName}>{readableLayerName}</span>
        <span style={mutedDividerStyle}>/</span>
        <span style={playerValueStyle} title={fullFrameLabel}>{readableFrameLabel}</span>
      </div>

      <div style={scrubberShellStyle}>
        <div
          ref={trackRef}
          style={scrubberTrackStyle}
          role="slider"
          aria-label="Timeline scrubber"
          aria-valuemin={0}
          aria-valuemax={totalSteps - 1}
          aria-valuenow={clampedStep}
          aria-valuetext={fullFrameLabel}
          tabIndex={0}
          title={`${fullFrameLabel} (${clampedStep + 1}/${totalSteps})`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div style={scrubberFillStyle(pct)} />
          <div style={scrubberThumbStyle(pct)} />
        </div>
        <div style={scrubberTickRowStyle} aria-hidden="true">
          <span style={{ ...scrubberTickTextStyle, textAlign: "left" }} title={humanizeTemporalLabel(resolvedFrames[0]?.label)}>
            {firstFrameLabel}
          </span>
          <span style={{ ...scrubberTickTextStyle, color: MAP_COLORS.amberSoft }} title={fullFrameLabel}>
            {clampedStep + 1}/{totalSteps}
          </span>
          <span style={{ ...scrubberTickTextStyle, textAlign: "right" }} title={humanizeTemporalLabel(resolvedFrames[totalSteps - 1]?.label)}>
            {lastFrameLabel}
          </span>
        </div>
      </div>

      <div style={controlRowStyle} aria-label="Playback speed">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            style={playbackSpeed === speed ? speedBtnActiveStyle : speedBtnStyle}
            onClick={() => setPlaybackSpeed(speed)}
            aria-label={`Set speed to ${speed}x`}
            aria-pressed={playbackSpeed === speed}
          >
            {speed}x
          </button>
        ))}
      </div>

      <span style={{ ...playerLabelStyle, flex: "0 0 auto" }}>
        {clampedStep + 1}/{totalSteps}
      </span>
    </div>
    </>
  );
};
