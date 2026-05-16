/**
 * BuildingViewer — 3D panel for extruded buildings.
 *
 * Shows extruded building geometry with orbit/pan/zoom controls,
 * LOD toggle, height attribute selector, thematic styling, and
 * a loading/progress overlay.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { attributeRange, useBuildingScene } from "./hooks/useBuildingScene";
import { useCityJSONScene } from "./hooks/useCityJSONScene";
import { extrudeBuildings } from "./BuildingExtruder";
import {
 type ColorStop,
 DEFAULT_THEMATIC_RAMP,
 type ExtrudedBuilding,
 type ThematicStyle,
} from "./buildingTypes";
import {
 buildExtrusionPublicationCollection,
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
import {
 adaptFeatureCollectionAnalysisResult,
 createAnalysisCompletedRun,
 createAnalysisMapOutput,
} from "@/services/map/MapEngineAdapter";
import {
 acknowledgeViewportSync,
 publishViewportSync,
 subscribeToViewportSync,
 useViewportSyncStore,
} from "@/services/map/MapSyncService";
import {
 buildMapVoxCitySyncMetadata,
 type BuildMapVoxCitySyncMetadataInput,
 publishVoxCitySelection,
 subscribeToVoxCitySelection,
} from "@/services/map/voxCitySelectionService";
import { createMapVoxCityHandoffEvidenceArtifact } from "@/centerpanel/components/map/mapEvidenceArtifacts";

/* ================================================================== */
/* §1 STYLES (VS Code workbench: charcoal + blue accents) */
/* ================================================================== */

const PANEL: React.CSSProperties = {
 display: "flex",
 flexDirection: "column",
 width: "100%",
 height: "100%",
 minHeight: "940px",
 background: "#0d0d0d",
 color: "#FAFAF9",
 fontFamily: "var(--font-sans, system-ui, sans-serif)",
 position: "relative",
 overflow: "hidden",
};

const VIEWPORT: React.CSSProperties = {
 position: "relative",
 height: "clamp(720px, 72vh, 980px)",
 minHeight: "720px",
 flex: "0 0 auto",
};

const CANVAS_FILL: React.CSSProperties = {
 position: "absolute",
 inset: 0,
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
 fontWeight: 700,
 textTransform: "uppercase" as const,
 letterSpacing: "0.06em",
 color: "#a4adbb",
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
 background: "transparent",
 color: "#3794ff",
 borderColor: "transparent",
 boxShadow: "inset 0 -1px 0 #3794ff",
 fontWeight: 600,
};

