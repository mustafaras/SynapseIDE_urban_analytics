import { describe, expect, it } from "vitest";
import { buildDashboardEmbedHtml } from "../export";
import { createDashboardFromTemplate } from "../templates";

describe("dashboard export", () => {
  it("builds embeddable html with widget content and metadata", () => {
    const dashboard = createDashboardFromTemplate("city_profile");
    const html = buildDashboardEmbedHtml(dashboard);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain(dashboard.name);
    expect(html).toContain("District Profile Map");
    expect(html).toContain("1.24M");
    expect(html).toContain("Current population estimate for the metropolitan planning area.");
    expect(html).toContain("grid-template-columns: repeat(12");
    expect(html).toContain("city_profile");
  });
});
