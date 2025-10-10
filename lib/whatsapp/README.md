# WhatsApp Integration Infrastructure

This directory contains the complete multi-tenant WhatsApp API integration infrastructure for the Booqing platform.

## Overview

The WhatsApp integration provides:
- **Multi-endpoint management** - Support for different WhatsApp API servers per tenant
- **Device connection management** - QR code and pairing code authentication
- **Health monitoring** - Automatic endpoint health checks and failover
- **Session management** - Persistent device sessions with automatic reconnection
- **Webhook handling** - Incoming message routing and event processing
- **Tenant isolation** - Complete separation of WhatsApp data between tenants

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Service                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Endpoint Manager│  │ Device Manager  │  │ Webhook      │ │
│  │                 │  │                 │  │ Handler      │ │
│  │ - Multi-endpoint│  │ - Device CRUD   │  │ - Message    │ │
│  │ - Health checks │  │ - Connection    │  │   routing    │ │
│  │ - Failover      │  │ - Session mgmt  │  │ - Event      │ │
│  │ - Load balancing│  │ - Reconnection  │  │   processing │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Client                          │
├─────────────────────────────────────────────────────────────┤
│  - HTTP API communication                                   │
│  - Message sending/receiving                                │
│  - Device status management                                 │
│  - QR code/pairing code generation                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                External WhatsApp APIs                       │
├─────────────────────────────────────────────────────────────┤
│  - WhatsApp Business API                                    │
│  - WhatsApp Web API                                         │
│  - Custom WhatsApp implementations                          │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. WhatsApp Service (`whatsapp-service.ts`)
Main service class that orchestrates all WhatsApp functionality:
- Configuration management
- Endpoint and device management
- Message handling
- Health monitoring

### 2. Endpoint Manager (`endpoint-manager.ts`)
Manages multiple WhatsApp API endpoints per tenant:
- **Multi-endpoint support** - Each tenant can have multiple WhatsApp API servers
- **Health monitoring** - Continuous health checks with configurable intervals
- **Automatic failover** - Switch to backup endpoints when primary fails
- **Load balancing** - Distribute requests across healthy endpoints

### 3. Device Manager (`device-manager.ts`)
Handles WhatsApp device connections:
- **Device lifecycle** - Create, connect, disconnect, delete devices
- **Authentication** - QR code and pairing code support
- **Session management** - Persistent sessions with encryption
- **Auto-reconnection** - Exponential backoff reconnection strategy

### 4. Webhook Handler (`webhook-handler.ts`)
Processes incoming WhatsApp webhooks:
- **Message routing** - Route messages to correct tenant/conversation
- **Event processing** - Handle device status, delivery receipts, etc.
- **Signature verification** - Secure webhook validation
- **Retry mechanism** - Automatic retry for failed webhook processing

### 5. WhatsApp Client (`whatsapp-client.ts`)
HTTP client for WhatsApp API communication:
- **Message operations** - Send text, media, and interactive messages
- **Device operations** - Status checks, QR generation, connection management
- **Error handling** - Comprehensive error handling with retries
- **Timeout management** - Configurable timeouts for different operations

## Data Models

### Configuration Structure
```typescript
interface WhatsAppConfiguration {
  tenantId: string;
  endpoints: WhatsAppEndpoint[];
  primaryEndpointId?: string;
  failoverEnabled: boolean;
  autoReconnect: boolean;
  reconnectInterval: number;
  healthCheckInterval: number;
  webhookRetries: number;
  messageTimeout: number;
}
```

### Endpoint Structure
```typescript
interface WhatsAppEndpoint {
  id: string;
  tenantId: string;
  name: string;
  apiUrl: string;
  apiKey?: string;
  webhookUrl: string;
  webhookSecret: string;
  isActive: boolean;
  isPrimary: boolean;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: Date;
}
```

### Device Structure
```typescript
interface WhatsAppDevice {
  id: string;
  tenantId: string;
  endpointId: string;
  deviceName: string;
  phoneNumber?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'pairing' | 'error';
  qrCode?: string;
  pairingCode?: string;
  sessionData?: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}
```

