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

describe("números de pieza", () => {
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
