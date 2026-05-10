// Urban Analytics Workbench — VoxCity 3D environment integration

// Types
export type {
  VoxelGrid,
  VoxelMaterial,
  Voxel,
  GridBounds,
  SimulationResult,
  SimulationType,
  SlicePlane,
  CameraPreset,
  MaterialVisibility,
  ColorRampName,
} from "./types";

// Building extrusion types
export type {
  BuildingFeature,
  BuildingFootprint,
  BuildingAttributes,
  ExtrudedBuilding,
  ExtrusionResult,
  HeightStrategy,
  LODLevel,
  ThematicStyle,
  ColorStop,
  ExtrusionProgressCallback,
  Ring,
} from "./buildingTypes";
export { DEFAULT_HEIGHT_STRATEGY, DEFAULT_THEMATIC_RAMP } from "./buildingTypes";

// Data loading
export { parseCSV, parseJSON, loadFromString, loadFromFile, validateGrid, DEFAULT_MATERIALS } from "./VoxGridLoader";

// Building extrusion engine
export {
  extrudeBuilding,
  extrudeBuildings,
  extrudeBuildingsSync,
  resolveHeight,
  signedArea,
  polygonArea,
  centroid,
} from "./BuildingExtruder";

// CityJSON types
export type {
  CityJSONDocument,
  CityJSONLoadResult,
  CityJSONSummary,
  CityObjectType,
  ParsedCityObject,
  ParsedSurface,
  SemanticSurfaceType,
  SemanticColorMap,
  CityJSONProgressCallback,
} from "./cityJsonTypes";
export { DEFAULT_SEMANTIC_COLORS } from "./cityJsonTypes";

// CityJSON loader
export { loadCityJSON, loadCityJSONSync, loadCityJSONFile, validateCityJSON } from "./CityJSONLoader";

// Sample data
export { SAMPLE_BUILDINGS, SAMPLE_ATTRIBUTE_KEYS } from "./sampleBuildings";
export { SAMPLE_CITYJSON, SAMPLE_CITYJSON_STRING, SAMPLE_CITYJSON_ATTRIBUTE_KEYS } from "./sampleCityJSON";

// State
export { useVoxScene } from "./hooks/useVoxScene";
export { useBuildingScene, attributeRange } from "./hooks/useBuildingScene";
export { useCityJSONScene } from "./hooks/useCityJSONScene";
export { useSunlightSimStore } from "./hooks/useSunlightSim";

// Sunlight simulation types
export type {
  GeoLocation,
  SunPosition,
  SunlightConfig,
  BuildingVolume,
  ShadowSample,
  SunlightResult,
  BuildingExposureSummary,
  SimulationStatus,
} from "./sunlightTypes";

// Sunlight simulation engine
export {
  julianDay,
  solarDeclination,
  sunPosition,
  generateTimestamps,
  projectShadow,
  runSimulation,
  buildingExposureSummary,
  exportGridCSV,
  exportBuildingJSON,
} from "./SunlightSimulator";

// Sunlight sample data
export { SAMPLE_SUNLIGHT_BUILDINGS } from "./sampleSunlightBuildings";

// Components
export { default as VoxCityViewer } from "./VoxCityViewer";
export { default as VoxCityControls } from "./VoxCityControls";
export { default as SimulationOverlay } from "./SimulationOverlay";
export { default as ScenarioCompare } from "./ScenarioCompare";
export { default as BuildingViewer } from "./BuildingViewer";
export { default as CityJSONViewer } from "./CityJSONViewer";
export { default as SunlightSimulatorPanel } from "./SunlightSimulatorPanel";
