/**
 * CityJSONViewer — Full 3D viewer for CityJSON city models.
 *
 * UI deliverables:
 * - Drag-and-drop / file input for CityJSON file import
 * - Loading progress bar with phase label
 * - Metadata inspection panel (object counts, surfaces, attributes)
 * - 3D viewer with semantic surface coloring (roof, wall, ground)
 * - Object click → attribute query panel
 * - Semantic surface visibility toggles
 *
 * Follows Charcoal-Amber design system.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { useCityJSONScene } from "./hooks/useCityJSONScene";
import { loadCityJSON, loadCityJSONFile } from "./CityJSONLoader";
import { SAMPLE_CITYJSON_STRING } from "./sampleCityJSON";
import { DEFAULT_SEMANTIC_COLORS, type ParsedCityObject, type SemanticSurfaceType } from "./cityJsonTypes";

/* ================================================================== */
/* §1 STYLES (Charcoal-Amber) */
/* ================================================================== */

const PANEL: React.CSSProperties = {
 display: "flex",
 flexDirection: "column",
 height: "100%",
 minHeight: "760px",
 background: "#0d0d0d",
 color: "#FAFAF9",
 fontFamily: "Inter, system-ui, sans-serif",
 fontSize: "13px",
 overflow: "hidden",
 position: "relative",
};

const CONTENT_AREA: React.CSSProperties = {
 flex: 1,
 position: "relative",
 minHeight: "620px",
};

const TOOLBAR: React.CSSProperties = {
 display: "flex",
 alignItems: "center",
 gap: "10px",
 padding: "8px 12px",
 background: "#1a1a1a",
 borderBottom: "1px solid #333",
 flexShrink: 0,
 zIndex: 10,
 flexWrap: "wrap",
};

const LABEL: React.CSSProperties = {
 fontSize: "11px",
 fontWeight: 600,
 textTransform: "uppercase",
 letterSpacing: "0.06em",
 color: "#F59E0B",
};

const BTN: React.CSSProperties = {
 padding: "4px 12px",
 borderRadius: "4px",
 border: "1px solid #444",
 background: "#262626",
 color: "#e0e0e0",
 fontSize: "12px",
 cursor: "pointer",
 transition: "background 0.15s, border-color 0.15s",
};

const BTN_ACTIVE: React.CSSProperties = {
 ...BTN,
 background: "#F59E0B",
 color: "#1a1a1a",
 borderColor: "#F59E0B",
 fontWeight: 600,
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
 width: "240px",
 height: "6px",
 borderRadius: "3px",
 background: "#333",
 overflow: "hidden",
};

const SIDEBAR: React.CSSProperties = {
 position: "absolute",
 top: 0,
 right: 0,
 width: "280px",
 height: "100%",
 background: "#1a1a1a",
 borderLeft: "1px solid #333",
 zIndex: 15,
 overflowY: "auto",
 padding: "12px",
 display: "flex",
 flexDirection: "column",
 gap: "10px",
};

const INFO_BOX: React.CSSProperties = {
 position: "absolute",
 bottom: "12px",
 left: "12px",
 background: "rgba(26,26,26,0.92)",
 border: "1px solid #444",
 borderRadius: "6px",
 padding: "10px 14px",
 zIndex: 15,
 maxWidth: "320px",
 fontSize: "12px",
 lineHeight: 1.5,
};

const DROP_ZONE: React.CSSProperties = {
 display: "flex",
 flexDirection: "column",
 alignItems: "center",
 justifyContent: "center",
 gap: "16px",
 height: "100%",
 padding: "40px",
 textAlign: "center",
};

const DROP_ZONE_ACTIVE: React.CSSProperties = {
 ...DROP_ZONE,
 background: "rgba(245, 158, 11, 0.08)",
 outline: "2px dashed #F59E0B",
 outlineOffset: "-12px",
};

/* ================================================================== */
/* §2 SEMANTIC COLOR HELPER */
/* ================================================================== */

