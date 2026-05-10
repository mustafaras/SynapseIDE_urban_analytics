import { isSpatialFile } from '@/services/commandRegistry';
import { busTimestamp, synapseBus } from '@/services/synapseBus';
import { useEditorStore } from '@/stores/editorStore';
import { useFileExplorerStore } from '@/stores/fileExplorerStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import type { OverlayLayerConfig } from '@/centerpanel/components/map/mapTypes';
import type { SynapseArtifactEntry, SynapseArtifactType } from '@/types/synapse-workspace';

export interface IdeMapHandoffEligibility {
  hasActiveTab: boolean;
  hasSpatialFile: boolean;
  hasSelectionReference: boolean;
  hasRelatedLayer: boolean;
  hasGeneratedSpatialOutput: boolean;
  canOpenInMapExplorer: boolean;
  canFocusRelatedLayer: boolean;
  canSendSelectionToMap: boolean;
  canRegisterSpatialArtifact: boolean;
}

interface ActiveTabContext {
  path: string;
  name: string;
  content: string;
  selectionText?: string;
  selectionLineRange?: { startLine: number; endLine: number };
}

interface SpatialSelectionSnapshot {
  text: string;
  lineRange?: { startLine: number; endLine: number };
}

interface MapViewportTarget {
  center: [number, number];
  zoom: number;
  bounds?: [number, number, number, number];
}

export interface IdeSelectionReference {
  selectionId: string;
  path: string;
  featureIds: string[];
  lineRange?: { startLine: number; endLine: number };
  summary: string;
  createdAt: string;
}

// Selection registry persists for the lifetime of the browser tab so handoff IDs
// survive an in-place reload (e.g. HMR or accidental refresh) without
// invalidating outstanding map.selection.export references.
const SELECTION_REGISTRY_STORAGE_KEY = 'ide-map-handoff-selection-registry-v1';
const SELECTION_REGISTRY_MAX_ENTRIES = 64;

function getSessionStorageSafe(): Storage | null {
  try {
    if (typeof globalThis === 'undefined') return null;
    const ss = (globalThis as { sessionStorage?: Storage }).sessionStorage;
    return ss ?? null;
  } catch {
    return null;
  }
}

function loadSelectionRegistry(): Map<string, IdeSelectionReference> {
  const ss = getSessionStorageSafe();
  if (!ss) return new Map();
  try {
    const raw = ss.getItem(SELECTION_REGISTRY_STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Array<[string, IdeSelectionReference]>;
    if (!Array.isArray(parsed)) return new Map();
    return new Map(parsed);
  } catch {
    return new Map();
  }
}

function persistSelectionRegistry(map: Map<string, IdeSelectionReference>): void {
  const ss = getSessionStorageSafe();
  if (!ss) return;
  try {
    // Keep the registry bounded so a long session does not grow unbounded.
    if (map.size > SELECTION_REGISTRY_MAX_ENTRIES) {
      const overflow = map.size - SELECTION_REGISTRY_MAX_ENTRIES;
      const iterator = map.keys();
      for (let i = 0; i < overflow; i += 1) {
        const next = iterator.next();
        if (next.done) break;
        map.delete(next.value);
      }
    }
    ss.setItem(SELECTION_REGISTRY_STORAGE_KEY, JSON.stringify(Array.from(map.entries())));
  } catch {
    // sessionStorage write failures are non-fatal; selection lookup will fall back to in-memory only.
  }
}

const ideSelectionRegistry: Map<string, IdeSelectionReference> = loadSelectionRegistry();

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '');
}

function pathBaseName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] || normalized;
}

function pathStem(path: string): string {
  const base = pathBaseName(path);
  const dot = base.lastIndexOf('.');
  return dot === -1 ? base.toLowerCase() : base.slice(0, dot).toLowerCase();
}

function createHandoffId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFileNodeForPath(path: string) {
  const fe = useFileExplorerStore.getState();
  const normalized = normalizePath(path);
  return (
    fe.getFileByPath(normalized)
    || fe.getFileByPath(`/${normalized}`)
    || fe.getFileByPath(path)
  );
}

