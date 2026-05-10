import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import type { MapOutput } from "@/features/urbanAnalytics/lib/types";
import type { GeneratedSQL } from "@/engine/geoai/nlp/types";
import {
  type AgentBasedModelResult,
  type CellularAutomataResult,
  type FacilityOptimisationResult,
  runCompositeIndicatorAnalysis,
} from "@/engine/simulation";
import type { HotSpotResult } from "@/engine/spatial-stats/autocorrelation/GetisOrdGi";
import type { LISAResult } from "@/engine/spatial-stats/autocorrelation/LocalMoransI";
import { queenContiguity, rowStandardize } from "@/engine/spatial-stats/autocorrelation/SpatialWeights";
import { analyse, emergingHotSpotLegend } from "@/engine/spatial-stats/spatiotemporal/EmergingHotSpots";
import { buildCompositeIndicatorDemoDataset } from "@/centerpanel/Flows/compositeIndicatorDemo";
import type {
  ClusterResult,
  GlobalAutocorrelationResult,
  GWRResult,
  OLSResult,
  PCAResult,
  RegressionDiagnostics,
  SpatialFeature,
} from "@/engine/spatial-stats/types";
import {
  adaptABMResult,
  adaptAnalysisMapOutput,
  adaptCAResult,
  adaptClusterResult,
  adaptCompositeIndicatorResult,
  adaptDetectionResult,
  adaptEmergingHotSpotResult,
  adaptFacilityCatchmentsResult,
  adaptFacilitySitesResult,
  adaptGlobalMoranResult,
  adaptGWRResult,
  adaptHotSpotResult,
  adaptLandCoverResult,
  adaptLISAResult,
  adaptOLSResult,
  adaptPCAResult,
  adaptQueryResult,
  adaptSpatialStatsMapOutput,
  collectPendingAnalysisLayers,
  collectPendingSpatialStatsLayers,
  createAnalysisCompletedRun,
  createAnalysisMapOutput,
  createSpatialStatsCompletedRun,
  createSpatialStatsMapOutput,
  rerunSpatialStatsResult,
} from "../MapEngineAdapter";

function makeFeatureCollection(count = 3): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: Array.from({ length: count }, (_, index) => {
      const left = index;
      const right = index + 0.9;
      const top = 1;
      const bottom = 0.1;
      return {
        type: "Feature",
        id: `feature-${index + 1}`,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [left, bottom],
            [right, bottom],
            [right, top],
            [left, top],
            [left, bottom],
          ]],
        },
        properties: {
          id: `feature-${index + 1}`,
          baseline: (index + 1) * 10,
        },
      };
    }),
  };
}

function asCollection(layer: OverlayLayerConfig): GeoJSON.FeatureCollection {
  return layer.sourceData as GeoJSON.FeatureCollection;
}

function makeSpatialFeatures(count = 3): SpatialFeature[] {
  return Array.from({ length: count }, (_, index) => {
    const left = index;
    const right = index + 0.9;
    const top = 1;
    const bottom = 0.1;

    return {
      id: `feature-${index + 1}`,
      centroid: [(left + right) / 2, (top + bottom) / 2],
      rings: [[
        [left, bottom],
        [right, bottom],
        [right, top],
        [left, top],
        [left, bottom],
      ]],
    };
  });
}

function makePointCollection(count = 3): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: Array.from({ length: count }, (_, index) => ({
      type: "Feature",
      id: `point-${index + 1}`,
      geometry: {
        type: "Point",
        coordinates: [index + 0.5, index + 1],
      },
      properties: {
        id: `point-${index + 1}`,
        population: (index + 1) * 2,
      },
    })),
  };
}

function makeValuedFeatureCollection(values: number[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: values.map((value, index) => ({
      type: "Feature",
      id: `valued-${index + 1}`,
      geometry: {
        type: "Polygon",
        coordinates: [[
          [index, 0],
          [index + 0.9, 0],
          [index + 0.9, 0.9],
          [index, 0.9],
          [index, 0],
        ]],
      },
      properties: {
        value,
      },
    })),
  };
}

