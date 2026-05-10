import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyDashboard } from "../layout";
import {
  DASHBOARD_STORAGE_KEY,
  loadDashboardLibrary,
  persistDashboardLibrary,
  upsertDashboardDocument,
} from "../storage";

function createStorageMock(): Storage {
  const memory = new Map<string, string>();
  return {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key: string) {
      return memory.has(key) ? memory.get(key)! : null;
    },
    key(index: number) {
      return Array.from(memory.keys())[index] ?? null;
    },
    removeItem(key: string) {
      memory.delete(key);
    },
    setItem(key: string, value: string) {
      memory.set(key, value);
    },
  };
}

describe("dashboard storage", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createStorageMock(),
    });
    localStorage.clear();
  });

  it("persists and restores dashboard libraries", () => {
    const dashboard = createEmptyDashboard("Saved Dashboard");
    const saved = persistDashboardLibrary({
      version: 1,
      dashboards: [dashboard],
      activeDashboardId: dashboard.id,
    });

    expect(saved).toBe(true);

    const restored = loadDashboardLibrary();
    expect(restored.activeDashboardId).toBe(dashboard.id);
    expect(restored.dashboards[0]?.name).toBe("Saved Dashboard");
  });

  it("falls back to a default starter layout when storage is corrupt", () => {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, "{bad-json");

    const restored = loadDashboardLibrary();

    expect(restored.dashboards.length).toBeGreaterThan(0);
    expect(restored.dashboards[0]?.templateId).toBe("city_profile");
    expect(
      Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index) ?? "")
        .some((key) => key.startsWith(`${DASHBOARD_STORAGE_KEY}.corrupt.`)),
    ).toBe(true);
  });

  it("upserts dashboards without losing the active selection", () => {
    const first = createEmptyDashboard("First");
    const second = createEmptyDashboard("Second");

    const next = upsertDashboardDocument(
      {
        version: 1,
        dashboards: [first],
        activeDashboardId: first.id,
      },
      second,
      false,
    );

    expect(next.dashboards).toHaveLength(2);
    expect(next.activeDashboardId).toBe(first.id);
  });
});
