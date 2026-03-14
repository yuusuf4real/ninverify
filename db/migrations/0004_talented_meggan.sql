ALTER TABLE "ticket_messages" DROP CONSTRAINT "ticket_messages_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ticket_messages_user";--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "subcategory" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "transaction_id" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "department" text DEFAULT 'general';--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "sla_tier" text DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "first_response_due" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "resolution_due" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "first_response_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "satisfaction_rating" integer;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "satisfaction_feedback" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "source_channel" text DEFAULT 'web';--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD COLUMN "sender_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD COLUMN "sender_type" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD COLUMN "message_type" text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD COLUMN "is_system_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tickets_sla" ON "support_tickets" USING btree ("sla_tier","first_response_due");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tickets_department" ON "support_tickets" USING btree ("department");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ticket_messages_sender" ON "ticket_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ticket_messages_type" ON "ticket_messages" USING btree ("sender_type","message_type");--> statement-breakpoint
ALTER TABLE "ticket_messages" DROP COLUMN IF EXISTS "user_id";--> statement-breakpoint
ALTER TABLE "ticket_messages" DROP COLUMN IF EXISTS "is_admin";