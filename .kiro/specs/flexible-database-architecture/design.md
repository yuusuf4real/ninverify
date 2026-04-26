# Design Document: Flexible Database Architecture

## Overview

### Purpose

This design document specifies the architecture for a provider-agnostic PostgreSQL database client that resolves the current production issues with Next.js 15 compatibility. The current implementation uses `@neondatabase/serverless` with HTTP-based connections (`drizzle-orm/neon-http`), which causes "Connection closed" errors and blank pages in production on Vercel.

The new architecture will:
- Use standard PostgreSQL drivers with TCP connections instead of HTTP
- Implement proper connection pooling optimized for serverless environments
- Support seamless switching between PostgreSQL providers (Neon, Supabase, Railway, AWS RDS, etc.)
- Maintain full compatibility with existing Drizzle ORM schemas
- Resolve Next.js 15 compatibility issues

### Problem Statement

**Current Issues:**
1. **Production Failures**: The site is down with blank pages due to "Connection closed" errors
2. **Driver Incompatibility**: `@neondatabase/serverless` with `drizzle-orm/neon-http` has compatibility issues with Next.js 15
3. **Vendor Lock-in**: Current implementation is tightly coupled to Neon's HTTP driver
4. **No Connection Pooling**: Lack of proper connection pooling causes resource exhaustion
5. **Serverless Constraints**: Current approach doesn't handle Vercel's serverless environment properly

**Root Cause Analysis:**
- HTTP-based database drivers don't align with Next.js 15's request lifecycle
- Missing connection pooling leads to connection exhaustion under load
- Neon-specific driver prevents migration to other PostgreSQL providers
- Serverless environment requires special connection management strategies

### Goals

1. **Immediate**: Fix production issues and restore site functionality
2. **Short-term**: Implement robust connection pooling for serverless
3. **Long-term**: Enable provider flexibility and operational resilience

### Non-Goals

- Rewriting existing Drizzle ORM queries or schemas
- Changing database schema or data models
- Implementing database-level features (replication, sharding, etc.)
- Building a custom ORM or query builder

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Next.js 15 Application"
        API[API Routes]
        SC[Server Components]
        SA[Server Actions]
    end
    
    subgraph "Database Layer"
        DC[Database Client]
        PA[Provider Adapter]
        CP[Connection Pool]
        DRZ[Drizzle ORM]
    end
    
    subgraph "PostgreSQL Providers"
        NEON[Neon]
        SUPA[Supabase]
        RAIL[Railway]
        RDS[AWS RDS]
        LOCAL[Local PostgreSQL]
    end
    
    API --> DC
    SC --> DC
    SA --> DC
    
    DC --> PA
    PA --> CP
    CP --> DRZ
    
    DRZ -.-> NEON
    DRZ -.-> SUPA
    DRZ -.-> RAIL
    DRZ -.-> RDS
    DRZ -.-> LOCAL
    
    style DC fill:#4CAF50
    style PA fill:#2196F3
    style CP fill:#FF9800
    style DRZ fill:#9C27B0
```

### Architecture Principles

1. **Provider Agnosticism**: Use standard PostgreSQL protocol, not provider-specific APIs
2. **Connection Efficiency**: Pool and reuse connections to minimize overhead
3. **Serverless Optimization**: Design for short-lived execution contexts
4. **Graceful Degradation**: Handle connection failures without crashing
5. **Zero Query Changes**: Maintain existing Drizzle ORM API surface

### Technology Stack

**Core Dependencies:**
- `pg` (node-postgres) v8.x - Standard PostgreSQL driver with TCP connections
- `drizzle-orm` v0.36.4 - Existing ORM (no changes)
- `@types/pg` - TypeScript definitions

**Why `pg` over alternatives:**
- Industry standard with 10+ years of production use
- Native TCP connections (not HTTP)
- Built-in connection pooling
- Works with all PostgreSQL providers
- Excellent Next.js 15 compatibility
- Active maintenance and security updates

**Removed Dependencies:**
- `@neondatabase/serverless` - Replaced by standard `pg` driver
- `drizzle-orm/neon-http` - Replaced by `drizzle-orm/node-postgres`

## Components and Interfaces

### Component Diagram

```mermaid
graph LR
    subgraph "db/client.ts"
        DC[Database Client Module]
        CP[Connection Pool]
        HC[Health Check]
        SC[Shutdown Handler]
    end
    
    subgraph "db/config.ts"
        ENV[Environment Config]
        POOL[Pool Config]
        SSL[SSL Config]
    end
    
    subgraph "db/provider-adapter.ts"
        PA[Provider Adapter]
        PD[Provider Detection]
        PO[Provider Optimization]
    end
    
    ENV --> DC
    POOL --> CP
    SSL --> CP
    PA --> DC
    PD --> PA
    PO --> PA
    
    DC --> DRZ[Drizzle Instance]
    HC --> CP
    SC --> CP
