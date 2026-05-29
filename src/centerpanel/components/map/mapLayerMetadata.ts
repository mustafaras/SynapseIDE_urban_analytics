import type {
  LayerCrsSummary,
  LayerGeometrySummary,
  LayerGroupId,
  LayerLicenseAttributionSummary,
  LayerMetadataSource,
  LayerProvenance,
  LayerQaStatus,
  LayerRegistryMetadata,
  LayerSchemaFieldRole,
  LayerSchemaFieldSummary,
  LayerSchemaSummary,
  LayerSourceKind,
  MapLayerReadinessSummary,
  OverlayLayerConfig,
} from "./mapTypes";

const DEFAULT_GROUP: LayerGroupId = "data";
const QUERYABLE_LAYER_TYPES = new Set<OverlayLayerConfig["type"]>(["geojson", "heatmap"]);
const FALLBACK_GEOMETRY_TYPE = "Unknown";

function compactText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function uniqueTexts(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map(compactText).filter((value): value is string => Boolean(value))));
}

function inferSchemaRole(fieldName: string): LayerSchemaFieldRole {
  const normalized = fieldName.toLowerCase();
  if (["geom", "geometry", "the_geom", "wkb_geometry"].includes(normalized)) return "geometry";
  if (["id", "fid", "objectid", "ogc_fid", "feature_id"].includes(normalized)) return "identifier";
  if (normalized.includes("date") || normalized.includes("time") || normalized.includes("year")) return "temporal";
  return "attribute";
}

function buildFieldSummary(fieldName: string): LayerSchemaFieldSummary {
  return {
    name: fieldName,
    role: inferSchemaRole(fieldName),
  };
}

function isRemoteSource(sourceData: OverlayLayerConfig["sourceData"]): boolean {
  return typeof sourceData === "string" && /^https?:\/\//i.test(sourceData);
}

/**
 * Canonical, permanent caveat attached to every user-declared CRS. A declared
 * CRS is an analyst assertion, never verified truth — this note must survive
 * every downstream read (see {@link resolveOverlayLayerCrsSummary}).
 */
export const USER_DECLARED_CRS_CAVEAT =
  "User-declared CRS (caveat): asserted by an analyst, not verified from source metadata. Distance and area results inherit this uncertainty.";

/** Normalize a CRS token the way MapProjectionService does, without importing proj4 side effects into this widely-used module. */
function normalizeDeclaredCrs(crs: string): string {
  return crs.trim().toUpperCase().replace(/^EPSG::/, "EPSG:");
}

/**
 * Build the canonical summary for a user-declared CRS. The `status` stays a
 * known *value* (so projected metric work can proceed once declared) while the
 * provenance is pinned to `"user-declared"` and the permanent caveat is always
 * present. This never produces a verified/authoritative shape.
 */
export function buildUserDeclaredCrsSummary(crs: string): LayerCrsSummary {
  return {
    crs: normalizeDeclaredCrs(crs),
    status: "known",
    source: "user-declared",
    notes: [USER_DECLARED_CRS_CAVEAT],
  };
}

export function resolveOverlayLayerSourceKind(
  layer: OverlayLayerConfig,
  group: LayerGroupId = layer.group ?? DEFAULT_GROUP,
): LayerSourceKind {
  if (layer.sourceKind) return layer.sourceKind;
  if (layer.metadata?.registry?.sourceKind) return layer.metadata.registry.sourceKind;
  if (group === "analysis" || layer.metadata?.analysisResult) return "derived";
  if (layer.metadata?.datasetContext?.isDemo || layer.metadata?.eoSource?.isDemo) return "demo";
  if (layer.metadata?.datasetContext?.datasetId) return "demo";
  if (layer.metadata?.eoSource || layer.metadata?.externalService || isRemoteSource(layer.sourceData)) return "external";
  if (layer.sourceData) return "imported";
  return "project";
}

