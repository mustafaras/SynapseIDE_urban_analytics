// Urban Analytics Workbench — WebAssembly engine
export {
	SpatialIndexWASM,
	bruteForceBoundingBox,
	bruteForceNearest,
	createBenchmarkQuerySuite,
	generateSyntheticSpatialRecords,
	supportsSpatialIndexWasm,
	type SpatialIndexBackend,
	type SpatialIndexBenchmarkSummary,
	type SpatialIndexBoundingBoxQuery,
	type SpatialIndexBuildInfo,
	type SpatialIndexCapability,
	type SpatialIndexHit,
	type SpatialIndexNearestQuery,
	type SpatialIndexOptions,
	type SpatialIndexQueryResult,
	type SpatialIndexQueryTiming,
	type SpatialIndexRecord,
} from './SpatialIndexWASM';
export * from './workers';
