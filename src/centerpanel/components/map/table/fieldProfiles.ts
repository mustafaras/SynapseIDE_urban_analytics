export type FieldProfileKind = "numeric" | "categorical" | "temporal";

export interface FieldProfileDistributionEntry {
  label: string;
  count: number;
  ratio: number;
}

export interface NumericFieldProfileDistributionEntry extends FieldProfileDistributionEntry {
  min: number;
  max: number;
}

export interface TemporalFieldProfileDistributionEntry extends FieldProfileDistributionEntry {
  start: string;
  end: string;
}

export interface FieldProfileBase {
  fieldName: string;
  kind: FieldProfileKind;
  totalCount: number;
  nonNullCount: number;
  nullCount: number;
  nullRatio: number;
  distinctCount: number;
}

export interface NumericFieldProfile extends FieldProfileBase {
  kind: "numeric";
  min: number | null;
  max: number | null;
  mean: number | null;
  distribution: NumericFieldProfileDistributionEntry[];
}

export interface CategoricalFieldProfile extends FieldProfileBase {
  kind: "categorical";
  distribution: FieldProfileDistributionEntry[];
}

export interface TemporalFieldProfile extends FieldProfileBase {
  kind: "temporal";
  min: string | null;
  max: string | null;
  mean: string | null;
  distribution: TemporalFieldProfileDistributionEntry[];
}

export type FieldProfile = NumericFieldProfile | CategoricalFieldProfile | TemporalFieldProfile;

const NUMERIC_BUCKET_COUNT = 5;
const TEMPORAL_BUCKET_COUNT = 6;
const CATEGORICAL_BUCKET_LIMIT = 8;

function isNullishValue(value: unknown): boolean {
  return value == null
    || (typeof value === "number" && !Number.isFinite(value))
    || (typeof value === "string" && value.trim() === "");
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function asTimestamp(value: unknown): number | null {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function distinctKey(kind: FieldProfileKind, value: unknown): string | null {
  if (isNullishValue(value)) return null;
  if (kind === "numeric") {
    const numericValue = asFiniteNumber(value);
    return numericValue === null ? null : String(numericValue);
  }
  if (kind === "temporal") {
    const timestamp = asTimestamp(value);
    return timestamp === null ? null : new Date(timestamp).toISOString();
  }
  return String(value).trim();
}

function inferFieldProfileKind(values: readonly unknown[]): FieldProfileKind {
  const nonNullValues = values.filter((value) => !isNullishValue(value));
  if (nonNullValues.length === 0) return "categorical";

  const numericCount = nonNullValues.filter((value) => asFiniteNumber(value) !== null).length;
  if (numericCount === nonNullValues.length) return "numeric";

  const temporalCount = nonNullValues.filter((value) => asTimestamp(value) !== null).length;
  if (temporalCount === nonNullValues.length) return "temporal";

  return "categorical";
}

function buildNumericDistribution(values: readonly number[], totalCount: number): NumericFieldProfileDistributionEntry[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{
      label: `${min}`,
      count: values.length,
      ratio: totalCount > 0 ? values.length / totalCount : 0,
      min,
      max,
    }];
  }

  const width = (max - min) / NUMERIC_BUCKET_COUNT;
  const buckets = Array.from({ length: NUMERIC_BUCKET_COUNT }, (_, index) => ({
    min: min + width * index,
    max: index === NUMERIC_BUCKET_COUNT - 1 ? max : min + width * (index + 1),
    count: 0,
  }));

  for (const value of values) {
    const bucketIndex = width === 0
      ? 0
      : Math.min(NUMERIC_BUCKET_COUNT - 1, Math.floor((value - min) / width));
    buckets[bucketIndex]!.count += 1;
  }

  return buckets.map((bucket) => ({
    label: `${bucket.min.toFixed(2)}-${bucket.max.toFixed(2)}`,
    count: bucket.count,
    ratio: totalCount > 0 ? bucket.count / totalCount : 0,
    min: bucket.min,
    max: bucket.max,
  }));
}

function buildCategoricalDistribution(values: readonly string[], totalCount: number): FieldProfileDistributionEntry[] {
  if (values.length === 0) return [];

  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, CATEGORICAL_BUCKET_LIMIT)
    .map(([label, count]) => ({
      label,
      count,
      ratio: totalCount > 0 ? count / totalCount : 0,
    }));
}

