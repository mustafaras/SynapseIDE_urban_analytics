import { createEmptyDashboard, createWidget, findFirstAvailablePosition, normalizeDashboardDocument, touchDashboard } from "../layout";
import type { DashboardDocument, DashboardTemplateDefinition, DashboardTemplateId, DashboardWidget } from "../types";

function assembleDashboard(
  name: string,
  description: string,
  templateId: DashboardTemplateId,
  tags: string[],
  widgets: DashboardWidget[],
): DashboardDocument {
  const dashboard = createEmptyDashboard(name);
  dashboard.description = description;
  dashboard.templateId = templateId;
  dashboard.tags = tags;
  dashboard.widgets = widgets.reduce<DashboardWidget[]>((accumulator, widget) => {
    const nextWidget = createWidget(widget.type, widget);
    nextWidget.layout = findFirstAvailablePosition(accumulator, nextWidget.layout, nextWidget.id, dashboard.columns);
    accumulator.push(nextWidget);
    return accumulator;
  }, []);
  return touchDashboard(normalizeDashboardDocument(dashboard));
}

export const DASHBOARD_TEMPLATES: DashboardTemplateDefinition[] = [
  {
    id: "city_profile",
    label: "City Profile",
    description: "Rapid urban profile for mayoral briefing decks, baseline studies, and classroom city scans.",
    audience: "Mayor's office, planning studio, research baseline review",
    useCase: "Pairs headline metrics with a district map, travel pattern chart, and briefing note.",
    tags: ["baseline", "profile", "briefing"],
    dashboard: assembleDashboard(
      "City Profile Dashboard",
      "Rapid urban profile for baseline reporting, city briefings, and introductory studio work.",
      "city_profile",
      ["baseline", "profile", "briefing"],
      [
        createWidget("kpi", { layout: { x: 0, y: 0, w: 3, h: 2 }, config: { title: "Population", bindingId: "city.population", subtitle: "Metro estimate" } }),
        createWidget("kpi", { layout: { x: 3, y: 0, w: 3, h: 2 }, config: { title: "Households", bindingId: "city.households", subtitle: "Occupied units" } }),
        createWidget("kpi", { layout: { x: 6, y: 0, w: 3, h: 2 }, config: { title: "Green Space", bindingId: "city.green_space", subtitle: "Public realm quality" } }),
        createWidget("live_indicator", { layout: { x: 9, y: 0, w: 3, h: 2 }, config: { title: "Air Quality Pulse", bindingId: "live.air_quality", subtitle: "Operational monitor" } }),
        createWidget("map", { layout: { x: 0, y: 2, w: 6, h: 4 }, config: { title: "District Profile Map", bindingId: "city.neighborhood_map", subtitle: "Vitality index" } }),
        createWidget("chart", { layout: { x: 6, y: 2, w: 6, h: 3 }, config: { title: "Mode Share", bindingId: "city.mode_share", subtitle: "Latest survey split" } }),
        createWidget("table", { layout: { x: 6, y: 5, w: 6, h: 3 }, config: { title: "District Snapshot", bindingId: "city.district_table", subtitle: "Population, jobs, public realm" } }),
        createWidget("text", { layout: { x: 0, y: 6, w: 6, h: 2 }, config: { title: "Briefing Note", bindingId: "city.executive_brief", subtitle: "Use in reports and council updates" } }),
      ],
    ),
  },
  {
    id: "sdg_monitoring",
    label: "SDG Monitoring",
    description: "Quarterly SDG 11 review surface for indicator monitoring and public reporting.",
    audience: "Monitoring unit, reporting team, classroom indicator studio",
    useCase: "Designed for regular review cycles with headline SDG indicators, trends, and supporting narrative.",
    tags: ["sdg", "monitoring", "reporting"],
    dashboard: assembleDashboard(
      "SDG Monitoring Dashboard",
      "Quarterly monitoring dashboard for SDG 11 indicators and implementation review.",
      "sdg_monitoring",
      ["sdg", "monitoring", "reporting"],
      [
        createWidget("kpi", { layout: { x: 0, y: 0, w: 3, h: 2 }, config: { title: "Transit Access", bindingId: "sdg.11_2_1", subtitle: "SDG 11.2.1" } }),
        createWidget("kpi", { layout: { x: 3, y: 0, w: 3, h: 2 }, config: { title: "Open Space / Capita", bindingId: "sdg.11_7_1", subtitle: "SDG 11.7.1" } }),
        createWidget("chart", { layout: { x: 6, y: 0, w: 6, h: 3 }, config: { title: "Quarterly Progress", bindingId: "sdg.quarterly_progress", subtitle: "Composite score trajectory", style: { chartVariant: "line", accentColor: "#38bdf8" } } }),
        createWidget("table", { layout: { x: 0, y: 2, w: 6, h: 4 }, config: { title: "Indicator Table", bindingId: "sdg.indicator_table", subtitle: "Values, targets, trends" } }),
        createWidget("text", { layout: { x: 6, y: 3, w: 6, h: 3 }, config: { title: "Policy Note", bindingId: "sdg.policy_note", subtitle: "For quarterly review meetings" } }),
        createWidget("kpi", { layout: { x: 0, y: 6, w: 3, h: 2 }, config: { title: "Green Space", bindingId: "city.green_space", subtitle: "Shared with city profile" } }),
      ],
    ),
  },
  {
    id: "risk_assessment",
    label: "Risk Assessment",
    description: "Risk dashboard for resilience planning, emergency coordination, and capital sequencing.",
    audience: "Risk office, infrastructure planning, resilience lab",
    useCase: "Combines hotspot mapping, intervention comparison, live signals, and action sequencing.",
    tags: ["risk", "resilience", "capital"],
    dashboard: assembleDashboard(
      "Risk Assessment Dashboard",
      "Operational and capital planning view for multi-hazard urban risk management.",
      "risk_assessment",
      ["risk", "resilience", "capital"],
      [
        createWidget("kpi", { layout: { x: 0, y: 0, w: 4, h: 2 }, config: { title: "High-Risk Population", bindingId: "risk.exposed_population", subtitle: "Current exposure burden", style: { accentColor: "#ef4444" } } }),
        createWidget("live_indicator", { layout: { x: 4, y: 0, w: 4, h: 2 }, config: { title: "Water Demand", bindingId: "live.water_demand", subtitle: "Utility stress pulse", style: { accentColor: "#38bdf8" } } }),
        createWidget("chart", { layout: { x: 8, y: 0, w: 4, h: 2 }, config: { title: "Hazard Profile", bindingId: "risk.hazard_profile", subtitle: "Exposure by hazard", style: { chartVariant: "area", accentColor: "#fb7185" } } }),
        createWidget("map", { layout: { x: 0, y: 2, w: 6, h: 4 }, config: { title: "Risk Hotspots", bindingId: "risk.hotspot_map", subtitle: "Flood, heat, and social vulnerability" } }),
        createWidget("comparison", { layout: { x: 6, y: 2, w: 6, h: 3 }, config: { title: "Intervention Comparison", bindingId: "risk.intervention_comparison", subtitle: "Current plan vs accelerated package" } }),
        createWidget("table", { layout: { x: 6, y: 5, w: 6, h: 3 }, config: { title: "Priority Actions", bindingId: "risk.priority_actions", subtitle: "Sequenced implementation actions" } }),
        createWidget("text", { layout: { x: 0, y: 6, w: 6, h: 2 }, config: { title: "Recommendation", bindingId: "risk.recommendation_note", subtitle: "For implementation committees" } }),
      ],
    ),
  },
  {
    id: "accessibility_equity",
    label: "Accessibility Equity",
    description: "Equity monitoring dashboard focused on travel time, service standards, and underserved groups.",
    audience: "Accessibility team, equity unit, teaching studio",
    useCase: "Useful for accessibility audits, monthly monitoring, and service equity workshops.",
    tags: ["equity", "accessibility", "services"],
    dashboard: assembleDashboard(
      "Accessibility Equity Dashboard",
      "Accessibility and equity monitoring surface for underserved groups and district service gaps.",
      "accessibility_equity",
      ["equity", "accessibility", "services"],
      [
        createWidget("kpi", { layout: { x: 0, y: 0, w: 4, h: 2 }, config: { title: "Transit Equity Gap", bindingId: "accessibility.transit_gap", subtitle: "Highest vs lowest access districts" } }),
        createWidget("kpi", { layout: { x: 4, y: 0, w: 4, h: 2 }, config: { title: "Transit Coverage", bindingId: "sdg.11_2_1", subtitle: "Shared monitoring metric" } }),
        createWidget("live_indicator", { layout: { x: 8, y: 0, w: 4, h: 2 }, config: { title: "Live Demand", bindingId: "live.water_demand", subtitle: "Operations context" } }),
        createWidget("map", { layout: { x: 0, y: 2, w: 6, h: 4 }, config: { title: "Coverage Map", bindingId: "accessibility.coverage_map", subtitle: "15-minute essential service access" } }),
        createWidget("comparison", { layout: { x: 6, y: 2, w: 6, h: 3 }, config: { title: "Group Comparison", bindingId: "accessibility.group_comparison", subtitle: "City average vs priority groups" } }),
        createWidget("chart", { layout: { x: 6, y: 5, w: 6, h: 3 }, config: { title: "Service Gap", bindingId: "accessibility.service_gap", subtitle: "Travel time by group", style: { chartVariant: "bar", accentColor: "#14b8a6" } } }),
        createWidget("table", { layout: { x: 0, y: 6, w: 6, h: 2 }, config: { title: "Equity Table", bindingId: "accessibility.equity_table", subtitle: "Observed group gaps" } }),
        createWidget("text", { layout: { x: 0, y: 8, w: 12, h: 2 }, config: { title: "Teaching and Operations Note", bindingId: "accessibility.education_note", subtitle: "Why the layout mixes map, gap, and narrative views" } }),
      ],
    ),
  },
  {
    id: "neighborhood_comparison",
    label: "Neighbourhood Comparison",
    description: "Side-by-side district comparison for policy options, studio juries, and neighbourhood briefings.",
    audience: "District planning team, classroom crit, public presentation",
    useCase: "Compares strengths and structural gaps without reducing the discussion to a simple rank order.",
    tags: ["comparison", "districts", "presentation"],
    dashboard: assembleDashboard(
      "Neighbourhood Comparison Dashboard",
      "Neighbourhood comparison surface for district benchmarking, studio critiques, and external presentation.",
      "neighborhood_comparison",
      ["comparison", "districts", "presentation"],
      [
        createWidget("kpi", { layout: { x: 0, y: 0, w: 3, h: 2 }, config: { title: "Affordability Gap", bindingId: "comparison.affordability_gap", subtitle: "Severe burden difference" } }),
        createWidget("map", { layout: { x: 3, y: 0, w: 5, h: 4 }, config: { title: "Neighbourhood Map", bindingId: "comparison.neighborhood_map", subtitle: "Composite wellbeing score" } }),
        createWidget("comparison", { layout: { x: 8, y: 0, w: 4, h: 4 }, config: { title: "Gap Analysis", bindingId: "comparison.neighborhood_gap", subtitle: "Central Core vs East Works" } }),
        createWidget("table", { layout: { x: 0, y: 2, w: 3, h: 2 }, config: { title: "Scorecard Table", bindingId: "comparison.neighborhood_table", subtitle: "Shared comparison table" } }),
        createWidget("text", { layout: { x: 0, y: 4, w: 6, h: 3 }, config: { title: "Narrative Framing", bindingId: "comparison.brief_note", subtitle: "Keep the dashboard presentation-ready" } }),
        createWidget("chart", { layout: { x: 6, y: 4, w: 6, h: 3 }, config: { title: "Capital Pipeline", bindingId: "city.capital_pipeline", subtitle: "Context for intervention pacing", style: { chartVariant: "line", accentColor: "#38bdf8" } } }),
      ],
    ),
  },
];

const DASHBOARD_TEMPLATE_MAP = new Map<DashboardTemplateId, DashboardTemplateDefinition>(
  DASHBOARD_TEMPLATES.map((template) => [template.id, template]),
);

export function listDashboardTemplates(): DashboardTemplateDefinition[] {
  return DASHBOARD_TEMPLATES;
}

export function getDashboardTemplate(templateId: DashboardTemplateId): DashboardTemplateDefinition {
  const template = DASHBOARD_TEMPLATE_MAP.get(templateId);
  if (!template) {
    throw new Error(`Dashboard template ${templateId} is not registered.`);
  }
  return template;
}

export function createDashboardFromTemplate(templateId: DashboardTemplateId): DashboardDocument {
  const template = getDashboardTemplate(templateId);
  const clone = JSON.parse(JSON.stringify(template.dashboard)) as DashboardDocument;
  clone.id = `${clone.id}-${Date.now()}`;
  clone.createdAt = new Date().toISOString();
  clone.updatedAt = clone.createdAt;
  return normalizeDashboardDocument(clone);
}
