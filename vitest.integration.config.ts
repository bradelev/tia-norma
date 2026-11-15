import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

/** Runs against the Supabase project in `.env.local`. Not part of CI. */
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  test: { include: ["src/**/*.integration.test.ts"] },
});
