import { useMemo } from "react";

import { IconSave } from "../MapIcons";
import { type MapActivityItem } from "../MapWorkspaceShell";
import {
  getRuntimeMapActivityDefinition,
  type MapActivityDefinition,
  type MapActivityId,
} from "../mapActivityRuntime";
import { MAP_ICON_SIZES } from "../mapTokens";
import {
  formatMapActivityTooltip,
  MAP_PRIMARY_ACTIVITY_DEFINITIONS,
  MAP_UTILITY_ACTIVITY_DEFINITIONS,
  renderMapActivityIcon,
} from "./mapExplorerRuntimeShellUi";

interface UseMapActivityRailItemsParams {
  activeActivityId: MapActivityId;
  handleSelectMapActivity: (activity: MapActivityDefinition) => void;
  persistenceDisabled: boolean;
  saveProject: () => void;
}

export function useMapActivityRailItems({
  activeActivityId,
  handleSelectMapActivity,
  persistenceDisabled,
  saveProject,
}: UseMapActivityRailItemsParams) {
  return useMemo(() => {
    const activeActivity = getRuntimeMapActivityDefinition(activeActivityId);
    const activityRailItems: MapActivityItem[] = MAP_PRIMARY_ACTIVITY_DEFINITIONS.map((activity) => ({
      id: activity.id,
      label: activity.label,
      ariaLabel: activity.ariaLabel,
      tooltip: formatMapActivityTooltip(activity),
      icon: renderMapActivityIcon(activity),
      active: activeActivityId === activity.id,
      onClick: () => handleSelectMapActivity(activity),
    }));

    const activityRailBottomItems: MapActivityItem[] = [
      ...MAP_UTILITY_ACTIVITY_DEFINITIONS.map((activity) => ({
        id: activity.id,
        label: activity.label,
        ariaLabel: activity.ariaLabel,
        tooltip: formatMapActivityTooltip(activity),
        icon: renderMapActivityIcon(activity),
        active: activeActivityId === activity.id,
        onClick: () => handleSelectMapActivity(activity),
      })),
      {
        id: "save",
        label: "Project Save",
        ariaLabel: "Save map project",
        tooltip: "Project Save: persist the current Map Explorer project state.",
        icon: <IconSave size={MAP_ICON_SIZES.sm} />,
        disabled: persistenceDisabled,
        ...(persistenceDisabled ? { disabledReason: "Select or create a project before saving map state." } : {}),
        onClick: saveProject,
      },
    ];

    return {
      activeActivity,
      activityRailBottomItems,
      activityRailItems,
    };
  }, [activeActivityId, handleSelectMapActivity, persistenceDisabled, saveProject]);
}
