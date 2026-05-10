/**
 * Facility siting and location-allocation engine.
 *
 * Implements browser-safe heuristics for:
 * - P-median
 * - LSCP
 * - MCLP
 * - Equity-aware maximin and constraint-style logic
 *
 * The solver uses greedy construction followed by limited local improvement
 * swaps or pruning so medium-sized candidate sets remain tractable in the UI.
 * Distances are straight-line great-circle approximations rather than network
 * travel times; catchments are circular polygons rather than network isochrones.
 */

export type FacilityOptimisationModel = "p_median" | "lscp" | "mclp";
export type FacilityEquityMode = "none" | "maximin" | "constraint";

export interface FacilityDemandPoint {
  id: string;
  label: string;
  lng: number;
  lat: number;
  demand: number;
  equityGroup?: string;
  properties?: Record<string, string | number | boolean | null>;
}

export interface FacilityCandidateSite {
  id: string;
  label: string;
  lng: number;
  lat: number;
  category?: string;
  fixedOpen?: boolean;
  properties?: Record<string, string | number | boolean | null>;
}

export interface FacilityEquityOptions {
  mode?: FacilityEquityMode;
  objectiveWeight?: number;
  priorityGroups?: string[];
  priorityWeightMultiplier?: number;
  minGroupCoverageRatio?: number;
  maxMeanTravelGapKm?: number;
}

export interface FacilityOptimisationOptions {
  model: FacilityOptimisationModel;
  demandPoints: FacilityDemandPoint[];
  candidateSites: FacilityCandidateSite[];
  facilityCount?: number;
  serviceRadiusKm?: number;
  distanceMatrixKm?: number[][];
  equity?: FacilityEquityOptions;
  scenarioName?: string;
  maxGreedyIterations?: number;
  maxLocalSearchPasses?: number;
  seed?: number;
}

export interface FacilityDemandAssignment {
  demandId: string;
  demandLabel: string;
  demand: number;
  equityGroup: string;
  assignedSiteId: string | null;
  assignedSiteLabel: string | null;
  distanceKm: number | null;
  covered: boolean;
  priorityWeight: number;
}

export interface FacilityChosenSite {
  siteId: string;
  label: string;
  lng: number;
  lat: number;
  category?: string;
  fixedOpen: boolean;
  assignedDemand: number;
  coveredDemand: number;
  assignedDemandCount: number;
  meanAssignedDistanceKm: number | null;
  maxAssignedDistanceKm: number | null;
  servedDemandIds: string[];
}

export interface FacilityCatchment {
  siteId: string;
  label: string;
  radiusKm: number;
  demandWithinCatchment: number;
  demandServedWithinCatchment: number;
  geometry: GeoJSON.Polygon;
}

export interface FacilityEquityGroupDiagnostic {
  group: string;
  demand: number;
  servedDemand: number;
  uncoveredDemand: number;
  coverageRatio: number;
  meanTravelKm: number | null;
  maxTravelKm: number | null;
}

export interface FacilityEquityDiagnostics {
  mode: FacilityEquityMode;
  groups: FacilityEquityGroupDiagnostic[];
  worstGroupCoverageRatio: number;
  bestGroupCoverageRatio: number;
  coverageGap: number;
  maximinCoverageScore: number;
  worstGroupMeanTravelKm: number | null;
  bestGroupMeanTravelKm: number | null;
  meanTravelGapKm: number;
  priorityGroupCoverageRatio: number | null;
  priorityGroupMeanTravelKm: number | null;
  weightedTravelGini: number;
}

export interface FacilityDemandSummary {
  totalDemand: number;
  demandServed: number;
  demandServedRatio: number;
  coveredDemand: number;
  coveredDemandRatio: number;
  uncoveredDemand: number;
  meanTravelBurdenKm: number;
  medianTravelBurdenKm: number;
  maxTravelBurdenKm: number;
}

export interface FacilityEquityAuditRecord {
  demandId: string;
  demandLabel: string;
  equityGroup: string;
  demand: number;
  servedDemand: number;
  coverageRatio: number;
  travelKm: number | null;
}

