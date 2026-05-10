/**
 * Shared type definitions for the spatial statistics engine.
 *
 * All spatial-stats sub-modules (autocorrelation, regression, multivariate,
 * geostatistics, point-pattern, spatiotemporal) import from this file.
 */

// ---------------------------------------------------------------------------
// Geometry primitives
// ---------------------------------------------------------------------------

/** A 2-D coordinate pair [longitude, latitude] or [x, y]. */
export type Coordinate = [number, number];

/** A GeoJSON-style polygon ring (array of coordinate pairs). */
export type Ring = Coordinate[];

/** Minimal feature representation for spatial-stats operations. */
export interface SpatialFeature {
  /** Feature identifier. */
  id: string | number;
  /** Centroid or representative point. */
  centroid: Coordinate;
  /** Optional polygon geometry for contiguity methods. */
  rings?: Ring[];
}

// ---------------------------------------------------------------------------
// Spatial weights
// ---------------------------------------------------------------------------

/** Sparse spatial weight entry: neighbor index → weight value. */
export type NeighborMap = Map<number, number>;

/** A sparse spatial weights matrix. Entry i maps to its neighbors. */
export interface SpatialWeightsMatrix {
  /** Number of observations. */
  n: number;
  /** Sparse neighbor structure: index → (neighbor index → weight). */
  weights: Map<number, NeighborMap>;
  /** Whether the matrix has been row-standardized. */
  rowStandardized: boolean;
  /** Indices of island observations (zero neighbors). */
  islands: number[];
  /** Whether the matrix is symmetric (contiguity matrices are; k-NN may not be). */
  symmetric: boolean;
  /** Total sum of all weights (S0). */
  totalWeight: number;
}

/** Options for constructing spatial weights. */
export interface WeightsOptions {
  /** Number of neighbors for k-NN. */
  k?: number;
  /** Distance threshold for distance-band weights. */
  threshold?: number;
  /** Power parameter for inverse-distance weights (default 1). */
  alpha?: number;
  /** Whether to row-standardize after construction. */
  rowStandardize?: boolean;
}

/** Method used to build a spatial weights matrix. */
export type WeightsMethod =
  | 'queen'
  | 'rook'
  | 'knn'
  | 'distance-band'
  | 'inverse-distance';

// ---------------------------------------------------------------------------
// Autocorrelation results
// ---------------------------------------------------------------------------

/** Result of a global autocorrelation test (Moran's I, etc.). */
export interface GlobalAutocorrelationResult {
  /** Name of the statistic (e.g. "Moran's I"). */
  statistic: string;
  /** Observed value of the statistic. */
  observed: number;
  /** Expected value under the null hypothesis. */
  expected: number;
  /** Variance under the null. */
  variance: number;
  /** z-score. */
  zScore: number;
  /** Pseudo p-value (from permutation inference). */
  pValue: number;
  /** Number of permutations used. */
  permutations: number;
}

/** LISA cluster classification. */
export type LISAClusterType = 'HH' | 'HL' | 'LH' | 'LL' | 'not-significant';

/** Result for a single observation in a local autocorrelation test. */
export interface LocalAutocorrelationResult {
  /** Feature index. */
  index: number;
  /** Local statistic value. */
  localI: number;
  /** p-value for this observation. */
  pValue: number;
  /** Whether this observation is significant after correction. */
  significant: boolean;
  /** Cluster/outlier type. */
  clusterType: LISAClusterType;
}

/** Getis-Ord Gi* confidence classification. */
export type HotSpotConfidence =
  | 'hot-99'
  | 'hot-95'
  | 'hot-90'
  | 'not-significant'
  | 'cold-90'
  | 'cold-95'
  | 'cold-99';

export interface GiStarResult {
  index: number;
  giStar: number;
  zScore: number;
  pValue: number;
  confidence: HotSpotConfidence;
}

// ---------------------------------------------------------------------------
// Regression results
// ---------------------------------------------------------------------------

