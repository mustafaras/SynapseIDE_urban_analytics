/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import fs from 'node:fs';
import path from 'path';

type CoverageMetricName = 'statements' | 'branches' | 'functions' | 'lines';
type CoverageThreshold = Record<CoverageMetricName, number>;

type CoveragePolicy = {
  global: CoverageThreshold;
  modules: Array<{
    id: string;
    label: string;
    include: string[];
    minimum: CoverageThreshold;
  }>;
};

const coveragePolicy = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './src/config/coveragePolicy.json'), 'utf8'),
) as CoveragePolicy;

const coverageInclude = Array.from(
  new Set(coveragePolicy.modules.flatMap((modulePolicy) => modulePolicy.include)),
);

const coverageThresholds = coveragePolicy.modules.reduce<Record<string, CoverageThreshold>>(
  (thresholds, modulePolicy) => {
    for (const includePattern of modulePolicy.include) {
      thresholds[includePattern] = modulePolicy.minimum;
    }
    return thresholds;
  },
  {},
);

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    globals: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'html', 'json-summary'],
      include: coverageInclude,
      exclude: ['**/__tests__/**', '**/*.d.ts', '**/index.ts', '**/types.ts'],
      thresholds: {
        statements: coveragePolicy.global.statements,
        branches: coveragePolicy.global.branches,
        functions: coveragePolicy.global.functions,
        lines: coveragePolicy.global.lines,
        ...coverageThresholds,
      },
    },
  },
});
