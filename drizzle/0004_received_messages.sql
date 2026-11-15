CREATE TABLE "received_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "received_messages" ENABLE ROW LEVEL SECURITY;