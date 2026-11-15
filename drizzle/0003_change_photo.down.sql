-- Revierte 0003_change_photo con `pnpm db:down`. Un cambio de foto pendiente de deshacer se olvida.
DELETE FROM "last_action" WHERE "kind" = 'changePhoto';--> statement-breakpoint
ALTER TABLE "last_action" DROP COLUMN "previous_image_url";--> statement-breakpoint
DELETE FROM drizzle.__drizzle_migrations WHERE created_at = 1794747540177;
