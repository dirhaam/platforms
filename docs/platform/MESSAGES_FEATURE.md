# Messages Feature Documentation

## Overview

The Messages feature provides a complete WhatsApp conversation management interface integrated into the admin dashboard. It allows business owners and staff to view, manage, and respond to customer messages directly from the Booqing platform.

## Features

### 1. Conversation List
- **Real-time conversation history** - See all customer conversations
- **Search functionality** - Filter conversations by customer name or phone number
- **Unread message count** - Badge showing unread messages
- **Last message preview** - Quick view of the latest message
- **Status indicators** - Show if conversation is active or inactive
- **Time stamps** - Display when last message was received

### 2. Message Thread
- **Full message history** - Display complete conversation thread
- **Message status tracking** - Show if message is sent, delivered, or read
- **Sender identification** - Clear visual distinction between customer and staff messages
- **Message timestamps** - Precise timing for each message
- **Status icons** - Visual indicators for message delivery status

### 3. Send Messages
- **Rich text input** - Multi-line message composition area
- **Real-time sending** - Send messages with status tracking
- **Keyboard shortcuts** - Shift+Enter for new line, Enter to send
- **Error handling** - Clear error messages if send fails
- **Status updates** - See when message is delivered/read

### 4. Quick Reply Templates
Pre-defined message templates for common responses:
- **Booking Confirmed** - "Thank you! Your booking has been confirmed..."
- **Reminder** - "This is a reminder about your upcoming appointment..."
- **Follow Up** - "Thank you for visiting us! We hope you had a great experience..."
- **Cancellation** - "We understand. Your booking has been cancelled..."

### 5. Conversation Management
- **Archive** - Hide conversations from main list
- **Mute Notifications** - Disable alerts for specific conversations
- **Clear History** - Delete conversation history (optional)

## Database Schema

### Tables

#### `whatsapp_conversations`
```sql
id UUID PRIMARY KEY
tenant_id UUID (FK to tenants)
customer_id UUID (FK to customers)
phone VARCHAR(20) - Customer phone number
customer_name VARCHAR(255) - Display name
last_message TEXT - Preview of last message
last_message_time TIMESTAMP - When last message was sent
unread_count INTEGER - Number of unread messages
status VARCHAR(50) - 'active', 'archived', 'inactive'
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `whatsapp_messages`
```sql
id UUID PRIMARY KEY
conversation_id UUID (FK to conversations)
tenant_id UUID (FK to tenants)
content TEXT - Message content
type VARCHAR(50) - 'text', 'image', 'video', 'audio', etc
media_url TEXT - URL for media messages
is_from_me BOOLEAN - True if sent by staff
status VARCHAR(50) - 'sent', 'delivered', 'read', 'failed'
message_id VARCHAR(255) - WhatsApp message ID
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `whatsapp_message_templates`
```sql
id UUID PRIMARY KEY
tenant_id UUID (FK to tenants)
name VARCHAR(255) - Template name
label VARCHAR(100) - Display label in UI
content TEXT - Template message content
category VARCHAR(50) - Template category
is_active BOOLEAN - Whether template is in use
created_at TIMESTAMP
updated_at TIMESTAMP
```

## API Endpoints

### Get Conversations
```
GET /api/messages
Headers: x-tenant-id: {tenantId}
Query: ?type=conversations

Response:
{
  "conversations": [
    {
      "id": "uuid",
      "phone": "+62 812 1234567",
      "customer_name": "John Doe",
      "last_message": "Thank you for the booking!",
      "last_message_time": "2024-10-23T10:30:00Z",
      "unread_count": 0,
      "status": "active",
      "customer_id": "uuid"
    }
  ]
}
```

### Get Messages
```
GET /api/messages?type=messages&conversationId={conversationId}
Headers: x-tenant-id: {tenantId}

Response:
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "content": "Hello, I want to book an appointment",
      "type": "text",
      "is_from_me": false,
      "status": "read",
      "created_at": "2024-10-23T10:30:00Z"
    }
  ]
}
```

### Send Message
```
POST /api/messages
Headers: 
  x-tenant-id: {tenantId}
  Content-Type: application/json

Body:
{
  "conversationId": "uuid",
  "content": "Your message here",
  "type": "text" // optional
}

Response:
{
  "message": {
    "id": "uuid",
    "conversation_id": "uuid",
    "content": "Your message here",
    "type": "text",
    "is_from_me": true,
    "status": "sent",
    "created_at": "2024-10-23T10:35:00Z"
  }
}
```

## User Interface

### Page Location
`/admin/messages` - Accessible from admin dashboard

