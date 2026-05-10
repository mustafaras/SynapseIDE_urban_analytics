// Urban Analytics Workbench — Python integration bridge

// Environment management
export { default as PythonEnvironmentManager, usePythonEnvironments } from "./PythonEnvironmentManager";
export type { PythonEnvironment, DetectionStatus } from "./PythonEnvironmentManager";

// Package management
export { default as PackageManager, usePackageManager, URBAN_STACK_PACKAGES } from "./PackageManager";
export type { PackageInfo, PkgStatus, InstallProgress } from "./PackageManager";

// Data bridge
export {
  serializeForPython,
  wrapGeoJSON,
  wrapData,
  parseJSONOutput,
  parseGeoJSONOutput,
  parseBridgeMessage,
  parsePythonOutput,
  pythonReadPreamble,
  pythonWritePostamble,
  buildStdinScript,
  bridgeTempPath,
  encodeForFile,
} from "./DataBridge";
export type { BridgeMessage, PythonOutput, GeoJSONFeatureCollection, GeoJSONFeature } from "./DataBridge";

// Script templates
export { default as ScriptTemplates, SCRIPT_TEMPLATES } from "./ScriptTemplates";
export type { ScriptTemplate, TemplateCategory } from "./ScriptTemplates";

// Template content re-exports
export {
  ACCESSIBILITY_ANALYSIS,
  NETWORK_ANALYSIS,
  REMOTE_SENSING_NDVI,
  SPATIAL_AUTOCORRELATION,
  URBAN_MORPHOLOGY,
} from "./templates";
