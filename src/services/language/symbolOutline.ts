import type * as Monaco from 'monaco-editor';
import type {
  OutlineEntry,
  OutlineExtractionSource,
  OutlineRange,
  OutlineStatus,
  OutlineSymbol,
  OutlineSymbolKind,
} from '@/stores/outlineStore';

type MonacoApi = typeof Monaco;
type MonacoModel = Monaco.editor.ITextModel;

interface ExtractArgs {
  monaco: MonacoApi;
  model: MonacoModel;
  tabId: string;
  path: string;
  language: string;
}

interface TypeScriptNavNode {
  text?: string;
  kind?: string;
  spans?: Array<{ start: number; length: number }>;
  childItems?: TypeScriptNavNode[];
}

const OUTLINE_MAX_CHARS = 500_000;
const OUTLINE_THROTTLE_MS = 240;

export const outlineThrottleMs = OUTLINE_THROTTLE_MS;

const TS_LANGUAGE_IDS = new Set(['javascript', 'javascriptreact', 'typescript', 'typescriptreact']);
const PYTHON_LANGUAGE_IDS = new Set(['python']);
const MARKDOWN_LANGUAGE_IDS = new Set(['markdown']);

const TS_KIND_MAP: Record<string, OutlineSymbolKind> = {
  module: 'namespace',
  class: 'class',
  interface: 'interface',
  type: 'type',
  enum: 'enum',
  function: 'function',
  'local function': 'function',
  method: 'method',
  'member function': 'method',
  getter: 'property',
  setter: 'property',
  property: 'property',
  var: 'var',
  variable: 'var',
  const: 'const',
  let: 'let',
  alias: 'type',
};

function normalizeLanguageId(language: string): string {
  const value = language.toLowerCase();
  if (value === 'js' || value === 'jsx') return 'javascript';
  if (value === 'ts' || value === 'tsx') return 'typescript';
  if (value === 'py') return 'python';
  if (value === 'md') return 'markdown';
  return value || 'plaintext';
}

function rangeFromOffsets(model: MonacoModel, startOffset: number, length: number): OutlineRange {
  const start = model.getPositionAt(Math.max(0, startOffset));
  const end = model.getPositionAt(Math.max(startOffset, startOffset + Math.max(1, length)));
  return {
    startLine: start.lineNumber,
    startColumn: start.column,
    endLine: end.lineNumber,
    endColumn: end.column,
  };
}

function rangeFromLine(line: number, text: string, column = 1): OutlineRange {
  const safeLine = Math.max(1, line);
  const safeColumn = Math.max(1, column);
  return {
    startLine: safeLine,
    startColumn: safeColumn,
    endLine: safeLine,
    endColumn: Math.max(safeColumn + 1, text.length + 1),
  };
}

function symbolId(path: string, kind: OutlineSymbolKind, name: string, range: OutlineRange): string {
  return `${path}:${range.startLine}:${range.startColumn}:${kind}:${name}`;
}

function normalizeStatus(symbols: OutlineSymbol[], source: OutlineExtractionSource): OutlineStatus {
  if (symbols.length > 0) return 'ready';
  return source === 'none' ? 'unsupported' : 'empty';
}

function entry(
  args: ExtractArgs,
  status: OutlineStatus,
  source: OutlineExtractionSource,
  symbols: OutlineSymbol[],
  message: string
): OutlineEntry {
  return {
    tabId: args.tabId,
    path: args.path,
    language: normalizeLanguageId(args.language),
    status,
    source,
    symbols,
    updatedAt: new Date().toISOString(),
    message,
  };
}

function convertTypeScriptNode(model: MonacoModel, path: string, node: TypeScriptNavNode): OutlineSymbol | null {
  const name = String(node.text || '').trim();
  const span = node.spans?.[0];
  if (!name || !span) return null;
  if (name === '<global>' || name === 'script') return null;
  const rawKind = String(node.kind || '').toLowerCase();
  const kind = TS_KIND_MAP[rawKind] ?? 'var';
  const range = rangeFromOffsets(model, Number(span.start || 0), Number(span.length || 1));
  const children = (node.childItems || [])
    .map(child => convertTypeScriptNode(model, path, child))
    .filter((child): child is OutlineSymbol => Boolean(child));
  const base: OutlineSymbol = {
    id: symbolId(path, kind, name, range),
    name,
    kind,
    range,
    selectionRange: range,
    source: 'monaco',
  };
  return children.length ? { ...base, children } : base;
}

async function extractTypeScriptWorkerSymbols(args: ExtractArgs, languageId: string): Promise<OutlineSymbol[] | null> {
  const ts = args.monaco.languages.typescript;
  const getWorker =
    languageId === 'javascript' || languageId === 'javascriptreact'
      ? ts.getJavaScriptWorker
      : ts.getTypeScriptWorker;
  if (typeof getWorker !== 'function') return null;

  const workerAccessor = await getWorker();
  const worker = await workerAccessor(args.model.uri);
  const tree = (await worker.getNavigationTree(args.model.uri.toString())) as TypeScriptNavNode | undefined;
  const roots = tree?.childItems || [];
  return roots
    .map(node => convertTypeScriptNode(args.model, args.path, node))
    .filter((symbol): symbol is OutlineSymbol => Boolean(symbol));
}

