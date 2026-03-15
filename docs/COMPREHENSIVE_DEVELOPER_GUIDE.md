# VerifyNIN - Comprehensive Developer Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start Guide](#quick-start-guide)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [Project Structure](#project-structure)
5. [Development Environment Setup](#development-environment-setup)
6. [Database Schema & Management](#database-schema--management)
7. [Authentication & Authorization](#authentication--authorization)
8. [API Architecture](#api-architecture)
9. [Frontend Architecture](#frontend-architecture)
10. [External Services Integration](#external-services-integration)
11. [Security Implementation](#security-implementation)
12. [Testing Strategy](#testing-strategy)
13. [Deployment Guide](#deployment-guide)
14. [Development Workflows](#development-workflows)
15. [Performance Optimization](#performance-optimization)
16. [Troubleshooting Guide](#troubleshooting-guide)
17. [Contributing Guidelines](#contributing-guidelines)

---

## Project Overview

VerifyNIN is a comprehensive National Identification Number (NIN) verification platform built for Nigerian businesses and institutions. The system provides secure, fast, and reliable NIN verification services with integrated payment processing and comprehensive admin management.

### Key Features

- **Secure NIN Verification**: Integration with YouVerify API for official NIN validation
- **Wallet-Based Payment System**: Paystack integration with automatic refunds
- **Multi-Role Admin System**: Comprehensive user and transaction management
- **Support Ticket System**: Full-featured customer support with SLA tracking
- **Audit & Compliance**: Complete audit logging and NDPR compliance
- **Real-time Analytics**: Business metrics and performance monitoring
- **Mobile-First Design**: Responsive UI with progressive enhancement

### Business Model

- Users fund their wallets via Paystack
- NIN verification costs ₦500 per request
- Automatic refunds for failed verifications
- Admin oversight and manual reconciliation capabilities

---

## Quick Start Guide

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **PostgreSQL 14+** (Neon.tech recommended for cloud)
- **Paystack Account** (for payment processing)
- **YouVerify Account** (for NIN verification)
- **Git** for version control

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd verifynin

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your credentials:

```bash
# Database (Required)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication (Required)
AUTH_SECRET="your-strong-secret-minimum-32-characters"
ENCRYPTION_KEY="base64-encoded-32-byte-key"

# Paystack (Required)
PAYSTACK_PUBLIC_KEY="pk_live_..." # or pk_test_ for development
PAYSTACK_SECRET_KEY="sk_live_..." # or sk_test_ for development

# YouVerify (Required)
YOUVERIFY_TOKEN="your-live-api-token"
YOUVERIFY_BASE_URL="https://api.youverify.co"
```

### 3. Database Setup

```bash
# Push schema to database
npm run db:push

# Create first super admin
npm run admin:create

# (Optional) Open database GUI
npm run db:studio
```

### 4. Start Development

```bash
# Start development server
npm run dev

# Application runs on http://localhost:3000
# Admin panel: http://localhost:3000/adminlogin-cores
```

### 5. Verify Setup

- Visit `http://localhost:3000` - Should show landing page
- Visit `http://localhost:3000/adminlogin-cores` - Should show admin login
- Check database connection in Drizzle Studio
- Test API endpoints with provided credentials

---

## Architecture & Tech Stack

### Technology Stack

#### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.6+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **State Management**: Zustand + React Hook Form
- **Data Fetching**: SWR + Native Fetch API

#### Backend

- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with httpOnly cookies
- **Validation**: Zod schemas
- **Security**: bcryptjs, rate limiting, audit logging

#### External Services

- **Payment Processing**: Paystack API
- **NIN Verification**: YouVerify API v2
- **Database Hosting**: Neon.tech (recommended)
- **Deployment**: Vercel (recommended)

#### Development Tools

- **Package Manager**: npm
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + Playwright
- **Security**: ESLint Security + Secretlint
- **Git Hooks**: Husky + lint-staged
- **Performance**: Lighthouse + Bundle Analyzer

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Next.js Frontend (React + TypeScript)                     │
│  • User Dashboard    • Admin Panel    • Public Pages       │
│  • Authentication    • Forms          • Navigation         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Application Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes + Middleware                           │
│  • Authentication    • Rate Limiting   • Input Validation  │
│  • Business Logic    • Error Handling  • Audit Logging    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  External API Integration                                   │
│  • Paystack API     • YouVerify API   • Email Service      │
│  • Webhook Handlers • Payment Processing • NIN Verification│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database (Drizzle ORM)                         │
│  • User Management  • Transaction Records • Audit Logs     │
│  • Support Tickets  • Admin Actions    • System Metrics    │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

#### 1. Repository Pattern

- Database operations abstracted through Drizzle ORM
- Consistent query patterns across the application
- Type-safe database interactions

#### 2. Service Layer Pattern

- Business logic separated from API routes
- Reusable service functions for common operations
- Clear separation of concerns

#### 3. Middleware Pattern

- Authentication, rate limiting, and security checks
- Request/response transformation
- Error handling and logging

#### 4. Component Composition

- Atomic design principles (atoms, molecules, organisms)
- Reusable UI components with consistent APIs
- Props-based customization and theming

---

## Project Structure

```
verifynin/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 (auth)/                   # Authentication routes
│   │   ├── 📁 login/                # User login page
│   │   ├── 📁 register/             # User registration page
│   │   └── layout.tsx               # Auth layout wrapper
│   ├── 📁 admin/                    # Admin panel routes
│   │   ├── 📁 analytics/            # Business analytics
│   │   ├── 📁 support/              # Support ticket management
│   │   ├── 📁 system/               # System administration
│   │   ├── 📁 transactions/         # Transaction monitoring
│   │   ├── 📁 users/                # User management
│   │   ├── 📁 verifications/        # Verification analytics
│   │   ├── layout.tsx               # Admin layout with sidebar
│   │   └── page.tsx                 # Admin dashboard
│   ├── 📁 admin-login/              # Separate admin login
│   ├── 📁 api/                      # API routes
│   │   ├── 📁 admin/                # Admin-only endpoints
│   │   ├── 📁 auth/                 # Authentication endpoints
│   │   ├── 📁 nin/                  # NIN verification
│   │   ├── 📁 paystack/             # Payment processing
│   │   ├── 📁 support/              # Support system
│   │   └── 📁 wallet/               # Wallet management
│   ├── 📁 dashboard/                # User dashboard
│   │   ├── 📁 receipts/             # Verification receipts
│   │   ├── 📁 recovery/             # Account recovery
│   │   ├── 📁 support/              # User support
│   │   ├── 📁 transactions/         # Transaction history
│   │   ├── layout.tsx               # Dashboard layout
│   │   └── page.tsx                 # Dashboard home
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Landing page
├── 📁 components/                   # React components
│   ├── 📁 animations/               # Animation components
│   ├── 📁 atoms/                    # Basic UI elements
│   ├── 📁 molecules/                # Composite components
│   ├── 📁 navigation/               # Navigation components
│   ├── 📁 organisms/                # Complex feature components
│   ├── 📁 sections/                 # Page sections
│   └── 📁 ui/                       # shadcn/ui components
├── 📁 db/                           # Database configuration
│   ├── 📁 migrations/               # Database migrations
│   ├── client.ts                    # Database client setup
│   └── schema.ts                    # Database schema definition
├── 📁 docs/                         # Documentation
├── 📁 lib/                          # Utility libraries
│   ├── 📁 hooks/                    # Custom React hooks
│   ├── 📁 performance/              # Performance monitoring
│   ├── 📁 security/                 # Security utilities
│   ├── 📁 stores/                   # State management
│   ├── auth.ts                      # Authentication utilities
│   ├── constants.ts                 # Application constants
│   ├── paystack.ts                  # Paystack integration
│   ├── utils.ts                     # General utilities
│   └── youverify.ts                 # YouVerify integration
├── 📁 public/                       # Static assets
│   └── 📁 images/                   # Image assets
├── 📁 scripts/                      # Utility scripts
├── 📁 security/                     # Security configuration
├── 📁 tests/                        # Test files
│   ├── 📁 e2e/                      # End-to-end tests
│   └── 📁 security/                 # Security tests
├── 📁 types/                        # TypeScript type definitions
├── .env.example                     # Environment template
├── drizzle.config.ts               # Database configuration
├── middleware.ts                    # Next.js middleware
├── next.config.js                  # Next.js configuration
├── package.json                    # Dependencies and scripts
├── tailwind.config.ts              # Tailwind CSS configuration
└── tsconfig.json                   # TypeScript configuration
```

### Key Directories Explained

#### `/app` - Next.js App Router

- **Route Groups**: `(auth)` for authentication pages
- **Dynamic Routes**: `[id]` for parameterized pages
- **API Routes**: RESTful endpoints with proper HTTP methods
- **Layouts**: Shared layouts for different sections

#### `/components` - UI Components

- **Atomic Design**: Organized by complexity level
- **Feature-Based**: Organisms contain complete features
- **Reusable**: UI components are framework-agnostic

#### `/lib` - Business Logic

- **Service Layer**: External API integrations
- **Utilities**: Helper functions and constants
- **Security**: Authentication and authorization
- **Performance**: Monitoring and optimization

#### `/db` - Database Layer

- **Schema**: Type-safe database definitions
- **Migrations**: Version-controlled schema changes
- **Client**: Database connection and configuration

---

## Development Environment Setup

### System Requirements

- **Operating System**: macOS, Linux, or Windows with WSL2
- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **PostgreSQL**: Version 14.0 or higher
- **Git**: Version 2.30.0 or higher

### IDE Setup (Recommended: VS Code)

#### Required Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Environment Configuration

#### 1. Database Setup (Local PostgreSQL)

```bash
# Install PostgreSQL (macOS with Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Create database and user
createdb verifynin_dev
createuser verifynin_user --createdb --login
psql -c "ALTER USER verifynin_user PASSWORD 'your_password';"
```

#### 2. Database Setup (Neon.tech - Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `.env` file

#### 3. External Service Setup

**Paystack Setup:**

1. Create account at [paystack.com](https://paystack.com)
2. Navigate to Settings → API Keys & Webhooks
3. Copy test keys for development
4. Set up webhook URL: `https://your-domain.com/api/paystack/webhook`

**YouVerify Setup:**

1. Create account at [youverify.co](https://youverify.co)
2. Complete business verification (KYB)
3. Generate API key with NIN permission
4. Fund wallet (minimum ₦500 recommended)

#### 4. Complete Environment File

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication & Security
AUTH_SECRET="generate-with-openssl-rand-base64-32"
ENCRYPTION_KEY="generate-with-openssl-rand-base64-32"

# Paystack (Use test keys for development)
PAYSTACK_PUBLIC_KEY="pk_test_..."
PAYSTACK_SECRET_KEY="sk_test_..."

# YouVerify (Use live keys even for development)
YOUVERIFY_TOKEN="your-live-api-token"
YOUVERIFY_BASE_URL="https://api.youverify.co"

# Admin System
FIRST_SUPER_ADMIN_EMAIL="admin@yourdomain.com"
FIRST_SUPER_ADMIN_PASSWORD="SecurePassword123!"

# Optional: Development Features
LOG_LEVEL="debug"
ENABLE_RATE_LIMITING="false"
NODE_ENV="development"
```

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes
npm run db:generate     # Generate migrations
npm run db:migrate      # Run migrations
npm run db:studio       # Open database GUI

# Code Quality
npm run lint            # Run ESLint
npm run lint:security   # Run security linting
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking

# Testing
npm test                # Run unit tests
npm run test:security   # Run security tests
npm run test:e2e        # Run end-to-end tests
npm run test:coverage   # Generate coverage report

# Admin Tools
npm run admin:create    # Create super admin user

# Validation
npm run validate        # Full code validation
npm run validate:quick  # Quick validation (lint + type-check)
```

### Git Workflow Setup

#### 1. Pre-commit Hooks (Husky)

Pre-commit hooks are automatically installed with `npm install`. They run:

- Code formatting (Prettier)
- Linting (ESLint + Security)
- Type checking (TypeScript)
- Unit tests
- Build validation

#### 2. Commit Message Convention

```bash
# Format: type(scope): description

feat(auth): add two-factor authentication
fix(payment): resolve webhook signature validation
docs(api): update endpoint documentation
refactor(ui): improve component structure
test(admin): add user management tests
chore(deps): update dependencies
```

#### 3. Branch Naming Convention

```bash
# Feature branches
feature/user-authentication
feature/payment-integration
feature/admin-dashboard

# Bug fixes
fix/payment-webhook-validation
fix/nin-verification-error

# Hotfixes
hotfix/security-vulnerability
hotfix/payment-processing-issue
```

---

## Database Schema & Management

### Core Database Schema

#### User Management

```sql
-- Users table with role-based access
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

-- Wallet system for payment management
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id),
  balance INTEGER DEFAULT 0, -- Amount in kobo (₦1 = 100 kobo)
  currency TEXT DEFAULT 'NGN',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Transaction Management

```sql
-- Comprehensive transaction tracking
CREATE TABLE wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type transaction_type, -- 'credit', 'debit', 'refund'
  status transaction_status, -- 'pending', 'completed', 'failed', 'refunded'
  amount INTEGER NOT NULL, -- Amount in kobo
  provider TEXT NOT NULL, -- 'paystack', 'youverify', 'system'
  reference TEXT, -- External reference (Paystack ref, etc.)
  description TEXT,
  nin_masked TEXT, -- For verification transactions
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NIN verification records
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

#### Admin & Support System

```sql
-- Support ticket system with SLA tracking
CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  category ticket_category,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Comprehensive audit logging
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  event_type audit_event_type,
  user_id TEXT REFERENCES users(id),
  ip_address TEXT,
  user_agent TEXT,
  resource TEXT,
  action TEXT NOT NULL,
  status audit_status,
  metadata JSONB,
  error_message TEXT
);
```

### Database Operations

#### Schema Management with Drizzle

```typescript
// db/schema.ts - Type-safe schema definition
import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  // ... other fields
});

// Generate TypeScript types automatically
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

#### Common Database Operations

```typescript
// lib/db-operations.ts
import { db } from "@/db/client";
import { users, wallets, walletTransactions } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

// User operations
export async function createUser(userData: NewUser) {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

// Transaction operations with joins
export async function getUserTransactions(userId: string, limit = 50) {
  return await db
    .select({
      id: walletTransactions.id,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      description: walletTransactions.description,
      createdAt: walletTransactions.createdAt,
    })
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);
}

// Complex queries with aggregations
export async function getDashboardMetrics() {
  const [userCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  const [transactionStats] = await db
    .select({
      totalVolume: sql<number>`sum(amount)`,
      avgAmount: sql<number>`avg(amount)`,
      successRate: sql<number>`
        (count(*) filter (where status = 'completed')::float / count(*)) * 100
      `,
    })
    .from(walletTransactions);

  return { userCount: userCount.count, ...transactionStats };
}
```

#### Migration Management

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Reset database (development only)
npm run db:reset
```

### Database Best Practices

#### 1. Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_date ON wallet_transactions(user_id, created_at);
CREATE INDEX idx_verifications_status ON nin_verifications(status, created_at);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

#### 2. Data Integrity

```sql
-- Foreign key constraints
ALTER TABLE wallets ADD CONSTRAINT fk_wallet_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Check constraints
ALTER TABLE wallets ADD CONSTRAINT chk_positive_balance
  CHECK (balance >= 0);
```

#### 3. Security Measures

- All PII data encrypted at application level
- NIN numbers stored in masked format only
- Audit logging for all sensitive operations
- Row-level security for multi-tenant data

---

## Authentication & Authorization

### Authentication System Overview

The application uses a JWT-based authentication system with httpOnly cookies for security. The system supports multiple user roles with granular permissions.

#### Session Management

```typescript
// lib/auth.ts - Core authentication utilities

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: "user" | "admin" | "super_admin";
  iat: number;
  exp: number;
}

// Create secure session
export async function createSession(user: User) {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());

  // Set httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

// Validate session
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey());
    return payload;
  } catch (error) {
    await clearSession();
    return null;
  }
}
```

#### Password Security

```typescript
// Secure password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return { isValid: errors.length === 0, errors };
}
```

### Authorization System

#### Role-Based Access Control (RBAC)

```typescript
// Types for role-based permissions
type UserRole = "user" | "admin" | "super_admin";

interface Permission {
  resource: string;
  action: "create" | "read" | "update" | "delete";
  conditions?: Record<string, any>;
}

// Permission matrix
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { resource: "wallet", action: "read" },
    { resource: "wallet", action: "update" }, // Fund wallet
    { resource: "verification", action: "create" },
    {
      resource: "verification",
      action: "read",
      conditions: { ownedBy: "self" },
    },
    { resource: "support_ticket", action: "create" },
    {
      resource: "support_ticket",
      action: "read",
      conditions: { ownedBy: "self" },
    },
  ],
  admin: [
    // All user permissions plus:
    { resource: "user", action: "read" },
    { resource: "user", action: "update" },
    { resource: "transaction", action: "read" },
    { resource: "verification", action: "read" },
    { resource: "support_ticket", action: "read" },
    { resource: "support_ticket", action: "update" },
    { resource: "analytics", action: "read" },
  ],
  super_admin: [
    // All admin permissions plus:
    { resource: "user", action: "delete" },
    { resource: "admin", action: "create" },
    { resource: "admin", action: "delete" },
    { resource: "system", action: "read" },
    { resource: "system", action: "update" },
    { resource: "audit_log", action: "read" },
  ],
};

// Permission checking utility
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string,
  context?: Record<string, any>,
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];

  return permissions.some((permission) => {
    if (permission.resource !== resource || permission.action !== action) {
      return false;
    }

    // Check conditions if present
    if (permission.conditions && context) {
      return Object.entries(permission.conditions).every(([key, value]) => {
        if (value === "self" && key === "ownedBy") {
          return context.userId === context.resourceOwnerId;
        }
        return context[key] === value;
      });
    }

    return true;
  });
}
```

#### Middleware Protection

```typescript
// middleware.ts - Route protection
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = await getSession();

  // Public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Authentication required
  if (!session) {
    return redirectToLogin(request, pathname);
  }

  // Role-based route protection
  if (pathname.startsWith("/admin")) {
    if (!["admin", "super_admin"].includes(session.role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Super admin only routes
  if (pathname.startsWith("/admin/system")) {
    if (session.role !== "super_admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/api/auth/login",
    "/api/auth/register",
  ];
  return (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/paystack/webhook")
  );
}
```

#### API Route Protection

```typescript
// Example protected API route
export async function GET(request: NextRequest) {
  // Authentication check
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Permission check
  if (!hasPermission(session.role, "user", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limiting check
  const rateLimitResult = await checkRateLimit(session.userId, "api_call");
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": rateLimitResult.retryAfter.toString() },
      },
    );
  }

  // Audit logging
  await logAuditEvent({
    eventType: "api.access",
    userId: session.userId,
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    resource: "user",
    action: "read",
    status: "success",
  });

  // Business logic here
  return NextResponse.json({ data: "success" });
}
```

### Security Features

#### Rate Limiting

```typescript
// lib/rate-limit.ts
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  api_call: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  admin_api: { windowMs: 60 * 1000, maxRequests: 200 }, // 200 requests per minute for admins
};

export async function checkRateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMITS,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const config = RATE_LIMITS[type];
  const key = `rate_limit:${type}:${identifier}`;

  // Implementation depends on storage (Redis recommended for production)
  const current = await redis.get(key);
  const count = current ? parseInt(current) : 0;

  if (count >= config.maxRequests) {
    const ttl = await redis.ttl(key);
    return { allowed: false, retryAfter: ttl };
  }

  await redis.incr(key);
  await redis.expire(key, Math.ceil(config.windowMs / 1000));

  return { allowed: true };
}
```

#### Account Security

```typescript
// Account lockout after failed attempts
export async function handleFailedLogin(email: string): Promise<void> {
  const key = `failed_login:${email}`;
  const attempts = await redis.incr(key);
  await redis.expire(key, 15 * 60); // 15 minutes

  if (attempts >= 5) {
    // Lock account temporarily
    await redis.set(`account_locked:${email}`, "true", "EX", 30 * 60); // 30 minutes

    // Log security event
    await logAuditEvent({
      eventType: "security.account_locked",
      resource: "user",
      action: "login",
      status: "failure",
      metadata: { email, attempts },
    });
  }
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const locked = await redis.get(`account_locked:${email}`);
  return locked === "true";
}
```

---

## API Architecture

### RESTful API Design

The application follows REST principles with consistent URL patterns, HTTP methods, and response formats.

#### URL Structure

```
/api/auth/*              # Authentication endpoints
/api/wallet/*            # Wallet management
/api/nin/*               # NIN verification
/api/paystack/*          # Payment processing
/api/support/*           # Support system
/api/admin/*             # Admin-only endpoints
```

#### HTTP Methods & Status Codes

```typescript
// Standard HTTP methods usage
GET    /api/users        # List users (200, 404)
POST   /api/users        # Create user (201, 400, 409)
GET    /api/users/:id    # Get user (200, 404)
PUT    /api/users/:id    # Update user (200, 400, 404)
DELETE /api/users/:id    # Delete user (204, 404)

// Status codes
200 OK                   # Successful GET, PUT
201 Created             # Successful POST
204 No Content          # Successful DELETE
400 Bad Request         # Validation errors
401 Unauthorized        # Authentication required
403 Forbidden           # Insufficient permissions
404 Not Found           # Resource not found
409 Conflict            # Resource already exists
422 Unprocessable Entity # Business logic errors
429 Too Many Requests   # Rate limit exceeded
500 Internal Server Error # Server errors
```

### API Response Format

```typescript
// Successful responses
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}

// Error responses
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
  timestamp: string;
}

// Pagination info
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### Core API Endpoints

#### Authentication Endpoints

```typescript
// POST /api/auth/register
interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

interface RegisterResponse {
  success: true;
  message: "Account created successfully";
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: true;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
}
```

#### NIN Verification API

```typescript
// POST /api/nin/verify
interface VerifyNinRequest {
  nin: string; // 11-digit NIN
  consent: boolean; // User consent required
  purpose: VerificationPurpose;
}

interface VerifyNinResponse {
  success: true;
  verification: {
    id: string;
    status: "success" | "failed";
    fullName?: string;
    dateOfBirth?: string;
    phone?: string;
    errorMessage?: string;
  };
  receiptUrl?: string;
  refunded?: boolean;
  refundAmount?: number;
}
```

#### Wallet Management API

```typescript
// GET /api/wallet/balance
interface WalletBalanceResponse {
  balance: number; // Amount in kobo
  currency: "NGN";
  balanceFormatted: string; // "₦1,500.00"
  lastUpdated: string;
}

// POST /api/wallet/check-pending-payments
interface CheckPendingPaymentsRequest {
  reference: string; // Paystack reference
}

interface CheckPendingPaymentsResponse {
  success: true;
  found: boolean;
  amount?: number;
  status?: "success" | "failed";
  message: string;
}
```

#### Admin API Endpoints

```typescript
// GET /api/admin/users
interface AdminUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "active" | "suspended";
  sort?: "created_at" | "email" | "balance";
  order?: "asc" | "desc";
}

interface AdminUsersResponse {
  success: true;
  users: AdminUserSummary[];
  pagination: PaginationInfo;
}

// GET /api/admin/dashboard/metrics
interface DashboardMetricsResponse {
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

### Input Validation

```typescript
// Using Zod for type-safe validation
import { z } from "zod";

// Registration schema
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),

  email: z.string().email("Invalid email address").toLowerCase(),

  phone: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, "Invalid Nigerian phone number"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number, and special character",
    ),
});

// NIN verification schema
export const ninVerificationSchema = z.object({
  nin: z
    .string()
    .length(11, "NIN must be exactly 11 digits")
    .regex(/^\d{11}$/, "NIN must contain only numbers"),

  consent: z
    .boolean()
    .refine((val) => val === true, "Consent is required for NIN verification"),

  purpose: z.enum([
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
    "other",
  ]),
});

// Usage in API routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Process validated data
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
```

### Error Handling

```typescript
// lib/api-errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class ValidationError extends APIError {
  constructor(
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

// Global error handler
export function handleAPIError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode },
    );
  }

  // Log unexpected errors
  logAuditEvent({
    eventType: "api.error",
    action: "error_handler",
    status: "failure",
    errorMessage: error instanceof Error ? error.message : "Unknown error",
  });

  return NextResponse.json(
    {
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString(),
    },
    { status: 500 },
  );
}
```

---

## Frontend Architecture

### Component Architecture

The frontend follows atomic design principles with a clear component hierarchy and consistent patterns.

#### Component Organization

```
components/
├── atoms/                    # Basic UI elements
│   └── section-title.tsx     # Reusable section headers
├── molecules/                # Composite components
│   ├── metric-card.tsx       # Dashboard metric displays
│   └── stat-card.tsx         # Statistical information cards
├── organisms/                # Complex feature components
│   ├── admin-dashboard-client.tsx      # Admin dashboard
│   ├── user-management-client.tsx      # User management
│   ├── support-ticket-management.tsx   # Support system
│   └── transaction-management.tsx      # Transaction monitoring
├── sections/                 # Page-level sections
│   ├── hero-section.tsx      # Landing page hero
│   ├── features-section.tsx  # Feature showcase
│   └── footer-section.tsx    # Site footer
├── navigation/               # Navigation components
│   ├── dashboard-navigation.tsx  # User dashboard nav
│   └── admin-navigation.tsx      # Admin panel nav
└── ui/                       # shadcn/ui base components
    ├── button.tsx            # Button variants
    ├── card.tsx              # Card layouts
    ├── dialog.tsx            # Modal dialogs
    └── ...                   # Other UI primitives
```

#### Component Patterns

**1. Client Component Pattern**

```typescript
// components/organisms/user-management-client.tsx
"use client";

import { useState, useEffect } from "react";
import { User, UserFilters } from "@/types";

interface UserManagementClientProps {
  initialUsers?: User[];
  initialFilters?: UserFilters;
}

export function UserManagementClient({
  initialUsers = [],
  initialFilters = {}
}: UserManagementClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data fetching with error handling
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.set(key, value.toString());
      });

      const response = await fetch(`/api/admin/users?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  return (
    <div className="space-y-6">
      <UserFilters
        filters={filters}
        onChange={setFilters}
        disabled={loading}
      />

      {error && (
        <ErrorAlert message={error} onRetry={fetchUsers} />
      )}

      <UserTable
        users={users}
        loading={loading}
        onUserUpdate={fetchUsers}
      />
    </div>
  );
}
```

**2. Form Component Pattern**

```typescript
// components/organisms/adminlogin-cores-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function AdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push("/admin");
      } else {
        const error = await response.json();
        form.setError("root", { message: error.error });
      }
    } catch (error) {
      form.setError("root", { message: "Network error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          {...form.register("email")}
          type="email"
          placeholder="Admin email"
          disabled={isLoading}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <Input
          {...form.register("password")}
          type="password"
          placeholder="Password"
          disabled={isLoading}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {form.formState.errors.root && (
        <p className="text-sm text-red-600">
          {form.formState.errors.root.message}
        </p>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
```

**3. Modal Component Pattern**

```typescript
// components/organisms/user-detail-modal.tsx
interface UserDetailModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export function UserDetailModal({ userId, open, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchUserDetail(userId);
    }
  }, [userId, open]);

  const fetchUserDetail = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`);
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <UserDetailSkeleton />
        ) : user ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="verifications">Verifications</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <UserOverview user={user} />
            </TabsContent>

            <TabsContent value="transactions">
              <UserTransactionHistory userId={user.id} />
            </TabsContent>

            <TabsContent value="verifications">
              <UserVerificationHistory userId={user.id} />
            </TabsContent>

            <TabsContent value="support">
              <UserSupportTickets userId={user.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p>User not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### State Management

#### Local State with React Hooks

```typescript
// Custom hooks for common patterns
// lib/hooks/use-api.ts
export function useApi<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      setData(result.data || result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Usage in components
function UserList() {
  const { data: users, loading, error, refetch } = useApi<User[]>("/api/admin/users");

  if (loading) return <UserListSkeleton />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return <UserTable users={users || []} />;
}
```

#### Global State with Zustand

```typescript
// lib/stores/app-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // UI State
  sidebarOpen: boolean;
  theme: "light" | "dark";

  // User State
  user: User | null;

  // Notifications
  notifications: Notification[];

  // Actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setUser: (user: User | null) => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: false,
      theme: "light",
      user: null,
      notifications: [],

      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setTheme: (theme) => set({ theme }),

      setUser: (user) => set({ user }),

      addNotification: (notification) => {
        const id = nanoid();
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id }],
        }));

        // Auto-remove after 5 seconds
        setTimeout(() => {
          get().removeNotification(id);
        }, 5000);
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: "app-store",
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    },
  ),
);
```

#### URL State Management

```typescript
// lib/hooks/use-url-state.ts
export function useUrlState<T extends Record<string, string>>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current state from URL
  const currentState = useMemo(() => {
    const state = { ...initialState };
    Object.keys(initialState).forEach((key) => {
      const value = searchParams.get(key);
      if (value) state[key as keyof T] = value as T[keyof T];
    });
    return state;
  }, [searchParams, initialState]);

  // Update URL with new state
  const updateState = useCallback((updates: Partial<T>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== initialState[key as keyof T]) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, initialState]);

  return [currentState, updateState];
}

// Usage for filters
function UserManagement() {
  const [filters, setFilters] = useUrlState({
    search: "",
    status: "all",
    page: "1",
  });

  return (
    <div>
      <UserFilters filters={filters} onChange={setFilters} />
      <UserList filters={filters} />
    </div>
  );
}
```

### Styling System

#### Tailwind CSS Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          900: "#14532d",
        },
        // Admin-specific colors
        admin: {
          primary: "#1f2937",
          secondary: "#6b7280",
          accent: "#3b82f6",
        },
        // Status colors
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "3xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

#### Component Styling Patterns

```typescript
// Consistent styling utilities
import { cn } from "@/lib/utils";

// Status-based styling
export function getStatusColor(status: string): string {
  const statusColors = {
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    suspended: "bg-red-100 text-red-800 border-red-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return statusColors[status as keyof typeof statusColors] ||
         "bg-gray-100 text-gray-800 border-gray-200";
}

// Card component with variants
interface CardProps {
  variant?: "default" | "elevated" | "glass" | "gradient";
  className?: string;
  children: React.ReactNode;
}

export function Card({ variant = "default", className, children }: CardProps) {
  const variants = {
    default: "bg-white border border-gray-200 rounded-3xl p-6",
    elevated: "bg-white border border-gray-200 rounded-3xl p-6 shadow-lg",
    glass: "bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-6",
    gradient: "bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-3xl p-6",
  };

  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
}

// Responsive grid patterns
export function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}
```

### Performance Optimization

#### Code Splitting & Lazy Loading

```typescript
// Lazy load heavy components
import { lazy, Suspense } from "react";

const AdminDashboard = lazy(() => import("@/components/organisms/admin-dashboard-client"));
const UserManagement = lazy(() => import("@/components/organisms/user-management-client"));

function AdminPage() {
  return (
    <div>
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboard />
      </Suspense>

      <Suspense fallback={<UserManagementSkeleton />}>
        <UserManagement />
      </Suspense>
    </div>
  );
}
```

#### Memoization & Optimization

```typescript
// Memoize expensive components
import { memo, useMemo, useCallback } from "react";

export const UserTable = memo<UserTableProps>(({ users, onUserUpdate }) => {
  // Memoize filtered/sorted data
  const processedUsers = useMemo(() => {
    return users
      .filter(user => !user.isDeleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [users]);

  // Memoize event handlers
  const handleUserSuspend = useCallback((userId: string) => {
    // Suspend user logic
    onUserUpdate();
  }, [onUserUpdate]);

  return (
    <div className="space-y-4">
      {processedUsers.map(user => (
        <UserRow
          key={user.id}
          user={user}
          onSuspend={handleUserSuspend}
        />
      ))}
    </div>
  );
});

UserTable.displayName = "UserTable";
```

#### Virtual Scrolling for Large Lists

```typescript
// components/ui/virtual-list.tsx
import { FixedSizeList as List } from "react-window";

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; data: T[] }) => React.ReactElement;
}

export function VirtualList<T>({ items, height, itemHeight, renderItem }: VirtualListProps<T>) {
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {renderItem}
    </List>
  );
}

// Usage for large user lists
function LargeUserList({ users }: { users: User[] }) {
  const renderUser = ({ index, style, data }: any) => (
    <div style={style}>
      <UserRow user={data[index]} />
    </div>
  );

  return (
    <VirtualList
      items={users}
      height={600}
      itemHeight={80}
      renderItem={renderUser}
    />
  );
}
```

---

## External Services Integration

### YouVerify API Integration

YouVerify provides the core NIN verification service. The integration handles authentication, request formatting, and response processing.

#### API Configuration

```typescript
// lib/youverify.ts
interface YouVerifyConfig {
  baseUrl: string;
  token: string;
  timeout: number;
}

const config: YouVerifyConfig = {
  baseUrl: process.env.YOUVERIFY_BASE_URL || "https://api.youverify.co",
  token: process.env.YOUVERIFY_TOKEN!,
  timeout: 30000, // 30 seconds
};

// NIN verification request
export async function verifyNinWithYouVerify(
  nin: string,
): Promise<YouVerifyResponse> {
  const url = `${config.baseUrl}/v2/api/identity/ng/nin`;

  const requestBody = {
    id: nin,
    isSubjectConsent: true,
  };

  // Retry logic for network issues
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          token: config.token, // Note: Not "Authorization: Bearer"
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(config.timeout),
      });

      // Handle specific error codes
      if (response.status === 402) {
        throw new YouVerifyError(
          "Insufficient funds in YouVerify wallet",
          "INSUFFICIENT_FUNDS",
        );
      }

      if (response.status === 403) {
        throw new YouVerifyError(
          "API key missing NIN permission",
          "PERMISSION_DENIED",
        );
      }

      if (response.status === 404) {
        throw new YouVerifyError(
          "NIN not found in NIMC database",
          "NIN_NOT_FOUND",
        );
      }

      // Retry on server errors
      if (response.status >= 500 && attempt < 3) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        throw new YouVerifyError(
          `HTTP ${response.status}: ${response.statusText}`,
          "HTTP_ERROR",
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (attempt === 3) throw error;

      // Only retry on network errors, not API errors
      if (error instanceof YouVerifyError) throw error;
    }
  }

  throw new YouVerifyError("Maximum retry attempts exceeded", "NETWORK_ERROR");
}

// Custom error class
export class YouVerifyError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "YouVerifyError";
  }
}
```

#### Response Processing

```typescript
// Process YouVerify response
export function processYouVerifyResponse(response: any): VerificationResult {
  // Success response structure
  if (response.success === true && response.data) {
    return {
      success: true,
      data: {
        fullName: response.data.firstName + " " + response.data.lastName,
        dateOfBirth: response.data.birthDate,
        phone: response.data.telephoneNumber,
        gender: response.data.gender,
        // Don't store raw NIN - use masked version
      },
      providerReference: response.requestId,
    };
  }

  // Error response
  return {
    success: false,
    error: response.message || "Verification failed",
    code: response.code || "UNKNOWN_ERROR",
  };
}
```

### Paystack Integration

Paystack handles all payment processing with webhook verification for security.

#### Payment Initialization

```typescript
// lib/paystack.ts
interface PaystackConfig {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
}

const config: PaystackConfig = {
  publicKey: process.env.PAYSTACK_PUBLIC_KEY!,
  secretKey: process.env.PAYSTACK_SECRET_KEY!,
  baseUrl: "https://api.paystack.co",
};

export async function initializePaystackPayment(
  email: string,
  amount: number, // Amount in kobo
  metadata?: Record<string, any>,
): Promise<PaystackInitializeResponse> {
  const response = await fetch(`${config.baseUrl}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount,
      currency: "NGN",
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      metadata: {
        ...metadata,
        custom_fields: [
          {
            display_name: "Service",
            variable_name: "service",
            value: "NIN Verification Wallet Funding",
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Paystack initialization failed: ${response.statusText}`);
  }

  return await response.json();
}
```

#### Payment Verification

```typescript
export async function verifyPaystackPayment(
  reference: string,
): Promise<PaystackVerificationResponse> {
  const response = await fetch(
    `${config.baseUrl}/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Payment verification failed: ${response.statusText}`);
  }

  return await response.json();
}
```

#### Webhook Handling

```typescript
// app/api/paystack/webhook/route.ts
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Verify webhook signature
  if (!verifyPaystackSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  try {
    switch (event.event) {
      case "charge.success":
        await handleSuccessfulPayment(event.data);
        break;

      case "charge.failed":
        await handleFailedPayment(event.data);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

function verifyPaystackSignature(
  payload: string,
  signature: string | null,
): boolean {
  if (!signature) return false;

  const hash = crypto
    .createHmac("sha512", config.secretKey)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

async function handleSuccessfulPayment(data: any) {
  const { reference, amount, customer } = data;

  // Find user by email
  const user = await getUserByEmail(customer.email);
  if (!user) {
    throw new Error(`User not found: ${customer.email}`);
  }

  // Credit wallet
  await creditUserWallet(user.id, amount, reference);

  // Log transaction
  await logAuditEvent({
    eventType: "payment.success",
    userId: user.id,
    resource: "wallet",
    action: "credit",
    status: "success",
    metadata: { reference, amount },
  });
}
```

### Database Connection Management

#### Neon Database Setup

```typescript
// db/client.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Create connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}
```

#### Connection Pooling & Optimization

```typescript
// For production with connection pooling
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

// Graceful shutdown
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
```

### Error Handling & Monitoring

#### Centralized Error Handling

```typescript
// lib/error-handler.ts
export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public service: "youverify" | "paystack" | "database",
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "ExternalServiceError";
  }
}

export async function handleExternalServiceError(
  error: unknown,
  service: string,
  operation: string,
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  // Log error for monitoring
  await logAuditEvent({
    eventType: "api.error",
    resource: service,
    action: operation,
    status: "failure",
    errorMessage,
    metadata: {
      service,
      operation,
      timestamp: new Date().toISOString(),
    },
  });

  // Send to monitoring service (e.g., Sentry)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(error);
  }
}
```

#### Service Health Monitoring

```typescript
// lib/health-check.ts
interface ServiceHealth {
  service: string;
  status: "healthy" | "degraded" | "down";
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

export async function checkServiceHealth(): Promise<ServiceHealth[]> {
  const checks = await Promise.allSettled([
    checkDatabaseHealth(),
    checkYouVerifyHealth(),
    checkPaystackHealth(),
  ]);

  return [
    {
      service: "database",
      status:
        checks[0].status === "fulfilled" && checks[0].value
          ? "healthy"
          : "down",
      lastChecked: new Date(),
      error:
        checks[0].status === "rejected" ? checks[0].reason.message : undefined,
    },
    {
      service: "youverify",
      status:
        checks[1].status === "fulfilled" && checks[1].value
          ? "healthy"
          : "down",
      lastChecked: new Date(),
      error:
        checks[1].status === "rejected" ? checks[1].reason.message : undefined,
    },
    {
      service: "paystack",
      status:
        checks[2].status === "fulfilled" && checks[2].value
          ? "healthy"
          : "down",
      lastChecked: new Date(),
      error:
        checks[2].status === "rejected" ? checks[2].reason.message : undefined,
    },
  ];
}

async function checkYouVerifyHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.YOUVERIFY_BASE_URL}/health`, {
      method: "GET",
      headers: { token: process.env.YOUVERIFY_TOKEN! },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkPaystackHealth(): Promise<boolean> {
  try {
    const response = await fetch("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

---

## Security Implementation

### Data Protection & Encryption

#### Sensitive Data Encryption

```typescript
// lib/security/encryption.ts
import crypto from "crypto";

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "base64");
const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from("verifynin", "utf8"));

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from("verifynin", "utf8"));
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// NIN masking for display
export function maskNin(nin: string): string {
  if (nin.length !== 11) return nin;
  return `${nin.substring(0, 3)}****${nin.substring(7)}`;
}
```

#### Input Sanitization & Validation

```typescript
// lib/security/input-validation.ts
import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