export function resolveOverlayLayerQaStatus(layer: OverlayLayerConfig): LayerQaStatus {
  if (layer.qaStatus === "error") return "error";
  if (layer.metadata?.scientificQA?.status === "error") return "error";
  if (layer.metadata?.analysisResult?.stale) return "warning";
  if (layer.qaStatus && layer.qaStatus !== "unchecked") return layer.qaStatus;
  if (layer.metadata?.scientificQA?.status) return layer.metadata.scientificQA.status;
  if (layer.metadata?.registry?.qaStatus) return layer.metadata.registry.qaStatus;
  return layer.qaStatus ?? "unchecked";
}

export function resolveOverlayLayerQueryable(layer: OverlayLayerConfig): boolean {
  return layer.queryable ?? layer.metadata?.registry?.queryable ?? QUERYABLE_LAYER_TYPES.has(layer.type);
}

function resolveOverlayLayerProvenanceWithSource(layer: OverlayLayerConfig): {
  provenance: LayerProvenance;
  source: LayerMetadataSource;
  fallback: boolean;
} {
  if (layer.provenance) {
    return { provenance: layer.provenance, source: "explicit", fallback: false };
  }

  if (layer.metadata?.registry?.provenance) {
    return { provenance: layer.metadata.registry.provenance, source: "explicit", fallback: false };
  }

  const analysis = layer.metadata?.analysisResult;
  if (analysis) {
    return {
      provenance: {
        label: analysis.parameterSummary || `${analysis.engine} result`,
        method: analysis.engine,
        generatedAt: analysis.runTimestamp,
        ...(analysis.sourceLayerIds ? { sourceLayerIds: analysis.sourceLayerIds } : {}),
      },
      source: "analysis-result",
      fallback: false,
    };
  }

  const dataset = layer.metadata?.datasetContext;
  if (dataset?.source || dataset?.datasetTitle || dataset?.license) {
    return {
      provenance: {
        label: dataset.source ?? dataset.datasetTitle ?? "Teaching dataset",
        ...(dataset.datasetTitle ? { sourceName: dataset.datasetTitle } : {}),
        ...(dataset.license ? { license: dataset.license } : {}),
      },
      source: "dataset-context",
      fallback: false,
    };
  }

  const importSource = layer.metadata?.importSource;
  if (importSource) {
    return {
      provenance: {
        label: `${importSource.format.toUpperCase()} import`,
        sourceName: importSource.sourceName,
        ...(importSource.sourceUri ? { sourceUrl: importSource.sourceUri } : {}),
        ...(importSource.license ? { license: importSource.license } : {}),
        ...(importSource.attribution ? { attribution: importSource.attribution } : {}),
        method: "Browser spatial file import",
        collectedAt: importSource.importedAt,
        generatedAt: importSource.importedAt,
        notes: importSource.caveats,
      },
      source: "import-source",
      fallback: false,
    };
  }

  const external = layer.metadata?.externalService;
  if (external) {
    const sourceName = external.title ?? external.layerName ?? external.endpoint;
    const sourceUrl = external.urlTemplate ?? external.endpoint;
    return {
      provenance: {
        label: sourceName,
        sourceName,
        sourceUrl,
        ...(external.refreshedAt ? { collectedAt: external.refreshedAt } : {}),
      },
      source: "external-service",
      fallback: false,
    };
  }

  const eoSource = layer.metadata?.eoSource;
  if (eoSource) {
    return {
      provenance: {
        label: eoSource.sourceRef || eoSource.provider,
        sourceName: eoSource.provider,
        ...(eoSource.sourceUrl ? { sourceUrl: eoSource.sourceUrl } : {}),
      },
      source: "eo-source",
      fallback: false,
    };
  }

  if (typeof layer.sourceData === "string" && layer.sourceData.length > 0) {
    return {
      provenance: {
        label: layer.sourceData,
        ...(isRemoteSource(layer.sourceData) ? { sourceUrl: layer.sourceData } : {}),
      },
      source: isRemoteSource(layer.sourceData) ? "external-service" : "feature-collection",
      fallback: false,
    };
  }

  const sourceKind = resolveOverlayLayerSourceKind(layer);
  return {
    provenance: { label: `${sourceKind} layer` },
    source: "legacy-default",
    fallback: true,
  };
}

export function resolveOverlayLayerProvenance(layer: OverlayLayerConfig): LayerProvenance {
  return resolveOverlayLayerProvenanceWithSource(layer).provenance;
}

