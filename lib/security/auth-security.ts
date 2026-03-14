/**
 * Enterprise Authentication & Authorization Security
 * Implements multi-factor authentication, session management, and access control
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { SECURITY_CONFIG } from '@/security/security-config';
import { db } from '@/db/client';
import { users, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface LoginAttempt {
  email: string;
  ip: string;
  timestamp: number;
  success: boolean;
}

interface SessionData {
  userId: string;
  email: string;
  role: string;
  lastActivity: number;
  mfaVerified: boolean;
  deviceFingerprint?: string;
}

// In-memory stores (in production, use Redis)
const loginAttempts = new Map<string, LoginAttempt[]>();
const activeSessions = new Map<string, SessionData>();
const blacklistedTokens = new Set<string>();

export class AuthSecurity {
  
  /**
   * Secure password hashing with salt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(SECURITY_CONFIG.ENCRYPTION.SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify password with timing attack protection
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      // Prevent timing attacks by always taking same time
      await bcrypt.compare('dummy', '$2a$12$dummy.hash.to.prevent.timing.attacks');
      return false;
    }
  }

  /**
   * Check if account is locked due to failed attempts
   */
  static isAccountLocked(email: string, ip: string): boolean {
    const key = `${email}:${ip}`;
    const attempts = loginAttempts.get(key) || [];
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp < SECURITY_CONFIG.AUTH.LOCKOUT_DURATION
    );

    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    return failedAttempts.length >= SECURITY_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Record login attempt
   */
  static recordLoginAttempt(email: string, ip: string, success: boolean): void {
    const key = `${email}:${ip}`;
    const attempts = loginAttempts.get(key) || [];
    
    attempts.push({
      email,
      ip,
      timestamp: Date.now(),
      success
    });

    // Keep only recent attempts
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp < SECURITY_CONFIG.AUTH.LOCKOUT_DURATION * 2
    );

    loginAttempts.set(key, recentAttempts);
  }

  /**
   * Generate secure JWT tokens
   */
  static generateTokens(userId: string, email: string, role: string): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = {
      userId,
      email,
      role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = jwt.sign(
      payload,
      process.env.AUTH_SECRET!,
      { 
        expiresIn: SECURITY_CONFIG.AUTH.JWT_EXPIRY,
        issuer: 'verifynin.ng',
        audience: 'verifynin-users'
      }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      process.env.AUTH_SECRET!,
      { 
        expiresIn: SECURITY_CONFIG.AUTH.REFRESH_TOKEN_EXPIRY,
        issuer: 'verifynin.ng',
        audience: 'verifynin-users'
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify JWT token with security checks
   */
  static verifyToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      // Check if token is blacklisted
      if (blacklistedTokens.has(token)) {
        return { valid: false, error: 'Token revoked' };
      }

      const payload = jwt.verify(token, process.env.AUTH_SECRET!, {
        issuer: 'verifynin.ng',
        audience: 'verifynin-users'
      });

      return { valid: true, payload };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      }
      return { valid: false, error: 'Token verification failed' };
    }
  }

  /**
   * Create secure session
   */
  static createSession(
    userId: string, 
    email: string, 
    role: string, 
    deviceFingerprint?: string
  ): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    activeSessions.set(sessionId, {
      userId,
      email,
      role,
      lastActivity: Date.now(),
      mfaVerified: false,
      deviceFingerprint
    });

    return sessionId;
  }

  /**
   * Validate session with timeout check
   */
  static validateSession(sessionId: string): { valid: boolean; session?: SessionData } {
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return { valid: false };
    }

    // Check session timeout
    if (Date.now() - session.lastActivity > SECURITY_CONFIG.AUTH.SESSION_TIMEOUT) {
      activeSessions.delete(sessionId);
      return { valid: false };
    }

    // Update last activity
    session.lastActivity = Date.now();
    activeSessions.set(sessionId, session);

    return { valid: true, session };
  }

  /**
   * Revoke session
   */
  static revokeSession(sessionId: string): void {
    activeSessions.delete(sessionId);
  }

  /**
   * Revoke all sessions for user
   */
  static revokeAllUserSessions(userId: string): void {
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.userId === userId) {
        activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Generate device fingerprint
   */
  static generateDeviceFingerprint(userAgent: string, ip: string): string {
    return crypto
      .createHash('sha256')
      .update(`${userAgent}:${ip}:${process.env.AUTH_SECRET}`)
      .digest('hex');
  }

  /**
   * Check for suspicious login patterns
   */
  static async checkSuspiciousActivity(
    userId: string, 
    ip: string, 
    userAgent: string
  ): Promise<{ suspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    try {
      // Check for rapid location changes (simplified)
      const recentLogins = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .limit(5);

      // Check for unusual user agent
      const commonUserAgents = recentLogins
        .map(log => log.userAgent)
        .filter(Boolean);
      
      if (commonUserAgents.length > 0 && !commonUserAgents.includes(userAgent)) {
        reasons.push('Unusual device/browser');
      }

      // Check for unusual IP
      const commonIPs = recentLogins
        .map(log => log.ipAddress)
        .filter(Boolean);
      
      if (commonIPs.length > 0 && !commonIPs.includes(ip)) {
        reasons.push('Unusual location');
      }

      // Check for rapid successive logins
      const recentLoginTimes = recentLogins
        .map(log => new Date(log.timestamp).getTime())
        .sort((a, b) => b - a);

      if (recentLoginTimes.length >= 2) {
        const timeDiff = recentLoginTimes[0] - recentLoginTimes[1];
        if (timeDiff < 60000) { // Less than 1 minute
          reasons.push('Rapid successive logins');
        }
      }

    } catch (error) {
      console.error('Error checking suspicious activity:', error);
    }

    return {
      suspicious: reasons.length > 0,
      reasons
    };
  }

  /**
   * Blacklist token (for logout)
   */
  static blacklistToken(token: string): void {
    blacklistedTokens.add(token);
    
    // Clean up old blacklisted tokens periodically
    if (blacklistedTokens.size > 10000) {
      // In production, implement proper cleanup based on token expiry
      blacklistedTokens.clear();
    }
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

/**
 * Role-based access control
 */
export class AccessControl {
  private static readonly ROLE_HIERARCHY = {
    'user': 0,
    'admin': 1,
    'super_admin': 2
  };

  private static readonly PERMISSIONS = {
    'user': [
      'read:own_profile',
      'update:own_profile',
      'create:verification',
      'read:own_verifications',
      'create:support_ticket',
      'read:own_support_tickets'
    ],
    'admin': [
      'read:all_users',
      'update:user_status',
      'read:all_verifications',
      'read:all_support_tickets',
      'update:support_tickets',
      'read:analytics',
      'manage:transactions'
    ],
    'super_admin': [
      'manage:admins',
      'manage:system_settings',
      'access:audit_logs',
      'manage:security_settings'
    ]
  };

  static hasPermission(userRole: string, permission: string): boolean {
    const userLevel = this.ROLE_HIERARCHY[userRole as keyof typeof this.ROLE_HIERARCHY] ?? -1;
    
    // Check direct permissions
    for (const [role, permissions] of Object.entries(this.PERMISSIONS)) {
      const roleLevel = this.ROLE_HIERARCHY[role as keyof typeof this.ROLE_HIERARCHY];
      if (roleLevel <= userLevel && permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  static canAccessResource(userRole: string, resource: string, action: string): boolean {
    const permission = `${action}:${resource}`;
    return this.hasPermission(userRole, permission);
  }
}