export interface FacilityEquityAuditBridge {
  serviceLayerLabel: string;
  serviceType: string;
  demographicSource: string;
  records: FacilityEquityAuditRecord[];
}

export interface FacilityOptimisationResult {
  model: FacilityOptimisationModel;
  scenarioName?: string;
  selectedSiteCount: number;
  chosenSites: FacilityChosenSite[];
  assignments: FacilityDemandAssignment[];
  catchments: FacilityCatchment[];
  demandSummary: FacilityDemandSummary;
  equityDiagnostics: FacilityEquityDiagnostics;
  objectiveName: string;
  objectiveValue: number;
  iterations: number;
  localImprovementsAccepted: number;
  serviceRadiusKm: number;
  equityAuditBridge: FacilityEquityAuditBridge;
  notes: string[];
}

type EvaluatedSolution = {
  score: number;
  objectiveValue: number;
  objectiveName: string;
  assignments: FacilityDemandAssignment[];
  chosenSites: FacilityChosenSite[];
  demandSummary: FacilityDemandSummary;
  equityDiagnostics: FacilityEquityDiagnostics;
};

const EARTH_RADIUS_KM = 6371;
const DEFAULT_SERVICE_RADIUS_KM = 2.4;
const DEFAULT_PRIORITY_WEIGHT_MULTIPLIER = 1.4;
const DEFAULT_MAX_GREEDY_ITERATIONS = 256;
const DEFAULT_MAX_LOCAL_SEARCH_PASSES = 4;
const DEFAULT_NOTES = [
  "Travel burden is computed from straight-line great-circle distance, not routed network travel time.",
  "Catchments are rendered as circular service polygons around selected sites rather than full network isochrones.",
  "Optimisation uses greedy construction with local improvement instead of exact mixed-integer programming.",
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(
  leftLng: number,
  leftLat: number,
  rightLng: number,
  rightLat: number,
): number {
  const deltaLat = toRadians(rightLat - leftLat);
  const deltaLng = toRadians(rightLng - leftLng);
  const lat1 = toRadians(leftLat);
  const lat2 = toRadians(rightLat);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[midpoint - 1] ?? 0) + (sorted[midpoint] ?? 0)) / 2;
  }
  return sorted[midpoint] ?? 0;
}

function stableNumber(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((left, right) => left - right);
}

function buildDistanceMatrix(
  demandPoints: FacilityDemandPoint[],
  candidateSites: FacilityCandidateSite[],
): number[][] {
  return demandPoints.map((demand) =>
    candidateSites.map((site) =>
      haversineKm(demand.lng, demand.lat, site.lng, site.lat),
    ),
  );
}

function circlePolygon(
  lng: number,
  lat: number,
  radiusKm: number,
  steps = 28,
): GeoJSON.Polygon {
  const coordinates: number[][] = [];
  const angularDistance = radiusKm / EARTH_RADIUS_KM;
  const latRad = toRadians(lat);
  const lngRad = toRadians(lng);

  for (let step = 0; step <= steps; step += 1) {
    const bearing = (2 * Math.PI * step) / steps;
    const sinLat = Math.sin(latRad);
    const cosLat = Math.cos(latRad);
    const sinAd = Math.sin(angularDistance);
    const cosAd = Math.cos(angularDistance);

    const pointLat = Math.asin(
      sinLat * cosAd + cosLat * sinAd * Math.cos(bearing),
    );
    const pointLng =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * sinAd * cosLat,
        cosAd - sinLat * Math.sin(pointLat),
      );

    coordinates.push([
      ((pointLng * 180) / Math.PI + 540) % 360 - 180,
      (pointLat * 180) / Math.PI,
    ]);
  }

  return {
    type: "Polygon",
    coordinates: [coordinates],
  };
}

