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
  type ProcessingRunOptions,
  type ProcessingRunResult,
  type ProcessingPreviewOutcome,
} from "./MapProcessingExecutor";

import { MapProcessingRegistry } from "./MapProcessingRegistry";
import { REFERENCE_TOOL_DESCRIPTORS } from "./referenceTools";

/**
 * Build a registry pre-seeded with the Prompt 24a reference tools (buffer,
 * centroid, attribute-filter). Prompt 24b registers the remaining service-backed
 * tools onto a registry built the same way.
 */
export function createMapProcessingRegistry(): MapProcessingRegistry {
  return new MapProcessingRegistry(REFERENCE_TOOL_DESCRIPTORS);
}
