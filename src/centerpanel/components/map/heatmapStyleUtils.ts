export type HeatmapGradientName = "hot" | "cool" | "viridis" | "plasma";

export const HEATMAP_GRADIENTS: Record<HeatmapGradientName, string[]> = {
  hot: ["#2b0a3d", "#8b1e3f", "#d9480f", "#f59e0b", "#fef3c7"],
  cool: ["#0f172a", "#155e75", "#0891b2", "#22c55e", "#ecfeff"],
  viridis: ["#440154", "#414487", "#2a788e", "#22a884", "#fde725"],
  plasma: ["#0d0887", "#7e03a8", "#cc4778", "#f89441", "#f0f921"],
};

export function buildHeatmapColorExpression(gradient: HeatmapGradientName): unknown[] {
  const colors = HEATMAP_GRADIENTS[gradient];
  return [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(0,0,0,0)",
    0.12,
    colors[0],
    0.3,
    colors[1],
    0.5,
    colors[2],
    0.75,
    colors[3],
    1,
    colors[4],
  ];
}