function getSemanticColor(type: SemanticSurfaceType | null): THREE.Color {
 if (type && DEFAULT_SEMANTIC_COLORS[type]) {
 const [r, g, b] = DEFAULT_SEMANTIC_COLORS[type];
 return new THREE.Color(r, g, b);
 }
 return new THREE.Color(0.65, 0.65, 0.60);
}

/* ================================================================== */
/* §3 THREE.JS COMPONENTS */
/* ================================================================== */

interface ObjectMeshProps {
 obj: ParsedCityObject;
 surfaceVisibility: Record<string, boolean>;
 selected: boolean;
 onSelect: (id: string) => void;
}

/** Renders a single CityObject — one mesh per semantic surface. */
function ObjectMesh({ obj, surfaceVisibility, selected, onSelect }: ObjectMeshProps) {
 return (
 <group>
 {obj.surfaces.map((surface, i) => {
 const key = surface.semanticType ?? "__none__";
 if (surfaceVisibility[key] === false) return null;

 const geo = new THREE.BufferGeometry();
 geo.setAttribute("position", new THREE.BufferAttribute(surface.positions, 3));
 geo.setAttribute("normal", new THREE.BufferAttribute(surface.normals, 3));
 geo.setIndex(new THREE.BufferAttribute(surface.indices, 1));

 const color = selected
 ? new THREE.Color(0.96, 0.62, 0.04)
 : getSemanticColor(surface.semanticType);

 return (
 <mesh
 key={`${obj.id}-${i}`}
 geometry={geo}
 onClick={(e) => {
 e.stopPropagation();
 onSelect(obj.id);
 }}
 >
 <meshStandardMaterial
 color={color}
 transparent
 opacity={selected ? 1.0 : 0.92}
 roughness={0.7}
 metalness={0.1}
 side={THREE.DoubleSide}
 />
 </mesh>
 );
 })}
 </group>
 );
}

/** Ground plane. */
function Ground({ size }: { size: number }) {
 return (
 <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size / 2, -0.01, size / 2]} receiveShadow>
 <planeGeometry args={[size * 2, size * 2]} />
 <meshStandardMaterial color="#1a1a1a" transparent opacity={0.6} />
 </mesh>
 );
}

/** Auto-fit camera to scene bounds on first load. */
function CameraFit({ bbox }: { bbox: [number, number, number, number, number, number] }) {
 const { camera } = useThree();
 const fitted = useRef(false);
 useEffect(() => {
 if (fitted.current) return;
 fitted.current = true;
 const cx = (bbox[0] + bbox[3]) / 2;
 const cy = (bbox[1] + bbox[4]) / 2;
 const cz = (bbox[2] + bbox[5]) / 2;
 const spanX = bbox[3] - bbox[0];
 const spanY = bbox[4] - bbox[1];
 const spanZ = bbox[5] - bbox[2];
 const span = Math.max(spanX, spanY, spanZ) * 1.2;
 camera.position.set(cx + span * 0.7, cz + span * 0.5, cy + span * 0.7);
 camera.lookAt(cx, cz * 0.3, cy);
 }, [bbox, camera]);
 return null;
}

/** Renders all CityObjects. */
function SceneContents() {
 const objects = useCityJSONScene((s) => s.objects);
 const summary = useCityJSONScene((s) => s.summary);
 const selectedObjectId = useCityJSONScene((s) => s.selectedObjectId);
 const surfaceVisibility = useCityJSONScene((s) => s.surfaceVisibility);
 const selectObject = useCityJSONScene((s) => s.selectObject);

 const bbox = summary?.bbox ?? null;
 const groundSize = useMemo(() => {
 if (!bbox) return 100;
 return Math.max(bbox[3] - bbox[0], bbox[4] - bbox[1]) * 1.5;
 }, [bbox]);

 return (
 <>
 {bbox && <CameraFit bbox={bbox} />}
 <Ground size={groundSize} />
 {objects.map((obj) => (
 <ObjectMesh
 key={obj.id}
 obj={obj}
 surfaceVisibility={surfaceVisibility}
 selected={obj.id === selectedObjectId}
 onSelect={selectObject}
 />
 ))}
 </>
 );
}

/* ================================================================== */
/* §4 METADATA PANEL */
/* ================================================================== */

