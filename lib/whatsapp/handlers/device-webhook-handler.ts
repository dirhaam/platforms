import { WhatsAppWebhookPayload } from '@/types/whatsapp';
import { WhatsAppDeviceManager } from '../device-manager';
import { EventStore } from '../stores/event-store';

export class DeviceWebhookHandler {
  private static instance: DeviceWebhookHandler;
  private deviceManager: WhatsAppDeviceManager;
  private eventStore: EventStore;

  constructor() {
    this.deviceManager = WhatsAppDeviceManager.getInstance();
    this.eventStore = EventStore.getInstance();
  }

  static getInstance(): DeviceWebhookHandler {
    if (!DeviceWebhookHandler.instance) {
      DeviceWebhookHandler.instance = new DeviceWebhookHandler();
    }
    return DeviceWebhookHandler.instance;
  }

  async handleDeviceStatus(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const statusData = payload.data;
      const deviceId = payload.deviceId;

      if (!deviceId) {
        console.warn('Device status webhook missing device ID');
        return;
      }

      switch (statusData.status) {
        case 'connected':
          await this.deviceManager.handleDeviceConnected(
            deviceId,
            statusData.phoneNumber
          );
          break;
        case 'disconnected':
          await this.deviceManager.handleDeviceDisconnected(deviceId);
          break;
        default:
          await this.deviceManager.updateDevice(deviceId, {
            status: statusData.status,
            lastSeen: new Date()
          });
      }
    } catch (error) {
      console.error('Error handling device status webhook:', error);
    }
  }

  async handleQRCode(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const qrData = payload.data;
      const deviceId = payload.deviceId;

      if (!deviceId || !qrData.qrCode) {
        console.warn('QR code webhook missing required data');
        return;
      }

      await this.deviceManager.updateDevice(deviceId, {
        qrCode: qrData.qrCode,
        status: 'pairing'
      });

      await this.eventStore.emit({
        type: 'qr_code_generated',
        tenantId: payload.tenantId,
        deviceId: deviceId,
        data: {
          qrCode: qrData.qrCode
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling QR code webhook:', error);
    }
  }

  async handlePairingCode(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const pairingData = payload.data;
      const deviceId = payload.deviceId;

      if (!deviceId || !pairingData.pairingCode) {
        console.warn('Pairing code webhook missing required data');
        return;
      }

      await this.deviceManager.updateDevice(deviceId, {
        pairingCode: pairingData.pairingCode,
        status: 'pairing'
      });

      await this.eventStore.emit({
        type: 'pairing_code_generated',
        tenantId: payload.tenantId,
        deviceId: deviceId,
        data: {
          pairingCode: pairingData.pairingCode
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling pairing code webhook:', error);
    }
  }

  async handleGroup(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      await this.eventStore.emit({
        type: 'message_received',
        tenantId: payload.tenantId,
        deviceId: payload.deviceId,
        data: {
          event: 'group',
          payload: payload.data,
        },
        timestamp: payload.timestamp,
      });
    } catch (error) {
      console.error('Error handling group webhook:', error);
    }
  }
}
