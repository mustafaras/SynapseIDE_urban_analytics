

// ── Types ────────────────────────────────────────────────────────────────────
export type SemanticStatus = {
  generated?: boolean;
  synced?: boolean;
  analysisOutput?: boolean;
  mapLayerCandidate?: boolean;
  scenarioArtifact?: boolean;
};

export type SearchDocExtended = {
  id: string;
  name: string;
  path: string;
  content: string;
  size?: number;
  isOpen?: boolean;
  semanticStatus?: SemanticStatus;
};

export type ResultKind = 'filename' | 'content' | 'artifact';

export type SearchResult = {
  docId: string;
  docName: string;
  docPath: string;
  line: number;
  preview: string;
  matchIndex: number;
  matchLength: number;
  kind: ResultKind;
  isOpen: boolean;
  semanticStatus?: SemanticStatus;
};

// ── Exclusion rules ──────────────────────────────────────────────────────────
// Extensions whose content should NOT be read (binary or unreadable formats).
const BINARY_EXTS = new Set([
  '.shp', '.dbf', '.shx', '.prj', '.cpg', '.gpkg', '.mbtiles',
  '.parquet', '.geotiff', '.tiff', '.tif', '.img',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
  '.pdf', '.zip', '.gz', '.tar', '.7z', '.rar',
  '.wasm', '.ttf', '.woff', '.woff2', '.eot',
  '.bin', '.exe', '.dll', '.so', '.dylib',
  '.pyc', '.pyo',
]);

// Path segments that indicate generated or dependency trees.
const EXCLUDED_SEGMENTS = [
  '/node_modules/', '/.git/', '/__pycache__/', '/.venv/',
  '/dist/', '/build/', '/.next/', '/coverage/', '/.cache/',
];

// Skip content indexing for files larger than 500 KB.
const MAX_CONTENT_BYTES = 500_000;

// Artifact flag → search keywords that trigger an artifact match.
const ARTIFACT_KEYWORDS: Array<{ key: keyof SemanticStatus; terms: string[] }> = [
  { key: 'generated',        terms: ['generated', 'gen'] },
  { key: 'analysisOutput',   terms: ['analysis', 'output', 'result'] },
  { key: 'mapLayerCandidate', terms: ['map', 'layer', 'geospatial', 'geo'] },
  { key: 'scenarioArtifact', terms: ['scenario'] },
  { key: 'synced',           terms: ['synced', 'sync'] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fileExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function isExcludedPath(path: string): boolean {
  const p = `/${path}`.replace(/\\/g, '/').replace(/\/\/+/g, '/');
  return EXCLUDED_SEGMENTS.some(seg => p.includes(seg));
}

function artifactMatchesQuery(status: SemanticStatus, q: string): boolean {
  for (const { key, terms } of ARTIFACT_KEYWORDS) {
    if (status[key] && terms.some(t => q.includes(t))) return true;
  }
  return false;
}

function hasArtifactFlag(status: SemanticStatus): boolean {
  return !!(status.generated || status.analysisOutput ||
    status.mapLayerCandidate || status.scenarioArtifact || status.synced);
}

// ── State ────────────────────────────────────────────────────────────────────
let docs: SearchDocExtended[] = [];

// ── Message handler ──────────────────────────────────────────────────────────
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data || {};

  if (type === 'index') {
    docs = (payload?.docs ?? []) as SearchDocExtended[];
    (self as any).postMessage({ type: 'indexed', payload: { count: docs.length } });
    return;
  }

  if (type === 'query') {
    const requestId = payload?.requestId;
    const raw: string = String(payload?.q ?? '');
    const q = raw.toLowerCase().trim();
    const limit: number = payload?.limit ?? 300;

    if (!q) {
      (self as any).postMessage({ type: 'results', payload: { requestId, results: [] } });
      return;
    }

    const results: SearchResult[] = [];
    // Track per-doc filename/artifact hits to avoid duplicate header rows.
    const seenFilename = new Set<string>();
    const seenArtifact = new Set<string>();

    for (const d of docs) {
      if (isExcludedPath(d.path)) continue;

      const nameLC = d.name.toLowerCase();
      const pathLC = d.path.toLowerCase();
      const isOpen = d.isOpen ?? false;
      const status = d.semanticStatus;

      // ── 1. Filename / path match ────────────────────────────────────────
      if (!seenFilename.has(d.id) && (nameLC.includes(q) || pathLC.includes(q))) {
        seenFilename.add(d.id);
        const nameIdx = nameLC.indexOf(q);
        results.push({
          docId: d.id,
          docName: d.name,
          docPath: d.path,
          line: 0,
          preview: d.path,
          matchIndex: nameIdx >= 0 ? nameIdx : pathLC.indexOf(q),
          matchLength: q.length,
          kind: 'filename',
          isOpen,
          ...(status !== undefined ? { semanticStatus: status } : {}),
        });
      }

      // ── 2. Artifact metadata match ───────────────────────────────────────
      if (status && !seenArtifact.has(d.id) && hasArtifactFlag(status) &&
          artifactMatchesQuery(status, q)) {
        seenArtifact.add(d.id);
        results.push({
          docId: d.id,
          docName: d.name,
          docPath: d.path,
          line: 0,
          preview: d.path,
          matchIndex: 0,
          matchLength: 0,
          kind: 'artifact',
          isOpen,
          ...(status !== undefined ? { semanticStatus: status } : {}),
        });
      }

      // ── 3. Content match (text files only, below size cap) ───────────────
      if (BINARY_EXTS.has(fileExt(d.name))) continue;
      if (d.size != null && d.size > MAX_CONTENT_BYTES) continue;
      const content = d.content;
      if (!content) continue;

      const lines = content.split(/\r?\n/);
      let fileHits = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const idx = line.toLowerCase().indexOf(q);
        if (idx !== -1) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(line.length, idx + q.length + 60);
          results.push({
            docId: d.id,
            docName: d.name,
            docPath: d.path,
            line: i + 1,
            preview: line.slice(start, end),
            matchIndex: idx - start,
            matchLength: q.length,
            kind: 'content',
            isOpen,
            ...(status !== undefined ? { semanticStatus: status } : {}),
          });
          if (++fileHits >= 10) break; // cap per-file content hits
        }
      }

      if (results.length >= limit) break;
    }

    (self as any).postMessage({ type: 'results', payload: { requestId, results } });
  }
};
