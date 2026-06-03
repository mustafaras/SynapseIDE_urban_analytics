import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../");

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function sourceSlice(source: string, startNeedle: string, endNeedle: string): string {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start);
  expect(start, `Missing source marker ${startNeedle}`).toBeGreaterThanOrEqual(0);
  expect(end, `Missing source marker ${endNeedle}`).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("Prompt 21 performance budget source contract", () => {
  const compositionSource = readRepoFile("src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx");

  it("keeps attribute tables and diagnostics behind active bottom-panel tab guards", () => {
    const attributesSource = sourceSlice(
      compositionSource,
      "const bottomPanelAttributesContent",
      "const bottomPanelTimelineContent",
    );
    const diagnosticsSource = sourceSlice(
      compositionSource,
      "const bottomPanelDiagnosticsContent",
      "/* ---- Render ---- */",
    );

    expect(attributesSource).toContain("bottomAttributesTabActive");
    expect(attributesSource.indexOf("bottomAttributesTabActive")).toBeLessThan(attributesSource.indexOf("<MapAttributeWorkflowPanel"));
    expect(diagnosticsSource).toContain("bottomDiagnosticsTabActive");
    expect(diagnosticsSource.indexOf("bottomDiagnosticsTabActive")).toBeLessThan(diagnosticsSource.indexOf("<MapPerformanceDiagnosticsPanel"));
    expect(diagnosticsSource).toContain("visible");
  });

  it("keeps raster previews, 3D scene, and embedded model builder behind active activity tabs", () => {
    const rasterSource = sourceSlice(compositionSource, "const sceneRasterElement", "const sceneTemporalElement");
    const scene3DSource = sourceSlice(compositionSource, "const scene3DElement", "const sceneZoningElement");
    const modelBuilderSource = sourceSlice(compositionSource, "const analyzeModelsElement", "const analyzeStatisticsElement");

    expect(rasterSource).toContain("sceneRasterTabActive");
    expect(rasterSource.indexOf("sceneRasterTabActive")).toBeLessThan(rasterSource.indexOf("<RasterLayerPanel"));
    expect(scene3DSource).toContain("scene3DTabActive");
    expect(scene3DSource.indexOf("scene3DTabActive")).toBeLessThan(scene3DSource.indexOf("<Scene3DPanel"));
    expect(modelBuilderSource).toContain("analyzeModelsTabActive");
    expect(modelBuilderSource.indexOf("analyzeModelsTabActive")).toBeLessThan(modelBuilderSource.indexOf("<MapModelBuilderPanel"));
  });

  it("does not mount floating plugin registry or model builder while inactive", () => {
    const pluginSource = sourceSlice(
      compositionSource,
      "{showPluginPanel && !navigatorStageMode ? (",
      "panelName=\"Processing toolbox\"",
    );
    const modelBuilderSource = sourceSlice(
      compositionSource,
      "{showModelBuilder && !navigatorStageMode && !analyzeModelsTabActive ? (",
      "<WorkflowPreviewOverlay",
    );

    expect(pluginSource).toContain("showPluginPanel && !navigatorStageMode ?");
    expect(pluginSource).toContain("<MapPluginPanel");
    expect(pluginSource).toContain("visible");
    expect(modelBuilderSource).toContain("showModelBuilder && !navigatorStageMode && !analyzeModelsTabActive ?");
    expect(modelBuilderSource).toContain("<MapModelBuilderPanel");
    expect(modelBuilderSource).toContain("visible");
  });
});