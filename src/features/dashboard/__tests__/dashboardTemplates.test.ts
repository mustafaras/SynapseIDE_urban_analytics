import { describe, expect, it } from "vitest";
import { getDashboardBinding } from "../dataBindings";
import { validateDashboardWidgets, WIDGET_BINDING_COMPATIBILITY } from "../layout";
import { createDashboardFromTemplate, DASHBOARD_TEMPLATES } from "../templates";

describe("dashboard templates", () => {
  it("registers the five required templates", () => {
    expect(DASHBOARD_TEMPLATES.map((template) => template.id)).toEqual([
      "city_profile",
      "sdg_monitoring",
      "risk_assessment",
      "accessibility_equity",
      "neighborhood_comparison",
    ]);
  });

  it("keeps template widgets collision-free and binding-compatible", () => {
    for (const template of DASHBOARD_TEMPLATES) {
      expect(template.dashboard.widgets.length).toBeGreaterThan(0);
      expect(validateDashboardWidgets(template.dashboard.widgets, template.dashboard.columns)).toEqual([]);

      for (const widget of template.dashboard.widgets) {
        const binding = getDashboardBinding(widget.config.bindingId);
        if (!binding) {
          continue;
        }
        expect(WIDGET_BINDING_COMPATIBILITY[widget.type]).toContain(binding.kind);
      }
    }
  });

  it("creates independent template copies for editing", () => {
    const template = DASHBOARD_TEMPLATES[0]!;
    const clone = createDashboardFromTemplate(template.id);

    expect(clone.id).not.toBe(template.dashboard.id);
    expect(clone.templateId).toBe(template.id);
    expect(clone.widgets).toHaveLength(template.dashboard.widgets.length);
    expect(clone.widgets[0]?.id).toBe(template.dashboard.widgets[0]?.id);
    expect(clone.createdAt).not.toBe(template.dashboard.createdAt);
  });
});
