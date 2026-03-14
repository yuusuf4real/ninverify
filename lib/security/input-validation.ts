/**
 * Enterprise Input Validation & Sanitization
 * Prevents SQL Injection, XSS, and other injection attacks
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { SECURITY_CONFIG } from '@/security/security-config';

// Custom validation schemas
export const secureStringSchema = z.string()
  .min(1)
  .max(1000)
  .refine((val) => !containsSQLInjection(val), {
    message: "Invalid characters detected"
  })
  .refine((val) => !containsXSS(val), {
    message: "Invalid content detected"
  });

export const emailSchema = z.string()
  .email()
  .max(254) // RFC 5321 limit
  .toLowerCase()
  .refine((email) => {
    // Additional email security checks
    const suspiciousPatterns = [
      /\+.*\+/, // Multiple plus signs
      /\.{2,}/, // Multiple consecutive dots
      /@.*@/, // Multiple @ symbols
    ];
    return !suspiciousPatterns.some(pattern => pattern.test(email));
  }, { message: "Invalid email format" });

export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/) // E.164 format
  .min(10)
  .max(15);

export const ninSchema = z.string()
  .regex(/^\d{11}$/) // Exactly 11 digits
  .refine((nin) => {
    // Basic NIN validation (checksum would be ideal but not public)
    return nin.length === 11 && !nin.match(/^(.)\1{10}$/); // Not all same digit
  });

export const passwordSchema = z.string()
  .min(SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH)
  .max(128)
  .refine((password) => {
    const { PASSWORD_COMPLEXITY } = SECURITY_CONFIG.AUTH;
    const checks = [
      PASSWORD_COMPLEXITY.requireUppercase ? /[A-Z]/.test(password) : true,
      PASSWORD_COMPLEXITY.requireLowercase ? /[a-z]/.test(password) : true,
      PASSWORD_COMPLEXITY.requireNumbers ? /\d/.test(password) : true,
      PASSWORD_COMPLEXITY.requireSpecialChars ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : true,
      new Set(password).size >= PASSWORD_COMPLEXITY.minUniqueChars
    ];
    return checks.every(Boolean);
  }, {
    message: "Password does not meet security requirements"
  });

// SQL Injection Detection
export function containsSQLInjection(input: string): boolean {
  const { SQL_INJECTION_PATTERNS } = SECURITY_CONFIG.VALIDATION;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// XSS Detection
export function containsXSS(input: string): boolean {
  const { XSS_PATTERNS } = SECURITY_CONFIG.VALIDATION;
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

// Sanitization Functions
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

export function sanitizeForDatabase(input: string): string {
  // Remove potential SQL injection characters
  return input
    .replace(/['"`;\\]/g, '') // Remove quotes, semicolons, backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, '') // Remove block comments
    .trim();
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .substring(0, 255); // Limit length
}

// Rate Limiting Key Generation
export function generateRateLimitKey(
  identifier: string, 
  action: string, 
  ip?: string
): string {
  const sanitizedId = sanitizeForDatabase(identifier);
  const sanitizedAction = sanitizeForDatabase(action);
  const sanitizedIp = ip ? sanitizeForDatabase(ip) : 'unknown';
  
  return `${sanitizedAction}:${sanitizedId}:${sanitizedIp}`;
}

// Request Validation Middleware Schema
export const createSecureRequestSchema = <T extends z.ZodRawShape>(shape: T) => {
  return z.object({
    ...shape,
    // Add common security fields
    timestamp: z.number().optional(),
    nonce: z.string().optional(),
  }).strict(); // Reject unknown fields
};

// File Upload Validation
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } = SECURITY_CONFIG.VALIDATION;
  
  // Check file size
  if (file.size > parseInt(MAX_FILE_SIZE.replace('mb', '')) * 1024 * 1024) {
    return { valid: false, error: 'File too large' };
  }
  
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Check file name
  const sanitizedName = sanitizeFileName(file.name);
  if (sanitizedName !== file.name) {
    return { valid: false, error: 'Invalid file name' };
  }
  
  return { valid: true };
}

// API Request Validation
export function validateApiRequest(req: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check request size
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > parseInt(SECURITY_CONFIG.VALIDATION.MAX_REQUEST_SIZE.replace('mb', '')) * 1024 * 1024) {
    errors.push('Request too large');
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url'];
  for (const header of suspiciousHeaders) {
    if (req.headers[header]) {
      errors.push(`Suspicious header: ${header}`);
    }
  }
  
  // Validate User-Agent
  const userAgent = req.headers['user-agent'];
  if (!userAgent || userAgent.length < 10 || userAgent.length > 500) {
    errors.push('Invalid User-Agent');
  }
  
  return { valid: errors.length === 0, errors };
}