function getSelectionText(content: string, selection: { start: { line: number; column: number }; end: { line: number; column: number } }): string {
  const lines = content.split(/\r?\n/);
  const startLineIdx = Math.max(0, selection.start.line - 1);
  const endLineIdx = Math.max(startLineIdx, selection.end.line - 1);
  const selectedLines = lines.slice(startLineIdx, endLineIdx + 1);
  if (selectedLines.length === 0) return '';

  if (selectedLines.length === 1) {
    const line = selectedLines[0] ?? '';
    const startCol = Math.max(0, selection.start.column - 1);
    const endCol = Math.max(startCol, selection.end.column - 1);
    return line.slice(startCol, endCol || line.length);
  }

  const firstLine = selectedLines[0] ?? '';
  const lastLine = selectedLines[selectedLines.length - 1] ?? '';
  const startCol = Math.max(0, selection.start.column - 1);
  const endCol = Math.max(0, selection.end.column - 1);

  selectedLines[0] = firstLine.slice(startCol);
  selectedLines[selectedLines.length - 1] = endCol > 0 ? lastLine.slice(0, endCol) : lastLine;
  return selectedLines.join('\n');
}

function extractFeatureIds(text: string): string[] {
  if (!text) return [];
  const ids: string[] = [];
  const quotedIdRegex = /"id"\s*:\s*"([^"\\]{1,128})"/g;
  const numericIdRegex = /"id"\s*:\s*(\d{1,12})/g;

  let match: RegExpExecArray | null;
  while ((match = quotedIdRegex.exec(text)) !== null) {
    ids.push(match[1]);
    if (ids.length >= 50) break;
  }
  while (ids.length < 50 && (match = numericIdRegex.exec(text)) !== null) {
    ids.push(match[1]);
  }

  return Array.from(new Set(ids));
}

function looksLikeSpatialSelection(text: string): boolean {
  if (!text.trim()) return false;
  return /FeatureCollection|"type"\s*:\s*"Feature"|"coordinates"\s*:|"geometry"\s*:|"features"\s*:/i.test(text);
}

function tryParseGeoJson(content: string): GeoJSON.FeatureCollection | null {
  try {
    const parsed = JSON.parse(content) as GeoJSON.FeatureCollection | GeoJSON.Feature;
    if (parsed && typeof parsed === 'object' && parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
      return parsed;
    }
    if (parsed && typeof parsed === 'object' && parsed.type === 'Feature') {
      return {
        type: 'FeatureCollection',
        features: [parsed],
      };
    }
    return null;
  } catch {
    return null;
  }
}

function visitGeometryCoordinates(geometry: GeoJSON.Geometry, visitor: (lng: number, lat: number) => void): void {
  if (geometry.type === 'GeometryCollection') {
    geometry.geometries.forEach((entry) => visitGeometryCoordinates(entry, visitor));
    return;
  }

  const walk = (value: unknown): void => {
    if (!Array.isArray(value) || value.length === 0) return;
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      visitor(Number(value[0]), Number(value[1]));
      return;
    }
    value.forEach(walk);
  };

  walk(geometry.coordinates);
}

function getFeatureCollectionBounds(collection: GeoJSON.FeatureCollection): [number, number, number, number] | null {
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  collection.features.forEach((feature) => {
    if (!feature.geometry) return;
    visitGeometryCoordinates(feature.geometry, (lng, lat) => {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    });
  });

  if (![minLng, minLat, maxLng, maxLat].every(Number.isFinite)) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat];
}

function zoomForBounds(bounds: [number, number, number, number]): number {
  const lngSpan = Math.abs(bounds[2] - bounds[0]);
  const latSpan = Math.abs(bounds[3] - bounds[1]);
  const span = Math.max(lngSpan, latSpan);
  if (span <= 0.0015) return 16;
  if (span <= 0.01) return 14;
  if (span <= 0.05) return 12;
  if (span <= 0.2) return 10;
  return 8;
}

function viewportFromBounds(bounds: [number, number, number, number]): MapViewportTarget {
  return {
    center: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
    zoom: zoomForBounds(bounds),
    bounds,
  };
}