// Sanitize HTML input
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });
}

// SQL injection prevention (using parameterized queries)
export function sanitizeSqlInput(input: string): string {
  // Remove potentially dangerous characters
  return input.replace(/['"\\;]/g, "");
}

// Phone number validation for Nigeria
export const nigerianPhoneSchema = z
  .string()
  .regex(/^(\+234|0)[789]\d{9}$/, "Invalid Nigerian phone number")
  .transform((phone) => {
    // Normalize to +234 format
    if (phone.startsWith("0")) {
      return "+234" + phone.substring(1);
    }
    return phone;
  });

// NIN validation
export const ninSchema = z
  .string()
  .length(11, "NIN must be exactly 11 digits")
  .regex(/^\d{11}$/, "NIN must contain only numbers")
  .refine((nin) => {
    // Basic checksum validation (if available)
    return validateNinChecksum(nin);
  }, "Invalid NIN checksum");

function validateNinChecksum(nin: string): boolean {
  // Implement NIN checksum algorithm if available
  // For now, just basic validation
  return nin.length === 11 && /^\d{11}$/.test(nin);
}
```

### Authentication Security

#### Session Security

```typescript
// lib/security/auth-security.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "verifynin_session";
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// Secure session creation with additional claims
export async function createSecureSession(user: User, request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Create device fingerprint
  const deviceFingerprint = crypto
    .createHash("sha256")
    .update(`${ipAddress}:${userAgent}`)
    .digest("hex");

  const payload = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    deviceFingerprint,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecretKey());

  // Set secure cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL,
  });

  // Log session creation
  await logAuditEvent({
    eventType: "user.login",
    userId: user.id,
    ipAddress,
    userAgent,
    resource: "session",
    action: "create",
    status: "success",
    metadata: { deviceFingerprint },
  });
}

