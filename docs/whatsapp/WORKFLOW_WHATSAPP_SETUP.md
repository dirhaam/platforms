# WhatsApp Endpoint Setup Workflow

## 🎯 High-Level Overview

```
SUPERADMIN                 BACKEND API              DATABASE              TENANT ADMIN
     ↓                          ↓                        ↓                      ↓
   [1] Load page              ──→ Fetch endpoints   Read ENV
     ↓                                              ↓
   [2] Select endpoint        ──→ Validate
     ↓                          ↓
   [3] Click Assign          ──→ POST request        ↓
                               ├─ Resolve tenant ID
                               ├─ Get config from ENV
                               ├─ Sync to whatsapp_endpoints ──→ INSERT/UPDATE
                               ├─ Save to tenant_whatsapp_config ──→ INSERT/UPDATE
                               ├─ Update KV cache
                               └─ Return response
                               ↓
                          Success! ←──────────────────────────────→ See endpoint details
```

---

## 📍 PHASE 1: Admin Loads Page

**Location**: `/admin/tenants/{tenantId}/whatsapp`

**Code**: `app/admin/tenants/[id]/whatsapp/content.tsx`

```typescript
useEffect(() => {
  // [1] Fetch available endpoints from ENV
  fetch('/api/whatsapp/available-endpoints')
  // Returns: { endpoints: ["Primary", "Secondary"] }
  
  // [2] Fetch current tenant config (if exists)
  fetch(`/api/whatsapp/tenant-config/{tenantId}`)
  // Returns: { config: { endpoint_name: "Primary", is_configured: true } }
}, [tenant.id]);
```

**What Happens**:
- Load dropdown dengan endpoint names dari ENV
- Load current assignment (if any) dari database
- Display UI dengan current status

---

## 📍 PHASE 2: Admin Selects Endpoint

**Code**: `app/admin/tenants/[id]/whatsapp/content.tsx`

```typescript
const handleAssignEndpoint = async () => {
  // POST request dengan endpoint name
  const res = await fetch(`/api/whatsapp/tenant-config/${tenant.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint_name: "Primary" })
  });
  
  // Handle response
  if (res.ok) {
    // Show success
    setSuccess('Endpoint assigned successfully!');
  }
};
```

**What User Does**:
1. Select "Primary" dari dropdown
2. Click "Assign Endpoint" button
3. Wait untuk POST selesai
4. See success message

---

## 📍 PHASE 3: Backend Processes (API Route)

**Location**: `/api/whatsapp/tenant-config/[tenantId]`

**Code**: `app/api/whatsapp/tenant-config/[tenantId]/route.ts` - POST handler

### Step 3a: Resolve Tenant ID
```typescript
const { resolved: resolvedTenantId } = await resolveTenantId(tenantId);

// If tenantId is "salon1" (subdomain):
//   → Query: SELECT id FROM tenants WHERE subdomain = 'salon1'
//   → Return: "c9d49197-317d-4d28-8fc3-fb4b2a717da0" (UUID)

// If tenantId is UUID already:
//   → Return as-is
```

**Purpose**: Support both Admin (UUID) and Tenant (subdomain) requests

### Step 3b: Validate Endpoint
```typescript
const { endpoint_name } = await request.json(); // "Primary"

if (!envEndpointManager.isValidEndpoint(endpoint_name)) {
  // Error: endpoint not in ENV
  return { error: 'Endpoint not found' };
}