function buildPriorityWeightMap(
  demandPoints: FacilityDemandPoint[],
  equity: FacilityEquityOptions | undefined,
): Map<string, number> {
  const priorityGroups = new Set(equity?.priorityGroups ?? []);
  const multiplier = equity?.priorityWeightMultiplier ?? DEFAULT_PRIORITY_WEIGHT_MULTIPLIER;
  const weights = new Map<string, number>();

  for (const demand of demandPoints) {
    const group = demand.equityGroup ?? "all";
    weights.set(demand.id, priorityGroups.has(group) ? multiplier : 1);
  }

  return weights;
}

function weightedGini(values: Array<{ value: number; weight: number }>): number {
  const filtered = values
    .filter((entry) => entry.weight > 0)
    .sort((left, right) => left.value - right.value);
  if (filtered.length === 0) {
    return 0;
  }

  const totalWeight = filtered.reduce((sum, entry) => sum + entry.weight, 0);
  const weightedMean =
    filtered.reduce((sum, entry) => sum + entry.value * entry.weight, 0) /
    Math.max(totalWeight, 1);
  if (weightedMean === 0) {
    return 0;
  }

  let cumulative = 0;
  for (let leftIndex = 0; leftIndex < filtered.length; leftIndex += 1) {
    const left = filtered[leftIndex]!;
    for (let rightIndex = 0; rightIndex < filtered.length; rightIndex += 1) {
      const right = filtered[rightIndex]!;
      cumulative +=
        Math.abs(left.value - right.value) * left.weight * right.weight;
    }
  }

  return clamp(cumulative / (2 * totalWeight * totalWeight * weightedMean), 0, 1);
}

