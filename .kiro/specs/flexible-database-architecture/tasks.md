# Implementation Plan: Flexible Database Architecture

## Overview

This implementation plan refactors the database client to fix production "Connection closed" errors and enable provider flexibility. The approach replaces the HTTP-based `@neondatabase/serverless` driver with the standard `pg` (node-postgres) driver, implements proper connection pooling for serverless environments, and maintains full backward compatibility with existing Drizzle ORM schemas.

**Key Objectives:**
- Fix production blank pages and connection errors (immediate priority)
- Replace Neon HTTP driver with standard PostgreSQL TCP driver
- Implement serverless-optimized connection pooling
- Support multiple PostgreSQL providers (Neon, Supabase, Railway, AWS RDS, local)
- Maintain zero changes to existing query code

## Tasks

- [ ] 1. Install dependencies and remove deprecated packages
  - Install `pg` (node-postgres) and `@types/pg` packages
  - Update `drizzle-orm` to use `drizzle-orm/node-postgres` adapter
  - Remove `@neondatabase/serverless` package
  - Update package.json scripts if needed
  - _Requirements: 1.2, 1.3_

- [ ] 2. Create database configuration module
  - [ ] 2.1 Create `db/config.ts` with configuration interfaces and parsing logic
    - Define `DatabaseConfig`, `PoolConfig`, and `SSLConfig` TypeScript interfaces
    - Implement `getDatabaseConfig()` function to parse environment variables
    - Add validation logic for connection string format
    - Set serverless-optimized defaults (min: 0, max: 10, idleTimeout: 30000, allowExitOnIdle: true)
    - Support optional environment variables: `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_POOL_IDLE_TIMEOUT`, `DB_SSL_MODE`
    - _Requirements: 4.1, 4.2, 4.3, 4.6_
  
  - [ ]* 2.2 Write unit tests for configuration parsing
    - Test valid and invalid connection strings
    - Test default values for optional parameters
    - Test SSL configuration parsing
    - Test pool configuration validation (max >= min)
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3. Create provider adapter module
  - [ ] 3.1 Create `db/provider-adapter.ts` with provider detection and optimization logic
    - Implement `detectProvider()` function to identify provider from connection string
    - Support detection for: Neon (neon.tech), Supabase (supabase.co), Railway (railway.app), AWS RDS (rds.amazonaws.com), local (localhost/127.0.0.1)
    - Implement `getProviderOptimizations()` to return provider-specific connection parameters
    - Add Neon-specific optimization: append `?sslmode=require` if not present
    - Add Supabase-specific optimization: ensure SSL enabled, set statement_timeout
    - Add local development optimization: disable SSL for localhost connections
    - _Requirements: 1.1, 1.5, 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 3.2 Write unit tests for provider detection
    - Test provider detection for each supported provider
    - Test provider-specific optimization application
    - Test handling of unknown providers
    - _Requirements: 1.5, 12.5_

- [ ] 4. Implement new database client with connection pooling
  - [ ] 4.1 Create new `db/client.ts` with pg-based connection pool
    - Import `pg` Pool class and configure with serverless-optimized settings
    - Create singleton connection pool instance with lazy initialization
    - Configure pool with settings from `db/config.ts`
    - Apply provider-specific optimizations from `db/provider-adapter.ts`
    - Initialize Drizzle ORM with `drizzle-orm/node-postgres` adapter
    - Export `db` instance compatible with existing schema imports (both `schema.ts` and `new-schema.ts`)
    - Maintain `ensureDatabaseConfigured()` function for runtime validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 4.1, 4.2, 5.1, 5.2, 5.3_
  
  - [ ] 4.2 Add connection pool metrics and monitoring
    - Implement `getPoolMetrics()` function to expose pool statistics (total, active, idle, waiting)
    - Add internal monitoring function to log warnings when pool usage exceeds thresholds
    - _Requirements: 2.6, 9.1, 9.4_
  
  - [ ] 4.3 Implement error handling with custom error classes
    - Create `DatabaseConnectionError` class with retry logic
    - Create `DatabaseQueryError` class with query context
    - Create `PoolExhaustedError` class with pool metrics
    - Create `DatabaseConfigError` class for configuration validation
    - Implement connection retry logic with exponential backoff (max 3 attempts)
    - Add error logging with sensitive data sanitization (mask passwords in connection strings)
    - _Requirements: 2.5, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 4.4 Write unit tests for error handling
    - Test custom error class instantiation and properties
    - Test connection string sanitization (password masking)
    - Test retry logic with exponential backoff
    - Test error logging without exposing credentials
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5. Implement health check functionality
  - [ ] 5.1 Add health check function to `db/client.ts`
    - Implement `checkDatabaseHealth()` function that executes `SELECT 1` query
    - Return `HealthStatus` object with: healthy boolean, latency, pool metrics, optional error
    - Measure query latency for monitoring
    - Handle connection failures gracefully and return unhealthy status
    - _Requirements: 9.3_
  
  - [ ]* 5.2 Write integration tests for health check
    - Test health check returns healthy status when connected
    - Test health check returns unhealthy status when disconnected
    - Test latency measurement accuracy
    - _Requirements: 9.3_

