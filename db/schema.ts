import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  index
} from "drizzle-orm/pg-core";

export const transactionType = pgEnum("transaction_type", [
  "credit",
  "debit",
  "refund"
]);

export const transactionStatus = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed",
  "refunded"
]);

export const verificationStatus = pgEnum("verification_status", [
  "pending",
  "success",
  "failed"
]);

export const verificationPurpose = pgEnum("verification_purpose", [
  "banking",
  "education_jamb",
  "education_waec",
  "education_neco",
  "education_nysc",
  "passport",
  "drivers_license",
  "employment",
  "telecommunications",
  "government_service",
  "other"
]);

export const adminRole = pgEnum("admin_role", [
  "user",
  "admin",
  "super_admin"
]);

export const ticketStatus = pgEnum("ticket_status", [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "closed"
]);

export const ticketPriority = pgEnum("ticket_priority", [
  "low",
  "medium",
  "high",
  "urgent"
]);

export const ticketCategory = pgEnum("ticket_category", [
  "payment_issue",
  "verification_problem",
  "account_access",
  "technical_support",
  "general_inquiry"
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: adminRole("role").default("user").notNull(),
  isSuspended: boolean("is_suspended").default(false).notNull(),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspendedReason: text("suspended_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  roleIdx: index("idx_users_role").on(table.role),
  suspendedIdx: index("idx_users_suspended").on(table.isSuspended)
}));

export const wallets = pgTable("wallets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  balance: integer("balance").notNull().default(0),
  currency: text("currency").notNull().default("NGN"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: transactionType("type").notNull(),
  status: transactionStatus("status").notNull(),
  amount: integer("amount").notNull(),
  provider: text("provider").notNull(),
  reference: text("reference"),
  description: text("description"),
  ninMasked: text("nin_masked"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const ninVerifications = pgTable("nin_verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ninMasked: text("nin_masked").notNull(),
  consent: boolean("consent").notNull().default(false),
  status: verificationStatus("status").notNull(),
  purpose: verificationPurpose("purpose"),
  fullName: text("full_name"),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone"),
  providerReference: text("provider_reference"),
  errorMessage: text("error_message"),
  rawResponse: jsonb("raw_response"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  purposeIdx: index("idx_verifications_purpose").on(table.purpose)
}));

export const auditEventType = pgEnum("audit_event_type", [
  "user.registered",
  "user.login",
  "user.logout",
  "wallet.funded",
  "wallet.debited",
  "wallet.refunded",
  "nin.verification.initiated",
  "nin.verification.success",
  "nin.verification.failed",
  "payment.initialized",
  "payment.success",
  "payment.failed",
  "webhook.received",
  "webhook.processed",
  "webhook.failed",
  "api.error",
  "security.suspicious_activity"
]);

export const auditStatus = pgEnum("audit_status", [
  "success",
  "failure",
  "pending"
]);

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  eventType: auditEventType("event_type").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  resource: text("resource"),
  action: text("action").notNull(),
  status: auditStatus("status").notNull(),
  metadata: jsonb("metadata"),
  errorMessage: text("error_message")
});




// Support Tickets
export const supportTickets = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: ticketCategory("category").notNull(),
  subcategory: text("subcategory"),
  status: ticketStatus("status").default("open").notNull(),
  priority: ticketPriority("priority").default("medium").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  
  // Context Fields
  transactionId: text("transaction_id")
    .references(() => walletTransactions.id),
  verificationId: text("verification_id")
    .references(() => ninVerifications.id),
  paymentReference: text("payment_reference"),
  
  // Routing & Assignment
  assignedTo: text("assigned_to")
    .references(() => users.id),
  department: text("department").default("general"), // 'general', 'technical', 'financial', 'management'
  
  // SLA Tracking
  slaTier: text("sla_tier").default("medium"), // 'critical', 'high', 'medium', 'low'
  firstResponseDue: timestamp("first_response_due", { withTimezone: true }),
  resolutionDue: timestamp("resolution_due", { withTimezone: true }),
  firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
  
  // Satisfaction
  satisfactionRating: integer("satisfaction_rating"), // 1-5 scale
  satisfactionFeedback: text("satisfaction_feedback"),
  
  // Metadata
  sourceChannel: text("source_channel").default("web"), // 'web', 'email', 'whatsapp', 'phone'
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true })
}, (table) => ({
  userIdx: index("idx_tickets_user").on(table.userId),
  statusIdx: index("idx_tickets_status").on(table.status),
  priorityIdx: index("idx_tickets_priority").on(table.priority),
  assignedIdx: index("idx_tickets_assigned").on(table.assignedTo),
  createdIdx: index("idx_tickets_created").on(table.createdAt),
  slaIdx: index("idx_tickets_sla").on(table.slaTier, table.firstResponseDue),
  departmentIdx: index("idx_tickets_department").on(table.department)
}));

// Ticket Messages
export const ticketMessages = pgTable("ticket_messages", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  senderType: text("sender_type").default("user").notNull(), // 'user', 'agent', 'system'
  
  message: text("message").notNull(),
  messageType: text("message_type").default("text").notNull(), // 'text', 'image', 'file', 'system_note'
  
  // Internal Notes
  isInternal: boolean("is_internal").default(false).notNull(),
  isSystemGenerated: boolean("is_system_generated").default(false).notNull(),
  
  // Attachments
  attachments: jsonb("attachments"),
  
  // Metadata
  readAt: timestamp("read_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  ticketIdx: index("idx_ticket_messages_ticket").on(table.ticketId, table.createdAt),
  senderIdx: index("idx_ticket_messages_sender").on(table.senderId),
  typeIdx: index("idx_ticket_messages_type").on(table.senderType, table.messageType)
}));

// Admin Actions Log
export const adminActions = pgTable("admin_actions", {
  id: text("id").primaryKey(),
  adminId: text("admin_id")
    .notNull()
    .references(() => users.id),
  actionType: text("action_type").notNull(),
  targetUserId: text("target_user_id")
    .references(() => users.id),
  targetResource: text("target_resource"),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  adminIdx: index("idx_admin_actions_admin").on(table.adminId, table.createdAt),
  typeIdx: index("idx_admin_actions_type").on(table.actionType),
  targetIdx: index("idx_admin_actions_target").on(table.targetUserId),
  createdIdx: index("idx_admin_actions_created").on(table.createdAt)
}));