function evaluateSelectedSites(
  options: FacilityOptimisationOptions,
  distanceMatrixKm: number[][],
  selectedSiteIndices: number[],
): EvaluatedSolution {
  const serviceRadiusKm = options.serviceRadiusKm ?? DEFAULT_SERVICE_RADIUS_KM;
  const selected = uniqueSorted(selectedSiteIndices);
  const priorityWeights = buildPriorityWeightMap(options.demandPoints, options.equity);
  const assignments: FacilityDemandAssignment[] = [];
  const siteDemandMap = new Map<number, FacilityDemandAssignment[]>();

  for (const siteIndex of selected) {
    siteDemandMap.set(siteIndex, []);
  }

  let totalDemand = 0;
  let demandServed = 0;
  let coveredDemand = 0;
  let weightedTravelKm = 0;
  let maxTravelBurdenKm = 0;
  const weightedTravelSamples: number[] = [];

  for (let demandIndex = 0; demandIndex < options.demandPoints.length; demandIndex += 1) {
    const demandPoint = options.demandPoints[demandIndex]!;
    totalDemand += demandPoint.demand;

    let nearestSiteIndex = -1;
    let nearestDistanceKm = Number.POSITIVE_INFINITY;

    for (const siteIndex of selected) {
      const distanceKm = distanceMatrixKm[demandIndex]?.[siteIndex] ?? Number.POSITIVE_INFINITY;
      if (distanceKm < nearestDistanceKm) {
        nearestDistanceKm = distanceKm;
        nearestSiteIndex = siteIndex;
      }
    }

    const covered = Number.isFinite(nearestDistanceKm) && nearestDistanceKm <= serviceRadiusKm;
    const priorityWeight = priorityWeights.get(demandPoint.id) ?? 1;
    const assignedSite = nearestSiteIndex >= 0
      ? options.candidateSites[nearestSiteIndex]
      : null;

    if (nearestSiteIndex >= 0) {
      demandServed += demandPoint.demand;
      weightedTravelKm += nearestDistanceKm * demandPoint.demand;
      maxTravelBurdenKm = Math.max(maxTravelBurdenKm, nearestDistanceKm);
      weightedTravelSamples.push(nearestDistanceKm);
      siteDemandMap.get(nearestSiteIndex)?.push({
        demandId: demandPoint.id,
        demandLabel: demandPoint.label,
        demand: demandPoint.demand,
        equityGroup: demandPoint.equityGroup ?? "all",
        assignedSiteId: assignedSite?.id ?? null,
        assignedSiteLabel: assignedSite?.label ?? null,
        distanceKm: stableNumber(nearestDistanceKm),
        covered,
        priorityWeight,
      });
    }

    if (covered) {
      coveredDemand += demandPoint.demand;
    }

    assignments.push({
      demandId: demandPoint.id,
      demandLabel: demandPoint.label,
      demand: demandPoint.demand,
      equityGroup: demandPoint.equityGroup ?? "all",
      assignedSiteId: assignedSite?.id ?? null,
      assignedSiteLabel: assignedSite?.label ?? null,
      distanceKm: Number.isFinite(nearestDistanceKm)
        ? stableNumber(nearestDistanceKm)
        : null,
      covered,
      priorityWeight,
    });
  }

  const groups = new Map<
    string,
    {
      demand: number;
      servedDemand: number;
      uncoveredDemand: number;
      weightedTravelKm: number;
      maxTravelKm: number;
      servedAssignments: number;
    }
  >();

  for (const assignment of assignments) {
    const group = assignment.equityGroup;
    const bucket = groups.get(group) ?? {
      demand: 0,
      servedDemand: 0,
      uncoveredDemand: 0,
      weightedTravelKm: 0,
      maxTravelKm: 0,
      servedAssignments: 0,
    };
    bucket.demand += assignment.demand;
    if (assignment.covered) {
      bucket.servedDemand += assignment.demand;
    } else {
      bucket.uncoveredDemand += assignment.demand;
    }
    if (assignment.distanceKm != null) {
      bucket.weightedTravelKm += assignment.distanceKm * assignment.demand;
      bucket.maxTravelKm = Math.max(bucket.maxTravelKm, assignment.distanceKm);
      bucket.servedAssignments += assignment.demand;
    }
    groups.set(group, bucket);
  }

  const groupDiagnostics: FacilityEquityGroupDiagnostic[] = [...groups.entries()]
    .map(([group, value]) => ({
      group,
      demand: stableNumber(value.demand),
      servedDemand: stableNumber(value.servedDemand),
      uncoveredDemand: stableNumber(value.uncoveredDemand),
      coverageRatio: value.demand > 0 ? stableNumber(value.servedDemand / value.demand) : 0,
      meanTravelKm:
        value.servedAssignments > 0
          ? stableNumber(value.weightedTravelKm / value.servedAssignments)
          : null,
      maxTravelKm: value.servedAssignments > 0 ? stableNumber(value.maxTravelKm) : null,
    }))
    .sort((left, right) => left.group.localeCompare(right.group));

  const coverageRatios = groupDiagnostics.map((entry) => entry.coverageRatio);
  const meanTravelByGroup = groupDiagnostics
    .map((entry) => entry.meanTravelKm)
    .filter((value): value is number => value != null);
  const priorityGroups = new Set(options.equity?.priorityGroups ?? []);
  const priorityGroupEntries = groupDiagnostics.filter((entry) =>
    priorityGroups.has(entry.group),
  );
  const priorityDemand = priorityGroupEntries.reduce((sum, entry) => sum + entry.demand, 0);
  const priorityServedDemand = priorityGroupEntries.reduce((sum, entry) => sum + entry.servedDemand, 0);
  const priorityWeightedTravel =
    assignments
      .filter((entry) => priorityGroups.has(entry.equityGroup) && entry.distanceKm != null)
      .reduce((sum, entry) => sum + (entry.distanceKm ?? 0) * entry.demand, 0);

  const equityDiagnostics: FacilityEquityDiagnostics = {
    mode: options.equity?.mode ?? "none",
    groups: groupDiagnostics,
    worstGroupCoverageRatio: coverageRatios.length > 0 ? Math.min(...coverageRatios) : 0,
    bestGroupCoverageRatio: coverageRatios.length > 0 ? Math.max(...coverageRatios) : 0,
    coverageGap:
      coverageRatios.length > 0
        ? stableNumber(Math.max(...coverageRatios) - Math.min(...coverageRatios))
        : 0,
    maximinCoverageScore:
      coverageRatios.length > 0 ? stableNumber(Math.min(...coverageRatios)) : 0,
    worstGroupMeanTravelKm:
      meanTravelByGroup.length > 0 ? stableNumber(Math.max(...meanTravelByGroup)) : null,
    bestGroupMeanTravelKm:
      meanTravelByGroup.length > 0 ? stableNumber(Math.min(...meanTravelByGroup)) : null,
    meanTravelGapKm:
      meanTravelByGroup.length > 0
        ? stableNumber(Math.max(...meanTravelByGroup) - Math.min(...meanTravelByGroup))
        : 0,
    priorityGroupCoverageRatio:
      priorityDemand > 0 ? stableNumber(priorityServedDemand / priorityDemand) : null,
    priorityGroupMeanTravelKm:
      priorityServedDemand > 0 ? stableNumber(priorityWeightedTravel / priorityServedDemand) : null,
    weightedTravelGini: stableNumber(
      weightedGini(
        assignments
          .filter((entry) => entry.distanceKm != null)
          .map((entry) => ({
            value: entry.distanceKm ?? 0,
            weight: entry.demand,
          })),
      ),
    ),
  };

  const chosenSites: FacilityChosenSite[] = selected.map((siteIndex) => {
    const site = options.candidateSites[siteIndex]!;
    const siteAssignments = siteDemandMap.get(siteIndex) ?? [];
    const assignedDemand = siteAssignments.reduce((sum, entry) => sum + entry.demand, 0);
    const coveredSiteDemand = siteAssignments
      .filter((entry) => entry.covered)
      .reduce((sum, entry) => sum + entry.demand, 0);
    const travelled = siteAssignments
      .filter((entry) => entry.distanceKm != null)
      .map((entry) => entry.distanceKm ?? 0);
    const weightedTravel = siteAssignments.reduce(
      (sum, entry) => sum + (entry.distanceKm ?? 0) * entry.demand,
      0,
    );

    return {
      siteId: site.id,
      label: site.label,
      lng: site.lng,
      lat: site.lat,
      fixedOpen: Boolean(site.fixedOpen),
      assignedDemand: stableNumber(assignedDemand),
      coveredDemand: stableNumber(coveredSiteDemand),
      assignedDemandCount: siteAssignments.length,
      meanAssignedDistanceKm:
        assignedDemand > 0 ? stableNumber(weightedTravel / assignedDemand) : null,
      maxAssignedDistanceKm:
        travelled.length > 0 ? stableNumber(Math.max(...travelled)) : null,
      servedDemandIds: siteAssignments.map((entry) => entry.demandId),
      ...(site.category ? { category: site.category } : {}),
    };
  });

  const meanTravelBurdenKm =
    demandServed > 0 ? stableNumber(weightedTravelKm / demandServed) : 0;
  const demandSummary: FacilityDemandSummary = {
    totalDemand: stableNumber(totalDemand),
    demandServed: stableNumber(demandServed),
    demandServedRatio: totalDemand > 0 ? stableNumber(demandServed / totalDemand) : 0,
    coveredDemand: stableNumber(coveredDemand),
    coveredDemandRatio: totalDemand > 0 ? stableNumber(coveredDemand / totalDemand) : 0,
    uncoveredDemand: stableNumber(Math.max(totalDemand - coveredDemand, 0)),
    meanTravelBurdenKm,
    medianTravelBurdenKm: stableNumber(median(weightedTravelSamples)),
    maxTravelBurdenKm: stableNumber(maxTravelBurdenKm),
  };

  const equityWeight = clamp(options.equity?.objectiveWeight ?? 0.45, 0, 4);
  const equityMode = options.equity?.mode ?? "none";
  let equityAdjustment = 0;
  let constraintPenalty = 0;

  if (equityMode !== "none") {
    equityAdjustment += equityWeight * equityDiagnostics.maximinCoverageScore * totalDemand * 20;
    equityAdjustment -= equityWeight * equityDiagnostics.coverageGap * totalDemand * 12;
    equityAdjustment -= equityWeight * equityDiagnostics.meanTravelGapKm * totalDemand * 2.5;

    if (equityDiagnostics.priorityGroupCoverageRatio != null) {
      equityAdjustment +=
        equityWeight * equityDiagnostics.priorityGroupCoverageRatio * totalDemand * 10;
    }

    if (
      equityMode === "constraint" &&
      options.equity?.minGroupCoverageRatio != null &&
      equityDiagnostics.maximinCoverageScore < options.equity.minGroupCoverageRatio
    ) {
      constraintPenalty +=
        (options.equity.minGroupCoverageRatio - equityDiagnostics.maximinCoverageScore) *
        totalDemand *
        500;
    }
    if (
      equityMode === "constraint" &&
      options.equity?.maxMeanTravelGapKm != null &&
      equityDiagnostics.meanTravelGapKm > options.equity.maxMeanTravelGapKm
    ) {
      constraintPenalty +=
        (equityDiagnostics.meanTravelGapKm - options.equity.maxMeanTravelGapKm) *
        totalDemand *
        120;
    }
  }

  let objectiveName = "Weighted travel burden";
  let objectiveValue = weightedTravelKm;
  let score = -weightedTravelKm + equityAdjustment - constraintPenalty;

  if (options.model === "mclp") {
    objectiveName = "Covered demand";
    objectiveValue = coveredDemand;
    score =
      coveredDemand * 1000 -
      weightedTravelKm * 3 +
      equityAdjustment -
      constraintPenalty;
  } else if (options.model === "lscp") {
    objectiveName = "Sites needed for coverage";
    objectiveValue = selected.length;
    score =
      coveredDemand * 100000 -
      selected.length * 1500 -
      weightedTravelKm * 3 +
      equityAdjustment -
      constraintPenalty;
  }

  return {
    score,
    objectiveName,
    objectiveValue: stableNumber(objectiveValue),
    assignments,
    chosenSites,
    demandSummary,
    equityDiagnostics,
  };
}

