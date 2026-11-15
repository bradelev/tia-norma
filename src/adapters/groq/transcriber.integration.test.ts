import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { createGroqTranscriber } from "./transcriber";

const apiKey = process.env.GROQ_API_KEY;

it.skipIf(!apiKey)("Groq transcribe un audio real de Norma", async () => {
  const transcriber = createGroqTranscriber({ apiKey: apiKey ?? "" });
  const bytes = new Uint8Array(await readFile("evals/audios/01.m4a"));

  const said = await transcriber.transcribe({
    bytes,
    contentType: "audio/mp4",
  });

  expect(said.toLowerCase()).toContain("taza azul");
});
