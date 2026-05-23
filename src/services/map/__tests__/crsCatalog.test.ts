import { describe, expect, it } from "vitest";
import {
  COMMON_CRS_ENTRIES,
  crsCatalog,
  listUtmCrsEntries,
  parseDeclarableCrs,
  searchCrsCatalog,
  suggestLocalCrsForExtent,
} from "@/services/map/crs/crsCatalog";

describe("crsCatalog", () => {
  it("generates 120 WGS 84 UTM zone entries (north + south for 60 zones)", () => {
    expect(listUtmCrsEntries()).toHaveLength(120);
  });

  it("lists curated entries first and dedupes shared UTM codes", () => {
    const all = crsCatalog();
    expect(all.slice(0, COMMON_CRS_ENTRIES.length)).toEqual([...COMMON_CRS_ENTRIES]);
    const codes = all.map((entry) => entry.code);
    expect(new Set(codes).size).toBe(codes.length); // EPSG:32635 appears once, not twice
  });

  it("searches by EPSG number, label, and keyword", () => {
    expect(searchCrsCatalog("32635").some((entry) => entry.code === "EPSG:32635")).toBe(true);
    expect(searchCrsCatalog("mercator").some((entry) => entry.code === "EPSG:3857")).toBe(true);
    expect(searchCrsCatalog("istanbul").some((entry) => entry.code === "EPSG:32635")).toBe(true);
    expect(searchCrsCatalog("")).toHaveLength(24); // curated head, capped at the default limit
  });

  it("parses declarable EPSG codes from loose input and rejects junk", () => {
    expect(parseDeclarableCrs("32635")).toBe("EPSG:32635");
    expect(parseDeclarableCrs("epsg:2100")).toBe("EPSG:2100");
    expect(parseDeclarableCrs("EPSG::4326")).toBe("EPSG:4326");
    expect(parseDeclarableCrs("not-a-crs")).toBeNull();
    expect(parseDeclarableCrs("")).toBeNull();
  });

  it("suggests the local UTM zone (35N) and an equal-area CRS for an Istanbul extent", () => {
    const suggestion = suggestLocalCrsForExtent([28.98, 41.0, 29.01, 41.03]);
    expect(suggestion).not.toBeNull();
    expect(suggestion?.utm.entry.code).toBe("EPSG:32635");
    expect(suggestion?.equalArea.entry.kind).toBe("equal-area");
  });

  it("returns no suggestion for an unusable extent", () => {
    expect(suggestLocalCrsForExtent(null)).toBeNull();
    expect(suggestLocalCrsForExtent([Number.NaN, Number.NaN, Number.NaN, Number.NaN])).toBeNull();
  });
});
