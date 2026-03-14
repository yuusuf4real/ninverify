# Database Guide

## Overview

The JAMB Verification System uses PostgreSQL with Drizzle ORM for type-safe database operations. This guide covers the database schema, relationships, migrations, and best practices.

## Database Schema

### Core Tables

#### Users Table
The central table for all user accounts (regular users and admins).

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role admin_role DEFAULT 'user' NOT NULL, -- 'user', 'admin', 'super_admin'
  is_suspended BOOLEAN DEFAULT false NOT NULL,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_suspended ON users(is_suspended);
```

**Key Points:**
- `id`: Generated using nanoid() for URL-safe IDs
- `password_hash`: Hashed using bcryptjs with salt
- `role`: Enum type for role-based access control
- `email`: Unique constraint for authentication
- Suspension fields for admin user management

#### Wallets Table
One-to-one relationship with users for wallet functionality.

```sql
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 NOT NULL, -- Amount in kobo
  currency TEXT DEFAULT 'NGN' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**Key Points:**
- `balance`: Stored in kobo (smallest NGN unit) for precision
- `user_id`: Unique constraint ensures one wallet per user
- Cascade delete when user is deleted

#### Wallet Transactions
Records all financial transactions.

```sql
CREATE TABLE wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL, -- 'credit', 'debit', 'refund'
  status transaction_status NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  amount INTEGER NOT NULL, -- Amount in kobo
  provider TEXT NOT NULL, -- 'paystack', 'youverify', 'system'
  reference TEXT, -- External reference (Paystack ref, etc.)
  description TEXT,
  nin_masked TEXT, -- For verification transactions
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**Key Points:**
- `type`: Credit (wallet funding), Debit (verification cost), Refund
- `status`: Transaction lifecycle tracking
- `provider`: Source of the transaction
- `metadata`: Flexible JSON storage for additional data
- `nin_masked`: Privacy-compliant NIN storage (e.g., "123****4567")
#### NIN Verifications
Records all NIN verification attempts and results.

```sql
CREATE TABLE nin_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  nin_masked TEXT NOT NULL, -- Masked NIN for privacy
  consent BOOLEAN DEFAULT false NOT NULL,
  status verification_status NOT NULL, -- 'pending', 'success', 'failed'
  purpose verification_purpose, -- 'banking', 'education_jamb', etc.
  full_name TEXT,
  date_of_birth TEXT,
  phone TEXT,
  provider_reference TEXT, -- YouVerify reference
  error_message TEXT,
  raw_response JSONB, -- Full API response for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for purpose filtering
CREATE INDEX idx_verifications_purpose ON nin_verifications(purpose);
```

**Key Points:**
- `nin_masked`: Never store full NIN for privacy compliance
- `purpose`: Categorizes verification use case
- `raw_response`: Stores full API response for debugging
- `provider_reference`: Links to external service transaction

### Admin Tables

#### Support Tickets
Customer support ticket management.

```sql
CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  category ticket_category NOT NULL, -- 'payment_issue', 'verification_problem', etc.
  status ticket_status DEFAULT 'open' NOT NULL, -- 'open', 'assigned', 'in_progress', 'resolved', 'closed'
  priority ticket_priority DEFAULT 'medium' NOT NULL, -- 'low', 'medium', 'high', 'urgent'
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  payment_reference TEXT, -- Link to specific payment
  verification_id TEXT REFERENCES nin_verifications(id),
  assigned_to TEXT REFERENCES users(id), -- Admin user
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for efficient querying
CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX idx_tickets_created ON support_tickets(created_at);
```

#### Ticket Messages
Conversation thread for support tickets.

```sql
CREATE TABLE ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  is_internal BOOLEAN DEFAULT false NOT NULL, -- Admin-only notes
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for conversation ordering
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at);
CREATE INDEX idx_ticket_messages_user ON ticket_messages(user_id);
```

#### Audit Logs
Compliance and security logging.

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  event_type audit_event_type NOT NULL, -- 'user.login', 'payment.success', etc.
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  resource TEXT,
  action TEXT NOT NULL,
  status audit_status NOT NULL, -- 'success', 'failure', 'pending'
  metadata JSONB,
  error_message TEXT
);
```

**Key Points:**
- Immutable log entries for compliance
- `event_type`: Categorized audit events
- `metadata`: Flexible storage for context
- `user_id`: SET NULL on user deletion to preserve logs

#### Admin Actions
Tracks all administrative actions.

```sql
CREATE TABLE admin_actions (
  id TEXT PRIMARY KEY,
  admin_id TEXT REFERENCES users(id) NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id TEXT REFERENCES users(id),
  target_resource TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for admin activity tracking
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id, created_at);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at);
```

