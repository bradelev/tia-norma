import { randomUUID } from "node:crypto";
import {
  claudeMessages,
  createClaudeInterpreter,
} from "@/adapters/claude/interpreter";
import { createGroqTranscriber } from "@/adapters/groq/transcriber";
import { createSatoriPreviewRenderer } from "@/adapters/satori/preview-renderer";
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
    previews: createSatoriPreviewRenderer(),
    interpreter: createClaudeInterpreter({
      messages: claudeMessages(env.ANTHROPIC_API_KEY),
    }),
    newId: () => randomUUID(),
    now: () => Date.now(),
  });
  cached = createWebhook({
    appSecret: env.WHATSAPP_APP_SECRET,
    verifyToken: env.WHATSAPP_VERIFY_TOKEN,
    authorized: env.AUTHORIZED_NUMBERS,
    messenger,
    catalog: real,
    bot,
    transcriber: createGroqTranscriber({ apiKey: env.GROQ_API_KEY }),
  });
  return cached;
}
