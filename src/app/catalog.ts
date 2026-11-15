import { cacheTag, revalidateTag } from "next/cache";
import { createPostgresCatalog } from "@/adapters/postgres/catalog";
import type { Catalog, Piece } from "@/ports/catalog";
import { supabaseEnv } from "./env";
import { samplePieces } from "./sample-pieces";

const PIECES_TAG = "pieces";
let cached: Catalog | null | undefined;

/** The real catalog, or null when Supabase is not configured (`pnpm dev` and CI). */
export function catalog(): Catalog | null {
  if (cached === undefined) {
    const env = supabaseEnv();
    cached = env && revalidating(createPostgresCatalog(env.DATABASE_URL));
  }
  return cached;
}

/** What the page shows. It stays cached until an action changes it. */
export async function pageContent(): Promise<{
  pieces: Piece[];
  samples: boolean;
}> {
  "use cache";
  cacheTag(PIECES_TAG);
  const real = catalog();
  if (!real) return { pieces: samplePieces, samples: true };
  return { pieces: await real.published(), samples: false };
}

/** Every action expires the page right away, so the next visit shows it (R1). */
function revalidating(inner: Catalog): Catalog {
  return {
    ...inner,
    async publish(previewId, piece) {
      const published = await inner.publish(previewId, piece);
      revalidateTag(PIECES_TAG, { expire: 0 });
      return published;
    },
    async takeDown(number, actionId) {
      await inner.takeDown(number, actionId);
      revalidateTag(PIECES_TAG, { expire: 0 });
    },
    async undo(actionId) {
      const undone = await inner.undo(actionId);
      if (undone) revalidateTag(PIECES_TAG, { expire: 0 });
      return undone;
    },
  };
}
