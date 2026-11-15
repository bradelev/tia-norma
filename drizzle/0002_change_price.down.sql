-- Revierte 0002_change_price con `pnpm db:down`. Un cambio de precio pendiente de deshacer se olvida.
DELETE FROM "last_action" WHERE "kind" = 'changePrice';--> statement-breakpoint
ALTER TABLE "last_action" DROP COLUMN "previous_price";--> statement-breakpoint
DELETE FROM drizzle.__drizzle_migrations WHERE created_at = 1794744811290;
