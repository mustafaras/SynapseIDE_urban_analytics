// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMapExplorerStore } from '@/stores/useMapExplorerStore';

import {
  applyUrbanStudyAreaSelection,
  geocodeUrbanStudyArea,
  openMapExplorerWithStudyAreaPreview,
  parseNominatimBoundingBox,
  previewUrbanStudyAreaInWorkspace,
  viewportFromBounds,
} from '../context/studyAreaSelection';
import { useUrbanContextStore } from '../useUrbanContextStore';

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('study area selection helpers', () => {
  it('parses Nominatim bounding boxes into Map Explorer bounds order', () => {
    expect(parseNominatimBoundingBox(['40.9000', '41.2000', '28.8000', '29.3000']))
      .toEqual([28.8, 40.9, 29.3, 41.2]);
  });

  it('derives a stable viewport from a selected extent', () => {
    const viewport = viewportFromBounds([28.8, 40.9, 29.3, 41.2]);
    expect(viewport.center).toEqual([29.05, 41.05]);
    expect(viewport.bearing).toBe(0);
    expect(viewport.pitch).toBe(0);
    expect(viewport.zoom).toBeGreaterThan(4);
  });

  it('geocodes place candidates with scalar metadata only', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([
      {
        place_id: 123,
        osm_type: 'relation',
        osm_id: 223474,
        display_name: 'Kadikoy, Istanbul, Marmara Region, Turkiye',
        lat: '40.9900',
        lon: '29.0300',
        boundingbox: ['40.9600', '41.0200', '28.9700', '29.0900'],
        class: 'boundary',
        type: 'administrative',
        importance: 0.72,
      },
    ]))) as unknown as typeof fetch;

    const candidates = await geocodeUrbanStudyArea('Kadikoy', fetchImpl);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      shortLabel: 'Kadikoy, Istanbul, Marmara Region',
      center: [29.03, 40.99],
      bounds: [28.97, 40.96, 29.09, 41.02],
      source: 'Nominatim',
      sourceId: 'relation:223474',
      sourceClass: 'boundary',
      sourceType: 'administrative',
      importance: 0.72,
    });
  });
});

describe('previewUrbanStudyAreaInWorkspace', () => {
  it('writes Map Explorer scalar bounds + viewport synchronously without registering evidence or AOI', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const result = previewUrbanStudyAreaInWorkspace({
      bounds: [28.97, 40.96, 29.09, 41.02],
      source: 'urban-analytics-study-area-preview',
    });

    const mapState = useMapExplorerStore.getState();
    expect(mapState.currentMapBounds).toEqual([28.97, 40.96, 29.09, 41.02]);
    expect(mapState.center).toEqual(result.viewport.center);
    expect(mapState.zoom).toBe(result.viewport.zoom);
    expect(mapState.bearing).toBe(result.viewport.bearing);
    expect(mapState.pitch).toBe(result.viewport.pitch);

    // Preview-only: no AOI, no pending fit-bounds, no fitBounds event.
    expect(mapState.activeAoiId).toBeUndefined();
    expect(mapState.drawnFeatures).toEqual([]);
    expect(mapState.pendingFitBounds).toBeNull();
    expect(useUrbanContextStore.getState().context).toBeNull();
    expect(useUrbanContextStore.getState().evidenceArtifacts).toEqual([]);
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'synapse:map:fitBounds' }),
    );
  });
});

describe('openMapExplorerWithStudyAreaPreview', () => {
  it('queues a typed pending fit-bounds request, opens the modal, and applies preview viewport', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const result = openMapExplorerWithStudyAreaPreview({
      bounds: [28.97, 40.96, 29.09, 41.02],
      source: 'urban-analytics-study-area-open-map',
    });

    const mapState = useMapExplorerStore.getState();
    expect(mapState.isOpen).toBe(true);
    expect(mapState.currentMapBounds).toEqual([28.97, 40.96, 29.09, 41.02]);
    expect(mapState.center).toEqual(result.viewport.center);
    expect(mapState.zoom).toBe(result.viewport.zoom);

    expect(mapState.pendingFitBounds).not.toBeNull();
    expect(mapState.pendingFitBounds!.bounds).toEqual([28.97, 40.96, 29.09, 41.02]);
    expect(mapState.pendingFitBounds!.source).toBe('urban-analytics-study-area-open-map');
    expect(mapState.pendingFitBounds!.requestId).toBe(result.fitRequest.requestId);

    // Legacy compatibility event is also fired so existing listeners
    // (e.g. UrbanEvidenceTray) keep working.
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'synapse:map:fitBounds',
    }));
  });

  it('lets consumers drain the pending fit-bounds atomically', () => {
    openMapExplorerWithStudyAreaPreview({
      bounds: [28.97, 40.96, 29.09, 41.02],
      source: 'urban-analytics-study-area-open-map',
    });

    const consumed = useMapExplorerStore.getState().consumePendingFitBounds();
    expect(consumed).not.toBeNull();
    expect(useMapExplorerStore.getState().pendingFitBounds).toBeNull();
    expect(useMapExplorerStore.getState().consumePendingFitBounds()).toBeNull();
  });
});