function greedyConstruct(
  options: FacilityOptimisationOptions,
  distanceMatrixKm: number[][],
): number[] {
  const fixedOpen = options.candidateSites
    .map((site, index) => (site.fixedOpen ? index : -1))
    .filter((index) => index >= 0);
  const selected = [...fixedOpen];
  const available = options.candidateSites
    .map((_, index) => index)
    .filter((index) => !selected.includes(index));
  const maxIterations = options.maxGreedyIterations ?? DEFAULT_MAX_GREEDY_ITERATIONS;
  const facilityCount = clamp(
    options.facilityCount ?? 1,
    1,
    options.candidateSites.length,
  );

  if (options.model === "lscp") {
    let current = evaluateSelectedSites(options, distanceMatrixKm, selected);
    let iterations = 0;

    while (
      iterations < maxIterations &&
      current.demandSummary.coveredDemandRatio < 0.999 &&
      available.length > 0
    ) {
      iterations += 1;
      let bestCandidateIndex = -1;
      let bestScore = Number.NEGATIVE_INFINITY;

      for (const candidateIndex of available) {
        const evaluated = evaluateSelectedSites(options, distanceMatrixKm, [
          ...selected,
          candidateIndex,
        ]);
        if (evaluated.score > bestScore) {
          bestScore = evaluated.score;
          bestCandidateIndex = candidateIndex;
        }
      }

      if (bestCandidateIndex < 0) {
        break;
      }

      selected.push(bestCandidateIndex);
      const removeIndex = available.indexOf(bestCandidateIndex);
      if (removeIndex >= 0) {
        available.splice(removeIndex, 1);
      }
      current = evaluateSelectedSites(options, distanceMatrixKm, selected);
    }

    return uniqueSorted(selected);
  }

  while (selected.length < facilityCount && available.length > 0) {
    let bestCandidateIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const candidateIndex of available) {
      const evaluated = evaluateSelectedSites(options, distanceMatrixKm, [
        ...selected,
        candidateIndex,
      ]);
      if (evaluated.score > bestScore) {
        bestScore = evaluated.score;
        bestCandidateIndex = candidateIndex;
      }
    }

    if (bestCandidateIndex < 0) {
      break;
    }

    selected.push(bestCandidateIndex);
    const removeIndex = available.indexOf(bestCandidateIndex);
    if (removeIndex >= 0) {
      available.splice(removeIndex, 1);
    }
  }

  return uniqueSorted(selected);
}

