import React from "react";
import {
  AdvancedChart,
  getAdvancedChartMeta,
  type AdvancedChartType,
} from "./advancedCharts";
import contentStyles from "./dashboardWidgetContent.module.css";
import type {
  DashboardBinding,
  DashboardComparisonBinding,
  DashboardMapBinding,
  DashboardSeriesBinding,
  DashboardWidget,
} from "./types";

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

function densityPadding(density?: string): number {
  return density === "compact" ? 8 : 12;
}

function chartAccent(widget: DashboardWidget): string {
  return widget.config.style?.accentColor ?? "#f59e0b";
}

function renderTraceability(binding: DashboardBinding): React.ReactNode {
  const traceability = binding.traceability;
  if (!traceability) return null;

  const labels = [
    traceability.refreshMode ? `Refresh: ${traceability.refreshMode}` : null,
    traceability.qaState ? `QA: ${traceability.qaState}` : null,
    traceability.scaleLabel ? `Scale: ${traceability.scaleLabel}` : null,
    traceability.uncertaintyLabel ? `Uncertainty: ${traceability.uncertaintyLabel}` : null,
    traceability.sourceRunId ? `Run: ${traceability.sourceRunId}` : null,
  ].filter((label): label is string => Boolean(label));

  if (labels.length === 0) return null;

  return (
    <div className={contentStyles.traceabilityRow} aria-label="Binding traceability">
      {labels.slice(0, 5).map((label) => (
        <span key={`${binding.id}-${label}`} className={contentStyles.traceabilityChip}>
          {label}
        </span>
      ))}
    </div>
  );
}

