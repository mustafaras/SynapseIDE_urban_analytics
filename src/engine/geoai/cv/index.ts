// Urban Analytics Workbench — computer vision for satellite imagery
export {
  normalizeRaster,
  computeTileGrid,
  extractTile,
  decodeTileOutput,
  classifyRaster,
  morphologicalCleanup,
  confusionMatrix,
  computeClassMetrics,
  accuracyReport,
} from './LandCoverClassifier';

export type {
  LandCoverClass,
  RasterTile,
  ClassifiedTile,
  ConfusionMatrix,
  ClassMetrics,
  AccuracyReport,
  ClassifierConfig,
} from './types';

export type { TileSpec } from './LandCoverClassifier';

export type {
  DetectedObject,
  ObjectDetectionResult,
  RawDetection,
  GeoTransform,
  ObjectDetectorConfig,
  DetectionProgress,
  DetectionRunOptions,
  TileInferrer,
  UrbanObjectClass,
} from './ObjectDetector';

export {
  URBAN_OBJECT_CLASSES,
  decodeYoloOutput,
  computeIoU,
  nonMaxSuppression,
  pixelBoxToGeoBBox,
  detectObjects,
  detectObjectsWithInferrer,
} from './ObjectDetector';

export { LAND_COVER_CLASSES, LAND_COVER_CLASS_INDEX } from './types';
