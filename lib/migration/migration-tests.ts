import { redis } from '@/lib/redis';
import { db } from '@/lib/database';
import type { EnhancedTenant, LegacySubdomainData } from '@/types/database';
import { TenantMigrationService } from './tenant-migration';
import { MigrationUtils } from './migration-utils';
import { tenants } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { createDrizzleD1Database } from '@/lib/database/d1-client';

/**
 * Migration testing utilities
 * Provides comprehensive testing for migration processes
 */
export class MigrationTests {
  
  /**
   * Run comprehensive migration tests
   */
  static async runAllTests(): Promise<{
    success: boolean;
    results: Array<{
      test: string;
      passed: boolean;
      message: string;
      details?: any;
    }>;
  }> {
    const results: Array<{
      test: string;
      passed: boolean;
      message: string;
      details?: any;
    }> = [];
    
    // Test 1: Database connectivity
    results.push(await this.testDatabaseConnectivity());
    
    // Test 2: Redis connectivity
    results.push(await this.testRedisConnectivity());
    
    // Test 3: Data validation
    results.push(await this.testDataValidation());
    
    // Test 4: Migration process
    results.push(await this.testMigrationProcess());
    
    // Test 5: Data integrity
    results.push(await this.testDataIntegrity());
    
    // Test 6: Backward compatibility
    results.push(await this.testBackwardCompatibility());
    
    const success = results.every(result => result.passed);
    
    return { success, results };
  }
  
