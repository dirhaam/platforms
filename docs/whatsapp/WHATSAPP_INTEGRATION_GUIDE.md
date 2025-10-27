# WhatsApp Integration Guide

## Overview

BooQing WhatsApp integration allows tenants to send/receive messages via WhatsApp. Endpoints are securely configured via environment variables, not through the frontend, ensuring credentials never expose to the browser.

### Architecture: 1 Tenant = 1 Endpoint

- **Tenant A** → WhatsApp Endpoint A
- **Tenant B** → WhatsApp Endpoint B
- **Tenant C** → WhatsApp Endpoint C

(No primary/backup failover - simple 1-to-1 mapping)

---

## Security Model

### Credentials Storage (SECURE)
```
Credentials ONLY in ENV Variables (Server-side)
    ↓
Backend resolves endpoint from ENV
    ↓
Database stores ONLY endpoint name reference
    ↓
Frontend never sees credentials
```

### Why This is Secure
✅ API keys never exposed to frontend/browser
✅ Credentials not stored in database
✅ No plain-text password forms in UI
✅ Only superadmin can assign endpoints
✅ Credentials locked in server environment

---

## Setup Guide

### Step 1: Configure Environment Variables

Define WhatsApp endpoints in your server environment (`.env` or production):

```env
WHATSAPP_ENDPOINTS=[
  {
    "name": "Primary",
    "apiUrl": "https://api.whatsapp.example.com",
    "apiKey": "your_secret_api_key_here"
  },
  {
    "name": "Secondary",
    "apiUrl": "https://api2.whatsapp.example.com",
    "apiKey": "another_secret_key"
  }
]
```

**Format:**
- `name`: Display name for endpoint (e.g., "Primary", "Backup")
- `apiUrl`: WhatsApp API endpoint URL
- `apiKey`: Secret API key (NEVER expose to frontend)

### Step 2: Create Database Tables

Execute SQL migration in Supabase:

```sql
-- From: update-whatsapp-tables-secure.sql
-- Creates: tenant_whatsapp_config table
-- Stores: only endpoint assignments (no credentials)
```

```bash
# In Supabase SQL Editor, run:
CREATE TABLE IF NOT EXISTS tenant_whatsapp_config (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    endpoint_name TEXT NOT NULL,
    auto_reconnect BOOLEAN DEFAULT TRUE,
    reconnect_interval INTEGER DEFAULT 30,
    health_check_interval INTEGER DEFAULT 60,
    webhook_retries INTEGER DEFAULT 3,
    message_timeout INTEGER DEFAULT 30,
    is_configured BOOLEAN DEFAULT FALSE,
    health_status TEXT DEFAULT 'unknown',
    last_health_check TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 3: Superadmin Assigns Endpoint to Tenant

1. **Navigate:** Superadmin Dashboard → Tenants → Select Tenant
2. **Click:** "WhatsApp Setup" button
3. **Select:** Endpoint from dropdown (shows endpoint names only, NOT credentials)
4. **Save:** Click "Assign Endpoint"
5. **Result:** Endpoint assigned to tenant in database

**What Gets Stored:**
- Tenant ID
- Endpoint Name (e.g., "Primary")
- Configuration settings

**What Does NOT Get Stored:**
- API URL
- API Key
- Any credentials

### Step 4: Tenant User Creates Devices

1. **Navigate:** `[subdomain].booqing.my.id/admin/whatsapp`
2. **View:** Assigned endpoint status
3. **Create Device:** Click "Add Device"
4. **Scan:** QR code with WhatsApp
5. **Connected:** Device ready to send/receive messages

---

## API Endpoints

### Get Available Endpoints
```http
GET /api/whatsapp/available-endpoints
```
**Response:**
```json
{
  "endpoints": ["Primary", "Secondary"],
  "count": 2
}
```
**Note:** Returns endpoint NAMES only, NO credentials

### Get Tenant Configuration
```http
GET /api/whatsapp/tenant-config/[tenantId]
```
**Response:**
```json
{
  "config": {
    "id": "cfg_123",
    "tenant_id": "tenant_abc",
    "endpoint_name": "Primary",
    "is_configured": true,
    "health_status": "healthy",
    "auto_reconnect": true,
    "reconnect_interval": 30
  }
}
```

### Assign Endpoint to Tenant
```http
POST /api/whatsapp/tenant-config/[tenantId]
Content-Type: application/json

