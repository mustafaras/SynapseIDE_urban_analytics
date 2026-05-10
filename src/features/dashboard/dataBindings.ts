import { getIndicatorDefinition } from "@/features/urbanAnalytics/indicators/catalog";
import { resolveIndicatorTraceabilityMetadata } from "@/features/urbanAnalytics/indicators/shared";
import { listLatestComputedIndicatorRecords } from "@/features/urbanAnalytics/indicators/storage";
import type { UrbanIndicatorKind } from "@/features/urbanAnalytics/lib/types";
import { backupCorrupt, safeGet, safeSet } from "@/utils/storage";

import type {
  DashboardBinding,
  DashboardBindingKind,
  DashboardComparisonBinding,
  DashboardLiveBinding,
  DashboardMapBinding,
  DashboardMetricBinding,
  DashboardSeriesBinding,
  DashboardTableBinding,
  DashboardTemplateId,
  DashboardTextBinding,
  DashboardWidgetType,
} from "./types";
import { WIDGET_BINDING_COMPATIBILITY } from "./layout";

export const DASHBOARD_REGISTERED_BINDINGS_KEY = "synapse.dashboard.registered-bindings.v1";

function metric(
  id: string,
  label: string,
  description: string,
  formattedValue: string,
  rawValue: number,
  status: DashboardMetricBinding["status"],
  tags: DashboardTemplateId[],
  changeLabel?: string,
  unit?: string,
): DashboardMetricBinding {
  return {
    id,
    kind: "metric",
    label,
    description,
    formattedValue,
    rawValue,
    status,
    ...(changeLabel === undefined ? {} : { changeLabel }),
    ...(unit === undefined ? {} : { unit }),
    updatedAt: "2026-04-13T09:30:00.000Z",
    tags,
  };
}

function series(
  id: string,
  label: string,
  description: string,
  points: DashboardSeriesBinding["points"],
  tags: DashboardTemplateId[],
  unit?: string,
): DashboardSeriesBinding {
  return {
    id,
    kind: "series",
    label,
    description,
    points,
    ...(unit === undefined ? {} : { unit }),
    updatedAt: "2026-04-13T09:30:00.000Z",
    tags,
  };
}

function table(
  id: string,
  label: string,
  description: string,
  columns: string[],
  rows: DashboardTableBinding["rows"],
  tags: DashboardTemplateId[],
): DashboardTableBinding {
  return {
    id,
    kind: "table",
    label,
    description,
    columns,
    rows,
    updatedAt: "2026-04-13T09:30:00.000Z",
    tags,
  };
}

function map(
  id: string,
  label: string,
  description: string,
  areas: DashboardMapBinding["areas"],
  tags: DashboardTemplateId[],
  unit?: string,
): DashboardMapBinding {
  return {
    id,
    kind: "map",
    label,
    description,
    areas,
    ...(unit === undefined ? {} : { unit }),
    updatedAt: "2026-04-13T09:30:00.000Z",
    tags,
  };
}

function comparison(
  id: string,
  label: string,
  description: string,
  primaryLabel: string,
  secondaryLabel: string,
  items: DashboardComparisonBinding["items"],
  tags: DashboardTemplateId[],
): DashboardComparisonBinding {
  return {
    id,
    kind: "comparison",
    label,
    description,
    primaryLabel,
    secondaryLabel,
    items,
    updatedAt: "2026-04-13T09:30:00.000Z",
    tags,
  };
}

function text(
  id: string,
  label: string,
  description: string,
  headline: string,
  paragraphs: string[],
  highlights: string[],
  tags: DashboardTemplateId[],
): DashboardTextBinding {
  return {
    id,
    kind: "text",
    label,
    description,
    headline,
    paragraphs,
    highlights,
    updatedAt: "2026-04-13T09:30:00.000Z",
    tags,
  };
}

