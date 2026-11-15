import { z } from "zod";
import type { Transcriber } from "../../ports/transcriber";

const ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
/** Not turbo: `pnpm eval:audio` gave 16 of 21 against turbo's 14 (ADR 0003). */
const MODEL = "whisper-large-v3";

/**
 * R10 gives the whole message 15 s. The slowest audio in `pnpm eval:audio`
 * took 1.1 s; this leaves the download and the interpreter's 5 s their share.
 */
const TIMEOUT_MS = 4_000;

const answer = z.object({ text: z.string() });

/** Groq reads the format from the file name, not from the content type. */
const EXTENSIONS: Record<string, string> = {
  ogg: "ogg",
  mpeg: "mp3",
  mp4: "m4a",
  "x-m4a": "m4a",
};

export interface GroqSettings {
  apiKey: string;
  /** Replaced in tests; Groq's API in production. */
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

export function createGroqTranscriber({
  apiKey,
  fetch = globalThis.fetch,
  timeoutMs = TIMEOUT_MS,
}: GroqSettings): Transcriber {
  return {
    async transcribe({ bytes, contentType }) {
      const subtype = /^audio\/([\w.-]+)/.exec(contentType)?.[1] ?? "ogg";
      const form = new FormData();
      form.append(
        "file",
        new Blob([new Uint8Array(bytes)], { type: contentType }),
        `audio.${EXTENSIONS[subtype] ?? subtype}`,
      );
      form.append("model", MODEL);
      form.append("language", "es");
      form.append("temperature", "0");
      form.append("response_format", "json");

      const signal = AbortSignal.timeout(timeoutMs);
      const timedOut = new Promise<never>((_, reject) =>
        signal.addEventListener("abort", () => reject(signal.reason)),
      );
      const response = await Promise.race([
        fetch(ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
          signal,
        }),
        timedOut,
      ]);
      // Only the status: the error body or the text could repeat what she said.
      if (!response.ok) throw new Error(`Groq respondió ${response.status}`);
      const parsed = answer.safeParse(await response.json());
      if (!parsed.success) throw new Error("Groq respondió otra cosa");
      return parsed.data.text.trim();
    },
  };
}
