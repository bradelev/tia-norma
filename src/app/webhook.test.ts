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
import { createMemoryMessenger } from "../adapters/memory/messenger";
import { createMemoryWorkshop } from "../adapters/memory/workshop";
import { createWebhook } from "./webhook";

const NORMA = "5491100000000";
const APP_SECRET = "secreto-de-prueba";

function sign(body: string, secret = APP_SECRET) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

/** The webhook wired to in-memory doubles, receiving what Meta would send. */
function setup({ photos = true } = {}) {
  const { bot, catalog } = createMemoryWorkshop();
  const photo = { bytes: new Uint8Array([1, 2, 3]), contentType: "image/jpeg" };
  const messenger = createMemoryMessenger(
    photos ? { "300000000000003": photo } : {},
  );
  const webhook = createWebhook({
    appSecret: APP_SECRET,
    verifyToken: "token-de-verificacion",
    authorized: [NORMA],
    messenger,
    catalog,
    bot,
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

  it("un audio recibe ayuda; una reacción o un sticker, nada", async () => {
    const { deliver, texts } = setup();

    await deliver(reaction);
    await deliver(sticker);
    await deliver(audio);

    expect(texts()).toEqual([
      "Por ahora entiendo fotos y texto. Escribime el nombre y el precio.",
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
