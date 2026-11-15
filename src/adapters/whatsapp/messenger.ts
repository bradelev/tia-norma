import { z } from "zod";
import type { Reply } from "../../domain/messages";
import type { Messenger } from "../../ports/messenger";

const GRAPH = "https://graph.facebook.com/v23.0";

/** What Meta answers when asked for a media id. */
const mediaInfo = z.object({ url: z.url(), mime_type: z.string().min(1) });

export interface CloudApiSettings {
  token: string;
  phoneNumberId: string;
  /** Replaced in tests; the Graph API in production. */
  fetch?: typeof globalThis.fetch;
}

export function createCloudApiMessenger({
  token,
  phoneNumberId,
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

/** The reply's own message: buttons win, with the image on top of them. */
function message({ text, image, buttons }: Reply): object {
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
  if (image) return photo(image, text);
  return { type: "text", text: { body: text } };
}

function photo(link: string, caption: string): object {
  return { type: "image", image: { link, caption } };
}