// Session validation with security checks
export async function validateSecureSession(
  request: NextRequest,
): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey());

    // Verify device fingerprint
    const currentIp = request.headers.get("x-forwarded-for") || "unknown";
    const currentUserAgent = request.headers.get("user-agent") || "unknown";
    const currentFingerprint = crypto
      .createHash("sha256")
      .update(`${currentIp}:${currentUserAgent}`)
      .digest("hex");

    if (payload.deviceFingerprint !== currentFingerprint) {
      await logAuditEvent({
        eventType: "security.suspicious_activity",
        userId: payload.userId,
        ipAddress: currentIp,
        resource: "session",
        action: "fingerprint_mismatch",
        status: "failure",
        metadata: {
          expectedFingerprint: payload.deviceFingerprint,
          actualFingerprint: currentFingerprint,
        },
      });

      await clearSession();
      return null;
    }

    return payload;
  } catch (error) {
    await clearSession();
    return null;
  }
}
```

#### Multi-Factor Authentication (Future Enhancement)

```typescript
// lib/security/mfa.ts
import crypto from "crypto";

export function generateTotpSecret(): string {
  return crypto.randomBytes(20).toString("base32");
}

export function generateTotpCode(secret: string, window = 0): string {
  const epoch = Math.floor(Date.now() / 1000 / 30) + window;
  const hmac = crypto.createHmac("sha1", Buffer.from(secret, "base32"));
  hmac.update(Buffer.from(epoch.toString(16).padStart(16, "0"), "hex"));

  const hash = hmac.digest();
  const offset = hash[hash.length - 1] & 0xf;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, "0");
}

