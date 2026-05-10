import { describe, expect, it } from "vitest";
import { REPORTING_FIXTURE_RUNS } from "../fixtures";
import { compileReport } from "../ReportEngine";
import { createReportFromTemplate, REPORT_TEMPLATES } from "../templates";

describe("report templates", () => {
  it("registers the required reporting templates", () => {
    expect(REPORT_TEMPLATES.map((template) => template.id)).toEqual([
      "technical_report",
      "policy_brief",
      "environmental_impact_assessment",
      "sdg_progress_report",
    ]);
  });

  it("compiles technical and policy templates from fixture analysis data", () => {
    const technical = createReportFromTemplate("technical_report", {
      runs: REPORTING_FIXTURE_RUNS,
      fallbackRuns: REPORTING_FIXTURE_RUNS,
    });
    const policy = createReportFromTemplate("policy_brief", {
      runs: REPORTING_FIXTURE_RUNS,
      fallbackRuns: REPORTING_FIXTURE_RUNS,
    });

    const technicalCompiled = compileReport(technical);
    const policyCompiled = compileReport(policy);

    expect(technicalCompiled.sections.length).toBeGreaterThan(2);
    expect(technicalCompiled.figureReferences.length).toBeGreaterThan(0);
    expect(policyCompiled.sections.some((section) => section.generated)).toBe(true);
    expect(policyCompiled.bibliography.length).toBeGreaterThan(0);
  });
});
