import { activityLogs } from '@/lib/database/schema';
import { db } from '@/lib/database/index';
import { desc, gte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  type: 'tenant_created' | 'tenant_updated' | 'tenant_deleted' | 'feature_toggled' | 'subscription_changed' | 'admin_action';
  tenantId?: string;
  tenantName?: string;
  userId?: string;
  userName?: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
}

class ActivityLogger {
  private static readonly MAX_LOG_ENTRIES = 1000;
  private static readonly RETENTION_DAYS = 30; // Keep logs for 30 days

  static async log(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const logEntry: ActivityLogEntry = {
        ...entry,
        id: `activity_${uuidv4()}`,
        timestamp: new Date(),
      };

      // Insert into database
      await db.insert(activityLogs).values({
        id: logEntry.id,
        timestamp: logEntry.timestamp,
        type: logEntry.type,
        tenantId: logEntry.tenantId,
        tenantName: logEntry.tenantName,
        userId: logEntry.userId,
        userName: logEntry.userName,
        action: logEntry.action,
        details: logEntry.details,
        severity: logEntry.severity,
        metadata: logEntry.metadata ?? null,
      });

      // Cleanup old entries periodically
      await this.cleanupOldEntries();

      console.log(`Activity logged: ${entry.action} - ${entry.details}`);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static async getActivityLog(limit?: number): Promise<ActivityLogEntry[]> {
    try {
      // Get logs from database ordered by timestamp descending
      const query = db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
      
      if (limit) {
        query.limit(limit);
      }
      
      const logs = await query;
      
      // Parse metadata JSON strings back to objects
      const allowedTypes: ActivityLogEntry['type'][] = [
        'tenant_created',
        'tenant_updated',
        'tenant_deleted',
        'feature_toggled',
        'subscription_changed',
        'admin_action',
      ];
      const allowedSeverities: ActivityLogEntry['severity'][] = ['info', 'warning', 'error', 'success'];

      const parsedLogs: ActivityLogEntry[] = logs.map(log => {
        const type = allowedTypes.includes(log.type as ActivityLogEntry['type'])
          ? (log.type as ActivityLogEntry['type'])
          : 'admin_action';
        const severity = allowedSeverities.includes(log.severity as ActivityLogEntry['severity'])
          ? (log.severity as ActivityLogEntry['severity'])
          : 'info';

        const metadataValue = (log.metadata ?? undefined) as Record<string, any> | undefined;
        const timestampValue = log.timestamp instanceof Date
          ? log.timestamp
          : new Date(log.timestamp ?? Date.now());

        return {
          ...log,
          type,
          severity,
          metadata: metadataValue,
          timestamp: timestampValue,
          tenantId: log.tenantId ?? undefined,
          tenantName: log.tenantName ?? undefined,
          userId: log.userId ?? undefined,
          userName: log.userName ?? undefined,
        };
      });
      
      return parsedLogs;
    } catch (error) {
      console.error('Failed to get activity log:', error);
      return [];
    }
  }

  static async clearActivityLog(): Promise<void> {
    try {
      // Delete all entries
      await db.delete(activityLogs);
      console.log('Activity log cleared');
    } catch (error) {
      console.error('Failed to clear activity log:', error);
    }
  }

  static async cleanupOldEntries(): Promise<void> {
    try {
      // Delete entries older than retention period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
      
      await db.delete(activityLogs).where(gte(activityLogs.timestamp, cutoffDate));
    } catch (error) {
      console.error('Failed to cleanup old activity log entries:', error);
    }
  }

  // Convenience methods for common activities
  static async logTenantCreated(tenantId: string, tenantName: string, userId?: string): Promise<void> {
    await this.log({
      type: 'tenant_created',
      tenantId,
      tenantName,
      userId,
      action: 'Tenant Created',
      details: `New tenant "${tenantName}" was created`,
      severity: 'success',
    });
  }

  static async logTenantUpdated(tenantId: string, tenantName: string, changes: string[], userId?: string): Promise<void> {
    await this.log({
      type: 'tenant_updated',
      tenantId,
      tenantName,
      userId,
      action: 'Tenant Updated',
      details: `Tenant "${tenantName}" was updated: ${changes.join(', ')}`,
      severity: 'info',
      metadata: { changes },
    });
  }

  static async logTenantDeleted(tenantId: string, tenantName: string, userId?: string): Promise<void> {
    await this.log({
      type: 'tenant_deleted',
      tenantId,
      tenantName,
      userId,
      action: 'Tenant Deleted',
      details: `Tenant "${tenantName}" was deleted`,
      severity: 'warning',
    });
  }

  static async logFeatureToggled(
    tenantId: string, 
    tenantName: string, 
    feature: string, 
    enabled: boolean, 
    userId?: string
  ): Promise<void> {
    await this.log({
      type: 'feature_toggled',
      tenantId,
      tenantName,
      userId,
      action: 'Feature Toggled',
      details: `${feature} feature ${enabled ? 'enabled' : 'disabled'} for "${tenantName}"`,
      severity: 'info',
      metadata: { feature, enabled },
    });
  }

  static async logSubscriptionChanged(
    tenantId: string, 
    tenantName: string, 
    oldPlan: string, 
    newPlan: string, 
    userId?: string
  ): Promise<void> {
    await this.log({
      type: 'subscription_changed',
      tenantId,
      tenantName,
      userId,
      action: 'Subscription Changed',
      details: `Subscription for "${tenantName}" changed from ${oldPlan} to ${newPlan}`,
      severity: 'info',
      metadata: { oldPlan, newPlan },
    });
  }

  static async logAdminAction(action: string, details: string, userId?: string, severity: ActivityLogEntry['severity'] = 'info'): Promise<void> {
    await this.log({
      type: 'admin_action',
      userId,
      action,
      details,
      severity,
    });
  }
}

export { ActivityLogger };