## API Endpoints

### Configuration Management
- `GET /api/whatsapp/config/[tenantId]` - Get tenant configuration
- `PUT /api/whatsapp/config/[tenantId]` - Update tenant configuration
- `POST /api/whatsapp/config/[tenantId]` - Initialize tenant configuration

### Endpoint Management
- `GET /api/whatsapp/endpoints/[tenantId]` - List tenant endpoints
- `POST /api/whatsapp/endpoints/[tenantId]` - Create new endpoint
- `PUT /api/whatsapp/endpoints/[tenantId]/[endpointId]` - Update endpoint
- `DELETE /api/whatsapp/endpoints/[tenantId]/[endpointId]` - Delete endpoint
- `POST /api/whatsapp/endpoints/[tenantId]/[endpointId]?action=test-health` - Test endpoint health

### Device Management
- `GET /api/whatsapp/devices/[tenantId]` - List tenant devices
- `POST /api/whatsapp/devices/[tenantId]` - Create new device
- `GET /api/whatsapp/devices/[deviceId]` - Get device details
- `PUT /api/whatsapp/devices/[deviceId]` - Update device
- `DELETE /api/whatsapp/devices/[deviceId]` - Delete device
- `POST /api/whatsapp/devices/[deviceId]?action=connect` - Connect device
- `POST /api/whatsapp/devices/[deviceId]?action=disconnect` - Disconnect device
- `POST /api/whatsapp/devices/[deviceId]?action=refresh-status` - Refresh device status

### Webhook Handling
- `POST /api/whatsapp/webhook/[tenantId]/[endpointId]` - Receive webhooks
- `GET /api/whatsapp/webhook/[tenantId]/[endpointId]` - Webhook verification

### Health Monitoring
- `GET /api/whatsapp/health/[tenantId]` - Get tenant health status

## Usage Examples

### Initialize WhatsApp for a Tenant
```typescript
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

// Initialize WhatsApp configuration
await whatsappService.initializeTenant('my-tenant');

// Add an endpoint
const endpoint = await whatsappService.addEndpoint('my-tenant', {
  name: 'Primary WhatsApp Server',
  apiUrl: 'https://api.whatsapp.example.com',
  apiKey: 'your-api-key',
  webhookUrl: 'https://yourdomain.com/api/whatsapp/webhook/my-tenant/endpoint-id',
  webhookSecret: 'your-webhook-secret',
  isActive: true,
  isPrimary: true,
  healthStatus: 'unknown',
  lastHealthCheck: new Date()
});

// Create a device
const device = await whatsappService.createDevice(
  'my-tenant',
  endpoint.id,
  'My WhatsApp Device'
);

// Connect the device
const connectionResult = await whatsappService.connectDevice(device.id);
console.log('QR Code:', connectionResult.qrCode);
console.log('Pairing Code:', connectionResult.pairingCode);
```

### Send a Message
```typescript
// Send a text message
const message = await whatsappService.sendMessage(
  'my-tenant',
  'device-id',
  '+1234567890',
  {
    type: 'text',
    content: 'Hello from Booqing!'
  }
);

// Send an image
const imageMessage = await whatsappService.sendMessage(
  'my-tenant',
  'device-id',
  '+1234567890',
  {
    type: 'image',
    content: '',
    mediaUrl: 'https://example.com/image.jpg',
    caption: 'Check out this image!'
  }
);
```

### Monitor Health
```typescript
// Get tenant health status
const healthStatus = await whatsappService.getTenantHealthStatus('my-tenant');
console.log('Overall Health:', healthStatus.overallHealth);
console.log('Endpoints:', healthStatus.endpoints);
console.log('Devices:', healthStatus.devices);

// Test specific endpoint
const isHealthy = await whatsappService.testEndpointHealth('my-tenant', 'endpoint-id');
console.log('Endpoint is healthy:', isHealthy);
```

## Configuration