- [ ] 6. Implement graceful shutdown handling
  - [ ] 6.1 Add shutdown handler to `db/client.ts`
    - Implement `closeDatabaseConnections()` function to close pool gracefully
    - Register shutdown handlers for SIGTERM, SIGINT, and beforeExit events
    - Wait for in-flight queries to complete before closing (with configurable timeout)
    - Log shutdown progress and any errors during cleanup
    - Prevent new connections during shutdown with `isShuttingDown` flag
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 6.2 Write integration tests for graceful shutdown
    - Test connections close gracefully on shutdown signal
    - Test in-flight queries complete before shutdown
    - Test shutdown timeout behavior
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 7. Update environment configuration
  - [ ] 7.1 Update `.env.example` with new database configuration variables
    - Document `DATABASE_URL` as required variable with example PostgreSQL connection string
    - Add optional pool configuration variables: `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_POOL_IDLE_TIMEOUT`, `DB_POOL_CONNECTION_TIMEOUT`
    - Add optional SSL configuration: `DB_SSL_MODE`, `DB_SSL_REJECT_UNAUTHORIZED`
    - Add optional provider override: `DB_PROVIDER`
    - Include examples for each supported provider (Neon, Supabase, Railway, AWS RDS, local)
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 7.1, 7.3, 10.2_
  
  - [ ] 7.2 Verify production environment variables are set correctly
    - Ensure `DATABASE_URL` uses standard PostgreSQL connection string format
    - Verify SSL is enabled for production (`DB_SSL_MODE=require`)
    - Confirm connection pool settings are appropriate for Vercel serverless
    - _Requirements: 4.1, 4.2, 7.1, 7.4_

- [ ] 8. Checkpoint - Test database client in isolation
  - Run unit tests for configuration and provider adapter modules
  - Run integration tests against local PostgreSQL instance
  - Verify connection pool behavior (connection reuse, idle timeout, concurrent queries)
  - Verify health check functionality
  - Verify graceful shutdown behavior
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 10.1, 10.4_