function viewportFromLayer(layer: OverlayLayerConfig): MapViewportTarget | null {
  const metadataBounds = layer.metadata?.bounds;
  if (metadataBounds) {
    return viewportFromBounds(metadataBounds);
  }

  if (layer.sourceData && typeof layer.sourceData === 'object') {
    const source = layer.sourceData as GeoJSON.FeatureCollection | GeoJSON.Feature;
    const collection: GeoJSON.FeatureCollection = source.type === 'FeatureCollection'
      ? source
      : { type: 'FeatureCollection', features: [source] };
    const bounds = getFeatureCollectionBounds(collection);
    if (bounds) return viewportFromBounds(bounds);
  }

  return null;
}

function viewportFromContextContent(content: string): MapViewportTarget | null {
  const parsed = tryParseGeoJson(content);
  if (!parsed) return null;
  const bounds = getFeatureCollectionBounds(parsed);
  return bounds ? viewportFromBounds(bounds) : null;
}

function focusMapViewport(
  mapStore: ReturnType<typeof useMapExplorerStore.getState>,
  context: ActiveTabContext,
  relatedLayer?: OverlayLayerConfig,
): void {
  const target = viewportFromContextContent(context.content) || (relatedLayer ? viewportFromLayer(relatedLayer) : null);
  if (!target) return;

  // Hand-off should recenter immediately; debounced viewport updates can leave stale city focus visible.
  useMapExplorerStore.setState({ center: target.center, zoom: target.zoom, bearing: 0, pitch: 0 });
  if (target.bounds) {
    mapStore.setCurrentMapBounds(target.bounds);
  }
}

function findRelatedLayer(path: string, layers: OverlayLayerConfig[]): OverlayLayerConfig | undefined {
  const normalized = normalizePath(path).toLowerCase();
  const stem = pathStem(path);
  const expectedMaterializedId = buildMaterializedLayerId(path).toLowerCase();

  // Score-based matcher: prefer exact path / id matches over substring contains.
  let best: { layer: OverlayLayerConfig; score: number } | undefined;
  for (const layer of layers) {
    const layerId = layer.id.toLowerCase();
    const layerName = layer.name.toLowerCase();
    const datasetTitle = layer.metadata?.datasetContext?.datasetTitle?.toLowerCase() ?? '';
    const sourceName = layer.provenance?.sourceName?.toLowerCase() ?? '';
    const sourceLabel = layer.provenance?.label?.toLowerCase() ?? '';
    const sourceData = typeof layer.sourceData === 'string' ? layer.sourceData.toLowerCase() : '';
    const layerStem = pathStem(layerName);

    let score = 0;
    if (layerId === expectedMaterializedId) score = Math.max(score, 100);
    if (sourceData === normalized || sourceName === normalized) score = Math.max(score, 90);
    if (layerStem === stem) score = Math.max(score, 80);
    if (datasetTitle === stem || sourceLabel === stem) score = Math.max(score, 70);
    if (sourceData && sourceData.includes(normalized)) score = Math.max(score, 60);
    if (sourceName && sourceName.includes(normalized)) score = Math.max(score, 55);
    if (sourceLabel && sourceLabel.includes(stem)) score = Math.max(score, 40);
    if (datasetTitle && datasetTitle.includes(stem)) score = Math.max(score, 35);
    if (layerName.includes(stem)) score = Math.max(score, 30);

    if (score > 0 && (!best || score > best.score)) {
      best = { layer, score };
    }
  }

  return best?.layer;
}

function getActiveTabContext(): ActiveTabContext | null {
  const ed = useEditorStore.getState();
  const tab = ed.tabs.find((t) => t.id === ed.activeTabId);
  if (!tab) return null;

  // When the editor reports multiple selections, prefer the one with the largest
  // resolved text (most likely the user's intentional spatial snippet). Fall back
  // to the first selection only if none of them yield text.
  let chosenSelection: typeof tab.selections[number] | undefined;
  let chosenText: string | undefined;
  for (const sel of tab.selections) {
    const text = getSelectionText(tab.content, sel);
    if (!text) continue;
    if (!chosenText || text.length > chosenText.length) {
      chosenSelection = sel;
      chosenText = text;
    }
  }
  if (!chosenSelection && tab.selections.length > 0) {
    chosenSelection = tab.selections[0];
    chosenText = chosenSelection ? getSelectionText(tab.content, chosenSelection) : undefined;
  }

  const selectionText = chosenText && chosenText.length > 0 ? chosenText : undefined;
  const selectionLineRange = chosenSelection
    ? {
        startLine: Math.max(1, chosenSelection.start.line),
        endLine: Math.max(chosenSelection.start.line, chosenSelection.end.line),
      }
    : undefined;

  return {
    path: tab.path,
    name: tab.name,
    content: tab.content,
    ...(selectionText !== undefined ? { selectionText } : {}),
    ...(selectionLineRange !== undefined ? { selectionLineRange } : {}),
  };
}

