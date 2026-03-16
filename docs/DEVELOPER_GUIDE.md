# VerifyNIN - Developer Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
5. [Authentication & Authorization](#authentication--authorization)
6. [Payment System](#payment-system)
7. [Admin System](#admin-system)
8. [Component Architecture](#component-architecture)
9. [External Services Setup](#external-services-setup)
10. [Testing & Debugging](#testing--debugging)
11. [Production Deployment](#production-deployment)
12. [Security Guidelines](#security-guidelines)
13. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Paystack account (for payments)
- YouVerify account (for NIN verification)

### Environment Setup

```bash
# Clone and install
git clone <repository>
cd verifynin
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Setup database
npm run db:push

# Create first super admin
npm run admin:create

# Start development
npm run dev
```

### Essential Environment Variables

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
AUTH_SECRET="your-secret-key-minimum-32-characters"
ENCRYPTION_KEY="your-base64-encoded-32-byte-encryption-key"
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."
YOUVERIFY_API_KEY="your-youverify-api-key"
YOUVERIFY_BASE_URL="https://api.youverify.co"
YOUVERIFY_TOKEN="your-live-api-token"
```

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: JWT sessions (httpOnly cookies)
- **Payments**: Paystack integration
- **NIN Verification**: YouVerify API v2
- **Styling**: Tailwind CSS + Framer Motion
- **UI**: shadcn/ui components

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   External APIs │
│                 │    │                 │    │                 │
│ • Next.js Pages │◄──►│ • API Routes    │◄──►│ • Paystack      │
│ • React Comps   │    │ • Middleware    │    │ • YouVerify     │
│ • Tailwind CSS  │    │ • Auth System   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │                 │
                       │ • User Data     │
                       │ • Transactions  │
                       │ • Audit Logs    │
                       └─────────────────┘
```

### User Roles & Permissions

- **User**: NIN verification, wallet management, transaction history
- **Admin**: User management, transaction monitoring, support tickets
- **Super Admin**: Full system access, admin management, system settings

## Database Schema

### Core Tables

#### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role admin_role DEFAULT 'user', -- 'user', 'admin', 'super_admin'
  is_suspended BOOLEAN DEFAULT false,
  suspended_at TIMESTAMP,
  suspended_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Wallets Table

```sql
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id),
  balance INTEGER DEFAULT 0, -- Amount in kobo (₦500 = 50000)
  currency TEXT DEFAULT 'NGN',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Wallet Transactions

```sql
CREATE TABLE wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type transaction_type, -- 'credit', 'debit', 'refund'
  status transaction_status, -- 'pending', 'completed', 'failed', 'refunded'
  amount INTEGER NOT NULL, -- Amount in kobo
  provider TEXT NOT NULL, -- 'paystack', 'youverify'
  reference TEXT, -- External reference (Paystack ref, etc.)
  description TEXT,
  nin_masked TEXT, -- For verification transactions
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### NIN Verifications

```sql
CREATE TABLE nin_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  nin_masked TEXT NOT NULL, -- Masked NIN (e.g., "123****4567")
  consent BOOLEAN DEFAULT false,
  status verification_status, -- 'pending', 'success', 'failed'
  purpose verification_purpose, -- 'banking', 'education_jamb', etc.
  full_name TEXT,
  date_of_birth TEXT,
  phone TEXT,
  provider_reference TEXT, -- YouVerify reference
  error_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Admin Tables

#### Support Tickets

```sql
CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  category ticket_category, -- 'payment_issue', 'verification_problem', etc.
  status ticket_status DEFAULT 'open', -- 'open', 'assigned', 'in_progress', 'resolved', 'closed'
  priority ticket_priority DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  payment_reference TEXT,
  verification_id TEXT REFERENCES nin_verifications(id),
  assigned_to TEXT REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

#### Audit Logs

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  event_type audit_event_type, -- 'user.login', 'payment.success', etc.
  user_id TEXT REFERENCES users(id),
  ip_address TEXT,
  user_agent TEXT,
  resource TEXT,
  action TEXT NOT NULL,
  status audit_status, -- 'success', 'failure', 'pending'
  metadata JSONB,
  error_message TEXT
);
```

### Key Relationships

- Users have one Wallet (1:1)
- Users have many Transactions (1:N)
- Users have many NIN Verifications (1:N)
- Users can create Support Tickets (1:N)
- Admins can be assigned to Tickets (1:N)
- All operations are logged in Audit Logs

### Database Migrations

```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# View database in GUI
npm run db:studio
```

## API Reference

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Account created successfully"
}
```

#### POST /api/auth/login

Authenticate user and create session.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

### NIN Verification

#### POST /api/nin/verify

Verify a National Identification Number.

**Request Body:**

```json
{
  "nin": "12345678901",
  "consent": true,
  "purpose": "education_jamb"
}
```

**Response (Success):**

```json
{
  "success": true,
  "verification": {
    "id": "ver_123",
    "status": "success",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "phone": "08012345678"
  },
  "receiptUrl": "/dashboard/receipts/ver_123"
}
```

**Response (Failure):**

```json
{
  "success": false,
  "error": "NIN not found in NIMC database",
  "refunded": true,
  "refundAmount": 50000
}
```

### Wallet Management

#### GET /api/wallet/balance

Get current wallet balance.

**Response:**

```json
{
  "balance": 150000,
  "currency": "NGN",
  "balanceFormatted": "₦1,500.00"
}
```

#### POST /api/wallet/check-pending-payments

Check and recover missed payments.

**Request Body:**

```json
{
  "reference": "paystack_ref_123"
}
```

### Payment Integration

#### POST /api/paystack/initialize

Initialize a Paystack payment.

**Request Body:**

```json
{
  "amount": 100000,
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "access_code_123",
    "reference": "paystack_ref_123"
  }
}
```

#### GET /api/paystack/verify/:reference

Verify a Paystack payment.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "success",
    "amount": 100000,
    "reference": "paystack_ref_123"
  }
}
```

### Admin Endpoints (Protected)

#### GET /api/admin/users

List and search users with pagination.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `search`: Search by email, name, or phone
- `status`: Filter by status (all, active, suspended)
- `sort`: Sort field (created_at, email, balance)
- `order`: Sort order (asc, desc)

**Response:**

```json
{
  "users": [
    {
      "id": "user_123",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "08012345678",
      "isSuspended": false,
      "balance": 150000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### GET /api/admin/users/:id

Get detailed user information.

**Response:**

```json
{
  "user": {
    "id": "user_123",
    "fullName": "John Doe",
    "email": "john@example.com",
    "balance": 150000,
    "isSuspended": false,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "transactions": [...],
  "verifications": [...],
  "stats": {
    "totalSpent": 500000,
    "successfulVerifications": 5,
    "accountAge": 30
  }
}
```

#### POST /api/admin/users/:id?action=suspend

Suspend a user account.

**Request Body:**

```json
{
  "reason": "Suspicious activity detected",
  "duration": 30
}
```

#### GET /api/admin/transactions

List transactions with advanced filtering.

**Query Parameters:**

- `status`: Filter by status (all, pending, completed, failed, refunded)
- `type`: Filter by type (all, credit, debit)
- `amountMin`, `amountMax`: Amount range filter
- `dateFrom`, `dateTo`: Date range filter
- `userId`: Filter by specific user

#### GET /api/admin/verifications

List NIN verifications with analytics.

**Query Parameters:**

- `status`: Filter by status (all, pending, success, failed)
- `purpose`: Filter by purpose (all, banking, education_jamb, etc.)
- `dateFrom`, `dateTo`: Date range filter

### Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error"
  }
}
```

**Common HTTP Status Codes:**

- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Authentication & Authorization

### Session Management

The system uses JWT tokens stored in httpOnly cookies for security.

#### Session Creation

```typescript
// lib/auth.ts
export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL, // 7 days
  });
}
```

#### Session Validation

```typescript
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const secret = getSecret();
    const { payload } = await jwtVerify<SessionPayload>(token, secret);
    return payload;
  } catch (error) {
    await clearSessionCookie();
    return null;
  }
}
```

### Middleware Protection

Routes are protected using Next.js middleware:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;

  // Require authentication for dashboard and admin routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.startsWith("/admin")
        ? "/adminlogin-cores"
        : "/login";
      return NextResponse.redirect(url);
    }

    const session = await verifySession(token);
    if (!session) {
      // Redirect to appropriate login page
    }

    // Admin route protection
    if (pathname.startsWith("/admin")) {
      if (session.role !== "admin" && session.role !== "super_admin") {
        return NextResponse.redirect("/dashboard");
      }
    }
  }
}
```

### Role-Based Access Control

#### User Roles

```typescript
type UserRole = "user" | "admin" | "super_admin";

interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}
```

#### Permission Checking

```typescript
// In API routes
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "admin" && session.role !== "super_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Continue with admin logic
}
```

### Rate Limiting

Admin endpoints have rate limiting (100 requests/minute):

```typescript
// In middleware.ts
function checkAdminRateLimit(userId: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  let entry = adminRateLimitStore.get(userId);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    adminRateLimitStore.set(userId, entry);
  }

  entry.count++;
  return {
    allowed: entry.count <= maxRequests,
    retryAfter:
      entry.count > maxRequests
        ? Math.ceil((entry.resetAt - now) / 1000)
        : undefined,
  };
}
```

### Security Best Practices

1. **Password Hashing**: Uses bcryptjs with salt rounds
2. **JWT Secrets**: Strong random secrets (minimum 32 characters)
3. **Cookie Security**: httpOnly, secure in production, SameSite protection
4. **Session Timeout**: 7-day expiration with automatic cleanup
5. **Rate Limiting**: Prevents brute force attacks
6. **Input Validation**: Zod schemas for all API inputs
7. **Audit Logging**: All sensitive operations logged

## Payment System

### Paystack Integration

The system uses Paystack for wallet funding with webhook verification.

#### Payment Flow

1. User initiates wallet funding
2. System calls Paystack Initialize API
3. User completes payment on Paystack
4. Paystack sends webhook notification
5. System verifies webhook signature
6. Wallet balance is updated

#### Payment Initialization

```typescript
// lib/paystack.ts
export async function initializePaystackPayment(
  email: string,
  amount: number, // Amount in kobo
  metadata?: Record<string, unknown>,
) {
  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        currency: "NGN",
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: "Service",
              variable_name: "service",
              value: "NIN Verification",
            },
          ],
        },
      }),
    },
  );

  return await response.json();
}
```

#### Webhook Verification

```typescript
export function verifyPaystackSignature(
  payload: string,
  signature: string | null,
): boolean {
  if (!signature) return false;

  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}
```

#### Payment Reconciliation

For failed webhook deliveries, users can manually recover payments:

```typescript
// API: /api/wallet/check-pending-payments
export async function POST(request: NextRequest) {
  const { reference } = await request.json();

  // Verify payment with Paystack
  const verification = await verifyPaystackPayment(reference);

  if (verification.data.status === "success") {
    // Credit user wallet
    await creditWallet(userId, verification.data.amount);

    // Log transaction
    await logPaymentEvent(
      "payment.success",
      userId,
      amount,
      reference,
      "success",
    );
  }
}
```

### YouVerify Integration

NIN verification is handled through YouVerify API v2.

#### Verification Process

```typescript
// lib/youverify.ts
export async function verifyNinWithYouVerify(nin: string) {
  const response = await fetch(`${baseUrl}/v2/api/identity/ng/nin`, {
    method: "POST",
    headers: {
      token: process.env.YOUVERIFY_TOKEN, // Not Bearer token
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: nin,
      isSubjectConsent: true,
    }),
  });

  if (response.status === 402) {
    throw new Error("YouVerify account has insufficient funds");
  }

  if (response.status === 403) {
    throw new Error("API key missing NIN permission");
  }

  return await response.json();
}
```

#### Error Handling & Retry Logic

```typescript
// Retry up to 3 times for 502/503 errors
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const response = await fetch(url, options);

    if (response.status === 502 || response.status === 503) {
      if (attempt < 3) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }

    return await response.json();
  } catch (error) {
    if (attempt === 3) throw error;
  }
}
```

### Transaction Management

#### Transaction States

- **Pending**: Transaction initiated but not completed
- **Completed**: Successfully processed
- **Failed**: Processing failed
- **Refunded**: Amount returned to user

#### Automatic Refunds

When NIN verification fails, the system automatically refunds the user:

```typescript
// In NIN verification API
if (verificationResult.success === false) {
  // Create refund transaction
  await db.insert(walletTransactions).values({
    id: nanoid(),
    userId,
    type: "refund",
    status: "completed",
    amount: NIN_VERIFICATION_COST_KOBO,
    provider: "system",
    description: "NIN verification failed - automatic refund",
  });

  // Update wallet balance
  await db
    .update(wallets)
    .set({ balance: sql`${wallets.balance} + ${NIN_VERIFICATION_COST_KOBO}` })
    .where(eq(wallets.userId, userId));
}
```

### Currency & Amounts

The system uses kobo (smallest NGN unit) for all internal calculations:

- ₦1 = 100 kobo
- ₦500 = 50,000 kobo
- Minimum funding: ₦50 (5,000 kobo)
- Maximum funding: ₦1,000,000 (100,000,000 kobo)
- NIN verification cost: ₦500 (50,000 kobo)

## Admin System

### Admin Dashboard Architecture

The admin system provides comprehensive management capabilities for users, transactions, verifications, and support.

#### Admin Routes Structure

```
/admin
├── /dashboard          # Overview & metrics
├── /users             # User management
├── /transactions      # Transaction monitoring
├── /verifications     # NIN verification analytics
├── /support           # Support ticket system
├── /analytics         # Advanced analytics
└── /system            # System health & settings
```

#### Admin Components Architecture

```
components/organisms/
├── admin-dashboard-client.tsx      # Main dashboard with charts
├── admin-dashboard-metrics.tsx     # Key metrics cards
├── user-management-client.tsx      # User listing & search
├── user-detail-modal.tsx          # Individual user details
├── transaction-management-client.tsx # Transaction monitoring
├── verification-management-client.tsx # Verification analytics
├── support-ticket-management-client.tsx # Support system
├── analytics-client.tsx           # Advanced analytics
└── system-management-client.tsx    # System health
```

### Key Admin Features

#### 1. Dashboard Metrics

Real-time business metrics with visual charts:

```typescript
interface DashboardMetrics {
  users: {
    total: number;
    active_30d: number;
    new_today: number;
    growth_rate: number;
  };
  transactions: {
    total_volume: number;
    success_rate: number;
    avg_amount: number;
  };
  verifications: {
    total: number;
    success_rate: number;
    daily_count: number;
  };
  revenue: {
    today: number;
    this_month: number;
    growth_rate: number;
  };
}
```

#### 2. User Management

Advanced user search and management:

```typescript
// Search & Filter Options
interface UserFilters {
  search: string;           // Email, name, phone
  status: 'active' | 'suspended' | 'all';
  dateFrom: string;         // Registration date range
  dateTo: string;
  balanceMin: number;       // Wallet balance range
  balanceMax: number;
}

// User Actions
- View detailed profile
- Suspend/activate account
- View transaction history
- View verification history
- Access support tickets
```

#### 3. Transaction Monitoring

Comprehensive transaction oversight:

```typescript
// Transaction Filters
interface TransactionFilters {
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'all';
  type: 'credit' | 'debit' | 'all';
  amountMin: number;
  amountMax: number;
  dateFrom: string;
  dateTo: string;
  userId: string;          // Filter by specific user
}

// Admin Actions
- Manual reconciliation
- Process refunds
- Export transaction data
- View payment details
```

#### 4. Support Ticket System

Full-featured support management:

```typescript
interface SupportTicket {
  id: string;
  userId: string;
  category: 'payment_issue' | 'verification_problem' | 'account_access' | 'technical_support' | 'general_inquiry';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  assignedTo?: string;     // Admin user ID
  createdAt: Date;
  resolvedAt?: Date;
}

// Ticket Workflow
Open → Assigned → In Progress → Resolved → Closed
```

### Admin API Endpoints

#### Dashboard Metrics

```typescript
GET /api/admin/dashboard/metrics
// Returns real-time business metrics

GET /api/admin/dashboard/charts?period=30d
// Returns chart data for specified period
```

#### User Management

```typescript
GET /api/admin/users?page=1&limit=50&search=john&status=active
// List users with pagination and filters

GET /api/admin/users/:id
// Get detailed user information

POST /api/admin/users/:id?action=suspend
// Suspend user account
{
  "reason": "Suspicious activity",
  "duration": 30
}

POST /api/admin/users/:id?action=activate
// Reactivate suspended account
```

#### Transaction Management

```typescript
GET /api/admin/transactions?status=pending&dateFrom=2024-01-01
// List transactions with filters

POST /api/admin/transactions/reconcile
// Manual payment reconciliation
{
  "reference": "paystack_ref_123",
  "userId": "user_123",
  "amount": 100000
}

POST /api/admin/transactions/:id/refund
// Process refund
{
  "reason": "Verification failed",
  "amount": 50000
}
```

### Admin Security & Audit

#### Audit Logging

All admin actions are automatically logged:

```typescript
// lib/audit-log.ts
export async function logAuditEvent(entry: AuditLogEntry) {
  await db.insert(auditLogs).values({
    id: nanoid(),
    timestamp: new Date(),
    eventType: entry.eventType,
    userId: entry.userId,
    ipAddress: entry.ipAddress,
    resource: entry.resource,
    action: entry.action,
    status: entry.status,
    metadata: entry.metadata,
  });
}

// Usage in admin endpoints
await logAuditEvent({
  eventType: "api.error",
  userId: session.userId,
  ipAddress: request.headers.get("x-forwarded-for"),
  resource: "user",
  action: "suspend",
  status: "success",
  metadata: { targetUserId, reason },
});
```

#### Admin Rate Limiting

Admin endpoints have enhanced rate limiting:

```typescript
// 100 requests per minute for admin users
const adminRateLimit = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

// Applied in middleware for /admin routes
if (pathname.startsWith("/admin")) {
  const rateLimit = checkAdminRateLimit(session.userId);
  if (!rateLimit.allowed) {
    return new NextResponse(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
    });
  }
}
```

### Admin UI Components

#### Metric Cards

```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;        // Percentage change
  icon?: React.ComponentType;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

<MetricCard
  title="Total Users"
  value={1234}
  trend={12.5}
  icon={Users}
  color="primary"
/>
```

#### Data Tables

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination: PaginationConfig;
  sorting: SortingConfig;
  filtering: FilteringConfig;
  selection?: SelectionConfig;
}