export function resolveOverlayLayerCrsSummary(layer: OverlayLayerConfig): LayerCrsSummary {
  const metadata = layer.metadata;

  // A user-declared CRS is a caveated assertion: preserve its provenance and
  // re-attach the permanent caveat on every read, so it can never be silently
  // upgraded to an authoritative ("explicit") source downstream.
  const declared = metadata?.crsSummary;
  if (declared?.source === "user-declared") {
    const declaredCrs = compactText(declared.crs);
    if (declaredCrs) {
      return buildUserDeclaredCrsSummary(declaredCrs);
    }
  }

  const crs = compactText(metadata?.crsSummary?.crs)
    ?? compactText(metadata?.importSource?.declaredCrs)
    ?? compactText(metadata?.datasetContext?.crs)
    ?? compactText(metadata?.columnar?.crs)
    ?? compactText(metadata?.eoSource?.crs)
    ?? compactText(metadata?.externalService?.crs)
    ?? compactText(metadata?.registry?.crsSummary.crs);

  if (crs) {
    const source: LayerMetadataSource = metadata?.crsSummary?.crs
      ? "explicit"
      : metadata?.importSource?.declaredCrs
        ? "import-source"
      : metadata?.datasetContext?.crs
        ? "dataset-context"
        : metadata?.columnar?.crs
          ? "columnar"
          : metadata?.eoSource?.crs
            ? "eo-source"
            : metadata?.externalService?.crs
              ? "external-service"
              : "explicit";
    return {
      crs,
      status: "known",
      source,
      notes: [],
    };
  }

  return {
    crs: null,
    status: "missing",
    source: metadata?.registry?.crsSummary.source ?? "legacy-default",
    notes: ["CRS is not declared; analytical distance and area claims require projection metadata."],
  };
}

export function resolveOverlayLayerCrs(layer: OverlayLayerConfig): string | undefined {
  return resolveOverlayLayerCrsSummary(layer).crs ?? undefined;
}

function resolveFeatureCount(layer: OverlayLayerConfig): number | null {
  return layer.metadata?.featureCount
    ?? layer.metadata?.geometrySummary?.featureCount
    ?? layer.metadata?.registry?.featureCount
    ?? layer.metadata?.vectorTiles?.originalFeatureCount
    ?? layer.metadata?.columnar?.rowCount
    ?? layer.metadata?.datasetContext?.packageFeatureCount
    ?? null;
}

export function resolveOverlayLayerGeometrySummary(layer: OverlayLayerConfig): LayerGeometrySummary {
  const metadata = layer.metadata;
  const featureCount = resolveFeatureCount(layer);
  const registryGeometry = metadata?.registry?.geometrySummary;
  const geometryTypes = uniqueTexts([
    metadata?.geometrySummary?.geometryType,
    ...(metadata?.geometrySummary?.geometryTypes ?? []),
    metadata?.geometryType,
    ...(metadata?.columnar?.geometryTypes ?? []),
    registryGeometry?.geometryType,
  ]);
  const geometryType = geometryTypes[0] ?? FALLBACK_GEOMETRY_TYPE;
  const source: LayerMetadataSource = metadata?.geometrySummary
    ? "explicit"
    : metadata?.geometryType || metadata?.fields
      ? "feature-collection"
      : metadata?.columnar?.geometryTypes?.length
        ? "columnar"
        : registryGeometry && registryGeometry.geometryType !== FALLBACK_GEOMETRY_TYPE
          ? registryGeometry.source
          : "legacy-default";

  return {
    geometryType,
    geometryTypes: geometryTypes.length > 0 ? geometryTypes : [],
    featureCount,
    source,
    notes: geometryType === FALLBACK_GEOMETRY_TYPE ? ["Geometry type is not declared in layer metadata."] : [],
    ...(metadata?.bounds ? { bounds: metadata.bounds } : metadata?.geometrySummary?.bounds ? { bounds: metadata.geometrySummary.bounds } : {}),
  };
}