  /**
   * Test database connectivity
   */
  private static async testDatabaseConnectivity(): Promise<{
    test: string;
    passed: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const database = createDrizzleD1Database();
      await database.prepare('SELECT 1').bind().first();
      return {
        test: 'Database Connectivity',
        passed: true,
        message: 'Database connection successful',
      };
    } catch (error) {
      return {
        test: 'Database Connectivity',
        passed: false,
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Test Redis connectivity
   */
  private static async testRedisConnectivity(): Promise<{
    test: string;
    passed: boolean;
    message: string;
    details?: any;
  }> {
    try {
      await redis.ping();
      return {
        test: 'Redis Connectivity',
        passed: true,
        message: 'Redis connection successful',
      };
    } catch (error) {
      return {
        test: 'Redis Connectivity',
        passed: false,
        message: 'Redis connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Test data validation
   */
  private static async testDataValidation(): Promise<{
    test: string;
    passed: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const validation = await MigrationUtils.validateAllTenantData();
      
      if (validation.invalid.length === 0) {
        return {
          test: 'Data Validation',
          passed: true,
          message: `All ${validation.valid.length} tenants have valid data`,
        };
      } else {
        return {
          test: 'Data Validation',
          passed: false,
          message: `${validation.invalid.length} tenants have invalid data`,
          details: validation.invalid,
        };
      }
    } catch (error) {
      return {
        test: 'Data Validation',
        passed: false,
        message: 'Data validation test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Test migration process with sample data
   */
  private static async testMigrationProcess(): Promise<{
    test: string;
    passed: boolean;
    message: string;
    details?: any;
  }> {
    const testSubdomain = `test-migration-${Date.now()}`;
    
    try {
      // Create test data in Redis
      const testData: LegacySubdomainData = {
        subdomain: testSubdomain,
        emoji: '🧪',
        createdAt: Date.now(),
      };
      
      await redis.set(`subdomain:${testSubdomain}`, testData);
      
      // Test migration
      await TenantMigrationService.migrateSingleTenant(testSubdomain, testData);
      
      // Verify migration
      const [migratedTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.subdomain, testSubdomain))
        .limit(1);
      
      if (!migratedTenant) {
        throw new Error('Migrated tenant not found in database');
      }
      
      // Cleanup
      await db.delete(tenants).where(eq(tenants.subdomain, testSubdomain));
      await redis.del(`subdomain:${testSubdomain}`);
      
      return {
        test: 'Migration Process',
        passed: true,
        message: 'Sample migration completed successfully',
      };
      
    } catch (error) {
      // Cleanup on error
      try {
        await db.delete(tenants).where(eq(tenants.subdomain, testSubdomain));
        await redis.del(`subdomain:${testSubdomain}`);
      } catch (cleanupError) {
        console.warn('Cleanup failed:', cleanupError);
      }
      
      return {
        test: 'Migration Process',
        passed: false,
        message: 'Migration process test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Test data integrity between Redis and PostgreSQL
   */
  private static async testDataIntegrity(): Promise<{
    test: string;
    passed: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const integrity = await TenantMigrationService.checkDataIntegrity();
      
      if (integrity.consistent) {
        return {
          test: 'Data Integrity',
          passed: true,
          message: 'Data is consistent between Redis and PostgreSQL',
        };
      } else {
        return {
          test: 'Data Integrity',
          passed: false,
          message: 'Data inconsistencies found',
          details: {
            redisOnly: integrity.redisOnly,
            postgresOnly: integrity.postgresOnly,
            inconsistencies: integrity.inconsistencies,
          },
        };
      }
    } catch (error) {
      return {
        test: 'Data Integrity',
        passed: false,
        message: 'Data integrity test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Test backward compatibility
   */
  private static async testBackwardCompatibility(): Promise<{
    test: string;
    passed: boolean;
    message: string;
    details?: any;
  }> {
    const testSubdomain = `test-compat-${Date.now()}`;
    
    try {
      // Create legacy data in Redis
      const legacyData: LegacySubdomainData = {
        subdomain: testSubdomain,
        emoji: '🔄',
        createdAt: Date.now(),
      };
      
      await redis.set(`subdomain:${testSubdomain}`, legacyData);
      
      // Test backward compatibility function
      const retrievedData = await TenantMigrationService.getSubdomainDataWithFallback(testSubdomain);
      
      if (!retrievedData) {
        throw new Error('Failed to retrieve data with fallback');
      }
      
      // Verify it's enhanced data
      if (!('businessName' in retrievedData)) {
        throw new Error('Data was not enhanced during fallback');
      }
      
      // Cleanup
      await redis.del(`subdomain:${testSubdomain}`);
      
      // Also cleanup from database if it was auto-migrated
      try {
        await db.delete(tenants).where(eq(tenants.subdomain, testSubdomain));
      } catch (cleanupError) {
        // Ignore cleanup errors for this test
      }
      
      return {
        test: 'Backward Compatibility',
        passed: true,
        message: 'Backward compatibility works correctly',
      };
      
    } catch (error) {
      // Cleanup on error
      try {
        await redis.del(`subdomain:${testSubdomain}`);
        await db.delete(tenants).where(eq(tenants.subdomain, testSubdomain));
      } catch (cleanupError) {
        console.warn('Cleanup failed:', cleanupError);
      }
      
      return {
        test: 'Backward Compatibility',
        passed: false,
        message: 'Backward compatibility test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Test specific tenant migration
   */
  static async testTenantMigration(subdomain: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      // Get original data from Redis
      const redisData = (await redis.get(`subdomain:${subdomain}`)) as
        | LegacySubdomainData
        | EnhancedTenant
        | null;
      
      if (!redisData) {
        return {
          success: false,
          message: `No data found for subdomain: ${subdomain}`,
        };
      }
      
      // Check if already migrated
      const [existingTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.subdomain, subdomain))
        .limit(1);
      
      if (existingTenant) {
        return {
          success: true,
          message: `Tenant ${subdomain} already migrated`,
          details: { alreadyMigrated: true },
        };
      }
      
      // Perform migration
      await TenantMigrationService.migrateSingleTenant(subdomain, redisData);
      
      // Verify migration
      const [migratedTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.subdomain, subdomain))
        .limit(1);
      
      if (!migratedTenant) {
        return {
          success: false,
          message: `Migration failed: tenant not found in PostgreSQL`,
        };
      }
      
      return {
        success: true,
        message: `Successfully migrated tenant: ${subdomain}`,
        details: {
          originalData: redisData,
          migratedData: migratedTenant,
        },
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Migration test failed for ${subdomain}`,
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}