- [ ] 9. Update Drizzle Kit migration configuration
  - [ ] 9.1 Update `drizzle.config.ts` to use new database client
    - Import connection configuration from `db/config.ts`
    - Configure Drizzle Kit to use `pg` driver instead of `neon-http`
    - Ensure migration commands work with new client
    - Test migration execution against local database
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 9.2 Write integration tests for migration system
    - Test migrations run successfully with new client
    - Test migration rollback functionality
    - Test migrations against multiple providers
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ] 10. Gradual migration of API routes
  - [ ] 10.1 Create test API route using new database client
    - Create `/api/test-db/route.ts` that uses new `db` client
    - Execute simple query to verify functionality
    - Test in local development environment
    - _Requirements: 3.1, 3.2, 5.3, 5.4_
  
  - [ ] 10.2 Migrate critical API routes first (OTP, payment, verification)
    - Update `app/api/v2/otp/send/route.ts` to use new client
    - Update `app/api/v2/otp/verify/route.ts` to use new client
    - Update `app/api/v2/payment/initialize/route.ts` to use new client
    - Update `app/api/v2/payment/verify/route.ts` to use new client
    - Update `app/api/v2/verification/submit/route.ts` to use new client
    - Verify each route works correctly after migration
    - _Requirements: 3.1, 3.2, 3.3, 5.3, 5.4_
  
  - [ ] 10.3 Migrate remaining API routes
    - Update all routes in `app/api/admin/` directory
    - Update all routes in `app/api/support/` directory
    - Update all routes in `app/api/paystack/` directory
    - Update any remaining routes using database client
    - _Requirements: 3.1, 3.2, 5.3, 5.4_
  
  - [ ]* 10.4 Write integration tests for migrated API routes
    - Test each API route returns expected responses
    - Test concurrent requests to API routes
    - Test error handling in API routes
    - _Requirements: 3.1, 3.2, 3.3, 8.1, 8.2_

- [ ] 11. Update server components and server actions
  - [ ] 11.1 Verify server components work with new client
    - Test data fetching in server components (admin dashboard, user pages)
    - Verify no "Connection closed" errors in server components
    - Test page rendering with database queries
    - _Requirements: 3.1, 3.3, 3.4_
  
  - [ ] 11.2 Verify server actions work with new client
    - Test database mutations in server actions
    - Verify transaction support in server actions
    - Test error handling in server actions
    - _Requirements: 3.1, 3.4, 5.5_
  
  - [ ]* 11.3 Write end-to-end tests for Next.js 15 compatibility
    - Test server components render correctly
    - Test server actions execute successfully
    - Test API routes handle requests correctly
    - Test no blank pages or connection errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 12. Checkpoint - Local testing complete
  - Run full test suite (unit, integration, E2E)
  - Verify all API routes work correctly
  - Verify server components and actions work correctly
  - Test connection pool behavior under load
  - Verify health check endpoint works
  - Verify graceful shutdown works
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 13. Deploy to Vercel preview environment
  - [ ] 13.1 Create preview deployment with new database client
    - Push changes to feature branch
    - Trigger Vercel preview deployment
    - Verify environment variables are set correctly in Vercel
    - Monitor deployment logs for errors
    - _Requirements: 3.5, 4.4_
  
  - [ ] 13.2 Test preview deployment thoroughly
    - Test all API routes in preview environment
    - Test server components and pages
    - Monitor for "Connection closed" errors
    - Verify no blank pages
    - Test under load (simulate concurrent users)
    - Check connection pool metrics
    - _Requirements: 3.5, 9.1, 9.2_
  
  - [ ]* 13.3 Run end-to-end tests against preview deployment
    - Execute automated E2E test suite against preview URL
    - Test cold start behavior (after function goes idle)
    - Test sustained traffic (10+ requests/second for 1 minute)
    - Verify zero connection errors in 1000+ requests
    - _Requirements: 3.5_

- [ ] 14. Monitor and validate preview deployment
  - [ ] 14.1 Monitor preview deployment for 24-48 hours
    - Check Vercel logs for any database errors
    - Monitor connection pool metrics
    - Track query latency and performance
    - Verify no "Connection closed" errors
    - Verify no blank pages reported
    - _Requirements: 3.5, 9.1, 9.2, 9.3_
  
  - [ ] 14.2 Perform load testing on preview
    - Simulate production traffic patterns
    - Test burst traffic scenarios
    - Verify connection pool handles load correctly
    - Monitor for connection exhaustion
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 15. Production deployment
  - [ ] 15.1 Prepare production deployment
    - Review all changes and test results
    - Verify production environment variables are correct
    - Create deployment checklist and rollback plan
    - Schedule deployment during low-traffic period
    - _Requirements: 4.1, 4.2, 7.1, 7.2, 7.4_
  
  - [ ] 15.2 Deploy to production
    - Merge feature branch to main
    - Trigger production deployment on Vercel
    - Monitor deployment progress
    - Verify deployment completes successfully
    - _Requirements: 3.5_
  
  - [ ] 15.3 Post-deployment validation
    - Test critical user flows (OTP, payment, verification)
    - Verify site is accessible (no blank pages)
    - Check for any "Connection closed" errors in logs
    - Monitor connection pool metrics
    - Verify health check endpoint responds correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.3_
  
  - [ ] 15.4 Monitor production for 48 hours
    - Continuously monitor Vercel logs for errors
    - Track connection pool metrics and query latency
    - Monitor user-reported issues
    - Verify site stability under production traffic
    - Be prepared to rollback if issues arise
    - _Requirements: 3.5, 9.1, 9.2, 9.3, 9.4_

