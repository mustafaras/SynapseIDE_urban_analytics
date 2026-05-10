import type { OverlayLayerConfig } from "./mapTypes";

export type MapWorkspaceView = "navigator" | "explore" | "analyze";

export type MapQuickActionId =
  | "import-data"
  | "review-layers"
  | "open-pins"
  | "draw-aoi"
  | "measure"
  | "theme-data"
  | "export-map"
  | "save-project";

export interface MapWorkspaceViewMeta {
  id: MapWorkspaceView;
  label: string;
  description: string;
}

export interface MapQuickActionMeta {
  id: MapQuickActionId;
  label: string;
  description: string;
  targetView: MapWorkspaceView;
}

export type MapWorkspaceReadinessTone = "foundational" | "operational" | "delivery";
export type MapWorkspaceStepStatus = "complete" | "current" | "upcoming";

export interface MapWorkspaceReadinessStep {
  id: "load-data" | "curate-stack" | "frame-analysis" | "publish-story";
  label: string;
  description: string;
  status: MapWorkspaceStepStatus;
}

export interface MapWorkspaceReadiness {
  score: number;
  label: string;
  tone: MapWorkspaceReadinessTone;
  focusLabel: string;
  narrative: string;
  rationale: string;
  sequence: readonly MapWorkspaceReadinessStep[];
}

export const MAP_WORKSPACE_VIEWS: readonly MapWorkspaceViewMeta[] = [
  {
    id: "navigator",
    label: "Navigator",
    description: "See what the map can do and pick the next action without hunting through the toolbar.",
  },
  {
    id: "explore",
    label: "Explore",
    description: "Review layers, search places, inspect attributes, and organize the current map state.",
  },
  {
    id: "analyze",
    label: "Analyze",
    description: "Prepare AOIs, measure geometry, style datasets, and produce map-ready analytical outputs.",
  },
] as const;

export const MAP_QUICK_ACTIONS: readonly MapQuickActionMeta[] = [
  {
    id: "import-data",
    label: "Import Data",
    description: "Open GeoJSON, CSV, Arrow, or GeoParquet files with schema preview, memory estimates, and worker-ready columnar transfer.",
    targetView: "explore",
  },
  {
    id: "review-layers",
    label: "Review Layers",
    description: "Open the layer stack, check visibility, and inspect stale analysis outputs.",
    targetView: "explore",
  },
  {
    id: "open-pins",
    label: "Pins And Notes",
    description: "Jump into pin mode and manage map bookmarks or field notes.",
    targetView: "explore",
  },
  {
    id: "draw-aoi",
    label: "Draw AOI",
    description: "Create a polygon or rectangle study area for downstream spatial analysis.",
    targetView: "analyze",
  },
  {
    id: "measure",
    label: "Measure",
    description: "Start a distance or area measurement session on the active map view.",
    targetView: "analyze",
  },
  {
    id: "theme-data",
    label: "Theme Data",
    description: "Open thematic styling and analysis panels for choropleth and point layers.",
    targetView: "analyze",
  },
  {
    id: "export-map",
    label: "Export",
    description: "Package the current map state as GeoJSON or a presentation image.",
    targetView: "explore",
  },
  {
    id: "save-project",
    label: "Save Project",
    description: "Persist the current map workspace into the selected project record.",
    targetView: "explore",
  },
] as const;

export function getMapWorkspaceHint(view: MapWorkspaceView): string {
  const match = MAP_WORKSPACE_VIEWS.find((entry) => entry.id === view);
  return match?.description ?? "Use the map workspace to inspect, analyze, and publish spatial layers.";
}

export function getRecommendedMapQuickAction(args: {
  overlayLayers: OverlayLayerConfig[];
  pinCount: number;
  drawnFeatureCount: number;
  measurementCount: number;
}): MapQuickActionId {
  const analysisCount = args.overlayLayers.filter((layer) => (layer.group ?? "data") === "analysis").length;

  if (args.overlayLayers.length === 0) {
    return "import-data";
  }

  if (args.drawnFeatureCount === 0) {
    return "draw-aoi";
  }

  if (analysisCount === 0) {
    return "theme-data";
  }

  if (args.measurementCount === 0) {
    return "measure";
  }

  if (args.pinCount === 0) {
    return "open-pins";
  }

  return "export-map";
}

