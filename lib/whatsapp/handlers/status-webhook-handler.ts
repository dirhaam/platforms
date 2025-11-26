import { WhatsAppMessage, WhatsAppWebhookPayload, WhatsAppEvent } from '@/types/whatsapp';
import { MessageStore } from '../stores/message-store';
import { EventStore } from '../stores/event-store';

export class StatusWebhookHandler {
  private static instance: StatusWebhookHandler;
  private messageStore: MessageStore;
  private eventStore: EventStore;

  constructor() {
    this.messageStore = MessageStore.getInstance();
    this.eventStore = EventStore.getInstance();
  }

  static getInstance(): StatusWebhookHandler {
    if (!StatusWebhookHandler.instance) {
      StatusWebhookHandler.instance = new StatusWebhookHandler();
    }
    return StatusWebhookHandler.instance;
  }

  async handle(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const statusSource = payload.data?.payload ? payload.data.payload : payload.data;
      const messageIds: string[] = Array.isArray(statusSource?.ids)
        ? statusSource.ids.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
        : [];

      const fallbackId = statusSource?.id || statusSource?.messageId || payload.data?.messageId || payload.data?.id;
      if (!messageIds.length && typeof fallbackId === 'string') {
        messageIds.push(fallbackId);
      }

      if (!messageIds.length) {
        console.warn('Status webhook missing message IDs');
        return;
      }

      const receiptType = statusSource?.receipt_type || statusSource?.status;
      let normalizedStatus: WhatsAppMessage['deliveryStatus'] = 'sent';
      if (receiptType === 'delivered') {
        normalizedStatus = 'delivered';
      } else if (receiptType === 'read') {
        normalizedStatus = 'read';
      }

      const timestamp = statusSource?.timestamp
        ? new Date(statusSource.timestamp)
        : payload.timestamp;

      await Promise.all(
        messageIds.map((id: string) => this.messageStore.updateStatus(id, normalizedStatus, timestamp))
      );

      const eventType: WhatsAppEvent['type'] =
        normalizedStatus === 'delivered'
          ? 'message_delivered'
          : normalizedStatus === 'read'
            ? 'message_read'
            : 'message_sent';

      await this.eventStore.emit({
        type: eventType,
        tenantId: payload.tenantId,
        deviceId: payload.deviceId,
        data: {
          messageIds,
          status: normalizedStatus,
          timestamp,
        },
        timestamp,
      });
    } catch (error) {
      console.error('Error handling status webhook:', error);
    }
  }
}
