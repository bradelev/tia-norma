import sharp from "sharp";
import { card } from "../../domain/card";
import { frame } from "../../domain/framing";
import { measurePhoto, photoProblem } from "../../domain/photo-quality";
import type { ImageProcessor } from "../../ports/image-processor";
import type { PieceFinder } from "../../ports/piece-finder";

/** The quality thresholds were calibrated at this size; measuring at another one moves them. */
const MEASURE_SIZE = 800;
/** Same size as the sample photos; enough for a phone at 2x. */
const WIDTH = 1200;
const HEIGHT = (WIDTH * card.photo.height) / card.photo.width;
/** Enough for the model to see the piece's edges, small enough to answer fast. */
const FINDER_SIZE = 768;

/** Measures the photo as Norma took it, since sharpening would hide a blur. */
export async function measure(photo: Uint8Array) {
  const { data, info } = await sharp(photo)
    .resize(MEASURE_SIZE, MEASURE_SIZE, { fit: "inside" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return measurePhoto(data, info.width);
}

/** Without a finder, or when it finds nothing, sharp guesses the crop by attention. */
export function createSharpImageProcessor({
  finder,
}: { finder?: PieceFinder | undefined } = {}): ImageProcessor {
  return {
    async treat(photo) {
      const problem = photoProblem(await measure(photo));
      if (problem) return { problem };
      const piece = finder
        ? await finder.find(
            await sharp(photo)
              .rotate()
              .resize(FINDER_SIZE, FINDER_SIZE, { fit: "inside" })
              .jpeg({ quality: 80 })
              .toBuffer(),
          )
        : null;
      const framed = sharp(photo).rotate();
      if (piece) framed.extract(frame(piece, await uprightSize(photo)));
      const treated = await framed
        .resize(WIDTH, HEIGHT, {
          fit: "cover",
          position: sharp.strategy.attention,
        })
        // Stretches only the luminance, so the clay keeps its color.
        .normalise({ lower: 1, upper: 99 })
        .sharpen({ sigma: 0.8 })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      return { treated };
    },
  };
}

/** The photo's size once turned by its EXIF orientation. */
async function uprightSize(photo: Uint8Array) {
  const { autoOrient } = await sharp(photo).metadata();
  return autoOrient;
}
