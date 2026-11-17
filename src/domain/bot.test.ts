import { describe, expect, it } from "vitest";
import { BLURRY_PHOTO, DARK_PHOTO } from "../adapters/memory/image-processor";
import { createMemoryWorkshop } from "../adapters/memory/workshop";
import type { PreviewRenderer } from "../ports/preview-renderer";

describe("publicar una pieza", () => {
  it("con foto y texto, muestra la vista previa y publica al tocar Sí", async () => {
    const norma = createMemoryWorkshop();

    await norma.sendPhoto();
    const preview = await norma.say("taza azul, seis mil");

    expect(preview.text).toBe("Taza azul, $ 6.000");
    expect(preview.image).toBeDefined();
    expect(preview.buttons?.map((b) => b.title)).toEqual([
      "Sí, publicar",
      "No, corregir",
    ]);

    const done = await norma.tap("Sí, publicar");

    expect(done.text).toBe("Listo. Es la pieza 1.");
    expect(await norma.publishedPieces()).toEqual([
      {
        number: 1,
        name: "Taza azul",
        price: 6000,
        image: norma.drawnSlips()[0]?.photo,
      },
    ]);
  });
});

describe("la vista previa es la boleta", () => {
  it("una pieza nueva muestra en el talón el número que va a tener", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();
    await norma.say("taza azul, seis mil");
    await norma.tap("Sí, publicar");

    await norma.sendPhoto();
    const preview = await norma.say("plato hondo, ocho mil");

    const slip = norma.drawnSlips().at(-1);
    expect(slip).toMatchObject({ number: 2, name: "Plato hondo", price: 8000 });
    expect(preview.image).toBe(norma.storedPhotos().at(-1)?.url);
    expect(preview.image).not.toBe(slip?.photo);

    await norma.tap("Sí, publicar");
    const [plate] = await norma.publishedPieces();
    expect(plate).toMatchObject({ number: 2, image: slip?.photo });
  });

  it("un cambio de precio muestra el número de la pieza con el precio nuevo", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();
    await norma.say("taza azul, seis mil");
    await norma.tap("Sí, publicar");
    const [cup] = await norma.publishedPieces();

    await norma.say("la 1 ahora sale ocho mil");

    expect(norma.drawnSlips().at(-1)).toEqual({
      number: 1,
      name: "Taza azul",
      price: 8000,
      photo: cup?.image,
    });
  });

  it("si la boleta no se puede dibujar, manda la foto con el texto", async () => {
    const broken: PreviewRenderer = {
      render: () => Promise.reject(new Error("sin fuentes")),
    };
    const norma = createMemoryWorkshop({ previews: broken });
    await norma.sendPhoto();

    const preview = await norma.say("taza azul, seis mil");

    expect(preview.text).toBe("Taza azul, $ 6.000");
    expect(preview.image).toBe(norma.storedPhotos().at(-1)?.url);
    await norma.tap("Sí, publicar");
    const [cup] = await norma.publishedPieces();
    expect(cup?.image).toBe(preview.image);
  });
});

describe("pide solo lo que falta", () => {
  it("sin foto, pide la foto", async () => {
    const norma = createMemoryWorkshop();

    const reply = await norma.say("taza azul, seis mil");

    expect(reply.text).toBe("Mandame una foto de la pieza.");
    expect(reply.buttons).toBeUndefined();
  });

  it("con el texto antes que la foto, la foto completa la vista previa", async () => {
    const norma = createMemoryWorkshop();

    await norma.say("taza azul, seis mil");
    const preview = await norma.sendPhoto();

    expect(preview.text).toBe("Taza azul, $ 6.000");
  });

  it("solo con la foto, pide nombre y precio", async () => {
    const norma = createMemoryWorkshop();

    const reply = await norma.sendPhoto();

    expect(reply.text).toBe("¿Cómo se llama la pieza y cuánto sale?");
  });

  it("con foto y nombre, pide solo el precio", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();

    const reply = await norma.say("taza azul");

    expect(reply.text).toBe("¿Cuánto sale?");
  });

  it("con foto y precio, pide solo el nombre", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();

    const reply = await norma.say("seis mil");

    expect(reply.text).toBe("¿Cómo se llama la pieza?");
  });
});