function live(
  id: string,
  label: string,
  description: string,
  formattedValue: string,
  rawValue: number,
  trendPoints: number[],
  source: string,
  cadence: string,
  statusLabel: string,
  tags: DashboardTemplateId[],
): DashboardLiveBinding {
  return {
    id,
    kind: "live",
    label,
    description,
    formattedValue,
    rawValue,
    trendPoints,
    source,
    cadence,
    statusLabel,
    updatedAt: "2026-04-13T09:30:00.000Z",
    tags,
  };
}

export const DASHBOARD_BINDINGS: DashboardBinding[] = [
  metric("city.population", "Metro Population", "Current population estimate for the metropolitan planning area.", "1.24M", 1245000, "improving", ["city_profile"], "+2.1% annual growth"),
  metric("city.households", "Households", "Occupied households in the urban footprint.", "412k", 412000, "steady", ["city_profile"], "+1.4% since last census"),
  metric("city.green_space", "Green Space / Capita", "Accessible public green space per resident.", "8.6 m²", 8.6, "watch", ["city_profile", "sdg_monitoring"], "+0.3 m² over plan baseline", "m²"),
  metric("sdg.11_2_1", "SDG 11.2.1", "Residents within 500m of public transport.", "78.3%", 78.3, "improving", ["sdg_monitoring", "accessibility_equity"], "+3.2 pts year over year", "%"),
  metric("sdg.11_7_1", "SDG 11.7.1", "Public open space per person.", "6.8 m²", 6.8, "watch", ["sdg_monitoring", "city_profile"], "+0.4 m² since 2024", "m²"),
  metric("risk.exposed_population", "High-Risk Population", "Residents exposed to overlapping flood and heat risk.", "184k", 184000, "critical", ["risk_assessment"], "-6k after mitigation package"),
  metric("accessibility.transit_gap", "Transit Equity Gap", "Difference in transit access between highest- and lowest-income districts.", "18 min", 18, "watch", ["accessibility_equity"], "-4 min vs. 2025", "min"),
  metric("comparison.affordability_gap", "Housing Cost Burden Gap", "Difference in severe housing cost burden across comparison districts.", "11.4 pts", 11.4, "critical", ["neighborhood_comparison"], "-1.8 pts after policy package", "pts"),
  series(
    "city.mode_share",
    "Mode Share",
    "Observed commute mode split for the latest household travel survey.",
    [
      { label: "Walk", value: 21 },
      { label: "Cycle", value: 8 },
      { label: "Transit", value: 37 },
      { label: "Car", value: 34 },
    ],
    ["city_profile"],
    "%",
  ),
  series(
    "city.capital_pipeline",
    "Capital Pipeline",
    "Five-year capital delivery schedule for mobility, housing, and public realm projects.",
    [
      { label: "2026", value: 48, target: 50 },
      { label: "2027", value: 61, target: 62 },
      { label: "2028", value: 74, target: 70 },
      { label: "2029", value: 82, target: 80 },
      { label: "2030", value: 91, target: 90 },
    ],
    ["city_profile", "risk_assessment", "neighborhood_comparison"],
    "M USD",
  ),
  series(
    "sdg.quarterly_progress",
    "Quarterly SDG Progress",
    "Composite progress score for monitored SDG 11 indicators.",
    [
      { label: "Q1", value: 61, target: 70 },
      { label: "Q2", value: 64, target: 70 },
      { label: "Q3", value: 66, target: 70 },
      { label: "Q4", value: 69, target: 70 },
    ],
    ["sdg_monitoring"],
    "score",
  ),
  series(
    "risk.hazard_profile",
    "Hazard Exposure Profile",
    "Population and asset exposure scores across major hazards.",
    [
      { label: "Heat", value: 88 },
      { label: "Flood", value: 74 },
      { label: "Subsidence", value: 41 },
      { label: "Seismic", value: 53 },
    ],
    ["risk_assessment"],
    "index",
  ),
  series(
    "accessibility.service_gap",
    "Service Gap by Group",
    "Average travel time to daily services across demographic groups.",
    [
      { label: "Children", value: 17 },
      { label: "Older adults", value: 23 },
      { label: "Disabled residents", value: 26 },
      { label: "Low-income HH", value: 21 },
    ],
    ["accessibility_equity"],
    "min",
  ),
  map(
    "city.neighborhood_map",
    "District Profile Map",
    "Neighbourhood vitality index for the current city profile dashboard.",
    [
      { id: "north", label: "North Ridge", value: 72, formattedValue: "72", status: "improving" },
      { id: "central", label: "Central Core", value: 81, formattedValue: "81", status: "improving" },
      { id: "east", label: "East Works", value: 58, formattedValue: "58", status: "watch" },
      { id: "west", label: "West Market", value: 69, formattedValue: "69", status: "steady" },
      { id: "south", label: "South Garden", value: 76, formattedValue: "76", status: "improving" },
      { id: "harbor", label: "Harbor Edge", value: 63, formattedValue: "63", status: "watch" },
    ],
    ["city_profile"],
    "index",
  ),
  map(
    "risk.hotspot_map",
    "Multi-Hazard Hotspots",
    "Priority districts for combined flood, heat, and service vulnerability action.",
    [
      { id: "north", label: "North Ridge", value: 54, formattedValue: "Moderate", status: "steady" },
      { id: "central", label: "Central Core", value: 42, formattedValue: "Managed", status: "improving" },
      { id: "east", label: "East Works", value: 91, formattedValue: "Severe", status: "critical" },
      { id: "west", label: "West Market", value: 63, formattedValue: "Elevated", status: "watch" },
      { id: "south", label: "South Garden", value: 49, formattedValue: "Moderate", status: "steady" },
      { id: "harbor", label: "Harbor Edge", value: 84, formattedValue: "Severe", status: "critical" },
    ],
    ["risk_assessment"],
    "risk",
  ),
  map(
    "accessibility.coverage_map",
    "Access Coverage",
    "Share of residents reaching essential services within 15 minutes.",
    [
      { id: "north", label: "North Ridge", value: 78, formattedValue: "78%", status: "steady" },
      { id: "central", label: "Central Core", value: 91, formattedValue: "91%", status: "improving" },
      { id: "east", label: "East Works", value: 62, formattedValue: "62%", status: "watch" },
      { id: "west", label: "West Market", value: 74, formattedValue: "74%", status: "steady" },
      { id: "south", label: "South Garden", value: 69, formattedValue: "69%", status: "watch" },
      { id: "harbor", label: "Harbor Edge", value: 57, formattedValue: "57%", status: "critical" },
    ],
    ["accessibility_equity"],
    "%",
  ),
  map(
    "comparison.neighborhood_map",
    "Neighbourhood Comparison Map",
    "Composite wellbeing score used for district-to-district comparison.",
    [
      { id: "north", label: "North Ridge", value: 77, formattedValue: "77", status: "improving" },
      { id: "central", label: "Central Core", value: 84, formattedValue: "84", status: "improving" },
      { id: "east", label: "East Works", value: 61, formattedValue: "61", status: "watch" },
      { id: "west", label: "West Market", value: 73, formattedValue: "73", status: "steady" },
      { id: "south", label: "South Garden", value: 79, formattedValue: "79", status: "improving" },
      { id: "harbor", label: "Harbor Edge", value: 66, formattedValue: "66", status: "watch" },
    ],
    ["neighborhood_comparison"],
    "index",
  ),
  table(
    "city.district_table",
    "District Snapshot",
    "Compact snapshot of population, jobs, and public realm indicators by district.",
    ["District", "Population", "Jobs", "Green m²/person"],
    [
      { District: "North Ridge", Population: "182k", Jobs: "64k", "Green m²/person": "11.1" },
      { District: "Central Core", Population: "205k", Jobs: "211k", "Green m²/person": "4.3" },
      { District: "East Works", Population: "149k", Jobs: "81k", "Green m²/person": "5.9" },
      { District: "Harbor Edge", Population: "123k", Jobs: "52k", "Green m²/person": "7.4" },
    ],
    ["city_profile"],
  ),
  table(
    "sdg.indicator_table",
    "SDG 11 Monitoring Table",
    "Indicator table for monitoring sessions and teaching exercises.",
    ["Indicator", "Value", "Target", "Trend"],
    [
      { Indicator: "11.1.1 Adequate housing", Value: "87.5%", Target: "100%", Trend: "Improving" },
      { Indicator: "11.2.1 Transit access", Value: "78.3%", Target: "100%", Trend: "Improving" },
      { Indicator: "11.6.1 Waste collection", Value: "89.0%", Target: "100%", Trend: "Stable" },
      { Indicator: "11.7.1 Open space", Value: "6.8 m²", Target: "15.0 m²", Trend: "Improving" },
    ],
    ["sdg_monitoring"],
  ),
  table(
    "risk.priority_actions",
    "Priority Actions",
    "Sequenced risk-reduction actions with implementation ownership.",
    ["Action", "Districts", "Lead", "Horizon"],
    [
      { Action: "Cool roof pilot", Districts: "East Works, Harbor", Lead: "Housing", Horizon: "0-12 mo" },
      { Action: "Drainage upgrades", Districts: "Harbor Edge", Lead: "Public Works", Horizon: "1-3 yr" },
      { Action: "Micro-forest streets", Districts: "East Works", Lead: "Parks", Horizon: "1-5 yr" },
      { Action: "Heat refuge network", Districts: "East, South", Lead: "Emergency Mgmt", Horizon: "0-12 mo" },
    ],
    ["risk_assessment"],
  ),
  table(
    "accessibility.equity_table",
    "Equity Access Table",
    "Observed gap between groups for essential service access.",
    ["Group", "15-min access", "Avg time", "Change"],
    [
      { Group: "High-income", "15-min access": "88%", "Avg time": "14 min", Change: "+2 pts" },
      { Group: "Low-income", "15-min access": "67%", "Avg time": "22 min", Change: "+4 pts" },
      { Group: "Disabled residents", "15-min access": "61%", "Avg time": "26 min", Change: "+3 pts" },
      { Group: "Older adults", "15-min access": "64%", "Avg time": "23 min", Change: "+1 pt" },
    ],
    ["accessibility_equity"],
  ),
  table(
    "comparison.neighborhood_table",
    "Neighbourhood Comparison Table",
    "Shared scorecard for cross-neighbourhood benchmarking.",
    ["Metric", "Central Core", "East Works", "Gap"],
    [
      { Metric: "Transit access", "Central Core": "91%", "East Works": "62%", Gap: "29 pts" },
      { Metric: "Tree canopy", "Central Core": "12%", "East Works": "6%", Gap: "6 pts" },
      { Metric: "Severe rent burden", "Central Core": "18%", "East Works": "29%", Gap: "11 pts" },
      { Metric: "Jobs / resident", "Central Core": "1.03", "East Works": "0.54", Gap: "0.49" },
    ],
    ["neighborhood_comparison"],
  ),
  comparison(
    "risk.intervention_comparison",
    "Mitigation Package Comparison",
    "Expected effect of near-term and capital mitigation packages.",
    "Current plan",
    "Accelerated package",
    [
      { label: "Residents exposed", primary: 184, secondary: 151, unit: "k" },
      { label: "Peak heat days", primary: 27, secondary: 19, unit: "days" },
      { label: "Flooded parcels", primary: 620, secondary: 410, unit: "count" },
      { label: "Response time", primary: 18, secondary: 13, unit: "min" },
    ],
    ["risk_assessment"],
  ),
  comparison(
    "accessibility.group_comparison",
    "Equity Group Comparison",
    "Observed service access gap between city average and priority groups.",
    "City average",
    "Priority group",
    [
      { label: "Transit access", primary: 78, secondary: 62, unit: "%" },
      { label: "Clinic access", primary: 84, secondary: 68, unit: "%" },
      { label: "Park access", primary: 71, secondary: 55, unit: "%" },
      { label: "School access", primary: 89, secondary: 76, unit: "%" },
    ],
    ["accessibility_equity"],
  ),
  comparison(
    "comparison.neighborhood_gap",
    "Neighbourhood Gap Analysis",
    "Key differences between comparator districts used in studio reviews.",
    "Central Core",
    "East Works",
    [
      { label: "Transit access", primary: 91, secondary: 62, unit: "%" },
      { label: "Tree canopy", primary: 12, secondary: 6, unit: "%" },
      { label: "Jobs density", primary: 211, secondary: 81, unit: "k" },
      { label: "Rent burden", primary: 18, secondary: 29, unit: "%" },
    ],
    ["neighborhood_comparison"],
  ),
  text(
    "city.executive_brief",
    "Executive Brief",
    "Short narrative for city profile dashboards and presentation covers.",
    "City profile dashboard for briefing planners, council members, and studio teams.",
    [
      "Population and employment continue to consolidate in the central core, while east-side districts show the strongest need for public realm and access investment.",
      "Green space provision and service proximity remain uneven, which makes the dashboard useful as both a policy briefing surface and a teaching storyboard.",
    ],
    ["Growth concentrated in the core", "East-side public realm deficit", "Useful for briefing and teaching"],
    ["city_profile"],
  ),
  text(
    "sdg.policy_note",
    "SDG Policy Note",
    "Narrative note for SDG monitoring workshops and reporting exports.",
    "Quarterly SDG tracking shows steady improvement, but open-space provision and affordable housing remain below target trajectories.",
    [
      "Transport access is closing toward the plan target and can anchor a positive public dashboard headline.",
      "Open space and housing quality metrics still need district-level action, so the dashboard keeps those indicators visible instead of burying them in an annex.",
    ],
    ["Transit access improving", "Open space below target", "Housing quality requires district action"],
    ["sdg_monitoring"],
  ),
  text(
    "risk.recommendation_note",
    "Risk Recommendation",
    "Action note used in risk assessment dashboards and implementation reviews.",
    "The east industrial belt and harbor edge require a paired cooling and drainage programme before the next peak summer season.",
    [
      "The dashboard prioritises places where social vulnerability overlaps with flood and heat exposure so capital sequencing can be discussed in one surface.",
      "Short-term refuge operations and long-term capital works should be tracked together to avoid reporting only the emergency side of the programme.",
    ],
    ["East industrial belt priority", "Pair emergency and capital actions", "Track implementation together"],
    ["risk_assessment"],
  ),
  text(
    "accessibility.education_note",
    "Accessibility Equity Note",
    "Teaching and engagement note for accessibility dashboards.",
    "The gap is not only spatial. It is also a timetable, affordability, and barrier-free design issue, which is why the dashboard combines map, travel time, and group comparison widgets.",
    [
      "This layout is suited to classroom studios because it makes equity trade-offs visible without requiring students to reconstruct the same evidence manually.",
      "For municipal teams, the same arrangement supports monthly monitoring against service standards and capital delivery commitments.",
    ],
    ["Equity is more than distance", "Good for studios and operations", "Combine map and group gap views"],
    ["accessibility_equity"],
  ),
  text(
    "comparison.brief_note",
    "Neighbourhood Brief",
    "Narrative note framing district comparison dashboards.",
    "Neighbourhood comparison dashboards should expose both strengths and structural gaps so the comparison does not collapse into a ranking exercise.",
    [
      "Central Core performs strongly on jobs and transport, while East Works shows the clearest need for green space, access, and affordability intervention.",
      "Keeping the narrative on the dashboard makes exports presentation-ready and reduces the need for separate speaker notes.",
    ],
    ["Avoid ranking-only framing", "Show strengths and gaps together", "Presentation-ready narrative"],
    ["neighborhood_comparison"],
  ),
  live(
    "live.air_quality",
    "Air Quality Pulse",
    "Rolling PM2.5 reading from the urban monitoring network.",
    "23 µg/m³",
    23,
    [14, 15, 17, 19, 18, 20, 23],
    "Environmental sensor network",
    "Updated every 15 minutes",
    "Watch threshold exceeded",
    ["city_profile", "risk_assessment"],
  ),
  live(
    "live.water_demand",
    "Water Demand Pulse",
    "Short-interval water demand monitor for stress testing service resilience.",
    "71 ML/day",
    71,
    [62, 64, 63, 68, 70, 69, 71],
    "Utility SCADA feed",
    "Updated every hour",
    "Demand trending upward",
    ["risk_assessment", "accessibility_equity"],
  ),
];