describe('applyUrbanStudyAreaSelection', () => {
  it('binds the selected viewport into Map Explorer, Urban context, AOI, evidence registry, and a typed fit-bounds request', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const result = applyUrbanStudyAreaSelection({
      label: 'Kadikoy',
      bounds: [28.97, 40.96, 29.09, 41.02],
      center: [29.03, 40.99],
      source: 'Nominatim',
      sourceId: 'relation:223474',
      sourceClass: 'boundary',
      sourceType: 'administrative',
      importance: 0.72,
    });
    vi.advanceTimersByTime(260);

    const mapState = useMapExplorerStore.getState();
    expect(mapState.currentMapBounds).toEqual([28.97, 40.96, 29.09, 41.02]);
    expect(mapState.center).toEqual(result.viewport.center);
    expect(mapState.zoom).toBe(result.viewport.zoom);
    expect(mapState.activeAoiId).toBe(result.aoiId);

    const aoi = mapState.drawnFeatures.find((feature) => feature.id === result.aoiId);
    expect(aoi?.geometry.type).toBe('Polygon');
    expect(aoi?.properties.label).toBe('Kadikoy');
    expect(aoi?.properties.validation?.status).toBe('valid');

    expect(mapState.pendingFitBounds).not.toBeNull();
    expect(mapState.pendingFitBounds!.aoiId).toBe(result.aoiId);
    expect(mapState.pendingFitBounds!.requestId).toBe(result.fitRequestId);

    const urbanContext = useUrbanContextStore.getState().context;
    expect(urbanContext?.studyAreaName).toBe('Kadikoy');
    expect(urbanContext?.studyAreaId).toBe('relation:223474');
    expect(urbanContext?.studyAreaBounds).toEqual([28.97, 40.96, 29.09, 41.02]);
    expect(urbanContext?.activeAoiId).toBe(result.aoiId);

    const artifact = useUrbanContextStore
      .getState()
      .evidenceArtifacts
      .find((item) => item.id === result.evidenceArtifactId);
    expect(artifact).toBeDefined();
    expect(artifact?.sourceModule).toBe('map-explorer');
    expect(artifact?.linkedStudyAreaId).toBe('relation:223474');
    expect(artifact?.linkedLayerIds).toEqual([result.aoiId]);
    expect(artifact?.qa.state).toBe('unvalidated');
    expect(artifact?.qa.limitations.join(' ')).toContain('projected CRS');
    expect(artifact?.metadata).toMatchObject({
      source: 'Nominatim',
      sourceId: 'relation:223474',
      sourceClass: 'boundary',
      sourceType: 'administrative',
      importance: 0.72,
      bounds: '28.9700, 40.9600, 29.0900, 41.0200',
      crs: 'EPSG:4326',
    });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'synapse:map:fitBounds',
    }));
  });

  it('does not register an evidence artifact during preview-only sync', () => {
    previewUrbanStudyAreaInWorkspace({
      bounds: [28.97, 40.96, 29.09, 41.02],
      source: 'urban-analytics-study-area-preview',
    });
    previewUrbanStudyAreaInWorkspace({
      bounds: [29.00, 40.97, 29.05, 41.00],
      source: 'urban-analytics-study-area-preview',
    });

    expect(useUrbanContextStore.getState().context).toBeNull();
    expect(useUrbanContextStore.getState().evidenceArtifacts).toEqual([]);
    expect(useMapExplorerStore.getState().drawnFeatures).toEqual([]);
    expect(useMapExplorerStore.getState().activeAoiId).toBeUndefined();
  });

  it('Open Map Explorer reuses the most recent preview bounds', () => {
    previewUrbanStudyAreaInWorkspace({
      bounds: [29.00, 40.97, 29.05, 41.00],
      source: 'urban-analytics-study-area-preview',
    });
    const opened = openMapExplorerWithStudyAreaPreview({
      bounds: [29.00, 40.97, 29.05, 41.00],
      source: 'urban-analytics-study-area-open-map',
    });
    expect(useMapExplorerStore.getState().pendingFitBounds?.bounds)
      .toEqual([29.00, 40.97, 29.05, 41.00]);
    expect(opened.bounds).toEqual([29.00, 40.97, 29.05, 41.00]);
  });

  it('latches the explicit fit request so project autoload viewports cannot override it', () => {
    openMapExplorerWithStudyAreaPreview({
      bounds: [32.50, 39.85, 33.00, 40.05],
      source: 'urban-analytics-study-area-open-map',
    });

    const before = useMapExplorerStore.getState();
    expect(before.lastExplicitFitRequest).not.toBeNull();
    expect(before.lastExplicitFitRequest!.bounds).toEqual([32.50, 39.85, 33.00, 40.05]);

    // Consuming the pending request (as MapExplorerModal does on map ready)
    // must NOT clear the explicit-fit latch — the latch is what suppresses
    // a slow project autoload from yanking the viewport back to the
    // project's saved state on the same open cycle.
    const consumed = useMapExplorerStore.getState().consumePendingFitBounds();
    expect(consumed).not.toBeNull();
    const afterConsume = useMapExplorerStore.getState();
    expect(afterConsume.pendingFitBounds).toBeNull();
    expect(afterConsume.lastExplicitFitRequest).not.toBeNull();

    // Closing the modal clears the latch so the next open returns to
    // normal project-autoload behaviour.
    useMapExplorerStore.getState().close();
    expect(useMapExplorerStore.getState().lastExplicitFitRequest).toBeNull();
  });

  it('clears the explicit fit latch on user-initiated viewport changes', () => {
    openMapExplorerWithStudyAreaPreview({
      bounds: [32.50, 39.85, 33.00, 40.05],
      source: 'urban-analytics-study-area-open-map',
    });
    expect(useMapExplorerStore.getState().lastExplicitFitRequest).not.toBeNull();

    useMapExplorerStore.getState().clearLastExplicitFitRequest();

    expect(useMapExplorerStore.getState().lastExplicitFitRequest).toBeNull();
  });
});
