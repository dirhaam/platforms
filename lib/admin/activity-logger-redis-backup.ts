import { redis } from '@/lib/redis';

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
  private static readonly ACTIVITY_LOG_KEY = 'admin:activity_log';
  private static readonly MAX_LOG_ENTRIES = 1000;

  static async log(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const logEntry: ActivityLogEntry = {
        ...entry,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      // Get existing log entries
      const existingLogs = await this.getActivityLog();
      
      // Add new entry at the beginning
      const updatedLogs = [logEntry, ...existingLogs];
      
      // Keep only the most recent entries
      const trimmedLogs = updatedLogs.slice(0, this.MAX_LOG_ENTRIES);
      
      // Store back to Redis
      await redis.set(this.ACTIVITY_LOG_KEY, trimmedLogs);
      
      console.log(`Activity logged: ${entry.action} - ${entry.details}`);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static async getActivityLog(limit?: number): Promise<ActivityLogEntry[]> {
    try {
      const logs = (await redis.get(this.ACTIVITY_LOG_KEY)) as ActivityLogEntry[] | null || [];
      
      // Convert timestamp strings back to Date objects
      const parsedLogs = logs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
      
      return limit ? parsedLogs.slice(0, limit) : parsedLogs;
    } catch (error) {
      console.error('Failed to get activity log:', error);
      return [];
    }
  }

  static async clearActivityLog(): Promise<void> {
    try {
      await redis.del(this.ACTIVITY_LOG_KEY);
      console.log('Activity log cleared');
    } catch (error) {
      console.error('Failed to clear activity log:', error);
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