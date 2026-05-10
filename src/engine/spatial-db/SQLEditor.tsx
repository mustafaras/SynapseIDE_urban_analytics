/**
 * SQLEditor — Monaco-based SQL editor with spatial auto-complete,
 * results table, "Send to Map" action, and query history.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import type * as monacoNs from 'monaco-editor';
import { useSpatialDB } from './hooks/useSpatialDB';

/* ------------------------------------------------------------------ */
/* Spatial function catalogue for auto-complete */
/* ------------------------------------------------------------------ */

const SPATIAL_FUNCTIONS: { label: string; detail: string; insertText: string }[] = [
 { label: 'ST_Area', detail: 'Compute area of a geometry', insertText: 'ST_Area(${1:geometry})' },
 { label: 'ST_Buffer', detail: 'Buffer a geometry by distance', insertText: 'ST_Buffer(${1:geometry}, ${2:distance})' },
 { label: 'ST_Centroid', detail: 'Centroid of a geometry', insertText: 'ST_Centroid(${1:geometry})' },
 { label: 'ST_Contains', detail: 'True if A contains B', insertText: 'ST_Contains(${1:a}, ${2:b})' },
 { label: 'ST_Distance', detail: 'Distance between geometries', insertText: 'ST_Distance(${1:a}, ${2:b})' },
 { label: 'ST_Envelope', detail: 'Bounding box as polygon', insertText: 'ST_Envelope(${1:geometry})' },
 { label: 'ST_Intersects', detail: 'True if geometries intersect', insertText: 'ST_Intersects(${1:a}, ${2:b})' },
 { label: 'ST_Transform', detail: 'Reproject geometry', insertText: "ST_Transform(${1:geometry}, 'EPSG:${2:4326}', 'EPSG:${3:3857}')" },
 { label: 'ST_Union', detail: 'Union of geometries', insertText: 'ST_Union(${1:a}, ${2:b})' },
 { label: 'ST_Within', detail: 'True if A is within B', insertText: 'ST_Within(${1:a}, ${2:b})' },
 { label: 'ST_AsGeoJSON', detail: 'Geometry to GeoJSON text', insertText: 'ST_AsGeoJSON(${1:geometry})' },
 { label: 'ST_AsText', detail: 'Geometry to WKT text', insertText: 'ST_AsText(${1:geometry})' },
 { label: 'ST_GeomFromText', detail: 'Geometry from WKT', insertText: "ST_GeomFromText('${1:POINT(0 0)}')" },
 { label: 'ST_Point', detail: 'Create point from x, y', insertText: 'ST_Point(${1:x}, ${2:y})' },
 { label: 'ST_Length', detail: 'Length of a linestring', insertText: 'ST_Length(${1:geometry})' },
 { label: 'ST_Perimeter', detail: 'Perimeter of a polygon', insertText: 'ST_Perimeter(${1:geometry})' },
 { label: 'ST_X', detail: 'X coordinate of a point', insertText: 'ST_X(${1:point})' },
 { label: 'ST_Y', detail: 'Y coordinate of a point', insertText: 'ST_Y(${1:point})' },
];

/* ------------------------------------------------------------------ */
/* Styles */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
 root: {
 display: 'flex',
 flexDirection: 'column',
 height: '100%',
 fontFamily: 'var(--font-mono, "Fira Code", monospace)',
 color: 'var(--text-primary, #d4c8a0)',
 background: 'var(--bg-panel, #1a1612)',
 },
 toolbar: {
 display: 'flex',
 gap: 8,
 padding: '6px 10px',
 borderBottom: '1px solid var(--border-dim, #2a2520)',
 alignItems: 'center',
 flexShrink: 0,
 },
 btn: {
 padding: '4px 12px',
 border: '1px solid var(--border-dim, #3a3530)',
 borderRadius: 4,
 background: 'var(--bg-btn, #252118)',
 color: 'var(--text-primary, #d4c8a0)',
 cursor: 'pointer',
 fontSize: 12,
 },
 btnPrimary: {
 padding: '4px 14px',
 border: 'none',
 borderRadius: 4,
 background: 'var(--accent-amber, #d4a855)',
 color: '#1a1612',
 fontWeight: 600,
 cursor: 'pointer',
 fontSize: 12,
 },
 editorWrap: {
 flex: '1 1 50%',
 minHeight: 120,
 borderBottom: '1px solid var(--border-dim, #2a2520)',
 },
 resultsWrap: {
 flex: '1 1 50%',
 overflow: 'auto',
 padding: 8,
 fontSize: 12,
 },
 table: {
 width: '100%',
 borderCollapse: 'collapse',
 fontSize: 12,
 },
 th: {
 textAlign: 'left' as const,
 padding: '4px 8px',
 borderBottom: '1px solid var(--border-dim, #2a2520)',
 color: 'var(--text-secondary, #9a8e78)',
 fontWeight: 600,
 position: 'sticky' as const,
 top: 0,
 background: 'var(--bg-panel, #1a1612)',
 },
 td: {
 padding: '3px 8px',
 borderBottom: '1px solid var(--border-faint, #1f1c18)',
 maxWidth: 240,
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap' as const,
 },
 status: {
 fontSize: 11,
 color: 'var(--text-secondary, #9a8e78)',
 marginLeft: 'auto',
 whiteSpace: 'nowrap' as const,
 },
 historyWrap: {
 maxHeight: 160,
 overflowY: 'auto' as const,
 padding: '4px 10px',
 borderTop: '1px solid var(--border-dim, #2a2520)',
 fontSize: 11,
 flexShrink: 0,
 },
 historyItem: {
 padding: '2px 0',
 cursor: 'pointer',
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap' as const,
 color: 'var(--text-secondary, #9a8e78)',
 },
 error: {
 color: '#e85a5a',
 padding: 12,
 fontSize: 12,
 whiteSpace: 'pre-wrap' as const,
 },
};

