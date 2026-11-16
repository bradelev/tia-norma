export type SlipContent = {
  /** URL of the treated photo. */
  photo: string;
  /** The number on the stub: the one a new piece will take, or the piece's own. */
  number: number;
  name: string;
  /** Whole pesos. */
  price: number;
};

export interface PreviewRenderer {
  /** Draws the piece's raffle slip as the page shows it and returns PNG bytes. */
  render(content: SlipContent): Promise<Uint8Array>;
}
