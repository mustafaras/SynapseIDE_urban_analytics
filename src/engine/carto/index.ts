// Urban Analytics Workbench — Cartographic Engine
export {
  naturalBreaks,
  quantile,
  equalInterval,
  standardDeviation,
  headTailBreaks,
  prettyBreaks,
} from './ClassificationSchemes';
export type { ClassRange, ClassificationResult } from './ClassificationSchemes';

export {
  getSequentialPalette,
  getDivergingPalette,
  getQualitativePalette,
  getInterpolator,
  SEQUENTIAL,
  DIVERGING,
  QUALITATIVE,
  URBAN_PALETTES,
} from './ColorBrewerIntegration';
export type { Interpolator, PaletteInfo } from './ColorBrewerIntegration';

export { applyClassification } from './SymbologyManager';
export type {
  SchemeType,
  SymbologyType,
  PaletteType,
  LegendEntry,
  StyledFeature,
  DeckStyle,
  ClassifiedResult,
} from './SymbologyManager';

export { composePDF, downloadPDF } from './PrintComposer';
export type { PageSize, Orientation, DPI, LegendItem, PrintLayout } from './PrintComposer';

export { bivariateChoropleth, getColorMatrix } from './BivariateChoropleth';
export type {
  MatrixSize,
  BivariateLegendCell,
  BivariateStyle,
  BivariateStyledFeature,
  BivariateResult,
} from './BivariateChoropleth';
