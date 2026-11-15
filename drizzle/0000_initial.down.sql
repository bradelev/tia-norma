-- Revierte 0000_initial con `pnpm db:down`.
DROP TABLE "pieces";--> statement-breakpoint
DROP TABLE "drafts";--> statement-breakpoint
DROP TYPE "public"."piece_status";--> statement-breakpoint
DELETE FROM drizzle.__drizzle_migrations WHERE created_at = 1794710448618;