function pruneRedundantSites(
  options: FacilityOptimisationOptions,
  distanceMatrixKm: number[][],
  selectedSiteIndices: number[],
): number[] {
  if (selectedSiteIndices.length <= 1) {
    return selectedSiteIndices;
  }

  let selected = uniqueSorted(selectedSiteIndices);
  let improved = true;

  while (improved) {
    improved = false;
    const current = evaluateSelectedSites(options, distanceMatrixKm, selected);

    for (const siteIndex of [...selected]) {
      if (options.candidateSites[siteIndex]?.fixedOpen) {
        continue;
      }

      const candidate = selected.filter((index) => index !== siteIndex);
      const evaluated = evaluateSelectedSites(options, distanceMatrixKm, candidate);
      const coverageOkay =
        evaluated.demandSummary.coveredDemandRatio >= current.demandSummary.coveredDemandRatio - 1e-6;

      if (coverageOkay && evaluated.score >= current.score - 1e-6) {
        selected = candidate;
        improved = true;
        break;
      }
    }
  }

  return uniqueSorted(selected);
}

function localImprove(
  options: FacilityOptimisationOptions,
  distanceMatrixKm: number[][],
  selectedSiteIndices: number[],
): {
  selectedSiteIndices: number[];
  accepted: number;
} {
  let selected = uniqueSorted(selectedSiteIndices);
  let current = evaluateSelectedSites(options, distanceMatrixKm, selected);
  let accepted = 0;
  const maxPasses = options.maxLocalSearchPasses ?? DEFAULT_MAX_LOCAL_SEARCH_PASSES;

  if (options.model === "lscp") {
    selected = pruneRedundantSites(options, distanceMatrixKm, selected);
    current = evaluateSelectedSites(options, distanceMatrixKm, selected);
  }

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let improved = false;
    const selectedSet = new Set(selected);
    const unselected = options.candidateSites
      .map((_, index) => index)
      .filter((index) => !selectedSet.has(index));

    for (const dropIndex of selected) {
      if (options.candidateSites[dropIndex]?.fixedOpen) {
        continue;
      }

      for (const addIndex of unselected) {
        const swapped = uniqueSorted(
          selected.map((index) => (index === dropIndex ? addIndex : index)),
        );
        const evaluated = evaluateSelectedSites(options, distanceMatrixKm, swapped);
        if (evaluated.score > current.score + 1e-6) {
          selected = swapped;
          current = evaluated;
          accepted += 1;
          improved = true;
          break;
        }
      }

      if (improved) {
        break;
      }
    }

    if (!improved) {
      break;
    }
  }

  if (options.model === "lscp") {
    selected = pruneRedundantSites(options, distanceMatrixKm, selected);
  }

  return {
    selectedSiteIndices: uniqueSorted(selected),
    accepted,
  };
}

