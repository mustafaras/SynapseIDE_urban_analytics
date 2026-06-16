import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readMapFile(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("right dock single-column layout contracts (p11)", () => {
  it("uses a single-column control stack in LayerStyleEditor", () => {
    const source = readMapFile("src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx");
    expect(source).toContain("const gridStyle: React.CSSProperties = {");
    expect(source).toContain('gridTemplateColumns: "minmax(0, 1fr)"');
    expect(source).toContain('data-testid="map-layer-style-single-column-fields"');
  });

  it("stacks cartography before/after previews vertically", () => {
    const source = readMapFile("src/centerpanel/components/map/CartographyRecommendationList.tsx");
    expect(source).toContain("const previewGridStyle: React.CSSProperties = {");
    expect(source).toContain('gridTemplateColumns: "minmax(0, 1fr)"');
    expect(source).toContain('data-testid="map-cartography-preview-single-column"');
  });

  it("marks right dock style/report/selection bodies as single-column and uses GisPropertyGrid for AOI rows", () => {
    const source = readMapFile("src/centerpanel/components/map/controllers/MapRightDockBodyContent.tsx");
    expect(source).toContain("GisPropertyGrid");
    expect(source).toContain('data-testid="map-right-dock-aoi-analysis-properties"');
    expect(source).toContain('data-right-dock-layout="single-column"');
  });
});
