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

describe("Map Explorer right dock migration", () => {
  const compositionSource = readRepoFile("src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx");

  it("routes QA, CRS, diagnostics, performance, worker retry, and render budget actions to the right dock", () => {
    const retrySource = sourceSlice(compositionSource, "const handleRetryWorkerJob", "const [showProcessingToolbox");
    const scientificQaSource = sourceSlice(compositionSource, "const openScientificQAPanel", "const handleOpenAnalyzeTab");
    const problemsSource = sourceSlice(compositionSource, "const openMapProblems", "const handleToggleCanvasScaleBar");
    const statusSource = sourceSlice(compositionSource, "onOpenCrsReadiness={handleOpenCanvasCrsReadiness}", "lastRenderDurationMs");
    const bannerSource = sourceSlice(compositionSource, "<MapPerformanceBudgetBanner", "{activeRightDockRoute && !navigatorStageMode ? (");

    expect(retrySource).toContain("openDiagnosticsRightDock");
    expect(retrySource).not.toContain("openBottomPanelTab");
    expect(scientificQaSource).toContain('openRightDockPanel("scientificQA"');
    expect(problemsSource).toContain('openRightDockPanel("problems"');
    expect(problemsSource).toContain("toggleRightDockPanel");
    expect(problemsSource).not.toContain("openBottomPanelTab");
    expect(statusSource).toContain("onOpenProblems={() => openMapProblems");
    expect(statusSource).toContain("onOpenDiagnostics={() => openPerformanceRightDock");
    expect(bannerSource).toContain("onOpenDetails");
    expect(bannerSource).toContain("openPerformanceRightDock");
  });

  it("routes attributes, selection, timeline, tasks, collaboration, and measurements to right dock bodies", () => {
    const attributesSource = sourceSlice(compositionSource, "const handleOpenAttributeTable", "const handleAttributeTableSelection");
    const measureToolSource = sourceSlice(compositionSource, "const handleSetMeasureTool", "const handleCancelMeasure");
    const contextMeasureSource = sourceSlice(compositionSource, "const handleStartMeasureFromContext", "const handleStartPolygonFromContext");
    const selectionToolSource = sourceSlice(compositionSource, "const handleSetSelectionDragTool", "const handleToggleCanvasKeyboardHelp");
    const rightDockBodiesSource = sourceSlice(compositionSource, "const rightDockBodyContent", "/* ---- Render ---- */");
    const statusSource = sourceSlice(compositionSource, "onOpenAttributes={handleOpenAttributesFromStatus}", "lastRenderDurationMs");
    const reviewActionsSource = sourceSlice(compositionSource, "const reviewActions", "const figurePageSizeLabel");

    expect(attributesSource).toContain('openRightDockPanel("attributes"');
    expect(attributesSource).not.toContain("bottom panel");
    expect(measureToolSource).toContain("openRightDockPanel");
    expect(measureToolSource).toContain('"measure"');
    expect(contextMeasureSource).toContain("openRightDockPanel(");
    expect(contextMeasureSource).toContain('"measure"');
    expect(contextMeasureSource).not.toContain("setShowMeasurePanel(true)");
    expect(selectionToolSource).toContain("openRightDockPanel");
    expect(selectionToolSource).toContain('"selection"');
    expect(compositionSource).toContain("handleSetSelectedFeatures");
    expect(compositionSource).toContain("handleClearSelectedFeatures");
    expect(rightDockBodiesSource).toContain("rightAttributesDockActive");
    expect(rightDockBodiesSource).toContain("map-right-dock-attributes-body");
    expect(rightDockBodiesSource).toContain("rightSelectionDockActive");
    expect(rightDockBodiesSource).toContain("map-right-dock-selection-body");
    expect(rightDockBodiesSource).toContain("map-right-dock-selection-stats");
    expect(rightDockBodiesSource).toContain("rightTimelineDockActive");
    expect(rightDockBodiesSource).toContain("map-right-dock-timeline-body");
    expect(rightDockBodiesSource).toContain("rightCollaborationDockActive");
    expect(rightDockBodiesSource).toContain("map-right-dock-collaboration-body");
    expect(rightDockBodiesSource).toContain("rightTasksDockActive");
    expect(rightDockBodiesSource).toContain("MapBottomPanelTasksBody");
    expect(rightDockBodiesSource).toContain("rightMeasureDockActive");
    expect(rightDockBodiesSource).toContain("map-right-dock-measure-body");
    expect(compositionSource).toContain('presentation="headless"');
    expect(statusSource).toContain("onOpenSelection={handleOpenSelectionFromStatus}");
    expect(statusSource).toContain("onOpenMeasurements={handleOpenMeasurementsFromStatus}");
    expect(statusSource).toContain('openRightDockPanel("timeline"');
    expect(statusSource).toContain('openRightDockPanel("collaboration"');
    expect(reviewActionsSource).toContain('openRightDockPanel("timeline"');
    expect(reviewActionsSource).not.toContain("bottom panel");
  });
});
