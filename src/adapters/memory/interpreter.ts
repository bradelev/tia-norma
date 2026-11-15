import { parsePrice } from "../../domain/price";
import type { Interpreter, PieceRef } from "../../ports/interpreter";

/**
 * Rule-based stand-in for the model: "nombre, precio", or just one of the two.
 * A question is never a piece, so it comes back as unknown.
 */
export function createMemoryInterpreter(): Interpreter {
  return {
    async interpret(text) {
      if (/^deshac[eé]r?$/i.test(text.trim())) return { kind: "undo" };
      const takeDown = /^(?:vend[ií]|sac[aá])\s+(?:la|el)?\s*(.+)$/i.exec(
        text.trim(),
      );
      if (takeDown?.[1])
        return { kind: "takeDown", piece: pieceRef(takeDown[1]) };
      const changePrice =
        /^(?:la|el)?\s*(.+?)\s+ahora\s+(?:sale|cuesta|vale)\s+(.+)$/i.exec(
          text.trim(),
        );
      if (changePrice?.[1] && changePrice[2])
        return {
          kind: "changePrice",
          piece: pieceRef(changePrice[1]),
          priceText: changePrice[2],
        };
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

function pieceRef(words: string): PieceRef {
  return /^\d+$/.test(words) ? { number: Number(words) } : { name: words };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
