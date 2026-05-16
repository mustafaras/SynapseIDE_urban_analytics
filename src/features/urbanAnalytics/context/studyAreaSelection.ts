/**
 * Urban Analytics — Study Area Selection Service
 *
 * Single source of truth for synchronizing the Urban Analytics study area
 * across the header mini map, Map Explorer, Center Panel workflow context,
 * and the Urban evidence registry.
 *
 * The contract distinguishes three explicit synchronization modes:
 *
 *   1. Preview sync — `previewUrbanStudyAreaInWorkspace`
 *      Lightweight, scalar updates only. Writes Map Explorer
 *      `currentMapBounds` and applies the immediate viewport. Does NOT
 *      mutate Urban context, Urban evidence, AOI features, or trigger a
 *      fit-bounds animation in an already-open Map Explorer modal.
 *
 *   2. Open Map Explorer — `openMapExplorerWithStudyAreaPreview`
 *      Calls preview sync, queues a typed pending fit-bounds request
 *      through the Map Explorer store, and opens Map Explorer. The
 *      request is durable: Map Explorer consumes it once its canvas is
 *      ready, regardless of mount ordering.
 *
 *   3. Commit — `applyUrbanStudyAreaSelection`
 *      Final, durable binding: AOI feature, Map Explorer viewport,
 *      Urban context (`studyAreaName`, `studyAreaId`, `studyAreaBounds`,
 *      `activeAoiId`), and a lightweight Urban evidence artifact (no
 *      bulk geometry, scalar metadata only).
 *
 * Geometry passed across modules is intentionally lightweight. Only
 * `bounds` (4 numbers) and `aoiId` (string) cross module boundaries; the
 * polygon AOI feature is built locally by this service and registered
 * directly with Map Explorer's drawn-feature store.
 */

import type {
  DrawnFeature,
  PendingFitBoundsRequest,
  ViewportState,
} from '@/centerpanel/components/map/mapTypes';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';

import type { UrbanEvidenceScalar } from '../lib/types';
import { useUrbanContextStore } from '../useUrbanContextStore';

export type UrbanStudyAreaBounds = [number, number, number, number];

export interface UrbanStudyAreaCandidate {
  id: string;
  label: string;
  shortLabel: string;
  center: [number, number];
  bounds: UrbanStudyAreaBounds;
  source: 'Nominatim';
  sourceId: string;
  sourceClass: string | null;
  sourceType: string | null;
  importance: number | null;
}

export interface UrbanStudyAreaSelectionInput {
  label: string;
  bounds: UrbanStudyAreaBounds;
  center: [number, number];
  source: string;
  sourceId?: string | null;
  sourceClass?: string | null;
  sourceType?: string | null;
  importance?: number | null;
}

export interface UrbanStudyAreaSelectionResult {
  studyAreaId: string;
  aoiId: string;
  bounds: UrbanStudyAreaBounds;
  viewport: Pick<ViewportState, 'center' | 'zoom' | 'bearing' | 'pitch'>;
  evidenceArtifactId: string;
  fitRequestId: string;
}

export interface UrbanStudyAreaPreviewInput {
  bounds: UrbanStudyAreaBounds;
  source: string;
}

export interface UrbanStudyAreaPreviewResult {
  bounds: UrbanStudyAreaBounds;
  viewport: Pick<ViewportState, 'center' | 'zoom' | 'bearing' | 'pitch'>;
}

export interface UrbanStudyAreaOpenMapInput {
  bounds: UrbanStudyAreaBounds;
  source: string;
  aoiId?: string;
}

export interface UrbanStudyAreaOpenMapResult {
  bounds: UrbanStudyAreaBounds;
  viewport: Pick<ViewportState, 'center' | 'zoom' | 'bearing' | 'pitch'>;
  fitRequest: PendingFitBoundsRequest;
}

interface NominatimSearchResult {
  place_id?: number | string;
  osm_type?: string;
  osm_id?: number | string;
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  boundingbox?: [string, string, string, string];
  class?: string;
  type?: string;
  importance?: number;
}

