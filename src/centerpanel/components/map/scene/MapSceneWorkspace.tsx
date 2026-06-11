import React from "react";
import { Box, Building2, Clock3, Image, LandPlot, Layers3, Sun, Waypoints } from "lucide-react";
import {
  type GisStatusKey,
  MAP_COLORS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import type { MapSidebarTabId } from "../navigation";
import { MapWorkbenchSidebar, type MapWorkbenchSidebarTab } from "../sidebar";
import { GisStatusChip } from "../ui";

export type MapSceneTabId = Extract<
  MapSidebarTabId,
  | "scene-raster"
  | "scene-temporal"
  | "scene-3d"
  | "scene-zoning"
  | "scene-massing"
  | "scene-sun-shadow"
  | "scene-voxcity"
>;

export interface MapSceneStatusChip {
  id: string;
  label: string;
  status: GisStatusKey;
  title?: string;
}

export interface MapSceneWorkspaceProps {
  activeTabId: string;
  onTabChange: (id: string) => void;
  statusChips: readonly MapSceneStatusChip[];
  raster: React.ReactNode;
  temporal: React.ReactNode;
  scene3d: React.ReactNode;
  zoning: React.ReactNode;
  massing: React.ReactNode;
  sunShadow: React.ReactNode;
  voxCity: React.ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  width?: number | string;
}

const SCENE_TAB_DEFINITIONS: ReadonlyArray<{
  id: MapSceneTabId;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "scene-raster", label: "Raster", icon: <Image size={13} aria-hidden /> },
  { id: "scene-temporal", label: "Temporal", icon: <Clock3 size={13} aria-hidden /> },
  { id: "scene-3d", label: "3D Scene", icon: <Box size={13} aria-hidden /> },
  { id: "scene-zoning", label: "Zoning", icon: <LandPlot size={13} aria-hidden /> },
  { id: "scene-massing", label: "Massing", icon: <Building2 size={13} aria-hidden /> },
  { id: "scene-sun-shadow", label: "Sun/Shadow", icon: <Sun size={13} aria-hidden /> },
  { id: "scene-voxcity", label: "VoxCity", icon: <Layers3 size={13} aria-hidden /> },
];

const bodyStyle: React.CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: MAP_SPACING.md,
  minHeight: "100%",
  padding: MAP_SPACING.md,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const statusSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  paddingBottom: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const statusHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const statusChipRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const panelSlotStyle: React.CSSProperties = {
  minWidth: 0,
};

const MapSceneBody: React.FC<{
  statusChips: readonly MapSceneStatusChip[];
  children: React.ReactNode;
}> = ({ statusChips, children }) => (
  <div style={bodyStyle} data-testid="map-scene-tab-body">
    <section style={statusSectionStyle} aria-label="Scene status" data-testid="map-scene-status">
      <div style={statusHeaderStyle}>
        <Waypoints size={12} aria-hidden />
        Scene Status
      </div>
      <div style={statusChipRowStyle}>
        {statusChips.map((chip) => (
          <span key={chip.id} title={chip.title}>
            <GisStatusChip
              status={chip.status}
              label={chip.label}
              density="compact"
              data-testid={`map-scene-status-${chip.id}`}
            />
          </span>
        ))}
      </div>
    </section>
    <div style={panelSlotStyle} data-testid="map-scene-panel-slot">
      {children}
    </div>
  </div>
);

export const MapSceneWorkspace: React.FC<MapSceneWorkspaceProps> = ({
  activeTabId,
  onTabChange,
  statusChips,
  raster,
  temporal,
  scene3d,
  zoning,
  massing,
  sunShadow,
  voxCity,
  collapsed = false,
  onToggleCollapse,
  onClose,
  width = "100%",
}) => {
  const contentByTab: Record<MapSceneTabId, React.ReactNode> = {
    "scene-raster": raster,
    "scene-temporal": temporal,
    "scene-3d": scene3d,
    "scene-zoning": zoning,
    "scene-massing": massing,
    "scene-sun-shadow": sunShadow,
    "scene-voxcity": voxCity,
  };

  const tabs: MapWorkbenchSidebarTab[] = SCENE_TAB_DEFINITIONS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    render: () => (
      <MapSceneBody statusChips={statusChips}>
        {contentByTab[tab.id]}
      </MapSceneBody>
    ),
  }));

  return (
    <MapWorkbenchSidebar
      title="Scene"
      subtitle="Workspace"
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={onTabChange}
      collapsed={collapsed}
      {...(onToggleCollapse ? { onToggleCollapse } : {})}
      {...(onClose ? { onClose } : {})}
      width={width}
      data-testid="map-scene-workspace"
    />
  );
};