// Usage
<DataTable
  data={users}
  columns={userColumns}
  pagination={{ pageSize: 50 }}
  sorting={{ defaultSort: { field: 'created_at', order: 'desc' } }}
  filtering={{ searchable: true }}
/>
```

#### Status Badges

```typescript
<StatusBadge
  status="active"
  variant="solid"
  className="bg-emerald-100 text-emerald-800"
/>
```

## Component Architecture

### File Organization

The project follows atomic design principles with a clear component hierarchy:

```
components/
├── atoms/              # Basic UI elements
│   └── section-title.tsx
├── molecules/          # Composite components
│   ├── metric-card.tsx
│   └── stat-card.tsx
├── organisms/          # Complex features
│   ├── admin-dashboard-client.tsx
│   ├── user-management-client.tsx
│   ├── transaction-management-client.tsx
│   └── ...
├── sections/           # Page sections
│   ├── hero-section.tsx
│   ├── features-section.tsx
│   └── footer-section.tsx
└── ui/                 # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    └── ...
```

### Component Patterns

#### 1. Client Components with Server Data

Most admin components follow this pattern:

```typescript
// components/organisms/user-management-client.tsx
"use client";

export function UserManagementClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({});

  // Fetch data on mount and filter changes
  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    const response = await fetch(`/api/admin/users?${buildQueryString(filters)}`);
    const data = await response.json();
    setUsers(data.users);
  };

  return (
    <div className="space-y-6">
      <UserFilters filters={filters} onChange={setFilters} />
      <UserTable users={users} loading={loading} />
      <Pagination {...paginationProps} />
    </div>
  );
}
```

#### 2. Modal Components

Reusable modal pattern for detailed views:

```typescript
// components/organisms/user-detail-modal.tsx
interface UserDetailModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export function UserDetailModal({ userId, open, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);

  useEffect(() => {
    if (userId && open) {
      fetchUserDetail(userId);
    }
  }, [userId, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <UserOverview user={user} />
          </TabsContent>
          {/* Other tabs */}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

#### 3. Form Components

Consistent form handling with react-hook-form and Zod:

```typescript
// components/organisms/adminlogin-cores-form.tsx
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export function AdminLoginForm() {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        router.push("/admin");
      }
    } catch (error) {
      setError(getFriendlyErrorMessage(error));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Styling System

#### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdf4",
          500: "#22c55e",
          900: "#14532d",
        },
        // Admin-specific colors
        admin: {
          primary: "#1f2937",
          secondary: "#6b7280",
        },
      },
      borderRadius: {
        "3xl": "1.5rem",
      },
    },
  },
};
```

#### Component Styling Patterns

```typescript
// Consistent card styling
const cardClasses = "rounded-3xl border border-border/50 bg-card p-6";

// Status-based styling
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-800';
    case 'suspended': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Responsive grid patterns
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  {metrics.map(metric => (
    <MetricCard key={metric.id} {...metric} />
  ))}
</div>
```

### State Management

#### Local State with useState

For component-specific state:

```typescript
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

#### URL State for Filters

Persist filters in URL for better UX:

```typescript
const searchParams = useSearchParams();
const router = useRouter();

const updateFilters = (newFilters: UserFilters) => {
  const params = new URLSearchParams(searchParams);
  Object.entries(newFilters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
  });
  router.push(`?${params.toString()}`);
};
```

#### SWR for Data Fetching

For frequently updated data:

```typescript
import useSWR from "swr";

const {
  data: metrics,
  error,
  mutate,
} = useSWR(
  "/api/admin/dashboard/metrics",
  fetcher,
  { refreshInterval: 30000 }, // Refresh every 30 seconds
);
```

### Error Handling

#### Consistent Error Display

```typescript
// lib/utils.ts
export function getFriendlyErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

// Usage in components
const [error, setError] = useState<string | null>(null);

try {
  await apiCall();
} catch (err) {
  setError(getFriendlyErrorMessage(err, "Failed to load data"));
}

// Display
{error && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
    <p className="text-red-800">{error}</p>
  </div>
)}
```

#### Loading States

```typescript
// Skeleton loaders for better UX
function DashboardSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-3xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  );
}