{
  "endpoint_name": "Primary"
}
```
**Response:**
```json
{
  "config": {
    "endpoint_name": "Primary",
    "is_configured": true,
    "health_status": "unknown"
  }
}
```

### Remove Endpoint from Tenant
```http
DELETE /api/whatsapp/tenant-config/[tenantId]
```
**Response:**
```json
{
  "success": true
}
```

---

## File Structure

### Environment Manager
```
lib/whatsapp/env-endpoint-manager.ts
├── loadFromEnv()           // Loads endpoints from WHATSAPP_ENDPOINTS
├── getAvailableEndpoints() // Returns endpoint names only
├── getEndpointConfig()     // Returns credentials (server-side only)
├── getEndpointMetadata()   // Returns name & URL only (safe for API)
└── isValidEndpoint()       // Validates endpoint exists
```

### API Endpoints
```
app/api/whatsapp/
├── available-endpoints/route.ts
│   └── GET: List endpoint names
├── tenant-config/[tenantId]/route.ts
│   ├── GET: Get tenant configuration
│   ├── POST: Assign endpoint
│   └── DELETE: Remove endpoint
└── devices/...             // Device management (separate)
```

### UI Components
```
app/admin/tenants/[id]/whatsapp/
├── page.tsx               // Server component (auth check)
└── content.tsx            // Client component (assignment UI)
    └── Secure dropdown selector (no credential forms)
```

### Database Tables
```
tenant_whatsapp_config
├── id
├── tenant_id (unique)
├── endpoint_name (reference only)
├── is_configured
├── health_status
├── auto_reconnect
├── reconnect_interval
└── created_at / updated_at
```

---

## Workflow Diagrams

### Setup Flow (Superadmin)
```
Superadmin Login
    ↓
Navigate to /admin/tenants
    ↓
Select Tenant
    ↓
Click "WhatsApp Setup"
    ↓
Select Endpoint from dropdown
    ↓
Click "Assign"
    ↓
GET /api/whatsapp/available-endpoints
    ↓
POST /api/whatsapp/tenant-config/[tenantId]
    ↓
Database: Save endpoint_name reference
    ↓
✓ Success: "Endpoint assigned"
```

### Device Creation Flow (Tenant)
```
Tenant Admin Login
    ↓
Navigate to /admin/whatsapp
    ↓
GET /api/whatsapp/tenant-config/[tenantId]
    ↓
Backend: Resolve endpoint_name → credentials from ENV
    ↓
Display: Endpoint status & health
    ↓
Click "Add Device"
    ↓
Generate QR Code
    ↓
Scan with WhatsApp
    ↓
✓ Device Connected
    ↓
Ready to send/receive messages
```

### Message Flow (Runtime)
```
Tenant sends message via device
    ↓
Backend retrieves: endpoint_name from database
    ↓
Backend looks up: credentials from ENV
    ↓
Backend calls: WhatsApp API with credentials
    ↓
Message sent/received
    ↓
Webhook received in backend
    ↓
Store message in conversations/messages tables
```

---

## Security Best Practices

### DO ✅
- Store credentials ONLY in ENV variables
- Use production secrets manager (AWS Secrets Manager, etc.)
- Rotate API keys regularly
- Audit endpoint assignments
- Log API calls for monitoring
- Use HTTPS for all endpoints
- Validate endpoint_name before processing

### DON'T ❌
- Never store API keys in database
- Never send credentials to frontend
- Never hardcode passwords in code
- Never expose ENV in error messages
- Never log full API keys in console
- Never allow users to input API endpoints
- Never disable endpoint validation

---

## Configuration Examples

### Development Environment
```env
NODE_ENV=development
WHATSAPP_ENDPOINTS=[
  {
    "name": "Dev",
    "apiUrl": "http://localhost:3000/mock-whatsapp",
    "apiKey": "dev_test_key"
  }
]
```

### Production Environment
```env
NODE_ENV=production
WHATSAPP_ENDPOINTS=[
  {
    "name": "Primary",
    "apiUrl": "https://api.whatsapp-provider.com/v1",
    "apiKey": "$(AWS_SECRET:whatsapp/primary/key)"
  },
  {
    "name": "Secondary",
    "apiUrl": "https://api2.whatsapp-provider.com/v1",
    "apiKey": "$(AWS_SECRET:whatsapp/secondary/key)"
  }
]
```

### Multi-Region
```env
WHATSAPP_ENDPOINTS=[
  {
    "name": "Asia-Primary",
    "apiUrl": "https://asia.whatsapp.example.com",
    "apiKey": "key_asia_primary"
  },
  {
    "name": "Europe-Primary",
    "apiUrl": "https://europe.whatsapp.example.com",
    "apiKey": "key_europe_primary"
  }
]
```

---

## Troubleshooting

### Issue: "No endpoints available"
**Cause:** `WHATSAPP_ENDPOINTS` not set or invalid JSON
**Solution:**
1. Check `.env` file contains `WHATSAPP_ENDPOINTS`
2. Validate JSON format: `[{...}]`
3. Restart server after changing ENV

### Issue: "Endpoint not found"
**Cause:** Endpoint name in dropdown doesn't match ENV
**Solution:**
1. Verify endpoint_name in ENV matches exactly
2. Check for typos or case sensitivity
3. Reload page to refresh endpoint list

### Issue: "Failed to create device"
**Cause:** Endpoint credentials invalid or API down
**Solution:**
1. Test API endpoint directly: `curl https://api.whatsapp.com/health`
2. Verify API key is correct
3. Check API rate limits
4. Review server logs for details

