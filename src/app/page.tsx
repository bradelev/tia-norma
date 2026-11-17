import Image from "next/image";
import type { CSSProperties } from "react";
import { formatPrice } from "@/domain/price";
import { type PagePiece, pageContent } from "./catalog";
import styles from "./page.module.css";

const photoSizes =
  "(min-width: 64rem) 28rem, (min-width: 48rem) 37rem, calc(100vw - 8rem)";

/** Where buyers write to Norma. */
const whatsapp = {
  shown: "+54-9-11-1234-5678",
  link: "https://wa.me/5491112345678",
};

export default async function Home() {
  const { pieces, samples } = await pageContent();

  return (
    <main className={styles.page}>
      <header className={styles.cover}>
        <h1 className={styles.title}>Taller de Norma</h1>
        <p>Cada pieza tiene su número.</p>
        <p className={styles.contact}>
          Para comprar, escribime por WhatsApp{" "}
          <a className={styles.phone} href={whatsapp.link}>
            {whatsapp.shown}
          </a>
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
    <ol className={styles.pieces}>
      {pieces.map((piece, index) => {
        const price = formatPrice(piece.price);
        return (
          <li
            key={piece.number}
            className={styles.piece}
            style={
              { "--slip": `var(--paper-${piece.number % 4})` } as CSSProperties
            }
          >
            <article className={styles.slip}>
              <Stub number={piece.number} />
              <span className={styles.perforation} aria-hidden="true" />
              <div className={styles.body}>
                {piece.isNew && <p className={styles.stamp}>Nueva</p>}
                <a className={styles.photoLink} href={piece.image}>
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
function Stub({ number }: { number?: number }) {
  const digits = number === undefined ? 1 : String(number).length;
  return (
    <p className={styles.stub} style={{ "--digits": digits } as CSSProperties}>
      <span aria-hidden="true">N.º</span>
      <span className={styles.visuallyHidden}>Número</span>{" "}
      <span className={styles.number}>{number}</span>
    </p>
  );
}

function EmptyWorkshop() {
  return (
    <div className={styles.piece}>
      <div className={styles.slip}>
        <Stub />
        <span className={styles.perforation} aria-hidden="true" />
        <div className={styles.body}>
          <div className={styles.blank} aria-hidden="true" />
          <p className={`${styles.caption} ${styles.empty}`}>
            Norma está en el taller. Pronto hay piezas nuevas.
          </p>
        </div>
      </div>
    </div>
  );
}