export function getMapWorkspaceReadiness(args: {
  overlayLayers: OverlayLayerConfig[];
  pinCount: number;
  drawnFeatureCount: number;
  measurementCount: number;
  lastSavedAt?: string | null;
}): MapWorkspaceReadiness {
  const layerCount = args.overlayLayers.length;
  const visibleLayerCount = args.overlayLayers.filter((layer) => layer.visible).length;
  const analysisLayerCount = args.overlayLayers.filter((layer) => (layer.group ?? "data") === "analysis").length;
  const staleLayerCount = args.overlayLayers.filter((layer) => layer.metadata?.analysisResult?.stale).length;

  const hasLayers = layerCount > 0;
  const hasCuratedStack = hasLayers && visibleLayerCount > 0 && staleLayerCount === 0;
  const hasSpatialFraming = args.drawnFeatureCount > 0 || args.measurementCount > 0;
  const hasDecisionLayer = analysisLayerCount > 0 || args.pinCount > 0;
  const hasSavedState = Boolean(args.lastSavedAt);

  const score = Math.max(
    0,
    Math.min(
      100,
      (hasLayers ? 25 : 0)
        + (hasCuratedStack ? 20 : 0)
        + (hasSpatialFraming || analysisLayerCount > 0 ? 25 : 0)
        + (hasDecisionLayer ? 15 : 0)
        + (hasSavedState ? 15 : 0),
    ),
  );

  const currentStepId: MapWorkspaceReadinessStep["id"] | null = !hasLayers
    ? "load-data"
    : !hasCuratedStack
      ? "curate-stack"
      : !(hasSpatialFraming || analysisLayerCount > 0)
        ? "frame-analysis"
        : !(hasDecisionLayer && hasSavedState)
          ? "publish-story"
          : null;

  const stepCatalog: readonly Omit<MapWorkspaceReadinessStep, "status">[] = [
    {
      id: "load-data",
      label: "Load Data",
      description: "Bring in the working layers that define the current spatial question.",
    },
    {
      id: "curate-stack",
      label: "Curate Stack",
      description: "Clean visibility, opacity, and stale analysis before you interpret anything.",
    },
    {
      id: "frame-analysis",
      label: "Frame Analysis",
      description: "Draw AOIs or measurement context so the map has analytical boundaries.",
    },
    {
      id: "publish-story",
      label: "Publish Story",
      description: "Save, annotate, and export once the map is ready to brief or share.",
    },
  ];

  const completedSteps = new Set<MapWorkspaceReadinessStep["id"]>();
  if (hasLayers) completedSteps.add("load-data");
  if (hasCuratedStack) completedSteps.add("curate-stack");
  if (hasSpatialFraming || analysisLayerCount > 0) completedSteps.add("frame-analysis");
  if (hasDecisionLayer && hasSavedState) completedSteps.add("publish-story");

  const currentStepIndex = currentStepId == null
    ? stepCatalog.length
    : stepCatalog.findIndex((step) => step.id === currentStepId);

  const sequence = stepCatalog.map((step, index) => ({
    ...step,
    status: completedSteps.has(step.id)
      ? "complete"
      : index === currentStepIndex
        ? "current"
        : "upcoming",
  })) satisfies readonly MapWorkspaceReadinessStep[];

  if (!hasLayers) {
    return {
      score,
      label: "Foundational",
      tone: "foundational",
      focusLabel: "Load Data",
      narrative: "The map canvas is structurally ready, but it still needs layers before it can support a planning decision.",
      rationale: "No working layers are loaded yet. Start with a trusted dataset or teaching fixture so the rest of the workspace has something concrete to organize.",
      sequence,
    };
  }

  if (!hasCuratedStack) {
    return {
      score,
      label: "Foundational",
      tone: "foundational",
      focusLabel: "Curate Stack",
      narrative: "Data is present, but the layer stack still needs to be made legible before analysis becomes credible.",
      rationale: visibleLayerCount === 0
        ? "Layers exist, but none are visible. Re-enable the layers you want to inspect before you draw or analyse."
        : "Some analysis layers are stale. Reconcile visibility and rerun stale outputs so the map reflects the current data state.",
      sequence,
    };
  }

  if (!(hasSpatialFraming || analysisLayerCount > 0)) {
    return {
      score,
      label: "Operational",
      tone: "operational",
      focusLabel: "Frame Analysis",
      narrative: "The map has a clean layer stack and is ready to move from browsing into focused spatial work.",
      rationale: "Your layers are staged. Add an AOI or a measurement pass so the next analytical outputs are anchored to a clear study frame.",
      sequence,
    };
  }

  if (!(hasDecisionLayer && hasSavedState)) {
    return {
      score,
      label: "Operational",
      tone: "operational",
      focusLabel: "Publish Story",
      narrative: "The workspace is analytically active, but it still needs a saved narrative footprint before it becomes briefing-ready.",
      rationale: !hasDecisionLayer
        ? "You have framing geometry, but no analytical or narrative layer yet. Theme the data, pin field notes, or generate a result layer before you export."
        : "The map already contains decision-ready output. Save the current state so the project can be restored and shared without rebuilding the scene.",
      sequence,
    };
  }

  return {
    score,
    label: "Delivery Ready",
    tone: "delivery",
    focusLabel: "Maintain And Export",
    narrative: "Layers, framing, and saved state are all in place. The workspace can now support briefing, export, or collaborative review.",
    rationale: "The current map has both analytical context and a persisted project state. Use the quick actions to export a clean spatial story or refine the last delivery details.",
    sequence,
  };
}