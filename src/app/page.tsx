import Image from "next/image";
import type { CSSProperties } from "react";
import { formatPrice } from "@/domain/price";
import { type PagePiece, pageContent } from "./catalog";
import styles from "./page.module.css";

const photoSizes =
  "(min-width: 64rem) 28rem, (min-width: 48rem) 37rem, calc(100vw - 8rem)";

export default async function Home() {
  const { pieces, samples } = await pageContent();

  return (
    <main className={styles.page}>
      <header className={styles.cover}>
        <h1 className={styles.title}>Taller de Norma</h1>
        <p>Cerámica hecha a mano. Todas las piezas están a la venta.</p>
        <p className={styles.howToBuy}>
          ¿Te gusta una? Escribile a Norma y decile el número.
        </p>
      </header>
      {pieces.length === 0 ? <EmptyWorkshop /> : <PieceList pieces={pieces} />}
      {samples && (
        <p className={styles.credit}>
          Piezas de muestra. Fotos: The Metropolitan Museum of Art, dominio
          público.
        </p>
      )}
    </main>
  );
}

function PieceList({ pieces }: { pieces: PagePiece[] }) {
  return (
    <>
      <ol className={styles.pieces}>
        {pieces.map((piece, index) => {
          const price = formatPrice(piece.price);
          return (
            <li
              key={piece.number}
              id={`pieza-${piece.number}`}
              className={styles.piece}
              style={
                {
                  "--slip": `var(--paper-${piece.number % 4})`,
                } as CSSProperties
              }
            >
              <article className={styles.slip}>
                <Stub number={piece.number} />
                <span className={styles.perforation} aria-hidden="true" />
                <div className={styles.body}>
                  {piece.isNew && <p className={styles.stamp}>Nueva</p>}
                  <a
                    className={styles.photoLink}
                    href={`#foto-${piece.number}`}
                  >
                    <Image
                      className={styles.photo}
                      src={piece.image}
                      width={1200}
                      height={1500}
                      alt={`${piece.name}, ${price}`}
                      sizes={photoSizes}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      placeholder="empty"
                    />
                    <span className={styles.visuallyHidden}>
                      Ver la foto grande
                    </span>
                  </a>
                  <div className={styles.caption}>
                    <h2 className={styles.name}>{piece.name}</h2>
                    <PriceTag price={price} />
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
      {/* Outside the list: a slip's shadow filter would trap a fixed viewer inside it. */}
      {pieces.map((piece) => (
        <PhotoViewer
          key={piece.number}
          number={piece.number}
          image={piece.image}
          alt={`${piece.name}, ${formatPrice(piece.price)}`}
        />
      ))}
    </>
  );
}

/**
 * The photo full size over a dark veil. Opens with CSS :target, so it works
 * without JavaScript; closing goes back to the piece, and so does Back.
 */
function PhotoViewer({
  number,
  image,
  alt,
}: {
  number: number;
  image: string;
  alt: string;
}) {
  const piece = `#pieza-${number}`;
  return (
    <div
      id={`foto-${number}`}
      className={styles.viewer}
      role="dialog"
      aria-label={`Foto de ${alt}`}
    >
      <a
        className={styles.veil}
        href={piece}
        tabIndex={-1}
        aria-hidden="true"
      />
      <Image
        className={styles.viewerPhoto}
        src={image}
        width={1200}
        height={1500}
        alt={alt}
        sizes="100vw"
        loading="lazy"
        placeholder="empty"
      />
      <a className={styles.close} href={piece}>
        Cerrar <span aria-hidden="true">✕</span>
      </a>
    </div>
  );
}

/** Under heavy zoom the "$" may drop to its own line; the amount never splits. */
function PriceTag({ price }: { price: string }) {
  const [symbol, amount] = price.split("\u00a0");
  return (
    <p className={styles.price}>
      {symbol} <span className={styles.amount}>{amount}</span>
    </p>
  );
}

/** The stub of the raffle slip: the number Norma uses to talk about a piece. */
function Stub({ number }: { number: number }) {
  const digits = String(number).length;
  return (
    <p className={styles.stub} style={{ "--digits": digits } as CSSProperties}>
      <span aria-hidden="true">N.º</span>
      <span className={styles.visuallyHidden}>Número</span>{" "}
      <span className={styles.number}>{number}</span>
    </p>
  );
}

/** No pieces yet: one blank slip, its number still to be written. */
function EmptyWorkshop() {
  return (
    <div
      className={`${styles.piece} ${styles.emptyPiece}`}
      style={{ "--slip": "var(--paper-2)" } as CSSProperties}
    >
      <div className={styles.slip}>
        <p className={styles.stub}>
          <span aria-hidden="true">N.º</span>
          <span className={styles.blankNumber} aria-hidden="true" />
        </p>
        <span className={styles.perforation} aria-hidden="true" />
        <div className={styles.body}>
          <p className={styles.empty}>Norma está en el taller.</p>
          <p className={styles.emptyNext}>Pronto hay piezas nuevas.</p>
        </div>
      </div>
    </div>
  );
}
