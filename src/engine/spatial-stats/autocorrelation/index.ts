/**
 * Spatial Autocorrelation — barrel export.
 *
 * Provides SpatialWeights, Global Moran's I, Local Moran's I (LISA),
 * and Getis-Ord Gi* hot-spot analysis.
 */

export {
  queenContiguity,
  rookContiguity,
  kNearestNeighbors,
  distanceBand,
  inverseDistance,
  rowStandardize,
  buildWeights,
  cloneWeights,
  computeS1,
  computeS2,
} from './SpatialWeights';

export {
  expectedI,
  moransI,
  pseudoPValue,
  varianceI,
  zScore as moransIZScore,
} from './GlobalMoransI';

export type { MoransIOptions } from './GlobalMoransI';

export { localMoransI, lisaLegend } from './LocalMoransI';

export type {
  CorrectionMethod,
  LISAFeatureProperties,
  LISALegendEntry,
  LISAResult,
  LocalMoransIOptions,
} from './LocalMoransI';

export { confidenceMap, giStar, hotSpotLegend, zScoreMap } from './GetisOrdGi';

export type {
  GiStarOptions,
  HotSpotFeatureProperties,
  HotSpotLegendEntry,
  HotSpotResult,
} from './GetisOrdGi';
