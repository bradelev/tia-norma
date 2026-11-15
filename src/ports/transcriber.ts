import type { Media } from "./messenger";

export interface Transcriber {
  /** What Norma said in the audio. Throws if it can't tell, and nothing changes. */
  transcribe(audio: Media): Promise<string>;
}
