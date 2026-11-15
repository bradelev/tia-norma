import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { MediaStore } from "../../ports/media-store";

/** Public bucket created by the first migration. */
const BUCKET = "photos";
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function createSupabaseMediaStore(
  url: string,
  secretKey: string,
): MediaStore {
  const bucket = createClient(url, secretKey).storage.from(BUCKET);

  return {
    async save(bytes, contentType) {
      const extension = extensions[contentType];
      if (!extension)
        throw new Error(`Tipo de imagen no admitido: ${contentType}`);
      const path = `${randomUUID()}.${extension}`;
      const { error } = await bucket.upload(path, bytes, { contentType });
      if (error) throw error;
      return bucket.getPublicUrl(path).data.publicUrl;
    },
  };
}
