import { describe, expect, it } from "vitest";
import {
  exportBibliography,
  formatCitationAsBibTeX,
  formatCitationAsRis,
  formatCitationBibliography,
  formatCitationInline,
} from "../CitationManager";
import { REPORTING_FIXTURE_CITATIONS } from "../fixtures";

describe("CitationManager", () => {
  const citation = REPORTING_FIXTURE_CITATIONS[0]!;

  it("formats inline citations for APA and Chicago", () => {
    expect(formatCitationInline(citation, "apa7")).toContain("2022");
    expect(formatCitationInline(citation, "chicago")).toContain("2022");
  });

  it("builds bibliography entries for supported prose styles", () => {
    expect(formatCitationBibliography(citation, "apa7")).toContain(citation.title);
    expect(formatCitationBibliography(citation, "chicago")).toContain(citation.title);
  });

  it("exports BibTeX and RIS payloads", () => {
    expect(formatCitationAsBibTeX(citation)).toContain("@report");
    expect(formatCitationAsRis(citation)).toContain("TY  - RPRT");
  });

  it("exports full bibliography bundles", () => {
    expect(exportBibliography(REPORTING_FIXTURE_CITATIONS, "bibtex")).toContain("ipcc-2022");
    expect(exportBibliography(REPORTING_FIXTURE_CITATIONS, "ris")).toContain("ER  -");
  });
});
