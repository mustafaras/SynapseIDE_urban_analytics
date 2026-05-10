import type { ReportTemplateDefinition } from "../types";
import { buildGeneratedAnalysisSections, createDocument, section } from "./shared";

export const POLICY_BRIEF_TEMPLATE: ReportTemplateDefinition = {
  id: "policy_brief",
  label: "Policy Brief",
  description: "Decision-support brief for municipal leadership, studio presentations, and concise policy communication.",
  audience: "Municipal leaders, planning directors, studio juries",
  useCase: "Action-oriented communication and implementation framing",
  build: (input) => {
    const sections = [
      section(
        "executive_summary",
        "Policy Question",
        [
          "This brief translates analytical outputs into a concise decision-support package focused on where intervention is most urgent and what evidence supports that prioritization.",
        ],
        { citationIds: ["unhabitat-2024"] },
      ),
      section(
        "analysis",
        "What the Evidence Shows",
        [
          "The structured result sections below summarize the strongest disparities, emerging pressures, and areas where additional investment or monitoring is likely to have the highest payoff.",
        ],
      ),
      ...buildGeneratedAnalysisSections(input),
      section(
        "recommendation",
        "Priority Actions",
        [
          "Use the observed spatial patterning to target investment corridors, sequence implementation by urgency, and align communication with measurable outcomes that can be tracked over time.",
          "Maintain a short list of headline indicators so public communication remains clear while the technical annex preserves the underlying detail.",
        ],
        { citationIds: ["ipcc-2022", "unhabitat-2024"] },
      ),
      section(
        "monitoring",
        "Implementation and Monitoring",
        [
          "Pair each action with a responsible team, review cadence, and a limited set of monitoring indicators that can be updated through the same reporting engine.",
        ],
      ),
    ];

    return createDocument(POLICY_BRIEF_TEMPLATE, input, sections);
  },
};
