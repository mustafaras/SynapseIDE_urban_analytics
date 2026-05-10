export const RX = {
  secrets: [
    /-----BEGIN (RSA|EC|PRIVATE) KEY-----/i,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bprojects\/\w+\/secrets\/\w+/i,
    /\bghp_[0-9A-Za-z]{36}\b/,
    /\b(xox[baprs]-[0-9A-Za-z-]{10,})\b/,
  ],
  pii: [
    /\b\d{11}\b/,
    /\b\d{3}-\d{2}-\d{4}\b/,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  ],
  riskCmd: [
    /\brm\s+-rf\s+\/(?!\S)/,
    /\bchmod\s+777\b/,
    /\bnpm\s+publish\b/i,
    /\bgit\s+push\b/i,
  ],
  exfilUrl: [
    /https?:\/\/(pastebin|hastebin|transfer\.sh|file\.io)\//i,
  ],
};

/* ------------------------------------------------------------------ */
/*  Urban analytics domain guardrails                                  */
/* ------------------------------------------------------------------ */

/**
 * Heuristic checks that produce *warnings* (not redactions) when the
 * user's prompt or the model's response may need extra care.
 */
export const URBAN_CHECKS = {
  /** Prompt mentions coordinates but no CRS — remind user. */
  missingCRS: /\b(\d{1,3}\.\d{3,})\s*,\s*(\d{1,3}\.\d{3,})\b/,
  /** Statistical claim without significance qualifier. */
  statWithoutSignificance: /\b(correlat|regress|p\s*-?\s*value|significan|moran|cluster)\b/i,
  /** Area / distance computation that may need a projected CRS. */
  areaNeedsProjection: /\b(ST_Area|ST_Distance|area\s*\(|distance\s*\(|buffer\s*\()\b/i,
  /** Equity-sensitive topic — flag for justice consideration. */
  equitySensitive: /\b(gentrif|displace|segregat|redlin|environmental\s+justice|equity|vulnerable\s+populat)\b/i,
  /** Reproducibility — script lacks explicit imports or seeds. */
  missingReproducibility: /\b(random_state|np\.random\.seed|set\.seed)\b/i,
  /** MAUP warning — aggregation level change. */
  maupRisk: /\b(census\s+tract|block\s+group|zip\s*code|aggregat|dissolve|groupby)\b.*\b(area|zone|polygon)\b/i,
} as const;