/* ------------------------------------------------------------------ */
/* History */
/* ------------------------------------------------------------------ */

interface HistoryEntry {
 sql: string;
 ts: number;
}

const MAX_HISTORY = 50;

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export interface SQLEditorProps {
 /** When the user clicks "Send to Map" with GeoJSON result */
 onSendToMap?: (geojson: import('geojson').FeatureCollection) => void;
}

const SQLEditor: React.FC<SQLEditorProps> = ({ onSendToMap }) => {
 const { ready, runQuery, runToGeoJSON, tables, error: dbError } = useSpatialDB();

 const [sql, setSql] = useState('SELECT * FROM ');
 const [result, setResult] = useState<{
 columns: { name: string; type: string }[];
 rows: Record<string, unknown>[];
 rowCount: number;
 elapsed: number;
 } | null>(null);
 const [queryError, setQueryError] = useState<string | null>(null);
 const [running, setRunning] = useState(false);
 const [history, setHistory] = useState<HistoryEntry[]>([]);
 const [showHistory, setShowHistory] = useState(false);

 const editorRef = useRef<monacoNs.editor.IStandaloneCodeEditor | null>(null);
 const completionRef = useRef<monacoNs.IDisposable | null>(null);
const executeShortcutRef = useRef<() => void>(() => {});

 /* ---- column/table completions ---- */
 const tableCompletions = useMemo(() => {
 const items: { label: string; detail: string; insertText: string }[] = [];
 for (const t of tables) {
 items.push({
 label: t.name,
 detail: `Table (${t.rowCount} rows)`,
 insertText: t.name,
 });
 for (const c of t.columns) {
 items.push({
 label: `${t.name}.${c.name}`,
 detail: c.type,
 insertText: c.name,
 });
 }
 }
 return items;
 }, [tables]);

 /* ---- register completions in Monaco ---- */
 const handleEditorMount = useCallback(
 (editor: monacoNs.editor.IStandaloneCodeEditor, monaco: typeof monacoNs) => {
 editorRef.current = editor;
 editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
 executeShortcutRef.current();
 });

 completionRef.current?.dispose();
 completionRef.current = monaco.languages.registerCompletionItemProvider('sql', {
 triggerCharacters: ['.', ' ', 'S'],
 provideCompletionItems(model, position) {
 const word = model.getWordUntilPosition(position);
 const range = {
 startLineNumber: position.lineNumber,
 endLineNumber: position.lineNumber,
 startColumn: word.startColumn,
 endColumn: word.endColumn,
 };

 const suggestions: monacoNs.languages.CompletionItem[] = [
 ...SPATIAL_FUNCTIONS.map((sf) => ({
 label: sf.label,
 kind: monaco.languages.CompletionItemKind.Function,
 insertText: sf.insertText,
 insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
 detail: sf.detail,
 range,
 })),
 ...tableCompletions.map((tc) => ({
 label: tc.label,
 kind: tc.label.includes('.')
 ? monaco.languages.CompletionItemKind.Field
 : monaco.languages.CompletionItemKind.Struct,
 insertText: tc.insertText,
 detail: tc.detail,
 range,
 })),
 ];
 return { suggestions };
 },
 });
 },
 [tableCompletions],
 );

 useEffect(() => () => { completionRef.current?.dispose(); }, []);

 /* ---- run query ---- */
 const execute = useCallback(async () => {
 const trimmed = sql.trim();
 if (!trimmed || !ready) return;

 setRunning(true);
 setQueryError(null);
 setResult(null);

 try {
 const res = await runQuery(trimmed);
 setResult(res);
 setHistory((h) => {
 const next = [{ sql: trimmed, ts: Date.now() }, ...h];
 return next.slice(0, MAX_HISTORY);
 });
 } catch (e: unknown) {
 setQueryError(e instanceof Error ? e.message : String(e));
 } finally {
 setRunning(false);
 }
 }, [sql, ready, runQuery]);
 executeShortcutRef.current = () => { void execute(); };

 /* ---- send to map ---- */
 const handleSendToMap = useCallback(async () => {
 const trimmed = sql.trim();
 if (!trimmed || !onSendToMap) return;
 try {
 const fc = await runToGeoJSON(trimmed);
 onSendToMap(fc);
 } catch (e: unknown) {
 setQueryError(e instanceof Error ? e.message : String(e));
 }
 }, [sql, onSendToMap, runToGeoJSON]);

 /* ---- has geometry column ---- */
 const hasGeometry = result?.columns.some(
 (c) => c.name === 'geometry' || c.name === 'geom',
 );

 /* ---- display rows (cap at 100) ---- */
 const displayRows = result ? result.rows.slice(0, 100) : [];
 const displayCols = result
 ? result.columns.filter((c) => c.name !== 'geometry' && c.name !== 'geom')
 : [];

 return (
 <div style={S.root}>
 {/* Toolbar */}
 <div style={S.toolbar}>
 <button
 style={S.btnPrimary}
 onClick={() => void execute()}
 disabled={running || !ready}
 aria-label="Run query"
 >
 {running ? '⏳ Running…' : '▶ Run'}
 </button>

 {!!onSendToMap && (
 <button
 style={S.btn}
 onClick={() => void handleSendToMap()}
 disabled={!result || !hasGeometry}
 title="Send results with geometry to map"
 aria-label="Send to map"
 >
 Send to Map
 </button>
 )}

 <button
 style={S.btn}
 onClick={() => setShowHistory((h) => !h)}
 aria-label="Toggle query history"
 >
 History
 </button>

 <span style={S.status}>
 {dbError
 ? ` ${dbError}`
 : !ready
 ? 'Initialising DuckDB…'
 : result
 ? `${result.rowCount} rows — ${result.elapsed.toFixed(1)} ms`
 : 'Ready'}
 </span>
 </div>

 {/* Editor */}
 <div style={S.editorWrap}>
 <Editor
 defaultLanguage="sql"
 theme="vs-dark"
 value={sql}
 onChange={(v) => setSql(v ?? '')}
 onMount={handleEditorMount}
 options={{
 minimap: { enabled: false },
 fontSize: 13,
 lineNumbers: 'on',
 scrollBeyondLastLine: false,
 wordWrap: 'on',
 automaticLayout: true,
 tabSize: 2,
 }}
 />
 </div>

 {/* Results */}
 <div style={S.resultsWrap}>
 {!!queryError && <div style={S.error}>{queryError}</div>}

 {!!result && displayCols.length > 0 && (
 <table style={S.table}>
 <thead>
 <tr>
 {displayCols.map((c) => (
 <th key={c.name} style={S.th}>
 {c.name}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {displayRows.map((row, i) => (
 <tr key={i}>
 {displayCols.map((c) => (
 <td key={c.name} style={S.td}>
 {formatCell(row[c.name])}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 )}

 {!!result && result.rowCount > 100 && (
 <p style={{ fontSize: 11, color: '#9a8e78', padding: '4px 8px' }}>
 Showing first 100 of {result.rowCount} rows.
 </p>
 )}
 </div>

 {/* History panel */}
 {!!showHistory && (
 <div style={S.historyWrap}>
 <strong style={{ fontSize: 11 }}>Query History</strong>
 {history.length === 0 && (
 <p style={{ color: '#9a8e78' }}>No queries yet.</p>
 )}
 {history.map((h, i) => (
 <div
 key={i}
 style={S.historyItem}
 onClick={() => setSql(h.sql)}
 title={h.sql}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => {
 if (e.key === 'Enter') setSql(h.sql);
 }}
 >
 <span style={{ opacity: 0.6 }}>
 {new Date(h.ts).toLocaleTimeString()}
 </span>{' '}
 {h.sql.slice(0, 80)}
 </div>
 ))}
 </div>
 )}
 </div>
 );
};

/* ------------------------------------------------------------------ */
/* Cell formatting helper */
/* ------------------------------------------------------------------ */

function formatCell(value: unknown): string {
 if (value === null || value === undefined) return 'NULL';
 if (typeof value === 'number') {
 return Number.isInteger(value) ? String(value) : value.toFixed(6);
 }
 if (typeof value === 'bigint') return String(value);
 if (typeof value === 'boolean') return value ? 'true' : 'false';
 return String(value);
}

export default SQLEditor;
