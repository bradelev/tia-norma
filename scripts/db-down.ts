import { readFileSync } from "node:fs";
import postgres from "postgres";
import journal from "../drizzle/meta/_journal.json";

/** Reverts the last migration in the journal with its hand-written `.down.sql`. */
async function main() {
  process.loadEnvFile(".env.local");
  const last = journal.entries.at(-1);
  if (!last) throw new Error("No hay migraciones");
  const down = readFileSync(`drizzle/${last.tag}.down.sql`, "utf8");
  const sql = postgres(process.env.DATABASE_URL_MIGRATIONS ?? "");
  await sql.begin(async (tx) => {
    for (const statement of down.split("--> statement-breakpoint"))
      await tx.unsafe(statement);
  });
  await sql.end();
  console.log(`Revertida ${last.tag}`);
}

void main();
