/**
 * distributions.test.ts — Unit tests for statistical distribution functions.
 */

import { describe, expect, it } from 'vitest';
import {
  chiSquaredCdf,
  chiSquaredSf,
  lnGamma,
  normalCdf,
  normalTwoTailP,
  regularizedBeta,
  regularizedGammaP,
  tCdf,
  tTwoTailP,
} from '../distributions';

function approx(a: number, b: number, tol = 1e-5): void {
  expect(Math.abs(a - b)).toBeLessThan(tol);
}

describe('normalCdf', () => {
  it('returns 0.5 at z = 0', () => {
    approx(normalCdf(0), 0.5);
  });

  it('matches known quantiles', () => {
    approx(normalCdf(1.96), 0.975, 1e-3);
    approx(normalCdf(-1.96), 0.025, 1e-3);
    approx(normalCdf(2.576), 0.995, 1e-3);
  });

  it('handles extremes', () => {
    expect(normalCdf(Infinity)).toBe(1);
    expect(normalCdf(-Infinity)).toBe(0);
  });
});

describe('normalTwoTailP', () => {
  it('returns ~0.05 at z = 1.96', () => {
    approx(normalTwoTailP(1.96), 0.05, 1e-3);
  });
});

describe('lnGamma', () => {
  it('lnΓ(1) = 0', () => {
    approx(lnGamma(1), 0, 1e-10);
  });

  it('lnΓ(5) = ln(24)', () => {
    approx(lnGamma(5), Math.log(24), 1e-8);
  });

  it('throws for x ≤ 0', () => {
    expect(() => lnGamma(0)).toThrow();
    expect(() => lnGamma(-1)).toThrow();
  });
});

describe('regularizedGammaP', () => {
  it('P(1, 1) ≈ 1 - e⁻¹', () => {
    approx(regularizedGammaP(1, 1), 1 - Math.exp(-1), 1e-8);
  });

  it('P(a, 0) = 0', () => {
    expect(regularizedGammaP(2, 0)).toBe(0);
  });
});

describe('chiSquaredCdf', () => {
  it('P(χ²=3.841 | df=1) ≈ 0.95', () => {
    approx(chiSquaredCdf(3.841, 1), 0.95, 1e-3);
  });

  it('P(χ²=5.991 | df=2) ≈ 0.95', () => {
    approx(chiSquaredCdf(5.991, 2), 0.95, 1e-3);
  });

  it('returns 0 for x ≤ 0', () => {
    expect(chiSquaredCdf(0, 5)).toBe(0);
    expect(chiSquaredCdf(-1, 5)).toBe(0);
  });
});

describe('chiSquaredSf', () => {
  it('SF = 1 - CDF', () => {
    approx(chiSquaredSf(3.841, 1), 0.05, 1e-3);
  });
});

describe('regularizedBeta', () => {
  it('I_0(a, b) = 0', () => {
    expect(regularizedBeta(0, 2, 3)).toBe(0);
  });

  it('I_1(a, b) = 1', () => {
    expect(regularizedBeta(1, 2, 3)).toBe(1);
  });

  it('I_0.5(1, 1) = 0.5 (uniform)', () => {
    approx(regularizedBeta(0.5, 1, 1), 0.5, 1e-8);
  });
});

describe('tCdf', () => {
  it('CDF(0, df) = 0.5', () => {
    approx(tCdf(0, 10), 0.5, 1e-8);
  });

  it('t-distribution approaches normal for large df', () => {
    // For df=1000, t=1.96 should give ≈0.975.
    approx(tCdf(1.96, 1000), 0.975, 1e-3);
  });
});

describe('tTwoTailP', () => {
  it('p-value for t=2.0 with df=60 is near 0.05', () => {
    const p = tTwoTailP(2.0, 60);
    expect(p).toBeGreaterThan(0.04);
    expect(p).toBeLessThan(0.06);
  });

  it('p-value for t=0 is 1.0', () => {
    approx(tTwoTailP(0, 10), 1.0, 1e-6);
  });
});
