# WhatsApp Integration Task Update

## Overview
Task 8 telah diperbarui berdasarkan dokumentasi WhatsApp API MultiDevice (OpenAPI 3.0) yang baru ditambahkan di `doc/wadoc.md`. Update ini memperluas cakupan implementasi WhatsApp integration untuk mencakup semua fitur yang tersedia dalam API.

## 🔄 Perubahan Task 8

### Sebelumnya (3 subtasks):
- 8.1 Set up WhatsApp API integration infrastructure
- 8.2 Build chat inbox and messaging interface  
- 8.3 Implement automated reminder system

### Sekarang (6 subtasks yang diperluas):

#### 8.1 Set up WhatsApp MultiDevice API integration infrastructure
**Perubahan:**
- Ditambahkan spesifikasi OpenAPI 3.0 sebagai basis implementasi
- Diperluas untuk mencakup pairing code authentication selain QR code
- Ditambahkan device status monitoring yang lebih komprehensif
- Ditambahkan automatic reconnection dan session management

**API Endpoints yang akan diimplementasikan:**
- `/app/login` - Login dengan QR code
- `/app/login-with-code` - Login dengan pairing code
- `/app/logout` - Logout dan cleanup
- `/app/reconnect` - Reconnect ke WhatsApp server
- `/app/devices` - Get list connected devices

#### 8.2 Build comprehensive messaging capabilities
**Perubahan:**
- Diperluas dari basic text/images/files ke semua jenis media
- Ditambahkan sticker support dengan auto-conversion ke WebP
- Ditambahkan interactive features (polls, links dengan preview)
- Ditambahkan disappearing messages dan view-once media
- Ditambahkan message compression dan format optimization

**API Endpoints yang akan diimplementasikan:**
- `/send/message` - Send text message
- `/send/image` - Send image dengan compression
- `/send/audio` - Send audio files
- `/send/file` - Send documents
- `/send/sticker` - Send stickers dengan auto-conversion
- `/send/video` - Send video dengan compression
- `/send/contact` - Send contact cards
- `/send/link` - Send links dengan preview
- `/send/location` - Send location coordinates
- `/send/poll` - Send polls/voting

#### 8.3 Create unified chat inbox and conversation management
**Perubahan:**
- Diperluas untuk mencakup real-time messaging
- Ditambahkan conversation threading dan message history
- Ditambahkan staff assignment dan team collaboration
- Ditambahkan message status tracking yang detail
- Ditambahkan conversation archiving dan search

**Fitur yang akan diimplementasikan:**
- Real-time chat interface
- Message threading dan history
- Staff assignment system
- Message status tracking (sent/delivered/read/failed)
- Conversation search dan archiving
- Customer profile integration

#### 8.4 Implement user and contact management (BARU)
**Fitur baru berdasarkan API:**
- User info retrieval dan avatar management
- Contact verification dan WhatsApp status checking
- Business profile management
- Contact synchronization dengan customer database
- Privacy settings dan group management
- Newsletter dan broadcast list management

**API Endpoints yang akan diimplementasikan:**
- `/user/info` - Get user information
- `/user/avatar` - Get/change user avatar
- `/user/pushname` - Change display name
- `/user/my/privacy` - Privacy settings
- `/user/my/groups` - List user groups
- `/user/my/newsletters` - List newsletters
- `/user/my/contacts` - Get contacts
- `/user/check` - Check if user is on WhatsApp
- `/user/business-profile` - Business profile info

#### 8.5 Build automated messaging and reminder system
**Perubahan:**
- Diperluas untuk mencakup message templates dengan variable substitution
- Ditambahkan bulk messaging capabilities
- Ditambahkan message queue dan delivery retry mechanisms
- Ditambahkan delivery tracking dan analytics

**Fitur yang akan diimplementasikan:**
- Booking reminder scheduling
- Message templates dengan variables
- Automated confirmation messages
- Bulk messaging untuk promotions
- Message queue system
- Delivery tracking dan analytics

#### 8.6 Add advanced WhatsApp features and integrations (BARU)
**Fitur baru berdasarkan API:**
- Message reactions dan status updates
- Group messaging dan management
- Message forwarding dan broadcasting
- Chat backup dan export functionality
- Integration dengan booking system
- WhatsApp-specific analytics

## 🏗️ Multi-Endpoint Architecture

### Konsep Multi-Tenant WhatsApp Integration:

Setiap tenant (bisnis) dalam platform Booqing akan memiliki:

1. **Dedicated WhatsApp API Endpoint**: Setiap tenant dapat menggunakan WhatsApp API server yang berbeda
   - `https://tenant1-wa.example.com` untuk Tenant A
   - `https://tenant2-wa.example.com` untuk Tenant B
   - `https://shared-wa.example.com` untuk tenant yang menggunakan shared server

2. **Independent Authentication**: Setiap endpoint memiliki kredensial terpisah
   - API Key yang berbeda per tenant
   - Webhook URL yang berbeda per tenant
   - Device management yang terpisah

3. **Isolated WhatsApp Sessions**: Setiap tenant memiliki session WhatsApp yang terpisah
   - QR Code/Pairing Code terpisah
   - Device status monitoring per tenant
   - Message routing berdasarkan tenant

### Benefits Multi-Endpoint Architecture:

✅ **Scalability**: Tenant dapat menggunakan server WhatsApp yang berbeda sesuai kebutuhan
✅ **Isolation**: Masalah di satu endpoint tidak mempengaruhi tenant lain
✅ **Flexibility**: Tenant dapat migrate ke endpoint yang berbeda
✅ **Performance**: Load balancing across multiple WhatsApp servers
✅ **Compliance**: Tenant dapat menggunakan server di region yang sesuai regulasi

### Configuration Management:

```typescript
// Tenant WhatsApp Settings Interface
interface TenantWhatsAppSettings {
  apiBaseUrl: string;      // "https://tenant-wa.example.com"
  apiKey: string;          // Encrypted API key
  webhookUrl: string;      // "https://booqing.com/api/webhooks/whatsapp/{tenantId}"
  webhookSecret: string;   // Webhook verification secret
  maxDevices: number;      // Maximum devices allowed
  features: {
    multimedia: boolean;   // Enable image/video/file sending
    polls: boolean;        // Enable poll creation
    groups: boolean;       // Enable group messaging
    broadcast: boolean;    // Enable broadcast lists
  };
  rateLimits: {
    messagesPerMinute: number;
    messagesPerHour: number;
    messagesPerDay: number;
  };
}
```

## 📋 API Specification Highlights

### Authentication Methods:
1. **QR Code Login** - Traditional QR code scanning
2. **Pairing Code Login** - Phone number + pairing code

### Message Types Supported:
- Text messages dengan reply/forward
- Images dengan compression dan view-once
- Audio files
- Video files dengan compression
- Documents/files
- Stickers dengan auto-conversion
- Contact cards
- Location coordinates
- Links dengan preview
- Polls/voting

### Advanced Features:
- Disappearing messages
- View-once media
- Message reactions
- Group management
- Newsletter management
- Business profile management
- Privacy settings
- Device management

## 🔧 Technical Implementation Notes

### Multi-Tenant API Client Architecture:
```typescript
// Multi-tenant WhatsApp API Client dengan configurable endpoints
class WhatsAppApiClient {
  private tenantId: string;
  private apiBaseUrl: string;
  private apiKey: string;
  private webhookUrl: string;

  constructor(tenantConfig: TenantWhatsAppConfig) {
    this.tenantId = tenantConfig.tenantId;
    this.apiBaseUrl = tenantConfig.apiBaseUrl;
    this.apiKey = tenantConfig.apiKey;
    this.webhookUrl = tenantConfig.webhookUrl;
  }

  // App management
  async login(): Promise<LoginResponse>
  async loginWithCode(phone: string): Promise<LoginWithCodeResponse>
  async logout(): Promise<GenericResponse>
  async reconnect(): Promise<GenericResponse>
  async getDevices(): Promise<DeviceResponse>
  
  // User management
  async getUserInfo(phone: string): Promise<UserInfoResponse>
  async getUserAvatar(phone: string): Promise<UserAvatarResponse>
  async changeAvatar(avatar: File): Promise<GenericResponse>
  async changePushName(name: string): Promise<GenericResponse>
  
  // Messaging
  async sendMessage(params: SendMessageParams): Promise<SendResponse>
  async sendImage(params: SendImageParams): Promise<SendResponse>
  async sendAudio(params: SendAudioParams): Promise<SendResponse>
  async sendFile(params: SendFileParams): Promise<SendResponse>
  async sendSticker(params: SendStickerParams): Promise<SendResponse>
  async sendVideo(params: SendVideoParams): Promise<SendResponse>
  async sendContact(params: SendContactParams): Promise<SendResponse>
  async sendLink(params: SendLinkParams): Promise<SendResponse>
  async sendLocation(params: SendLocationParams): Promise<SendResponse>
  async sendPoll(params: SendPollParams): Promise<SendResponse>
}

// WhatsApp Service Factory untuk multi-tenant
class WhatsAppServiceFactory {
  private static clients: Map<string, WhatsAppApiClient> = new Map();

  static async getClient(tenantId: string): Promise<WhatsAppApiClient> {
    if (!this.clients.has(tenantId)) {
      const config = await this.getTenantWhatsAppConfig(tenantId);
      const client = new WhatsAppApiClient(config);
      this.clients.set(tenantId, client);
    }
    return this.clients.get(tenantId)!;
  }

  static async getTenantWhatsAppConfig(tenantId: string): Promise<TenantWhatsAppConfig> {
    // Fetch tenant-specific WhatsApp configuration from database
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { whatsappConfig: true }
    });
    
    return {
      tenantId,
      apiBaseUrl: tenant.whatsappConfig.apiBaseUrl,
      apiKey: tenant.whatsappConfig.apiKey,
      webhookUrl: tenant.whatsappConfig.webhookUrl,
      isActive: tenant.whatsappConfig.isActive
    };
  }
}

// Tenant WhatsApp Configuration Interface
interface TenantWhatsAppConfig {
  tenantId: string;
  apiBaseUrl: string;        // e.g., "https://tenant1-wa.example.com"
  apiKey: string;            // Tenant-specific API key
  webhookUrl: string;        // Tenant-specific webhook URL
  isActive: boolean;         // Whether WhatsApp is enabled for this tenant
  connectionStatus?: string; // connected, disconnected, error
  lastConnected?: Date;
  deviceInfo?: any;
}
```

