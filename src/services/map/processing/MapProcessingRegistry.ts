/* ==================================================================== */
/*  MapProcessingRegistry — Prompt 24a                                   */
/*                                                                        */
/*  A small, side-effect-free registry of {@link ProcessingToolDescriptor} */
/*  records. The toolbox UI lists/searches descriptors through this       */
/*  registry; execution is handled separately by MapProcessingExecutor so */
/*  the registry stays a pure catalogue (testable without a store).       */
/* ==================================================================== */

import type { ProcessingToolDescriptor } from "@/services/map/contracts/gisContracts";

export interface ProcessingToolSearchOptions {
  /** Restrict to a single category (case-insensitive exact match). */
  category?: string;
  /** When true, only return tools wired end-to-end (`implemented: true`). */
  implementedOnly?: boolean;
}

/**
 * Build the searchable haystack for a descriptor: id, title, summary,
 * category, and parameter labels, lower-cased and joined.
 */
function buildHaystack(descriptor: ProcessingToolDescriptor): string {
  return [
    descriptor.toolId,
    descriptor.title,
    descriptor.summary,
    descriptor.category,
    ...descriptor.parameters.map((parameter) => parameter.label),
    ...descriptor.urbanMethodIds,
  ]
    .join(" ")
    .toLowerCase();
}

/** Stable ordering: category, then title, then id. */
function compareDescriptors(a: ProcessingToolDescriptor, b: ProcessingToolDescriptor): number {
  return (
    a.category.localeCompare(b.category) ||
    a.title.localeCompare(b.title) ||
    a.toolId.localeCompare(b.toolId)
  );
}

export class MapProcessingRegistry {
  private readonly tools = new Map<string, ProcessingToolDescriptor>();

  constructor(initial: ReadonlyArray<ProcessingToolDescriptor> = []) {
    this.registerAll(initial);
  }

  /** Register (or replace) a descriptor keyed by `toolId`. */
  register(descriptor: ProcessingToolDescriptor): void {
    this.tools.set(descriptor.toolId, descriptor);
  }

  registerAll(descriptors: ReadonlyArray<ProcessingToolDescriptor>): void {
    for (const descriptor of descriptors) this.register(descriptor);
  }

  has(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  /** Look up one descriptor by id, or `null` when unknown. */
  get(toolId: string): ProcessingToolDescriptor | null {
    return this.tools.get(toolId) ?? null;
  }

  /** All descriptors, in stable display order. */
  list(): ProcessingToolDescriptor[] {
    return Array.from(this.tools.values()).sort(compareDescriptors);
  }

  /** Distinct categories, in stable order. */
  categories(): string[] {
    return Array.from(new Set(this.list().map((tool) => tool.category)));
  }

  /** Count of tools wired end-to-end. */
  implementedCount(): number {
    return this.list().filter((tool) => tool.implemented).length;
  }

  /**
   * Token search: a descriptor matches when *every* whitespace-delimited token
   * in `query` appears somewhere in its haystack. An empty query returns all
   * tools (subject to the option filters). Results keep the stable list order.
   */
  search(query: string, options: ProcessingToolSearchOptions = {}): ProcessingToolDescriptor[] {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const categoryFilter = options.category?.trim().toLowerCase();

    return this.list().filter((descriptor) => {
      if (options.implementedOnly && !descriptor.implemented) return false;
      if (categoryFilter && descriptor.category.toLowerCase() !== categoryFilter) return false;
      if (tokens.length === 0) return true;
      const haystack = buildHaystack(descriptor);
      return tokens.every((token) => haystack.includes(token));
    });
  }
}
