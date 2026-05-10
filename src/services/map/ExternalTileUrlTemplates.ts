export const STAMEN_WATERCOLOR_TILE_URL = "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg";

export function normalizeXyzTileUrlTemplate(urlTemplate: string): string {
  return urlTemplate
    .replace(
      /^https:\/\/stamen-tiles\.[a-z]\.ssl\.fastly\.net\/watercolor\/\{z\}\/\{x\}\/\{y\}\.jpg$/i,
      STAMEN_WATERCOLOR_TILE_URL,
    )
    .replace(
      /^https:\/\/stamen-tiles\.[a-z]\.ssl\.fastly\.net\/watercolor\//i,
      "https://tiles.stadiamaps.com/tiles/stamen_watercolor/",
    );
}