function buildTemporalDistribution(values: readonly number[], totalCount: number): TemporalFieldProfileDistributionEntry[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const isoValue = new Date(min).toISOString();
    return [{
      label: isoValue.slice(0, 10),
      count: values.length,
      ratio: totalCount > 0 ? values.length / totalCount : 0,
      start: isoValue,
      end: isoValue,
    }];
  }

  const width = (max - min) / TEMPORAL_BUCKET_COUNT;
  const buckets = Array.from({ length: TEMPORAL_BUCKET_COUNT }, (_, index) => ({
    start: min + width * index,
    end: index === TEMPORAL_BUCKET_COUNT - 1 ? max : min + width * (index + 1),
    count: 0,
  }));

  for (const value of values) {
    const bucketIndex = width === 0
      ? 0
      : Math.min(TEMPORAL_BUCKET_COUNT - 1, Math.floor((value - min) / width));
    buckets[bucketIndex]!.count += 1;
  }

  return buckets.map((bucket) => {
    const start = new Date(bucket.start).toISOString();
    const end = new Date(bucket.end).toISOString();
    return {
      label: `${start.slice(0, 10)}-${end.slice(0, 10)}`,
      count: bucket.count,
      ratio: totalCount > 0 ? bucket.count / totalCount : 0,
      start,
      end,
    };
  });
}

function collectFieldValues(
  features: readonly GeoJSON.Feature[],
  fieldName: string,
): unknown[] {
  return features.map((feature) => {
    const properties = feature.properties;
    if (!properties || typeof properties !== "object" || Array.isArray(properties)) return null;
    return (properties as Record<string, unknown>)[fieldName] ?? null;
  });
}

export function buildFieldProfile(
  features: readonly GeoJSON.Feature[],
  fieldName: string,
): FieldProfile {
  const values = collectFieldValues(features, fieldName);
  const kind = inferFieldProfileKind(values);
  const totalCount = values.length;
  const nullCount = values.filter((value) => isNullishValue(value)).length;
  const nonNullCount = totalCount - nullCount;
  const distinctValues = new Set(
    values
      .map((value) => distinctKey(kind, value))
      .filter((value): value is string => value !== null),
  );

  const base: FieldProfileBase = {
    fieldName,
    kind,
    totalCount,
    nonNullCount,
    nullCount,
    nullRatio: totalCount > 0 ? nullCount / totalCount : 0,
    distinctCount: distinctValues.size,
  };

  if (kind === "numeric") {
    const numericValues = values
      .map((value) => asFiniteNumber(value))
      .filter((value): value is number => value !== null);
    const min = numericValues.length > 0 ? Math.min(...numericValues) : null;
    const max = numericValues.length > 0 ? Math.max(...numericValues) : null;
    const mean = numericValues.length > 0
      ? numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
      : null;
    return {
      ...base,
      kind,
      min,
      max,
      mean,
      distribution: buildNumericDistribution(numericValues, nonNullCount),
    };
  }

  if (kind === "temporal") {
    const temporalValues = values
      .map((value) => asTimestamp(value))
      .filter((value): value is number => value !== null);
    const min = temporalValues.length > 0 ? new Date(Math.min(...temporalValues)).toISOString() : null;
    const max = temporalValues.length > 0 ? new Date(Math.max(...temporalValues)).toISOString() : null;
    const mean = temporalValues.length > 0
      ? new Date(temporalValues.reduce((sum, value) => sum + value, 0) / temporalValues.length).toISOString()
      : null;
    return {
      ...base,
      kind,
      min,
      max,
      mean,
      distribution: buildTemporalDistribution(temporalValues, nonNullCount),
    };
  }

  const categoricalValues = values
    .filter((value) => !isNullishValue(value))
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
  return {
    ...base,
    kind,
    distribution: buildCategoricalDistribution(categoricalValues, nonNullCount),
  };
}

export function buildFieldProfiles(
  features: readonly GeoJSON.Feature[],
  fieldNames: readonly string[],
): Record<string, FieldProfile> {
  return Object.fromEntries(fieldNames.map((fieldName) => [fieldName, buildFieldProfile(features, fieldName)]));
}

export function formatFieldProfileMetric(value: number | string | null): string {
  if (value === null) return "unknown";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return value;
}