function renderSeriesSvg(binding: DashboardSeriesBinding, variant: string, accent: string): React.ReactNode {
  const width = 320;
  const height = 150;
  const padding = 18;
  const max = Math.max(...binding.points.map((point) => point.value), 1);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const step = binding.points.length > 1 ? innerWidth / (binding.points.length - 1) : innerWidth;
  const points = binding.points.map((point, index) => {
    const x = padding + index * step;
    const y = padding + innerHeight - (point.value / max) * innerHeight;
    return { ...point, x, y };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${padding + innerWidth} ${padding + innerHeight} L ${padding} ${padding + innerHeight} Z`;
  const barWidth = binding.points.length > 0 ? innerWidth / binding.points.length - 12 : innerWidth;

  if (variant === "bar") {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={contentStyles.chartSvg} aria-hidden="true">
        {binding.points.map((point, index) => {
          const x = padding + index * (barWidth + 12);
          const y = padding + innerHeight - (point.value / max) * innerHeight;
          return (
            <g key={point.label}>
              <rect x={x} y={y} width={barWidth} height={padding + innerHeight - y} rx={8} fill={accent} opacity={0.85} />
              <text x={x + barWidth / 2} y={height - 8} fill="#94a3b8" fontSize="10" textAnchor="middle">{point.label}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={contentStyles.chartSvg} aria-hidden="true">
      <path d={area} fill={accent} opacity={variant === "area" ? 0.16 : 0.08} />
      <path d={path} fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r={4} fill={accent} />
          <text x={point.x} y={height - 8} fill="#94a3b8" fontSize="10" textAnchor="middle">{point.label}</text>
        </g>
      ))}
    </svg>
  );
}

function renderComparison(binding: DashboardComparisonBinding, accent: string): React.ReactNode {
  const max = Math.max(...binding.items.flatMap((item) => [item.primary, item.secondary]), 1);

  return (
    <div className={contentStyles.comparisonGrid}>
      {binding.items.map((item) => (
        <div key={item.label} className={contentStyles.comparisonItem}>
          <div className={contentStyles.metaRow}>
            <strong className={contentStyles.primaryText}>{item.label}</strong>
            <span className={contentStyles.mutedText}>
              {item.primary}{item.unit ? ` ${item.unit}` : ""} vs {item.secondary}{item.unit ? ` ${item.unit}` : ""}
            </span>
          </div>
          <div className={contentStyles.comparisonBars}>
            <div className={contentStyles.barTrack}>
              <div className={contentStyles.barFill} style={{ width: `${(item.primary / max) * 100}%`, background: accent }} />
            </div>
            <div className={contentStyles.barTrack}>
              <div className={contentStyles.barFill} style={{ width: `${(item.secondary / max) * 100}%`, background: "#38bdf8" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderMap(binding: DashboardMapBinding): React.ReactNode {
  const max = Math.max(...binding.areas.map((area) => area.value), 1);
  return (
    <div className={contentStyles.mapGrid}>
      {binding.areas.map((area) => (
        <div
          key={area.id}
          className={contentStyles.mapArea}
          style={{
            borderColor: statusColor(area.status),
            background: `linear-gradient(180deg, rgba(245,158,11,${Math.max(0.18, area.value / max)}), rgba(15,23,42,0.65))`,
          }}
        >
          <strong className={contentStyles.mapAreaLabel}>{area.label}</strong>
          <span className={contentStyles.mapAreaValue}>{area.formattedValue}</span>
        </div>
      ))}
    </div>
  );
}

export interface DashboardWidgetContentProps {
  widget: DashboardWidget;
  binding: DashboardBinding | null;
}

export function DashboardWidgetContent({ widget, binding }: DashboardWidgetContentProps): React.ReactNode {
  const accent = chartAccent(widget);
  const padding = densityPadding(widget.config.style?.density);
  const advancedChartType = widget.config.style?.advancedChartType ?? null;

  if (widget.type === "chart" && advancedChartType) {
    return (
      <div
        data-advanced-chart-host={widget.id}
        className={contentStyles.advancedChartHost}
        style={{ padding }}
      >
        <AdvancedChart
          type={advancedChartType as AdvancedChartType}
          accent={accent}
          subtitle={getAdvancedChartMeta(advancedChartType as AdvancedChartType).description}
        />
      </div>
    );
  }

  if (!binding) {
    return (
      <div className={contentStyles.emptyState} style={{ padding }}>
        Drag this widget to a new position, then choose a binding in the inspector.
      </div>
    );
  }

  if (binding.kind === "metric") {
    return (
      <div className={contentStyles.contentStack} style={{ padding }}>
        <div className={contentStyles.metricValue}>{binding.formattedValue}</div>
        <div className={contentStyles.metaRow}>
          <span className={contentStyles.mutedText}>{binding.description}</span>
          {binding.changeLabel ? <span style={{ color: statusColor(binding.status) }}>{binding.changeLabel}</span> : null}
        </div>
        {renderTraceability(binding)}
      </div>
    );
  }

  if (binding.kind === "live") {
    return (
      <div className={contentStyles.contentStack} style={{ padding }}>
        <div className={contentStyles.liveHeader}>
          <div className={contentStyles.liveValue}>{binding.formattedValue}</div>
          <span className={contentStyles.liveCadence}>{binding.cadence}</span>
        </div>
        <div className={contentStyles.liveTrendGrid}>
          {binding.trendPoints.map((point, index) => (
            <div
              key={`${binding.id}-${index}`}
              className={contentStyles.liveTrendBar}
              style={{ height: `${Math.max(20, point)}%` }}
            />
          ))}
        </div>
        <div className={contentStyles.metaRow}>
          <span className={contentStyles.mutedText}>{binding.source}</span>
          <span className={contentStyles.mutedText}>{binding.statusLabel}</span>
        </div>
        {renderTraceability(binding)}
      </div>
    );
  }

  if (binding.kind === "series") {
    return (
      <div className={contentStyles.contentStack} style={{ padding }}>
        <div className={contentStyles.seriesCanvas}>{renderSeriesSvg(binding, widget.config.style?.chartVariant ?? "bar", accent)}</div>
        <div className={contentStyles.chipRow}>
          {binding.points.map((point) => (
            <span key={`${binding.id}-${point.label}`} className={contentStyles.valueChip}>
              {point.label}: {point.value}{binding.unit ? ` ${binding.unit}` : ""}
            </span>
          ))}
        </div>
        {renderTraceability(binding)}
      </div>
    );
  }

  if (binding.kind === "table") {
    return (
      <div className={contentStyles.contentStack} style={{ padding }}>
        <div className={contentStyles.tableWrap}>
          <table className={contentStyles.table}>
            <thead>
              <tr>
                {binding.columns.map((column) => (
                  <th key={`${binding.id}-${column}`} className={contentStyles.tableHead}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {binding.rows.map((row, rowIndex) => (
                <tr key={`${binding.id}-row-${rowIndex}`}>
                  {binding.columns.map((column) => (
                    <td key={`${binding.id}-row-${rowIndex}-${column}`} className={contentStyles.tableCell}>
                      {String(row[column] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderTraceability(binding)}
      </div>
    );
  }

  if (binding.kind === "map") {
    return (
      <div className={contentStyles.contentStack} style={{ padding, minHeight: 0 }}>
        {renderMap(binding)}
        {renderTraceability(binding)}
      </div>
    );
  }

  if (binding.kind === "comparison") {
    return (
      <div className={contentStyles.contentStack} style={{ padding }}>
        {renderComparison(binding, accent)}
        {renderTraceability(binding)}
      </div>
    );
  }

  if (binding.kind === "text") {
    return (
      <div className={contentStyles.contentStack} style={{ padding }}>
        <div className={contentStyles.chipRow}>
          {binding.highlights.map((highlight) => (
            <span key={`${binding.id}-${highlight}`} className={contentStyles.highlightChip}>
              {highlight}
            </span>
          ))}
        </div>
        <strong className={contentStyles.textHeadline}>{binding.headline}</strong>
        {binding.paragraphs.map((paragraph, index) => (
          <p key={`${binding.id}-${index}`} className={contentStyles.textParagraph}>
            {paragraph}
          </p>
        ))}
        {renderTraceability(binding)}
      </div>
    );
  }

  return null;
}
