import React from "react";
import { CheckCircle2, CircleSlash, Database, MapPin, ShieldAlert } from "lucide-react";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
  type GisStatusKey,
} from "../mapTokens";
import { GisStatusChip } from "../ui";

/**
 * One layer/source row inside a publish output inventory. The `status` chip
 * keeps included/excluded/caveat state explicit so the inventory can never read
 * as a silent "everything is in" claim.
 */
export interface MapPublishInventoryEntry {
  id: string;
  label: string;
  detail?: string;
  status?: GisStatusKey;
}

export interface MapPublishOutputInventoryProps {
  /** Precise output-type label, e.g. "GeoJSON FeatureCollection" or "Static report snapshot (raster image)". */
  outputType: string;
  /** Optional truthfulness note rendered under the output type (no silent embedding / recoverability claims). */
  outputTypeNote?: string;
  included: readonly MapPublishInventoryEntry[];
  excluded: readonly MapPublishInventoryEntry[];
  /** Source-handle restore state rows; omit when a path does not carry source handles. */
  sourceRestore?: readonly MapPublishInventoryEntry[];
  bounds: string;
  boundsStatus?: GisStatusKey;
  evidenceIds: readonly string[];
  caveats: readonly string[];
  /** Named reason the action is blocked; shown at the inventory edge before the action. */
  disabledReason?: string;
  includedLabel?: string;
  excludedLabel?: string;
  emptyIncludedLabel?: string;
  emptyExcludedLabel?: string;
}

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  paddingBottom: MAP_SPACING.sm,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const eyebrowStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const outputTypeStyle: React.CSSProperties = {
  display: "grid",
  gap: 2,
  padding: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.xs,
  background: MAP_COLORS.bg,
};

const outputTypeValueStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  ...MAP_TEXT_STYLES.valueWrap,
};

const outputTypeNoteStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  ...MAP_TEXT_STYLES.valueWrap,
};

const groupTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(8rem, 0.4fr) minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
  alignItems: "start",
  padding: `${MAP_SPACING.xs} 0`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const rowDetailStyle: React.CSSProperties = {
  minWidth: 0,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  ...MAP_TEXT_STYLES.valueWrap,
};

const metaRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(6rem, auto) minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textSecondary,
};

const metaKeyStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const caveatStyle: React.CSSProperties = {
  color: MAP_COLORS.caveatText,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  ...MAP_TEXT_STYLES.valueWrap,
};

const disabledReasonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.error,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const InventoryRows: React.FC<{
  testId: string;
  entries: readonly MapPublishInventoryEntry[];
  emptyLabel: string;
  defaultStatus: GisStatusKey;
}> = ({ testId, entries, emptyLabel, defaultStatus }) => {
  if (entries.length === 0) {
    return (
      <div style={{ ...rowDetailStyle, color: MAP_COLORS.textMuted }} data-testid={`${testId}-empty`}>
        {emptyLabel}
      </div>
    );
  }
  return (
    <div style={{ display: "grid" }}>
      {entries.map((entry) => (
        <div key={entry.id} style={rowStyle} data-testid={`${testId}-${entry.id}`}>
          <GisStatusChip status={entry.status ?? defaultStatus} label={entry.label} density="compact" />
          <span style={rowDetailStyle} title={entry.detail}>{entry.detail ?? ""}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Compact inclusion / exclusion inventory shared across the Data Export,
 * Offline Package, and Report Handoff publish paths. It surfaces the precise
 * output type, the included and excluded layers/sources, source-handle restore
 * state, output bounds, evidence IDs, CRS/QA/provenance caveats, and any
 * blocking reason before the export action runs.
 */
export const MapPublishOutputInventory: React.FC<MapPublishOutputInventoryProps> = ({
  outputType,
  outputTypeNote,
  included,
  excluded,
  sourceRestore,
  bounds,
  boundsStatus,
  evidenceIds,
  caveats,
  disabledReason,
  includedLabel = "Included in output",
  excludedLabel = "Excluded from output",
  emptyIncludedLabel = "No layers or sources qualify for this output yet.",
  emptyExcludedLabel = "Nothing is excluded from this output.",
}) => (
  <section
    style={{ display: "grid", gap: MAP_SPACING.sm, paddingTop: MAP_SPACING.sm, borderTop: MAP_STROKES.hairlineSubtle }}
    aria-label="Publish output inventory"
    data-testid="map-publish-output-inventory"
  >
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <span style={eyebrowStyle}>
          <Database size={12} aria-hidden />
          Output inventory
        </span>
        <GisStatusChip
          status={disabledReason ? "blocked" : excluded.length > 0 || caveats.length > 0 ? "caveat" : "ready"}
          label={disabledReason ? "Blocked" : excluded.length > 0 || caveats.length > 0 ? "Review" : "Ready"}
          density="compact"
          data-testid="map-publish-output-inventory-summary"
        />
      </div>
      <div style={outputTypeStyle} data-testid="map-publish-output-type">
        <span style={outputTypeValueStyle}>{outputType}</span>
        {outputTypeNote ? <span style={outputTypeNoteStyle}>{outputTypeNote}</span> : null}
      </div>
    </div>

    <div style={sectionStyle} data-testid="map-publish-inventory-included">
      <span style={groupTitleStyle}>
        <CheckCircle2 size={11} aria-hidden style={{ marginRight: 4, verticalAlign: "-1px", color: MAP_COLORS.success }} />
        {includedLabel} ({included.length})
      </span>
      <InventoryRows testId="map-publish-included" entries={included} emptyLabel={emptyIncludedLabel} defaultStatus="ready" />
    </div>

    <div style={sectionStyle} data-testid="map-publish-inventory-excluded">
      <span style={groupTitleStyle}>
        <CircleSlash size={11} aria-hidden style={{ marginRight: 4, verticalAlign: "-1px", color: MAP_COLORS.textMuted }} />
        {excludedLabel} ({excluded.length})
      </span>
      <InventoryRows testId="map-publish-excluded" entries={excluded} emptyLabel={emptyExcludedLabel} defaultStatus="caveat" />
    </div>

    {sourceRestore && sourceRestore.length > 0 ? (
      <div style={sectionStyle} data-testid="map-publish-inventory-source-restore">
        <span style={groupTitleStyle}>Source handle restore state ({sourceRestore.length})</span>
        <InventoryRows testId="map-publish-source-restore" entries={sourceRestore} emptyLabel="No source handles." defaultStatus="caveat" />
      </div>
    ) : null}

    <div style={sectionStyle}>
      <div style={metaRowStyle} data-testid="map-publish-inventory-bounds">
        <span style={metaKeyStyle}>
          <MapPin size={11} aria-hidden style={{ marginRight: 4, verticalAlign: "-1px" }} />
          Bounds
        </span>
        <span style={{ minWidth: 0, ...MAP_TEXT_STYLES.valueWrap }}>
          {bounds}
          {boundsStatus ? <> · <GisStatusChip status={boundsStatus} label={boundsStatus} density="compact" /></> : null}
        </span>
      </div>
      <div style={metaRowStyle} data-testid="map-publish-inventory-evidence">
        <span style={metaKeyStyle}>Evidence IDs</span>
        <span style={{ minWidth: 0, ...MAP_TEXT_STYLES.valueWrap }}>
          {evidenceIds.length > 0 ? `${evidenceIds.length}: ${evidenceIds.slice(0, 4).join(", ")}${evidenceIds.length > 4 ? `, +${evidenceIds.length - 4}` : ""}` : "None attached; output relies on layer and project metadata only."}
        </span>
      </div>
    </div>

    {caveats.length > 0 ? (
      <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="map-publish-inventory-caveats">
        <span style={eyebrowStyle}>
          <ShieldAlert size={12} aria-hidden />
          CRS / QA / provenance caveats ({caveats.length})
        </span>
        {caveats.slice(0, 5).map((caveat, index) => (
          <span key={`${index}-${caveat.slice(0, 24)}`} style={caveatStyle}>• {caveat}</span>
        ))}
      </div>
    ) : null}

    {disabledReason ? (
      <div style={disabledReasonStyle} data-testid="map-publish-inventory-disabled-reason">
        <ShieldAlert size={12} aria-hidden style={{ marginTop: 1, flex: "0 0 auto" }} />
        <span>Export blocked: {disabledReason}</span>
      </div>
    ) : null}
  </section>
);