describe("corregir la vista previa", () => {
  async function withPreview() {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();
    const first = await norma.say("taza azul, seis mil");
    return { norma, first };
  }

  it('"No, corregir" pregunta qué cambiar y no publica nada', async () => {
    const { norma } = await withPreview();

    const reply = await norma.tap("No, corregir");

    expect(reply.text).toBe("¿Qué cambio?");
    expect(await norma.publishedPieces()).toEqual([]);
  });

  it("un precio nuevo arma otra vista previa con el resto igual", async () => {
    const { norma } = await withPreview();
    await norma.tap("No, corregir");

    const preview = await norma.say("siete mil");

    expect(preview.text).toBe("Taza azul, $ 7.000");
    expect(preview.buttons?.map((b) => b.title)).toEqual([
      "Sí, publicar",
      "No, corregir",
    ]);
  });

  it('un nombre y precio nuevos reemplazan los anteriores sin tocar "No"', async () => {
    const { norma } = await withPreview();

    const preview = await norma.say("plato hondo, ocho mil");

    expect(preview.text).toBe("Plato hondo, $ 8.000");
  });

  it("otra foto reemplaza la foto", async () => {
    const { norma, first } = await withPreview();

    const preview = await norma.sendPhoto();

    expect(preview.text).toBe("Taza azul, $ 6.000");
    expect(preview.image).not.toBe(first.image);
  });

  it('después de "No, corregir", un audio con solo el nombre conserva el precio', async () => {
    const { norma } = await withPreview();
    await norma.tap("No, corregir");

    const preview = await norma.speak("lápiz acrílico azul");

    expect(preview.text).toBe("Lápiz acrílico azul, $ 6.000");
  });

  it("un nombre nuevo con un precio que no se entiende conserva el precio anterior", async () => {
    const { norma } = await withPreview();

    const preview = await norma.say("plato hondo, carísima");

    expect(preview.text).toBe("Plato hondo, $ 6.000");
    expect(preview.buttons?.map((b) => b.title)).toEqual([
      "Sí, publicar",
      "No, corregir",
    ]);
  });

  it("publica lo corregido, no lo primero", async () => {
    const { norma } = await withPreview();
    await norma.say("siete mil");

    await norma.tap("Sí, publicar");

    expect(await norma.publishedPieces()).toMatchObject([
      { name: "Taza azul", price: 7000 },
    ]);
  });
});

describe("límites de precio y nombre", () => {
  it("un precio de más de diez millones se vuelve a preguntar", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();

    const reply = await norma.say("taza azul, veinte millones");

    expect(reply.text).toBe(
      "¿Cuánto sale? Decímelo en pesos, por ejemplo seis mil.",
    );
    expect(reply.buttons).toBeUndefined();
  });

  it("un precio que no se entiende se vuelve a preguntar", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();

    const reply = await norma.say("taza azul, carísima");

    expect(reply.text).toBe(
      "¿Cuánto sale? Decímelo en pesos, por ejemplo seis mil.",
    );
  });

  it("un nombre de más de 40 letras pide uno más corto", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();

    const reply = await norma.say(
      "taza azul con flores pintadas a mano por mi nieta, seis mil",
    );

    expect(reply.text).toBe("¿Me decís un nombre más corto? Hasta 40 letras.");
  });
});

