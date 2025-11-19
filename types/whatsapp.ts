// WhatsApp Integration Types

export interface WhatsAppEndpoint {
  id: string;
  tenantId: string;
  name: string;
  apiUrl: string;
  apiKey?: string;
  webhookUrl: string;
  webhookSecret: string;
  isActive: boolean;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppDevice {
  id: string;
  tenantId: string;
  endpointId: string;
  deviceName: string;
  phoneNumber?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'pairing' | 'error';
  qrCode?: string;
  pairingCode?: string;
  lastError?: string;
  lastSeen?: Date;
  sessionData?: string; // Encrypted session data
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

// Simplified: Each tenant has exactly ONE endpoint
export interface WhatsAppConfiguration {
  tenantId: string;
  endpoint: WhatsAppEndpoint;
  autoReconnect: boolean;
  reconnectInterval: number; // seconds
  healthCheckInterval: number; // seconds
  webhookRetries: number;
  messageTimeout: number; // seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppMessage {
  id: string;
  tenantId: string;
  deviceId: string;
  conversationId: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker';
  content: string;
  mediaUrl?: string;
  mediaCaption?: string;
  isFromCustomer: boolean;
  customerPhone: string;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

export interface WhatsAppConversation {
  id: string;
  tenantId: string;
  customerPhone: string;
  customerName?: string;
  lastMessageAt: Date;
  lastMessagePreview: string;
  unreadCount: number;
  assignedTo?: string; // staff member ID
  status: 'active' | 'archived' | 'blocked';
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppWebhookPayload {
  tenantId: string;
  endpointId: string;
  deviceId: string;
  event: 'message' | 'status' | 'device_status' | 'qr_code' | 'pairing_code' | 'group';
  data: Record<string, any>;
  timestamp: Date;
}

export interface WhatsAppHealthCheck {
  endpointId: string;
  tenantId: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  errorMessage?: string;
  checkedAt: Date;
}

export interface WhatsAppApiClient {
  sendMessage(deviceId: string, to: string, message: WhatsAppMessageData): Promise<WhatsAppMessage>;
  getDeviceStatus(deviceId: string): Promise<WhatsAppDevice>;
  getDevices(): Promise<WhatsAppDevice[]>;
  generateQRCode(deviceId: string): Promise<string>;
  generatePairingCode(deviceId: string, phone?: string): Promise<string>;
  disconnectDevice(deviceId: string): Promise<void>;
  getConversations(tenantId: string): Promise<WhatsAppConversation[]>;
  getMessages(conversationId: string, limit?: number): Promise<WhatsAppMessage[]>;
  markAsRead(messageId: string): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface WhatsAppMessageData {
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  content: string;
  mediaUrl?: string;
  caption?: string;
  filename?: string;
  fileData?: Uint8Array | ArrayBuffer;
  mimeType?: string;
}

export interface WhatsAppEndpointConfig {
  apiUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  headers?: Record<string, string>;
}

export interface WhatsAppSessionManager {
  saveSession(deviceId: string, sessionData: string): Promise<void>;
  loadSession(deviceId: string): Promise<string | null>;
  clearSession(deviceId: string): Promise<void>;
  isSessionValid(deviceId: string): Promise<boolean>;
}

export interface WhatsAppReconnectionStrategy {
  shouldReconnect(device: WhatsAppDevice): boolean;
  getReconnectDelay(attemptNumber: number): number;
  onReconnectSuccess(deviceId: string): Promise<void>;
  onReconnectFailure(deviceId: string, error: Error): Promise<void>;
}

export type WhatsAppEventType = 
  | 'device_connected'
  | 'device_disconnected'
  | 'message_received'
  | 'message_sent'
  | 'message_delivered'
  | 'message_read'
  | 'qr_code_generated'
  | 'pairing_code_generated'
  | 'endpoint_health_changed';

export interface WhatsAppEvent {
  type: WhatsAppEventType;
  tenantId: string;
  deviceId?: string;
  endpointId?: string;
  data: Record<string, any>;
  timestamp: Date;
}