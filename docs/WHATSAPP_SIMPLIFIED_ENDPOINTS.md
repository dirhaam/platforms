# WhatsApp Simplified Endpoints (1-to-1 Mapping)

## Overview

Simplified WhatsApp architecture where **each tenant has exactly ONE endpoint** - no primary/backup setup, no failover complexity.

## Architecture

```
Platform Booqing (Multi-Tenant)
├── Tenant A (Beauty Salon) → WhatsApp Endpoint 1 (apiUrl: https://wa-api-1.example.com)
├── Tenant B (Clinic) → WhatsApp Endpoint 2 (apiUrl: https://wa-api-2.example.com)
├── Tenant C (Hotel) → WhatsApp Endpoint 3 (apiUrl: https://wa-api-3.example.com)
└── Tenant D (Beauty Salon) → WhatsApp Endpoint 4 (apiUrl: https://wa-api-4.example.com)
```

## Key Differences from Multi-Endpoint

### Before (Complex)
```
Tenant A:
├── Endpoint 1 (Primary) - API Server 1
├── Endpoint 2 (Backup) - API Server 2
├── Primary/Backup switching logic
└── Failover handling
```

### After (Simple)
```
Tenant A:
└── Endpoint 1 - API Server 1
    (Direct, no redundancy in config)
```

## Benefits

✅ **Simpler Architecture** - One tenant = one endpoint, no primary/backup management
✅ **Easier Configuration** - Tenants just set their WhatsApp API URL
✅ **Direct Mapping** - Clear relationship between tenant and endpoint
✅ **Scalable** - Each tenant controls their own endpoint
✅ **Multi-Region Support** - Different tenants can use different API servers
✅ **No Cross-Tenant Interference** - Each tenant isolated with their endpoint

## Data Model

