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

const whatsappSchema = z.object({
  WHATSAPP_TOKEN: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().regex(/^\d+$/),
  WHATSAPP_APP_SECRET: z.string().min(1),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1),
  /** Comma-separated, written any way; kept as digits only, like WhatsApp sends them. */
  AUTHORIZED_NUMBERS: z
    .string()
    .transform((list) =>
      list
        .split(",")
        .map((number) => number.replace(/\D/g, ""))
        .filter(Boolean),
    )
    .pipe(z.array(z.string().min(8)).min(1)),
});

export type WhatsAppEnv = z.infer<typeof whatsappSchema>;

/** The WhatsApp settings, read on the first webhook call so the build needs none. */
export function whatsappEnv(
  env: Record<string, string | undefined> = process.env,
): WhatsAppEnv {
  return whatsappSchema.parse(env);
}
