import type { Interpreter } from "../../ports/interpreter";

/** Rule-based stand-in for the model: "nombre, precio". */
export function createMemoryInterpreter(): Interpreter {
  return {
    async interpret(text) {
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
