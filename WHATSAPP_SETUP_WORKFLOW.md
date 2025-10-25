# WhatsApp Endpoint Setup Workflow

Dokumen ini menjelaskan alur workflow setup endpoint WhatsApp dari A sampai Z.

---

## 🏗️ ARSITEKTUR SYSTEM

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ENVIRONMENT VARIABLES                       │
│                                                                     │
│  WHATSAPP_ENDPOINTS=[                                              │
│    {"name":"Primary","apiUrl":"...","apiKey":"..."},              │
│    {"name":"Secondary","apiUrl":"...","apiKey":"..."}             │
│  ]                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPERADMIN DASHBOARD                           │
│              (app/admin/tenants/[id]/whatsapp)                     │
│                                                                     │
│  ✓ Pilih Endpoint dari Dropdown                                    │
│  ✓ Click "Assign Endpoint"                                         │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  POST API CALL (ASSIGN ENDPOINT)                   │
│         /api/whatsapp/tenant-config/[tenantId]                   │
│                  { endpoint_name: "Primary" }                      │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
        ┌──────────────────────────────────────────────┐
        │    BACKEND PROCESSING (API Route Handler)    │
        │  app/api/whatsapp/tenant-config/route.ts    │
        └──────────────────────────────────────────────┘
        │
        ├─ [1] Resolve Tenant ID (UUID atau Subdomain)
        ├─ [2] Validate Endpoint exists in ENV
        ├─ [3] Get Endpoint Config dari ENV
        ├─ [4] Sync Endpoint ke Database
        │       └─ Save ke whatsapp_endpoints table
        │       └─ Create webhook_url & webhook_secret
        ├─ [5] Save Config ke Database
        │       └─ Save ke tenant_whatsapp_config table
        │       └─ Set is_configured = TRUE
        └─ [6] Return response dengan config & endpoint details
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES UPDATED                         │
│                                                                     │
│  whatsapp_endpoints:                                               │
│  ├─ id: UUID                                                       │
│  ├─ tenant_id: UUID (foreign key → tenants.id)                   │
│  ├─ name: "Primary"                                               │
│  ├─ api_url: "https://api.wa-provider.com"                       │
│  ├─ api_key: "secret-key" (encrypted)                            │
│  ├─ webhook_url: "https://booqing.my.id/api/whatsapp/webhook/..." │
│  ├─ webhook_secret: "random-uuid"                                 │
│  └─ health_status: "unknown"                                       │
│                                                                     │
│  tenant_whatsapp_config:                                           │
│  ├─ id: UUID                                                       │
│  ├─ tenant_id: UUID (foreign key → tenants.id)                   │
│  ├─ endpoint_name: "Primary"                                      │
│  ├─ is_configured: TRUE                                           │
│  ├─ health_status: "unknown"                                       │
│  └─ auto_reconnect: TRUE                                          │
│                                                                     │
│  whatsapp_endpoints (in-memory cache via KV):                     │
│  └─ whatsapp:config:{tenantId} → full config object              │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPERADMIN SEES SUCCESS                         │
│                                                                     │
│  "Endpoint assigned successfully!"                                 │
│                                                                     │
│  Current Configuration:                                            │
│  ├─ Endpoint Name: Primary                                         │
│  ├─ Status: Healthy / Unknown                                      │
│  └─ [Remove Endpoint] button                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 STEP-BY-STEP FLOW DETAIL

### PHASE 1: ADMIN LOADS CONFIGURATION PAGE

**File**: `app/admin/tenants/[id]/whatsapp/content.tsx` (useEffect)

```typescript
// Step 1: Load available endpoints dari ENV
const endpointsRes = await fetch('/api/whatsapp/available-endpoints');
// Response: { endpoints: ["Primary", "Secondary"] }

// Step 2: Load tenant's current config (if exists)
const configRes = await fetch(`/api/whatsapp/tenant-config/${tenant.id}`);
// Response: { config: { endpoint_name: "Primary", is_configured: true, ... } }
```

