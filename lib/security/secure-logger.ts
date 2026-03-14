/**
 * Secure Logging Utility
 * Prevents sensitive data leakage in logs
 */

import { PIIProtection } from './encryption';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class SecureLogger {
  private static logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;

  /**
   * Sanitize data before logging
   */
  private static sanitizeLogData(data: any): any {
    if (typeof data === 'string') {
      // Mask potential sensitive patterns
      return data
        .replace(/\b\d{11}\b/g, '***NIN***') // NIN numbers
        .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '***CARD***') // Card numbers
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***EMAIL***') // Email addresses
        .replace(/\+?[\d\s-()]{10,}/g, '***PHONE***') // Phone numbers
        .replace(/Bearer\s+[A-Za-z0-9-._~+/]+=*/g, 'Bearer ***TOKEN***') // Bearer tokens
        .replace(/sk_[a-zA-Z0-9_]+/g, '***SECRET_KEY***') // Secret keys
        .replace(/pk_[a-zA-Z0-9_]+/g, '***PUBLIC_KEY***'); // Public keys
    }

    if (typeof data === 'object' && data !== null) {
      if (PIIProtection.containsPII(data)) {
        return PIIProtection.sanitizeForLogging(data);
      }
      
      // Recursively sanitize object properties
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key)) {
          sanitized[key] = '***REDACTED***';
        } else {
          sanitized[key] = this.sanitizeLogData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Check if field name indicates sensitive data
   */
  private static isSensitiveField(fieldName: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /auth/i,
      /credential/i,
      /nin/i,
      /ssn/i,
      /card/i,
      /cvv/i,
      /pin/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(fieldName));
  }

  /**
   * Format log message with context
   */
  private static formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const sanitizedContext = context ? this.sanitizeLogData(context) : '';
    const contextStr = sanitizedContext ? ` ${JSON.stringify(sanitizedContext)}` : '';
    
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  /**
   * Debug logging (development only)
   */
  static debug(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  /**
   * Info logging
   */
  static info(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  /**
   * Warning logging
   */
  static warn(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  /**
   * Error logging
   */
  static error(message: string, error?: Error | any, context?: any): void {
    if (this.logLevel <= LogLevel.ERROR) {
      const errorInfo = error instanceof Error ? {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        name: error.name,
      } : error;

      console.error(this.formatMessage('ERROR', message, { error: errorInfo, ...context }));
    }
  }

  /**
   * Security event logging (always logged)
   */
  static security(message: string, context?: any): void {
    const securityLog = this.formatMessage('SECURITY', message, context);
    console.error(securityLog); // Use console.error to ensure it's always visible
    
    // In production, also send to security monitoring system
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to security monitoring service
      // await sendToSecurityMonitoring(securityLog);
    }
  }

  /**
   * Audit logging (always logged, never sanitized for compliance)
   */
  static audit(message: string, context?: any): void {
    const auditLog = this.formatMessage('AUDIT', message, context);
    console.log(auditLog);
    
    // In production, send to audit logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to audit logging service
      // await sendToAuditService(auditLog);
    }
  }

  /**
   * Performance logging
   */
  static performance(operation: string, duration: number, context?: any): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.info(`Performance: ${operation} completed in ${duration}ms`, context);
    }
  }

  /**
   * API request logging
   */
  static apiRequest(method: string, path: string, userId?: string, duration?: number): void {
    this.info('API Request', {
      method,
      path,
      userId: userId ? `user_${userId.substring(0, 8)}***` : 'anonymous',
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  /**
   * Database operation logging
   */
  static database(operation: string, table: string, duration?: number, error?: Error): void {
    if (error) {
      this.error(`Database ${operation} failed on ${table}`, error, { duration });
    } else {
      this.debug(`Database ${operation} on ${table}`, { duration });
    }
  }
}

// Convenience exports
export const logger = SecureLogger;