// Usage
<Suspense fallback={<DashboardSkeleton />}>
  <AdminDashboardMetrics />
</Suspense>
```

## External Services Setup

### YouVerify API Setup

1. **Create Account**: Sign up at [YouVerify](https://youverify.co)
2. **Get API Key**: Navigate to API settings and generate your API key
3. **Configure Environment**:
   ```bash
   YOUVERIFY_API_KEY="your-api-key"
   YOUVERIFY_BASE_URL="https://api.youverify.co"
   ```
4. **Test Connection**:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://api.youverify.co/v2/api/identity/nin/12345678901
   ```

### Paystack Setup

1. **Create Account**: Sign up at [Paystack](https://paystack.com)
2. **Get API Keys**: Go to Settings > API Keys & Webhooks
3. **Configure Environment**:
   ```bash
   PAYSTACK_SECRET_KEY="sk_live_..." # Use sk_test_ for testing
   PAYSTACK_PUBLIC_KEY="pk_live_..." # Use pk_test_ for testing
   ```
4. **Setup Webhooks**: Add webhook URL: `https://yourdomain.com/api/paystack/webhook`

### Database Setup (Neon)

1. **Create Account**: Sign up at [Neon](https://neon.tech)
2. **Create Database**: Create a new PostgreSQL database
3. **Get Connection String**: Copy the connection string
4. **Configure Environment**:
   ```bash
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

## Production Deployment

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all production environment variables
3. **Build Settings**:
   ```bash
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```
4. **Domain Setup**: Configure custom domain if needed

### Environment Variables Checklist

- [ ] `DATABASE_URL` - Production database connection
- [ ] `AUTH_SECRET` - Secure random string (64+ characters)
- [ ] `ENCRYPTION_KEY` - Base64 encoded 32-byte key
- [ ] `PAYSTACK_SECRET_KEY` - Live Paystack secret key
- [ ] `PAYSTACK_PUBLIC_KEY` - Live Paystack public key
- [ ] `YOUVERIFY_API_KEY` - Production YouVerify API key
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` - Your production domain

### Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Configure security headers
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Configure monitoring and alerts
- [ ] Set up backup and recovery
- [ ] Implement proper error handling
- [ ] Secure API endpoints
- [ ] Validate all inputs
- [ ] Encrypt sensitive data

## Security Guidelines

### Data Protection

- All PII data is encrypted at rest using AES-256-GCM
- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens have short expiration times (15 minutes)
- Session management with automatic timeout
- Rate limiting on all API endpoints

### Input Validation

- All inputs are validated using Zod schemas
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization
- File upload restrictions and validation
- CSRF protection on all forms

### Authentication & Authorization

- Multi-factor authentication for admin accounts
- Role-based access control (RBAC)
- Account lockout after failed login attempts
- Device fingerprinting for suspicious activity detection
- Audit logging for all authentication events

### API Security

- All API routes use security middleware
- Request validation and sanitization
- Rate limiting per endpoint
- Bot detection and prevention
- Comprehensive error handling without data leakage

## Testing & Debugging

### Test Data

Use these test credentials for development:

**Admin User**:

- Email: `admin@verifynin.ng`
- Password: `YourSecurePassword123!`

**Test User**:

- Email: `test.user@example.com`
- Password: `TestPassword123!`

**Test NIN**: `12345678901` (for development only)

### Running Tests

```bash
# Run all tests
npm test

# Run security tests
npm run test:security

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- user.test.ts
```

### Debugging

```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Database debugging
npm run db:studio

# Check database health
npm run db:health
```

### Getting Started

#### 1. Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd jamb-verify

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# Required: DATABASE_URL, AUTH_SECRET, PAYSTACK keys, YOUVERIFY_TOKEN
```

#### 2. Database Setup

```bash
# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# Create first super admin
npm run admin:create

# Open database GUI (optional)
npm run db:studio
```

#### 3. Development Server

```bash
# Start development server
npm run dev

# Server runs on http://localhost:3000
# Admin panel: http://localhost:3000/adminlogin-cores
```

### Code Organization

#### Adding New Features

1. **Database Changes**

```bash
# Modify db/schema.ts
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate
```

2. **API Endpoints**

```typescript
// app/api/new-feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db/client";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Your logic here
  return NextResponse.json({ data: "success" });
}
```

3. **Components**

```typescript
// components/organisms/new-feature-client.tsx
"use client";

export function NewFeatureClient() {
  // Component logic
  return <div>New Feature</div>;
}
```

4. **Pages**

```typescript
// app/admin/new-feature/page.tsx
import { NewFeatureClient } from "@/components/organisms/new-feature-client";

export default function NewFeaturePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Feature</h1>
      <NewFeatureClient />
    </div>
  );
}
```

### Common Development Tasks

#### Adding New Admin Endpoint

```typescript
// 1. Create API route
// app/api/admin/new-endpoint/route.ts
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "admin" && session.role !== "super_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Log admin action
  await logAuditEvent({
    timestamp: new Date().toISOString(),
    eventType: "api.error",
    userId: session.userId,
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    resource: "new-resource",
    action: "view",
    status: "success",
  });

  // Your logic
}

