import { describe, expect, it } from "vitest";
import { fcPointsWGS84 } from "./fixtures/gisFixtures";
import { applyFieldCalculation, compileFieldCalculation } from "../table/fieldCalculator";

describe("fieldCalculator", () => {
  it("applies an allowlisted arithmetic expression to derive a new field", () => {
    const program = compileFieldCalculation("value * 2", {
      allowedIdentifiers: ["id", "name", "value", "date"],
    });
    const result = applyFieldCalculation({
      features: fcPointsWGS84.features,
      fieldName: "value_x2",
      program,
    });

    expect(result.referencedFields).toEqual(["value"]);
    expect(result.nullCount).toBe(0);
    expect(result.featureCollection.features[0]?.properties?.value_x2).toBe(8);
    expect(result.featureCollection.features[24]?.properties?.value_x2).toBe(200);
  });

  it.each([
    "eval(value)",
    "require('fs')",
    "constructor.constructor('return 1')()",
    "value.constructor",
  ])("rejects unsafe expression %s", (expression) => {
    expect(() => compileFieldCalculation(expression, {
      allowedIdentifiers: ["id", "name", "value", "date"],
    })).toThrow();
  });
});