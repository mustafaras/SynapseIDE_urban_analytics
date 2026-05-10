import { afterEach, describe, expect, it } from "vitest";
import type { CollaborationUser } from "@/types/collaboration";
import { createEmptyDashboard, createWidget } from "@/features/dashboard/layout";
import type { ProjectRecord } from "@/centerpanel/registry/types";
import { CollaborationEngine, createMemoryCollaborationAdapter } from "../engine";
import type { CollaborationCommentThread } from "../types";

function makeUser(id: string, name: string, color: string): CollaborationUser {
  return {
    id,
    name,
    email: `${id}@synapse.local`,
    avatar: name.split(" ").map((segment) => segment[0] ?? "").join("").slice(0, 2).toUpperCase(),
    role: "analyst",
    isOnline: true,
    lastSeen: new Date(),
    color,
  };
}

function makeProject(): ProjectRecord {
  const now = new Date().toISOString();
  return {
    id: "project-shared",
    name: "Shared Project",
    description: "Collaboration seed project",
    scale: "city",
    crs: "EPSG:4326",
    tags: ["mobility"],
    priority: 3,
    dataCompleteness: 40,
    sessionsCount: 0,
    indicators: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe("CollaborationEngine", () => {
  const engines: CollaborationEngine[] = [];

  afterEach(() => {
    while (engines.length > 0) {
      engines.pop()?.destroy();
    }
  });

  it("merges project field updates after reconnect", () => {
    const adapter = createMemoryCollaborationAdapter();
    const baseProject = makeProject();
    const dashboard = createEmptyDashboard("Shared Dashboard");

    const engineA = new CollaborationEngine(
      "room-projects",
      "client-a",
      makeUser("user-a", "Amber Atlas", "#f59e0b"),
      adapter,
      { projects: [baseProject], dashboards: { version: 1, dashboards: [dashboard], activeDashboardId: dashboard.id } },
    );
    const engineB = new CollaborationEngine(
      "room-projects",
      "client-b",
      makeUser("user-b", "Civic Echo", "#38bdf8"),
      adapter,
      { projects: [baseProject], dashboards: { version: 1, dashboards: [dashboard], activeDashboardId: dashboard.id } },
    );
    engines.push(engineA, engineB);

    engineA.pauseSync();
    engineB.pauseSync();

    engineA.updateProject(baseProject.id, { name: "Harbor Retrofit Brief" });
    engineB.updateProject(baseProject.id, { dataCompleteness: 82 });

    engineA.resumeSync();
    engineB.resumeSync();

    const merged = engineA.getSnapshot().projectRegistry.projects.find((project) => project.id === baseProject.id);
    expect(merged?.name).toBe("Harbor Retrofit Brief");
    expect(merged?.dataCompleteness).toBe(82);
  });

  it("merges concurrent note edits when clients reconnect", () => {
    const adapter = createMemoryCollaborationAdapter();
    const baseProject = makeProject();
    const dashboard = createEmptyDashboard("Shared Dashboard");

    const engineA = new CollaborationEngine(
      "room-notes",
      "client-a",
      makeUser("user-a", "Amber Atlas", "#f59e0b"),
      adapter,
      {
        projects: [baseProject],
        notes: {
          [baseProject.id]: {
            slots: { objective: "" },
            updatedAt: Date.now(),
          },
        },
        dashboards: { version: 1, dashboards: [dashboard], activeDashboardId: dashboard.id },
      },
    );
    const engineB = new CollaborationEngine(
      "room-notes",
      "client-b",
      makeUser("user-b", "Civic Echo", "#38bdf8"),
      adapter,
      {
        projects: [baseProject],
        notes: {
          [baseProject.id]: {
            slots: { objective: "" },
            updatedAt: Date.now(),
          },
        },
        dashboards: { version: 1, dashboards: [dashboard], activeDashboardId: dashboard.id },
      },
    );
    engines.push(engineA, engineB);

    engineA.pauseSync();
    engineB.pauseSync();

    engineA.setNoteSlot(baseProject.id, "objective", "Alpha");
    engineB.setNoteSlot(baseProject.id, "objective", "Beta");

    engineA.resumeSync();
    engineB.resumeSync();

    const mergedText = engineA.getSnapshot().notes[baseProject.id]?.slots.objective ?? "";
    expect(mergedText).toContain("Alpha");
    expect(mergedText).toContain("Beta");
  });

  it("retains widget additions from two offline dashboard editors", () => {
    const adapter = createMemoryCollaborationAdapter();
    const baseProject = makeProject();
    const dashboard = createEmptyDashboard("Shared Dashboard");

    const engineA = new CollaborationEngine(
      "room-dashboards",
      "client-a",
      makeUser("user-a", "Amber Atlas", "#f59e0b"),
      adapter,
      { projects: [baseProject], dashboards: { version: 1, dashboards: [dashboard], activeDashboardId: dashboard.id } },
    );
    const engineB = new CollaborationEngine(
      "room-dashboards",
      "client-b",
      makeUser("user-b", "Civic Echo", "#38bdf8"),
      adapter,
      { projects: [baseProject], dashboards: { version: 1, dashboards: [dashboard], activeDashboardId: dashboard.id } },
    );
    engines.push(engineA, engineB);

    engineA.pauseSync();
    engineB.pauseSync();

    engineA.updateDashboardDocument(dashboard.id, (current) => ({
      ...current,
      widgets: [...current.widgets, createWidget("text", { id: "widget-a" })],
    }));
    engineB.updateDashboardDocument(dashboard.id, (current) => ({
      ...current,
      widgets: [...current.widgets, createWidget("kpi", { id: "widget-b" })],
    }));

    engineA.resumeSync();
    engineB.resumeSync();

    const mergedDashboard = engineA.getSnapshot().dashboardLibrary.dashboards.find((entry) => entry.id === dashboard.id);
    const widgetIds = mergedDashboard?.widgets.map((widget) => widget.id) ?? [];
    expect(widgetIds).toContain("widget-a");
    expect(widgetIds).toContain("widget-b");
  });

  it("merges collaborative comment replies and resolution changes after reconnect", () => {
    const adapter = createMemoryCollaborationAdapter();
    const baseProject = makeProject();
    const dashboard = createEmptyDashboard("Shared Dashboard");
    const scopeId = `project:${baseProject.id}`;
    const seedThread: CollaborationCommentThread = {
      id: "thread-seed",
      scopeId,
      anchorLabel: "Project overview",
      body: "Validate assumptions before publishing.",
      authorId: "user-a",
      authorName: "Amber Atlas",
      authorColor: "#f59e0b",
      createdAt: 1,
      updatedAt: 1,
      status: "open",
      replies: [],
    };

    const engineA = new CollaborationEngine(
      "room-comments",
      "client-a",
      makeUser("user-a", "Amber Atlas", "#f59e0b"),
      adapter,
      {
        projects: [baseProject],
        dashboards: { version: 1, dashboards: [dashboard], activeDashboardId: dashboard.id },
        threadsByScope: { [scopeId]: [seedThread] },
      },
    );
    const engineB = new CollaborationEngine(
      "room-comments",
      "client-b",
      makeUser("user-b", "Civic Echo", "#38bdf8"),
      adapter,
      {
        projects: [baseProject],
        dashboards: { version: 1, dashboards: [dashboard], activeDashboardId: dashboard.id },
        threadsByScope: { [scopeId]: [seedThread] },
      },
    );
    engines.push(engineA, engineB);

    engineA.pauseSync();
    engineB.pauseSync();

    engineA.replyToThread(scopeId, seedThread.id, "Add uncertainty bounds to the methods note.");
    engineB.setThreadResolved(scopeId, seedThread.id, true);

    engineA.resumeSync();
    engineB.resumeSync();

    const mergedThread = engineA.getSnapshot().threadsByScope[scopeId]?.find((thread) => thread.id === seedThread.id);
    expect(mergedThread?.status).toBe("resolved");
    expect(mergedThread?.resolvedBy).toBe("Civic Echo");
    expect(mergedThread?.replies).toHaveLength(1);
    expect(mergedThread?.replies[0]?.body).toBe("Add uncertainty bounds to the methods note.");
  });
});