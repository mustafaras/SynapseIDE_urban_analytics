import { downloadText } from "@/centerpanel/lib/download";
import { getDashboardBinding } from "./dataBindings";
import type {
  DashboardBinding,
  DashboardComparisonBinding,
  DashboardDocument,
  DashboardLiveBinding,
  DashboardMapBinding,
  DashboardMetricBinding,
  DashboardSeriesBinding,
  DashboardTableBinding,
  DashboardTextBinding,
  DashboardWidget,
} from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatWidgetTypeLabel(type: DashboardWidget["type"]): string {
  return type.replace(/_/g, " ");
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "dashboard";
}

function statusColor(status: string): string {
  switch (status) {
    case "improving":
      return "#34d399";
    case "critical":
      return "#f87171";
    case "watch":
      return "#fbbf24";
    default:
      return "#60a5fa";
  }
}

function renderMetric(binding: DashboardMetricBinding): string {
  return `
    <div class="metric-value">${escapeHtml(binding.formattedValue)}</div>
    <div class="metric-meta">
      <span>${escapeHtml(binding.description)}</span>
      ${binding.changeLabel ? `<span style="color:${statusColor(binding.status)}">${escapeHtml(binding.changeLabel)}</span>` : ""}
    </div>
  `;
}

function renderSeries(binding: DashboardSeriesBinding): string {
  const max = Math.max(...binding.points.map((point) => point.value), 1);
  return `
    <div class="stack">
      ${binding.points.map((point) => `
        <div>
          <div class="row">
            <span>${escapeHtml(point.label)}</span>
            <span>${escapeHtml(`${point.value}${binding.unit ? ` ${binding.unit}` : ""}`)}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${(point.value / max) * 100}%"></div></div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderTable(binding: DashboardTableBinding): string {
  return `
    <table>
      <thead>
        <tr>${binding.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${binding.rows.map((row) => `
          <tr>${binding.columns.map((column) => `<td>${escapeHtml(String(row[column] ?? ""))}</td>`).join("")}</tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderMap(binding: DashboardMapBinding): string {
  const max = Math.max(...binding.areas.map((area) => area.value), 1);
  return `
    <div class="map-grid">
      ${binding.areas.map((area) => `
        <div class="map-cell" style="background:rgba(245,158,11,${Math.max(0.18, area.value / max)}); border-color:${statusColor(area.status)};">
          <strong>${escapeHtml(area.label)}</strong>
          <span>${escapeHtml(area.formattedValue)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderComparison(binding: DashboardComparisonBinding): string {
  const max = Math.max(
    ...binding.items.flatMap((item) => [item.primary, item.secondary]),
    1,
  );
  return `
    <div class="stack">
      ${binding.items.map((item) => `
        <div>
          <div class="row">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(`${item.primary}${item.unit ? ` ${item.unit}` : ""} vs ${item.secondary}${item.unit ? ` ${item.unit}` : ""}`)}</span>
          </div>
          <div class="compare-row">
            <div class="compare-bar">
              <div class="compare-fill primary" style="width:${(item.primary / max) * 100}%"></div>
            </div>
            <div class="compare-bar">
              <div class="compare-fill secondary" style="width:${(item.secondary / max) * 100}%"></div>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderText(binding: DashboardTextBinding): string {
  return `
    <div class="stack">
      <div class="highlight-list">${binding.highlights.map((highlight) => `<span class="pill">${escapeHtml(highlight)}</span>`).join("")}</div>
      <h3>${escapeHtml(binding.headline)}</h3>
      ${binding.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </div>
  `;
}

function renderLive(binding: DashboardLiveBinding): string {
  return `
    <div class="stack">
      <div class="metric-value">${escapeHtml(binding.formattedValue)}</div>
      <div class="metric-meta">
        <span>${escapeHtml(binding.statusLabel)}</span>
        <span>${escapeHtml(binding.cadence)}</span>
      </div>
      <div class="sparkline-row">
        ${binding.trendPoints.map((point) => `<span class="sparkline-bar" style="height:${Math.max(20, point)}%"></span>`).join("")}
      </div>
      <div class="muted">${escapeHtml(binding.source)}</div>
    </div>
  `;
}

function renderWidgetBody(widget: DashboardWidget, binding: DashboardBinding | null): string {
  if (binding?.kind === "metric") return renderMetric(binding);
  if (binding?.kind === "series") return renderSeries(binding);
  if (binding?.kind === "table") return renderTable(binding);
  if (binding?.kind === "map") return renderMap(binding);
  if (binding?.kind === "comparison") return renderComparison(binding);
  if (binding?.kind === "text") return renderText(binding);
  if (binding?.kind === "live") return renderLive(binding);

  if (widget.config.body) {
    return `<p>${escapeHtml(widget.config.body)}</p>`;
  }

  return `<p class="muted">No binding configured for this widget yet.</p>`;
}

export function buildDashboardEmbedHtml(document: DashboardDocument): string {
  const rows = Math.max(...document.widgets.map((widget) => widget.layout.y + widget.layout.h), 0);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(document.name)}</title>
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; padding: 24px; background: #071019; color: #e5eef8; font: 14px/1.5 Inter, system-ui, sans-serif; }
      .page { max-width: 1400px; margin: 0 auto; display: grid; gap: 18px; }
      .hero { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .hero-title { font-size: 28px; font-weight: 700; margin: 0; }
      .hero-subtitle { margin: 8px 0 0; color: #93a6bd; max-width: 72ch; }
      .meta { color: #93a6bd; font-size: 12px; }
      .canvas { display: grid; grid-template-columns: repeat(${document.columns}, minmax(0, 1fr)); gap: 14px; grid-auto-rows: 90px; min-height: ${Math.max(4, rows) * 90}px; }
      .widget { background: linear-gradient(180deg, rgba(15,23,42,0.94), rgba(15,23,42,0.86)); border: 1px solid rgba(148,163,184,0.2); border-radius: 18px; padding: 14px; overflow: hidden; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 18px 42px rgba(2,6,23,0.28); }
      .widget header { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
      .widget h2 { margin: 0; font-size: 15px; }
      .widget p { margin: 0; color: #bfd0e4; }
      .meta-chip { border: 1px solid rgba(245,158,11,0.26); color: #fbbf24; border-radius: 999px; padding: 4px 8px; font-size: 11px; }
      .metric-value { font-size: 34px; font-weight: 700; letter-spacing: -0.03em; }
      .metric-meta, .row, .compare-row { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
      .stack { display: flex; flex-direction: column; gap: 10px; }
      .bar-track, .compare-bar { height: 10px; border-radius: 999px; background: rgba(148,163,184,0.14); overflow: hidden; }
      .bar-fill, .compare-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #f59e0b, #fbbf24); }
      .compare-fill.secondary { background: linear-gradient(90deg, #38bdf8, #60a5fa); }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { padding: 8px 10px; border-bottom: 1px solid rgba(148,163,184,0.14); text-align: left; }
      th { color: #94a3b8; font-weight: 600; }
      .map-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .map-cell { min-height: 72px; border-radius: 14px; border: 1px solid rgba(148,163,184,0.18); padding: 10px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; }
      .highlight-list { display: flex; gap: 8px; flex-wrap: wrap; }
      .pill { border-radius: 999px; padding: 4px 9px; background: rgba(245,158,11,0.12); color: #fbbf24; font-size: 11px; }
      .sparkline-row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; align-items: end; min-height: 54px; }
      .sparkline-bar { display: block; background: linear-gradient(180deg, #38bdf8, #0ea5e9); border-radius: 999px 999px 4px 4px; min-height: 12px; }
      .muted { color: #93a6bd; font-size: 12px; }
      @media (max-width: 1000px) { .canvas { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
      @media (max-width: 720px) { body { padding: 16px; } .canvas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="hero">
        <div>
          <h1 class="hero-title">${escapeHtml(document.name)}</h1>
          <p class="hero-subtitle">${escapeHtml(document.description)}</p>
        </div>
        <div class="meta">
          <div>Template: ${escapeHtml(document.templateId ?? "custom")}</div>
          <div>Updated: ${escapeHtml(new Date(document.updatedAt).toLocaleString("en-US"))}</div>
        </div>
      </section>
      <section class="canvas">
        ${document.widgets.map((widget) => {
          const binding = getDashboardBinding(widget.config.bindingId);
          return `
            <article class="widget" style="grid-column:${widget.layout.x + 1} / span ${widget.layout.w}; grid-row:${widget.layout.y + 1} / span ${widget.layout.h};">
              <header>
                <div>
                  <h2>${escapeHtml(widget.config.title)}</h2>
                  ${widget.config.subtitle ? `<p>${escapeHtml(widget.config.subtitle)}</p>` : ""}
                </div>
                <span class="meta-chip">${escapeHtml(formatWidgetTypeLabel(widget.type))}</span>
              </header>
              ${renderWidgetBody(widget, binding)}
            </article>
          `;
        }).join("")}
      </section>
    </div>
  </body>
</html>`;
}

export function downloadDashboardHtml(document: DashboardDocument): string {
  const filename = `${slugify(document.name)}.html`;
  downloadText(filename, buildDashboardEmbedHtml(document), "text/html;charset=utf-8");
  return filename;
}

export async function downloadDashboardPdf(node: HTMLElement, filenameBase: string): Promise<string> {
  type ChainSet = { save: () => Promise<void> | void };
  type ChainFrom = { set: (opt: Record<string, unknown>) => ChainSet };
  type Chain = { from: (el: HTMLElement) => ChainFrom };
  type Factory = () => Chain;

  const mod: unknown = await import("html2pdf.js");
  const candidate = mod as Record<string, unknown>;
  const factory = typeof candidate.default === "function"
    ? candidate.default as Factory
    : mod as Factory;

  const filename = `${slugify(filenameBase)}.pdf`;
  await factory().from(node).set({
    margin: 12,
    filename,
    image: { type: "png", quality: 1 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#071019" },
    jsPDF: { unit: "pt", format: "a4", orientation: "landscape" },
    pagebreak: { mode: ["css", "legacy"] },
  }).save();

  return filename;
}

function downloadDataUrl(filename: string, dataUrl: string): void {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function downloadDashboardPng(node: HTMLElement, filenameBase: string): Promise<string> {
  const rect = node.getBoundingClientRect();
  const width = Math.max(1200, Math.ceil(rect.width));
  const height = Math.max(720, Math.ceil(rect.height));
  const serialized = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#071019;padding:0;margin:0;">
          ${node.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
  const image = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Dashboard PNG export could not render the snapshot."));
  });
  image.src = url;
  await loaded;

  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering context is unavailable.");
  }

  context.scale(2, 2);
  context.fillStyle = "#071019";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const filename = `${slugify(filenameBase)}.png`;
  downloadDataUrl(filename, canvas.toDataURL("image/png"));
  return filename;
}