### Database Schema Updates:
```sql
-- Tenant WhatsApp Configuration
model TenantWhatsAppConfig {
  id              String   @id @default(cuid())
  tenantId        String   @unique
  apiBaseUrl      String   // Tenant-specific WhatsApp API endpoint
  apiKey          String   // Encrypted API key
  webhookUrl      String   // Tenant-specific webhook URL
  webhookSecret   String?  // Webhook verification secret
  isActive        Boolean  @default(false)
  connectionStatus String  @default("disconnected") // connected, disconnected, error, setup
  lastConnected   DateTime?
  lastError       String?
  deviceInfo      Json?    // Device information
  settings        Json?    // Additional WhatsApp settings
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  devices         WhatsAppDevice[]
  
  @@map("tenant_whatsapp_configs")
}

-- Enhanced WhatsApp device management per tenant
model WhatsAppDevice {
  id              String   @id @default(cuid())
  tenantId        String
  configId        String   // Reference to TenantWhatsAppConfig
  deviceName      String
  phoneNumber     String
  status          String   @default("disconnected") // connected, disconnected, connecting
  connectionType  String   @default("qr") // qr, pairing_code
  pairingCode     String?
  qrCode          String?
  deviceInfo      Json?    // Device information
  lastSeen        DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  config          TenantWhatsAppConfig @relation(fields: [configId], references: [id], onDelete: Cascade)
  
  @@map("whatsapp_devices")
  @@unique([tenantId, phoneNumber])
}

-- Enhanced Message model with tenant routing
model Message {
  id              String   @id @default(cuid())
  conversationId  String
  tenantId        String   // For tenant isolation
  messageType     String   @default("text") // text, image, audio, video, file, sticker, contact, location, poll
  content         String
  mediaUrl        String?
  mediaMetadata   Json?    // Media-specific metadata
  pollData        Json?    // Poll questions and options
  replyToId       String?  // Reply to message ID
  isFromCustomer  Boolean  @default(true)
  isForwarded     Boolean  @default(false)
  viewOnce        Boolean  @default(false)
  disappearingDuration Int? // Disappearing message duration
  deliveryStatus  String   @default("sent") // sent, delivered, read, failed
  sentAt          DateTime @default(now())
  
  // Relations
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@map("messages")
  @@index([tenantId, sentAt])
}

-- Enhanced Tenant model with WhatsApp config reference
model Tenant {
  // ... existing fields
  whatsappConfig  TenantWhatsAppConfig?
  whatsappDevices WhatsAppDevice[]
  // ... other relations
}
```

## 🎯 Implementation Priority

### Phase 1 (Core Infrastructure):
- 8.1 WhatsApp MultiDevice API integration
- Basic messaging capabilities dari 8.2

