import type {
  ProcessingToolDescriptor,
  UrbanToMapMethodRequestActionInput,
  UrbanToMapMethodRequirements,
} from "@/services/map/contracts/gisContracts";
import {
  buildUrbanToMapMethodRequestPayload,
  type UrbanToMapMethodRequest,
  type UrbanToMapMethodRequestPayload,
} from "@/services/map/bridge/MapUrbanBridgeService";
import { MapProcessingRegistry } from "@/services/map/processing/MapProcessingRegistry";
import {
  listProcessingToolDescriptors,
  type ProcessingToolExecutorLookup,
} from "@/services/map/processing/MapProcessingExecutor";
import type { ProcessingToolExecutor } from "@/services/map/processing/referenceTools";
import type {
  MapConnectionProviderCatalog,
  MapConnectionProviderProfile,
} from "@/services/map/sources/MapConnectionRegistry";
import { MAP_CONNECTION_PROVIDERS } from "@/services/map/sources/MapConnectionRegistry";

export type MapExtensionKind =
  | "source-connector"
  | "renderer"
  | "processing-tool"
  | "urban-method-bridge";

export type MapExtensionCapabilityStatus =
  | "implemented"
  | "demo_mode"
  | "residual_gap"
  | "environment_dependent"
  | "deferred";

export type MapExtensionAvailabilityStatus = "available" | "limited" | "blocked" | "unavailable";
export type MapExtensionExecutionScope = "declarative" | "trusted-preview-only";

export interface MapExtensionDescriptorBase {
  extensionId: string;
  pluginId: string;
  kind: MapExtensionKind;
  label: string;
  summary: string;
  capability: string;
  capabilityStatus: MapExtensionCapabilityStatus;
  availabilityStatus: MapExtensionAvailabilityStatus;
  executionScope: MapExtensionExecutionScope;
  version: string;
  caveats: string[];
  disabledReason?: string;
}

export interface MapSourceConnectorContribution {
  provider: MapConnectionProviderProfile;
  catalogGroup: "external" | "local" | "worker" | "derived" | "demo";
  secretMode: "none" | "browser-managed" | "secured-proxy-required";
}

export interface MapSourceConnectorExtension extends MapExtensionDescriptorBase {
  kind: "source-connector";
  executionScope: "declarative";
  contribution: MapSourceConnectorContribution;
}

export type MapRendererGeometryFamily = "point" | "line" | "polygon" | "raster" | "scene3d" | "mixed";

export interface MapRendererContribution {
  styleFamily: string;
  compatibleGeometry: MapRendererGeometryFamily[];
  qaGates: string[];
  legendContract: "serialized-legend-v1" | "external";
}

export interface MapRendererExtension extends MapExtensionDescriptorBase {
  kind: "renderer";
  executionScope: "declarative";
  contribution: MapRendererContribution;
}

export interface MapProcessingToolContribution {
  descriptor: ProcessingToolDescriptor;
  executor: ProcessingToolExecutor;
}

export interface MapProcessingToolExtension extends MapExtensionDescriptorBase {
  kind: "processing-tool";
  executionScope: "trusted-preview-only";
  contribution: MapProcessingToolContribution;
}

export interface MapUrbanMethodBridgeContribution {
  methodId: string;
  methodLabel: string;
  requestedActions: UrbanToMapMethodRequestActionInput[];
  requirements?: UrbanToMapMethodRequirements;
  workflowId?: string;
  cardId?: string;
  outputIntent?: UrbanToMapMethodRequestPayload["outputIntent"];
}

export interface MapUrbanMethodBridgeExtension extends MapExtensionDescriptorBase {
  kind: "urban-method-bridge";
  executionScope: "declarative";
  contribution: MapUrbanMethodBridgeContribution;
}

export type MapExtensionDescriptor =
  | MapSourceConnectorExtension
  | MapRendererExtension
  | MapProcessingToolExtension
  | MapUrbanMethodBridgeExtension;

export interface MapExtensionPlugin {
  pluginId: string;
  label: string;
  version: string;
  extensions: readonly MapExtensionDescriptor[];
}

export interface BuildUrbanBridgeExtensionRequestOptions {
  requestId?: string;
  createdAt?: string;
}

function compareExtensions(left: MapExtensionDescriptor, right: MapExtensionDescriptor): number {
  return left.kind.localeCompare(right.kind) || left.label.localeCompare(right.label) || left.extensionId.localeCompare(right.extensionId);
}

function assertIdentifier(value: string, label: string): void {
  if (!/^[a-z0-9][a-z0-9._:-]*$/i.test(value)) {
    throw new Error(`${label} "${value}" must be a stable id made from letters, digits, dots, underscores, colons, or hyphens.`);
  }
}

function assertBase(extension: MapExtensionDescriptor): void {
  assertIdentifier(extension.extensionId, "Extension id");
  assertIdentifier(extension.pluginId, "Plugin id");
  if (!extension.label.trim()) throw new Error(`Extension ${extension.extensionId} must declare a label.`);
  if (!extension.capability.trim()) throw new Error(`Extension ${extension.extensionId} must declare a capability.`);
  if ((extension.availabilityStatus === "blocked" || extension.availabilityStatus === "unavailable") && !extension.disabledReason?.trim()) {
    throw new Error(`Extension ${extension.extensionId} must explain why it is ${extension.availabilityStatus}.`);
  }
}

