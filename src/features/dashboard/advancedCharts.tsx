import React, { useId, useRef, useState } from "react";

export type AdvancedChartType =
  | "parallel_coordinates"
  | "radar"
  | "sankey"
  | "treemap"
  | "violin"
  | "beeswarm"
  | "small_multiples"
  | "cartogram"
  | "dot_density"
  | "sparkline_grid"
  | "waffle"
  | "slope"
  | "lollipop"
  | "box_whisker_map";

export type AdvancedChartFamily =
  | "multivariate"
  | "distribution"
  | "flow_composition"
  | "spatial"
  | "temporal"
  | "ranking";

export interface AdvancedChartMeta {
  type: AdvancedChartType;
  label: string;
  family: AdvancedChartFamily;
  familyLabel: string;
  description: string;
  dataShape: string;
}

export const ADVANCED_CHART_META: AdvancedChartMeta[] = [
  {
    type: "parallel_coordinates",
    label: "Parallel Coordinates",
    family: "multivariate",
    familyLabel: "Multivariate",
    description: "Compare many indicators across districts on shared normalized axes.",
    dataShape: "{ dimensions: string[]; records: Array<{ label, values: number[] }> }",
  },
  {
    type: "radar",
    label: "Radar Chart",
    family: "multivariate",
    familyLabel: "Multivariate",
    description: "Polar profile of 3-8 indicators for a handful of entities.",
    dataShape: "{ axes: string[]; series: Array<{ label, values: number[] }> }",
  },
  {
    type: "sankey",
    label: "Sankey Diagram",
    family: "flow_composition",
    familyLabel: "Flow / Composition",
    description: "Flows between origin and destination categories with weighted links.",
    dataShape: "{ nodes: Array<{ id, label }>; links: Array<{ source, target, value }> }",
  },
  {
    type: "treemap",
    label: "Treemap",
    family: "flow_composition",
    familyLabel: "Flow / Composition",
    description: "Nested rectangles sized by share of the whole.",
    dataShape: "{ items: Array<{ label, value, group? }> }",
  },
  {
    type: "violin",
    label: "Violin Plot",
    family: "distribution",
    familyLabel: "Distribution",
    description: "Density-shaped distribution for groups of observations.",
    dataShape: "{ groups: Array<{ label, samples: number[] }> }",
  },
  {
    type: "beeswarm",
    label: "Beeswarm Plot",
    family: "distribution",
    familyLabel: "Distribution",
    description: "Dot-level distribution that preserves every observation.",
    dataShape: "{ groups: Array<{ label, samples: number[] }> }",
  },
  {
    type: "small_multiples",
    label: "Small Multiples",
    family: "temporal",
    familyLabel: "Temporal",
    description: "Grid of same-axis mini charts for side-by-side comparison.",
    dataShape: "{ series: Array<{ label, points: number[] }> }",
  },
  {
    type: "cartogram",
    label: "Cartogram",
    family: "spatial",
    familyLabel: "Spatial",
    description: "Area-distorted map where size encodes the measured variable.",
    dataShape: "{ areas: Array<{ id, label, value, x?, y? }> }",
  },
  {
    type: "dot_density",
    label: "Dot Density Map",
    family: "spatial",
    familyLabel: "Spatial",
    description: "One dot per N observations scattered within each area.",
    dataShape: "{ areas: Array<{ id, label, count, x, y, w, h }> }",
  },
  {
    type: "sparkline_grid",
    label: "Sparkline Grid",
    family: "temporal",
    familyLabel: "Temporal",
    description: "Compact grid of micro-trends for dense monitoring dashboards.",
    dataShape: "{ series: Array<{ label, points: number[], value?: string }> }",
  },
  {
    type: "waffle",
    label: "Waffle Chart",
    family: "flow_composition",
    familyLabel: "Flow / Composition",
    description: "10x10 grid showing parts-of-whole as filled cells.",
    dataShape: "{ categories: Array<{ label, share: number }> }",
  },
  {
    type: "slope",
    label: "Slope Chart",
    family: "ranking",
    familyLabel: "Ranking",
    description: "Two-point before/after comparison for many entities.",
    dataShape: "{ items: Array<{ label, before: number, after: number }> }",
  },
  {
    type: "lollipop",
    label: "Lollipop Chart",
    family: "ranking",
    familyLabel: "Ranking",
    description: "Ranked categorical values drawn as line + dot.",
    dataShape: "{ items: Array<{ label, value: number }> }",
  },
  {
    type: "box_whisker_map",
    label: "Box-and-Whisker Map",
    family: "spatial",
    familyLabel: "Spatial",
    description: "Spatially indexed boxplots summarizing distribution per area.",
    dataShape: "{ areas: Array<{ id, label, min, q1, median, q3, max }> }",
  },
];

export const ADVANCED_CHART_FAMILY_ORDER: AdvancedChartFamily[] = [
  "multivariate",
  "distribution",
  "flow_composition",
  "spatial",
  "temporal",
  "ranking",
];

export function getAdvancedChartMeta(type: AdvancedChartType): AdvancedChartMeta {
  return ADVANCED_CHART_META.find((meta) => meta.type === type) ?? ADVANCED_CHART_META[0]!;
}

// ---------- Data contracts ----------

export interface ParallelCoordinatesData {
  dimensions: string[];
  records: Array<{ label: string; values: number[] }>;
}
export interface RadarData {
  axes: string[];
  series: Array<{ label: string; values: number[] }>;
}
export interface SankeyNode { id: string; label: string }
export interface SankeyLink { source: string; target: string; value: number }
export interface SankeyData { nodes: SankeyNode[]; links: SankeyLink[] }
export interface TreemapData { items: Array<{ label: string; value: number; group?: string }> }
export interface DistributionData { groups: Array<{ label: string; samples: number[] }> }
export interface SmallMultiplesData { series: Array<{ label: string; points: number[] }> }
export interface CartogramData { areas: Array<{ id: string; label: string; value: number; x?: number; y?: number }> }
export interface DotDensityData { areas: Array<{ id: string; label: string; count: number; x: number; y: number; w: number; h: number }> }
export interface SparklineGridData { series: Array<{ label: string; points: number[]; value?: string }> }
export interface WaffleData { categories: Array<{ label: string; share: number }> }
export interface SlopeData { items: Array<{ label: string; before: number; after: number }> }
export interface LollipopData { items: Array<{ label: string; value: number }> }
export interface BoxWhiskerMapData { areas: Array<{ id: string; label: string; min: number; q1: number; median: number; q3: number; max: number }> }

