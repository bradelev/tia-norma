import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { createMemoryWorkshop } from "../src/adapters/memory/workshop";
import type { Reply } from "../src/domain/messages";

const HELP = `Escribí como Norma. Además:
  /foto [archivo]   manda una foto
  1, 2              toca un botón de la última respuesta
  /piezas           lista las piezas publicadas
  /salir`;
const norma = createMemoryWorkshop();

async function main() {
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log(HELP);
  terminal.setPrompt("\nNorma> ");
  terminal.prompt();
  for await (const raw of terminal) {
    const line = raw.trim();
    if (line === "/salir") break;
    try {
      const reply = await handle(line);
      if (reply) print(reply);
    } catch (error) {
      console.log(
        `(error) ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    terminal.prompt();
  }
  terminal.close();
}

void main();

async function handle(line: string): Promise<Reply | null> {
  if (line === "") return null;
  if (line === "/piezas") {
    for (const p of await norma.publishedPieces())
      console.log(`  ${p.number}. ${p.name}, ${p.price}`);
    return null;
  }
  if (line.startsWith("/foto")) {
    const path = line.slice("/foto".length).trim();
    return norma.sendPhoto(
      path ? new Uint8Array(await readFile(path)) : undefined,
    );
  }
  const button = /^[12]$/.test(line)
    ? norma.lastReply().buttons?.[Number(line) - 1]
    : undefined;
  if (button) return norma.pressButton(button.id);
  return norma.say(line);
}

function print(reply: Reply) {
  reply.album?.forEach((photo) =>
    console.log(`Bot   [imagen ${photo.image}] ${photo.caption}`),
  );
  if (reply.image) console.log(`Bot   [imagen ${reply.image}]`);
  console.log(`Bot   ${reply.text}`);
  reply.buttons?.forEach((b, i) => console.log(`      [${i + 1}] ${b.title}`));
}
