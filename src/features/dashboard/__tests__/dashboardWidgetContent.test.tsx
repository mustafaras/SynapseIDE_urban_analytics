import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardWidgetContent } from "../DashboardWidgetContent";
import type { DashboardMetricBinding, DashboardWidget } from "../types";

function makeWidget(): DashboardWidget {
  return {
    id: "widget-metric",
    type: "kpi",
    layout: { x: 0, y: 0, w: 4, h: 3 },
    config: {
      title: "Population growth",
      style: { accentColor: "#f59e0b", density: "comfortable" },
    },
  };
}

describe("DashboardWidgetContent", () => {
  it("renders metric bindings with value and change label", () => {
    const binding: DashboardMetricBinding = {
      id: "metric-1",
      kind: "metric",
      label: "Population growth",
      description: "Quarterly change",
      formattedValue: "12.4%",
      rawValue: 12.4,
      changeLabel: "+1.2 pts",
      status: "improving",
      updatedAt: "2026-04-24T00:00:00.000Z",
      tags: ["city_profile"],
    };

    const html = renderToStaticMarkup(<>{DashboardWidgetContent({ widget: makeWidget(), binding })}</>);

    expect(html).toContain("12.4%");
    expect(html).toContain("Quarterly change");
    expect(html).toContain("+1.2 pts");
  });

  it("renders an inspector hint when the widget has no binding", () => {
    const html = renderToStaticMarkup(<>{DashboardWidgetContent({ widget: makeWidget(), binding: null })}</>);

    expect(html).toContain("choose a binding in the inspector");
  });
});