export type AdvancedChartData =
  | ParallelCoordinatesData
  | RadarData
  | SankeyData
  | TreemapData
  | DistributionData
  | SmallMultiplesData
  | CartogramData
  | DotDensityData
  | SparklineGridData
  | WaffleData
  | SlopeData
  | LollipopData
  | BoxWhiskerMapData;

// ---------- Sample data ----------

const DISTRICT_LABELS = ["Central Core", "East Works", "Harbour", "Northgate", "West Ridge", "Southfield"];
const PALETTE = ["#f59e0b", "#38bdf8", "#a78bfa", "#34d399", "#f472b6", "#fbbf24"];

export const ADVANCED_CHART_SAMPLES: Record<AdvancedChartType, AdvancedChartData> = {
  parallel_coordinates: {
    dimensions: ["Transit", "Green", "Jobs", "Housing", "Air"],
    records: [
      { label: "Central Core", values: [92, 38, 210, 62, 58] },
      { label: "East Works", values: [61, 24, 80, 48, 71] },
      { label: "Harbour", values: [74, 55, 120, 51, 44] },
      { label: "Northgate", values: [68, 48, 95, 55, 52] },
      { label: "West Ridge", values: [82, 60, 140, 66, 47] },
    ],
  },
  radar: {
    axes: ["Transit", "Green", "Jobs", "Housing", "Air", "Safety"],
    series: [
      { label: "Central Core", values: [92, 38, 95, 62, 58, 74] },
      { label: "East Works", values: [61, 24, 40, 48, 71, 56] },
      { label: "Harbour", values: [74, 55, 70, 51, 44, 68] },
    ],
  },
  sankey: {
    nodes: [
      { id: "s1", label: "Housing" },
      { id: "s2", label: "Transport" },
      { id: "s3", label: "Utilities" },
      { id: "t1", label: "Central" },
      { id: "t2", label: "East" },
      { id: "t3", label: "Harbour" },
    ],
    links: [
      { source: "s1", target: "t1", value: 32 },
      { source: "s1", target: "t2", value: 18 },
      { source: "s2", target: "t1", value: 28 },
      { source: "s2", target: "t3", value: 21 },
      { source: "s3", target: "t2", value: 14 },
      { source: "s3", target: "t3", value: 19 },
    ],
  },
  treemap: {
    items: [
      { label: "Residential", value: 42, group: "Land Use" },
      { label: "Commercial", value: 18, group: "Land Use" },
      { label: "Industrial", value: 12, group: "Land Use" },
      { label: "Green", value: 10, group: "Land Use" },
      { label: "Transport", value: 9, group: "Land Use" },
      { label: "Mixed", value: 6, group: "Land Use" },
      { label: "Civic", value: 3, group: "Land Use" },
    ],
  },
  violin: {
    groups: DISTRICT_LABELS.slice(0, 4).map((label, index) => ({
      label,
      samples: Array.from({ length: 40 }, (_, i) => 50 + index * 6 + 18 * Math.sin(i / 4 + index) + (i % 3) * 3),
    })),
  },
  beeswarm: {
    groups: DISTRICT_LABELS.slice(0, 4).map((label, index) => ({
      label,
      samples: Array.from({ length: 22 }, (_, i) => 45 + index * 7 + 14 * Math.sin(i * 0.8 + index) + (i % 5) * 2),
    })),
  },
  small_multiples: {
    series: DISTRICT_LABELS.map((label, index) => ({
      label,
      points: Array.from({ length: 12 }, (_, i) => 40 + index * 4 + 18 * Math.sin(i / 2 + index)),
    })),
  },
  cartogram: {
    areas: [
      { id: "a1", label: "Central", value: 92, x: 1, y: 1 },
      { id: "a2", label: "East", value: 61, x: 2, y: 1 },
      { id: "a3", label: "Harbour", value: 74, x: 0, y: 2 },
      { id: "a4", label: "Northgate", value: 55, x: 1, y: 0 },
      { id: "a5", label: "West", value: 82, x: 0, y: 1 },
      { id: "a6", label: "South", value: 48, x: 1, y: 2 },
    ],
  },
  dot_density: {
    areas: [
      { id: "d1", label: "Central", count: 180, x: 0.40, y: 0.35, w: 0.28, h: 0.30 },
      { id: "d2", label: "East", count: 90, x: 0.70, y: 0.30, w: 0.25, h: 0.35 },
      { id: "d3", label: "Harbour", count: 120, x: 0.05, y: 0.55, w: 0.32, h: 0.30 },
      { id: "d4", label: "North", count: 60, x: 0.35, y: 0.05, w: 0.30, h: 0.25 },
    ],
  },
  sparkline_grid: {
    series: DISTRICT_LABELS.map((label, index) => ({
      label,
      value: `${48 + index * 5}%`,
      points: Array.from({ length: 16 }, (_, i) => 30 + index * 3 + 12 * Math.sin(i / 2 + index)),
    })),
  },
  waffle: {
    categories: [
      { label: "Transit Access", share: 42 },
      { label: "Walkable", share: 28 },
      { label: "Car-dependent", share: 22 },
      { label: "Underserved", share: 8 },
    ],
  },
  slope: {
    items: [
      { label: "Central Core", before: 62, after: 71 },
      { label: "East Works", before: 38, after: 46 },
      { label: "Harbour", before: 55, after: 52 },
      { label: "Northgate", before: 49, after: 58 },
      { label: "West Ridge", before: 67, after: 74 },
    ],
  },
  lollipop: {
    items: [
      { label: "West Ridge", value: 82 },
      { label: "Central Core", value: 78 },
      { label: "Harbour", value: 71 },
      { label: "Northgate", value: 64 },
      { label: "Southfield", value: 52 },
      { label: "East Works", value: 46 },
    ],
  },
  box_whisker_map: {
    areas: [
      { id: "b1", label: "Central", min: 28, q1: 42, median: 55, q3: 68, max: 82 },
      { id: "b2", label: "East", min: 18, q1: 28, median: 38, q3: 51, max: 66 },
      { id: "b3", label: "Harbour", min: 22, q1: 34, median: 48, q3: 60, max: 74 },
      { id: "b4", label: "North", min: 26, q1: 36, median: 46, q3: 58, max: 72 },
    ],
  },
};

