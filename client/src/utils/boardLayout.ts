import type { Tile } from "../types/game";

export interface TileLayout {
  tile: Tile;
  x: number;
  y: number;
  width: number;
  height: number;
  side: "bottom" | "right" | "top" | "left";
}

export function computeBoardLayout(tiles: Tile[], boardSize: number): TileLayout[] {
  const count = tiles.length;
  const perSide = Math.ceil(count / 4);
  const margin = 10;
  const cornerSize = 100;
  const innerLength = boardSize - 2 * margin - 2 * cornerSize;
  const tileWidth = innerLength / (perSide - 1);

  const layouts: TileLayout[] = [];
  let idx = 0;

  // Bottom row (left to right): corner + (perSide-1) regular tiles
  for (let i = 0; i < perSide && idx < count; i++, idx++) {
    const isCorner = i === 0;
    layouts.push({
      tile: tiles[idx],
      x: margin + (isCorner ? 0 : cornerSize + (i - 1) * tileWidth),
      y: boardSize - margin - cornerSize,
      width: isCorner ? cornerSize : tileWidth,
      height: cornerSize,
      side: "bottom",
    });
  }

  // Right column (bottom to top): corner + (perSide-1) regular tiles
  for (let i = 0; i < perSide && idx < count; i++, idx++) {
    const isCorner = i === 0;
    layouts.push({
      tile: tiles[idx],
      x: boardSize - margin - cornerSize,
      y: isCorner
        ? boardSize - margin - cornerSize
        : boardSize - margin - cornerSize - i * tileWidth,
      width: cornerSize,
      height: isCorner ? cornerSize : tileWidth,
      side: "right",
    });
  }

  // Top row (right to left): corner + (perSide-1) regular tiles
  for (let i = 0; i < perSide && idx < count; i++, idx++) {
    const isCorner = i === 0;
    layouts.push({
      tile: tiles[idx],
      x: isCorner
        ? boardSize - margin - cornerSize
        : boardSize - margin - cornerSize - i * tileWidth,
      y: margin,
      width: isCorner ? cornerSize : tileWidth,
      height: cornerSize,
      side: "top",
    });
  }

  // Left column (top to bottom): corner + (perSide-1) regular tiles
  for (let i = 0; i < perSide && idx < count; i++, idx++) {
    const isCorner = i === 0;
    layouts.push({
      tile: tiles[idx],
      x: margin,
      y: margin + (isCorner ? 0 : cornerSize + (i - 1) * tileWidth),
      width: cornerSize,
      height: isCorner ? cornerSize : tileWidth,
      side: "left",
    });
  }

  return layouts;
}

export function getTileCenter(layout: TileLayout): { cx: number; cy: number } {
  return {
    cx: layout.x + layout.width / 2,
    cy: layout.y + layout.height / 2,
  };
}
