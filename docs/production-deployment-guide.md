# Production Deployment and Migration Verification Guide

## Pre-deployment Checklist

1. **Database Setup**
   - Ensure Supabase project is created and configured
   - Run the schema using the file: `supabase/schema.sql`
   - Verify the schema is correctly applied

2. **Environment Variables**
   - Add to your Vercel project:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
     - `DATABASE_URL`: PostgreSQL connection string for direct access

3. **Data Migration**
   - If you had data in Cloudflare D1, you'll need to migrate it to Supabase
   - Use Supabase's import functionality or write a custom migration script

## Deployment Steps

1. **Update Vercel Environment Variables**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add the Supabase environment variables under "Environment Variables"

2. **Deploy the Updated Application**
   ```bash
   git add .
   git commit -m "Migrate from Cloudflare D1 to Supabase"
   git push origin main  # or your production branch
   ```

3. **Monitor the Deployment**
   - Check Vercel dashboard for successful deployment
   - Verify there are no build errors

## Post-Deployment Verification

1. **Health Check API**
   - Test `/api/admin/monitoring` endpoint
   - Verify database connection status

2. **Functional Testing**
   - Test tenant creation
   - Verify session management
   - Check cache operations
   - Ensure all database operations work as expected

3. **Performance Monitoring**
   - Monitor response times
   - Check for any slow queries
   - Verify cache hit rates

## Rollback Plan

If issues occur after deployment:

1. **Immediate Actions**
   - Rollback to previous version in Vercel
   - Restore Cloudflare D1 configuration if needed

2. **Data Safety**
   - Your Supabase data remains safe during rollback
   - Changes only affect application logic, not data integrity

## Known Considerations

1. **Query Differences**
   - PostgreSQL syntax differs from SQLite
   - Some queries may need adjustment
   - JSON operations work differently in PostgreSQL

2. **Performance**
   - PostgreSQL may have different performance characteristics
   - Monitor query performance after migration

3. **Connection Management**
   - PostgreSQL connections are managed differently than D1
   - Connection pooling is handled by the `pg` library

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM PostgreSQL Guide](https://orm.drizzle.team/docs/get-started-postgresql)
- [Vercel PostgreSQL Guide](https://vercel.com/docs/storage/vercel-postgres)

## Migration Complete

Once verified, the application will be fully migrated from Cloudflare D1 to Supabase, resolving the Vercel connectivity issues that prompted this migration.