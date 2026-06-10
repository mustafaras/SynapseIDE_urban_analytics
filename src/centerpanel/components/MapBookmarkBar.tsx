import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Copy, Pencil, Save, Trash2 } from "lucide-react";
import type { MapBookmark } from "./map/mapTypes";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./map/mapTokens";
import { AppDropdownMenu, AppMenuItem, AppMenuSection, ToolbarMenuButton } from "./map/ui";

interface BookmarkContextMenuState {
  bookmark: MapBookmark;
  x: number;
  y: number;
}

export interface MapBookmarkBarProps {
  bookmarks: MapBookmark[];
  maxBookmarks: number;
  onSaveBookmark: (name: string) => void;
  onRestoreBookmark: (bookmark: MapBookmark) => void;
  onRenameBookmark: (id: string, name: string) => void;
  onDeleteBookmark: (id: string) => void;
  onShareBookmark: (bookmark: MapBookmark, encodedParam: string) => void;
  variant?: "bar" | "inline" | "menu";
  style?: React.CSSProperties;
}

const barStyle: React.CSSProperties = {
  minHeight: "2.25rem",
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  borderTop: MAP_STROKES.hairlineSubtle,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgWorkspace,
  overflowX: "auto",
  overflowY: "hidden",
  scrollbarWidth: "thin",
};

const labelStyle: React.CSSProperties = {
  flex: "0 0 auto",
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

const chipRailStyle: React.CSSProperties = {
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  overflowX: "auto",
  scrollbarWidth: "thin",
};

const chipStyle: React.CSSProperties = {
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  maxWidth: "13rem",
  minHeight: "1.625rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  whiteSpace: "nowrap",
};

const menuStyle: React.CSSProperties = {
  position: "fixed",
  zIndex: MAP_Z_INDEX.dropdown,
  display: "grid",
  gap: MAP_SPACING.xs,
  width: "10.5rem",
  padding: MAP_SPACING.xs,
  borderRadius: MAP_RADIUS.md,
  border: MAP_STROKES.hairlineStrong,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.none,
};

const menuItemStyle: React.CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "1rem minmax(0, 1fr)",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minHeight: "1.875rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  textAlign: "left",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  cursor: "pointer",
};

const compactMenuShell: React.CSSProperties = {
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
  paddingLeft: MAP_SPACING.sm,
};

const compactMenuStyle: React.CSSProperties = {
  width: "min(24rem, calc(100vw - 1rem))",
  maxHeight: "min(26rem, calc(100vh - 5rem))",
  overflowY: "auto",
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.md,
  border: MAP_STROKES.hairlineStrong,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.dropdown,
};

const compactMenuHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
};

const compactBookmarkRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minHeight: "2.25rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.28)) 42%, transparent)",
  background: "color-mix(in srgb, var(--syn-surface-subtle, rgba(15, 23, 42, 0.24)) 30%, transparent)",
};

const compactIconButtonStyle: React.CSSProperties = {
  width: "1.5rem",
  height: "1.5rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.none,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textMuted,
  cursor: "pointer",
};

const compactCountBadgeStyle: React.CSSProperties = {
  minWidth: "1.625rem",
  height: "1rem",
  padding: "0 0.25rem",
  borderRadius: MAP_RADIUS.sm,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: MAP_COLORS.selectedSubtle,
  color: MAP_COLORS.interaction,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const compactEmptyStateStyle: React.CSSProperties = {
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.sm}`,
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  borderRadius: MAP_RADIUS.sm,
  background: "color-mix(in srgb, var(--syn-surface-subtle, rgba(15, 23, 42, 0.2)) 24%, transparent)",
};

const bookmarkCountPillStyle: React.CSSProperties = {
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "1.25rem",
  padding: `0 ${MAP_SPACING.xs}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.xs,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  whiteSpace: "nowrap",
};

const compactExportStripStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

function encodeBookmark(bookmark: MapBookmark): string {
  const payload = {
    name: bookmark.name,
    center: bookmark.center,
    zoom: bookmark.zoom,
    bearing: bookmark.bearing,
    pitch: bookmark.pitch,
    layers: bookmark.layers,
    timestamp: bookmark.timestamp,
    ...(bookmark.activeVisualization ? { activeVisualization: bookmark.activeVisualization } : {}),
  };
  return encodeURIComponent(JSON.stringify(payload));
}

function formatBookmarkTitle(bookmark: MapBookmark): string {
  const parsed = new Date(bookmark.timestamp);
  const timeLabel = Number.isNaN(parsed.getTime())
    ? "saved view"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
  return `${bookmark.name} - ${timeLabel} - ${bookmark.layers.length} visible layer${bookmark.layers.length === 1 ? "" : "s"}`;
}