const endpointConfig = envEndpointManager.getEndpointConfig(endpoint_name);
// Result: { name: "Primary", apiUrl: "...", apiKey: "..." }
```

**Purpose**: Check if endpoint exists in WHATSAPP_ENDPOINTS ENV

### Step 3c: Sync to Database (whatsapp_endpoints table)
```typescript
const syncTenantEndpoint = async (tenantId, endpointConfig) => {
  const endpointData = {
    id: uuid_generate_v4(),           // Auto-generate new UUID
    tenant_id: tenantId,
    name: "Primary",
    api_url: "https://api.wa...",
    api_key: "secret-key",            // From ENV
    webhook_url: "https://booqing.my.id/api/whatsapp/webhook/{id}",
    webhook_secret: randomUUID(),     // For signature verification
    is_active: true,
    health_status: 'unknown',
    last_health_check: now()
  };
  
  // Save to database
  await whatsappEndpointManager.setEndpoint(tenantId, endpointData);
};
```

**Database**: `whatsapp_endpoints` table
```sql
INSERT INTO whatsapp_endpoints (
  id, tenant_id, name, api_url, api_key, webhook_url, webhook_secret, 
  is_active, health_status, created_at, updated_at
) VALUES (...)
```

### Step 3d: Save Config (tenant_whatsapp_config table)
```typescript
const configData = {
  tenant_id: resolvedTenantId,
  endpoint_name: "Primary",           // Reference to ENV
  is_configured: true,                // ✓ NOW CONFIGURED
  health_status: 'unknown',
  auto_reconnect: true,
  reconnect_interval: 30,             // seconds
  health_check_interval: 60,          // seconds
  webhook_retries: 3,
  message_timeout: 30,                // seconds
  updated_at: now()
};

