import { z } from "zod";
import type { Reply } from "../../domain/messages";
import type { Messenger } from "../../ports/messenger";

const GRAPH = "https://graph.facebook.com/v25.0";

/** What Meta answers when asked for a media id. */
const mediaInfo = z.object({ url: z.url(), mime_type: z.string().min(1) });

export interface CloudApiSettings {
  token: string;
  phoneNumberId: string;
  /** Where the site serves the recorded audios; without it they are left out. */
  siteUrl?: string | undefined;
  /** Replaced in tests; the Graph API in production. */
  fetch?: typeof globalThis.fetch;
}

export function createCloudApiMessenger({
  token,
  phoneNumberId,
  siteUrl,
  fetch = globalThis.fetch,
}: CloudApiSettings): Messenger {
  const auth = { Authorization: `Bearer ${token}` };

  /** A GET, or a JSON POST when there is a body. */
  async function call(url: string, body?: object) {
    const init: RequestInit = body
      ? {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { headers: auth };
    const response = await fetch(url, init);
    // Only the status: Meta's error body can echo the message back.
    if (!response.ok) throw new Error(`WhatsApp respondió ${response.status}`);
    return response;
  }

  function post(to: string, message: object) {
    return call(`${GRAPH}/${phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      ...message,
    });
  }

  return {
    async send(to, reply) {
      // One after another: WhatsApp shows them in the order they arrive.
      // The voice note goes with the text and never stops it: the text alone still answers.
      if (reply.audio && siteUrl)
        await post(to, voiceNote(new URL(reply.audio, siteUrl).href)).catch(
          () => undefined,
        );
      for (const { image, caption } of reply.album ?? [])
        await post(to, photo(image, caption));
      await post(to, message(reply));
    },
    async download(mediaId) {
      const info = mediaInfo.parse(
        await (await call(`${GRAPH}/${mediaId}`)).json(),
      );
      const file = await call(info.url);
      return {
        bytes: new Uint8Array(await file.arrayBuffer()),
        contentType: info.mime_type,
      };
    },
  };
}

/** The reply's own message: buttons win, with the image on top of them, then a list. */
function message({ text, image, buttons, list }: Reply): object {
  if (buttons)
    return {
      type: "interactive",
      interactive: {
        type: "button",
        ...(image && { header: { type: "image", image: { link: image } } }),
        body: { text },
        action: {
          buttons: buttons.map((reply) => ({ type: "reply", reply })),
        },
      },
    };
  if (list)
    return {
      type: "interactive",
      interactive: {
        type: "list",
        body: { text },
        action: { button: list.button, sections: [{ rows: list.rows }] },
      },
    };
  if (image) return photo(image, text);
  return { type: "text", text: { body: text } };
}

/** Ogg with OPUS, as WhatsApp needs to show it as a voice message. */
function voiceNote(link: string): object {
  return { type: "audio", audio: { link, voice: true } };
}

function photo(link: string, caption: string): object {
  return { type: "image", image: { link, caption } };
}
