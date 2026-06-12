import React, { useMemo } from "react";
import { Puzzle, X } from "lucide-react";
import type {
  MapExtensionAvailabilityStatus,
  MapExtensionDescriptor,
  MapExtensionKind,
} from "@/services/map/plugins";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { GisIconButton, GisSectionHeader, GisStatusChip, type GisStatusChipProps } from "../ui";
import motionStyles from "../design/motion.module.css";

export interface MapPluginPanelProps {
  visible: boolean;
  extensions: readonly MapExtensionDescriptor[];
  onClose: () => void;
}

const KIND_ORDER: MapExtensionKind[] = [
  "source-connector",
  "renderer",
  "processing-tool",
  "urban-method-bridge",
];

const KIND_LABELS: Record<MapExtensionKind, string> = {
  "source-connector": "Source connectors",
  renderer: "Renderers",
  "processing-tool": "Processing tools",
  "urban-method-bridge": "Urban bridges",
};

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.md,
  right: MAP_SPACING.md,
  width: "min(34rem, calc(100% - 2rem))",
  maxHeight: "min(38rem, calc(100% - 2rem))",
  zIndex: MAP_Z_INDEX.symbologyPanel + 14,
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
  padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const titleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const bodyStyle: React.CSSProperties = {
  overflowY: "auto",
  display: "grid",
  alignContent: "start",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
};

const groupStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const groupHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  paddingBottom: MAP_SPACING.xs,
  borderBottom: MAP_STROKES.hairlineSubtle,
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.xs}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  borderLeft: `2px solid ${MAP_COLORS.transparent}`,
};

const rowTitleStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.text,
};

const rowSummaryStyle: React.CSSProperties = {
  margin: `${MAP_SPACING.xs} 0 0`,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const metaStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  marginTop: MAP_SPACING.xs,
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const contributionListStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  columnGap: MAP_SPACING.sm,
  rowGap: "0.125rem",
  margin: `${MAP_SPACING.xs} 0 0`,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const contributionKeyStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const contributionValueStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  minWidth: 0,
  overflowWrap: "anywhere",
};

interface ContributionDetail {
  label: string;
  value: string;
}

function contributionDetails(extension: MapExtensionDescriptor): ContributionDetail[] {
  switch (extension.kind) {
    case "source-connector": {
      const { contribution } = extension;
      return [
        { label: "Catalog", value: contribution.catalogGroup },
        { label: "Service", value: contribution.provider.serviceKind },
        { label: "Secrets", value: contribution.secretMode },
      ];
    }
    case "renderer": {
      const { contribution } = extension;
      return [
        { label: "Style family", value: contribution.styleFamily },
        { label: "Geometry", value: contribution.compatibleGeometry.join(", ") },
        { label: "Legend", value: contribution.legendContract },
        { label: "QA gates", value: contribution.qaGates.join(", ") || "none declared" },
      ];
    }
    case "processing-tool": {
      const { descriptor } = extension.contribution;
      return [
        { label: "Tool id", value: descriptor.toolId },
        { label: "QA gated", value: descriptor.qaGated ? "yes" : "no" },
      ];
    }
    case "urban-method-bridge": {
      const { contribution } = extension;
      const details: ContributionDetail[] = [
        { label: "Method", value: contribution.methodId },
        { label: "Actions", value: contribution.requestedActions.join(", ") },
      ];
      const requiredCrs = contribution.requirements?.layer?.requiredCrs;
      if (requiredCrs) details.push({ label: "Required CRS", value: requiredCrs });
      return details;
    }
    default:
      return [];
  }
}

function statusForAvailability(status: MapExtensionAvailabilityStatus): GisStatusChipProps["status"] {
  if (status === "available") return "ready";
  if (status === "limited") return "caveat";
  if (status === "blocked") return "blocked";
  return "unknown";
}

function groupExtensions(extensions: readonly MapExtensionDescriptor[]): Record<MapExtensionKind, MapExtensionDescriptor[]> {
  const groups: Record<MapExtensionKind, MapExtensionDescriptor[]> = {
    "source-connector": [],
    renderer: [],
    "processing-tool": [],
    "urban-method-bridge": [],
  };
  extensions.forEach((extension) => groups[extension.kind].push(extension));
  for (const kind of KIND_ORDER) {
    groups[kind].sort((left, right) => left.label.localeCompare(right.label));
  }
  return groups;
}

export function MapPluginPanel({ visible, extensions, onClose }: MapPluginPanelProps): React.ReactElement | null {
  const groups = useMemo(() => groupExtensions(extensions), [extensions]);

  if (!visible) return null;

  return (
    <section
      style={panelStyle}
      className={motionStyles.panelIn}
      role="dialog"
      aria-label="Plugin registry"
      data-testid="map-plugin-panel"
    >
      <header style={headerStyle}>
        <h2 style={titleStyle}>
          <Puzzle size={16} aria-hidden /> Plugin registry
        </h2>
        <GisIconButton label="Close plugin registry" icon={<X size={16} aria-hidden />} onClick={onClose} size="md" />
      </header>
      <div style={bodyStyle}>
        {KIND_ORDER.map((kind) => (
          <section key={kind} style={groupStyle} aria-label={KIND_LABELS[kind]}>
            <GisSectionHeader
              title={KIND_LABELS[kind]}
              level={4}
              compact
              separator={false}
              actions={<GisStatusChip status={groups[kind].length > 0 ? "ready" : "caveat"} label={groups[kind].length.toLocaleString()} density="compact" />}
              style={groupHeaderStyle}
            />
            {groups[kind].map((extension) => (
              <div
                key={extension.extensionId}
                style={{
                  ...rowStyle,
                  borderLeftColor: extension.availabilityStatus === "blocked"
                    ? MAP_COLORS.error
                    : extension.availabilityStatus === "limited"
                      ? MAP_COLORS.caveatText
                      : MAP_COLORS.interaction,
                }}
                data-testid={`map-plugin-extension-${extension.extensionId}`}
                data-kind={extension.kind}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={rowTitleStyle} title={extension.label}>{extension.label}</div>
                  <p style={rowSummaryStyle}>{extension.summary}</p>
                  <div style={metaStyle}>
                    <span>{extension.extensionId}</span>
                    <span>{extension.capability}</span>
                    <span>{extension.executionScope}</span>
                    <span>{extension.pluginId}@{extension.version}</span>
                  </div>
                  <dl style={contributionListStyle} data-testid={`map-plugin-contribution-${extension.extensionId}`}>
                    {contributionDetails(extension).map((detail) => (
                      <React.Fragment key={detail.label}>
                        <dt style={contributionKeyStyle}>{detail.label}</dt>
                        <dd style={contributionValueStyle}>{detail.value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                  {extension.disabledReason ? (
                    <p style={{ ...rowSummaryStyle, color: MAP_COLORS.caveatText }}>{extension.disabledReason}</p>
                  ) : null}
                </div>
                <div style={{ display: "grid", justifyItems: "end", alignContent: "start", gap: MAP_SPACING.xs }}>
                  <GisStatusChip
                    status={statusForAvailability(extension.availabilityStatus)}
                    label={extension.availabilityStatus.replace(/-/g, " ")}
                    compact
                  />
                  <span style={{ ...metaStyle, marginTop: 0 }}>{extension.capabilityStatus.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}