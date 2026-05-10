/**
 * SpatialDB — In-browser spatial SQL engine powered by DuckDB-WASM.
 *
 * Provides GeoJSON/CSV ingestion, spatial SQL query execution,
 * and GeoJSON export from query results.
 */

import * as duckdb from '@duckdb/duckdb-wasm';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import duckdbEhWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import duckdbMvpWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdbEhWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import duckdbMvpWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface QueryResult {
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
  rowCount: number;
  elapsed: number;
}

export interface ColumnMeta {
  name: string;
  type: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnMeta[];
  rowCount: number;
}

export interface TableInspection extends TableInfo {
  geometryColumn: string | null;
  geometryType: string | null;
  sampleRows: Record<string, unknown>[];
}

/* ------------------------------------------------------------------ */
/*  Singleton initialisation                                           */
/* ------------------------------------------------------------------ */

let dbInstance: duckdb.AsyncDuckDB | null = null;
let initPromise: Promise<duckdb.AsyncDuckDB> | null = null;

const DUCKDB_BUNDLES: duckdb.DuckDBBundles = {
  eh: {
    mainModule: duckdbEhWasmUrl,
    mainWorker: duckdbEhWorkerUrl,
  },
  mvp: {
    mainModule: duckdbMvpWasmUrl,
    mainWorker: duckdbMvpWorkerUrl,
  },
};

async function boot(): Promise<duckdb.AsyncDuckDB> {
  const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);

  const worker = new Worker(bundle.mainWorker!, { type: 'module' });
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule);

  // Load the spatial extension
  const conn = await db.connect();
  try {
    await conn.query('INSTALL spatial; LOAD spatial;');
  } finally {
    await conn.close();
  }

  return db;
}

/**
 * Return the shared DuckDB-WASM instance, initialising on first call.
 */
export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = boot().then((db) => {
      dbInstance = db;
      return db;
    });
  }
  return initPromise;
}

/* ------------------------------------------------------------------ */
/*  Table name validation                                              */
/* ------------------------------------------------------------------ */

const IDENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function safeIdent(name: string): string {
  if (!IDENT_RE.test(name)) {
    throw new Error(`Invalid table/column identifier: "${name}"`);
  }
  return `"${name}"`;
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function inferGeometryColumn(columns: ColumnMeta[]): string | null {
  return columns.find((column) => column.name === 'geometry')?.name
    ?? columns.find((column) => column.name === 'geom')?.name
    ?? columns.find((column) => /GEOMETRY/i.test(column.type))?.name
    ?? null;
}

/* ------------------------------------------------------------------ */
/*  Arrow → plain rows helper                                          */
/* ------------------------------------------------------------------ */

interface ArrowLikeTable {
  numRows: number;
  schema: {
    fields: Array<{ name: string; type: unknown }>;
  };
  getChild(name: string): { get(index: number): unknown } | null | undefined;
}

function arrowToRows(table: ArrowLikeTable): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const fields = table.schema.fields;
  for (let i = 0; i < table.numRows; i++) {
    const row: Record<string, unknown> = {};
    for (const f of fields) {
      const col = table.getChild(f.name);
      row[f.name] = col ? col.get(i) : null;
    }
    rows.push(row);
  }
  return rows;
}

function arrowColumns(table: ArrowLikeTable): ColumnMeta[] {
  return table.schema.fields.map((f) => ({
    name: f.name,
    type: String(f.type),
  }));
}

/* ------------------------------------------------------------------ */
/*  Data loading                                                       */
/* ------------------------------------------------------------------ */

/**
 * Load a GeoJSON FeatureCollection as a spatial table.
 */
export async function loadGeoJSON(
  tableName: string,
  geojson: FeatureCollection,
): Promise<void> {
  const db = await getDB();
  const ident = safeIdent(tableName);
  const json = JSON.stringify(geojson);

  const conn = await db.connect();
  try {
    await db.registerFileText(`${tableName}.geojson`, json);
    await conn.query(`
      CREATE OR REPLACE TABLE ${ident} AS
      SELECT * FROM ST_Read('${tableName}.geojson');
    `);
  } finally {
    await conn.close();
  }
}

