export type MapAccessibilitySurface =
  | "activity-rail"
  | "command-center"
  | "sidebar"
  | "inspector"
  | "bottom-panel"
  | "canvas"
  | "escape-scope"
  | "disabled-reason"
  | "high-contrast"
  | "reduced-motion";

export interface MapAccessibilityInteractionRule {
  id: string;
  surface: MapAccessibilitySurface;
  keyboardRule: string;
  focusRule: string;
  escapeRule: string;
  proof: readonly string[];
}

export const MAP_ACCESSIBILITY_INTERACTION_MATRIX: readonly MapAccessibilityInteractionRule[] = [
  {
    id: "activity-rail-traversal",
    surface: "activity-rail",
    keyboardRule: "Rail buttons stay in predictable DOM tab order and support ArrowUp, ArrowDown, Home, and End traversal across enabled activities.",
    focusRule: "Active activity buttons expose aria-pressed and keep visible focus through the modal shell focus styles.",
    escapeRule: "Escape is not consumed by the rail; it bubbles to the nearest open layer of UI.",
    proof: ["map-activity-rail", "activity-btn-layers", "activity-btn-data"],
  },
  {
    id: "command-center-order",
    surface: "command-center",
    keyboardRule: "Focus reaches search, palette, contextual primary action, overflow, and close controls in visual order.",
    focusRule: "The command palette restores focus to its opener when it closes.",
    escapeRule: "Escape closes the command palette before the modal is eligible to close.",
    proof: [
      "map-command-center",
      "map-command-palette",
      "map-toolbar-command-command-palette",
      "map-command-palette-option-task-lens-analyst",
      "map-command-palette-option-task-lens-planner",
      "map-command-palette-option-task-lens-reviewer",
      "map-command-palette-option-task-lens-publisher",
      "map-command-palette-option-switch-density",
    ],
  },
  {
    id: "sidebar-close-return",
    surface: "sidebar",
    keyboardRule: "Sidebar tabs use the shared tab primitive and are selectable with Arrow keys, Home, and End.",
    focusRule: "Closing the sidebar returns focus to the active activity opener when available.",
    escapeRule: "Escape closes the expanded sidebar and does not close the modal.",
    proof: ["map-workbench-sidebar", "map-workbench-sidebar-close", "activity-btn-layers"],
  },
  {
    id: "inspector-close-return",
    surface: "inspector",
    keyboardRule: "Inspector tabs use the shared tab primitive and preserve the selected metadata context.",
    focusRule: "Closing the inspector returns focus to the control that opened layer inspection.",
    escapeRule: "Escape closes the inspector host and stops at that layer.",
    proof: ["map-inspector-host", "map-layer-inspector", "map-layer-inspect-trigger"],
  },
  {
    id: "bottom-panel-tabs",
    surface: "bottom-panel",
    keyboardRule: "Bottom tabs are selectable with Arrow keys, Home, and End.",
    focusRule: "Closing the bottom panel returns focus to the opener when available.",
    escapeRule: "Escape closes the bottom panel and does not close the modal.",
    proof: ["map-bottom-panel", "map-bottom-tab-problems", "map-bottom-tab-timeline"],
  },
  {
    id: "canvas-fallback-controls",
    surface: "canvas",
    keyboardRule: "The interactive map canvas accepts Arrow pan, plus/minus zoom, and R reset, with visible fallback buttons for pan, zoom, reset, and focus.",
    focusRule: "The skip link and fallback focus control move focus to the map canvas inside the modal trap.",
    escapeRule: "Escape clears active canvas tools before the modal close path is considered.",
    proof: ["map-explorer-canvas", "data-map-canvas-fallback-controls", "map-canvas-viewport-controls"],
  },
  {
    id: "scoped-escape-stack",
    surface: "escape-scope",
    keyboardRule: "Nested dialogs and panels handle Escape locally before the modal lifecycle listener closes the dialog.",
    focusRule: "Handled Escape events keep focus inside the modal shell or return it to the opener.",
    escapeRule: "Command palette, import hub, inspector, bottom panel, sidebar, and active tools close before the modal closes.",
    proof: ["map-command-palette", "Spatial data import hub", "map-inspector-host", "map-bottom-panel"],
  },
  {
    id: "disabled-reason-text",
    surface: "disabled-reason",
    keyboardRule: "Disabled controls remain skipped by native tab order.",
    focusRule: "Disabled controls expose a data-disabled-reason and aria-described hidden text for the reason.",
    escapeRule: "Disabled controls never intercept Escape.",
    proof: ["data-disabled-reason", "aria-describedby", "map-command-palette-option-undo-map-action-disabled-reason"],
  },
  {
    id: "forced-colors-states",
    surface: "high-contrast",
    keyboardRule: "Active, blocked, demo, and synthetic states include text, aria state, border weight, or line style beyond hue.",
    focusRule: "Forced-colors focus uses system Highlight outlines.",
    escapeRule: "High-contrast styling does not change Escape routing.",
    proof: ["aria-pressed", "data-status=blocked", "data-status=demo", "data-status=synthetic", "border-width:2px", "border-style:dashed"],
  },
  {
    id: "reduced-motion-safety",
    surface: "reduced-motion",
    keyboardRule: "Reduced motion removes non-essential shell animation and uses jumpTo for keyboard map reset.",
    focusRule: "Focus movement remains immediate and visible when reduced motion is active.",
    escapeRule: "Reduced motion does not change scoped Escape priority.",
    proof: ["prefers-reduced-motion", "jumpTo", "transition: none", "animation: none", "scroll-behavior: auto"],
  },
];

export function getMapAccessibilityInteractionRule(id: string): MapAccessibilityInteractionRule | null {
  return MAP_ACCESSIBILITY_INTERACTION_MATRIX.find((rule) => rule.id === id) ?? null;
}