- [ ] 16. Cleanup and documentation
  - [ ] 16.1 Remove old database client code
    - Remove any unused imports of `@neondatabase/serverless`
    - Remove any fallback code for old client
    - Clean up any temporary test files
    - _Requirements: 1.2_
  
  - [ ] 16.2 Update project documentation
    - Update README.md with new database setup instructions
    - Document environment variables in .env.example
    - Add troubleshooting guide for common database issues
    - Document provider-specific setup (Neon, Supabase, Railway, AWS RDS, local)
    - Document connection pool configuration best practices
    - _Requirements: 4.2, 10.2_
  
  - [ ] 16.3 Create runbook for operations team
    - Document how to monitor database connection health
    - Document how to interpret connection pool metrics
    - Document common error scenarios and resolutions
    - Document rollback procedure if needed
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.3_

- [ ] 17. Final checkpoint - Production validation complete
  - Verify production site is stable with no connection errors
  - Verify all critical user flows work correctly
  - Verify connection pool metrics are healthy
  - Verify monitoring and alerting are working
  - Confirm documentation is complete and accurate
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5_

## Notes

### Implementation Strategy

- **Immediate Priority**: Tasks 1-8 fix the production issues and establish the new database client
- **Gradual Migration**: Tasks 9-12 migrate existing code incrementally to minimize risk
- **Validation**: Tasks 13-15 thoroughly test in preview before production deployment
- **Completion**: Tasks 16-17 clean up and document the new architecture

### Testing Approach

This is an infrastructure refactoring focused on database client configuration and connection management. Property-based testing is not applicable. Instead:
- **Unit tests** validate configuration parsing and provider detection logic
- **Integration tests** verify database connectivity and query execution
- **End-to-end tests** validate Next.js 15 compatibility on Vercel
- **Load tests** verify connection pool behavior under stress

### Risk Mitigation

- **Backward Compatibility**: New client maintains same API surface as old client
- **Gradual Rollout**: Migrate one API route at a time, test thoroughly
- **Preview Testing**: Test in Vercel preview environment before production
- **Monitoring**: Extensive monitoring during and after deployment
- **Rollback Plan**: Can revert to old client if issues arise

### Provider Support

The new architecture supports:
- **Neon**: Standard PostgreSQL connection (not HTTP), with connection pooler
- **Supabase**: Connection pooler on port 6543, SSL required
- **Railway**: Standard PostgreSQL connection, SSL required
- **AWS RDS**: Standard PostgreSQL connection, optional RDS Proxy
- **Local**: PostgreSQL in Docker or native, SSL disabled for development

### Connection Pool Configuration

**Serverless Defaults** (Vercel):
- `min: 0` - No minimum connections (serverless-friendly)
- `max: 10` - Limit concurrent connections
- `idleTimeoutMillis: 30000` - Close idle connections after 30 seconds
- `allowExitOnIdle: true` - Allow process to exit when no connections

**Local Development**:
- `min: 2` - Keep some connections warm
- `max: 20` - Allow more concurrent connections
- `idleTimeoutMillis: 60000` - Keep connections longer

### Critical Success Criteria

1. ✅ Production site accessible (no blank pages)
2. ✅ Zero "Connection closed" errors in logs
3. ✅ All API routes respond correctly
4. ✅ Connection pool metrics healthy (no exhaustion)
5. ✅ Query latency within acceptable range (<100ms for simple queries)
6. ✅ Successful operation under production load for 48+ hours
