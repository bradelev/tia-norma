import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Action, Catalog, Piece } from "../../ports/catalog";
import { drafts, lastAction, pieces } from "./schema";

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
        await remember(tx, previewId, "publish", row!.number);
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
    async piece(number) {
      const [row] = await db
        .select()
        .from(pieces)
        .where(eq(pieces.number, number));
      return row ? { ...toPiece(row), status: row.status } : null;
    },
    takeDown(number, actionId) {
      return db.transaction(async (tx) => {
        const [row] = await tx
          .update(pieces)
          .set({ status: "takenDown", updatedAt: sql`now()` })
          .where(eq(pieces.number, number))
          .returning();
        if (row) await remember(tx, actionId, "takeDown", number);
      });
    },
    undo(actionId) {
      return db.transaction(async (tx) => {
        // Locks the row so two Deshacer at once revert only one action.
        const [last] = await tx.select().from(lastAction).for("update");
        if (!last || (actionId && actionId !== last.actionId)) return null;
        const [row] = await tx
          .update(pieces)
          .set({
            status: last.kind === "publish" ? "takenDown" : "published",
            updatedAt: sql`now()`,
          })
          .where(eq(pieces.number, last.pieceNumber))
          .returning();
        await tx.delete(lastAction);
        const action: Action = {
          id: last.actionId,
          kind: last.kind,
          piece: toPiece(row!),
        };
        return action;
      });
    },
  };
}

type Tx = Parameters<
  Parameters<ReturnType<typeof drizzle>["transaction"]>[0]
>[0];

function remember(
  tx: Tx,
  actionId: string,
  kind: Action["kind"],
  pieceNumber: number,
) {
  const values = { actionId, kind, pieceNumber };
  return tx
    .insert(lastAction)
    .values(values)
    .onConflictDoUpdate({ target: lastAction.id, set: values });
}

function toPiece(row: typeof pieces.$inferSelect): Piece {
  return {
    number: row.number,
    name: row.name,
    price: row.price,
    image: row.imageUrl,
  };
}
