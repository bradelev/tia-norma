import type { PhotoProblem } from "../domain/photo-quality";

/** A treated photo ready for the preview, or the reason to ask for another. */
export type Treatment = { treated: Uint8Array } | { problem: PhotoProblem };

export interface ImageProcessor {
  /** Turns the photo upright, frames it at 4:5 around the piece and corrects light and sharpness. */
  treat(photo: Uint8Array): Promise<Treatment>;
}
