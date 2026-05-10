/**
 * Urban Analytics Workbench — Right Panel Types
 *
 * Mirrors the original rightPanelTypes.ts with urban-domain equivalents.
 */

// ---------------------------------------------------------------------------
// Key for panel content lookup
// ---------------------------------------------------------------------------

export type RPKey = {
  sectionId: string;
  leafId: string;
  subleafId: string;
  itemId?: string;
};

// ---------------------------------------------------------------------------
// Content building blocks
// ---------------------------------------------------------------------------

export type RPInfoCard = {
  title: string;
  body: string[];
};

export type RPExample = {
  id: string;
  label: string;
  html?: string;
  question?: string;
};

export type RPPrompt = { text: string };
export type RPReference = { title: string };

// ---------------------------------------------------------------------------
// Bundle (raw card content)
// ---------------------------------------------------------------------------

export type RPBundle = {
  infoCards: RPInfoCard[];
  exampleHtml: string;
  prompts: string[];
  references: string[];
};

// ---------------------------------------------------------------------------
// Normalized block (display-ready)
// ---------------------------------------------------------------------------

export type NormalizedBlock = {
  info: string;
  examples: Array<{ id: string; label: string; html: string; question?: string }>;
  defaultExampleId: string | null;
  references: string[];
  commands: Array<{ text: string }>;
};