```

### 1. Database Client Module (`db/client.ts`)

**Responsibilities:**
- Initialize PostgreSQL connection pool
- Export Drizzle ORM instance
- Provide health check functionality
- Handle graceful shutdown
- Maintain backward compatibility with existing imports

**Public API:**
```typescript
// Primary export - Drizzle instance
export const db: DrizzleDB;

// Health check
export function checkDatabaseHealth(): Promise<HealthStatus>;

// Graceful shutdown
export function closeDatabaseConnections(): Promise<void>;

// Runtime configuration check
export function ensureDatabaseConfigured(): void;

// Connection pool metrics
export function getPoolMetrics(): PoolMetrics;
```

**Implementation Strategy:**
- Use singleton pattern for connection pool
- Lazy initialization on first query
- Register shutdown handlers for cleanup
- Maintain compatibility with both `schema.ts` and `new-schema.ts`

### 2. Configuration Module (`db/config.ts`)

**Responsibilities:**
- Parse environment variables
- Provide connection pool configuration
- Detect and configure SSL settings
- Validate configuration at runtime

**Configuration Interface:**
```typescript
interface DatabaseConfig {
  connectionString: string;
  pool: PoolConfig;
  ssl: SSLConfig;
  provider: ProviderType;
}

interface PoolConfig {
  min: number;           // Minimum connections (default: 0 for serverless)
  max: number;           // Maximum connections (default: 10)
  idleTimeoutMillis: number;  // Close idle connections (default: 30000)
  connectionTimeoutMillis: number;  // Connection timeout (default: 10000)
  allowExitOnIdle: boolean;  // Allow process exit when idle (default: true for serverless)
}

interface SSLConfig {
  rejectUnauthorized: boolean;
  ca?: string;
  mode: 'require' | 'prefer' | 'disable';
}
```

**Environment Variables:**
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Optional - Connection Pool
DB_POOL_MIN=0
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=10000

# Optional - SSL
DB_SSL_MODE=require  # require | prefer | disable
DB_SSL_REJECT_UNAUTHORIZED=true

# Optional - Provider Optimization
DB_PROVIDER=auto  # auto | neon | supabase | railway | rds | local
```

### 3. Provider Adapter Module (`db/provider-adapter.ts`)

**Responsibilities:**
- Detect PostgreSQL provider from connection string
- Apply provider-specific optimizations
- Configure connection parameters per provider

**Provider Detection Logic:**
```typescript
type ProviderType = 'neon' | 'supabase' | 'railway' | 'rds' | 'local' | 'unknown';

function detectProvider(connectionString: string): ProviderType {
  if (connectionString.includes('neon.tech')) return 'neon';
  if (connectionString.includes('supabase.co')) return 'supabase';
  if (connectionString.includes('railway.app')) return 'railway';
  if (connectionString.includes('rds.amazonaws.com')) return 'rds';
  if (connectionString.includes('localhost') || connectionString.includes('127.0.0.1')) {
    return 'local';
  }
  return 'unknown';
}
```

**Provider-Specific Optimizations:**

