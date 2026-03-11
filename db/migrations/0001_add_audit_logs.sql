-- Create audit event type enum
CREATE TYPE "public"."audit_event_type" AS ENUM(
  'user.registered',
  'user.login',
  'user.logout',
  'wallet.funded',
  'wallet.debited',
  'wallet.refunded',
  'nin.verification.initiated',
  'nin.verification.success',
  'nin.verification.failed',
  'payment.initialized',
  'payment.success',
  'payment.failed',
  'webhook.received',
  'webhook.processed',
  'webhook.failed',
  'api.error',
  'security.suspicious_activity'
);

-- Create audit status enum
CREATE TYPE "public"."audit_status" AS ENUM('success', 'failure', 'pending');

-- Create audit_logs table
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

-- Add foreign key constraint
DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_event_type_idx" ON "audit_logs"("event_type");
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "audit_logs_status_idx" ON "audit_logs"("status");
