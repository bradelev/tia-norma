import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import audio from "../adapters/whatsapp/fixtures/audio.json";
import button from "../adapters/whatsapp/fixtures/button.json";
import imageCaption from "../adapters/whatsapp/fixtures/image-caption.json";
import image from "../adapters/whatsapp/fixtures/image.json";
import reaction from "../adapters/whatsapp/fixtures/reaction.json";
import sticker from "../adapters/whatsapp/fixtures/sticker.json";
import stranger from "../adapters/whatsapp/fixtures/stranger.json";
import text from "../adapters/whatsapp/fixtures/text.json";
import { createMemoryInterpreter } from "../adapters/memory/interpreter";
import { createMemoryMessenger } from "../adapters/memory/messenger";
import { createMemoryTranscriber } from "../adapters/memory/transcriber";
import { createMemoryWorkshop } from "../adapters/memory/workshop";
import type { Interpreter } from "../ports/interpreter";
import type { Transcriber } from "../ports/transcriber";
import { createWebhook } from "./webhook";

const NORMA = "5491100000000";
const APP_SECRET = "secreto-de-prueba";

function sign(body: string, secret = APP_SECRET) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

/** The webhook wired to in-memory doubles, receiving what Meta would send. */
function setup({
  photos = true,
  interpreter = createMemoryInterpreter(),
  transcriber = createMemoryTranscriber(),
}: {
  photos?: boolean;
  interpreter?: Interpreter;
  transcriber?: Transcriber;
} = {}) {
  const { bot, catalog } = createMemoryWorkshop({ interpreter });
  const photo = { bytes: new Uint8Array([1, 2, 3]), contentType: "image/jpeg" };
  // The memory transcriber hears the bytes as text.
  const voice = {
    bytes: new TextEncoder().encode("Taza azul, seis mil"),
    contentType: "audio/ogg; codecs=opus",
  };
  const messenger = createMemoryMessenger({
    ...(photos && { "300000000000003": photo }),
    "300000000000004": voice,
  });
  const webhook = createWebhook({
    appSecret: APP_SECRET,
    verifyToken: "token-de-verificacion",
    authorized: [NORMA],
    messenger,
    catalog,
    bot,
    transcriber,
    limitMs: 50,
  });

  /** Posts a payload like Meta does and waits for the work left for after the 200. */
  async function deliver(payload: object, signature?: string) {
    const body = JSON.stringify(payload);
    const request = new Request("https://ejemplo.test/api/whatsapp", {
      method: "POST",
      headers: { "x-hub-signature-256": signature ?? sign(body) },
      body,
    });
    const later: Promise<void>[] = [];
    const response = await webhook.receive(request, (work) => {
      later.push(work());
    });
    await Promise.all(later);
    return response;
  }

  const texts = () => messenger.sent.map(({ reply }) => reply.text);
  return { deliver, texts, sent: messenger.sent, catalog, webhook };
}

