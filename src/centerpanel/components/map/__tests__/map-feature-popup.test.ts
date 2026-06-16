// @vitest-environment jsdom
/**
 * Feature-details popup (MapCanvas) — premium, non-clipping layout.
 * Regression guard for the building/OSM popup that previously clipped long
 * values (OSM id, building id, source) and didn't match the dark UI.
 */
import { describe, expect, it } from "vitest";
import { buildFeaturePopupHtml } from "../MapCanvas";

describe("buildFeaturePopupHtml", () => {
  const props = {
    building: "yes",
    osm_id: "way/521232090",
    building_id: "osm-way-521232090",
    type: "yes",
    source: "OpenStreetMap",
  };

  it("returns null when there is nothing to show", () => {
    expect(buildFeaturePopupHtml(undefined)).toBeNull();
    expect(buildFeaturePopupHtml({})).toBeNull();
    expect(buildFeaturePopupHtml({ __internal: "x", empty: "" })).toBeNull();
  });

  it("renders every value in full (no truncation of long ids)", () => {
    const html = buildFeaturePopupHtml(props)!;
    expect(html).toContain("way/521232090");
    expect(html).toContain("osm-way-521232090");
    expect(html).toContain("OpenStreetMap");
    expect(html).toContain("Add to report");
    expect(html).toContain('data-map-feature-report="true"');
  });

  it("lets long values wrap instead of clipping", () => {
    const html = buildFeaturePopupHtml(props)!;
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).toContain("word-break:break-word");
    // Value column must be allowed to shrink (min-width:0) so it wraps.
    expect(html).toContain("min-width:0");
  });

  it("uses the premium square design (no rounded action button)", () => {
    const html = buildFeaturePopupHtml(props)!;
    expect(html).toContain("border-radius:0");
    // Eyebrow label for design consistency with the rest of the GIS UI.
    expect(html).toContain("Feature");
  });

  it("caps the number of rows at 12", () => {
    const many: Record<string, string> = {};
    for (let i = 0; i < 30; i += 1) many[`field_${i}`] = `value_${i}`;
    const html = buildFeaturePopupHtml(many)!;
    const rowCount = (html.match(/border-top:1px solid/g) ?? []).length;
    expect(rowCount).toBeLessThanOrEqual(12);
  });
});