export function resolveOverlayLayerSchemaSummary(layer: OverlayLayerConfig): LayerSchemaSummary {
  const metadata = layer.metadata;
  if (metadata?.schemaSummary) return metadata.schemaSummary;

  const fieldNames = uniqueTexts([
    ...(metadata?.fields ?? []),
    ...(metadata?.datasetContext?.schemaSummary ?? []),
    metadata?.columnar?.geometryColumn,
  ]);
  const geometryField = compactText(metadata?.columnar?.geometryColumn);
  const fields = fieldNames.map(buildFieldSummary);

  if (fields.length > 0) {
    return {
      fieldCount: fields.length,
      fields,
      source: metadata?.fields?.length ? "feature-collection" : metadata?.columnar?.geometryColumn ? "columnar" : "dataset-context",
      notes: [],
      ...(geometryField ? { geometryField } : {}),
    };
  }

  const registrySchema = metadata?.registry?.schemaSummary;
  if (registrySchema && registrySchema.fieldCount > 0) return registrySchema;

  return {
    fieldCount: 0,
    fields: [],
    source: "legacy-default",
    notes: ["Schema fields are not declared for this layer."],
  };
}

export function resolveOverlayLayerLicenseAttribution(layer: OverlayLayerConfig): LayerLicenseAttributionSummary {
  const metadata = layer.metadata;
  const provenanceInfo = resolveOverlayLayerProvenanceWithSource(layer);
  const license = compactText(metadata?.licenseAttribution?.license)
    ?? compactText(layer.provenance?.license)
    ?? compactText(metadata?.importSource?.license)
    ?? compactText(metadata?.datasetContext?.license)
    ?? compactText(metadata?.externalService?.license)
    ?? compactText(metadata?.registry?.licenseAttribution.license)
    ?? compactText(provenanceInfo.provenance.license);
  const attribution = compactText(metadata?.licenseAttribution?.attribution)
    ?? compactText(layer.provenance?.attribution)
    ?? compactText(metadata?.importSource?.attribution)
    ?? compactText(metadata?.externalService?.attribution)
    ?? compactText(metadata?.externalService?.title)
    ?? compactText(metadata?.externalService?.layerName)
    ?? compactText(metadata?.eoSource?.provider)
    ?? compactText(metadata?.registry?.licenseAttribution.attribution)
    ?? compactText(provenanceInfo.provenance.attribution);
  const sourceName = compactText(metadata?.licenseAttribution?.sourceName)
    ?? compactText(provenanceInfo.provenance.sourceName)
    ?? compactText(metadata?.importSource?.sourceName)
    ?? compactText(metadata?.datasetContext?.datasetTitle)
    ?? compactText(metadata?.externalService?.title)
    ?? compactText(metadata?.externalService?.layerName)
    ?? compactText(metadata?.eoSource?.provider)
    ?? compactText(metadata?.registry?.licenseAttribution.sourceName);
  const sourceUrl = compactText(metadata?.licenseAttribution?.sourceUrl)
    ?? compactText(provenanceInfo.provenance.sourceUrl)
    ?? compactText(metadata?.importSource?.sourceUri)
    ?? compactText(metadata?.externalService?.urlTemplate)
    ?? compactText(metadata?.externalService?.endpoint)
    ?? compactText(metadata?.eoSource?.sourceUrl)
    ?? compactText(metadata?.registry?.licenseAttribution.sourceUrl);
  const source = metadata?.licenseAttribution
    ? "explicit"
    : metadata?.importSource
      ? "import-source"
    : metadata?.datasetContext?.license
      ? "dataset-context"
      : metadata?.externalService
        ? "external-service"
        : metadata?.eoSource
          ? "eo-source"
          : provenanceInfo.source;

  return {
    license: license ?? null,
    attribution: attribution ?? null,
    sourceName: sourceName ?? null,
    requiresAttribution: Boolean(attribution || sourceUrl || resolveOverlayLayerSourceKind(layer) === "external"),
    source,
    notes: license || attribution ? [] : ["License and attribution are not declared for publication."],
    ...(sourceUrl ? { sourceUrl } : {}),
  };
}

