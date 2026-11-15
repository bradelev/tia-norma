import Image from "next/image";
import { formatPrice } from "@/domain/price";
import type { Piece } from "@/ports/catalog";
import { pageContent } from "./catalog";
import styles from "./page.module.css";

const photoSizes = "(min-width: 42rem) 37rem, calc(100vw - 4.5rem)";

export default async function Home() {
  const { pieces, samples } = await pageContent();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Taller de Norma</h1>
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

function PieceList({ pieces }: { pieces: Piece[] }) {
  return (
    <ol className={styles.pieces}>
      {pieces.map((piece, index) => {
        const price = formatPrice(piece.price);
        return (
          <li key={piece.number}>
            <article className={styles.print}>
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

function EmptyWorkshop() {
  return (
    <div className={styles.print}>
      <div className={styles.blank} aria-hidden="true" />
      <p className={`${styles.caption} ${styles.empty}`}>
        Norma está en el taller. Pronto hay piezas nuevas.
      </p>
    </div>
  );
}