| Provider | Optimization | Configuration |
|----------|-------------|---------------|
| Neon | Use connection pooler endpoint | Append `?sslmode=require` |
| Supabase | Use connection pooler (port 6543) | Enable SSL, set `statement_timeout` |
| Railway | Standard TCP connection | Enable SSL |
| AWS RDS | Use RDS Proxy if available | Enable SSL, configure IAM auth if needed |
| Local | Disable SSL for development | Relaxed timeouts |

### 4. Health Check Module

**Responsibilities:**
- Verify database connectivity
- Check connection pool status
- Provide metrics for monitoring

**Health Check Interface:**
```typescript
interface HealthStatus {
  healthy: boolean;
  latencyMs: number;
  pool: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  };
  error?: string;
}

async function checkDatabaseHealth(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return {
      healthy: true,
      latencyMs: Date.now() - start,
      pool: getPoolMetrics(),
    };
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      pool: getPoolMetrics(),
      error: error.message,
    };
  }
}
```

### 5. Shutdown Handler

**Responsibilities:**
- Close database connections gracefully
- Wait for in-flight queries to complete
- Prevent new connections during shutdown

**Implementation:**
```typescript
let isShuttingDown = false;

async function closeDatabaseConnections(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('[DB] Closing database connections...');
  
  try {
    await pool.end();
    console.log('[DB] All connections closed successfully');
  } catch (error) {
    console.error('[DB] Error closing connections:', error);
    throw error;
  }
}

// Register shutdown handlers
if (typeof process !== 'undefined') {
  process.on('SIGTERM', closeDatabaseConnections);
  process.on('SIGINT', closeDatabaseConnections);
  process.on('beforeExit', closeDatabaseConnections);
}
```

## Data Models

### No Schema Changes Required

This refactoring is purely at the database client layer. All existing Drizzle ORM schemas remain unchanged:

**Existing Schemas:**
- `db/schema.ts` - Legacy schema with users, wallets, transactions, verifications, audit logs, support tickets
- `db/new-schema.ts` - Session-based verification schema with OTP sessions, verification sessions, results

**Schema Compatibility:**
```typescript
// Both schemas work with the new client
import * as schema from "./schema";
import * as newSchema from "./new-schema";

export const db = drizzle(pool, {
  schema: { ...schema, ...newSchema },
});
```

### Connection Pool State Model

The connection pool maintains internal state that affects application behavior:

```mermaid
stateDiagram-v2
    [*] --> Uninitialized
    Uninitialized --> Connecting: First Query
    Connecting --> Connected: Success
    Connecting --> Error: Failure
    Connected --> Querying: Execute Query
    Querying --> Connected: Query Complete
    Connected --> Idle: No Activity
    Idle --> Connected: New Query
    Idle --> Closed: Timeout
    Connected --> Closing: Shutdown Signal
    Closing --> Closed: All Queries Complete
    Error --> Connecting: Retry
    Closed --> [*]
```

**State Transitions:**
1. **Uninitialized → Connecting**: First database query triggers connection
2. **Connecting → Connected**: Successful connection established
3. **Connecting → Error**: Connection failed (retry with backoff)
4. **Connected → Querying**: Query execution in progress
5. **Querying → Connected**: Query completed successfully
6. **Connected → Idle**: No queries for `idleTimeoutMillis`
7. **Idle → Closed**: Idle connection closed to free resources
8. **Connected → Closing**: Shutdown signal received
9. **Closing → Closed**: All in-flight queries completed

## Error Handling

### Error Categories

#### 1. Connection Errors

**Scenarios:**
- Database server unreachable
- Invalid credentials
- Network timeout
- SSL/TLS handshake failure

**Handling Strategy:**
```typescript
class DatabaseConnectionError extends Error {
  constructor(
    message: string,
    public readonly cause: Error,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

// Retry logic with exponential backoff
async function connectWithRetry(maxRetries = 3): Promise<Pool> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createPool();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await sleep(delayMs);
      }
    }
  }
  
  throw new DatabaseConnectionError(
    `Failed to connect after ${maxRetries} attempts`,
    lastError
  );
}
```

#### 2. Query Errors

**Scenarios:**
- SQL syntax errors
- Constraint violations
- Type mismatches
- Query timeout

