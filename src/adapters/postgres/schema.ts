import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Action, Draft } from "../../ports/catalog";

/** A taken-down piece keeps its row and its number; rows are never deleted. */
export const pieceStatus = pgEnum("piece_status", ["published", "takenDown"]);

export const pieces = pgTable("pieces", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  previewId: text("preview_id").notNull().unique(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  status: pieceStatus("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();

/** There is at most one open draft, so the table holds at most one row. */
export const drafts = pgTable("drafts", {
  id: smallint("id").primaryKey().default(1),
  payload: jsonb("payload").$type<Draft>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();

/** The last action applied to the page, so Deshacer can revert it. At most one row. */
export const lastAction = pgTable("last_action", {
  id: smallint("id").primaryKey().default(1),
  actionId: text("action_id").notNull(),
  kind: text("kind").$type<Action["kind"]>().notNull(),
  pieceNumber: integer("piece_number")
    .notNull()
    .references(() => pieces.number),
  previousPrice: integer("previous_price"),
}).enableRLS();