function resolveSpatialSelectionSnapshot(context: ActiveTabContext | null): SpatialSelectionSnapshot | null {
  if (!context) return null;

  if (context.selectionText && context.selectionText.trim().length > 0) {
    return {
      text: context.selectionText,
      ...(context.selectionLineRange ? { lineRange: context.selectionLineRange } : {}),
    };
  }

  if (looksLikeSpatialSelection(context.content)) {
    const totalLines = context.content.split(/\r?\n/).length;
    return {
      text: context.content,
      lineRange: {
        startLine: 1,
        endLine: Math.max(1, totalLines),
      },
    };
  }

  return null;
}

function buildMaterializedLayerId(path: string): string {
  const normalized = normalizePath(path).toLowerCase().replace(/[^a-z0-9/_-]/g, '-');
  return `ide-layer-${normalized.replace(/\/+/g, '-')}`;
}

function ensureRelatedLayerForContext(context: ActiveTabContext, mapStore: ReturnType<typeof useMapExplorerStore.getState>): OverlayLayerConfig | undefined {
  const existing = findRelatedLayer(context.path, mapStore.overlayLayers);
  if (existing) return existing;

  if (!isSpatialFile(context.path) && !looksLikeSpatialSelection(context.content)) {
    return undefined;
  }

  const parsedGeoJson = tryParseGeoJson(context.content);
  const normalizedPath = normalizePath(context.path);
  const layer: OverlayLayerConfig = {
    id: buildMaterializedLayerId(context.path),
    name: pathBaseName(context.path),
    type: 'geojson',
    visible: true,
    opacity: 1,
    group: 'data',
    sourceKind: 'derived',
    queryable: true,
    sourceData: parsedGeoJson ?? normalizedPath,
    metadata: {
      ...(parsedGeoJson?.features.length !== undefined
        ? { featureCount: parsedGeoJson.features.length }
        : {}),
      importFormat: 'geojson',
      datasetContext: {
        datasetTitle: pathBaseName(context.path),
      },
      updatedAt: busTimestamp(),
    },
    provenance: {
      label: 'Materialized from IDE handoff',
      sourceName: normalizedPath,
      method: 'Prompt 21 IDE->Map materialization',
      generatedAt: busTimestamp(),
    },
  };

  mapStore.addOverlayLayer(layer);
  return findRelatedLayer(context.path, useMapExplorerStore.getState().overlayLayers) ?? layer;
}

export function evaluateIdeMapHandoffEligibility(): IdeMapHandoffEligibility {
  const context = getActiveTabContext();
  const layers = useMapExplorerStore.getState().overlayLayers;
  const hasActiveTab = Boolean(context);

  const fileNode = context ? getFileNodeForPath(context.path) : null;
  const hasSpatialFile = Boolean(
    context
    && (
      isSpatialFile(context.path)
      || Boolean(fileNode?.semanticStatus?.mapLayerCandidate)
      || (context.path.toLowerCase().endsWith('.json') && /FeatureCollection|"geometry"\s*:/i.test(context.content))
    )
  );

  const hasGeneratedSpatialOutput = Boolean(
    fileNode?.semanticStatus?.analysisOutput
    || fileNode?.semanticStatus?.generated
  );

  const relatedLayer = context ? findRelatedLayer(context.path, layers) : undefined;
  // A spatial file can be materialized as a map layer on demand via public map-store APIs.
  const hasRelatedLayer = Boolean(relatedLayer) || (hasActiveTab && hasSpatialFile);

  const selectionSnapshot = resolveSpatialSelectionSnapshot(context);
  const hasSelectionReference = Boolean(
    selectionSnapshot
    && (looksLikeSpatialSelection(selectionSnapshot.text) || extractFeatureIds(selectionSnapshot.text).length > 0)
  );

  return {
    hasActiveTab,
    hasSpatialFile,
    hasSelectionReference,
    hasRelatedLayer,
    hasGeneratedSpatialOutput,
    canOpenInMapExplorer: hasActiveTab && (hasSpatialFile || hasGeneratedSpatialOutput || hasRelatedLayer),
    canFocusRelatedLayer: hasActiveTab && hasRelatedLayer,
    canSendSelectionToMap: hasActiveTab && hasSelectionReference,
    canRegisterSpatialArtifact: hasActiveTab && (hasSpatialFile || hasGeneratedSpatialOutput || hasSelectionReference),
  };
}

