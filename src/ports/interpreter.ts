/**
 * What Norma meant. The price comes back as she said it ("seis mil");
 * the domain turns it into pesos, so a model never invents digits.
 */
export type Intent =
  { kind: "describe"; name?: string; priceText?: string } | { kind: "unknown" };

export interface Interpreter {
  interpret(text: string): Promise<Intent>;
}
