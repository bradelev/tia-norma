import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Catalog, Piece } from "../../ports/catalog";
import { drafts, pieces } from "./schema";

/** `databaseUrl` is Supabase's transaction pooler, which cannot keep prepared statements. */
export function createPostgresCatalog(databaseUrl: string): Catalog {
  const db = drizzle(postgres(databaseUrl, { prepare: false }));

  return {
    async draft() {
      const [row] = await db.select().from(drafts);
      return row?.payload ?? null;
    },
    async saveDraft(payload) {
      await db
        .insert(drafts)
        .values({ payload })
        .onConflictDoUpdate({
          target: drafts.id,
          set: { payload, updatedAt: sql`now()` },
        });
    },
    publish(previewId, data) {
      return db.transaction(async (tx) => {
        // One publish at a time: the next number is computed and taken without a race.
        await tx.execute(sql`lock table ${pieces} in exclusive mode`);
        const [already] = await tx
          .select()
          .from(pieces)
          .where(eq(pieces.previewId, previewId));
        if (already) return toPiece(already);
        const [row] = await tx
          .insert(pieces)
          .values({
            number: sql`(select coalesce(max(number), 0) + 1 from pieces)`,
            previewId,
            name: data.name,
            price: data.price,
            imageUrl: data.image,
          })
          .returning();
        await tx.delete(drafts);
        return toPiece(row!);
      });
    },
    async publishedFrom(previewId) {
      const [row] = await db
        .select()
        .from(pieces)
        .where(eq(pieces.previewId, previewId));
      return row ? toPiece(row) : null;
    },
    async published() {
      const rows = await db
        .select()
        .from(pieces)
        .where(eq(pieces.status, "published"))
        .orderBy(desc(pieces.number));
      return rows.map(toPiece);
    },
  };
}

function toPiece(row: typeof pieces.$inferSelect): Piece {
  return {
    number: row.number,
    name: row.name,
    price: row.price,
    image: row.imageUrl,
  };
}
