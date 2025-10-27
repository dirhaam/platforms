# WhatsApp Integration - Quick Start Guide

This guide explains how to get WhatsApp messaging working in your platform.

## Current Status: ❌ Not Configured

If you see empty chats or "no messages" in the WhatsApp menu, it means the WhatsApp API endpoint is not configured.

## Step 1: Configure Your WhatsApp API Endpoint

### Option A: Using Environment Variables (All Environments)

Add `WHATSAPP_ENDPOINTS` to your `.env.local` (local development) or environment variables (Vercel/Production):

```bash
WHATSAPP_ENDPOINTS=[{"name":"primary","apiUrl":"http://wa.kosan.biz.id","username":"admin","password":"your_password_here"}]
```

### Option B: Using API Key Authentication

```bash
WHATSAPP_ENDPOINTS=[{"name":"primary","apiUrl":"https://your-api.example.com","apiKey":"your_api_key_here"}]
```

### Option C: Multiple Endpoints (Load Balancing/Fallback)

```bash
WHATSAPP_ENDPOINTS=[
  {"name":"primary","apiUrl":"http://wa.kosan.biz.id","username":"admin","password":"pass"},
  {"name":"secondary","apiUrl":"https://backup.example.com","apiKey":"backup_key"}
]
```

## Step 2: Apply Configuration

### For Local Development:
1. Edit `.env.local`
2. Add/update `WHATSAPP_ENDPOINTS` 
3. Restart Next.js dev server: `npm run dev`

### For Production (Vercel):
1. Go to Vercel Project Settings → Environment Variables
2. Add `WHATSAPP_ENDPOINTS` with the JSON configuration
3. Redeploy your project

## Step 3: Verify Configuration

### Check Server Logs
After restarting, you should see in console:
```
✓ Loaded 1 WhatsApp endpoints from ENV
[WhatsApp] Client found, calling getConversations...
[WhatsApp] Fetched X conversations from WhatsApp API
```

### If Configuration Missing
You'll see:
```
[WhatsApp] No WhatsApp client available for tenant {tenantId}.
[WhatsApp] Setup required: Configure WHATSAPP_ENDPOINTS env variable...
```

## Step 4: Assign Endpoint to Tenant

The endpoint is automatically available to all tenants. When a tenant navigates to the WhatsApp menu, it will:
1. Try to get cached conversations from database
2. If empty, fetch from WhatsApp API
3. Display in real-time as they arrive

## Step 5: Test Message Flow

### Sending a Message:
1. Go to Admin → Messages
2. Select or create a conversation
3. Type a message and click Send
4. Message should appear with "sent" status

### Receiving Messages:
1. Configure your WhatsApp API server to send webhooks to:
   ```
   https://your-domain.com/api/whatsapp/webhook/{tenantId}
   ```
2. When a customer replies, the message will appear automatically

## Common Issues & Troubleshooting

### "Empty Chats"
- Check `WHATSAPP_ENDPOINTS` is configured
- Verify the API URL is correct and reachable
- Check credentials (username/password or apiKey)

### "Failed to send message"
- Verify device is connected (see QR code/pairing code)
- Check message recipient phone number format
- Ensure WhatsApp API server is running

### "No incoming messages"
- Configure webhook URL in WhatsApp API server settings
- Check firewall allows webhooks from your provider
- Verify `{tenantId}` in webhook URL is correct

### "Network timeout"
- Increase `WHATSAPP_MESSAGE_TIMEOUT` environment variable
- Check network connectivity to WhatsApp API server
- Ensure API server is not under high load

## Environment Variables Reference

```env
# REQUIRED: WhatsApp API endpoints configuration
WHATSAPP_ENDPOINTS=[{"name":"primary","apiUrl":"http://wa.kosan.biz.id","username":"admin","password":"pass"}]

# Optional: Message timeout in seconds (default: 30)
WHATSAPP_MESSAGE_TIMEOUT=30

# Optional: Health check interval in seconds (default: 60)
WHATSAPP_HEALTH_CHECK_INTERVAL=60

# Optional: Webhook retry attempts (default: 3)
WHATSAPP_WEBHOOK_RETRIES=3

# Optional: Auto-reconnect on device disconnection (default: true)
WHATSAPP_AUTO_RECONNECT=true
```

## API Documentation

See `docs/whatsapp/wadoc.md` for full WhatsApp API documentation including:
- `/app/login` - Generate QR code
- `/app/login-with-code` - Pair device with code
- `/chats` - Get conversations
- `/chat/{chat_jid}/messages` - Get messages
- `/send/message` - Send message
- More endpoints for group management, status, etc.

## Next Steps

1. ✅ Configure `WHATSAPP_ENDPOINTS`
2. ✅ Restart your application
3. ✅ Visit WhatsApp menu and verify chats load
4. ✅ Send a test message
5. ✅ Configure webhook URL on WhatsApp API server
6. ✅ Test receiving messages

## Need Help?

- Check `WHATSAPP_INTEGRATION_GUIDE.md` for detailed setup
- Review `webhook-payload.md` for webhook payload structure
- Check console logs for detailed error messages
