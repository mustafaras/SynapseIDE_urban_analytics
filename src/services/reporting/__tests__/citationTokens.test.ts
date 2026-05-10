import { describe, expect, it } from "vitest";
import {
  collectReferencedCitationIds,
  extractInlineCitationIds,
  insertCitationToken,
  renderInlineCitationTokens,
} from "../citationTokens";
import type { ReportCitationRecord, ReportDocument } from "../types";

describe("citationTokens", () => {
  const citationLookup = new Map<string, ReportCitationRecord>([
    [
      "ref-1",
      {
        id: "ref-1",
        type: "report",
        title: "Reference One",
        authors: [{ family: "Tester", given: "A." }],
        year: 2024,
      },
    ],
  ]);

  it("extracts inline citation ids from paragraph text", () => {
    expect(extractInlineCitationIds("Body {{cite:ref-1}} and {{cite:ref-2|ref-3}}.")).toEqual([
      "ref-1",
      "ref-2",
      "ref-3",
    ]);
  });

  it("renders inline citation tokens to formatted inline citations", () => {
    const text = renderInlineCitationTokens("Body {{cite:ref-1}}.", citationLookup, "apa7");
    expect(text).toContain("(Tester, 2024)");
  });

  it("inserts a citation token at the current caret position", () => {
    const inserted = insertCitationToken("Alpha beta", "ref-1", { start: 5, end: 5 });
    expect(inserted.text).toBe("Alpha {{cite:ref-1}} beta");
    expect(inserted.selection.start).toBe(inserted.selection.end);
  });

  it("collects section-level and inline citation ids for bibliography generation", () => {
    const document: Pick<ReportDocument, "sections"> = {
      sections: [
        {
          id: "s-1",
          title: "Section",
          kind: "analysis",
          origin: "user",
          generated: false,
          citationIds: ["section-ref"],
          blocks: [{ kind: "paragraph", text: "Inline {{cite:inline-ref}}." }],
        },
      ],
    };

    expect(collectReferencedCitationIds(document)).toEqual(["section-ref", "inline-ref"]);
  });
});