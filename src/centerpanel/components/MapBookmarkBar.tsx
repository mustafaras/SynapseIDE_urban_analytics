import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, ChevronDown, Copy, Pencil, Save, Trash2 } from "lucide-react";
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
  position: "relative",
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
  paddingLeft: MAP_SPACING.xs,
  borderLeft: MAP_STROKES.hairlineSubtle,
};

const compactTriggerStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.25rem",
  minHeight: "1.625rem",
  padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
  borderRadius: MAP_RADIUS.sm,
  border: "1px solid transparent",
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const compactMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 0.375rem)",
  right: 0,
  zIndex: MAP_Z_INDEX.dropdown,
  width: "min(18rem, calc(100vw - 2rem))",
  maxHeight: "min(26rem, calc(100vh - 5rem))",
  overflowY: "auto",
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.xs,
  borderRadius: MAP_RADIUS.md,
  border: MAP_STROKES.hairlineStrong,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.none,
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
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
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
  minWidth: "0.875rem",
  height: "0.875rem",
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
  const compactMenuRef = useRef<HTMLDivElement | null>(null);
  const inline = variant === "inline";
  const compactMenu = variant === "menu";

  const closeMenu = useCallback(() => {
    setContextMenu(null);
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!contextMenu && !menuOpen) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      if (compactMenuRef.current?.contains(event.target as Node)) return;
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
  }, [closeMenu, contextMenu, menuOpen]);

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
      <div ref={compactMenuRef} style={{ ...compactMenuShell, ...style }} aria-label="Saved map views">
        <button
          type="button"
          style={compactTriggerStyle}
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={`Open saved views menu (${bookmarks.length} saved view${bookmarks.length === 1 ? "" : "s"})`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          title="Open saved views"
        >
          <Bookmark size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          <span>Views</span>
          {bookmarks.length > 0 ? <span style={compactCountBadgeStyle}>{bookmarks.length}</span> : null}
          <ChevronDown size={MAP_ICON_SIZES.xs} aria-hidden="true" />
        </button>

        {menuOpen ? (
          <div style={compactMenuStyle} role="menu" aria-label="Saved map views menu">
            <div style={compactMenuHeaderStyle}>
              <span>Saved Views</span>
              <span>{bookmarks.length}/{maxBookmarks}</span>
            </div>
            <button
              type="button"
              role="menuitem"
              style={{ ...menuItemStyle, border: MAP_STROKES.hairlineSubtle, background: MAP_COLORS.transparent, color: MAP_COLORS.interaction }}
              onClick={handleSave}
              disabled={bookmarks.length >= maxBookmarks}
            >
              <Save size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              Save Current View
            </button>
            {bookmarks.length === 0 ? (
              <div style={{ padding: MAP_SPACING.sm, color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                No saved views
              </div>
            ) : bookmarks.map((bookmark) => (
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
          </div>
        ) : null}
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
