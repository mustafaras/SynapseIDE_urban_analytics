// Urban Analytics Workbench — JavaScript ↔ Python Data Bridge
// Serialization, temp-file communication, stdout/stdin parsing

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface GeoJSONFeatureCollection {
  readonly type: "FeatureCollection";
  readonly features: readonly GeoJSONFeature[];
}

export interface GeoJSONFeature {
  readonly type: "Feature";
  readonly geometry: GeoJSONGeometry;
  readonly properties: Record<string, unknown>;
  readonly id?: string | number | undefined;
}

export type GeoJSONGeometry =
  | { readonly type: "Point"; readonly coordinates: readonly number[] }
  | { readonly type: "MultiPoint"; readonly coordinates: readonly (readonly number[])[] }
  | { readonly type: "LineString"; readonly coordinates: readonly (readonly number[])[] }
  | { readonly type: "MultiLineString"; readonly coordinates: readonly (readonly (readonly number[])[])[] }
  | { readonly type: "Polygon"; readonly coordinates: readonly (readonly (readonly number[])[])[] }
  | { readonly type: "MultiPolygon"; readonly coordinates: readonly (readonly (readonly (readonly number[])[])[])[] };

export interface BridgeMessage {
  readonly id: string;
  readonly type: "data" | "geojson" | "result" | "error";
  readonly payload: unknown;
  readonly timestamp: number;
}

export interface PythonOutput {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly data: unknown | null;
}

/* ------------------------------------------------------------------ */
/*  Serialization: JS → Python                                        */
/* ------------------------------------------------------------------ */

/** Serialize a plain JS object to a JSON string for Python consumption. */
export function serializeForPython(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Wrap a GeoJSON FeatureCollection into a bridge message envelope.
 * Python can read the `payload` field directly.
 */
export function wrapGeoJSON(fc: GeoJSONFeatureCollection): BridgeMessage {
  return {
    id: crypto.randomUUID(),
    type: "geojson",
    payload: fc,
    timestamp: Date.now(),
  };
}

/**
 * Wrap an arbitrary data object into a bridge message.
 */
export function wrapData(data: unknown): BridgeMessage {
  return {
    id: crypto.randomUUID(),
    type: "data",
    payload: data,
    timestamp: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/*  Deserialization: Python → JS                                      */
/* ------------------------------------------------------------------ */

/** Parse a JSON string coming from Python stdout. Returns the parsed value. */
export function parseJSONOutput(raw: string): unknown {
  // Python often prints logs before the JSON; find the first { or [
  const trimmed = raw.trim();
  const jsonStart = trimmed.search(/[\[{]/);
  if (jsonStart < 0) {
    throw new Error("No JSON object found in Python output");
  }
  return JSON.parse(trimmed.slice(jsonStart));
}

/** Parse Python output specifically as GeoJSON FeatureCollection. */
export function parseGeoJSONOutput(raw: string): GeoJSONFeatureCollection {
  const parsed = parseJSONOutput(raw);
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "type" in parsed &&
    (parsed as Record<string, unknown>).type === "FeatureCollection"
  ) {
    return parsed as GeoJSONFeatureCollection;
  }
  throw new Error("Parsed output is not a GeoJSON FeatureCollection");
}

/** Parse a BridgeMessage envelope from Python output. */
export function parseBridgeMessage(raw: string): BridgeMessage {
  const parsed = parseJSONOutput(raw);
  const msg = parsed as Record<string, unknown>;
  if (typeof msg.id !== "string" || typeof msg.type !== "string") {
    throw new Error("Invalid bridge message format");
  }
  return parsed as BridgeMessage;
}

/* ------------------------------------------------------------------ */
/*  Temp-file based communication                                     */
/* ------------------------------------------------------------------ */

/**
 * Generate a Python preamble that reads bridge data from a temp file path.
 * Usage: prepend this to a script; the script receives `bridge_data` variable.
 */
export function pythonReadPreamble(tempFilePath: string): string {
  return [
    "import json, pathlib",
    `_bridge_path = pathlib.Path(r"${tempFilePath}")`,
    "_bridge_raw = _bridge_path.read_text(encoding='utf-8')",
    "bridge_data = json.loads(_bridge_raw)",
    "",
  ].join("\n");
}

/**
 * Generate a Python postamble that writes result data to a temp file.
 * The script should assign its output to `bridge_result`.
 */
export function pythonWritePostamble(tempFilePath: string): string {
  return [
    "",
    "import json, pathlib",
    `_out_path = pathlib.Path(r"${tempFilePath}")`,
    "_out_path.write_text(json.dumps(bridge_result, default=str), encoding='utf-8')",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/*  Stdout/Stdin bridge helpers                                       */
/* ------------------------------------------------------------------ */

/**
 * Build a full Python command that reads JSON from stdin and writes to stdout.
 * Suitable for piping: echo <json> | python -c "<script>"
 */
export function buildStdinScript(analysisCode: string): string {
  return [
    "import sys, json",
    "bridge_data = json.load(sys.stdin)",
    "",
    analysisCode,
    "",
    "print(json.dumps(bridge_result, default=str))",
  ].join("\n");
}

/**
 * Parse the full output of a Python process (stdout + stderr + exit code).
 */
export function parsePythonOutput(stdout: string, stderr: string, exitCode: number): PythonOutput {
  let data: unknown | null = null;
  if (exitCode === 0 && stdout.trim().length > 0) {
    try {
      data = parseJSONOutput(stdout);
    } catch {
      // Non-JSON stdout is fine — just informational output
    }
  }
  return { stdout, stderr, exitCode, data };
}

/* ------------------------------------------------------------------ */
/*  Convenience: create a bridge session                              */
/* ------------------------------------------------------------------ */

/**
 * Create a unique temp file path name for bridge communication.
 * Returns a filename (the caller is responsible for the actual I/O).
 */
export function bridgeTempPath(prefix = "ua_bridge"): string {
  const id = crypto.randomUUID().slice(0, 8);
  return `${prefix}_${id}.json`;
}

/**
 * Encode data to a Blob suitable for writing to the file system (or download).
 */
export function encodeForFile(data: unknown): Blob {
  const json = JSON.stringify(data, null, 2);
  return new Blob([json], { type: "application/json" });
}
