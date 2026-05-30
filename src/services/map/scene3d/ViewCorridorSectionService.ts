import { Plane, Vector3 } from "three";
import type { FeatureCollection, GeoJsonProperties, MultiPolygon, Polygon, Position } from "geojson";
import type { CrsPreflightResult } from "@/services/map/contracts/gisContracts";
import { CrsPreflight } from "@/services/map/crs/CrsPreflight";
import type { ExtrusionAnalysis } from "./Map3DSceneController";

export type Scene3DCoordinate = readonly [number, number, number];

export interface Scene3DBuildingMass {
  featureId: string;
  label: string;
  rings: Position[][];
  bbox: [number, number, number, number];
  centroid: [number, number];
  baseElevationM: number;
  heightMetres: number;
  topElevationM: number;
}

export interface ViewCorridorDefinition {
  label: string;
  origin: Scene3DCoordinate;
  target: Scene3DCoordinate;
  widthMetres: number;
  clearanceMetres: number;
}

export interface ViewCorridorIntrusion {
  featureId: string;
  label: string;
  distanceAlongM: number;
  allowedTopElevationM: number;
  actualTopElevationM: number;
  excessM: number;
  heightMetres: number;
  baseElevationM: number;
}

export type Scene3DAnalysisStatus = "ready" | "blocked";

export interface ViewCorridorAnalysisResult {
  kind: "view-corridor";
  status: Scene3DAnalysisStatus;
  layerId: string;
  analysedAt: string;
  corridor: ViewCorridorDefinition;
  crs: CrsPreflightResult;
  executionCrs: string | null;
  corridorLengthM: number;
  testedBuildingCount: number;
  intrusions: ViewCorridorIntrusion[];
  intrusionCount: number;
  assumptions: string[];
  caveats: string[];
  blockedReason?: string;
}

export type SectionPlaneAxis = "x" | "y" | "z";

export interface SectionPlaneDefinition {
  label: string;
  axis: SectionPlaneAxis;
  offsetM: number;
  thicknessM: number;
  clipEnabled: boolean;
}

export interface SerializableThreePlane {
  normal: [number, number, number];
  constant: number;
}

export interface SectionPlaneAnalysisResult {
  kind: "section-plane";
  status: Scene3DAnalysisStatus;
  layerId: string;
  analysedAt: string;
  plane: SectionPlaneDefinition;
  threePlane: SerializableThreePlane;
  crs: CrsPreflightResult;
  executionCrs: string | null;
  cutFeatureIds: string[];
  cutCount: number;
  contextFeatureCount: number;
  retainedContextFeatureIds: string[];
  maxCutHeightM: number;
  profileSpanM: number;
  clipRetainsAnalyzedGeometry: boolean;
  assumptions: string[];
  caveats: string[];
  blockedReason?: string;
}

export interface Scene3DAnalysisInput {
  layerId: string;
  declaredCrs: string | null;
  buildings: Scene3DBuildingMass[];
  verticalDatumLabel?: string | null;
}

interface Segment2D {
  start: [number, number];
  end: [number, number];
}

const DISPLAY_CRS = "EPSG:4326";

function nowIso(): string {
  return new Date().toISOString();
}

function numericProperty(properties: GeoJsonProperties | null | undefined, keys: readonly string[], fallback: number): number {
  for (const key of keys) {
    const parsed = Number(properties?.[key]);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function featureLabel(properties: GeoJsonProperties | null | undefined, fallback: string): string {
  const candidate = properties?.name ?? properties?.label ?? properties?.id;
  return typeof candidate === "string" || typeof candidate === "number" ? String(candidate) : fallback;
}

function featureIdAt(collectionFeature: FeatureCollection["features"][number], fallbackIndex: number): string {
  const rawId = collectionFeature.id ?? collectionFeature.properties?.id ?? fallbackIndex + 1;
  return String(rawId);
}

function geometryOuterRings(geometry: Polygon | MultiPolygon): Position[][] {
  if (geometry.type === "Polygon") {
    const outerRing = geometry.coordinates[0];
    return outerRing && outerRing.length >= 4 ? [outerRing] : [];
  }
  return geometry.coordinates
    .map((polygonCoordinates) => polygonCoordinates[0])
    .filter((outerRing): outerRing is Position[] => Boolean(outerRing && outerRing.length >= 4));
}

function ringBbox(rings: readonly Position[][]): [number, number, number, number] | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const ring of rings) {
    for (const coordinate of ring) {
      const xCoord = Number(coordinate[0]);
      const yCoord = Number(coordinate[1]);
      if (!Number.isFinite(xCoord) || !Number.isFinite(yCoord)) continue;
      minX = Math.min(minX, xCoord);
      minY = Math.min(minY, yCoord);
      maxX = Math.max(maxX, xCoord);
      maxY = Math.max(maxY, yCoord);
    }
  }
  if (minX === Number.POSITIVE_INFINITY) return null;
  return [minX, minY, maxX, maxY];
}

