export interface Piece {
  number: number;
  name: string;
  price: number;
  image: string;
}

/** A piece with its state. Sacada pieces keep their number and leave the page. */
export type StoredPiece = Piece & { status: "published" | "takenDown" };

/** A change applied to the page, kept so Deshacer can revert it. */
export interface Action {
  kind: "publish" | "takeDown";
  piece: Piece;
}

/** What Norma sent for a new piece and has not confirmed yet. */
export interface Draft {
  photo?: string;
  name?: string;
  price?: number;
  /** Changes every time the bot sends a new preview, so a stale "Sí" can be told apart. */
  previewId?: string;
}

export interface Catalog {
  draft(): Promise<Draft | null>;
  saveDraft(draft: Draft): Promise<void>;
  /** Publishes the draft with the next number and closes it, in one step. Becomes the last action. */
  publish(previewId: string, piece: Omit<Piece, "number">): Promise<Piece>;
  /** The piece a given preview turned into, if it was already published. */
  publishedFrom(previewId: string): Promise<Piece | null>;
  /** Only the pieces the page shows. */
  published(): Promise<Piece[]>;
  /** Any piece ever published, sacada or not. */
  piece(number: number): Promise<StoredPiece | null>;
  /** Takes a published piece off the page. Becomes the last action. */
  takeDown(number: number): Promise<void>;
  /**
   * Reverts the last action in one step and forgets it; null if there is none.
   * A reverted publish takes the piece down and keeps its number.
   */
  undo(): Promise<Action | null>;
}
