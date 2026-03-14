-- =====================================================
-- COMPLETE DATABASE DEPLOYMENT SCRIPT
-- NIN Verification Platform - Production Ready
-- =====================================================
-- 
-- This script creates a complete database setup for fresh deployment
-- Run this on a new Neon database instance
-- 
-- IMPORTANT: 
-- - Verification cost is ₦500 (50000 kobo)
-- - All amounts are stored in kobo (smallest currency unit)
-- - 1 Naira = 100 kobo
-- 
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS SECTION
-- =====================================================

-- Transaction related enums
CREATE TYPE "public"."transaction_type" AS ENUM('credit', 'debit', 'refund');
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'refunded');

-- Verification related enums
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'success', 'failed');
CREATE TYPE "public"."verification_purpose" AS ENUM(
    'banking',
    'education_jamb',
    'education_waec', 
    'education_neco',
    'education_nysc',
    'passport',
    'drivers_license',
    'employment',
    'telecommunications',
    'government_service',
    'other'
);

-- Admin and user management enums
CREATE TYPE "public"."admin_role" AS ENUM('user', 'admin', 'super_admin');

-- Support ticket enums
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed');
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent');
CREATE TYPE "public"."ticket_category" AS ENUM(
    'payment_issue',
    'verification_problem', 
    'account_access',
    'technical_support',
    'general_inquiry'
);

-- Audit and logging enums
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

CREATE TYPE "public"."audit_status" AS ENUM('success', 'failure', 'pending');

-- =====================================================
-- CORE TABLES SECTION
-- =====================================================

-- Users table (core entity)
CREATE TABLE "public"."users" (
    "id" text PRIMARY KEY NOT NULL,
    "full_name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "phone" text NOT NULL,
    "password_hash" text NOT NULL,
    "role" "admin_role" DEFAULT 'user' NOT NULL,
    "is_suspended" boolean DEFAULT false NOT NULL,
    "suspended_at" timestamp with time zone,
    "suspended_reason" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Wallets table (financial core)
CREATE TABLE "public"."wallets" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL UNIQUE,
    "balance" integer NOT NULL DEFAULT 0, -- Amount in kobo (₦500 = 50000 kobo)
    "currency" text NOT NULL DEFAULT 'NGN',
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "wallets_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- Wallet transactions table (financial history)
CREATE TABLE "public"."wallet_transactions" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "type" "transaction_type" NOT NULL,
    "status" "transaction_status" NOT NULL,
    "amount" integer NOT NULL, -- Amount in kobo
    "provider" text NOT NULL,
    "reference" text,
    "description" text,
    "nin_masked" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "wallet_transactions_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- NIN verifications table (core business logic)
CREATE TABLE "public"."nin_verifications" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "nin_masked" text NOT NULL,
    "consent" boolean NOT NULL DEFAULT false,
    "status" "verification_status" NOT NULL,
    "purpose" "verification_purpose",
    "full_name" text,
    "date_of_birth" text,
    "phone" text,
    "provider_reference" text,
    "error_message" text,
    "raw_response" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "nin_verifications_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- =====================================================
-- ADMIN & SUPPORT TABLES SECTION
-- =====================================================

-- Support tickets table
CREATE TABLE "public"."support_tickets" (
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
    "resolved_at" timestamp with time zone,
    CONSTRAINT "support_tickets_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "support_tickets_verification_id_nin_verifications_id_fk" 
        FOREIGN KEY ("verification_id") REFERENCES "public"."nin_verifications"("id"),
    CONSTRAINT "support_tickets_assigned_to_users_id_fk" 
        FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id")
);

-- Ticket messages table
CREATE TABLE "public"."ticket_messages" (
    "id" text PRIMARY KEY NOT NULL,
    "ticket_id" text NOT NULL,
    "user_id" text NOT NULL,
    "message" text NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "is_internal" boolean DEFAULT false NOT NULL,
    "attachments" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "ticket_messages_ticket_id_support_tickets_id_fk" 
        FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE,
    CONSTRAINT "ticket_messages_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
);

-- Admin actions log table
CREATE TABLE "public"."admin_actions" (
    "id" text PRIMARY KEY NOT NULL,
    "admin_id" text NOT NULL,
    "action_type" text NOT NULL,
    "target_user_id" text,
    "target_resource" text,
    "description" text NOT NULL,
    "metadata" jsonb,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "admin_actions_admin_id_users_id_fk" 
        FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id"),
    CONSTRAINT "admin_actions_target_user_id_users_id_fk" 
        FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id")
);

-- =====================================================
-- AUDIT & LOGGING TABLES SECTION
-- =====================================================

-- Audit logs table (comprehensive system logging)
CREATE TABLE "public"."audit_logs" (
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
    "error_message" text,
    CONSTRAINT "audit_logs_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL
);

-- =====================================================
-- INDEXES SECTION (Performance Optimization)
-- =====================================================

-- User table indexes
CREATE INDEX "idx_users_email" ON "public"."users" USING btree ("email");
CREATE INDEX "idx_users_role" ON "public"."users" USING btree ("role");
CREATE INDEX "idx_users_suspended" ON "public"."users" USING btree ("is_suspended");
CREATE INDEX "idx_users_created" ON "public"."users" USING btree ("created_at");

-- Wallet indexes
CREATE INDEX "idx_wallets_user_id" ON "public"."wallets" USING btree ("user_id");
CREATE INDEX "idx_wallets_balance" ON "public"."wallets" USING btree ("balance");

-- Transaction indexes
CREATE INDEX "idx_wallet_transactions_user_id" ON "public"."wallet_transactions" USING btree ("user_id");
CREATE INDEX "idx_wallet_transactions_type" ON "public"."wallet_transactions" USING btree ("type");
CREATE INDEX "idx_wallet_transactions_status" ON "public"."wallet_transactions" USING btree ("status");
CREATE INDEX "idx_wallet_transactions_created" ON "public"."wallet_transactions" USING btree ("created_at");
CREATE INDEX "idx_wallet_transactions_reference" ON "public"."wallet_transactions" USING btree ("reference");

-- Verification indexes
CREATE INDEX "idx_verifications_user_id" ON "public"."nin_verifications" USING btree ("user_id");
CREATE INDEX "idx_verifications_status" ON "public"."nin_verifications" USING btree ("status");
CREATE INDEX "idx_verifications_purpose" ON "public"."nin_verifications" USING btree ("purpose");
CREATE INDEX "idx_verifications_created" ON "public"."nin_verifications" USING btree ("created_at");

-- Support ticket indexes
CREATE INDEX "idx_tickets_user" ON "public"."support_tickets" USING btree ("user_id");
CREATE INDEX "idx_tickets_status" ON "public"."support_tickets" USING btree ("status");
CREATE INDEX "idx_tickets_priority" ON "public"."support_tickets" USING btree ("priority");
CREATE INDEX "idx_tickets_assigned" ON "public"."support_tickets" USING btree ("assigned_to");
CREATE INDEX "idx_tickets_created" ON "public"."support_tickets" USING btree ("created_at");

-- Ticket message indexes
CREATE INDEX "idx_ticket_messages_ticket" ON "public"."ticket_messages" USING btree ("ticket_id", "created_at");
CREATE INDEX "idx_ticket_messages_user" ON "public"."ticket_messages" USING btree ("user_id");

-- Admin action indexes
CREATE INDEX "idx_admin_actions_admin" ON "public"."admin_actions" USING btree ("admin_id", "created_at");
CREATE INDEX "idx_admin_actions_type" ON "public"."admin_actions" USING btree ("action_type");
CREATE INDEX "idx_admin_actions_target" ON "public"."admin_actions" USING btree ("target_user_id");
CREATE INDEX "idx_admin_actions_created" ON "public"."admin_actions" USING btree ("created_at");

-- Audit log indexes
CREATE INDEX "idx_audit_logs_timestamp" ON "public"."audit_logs" USING btree ("timestamp");
CREATE INDEX "idx_audit_logs_event_type" ON "public"."audit_logs" USING btree ("event_type");
CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING btree ("user_id");
CREATE INDEX "idx_audit_logs_status" ON "public"."audit_logs" USING btree ("status");

-- =====================================================
-- INITIAL DATA SECTION
-- =====================================================

-- NOTE: Super admin user will be created via Node.js script
-- This ensures proper password hashing with bcrypt
-- Run: npm run create-super-admin after database setup

-- The create-super-admin script will:
-- 1. Create the super admin user with proper bcrypt hash
-- 2. Create the associated wallet
-- 3. Verify the setup is correct

-- =====================================================
-- VERIFICATION & VALIDATION
-- =====================================================

-- Verify table creation
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 'wallets', 'wallet_transactions', 'nin_verifications',
        'support_tickets', 'ticket_messages', 'admin_actions', 'audit_logs'
    );
    
    IF table_count = 8 THEN
        RAISE NOTICE 'SUCCESS: All 8 core tables created successfully';
    ELSE
        RAISE EXCEPTION 'ERROR: Expected 8 tables, found %', table_count;
    END IF;