### Phase 2 (Essential Features):
- 8.3 Chat inbox dan conversation management
- 8.5 Automated messaging system

### Phase 3 (Advanced Features):
- 8.4 User dan contact management
- 8.6 Advanced WhatsApp features

## 📚 Documentation Reference

Implementasi harus mengacu pada:
1. **OpenAPI Specification**: `doc/wadoc.md` - Complete API documentation
2. **Requirements**: Existing requirements 4.1-4.5 dan 10.2
3. **Database Schema**: Prisma schema untuk WhatsApp models
4. **Security**: Integration dengan security system yang sudah ada

## 🔧 Implementation Examples

### 1. Tenant WhatsApp Configuration Setup:
```typescript
// Setup WhatsApp for new tenant
async function setupTenantWhatsApp(tenantId: string, config: TenantWhatsAppSettings) {
  const whatsappConfig = await prisma.tenantWhatsAppConfig.create({
    data: {
      tenantId,
      apiBaseUrl: config.apiBaseUrl,
      apiKey: await SecurityService.encryptSensitiveData(config.apiKey),
      webhookUrl: `${process.env.BASE_URL}/api/webhooks/whatsapp/${tenantId}`,
      webhookSecret: SecurityService.generateSecureToken(),
      isActive: false, // Will be activated after successful connection
      connectionStatus: 'setup'
    }
  });

  return whatsappConfig;
}
```

### 2. Multi-Endpoint Message Sending:
```typescript
// Send message using tenant-specific endpoint
async function sendWhatsAppMessage(tenantId: string, params: SendMessageParams) {
  const client = await WhatsAppServiceFactory.getClient(tenantId);
  
  try {
    const result = await client.sendMessage(params);
    
    // Log message in tenant's conversation
    await prisma.message.create({
      data: {
        conversationId: params.conversationId,
        tenantId,
        messageType: 'text',
        content: params.message,
        isFromCustomer: false,
        deliveryStatus: result.success ? 'sent' : 'failed'
      }
    });

    return result;
  } catch (error) {
    // Handle endpoint-specific errors
    await handleWhatsAppError(tenantId, error);
    throw error;
  }
}
```

### 3. Webhook Routing per Tenant:
```typescript
// Webhook handler with tenant routing
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const tenantId = url.pathname.split('/').pop(); // Extract tenant ID from URL
  
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
  }

  // Verify webhook signature for this tenant
  const config = await prisma.tenantWhatsAppConfig.findUnique({
    where: { tenantId }
  });

  if (!config || !verifyWebhookSignature(request, config.webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Process webhook for specific tenant
  const webhookData = await request.json();
  await processWhatsAppWebhook(tenantId, webhookData);

  return NextResponse.json({ success: true });
}
```

### 4. Endpoint Health Monitoring:
```typescript
// Monitor WhatsApp endpoint health per tenant
async function monitorWhatsAppEndpoints() {
  const configs = await prisma.tenantWhatsAppConfig.findMany({
    where: { isActive: true }
  });

  for (const config of configs) {
    try {
      const client = await WhatsAppServiceFactory.getClient(config.tenantId);
      const devices = await client.getDevices();
      
      await prisma.tenantWhatsAppConfig.update({
        where: { id: config.id },
        data: {
          connectionStatus: devices.success ? 'connected' : 'disconnected',
          lastConnected: devices.success ? new Date() : config.lastConnected,
          lastError: devices.success ? null : devices.error
        }
      });
    } catch (error) {
      await prisma.tenantWhatsAppConfig.update({
        where: { id: config.id },
        data: {
          connectionStatus: 'error',
          lastError: error.message
        }
      });
    }
  }
}
```

## ✅ Benefits of Updated Multi-Endpoint Task Structure

1. **Multi-Tenant Isolation**: Setiap tenant memiliki WhatsApp integration yang terpisah
2. **Scalable Architecture**: Support untuk multiple WhatsApp API servers
3. **Flexible Configuration**: Tenant dapat menggunakan endpoint yang berbeda
4. **High Availability**: Failover dan backup endpoint support
5. **Performance Optimization**: Load balancing across multiple servers
6. **Compliance Ready**: Support untuk regional server requirements
7. **Enterprise Features**: Advanced monitoring dan analytics per tenant
8. **Cost Optimization**: Tenant dapat memilih server sesuai budget

Task 8 sekarang menjadi implementasi WhatsApp integration yang truly multi-tenant dan enterprise-ready, dengan support untuk multiple API endpoints sesuai kebutuhan masing-masing tenant.