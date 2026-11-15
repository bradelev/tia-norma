import { expect, it } from "vitest";
import { createSupabaseMediaStore } from "./media-store";

it("guarda la foto y la devuelve por una URL pública", async () => {
  const media = createSupabaseMediaStore(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SECRET_KEY ?? "",
  );
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

  const url = await media.save(bytes, "image/jpeg");

  expect(url).toMatch(/\.jpg$/);
  const response = await fetch(url);
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
});
