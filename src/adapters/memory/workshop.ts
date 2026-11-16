import { createBot } from "../../domain/bot";
import type { Reply } from "../../domain/messages";
import type { Interpreter } from "../../ports/interpreter";
import type { PreviewRenderer } from "../../ports/preview-renderer";
import { createMemoryCatalog } from "./catalog";
import { createMemoryImageProcessor } from "./image-processor";
import { createMemoryInterpreter } from "./interpreter";
import { createMemoryMediaStore } from "./media-store";
import { createMemoryPreviewRenderer } from "./preview-renderer";

/** The bot wired to in-memory doubles, driven the way Norma would. Used by tests and `pnpm sim`. */
export function createMemoryWorkshop({
  interpreter = createMemoryInterpreter(),
  previews,
}: { interpreter?: Interpreter; previews?: PreviewRenderer } = {}) {
  const catalog = createMemoryCatalog();
  const media = createMemoryMediaStore();
  const slips = createMemoryPreviewRenderer();
  let ids = 0;
  let time = Date.UTC(2026, 0, 1);
  const bot = createBot({
    catalog,
    media,
    images: createMemoryImageProcessor(),
    previews: previews ?? slips,
    interpreter,
    newId: () => `p${++ids}`,
    now: () => time,
  });
  let last: Reply = { text: "" };

  async function send(message: Parameters<typeof bot.receive>[0]) {
    last = await bot.receive(message);
    return last;
  }

  return {
    // For another entry point in front of the same bot, like the webhook.
    bot,
    catalog,
    sendPhoto: (bytes = new Uint8Array([1, 2, 3])) =>
      send({ kind: "photo", bytes }),
    say: (text: string) => send({ kind: "text", text }),
    /** An audio, already transcribed to this text. */
    speak: (text: string) => send({ kind: "audio", text }),
    /** Taps a button or a list row from the last reply, like Norma would. */
    tap(title: string) {
      const choices = [...(last.buttons ?? []), ...(last.list?.rows ?? [])];
      const button = choices.find((b) => b.title === title);
      if (!button)
        throw new Error(`No hay botón "${title}" en la última respuesta`);
      return send({ kind: "button", id: button.id });
    },
    pressButton: (id: string) => send({ kind: "button", id }),
    /** Moves the workshop's clock forward. */
    wait(ms: number) {
      time += ms;
    },
    lastReply: () => last,
    publishedPieces: () => catalog.published(),
    storedPhotos: () => media.stored(),
    /** What each preview's slip showed, oldest first. */
    drawnSlips: () => slips.drawn(),
  };
}