export const URBAN_STUDY_AREA_FIT_BOUNDS_EVENT = 'synapse:map:fitBounds';

export function normalizeStudyAreaBounds(bounds: readonly number[]): UrbanStudyAreaBounds | null {
  if (bounds.length !== 4) return null;
  const [westRaw, southRaw, eastRaw, northRaw] = bounds.map(Number);
  if (![westRaw, southRaw, eastRaw, northRaw].every(Number.isFinite)) return null;

  const west = Math.max(-180, Math.min(180, Math.min(westRaw!, eastRaw!)));
  const east = Math.max(-180, Math.min(180, Math.max(westRaw!, eastRaw!)));
  const south = Math.max(-90, Math.min(90, Math.min(southRaw!, northRaw!)));
  const north = Math.max(-90, Math.min(90, Math.max(southRaw!, northRaw!)));

  if (west === east && south === north) return null;
  return [
    Number(west.toFixed(6)),
    Number(south.toFixed(6)),
    Number(east.toFixed(6)),
    Number(north.toFixed(6)),
  ];
}

export function parseNominatimBoundingBox(
  boundingbox: NominatimSearchResult['boundingbox'],
): UrbanStudyAreaBounds | null {
  if (!boundingbox || boundingbox.length !== 4) return null;
  const [south, north, west, east] = boundingbox.map(Number);
  return normalizeStudyAreaBounds([west!, south!, east!, north!]);
}

export function boundsFromCenter(
  center: readonly [number, number],
  spanDegrees = 0.08,
): UrbanStudyAreaBounds {
  const [lng, lat] = center;
  return normalizeStudyAreaBounds([
    lng - spanDegrees,
    lat - spanDegrees,
    lng + spanDegrees,
    lat + spanDegrees,
  ]) ?? [lng, lat, lng, lat];
}

export function viewportFromBounds(
  bounds: UrbanStudyAreaBounds,
): Pick<ViewportState, 'center' | 'zoom' | 'bearing' | 'pitch'> {
  const lngSpan = Math.max(0.0001, Math.abs(bounds[2] - bounds[0]));
  const latSpan = Math.max(0.0001, Math.abs(bounds[3] - bounds[1]));
  const span = Math.max(lngSpan, latSpan);
  const zoom = Math.max(4, Math.min(15, Math.round((11.5 - Math.log2(span)) * 10) / 10));
  return {
    center: [
      Number(((bounds[0] + bounds[2]) / 2).toFixed(6)),
      Number(((bounds[1] + bounds[3]) / 2).toFixed(6)),
    ],
    zoom,
    bearing: 0,
    pitch: 0,
  };
}

export function formatStudyAreaBounds(bounds: UrbanStudyAreaBounds): string {
  return bounds.map((value) => value.toFixed(4)).join(', ');
}

function safeIdPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'area';
}

function shortLabelFromDisplayName(label: string): string {
  const parts = label.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.slice(0, 3).join(', ') || label.trim();
}

function polygonFromBounds(bounds: UrbanStudyAreaBounds): GeoJSON.Polygon {
  const [west, south, east, north] = bounds;
  return {
    type: 'Polygon',
    coordinates: [[
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ]],
  };
}

function buildStudyAreaAoiFeature(
  aoiId: string,
  label: string,
  bounds: UrbanStudyAreaBounds,
): DrawnFeature {
  return {
    id: aoiId,
    geometry: polygonFromBounds(bounds),
    properties: {
      label,
      createdAt: new Date().toISOString(),
      style: {
        strokeColor: '#3794ff',
        fillColor: '#3794ff',
        strokeWidth: 2,
        fillOpacity: 0.12,
      },
    },
  };
}

/**
 * Dispatch a legacy `synapse:map:fitBounds` window event so existing
 * listeners (e.g. UrbanEvidenceTray Publish flow) keep working. The
 * primary, durable contract is the typed `requestFitBounds` store action;
 * this event is fired alongside as a non-authoritative compatibility hook.
 */
