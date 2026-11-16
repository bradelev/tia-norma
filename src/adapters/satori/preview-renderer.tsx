import { readFile } from "node:fs/promises";
import satori from "satori";
import sharp from "sharp";
import { card } from "../../domain/card";
import { formatPrice } from "../../domain/price";
import type { PreviewRenderer } from "../../ports/preview-renderer";

/** 16 px per rem, drawn at 2x so the text stays sharp on Norma's phone. */
const PX = 32;

/** The slip as a phone shows it: the stub and perforation at their widest. Same values as globals.css. */
const stub = 6.5 * PX;
const perforation = 1.3 * PX;
const textBase = 1.25 * PX;
const frame = card.frame.max * PX;
/** Narrower than the page's column, so name and price still read at WhatsApp's size. */
const photoWidth = 24 * PX;
const photoHeight = Math.round(
  (photoWidth * card.photo.height) / card.photo.width,
);
/** Table showing around the slip, so the notches and holes read as cut. */
const margin = 1 * PX;
const notch = 0.6 * PX;
const hole = 0.22 * PX;
const holeEvery = 0.75 * PX;
/** Enough holes for the tallest slip; the perforation clips the rest. */
const holes = 120;

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
    async render({ photo, number, name, price }) {
      const cropped = await sharp(await load(photo))
        .rotate()
        .resize(photoWidth, photoHeight, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toBuffer();
      const digits = String(number).length;
      // As big as the stub allows, like the page: three digits shrink to fit.
      const numberSize = Math.min(4 * PX, (stub - 0.5 * PX) / (digits * 0.62));
      const notchX = stub + perforation / 2 - notch;

      const svg = await satori(
        <div
          style={{
            display: "flex",
            padding: margin,
            background: card.ground,
            color: card.ink,
            fontFamily: "Roboto",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              background: card.papers[number % card.papers.length],
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: stub,
                flexShrink: 0,
                paddingTop: frame,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              <div style={{ fontSize: textBase }}>N.º</div>
              <div
                style={{
                  fontSize: numberSize,
                  letterSpacing: "-0.03em",
                  marginTop: numberSize * 0.15,
                }}
              >
                {number}
              </div>
            </div>
            {/* Holes punched every 0.75rem, in the color of the table showing through. */}
            <div
              style={{
                display: "flex",
                position: "relative",
                width: perforation,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "absolute",
                  top: 0,
                  width: perforation,
                }}
              >
                {Array.from({ length: holes }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 2 * hole,
                      height: 2 * hole,
                      flexShrink: 0,
                      margin: (holeEvery - 2 * hole) / 2,
                      borderRadius: hole,
                      background: card.ground,
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: photoWidth + frame,
                boxSizing: "border-box",
                padding: `${frame}px ${frame}px ${frame * card.frameBottom}px 0`,
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
            </div>
            {/* Half-moon notches die-cut where the perforation meets the edges. */}
            {[{ top: -notch }, { bottom: -notch }].map((edge, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: notchX,
                  ...edge,
                  width: 2 * notch,
                  height: 2 * notch,
                  borderRadius: notch,
                  background: card.ground,
                }}
              />
            ))}
          </div>
        </div>,
        {
          width: 2 * margin + stub + perforation + photoWidth + frame,
          fonts: await fonts,
        },
      );

      return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
    },
  };
}
