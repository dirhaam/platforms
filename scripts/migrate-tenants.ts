#!/usr/bin/env tsx

/**
 * Tenant Migration Script
 * 
 * This script migrates tenant data from Redis to PostgreSQL
 * Usage: npx tsx scripts/migrate-tenants.ts [options]
 * 
 * Options:
 *   --dry-run    Show what would be migrated without actually migrating
 *   --check      Check data integrity between Redis and PostgreSQL
 *   --sync       Sync specific tenant data (requires --subdomain)
 *   --test       Run comprehensive migration tests
 *   --backup     Create backup of Redis data
 *   --cleanup    Clean up orphaned data after migration
 *   --report     Generate comprehensive migration report
 *   --subdomain  Specify subdomain for single tenant operations
 */

import { TenantMigrationService } from '../lib/migration/tenant-migration';
import { MigrationUtils } from '../lib/migration/migration-utils';
import { MigrationTests } from '../lib/migration/migration-tests';
import { checkDatabaseConnection } from '../lib/database';
import { validateEnvironment } from '../lib/config/environment';

interface MigrationOptions {
  dryRun: boolean;
  check: boolean;
  sync: boolean;
  test: boolean;
  backup: boolean;
  cleanup: boolean;
  report: boolean;
  subdomain?: string;
}

async function parseArgs(): Promise<MigrationOptions> {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run'),
    check: args.includes('--check'),
    sync: args.includes('--sync'),
    test: args.includes('--test'),
    backup: args.includes('--backup'),
    cleanup: args.includes('--cleanup'),
    report: args.includes('--report'),
    subdomain: args.includes('--subdomain') 
      ? args[args.indexOf('--subdomain') + 1] 
      : undefined,
  };
}

async function validateSetup(): Promise<boolean> {
  console.log('🔍 Validating environment setup...');
  
  // Check environment variables
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    console.error('❌ Environment validation failed:');
    envValidation.errors.forEach(error => console.error(`  - ${error}`));
    return false;
  }
  
  // Check database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error('❌ Database connection failed');
    console.error('Make sure PostgreSQL is running and DATABASE_URL is correct');
    return false;
  }
  
  console.log('✅ Environment setup is valid');
  return true;
}

async function runDryRun(): Promise<void> {
  console.log('🔍 Running dry-run migration...');
  
  try {
    // This would show what would be migrated without actually doing it
    const { redis } = await import('../lib/redis');
    const keys = await redis.keys('subdomain:*');
    
    if (!keys.length) {
      console.log('📭 No tenant data found in Redis');
      return;
    }
    
    console.log(`📊 Found ${keys.length} tenants in Redis:`);
    
    const values = await redis.mget<any[]>(...keys);
    
    for (let i = 0; i < keys.length; i++) {
      const subdomain = keys[i].replace('subdomain:', '');
      const data = values[i];
      
      if (data) {
        const hasBusinessName = 'businessName' in data;
        const status = hasBusinessName ? '✅ Enhanced' : '🔄 Legacy (needs migration)';
        console.log(`  - ${subdomain}: ${status}`);
      } else {
        console.log(`  - ${subdomain}: ❌ No data`);
      }
    }
    
  } catch (error) {
    console.error('❌ Dry-run failed:', error);
  }
}

async function runIntegrityCheck(): Promise<void> {
  console.log('🔍 Checking data integrity...');
  
  try {
    const result = await TenantMigrationService.checkDataIntegrity();
    
    if (result.consistent) {
      console.log('✅ Data is consistent between Redis and PostgreSQL');
    } else {
      console.log('⚠️  Data inconsistencies found:');
      
      if (result.redisOnly.length > 0) {
        console.log(`📝 Redis-only tenants (${result.redisOnly.length}):`);
        result.redisOnly.forEach(subdomain => console.log(`  - ${subdomain}`));
      }
      
      if (result.postgresOnly.length > 0) {
        console.log(`🗄️  PostgreSQL-only tenants (${result.postgresOnly.length}):`);
        result.postgresOnly.forEach(subdomain => console.log(`  - ${subdomain}`));
      }
      
      if (result.inconsistencies.length > 0) {
        console.log(`❌ Inconsistencies (${result.inconsistencies.length}):`);
        result.inconsistencies.forEach(issue => console.log(`  - ${issue}`));
      }
    }
    
  } catch (error) {
    console.error('❌ Integrity check failed:', error);
  }
}

async function runSync(subdomain: string): Promise<void> {
  console.log(`🔄 Syncing tenant data for: ${subdomain}`);
  
  try {
    await TenantMigrationService.syncTenantData(subdomain);
    console.log(`✅ Successfully synced tenant: ${subdomain}`);
  } catch (error) {
    console.error(`❌ Failed to sync tenant ${subdomain}:`, error);
  }
}

