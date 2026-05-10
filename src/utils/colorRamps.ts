export type ColorRampCategory = "sequential" | "diverging" | "qualitative";

export interface ColorRampDefinition {
  name: string;
  category: ColorRampCategory;
  colorblindSafe: boolean;
  classes: Record<number, readonly string[]>;
}

const SEQUENTIAL_RAMPS = {
  YlOrRd: {
    name: "YlOrRd",
    category: "sequential",
    colorblindSafe: true,
    classes: {
      3: ["#ffeda0", "#feb24c", "#f03b20"],
      4: ["#ffffb2", "#fecc5c", "#fd8d3c", "#e31a1c"],
      5: ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"],
      6: ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026"],
      7: ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"],
      8: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"],
      9: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"],
    },
  },
  Blues: {
    name: "Blues",
    category: "sequential",
    colorblindSafe: true,
    classes: {
      3: ["#deebf7", "#9ecae1", "#3182bd"],
      4: ["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"],
      5: ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
      6: ["#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"],
      7: ["#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"],
      8: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"],
      9: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
    },
  },
  Greens: {
    name: "Greens",
    category: "sequential",
    colorblindSafe: true,
    classes: {
      3: ["#e5f5e0", "#a1d99b", "#31a354"],
      4: ["#edf8e9", "#bae4b3", "#74c476", "#238b45"],
      5: ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"],
      6: ["#edf8e9", "#c7e9c0", "#a1d99b", "#74c476", "#31a354", "#006d2c"],
      7: ["#edf8e9", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#005a32"],
      8: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#005a32"],
      9: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"],
    },
  },
  Purples: {
    name: "Purples",
    category: "sequential",
    colorblindSafe: true,
    classes: {
      3: ["#efedf5", "#bcbddc", "#756bb1"],
      4: ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#6a51a3"],
      5: ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f"],
      6: ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"],
      7: ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#4a1486"],
      8: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#4a1486"],
      9: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"],
    },
  },
  Oranges: {
    name: "Oranges",
    category: "sequential",
    colorblindSafe: true,
    classes: {
      3: ["#fee6ce", "#fdae6b", "#e6550d"],
      4: ["#feedde", "#fdbe85", "#fd8d3c", "#d94701"],
      5: ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d", "#a63603"],
      6: ["#feedde", "#fdd0a2", "#fdae6b", "#fd8d3c", "#e6550d", "#a63603"],
      7: ["#feedde", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#8c2d04"],
      8: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#8c2d04"],
      9: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"],
    },
  },
} satisfies Record<string, ColorRampDefinition>;

const DIVERGING_RAMPS = {
  RdBu: {
    name: "RdBu",
    category: "diverging",
    colorblindSafe: true,
    classes: {
      3: ["#ef8a62", "#f7f7f7", "#67a9cf"],
      4: ["#ca0020", "#f4a582", "#92c5de", "#0571b0"],
      5: ["#ca0020", "#f4a582", "#f7f7f7", "#92c5de", "#0571b0"],
      6: ["#b2182b", "#ef8a62", "#fddbc7", "#d1e5f0", "#67a9cf", "#2166ac"],
      7: ["#b2182b", "#ef8a62", "#fddbc7", "#f7f7f7", "#d1e5f0", "#67a9cf", "#2166ac"],
      8: ["#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac"],
      9: ["#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac"],
    },
  },
  PuOr: {
    name: "PuOr",
    category: "diverging",
    colorblindSafe: true,
    classes: {
      3: ["#f1a340", "#f7f7f7", "#998ec3"],
      4: ["#e66101", "#fdb863", "#b2abd2", "#5e3c99"],
      5: ["#e66101", "#fdb863", "#f7f7f7", "#b2abd2", "#5e3c99"],
      6: ["#b35806", "#f1a340", "#fee0b6", "#d8daeb", "#998ec3", "#542788"],
      7: ["#b35806", "#f1a340", "#fee0b6", "#f7f7f7", "#d8daeb", "#998ec3", "#542788"],
      8: ["#b35806", "#e08214", "#fdb863", "#fee0b6", "#d8daeb", "#b2abd2", "#8073ac", "#542788"],
      9: ["#b35806", "#e08214", "#fdb863", "#fee0b6", "#f7f7f7", "#d8daeb", "#b2abd2", "#8073ac", "#542788"],
    },
  },
  RdYlGn: {
    name: "RdYlGn",
    category: "diverging",
    colorblindSafe: true,
    classes: {
      3: ["#fc8d59", "#ffffbf", "#91cf60"],
      4: ["#d7191c", "#fdae61", "#a6d96a", "#1a9641"],
      5: ["#d7191c", "#fdae61", "#ffffbf", "#a6d96a", "#1a9641"],
      6: ["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91cf60", "#1a9850"],
      7: ["#d73027", "#fc8d59", "#fee08b", "#ffffbf", "#d9ef8b", "#91cf60", "#1a9850"],
      8: ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850"],
      9: ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850"],
    },
  },
  BrBG: {
    name: "BrBG",
    category: "diverging",
    colorblindSafe: true,
    classes: {
      3: ["#d8b365", "#f5f5f5", "#5ab4ac"],
      4: ["#a6611a", "#dfc27d", "#80cdc1", "#018571"],
      5: ["#a6611a", "#dfc27d", "#f5f5f5", "#80cdc1", "#018571"],
      6: ["#8c510a", "#d8b365", "#f6e8c3", "#c7eae5", "#5ab4ac", "#01665e"],
      7: ["#8c510a", "#d8b365", "#f6e8c3", "#f5f5f5", "#c7eae5", "#5ab4ac", "#01665e"],
      8: ["#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#c7eae5", "#80cdc1", "#35978f", "#01665e"],
      9: ["#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e"],
    },
  },
} satisfies Record<string, ColorRampDefinition>;

const SET1_EXTENSIONS = ["#66c2a5", "#fc8d62", "#8da0cb"] as const;
const DARK2_EXTENSIONS = ["#1f78b4", "#33a02c", "#e31a1c", "#6a3d9a"] as const;

function extendPalette(base: readonly string[], extensions: readonly string[], classCount: number): string[] {
  const result = [...base];
  let extensionIndex = 0;
  while (result.length < classCount) {
    result.push(extensions[extensionIndex % extensions.length]!);
    extensionIndex += 1;
  }
  return result.slice(0, classCount);
}

const QUALITATIVE_RAMPS = {
  Set1: {
    name: "Set1",
    category: "qualitative",
    colorblindSafe: true,
    classes: {
      3: ["#e41a1c", "#377eb8", "#4daf4a"],
      4: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3"],
      5: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"],
      6: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33"],
      7: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628"],
      8: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf"],
      9: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"],
      10: extendPalette(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"], SET1_EXTENSIONS, 10),
      11: extendPalette(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"], SET1_EXTENSIONS, 11),
      12: extendPalette(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"], SET1_EXTENSIONS, 12),
    },
  },
  Paired: {
    name: "Paired",
    category: "qualitative",
    colorblindSafe: true,
    classes: {
      3: ["#a6cee3", "#1f78b4", "#b2df8a"],
      4: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c"],
      5: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99"],
      6: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"],
      7: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f"],
      8: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00"],
      9: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6"],
      10: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a"],
      11: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99"],
      12: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"],
    },
  },
  Dark2: {
    name: "Dark2",
    category: "qualitative",
    colorblindSafe: true,
    classes: {
      3: ["#1b9e77", "#d95f02", "#7570b3"],
      4: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a"],
      5: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e"],
      6: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02"],
      7: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d"],
      8: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"],
      9: extendPalette(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"], DARK2_EXTENSIONS, 9),
      10: extendPalette(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"], DARK2_EXTENSIONS, 10),
      11: extendPalette(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"], DARK2_EXTENSIONS, 11),
      12: extendPalette(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"], DARK2_EXTENSIONS, 12),
    },
  },
} satisfies Record<string, ColorRampDefinition>;

export const COLOR_RAMPS = {
  sequential: SEQUENTIAL_RAMPS,
  diverging: DIVERGING_RAMPS,
  qualitative: QUALITATIVE_RAMPS,
} as const;

export type SequentialRampName = keyof typeof SEQUENTIAL_RAMPS;
export type DivergingRampName = keyof typeof DIVERGING_RAMPS;
export type QualitativeRampName = keyof typeof QUALITATIVE_RAMPS;
export type ColorRampName = SequentialRampName | DivergingRampName | QualitativeRampName;

export function getColorRampDefinition(name: ColorRampName): ColorRampDefinition {
  const sequential = SEQUENTIAL_RAMPS[name as SequentialRampName];
  if (sequential) return sequential;
  const diverging = DIVERGING_RAMPS[name as DivergingRampName];
  if (diverging) return diverging;
  return QUALITATIVE_RAMPS[name as QualitativeRampName];
}

export function getColorRampColors(name: ColorRampName, classCount: number): string[] {
  const definition = getColorRampDefinition(name);
  const availableCounts = Object.keys(definition.classes)
    .map((key) => Number(key))
    .sort((a, b) => a - b);

  if (availableCounts.length === 0) {
    throw new Error(`Color ramp "${name}" has no color definitions.`);
  }

  const exact = definition.classes[classCount];
  if (exact) return [...exact];

  const fallbackCount =
    availableCounts.find((count) => count >= classCount) ??
    availableCounts[availableCounts.length - 1]!;

  return [...definition.classes[fallbackCount]!.slice(0, Math.max(1, classCount))];
}

export function getRampPreviewColors(name: ColorRampName, previewCount = 5): string[] {
  return getColorRampColors(name, previewCount);
}

export function listColorRampDefinitions(category?: ColorRampCategory): ColorRampDefinition[] {
  if (category) {
    return Object.values(COLOR_RAMPS[category]);
  }
  return [
    ...Object.values(SEQUENTIAL_RAMPS),
    ...Object.values(DIVERGING_RAMPS),
    ...Object.values(QUALITATIVE_RAMPS),
  ];
}
