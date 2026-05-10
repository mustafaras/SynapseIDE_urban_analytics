/**
 * distributions — Statistical distribution functions for spatial statistics.
 *
 * Provides CDF approximations for standard distributions needed by
 * regression diagnostics (chi-squared, t-distribution, normal).
 *
 * All approximations cite their source algorithm and document max error.
 */

// ─── Standard normal CDF ────────────────────────────────────────────────────

/**
 * Standard normal cumulative distribution function Φ(x).
 *
 * Uses the Abramowitz & Stegun (1964) rational approximation (formula 26.2.17).
 * Maximum absolute error: 7.5 × 10⁻⁸.
 */
export function normalCdf(x: number): number {
  if (x === Infinity) return 1;
  if (x === -Infinity) return 0;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * z);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1 + sign * y);
}

/**
 * Two-tailed p-value from a standard normal z-score.
 */
export function normalTwoTailP(z: number): number {
  return 2 * (1 - normalCdf(Math.abs(z)));
}

// ─── Gamma and incomplete gamma ─────────────────────────────────────────────

/**
 * Natural logarithm of the Gamma function, using Lanczos approximation.
 * Accurate to ~15 digits for x > 0.
 */
export function lnGamma(x: number): number {
  if (x <= 0) throw new RangeError('lnGamma requires x > 0.');

  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  if (x < 0.5) {
    // Reflection formula.
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  }

  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) {
    a += c[i] / (x + i);
  }

  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Regularized lower incomplete gamma function P(a, x) via series expansion.
 *
 * P(a, x) = γ(a, x) / Γ(a)
 *
 * Uses the series: γ(a, x) = e^(-x) x^a Σ_{n=0}^∞ x^n / (a(a+1)...(a+n))
 *
 * Converges fastest when x < a + 1.
 */
function gammaPSeries(a: number, x: number): number {
  if (x < 0) return 0;
  if (x === 0) return 0;

  let term = 1 / a;
  let sum = term;
  for (let n = 1; n < 200; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
}

/**
 * Regularized upper incomplete gamma Q(a, x) via continued fraction.
 *
 * Q(a, x) = 1 - P(a, x) = Γ(a, x) / Γ(a)
 *
 * Uses Lentz's modified continued fraction. Converges fastest when x >= a + 1.
 */
function gammaQCF(a: number, x: number): number {
  const TINY = 1e-30;
  let b = x + 1 - a;
  let c = 1 / TINY;
  let d = 1 / b;
  let h = d;

  for (let i = 1; i < 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-14) break;
  }

  return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}

/**
 * Regularized lower incomplete gamma function P(a, x).
 * Switches between series and continued fraction for efficiency.
 */
export function regularizedGammaP(a: number, x: number): number {
  if (x < 0) return 0;
  if (x === 0) return 0;
  if (x < a + 1) return gammaPSeries(a, x);
  return 1 - gammaQCF(a, x);
}

// ─── Chi-squared distribution ───────────────────────────────────────────────

/**
 * Chi-squared CDF: P(χ² ≤ x) for degrees of freedom df.
 *
 *   P(x | df) = P(df/2, x/2)   (regularized lower incomplete gamma)
 */
export function chiSquaredCdf(x: number, df: number): number {
  if (x <= 0) return 0;
  return regularizedGammaP(df / 2, x / 2);
}

/**
 * Chi-squared survival function: P(χ² > x).
 */
export function chiSquaredSf(x: number, df: number): number {
  return 1 - chiSquaredCdf(x, df);
}

// ─── Student's t-distribution ───────────────────────────────────────────────

/**
 * Regularized incomplete beta function I_x(a, b) via continued fraction.
 *
 * Uses the Lentz algorithm for the continued fraction expansion.
 * This is needed for the t-distribution CDF.
 */
function betaCF(x: number, a: number, b: number): number {
  const TINY = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;

  for (let m = 1; m < 200; m++) {
    const m2 = 2 * m;

    // Even step.
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;

    // Odd step.
    aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-14) break;
  }

  return h;
}

/**
 * Regularized incomplete beta function I_x(a, b).
 */
export function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const bt = Math.exp(
    lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );

  // Use symmetry relation when x > (a+1)/(a+b+2) for convergence.
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaCF(x, a, b)) / a;
  }
  return 1 - (bt * betaCF(1 - x, b, a)) / b;
}

/**
 * Student's t-distribution CDF: P(T ≤ t) for df degrees of freedom.
 *
 * Uses the incomplete beta function:
 *   P(T ≤ t) = 1 - 0.5 I_x(df/2, 1/2)  where x = df/(df + t²)
 */
export function tCdf(t: number, df: number): number {
  const x = df / (df + t * t);
  const ibeta = regularizedBeta(x, df / 2, 0.5);
  if (t >= 0) return 1 - 0.5 * ibeta;
  return 0.5 * ibeta;
}

/**
 * Two-tailed p-value from a t-statistic with df degrees of freedom.
 */
export function tTwoTailP(t: number, df: number): number {
  return 2 * (1 - tCdf(Math.abs(t), df));
}