**Flow:**
1. Superadmin masuk ke `/admin/tenants/{tenantId}/whatsapp`
2. Component load endpoint list dari `envEndpointManager`
3. Component load tenant's current config (if any) dari database
4. UI render dropdown dengan available endpoints & current assignment

---

### PHASE 2: ADMIN SELECTS & ASSIGNS ENDPOINT

**File**: `app/admin/tenants/[id]/whatsapp/content.tsx` (handleAssignEndpoint)

```typescript
const handleAssignEndpoint = async () => {
  // Step 1: Validate selection
  if (!selectedEndpoint) {
    setError('Please select an endpoint');
    return;
  }

  // Step 2: Send POST request to API
  const res = await fetch(`/api/whatsapp/tenant-config/${tenant.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint_name: selectedEndpoint })
  });

  // Step 3: Handle response
  if (res.ok) {
    const data = await res.json();
    setConfig(data.config);
    setSuccess('Endpoint assigned successfully!');
  } else {
    const err = await res.json();
    setError(err.error);
  }
};
```

**User Actions:**
1. ✓ Select endpoint dari dropdown (e.g., "Primary")
2. ✓ Click "Assign Endpoint" button
3. ⏳ Wait untuk POST request selesai
4. ✓ Lihat success/error message

---

### PHASE 3: BACKEND PROCESSES REQUEST

**File**: `app/api/whatsapp/tenant-config/[tenantId]/route.ts` (POST handler)

#### STEP 3.1: Resolve Tenant ID

```typescript
// Input: tenantId bisa UUID atau subdomain
const { resolved: resolvedTenantId } = await resolveTenantId(tenantId);

// Jika input "salon1" (subdomain):
// SELECT id FROM tenants WHERE subdomain = 'salon1'
// Return: "c9d49197-317d-4d28-8fc3-fb4b2a717da0" (UUID)

// Jika input UUID langsung, return as-is
```

**Purpose**: Support both:
- **Superadmin**: POST to `/api/whatsapp/tenant-config/{UUID}`
- **Tenant**: POST to `/api/whatsapp/tenant-config/{subdomain}`

#### STEP 3.2: Validate Endpoint

```typescript
const { endpoint_name } = await request.json(); // "Primary"

// Check if endpoint exists in ENV
if (!envEndpointManager.isValidEndpoint(endpoint_name)) {
  return NextResponse.json(
    { error: `Endpoint "Primary" not found in configuration` },
    { status: 400 }
  );
}

// Get full endpoint config
const endpointConfig = envEndpointManager.getEndpointConfig(endpoint_name);
// Return: { name: "Primary", apiUrl: "...", apiKey: "..." }
```

#### STEP 3.3: Sync Endpoint to Database

```typescript
// Function: syncTenantEndpoint(resolvedTenantId, endpointConfig)

const syncTenantEndpoint = async (tenantId, endpointConfig) => {
  // Get existing endpoint (if any)
  const existing = await whatsappEndpointManager.getEndpoint(tenantId);

  // Build endpoint object
  const endpointData = {
    id: existing?.id || uuid_generate_v4(),  // Auto-generate if new
    tenantId,
    name: endpointConfig.name,               // "Primary"
    apiUrl: endpointConfig.apiUrl,
    apiKey: endpointConfig.apiKey,
    webhookUrl: `https://booqing.my.id/api/whatsapp/webhook/${tenantId}/${endpointId}`,
    webhookSecret: randomUUID(),
    isActive: true,
    healthStatus: 'unknown',
    lastHealthCheck: new Date().toISOString()
  };

  // Save ke whatsapp_endpoints table
  await whatsappEndpointManager.setEndpoint(tenantId, endpointData);
};
```

**Database Insert:**
```sql
INSERT INTO whatsapp_endpoints (
  id, tenant_id, name, api_url, api_key,
  webhook_url, webhook_secret, is_active, health_status, last_health_check, created_at
) VALUES (
  'uuid-123', 'c9d49197...', 'Primary', 'https://...', 'secret-key',
  'https://booqing.my.id/api/whatsapp/webhook/...', 'webhook-secret-uuid', true, 'unknown', now(), now()
)
ON CONFLICT (tenant_id) DO UPDATE SET
  name = EXCLUDED.name,
  api_url = EXCLUDED.api_url,
  api_key = EXCLUDED.api_key,
  webhook_url = EXCLUDED.webhook_url,
  webhook_secret = EXCLUDED.webhook_secret,
  updated_at = now();