describe("MapEngineAdapter", () => {
  it("adapts Local Moran's I results into an analysis layer", () => {
    const result: LISAResult = {
      results: [
        { index: 0, localI: 1.8, pValue: 0.01, significant: true, clusterType: "HH" },
        { index: 1, localI: -0.9, pValue: 0.07, significant: false, clusterType: "HL" },
        { index: 2, localI: 1.2, pValue: 0.02, significant: true, clusterType: "LL" },
      ],
      featureProperties: [
        { index: 0, value: 21, zValue: 1.1, spatialLag: 0.9, localI: 1.8, pValue: 0.01, significant: true, clusterType: "HH" },
        { index: 1, value: 14, zValue: -0.3, spatialLag: -0.6, localI: -0.9, pValue: 0.07, significant: false, clusterType: "HL" },
        { index: 2, value: 8, zValue: -1.2, spatialLag: -0.7, localI: 1.2, pValue: 0.02, significant: true, clusterType: "LL" },
      ],
      legend: [],
      summary: {
        HH: 1,
        HL: 0,
        LH: 0,
        LL: 1,
        "not-significant": 1,
      },
      correction: "fdr",
      alpha: 0.05,
      permutations: 999,
    };

    const adapted = adaptLISAResult({
      featureCollection: makeFeatureCollection(),
      result,
      layerId: "lisa-layer",
      parameters: { alpha: 0.05, weights: "queen" },
    });

    const collection = asCollection(adapted.layer);
    expect(adapted.layer.group).toBe("analysis");
    expect(adapted.layer.metadata?.analysisResult?.engine).toBe("LocalMoransI");
    expect(collection.features[0]?.properties?.local_i).toBe(1.8);
    expect(collection.features[0]?.properties?.__lisaCluster).toBe("HH");
    expect(adapted.visualization.kind).toBe("lisa-cluster");
  });

  it("adapts Getis-Ord Gi* results into an analysis layer", () => {
    const result: HotSpotResult = {
      results: [
        { index: 0, giStar: 2.7, zScore: 2.7, pValue: 0.01, confidence: "hot-99" },
        { index: 1, giStar: -2.1, zScore: -2.1, pValue: 0.03, confidence: "cold-95" },
        { index: 2, giStar: 0.1, zScore: 0.1, pValue: 0.92, confidence: "not-significant" },
      ],
      featureProperties: [
        { index: 0, value: 30, giStar: 2.7, zScore: 2.7, pValue: 0.01, confidence: "hot-99" },
        { index: 1, value: 12, giStar: -2.1, zScore: -2.1, pValue: 0.03, confidence: "cold-95" },
        { index: 2, value: 18, giStar: 0.1, zScore: 0.1, pValue: 0.92, confidence: "not-significant" },
      ],
      legend: [],
      summary: {
        "hot-99": 1,
        "hot-95": 0,
        "hot-90": 0,
        "not-significant": 1,
        "cold-90": 0,
        "cold-95": 1,
        "cold-99": 0,
      },
      globalMean: 20,
      globalStd: 6,
      n: 3,
    };

    const adapted = adaptHotSpotResult({
      featureCollection: makeFeatureCollection(),
      result,
      layerId: "hotspot-layer",
      parameters: { selfWeight: true },
    });

    const collection = asCollection(adapted.layer);
    expect(adapted.layer.metadata?.analysisResult?.engine).toBe("GetisOrdGi");
    expect(collection.features[1]?.properties?.gi_star).toBe(-2.1);
    expect(collection.features[1]?.properties?.__hotSpotCategory).toBe("cold-95");
    expect(adapted.visualization.kind).toBe("hotspot");
  });

  it("adapts emerging hot spot results into a temporal spatial-stats layer", () => {
    const weights = rowStandardize(queenContiguity(makeSpatialFeatures(4)));
    const result = analyse(
      [
        { key: "2020", label: "Observed 2020", values: [1, 2, 7, 8] },
        { key: "2021", label: "Observed 2021", values: [1, 3, 8, 9] },
        { key: "2022", label: "Observed 2022", values: [1, 3, 9, 10] },
      ],
      weights,
      { significanceThreshold: 0.05 },
    );

    const adapted = adaptEmergingHotSpotResult({
      featureCollection: makeFeatureCollection(4),
      result: {
        ...result,
        legend: emergingHotSpotLegend(),
      },
      layerId: "emerging-hotspot-layer",
      parameters: { timeFields: ["2020", "2021", "2022"] },
    });

    const collection = asCollection(adapted.layer);
    expect(adapted.layer.metadata?.analysisResult?.engine).toBe("EmergingHotSpots");
    expect(adapted.visualization.kind).toBe("temporal");
    expect(adapted.visualization.temporalFrames).toHaveLength(3);
    expect(adapted.visualization.legendEntries).toHaveLength(8);
    expect(collection.features[0]?.properties?.emerging_hotspot_reason).toBeTypeOf("string");
    expect(collection.features[0]?.properties?.time_label).toBe("Observed 2020");
  });

  it("adapts Global Moran's I into a summary overlay layer", () => {
    const result: GlobalAutocorrelationResult = {
      statistic: "Moran's I",
      observed: 0.41,
      expected: -0.5,
      variance: 0.02,
      zScore: 3.4,
      pValue: 0.002,
      permutations: 999,
    };

    const adapted = adaptGlobalMoranResult({
      result,
      layerId: "global-moran-summary",
      parameters: { permutations: 999 },
    });

    expect(adapted.layer.metadata?.analysisResult?.engine).toBe("GlobalMoransI");
    expect(asCollection(adapted.layer).features).toHaveLength(0);
    expect(adapted.visualization.kind).toBe("stat-summary");
    expect(adapted.visualization.summaryMetrics?.[0]?.label).toBe("Observed");
  });

  it("adapts OLS residuals into a choropleth layer", () => {
    const result: OLSResult = {
      coefficients: [1, 2],
      standardErrors: [0.1, 0.2],
      tStatistics: [10, 10],
      pValues: [0.001, 0.001],
      rSquared: 0.84,
      adjRSquared: 0.79,
      aic: 12.3,
      bic: 15.2,
      logLikelihood: -4.5,
      residuals: new Float64Array([1.2, -0.5, 0.8]),
      fittedValues: new Float64Array([9.8, 11.5, 13.2]),
      n: 3,
      k: 1,
    };
    const diagnostics: RegressionDiagnostics = {
      jarqueBera: [1.2, 0.54],
      breuschPagan: [0.7, 0.71],
      vif: [1.3],
      moransIResiduals: [0.28, 0.03],
    };

    const adapted = adaptOLSResult({
      featureCollection: makeFeatureCollection(),
      result,
      diagnostics,
      layerId: "ols-residuals",
      parameters: { dependent: "price", predictors: ["access"] },
    });

    const collection = asCollection(adapted.layer);
    expect(collection.features[0]?.properties?.residual).toBe(1.2);
    expect(collection.features[1]?.properties?.__analysisClassIndex).not.toBeUndefined();
    expect(adapted.layer.metadata?.analysisResult?.statisticalSummary.rSquared).toBe(0.84);
    expect(adapted.visualization.valueField).toBe("residual");
  });

  it("adapts GWR results into a local R squared choropleth", () => {
    const result: GWRResult = {
      localCoefficients: [[1, 0.4], [1.2, 0.5], [1.4, 0.6]],
      localStandardErrors: [[0.1, 0.08], [0.1, 0.09], [0.12, 0.1]],
      localTStatistics: [[10, 5], [12, 5.5], [11.7, 6]],
      localRSquared: new Float64Array([0.41, 0.63, 0.78]),
      residuals: new Float64Array([0.9, -0.4, 0.1]),
      fittedValues: new Float64Array([11, 13, 15]),
      bandwidth: 2.5,
      kernel: "bisquare",
      aicc: 14.7,
      effectiveParams: 2.1,
      sigma2: 0.12,
      n: 3,
      k: 1,
      hatDiag: new Float64Array([0.2, 0.25, 0.3]),
      coords: [[0, 0], [1, 0], [2, 0]],
    };

    const adapted = adaptGWRResult({
      featureCollection: makeFeatureCollection(),
      result,
      parameterLabels: ["Intercept", "Income"],
      layerId: "gwr-local-r2",
    });

    const collection = asCollection(adapted.layer);
    expect(collection.features[0]?.properties?.local_r_squared).toBe(0.41);
    expect(collection.features[0]?.properties?.coef_income).toBe(0.4);
    expect(adapted.layer.metadata?.analysisResult?.statisticalSummary.bandwidth).toBe(2.5);
    expect(adapted.visualization.valueField).toBe("local_r_squared");
  });

  it("adapts PCA scores into a component choropleth", () => {
    const result: PCAResult = {
      eigenvalues: [2.4, 0.9],
      varianceExplained: [0.6, 0.225],
      cumulativeVariance: [0.6, 0.825],
      loadings: [[0.7, -0.2], [0.4, 0.8]],
      scores: [[1.2, -0.4], [0.2, 0.3], [-1.4, 0.1]],
      kaiserComponents: 1,
    };

    const adapted = adaptPCAResult({
      featureCollection: makeFeatureCollection(),
      result,
      componentIndex: 1,
      layerId: "pca-component-2",
    });

    const collection = asCollection(adapted.layer);
    expect(collection.features[0]?.properties?.component_2_score).toBe(-0.4);
    expect(adapted.layer.metadata?.analysisResult?.statisticalSummary.selectedComponent).toBe(2);
    expect(adapted.visualization.valueField).toBe("component_2_score");
  });

  it("adapts cluster analysis into a typology layer with labels", () => {
    const result: ClusterResult = {
      labels: [0, 1, 0],
      k: 2,
      silhouetteScores: [0.42, 0.51, 0.36],
      meanSilhouette: 0.43,
      wcss: [1.2, 0.9],
      totalWcss: 2.1,
    };

    const adapted = adaptClusterResult({
      featureCollection: makeFeatureCollection(),
      result,
      layerId: "cluster-typology",
      labelPrefix: "Typology",
    });

    const collection = asCollection(adapted.layer);
    expect(collection.features[1]?.properties?.cluster_label).toBe("Typology 2");
    expect(adapted.layer.metadata?.analysisResult?.statisticalSummary.clusterCount).toBe(2);
    expect(adapted.visualization.labelField).toBe("cluster_label");
  });

  it("adapts land-cover classification tiles into semantic polygons", () => {
    const probabilities = new Float32Array(12);
    probabilities[0] = 0.93;
    probabilities[5] = 0.87;

    const adapted = adaptLandCoverResult({
      result: {
        width: 2,
        height: 1,
        labels: new Uint8Array([0, 2]),
        probabilities,
      },
      bounds: [0, 0, 2, 1],
      layerId: "land-cover-grid",
    });

    const collection = asCollection(adapted.layer);
    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.properties?.__landCoverClass).toBe("built_up");
    expect(collection.features[1]?.properties?.land_cover_class).toBe("Water");
    expect(adapted.visualization.kind).toBe("land-cover");
    expect(adapted.visualization.legendEntries?.[0]?.color).toBe("#E74C3C");
  });

  it("adapts object detections with thresholded boxes and labels", () => {
    const adapted = adaptDetectionResult({
      result: {
        detections: [
          {
            className: "car",
            confidence: 0.91,
            bbox: [0, 0, 1, 1],
          },
          {
            className: "tree",
            confidence: 0.32,
            bbox: [1, 0, 2, 1],
          },
        ],
        classLabels: ["car", "tree"],
      },
      confidenceThreshold: 0.5,
      layerId: "detections",
    });

    const collection = asCollection(adapted.layer);
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]?.properties?.detection_class).toBe("car");
    expect(adapted.layer.style?.__labelField).toBe("__detectionLabel");
    expect(adapted.visualization.kind).toBe("detection");
    expect(adapted.visualization.confidenceThreshold).toBe(0.5);
    expect(collection.features[0]?.id).toBe("detection-1");
  });

  it("round-trips query highlight outputs through the generic analysis bridge", () => {
    const result: GeneratedSQL = {
      sql: "SELECT * FROM parcels WHERE zoning = 'MXD'",
      parse: {
        intent: "filter",
        confidence: 0.94,
        entities: [],
        explanation: "Filter parcels by zoning.",
        warnings: [],
      },
      safe: true,
      referencedLayers: ["parcels"],
      spatialFunctions: [],
      interpretation: {
        classifiedIntent: "filter",
        intentConfidence: 0.94,
        recognisedLayers: ["parcels"],
        recognisedAttributes: ["zoning"],
        distancesDetected: [],
        thresholdsDetected: [],
        aggregationFunctions: [],
        spatialRelations: [],
      },
    };

    const adapted = adaptQueryResult({
      featureCollection: makeFeatureCollection(2),
      result,
      queryText: "show mixed-use parcels",
      executionScope: "explicit-demo-data",
      sourceTableIds: ["demo_parcels"],
      layerId: "query-highlight",
    });

    const output = createAnalysisMapOutput(adapted);
    const roundTrip = adaptAnalysisMapOutput(output);

    expect(roundTrip?.layer.metadata?.analysisResult?.engine).toBe("QueryToSQL");
    expect(roundTrip?.visualization.kind).toBe("query-highlight");
    expect(asCollection(roundTrip!.layer).features[0]?.properties?.query_match).toBe(true);
    expect(asCollection(adapted.layer).features[0]?.properties?.query_execution_scope).toBe("explicit-demo-data");
    expect(adapted.layer.sourceKind).toBe("demo");
    expect(adapted.layer.metadata?.analysisResult?.statisticalSummary.executionScope).toBe("explicit-demo-data");
  });

  it("preserves temporal CA frames and validation metadata through generic map outputs", () => {
    const result: CellularAutomataResult = {
      scenarioName: "Transit corridor",
      valueField: "value",
      frames: [
        {
          step: 0,
          label: "Observed 2020",
          featureCollection: makeValuedFeatureCollection([1, 2]),
        },
        {
          step: 1,
          label: "Transit corridor step 1",
          featureCollection: makeValuedFeatureCollection([3, 4]),
        },
      ],
      calibration: {
        neighborhoodRadius: 1,
        urbanThreshold: 0.5,
        maxSlope: 0.7,
        growthRate: 0.12,
        meanNewUrbanCells: 4,
        spontaneousGrowthShare: 0.08,
        suitabilityWeight: 0.42,
        neighborhoodWeight: 0.38,
        structureWeight: 0.2,
        slopePenalty: 0.18,
        neighborhoodThreshold: 0.16,
        structureThreshold: 0.22,
        minTransitionScore: 0.35,
        transitionSampleSize: 18,
        stableSampleSize: 42,
      },
      predictedStates: [
        { width: 2, height: 1, step: 0, label: "Observed 2020", values: [1, 0] },
        { width: 2, height: 1, step: 1, label: "Transit corridor step 1", values: [1, 1] },
      ],
      observedState: { width: 2, height: 1, step: 1, label: "Observed 2026", values: [1, 1] },
      validation: {
        figureOfMerit: 0.61,
        overallAccuracy: 0.88,
        kappa: 0.72,
        kappaChange: 0.58,
        fitQuality: "strong",
        confusion: {
          urban: {
            truePositive: 8,
            falsePositive: 2,
            falseNegative: 1,
            trueNegative: 13,
          },
          change: {
            hits: 5,
            misses: 1,
            falseAlarms: 2,
            correctRejections: 16,
          },
        },
      },
      constraintSummary: {
        protectedCells: 5,
        waterCells: 4,
        steepSlopeCells: 3,
        structureLimitedCells: 6,
      },
      stepSummaries: [
        {
          step: 0,
          label: "Observed 2020",
          newUrbanCells: 0,
          totalUrbanCells: 1,
          targetNewUrbanCells: 0,
          eligibleCandidateCells: 0,
          meanSelectedScore: 0,
        },
        {
          step: 1,
          label: "Transit corridor step 1",
          newUrbanCells: 1,
          totalUrbanCells: 2,
          targetNewUrbanCells: 1,
          eligibleCandidateCells: 3,
          meanSelectedScore: 0.63,
        },
      ],
      simplifications: ["Binary urban-state simulation for interactive scenario comparison."],
    };

    const adapted = adaptCAResult({
      result,
      layerId: "ca-playback",
    });

    const output = createAnalysisMapOutput(adapted);
    const roundTrip = adaptAnalysisMapOutput(output);

    expect(adapted.visualization.kind).toBe("temporal");
    expect(adapted.visualization.temporalFrames).toHaveLength(2);
    expect(roundTrip?.visualization.temporalFrames?.[1]?.key).toBe("1");
    expect(asCollection(roundTrip!.layer).features[0]?.properties?.time_step).toBe(0);
    expect(
      adapted.layer.metadata?.analysisResult?.statisticalSummary.scenarioName,
    ).toBe("Transit corridor");
    expect(
      adapted.layer.metadata?.analysisResult?.statisticalSummary.figureOfMerit,
    ).toBe(0.61);
    expect(
      adapted.layer.metadata?.analysisResult?.statisticalSummary.changedCellCount,
    ).toBe(1);
  });

  it("bridges facility-optimisation catchments and selected sites through generic map outputs", () => {
    const result: FacilityOptimisationResult = {
      model: "mclp",
      scenarioName: "Clinic siting",
      selectedSiteCount: 2,
      chosenSites: [
        {
          siteId: "site-1",
          label: "West Hub",
          lng: 29,
          lat: 41.01,
          category: "public_land",
          fixedOpen: false,
          assignedDemand: 800,
          coveredDemand: 760,
          assignedDemandCount: 3,
          meanAssignedDistanceKm: 1.2,
          maxAssignedDistanceKm: 2.1,
          servedDemandIds: ["d1", "d2", "d3"],
        },
        {
          siteId: "site-2",
          label: "East Hub",
          lng: 29.04,
          lat: 41.03,
          category: "co_location",
          fixedOpen: true,
          assignedDemand: 600,
          coveredDemand: 540,
          assignedDemandCount: 2,
          meanAssignedDistanceKm: 1.35,
          maxAssignedDistanceKm: 2.3,
          servedDemandIds: ["d4", "d5"],
        },
      ],
      assignments: [
        {
          demandId: "d1",
          demandLabel: "North",
          demand: 300,
          equityGroup: "general",
          assignedSiteId: "site-1",
          assignedSiteLabel: "West Hub",
          distanceKm: 1.1,
          covered: true,
          priorityWeight: 1,
        },
        {
          demandId: "d2",
          demandLabel: "South",
          demand: 280,
          equityGroup: "low_income",
          assignedSiteId: "site-2",
          assignedSiteLabel: "East Hub",
          distanceKm: 2.4,
          covered: false,
          priorityWeight: 1.4,
        },
      ],
      catchments: [
        {
          siteId: "site-1",
          label: "West Hub",
          radiusKm: 2.2,
          demandWithinCatchment: 800,
          demandServedWithinCatchment: 760,
          geometry: {
            type: "Polygon",
            coordinates: [[[29, 41], [29.01, 41], [29.01, 41.01], [29, 41.01], [29, 41]]],
          },
        },
        {
          siteId: "site-2",
          label: "East Hub",
          radiusKm: 2.2,
          demandWithinCatchment: 600,
          demandServedWithinCatchment: 540,
          geometry: {
            type: "Polygon",
            coordinates: [[[29.03, 41.02], [29.04, 41.02], [29.04, 41.03], [29.03, 41.03], [29.03, 41.02]]],
          },
        },
      ],
      demandSummary: {
        totalDemand: 1400,
        demandServed: 1400,
        demandServedRatio: 1,
        coveredDemand: 1300,
        coveredDemandRatio: 0.9286,
        uncoveredDemand: 100,
        meanTravelBurdenKm: 1.28,
        medianTravelBurdenKm: 1.2,
        maxTravelBurdenKm: 2.4,
      },
      equityDiagnostics: {
        mode: "maximin",
        groups: [
          {
            group: "general",
            demand: 900,
            servedDemand: 860,
            uncoveredDemand: 40,
            coverageRatio: 0.9556,
            meanTravelKm: 1.12,
            maxTravelKm: 1.9,
          },
          {
            group: "low_income",
            demand: 500,
            servedDemand: 440,
            uncoveredDemand: 60,
            coverageRatio: 0.88,
            meanTravelKm: 1.6,
            maxTravelKm: 2.4,
          },
        ],
        worstGroupCoverageRatio: 0.88,
        bestGroupCoverageRatio: 0.9556,
        coverageGap: 0.0756,
        maximinCoverageScore: 0.88,
        worstGroupMeanTravelKm: 1.6,
        bestGroupMeanTravelKm: 1.12,
        meanTravelGapKm: 0.48,
        priorityGroupCoverageRatio: 0.88,
        priorityGroupMeanTravelKm: 1.6,
        weightedTravelGini: 0.12,
      },
      objectiveName: "Covered demand",
      objectiveValue: 1300,
      iterations: 2,
      localImprovementsAccepted: 1,
      serviceRadiusKm: 2.2,
      equityAuditBridge: {
        serviceLayerLabel: "Clinic siting",
        serviceType: "mclp facility allocation",
        demographicSource: "Imported from facility optimisation assignments",
        records: [
          {
            demandId: "d1",
            demandLabel: "North",
            equityGroup: "general",
            demand: 300,
            servedDemand: 300,
            coverageRatio: 1,
            travelKm: 1.1,
          },
        ],
      },
      notes: ["Greedy plus local improvement."],
    };

    const catchments = adaptFacilityCatchmentsResult({
      result,
      layerId: "facility-catchments",
    });
    const sites = adaptFacilitySitesResult({
      result,
      layerId: "facility-sites",
    });

    const catchmentRoundTrip = adaptAnalysisMapOutput(createAnalysisMapOutput(catchments));
    const siteRoundTrip = adaptAnalysisMapOutput(createAnalysisMapOutput(sites));

    expect(catchments.layer.metadata?.analysisResult?.engine).toBe("FacilityOptimisation");
    expect(catchments.visualization.kind).toBe("facility-allocation");
    expect(asCollection(catchmentRoundTrip!.layer).features).toHaveLength(2);
    expect(asCollection(siteRoundTrip!.layer).features[0]?.geometry?.type).toBe("Point");
    expect(
      sites.layer.metadata?.analysisResult?.statisticalSummary.maximinCoverageScore,
    ).toBe(0.88);
  });

  it("bridges composite-indicator outputs through the generic analysis map contract", () => {
    const dataset = buildCompositeIndicatorDemoDataset();
    const result = runCompositeIndicatorAnalysis(dataset, {
      scenarioName: "Adapter scenario",
      selectedIndicatorIds: [
        "transit_access",
        "green_space",
        "pm25",
        "housing_burden",
      ],
      imputation: { method: "mean" },
      normalization: { method: "min_max" },
      weighting: { method: "equal" },
      aggregation: { method: "additive" },
      sensitivity: {
        runs: 50,
        weightPerturbation: 0.1,
        indicatorNoise: 0.03,
        confidenceLevel: 0.9,
        topK: 3,
        randomSeed: 20260412,
      },
    });

    const adapted = adaptCompositeIndicatorResult({
      result,
      layerId: "composite-indicator",
      layerName: "Composite Indicator",
      parameters: {
        weightingMethod: result.weightingMethod,
      },
    });

    const output = createAnalysisMapOutput(adapted);
    const roundTrip = adaptAnalysisMapOutput(output);

    expect(adapted.layer.metadata?.analysisResult?.engine).toBe("CompositeIndicator");
    expect(adapted.visualization.kind).toBe("choropleth");
    expect(adapted.visualization.valueField).toBe(result.valueField);
    expect(asCollection(roundTrip!.layer).features).toHaveLength(dataset.units.length);
    expect(
      adapted.layer.metadata?.analysisResult?.statisticalSummary.robustnessTier,
    ).toBe(result.sensitivity.robustnessTier);
    expect(
      asCollection(roundTrip!.layer).features[0]?.properties?.[result.valueField],
    ).toBeDefined();
  });

  it("collects generic analysis layers from completed runs", () => {
    const result: AgentBasedModelResult = {
      agents: makePointCollection(2),
      weightField: "population",
    };

    const adapted = adaptABMResult({
      result,
      layerId: "abm-density",
    });
    const run = createAnalysisCompletedRun(adapted, {
      flowId: "review",
    });

    const pending = collectPendingAnalysisLayers([run], []);
    const skipped = collectPendingAnalysisLayers([run], ["abm-density"]);

    expect(adapted.layer.type).toBe("heatmap");
    expect(adapted.visualization.kind).toBe("agent-density");
    expect(pending).toHaveLength(1);
    expect(pending[0]?.layer.id).toBe("abm-density");
    expect(skipped).toHaveLength(0);
  });

  it("round-trips spatial-stats map outputs through the bridge", () => {
    const adapted = adaptHotSpotResult({
      featureCollection: makeFeatureCollection(),
      result: {
        results: [
          { index: 0, giStar: 2.7, zScore: 2.7, pValue: 0.01, confidence: "hot-99" },
          { index: 1, giStar: -2.1, zScore: -2.1, pValue: 0.03, confidence: "cold-95" },
          { index: 2, giStar: 0.1, zScore: 0.1, pValue: 0.92, confidence: "not-significant" },
        ],
        featureProperties: [
          { index: 0, value: 30, giStar: 2.7, zScore: 2.7, pValue: 0.01, confidence: "hot-99" },
          { index: 1, value: 12, giStar: -2.1, zScore: -2.1, pValue: 0.03, confidence: "cold-95" },
          { index: 2, value: 18, giStar: 0.1, zScore: 0.1, pValue: 0.92, confidence: "not-significant" },
        ],
        legend: [],
        summary: {
          "hot-99": 1,
          "hot-95": 0,
          "hot-90": 0,
          "not-significant": 1,
          "cold-90": 0,
          "cold-95": 1,
          "cold-99": 0,
        },
        globalMean: 20,
        globalStd: 6,
        n: 3,
      },
      layerId: "hotspot-roundtrip",
    });

    const output = createSpatialStatsMapOutput(adapted);
    const roundTrip = adaptSpatialStatsMapOutput(output);

    expect(roundTrip?.layer.id).toBe("hotspot-roundtrip");
    expect(roundTrip?.layer.metadata?.analysisResult?.engine).toBe("GetisOrdGi");
    expect(asCollection(roundTrip!.layer).features[0]?.properties?.__hotSpotCategory).toBe("hot-99");
  });

  it("registers rerun handlers in bridge outputs and replays them with the same token", async () => {
    const base = adaptGlobalMoranResult({
      result: {
        statistic: "Moran's I",
        observed: 0.31,
        expected: -0.5,
        variance: 0.03,
        zScore: 2.7,
        pValue: 0.007,
        permutations: 999,
      },
      layerId: "global-rerun",
    });

    const output = createSpatialStatsMapOutput(base, {
      rerunToken: "rerun-token",
      rerunHandler: () =>
        adaptGlobalMoranResult({
          result: {
            statistic: "Moran's I",
            observed: 0.52,
            expected: -0.5,
            variance: 0.03,
            zScore: 3.8,
            pValue: 0.001,
            permutations: 999,
          },
          layerId: "global-rerun",
        }),
    });

    expect(output.engineBridge?.rerunToken).toBe("rerun-token");

    const rerun = await rerunSpatialStatsResult("rerun-token");
    expect(rerun?.layer.metadata?.analysisResult?.rerunToken).toBe("rerun-token");
    expect(rerun?.layer.metadata?.analysisResult?.statisticalSummary.observed).toBe(0.52);
  });

  it("collects only missing spatial-stats layers from completed runs", () => {
    const output = createSpatialStatsMapOutput(
      adaptGlobalMoranResult({
        result: {
          statistic: "Moran's I",
          observed: 0.18,
          expected: -0.5,
          variance: 0.04,
          zScore: 1.8,
          pValue: 0.07,
          permutations: 499,
        },
        layerId: "completed-run-layer",
      }),
    );

    const run = {
      runId: "run-1",
      flowId: "review",
      label: "Mock Run",
      insertedAt: "2026-04-11T12:00:00.000Z",
      paragraph: "summary",
      paragraphPreview: "summary",
      paragraphFull: "summary",
      mapOutputs: [output] as MapOutput[],
      chartOutputs: [],
      dataOutputs: [],
    } as const;

    const pending = collectPendingSpatialStatsLayers([run], []);
    const skipped = collectPendingSpatialStatsLayers([run], ["completed-run-layer"]);

    expect(pending).toHaveLength(1);
    expect(pending[0]?.layer.id).toBe("completed-run-layer");
    expect(skipped).toHaveLength(0);
  });

  it("builds a completed run from a spatial stats adapter result", () => {
    const adapted = adaptGlobalMoranResult({
      result: {
        statistic: "Moran's I",
        observed: 0.27,
        expected: -0.5,
        variance: 0.03,
        zScore: 2.4,
        pValue: 0.016,
        permutations: 999,
      },
      layerId: "global-run-record",
      runId: "global-run-record-id",
      parameters: { permutations: 999 },
    });

    const run = createSpatialStatsCompletedRun(adapted, {
      flowId: "review",
    });

    expect(run.runId).toBe("global-run-record-id");
    expect(run.flowId).toBe("review");
    expect(run.mapOutputs).toHaveLength(1);
    expect(run.mapOutputs[0]?.engineBridge?.engine).toBe("GlobalMoransI");
    expect(run.paragraph).toContain("Global Moran's I");
  });
});
