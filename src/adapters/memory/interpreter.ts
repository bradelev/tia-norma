import { parsePrice } from "../../domain/price";
import type { Interpreter } from "../../ports/interpreter";

/**
 * Rule-based stand-in for the model: "nombre, precio", or just one of the two.
 * A question is never a piece, so it comes back as unknown.
 */
export function createMemoryInterpreter(): Interpreter {
  return {
    async interpret(text) {
      if (/[¿?]/.test(text)) return { kind: "unknown" };
      if (parsePrice(text) !== null)
        return { kind: "describe", priceText: text.trim() };
      const comma = text.indexOf(",");
      const name = (comma === -1 ? text : text.slice(0, comma)).trim();
      const priceText = comma === -1 ? "" : text.slice(comma + 1).trim();
      if (!name) return { kind: "unknown" };
      return {
        kind: "describe",
        name: capitalize(name),
        ...(priceText ? { priceText } : {}),
      };
    },
  };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
