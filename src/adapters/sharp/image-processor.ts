import sharp from "sharp";
import { card } from "../../domain/card";
import { measurePhoto, photoProblem } from "../../domain/photo-quality";
import type { ImageProcessor } from "../../ports/image-processor";

/** The quality thresholds were calibrated at this size; measuring at another one moves them. */
const MEASURE_SIZE = 800;
/** Same size as the sample photos; enough for a phone at 2x. */
const WIDTH = 1200;
const HEIGHT = (WIDTH * card.photo.height) / card.photo.width;

/** Measures the photo as Norma took it, since sharpening would hide a blur. */
export async function measure(photo: Uint8Array) {
  const { data, info } = await sharp(photo)
    .resize(MEASURE_SIZE, MEASURE_SIZE, { fit: "inside" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return measurePhoto(data, info.width);
}

export function createSharpImageProcessor(): ImageProcessor {
  return {
    async treat(photo) {
      const problem = photoProblem(await measure(photo));
      if (problem) return { problem };
      const treated = await sharp(photo)
        .rotate()
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
