import { describe, expect, it } from 'vitest';
import { deriveFileSemanticBadges, getExplorerFileKind } from '../fileSemantics';
import type { FileNode } from '../../../types/state';

describe('fileSemantics', () => {
  it('classifies required geospatial and analytics file extensions', () => {
    expect(getExplorerFileKind('districts.geojson')).toBe('geo-vector');
    expect(getExplorerFileKind('baseline.parquet')).toBe('table');
    expect(getExplorerFileKind('city.gpkg')).toBe('geo-package');
    expect(getExplorerFileKind('roads.shp')).toBe('shape-main');
    expect(getExplorerFileKind('roads.dbf')).toBe('shape-sidecar');
    expect(getExplorerFileKind('analysis.py')).toBe('script');
    expect(getExplorerFileKind('notebook.ipynb')).toBe('notebook');
    expect(getExplorerFileKind('query.sql')).toBe('query');
    expect(getExplorerFileKind('model.r')).toBe('script');
    expect(getExplorerFileKind('scenario.yaml')).toBe('config');
    expect(getExplorerFileKind('scenario.toml')).toBe('config');
  });

  it('adds badges only from metadata or extension-confidence rules', () => {
    const plainJson: FileNode = {
      id: 'json',
      name: 'raw.json',
      type: 'file',
      path: 'raw.json',
      lastModified: new Date(),
    };

    const scenarioToml: FileNode = {
      id: 'scenario',
      name: 'equity_scenario.toml',
      type: 'file',
      path: 'equity_scenario.toml',
      lastModified: new Date(),
    };

    const generatedOutput: FileNode = {
      id: 'output',
      name: 'metrics.parquet',
      type: 'file',
      path: 'metrics.parquet',
      lastModified: new Date(),
      semanticStatus: {
        generated: true,
        analysisOutput: true,
        synced: true,
      },
      isDirty: true,
    };

    expect(deriveFileSemanticBadges(plainJson)).toEqual([]);
    expect(deriveFileSemanticBadges(scenarioToml).map(b => b.id)).toContain('scenario-artifact');
    expect(deriveFileSemanticBadges(generatedOutput).map(b => b.id)).toEqual([
      'generated',
      'synced',
      'dirty',
      'analysis-output',
    ]);
  });
});