### WhatsAppConfiguration (Per Tenant)
```typescript
interface WhatsAppConfiguration {
  tenantId: string;
  endpoint: WhatsAppEndpoint;        // Single endpoint
  autoReconnect: boolean;
  reconnectInterval: number;
  healthCheckInterval: number;
  webhookRetries: number;
  messageTimeout: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### WhatsAppEndpoint
```typescript
interface WhatsAppEndpoint {
  id: string;                        // Unique endpoint ID
  tenantId: string;                  // Which tenant owns this
  name: string;                      // Display name
  apiUrl: string;                    // WhatsApp API endpoint URL
  apiKey: string;                    // API authentication key
  webhookUrl: string;                // Where to receive webhooks
  webhookSecret: string;             // Webhook verification secret
  isActive: boolean;                 // Is this endpoint in use?
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Usage

### Get Tenant's Endpoint
```typescript
const endpoint = await whatsappEndpointManager.getEndpoint(tenantId);
// Returns the single endpoint for this tenant
```

### Set/Update Tenant's Endpoint
```typescript
const endpoint = await whatsappEndpointManager.setEndpoint(tenantId, {
  id: 'endpoint_123',
  name: 'Primary WhatsApp Server',
  apiUrl: 'https://wa-api.example.com',
  apiKey: '<your-api-key>',
  webhookUrl: 'https://yourdomain.com/api/whatsapp/webhook/tenant-id',
  webhookSecret: '<your-webhook-secret>',
  isActive: true,
  healthStatus: 'unknown',
  lastHealthCheck: new Date(),
});
```

### Get Client for Tenant
```typescript
const client = await whatsappEndpointManager.getClient(tenantId);
if (client) {
  // Use client to send messages, get status, etc.
  await client.sendMessage(deviceId, phoneNumber, message);
}
```

### Test Endpoint Health
```typescript
const isHealthy = await whatsappEndpointManager.testEndpointHealth(tenantId);
console.log(`Tenant ${tenantId} endpoint: ${isHealthy ? 'healthy' : 'unhealthy'}`);
```

### Delete Endpoint
```typescript
await whatsappEndpointManager.deleteEndpoint(tenantId);
```

## Cache Structure (Redis)

Each tenant's configuration stored as:
```
Key: whatsapp:config:{tenantId}
Value: {
  tenantId,
  endpoint: {...},
  autoReconnect,
  reconnectInterval,
  healthCheckInterval,
  webhookRetries,
  messageTimeout,
  createdAt,
  updatedAt
}
```

Example:
```
whatsapp:config:c9d49197-317d-4d28-8fc3-fb4b2a717da0
→ Configuration with single endpoint for tenant
```

## Health Monitoring

- Each tenant's endpoint is monitored independently
- Health checks run at `healthCheckInterval` seconds
- Updates `healthStatus` in configuration
- If unhealthy, device messages may fail until recovered

## Multi-Region Support Example

```
Use Cases:
1. Tenant in Indonesia → Endpoint with Indonesia WhatsApp API
2. Tenant in Singapore → Endpoint with Singapore WhatsApp API
3. Tenant in India → Endpoint with India WhatsApp API
4. Tenant with high volume → Dedicated enterprise endpoint
```

Each tenant configures their own endpoint based on:
- Regional requirements
- API provider choice
- Performance needs
- Cost considerations

## Migration from Multi-Endpoint

If upgrading from the complex multi-endpoint system:

1. **For each tenant with endpoints:**
   ```sql
   SELECT tenantId, COUNT(*) as endpoint_count FROM whatsapp_endpoints;
   ```

2. **Select one endpoint per tenant (preferably primary):**
   ```typescript
   // For each tenant, keep isPrimary = true, delete others
   ```

3. **Use new simplified manager:**
   ```typescript
   import { whatsappEndpointManager } from '@/lib/whatsapp/simplified-endpoint-manager';
   
   // All operations now work with single endpoint
   const client = await whatsappEndpointManager.getClient(tenantId);
   ```

## Webhook Routing

URL pattern: `/api/whatsapp/webhook/{tenantId}/{endpointId}`

Since endpoint is unique per tenant:
```
POST /api/whatsapp/webhook/c9d49197-317d-4d28-8fc3-fb4b2a717da0/endpoint_123
→ Automatically routes to that tenant's endpoint
→ Processes message for that tenant
```

## Best Practices

1. **Configuration Setup:**
   - Initialize tenant with `initializeTenant()` before setting endpoint
   - Set webhook secret for verification
   - Enable `isActive` after successful health check

2. **Error Handling:**
   - Check health status before sending messages
   - Fallback to manual review if endpoint unhealthy
   - Log endpoint changes for audit trail

3. **Security:**
   - Store `apiKey` and `webhookSecret` encrypted
   - Rotate secrets periodically
   - Verify webhook signatures

4. **Monitoring:**
   - Track health check results
   - Alert on unhealthy endpoints
   - Monitor message success rates per endpoint

## Files

- `lib/whatsapp/simplified-endpoint-manager.ts` - Core manager
- `types/whatsapp.ts` - Type definitions (updated)
- `app/api/whatsapp/endpoints/[tenantId]/route.ts` - API (simplified)

## Testing

```typescript
// Test 1: Create endpoint for tenant
const endpoint = await whatsappEndpointManager.setEndpoint('tenant-1', {
  id: 'ep-1',
  name: 'Test Endpoint',
  apiUrl: 'https://api.test.com',
  // ... other fields
});

// Test 2: Get client and verify
const client = await whatsappEndpointManager.getClient('tenant-1');
const isHealthy = await client.healthCheck();

// Test 3: Verify isolation
const tenant2Config = await whatsappEndpointManager.getConfiguration('tenant-2');
// Should return different endpoint or null if not configured
```

## FAQ

**Q: Can a tenant have multiple endpoints?**
A: No, simplified model is 1 endpoint per tenant. If redundancy needed, configure your WhatsApp API provider with their own failover.

**Q: What if my API provider goes down?**
A: Health checks will mark endpoint as unhealthy. You can switch provider by updating endpoint configuration.

**Q: How do I migrate to a new WhatsApp API provider?**
A: Call `setEndpoint()` with new provider's details. Old endpoint is replaced.

**Q: Can two tenants share an endpoint?**
A: Not recommended. Each tenant should have their own isolated endpoint for better security and control.