function buildPublicationReadiness(
  layer: OverlayLayerConfig,
  crsSummary: LayerCrsSummary,
  geometrySummary: LayerGeometrySummary,
  schemaSummary: LayerSchemaSummary,
  licenseAttribution: LayerLicenseAttributionSummary,
  qaStatus: LayerQaStatus,
  queryable: boolean,
): LayerRegistryMetadata["publicationReadiness"] {
  const explicitReadiness = layer.metadata?.publicationReadiness;
  const provenanceInfo = resolveOverlayLayerProvenanceWithSource(layer);
  const missingFields: string[] = [...(explicitReadiness?.missingFields ?? [])];
  const caveats: string[] = [...(explicitReadiness?.caveats ?? [])];
  const scientificQA = layer.metadata?.scientificQA;
  const blockingIssueIds = uniqueTexts([
    ...(explicitReadiness?.blockingIssueIds ?? []),
    ...(qaStatus === "error" ? scientificQA?.issueIds ?? ["layer-qa-error"] : []),
  ]);
  const externalService = layer.metadata?.externalService;
  const vectorTiles = layer.metadata?.vectorTiles;
  const isFeatureLayer = QUERYABLE_LAYER_TYPES.has(layer.type);
  const geometryQaSummary = scientificQA?.categorySummaries?.find((summary) => summary.category === "geometry-validity");

  if (crsSummary.status !== "known") missingFields.push("crs");
  if (isFeatureLayer && geometrySummary.geometryType === FALLBACK_GEOMETRY_TYPE && geometrySummary.featureCount == null) {
    missingFields.push("geometry");
  }
  if (provenanceInfo.fallback) missingFields.push("provenance");
  if (!licenseAttribution.license && !licenseAttribution.attribution) missingFields.push("license-attribution");
  if (schemaSummary.fieldCount === 0 && QUERYABLE_LAYER_TYPES.has(layer.type)) missingFields.push("schema");
  if (geometryQaSummary?.severity === "blocked" || scientificQA?.badges.includes("invalid_geometry")) {
    blockingIssueIds.push(...uniqueTexts([
      ...(geometryQaSummary?.issueIds ?? []),
      ...(scientificQA?.issueIds ?? []),
      "invalid-geometry",
    ]));
    caveats.push(
      geometryQaSummary?.reasons[0]
        ?? "Geometry QA reports invalid geometry; repair or document it before publication.",
    );
  } else if (geometryQaSummary?.severity === "warning" || geometryQaSummary?.severity === "unknown") {
    if (geometryQaSummary.severity === "unknown") missingFields.push("geometry-validation");
    caveats.push(
      geometryQaSummary.reasons[0]
        ?? "Geometry validation is incomplete and should be reviewed before publication.",
    );
  }
  caveats.push(...(layer.metadata?.importSource?.caveats ?? []));
  caveats.push(...(externalService?.caveats ?? []));
  caveats.push(...(vectorTiles?.caveats ?? []));
  if (externalService?.dependencyStatus === "offline") {
    blockingIssueIds.push("external-service-offline");
    caveats.push(externalService.offlineReason ?? "External service is currently offline or unreachable.");
  }
  if (externalService?.dependencyStatus === "stale") {
    caveats.push("External service layer is stale and should be refreshed before analytical use.");
  }
  if (externalService?.dependencyStatus === "unknown") {
    caveats.push("External service availability has not been verified in this browser session.");
  }
  if (!queryable) caveats.push("Layer is not queryable from the map registry.");
  if (qaStatus === "unchecked") caveats.push("Layer has not passed scientific QA.");
  if (qaStatus === "warning") caveats.push("Layer has QA warnings or stale analytical output.");
  if (resolveOverlayLayerSourceKind(layer) === "demo") caveats.push("Demo data must remain labelled before publication.");

  const computedStatus = blockingIssueIds.length > 0
    ? "blocked"
    : missingFields.length > 0 || qaStatus === "unchecked"
      ? "needs-review"
      : caveats.length > 0
        ? "ready-with-caveats"
        : "ready";
  const status: LayerRegistryMetadata["publicationReadiness"]["status"] = explicitReadiness?.status === "blocked" || computedStatus === "blocked"
    ? "blocked"
    : explicitReadiness?.status === "needs-review" || computedStatus === "needs-review"
      ? "needs-review"
      : explicitReadiness?.status === "ready-with-caveats" || computedStatus === "ready-with-caveats"
        ? "ready-with-caveats"
        : "ready";

  return {
    status,
    missingFields: uniqueTexts(missingFields),
    blockingIssueIds: uniqueTexts(blockingIssueIds),
    caveats: uniqueTexts(caveats),
    ...(explicitReadiness?.checkedAt ? { checkedAt: explicitReadiness.checkedAt } : {}),
  };
}