// ---------- Rendering helpers ----------

interface TooltipState {
  x: number;
  y: number;
  content: React.ReactNode;
}

export interface AdvancedChartRenderOptions {
  accent?: string;
  showLegend?: boolean;
  compact?: boolean;
}

const DEFAULT_VIEWBOX = { w: 480, h: 260 };

function axisLabel(text: string, x: number, y: number, anchor: "start" | "middle" | "end" = "middle") {
  return (
    <text x={x} y={y} fill="#94a3b8" fontSize={10} textAnchor={anchor}>
      {text}
    </text>
  );
}

// ---------- Individual chart renderers ----------

function ParallelCoordinates({ data, accent, onHover }: { data: ParallelCoordinatesData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const padX = 44;
  const padY = 34;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const axes = data.dimensions;
  const stepX = axes.length > 1 ? innerW / (axes.length - 1) : innerW;
  const mins = axes.map((_, i) => Math.min(...data.records.map((r) => r.values[i] ?? 0)));
  const maxs = axes.map((_, i) => Math.max(...data.records.map((r) => r.values[i] ?? 1)));
  const norm = (v: number, i: number) => {
    const range = Math.max(1e-6, maxs[i]! - mins[i]!);
    return 1 - (v - mins[i]!) / range;
  };
  return (
    <>
      {axes.map((axis, i) => {
        const x = padX + i * stepX;
        return (
          <g key={`axis-${axis}`}>
            <line x1={x} y1={padY} x2={x} y2={padY + innerH} stroke="rgba(148,163,184,0.3)" strokeWidth={1} />
            {axisLabel(axis, x, padY - 10)}
            {axisLabel(String(Math.round(maxs[i]!)), x - 4, padY + 4, "end")}
            {axisLabel(String(Math.round(mins[i]!)), x - 4, padY + innerH, "end")}
          </g>
        );
      })}
      {data.records.map((record, idx) => {
        const color = PALETTE[idx % PALETTE.length] ?? accent;
        const path = record.values
          .map((v, i) => `${i === 0 ? "M" : "L"} ${padX + i * stepX} ${padY + norm(v, i) * innerH}`)
          .join(" ");
        return (
          <path
            key={record.label}
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.85}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${record.label}: ${record.values.map((v, i) => `${axes[i]} ${v}`).join(" · ")}` })}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
    </>
  );
}

function Radar({ data, onHover }: { data: RadarData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const cx = w / 2;
  const cy = h / 2 + 6;
  const r = Math.min(w, h) / 2 - 40;
  const n = data.axes.length;
  const max = Math.max(...data.series.flatMap((s) => s.values), 1);
  const angle = (i: number) => (-Math.PI / 2) + (i * 2 * Math.PI) / n;
  return (
    <>
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <polygon
          key={t}
          fill="rgba(148,163,184,0.04)"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth={1}
          points={data.axes.map((_, i) => {
            const a = angle(i);
            return `${cx + Math.cos(a) * r * t},${cy + Math.sin(a) * r * t}`;
          }).join(" ")}
        />
      ))}
      {data.axes.map((axis, i) => {
        const a = angle(i);
        const x = cx + Math.cos(a) * (r + 14);
        const y = cy + Math.sin(a) * (r + 14);
        return (
          <g key={axis}>
            <line x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="rgba(148,163,184,0.25)" />
            {axisLabel(axis, x, y)}
          </g>
        );
      })}
      {data.series.map((s, idx) => {
        const color = PALETTE[idx % PALETTE.length]!;
        const points = s.values.map((v, i) => {
          const a = angle(i);
          const rr = (v / max) * r;
          return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
        }).join(" ");
        return (
          <polygon
            key={s.label}
            points={points}
            fill={color}
            fillOpacity={0.18}
            stroke={color}
            strokeWidth={2}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${s.label}: ${s.values.join(" · ")}` })}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
    </>
  );
}

function Sankey({ data, onHover }: { data: SankeyData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const padY = 22;
  const padX = 14;
  const sources = data.nodes.filter((n) => data.links.some((l) => l.source === n.id));
  const targets = data.nodes.filter((n) => data.links.some((l) => l.target === n.id));
  const colX = [padX + 10, w - padX - 10 - 96];
  const nodeW = 96;

  const sourceTotals = new Map(sources.map((n) => [n.id, data.links.filter((l) => l.source === n.id).reduce((a, l) => a + l.value, 0)]));
  const targetTotals = new Map(targets.map((n) => [n.id, data.links.filter((l) => l.target === n.id).reduce((a, l) => a + l.value, 0)]));
  const totalSrc = Array.from(sourceTotals.values()).reduce((a, v) => a + v, 0) || 1;
  const totalTgt = Array.from(targetTotals.values()).reduce((a, v) => a + v, 0) || 1;

  const srcPos = new Map<string, { y: number; h: number }>();
  let cursor = padY;
  sources.forEach((n) => {
    const hH = ((sourceTotals.get(n.id) ?? 0) / totalSrc) * (h - padY * 2 - (sources.length - 1) * 6);
    srcPos.set(n.id, { y: cursor, h: hH });
    cursor += hH + 6;
  });
  const tgtPos = new Map<string, { y: number; h: number }>();
  cursor = padY;
  targets.forEach((n) => {
    const hH = ((targetTotals.get(n.id) ?? 0) / totalTgt) * (h - padY * 2 - (targets.length - 1) * 6);
    tgtPos.set(n.id, { y: cursor, h: hH });
    cursor += hH + 6;
  });

  const srcOffsets = new Map<string, number>(sources.map((n) => [n.id, 0]));
  const tgtOffsets = new Map<string, number>(targets.map((n) => [n.id, 0]));

  return (
    <>
      {data.links.map((link, idx) => {
        const sp = srcPos.get(link.source);
        const tp = tgtPos.get(link.target);
        if (!sp || !tp) return null;
        const totalSource = sourceTotals.get(link.source) || 1;
        const totalTarget = targetTotals.get(link.target) || 1;
        const sH = (link.value / totalSource) * sp.h;
        const tH = (link.value / totalTarget) * tp.h;
        const sy = sp.y + (srcOffsets.get(link.source) ?? 0);
        const ty = tp.y + (tgtOffsets.get(link.target) ?? 0);
        srcOffsets.set(link.source, (srcOffsets.get(link.source) ?? 0) + sH);
        tgtOffsets.set(link.target, (tgtOffsets.get(link.target) ?? 0) + tH);
        const x1 = colX[0]! + nodeW;
        const x2 = colX[1]!;
        const midX = (x1 + x2) / 2;
        const path = `M ${x1} ${sy + sH / 2} C ${midX} ${sy + sH / 2}, ${midX} ${ty + tH / 2}, ${x2} ${ty + tH / 2}`;
        const color = PALETTE[idx % PALETTE.length]!;
        return (
          <path
            key={`${link.source}-${link.target}`}
            d={path}
            fill="none"
            stroke={color}
            strokeOpacity={0.5}
            strokeWidth={Math.max(2, Math.min(sH, tH))}
            onMouseEnter={(e) => {
              const src = data.nodes.find((n) => n.id === link.source)?.label ?? link.source;
              const tgt = data.nodes.find((n) => n.id === link.target)?.label ?? link.target;
              onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${src} → ${tgt}: ${link.value}` });
            }}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
      {sources.map((n) => {
        const p = srcPos.get(n.id)!;
        return (
          <g key={n.id}>
            <rect x={colX[0]} y={p.y} width={nodeW} height={p.h} rx={4} fill="#1e293b" stroke="rgba(148,163,184,0.4)" />
            <text x={colX[0]! + 6} y={p.y + p.h / 2 + 4} fill="#e2e8f0" fontSize={11}>{n.label}</text>
          </g>
        );
      })}
      {targets.map((n) => {
        const p = tgtPos.get(n.id)!;
        return (
          <g key={n.id}>
            <rect x={colX[1]} y={p.y} width={nodeW} height={p.h} rx={4} fill="#1e293b" stroke="rgba(148,163,184,0.4)" />
            <text x={colX[1]! + 6} y={p.y + p.h / 2 + 4} fill="#e2e8f0" fontSize={11}>{n.label}</text>
          </g>
        );
      })}
    </>
  );
}

function Treemap({ data, accent, onHover }: { data: TreemapData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  // Simple squarified-ish: use slice-and-dice.
  const total = data.items.reduce((a, it) => a + it.value, 0) || 1;
  let x = 0;
  const y = 0;
  let rowY = 0;
  type TreemapItem = TreemapData["items"][number];
  const rects: Array<{ x: number; y: number; w: number; h: number; item: TreemapItem; color: string }> = [];
  const rows: TreemapItem[][] = [];
  let current: TreemapItem[] = [];
  let rowSum = 0;
  const targetRow = total / 3;
  data.items.forEach((it) => {
    current.push(it);
    rowSum += it.value;
    if (rowSum >= targetRow) {
      rows.push(current);
      current = [];
      rowSum = 0;
    }
  });
  if (current.length) rows.push(current);
  rows.forEach((row, rowIdx) => {
    const rowTotal = row.reduce((a, it) => a + it.value, 0) || 1;
    const rowH = (rowTotal / total) * h;
    x = 0;
    row.forEach((it, idx) => {
      const rectW = (it.value / rowTotal) * w;
      rects.push({
        x,
        y: rowY,
        w: rectW,
        h: rowH,
        item: it,
        color: PALETTE[(rowIdx * 3 + idx) % PALETTE.length]!,
      });
      x += rectW;
    });
    rowY += rowH;
  });
  void accent; void y;
  return (
    <>
      {rects.map((r) => (
        <g
          key={r.item.label}
          onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${r.item.label}: ${r.item.value} (${Math.round((r.item.value / total) * 100)}%)` })}
          onMouseLeave={() => onHover(null)}
        >
          <rect x={r.x + 1} y={r.y + 1} width={Math.max(0, r.w - 2)} height={Math.max(0, r.h - 2)} fill={r.color} fillOpacity={0.85} rx={4} />
          {r.w > 54 && r.h > 22 ? (
            <text x={r.x + 8} y={r.y + 18} fill="#0f172a" fontSize={11} fontWeight={600}>{r.item.label}</text>
          ) : null}
          {r.w > 54 && r.h > 38 ? (
            <text x={r.x + 8} y={r.y + 34} fill="#0f172a" fontSize={10}>{r.item.value}</text>
          ) : null}
        </g>
      ))}
    </>
  );
}

function Violin({ data, accent, onHover }: { data: DistributionData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const padX = 40;
  const padY = 28;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const all = data.groups.flatMap((g) => g.samples);
  const minV = Math.min(...all);
  const maxV = Math.max(...all);
  const step = innerW / data.groups.length;
  const bins = 10;
  return (
    <>
      <line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="rgba(148,163,184,0.35)" />
      {data.groups.map((g, gi) => {
        const cx = padX + step * (gi + 0.5);
        const hist = new Array(bins).fill(0);
        g.samples.forEach((s) => {
          const t = (s - minV) / Math.max(1e-6, maxV - minV);
          const b = Math.min(bins - 1, Math.floor(t * bins));
          hist[b]! += 1;
        });
        const peak = Math.max(...hist, 1);
        const maxHalf = Math.min(step * 0.45, 42);
        const points: string[] = [];
        hist.forEach((c, i) => {
          const y = padY + innerH - ((i + 0.5) / bins) * innerH;
          const half = (c / peak) * maxHalf;
          points.push(`${cx - half},${y}`);
        });
        for (let i = hist.length - 1; i >= 0; i--) {
          const y = padY + innerH - ((i + 0.5) / bins) * innerH;
          const half = (hist[i]! / peak) * maxHalf;
          points.push(`${cx + half},${y}`);
        }
        const sorted = [...g.samples].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)]!;
        const medianY = padY + innerH - ((median - minV) / Math.max(1e-6, maxV - minV)) * innerH;
        const color = PALETTE[gi % PALETTE.length]!;
        return (
          <g
            key={g.label}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${g.label} · n=${g.samples.length} · median ${median.toFixed(1)}` })}
            onMouseLeave={() => onHover(null)}
          >
            <polygon points={points.join(" ")} fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
            <line x1={cx - maxHalf} y1={medianY} x2={cx + maxHalf} y2={medianY} stroke="#fff" strokeWidth={1.5} />
            {axisLabel(g.label, cx, padY + innerH + 16)}
          </g>
        );
      })}
      {axisLabel(String(Math.round(minV)), padX - 6, padY + innerH, "end")}
      {axisLabel(String(Math.round(maxV)), padX - 6, padY + 4, "end")}
      <line x1={padX} y1={padY} x2={padX} y2={padY + innerH} stroke="rgba(148,163,184,0.35)" />
      {/* unused var */}
      <g style={{ display: "none" }}>{accent}</g>
    </>
  );
}

function Beeswarm({ data, onHover }: { data: DistributionData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const padX = 40;
  const padY = 28;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const all = data.groups.flatMap((g) => g.samples);
  const minV = Math.min(...all);
  const maxV = Math.max(...all);
  const step = innerW / data.groups.length;
  return (
    <>
      <line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="rgba(148,163,184,0.35)" />
      {data.groups.map((g, gi) => {
        const cx = padX + step * (gi + 0.5);
        const color = PALETTE[gi % PALETTE.length]!;
        const placed: Array<{ x: number; y: number }> = [];
        return (
          <g key={g.label}>
            {g.samples.map((s, i) => {
              const y = padY + innerH - ((s - minV) / Math.max(1e-6, maxV - minV)) * innerH;
              let x = cx;
              let tries = 0;
              while (placed.some((p) => Math.abs(p.y - y) < 6 && Math.abs(p.x - x) < 6) && tries < 12) {
                x += (tries % 2 === 0 ? 1 : -1) * (4 + tries);
                tries += 1;
              }
              placed.push({ x, y });
              return (
                <circle
                  key={`${g.label}-${i}`}
                  cx={x}
                  cy={y}
                  r={3.2}
                  fill={color}
                  fillOpacity={0.85}
                  onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${g.label}: ${s.toFixed(1)}` })}
                  onMouseLeave={() => onHover(null)}
                />
              );
            })}
            {axisLabel(g.label, cx, padY + innerH + 16)}
          </g>
        );
      })}
    </>
  );
}

