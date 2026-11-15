/** What Norma sends, already downloaded and normalized by the messenger adapter. */
export type Incoming =
  | { kind: "text"; text: string }
  | { kind: "photo"; bytes: Uint8Array }
  | { kind: "button"; id: string };

export interface Button {
  id: string;
  title: string;
}

/** What the bot answers: one short phrase, optionally an image and up to two buttons. */
export interface Reply {
  text: string;
  image?: string;
  buttons?: [Button] | [Button, Button];
  /** Several photos with a caption each, sent before the text, when Norma has to pick one. */
  album?: { image: string; caption: string }[];
}

/**
 * The replies the PRD wants as audios recorded by a person. They go as text
 * until the recordings exist; swapping them for audio only touches this.
 */
export const FIXED_REPLIES = {
  help: {
    text: "Para publicar, mandame una foto de la pieza y decime cómo se llama y cuánto sale.",
  },
  tryAgain: { text: "No me salió. Probá de nuevo." },
} as const satisfies Record<string, Reply>;
