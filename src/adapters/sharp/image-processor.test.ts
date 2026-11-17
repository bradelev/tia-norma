import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { expect, test } from "vitest";
import { createSharpImageProcessor } from "./image-processor";

const fixture = (name: string) =>
  readFile(new URL(`./fixtures/${name}`, import.meta.url));
const processor = createSharpImageProcessor();

async function treated(photo: Uint8Array) {
  const result = await processor.treat(photo);
  if (!("treated" in result)) throw new Error(`Rejected: ${result.problem}`);
  return result.treated;
}

const thumbnail = async (photo: Uint8Array) =>
  sharp(await treated(photo))
    .resize(8, 10)
    .greyscale()
    .raw()
    .toBuffer();

test("frames a good photo at 4:5", async () => {
  const photo = await treated(await fixture("sharp.jpg"));

  const { width, height, format } = await sharp(photo).metadata();
  expect(format).toBe("jpeg");
  expect(width / height).toBeCloseTo(4 / 5, 2);
});

test("turns the photo upright by its EXIF orientation", async () => {
  const upright = await fixture("sharp.jpg");
  // Stored upside down, with a tag telling viewers to turn it around.
  const tagged = await sharp(upright)
    .rotate(180)
    .withMetadata({ orientation: 3 })
    .toBuffer();

  const a = await thumbnail(upright);
  const b = await thumbnail(tagged);
  const gap = a.reduce((sum, gray, i) => sum + Math.abs(gray - b[i]!), 0);
  expect(gap / a.length).toBeLessThan(8);
});

test.each([
  ["blurry.jpg", "blurry"],
  ["dark.jpg", "dark"],
] as const)("rejects %s as %s", async (file, problem) => {
  expect(await processor.treat(await fixture(file))).toEqual({ problem });
});

test("frames around the piece the finder points to", async () => {
  // A dark square in the top-left corner of a light 3:4 photo, with some texture so it passes the quality check.
  const base = await fixture("sharp.jpg");
  const { width = 0, height = 0 } = await sharp(base).metadata();
  const square = await sharp({
    create: { width: 200, height: 200, channels: 3, background: "#000" },
  })
    .png()
    .toBuffer();
  const photo = await sharp(base)
    .composite([{ input: square, left: 40, top: 40 }])
    .jpeg()
    .toBuffer();
  const finder = {
    find: async () => ({
      left: 40 / width,
      top: 40 / height,
      right: 240 / width,
      bottom: 240 / height,
    }),
  };

  const result = await createSharpImageProcessor({ finder }).treat(photo);
  if (!("treated" in result)) throw new Error(`Rejected: ${result.problem}`);

  const { data } = await sharp(result.treated)
    .extract({ left: 500, top: 650, width: 200, height: 200 })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mean = data.reduce((sum, gray) => sum + gray, 0) / data.length;
  expect(mean).toBeLessThan(40);
});
