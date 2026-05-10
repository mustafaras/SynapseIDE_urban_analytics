import { describe, expect, it } from 'vitest';
import type { ObjectDetectionResult } from '@/engine/geoai/cv';
import type { ObjectDetectionRunMetadata } from '@/engine/geoai/hooks';
import {
  buildDetectionNarrative,
  buildObjectDetectionPublication,
} from '../objectDetectionPublish';

const CLASS_COLORS = {
  vehicle: '#60A5FA',
  tree: '#34D399',
} as const;

const CLASS_LABELS = {
  vehicle: 'Vehicle',
  tree: 'Tree',
} as const;

function makeDetectionResult(detections: ObjectDetectionResult['detections']): ObjectDetectionResult {
  return {
    detections,
    modelId: 'yolo-nano-urban-demo',
    imageId: 'scene-01',
    classLabels: ['vehicle', 'tree'],
  };
}

function makeRunMetadata(overrides: Partial<ObjectDetectionRunMetadata> = {}): ObjectDetectionRunMetadata {
  return {
    executionMode: 'real-model',
    modelId: 'yolo-nano-urban-640',
    modelLabel: 'YOLO-Nano Urban Detection (640×640)',
    backend: 'wasm',
    tileSize: 640,
    overlap: 96,
    confidenceThresholds: {
      vehicle: 0.4,
      tree: 0.4,
      swimming_pool: 1.1,
      solar_panel: 1.1,
      construction_site: 1.1,
    },
    nmsIouThreshold: 0.45,
    sourceId: 'scene-01',
    sourceTitle: 'Imported Detection Raster',
    sourceKind: 'imported-raster',
    sourceRef: 'file://scene-01.tif',
    sourceRuntimeMode: 'real-source',
    elapsedMs: 128,
    imageId: 'scene-01',
    ...overrides,
  };
}

describe('objectDetectionPublish', () => {
  it('packages a published detection run into map and review outputs', () => {
    const publication = buildObjectDetectionPublication({
      detection: makeDetectionResult([
        {
          id: 'vehicle-1',
          className: 'vehicle',
          confidence: 0.91,
          bbox: [2.35, 48.85, 2.351, 48.851],
        },
        {
          id: 'tree-1',
          className: 'tree',
          confidence: 0.73,
          bbox: [2.352, 48.852, 2.353, 48.853],
        },
      ]),
      confidenceThreshold: 0.4,
      selectedClasses: ['vehicle', 'tree'],
      classColors: CLASS_COLORS,
      classLabels: CLASS_LABELS,
      runMetadata: makeRunMetadata(),
      runId: 'object-detection-test-run',
      label: 'Object Detection — Test Scene',
      insertedAt: '2026-04-12T10:15:00.000Z',
    });

    const publishedCollection = publication.adapted.layer.sourceData as GeoJSON.FeatureCollection;

    expect(publication.completedRun.flowId).toBe('object_detection');
    expect(publication.completedRun.label).toBe('Object Detection — Test Scene');
    expect(publication.completedRun.insertedAt).toBe('2026-04-12T10:15:00.000Z');
    expect(publication.detectionCount).toBe(2);
    expect(publishedCollection.features).toHaveLength(2);
    expect(publication.classCounts).toEqual([
      { className: 'vehicle', label: 'Vehicle', count: 1 },
      { className: 'tree', label: 'Tree', count: 1 },
    ]);
    expect(publication.completedRun.mapOutputs[0]?.layerName).toBe('Object Detection — Test Scene');
    expect(publication.completedRun.chartOutputs[0]).toMatchObject({
      type: 'bar',
      title: 'Object Detection — Test Scene Class Counts',
      data: publication.classCounts,
    });
    expect(publication.completedRun.dataOutputs[0]).toMatchObject({
      format: 'object-detections',
      rows: 2,
      columns: ['detection_id', 'detection_class', 'confidence', 'bbox_west', 'bbox_south', 'bbox_east', 'bbox_north'],
    });
    expect(publication.completedRun.dataOutputs[1]?.preview[0]).toMatchObject({
      execution_mode: 'real-model',
      model_id: 'yolo-nano-urban-640',
      backend: 'wasm',
      source_id: 'scene-01',
    });
    expect(publication.publishMessage).toBe('Published 2 detections to Map Explorer and Completed Run Review.');
  });

  it('records an auditable empty publication when no detections survive', () => {
    const publication = buildObjectDetectionPublication({
      detection: makeDetectionResult([]),
      confidenceThreshold: 0.4,
      selectedClasses: ['vehicle'],
      classColors: CLASS_COLORS,
      classLabels: CLASS_LABELS,
      runMetadata: makeRunMetadata({ executionMode: 'demo-mode', backend: 'demo' }),
      runId: 'object-detection-empty-run',
      insertedAt: '2026-04-12T10:20:00.000Z',
    });

    const publishedCollection = publication.adapted.layer.sourceData as GeoJSON.FeatureCollection;

    expect(publication.detectionCount).toBe(0);
    expect(publication.classCounts).toEqual([]);
    expect(publishedCollection.features).toHaveLength(0);
    expect(publication.completedRun.dataOutputs[0]?.rows).toBe(0);
    expect(publication.publishMessage).toContain('empty result set for traceability');
  });

  it('writes a narrative that stays aligned with selected classes and retained detections', () => {
    const narrative = buildDetectionNarrative(
      'Object Detection — Test Scene',
      0.55,
      ['vehicle', 'tree'],
      makeDetectionResult([
        {
          id: 'vehicle-1',
          className: 'vehicle',
          confidence: 0.91,
          bbox: [2.35, 48.85, 2.351, 48.851],
        },
      ]).detections,
      CLASS_LABELS,
      makeRunMetadata(),
    );

    expect(narrative).toContain('confidence 0.55');
    expect(narrative).toContain('2 enabled classes');
    expect(narrative).toContain('Vehicle: 1');
    expect(narrative).toContain('Real model yolo-nano-urban-640');
    expect(narrative).toContain('Map Explorer and Completed Run Review');
  });
});