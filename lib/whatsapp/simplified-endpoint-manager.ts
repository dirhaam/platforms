import {
  WhatsAppEndpoint,
  WhatsAppConfiguration,
  WhatsAppEndpointConfig,
} from '@/types/whatsapp';
import { WhatsAppClient } from './whatsapp-client';
import { kvGet, kvSet, kvDel } from '@/lib/cache/key-value-store';

/**
 * Simplified endpoint manager: 1 Tenant = 1 Endpoint
 * 
 * Architecture:
 * - Tenant A → Endpoint 1
 * - Tenant B → Endpoint 2
 * - Tenant C → Endpoint 3
 * (No primary/backup, no failover)
 */
export class WhatsAppEndpointManager {
  private static instance: WhatsAppEndpointManager;
  private clients: Map<string, WhatsAppClient> = new Map(); // key: tenantId
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map(); // key: tenantId

  static getInstance(): WhatsAppEndpointManager {
    if (!WhatsAppEndpointManager.instance) {
      WhatsAppEndpointManager.instance = new WhatsAppEndpointManager();
    }
    return WhatsAppEndpointManager.instance;
  }

  /**
   * Get configuration for a tenant (includes its single endpoint)
   */
  async getConfiguration(tenantId: string): Promise<WhatsAppConfiguration | null> {
    try {
      const configKey = `whatsapp:config:${tenantId}`;
      const rawConfig = await kvGet<WhatsAppConfiguration>(configKey);

      if (!rawConfig) {
        return null;
      }

      return {
        ...rawConfig,
        endpoint: {
          ...rawConfig.endpoint,
          createdAt: new Date(rawConfig.endpoint.createdAt),
          updatedAt: new Date(rawConfig.endpoint.updatedAt),
          lastHealthCheck: rawConfig.endpoint.lastHealthCheck ? new Date(rawConfig.endpoint.lastHealthCheck) : new Date(),
        },
        createdAt: new Date(rawConfig.createdAt),
        updatedAt: new Date(rawConfig.updatedAt),
      };
    } catch (error) {
      console.error('Error getting WhatsApp configuration:', error);
      return null;
    }
  }

  /**
   * Get endpoint for a specific tenant
   */
  async getEndpoint(tenantId: string): Promise<WhatsAppEndpoint | null> {
    const config = await this.getConfiguration(tenantId);
    return config?.endpoint || null;
  }

  /**
   * Set or update endpoint for a tenant (replaces existing if any)
   */
  async setEndpoint(tenantId: string, endpoint: Omit<WhatsAppEndpoint, 'createdAt' | 'updatedAt'>): Promise<WhatsAppEndpoint> {
    try {
      const config = await this.getConfiguration(tenantId) || {
        tenantId,
        autoReconnect: true,
        reconnectInterval: 30,
        healthCheckInterval: 60,
        webhookRetries: 3,
        messageTimeout: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newEndpoint: WhatsAppEndpoint = {
        ...endpoint,
        createdAt: endpoint.createdAt || new Date(),
        updatedAt: new Date(),
      };

      config.endpoint = newEndpoint;
      config.updatedAt = new Date();

      const configKey = `whatsapp:config:${tenantId}`;
      await kvSet(configKey, config);

      // Update client
      await this.invalidateClient(tenantId);
      await this.startHealthMonitoring(tenantId);

      return newEndpoint;
    } catch (error) {
      console.error('Error setting WhatsApp endpoint:', error);
      throw error;
    }
  }

  /**
   * Delete endpoint for a tenant
   */
  async deleteEndpoint(tenantId: string): Promise<void> {
    try {
      const configKey = `whatsapp:config:${tenantId}`;
      await kvDel(configKey);

      this.clients.delete(tenantId);
      await this.stopHealthMonitoring(tenantId);
    } catch (error) {
      console.error('Error deleting WhatsApp endpoint:', error);
      throw error;
    }
  }

  /**
   * Get WhatsApp client for a tenant
   * Since each tenant has exactly one endpoint, just return that endpoint's client
   */
  async getClient(tenantId: string): Promise<WhatsAppClient | null> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config?.endpoint || !config.endpoint.isActive) {
        return null;
      }

