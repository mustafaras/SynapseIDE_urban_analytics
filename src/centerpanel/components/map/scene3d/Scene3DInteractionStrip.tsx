/**
 * Prompt 34 — 3D block + scenario interaction design.
 *
 * Compact horizontal strip of 3D interaction-mode buttons.
 * Positioned top-left so it does NOT occlude selected geometry in the center/right
 * of the map canvas. Respects prefers-reduced-motion.
 */
import React, { useCallback, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  Bookmark,
  Columns2,
  Eye,
  MousePointer2,
  MoveVertical,
  Ruler,
  Scissors,
  Sun,
} from "lucide-react";
import {
  INTERACTION_MODES,
  type Scene3DInteractionMode,
  selectCameraBookmarks,
  selectInteractionMode,
  useScene3DStore,
} from "@/stores/useScene3DStore";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { GisIconButton } from "../ui/GisIconButton";

/* ------------------------------------------------------------------ */
/*  Icon map                                                            */
/* ------------------------------------------------------------------ */

const MODE_ICONS: Record<Scene3DInteractionMode, React.ReactNode> = {
  "inspect":         <Eye size={MAP_ICON_SIZES.sm} aria-hidden />,
  "select":          <MousePointer2 size={MAP_ICON_SIZES.sm} aria-hidden />,
  "measure":         <Ruler size={MAP_ICON_SIZES.sm} aria-hidden />,
  "edit-height":     <MoveVertical size={MAP_ICON_SIZES.sm} aria-hidden />,
  "compare":         <Columns2 size={MAP_ICON_SIZES.sm} aria-hidden />,
  "sun-shadow":      <Sun size={MAP_ICON_SIZES.sm} aria-hidden />,
  "section":         <Scissors size={MAP_ICON_SIZES.sm} aria-hidden />,
  "camera-bookmark": <Bookmark size={MAP_ICON_SIZES.sm} aria-hidden />,
};

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const stripStyle: React.CSSProperties = {
  position: "absolute",
  top: "var(--map-overlay-safe-top, calc(var(--map-shell-command-height, 2.75rem) + var(--map-overlay-safe-inset-y, 0.25rem)))",
  left: "calc(var(--map-dock-left, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  zIndex: MAP_Z_INDEX.mapFurniture,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "2px",
  padding: "3px",
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.badge,
  boxShadow: MAP_SHADOWS.panel,
  /* strip intentionally placed top-left — does not occlude center/right canvas */
};

const bookmarkListStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  zIndex: MAP_Z_INDEX.mapFurniture + 1,
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.md,
  boxShadow: MAP_SHADOWS.panel,
  padding: MAP_SPACING.sm,
  minWidth: "12rem",
};

const bookmarkRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.text,
};

const bookmarkDeleteStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  padding: 0,
};

const emptyBookmarkStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textSecondary,
  padding: MAP_SPACING.xs,
  textAlign: "center",
};

const addBookmarkInputStyle: React.CSSProperties = {
  width: "100%",
  background: MAP_COLORS.bgHeader,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  marginTop: MAP_SPACING.xs,
  outline: "none",
};

const dividerStyle: React.CSSProperties = {
  width: "1px",
  height: "1.25rem",
  background: MAP_COLORS.hairlineSubtle,
  flexShrink: 0,
};

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface Scene3DInteractionStripProps {
  visible: boolean;
  presentation?: "floating" | "embedded";
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const Scene3DInteractionStrip: React.FC<Scene3DInteractionStripProps> = ({
  visible,
  presentation = "floating",
}) => {
  const activeMode = useScene3DStore(selectInteractionMode);
  const bookmarks = useScene3DStore(selectCameraBookmarks);
  const setInteractionMode = useScene3DStore((s) => s.setInteractionMode);
  const addBookmark = useScene3DStore((s) => s.addCameraBookmark);
  const removeBookmark = useScene3DStore((s) => s.removeCameraBookmark);
  const reduced = usePrefersReducedMotion();

  const [showBookmarks, setShowBookmarks] = useState(false);
  const [newName, setNewName] = useState("");

  const handleModeClick = useCallback(
    (mode: Scene3DInteractionMode) => {
      setInteractionMode(mode);
      if (mode === "camera-bookmark") {
        setShowBookmarks((p) => !p);
      } else {
        setShowBookmarks(false);
      }
    },
    [setInteractionMode],
  );

  const handleAddBookmark = useCallback(() => {
    const name = newName.trim() || `View ${bookmarks.length + 1}`;
    addBookmark(name);
    setNewName("");
  }, [newName, bookmarks.length, addBookmark]);

  if (!visible) return null;

  const embedded = presentation === "embedded";
  const resolvedStripStyle: React.CSSProperties = embedded
    ? {
        ...stripStyle,
        position: "relative",
        top: "auto",
        left: "auto",
        zIndex: "auto",
        flexWrap: "wrap",
        width: "100%",
        borderRadius: MAP_RADIUS.sm,
        boxShadow: "none",
        background: MAP_COLORS.bgWorkspace,
      }
    : stripStyle;
  const resolvedBookmarkListStyle: React.CSSProperties = embedded
    ? {
        ...bookmarkListStyle,
        position: "static",
        flexBasis: "100%",
        minWidth: 0,
        boxShadow: "none",
        marginTop: MAP_SPACING.xs,
      }
    : bookmarkListStyle;

  /* Dividers between logical groups */
  const dividerAfter = new Set<number>([1, 3, 6]);

  return (
    <div
      data-testid="scene3d-interaction-strip"
      data-presentation={presentation}
      data-position={embedded ? "docked" : "top-left"}
      data-map-safe-inset-consumer={embedded ? undefined : "scene3d-interaction-strip"}
      style={resolvedStripStyle}
      role="toolbar"
      aria-label="3D interaction tools"
    >
      {INTERACTION_MODES.map(({ mode, label }, idx) => (
        <React.Fragment key={mode}>
          <GisIconButton
            data-testid={`3d-mode-btn-${mode}`}
            label={label}
            icon={MODE_ICONS[mode]}
            active={activeMode === mode}
            onClick={() => handleModeClick(mode)}
            style={{ transition: reduced ? "none" : MAP_TRANSITIONS.fast }}
          />
          {dividerAfter.has(idx) && <span style={dividerStyle} aria-hidden />}
        </React.Fragment>
      ))}

      {!!showBookmarks && (
        <div style={resolvedBookmarkListStyle} data-testid="camera-bookmark-list">
          {bookmarks.length === 0 ? (
            <p style={emptyBookmarkStyle}>No saved views</p>
          ) : (
            bookmarks.map((bm) => (
              <div key={bm.id} style={bookmarkRowStyle}>
                <span>{bm.name}</span>
                <button
                  type="button"
                  aria-label={`Remove bookmark: ${bm.name}`}
                  style={bookmarkDeleteStyle}
                  onClick={() => removeBookmark(bm.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}
          <input
            type="text"
            placeholder="Save current view…"
            value={newName}
            style={addBookmarkInputStyle}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddBookmark();
            }}
            aria-label="New bookmark name"
          />
        </div>
      )}
    </div>
  );
};