function SmallMultiples({ data, accent, onHover }: { data: SmallMultiplesData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const cols = Math.min(3, data.series.length);
  const rows = Math.ceil(data.series.length / cols);
  const cellW = w / cols;
  const cellH = h / rows;
  const pad = 10;
  const allMax = Math.max(...data.series.flatMap((s) => s.points));
  return (
    <>
      {data.series.map((s, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x0 = col * cellW + pad;
        const y0 = row * cellH + pad + 10;
        const innerW = cellW - pad * 2;
        const innerH = cellH - pad * 2 - 14;
        const step = s.points.length > 1 ? innerW / (s.points.length - 1) : innerW;
        const path = s.points.map((p, i) => `${i === 0 ? "M" : "L"} ${x0 + i * step} ${y0 + innerH - (p / allMax) * innerH}`).join(" ");
        return (
          <g key={s.label}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${s.label}: ${s.points.map((p) => p.toFixed(0)).join(", ")}` })}
            onMouseLeave={() => onHover(null)}
          >
            <rect x={col * cellW + 4} y={row * cellH + 4} width={cellW - 8} height={cellH - 8} rx={6} fill="rgba(15,23,42,0.4)" stroke="rgba(148,163,184,0.18)" />
            <text x={col * cellW + 10} y={row * cellH + 18} fill="#e2e8f0" fontSize={11} fontWeight={600}>{s.label}</text>
            <path d={path} fill="none" stroke={accent} strokeWidth={2} />
          </g>
        );
      })}
    </>
  );
}

function Cartogram({ data, accent, onHover }: { data: CartogramData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const maxX = Math.max(...data.areas.map((a) => a.x ?? 0)) + 1;
  const maxY = Math.max(...data.areas.map((a) => a.y ?? 0)) + 1;
  const cellW = w / maxX;
  const cellH = h / maxY;
  const maxV = Math.max(...data.areas.map((a) => a.value), 1);
  return (
    <>
      {data.areas.map((a) => {
        const scale = Math.max(0.3, Math.sqrt(a.value / maxV));
        const bw = cellW * scale * 0.85;
        const bh = cellH * scale * 0.85;
        const bx = (a.x ?? 0) * cellW + (cellW - bw) / 2;
        const by = (a.y ?? 0) * cellH + (cellH - bh) / 2;
        return (
          <g key={a.id}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${a.label}: ${a.value}` })}
            onMouseLeave={() => onHover(null)}
          >
            <rect x={bx} y={by} width={bw} height={bh} rx={6} fill={accent} fillOpacity={0.25 + 0.6 * (a.value / maxV)} stroke={accent} />
            <text x={bx + bw / 2} y={by + bh / 2 + 4} fill="#0f172a" fontSize={11} fontWeight={700} textAnchor="middle">{a.label}</text>
          </g>
        );
      })}
    </>
  );
}