function dispatchLegacyFitBoundsEvent(
  bounds: UrbanStudyAreaBounds,
  source: string,
  aoiId?: string,
): void {
  if (typeof window === 'undefined') return;
  const detail = aoiId
    ? { bounds, source, aoiId }
    : { bounds, source };
  try {
    window.dispatchEvent(new CustomEvent(URBAN_STUDY_AREA_FIT_BOUNDS_EVENT, { detail }));
  } catch {
    /* JSDOM/test environments without CustomEvent — silently ignore. */
  }
}

/**
 * Preview sync. Updates Map Explorer scalar bounds + viewport so an open
 * Map Explorer instance and any downstream listeners see the latest
 * candidate extent. Does NOT mutate Urban context, AOI features, or
 * Urban evidence. Does NOT request a fit-bounds animation, so panning the
 * mini map does not yank an open Map Explorer modal around.
 */
export function previewUrbanStudyAreaInWorkspace(
  input: UrbanStudyAreaPreviewInput,
): UrbanStudyAreaPreviewResult {
  const bounds = normalizeStudyAreaBounds(input.bounds);
  if (!bounds) {
    throw new Error('Cannot preview study area without valid bounds.');
  }
  const viewport = viewportFromBounds(bounds);
  const mapStore = useMapExplorerStore.getState();

  mapStore.setCurrentMapBounds(bounds);
  mapStore.applyImmediateViewport(viewport);

  return { bounds, viewport };
}

/**
 * Open Map Explorer at the given study-area bounds.
 *
 * Performs preview sync (so scalar state is correct immediately), queues
 * a typed fit-bounds request through the Map Explorer store, fires the
 * legacy fit-bounds event for backwards compatibility, and finally calls
 * `open()`. The store request is durable, so the modal will fit the
 * target extent regardless of mount ordering.
 */
export function openMapExplorerWithStudyAreaPreview(
  input: UrbanStudyAreaOpenMapInput,
): UrbanStudyAreaOpenMapResult {
  const { bounds, viewport } = previewUrbanStudyAreaInWorkspace({
    bounds: input.bounds,
    source: input.source,
  });
  const mapStore = useMapExplorerStore.getState();
  const fitRequest = mapStore.requestFitBounds(input.aoiId
    ? { bounds, source: input.source, aoiId: input.aoiId }
    : { bounds, source: input.source });
  dispatchLegacyFitBoundsEvent(bounds, input.source, input.aoiId);
  mapStore.open();
  return { bounds, viewport, fitRequest };
}

