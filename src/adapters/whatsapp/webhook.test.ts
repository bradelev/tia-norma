import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import audio from "./fixtures/audio.json";
import button from "./fixtures/button.json";
import imageCaption from "./fixtures/image-caption.json";
import image from "./fixtures/image.json";
import reaction from "./fixtures/reaction.json";
import status from "./fixtures/status.json";
import sticker from "./fixtures/sticker.json";
import text from "./fixtures/text.json";
import { isSignedByMeta, parseMessages } from "./webhook";

const APP_SECRET = "secreto-de-prueba";
const NORMA = "5491100000000";

const bytes = (payload: object) =>
  new TextEncoder().encode(JSON.stringify(payload));

function sign(body: Uint8Array, secret = APP_SECRET) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

describe("firma de Meta", () => {
  const body = bytes(text);

  it("acepta el cuerpo firmado con la clave de la app", () => {
    expect(isSignedByMeta(body, sign(body), APP_SECRET)).toBe(true);
  });

  it("rechaza otra clave, un cuerpo cambiado o la firma ausente", () => {
    const changed = bytes({ ...text, object: "otro" });

    expect(isSignedByMeta(body, sign(body, "otra"), APP_SECRET)).toBe(false);
    expect(isSignedByMeta(changed, sign(body), APP_SECRET)).toBe(false);
    expect(isSignedByMeta(body, null, APP_SECRET)).toBe(false);
  });
});

describe("mensajes de un webhook", () => {
  it("lee un texto, una foto y un botón", () => {
    expect(parseMessages(bytes(text))).toEqual([
      {
        id: text.entry[0]?.changes[0]?.value.messages[0]?.id,
        from: NORMA,
        content: { kind: "text", text: "Taza azul, seis mil" },
      },
    ]);
    expect(parseMessages(bytes(image))?.[0]?.content).toEqual({
      kind: "photo",
      mediaId: "300000000000003",
    });
    expect(parseMessages(bytes(button))?.[0]?.content).toEqual({
      kind: "button",
      id: "publish:p1",
    });
  });

  it("una foto trae su pie, si tiene", () => {
    expect(parseMessages(bytes(imageCaption))?.[0]?.content).toEqual({
      kind: "photo",
      mediaId: "300000000000003",
      caption: "Taza azul, seis mil",
    });
  });

  it("una reacción o un sticker se ignoran", () => {
    expect(parseMessages(bytes(reaction))?.[0]?.content).toEqual({
      kind: "ignored",
    });
    expect(parseMessages(bytes(sticker))?.[0]?.content).toEqual({
      kind: "ignored",
    });
  });

  it("un audio trae el id para bajarlo", () => {
    expect(parseMessages(bytes(audio))?.[0]?.content).toEqual({
      kind: "audio",
      mediaId: "300000000000004",
    });
  });

  it("un aviso de entrega no trae mensajes", () => {
    expect(parseMessages(bytes(status))).toEqual([]);
  });

  it("lo que no es un webhook de Meta da null", () => {
    expect(parseMessages(bytes({ hola: "mundo" }))).toBeNull();
    expect(parseMessages(new TextEncoder().encode("no es json"))).toBeNull();
  });
});