function extractJavaScriptHeuristicSymbols(args: ExtractArgs): OutlineSymbol[] {
  const symbols: OutlineSymbol[] = [];
  const lines = args.model.getValue().split(/\r\n|\r|\n/);
  lines.forEach((line, index) => {
    const patterns: Array<{ re: RegExp; kind: OutlineSymbolKind }> = [
      { re: /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\b/, kind: 'function' },
      { re: /^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)\b/, kind: 'class' },
      { re: /^\s*(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)\b/, kind: 'interface' },
      { re: /^\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\b/, kind: 'type' },
      { re: /^\s*(?:export\s+)?enum\s+([A-Za-z_$][\w$]*)\b/, kind: 'enum' },
      { re: /^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\b/, kind: 'const' },
      { re: /^\s*(?:export\s+)?let\s+([A-Za-z_$][\w$]*)\b/, kind: 'let' },
      { re: /^\s*(?:export\s+)?var\s+([A-Za-z_$][\w$]*)\b/, kind: 'var' },
    ];
    for (const pattern of patterns) {
      const match = line.match(pattern.re);
      if (!match?.[1]) continue;
      const column = Math.max(1, line.indexOf(match[1]) + 1);
      const range = rangeFromLine(index + 1, line, column);
      symbols.push({
        id: symbolId(args.path, pattern.kind, match[1], range),
        name: match[1],
        kind: pattern.kind,
        range,
        selectionRange: range,
        source: 'heuristic',
        detail: 'Pattern outline; Monaco symbols were unavailable.',
      });
      break;
    }
  });
  return symbols;
}

function extractPythonHeuristicSymbols(args: ExtractArgs): OutlineSymbol[] {
  const symbols: OutlineSymbol[] = [];
  const lines = args.model.getValue().split(/\r\n|\r|\n/);
  lines.forEach((line, index) => {
    const match = line.match(/^(\s*)(?:async\s+def|def|class)\s+([A-Za-z_][\w]*)\b/);
    if (!match?.[2]) return;
    const isClass = /\bclass\s+/.test(line);
    const isIndented = (match[1] || '').length > 0;
    const kind: OutlineSymbolKind = isClass ? 'class' : isIndented ? 'method' : 'function';
    const column = Math.max(1, line.indexOf(match[2]) + 1);
    const range = rangeFromLine(index + 1, line, column);
    symbols.push({
      id: symbolId(args.path, kind, match[2], range),
      name: match[2],
      kind,
      range,
      selectionRange: range,
      source: 'heuristic',
      detail: 'Python pattern outline; no Python language server is active.',
    });
  });
  return symbols;
}

function extractMarkdownHeuristicSymbols(args: ExtractArgs): OutlineSymbol[] {
  const symbols: OutlineSymbol[] = [];
  const lines = args.model.getValue().split(/\r\n|\r|\n/);
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match?.[2]) return;
    const name = match[2].trim();
    const range = rangeFromLine(index + 1, line, match[1].length + 2);
    symbols.push({
      id: symbolId(args.path, 'heading', name, range),
      name,
      kind: 'heading',
      range,
      selectionRange: range,
      source: 'heuristic',
      detail: `Markdown heading level ${match[1].length}.`,
    });
  });
  return symbols;
}

export async function extractDocumentOutline(args: ExtractArgs): Promise<OutlineEntry> {
  const languageId = normalizeLanguageId(args.model.getLanguageId?.() || args.language);
  const valueLength = args.model.getValueLength?.() ?? args.model.getValue().length;
  if (valueLength > OUTLINE_MAX_CHARS) {
    return entry(
      args,
      'unsupported',
      'none',
      [],
      'Outline disabled for this large file to keep editing responsive.'
    );
  }

  if (TS_LANGUAGE_IDS.has(languageId)) {
    try {
      const monacoSymbols = await extractTypeScriptWorkerSymbols(args, languageId);
      if (monacoSymbols) {
        return entry(
          args,
          normalizeStatus(monacoSymbols, 'monaco'),
          'monaco',
          monacoSymbols,
          monacoSymbols.length
            ? 'Symbols from Monaco TypeScript navigation tree.'
            : 'Monaco returned no document symbols for this file.'
        );
      }
    } catch {}
    const fallbackSymbols = extractJavaScriptHeuristicSymbols(args);
    return entry(
      args,
      normalizeStatus(fallbackSymbols, 'heuristic'),
      'heuristic',
      fallbackSymbols,
      fallbackSymbols.length
        ? 'Monaco symbols unavailable; showing pattern-based JavaScript/TypeScript outline.'
        : 'No symbols found by Monaco or the limited JavaScript/TypeScript fallback.'
    );
  }

  if (PYTHON_LANGUAGE_IDS.has(languageId)) {
    const pythonSymbols = extractPythonHeuristicSymbols(args);
    return entry(
      args,
      normalizeStatus(pythonSymbols, 'heuristic'),
      'heuristic',
      pythonSymbols,
      pythonSymbols.length
        ? 'Python outline uses a limited def/class pattern extractor; no Python language server is active.'
        : 'No Python def/class symbols found by the limited fallback extractor.'
    );
  }

  if (MARKDOWN_LANGUAGE_IDS.has(languageId)) {
    const markdownSymbols = extractMarkdownHeuristicSymbols(args);
    return entry(
      args,
      normalizeStatus(markdownSymbols, 'heuristic'),
      'heuristic',
      markdownSymbols,
      markdownSymbols.length
        ? 'Markdown outline uses heading syntax only.'
        : 'No Markdown headings found.'
    );
  }

  return entry(
    args,
    'unsupported',
    'none',
    [],
    `${languageId || 'This language'} has no active symbol provider in this IDE session.`
  );
}
