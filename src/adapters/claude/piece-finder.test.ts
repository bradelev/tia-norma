import { describe, expect, it, vi } from "vitest";
import type { ClaudeMessages } from "./interpreter";
import { createClaudePieceFinder } from "./piece-finder";

function answering(text: string): ClaudeMessages {
  return {
    create: async () => ({
      content: [{ type: "text", text, citations: null }],
    }),
  };
}

const find = (messages: ClaudeMessages) =>
  createClaudePieceFinder({ messages, timeoutMs: 50 }).find(new Uint8Array());

describe("buscador de la pieza con Claude", () => {
  it("devuelve la caja en fracciones de la foto", async () => {
    const answer =
      '{"found":true,"left":200,"top":180,"right":500,"bottom":450}';

    expect(await find(answering(answer))).toEqual({
      left: 0.2,
      top: 0.18,
      right: 0.5,
      bottom: 0.45,
    });
  });

  describe("plan B: sin caja, la foto se recorta como antes", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    it.each([
      [
        "no ve una pieza",
        answering('{"found":false,"left":0,"top":0,"right":0,"bottom":0}'),
      ],
      [
        "la caja está dada vuelta",
        answering(
          '{"found":true,"left":600,"top":100,"right":200,"bottom":500}',
        ),
      ],
      [
        "la caja se sale de la foto",
        answering(
          '{"found":true,"left":100,"top":100,"right":1400,"bottom":500}',
        ),
      ],
      ["no es JSON", answering("Veo una mano")],
      ["tarda", { create: () => new Promise(() => {}) }],
    ] satisfies [string, ClaudeMessages][])("%s", async (_, messages) => {
      expect(await find(messages)).toBeNull();
    });
  });
});
