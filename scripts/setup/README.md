# Setup Scripts

This folder contains setup and initialization scripts for the project.

## Scripts Overview:

### **Database & Admin Setup**
- `create-admin.js` - Create admin users
- `add-admin-database.js` - Add admin to database
- `quick-admin-setup.js` - Quick admin setup
- `setup-supabase-admin.js` - Setup Supabase admin
- `setup-production.js` - Production setup
- `create-super-admin.sql` - SQL for super admin creation

### **Utility Scripts**
- `generate-password.js` - Generate secure passwords
- `check-vercel-env.js` - Check Vercel environment variables

## Usage:

Run these scripts from the project root:

```bash
node scripts/setup/quick-admin-setup.js
node scripts/setup/create-admin.js
node scripts/setup/setup-production.js
node scripts/setup/check-vercel-env.js
```

## SQL Scripts:

Run SQL scripts from the project root:

```bash
# Using psql
psql $DATABASE_URL -f scripts/setup/create-super-admin.sql

# Or use Supabase Dashboard SQL Editor
```

## Notes:

- These scripts modify database data
- Make sure to backup before running
- Check environment variables before running
- Some scripts require elevated permissions
