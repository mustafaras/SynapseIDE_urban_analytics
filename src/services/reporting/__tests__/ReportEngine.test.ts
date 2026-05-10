import { describe, expect, it } from "vitest";
import { compileReport } from "../ReportEngine";
import type { ReportDocument } from "../types";

describe("ReportEngine", () => {
  it("numbers figures and tables and resolves cross references", () => {
    const document: ReportDocument = {
      id: "report-1",
      name: "Cross Reference Test",
      description: "Cross reference coverage.",
      templateId: "technical_report",
      citationStyle: "apa7",
      createdAt: "2026-04-13T00:00:00.000Z",
      updatedAt: "2026-04-13T00:00:00.000Z",
      metadata: {
        audience: "Test",
        useCase: "Verification",
      },
      citations: [
        {
          id: "ref-1",
          type: "report",
          title: "Example Reference",
          authors: [{ family: "Tester", given: "A." }],
          year: 2024,
          publisher: "QA Press",
        },
      ],
      sections: [
        {
          id: "context",
          title: "Context",
          kind: "context",
          origin: "user",
          generated: false,
          citationIds: ["ref-1"],
          blocks: [
            { kind: "paragraph", text: "Interpret the spatial pattern through {{fig:fig-1}} and {{tbl:tbl-1}}." },
            { kind: "figure", assetId: "fig-1", title: "Primary map", caption: "Main evidence map." },
            { kind: "table", assetId: "tbl-1", title: "Summary table", caption: "Main evidence table.", columns: ["A"], rows: [{ A: 1 }] },
          ],
        },
      ],
      sectionOrder: ["context"],
      linkedRunIds: [],
    };

    const compiled = compileReport(document);

    expect(compiled.figureReferences[0]?.number).toBe(1);
    expect(compiled.tableReferences[0]?.number).toBe(1);
    expect(compiled.markdown).toContain("Figure 1");
    expect(compiled.markdown).toContain("Table 1");
    expect(compiled.markdown).toContain("Tester, 2024");
    expect(compiled.html).toContain("Bibliography");
  });

  it("renders inline citation tokens and only lists referenced bibliography entries", () => {
    const document: ReportDocument = {
      id: "report-2",
      name: "Inline Citation Test",
      description: "Inline citation coverage.",
      templateId: "technical_report",
      citationStyle: "apa7",
      createdAt: "2026-04-13T00:00:00.000Z",
      updatedAt: "2026-04-13T00:00:00.000Z",
      metadata: {
        audience: "Test",
        useCase: "Verification",
      },
      citations: [
        {
          id: "ref-inline",
          type: "report",
          title: "Inline Reference",
          authors: [{ family: "Inline", given: "Author" }],
          year: 2025,
          publisher: "QA Press",
        },
        {
          id: "ref-unused",
          type: "report",
          title: "Unused Reference",
          authors: [{ family: "Unused", given: "Author" }],
          year: 2020,
          publisher: "QA Press",
        },
      ],
      sections: [
        {
          id: "analysis",
          title: "Analysis",
          kind: "analysis",
          origin: "user",
          generated: false,
          citationIds: [],
          blocks: [
            { kind: "paragraph", text: "This paragraph cites {{cite:ref-inline}} directly in the body." },
          ],
        },
      ],
      sectionOrder: ["analysis"],
      linkedRunIds: [],
    };

    const compiled = compileReport(document);

    expect(compiled.markdown).toContain("(Inline, 2025)");
    expect(compiled.bibliography).toHaveLength(1);
    expect(compiled.bibliography[0]).toContain("Inline Reference");
    expect(compiled.bibliography[0]).not.toContain("Unused Reference");
  });
});