function DotDensity({ data, accent, onHover }: { data: DotDensityData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  function rng(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  return (
    <>
      {data.areas.map((a) => {
        const x = a.x * w;
        const y = a.y * h;
        const ww = a.w * w;
        const hh = a.h * h;
        const dotCount = Math.max(6, Math.round(a.count / 4));
        const r = rng(a.id.split("").reduce((x0, c) => x0 + c.charCodeAt(0), 0));
        const dots = Array.from({ length: dotCount }, () => ({ dx: r() * ww, dy: r() * hh }));
        return (
          <g key={a.id}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${a.label}: ${a.count} (≈${dotCount} dots)` })}
            onMouseLeave={() => onHover(null)}
          >
            <rect x={x} y={y} width={ww} height={hh} fill="rgba(56,189,248,0.08)" stroke="rgba(148,163,184,0.35)" rx={4} />
            <text x={x + 6} y={y + 14} fill="#e2e8f0" fontSize={10}>{a.label}</text>
            {dots.map((d, i) => (
              <circle key={i} cx={x + d.dx} cy={y + d.dy} r={2.2} fill={accent} fillOpacity={0.85} />
            ))}
          </g>
        );
      })}
    </>
  );
}

function SparklineGrid({ data, accent, onHover }: { data: SparklineGridData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const cols = 3;
  const rows = Math.ceil(data.series.length / cols);
  const cellW = w / cols;
  const cellH = h / rows;
  return (
    <>
      {data.series.map((s, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x0 = col * cellW + 10;
        const y0 = row * cellH + 28;
        const inW = cellW - 20;
        const inH = cellH - 40;
        const max = Math.max(...s.points, 1);
        const min = Math.min(...s.points, 0);
        const step = s.points.length > 1 ? inW / (s.points.length - 1) : inW;
        const path = s.points.map((p, i) => `${i === 0 ? "M" : "L"} ${x0 + i * step} ${y0 + inH - ((p - min) / Math.max(1e-6, max - min)) * inH}`).join(" ");
        return (
          <g key={s.label}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${s.label}${s.value ? ` · ${s.value}` : ""}` })}
            onMouseLeave={() => onHover(null)}
          >
            <rect x={col * cellW + 4} y={row * cellH + 4} width={cellW - 8} height={cellH - 8} rx={6} fill="rgba(15,23,42,0.4)" stroke="rgba(148,163,184,0.16)" />
            <text x={col * cellW + 10} y={row * cellH + 18} fill="#e2e8f0" fontSize={11} fontWeight={600}>{s.label}</text>
            {s.value ? <text x={(col + 1) * cellW - 10} y={row * cellH + 18} fill={accent} fontSize={11} fontWeight={700} textAnchor="end">{s.value}</text> : null}
            <path d={path} fill="none" stroke={accent} strokeWidth={2} />
          </g>
        );
      })}
    </>
  );
}

