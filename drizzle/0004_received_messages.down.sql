-- Revierte 0004_received_messages con `pnpm db:down`. Se olvidan los ids de mensaje ya recibidos.
DROP TABLE "received_messages";--> statement-breakpoint
DELETE FROM drizzle.__drizzle_migrations WHERE created_at = 1794750556815;