describe('un "Sí" repetido o viejo', () => {
  it("tocar Sí dos veces publica una sola pieza y repite la confirmación", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();
    const preview = await norma.say("taza azul, seis mil");
    const yes = preview.buttons?.[0]?.id ?? "";

    await norma.pressButton(yes);
    const again = await norma.pressButton(yes);

    expect(again.text).toBe("Listo. Es la pieza 1.");
    expect(await norma.publishedPieces()).toHaveLength(1);
  });

  it("el Sí de una vista previa ya reemplazada no publica nada", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();
    const old = await norma.say("taza azul, seis mil");
    await norma.say("siete mil");

    const reply = await norma.pressButton(old.buttons?.[0]?.id ?? "");

    expect(reply.text).toBe(
      "Esa vista previa ya cambió. Fijate en la última que te mandé.",
    );
    expect(await norma.publishedPieces()).toEqual([]);
  });

  it("si vuelve a preguntar el precio, el Sí anterior no publica lo que ella no vio", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();
    const old = await norma.say("taza azul, seis mil");
    await norma.tap("No, corregir");
    await norma.say("El nombre, sacapuntas de gusanito");

    const reply = await norma.pressButton(old.buttons?.[0]?.id ?? "");

    expect(reply.text).toBe(
      "Esa vista previa ya cambió. Fijate en la última que te mandé.",
    );
    expect(await norma.publishedPieces()).toEqual([]);
  });

  it("después de publicar, la pieza siguiente lleva el número siguiente", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();
    await norma.say("taza azul, seis mil");
    await norma.tap("Sí, publicar");
    await norma.sendPhoto();
    await norma.say("plato, ocho mil");

    const done = await norma.tap("Sí, publicar");

    expect(done.text).toBe("Listo. Es la pieza 2.");
  });
});

describe("vista previa vencida", () => {
  const HOUR = 60 * 60 * 1000;

  it('un "Sí, publicar" pasadas 24 horas responde probá de nuevo y no publica', async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();
    await norma.say("taza azul, seis mil");

    norma.wait(24 * HOUR);
    const reply = await norma.tap("Sí, publicar");

    expect(reply).toEqual({
      text: "No me salió. Probá de nuevo.",
      audio: "/audios/try-again.ogg",
    });
    expect(await norma.publishedPieces()).toEqual([]);
  });

  it('un "Sí, cambiar" pasadas 24 horas no cambia el precio', async () => {
    const norma = await withPublished("taza azul, seis mil");
    await norma.say("la 1 ahora sale siete mil");

    norma.wait(25 * HOUR);
    const reply = await norma.tap("Sí, cambiar");

    expect(reply).toEqual({
      text: "No me salió. Probá de nuevo.",
      audio: "/audios/try-again.ogg",
    });
    expect(await norma.publishedPieces()).toMatchObject([{ price: 6000 }]);
  });

  it('un "Sí" antes de las 24 horas todavía publica', async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();
    await norma.say("taza azul, seis mil");

    norma.wait(24 * HOUR - 1);
    const reply = await norma.tap("Sí, publicar");

    expect(reply.text).toBe("Listo. Es la pieza 1.");
  });
});

describe("mensajes que no son una pieza", () => {
  it("antes de la primera pieza, un saludo recibe la bienvenida con su audio", async () => {
    const norma = createMemoryWorkshop();

    const reply = await norma.say("hola, ¿cómo andás?");

    expect(reply).toEqual({
      text: "Hola, Norma. Soy tu página. Para publicar, mandame una foto y decime cómo se llama y cuánto sale.",
      audio: "/audios/welcome.ogg",
    });
  });

  it("con piezas publicadas, un texto sin nombre ni precio responde con ayuda y su audio", async () => {
    const norma = await withPublished("taza azul, seis mil");

    const reply = await norma.say("hola, ¿cómo andás?");

    expect(reply.audio).toBe("/audios/help.ogg");
    expect(reply.text).toBe(
      "Para publicar, mandame una foto de la pieza y decime cómo se llama y cuánto sale.",
    );
  });
});