export async function geocodeUrbanStudyArea(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<UrbanStudyAreaCandidate[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('polygon_geojson', '0');

  const response = await fetchImpl(url.toString(), {
    headers: {
      'Accept-Language': 'en',
    },
  });
  if (!response.ok) {
    throw new Error(`Study area search failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as NominatimSearchResult[];
  return payload
    .map((item, index): UrbanStudyAreaCandidate | null => {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const label = item.display_name?.trim() || item.name?.trim() || trimmed;
      const center: [number, number] = [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
      const bbox = parseNominatimBoundingBox(item.boundingbox) ?? boundsFromCenter(center);
      const sourceId = item.osm_type && item.osm_id
        ? `${item.osm_type}:${item.osm_id}`
        : item.place_id != null
          ? `place:${item.place_id}`
          : `candidate:${index}`;
      return {
        id: `nominatim-${safeIdPart(sourceId)}`,
        label,
        shortLabel: shortLabelFromDisplayName(label),
        center,
        bounds: bbox,
        source: 'Nominatim',
        sourceId,
        sourceClass: item.class ?? null,
        sourceType: item.type ?? null,
        importance: typeof item.importance === 'number' && Number.isFinite(item.importance)
          ? item.importance
          : null,
      };
    })
    .filter((item): item is UrbanStudyAreaCandidate => item != null);
}

/**
 * Final commit. Writes the durable Urban + Map Explorer + evidence state
 * for a confirmed study-area selection. Returns identifiers so callers
 * can correlate UI state without re-reading internal stores.
 */
export function applyUrbanStudyAreaSelection(
  input: UrbanStudyAreaSelectionInput,
): UrbanStudyAreaSelectionResult {
  const bounds = normalizeStudyAreaBounds(input.bounds) ?? boundsFromCenter(input.center);
  const viewport = viewportFromBounds(bounds);
  const studyAreaId = input.sourceId?.trim() || `manual:${safeIdPart(input.label)}`;
  const aoiId = `urban-study-area-${safeIdPart(studyAreaId)}`;
  const artifactId = `urban-study-area-artifact-${safeIdPart(studyAreaId)}`;
  const aoiFeature = buildStudyAreaAoiFeature(aoiId, input.label, bounds);

  const mapStore = useMapExplorerStore.getState();
  if (mapStore.drawnFeatures.some((feature) => feature.id === aoiId)) {
    mapStore.updateDrawnFeature(aoiId, aoiFeature);
  } else {
    mapStore.addDrawnFeature(aoiFeature);
  }

  // Scalar viewport + bounds applied synchronously via the typed store
  // contract — no debounce, no ad-hoc setState.
  mapStore.setCurrentMapBounds(bounds);
  mapStore.applyImmediateViewport(viewport);
  mapStore.setActiveAoi(aoiId);

  const fitRequest = mapStore.requestFitBounds({
    bounds,
    source: 'urban-analytics-study-area',
    aoiId,
  });
  dispatchLegacyFitBoundsEvent(bounds, 'urban-analytics-study-area', aoiId);

  const urbanStore = useUrbanContextStore.getState();
  urbanStore.setStudyArea(input.label.trim() || 'Study area', studyAreaId, bounds);
  urbanStore.setActiveAoi(aoiId);

  const contextId = useUrbanContextStore.getState().context?.contextId ?? null;
  const metadata: Record<string, UrbanEvidenceScalar> = {
    source: input.source,
    sourceId: studyAreaId,
    sourceClass: input.sourceClass ?? null,
    sourceType: input.sourceType ?? null,
    importance: input.importance ?? null,
    bounds: formatStudyAreaBounds(bounds),
    center: `${viewport.center[0].toFixed(6)}, ${viewport.center[1].toFixed(6)}`,
    zoom: viewport.zoom,
    crs: 'EPSG:4326',
  };

  urbanStore.registerEvidenceArtifact({
    id: artifactId,
    kind: 'dataset',
    title: `Study area: ${input.label}`,
    summary: `Geocoded study area extent from ${input.source}. Workflows should treat this as the shared spatial context and verify boundary fitness before measurement or publication.`,
    state: 'active',
    sourceModule: 'map-explorer',
    sourceId: studyAreaId,
    linkedContextId: contextId ?? undefined,
    linkedStudyAreaId: studyAreaId,
    linkedLayerIds: [aoiId],
    qa: {
      state: 'unvalidated',
      warnings: [],
      limitations: [
        'Geocoded viewport/bounding-box extent is a spatial reference, not an official administrative boundary.',
        'Area and distance calculations still require a projected CRS appropriate to the study area.',
      ],
    },
    provenance: {
      sourceModule: 'map-explorer',
      sourceId: studyAreaId,
      sourceTitle: input.label,
      sourceUri: input.source === 'Nominatim' ? 'https://nominatim.openstreetmap.org/' : undefined,
      contextId: contextId ?? undefined,
      layerIds: [aoiId],
      notes: `Study area committed from mini-map viewport in EPSG:4326 display coordinates. Bounds: ${formatStudyAreaBounds(bounds)}.`,
    },
    metadata,
  });

  return {
    studyAreaId,
    aoiId,
    bounds,
    viewport,
    evidenceArtifactId: artifactId,
    fitRequestId: fitRequest.requestId,
  };
}