      // Check if client already exists
      if (this.clients.has(tenantId)) {
        return this.clients.get(tenantId) || null;
      }

      // Create new client for this tenant's endpoint
      const clientConfig: WhatsAppEndpointConfig = {
        apiUrl: config.endpoint.apiUrl,
        apiKey: config.endpoint.apiKey,
        timeout: config.messageTimeout * 1000,
        retries: config.webhookRetries,
      };

      const client = new WhatsAppClient(clientConfig, tenantId, config.endpoint.id);
      this.clients.set(tenantId, client);

      return client;
    } catch (error) {
      console.error('Error getting WhatsApp client:', error);
      return null;
    }
  }

  /**
   * Invalidate cached client
   */
  private async invalidateClient(tenantId: string): Promise<void> {
    this.clients.delete(tenantId);
  }

  /**
   * Start health monitoring for tenant's endpoint
   */
  private async startHealthMonitoring(tenantId: string): Promise<void> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config) return;

      // Clear existing interval if any
      if (this.healthCheckIntervals.has(tenantId)) {
        clearInterval(this.healthCheckIntervals.get(tenantId));
      }

      // Start new health check interval
      const interval = setInterval(async () => {
        await this.performHealthCheck(tenantId);
      }, config.healthCheckInterval * 1000);

      this.healthCheckIntervals.set(tenantId, interval);
    } catch (error) {
      console.error('Error starting health monitoring:', error);
    }
  }

  /**
   * Stop health monitoring for tenant
   */
  private async stopHealthMonitoring(tenantId: string): Promise<void> {
    if (this.healthCheckIntervals.has(tenantId)) {
      clearInterval(this.healthCheckIntervals.get(tenantId));
      this.healthCheckIntervals.delete(tenantId);
    }
  }

  /**
   * Perform health check for tenant's endpoint
   */
  private async performHealthCheck(tenantId: string): Promise<void> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config?.endpoint) return;

      const client = await this.getClient(tenantId);
      if (!client) {
        config.endpoint.healthStatus = 'unhealthy';
      } else {
        const isHealthy = await client.healthCheck();
        config.endpoint.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
      }

      config.endpoint.lastHealthCheck = new Date();
      config.updatedAt = new Date();

      const configKey = `whatsapp:config:${tenantId}`;
      await kvSet(configKey, config);
    } catch (error) {
      console.error(`Health check failed for tenant ${tenantId}:`, error);
      const config = await this.getConfiguration(tenantId);
      if (config?.endpoint) {
        config.endpoint.healthStatus = 'unhealthy';
        config.endpoint.lastHealthCheck = new Date();
        const configKey = `whatsapp:config:${tenantId}`;
        await kvSet(configKey, config);
      }
    }
  }

  /**
   * Test endpoint connectivity
   */
  async testEndpointHealth(tenantId: string): Promise<boolean> {
    try {
      const client = await this.getClient(tenantId);
      if (!client) return false;

      return await client.healthCheck();
    } catch (error) {
      console.error('Error testing endpoint health:', error);
      return false;
    }
  }

  /**
   * Initialize WhatsApp for a tenant (create empty config)
   */
  async initializeTenant(tenantId: string): Promise<void> {
    try {
      const existing = await this.getConfiguration(tenantId);
      if (existing) {
        return; // Already initialized
      }

      const configKey = `whatsapp:config:${tenantId}`;
      const config: WhatsAppConfiguration = {
        tenantId,
        endpoint: {
          id: '',
          tenantId,
          name: '',
          apiUrl: '',
          webhookUrl: '',
          webhookSecret: '',
          isActive: false,
          healthStatus: 'unknown',
          lastHealthCheck: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        autoReconnect: true,
        reconnectInterval: 30,
        healthCheckInterval: 60,
        webhookRetries: 3,
        messageTimeout: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await kvSet(configKey, config);
    } catch (error) {
      console.error('Error initializing tenant:', error);
      throw error;
    }
  }
}

export const whatsappEndpointManager = WhatsAppEndpointManager.getInstance();
