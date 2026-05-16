import type { GuideCategory, MethodologyGuide } from "./guideContent";

export type GuideRailMode = GuideCategory | "All";

export interface GuideRailItem {
  id: string;
  title: string;
  category: GuideCategory;
  snippet?: string;
}

export interface GuideRailState {
  mode: GuideRailMode;
  query: string;
  items: GuideRailItem[];
  totalCount: number;
}

export const GUIDE_RAIL_SYNC_EVENT = "centerpanel:guide-rail-sync";

let latestGuideRailState: GuideRailState | null = null;

export function toGuideRailItem(guide: MethodologyGuide): GuideRailItem {
  return {
    id: guide.id,
    title: guide.title,
    category: guide.category,
    snippet: guide.abstract.trim().replace(/\s+/g, " ").slice(0, 110),
  };
}

export function publishGuideRailState(state: GuideRailState): void {
  latestGuideRailState = state;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<GuideRailState>(GUIDE_RAIL_SYNC_EVENT, { detail: state }));
}

export function subscribeGuideRailState(handler: (state: GuideRailState) => void): () => void {
  if (latestGuideRailState) handler(latestGuideRailState);
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<GuideRailState>).detail;
    if (!detail || !Array.isArray(detail.items)) return;
    handler(detail);
  };

  window.addEventListener(GUIDE_RAIL_SYNC_EVENT, listener);
  return () => window.removeEventListener(GUIDE_RAIL_SYNC_EVENT, listener);
}