// Insert/Update in database
await supabase.from('tenant_whatsapp_config').upsert(configData);
```

**Database**: `tenant_whatsapp_config` table
- Marks tenant as "configured"
- Stores settings for auto-reconnect, health checks, etc.

### Step 3e: Update Cache
```typescript
// Save to KV cache for faster access
const configKey = `whatsapp:config:${tenantId}`;
await kvSet(configKey, {
  tenantId,
  endpoint: newEndpoint,
  autoReconnect: true,
  reconnectInterval: 30,
  healthCheckInterval: 60,
  webhookRetries: 3,
  messageTimeout: 30,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### Step 3f: Return Response
```typescript
return NextResponse.json({
  config: {
    id: 'uuid-456',
    tenant_id: 'c9d49197...',
    endpoint_name: 'Primary',
    is_configured: true,
    health_status: 'unknown',
    ...
  },
  endpoint: {
    id: 'uuid-123',
    name: 'Primary',
    apiUrl: 'https://...',
    webhookUrl: 'https://booqing.my.id/api/whatsapp/webhook/...'
  }
}, { status: 201 });
```

---

## 📍 PHASE 4: Admin Sees Success

**Location**: `/admin/tenants/{tenantId}/whatsapp`

Frontend updates UI:
```
✓ ENDPOINT CONFIGURATION
├─ Endpoint Name: Primary
├─ Status: Unknown (checking...)
├─ Last Health Check: just now
└─ [Remove Endpoint] button
```

---

## 📍 PHASE 5: Tenant Admin Sees Configuration

**Location**: `salon1.booqing.my.id/admin/whatsapp`

**Code**: `app/tenant/admin/whatsapp/content.tsx`

```typescript
// Tenant load their config
const configRes = await fetch(`/api/whatsapp/tenant-config/${subdomain}`);
// Uses "salon1" (subdomain)

// API resolves to UUID internally
// Returns config from database

if (configData.config?.is_configured) {
  // Show endpoint details
  setEndpoint({
    name: "Primary",
    status: "healthy",  // or "unknown"
    lastCheck: "2025-10-25 10:15:30"
  });
}
```

**Tenant Sees**:
```
✓ ENDPOINT CONFIGURATION
├─ Name: Primary
├─ Status: Healthy ✓
└─ Last Check: 2025-10-25 10:15:30

+ ADD DEVICE
  Device 1: Main Phone (Connected)
  Device 2: Backup (Disconnected)
```

---

## 🔐 Data Storage & Security

### ENV Variables (Server Only)
```bash
WHATSAPP_ENDPOINTS=[
  {
    "name": "Primary",
    "apiUrl": "https://api.wa-provider.com",
    "apiKey": "xxxxxxxxxxxxx"  ← NEVER exposed to client
  }
]
```

**Rule**: Never send API keys to frontend!

### Database (Encrypted at Rest)

**Table 1: whatsapp_endpoints**
```
id (UUID)           | Auto-generated
tenant_id (UUID)    | FK → tenants.id
name (TEXT)         | "Primary"
api_url (TEXT)      | "https://..."
api_key (TEXT)      | "xxxxx" (encrypted in DB)
webhook_url (TEXT)  | "https://booqing.my.id/api/whatsapp/webhook/..."
webhook_secret      | UUID for signature verification
is_active           | true/false
health_status       | "healthy" | "unhealthy" | "unknown"
created_at          | Timestamp
updated_at          | Timestamp
```

**Table 2: tenant_whatsapp_config**
```
id (UUID)           | Auto-generated
tenant_id (UUID)    | FK → tenants.id (UNIQUE)
endpoint_name       | "Primary" (reference to ENV)
is_configured       | true/false ← KEY FIELD
auto_reconnect      | true
reconnect_interval  | 30 (seconds)
health_check_interval | 60 (seconds)
webhook_retries     | 3
message_timeout     | 30 (seconds)
health_status       | "healthy" | "unhealthy" | "unknown"
created_at          | Timestamp
updated_at          | Timestamp
```

### In-Memory Cache (KV Store)
```
Key: "whatsapp:config:{tenantId}"
Value: { tenantId, endpoint, autoReconnect, ... }
TTL: Expires when updated
Purpose: Fast access, reduce DB queries
```

---

## 🔄 Request Flow Sequence

```
1. Admin UI
   ↓
2. Load page
   ├─ GET /api/whatsapp/available-endpoints
   │  └─ Read ENV, return ["Primary", "Secondary"]
   └─ GET /api/whatsapp/tenant-config/{tenantId}
      └─ Query DB, return current config or null

3. Admin selects endpoint
   ↓
4. Admin clicks "Assign"
   ├─ POST /api/whatsapp/tenant-config/{tenantId}
   │  body: { endpoint_name: "Primary" }
   │
   └─ Backend processes:
      ├─ [1] Resolve: "tenantId" → UUID
      ├─ [2] Validate: "Primary" exists in ENV
      ├─ [3] Get: endpoint config from ENV
      ├─ [4] Sync: save to whatsapp_endpoints table
      ├─ [5] Config: save to tenant_whatsapp_config table
      ├─ [6] Cache: update KV store
      └─ [7] Response: return config + endpoint

5. Success message
   ↓
6. Tenant admin checks page
   ├─ GET /api/whatsapp/tenant-config/{subdomain}
   │  └─ Resolve "salon1" → UUID
   │  └─ Query DB
   └─ See endpoint configuration ✓
```

---

## ✅ Requirements Checklist

Before workflow works:

- [ ] **Database**: Tables created with UUID types
  ```sql
  -- Run: sql/whatsapp/fix-whatsapp-endpoints-types.sql
  ```

- [ ] **Environment**: WHATSAPP_ENDPOINTS set
  ```bash
  WHATSAPP_ENDPOINTS=[{"name":"Primary","apiUrl":"...","apiKey":"..."}]
  ```

- [ ] **Type Matching**: Column types match
  ```
  tenants.id = UUID
  whatsapp_endpoints.tenant_id = UUID (FK)
  tenant_whatsapp_config.tenant_id = UUID (FK)
  ```

- [ ] **Indexes**: Created for performance
  ```sql
  CREATE INDEX idx_whatsapp_endpoints_tenant_id ON whatsapp_endpoints(tenant_id);
  ```

- [ ] **Credentials**: API keys encrypted at rest

---

## 🐛 Quick Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Endpoint not found" | endpoint_name not in ENV | Add to WHATSAPP_ENDPOINTS |
| POST 500 error | Date serialization | Already fixed in code |
| Foreign key error | Column type mismatch | Run sql/whatsapp/fix-whatsapp-endpoints-types.sql |
| "Not configured" | is_configured = false | Check tenant_whatsapp_config table |
| Subdomain doesn't resolve | Query failed | Check tenants table subdomain column |

---

## 📝 Files Reference

| File | Purpose |
|------|---------|
| `app/admin/tenants/[id]/whatsapp/content.tsx` | Admin UI |
| `app/tenant/admin/whatsapp/content.tsx` | Tenant UI |
| `app/api/whatsapp/tenant-config/[tenantId]/route.ts` | API handler (GET/POST/DELETE) |
| `lib/whatsapp/env-endpoint-manager.ts` | Read endpoints from ENV |
| `lib/whatsapp/simplified-endpoint-manager.ts` | Manage DB + cache |
| `sql/whatsapp/fix-whatsapp-endpoints-types.sql` | Database migration |

---

Ende workflow dokumentasi! 🎉
