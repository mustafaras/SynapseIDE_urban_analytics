// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import type { FeatureCollection } from 'geojson';
import type { OverlayLayerConfig } from '@/centerpanel/components/map/mapTypes';
import {
  computeUrbanDataFitnessProfile,
  extractUrbanDataFitnessLayerFromMapLayer,
} from '../context/dataFitness';
import { createUrbanEvidenceArtifact } from '../context/evidenceArtifacts';

const computedAt = '2026-05-07T10:00:00.000Z';

function completeLayer(overrides: Partial<Parameters<typeof computeUrbanDataFitnessProfile>[0]['layers'][number]> = {}) {
  return {
    id: 'layer-parcels',
    name: 'Parcels',
    geometryType: 'Polygon',
    crs: 'EPSG:3857',
    fields: ['population', 'area_m2', 'district_id'],
    featureCount: 150,
    license: 'ODbL',
    sourceKind: 'project',
    temporalDate: '2026-04-01T00:00:00.000Z',
    scale: 'district' as const,
    missingValueCount: 0,
    totalValueCount: 450,
    ...overrides,
  };
}

describe('computeUrbanDataFitnessProfile', () => {
  it('labels missing metadata as unknown instead of ready', () => {
    const profile = computeUrbanDataFitnessProfile({
      layers: [{ id: 'layer-unknown' }],
      requiredFields: ['population'],
      requiredGeometryTypes: ['polygon'],
      minimumFeatureCount: 25,
      analysisScale: 'district',
      sourceScale: 'district',
      requiresTemporalCoverage: true,
      computedAt,
    });

    expect(profile.status).toBe('unknown');
    expect(profile.score).toBeNull();
    expect(profile.grade).toBe('unknown');
    expect(profile.geometryFit).toBe('unknown');
    expect(profile.missingInputs).toEqual(expect.arrayContaining([
      'geometry type metadata',
      'CRS metadata',
      'temporal coverage metadata',
      'missingness metadata',
      'feature count',
      'field list metadata',
      'license metadata',
    ]));
    expect(profile.issues.some((issue) => issue.severity === 'unknown')).toBe(true);
  });

  it('returns ready when required metadata and thresholds are satisfied', () => {
    const profile = computeUrbanDataFitnessProfile({
      layers: [completeLayer()],
      requiredFields: ['population', 'area_m2'],
      requiredGeometryTypes: ['polygon'],
      minimumFeatureCount: 100,
      analysisScale: 'district',
      sourceScale: 'district',
      requiresTemporalCoverage: true,
      computedAt,
    });

    expect(profile.status).toBe('ready');
    expect(profile.grade).toBe('A');
    expect(profile.score).toBe(100);
    expect(profile.geometryFit).toBe('excellent');
    expect(profile.crsFit).toBe('projected');
    expect(profile.fieldAvailability.missingFields).toEqual([]);
    expect(profile.blockedReasons).toEqual([]);
  });

  it('treats a user-declared CRS as caveated rather than authoritative', () => {
    const profile = computeUrbanDataFitnessProfile({
      layers: [completeLayer({ crs: 'EPSG:32635', crsUserDeclared: true })],
      requiredFields: ['population', 'area_m2'],
      requiredGeometryTypes: ['polygon'],
      minimumFeatureCount: 100,
      analysisScale: 'district',
      sourceScale: 'district',
      requiresTemporalCoverage: true,
      computedAt,
    });

    const crsIssue = profile.issues.find((issue) => issue.code === 'user_declared_crs');
    expect(crsIssue).toBeDefined();
    expect(crsIssue?.message).toContain('user-declared');
    expect(profile.crsFit).toBe('projected'); // recognized the declared code...
    expect(profile.status).not.toBe('ready'); // ...but never authoritative-ready
    expect(profile.score ?? 100).toBeLessThan(100); // the caveat caps the score
  });

  it('extracts a user-declared CRS as a caveated input from layer metadata', () => {
    const layer: OverlayLayerConfig = {
      id: 'declared-layer',
      name: 'Declared parcels',
      type: 'geojson',
      visible: true,
      opacity: 1,
      metadata: {
        geometryType: 'Polygon',
        crsSummary: {
          crs: 'EPSG:32635',
          status: 'known',
          source: 'user-declared',
          notes: ['User-declared CRS (caveat).'],
        },
      },
    };

    const input = extractUrbanDataFitnessLayerFromMapLayer(layer);
    expect(input.crs).toBe('EPSG:32635');
    expect(input.crsUserDeclared).toBe(true);
  });

  it('blocks invalid geometry carried from map QA metadata', () => {
    const profile = computeUrbanDataFitnessProfile({
      layers: [
        completeLayer({
          qaStatus: 'error',
          qaBadges: ['invalid_geometry'],
        }),
      ],
      requiredFields: ['population'],
      requiredGeometryTypes: ['polygon'],
      minimumFeatureCount: 100,
      analysisScale: 'district',
      sourceScale: 'district',
      requiresTemporalCoverage: true,
      computedAt,
    });

    expect(profile.status).toBe('blocked');
    expect(profile.geometryFit).toBe('invalid');
    expect(profile.blockedReasons.join(' ')).toContain('invalid geometry');
    expect(profile.issues.some((issue) => issue.code === 'invalid_geometry')).toBe(true);
  });

  it('blocks when required fields are absent', () => {
    const profile = computeUrbanDataFitnessProfile({
      layers: [completeLayer({ fields: ['population'] })],
      requiredFields: ['population', 'area_m2'],
      requiredGeometryTypes: ['polygon'],
      minimumFeatureCount: 100,
      analysisScale: 'district',
      sourceScale: 'district',
      requiresTemporalCoverage: true,
      computedAt,
    });

    expect(profile.status).toBe('blocked');
    expect(profile.fieldAvailability.missingFields).toEqual(['area_m2']);
    expect(profile.blockedReasons).toContain('Missing required field(s): area_m2.');
  });

  it('extracts known data fitness metadata from a Map Explorer layer without copying source data', () => {
    const sourceData: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { population: 100, area_m2: 300 },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [29, 41],
              [29.01, 41],
              [29.01, 41.01],
              [29, 41.01],
              [29, 41],
            ]],
          },
        },
      ],
    };
    const layer: OverlayLayerConfig = {
      id: 'map-layer-1',
      name: 'Map parcels',
      type: 'geojson',
      visible: true,
      opacity: 1,
      sourceData,
      sourceKind: 'project',
      metadata: {
        featureCount: 1,
        geometryType: 'Polygon',
        fields: ['population', 'area_m2'],
        datasetContext: {
          crs: 'EPSG:3857',
          license: 'ODbL',
          updateDate: '2026-04-01',
        },
      },
      provenance: {
        label: 'City data',
        license: 'ODbL',
        collectedAt: '2026-04-01',
      },
    };

    const extracted = extractUrbanDataFitnessLayerFromMapLayer(layer);

    expect(extracted).toMatchObject({
      id: 'map-layer-1',
      geometryType: 'Polygon',
      crs: 'EPSG:3857',
      featureCount: 1,
      license: 'ODbL',
      temporalDate: '2026-04-01T00:00:00.000Z',
    });
    expect(JSON.stringify(extracted)).not.toContain('FeatureCollection');
    expect(JSON.stringify(extracted)).not.toContain('coordinates');
  });

  it('can attach a data fitness profile to an evidence artifact as optional metadata', () => {
    const dataFitness = computeUrbanDataFitnessProfile({
      layers: [completeLayer()],
      requiredFields: ['population'],
      requiredGeometryTypes: ['polygon'],
      minimumFeatureCount: 100,
      analysisScale: 'district',
      sourceScale: 'district',
      requiresTemporalCoverage: true,
      computedAt,
    });

    const artifact = createUrbanEvidenceArtifact({
      id: 'artifact-fitness-1',
      kind: 'dataset',
      title: 'Parcel dataset fitness',
      sourceModule: 'urban-analytics',
      dataFitness,
      createdAt: computedAt,
    });

    expect(artifact.dataFitness?.status).toBe('ready');
    expect(artifact.dataFitness?.sourceLayerIds).toEqual(['layer-parcels']);
  });
});
