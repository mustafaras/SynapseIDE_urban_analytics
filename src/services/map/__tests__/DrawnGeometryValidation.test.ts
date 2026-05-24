import { describe, expect, it } from "vitest";

import { fcInvalidGeometry } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
import {
  summarizeDrawnGeometryValidation,
  validateDrawnGeometry,
} from "../DrawnGeometryValidation";

describe("DrawnGeometryValidation", () => {
  it("blocks self-intersecting AOI polygons with a topology caveat", () => {
    const bowTie = fcInvalidGeometry.features.find((feature) => feature.properties?.issue === "self-intersection");
    const validation = validateDrawnGeometry(bowTie?.geometry);

    expect(validation.status).toBe("blocked");
    expect(validation.issueCodes).toContain("self_intersection");
    expect(summarizeDrawnGeometryValidation(validation)).toContain("Self-intersecting");
  });

  it("blocks null geometry instead of treating it as an unknown-ready AOI", () => {
    const nullGeometry = fcInvalidGeometry.features.find((feature) => feature.geometry === null);
    const validation = validateDrawnGeometry(nullGeometry?.geometry);

    expect(validation.status).toBe("blocked");
    expect(validation.issueCodes).toContain("null_geometry");
    expect(validation.caveats.join(" ")).toContain("null");
  });
});
