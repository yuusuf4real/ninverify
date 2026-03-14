/**
 * Enterprise Data Encryption & PII Protection
 * Implements field-level encryption for sensitive data
 */

import crypto from 'crypto';
import { SECURITY_CONFIG } from '@/security/security-config';

export class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  /**
   * Get encryption key from environment
   */
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY || 'default-key-for-testing-only-not-secure';
    
    // Derive key from string
    return crypto.scryptSync(key, 'salt', this.KEY_LENGTH);
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV + encrypted data
      const combined = Buffer.concat([
        iv,
        Buffer.from(encrypted, 'hex')
      ]);
      
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const iv = combined.subarray(0, this.IV_LENGTH);
      const encrypted = combined.subarray(this.IV_LENGTH);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  static hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  static verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const verifyHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
      return hash === verifyHash.toString('hex');
    } catch {
      return false;
    }
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Mask sensitive data for display
   */
  static maskData(data: string, type: 'email' | 'phone' | 'nin' | 'card'): string {
    switch (type) {
      case 'email':
        const [local, domain] = data.split('@');
        if (local.length <= 2) return `${local}***@${domain}`;
        return `${local.substring(0, 2)}***@${domain}`;
        
      case 'phone':
        if (data.length <= 4) return '***' + data;
        return data.substring(0, 4) + '***' + data.substring(data.length - 2);
        
      case 'nin':
        if (data.length !== 11) return '***';
        return data.substring(0, 3) + '****' + data.substring(7);
        
      case 'card':
        if (data.length < 8) return '***';
        return data.substring(0, 4) + ' **** **** ' + data.substring(data.length - 4);
        
      default:
        return '***';
    }
  }
}

/**
 * PII (Personally Identifiable Information) Protection
 */
export class PIIProtection {
  private static readonly PII_FIELDS = SECURITY_CONFIG.ENCRYPTION.PII_FIELDS;
  private static readonly SENSITIVE_FIELDS = SECURITY_CONFIG.ENCRYPTION.SENSITIVE_FIELDS;

  /**
   * Encrypt PII fields in an object
   */
  static encryptPII<T extends Record<string, any>>(data: T): T {
    const encrypted = { ...data } as any;
    
    for (const field of this.PII_FIELDS) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = DataEncryption.encrypt(encrypted[field]);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt PII fields in an object
   */
  static decryptPII<T extends Record<string, any>>(data: T): T {
    const decrypted = { ...data } as any;
    
    for (const field of this.PII_FIELDS) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = DataEncryption.decrypt(decrypted[field]);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // Keep encrypted value if decryption fails
        }
      }
    }
    
    return decrypted;
  }

  /**
   * Mask PII fields for safe display
   */
  static maskPII<T extends Record<string, any>>(data: T): T {
    const masked = { ...data } as any;
    
    // Mask PII fields
    for (const field of this.PII_FIELDS) {
      if (masked[field] && typeof masked[field] === 'string') {
        switch (field) {
          case 'email':
            masked[field] = DataEncryption.maskData(masked[field], 'email');
            break;
          case 'phone':
            masked[field] = DataEncryption.maskData(masked[field], 'phone');
            break;
          case 'nin':
            masked[field] = DataEncryption.maskData(masked[field], 'nin');
            break;
          default:
            masked[field] = '***';
        }
      }
    }
    
    // Remove sensitive fields entirely
    for (const field of this.SENSITIVE_FIELDS) {
      if (masked[field]) {
        delete masked[field];
      }
    }
    
    return masked;
  }

  /**
   * Sanitize data for logging (remove all PII)
   */
  static sanitizeForLogging<T extends Record<string, any>>(data: T): Partial<T> {
    const sanitized = { ...data };
    
    // Remove all PII and sensitive fields
    const allSensitiveFields = [...this.PII_FIELDS, ...this.SENSITIVE_FIELDS];
    
    for (const field of allSensitiveFields) {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    }
    
    return sanitized;
  }

  /**
   * Check if data contains PII
   */
  static containsPII(data: any): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    const allSensitiveFields = [...this.PII_FIELDS, ...this.SENSITIVE_FIELDS];
    
    return allSensitiveFields.some(field => 
      data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined
    );
  }

  /**
   * Generate data retention policy compliance report
   */
  static generateRetentionReport(data: any[]): {
    totalRecords: number;
    piiRecords: number;
    retentionRequired: boolean;
    recommendedActions: string[];
  } {
    const piiRecords = data.filter(record => this.containsPII(record));
    
    return {
      totalRecords: data.length,
      piiRecords: piiRecords.length,
      retentionRequired: piiRecords.length > 0,
      recommendedActions: piiRecords.length > 0 ? [
        'Implement data retention policy',
        'Set up automated data purging',
        'Ensure user consent for data processing',
        'Provide data export/deletion capabilities'
      ] : []
    };
  }
}

/**
 * Secure key management
 */
export class KeyManagement {
  private static keyRotationLog = new Map<string, Date>();

  /**
   * Check if key rotation is needed
   */
  static isKeyRotationNeeded(keyId: string): boolean {
    const lastRotation = this.keyRotationLog.get(keyId);
    if (!lastRotation) return true;
    
    const daysSinceRotation = (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRotation >= SECURITY_CONFIG.ENCRYPTION.KEY_ROTATION_DAYS;
  }

  /**
   * Generate new encryption key
   */
  static generateNewKey(): string {
    const key = crypto.randomBytes(32);
    return key.toString('base64');
  }

  /**
   * Rotate encryption key (in production, use proper key management service)
   */
  static async rotateKey(keyId: string): Promise<string> {
    const newKey = this.generateNewKey();
    this.keyRotationLog.set(keyId, new Date());
    
    // In production, this would:
    // 1. Generate new key in HSM/KMS
    // 2. Re-encrypt all data with new key
    // 3. Update key references
    // 4. Securely destroy old key
    
    console.log(`Key rotation completed for ${keyId}`);
    return newKey;
  }

  /**
   * Validate key strength
   */
  static validateKeyStrength(key: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (key.length < 32) {
      issues.push('Key too short');
    }
    
    // Check entropy (simplified)
    const uniqueChars = new Set(key).size;
    if (uniqueChars < key.length * 0.5) {
      issues.push('Low entropy');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}