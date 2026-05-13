/**
 * SunlightSimulatorPanel — Full UI for the Sunlight & Solar Exposure tool.
 *
 * Sections:
 *   1. Simulation Config (date, time range, interval, location)
 *   2. Shadow Animation Controls (play/pause, scrubber, frame info)
 *   3. Shadow Heatmap Overlay (canvas-based 2D shadow grid visualisation)
 *   4. Solar Exposure Summary (per-building table)
 *   5. Export Controls (CSV shadow map, JSON exposure data)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { useSunlightSimStore } from "./hooks/useSunlightSim";
import { useCityJSONScene } from "./hooks/useCityJSONScene";
import {
  buildingExposureSummary,
  exportBuildingJSON,
  exportGridCSV,
  runSimulation,
} from "./SunlightSimulator";
import type {
  BuildingExposureSummary as BES,
  BuildingVolume,
  SunlightResult,
} from "./sunlightTypes";
import {
  buildSunlightPublicationCollection,
  resolveVoxCityCityJSONSource,
  resolveVoxCityMapLayerSource,
  resolveVoxCitySampleSource,
  useVoxCityBridgeStore,
  type VoxCityResolvedSource,
} from "./voxCityDataBridge";
import {
  buildVoxCityScenarioArtifactIds,
  registerVoxCityScenarioEvidence,
} from "../context/voxCityEvidenceBuilder";
import { type MapExplorerState, useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { useFlowStore } from "@/stores/useFlowStore";
import { useUrbanContextStore } from "../useUrbanContextStore";
import NarrativeGenerationPanel from "@/centerpanel/components/NarrativeGenerationPanel";
import { buildSunlightNarrativeInput } from "@/centerpanel/Flows/narrativeBuilders";
import {
  adaptFeatureCollectionAnalysisResult,
  createAnalysisCompletedRun,
  createAnalysisMapOutput,
} from "@/services/map/MapEngineAdapter";
import {
  buildMapVoxCitySyncMetadata,
  type BuildMapVoxCitySyncMetadataInput,
} from "@/services/map/voxCitySelectionService";
import { createMapVoxCityHandoffEvidenceArtifact } from "@/centerpanel/components/map/mapEvidenceArtifacts";

/* ================================================================== */
/*  §1  STYLES (Charcoal-Amber design system)                        */
/* ================================================================== */

const PANEL: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: "980px",
  background: "#0d0d0d",
  color: "#FAFAF9",
  fontFamily: "var(--font-sans, system-ui, sans-serif)",
  position: "relative",
  overflow: "hidden",
};

const MAIN_BODY: React.CSSProperties = {
  flex: 1,
  display: "flex",
  minHeight: "780px",
  position: "relative",
};

const SCENE_VIEWPORT: React.CSSProperties = {
  flex: 1,
  position: "relative",
  minHeight: "780px",
};

const TOOLBAR: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  background: "#1a1a1a",
  borderBottom: "1px solid #333",
  flexShrink: 0,
  flexWrap: "wrap",
  zIndex: 10,
};

const LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  color: "#F59E0B",
};

const BTN: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: "4px",
  border: "1px solid #444",
  background: "#262626",
  color: "#e0e0e0",
  cursor: "pointer",
  fontSize: "12px",
  transition: "background 0.15s, border-color 0.15s",
};

const BTN_ACTIVE: React.CSSProperties = {
  ...BTN,
  background: "#F59E0B",
  color: "#1a1a1a",
  borderColor: "#F59E0B",
  fontWeight: 600,
};

const BTN_DISABLED: React.CSSProperties = {
  ...BTN,
  opacity: 0.4,
  cursor: "not-allowed",
};

const INPUT: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "4px",
  border: "1px solid #444",
  background: "#262626",
  color: "#e0e0e0",
  fontSize: "12px",
  width: "100px",
};

const SELECT: React.CSSProperties = {
  ...INPUT,
  cursor: "pointer",
  width: "auto",
};

const SIDEBAR: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  width: "360px",
  background: "#1a1a1a",
  borderLeft: "1px solid #333",
  padding: "12px",
  overflowY: "auto",
  zIndex: 15,
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#F59E0B",
  marginBottom: "6px",
  borderBottom: "1px solid #333",
  paddingBottom: "4px",
};

const FIELD_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "12px",
};

const FIELD_LABEL: React.CSSProperties = {
  fontSize: "11px",
  color: "#A8A29E",
  minWidth: "70px",
};

const OVERLAY: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(13,13,13,0.85)",
  zIndex: 20,
  gap: "12px",
};

const PROGRESS_BG: React.CSSProperties = {
  width: "220px",
  height: "6px",
  borderRadius: "3px",
  background: "#333",
  overflow: "hidden",
};

const TABLE: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "11px",
};

const TH: React.CSSProperties = {
  textAlign: "left" as const,
  padding: "4px 6px",
  borderBottom: "1px solid #333",
  color: "#F59E0B",
  fontWeight: 600,
  fontSize: "10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const TD: React.CSSProperties = {
  padding: "4px 6px",
  borderBottom: "1px solid #222",
  color: "#D6D3D1",
};

const INFO_BOX: React.CSSProperties = {
  position: "absolute",
  bottom: "12px",
  left: "12px",
  padding: "8px 12px",
  background: "rgba(26,26,26,0.9)",
  borderRadius: "6px",
  fontSize: "11px",
  color: "#D6D3D1",
  lineHeight: 1.5,
  zIndex: 15,
  maxWidth: "280px",
};

const LEGEND_BAR: React.CSSProperties = {
  position: "absolute",
  bottom: "48px",
  left: "12px",
  zIndex: 15,
  background: "rgba(26,26,26,0.9)",
  borderRadius: "6px",
  padding: "6px 10px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  maxWidth: "200px",
};

const STAT_CARD: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  padding: "8px 10px",
  background: "#262626",
  borderRadius: "6px",
  border: "1px solid #333",
  fontSize: "11px",
};

const STAT_VALUE: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#F59E0B",
  lineHeight: 1.1,
};

const STAT_UNIT: React.CSSProperties = {
  fontSize: "10px",
  color: "#A8A29E",
  marginTop: "2px",
};

const EMPTY_STATE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  background: "rgba(13,13,13,0.6)",
  zIndex: 5,
  textAlign: "center",
  padding: "24px",
};

