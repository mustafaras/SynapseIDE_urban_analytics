// @vitest-environment jsdom

/**
 * Prompt 36 — GIS shell primitives: accessible-name enforcement + shell keyboard reachability.
 *
 * Tests:
 *   1. GisIconButton always carries an accessible aria-label
 *   2. Disabled GisIconButton exposes disabledReason via data-disabled-reason + title
 *   3. GisIconButton with active=true carries aria-pressed=true
 *   4. GisIconButton without accessible label would fail — label prop is required
 *   5. MapActivityRail renders nav with accessible label
 *   6. MapActivityRail items are focusable (tabIndex not -1)
 *   7. MapCommandBar renders toolbar with labeled actions
 *   8. GisEmptyState uses role="status" for live region
 *   9. GisSectionHeader renders the correct heading element
 *  10. GisProgressBar has role="progressbar" with aria values
 *  11. GisTabs renders tablist + tabpanel with correct aria associations
 *  12. GisToolbar renders role="toolbar"
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Layers, Settings, X } from "lucide-react";
import React from "react";

import {
  GisEmptyState,
  GisDensePropertyRow,
  GisDisclosureRow,
  GisIconButton,
  GisProgressBar,
  GisSectionHeader,
  GisSplitStatusChip,
  GisTabs,
  GisToolbar,
  GisToolbarOverflowTrigger,
} from "@/centerpanel/components/map/ui";
import {
  MapActivityRail,
  MapCommandBar,
  MapWorkspaceShell,
} from "@/centerpanel/components/map/MapWorkspaceShell";
import { MapInspectorHost } from "@/centerpanel/components/map/inspector";

afterEach(() => cleanup());

/* ================================================================== */
/*  GisIconButton                                                       */
/* ================================================================== */
describe("GisIconButton", () => {
  it("carries accessible aria-label", () => {
    render(
      <GisIconButton label="Toggle layers" icon={<Layers size={14} />} />,
    );
    const btn = screen.getByRole("button", { name: "Toggle layers" });
    expect(btn).toBeDefined();
  });

  it("sets aria-pressed=true when active", () => {
    render(
      <GisIconButton label="Inspect" icon={<Layers size={14} />} active />,
    );
    const btn = screen.getByRole("button", { name: "Inspect" });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("exposes disabledReason via data-disabled-reason and title when disabled", () => {
    render(
      <GisIconButton
        label="Export"
        icon={<Layers size={14} />}
        disabled
        disabledReason="No layers selected"
      />,
    );
    const btn = screen.getByRole("button", { name: "Export" });
    expect(btn.getAttribute("data-disabled-reason")).toBe("No layers selected");
    expect(btn.getAttribute("title")).toBe("No layers selected");
    const describedBy = btn.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toContain("No layers selected");
  });

  it("is disabled when disabled=true", () => {
    render(
      <GisIconButton
        label="Close"
        icon={<X size={14} />}
        disabled
        disabledReason="Cannot close now"
      />,
    );
    const btn = screen.getByRole("button", { name: "Close" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("supports the stable rail icon-button variant", () => {
    render(
      <GisIconButton
        label="Layers activity"
        icon={<Layers size={14} />}
        size="rail"
        variant="rail"
        active
      />,
    );
    const btn = screen.getByRole("button", { name: "Layers activity" });
    expect(btn.getAttribute("data-gis-icon-button-size")).toBe("rail");
    expect(btn.getAttribute("data-gis-icon-button-variant")).toBe("rail");
    expect((btn as HTMLButtonElement).style.width).toBe("2.25rem");
    expect((btn as HTMLButtonElement).style.height).toBe("2.25rem");
  });
});

/* ================================================================== */
/*  GisStatusChip                                                       */
/* ================================================================== */
describe("GisStatusChip", () => {
  it("wraps compact labels instead of clipping them", () => {
    render(
      <GisSplitStatusChip
        status="metadata-only"
        label="Metadata only"
        detail="External source reference"
        density="compact"
        data-testid="split-chip"
      />,
    );
    const chip = screen.getByTestId("split-chip");
    expect(chip.getAttribute("data-gis-split-status-chip")).toBe("true");
    expect(chip.getAttribute("aria-label")).toBe("Metadata only: External source reference");
    expect(chip.textContent).toContain("External source reference");
  });
});

/* ================================================================== */
/*  MapActivityRail                                                     */
/* ================================================================== */
describe("MapActivityRail", () => {
  const items = [
    { id: "layers", label: "Layers", icon: <Layers size={14} /> },
    { id: "settings", label: "Settings", icon: <Settings size={14} />, disabled: true, disabledReason: "Not available in demo mode" },
  ];

  it("renders a <nav> with accessible label", () => {
    render(<MapActivityRail items={items} aria-label="Map activity" />);
    const nav = screen.getByRole("navigation", { name: "Map activity" });
    expect(nav).toBeDefined();
  });

  it("renders all item buttons with accessible names", () => {
    render(<MapActivityRail items={items} aria-label="Map activity" />);
    expect(screen.getByRole("button", { name: "Layers" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Settings" })).toBeDefined();
  });

  it("disabled item exposes disabledReason", () => {
    render(<MapActivityRail items={items} aria-label="Map activity" />);
    const btn = screen.getByRole("button", { name: "Settings" });
    expect(btn.getAttribute("data-disabled-reason")).toBe("Not available in demo mode");
  });

  it("supports arrow-key traversal across enabled rail items", () => {
    render(<MapActivityRail items={items} aria-label="Map activity" />);
    const layers = screen.getByRole("button", { name: "Layers" });
    layers.focus();
    layers.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(layers);
  });
});

/* ================================================================== */
/*  MapWorkspaceShell active activity                                   */
/* ================================================================== */
describe("MapWorkspaceShell", () => {
  it("exposes the active activity on the shell surface", () => {
    render(
      <MapWorkspaceShell mode="embedded" activeActivityId="layers">
        <div>Map content</div>
      </MapWorkspaceShell>,
    );

    const surface = document.querySelector('[data-map-explorer-shell="true"]');
    expect(surface?.getAttribute("data-map-active-activity")).toBe("layers");
  });
});

/* ================================================================== */
/*  MapInspectorHost                                                    */
/* ================================================================== */
describe("MapInspectorHost", () => {
  it("renders as a labeled right-side inspector host", () => {
    render(
      <MapInspectorHost
        visible
        context={{ kind: "map", title: "Map context" }}
        presentation="right-rail"
        onClose={vi.fn()}
      />,
    );

    const host = screen.getByTestId("map-inspector-host");
    expect(host.getAttribute("data-presentation")).toBe("right-rail");
    expect(screen.getByRole("dialog", { name: "Map inspector: Map context" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Close inspector" })).toBeDefined();
  });
});

/* ================================================================== */
/*  MapCommandBar                                                       */
/* ================================================================== */
describe("MapCommandBar", () => {
  it("renders toolbar with labeled action buttons", () => {
    render(
      <MapCommandBar
        title="Map Explorer"
        actions={[
          { id: "close", label: "Close", icon: <X size={14} />, onClick: vi.fn() },
        ]}
      />,
    );
    const toolbar = screen.getByRole("toolbar", { name: "Command bar actions" });
    expect(toolbar).toBeDefined();
    expect(screen.getByRole("button", { name: "Close" })).toBeDefined();
  });

  it("renders a disabled action with disabledReason", () => {
    render(
      <MapCommandBar
        title="Map Explorer"
        actions={[
          { id: "export", label: "Export", icon: <Layers size={14} />, disabled: true, disabledReason: "Select a layer first" },
        ]}
      />,
    );
    const btn = screen.getByRole("button", { name: "Export" });
    expect(btn.getAttribute("data-disabled-reason")).toBe("Select a layer first");
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});

/* ================================================================== */
/*  GisEmptyState                                                       */
/* ================================================================== */
describe("GisEmptyState", () => {
  it("uses role=status for live region", () => {
    render(<GisEmptyState title="No layers" description="Add a layer to begin." />);
    const el = screen.getByRole("status");
    expect(el).toBeDefined();
    expect(el.textContent).toContain("No layers");
  });
});

/* ================================================================== */
/*  GisSectionHeader                                                    */
/* ================================================================== */
describe("GisSectionHeader", () => {
  it("renders the correct heading level", () => {
    render(<GisSectionHeader title="Metadata" level={3} />);
    const heading = screen.getByRole("heading", { level: 3, name: "Metadata" });
    expect(heading).toBeDefined();
  });

  it("renders actions slot", () => {
    render(
      <GisSectionHeader
        title="Properties"
        actions={<button type="button" aria-label="Edit">Edit</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
  });
});

/* ================================================================== */
/*  GisProgressBar                                                      */
/* ================================================================== */
describe("GisProgressBar", () => {
  it("has role=progressbar with aria-valuenow", () => {
    render(<GisProgressBar label="Upload progress" value={45} />);
    const bar = screen.getByRole("progressbar", { name: "Upload progress" });
    expect(bar.getAttribute("aria-valuenow")).toBe("45");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("indeterminate mode omits aria-valuenow", () => {
    render(<GisProgressBar label="Loading" />);
    const bar = screen.getByRole("progressbar", { name: "Loading" });
    expect(bar.getAttribute("aria-valuenow")).toBeNull();
  });
});

/* ================================================================== */
/*  GisTabs                                                             */
/* ================================================================== */
describe("GisTabs", () => {
  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "schema", label: "Schema" },
    { id: "crs", label: "CRS", disabled: true, disabledReason: "No CRS detected" },
  ];

  it("renders tablist and tabpanel with correct ARIA associations", () => {
    render(
      <GisTabs
        tabs={TABS}
        activeId="overview"
        onTabChange={vi.fn()}
        aria-label="Layer inspector"
      >
        <div>Overview content</div>
      </GisTabs>,
    );
    const tabList = screen.getByRole("tablist", { name: "Layer inspector" });
    expect(tabList).toBeDefined();
    const activeTab = screen.getByRole("tab", { name: "Overview" });
    expect(activeTab.getAttribute("aria-selected")).toBe("true");
  });

  it("exposes disabled-reason on disabled tab", () => {
    render(
      <GisTabs
        tabs={TABS}
        activeId="overview"
        onTabChange={vi.fn()}
        aria-label="Layer inspector"
      >
        <div>Content</div>
      </GisTabs>,
    );
    const crsTab = screen.getByRole("tab", { name: "CRS" });
    expect(crsTab.getAttribute("data-disabled-reason")).toBe("No CRS detected");
    const describedBy = crsTab.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toContain("No CRS detected");
  });

  it("supports compact tab geometry without clipping text", () => {
    render(
      <GisTabs
        tabs={TABS}
        activeId="overview"
        onTabChange={vi.fn()}
        aria-label="Compact layer inspector"
        variant="compact"
        tabTestIdPrefix="compact-tab"
      >
        <div>Content</div>
      </GisTabs>,
    );
    const activeTab = screen.getByTestId("compact-tab-overview");
    expect(activeTab.getAttribute("data-gis-tab-variant")).toBe("compact");
    expect((activeTab as HTMLButtonElement).style.minHeight).toBe("1.625rem");
    expect((activeTab as HTMLButtonElement).style.whiteSpace).toBe("normal");
    expect((activeTab as HTMLButtonElement).style.textOverflow).toBe("clip");
  });
});

/* ================================================================== */
/*  GisDisclosureRow                                                    */
/* ================================================================== */
describe("GisDisclosureRow", () => {
  it("renders an accessible disclosure row and toggles expansion", () => {
    const onExpandedChange = vi.fn();
    render(
      <GisDisclosureRow
        label="Source health"
        description="Recoverable external services"
        expanded={false}
        onExpandedChange={onExpandedChange}
      >
        <span>Recoverable sources</span>
      </GisDisclosureRow>,
    );
    const button = screen.getByRole("button", { name: /Source health/ });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-controls")).toBeTruthy();
    fireEvent.click(button);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it("exposes disabled reason and does not toggle when disabled", () => {
    const onExpandedChange = vi.fn();
    render(
      <GisDisclosureRow
        label="Advanced QA"
        expanded={false}
        disabled
        disabledReason="No layer selected"
        onExpandedChange={onExpandedChange}
      />,
    );
    const button = screen.getByRole("button", { name: "Advanced QA" });
    expect(button.getAttribute("data-disabled-reason")).toBe("No layer selected");
    const describedBy = button.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toContain("No layer selected");
    fireEvent.click(button);
    expect(onExpandedChange).not.toHaveBeenCalled();
  });
});

/* ================================================================== */
/*  GisDensePropertyRow                                                 */
/* ================================================================== */
describe("GisDensePropertyRow", () => {
  it("renders a dense wrapping property row", () => {
    render(
      <GisDensePropertyRow
        label="CRS"
        value="User-declared EPSG:26918, verification required before planar analysis"
        mono
        data-testid="dense-property-row"
      />,
    );
    const row = screen.getByTestId("dense-property-row");
    expect(row.getAttribute("data-gis-dense-property-row")).toBe("true");
    expect(row.textContent).toContain("verification required");
  });
});

/* ================================================================== */
/*  GisToolbar                                                          */
/* ================================================================== */
describe("GisToolbar", () => {
  it("renders role=toolbar with accessible label", () => {
    render(
      <GisToolbar aria-label="Map tools">
        <GisIconButton label="Zoom in" icon={<Layers size={14} />} />
      </GisToolbar>,
    );
    const toolbar = screen.getByRole("toolbar", { name: "Map tools" });
    expect(toolbar).toBeDefined();
  });

  it("renders a toolbar overflow trigger with menu semantics", () => {
    render(
      <GisToolbar aria-label="Map tools">
        <GisToolbarOverflowTrigger open />
      </GisToolbar>,
    );
    const trigger = screen.getByRole("button", { name: "More actions" });
    expect(trigger.getAttribute("data-gis-toolbar-overflow-trigger")).toBe("true");
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-pressed")).toBeNull();
  });
});