describe("un audio que no se entiende", () => {
  const help =
    "Para publicar, mandame una foto de la pieza y decime cómo se llama y cuánto sale.";

  it("dice qué escuchó y pide que lo repita", async () => {
    const norma = createMemoryWorkshop();

    const reply = await norma.speak("¿le pongo esmalte?");

    expect(reply.text).toBe(
      'Escuché: "¿le pongo esmalte?". No te entendí, ¿me lo decís de nuevo?',
    );
    expect(reply.audio).toBe("/audios/try-again.ogg");
  });

  it("si es largo, recorta lo que escuchó y no pasa de 160 letras", async () => {
    const norma = createMemoryWorkshop();

    const reply = await norma.speak(
      `¿${"y la del post de WhatsApp ".repeat(8)}?`,
    );

    expect(reply.text).toMatch(
      /^Escuché: "¿y la del post de WhatsApp .*…"\. No te entendí, ¿me lo decís de nuevo\?$/,
    );
    expect(reply.text.length).toBeLessThanOrEqual(160);
  });

  it("si no escuchó nada, responde con ayuda", async () => {
    const norma = await withPublished("taza azul, seis mil");

    const reply = await norma.speak("  ");

    expect(reply.text).toBe(help);
  });

  it("un texto que no se entiende sigue respondiendo con ayuda", async () => {
    const norma = await withPublished("taza azul, seis mil");

    const reply = await norma.say("¿le pongo esmalte?");

    expect(reply.text).toBe(help);
  });
});

async function withPublished(...pieces: string[]) {
  const norma = createMemoryWorkshop();
  for (const piece of pieces) {
    await norma.sendPhoto();
    await norma.say(piece);
    await norma.tap("Sí, publicar");
  }
  return norma;
}

