/**
 * useSpatialDB — React hook that manages the DuckDB-WASM singleton,
 * exposes query / loadData / getTables helpers, and tracks loaded
 * table metadata.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import * as SpatialDB from '../SpatialDB';
import type { QueryResult, TableInfo, TableInspection } from '../SpatialDB';

export interface UseSpatialDBReturn {
  /** True once the DuckDB-WASM instance + spatial extension are loaded */
  ready: boolean;
  /** Non-null if initialisation or last operation failed */
  error: string | null;
  /** Currently loaded tables with column metadata */
  tables: TableInfo[];
  /** Execute arbitrary SQL */
  runQuery: (sql: string) => Promise<QueryResult>;
  /** Inspect an existing table in the worker-backed database */
  inspectTable: (table: string, sampleLimit?: number) => Promise<TableInspection>;
  /** Bind a safe query alias to an existing table */
  bindTableAlias: (alias: string, sourceTable: string) => Promise<void>;
  /** Execute SQL and return results as GeoJSON FC */
  runToGeoJSON: (sql: string) => Promise<FeatureCollection>;
  /** Load a GeoJSON FC as a spatial table */
  loadGeoJSON: (table: string, geojson: FeatureCollection) => Promise<void>;
  /** Load CSV data as a table with point geometry */
  loadCSV: (table: string, csv: string, latCol: string, lonCol: string) => Promise<void>;
  /** Refresh the table catalogue */
  refreshTables: () => Promise<void>;
}

export function useSpatialDB(): UseSpatialDBReturn {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const mountedRef = useRef(true);

  /* ---- initialise on mount ---- */
  useEffect(() => {
    mountedRef.current = true;

    SpatialDB.getDB()
      .then(async () => {
        if (!mountedRef.current) return;
        setReady(true);
        const t = await SpatialDB.getTables();
        if (mountedRef.current) setTables(t);
      })
      .catch((e: unknown) => {
        if (!mountedRef.current) return;
        setError(e instanceof Error ? e.message : String(e));
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ---- refreshTables ---- */
  const refreshTables = useCallback(async () => {
    try {
      const t = await SpatialDB.getTables();
      if (mountedRef.current) setTables(t);
    } catch (e: unknown) {
      if (mountedRef.current)
        setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  /* ---- runQuery ---- */
  const runQuery = useCallback(
    async (sql: string): Promise<QueryResult> => {
      const res = await SpatialDB.query(sql);
      // Refresh catalogue after DDL that may create/drop tables
      if (/^\s*(CREATE|DROP|ALTER)\b/i.test(sql)) {
        await refreshTables();
      }
      return res;
    },
    [refreshTables],
  );

  /* ---- inspectTable ---- */
  const inspectTable = useCallback(
    async (table: string, sampleLimit?: number): Promise<TableInspection> => SpatialDB.inspectTable(table, sampleLimit),
    [],
  );

  /* ---- bindTableAlias ---- */
  const bindTableAlias = useCallback(
    async (alias: string, sourceTable: string) => {
      await SpatialDB.bindTableAlias(alias, sourceTable);
      await refreshTables();
    },
    [refreshTables],
  );

  /* ---- runToGeoJSON ---- */
  const runToGeoJSON = useCallback(
    async (sql: string): Promise<FeatureCollection> => SpatialDB.toGeoJSON(sql),
    [],
  );

  /* ---- loadGeoJSON ---- */
  const loadGeoJSON = useCallback(
    async (table: string, geojson: FeatureCollection) => {
      await SpatialDB.loadGeoJSON(table, geojson);
      await refreshTables();
    },
    [refreshTables],
  );

  /* ---- loadCSV ---- */
  const loadCSV = useCallback(
    async (table: string, csv: string, latCol: string, lonCol: string) => {
      await SpatialDB.loadCSV(table, csv, latCol, lonCol);
      await refreshTables();
    },
    [refreshTables],
  );

  return {
    ready,
    error,
    tables,
    runQuery,
    inspectTable,
    bindTableAlias,
    runToGeoJSON,
    loadGeoJSON,
    loadCSV,
    refreshTables,
  };
}