function appendPendingHandoffId(artifactId: string): void {
  const ws = useSynapseWorkspaceStore.getState();
  const existing = ws.syncState.pendingHandoffIds;
  ws.setPendingHandoffIds(Array.from(new Set([...existing, artifactId])));
}

function buildSpatialArtifactEntry(
  id: string,
  type: SynapseArtifactType,
  title: string,
  uri: string | undefined,
  lineRange?: { startLine: number; endLine: number },
): SynapseArtifactEntry {
  const now = busTimestamp();
  return {
    id,
    type,
    title,
    status: 'active',
    ...(uri ? { uri } : {}),
    ...(lineRange ? { fileRange: lineRange } : {}),
    provenance: {
      sourceModule: 'ide',
      createdAt: now,
      method: 'IDE to Map Explorer handoff',
    },
    updatedAt: now,
    tags: ['prompt-21', 'map-handoff'],
  };
}

export function openInMapExplorer(): { ok: boolean; reason?: string } {
  const eligibility = evaluateIdeMapHandoffEligibility();
  if (!eligibility.canOpenInMapExplorer) {
    return { ok: false, reason: 'Open a spatial file or generated spatial output first.' };
  }

  const context = getActiveTabContext();
  if (!context) {
    return { ok: false, reason: 'No active file context.' };
  }

  const mapStore = useMapExplorerStore.getState();
  mapStore.open();

  const relatedLayer = ensureRelatedLayerForContext(context, mapStore);
  focusMapViewport(mapStore, context, relatedLayer);
  if (relatedLayer) {
    mapStore.setActiveAnalysisResultLayers([relatedLayer.id]);
    synapseBus.emit('map.layer.focus', {
      layerId: relatedLayer.id,
      layerTitle: relatedLayer.name,
      source: 'ide',
      requestedAt: busTimestamp(),
    });
  }

  synapseBus.emit('ide.file.open', {
    path: normalizePath(context.path),
    source: 'ide',
    requestedAt: busTimestamp(),
  });

  useSynapseWorkspaceStore
    .getState()
    .updateModuleSync('map-explorer', { online: true, lastHandoffAt: busTimestamp() });

  return { ok: true };
}

export function focusRelatedLayer(): { ok: boolean; reason?: string } {
  const eligibility = evaluateIdeMapHandoffEligibility();
  if (!eligibility.canFocusRelatedLayer) {
    return { ok: false, reason: 'No related map layer found for the active file.' };
  }

  const context = getActiveTabContext();
  if (!context) {
    return { ok: false, reason: 'No active file context.' };
  }

  const mapStore = useMapExplorerStore.getState();
  const relatedLayer = ensureRelatedLayerForContext(context, mapStore);
  if (!relatedLayer) {
    return { ok: false, reason: 'No related map layer found for the active file.' };
  }

  mapStore.open();
  focusMapViewport(mapStore, context, relatedLayer);
  mapStore.setActiveAnalysisResultLayers([relatedLayer.id]);

  synapseBus.emit('map.layer.focus', {
    layerId: relatedLayer.id,
    layerTitle: relatedLayer.name,
    source: 'ide',
    requestedAt: busTimestamp(),
  });

  useSynapseWorkspaceStore.getState().updateModuleSync('map-explorer', {
    online: true,
    lastHandoffAt: busTimestamp(),
  });

  return { ok: true };
}