describe("sacar una pieza", () => {
  it('"vendí la 2" la saca de la página y ofrece Deshacer', async () => {
    const norma = await withPublished("taza azul, seis mil", "plato, ocho mil");
    const [plate] = await norma.publishedPieces();

    const reply = await norma.say("vendí la 2");

    expect(reply.text).toBe("Saqué la pieza 2");
    expect(reply.image).toBe(plate?.image);
    expect(reply.buttons?.map((b) => b.title)).toEqual(["Deshacer"]);
    expect(await norma.publishedPieces()).toMatchObject([{ number: 1 }]);
  });

  it("una pieza ya sacada avisa y no cambia nada", async () => {
    const norma = await withPublished("taza azul, seis mil", "plato, ocho mil");
    await norma.say("vendí la 2");

    const reply = await norma.say("sacá la 2");

    expect(reply).toEqual({ text: "La 2 ya no está en la página" });
    expect(await norma.publishedPieces()).toMatchObject([{ number: 1 }]);
  });

  it("un número que nunca se publicó lo dice y no cambia nada", async () => {
    const norma = await withPublished("taza azul, seis mil");

    const reply = await norma.say("sacá la 9");

    expect(reply).toEqual({ text: "No tengo ninguna pieza 9" });
    expect(await norma.publishedPieces()).toHaveLength(1);
  });

  it("por nombre, sin importar tildes ni mayúsculas", async () => {
    const norma = await withPublished(
      "jarrón azul, seis mil",
      "plato, ocho mil",
    );

    const reply = await norma.say("vendí el JARRON");

    expect(reply.text).toBe("Saqué la pieza 1");
    expect(await norma.publishedPieces()).toMatchObject([{ name: "Plato" }]);
  });

  it("si el nombre coincide con varias, muestra las fotos y pregunta", async () => {
    const norma = await withPublished(
      "taza azul, seis mil",
      "plato, ocho mil",
      "taza roja, seis mil",
    );
    const [red, , blue] = await norma.publishedPieces();

    const reply = await norma.say("vendí la taza");

    expect(reply.text).toBe("¿Cuál sacás?");
    expect(reply.album).toEqual([
      { image: blue?.image, caption: "La 1, Taza azul" },
      { image: red?.image, caption: "La 3, Taza roja" },
    ]);
    expect(reply.list?.rows).toEqual([
      { id: "takeDown:1", title: "1. Taza azul", description: "$ 6.000" },
      { id: "takeDown:3", title: "3. Taza roja", description: "$ 6.000" },
    ]);
    expect(await norma.publishedPieces()).toHaveLength(3);
  });

  it("si el nombre no coincide con ninguna, muestra las publicadas para elegir", async () => {
    const norma = await withPublished("taza azul, seis mil", "plato, ocho mil");

    const reply = await norma.say("vendí la jarra");

    expect(reply.text).toBe(
      "No encontré ninguna pieza que se llame jarra. ¿Cuál sacás?",
    );
    expect(reply.list?.button).toBe("Ver piezas");
    expect(reply.list?.rows.map((row) => row.title)).toEqual([
      "2. Plato",
      "1. Taza azul",
    ]);
    expect(await norma.publishedPieces()).toHaveLength(2);
  });

  it("tocar una de la lista la saca como si dijera el número", async () => {
    const norma = await withPublished("taza azul, seis mil", "plato, ocho mil");
    await norma.say("vendí la jarra");

    const reply = await norma.tap("1. Taza azul");

    expect(reply.text).toBe("Saqué la pieza 1");
    expect(reply.buttons?.map((b) => b.title)).toEqual(["Deshacer"]);
    expect(await norma.publishedPieces()).toMatchObject([{ number: 2 }]);
  });

  it("tocar de nuevo una ya sacada avisa y no cambia nada", async () => {
    const norma = await withPublished("taza azul, seis mil", "plato, ocho mil");
    await norma.say("vendí la jarra");
    await norma.tap("1. Taza azul");

    const reply = await norma.pressButton("takeDown:1");

    expect(reply).toEqual({ text: "La 1 ya no está en la página" });
    expect(await norma.publishedPieces()).toMatchObject([{ number: 2 }]);
  });

  it("con más de 10, muestra las 10 más nuevas y recuerda el número", async () => {
    const names = Array.from({ length: 11 }, (_, i) => `taza ${i + 1}, mil`);
    const norma = await withPublished(...names);

    const reply = await norma.say("vendí la jarra");

    expect(reply.text).toBe(
      "No encontré ninguna pieza que se llame jarra. ¿Cuál sacás? Si no está, decime el número.",
    );
    expect(reply.list?.rows).toHaveLength(10);
    expect(reply.list?.rows[0]?.title).toBe("11. Taza 11");
  });

  it("un nombre largo se corta para que entre en la lista", async () => {
    const norma = await withPublished(
      "jarrón esmaltado con flores azules, mil",
    );

    const reply = await norma.say("vendí la jarra");

    expect(reply.list?.rows[0]?.title).toBe("1. Jarrón esmaltado con…");
  });

  it("sin piezas publicadas, lo dice sin lista", async () => {
    const norma = createMemoryWorkshop();

    const reply = await norma.say("vendí la jarra");

    expect(reply).toEqual({ text: "No hay ninguna pieza en la página." });
  });

  it("el nombre ignora las palabras de relleno", async () => {
    const norma = await withPublished("post whatsapp, mil", "plato, ocho mil");

    const reply = await norma.say("sacá la del post de WhatsApp");

    expect(reply.text).toBe("Saqué la pieza 1");
  });

  it("sacar con una vista previa abierta no la toca", async () => {
    const norma = await withPublished("taza azul, seis mil");
    await norma.sendPhoto();
    const preview = await norma.say("plato, ocho mil");

    await norma.say("vendí la 1");
    const done = await norma.pressButton(preview.buttons?.[0]?.id ?? "");

    expect(done.text).toBe("Listo. Es la pieza 2.");
    expect(await norma.publishedPieces()).toMatchObject([
      { number: 2, name: "Plato", price: 8000 },
    ]);
  });
});

