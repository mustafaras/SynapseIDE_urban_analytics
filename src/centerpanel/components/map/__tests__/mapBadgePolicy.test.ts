// @vitest-environment node

/**
 * p01 — Map Explorer badge / status-language policy gate.
 *
 * Two enforced invariants for the dock/drawing/status redesign pack
 * (archived: docs/archive/development-plans/map-explorer-dock-redesign-2026-06-15):
 *
 *  A. STATUS TONE (hard, enforced now): MAP_STATUS_TOKENS fills and borders must
 *     NOT be tinted with the saturated success/error palette vars
 *     (--syn-status-valid / --syn-status-error). Status meaning is carried by a
 *     MUTED text tone only — never green/red fills or borders. This kills the
 *     "round red/green badge" colour problem at the token source.
 *
 *  B. ROUND-SHAPE BUDGET (p03 enforced): no map source file may introduce a
 *     NEW round status shape (`MAP_RADIUS.full`, or a literal
 *     `border-radius: 999 | 9999 | 50%`). The only remaining round uses are
 *     documented non-status affordances: cartographic circle glyphs, map pins,
 *     collaboration presence dots, and a swipe drag handle.
 *
 * NOTE for future agents: keep this list narrow and reasoned. A new round
 * status badge should fail this test; a new non-status affordance must include
 * a specific purpose here.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

import { GIS_STATUS_KEYS, MAP_STATUS_TOKENS } from "@/centerpanel/components/map/mapTokens";

const MAP_DIR = join(process.cwd(), "src", "centerpanel", "components", "map");

/** Saturated palette vars that must never appear in a status FILL or BORDER. */
const SATURATED_STATUS_VARS = ["--syn-status-valid", "--syn-status-error"] as const;

/** Remaining `MAP_RADIUS.full` uses that are not status badges. */
const ROUND_TOKEN_AFFORDANCE_EXEMPTIONS = {
  "CartographyRecommendationList.tsx": "cartographic circle / dot-density legend glyph",
  "MapCanvas.tsx": "interactive map pin marker shape",
  "MapLayerManager.tsx": "cartographic circle / dot-density layer legend preview glyph",
  "MapReviewTimelinePanel.tsx": "collaboration presence dot",
  "MapSwipeCompareOverlay.tsx": "draggable swipe handle affordance",
  "controllers/mapPublishWorkspaceElements.tsx": "cartographic circle / dot-density publish legend glyph",
  "inspector/style/MapLegendOverlay.tsx": "cartographic circle / dot-density map legend glyph",
  "style/MapStyleWorkspace.tsx": "circle symbol swatch for cartographic point styling",
} as const satisfies Record<string, string>;

/** p03 removed every literal 999/50% status radius from map source. */
const ROUND_LITERAL_ALLOWLIST: readonly string[] = [];

const SCAN_EXTENSIONS = [".ts", ".tsx", ".css"];
const ROUND_TOKEN_RE = /\bMAP_RADIUS\.full\b/;
const ROUND_LITERAL_RE = /border-?radius:\s*(?:9999|999|['"]?50%['"]?)/i;

function listMapSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "__tests__" || entry === "__snapshots__" || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listMapSourceFiles(full));
    } else if (SCAN_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

function toMapRelative(absolute: string): string {
  return relative(MAP_DIR, absolute).split(sep).join("/");
}

const FILES = listMapSourceFiles(MAP_DIR).map((absolute) => ({
  rel: toMapRelative(absolute),
  text: readFileSync(absolute, "utf8"),
}));

describe("p01 status-tone policy (hard)", () => {
  it("no status fill or border is tinted with the saturated success/error vars", () => {
    const violations: string[] = [];
    for (const status of GIS_STATUS_KEYS) {
      const tok = MAP_STATUS_TOKENS[status];
      for (const field of ["bg", "border"] as const) {
        for (const banned of SATURATED_STATUS_VARS) {
          if (tok[field].includes(banned)) {
            violations.push(`${status}.${field} uses ${banned} ("${tok[field]}")`);
          }
        }
      }
    }
    expect(violations, `Status chips must be calm — move saturated colour off fills/borders:\n${violations.join("\n")}`).toEqual([]);
  });

  it("status text still carries meaning (ready != blocked; blocked == external-offline)", () => {
    expect(MAP_STATUS_TOKENS.ready.text).not.toBe(MAP_STATUS_TOKENS.blocked.text);
    expect(MAP_STATUS_TOKENS.blocked.text).toBe(MAP_STATUS_TOKENS["external-offline"].text);
  });
});

describe("p01 round-shape budget (allowlist shrunk by p03)", () => {
  it("introduces no NEW MAP_RADIUS.full usage outside documented non-status affordances", () => {
    const offenders = FILES.filter((f) => ROUND_TOKEN_RE.test(f.text)).map((f) => f.rel).sort();
    const exemptFiles = Object.keys(ROUND_TOKEN_AFFORDANCE_EXEMPTIONS).sort();
    const unexpected = offenders.filter((f) => !exemptFiles.includes(f));
    expect(unexpected, `New round-token usage found — de-round it unless it is a specific non-status affordance:\n${unexpected.join("\n")}`).toEqual([]);
    const stale = exemptFiles.filter((f) => !offenders.includes(f));
    expect(stale, `These affordance exemptions no longer use MAP_RADIUS.full — remove them:\n${stale.join("\n")}`).toEqual([]);
    const undocumented = Object.entries(ROUND_TOKEN_AFFORDANCE_EXEMPTIONS).filter(([, reason]) => reason.trim().length < 12);
    expect(undocumented, `Every remaining round affordance needs a concrete reason:\n${undocumented.map(([file]) => file).join("\n")}`).toEqual([]);
  });

  it("introduces no NEW literal round radius outside the allowlist", () => {
    const offenders = FILES.filter((f) => ROUND_LITERAL_RE.test(f.text)).map((f) => f.rel).sort();
    const unexpected = offenders.filter((f) => !ROUND_LITERAL_ALLOWLIST.includes(f));
    expect(unexpected, `New literal round radius found — de-round it or justify + add to ROUND_LITERAL_ALLOWLIST:\n${unexpected.join("\n")}`).toEqual([]);
    const stale = ROUND_LITERAL_ALLOWLIST.filter((f) => !offenders.includes(f));
    expect(stale, `These files no longer use a literal round radius — remove them from ROUND_LITERAL_ALLOWLIST:\n${stale.join("\n")}`).toEqual([]);
  });

  it("the de-roundification backlog is tracked (informational target: empty)", () => {
    const remainingLiteralBacklog = ROUND_LITERAL_ALLOWLIST.length;
    expect(remainingLiteralBacklog).toBe(0);
  });
});
