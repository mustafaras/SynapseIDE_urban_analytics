export {
  MapExtensionRegistry,
  buildUrbanMethodBridgeRequest,
  createProcessingRegistryWithExtensions,
  type BuildUrbanBridgeExtensionRequestOptions,
  type MapExtensionAvailabilityStatus,
  type MapExtensionCapabilityStatus,
  type MapExtensionDescriptor,
  type MapExtensionDescriptorBase,
  type MapExtensionExecutionScope,
  type MapExtensionKind,
  type MapExtensionPlugin,
  type MapProcessingToolExtension,
  type MapProcessingToolContribution,
  type MapRendererContribution,
  type MapRendererExtension,
  type MapSourceConnectorContribution,
  type MapSourceConnectorExtension,
  type MapUrbanMethodBridgeContribution,
  type MapUrbanMethodBridgeExtension,
} from "./MapExtensionRegistry";

export {
  MAP_REFERENCE_EXTENSION_PLUGIN,
  MAP_REFERENCE_EXTENSION_PLUGIN_ID,
} from "./referencePlugins";

import { MapExtensionRegistry } from "./MapExtensionRegistry";
import { MAP_REFERENCE_EXTENSION_PLUGIN } from "./referencePlugins";

export function createMapExtensionRegistry(): MapExtensionRegistry {
  return new MapExtensionRegistry([MAP_REFERENCE_EXTENSION_PLUGIN]);
}