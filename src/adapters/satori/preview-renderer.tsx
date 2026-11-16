import { readFile } from "node:fs/promises";
import satori from "satori";
import sharp from "sharp";
import { card } from "../../domain/card";
import { formatPrice } from "../../domain/price";
import type { PreviewRenderer } from "../../ports/preview-renderer";

/** 16 px per rem, drawn at 2x so the text stays sharp on Norma's phone. */
const PX = 32;

const frame = card.frame.max * PX;
const photoWidth = card.column * PX;
const photoHeight = Math.round(
  (photoWidth * card.photo.height) / card.photo.width,
);

// Roboto is what system-ui resolves to on Android; the page uses no web fonts.
const fonts = Promise.all(
  [
    { file: "Roboto-SemiBold.ttf", weight: card.name.weight },
    { file: "Roboto-ExtraBold.ttf", weight: card.price.weight },
  ].map(async ({ file, weight }) => ({
    name: "Roboto",
    weight,
    data: await readFile(new URL(`./fonts/${file}`, import.meta.url)),
  })),
);

async function download(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Foto no disponible: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

/** `load` fetches the photo's URL; tests pass a local file instead. */
export function createSatoriPreviewRenderer({
  load = download,
}: { load?: (url: string) => Promise<Uint8Array> } = {}): PreviewRenderer {
  return {
    async render({ photo, name, price }) {
      const cropped = await sharp(await load(photo))
        .rotate()
        .resize(photoWidth, photoHeight, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toBuffer();

      const svg = await satori(
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            background: card.paper,
            color: card.ink,
            fontFamily: "Roboto",
            padding: `${frame}px ${frame}px ${frame * card.frameBottom}px`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- drawn into a PNG, not served as HTML */}
          <img
            src={`data:image/jpeg;base64,${cropped.toString("base64")}`}
            width={photoWidth}
            height={photoHeight}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              paddingTop: frame * card.captionTop,
            }}
          >
            <div
              style={{
                fontSize: card.name.size * PX,
                fontWeight: card.name.weight,
                lineHeight: card.name.leading,
                textWrap: "balance",
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: card.price.size * PX,
                fontWeight: card.price.weight,
                lineHeight: card.price.leading,
                marginTop: card.price.gap * PX,
              }}
            >
              {formatPrice(price)}
            </div>
          </div>
        </div>,
        { width: photoWidth + 2 * frame, fonts: await fonts },
      );

      return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
    },
  };
}
