import { createBot } from "../../domain/bot";
import type { Reply } from "../../domain/messages";
import type { Interpreter } from "../../ports/interpreter";
import { createMemoryCatalog } from "./catalog";
import { createMemoryImageProcessor } from "./image-processor";
import { createMemoryInterpreter } from "./interpreter";
import { createMemoryMediaStore } from "./media-store";

/** The bot wired to in-memory doubles, driven the way Norma would. Used by tests and `pnpm sim`. */
export function createMemoryWorkshop({
  interpreter = createMemoryInterpreter(),
}: { interpreter?: Interpreter } = {}) {
  const catalog = createMemoryCatalog();
  const media = createMemoryMediaStore();
  let ids = 0;
  const bot = createBot({
    catalog,
    media,
    images: createMemoryImageProcessor(),
    interpreter,
    newId: () => `p${++ids}`,
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
    /** Taps a button from the last reply, like Norma would. */
    tap(title: string) {
      const button = last.buttons?.find((b) => b.title === title);
      if (!button)
        throw new Error(`No hay botón "${title}" en la última respuesta`);
      return send({ kind: "button", id: button.id });
    },
    pressButton: (id: string) => send({ kind: "button", id }),
    lastReply: () => last,
    publishedPieces: () => catalog.published(),
    storedPhotos: () => media.stored(),
  };
}
