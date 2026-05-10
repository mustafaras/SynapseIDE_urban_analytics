import { backupCorrupt, safeGet, safeSet } from "@/utils/storage";
import { normalizeDashboardDocument } from "./layout";
import { createDashboardFromTemplate } from "./templates";
import type { DashboardDocument, DashboardLibraryState, DashboardWidgetType } from "./types";

export const DASHBOARD_STORAGE_KEY = "synapse.dashboard.layouts.v1";
export const DASHBOARD_PENDING_BINDING_KEY = "synapse.dashboard.pending-binding.v1";

export interface PendingDashboardBinding {
  bindingId: string;
  widgetType: DashboardWidgetType;
}

function createDefaultLibrary(): DashboardLibraryState {
  const starter = createDashboardFromTemplate("city_profile");
  return {
    version: 1,
    dashboards: [starter],
    activeDashboardId: starter.id,
  };
}

export function loadDashboardLibrary(): DashboardLibraryState {
  const result = safeGet<DashboardLibraryState>(DASHBOARD_STORAGE_KEY);
  if (!result.ok) {
    if (result.error === "parse") {
      backupCorrupt(DASHBOARD_STORAGE_KEY, result.raw);
    }
    return createDefaultLibrary();
  }

  const dashboards = Array.isArray(result.value.dashboards)
    ? result.value.dashboards.map((dashboard) => normalizeDashboardDocument(dashboard))
    : [];

  if (dashboards.length === 0) {
    return createDefaultLibrary();
  }

  const activeDashboardId = dashboards.some((dashboard) => dashboard.id === result.value.activeDashboardId)
    ? result.value.activeDashboardId
    : dashboards[0]!.id;

  return {
    version: 1,
    dashboards,
    activeDashboardId,
  };
}

export function persistDashboardLibrary(library: DashboardLibraryState): boolean {
  return safeSet(DASHBOARD_STORAGE_KEY, library).ok;
}

export function upsertDashboardDocument(
  library: DashboardLibraryState,
  dashboard: DashboardDocument,
  makeActive = true,
): DashboardLibraryState {
  const nextDashboard = normalizeDashboardDocument(dashboard);
  const existingIndex = library.dashboards.findIndex((entry) => entry.id === nextDashboard.id);
  const dashboards = [...library.dashboards];

  if (existingIndex >= 0) {
    dashboards[existingIndex] = nextDashboard;
  } else {
    dashboards.unshift(nextDashboard);
  }

  return {
    version: 1,
    dashboards,
    activeDashboardId: makeActive ? nextDashboard.id : library.activeDashboardId,
  };
}

export function queuePendingDashboardBinding(pending: PendingDashboardBinding): boolean {
  return safeSet(DASHBOARD_PENDING_BINDING_KEY, pending).ok;
}

export function consumePendingDashboardBinding(): PendingDashboardBinding | null {
  const result = safeGet<PendingDashboardBinding>(DASHBOARD_PENDING_BINDING_KEY);
  if (!result.ok || !result.value || typeof result.value.bindingId !== "string" || typeof result.value.widgetType !== "string") {
    return null;
  }

  localStorage.removeItem(DASHBOARD_PENDING_BINDING_KEY);
  return result.value;
}
