import { readFile, writeFile } from "node:fs/promises";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { expect, test } from "vitest";
import { createSatoriPreviewRenderer } from "./preview-renderer";

const fixture = (name: string) =>
  new URL(`./fixtures/${name}`, import.meta.url);

async function pixels(png: Uint8Array) {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

// To redraw the reference after an intended design change:
// UPDATE_REFERENCE=1 pnpm test, then look at fixtures/card.png before committing it.
test("draws the card the way the page shows it", async () => {
  const renderer = createSatoriPreviewRenderer({
    load: (url) => readFile(fixture(url)),
  });
  const png = await renderer.render({
    photo: "photo.jpg",
    number: 7,
    name: "Jarra de barro con dos asas",
    price: 6000,
  });
  if (process.env.UPDATE_REFERENCE) await writeFile(fixture("card.png"), png);

  const actual = await pixels(png);
  const expected = await pixels(await readFile(fixture("card.png")));
  expect([actual.width, actual.height]).toEqual([
    expected.width,
    expected.height,
  ]);
  const different = pixelmatch(
    actual.data,
    expected.data,
    undefined,
    actual.width,
    actual.height,
    { threshold: 0.1 },
  );
  // A single changed digit of the price is about 1,000 pixels.
  expect(different).toBeLessThan(100);
});