export function verifyTotpCode(secret: string, code: string): boolean {
  // Check current window and ±1 window for clock drift
  for (let window = -1; window <= 1; window++) {
    if (generateTotpCode(secret, window) === code) {
      return true;
    }
  }
  return false;
}
```

### API Security

#### Rate Limiting Implementation

```typescript
// lib/security/rate-limiting.ts
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

export function createRateLimiter(windowMs: number, maxRequests: number) {
  return (identifier: string): { allowed: boolean; retryAfter?: number } => {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    if (entry.count > maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    return { allowed: true };
  };
}

// Different rate limits for different endpoints
export const loginRateLimit = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
export const apiRateLimit = createRateLimiter(60 * 1000, 100); // 100 requests per minute
export const adminApiRateLimit = createRateLimiter(60 * 1000, 200); // 200 requests per minute
```

#### CORS & Security Headers

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NODE_ENV === "production"
                ? "https://yourdomain.com"
                : "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};
```

### Audit Logging & Compliance

#### Comprehensive Audit System

```typescript
// lib/security/audit-logger.ts
export interface AuditLogEntry {
  timestamp: string;
  eventType: AuditEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource: string;
  action: string;
  status: "success" | "failure" | "pending";
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export async function logAuditEvent(entry: Omit<AuditLogEntry, "timestamp">) {
  const auditEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  try {
    // Store in database
    await db.insert(auditLogs).values({
      id: nanoid(),
      ...auditEntry,
    });

    // Also log to external service for compliance
    if (process.env.AUDIT_LOG_WEBHOOK) {
      await fetch(process.env.AUDIT_LOG_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auditEntry),
      });
    }
  } catch (error) {
    // Fallback to file logging if database fails
    console.error("Audit logging failed:", error);
    console.log("AUDIT:", JSON.stringify(auditEntry));
  }
}

// Automatic audit logging middleware
export function withAuditLogging(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    const session = await getSession();

    try {
      const result = await handler(request, ...args);

      await logAuditEvent({
        eventType: "api.access",
        userId: session?.userId,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        resource: request.nextUrl.pathname,
        action: request.method,
        status: "success",
        metadata: {
          responseTime: Date.now() - startTime,
          statusCode: result.status,
        },
      });

      return result;
    } catch (error) {
      await logAuditEvent({
        eventType: "api.error",
        userId: session?.userId,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        resource: request.nextUrl.pathname,
        action: request.method,
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  };
}
```

---

## Testing Strategy

### Testing Architecture

The application uses a comprehensive testing strategy covering unit tests, integration tests, security tests, and end-to-end tests.

#### Test Structure

```
tests/
├── unit/                     # Unit tests
│   ├── lib/                  # Library function tests
│   ├── components/           # Component tests
│   └── utils/                # Utility function tests
├── integration/              # Integration tests
│   ├── api/                  # API endpoint tests
│   ├── database/             # Database operation tests
│   └── external-services/    # External API tests
├── security/                 # Security-focused tests
│   ├── auth.test.ts          # Authentication tests
│   ├── input-validation.test.ts # Input validation tests
│   └── rate-limiting.test.ts # Rate limiting tests
└── e2e/                      # End-to-end tests
    ├── auth.spec.ts          # Authentication flows
    ├── nin-verification.spec.ts # NIN verification process
    └── admin-panel.spec.ts   # Admin functionality
```

### Unit Testing

#### Component Testing with React Testing Library

```typescript
// tests/components/user-management-client.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserManagementClient } from "@/components/organisms/user-management-client";
import { mockUsers } from "../__mocks__/users";

// Mock fetch
global.fetch = jest.fn();

describe("UserManagementClient", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("renders user list correctly", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockUsers }),
    });

    render(<UserManagementClient />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    });
  });

  it("handles search functionality", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockUsers.filter(u => u.email.includes("john")) }),
    });

    render(<UserManagementClient />);

    const searchInput = screen.getByPlaceholderText("Search users...");
    fireEvent.change(searchInput, { target: { value: "john" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("search=john")
      );
    });
  });

  it("handles user suspension", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<UserManagementClient />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const suspendButton = screen.getByText("Suspend");
    fireEvent.click(suspendButton);

    const confirmButton = screen.getByText("Confirm Suspension");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("suspend"),
        })
      );
    });
  });

  it("displays error message on fetch failure", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<UserManagementClient />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load users")).toBeInTheDocument();
    });
  });
});
```

#### Utility Function Testing

```typescript
// tests/lib/auth.test.ts
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "@/lib/auth";

describe("Authentication utilities", () => {
  describe("password hashing", () => {
    it("hashes password correctly", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it("verifies password correctly", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword("WrongPassword", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("password strength validation", () => {
    it("validates strong password", () => {
      const result = validatePasswordStrength("StrongPass123!");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects weak passwords", () => {
      const result = validatePasswordStrength("weak");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long",
      );
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter",
      );
    });
  });
});
```

### Integration Testing

#### API Endpoint Testing

```typescript
// tests/integration/api/auth.test.ts
import { NextRequest } from "next/server";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

describe("/api/auth/login", () => {
  beforeEach(async () => {
    // Clean up database
    await db.delete(users);
  });

  it("authenticates valid user", async () => {
    // Create test user
    const hashedPassword = await hashPassword("TestPassword123!");
    await db.insert(users).values({
      id: "test-user-1",
      fullName: "Test User",
      email: "test@example.com",
      phone: "+2348012345678",
      passwordHash: hashedPassword,
      role: "user",
    });

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "TestPassword123!",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await loginHandler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.email).toBe("test@example.com");
  });

  it("rejects invalid credentials", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "WrongPassword",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await loginHandler(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid credentials");
  });

  it("validates input format", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "invalid-email",
        password: "short",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await loginHandler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toBeDefined();
  });
});
```

#### Database Integration Testing

```typescript
// tests/integration/database/user-operations.test.ts
import { db } from "@/db/client";
import { users, wallets } from "@/db/schema";
import {
  createUser,
  getUserByEmail,
  createUserWallet,
} from "@/lib/user-operations";

describe("User database operations", () => {
  beforeEach(async () => {
    await db.delete(wallets);
    await db.delete(users);
  });

  it("creates user with wallet", async () => {
    const userData = {
      fullName: "Test User",
      email: "test@example.com",
      phone: "+2348012345678",
      password: "TestPassword123!",
    };

    const user = await createUser(userData);
    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);

    // Verify wallet was created
    const wallet = await db.query.wallets.findFirst({
      where: (wallets, { eq }) => eq(wallets.userId, user.id),
    });
    expect(wallet).toBeDefined();
    expect(wallet?.balance).toBe(0);
  });

  it("prevents duplicate email registration", async () => {
    const userData = {
      fullName: "Test User",
      email: "test@example.com",
      phone: "+2348012345678",
      password: "TestPassword123!",
    };

    await createUser(userData);

    await expect(createUser(userData)).rejects.toThrow("Email already exists");
  });

  it("retrieves user by email", async () => {
    const userData = {
      fullName: "Test User",
      email: "test@example.com",
      phone: "+2348012345678",
      password: "TestPassword123!",
    };

    const createdUser = await createUser(userData);
    const retrievedUser = await getUserByEmail(userData.email);

    expect(retrievedUser?.id).toBe(createdUser.id);
    expect(retrievedUser?.email).toBe(userData.email);
  });
});
```

### Security Testing

#### Authentication Security Tests

```typescript
// tests/security/auth.test.ts
import { createSession, validateSession } from "@/lib/auth";
import { NextRequest } from "next/server";

describe("Authentication Security", () => {
  it("creates secure session with proper expiration", async () => {
    const user = {
      id: "test-user",
      email: "test@example.com",
      fullName: "Test User",
      role: "user" as const,
    };

    const request = new NextRequest("http://localhost:3000/test", {
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Test Browser",
      },
    });

    await createSession(user, request);

    // Verify session can be validated
    const session = await validateSession(request);
    expect(session?.userId).toBe(user.id);
    expect(session?.email).toBe(user.email);
  });

  it("rejects tampered session tokens", async () => {
    // This would require mocking the cookie with invalid signature
    const request = new NextRequest("http://localhost:3000/test", {
      headers: {
        cookie: "verifynin_session=tampered.token.here",
      },
    });

    const session = await validateSession(request);
    expect(session).toBeNull();
  });

  it("detects device fingerprint changes", async () => {
    const user = {
      id: "test-user",
      email: "test@example.com",
      fullName: "Test User",
      role: "user" as const,
    };

    // Create session with one device
    const originalRequest = new NextRequest("http://localhost:3000/test", {
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Original Browser",
      },
    });

    await createSession(user, originalRequest);

    // Try to validate with different device
    const differentRequest = new NextRequest("http://localhost:3000/test", {
      headers: {
        "x-forwarded-for": "192.168.1.2",
        "user-agent": "Different Browser",
      },
    });

    const session = await validateSession(differentRequest);
    expect(session).toBeNull();
  });
});
```

#### Input Validation Security Tests

```typescript
// tests/security/input-validation.test.ts
import {
  sanitizeHtml,
  validateNin,
  validatePhone,
} from "@/lib/security/input-validation";

describe("Input Validation Security", () => {
  it("sanitizes malicious HTML", () => {
    const maliciousInput = '<script>alert("XSS")</script><p>Safe content</p>';
    const sanitized = sanitizeHtml(maliciousInput);

    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("alert");
    expect(sanitized).toBe("Safe content");
  });

  it("validates NIN format strictly", () => {
    expect(validateNin("12345678901")).toBe(true);
    expect(validateNin("1234567890")).toBe(false); // Too short
    expect(validateNin("123456789012")).toBe(false); // Too long
    expect(validateNin("1234567890a")).toBe(false); // Contains letter
    expect(validateNin("")).toBe(false); // Empty
  });

  it("validates Nigerian phone numbers", () => {
    expect(validatePhone("+2348012345678")).toBe(true);
    expect(validatePhone("08012345678")).toBe(true);
    expect(validatePhone("+2347012345678")).toBe(true);
    expect(validatePhone("+2349012345678")).toBe(true);

    expect(validatePhone("+2346012345678")).toBe(false); // Invalid prefix
    expect(validatePhone("07012345678")).toBe(false); // Invalid local prefix
    expect(validatePhone("+234801234567")).toBe(false); // Too short
  });

  it("prevents SQL injection patterns", () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'/*",
      "1; DELETE FROM users WHERE 1=1; --",
    ];

    maliciousInputs.forEach((input) => {
      const sanitized = sanitizeSqlInput(input);
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain(";");
      expect(sanitized).not.toContain("--");
    });
  });
});
```

### End-to-End Testing

#### Authentication Flow Testing

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("user can register and login", async ({ page }) => {
    // Registration
    await page.goto("/register");

    await page.fill('[name="fullName"]', "Test User");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="phone"]', "08012345678");
    await page.fill('[name="password"]', "TestPassword123!");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/login");
    await expect(
      page.locator("text=Account created successfully"),
    ).toBeVisible();

    // Login
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "TestPassword123!");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("text=Welcome, Test User")).toBeVisible();
  });

  test("admin can access admin panel", async ({ page }) => {
    // Login as admin
    await page.goto("/adminlogin-cores");

    await page.fill('[name="email"]', "admin@example.com");
    await page.fill('[name="password"]', "AdminPassword123!");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/admin");
    await expect(page.locator("text=Admin Dashboard")).toBeVisible();

    // Check admin navigation
    await expect(page.locator("text=Users")).toBeVisible();
    await expect(page.locator("text=Transactions")).toBeVisible();
    await expect(page.locator("text=Support")).toBeVisible();
  });

  test("prevents unauthorized access to admin routes", async ({ page }) => {
    // Try to access admin without login
    await page.goto("/admin");

    await expect(page).toHaveURL("/adminlogin-cores");

    // Login as regular user
    await page.goto("/login");
    await page.fill('[name="email"]', "user@example.com");
    await page.fill('[name="password"]', "UserPassword123!");
    await page.click('button[type="submit"]');

    // Try to access admin routes
    await page.goto("/admin");

    await expect(page).toHaveURL("/dashboard");
  });
});
```

#### NIN Verification Flow Testing

```typescript
// tests/e2e/nin-verification.spec.ts
import { test, expect } from "@playwright/test";