function Waffle({ data, onHover }: { data: WaffleData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const size = Math.min(w, h) - 30;
  const cell = size / 10;
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  const cells: Array<{ color: string; label: string; share: number }> = [];
  let filled = 0;
  data.categories.forEach((c, idx) => {
    const count = Math.round(c.share);
    for (let i = 0; i < count && filled < 100; i++) {
      cells.push({ color: PALETTE[idx % PALETTE.length]!, label: c.label, share: c.share });
      filled += 1;
    }
  });
  while (filled < 100) {
    cells.push({ color: "rgba(148,163,184,0.18)", label: "Unassigned", share: 0 });
    filled += 1;
  }
  return (
    <>
      {cells.map((c, i) => {
        const col = i % 10;
        const row = 9 - Math.floor(i / 10);
        return (
          <rect
            key={i}
            x={ox + col * cell + 1}
            y={oy + row * cell + 1}
            width={cell - 2}
            height={cell - 2}
            fill={c.color}
            rx={2}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${c.label}: ${c.share}%` })}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
    </>
  );
}

function Slope({ data, accent, onHover }: { data: SlopeData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const padX = 90;
  const padY = 30;
  const innerH = h - padY * 2;
  const all = data.items.flatMap((d) => [d.before, d.after]);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const yFor = (v: number) => padY + innerH - ((v - min) / Math.max(1e-6, max - min)) * innerH;
  const xL = padX;
  const xR = w - padX;
  void accent;
  return (
    <>
      {axisLabel("Before", xL, padY - 12)}
      {axisLabel("After", xR, padY - 12)}
      {data.items.map((d, idx) => {
        const color = PALETTE[idx % PALETTE.length]!;
        const y1 = yFor(d.before);
        const y2 = yFor(d.after);
        return (
          <g key={d.label}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${d.label}: ${d.before} → ${d.after} (${d.after >= d.before ? "+" : ""}${(d.after - d.before).toFixed(1)})` })}
            onMouseLeave={() => onHover(null)}
          >
            <line x1={xL} y1={y1} x2={xR} y2={y2} stroke={color} strokeWidth={2} opacity={0.8} />
            <circle cx={xL} cy={y1} r={4} fill={color} />
            <circle cx={xR} cy={y2} r={4} fill={color} />
            <text x={xL - 8} y={y1 + 4} fill="#cbd5e1" fontSize={10} textAnchor="end">{d.label}</text>
            <text x={xR + 8} y={y2 + 4} fill="#cbd5e1" fontSize={10}>{d.after}</text>
          </g>
        );
      })}
    </>
  );
}

