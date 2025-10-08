import { NextRequest, NextResponse } from 'next/server';
import { TenantMigrationService } from '@/lib/migration/tenant-migration';
import { MigrationUtils } from '@/lib/migration/migration-utils';
import { MigrationTests } from '@/lib/migration/migration-tests';
import { checkDatabaseConnection } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'check':
        const integrityResult = await TenantMigrationService.checkDataIntegrity();
        return NextResponse.json({
          success: true,
          data: integrityResult,
        });

      case 'status':
        const dbConnected = await checkDatabaseConnection();
        return NextResponse.json({
          success: true,
          data: {
            databaseConnected: dbConnected,
            timestamp: new Date().toISOString(),
          },
        });

      case 'stats':
        const stats = await MigrationUtils.getMigrationStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });

      case 'report':
        const report = await MigrationUtils.generateMigrationReport();
        return NextResponse.json({
          success: true,
          data: report,
        });

      case 'test':
        const testResults = await MigrationTests.runAllTests();
        return NextResponse.json({
          success: testResults.success,
          data: testResults,
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use ?action=check, ?action=status, ?action=stats, ?action=report, or ?action=test',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, subdomain } = body;

    switch (action) {
      case 'migrate':
        const migrationResult = await TenantMigrationService.migrateAllTenants();
        return NextResponse.json({
          success: migrationResult.success,
          data: migrationResult,
        });

      case 'sync':
        if (!subdomain) {
          return NextResponse.json({
            success: false,
            error: 'Subdomain is required for sync action',
          }, { status: 400 });
        }

        await TenantMigrationService.syncTenantData(subdomain);
        return NextResponse.json({
          success: true,
          message: `Successfully synced tenant: ${subdomain}`,
        });

      case 'backup':
        const backupResult = await MigrationUtils.backupRedisData();
        return NextResponse.json({
          success: backupResult.success,
          data: backupResult.success ? {
            entryCount: Object.keys(backupResult.backupData || {}).length,
            timestamp: new Date().toISOString(),
          } : undefined,
          error: backupResult.error,
        });

      case 'cleanup':
        const cleanupResult = await MigrationUtils.cleanupOrphanedData();
        return NextResponse.json({
          success: cleanupResult.success,
          data: {
            cleaned: cleanupResult.cleaned,
            cleanedCount: cleanupResult.cleaned.length,
            errors: cleanupResult.errors,
          },
        });

      case 'validate':
        const validation = await MigrationUtils.validateAllTenantData();
        return NextResponse.json({
          success: true,
          data: validation,
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use migrate, sync, backup, cleanup, or validate',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}