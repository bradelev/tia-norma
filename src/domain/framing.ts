import { card } from "./card";

/** Where the piece sits in the photo, as fractions of its width and height. */
export type Box = { left: number; top: number; right: number; bottom: number };

/** The part of the photo to keep, in pixels. */
export type Crop = { left: number; top: number; width: number; height: number };

/** The piece fills at most this much of the crop on each side, so it never touches the edge. */
const FILL = 0.7;
/** A crop narrower than this share of the photo would blow the pixels up too much. */
const MIN_SHARE = 0.5;

/** Crops at the card's 4:5 with the piece centered and some air around it, never outside the photo. */
export function frame(
  piece: Box,
  photo: { width: number; height: number },
): Crop {
  const ratio = card.photo.width / card.photo.height;
  const widest = Math.min(photo.width, photo.height * ratio);
  const pieceWidth = (piece.right - piece.left) * photo.width;
  const pieceHeight = (piece.bottom - piece.top) * photo.height;
  const needed = Math.max(pieceWidth / FILL, (pieceHeight / FILL) * ratio);
  const width = Math.round(clamp(needed, widest * MIN_SHARE, widest));
  const height = Math.round(width / ratio);
  const centerX = ((piece.left + piece.right) / 2) * photo.width;
  const centerY = ((piece.top + piece.bottom) / 2) * photo.height;
  return {
    left: Math.round(clamp(centerX - width / 2, 0, photo.width - width)),
    top: Math.round(clamp(centerY - height / 2, 0, photo.height - height)),
    width,
    height,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