function MetadataPanel({ onClose }: { onClose: () => void }) {
 const summary = useCityJSONScene((s) => s.summary);
 if (!summary) return null;

 return (
 <div style={SIDEBAR} role="complementary" aria-label="CityJSON Metadata">
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <span style={LABEL}>Metadata</span>
 <button style={BTN} onClick={onClose}>Close</button>
 </div>

 <div style={{ borderTop: "1px solid #333", paddingTop: "8px" }}>
 <div style={{ ...LABEL, fontSize: "10px", marginBottom: "4px" }}>Document</div>
 <div>Version: {summary.version}</div>
 <div>CRS: {summary.referenceSystem ?? "Not specified"}</div>
 <div>Vertices: {summary.vertexCount.toLocaleString()}</div>
 <div>Parse time: {summary.parseTimeMs.toFixed(0)} ms</div>
 </div>

 <div style={{ borderTop: "1px solid #333", paddingTop: "8px" }}>
 <div style={{ ...LABEL, fontSize: "10px", marginBottom: "4px" }}>
 CityObjects ({summary.objectCount})
 </div>
 {Object.entries(summary.objectTypeCounts).map(([type, count]) => (
 <div key={type} style={{ display: "flex", justifyContent: "space-between" }}>
 <span>{type}</span>
 <span style={{ color: "#A8A29E" }}>{count}</span>
 </div>
 ))}
 </div>

 <div style={{ borderTop: "1px solid #333", paddingTop: "8px" }}>
 <div style={{ ...LABEL, fontSize: "10px", marginBottom: "4px" }}>Semantic Surfaces</div>
 {Object.entries(summary.semanticSurfaceCounts).length === 0
 ? <div style={{ color: "#A8A29E" }}>No semantic surfaces</div>
 : Object.entries(summary.semanticSurfaceCounts).map(([type, count]) => {
 const rgb = DEFAULT_SEMANTIC_COLORS[type] ?? [0.65, 0.65, 0.6];
 const hex = `rgb(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)})`;
 return (
 <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
 <span style={{
 width: "10px", height: "10px", borderRadius: "2px",
 background: hex, flexShrink: 0,
 }} />
 <span style={{ flex: 1 }}>{type}</span>
 <span style={{ color: "#A8A29E" }}>{count}</span>
 </div>
 );
 })
 }
 </div>

 <div style={{ borderTop: "1px solid #333", paddingTop: "8px" }}>
 <div style={{ ...LABEL, fontSize: "10px", marginBottom: "4px" }}>Attribute Keys</div>
 {summary.attributeKeys.length === 0
 ? <div style={{ color: "#A8A29E" }}>None</div>
 : summary.attributeKeys.map((k) => <div key={k} style={{ color: "#D6D3D1" }}>{k}</div>)
 }
 </div>
 </div>
 );
}

/* ================================================================== */
/* §5 ATTRIBUTE QUERY PANEL (selected object) */
/* ================================================================== */

function SelectedObjectInfo() {
 const objects = useCityJSONScene((s) => s.objects);
 const selectedId = useCityJSONScene((s) => s.selectedObjectId);

 const obj = useMemo(
 () => (selectedId ? objects.find((o) => o.id === selectedId) : null),
 [objects, selectedId],
 );

 if (!obj) return null;

 const entries = Object.entries(obj.attributes).slice(0, 10);
 const surfaceTypes = [...new Set(obj.surfaces.map((s) => s.semanticType).filter(Boolean))];

 return (
 <div style={INFO_BOX}>
 <div style={{ ...LABEL, marginBottom: "4px" }}>Selected Object</div>
 <div><strong>ID:</strong> {obj.id}</div>
 <div><strong>Type:</strong> {obj.type}</div>
 <div><strong>LOD:</strong> {obj.lod}</div>
 <div><strong>Surfaces:</strong> {obj.surfaces.length}</div>
 {surfaceTypes.length > 0 && (
 <div><strong>Semantic:</strong> {surfaceTypes.join(", ")}</div>
 )}
 {entries.length > 0 && (
 <>
 <div style={{ ...LABEL, fontSize: "10px", marginTop: "6px", marginBottom: "2px" }}>
 Attributes
 </div>
 {entries.map(([k, v]) => (
 <div key={k}>
 <span style={{ color: "#A8A29E" }}>{k}:</span>{" "}
 <span>{String(v)}</span>
 </div>
 ))}
 </>
 )}
 </div>
 );
}

