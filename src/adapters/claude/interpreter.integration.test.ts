import { expect, it } from "vitest";
import { claudeMessages, createClaudeInterpreter } from "./interpreter";

const apiKey = process.env.ANTHROPIC_API_KEY;

it.skipIf(!apiKey)("Claude separa el nombre del precio sin coma", async () => {
  const messages = claudeMessages(apiKey ?? "");
  const interpreter = createClaudeInterpreter({ messages });

  expect(await interpreter.interpret("Sacapuntas de gusanito 5000")).toEqual({
    kind: "describe",
    name: "Sacapuntas de gusanito",
    priceText: "5000",
  });
});
