import { describe, expect, it } from "vitest";
import { createGroqTranscriber } from "./transcriber";

const voice = {
  bytes: new Uint8Array([1, 2, 3]),
  contentType: "audio/ogg; codecs=opus",
};

/** Records each request to Groq and answers with `answer`. */
function fakeGroq(answer: () => Promise<Response>) {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return answer();
  };
  const transcriber = createGroqTranscriber({
    apiKey: "clave-de-prueba",
    fetch,
    timeoutMs: 50,
  });
  return { transcriber, calls };
}

describe("transcriptor con Groq", () => {
  it("pide Whisper large-v3 en español y devuelve el texto", async () => {
    const groq = fakeGroq(async () =>
      Response.json({ text: " Taza azul, seis mil. " }),
    );

    expect(await groq.transcriber.transcribe(voice)).toBe(
      "Taza azul, seis mil.",
    );
    const [{ url, init } = { url: "", init: undefined }] = groq.calls;
    expect(url).toBe("https://api.groq.com/openai/v1/audio/transcriptions");
    expect(init?.headers).toEqual({ Authorization: "Bearer clave-de-prueba" });
    const form = init?.body as FormData;
    expect(form.get("model")).toBe("whisper-large-v3");
    expect(form.get("language")).toBe("es");
    expect((form.get("file") as File).name).toBe("audio.ogg");
  });

  it("si Groq falla, avisa solo el estado", async () => {
    const groq = fakeGroq(async () =>
      Response.json({ error: { message: "Taza azul" } }, { status: 503 }),
    );

    await expect(groq.transcriber.transcribe(voice)).rejects.toThrow(
      /^Groq respondió 503$/,
    );
  });

  it("si tarda más que el límite, se rinde", async () => {
    const groq = fakeGroq(() => new Promise(() => {}));

    await expect(groq.transcriber.transcribe(voice)).rejects.toThrow();
  });
});
