import type { ReportTemplateDefinition } from "../types";
import { buildGeneratedAnalysisSections, createDocument, section } from "./shared";

export const SDG_PROGRESS_REPORT_TEMPLATE: ReportTemplateDefinition = {
  id: "sdg_progress_report",
  label: "SDG Progress Report",
  description: "Monitoring-oriented report for SDG-aligned indicator review, equity checks, and periodic reporting cycles.",
  audience: "Monitoring units, SDG coordinators, public reporting teams",
  useCase: "Indicator progress review and periodic reporting",
  build: (input) => {
    const sections = [
      section(
        "executive_summary",
        "Progress Snapshot",
        [
          "This report summarizes indicator performance, spatial gaps, and emerging pressures relevant to SDG-oriented monitoring and education outputs.",
        ],
        { citationIds: ["unhabitat-2024"] },
      ),
      section(
        "analysis",
        "Indicator and Spatial Evidence",
        [
          "The sections below are generated from structured analytical outputs so the reporting layer can serve both classroom interpretation and formal monitoring workflows.",
        ],
        { citationIds: ["oecd-2008"] },
      ),
      ...buildGeneratedAnalysisSections(input),
      section(
        "recommendation",
        "Interpretation for Monitoring Cycles",
        [
          "Use these findings to identify lagging districts, test whether apparent gains are broad-based, and flag where indicator improvement masks persistent intra-urban inequality.",
        ],
        { citationIds: ["unhabitat-2024", "ipcc-2022"] },
      ),
      section(
        "monitoring",
        "Reporting Notes",
        [
          "The report builder can export this material as Markdown, PDF-ready HTML, or PDF while preserving figure numbering, table references, and bibliography formatting.",
        ],
      ),
    ];

    return createDocument(SDG_PROGRESS_REPORT_TEMPLATE, input, sections);
  },
};
