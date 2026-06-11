import type { FeatureCollection } from "geojson";

import type { OverlayLayerConfig } from "../mapTypes";
import type {
  MapSceneStatusChip,
  MapSceneTabId,
} from "../scene";
import type { MapPublishTabId } from "../publish";
import type { GisStatusKey } from "../mapTokens";
import {
  summarizeFrameFeatures,
  type TemporalFrameDefinition,
  type TemporalRuntimeMode,
} from "@/services/map/temporal";
import type { SourceHandle } from "../../../../services/map/contracts/gisContracts";

const SCENE_TAB_IDS: readonly MapSceneTabId[] = [
  "scene-raster",
  "scene-temporal",
  "scene-3d",
  "scene-zoning",
  "scene-massing",
  "scene-sun-shadow",
  "scene-voxcity",
];

const PUBLISH_TAB_IDS: readonly MapPublishTabId[] = [
  "publish-figure",
  "publish-data-export",
  "publish-report",
  "publish-offline-package",
  "publish-review-package",
];

function isMapSceneTabId(id: string): id is MapSceneTabId {
  return (SCENE_TAB_IDS as readonly string[]).includes(id);
}

export function resolveSceneTabId(id: string): MapSceneTabId {
  return isMapSceneTabId(id) ? id : "scene-3d";
}

function isMapPublishTabId(id: string): id is MapPublishTabId {
  return (PUBLISH_TAB_IDS as readonly string[]).includes(id);
}

export function resolvePublishTabId(id: string): MapPublishTabId {
  return isMapPublishTabId(id) ? id : "publish-figure";
}

export function sceneStatusChip(
  id: string,
  label: string,
  status: GisStatusKey,
  title?: string,
): MapSceneStatusChip {
  return title ? { id, label, status, title } : { id, label, status };
}

export function formatSceneStatusValue(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function sourceHandleCrs(handle: SourceHandle | null): string | null {
  return handle?.crsSummary.status === "known" ? handle.crsSummary.crs : null;
}

export function sourceHandleSceneKind(handle: SourceHandle | null): string | null {
  return handle?.scene3d?.sourceKind ?? null;
}

export function sceneVerticalDatumChip(
  terrainHandle: SourceHandle | null,
  cityModelHandle: SourceHandle | null,
): MapSceneStatusChip {
  const datum = terrainHandle?.scene3d?.verticalDatum ?? cityModelHandle?.scene3d?.verticalDatum;
  if (!datum) {
    return sceneStatusChip("vertical-datum", "Vertical datum: not recorded", "unknown");
  }
  if (datum.status === "known" && datum.value) {
    return sceneStatusChip("vertical-datum", `Vertical datum: ${datum.value}`, "ready", datum.caveats.join(" "));
  }
  return sceneStatusChip(
    "vertical-datum",
    `Vertical datum: unknown (${datum.source})`,
    "caveat",
    datum.caveats.join(" "),
  );
}

export function sceneVerticalDatumValue(
  terrainHandle: SourceHandle | null,
  cityModelHandle: SourceHandle | null,
): string | null {
  const datum = terrainHandle?.scene3d?.verticalDatum ?? cityModelHandle?.scene3d?.verticalDatum;
  if (!datum) return null;
  if (datum.status === "known" && datum.value) return datum.value;
  return `unknown (${datum.source})`;
}

export function layerCrsChip(layer: OverlayLayerConfig | null, fallback = "CRS: unknown"): MapSceneStatusChip {
  const summary = layer?.metadata?.crsSummary ?? layer?.metadata?.registry?.crsSummary;
  if (summary?.crs) return sceneStatusChip("crs", `CRS: ${summary.crs}`, "ready", summary.notes.join(" "));
  if (summary?.status === "missing") return sceneStatusChip("crs", "CRS: missing", "blocked", summary.notes.join(" "));
  return sceneStatusChip("crs", fallback, "unknown");
}

export function buildTemporalFrameDefinitions(
  frames: ReadonlyArray<{ key: string; label: string; data: FeatureCollection }>,
  valueField?: string,
): TemporalFrameDefinition[] {
  return frames.map((frame, index) => {
    const summary = summarizeFrameFeatures(frame.data.features, valueField);
    return {
      index,
      key: frame.key,
      label: frame.label,
      featureCount: summary.featureCount,
      binSum: summary.binSum,
    };
  });
}

export function collectTemporalSourceFields(
  frames: ReadonlyArray<{ data: FeatureCollection }>,
  timeField?: string,
): string[] {
  const fields = new Set<string>();
  for (const frame of frames) {
    for (const feature of frame.data.features) {
      for (const key of Object.keys(feature.properties ?? {})) {
        const trimmed = key.trim();
        if (!trimmed) {
          continue;
        }
        fields.add(trimmed);
        if (fields.size >= 24) {
          break;
        }
      }
      if (fields.size >= 24) {
        break;
      }
    }
    if (fields.size >= 24) {
      break;
    }
  }
  if (timeField?.trim()) {
    fields.add(timeField.trim());
  }
  return [...fields].sort((left, right) => left.localeCompare(right));
}

export function resolveTemporalRuntimeMode(layer: OverlayLayerConfig | null): TemporalRuntimeMode {
  if (!layer) {
    return "unknown";
  }
  if (layer.sourceKind === "demo") {
    return "demo";
  }
  const temporalTitle = `${layer.name} ${layer.metadata?.analysisResult?.visualization?.title ?? ""}`.toLowerCase();
  if (/\b(sample|synthetic|generated|simulation|scenario|forecast|predicted)\b/.test(temporalTitle)) {
    return "synthetic";
  }
  if (
    layer.sourceKind === "project"
    || layer.sourceKind === "imported"
    || layer.sourceKind === "external"
    || layer.sourceKind === "derived"
  ) {
    return "live";
  }
  return "unknown";
}

export function formatTemporalGeneratedLabel(mode: TemporalRuntimeMode): string {
  switch (mode) {
    case "live":
      return "Real/derived";
    case "demo":
      return "Sample/demo";
    case "synthetic":
      return "Generated";
    default:
      return "Not recorded";
  }
}

export function viewportSyncChip(enabled: boolean, statusLabel: string): MapSceneStatusChip {
  return sceneStatusChip(
    "sync-state",
    `Sync: ${enabled ? statusLabel : "off"}`,
    enabled ? "ready" : "caveat",
  );
}
