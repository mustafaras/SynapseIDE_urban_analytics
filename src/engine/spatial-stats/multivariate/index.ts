/**
 * Multivariate Analysis — barrel export.
 *
 * Provides PCA, cluster analysis (k-means, hierarchical),
 * composite index builder, and spatially constrained clustering.
 */

export { pca, standardize } from './PCA';
export type { PCAOptions } from './PCA';

export {
  kMeans,
  silhouette,
  elbowAnalysis,
  hierarchicalClustering,
} from './ClusterAnalysis';
export type {
  KMeansOptions,
  ElbowResult,
  LinkageMethod,
  HierarchicalOptions,
  DendrogramNode,
  HierarchicalResult,
} from './ClusterAnalysis';