/* ================================================================== */
/* §6 SURFACE VISIBILITY TOGGLES */
/* ================================================================== */

function SurfaceToggles() {
 const summary = useCityJSONScene((s) => s.summary);
 const visibility = useCityJSONScene((s) => s.surfaceVisibility);
 const toggle = useCityJSONScene((s) => s.toggleSurfaceVisibility);

 if (!summary) return null;
 const types = Object.keys(summary.semanticSurfaceCounts);
 if (types.length === 0) return null;

 return (
 <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
 {types.map((type) => {
 const visible = visibility[type] !== false;
 const rgb = DEFAULT_SEMANTIC_COLORS[type] ?? [0.65, 0.65, 0.6];
 const hex = `rgb(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)})`;
 return (
 <button
 key={type}
 style={{
 ...BTN,
 opacity: visible ? 1 : 0.4,
 borderColor: visible ? hex : "#444",
 fontSize: "11px",
 display: "flex",
 alignItems: "center",
 gap: "4px",
 }}
 onClick={() => toggle(type)}
 title={`Toggle ${type}`}
 >
 <span style={{
 width: "8px", height: "8px", borderRadius: "2px",
 background: hex, flexShrink: 0,
 }} />
 {type.replace("Surface", "")}
 </button>
 );
 })}
 </div>
 );
}

/* ================================================================== */
/* §7 MAIN COMPONENT */
/* ================================================================== */

