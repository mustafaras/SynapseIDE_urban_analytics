/**
 * Single source of truth for the product brand (MFP-21).
 *
 * Every shell header, hero, welcome surface, modal title, status-bar line, and
 * empty-state header imports the product name from here. Do NOT hardcode the
 * product name anywhere else — that is exactly the divergence this constant
 * eliminates (the shell previously said "SynapseIDE" / "Synapse IDE" /
 * "Urban Analytics Workbench" in four different places).
 *
 * The platform is tri-modal — Synapse IDE + Map Explorer (the GIS surface) +
 * Urban Analytics — so the canonical name is GIS-inclusive and IDE-led.
 *
 * Owner-confirmed (2026-06-20): full + short below; no tagline; version 0.9.0.
 * MFP-22 keeps `index.html` <title>, favicon/meta, and package.json in sync with
 * `full` / `version`.
 */
export const BRAND = {
  /** Full canonical name — browser <title>, runtime document.title, accessible titles. */
  full: 'Synapse IDE — GIS & Urban Analytics Workbench',
  /** Compact name — shell header, hero, sidebar, status bar, badges. */
  short: 'Synapse IDE',
  /** Release version — kept in sync with package.json (MFP-22 owns the bump). */
  version: '0.9.0',
  /** The tri-modal surfaces (Map Explorer is the GIS surface). */
  modules: ['Synapse IDE', 'Map Explorer (GIS)', 'Urban Analytics'] as const,
} as const;

export type Brand = typeof BRAND;
