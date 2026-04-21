import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// Session-based verification system schema

export const otpStatus = pgEnum("otp_status", [
  "pending",
  "verified",
  "expired",
  "failed",
]);

export const dataLayer = pgEnum("data_layer", [
  "demographic", // name, DOB, NIN, phone
  "biometric", // photo, signature
  "full", // everything
]);

export const sessionStatus = pgEnum("session_status", [
  "otp_pending",
  "otp_verified",
  "nin_entered",
  "payment_pending",
  "payment_completed",
  "verification_completed",
  "expired",
  "failed",
]);

export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "cancelled",
]);

// OTP Verification Sessions
export const otpSessions = pgTable(
  "otp_sessions",
  {
    id: text("id").primaryKey(), // nanoid
    phoneNumber: text("phone_number").notNull(),
    otpCode: text("otp_code").notNull(), // hashed
    status: otpStatus("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(3).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    phoneIdx: index("idx_otp_phone").on(table.phoneNumber),
    statusIdx: index("idx_otp_status").on(table.status),
    expiresIdx: index("idx_otp_expires").on(table.expiresAt),
  }),
);

// Verification Sessions (main workflow tracking)
export const verificationSessions = pgTable(
  "verification_sessions",
  {
    id: text("id").primaryKey(), // nanoid
    sessionToken: text("session_token").notNull().unique(), // JWT or secure token

    // Identity (from OTP)
    phoneNumber: text("phone_number").notNull(),
    otpSessionId: text("otp_session_id")
      .notNull()
      .references(() => otpSessions.id),

    // NIN & Data Selection
    ninMasked: text("nin_masked"), // masked NIN for audit
    dataLayerSelected: dataLayer("data_layer_selected"),

    // Payment
    paymentReference: text("payment_reference"),
    paymentStatus: paymentStatus("payment_status").default("pending"),
    paymentAmount: integer("payment_amount"), // in kobo
    paymentProvider: text("payment_provider").default("paystack"),
    paymentCompletedAt: timestamp("payment_completed_at", {
      withTimezone: true,
    }),

    // NIMC API
    providerReference: text("provider_reference"),
    apiCallMadeAt: timestamp("api_call_made_at", { withTimezone: true }),
    apiResponseStatus: text("api_response_status"), // success, failed, not_found

    // Session Management
    status: sessionStatus("status").default("otp_pending").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Audit Trail
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tokenIdx: index("idx_session_token").on(table.sessionToken),
    phoneIdx: index("idx_session_phone").on(table.phoneNumber),
    statusIdx: index("idx_session_status").on(table.status),
    paymentIdx: index("idx_session_payment").on(table.paymentReference),
    createdIdx: index("idx_session_created").on(table.createdAt),
    expiresIdx: index("idx_session_expires").on(table.expiresAt),
  }),
);

// Verification Results (filtered data based on selected layer)
export const verificationResults = pgTable(
  "verification_results",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => verificationSessions.id, { onDelete: "cascade" }),

    // Demographic Data (always included if found)
    fullName: text("full_name"),
    dateOfBirth: text("date_of_birth"),
    phoneFromNimc: text("phone_from_nimc"),
    gender: text("gender"),

    // Biometric Data (only if biometric or full layer selected)
    photoUrl: text("photo_url"),
    signatureUrl: text("signature_url"),

    // Address Data (only if full layer selected)
    addressLine: text("address_line"),
    town: text("town"),
    lga: text("lga"),
    state: text("state"),

    // Raw API Response (for admin debugging)
    rawApiResponse: jsonb("raw_api_response"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("idx_results_session").on(table.sessionId),
  }),
);

// Admin Users (simplified - only for admin access)
export const adminUsers = pgTable(
  "admin_users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").default("admin").notNull(), // admin, super_admin
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    usernameIdx: index("idx_admin_username").on(table.username),
    roleIdx: index("idx_admin_role").on(table.role),
  }),
);

// Admin Audit Logs
export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: text("id").primaryKey(),
    adminId: text("admin_id")
      .notNull()
      .references(() => adminUsers.id),
    action: text("action").notNull(), // login, view_session, export_data, etc.
    resource: text("resource"), // session_id, phone_number, etc.
    details: text("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    adminIdx: index("idx_audit_admin").on(table.adminId),
    actionIdx: index("idx_audit_action").on(table.action),
    createdIdx: index("idx_audit_created").on(table.createdAt),
  }),
);

// System Configuration
export const systemConfig = pgTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
