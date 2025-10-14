# Migration Documentation: From Cloudflare D1 to Supabase

## Overview
This document outlines the process of migrating from Cloudflare D1 to Supabase due to connectivity issues with Vercel deployments.

## Prerequisites
- Supabase account
- Vercel account with project access
- Project source code access

## Migration Steps

### 1. Project Analysis
- Identify current D1 database schema
- List all database operations in the codebase
- Document current environment variables

### 2. Supabase Setup
- Create a new Supabase project
- Note down the Project URL and API key
- Set up the database schema matching your current D1 schema

### 3. Data Migration
- Export data from existing D1 database
- Import data to Supabase database
- Verify data integrity

### 4. Codebase Updates

#### 4.1 Environment Variables
Replace Cloudflare D1 variables with Supabase variables:
- Remove: `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `DATABASE_ID`
- Add: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 4.2 Dependencies
Update package.json:
- Remove: `@cloudflare/workers-types`
- Add: `@supabase/supabase-js`

#### 4.3 Database Client Implementation
Replace D1 database calls with Supabase client calls throughout the codebase.

#### 4.4 Configuration Files
Update configuration files:
- Update `drizzle.config.ts` to use Supabase instead of D1
- Modify `middleware.ts` if it interacts with the database

### 5. Testing
- Test database operations locally
- Verify all CRUD operations work correctly
- Check for any performance differences

### 6. Deployment
- Update Vercel environment variables
- Deploy the updated application
- Monitor for any post-deployment issues

## Key Changes Required

### Database Client
Replace Cloudflare D1 client with Supabase client:
```javascript
// Before (Cloudflare D1)
const database = env.DB

// After (Supabase)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

### SQL Queries
- Adapt queries to be PostgreSQL compatible (Supabase uses PostgreSQL)
- Update query syntax if needed (D1 uses SQLite syntax)

## Rollback Plan
If issues occur after deployment:
1. Revert environment variables to previous values
2. Revert code changes
3. Redeploy previous version

## Post-Migration Verification
- Confirm all application features are working
- Verify database read/write operations
- Check application logs for errors
- Validate data integrity

This documentation provides a clear path for migrating from Cloudflare D1 to Supabase, solving the Vercel connectivity issues.