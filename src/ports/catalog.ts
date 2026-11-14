export interface Piece {
  number: number;
  name: string;
  price: number;
  image: string;
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
  /** Publishes the draft with the next number and closes it, in one step. */
  publish(previewId: string, piece: Omit<Piece, "number">): Promise<Piece>;
  published(): Promise<Piece[]>;
}
