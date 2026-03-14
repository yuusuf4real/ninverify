-- Safe Admin System Migration
-- This migration safely adds admin features without conflicts

-- Create admin_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "public"."admin_role" AS ENUM('admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ticket enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "public"."ticket_category" AS ENUM('payment_issue', 'verification_problem', 'account_access', 'technical_support', 'general_inquiry');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ticket_status" AS ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add admin columns to users table if they don't exist
DO $$ BEGIN
    ALTER TABLE "users" ADD COLUMN "role" "admin_role" DEFAULT 'admin' NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "users" ADD COLUMN "is_suspended" boolean DEFAULT false NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "users" ADD COLUMN "suspended_at" timestamp with time zone;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "users" ADD COLUMN "suspended_reason" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "admin_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"action_type" text NOT NULL,
	"target_user_id" text,
	"target_resource" text,
	"description" text NOT NULL,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create support_tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category" "ticket_category" NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'medium' NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"payment_reference" text,
	"verification_id" text,
	"assigned_to" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);

-- Create ticket_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ticket_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"user_id" text NOT NULL,
	"message" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"attachments" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
    ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_verification_id_nin_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."nin_verifications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "idx_admin_actions_admin" ON "admin_actions" USING btree ("admin_id","created_at");
CREATE INDEX IF NOT EXISTS "idx_admin_actions_type" ON "admin_actions" USING btree ("action_type");
CREATE INDEX IF NOT EXISTS "idx_admin_actions_target" ON "admin_actions" USING btree ("target_user_id");
CREATE INDEX IF NOT EXISTS "idx_admin_actions_created" ON "admin_actions" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idx_tickets_user" ON "support_tickets" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_tickets_status" ON "support_tickets" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_tickets_priority" ON "support_tickets" USING btree ("priority");
CREATE INDEX IF NOT EXISTS "idx_tickets_assigned" ON "support_tickets" USING btree ("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_tickets_created" ON "support_tickets" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idx_ticket_messages_ticket" ON "ticket_messages" USING btree ("ticket_id","created_at");
CREATE INDEX IF NOT EXISTS "idx_ticket_messages_user" ON "ticket_messages" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" USING btree ("role");
CREATE INDEX IF NOT EXISTS "idx_users_suspended" ON "users" USING btree ("is_suspended");