```

#### STEP 3.4: Save Config to tenant_whatsapp_config

```typescript
const now = new Date().toISOString();
const configData = {
  tenant_id: resolvedTenantId,
  endpoint_name: "Primary",              // Reference to ENV
  is_configured: true,                    // ✓ Mark as configured
  health_status: 'unknown',
  last_health_check: now,
  auto_reconnect: true,
  reconnect_interval: 30,
  health_check_interval: 60,
  webhook_retries: 3,
  message_timeout: 30,
  updated_at: now
};

// Insert or Update
const { data: config, error } = await supabase
  .from('tenant_whatsapp_config')
  .upsert(configData)
  .select()
  .single();
```

#### STEP 3.5: Cache to In-Memory Store

```typescript
// Simpan ke KV cache untuk akses cepat
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

#### STEP 3.6: Return Response

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

### PHASE 4: TENANT SEES CONFIGURATION

**File**: `app/tenant/admin/whatsapp/content.tsx`

```typescript
// Tenant admin akses: salon1.booqing.my.id/admin/whatsapp

const fetchData = async () => {
  // Tenant kirim request dengan subdomain
  const configRes = await fetch(
    `/api/whatsapp/tenant-config/${subdomain}` // "salon1"
  );
  
  if (configRes.ok) {
    const configData = await configRes.json();
    if (configData.config?.is_configured) {
      // ✓ Show endpoint details
      setEndpoint({
        id: configData.config.endpoint_name,
        name: configData.config.endpoint_name,
        healthStatus: configData.config.health_status,
        lastHealthCheck: configData.config.last_health_check
      });
    }
  }
};
```

**Tenant UI Shows:**
```
┌─────────────────────────────────────────┐
│    ENDPOINT CONFIGURATION              │
├─────────────────────────────────────────┤
│ Name:        Primary                    │
│ Status:      ✓ Healthy / ⚠ Unknown    │
│ Last Check:  2025-10-25 10:15:30 UTC   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│    WHATSAPP DEVICES                    │
├─────────────────────────────────────────┤
│ + Add Device                            │
│                                         │
│ Device 1: Main Phone                    │
│ Status: Connected                       │
│ Phone: +62812345678                     │
│ Last Seen: 2025-10-25 10:10:00 UTC     │
└─────────────────────────────────────────┘
```

---

## 🔄 DATA FLOW DIAGRAM

```
SUPERADMIN                    SYSTEM                        DATABASE
─────────────────────────────────────────────────────────────────────

Select Endpoint
    │
    ├──→ /api/whatsapp/available-endpoints
    │                    ↓
    │            Read ENV variables
    │            (envEndpointManager)
    │                    ↓
    │            ["Primary", "Secondary"]  ←──┐
    │                    ↑
    │                    └────────────────────┘

Click "Assign Endpoint"
    │
    ├──→ POST /api/whatsapp/tenant-config/[tenantId]
    │         { endpoint_name: "Primary" }
    │                    ↓
    │            [1] Resolve Tenant ID
    │            [2] Validate Endpoint
    │            [3] Get Endpoint Config
    │                    ↓
    │            [4] Sync to whatsapp_endpoints  ────→ INSERT/UPDATE
    │            [5] Save to tenant_whatsapp_config ──→ INSERT/UPDATE
    │            [6] Cache to KV Store              ──→ SET
    │                    ↓
    │            Return { config, endpoint }
    │                    ↑
    │            ┌───────┘
    └────────────┘

Show Success
```

---

## 📊 DATA STRUCTURES

