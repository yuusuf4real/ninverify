ALTER TYPE "public"."audit_event_type" ADD VALUE 'security.unauthorized_admin_access';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'security.admin_user_portal_access';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'security.ip_blocked';--> statement-breakpoint
ALTER TYPE "public"."audit_event_type" ADD VALUE 'security.rate_limit_exceeded';--> statement-breakpoint
ALTER TYPE "public"."audit_status" ADD VALUE 'blocked';