/**
 * GeoAI NLP — shared types for Natural Language to Spatial SQL.
 *
 * Supports intent classification, entity extraction, and safe
 * read-only SQL generation targeting DuckDB spatial workflows.
 */

/* ── Intent taxonomy ─────────────────────────────────── */

/**
 * High-level intent categories for urban planning queries.
 * Each intent drives a different SQL generation template.
 */
export type QueryIntent =
  | 'proximity'        // "within X meters of …"
  | 'accessibility'    // "areas that can reach … within …"
  | 'aggregation'      // "average / count / sum … per neighborhood"
  | 'filter'           // "parcels where … > threshold"
  | 'hotspot'          // "high-risk / high-density areas"
  | 'ranking'          // "top N … by …"
  | 'spatial_join'     // "overlay / intersection of …"
  | 'buffer'           // "create buffer around …"
  | 'containment'      // "… within / inside …"
  | 'unknown';

/* ── Extracted entities ──────────────────────────────── */

export interface SpatialEntity {
  /** Raw text span as it appeared in the query */
  text: string;
  /** Normalised entity type */
  type: 'layer' | 'attribute' | 'value' | 'distance' | 'threshold' | 'spatial_relation' | 'aggregation_fn' | 'limit';
  /** Parsed numeric value if applicable */
  numericValue?: number;
  /** Unit for distances, e.g. 'm', 'km' */
  unit?: string;
}

/* ── Parse result ────────────────────────────────────── */

export interface ParseResult {
  /** Classified query intent */
  intent: QueryIntent;
  /** Confidence score for intent classification [0-1] */
  confidence: number;
  /** Extracted entities from the natural language query */
  entities: SpatialEntity[];
  /** Human-readable explanation of how the query was interpreted */
  explanation: string;
  /** Warnings about ambiguities or assumptions made */
  warnings: string[];
}

/* ── Generated SQL result ────────────────────────────── */

export interface GeneratedSQL {
  /** The generated DuckDB-compatible SQL statement (read-only) */
  sql: string;
  /** The full parse result that drove generation */
  parse: ParseResult;
  /** Whether the query passed safety validation */
  safe: boolean;
  /** Reason for rejection if not safe */
  rejectionReason?: string;
  /** Referenced table/layer names used in the query */
  referencedLayers: string[];
  /** DuckDB spatial functions used */
  spatialFunctions: string[];
  /** Structured interpretation metadata for UI display */
  interpretation: InterpretationDetail;
}

/* ── Interpretation detail for UI ─────────────────────── */

/**
 * Structured breakdown of how the natural language request
 * was decomposed.  Designed for UI rendering so users can
 * inspect the pipeline’s interpretation transparently.
 */
export interface InterpretationDetail {
  classifiedIntent: QueryIntent;
  intentConfidence: number;
  recognisedLayers: string[];
  recognisedAttributes: string[];
  distancesDetected: Array<{ metres: number; originalUnit: string }>;
  thresholdsDetected: Array<{ operator: string; value: number }>;
  aggregationFunctions: string[];
  spatialRelations: string[];
}

/* ── Safety / sandbox ────────────────────────────────── */

export interface SandboxConfig {
  /** Allowed table / layer names (whitelist). If empty, any table is allowed. */
  allowedTables: string[];
  /** Maximum result limit to append to queries */
  maxResultLimit: number;
  /** Whether to allow sub-queries */
  allowSubqueries: boolean;
}

export const DEFAULT_SANDBOX: SandboxConfig = {
  allowedTables: [],
  maxResultLimit: 10_000,
  allowSubqueries: false,
};

/* ── Golden test pair ────────────────────────────────── */

export interface GoldenTestPair {
  /** Human description of the test case */
  label: string;
  /** Natural language input */
  input: string;
  /** Expected intent */
  expectedIntent: QueryIntent;
  /** Whether the query should be accepted (safe=true) or rejected */
  expectSafe: boolean;
  /** Optional: substring that the generated SQL must contain */
  sqlContains?: string[];
  /** Optional: entity types that must be extracted */
  expectedEntityTypes?: SpatialEntity['type'][];
}
