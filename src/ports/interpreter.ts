/**
 * What Norma meant. The price comes back as she said it ("seis mil");
 * the domain turns it into pesos, so a model never invents digits.
 */
export type Intent =
  | { kind: "describe"; name?: string; priceText?: string }
  | { kind: "takeDown"; piece: PieceRef }
  | { kind: "changePrice"; piece: PieceRef; priceText: string }
  | { kind: "changePhoto"; piece: PieceRef }
  | { kind: "undo" }
  | { kind: "unknown" };

/** How Norma names an existing piece: by its number or by words of its name. */
export type PieceRef = { number: number } | { name: string };

export interface Interpreter {
  interpret(text: string): Promise<Intent>;
}
