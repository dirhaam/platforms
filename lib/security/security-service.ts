import bcrypt from 'bcryptjs';
import { db } from '@/lib/database/server';
import { securityAuditLogs } from '@/lib/database/schema';
import { eq, and, lt, gte, desc, count } from 'drizzle-orm';

const ensureCrypto = () => {
  if (typeof globalThis.crypto === 'undefined') {
    throw new Error('Web Crypto API is not available in this environment');
  }
  return globalThis.crypto;
};

const generateUUID = () => {
  const cryptoObj = ensureCrypto();
  if (typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  const bytes = cryptoObj.getRandomValues(new Uint8Array(16));
  // RFC4122 v4 fallback
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return (
    hex[0] + hex[1] + hex[2] + hex[3] + '-' +
    hex[4] + hex[5] + '-' + hex[6] + hex[7] + '-' +
    hex[8] + hex[9] + '-' + hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15]
  );
};

const randomBytesHex = (length: number) => {
  const cryptoObj = ensureCrypto();
  const bytes = new Uint8Array(length);
  cryptoObj.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const arrayBufferToHex = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const hexToUint8Array = (hex: string) => {
  const length = hex.length / 2;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  if (typeof btoa === 'function') {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }
  throw new Error('Base64 encoding is not supported in this environment');
};

const base64ToUint8Array = (value: string) => {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'));
  }
  if (typeof atob === 'function') {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  throw new Error('Base64 decoding is not supported in this environment');
};

const sha256Hex = async (data: string | Uint8Array) => {
  const cryptoObj = ensureCrypto();
  const input = typeof data === 'string' ? encoder.encode(data) : data;
  const buffer = input instanceof Uint8Array
    ? input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
    : input;
  const digest = await cryptoObj.subtle.digest('SHA-256', buffer as ArrayBuffer);
  return arrayBufferToHex(digest);
};

const importAesKey = async (rawKey: string, usage: KeyUsage[]) => {
  const cryptoObj = ensureCrypto();
  const normalizedKey = rawKey.padEnd(32, '0').slice(0, 32);
  return cryptoObj.subtle.importKey(
    'raw',
    encoder.encode(normalizedKey),
    { name: 'AES-GCM' },
    false,
    usage
  );
};

// Security configuration
export const SECURITY_CONFIG = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    SALT_ROUNDS: 12,
  },
  SESSION: {
    MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    REFRESH_THRESHOLD: 24 * 60 * 60 * 1000, // 24 hours
    MAX_CONCURRENT_SESSIONS: 5,
  },
  RATE_LIMITING: {
    LOGIN_ATTEMPTS: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
    },
    API_REQUESTS: {
      MAX_REQUESTS: 100,
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    },
  },
} as const;

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface SecurityAuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: Record<string, any>;
  timestamp: Date;
}