## Enum Types

### User Roles
```sql
CREATE TYPE admin_role AS ENUM ('user', 'admin', 'super_admin');
```

### Transaction Types
```sql
CREATE TYPE transaction_type AS ENUM ('credit', 'debit', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
```

### Verification Types
```sql
CREATE TYPE verification_status AS ENUM ('pending', 'success', 'failed');
CREATE TYPE verification_purpose AS ENUM (
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
```

### Support System Types
```sql
CREATE TYPE ticket_status AS ENUM ('open', 'assigned', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_category AS ENUM (
  'payment_issue',
  'verification_problem',
  'account_access',
  'technical_support',
  'general_inquiry'
);
```

### Audit Types
```sql
CREATE TYPE audit_event_type AS ENUM (
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

CREATE TYPE audit_status AS ENUM ('success', 'failure', 'pending');
```
## Drizzle ORM Usage

### Schema Definition
```typescript
// db/schema.ts
import { pgTable, text, integer, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";

// Define enums
export const adminRole = pgEnum("admin_role", ["user", "admin", "super_admin"]);
export const transactionType = pgEnum("transaction_type", ["credit", "debit", "refund"]);

// Define tables
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: adminRole("role").default("user").notNull(),
  isSuspended: boolean("is_suspended").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

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
```

### Common Queries

#### User Management
```typescript
import { db } from "@/db/client";
import { users, wallets } from "@/db/schema";
import { eq, ilike, and, desc } from "drizzle-orm";

// Get user with wallet
const getUserWithWallet = async (userId: string) => {
  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      balance: wallets.balance,
      isSuspended: users.isSuspended
    })
    .from(users)
    .leftJoin(wallets, eq(users.id, wallets.userId))
    .where(eq(users.id, userId));
  
  return user;
};

// Search users with pagination
const searchUsers = async (search: string, page: number, limit: number) => {
  const offset = (page - 1) * limit;
  
  return await db
    .select()
    .from(users)
    .where(
      and(
        ilike(users.email, `%${search}%`),
        eq(users.isSuspended, false)
      )
    )
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
};
```

#### Transaction Operations
```typescript
import { walletTransactions } from "@/db/schema";
import { sql } from "drizzle-orm";

// Create transaction and update wallet balance
const processWalletTransaction = async (
  userId: string,
  type: 'credit' | 'debit',
  amount: number,
  description: string
) => {
  return await db.transaction(async (tx) => {
    // Insert transaction record
    const [transaction] = await tx
      .insert(walletTransactions)
      .values({
        id: nanoid(),
        userId,
        type,
        status: 'completed',
        amount,
        provider: 'system',
        description
      })
      .returning();

    // Update wallet balance
    const balanceChange = type === 'credit' ? amount : -amount;
    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${balanceChange}`,
        updatedAt: new Date()
      })
      .where(eq(wallets.userId, userId));

    return transaction;
  });
};
```

#### Analytics Queries
```typescript
import { count, sum, avg } from "drizzle-orm";

// Dashboard metrics
const getDashboardMetrics = async () => {
  // User metrics
  const [userMetrics] = await db
    .select({
      totalUsers: count(),
      activeUsers: sql<number>`COUNT(CASE WHEN ${users.isSuspended} = false THEN 1 END)`,
      newToday: sql<number>`COUNT(CASE WHEN DATE(${users.createdAt}) = CURRENT_DATE THEN 1 END)`
    })
    .from(users);

  // Transaction metrics
  const [transactionMetrics] = await db
    .select({
      totalVolume: sum(walletTransactions.amount),
      avgAmount: avg(walletTransactions.amount),
      successRate: sql<number>`
        (COUNT(CASE WHEN ${walletTransactions.status} = 'completed' THEN 1 END) * 100.0) / COUNT(*)
      `
    })
    .from(walletTransactions);

  return { userMetrics, transactionMetrics };
};
```

## Migration Management

### Creating Migrations
```bash
# Generate migration from schema changes
npm run db:generate

# This creates a new migration file in db/migrations/
# Example: 0004_new_feature.sql
```

### Migration Files
```sql
-- db/migrations/0004_add_support_system.sql
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed');

CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "status" "ticket_status" DEFAULT 'open' NOT NULL,
  "subject" text NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" 
 FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_tickets_status" ON "support_tickets" USING btree ("status");
```

### Applying Migrations
```bash
# Apply all pending migrations
npm run db:migrate

