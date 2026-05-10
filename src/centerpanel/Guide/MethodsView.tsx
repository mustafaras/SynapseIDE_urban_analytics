/**
 * MethodsView — Urban methodology guide viewer.
 *
 * Left index sidebar with category filter + search, right scrollable
 * content pane rendering the selected MethodologyGuide.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import styles from "../styles/guides.module.css";
import {
  GUIDE_CATEGORIES,
  type GuideCategory,
  METHODOLOGY_GUIDES,
  type MethodologyGuide,
} from "./guideContent";
import OutlineRail from "./OutlineRail";
import { MAIN_SCROLL_ROOT_ID } from "../sections";

/* ------------------------------------------------------------------ */
/*  Section keys rendered per guide                                    */
/* ------------------------------------------------------------------ */

const SECTION_KEYS: {
  key: keyof MethodologyGuide;
  label: string;
}[] = [
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

/* ------------------------------------------------------------------ */
/*  Helper: render a section value                                     */
/* ------------------------------------------------------------------ */

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
          <li key={i} className={styles.block} style={{ border: "none", padding: "2px 0", borderRadius: 0, background: "transparent" }}>
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return <div className={styles.block}>{val as string}</div>;
}

/* ------------------------------------------------------------------ */
/*  Guide card                                                         */
/* ------------------------------------------------------------------ */

function GuideCard({ guide }: { guide: MethodologyGuide }) {
  const catMeta = GUIDE_CATEGORIES.find((c) => c.key === guide.category);
  return (
    <article className={styles.card} data-guide-id={guide.id} data-guide-cat={guide.category}>
      <header className={styles.cardHeader}>
        <span className={styles.cardTitle} data-guide-title>
          {catMeta?.icon ?? ""} {guide.title}
        </span>
        <span className={styles.cardSub}>{guide.category}</span>
      </header>
      {SECTION_KEYS.map(({ key, label }) => {
        const val = guide[key];
        if (val == null || (Array.isArray(val) && val.length === 0)) return null;
        return (
          <section key={key} className={styles.section} style={{ display: "block" }}>
            <div className={styles.summaryRow} style={{ cursor: "default" }}>
              <span className={styles.sectionTitle}>{label}</span>
            </div>
            <div style={{ padding: "4px 12px 10px" }}>
              <SectionBlock guide={guide} sKey={key} />
            </div>
          </section>
        );
      })}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function MethodsView() {
  const [cat, setCat] = useState<GuideCategory | "All">("All");
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  /* ---- filter ---- */
  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return METHODOLOGY_GUIDES.filter((g) => {
      if (cat !== "All" && g.category !== cat) return false;
      if (!words.length) return true;
      const hay = `${g.title} ${g.abstract} ${g.category} ${g.relatedIndicators.join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [cat, q]);

  /* ---- rail items for OutlineRail ---- */
  const railItems = useMemo(
    () =>
      filtered.map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category,
      })),
    [filtered],
  );

  /* ---- jump handler ---- */
  const handleJump = useCallback((id: string) => {
    const root = document.getElementById(MAIN_SCROLL_ROOT_ID) as HTMLElement | null;
    const el = document.querySelector(`[data-guide-id="${id}"]`) as HTMLElement | null;
    if (!el) return;
    if (root) {
      const rr = root.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      root.scrollTo({ top: root.scrollTop + (er.top - rr.top) - 8, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className={styles.page}>
      {/* ---- Header bar ---- */}
      <header className={styles.topHeader}>
        <span className={styles.topTitle}>Methodology Guides</span>

        <div className={styles.topControls}>
          <input
            ref={searchRef}
            className={styles.searchInput}
            placeholder="Search guides…  (/)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className={styles.chips}>
          <button
            className={styles.chip}
            data-active={cat === "All" ? "true" : undefined}
            onClick={() => setCat("All")}
          >
            All
          </button>
          {GUIDE_CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={styles.chip}
              data-active={cat === c.key ? "true" : undefined}
              onClick={() => setCat(c.key)}
              title={c.description}
            >
              {c.icon} {c.key}
            </button>
          ))}
        </div>
      </header>

      {/* ---- Body: rail + content ---- */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 0 }}>
        <OutlineRail
          items={railItems}
          onJump={handleJump}
          highlight={q}
        />

        <div
          role="region"
          aria-label="Guide list"
          className={styles.list}
          style={{ flex: 1, overflowY: "auto", padding: "0 8px 24px" }}
        >
          {filtered.length === 0 && (
            <div className={styles.banner}>
              No guides match the current filter.
            </div>
          )}
          {filtered.map((g) => (
            <GuideCard key={g.id} guide={g} />
          ))}
        </div>
      </div>
    </div>
  );
}