function buildCatchments(
  serviceRadiusKm: number,
  chosenSites: FacilityChosenSite[],
): FacilityCatchment[] {
  return chosenSites.map((site) => {
    const radiusKm = Math.max(
      serviceRadiusKm,
      (site.maxAssignedDistanceKm ?? serviceRadiusKm) * 1.05,
      0.4,
    );

    return {
      siteId: site.siteId,
      label: site.label,
      radiusKm: stableNumber(radiusKm),
      demandWithinCatchment: stableNumber(site.assignedDemand),
      demandServedWithinCatchment: stableNumber(site.coveredDemand),
      geometry: circlePolygon(site.lng, site.lat, radiusKm),
    };
  });
}

function buildEquityAuditBridge(
  result: Pick<FacilityOptimisationResult, "assignments" | "model" | "scenarioName">,
): FacilityEquityAuditBridge {
  return {
    serviceLayerLabel: result.scenarioName ?? "Facility optimisation result",
    serviceType: `${result.model} facility allocation`,
    demographicSource: "Imported from facility optimisation assignments",
    records: result.assignments.map((assignment) => ({
      demandId: assignment.demandId,
      demandLabel: assignment.demandLabel,
      equityGroup: assignment.equityGroup,
      demand: stableNumber(assignment.demand),
      servedDemand: assignment.covered ? stableNumber(assignment.demand) : 0,
      coverageRatio: assignment.covered ? 1 : 0,
      travelKm: assignment.distanceKm,
    })),
  };
}