export const DASHBOARD_BINDING_MAP = new Map<string, DashboardBinding>(
  DASHBOARD_BINDINGS.map((binding) => [binding.id, binding]),
);

export type ComputedIndicatorBindingVariant = "metric" | "series" | "text";

export function getComputedIndicatorBindingId(
  indicatorKind: UrbanIndicatorKind,
  variant: ComputedIndicatorBindingVariant = "metric",
): string {
  return `computed-indicator:${indicatorKind}:${variant}`;
}

function computedIndicatorTemplateTags(groupId: string): DashboardTemplateId[] {
  switch (groupId) {
    case "transport_mobility":
      return ["city_profile", "accessibility_equity", "neighborhood_comparison"];
    case "energy_climate":
      return ["city_profile", "risk_assessment", "sdg_monitoring"];
    case "urban_form_landscape":
      return ["city_profile", "neighborhood_comparison"];
    case "social_liveability":
      return ["city_profile", "accessibility_equity", "neighborhood_comparison"];
    case "water_infrastructure":
      return ["city_profile", "risk_assessment", "sdg_monitoring"];
    case "governance_innovation":
      return ["city_profile", "sdg_monitoring"];
    case "heritage_culture":
      return ["city_profile", "neighborhood_comparison"];
    case "pandemic_resilience":
      return ["risk_assessment", "accessibility_equity", "city_profile"];
    default:
      return ["city_profile"];
  }
}

