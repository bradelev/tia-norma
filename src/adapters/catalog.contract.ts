import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import type { Catalog } from "../ports/catalog";

/**
 * What every Catalog must do, run against the in-memory double and Postgres.
 * Postgres keeps data between runs, so numbers are checked relative to each other.
 */
export function catalogContract(create: () => Catalog) {
  const piece = {
    name: "Taza azul",
    price: 6000,
    image:
      "https://ejemplo.supabase.co/storage/v1/object/public/photos/taza.jpg",
  };

  it("publica con el número siguiente y lo muestra primero", async () => {
    const catalog = create();
    const first = await catalog.publish(randomUUID(), piece);
    const second = await catalog.publish(randomUUID(), piece);

    expect(second.number).toBe(first.number + 1);
    expect((await catalog.published()).slice(0, 2)).toMatchObject([
      second,
      first,
    ]);
  });

  it("la misma vista previa publica una sola vez", async () => {
    const catalog = create();
    const previewId = randomUUID();
    const first = await catalog.publish(previewId, piece);

    expect(await catalog.publish(previewId, piece)).toEqual(first);
    expect(await catalog.publishedFrom(previewId)).toEqual(first);
    expect(await catalog.published()).toContainEqual(
      expect.objectContaining(first),
    );
    expect(
      (await catalog.published()).filter((p) => p.number === first.number),
    ).toHaveLength(1);
  });

  it("una pieza en la página dice cuándo se publicó", async () => {
    const catalog = create();
    const before = Date.now();
    const { number } = await catalog.publish(randomUUID(), piece);
    const shown = (await catalog.published()).find((p) => p.number === number);

    // A minute either way allows for the database clock.
    const minute = 60_000;
    expect(shown?.publishedAt.getTime()).toBeGreaterThan(before - minute);
    expect(shown?.publishedAt.getTime()).toBeLessThan(Date.now() + minute);
  });

  it("publicar cierra el borrador", async () => {
    const catalog = create();
    const previewId = randomUUID();
    await catalog.saveDraft({ ...piece, photo: "taza.jpg", previewId });
    expect(await catalog.draft()).toMatchObject({
      name: "Taza azul",
      previewId,
    });

    await catalog.publish(previewId, piece);

    expect(await catalog.draft()).toBeNull();
  });

  it("sacar deja la pieza fuera de la página y Deshacer la devuelve", async () => {
    const catalog = create();
    const { number } = await catalog.publish(randomUUID(), piece);

    await catalog.takeDown(number, "sacar-1");
    expect(await catalog.piece(number)).toMatchObject({ status: "takenDown" });
    expect(await catalog.published()).not.toContainEqual(
      expect.objectContaining({ number }),
    );

    expect(await catalog.undo("otra")).toBeNull();
    expect(await catalog.undo("sacar-1")).toMatchObject({ kind: "takeDown" });
    expect(await catalog.piece(number)).toMatchObject({ status: "published" });
    expect(await catalog.undo()).toBeNull();
  });

  it("deshacer un publicar saca la pieza y conserva su número", async () => {
    const catalog = create();
    const { number } = await catalog.publish(randomUUID(), piece);

    expect(await catalog.undo()).toMatchObject({ kind: "publish" });

    expect(await catalog.piece(number)).toMatchObject({ status: "takenDown" });
    const next = await catalog.publish(randomUUID(), piece);
    expect(next.number).toBe(number + 1);
  });

  it("el próximo número es el que toma la próxima pieza, aunque la última esté sacada", async () => {
    const catalog = create();
    const { number } = await catalog.publish(randomUUID(), piece);
    await catalog.takeDown(number, randomUUID());

    expect(await catalog.nextNumber()).toBe(number + 1);
    const next = await catalog.publish(randomUUID(), piece);
    expect(next.number).toBe(number + 1);
  });

  it("cambiar el precio aplica la vista previa abierta y Deshacer devuelve el anterior", async () => {
    const catalog = create();
    const { number } = await catalog.publish(randomUUID(), piece);
    const change = { number, price: 7000 };
    const previewId = randomUUID();
    await catalog.saveDraft({ change, previewId });

    expect(await catalog.change(randomUUID(), change)).toBeNull();
    expect(await catalog.change(previewId, change)).toMatchObject(change);
    expect(await catalog.piece(number)).toMatchObject(change);
    expect(await catalog.draft()).toBeNull();
    expect(await catalog.change(previewId, change)).toBeNull();

    expect(await catalog.undo(previewId)).toMatchObject({
      kind: "changePrice",
      piece: { number, price: 6000 },
    });
    expect(await catalog.piece(number)).toMatchObject({ price: 6000 });
  });

  it("cambiar la foto la reemplaza y Deshacer devuelve la anterior", async () => {
    const catalog = create();
    const { number } = await catalog.publish(randomUUID(), piece);
    const change = { number, image: piece.image.replace("taza", "nueva") };
    const previewId = randomUUID();
    await catalog.saveDraft({ change, previewId });

    expect(await catalog.change(previewId, change)).toMatchObject(change);
    expect(await catalog.piece(number)).toMatchObject({
      ...change,
      price: 6000,
    });

    expect(await catalog.undo(previewId)).toMatchObject({
      kind: "changePhoto",
      piece: { number, image: piece.image },
    });
    expect(await catalog.piece(number)).toMatchObject({ image: piece.image });
  });

  it("un mensaje de WhatsApp se registra una sola vez", async () => {
    const catalog = create();
    const messageId = `wamid.${randomUUID()}`;

    expect(await catalog.recordMessage(messageId)).toBe(true);
    expect(await catalog.recordMessage(messageId)).toBe(false);
  });
}