END $$;

-- Verify enum creation
DO $$
DECLARE
    enum_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO enum_count 
    FROM pg_type 
    WHERE typname IN (
        'transaction_type', 'transaction_status', 'verification_status',
        'verification_purpose', 'admin_role', 'ticket_status', 
        'ticket_priority', 'ticket_category', 'audit_event_type', 'audit_status'
    );
    
    IF enum_count = 10 THEN
        RAISE NOTICE 'SUCCESS: All 10 enums created successfully';
    ELSE
        RAISE EXCEPTION 'ERROR: Expected 10 enums, found %', enum_count;
    END IF;
END $$;

-- Verify super admin creation (will be done by script)
DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: Database structure created successfully';
    RAISE NOTICE 'NEXT STEP: Run npm run create-super-admin to create admin user';
END $$;

-- =====================================================
-- DEPLOYMENT SUMMARY
-- =====================================================

RAISE NOTICE '==============================================';
RAISE NOTICE 'DATABASE DEPLOYMENT COMPLETED SUCCESSFULLY';
RAISE NOTICE '==============================================';
RAISE NOTICE 'Tables Created: 8';
RAISE NOTICE 'Enums Created: 10'; 
RAISE NOTICE 'Indexes Created: 25+';
RAISE NOTICE '==============================================';
RAISE NOTICE 'NEXT STEPS:';
RAISE NOTICE '1. Run: npm run create-super-admin';
RAISE NOTICE '2. Login at: /admin-login';
RAISE NOTICE '3. Email: admin@verifynin.ng';
RAISE NOTICE '4. Password: YourSecurePassword123!';
RAISE NOTICE '==============================================';
RAISE NOTICE 'IMPORTANT NOTES:';
RAISE NOTICE '- All amounts stored in kobo (₦500 = 50000 kobo)';
RAISE NOTICE '- NIN verification cost: ₦500 (50000 kobo)';
RAISE NOTICE '- Change super admin password after first login';
RAISE NOTICE '- Database is ready for production deployment';
RAISE NOTICE '==============================================';