function computedIndicatorStatus(classification?: string): DashboardMetricBinding["status"] {
  const normalized = (classification ?? "").toLowerCase();

  if (/critical|very high|car dependent|risk|energy-intensive|poor|deficit|fragmented/.test(normalized)) {
    return "critical";
  }
  if (/moderate|mixed|emerging|watch|typical|intermediate/.test(normalized)) {
    return "watch";
  }
  if (/high-performance|efficient|strong|good|active|healthy|resilient|intact|majority|oriented/.test(normalized)) {
    return "improving";
  }
  return "steady";
}

function buildComputedIndicatorBindings(): DashboardBinding[] {
  return listLatestComputedIndicatorRecords().flatMap((record) => {
    const definition = getIndicatorDefinition(record.kind);
    if (!definition) {
      return [];
    }

    const tags = computedIndicatorTemplateTags(definition.groupId);
    const traceability = record.traceability ?? resolveIndicatorTraceabilityMetadata(definition);
    const description = record.result.summary ?? definition.summary;
    const metricBinding = metric(
      getComputedIndicatorBindingId(record.kind, "metric"),
      definition.title,
      description,
      record.result.displayValue ?? `${record.result.value} ${record.result.unit}`.trim(),
      record.result.value,
      computedIndicatorStatus(record.result.classification),
      tags,
      record.result.classification,
      traceability.units,
    );

    const seriesBinding = (record.result.components?.length ?? 0) > 0
      ? series(
          getComputedIndicatorBindingId(record.kind, "series"),
          `${definition.title} Components`,
          `Component breakdown for ${definition.title}.`,
          record.result.components!.map((component) => ({
            label: component.label,
            value: component.value,
          })),
          tags,
          traceability.units,
        )
      : null;

    const textBinding = definition.dashboardBindingKind === "text" || Boolean(record.result.classification)
      ? text(
          getComputedIndicatorBindingId(record.kind, "text"),
          `${definition.title} Brief`,
          `Narrative summary for ${definition.title}.`,
          record.result.displayValue ?? `${record.result.value} ${record.result.unit}`.trim(),
          [
            `${definition.summary} ${definition.methodSummary}`,
            `Formula: ${traceability.formula}`,
            `Scale: ${traceability.spatialScale.length ? traceability.spatialScale.join(", ") : traceability.spatialScaleNote}`,
            `Temporal scale: ${traceability.temporalScale}. ${traceability.temporalScaleNote}`,
            `Limitations: ${traceability.limitations.slice(0, 2).join(" ")}`,
          ],
          [
            `Classification: ${record.result.classification ?? "Unclassified"}`,
            `Normalization: ${traceability.normalizationMethod}`,
            `Reference: ${traceability.reference}`,
          ],
          tags,
        )
      : null;

    return [metricBinding, ...(seriesBinding ? [seriesBinding] : []), ...(textBinding ? [textBinding] : [])];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isDashboardBinding(value: unknown): value is DashboardBinding {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.label !== "string" || typeof value.description !== "string") {
    return false;
  }
  if (typeof value.updatedAt !== "string" || !isStringArray(value.tags)) {
    return false;
  }

  switch (value.kind) {
    case "metric":
      return typeof value.formattedValue === "string"
        && typeof value.rawValue === "number"
        && typeof value.status === "string";
    case "series":
      return Array.isArray(value.points);
    case "table":
      return isStringArray(value.columns) && Array.isArray(value.rows);
    case "map":
      return Array.isArray(value.areas);
    case "comparison":
      return typeof value.primaryLabel === "string"
        && typeof value.secondaryLabel === "string"
        && Array.isArray(value.items);
    case "text":
      return typeof value.headline === "string"
        && isStringArray(value.paragraphs)
        && isStringArray(value.highlights);
    case "live":
      return typeof value.formattedValue === "string"
        && typeof value.rawValue === "number"
        && Array.isArray(value.trendPoints)
        && typeof value.source === "string"
        && typeof value.cadence === "string"
        && typeof value.statusLabel === "string";
    default:
      return false;
  }
}

export function listRegisteredDashboardBindings(): DashboardBinding[] {
  const result = safeGet<DashboardBinding[]>(DASHBOARD_REGISTERED_BINDINGS_KEY);
  if (!result.ok) {
    if (result.error === "parse") {
      backupCorrupt(DASHBOARD_REGISTERED_BINDINGS_KEY, result.raw);
    }
    return [];
  }
  return Array.isArray(result.value) ? result.value.filter(isDashboardBinding) : [];
}

export function registerDashboardBinding(binding: DashboardBinding): boolean {
  const existing = listRegisteredDashboardBindings();
  const withoutExisting = existing.filter((entry) => entry.id !== binding.id);
  const next = [binding, ...withoutExisting].slice(0, 200);
  return safeSet(DASHBOARD_REGISTERED_BINDINGS_KEY, next).ok;
}

function listAllBindings(): DashboardBinding[] {
  return [...DASHBOARD_BINDINGS, ...buildComputedIndicatorBindings(), ...listRegisteredDashboardBindings()];
}

export function getDashboardBinding(bindingId?: string | null): DashboardBinding | null {
  if (!bindingId) {
    return null;
  }
  return DASHBOARD_BINDING_MAP.get(bindingId)
    ?? buildComputedIndicatorBindings().find((binding) => binding.id === bindingId)
    ?? listRegisteredDashboardBindings().find((binding) => binding.id === bindingId)
    ?? null;
}

export function listBindingsForWidgetType(widgetType: DashboardWidgetType): DashboardBinding[] {
  const compatibleKinds = new Set<DashboardBindingKind>(WIDGET_BINDING_COMPATIBILITY[widgetType]);
  return listAllBindings().filter((binding) => compatibleKinds.has(binding.kind));
}

export function listBindingsForTemplate(templateId: DashboardTemplateId): DashboardBinding[] {
  return listAllBindings().filter((binding) => binding.tags.includes(templateId));
}
