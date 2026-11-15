import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** What a WhatsApp message brings, before the photo is downloaded. */
export type Content =
  | { kind: "text"; text: string }
  | { kind: "photo"; mediaId: string; caption?: string }
  | { kind: "button"; id: string }
  /** Reactions and stickers: no answer at all. */
  | { kind: "ignored" }
  /** Audio and anything else the bot does not read yet. */
  | { kind: "other" };

export interface WhatsAppMessage {
  /** Meta's id (wamid), the same on every redelivery. */
  id: string;
  from: string;
  content: Content;
}

const message = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  image: z
    .object({ id: z.string().min(1), caption: z.string().optional() })
    .optional(),
  interactive: z
    .object({ button_reply: z.object({ id: z.string().min(1) }).optional() })
    .optional(),
});

/** Only the parts the bot reads. Delivery statuses come without messages. */
const payload = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          value: z.object({ messages: z.array(message).optional() }),
        }),
      ),
    }),
  ),
});

/** True if Meta signed the body with the app secret (`X-Hub-Signature-256`). */
export function isSignedByMeta(
  body: Uint8Array,
  signature: string | null,
  appSecret: string,
): boolean {
  const digest = createHmac("sha256", appSecret).update(body).digest("hex");
  return sameText(signature ?? "", `sha256=${digest}`);
}

/** Compares in constant time, so a wrong guess does not reveal how close it was. */
export function sameText(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The messages in a webhook body, or null if it is not what Meta sends. */
export function parseMessages(body: Uint8Array): WhatsAppMessage[] | null {
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return null;
  }
  const parsed = payload.safeParse(json);
  if (!parsed.success) return null;
  return parsed.data.entry
    .flatMap(({ changes }) => changes)
    .flatMap(({ value }) => value.messages ?? [])
    .map(({ id, from, ...rest }) => ({ id, from, content: content(rest) }));
}

function content({
  type,
  text,
  image,
  interactive,
}: Omit<z.infer<typeof message>, "id" | "from">): Content {
  const button = interactive?.button_reply;
  if (type === "text" && text) return { kind: "text", text: text.body };
  if (type === "image" && image) {
    const { id: mediaId, caption } = image;
    return { kind: "photo", mediaId, ...(caption && { caption }) };
  }
  if (type === "interactive" && button)
    return { kind: "button", id: button.id };
  if (type === "reaction" || type === "sticker") return { kind: "ignored" };
  return { kind: "other" };
}
