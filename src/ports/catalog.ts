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
  /** A publish takes its preview id. */
  id: string;
  kind: "publish" | "takeDown" | "changePrice" | "changePhoto";
  piece: Piece;
}

/** A new price or photo for a published piece, waiting for "Sí, cambiar". */
export type Change = { number: number } & (
  { price: number } | { image: string }
);

/** What Norma sent for a new piece and has not confirmed yet. */
export interface Draft {
  photo?: string;
  name?: string;
  price?: number;
  /** Changes every time the bot sends a new preview, so a stale "Sí" can be told apart. */
  previewId?: string;
  /** When that preview was sent, in milliseconds since the epoch. */
  previewSentAt?: number;
  /** Set when the open preview is a change instead of a new piece. */
  change?: Change;
  /** Norma said which piece a new photo is for and the photo has not arrived. */
  photoFor?: number;
}

export interface Catalog {
  draft(): Promise<Draft | null>;
  saveDraft(draft: Draft): Promise<void>;
  /**
   * Publishes the draft with the next number and closes it, in one step.
   * Becomes the last action.
   * Publishing the same preview again returns the piece it already became.
   */
  publish(previewId: string, piece: Omit<Piece, "number">): Promise<Piece>;
  /** The piece a given preview turned into, if it was already published. */
  publishedFrom(previewId: string): Promise<Piece | null>;
  /** Pieces on the page, newest first. */
  published(): Promise<Piece[]>;
  /** Any piece ever published, sacada or not. */
  piece(number: number): Promise<StoredPiece | null>;
  /** Takes a published piece off the page. Becomes the last action. */
  takeDown(number: number, actionId: string): Promise<void>;
  /**
   * Applies the change and closes the draft, in one step; null if `previewId`
   * is no longer the open preview. Becomes the last action under that id,
   * keeping the previous price or photo for Deshacer.
   */
  change(previewId: string, change: Change): Promise<Piece | null>;
  /**
   * Reverts the last action in one step and forgets it; null if there is none,
   * or if `actionId` is given and is no longer the last one.
   * A reverted publish takes the piece down and keeps its number;
   * a reverted change brings back the previous price or photo.
   */
  undo(actionId?: string): Promise<Action | null>;
  /** Records a WhatsApp message id; false if it was already recorded (R9). */
  recordMessage(messageId: string): Promise<boolean>;
}