/**
 * Load CSV data and create a table with a POINT geometry column
 * built from the specified lat/lon columns.
 */
export async function loadCSV(
  tableName: string,
  csvData: string,
  latCol: string,
  lonCol: string,
): Promise<void> {
  const db = await getDB();
  const ident = safeIdent(tableName);
  const safeLat = safeIdent(latCol);
  const safeLon = safeIdent(lonCol);

  const conn = await db.connect();
  try {
    await db.registerFileText(`${tableName}.csv`, csvData);
    await conn.query(`
      CREATE OR REPLACE TABLE ${ident} AS
      SELECT *, ST_Point(CAST(${safeLon} AS DOUBLE), CAST(${safeLat} AS DOUBLE)) AS geometry
      FROM read_csv_auto('${tableName}.csv');
    `);
  } finally {
    await conn.close();
  }
}

/**
 * Load an Arrow IPC stream directly into the worker-backed database.
 */
export async function loadArrowIPC(
  tableName: string,
  arrowIPC: Uint8Array,
): Promise<void> {
  const db = await getDB();
  const conn = await db.connect();
  try {
    await conn.insertArrowFromIPCStream(arrowIPC, {
      name: safeIdent(tableName).replace(/"/g, ''),
      create: true,
    });
  } finally {
    await conn.close();
  }
}

/**
 * Bind a safe user-facing alias to an existing worker table.
 */
export async function bindTableAlias(alias: string, sourceTable: string): Promise<void> {
  if (alias === sourceTable) {
    return;
  }

  const db = await getDB();
  const aliasIdent = safeIdent(alias);
  const sourceIdent = safeIdent(sourceTable);

  const conn = await db.connect();
  try {
    await conn.query(`DROP VIEW IF EXISTS ${aliasIdent}`);
    await conn.query(`DROP TABLE IF EXISTS ${aliasIdent}`);
    await conn.query(`CREATE VIEW ${aliasIdent} AS SELECT * FROM ${sourceIdent}`);
  } finally {
    await conn.close();
  }
}

/* ------------------------------------------------------------------ */
/*  Query execution                                                    */
/* ------------------------------------------------------------------ */

/**
 * Execute an arbitrary SQL query and return tabular results.
 */
export async function query(sql: string): Promise<QueryResult> {
  const db = await getDB();
  const conn = await db.connect();
  try {
    const t0 = performance.now();
    const table = await conn.query(sql);
    const elapsed = performance.now() - t0;

    return {
      columns: arrowColumns(table),
      rows: arrowToRows(table),
      rowCount: table.numRows,
      elapsed,
    };
  } finally {
    await conn.close();
  }
}

/**
 * Execute a query whose result includes a geometry column and convert
 * the output to a GeoJSON FeatureCollection.
 *
 * The geometry column is expected to be named `geometry` (or
 * `geom`).  All other columns become Feature properties.
 */
export async function toGeoJSON(sql: string): Promise<FeatureCollection> {
  const db = await getDB();
  const conn = await db.connect();
  try {
    const sanitizedSQL = sql.trim().replace(/;+\s*$/, '');
    const previewTable = await conn.query(`SELECT * FROM (${sanitizedSQL}) AS __q LIMIT 0`);
    const columnNames = previewTable.schema.fields.map((field) => field.name);
    const geometryColumn = columnNames.includes('geometry')
      ? 'geometry'
      : columnNames.includes('geom')
        ? 'geom'
        : null;

    if (!geometryColumn) {
      throw new Error('Query result did not include a geometry column for GeoJSON export.');
    }

    const propertyColumns = columnNames.filter((column) => column !== geometryColumn);
    const propertyProjection = propertyColumns.length > 0
      ? `,\n        ${propertyColumns.map((column) => `__q.${quoteIdent(column)}`).join(',\n        ')}`
      : '';

    // Wrap the user query so that geometry is exported as WKT —
    // DuckDB spatial's ST_AsGeoJSON returns a JSON string per row.
    const wrappedSQL = `
      WITH __q AS (${sanitizedSQL})
      SELECT
        ST_AsGeoJSON(__q.${quoteIdent(geometryColumn)}) AS __geojson_geom${propertyProjection}
      FROM __q
    `;

    const table = await conn.query(wrappedSQL);
    const rows = arrowToRows(table);

    const features: Feature[] = rows.map((r) => {
      const geomStr = r['__geojson_geom'] as string | null;
      const geometry: Geometry | null = geomStr
        ? (JSON.parse(geomStr) as Geometry)
        : null;
      const properties: GeoJsonProperties = {};
      for (const [k, v] of Object.entries(r)) {
        if (k === '__geojson_geom') continue;
        properties[k] = v as string | number | boolean | null;
      }
      return { type: 'Feature' as const, geometry: geometry!, properties };
    });

    return { type: 'FeatureCollection' as const, features };
  } finally {
    await conn.close();
  }
}

/* ------------------------------------------------------------------ */
/*  Introspection                                                      */
/* ------------------------------------------------------------------ */

/**
 * List all user tables and their columns.
 */
export async function getTables(): Promise<TableInfo[]> {
  const db = await getDB();
  const conn = await db.connect();
  try {
    const tableResult = await conn.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'",
    );
    const tableNames = arrowToRows(tableResult).map(
      (r) => r['table_name'] as string,
    );

    const tables: TableInfo[] = [];
    for (const name of tableNames) {
      const colResult = await conn.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${name}' AND table_schema = 'main'`,
      );
      const columns: ColumnMeta[] = arrowToRows(colResult).map((r) => ({
        name: r['column_name'] as string,
        type: r['data_type'] as string,
      }));

      const countResult = await conn.query(
        `SELECT COUNT(*)::INTEGER AS cnt FROM ${safeIdent(name)}`,
      );
      const rowCount = (arrowToRows(countResult)[0]?.['cnt'] as number) ?? 0;

      tables.push({ name, columns, rowCount });
    }
    return tables;
  } finally {
    await conn.close();
  }
}

