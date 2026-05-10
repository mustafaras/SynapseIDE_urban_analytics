import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn(async (_sql: string) => makeArrowTable([], []));
const closeMock = vi.fn(async () => {});
const connectMock = vi.fn(async () => ({
  query: queryMock,
  close: closeMock,
  insertArrowFromIPCStream: vi.fn(async () => {}),
}));
const instantiateMock = vi.fn(async () => {});
const terminateMock = vi.fn(async () => {});

class MockAsyncDuckDB {
  constructor(_logger: unknown, _worker: unknown) {}

  connect = connectMock;
  instantiate = instantiateMock;
  terminate = terminateMock;
  registerFileText = vi.fn(async () => {});
}

class MockConsoleLogger {}

vi.mock("@duckdb/duckdb-wasm", () => ({
  selectBundle: vi.fn(async () => ({
    mainModule: "duckdb.wasm",
    mainWorker: "duckdb.worker.js",
  })),
  AsyncDuckDB: MockAsyncDuckDB,
  ConsoleLogger: MockConsoleLogger,
}));

vi.mock("@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url", () => ({ default: "duckdb-browser-eh.worker.js" }));
vi.mock("@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url", () => ({ default: "duckdb-browser-mvp.worker.js" }));
vi.mock("@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url", () => ({ default: "duckdb-eh.wasm" }));
vi.mock("@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url", () => ({ default: "duckdb-mvp.wasm" }));

class MockWorker {
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor(_url: string | URL, _options?: WorkerOptions) {}
}

vi.stubGlobal("Worker", MockWorker);

function makeArrowTable(fields: Array<{ name: string; type: string }>, rows: Record<string, unknown>[]) {
  const children = new Map(
    fields.map((field) => [
      field.name,
      {
        get(index: number) {
          return rows[index]?.[field.name] ?? null;
        },
      },
    ]),
  );

  return {
    numRows: rows.length,
    schema: {
      fields: fields.map((field) => ({ name: field.name, type: field.type })),
    },
    getChild(name: string) {
      return children.get(name) ?? null;
    },
  };
}

describe("SpatialDB", () => {
  beforeEach(async () => {
    const module = await import("../SpatialDB");
    await module.close();
    queryMock.mockReset();
    closeMock.mockClear();
    connectMock.mockClear();
    instantiateMock.mockClear();
    terminateMock.mockClear();
  });

  it("inspects row counts, schema, geometry type, and sample rows for a live table", async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("INSTALL spatial; LOAD spatial;")) {
        return makeArrowTable([], []);
      }
      if (sql.includes('SELECT * FROM "worker_parcels" LIMIT 0')) {
        return makeArrowTable([
          { name: "parcel_id", type: "VARCHAR" },
          { name: "risk_score", type: "DOUBLE" },
          { name: "geometry", type: "GEOMETRY" },
        ], []);
      }
      if (sql.includes('SELECT COUNT(*)::INTEGER AS cnt FROM "worker_parcels"')) {
        return makeArrowTable([{ name: "cnt", type: "INTEGER" }], [{ cnt: 24 }]);
      }
      if (sql.includes('SELECT * FROM "worker_parcels" LIMIT 2')) {
        return makeArrowTable([
          { name: "parcel_id", type: "VARCHAR" },
          { name: "risk_score", type: "DOUBLE" },
          { name: "geometry", type: "GEOMETRY" },
        ], [
          { parcel_id: "P-104", risk_score: 81, geometry: "POLYGON(...)" },
          { parcel_id: "P-208", risk_score: 52, geometry: "POLYGON(...)" },
        ]);
      }
      if (sql.includes('SELECT ST_GeometryType("geometry") AS geometry_type')) {
        return makeArrowTable([{ name: "geometry_type", type: "VARCHAR" }], [{ geometry_type: "POLYGON" }]);
      }
      return makeArrowTable([], []);
    });

    const module = await import("../SpatialDB");
    const inspection = await module.inspectTable("worker_parcels", 2);

    expect(inspection.name).toBe("worker_parcels");
    expect(inspection.rowCount).toBe(24);
    expect(inspection.geometryColumn).toBe("geometry");
    expect(inspection.geometryType).toBe("POLYGON");
    expect(inspection.columns.map((column) => column.name)).toEqual(["parcel_id", "risk_score", "geometry"]);
    expect(inspection.sampleRows[0]).toMatchObject({ parcel_id: "P-104", risk_score: 81 });
  });

  it("drops stale aliases and creates a safe view for worker-backed live queries", async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("INSTALL spatial; LOAD spatial;")) {
        return makeArrowTable([], []);
      }
      return makeArrowTable([], []);
    });

    const module = await import("../SpatialDB");
    await module.bindTableAlias("parcels", "worker_parcels");

    expect(queryMock).toHaveBeenCalledWith('DROP VIEW IF EXISTS "parcels"');
    expect(queryMock).toHaveBeenCalledWith('DROP TABLE IF EXISTS "parcels"');
    expect(queryMock).toHaveBeenCalledWith('CREATE VIEW "parcels" AS SELECT * FROM "worker_parcels"');
  });
});