function collectionBbox(buildings: readonly Scene3DBuildingMass[]): [number, number, number, number] | null {
  if (buildings.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const building of buildings) {
    minX = Math.min(minX, building.bbox[0]);
    minY = Math.min(minY, building.bbox[1]);
    maxX = Math.max(maxX, building.bbox[2]);
    maxY = Math.max(maxY, building.bbox[3]);
  }
  return [minX, minY, maxX, maxY];
}

function distance2D(start: Scene3DCoordinate, end: Scene3DCoordinate): number {
  return Math.hypot(end[0] - start[0], end[1] - start[1]);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function projectionRatioOnSegment(point: [number, number], corridor: ViewCorridorDefinition): number {
  const dx = corridor.target[0] - corridor.origin[0];
  const dy = corridor.target[1] - corridor.origin[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= Number.EPSILON) return 0;
  const projected = ((point[0] - corridor.origin[0]) * dx + (point[1] - corridor.origin[1]) * dy) / lengthSquared;
  return clamp01(projected);
}

function corridorPolygon(corridor: ViewCorridorDefinition): Position[] {
  const length = distance2D(corridor.origin, corridor.target);
  if (length <= Number.EPSILON) return [];
  const halfWidth = Math.max(0.1, corridor.widthMetres / 2);
  const normalX = -(corridor.target[1] - corridor.origin[1]) / length;
  const normalY = (corridor.target[0] - corridor.origin[0]) / length;
  const offsetX = normalX * halfWidth;
  const offsetY = normalY * halfWidth;
  return [
    [corridor.origin[0] + offsetX, corridor.origin[1] + offsetY],
    [corridor.target[0] + offsetX, corridor.target[1] + offsetY],
    [corridor.target[0] - offsetX, corridor.target[1] - offsetY],
    [corridor.origin[0] - offsetX, corridor.origin[1] - offsetY],
    [corridor.origin[0] + offsetX, corridor.origin[1] + offsetY],
  ];
}

function edgesForRing(ring: readonly Position[]): Segment2D[] {
  const segments: Segment2D[] = [];
  for (let index = 0; index < ring.length - 1; index += 1) {
    const start = ring[index];
    const end = ring[index + 1];
    if (!start || !end) continue;
    segments.push({
      start: [Number(start[0]), Number(start[1])],
      end: [Number(end[0]), Number(end[1])],
    });
  }
  return segments;
}

function orientation(first: [number, number], second: [number, number], third: [number, number]): number {
  return (second[1] - first[1]) * (third[0] - second[0]) - (second[0] - first[0]) * (third[1] - second[1]);
}

function onSegment(first: [number, number], point: [number, number], second: [number, number]): boolean {
  return point[0] <= Math.max(first[0], second[0]) + 1e-9
    && point[0] >= Math.min(first[0], second[0]) - 1e-9
    && point[1] <= Math.max(first[1], second[1]) + 1e-9
    && point[1] >= Math.min(first[1], second[1]) - 1e-9;
}

function segmentsIntersect(first: Segment2D, second: Segment2D): boolean {
  const orientationOne = orientation(first.start, first.end, second.start);
  const orientationTwo = orientation(first.start, first.end, second.end);
  const orientationThree = orientation(second.start, second.end, first.start);
  const orientationFour = orientation(second.start, second.end, first.end);

  if (
    ((orientationOne > 0 && orientationTwo < 0) || (orientationOne < 0 && orientationTwo > 0))
    && ((orientationThree > 0 && orientationFour < 0) || (orientationThree < 0 && orientationFour > 0))
  ) {
    return true;
  }
  if (Math.abs(orientationOne) <= 1e-9 && onSegment(first.start, second.start, first.end)) return true;
  if (Math.abs(orientationTwo) <= 1e-9 && onSegment(first.start, second.end, first.end)) return true;
  if (Math.abs(orientationThree) <= 1e-9 && onSegment(second.start, first.start, second.end)) return true;
  if (Math.abs(orientationFour) <= 1e-9 && onSegment(second.start, first.end, second.end)) return true;
  return false;
}

function pointInRing(point: [number, number], ring: readonly Position[]): boolean {
  let inside = false;
  for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index, index += 1) {
    const current = ring[index];
    const previous = ring[previousIndex];
    if (!current || !previous) continue;
    const currentX = Number(current[0]);
    const currentY = Number(current[1]);
    const previousX = Number(previous[0]);
    const previousY = Number(previous[1]);
    const intersects = (currentY > point[1]) !== (previousY > point[1])
      && point[0] < ((previousX - currentX) * (point[1] - currentY)) / ((previousY - currentY) || Number.EPSILON) + currentX;
    if (intersects) inside = !inside;
  }
  return inside;
}

