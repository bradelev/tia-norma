import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

/**
 * Runs against a Supabase project only for tests, never the one the page uses:
 * the tests publish and take down pieces. Not part of CI.
 */
const ENV_FILE = ".env.test.local";
if (!existsSync(ENV_FILE))
  throw new Error(
    `Falta ${ENV_FILE}: copiá .env.example con las claves de un proyecto de Supabase solo para tests.`,
  );
process.loadEnvFile(ENV_FILE);

export default defineConfig({
  // Each call crosses the network to Supabase.
  test: { include: ["src/**/*.integration.test.ts"], testTimeout: 20_000 },
});
