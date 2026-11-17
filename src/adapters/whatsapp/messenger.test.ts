import { describe, expect, it } from "vitest";
import { createCloudApiMessenger } from "./messenger";

const NORMA = "5491100000000";

/** Records every call to the Graph API and answers like Meta does. */
function fakeGraph(
  answer: (url: string) => Response = () => sent(),
  siteUrl?: string,
) {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return answer(String(input));
  };
  const messenger = createCloudApiMessenger({
    token: "token-de-prueba",
    phoneNumberId: "100000000000001",
    siteUrl,
    fetch,
  });
  const bodies = () =>
    calls.map(({ init }) => JSON.parse(String(init?.body)) as unknown);
  return { messenger, calls, bodies };
}

function sent() {
  return Response.json({
    messaging_product: "whatsapp",
    contacts: [{ input: NORMA, wa_id: NORMA }],
    messages: [{ id: "wamid.SALIENTE1" }],
  });
}

const photo = (link: string, caption: string) =>
  expect.objectContaining({ type: "image", image: { link, caption } });

describe("mensajero de la Cloud API", () => {
  it("manda un texto al número de Norma", async () => {
    const graph = fakeGraph();

    await graph.messenger.send(NORMA, { text: "Listo. Es la pieza 1." });

    expect(graph.calls[0]?.url).toBe(
      "https://graph.facebook.com/v25.0/100000000000001/messages",
    );
    expect(graph.calls[0]?.init?.headers).toMatchObject({
      Authorization: "Bearer token-de-prueba",
    });
    expect(graph.bodies()).toEqual([
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: NORMA,
        type: "text",
        text: { body: "Listo. Es la pieza 1." },
      },
    ]);
  });

  it("un audio grabado va como nota de voz del sitio, antes del texto", async () => {
    const graph = fakeGraph(undefined, "https://taller.example");

    await graph.messenger.send(NORMA, {
      text: "No me salió. Probá de nuevo.",
      audio: "/audios/try-again.ogg",
    });

    expect(graph.bodies()).toEqual([
      expect.objectContaining({
        type: "audio",
        audio: {
          link: "https://taller.example/audios/try-again.ogg",
          voice: true,
        },
      }),
      expect.objectContaining({
        type: "text",
        text: { body: "No me salió. Probá de nuevo." },
      }),
    ]);
  });

  it("si la nota de voz no sale, el texto sale igual", async () => {
    let calls = 0;
    const graph = fakeGraph(
      () => (++calls === 1 ? new Response(null, { status: 400 }) : sent()),
      "https://taller.example",
    );

    await graph.messenger.send(NORMA, {
      text: "No me salió. Probá de nuevo.",
      audio: "/audios/try-again.ogg",
    });

    expect(graph.bodies().at(-1)).toMatchObject({ type: "text" });
  });

  it("sin la dirección del sitio, manda solo el texto", async () => {
    const graph = fakeGraph();

    await graph.messenger.send(NORMA, {
      text: "No me salió. Probá de nuevo.",
      audio: "/audios/try-again.ogg",
    });

    expect(graph.bodies()).toEqual([expect.objectContaining({ type: "text" })]);
  });

  it("manda la vista previa como un solo mensaje con foto y botones", async () => {
    const graph = fakeGraph();

    await graph.messenger.send(NORMA, {
      text: "Taza azul, $ 6.000",
      image: "https://fotos.ejemplo/taza.jpg",
      buttons: [
        { id: "publish:p1", title: "Sí, publicar" },
        { id: "fix:p1", title: "No, corregir" },
      ],
    });

    expect(graph.bodies()).toEqual([
      expect.objectContaining({
        type: "interactive",
        interactive: {
          type: "button",
          header: {
            type: "image",
            image: { link: "https://fotos.ejemplo/taza.jpg" },
          },
          body: { text: "Taza azul, $ 6.000" },
          action: {
            buttons: [
              {
                type: "reply",
                reply: { id: "publish:p1", title: "Sí, publicar" },
              },
              { type: "reply", reply: { id: "fix:p1", title: "No, corregir" } },
            ],
          },
        },
      }),
    ]);
  });

  it("sin botones, manda la foto con el texto al pie", async () => {
    const graph = fakeGraph();

    await graph.messenger.send(NORMA, {
      text: "La pieza 3 volvió a la página",
      image: "https://fotos.ejemplo/jarra.jpg",
    });

    expect(graph.bodies()).toEqual([
      photo("https://fotos.ejemplo/jarra.jpg", "La pieza 3 volvió a la página"),
    ]);
  });

  it("para elegir, manda cada foto con su número y después la pregunta", async () => {
    const graph = fakeGraph();

    await graph.messenger.send(NORMA, {
      text: "¿Cuál? Decime el número.",
      album: [
        { image: "https://fotos.ejemplo/a.jpg", caption: "La 2, Taza azul" },
        { image: "https://fotos.ejemplo/b.jpg", caption: "La 5, Taza azul" },
      ],
    });

    expect(graph.bodies()).toEqual([
      photo("https://fotos.ejemplo/a.jpg", "La 2, Taza azul"),
      photo("https://fotos.ejemplo/b.jpg", "La 5, Taza azul"),
      expect.objectContaining({
        type: "text",
        text: { body: "¿Cuál? Decime el número." },
      }),
    ]);
  });

  it("para elegir de una lista, manda las fotos y después la lista", async () => {
    const graph = fakeGraph();
    const row = { id: "takeDown:2", title: "2. Taza azul", description: "$ 1" };

    await graph.messenger.send(NORMA, {
      text: "¿Cuál sacás?",
      album: [{ image: "https://fotos.ejemplo/a.jpg", caption: "La 2" }],
      list: { button: "Ver piezas", rows: [row] },
    });

    expect(graph.bodies()).toEqual([
      photo("https://fotos.ejemplo/a.jpg", "La 2"),
      expect.objectContaining({
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: "¿Cuál sacás?" },
          action: { button: "Ver piezas", sections: [{ rows: [row] }] },
        },
      }),
    ]);
  });

  it("si Meta rechaza el envío, falla sin repetir lo que Meta contestó", async () => {
    const graph = fakeGraph(() =>
      Response.json(
        { error: { message: `Recipient ${NORMA} not allowed`, code: 131030 } },
        { status: 400 },
      ),
    );

    const sending = graph.messenger.send(NORMA, { text: "Hola" });

    await expect(sending).rejects.toThrow("WhatsApp respondió 400");
    await expect(sending).rejects.not.toThrow(NORMA);
  });

  it("baja una foto por su id: primero pide la URL y después los bytes", async () => {
    const lookaside =
      "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=200000000000001";
    const graph = fakeGraph((url) =>
      url === lookaside
        ? new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))
        : Response.json({
            messaging_product: "whatsapp",
            url: lookaside,
            mime_type: "image/jpeg",
            sha256: "c2hhMjU2LWZhbHNv",
            file_size: "4",
            id: "200000000000001",
          }),
    );

    const media = await graph.messenger.download("200000000000001");

    expect(media).toEqual({
      bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
      contentType: "image/jpeg",
    });
    expect(graph.calls.map((call) => call.url)).toEqual([
      "https://graph.facebook.com/v25.0/200000000000001",
      lookaside,
    ]);
    // The lookaside URL only answers with the token.
    expect(graph.calls[1]?.init?.headers).toMatchObject({
      Authorization: "Bearer token-de-prueba",
    });
  });
});
