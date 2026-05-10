import { ENVIRONMENTAL_IMPACT_ASSESSMENT_TEMPLATE } from "./environmentalImpactAssessment";
import { POLICY_BRIEF_TEMPLATE } from "./policyBrief";
import { SDG_PROGRESS_REPORT_TEMPLATE } from "./sdgProgressReport";
import { TECHNICAL_REPORT_TEMPLATE } from "./technicalReport";
import type { ReportTemplateBuildInput, ReportTemplateDefinition, ReportTemplateId } from "../types";

export const REPORT_TEMPLATES: ReportTemplateDefinition[] = [
  TECHNICAL_REPORT_TEMPLATE,
  POLICY_BRIEF_TEMPLATE,
  ENVIRONMENTAL_IMPACT_ASSESSMENT_TEMPLATE,
  SDG_PROGRESS_REPORT_TEMPLATE,
];

export function createReportFromTemplate(
  templateId: ReportTemplateId,
  input: ReportTemplateBuildInput,
) {
  const template = REPORT_TEMPLATES.find((item) => item.id === templateId);
  if (!template) {
    throw new Error(`Unknown report template: ${templateId}`);
  }
  return template.build(input);
}

export {
  ENVIRONMENTAL_IMPACT_ASSESSMENT_TEMPLATE,
  POLICY_BRIEF_TEMPLATE,
  SDG_PROGRESS_REPORT_TEMPLATE,
  TECHNICAL_REPORT_TEMPLATE,
};
