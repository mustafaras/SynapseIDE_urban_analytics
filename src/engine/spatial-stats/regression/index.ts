/**
 * Spatial Regression — barrel export.
 *
 * Provides OLS with spatial diagnostics, Spatial Lag (SAR),
 * Spatial Error (SEM), GWR, and MGWR.
 */

export {
  breuschPagan,
  comparisonRow,
  computeVIF,
  diagnosticLabels,
  fullDiagnostics,
  jarqueBera,
  lmTests,
  moransIResiduals,
  olsFit,
  residualDiagnostics,
  spatialDiagnostics,
} from './OLS';

export type {
  DiagnosticLabel,
  ModelComparisonRow,
} from './OLS';

export {
  gwrComputeCore,
  gwrFit,
  gwrFitSync,
  gwrParameterSurfaces,
  kernelWeight,
} from './GWR';

export type {
  GWRCoreResult,
  GWROptions,
  GWRParameterSurface,
} from './GWR';

export type { GWRResult } from './GWR';
