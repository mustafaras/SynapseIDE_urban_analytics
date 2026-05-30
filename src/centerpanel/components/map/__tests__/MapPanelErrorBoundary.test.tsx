// @vitest-environment jsdom

import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearMapTelemetryEvents, getMapTelemetryEvents } from "@/services/map/observability";
import { MapPanelErrorBoundary } from "../MapPanelErrorBoundary";

function ThrowingPanel(): React.ReactElement {
  throw new Error("Panel exploded for sam@example.test token=panel-secret-value");
}

function Harness(): React.ReactElement {
  const [throws, setThrows] = useState(true);
  return (
    <>
      <MapPanelErrorBoundary panelName="Diagnostics" onReset={() => setThrows(false)}>
        {throws ? <ThrowingPanel /> : <div data-testid="panel-recovered">Panel recovered</div>}
      </MapPanelErrorBoundary>
      <div data-testid="map-shell-survived">Map shell survived</div>
    </>
  );
}

describe("MapPanelErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    clearMapTelemetryEvents();
    cleanup();
  });

  it("catches thrown panel renders and retries without blanking the map shell", () => {
    render(<Harness />);

    expect(screen.getByTestId("map-panel-error-boundary").textContent).toContain("Diagnostics panel recovered");
    expect(screen.queryByTestId("map-shell-survived")).not.toBeNull();

    const stored = JSON.stringify(getMapTelemetryEvents());
    expect(stored).toContain("panel.error");
    expect(stored).toContain("[REDACTED]");
    expect(stored).not.toContain("sam@example.test");
    expect(stored).not.toContain("panel-secret-value");

    fireEvent.click(screen.getByTestId("map-panel-error-retry"));
    expect(screen.queryByTestId("panel-recovered")).not.toBeNull();
    expect(screen.queryByTestId("map-shell-survived")).not.toBeNull();
  });
});
