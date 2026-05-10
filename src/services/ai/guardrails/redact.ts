import { RX, URBAN_CHECKS } from './patterns';

export type Redaction = { kind:'secret'|'pii'|'riskCmd'|'exfilUrl'; match: string; start: number; end: number };
export type GuardResult = { text: string; redactions: Redaction[]; warnings: string[] };

export function redact(text: string): GuardResult {
  const redactions: Redaction[] = [];
  function apply(kind: Redaction['kind'], rx: RegExp) {
    let m: RegExpExecArray | null;
    const r = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : `${rx.flags  }g`);
    while ((m = r.exec(text)) !== null) {
      redactions.push({ kind, match: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  [...RX.secrets.map(rx=>['secret',rx] as const),
   ...RX.pii.map(rx=>['pii',rx] as const),
   ...RX.riskCmd.map(rx=>['riskCmd',rx] as const),
   ...RX.exfilUrl.map(rx=>['exfilUrl',rx] as const)
  ].forEach(([k,rx])=> apply(k, rx as RegExp));

  let safe = text;
  for (const r of redactions.sort((a,b)=> b.start - a.start)) {
    safe = `${safe.slice(0,r.start)  }[REDACTED:${r.kind}]${  safe.slice(r.end)}`;
  }
  const warnings:string[] = [];
  if (redactions.some(r=> r.kind==='secret')) warnings.push('Secrets were redacted.');
  if (redactions.some(r=> r.kind==='pii')) warnings.push('PII-like patterns were redacted.');
  if (redactions.some(r=> r.kind==='riskCmd')) warnings.push('Potentially dangerous commands detected.');
  if (redactions.some(r=> r.kind==='exfilUrl')) warnings.push('Potential exfiltration URLs detected.');

  /* Urban analytics domain warnings */
  if (URBAN_CHECKS.missingCRS.test(text) && !/\b(EPSG|WGS\s*84|UTM|CRS|crs|srid)\b/i.test(text)) {
    warnings.push('Coordinates detected without an explicit CRS — specify EPSG code or projection.');
  }
  if (URBAN_CHECKS.areaNeedsProjection.test(text) && !/\b(EPSG:\d{4,5}|ST_Transform|project|reproject)\b/i.test(text)) {
    warnings.push('Area/distance computation detected — ensure a projected CRS (not WGS 84) is used for accuracy.');
  }
  if (URBAN_CHECKS.equitySensitive.test(text)) {
    warnings.push('Equity-sensitive topic — consider disaggregating by income, race, age and noting environmental justice implications.');
  }
  if (URBAN_CHECKS.statWithoutSignificance.test(text) && !/\b(p\s*[<>=]|confidence|significan|alpha\s*=)\b/i.test(text)) {
    warnings.push('Statistical analysis mentioned — include significance levels, confidence intervals, and sample size considerations.');
  }
  if (URBAN_CHECKS.maupRisk.test(text)) {
    warnings.push('Aggregation detected — be aware of the Modifiable Areal Unit Problem (MAUP, Openshaw 1984).');
  }

  return { text: safe, redactions, warnings };
}