// 2. Add to admin navigation
// Update admin layout or navigation component
```

#### Adding New Database Table

```typescript
// 1. Add to db/schema.ts
export const newTable = pgTable("new_table", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  data: text("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 2. Generate migration
// npm run db:generate

// 3. Apply migration
// npm run db:migrate
```

#### Adding New User Role

```typescript
// 1. Update schema
export const adminRole = pgEnum("admin_role", [
  "user",
  "admin",
  "super_admin",
  "new_role", // Add new role
]);

// 2. Update types
type UserRole = "user" | "admin" | "super_admin" | "new_role";

// 3. Update middleware
if (pathname.startsWith("/new-role-routes")) {
  if (session.role !== "new_role") {
    return NextResponse.redirect("/dashboard");
  }
}
```

### Testing

#### Manual Testing

```bash
# Test with sandbox credentials
# Use test NINs: 11111111111 (valid), 00000000000 (invalid)
# Use Paystack test cards: 4084084084084081 (success)
```

#### API Testing

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Test admin endpoints
curl -X GET http://localhost:3000/api/admin/users \
  -H "Cookie: verifynin_session=<session-token>"
```

### Debugging

#### Common Issues

1. **Database Connection**

```bash
# Check DATABASE_URL format
DATABASE_URL="postgresql://user:password@host:5432/database"

# Test connection
npm run db:studio
```

2. **Authentication Issues**

```bash
# Check AUTH_SECRET is set (minimum 32 characters)
AUTH_SECRET="your-secret-key-minimum-32-characters"

# Clear browser cookies if session issues persist
```

3. **Payment Issues**

```bash
# Check Paystack keys
PAYSTACK_SECRET_KEY="sk_live_..." # or sk_test_...
PAYSTACK_PUBLIC_KEY="pk_live_..." # or pk_test_...

# Verify webhook signature in logs
```

4. **YouVerify Issues**

```bash
# Check token and permissions
YOUVERIFY_TOKEN="your-live-api-token"

# Common errors:
# 402: Insufficient funds - top up wallet
# 403: Missing NIN permission - regenerate key
```

#### Logging

```typescript
// Enable debug logging
LOG_LEVEL="debug"

// Check logs in console
console.log("[DEBUG]", data);

// Audit logs in database
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

### Performance Optimization

#### Database Queries

```typescript
// Use indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_date ON wallet_transactions(user_id, created_at);

// Limit query results
const users = await db.select()
  .from(users)
  .limit(50)
  .offset(page * 50);
```

#### Component Optimization

```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Debounce search inputs
const debouncedSearch = useMemo(
  () => debounce((value: string) => setSearch(value), 300),
  [],
);
```

#### API Optimization

```typescript
// Use pagination for large datasets
const { searchParams } = new URL(request.url);
const page = parseInt(searchParams.get("page") || "1");
const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

// Cache frequently accessed data
const metrics = await redis.get("dashboard:metrics");
if (!metrics) {
  const freshMetrics = await calculateMetrics();
  await redis.setex("dashboard:metrics", 300, JSON.stringify(freshMetrics));
}
```

## Testing & Debugging

### Test Data

#### Test NINs (Sandbox)

```bash
# Valid NIN (returns success)
11111111111

# Invalid NIN (returns not found)
00000000000

# Use these for testing verification flow
```

#### Paystack Test Cards

```bash
# Successful payment
4084084084084081

# Declined payment
4084084084084081 (with CVV 408)

# Insufficient funds
4084084084084081 (with CVV 001)
```

### Debugging Tools

#### Database Inspection

```bash
# Open Drizzle Studio
npm run db:studio

# Direct SQL queries
psql $DATABASE_URL
SELECT * FROM users WHERE email = 'test@example.com';
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

#### API Testing

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt

# Test admin endpoints with session
curl -X GET http://localhost:3000/api/admin/users \
  -b cookies.txt

# Test NIN verification
curl -X POST http://localhost:3000/api/nin/verify \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"nin":"11111111111","consent":true,"purpose":"education_jamb"}'
```

#### Log Analysis

```bash
# Check application logs
tail -f logs/app.log

# Filter specific events
grep "PAYSTACK" logs/app.log
grep "YOUVERIFY" logs/app.log
grep "AUDIT" logs/app.log
```

### Common Issues & Solutions

#### 1. Authentication Problems

```bash
# Symptom: "Unauthorized" errors
# Check: Session cookie exists and is valid
# Solution: Clear cookies, re-login

# Symptom: Admin routes redirect to login
# Check: User has admin/super_admin role
# Solution: Update user role in database
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

#### 2. Payment Issues

```bash
# Symptom: Payment deducted but not reflected in wallet
# Check: Webhook delivery logs
# Solution: Use payment reconciliation feature

# Symptom: Webhook signature verification fails
# Check: PAYSTACK_SECRET_KEY is correct
# Solution: Verify key in Paystack dashboard
```

#### 3. NIN Verification Failures

```bash
# Symptom: 402 Insufficient Funds
# Check: YouVerify wallet balance
# Solution: Top up wallet at os.youverify.co

# Symptom: 403 Permission Denied
# Check: API key has NIN permission
# Solution: Regenerate key with NIN permission enabled

# Symptom: Network timeouts
# Check: API endpoint and token
# Solution: Verify YOUVERIFY_BASE_URL and token
```

#### 4. Database Issues

```bash
# Symptom: Migration errors
# Check: Database connection and permissions
# Solution: Verify DATABASE_URL and run migrations manually

# Symptom: Foreign key constraint errors
# Check: Referenced records exist
# Solution: Ensure proper data relationships
```

### Performance Monitoring

#### Key Metrics to Monitor

```typescript
// API Response Times
console.time("api-call");
// ... API logic
console.timeEnd("api-call");

// Database Query Performance
console.time("db-query");
const users = await db.select().from(users);
console.timeEnd("db-query");

// Memory Usage
console.log("Memory usage:", process.memoryUsage());
```

#### Database Performance

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Deployment

### Production Checklist

#### Environment Variables

```bash
# Required for production
DATABASE_URL="postgresql://..."
AUTH_SECRET="strong-random-secret-32-chars-minimum"
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."
YOUVERIFY_TOKEN="live-api-token"

# Optional but recommended
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
ENABLE_RATE_LIMITING="true"
ENABLE_AUDIT_LOGGING="true"
```

#### Database Setup

```bash
# Run migrations
npm run db:migrate

# Create super admin
npm run admin:create

# Verify database indexes
# Check that all foreign keys and indexes are created
```

#### Security Configuration

```bash
# Strong AUTH_SECRET (generate with)
openssl rand -base64 32

# Enable security headers in next.config.js
# Configure CSP, HSTS, etc.

# Set up rate limiting with Redis (recommended for production)
# Update middleware to use Redis instead of in-memory store
```

### Deployment Platforms

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Configure database connection
# Set up domain and SSL
```

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t jamb-verify .
docker run -p 3000:3000 --env-file .env jamb-verify
```

#### Manual Server Deployment

```bash
# On server
git clone <repository>
cd jamb-verify
npm ci
npm run build

# Set up process manager (PM2)
npm install -g pm2
pm2 start npm --name "jamb-verify" -- start
pm2 startup
pm2 save

# Set up reverse proxy (Nginx)
# Configure SSL with Let's Encrypt
```

### Post-Deployment

#### Health Checks

```bash
# Test main endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/adminlogin-cores

# Check database connectivity
# Verify external API connections (Paystack, YouVerify)
```

#### Monitoring Setup

```bash
# Set up error tracking (Sentry)
# Configure log aggregation
# Set up uptime monitoring
# Configure alerts for critical errors
```

#### Backup Strategy

```bash
# Database backups
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Automated backups (cron job)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

## Troubleshooting

### Common Production Issues

#### 1. High Memory Usage

```bash
# Check Node.js memory usage
node --max-old-space-size=2048 server.js

# Monitor with PM2
pm2 monit

# Optimize database queries
# Add pagination to large datasets
# Implement caching for frequently accessed data
```

#### 2. Database Connection Issues

```bash
# Check connection pool settings
# Increase connection limits if needed
# Monitor active connections

SELECT count(*) FROM pg_stat_activity;
```

#### 3. API Rate Limiting

```bash
# Monitor rate limit hits
# Adjust limits based on usage patterns
# Implement Redis for distributed rate limiting
```

#### 4. External API Failures

```bash
# Implement circuit breakers
# Add retry logic with exponential backoff
# Set up fallback mechanisms
# Monitor API status pages
```

### Emergency Procedures

#### System Maintenance

```bash
# Enable maintenance mode
# Update environment variable or feature flag
MAINTENANCE_MODE="true"

# Graceful shutdown
pm2 stop jamb-verify

# Database maintenance
# Run during low-traffic periods
# Notify users in advance
```

#### Data Recovery

```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup-20240101.sql

# Verify data integrity
# Check critical tables and relationships
# Test core functionality
```

#### Security Incident Response

```bash
# Immediate actions:
# 1. Identify and contain the issue
# 2. Revoke compromised credentials
# 3. Check audit logs for unauthorized access
# 4. Notify affected users if necessary
# 5. Document incident and lessons learned
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Paystack API Documentation](https://paystack.com/docs/api/)
- [YouVerify API Documentation](https://docs.youverify.co/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Support

For technical issues or questions:

1. Check this documentation first
2. Review error logs and audit trails
3. Test with sandbox/development environment
4. Contact external service providers (Paystack, YouVerify) for API issues
5. Document any new issues and solutions for future reference