test.describe("NIN Verification Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login as user with sufficient wallet balance
    await page.goto("/login");
    await page.fill('[name="email"]', "user@example.com");
    await page.fill('[name="password"]', "UserPassword123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
  });

  test("successful NIN verification", async ({ page }) => {
    // Navigate to verification
    await page.click("text=Verify NIN");

    // Fill verification form
    await page.fill('[name="nin"]', "11111111111"); // Test NIN
    await page.selectOption('[name="purpose"]', "education_jamb");
    await page.check('[name="consent"]');

    // Submit verification
    await page.click('button[type="submit"]');

    // Wait for processing
    await expect(page.locator("text=Processing verification...")).toBeVisible();

    // Check success result
    await expect(page.locator("text=Verification successful")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.locator("text=Download Receipt")).toBeVisible();

    // Verify wallet was debited
    await page.click("text=Wallet");
    await expect(page.locator("text=NIN Verification")).toBeVisible();
  });

  test("handles insufficient wallet balance", async ({ page }) => {
    // Assume user has insufficient balance
    await page.click("text=Verify NIN");

    await page.fill('[name="nin"]', "11111111111");
    await page.selectOption('[name="purpose"]', "banking");
    await page.check('[name="consent"]');

    await page.click('button[type="submit"]');

    await expect(
      page.locator("text=Insufficient wallet balance"),
    ).toBeVisible();
    await expect(page.locator("text=Fund Wallet")).toBeVisible();
  });

  test("handles failed verification with refund", async ({ page }) => {
    await page.click("text=Verify NIN");

    await page.fill('[name="nin"]', "00000000000"); // Invalid test NIN
    await page.selectOption('[name="purpose"]', "banking");
    await page.check('[name="consent"]');

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Verification failed")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.locator("text=Amount refunded")).toBeVisible();
  });
});
```

### Test Configuration

#### Jest Configuration

```javascript
// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  testMatch: [
    "<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}",
    "<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}",
  ],
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

