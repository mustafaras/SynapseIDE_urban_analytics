/**
 * Natural Language → Spatial SQL — Golden Test Suite
 *
 * 35 golden test pairs covering all intent categories, entity extraction,
 * safety validation, and edge cases.  Each test validates the full pipeline:
 *   NL input → parse → SQL generation → sandbox check.
 */

import { describe, expect, it } from 'vitest';
import {
  classifyIntent,
  extractEntities,
  isSafeSQL,
  normalise,
  parseQuery,
  queryToSQL,
  tokenize,
  validateSandbox,
} from '../QueryToSQL';
import { DEFAULT_SANDBOX, type GoldenTestPair, type SandboxConfig } from '../types';

/* ═══════════════════════════════════════════════════════
   §1  GOLDEN TEST PAIRS (35 pairs)
   ═══════════════════════════════════════════════════════ */

const GOLDEN_PAIRS: GoldenTestPair[] = [
  // ── Proximity (5) ──
  {
    label: 'Buildings within 500m of parks',
    input: 'Show buildings within 500 meters of parks',
    expectedIntent: 'proximity',
    expectSafe: true,
    sqlContains: ['ST_DWithin', 'buildings', 'parks', '500'],
    expectedEntityTypes: ['layer', 'distance'],
  },
  {
    label: 'Schools near transit stops',
    input: 'Find schools near transit stops within 1 km',
    expectedIntent: 'proximity',
    expectSafe: true,
    sqlContains: ['ST_DWithin', 'schools', 'transit_stops', '1000'],
    expectedEntityTypes: ['layer', 'distance'],
  },
  {
    label: 'Parcels close to hospitals',
    input: 'List parcels close to hospitals within 800m',
    expectedIntent: 'proximity',
    expectSafe: true,
    sqlContains: ['ST_DWithin', 'parcels', 'hospitals', '800'],
  },
  {
    label: 'POIs within 2 miles of park',
    input: 'Points of interest within 2 miles of parks',
    expectedIntent: 'proximity',
    expectSafe: true,
    sqlContains: ['ST_DWithin', 'pois', 'parks'],
    expectedEntityTypes: ['layer', 'distance'],
  },
  {
    label: 'Trees near roads',
    input: 'Show trees nearby roads within 50 meters',
    expectedIntent: 'proximity',
    expectSafe: true,
    sqlContains: ['ST_DWithin', 'trees', 'roads', '50'],
  },

  // ── Accessibility (4) ──
  {
    label: 'Areas accessible to schools within 1km',
    input: 'Which areas can reach schools within 1 km',
    expectedIntent: 'accessibility',
    expectSafe: true,
    sqlContains: ['schools', '1000'],
  },
  {
    label: 'Service area accessibility for hospitals',
    input: 'Calculate service area accessibility for hospitals within 2 km',
    expectedIntent: 'accessibility',
    expectSafe: true,
    sqlContains: ['accessible', 'hospitals', '2000'],
  },
  {
    label: 'Walk access to transit',
    input: 'Show walk access to transit stops within 500 meters',
    expectedIntent: 'accessibility',
    expectSafe: true,
    sqlContains: ['transit_stops', '500'],
  },
  {
    label: 'Catchment of fire stations',
    input: 'Determine the catchment of fire stations within 3 km',
    expectedIntent: 'accessibility',
    expectSafe: true,
    sqlContains: ['fire_stations', '3000'],
  },

  // ── Aggregation (4) ──
  {
    label: 'Average population per neighborhood',
    input: 'Average population per neighborhood',
    expectedIntent: 'aggregation',
    expectSafe: true,
    sqlContains: ['AVG', 'population', 'neighborhoods', 'GROUP BY'],
  },
  {
    label: 'Count buildings per district',
    input: 'How many buildings per district',
    expectedIntent: 'aggregation',
    expectSafe: true,
    sqlContains: ['COUNT', 'buildings', 'districts', 'GROUP BY'],
  },
  {
    label: 'Sum of area per zone',
    input: 'Total area per zone',
    expectedIntent: 'aggregation',
    expectSafe: true,
    sqlContains: ['SUM', 'area', 'zones'],
  },
  {
    label: 'Max height per neighborhood',
    input: 'Maximum building height per neighbourhood',
    expectedIntent: 'aggregation',
    expectSafe: true,
    sqlContains: ['MAX', 'height', 'neighborhoods'],
  },

  // ── Filter (4) ──
  {
    label: 'Parcels with density > 50',
    input: 'Show parcels where density > 50',
    expectedIntent: 'filter',
    expectSafe: true,
    sqlContains: ['parcels', 'density', '> 50'],
  },
  {
    label: 'Buildings with height >= 30',
    input: 'Filter buildings with height >= 30',
    expectedIntent: 'filter',
    expectSafe: true,
    sqlContains: ['buildings', 'height', '>= 30'],
  },
  {
    label: 'Zones with risk above threshold',
    input: 'Zones where risk score > 0.8',
    expectedIntent: 'filter',
    expectSafe: true,
    sqlContains: ['zones', 'risk_score', '> 0.8'],
  },
  {
    label: 'Low income areas',
    input: 'Find neighborhoods where median income < 30000',
    expectedIntent: 'filter',
    expectSafe: true,
    sqlContains: ['neighborhoods', 'median_income', '< 30000'],
  },

  // ── Hotspot (3) ──
  {
    label: 'Crime hotspot areas',
    input: 'Show crime hotspot areas in neighborhoods',
    expectedIntent: 'hotspot',
    expectSafe: true,
    sqlContains: ['crime_rate', 'neighborhoods', 'NTILE'],
  },
  {
    label: 'High risk flood zones',
    input: 'Identify high risk flood zones',
    expectedIntent: 'hotspot',
    expectSafe: true,
    sqlContains: ['NTILE', 'flood_zones'],
  },
  {
    label: 'Concentrated vulnerability',
    input: 'Find areas of concentrated vulnerability in census tracts',
    expectedIntent: 'hotspot',
    expectSafe: true,
    sqlContains: ['vulnerability_score', 'census_tracts'],
  },

  // ── Ranking (3) ──
  {
    label: 'Top 10 buildings by height',
    input: 'Top 10 buildings by height',
    expectedIntent: 'ranking',
    expectSafe: true,
    sqlContains: ['buildings', 'height', 'ORDER BY', 'LIMIT 10'],
  },
  {
    label: 'Top 5 neighborhoods by population',
    input: 'Show first 5 neighborhoods ranked by population',
    expectedIntent: 'ranking',
    expectSafe: true,
    sqlContains: ['neighborhoods', 'population', 'ORDER BY', 'LIMIT 5'],
  },
  {
    label: 'Highest density parcels',
    input: 'Top 20 parcels with highest density',
    expectedIntent: 'ranking',
    expectSafe: true,
    sqlContains: ['parcels', 'density', 'LIMIT 20'],
  },

  // ── Spatial Join (2) ──
  {
    label: 'Buildings intersecting flood zones',
    input: 'Join buildings that intersect flood zones',
    expectedIntent: 'spatial_join',
    expectSafe: true,
    sqlContains: ['buildings', 'flood_zones', 'ST_Intersects'],
  },
  {
    label: 'Parks overlapping districts',
    input: 'Overlay parks and districts',
    expectedIntent: 'spatial_join',
    expectSafe: true,
    sqlContains: ['parks', 'districts'],
  },

  // ── Buffer (2) ──
  {
    label: 'Buffer around schools',
    input: 'Create a buffer of 1 km around schools',
    expectedIntent: 'buffer',
    expectSafe: true,
    sqlContains: ['ST_Buffer', 'schools', '1000'],
  },
  {
    label: 'Buffer surrounding roads',
    input: 'Create buffer zone of 200 meters around roads',
    expectedIntent: 'buffer',
    expectSafe: true,
    sqlContains: ['ST_Buffer', 'roads', '200'],
  },

  // ── Containment (2) ──
  {
    label: 'Buildings inside neighborhoods',
    input: 'Find buildings inside neighborhoods',
    expectedIntent: 'containment',
    expectSafe: true,
    sqlContains: ['buildings', 'neighborhoods', 'ST_Within'],
  },
  {
    label: 'Parks within district boundaries',
    input: 'Show parks contained within districts',
    expectedIntent: 'containment',
    expectSafe: true,
    sqlContains: ['parks', 'districts', 'ST_Within'],
  },

  // ── Safety / rejection (6) ──
  {
    label: 'Reject DROP TABLE',
    input: 'DROP TABLE buildings',
    expectedIntent: 'unknown',
    expectSafe: false,
  },
  {
    label: 'Reject DELETE',
    input: 'Delete all records from parcels where area < 10',
    expectedIntent: 'filter',
    expectSafe: false,
  },
  {
    label: 'Reject INSERT',
    input: 'Insert new building into buildings table',
    expectedIntent: 'unknown',
    expectSafe: false,
  },
  {
    label: 'Reject UPDATE',
    input: 'Update parcels set value = 0',
    expectedIntent: 'unknown',
    expectSafe: false,
  },
  {
    label: 'Reject ALTER',
    input: 'ALTER TABLE zones ADD COLUMN new_col INTEGER',
    expectedIntent: 'unknown',
    expectSafe: false,
  },
  {
    label: 'Reject TRUNCATE',
    input: 'TRUNCATE TABLE buildings',
    expectedIntent: 'unknown',
    expectSafe: false,
  },
];

