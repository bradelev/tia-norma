import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

/** `ENV_FILE=.env.test.local pnpm db:migrate` migrates the test project. */
const envFile = process.env.ENV_FILE ?? ".env.local";
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/adapters/postgres/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL_MIGRATIONS ?? "" },
});
