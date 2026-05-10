import type { ReportTemplateDefinition } from "../types";
import { buildGeneratedAnalysisSections, createDocument, section } from "./shared";

export const TECHNICAL_REPORT_TEMPLATE: ReportTemplateDefinition = {
  id: "technical_report",
  label: "Technical Report",
  description: "Publication-style analytical report for research, peer review, and rigorous technical documentation.",
  audience: "Researchers, analysts, peer reviewers",
  useCase: "Technical documentation and reproducible analytical reporting",
  build: (input) => {
    const sections = [
      section(
        "executive_summary",
        "Executive Summary",
        [
          "This report consolidates the principal analytical outputs, evidence layers, and interpretation notes into a reproducible technical narrative.",
          "Generated sections preserve traceability to completed analytical runs, while user-authored sections can refine framing, caveats, and disciplinary interpretation.",
        ],
        { citationIds: ["oecd-2008"] },
      ),
      section(
        "context",
        "Study Context",
        [
          "The study frames spatial disparities, environmental conditions, and monitoring evidence as linked reporting inputs rather than isolated charts.",
          "Results are prepared for both publication-style reporting and internal quality review without duplicating the underlying analytical logic.",
        ],
        { citationIds: ["unhabitat-2024"] },
      ),
      section(
        "methodology",
        "Methodology and Data Handling",
        [
          "Methods, figures, and tables are numbered automatically to keep cross-references stable as sections are reordered in the builder.",
          "Bibliography output remains style-switchable between APA 7th and Chicago while still supporting BibTeX and RIS exchange for downstream authoring tools.",
        ],
        { citationIds: ["oecd-2008"] },
      ),
      ...buildGeneratedAnalysisSections(input),
      section(
        "recommendation",
        "Limitations and Next Analytical Steps",
        [
          "Interpretation should remain sensitive to scale effects, variable construction choices, and uneven temporal coverage across source layers.",
          "Follow-up work should validate outlier districts, document uncertainty ranges, and clarify which findings are ready for decision support versus exploratory review.",
        ],
        { citationIds: ["ipcc-2022"] },
      ),
    ];

    return createDocument(TECHNICAL_REPORT_TEMPLATE, input, sections);
  },
};