### Issue: "Health status unknown"
**Cause:** API connection not tested yet
**Solution:**
1. Wait for health check interval (60 seconds default)
2. Check backend logs for health check failures
3. Verify API endpoint is reachable from server

---

## Development Notes

### Class: EnvEndpointManager
- **Location:** `lib/whatsapp/env-endpoint-manager.ts`
- **Singleton pattern** - One instance per application
- **Loads endpoints on initialization** from `WHATSAPP_ENDPOINTS`
- **Methods marked for server-side use only**
- **Never expose `getEndpointConfig()` result to frontend**

### API Route: `/api/whatsapp/available-endpoints`
- Returns ONLY endpoint names
- Safe to expose to frontend
- Used for dropdown rendering
- Cached in state (refreshed on page load)

### API Route: `/api/whatsapp/tenant-config/[tenantId]`
- GET: Fetch current configuration
- POST: Update endpoint assignment
- DELETE: Remove configuration
- Validates endpoint exists before saving
- Database-backed persistence

---

## Migration Guide (From Old Approach)

If migrating from database-stored credentials:

```sql
-- Step 1: Create new table
CREATE TABLE tenant_whatsapp_config (...)

-- Step 2: Migrate data
INSERT INTO tenant_whatsapp_config (tenant_id, endpoint_name, ...)
SELECT tenant_id, name AS endpoint_name, ...
FROM whatsapp_endpoints;

-- Step 3: Verify migration
SELECT * FROM tenant_whatsapp_config;

-- Step 4: Set ENV variables for all endpoints
WHATSAPP_ENDPOINTS=[...]

-- Step 5: Delete old table (after verification)
DROP TABLE whatsapp_endpoints;
```

---

## Support & Monitoring

### Health Check Monitoring
- Monitor: `health_status` column in `tenant_whatsapp_config`
- Check: Last health check timestamp
- Alert: If status = 'unhealthy' for > 5 minutes

### Logging
- Log all endpoint assignments
- Log all API calls (without credentials)
- Log health check failures
- Monitor rate limiting from API

### Metrics to Track
- Endpoints configured per tenant
- Health status distribution
- API response times
- Device connection success rate
- Message delivery success rate

---

## Version History

### v1.0 (Current)
- Environment-based secure endpoint configuration
- Database-backed tenant assignments
- Simple dropdown UI for endpoint selection
- No credentials stored in database
- Superadmin assignment workflow

---

## Related Files

- `.env.example` - Environment variables template
- `update-whatsapp-tables-secure.sql` - Database migrations
- `lib/whatsapp/env-endpoint-manager.ts` - Endpoint manager
- `app/api/whatsapp/available-endpoints/route.ts` - List endpoints
- `app/api/whatsapp/tenant-config/[tenantId]/route.ts` - Config management
- `app/admin/tenants/[id]/whatsapp/content.tsx` - Admin UI
- `app/admin/whatsapp/content.tsx` - WhatsApp dashboard

---

**Last Updated:** 2025-10-23
**Author:** Factory Assistant
**Status:** Production Ready
