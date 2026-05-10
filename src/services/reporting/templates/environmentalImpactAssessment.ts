import type { ReportTemplateDefinition } from "../types";
import { buildGeneratedAnalysisSections, createDocument, section } from "./shared";

export const ENVIRONMENTAL_IMPACT_ASSESSMENT_TEMPLATE: ReportTemplateDefinition = {
  id: "environmental_impact_assessment",
  label: "Environmental Impact Assessment",
  description: "Structured impact assessment for baseline conditions, projected effects, mitigation measures, and monitoring obligations.",
  audience: "Environmental planners, permitting teams, review authorities",
  useCase: "Impact screening, mitigation planning, and compliance documentation",
  build: (input) => {
    const sections = [
      section(
        "context",
        "Project and Receiving Environment",
        [
          "This assessment assembles baseline analytical evidence and organizes it for impact interpretation, mitigation design, and monitoring specification.",
        ],
        { citationIds: ["ipcc-2022"] },
      ),
      section(
        "impact",
        "Baseline and Impact Signals",
        [
          "Generated analytical sections are used here as structured baseline evidence so that impact interpretation remains tied to measurable spatial outputs rather than descriptive prose alone.",
        ],
      ),
      ...buildGeneratedAnalysisSections(input),
      section(
        "recommendation",
        "Mitigation and Enhancement Measures",
        [
          "Mitigation measures should prioritize the highest-exposure areas, align with the dominant driver identified in the evidence base, and preserve a clear line of sight between action and monitored indicator.",
        ],
        { citationIds: ["ipcc-2022", "unhabitat-2024"] },
      ),
      section(
        "monitoring",
        "Monitoring Commitments",
        [
          "Monitoring should distinguish between immediate compliance indicators, medium-term environmental response indicators, and adaptive management triggers.",
        ],
      ),
    ];

    return createDocument(ENVIRONMENTAL_IMPACT_ASSESSMENT_TEMPLATE, input, sections);
  },
};
