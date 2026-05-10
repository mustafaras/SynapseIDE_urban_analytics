import { describe, expect, it } from "vitest";
import { runFacilityOptimisation } from "../FacilityOptimisation";
import { buildFacilityOptimisationDemoDataset } from "@/centerpanel/Flows/facilityOptimisationDemo";

describe("FacilityOptimisation", () => {
  it("solves p-median and returns sites, assignments, catchments, and diagnostics", () => {
    const dataset = buildFacilityOptimisationDemoDataset();
    const result = runFacilityOptimisation({
      model: "p_median",
      demandPoints: dataset.demandPoints,
      candidateSites: dataset.candidateSites,
      facilityCount: 4,
      serviceRadiusKm: dataset.serviceRadiusKm,
      scenarioName: "Base p-median",
    });

    expect(result.model).toBe("p_median");
    expect(result.selectedSiteCount).toBe(4);
    expect(result.chosenSites).toHaveLength(4);
    expect(result.assignments).toHaveLength(dataset.demandPoints.length);
    expect(result.catchments).toHaveLength(4);
    expect(result.demandSummary.demandServed).toBe(result.demandSummary.totalDemand);
    expect(result.equityDiagnostics.groups.length).toBeGreaterThan(1);
    expect(result.equityAuditBridge.records).toHaveLength(dataset.demandPoints.length);
  });

  it("solves LSCP and MCLP with coverage-oriented objectives", () => {
    const dataset = buildFacilityOptimisationDemoDataset();

    const lscp = runFacilityOptimisation({
      model: "lscp",
      demandPoints: dataset.demandPoints,
      candidateSites: dataset.candidateSites,
      serviceRadiusKm: 2.8,
      scenarioName: "LSCP coverage",
    });
    const mclp = runFacilityOptimisation({
      model: "mclp",
      demandPoints: dataset.demandPoints,
      candidateSites: dataset.candidateSites,
      facilityCount: 3,
      serviceRadiusKm: dataset.serviceRadiusKm,
      scenarioName: "MCLP coverage",
    });

    expect(lscp.objectiveName).toBe("Sites needed for coverage");
    expect(lscp.selectedSiteCount).toBeGreaterThan(0);
    expect(lscp.demandSummary.coveredDemandRatio).toBeGreaterThan(0.99);
    expect(mclp.objectiveName).toBe("Covered demand");
    expect(mclp.selectedSiteCount).toBe(3);
    expect(mclp.demandSummary.coveredDemandRatio).toBeGreaterThan(0.7);
  });

  it("changes behaviour when equity-aware maximin logic is enabled", () => {
    const dataset = buildFacilityOptimisationDemoDataset();

    const baseline = runFacilityOptimisation({
      model: "mclp",
      demandPoints: dataset.demandPoints,
      candidateSites: dataset.candidateSites,
      facilityCount: 3,
      serviceRadiusKm: 2.0,
      scenarioName: "Coverage baseline",
      equity: {
        mode: "none",
      },
    });
    const equityAware = runFacilityOptimisation({
      model: "mclp",
      demandPoints: dataset.demandPoints,
      candidateSites: dataset.candidateSites,
      facilityCount: 3,
      serviceRadiusKm: 2.0,
      scenarioName: "Coverage equity",
      equity: {
        mode: "maximin",
        objectiveWeight: 1.2,
        priorityGroups: ["low_income"],
      },
    });

    expect(
      equityAware.equityDiagnostics.maximinCoverageScore,
    ).toBeGreaterThanOrEqual(baseline.equityDiagnostics.maximinCoverageScore);
    expect(
      equityAware.equityDiagnostics.priorityGroupCoverageRatio,
    ).toBeGreaterThanOrEqual(baseline.equityDiagnostics.priorityGroupCoverageRatio ?? 0);
    expect(
      equityAware.equityDiagnostics.coverageGap,
    ).toBeLessThanOrEqual(baseline.equityDiagnostics.coverageGap);
  });
});