export default function CityJSONViewer() {
 const {
 objects,
 summary,
 loading,
 progressPhase,
 progressDone,
 progressTotal,
 error,
 metadataOpen,
 setLoadResult,
 setLoading,
 setProgress,
 setError,
 setMetadataOpen,
 reset,
 selectObject,
 } = useCityJSONScene();

 const fileInputRef = useRef<HTMLInputElement>(null);
 const [dragActive, setDragActive] = useState(false);

 /* ------- Load handler ------- */
 const handleLoad = useCallback(
 async (source: string | File) => {
 setLoading(true);
 setError(null);
 try {
 const result =
 typeof source === "string"
 ? await loadCityJSON(source, (phase, done, total) =>
 setProgress(phase, done, total),
 )
 : await loadCityJSONFile(source, (phase, done, total) =>
 setProgress(phase, done, total),
 );
 setLoadResult(result);
 } catch (err) {
 setError(err instanceof Error ? err.message : String(err));
 }
 },
 [setLoadResult, setLoading, setProgress, setError],
 );

 /* ------- File input handler ------- */
 const onFileSelect = useCallback(
 (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) void handleLoad(file);
 e.target.value = "";
 },
 [handleLoad],
 );

 /* ------- Drag-and-drop handlers ------- */
 const onDragOver = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setDragActive(true);
 }, []);

 const onDragLeave = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setDragActive(false);
 }, []);

 const onDrop = useCallback(
 (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setDragActive(false);
 const file = e.dataTransfer.files?.[0];
 if (file && (file.name.endsWith(".json") || file.name.endsWith(".cityjson"))) {
 void handleLoad(file);
 } else if (file) {
 setError("Please drop a .json or .cityjson file");
 }
 },
 [handleLoad, setError],
 );

 /* ------- Load sample on demand ------- */
 const loadSample = useCallback(() => {
 void handleLoad(SAMPLE_CITYJSON_STRING);
 }, [handleLoad]);

 /* ------- Hidden file input ------- */
 const hiddenInput = (
 <input
 ref={fileInputRef}
 type="file"
 accept=".json,.cityjson"
 onChange={onFileSelect}
 style={{ display: "none" }}
 />
 );

 const hasData = objects.length > 0;

 /* ------- Progress fraction ------- */
 const progressFrac = progressTotal > 0 ? Math.min(progressDone / progressTotal, 1) : 0;

 return (
 <div style={PANEL}>
 {hiddenInput}

 {/* Toolbar */}
 <div style={TOOLBAR}>
 <span style={LABEL}>CityJSON Viewer</span>
 <button style={BTN} onClick={() => fileInputRef.current?.click()}>
 Import File
 </button>
 <button style={BTN} onClick={loadSample}>
 Load Sample
 </button>
 {hasData && (
 <>
 <button
 style={metadataOpen ? BTN_ACTIVE : BTN}
 onClick={() => setMetadataOpen(!metadataOpen)}
 >
 Metadata
 </button>
 <SurfaceToggles />
 <span style={{ marginLeft: "auto", fontSize: "11px", color: "#A8A29E" }}>
 {summary?.objectCount ?? 0} objects
 </span>
 </>
 )}
 {hasData && (
 <button style={{ ...BTN, fontSize: "11px" }} onClick={reset}>
 Clear
 </button>
 )}
 </div>

 {/* Content area */}
 <div style={CONTENT_AREA}>

 {/* Empty state — drag-and-drop zone */}
 {!hasData && !loading && !error && (
 <div
 style={dragActive ? DROP_ZONE_ACTIVE : DROP_ZONE}
 onDragOver={onDragOver}
 onDragLeave={onDragLeave}
 onDrop={onDrop}
 >
 <div style={{ fontSize: "48px" }} />
 <div style={{ fontSize: "16px", fontWeight: 600, color: "#FAFAF9" }}>
 Import CityJSON
 </div>
 <div style={{ color: "#A8A29E", maxWidth: "400px" }}>
 Drag and drop a <strong>.cityjson</strong> or <strong>.json</strong> file here,
 or use the toolbar buttons to import a file or load sample data.
 </div>
 <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
 <button style={BTN} onClick={() => fileInputRef.current?.click()}>
 Choose File
 </button>
 <button style={BTN_ACTIVE} onClick={loadSample}>
 Load Sample Data
 </button>
 </div>
 <div style={{ fontSize: "11px", color: "#666", marginTop: "12px" }}>
 Supports CityJSON v2.0 with semantic surfaces
 </div>
 </div>
 )}

 {/* Loading overlay */}
 {loading && (
 <div style={OVERLAY}>
 <div style={{ fontSize: "14px", color: "#F59E0B" }}>
 {progressPhase || "Loading…"}
 </div>
 <div style={PROGRESS_BAR_BG}>
 <div
 style={{
 width: `${progressFrac * 100}%`,
 height: "100%",
 borderRadius: "3px",
 background: "#F59E0B",
 transition: "width 0.2s ease",
 }}
 />
 </div>
 {progressTotal > 0 && (
 <div style={{ fontSize: "11px", color: "#A8A29E" }}>
 {progressDone.toLocaleString()} / {progressTotal.toLocaleString()}
 </div>
 )}
 </div>
 )}

 {/* Error overlay */}
 {error != null && (
 <div style={OVERLAY}>
 <div style={{ color: "#EF4444", fontSize: "14px", fontWeight: 600 }}>
 Error
 </div>
 <div style={{ color: "#D6D3D1", maxWidth: "400px", textAlign: "center" }}>
 {error}
 </div>
 <button style={BTN} onClick={() => setError(null)}>Dismiss</button>
 </div>
 )}

 {/* 3D Canvas */}
 {hasData && (
 <Canvas
 camera={{ position: [150, 100, 150], fov: 50 }}
 gl={{ antialias: true }}
 style={{ height: "100%", width: "100%" }}
 onClick={() => selectObject(null)}
 >
 <ambientLight intensity={0.5} />
 <directionalLight position={[100, 150, 80]} intensity={0.7} />
 <directionalLight position={[-60, 80, -40]} intensity={0.3} />
 <SceneContents />
 <OrbitControls makeDefault enableDamping dampingFactor={0.12} />
 </Canvas>
 )}

 {/* Sidebars */}
 {metadataOpen && hasData && <MetadataPanel onClose={() => setMetadataOpen(false)} />}
 {hasData && <SelectedObjectInfo />}
 </div>
 </div>
 );
}