**Handling Strategy:**
```typescript
class DatabaseQueryError extends Error {
  constructor(
    message: string,
    public readonly query: string,
    public readonly cause: Error
  ) {
    super(message);
    this.name = 'DatabaseQueryError';
  }
}

// Wrap Drizzle queries with error context
function wrapQuery<T>(queryFn: () => Promise<T>, context: string): Promise<T> {
  return queryFn().catch((error) => {
    throw new DatabaseQueryError(
      `Query failed: ${context}`,
      context,
      error
    );
  });
}
```

#### 3. Pool Exhaustion Errors

**Scenarios:**
- All connections in use
- Connection acquisition timeout
- Too many concurrent requests

**Handling Strategy:**
```typescript
class PoolExhaustedError extends Error {
  constructor(
    public readonly poolSize: number,
    public readonly waitingCount: number
  ) {
    super(
      `Connection pool exhausted: ${poolSize} connections in use, ${waitingCount} requests waiting`
    );
    this.name = 'PoolExhaustedError';
  }
}

// Monitor pool metrics and emit warnings
function monitorPoolHealth() {
  const metrics = getPoolMetrics();
  
  if (metrics.waiting > 5) {
    console.warn('[DB] High connection wait queue:', metrics);
  }
  
  if (metrics.active >= metrics.total * 0.9) {
    console.warn('[DB] Connection pool near capacity:', metrics);
  }
}
```

#### 4. Configuration Errors

**Scenarios:**
- Missing DATABASE_URL
- Invalid connection string format
- Incompatible SSL configuration

**Handling Strategy:**
```typescript
class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConfigError';
  }
}

function validateConfig(config: DatabaseConfig): void {
  if (!config.connectionString) {
    throw new DatabaseConfigError(
      'DATABASE_URL environment variable is required'
    );
  }
  
  try {
    new URL(config.connectionString);
  } catch {
    throw new DatabaseConfigError(
      'DATABASE_URL must be a valid PostgreSQL connection string'
    );
  }
  
  if (config.pool.max < config.pool.min) {
    throw new DatabaseConfigError(
      'DB_POOL_MAX must be greater than or equal to DB_POOL_MIN'
    );
  }
}
```

### Error Logging Strategy

**Log Levels:**
- **ERROR**: Connection failures, query errors, pool exhaustion
- **WARN**: High pool usage, slow queries, retry attempts
- **INFO**: Connection established, pool metrics, shutdown progress
- **DEBUG**: Individual query execution, connection lifecycle

**Sensitive Data Protection:**
```typescript
function sanitizeConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.password = '***';
    return parsed.toString();
  } catch {
    return '[invalid connection string]';
  }
}

function logError(error: Error, context: Record<string, any> = {}) {
  const sanitized = {
    ...context,
    connectionString: context.connectionString 
      ? sanitizeConnectionString(context.connectionString)
      : undefined,
  };
  
  console.error('[DB Error]', {
    name: error.name,
    message: error.message,
    ...sanitized,
  });
}
```

### Error Recovery Strategies

| Error Type | Recovery Strategy | User Impact |
|------------|------------------|-------------|
| Connection Timeout | Retry with exponential backoff (3 attempts) | 2-10 second delay |
| Pool Exhausted | Queue request, wait for available connection | Request queued |
| Query Timeout | Fail fast, return error to client | Immediate error response |
| SSL Handshake Failure | Check SSL configuration, retry once | 1-2 second delay |
| Invalid Credentials | Fail immediately, no retry | Immediate error |
| Network Partition | Retry with backoff, circuit breaker after 5 failures | Service degradation |

## Testing Strategy

### Testing Approach

Since this is an infrastructure/configuration refactoring focused on database client setup and connection management, **property-based testing is NOT applicable**. The design involves:
- Infrastructure configuration (connection pooling, SSL setup)
- External service integration (PostgreSQL providers)
- Environment-specific behavior (serverless vs. local)
- Side-effect operations (connection management, shutdown handlers)

