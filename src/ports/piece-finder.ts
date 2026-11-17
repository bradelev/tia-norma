import type { Box } from "../domain/framing";

export interface PieceFinder {
  /** Where the piece is in an upright JPEG photo, or null when there is no clear piece or no answer in time. */
  find(photo: Uint8Array): Promise<Box | null>;
}
