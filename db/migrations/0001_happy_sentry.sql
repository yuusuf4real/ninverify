CREATE TYPE "public"."audit_event_type" AS ENUM('user.registered', 'user.login', 'user.logout', 'wallet.funded', 'wallet.debited', 'wallet.refunded', 'nin.verification.initiated', 'nin.verification.success', 'nin.verification.failed', 'payment.initialized', 'payment.success', 'payment.failed', 'webhook.received', 'webhook.processed', 'webhook.failed', 'api.error', 'security.suspicious_activity');--> statement-breakpoint
CREATE TYPE "public"."audit_status" AS ENUM('success', 'failure', 'pending');--> statement-breakpoint
CREATE TYPE "public"."verification_purpose" AS ENUM('banking', 'education_jamb', 'education_waec', 'education_neco', 'education_nysc', 'passport', 'drivers_license', 'employment', 'telecommunications', 'government_service', 'other');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"event_type" "audit_event_type" NOT NULL,
	"user_id" text,
	"ip_address" text,
	"user_agent" text,
	"resource" text,
	"action" text NOT NULL,
	"status" "audit_status" NOT NULL,
	"metadata" jsonb,
	"error_message" text
);
--> statement-breakpoint
ALTER TABLE "nin_verifications" ADD COLUMN "purpose" "verification_purpose";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_verifications_purpose" ON "nin_verifications" USING btree ("purpose");--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id");