# WhatsApp Integration - Database Setup Guide

## Issue: Type Mismatch in Foreign Keys

The WhatsApp tables need to be created with **UUID** types to match the `tenants` table primary key type.

### Error Message
```
ERROR: 42804: foreign key constraint "whatsapp_endpoints_tenant_id_fkey" cannot be implemented
DETAIL: Key columns "tenant_id" and "id" are of incompatible types: text and uuid.
```

This occurs because:
- `tenants.id` is **UUID** type
- `whatsapp_endpoints.tenant_id` was defined as **TEXT** type
- PostgreSQL won't allow foreign keys between different types

## Solution

### Step 1: Run the Migration SQL

Execute the SQL script to recreate the tables with proper UUID types:

```sql
-- From: sql/whatsapp/fix-whatsapp-endpoints-types.sql
```

This will:
1. Drop existing `whatsapp_endpoints` and `tenant_whatsapp_config` tables (if they exist)
2. Recreate them with proper **UUID** types
3. Create appropriate indexes

### Step 2: Verify Tables

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check whatsapp_endpoints table
\d whatsapp_endpoints;

-- Check tenant_whatsapp_config table  
\d tenant_whatsapp_config;

-- Verify foreign key constraints
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name IN ('whatsapp_endpoints', 'tenant_whatsapp_config')
AND constraint_name LIKE '%fkey%';
```

### Step 3: Required Environment Variables

Ensure these are set in your `.env.local`:

```bash
# WhatsApp Integration (Server-Side Only)
WHATSAPP_ENDPOINTS=[
  {
    "name": "Primary",
    "apiUrl": "https://api.whatsapp-provider.com/v1",
    "apiKey": "your_api_key_here"
  }
]
```

## Table Schemas

### whatsapp_endpoints
- **id**: UUID (auto-generated)
- **tenant_id**: UUID (foreign key to tenants.id)
- **name**: TEXT (endpoint name)
- **api_url**: TEXT (WhatsApp API URL)
- **api_key**: TEXT (API key - stored securely)
- **webhook_url**: TEXT (callback URL)
- **webhook_secret**: TEXT (webhook signature secret)
- **is_active**: BOOLEAN
- **health_status**: TEXT (healthy|unhealthy|unknown)
- **last_health_check**: TIMESTAMP WITH TIME ZONE
- **created_at**: TIMESTAMP WITH TIME ZONE
- **updated_at**: TIMESTAMP WITH TIME ZONE

### tenant_whatsapp_config
- **id**: UUID (auto-generated)
- **tenant_id**: UUID (foreign key to tenants.id, UNIQUE)
- **endpoint_name**: TEXT (reference to endpoint name in ENV)
- **auto_reconnect**: BOOLEAN
- **reconnect_interval**: INTEGER (seconds)
- **health_check_interval**: INTEGER (seconds)
- **webhook_retries**: INTEGER
- **message_timeout**: INTEGER (seconds)
- **is_configured**: BOOLEAN
- **health_status**: TEXT
- **last_health_check**: TIMESTAMP WITH TIME ZONE
- **created_at**: TIMESTAMP WITH TIME ZONE
- **updated_at**: TIMESTAMP WITH TIME ZONE

## Security Notes

1. **API Keys**: Stored in database but should be encrypted at rest in Supabase
2. **Webhook Secret**: Used to verify webhook signatures from WhatsApp
3. **ENV Variables**: Actual WhatsApp credentials stored ONLY in server environment, never in database
4. **Frontend Access**: No credentials or sensitive data exposed to client/browser

## Testing the Setup

After applying migrations:

1. **In Supabase Admin (app/admin/tenants/[id]/whatsapp):**
   - Select an endpoint from available endpoints
   - Click "Assign Endpoint"
   - Should see success message

2. **In Tenant Admin (subdomain.booqing.my.id/admin/whatsapp):**
   - Navigate to WhatsApp integration
   - Should see "Endpoint Configuration" section
   - Endpoint details should display (no 500 error)

3. **Check Browser Console:**
   - No POST 500 errors for `/api/whatsapp/tenant-config/*`
   - Config should be successfully saved

## Troubleshooting

### Still Getting Type Errors?
1. Verify both tables were dropped: `DROP TABLE IF EXISTS whatsapp_endpoints CASCADE;`
2. Check `tenants.id` type: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='tenants' AND column_name='id';`
3. If `tenants.id` is TEXT, the migration SQL needs adjustment

### Endpoint Not Showing After Assignment?
1. Check `tenant_whatsapp_config` table: `SELECT * FROM tenant_whatsapp_config WHERE tenant_id = '...';`
2. Verify `endpoint_name` matches one in `WHATSAPP_ENDPOINTS` environment variable
3. Check server logs for validation errors

### Webhook Issues?
1. Verify `whatsapp_endpoints.webhook_secret` is populated
2. Check webhook_url format: `https://booqing.my.id/api/whatsapp/webhook/{tenantId}/{endpointId}`
3. Ensure firewall allows incoming webhooks from WhatsApp

## References

- Main endpoint configuration: `/app/api/whatsapp/tenant-config/[tenantId]/route.ts`
- Endpoint manager: `/lib/whatsapp/simplified-endpoint-manager.ts`
- Environment setup: `.env.example`
