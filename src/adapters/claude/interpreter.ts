import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type {
  Message,
  MessageCreateParamsNonStreaming,
} from "@anthropic-ai/sdk/resources/messages";
import { z } from "zod";
import type { Intent, Interpreter } from "../../ports/interpreter";
import { PROMPT } from "./prompt";

const MODEL = "claude-haiku-5-5";

/** R10 gives the whole message 15 s; transcription and the photo need the rest. */
const TIMEOUT_MS = 5_000;

const said = z.string().trim().min(1);
const piece = z.union([
  z.object({ number: z.number().int().positive() }),
  z.object({ name: said }),
]);

/** What the model must answer. Wrapped in an object: the root of the schema can't be a union. */
const answer = z.object({
  intent: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("describe"),
      name: said.nullable(),
      priceText: said.nullable(),
    }),
    z.object({ kind: z.literal("takeDown"), piece }),
    z.object({ kind: z.literal("changePrice"), piece, priceText: said }),
    z.object({ kind: z.literal("changePhoto"), piece }),
    z.object({ kind: z.literal("undo") }),
    z.object({ kind: z.literal("unknown") }),
  ]),
});

/** The one call the adapter makes; the SDK client fits it and tests replace it. */
export interface ClaudeMessages {
  create(
    body: MessageCreateParamsNonStreaming,
    options?: { signal?: AbortSignal },
  ): Promise<Pick<Message, "content">>;
}

export function createClaudeInterpreter({
  messages,
  timeoutMs = TIMEOUT_MS,
}: {
  messages: ClaudeMessages;
  timeoutMs?: number;
}): Interpreter {
  return {
    async interpret(text) {
      try {
        return toIntent(await ask(messages, text, timeoutMs));
      } catch (error) {
        // Plan B, also when a refusal or a cut answer leaves no valid JSON: nothing changes and the bot asks again.
        console.warn(`Interpreter: plan B (${reason(error)})`);
        return { kind: "unknown" };
      }
    },
  };
}

/** The real client, without retries: a second try would not fit in R10. */
export function claudeMessages(apiKey: string): ClaudeMessages {
  return new Anthropic({ apiKey, maxRetries: 0 }).messages;
}

async function ask(messages: ClaudeMessages, text: string, timeoutMs: number) {
  const signal = AbortSignal.timeout(timeoutMs);
  const timedOut = new Promise<never>((_, reject) =>
    signal.addEventListener("abort", () => reject(signal.reason)),
  );
  const response = await Promise.race([
    messages.create(
      {
        model: MODEL,
        max_tokens: 1024,
        system: PROMPT,
        // Measured with `pnpm eval`: same score without thinking, a second faster.
        thinking: { type: "disabled" },
        output_config: { effort: "low", format: zodOutputFormat(answer) },
        messages: [{ role: "user", content: text }],
      },
      { signal },
    ),
    timedOut,
  ]);
  const json = response.content.find((block) => block.type === "text")?.text;
  return answer.parse(JSON.parse(json ?? "")).intent;
}

function toIntent(intent: z.infer<typeof answer>["intent"]): Intent {
  if (intent.kind !== "describe") return intent;
  const { name, priceText } = intent;
  if (name === null && priceText === null) return { kind: "unknown" };
  return {
    kind: "describe",
    ...(name !== null && {
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }),
    ...(priceText !== null && { priceText }),
  };
}

/** The kind of failure only: a parse error quotes the model's answer. */
function reason(error: unknown): string {
  if (error instanceof Anthropic.APIError) return `API ${error.status}`;
  return error instanceof Error ? error.name : "unknown";
}
