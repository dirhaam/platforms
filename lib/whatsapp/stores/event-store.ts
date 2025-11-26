import { WhatsAppEvent } from '@/types/whatsapp';
import {
  kvExpire,
  kvGetList,
  kvPushToList,
} from '@/lib/cache/key-value-store';

export class EventStore {
  private static instance: EventStore;

  static getInstance(): EventStore {
    if (!EventStore.instance) {
      EventStore.instance = new EventStore();
    }
    return EventStore.instance;
  }

  async emit(event: WhatsAppEvent): Promise<void> {
    try {
      const eventKey = `whatsapp:events:${event.tenantId}`;
      await kvPushToList(eventKey, event, 1000);
      await kvExpire(eventKey, 3600); // 1 hour TTL

      const globalEventKey = 'whatsapp:events:global';
      await kvPushToList(globalEventKey, event, 10000);
    } catch (error) {
      console.error('Error emitting WhatsApp event:', error);
    }
  }

  async getByTenant(tenantId: string, limit = 100): Promise<WhatsAppEvent[]> {
    try {
      const eventKey = `whatsapp:events:${tenantId}`;
      const events = await kvGetList<WhatsAppEvent>(eventKey, 0, limit - 1);

      return events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
    } catch (error) {
      console.error('Error getting tenant events:', error);
      return [];
    }
  }
}
