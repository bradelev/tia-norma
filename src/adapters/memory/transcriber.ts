import type { Transcriber } from "../../ports/transcriber";

/** Hears the audio's bytes as UTF-8 text, so a test records an audio by encoding a phrase. */
export function createMemoryTranscriber(): Transcriber {
  return {
    async transcribe({ bytes }) {
      return new TextDecoder().decode(bytes);
    },
  };
}