module.exports = createJestConfig(customJestConfig);
```

#### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Data Management

#### Mock Data Setup

```typescript
// tests/__mocks__/users.ts
export const mockUsers = [
  {
    id: "user-1",
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+2348012345678",
    role: "user",
    isSuspended: false,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "user-2",
    fullName: "Jane Smith",
    email: "jane@example.com",
    phone: "+2348087654321",
    role: "admin",
    isSuspended: false,
    createdAt: new Date("2024-01-02"),
  },
];

export const mockTransactions = [
  {
    id: "txn-1",
    userId: "user-1",
    type: "credit",
    status: "completed",
    amount: 100000, // ₦1000 in kobo
    provider: "paystack",
    reference: "paystack_ref_123",
    description: "Wallet funding",
    createdAt: new Date("2024-01-01"),
  },
];
```

#### Database Test Utilities

```typescript
// tests/utils/database.ts
import { db } from "@/db/client";
import { users, wallets, walletTransactions } from "@/db/schema";

export async function cleanDatabase() {
  await db.delete(walletTransactions);
  await db.delete(wallets);
  await db.delete(users);
}

export async function seedTestData() {
  const testUser = await db
    .insert(users)
    .values({
      id: "test-user-1",
      fullName: "Test User",
      email: "test@example.com",
      phone: "+2348012345678",
      passwordHash: await hashPassword("TestPassword123!"),
      role: "user",
    })
    .returning();

  await db.insert(wallets).values({
    id: "wallet-1",
    userId: testUser[0].id,
    balance: 500000, // ₦5000 in kobo
  });

  return testUser[0];
}
```

---

## Deployment Guide

### Production Environment Setup

#### Environment Variables Checklist

```bash
# Required Production Variables
DATABASE_URL="postgresql://user:password@host:5432/database"
AUTH_SECRET="strong-random-secret-64-characters-minimum"
ENCRYPTION_KEY="base64-encoded-32-byte-encryption-key"

