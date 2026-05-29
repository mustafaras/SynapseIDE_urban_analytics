/* Processing toolbox (Prompt 24a) — public surface. */

export {
  MapProcessingRegistry,
  type ProcessingToolSearchOptions,
} from "./MapProcessingRegistry";

export {
  REFERENCE_TOOL_DESCRIPTORS,
  REFERENCE_TOOL_EXECUTORS,
  getReferenceToolExecutor,
  buildProcessingManifest,
  type ProcessingToolExecutor,
  type ProcessingToolInputs,
  type ProcessingToolPreview,
  type BuildProcessingManifestInput,
} from "./referenceTools";

export {
  runProcessingTool,
  previewProcessingTool,
  getProcessingToolDescriptor,
  listProcessingToolDescriptors,
  type ProcessingExecutorExtensionOptions,
  type ProcessingRunOptions,
  type ProcessingRunResult,
  type ProcessingPreviewOutcome,
  type ProcessingToolExecutorLookup,
} from "./MapProcessingExecutor";

export {
  REFERENCE_PLUGIN_TOOL_ID,
  REFERENCE_PLUGIN_TOOL_DESCRIPTOR,
  REFERENCE_PLUGIN_TOOL_EXECUTOR,
  REFERENCE_PLUGIN_TOOL_EXECUTORS,
} from "./pluginTools";

import { MapProcessingRegistry } from "./MapProcessingRegistry";
import { listProcessingToolDescriptors } from "./MapProcessingExecutor";
import type { ProcessingToolDescriptor } from "@/services/map/contracts/gisContracts";

/**
 * Build a registry pre-seeded with the full processing catalogue: the Prompt
 * 24a reference tools (buffer, centroid, attribute-filter), the Prompt 24b
 * service-backed tools (overlay/geometry/join/stats), and the not-yet-wired
 * stub descriptors (shown disabled with a reason).
 */
export function createMapProcessingRegistry(
  extensionDescriptors: ReadonlyArray<ProcessingToolDescriptor> = [],
): MapProcessingRegistry {
  return new MapProcessingRegistry([...listProcessingToolDescriptors(), ...extensionDescriptors]);
}
