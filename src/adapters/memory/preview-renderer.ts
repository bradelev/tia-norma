import type {
  PreviewRenderer,
  SlipContent,
} from "../../ports/preview-renderer";

/** Keeps what it was asked to draw: the bot's tests check the slip's content, not its pixels. */
export function createMemoryPreviewRenderer() {
  const drawn: SlipContent[] = [];
  return {
    async render(content) {
      drawn.push(content);
      return new TextEncoder().encode(`boleta ${drawn.length}`);
    },
    drawn: () => drawn,
  } satisfies PreviewRenderer & { drawn: unknown };
}