function Lollipop({ data, accent, onHover }: { data: LollipopData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const padX = 110;
  const padY = 20;
  const innerW = w - padX - 30;
  const max = Math.max(...data.items.map((d) => d.value), 1);
  const step = (h - padY * 2) / Math.max(1, data.items.length - 1);
  return (
    <>
      {data.items.map((d, i) => {
        const y = padY + step * i;
        const x2 = padX + (d.value / max) * innerW;
        return (
          <g key={d.label}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${d.label}: ${d.value}` })}
            onMouseLeave={() => onHover(null)}
          >
            <text x={padX - 10} y={y + 4} fill="#cbd5e1" fontSize={11} textAnchor="end">{d.label}</text>
            <line x1={padX} y1={y} x2={x2} y2={y} stroke={accent} strokeWidth={2} opacity={0.6} />
            <circle cx={x2} cy={y} r={6} fill={accent} />
            <text x={x2 + 10} y={y + 4} fill="#e2e8f0" fontSize={11}>{d.value}</text>
          </g>
        );
      })}
    </>
  );
}

function BoxWhiskerMap({ data, accent, onHover }: { data: BoxWhiskerMapData; accent: string; onHover: (t: TooltipState | null) => void }) {
  const { w, h } = DEFAULT_VIEWBOX;
  const cols = Math.ceil(Math.sqrt(data.areas.length));
  const rows = Math.ceil(data.areas.length / cols);
  const cellW = w / cols;
  const cellH = h / rows;
  const all = data.areas.flatMap((a) => [a.min, a.max]);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const xFor = (v: number, baseX: number) => baseX + 30 + ((v - min) / Math.max(1e-6, max - min)) * (cellW - 50);
  return (
    <>
      {data.areas.map((a, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const baseX = col * cellW;
        const baseY = row * cellH;
        const midY = baseY + cellH / 2 + 6;
        const xMin = xFor(a.min, baseX);
        const xMax = xFor(a.max, baseX);
        const xQ1 = xFor(a.q1, baseX);
        const xQ3 = xFor(a.q3, baseX);
        const xMed = xFor(a.median, baseX);
        return (
          <g key={a.id}
            onMouseEnter={(e) => onHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: `${a.label}: min ${a.min} · Q1 ${a.q1} · med ${a.median} · Q3 ${a.q3} · max ${a.max}` })}
            onMouseLeave={() => onHover(null)}
          >
            <rect x={baseX + 4} y={baseY + 4} width={cellW - 8} height={cellH - 8} rx={6} fill="rgba(15,23,42,0.4)" stroke="rgba(148,163,184,0.18)" />
            <text x={baseX + 10} y={baseY + 20} fill="#e2e8f0" fontSize={11} fontWeight={600}>{a.label}</text>
            <line x1={xMin} y1={midY} x2={xMax} y2={midY} stroke={accent} strokeWidth={1.5} />
            <line x1={xMin} y1={midY - 8} x2={xMin} y2={midY + 8} stroke={accent} />
            <line x1={xMax} y1={midY - 8} x2={xMax} y2={midY + 8} stroke={accent} />
            <rect x={xQ1} y={midY - 10} width={Math.max(2, xQ3 - xQ1)} height={20} fill={accent} fillOpacity={0.35} stroke={accent} />
            <line x1={xMed} y1={midY - 10} x2={xMed} y2={midY + 10} stroke="#fff" strokeWidth={2} />
          </g>
        );
      })}
    </>
  );
}

// ---------- Dispatcher + chart shell ----------

export interface AdvancedChartProps {
  type: AdvancedChartType;
  data?: AdvancedChartData;
  title?: string;
  subtitle?: string;
  accent?: string;
  showLegend?: boolean;
  compact?: boolean;
}

export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  type,
  data,
  title,
  subtitle,
  accent = "#f59e0b",
  showLegend = true,
  compact = false,
}) => {
  const meta = getAdvancedChartMeta(type);
  const payload = (data ?? ADVANCED_CHART_SAMPLES[type]) as AdvancedChartData;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const titleId = useId();

  const legend = (() => {
    if (!showLegend) return null;
    const items = getLegendItems(type, payload);
    if (!items.length) return null;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "6px 2px 0" }}>
        {items.map((item, i) => (
          <span key={`${item.label}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#cbd5e1" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color, display: "inline-block" }} />
            {item.label}
          </span>
        ))}
      </div>
    );
  })();

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", minHeight: 0 }}>
      {title || subtitle ? (
        <div style={{ padding: "2px 4px 6px" }}>
          {title ? <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{title}</div> : null}
          {subtitle ? <div style={{ fontSize: 11, color: "#94a3b8" }}>{subtitle}</div> : null}
        </div>
      ) : null}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${DEFAULT_VIEWBOX.w} ${DEFAULT_VIEWBOX.h}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby={titleId}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <title id={titleId}>{title ?? meta.label}</title>
          {renderChartContent(type, payload, accent, setTooltip)}
        </svg>
        {tooltip ? (
          <div
            role="tooltip"
            style={{
              position: "absolute",
              left: Math.min(tooltip.x + 10, 420),
              top: Math.max(0, tooltip.y - 30),
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(148,163,184,0.3)",
              borderRadius: 6,
              padding: "6px 8px",
              fontSize: 11,
              color: "#e2e8f0",
              pointerEvents: "none",
              maxWidth: 280,
              boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
              zIndex: 5,
            }}
          >
            {tooltip.content}
          </div>
        ) : null}
      </div>
      {!compact && legend}
    </div>
  );
};

function renderChartContent(
  type: AdvancedChartType,
  data: AdvancedChartData,
  accent: string,
  onHover: (t: TooltipState | null) => void,
): React.ReactNode {
  switch (type) {
    case "parallel_coordinates":
      return <ParallelCoordinates data={data as ParallelCoordinatesData} accent={accent} onHover={onHover} />;
    case "radar":
      return <Radar data={data as RadarData} accent={accent} onHover={onHover} />;
    case "sankey":
      return <Sankey data={data as SankeyData} accent={accent} onHover={onHover} />;
    case "treemap":
      return <Treemap data={data as TreemapData} accent={accent} onHover={onHover} />;
    case "violin":
      return <Violin data={data as DistributionData} accent={accent} onHover={onHover} />;
    case "beeswarm":
      return <Beeswarm data={data as DistributionData} accent={accent} onHover={onHover} />;
    case "small_multiples":
      return <SmallMultiples data={data as SmallMultiplesData} accent={accent} onHover={onHover} />;
    case "cartogram":
      return <Cartogram data={data as CartogramData} accent={accent} onHover={onHover} />;
    case "dot_density":
      return <DotDensity data={data as DotDensityData} accent={accent} onHover={onHover} />;
    case "sparkline_grid":
      return <SparklineGrid data={data as SparklineGridData} accent={accent} onHover={onHover} />;
    case "waffle":
      return <Waffle data={data as WaffleData} accent={accent} onHover={onHover} />;
    case "slope":
      return <Slope data={data as SlopeData} accent={accent} onHover={onHover} />;
    case "lollipop":
      return <Lollipop data={data as LollipopData} accent={accent} onHover={onHover} />;
    case "box_whisker_map":
      return <BoxWhiskerMap data={data as BoxWhiskerMapData} accent={accent} onHover={onHover} />;
    default:
      return null;
  }
}

