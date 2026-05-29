import { describe, expect, it } from "vitest";
import { fcInvalidGeometry } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
import { runMapScientificQAGeometryChecks } from "@/services/map/MapScientificQA";
import { validateAndRepairTopology } from "../topologyRepairWorker";

const FIXED_TIME = "2026-05-29T00:00:00.000Z";

describe("topologyRepairWorker", () => {
  it("detects a self-intersection with GEOS", async () => {
    const preview = await validateAndRepairTopology({
      layerId: "invalid",
      layerName: "Invalid geometry",
      featureCollection: fcInvalidGeometry,
      checkedAt: FIXED_TIME,
    });

    expect(preview.usedGeos).toBe(true);
    expect(preview.findings.some((finding) => finding.code === "self_intersection")).toBe(true);
    expect(preview.findings.find((finding) => finding.code === "self_intersection")?.operation).toBe("GEOSMakeValid");
  });

  it("produces valid repaired output with provenance", async () => {
    const preview = await validateAndRepairTopology({
      layerId: "invalid",
      layerName: "Invalid geometry",
      featureCollection: fcInvalidGeometry,
      checkedAt: FIXED_TIME,
    });
    const geometryQa = runMapScientificQAGeometryChecks({
      layerId: "repaired",
      layerName: "Repaired geometry",
      featureCollection: preview.repairedFeatureCollection,
      crs: "EPSG:4326",
    });

    expect(preview.status).toBe("needs-repair");
    expect(preview.canApply).toBe(true);
    expect(preview.outputFeatureCount).toBe(1);
    expect(preview.repairedFeatureCount).toBe(1);
    expect(preview.removedFeatureCount).toBe(1);
    expect(preview.provenance.engine).toBe("geos-wasm");
    expect(preview.provenance.operations).toContain("GEOSMakeValid");
    expect(geometryQa.issues.filter((issue) => issue.severity === "error" || issue.severity === "blocker")).toEqual([]);
  });

  it("flags null geometry separately from repairable topology", async () => {
    const preview = await validateAndRepairTopology({
      layerId: "invalid",
      layerName: "Invalid geometry",
      featureCollection: fcInvalidGeometry,
      checkedAt: FIXED_TIME,
    });
    const nullFinding = preview.findings.find((finding) => finding.code === "null_geometry");

    expect(nullFinding).toBeDefined();
    expect(nullFinding?.repairable).toBe(false);
    expect(nullFinding?.blocksApply).toBe(false);
    expect(nullFinding?.operation).toBe("drop-null-geometry");
  });
});