function assertProcessingToolExtension(extension: MapProcessingToolExtension): void {
  const { descriptor, executor } = extension.contribution;
  if (descriptor.toolId !== executor.descriptor.toolId) {
    throw new Error(`Processing extension ${extension.extensionId} descriptor/executor tool ids do not match.`);
  }
  if (listProcessingToolDescriptors().some((builtInDescriptor) => builtInDescriptor.toolId === descriptor.toolId)) {
    throw new Error(`Processing extension ${extension.extensionId} cannot replace core tool ${descriptor.toolId}.`);
  }
  if (descriptor.implemented && !descriptor.qaGated) {
    throw new Error(`Processing extension ${extension.extensionId} cannot be implemented without QA gates.`);
  }
  if (descriptor.implemented && extension.executionScope !== "trusted-preview-only") {
    throw new Error(`Processing extension ${extension.extensionId} must use the trusted-preview-only scope.`);
  }
}

function assertExtension(extension: MapExtensionDescriptor): void {
  assertBase(extension);
  if (extension.kind === "processing-tool") assertProcessingToolExtension(extension);
  if (extension.kind !== "processing-tool" && extension.executionScope !== "declarative") {
    throw new Error(`Extension ${extension.extensionId} must be declarative unless it is a processing tool preview executor.`);
  }
}

function toExecutorRecord(extensions: readonly MapProcessingToolExtension[]): Record<string, ProcessingToolExecutor> {
  const executors: Record<string, ProcessingToolExecutor> = {};
  for (const extension of extensions) {
    executors[extension.contribution.descriptor.toolId] = extension.contribution.executor;
  }
  return executors;
}

function generatedRequestId(extensionId: string): string {
  return `${extensionId}:${Date.now().toString(36)}`;
}

export class MapExtensionRegistry {
  private readonly extensions = new Map<string, MapExtensionDescriptor>();

  constructor(initialPlugins: ReadonlyArray<MapExtensionPlugin> = []) {
    initialPlugins.forEach((plugin) => this.registerPlugin(plugin));
  }

  register(extension: MapExtensionDescriptor): void {
    assertExtension(extension);
    if (this.extensions.has(extension.extensionId)) {
      throw new Error(`Extension ${extension.extensionId} is already registered.`);
    }
    this.extensions.set(extension.extensionId, extension);
  }

  registerPlugin(plugin: MapExtensionPlugin): void {
    assertIdentifier(plugin.pluginId, "Plugin id");
    if (!plugin.label.trim()) throw new Error(`Plugin ${plugin.pluginId} must declare a label.`);
    for (const extension of plugin.extensions) {
      if (extension.pluginId !== plugin.pluginId) {
        throw new Error(`Extension ${extension.extensionId} belongs to ${extension.pluginId}, not plugin ${plugin.pluginId}.`);
      }
      this.register(extension);
    }
  }

  get(extensionId: string): MapExtensionDescriptor | null {
    return this.extensions.get(extensionId) ?? null;
  }

  has(extensionId: string): boolean {
    return this.extensions.has(extensionId);
  }

  list(): MapExtensionDescriptor[] {
    return [...this.extensions.values()].sort(compareExtensions);
  }

  listByKind<K extends MapExtensionKind>(kind: K): Array<Extract<MapExtensionDescriptor, { kind: K }>> {
    return this.list().filter((extension): extension is Extract<MapExtensionDescriptor, { kind: K }> => extension.kind === kind);
  }

  processingToolDescriptors(): ProcessingToolDescriptor[] {
    return this.listByKind("processing-tool").map((extension) => extension.contribution.descriptor);
  }

  processingToolExecutors(): ProcessingToolExecutorLookup {
    return toExecutorRecord(this.listByKind("processing-tool"));
  }

  connectionProviders(
    builtInProviders: MapConnectionProviderCatalog = MAP_CONNECTION_PROVIDERS,
  ): MapConnectionProviderCatalog {
    const providers: Record<string, MapConnectionProviderProfile> = { ...builtInProviders };
    for (const extension of this.listByKind("source-connector")) {
      providers[extension.contribution.provider.id] = extension.contribution.provider;
    }
    return providers;
  }

  rendererFamilies(): MapRendererContribution[] {
    return this.listByKind("renderer").map((extension) => extension.contribution);
  }

  urbanMethodBridges(): MapUrbanMethodBridgeExtension[] {
    return this.listByKind("urban-method-bridge");
  }
}

export function createProcessingRegistryWithExtensions(registry: MapExtensionRegistry): MapProcessingRegistry {
  return new MapProcessingRegistry([
    ...listProcessingToolDescriptors(),
    ...registry.processingToolDescriptors(),
  ]);
}

export function buildUrbanMethodBridgeRequest(
  extension: MapUrbanMethodBridgeExtension,
  options: BuildUrbanBridgeExtensionRequestOptions = {},
): UrbanToMapMethodRequestPayload {
  const contribution = extension.contribution;
  const blocked = extension.availabilityStatus === "blocked" || extension.availabilityStatus === "unavailable";
  const request: UrbanToMapMethodRequest = {
    requestId: options.requestId ?? generatedRequestId(extension.extensionId),
    sourceModule: "urban-analytics",
    destinationModule: "map-explorer",
    methodId: contribution.methodId,
    methodLabel: contribution.methodLabel,
    methodValidity: {
      status: blocked ? "partial" : "complete",
      capabilityStatus: extension.capabilityStatus,
      blockers: blocked && extension.disabledReason ? [extension.disabledReason] : [],
      warnings: extension.caveats,
    },
    requestedActions: contribution.requestedActions,
    ...(contribution.requirements ? { requirements: contribution.requirements } : {}),
    ...(contribution.workflowId ? { workflowId: contribution.workflowId } : {}),
    ...(contribution.cardId ? { cardId: contribution.cardId } : {}),
    ...(contribution.outputIntent ? { outputIntent: contribution.outputIntent } : {}),
    ...(options.createdAt ? { createdAt: options.createdAt } : {}),
  };
  return buildUrbanToMapMethodRequestPayload(request, options.createdAt ?? new Date().toISOString());
}