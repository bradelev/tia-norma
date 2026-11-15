import { describe, expect, it } from "vitest";
import { createMemoryWorkshop } from "../adapters/memory/workshop";

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
      { number: 1, name: "Taza azul", price: 6000, image: preview.image },
    ]);
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

describe("mensajes que no son una pieza", () => {
  it("un texto sin nombre ni precio responde con ayuda y no abre nada", async () => {
    const norma = createMemoryWorkshop();

    const reply = await norma.say("hola, ¿cómo andás?");

    expect(reply.text).toBe(
      "Para publicar, mandame una foto de la pieza y decime cómo se llama y cuánto sale.",
    );
  });
});