describe("deshacer", () => {
  it("el botón Deshacer devuelve a la página la pieza sacada", async () => {
    const norma = await withPublished("taza azul, seis mil", "plato, ocho mil");
    const before = await norma.publishedPieces();
    await norma.say("vendí la 1");

    const reply = await norma.tap("Deshacer");

    expect(reply.text).toBe("La pieza 1 volvió a la página");
    expect(reply.image).toBe(before.at(-1)?.image);
    expect(await norma.publishedPieces()).toEqual(before);
  });

  it('"deshacer" dicho saca lo recién publicado y no libera el número', async () => {
    const norma = await withPublished("taza azul, seis mil");

    const reply = await norma.say("deshacé");
    await norma.sendPhoto();
    await norma.say("plato, ocho mil");
    const next = await norma.tap("Sí, publicar");

    expect(reply.text).toBe("La pieza 1 ya no está en la página");
    expect(next.text).toBe("Listo. Es la pieza 2.");
    expect(await norma.publishedPieces()).toMatchObject([{ number: 2 }]);
  });

  it("revierte solo la última acción, no las anteriores", async () => {
    const norma = await withPublished("taza azul, seis mil", "plato, ocho mil");
    await norma.say("vendí la 1");
    await norma.say("deshacer");

    const again = await norma.say("deshacer");

    expect(again).toEqual({ text: "No hay nada para deshacer" });
    expect(await norma.publishedPieces()).toHaveLength(2);
  });

  it("un Deshacer viejo no deshace una acción más nueva", async () => {
    const norma = await withPublished("taza azul, seis mil", "plato, ocho mil");
    const old = await norma.say("vendí la 1");
    await norma.say("vendí la 2");

    const reply = await norma.pressButton(old.buttons?.[0]?.id ?? "");

    expect(reply).toEqual({ text: "No hay nada para deshacer" });
    expect(await norma.publishedPieces()).toEqual([]);
  });
});

describe("foto tratada", () => {
  it("guarda la original y muestra la tratada", async () => {
    const norma = createMemoryWorkshop();
    const original = new Uint8Array([7, 8, 9]);

    await norma.sendPhoto(original);
    const preview = await norma.say("taza azul, seis mil");

    const stored = norma.storedPhotos();
    const kept = stored.find(({ bytes }) => bytes.join() === original.join());
    const photos = stored.filter(({ url }) => url !== preview.image);
    expect(photos).toHaveLength(2);
    expect(kept).toBeDefined();
    expect(norma.drawnSlips()[0]?.photo).not.toBe(kept?.url);
  });

  it("una foto movida no reemplaza la del borrador y se pide otra", async () => {
    const norma = createMemoryWorkshop();
    await norma.sendPhoto();
    const first = await norma.say("taza azul, seis mil");

    const reply = await norma.sendPhoto(BLURRY_PHOTO);
    const preview = await norma.say("siete mil");

    expect(reply).toEqual({ text: "La foto salió movida. ¿Me mandás otra?" });
    const [before, after] = norma.drawnSlips();
    expect(after?.photo).toBe(before?.photo);
    expect(preview.image).not.toBe(first.image);
  });

  it("una foto oscura pide otra con más luz", async () => {
    const norma = createMemoryWorkshop();

    const reply = await norma.sendPhoto(DARK_PHOTO);

    expect(reply).toEqual({
      text: "La foto salió oscura. ¿Me mandás otra con más luz?",
    });
  });
});