describe("webhook de WhatsApp", () => {
  it("una firma inválida devuelve 401 y no responde nada", async () => {
    const { deliver, sent } = setup();

    const body = JSON.stringify(text);
    const response = await deliver(text, sign(body, "otro-secreto"));

    expect(response.status).toBe(401);
    expect(sent).toEqual([]);
  });

  it("foto, texto y botón publican una pieza", async () => {
    const { deliver, texts, catalog } = setup();

    await deliver(image);
    await deliver(text);
    await deliver(button);

    expect(texts()).toEqual([
      "¿Cómo se llama la pieza y cuánto sale?",
      "Taza azul, $ 6.000",
      "Listo. Es la pieza 1.",
    ]);
    expect(await catalog.published()).toHaveLength(1);
  });

  it("un número no autorizado no recibe respuesta", async () => {
    const { deliver, sent } = setup();

    const response = await deliver(stranger);

    expect(response.status).toBe(200);
    expect(sent).toEqual([]);
  });

  it("el mismo mensaje entregado dos veces produce un solo efecto", async () => {
    const { deliver, texts } = setup();

    await deliver(image);
    await deliver(image);

    expect(texts()).toEqual(["¿Cómo se llama la pieza y cuánto sale?"]);
  });

  it("una foto con pie abre la vista previa", async () => {
    const { deliver, sent } = setup();

    await deliver(imageCaption);

    expect(sent).toEqual([
      {
        to: NORMA,
        reply: expect.objectContaining({ text: "Taza azul, $ 6.000" }),
      },
    ]);
  });

  it("un audio y un texto con lo mismo dan la misma vista previa (R3)", async () => {
    const written = setup();
    const spoken = setup();

    await written.deliver(image);
    await written.deliver(text);
    await spoken.deliver(image);
    await spoken.deliver(audio);

    expect(spoken.sent.at(-1)?.reply.buttons?.[0]?.title).toBe("Sí, publicar");
    expect(spoken.sent).toEqual(written.sent);
  });

  it("si no entiende un audio, Norma recibe lo que se escuchó", async () => {
    const lost = { interpret: async () => ({ kind: "unknown" as const }) };
    const { deliver, texts } = setup({ interpreter: lost });

    await deliver(audio);

    expect(texts()).toEqual([
      'Escuché: "Taza azul, seis mil". No te entendí, ¿me lo decís de nuevo?',
    ]);
  });

  it("si la transcripción falla, Norma recibe probá de nuevo y el borrador no cambia", async () => {
    const deaf = { transcribe: () => Promise.reject(new Error("Groq 503")) };
    const { deliver, texts, catalog } = setup({ transcriber: deaf });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await deliver(image);
    const before = await catalog.draft();
    await deliver(audio);

    expect(texts().at(-1)).toBe("No me salió. Probá de nuevo.");
    expect(await catalog.draft()).toEqual(before);
    log.mockRestore();
  });

  it("un video recibe ayuda; una reacción o un sticker, nada", async () => {
    const { deliver, texts } = setup();
    const video = structuredClone(audio);
    video.entry[0]!.changes[0]!.value.messages[0]!.type = "video";

    await deliver(reaction);
    await deliver(sticker);
    await deliver(video);

    expect(texts()).toEqual([
      "Por ahora entiendo fotos, texto y audios. Escribime el nombre y el precio.",
    ]);
  });

  it("si falla el procesamiento, Norma recibe probá de nuevo y el log no la nombra", async () => {
    const { deliver, texts } = setup({ photos: false });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await deliver(image);

    expect(texts()).toEqual(["No me salió. Probá de nuevo."]);
    expect(JSON.stringify(log.mock.calls)).not.toContain(NORMA);
    log.mockRestore();
  });

  it("pasado el límite, Norma recibe probá de nuevo y el resultado tardío no se aplica", async () => {
    const slow = heldInterpreter();
    const { deliver, texts, catalog } = setup({ interpreter: slow });
    await deliver(image);
    await deliver(text);
    await deliver(button);

    slow.hold();
    await deliver(saying("vendí la 1", "wamid.vendi"));
    slow.release();
    await new Promise((done) => setTimeout(done, 0));

    expect(texts().at(-1)).toBe("No me salió. Probá de nuevo.");
    expect(texts()).toHaveLength(4);
    expect(await catalog.published()).toHaveLength(1);
  });

  it("verifica la URL con el token y rechaza otro", () => {
    const { webhook } = setup();
    const url = (token: string) =>
      new URL(
        `https://ejemplo.test/api/whatsapp?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=1158201444`,
      );

    expect(webhook.verify(url("token-de-verificacion")).status).toBe(200);
    expect(webhook.verify(url("otro")).status).toBe(403);
  });
});

/** The text fixture with other words and id, as a new message from Norma. */
function saying(body: string, id: string) {
  const payload = structuredClone(text);
  const message = payload.entry[0]!.changes[0]!.value.messages[0]!;
  message.text.body = body;
  message.id = id;
  return payload;
}

/** The rule-based interpreter, which answers only after `release` while held. */
function heldInterpreter(): Interpreter & { hold(): void; release(): void } {
  const rules = createMemoryInterpreter();
  let held: Promise<void> | null = null;
  let release = () => {};
  return {
    async interpret(said) {
      if (held) await held;
      return rules.interpret(said);
    },
    hold() {
      held = new Promise((done) => (release = done));
    },
    release: () => release(),
  };
}