export class SecurityService {
  // Password validation
  static validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    // Length check
    if (password.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD.MIN_LENGTH} characters long`);
    }

    // Character requirements
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (SECURITY_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (SECURITY_CONFIG.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (SECURITY_CONFIG.PASSWORD.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Calculate strength
    let strengthScore = 0;
    if (password.length >= 8) strengthScore++;
    if (password.length >= 12) strengthScore++;
    if (/[A-Z]/.test(password)) strengthScore++;
    if (/[a-z]/.test(password)) strengthScore++;
    if (/\d/.test(password)) strengthScore++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthScore++;
    if (password.length >= 16) strengthScore++;

    if (strengthScore >= 6) strength = 'strong';
    else if (strengthScore >= 4) strength = 'medium';

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  // Hash password with salt
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SECURITY_CONFIG.PASSWORD.SALT_ROUNDS);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    return randomBytesHex(length);
  }

  // Generate password reset token
  static async generatePasswordResetToken(): Promise<{
    token: string;
    hashedToken: string;
    expiresAt: Date;
  }> {
    const token = this.generateSecureToken(32);
    const hashedToken = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return { token, hashedToken, expiresAt };
  }

  // Sanitize input to prevent XSS
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate file upload
  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): {
    isValid: boolean;
    error?: string;
  } {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`,
      };
    }

    return { isValid: true };
  }

  // Encrypt sensitive data
  static async encryptSensitiveData(data: string, key?: string): Promise<string> {
    const cryptoObj = ensureCrypto();
    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const aesKey = await importAesKey(encryptionKey, ['encrypt']);
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const encrypted = await cryptoObj.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encoder.encode(data)
    );
    return `${arrayBufferToBase64(iv)}:${arrayBufferToBase64(new Uint8Array(encrypted))}`;
  }

  // Decrypt sensitive data
  static async decryptSensitiveData(encryptedData: string, key?: string): Promise<string> {
    const cryptoObj = ensureCrypto();
    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const [ivPart, dataPart] = encryptedData.split(':');
    if (!ivPart || !dataPart) {
      throw new Error('Invalid encrypted payload');
    }
    const aesKey = await importAesKey(encryptionKey, ['decrypt']);
    const decrypted = await cryptoObj.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToUint8Array(ivPart) },
      aesKey,
      base64ToUint8Array(dataPart)
    );
    return decoder.decode(decrypted);
  }

  // Log security audit event
  static async logSecurityEvent(
    tenantId: string,
    userId: string,
    action: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    resource?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await db.insert(securityAuditLogs).values({
        id: generateUUID(),
        tenantId,
        userId,
        action,
        resource,
        ipAddress,
        userAgent,
        success,
        details: details ? JSON.stringify(details) : null,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Check for suspicious activity
  static async checkSuspiciousActivity(
    userId: string,
    ipAddress: string,
    action: string
  ): Promise<{
    isSuspicious: boolean;
    reason?: string;
    shouldBlock?: boolean;
  }> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - SECURITY_CONFIG.RATE_LIMITING.LOGIN_ATTEMPTS.WINDOW_MS);

      // Check failed login attempts
      if (action === 'login') {
        const result = await db
          .select({ count: count() })
          .from(securityAuditLogs)
          .where(
            and(
              eq(securityAuditLogs.userId, userId),
              eq(securityAuditLogs.action, 'login'),
              eq(securityAuditLogs.success, false),
              gte(securityAuditLogs.timestamp, windowStart)
            )
          );

        const failedAttempts = Number(result[0]?.count ?? 0);

        if (failedAttempts >= SECURITY_CONFIG.RATE_LIMITING.LOGIN_ATTEMPTS.MAX_ATTEMPTS) {
          return {
            isSuspicious: true,
            reason: 'Too many failed login attempts',
            shouldBlock: true,
          };
        }
      }

      // Check for multiple IP addresses
      const result = await db.select({ ipAddress: securityAuditLogs.ipAddress }).from(securityAuditLogs).where(
        and(
          eq(securityAuditLogs.userId, userId),
          gte(securityAuditLogs.timestamp, new Date(now.getTime() - 24 * 60 * 60 * 1000)) // Last 24 hours
        )
      ).groupBy(securityAuditLogs.ipAddress);
      
      const recentIPs = result;

      if (recentIPs.length > 5) {
        return {
          isSuspicious: true,
          reason: 'Multiple IP addresses detected',
          shouldBlock: false,
        };
      }

      return { isSuspicious: false };
    } catch (error) {
      console.error('Failed to check suspicious activity:', error);
      return { isSuspicious: false };
    }
  }

  // Generate session fingerprint
  static async generateSessionFingerprint(userAgent: string, ipAddress: string): Promise<string> {
    const data = `${userAgent}:${ipAddress}:${Date.now()}`;
    return await sha256Hex(data);
  }

  // Validate session fingerprint
  static async validateSessionFingerprint(
    storedFingerprint: string,
    currentUserAgent: string,
    currentIpAddress: string
  ): Promise<boolean> {
    // For now, we'll do a simple validation
    // In production, you might want more sophisticated fingerprinting
    const currentFingerprint = await sha256Hex(`${currentUserAgent}:${currentIpAddress}`);

    // Allow some flexibility for IP changes (mobile networks, etc.)
    return storedFingerprint.includes(currentFingerprint.substring(0, 16));
  }

  // Clean up expired sessions and audit logs
  static async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();
      const sessionExpiry = new Date(now.getTime() - SECURITY_CONFIG.SESSION.MAX_AGE);
      const auditLogExpiry = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days

      // Clean up expired sessions (if you implement session storage)
      // await db.delete(sessions).where(lt(sessions.expiresAt, sessionExpiry));

      // Clean up old audit logs
      await db.delete(securityAuditLogs).where(
        lt(securityAuditLogs.timestamp, auditLogExpiry)
      );

      console.log('Expired security data cleaned up successfully');
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  // Get security metrics for a tenant
  static async getSecurityMetrics(tenantId: string, days: number = 30): Promise<{
    totalLogins: number;
    failedLogins: number;
    uniqueUsers: number;
    suspiciousActivities: number;
    topActions: Array<{ action: string; count: number }>;
  }> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Total login attempts
      const totalLoginsResult = await db.select({ count: count() }).from(securityAuditLogs).where(
        and(
          eq(securityAuditLogs.tenantId, tenantId),
          eq(securityAuditLogs.action, 'login'),
          gte(securityAuditLogs.timestamp, since)
        )
      );
      const totalLogins = Number(totalLoginsResult[0]?.count ?? 0);

      // Failed login attempts
      const failedLoginsResult = await db.select({ count: count() }).from(securityAuditLogs).where(
        and(
          eq(securityAuditLogs.tenantId, tenantId),
          eq(securityAuditLogs.action, 'login'),
          eq(securityAuditLogs.success, false),
          gte(securityAuditLogs.timestamp, since)
        )
      );
      const failedLogins = Number(failedLoginsResult[0]?.count ?? 0);

      // Unique users - We'll count distinct userIds
      const uniqueUsersResult = await db.select({ userId: securityAuditLogs.userId }).from(securityAuditLogs).where(
        and(
          eq(securityAuditLogs.tenantId, tenantId),
          gte(securityAuditLogs.timestamp, since)
        )
      ).groupBy(securityAuditLogs.userId);
      const uniqueUsers = uniqueUsersResult.length;

      // Suspicious activities (failed logins + other security events)
      const suspiciousActivitiesResult = await db.select({ count: count() }).from(securityAuditLogs).where(
        and(
          eq(securityAuditLogs.tenantId, tenantId),
          eq(securityAuditLogs.success, false),
          gte(securityAuditLogs.timestamp, since)
        )
      );
      const suspiciousActivities = Number(suspiciousActivitiesResult[0]?.count ?? 0);

      // Top actions - Group by action and count
      const topActionsResult = await db
        .select({
          action: securityAuditLogs.action,
          count: count(),
        })
        .from(securityAuditLogs)
        .where(
          and(
            eq(securityAuditLogs.tenantId, tenantId),
            gte(securityAuditLogs.timestamp, since)
          )
        )
        .groupBy(securityAuditLogs.action)
        .orderBy(({ count }) => desc(count))
        .limit(10);
      
      const topActions = topActionsResult.map(r => ({
        action: r.action,
        count: Number(r.count),
      }));

      return {
        totalLogins,
        failedLogins,
        uniqueUsers,
        suspiciousActivities,
        topActions,
      };
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return {
        totalLogins: 0,
        failedLogins: 0,
        uniqueUsers: 0,
        suspiciousActivities: 0,
        topActions: [],
      };
    }
  }
}