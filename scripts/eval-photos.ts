import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import sharp from "sharp";
import {
  createSharpImageProcessor,
  measure,
} from "../src/adapters/sharp/image-processor";

const HELP = `Uso: pnpm eval:photos [carpeta] [salida]

Trata cada foto de la carpeta como lo haría el bot y guarda, por cada una,
la original a la izquierda y la tratada a la derecha, para revisarlas a ojo (R17).
Imprime la luz y la nitidez medidas y si la foto pasaría el control.

  carpeta  fotos .jpg, .jpeg, .png o .webp (por defecto, las de muestra)
  salida   dónde guardar los pares (por defecto, eval-out/photos)`;

const PAIR_HEIGHT = 750;
const PHOTO = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function main() {
  const [input = "src/app/samples", output = "eval-out/photos"] =
    process.argv.slice(2);
  if (input === "--help" || input === "-h") return console.log(HELP);

  const files = (await readdir(input))
    .filter((file) => PHOTO.has(extname(file).toLowerCase()))
    .sort();
  await mkdir(output, { recursive: true });
  const processor = createSharpImageProcessor();
  let rejected = 0;

  for (const file of files) {
    const original = new Uint8Array(await readFile(join(input, file)));
    const { luminance, sharpness } = await measure(original);
    const result = await processor.treat(original);
    const verdict =
      "problem" in result ? `rechazada (${result.problem})` : "ok";
    if ("problem" in result) rejected++;
    else
      await writeFile(join(output, file), await pair(original, result.treated));
    console.log(
      `${file.padEnd(32)} luz ${luminance.toFixed(0).padStart(3)}  nitidez ${sharpness.toFixed(0).padStart(6)}  ${verdict}`,
    );
  }
  console.log(
    `\n${files.length - rejected} de ${files.length} pasan. Pares en ${output}/`,
  );
}

/** Original and treated side by side, at the same height. */
async function pair(original: Uint8Array, treated: Uint8Array) {
  const [left, right] = await Promise.all(
    [original, treated].map((photo) =>
      sharp(photo).rotate().resize({ height: PAIR_HEIGHT }).toBuffer({
        resolveWithObject: true,
      }),
    ),
  );
  const gap = 16;
  return sharp({
    create: {
      width: left!.info.width + gap + right!.info.width,
      height: PAIR_HEIGHT,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([
      { input: left!.data, left: 0, top: 0 },
      { input: right!.data, left: left!.info.width + gap, top: 0 },
    ])
    .jpeg({ quality: 80 })
    .toBuffer();
}

void main();