Instead, we will use:
1. **Unit tests** for configuration parsing and validation logic
2. **Integration tests** against real PostgreSQL instances
3. **End-to-end tests** on Vercel to verify Next.js 15 compatibility
4. **Load tests** to verify connection pool behavior under stress

### 1. Unit Tests

**Scope:** Pure functions and configuration logic

**Test Cases:**
```typescript
describe('Database Configuration', () => {
  describe('validateConfig', () => {
    it('should throw error when DATABASE_URL is missing', () => {
      expect(() => validateConfig({ connectionString: '' }))
        .toThrow(DatabaseConfigError);
    });
    
    it('should throw error when connection string is invalid', () => {
      expect(() => validateConfig({ connectionString: 'not-a-url' }))
        .toThrow(DatabaseConfigError);
    });
    
    it('should accept valid PostgreSQL connection string', () => {
      const config = {
        connectionString: 'postgresql://user:pass@localhost:5432/db'
      };
      expect(() => validateConfig(config)).not.toThrow();
    });
  });
  
  describe('detectProvider', () => {
    it('should detect Neon from connection string', () => {
      const url = 'postgresql://user@ep-xxx.neon.tech/db';
      expect(detectProvider(url)).toBe('neon');
    });
    
    it('should detect Supabase from connection string', () => {
      const url = 'postgresql://user@db.xxx.supabase.co:5432/db';
      expect(detectProvider(url)).toBe('supabase');
    });
    
    it('should detect local PostgreSQL', () => {
      const url = 'postgresql://user@localhost:5432/db';
      expect(detectProvider(url)).toBe('local');
    });
  });
  
  describe('sanitizeConnectionString', () => {
    it('should mask password in connection string', () => {
      const url = 'postgresql://user:secret@host:5432/db';
      const sanitized = sanitizeConnectionString(url);
      expect(sanitized).not.toContain('secret');
      expect(sanitized).toContain('***');
    });
  });
});
```

### 2. Integration Tests

**Scope:** Real database connections and queries

**Test Environment:**
- Local PostgreSQL in Docker container
- Test database with known schema
- Isolated test data

**Test Cases:**
```typescript
describe('Database Client Integration', () => {
  beforeAll(async () => {
    // Start PostgreSQL container
    await startTestDatabase();
  });
  
  afterAll(async () => {
    await closeDatabaseConnections();
    await stopTestDatabase();
  });
  
  describe('Connection Management', () => {
    it('should establish connection on first query', async () => {
      const result = await db.execute(sql`SELECT 1 as value`);
      expect(result.rows[0].value).toBe(1);
    });
    
    it('should reuse connections from pool', async () => {
      const metrics1 = getPoolMetrics();
      await db.execute(sql`SELECT 1`);
      const metrics2 = getPoolMetrics();
      
      // Should not create new connection for second query
      expect(metrics2.total).toBe(metrics1.total);
    });
    
    it('should handle concurrent queries', async () => {
      const queries = Array(20).fill(null).map(() => 
        db.execute(sql`SELECT pg_sleep(0.1)`)
      );
      
      await expect(Promise.all(queries)).resolves.toBeDefined();
    });
  });
  
  describe('Schema Compatibility', () => {
    it('should work with legacy schema', async () => {
      const users = await db.select().from(schema.users).limit(1);
      expect(Array.isArray(users)).toBe(true);
    });
    
    it('should work with new schema', async () => {
      const sessions = await db.select().from(newSchema.otpSessions).limit(1);
      expect(Array.isArray(sessions)).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    it('should throw descriptive error for invalid query', async () => {
      await expect(
        db.execute(sql`SELECT * FROM nonexistent_table`)
      ).rejects.toThrow(DatabaseQueryError);
    });
    
    it('should recover from connection interruption', async () => {
      // Simulate connection drop
      await killAllConnections();
      
      // Should reconnect automatically
      const result = await db.execute(sql`SELECT 1`);
      expect(result).toBeDefined();
    });
  });
  
  describe('Health Check', () => {
    it('should return healthy status when connected', async () => {
      const health = await checkDatabaseHealth();
      expect(health.healthy).toBe(true);
      expect(health.latencyMs).toBeGreaterThan(0);
    });
    
    it('should return unhealthy status when disconnected', async () => {
      await closeDatabaseConnections();
      const health = await checkDatabaseHealth();
      expect(health.healthy).toBe(false);
      expect(health.error).toBeDefined();
    });
  });
});
```

