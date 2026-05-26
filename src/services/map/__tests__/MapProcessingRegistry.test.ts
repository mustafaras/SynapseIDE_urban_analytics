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
  it("seeds the full catalogue with at least 12 implemented tools", () => {
    const registry = createMapProcessingRegistry();
    const ids = registry.list().map((tool) => tool.toolId);
    expect(ids).toEqual(expect.arrayContaining(["buffer", "centroid", "attribute-filter"]));
    expect(registry.implementedCount()).toBeGreaterThanOrEqual(12);
    expect(registry.categories()).toEqual(
      expect.arrayContaining(["Geometry", "Selection", "Overlay", "Join", "Statistics"]),
    );
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
    expect(registry.search("").length).toBe(registry.list().length);
    expect(registry.search("", { category: "Selection" }).map((tool) => tool.toolId)).toEqual([
      "attribute-filter",
    ]);
    // implementedOnly hides the stub descriptors.
    expect(registry.search("", { implementedOnly: true }).length).toBe(registry.implementedCount());
    expect(registry.search("", { implementedOnly: true }).length).toBeLessThan(registry.list().length);
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