### Environment Variables
```env
# WhatsApp Integration
WHATSAPP_DEFAULT_TIMEOUT=30000
WHATSAPP_DEFAULT_RETRIES=3
WHATSAPP_HEALTH_CHECK_INTERVAL=60
WHATSAPP_RECONNECT_INTERVAL=30
WHATSAPP_MAX_RECONNECT_ATTEMPTS=5

# Webhook Configuration
WHATSAPP_WEBHOOK_BASE_URL=https://yourdomain.com
```

### Redis Keys Structure
```
whatsapp:config:{tenantId}              # Tenant configuration
whatsapp:device:{deviceId}              # Device data
whatsapp:session:{deviceId}             # Device session data
whatsapp:tenant:{tenantId}:devices      # Set of device IDs for tenant
whatsapp:conversation:{tenantId}:{phone} # Conversation data
whatsapp:message:{messageId}            # Message data
whatsapp:messages:{conversationId}      # List of message IDs for conversation
whatsapp:events:{tenantId}              # Tenant events queue
whatsapp:events:global                  # Global events queue
whatsapp:health:{endpointId}            # Endpoint health check results
```

## Security Features

### Webhook Security
- **Signature verification** - HMAC-SHA256 signature validation
- **Tenant isolation** - Webhooks routed only to correct tenant
- **Rate limiting** - Built-in protection against webhook spam

### Data Protection
- **Session encryption** - Device sessions encrypted before storage
- **API key masking** - Sensitive data masked in API responses
- **Secure storage** - All sensitive data stored in Redis with TTL

### Access Control
- **Tenant isolation** - Complete data separation between tenants
- **API authentication** - Secure API endpoints with proper validation
- **Error handling** - No sensitive data leaked in error messages

## Monitoring and Observability

### Health Checks
- **Endpoint monitoring** - Continuous health checks for all endpoints
- **Device status tracking** - Real-time device connection status
- **Automatic failover** - Switch to backup endpoints automatically

### Event Tracking
- **Message events** - Track message delivery, read receipts
- **Device events** - Monitor connection/disconnection events
- **System events** - Health changes, failovers, errors

### Metrics
- **Response times** - Track API response times
- **Success rates** - Monitor message delivery success
- **Error rates** - Track and alert on error patterns

## Troubleshooting

### Common Issues

1. **Device won't connect**
   - Check endpoint health status
   - Verify API credentials
   - Ensure webhook URL is accessible
   - Check device session validity

2. **Messages not sending**
   - Verify device is connected
   - Check endpoint health
   - Validate phone number format
   - Review API rate limits

3. **Webhooks not received**
   - Verify webhook URL configuration
   - Check webhook signature validation
   - Ensure endpoint is accessible from WhatsApp servers
   - Review webhook retry settings

### Debug Commands
```bash
# Test WhatsApp infrastructure
npm run whatsapp:test

# Check system status
npm run whatsapp:status

# Initialize for all tenants
npm run whatsapp:init
```

## Performance Considerations

### Scalability
- **Connection pooling** - Efficient HTTP connection management
- **Caching** - Redis caching for frequently accessed data
- **Async processing** - Non-blocking webhook processing
- **Load balancing** - Distribute load across multiple endpoints

### Optimization
- **Batch operations** - Group multiple operations when possible
- **TTL management** - Automatic cleanup of old data
- **Memory efficiency** - Minimal memory footprint
- **Network efficiency** - Optimized API calls and retries

## Future Enhancements

### Planned Features
- **Message templates** - Pre-defined message templates with variables
- **Broadcast messaging** - Send messages to multiple recipients
- **Chat analytics** - Conversation metrics and insights
- **Integration APIs** - Connect with external CRM systems
- **Advanced routing** - Smart message routing based on content
- **Multi-language support** - Localized message templates

### Scalability Improvements
- **Database integration** - Move from Redis to PostgreSQL for persistence
- **Message queuing** - Implement message queues for high-volume scenarios
- **Horizontal scaling** - Support for multiple application instances
- **CDN integration** - Optimize media message delivery

This WhatsApp integration infrastructure provides a robust, scalable foundation for multi-tenant WhatsApp communication within the Booqing platform.