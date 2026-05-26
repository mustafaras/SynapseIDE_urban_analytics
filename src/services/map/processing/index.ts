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
import { listProcessingToolDescriptors } from "./MapProcessingExecutor";

/**
 * Build a registry pre-seeded with the full processing catalogue: the Prompt
 * 24a reference tools (buffer, centroid, attribute-filter), the Prompt 24b
 * service-backed tools (overlay/geometry/join/stats), and the not-yet-wired
 * stub descriptors (shown disabled with a reason).
 */
export function createMapProcessingRegistry(): MapProcessingRegistry {
  return new MapProcessingRegistry(listProcessingToolDescriptors());
}
