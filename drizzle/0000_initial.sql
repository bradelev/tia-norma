CREATE TYPE "public"."piece_status" AS ENUM('published', 'takenDown');--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"payload" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drafts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pieces" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"preview_id" text NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"image_url" text NOT NULL,
	"status" "piece_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pieces_number_unique" UNIQUE("number"),
	CONSTRAINT "pieces_preview_id_unique" UNIQUE("preview_id")
);
--> statement-breakpoint
ALTER TABLE "pieces" ENABLE ROW LEVEL SECURITY;