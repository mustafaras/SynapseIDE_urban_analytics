import {
  describeFieldType,
  getDatasetPackageDataTypes,
  getDatasetPackageFieldNames,
  getDataTypeLabel,
  getThemeLabel,
} from "./catalog";
import { validateTeachingDatasetPackage } from "./loader";
import type {
  TeachingDatasetManifest,
  TeachingDatasetPackage,
  TeachingDatasetPedagogicalProfile,
} from "./types";

const MANIFEST_VERSION = "1.0.0";

function formatBounds(bounds: [number, number, number, number]): string {
  return `${bounds[0].toFixed(3)}, ${bounds[1].toFixed(3)} -> ${bounds[2].toFixed(3)}, ${bounds[3].toFixed(3)}`;
}

function joinList(values: readonly string[]): string {
  if (values.length === 0) {
    return "";
  }
  if (values.length === 1) {
    return values[0] ?? "";
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function buildPedagogicalProfile(dataset: TeachingDatasetPackage): TeachingDatasetPedagogicalProfile {
  const themeLabels = dataset.thematicCoverage.map((theme) => getThemeLabel(theme));
  const dataTypeLabels = getDatasetPackageDataTypes(dataset).map((dataType) => getDataTypeLabel(dataType).toLowerCase());

  return {
    recommendedUseCases: [
      `Graduate studio onboarding for ${dataset.city} using linked ${joinList(themeLabels).toLowerCase()} lenses.`,
      `Benchmarking demonstrations that compare ${joinList(dataTypeLabels)} evidence layers under a shared ${dataset.crs} contract.`,
      "Rapid method walkthroughs that connect provenance, schema inspection, validation, and map interpretation before custom data import.",
    ],
    methodologicalCautions: [
      "This package is a curated teaching fixture rather than an authoritative municipal baseline.",
      `The spatial window is limited to ${dataset.spatialExtent.label}; findings should not be generalized to the full metropolitan region without additional coverage.`,
      `Indicators are harmonized to ${dataset.crs} for teaching consistency, so downstream joins should preserve the documented schema before reuse.`,
    ],
    benchmarkQuestions: [
      `How do mobility access and housing pressure co-vary across ${dataset.city}?`,
      "Which corridors combine strong pedestrian priority with weaker canopy coverage?",
      "Which neighborhoods show the strongest overlap between climate stress and service-access inequality?",
    ],
  };
}

export function getTeachingDatasetManifestFilename(dataset: TeachingDatasetPackage): string {
  return `${dataset.id}-teaching-dataset-manifest.json`;
}

export function getTeachingDatasetSyllabusBriefFilename(dataset: TeachingDatasetPackage): string {
  return `${dataset.id}-teaching-dataset-brief.md`;
}

export function buildTeachingDatasetManifest(
  dataset: TeachingDatasetPackage,
  exportedAt = new Date().toISOString(),
): TeachingDatasetManifest {
  const validation = validateTeachingDatasetPackage(dataset);
  const packageDataTypes = getDatasetPackageDataTypes(dataset);
  const totalFeatureCount = dataset.layers.reduce(
    (sum, layer) => sum + layer.featureCollection.features.length,
    0,
  );

  return {
    manifestVersion: MANIFEST_VERSION,
    exportedAt,
    datasetId: dataset.id,
    packageMetadata: {
      city: dataset.city,
      title: dataset.title,
      region: dataset.region,
      summary: dataset.summary,
      source: dataset.source,
      license: dataset.license,
      updateDate: dataset.updateDate,
      crs: dataset.crs,
      spatialExtent: dataset.spatialExtent,
      thematicCoverage: dataset.thematicCoverage,
      thematicCoverageLabels: dataset.thematicCoverage.map((theme) => getThemeLabel(theme)),
      searchTerms: [...dataset.searchTerms],
      packageDataTypes,
      packageDataTypeLabels: packageDataTypes.map((dataType) => getDataTypeLabel(dataType)),
      packageFieldNames: getDatasetPackageFieldNames(dataset),
      totalFeatureCount,
      totalLayerCount: dataset.layers.length,
    },
    validation,
    pedagogicalProfile: buildPedagogicalProfile(dataset),
    layers: dataset.layers.map((layer) => ({
      id: layer.id,
      title: layer.title,
      summary: layer.summary,
      dataType: layer.dataType,
      dataTypeLabel: getDataTypeLabel(layer.dataType),
      geometryType: layer.geometryType,
      source: layer.source,
      license: layer.license,
      updateDate: layer.updateDate,
      thematicCoverage: layer.thematicCoverage,
      thematicCoverageLabels: layer.thematicCoverage.map((theme) => getThemeLabel(theme)),
      featureCount: layer.featureCollection.features.length,
      schemaSummary: layer.schemaSummary.map((field) => ({ ...field })),
    })),
  };
}

export function serializeTeachingDatasetManifest(dataset: TeachingDatasetPackage): string {
  return JSON.stringify(buildTeachingDatasetManifest(dataset), null, 2);
}

export function buildTeachingDatasetSyllabusBrief(dataset: TeachingDatasetPackage): string {
  const manifest = buildTeachingDatasetManifest(dataset);
  const lines: string[] = [
    `# ${dataset.title}`,
    "",
    "Syllabus-ready teaching metadata brief generated by the SynapseCore Urban Analytics Workbench.",
    "",
    "## Teaching Purpose",
    dataset.summary,
    "",
    "## Scientific Metadata",
    `- City: ${dataset.city}`,
    `- Region: ${dataset.region}`,
    `- Source: ${dataset.source}`,
    `- License: ${dataset.license}`,
    `- Update Date: ${dataset.updateDate}`,
    `- CRS: ${dataset.crs}`,
    `- Spatial Extent: ${dataset.spatialExtent.label}`,
    `- Bounds: ${formatBounds(dataset.spatialExtent.bounds)}`,
    `- Thematic Coverage: ${manifest.packageMetadata.thematicCoverageLabels.join(", ")}`,
    `- Package Data Types: ${manifest.packageMetadata.packageDataTypeLabels.join(", ")}`,
    `- Total Layers: ${manifest.packageMetadata.totalLayerCount}`,
    `- Total Features: ${manifest.packageMetadata.totalFeatureCount}`,
    "",
    "## Quality Controls",
    `- CRS validation: Passed against ${dataset.crs}.`,
    `- Schema validation: ${manifest.validation.layerReports.length} layers checked with ${manifest.validation.warnings.length} warnings.`,
    `- Declared field inventory: ${manifest.packageMetadata.packageFieldNames.join(", ")}`,
    "",
    "## Recommended Classroom Uses",
    ...manifest.pedagogicalProfile.recommendedUseCases.map((item) => `- ${item}`),
    "",
    "## Methodological Cautions",
    ...manifest.pedagogicalProfile.methodologicalCautions.map((item) => `- ${item}`),
    "",
    "## Benchmark Questions",
    ...manifest.pedagogicalProfile.benchmarkQuestions.map((item) => `- ${item}`),
    "",
    "## Layer Inventory",
    "| Layer | Geometry | Features | Themes | Updated |",
    "| --- | --- | ---: | --- | --- |",
    ...manifest.layers.map((layer) => (
      `| ${layer.title} | ${layer.geometryType} / ${layer.dataTypeLabel} | ${layer.featureCount} | ${layer.thematicCoverageLabels.join(", ")} | ${layer.updateDate} |`
    )),
  ];

  for (const layer of manifest.layers) {
    lines.push("");
    lines.push(`### ${layer.title}`);
    lines.push(layer.summary);
    lines.push("");
    lines.push("| Field | Type | Description | Required |",
      "| --- | --- | --- | --- |",
      ...layer.schemaSummary.map((field) => (
        `| ${field.name} | ${describeFieldType(field.type)}${field.unit ? ` (${field.unit})` : ""} | ${field.description} | ${field.required ? "Yes" : "No"} |`
      )),
    );
  }

  return lines.join("\n");
}