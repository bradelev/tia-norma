import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Action, Catalog, Piece } from "../../ports/catalog";
import { drafts, lastAction, pieces, receivedMessages } from "./schema";

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
    async nextNumber() {
      const [row] = await db
        .select({ next: sql<number>`coalesce(max(${pieces.number}), 0) + 1` })
        .from(pieces);
      return Number(row!.next);
    },
    async published() {
      const rows = await db
        .select()
        .from(pieces)
        .where(eq(pieces.status, "published"))
        .orderBy(desc(pieces.number));
      return rows.map((row) => ({
        ...toPiece(row),
        publishedAt: row.createdAt,
      }));
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
    change(previewId, change) {
      return db.transaction(async (tx) => {
        // Locks the draft so two "Sí, cambiar" at once apply it only once.
        const [open] = await tx.select().from(drafts).for("update");
        if (open?.payload.previewId !== previewId) return null;
        const [before] = await tx
          .select()
          .from(pieces)
          .where(eq(pieces.number, change.number));
        if (!before) return null;
        const set =
          "price" in change
            ? { price: change.price }
            : { imageUrl: change.image };
        const [row] = await tx
          .update(pieces)
          .set({ ...set, updatedAt: sql`now()` })
          .where(eq(pieces.number, change.number))
          .returning();
        await tx.delete(drafts);
        await remember(
          tx,
          previewId,
          "price" in change ? "changePrice" : "changePhoto",
          change.number,
          { previousPrice: before.price, previousImageUrl: before.imageUrl },
        );
        return toPiece(row!);
      });
    },
    undo(actionId) {
      return db.transaction(async (tx) => {
        // Locks the row so two Deshacer at once revert only one action.
        const [last] = await tx.select().from(lastAction).for("update");
        if (!last || (actionId && actionId !== last.actionId)) return null;
        const [row] = await tx
          .update(pieces)
          .set({ ...revert(last), updatedAt: sql`now()` })
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
    async recordMessage(messageId) {
      // The primary key decides: of two deliveries at once, one inserts.
      const inserted = await db
        .insert(receivedMessages)
        .values({ id: messageId })
        .onConflictDoNothing()
        .returning({ id: receivedMessages.id });
      return inserted.length > 0;
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
  /** What a change replaced, for Deshacer. */
  previous: { previousPrice: number; previousImageUrl: string } | null = null,
) {
  const values = {
    actionId,
    kind,
    pieceNumber,
    previousPrice: previous?.previousPrice ?? null,
    previousImageUrl: previous?.previousImageUrl ?? null,
  };
  return tx
    .insert(lastAction)
    .values(values)
    .onConflictDoUpdate({ target: lastAction.id, set: values });
}

/** What puts the piece back as it was before `last`. */
function revert(
  last: typeof lastAction.$inferSelect,
): Partial<typeof pieces.$inferInsert> {
  switch (last.kind) {
    case "publish":
      return { status: "takenDown" };
    case "takeDown":
      return { status: "published" };
    case "changePrice":
      return last.previousPrice === null ? {} : { price: last.previousPrice };
    case "changePhoto":
      return last.previousImageUrl === null
        ? {}
        : { imageUrl: last.previousImageUrl };
  }
}

function toPiece(row: typeof pieces.$inferSelect): Piece {
  return {
    number: row.number,
    name: row.name,
    price: row.price,
    image: row.imageUrl,
  };
}
