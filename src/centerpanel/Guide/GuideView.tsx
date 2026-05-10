

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/guides.module.css";
import { MICRO_GUIDES } from "./microGuides";
import type { GuideCategory } from "./guideTypes";
import GuideCard from "./GuideCard";
import { useProjectRegistry } from "../registry/state";
import GuideCommandBar, { type Slot } from "./GuideCommandBar";
import { useScrollSpy } from "./useScrollSpy";
import { MAIN_SCROLL_ROOT_ID } from "../sections";



const GuideView: React.FC = () => {
  const { state } = useProjectRegistry();
  const [cat, setCat] = useState<GuideCategory | "All">("All");
  const [q, setQ] = useState("");
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");
  const [slot, setSlot] = useState<Slot>("plan");
  const [sort, setSort] = useState<"updated" | "alpha">("updated");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return MICRO_GUIDES.filter(g => {
      const byCat = cat === "All" || g.category === cat;
      const hay = `${g.title} ${g.abstract} ${(g.tags ?? []).join(" ")}`.toLowerCase();
      const bySearch = words.every(w => hay.includes(w));
      return byCat && bySearch;
    });
  }, [cat, q]);

  const listSorted = useMemo(() => {
    const arr = [...list];
    if (sort === "alpha") arr.sort((a, b) => a.title.localeCompare(b.title));
    else arr.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    return arr;
  }, [list, sort]);


  const rootEl = (typeof document !== "undefined" ? (document.getElementById(MAIN_SCROLL_ROOT_ID) as HTMLElement | null) : null);
  const active = useScrollSpy(listSorted.map(g => g.id), rootEl);


  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === "/") {
        e.preventDefault();
        (searchInputRef.current as any)?.focus?.();
      }
      if (e.key === "[") { e.preventDefault(); jumpPrev(); }
      if (e.key === "]") { e.preventDefault(); jumpNext(); }
      if (e.key >= "1" && e.key <= "4") {
        const map: Record<string, Slot> = { "1": "summary", "2": "plan", "3": "vitals", "4": "refs" };
        setSlot(map[e.key]);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);


  useEffect(() => {
    const onSetSort = (e: Event) => {
      const d = (e as CustomEvent).detail as { sort?: 'updated'|'alpha' } | undefined;
      if (!d?.sort) return;
      setSort(d.sort);
    };
    const onSetDensity = (e: Event) => {
      const d = (e as CustomEvent).detail as { density?: 'compact'|'comfortable' } | undefined;
      if (!d?.density) return;
      setDensity(d.density);
      document.documentElement.dataset["guideDensity"] = d.density;
    };
    const onSetSearch = (e: Event) => {
      const d = (e as CustomEvent).detail as { q?: string } | undefined;
      if (d && typeof d.q === 'string') setQ(d.q);
    };
    window.addEventListener('guide:setSort', onSetSort as EventListener);
    window.addEventListener('guide:setDensity', onSetDensity as EventListener);
    window.addEventListener('guide:setSearch', onSetSearch as EventListener);
    return () => {
      window.removeEventListener('guide:setSort', onSetSort as EventListener);
      window.removeEventListener('guide:setDensity', onSetDensity as EventListener);
      window.removeEventListener('guide:setSearch', onSetSearch as EventListener);
    };
  }, []);


  useEffect(() => {
    document.documentElement.dataset["guideSlot"] = slot;
    return () => {  };
  }, [slot]);


  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const update = () => {

      const mb = 8;
      const h = Math.ceil(el.getBoundingClientRect().height + mb);
      document.documentElement.style.setProperty("--guide-sticky-offset", `${h}px`);
    };
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);


  const cssEscape = (s: string) => {

    const CSSAny = (window as any).CSS;
    if (CSSAny && typeof CSSAny.escape === "function") return CSSAny.escape(s);
    return s.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  };

  function jumpTo(id: string) {
    const mainRoot = document.getElementById(MAIN_SCROLL_ROOT_ID) as HTMLElement | null;
    const region = mainRoot ?? undefined;
    if (!region) return;
    const el = document.querySelector(`[data-guide-id="${cssEscape(id)}"]`) as HTMLElement | null;
    if (!el) return;
    try {
      const root = mainRoot;
      if (!root) return el.scrollIntoView({ behavior: "smooth", block: "start" });
      const rootRect = root.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const top = root.scrollTop + (elRect.top - rootRect.top) - 8;
      root.scrollTo({ top, behavior: "smooth" });
    } catch {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function jumpPrev() {
    if (!active) return;
    const idx = listSorted.findIndex((g) => g.id === active);
    if (idx > 0) jumpTo(listSorted[idx - 1].id);
  }
  function jumpNext() {
    if (!active) return;
    const idx = listSorted.findIndex((g) => g.id === active);
    if (idx >= 0 && idx < listSorted.length - 1) jumpTo(listSorted[idx + 1].id);
  }

  function insertToSession(_slot: "summary"|"plan"|"vitals"|"refs", text: string) {
    const pid = state.selectedProjectId;
    if (!pid) {
      alert("Select a project in the Registry first.");
      return;
    }
    try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
  }

  function onQuickInsertFromParent(text: string) {
    const pid = state.selectedProjectId;
    if (!pid) {
      alert("Select a project in Registry.");
      return;
    }
    try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
  }








  const contextLine = useMemo(() => {
    const pid = state.selectedProjectId;
    if (!pid) return undefined;
    const p = state.projects.find((x) => x.id === pid);
    if (!p) return undefined;
    const parts = [
      p.name + (p.id ? ` • ${p.id}` : ""),
      [p.scale, `Priority ${p.priority}`, ...(p.tags ?? []).slice(0, 2)].filter(Boolean).join(" • "),
    ].filter(Boolean);
    return parts.join(" — ");
  }, [state.selectedProjectId, state.projects]);

  return (
      <div className={styles.rightCol}>
        <div ref={barRef} className={styles.stickyWrap}>
          <GuideCommandBar
          category={cat}
          setCategory={(v) => setCat(v as any)}
          search={q}
          setSearch={setQ}
          sort={sort}
          setSort={setSort}
          density={density}
          setDensity={setDensity}
          searchInputRef={searchInputRef}
          count={listSorted.length}
          contextLine={contextLine}
          />
        </div>

        <div className={`${styles.list} ${density === "compact" ? styles.compact : ""}`} role="region" aria-label="Guide list">
          {}
          <p id="riskChipTip" className={styles.srOnly}>
            Encodes analyst-estimated data quality level; documentation supports communication and is not a directive.
          </p>
          {listSorted.map((g) => (
            <div id={g.id} key={g.id}>
              <GuideCard
                g={g}
                density={density}
                onInsert={(s, text) => insertToSession(s, text)}
                parentSlot={slot}
                onQuickInsertFromParent={onQuickInsertFromParent}
              />
            </div>
          ))}
          {listSorted.length === 0 && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>No results</div>
              </div>
              <div className={styles.banner}>Try another category or search term.</div>
            </div>
          )}
        </div>
      </div>
  );
};

export default GuideView;
