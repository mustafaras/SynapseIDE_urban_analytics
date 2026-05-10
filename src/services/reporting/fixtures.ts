import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";
import type { ReportCitationRecord } from "./types";

export const REPORTING_FIXTURE_CITATIONS: ReportCitationRecord[] = [
  {
    id: "ipcc-2022",
    type: "report",
    title: "Climate Change 2022: Impacts, Adaptation and Vulnerability",
    authors: [{ given: "Intergovernmental Panel on Climate Change", family: "IPCC" }],
    year: 2022,
    publisher: "Cambridge University Press",
    url: "https://www.ipcc.ch/report/ar6/wg2/",
  },
  {
    id: "unhabitat-2024",
    type: "report",
    title: "World Cities Report 2024",
    authors: [{ given: "UN-Habitat", family: "UN-Habitat" }],
    year: 2024,
    publisher: "United Nations Human Settlements Programme",
    url: "https://unhabitat.org/",
  },
  {
    id: "oecd-2008",
    type: "report",
    title: "Handbook on Constructing Composite Indicators",
    authors: [
      { given: "Nardo", family: "Nardo" },
      { given: "M.", family: "Saisana" },
    ],
    year: 2008,
    publisher: "OECD",
    url: "https://www.oecd.org/",
  },
];

export const REPORTING_FIXTURE_RUNS: CompletedAnalysisRun[] = [
  {
    runId: "fixture-composite-01",
    flowId: "indicator_composite",
    label: "Accessibility Equity Composite",
    insertedAt: "2026-04-12T10:00:00.000Z",
    paragraph: "Composite indicator scenario completed.",
    paragraphPreview: "Peripheral neighborhoods score 18.4 points below the city median, with the lowest-performing quintile concentrated along the northwest industrial belt.",
    paragraphFull: "The composite accessibility-equity assessment indicates a persistent gap between the metropolitan median and peripheral neighborhoods. Peripheral neighborhoods score 18.4 points below the city median, while the top-performing corridor benefits from higher transit frequency and closer service catchments. The strongest disparities are visible in the northwest industrial belt and in newly urbanized fringe districts.",
    mapOutputs: [
      {
        id: "fixture-map-1",
        type: "choropleth",
        geojson: { type: "FeatureCollection", features: [] },
        title: "Composite accessibility-equity scores",
        layerName: "Accessibility Equity Surface",
      },
    ],
    chartOutputs: [
      {
        id: "fixture-chart-1",
        type: "bar",
        data: { labels: ["Inner ring", "Outer ring"], datasets: [] },
        title: "Composite score gap by urban ring",
      },
    ],
    dataOutputs: [
      {
        id: "fixture-table-1",
        format: "csv",
        rows: 4,
        columns: ["Area", "Composite score", "Transit score", "Gap"],
        preview: [
          { Area: "Inner ring", "Composite score": 72.3, "Transit score": 81.2, Gap: 0 },
          { Area: "Outer ring", "Composite score": 53.9, "Transit score": 48.6, Gap: -18.4 },
        ],
      },
    ],
  },
  {
    runId: "fixture-hotspot-02",
    flowId: "change_detection",
    label: "Urban Heat and Canopy Monitoring",
    insertedAt: "2026-04-12T12:00:00.000Z",
    paragraph: "Change detection monitoring completed.",
    paragraphPreview: "Heat intensity remains elevated in logistics corridors despite moderate canopy gains, with 27 percent of monitored cells still above the district threshold.",
    paragraphFull: "Change monitoring shows that heat intensity remains elevated in logistics corridors despite moderate canopy gains. Twenty-seven percent of monitored cells remain above the district heat threshold, and the most persistent hot-spots align with low-canopy industrial parcels and wide paved yards. Cooling gains are observable in recently retrofitted school clusters and riverfront park edges.",
    mapOutputs: [
      {
        id: "fixture-map-2",
        type: "choropleth",
        geojson: { type: "FeatureCollection", features: [] },
        title: "Heat persistence index",
        layerName: "Heat Persistence",
      },
    ],
    chartOutputs: [
      {
        id: "fixture-chart-2",
        type: "line",
        data: { labels: ["2023", "2024", "2025"], datasets: [] },
        title: "Heat persistence trend by monitoring year",
      },
    ],
    dataOutputs: [
      {
        id: "fixture-table-2",
        format: "csv",
        rows: 4,
        columns: ["Zone", "Heat cells above threshold", "Canopy delta", "Priority"],
        preview: [
          { Zone: "Logistics belt", "Heat cells above threshold": 27, "Canopy delta": 2.4, Priority: "High" },
          { Zone: "School retrofit cluster", "Heat cells above threshold": 11, "Canopy delta": 8.2, Priority: "Medium" },
        ],
      },
    ],
  },
];
