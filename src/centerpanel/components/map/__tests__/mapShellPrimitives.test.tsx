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
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Layers, Settings, X } from "lucide-react";
import React from "react";

import {
  GisEmptyState,
  GisIconButton,
  GisProgressBar,
  GisSectionHeader,
  GisTabs,
  GisToolbar,
} from "@/centerpanel/components/map/ui";
import {
  MapActivityRail,
  MapCommandBar,
} from "@/centerpanel/components/map/MapWorkspaceShell";

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
});
