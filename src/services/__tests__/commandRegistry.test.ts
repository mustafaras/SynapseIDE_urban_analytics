import { afterEach, describe, expect, it } from 'vitest';
import {
  fuzzyFilter,
  getGeoFormatInfo,
  isSpatialFile,
  listCommands,
  registerCommands,
  unregisterCommands,
  type Command,
} from '../commandRegistry';

// ── helpers ──────────────────────────────────────────────────────────────────

const noop = () => {};

const cmd = (overrides: Partial<Command> & { id: string }): Command => ({
  label: overrides.id,
  run: noop,
  ...overrides,
});

// After each test, remove any commands that were registered
const registered: string[] = [];
afterEach(() => {
  unregisterCommands(registered.splice(0));
});

function reg(...cmds: Command[]) {
  registerCommands(cmds);
  registered.push(...cmds.map(c => c.id));
  return cmds;
}

// ── registerCommands / listCommands / unregisterCommands ─────────────────────

describe('commandRegistry — registration', () => {
  it('registers new commands and lists them', () => {
    reg(cmd({ id: 'test.a', label: 'Alpha' }));
    reg(cmd({ id: 'test.b', label: 'Beta' }));

    const ids = listCommands().map(c => c.id);
    expect(ids).toContain('test.a');
    expect(ids).toContain('test.b');
  });

  it('deduplicates by id (latest registration wins)', () => {
    reg(cmd({ id: 'test.x', label: 'First' }));
    reg(cmd({ id: 'test.x', label: 'Second' }));

    const matches = listCommands().filter(c => c.id === 'test.x');
    expect(matches).toHaveLength(1);
    expect(matches[0].label).toBe('Second');
  });

  it('unregisters by id', () => {
    registerCommands([cmd({ id: 'test.rm' })]);
    unregisterCommands(['test.rm']);

    expect(listCommands().find(c => c.id === 'test.rm')).toBeUndefined();
  });

  it('listCommands returns a copy so mutations do not affect the registry', () => {
    reg(cmd({ id: 'test.copy' }));
    const list = listCommands();
    list.length = 0; // mutate the returned copy
    expect(listCommands().find(c => c.id === 'test.copy')).toBeDefined();
  });
});

// ── fuzzyFilter ──────────────────────────────────────────────────────────────

describe('commandRegistry — fuzzyFilter', () => {
  const items: Command[] = [
    cmd({ id: 'f.open', label: 'Open File' }),
    cmd({ id: 'f.close', label: 'Close File' }),
    cmd({ id: 'f.new', label: 'New Terminal', keywords: ['shell', 'bash'] }),
    cmd({ id: 'f.save', label: 'Save All' }),
    cmd({ id: 'f.goto', label: 'Go to Line' }),
  ];

  it('returns all items on empty query', () => {
    expect(fuzzyFilter('', items)).toHaveLength(items.length);
    expect(fuzzyFilter('   ', items)).toHaveLength(items.length);
  });

  it('matches label prefix with highest priority', () => {
    const results = fuzzyFilter('open', items);
    expect(results[0].id).toBe('f.open'); // starts-with beats other matches
  });

  it('matches label substring', () => {
    const results = fuzzyFilter('close', items);
    expect(results.map(c => c.id)).toContain('f.close');
  });

  it('matches via keyword (lower priority than label)', () => {
    const results = fuzzyFilter('shell', items);
    const ids = results.map(c => c.id);
    expect(ids).toContain('f.new');
    // keyword match should be lower priority than any label match
    const labelMatch = items.find(c => c.label.toLowerCase().includes('shell'));
    if (!labelMatch) {
      // No label match exists; the keyword result must be first
      expect(ids[0]).toBe('f.new');
    }
  });

  it('performs fuzzy character-sequence match', () => {
    // 'sva' can match 'Save All' via s..v..a
    const results = fuzzyFilter('sva', items);
    expect(results.map(c => c.id)).toContain('f.save');
  });

  it('returns empty array when nothing matches', () => {
    expect(fuzzyFilter('xyzzy', items)).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    expect(fuzzyFilter('OPEN', items).map(c => c.id)).toContain('f.open');
    expect(fuzzyFilter('Open', items).map(c => c.id)).toContain('f.open');
  });

  it('label start-match scores higher than mid-label match', () => {
    // 'save' starts 'Save All'; 'Go to Line' does not contain 'save'
    // The start-match command should appear before non-start matches
    const results = fuzzyFilter('go', items);
    expect(results[0].id).toBe('f.goto'); // 'Go to Line' starts with 'go'
  });

  it('respects enabled=false by not filtering it out (disabled display is caller responsibility)', () => {
    const withDisabled: Command[] = [
      cmd({ id: 'f.dis', label: 'Disabled Command', enabled: false }),
      ...items,
    ];
    const results = fuzzyFilter('disabled', withDisabled);
    expect(results.map(c => c.id)).toContain('f.dis');
  });
});

// ── isSpatialFile / getGeoFormatInfo ─────────────────────────────────────────

describe('commandRegistry — isSpatialFile / getGeoFormatInfo', () => {
  it('returns true for known spatial extensions', () => {
    expect(isSpatialFile('data/layers.geojson')).toBe(true);
    expect(isSpatialFile('data/grid.tif')).toBe(true);
    expect(isSpatialFile('transit.shp')).toBe(true);
    expect(isSpatialFile('model.gpkg')).toBe(true);
    expect(isSpatialFile('cloud.las')).toBe(true);
  });

  it('returns false for non-spatial extensions', () => {
    expect(isSpatialFile('src/index.ts')).toBe(false);
    expect(isSpatialFile('data/report.pdf')).toBe(false);
    expect(isSpatialFile('README.md')).toBe(false);
  });

  it('returns false for undefined and extensionless paths', () => {
    expect(isSpatialFile(undefined)).toBe(false);
    expect(isSpatialFile('Makefile')).toBe(false);
    expect(isSpatialFile('')).toBe(false);
  });

  it('is case-insensitive for extensions', () => {
    expect(isSpatialFile('data/map.GEOJSON')).toBe(true);
    expect(isSpatialFile('data/IMAGE.TIF')).toBe(true);
  });

  it('getGeoFormatInfo returns correct family and label', () => {
    const info = getGeoFormatInfo('data/layers.geojson');
    expect(info).not.toBeNull();
    expect(info!.family).toBe('vector');
    expect(info!.label).toBe('GeoJSON');
    expect(info!.ext).toBe('.geojson');
  });

  it('getGeoFormatInfo returns null for unknown extension', () => {
    expect(getGeoFormatInfo('src/app.tsx')).toBeNull();
    expect(getGeoFormatInfo(undefined)).toBeNull();
  });
});
