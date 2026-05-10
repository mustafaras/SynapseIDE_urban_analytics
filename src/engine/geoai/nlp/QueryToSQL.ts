/**
 * Natural Language → Spatial SQL  (DuckDB-compatible, read-only)
 *
 * Converts analyst-oriented natural language queries into safe,
 * inspectable SQL for spatial analysis workflows.
 *
 * Architecture:
 *   1. **Tokenize & normalise** — lowercase, strip filler words
 *   2. **Intent classify** — rule-based pattern matching against intent taxonomy
 *   3. **Entity extract** — regex-driven extraction of layers, attributes,
 *      distances, thresholds, aggregation functions, limits, spatial relations
 *   4. **SQL generate** — template-based SQL assembly per intent
 *   5. **Sandbox validate** — reject mutating SQL, enforce whitelist, cap LIMIT
 *
 * The design is deliberately deterministic (no external LLM call) so that
 * results are reproducible and auditable.  A future prompt can layer an
 * LLM rewrite on top while keeping this module as the safety gate.
 */

import {
  DEFAULT_SANDBOX,
  type GeneratedSQL,
  type InterpretationDetail,
  type ParseResult,
  type QueryIntent,
  type SandboxConfig,
  type SpatialEntity,
} from './types';

/* ═══════════════════════════════════════════════════════
   §1  CONSTANTS
   ═══════════════════════════════════════════════════════ */

/** Tokens that carry no analytical meaning */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we',
  'you', 'your', 'he', 'she', 'they', 'them', 'and', 'or', 'but', 'if',
  'not', 'no', 'so', 'than', 'too', 'very', 'just', 'about', 'also',
  'all', 'each', 'every', 'any', 'what', 'which', 'who', 'whom',
  'how', 'please', 'show', 'give', 'tell', 'find', 'get', 'list',
  'display', 'retrieve', 'query', 'search', 'look', 'want', 'need',
]);

/** SQL keywords / statements that signal mutation */
const MUTATING_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE|EXEC|EXECUTE|CALL|ATTACH|DETACH|COPY|EXPORT|IMPORT|LOAD|PRAGMA)\b/i;

/**
 * Tighter pattern for raw natural language input.
 * Avoids false positives on common English verbs like "create" (e.g. "create a buffer").
 * Only catches unambiguous SQL mutation signals.
 */
const RAW_INPUT_MUTATION = /\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+(?:FROM|ALL)|DROP\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE|MERGE\s+INTO|GRANT\s+\w|REVOKE\s+\w|EXEC(?:UTE)?\s+\w)\b/i;

/** Unambiguous mutating keywords safe to check even against NL input */
const RAW_INPUT_KEYWORDS = /\b(INSERT|DELETE|DROP|ALTER|TRUNCATE|MERGE|GRANT|REVOKE)\b/i;