### 3. Provider-Specific Integration Tests

**Scope:** Test against multiple PostgreSQL providers

**Test Matrix:**
| Provider | Test Environment | SSL | Connection Pooler |
|----------|-----------------|-----|-------------------|
| Neon | Neon free tier | Required | Yes |
| Supabase | Supabase free tier | Required | Yes (port 6543) |
| Railway | Railway trial | Required | No |
| Local | Docker container | Disabled | No |

**Test Cases:**
```typescript
describe.each([
  { provider: 'neon', url: process.env.NEON_DATABASE_URL },
  { provider: 'supabase', url: process.env.SUPABASE_DATABASE_URL },
  { provider: 'railway', url: process.env.RAILWAY_DATABASE_URL },
  { provider: 'local', url: 'postgresql://test:test@localhost:5432/test' },
])('Provider: $provider', ({ provider, url }) => {
  beforeAll(() => {
    process.env.DATABASE_URL = url;
  });
  
  it('should connect successfully', async () => {
    const result = await db.execute(sql`SELECT 1`);
    expect(result).toBeDefined();
  });
  
  it('should detect provider correctly', () => {
    const detected = detectProvider(url);
    expect(detected).toBe(provider);
  });
  
  it('should apply provider-specific optimizations', () => {
    const config = getProviderConfig(url);
    expect(config.provider).toBe(provider);
  });
});
```

### 4. Load and Stress Tests

**Scope:** Verify connection pool behavior under load

**Test Scenarios:**
```typescript
describe('Connection Pool Load Tests', () => {
  it('should handle burst of concurrent requests', async () => {
    const concurrency = 50;
    const queries = Array(concurrency).fill(null).map(() =>
      db.execute(sql`SELECT pg_sleep(0.1)`)
    );
    
    const start = Date.now();
    await Promise.all(queries);
    const duration = Date.now() - start;
    
    // With pool size 10, should take ~500ms (5 batches)
    expect(duration).toBeLessThan(1000);
  });
  
  it('should not exhaust connections under sustained load', async () => {
    const duration = 10000; // 10 seconds
    const requestsPerSecond = 20;
    
    const startTime = Date.now();
    const errors: Error[] = [];
    
    while (Date.now() - startTime < duration) {
      const batch = Array(requestsPerSecond).fill(null).map(() =>
        db.execute(sql`SELECT 1`).catch(e => errors.push(e))
      );
      await Promise.all(batch);
      await sleep(1000);
    }
    
    expect(errors.length).toBe(0);
  });
  
  it('should close idle connections', async () => {
    // Create connections
    await Promise.all(
      Array(10).fill(null).map(() => db.execute(sql`SELECT 1`))
    );
    
    const metrics1 = getPoolMetrics();
    expect(metrics1.idle).toBeGreaterThan(0);
    
    // Wait for idle timeout
    await sleep(35000); // idleTimeoutMillis + buffer
    
    const metrics2 = getPoolMetrics();
    expect(metrics2.idle).toBeLessThan(metrics1.idle);
  });
});
```

### 5. Next.js 15 Compatibility Tests

**Scope:** Verify behavior in Next.js 15 runtime

**Test Cases:**
```typescript
describe('Next.js 15 Compatibility', () => {
  describe('API Routes', () => {
    it('should handle database queries in API route', async () => {
      const response = await fetch('http://localhost:3000/api/test-db');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
    
    it('should handle concurrent API requests', async () => {
      const requests = Array(20).fill(null).map(() =>
        fetch('http://localhost:3000/api/test-db')
      );
      const responses = await Promise.all(requests);
      expect(responses.every(r => r.status === 200)).toBe(true);
    });
  });
  
  describe('Server Components', () => {
    it('should fetch data in server component', async () => {
      const response = await fetch('http://localhost:3000/test-page');
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('Database connection successful');
    });
  });
  
  describe('Server Actions', () => {
    it('should execute database mutations in server action', async () => {
      // Test server action that writes to database
      const formData = new FormData();
      formData.append('action', 'test');
      
      const response = await fetch('http://localhost:3000/test-action', {
        method: 'POST',
        body: formData,
      });
      
      expect(response.status).toBe(200);
    });
  });
});
```

