import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { createGroqTranscriber } from "./transcriber";

const apiKey = process.env.GROQ_API_KEY;

/** The audio is a synthetic voice: it checks that Groq answers, not how well it hears Norma. */
it.skipIf(!apiKey)("Groq transcribe un audio", async () => {
  const transcriber = createGroqTranscriber({ apiKey: apiKey ?? "" });
  const bytes = new Uint8Array(
    await readFile("src/adapters/groq/jarra-con-relieve.m4a"),
  );

  const said = await transcriber.transcribe({
    bytes,
    contentType: "audio/mp4",
  });

  expect(said.toLowerCase()).toContain("jarra con relieve");
});