export interface OLSResult {
  /** Fitted coefficients [intercept, β₁, β₂, ...]. */
  coefficients: number[];
  /** Standard errors of coefficients. */
  standardErrors: number[];
  /** t-statistics. */
  tStatistics: number[];
  /** p-values for coefficients. */
  pValues: number[];
  /** R-squared. */
  rSquared: number;
  /** Adjusted R-squared. */
  adjRSquared: number;
  /** Akaike Information Criterion. */
  aic: number;
  /** Bayesian Information Criterion. */
  bic: number;
  /** Log-likelihood. */
  logLikelihood: number;
  /** Residuals. */
  residuals: Float64Array;
  /** Fitted values. */
  fittedValues: Float64Array;
  /** Number of observations. */
  n: number;
  /** Number of predictors (excluding intercept). */
  k: number;
}

export interface RegressionDiagnostics {
  /** Jarque-Bera normality test [statistic, p-value]. */
  jarqueBera: [number, number];
  /** Breusch-Pagan heteroskedasticity test [statistic, p-value]. */
  breuschPagan: [number, number];
  /** Variance inflation factors (one per predictor). */
  vif: number[];
  /** Moran's I on residuals [I, p-value]. */
  moransIResiduals?: [number, number];
  /** LM-lag test [statistic, p-value]. */
  lmLag?: [number, number];
  /** LM-error test [statistic, p-value]. */
  lmError?: [number, number];
  /** Robust LM-lag test [statistic, p-value]. */
  robustLmLag?: [number, number];
  /** Robust LM-error test [statistic, p-value]. */
  robustLmError?: [number, number];
}

// ---------------------------------------------------------------------------
// GWR results
// ---------------------------------------------------------------------------

/** Result of Geographically Weighted Regression. */
export interface GWRResult {
  /** Local coefficients at each observation: arr[i] = [intercept, β₁, …]. */
  localCoefficients: number[][];
  /** Local standard errors: arr[i][l] for parameter l at location i. */
  localStandardErrors: number[][];
  /** Local t-statistics: arr[i][l] = coef / SE. */
  localTStatistics: number[][];
  /** Local R² at each observation. */
  localRSquared: Float64Array;
  /** Residuals y − ŷ. */
  residuals: Float64Array;
  /** Fitted values ŷ. */
  fittedValues: Float64Array;
  /** Bandwidth used. */
  bandwidth: number;
  /** Kernel function used. */
  kernel: KernelType;
  /** Corrected Akaike Information Criterion. */
  aicc: number;
  /** Effective number of parameters (trace of hat matrix). */
  effectiveParams: number;
  /** Global residual variance σ². */
  sigma2: number;
  /** Number of observations. */
  n: number;
  /** Number of predictors (excluding intercept). */
  k: number;
  /** Hat matrix diagonal (leverage at each location). */
  hatDiag: Float64Array;
  /** Observation coordinates. */
  coords: Coordinate[];
}

// ---------------------------------------------------------------------------
// Multivariate results
// ---------------------------------------------------------------------------

export interface PCAResult {
  /** Eigenvalues in descending order. */
  eigenvalues: number[];
  /** Proportion of variance explained per component. */
  varianceExplained: number[];
  /** Cumulative variance explained. */
  cumulativeVariance: number[];
  /** Loadings matrix (variables × components). */
  loadings: number[][];
  /** Scores matrix (observations × components). */
  scores: number[][];
  /** Number of components retained by Kaiser criterion. */
  kaiserComponents: number;
}

export interface ClusterResult {
  /** Cluster assignment per observation. */
  labels: number[];
  /** Number of clusters. */
  k: number;
  /** Silhouette score per observation. */
  silhouetteScores: number[];
  /** Mean silhouette score. */
  meanSilhouette: number;
  /** Within-cluster sum of squares per cluster. */
  wcss: number[];
  /** Total within-cluster sum of squares. */
  totalWcss: number;
}

// ---------------------------------------------------------------------------
// Multiple testing correction
// ---------------------------------------------------------------------------

export type MultipleTestingCorrection = 'bonferroni' | 'fdr' | 'none';

// ---------------------------------------------------------------------------
// Kernel types (shared by GWR, KDE, etc.)
// ---------------------------------------------------------------------------

export type KernelType = 'gaussian' | 'bisquare' | 'exponential';