/* ═══════════════════════════════════════════════════════
   §2  NORMALISATION & TOKENISATION
   ═══════════════════════════════════════════════════════ */

describe('normalise', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalise('  Show  BUILDINGS   near   PARKS  ')).toBe('show buildings near parks');
  });

  it('normalises smart quotes', () => {
    expect(normalise('\u201Cbuildings\u201D')).toBe('"buildings"');
  });
});

describe('tokenize', () => {
  it('removes stop words', () => {
    const tokens = tokenize('show the buildings near the parks');
    expect(tokens).not.toContain('the');
    expect(tokens).toContain('buildings');
    expect(tokens).toContain('near');
    expect(tokens).toContain('parks');
  });
});

/* ═══════════════════════════════════════════════════════
   §3  ENTITY EXTRACTION
   ═══════════════════════════════════════════════════════ */

describe('extractEntities', () => {
  it('extracts distance in metres', () => {
    const entities = extractEntities('within 500 meters of parks');
    const dist = entities.find(e => e.type === 'distance');
    expect(dist).toBeDefined();
    expect(dist!.numericValue).toBe(500);
    expect(dist!.unit).toBe('m');
  });

  it('converts km to metres', () => {
    const entities = extractEntities('schools within 1.5 km');
    const dist = entities.find(e => e.type === 'distance');
    expect(dist!.numericValue).toBe(1500);
    expect(dist!.unit).toBe('km');
  });

  it('converts miles to metres', () => {
    const entities = extractEntities('within 2 miles');
    const dist = entities.find(e => e.type === 'distance');
    expect(dist!.numericValue).toBeCloseTo(3218.688, 1);
    expect(dist!.unit).toBe('mi');
  });

  it('extracts threshold operators', () => {
    const entities = extractEntities('density > 50');
    const thresh = entities.find(e => e.type === 'threshold');
    expect(thresh).toBeDefined();
    expect(thresh!.numericValue).toBe(50);
  });

  it('extracts limit from "top N"', () => {
    const entities = extractEntities('top 10 buildings');
    const lim = entities.find(e => e.type === 'limit');
    expect(lim).toBeDefined();
    expect(lim!.numericValue).toBe(10);
  });

  it('extracts layer names', () => {
    const entities = extractEntities('buildings near transit stops');
    const layers = entities.filter(e => e.type === 'layer');
    expect(layers.map(l => l.text)).toContain('buildings');
    expect(layers.map(l => l.text)).toContain('transit_stops');
  });

  it('extracts aggregation functions', () => {
    const entities = extractEntities('average population per neighborhood');
    const agg = entities.find(e => e.type === 'aggregation_fn');
    expect(agg).toBeDefined();
    expect(agg!.text).toBe('AVG');
  });

  it('extracts spatial relations', () => {
    const entities = extractEntities('buildings that intersect flood zones');
    const rel = entities.find(e => e.type === 'spatial_relation');
    expect(rel).toBeDefined();
    expect(rel!.text).toBe('ST_Intersects');
  });

  it('extracts attributes', () => {
    const entities = extractEntities('parcels where population density > 100');
    const attr = entities.find(e => e.type === 'attribute');
    expect(attr).toBeDefined();
    expect(attr!.text).toBe('population_density');
  });
});

