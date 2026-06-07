export type MapBottomPanelTabId =
  | "problems"
  | "attributes"
  | "timeline"
  | "tasks"
  | "diagnostics"
  | "console"
  | "measurements";

export interface MapBottomPanelTabDefinition {
  id: MapBottomPanelTabId;
  label: string;
  ariaLabel: string;
  description: string;
}

export const MAP_LEGACY_BOTTOM_PANEL_TAB_DEFINITIONS = [
  {
    id: "problems",
    label: "Problems",
    ariaLabel: "Problems legacy bottom panel tab",
    description: "Scientific QA blockers, warnings, CRS issues, geometry validity, and render errors.",
  },
  {
    id: "attributes",
    label: "Attributes",
    ariaLabel: "Attributes legacy bottom panel tab",
    description: "Attribute table, selected rows, field profile, derived fields, and join preview.",
  },
  {
    id: "timeline",
    label: "Timeline",
    ariaLabel: "Timeline legacy bottom panel tab",
    description: "Review timeline, audit trail, collaboration status, and evidence-linked comments.",
  },
  {
    id: "tasks",
    label: "Tasks",
    ariaLabel: "Tasks legacy bottom panel tab",
    description: "Imports, workflow runs, worker tasks, exports, and background progress.",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    ariaLabel: "Diagnostics legacy bottom panel tab",
    description: "Render budget, worker failures, redacted telemetry, and retry actions.",
  },
  {
    id: "console",
    label: "Console",
    ariaLabel: "Console legacy bottom panel tab",
    description: "Optional redacted operational log without raw data, secrets, or source bytes.",
  },
  {
    id: "measurements",
    label: "Measurements",
    ariaLabel: "Measurements legacy bottom panel tab",
    description: "Measurement results, units, and CRS caveats.",
  },
] as const satisfies readonly MapBottomPanelTabDefinition[];