const SOURCE_INFO_BOX: React.CSSProperties = {
  position: "absolute",
  top: "12px",
  left: "12px",
  padding: "10px 12px",
  background: "rgba(26,26,26,0.92)",
  borderRadius: "6px",
  border: "1px solid #333",
  fontSize: "11px",
  color: "#D6D3D1",
  lineHeight: 1.5,
  zIndex: 15,
  maxWidth: "360px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

/* ================================================================== */
/*  §2  3D Building Scene (Three.js via R3F)                          */
/* ================================================================== */

interface BuildingMeshProps {
  buildings: readonly BuildingVolume[];
  shadowGrid?: Uint8Array | null;
  gridOrigin?: readonly [number, number];
  gridSize?: readonly [number, number];
  gridResolution?: number;
}

interface OrbitControlsHandle {
  target: THREE.Vector3;
  update: () => void;
}

const BuildingMeshes: React.FC<BuildingMeshProps> = ({ buildings }) => {
  const group = useRef<THREE.Group>(null);
  return (
    <group ref={group}>
      {buildings.map((b) => {
        const w = b.bbox[2] - b.bbox[0];
        const d = b.bbox[3] - b.bbox[1];
        const cx = (b.bbox[0] + b.bbox[2]) / 2;
        const cy = b.height / 2;
        const cz = (b.bbox[1] + b.bbox[3]) / 2;
        return (
          <mesh key={b.id} position={[cx, cy, cz]}>
            <boxGeometry args={[w, b.height, d]} />
            <meshStandardMaterial
              color="#78716C"
              transparent
              opacity={0.7}
            />
          </mesh>
        );
      })}
    </group>
  );
};

/** Ground plane with shadow overlay. */
const ShadowOverlayPlane: React.FC<{
  result: SunlightResult | null;
  frameIndex: number;
  mode: "cumulative" | "frame";
}> = ({ result, frameIndex, mode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.DataTexture | null>(null);

  useEffect(() => {
    if (!result) return undefined;
    const [cols, rows] = result.gridSize;
    const [_ox, _oy] = result.gridOrigin;

    const data = new Uint8Array(cols * rows * 4);

    if (mode === "cumulative") {
      // Show exposure hours as a color ramp
      const { minExposure, maxExposure } = result.stats;
      const range = maxExposure - minExposure || 1;
      for (let i = 0; i < cols * rows; i++) {
        const t = (result.exposureHours[i] - minExposure) / range;
        // Yellow (high exposure) → Blue-purple (low exposure)
        data[i * 4 + 0] = Math.round(t * 245);       // R
        data[i * 4 + 1] = Math.round(t * 158);        // G
        data[i * 4 + 2] = Math.round((1 - t) * 180);  // B
        data[i * 4 + 3] = 160;                         // A
      }
    } else {
      // Show current frame shadow
      const sample = result.samples[frameIndex];
      if (sample) {
        for (let i = 0; i < cols * rows; i++) {
          const inShadow = sample.shadowGrid[i] > 0;
          data[i * 4 + 0] = inShadow ? 20 : 245;
          data[i * 4 + 1] = inShadow ? 20 : 200;
          data[i * 4 + 2] = inShadow ? 60 : 80;
          data[i * 4 + 3] = inShadow ? 180 : 80;
        }
      }
    }

    const tex = new THREE.DataTexture(data, cols, rows, THREE.RGBAFormat);
    tex.needsUpdate = true;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    textureRef.current = tex;

    const mesh = meshRef.current as unknown as { material?: THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[] } | null;
    const mat = mesh?.material;
    if (mat && !Array.isArray(mat)) {
      mat.map = tex;
      mat.needsUpdate = true;
    }

    return () => { tex.dispose(); };
  }, [result, frameIndex, mode]);

  if (!result) return null;

  const [cols, rows] = result.gridSize;
  const [ox, oy] = result.gridOrigin;
  const res = result.gridResolution;
  const w = cols * res;
  const d = rows * res;
  const cx = ox + w / 2;
  const cz = oy + d / 2;

  return (
    <mesh ref={meshRef} position={[cx, 0.05, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** Auto-fit camera to scene. */
const CameraFitter: React.FC<{ buildings: readonly BuildingVolume[]; controlsRef?: React.RefObject<OrbitControlsHandle | null> }> = ({ buildings, controlsRef }) => {
  const { camera } = useThree();
  const lastFitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (buildings.length === 0) return;
    let minX = Number.POSITIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;
    let maxY = 0;

    for (const b of buildings) {
      minX = Math.min(minX, b.bbox[0]);
      minZ = Math.min(minZ, b.bbox[1]);
      maxX = Math.max(maxX, b.bbox[2]);
      maxZ = Math.max(maxZ, b.bbox[3]);
      maxY = Math.max(maxY, b.height);
    }

    const spanX = maxX - minX;
    const spanZ = maxZ - minZ;
    const spanY = Math.max(maxY, 1);
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const sceneDiameter = Math.max(spanX, spanZ, spanY, 1);
    const fitKey = [
      Number(cx.toFixed(4)),
      Number(cz.toFixed(4)),
      Number(spanX.toFixed(4)),
      Number(spanZ.toFixed(4)),
      Number(spanY.toFixed(4)),
    ].join("|");

    if (lastFitKeyRef.current === fitKey) {
      return;
    }
    lastFitKeyRef.current = fitKey;

    const perspectiveCamera = camera instanceof THREE.PerspectiveCamera ? camera : null;
    const fovRadians = THREE.MathUtils.degToRad(perspectiveCamera?.fov ?? 50);
    const distance = (sceneDiameter * 0.7) / Math.max(Math.tan(fovRadians / 2), 0.1);
    const targetY = Math.max(Math.min(spanY * 0.48, spanY), 2);

    camera.position.set(cx + distance * 0.82, targetY + distance * 0.52, cz + distance * 0.82);
    camera.lookAt(cx, targetY, cz);
    if (perspectiveCamera) {
      perspectiveCamera.near = Math.max(distance / 200, 0.1);
      perspectiveCamera.far = Math.max(distance * 20, 2000);
      perspectiveCamera.updateProjectionMatrix();
    }

    const controls = controlsRef?.current;
    if (controls) {
      controls.target.set(cx, targetY, cz);
      controls.update();
    }
  }, [buildings, camera, controlsRef]);
  return null;
};

function formatBBox(bbox: [number, number, number, number] | null): string {
  if (!bbox) return "n/a";
  return bbox.map((value) => value.toFixed(3)).join(", ");
}

function buildSunlightNarrative(
  source: VoxCityResolvedSource,
  result: SunlightResult,
): string {
  return [
    `${source.metadata.title} completed sunlight simulation in ${source.metadata.runtimeMode === "sample" ? "sample" : "project"} mode.`,
    `Source ref: ${source.metadata.sourceRef}. Input buildings: ${source.metadata.featureCount}.`,
    `The model evaluated ${result.sampleCount} time steps and produced ${result.totalDaylightHours.toFixed(1)} daylight hours across the configured period.`,
    `Ground exposure ranged from ${result.stats.minExposure.toFixed(1)} h to ${result.stats.maxExposure.toFixed(1)} h with a mean of ${result.stats.meanExposure.toFixed(1)} h.`,
    `Geometry assumptions: ${source.metadata.geometryAssumptions.join(" ")}`,
  ].join(" ");
}

const EMPTY_SYNC_SELECTION_IDS: string[] = [];

function optionalAttributeLabel(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function buildBuildingSyncReferences(
  source: VoxCityResolvedSource,
  selectedBuildingIds: readonly string[],
): NonNullable<BuildMapVoxCitySyncMetadataInput["buildingReferences"]> {
  if (selectedBuildingIds.length === 0) return [];
  const selectedSet = new Set(selectedBuildingIds);
  return source.features
    .filter((feature) => selectedSet.has(feature.id))
    .slice(0, 80)
    .map((feature) => {
      const label = optionalAttributeLabel(feature.attributes.name)
        ?? optionalAttributeLabel(feature.attributes.label)
        ?? feature.id;
      return {
        buildingId: feature.id,
        sourceFeatureId: feature.id,
        label,
      };
    });
}

function resolveSelectedFeatureIds(
  source: VoxCityResolvedSource,
  mapSelectedFeatureIds: readonly string[],
  selectedBuildingIds: readonly string[],
): string[] {
  if (mapSelectedFeatureIds.length > 0) return [...mapSelectedFeatureIds].slice(0, 80);
  return source.metadata.sourceLayerId ? [...selectedBuildingIds].slice(0, 80) : [];
}

/* ================================================================== */
/*  §3  Main Panel Component                                          */
/* ================================================================== */

const SunlightSimulatorPanel: React.FC = () => {
  const store = useSunlightSimStore();
  const {
    config, buildings, result, buildingSummaries, status,
    progress, error, animationFrame, animationPlaying, animationFps,
    setConfig, setBuildings, setResult, setBuildingSummaries,
    setStatus, setProgress, setError,
    setAnimationFrame, setAnimationPlaying, setAnimationFps, reset,
  } = store;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [overlayMode, setOverlayMode] = useState<"cumulative" | "frame">("frame");
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [runIdentity, setRunIdentity] = useState<{ runId: string; runTimestamp: string } | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orbitControlsRef = useRef<OrbitControlsHandle | null>(null);
  const upsertCompletedRun = useFlowStore((s) => s.upsertCompletedRun);
  const context = useUrbanContextStore((s) => s.context);
  const registerEvidenceArtifact = useUrbanContextStore((s) => s.registerEvidenceArtifact);
  const overlayLayers = useMapExplorerStore((s: MapExplorerState) => s.overlayLayers);
  const addOverlayLayer = useMapExplorerStore((s: MapExplorerState) => s.addOverlayLayer);
  const upsertMapEvidenceArtifact = useMapExplorerStore((s: MapExplorerState) => s.upsertMapEvidenceArtifact);
  const cityJSONObjects = useCityJSONScene((s) => s.objects);
  const cityJSONSummary = useCityJSONScene((s) => s.summary);
  const sunlightHandoff = useVoxCityBridgeStore((s) => s.sunlightHandoff);

  const availableSources = useMemo(() => {
    const mapSources = overlayLayers
      .filter((layer) => (layer.group ?? "data") !== "analysis")
      .map((layer) => resolveVoxCityMapLayerSource(layer))
      .filter((source): source is VoxCityResolvedSource => source !== null);
    const cityJSONSource = resolveVoxCityCityJSONSource(cityJSONObjects, cityJSONSummary);
    const combined = [
      ...(sunlightHandoff ? [sunlightHandoff.source] : []),
      ...mapSources,
      ...(cityJSONSource ? [cityJSONSource] : []),
      resolveVoxCitySampleSource(),
    ];

    return combined.filter(
      (source, index) => combined.findIndex((candidate) => candidate.metadata.id === source.metadata.id) === index,
    );
  }, [cityJSONObjects, cityJSONSummary, overlayLayers, sunlightHandoff]);

  const activeSource = useMemo(
    () => availableSources.find((source) => source.metadata.id === activeSourceId) ?? null,
    [activeSourceId, availableSources],
  );
  const mapCenter = useMapExplorerStore((s: MapExplorerState) => s.center);
  const mapZoom = useMapExplorerStore((s: MapExplorerState) => s.zoom);
  const mapBearing = useMapExplorerStore((s: MapExplorerState) => s.bearing);
  const mapPitch = useMapExplorerStore((s: MapExplorerState) => s.pitch);
  const activeAoiId = useMapExplorerStore((s: MapExplorerState) => s.activeAoiId);
  const selectedSourceFeatureIds = useMapExplorerStore((s: MapExplorerState) =>
    activeSource?.metadata.sourceLayerId
      ? s.selectedFeatureIds[activeSource.metadata.sourceLayerId] ?? EMPTY_SYNC_SELECTION_IDS
      : EMPTY_SYNC_SELECTION_IDS,
  );
  const mapViewport = useMemo(() => ({
    center: mapCenter,
    zoom: mapZoom,
    bearing: mapBearing,
    pitch: mapPitch,
  }), [mapBearing, mapCenter, mapPitch, mapZoom]);

  useEffect(() => {
    if (!sunlightHandoff) return;
    setActiveSourceId(sunlightHandoff.source.metadata.id);
  }, [sunlightHandoff]);

  useEffect(() => {
    if (availableSources.length === 0) return;
    setActiveSourceId((current) => {
      if (current && availableSources.some((source) => source.metadata.id === current)) {
        return current;
      }
      return availableSources.find((source) => source.metadata.runtimeMode === "real")?.metadata.id
        ?? availableSources[0]?.metadata.id
        ?? null;
    });
  }, [availableSources]);

  useEffect(() => {
    if (!activeSource) return;
    setBuildings(activeSource.volumes);
  }, [activeSource, setBuildings]);

  const sunlightAnalysis = useMemo(() => {
    if (!activeSource || !buildingSummaries || !result || !runIdentity) return null;
    return adaptFeatureCollectionAnalysisResult({
      engine: "SunlightSimulation",
      featureCollection: buildSunlightPublicationCollection(activeSource, buildingSummaries),
      layerId: `sunlight-simulation-${runIdentity.runId}`,
      layerName: `${activeSource.metadata.title} Solar Exposure`,
      runId: runIdentity.runId,
      runTimestamp: runIdentity.runTimestamp,
      ...(activeSource.metadata.sourceLayerId ? { sourceLayerIds: [activeSource.metadata.sourceLayerId] } : {}),
      ...(activeSource.metadata.sourceUpdatedAt ? { sourceDataVersion: activeSource.metadata.sourceUpdatedAt } : {}),
      parameters: {
        sourceId: activeSource.metadata.id,
        sourceTitle: activeSource.metadata.title,
        sourceKind: activeSource.metadata.kind,
        sourceRef: activeSource.metadata.sourceRef,
        sourceRuntimeMode: activeSource.metadata.runtimeMode,
        inputFeatureCount: activeSource.metadata.featureCount,
        gridResolution: result.gridResolution,
        startDate: config.startDate,
        endDate: config.endDate,
        startHour: config.startHour,
        endHour: config.endHour,
        intervalMinutes: config.intervalMinutes,
        utcOffset: config.utcOffset,
        geometryAssumptions: [...activeSource.metadata.geometryAssumptions],
      },
      visualization: {
        kind: "choropleth",
        title: `${activeSource.metadata.title} Solar Exposure`,
        valueField: "avgExposureHours",
        labelField: "building_id",
        classificationMethod: "quantile",
        classCount: 5,
        colorRamp: "YlOrRd",
        popupFields: [
          "building_id",
          "avgExposureHours",
          "minExposureHours",
          "maxExposureHours",
          "sunlitFraction",
          "voxcity_source_ref",
        ],
      },
      statisticalSummary: {
        buildingCount: result.buildings.length,
        sampleCount: result.sampleCount,
        totalDaylightHours: result.totalDaylightHours,
        minExposure: result.stats.minExposure,
        maxExposure: result.stats.maxExposure,
        meanExposure: result.stats.meanExposure,
        sampleMode: activeSource.metadata.runtimeMode === "sample",
      },
    });
  }, [activeSource, buildingSummaries, config, result, runIdentity]);

  const sunlightSelectedBuildingIds = useMemo(() => {
    if (!activeSource || !sunlightHandoff) return [];
    return sunlightHandoff.source.metadata.id === activeSource.metadata.id
      ? [...sunlightHandoff.selectedBuildingIds].slice(0, 80)
      : [];
  }, [activeSource, sunlightHandoff]);

  const sunlightVoxCitySync = useMemo(() => {
    if (!activeSource || !sunlightAnalysis || !runIdentity || !result) return null;
    const { scenarioArtifactId, mapReferenceArtifactId } = buildVoxCityScenarioArtifactIds(
      runIdentity.runId,
      "sunlight_exposure",
    );
    return buildMapVoxCitySyncMetadata({
      syncId: `voxcity-sync-sunlight-${runIdentity.runId}`,
      createdAt: runIdentity.runTimestamp,
      sourceView: "voxcity-3d",
      targetView: "map-2d",
      source: activeSource.metadata,
      mapLayerId: activeSource.metadata.sourceLayerId ?? null,
      outputLayerId: sunlightAnalysis.layer.id,
      selectedFeatureIds: resolveSelectedFeatureIds(activeSource, selectedSourceFeatureIds, sunlightSelectedBuildingIds),
      selectedBuildingIds: sunlightSelectedBuildingIds,
      buildingReferences: buildBuildingSyncReferences(activeSource, sunlightSelectedBuildingIds),
      viewport: mapViewport,
      aoiId: activeAoiId ?? null,
      scenarioId: scenarioArtifactId,
      linkedRunId: runIdentity.runId,
      linkedArtifactIds: [scenarioArtifactId, mapReferenceArtifactId, sunlightAnalysis.evidenceArtifact.id],
      handoff: {
        reportHandoffId: `voxcity-report-sunlight-${runIdentity.runId}`,
        dashboardBindingId: `voxcity-dashboard-sunlight-${runIdentity.runId}`,
        ideArtifactId: `voxcity-ide-sunlight-${runIdentity.runId}`,
      },
    });
  }, [
    activeAoiId,
    activeSource,
    mapViewport,
    result,
    runIdentity,
    selectedSourceFeatureIds,
    sunlightAnalysis,
    sunlightSelectedBuildingIds,
  ]);

  const sunlightLayer = useMemo(() => {
    if (!sunlightAnalysis) return null;
    if (!sunlightVoxCitySync) return sunlightAnalysis.layer;
    return {
      ...sunlightAnalysis.layer,
      metadata: {
        ...sunlightAnalysis.layer.metadata,
        voxCitySync: sunlightVoxCitySync,
      },
    };
  }, [sunlightAnalysis, sunlightVoxCitySync]);

  // ---- Run simulation ----
  const handleRun = useCallback(() => {
    if (!activeSource) return;
    const nextRunIdentity = {
      runId: `sunlight-simulation-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
    };
    setRunIdentity(nextRunIdentity);
    setStatus("running");
    setProgress(0);
    setError(null);
    setAnimationFrame(0);

    // Run in a microtask to allow UI to show loading state
    setTimeout(() => {
      try {
        const res = runSimulation(config, buildings, 2, (p) => setProgress(p));
        setResult(res);
        const summaries = buildingExposureSummary(res);
        setBuildingSummaries(summaries);
        setOverlayMode("frame");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }, 50);
  }, [activeSource, config, buildings, setStatus, setProgress, setError, setAnimationFrame, setResult, setBuildingSummaries]);

  // ---- Animation playback ----
  useEffect(() => {
    if (animationPlaying && result) {
      animRef.current = setInterval(() => {
        setAnimationFrame(
          useSunlightSimStore.getState().animationFrame + 1 >= result.sampleCount
            ? 0
            : useSunlightSimStore.getState().animationFrame + 1,
        );
      }, 1000 / animationFps);
    }
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [animationPlaying, animationFps, result, setAnimationFrame]);

  // ---- Export handlers ----
  const handleExportShadow = useCallback(() => {
    if (!result) return;
    const csv = exportGridCSV(result);
    downloadBlob(csv, "shadow_exposure_grid.csv", "text/csv");
  }, [result]);

  const handleExportBuildings = useCallback(() => {
    if (!buildingSummaries) return;
    const json = exportBuildingJSON(buildingSummaries);
    downloadBlob(json, "building_exposure.json", "application/json");
  }, [buildingSummaries]);

  // ---- Add to Map handler ----
  const handleAddToMap = useCallback(() => {
    if (!sunlightLayer) return;
    addOverlayLayer(sunlightLayer);
  }, [sunlightLayer, addOverlayLayer]);

  const handleOrbitControlsRef = useCallback((instance: unknown) => {
    orbitControlsRef.current = instance as OrbitControlsHandle | null;
  }, []);

  // ---- Computed helpers ----
  const currentSample = result?.samples[animationFrame] ?? null;
  const currentSun = currentSample?.sun ?? null;
  const frameLabel = currentSun
    ? new Date(currentSun.timestamp).toLocaleString("en-GB", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
      })
    : "—";
  const sunlightNarrativeInput = result && buildingSummaries
    ? buildSunlightNarrativeInput(config, result, buildingSummaries)
    : null;

  const sunlightCompletedRun = useMemo(() => {
    if (!activeSource || !buildingSummaries || !result || !runIdentity || !sunlightAnalysis) return null;
    const narrative = buildSunlightNarrative(activeSource, result);
    const rankedExposure = [...buildingSummaries]
      .sort((left, right) => right.avgExposureHours - left.avgExposureHours)
      .slice(0, 8)
      .map((summary) => ({
        building_id: summary.buildingId,
        avg_exposure_h: Number(summary.avgExposureHours.toFixed(3)),
        min_exposure_h: Number(summary.minExposureHours.toFixed(3)),
        max_exposure_h: Number(summary.maxExposureHours.toFixed(3)),
        sunlit_fraction: Number(summary.sunlitFraction.toFixed(3)),
      }));

    return createAnalysisCompletedRun(sunlightAnalysis, {
      flowId: "sunlight_sim",
      runId: runIdentity.runId,
      insertedAt: runIdentity.runTimestamp,
      label: `${activeSource.metadata.title} Sunlight Simulation`,
      paragraph: narrative,
      paragraphPreview: narrative,
      paragraphFull: narrative,
      mapOutputs: [createAnalysisMapOutput(sunlightAnalysis)],
      chartOutputs: [{
        id: `${runIdentity.runId}-top-exposure`,
        type: "bar",
        title: `${activeSource.metadata.title} Top Solar Exposure`,
        data: rankedExposure,
      }],
      dataOutputs: [
        {
          id: `${runIdentity.runId}-provenance`,
          format: "sunlight-simulation-provenance",
          rows: 1,
          columns: [
            "source_title",
            "source_kind",
            "source_ref",
            "runtime_mode",
            "source_layer_id",
            "input_feature_count",
            "sample_count",
            "grid_resolution_m",
            "geometry_assumptions",
          ],
          preview: [{
            source_title: activeSource.metadata.title,
            source_kind: activeSource.metadata.kind,
            source_ref: activeSource.metadata.sourceRef,
            runtime_mode: activeSource.metadata.runtimeMode,
            source_layer_id: activeSource.metadata.sourceLayerId ?? null,
            input_feature_count: activeSource.metadata.featureCount,
            sample_count: result.sampleCount,
            grid_resolution_m: result.gridResolution,
            geometry_assumptions: activeSource.metadata.geometryAssumptions.join(" | "),
          }],
        },
        {
          id: `${runIdentity.runId}-building-summary`,
          format: "sunlight-exposure-buildings",
          rows: buildingSummaries.length,
          columns: ["building_id", "avg_exposure_h", "min_exposure_h", "max_exposure_h", "sunlit_fraction"],
          preview: rankedExposure,
        },
      ],
    });
  }, [activeSource, buildingSummaries, result, runIdentity, sunlightAnalysis]);

  useEffect(() => {
    if (!sunlightCompletedRun) return;
    upsertCompletedRun(sunlightCompletedRun);
  }, [sunlightCompletedRun, upsertCompletedRun]);

  useEffect(() => {
    if (!sunlightVoxCitySync) return;
    upsertMapEvidenceArtifact(createMapVoxCityHandoffEvidenceArtifact({
      voxCitySync: sunlightVoxCitySync,
      linkedWorkflowId: "sunlight_sim",
      title: `${sunlightVoxCitySync.source.title} 2D/3D sunlight handoff`,
      summary: `Reference-only VoxCity sunlight handoff for ${sunlightVoxCitySync.source.title}; shadow grids, geometry, and 3D payloads remain in their owning stores.`,
    }));
  }, [sunlightVoxCitySync, upsertMapEvidenceArtifact]);

  useEffect(() => {
    if (!activeSource || !sunlightAnalysis || !runIdentity || !result || !sunlightCompletedRun) {
      return;
    }

    const { scenarioArtifactId, mapReferenceArtifactId } = buildVoxCityScenarioArtifactIds(
      runIdentity.runId,
      'sunlight_exposure',
    );

    registerVoxCityScenarioEvidence({
      scenarioArtifactId,
      mapReferenceArtifactId,
      title: `${activeSource.metadata.title} Sunlight Scenario`,
      summary: `Sunlight exposure simulation output linked to the published 2D map layer reference for ${activeSource.metadata.title}.`,
      sourceId: activeSource.metadata.id,
      flowId: 'sunlight_sim',
      linkedRunId: runIdentity.runId,
      linkedLayerId: sunlightAnalysis.layer.id,
      linkedSourceLayerIds: activeSource.metadata.sourceLayerId ? [activeSource.metadata.sourceLayerId] : [],
      context,
      runtimeMode: activeSource.metadata.runtimeMode,
      metadata: {
        modelReference: activeSource.metadata.sourceRef,
        spatialReference: {
          crs: activeSource.metadata.crs ?? null,
          bbox: activeSource.metadata.bbox,
        },
        scenarioParameters: {
          start_date: config.startDate,
          end_date: config.endDate,
          start_hour: config.startHour,
          end_hour: config.endHour,
          interval_minutes: config.intervalMinutes,
          utc_offset: config.utcOffset,
          grid_resolution_m: result.gridResolution,
          sample_count: result.sampleCount,
          building_count: result.buildings.length,
        },
        simulationType: 'sunlight_exposure',
        assumptions: [...activeSource.metadata.geometryAssumptions],
        uncertainty: [
          'Solar exposure values depend on simplified axis-aligned volume representation and deterministic shading assumptions.',
          activeSource.metadata.runtimeMode === 'sample'
            ? 'Sample geometry source is active; treat outputs as exploratory until project data is used.'
            : 'Input geometry and temporal parameter choices determine interpretation confidence.',
        ],
        outputReferences: {
          runId: runIdentity.runId,
          mapLayerId: sunlightAnalysis.layer.id,
          dataOutputIds: sunlightCompletedRun.dataOutputs.map((output) => output.id),
          chartOutputIds: sunlightCompletedRun.chartOutputs.map((output) => output.id),
        },
      },
      tags: ['voxcity', 'solar', 'environmental_analysis', 'scenario'],
      registerEvidenceArtifact,
    });
  }, [
    activeSource,
    config.endDate,
    config.endHour,
    config.intervalMinutes,
    config.startDate,
    config.startHour,
    config.utcOffset,
    context,
    registerEvidenceArtifact,
    result,
    runIdentity,
    sunlightAnalysis,
    sunlightCompletedRun,
  ]);

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  return (
    <div style={PANEL}>
      {/* ---- Toolbar ---- */}
      <div style={TOOLBAR}>
        <span style={LABEL}>Sunlight Simulation</span>
        <span style={{ fontSize: "11px", color: "#A8A29E", marginRight: "4px" }}>
          Shadow &amp; Solar Exposure Analysis
        </span>

        <span style={{ fontSize: "11px", color: "#A8A29E" }}>Source:</span>
        <select
          value={activeSourceId ?? ""}
          onChange={(e) => setActiveSourceId(e.target.value)}
          style={{ ...SELECT, minWidth: "220px" }}
          title="Choose the active building source for solar analysis"
          data-testid="sunlight-source-select"
        >
          {availableSources.map((source) => (
            <option key={source.metadata.id} value={source.metadata.id}>
              {source.metadata.runtimeMode === "sample"
                ? `${source.metadata.title} (Sample mode)`
                : `${source.metadata.title} (${source.metadata.featureCount})`}
            </option>
          ))}
        </select>

        <button
          type="button"
          style={BTN}
          onClick={() => setActiveSourceId(resolveVoxCitySampleSource().metadata.id)}
          title="Switch to the quick-start sample source"
        >
          Quick-Start Sample
        </button>

        <button
          type="button"
          style={status === "running" || !activeSource ? BTN_DISABLED : BTN_ACTIVE}
          onClick={handleRun}
          disabled={status === "running" || !activeSource}
          title="Run shadow accumulation and solar exposure computation for all loaded buildings"
          aria-label="Run sunlight simulation"
        >
          {status === "running" ? "Computing…" : "Run Simulation"}
        </button>

        {result != null && (
          <>
            <div style={{ borderLeft: "1px solid #444", height: "20px" }} />
            <button
              type="button"
              style={animationPlaying ? BTN_ACTIVE : BTN}
              onClick={() => setAnimationPlaying(!animationPlaying)}
              title={animationPlaying ? "Pause shadow animation" : "Play shadow animation over time"}
              aria-label={animationPlaying ? "Pause animation" : "Play animation"}
            >
              {animationPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              style={overlayMode === "cumulative" ? BTN_ACTIVE : BTN}
              onClick={() => setOverlayMode(overlayMode === "cumulative" ? "frame" : "cumulative")}
              title={overlayMode === "cumulative" 
                ? "Switch to single-frame shadow view" 
                : "Switch to cumulative exposure heatmap (yellow = high sunlight, blue = low)"}
              aria-label="Toggle cumulative view"
            >
              {overlayMode === "cumulative" ? "Frame View" : "Cumulative"}
            </button>
          </>
        )}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          style={sidebarOpen ? BTN_ACTIVE : BTN}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Toggle the configuration and results sidebar"
          aria-label="Toggle sidebar"
        >
          Config
        </button>

        <button type="button" style={BTN} onClick={reset} title="Reset simulation and clear all results" aria-label="Reset simulation">
          Reset
        </button>
      </div>

      {/* ---- Main body ---- */}
      <div style={MAIN_BODY}>
        {/* 3D Canvas */}
        <div style={SCENE_VIEWPORT}>
          <Canvas
            camera={{ position: [120, 100, 120], fov: 50, near: 0.1, far: 2000 }}
            style={{ width: "100%", height: "100%", display: "block", background: "#0d0d0d" }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight
              position={
                currentSun && currentSun.altitude > 0
                  ? [
                      Math.sin(currentSun.azimuth * Math.PI / 180) * 200,
                      Math.sin(currentSun.altitude * Math.PI / 180) * 200,
                      Math.cos(currentSun.azimuth * Math.PI / 180) * 200,
                    ]
                  : [100, 200, 100]
              }
              intensity={currentSun && currentSun.altitude > 0 ? 1.2 : 0.3}
              color="#FFF8E7"
            />
            <gridHelper args={[300, 60, "#333", "#222"]} position={[55, 0, 75]} />
            <BuildingMeshes buildings={buildings} />
            <ShadowOverlayPlane result={result} frameIndex={animationFrame} mode={overlayMode} />
            <CameraFitter buildings={buildings} controlsRef={orbitControlsRef} />
            <OrbitControls ref={handleOrbitControlsRef} enableDamping dampingFactor={0.1} />
          </Canvas>

          {activeSource && (
            <div style={SOURCE_INFO_BOX} data-testid="sunlight-source-metadata">
              <div style={{ color: activeSource.metadata.runtimeMode === "sample" ? "#F59E0B" : "#22C55E", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {activeSource.metadata.runtimeMode === "sample" ? "Sample Mode Active" : "Project Data Active"}
              </div>
              <div><span style={{ color: "#A8A29E" }}>Source:</span> {activeSource.metadata.title}</div>
              <div><span style={{ color: "#A8A29E" }}>Provider:</span> {activeSource.metadata.provider}</div>
              <div><span style={{ color: "#A8A29E" }}>Kind:</span> {activeSource.metadata.kind}</div>
              <div><span style={{ color: "#A8A29E" }}>Reference:</span> {activeSource.metadata.sourceRef}</div>
              <div><span style={{ color: "#A8A29E" }}>Feature count:</span> {activeSource.metadata.featureCount}</div>
              {activeSource.metadata.crs && (
                <div><span style={{ color: "#A8A29E" }}>CRS:</span> {activeSource.metadata.crs}</div>
              )}
              <div><span style={{ color: "#A8A29E" }}>BBox:</span> {formatBBox(activeSource.metadata.bbox)}</div>
              <div><span style={{ color: "#A8A29E" }}>Assumptions:</span> {activeSource.metadata.geometryAssumptions.join(" ")}</div>
              {sunlightHandoff && activeSource.metadata.id === sunlightHandoff.source.metadata.id && (
                <div style={{ color: "#22C55E" }}>
                  Building Viewer handoff active{sunlightHandoff.selectedBuildingIds.length > 0 ? ` for ${sunlightHandoff.selectedBuildingIds.length} selected building${sunlightHandoff.selectedBuildingIds.length === 1 ? "" : "s"}` : " for the current source"}.
                </div>
              )}
            </div>
          )}

          {/* Loading overlay */}
          {status === "running" && (
            <div style={OVERLAY}>
              <span style={{ color: "#F59E0B", fontWeight: 600, fontSize: "14px" }}>
                Computing shadow accumulation…
              </span>
              <div style={PROGRESS_BG}>
                <div
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #D97706, #F59E0B)",
                    borderRadius: "3px",
                    transition: "width 0.2s",
                  }}
                />
              </div>
              <span style={{ fontSize: "11px", color: "#A8A29E" }}>
                {Math.round(progress * 100)}% — Analysing {buildings.length} buildings
              </span>
            </div>
          )}

          {/* Empty state — before first run */}
          {!result && status !== "running" && status !== "error" && (
            <div style={EMPTY_STATE}>
              <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: "16px" }}>
                Sunlight & Solar Exposure Simulator
              </span>
              <span style={{ color: "#D6D3D1", fontSize: "12px", lineHeight: 1.6, maxWidth: "380px" }}>
                Analyse shadow accumulation and solar exposure hours across an urban neighbourhood.
                Configure the date range, time window, and simulation interval in the sidebar,
                then click <b style={{ color: "#F59E0B" }}>Run Simulation</b>.
              </span>
              <span style={{ color: "#A8A29E", fontSize: "11px", lineHeight: 1.5, maxWidth: "360px" }}>
                {buildings.length} building{buildings.length === 1 ? "" : "s"} loaded from {activeSource?.metadata.runtimeMode === "sample" ? "sample mode" : "the active project source"} • Grid resolution: 2 m • Deterministic output
              </span>
            </div>
          )}

          {/* Color legend for overlay */}
          {result != null && (
            <div style={LEGEND_BAR}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {overlayMode === "cumulative" ? "Exposure Legend" : "Shadow Legend"}
              </span>
              {overlayMode === "cumulative" ? (
                <>
                  <div style={{ display: "flex", height: "8px", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ flex: 1, background: "rgb(0,0,180)" }} />
                    <div style={{ flex: 1, background: "rgb(80,60,140)" }} />
                    <div style={{ flex: 1, background: "rgb(160,100,80)" }} />
                    <div style={{ flex: 1, background: "rgb(245,158,11)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#A8A29E" }}>
                    <span>{result.stats.minExposure.toFixed(1)}h (shadow)</span>
                    <span>{result.stats.maxExposure.toFixed(1)}h (sun)</span>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", gap: "10px", fontSize: "10px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "rgb(20,20,60)", display: "inline-block" }}/>
                    Shadow
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "rgb(245,200,80)", display: "inline-block" }}/>
                    Sunlit
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Frame info box */}
          {result != null && (
            <div style={INFO_BOX}>
              <div style={{ fontWeight: 700, color: "#F59E0B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>
                {overlayMode === "cumulative" ? "Cumulative Results" : "Animation Frame"}
              </div>
              <div><b>Frame:</b> {animationFrame + 1} / {result.sampleCount}</div>
              <div><b>Time:</b> {frameLabel}</div>
              {currentSun != null && (
                <>
                  <div><b>Sun Altitude:</b> {currentSun.altitude.toFixed(1)}°{currentSun.altitude <= 0 ? " (below horizon)" : ""}</div>
                  <div><b>Sun Azimuth:</b> {currentSun.azimuth.toFixed(1)}° from N</div>
                </>
              )}
              <div style={{ borderTop: "1px solid #333", marginTop: "4px", paddingTop: "4px" }}>
                <div><b>Total Daylight:</b> {result.totalDaylightHours.toFixed(1)} h</div>
                <div><b>Mean Exposure:</b> {result.stats.meanExposure.toFixed(2)} h</div>
                <div><b>Min / Max:</b> {result.stats.minExposure.toFixed(1)} – {result.stats.maxExposure.toFixed(1)} h</div>
              </div>
            </div>
          )}

          {/* Scrubber */}
          {result != null && (
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "300px",
                right: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                zIndex: 16,
                background: "rgba(13,13,13,0.7)",
                borderRadius: "6px",
                padding: "4px 10px",
              }}
            >
              <span style={{ fontSize: "9px", color: "#F59E0B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                Timeline
              </span>
              <input
                type="range"
                min={0}
                max={result.sampleCount - 1}
                value={animationFrame}
                onChange={(e) => {
                  setAnimationPlaying(false);
                  setAnimationFrame(Number(e.target.value));
                }}
                style={{ flex: 1, accentColor: "#F59E0B" }}
                title="Drag to scrub through the shadow animation timeline"
                aria-label="Animation frame scrubber"
              />
              <span style={{ fontSize: "10px", color: "#A8A29E", minWidth: "48px", textAlign: "right" }}>
                {animationFrame + 1}/{result.sampleCount}
              </span>
            </div>
          )}

          {/* Error overlay */}
          {status === "error" && error != null && (
            <div style={{ ...OVERLAY, color: "#EF4444" }}>
              <span style={{ fontWeight: 600 }}>Simulation Error</span>
              <span style={{ fontSize: "12px", maxWidth: "300px", textAlign: "center" }}>{error}</span>
              <button type="button" style={BTN} onClick={reset}>Reset</button>
            </div>
          )}
        </div>

        {/* ---- Sidebar ---- */}
        {sidebarOpen === true && (
          <div style={SIDEBAR}>
            {/* Config Section */}
            <div>
              <div style={SECTION_TITLE}>Simulation Parameters</div>
              <div style={{ fontSize: "10px", color: "#A8A29E", marginBottom: "8px", lineHeight: 1.4 }}>
                Set the geographic location, date range, and time window for shadow computation.
              </div>

              <div style={FIELD_ROW}>
                <span style={FIELD_LABEL} title="Latitude of the study area center (decimal degrees)">Latitude</span>
                <input
                  type="number"
                  style={INPUT}
                  value={config.location.latitude}
                  step={0.01}
                  onChange={(e) =>
                    setConfig({ location: { ...config.location, latitude: Number(e.target.value) } })
                  }
                  title="Latitude in decimal degrees (-90 to 90)"
                  aria-label="Latitude"
                />
              </div>

              <div style={{ ...FIELD_ROW, marginTop: "4px" }}>
                <span style={FIELD_LABEL} title="Longitude of the study area center (decimal degrees)">Longitude</span>
                <input
                  type="number"
                  style={INPUT}
                  value={config.location.longitude}
                  step={0.01}
                  onChange={(e) =>
                    setConfig({ location: { ...config.location, longitude: Number(e.target.value) } })
                  }
                  title="Longitude in decimal degrees (-180 to 180)"
                  aria-label="Longitude"
                />
              </div>

              <div style={{ ...FIELD_ROW, marginTop: "4px" }}>
                <span style={FIELD_LABEL} title="First day of the simulation period">Start Date</span>
                <input
                  type="date"
                  style={INPUT}
                  value={config.startDate}
                  onChange={(e) => setConfig({ startDate: e.target.value })}
                  title="First date of the simulation period (YYYY-MM-DD)"
                  aria-label="Start date"
                />
              </div>

              <div style={{ ...FIELD_ROW, marginTop: "4px" }}>
                <span style={FIELD_LABEL} title="Last day of the simulation period">End Date</span>
                <input
                  type="date"
                  style={INPUT}
                  value={config.endDate}
                  onChange={(e) => setConfig({ endDate: e.target.value })}
                  title="Last date of the simulation period (YYYY-MM-DD)"
                  aria-label="End date"
                />
              </div>

              <div style={{ ...FIELD_ROW, marginTop: "4px" }}>
                <span style={FIELD_LABEL} title="Earliest hour of day to simulate (local time, 0–23)">Start Hour</span>
                <input
                  type="number"
                  style={{ ...INPUT, width: "60px" }}
                  value={config.startHour}
                  min={0}
                  max={23}
                  onChange={(e) => setConfig({ startHour: Number(e.target.value) })}
                  title="Start hour of daily simulation window (0–23, local time)"
                  aria-label="Start hour"
                />
              </div>

              <div style={{ ...FIELD_ROW, marginTop: "4px" }}>
                <span style={FIELD_LABEL} title="Latest hour of day to simulate (local time, 0–23)">End Hour</span>
                <input
                  type="number"
                  style={{ ...INPUT, width: "60px" }}
                  value={config.endHour}
                  min={0}
                  max={23}
                  onChange={(e) => setConfig({ endHour: Number(e.target.value) })}
                  title="End hour of daily simulation window (0–23, local time)"
                  aria-label="End hour"
                />
              </div>

              <div style={{ ...FIELD_ROW, marginTop: "4px" }}>
                <span style={FIELD_LABEL} title="Time between successive shadow samples">Interval</span>
                <select
                  style={SELECT}
                  value={config.intervalMinutes}
                  onChange={(e) => setConfig({ intervalMinutes: Number(e.target.value) })}
                  title="Time step between each shadow sample (smaller = more accurate but slower)"
                  aria-label="Interval in minutes"
                >
                  <option value={15}>15 min (high detail)</option>
                  <option value={30}>30 min (balanced)</option>
                  <option value={60}>60 min (fast)</option>
                </select>
              </div>

              <div style={{ ...FIELD_ROW, marginTop: "4px" }}>
                <span style={FIELD_LABEL} title="Hours offset from UTC for local time conversion">UTC Offset</span>
                <input
                  type="number"
                  style={{ ...INPUT, width: "60px" }}
                  value={config.utcOffset}
                  min={-12}
                  max={14}
                  onChange={(e) => setConfig({ utcOffset: Number(e.target.value) })}
                  title="UTC offset (e.g. +3 for Istanbul, +1 for London BST)"
                  aria-label="UTC offset"
                />
              </div>
            </div>

            {/* Quick stats after simulation */}
            {result != null && (
              <div>
                <div style={SECTION_TITLE}>Quick Statistics</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <div style={STAT_CARD}>
                    <div>
                      <div style={STAT_VALUE}>{result.totalDaylightHours.toFixed(1)}</div>
                      <div style={STAT_UNIT}>Total Daylight Hours</div>
                    </div>
                  </div>
                  <div style={STAT_CARD}>
                    <div>
                      <div style={STAT_VALUE}>{result.stats.meanExposure.toFixed(1)}</div>
                      <div style={STAT_UNIT}>Mean Ground Exposure (h)</div>
                    </div>
                  </div>
                  <div style={STAT_CARD}>
                    <div>
                      <div style={STAT_VALUE}>{result.sampleCount}</div>
                      <div style={STAT_UNIT}>Time Steps Computed</div>
                    </div>
                  </div>
                  <div style={STAT_CARD}>
                    <div>
                      <div style={STAT_VALUE}>{result.buildings.length}</div>
                      <div style={STAT_UNIT}>Buildings Analysed</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Animation controls */}
            {result != null && (
              <div>
                <div style={SECTION_TITLE}>Animation Controls</div>
                <div style={{ fontSize: "10px", color: "#A8A29E", marginBottom: "6px", lineHeight: 1.4 }}>
                  Step through shadow positions over the selected time range.
                </div>
                <div style={FIELD_ROW}>
                  <span style={FIELD_LABEL}>Speed</span>
                  <select
                    style={SELECT}
                    value={animationFps}
                    onChange={(e) => setAnimationFps(Number(e.target.value))}
                    title="Playback speed — frames per second"
                    aria-label="Animation speed"
                  >
                    <option value={1}>Slow (1 fps)</option>
                    <option value={2}>Normal (2 fps)</option>
                    <option value={4}>Fast (4 fps)</option>
                    <option value={8}>Very Fast (8 fps)</option>
                    <option value={16}>Maximum (16 fps)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Solar Exposure Summary */}
            {buildingSummaries != null && buildingSummaries.length > 0 && (
              <div>
                <div style={SECTION_TITLE}>Solar Exposure by Building</div>
                <div style={{ fontSize: "10px", color: "#A8A29E", marginBottom: "6px", lineHeight: 1.4 }}>
                  Hours of sunlight each building&apos;s ground footprint receives.
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={TABLE}>
                    <thead>
                      <tr>
                        <th style={TH}>Building</th>
                        <th style={{ ...TH, textAlign: "right" as const }}>Avg (h)</th>
                        <th style={{ ...TH, textAlign: "right" as const }}>Min (h)</th>
                        <th style={{ ...TH, textAlign: "right" as const }}>Max (h)</th>
                        <th style={{ ...TH, textAlign: "right" as const }}>Sunlit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildingSummaries.map((s: BES) => (
                        <tr key={s.buildingId}>
                          <td style={TD}>{s.label}</td>
                          <td style={{ ...TD, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{s.avgExposureHours.toFixed(1)}</td>
                          <td style={{ ...TD, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{s.minExposureHours.toFixed(1)}</td>
                          <td style={{ ...TD, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{s.maxExposureHours.toFixed(1)}</td>
                          <td style={{ ...TD, textAlign: "right" as const }}>
                            <span style={{
                              display: "inline-block",
                              padding: "1px 6px",
                              borderRadius: "3px",
                              fontSize: "10px",
                              fontWeight: 600,
                              background: s.sunlitFraction > 0.7 ? "rgba(245,158,11,0.2)" : s.sunlitFraction > 0.3 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.15)",
                              color: s.sunlitFraction > 0.7 ? "#F59E0B" : s.sunlitFraction > 0.3 ? "#D6D3D1" : "#EF4444",
                            }}>
                              {(s.sunlitFraction * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {sunlightNarrativeInput && (
              <NarrativeGenerationPanel input={sunlightNarrativeInput} subject="Sunlight & Solar Exposure Simulation" />
            )}

            {/* Export */}
            {result != null && (
              <div>
                <div style={SECTION_TITLE}>Export Data</div>
                <div style={{ fontSize: "10px", color: "#A8A29E", marginBottom: "6px", lineHeight: 1.4 }}>
                  Download simulation outputs for further analysis or reporting.
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" style={BTN} onClick={handleExportShadow} title="Export per-cell shadow hours and exposure hours as CSV" aria-label="Export shadow map CSV">
                    Shadow Map (CSV)
                  </button>
                  <button type="button" style={BTN} onClick={handleExportBuildings} title="Export per-building exposure statistics as JSON" aria-label="Export exposure data JSON">
                    Exposure (JSON)
                  </button>
                  <button type="button" style={{ ...BTN, background: "#78350F", borderColor: "#F59E0B" }} onClick={handleAddToMap} title="Add solar exposure results as a map overlay layer" aria-label="Add solar exposure to map">
                    Add to Map
                  </button>
                </div>
              </div>
            )}

            {/* Empty state guidance */}
            {!result && status !== "running" && (
              <div style={{ fontSize: "12px", color: "#A8A29E", lineHeight: 1.6, marginTop: "8px", background: "#1f1f1f", borderRadius: "6px", padding: "12px", border: "1px solid #333" }}>
                <div style={{ fontWeight: 700, color: "#D6D3D1", marginBottom: "6px" }}>How to use</div>
                <ol style={{ margin: 0, paddingLeft: "18px" }}>
                  <li style={{ marginBottom: "4px" }}>Confirm the active <b style={{ color: "#F59E0B" }}>source</b> in the toolbar or consume a Building Viewer handoff.</li>
                  <li style={{ marginBottom: "4px" }}>Adjust <b style={{ color: "#F59E0B" }}>location</b> and <b style={{ color: "#F59E0B" }}>date range</b> above.</li>
                  <li style={{ marginBottom: "4px" }}>Choose a <b style={{ color: "#F59E0B" }}>time window</b> (start/end hour) and <b style={{ color: "#F59E0B" }}>interval</b>.</li>
                  <li style={{ marginBottom: "4px" }}>Click <b style={{ color: "#F59E0B" }}>Run Simulation</b> in the toolbar.</li>
                  <li style={{ marginBottom: "4px" }}>Use <b style={{ color: "#F59E0B" }}>Play</b> to animate shadows through the day.</li>
                  <li>Switch to <b style={{ color: "#F59E0B" }}>Cumulative</b> to see total exposure.</li>
                </ol>
                <div style={{ marginTop: "8px", fontSize: "11px", color: "#78716C" }}>
                  {buildings.length} building{buildings.length === 1 ? "" : "s"} loaded from {activeSource?.metadata.runtimeMode === "sample" ? "sample mode" : activeSource?.metadata.provider ?? "the current source"}. All computations are deterministic.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ================================================================== */
/*  §4  Utility                                                       */
/* ================================================================== */

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default SunlightSimulatorPanel;