function validateOptions(options: FacilityOptimisationOptions): void {
  if (options.demandPoints.length === 0) {
    throw new RangeError("Provide at least one demand point.");
  }
  if (options.candidateSites.length === 0) {
    throw new RangeError("Provide at least one candidate site.");
  }
  if (options.model !== "lscp" && (!options.facilityCount || options.facilityCount < 1)) {
    throw new RangeError(`${options.model} requires a facilityCount of at least 1.`);
  }
  if ((options.model === "mclp" || options.model === "lscp") &&
      !(options.serviceRadiusKm != null && options.serviceRadiusKm > 0)) {
    throw new RangeError(`${options.model} requires a positive serviceRadiusKm.`);
  }
}

export function runFacilityOptimisation(
  options: FacilityOptimisationOptions,
): FacilityOptimisationResult {
  validateOptions(options);
  const distanceMatrixKm = options.distanceMatrixKm ?? buildDistanceMatrix(
    options.demandPoints,
    options.candidateSites,
  );

  const greedy = greedyConstruct(options, distanceMatrixKm);
  const improved = localImprove(options, distanceMatrixKm, greedy);
  const evaluated = evaluateSelectedSites(
    options,
    distanceMatrixKm,
    improved.selectedSiteIndices,
  );
  const serviceRadiusKm = options.serviceRadiusKm ?? DEFAULT_SERVICE_RADIUS_KM;
  const catchments = buildCatchments(serviceRadiusKm, evaluated.chosenSites);

  const baseResult: FacilityOptimisationResult = {
    model: options.model,
    selectedSiteCount: improved.selectedSiteIndices.length,
    chosenSites: evaluated.chosenSites,
    assignments: evaluated.assignments,
    catchments,
    demandSummary: evaluated.demandSummary,
    equityDiagnostics: evaluated.equityDiagnostics,
    objectiveName: evaluated.objectiveName,
    objectiveValue: evaluated.objectiveValue,
    iterations: improved.selectedSiteIndices.length,
    localImprovementsAccepted: improved.accepted,
    serviceRadiusKm: stableNumber(serviceRadiusKm),
    equityAuditBridge: {
      serviceLayerLabel: "",
      serviceType: "",
      demographicSource: "",
      records: [],
    },
    notes: [...DEFAULT_NOTES],
    ...(options.scenarioName ? { scenarioName: options.scenarioName } : {}),
  };

  baseResult.equityAuditBridge = buildEquityAuditBridge(baseResult);

  if (
    options.model === "lscp" &&
    baseResult.demandSummary.coveredDemandRatio < 0.999
  ) {
    baseResult.notes.push(
      "The configured LSCP service radius could not fully cover all demand points; the returned solution maximises feasible coverage with the available candidates.",
    );
  }

  if ((options.equity?.mode ?? "none") !== "none") {
    baseResult.notes.push(
      "Equity-aware scoring modifies site selection using group coverage balance, group travel gaps, and optional priority groups or constraint penalties.",
    );
  }

  return baseResult;
}

export const FACILITY_OPTIMISATION_NOTES = [...DEFAULT_NOTES];