const SELECT: React.CSSProperties = {
 padding: "4px 8px",
 borderRadius: "4px",
 border: "1px solid #444",
 background: "#262626",
 color: "#e0e0e0",
 fontSize: "12px",
 cursor: "pointer",
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

const PROGRESS_BAR_BG: React.CSSProperties = {
 width: "220px",
 height: "6px",
 borderRadius: "3px",
 background: "#333",
 overflow: "hidden",
};

const SIDEBAR: React.CSSProperties = {
 position: "absolute",
 top: 0,
 right: 0,
 bottom: 0,
 width: "300px",
 background: "#1a1a1a",
 borderLeft: "1px solid #333",
 padding: "12px",
 overflowY: "auto",
 zIndex: 15,
 display: "flex",
 flexDirection: "column",
 gap: "10px",
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
 maxWidth: "300px",
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

const SYNC_BADGE: React.CSSProperties = {
 display: "inline-flex",
 alignItems: "center",
 padding: "4px 10px",
 borderRadius: "999px",
 border: "1px solid #333",
 background: "rgba(38,38,38,0.92)",
 color: "#A8A29E",
 fontSize: "10px",
 fontWeight: 700,
 letterSpacing: "0.05em",
 textTransform: "uppercase",
};

/* ================================================================== */
/* §2 COLOR UTILITIES */
/* ================================================================== */

function lerpColor(
 ramp: readonly ColorStop[],
 t: number,
): [number, number, number] {
 const clamped = Math.max(0, Math.min(1, t));
 if (ramp.length === 0) return [0.5, 0.5, 0.5];
 if (ramp.length === 1) return [...ramp[0].color] as [number, number, number];

 for (let i = 0; i < ramp.length - 1; i++) {
 if (clamped >= ramp[i].value && clamped <= ramp[i + 1].value) {
 const range = ramp[i + 1].value - ramp[i].value;
 const f = range > 0 ? (clamped - ramp[i].value) / range : 0;
 return [
 ramp[i].color[0] + (ramp[i + 1].color[0] - ramp[i].color[0]) * f,
 ramp[i].color[1] + (ramp[i + 1].color[1] - ramp[i].color[1]) * f,
 ramp[i].color[2] + (ramp[i + 1].color[2] - ramp[i].color[2]) * f,
 ];
 }
 }
 return [...ramp[ramp.length - 1].color] as [number, number, number];
}

/* ================================================================== */
/* §3 THREE.JS SCENE COMPONENTS */
/* ================================================================== */

/** Render a single extruded building as a mesh. */
function BuildingMesh({
 building,
 thematic,
 thematicRange,
 selected,
 onSelect,
}: {
 building: ExtrudedBuilding;
 thematic: ThematicStyle | null;
 thematicRange: [number, number];
 selected: boolean;
 onSelect: (id: string) => void;
}) {
 const meshRef = useRef<THREE.Mesh>(null);

 const geo = useMemo(() => {
 const g = new THREE.BufferGeometry();
 g.setAttribute("position", new THREE.BufferAttribute(building.positions, 3));
 g.setAttribute("normal", new THREE.BufferAttribute(building.normals, 3));
 g.setIndex(new THREE.BufferAttribute(building.indices, 1));
 return g;
 }, [building]);

 const color = useMemo(() => {
 if (selected) return "#3794ff";
 if (thematic) {
 const val = Number(building.attributes[thematic.attributeKey]);
 if (Number.isFinite(val)) {
 const [mn, mx] = thematicRange;
 const t = mx > mn ? (val - mn) / (mx - mn) : 0.5;
 const c = lerpColor(thematic.ramp, t);
 return new THREE.Color(c[0], c[1], c[2]);
 }
 }
 return "#B0B0B0";
 }, [building, thematic, thematicRange, selected]);

 return (
 <mesh
 ref={meshRef}
 geometry={geo}
 onClick={(e) => {
 e.stopPropagation();
 onSelect(building.id);
 }}
 >
 <meshStandardMaterial
 color={color}
 transparent
 opacity={selected ? 1 : 0.92}
 roughness={0.7}
 metalness={0.1}
 />
 </mesh>
 );
}

/** Ground plane. */
function Ground({ size }: { size: number }) {
 return (
 <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
 <planeGeometry args={[size, size]} />
 <meshStandardMaterial color="#1a1a1a" transparent opacity={0.3} />
 </mesh>
 );
}

/** Camera auto-fit on first load. */
function CameraFit({
 bounds,
 controlsRef,
 fitRevision,
}: {
 bounds: { minX: number; maxX: number; minZ: number; maxZ: number; maxY: number };
 controlsRef?: React.RefObject<OrbitControlsHandle | null>;
 fitRevision?: number;
}) {
 const { camera } = useThree();
 const lastFitKeyRef = useRef<string | null>(null);

 useEffect(() => {
 const cx = (bounds.minX + bounds.maxX) / 2;
 const cz = (bounds.minZ + bounds.maxZ) / 2;
 const spanX = bounds.maxX - bounds.minX;
 const spanZ = bounds.maxZ - bounds.minZ;
 const spanY = Math.max(bounds.maxY, 1);
 const sceneDiameter = Math.max(spanX, spanZ, spanY, 1);
 const fitKey = [
  Number(cx.toFixed(4)),
  Number(cz.toFixed(4)),
  Number(spanX.toFixed(4)),
  Number(spanZ.toFixed(4)),
  Number(spanY.toFixed(4)),
   fitRevision ?? 0,
 ].join("|");

 if (lastFitKeyRef.current === fitKey) {
  return;
 }
 lastFitKeyRef.current = fitKey;

 const perspectiveCamera = toPerspectiveCamera(camera);
 const fovRadians = THREE.MathUtils.degToRad(perspectiveCamera?.fov ?? 50);
 const distance = (sceneDiameter * 0.55) / Math.max(Math.tan(fovRadians / 2), 0.1);
 const targetY = Math.max(Math.min(spanY * 0.48, spanY), 2);

 camera.position.set(cx + distance * 0.62, targetY + distance * 0.46, cz + distance * 0.62);
 if (perspectiveCamera) {
  perspectiveCamera.near = Math.max(distance / 200, 0.1);
  perspectiveCamera.far = Math.max(distance * 20, 2000);
  perspectiveCamera.updateProjectionMatrix();
 }
 camera.lookAt(cx, targetY, cz);

 const controls = controlsRef?.current;
 if (controls) {
  controls.target.set(cx, targetY, cz);
  controls.update();
 } else if (controlsRef) {
  // OrbitControls ref may not be ready on the first fit pass.
  window.requestAnimationFrame(() => {
   const deferredControls = controlsRef.current;
   if (!deferredControls) return;
   deferredControls.target.set(cx, targetY, cz);
   deferredControls.update();
  });
 }
 }, [bounds, camera, controlsRef, fitRevision]);

 return null;
}

/** Scene contents — renders buildings. */
function SceneContents() {
 const result = useBuildingScene((s) => s.result);
 const thematic = useBuildingScene((s) => s.thematic);
 const selectedId = useBuildingScene((s) => s.selectedBuildingId);
 const selectBuilding = useBuildingScene((s) => s.selectBuilding);

 const buildings = useMemo(() => result?.buildings ?? [], [result]);

 const thematicRange = useMemo<[number, number]>(() => {
 if (!thematic || buildings.length === 0) return [0, 1];
 return attributeRange(buildings, thematic.attributeKey);
 }, [thematic, buildings]);

 const bounds = useMemo(() => {
 let minX = Infinity;
 let maxX = -Infinity;
 let minZ = Infinity;
 let maxZ = -Infinity;
 let maxY = 0;

 for (const b of buildings) {
  if (b.positions.length >= 3) {
   for (let i = 0; i < b.positions.length; i += 3) {
    const x = b.positions[i];
    const y = b.positions[i + 1];
    const z = b.positions[i + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
    if (y > maxY) maxY = y;
   }
   continue;
  }

  const [cx, cz] = b.centroid;
  const fallbackRadius = Math.max(Math.sqrt(Math.max(b.area, 0)) / 2, 1);
  if (cx - fallbackRadius < minX) minX = cx - fallbackRadius;
  if (cx + fallbackRadius > maxX) maxX = cx + fallbackRadius;
  if (cz - fallbackRadius < minZ) minZ = cz - fallbackRadius;
  if (cz + fallbackRadius > maxZ) maxZ = cz + fallbackRadius;
  if (b.height > maxY) maxY = b.height;
 }

 return { minX, maxX, minZ, maxZ, maxY };
 }, [buildings]);

 if (buildings.length === 0) return null;

 const groundSize = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) * 1.5;

 return (
 <>
 {buildings.map((b) => (
 <BuildingMesh
 key={b.id}
 building={b}
 thematic={thematic}
 thematicRange={thematicRange}
 selected={b.id === selectedId}
 onSelect={selectBuilding}
 />
 ))}
 <Ground size={groundSize || 300} />
 </>
 );
}

interface SceneBounds {
 minX: number;
 maxX: number;
 minZ: number;
 maxZ: number;
 maxY: number;
}

interface OrbitControlsHandle {
 target: THREE.Vector3;
 update: () => void;
 addEventListener: (eventName: string, listener: () => void) => void;
 removeEventListener: (eventName: string, listener: () => void) => void;
}

function resolveSceneBounds(buildings: readonly ExtrudedBuilding[]): SceneBounds | null {
 if (buildings.length === 0) {
  return null;
 }

 let minX = Infinity;
 let maxX = -Infinity;
 let minZ = Infinity;
 let maxZ = -Infinity;
 let maxY = 0;

 for (const building of buildings) {
   if (building.positions.length >= 3) {
    for (let i = 0; i < building.positions.length; i += 3) {
      const x = building.positions[i];
      const y = building.positions[i + 1];
      const z = building.positions[i + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
      if (y > maxY) maxY = y;
    }
    continue;
   }

   const [cx, cz] = building.centroid;
   const fallbackRadius = Math.max(Math.sqrt(Math.max(building.area, 0)) / 2, 1);
   if (cx - fallbackRadius < minX) minX = cx - fallbackRadius;
   if (cx + fallbackRadius > maxX) maxX = cx + fallbackRadius;
   if (cz - fallbackRadius < minZ) minZ = cz - fallbackRadius;
   if (cz + fallbackRadius > maxZ) maxZ = cz + fallbackRadius;
   if (building.height > maxY) maxY = building.height;
 }

 return { minX, maxX, minZ, maxZ, maxY };
}

function toPerspectiveCamera(camera: THREE.Camera): THREE.PerspectiveCamera | null {
 if (camera instanceof THREE.PerspectiveCamera) {
  return camera;
 }
 return null;
}

function resolveSceneSpan(bounds: SceneBounds): number {
 return Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ, bounds.maxY, 1);
}

function resolveSceneTarget(bounds: SceneBounds): THREE.Vector3 {
 return new THREE.Vector3(
  (bounds.minX + bounds.maxX) / 2,
   Math.max(bounds.maxY * 0.48, 2),
  (bounds.minZ + bounds.maxZ) / 2,
 );
}

function normalizeBearingDegrees(value: number): number {
 const wrapped = ((value + 180) % 360 + 360) % 360 - 180;
 return Number(wrapped.toFixed(2));
}

function resolveViewportFrom3D(
 camera: THREE.Camera,
 target: THREE.Vector3,
 bounds: SceneBounds,
): { center: [number, number]; zoom: number; bearing: number; pitch: number } {
 const position = camera.position;
 const dx = position.x - target.x;
 const dz = position.z - target.z;
 const dy = Math.max(position.y - target.y, 0.001);
 const horizontalDistance = Math.max(Math.hypot(dx, dz), 0.001);
 const distance = Math.max(Math.hypot(horizontalDistance, dy), 0.001);
 const sceneSpan = resolveSceneSpan(bounds);
 const elevationDegrees = THREE.MathUtils.radToDeg(Math.atan2(dy, horizontalDistance));

 return {
  center: [Number(target.x.toFixed(6)), Number(target.z.toFixed(6))],
  zoom: Number(Math.max(2, Math.min(20, 14 - Math.log2(distance / sceneSpan))).toFixed(2)),
  bearing: normalizeBearingDegrees(THREE.MathUtils.radToDeg(Math.atan2(target.x - position.x, target.z - position.z))),
  pitch: Number(Math.max(0, Math.min(85, 90 - elevationDegrees)).toFixed(2)),
 };
}

function applyViewportTo3D(
 camera: THREE.Camera,
 target: THREE.Vector3,
 bounds: SceneBounds,
 viewport: { center: [number, number]; zoom: number; bearing: number; pitch: number },
): void {
 const sceneSpan = resolveSceneSpan(bounds);
 const distance = sceneSpan * 2 ** (14 - viewport.zoom);
 const pitchDegrees = Math.max(0, Math.min(85, viewport.pitch));
 const elevationRadians = THREE.MathUtils.degToRad(90 - pitchDegrees);
 const horizontalDistance = distance * Math.cos(elevationRadians);
 const verticalDistance = distance * Math.sin(elevationRadians);
 const bearingRadians = THREE.MathUtils.degToRad(viewport.bearing);
 const nextTargetY = target.y || Math.max(bounds.maxY * 0.48, 2);

 target.set(viewport.center[0], nextTargetY, viewport.center[1]);
 camera.position.set(
  viewport.center[0] - Math.sin(bearingRadians) * horizontalDistance,
  nextTargetY + verticalDistance,
  viewport.center[1] - Math.cos(bearingRadians) * horizontalDistance,
 );
 camera.lookAt(target.x, target.y, target.z);
}

function ViewportSyncBridge({
 controlsRef,
 sceneBounds,
}: {
 controlsRef: React.RefObject<OrbitControlsHandle | null>;
 sceneBounds: SceneBounds | null;
}) {
 const { camera } = useThree();
 const suppressLocalEmitRef = useRef(false);

 useEffect(() => {
   const controls = controlsRef.current;
  if (!controls || !sceneBounds) {
   return undefined;
  }

  const handleControlsChange = () => {
   if (suppressLocalEmitRef.current || !useViewportSyncStore.getState().enabled) {
    return;
   }

   publishViewportSync({
    source: "voxcity-3d",
    ...resolveViewportFrom3D(camera, controls.target, sceneBounds),
   });
  };

  controls.addEventListener("change", handleControlsChange);
  return () => {
   controls.removeEventListener("change", handleControlsChange);
  };
 }, [camera, controlsRef, sceneBounds]);

 useEffect(() => {
  const controls = controlsRef.current;
  if (!sceneBounds) {
   return undefined;
  }

  return subscribeToViewportSync((event) => {
   if (event.source !== "map-2d" || !useViewportSyncStore.getState().enabled) {
    return;
   }

   const nextTarget = controls?.target ?? resolveSceneTarget(sceneBounds);
   suppressLocalEmitRef.current = true;
   applyViewportTo3D(camera, nextTarget, sceneBounds, event);
   controls?.update();
   acknowledgeViewportSync("voxcity-3d");

   window.setTimeout(() => {
    suppressLocalEmitRef.current = false;
   }, 0);
  });
 }, [camera, controlsRef, sceneBounds]);

 return null;
}

/* ================================================================== */
/* §4 THEMATIC SIDEBAR */
/* ================================================================== */

function ThematicSidebar({
 open,
 onClose,
}: {
 open: boolean;
 onClose: () => void;
}) {
 const thematic = useBuildingScene((s) => s.thematic);
 const setThematic = useBuildingScene((s) => s.setThematic);
 const numericAttrs = useBuildingScene((s) => s.numericAttributes);
 const result = useBuildingScene((s) => s.result);

 const [selectedAttr, setSelectedAttr] = useState<string>(thematic?.attributeKey ?? "height");

 const applyThematic = useCallback(() => {
 setThematic({
 attributeKey: selectedAttr,
 label: selectedAttr,
 ramp: DEFAULT_THEMATIC_RAMP,
 });
 }, [selectedAttr, setThematic]);

 const clearThematic = useCallback(() => {
 setThematic(null);
 }, [setThematic]);

 if (!open) return null;

 const buildings = result?.buildings ?? [];
 const range = buildings.length > 0 ? attributeRange(buildings, selectedAttr) : [0, 1];

 return (
 <div style={SIDEBAR}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <span style={LABEL}>Thematic Styling</span>
 <button type="button" onClick={onClose} style={{ ...BTN, padding: "2px 8px" }}>✕</button>
 </div>

 <div style={{ fontSize: "12px", color: "#A8A29E" }}>
 Color buildings by a numeric attribute value.
 </div>

 <div>
 <div style={{ fontSize: "11px", marginBottom: "4px", color: "#D6D3D1" }}>Attribute</div>
 <select
 value={selectedAttr}
 onChange={(e) => setSelectedAttr(e.target.value)}
 style={{ ...SELECT, width: "100%" }}
 >
 {numericAttrs.map((a) => (
 <option key={a} value={a}>{a}</option>
 ))}
 </select>
 </div>

 <div style={{ fontSize: "11px", color: "#A8A29E" }}>
 Range: {range[0].toFixed(1)} — {range[1].toFixed(1)}
 </div>

 {/* Ramp preview */}
 <div style={{
 height: "14px",
 borderRadius: "4px",
 background: `linear-gradient(to right, rgb(46,140,115), rgb(56,148,255), rgb(140,89,217), rgb(214,38,41))`,
 }} />

 <div style={{ display: "flex", gap: "8px" }}>
 <button type="button" onClick={applyThematic} style={BTN_ACTIVE}>Apply</button>
 <button type="button" onClick={clearThematic} style={BTN}>Clear</button>
 </div>

 {thematic && (
 <div style={{ fontSize: "11px", color: "#22C55E", marginTop: "4px" }}>
 ● Active: coloring by <strong>{thematic.attributeKey}</strong>
 </div>
 )}
 </div>
 );
}

/* ================================================================== */
/* §5 SELECTED BUILDING INFO */
/* ================================================================== */

function SelectedBuildingInfo() {
 const selectedId = useBuildingScene((s) => s.selectedBuildingId);
 const result = useBuildingScene((s) => s.result);

 const building = useMemo(() => {
 if (!selectedId || !result) return null;
 return result.buildings.find((b) => b.id === selectedId) ?? null;
 }, [selectedId, result]);

 if (!building) return null;

 return (
 <div style={INFO_BOX}>
 <div style={{ fontWeight: 600, color: "#3794ff", marginBottom: "4px" }}>{building.id}</div>
 <div>Height: {building.height.toFixed(1)}m ({building.heightSource})</div>
 <div>Area: {building.area.toFixed(1)} m²</div>
 {Object.entries(building.attributes).slice(0, 6).map(([k, v]) => (
 <div key={k}><span style={{ color: "#A8A29E" }}>{k}:</span> {String(v)}</div>
 ))}
 </div>
 );
}

function formatBBox(bbox: [number, number, number, number] | null): string {
 if (!bbox) return "n/a";
 return bbox.map((value) => value.toFixed(3)).join(", ");
}

function buildExtrusionNarrative(
 source: VoxCityResolvedSource,
 stats: {
  count: number;
  skipped: number;
  min: number;
  max: number;
  avg: number;
  durationMs: number;
  lod: string;
 },
 heightAttrKey: string,
): string {
 return [
  `${source.metadata.title} was extruded in ${stats.lod} mode from ${source.metadata.runtimeMode === "sample" ? "sample" : "project"} geometry.`,
  `Source ref: ${source.metadata.sourceRef}. Input features: ${source.metadata.featureCount}.`,
  `Height priority started with ${heightAttrKey}; ${stats.skipped} building${stats.skipped === 1 ? " was" : "s were"} skipped during validation.`,
  `Resolved heights span ${stats.min.toFixed(1)} m to ${stats.max.toFixed(1)} m with a mean of ${stats.avg.toFixed(1)} m.`,
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
/* §6 MAIN BUILDING VIEWER COMPONENT */
/* ================================================================== */

export default function BuildingViewer() {
 const features = useBuildingScene((s) => s.features);
 const result = useBuildingScene((s) => s.result);
 const lod = useBuildingScene((s) => s.lod);
 const loading = useBuildingScene((s) => s.loading);
 const progress = useBuildingScene((s) => s.progress);
 const error = useBuildingScene((s) => s.error);
 const heightAttrKey = useBuildingScene((s) => s.heightAttributeKey);
 const heightStrategy = useBuildingScene((s) => s.heightStrategy);
 const numericAttrs = useBuildingScene((s) => s.numericAttributes);

 const loadFeatures = useBuildingScene((s) => s.loadFeatures);
 const setResult = useBuildingScene((s) => s.setResult);
 const setLod = useBuildingScene((s) => s.setLod);
 const setHeightAttributeKey = useBuildingScene((s) => s.setHeightAttributeKey);
 const setLoading = useBuildingScene((s) => s.setLoading);
 const setProgress = useBuildingScene((s) => s.setProgress);
 const setError = useBuildingScene((s) => s.setError);
 const selectBuilding = useBuildingScene((s) => s.selectBuilding);
 const selectedBuildingId = useBuildingScene((s) => s.selectedBuildingId);

 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
 const [handoffNotice, setHandoffNotice] = useState<string | null>(null);
 const [runIdentity, setRunIdentity] = useState<{ runId: string; runTimestamp: string } | null>(null);
 const [fitRevision, setFitRevision] = useState(0);
 const orbitControlsRef = useRef<OrbitControlsHandle | null>(null);

 // ---- Add to Map handler ----
 const overlayLayers = useMapExplorerStore((s: MapExplorerState) => s.overlayLayers);
 const addOverlayLayer = useMapExplorerStore((s: MapExplorerState) => s.addOverlayLayer);
 const upsertMapEvidenceArtifact = useMapExplorerStore((s: MapExplorerState) => s.upsertMapEvidenceArtifact);
 const upsertCompletedRun = useFlowStore((s) => s.upsertCompletedRun);
 const context = useUrbanContextStore((s) => s.context);
 const registerEvidenceArtifact = useUrbanContextStore((s) => s.registerEvidenceArtifact);
 const setSunlightHandoff = useVoxCityBridgeStore((s) => s.setSunlightHandoff);
 const cityJSONObjects = useCityJSONScene((s) => s.objects);
 const cityJSONSummary = useCityJSONScene((s) => s.summary);
 const viewportSyncEnabled = useViewportSyncStore((s) => s.enabled);
 const viewportSyncStatus = useViewportSyncStore((s) => s.statusLabel);

 const availableSources = useMemo(() => {
    const mapSources = overlayLayers
     .filter((layer) => (layer.group ?? "data") !== "analysis")
     .map((layer) => resolveVoxCityMapLayerSource(layer))
     .filter((source): source is VoxCityResolvedSource => source !== null);
    const cityJSONSource = resolveVoxCityCityJSONSource(cityJSONObjects, cityJSONSummary);

    return [
     ...mapSources,
     ...(cityJSONSource ? [cityJSONSource] : []),
     resolveVoxCitySampleSource(),
    ];
 }, [overlayLayers, cityJSONObjects, cityJSONSummary]);

 const activeSource = useMemo(
    () => availableSources.find((source) => source.metadata.id === activeSourceId) ?? null,
    [availableSources, activeSourceId],
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
    loadFeatures(activeSource.features);
 }, [activeSource, loadFeatures]);

 const extrusionAnalysis = useMemo(() => {
    if (!result || !activeSource || !runIdentity) return null;
   const heights = result.buildings.map((building) => building.height);
   const minHeight = heights.length > 0 ? Math.min(...heights) : null;
   const maxHeight = heights.length > 0 ? Math.max(...heights) : null;
   const avgHeight = heights.length > 0
    ? heights.reduce((sum, height) => sum + height, 0) / heights.length
    : null;
    return adaptFeatureCollectionAnalysisResult({
     engine: "BuildingExtrusion",
     featureCollection: buildExtrusionPublicationCollection(activeSource, result.buildings),
     layerId: `building-extrusion-${runIdentity.runId}`,
     layerName: `${activeSource.metadata.title} Extrusion`,
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
        lod,
        heightAttributeKey: heightAttrKey,
        heightAttributeKeys: [...heightStrategy.attributeKeys],
        floorsKey: heightStrategy.floorsKey ?? null,
        defaultHeight: heightStrategy.defaultHeight,
        geometryAssumptions: [...activeSource.metadata.geometryAssumptions],
     },
     visualization: {
        kind: "choropleth",
        title: `${activeSource.metadata.title} Building Heights`,
        valueField: "extrusion_height_m",
        labelField: "building_id",
        classificationMethod: "quantile",
        classCount: 5,
        colorRamp: "YlOrRd",
        popupFields: [
         "building_id",
         "extrusion_height_m",
         "extrusion_height_source",
         "voxcity_source_ref",
         "voxcity_source_mode",
        ],
     },
     statisticalSummary: {
        buildingCount: result.buildings.length,
        skippedCount: result.skipped.length,
      minHeight,
      maxHeight,
      avgHeight,
        sampleMode: activeSource.metadata.runtimeMode === "sample",
        inputFeatureCount: activeSource.metadata.featureCount,
     },
    });
 }, [activeSource, heightAttrKey, heightStrategy, lod, result, runIdentity]);

 const extrusionVoxCitySync = useMemo(() => {
    if (!activeSource || !extrusionAnalysis || !runIdentity) return null;
    const selectedBuildingIds = selectedBuildingId ? [selectedBuildingId] : [];
    const { scenarioArtifactId, mapReferenceArtifactId } = buildVoxCityScenarioArtifactIds(
     runIdentity.runId,
     "building_extrusion",
    );
    return buildMapVoxCitySyncMetadata({
     syncId: `voxcity-sync-building-extrusion-${runIdentity.runId}`,
     createdAt: runIdentity.runTimestamp,
     sourceView: "voxcity-3d",
     targetView: "map-2d",
     source: activeSource.metadata,
     mapLayerId: activeSource.metadata.sourceLayerId ?? null,
     outputLayerId: extrusionAnalysis.layer.id,
     selectedFeatureIds: resolveSelectedFeatureIds(activeSource, selectedSourceFeatureIds, selectedBuildingIds),
     selectedBuildingIds,
     buildingReferences: buildBuildingSyncReferences(activeSource, selectedBuildingIds),
     viewport: mapViewport,
     aoiId: activeAoiId ?? null,
     scenarioId: scenarioArtifactId,
     linkedRunId: runIdentity.runId,
     linkedArtifactIds: [scenarioArtifactId, mapReferenceArtifactId, extrusionAnalysis.evidenceArtifact.id],
     handoff: {
      reportHandoffId: `voxcity-report-building-extrusion-${runIdentity.runId}`,
      dashboardBindingId: `voxcity-dashboard-building-extrusion-${runIdentity.runId}`,
      ideArtifactId: `voxcity-ide-building-extrusion-${runIdentity.runId}`,
     },
    });
 }, [
    activeAoiId,
    activeSource,
    extrusionAnalysis,
    mapViewport,
    runIdentity,
    selectedBuildingId,
    selectedSourceFeatureIds,
 ]);

 const extrusionLayer = useMemo(() => {
  if (!extrusionAnalysis) return null;
  if (!extrusionVoxCitySync) return extrusionAnalysis.layer;
  return {
   ...extrusionAnalysis.layer,
   metadata: {
    ...extrusionAnalysis.layer.metadata,
    voxCitySync: extrusionVoxCitySync,
   },
  };
 }, [extrusionAnalysis, extrusionVoxCitySync]);

 const handleAddToMap = useCallback(() => {
    if (!extrusionLayer) return;
    addOverlayLayer(extrusionLayer);
 }, [extrusionLayer, addOverlayLayer]);

 const handleSendToSolar = useCallback(() => {
    if (!activeSource) return;
    const selectedIds = selectedBuildingId ? [selectedBuildingId] : [];
    setSunlightHandoff(activeSource, selectedIds);
    setHandoffNotice(
     selectedIds.length > 0
        ? `Sent ${selectedIds.length} selected building to Sunlight Simulation.`
        : `Sent ${activeSource.metadata.featureCount} buildings to Sunlight Simulation.`,
    );
 }, [activeSource, selectedBuildingId, setSunlightHandoff]);

 // Run extrusion whenever features, lod, or height strategy change
 useEffect(() => {
 if (features.length === 0 || !activeSource) return undefined;
 let cancelled = false;
 const nextRunIdentity = {
    runId: `building-extrusion-${Date.now()}`,
    runTimestamp: new Date().toISOString(),
 };
 setRunIdentity(nextRunIdentity);

 async function run() {
 setLoading(true);
 setProgress(0);
 setError(null);

 try {
 const res = await extrudeBuildings(features, {
 lod,
 strategy: heightStrategy,
 onProgress: (done, total) => {
 if (!cancelled) setProgress(total > 0 ? done / total : 0);
 },
 });
 if (!cancelled) setResult(res);
 } catch (err) {
 if (!cancelled) setError(err instanceof Error ? err.message : "Extrusion failed");
 }
 }

 run();
 return () => { cancelled = true; };
 }, [activeSource, features, lod, heightStrategy]); // eslint-disable-line react-hooks/exhaustive-deps

 useEffect(() => {
  if (!result || result.buildings.length === 0) return;
  setFitRevision((value) => value + 1);
 }, [result]);

 // Height attribute keys from the strategy
 const heightKeys = useMemo(() => {
 const allKeys = new Set<string>([
 ...heightStrategy.attributeKeys,
 ...numericAttrs,
 ]);
 return [...allKeys];
 }, [heightStrategy.attributeKeys, numericAttrs]);

 const stats = useMemo(() => {
 if (!result) return null;
 const heights = result.buildings.map((b) => b.height);
 const min = Math.min(...heights);
 const max = Math.max(...heights);
 const avg = heights.reduce((s, h) => s + h, 0) / (heights.length || 1);
 return {
 count: result.buildings.length,
 skipped: result.skipped.length,
 min,
 max,
 avg,
 durationMs: result.durationMs,
 lod: result.lod,
 };
 }, [result]);

 const sceneBounds = useMemo(
  () => resolveSceneBounds(result?.buildings ?? []),
  [result],
 );

 const handleOrbitControlsRef = useCallback((instance: unknown) => {
  orbitControlsRef.current = instance as OrbitControlsHandle | null;
 }, []);

 const fitBounds = useMemo(() => {
  if (!sceneBounds) return null;
  return sceneBounds;
 }, [sceneBounds]);

 const fitTarget = useMemo(() => {
  if (!sceneBounds) return null;
  return resolveSceneTarget(sceneBounds);
 }, [sceneBounds]);

 const extrusionCompletedRun = useMemo(() => {
  if (!activeSource || !extrusionAnalysis || !runIdentity || !stats || !result) return null;
  const narrative = buildExtrusionNarrative(activeSource, stats, heightAttrKey);
  return createAnalysisCompletedRun(extrusionAnalysis, {
   flowId: "voxcity_3d",
   runId: runIdentity.runId,
   insertedAt: runIdentity.runTimestamp,
   label: `${activeSource.metadata.title} Extrusion`,
   paragraph: narrative,
   paragraphPreview: narrative,
   paragraphFull: narrative,
   mapOutputs: [{
    ...createAnalysisMapOutput(extrusionAnalysis),
    type: "3d_scene",
   }],
   dataOutputs: [
    {
     id: `${runIdentity.runId}-provenance`,
     format: "voxcity-extrusion-provenance",
     rows: 1,
     columns: [
      "source_title",
      "source_kind",
      "source_ref",
      "runtime_mode",
      "source_layer_id",
      "input_feature_count",
      "lod",
      "height_attribute_key",
      "default_height_m",
      "geometry_assumptions",
     ],
     preview: [{
      source_title: activeSource.metadata.title,
      source_kind: activeSource.metadata.kind,
      source_ref: activeSource.metadata.sourceRef,
      runtime_mode: activeSource.metadata.runtimeMode,
      source_layer_id: activeSource.metadata.sourceLayerId ?? null,
      input_feature_count: activeSource.metadata.featureCount,
      lod,
      height_attribute_key: heightAttrKey,
      default_height_m: heightStrategy.defaultHeight,
      geometry_assumptions: activeSource.metadata.geometryAssumptions.join(" | "),
     }],
    },
    {
     id: `${runIdentity.runId}-buildings`,
     format: "voxcity-extrusion-buildings",
     rows: result.buildings.length,
     columns: ["building_id", "height_m", "height_source", "area_m2"],
     preview: result.buildings.slice(0, 8).map((building) => ({
      building_id: building.id,
      height_m: Number(building.height.toFixed(3)),
      height_source: building.heightSource,
      area_m2: Number(building.area.toFixed(3)),
     })),
    },
   ],
  });
 }, [activeSource, extrusionAnalysis, heightAttrKey, heightStrategy.defaultHeight, lod, result, runIdentity, stats]);

 useEffect(() => {
  if (!extrusionCompletedRun) return;
  upsertCompletedRun(extrusionCompletedRun);
 }, [extrusionCompletedRun, upsertCompletedRun]);

 useEffect(() => {
  if (!extrusionVoxCitySync) return;
  upsertMapEvidenceArtifact(createMapVoxCityHandoffEvidenceArtifact({
   voxCitySync: extrusionVoxCitySync,
   linkedWorkflowId: "voxcity_3d",
   title: `${extrusionVoxCitySync.source.title} 2D/3D extrusion handoff`,
   summary: `Reference-only VoxCity extrusion handoff for ${extrusionVoxCitySync.source.title}; geometry and mesh payloads remain in Map Explorer and VoxCity state.`,
  }));
 }, [extrusionVoxCitySync, upsertMapEvidenceArtifact]);

 useEffect(() => {
   if (!activeSource || !extrusionAnalysis || !runIdentity || !result || !extrusionCompletedRun) {
    return;
   }

   const { scenarioArtifactId, mapReferenceArtifactId } = buildVoxCityScenarioArtifactIds(
    runIdentity.runId,
    'building_extrusion',
   );

   registerVoxCityScenarioEvidence({
    scenarioArtifactId,
    mapReferenceArtifactId,
    title: `${activeSource.metadata.title} 3D Building Extrusion`,
    summary: `VoxCity 3D extrusion output with linked 2D map reference for ${activeSource.metadata.title}.`,
    sourceId: activeSource.metadata.id,
    flowId: 'voxcity_3d',
    linkedRunId: runIdentity.runId,
    linkedLayerId: extrusionAnalysis.layer.id,
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
       lod,
       height_attribute_key: heightAttrKey,
       default_height_m: Number(heightStrategy.defaultHeight.toFixed(3)),
       feature_count: activeSource.metadata.featureCount,
       extrusion_building_count: result.buildings.length,
       extrusion_skipped_count: result.skipped.length,
      },
      simulationType: 'building_extrusion',
      assumptions: [...activeSource.metadata.geometryAssumptions],
      uncertainty: [
       activeSource.metadata.runtimeMode === 'sample'
         ? 'Sample geometry source is active; use project data for planning-grade decisions.'
         : 'Input geometry quality and source metadata influence extrusion confidence.',
      ],
      outputReferences: {
       runId: runIdentity.runId,
       mapLayerId: extrusionAnalysis.layer.id,
       dataOutputIds: extrusionCompletedRun.dataOutputs.map((output) => output.id),
       chartOutputIds: [],
      },
    },
    tags: ['voxcity', '3d_modeling', 'built_form', 'morphology'],
    registerEvidenceArtifact,
   });
 }, [
   activeSource,
   context,
   extrusionAnalysis,
   extrusionCompletedRun,
   heightAttrKey,
   heightStrategy.defaultHeight,
   lod,
   registerEvidenceArtifact,
   result,
   runIdentity,
 ]);

 // ---- Linked selection: subscribe to map-2d selection and apply locally ----
 const lastBroadcastedRef = useRef<string | null>(null);
 useEffect(() => {
  return subscribeToVoxCitySelection((event) => {
   if (!event) {
    selectBuilding(null);
    lastBroadcastedRef.current = null;
    return;
   }
   if (event.source === "map-2d") {
    selectBuilding(event.buildingId);
    lastBroadcastedRef.current = event.buildingId;
   }
  });
 }, [selectBuilding]);

 // ---- Linked selection: broadcast 3D-side selection changes ----
 useEffect(() => {
  if (!selectedBuildingId) return;
  if (lastBroadcastedRef.current === selectedBuildingId) return;
  lastBroadcastedRef.current = selectedBuildingId;
  publishVoxCitySelection({
   source: "voxcity-3d",
   buildingId: selectedBuildingId,
  });
 }, [selectedBuildingId]);

 return (
 <div style={PANEL}>
 {/* Toolbar */}
 <div style={TOOLBAR}>
 <span style={LABEL}>Building Extruder</span>

 <span
  style={{
   ...SYNC_BADGE,
   borderColor: viewportSyncEnabled ? "rgba(55,148,255,0.42)" : "#333",
   background: viewportSyncEnabled ? "rgba(55,148,255,0.14)" : "rgba(38,38,38,0.92)",
   color: viewportSyncEnabled ? "#3794ff" : "#A8A29E",
  }}
  data-testid="voxcity-sync-status"
 >
  {viewportSyncStatus}
 </span>

 <span style={{ fontSize: "11px", color: "#A8A29E" }}>Source:</span>
 <select
 value={activeSourceId ?? ""}
 onChange={(e) => setActiveSourceId(e.target.value)}
 style={{ ...SELECT, minWidth: "220px" }}
 title="Choose the active building geometry source"
 data-testid="voxcity-source-select"
 >
 {availableSources.map((source) => (
 <option key={source.metadata.id} value={source.metadata.id}>
 {source.metadata.runtimeMode === "sample"
  ? `${source.metadata.title} (Sample mode)`
  : `${source.metadata.title} (${source.metadata.featureCount})`}
 </option>
 ))}
 </select>

 {/* LOD Toggle */}
 <button
 type="button"
 style={lod === "basic" ? BTN_ACTIVE : BTN}
 onClick={() => setLod("basic")}
 title="Basic LOD — flat roof box extrusion"
 >
 Basic
 </button>
 <button
 type="button"
 style={lod === "enriched" ? BTN_ACTIVE : BTN}
 onClick={() => setLod("enriched")}
 title="Enriched LOD — floor lines + detailed normals"
 >
 Enriched
 </button>

 <span style={{ width: "1px", height: "20px", background: "#444", flexShrink: 0 }} />

 {/* Height Attribute Selector */}
 <span style={{ fontSize: "11px", color: "#A8A29E" }}>Height source:</span>
 <select
 value={heightAttrKey}
 onChange={(e) => setHeightAttributeKey(e.target.value)}
 style={SELECT}
 title="Choose which attribute determines building height"
 >
 {heightKeys.map((k) => (
 <option key={k} value={k}>{k}</option>
 ))}
 </select>

 <span style={{ width: "1px", height: "20px", background: "#444", flexShrink: 0 }} />

 {/* Thematic Styling Toggle */}
 <button
 type="button"
 style={sidebarOpen ? BTN_ACTIVE : BTN}
 onClick={() => setSidebarOpen(!sidebarOpen)}
 title="Thematic styling — color buildings by attribute"
 >
 Styling
 </button>

 {/* Load Sample Data */}
 <button
 type="button"
 style={BTN}
 onClick={() => setActiveSourceId(resolveVoxCitySampleSource().metadata.id)}
 title="Load sample building dataset (50 buildings)"
 >
 Quick-Start Sample
 </button>

 <button
 type="button"
 style={BTN}
 onClick={handleSendToSolar}
 title="Send the selected building, or the active source if nothing is selected, to Sunlight Simulation"
 data-testid="voxcity-send-to-solar"
 >
 Send to Solar
 </button>

 <button
 type="button"
 style={BTN}
 onClick={() => setFitRevision((value) => value + 1)}
 title="Recenter and refit the 3D camera to all visible buildings"
 >
 Recenter View
 </button>

 {/* Add to Map */}
 {extrusionAnalysis && result && result.buildings.length > 0 && (
 <button
 type="button"
 style={{ ...BTN, background: "transparent", borderColor: "#3794ff", color: "#3794ff" }}
 onClick={handleAddToMap}
 title="Add building footprints as a map overlay layer"
 >
 Add to Map
 </button>
 )}

 {/* Stats badge */}
 {stats && (
 <span style={{ fontSize: "10px", color: "#A8A29E", marginLeft: "auto" }}>
 {stats.count} buildings | {stats.skipped} skipped | {stats.durationMs.toFixed(0)}ms
 </span>
 )}
 </div>

 {/* Canvas area */}
 <div style={VIEWPORT}>
 <div style={CANVAS_FILL}>
 <Canvas
 camera={{ position: [150, 100, 150], fov: 50, near: 0.1, far: 5000 }}
 gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
 dpr={[1, 2]}
 style={{ width: "100%", height: "100%", display: "block", background: "#0d0d0d" }}
 onPointerMissed={() => selectBuilding(null)}
 >
 <ambientLight intensity={0.5} />
 <directionalLight position={[100, 150, 80]} intensity={0.7} />
 <directionalLight position={[-60, 80, -40]} intensity={0.3} />
 <SceneContents />
 {fitBounds ? <CameraFit bounds={fitBounds} controlsRef={orbitControlsRef} fitRevision={fitRevision} /> : null}
 <ViewportSyncBridge controlsRef={orbitControlsRef} sceneBounds={sceneBounds} />
 <OrbitControls
 key={fitTarget ? `orbit-fit-${fitTarget.x.toFixed(3)}-${fitTarget.y.toFixed(3)}-${fitTarget.z.toFixed(3)}` : "orbit-default"}
 ref={handleOrbitControlsRef}
 makeDefault
 enableDamping
 dampingFactor={0.12}
 target={fitTarget ? [fitTarget.x, fitTarget.y, fitTarget.z] : [0, 0, 0]}
 minDistance={5}
 maxDistance={3000}
 maxPolarAngle={Math.PI * 0.48}
 />
 </Canvas>
 </div>

 {activeSource && (
 <div style={SOURCE_INFO_BOX} data-testid="voxcity-source-metadata">
 <div style={{ color: activeSource.metadata.runtimeMode === "sample" ? "#3794ff" : "#22C55E", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
 {handoffNotice && (
 <div style={{ color: "#22C55E" }}>{handoffNotice}</div>
 )}
 </div>
 )}

 {/* Loading overlay */}
 {loading && (
 <div style={OVERLAY}>
 <div style={{ color: "#3794ff", fontSize: "14px", fontWeight: 600 }}>
 Extruding buildings…
 </div>
 <div style={PROGRESS_BAR_BG}>
 <div
 style={{
 height: "100%",
 borderRadius: "3px",
 background: "#3794ff",
 width: `${Math.round(progress * 100)}%`,
 transition: "width 0.2s ease",
 }}
 />
 </div>
 <div style={{ fontSize: "11px", color: "#A8A29E" }}>
 {Math.round(progress * 100)}%
 </div>
 </div>
 )}

 {/* Error overlay */}
 {error && (
 <div style={OVERLAY}>
 <div style={{ color: "#EF4444", fontSize: "14px", fontWeight: 600 }}>
 Extrusion Error
 </div>
 <div style={{ color: "#D6D3D1", fontSize: "12px", maxWidth: "400px", textAlign: "center" }}>
 {error}
 </div>
 <button type="button" style={BTN} onClick={() => setError(null)}>
 Dismiss
 </button>
 </div>
 )}

 {/* Empty state */}
 {!loading && !error && (!result || result.buildings.length === 0) && features.length === 0 && (
 <div style={OVERLAY}>
 <div style={{ color: "#A8A29E", fontSize: "14px" }}>No building data loaded</div>
 <button
 type="button"
 style={BTN_ACTIVE}
 onClick={() => setActiveSourceId(resolveVoxCitySampleSource().metadata.id)}
 >
 Load Sample Buildings
 </button>
 </div>
 )}

 {/* Thematic sidebar */}
 <ThematicSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

 {/* Selected building info */}
 <SelectedBuildingInfo />
 </div>
 </div>
 );
}
