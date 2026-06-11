import React, { useMemo, useState } from "react";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import type { LayerSchemaFieldSummary, OverlayLayerConfig } from "../mapTypes";
import { normalizeLayerRegistryMetadata } from "../mapLayerMetadata";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { IconClose } from "../MapIcons";
import { LayerStyleEditor } from "./style/LayerStyleEditor";
import type { LayerStyleUpdate } from "./style/legendContract";
import {
  GisEmptyState,
  GisIconButton,
  GisTabs,
} from "../ui";
import motionStyles from "../design/motion.module.css";

/**
 * LayerInspector — a tabbed, devtools-free readout of everything the metadata
 * resolvers already know about a layer. It calls `normalizeLayerRegistryMetadata`
 * (never re-implements resolver logic) and renders `unknown`/`missing` explicitly
 * so an analyst can judge readiness from this panel alone.
 */
export interface LayerInspectorProps {
  layer: OverlayLayerConfig;
  /** Resolved source handle for the layer (by `metadata.sourceId`), if registered. */
  sourceHandle?: SourceHandle | null;
  onClose: () => void;
  onApplyStyle?: (layerId: string, update: LayerStyleUpdate) => void;
  onAnnounce?: (message: string) => void;
  /** Initial active tab (defaults to "overview"); primarily a testability hook. */
  initialTab?: InspectorTabId;
  /** Host-managed rendering removes floating position, border, shadow, and optional header chrome. */
  presentation?: "floating" | "embedded";
  showHeader?: boolean;
}

export type InspectorTabId =
  | "overview"
  | "source"
  | "schema"
  | "crs"
  | "qa"
  | "style"
  | "lineage"
  | "report";

const TABS: ReadonlyArray<{ id: InspectorTabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "source", label: "Source" },
  { id: "schema", label: "Schema" },
  { id: "crs", label: "CRS" },
  { id: "qa", label: "QA" },
  { id: "style", label: "Style" },
  { id: "lineage", label: "Lineage" },
  { id: "report", label: "Report" },
];

const UNKNOWN = "unknown";

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.sm,
  right: MAP_SPACING.sm,
  bottom: MAP_SPACING.sm,
  width: "min(420px, 92vw)",
  display: "flex",
  flexDirection: "column",
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.md,
  boxShadow: MAP_SHADOWS.dropdown,
  zIndex: MAP_Z_INDEX.dropdown,
  overflow: "hidden",
};

const embeddedPanelStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  background: MAP_COLORS.transparent,
  border: MAP_STROKES.none,
  borderRadius: 0,
  boxShadow: MAP_SHADOWS.none,
  zIndex: "auto",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  borderBottom: MAP_STROKES.hairline,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: 0,
  color: MAP_COLORS.textMuted,
};

const titleStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.text,
  ...MAP_TEXT_STYLES.titleWrap,
  maxWidth: "22rem",
};

const bodyStyle: React.CSSProperties = {
  padding: MAP_SPACING.sm,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: MAP_SPACING.md,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: 0,
  color: MAP_COLORS.textMuted,
  marginBottom: MAP_SPACING.xs,
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(6.5rem, 0.42fr) minmax(0, 1fr)",
  alignItems: "start",
  gap: MAP_SPACING.sm,
  padding: `2px 0`,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
};

const rowLabelStyle: React.CSSProperties = { color: MAP_COLORS.textMuted, ...MAP_TEXT_STYLES.truncate };
const rowValueStyle: React.CSSProperties = { color: MAP_COLORS.text, textAlign: "right", ...MAP_TEXT_STYLES.valueWrap };
const unknownStyle: React.CSSProperties = { color: MAP_COLORS.caveatText, fontStyle: "italic" };
const monoStyle: React.CSSProperties = { fontFamily: MAP_TYPOGRAPHY.fontFamilyMono };

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  maxWidth: "100%",
  padding: `1px ${MAP_SPACING.xs}`,
  margin: "1px",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  color: MAP_COLORS.text,
  overflowWrap: "anywhere",
};

const noteStyle: React.CSSProperties = {
  color: MAP_COLORS.caveatText,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.4,
};

const helperTextStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.4,
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.md,
};

const summarySectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const warningListStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const warningCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 2,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: "color-mix(in srgb, var(--syn-status-warning, #f59e0b) 10%, transparent)",
};

const warningTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const summaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "1.875rem",
  padding: `0 ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  cursor: "pointer",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const detailsWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgWorkspace,
};

const detailsSummaryStyle: React.CSSProperties = {
  cursor: "pointer",
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  listStyle: "none",
};

function buildOverviewWarnings(input: {
  crs: string | null;
  crsStatus: string;
  qaStatus: string;
  publicationStatus: string;
  queryable: boolean;
  analysisStale: boolean;
}): Array<{ id: string; title: string; detail: string }> {
  const warnings: Array<{ id: string; title: string; detail: string }> = [];

  if (!input.queryable) {
    warnings.push({
      id: "queryability",
      title: "Inspection is metadata-only",
      detail: "This layer is not queryable, so row-level attribute inspection and map selection workflows may be limited.",
    });
  }

  if (!input.crs || input.crsStatus !== "known") {
    warnings.push({
      id: "crs",
      title: "Coordinate reference system needs review",
      detail: `CRS is ${input.crs ?? input.crsStatus}. Validate projection before relying on area, distance, or spatial comparison outputs.`,
    });
  }

  if (input.qaStatus !== "ready" && input.qaStatus !== "pass") {
    warnings.push({
      id: "qa",
      title: "Scientific QA is not fully ready",
      detail: `Current QA state is ${input.qaStatus}. Review QA findings before publication or analytical reuse.`,
    });
  }

  if (input.publicationStatus !== "ready") {
    warnings.push({
      id: "publication",
      title: "Publication readiness has caveats",
      detail: `Report/export readiness is ${input.publicationStatus}. Check missing evidence, metadata, or blocking issues before publish handoff.`,
    });
  }

  if (input.analysisStale) {
    warnings.push({
      id: "stale",
      title: "Derived output may be stale",
      detail: "This analytical output is marked stale and may not reflect the latest source data or parameter choices.",
    });
  }

  return warnings;
}

function buildOverviewActions(input: {
  warnings: Array<{ id: string; title: string; detail: string }>;
  setActiveTab: (tab: InspectorTabId) => void;
}): Array<{ id: string; label: string; onClick: () => void }> {
  const actions: Array<{ id: string; label: string; onClick: () => void }> = [];

  if (input.warnings.some((warning) => warning.id === "qa")) {
    actions.push({ id: "review-qa", label: "Review QA", onClick: () => input.setActiveTab("qa") });
  }
  if (input.warnings.some((warning) => warning.id === "crs")) {
    actions.push({ id: "review-crs", label: "Review CRS", onClick: () => input.setActiveTab("crs") });
  }
  actions.push({ id: "review-schema", label: "Inspect schema", onClick: () => input.setActiveTab("schema") });
  actions.push({ id: "review-report", label: "Check report readiness", onClick: () => input.setActiveTab("report") });

  return actions;
}

function SectionTitle({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div style={sectionTitleStyle}>{children}</div>;
}

/** A label/value row that renders an explicit "unknown" (never a blank) when value is absent. */
function Row({
  label,
  value,
  mono = false,
  fallback = UNKNOWN,
}: {
  label: string;
  value?: string | number | null | undefined;
  mono?: boolean;
  fallback?: string;
}): React.ReactElement {
  const isMissing = value === null || value === undefined || value === "";
  return (
    <div style={rowStyle}>
      <span style={rowLabelStyle}>{label}</span>
      {isMissing ? (
        <span style={{ ...rowValueStyle, ...unknownStyle }}>{fallback}</span>
      ) : (
        <span style={{ ...rowValueStyle, ...(mono ? monoStyle : {}) }}>{value}</span>
      )}
    </div>
  );
}

function Chips({ ids, empty = "none" }: { ids: readonly string[]; empty?: string }): React.ReactElement {
  if (ids.length === 0) return <span style={unknownStyle}>{empty}</span>;
  return (
    <span>
      {ids.map((id) => (
        <span key={id} style={chipStyle}>{id}</span>
      ))}
    </span>
  );
}

function Notes({ items }: { items: readonly string[] }): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <ul style={{ margin: `${MAP_SPACING.xs} 0 0`, paddingLeft: MAP_SPACING.md }}>
      {items.map((note, index) => (
        <li key={index} style={noteStyle}>{note}</li>
      ))}
    </ul>
  );
}

function describeNullableField(field: LayerSchemaFieldSummary): string {
  if (field.nullable === undefined) return "nullable: unknown";
  return field.nullable ? "nullable" : "not null";
}

export const LayerInspector: React.FC<LayerInspectorProps> = ({
  layer,
  sourceHandle,
  onClose,
  onApplyStyle,
  initialTab,
  presentation = "floating",
  showHeader = true,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTabId>(initialTab ?? "overview");
  const registry = useMemo(() => normalizeLayerRegistryMetadata(layer), [layer]);
  const metadata = layer.metadata;
  const analysis = metadata?.analysisResult;
  const manifest = analysis?.reproducibilityManifest ?? metadata?.reproducibilityManifest;
  const qa = metadata?.scientificQA;
  const overviewWarnings = useMemo(
    () => buildOverviewWarnings({
      crs: registry.crsSummary.crs,
      crsStatus: registry.crsSummary.status,
      qaStatus: registry.qaStatus,
      publicationStatus: registry.publicationReadiness.status,
      queryable: registry.queryable,
      analysisStale: Boolean(analysis?.stale),
    }),
    [analysis?.stale, registry.crsSummary.crs, registry.crsSummary.status, registry.publicationReadiness.status, registry.qaStatus, registry.queryable],
  );
  const overviewActions = useMemo(
    () => buildOverviewActions({ warnings: overviewWarnings, setActiveTab }),
    [overviewWarnings, setActiveTab],
  );

  const renderTab = (): React.ReactElement => {
    switch (activeTab) {
      case "overview":
        return (
          <div style={summaryGridStyle}>
            <section style={summarySectionStyle} data-testid="map-layer-inspector-summary-overview">
              <SectionTitle>Summary</SectionTitle>
              <Row label="Layer" value={layer.name} />
              <Row label="Type" value={layer.type} />
              <Row label="Source kind" value={registry.sourceKind} />
              <Row label="Feature count" value={registry.featureCount} fallback={UNKNOWN} />
            </section>

            <section style={summarySectionStyle} data-testid="map-layer-inspector-summary-warnings">
              <SectionTitle>Warnings</SectionTitle>
              {overviewWarnings.length > 0 ? (
                <div style={warningListStyle}>
                  {overviewWarnings.map((warning) => (
                    <div key={warning.id} style={warningCardStyle}>
                      <span style={warningTitleStyle}>{warning.title}</span>
                      <span style={helperTextStyle}>{warning.detail}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={helperTextStyle}>No blocking CRS, QA, publication, or queryability warnings are currently detected.</p>
              )}
            </section>

            <section style={summarySectionStyle} data-testid="map-layer-inspector-summary-actions">
              <SectionTitle>Actions</SectionTitle>
              <div style={actionRowStyle}>
                {overviewActions.map((action) => (
                  <button key={action.id} type="button" style={summaryButtonStyle} onClick={action.onClick}>
                    {action.label}
                  </button>
                ))}
              </div>
            </section>

            <section style={summarySectionStyle}>
              <SectionTitle>Core metadata</SectionTitle>
              <Row label="Geometry" value={registry.geometrySummary.geometryType} />
              <Row label="Queryable" value={registry.queryable ? "Yes" : "No"} />
              <Row label="QA status" value={registry.qaStatus} />
              <Row label="CRS" value={registry.crsSummary.crs} fallback={registry.crsSummary.status} mono />
              <Row label="CRS provenance" value={registry.crsSummary.source} />
              <Row label="Publication" value={registry.publicationReadiness.status} />
              <Row label="Visible" value={layer.visible ? "Yes" : "No"} />
              <Row label="Opacity" value={`${Math.round(layer.opacity * 100)}%`} />
            </section>

            <details style={detailsWrapStyle}>
              <summary style={detailsSummaryStyle}>Technical details</summary>
              <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
                {registry.geometrySummary.bounds ? (
                  <Row
                    label="Bounds"
                    value={`[${(registry.geometrySummary.bounds as number[]).map((n) => n.toFixed(4)).join(", ")}]`}
                    mono
                  />
                ) : null}
                {registry.evidenceArtifactId ? (
                  <Row label="Evidence artifact" value={registry.evidenceArtifactId} mono />
                ) : null}
                {analysis ? (
                  <>
                    <Row label="Run id" value={analysis.runId} mono />
                    <Row label="Run at" value={analysis.runTimestamp} />
                    <Row label="Output mode" value={analysis.outputMode} fallback="standard" />
                  </>
                ) : null}
              </div>
            </details>
          </div>
        );
      case "source":
        return (
          <>
            <section>
              <SectionTitle>Provenance</SectionTitle>
              <Row label="Source kind" value={registry.sourceKind} />
              <Row label="Label" value={registry.provenance.label} />
              <Row label="Source name" value={registry.licenseAttribution.sourceName} />
              <Row label="Source URL" value={registry.licenseAttribution.sourceUrl} />
              <Row label="License" value={registry.licenseAttribution.license} />
              <Row label="Attribution" value={registry.licenseAttribution.attribution} />
              <Row label="Method" value={registry.provenance.method} />
              <Row label="Import format" value={metadata?.importFormat} fallback="not an import" />
              <Notes items={registry.provenance.notes ?? []} />
            </section>
            {metadata?.persistence ? (
              <section>
                <SectionTitle>Persistence</SectionTitle>
                <Row label="Restore state" value={metadata.persistence.restoreState} />
                <Row label="Saved at" value={metadata.persistence.savedAt} />
                <Row label="Source persistence" value={metadata.persistence.sourcePersistence} />
                <Notes items={metadata.persistence.restoreWarnings} />
              </section>
            ) : null}
            <section>
              <SectionTitle>Source handle</SectionTitle>
              {sourceHandle ? (
                <>
                  <Row label="Source id" value={sourceHandle.sourceId} mono />
                  <Row label="Kind" value={sourceHandle.kind} />
                  <Row label="Storage mode" value={sourceHandle.storageMode} />
                  <Row label="Restore status" value={sourceHandle.restoreStatus} />
                  <Row label="Format" value={sourceHandle.format} />
                  <Row label="Feature count" value={sourceHandle.featureCount} />
                  <Row label="Size (bytes)" value={sourceHandle.sizeBytes} />
                  <Row label="Source ref" value={sourceHandle.sourceRef} mono />
                  <Row label="Profiled at" value={sourceHandle.profiledAt} />
                  <Notes items={sourceHandle.caveats} />
                </>
              ) : (
                <GisEmptyState title="No source handle registered" description="No source handle is registered for this layer." compact />
              )}
            </section>
          </>
        );
      case "schema": {
        const schema = registry.schemaSummary;
        return (
          <section>
            <SectionTitle>Schema ({schema.fieldCount} field{schema.fieldCount === 1 ? "" : "s"})</SectionTitle>
            {schema.geometryField ? <Row label="Geometry field" value={schema.geometryField} mono /> : null}
            {schema.fields.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: MAP_SPACING.xs }}>
                {schema.fields.map((field) => (
                  <div key={field.name} style={rowStyle} data-testid="map-layer-inspector-schema-field">
                    <span style={{ ...rowLabelStyle, ...monoStyle, color: MAP_COLORS.text }}>{field.name}</span>
                    <span style={rowValueStyle}>
                      {field.role}{field.type ? ` · ${field.type}` : ""} · {describeNullableField(field)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <GisEmptyState title="No schema fields" description="Schema fields are not declared for this layer." compact />
            )}
            <Notes items={schema.notes} />
          </section>
        );
      }
      case "crs": {
        const crs = registry.crsSummary;
        return (
          <section data-testid="map-layer-inspector-crs">
            <SectionTitle>Coordinate reference system</SectionTitle>
            <Row label="CRS" value={crs.crs} fallback={crs.status} mono />
            <Row label="Status" value={crs.status} />
            <Row label="Provenance" value={crs.source} />
            <Notes items={crs.notes} />
          </section>
        );
      }
      case "qa":
        return (
          <section>
            <SectionTitle>Scientific QA</SectionTitle>
            <Row label="Status" value={registry.qaStatus} />
            {qa ? (
              <>
                <Row label="Checked at" value={qa.checkedAt} />
                <Row label="Feature issues" value={qa.featureIssueCount} />
                <Row label="Used worker" value={qa.usedWorker ? "Yes" : "No"} />
                <div style={rowStyle}>
                  <span style={rowLabelStyle}>Badges</span>
                  <span style={rowValueStyle}><Chips ids={qa.badges} empty="none" /></span>
                </div>
                <Notes items={qa.caveats} />
              </>
            ) : (
              <GisEmptyState title="QA not run" description="Scientific QA has not been run for this layer." compact />
            )}
          </section>
        );
      case "style":
        return (
          <section>
            <SectionTitle>Style</SectionTitle>
            <Row label="Visible" value={layer.visible ? "Yes" : "No"} />
            <Row label="Opacity" value={`${Math.round(layer.opacity * 100)}%`} />
            <Row label="Render mode" value={metadata?.rendering?.mode} fallback="default" />
            <div style={rowStyle}>
              <span style={rowLabelStyle}>Style keys</span>
              <span style={rowValueStyle}>
                <Chips ids={layer.style ? Object.keys(layer.style) : []} empty="default styling" />
              </span>
            </div>
            <div style={{ marginTop: MAP_SPACING.md }}>
              <LayerStyleEditor layer={layer} {...(onApplyStyle ? { onApplyStyle } : {})} />
            </div>
          </section>
        );
      case "lineage":
        return (
          <section>
            <SectionTitle>Lineage</SectionTitle>
            {analysis || manifest ? (
              <>
                {analysis ? (
                  <>
                    <Row label="Engine" value={analysis.engine} />
                    <Row label="Stale" value={analysis.stale ? "Yes" : "No"} />
                    <Row label="Output mode" value={analysis.outputMode} fallback="standard" />
                    <Row label="Run id" value={analysis.runId} mono />
                    <Row label="Run at" value={analysis.runTimestamp} />
                    <Row label="Source data version" value={analysis.sourceDataVersion} />
                    <Row label="Parameters" value={analysis.parameterSummary} />
                    <div style={rowStyle}>
                      <span style={rowLabelStyle}>Source layers</span>
                      <span style={rowValueStyle}><Chips ids={analysis.sourceLayerIds ?? []} /></span>
                    </div>
                    <Notes items={analysis.caveats ?? []} />
                  </>
                ) : null}
                {manifest ? (
                  <>
                    <Row label="Manifest id" value={manifest.manifestId} mono />
                    <Row label="Workflow id" value={manifest.workflowId} mono />
                    <div style={rowStyle}>
                      <span style={rowLabelStyle}>Input layers</span>
                      <span style={rowValueStyle}><Chips ids={manifest.inputLayerIds} /></span>
                    </div>
                    <div style={rowStyle}>
                      <span style={rowLabelStyle}>Output layers</span>
                      <span style={rowValueStyle}><Chips ids={manifest.outputLayerIds} /></span>
                    </div>
                  </>
                ) : null}
                <Row label="Evidence artifact" value={registry.evidenceArtifactId ?? analysis?.evidenceArtifactId} mono />
              </>
            ) : (
              <GisEmptyState title="No analysis lineage" description="This is a source layer, not a derived result." compact />
            )}
          </section>
        );
      case "report": {
        const pub = registry.publicationReadiness;
        return (
          <section>
            <SectionTitle>Report / Export readiness</SectionTitle>
            <Row label="Status" value={pub.status} />
            <Row label="Evidence artifact" value={registry.evidenceArtifactId} mono />
            <Row label="Data version" value={metadata?.dataVersion} />
            <div style={rowStyle}>
              <span style={rowLabelStyle}>Missing fields</span>
              <span style={rowValueStyle}><Chips ids={pub.missingFields} empty="none" /></span>
            </div>
            <div style={rowStyle}>
              <span style={rowLabelStyle}>Blocking issues</span>
              <span style={rowValueStyle}><Chips ids={pub.blockingIssueIds} empty="none" /></span>
            </div>
            <Notes items={pub.caveats} />
          </section>
        );
      }
      default:
        return <section />;
    }
  };

  return (
    <div
      style={presentation === "embedded" ? embeddedPanelStyle : panelStyle}
      className={presentation === "floating" ? motionStyles.panelIn : undefined}
      role={presentation === "embedded" ? "region" : "dialog"}
      aria-label={`Layer inspector for ${layer.name}`}
      data-testid="map-layer-inspector"
      data-presentation={presentation}
    >
      {showHeader ? (
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Layer inspector</div>
            <div style={titleStyle}>{layer.name}</div>
          </div>
          <GisIconButton
            label="Close layer inspector"
            icon={<IconClose size={14} />}
            onClick={onClose}
            size="sm"
          />
        </div>
      ) : null}

      <GisTabs
        tabs={[...TABS]}
        activeId={activeTab}
        onTabChange={(id) => setActiveTab(id as InspectorTabId)}
        aria-label="Layer inspector"
        tabTestIdPrefix="map-layer-inspector-tab"
        style={{ flex: 1, minHeight: 0 }}
      >
        <div style={bodyStyle} data-testid={`map-layer-inspector-panel-${activeTab}`}>
          {renderTab()}
        </div>
      </GisTabs>
    </div>
  );
};
