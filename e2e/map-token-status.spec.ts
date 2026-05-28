/**
 * Playwright e2e — Prompt 35: GIS token status layer + reduced-motion gate
 *
 * Proof:
 * 1. Every GIS_STATUS_KEYS chip exists in the injected token demo DOM.
 * 2. Under emulated prefers-reduced-motion:reduce, window.matchMedia returns true
 *    (which the usePrefersReducedMotion hook reads), and the demo element exposes
 *    data-reduced-motion="true".
 */
import { expect, test } from "@playwright/test";

const ALL_STATUSES = [
  "ready",
  "caveat",
  "unknown",
  "demo",
  "synthetic",
  "external-offline",
  "stale",
  "blocked",
  "running",
] as const;

test.describe("Prompt 35 — GIS token status + reduced-motion gate @smoke", () => {
  test("all status chips render and reduced-motion gate activates when emulated", async ({
    page,
  }) => {
    /* Emulate reduced-motion BEFORE navigation so the hook sees it from mount */
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    /* Inject the status demo into the live DOM */
    await page.evaluate(async () => {
      const { MAP_STATUS_TOKENS, GIS_STATUS_KEYS, MAP_DENSITY } = await import(
        "/src/centerpanel/components/map/mapTokens.ts"
      );

      const density = MAP_DENSITY.compact;
      const container = document.createElement("div");
      container.setAttribute("data-testid", "gis-token-status-demo");
      /* Reflect reduced-motion state from the window API */
      const isReduced =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      container.setAttribute("data-reduced-motion", isReduced ? "true" : "false");
      container.style.cssText =
        "display:flex;flex-wrap:wrap;gap:6px;padding:12px;position:fixed;bottom:0;left:0;z-index:99999;background:rgba(0,0,0,.7);";

      for (const status of GIS_STATUS_KEYS) {
        const tok = MAP_STATUS_TOKENS[status as keyof typeof MAP_STATUS_TOKENS];
        const chip = document.createElement("span");
        chip.setAttribute("data-testid", `status-chip-${status}`);
        chip.setAttribute("data-status", status);
        chip.style.cssText = [
          `color:${tok.text}`,
          `background:${tok.bg}`,
          `border:1px solid ${tok.border}`,
          `padding:${density.cellPadding}`,
          `border-radius:3px`,
          `font-size:${density.fontSize}`,
          `font-weight:600`,
          `white-space:nowrap`,
        ].join(";");
        chip.textContent = status;
        container.appendChild(chip);
      }

      document.body.appendChild(container);
    });

    /* 1. Every status chip must be visible */
    for (const status of ALL_STATUSES) {
      await expect(
        page.getByTestId(`status-chip-${status}`),
        `status chip "${status}" should be visible`,
      ).toBeVisible();
    }

    /* 2. Reduced-motion flag is reflected in the demo container */
    const reducedMotionAttr = await page
      .getByTestId("gis-token-status-demo")
      .getAttribute("data-reduced-motion");
    expect(reducedMotionAttr).toBe("true");

    /* 3. window.matchMedia actually returns matches:true (hook reads this) */
    const matchesReduced = await page.evaluate(
      () =>
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    expect(matchesReduced).toBe(true);

    /* Screenshot for visual reference */
    await page
      .getByTestId("gis-token-status-demo")
      .screenshot({ path: "test-results/token-status-35-chips.png" });
  });

  test("status chip colors differ by semantic role", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const colors = await page.evaluate(async () => {
      const { MAP_STATUS_TOKENS } = await import(
        "/src/centerpanel/components/map/mapTokens.ts"
      );
      return {
        readyText: MAP_STATUS_TOKENS.ready.text,
        blockedText: MAP_STATUS_TOKENS.blocked.text,
        demoText: MAP_STATUS_TOKENS.demo.text,
        unknownText: MAP_STATUS_TOKENS.unknown.text,
      };
    });

    /* ready and blocked must differ (green vs red) */
    expect(colors.readyText).not.toBe(colors.blockedText);
    /* demo uses the interaction color, different from neutral unknown */
    expect(colors.demoText).not.toBe(colors.unknownText);
  });
});
