import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import type { OverlayLayerConfig } from "../mapTypes";
import type { MapScientificQAState } from "@/services/map/MapScientificQA";
import {
  buildFigureReadinessChecklist,
  buildMapFigureAttributionText,
  composeMapBook,
  LAYOUT_PRESETS,
  preflightMapFigure,
  restorePageInputsFromMetadata,
  summariseFigureReadiness,
  type MapBookSpec,
  type MapFigureRestoreMetadata,
  type MapLayoutPreset,
  type MapPageInput,
  type MapPageSlot,
} from "@/services/map/layout/MapLayoutComposer";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "../useDraggableMapPanel";
import { GisIconButton, GisStatusChip } from "../ui";
import motionStyles from "../design/motion.module.css";

export interface MapLayoutDesignerPanelProps {
  visible: boolean;
  overlayLayers: OverlayLayerConfig[];
  qaState: MapScientificQAState | null;
  bearing?: number;
  presentation?: "floating" | "embedded";
  restoreRequest?: { id: string; metadata: MapFigureRestoreMetadata } | null;
  onClose: () => void;
  onExportBook?: (book: MapBookSpec) => void;
  onRestoreRequestHandled?: (id: string) => void;
  onAnnounce?: (msg: string) => void;
}

const MAX_PAGES = 6;

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle("min(36rem, calc(100vw - 2rem))", MAP_Z_INDEX.symbologyPanel + 10),
  height: "min(48rem, calc(100% - 2rem))",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.lg,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const embeddedPanelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
  width: "100%",
  minHeight: "34rem",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  boxShadow: "none",
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
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
};

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  overflowX: "auto",
};

const bodyStyle: React.CSSProperties = {
  overflowY: "auto",
  display: "grid",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
  alignContent: "start",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const metaRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textSecondary,
};

const metaKeyStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const gapRowStyle: React.CSSProperties = {
  display: "flex",
  gap: MAP_SPACING.sm,
  alignItems: "flex-start",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.md,
  alignItems: "center",
};

const checkboxLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const iconButtonStyle: React.CSSProperties = {
  width: "1.875rem",
  height: "1.875rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
};

const sectionTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
};

const tabButtonBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  whiteSpace: "nowrap",
};

const slotRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

interface PageState {
  pageNumber: number;
  title: string;
  dynamicText: string;
  showInsetMap: boolean;
  slots: MapPageSlot[];
  includeAttribution: boolean;
  includeLegend: boolean;
  includeScaleBar: boolean;
  includeNorthArrow: boolean;
}

function makeDefaultPage(pageNumber: number): PageState {
  return {
    pageNumber,
    title: `Map Page ${pageNumber}`,
    dynamicText: "",
    showInsetMap: false,
    slots: [],
    includeAttribution: true,
    includeLegend: true,
    includeScaleBar: true,
    includeNorthArrow: true,
  };
}

function pageStateToInput(state: PageState, overlayLayers: OverlayLayerConfig[]): MapPageInput {
  return {
    pageNumber: state.pageNumber,
    overlayLayers,
    title: state.title,
    dynamicText: state.dynamicText,
    showInsetMap: state.showInsetMap,
    slots: state.slots,
    composition: {
      includeAttribution: state.includeAttribution,
      includeLegend: state.includeLegend,
      includeScaleBar: state.includeScaleBar,
      includeNorthArrow: state.includeNorthArrow,
    },
  };
}

function pageInputToState(input: MapPageInput): PageState {
  return {
    pageNumber: input.pageNumber,
    title: input.title ?? `Map Page ${input.pageNumber}`,
    dynamicText: input.dynamicText ?? "",
    showInsetMap: input.showInsetMap ?? false,
    slots: input.slots ?? [],
    includeAttribution: input.composition?.includeAttribution ?? true,
    includeLegend: input.composition?.includeLegend ?? true,
    includeScaleBar: input.composition?.includeScaleBar ?? true,
    includeNorthArrow: input.composition?.includeNorthArrow ?? true,
  };
}

