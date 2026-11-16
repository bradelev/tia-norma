import { createHash } from "node:crypto";
import {
  type Content,
  isSignedByMeta,
  parseMessages,
  sameText,
  type WhatsAppMessage,
} from "../adapters/whatsapp/webhook";
import type { Bot } from "../domain/bot";
import { FIXED_REPLIES, type Reply } from "../domain/messages";
import type { Catalog } from "../ports/catalog";
import type { Messenger } from "../ports/messenger";
import type { Transcriber } from "../ports/transcriber";

const NOT_YET: Reply = {
  text: "Por ahora entiendo fotos, texto y audios. Escribime el nombre y el precio.",
};
const LIMIT_MS = 15_000;

export interface WebhookSettings {
  appSecret: string;
  verifyToken: string;
  /** Numbers as WhatsApp sends them (5491100000000). They all share one workshop. */
  authorized: readonly string[];
  messenger: Messenger;
  catalog: Pick<Catalog, "recordMessage">;
  bot: Bot;
  transcriber: Transcriber;
  /** R10: past this, Norma hears "probá de nuevo" and the late result is dropped. */
  limitMs?: number;
}

/** Runs work after the response is sent: `after()` in Next, a collector in tests. */
export type Later = (work: () => Promise<void>) => void;

export interface Webhook {
  /** Meta's handshake when the webhook URL is registered. */
  verify(url: URL): Response;
  receive(request: Request, later: Later): Promise<Response>;
}

export function createWebhook(settings: WebhookSettings): Webhook {
  const { messenger, bot, transcriber, limitMs = LIMIT_MS } = settings;

  /** What to send back; null for a reaction or a sticker. */
  async function reply(
    content: Content,
    deadline: AbortSignal,
  ): Promise<Reply | null> {
    switch (content.kind) {
      case "text":
      case "button":
        return bot.receive(content, deadline);
      case "photo": {
        // The caption goes first, so a rejected photo still keeps the name and
        // price, and the photo's reply (preview or "send another") is the one sent.
        if (content.caption)
          await bot.receive({ kind: "text", text: content.caption }, deadline);
        const { bytes } = await messenger.download(content.mediaId);
        return bot.receive({ kind: "photo", bytes }, deadline);
      }
      case "audio": {
        // R3: what she said follows the same path as what she writes.
        const said = await transcriber.transcribe(
          await messenger.download(content.mediaId),
        );
        return bot.receive({ kind: "text", text: said }, deadline);
      }
      case "ignored":
        return null;
      case "other":
        return NOT_YET;
    }
  }

  async function answer({ id, from, content }: WhatsAppMessage) {
    const deadline = new AbortController();
    const timer = setTimeout(
      () => deadline.abort(new Error(`Pasaron ${limitMs} ms`)),
      limitMs,
    );
    try {
      // The work keeps going after the deadline, but the bot no longer writes
      // and its reply is never sent.
      const outgoing = await Promise.race([
        reply(content, deadline.signal),
        aborted(deadline.signal),
      ]);
      if (outgoing) await messenger.send(from, outgoing);
    } catch (error) {
      await failed(id, from, error);
    } finally {
      clearTimeout(timer);
    }
  }

  /** R10: the message is already recorded and Meta's retry dropped, so Norma hears it from here. */
  async function failed(id: string, from: string, error: unknown) {
    // WhatsApp's id encodes her number, so the log keeps only a short hash of it.
    const ref = createHash("sha256").update(id).digest("hex").slice(0, 8);
    console.error(`Falló el mensaje ${ref}:`, reason(error));
    try {
      await messenger.send(from, FIXED_REPLIES.tryAgain);
    } catch (again) {
      console.error(
        `Tampoco salió el aviso del mensaje ${ref}:`,
        reason(again),
      );
    }
  }

  return {
    verify(url) {
      const params = url.searchParams;
      const token = params.get("hub.verify_token") ?? "";
      if (
        params.get("hub.mode") !== "subscribe" ||
        !sameText(token, settings.verifyToken)
      )
        return new Response(null, { status: 403 });
      return new Response(params.get("hub.challenge") ?? "");
    },

    async receive(request, later) {
      const body = new Uint8Array(await request.arrayBuffer());
      const signature = request.headers.get("x-hub-signature-256");
      if (!isSignedByMeta(body, signature, settings.appSecret))
        return new Response(null, { status: 401 });
      const messages = parseMessages(body);
      if (!messages) return new Response(null, { status: 400 });

      const fresh: WhatsAppMessage[] = [];
      for (const message of messages) {
        // R8: a stranger gets no answer, and their id is not even recorded.
        if (!settings.authorized.includes(message.from)) continue;
        // R9: recorded before the 200, so a redelivery finds it.
        if (await settings.catalog.recordMessage(message.id))
          fresh.push(message);
      }
      if (fresh.length > 0)
        later(async () => {
          for (const message of fresh) await answer(message);
        });
      return new Response(null, { status: 200 });
    },
  };
}

function aborted(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) =>
    signal.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    }),
  );
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : "error desconocido";
}