function ringsIntersectCorridor(rings: readonly Position[][], corridorRing: readonly Position[]): boolean {
  if (corridorRing.length < 4) return false;
  const corridorEdges = edgesForRing(corridorRing);
  for (const buildingRing of rings) {
    const buildingEdges = edgesForRing(buildingRing);
    if (buildingRing[0] && pointInRing([Number(buildingRing[0][0]), Number(buildingRing[0][1])], corridorRing)) {
      return true;
    }
    if (corridorRing[0] && pointInRing([Number(corridorRing[0][0]), Number(corridorRing[0][1])], buildingRing)) {
      return true;
    }
    for (const buildingEdge of buildingEdges) {
      if (corridorEdges.some((corridorEdge) => segmentsIntersect(buildingEdge, corridorEdge))) return true;
    }
  }
  return false;
}

function crsPreflight(layerId: string, declaredCrs: string | null, label: string): CrsPreflightResult {
  return CrsPreflight.preflight(
    {
      id: `scene3d.${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      label,
      metric: "distance",
      executionKind: "planar",
      displayCrs: DISPLAY_CRS,
    },
    [{ id: layerId, crs: declaredCrs }],
  );
}

function sharedAssumptions(input: Scene3DAnalysisInput, crs: CrsPreflightResult, extra: readonly string[]): string[] {
  const datum = input.verticalDatumLabel?.trim() || "vertical datum not recorded";
  return [
    `Execution CRS: ${crs.executionCrs ?? "unavailable"}.`,
    `Source CRS: ${crs.sourceCrs ?? "not declared"}; display CRS: ${crs.displayCrs}.`,
    `Vertical basis: ${datum}.`,
    ...extra,
  ];
}

function blockedCorridorResult(
  input: Scene3DAnalysisInput,
  corridor: ViewCorridorDefinition,
  crs: CrsPreflightResult,
  reason: string,
): ViewCorridorAnalysisResult {
  return {
    kind: "view-corridor",
    status: "blocked",
    layerId: input.layerId,
    analysedAt: nowIso(),
    corridor,
    crs,
    executionCrs: null,
    corridorLengthM: distance2D(corridor.origin, corridor.target),
    testedBuildingCount: input.buildings.length,
    intrusions: [],
    intrusionCount: 0,
    assumptions: sharedAssumptions(input, crs, ["Intrusion detection is not reported until a projected execution CRS is available."]),
    caveats: [reason],
    blockedReason: reason,
  };
}

function blockedSectionResult(
  input: Scene3DAnalysisInput,
  plane: SectionPlaneDefinition,
  crs: CrsPreflightResult,
  reason: string,
): SectionPlaneAnalysisResult {
  return {
    kind: "section-plane",
    status: "blocked",
    layerId: input.layerId,
    analysedAt: nowIso(),
    plane,
    threePlane: serializeSectionPlane(plane),
    crs,
    executionCrs: null,
    cutFeatureIds: [],
    cutCount: 0,
    contextFeatureCount: input.buildings.length,
    retainedContextFeatureIds: input.buildings.map((building) => building.featureId),
    maxCutHeightM: 0,
    profileSpanM: 0,
    clipRetainsAnalyzedGeometry: true,
    assumptions: sharedAssumptions(input, crs, ["The analyzed building set remains retained as context even when clipping is disabled or blocked."]),
    caveats: [reason],
    blockedReason: reason,
  };
}

export function buildScene3DBuildingMasses(
  collection: FeatureCollection<Polygon | MultiPolygon, GeoJsonProperties>,
  analysis: ExtrusionAnalysis,
): Scene3DBuildingMass[] {
  const heightMap = new Map(analysis.heights.map((heightInfo) => [String(heightInfo.featureId), heightInfo.heightMetres]));
  const buildings: Scene3DBuildingMass[] = [];
  collection.features.forEach((collectionFeature, featureIndex) => {
    if (collectionFeature.geometry.type !== "Polygon" && collectionFeature.geometry.type !== "MultiPolygon") return;
    const rings = geometryOuterRings(collectionFeature.geometry);
    const bbox = ringBbox(rings);
    if (!bbox) return;
    const featureId = featureIdAt(collectionFeature, featureIndex);
    const fallbackHeight = numericProperty(collectionFeature.properties, ["height", "height_m", "measuredHeight"], analysis.metersPerLevel);
    const heightMetres = heightMap.get(featureId) ?? fallbackHeight;
    const baseElevationM = numericProperty(
      collectionFeature.properties,
      ["scene3d_base_elevation_m", "base_elevation_m", "surface_min_z", "ground_elevation_m"],
      0,
    );
    const topElevationM = baseElevationM + Math.max(0, heightMetres);
    buildings.push({
      featureId,
      label: featureLabel(collectionFeature.properties, `Building ${featureId}`),
      rings,
      bbox,
      centroid: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
      baseElevationM,
      heightMetres: Math.max(0, heightMetres),
      topElevationM,
    });
  });
  return buildings;
}

export function buildDefaultViewCorridorDefinition(buildings: readonly Scene3DBuildingMass[]): ViewCorridorDefinition {
  const bbox = collectionBbox(buildings) ?? [0, 0, 120, 40];
  const width = Math.max(8, Math.min(36, Math.abs(bbox[3] - bbox[1]) * 0.45 || 12));
  const sortedCenterYs = buildings.map((building) => building.centroid[1]).sort((first, second) => first - second);
  const medianIndex = Math.floor(sortedCenterYs.length / 2);
  const centerY = sortedCenterYs[medianIndex] ?? (bbox[1] + bbox[3]) / 2;
  const sceneWidth = Math.max(20, bbox[2] - bbox[0]);
  return {
    label: "Protected view corridor",
    origin: [bbox[0] - sceneWidth * 0.08, centerY, 2],
    target: [bbox[2] + sceneWidth * 0.08, centerY, 8],
    widthMetres: width,
    clearanceMetres: 0,
  };
}

export function buildDefaultSectionPlaneDefinition(buildings: readonly Scene3DBuildingMass[]): SectionPlaneDefinition {
  const bbox = collectionBbox(buildings) ?? [0, 0, 120, 40];
  return {
    label: "Longitudinal section",
    axis: "x",
    offsetM: (bbox[0] + bbox[2]) / 2,
    thicknessM: Math.max(0.5, (bbox[2] - bbox[0]) * 0.03),
    clipEnabled: true,
  };
}

export function serializeSectionPlane(plane: SectionPlaneDefinition): SerializableThreePlane {
  if (plane.axis === "y") return { normal: [0, 1, 0], constant: -plane.offsetM };
  if (plane.axis === "z") return { normal: [0, 0, 1], constant: -plane.offsetM };
  return { normal: [1, 0, 0], constant: -plane.offsetM };
}

export function buildThreeClippingPlane(plane: SectionPlaneDefinition): Plane {
  const serialized = serializeSectionPlane(plane);
  return new Plane(
    new Vector3(serialized.normal[0], serialized.normal[1], serialized.normal[2]),
    serialized.constant,
  );
}

export function analyseViewCorridor(
  input: Scene3DAnalysisInput,
  corridor: ViewCorridorDefinition,
): ViewCorridorAnalysisResult {
  const crs = crsPreflight(input.layerId, input.declaredCrs, "View corridor intrusion");
  if (crs.blocked || !crs.executionCrs) {
    return blockedCorridorResult(input, corridor, crs, crs.reason ?? "View corridor intrusion requires a projected execution CRS.");
  }

  const corridorLengthM = distance2D(corridor.origin, corridor.target);
  if (corridorLengthM <= Number.EPSILON) {
    return blockedCorridorResult(input, corridor, crs, "View corridor origin and target must be distinct.");
  }

  const corridorRing = corridorPolygon(corridor);
  const intrusions = input.buildings
    .filter((building) => ringsIntersectCorridor(building.rings, corridorRing))
    .map((building): ViewCorridorIntrusion | null => {
      const ratio = projectionRatioOnSegment(building.centroid, corridor);
      const distanceAlongM = ratio * corridorLengthM;
      const sightlineElevationM = corridor.origin[2] + (corridor.target[2] - corridor.origin[2]) * ratio;
      const allowedTopElevationM = sightlineElevationM - corridor.clearanceMetres;
      const excessM = building.topElevationM - allowedTopElevationM;
      if (excessM <= 0) return null;
      return {
        featureId: building.featureId,
        label: building.label,
        distanceAlongM,
        allowedTopElevationM,
        actualTopElevationM: building.topElevationM,
        excessM,
        heightMetres: building.heightMetres,
        baseElevationM: building.baseElevationM,
      };
    })
    .filter((intrusion): intrusion is ViewCorridorIntrusion => intrusion !== null)
    .sort((first, second) => second.excessM - first.excessM || first.featureId.localeCompare(second.featureId));

  return {
    kind: "view-corridor",
    status: "ready",
    layerId: input.layerId,
    analysedAt: nowIso(),
    corridor,
    crs,
    executionCrs: crs.executionCrs,
    corridorLengthM,
    testedBuildingCount: input.buildings.length,
    intrusions,
    intrusionCount: intrusions.length,
    assumptions: sharedAssumptions(input, crs, [
      "Origin and target elevations form a straight protected sight line.",
      "Footprints are tested against a rectangular corridor width in the execution CRS.",
      "Building roofs are simplified as flat top elevations from the 3D extrusion height source.",
    ]),
    caveats: crs.caveats,
  };
}

function sectionAxisBounds(building: Scene3DBuildingMass, axis: SectionPlaneAxis): [number, number] {
  if (axis === "y") return [building.bbox[1], building.bbox[3]];
  if (axis === "z") return [building.baseElevationM, building.topElevationM];
  return [building.bbox[0], building.bbox[2]];
}

function profileSpan(buildings: readonly Scene3DBuildingMass[], axis: SectionPlaneAxis): number {
  if (buildings.length === 0) return 0;
  const values = buildings.flatMap((building) => {
    if (axis === "y") return [building.bbox[0], building.bbox[2]];
    if (axis === "z") return [building.bbox[0], building.bbox[2]];
    return [building.bbox[1], building.bbox[3]];
  });
  return Math.max(...values) - Math.min(...values);
}

export function analyseSectionPlane(
  input: Scene3DAnalysisInput,
  plane: SectionPlaneDefinition,
): SectionPlaneAnalysisResult {
  const crs = crsPreflight(input.layerId, input.declaredCrs, "Section cut plane");
  if (crs.blocked || !crs.executionCrs) {
    return blockedSectionResult(input, plane, crs, crs.reason ?? "Section cut plane requires a projected execution CRS.");
  }

  const halfThickness = Math.max(0, plane.thicknessM) / 2;
  const cutBuildings = input.buildings.filter((building) => {
    const [minValue, maxValue] = sectionAxisBounds(building, plane.axis);
    return plane.offsetM >= minValue - halfThickness && plane.offsetM <= maxValue + halfThickness;
  });
  const retainedContextFeatureIds = input.buildings.map((building) => building.featureId);
  const maxCutHeightM = cutBuildings.reduce((maxHeight, building) => Math.max(maxHeight, building.topElevationM), 0);

  return {
    kind: "section-plane",
    status: "ready",
    layerId: input.layerId,
    analysedAt: nowIso(),
    plane,
    threePlane: serializeSectionPlane(plane),
    crs,
    executionCrs: crs.executionCrs,
    cutFeatureIds: cutBuildings.map((building) => building.featureId),
    cutCount: cutBuildings.length,
    contextFeatureCount: input.buildings.length,
    retainedContextFeatureIds,
    maxCutHeightM,
    profileSpanM: profileSpan(cutBuildings, plane.axis),
    clipRetainsAnalyzedGeometry: retainedContextFeatureIds.length === input.buildings.length,
    assumptions: sharedAssumptions(input, crs, [
      "Three.js clipping plane normal and constant are serialized for render handoff.",
      "The clipping preview retains all analyzed building IDs as context so the cut cannot hide the analysis set.",
      "Section measurements are planar metres in the execution CRS with flat roof/extrusion assumptions.",
    ]),
    caveats: crs.caveats,
  };
}

export const ViewCorridorSectionService = {
  analyseSectionPlane,
  analyseViewCorridor,
  buildDefaultSectionPlaneDefinition,
  buildDefaultViewCorridorDefinition,
  buildScene3DBuildingMasses,
  buildThreeClippingPlane,
  serializeSectionPlane,
} as const;