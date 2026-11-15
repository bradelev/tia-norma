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
import type { Draft } from "../../ports/catalog";

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
