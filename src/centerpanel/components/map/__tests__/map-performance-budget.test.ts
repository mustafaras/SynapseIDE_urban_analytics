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

  it("keeps attribute tables behind the attributes right-dock guard and diagnostics in right-dock routes", () => {
    const attributesSource = sourceSlice(
      compositionSource,
      "if (rightAttributesDockActive)",
      "if (rightSelectionDockActive)",
    );
    const rightDockDiagnosticsSource = sourceSlice(
      compositionSource,
      "const rightDockBodyContent",
      "/* ---- Render ---- */",
    );

    expect(attributesSource).toContain("rightAttributesDockActive");
    expect(attributesSource.indexOf("rightAttributesDockActive")).toBeLessThan(attributesSource.indexOf("<MapAttributeWorkflowPanel"));
    expect(attributesSource).toContain("map-right-dock-attributes-body");
    expect(rightDockDiagnosticsSource).toContain("rightDiagnosticsDockActive");
    expect(rightDockDiagnosticsSource).toContain("rightPerformanceDockActive");
    expect(rightDockDiagnosticsSource.indexOf("rightDiagnosticsDockActive")).toBeLessThan(rightDockDiagnosticsSource.indexOf("<MapPerformanceDiagnosticsPanel"));
    expect(rightDockDiagnosticsSource).toContain("map-right-dock-diagnostics-body");
    expect(rightDockDiagnosticsSource).toContain("map-right-dock-performance-body");
    // Bottom panel diagnostics host is retired — no bottomPanelDiagnosticsContent variable
    expect(compositionSource).not.toContain("const bottomPanelDiagnosticsContent");
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
