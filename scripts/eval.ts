import { readFile } from "node:fs/promises";
import { z } from "zod";
import {
  claudeMessages,
  createClaudeInterpreter,
} from "../src/adapters/claude/interpreter";
import { parsePrice } from "../src/domain/price";
import type { Intent } from "../src/ports/interpreter";

/**
 * `pnpm eval [frases.json]`: pasa cada frase por el intérprete real y la compara
 * con la intención esperada. Lee ANTHROPIC_API_KEY de .env.local; cuesta centavos.
 */
const phrases = z.array(
  z.object({ text: z.string(), expected: z.custom<Intent>() }),
);

async function main() {
  const [file = "evals/interpreter.json"] = process.argv.slice(2);
  process.loadEnvFile(".env.local");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Falta ANTHROPIC_API_KEY en .env.local");

  const interpreter = createClaudeInterpreter({
    messages: claudeMessages(apiKey),
  });
  const set = phrases.parse(JSON.parse(await readFile(file, "utf8")));
  let correct = 0;
  let slowest = 0;

  for (const { text, expected } of set) {
    const start = performance.now();
    const got = await interpreter.interpret(text);
    slowest = Math.max(slowest, performance.now() - start);
    if (same(got, expected)) correct++;
    else
      console.log(
        `✗ ${text}\n  esperaba ${JSON.stringify(expected)}\n  recibió  ${JSON.stringify(got)}`,
      );
  }
  console.log(
    `\n${correct} de ${set.length} bien. La más lenta tardó ${(slowest / 1000).toFixed(1)} s.`,
  );
}

/** Equal as the bot would act on it: names ignore case, prices compare in pesos when they parse. */
function same(got: Intent, expected: Intent): boolean {
  const normalize = (intent: Intent) =>
    JSON.stringify(intent, (key, value: unknown) => {
      if (key === "name" && typeof value === "string")
        return value.toLowerCase();
      if (key === "priceText" && typeof value === "string")
        return parsePrice(value) ?? value.toLowerCase();
      return value;
    });
  return normalize(got) === normalize(expected);
}

void main();
