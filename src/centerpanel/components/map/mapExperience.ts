import type { LayerQaStatus, OverlayLayerConfig } from "./mapTypes";

export type MapWorkspaceView = "navigator" | "explore" | "analyze";

export type MapQuickActionId =
  | "import-data"
  | "review-layers"
  | "review-problems"
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

export type MapWorkspaceReadinessTone = "foundational" | "operational" | "delivery" | "blocked";
export type MapWorkspaceReadinessState =
  | "no-data"
  | "data-loaded"
  | "invisible-layers"
  | "stale-analysis"
  | "missing-aoi"
  | "qa-blockers"
  | "publish-ready";
export type MapWorkspaceStepStatus = "complete" | "current" | "upcoming";

export interface MapWorkspaceReadinessStep {
  id: "load-data" | "curate-stack" | "frame-analysis" | "publish-story";
  label: string;
  description: string;
  status: MapWorkspaceStepStatus;
}

export interface MapWorkspaceReadiness {
  state: MapWorkspaceReadinessState;
  score: number;
  label: string;
  tone: MapWorkspaceReadinessTone;
  focusLabel: string;
  narrative: string;
  rationale: string;
  nextActionId: MapQuickActionId;
  nextActionLabel: string;
  nextActionDescription: string;
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
    id: "review-problems",
    label: "Review Problems",
    description: "Open QA Problems to inspect blockers, CRS caveats, source warnings, and publication readiness issues.",
    targetView: "analyze",
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

export function hasMapLayerSourceEvidence(layer: OverlayLayerConfig): boolean {
  const metadata = layer.metadata;
  return Boolean(layer.sourceData)
    || Boolean(layer.sourceKind)
    || Boolean(layer.provenance)
    || typeof metadata?.featureCount === "number"
    || Boolean(metadata?.sourceId)
    || Boolean(metadata?.sourceStorageMode)
    || Boolean(metadata?.sourceRestoreStatus)
    || Boolean(metadata?.importSource)
    || Boolean(metadata?.analysisResult)
    || Boolean(metadata?.datasetContext)
    || Boolean(metadata?.columnar)
    || Boolean(metadata?.eoSource)
    || Boolean(metadata?.externalService)
    || Boolean(metadata?.raster)
    || Boolean(metadata?.vectorTiles)
    || Boolean(metadata?.registry)
    || Boolean(metadata?.reproducibilityManifest)
    || Boolean(metadata?.evidenceArtifactId);
}

function resolveReadinessFacts(args: {
  overlayLayers: OverlayLayerConfig[];
  pinCount: number;
  drawnFeatureCount: number;
  measurementCount: number;
  lastSavedAt?: string | null;
  hasActiveAoi?: boolean;
  qaStatus?: LayerQaStatus;
  qaIssueCount?: number;
  qaBlockerCount?: number;
  visiblePublicationLayerCount?: number;
}) {
  const layerCount = args.overlayLayers.length;
  const sourceLayerCount = args.overlayLayers.filter(hasMapLayerSourceEvidence).length;
  const visibleLayerCount = args.overlayLayers.filter((layer) => layer.visible).length;
  const visibleSourceLayerCount = args.overlayLayers.filter((layer) => layer.visible && hasMapLayerSourceEvidence(layer)).length;
  const analysisLayerCount = args.overlayLayers.filter((layer) => (layer.group ?? "data") === "analysis").length;
  const staleLayerCount = args.overlayLayers.filter((layer) => layer.metadata?.analysisResult?.stale).length;
  const hasData = sourceLayerCount > 0;
  const hasVisibleData = visibleSourceLayerCount > 0;
  const hasActiveAoi = args.hasActiveAoi ?? args.drawnFeatureCount > 0;
  const qaStatus = args.qaStatus ?? "unchecked";
  const qaIssueCount = args.qaIssueCount ?? 0;
  const qaBlockerCount = args.qaBlockerCount ?? (qaStatus === "error" ? 1 : 0);
  const visiblePublicationLayerCount = args.visiblePublicationLayerCount ?? visibleSourceLayerCount;
  const hasPublicationLayer = visiblePublicationLayerCount > 0 && hasVisibleData;
  const hasSavedState = Boolean(args.lastSavedAt);
  const hasDecisionLayer = analysisLayerCount > 0 || args.pinCount > 0;

  return {
    layerCount,
    sourceLayerCount,
    visibleLayerCount,
    visibleSourceLayerCount,
    analysisLayerCount,
    staleLayerCount,
    hasData,
    hasVisibleData,
    hasActiveAoi,
    qaStatus,
    qaIssueCount,
    qaBlockerCount,
    visiblePublicationLayerCount,
    hasPublicationLayer,
    hasSavedState,
    hasDecisionLayer,
  } as const;
}

export function getRecommendedMapQuickAction(args: {
  overlayLayers: OverlayLayerConfig[];
  pinCount: number;
  drawnFeatureCount: number;
  measurementCount: number;
  hasActiveAoi?: boolean;
  qaStatus?: LayerQaStatus;
  qaIssueCount?: number;
  qaBlockerCount?: number;
  visiblePublicationLayerCount?: number;
  lastSavedAt?: string | null;
}): MapQuickActionId {
  const facts = resolveReadinessFacts(args);

  if (!facts.hasData) {
    return "import-data";
  }

  if (!facts.hasVisibleData || facts.staleLayerCount > 0) {
    return "review-layers";
  }

  if (
    facts.qaBlockerCount > 0 ||
    facts.qaIssueCount > 0 ||
    facts.qaStatus === "error" ||
    facts.qaStatus === "warning" ||
    facts.qaStatus === "unchecked"
  ) {
    return "review-problems";
  }

  if (!facts.hasActiveAoi) {
    return "draw-aoi";
  }

  if (facts.analysisLayerCount === 0) {
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
  hasActiveAoi?: boolean;
  qaStatus?: LayerQaStatus;
  qaIssueCount?: number;
  qaBlockerCount?: number;
  visiblePublicationLayerCount?: number;
}): MapWorkspaceReadiness {
  const facts = resolveReadinessFacts(args);
  const qaPassed = facts.qaStatus === "passed" && facts.qaBlockerCount === 0;
  const state: MapWorkspaceReadinessState = !facts.hasData
    ? "no-data"
    : !facts.hasVisibleData
      ? "invisible-layers"
      : facts.qaBlockerCount > 0 || facts.qaStatus === "error"
        ? "qa-blockers"
        : facts.staleLayerCount > 0
          ? "stale-analysis"
          : facts.qaStatus === "unchecked"
            ? "data-loaded"
            : !facts.hasActiveAoi
              ? "missing-aoi"
              : facts.hasPublicationLayer && qaPassed && facts.hasSavedState
                ? "publish-ready"
                : "data-loaded";

  const rawScore = Math.max(
    0,
    Math.min(
      100,
      (facts.hasData ? 20 : 0)
        + (facts.hasVisibleData ? 20 : 0)
        + (facts.staleLayerCount === 0 && facts.hasVisibleData ? 12 : 0)
        + (qaPassed ? 18 : facts.qaStatus === "warning" ? 8 : 0)
        + (facts.hasActiveAoi ? 14 : 0)
        + (facts.hasPublicationLayer ? 12 : 0)
        + (facts.hasSavedState ? 8 : 0)
        + (facts.hasDecisionLayer ? 8 : 0),
    ),
  );
  const stateScoreCap: Record<MapWorkspaceReadinessState, number> = {
    "no-data": 10,
    "invisible-layers": 35,
    "qa-blockers": 45,
    "stale-analysis": 58,
    "data-loaded": 74,
    "missing-aoi": 84,
    "publish-ready": 100,
  };
  const score = state === "publish-ready" ? 100 : Math.min(rawScore, stateScoreCap[state]);

  const currentStepId: MapWorkspaceReadinessStep["id"] | null = !facts.hasData
    ? "load-data"
    : !facts.hasVisibleData || facts.staleLayerCount > 0 || facts.qaBlockerCount > 0 || facts.qaStatus === "unchecked"
      ? "curate-stack"
      : !facts.hasActiveAoi
        ? "frame-analysis"
        : state !== "publish-ready"
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
  if (facts.hasData) completedSteps.add("load-data");
  if (facts.hasVisibleData && facts.staleLayerCount === 0 && facts.qaBlockerCount === 0 && facts.qaStatus !== "unchecked") {
    completedSteps.add("curate-stack");
  }
  if (facts.hasActiveAoi) completedSteps.add("frame-analysis");
  if (state === "publish-ready") completedSteps.add("publish-story");

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

  if (state === "no-data") {
    return {
      state,
      score,
      label: "No Data",
      tone: "foundational",
      focusLabel: "Import Data",
      narrative: "The cockpit has no source-backed layer to evaluate yet.",
      rationale: facts.layerCount > 0
        ? "Layer placeholders exist, but none carry source data, source kind, or metadata evidence. Import or restore a trusted source before claiming readiness."
        : "No working layers are loaded yet. Start with a trusted dataset or teaching fixture so the rest of the workspace has concrete spatial context.",
      nextActionId: "import-data",
      nextActionLabel: "Import Data",
      nextActionDescription: "Load or restore a source-backed spatial layer before QA, AOI framing, or publishing.",
      sequence,
    };
  }

  if (state === "invisible-layers") {
    return {
      state,
      score,
      label: "Invisible Layers",
      tone: "foundational",
      focusLabel: "Reveal Layers",
      narrative: "Source-backed data exists, but no source-backed layer is visible on the map.",
      rationale: "Reveal at least one data layer before AOI framing, QA interpretation, or export can be considered meaningful.",
      nextActionId: "review-layers",
      nextActionLabel: "Review Layers",
      nextActionDescription: "Open the layer stack and turn on the source-backed layers that should drive the current map.",
      sequence,
    };
  }

  if (state === "qa-blockers") {
    return {
      state,
      score,
      label: "QA Blockers",
      tone: "blocked",
      focusLabel: "Review Problems",
      narrative: "Scientific QA blockers prevent this map from being represented as publication-ready.",
      rationale: `${facts.qaBlockerCount} blocker${facts.qaBlockerCount === 1 ? "" : "s"} or error state must be resolved before formal output, dispatch, or report handoff.`,
      nextActionId: "review-problems",
      nextActionLabel: "Review Problems",
      nextActionDescription: "Open QA Problems and resolve blockers before proceeding.",
      sequence,
    };
  }

  if (state === "stale-analysis") {
    return {
      state,
      score,
      label: "Stale Analysis",
      tone: "operational",
      focusLabel: "Refresh Outputs",
      narrative: "At least one analysis layer is stale relative to its source state.",
      rationale: "Review the layer stack and rerun or remove stale outputs so the cockpit reflects the current data, not an old analytical snapshot.",
      nextActionId: "review-layers",
      nextActionLabel: "Review Stale Layers",
      nextActionDescription: "Open the layer stack and inspect stale analysis outputs before continuing.",
      sequence,
    };
  }

  if (state === "missing-aoi") {
    return {
      state,
      score,
      label: "Missing AOI",
      tone: "operational",
      focusLabel: "Draw AOI",
      narrative: "Data is visible and checked, but the map still lacks an explicit study area.",
      rationale: "Draw or select an AOI so downstream workflows and review artifacts have a bounded spatial frame instead of relying on a transient viewport.",
      nextActionId: "draw-aoi",
      nextActionLabel: "Draw AOI",
      nextActionDescription: "Create a polygon study area for analysis, review, and report handoff.",
      sequence,
    };
  }

  if (state === "publish-ready") {
    return {
      state,
      score: 100,
      label: "Publish Ready",
      tone: "delivery",
      focusLabel: "Publish",
      narrative: "Source-backed visible layers, QA, AOI framing, publication candidates, and saved project state are all in place.",
      rationale: "The current map has real source state, a checked stack, explicit spatial context, and a persisted project state. It can move into figure, data export, package, or report handoff.",
      nextActionId: "export-map",
      nextActionLabel: "Publish",
      nextActionDescription: "Open Publish to export the current figure, data package, or report-ready map evidence.",
      sequence,
    };
  }

  const shouldSaveBeforeHandoff =
    facts.hasPublicationLayer &&
    !facts.hasSavedState &&
    facts.hasActiveAoi &&
    facts.qaStatus !== "unchecked" &&
    facts.qaBlockerCount === 0;

  return {
    state,
    score,
    label: "Data Loaded",
    tone: "operational",
    focusLabel: facts.qaStatus === "unchecked"
      ? "Review Readiness"
      : shouldSaveBeforeHandoff
        ? "Save State"
        : "Prepare Output",
    narrative: facts.qaStatus === "unchecked"
      ? "Source-backed data is visible, but QA has not checked the current stack yet."
      : shouldSaveBeforeHandoff
        ? "The map has publishable layers, but it still needs a saved project state before formal handoff."
        : "Data is loaded and visible; continue framing, styling, or saving before claiming publication readiness.",
    rationale: facts.qaStatus === "unchecked"
      ? "Run or review QA before treating the layer stack as operationally safe."
      : shouldSaveBeforeHandoff
        ? "Save the map state so the current visible stack, context, and publish candidates can be restored."
        : "The cockpit has real source state, but not every readiness requirement is satisfied yet.",
    nextActionId: shouldSaveBeforeHandoff ? "save-project" : "review-problems",
    nextActionLabel: shouldSaveBeforeHandoff ? "Save Project" : "Review Readiness",
    nextActionDescription: shouldSaveBeforeHandoff
      ? "Persist the current Map Explorer project state before formal export."
      : "Open QA Problems to confirm blockers, warnings, CRS state, and publication readiness.",
    sequence,
  };
}
