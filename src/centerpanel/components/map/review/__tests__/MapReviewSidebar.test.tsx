// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MapReviewSidebar } from "../MapReviewSidebar";

describe("MapReviewSidebar", () => {
  const baseProps = {
    visible: true as const,
    activeTab: "problems" as const,
    onTabChange: () => undefined,
    onClose: () => undefined,
    problems: <div data-testid="problems-body">QA problems body</div>,
    review: <div data-testid="review-body">Review timeline body</div>,
  };

  it("returns null when not visible", () => {
    const html = renderToStaticMarkup(
      <MapReviewSidebar {...baseProps} visible={false} />,
    );
    expect(html).toBe("");
  });

  it("renders both tabs and the active problems panel", () => {
    const html = renderToStaticMarkup(<MapReviewSidebar {...baseProps} />);
    expect(html).toContain('data-testid="map-review-sidebar"');
    expect(html).toContain('data-testid="map-review-tab-problems"');
    expect(html).toContain('data-testid="map-review-tab-review"');
    expect(html).toContain('data-active-review-tab="problems"');
    expect(html).toContain("QA problems body");
    expect(html).not.toContain("Review timeline body");
  });

  it("shows the review content when the review tab is active", () => {
    const html = renderToStaticMarkup(
      <MapReviewSidebar {...baseProps} activeTab="review" reviewCount={3} />,
    );
    expect(html).toContain('data-active-review-tab="review"');
    expect(html).toContain("Review timeline body");
    expect(html).toContain(">3<");
  });

  it("surfaces a blocker count on the problems tab", () => {
    const html = renderToStaticMarkup(
      <MapReviewSidebar {...baseProps} blockerCount={2} problemCount={5} />,
    );
    // blocker count takes precedence over the neutral problem count
    expect(html).toContain(">2<");
  });

  it("invokes onTabChange and onClose from the DOM", async () => {
    const onTabChange = vi.fn();
    const onClose = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        <MapReviewSidebar {...baseProps} onTabChange={onTabChange} onClose={onClose} />,
      );
    });

    const reviewTab = host.querySelector<HTMLButtonElement>('[data-testid="map-review-tab-review"]');
    await act(async () => {
      reviewTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onTabChange).toHaveBeenCalledWith("review");

    const closeButton = host.querySelector<HTMLButtonElement>('button[aria-label="Close review sidebar"]');
    await act(async () => {
      closeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
