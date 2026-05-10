import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildMapEvidenceFocusedReport, ReportBuilderPanel } from "../ReportBuilderPanel";
import type { ReportDocument } from "../types";

describe("ReportBuilderPanel", () => {
  it("renders the builder surface with live preview and export controls", () => {
    const html = renderToStaticMarkup(<ReportBuilderPanel />);

    expect(html).toContain("Structured report builder");
    expect(html).toContain("Section Order");
    expect(html).toContain("Citations");
    expect(html).toContain("Live Preview");
    expect(html).toContain("Markdown");
    expect(html).toContain("PDF-ready HTML");
    expect(html).toContain("PDF");
  });

  it("renders inline citation insertion guidance in the section editor", () => {
    const html = renderToStaticMarkup(<ReportBuilderPanel />);

    expect(html).toContain("Inline citation target");
    expect(html).toContain("Insert in Body");
  });

  it("builds a focused PDF document for current map evidence and reproducibility", () => {
    const document: ReportDocument = {
      id: "report-map-evidence",
      name: "Urban report",
      description: "Evidence report.",
      templateId: "technical_report",
      citationStyle: "apa7",
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z",
      metadata: { audience: "Analyst", useCase: "Map evidence" },
      citations: [
        {
          id: "map-ref-1",
          type: "dataset",
          title: "Current map reference",
          authors: [{ family: "Layer", given: "Registry" }],
          year: 2026,
        },
      ],
      sections: [
        {
          id: "handoff-1-finding-section",
          title: "Current map evidence - Map Finding",
          kind: "evidence",
          origin: "generated",
          generated: true,
          badgeLabel: "Map handoff",
          citationIds: ["map-ref-1"],
          blocks: [{ kind: "paragraph", text: "Map narrative cites {{cite:map-ref-1}}." }],
        },
        {
          id: "handoff-1-reproducibility-section",
          title: "Current map evidence - Reproducibility",
          kind: "methodology",
          origin: "generated",
          generated: true,
          badgeLabel: "Reproducibility block",
          citationIds: ["map-ref-1"],
          blocks: [{ kind: "bullet_list", items: ["Viewport bounds: known", "Visible layers: custom-aoi"] }],
        },
        {
          id: "unrelated",
          title: "Unrelated analysis",
          kind: "analysis",
          origin: "user",
          generated: false,
          citationIds: [],
          blocks: [{ kind: "paragraph", text: "Do not include." }],
        },
      ],
      sectionOrder: ["unrelated", "handoff-1-finding-section", "handoff-1-reproducibility-section"],
      linkedRunIds: [],
    };

    const focused = buildMapEvidenceFocusedReport(document, "handoff-1-finding-section");

    expect(focused?.name).toBe("Current map evidence - Map Finding");
    expect(focused?.sections.map((section) => section.id)).toEqual([
      "handoff-1-finding-section",
      "handoff-1-reproducibility-section",
    ]);
    expect(focused?.sectionOrder).toEqual([
      "handoff-1-finding-section",
      "handoff-1-reproducibility-section",
    ]);
  });
});