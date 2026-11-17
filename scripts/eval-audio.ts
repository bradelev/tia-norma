import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import {
  claudeMessages,
  createClaudeInterpreter,
} from "../src/adapters/claude/interpreter";
import { createGroqTranscriber } from "../src/adapters/groq/transcriber";
import { parsePrice } from "../src/domain/price";

/**
 * `pnpm eval:audio`: pasa cada audio de evals/audios por el transcriptor y el
 * intérprete reales, como el bot, y cuenta cuántos dan nombre y precio exactos
 * (R14). Lee ANTHROPIC_API_KEY y GROQ_API_KEY de .env.local; cuesta centavos.
 */
const audios = z.array(
  z.object({ file: z.string(), name: z.string(), price: z.number() }),
);

/** Groq's free tier takes 20 requests a minute. */
const PAUSE_MS = 3_100;

/** Real voices stay out of the repo; each person records their own. */
const DIR = "evals/audios";

async function main() {
  process.loadEnvFile(".env.local");
  const { ANTHROPIC_API_KEY, GROQ_API_KEY } = process.env;
  if (!ANTHROPIC_API_KEY || !GROQ_API_KEY)
    throw new Error("Faltan ANTHROPIC_API_KEY o GROQ_API_KEY en .env.local");

  const transcriber = createGroqTranscriber({ apiKey: GROQ_API_KEY });
  const interpreter = createClaudeInterpreter({
    messages: claudeMessages(ANTHROPIC_API_KEY),
  });
  const set = audios.parse(
    JSON.parse(await readFile("evals/audios.json", "utf8")),
  );
  const missing = set.filter(({ file }) => !existsSync(join(DIR, file)));
  if (missing.length > 0)
    throw new Error(
      `Faltan ${missing.length} audios en ${DIR}/. Grabá cada frase de evals/audios.json con el nombre de archivo que indica.`,
    );
  let correct = 0;
  let slowest = 0;

  for (const [index, expected] of set.entries()) {
    if (index > 0) await sleep(PAUSE_MS);
    const bytes = new Uint8Array(await readFile(join(DIR, expected.file)));
    const start = performance.now();
    const said = await transcriber.transcribe({
      bytes,
      contentType: "audio/mp4",
    });
    slowest = Math.max(slowest, performance.now() - start);
    const intent = await interpreter.interpret(said);
    const name = intent.kind === "describe" ? intent.name : undefined;
    const price =
      intent.kind === "describe" && intent.priceText
        ? parsePrice(intent.priceText)
        : null;
    if (plain(name ?? "") === plain(expected.name) && price === expected.price)
      correct++;
    else
      console.log(
        `✗ ${expected.file} «${said}»\n  esperaba ${expected.name}, ${expected.price}\n  recibió  ${name}, ${price}`,
      );
  }
  console.log(
    `\n${correct} de ${set.length} bien. La transcripción más lenta tardó ${(slowest / 1000).toFixed(1)} s.`,
  );
}

/** Without case or accents, as Norma would read it on the preview. */
function plain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

void main();
