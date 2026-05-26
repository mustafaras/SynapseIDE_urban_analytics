import { describe, it, expect } from "vitest";
import {
  MapProcessingRegistry,
  createMapProcessingRegistry,
} from "@/services/map/processing";
import type { ProcessingToolDescriptor } from "@/services/map/contracts/gisContracts";

function descriptor(overrides: Partial<ProcessingToolDescriptor> & Pick<ProcessingToolDescriptor, "toolId">): ProcessingToolDescriptor {
  return {
    title: overrides.toolId,
    category: "Geometry",
    summary: "",
    parameters: [],
    requiresCrs: false,
    executionMode: "main-preview",
    qaGated: false,
    urbanMethodIds: [],
    implemented: true,
    ...overrides,
  };
}

describe("MapProcessingRegistry", () => {
  it("seeds the three reference tools and reports implemented count", () => {
    const registry = createMapProcessingRegistry();
    expect(registry.list().map((tool) => tool.toolId).sort()).toEqual([
      "attribute-filter",
      "buffer",
      "centroid",
    ]);
    expect(registry.implementedCount()).toBe(3);
    expect(registry.categories().sort()).toEqual(["Geometry", "Selection"]);
  });

  it("searches by token across id, title, summary, and category", () => {
    const registry = createMapProcessingRegistry();
    expect(registry.search("buffer").map((tool) => tool.toolId)).toEqual(["buffer"]);
    expect(registry.search("filter").map((tool) => tool.toolId)).toEqual(["attribute-filter"]);
    // summary text match: buffer's summary mentions "distance"
    expect(registry.search("distance").map((tool) => tool.toolId)).toEqual(["buffer"]);
  });

  it("returns all tools for an empty query and honours filters", () => {
    const registry = createMapProcessingRegistry();
    expect(registry.search("").length).toBe(3);
    expect(registry.search("", { category: "Selection" }).map((tool) => tool.toolId)).toEqual([
      "attribute-filter",
    ]);
  });

  it("excludes non-implemented tools when implementedOnly is set", () => {
    const registry = new MapProcessingRegistry([
      descriptor({ toolId: "wired", implemented: true }),
      descriptor({ toolId: "stub", implemented: false }),
    ]);
    expect(registry.search("", { implementedOnly: true }).map((tool) => tool.toolId)).toEqual(["wired"]);
    expect(registry.search("").length).toBe(2);
  });

  it("looks up and replaces descriptors by id", () => {
    const registry = new MapProcessingRegistry();
    expect(registry.get("buffer")).toBeNull();
    registry.register(descriptor({ toolId: "buffer", title: "Buffer v1" }));
    expect(registry.get("buffer")?.title).toBe("Buffer v1");
    registry.register(descriptor({ toolId: "buffer", title: "Buffer v2" }));
    expect(registry.list()).toHaveLength(1);
    expect(registry.get("buffer")?.title).toBe("Buffer v2");
    expect(registry.has("buffer")).toBe(true);
  });
});
