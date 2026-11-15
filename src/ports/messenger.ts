import type { Reply } from "../domain/messages";

/** A photo or audio Norma sent, as WhatsApp hands it over. */
export interface Media {
  bytes: Uint8Array;
  contentType: string;
}

export interface Messenger {
  /** Sends a reply to a WhatsApp number, in as many messages as it takes. */
  send(to: string, reply: Reply): Promise<void>;
  /** Fetches a photo or audio by the id that came in the webhook. */
  download(mediaId: string): Promise<Media>;
}
