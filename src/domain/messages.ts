/** What Norma sends, already downloaded and normalized by the messenger adapter. */
export type Incoming =
  | { kind: "text"; text: string }
  /** An audio, already transcribed. */
  | { kind: "audio"; text: string }
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
  /** Up to 10 rows behind one button, to pick a piece with a tap. */
  list?: { button: string; rows: Row[] };
}

/** A row of a list: tapped, it arrives like a button with its id. */
export interface Row extends Button {
  description: string;
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
