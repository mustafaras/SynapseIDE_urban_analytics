/**
 * Spatiotemporal Analysis — barrel export.
 *
 * Provides emerging hot-spot analysis, spatial Markov chains,
 * space-time KDE, and change detection.
 */

export {
  analyse,
  analyseEmergingHotSpots,
  buildEmergingHotSpotDiagnostics,
  classifyEmergingHotSpot,
  classifySeriesFromZScores,
  emergingHotSpotLegend,
  mannKendall,
  trendMap,
} from "./EmergingHotSpots";

export type {
  EmergingHotSpotAnalysisOptions,
  EmergingHotSpotCategory,
  EmergingHotSpotDiagnostics,
  EmergingHotSpotLegendEntry,
  EmergingHotSpotLocationResult,
  EmergingHotSpotResult,
  EmergingHotSpotSeriesStep,
  EmergingHotSpotTimeStepInput,
  EmergingHotSpotTimeStepResult,
  EmergingTrendDirection,
  MannKendallResult,
  TrendMapProperties,
} from "./EmergingHotSpots";
