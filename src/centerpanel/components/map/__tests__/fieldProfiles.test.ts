import { describe, expect, it } from "vitest";
import { fcPointsWGS84 } from "./fixtures/gisFixtures";
import { buildFieldProfiles } from "../table/fieldProfiles";

describe("fieldProfiles", () => {
  it("builds numeric, categorical, and temporal stats for fcPointsWGS84", () => {
    const profiles = buildFieldProfiles(fcPointsWGS84.features, ["value", "name", "date"]);

    expect(profiles.value).toMatchObject({
      kind: "numeric",
      min: 4,
      max: 100,
      mean: 52,
      nullCount: 0,
      totalCount: 25,
    });
    expect(profiles.value.distribution.reduce((sum, entry) => sum + entry.count, 0)).toBe(25);

    expect(profiles.name).toMatchObject({
      kind: "categorical",
      distinctCount: 25,
      nullCount: 0,
      totalCount: 25,
    });
    expect(profiles.name.distribution[0]?.count).toBe(1);

    expect(profiles.date).toMatchObject({
      kind: "temporal",
      min: "2026-01-01T00:00:00.000Z",
      max: "2026-01-25T00:00:00.000Z",
      mean: "2026-01-13T00:00:00.000Z",
      nullCount: 0,
      totalCount: 25,
    });
    expect(profiles.date.distribution.reduce((sum, entry) => sum + entry.count, 0)).toBe(25);
  });
});