import { booleanValid } from "@turf/boolean-valid";
import { kinks } from "@turf/kinks";
import initGeosJs from "geos-wasm";
import geosHelpers from "geos-wasm/helpers";
import type {
  Feature,
  FeatureCollection,
  GeoJsonObject,
  Geometry,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from "geojson";

export type TopologyRepairIssueCode =
  | "self_intersection"
  | "null_geometry"
  | "empty_geometry"
  | "ring_orientation"
  | "invalid_geojson_geometry"
  | "geos_validation_failed"
  | "geos_repair_failed";

export type TopologyRepairFindingSeverity = "warning" | "error";

export interface TopologyRepairFinding {
  featureId: string;
  featureIndex: number;
  code: TopologyRepairIssueCode;
  severity: TopologyRepairFindingSeverity;
  title: string;
  detail: string;
  repairable: boolean;
  blocksApply: boolean;
  geosReason?: string;
  operation?: string;
}

export interface TopologyRepairInput {
  layerId: string;
  layerName: string;
  featureCollection: FeatureCollection;
  checkedAt?: string;
}

export interface TopologyRepairPreview {
  status: "valid" | "needs-repair" | "blocked";
  canApply: boolean;
  layerId: string;
  layerName: string;
  sourceFeatureCount: number;
  outputFeatureCount: number;
  repairedFeatureCount: number;
  removedFeatureCount: number;
  findings: TopologyRepairFinding[];
  blockers: string[];
  caveats: string[];
  repairedFeatureCollection: FeatureCollection;
  usedGeos: boolean;
  provenance: {
    engine: "geos-wasm";
    operations: string[];
    previewedAt: string;
  };
}

interface FeatureRepairResult {
  feature: Feature | null;
  changed: boolean;
  findings: TopologyRepairFinding[];
  operations: string[];
}

type GeosModule = Awaited<ReturnType<typeof initGeosJs>>;

const SELF_INTERSECTION_PATTERN = /self-?intersection/i;
const EMPTY_GEOMETRY_TYPES = new Set<string>([
  "Point",
  "LineString",
  "Polygon",
  "MultiPoint",
  "MultiLineString",
  "MultiPolygon",
  "GeometryCollection",
]);

export async function validateAndRepairTopology(input: TopologyRepairInput): Promise<TopologyRepairPreview> {
  const previewedAt = input.checkedAt ?? new Date().toISOString();
  const geos = await loadGeos();
  const usedGeos = geos !== null;
  const findings: TopologyRepairFinding[] = [];
  const repairedFeatures: Feature[] = [];
  const operations = new Set<string>();
  let repairedFeatureCount = 0;
  let removedFeatureCount = 0;

  input.featureCollection.features.forEach((feature, featureIndex) => {
    const result = repairFeature({
      feature,
      featureIndex,
      layerName: input.layerName,
      geos,
    });
    findings.push(...result.findings);
    result.operations.forEach((operation) => operations.add(operation));
    if (result.feature) {
      repairedFeatures.push(result.feature);
      if (result.changed) repairedFeatureCount += 1;
    } else {
      removedFeatureCount += 1;
    }
  });

  const blockers = findings
    .filter((finding) => finding.blocksApply)
    .map((finding) => `${finding.title}: ${finding.detail}`);
  if (findings.length > 0 && repairedFeatures.length === 0) {
    blockers.push("Repair preview would produce an empty layer.");
  }

  const status: TopologyRepairPreview["status"] =
    blockers.length > 0
      ? "blocked"
      : findings.length > 0
        ? "needs-repair"
        : "valid";
  const caveats = buildCaveats(findings, removedFeatureCount, usedGeos);

  return {
    status,
    canApply: status === "needs-repair" && (repairedFeatureCount > 0 || removedFeatureCount > 0),
    layerId: input.layerId,
    layerName: input.layerName,
    sourceFeatureCount: input.featureCollection.features.length,
    outputFeatureCount: repairedFeatures.length,
    repairedFeatureCount,
    removedFeatureCount,
    findings,
    blockers,
    caveats,
    repairedFeatureCollection: {
      type: "FeatureCollection",
      features: repairedFeatures,
    },
    usedGeos,
    provenance: {
      engine: "geos-wasm",
      operations: Array.from(operations),
      previewedAt,
    },
  };
}

async function loadGeos(): Promise<GeosModule | null> {
  try {
    return await initGeosJs({
      noticeHandler: () => {},
      errorHandler: () => {},
    });
  } catch {
    return null;
  }
}

function repairFeature(input: {
  feature: Feature;
  featureIndex: number;
  layerName: string;
  geos: GeosModule | null;
}): FeatureRepairResult {
  const { feature, featureIndex, geos } = input;
  const featureIdValue = featureId(feature, featureIndex);
  const findings: TopologyRepairFinding[] = [];
  const operations: string[] = [];

  if (!feature.geometry) {
    findings.push({
      featureId: featureIdValue,
      featureIndex,
      code: "null_geometry",
      severity: "error",
      title: "Missing feature geometry",
      detail: "The feature has null geometry and is removed from the repair preview.",
      repairable: false,
      blocksApply: false,
      operation: "drop-null-geometry",
    });
    operations.push("drop-null-geometry");
    return { feature: null, changed: false, findings, operations };
  }

  if (isEmptyGeometry(feature.geometry)) {
    findings.push({
      featureId: featureIdValue,
      featureIndex,
      code: "empty_geometry",
      severity: "error",
      title: "Empty feature geometry",
      detail: "The feature has empty coordinates and is removed from the repair preview.",
      repairable: false,
      blocksApply: false,
      operation: "drop-empty-geometry",
    });
    operations.push("drop-empty-geometry");
    return { feature: null, changed: false, findings, operations };
  }

  const orientation = repairRingOrientation(feature.geometry, featureIdValue, featureIndex);
  findings.push(...orientation.findings);
  operations.push(...orientation.operations);
  const orientedFeature: Feature = orientation.changed
    ? {
        ...feature,
        geometry: orientation.geometry,
        properties: feature.properties ? { ...feature.properties } : null,
      }
    : cloneFeature(feature);

  if (!geos) {
    return repairFeatureWithFallback(orientedFeature, featureIndex, findings, operations);
  }

  return repairFeatureWithGeos(orientedFeature, featureIndex, geos, findings, operations, orientation.changed);
}

function repairFeatureWithGeos(
  feature: Feature,
  featureIndex: number,
  geos: GeosModule,
  inheritedFindings: TopologyRepairFinding[],
  inheritedOperations: string[],
  inheritedChanged: boolean,
): FeatureRepairResult {
  const featureIdValue = featureId(feature, featureIndex);
  const findings = [...inheritedFindings];
  const operations = [...inheritedOperations, "GEOSisValid"];
  let geomPtr = 0;
  let repairedPtr = 0;

  try {
    geomPtr = geosHelpers.geojsonToGeosGeom(feature.geometry as unknown as GeoJsonObject, geos);
    if (!geomPtr) {
      findings.push(geosFailureFinding(featureIdValue, featureIndex, "GEOS could not parse the feature geometry."));
      return { feature: null, changed: inheritedChanged, findings, operations };
    }

    const isValid = geos.GEOSisValid(geomPtr) === 1;
    const reason = String(geos.GEOSisValidReason(geomPtr) ?? "");
    if (isValid) {
      return { feature, changed: inheritedChanged, findings, operations };
    }

    operations.push("GEOSMakeValid");
    const code = codeFromGeosReason(reason);
    findings.push({
      featureId: featureIdValue,
      featureIndex,
      code,
      severity: "error",
      title: code === "self_intersection" ? "Self-intersection detected" : "Invalid GeoJSON geometry",
      detail: reason || "GEOS reported the feature geometry as invalid.",
      repairable: true,
      blocksApply: false,
      geosReason: reason || "Invalid geometry",
      operation: "GEOSMakeValid",
    });

    repairedPtr = geos.GEOSMakeValid(geomPtr);
    if (!repairedPtr || geos.GEOSisValid(repairedPtr) !== 1) {
      const repairedReason = repairedPtr ? String(geos.GEOSisValidReason(repairedPtr) ?? "") : "GEOSMakeValid returned no geometry.";
      findings.push({
        featureId: featureIdValue,
        featureIndex,
        code: "geos_repair_failed",
        severity: "error",
        title: "Topology repair failed",
        detail: repairedReason,
        repairable: false,
        blocksApply: true,
        geosReason: repairedReason,
      });
      return { feature: null, changed: inheritedChanged, findings, operations };
    }

    const repairedGeometry = geosHelpers.geosGeomToGeojson(repairedPtr, geos) as unknown as Geometry;
    if (isEmptyGeometry(repairedGeometry)) {
      findings.push({
        featureId: featureIdValue,
        featureIndex,
        code: "geos_repair_failed",
        severity: "error",
        title: "Topology repair produced empty geometry",
        detail: "GEOSMakeValid returned an empty geometry for this feature.",
        repairable: false,
        blocksApply: true,
        operation: "GEOSMakeValid",
      });
      return { feature: null, changed: true, findings, operations };
    }

    return {
      feature: {
        ...feature,
        geometry: repairedGeometry,
        properties: feature.properties ? { ...feature.properties } : null,
      },
      changed: true,
      findings,
      operations,
    };
  } catch (error) {
    findings.push(geosFailureFinding(
      featureIdValue,
      featureIndex,
      error instanceof Error ? error.message : "GEOS topology validation failed.",
    ));
    return { feature: null, changed: inheritedChanged, findings, operations };
  } finally {
    if (repairedPtr) geos.GEOSGeom_destroy(repairedPtr);
    if (geomPtr) geos.GEOSGeom_destroy(geomPtr);
  }
}

function repairFeatureWithFallback(
  feature: Feature,
  featureIndex: number,
  inheritedFindings: TopologyRepairFinding[],
  inheritedOperations: string[],
): FeatureRepairResult {
  const featureIdValue = featureId(feature, featureIndex);
  const findings = [...inheritedFindings];
  const operations = [...inheritedOperations, "turf.booleanValid"];
  try {
    const valid = booleanValid(feature as never);
    if (valid) {
      return {
        feature,
        changed: inheritedFindings.some((finding) => finding.code === "ring_orientation"),
        findings,
        operations,
      };
    }
    const kinkCount = feature.geometry ? kinks(feature as never).features.length : 0;
    findings.push({
      featureId: featureIdValue,
      featureIndex,
      code: kinkCount > 0 ? "self_intersection" : "invalid_geojson_geometry",
      severity: "error",
      title: kinkCount > 0 ? "Self-intersection detected" : "Invalid GeoJSON geometry",
      detail: "GEOS was unavailable, so the feature was detected but not repaired.",
      repairable: false,
      blocksApply: true,
      operation: "turf.booleanValid",
    });
    return { feature: null, changed: false, findings, operations };
  } catch (error) {
    findings.push({
      featureId: featureIdValue,
      featureIndex,
      code: "geos_validation_failed",
      severity: "error",
      title: "Topology validation failed",
      detail: error instanceof Error ? error.message : "Fallback topology validation failed.",
      repairable: false,
      blocksApply: true,
    });
    return { feature: null, changed: false, findings, operations };
  }
}

function geosFailureFinding(featureIdValue: string, featureIndex: number, detail: string): TopologyRepairFinding {
  return {
    featureId: featureIdValue,
    featureIndex,
    code: "geos_validation_failed",
    severity: "error",
    title: "GEOS validation failed",
    detail,
    repairable: false,
    blocksApply: true,
  };
}

function codeFromGeosReason(reason: string): TopologyRepairIssueCode {
  return SELF_INTERSECTION_PATTERN.test(reason) ? "self_intersection" : "invalid_geojson_geometry";
}

function buildCaveats(
  findings: TopologyRepairFinding[],
  removedFeatureCount: number,
  usedGeos: boolean,
): string[] {
  const caveats: string[] = [];
  if (!usedGeos) {
    caveats.push("GEOS WASM was unavailable; topology issues were detected but repair is blocked.");
  }
  if (removedFeatureCount > 0) {
    caveats.push(`${removedFeatureCount.toLocaleString()} null or empty feature(s) are removed in the repair preview.`);
  }
  if (findings.some((finding) => finding.code === "ring_orientation")) {
    caveats.push("Ring orientation was normalized to the GeoJSON right-hand rule before validity checks.");
  }
  if (findings.some((finding) => finding.code === "self_intersection")) {
    caveats.push("Self-intersections were repaired with GEOSMakeValid; review split polygon outputs before analysis.");
  }
  return caveats;
}

interface RingOrientationResult {
  geometry: Geometry;
  changed: boolean;
  findings: TopologyRepairFinding[];
  operations: string[];
}

function repairRingOrientation(
  geometry: Geometry,
  featureIdValue: string,
  featureIndex: number,
): RingOrientationResult {
  if (geometry.type === "Polygon") {
    const result = rewindPolygon(geometry);
    return ringOrientationResult(geometry, result.geometry, result.changed, featureIdValue, featureIndex);
  }
  if (geometry.type === "MultiPolygon") {
    let changed = false;
    const coordinates = geometry.coordinates.map((polygon) => {
      const result = rewindPolygon({ type: "Polygon", coordinates: polygon });
      if (result.changed) changed = true;
      return result.geometry.coordinates;
    });
    const nextGeometry: MultiPolygon = { type: "MultiPolygon", coordinates };
    return ringOrientationResult(geometry, nextGeometry, changed, featureIdValue, featureIndex);
  }
  if (geometry.type === "GeometryCollection") {
    let changed = false;
    const geometries = geometry.geometries.map((entry) => {
      const result = repairRingOrientation(entry, featureIdValue, featureIndex);
      if (result.changed) changed = true;
      return result.geometry;
    });
    const nextGeometry: GeometryCollection = { type: "GeometryCollection", geometries };
    return ringOrientationResult(geometry, nextGeometry, changed, featureIdValue, featureIndex);
  }
  return { geometry, changed: false, findings: [], operations: [] };
}

function ringOrientationResult(
  original: Geometry,
  geometry: Geometry,
  changed: boolean,
  featureIdValue: string,
  featureIndex: number,
): RingOrientationResult {
  if (!changed) return { geometry: original, changed: false, findings: [], operations: [] };
  return {
    geometry,
    changed: true,
    findings: [{
      featureId: featureIdValue,
      featureIndex,
      code: "ring_orientation",
      severity: "warning",
      title: "Ring orientation normalized",
      detail: "Polygon rings did not follow the GeoJSON right-hand rule.",
      repairable: true,
      blocksApply: false,
      operation: "rewind-rings",
    }],
    operations: ["rewind-rings"],
  };
}

function rewindPolygon(polygon: Polygon): { geometry: Polygon; changed: boolean } {
  let changed = false;
  const coordinates = polygon.coordinates.map((ring, ringIndex) => {
    const area = signedRingArea(ring);
    if (Math.abs(area) < Number.EPSILON) return ring.map(clonePosition);
    const shouldBeCounterClockwise = ringIndex === 0;
    const isCounterClockwise = area > 0;
    if (isCounterClockwise !== shouldBeCounterClockwise) {
      changed = true;
      return [...ring].reverse().map(clonePosition);
    }
    return ring.map(clonePosition);
  });
  return { geometry: { type: "Polygon", coordinates }, changed };
}

function signedRingArea(ring: Position[]): number {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    if (!current || !next) continue;
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function cloneFeature(feature: Feature): Feature {
  return {
    ...feature,
    geometry: cloneGeometry(feature.geometry),
    properties: feature.properties ? { ...feature.properties } : null,
  };
}

function cloneGeometry(geometry: Geometry | null): Geometry | null {
  if (!geometry) return null;
  switch (geometry.type) {
    case "Point":
      return { type: "Point", coordinates: clonePosition((geometry as Point).coordinates) };
    case "MultiPoint":
      return { type: "MultiPoint", coordinates: (geometry as MultiPoint).coordinates.map(clonePosition) };
    case "LineString":
      return { type: "LineString", coordinates: (geometry as LineString).coordinates.map(clonePosition) };
    case "MultiLineString":
      return {
        type: "MultiLineString",
        coordinates: (geometry as MultiLineString).coordinates.map((line) => line.map(clonePosition)),
      };
    case "Polygon":
      return {
        type: "Polygon",
        coordinates: (geometry as Polygon).coordinates.map((ring) => ring.map(clonePosition)),
      };
    case "MultiPolygon":
      return {
        type: "MultiPolygon",
        coordinates: (geometry as MultiPolygon).coordinates.map((polygon) =>
          polygon.map((ring) => ring.map(clonePosition)),
        ),
      };
    case "GeometryCollection":
      return {
        type: "GeometryCollection",
        geometries: (geometry as GeometryCollection).geometries.map((entry) => cloneGeometry(entry) as Geometry),
      };
  }
}

function clonePosition(position: Position): Position {
  return [...position];
}

function isEmptyGeometry(geometry: Geometry): boolean {
  if (!EMPTY_GEOMETRY_TYPES.has(geometry.type)) return false;
  if (geometry.type === "GeometryCollection") {
    return geometry.geometries.length === 0 || geometry.geometries.every(isEmptyGeometry);
  }
  return coordinatesAreEmpty((geometry as Exclude<Geometry, GeometryCollection>).coordinates);
}

function coordinatesAreEmpty(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return true;
  if (typeof value[0] === "number") {
    return value.some((coordinate) => typeof coordinate !== "number" || !Number.isFinite(coordinate));
  }
  return value.every(coordinatesAreEmpty);
}

function featureId(feature: Feature, index: number): string {
  if (feature.id !== undefined && feature.id !== null) return String(feature.id);
  const rawId = feature.properties?.id;
  if (rawId !== undefined && rawId !== null) return String(rawId);
  return `feature-${index + 1}`;
}

export interface TopologyRepairWorkerRequest {
  requestId: string;
  input: TopologyRepairInput;
}

export type TopologyRepairWorkerResponse =
  | { requestId: string; ok: true; preview: TopologyRepairPreview }
  | { requestId: string; ok: false; error: string };

type WorkerGlobalCandidate = typeof globalThis & {
  WorkerGlobalScope?: { new(): unknown };
  postMessage?: (message: TopologyRepairWorkerResponse) => void;
  onmessage?: ((event: MessageEvent<TopologyRepairWorkerRequest>) => void) | null;
};

const workerScope = globalThis as WorkerGlobalCandidate;
const WorkerGlobalScopeCtor = workerScope.WorkerGlobalScope;

if (typeof WorkerGlobalScopeCtor === "function" && globalThis instanceof WorkerGlobalScopeCtor) {
  workerScope.onmessage = (event: MessageEvent<TopologyRepairWorkerRequest>) => {
    const { requestId, input } = event.data;
    void validateAndRepairTopology(input)
      .then((preview) => {
        workerScope.postMessage?.({ requestId, ok: true, preview });
      })
      .catch((error: unknown) => {
        workerScope.postMessage?.({
          requestId,
          ok: false,
          error: error instanceof Error ? error.message : "Topology repair worker failed.",
        });
      });
  };
}