function getLegendItems(type: AdvancedChartType, data: AdvancedChartData): Array<{ label: string; color: string }> {
  switch (type) {
    case "parallel_coordinates":
      return (data as ParallelCoordinatesData).records.map((r, i) => ({ label: r.label, color: PALETTE[i % PALETTE.length]! }));
    case "radar":
      return (data as RadarData).series.map((s, i) => ({ label: s.label, color: PALETTE[i % PALETTE.length]! }));
    case "violin":
    case "beeswarm":
      return (data as DistributionData).groups.map((g, i) => ({ label: g.label, color: PALETTE[i % PALETTE.length]! }));
    case "waffle":
      return (data as WaffleData).categories.map((c, i) => ({ label: `${c.label} ${c.share}%`, color: PALETTE[i % PALETTE.length]! }));
    case "slope":
      return (data as SlopeData).items.map((d, i) => ({ label: d.label, color: PALETTE[i % PALETTE.length]! }));
    case "treemap":
      return (data as TreemapData).items.slice(0, 6).map((d, i) => ({ label: d.label, color: PALETTE[i % PALETTE.length]! }));
    default:
      return [];
  }
}

// ---------- Export helpers ----------

export function serializeChartToSvgString(node: HTMLElement | null): string | null {
  if (!node) return null;
  const svg = node.querySelector("svg");
  if (!svg) return null;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const serialized = new XMLSerializer().serializeToString(clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`;
}

export function downloadChartSvg(node: HTMLElement | null, filename: string): boolean {
  const svgString = serializeChartToSvgString(node);
  if (!svgString) return false;
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

export async function downloadChartPng(node: HTMLElement | null, filename: string): Promise<boolean> {
  const svgString = serializeChartToSvgString(node);
  if (!svgString) return false;
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to rasterize chart SVG"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = (img.width || DEFAULT_VIEWBOX.w) * scale;
    canvas.height = (img.height || DEFAULT_VIEWBOX.h) * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve();
          return;
        }
        const pngUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = pngUrl;
        anchor.download = filename.endsWith(".png") ? filename : `${filename}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(pngUrl);
        resolve();
      }, "image/png");
    });
    return true;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------- Gallery + picker UI ----------

export interface AdvancedChartPickerProps {
  value: AdvancedChartType | null;
  onChange: (type: AdvancedChartType | null) => void;
  allowNone?: boolean;
  id?: string;
}

export const AdvancedChartPicker: React.FC<AdvancedChartPickerProps> = ({ value, onChange, allowNone = true, id }) => {
  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(event) => {
        const next = event.target.value as AdvancedChartType | "";
        onChange(next === "" ? null : next);
      }}
      aria-label="Advanced chart type"
      style={{
        width: "100%",
        padding: "6px 8px",
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.3)",
        background: "rgba(15,23,42,0.8)",
        color: "#e2e8f0",
        fontSize: 12,
      }}
    >
      {allowNone ? <option value="">Default (bar/line/area)</option> : null}
      {ADVANCED_CHART_FAMILY_ORDER.map((family) => {
        const group = ADVANCED_CHART_META.filter((m) => m.family === family);
        if (group.length === 0) return null;
        return (
          <optgroup key={family} label={group[0]!.familyLabel}>
            {group.map((meta) => (
              <option key={meta.type} value={meta.type}>{meta.label}</option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
};

const DND_MIME = "application/x-synapse-dashboard";

export interface AdvancedChartGalleryProps {
  onSelect: (type: AdvancedChartType) => void;
  onDragStartChart?: (type: AdvancedChartType, event: React.DragEvent) => void;
  activeType?: AdvancedChartType | null;
}

export const AdvancedChartGallery: React.FC<AdvancedChartGalleryProps> = ({ onSelect, onDragStartChart, activeType }) => {
  const [filter, setFilter] = useState<AdvancedChartFamily | "all">("all");
  const families: Array<{ id: AdvancedChartFamily | "all"; label: string }> = [
    { id: "all", label: "All" },
    { id: "multivariate", label: "Multivariate" },
    { id: "distribution", label: "Distribution" },
    { id: "flow_composition", label: "Flow / Composition" },
    { id: "spatial", label: "Spatial" },
    { id: "temporal", label: "Temporal" },
    { id: "ranking", label: "Ranking" },
  ];
  const visible = ADVANCED_CHART_META.filter((meta) => filter === "all" || meta.family === filter);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {families.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: `1px solid ${filter === f.id ? "#f59e0b" : "rgba(148,163,184,0.3)"}`,
              background: filter === f.id ? "rgba(245,158,11,0.15)" : "transparent",
              color: filter === f.id ? "#fbbf24" : "#cbd5e1",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 10,
        }}
      >
        {visible.map((meta) => (
          <button
            key={meta.type}
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData(
                DND_MIME,
                JSON.stringify({ source: "library", widgetType: "chart", advancedChartType: meta.type }),
              );
              onDragStartChart?.(meta.type, event);
            }}
            onClick={() => onSelect(meta.type)}
            aria-label={`Add ${meta.label}`}
            style={{
              textAlign: "left",
              padding: 10,
              borderRadius: 10,
              border: `1px solid ${activeType === meta.type ? "#f59e0b" : "rgba(148,163,184,0.25)"}`,
              background: activeType === meta.type ? "rgba(245,158,11,0.08)" : "rgba(15,23,42,0.55)",
              color: "#e2e8f0",
              cursor: "grab",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
              <strong style={{ fontSize: 12 }}>{meta.label}</strong>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{meta.familyLabel}</span>
            </div>
            <div style={{ height: 96, borderRadius: 8, overflow: "hidden", background: "rgba(2,6,23,0.55)", border: "1px solid rgba(148,163,184,0.15)" }}>
              <AdvancedChart type={meta.type} compact showLegend={false} accent="#f59e0b" />
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.3 }}>{meta.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
