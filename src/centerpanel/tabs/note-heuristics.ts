import type { NoteSlots } from "./Note";


export function computeExportGaps(input: Pick<NoteSlots, "summary" | "plan">): { missingRisk?: boolean; missingFollow?: boolean } {
  const summary = String(input.summary || "");
  const plan = String(input.plan || "");

  const riskTerms = /(\brisk\b|\bconcern\b|\bflag\b|data\s*quality|\banomaly|\boutlier|validation\s*issue|integrity\s*check)/i;
  const mitigationTerms = /(addressed|resolved|no\s+concerns?|verified|validated|within\s+tolerance)/i;
  const contextTerms = /(methodology|limitation|assumption|confidence\s+interval|uncertainty|margin\s+of\s+error)/i;

  const hasRiskSignal = riskTerms.test(summary) || mitigationTerms.test(summary) || contextTerms.test(summary);
  const missingRisk = summary.trim().length > 0 && !hasRiskSignal;

  const followPtn = /((follow\s*-?\s*up|f\/u|return|review)\s*(in|on|at)?\s*(\d+\s*(day|days|wk|wks|week|weeks|mo|mos|month|months)|tomorrow|next\s+(week|month)|\b\d{1,2}\/\d{1,2}\b))/i;
  const missingFollow = plan.trim().length > 0 && !followPtn.test(plan);

  return { missingRisk, missingFollow };
}