describe("cambiar el precio", () => {
  const STALE = "Esa vista previa ya cambió. Fijate en la última que te mandé.";

  it('"la 1 ahora sale siete mil" muestra qué cambia, aplica al confirmar y se deshace', async () => {
    const norma = await withPublished("taza azul, seis mil");
    const [cup] = await norma.publishedPieces();

    const preview = await norma.say("la 1 ahora sale siete mil");

    expect(preview.text).toBe("Antes $ 6.000, ahora $ 7.000");
    expect(norma.drawnSlips().at(-1)?.photo).toBe(cup?.image);
    expect(preview.buttons?.map((b) => b.title)).toEqual(["Sí, cambiar", "No"]);
    expect(await norma.publishedPieces()).toMatchObject([{ price: 6000 }]);

    const done = await norma.tap("Sí, cambiar");

    expect(done.text).toBe("Listo. La pieza 1 ahora sale $ 7.000");
    expect(done.buttons?.map((b) => b.title)).toEqual(["Deshacer"]);
    expect(await norma.publishedPieces()).toEqual([{ ...cup, price: 7000 }]);

    const undone = await norma.tap("Deshacer");

    expect(undone.text).toBe("La pieza 1 vuelve a salir $ 6.000");
    expect(await norma.publishedPieces()).toEqual([cup]);
  });

  it("pedir un cambio descarta la vista previa abierta y avisa qué quedó sin publicar", async () => {
    const norma = await withPublished("taza azul, seis mil");
    await norma.sendPhoto();
    const draft = await norma.say("plato, ocho mil");

    const preview = await norma.say("la 1 ahora sale siete mil");
    const old = await norma.pressButton(draft.buttons?.[0]?.id ?? "");

    expect(preview.text).toBe(
      "Plato quedó sin publicar. Antes $ 6.000, ahora $ 7.000",
    );
    expect(old.text).toBe(STALE);
    expect(await norma.publishedPieces()).toMatchObject([{ number: 1 }]);
  });

  it('un "Sí, cambiar" de una vista previa reemplazada no cambia nada', async () => {
    const norma = await withPublished("taza azul, seis mil");
    const old = await norma.say("la 1 ahora sale siete mil");

    const preview = await norma.say("la 1 ahora sale ocho mil");
    const reply = await norma.pressButton(old.buttons?.[0]?.id ?? "");

    expect(preview.text).toBe(
      "La pieza 1 quedó sin cambiar. Antes $ 6.000, ahora $ 8.000",
    );
    expect(reply.text).toBe(STALE);
    expect(await norma.publishedPieces()).toMatchObject([{ price: 6000 }]);
  });

  it('"No" cierra la vista previa sin cambiar nada', async () => {
    const norma = await withPublished("taza azul, seis mil");
    const preview = await norma.say("la 1 ahora sale siete mil");

    const reply = await norma.tap("No");
    const late = await norma.pressButton(preview.buttons?.[0]?.id ?? "");

    expect(reply).toEqual({ text: "No cambié nada." });
    expect(late.text).toBe(STALE);
    expect(await norma.publishedPieces()).toMatchObject([{ price: 6000 }]);
  });

  it("una pieza sacada no acepta cambios, ni antes ni después de la vista previa", async () => {
    const norma = await withPublished("taza azul, seis mil", "plato, ocho mil");
    const preview = await norma.say("la 1 ahora sale siete mil");
    await norma.say("vendí la 1");

    const late = await norma.pressButton(preview.buttons?.[0]?.id ?? "");
    const asked = await norma.say("la 1 ahora sale ocho mil");
    await norma.say("deshacer");

    expect(late).toEqual({ text: "La 1 ya no está en la página" });
    expect(asked).toEqual({ text: "La 1 ya no está en la página" });
    expect(await norma.publishedPieces()).toMatchObject([
      { number: 2 },
      { number: 1, price: 6000 },
    ]);
  });
});