# Or use Drizzle Kit directly
npx drizzle-kit migrate
```

### Migration Best Practices
1. **Always backup before migrations** in production
2. **Test migrations** on a copy of production data
3. **Use transactions** for complex migrations
4. **Add indexes** for new query patterns
5. **Consider downtime** for large table changes

## Database Operations

### Connection Management
```typescript
// db/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// Create connection
const client = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(client);
```

### Transaction Handling
```typescript
// Use database transactions for related operations
const createUserWithWallet = async (userData: UserData) => {
  return await db.transaction(async (tx) => {
    // Create user
    const [user] = await tx
      .insert(users)
      .values({
        id: nanoid(),
        ...userData,
        passwordHash: await bcrypt.hash(userData.password, 10)
      })
      .returning();

    // Create wallet
    await tx
      .insert(wallets)
      .values({
        id: nanoid(),
        userId: user.id,
        balance: 0
      });

    return user;
  });
};
```

### Error Handling
```typescript
try {
  const result = await db.select().from(users);
  return result;
} catch (error) {
  if (error.code === '23505') { // Unique constraint violation
    throw new Error('Email already exists');
  }
  if (error.code === '23503') { // Foreign key violation
    throw new Error('Referenced record not found');
  }
  throw error;
}
```

## Performance Optimization

### Indexing Strategy
```sql
-- Primary indexes (automatically created)
-- users(id), wallets(id), etc.

-- Unique indexes
-- users(email), wallets(user_id)

-- Query optimization indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_transactions_user_date ON wallet_transactions(user_id, created_at);
CREATE INDEX idx_verifications_status ON nin_verifications(status);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type, timestamp);

-- Composite indexes for common filter combinations
CREATE INDEX idx_users_role_suspended ON users(role, is_suspended);
CREATE INDEX idx_transactions_status_type ON wallet_transactions(status, type);
```

### Query Optimization
```typescript
// Use select() to limit returned columns
const users = await db
  .select({
    id: users.id,
    email: users.email,
    fullName: users.fullName
  })
  .from(users)
  .limit(50);

// Use joins instead of separate queries
const usersWithWallets = await db
  .select({
    userId: users.id,
    email: users.email,
    balance: wallets.balance
  })
  .from(users)
  .leftJoin(wallets, eq(users.id, wallets.userId));

// Use aggregations efficiently
const stats = await db
  .select({
    totalUsers: count(),
    totalBalance: sum(wallets.balance)
  })
  .from(users)
  .leftJoin(wallets, eq(users.id, wallets.userId));
```

### Pagination Best Practices
```typescript
// Offset-based pagination (current implementation)
const getUsers = async (page: number, limit: number) => {
  const offset = (page - 1) * limit;
  
  const users = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
    
  const [{ count: total }] = await db
    .select({ count: count() })
    .from(users);
    
  return { users, total, totalPages: Math.ceil(total / limit) };
};

// Cursor-based pagination (for better performance on large datasets)
const getUsersCursor = async (cursor?: string, limit: number = 50) => {
  const query = db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit + 1); // Get one extra to check if there's a next page
    
  if (cursor) {
    query.where(lt(users.createdAt, new Date(cursor)));
  }
  
  const results = await query;
  const hasNextPage = results.length > limit;
  const users = hasNextPage ? results.slice(0, -1) : results;
  
  return {
    users,
    hasNextPage,
    nextCursor: hasNextPage ? users[users.length - 1].createdAt.toISOString() : null
  };
};
```

## Data Integrity

### Foreign Key Constraints
```sql
-- Cascade deletes for dependent data
ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_fk 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Set null for audit trail preservation
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fk 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Restrict deletes for critical references
ALTER TABLE support_tickets ADD CONSTRAINT tickets_assigned_to_fk 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT;
```

### Data Validation
```typescript
// Use Zod schemas for validation before database operations
const userSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/),
  password: z.string().min(8)
});

const createUser = async (data: unknown) => {
  const validatedData = userSchema.parse(data);
  
  return await db.insert(users).values({
    id: nanoid(),
    ...validatedData,
    passwordHash: await bcrypt.hash(validatedData.password, 10)
  });
};
```

### Backup and Recovery
```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240101.sql

# Automated daily backups (cron job)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

## Monitoring and Maintenance

### Database Health Checks
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Maintenance Tasks
```sql
-- Update table statistics
ANALYZE;

-- Rebuild indexes (if needed)
REINDEX INDEX idx_users_email;

-- Clean up old audit logs (example: keep 1 year)
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '1 year';

-- Vacuum tables to reclaim space
VACUUM ANALYZE users;
VACUUM ANALYZE wallet_transactions;
```

This database guide provides comprehensive coverage of the schema, operations, and best practices for maintaining the JAMB Verification System database.