### 6. Vercel Deployment Tests

**Scope:** End-to-end tests on Vercel serverless environment

**Test Strategy:**
1. Deploy to Vercel preview environment
2. Run automated tests against preview URL
3. Monitor for "Connection closed" errors
4. Verify no blank pages
5. Check connection pool metrics

**Test Cases:**
```typescript
describe('Vercel Production Tests', () => {
  const baseUrl = process.env.VERCEL_URL || 'https://preview.vercel.app';
  
  it('should not produce blank pages', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();
    expect(html.length).toBeGreaterThan(100);
    expect(html).not.toContain('Connection closed');
  });
  
  it('should handle cold starts', async () => {
    // Wait for function to go cold
    await sleep(60000);
    
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
  });
  
  it('should handle sustained traffic', async () => {
    const duration = 60000; // 1 minute
    const requestsPerSecond = 10;
    const errors: Error[] = [];
    
    const startTime = Date.now();
    while (Date.now() - startTime < duration) {
      const batch = Array(requestsPerSecond).fill(null).map(() =>
        fetch(`${baseUrl}/api/test-db`).catch(e => errors.push(e))
      );
      await Promise.all(batch);
      await sleep(1000);
    }
    
    expect(errors.length).toBe(0);
  });
});
```

### 7. Migration Testing

**Scope:** Verify safe migration from old to new client

**Test Strategy:**
1. Run both old and new clients side-by-side
2. Compare query results for consistency
3. Verify no data corruption
4. Test rollback procedure

**Test Cases:**
```typescript
describe('Migration Safety', () => {
  it('should produce identical results with old and new client', async () => {
    const oldResult = await oldDb.select().from(schema.users).limit(10);
    const newResult = await newDb.select().from(schema.users).limit(10);
    
    expect(newResult).toEqual(oldResult);
  });
  
  it('should handle transactions consistently', async () => {
    await newDb.transaction(async (tx) => {
      await tx.insert(schema.users).values(testUser);
      const inserted = await tx.select().from(schema.users)
        .where(eq(schema.users.id, testUser.id));
      expect(inserted[0]).toMatchObject(testUser);
    });
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 90%+ coverage of configuration and utility functions
- **Integration Tests**: 100% coverage of public API surface
- **Provider Tests**: All 4 providers (Neon, Supabase, Railway, Local)
- **Load Tests**: Sustained 200 req/s for 10 minutes without errors
- **E2E Tests**: Zero "Connection closed" errors in 1000 requests

### Continuous Integration

**CI Pipeline:**
```yaml
name: Database Client Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
  
  provider-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        provider: [neon, supabase, railway]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:provider:${{ matrix.provider }}
        env:
          DATABASE_URL: ${{ secrets[format('{0}_DATABASE_URL', matrix.provider)] }}
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Summary

This design provides a comprehensive solution for the flexible database architecture that:

1. **Fixes Production Issues**: Replaces HTTP-based Neon driver with standard `pg` driver to resolve Next.js 15 compatibility
2. **Enables Provider Flexibility**: Works with any PostgreSQL provider through standard connection strings
3. **Optimizes for Serverless**: Implements proper connection pooling with serverless-friendly configuration
4. **Maintains Compatibility**: Zero changes required to existing Drizzle ORM queries or schemas
5. **Ensures Reliability**: Comprehensive error handling, health checks, and graceful shutdown
6. **Supports Operations**: Monitoring, logging, and diagnostics for production troubleshooting

The implementation will be thoroughly tested across multiple dimensions (unit, integration, load, E2E) and multiple providers to ensure production readiness.