### Layout
```
┌─────────────────────────────────────────────┐
│          Messages Dashboard                  │
├──────────────────┬──────────────────────────┤
│                  │                          │
│  Conversations   │   Message Thread         │
│  List            │   ┌──────────────────┐  │
│  ┌────────────┐  │   │ Customer Message │  │
│  │ John Doe   │  │   └──────────────────┘  │
│  │ 2 hrs ago  │  │   ┌──────────────────┐  │
│  │            │  │   │ Your Message     │  │
│  │ Jane Smith │  │   └──────────────────┘  │
│  │ 5 hrs ago  │  │                        │
│  │ (2 new)    │  │   Message Input:       │
│  └────────────┘  │   ┌──────────────────┐  │
│                  │   │ Type message...  │  │
│                  │   │ [Send Button]    │  │
│                  │   └──────────────────┘  │
│                  │                        │
│                  │   Quick Replies:       │
│                  │   [Booking]  [Reminder]│
│                  │   [Follow]   [Cancel]  │
└──────────────────┴──────────────────────────┘
```

## Integration with WhatsApp

### WhatsApp Service
The messages feature integrates with the existing WhatsApp service (`lib/whatsapp/whatsapp-service.ts`):

```typescript
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

// Send message via WhatsApp
await whatsappService.sendMessage(
  tenantId,
  deviceId,
  phoneNumber,
  {
    type: 'text',
    content: messageContent
  }
);
```

### Webhook Integration
Incoming WhatsApp messages are received via webhooks and automatically stored in the database:

```
POST /api/whatsapp/webhook/{tenantId}/{endpointId}
```

### Message Flow
1. Customer sends WhatsApp message
2. Webhook receives message and stores in `whatsapp_messages` table
3. Staff receives notification in Messages UI
4. Staff views conversation and reply
5. Message sent via WhatsApp and stored in database
6. Customer receives message on WhatsApp

## Setup Instructions

### 1. Create Database Tables
Run the SQL migration file:
```sql
-- Execute create-tables.sql in Supabase SQL editor
-- Location: app/api/messages/create-tables.sql
```

### 2. Configure WhatsApp Integration
```typescript
// In your tenant settings
const config = await whatsappService.initializeTenant('tenant-id');
const endpoint = await whatsappService.addEndpoint('tenant-id', {
  name: 'Primary WhatsApp Server',
  apiUrl: 'https://api.whatsapp.example.com',
  webhookUrl: 'https://yourdomain.com/api/whatsapp/webhook/tenant-id/endpoint-id',
  // ... other config
});
```

### 3. Connect WhatsApp Device
```typescript
const device = await whatsappService.createDevice('tenant-id', endpoint.id, 'Device Name');
const connectionResult = await whatsappService.connectDevice(device.id);
// Scan QR code or use pairing code
```

### 4. Test Integration
- Send test message from admin dashboard
- Verify message appears in WhatsApp
- Send reply from WhatsApp
- Verify message appears in admin dashboard

## Security

### Row Level Security (RLS)
- Each tenant can only view/manage their own conversations and messages
- Enforced at database level with RLS policies
- Staff members see only conversations from their tenant

### Data Privacy
- No sensitive data in error messages
- Messages stored encrypted in database
- Phone numbers masked in API responses (optional)

### Access Control
- Only authenticated staff can access messages
- Based on tenant membership
- RBAC permissions can be added per role

## Future Enhancements

1. **Message Scheduling** - Schedule messages to send at specific times
2. **Bulk Messaging** - Send messages to multiple customers
3. **Message Broadcast** - Send promotional messages to customer segments
4. **Template Management** - Create and manage custom message templates
5. **Read Receipts** - Show when customer reads message
6. **Typing Indicator** - Show when customer is typing
7. **Media Support** - Send images, videos, documents
8. **Message Search** - Search across all conversation messages
9. **Message Export** - Export conversations as PDF/CSV
10. **Analytics** - Message statistics and trends

## Troubleshooting

### Messages Not Appearing
1. Check RLS policies are enabled
2. Verify tenant_id is correct
3. Ensure webhook is receiving messages
4. Check browser console for API errors

### Send Failed
1. Verify WhatsApp device is connected
2. Check API endpoint health
3. Review error message in console
4. Retry with smaller message

### Slow Performance
1. Check database indexes exist
2. Limit conversation history display
3. Implement pagination for large conversations
4. Use Redis caching for frequently accessed conversations

## Configuration

### Environment Variables
```env
# Messages feature configuration
MESSAGES_PAGE_SIZE=50
MESSAGES_CACHE_TTL=3600
MESSAGES_WEBHOOK_RETRY_COUNT=3
MESSAGES_WEBHOOK_TIMEOUT=30000
```

### Quick Reply Templates
Edit templates in `QUICK_REPLIES` constant in `content.tsx` or manage via database table.

## Support

For issues or questions about the messages feature:
1. Check this documentation
2. Review API endpoint errors
3. Check browser console logs
4. Check server logs for API errors
5. Verify WhatsApp service is running
6. Test webhook connectivity