function buildReadinessSummary(
  layer: OverlayLayerConfig,
  crsSummary: LayerCrsSummary,
  geometrySummary: LayerGeometrySummary,
  schemaSummary: LayerSchemaSummary,
  publicationReadiness: LayerRegistryMetadata["publicationReadiness"],
  queryable: boolean,
): MapLayerReadinessSummary {
  const isFeatureLayer = QUERYABLE_LAYER_TYPES.has(layer.type);
  const geometryReady = !isFeatureLayer || (
    (geometrySummary.geometryType !== FALLBACK_GEOMETRY_TYPE || geometrySummary.featureCount != null)
      && !publicationReadiness.missingFields.includes("geometry")
      && !publicationReadiness.missingFields.includes("geometry-validation")
      && !publicationReadiness.blockingIssueIds.some((issueId) => issueId.includes("geometry"))
  );
  const schemaReady = !isFeatureLayer || schemaSummary.fieldCount > 0;
  const crsReady = crsSummary.status === "known";
  const missingFields = uniqueTexts([
    ...publicationReadiness.missingFields,
    ...(geometryReady ? [] : ["geometry"]),
    ...(schemaReady ? [] : ["schema"]),
  ]);

  return {
    layerId: layer.id,
    status: publicationReadiness.status,
    geometryReady,
    crsReady,
    metadataReady: missingFields.length === 0,
    queryReady: queryable,
    temporalReady: true,
    workerReady: true,
    missingFields,
    blockingIssueIds: publicationReadiness.blockingIssueIds,
    caveats: publicationReadiness.caveats,
  };
}

export function normalizeLayerRegistryMetadata(layer: OverlayLayerConfig): LayerRegistryMetadata {
  const sourceKind = resolveOverlayLayerSourceKind(layer);
  const qaStatus = resolveOverlayLayerQaStatus(layer);
  const queryable = resolveOverlayLayerQueryable(layer);
  const provenance = resolveOverlayLayerProvenance(layer);
  const crsSummary = resolveOverlayLayerCrsSummary(layer);
  const geometrySummary = resolveOverlayLayerGeometrySummary(layer);
  const schemaSummary = resolveOverlayLayerSchemaSummary(layer);
  const licenseAttribution = resolveOverlayLayerLicenseAttribution(layer);
  const publicationReadiness = buildPublicationReadiness(
    layer,
    crsSummary,
    geometrySummary,
    schemaSummary,
    licenseAttribution,
    qaStatus,
    queryable,
  );
  const readiness = buildReadinessSummary(
    layer,
    crsSummary,
    geometrySummary,
    schemaSummary,
    publicationReadiness,
    queryable,
  );
  const evidenceArtifactId = compactText(layer.metadata?.evidenceArtifactId)
    ?? compactText(layer.metadata?.registry?.evidenceArtifactId);

  return {
    sourceKind,
    provenance,
    crsSummary,
    geometrySummary,
    featureCount: geometrySummary.featureCount,
    schemaSummary,
    licenseAttribution,
    qaStatus,
    queryable,
    publicationReadiness,
    readiness,
    compatibility: {
      legacy: publicationReadiness.missingFields.length > 0 || layer.metadata?.registry == null,
      source: layer.metadata?.registry ? "explicit" : "normalized",
      missingMetadata: publicationReadiness.missingFields,
    },
    ...(evidenceArtifactId ? { evidenceArtifactId } : {}),
  };
}

export function withNormalizedLayerRegistryMetadata(layer: OverlayLayerConfig): OverlayLayerConfig {
  const registry = normalizeLayerRegistryMetadata(layer);
  return {
    ...layer,
    sourceKind: registry.sourceKind,
    qaStatus: registry.qaStatus,
    queryable: registry.queryable,
    provenance: registry.provenance,
    metadata: {
      ...(layer.metadata ?? {}),
      registry,
    },
  };
}
