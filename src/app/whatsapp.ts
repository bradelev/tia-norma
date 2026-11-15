import { randomUUID } from "node:crypto";
import { createMemoryInterpreter } from "@/adapters/memory/interpreter";
import { createSharpImageProcessor } from "@/adapters/sharp/image-processor";
import { createSupabaseMediaStore } from "@/adapters/supabase-storage/media-store";
import { createCloudApiMessenger } from "@/adapters/whatsapp/messenger";
import { createBot } from "@/domain/bot";
import { catalog } from "./catalog";
import { supabaseEnv, whatsappEnv } from "./env";
import { createWebhook, type Webhook } from "./webhook";

let cached: Webhook | undefined;

/** The webhook wired to the real adapters, built on the first call. */
export function whatsapp(): Webhook {
  if (cached) return cached;
  const env = whatsappEnv();
  const supabase = supabaseEnv();
  const real = catalog();
  if (!supabase || !real) throw new Error("El webhook necesita Supabase");
  const messenger = createCloudApiMessenger({
    token: env.WHATSAPP_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
  });
  const bot = createBot({
    catalog: real,
    media: createSupabaseMediaStore(
      supabase.SUPABASE_URL,
      supabase.SUPABASE_SECRET_KEY,
    ),
    images: createSharpImageProcessor(),
    // TEMPORARY: the rule-based double stands in until the real Interpreter (#13).
    // It only understands "nombre, precio" and a few fixed phrases.
    interpreter: createMemoryInterpreter(),
    newId: () => randomUUID(),
  });
  cached = createWebhook({
    appSecret: env.WHATSAPP_APP_SECRET,
    verifyToken: env.WHATSAPP_VERIFY_TOKEN,
    authorized: env.AUTHORIZED_NUMBERS,
    messenger,
    catalog: real,
    bot,
  });
  return cached;
}
