export type CardContent = {
  photo: Uint8Array;
  name: string;
  /** Whole pesos. */
  price: number;
};

export interface PreviewRenderer {
  /** Draws the piece card as the page shows it and returns PNG bytes. */
  render(content: CardContent): Promise<Uint8Array>;
}
