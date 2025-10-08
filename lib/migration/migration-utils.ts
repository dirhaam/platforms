import { redis } from '@/lib/redis';
import { prisma } from '@/lib/database';
import type { 
  LegacySubdomainData, 
  EnhancedTenant,
  MigrationResult 
} from '@/types/database';

/**
 * Migration utilities for tenant data
 * Provides helper functions for data migration and validation
 */
export class MigrationUtils {
  
  /**
   * Get migration statistics
   */
  static async getMigrationStats(): Promise<{
    redisCount: number;
    postgresCount: number;
    legacyCount: number;
    enhancedCount: number;
  }> {
    try {
      // Count Redis entries
      const redisKeys = await redis.keys('subdomain:*');
      const redisCount = redisKeys.length;
      
      // Count PostgreSQL entries
      const postgresCount = await prisma.tenant.count();
      
      // Count legacy vs enhanced in Redis
      let legacyCount = 0;
      let enhancedCount = 0;
      
      if (redisKeys.length > 0) {
        const values = await redis.mget<(LegacySubdomainData | EnhancedTenant)[]>(...redisKeys);
        
        for (const data of values) {
          if (data) {
            if ('businessName' in data) {
              enhancedCount++;
            } else {
              legacyCount++;
            }
          }
        }
      }
      
      return {
        redisCount,
        postgresCount,
        legacyCount,
        enhancedCount,
      };
      
    } catch (error) {
      console.error('Failed to get migration stats:', error);
      return {
        redisCount: 0,
        postgresCount: 0,
        legacyCount: 0,
        enhancedCount: 0,
      };
    }
  }
  
  /**
   * Backup Redis data before migration
   */
  static async backupRedisData(): Promise<{ success: boolean; backupData?: any; error?: string }> {
    try {
      const keys = await redis.keys('subdomain:*');
      
      if (!keys.length) {
        return { success: true, backupData: {} };
      }
      
      const values = await redis.mget<(LegacySubdomainData | EnhancedTenant)[]>(...keys);
      const backupData: Record<string, any> = {};
      
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const data = values[i];
        if (data) {
          backupData[key] = data;
        }
      }
      
      return { success: true, backupData };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Restore Redis data from backup
   */
  static async restoreRedisData(backupData: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      const pipeline = redis.pipeline();
      
      for (const [key, data] of Object.entries(backupData)) {
        pipeline.set(key, data);
      }
      
      await pipeline.exec();
      
      return { success: true };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Validate all tenant data before migration
   */
  static async validateAllTenantData(): Promise<{
    valid: string[];
    invalid: Array<{ subdomain: string; errors: string[] }>;
  }> {
    const result = {
      valid: [] as string[],
      invalid: [] as Array<{ subdomain: string; errors: string[] }>,
    };
    
    try {
      const keys = await redis.keys('subdomain:*');
      
      if (!keys.length) {
        return result;
      }
      
      const values = await redis.mget<(LegacySubdomainData | EnhancedTenant)[]>(...keys);
      
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const data = values[i];
        const subdomain = key.replace('subdomain:', '');
        
        if (!data) {
          result.invalid.push({
            subdomain,
            errors: ['No data found'],
          });
          continue;
        }
        
        // Import validation here to avoid circular dependencies
        const { TenantValidation } = await import('@/lib/validation/tenant-validation');
        const validation = TenantValidation.validateMigrationData(data);
        
        if (validation.isValid) {
          result.valid.push(subdomain);
        } else {
          result.invalid.push({
            subdomain,
            errors: validation.errors,
          });
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('Validation failed:', error);
      return result;
    }
  }
  
  /**
   * Clean up orphaned data after migration
   */
  static async cleanupOrphanedData(): Promise<{ 
    success: boolean; 
    cleaned: string[]; 
    errors: string[] 
  }> {
    const result = {
      success: true,
      cleaned: [] as string[],
      errors: [] as string[],
    };
    
    try {
      // Find Redis keys that have been successfully migrated to PostgreSQL
      const redisKeys = await redis.keys('subdomain:*');
      
      for (const key of redisKeys) {
        const subdomain = key.replace('subdomain:', '');
        
        // Check if tenant exists in PostgreSQL
        const pgTenant = await prisma.tenant.findUnique({
          where: { subdomain },
        });
        
        if (pgTenant) {
          // Tenant exists in PostgreSQL, safe to remove from Redis
          try {
            await redis.del(key);
            result.cleaned.push(subdomain);
          } catch (error) {
            result.errors.push(`Failed to clean ${subdomain}: ${error}`);
          }
        }
      }
      
      if (result.errors.length > 0) {
        result.success = false;
      }
      
      return result;
      
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }
  
  /**
   * Generate migration report
   */
  static async generateMigrationReport(): Promise<{
    timestamp: string;
    stats: Awaited<ReturnType<typeof MigrationUtils.getMigrationStats>>;
    validation: Awaited<ReturnType<typeof MigrationUtils.validateAllTenantData>>;
    integrity: Awaited<ReturnType<typeof import('./tenant-migration').TenantMigrationService.checkDataIntegrity>>;
  }> {
    const [stats, validation, { TenantMigrationService }] = await Promise.all([
      this.getMigrationStats(),
      this.validateAllTenantData(),
      import('./tenant-migration'),
    ]);
    
    const integrity = await TenantMigrationService.checkDataIntegrity();
    
    return {
      timestamp: new Date().toISOString(),
      stats,
      validation,
      integrity,
    };
  }
}