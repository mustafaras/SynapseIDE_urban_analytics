import {
  Binary,
  Field,
  Schema,
  Table,
  tableFromArrays,
  tableToIPC,
  vectorFromArray,
} from "apache-arrow";
import * as parquet from "parquet-wasm/node";

export interface InMemoryUploadFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

function writeUint8(bytes: number[], value: number): void {
  bytes.push(value & 0xff);
}

function writeUint32LE(bytes: number[], value: number): void {
  const buffer = Buffer.allocUnsafe(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  bytes.push(...buffer);
}

function writeFloat64LE(bytes: number[], value: number): void {
  const buffer = Buffer.allocUnsafe(8);
  buffer.writeDoubleLE(value, 0);
  bytes.push(...buffer);
}

function encodePointWkb([x, y]: [number, number]): Uint8Array {
  const bytes: number[] = [];
  writeUint8(bytes, 1);
  writeUint32LE(bytes, 1);
  writeFloat64LE(bytes, x);
  writeFloat64LE(bytes, y);
  return Uint8Array.from(bytes);
}

function encodeLineStringWkb(coordinates: Array<[number, number]>): Uint8Array {
  const bytes: number[] = [];
  writeUint8(bytes, 1);
  writeUint32LE(bytes, 2);
  writeUint32LE(bytes, coordinates.length);
  for (const [x, y] of coordinates) {
    writeFloat64LE(bytes, x);
    writeFloat64LE(bytes, y);
  }
  return Uint8Array.from(bytes);
}

export function createArrowFixture(): InMemoryUploadFile {
  const table = tableFromArrays({
    longitude: [28.9784, 29.015, 28.9912],
    latitude: [41.0082, 41.042, 41.0194],
    district: ["Historic Core", "Waterfront", "Innovation Belt"],
    households: [1200, 980, 1450],
    active: [true, false, true],
  });

  return {
    name: "urban-sensors.arrow",
    mimeType: "application/vnd.apache.arrow.stream",
    buffer: Buffer.from(tableToIPC(table, "stream")),
  };
}

export function createArrowWktFixture(): InMemoryUploadFile {
  const table = tableFromArrays({
    geometry: [
      "POINT (28.9784 41.0082)",
      "LINESTRING (28.97 41.0, 28.99 41.02, 29.005 41.028)",
      "INVALID (29.01 41.03)",
    ],
    district: ["Historic Core", "Connector Spine", "Rejected Sample"],
    priority: [1, 2, 3],
    scenario: ["baseline", "mobility", "invalid"],
  });

  return {
    name: "urban-zones.arrow",
    mimeType: "application/vnd.apache.arrow.stream",
    buffer: Buffer.from(tableToIPC(table, "stream")),
  };
}

export function createGeoParquetFixture(): InMemoryUploadFile {
  const geometryVector = vectorFromArray([
    encodePointWkb([28.9784, 41.0082]),
    encodeLineStringWkb([
      [28.97, 41.0],
      [28.99, 41.02],
      [29.005, 41.028],
    ]),
  ], new Binary());

  const attributeTable = tableFromArrays({
    name: ["Observation Node", "Connector Corridor"],
    score: [0.92, 0.81],
    category: ["sensor", "mobility"],
  });

  const schema = new Schema(
    [new Field("geometry", geometryVector.type, false), ...attributeTable.schema.fields],
    new Map([
      ["geo", JSON.stringify({
        version: "1.1.0",
        primary_column: "geometry",
        columns: {
          geometry: {
            encoding: "WKB",
            geometry_types: ["LineString", "Point"],
            bbox: [28.97, 41.0, 29.005, 41.028],
          },
        },
      })],
    ]),
  );

  const columns = Object.fromEntries(attributeTable.schema.fields.map((field) => {
    const column = attributeTable.getChild(field.name);
    if (!column) {
      throw new Error(`Missing attribute column: ${field.name}`);
    }
    return [field.name, column];
  }));

  const table = new Table(schema, {
    geometry: geometryVector,
    ...columns,
  });

  const parquetBytes = parquet.writeParquet(
    parquet.Table.fromIPCStream(tableToIPC(table, "stream")),
  );

  return {
    name: "urban-observations.geoparquet",
    mimeType: "application/vnd.apache.parquet",
    buffer: Buffer.from(parquetBytes),
  };
}