async function runTests(): Promise<void> {
  console.log('🧪 Running migration tests...');
  
  try {
    const testResults = await MigrationTests.runAllTests();
    
    console.log('\n📊 Test Results:');
    testResults.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
      
      if (!result.passed && result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    });
    
    if (testResults.success) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

async function runBackup(): Promise<void> {
  console.log('💾 Creating backup of Redis data...');
  
  try {
    const backup = await MigrationUtils.backupRedisData();
    
    if (backup.success) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `backup-${timestamp}.json`;
      
      // In a real implementation, you'd save this to a file
      console.log(`✅ Backup created successfully`);
      console.log(`📁 Backup data available (${Object.keys(backup.backupData || {}).length} entries)`);
      console.log(`💡 In production, save this to: ${backupFile}`);
    } else {
      console.error('❌ Backup failed:', backup.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

async function runCleanup(): Promise<void> {
  console.log('🧹 Cleaning up orphaned data...');
  
  try {
    const cleanup = await MigrationUtils.cleanupOrphanedData();
    
    console.log('\n📊 Cleanup Results:');
    console.log(`✅ Cleaned: ${cleanup.cleaned.length} entries`);
    
    if (cleanup.errors.length > 0) {
      console.log(`❌ Errors (${cleanup.errors.length}):`);
      cleanup.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (cleanup.success) {
      console.log('\n🎉 Cleanup completed successfully!');
    } else {
      console.log('\n⚠️  Cleanup completed with errors');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

async function runReport(): Promise<void> {
  console.log('📊 Generating migration report...');
  
  try {
    const report = await MigrationUtils.generateMigrationReport();
    
    console.log('\n📈 Migration Report:');
    console.log(`🕐 Generated: ${report.timestamp}`);
    console.log('\n📊 Statistics:');
    console.log(`  Redis entries: ${report.stats.redisCount}`);
    console.log(`  PostgreSQL entries: ${report.stats.postgresCount}`);
    console.log(`  Legacy format: ${report.stats.legacyCount}`);
    console.log(`  Enhanced format: ${report.stats.enhancedCount}`);
    
    console.log('\n✅ Validation:');
    console.log(`  Valid tenants: ${report.validation.valid.length}`);
    console.log(`  Invalid tenants: ${report.validation.invalid.length}`);
    
    if (report.validation.invalid.length > 0) {
      console.log('\n❌ Invalid tenants:');
      report.validation.invalid.forEach(invalid => {
        console.log(`  - ${invalid.subdomain}: ${invalid.errors.join(', ')}`);
      });
    }
    
    console.log('\n🔍 Integrity:');
    console.log(`  Consistent: ${report.integrity.consistent ? 'Yes' : 'No'}`);
    console.log(`  Redis-only: ${report.integrity.redisOnly.length}`);
    console.log(`  PostgreSQL-only: ${report.integrity.postgresOnly.length}`);
    console.log(`  Inconsistencies: ${report.integrity.inconsistencies.length}`);
    
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    process.exit(1);
  }
}

async function runMigration(): Promise<void> {
  console.log('🚀 Starting tenant migration...');
  
  try {
    const result = await TenantMigrationService.migrateAllTenants();
    
    console.log('\n📊 Migration Results:');
    console.log(`✅ Successfully migrated: ${result.migratedCount} tenants`);
    console.log(`⏭️  Skipped: ${result.skippedCount} tenants`);
    
    if (result.errors.length > 0) {
      console.log(`❌ Errors (${result.errors.length}):`);
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.success) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  console.log('🏢 Booqing Platform - Tenant Migration Tool\n');
  
  const options = await parseArgs();
  
  // Validate setup first
  const isValid = await validateSetup();
  if (!isValid) {
    process.exit(1);
  }
  
  try {
    if (options.dryRun) {
      await runDryRun();
    } else if (options.check) {
      await runIntegrityCheck();
    } else if (options.sync) {
      if (!options.subdomain) {
        console.error('❌ --subdomain is required when using --sync');
        process.exit(1);
      }
      await runSync(options.subdomain);
    } else if (options.test) {
      await runTests();
    } else if (options.backup) {
      await runBackup();
    } else if (options.cleanup) {
      await runCleanup();
    } else if (options.report) {
      await runReport();
    } else {
      // Default: run migration
      await runMigration();
    }
    
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  } finally {
    // Cleanup database connection
    const { disconnectDatabase } = await import('../lib/database');
    await disconnectDatabase();
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}