export function serializeMapBookmarkParam(bookmark: MapBookmark): string {
  return encodeBookmark(bookmark);
}

export const MapBookmarkBar: React.FC<MapBookmarkBarProps> = ({
  bookmarks,
  maxBookmarks,
  onSaveBookmark,
  onRestoreBookmark,
  onRenameBookmark,
  onDeleteBookmark,
  onShareBookmark,
  variant = "bar",
  style,
}) => {
  const [contextMenu, setContextMenu] = useState<BookmarkContextMenuState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const compactTriggerRef = useRef<HTMLButtonElement | null>(null);
  const inline = variant === "inline";
  const compactMenu = variant === "menu";

  const closeMenu = useCallback(() => {
    setContextMenu(null);
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!contextMenu) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, contextMenu]);

  const handleSave = () => {
    const fallbackName = `View ${bookmarks.length + 1}`;
    const name = typeof window.prompt === "function"
      ? window.prompt("Name this map view", fallbackName)
      : fallbackName;
    if (name == null) return;
    onSaveBookmark(name);
  };

  const handleRename = (bookmark: MapBookmark) => {
    const nextName = typeof window.prompt === "function"
      ? window.prompt("Rename saved view", bookmark.name)
      : bookmark.name;
    if (nextName == null) return;
    onRenameBookmark(bookmark.id, nextName);
    closeMenu();
  };

  const handleShare = (bookmark: MapBookmark) => {
    onShareBookmark(bookmark, encodeBookmark(bookmark));
    closeMenu();
  };

  const handleDelete = (bookmark: MapBookmark) => {
    onDeleteBookmark(bookmark.id);
    closeMenu();
  };

  if (compactMenu) {
    return (
      <div style={{ ...compactMenuShell, ...style }} aria-label="Saved map views">
        <button
          ref={compactTriggerRef}
          type="button"
          style={{ display: "none" }}
          aria-hidden="true"
          tabIndex={-1}
        />

        <AppDropdownMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          align="end"
          minWidth={300}
          maxWidth={520}
          ariaLabel="Saved map views menu"
          testId="map-bookmark-compact-menu"
          contentStyle={compactMenuStyle}
          trigger={(
            <ToolbarMenuButton
              label="Views"
              icon={<Bookmark size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              badge={<span style={compactCountBadgeStyle}>{bookmarks.length}/{maxBookmarks}</span>}
              active={menuOpen}
              expanded={menuOpen}
              title="Open saved views"
              ariaLabel={`Open saved views menu (${bookmarks.length} saved view${bookmarks.length === 1 ? "" : "s"})`}
              testId="map-views-trigger"
            />
          )}
        >
          <div>
            <div style={compactMenuHeaderStyle}>
              <span>Saved Views</span>
              <span>{bookmarks.length}/{maxBookmarks}</span>
            </div>
            <div
              style={compactExportStripStyle}
              aria-label="Saved views export inclusion"
              data-testid="map-bookmark-export-strip"
            >
              <span>Review package</span>
              <span>Offline package</span>
            </div>
            <AppMenuSection title="Workspace">
              <AppMenuItem
                icon={<Save size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
                label="Save Current View"
              disabled={bookmarks.length >= maxBookmarks}
                onSelect={handleSave}
                testId="map-save-current-view"
                style={{ color: MAP_COLORS.interaction }}
              />
            </AppMenuSection>
            {bookmarks.length === 0 ? (
              <div style={compactEmptyStateStyle}>
                No saved views
              </div>
            ) : (
              <AppMenuSection title="Saved Views">
                {bookmarks.map((bookmark) => (
                  <div key={bookmark.id} style={compactBookmarkRowStyle}>
                    <button
                      type="button"
                      role="menuitem"
                      style={{
                        minWidth: 0,
                        display: "grid",
                        gap: "0.125rem",
                        border: MAP_STROKES.none,
                        background: MAP_COLORS.transparent,
                        color: MAP_COLORS.textSecondary,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        onRestoreBookmark(bookmark);
                        setMenuOpen(false);
                      }}
                      title={formatBookmarkTitle(bookmark)}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: MAP_COLORS.text }}>
                        {bookmark.name}
                      </span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                        {bookmark.layers.length} visible layer{bookmark.layers.length === 1 ? "" : "s"}
                      </span>
                    </button>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.125rem" }}>
                      <button type="button" style={compactIconButtonStyle} onClick={() => handleRename(bookmark)} aria-label={`Rename ${bookmark.name}`}>
                        <Pencil size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                      </button>
                      <button type="button" style={compactIconButtonStyle} onClick={() => handleShare(bookmark)} aria-label={`Copy link for ${bookmark.name}`}>
                        <Copy size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                      </button>
                      <button type="button" style={{ ...compactIconButtonStyle, color: MAP_COLORS.error }} onClick={() => handleDelete(bookmark)} aria-label={`Delete ${bookmark.name}`}>
                        <Trash2 size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                      </button>
                    </span>
                  </div>
                ))}
              </AppMenuSection>
            )}
          </div>
        </AppDropdownMenu>
      </div>
    );
  }

  return (
    <div
      style={{
        ...barStyle,
        ...(inline ? {
          flex: "0 1 13rem",
          minWidth: "7.5rem",
          minHeight: "1.875rem",
          padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
          gap: MAP_SPACING.xs,
          borderTop: MAP_STROKES.none,
          borderBottom: MAP_STROKES.none,
          borderLeft: MAP_STROKES.hairlineSubtle,
          background: MAP_COLORS.transparent,
          overflowX: "hidden",
        } satisfies React.CSSProperties : null),
        ...style,
      }}
      role={inline ? "group" : "region"}
      aria-label="Saved map views"
    >
      <span style={{
        ...labelStyle,
        ...(inline ? {
          gap: "0.1875rem",
          minWidth: "auto",
          fontSize: "0.6875rem",
        } satisfies React.CSSProperties : null),
      }}>
        <Bookmark size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        {inline ? "Views" : "Saved Views"}
      </span>
      <span
        style={{
          ...bookmarkCountPillStyle,
          ...(inline ? { minHeight: "1.25rem", fontSize: "0.6875rem" } satisfies React.CSSProperties : null),
        }}
        title="Saved views are included in review and offline packages"
        data-testid="map-bookmark-count-pill"
      >
        {bookmarks.length}/{maxBookmarks}
      </span>
      <button
        type="button"
        style={{
          ...mapStyles.btn,
          minHeight: inline ? "1.5rem" : "1.625rem",
          width: inline ? "1.5rem" : undefined,
          padding: inline ? MAP_SPACING.zero : undefined,
          border: inline ? "1px solid transparent" : mapStyles.btn.border,
          flex: "0 0 auto",
        }}
        onClick={handleSave}
        disabled={bookmarks.length >= maxBookmarks}
        aria-label={`Save current map view (${bookmarks.length} of ${maxBookmarks})`}
        title={bookmarks.length >= maxBookmarks ? `Maximum ${maxBookmarks} saved views reached` : "Save current map view"}
      >
        <Save size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        <span style={mapStyles.srOnly}>Save view</span>
      </button>
      <div
        style={{
          ...chipRailStyle,
          ...(inline ? {
            overflowX: "hidden",
            gap: "0.1875rem",
          } satisfies React.CSSProperties : null),
        }}
        aria-label="Saved map view chips"
      >
        {bookmarks.length === 0 ? (
          <span style={emptyStyle}>{inline ? "0 views" : "No saved views"}</span>
        ) : bookmarks.map((bookmark) => (
          <button
            key={bookmark.id}
            type="button"
            style={{
              ...chipStyle,
              ...(inline ? {
                maxWidth: "7rem",
                minHeight: "1.5rem",
                padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
                border: MAP_STROKES.hairlineSubtle,
                background: MAP_COLORS.transparent,
                fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
              } satisfies React.CSSProperties : null),
            }}
            title={formatBookmarkTitle(bookmark)}
            onClick={() => onRestoreBookmark(bookmark)}
            onContextMenu={(event) => {
              event.preventDefault();
              setContextMenu({
                bookmark,
                x: event.clientX,
                y: event.clientY,
              });
            }}
            aria-label={`Restore saved map view ${bookmark.name}`}
          >
            <Bookmark size={MAP_ICON_SIZES.xs} aria-hidden="true" />
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {bookmark.name}
            </span>
          </button>
        ))}
      </div>
      {contextMenu ? (
        <div
          ref={menuRef}
          style={{ ...menuStyle, left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          aria-label={`Saved view actions for ${contextMenu.bookmark.name}`}
        >
          <button type="button" role="menuitem" style={menuItemStyle} onClick={() => handleRename(contextMenu.bookmark)}>
            <Pencil size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Rename
          </button>
          <button type="button" role="menuitem" style={menuItemStyle} onClick={() => handleShare(contextMenu.bookmark)}>
            <Copy size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Copy Link
          </button>
          <button type="button" role="menuitem" style={{ ...menuItemStyle, color: MAP_COLORS.error }} onClick={() => handleDelete(contextMenu.bookmark)}>
            <Trash2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
};
