import { describe, expect, it } from 'vitest';

import type { MapExplorerContextSummary } from '@/centerpanel/components/map/mapContextSummary';
import type { OverlayLayerConfig } from '@/centerpanel/components/map/mapTypes';
import { buildMapToUrbanContextPayload } from '@/services/map/bridge/MapUrbanBridgeService';
import { FLOW_LIBRARY_ITEMS } from '../../../centerpanel/Flows/flowLibraryMeta';
import {
  recommendUrbanMethodsFromMapContext,
  validateUrbanMethodMetadata,
  validateUrbanMethodValidityEnvelope,
} from '../context/methodValidity';
import { getIndicatorDefinition } from '../indicators/catalog';
import { buildFullLibrary } from '../seeds';

function recommendationPayload(layer: OverlayLayerConfig) {
  const context: MapExplorerContextSummary = {
    contextId: `recommend-${layer.id}`,
    updatedAt: '2026-05-25T10:00:00.000Z',
    viewport: { center: [29, 41], zoom: 11, bearing: 0, pitch: 0, baseLayerId: 'dark' },
    currentBounds: [28.9, 40.9, 29.2, 41.2],
    currentBoundsUpdatedAt: '2026-05-25T10:00:00.000Z',
    activeAoi: { aoiId: 'aoi-kadikoy', geometryFamily: 'polygon' },
    visibleLayerIds: [layer.id],
    selectedLayerIds: [layer.id],
    activeAnalysisResultLayerIds: [],
    selection: { totalSelectedFeatures: 0, layerCounts: [] },
    qa: {
      status: 'passed',
      checkedAt: '2026-05-25T10:00:00.000Z',
      layerCount: 1,
      blockedLayerCount: 0,
      issueCounts: { info: 0, warning: 0, error: 0, blocker: 0 },
    },
  };
  return buildMapToUrbanContextPayload({
    contextSummary: context,
    overlayLayers: [layer],
    now: '2026-05-25T10:00:00.000Z',
  });
}

function recommendationLayer(id: string, geometryType: string): OverlayLayerConfig {
  return {
    id,
    name: id,
    type: 'geojson',
    visible: true,
    opacity: 1,
    sourceKind: 'project',
    metadata: {
      featureCount: 45,
      crsSummary: { crs: 'EPSG:3857', status: 'known', source: 'explicit', notes: [] },
      geometrySummary: { geometryType, geometryTypes: [geometryType], featureCount: 45, source: 'explicit', notes: [] },
      schemaSummary: {
        fieldCount: 4,
        fields: [
          { name: 'numeric_indicator', role: 'attribute' },
          { name: 'travel_mode', role: 'attribute' },
          { name: 'time_threshold', role: 'attribute' },
          { name: 'poi_category', role: 'attribute' },
        ],
        source: 'explicit',
        notes: [],
      },
    },
  };
}