/**
 * Inspect a table's schema, row count, geometry type, and a small row sample.
 */
export async function inspectTable(tableName: string, sampleLimit = 2): Promise<TableInspection> {
  const db = await getDB();
  const conn = await db.connect();
  const ident = safeIdent(tableName);
  const safeSampleLimit = Math.max(1, Math.min(25, Math.floor(sampleLimit)));

  try {
    const schemaTable = await conn.query(`SELECT * FROM ${ident} LIMIT 0`);
    const columns = arrowColumns(schemaTable);
    const geometryColumn = inferGeometryColumn(columns);

    const countResult = await conn.query(
      `SELECT COUNT(*)::INTEGER AS cnt FROM ${ident}`,
    );
    const rowCount = (arrowToRows(countResult)[0]?.['cnt'] as number) ?? 0;

    const sampleTable = await conn.query(`SELECT * FROM ${ident} LIMIT ${safeSampleLimit}`);
    const sampleRows = arrowToRows(sampleTable);

    let geometryType: string | null = null;
    if (geometryColumn) {
      const geometryTypeResult = await conn.query(`
        SELECT ST_GeometryType(${quoteIdent(geometryColumn)}) AS geometry_type
        FROM ${ident}
        WHERE ${quoteIdent(geometryColumn)} IS NOT NULL
        LIMIT 1
      `);
      geometryType = (arrowToRows(geometryTypeResult)[0]?.['geometry_type'] as string | null) ?? null;
    }

    return {
      name: tableName,
      columns,
      rowCount,
      geometryColumn,
      geometryType,
      sampleRows,
    };
  } finally {
    await conn.close();
  }
}

/**
 * Shut down the database and release the web worker.
 */
export async function close(): Promise<void> {
  if (dbInstance) {
    await dbInstance.terminate();
    dbInstance = null;
    initPromise = null;
  }
}
