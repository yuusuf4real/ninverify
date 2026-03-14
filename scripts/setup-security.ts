#!/usr/bin/env tsx

/**
 * Security Setup Script
 * Applies comprehensive security measures to the codebase
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { logger } from '../lib/security/secure-logger';

async function setupSecurity() {
  logger.info('🔒 Starting comprehensive security setup...');

  try {
    // 1. Install security dependencies
    logger.info('📦 Installing security dependencies...');
    execSync('npm install --save-dev eslint-plugin-security eslint-plugin-no-secrets', { stdio: 'inherit' });

    // 2. Setup environment variables
    logger.info('🔑 Setting up environment variables...');
    setupEnvironmentVariables();

    // 3. Configure Git hooks
    logger.info('🪝 Setting up Git hooks...');
    setupGitHooks();

    // 4. Create security middleware
    logger.info('🛡️ Setting up security middleware...');
    setupSecurityMiddleware();

    // 5. Run security audit
    logger.info('🔍 Running security audit...');
    try {
      execSync('npm audit --audit-level=moderate', { stdio: 'inherit' });
    } catch (error) {
      logger.warn('Security audit found issues - please review');
    }

    // 6. Run security linting
    logger.info('🧹 Running security linting...');
    try {
      execSync('npm run lint:security -- --fix', { stdio: 'inherit' });
    } catch (error) {
      logger.warn('Security linting found issues - please review');
    }

    logger.info('✅ Security setup completed successfully!');
    logger.info('');
    logger.info('🔒 Security measures applied:');
    logger.info('  ✓ Security dependencies installed');
    logger.info('  ✓ Environment variables configured');
    logger.info('  ✓ Git hooks configured');
    logger.info('  ✓ Security middleware ready');
    logger.info('  ✓ Security audit completed');
    logger.info('  ✓ Security linting applied');
    logger.info('');
    logger.info('⚠️  Next steps:');
    logger.info('  1. Review and fix any remaining security issues');
    logger.info('  2. Set up GitHub branch protection rules');
    logger.info('  3. Configure production environment variables');
    logger.info('  4. Set up monitoring and alerting');

  } catch (error) {
    logger.error('❌ Security setup failed', error);
    process.exit(1);
  }
}

function setupEnvironmentVariables() {
  const envExample = '.env.example';
  const envFile = '.env';

  if (!existsSync(envExample)) {
    logger.warn('No .env.example file found, creating one...');
    const envContent = `# Security Configuration
AUTH_SECRET=your-super-secret-jwt-key-here-change-this-in-production
ENCRYPTION_KEY=your-base64-encoded-32-byte-encryption-key-here

# Database
DATABASE_URL=your-database-url-here

# External APIs
YOUVERIFY_API_KEY=your-youverify-api-key
PAYSTACK_SECRET_KEY=your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=your-paystack-public-key

# Environment
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;
    writeFileSync(envExample, envContent);
  }

  if (!existsSync(envFile)) {
    logger.info('Creating .env file from example...');
    const exampleContent = readFileSync(envExample, 'utf8');
    writeFileSync(envFile, exampleContent);
    logger.warn('⚠️  Please update .env file with your actual values');
  }

  // Generate secure keys if needed
  const envContent = readFileSync(envFile, 'utf8');
  if (envContent.includes('your-super-secret-jwt-key-here')) {
    logger.info('Generating secure AUTH_SECRET...');
    const crypto = require('crypto');
    const authSecret = crypto.randomBytes(64).toString('hex');
    const encryptionKey = crypto.randomBytes(32).toString('base64');
    
    const updatedContent = envContent
      .replace('your-super-secret-jwt-key-here-change-this-in-production', authSecret)
      .replace('your-base64-encoded-32-byte-encryption-key-here', encryptionKey);
    
    writeFileSync(envFile, updatedContent);
    logger.info('✅ Secure keys generated');
  }
}

function setupGitHooks() {
  const preCommitHook = `#!/bin/sh
# Pre-commit security checks

echo "🔒 Running pre-commit security checks..."

# Run security linting
npm run lint:security
if [ $? -ne 0 ]; then
  echo "❌ Security linting failed"
  exit 1
fi

# Run security tests
npm run test:security
if [ $? -ne 0 ]; then
  echo "❌ Security tests failed"
  exit 1
fi

# Check for secrets
npm run security:scan
if [ $? -ne 0 ]; then
  echo "❌ Secret scan failed"
  exit 1
fi

echo "✅ Pre-commit security checks passed"
`;

  writeFileSync('.husky/pre-commit', preCommitHook);
  execSync('chmod +x .husky/pre-commit');
  logger.info('✅ Git hooks configured');
}

function setupSecurityMiddleware() {
  // Create a Next.js middleware file
  const middlewareContent = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SecurityMiddleware } from '@/lib/security/middleware';

export async function middleware(request: NextRequest) {
  // Apply security headers to all responses
  const response = NextResponse.next();
  
  // Apply comprehensive security headers
  SecurityMiddleware.applySecurityHeaders(response);
  
  // Perform security checks for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const securityCheck = await SecurityMiddleware.performSecurityCheck(request);
    
    if (!securityCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: securityCheck.reason?.includes('rate limit') ? 429 : 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
`;

  writeFileSync('middleware.ts', middlewareContent);
  logger.info('✅ Security middleware configured');
}

// Run the setup
setupSecurity().catch((error) => {
  logger.error('Setup failed', error);
  process.exit(1);
});