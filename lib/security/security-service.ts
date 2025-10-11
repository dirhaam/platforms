import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/database';
import { securityAuditLogs } from '@/lib/database/schema';
import { eq, and, lt, gte, desc } from 'drizzle-orm';

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
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate password reset token
  static generatePasswordResetToken(): {
    token: string;
    hashedToken: string;
    expiresAt: Date;
  } {
    const token = this.generateSecureToken(32);
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
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
  static encryptSensitiveData(data: string, key?: string): string {
    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  static decryptSensitiveData(encryptedData: string, key?: string): string {
    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-cbc';
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
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
        id: crypto.randomUUID(),
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
        const result = await db.select({ count: db.$count() }).from(securityAuditLogs).where(
          and(
            eq(securityAuditLogs.userId, userId),
            eq(securityAuditLogs.action, 'login'),
            eq(securityAuditLogs.success, false),
            gte(securityAuditLogs.timestamp, windowStart)
          )
        );
        
        const failedAttempts = result[0]?.count || 0;

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
  static generateSessionFingerprint(userAgent: string, ipAddress: string): string {
    const data = `${userAgent}:${ipAddress}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Validate session fingerprint
  static validateSessionFingerprint(
    storedFingerprint: string,
    currentUserAgent: string,
    currentIpAddress: string
  ): boolean {
    // For now, we'll do a simple validation
    // In production, you might want more sophisticated fingerprinting
    const currentFingerprint = crypto
      .createHash('sha256')
      .update(`${currentUserAgent}:${currentIpAddress}`)
      .digest('hex');

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
      const totalLoginsResult = await db.select({ count: db.$count() }).from(securityAuditLogs).where(
        and(
          eq(securityAuditLogs.tenantId, tenantId),
          eq(securityAuditLogs.action, 'login'),
          gte(securityAuditLogs.timestamp, since)
        )
      );
      const totalLogins = totalLoginsResult[0]?.count || 0;

      // Failed login attempts
      const failedLoginsResult = await db.select({ count: db.$count() }).from(securityAuditLogs).where(
        and(
          eq(securityAuditLogs.tenantId, tenantId),
          eq(securityAuditLogs.action, 'login'),
          eq(securityAuditLogs.success, false),
          gte(securityAuditLogs.timestamp, since)
        )
      );
      const failedLogins = failedLoginsResult[0]?.count || 0;

      // Unique users - We'll count distinct userIds
      const uniqueUsersResult = await db.select({ userId: securityAuditLogs.userId }).from(securityAuditLogs).where(
        and(
          eq(securityAuditLogs.tenantId, tenantId),
          gte(securityAuditLogs.timestamp, since)
        )
      ).groupBy(securityAuditLogs.userId);
      const uniqueUsers = uniqueUsersResult.length;

      // Suspicious activities (failed logins + other security events)
      const suspiciousActivitiesResult = await db.select({ count: db.$count() }).from(securityAuditLogs).where(
        and(
          eq(securityAuditLogs.tenantId, tenantId),
          eq(securityAuditLogs.success, false),
          gte(securityAuditLogs.timestamp, since)
        )
      );
      const suspiciousActivities = suspiciousActivitiesResult[0]?.count || 0;

      // Top actions - Group by action and count
      const topActionsResult = await db
        .select({
          action: securityAuditLogs.action,
          count: db.$count(),
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