# Payment Processing
PAYSTACK_PUBLIC_KEY="pk_live_..."
PAYSTACK_SECRET_KEY="sk_live_..."

# NIN Verification
YOUVERIFY_TOKEN="live-api-token"
YOUVERIFY_BASE_URL="https://api.youverify.co"

# Application Settings
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Security & Monitoring
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
ENABLE_RATE_LIMITING="true"
ENABLE_AUDIT_LOGGING="true"

# Optional: Redis for rate limiting (recommended)
REDIS_URL="redis://user:password@host:6379"
```

#### Security Configuration

```bash
# Generate secure secrets
openssl rand -base64 64  # For AUTH_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY

# Verify environment variables
node -e "
  const required = ['DATABASE_URL', 'AUTH_SECRET', 'PAYSTACK_SECRET_KEY', 'YOUVERIFY_TOKEN'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }
  console.log('All required environment variables are set');
"
```

### Deployment Platforms

#### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables via CLI
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel env add PAYSTACK_SECRET_KEY production
vercel env add YOUVERIFY_TOKEN production
```

**Vercel Configuration:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - AUTH_SECRET=${AUTH_SECRET}
      - PAYSTACK_SECRET_KEY=${PAYSTACK_SECRET_KEY}
      - YOUVERIFY_TOKEN=${YOUVERIFY_TOKEN}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: verifynin
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Manual Server Deployment

```bash
# On production server
git clone https://github.com/yourusername/verifynin.git
cd verifynin

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Install PM2 for process management
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'verifynin',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Database Migration & Setup

#### Production Database Migration

```bash
# Run migrations
npm run db:migrate

# Verify migration status
npm run db:status

# Create initial super admin
npm run admin:create
```

#### Database Backup Strategy

```bash
# Automated backup script
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="verifynin"

# Create backup
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/backup_${DB_NAME}_${DATE}.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_${DB_NAME}_*.sql.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/backup_${DB_NAME}_${DATE}.sql.gz s3://your-backup-bucket/
```

```bash
# Crontab entry for daily backups
0 2 * * * /path/to/backup-db.sh
```

### Monitoring & Logging

#### Application Monitoring

```typescript
// lib/monitoring.ts
import * as Sentry from "@sentry/nextjs";

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.nin;
    }
    return event;
  },
});

// Custom monitoring
export function trackEvent(event: string, properties?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: event,
    data: properties,
    level: "info",
  });
}

export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    Sentry.captureException(error);
  });
}
```

#### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db-health";
import { checkExternalServices } from "@/lib/service-health";

export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabaseHealth(),
    checkExternalServices(),
  ]);

  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: checks[0].status === "fulfilled" && checks[0].value,
      external: checks[1].status === "fulfilled" && checks[1].value,
    },
  };

  const allHealthy = Object.values(health.services).every(Boolean);
  health.status = allHealthy ? "healthy" : "degraded";

  return NextResponse.json(health, {
    status: allHealthy ? 200 : 503,
  });
}
```

#### Log Management

```typescript
// lib/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "verifynin" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

export default logger;
```

### Performance Optimization

#### Next.js Configuration