export function sendSelectionToMap(): { ok: boolean; reason?: string; selectionId?: string } {
  const eligibility = evaluateIdeMapHandoffEligibility();
  if (!eligibility.canSendSelectionToMap) {
    return { ok: false, reason: 'Select a GeoJSON block or feature reference first.' };
  }

  const context = getActiveTabContext();
  const selectionSnapshot = resolveSpatialSelectionSnapshot(context);
  if (!context || !selectionSnapshot) {
    return { ok: false, reason: 'No active selection context.' };
  }

  const mapStore = useMapExplorerStore.getState();
  const relatedLayer = ensureRelatedLayerForContext(context, mapStore);
  focusMapViewport(mapStore, context, relatedLayer);
  const featureIds = extractFeatureIds(selectionSnapshot.text);
  const selectionId = createHandoffId('ide-selection');

  const selectionRef: IdeSelectionReference = {
    selectionId,
    path: normalizePath(context.path),
    featureIds,
    ...(selectionSnapshot.lineRange ? { lineRange: selectionSnapshot.lineRange } : {}),
    summary: featureIds.length > 0
      ? `Selected ${featureIds.length} feature reference(s) from ${pathBaseName(context.path)}`
      : `Selected spatial snippet from ${pathBaseName(context.path)}`,
    createdAt: busTimestamp(),
  };
  ideSelectionRegistry.set(selectionId, selectionRef);
  persistSelectionRegistry(ideSelectionRegistry);

  mapStore.open();
  if (relatedLayer) {
    mapStore.setActiveAnalysisResultLayers([relatedLayer.id]);
    if (featureIds.length > 0) {
      mapStore.setSelectedFeatures(relatedLayer.id, featureIds);
    }
  }

  synapseBus.emit('map.selection.export', {
    selectionId,
    featureCount: Math.max(1, featureIds.length),
    ...(relatedLayer ? { layerId: relatedLayer.id } : {}),
    source: 'ide',
    requestedAt: busTimestamp(),
  });

  return { ok: true, selectionId };
}

export function registerSpatialArtifact(): { ok: boolean; reason?: string; artifactId?: string } {
  const eligibility = evaluateIdeMapHandoffEligibility();
  if (!eligibility.canRegisterSpatialArtifact) {
    return { ok: false, reason: 'Open a spatial file, generated spatial output, or selection first.' };
  }

  const context = getActiveTabContext();
  if (!context) {
    return { ok: false, reason: 'No active file context.' };
  }

  const mapStore = useMapExplorerStore.getState();
  const relatedLayer = findRelatedLayer(context.path, mapStore.overlayLayers);
  const hasSelection = Boolean(context.selectionText && looksLikeSpatialSelection(context.selectionText));

  const type: SynapseArtifactType = hasSelection
    ? 'spatial-selection'
    : (eligibility.hasGeneratedSpatialOutput ? 'analysis-result' : 'spatial-layer');

  const artifactId = createHandoffId('artifact');
  const artifactTitle = hasSelection
    ? `Spatial selection from ${pathBaseName(context.path)}`
    : `Spatial artifact: ${pathBaseName(context.path)}`;

  const entry = buildSpatialArtifactEntry(
    artifactId,
    type,
    artifactTitle,
    normalizePath(context.path),
    context.selectionLineRange,
  );

  const ws = useSynapseWorkspaceStore.getState();
  ws.registerArtifact(entry);
  ws.updateModuleSync('map-explorer', {
    online: true,
    lastHandoffAt: busTimestamp(),
    lastArtifactId: artifactId,
  });
  appendPendingHandoffId(artifactId);

  synapseBus.emit('evidence.artifact.register', {
    artifactId,
    artifactType: entry.type,
    sourceModule: 'ide',
    source: 'ide',
    title: entry.title,
    summary: 'IDE-registered spatial artifact for map handoff',
    relatedFilePaths: [normalizePath(context.path)],
    ...(relatedLayer ? { relatedLayerIds: [relatedLayer.id] } : {}),
    requestedAt: busTimestamp(),
  });

  return { ok: true, artifactId };
}

export function getSelectionReference(selectionId: string): IdeSelectionReference | null {
  return ideSelectionRegistry.get(selectionId) ?? null;
}

export function clearSelectionRegistry(): void {
  ideSelectionRegistry.clear();
  const ss = getSessionStorageSafe();
  if (ss) {
    try {
      ss.removeItem(SELECTION_REGISTRY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