### ENV Variable
```json
{
  "WHATSAPP_ENDPOINTS": [
    {
      "name": "Primary",
      "apiUrl": "https://api.whatsapp-provider.com/v1",
      "apiKey": "xxxxxxxxxxxxx"
    },
    {
      "name": "Secondary",
      "apiUrl": "https://api2.whatsapp-provider.com/v1",
      "apiKey": "yyyyyyyyyyyyy"
    }
  ]
}
```

### whatsapp_endpoints Table
```sql
{
  id: UUID (auto),
  tenant_id: UUID (FK → tenants.id),
  name: TEXT,                        -- "Primary"
  api_url: TEXT,                     -- "https://..."
  api_key: TEXT,                     -- "xxxxxxxxxxxxx" (encrypted)
  webhook_url: TEXT,                 -- "https://booqing.my.id/api/whatsapp/webhook/..."
  webhook_secret: TEXT,              -- "random-uuid"
  is_active: BOOLEAN,                -- true
  health_status: TEXT,               -- "healthy"|"unhealthy"|"unknown"
  last_health_check: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### tenant_whatsapp_config Table
```sql
{
  id: UUID (auto),
  tenant_id: UUID (FK → tenants.id, UNIQUE),
  endpoint_name: TEXT,               -- "Primary" (reference to ENV)
  is_configured: BOOLEAN,            -- true/false
  auto_reconnect: BOOLEAN,           -- true
  reconnect_interval: INTEGER,       -- 30 seconds
  health_check_interval: INTEGER,    -- 60 seconds
  webhook_retries: INTEGER,          -- 3
  message_timeout: INTEGER,          -- 30 seconds
  health_status: TEXT,               -- "healthy"|"unhealthy"|"unknown"
  last_health_check: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### In-Memory Cache (KV Store)
```typescript
Key: "whatsapp:config:{tenantId}"
Value: {
  tenantId: string,
  endpoint: WhatsAppEndpoint,
  autoReconnect: boolean,
  reconnectInterval: number,
  healthCheckInterval: number,
  webhookRetries: number,
  messageTimeout: number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 SECURITY FLOW

```
CREDENTIALS STORAGE:

┌─────────────────────────────────────────────────────┐
│  .env.local (Server Environment Only)              │
│                                                     │
│  WHATSAPP_ENDPOINTS=[                              │
│    {"name":"Primary",                              │
│     "apiUrl":"...",                                │
│     "apiKey":"SECRET-KEY-HERE"}  ← NEVER EXPOSED  │
│  ]                                                  │
└─────────────────────────────────────────────────────┘
                      ↓
        ┌─────────────────────────┐
        │  envEndpointManager     │
        │  (Server-side only)     │
        │                         │
        │  Functions:             │
        │  - getAvailableEndpoints() → Names only
        │  - getEndpointConfig()  → Full config
        │  - getEndpointMetadata()→ Name + URL only
        └─────────────────────────┘
                      ↓
        ┌─────────────────────────────────────┐
        │  API Handlers                      │
        │  (Server-side only)                │
        │                                     │
        │  ✗ Never send API keys to client  │
        │  ✓ Store in database encrypted    │
        │  ✓ Send to backend processing     │
        └─────────────────────────────────────┘
                      ↓
        ┌─────────────────────────────────────┐
        │  Database (Encrypted)               │
        │  whatsapp_endpoints.api_key        │
        └─────────────────────────────────────┘

WHAT FRONTEND SEES: ✗ NO API KEYS EVER
- Only endpoint names: ["Primary", "Secondary"]
- Only webhook URLs (safe to expose)
- Only health status

WHAT BACKEND USES: ✓ FULL CREDENTIALS
- Complete API URLs and keys
- Webhook secrets for verification
- Health monitoring with credentials
```

---

## ⚙️ KEY COMPONENTS

### 1. envEndpointManager (`lib/whatsapp/env-endpoint-manager.ts`)
- **Purpose**: Read endpoints dari ENV variables
- **Server-side only**: Never expose ke frontend
- **Methods**:
  - `getAvailableEndpoints()` → String[] (names only)
  - `getEndpointConfig()` → Full config with credentials
  - `isValidEndpoint()` → Boolean

### 2. whatsappEndpointManager (`lib/whatsapp/simplified-endpoint-manager.ts`)
- **Purpose**: Manage persistent endpoint storage
- **Storage**: Database + in-memory cache
- **Methods**:
  - `getEndpoint(tenantId)` → WhatsAppEndpoint
  - `setEndpoint(tenantId, endpoint)` → Save to DB
  - `deleteEndpoint(tenantId)` → Remove
  - `getConfiguration(tenantId)` → Full config
  - `getClient(tenantId)` → WhatsAppClient instance

### 3. API Route Handler (`app/api/whatsapp/tenant-config/[tenantId]/route.ts`)
- **GET**: Fetch current config
- **POST**: Assign endpoint to tenant
- **DELETE**: Remove endpoint assignment
- **Features**:
  - Resolve subdomain to UUID
  - Validate endpoint exists
  - Sync to both tables
  - Update cache

### 4. Admin UI (`app/admin/tenants/[id]/whatsapp/content.tsx`)
- **Superadmin interface**
- **Actions**:
  - Load available endpoints
  - Select and assign endpoint
  - View current assignment
  - Remove assignment

### 5. Tenant UI (`app/tenant/admin/whatsapp/content.tsx`)
- **Tenant interface** (per subdomain)
- **Shows**:
  - Assigned endpoint details
  - Endpoint health status
  - Device management
  - Connection status

---

## ✅ CHECKLIST - SETUP REQUIREMENTS

Sebelum workflow berjalan, pastikan:

- [ ] Database tables created:
  ```sql
  -- Run: fix-whatsapp-endpoints-types.sql
  CREATE TABLE whatsapp_endpoints (...)
  CREATE TABLE tenant_whatsapp_config (...)
  ```

- [ ] ENV variables set:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://...
  SUPABASE_SERVICE_ROLE_KEY=xxxx
  WHATSAPP_ENDPOINTS=[{"name":"Primary","apiUrl":"...","apiKey":"..."}]
  ```

- [ ] Tables have UUID foreign keys (not TEXT):
  ```sql
  tenant_id UUID NOT NULL REFERENCES tenants(id)
  ```

- [ ] Indexes created for performance:
  ```sql
  CREATE INDEX idx_whatsapp_endpoints_tenant_id ON whatsapp_endpoints(tenant_id);
  CREATE INDEX idx_tenant_whatsapp_config_tenant_id ON tenant_whatsapp_config(tenant_id);
  ```

- [ ] API endpoints deployed:
  - `/api/whatsapp/available-endpoints`
  - `/api/whatsapp/tenant-config/[tenantId]`
  - `/api/whatsapp/devices`

- [ ] Admin UI accessible:
  - `/admin/tenants/[id]/whatsapp`
  - `/tenant/admin/whatsapp`

---

## 🐛 TROUBLESHOOTING

### Problem: "Endpoint not found in configuration"
**Cause**: `endpoint_name` tidak match dengan ENV
**Solution**: Pastikan `WHATSAPP_ENDPOINTS` ENV var set dengan endpoint name yang benar

### Problem: "Foreign key constraint error"
**Cause**: Column type mismatch (TEXT vs UUID)
**Solution**: Run `fix-whatsapp-endpoints-types.sql`

### Problem: "WhatsApp endpoint not configured" (Tenant view)
**Cause**: `is_configured = FALSE` di database
**Solution**: Check `tenant_whatsapp_config.is_configured` value

### Problem: POST 500 error
**Cause**: Date serialization error
**Solution**: Sudah fixed - gunakan latest code dengan `.toISOString()`

### Problem: Endpoint shows "unknown" health
**Cause**: Health check belum run
**Solution**: Normal - health check runs periodically in background

---

Semoga dokumentasi ini membantu! 🚀