/** Comment patterns */
const SQL_COMMENTS = /(--|\/\*|\*\/|#)/;
/** UNION-based injection and bypass patterns */
const UNION_INJECTION = /\bUNION\b\s+(ALL\s+)?\bSELECT\b/i;

/** Hex / char encoding bypass attempts */
const HEX_BYPASS = /(0x[0-9a-f]{2,}|CHAR\s*\(|CHR\s*\(|CONCAT\s*\()/i;

/** System table / information schema probing */
const SYSTEM_PROBE = /\b(information_schema|pg_catalog|sqlite_master|duckdb_tables|duckdb_columns|sys\.|sysobjects)\b/i;
/** Common urban-planning layer names and their normalised equivalents */
const LAYER_ALIASES: Record<string, string> = {
  'parcel': 'parcels', 'parcels': 'parcels',
  'building': 'buildings', 'buildings': 'buildings',
  'road': 'roads', 'roads': 'roads',
  'street': 'roads', 'streets': 'roads',
  'school': 'schools', 'schools': 'schools',
  'hospital': 'hospitals', 'hospitals': 'hospitals',
  'park': 'parks', 'parks': 'parks',
  'green space': 'parks', 'green spaces': 'parks',
  'transit': 'transit_stops', 'transit stop': 'transit_stops', 'transit stops': 'transit_stops',
  'bus stop': 'transit_stops', 'bus stops': 'transit_stops',
  'station': 'transit_stops', 'stations': 'transit_stops',
  'neighborhood': 'neighborhoods', 'neighborhoods': 'neighborhoods',
  'neighbourhood': 'neighborhoods', 'neighbourhoods': 'neighborhoods',
  'district': 'districts', 'districts': 'districts',
  'zone': 'zones', 'zones': 'zones',
  'zoning': 'zones',
  'census tract': 'census_tracts', 'census tracts': 'census_tracts',
  'block': 'blocks', 'blocks': 'blocks',
  'poi': 'pois', 'pois': 'pois',
  'point of interest': 'pois', 'points of interest': 'pois',
  'land use': 'land_use', 'land_use': 'land_use', 'landuse': 'land_use',
  'flood zone': 'flood_zones', 'flood zones': 'flood_zones',
  'fire station': 'fire_stations', 'fire stations': 'fire_stations',
  'police station': 'police_stations', 'police stations': 'police_stations',
  'tree': 'trees', 'trees': 'trees',
  'service area': 'service_areas', 'service areas': 'service_areas',
  'facility': 'facilities', 'facilities': 'facilities',
  'boundary': 'boundaries', 'boundaries': 'boundaries',
};

/** Common urban attributes */
const ATTRIBUTE_ALIASES: Record<string, string> = {
  'population': 'population', 'pop': 'population',
  'density': 'density', 'pop density': 'population_density',
  'population density': 'population_density',
  'area': 'area', 'size': 'area',
  'height': 'height', 'building height': 'height',
  'floor area ratio': 'far', 'far': 'far',
  'land value': 'land_value', 'value': 'land_value',
  'price': 'price',
  'income': 'median_income', 'median income': 'median_income',
  'risk': 'risk_score', 'risk score': 'risk_score',
  'vulnerability': 'vulnerability_score',
  'walkability': 'walkability_score', 'walk score': 'walkability_score',
  'tree canopy': 'tree_canopy_pct', 'canopy': 'tree_canopy_pct',
  'impervious': 'impervious_pct', 'impervious surface': 'impervious_pct',
  'elevation': 'elevation',
  'slope': 'slope',
  'capacity': 'capacity',
  'enrollment': 'enrollment',
  'crime rate': 'crime_rate', 'crime': 'crime_rate',
  'noise': 'noise_level', 'noise level': 'noise_level',
  'air quality': 'air_quality_index', 'aqi': 'air_quality_index',
  'ndvi': 'ndvi', 'greenness': 'ndvi',
  'type': 'type', 'category': 'category', 'class': 'class',
  'name': 'name', 'id': 'id',
};

/** Aggregation function synonyms */
const AGG_ALIASES: Record<string, string> = {
  'average': 'AVG', 'avg': 'AVG', 'mean': 'AVG',
  'sum': 'SUM', 'total': 'SUM',
  'count': 'COUNT', 'number of': 'COUNT', 'how many': 'COUNT',
  'maximum': 'MAX', 'max': 'MAX', 'highest': 'MAX',
  'minimum': 'MIN', 'min': 'MIN', 'lowest': 'MIN',
  'median': 'MEDIAN',
  'standard deviation': 'STDDEV', 'std': 'STDDEV', 'stddev': 'STDDEV',
};

/** Spatial relation patterns */
const SPATIAL_RELATIONS: Record<string, string> = {
  'within': 'ST_Within',
  'inside': 'ST_Within',
  'contains': 'ST_Contains',
  'intersects': 'ST_Intersects',
  'intersect': 'ST_Intersects',
  'crosses': 'ST_Crosses',
  'overlaps': 'ST_Overlaps',
  'touches': 'ST_Touches',
  'near': 'ST_DWithin',
  'nearby': 'ST_DWithin',
  'close to': 'ST_DWithin',
  'adjacent': 'ST_Touches',
};

/* ═══════════════════════════════════════════════════════
   §2  TOKENIZATION & NORMALISATION
   ═══════════════════════════════════════════════════════ */

/**
 * Normalise user input: lowercase, collapse whitespace, strip punctuation
 * that does not carry analytical meaning.
 */
export function normalise(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\u2018\u2019\u0060]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\w\s.'"<>=!%*/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split normalised text into tokens, removing stop words. */
export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(t => t.length > 0 && !STOP_WORDS.has(t));
}

/* ═══════════════════════════════════════════════════════
   §3  ENTITY EXTRACTION
   ═══════════════════════════════════════════════════════ */

/** Distance pattern: 500m, 1.5 km, 200 meters, 2 miles */
const DISTANCE_RE = /(\d+(?:\.\d+)?)\s*(m|meters?|metres?|km|kilometers?|kilometres?|mi|miles?|ft|feet)\b/gi;

/** Threshold pattern: > 50, >= 0.8, < 100, <= 30%, = 5 */
const THRESHOLD_RE = /([<>]=?|=)\s*(\d+(?:\.\d+)?)\s*(%?)/g;

/** Numeric limit: "top 10", "first 5", "limit 20" */
const LIMIT_RE = /\b(?:top|first|limit)\s+(\d+)\b/i;

/** Extract all entities from normalised text. */
export function extractEntities(text: string): SpatialEntity[] {
  const entities: SpatialEntity[] = [];
  const normalised = text.toLowerCase();

  // ── distances ──
  let m: RegExpExecArray | null;
  const distRe = new RegExp(DISTANCE_RE.source, DISTANCE_RE.flags);
  while ((m = distRe.exec(normalised)) !== null) {
    const rawVal = parseFloat(m[1]);
    const rawUnit = m[2].replace(/s$/, '').replace(/eter$/, '').replace(/etre$/, '').replace(/ilometer$/, '').replace(/ilometre$/, '');
    let metres = rawVal;
    let unit = 'm';
    if (rawUnit === 'km' || rawUnit.startsWith('kilom')) { metres = rawVal * 1000; unit = 'km'; }
    else if (rawUnit === 'mi' || rawUnit.startsWith('mile')) { metres = rawVal * 1609.344; unit = 'mi'; }
    else if (rawUnit === 'ft' || rawUnit === 'feet') { metres = rawVal * 0.3048; unit = 'ft'; }
    entities.push({ text: m[0], type: 'distance', numericValue: metres, unit });
  }

  // ── thresholds ──
  const threshRe = new RegExp(THRESHOLD_RE.source, THRESHOLD_RE.flags);
  while ((m = threshRe.exec(normalised)) !== null) {
    entities.push({ text: m[0], type: 'threshold', numericValue: parseFloat(m[2]) });
  }

  // ── limits ──
  const limMatch = LIMIT_RE.exec(normalised);
  if (limMatch) {
    entities.push({ text: limMatch[0], type: 'limit', numericValue: parseInt(limMatch[1], 10) });
  }

  // ── layers (multi-word first, then single-word) ──
  const sortedAliases = Object.keys(LAYER_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    const idx = normalised.indexOf(alias);
    if (idx !== -1) {
      // Avoid double-matching substrings
      const already = entities.some(
        e => e.type === 'layer' && e.text === LAYER_ALIASES[alias],
      );
      if (!already) {
        entities.push({ text: LAYER_ALIASES[alias], type: 'layer' });
      }
    }
  }

  // ── aggregation functions ──
  for (const [phrase, fn] of Object.entries(AGG_ALIASES)) {
    if (normalised.includes(phrase)) {
      if (!entities.some(e => e.type === 'aggregation_fn' && e.text === fn)) {
        entities.push({ text: fn, type: 'aggregation_fn' });
      }
    }
  }

  // ── spatial relations ──
  for (const [phrase, fn] of Object.entries(SPATIAL_RELATIONS)) {
    if (normalised.includes(phrase)) {
      if (!entities.some(e => e.type === 'spatial_relation' && e.text === fn)) {
        entities.push({ text: fn, type: 'spatial_relation' });
      }
    }
  }

  // ── attributes (multi-word first) ──
  const sortedAttrs = Object.keys(ATTRIBUTE_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAttrs) {
    if (normalised.includes(alias)) {
      const mapped = ATTRIBUTE_ALIASES[alias];
      if (!entities.some(e => e.type === 'attribute' && e.text === mapped)) {
        entities.push({ text: mapped, type: 'attribute' });
      }
    }
  }

  return entities;
}

/* ═══════════════════════════════════════════════════════
   §4  INTENT CLASSIFICATION
   ═══════════════════════════════════════════════════════ */

interface IntentScore { intent: QueryIntent; score: number }

const INTENT_PATTERNS: { intent: QueryIntent; patterns: RegExp[]; weight: number }[] = [
  {
    intent: 'proximity',
    patterns: [
      /\b(near|nearby|close to|distance|radius)\b/i,
      /\b\d+\s*(m|km|meters?|kilometres?|kilometers?|miles?|feet|ft)\b/i,
    ],
    weight: 2,
  },
  {
    intent: 'accessibility',
    patterns: [
      /\b(access|accessible|reach|reachable|service area|catchment|travel time|isochrone|commute)\b/i,
      /\b(walk|drive)\b.*\b(to|access|reach)\b/i,
      /\bwithin\s+\d+\s*(min|minute|minutes|hour|hours)\b/i,
    ],
    weight: 3,
  },
  {
    intent: 'aggregation',
    patterns: [
      /\b(average|avg|mean|sum|total|count|number of|how many|per|group by|grouped|aggregate)\b/i,
      /\bper\s+(neighborhood|neighbourhood|district|zone|block|census)\b/i,
    ],
    weight: 2,
  },
  {
    intent: 'filter',
    patterns: [
      /\b(where|filter|greater than|less than|more than|above|below|exceed|threshold)\b/i,
      /[<>]=?\s*\d/,
    ],
    weight: 1.5,
  },
  {
    intent: 'hotspot',
    patterns: [
      /\b(hotspot|hot spot|cold spot|high risk|high density|cluster|concentrated|concentration)\b/i,
      /\b(crime|flood|heat|fire|vulnerable|deprived)\b.*\b(area|zone|region|spot)\b/i,
    ],
    weight: 2,
  },
  {
    intent: 'ranking',
    patterns: [
      /\b(top|bottom|rank|ranking|highest|lowest|most|least|first|last)\s+\d*/i,
      /\border\s+by\b/i,
    ],
    weight: 2,
  },
  {
    intent: 'spatial_join',
    patterns: [
      /\b(join|overlay|intersection|intersect|combine|merge|spatial join)\b/i,
    ],
    weight: 1.5,
  },
  {
    intent: 'buffer',
    patterns: [
      /\b(buffer|buffer zone|buffered)\b/i,
    ],
    weight: 4,
  },
  {
    intent: 'containment',
    patterns: [
      /\b(inside|contained|enclosed)\b/i,
      /\b(within|inside)\b(?!.*\b\d+\s*(m|km|meter|metre|mile|ft))\b/i,
    ],
    weight: 2.5,
  },
];

/** Classify intent from normalised text. Returns best intent + confidence. */
export function classifyIntent(text: string): { intent: QueryIntent; confidence: number } {
  const scores: IntentScore[] = INTENT_PATTERNS.map(({ intent, patterns, weight }) => {
    let hits = 0;
    for (const p of patterns) {
      if (p.test(text)) hits++;
    }
    return { intent, score: hits * weight };
  });

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const totalPossible = INTENT_PATTERNS.reduce(
    (acc, { patterns, weight }) => acc + patterns.length * weight,
    0,
  );

  if (best.score === 0) {
    return { intent: 'unknown', confidence: 0 };
  }

  // Confidence = best score vs second-best, normalised
  const second = scores[1]?.score ?? 0;
  const spread = best.score - second;
  const confidence = Math.min(1, 0.4 + spread / totalPossible * 8);

  return { intent: best.intent, confidence: Math.round(confidence * 100) / 100 };
}

/* ═══════════════════════════════════════════════════════
   §5  SQL GENERATION
   ═══════════════════════════════════════════════════════ */

function entityOfType(entities: SpatialEntity[], type: SpatialEntity['type']): SpatialEntity | undefined {
  return entities.find(e => e.type === type);
}

function allOfType(entities: SpatialEntity[], type: SpatialEntity['type']): SpatialEntity[] {
  return entities.filter(e => e.type === type);
}

function layerNames(entities: SpatialEntity[]): string[] {
  return allOfType(entities, 'layer').map(e => e.text);
}

function buildExplanation(intent: QueryIntent, entities: SpatialEntity[]): string {
  const layers = layerNames(entities);
  const dist = entityOfType(entities, 'distance');
  const attr = entityOfType(entities, 'attribute');
  const agg = entityOfType(entities, 'aggregation_fn');
  const thresh = entityOfType(entities, 'threshold');
  const limit = entityOfType(entities, 'limit');

  const parts: string[] = [];

  switch (intent) {
    case 'proximity':
      parts.push(`Find features from ${layers[0] || 'unknown layer'}`);
      if (dist) parts.push(`within ${dist.numericValue} metres`);
      if (layers[1]) parts.push(`of ${layers[1]}`);
      break;
    case 'accessibility':
      parts.push(`Evaluate accessibility`);
      if (layers[0]) parts.push(`to ${layers[0]}`);
      if (dist) parts.push(`within ${dist.numericValue} metres`);
      break;
    case 'aggregation':
      parts.push(`Compute ${agg?.text || 'aggregate'}`);
      if (attr) parts.push(`of ${attr.text}`);
      if (layers[0]) parts.push(`grouped by ${layers[0]}`);
      break;
    case 'filter':
      parts.push(`Filter ${layers[0] || 'features'}`);
      if (attr) parts.push(`where ${attr.text}`);
      if (thresh) parts.push(`${thresh.text}`);
      break;
    case 'hotspot':
      parts.push(`Identify hot-spot / high-concentration areas`);
      if (attr) parts.push(`based on ${attr.text}`);
      if (layers[0]) parts.push(`in ${layers[0]}`);
      break;
    case 'ranking':
      parts.push(`Rank ${layers[0] || 'features'}`);
      if (attr) parts.push(`by ${attr.text}`);
      if (limit) parts.push(`returning top ${limit.numericValue}`);
      break;
    case 'spatial_join':
      parts.push(`Spatial join`);
      if (layers.length >= 2) parts.push(`between ${layers[0]} and ${layers[1]}`);
      break;
    case 'buffer':
      parts.push(`Create buffer`);
      if (layers[0]) parts.push(`around ${layers[0]}`);
      if (dist) parts.push(`of ${dist.numericValue} metres`);
      break;
    case 'containment':
      parts.push(`Find features from ${layers[0] || 'unknown'}`);
      if (layers[1]) parts.push(`contained within ${layers[1]}`);
      break;
    default:
      parts.push('Could not interpret this query with high confidence');
  }

  return `${parts.join(' ')}.`;
}

/**
 * Build structured interpretation detail for UI display.
 * Shows exactly how the NL input was decomposed into intent + entities.
 */
function buildInterpretation(
  intent: QueryIntent,
  confidence: number,
  entities: SpatialEntity[],
): InterpretationDetail {
  const layers = allOfType(entities, 'layer');
  const attributes = allOfType(entities, 'attribute');
  const distances = allOfType(entities, 'distance');
  const thresholds = allOfType(entities, 'threshold');
  const aggregations = allOfType(entities, 'aggregation_fn');
  const relations = allOfType(entities, 'spatial_relation');

  return {
    classifiedIntent: intent,
    intentConfidence: confidence,
    recognisedLayers: layers.map(e => e.text),
    recognisedAttributes: attributes.map(e => e.text),
    distancesDetected: distances.map(e => ({ metres: e.numericValue!, originalUnit: e.unit! })),
    thresholdsDetected: thresholds.map(e => ({ operator: e.text.match(/^[<>=]+/)?.[0] || '>', value: e.numericValue! })),
    aggregationFunctions: aggregations.map(e => e.text),
    spatialRelations: relations.map(e => e.text),
  };
}

/** Build SQL for a proximity-type query. */
function sqlProximity(entities: SpatialEntity[], limit: number): { sql: string; fns: string[] } {
  const layers = layerNames(entities);
  const dist = entityOfType(entities, 'distance');
  const a = layers[0] || 'target_layer';
  const b = layers[1] || 'reference_layer';
  const d = dist?.numericValue ?? 500;

  const sql = [
    `SELECT a.*,`,
    `       ST_Distance(a.geometry, b.geometry) AS distance_m`,
    `FROM ${a} a, ${b} b`,
    `WHERE ST_DWithin(a.geometry, b.geometry, ${d})`,
    `ORDER BY distance_m`,
    `LIMIT ${limit};`,
  ].join('\n');

  return { sql, fns: ['ST_Distance', 'ST_DWithin'] };
}

/** Build SQL for accessibility (catchment / isochrone-style). */
function sqlAccessibility(entities: SpatialEntity[], limit: number): { sql: string; fns: string[] } {
  const layers = layerNames(entities);
  const dist = entityOfType(entities, 'distance');
  const target = layers[0] || 'service_layer';
  const source = layers[1] || 'demand_layer';
  const d = dist?.numericValue ?? 1000;

  const sql = [
    `SELECT s.*,`,
    `       MIN(ST_Distance(s.geometry, t.geometry)) AS nearest_distance_m,`,
    `       CASE WHEN MIN(ST_Distance(s.geometry, t.geometry)) <= ${d} THEN 'accessible' ELSE 'not_accessible' END AS accessibility`,
    `FROM ${source} s`,
    `LEFT JOIN ${target} t ON ST_DWithin(s.geometry, t.geometry, ${d})`,
    `GROUP BY s.id, s.geometry`,
    `LIMIT ${limit};`,
  ].join('\n');

  return { sql, fns: ['ST_Distance', 'ST_DWithin'] };
}

/** Build SQL for aggregation. */
function sqlAggregation(entities: SpatialEntity[], limit: number): { sql: string; fns: string[] } {
  const layers = layerNames(entities);
  const attr = entityOfType(entities, 'attribute');
  const agg = entityOfType(entities, 'aggregation_fn');

  const fn = agg?.text || 'COUNT';
  const col = attr?.text || '*';

  // Two layers → spatial aggregation: count/sum from layer1 grouped by layer2
  if (layers.length >= 2) {
    const countLayer = layers[0];
    const groupLayer = layers[1];
    const aggExpr = fn === 'COUNT' ? 'COUNT(*)' : `${fn}(a.${col})`;
    const sql = [
      `SELECT b.name,`,
      `       b.geometry AS geometry,`,
      `       ${aggExpr} AS result`,
      `FROM ${countLayer} a`,
      `JOIN ${groupLayer} b ON ST_Within(a.geometry, b.geometry)`,
      `GROUP BY b.name, b.geometry`,
      `ORDER BY result DESC`,
      `LIMIT ${limit};`,
    ].join('\n');
    return { sql, fns: ['ST_Within'] };
  }

  // Single layer aggregation
  const layer = layers[0] || 'neighborhoods';
  const groupCol = 'name';

  const sql = [
    `SELECT geometry,`,
    `       ${groupCol},`,
    `       ${fn}(${col === '*' && fn === 'COUNT' ? '*' : col}) AS result`,
    `FROM ${layer}`,
    `GROUP BY geometry, ${groupCol}`,
    `ORDER BY result DESC`,
    `LIMIT ${limit};`,
  ].join('\n');

  return { sql, fns: [] };
}

/** Build SQL for filter. */
function sqlFilter(entities: SpatialEntity[], limit: number): { sql: string; fns: string[] } {
  const layers = layerNames(entities);
  const attr = entityOfType(entities, 'attribute');
  const thresh = entityOfType(entities, 'threshold');

  const layer = layers[0] || 'parcels';
  const col = attr?.text || 'value';
  const op = thresh?.text?.match(/^[<>=]+/)?.[0] || '>';
  const val = thresh?.numericValue ?? 0;

  const sql = [
    `SELECT *`,
    `FROM ${layer}`,
    `WHERE ${col} ${op} ${val}`,
    `LIMIT ${limit};`,
  ].join('\n');

  return { sql, fns: [] };
}

/** Build SQL for hotspot identification. */
function sqlHotspot(entities: SpatialEntity[], limit: number): { sql: string; fns: string[] } {
  const layers = layerNames(entities);
  const attr = entityOfType(entities, 'attribute');
  const layer = layers[0] || 'analysis_layer';
  const col = attr?.text || 'risk_score';

  const sql = [
    `SELECT *,`,
    `       NTILE(10) OVER (ORDER BY ${col} DESC) AS decile`,
    `FROM ${layer}`,
    `QUALIFY decile <= 2`,
    `ORDER BY ${col} DESC`,
    `LIMIT ${limit};`,
  ].join('\n');

  return { sql, fns: ['NTILE'] };
}

/** Build SQL for ranking. */
function sqlRanking(entities: SpatialEntity[], limit: number): { sql: string; fns: string[] } {
  const layers = layerNames(entities);
  const attr = entityOfType(entities, 'attribute');
  const limitEntity = entityOfType(entities, 'limit');

  const layer = layers[0] || 'features';
  const col = attr?.text || 'value';
  const n = limitEntity?.numericValue ?? limit;

  const sql = [
    `SELECT *`,
    `FROM ${layer}`,
    `ORDER BY ${col} DESC`,
    `LIMIT ${Math.min(n, limit)};`,
  ].join('\n');

  return { sql, fns: [] };
}

/** Build SQL for spatial join. */
function sqlSpatialJoin(entities: SpatialEntity[], limit: number): { sql: string; fns: string[] } {
  const layers = layerNames(entities);
  const rel = entityOfType(entities, 'spatial_relation');

  const a = layers[0] || 'layer_a';
  const b = layers[1] || 'layer_b';
  const fn = rel?.text || 'ST_Intersects';

  const sql = [
    `SELECT a.*, b.*`,
    `FROM ${a} a`,
    `JOIN ${b} b ON ${fn}(a.geometry, b.geometry)`,
    `LIMIT ${limit};`,
  ].join('\n');

  return { sql, fns: [fn] };
}

/** Build SQL for buffer. */
function sqlBuffer(entities: SpatialEntity[], limit: number): { sql: string; fns: string[] } {
  const layers = layerNames(entities);
  const dist = entityOfType(entities, 'distance');

  const layer = layers[0] || 'features';
  const d = dist?.numericValue ?? 500;

  const sql = [
    `SELECT ST_Buffer(geometry, ${d}) AS geometry,`,
    `       * EXCLUDE (geometry, geom)`,
    `FROM ${layer}`,
    `LIMIT ${limit};`,
  ].join('\n');

  return { sql, fns: ['ST_Buffer'] };
}

/** Build SQL for containment. */
function sqlContainment(entities: SpatialEntity[], limit: number): { sql: string; fns: string[] } {
  const layers = layerNames(entities);
  const rel = entityOfType(entities, 'spatial_relation');

  const a = layers[0] || 'inner_layer';
  const b = layers[1] || 'outer_layer';
  const fn = rel?.text || 'ST_Within';

  const sql = [
    `SELECT a.*`,
    `FROM ${a} a`,
    `JOIN ${b} b ON ${fn}(a.geometry, b.geometry)`,
    `LIMIT ${limit};`,
  ].join('\n');

  return { sql, fns: [fn] };
}

/** Route intent → SQL generator. */
function generateSQLForIntent(
  intent: QueryIntent,
  entities: SpatialEntity[],
  limit: number,
): { sql: string; fns: string[] } {
  switch (intent) {
    case 'proximity':      return sqlProximity(entities, limit);
    case 'accessibility':  return sqlAccessibility(entities, limit);
    case 'aggregation':    return sqlAggregation(entities, limit);
    case 'filter':         return sqlFilter(entities, limit);
    case 'hotspot':        return sqlHotspot(entities, limit);
    case 'ranking':        return sqlRanking(entities, limit);
    case 'spatial_join':   return sqlSpatialJoin(entities, limit);
    case 'buffer':         return sqlBuffer(entities, limit);
    case 'containment':    return sqlContainment(entities, limit);
    case 'unknown':
    default:
      return {
        sql: `-- Could not generate SQL: intent unrecognised\nSELECT 1;`,
        fns: [],
      };
  }
}

/* ═══════════════════════════════════════════════════════
   §6  SANDBOX VALIDATION
   ═══════════════════════════════════════════════════════ */

/**
 * Validate SQL text against safety constraints.
 * Returns `null` if safe, or a rejection reason string.
 */
export function validateSandbox(sql: string, config: SandboxConfig): string | null {
  // Block mutating SQL
  if (MUTATING_KEYWORDS.test(sql)) {
    const match = sql.match(MUTATING_KEYWORDS);
    return `Mutating SQL statement detected: ${match?.[0]?.toUpperCase()}`;
  }

  // Block SQL comments (potential injection vector)
  if (SQL_COMMENTS.test(sql)) {
    return 'SQL comments are not permitted in generated queries';
  }

  // Block UNION-based injection
  if (UNION_INJECTION.test(sql)) {
    return 'UNION-based query composition is not permitted';
  }

  // Block hex / char encoding bypass attempts
  if (HEX_BYPASS.test(sql)) {
    return 'Encoded character expressions are not permitted';
  }

  // Block system table probing
  if (SYSTEM_PROBE.test(sql)) {
    return 'System catalog access is not permitted';
  }

  // Block semicolons mid-query (multi-statement)
  const semiCount = (sql.match(/;/g) || []).length;
  if (semiCount > 1) {
    return 'Multiple SQL statements detected';
  }

  // Block subqueries if config disallows
  if (!config.allowSubqueries) {
    // Count SELECT keywords — more than one implies subquery
    const selectCount = (sql.match(/\bSELECT\b/gi) || []).length;
    if (selectCount > 1) {
      return 'Sub-queries are not permitted in sandbox mode';
    }
  }

  // Enforce table whitelist
  if (config.allowedTables.length > 0) {
    const fromMatches = sql.match(/\bFROM\s+(\w+)/gi) || [];
    const joinMatches = sql.match(/\bJOIN\s+(\w+)/gi) || [];
    const allRefs = [...fromMatches, ...joinMatches].map(
      s => s.replace(/^(FROM|JOIN)\s+/i, '').toLowerCase(),
    );
    for (const ref of allRefs) {
      if (!config.allowedTables.includes(ref)) {
        return `Table "${ref}" is not in the allowed table list`;
      }
    }
  }

  return null; // safe
}

/* ═══════════════════════════════════════════════════════
   §7  PUBLIC API
   ═══════════════════════════════════════════════════════ */

/**
 * Parse a natural language query into structured intent + entities.
 * Does not generate SQL — call `queryToSQL` for the full pipeline.
 */
export function parseQuery(raw: string): ParseResult {
  const normalised = normalise(raw);
  const entities = extractEntities(normalised);
  const { intent, confidence } = classifyIntent(normalised);

  const warnings: string[] = [];

  if (intent === 'unknown') {
    warnings.push('Could not classify the query intent with confidence.');
  }
  if (allOfType(entities, 'layer').length === 0) {
    warnings.push('No recognisable spatial layer was detected in the query.');
  }

  const explanation = buildExplanation(intent, entities);

  return { intent, confidence, entities, explanation, warnings };
}

/**
 * Full pipeline: natural language → parsed intent → safe DuckDB SQL.
 *
 * @param raw        - The user's natural language query
 * @param sandbox    - Optional sandbox configuration for safety constraints
 * @returns          - A `GeneratedSQL` result with SQL, parse metadata, and safety status
 */
export function queryToSQL(
  raw: string,
  sandbox: Partial<SandboxConfig> = {},
): GeneratedSQL {
  const config: SandboxConfig = { ...DEFAULT_SANDBOX, ...sandbox };

  // ── Stage 1: validate raw input for injection / mutation attempts ──
  // Use the NL-safe patterns to avoid false-positives on English verbs
  // like "create" (e.g. "create a buffer") while still catching actual attacks.
  const rawHasMutation = RAW_INPUT_KEYWORDS.test(raw) || RAW_INPUT_MUTATION.test(raw);
  const rawHasComments = SQL_COMMENTS.test(raw);
  const rawHasUnion = UNION_INJECTION.test(raw);
  const rawHasHex = HEX_BYPASS.test(raw);
  const rawHasSystemProbe = SYSTEM_PROBE.test(raw);

  const rawUnsafe = rawHasMutation || rawHasComments || rawHasUnion || rawHasHex || rawHasSystemProbe;

  if (rawUnsafe) {
    let reason = 'Unsafe input detected';
    if (rawHasMutation) reason = `Unsafe input rejected: Mutating SQL statement detected in input`;
    else if (rawHasComments) reason = `Unsafe input rejected: SQL comments are not permitted`;
    else if (rawHasUnion) reason = `Unsafe input rejected: UNION-based query composition is not permitted`;
    else if (rawHasHex) reason = `Unsafe input rejected: Encoded character expressions are not permitted`;
    else if (rawHasSystemProbe) reason = `Unsafe input rejected: System catalog access is not permitted`;

    const parse = parseQuery(raw);
    return {
      sql: '',
      parse,
      safe: false,
      rejectionReason: reason,
      referencedLayers: layerNames(parse.entities),
      spatialFunctions: [],
      interpretation: buildInterpretation(parse.intent, parse.confidence, parse.entities),
    };
  }

  // ── Stage 2: parse ──
  const parse = parseQuery(raw);

  // Determine effective limit
  const limitEntity = entityOfType(parse.entities, 'limit');
  const effectiveLimit = Math.min(
    limitEntity?.numericValue ?? config.maxResultLimit,
    config.maxResultLimit,
  );

  // ── Stage 3: generate SQL ──
  const { sql, fns } = generateSQLForIntent(parse.intent, parse.entities, effectiveLimit);

  // ── Stage 4: validate generated SQL (defence in depth) ──
  const sqlRejection = validateSandbox(sql, config);

  return {
    sql,
    parse,
    safe: sqlRejection === null,
    referencedLayers: layerNames(parse.entities),
    spatialFunctions: fns,
    interpretation: buildInterpretation(parse.intent, parse.confidence, parse.entities),
    ...(sqlRejection ? { rejectionReason: sqlRejection } : {}),
  };
}

/**
 * Convenience: validate an arbitrary SQL string against sandbox rules.
 * Useful for checking externally supplied queries before execution.
 */
export function isSafeSQL(sql: string, sandbox: Partial<SandboxConfig> = {}): { safe: boolean; reason?: string } {
  const config: SandboxConfig = { ...DEFAULT_SANDBOX, ...sandbox };
  const reason = validateSandbox(sql, config);
  return reason ? { safe: false, reason } : { safe: true };
}
