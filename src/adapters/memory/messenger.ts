import type { Reply } from "../../domain/messages";
import type { Media, Messenger } from "../../ports/messenger";

/** Keeps what the bot sent and serves the media a test put in. */
export function createMemoryMessenger(media: Record<string, Media> = {}) {
  const sent: { to: string; reply: Reply }[] = [];
  const messenger: Messenger = {
    async send(to, reply) {
      sent.push({ to, reply });
    },
    async download(mediaId) {
      const found = media[mediaId];
      if (!found) throw new Error(`No hay media ${mediaId}`);
      return found;
    },
  };
  return { ...messenger, sent };
}