describe("cambiar la foto", () => {
  it('una foto con "esta es la 1" muestra la nueva, la aplica al confirmar y se deshace', async () => {
    const norma = await withPublished("taza azul, seis mil");
    const [cup] = await norma.publishedPieces();

    await norma.sendPhoto(new Uint8Array([4, 5, 6]));
    const preview = await norma.say("esta es la 1");

    expect(preview.text).toBe("Foto nueva para la pieza 1");
    const shown = norma.drawnSlips().at(-1)?.photo;
    expect(shown).not.toBe(cup?.image);
    expect(preview.buttons?.map((b) => b.title)).toEqual(["Sí, cambiar", "No"]);
    expect(await norma.publishedPieces()).toEqual([cup]);

    const done = await norma.tap("Sí, cambiar");

    expect(done.text).toBe("Listo. La pieza 1 tiene la foto nueva");
    expect(await norma.publishedPieces()).toEqual([{ ...cup, image: shown }]);

    const undone = await norma.tap("Deshacer");

    expect(undone).toEqual({
      text: "La pieza 1 vuelve a tener la foto anterior",
      image: cup?.image,
    });
    expect(await norma.publishedPieces()).toEqual([cup]);
  });

  it('con "esta es la 1" antes que la foto, pide la foto y la foto abre la vista previa', async () => {
    const norma = await withPublished("taza azul, seis mil");

    const asked = await norma.say("esta es la 1");
    const preview = await norma.sendPhoto(new Uint8Array([4, 5, 6]));

    expect(asked).toEqual({ text: "Mandame la foto nueva de la pieza 1." });
    expect(preview.text).toBe("Foto nueva para la pieza 1");
    expect(preview.buttons?.map((b) => b.title)).toEqual(["Sí, cambiar", "No"]);
  });

  it("una foto movida no abre la vista previa ni cambia la pieza", async () => {
    const norma = await withPublished("taza azul, seis mil");
    const before = await norma.publishedPieces();

    const after = await norma.sendPhoto(BLURRY_PHOTO);
    const asked = await norma.say("esta es la 1");
    const rejected = await norma.sendPhoto(BLURRY_PHOTO);

    expect(after).toEqual({ text: "La foto salió movida. ¿Me mandás otra?" });
    expect(asked).toEqual({ text: "Mandame la foto nueva de la pieza 1." });
    expect(rejected).toEqual(after);
    expect(await norma.publishedPieces()).toEqual(before);
    expect((await norma.sendPhoto()).text).toBe("Foto nueva para la pieza 1");
  });

  it("empezar una pieza nueva descarta el cambio abierto y avisa", async () => {
    const norma = await withPublished("taza azul, seis mil");
    const [cup] = await norma.publishedPieces();
    await norma.sendPhoto(new Uint8Array([4, 5, 6]));
    const preview = await norma.say("esta es la 1");

    const reply = await norma.say("plato, ocho mil");
    const old = await norma.pressButton(preview.buttons?.[0]?.id ?? "");

    expect(reply.text).toBe(
      "La pieza 1 quedó sin cambiar. Mandame una foto de la pieza.",
    );
    expect(old.text).toBe(
      "Esa vista previa ya cambió. Fijate en la última que te mandé.",
    );
    expect(await norma.publishedPieces()).toEqual([cup]);
  });

  it("una pieza sacada no acepta la foto nueva, ni antes ni después de la vista previa", async () => {
    const norma = await withPublished("taza azul, seis mil");
    const [cup] = await norma.publishedPieces();
    await norma.sendPhoto(new Uint8Array([4, 5, 6]));
    const preview = await norma.say("esta es la 1");
    await norma.say("vendí la 1");

    const late = await norma.pressButton(preview.buttons?.[0]?.id ?? "");
    await norma.sendPhoto(new Uint8Array([4, 5, 6]));
    const asked = await norma.say("esta es la 1");
    await norma.say("deshacer");

    expect(late).toEqual({ text: "La 1 ya no está en la página" });
    expect(asked).toEqual({ text: "La 1 ya no está en la página" });
    expect(await norma.publishedPieces()).toEqual([cup]);
  });

  it('un "Sí, cambiar" después de "No" no cambia la foto', async () => {
    const norma = await withPublished("taza azul, seis mil");
    const [cup] = await norma.publishedPieces();
    await norma.sendPhoto(new Uint8Array([4, 5, 6]));
    const preview = await norma.say("esta es la 1");
    await norma.tap("No");

    const late = await norma.pressButton(preview.buttons?.[0]?.id ?? "");

    expect(late.text).toBe(
      "Esa vista previa ya cambió. Fijate en la última que te mandé.",
    );
    expect(await norma.publishedPieces()).toEqual([cup]);
  });
});
