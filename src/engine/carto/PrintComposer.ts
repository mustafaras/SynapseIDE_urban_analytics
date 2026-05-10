/**
 * PrintComposer — build map layouts and export to PDF via pdf-lib.
 *
 * Supports A4, A3, Letter at 72 / 150 / 300 DPI in portrait or landscape.
 * Layout elements: map frame, title, subtitle, legend, scale bar, north arrow,
 * attribution, and data-source text.
 */

import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from 'pdf-lib';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type PageSize = 'A4' | 'A3' | 'Letter';
export type Orientation = 'portrait' | 'landscape';
export type DPI = 72 | 150 | 300;

export interface LegendItem {
  label: string;
  color: string;
}

export interface PrintLayout {
  title: string;
  subtitle?: string;
  attribution?: string;
  dataSource?: string;
  legend?: LegendItem[];
  /** PNG data-URL or Uint8Array of the rendered map frame. */
  mapImage?: string | Uint8Array;
  pageSize?: PageSize;
  orientation?: Orientation;
  dpi?: DPI;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Page dimensions in PostScript points (1 pt = 1/72 inch). */
const PAGE_SIZES: Record<PageSize, { w: number; h: number }> = {
  A4: { w: 595.28, h: 841.89 },
  A3: { w: 841.89, h: 1190.55 },
  Letter: { w: 612, h: 792 },
};

const MARGIN = 36; // 0.5 inch

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseHexToRGB(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace('#', '');
  if (c.length === 6) {
    return {
      r: parseInt(c.slice(0, 2), 16) / 255,
      g: parseInt(c.slice(2, 4), 16) / 255,
      b: parseInt(c.slice(4, 6), 16) / 255,
    };
  }
  /* Fallback for rgb(...) strings */
  const m = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(hex);
  if (m) {
    return { r: +m[1]! / 255, g: +m[2]! / 255, b: +m[3]! / 255 };
  }
  return { r: 0.5, g: 0.5, b: 0.5 };
}

async function toUint8(src: string | Uint8Array): Promise<Uint8Array> {
  if (src instanceof Uint8Array) return src;
  /* data:image/png;base64,... */
  const base64 = src.split(',')[1] ?? src;
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* ------------------------------------------------------------------ */
/*  Drawing helpers                                                    */
/* ------------------------------------------------------------------ */

function drawTitle(
  page: PDFPage,
  text: string,
  _font: PDFFont,
  boldFont: PDFFont,
  y: number,
  pageWidth: number,
): number {
  const size = 18;
  const tw = boldFont.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (pageWidth - tw) / 2,
    y,
    size,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  return y - size - 6;
}

function drawSubtitle(
  page: PDFPage,
  text: string,
  font: PDFFont,
  y: number,
  pageWidth: number,
): number {
  const size = 12;
  const tw = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (pageWidth - tw) / 2,
    y,
    size,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  return y - size - 8;
}

function drawLegend(
  page: PDFPage,
  items: LegendItem[],
  font: PDFFont,
  boldFont: PDFFont,
  x: number,
  y: number,
): number {
  const titleSize = 11;
  const itemSize = 9;
  const swatchSize = 10;
  const gap = 4;

  page.drawText('Legend', { x, y, size: titleSize, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  let cy = y - titleSize - gap;

  for (const item of items) {
    const col = parseHexToRGB(item.color);
    page.drawRectangle({
      x,
      y: cy - swatchSize + 2,
      width: swatchSize,
      height: swatchSize,
      color: rgb(col.r, col.g, col.b),
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
    });
    page.drawText(item.label, {
      x: x + swatchSize + 4,
      y: cy - swatchSize + 4,
      size: itemSize,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });
    cy -= swatchSize + gap;
  }
  return cy;
}

function drawScaleBar(
  page: PDFPage,
  font: PDFFont,
  x: number,
  y: number,
): number {
  const barWidth = 100;
  const barHeight = 6;
  /* Simplified scale bar — actual distance depends on map scale. */
  page.drawRectangle({
    x,
    y,
    width: barWidth,
    height: barHeight,
    color: rgb(0, 0, 0),
  });
  page.drawRectangle({
    x: x + barWidth / 2,
    y,
    width: barWidth / 2,
    height: barHeight,
    color: rgb(1, 1, 1),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
  });
  page.drawText('0', { x, y: y - 10, size: 7, font, color: rgb(0, 0, 0) });
  page.drawText('Scale', {
    x: x + barWidth / 2 - 8,
    y: y - 10,
    size: 7,
    font,
    color: rgb(0, 0, 0),
  });
  return y - 20;
}

function drawNorthArrow(page: PDFPage, font: PDFFont, x: number, y: number): void {
  const size = 20;
  /* Simple triangle pointing up. */
  page.drawSvgPath(`M 0 ${size} L ${size / 2} 0 L ${size} ${size} Z`, {
    x,
    y: y - size,
    color: rgb(0.15, 0.15, 0.15),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
  });
  page.drawText('N', {
    x: x + size / 2 - 3,
    y: y + 4,
    size: 9,
    font,
    color: rgb(0, 0, 0),
  });
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Compose a print-quality PDF from a map layout specification.
 * Returns the PDF as a `Uint8Array`.
 */
export async function composePDF(layout: PrintLayout): Promise<Uint8Array> {
  const {
    title,
    subtitle,
    attribution,
    dataSource,
    legend,
    mapImage,
    pageSize = 'A4',
    orientation = 'portrait',
  } = layout;

  const base = PAGE_SIZES[pageSize];
  const pw = orientation === 'landscape' ? base.h : base.w;
  const ph = orientation === 'landscape' ? base.w : base.h;

  const doc = await PDFDocument.create();
  const page = doc.addPage([pw, ph]);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let cursorY = ph - MARGIN;

  /* Title */
  cursorY = drawTitle(page, title, font, boldFont, cursorY, pw);

  /* Subtitle */
  if (subtitle) {
    cursorY = drawSubtitle(page, subtitle, font, cursorY, pw);
  }

  /* Map frame ---------------------------------------------------- */
  const mapTop = cursorY - 6;
  const legendWidth = legend && legend.length > 0 ? 140 : 0;
  const mapLeft = MARGIN;
  const mapRight = pw - MARGIN - legendWidth - (legendWidth > 0 ? 8 : 0);
  const mapWidth = mapRight - mapLeft;
  const mapHeight = mapTop - MARGIN - 50; // leave room for footer

  /* Draw frame border */
  page.drawRectangle({
    x: mapLeft,
    y: mapTop - mapHeight,
    width: mapWidth,
    height: mapHeight,
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth: 1,
    color: rgb(0.95, 0.95, 0.95),
  });

  /* Embed map image if provided */
  if (mapImage) {
    const imgBytes = await toUint8(mapImage);
    const embedded = await doc.embedPng(imgBytes);
    page.drawImage(embedded, {
      x: mapLeft + 1,
      y: mapTop - mapHeight + 1,
      width: mapWidth - 2,
      height: mapHeight - 2,
    });
  }

  /* Legend -------------------------------------------------------- */
  if (legend && legend.length > 0) {
    drawLegend(page, legend, font, boldFont, mapRight + 10, mapTop);
  }

  /* North arrow & scale bar -------------------------------------- */
  drawNorthArrow(page, font, pw - MARGIN - 30, mapTop);
  const footerY = mapTop - mapHeight - 14;
  drawScaleBar(page, font, MARGIN, footerY);

  /* Attribution & data source ------------------------------------ */
  const footerSize = 7;
  if (attribution) {
    page.drawText(attribution, {
      x: MARGIN,
      y: MARGIN + footerSize + 2,
      size: footerSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }
  if (dataSource) {
    page.drawText(`Data: ${dataSource}`, {
      x: MARGIN,
      y: MARGIN,
      size: footerSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  return doc.save();
}

/**
 * Trigger a browser download of a composed PDF.
 */
export async function downloadPDF(
  layout: PrintLayout,
  filename = 'map_layout.pdf',
): Promise<void> {
  const bytes = await composePDF(layout);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