```javascript
// next.config.js
const nextConfig = {
  // Enable compression
  compress: true,

  // Optimize images
  images: {
    domains: ["yourdomain.com"],
    formats: ["image/webp", "image/avif"],
  },

  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE === "true") {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "server",
          openAnalyzer: true,
        }),
      );
    }
    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/admin-panel",
        destination: "/admin",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

#### Database Optimization

```sql
-- Production database indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY idx_transactions_user_date ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_transactions_status ON wallet_transactions(status);
CREATE INDEX CONCURRENTLY idx_verifications_user_date ON nin_verifications(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX CONCURRENTLY idx_support_tickets_status ON support_tickets(status, created_at DESC);

-- Analyze tables for query optimization
ANALYZE users;
ANALYZE wallet_transactions;
ANALYZE nin_verifications;
ANALYZE audit_logs;
ANALYZE support_tickets;
```

### SSL/TLS Configuration

#### Let's Encrypt with Nginx

```nginx
# /etc/nginx/sites-available/verifynin
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Post-Deployment Checklist

#### Verification Steps

```bash
# 1. Health check
curl https://yourdomain.com/api/health

# 2. Authentication test
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"your-password"}'

# 3. Database connectivity
npm run db:studio

# 4. External services
curl -H "token: $YOUVERIFY_TOKEN" https://api.youverify.co/health
curl -H "Authorization: Bearer $PAYSTACK_SECRET_KEY" https://api.paystack.co/bank

# 5. SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# 6. Performance test
lighthouse https://yourdomain.com --output=html --output-path=./lighthouse-report.html
```

#### Monitoring Setup

```bash
# Set up uptime monitoring
curl -X POST "https://api.uptimerobot.com/v2/newMonitor" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=YOUR_API_KEY&format=json&type=1&url=https://yourdomain.com/api/health&friendly_name=VerifyNIN Health"

# Set up error alerting
# Configure Sentry alerts for error rate thresholds
# Set up database monitoring alerts
# Configure payment webhook failure alerts
```

### Rollback Strategy

#### Quick Rollback Procedure

```bash
# 1. Identify last known good deployment
vercel ls --scope=your-team

# 2. Rollback to previous deployment
vercel rollback https://verifynin-abc123.vercel.app --scope=your-team

# 3. Verify rollback
curl https://yourdomain.com/api/health

# 4. Database rollback (if needed)
# Restore from backup
pg_restore -d $DATABASE_URL /path/to/backup.sql

# 5. Clear CDN cache (if applicable)
# Cloudflare, AWS CloudFront, etc.
```

#### Emergency Procedures

```bash
# Enable maintenance mode
export MAINTENANCE_MODE=true
vercel env add MAINTENANCE_MODE true production

# Redeploy with maintenance mode
vercel --prod

# Disable maintenance mode after fix
vercel env rm MAINTENANCE_MODE production
vercel --prod
```

---

## Development Workflows

### Git Workflow

#### Branch Strategy

```bash
# Main branches
main                    # Production-ready code
develop                 # Integration branch for features

# Feature branches
feature/user-auth       # New features
feature/payment-system  # Major features
feature/admin-panel     # Feature development

# Release branches
release/v1.0.0         # Prepare for release
release/v1.1.0         # Version releases

# Hotfix branches
hotfix/security-patch   # Critical fixes
hotfix/payment-bug      # Production issues
```

#### Commit Convention

```bash
# Format: type(scope): description

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting, missing semicolons, etc.
refactor: # Code change that neither fixes a bug nor adds a feature
test:     # Adding missing tests
chore:    # Updating grunt tasks etc; no production code change

# Examples
feat(auth): add two-factor authentication
fix(payment): resolve webhook signature validation
docs(api): update endpoint documentation
refactor(ui): improve component structure
test(admin): add user management tests
chore(deps): update dependencies to latest versions
```

#### Pull Request Process

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat(feature): implement new functionality"

# 3. Push to remote
git push origin feature/new-feature

# 4. Create pull request with template
# - Description of changes
# - Testing performed
# - Screenshots (if UI changes)
# - Breaking changes (if any)

# 5. Code review process
# - Automated checks (CI/CD)
# - Peer review
# - Security review (if needed)

# 6. Merge after approval
git checkout main
git pull origin main
git merge --no-ff feature/new-feature
git push origin main
```

### Code Quality Automation

#### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# 1. Code formatting
echo "📝 Checking code formatting..."
npm run format:check
if [ $? -ne 0 ]; then
  echo "❌ Code formatting issues found. Run 'npm run format' to fix."
  exit 1
fi

# 2. Linting
echo "🔍 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting errors found. Please fix before committing."
  exit 1
fi

# 3. Type checking
echo "🔧 Running TypeScript type check..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Please fix before committing."
  exit 1
fi

# 4. Security linting
echo "🔒 Running security checks..."
npm run lint:security
if [ $? -ne 0 ]; then
  echo "❌ Security issues found. Please review and fix."
  exit 1
fi

# 5. Unit tests
echo "🧪 Running unit tests..."
npm run test:unit
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed. Please fix before committing."
  exit 1
fi

echo "✅ All pre-commit checks passed!"
```

#### CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run security tests
        run: npm run test:security

      - name: Run unit tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run security audit
        run: npm audit --audit-level=moderate

      - name: Run dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: "verifynin"
          path: "."
          format: "ALL"

  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

### Development Scripts

#### Utility Scripts

```typescript
// scripts/dev-setup.ts
import { execSync } from "child_process";
import fs from "fs";

async function setupDevelopment() {
  console.log("🚀 Setting up development environment...");

  // Check Node.js version
  const nodeVersion = process.version;
  const requiredVersion = "18.0.0";
  if (nodeVersion < `v${requiredVersion}`) {
    throw new Error(`Node.js ${requiredVersion} or higher is required`);
  }

  // Check if .env exists
  if (!fs.existsSync(".env")) {
    console.log("📝 Creating .env file from template...");
    fs.copyFileSync(".env.example", ".env");
    console.log("⚠️  Please update .env with your credentials");
  }

  // Install dependencies
  console.log("📦 Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });

  // Setup database
  console.log("🗄️  Setting up database...");
  execSync("npm run db:push", { stdio: "inherit" });

  // Run initial tests
  console.log("🧪 Running initial tests...");
  execSync("npm run test:unit", { stdio: "inherit" });

  console.log("✅ Development environment setup complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Update .env with your API credentials");
  console.log("2. Run 'npm run admin:create' to create admin user");
  console.log("3. Run 'npm run dev' to start development server");
}

setupDevelopment().catch(console.error);
```

```typescript
// scripts/validate-env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  PAYSTACK_SECRET_KEY: z.string().startsWith("sk_"),
  YOUVERIFY_TOKEN: z.string().min(10),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    console.log("✅ Environment variables are valid");
    return env;
  } catch (error) {
    console.error("❌ Environment validation failed:");
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

validateEnvironment();
```

#### Database Management Scripts

```typescript
// scripts/db-seed.ts
import { db } from "@/db/client";
import { users, wallets } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { nanoid } from "nanoid";

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  // Create test users
  const testUsers = [
    {
      id: nanoid(),
      fullName: "Test User",
      email: "user@example.com",
      phone: "+2348012345678",
      passwordHash: await hashPassword("TestPassword123!"),
      role: "user" as const,
    },
    {
      id: nanoid(),
      fullName: "Admin User",
      email: "admin@example.com",
      phone: "+2348087654321",
      passwordHash: await hashPassword("AdminPassword123!"),
      role: "admin" as const,
    },
  ];

  const createdUsers = await db.insert(users).values(testUsers).returning();

  // Create wallets for users
  const wallets_data = createdUsers.map((user) => ({
    id: nanoid(),
    userId: user.id,
    balance: user.role === "user" ? 500000 : 1000000, // ₦5000 or ₦10000
  }));

  await db.insert(wallets).values(wallets_data);

  console.log("✅ Database seeded successfully");
  console.log("👤 Test user: user@example.com / TestPassword123!");
  console.log("👨‍💼 Admin user: admin@example.com / AdminPassword123!");
}

seedDatabase().catch(console.error);
```

### Code Generation

#### Component Generator

```typescript
// scripts/generate-component.ts
import fs from "fs";
import path from "path";

interface ComponentOptions {
  name: string;
  type: "atom" | "molecule" | "organism";
  withTest?: boolean;
  withStory?: boolean;
}

function generateComponent(options: ComponentOptions) {
  const { name, type, withTest = true, withStory = false } = options;

  const componentDir = path.join("components", `${type}s`, name);
  const componentFile = path.join(componentDir, `${name}.tsx`);

  // Create directory
  fs.mkdirSync(componentDir, { recursive: true });

  // Component template
  const componentTemplate = `import { cn } from "@/lib/utils";

interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
}

export function ${name}({ className, children }: ${name}Props) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}
`;

  // Test template
  const testTemplate = `import { render, screen } from "@testing-library/react";
import { ${name} } from "./${name}";

describe("${name}", () => {
  it("renders correctly", () => {
    render(<${name}>Test content</${name}>);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });
});
`;

  // Write files
  fs.writeFileSync(componentFile, componentTemplate);

  if (withTest) {
    fs.writeFileSync(path.join(componentDir, `${name}.test.tsx`), testTemplate);
  }

  console.log(`✅ Generated ${type} component: ${name}`);
}

// Usage: npm run generate:component -- --name=MyComponent --type=molecule
const args = process.argv.slice(2);
const name = args.find((arg) => arg.startsWith("--name="))?.split("=")[1];
const type = args
  .find((arg) => arg.startsWith("--type="))
  ?.split("=")[1] as ComponentOptions["type"];

if (!name || !type) {
  console.error(
    "Usage: npm run generate:component -- --name=ComponentName --type=atom|molecule|organism",
  );
  process.exit(1);
}

generateComponent({ name, type });
```

---