export const MapLayoutDesignerPanel: React.FC<MapLayoutDesignerPanelProps> = ({
  visible,
  overlayLayers,
  qaState: _qaState,
  bearing = 0,
  presentation = "floating",
  restoreRequest = null,
  onClose,
  onExportBook,
  onRestoreRequestHandled,
  onAnnounce,
}) => {
  const panelDrag = useDraggableMapPanel();
  const [pages, setPages] = useState<PageState[]>([makeDefaultPage(1)]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [presetIndex, setPresetIndex] = useState(0);
  const [newSlotKind, setNewSlotKind] = useState<MapPageSlot["kind"]>("chart");
  const [newSlotLabel, setNewSlotLabel] = useState("");

  useEffect(() => {
    if (!restoreRequest) {
      return;
    }
    const restored = restorePageInputsFromMetadata(restoreRequest.metadata, overlayLayers);
    const restoredPages = restored.pages.map(pageInputToState);
    setPresetIndex(restored.presetIndex);
    setPages(restoredPages.length > 0 ? restoredPages : [makeDefaultPage(1)]);
    setActivePageIndex(0);
    onAnnounce?.("Temporal frame layout restored");
    onRestoreRequestHandled?.(restoreRequest.id);
  }, [onAnnounce, onRestoreRequestHandled, overlayLayers, restoreRequest]);

  const preset: MapLayoutPreset = LAYOUT_PRESETS[presetIndex] ?? LAYOUT_PRESETS[0];

  const derivedAttributionText = useMemo(
    () => buildMapFigureAttributionText(overlayLayers),
    [overlayLayers],
  );

  const book = useMemo(() => {
    const pageInputs = pages.map((p) => pageStateToInput(p, overlayLayers));
    return composeMapBook(pageInputs, preset, new Date());
  }, [overlayLayers, pages, preset]);

  const activePage = pages[activePageIndex];

  function updateActivePage(patch: Partial<PageState>): void {
    setPages((prev) =>
      prev.map((p, i) => (i === activePageIndex ? { ...p, ...patch } : p)),
    );
  }

  function addPage(): void {
    if (pages.length >= MAX_PAGES) return;
    const nextNumber = pages.length + 1;
    setPages((prev) => [...prev, makeDefaultPage(nextNumber)]);
    setActivePageIndex(pages.length);
  }

  function removePage(index: number): void {
    if (pages.length <= 1) return;
    setPages((prev) => {
      const next = prev.filter((_, i) => i !== index).map((p, i) => ({
        ...p,
        pageNumber: i + 1,
        title: p.title === `Map Page ${prev[i]?.pageNumber ?? i + 1}` ? `Map Page ${i + 1}` : p.title,
      }));
      return next;
    });
    setActivePageIndex((prev) => Math.min(prev, pages.length - 2));
  }

  function addSlot(): void {
    if (!newSlotLabel.trim()) return;
    const slot: MapPageSlot = { kind: newSlotKind, label: newSlotLabel.trim() };
    updateActivePage({ slots: [...(activePage?.slots ?? []), slot] });
    setNewSlotLabel("");
  }

  function removeSlot(slotIndex: number): void {
    updateActivePage({ slots: (activePage?.slots ?? []).filter((_, i) => i !== slotIndex) });
  }

  if (!visible) return null;

  const activePagePreflight = book.pages[activePageIndex]
    ? preflightMapFigure(book.pages[activePageIndex].figure)
    : null;

  const activeBlockers = activePagePreflight?.blockers ?? [];
  const activeWarnings = activePagePreflight?.warnings ?? [];
  const isFloating = presentation === "floating";

  const activeFigure = book.pages[activePageIndex]?.figure ?? null;
  const readinessRows = activeFigure
    ? buildFigureReadinessChecklist(activeFigure, { pageSize: preset.pageSize.toUpperCase(), dpi: preset.dpi })
    : [];
  const readinessSummary = summariseFigureReadiness(readinessRows);
  const readinessSummaryLabel =
    readinessSummary === "ready" ? "Export ready" : readinessSummary === "caveat" ? "Ready with caveats" : "Blocked";

  return (
    <aside
      data-draggable-map-panel={isFloating ? "true" : undefined}
      data-map-layout-designer-panel={presentation}
      style={isFloating ? { ...panelStyle, ...panelDrag.panelPositionStyle } : embeddedPanelStyle}
      className={motionStyles.panelIn}
      role={isFloating ? "dialog" : "region"}
      aria-modal={isFloating ? "false" : undefined}
      aria-label="Layout designer"
      data-testid="map-layout-designer"
    >
      {/* Header */}
      <header
        style={isFloating ? { ...headerStyle, ...panelDrag.dragHandleStyle } : headerStyle}
        {...(isFloating ? panelDrag.dragHandleProps : {})}
      >
        <h3 style={titleStyle}>
          <BookOpen size={MAP_ICON_SIZES.md} aria-hidden="true" />
          Layout designer
        </h3>
        <GisIconButton label="Close layout designer" icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />} onClick={onClose} size="md" />
      </header>

      {/* Page tabs */}
      <div style={tabBarStyle} role="tablist" aria-label="Layout pages">
        {pages.map((page, index) => (
          <div key={page.pageNumber} style={{ display: "flex", alignItems: "center", gap: MAP_SPACING.xs }}>
            <button
              type="button"
              role="tab"
              aria-selected={index === activePageIndex}
              style={{
                ...tabButtonBase,
                color: index === activePageIndex ? MAP_COLORS.accent : MAP_COLORS.textSecondary,
                borderColor: index === activePageIndex ? MAP_COLORS.accent : "transparent",
              }}
              data-testid={`map-layout-page-tab-${page.pageNumber}`}
              onClick={() => setActivePageIndex(index)}
            >
              Page {page.pageNumber}
            </button>
            {pages.length > 1 && (
              <button
                type="button"
                style={{
                  ...iconButtonStyle,
                  width: "1.25rem",
                  height: "1.25rem",
                  border: "none",
                  color: MAP_COLORS.textMuted,
                }}
                aria-label={`Remove page ${page.pageNumber}`}
                onClick={() => removePage(index)}
              >
                <X size={10} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {pages.length < MAX_PAGES && (
          <button
            type="button"
            style={{ ...tabButtonBase, color: MAP_COLORS.textMuted, borderStyle: "dashed" }}
            data-testid="map-layout-add-page"
            aria-label="Add page"
            onClick={addPage}
          >
            <Plus size={MAP_ICON_SIZES.xs} aria-hidden="true" />
            Add page
          </button>
        )}
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        {activePage != null && (
          <>
            {/* Page title */}
            <label style={labelStyle}>
              Page title
              <input
                style={inputStyle}
                value={activePage.title}
                onChange={(e) => updateActivePage({ title: e.target.value })}
                aria-label="Page title"
              />
            </label>

            {/* Dynamic text / narrative */}
            <label style={labelStyle}>
              Page narrative / subtitle
              <textarea
                style={{ ...inputStyle, minHeight: "3.5rem", resize: "vertical" }}
                value={activePage.dynamicText}
                onChange={(e) => updateActivePage({ dynamicText: e.target.value })}
                aria-label="Page narrative"
                placeholder="Optional descriptive text for this page…"
              />
            </label>

            {/* Composition toggles */}
            <div style={toggleRowStyle} role="group" aria-label="Page elements">
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={activePage.includeLegend}
                  onChange={(e) => updateActivePage({ includeLegend: e.target.checked })}
                />
                Legend
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={activePage.includeScaleBar}
                  onChange={(e) => updateActivePage({ includeScaleBar: e.target.checked })}
                />
                Scale bar
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={activePage.includeNorthArrow}
                  onChange={(e) => updateActivePage({ includeNorthArrow: e.target.checked })}
                />
                North arrow
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={activePage.includeAttribution}
                  onChange={(e) => updateActivePage({ includeAttribution: e.target.checked })}
                />
                Attribution
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={activePage.showInsetMap}
                  onChange={(e) => updateActivePage({ showInsetMap: e.target.checked })}
                />
                Inset map
              </label>
            </div>

            {/* Figure metadata */}
            <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="map-layout-figure-metadata">
              <span style={sectionTitleStyle}>Figure metadata</span>
              <div style={metaRowStyle}>
                <span style={metaKeyStyle}>CRS</span>
                <span>{book.pages[activePageIndex]?.figure.crs ?? "missing"}</span>
              </div>
              <div style={metaRowStyle}>
                <span style={metaKeyStyle}>Attribution</span>
                <span>{derivedAttributionText || "missing"}</span>
              </div>
              <div style={metaRowStyle}>
                <span style={metaKeyStyle}>Layers</span>
                <span>
                  {book.pages[activePageIndex]?.figure.visibleLayers.map((l) => l.name).join(", ") || "none visible"}
                </span>
              </div>
              <div style={metaRowStyle}>
                <span style={metaKeyStyle}>Legend items</span>
                <span>{book.pages[activePageIndex]?.figure.legendItems.length ?? 0}</span>
              </div>
              <div style={metaRowStyle}>
                <span style={metaKeyStyle}>Bearing</span>
                <span>{bearing.toFixed(0)}°</span>
              </div>
            </div>

            {/* Readiness checklist */}
            <section
              style={{
                display: "grid",
                gap: MAP_SPACING.xs,
                padding: MAP_SPACING.sm,
                border: MAP_STROKES.hairlineSubtle,
                borderRadius: MAP_RADIUS.sm,
                background: MAP_COLORS.bg,
              }}
              aria-label="Figure readiness checklist"
              data-testid="map-layout-readiness"
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
                <span style={{ ...sectionTitleStyle, display: "inline-flex", alignItems: "center", gap: MAP_SPACING.xs }}>
                  <ShieldCheck size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                  Readiness checklist
                </span>
                <GisStatusChip status={readinessSummary} label={readinessSummaryLabel} density="compact" data-testid="map-layout-readiness-summary" />
              </div>
              {readinessRows.map((row) => (
                <div
                  key={row.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(7rem, auto) minmax(0, 1fr)",
                    alignItems: "center",
                    gap: MAP_SPACING.sm,
                    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                    color: MAP_COLORS.textSecondary,
                  }}
                  data-testid={`map-layout-readiness-${row.id}`}
                >
                  <GisStatusChip status={row.status} label={row.label} density="compact" />
                  <span style={{ minWidth: 0, color: row.status === "blocked" ? MAP_COLORS.error : MAP_COLORS.textSecondary }} title={row.detail}>
                    {row.value}{row.detail ? ` — ${row.detail}` : ""}
                  </span>
                </div>
              ))}
            </section>

            {/* Slots */}
            <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
              <span style={sectionTitleStyle}>Additional slots</span>
              {activePage.slots.map((slot, slotIndex) => (
                <div key={slotIndex} style={slotRowStyle}>
                  <span style={{ ...metaKeyStyle, minWidth: "3rem" }}>{slot.kind}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {slot.label}
                  </span>
                  <button
                    type="button"
                    style={{ ...iconButtonStyle, width: "1.25rem", height: "1.25rem", border: "none" }}
                    aria-label={`Remove slot ${slot.label}`}
                    onClick={() => removeSlot(slotIndex)}
                  >
                    <Trash2 size={10} aria-hidden="true" />
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: MAP_SPACING.xs, alignItems: "center" }}>
                <select
                  style={{ ...selectStyle, width: "auto", flex: "0 0 auto" }}
                  value={newSlotKind}
                  onChange={(e) => setNewSlotKind(e.target.value as MapPageSlot["kind"])}
                  aria-label="Slot kind"
                >
                  <option value="chart">Chart</option>
                  <option value="table">Table</option>
                  <option value="text">Text</option>
                </select>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={newSlotLabel}
                  onChange={(e) => setNewSlotLabel(e.target.value)}
                  placeholder="Slot label…"
                  aria-label="New slot label"
                  onKeyDown={(e) => { if (e.key === "Enter") addSlot(); }}
                />
                <button
                  type="button"
                  style={{ ...iconButtonStyle }}
                  aria-label="Add slot"
                  onClick={addSlot}
                >
                  <Plus size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Blockers */}
            {activeBlockers.length > 0 && (
              <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="map-layout-blockers">
                <div style={{ display: "flex", alignItems: "center", gap: MAP_SPACING.sm }}>
                  <span style={sectionTitleStyle}>Fix before export</span>
                  <GisStatusChip status="blocked" label="blocked" density="compact" />
                </div>
                {activeBlockers.map((gap) => (
                  <div
                    key={gap.criterion}
                    style={{ ...gapRowStyle, borderColor: MAP_COLORS.error, color: MAP_COLORS.error }}
                  >
                    <GisStatusChip status="blocked" label={gap.label} density="compact" />
                    <span>
                      {gap.reason}
                      {gap.recommendedFix ? ` — ${gap.recommendedFix}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {activeWarnings.length > 0 && (
              <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
                <div style={{ display: "flex", alignItems: "center", gap: MAP_SPACING.sm }}>
                  <span style={sectionTitleStyle}>Warnings</span>
                  <GisStatusChip status="caveat" label="caveat" density="compact" />
                </div>
                {activeWarnings.map((gap) => (
                  <div
                    key={gap.criterion}
                    style={{ ...gapRowStyle, borderColor: MAP_COLORS.warning, color: MAP_COLORS.warning }}
                  >
                    <GisStatusChip status="caveat" label={gap.label} density="compact" />
                    <span>{gap.reason}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Export preset */}
            <label style={labelStyle}>
              Export preset
              <select
                style={selectStyle}
                value={presetIndex}
                onChange={(e) => setPresetIndex(Number(e.target.value))}
                aria-label="Export preset"
                data-testid="map-layout-preset-select"
              >
                {LAYOUT_PRESETS.map((p, i) => (
                  <option key={p.label} value={i}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={footerStyle}>
        <span
          style={{ ...metaKeyStyle, display: "inline-flex", alignItems: "center", gap: MAP_SPACING.xs, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}
          data-testid="map-layout-page-count"
        >
          {book.exportable ? (
            <CheckCircle2 size={MAP_ICON_SIZES.sm} color={MAP_COLORS.success} aria-hidden="true" />
          ) : (
            <AlertTriangle size={MAP_ICON_SIZES.sm} color={MAP_COLORS.error} aria-hidden="true" />
          )}
          {pages.length} {pages.length === 1 ? "page" : "pages"} · {preset.label}
        </span>
        <button
          type="button"
          style={{
            ...buttonStyle,
            opacity: book.exportable ? 1 : 0.5,
            cursor: book.exportable ? "pointer" : "not-allowed",
          }}
          disabled={!book.exportable}
          data-testid="map-layout-export"
          aria-label="Export map book"
          onClick={() => {
            if (!book.exportable) return;
            onExportBook?.(book);
            onAnnounce?.("Map book exported");
          }}
        >
          <BookOpen size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          Export book
        </button>
      </footer>
    </aside>
  );
};
