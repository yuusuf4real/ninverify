ALTER TYPE "public"."admin_role" ADD VALUE 'user' BEFORE 'admin';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';