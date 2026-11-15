import type { PreviewRenderer } from "../../ports/preview-renderer";

/** Returns the photo as is: the bot's tests only need to know a preview was drawn. */
export function createMemoryPreviewRenderer(): PreviewRenderer {
  return {
    async render({ photo }) {
      return photo;
    },
  };
}
