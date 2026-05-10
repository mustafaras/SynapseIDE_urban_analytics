import type { FileNode } from '../../types/state';

export type SemanticBadgeTone = 'neutral' | 'info' | 'success' | 'warning';

export interface SemanticBadge {
  id: 'generated' | 'synced' | 'dirty' | 'analysis-output' | 'map-layer' | 'scenario-artifact';
  label: string;
  title: string;
  tone: SemanticBadgeTone;
}

export type ExplorerFileKind =
  | 'folder'
  | 'script'
  | 'notebook'
  | 'query'
  | 'config'
  | 'json'
  | 'table'
  | 'geo-vector'
  | 'geo-package'
  | 'shape-main'
  | 'shape-sidecar'
  | 'archive'
  | 'image'
  | 'media'
  | 'database'
  | 'text'
  | 'unknown';

const SCRIPT_EXTENSIONS = new Set(['py', 'r', 'js', 'jsx', 'ts', 'tsx']);
const QUERY_EXTENSIONS = new Set(['sql']);
const CONFIG_EXTENSIONS = new Set(['yaml', 'yml', 'toml', 'ini', 'conf']);
const TABLE_EXTENSIONS = new Set(['csv', 'parquet']);
const GEO_VECTOR_EXTENSIONS = new Set(['geojson', 'kml', 'gpx']);
const SHAPEFILE_SIDE_CAR_EXTENSIONS = new Set(['dbf', 'shx', 'prj', 'cpg', 'qix', 'sbn', 'sbx']);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff']);
const MEDIA_EXTENSIONS = new Set(['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'mp3', 'wav']);
const ARCHIVE_EXTENSIONS = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz']);
const DATABASE_EXTENSIONS = new Set(['db', 'sqlite', 'mdb']);
const TEXT_EXTENSIONS = new Set(['txt', 'md', 'rst', 'log', 'readme']);

function getLowerExt(name: string): string {
  const idx = name.lastIndexOf('.');
  if (idx <= 0 || idx === name.length - 1) {
    return '';
  }
  return name.slice(idx + 1).toLowerCase();
}

export function getExplorerFileKind(filename: string, isFolder: boolean = false): ExplorerFileKind {
  if (isFolder) {
    return 'folder';
  }

  const ext = getLowerExt(filename);

  if (SCRIPT_EXTENSIONS.has(ext)) {
    return 'script';
  }
  if (ext === 'ipynb') {
    return 'notebook';
  }
  if (QUERY_EXTENSIONS.has(ext)) {
    return 'query';
  }
  if (CONFIG_EXTENSIONS.has(ext)) {
    return 'config';
  }
  if (ext === 'json') {
    return 'json';
  }
  if (TABLE_EXTENSIONS.has(ext)) {
    return 'table';
  }
  if (GEO_VECTOR_EXTENSIONS.has(ext)) {
    return 'geo-vector';
  }
  if (ext === 'gpkg') {
    return 'geo-package';
  }
  if (ext === 'shp') {
    return 'shape-main';
  }
  if (SHAPEFILE_SIDE_CAR_EXTENSIONS.has(ext)) {
    return 'shape-sidecar';
  }
  if (ARCHIVE_EXTENSIONS.has(ext)) {
    return 'archive';
  }
  if (IMAGE_EXTENSIONS.has(ext)) {
    return 'image';
  }
  if (MEDIA_EXTENSIONS.has(ext)) {
    return 'media';
  }
  if (DATABASE_EXTENSIONS.has(ext)) {
    return 'database';
  }
  if (TEXT_EXTENSIONS.has(ext)) {
    return 'text';
  }

  return 'unknown';
}

function isScenarioFileByConfidence(filename: string): boolean {
  const lower = filename.toLowerCase();
  const hasScenarioToken =
    lower.includes('scenario') || lower.includes('assumption') || lower.includes('indicator');
  if (!hasScenarioToken) {
    return false;
  }
  const ext = getLowerExt(filename);
  return ext === 'json' || ext === 'yaml' || ext === 'yml' || ext === 'toml';
}

function isMapLayerByConfidence(filename: string): boolean {
  const kind = getExplorerFileKind(filename, false);
  return (
    kind === 'geo-vector' ||
    kind === 'geo-package' ||
    kind === 'shape-main' ||
    kind === 'shape-sidecar'
  );
}

export function deriveFileSemanticBadges(node: FileNode): SemanticBadge[] {
  if (node.type !== 'file') {
    return [];
  }

  const badges: SemanticBadge[] = [];
  const semanticStatus = node.semanticStatus;

  if (semanticStatus?.generated) {
    badges.push({
      id: 'generated',
      label: 'GEN',
      title: 'Generated artifact',
      tone: 'neutral',
    });
  }

  if (semanticStatus?.synced) {
    badges.push({
      id: 'synced',
      label: 'SYNC',
      title: 'Synced with external source',
      tone: 'success',
    });
  }

  if (node.isDirty) {
    badges.push({
      id: 'dirty',
      label: 'DIRTY',
      title: 'Unsaved local edits',
      tone: 'warning',
    });
  }

  if (semanticStatus?.analysisOutput) {
    badges.push({
      id: 'analysis-output',
      label: 'OUT',
      title: 'Analysis output artifact',
      tone: 'info',
    });
  }

  if (semanticStatus?.mapLayerCandidate || isMapLayerByConfidence(node.name)) {
    badges.push({
      id: 'map-layer',
      label: 'MAP',
      title: 'Map layer candidate',
      tone: 'info',
    });
  }

  if (semanticStatus?.scenarioArtifact || isScenarioFileByConfidence(node.name)) {
    badges.push({
      id: 'scenario-artifact',
      label: 'SCN',
      title: 'Scenario artifact candidate',
      tone: 'neutral',
    });
  }

  return badges;
}
