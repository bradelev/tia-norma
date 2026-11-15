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
    expect((await catalog.published()).slice(0, 2)).toEqual([second, first]);
  });

  it("la misma vista previa publica una sola vez", async () => {
    const catalog = create();
    const previewId = randomUUID();
    const first = await catalog.publish(previewId, piece);

    expect(await catalog.publish(previewId, piece)).toEqual(first);
    expect(await catalog.publishedFrom(previewId)).toEqual(first);
    expect(await catalog.published()).toContainEqual(first);
    expect(
      (await catalog.published()).filter((p) => p.number === first.number),
    ).toHaveLength(1);
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
}
