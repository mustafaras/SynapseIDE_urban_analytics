import { expect, test } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, setFormValue, triggerDomClick } from "./helpers/urbanAnalytics";

test.describe("Report history flow", () => {
  test("captures snapshots, diff review, and report-save history in the report workspace", async ({ page }) => {
    await resetWorkbenchState(page);
    await page.evaluate(async () => {
      const [{ seedProjects }, { loadReportLibraryState, saveReportLibraryState }] = await Promise.all([
        import("/src/centerpanel/registry/seed.ts"),
        import("/src/services/reporting/storage.ts"),
      ]);

      const projects = seedProjects();
      const target = projects[0];
      if (target) {
        target.reportSnapshots = [
          {
            id: "seeded-snapshot-1",
            createdAt: "2026-04-24T11:55:00.000Z",
            label: `${target.name} snapshot`,
            summary: "Seeded snapshot for report history review.",
            slots: {
              objective: "Seeded objective before the save flow.",
            },
            sourceMode: "real",
            artifact: {
              kind: "snapshot",
              label: `${target.name} snapshot`,
              id: "seeded-snapshot-1",
            },
          },
        ];
        target.recentChanges = [
          {
            id: "seeded-change-1",
            changedAt: "2026-04-24T11:55:00.000Z",
            kind: "snapshot-created",
            title: `${target.name} snapshot`,
            description: "Saved a report review snapshot for comparison.",
            sourceMode: "real",
            artifact: {
              kind: "snapshot",
              label: `${target.name} snapshot`,
              id: "seeded-snapshot-1",
            },
            preview: "Seeded snapshot for report history review.",
          },
        ];
      }

      window.localStorage.setItem("synapse.urban.registry.v1", JSON.stringify(projects));

      const libraryState = loadReportLibraryState();
      if (libraryState.reports[0]) {
        libraryState.reports[0].name = "Seeded Review History";
        saveReportLibraryState(libraryState);
      }
    });

    const urbanModal = await openUrbanAnalyticsWorkbench(page);

    const reportTab = urbanModal.getByTestId("cp-tab-report");
    await triggerDomClick(reportTab);
    await expect(reportTab).toHaveAttribute("aria-selected", "true");

    const closeDetailPanelButton = urbanModal.getByRole("button", { name: "Close detail panel" });
    if (await closeDetailPanelButton.isVisible().catch(() => false)) {
      await closeDetailPanelButton.click();
    }

    const recentChanges = urbanModal.getByTestId("note-recent-changes").first();
    await expect(recentChanges).not.toContainText("Save a snapshot, save the report, or complete an analytical run");
    await expect(recentChanges).toContainText("snapshot", { ignoreCase: true });

    const builder = urbanModal.getByTestId("report-builder");
    await setFormValue(builder.getByLabel("Report Name"), "Playwright Review History");
    const saveButton = builder.getByRole("button", { name: "Save" });
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click();
    await expect(builder).toContainText("Saved Playwright Review History");

    await expect
      .poll(async () => page.evaluate(() => {
        const raw = window.localStorage.getItem("synapse.urban.registry.v1");
        const projects = raw ? JSON.parse(raw) : [];
        return projects.flatMap((project: { recentChanges?: Array<{ title?: string }> }) =>
          (project.recentChanges ?? []).map((entry) => entry.title ?? ""),
        );
      }))
      .toContain("Saved Playwright Review History");

    await expect(recentChanges).toContainText("Saved Playwright Review History");
    await expect(recentChanges).toContainText(/Real data|Unknown source/);
  });
});
