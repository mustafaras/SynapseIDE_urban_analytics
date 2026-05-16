

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Plus } from "lucide-react";
import { buildSegments } from "./outlineHighlight";
import styles from "../styles/guides.module.css";
import { MAIN_SCROLL_ROOT_ID } from "../sections";
import { CategoryIcon } from "./categoryIcon";
import { type GuideRailState, subscribeGuideRailState } from "./guideRailBridge";

import noteStyles from "../styles/note.module.css";


type Item = { id: string; title: string; category: string; snippet?: string };


type Props = {
  items?: Item[];
  activeId?: string | null;
  onJump?: (id: string) => void;
  onQuickCopy?: (id: string) => void;
  onQuickInsert?: (id: string) => void;

  highlight?: string;
};


export default function OutlineRail({
  items,
  activeId,
  onJump,
  onQuickCopy,
  onQuickInsert,
  highlight = "",
}: Props) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const regionRef = useRef<HTMLElement | null>(null);
  const [autoItems, setAutoItems] = useState<Item[]>([]);
  const [syncedRail, setSyncedRail] = useState<GuideRailState | null>(null);
  const [autoActive, setAutoActive] = useState<string | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  useEffect(() => {
    return subscribeGuideRailState(setSyncedRail);
  }, []);

  useEffect(() => {
    if (items) return;
    let raf = 0;
    const init = () => {
      const region = document.querySelector('[role="region"][aria-label="Guide list"]') as HTMLElement | null;
      if (!region) { raf = requestAnimationFrame(init); return; }
      regionRef.current = region;
      const read = () => {

        const cards = Array.from(region.querySelectorAll('[data-guide-id]')) as HTMLElement[];
        const mapped = cards.map(el => {
          const id = el.getAttribute('data-guide-id') || '';
          const title = (el.querySelector('[data-guide-title]')?.textContent || '').trim();
          const cat = el.getAttribute('data-guide-cat') || '';
          const firstBlock = el.querySelector(`.${styles.block}`) as HTMLElement | null;
          const snippet = (firstBlock?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 110);
          return { id, title, category: cat, snippet } as Item;
        });

        const seen = new Set<string>();
        const uniq: Item[] = [];
        for (const it of mapped) { if (!seen.has(it.id)) { seen.add(it.id); uniq.push(it); } }
        setAutoItems(uniq);
        if (ioRef.current) {
          ioRef.current.disconnect();
          Array.from(region.querySelectorAll('[data-guide-id]')).forEach(el => ioRef.current?.observe(el));
        }
      };
      read();
      const rootEl = (document.getElementById(MAIN_SCROLL_ROOT_ID) as HTMLElement | null) ?? region;
      ioRef.current?.disconnect();
      ioRef.current = new IntersectionObserver((entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0]?.target as HTMLElement | undefined;
        if (top) setAutoActive(top.getAttribute('data-guide-id'));
      }, { root: rootEl, threshold: 0.25 });
      Array.from(region.querySelectorAll('[data-guide-id]')).forEach(el => ioRef.current?.observe(el));
    };
    raf = requestAnimationFrame(init);
    return () => { cancelAnimationFrame(raf); ioRef.current?.disconnect(); };
  }, [items]);

  const list = items ?? syncedRail?.items ?? autoItems;
  const active = activeId ?? autoActive;
  const railMode = items ? "Custom" : syncedRail?.mode ?? "All";
  const railQuery = items ? highlight : syncedRail?.query ?? highlight;

  const cssEscape = (s: string) => {

    const CSSAny = (window as any).CSS;
    if (CSSAny && typeof CSSAny.escape === 'function') return CSSAny.escape(s);
    return s.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  };

  function defaultJump(id: string) {
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

  function collectBundle(id: string) {
    const el = document.querySelector(`[data-guide-id="${cssEscape(id)}"]`) as HTMLElement | null;
    if (!el) return "";

    const blocks = Array.from(el.querySelectorAll(`.${styles.block}`)) as HTMLElement[];
    const text = blocks.map(b => b.textContent || "").join("\n\n").trim();
    return text;
  }

  function defaultCopy(id: string) {
    const t = collectBundle(id);
    if (t) navigator.clipboard.writeText(t);
  }

  function defaultInsert(id: string) {
    const t = collectBundle(id);
    if (!t) return;
    navigator.clipboard.writeText(t);
  }

  const doJump = onJump ?? defaultJump;
  const doCopy = onQuickCopy ?? defaultCopy;
  const doInsert = onQuickInsert ?? defaultInsert;


  type RowItem = Item & { keyword: string; __type: "item" };
  type RowSep = { __type: "sep"; category: string };
  type Row = RowItem | RowSep;

  const itemsWithKeywords: RowItem[] = useMemo(() => {
    return list.map((it) => {
      const raw = it.title.includes("—") ? it.title.split("—")[0] : it.title;
      const keyword = (raw || it.title).trim();
      return { ...it, keyword, __type: "item" } as RowItem;
    });
  }, [list]);


  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    let lastCat = "";
    for (const it of itemsWithKeywords) {
      const cat = it.category || "";
      if (railMode === "All" && cat && cat !== lastCat) { out.push({ __type: "sep", category: cat }); lastCat = cat; }
      out.push(it);
    }
    return out;
  }, [itemsWithKeywords, railMode]);

  const itemRows = useMemo(() => rows.filter(r => (r as any).__type === "item") as RowItem[], [rows]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of itemRows) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return counts;
  }, [itemRows]);


  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (!el.contains(document.activeElement)) return;
      const max = itemRows.length - 1;
      if (e.key === "ArrowDown") { e.preventDefault(); setFocusIndex((i) => Math.min(i + 1, max)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === "PageDown")  { e.preventDefault(); setFocusIndex((i) => Math.min(i + 6, max)); }
      if (e.key === "PageUp")    { e.preventDefault(); setFocusIndex((i) => Math.max(i - 6, 0)); }
      if (e.key === "Home")      { e.preventDefault(); setFocusIndex(0); }
      if (e.key === "End")       { e.preventDefault(); setFocusIndex(max); }
      if (e.key === "Enter" && focusIndex >= 0) { e.preventDefault(); doJump(itemRows[focusIndex].id); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [itemRows, focusIndex, doJump]);

  useEffect(() => { setFocusIndex(-1); }, [itemRows.length]);


  useEffect(() => {
    const root = railRef.current;
    if (!root || !active) return;
    const target = root.querySelector(`[data-rail-id="${cssEscape(active)}"]`) as HTMLElement | null;
    if (target) target.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    const root = railRef.current;
    if (!root) return;
    if (focusIndex < 0 || focusIndex >= itemRows.length) return;
    const id = itemRows[focusIndex]?.id;
    if (!id) return;
    const target = root.querySelector(`[data-rail-id="${cssEscape(id)}"]`) as HTMLElement | null;
    if (target) target.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusIndex, itemRows]);

  return (
    <div ref={railRef as any} className={styles.rail} aria-label="Guide keywords" role="listbox">
      <div className={styles.railHeader} aria-level={2}>
        <span className={styles.railHeaderTitle}>Index</span>
        <span className={styles.railHeaderCount}>{itemRows.length}</span>
      </div>
      <div className={styles.railScopeBar} data-mode={railMode === "All" ? "all" : "scoped"}>
        <span className={styles.railScopeKicker}>{railMode === "All" ? "Catalog" : "Scoped tab"}</span>
        <span className={styles.railScopeValue}>{railMode === "All" ? "All method guides" : railMode}</span>
        <span className={styles.railScopeMeta}>
          {railQuery ? `Search: ${railQuery}` : `${itemRows.length} visible`}
        </span>
      </div>
      {itemRows.length === 0 && (
        <div className={styles.railEmpty}>No index entries match the active Methods filter.</div>
      )}
      {rows.map((row, i) => {
        if ((row as RowSep).__type === "sep") {
          const sep = row as RowSep;
          return (
            <div key={`sep-${i}`} className={styles.railSep} role="separator" aria-label={sep.category}>
              <span>{sep.category}</span>
              <span className={styles.railSepCount}>{categoryCounts.get(sep.category) ?? 0}</span>
            </div>
          );
        }
        const it = row as RowItem;
        const idx = itemRows.findIndex(r => r.id === it.id);
        const isActive = active === it.id;
        return (
          <div
            key={it.id}
            className={styles.railRow}
            data-active={isActive ? "true" : "false"}
            tabIndex={0}
            role="option"
            aria-selected={isActive}
            aria-current={active === it.id ? "true" : undefined}
            data-rail-id={it.id}
            title={`${it.category} • ${it.title}`}
            onClick={() => doJump(it.id)}
            onFocus={() => setFocusIndex(idx)}
          >
            <div className={styles.railAccent} />
            <div className={styles.railKey} style={{ display: "inline-flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
              <span className={styles.railOrdinal}>{String(idx + 1).padStart(2, "0")}</span>
              <CategoryIcon category={it.category} size={12} />
              <span className={styles.railKeyInner}>
                {buildSegments(it.keyword, railQuery).map((s, j) => s.hi ? (
                  <span key={j} className={styles.hl}>{s.text}</span>
                ) : (
                  <span key={j}>{s.text}</span>
                ))}
              </span>
            </div>
            <div className={styles.railQuick}>
              <button
                className={`${styles.railBtn} ${noteStyles.btnSm ?? ""}`}
                title="Copy"
                aria-label={`Copy ${it.title}`}
                onClick={(e) => { e.stopPropagation(); doCopy(it.id); }}
              >
                <Copy size={12} />
                <span className={styles.srOnly}>Copy</span>
              </button>
              <button
                className={`${styles.railBtn} ${noteStyles.btnSm ?? ""}`}
                title="Insert"
                aria-label={`Insert ${it.title}`}
                onClick={(e) => { e.stopPropagation(); doInsert(it.id); }}
              >
                <Plus size={12} />
                <span className={styles.srOnly}>Insert</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
