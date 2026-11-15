import { z } from "zod";

const supabaseSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  /** Transaction pooler (port 6543). Migrations use DATABASE_URL_MIGRATIONS. */
  DATABASE_URL: z.url(),
});

export type SupabaseEnv = z.infer<typeof supabaseSchema>;

/**
 * The Supabase settings, or null when none is set: then the page shows the
 * sample pieces, so `pnpm dev` and CI work without keys. Production never does.
 */
export function supabaseEnv(
  env: Record<string, string | undefined> = process.env,
): SupabaseEnv | null {
  const names = Object.keys(supabaseSchema.shape);
  const noneSet = names.every((name) => !env[name]);
  if (noneSet && env.VERCEL_ENV !== "production") return null;
  return supabaseSchema.parse(env);
}