/* ═══════════════════════════════════════════════════════
   §4  INTENT CLASSIFICATION
   ═══════════════════════════════════════════════════════ */

describe('classifyIntent', () => {
  it('classifies proximity queries', () => {
    const r = classifyIntent('buildings within 500 meters of parks');
    expect(r.intent).toBe('proximity');
    expect(r.confidence).toBeGreaterThan(0);
  });

  it('classifies accessibility queries', () => {
    const r = classifyIntent('which areas can reach schools within 1 km');
    expect(r.intent).toBe('accessibility');
  });

  it('classifies aggregation queries', () => {
    const r = classifyIntent('average population per neighborhood');
    expect(r.intent).toBe('aggregation');
  });

  it('classifies filter queries', () => {
    const r = classifyIntent('parcels where density > 50');
    expect(r.intent).toBe('filter');
  });

  it('classifies hotspot queries', () => {
    const r = classifyIntent('crime hotspot areas in neighborhoods');
    expect(r.intent).toBe('hotspot');
  });

  it('classifies ranking queries', () => {
    const r = classifyIntent('top 10 buildings by height');
    expect(r.intent).toBe('ranking');
  });

  it('returns unknown for gibberish', () => {
    const r = classifyIntent('xyzzy flurble wonk');
    expect(r.intent).toBe('unknown');
    expect(r.confidence).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════
   §5  PARSE QUERY
   ═══════════════════════════════════════════════════════ */

describe('parseQuery', () => {
  it('returns warnings when no layer detected', () => {
    const r = parseQuery('something random here with no layers');
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('provides a readable explanation', () => {
    const r = parseQuery('Show buildings within 500 meters of parks');
    expect(r.explanation).toContain('buildings');
    expect(r.explanation).toContain('500');
  });

  it('extracts entities and classifies intent together', () => {
    const r = parseQuery('Average population per neighborhood');
    expect(r.intent).toBe('aggregation');
    expect(r.entities.some(e => e.type === 'aggregation_fn')).toBe(true);
    expect(r.entities.some(e => e.type === 'layer')).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════
   §6  SANDBOX VALIDATION
   ═══════════════════════════════════════════════════════ */

describe('validateSandbox', () => {
  it('rejects mutating SQL', () => {
    expect(validateSandbox('DROP TABLE buildings;', DEFAULT_SANDBOX)).toContain('Mutating');
    expect(validateSandbox('INSERT INTO foo VALUES (1);', DEFAULT_SANDBOX)).toContain('Mutating');
    expect(validateSandbox('DELETE FROM parks;', DEFAULT_SANDBOX)).toContain('Mutating');
    expect(validateSandbox('UPDATE parcels SET x=1;', DEFAULT_SANDBOX)).toContain('Mutating');
  });

  it('rejects SQL comments', () => {
    expect(validateSandbox('SELECT * FROM foo -- evil', DEFAULT_SANDBOX)).toContain('comments');
  });

  it('rejects multiple statements', () => {
    expect(validateSandbox('SELECT 1; SELECT 2;', DEFAULT_SANDBOX)).toContain('Multiple');
  });

  it('enforces table whitelist', () => {
    const cfg: SandboxConfig = { ...DEFAULT_SANDBOX, allowedTables: ['parks'] };
    expect(validateSandbox('SELECT * FROM buildings;', cfg)).toContain('buildings');
    expect(validateSandbox('SELECT * FROM parks;', cfg)).toBeNull();
  });

  it('rejects subqueries when not allowed', () => {
    const sql = 'SELECT * FROM parks WHERE id IN (SELECT id FROM buildings);';
    expect(validateSandbox(sql, { ...DEFAULT_SANDBOX, allowSubqueries: false })).toContain('Sub-queries');
  });

  it('allows subqueries when permitted', () => {
    const sql = 'SELECT * FROM parks WHERE id IN (SELECT id FROM buildings);';
    expect(validateSandbox(sql, { ...DEFAULT_SANDBOX, allowSubqueries: true })).toBeNull();
  });

  it('passes safe read-only SQL', () => {
    expect(validateSandbox('SELECT * FROM buildings LIMIT 100;', DEFAULT_SANDBOX)).toBeNull();
  });
});

describe('isSafeSQL', () => {
  it('returns safe for read-only queries', () => {
    expect(isSafeSQL('SELECT * FROM parks LIMIT 10;').safe).toBe(true);
  });

  it('returns unsafe for mutations', () => {
    const r = isSafeSQL('DROP TABLE evil;');
    expect(r.safe).toBe(false);
    expect(r.reason).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════
   §7  GOLDEN TEST SUITE — FULL PIPELINE
   ═══════════════════════════════════════════════════════ */

describe('Golden test suite (queryToSQL)', () => {
  it(`contains at least 30 test pairs`, () => {
    expect(GOLDEN_PAIRS.length).toBeGreaterThanOrEqual(30);
  });

  for (const pair of GOLDEN_PAIRS) {
    it(pair.label, () => {
      const result = queryToSQL(pair.input);

      // Intent classification
      if (pair.expectedIntent !== 'unknown') {
        expect(result.parse.intent).toBe(pair.expectedIntent);
      }

      // Safety — now verified directly on result.safe
      // since queryToSQL validates both raw input AND generated SQL
      if (pair.expectSafe) {
        expect(result.safe).toBe(true);
      } else {
        expect(result.safe).toBe(false);
        expect(result.rejectionReason).toBeDefined();
      }

      // SQL content checks
      if (pair.sqlContains && pair.expectSafe) {
        for (const substr of pair.sqlContains) {
          expect(result.sql).toContain(substr);
        }
      }

      // Entity type checks
      if (pair.expectedEntityTypes) {
        for (const expectedType of pair.expectedEntityTypes) {
          expect(result.parse.entities.some(e => e.type === expectedType)).toBe(true);
        }
      }

      // All results should have an explanation
      expect(result.parse.explanation.length).toBeGreaterThan(0);

      // All results should include interpretation metadata
      expect(result.interpretation).toBeDefined();
      expect(result.interpretation.classifiedIntent).toBe(result.parse.intent);
    });
  }
});

/* ═══════════════════════════════════════════════════════
   §8  EDGE CASES
   ═══════════════════════════════════════════════════════ */

describe('Edge cases', () => {
  it('handles empty input gracefully', () => {
    const r = queryToSQL('');
    expect(r.parse.intent).toBe('unknown');
    expect(r.sql).toContain('SELECT');
  });

  it('respects maxResultLimit from sandbox', () => {
    const r = queryToSQL('Show buildings near parks within 500 meters', { maxResultLimit: 50 });
    expect(r.sql).toContain('50');
  });

  it('caps user-requested limit to sandbox max', () => {
    const r = queryToSQL('Top 99999 buildings by height', { maxResultLimit: 100 });
    expect(r.sql).toContain('LIMIT 100');
  });

  it('handles British spelling (neighbourhood)', () => {
    const r = queryToSQL('Average population per neighbourhood');
    expect(r.parse.entities.some(e => e.text === 'neighborhoods')).toBe(true);
  });

  it('generates layer references', () => {
    const r = queryToSQL('Buildings within 500 meters of parks');
    expect(r.referencedLayers).toContain('buildings');
    expect(r.referencedLayers).toContain('parks');
  });

  it('reports spatial functions used', () => {
    const r = queryToSQL('Buildings within 500 meters of parks');
    expect(r.spatialFunctions).toContain('ST_DWithin');
  });

  it('explanation is populated', () => {
    const r = queryToSQL('Schools near transit stops within 1 km');
    expect(r.parse.explanation).toBeTruthy();
    expect(r.parse.explanation.length).toBeGreaterThan(10);
  });
});

/* ═══════════════════════════════════════════════════════
   §9  ADVANCED SECURITY PATTERNS
   ═══════════════════════════════════════════════════════ */

describe('Advanced security patterns', () => {
  it('rejects UNION-based injection attempts', () => {
    const r = validateSandbox('SELECT * FROM parks UNION SELECT * FROM secrets;', DEFAULT_SANDBOX);
    expect(r).not.toBeNull();
  });

  it('rejects hex encoding bypass', () => {
    expect(validateSandbox('SELECT CHAR(68,82,79,80)', DEFAULT_SANDBOX)).not.toBeNull();
    expect(validateSandbox('SELECT 0x44524F50', DEFAULT_SANDBOX)).not.toBeNull();
  });

  it('rejects system catalog probing', () => {
    expect(validateSandbox('SELECT * FROM information_schema.tables;', DEFAULT_SANDBOX)).not.toBeNull();
    expect(validateSandbox('SELECT * FROM duckdb_tables();', DEFAULT_SANDBOX)).not.toBeNull();
  });

  it('queryToSQL rejects raw input with mutating keywords even if intent is safe', () => {
    // This was the critical security gap fixed: "DELETE ... where area < 10"
    // would classify as "filter" and generate safe SQL but the raw input must be caught
    const r = queryToSQL('Delete all records from parcels where area < 10');
    expect(r.safe).toBe(false);
    expect(r.rejectionReason).toContain('Unsafe input');
  });

  it('queryToSQL returns empty SQL for rejected inputs', () => {
    const r = queryToSQL('DROP TABLE buildings');
    expect(r.safe).toBe(false);
    expect(r.sql).toBe('');
  });
});

/* ═══════════════════════════════════════════════════════
   §10  INTERPRETATION METADATA
   ═══════════════════════════════════════════════════════ */

describe('Interpretation metadata', () => {
  it('includes classified intent and confidence', () => {
    const r = queryToSQL('Buildings within 500 meters of parks');
    expect(r.interpretation.classifiedIntent).toBe('proximity');
    expect(r.interpretation.intentConfidence).toBeGreaterThan(0);
  });

  it('lists recognised layers', () => {
    const r = queryToSQL('Count buildings per district');
    expect(r.interpretation.recognisedLayers).toContain('buildings');
    expect(r.interpretation.recognisedLayers).toContain('districts');
  });

  it('lists recognised attributes', () => {
    const r = queryToSQL('Parcels where density > 50');
    expect(r.interpretation.recognisedAttributes).toContain('density');
  });

  it('reports detected distances with unit', () => {
    const r = queryToSQL('Schools within 1.5 km of parks');
    expect(r.interpretation.distancesDetected.length).toBeGreaterThan(0);
    expect(r.interpretation.distancesDetected[0].metres).toBe(1500);
    expect(r.interpretation.distancesDetected[0].originalUnit).toBe('km');
  });

  it('reports detected thresholds', () => {
    const r = queryToSQL('Zones where risk score > 0.8');
    expect(r.interpretation.thresholdsDetected.length).toBeGreaterThan(0);
    expect(r.interpretation.thresholdsDetected[0].value).toBe(0.8);
  });

  it('reports aggregation functions', () => {
    const r = queryToSQL('Average population per neighborhood');
    expect(r.interpretation.aggregationFunctions).toContain('AVG');
  });

  it('reports spatial relations', () => {
    const r = queryToSQL('Buildings that intersect flood zones');
    expect(r.interpretation.spatialRelations).toContain('ST_Intersects');
  });

  it('interpretation is present even for rejected inputs', () => {
    const r = queryToSQL('DROP TABLE evil');
    expect(r.interpretation).toBeDefined();
    expect(r.interpretation.classifiedIntent).toBeDefined();
  });
});
