import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { PieceFinder } from "../../ports/piece-finder";
import type { ClaudeMessages } from "./interpreter";

const MODEL = "claude-haiku-5-5";

/** Measured at 1.4 to 2.3 s; the photo shares R10's 15 s with the download and the preview. */
const TIMEOUT_MS = 4_000;

const PROMPT =
  "Es la foto de una pieza de cerámica que se va a vender. Devolvé el rectángulo más chico que contiene la pieza entera, en milésimas del ancho y del alto de la foto: de 0 a 1000, left y right en horizontal, top y bottom en vertical. Si no hay una pieza clara, found es false.";

/** Thousandths, so the model answers in whole numbers. */
const edge = z.number().min(0).max(1000);
const answer = z.object({
  found: z.boolean(),
  left: edge,
  top: edge,
  right: edge,
  bottom: edge,
});

export function createClaudePieceFinder({
  messages,
  timeoutMs = TIMEOUT_MS,
}: {
  messages: ClaudeMessages;
  timeoutMs?: number;
}): PieceFinder {
  return {
    async find(photo) {
      try {
        const box = await ask(messages, photo, timeoutMs);
        if (!box.found || box.left >= box.right || box.top >= box.bottom)
          return null;
        return {
          left: box.left / 1000,
          top: box.top / 1000,
          right: box.right / 1000,
          bottom: box.bottom / 1000,
        };
      } catch (error) {
        // Plan B: the photo is cropped without knowing where the piece is.
        console.warn(`PieceFinder: plan B (${reason(error)})`);
        return null;
      }
    },
  };
}

async function ask(
  messages: ClaudeMessages,
  photo: Uint8Array,
  timeoutMs: number,
) {
  const signal = AbortSignal.timeout(timeoutMs);
  const timedOut = new Promise<never>((_, reject) =>
    signal.addEventListener("abort", () => reject(signal.reason)),
  );
  const response = await Promise.race([
    messages.create(
      {
        model: MODEL,
        max_tokens: 256,
        thinking: { type: "disabled" },
        output_config: { effort: "low", format: zodOutputFormat(answer) },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: Buffer.from(photo).toString("base64"),
                },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      },
      { signal },
    ),
    timedOut,
  ]);
  const json = response.content.find((block) => block.type === "text")?.text;
  return answer.parse(JSON.parse(json ?? ""));
}

function reason(error: unknown): string {
  if (error instanceof Anthropic.APIError) return `API ${error.status}`;
  return error instanceof Error ? error.name : "unknown";
}
