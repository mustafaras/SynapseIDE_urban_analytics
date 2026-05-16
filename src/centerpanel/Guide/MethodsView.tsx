/**
 * MethodsView — Urban methodology guide viewer.
 *
 * Single-column scrollable content pane. The shell supplies the left outline
 * rail via OutlineRail; this view renders only a compact header + the guide
 * cards. No inner outline rail (the shell rail is the sole index).
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/guides.module.css";
import {
  GUIDE_CATEGORIES,
  type GuideCategory,
  METHODOLOGY_GUIDES,
  type MethodologyGuide,
} from "./guideContent";
import { CategoryIcon } from "./categoryIcon";
import { publishGuideRailState, toGuideRailItem } from "./guideRailBridge";

const SECTION_KEYS: { key: keyof MethodologyGuide; label: string }[] = [
  { key: "abstract", label: "Abstract" },
  { key: "methodology", label: "Methodology" },
  { key: "assumptions", label: "Assumptions" },
  { key: "limitations", label: "Limitations" },
  { key: "dataRequirements", label: "Data Requirements" },
  { key: "pythonExample", label: "Python Example" },
  { key: "interpretation", label: "Interpretation" },
  { key: "references", label: "References" },
  { key: "relatedIndicators", label: "Related Indicators" },
  { key: "sdgAlignment", label: "SDG Alignment" },
];

const CATEGORY_VALIDITY: Record<GuideCategory, { scale: string; crs: string; evidence: string }> = {
  "Spatial Statistics": {
    scale: "tract / grid / zone",
    crs: "project before distance weights",
    evidence: "attribute + topology",
  },
  "Network Analysis": {
    scale: "node / edge / catchment",
    crs: "network length in metres",
    evidence: "walkable graph required",
  },
  "Remote Sensing": {
    scale: "pixel / zone",
    crs: "project for area summaries",
    evidence: "sensor date + mask",
  },
  "Urban Morphology": {
    scale: "parcel / block / fabric",
    crs: "project before area metrics",
    evidence: "height provenance",
  },
  "Transport Planning": {
    scale: "origin / stop / corridor",
    crs: "network walk distances",
    evidence: "dated GTFS feed",
  },
  "Environmental Analysis": {
    scale: "hazard / tract / grid",
    crs: "harmonised analysis CRS",
    evidence: "source + uncertainty",
  },
  Socioeconomic: {
    scale: "tract / block group",
    crs: "stable boundary joins",
    evidence: "MOE / source year",
  },
  "3D & Simulation": {
    scale: "surface / voxel / scene",
    crs: "3D geometry projected",
    evidence: "LoD + timestamp",
  },
  "Data Engineering": {
    scale: "dataset / pipeline",
    crs: "declared before analysis",
    evidence: "manifest + checksum",
  },
};

const CATEGORY_ORDER: Array<GuideCategory | "All"> = ["All", ...GUIDE_CATEGORIES.map((category) => category.key)];

function SectionBlock({ guide, sKey }: { guide: MethodologyGuide; sKey: keyof MethodologyGuide }) {
  const val = guide[sKey];
  if (val == null || (Array.isArray(val) && val.length === 0)) return null;

  if (sKey === "pythonExample") {
    return (
      <pre
        className={styles.block}
        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12, overflowX: "auto" }}
      >
        {val as string}
      </pre>
    );
  }
  if (Array.isArray(val)) {
    return (
      <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
        {(val as string[]).map((item, i) => (
          <li
            key={i}
            className={styles.block}
            style={{ border: "none", padding: "2px 0", borderRadius: 0, background: "transparent" }}
          >
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return <div className={styles.block}>{val as string}</div>;
}

function GuideCard({ guide }: { guide: MethodologyGuide }) {
  const validity = CATEGORY_VALIDITY[guide.category];
  const metrics = [
    { label: "Steps", value: guide.methodology.length },
    { label: "Inputs", value: guide.dataRequirements.length },
    { label: "Limits", value: guide.limitations.length },
    { label: "Refs", value: guide.references.length },
    { label: "SDG", value: guide.sdgAlignment?.length ?? 0 },
  ];

  return (
    <article className={styles.card} data-guide-id={guide.id} data-guide-cat={guide.category}>
      <header className={styles.cardHeader}>
        <span
          className={styles.cardTitle}
          data-guide-title
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <CategoryIcon category={guide.category} size={14} />
          {guide.title}
        </span>
        <span className={styles.cardSub}>{guide.category}</span>
      </header>
      <div className={styles.methodSignalRow} aria-label="Method validity summary">
        <span>
          Scale <strong>{validity.scale}</strong>
        </span>
        <span>
          CRS <strong>{validity.crs}</strong>
        </span>
        <span>
          Evidence <strong>{validity.evidence}</strong>
        </span>
      </div>
      <div className={styles.methodMetricsRow} aria-label="Guide content metrics">
        {metrics.map((metric) => (
          <span key={metric.label} className={styles.methodMetric}>
            <strong>{metric.value}</strong>
            {metric.label}
          </span>
        ))}
      </div>
      {SECTION_KEYS.map(({ key, label }, index) => {
        const val = guide[key];
        if (val == null || (Array.isArray(val) && val.length === 0)) return null;
        return (
          <section key={key} className={styles.section} style={{ display: "block" }}>
            <div className={styles.summaryRow} style={{ cursor: "default" }}>
              <span className={styles.sectionIndex}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.sectionTitle}>{label}</span>
            </div>
            <div style={{ padding: "4px 0 8px" }}>
              <SectionBlock guide={guide} sKey={key} />
            </div>
          </section>
        );
      })}
    </article>
  );
}

export default function MethodsView() {
  const [cat, setCat] = useState<GuideCategory | "All">("All");
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<GuideCategory | "All", number>([["All", METHODOLOGY_GUIDES.length]]);
    for (const guide of METHODOLOGY_GUIDES) {
      counts.set(guide.category, (counts.get(guide.category) ?? 0) + 1);
    }
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return METHODOLOGY_GUIDES.filter((g) => {
      if (cat !== "All" && g.category !== cat) return false;
      if (!words.length) return true;
      const hay = `${g.title} ${g.abstract} ${g.category} ${g.relatedIndicators.join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [cat, q]);

  useEffect(() => {
    publishGuideRailState({
      mode: cat,
      query: q,
      items: filtered.map(toGuideRailItem),
      totalCount: METHODOLOGY_GUIDES.length,
    });
  }, [cat, filtered, q]);

  function focusTabAt(index: number) {
    const safeIndex = (index + CATEGORY_ORDER.length) % CATEGORY_ORDER.length;
    const next = CATEGORY_ORDER[safeIndex];
    setCat(next);
    window.requestAnimationFrame(() => tabRefs.current[safeIndex]?.focus());
  }

  function handleCategoryKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTabAt(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTabAt(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTabAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTabAt(CATEGORY_ORDER.length - 1);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topHeader}>
        <div className={styles.topTitle}>
          <FileTextStyled />
          <span>Methodology Guides</span>
          <span className={styles.activeContext}>{cat === "All" ? "All domains" : cat}</span>
        </div>

        <div className={styles.topControls}>
          <input
            ref={searchRef}
            className={styles.searchInput}
            placeholder="Search guides…  (/)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              type="button"
              className={styles.clearFilter}
              onClick={() => {
                setQ("");
                searchRef.current?.focus();
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className={styles.chips} role="tablist" aria-label="Method categories">
          <button
            ref={(node) => {
              tabRefs.current[0] = node;
            }}
            className={styles.chip}
            data-active={cat === "All" ? "true" : undefined}
            data-tab-index="00"
            role="tab"
            aria-selected={cat === "All"}
            tabIndex={cat === "All" ? 0 : -1}
            onClick={() => setCat("All")}
            onKeyDown={(event) => handleCategoryKeyDown(event, 0)}
          >
            <span className={styles.chipIndex}>00</span>
            <span className={styles.chipLabel}>All</span>
            <span className={styles.chipCount}>{categoryCounts.get("All") ?? 0}</span>
          </button>
          {GUIDE_CATEGORIES.map((c, index) => (
            <button
              key={c.key}
              ref={(node) => {
                tabRefs.current[index + 1] = node;
              }}
              className={styles.chip}
              data-active={cat === c.key ? "true" : undefined}
              data-tab-index={String(index + 1).padStart(2, "0")}
              role="tab"
              aria-selected={cat === c.key}
              tabIndex={cat === c.key ? 0 : -1}
              data-empty={(categoryCounts.get(c.key) ?? 0) === 0 ? "true" : undefined}
              onClick={() => setCat(c.key)}
              onKeyDown={(event) => handleCategoryKeyDown(event, index + 1)}
              title={c.description}
            >
              <span className={styles.chipIndex}>{String(index + 1).padStart(2, "0")}</span>
              <CategoryIcon category={c.key} size={12} />
              <span className={styles.chipLabel}>{c.key}</span>
              <span className={styles.chipCount}>{categoryCounts.get(c.key) ?? 0}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Body: pure content stream — the shell rail is the index */}
      <div
        role="region"
        aria-label="Guide list"
        className={styles.list}
        style={{ flex: 1, overflowY: "auto", padding: "0 0 24px" }}
      >
        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyEyebrow}>No methodology match</span>
            <strong>No guides match the current filter.</strong>
            <span>Clear the search or return to all domains to continue browsing the catalog.</span>
            <button
              type="button"
              className={styles.emptyAction}
              onClick={() => {
                setQ("");
                setCat("All");
              }}
            >
              Show all guides
            </button>
          </div>
        )}
        {filtered.map((g) => (
          <GuideCard key={g.id} guide={g} />
        ))}
      </div>
    </div>
  );
}

function FileTextStyled(): React.ReactElement {
  return <CategoryIcon category={undefined} size={14} />;
}
