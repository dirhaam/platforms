# Tenant Data Migration System

This migration system handles the transition of tenant data from Redis to PostgreSQL while maintaining backward compatibility and data integrity.

## Overview

The migration system consists of several components:

- **TenantMigrationService**: Core migration logic
- **MigrationUtils**: Utility functions for migration operations
- **MigrationTests**: Comprehensive testing suite
- **TenantValidation**: Data validation and sanitization
- **Migration Script**: Command-line interface for migration operations
- **API Routes**: Web interface for migration management

## Features

### ✅ Data Migration
- Migrate all tenant data from Redis to PostgreSQL
- Handle both legacy and enhanced tenant data formats
- Preserve data integrity during migration
- Support for single tenant migration

### ✅ Backward Compatibility
- Automatic fallback to Redis when PostgreSQL data is unavailable
- On-the-fly migration of legacy data
- Seamless transition for existing applications

### ✅ Data Validation
- Comprehensive validation of tenant data
- Sanitization of input data
- Business logic validation
- Format validation (email, phone, subdomain)

### ✅ Data Integrity
- Consistency checks between Redis and PostgreSQL
- Orphaned data cleanup
- Data backup and restore capabilities
- Comprehensive reporting

### ✅ Testing
- Automated migration tests
- Database connectivity tests
- Data validation tests
- Backward compatibility tests

## Usage

### Command Line Interface

```bash
# Run migration
npx tsx scripts/migrate-tenants.ts

# Dry run (show what would be migrated)
npx tsx scripts/migrate-tenants.ts --dry-run

# Check data integrity
npx tsx scripts/migrate-tenants.ts --check

# Run comprehensive tests
npx tsx scripts/migrate-tenants.ts --test

# Generate migration report
npx tsx scripts/migrate-tenants.ts --report

# Create backup
npx tsx scripts/migrate-tenants.ts --backup

# Clean up orphaned data
npx tsx scripts/migrate-tenants.ts --cleanup

# Sync specific tenant
npx tsx scripts/migrate-tenants.ts --sync --subdomain example
```

### API Interface

```javascript
// Check migration status
GET /api/admin/migration?action=status

// Get migration statistics
GET /api/admin/migration?action=stats

// Check data integrity
GET /api/admin/migration?action=check

// Generate migration report
GET /api/admin/migration?action=report

// Run tests
GET /api/admin/migration?action=test

// Run migration
POST /api/admin/migration
{
  "action": "migrate"
}

// Sync specific tenant
POST /api/admin/migration
{
  "action": "sync",
  "subdomain": "example"
}

// Create backup
POST /api/admin/migration
{
  "action": "backup"
}

// Clean up orphaned data
POST /api/admin/migration
{
  "action": "cleanup"
}

// Validate all data
POST /api/admin/migration
{
  "action": "validate"
}
```

### Programmatic Usage

```typescript
import { TenantMigrationService } from '@/lib/migration/tenant-migration';
import { MigrationUtils } from '@/lib/migration/migration-utils';
import { MigrationTests } from '@/lib/migration/migration-tests';

// Migrate all tenants
const result = await TenantMigrationService.migrateAllTenants();

// Get migration statistics
const stats = await MigrationUtils.getMigrationStats();

// Run tests
const testResults = await MigrationTests.runAllTests();

// Check data integrity
const integrity = await TenantMigrationService.checkDataIntegrity();

// Get tenant data with fallback
const tenantData = await TenantMigrationService.getSubdomainDataWithFallback('example');
```

## Data Flow

### Legacy Data Format (Redis)
```typescript
interface LegacySubdomainData {
  subdomain: string;
  emoji: string;
  createdAt: number;
}
```

### Enhanced Data Format (PostgreSQL)
```typescript
interface EnhancedTenant {
  id: string;
  subdomain: string;
  emoji: string;
  createdAt: number;
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  // ... additional fields
}
```

## Migration Process

1. **Validation**: Validate all tenant data before migration
2. **Backup**: Create backup of Redis data
3. **Migration**: Migrate data from Redis to PostgreSQL
4. **Verification**: Verify migration success
5. **Cleanup**: Clean up orphaned data (optional)

## Error Handling

The migration system includes comprehensive error handling:

- **Validation Errors**: Invalid data format or missing required fields
- **Connection Errors**: Database or Redis connectivity issues
- **Migration Errors**: Failures during data migration
- **Integrity Errors**: Data inconsistencies between systems

## Monitoring

### Migration Statistics
- Redis entry count
- PostgreSQL entry count
- Legacy vs enhanced data count
- Migration success/failure rates

### Data Integrity Checks
- Consistency between Redis and PostgreSQL
- Orphaned data detection
- Data validation results

### Test Results
- Database connectivity
- Migration process validation
- Backward compatibility verification

## Best Practices

1. **Always run tests before migration**: Use `--test` flag
2. **Create backups**: Use `--backup` flag before migration
3. **Use dry-run first**: Use `--dry-run` to preview changes
4. **Monitor integrity**: Regular integrity checks with `--check`
5. **Clean up after migration**: Use `--cleanup` to remove orphaned data

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL environment variable
   - Ensure PostgreSQL is running
   - Verify database credentials

2. **Redis Connection Failed**
   - Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
   - Verify Redis service availability

3. **Migration Validation Failed**
   - Check data format in Redis
   - Ensure required fields are present
   - Validate business logic constraints

4. **Data Inconsistency**
   - Run integrity check: `--check`
   - Use sync for specific tenants: `--sync --subdomain example`
   - Consider re-migration if necessary

### Debug Mode

Set environment variable for detailed logging:
```bash
NODE_ENV=development npx tsx scripts/migrate-tenants.ts
```

## Security Considerations

- All data is validated and sanitized before storage
- Database connections use connection pooling
- Sensitive data is handled securely
- Audit trails are maintained for all operations

## Performance

- Batch operations for large datasets
- Connection pooling for database operations
- Efficient Redis operations with pipelines
- Progress tracking for long-running operations