describe('Urban method validity metadata', () => {
  it('attaches a complete validity envelope to the representative method card preset', () => {
    const library = buildFullLibrary();
    const card = library.find((candidate) => candidate.id === 'ss-morans-i');

    if (!card) {
      throw new Error('Representative Moran method card is missing');
    }

    expect(card?.validityEnvelope?.methodFamily).toBe('spatial-statistics');
    expect(card?.capabilityStatus).toBe('implemented');

    const validation = validateUrbanMethodMetadata({
      id: card.id,
      title: card.title,
      sourceKind: 'method-card',
      ...(card.validityEnvelope ? { validityEnvelope: card.validityEnvelope } : {}),
      ...(card.capabilityStatus ? { capabilityStatus: card.capabilityStatus } : {}),
    });

    expect(validation.ok).toBe(true);
    expect(validation.status).toBe('complete');
    expect(validation.readinessStatus).toBe('ready');
    expect(validation.missingFields).toEqual([]);
  });

  it('keeps unannotated method cards truthful through a missing-metadata fallback', () => {
    const library = buildFullLibrary();
    const card = library.find((candidate) => candidate.id === 'ss-lisa-clusters');

    if (!card) {
      throw new Error('Representative unannotated LISA method card is missing');
    }

    expect(card?.validityEnvelope).toBeUndefined();

    const validation = validateUrbanMethodMetadata({
      id: card.id,
      title: card.title,
      sourceKind: 'method-card',
      ...(card.validityEnvelope ? { validityEnvelope: card.validityEnvelope } : {}),
      ...(card.capabilityStatus ? { capabilityStatus: card.capabilityStatus } : {}),
    });

    expect(validation.ok).toBe(false);
    expect(validation.status).toBe('missing');
    expect(validation.capabilityStatus).toBe('residual_gap');
    expect(validation.readinessStatus).toBe('needs-context');
    expect(validation.missingFields).toContain('validityEnvelope');
    expect(validation.envelope.interpretationWarnings[0]).toContain('Method validity metadata is missing');
  });

  it('attaches representative indicator metadata without changing catalog lookup behavior', () => {
    const definition = getIndicatorDefinition('modeSplit');

    if (!definition) {
      throw new Error('Representative modeSplit indicator is missing');
    }

    expect(definition?.validityEnvelope?.methodFamily).toBe('indicator');
    expect(definition?.validityEnvelope?.requiredFields).toEqual([
      'walkTrips',
      'cycleTrips',
      'transitTrips',
      'carTrips',
    ]);
    expect(definition?.capabilityStatus).toBe('implemented');

    const validation = validateUrbanMethodMetadata({
      id: definition.kind,
      title: definition.title,
      sourceKind: 'indicator',
      ...(definition.validityEnvelope ? { validityEnvelope: definition.validityEnvelope } : {}),
      ...(definition.capabilityStatus ? { capabilityStatus: definition.capabilityStatus } : {}),
    });

    expect(validation.status).toBe('complete');
    expect(validation.readinessStatus).toBe('ready');
  });

  it('attaches representative workflow metadata in the flow library', () => {
    const workflow = FLOW_LIBRARY_ITEMS.find((item) => item.flowId === 'accessibility');

    if (!workflow) {
      throw new Error('Representative accessibility workflow is missing');
    }

    expect(workflow?.validityEnvelope?.methodFamily).toBe('network-analysis');
    expect(workflow?.validityEnvelope?.requiresProjectedCrs).toBe(true);
    expect(workflow?.capabilityStatus).toBe('implemented');

    const validation = validateUrbanMethodMetadata({
      id: workflow.flowId,
      title: workflow.title,
      sourceKind: 'workflow',
      ...(workflow.validityEnvelope ? { validityEnvelope: workflow.validityEnvelope } : {}),
      ...(workflow.capabilityStatus ? { capabilityStatus: workflow.capabilityStatus } : {}),
    });

    expect(validation.ok).toBe(true);
    expect(validation.status).toBe('complete');
    expect(validation.readinessStatus).toBe('ready');
  });

  it('labels partial metadata as incomplete instead of silently treating it as ready', () => {
    const validation = validateUrbanMethodValidityEnvelope({
      validSpatialScales: ['city'],
      capabilityStatus: 'demo_mode',
    });

    expect(validation.ok).toBe(false);
    expect(validation.status).toBe('partial');
    expect(validation.readinessStatus).toBe('demo-only');
    expect(validation.missingFields).toContain('requiredDataTypes');
    expect(validation.missingFields).toContain('requiredFields');
    expect(validation.warnings.some((warning) => warning.includes('incomplete method validity metadata'))).toBe(true);
  });

  it('changes attributed recommendations when bridged layer geometry changes', () => {
    const polygon = recommendUrbanMethodsFromMapContext(
      recommendationPayload(recommendationLayer('district-polygons', 'Polygon')),
    );
    const point = recommendUrbanMethodsFromMapContext(
      recommendationPayload(recommendationLayer('service-points', 'Point')),
    );

    expect(polygon.some((hint) => hint.methodId === 'ss-morans-i')).toBe(true);
    expect(point.some((hint) => hint.methodId === 'ss-morans-i')).toBe(false);
    expect(point.some((hint) => hint.methodId === 'accessibility')).toBe(true);
    expect(polygon[0]?.hint).toContain('based on: district-polygons / AOI aoi-kadikoy');
    expect(point[0]?.hint).toContain('based on: service-points / AOI aoi-kadikoy');
  });

  it('marks a demo bridge candidate as demo-only instead of ready', () => {
    const demoLayer = recommendationLayer('demo-polygons', 'Polygon');
    demoLayer.sourceKind = 'demo';
    const recommendations = recommendUrbanMethodsFromMapContext(recommendationPayload(demoLayer));

    expect(recommendations.find((hint) => hint.methodId === 'ss-morans-i')?.status).toBe('demo-only');
    expect(recommendations.find((hint) => hint.methodId === 'ss-morans-i')?.hint).toContain('demo/synthetic inputs remain labelled');
  });
});
