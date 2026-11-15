/** Why the bot asks Norma for another photo. */
export type PhotoProblem = "blurry" | "dark";

export interface PhotoMeasures {
  /** Mean gray, 0 to 255. */
  luminance: number;
  /** Variance of the laplacian: how marked the edges are. */
  sharpness: number;
}

// Calibrated on the photos in src/app/samples scaled to fit 800 px, plus blurred and darkened copies.
/** The samples sit at 105-140 and one stop under (52-70) still corrects well; below 45 the piece is lost. */
export const MIN_LUMINANCE = 45;
/** The softest good sample scores 86; a 2 px blur or a 15 px shake drops them to 5-44. */
export const MIN_SHARPNESS = 50;

/** `gray` holds one byte per pixel, row by row. */
export function measurePhoto(gray: Uint8Array, width: number): PhotoMeasures {
  const at = (i: number) => gray[i] ?? 0;
  const height = gray.length / width;
  let count = 0;
  let sum = 0;
  let squares = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const edge =
        at(i - 1) + at(i + 1) + at(i - width) + at(i + width) - 4 * at(i);
      count += 1;
      sum += edge;
      squares += edge * edge;
    }
  }
  const mean = sum / count;
  return {
    luminance: gray.reduce((total, value) => total + value, 0) / gray.length,
    sharpness: squares / count - mean * mean,
  };
}

/** Darkness wins: a dark photo also loses its edges, and more light is the fix. */
export function photoProblem(measures: PhotoMeasures): PhotoProblem | null {
  if (measures.luminance < MIN_LUMINANCE) return "dark";
  if (measures.sharpness < MIN_SHARPNESS) return "blurry";
  return null;
}
