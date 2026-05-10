export type Subsection = { id: string; title: string };
export type Section = {
  id:
    | "overview"
    | "data-inventory"
    | "baseline"
    | "analysis"
    | "indicators"
    | "interventions"
    | "references";
  title: string;
  children?: Subsection[];
};

export const SECTIONS: Section[] = [
  { id: "overview", title: "Overview" },
  { id: "data-inventory", title: "Data Inventory" },
  {
    id: "baseline",
    title: "Baseline",
    children: [
      { id: "demographics", title: "Demographics" },
      { id: "land-use", title: "Land Use" },
      { id: "built-form", title: "Built Form" },
      { id: "transport", title: "Transport" },
      { id: "environment", title: "Environment" },
    ],
  },
  {
    id: "analysis",
    title: "Analysis",
    children: [
      { id: "spatial-stats", title: "Spatial Statistics" },
      { id: "multivariate", title: "Multivariate Analysis" },
      { id: "network-analysis", title: "Network Analysis" },
      { id: "remote-sensing", title: "Remote Sensing" },
      { id: "geoai-ml", title: "GeoAI & Machine Learning" },
      { id: "simulations", title: "Simulations" },
    ],
  },
  {
    id: "indicators",
    title: "Indicators",
    children: [
      { id: "morphology-metrics", title: "Morphology Metrics" },
      { id: "accessibility-metrics", title: "Accessibility Metrics" },
      { id: "environmental-metrics", title: "Environmental Metrics" },
      { id: "equity-metrics", title: "Equity Metrics" },
    ],
  },
  {
    id: "interventions",
    title: "Interventions",
    children: [
      { id: "design-proposals", title: "Design Proposals" },
      { id: "policy-recs", title: "Policy Recommendations" },
      { id: "scenario-compare", title: "Scenario Comparison" },
    ],
  },
  { id: "references", title: "References" },
];

export const MAIN_SCROLL_ROOT_ID = "cp3-main-scroll-root";


export const anchorId = (sectionId: string, prefix = "cp-sec") => `${prefix}--${sectionId}`;


export const anchorSubId = (sectionId: string, subId: string, prefix = "cp-sec") =>
  `${anchorId(sectionId, prefix)}__${subId}`;
