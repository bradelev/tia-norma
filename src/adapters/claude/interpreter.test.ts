import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { type ClaudeMessages, createClaudeInterpreter } from "./interpreter";

/** A client that answers every request with the same text. */
function answering(text: string): ClaudeMessages {
  return {
    create: async () => ({
      content: [{ type: "text", text, citations: null }],
    }),
  };
}

const interpreter = (messages: ClaudeMessages) =>
  createClaudeInterpreter({ messages, timeoutMs: 50 });

describe("intérprete con Claude", () => {
  it("devuelve lo que entendió el modelo, con el nombre en mayúscula", async () => {
    const answer =
      '{"intent":{"kind":"describe","name":"sacapuntas de gusanito","priceText":"$5000"}}';

    expect(await interpreter(answering(answer)).interpret("…")).toEqual({
      kind: "describe",
      name: "Sacapuntas de gusanito",
      priceText: "$5000",
    });
  });

  describe("plan B: no entendió y no cambia nada", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    it.each([
      ["no es JSON", answering("Claro, Norma")],
      ["no es una intención", answering('{"intent":{"kind":"borrarTodo"}}')],
      ["le falta la pieza", answering('{"intent":{"kind":"takeDown"}}')],
      [
        "no trae nombre ni precio",
        answering(
          '{"intent":{"kind":"describe","name":null,"priceText":null}}',
        ),
      ],
      ["tarda", { create: () => new Promise(() => {}) }],
      [
        "la API falla",
        {
          create: () =>
            Promise.reject(new Anthropic.APIConnectionError({ message: "x" })),
        },
      ],
    ] satisfies [string, ClaudeMessages][])(
      "si la respuesta %s",
      async (_, messages) => {
        expect(await interpreter(messages).interpret("hola")).toEqual({
          kind: "unknown",
        });
      },
    );

    it("sin escribir el mensaje ni la respuesta en el log", async () => {
      await interpreter(answering("Claro, Norma")).interpret("taza secreta");

      const logged = JSON.stringify(warn.mock.calls);
      expect(logged).not.toContain("taza secreta");
      expect(logged).not.toContain("Claro, Norma");
    });
  });
});
